import Foundation

/// Native boundary for the on-device Gemma engine on iOS — the Swift mirror of
/// the Android `ScoutGemmaEngine` interface. This is the ONLY place that should
/// know about a model runtime (LiteRT-LM). `ScoutGemmaPlugin` talks to this
/// protocol and never to the runtime directly, so the JS contract in
/// `mobile/src/lib/scout/capacitor-gemma-bridge.ts` stays identical across
/// Android and iOS.
protocol ScoutGemmaEngine {
    /// True only when a runtime is loaded and model weights are usable.
    var isAvailable: Bool { get }

    /// The model this build targets. May return the target descriptor even when
    /// weights are absent (informational), or nil when nothing is configured.
    func describeModel() -> ScoutGemmaModelInfo?

    /// Runs a single on-device completion. Throws `ScoutGemmaError.unavailable`
    /// when the engine cannot generate — implementations must never return
    /// fabricated text.
    func generate(prompt: String, systemContext: String, maxTokens: Int) async throws -> GenerateResult
}

/// Mirrors the JS `generate()` return shape: `{ text, truncated }`.
struct GenerateResult {
    let text: String
    let truncated: Bool
}

/// Descriptor `{ tier, modelId, maxContextTokens }`, mirrors JS `GemmaModelDescriptor`.
struct ScoutGemmaModelInfo {
    let tier: String
    let modelId: String
    let maxContextTokens: Int
}

enum ScoutGemmaError: LocalizedError {
    case unavailable(String)

    var errorDescription: String? {
        switch self {
        case .unavailable(let message): return message
        }
    }
}

/// Default engine used until the LiteRT-LM Swift package is added and a verified
/// model is on the device. Honestly reports the model as unavailable and never
/// fabricates output, so Gemma-only builds block chat instead of using a
/// paid/cloud model. `describeModel()` still returns the target descriptor so
/// UI/telemetry can show what model this build is built around.
struct UnavailableScoutGemmaEngine: ScoutGemmaEngine {
    static let targetModel = ScoutGemmaModelInfo(
        tier: "balanced",
        modelId: "gemma-4-E2B-it-litert-lm",
        maxContextTokens: 128_000
    )

    var isAvailable: Bool { false }

    func describeModel() -> ScoutGemmaModelInfo? { Self.targetModel }

    func generate(prompt: String, systemContext: String, maxTokens: Int) async throws -> GenerateResult {
        throw ScoutGemmaError.unavailable(
            "On-device Gemma engine is not available in this build. Add the LiteRT-LM Swift package and download a verified Gemma 4 model file so the local runtime can load it."
        )
    }
}
