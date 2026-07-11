# iOS ScoutGemma bridge

On-device-only Scout engine for the iOS build — the Swift mirror of
`mobile/android/SCOUT_GEMMA_BRIDGE.md`. Inference runs locally on the phone via
LiteRT-LM; the network is used only for field-pack/data refresh and the one-time
model download. No paid/cloud model APIs.

## What exists now

Native Swift, in the App target (`mobile/ios/App/App/scout/`):

| File | Role |
|------|------|
| `ScoutGemmaPlugin.swift` | `@objc(ScoutGemmaPlugin)` Capacitor plugin (`CAPBridgedPlugin`, jsName `ScoutGemma`). Exposes `isAvailable` / `describeModel` / awaited `warmUp` / serialized `generate` / model-download methods and structured runtime readiness. Auto-registered by Capacitor. |
| `ScoutGemmaEngine.swift` | The `ScoutGemmaEngine` protocol + `UnavailableScoutGemmaEngine` fail-closed stub + value types. |
| `ScoutModelStore.swift` | `ScoutModelSpec` (HF model defaults, same file/size/SHA-256 as Android) + `ScoutModelStatus` + app-private store with streaming CryptoKit SHA-256 `verify()`. |
| `ScoutModelDownloader.swift` | Resumable `URLSessionDownloadTask` download → progress → `verify()`. Free-space precheck; resume data on interruption; fail-closed. |
| `LiteRtScoutGemmaEngine.swift` | The real engine, gated behind `#if canImport(LiteRTLM)`, plus `ScoutGemmaEngineFactory`. It uses a true LiteRT-LM system message, a native per-turn decode cap, streamed generation, and native cancellation after a 120-second timeout. |

The **JS contract is identical to Android** — `capacitor-gemma-bridge.ts`,
`ScoutModelManager`, the AccountTab download card, and `ModelRouter` are
cross-platform and need **no iOS-specific changes**.

Current first-load behavior: the LiteRT-LM runtime is linked, and
`ScoutGemma.getModelStatus()` reports `runtimeConfigured: true`,
`downloadConfigured: true`, and `exists: false` until the user downloads the
verified model. Gemma-only chat still blocks until the model file passes the
SHA-256 check — fail-closed, nothing fabricated.

`state: ready` describes the verified model file. Runtime readiness is reported
separately as `runtimeState` (`runtime_unavailable`, `model_missing`, `cold`,
`warming`, `ready`, or `failed`) plus `readyForInference`. Only an awaited,
successful `warmUp` or generation moves the runtime to `ready`.

The current iOS downloader is foreground-only (`URLSessionConfiguration.default`).
It can continue while the app remains alive, but it is not promised to survive
termination and may be suspended after locking/backgrounding. Native status
therefore reports `downloadBackgroundCapable: false`,
`downloadSurvivesAppTermination: false`, and `downloadRequiresAppActive: true`.
Keep the app open, on power, and preferably on Wi-Fi until verification finishes.

## Engine activation

The engine is wired through a local SwiftPM wrapper at
`mobile/ios/LiteRTLMVendor`. The wrapper vendors Google's LiteRT-LM 0.13.1 Swift
source files, keeps Google's binary artifact URLs/checksums unchanged, and removes
the package-level unsafe linker flag that Xcode refuses to consume from the
Capacitor app target. The App target owns the mandatory `-all_load` linker flag
instead.

For a device build, an Apple Developer Program enrollment is still required.

1. **Swift package.** The Xcode project references the local
   `../LiteRTLMVendor` package and links the `LiteRTLM` product into the **App**
   target. Do not switch back to the upstream remote package unless upstream drops
   its unsafe package linker setting; headless `xcodebuild` fails with
   `The package product 'LiteRTLM' cannot be used as a dependency of this target
   because it uses unsafe build flags.`
2. **Linker flag (mandatory).** LiteRT-LM's static lib registers backends via C++
   static initializers that the linker will strip without it. Add `-all_load`
   (or a `-force_load` of the LiteRT-LM static lib) to the App target's
   **Other Linker Flags** (`OTHER_LDFLAGS`). Symptom if missing: a runtime
   backend-registration crash on first inference.
3. **Deployment target.** `IPHONEOS_DEPLOYMENT_TARGET` and the Podfile platform
   are both iOS 15.0 because LiteRT-LM Swift requires iOS 15.
4. **API status — compile-verified 2026-06-17** against LiteRT-LM 0.13.x via a
   throwaway SwiftPM target (`swift build`, macOS), so the gated
   `#if canImport(LiteRTLM)` block does not have to wait for the in-app Xcode
   integration. Confirmed symbols: `try EngineConfig(modelPath:backend:cacheDir:)`
   (throwing; `backend: .cpu()`); **`Engine(engineConfig:)`** (NOTE the
   `engineConfig:` argument label — the first draft used `Engine(_:)` and it does
   not compile); `try await engine.initialize()`;
   `try await engine.createConversation()`;
   `try await conversation.sendMessage(Message("..."))`; `response.toString`.
   The app's `LiteRtScoutGemmaEngine.swift` already uses the verified forms.
   - CLI gotcha: the upstream LiteRT-LM package target carries an unsafe
     `-all_load` build flag, so keep using the local wrapper package unless this
     changes upstream.

## Model

Same as Android (`ScoutModelSpec.target()`): Gemma 4 E2B
(`litert-community/gemma-4-E2B-it-litert-lm`, Apache-2.0), 2,588,147,712 bytes,
SHA-256 `181938105e0eefd105961417e8da75903eacda102c4fce9ce90f50b97139a63c`,
first-run download to app-private Application Support (excluded from iCloud
backup), verified before load. Swap the URL to Forge/R2 later without changing
the checksum.

## Distribution gate

A **simulator** build needs nothing special (`CODE_SIGNING_ALLOWED=NO`). A build
on Dad's iPhone, TestFlight, or the App Store requires **Apple Developer Program
enrollment** (signing + provisioning) — this is the long pole for iOS and is
independent of the engine code.

## Validation

Engine wired:
- `xcodebuild -workspace App.xcworkspace -scheme App -sdk iphonesimulator -destination 'generic/platform=iOS Simulator' CODE_SIGNING_ALLOWED=NO build` should build the app with the `LiteRTLM` module imported into the `#if canImport` branch.
- App runs on a simulator; before the model is downloaded, `ScoutGemma.getModelStatus()` should report the model as missing or unverified rather than the runtime as unlinked.

After a verified model is present:
- `isAvailable()` is true, `describeModel()` returns the real descriptor, and a
  Scout answer is produced on-device with the network disabled.
- Use the Mac mini iPhone Simulator lane as the primary local iteration method:

  ```sh
  npm run eval:scout-local-ai:ios-sim-gemma -- --limit 3
  ```

  The command builds/syncs `mobile/`, builds and installs the iOS simulator app,
  triggers the hidden native eval probe, waits for the app to save the run JSON,
  writes `.scout-artifacts/scout-local-ai-runs/ios-sim-gemma-<run-id>.json`,
  and runs the device-run inspector. Use `--limit 10` for normal iteration and
  `--limit 100` before sending a TestFlight build to Dad for the final run.
  If you want to rate the simulator answers, import the saved artifact with the
  printed `npm run intake:scout-local-ai-device-run -- --allow-partial` command.
  That creates a diagnostic review packet without weakening the final
  TestFlight/iPhone proof gate.
- Run the Scout reliability harness in API mode against the on-device engine
  (`docs/scout-reliability-runbook.md`) before calling iOS Gemma "supported".
