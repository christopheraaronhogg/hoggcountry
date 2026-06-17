import Foundation

#if canImport(LiteRTLM)
import LiteRTLM

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
    private let modelPath: String
    private let cacheDir: String
    private let info: ScoutGemmaModelInfo
    private var engine: Engine?

    private init(modelPath: String, cacheDir: String, info: ScoutGemmaModelInfo) {
        self.modelPath = modelPath
        self.cacheDir = cacheDir
        self.info = info
    }

    var isAvailable: Bool { true }

    func describeModel() -> ScoutGemmaModelInfo? { info }

    func generate(prompt: String, systemContext: String, maxTokens: Int) async throws -> GenerateResult {
        let input = systemContext.isEmpty ? prompt : systemContext + "\n\n" + prompt
        do {
            let engine = try await ensureEngine()
            let conversation = try await engine.createConversation()
            let response = try await conversation.sendMessage(Message(input))
            // Per-call maxTokens is not yet plumbed; truncation can't be detected.
            return GenerateResult(text: response.toString, truncated: false)
        } catch {
            // Never fabricate output: any runtime failure surfaces as unavailable.
            throw ScoutGemmaError.unavailable("On-device Gemma generation failed: \(error.localizedDescription)")
        }
    }

    /// `initialize()` is heavy (seconds); run it lazily on the first generate.
    private func ensureEngine() async throws -> Engine {
        if let engine = engine { return engine }
        let config = try EngineConfig(modelPath: modelPath, backend: .cpu(), cacheDir: cacheDir)
        // Verified against the real LiteRT-LM 0.13.x Swift API: the initializer
        // takes the `engineConfig:` argument label (compile-checked via a scratch
        // SwiftPM target — see docs/runbooks/ios-scout-gemma-bridge.md).
        let created = Engine(engineConfig: config)
        try await created.initialize()
        engine = created
        return created
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
