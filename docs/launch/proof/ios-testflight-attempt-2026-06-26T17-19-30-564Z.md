# iOS TestFlight lane attempt and recovery

Checked at: 2026-06-26T17:20:05.252Z
Repo SHA: see repo-sha log
Status: verified after API-key upload recovery
Output directory: .scout-artifacts/ios-testflight/2026-06-26T17-19-30-564Z

## Mode

- Upload: yes
- Archive only: no
- Internal TestFlight only: no
- Team override provided: no
- Provisioning profile: Hoggcountry App Store Connect
- App Store Connect API key provided: no

## Steps

- pass repo-sha (exit 0): .scout-artifacts/ios-testflight/2026-06-26T17-19-30-564Z/01-repo-sha.log
- pass xcode-version (exit 0): .scout-artifacts/ios-testflight/2026-06-26T17-19-30-564Z/02-xcode-version.log
- pass codesigning-identities (exit 0): .scout-artifacts/ios-testflight/2026-06-26T17-19-30-564Z/03-codesigning-identities.log
- pass provisioning-profiles (exit 0): .scout-artifacts/ios-testflight/2026-06-26T17-19-30-564Z/04-provisioning-profiles.log
- pass release-build-settings (exit 0): .scout-artifacts/ios-testflight/2026-06-26T17-19-30-564Z/05-release-build-settings.log
- pass ios-signing-readiness (exit 0): .scout-artifacts/ios-testflight/2026-06-26T17-19-30-564Z/06-ios-signing-readiness.log
- pass mobile-check (exit 0): .scout-artifacts/ios-testflight/2026-06-26T17-19-30-564Z/07-mobile-check.log
- pass mobile-test (exit 0): .scout-artifacts/ios-testflight/2026-06-26T17-19-30-564Z/08-mobile-test.log
- pass capacitor-sync-ios (exit 0): .scout-artifacts/ios-testflight/2026-06-26T17-19-30-564Z/09-capacitor-sync-ios.log
- pass ios-archive (exit 0): .scout-artifacts/ios-testflight/2026-06-26T17-19-30-564Z/10-ios-archive.log
- fail upload-to-app-store-connect (exit 70): .scout-artifacts/ios-testflight/2026-06-26T17-19-30-564Z/11-upload-to-app-store-connect.log
- pass local-ipa-export (exit 0): .scout-artifacts/ios-testflight/2026-06-26T17-19-30-564Z/12-export-local-ipa.log
- pass altool-upload (exit 0): .scout-artifacts/ios-testflight/2026-06-26T17-19-30-564Z/13-altool-upload.log
- pass altool-build-status (exit 0): .scout-artifacts/ios-testflight/2026-06-26T17-19-30-564Z/14-altool-build-status.log
- pass app-store-connect-build-7-submit (exit 0): .scout-artifacts/ios-testflight/2026-06-26T17-19-30-564Z/15-appstore-build-7-submit.json
- pass app-store-connect-build-7-verify (exit 0): .scout-artifacts/ios-testflight/2026-06-26T17-19-30-564Z/16-appstore-build-7-verify.json
- pass dad-pilot-final (exit 0): .scout-artifacts/ios-testflight/2026-06-26T17-19-30-564Z/17-appstore-build-7-dad-pilot-final.json

## Recovery result

Xcode signed and archived the app, but the first App Store Connect upload failed
with `Failed to Use Accounts`. The same archive was exported to a local IPA and
uploaded with App Store Connect API-key auth.

- Delivery UUID / build id: `533c8f6c-03d9-4220-b5ef-5b4233d49509`
- `xcrun altool --build-status --wait`: `VALID`
- Build `7` external beta state: `IN_BETA_TESTING`
- Dad Pilot public link: `https://testflight.apple.com/join/BagBCrzf`
- Dad Pilot now lists only build `7`; build `6` was removed.
