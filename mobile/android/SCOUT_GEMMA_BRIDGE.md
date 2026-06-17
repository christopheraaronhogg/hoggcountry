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
| `MediaPipeScoutGemmaEngine.java` | Reflection-gated local engine loader. It only activates when MediaPipe `tasks-genai` is on the classpath and the model store reports a checksum-verified model. |
| `ScoutGemmaUnavailableException.java` | Thrown when the engine can't generate → mapped to a Capacitor reject. Never fabricate output. |

Current default behavior still falls back to `UnavailableScoutGemmaEngine`, which
reports `isAvailable() == false`, because the MediaPipe dependency is not enabled
and no verified model is configured. Honest behavior: the app builds and runs,
Gemma-only builds block chat until a model is installed, and nothing pretends a
model is present.

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

## Making it real — the swap point

`ScoutGemmaPlugin#createEngine()` now tries a local runtime first and falls back
to the stub otherwise:

```java
ScoutGemmaEngine createEngine() {
    ScoutGemmaEngine engine = MediaPipeScoutGemmaEngine.tryCreate(getContext());
    return engine != null ? engine : new UnavailableScoutGemmaEngine();
}
```

`MediaPipeScoutGemmaEngine.tryCreate(...)` locates the verified model file,
reflectively initializes the MediaPipe LLM runtime, and returns `null` (not throw)
if the dependency or model is missing, so the app degrades to the fallback instead
of crashing.

### Known gaps to close before go-live

Intentional in the skeleton, but address these when the engine actually activates:

- **Per-call `maxTokens` is ignored.** The engine sets the token cap once at creation
  (`setMaxTokens` = target `maxContextTokens`); the `maxTokens` passed to `generate()`
  never reaches the runtime, and `truncated` is always `false`. Plumb per-request limits
  (or document the fixed cap) before relying on it.
- **Blocking generation / ANR risk.** `generateResponse(String)` is synchronous and can
  take seconds; run it off the main thread (or use the async/streaming API) so the
  Capacitor call can't trip an ANR.
- **No runtime teardown.** The reflected `LlmInference` handle is never closed; release it
  (it holds native resources) if engines are ever recreated.

## Dependency — exact steps

Pick ONE path (both are local inference; neither calls a hosted model):

### Path A — MediaPipe LLM Inference (Maven-available today, recommended first)

In `app/build.gradle` (commented stub already present):

```gradle
implementation "com.google.mediapipe:tasks-genai:0.10.24"
```

Engine sketch (API surface is version-dependent — verify against the installed
version):

```java
import com.google.mediapipe.tasks.genai.llminference.LlmInference;
import com.google.mediapipe.tasks.genai.llminference.LlmInference.LlmInferenceOptions;

LlmInferenceOptions options = LlmInferenceOptions.builder()
    .setModelPath(modelFile.getAbsolutePath())  // app-private file
    .setMaxTokens(maxTokens)
    .build();
LlmInference llm = LlmInference.createFromOptions(context, options);
String text = llm.generateResponse(systemContext + "\n\n" + prompt);
```

Blocker to check: `tasks-genai` typically requires **minSdk 24**; this module is
currently **23** (`variables.gradle`). Bump `minSdkVersion` to 24 when enabling.

### Path B — LiteRT-LM direct (forward path)

Google's cross-platform on-device LLM stack. Docs:
- https://ai.google.dev/edge/litert-lm
- https://ai.google.dev/edge/litert-lm/overview

As of now there is no broadly-published stable Android Gradle artifact for direct
app integration (distribution is mostly prebuilt binaries / C++). **This is the
"package availability" blocker** noted up front. Until that artifact ships, use
Path A (which itself runs on LiteRT under the hood). Re-evaluate when LiteRT-LM
publishes an Android Maven artifact.

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

Skeleton (today, no model):
- `npm run check` in `mobile/` (svelte-check passes — JS contract intact).
- `npm run build` in `mobile/`, then `npx cap sync android`.
- Build the debug APK (`npm run android:debug-apk`) — confirms the Java plugin
  compiles and registers.
- Runtime smoke on a device/emulator: open Scout, ask a question — it must answer
  with the Gemma-only blocked message, and `ScoutGemma.isAvailable()` returns
  `{ available: false, reason: ... }` (inspect via Chrome `chrome://inspect`
  webview console: `Capacitor.Plugins.ScoutGemma.isAvailable()`).

After wiring a real engine:
- Re-run the above; `isAvailable()` now `true`, `describeModel()` returns the real
  descriptor, and a Scout answer is produced on-device with the network disabled.
- Physical-device latency/first-load check per `docs/runbooks/play-store-submission.md`.
