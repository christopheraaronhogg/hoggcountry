# Build & version config — submission readiness

Snapshot of the native build config as prepped tonight (everything short of the
account-bound signing/upload). Branch: `scout-redesign`.

## Shared identity
- **Bundle ID:** `com.hoggcountry.trailassistant` (identical iOS + Android) ✓
- **Public name (in build):** "Trail Assistant" — store *display* name is a DECISION (see morning brief)
- **On-device model:** `gemma-4-E2B-it.litertlm`, 2,588,147,712 bytes (~2.59 GB), SHA-256 pinned, downloaded once at first run from Hugging Face. App fully functional without it.

## iOS (`mobile/ios/App`)
| Setting | Value | Status |
|---|---|---|
| MARKETING_VERSION | `1.0` | ✓ ready |
| CURRENT_PROJECT_VERSION (build) | `1` | ✓ ready |
| Deployment target | iOS 14.0 | ✓ |
| TARGETED_DEVICE_FAMILY | `1` (iPhone-only) | ✓ set tonight (was `1,2`; reversible decision) |
| NSLocationWhenInUseUsageDescription | present | ✓ |
| ITSAppUsesNonExemptEncryption | `false` | ✓ set tonight |
| PrivacyInfo.xcprivacy | created at `App/PrivacyInfo.xcprivacy` | ⚠ **must be added to the App target in Xcode** (Add Files → check "App") |
| AppIcon (1024, no alpha) | brand emblem | ✓ generated |
| Launch screen / splash | brand emblem | ✓ generated |
| CODE_SIGN_STYLE | Automatic | — needs DEVELOPMENT_TEAM (Chris's account) |
| DEVELOPMENT_TEAM | unset | ⛔ **Chris** (Apple Developer account) |
| Shared scheme for archiving | none in `xcshareddata/xcschemes` | ⚠ in Xcode: Product → Scheme → Manage Schemes → check "Shared" for "App" |
| LiteRT-LM Swift package (so Scout AI runs on iOS) | not added | ⛔ **needs Xcode GUI** on Chris's Mac (see runbook `docs/runbooks/ios-scout-gemma-bridge.md`) |

## Android (`mobile/android`)
| Setting | Value | Status |
|---|---|---|
| applicationId | `com.hoggcountry.trailassistant` | ✓ |
| versionCode | `1` | ✓ |
| versionName | `1.0.0` | ✓ bumped tonight (was 0.1.0) |
| minSdk / target / compile | 24 / 35 / 35 | ✓ meets Play's API-35 requirement |
| Adaptive launcher icon + round + legacy | brand emblem, cream background | ✓ generated all densities |
| Splash drawables | brand emblem | ✓ generated |
| 16 KB native-lib alignment (LiteRT .so) | `p_align 0x4000` on all arm64 libs | ✓ **verified — passes Play's requirement** |
| foregroundServiceType=dataSync (model download) | declared in manifest | ✓ build-side; ⚠ needs a Play Console FGS declaration |
| LiteRT-LM Android runtime | wired Gradle dep `com.google.ai.edge.litertlm:litertlm-android` | ✓ AI runs on Android (pending on-device verification) |
| Release signing | env-gated (`HC_ANDROID_KEYSTORE_*`) | ⛔ **needs an upload keystore** (Chris owns the secret) |
| Location permission | absent | known gap — geolocation no-ops on Android; not a blocker (app works without it) |

## What this means
- **iOS** archives once a team is set + the privacy manifest is added to the target + the scheme is shared. Scout AI ships as a graceful stub on iOS until the LiteRT Swift package is wired.
- **Android** builds a signed release AAB as soon as an upload keystore exists; AI already runs.
