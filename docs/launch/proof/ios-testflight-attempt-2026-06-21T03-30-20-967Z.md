# iOS TestFlight lane attempt

Checked at: 2026-06-21T03:30:22.979Z
Repo SHA: see repo-sha log
Status: blocked
Output directory: .scout-artifacts/ios-testflight/2026-06-21T03-30-20-967Z

## Mode

- Upload: no
- Archive only: yes
- Internal TestFlight only: no
- Team override provided: yes
- App Store Connect API key provided: no

## Steps

- pass repo-sha (exit 0): .scout-artifacts/ios-testflight/2026-06-21T03-30-20-967Z/01-repo-sha.log
- pass xcode-version (exit 0): .scout-artifacts/ios-testflight/2026-06-21T03-30-20-967Z/02-xcode-version.log
- pass codesigning-identities (exit 0): .scout-artifacts/ios-testflight/2026-06-21T03-30-20-967Z/03-codesigning-identities.log
- blocked provisioning-profiles (exit 1): .scout-artifacts/ios-testflight/2026-06-21T03-30-20-967Z/04-provisioning-profiles.log
- pass release-build-settings (exit 0): .scout-artifacts/ios-testflight/2026-06-21T03-30-20-967Z/05-release-build-settings.log
- pass ios-signing-readiness (exit 0): .scout-artifacts/ios-testflight/2026-06-21T03-30-20-967Z/06-ios-signing-readiness.log
- fail ios-archive (exit 65): .scout-artifacts/ios-testflight/2026-06-21T03-30-20-967Z/07-ios-archive.log

## Next action

Resolve the first blocked or failing step above. If the blocked step is `ios-signing-readiness` or `ios-archive` with `requires a development team`, select Chris's Apple Developer Team for the App target or rerun with `--team-id TEAMID` after Xcode has a valid Apple account/signing identity.
