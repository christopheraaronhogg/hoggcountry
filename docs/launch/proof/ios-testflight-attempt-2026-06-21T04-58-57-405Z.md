# iOS TestFlight lane attempt

Checked at: 2026-06-21T04:59:14.631Z
Repo SHA: see repo-sha log
Status: blocked
Output directory: .scout-artifacts/ios-testflight/2026-06-21T-guide-reader-upload-attempt

## Mode

- Upload: yes
- Archive only: no
- Internal TestFlight only: no
- Team override provided: yes
- Provisioning profile: Hoggcountry App Store Connect
- App Store Connect API key provided: no

## Steps

- pass repo-sha (exit 0): .scout-artifacts/ios-testflight/2026-06-21T-guide-reader-upload-attempt/01-repo-sha.log
- pass xcode-version (exit 0): .scout-artifacts/ios-testflight/2026-06-21T-guide-reader-upload-attempt/02-xcode-version.log
- pass codesigning-identities (exit 0): .scout-artifacts/ios-testflight/2026-06-21T-guide-reader-upload-attempt/03-codesigning-identities.log
- pass provisioning-profiles (exit 0): .scout-artifacts/ios-testflight/2026-06-21T-guide-reader-upload-attempt/04-provisioning-profiles.log
- pass release-build-settings (exit 0): .scout-artifacts/ios-testflight/2026-06-21T-guide-reader-upload-attempt/05-release-build-settings.log
- pass ios-signing-readiness (exit 0): .scout-artifacts/ios-testflight/2026-06-21T-guide-reader-upload-attempt/06-ios-signing-readiness.log
- pass ios-archive (exit 0): .scout-artifacts/ios-testflight/2026-06-21T-guide-reader-upload-attempt/07-ios-archive.log
- fail upload-to-app-store-connect (exit 70): .scout-artifacts/ios-testflight/2026-06-21T-guide-reader-upload-attempt/08-upload-to-app-store-connect.log

## Next action

Resolve the first blocked or failing step above. If the blocked step is `ios-signing-readiness` or `ios-archive` with `requires a development team`, select Chris's Apple Developer Team for the App target or rerun with `--team-id TEAMID` after Xcode has a valid Apple account/signing identity.
