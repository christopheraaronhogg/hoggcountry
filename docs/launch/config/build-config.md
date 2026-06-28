# Build & version config — submission readiness

Snapshot of the native build config as of 2026-06-28. Account-bound store
records, iOS signing/upload, and physical-device smoke proof are still separate.
Branch: `main`.

## Shared identity
- **Bundle ID:** `com.hoggcountry.trailassistant` (identical iOS + Android) ✓
- **Public name (in build):** "Trail Assistant" — store *display* name is a DECISION (see morning brief)
- **On-device model:** `gemma-4-E2B-it.litertlm`, 2,588,147,712 bytes (~2.59 GB), SHA-256 pinned, downloaded once at first run from Hugging Face. App fully functional without it.

## iOS (`mobile/ios/App`)
| Setting | Value | Status |
|---|---|---|
| MARKETING_VERSION | `1.0` | ✓ ready |
| CURRENT_PROJECT_VERSION (local build target) | `26` | live in Dad Pilot; latest-source upload/refresh proof recorded |
| Deployment target | iOS 15.0 | ✓ required by LiteRT-LM Swift |
| TARGETED_DEVICE_FAMILY | `1` (iPhone-only) | ✓ set tonight (was `1,2`; reversible decision) |
| NSLocationWhenInUseUsageDescription | present | ✓ |
| ITSAppUsesNonExemptEncryption | `false` | ✓ set tonight |
| PrivacyInfo.xcprivacy | created at `App/PrivacyInfo.xcprivacy` | ✓ referenced by the App target resource build phase |
| AppIcon (1024, no alpha) | brand emblem | ✓ generated |
| Launch screen / splash | brand emblem | ✓ generated |
| CODE_SIGN_STYLE | Debug automatic; Release manual App Store Connect profile | ✓ configured |
| DEVELOPMENT_TEAM | `3CFU9J87A5` | ✓ configured for Release uploads |
| Shared scheme for archiving | `xcshareddata/xcschemes/App.xcscheme` | ✓ `xcodebuild -list` shows the App scheme |
| LiteRT-LM Swift package (so Scout AI runs on iOS) | local `LiteRTLMVendor` wrapper linked into App | ✓ simulator build required before release |
| Local Xcode platform | iOS Simulator 26.3.1 available | ✓ simulator build/run verified |

## Android (`mobile/android`)
| Setting | Value | Status |
|---|---|---|
| applicationId | `com.hoggcountry.trailassistant` | ✓ |
| versionCode | `1` | ✓ |
| versionName | `1.0.0` | ✓ bumped tonight (was 0.1.0) |
| minSdk / target / compile | 24 / 35 / 35 | ✓ meets the current published Play API-35 requirement; re-check API-36 timing before final upload |
| Adaptive launcher icon + round + legacy | brand emblem, cream background | ✓ generated all densities |
| Splash drawables | brand emblem | ✓ generated |
| 16 KB native-lib alignment (LiteRT .so) | `p_align 0x4000` on all arm64 libs | ✓ **verified — passes Play's requirement** |
| foregroundServiceType=dataSync (model download) | declared in manifest | ✓ build-side; ⚠ needs a Play Console FGS declaration |
| LiteRT-LM Android runtime | wired Gradle dep `com.google.ai.edge.litertlm:litertlm-android` | ✓ AI runs on Android (pending on-device verification) |
| Release signing | env-gated (`HC_ANDROID_KEYSTORE_*`) | ✓ upload keystore generated outside git; signed AAB proof recorded |
| Location permission | `ACCESS_COARSE_LOCATION` + `ACCESS_FINE_LOCATION`, no background location | ✓ foreground, user-initiated GPS-to-mile snapping; raw GPS stays on-device |

## What this means
- **iOS** project-file blockers are cleared for the privacy manifest, shared scheme, LiteRT-LM package wiring, Release signing, and TestFlight archive/upload lane. Build `26` is live in Dad Pilot through the public TestFlight link, and App Store Connect reports it `VALID` with external state `IN_BETA_TESTING`. Scout AI still needs the full 100-question Eval Lab export on a real TestFlight iPhone before Dad-ready claims.
- **Android** can build a signed release AAB with the local upload keystore proof already recorded. Gemma and foreground GPS are wired in the native Android lane, but still need physical-device smoke proof before submission.
