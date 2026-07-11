import Foundation
import Network
import Capacitor
import UIKit

/// FIFO async gate for the heavy LiteRT-LM lane. Actor methods are re-entrant,
/// so a plain actor around `generate` is not enough: a second turn could enter
/// while the first awaits the native stream. This explicit acquire/release gate
/// keeps warm-up, lazy initialization, and complete turns strictly one-at-a-time.
private actor ScoutGemmaInferenceLane {
    private var busy = false
    private var waiters: [CheckedContinuation<Void, Never>] = []

    func run<T>(_ operation: () async throws -> T) async rethrows -> T {
        await acquire()
        defer { release() }
        return try await operation()
    }

    private func acquire() async {
        if !busy {
            busy = true
            return
        }
        await withCheckedContinuation { continuation in
            waiters.append(continuation)
        }
    }

    private func release() {
        if waiters.isEmpty {
            busy = false
        } else {
            waiters.removeFirst().resume()
        }
    }
}

private enum ScoutGemmaRuntimeState: String {
    case runtimeUnavailable = "runtime_unavailable"
    case modelMissing = "model_missing"
    case cold
    case warming
    case ready
    case failed
}

/// iOS `ScoutGemma` Capacitor plugin — the Swift mirror of Android's
/// `ScoutGemmaPlugin`. Marshals isAvailable / describeModel / generate /
/// model-download calls to/from a `ScoutGemmaEngine`, and never talks to a model
/// runtime directly. Auto-registered by Capacitor via `CAPBridgedPlugin`.
///
/// Identical JS contract to Android (see capacitor-gemma-bridge.ts), so the
/// Svelte app and ModelRouter are unchanged across platforms.
///
/// Thread safety: `engine` and `downloader` are mutable and accessed from both
/// the Capacitor thread and unstructured Tasks. All reads and writes of these
/// two properties are confined to `stateQueue` (a private serial
/// DispatchQueue) so there is no data race. `engine` is explicitly initialized
/// in `load()` (called once, serially, by Capacitor during plugin setup) rather
/// than via `lazy var`, which is not thread-safe.
@objc(ScoutGemmaPlugin)
public class ScoutGemmaPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "ScoutGemmaPlugin"
    public let jsName = "ScoutGemma"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "isAvailable", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "describeModel", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "warmUp", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "generate", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "getModelStatus", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "prepareModelDownload", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "startModelDownload", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "cancelModelDownload", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "getDownloadState", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "getNetworkStatus", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "getInstallSource", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "setEvalKeepAwake", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "getSimulatorEvalRequest", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "setSimulatorEvalResult", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "setSimulatorEvalDiagnostic", returnType: CAPPluginReturnPromise)
    ]

    private let store = ScoutModelStore()
    private let inferenceLane = ScoutGemmaInferenceLane()
    private static let simEvalTriggerDefaultsKey = "CapacitorStorage.hoggcountry:scout-gemma-sim-eval-probe:v1"
    private static let simEvalResultDefaultsKey = "CapacitorStorage.hoggcountry:scout-gemma-sim-eval-result:v1"
    private static let simEvalDiagnosticDefaultsKey = "CapacitorStorage.hoggcountry:scout-gemma-sim-eval-diagnostic:v1"

    /// Serial queue that owns all reads and writes of `_engine`, `_downloader`,
    /// `_lastProgress`, and the structured runtime-readiness snapshot.
    private let stateQueue = DispatchQueue(label: "com.hoggcountry.scoutgemma.state")

    // Backing storage — never accessed directly; always go through stateQueue.sync.
    private var _engine: ScoutGemmaEngine!
    private var _downloader: ScoutModelDownloader?
    // Last progress sample, so getDownloadState() can report a live download's
    // position (used by the JS reconcile-on-resume path).
    private var _lastProgress: (bytes: Int64, total: Int64)?
    private var _runtimeState = ScoutGemmaRuntimeState.runtimeUnavailable
    private var _runtimeReason: String?

    // MARK: - Thread-safe accessors

    private var engine: ScoutGemmaEngine {
        get { stateQueue.sync { _engine } }
        set { stateQueue.sync { _engine = newValue } }
    }

    private var downloader: ScoutModelDownloader? {
        get { stateQueue.sync { _downloader } }
        set { stateQueue.sync { _downloader = newValue } }
    }

    // MARK: - CAPPlugin lifecycle

    /// Called once by Capacitor on the main thread during plugin registration.
    /// Initialise the engine here rather than via `lazy var` (which is not
    /// thread-safe) so `_engine` is set before any plugin method can be called.
    public override func load() {
        _engine = ScoutGemmaEngineFactory.create(store: store)
        let modelStatus = store.status()
        if !runtimeConfigured() {
            _runtimeState = .runtimeUnavailable
            _runtimeReason = "Gemma 4 LiteRT-LM runtime is not linked in this iOS build."
        } else if modelStatus.state != ScoutModelStatus.ready {
            _runtimeState = .modelMissing
            _runtimeReason = "Gemma 4 model file is not downloaded and verified on this device."
        } else if _engine.isAvailable {
            _runtimeState = .cold
            _runtimeReason = "Gemma 4 is verified but the runtime has not been initialized on this launch."
        } else {
            _runtimeState = .failed
            _runtimeReason = "Gemma 4 runtime could not create an engine for the verified model."
        }
        #if DEBUG && targetEnvironment(simulator)
        if shouldRunSimulatorGemmaProbe() {
            runSimulatorGemmaProbe()
        }
        #endif
    }

    // MARK: - Plugin methods

    @objc func isAvailable(_ call: CAPPluginCall) {
        let available = engine.isAvailable
        var result = runtimeReadinessPayload()
        result["available"] = available
        if !available {
            let status = store.status()
            result["modelId"] = status.modelId
            result["modelState"] = status.state
            result["runtimeConfigured"] = runtimeConfigured()
            if !runtimeConfigured() {
                result["reason"] = "Gemma 4 LiteRT-LM runtime is not linked in this iOS build."
            } else if status.state != ScoutModelStatus.ready {
                result["reason"] = "Gemma 4 model file is not downloaded and verified on this device."
            } else {
                result["reason"] = "Gemma 4 runtime could not load the verified model."
            }
        }
        call.resolve(result)
    }

    @objc func describeModel(_ call: CAPPluginCall) {
        guard let info = engine.describeModel() else {
            var result = runtimeReadinessPayload()
            result["available"] = false
            result["modelId"] = "gemma-4-not-installed"
            call.resolve(result)
            return
        }
        var result = runtimeReadinessPayload()
        result["available"] = engine.isAvailable
        result["tier"] = info.tier
        result["modelId"] = info.modelId
        result["maxContextTokens"] = info.maxContextTokens
        call.resolve(result)
    }

    /// Actually awaits LiteRT-LM initialization. The previous cross-platform JS
    /// hook was already optional, so adding the native method is API-compatible.
    /// Failure resolves as a structured result (rather than claiming success),
    /// while generation itself still rejects on failure.
    @objc func warmUp(_ call: CAPPluginCall) {
        let capturedEngine = engine
        updateRuntimeState(.warming, reason: "Initializing Gemma 4 on this device.")
        Task {
            do {
                try await self.inferenceLane.run {
                    try await capturedEngine.warmUp()
                }
                self.updateRuntimeState(.ready, reason: nil)
                var result = self.runtimeReadinessPayload()
                result["warmed"] = true
                call.resolve(result)
            } catch {
                self.recordRuntimeFailure(error)
                var result = self.runtimeReadinessPayload()
                result["warmed"] = false
                result["errorCode"] = Self.nativeErrorCode(error)
                result["error"] = Self.describeNativeError(error)
                call.resolve(result)
            }
        }
    }

    @objc func generate(_ call: CAPPluginCall) {
        let prompt = call.getString("prompt") ?? ""
        let systemContext = call.getString("systemContext") ?? ""
        let maxTokens = call.getInt("maxTokens") ?? 512
        // Capture the engine via stateQueue.sync BEFORE the Task so the async
        // body never races against a post-download engine swap on stateQueue.
        let capturedEngine = engine
        beginRuntimeWork()
        Task {
            do {
                let result = try await self.inferenceLane.run {
                    try await capturedEngine.generate(
                        prompt: prompt, systemContext: systemContext, maxTokens: maxTokens)
                }
                self.updateRuntimeState(.ready, reason: nil)
                call.resolve(["text": result.text, "truncated": result.truncated])
            } catch {
                self.recordRuntimeFailure(error)
                call.reject(
                    Self.describeNativeError(error),
                    Self.nativeErrorCode(error),
                    error,
                    self.runtimeReadinessPayload())
            }
        }
    }

    @objc func getModelStatus(_ call: CAPPluginCall) {
        call.resolve(modelStatusPayload(store.status()))
    }

    @objc func prepareModelDownload(_ call: CAPPluginCall) {
        store.ensureModelDir()
        call.resolve(modelStatusPayload(store.status()))
    }

    @objc func startModelDownload(_ call: CAPPluginCall) {
        let dl = ScoutModelDownloader(store: store)
        downloader = dl
        // Resolve IMMEDIATELY with { started: true } — the JS bridge then waits on
        // the terminal listener events below (exactly like Android), instead of on
        // this call. (Resolving here and *also* on completion would hang JS.)
        var startResult = modelStatusPayload(store.status())
        startResult["started"] = true
        call.resolve(startResult)

        Task { [weak self] in
            guard let self = self else { return }
            do {
                let status = try await dl.download { [weak self] bytesDownloaded, totalBytes in
                    guard let self = self else { return }
                    self.stateQueue.sync { self._lastProgress = (bytesDownloaded, totalBytes) }
                    self.notifyListeners(
                        "scoutModelDownloadProgress",
                        data: ["bytesDownloaded": bytesDownloaded, "totalBytes": totalBytes])
                }
                // Model is on device and verified — rebuild the engine so the next
                // isAvailable()/generate() picks it up, then emit the terminal event.
                self.engine = ScoutGemmaEngineFactory.create(store: self.store)
                self.updateRuntimeState(
                    .cold,
                    reason: "Gemma 4 is verified and ready to initialize on this device.")
                self.clearDownload()
                self.notifyListeners("scoutModelDownloadComplete", data: self.modelStatusPayload(status))
            } catch {
                self.clearDownload()
                let nsError = error as NSError
                let cancelled = (nsError.domain == NSURLErrorDomain && nsError.code == NSURLErrorCancelled)
                    || error is CancellationError
                if cancelled {
                    // A user cancel is not an error — resolve the JS promise quietly.
                    self.notifyListeners("scoutModelDownloadCancelled", data: [:])
                } else {
                    self.notifyListeners(
                        "scoutModelDownloadError",
                        data: ["message": Self.describeNativeError(error)])
                }
            }
        }
    }

    @objc func cancelModelDownload(_ call: CAPPluginCall) {
        // Read + call under stateQueue to avoid racing startModelDownload's Task.
        // The download Task then throws cancelled and emits the terminal event.
        stateQueue.sync {
            let active = _downloader != nil
            _downloader?.cancel()
            call.resolve(["cancelled": active])
        }
    }

    /// Current download state for the JS reconcile-on-resume path. iOS uses a
    /// foreground URLSession that does not survive app termination, so after a
    /// relaunch this honestly reports inactive.
    @objc func getDownloadState(_ call: CAPPluginCall) {
        stateQueue.sync {
            // Always include numeric byte fields — the JS bridge treats them as
            // required. Before the first progress sample, report 0 / expected size.
            let progress = _lastProgress
            call.resolve([
                "active": _downloader != nil,
                "bytesDownloaded": progress?.bytes ?? 0,
                "totalBytes": progress?.total ?? store.spec.expectedSizeBytes,
                "backgroundCapable": false,
                "survivesAppTermination": false,
                "requiresAppActive": true
            ])
        }
    }

    @objc func getNetworkStatus(_ call: CAPPluginCall) {
        let monitor = NWPathMonitor()
        let queue = DispatchQueue(label: "com.hoggcountry.scoutgemma.network")
        var resolved = false

        func resolveOnce(_ path: NWPath) {
            guard !resolved else { return }
            resolved = true
            monitor.cancel()
            let payload = self.networkStatusPayload(for: path)
            DispatchQueue.main.async {
                call.resolve(payload)
            }
        }

        monitor.pathUpdateHandler = { path in
            queue.async {
                resolveOnce(path)
            }
        }
        monitor.start(queue: queue)

        queue.asyncAfter(deadline: .now() + 1.0) {
            resolveOnce(monitor.currentPath)
        }
    }

    @objc func getInstallSource(_ call: CAPPluginCall) {
        call.resolve(installSourcePayload())
    }

    @objc func setEvalKeepAwake(_ call: CAPPluginCall) {
        let active = call.getBool("active") ?? false
        DispatchQueue.main.async {
            UIApplication.shared.isIdleTimerDisabled = active
            call.resolve([
                "active": UIApplication.shared.isIdleTimerDisabled,
                "supported": true,
                "platform": "ios"
            ])
        }
    }

    @objc func getSimulatorEvalRequest(_ call: CAPPluginCall) {
        #if DEBUG && targetEnvironment(simulator)
        let payload = simulatorEvalRequestPayload()
        NSLog(
            "SCOUT_GEMMA_SIM_EVAL_BRIDGE request requested=%@ limit=%@ source=%@",
            (payload["requested"] as? Bool ?? false) ? "true" : "false",
            payload["limit"] as? String ?? "",
            payload["source"] as? String ?? "")
        call.resolve(payload)
        #else
        call.resolve(["requested": false, "source": "unavailable"])
        #endif
    }

    @objc func setSimulatorEvalResult(_ call: CAPPluginCall) {
        setSimulatorEvalPreference(call, key: Self.simEvalResultDefaultsKey)
    }

    @objc func setSimulatorEvalDiagnostic(_ call: CAPPluginCall) {
        setSimulatorEvalPreference(call, key: Self.simEvalDiagnosticDefaultsKey)
    }

    /// Clears the active downloader + progress under the state queue.
    private func clearDownload() {
        stateQueue.sync {
            _downloader = nil
            _lastProgress = nil
        }
    }

    private func runtimeConfigured() -> Bool {
        #if canImport(LiteRTLM)
        return true
        #else
        return false
        #endif
    }

    private func beginRuntimeWork() {
        stateQueue.sync {
            if _runtimeState != .ready {
                _runtimeState = .warming
                _runtimeReason = "Initializing Gemma 4 on this device."
            }
        }
    }

    private func updateRuntimeState(_ state: ScoutGemmaRuntimeState, reason: String?) {
        stateQueue.sync {
            _runtimeState = state
            _runtimeReason = reason
        }
    }

    private func recordRuntimeFailure(_ error: Error) {
        let status = store.status()
        let reason = Self.describeNativeError(error)
        if !runtimeConfigured() {
            updateRuntimeState(.runtimeUnavailable, reason: reason)
        } else if status.state != ScoutModelStatus.ready {
            updateRuntimeState(.modelMissing, reason: reason)
        } else {
            updateRuntimeState(.failed, reason: reason)
        }
    }

    private func runtimeReadinessPayload() -> [String: Any] {
        let snapshot = stateQueue.sync { (_runtimeState, _runtimeReason) }
        var payload: [String: Any] = [
            "runtimeConfigured": runtimeConfigured(),
            "runtimeState": snapshot.0.rawValue,
            "readyForInference": snapshot.0 == .ready
        ]
        if let reason = snapshot.1, !reason.isEmpty {
            payload["reason"] = reason
        }
        return payload
    }

    private static func describeNativeError(_ error: Error) -> String {
        let nsError = error as NSError
        var detail = error.localizedDescription
        if !nsError.domain.isEmpty {
            detail += " [domain=\(nsError.domain) code=\(nsError.code)]"
        }
        return detail
    }

    private static func nativeErrorCode(_ error: Error) -> String {
        if let scoutError = error as? ScoutGemmaError {
            return scoutError.code
        }
        return "SCOUT_GEMMA_GENERATION_FAILED"
    }

    #if DEBUG && targetEnvironment(simulator)
    private func simulatorEvalRequestPayload() -> [String: Any] {
        let process = ProcessInfo.processInfo
        if let limit = cleanSimulatorEvalLimit(process.environment["SCOUT_GEMMA_SIM_EVAL_LIMIT"]) {
            return ["requested": true, "limit": limit, "source": "env"]
        }

        let prefix = "--scout-gemma-sim-eval-limit="
        for argument in process.arguments where argument.hasPrefix(prefix) {
            let limit = String(argument.dropFirst(prefix.count))
            return ["requested": true, "limit": cleanSimulatorEvalLimit(limit) ?? "all", "source": "launch-arg"]
        }

        if process.arguments.contains("--scout-gemma-sim-eval") {
            let limit = UserDefaults.standard.string(forKey: Self.simEvalTriggerDefaultsKey) ?? "all"
            return ["requested": true, "limit": cleanSimulatorEvalLimit(limit) ?? "all", "source": "launch-arg-defaults"]
        }

        if let limit = cleanSimulatorEvalLimit(UserDefaults.standard.string(forKey: Self.simEvalTriggerDefaultsKey)) {
            UserDefaults.standard.removeObject(forKey: Self.simEvalTriggerDefaultsKey)
            return ["requested": true, "limit": limit, "source": "defaults"]
        }

        return ["requested": false, "source": "none"]
    }

    private func cleanSimulatorEvalLimit(_ value: String?) -> String? {
        guard let value = value else { return nil }
        let trimmed = value.trimmingCharacters(in: .whitespacesAndNewlines)
        return trimmed.isEmpty ? nil : trimmed
    }

    private func shouldRunSimulatorGemmaProbe() -> Bool {
        let process = ProcessInfo.processInfo
        return process.environment["SCOUT_GEMMA_SIM_PROBE"] == "1"
            || process.arguments.contains("--scout-gemma-sim-probe")
    }

    private func runSimulatorGemmaProbe() {
        let status = store.status()
        NSLog(
            "SCOUT_GEMMA_SIM_PROBE status state=%@ runtimeConfigured=%@ bytes=%lld expected=%lld file=%@",
            status.state,
            runtimeConfigured() ? "true" : "false",
            status.bytesOnDevice,
            status.expectedBytes,
            status.filePath)

        let capturedEngine = engine
        NSLog("SCOUT_GEMMA_SIM_PROBE engine available=%@", capturedEngine.isAvailable ? "true" : "false")
        if let info = capturedEngine.describeModel() {
            NSLog(
                "SCOUT_GEMMA_SIM_PROBE model tier=%@ id=%@ maxContextTokens=%d",
                info.tier,
                info.modelId,
                info.maxContextTokens)
        }

        Task {
            do {
                let result = try await self.inferenceLane.run {
                    try await capturedEngine.generate(
                        prompt: "Say READY in one word.",
                        systemContext: "You are Scout. This is an iOS Simulator Gemma smoke test.",
                        maxTokens: 16)
                }
                let preview = String(result.text.prefix(160))
                NSLog(
                    "SCOUT_GEMMA_SIM_PROBE generate ok truncated=%@ chars=%d preview=%@",
                    result.truncated ? "true" : "false",
                    result.text.count,
                    preview)
            } catch {
                NSLog("SCOUT_GEMMA_SIM_PROBE generate failed error=%@", error.localizedDescription)
            }
        }
    }
    #endif

    private func setSimulatorEvalPreference(_ call: CAPPluginCall, key: String) {
        #if DEBUG && targetEnvironment(simulator)
        guard let value = call.getString("value") else {
            call.reject("Must provide a value")
            return
        }
        NSLog("SCOUT_GEMMA_SIM_EVAL_BRIDGE write key=%@ chars=%d", key, value.count)
        UserDefaults.standard.set(value, forKey: key)
        UserDefaults.standard.synchronize()
        call.resolve(["ok": true])
        #else
        call.resolve(["ok": false])
        #endif
    }

    private func modelStatusPayload(_ status: ScoutModelStatus) -> [String: Any] {
        var payload = status.toDict()
        for (key, value) in runtimeReadinessPayload() {
            payload[key] = value
        }
        // iOS currently uses URLSessionConfiguration.default. Be explicit in
        // the native payload so shared UI can never infer Android foreground-
        // service semantics for this build.
        payload["downloadBackgroundCapable"] = false
        payload["downloadSurvivesAppTermination"] = false
        payload["downloadRequiresAppActive"] = true
        return payload
    }

    private func networkStatusPayload(for path: NWPath) -> [String: Any] {
        let connected = path.status == .satisfied
        let type: String
        if !connected {
            type = "none"
        } else if path.usesInterfaceType(.wifi) {
            type = "wifi"
        } else if path.usesInterfaceType(.cellular) {
            type = "cellular"
        } else if path.usesInterfaceType(.wiredEthernet) {
            type = "ethernet"
        } else {
            type = "other"
        }

        return [
            "connected": connected,
            "metered": path.isExpensive,
            "type": type
        ]
    }

    private func installSourcePayload() -> [String: Any] {
        let receiptURL = Bundle.main.appStoreReceiptURL
        let receiptLastPathComponent = receiptURL?.lastPathComponent
        let debugBuild: Bool
        let buildConfiguration: String
        #if DEBUG
        debugBuild = true
        buildConfiguration = "debug"
        #else
        debugBuild = false
        buildConfiguration = "release"
        #endif

        let type: String
        #if DEBUG
        type = "debug"
        #else
        if receiptLastPathComponent == "sandboxReceipt" {
            type = "testflight"
        } else if receiptURL != nil {
            type = "app-store"
        } else {
            type = "unknown"
        }
        #endif

        var payload: [String: Any] = [
            "type": type,
            "platform": "ios",
            "detectedBy": "ios-app-store-receipt",
            "receiptPresent": receiptURL != nil,
            "debugBuild": debugBuild,
            "buildConfiguration": buildConfiguration
        ]
        if let receiptLastPathComponent = receiptLastPathComponent {
            payload["receiptLastPathComponent"] = receiptLastPathComponent
        } else {
            payload["receiptLastPathComponent"] = NSNull()
        }
        if let sourceBuild = bundledSourceBuild() {
            payload["sourceBuild"] = sourceBuild
        }
        return payload
    }

    /// Read the fingerprint from the installed application bundle. Do not fetch
    /// it through the WebView: on the first launch after an update, an older
    /// controlling service worker can briefly serve its previous precache.
    private func bundledSourceBuild() -> String? {
        var candidates: [URL] = []
        if let url = Bundle.main.url(
            forResource: "app-version", withExtension: "json", subdirectory: "public") {
            candidates.append(url)
        }
        if let resourceURL = Bundle.main.resourceURL {
            candidates.append(resourceURL.appendingPathComponent("public/app-version.json"))
        }

        for url in candidates {
            guard let data = try? Data(contentsOf: url),
                  let object = try? JSONSerialization.jsonObject(with: data),
                  let manifest = object as? [String: Any],
                  let sourceBuild = manifest["sourceBuild"] as? String else { continue }
            let trimmed = sourceBuild.trimmingCharacters(in: .whitespacesAndNewlines)
            if !trimmed.isEmpty { return trimmed }
        }
        return nil
    }
}
