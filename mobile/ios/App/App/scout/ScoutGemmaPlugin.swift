import Foundation
import Capacitor

/// iOS `ScoutGemma` Capacitor plugin — the Swift mirror of Android's
/// `ScoutGemmaPlugin`. Marshals isAvailable / describeModel / generate /
/// model-download calls to/from a `ScoutGemmaEngine`, and never talks to a model
/// runtime directly. Auto-registered by Capacitor via `CAPBridgedPlugin`.
///
/// Identical JS contract to Android (see capacitor-gemma-bridge.ts), so the
/// Svelte app and ModelRouter are unchanged across platforms.
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
    private lazy var engine: ScoutGemmaEngine = ScoutGemmaEngineFactory.create(store: store)
    private var downloader: ScoutModelDownloader?

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
        let engine = self.engine
        Task {
            do {
                let result = try await engine.generate(
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
        let downloader = ScoutModelDownloader(store: store)
        self.downloader = downloader
        Task {
            do {
                let status = try await downloader.download { [weak self] bytesDownloaded, totalBytes in
                    self?.notifyListeners(
                        "scoutModelDownloadProgress",
                        data: ["bytesDownloaded": bytesDownloaded, "totalBytes": totalBytes])
                }
                // Model is on device and verified — rebuild the engine so the
                // next isAvailable()/generate() picks it up.
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
        let active = downloader != nil
        downloader?.cancel()
        call.resolve(["cancelled": active])
    }
}
