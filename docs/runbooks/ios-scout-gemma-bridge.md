# iOS ScoutGemma bridge

On-device-only Scout engine for the iOS build — the Swift mirror of
`mobile/android/SCOUT_GEMMA_BRIDGE.md`. Inference runs locally on the phone via
LiteRT-LM; the network is used only for field-pack/data refresh and the one-time
model download. No paid/cloud model APIs.

## What exists now

Native Swift, in the App target (`mobile/ios/App/App/scout/`):

| File | Role |
|------|------|
| `ScoutGemmaPlugin.swift` | `@objc(ScoutGemmaPlugin)` Capacitor plugin (`CAPBridgedPlugin`, jsName `ScoutGemma`). Same methods as Android: `isAvailable` / `describeModel` / `generate` / `getModelStatus` / `prepareModelDownload` / `startModelDownload` / `cancelModelDownload`, streaming `scoutModelDownloadProgress` events. Auto-registered by Capacitor. |
| `ScoutGemmaEngine.swift` | The `ScoutGemmaEngine` protocol + `UnavailableScoutGemmaEngine` fail-closed stub + value types. |
| `ScoutModelStore.swift` | `ScoutModelSpec` (HF model defaults, same file/size/SHA-256 as Android) + `ScoutModelStatus` + app-private store with streaming CryptoKit SHA-256 `verify()`. |
| `ScoutModelDownloader.swift` | Resumable `URLSessionDownloadTask` download → progress → `verify()`. Free-space precheck; resume data on interruption; fail-closed. |
| `LiteRtScoutGemmaEngine.swift` | The real engine, gated behind `#if canImport(LiteRTLM)`, plus `ScoutGemmaEngineFactory`. Compiles ONLY when the LiteRT-LM Swift package is present, so the app builds green before it is added. |

The **JS contract is identical to Android** — `capacitor-gemma-bridge.ts`,
`ScoutModelManager`, the AccountTab download card, and `ModelRouter` are
cross-platform and need **no iOS-specific changes**.

Current behavior (no SPM package yet): `ScoutGemmaEngineFactory.create()` returns
`UnavailableScoutGemmaEngine`, so `isAvailable` is false and Gemma-only builds
block chat — fail-closed, nothing fabricated. The app compiles and runs on the
simulator without the package or an Apple account.

## Activating the engine — exact steps

These need Xcode (the SPM + linker steps are GUI-shaped) and, for a device build,
an Apple Developer Program enrollment.

1. **Add the Swift package.** Xcode → File → Add Package Dependencies →
   `https://github.com/google-ai-edge/LiteRT-LM`, rule **from 0.13.1**. Add the
   `LiteRTLM` product to the **App** target. (SPM coexists fine with the
   CocoaPods-managed Capacitor pods.) Min iOS is **15** (the package declares
   `.iOS(.v15)`), so the App target's deployment target must be ≥ 15.
   **Do this in the Xcode GUI, not headless `xcodebuild`** — verified 2026-06-17
   that adding the ref via the `xcodeproj` gem and resolving on the command line
   *hangs* on the `CLiteRTLM.xcframework` (~80 MB) binary target (process idle,
   `SourcePackages` stays empty). Xcode's GUI resolves the binary target reliably.
2. **Linker flag (mandatory).** LiteRT-LM's static lib registers backends via C++
   static initializers that the linker will strip without it. Add `-all_load`
   (or a `-force_load` of the LiteRT-LM static lib) to the App target's
   **Other Linker Flags** (`OTHER_LDFLAGS`). Symptom if missing: a runtime
   backend-registration crash on first inference.
3. **Deployment target.** Bump `IPHONEOS_DEPLOYMENT_TARGET` / Podfile `platform`
   to whatever the installed LiteRT-LM version requires (SPM will refuse to
   resolve otherwise). Our Swift uses only iOS 14-era APIs.
4. **Verify the API** in `LiteRtScoutGemmaEngine.swift` against the installed
   version — the Swift API is Early Preview. Confirm: `EngineConfig(modelPath:backend:cacheDir:)`
   is throwing; `Engine(_:)` init; `engine.initialize()`; `engine.createConversation()`;
   `conversation.sendMessage(Message(_:))`; and how the response exposes text
   (`response.toString` here). The `#if canImport(LiteRTLM)` block compiles once
   the package resolves; fix any symbol drift then.

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

Engine wired, no package (today):
- `xcodebuild -workspace App.xcworkspace -scheme App -sdk iphonesimulator -destination 'generic/platform=iOS Simulator' CODE_SIGNING_ALLOWED=NO build` → BUILD SUCCEEDED (the `#if canImport` engine block is excluded).
- App runs on a simulator; `ScoutGemma.isAvailable()` returns `{ available: false, reason: ... }` (Safari → Develop → Simulator → JS console).

After adding the package + a verified model:
- `isAvailable()` is true, `describeModel()` returns the real descriptor, and a
  Scout answer is produced on-device with the network disabled.
- Run the Scout reliability harness in API mode against the on-device engine
  (`docs/scout-reliability-runbook.md`) before calling iOS Gemma "supported".
