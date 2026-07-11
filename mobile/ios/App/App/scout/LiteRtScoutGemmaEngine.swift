import Foundation

#if canImport(LiteRTLM)
import LiteRTLM

/// Independently resolves a native generation result exactly once. The LiteRT
/// stream may fail to finish even after cancellation; this gate lets the 120s
/// watchdog release the Capacitor call without waiting on that stuck stream.
private final class ScoutGemmaResultGate: @unchecked Sendable {
    private let lock = NSLock()
    private var continuation: CheckedContinuation<GenerateResult, Error>?
    private var result: Result<GenerateResult, Error>?
    private var tasks: [Task<Void, Never>] = []

    func install(_ continuation: CheckedContinuation<GenerateResult, Error>) {
        lock.lock()
        if let result = result {
            lock.unlock()
            continuation.resume(with: result)
            return
        }
        self.continuation = continuation
        lock.unlock()
    }

    func attach(_ tasks: Task<Void, Never>...) {
        lock.lock()
        if result != nil {
            lock.unlock()
            tasks.forEach { $0.cancel() }
            return
        }
        self.tasks.append(contentsOf: tasks)
        lock.unlock()
    }

    func resolve(_ result: Result<GenerateResult, Error>) {
        lock.lock()
        guard self.result == nil else {
            lock.unlock()
            return
        }
        self.result = result
        let continuation = self.continuation
        self.continuation = nil
        let tasks = self.tasks
        self.tasks.removeAll()
        lock.unlock()

        tasks.forEach { $0.cancel() }
        continuation?.resume(with: result)
    }
}

/// On-device Gemma 4 engine backed by LiteRT-LM's Swift API. Inference runs
/// entirely on the phone — no paid/cloud model APIs. The Swift mirror of
/// Android's `LiteRtScoutGemmaEngine`, against the same `.litertlm` model file
/// and the same `ScoutGemmaEngine` contract.
///
/// Compiled ONLY when the LiteRT-LM Swift package is present (`canImport`), so
/// the app builds green before the package is added. Verify these calls against
/// the installed package version when activating — the API is Early Preview
/// (see docs/runbooks/ios-scout-gemma-bridge.md).
///
/// iOS 15.0 minimum: LiteRT-LM Swift requires iOS 15; the project deployment
/// target is 14.0, so the class and its creation path are guarded with
/// @available / #available so iOS 14 devices cleanly fall back to the
/// UnavailableScoutGemmaEngine stub without a runtime crash.
@available(iOS 15.0, *)
final class LiteRtScoutGemmaEngine: ScoutGemmaEngine {
    private static let runtimeMaxNumTokens = 32_768
    private static let maxOutputTokensPerTurn = 2_048
    private static let generationTimeoutSeconds = 120

    private let modelPath: String
    private let cacheDir: String
    private let info: ScoutGemmaModelInfo
    private var engine: Engine?
    private var runtimePoisonedReason: String?

    private init(modelPath: String, cacheDir: String, info: ScoutGemmaModelInfo) {
        self.modelPath = modelPath
        self.cacheDir = cacheDir
        self.info = info
    }

    var isAvailable: Bool { true }

    func describeModel() -> ScoutGemmaModelInfo? { info }

    func warmUp() async throws {
        _ = try await ensureEngine()
    }

    func generate(prompt: String, systemContext: String, maxTokens: Int) async throws -> GenerateResult {
        do {
            let engine = try await ensureEngine()
            let outputTokenLimit = min(max(maxTokens, 1), Self.maxOutputTokensPerTurn)
            let trimmedSystemContext = systemContext.trimmingCharacters(in: .whitespacesAndNewlines)
            let conversationConfig = ConversationConfig(
                systemMessage: trimmedSystemContext.isEmpty
                    ? nil
                    : Message(trimmedSystemContext, role: .system),
                maxOutputTokens: outputTokenLimit)
            let conversation = try await engine.createConversation(with: conversationConfig)

			return try await generateBounded(
				conversation: conversation,
				prompt: prompt)
        } catch let honest as ScoutGemmaError {
            if case .timedOut = honest {
                runtimePoisonedReason =
                    "The previous Gemma turn timed out. Close and reopen Scout before trying local AI again."
            }
            throw honest
        } catch {
            // Never fabricate output: any runtime failure surfaces as unavailable.
            throw ScoutGemmaError.unavailable("On-device Gemma generation failed: \(Self.describeNativeError(error))")
        }
    }

    /// Runs one streamed turn with two independent native boundaries:
    /// ConversationConfig enforces the real LiteRT-LM decode-token limit, while
    /// Conversation.cancel() interrupts a wedged turn after the timeout or when
    /// the parent Swift task is cancelled. The plugin serializes calls into this
    /// method so LiteRT-LM never initializes or infers two turns at once.
	private func generateBounded(
		conversation: Conversation,
		prompt: String
	) async throws -> GenerateResult {
        let gate = ScoutGemmaResultGate()
        return try await withTaskCancellationHandler(
            operation: {
                try await withCheckedThrowingContinuation { continuation in
                    gate.install(continuation)

                    let generationTask = Task<Void, Never> {
                        do {
                            var text = ""
                            for try await chunk in conversation.sendMessageStream(
                                Message(prompt, role: .user)) {
                                text.append(chunk.toString)
                            }
                            if Task.isCancelled {
                                gate.resolve(.failure(ScoutGemmaError.cancelled))
                            } else {
                                // The native session enforces the exact decode cap,
                                // but its Swift stream exposes no finish reason.
                                gate.resolve(.success(GenerateResult(text: text, truncated: false)))
                            }
                        } catch {
                            gate.resolve(
                                .failure(Task.isCancelled ? ScoutGemmaError.cancelled : error))
                        }
                    }

                    let watchdogTask = Task<Void, Never> {
                        do {
                            try await Task.sleep(
                                nanoseconds: UInt64(Self.generationTimeoutSeconds) * 1_000_000_000)
                        } catch {
                            return
                        }
                        guard !Task.isCancelled else { return }
                        // Resolve first: even if the native cancel call wedges, the
                        // plugin lane and UI are released at the hard deadline.
                        gate.resolve(.failure(
                            ScoutGemmaError.timedOut(seconds: Self.generationTimeoutSeconds)))
                        try? conversation.cancel()
                    }
                    gate.attach(generationTask, watchdogTask)
                }
            },
            onCancel: {
                gate.resolve(.failure(ScoutGemmaError.cancelled))
                try? conversation.cancel()
            })
    }

    /// `initialize()` is heavy (seconds); run it lazily on the first generate.
    private func ensureEngine() async throws -> Engine {
        if let reason = runtimePoisonedReason {
            throw ScoutGemmaError.unavailable(reason)
        }
        if let engine = engine { return engine }
        // LiteRT-LM's default Gemma 4 E2B cache is 4K on this export. Request a
        // larger but phone-testable cache so Scout's long-context JS budget is
        // backed by the native runtime instead of only the model descriptor.
        let maxNumTokens = min(info.maxContextTokens, Self.runtimeMaxNumTokens)
        let config = try EngineConfig(
            modelPath: modelPath,
            backend: .cpu(),
            maxNumTokens: maxNumTokens,
            cacheDir: cacheDir)
        // Verified against the real LiteRT-LM 0.13.x Swift API: the initializer
        // takes the `engineConfig:` argument label (compile-checked via a scratch
        // SwiftPM target — see docs/runbooks/ios-scout-gemma-bridge.md).
        let created = Engine(engineConfig: config)
        try await created.initialize()
        engine = created
        return created
    }

    private static func describeNativeError(_ error: Error) -> String {
        let nsError = error as NSError
        if nsError.domain.isEmpty {
            return error.localizedDescription
        }
        return "\(error.localizedDescription) [domain=\(nsError.domain) code=\(nsError.code)]"
    }

    /// Returns the engine only when a checksum-verified model is on the device;
    /// nil otherwise so the plugin falls back to the fail-closed stub.
    static func tryCreate(store: ScoutModelStore) -> ScoutGemmaEngine? {
        guard store.status().state == ScoutModelStatus.ready else { return nil }
        let cacheDir = FileManager.default.urls(for: .cachesDirectory, in: .userDomainMask).first?.path
            ?? NSTemporaryDirectory()
        return LiteRtScoutGemmaEngine(
            modelPath: store.modelFileURL.path,
            cacheDir: cacheDir,
            info: UnavailableScoutGemmaEngine.targetModel
        )
    }
}
#endif

/// Builds the active engine. Tries the LiteRT-LM engine first when its package is
/// present and a verified model exists, otherwise returns the fail-closed stub —
/// so the plugin compiles and runs identically with or without the package.
/// The LiteRT branch is further guarded with `#available(iOS 15.0, *)` because
/// LiteRT-LM requires iOS 15 while the project deployment target is 14.0.
enum ScoutGemmaEngineFactory {
    static func create(store: ScoutModelStore) -> ScoutGemmaEngine {
        #if canImport(LiteRTLM)
        if #available(iOS 15.0, *) {
            if let engine = LiteRtScoutGemmaEngine.tryCreate(store: store) {
                return engine
            }
        }
        #endif
        return UnavailableScoutGemmaEngine()
    }
}
