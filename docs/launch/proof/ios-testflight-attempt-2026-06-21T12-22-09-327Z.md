# iOS TestFlight lane attempt

Checked at: 2026-06-21T12:22:38.778Z
Repo SHA: see repo-sha log
Status: blocked
Output directory: .scout-artifacts/ios-testflight/2026-06-21T12-22-09-327Z

## Mode

- Upload: yes
- Archive only: no
- Internal TestFlight only: no
- Team override provided: yes
- Provisioning profile: Hoggcountry App Store Connect
- App Store Connect API key provided: no

## Steps

- pass repo-sha (exit 0): .scout-artifacts/ios-testflight/2026-06-21T12-22-09-327Z/01-repo-sha.log
- pass xcode-version (exit 0): .scout-artifacts/ios-testflight/2026-06-21T12-22-09-327Z/02-xcode-version.log
- pass codesigning-identities (exit 0): .scout-artifacts/ios-testflight/2026-06-21T12-22-09-327Z/03-codesigning-identities.log
- pass provisioning-profiles (exit 0): .scout-artifacts/ios-testflight/2026-06-21T12-22-09-327Z/04-provisioning-profiles.log
- pass release-build-settings (exit 0): .scout-artifacts/ios-testflight/2026-06-21T12-22-09-327Z/05-release-build-settings.log
- pass ios-signing-readiness (exit 0): .scout-artifacts/ios-testflight/2026-06-21T12-22-09-327Z/06-ios-signing-readiness.log
- pass mobile-check (exit 0): .scout-artifacts/ios-testflight/2026-06-21T12-22-09-327Z/07-mobile-check.log
- pass mobile-test (exit 0): .scout-artifacts/ios-testflight/2026-06-21T12-22-09-327Z/08-mobile-test.log
- pass capacitor-sync-ios (exit 0): .scout-artifacts/ios-testflight/2026-06-21T12-22-09-327Z/09-capacitor-sync-ios.log
- pass ios-archive (exit 0): .scout-artifacts/ios-testflight/2026-06-21T12-22-09-327Z/10-ios-archive.log
- fail upload-to-app-store-connect (exit 70): .scout-artifacts/ios-testflight/2026-06-21T12-22-09-327Z/11-upload-to-app-store-connect.log

## Next action

Xcode signed and archived the app, but App Store Connect upload auth failed with `Failed to Use Accounts`. Re-auth Xcode Settings > Accounts for Chris's Apple ID, or rerun with App Store Connect API key flags/env: `--asc-key-path`, `--asc-key-id`, and `--asc-issuer-id`.
