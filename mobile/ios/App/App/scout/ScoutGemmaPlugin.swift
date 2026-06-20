import Foundation
import Network
import Capacitor

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
        CAPPluginMethod(name: "generate", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "getModelStatus", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "prepareModelDownload", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "startModelDownload", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "cancelModelDownload", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "getDownloadState", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "getNetworkStatus", returnType: CAPPluginReturnPromise)
    ]

    private let store = ScoutModelStore()

    /// Serial queue that owns all reads and writes of `_engine`, `_downloader`,
    /// and `_lastProgress`.
    private let stateQueue = DispatchQueue(label: "com.hoggcountry.scoutgemma.state")

    // Backing storage — never accessed directly; always go through stateQueue.sync.
    private var _engine: ScoutGemmaEngine!
    private var _downloader: ScoutModelDownloader?
    // Last progress sample, so getDownloadState() can report a live download's
    // position (used by the JS reconcile-on-resume path).
    private var _lastProgress: (bytes: Int64, total: Int64)?

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
    }

    // MARK: - Plugin methods

    @objc func isAvailable(_ call: CAPPluginCall) {
        let available = engine.isAvailable
        var result: [String: Any] = ["available": available]
        if !available {
            result["modelId"] = "gemma-4-not-installed"
            result["reason"] = "Gemma 4 LiteRT-LM runtime is not installed in this iOS build."
        }
        call.resolve(result)
    }

    @objc func describeModel(_ call: CAPPluginCall) {
        guard let info = engine.describeModel() else {
            call.resolve([
                "available": false,
                "modelId": "gemma-4-not-installed",
                "reason": "Gemma 4 LiteRT-LM runtime is not installed in this iOS build."
            ])
            return
        }
        call.resolve([
            "available": engine.isAvailable,
            "tier": info.tier,
            "modelId": info.modelId,
            "maxContextTokens": info.maxContextTokens
        ])
    }

    @objc func generate(_ call: CAPPluginCall) {
        let prompt = call.getString("prompt") ?? ""
        let systemContext = call.getString("systemContext") ?? ""
        let maxTokens = call.getInt("maxTokens") ?? 512
        // Capture the engine via stateQueue.sync BEFORE the Task so the async
        // body never races against a post-download engine swap on stateQueue.
        let capturedEngine = engine
        Task {
            do {
                let result = try await capturedEngine.generate(
                    prompt: prompt, systemContext: systemContext, maxTokens: maxTokens)
                call.resolve(["text": result.text, "truncated": result.truncated])
            } catch {
                call.reject(error.localizedDescription)
            }
        }
    }

    @objc func getModelStatus(_ call: CAPPluginCall) {
        call.resolve(store.status().toDict())
    }

    @objc func prepareModelDownload(_ call: CAPPluginCall) {
        store.ensureModelDir()
        call.resolve(store.status().toDict())
    }

    @objc func startModelDownload(_ call: CAPPluginCall) {
        let dl = ScoutModelDownloader(store: store)
        downloader = dl
        // Resolve IMMEDIATELY with { started: true } — the JS bridge then waits on
        // the terminal listener events below (exactly like Android), instead of on
        // this call. (Resolving here and *also* on completion would hang JS.)
        var startResult = store.status().toDict()
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
                self.clearDownload()
                self.notifyListeners("scoutModelDownloadComplete", data: status.toDict())
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
                        data: ["message": error.localizedDescription])
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
                "totalBytes": progress?.total ?? store.spec.expectedSizeBytes
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

    /// Clears the active downloader + progress under the state queue.
    private func clearDownload() {
        stateQueue.sync {
            _downloader = nil
            _lastProgress = nil
        }
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
}
