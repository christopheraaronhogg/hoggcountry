# iOS TestFlight lane attempt

Checked at: 2026-06-21T03:15:54.148Z
Repo SHA: see repo-sha log
Status: blocked
Output directory: .scout-artifacts/ios-testflight/2026-06-21T03-15-52-518Z

## Mode

- Upload: no
- Archive only: no
- Internal TestFlight only: no
- Team override provided: no
- App Store Connect API key provided: no

## Steps

- pass repo-sha (exit 0): .scout-artifacts/ios-testflight/2026-06-21T03-15-52-518Z/01-repo-sha.log
- pass xcode-version (exit 0): .scout-artifacts/ios-testflight/2026-06-21T03-15-52-518Z/02-xcode-version.log
- pass codesigning-identities (exit 0): .scout-artifacts/ios-testflight/2026-06-21T03-15-52-518Z/03-codesigning-identities.log
- blocked provisioning-profiles (exit 1): .scout-artifacts/ios-testflight/2026-06-21T03-15-52-518Z/04-provisioning-profiles.log
- pass release-build-settings (exit 0): .scout-artifacts/ios-testflight/2026-06-21T03-15-52-518Z/05-release-build-settings.log
- blocked ios-signing-readiness (exit 1): .scout-artifacts/ios-testflight/2026-06-21T03-15-52-518Z/06-ios-signing-readiness.log

## Next action

Resolve the first blocked or failing step above. If the blocked step is `ios-signing-readiness` or `ios-archive` with `requires a development team`, select Chris's Apple Developer Team for the App target or rerun with `--team-id TEAMID` after Xcode has a valid Apple account/signing identity.
