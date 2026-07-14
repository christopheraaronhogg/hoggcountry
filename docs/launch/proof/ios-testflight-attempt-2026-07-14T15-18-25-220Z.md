# iOS TestFlight lane attempt

Checked at: 2026-07-14T15:20:00.206Z
Repo SHA: see repo-sha log
Status: blocked
Output directory: .scout-artifacts/ios-testflight/2026-07-14T15-18-25-220Z

## Mode

- Upload: yes
- Archive only: no
- Internal TestFlight only: no
- Team override provided: yes
- Provisioning profile: Hoggcountry App Store Connect
- App Store Connect API key provided: yes
- Eval suite: `dad-local-ai-100` version `2026-06-29.1`, hash `fnv1a32:92815d44`

## Steps

- pass repo-sha (exit 0): .scout-artifacts/ios-testflight/2026-07-14T15-18-25-220Z/01-repo-sha.log
- pass xcode-version (exit 0): .scout-artifacts/ios-testflight/2026-07-14T15-18-25-220Z/02-xcode-version.log
- pass codesigning-identities (exit 0): .scout-artifacts/ios-testflight/2026-07-14T15-18-25-220Z/03-codesigning-identities.log
- blocked provisioning-profiles (exit 1): .scout-artifacts/ios-testflight/2026-07-14T15-18-25-220Z/04-provisioning-profiles.log
- pass release-build-settings (exit 0): .scout-artifacts/ios-testflight/2026-07-14T15-18-25-220Z/05-release-build-settings.log
- pass ios-signing-readiness (exit 0): .scout-artifacts/ios-testflight/2026-07-14T15-18-25-220Z/06-ios-signing-readiness.log
- pass mobile-check (exit 0): .scout-artifacts/ios-testflight/2026-07-14T15-18-25-220Z/07-mobile-check.log
- pass mobile-test (exit 0): .scout-artifacts/ios-testflight/2026-07-14T15-18-25-220Z/08-mobile-test.log
- pass capacitor-sync-ios (exit 0): .scout-artifacts/ios-testflight/2026-07-14T15-18-25-220Z/09-capacitor-sync-ios.log
- fail ios-archive (exit 65): .scout-artifacts/ios-testflight/2026-07-14T15-18-25-220Z/10-ios-archive.log

## Next action

Resolve the first blocked or failing step above. If the blocked step is `ios-signing-readiness` or `ios-archive` with `requires a development team`, select Chris's Apple Developer Team for the App target or rerun with `--team-id TEAMID` after Xcode has a valid Apple account/signing identity.
