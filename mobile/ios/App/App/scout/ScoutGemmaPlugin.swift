import Foundation
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
        CAPPluginMethod(name: "cancelModelDownload", returnType: CAPPluginReturnPromise)
    ]

    private let store = ScoutModelStore()

    /// Serial queue that owns all reads and writes of `_engine` and `_downloader`.
    private let stateQueue = DispatchQueue(label: "com.hoggcountry.scoutgemma.state")

    // Backing storage — never accessed directly; always go through stateQueue.sync.
    private var _engine: ScoutGemmaEngine!
    private var _downloader: ScoutModelDownloader?

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
        Task {
            do {
                let status = try await dl.download { [weak self] bytesDownloaded, totalBytes in
                    self?.notifyListeners(
                        "scoutModelDownloadProgress",
                        data: ["bytesDownloaded": bytesDownloaded, "totalBytes": totalBytes])
                }
                // Model is on device and verified — rebuild the engine so the
                // next isAvailable()/generate() picks it up. Both writes are
                // through stateQueue.sync (inside the property setters).
                self.engine = ScoutGemmaEngineFactory.create(store: self.store)
                self.downloader = nil
                call.resolve(status.toDict())
            } catch {
                self.downloader = nil
                call.reject(error.localizedDescription)
            }
        }
    }

    @objc func cancelModelDownload(_ call: CAPPluginCall) {
        // Read + call under stateQueue to avoid racing startModelDownload's Task.
        stateQueue.sync {
            let active = _downloader != nil
            _downloader?.cancel()
            call.resolve(["cancelled": active])
        }
    }
}
