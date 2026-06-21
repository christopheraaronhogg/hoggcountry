# iOS TestFlight lane attempt

Checked at: 2026-06-21T02:51:54.866Z
Repo SHA: see repo-sha log
Status: blocked
Output directory: .scout-artifacts/ios-testflight/2026-06-21T02-51-42-785Z

## Mode

- Upload: no
- Archive only: yes
- Internal TestFlight only: no
- Team override provided: no
- App Store Connect API key provided: no

## Steps

- pass repo-sha (exit 0): .scout-artifacts/ios-testflight/2026-06-21T02-51-42-785Z/01-repo-sha.log
- pass xcode-version (exit 0): .scout-artifacts/ios-testflight/2026-06-21T02-51-42-785Z/02-xcode-version.log
- pass codesigning-identities (exit 0): .scout-artifacts/ios-testflight/2026-06-21T02-51-42-785Z/03-codesigning-identities.log
- blocked provisioning-profiles (exit 1): .scout-artifacts/ios-testflight/2026-06-21T02-51-42-785Z/04-provisioning-profiles.log
- pass release-build-settings (exit 0): .scout-artifacts/ios-testflight/2026-06-21T02-51-42-785Z/05-release-build-settings.log
- pass mobile-check (exit 0): .scout-artifacts/ios-testflight/2026-06-21T02-51-42-785Z/06-mobile-check.log
- pass mobile-test (exit 0): .scout-artifacts/ios-testflight/2026-06-21T02-51-42-785Z/07-mobile-test.log
- pass capacitor-sync-ios (exit 0): .scout-artifacts/ios-testflight/2026-06-21T02-51-42-785Z/08-capacitor-sync-ios.log
- fail ios-archive (exit 65): .scout-artifacts/ios-testflight/2026-06-21T02-51-42-785Z/09-ios-archive.log

## Next action

Resolve the first failing step above. If the failing step is `ios-archive` with `requires a development team`, select Chris's Apple Developer Team for the App target or rerun with `--team-id TEAMID` after Xcode has a valid Apple account/signing identity.
