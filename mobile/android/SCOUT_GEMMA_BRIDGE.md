# ScoutGemma Android bridge

On-device-only Scout engine for the Android build. No paid/cloud model APIs:
inference runs locally on the phone; the network is used only for field-pack /
data refresh (and, optionally, a one-time model file download).

## What exists now (skeleton)

JS already expects a Capacitor plugin named `ScoutGemma`:

- `mobile/src/lib/scout/capacitor-gemma-bridge.ts` reads
  `window.Capacitor.Plugins.ScoutGemma` and adapts it to `OnDeviceGemmaBridge`.
- `mobile/src/lib/scout/providers/on-device-gemma.ts` wraps that bridge; the
  `ModelRouter` only routes to it when `isAvailable()` resolves `true`, else it
  can use the deterministic fallback in normal builds. Gemma-only Play builds
  block chat when `isAvailable()` is false so they never drift into a paid/cloud
  model.

Native side (`app/src/main/java/com/hoggcountry/trailassistant/scout/`):

| File | Role |
|------|------|
| `ScoutGemmaPlugin.java` | `@CapacitorPlugin(name = "ScoutGemma")`. Marshals `isAvailable` / `describeModel` / `generate` to/from `ScoutGemmaEngine`. Registered in `MainActivity.java` via `registerPlugin(ScoutGemmaPlugin.class)` **before** `super.onCreate()`. |
| `ScoutGemmaEngine.java` | The boundary. The only place allowed to know about a model runtime. |
| `ScoutGemmaModelInfo.java` | Descriptor `{ tier, modelId, maxContextTokens }`, mirrors JS `GemmaModelDescriptor`. |
| `ScoutModelStore.java` | App-private model file/status boundary for first-run download, size checks, and SHA-256 verification. |
| `LiteRtScoutGemmaEngine.kt` | The real local engine, backed by LiteRT-LM (`com.google.ai.edge.litertlm`). Kotlin, because the LiteRT-LM API is Kotlin-first. Only activates when the model store reports a checksum-verified model; otherwise `tryCreate` returns `null`. |
| `ScoutGemmaUnavailableException.java` | Thrown when the engine can't generate → mapped to a Capacitor reject. Never fabricate output. |

The LiteRT-LM dependency (`litertlm-android`, pinned in `variables.gradle`) is
**enabled** — the runtime classes are on the classpath and the engine compiles
and links for real. Current default *runtime* behavior still falls back to
`UnavailableScoutGemmaEngine` (`isAvailable() == false`) because **no verified
model file is configured** (`ScoutModelSpec` has no URL/checksum yet, so
`ScoutModelStore` reports `unconfigured`). Honest behavior: the app builds and
runs, Gemma-only builds block chat until a model is installed and verified, and
nothing pretends a model is present.

### JS ⇄ native contract

```
isAvailable()  -> { available: boolean, modelId?, reason? }
describeModel() -> { tier, modelId, maxContextTokens, available? } | {}
generate({ prompt, systemContext, maxTokens }) -> { text, truncated }
getModelStatus() -> { modelId, state, downloadConfigured, checksumConfigured, expectedBytes, bytesOnDevice, reason? }
prepareModelDownload() -> { modelId, state, canDownload, destinationPath, expectedBytes, checksumConfigured, reason? }
```

`tier` must be one of `fast` | `balanced` | `small`. The JS bridge's
`isGemmaModelDescriptor` guard rejects descriptors with `available === false` or
missing fields, so a stub descriptor never gets treated as a real model.

## The remaining swap: configure a verified model

`ScoutGemmaPlugin#createEngine()` tries the LiteRT-LM engine first and falls back
to the stub otherwise:

```java
ScoutGemmaEngine createEngine() {
    ScoutGemmaEngine engine = LiteRtScoutGemmaEngine.tryCreate(getContext());
    return engine != null ? engine : new UnavailableScoutGemmaEngine();
}
```

`LiteRtScoutGemmaEngine.tryCreate(...)` returns `null` (never throws) unless
`ScoutModelStore` reports a checksum-verified model file on the device, so the app
degrades to the fallback instead of crashing. The engine code is complete; the
ONLY thing left to make it generate is to **configure and download a verified
model** (see "Model — exact steps" below). The heavy `Engine.initialize()` runs
lazily on the first `generate()`, and `ScoutGemmaPlugin` runs generation on a
background executor.

### Known gaps to close before go-live

- **Per-call `maxTokens` is not plumbed.** `LiteRtScoutGemmaEngine.generate()`
  uses the model's default decode limit; the `maxTokens` argument does not yet
  reach LiteRT-LM and `truncated` is always `false`. Plumb a per-request cap via
  `ConversationConfig` (or document the fixed cap) before relying on it.
- **No streaming yet.** Generation uses the synchronous `sendMessage`; swap to
  `sendMessageAsync(...) : Flow<Message>` to stream tokens into the UI.
- **Engine not closed on plugin teardown.** Each call uses a fresh `Conversation`
  (closed via `use {}`), but the long-lived `Engine` handle is only released when
  the process dies. Close it in a plugin `handleOnDestroy` if engines are ever
  recreated within a session.
- **Backend is the LiteRT-LM default.** `EngineConfig` is constructed with just
  `modelPath`; evaluate GPU/NPU (`Backend.GPU()`) vs CPU on real devices and pick
  per device class before go-live.

## Dependency — done

Decided 2026-06-17: **LiteRT-LM**, unified across Android and (later) iOS. The
"no Android Maven artifact" blocker is **resolved** — Google now publishes
`com.google.ai.edge.litertlm:litertlm-android` (stable `0.13.1` at time of
wiring). It is enabled in `app/build.gradle`, pinned via `litertlmVersion` in
`variables.gradle`. Local inference only; no hosted model.

```gradle
implementation "com.google.ai.edge.litertlm:litertlm-android:$litertlmVersion"
```

API (Kotlin-first), as used in `LiteRtScoutGemmaEngine.kt`:

```kotlin
import com.google.ai.edge.litertlm.Engine
import com.google.ai.edge.litertlm.EngineConfig

val engine = Engine(EngineConfig(modelPath = modelFile.absolutePath))
engine.initialize()                              // seconds — runs lazily/off-thread
engine.createConversation().use { conversation ->
    val text = conversation.sendMessage(input).text   // sync; or sendMessageAsync -> Flow<Message>
}
engine.close()
```

`minSdk` was bumped **23 → 24** (LiteRT-LM requirement) in `variables.gradle`.
The same `.litertlm` model file and the same `ScoutGemmaEngine` contract are
reused by the future iOS Swift plugin (LiteRT-LM Swift API), so the engine is
written once conceptually and mirrored per platform — that is what "unified"
means here.

Docs: https://developers.google.com/edge/litert-lm/android •
https://developers.google.com/edge/litert-lm/models/gemma-4

## Model — exact steps

- Target: Gemma 4 E2B / E4B class, int4-quantized, in `.litertlm` or another
  Android runtime-compatible format.
- Source: official Gemma / LiteRT model pages (Hugging Face `google/...`, Kaggle),
  gated by Gemma license acceptance. Docs:
  https://ai.google.dev/gemma/docs/core • https://ai.google.dev/gemma/docs/releases
- Do **not** commit model weights to the repo (size + license).

Delivery (the E2B LiteRT-LM model package is roughly 2.5 GB, too large for the base AAB):

1. **First-run download** to `context.getFilesDir()` over Wi-Fi, with a progress
   UI and resumable download. Simplest; keeps the AAB small. Downloading a model
   file is not "cloud model usage" — inference still runs on-device.
2. **Do not rely on Play Asset Delivery for the E2B file** unless the final model
   packaging proves it fits Play's asset-pack constraints. Treat first-run
   download as the current plan.

Update `ScoutGemmaModelInfo` (`tier`, `modelId`, real `maxContextTokens`) and the
plugin's `modelId` strings to match the chosen file once finalized.

Configure a real model package at build time with:

```sh
export SCOUT_GEMMA_MODEL_URL=https://...
export SCOUT_GEMMA_MODEL_SHA256=...
export SCOUT_GEMMA_MODEL_BYTES=2583000000
```

Without those values, `ScoutGemma.getModelStatus()` returns `state:
"unconfigured"` and `prepareModelDownload()` returns `canDownload: false`; the
app must keep chat blocked in Gemma-only builds.

## Validation

Engine wired, no model yet (today):
- `npm run check` in `mobile/` (svelte-check passes — JS contract intact).
- `npm run build` in `mobile/`, then `npx cap sync android`.
- Build the debug APK (`npm run android:debug-apk`) — confirms the Kotlin
  LiteRT-LM engine + Java plugin compile and link against `litertlm-android`.
- Runtime smoke on a device/emulator: open Scout, ask a question — it must answer
  with the Gemma-only blocked message, and `ScoutGemma.isAvailable()` returns
  `{ available: false, reason: ... }` (inspect via Chrome `chrome://inspect`
  webview console: `Capacitor.Plugins.ScoutGemma.isAvailable()`).

After configuring + downloading a verified model:
- Re-run the above; `isAvailable()` now `true`, `describeModel()` returns the real
  descriptor, and a Scout answer is produced on-device with the network disabled.
- Physical-device latency/first-load check per `docs/runbooks/play-store-submission.md`.
- Run the Scout reliability harness in API mode against the on-device engine
  (`docs/scout-reliability-runbook.md`) — an engine is not "supported" until it
  passes the easy slice.
