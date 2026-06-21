# iOS TestFlight lane attempt

Checked at: 2026-06-21T03:18:24.324Z
Repo SHA: see repo-sha log
Status: blocked
Output directory: .scout-artifacts/ios-testflight/2026-06-21T03-18-10-690Z

## Mode

- Upload: no
- Archive only: yes
- Internal TestFlight only: no
- Team override provided: yes
- App Store Connect API key provided: no

## Steps

- pass repo-sha (exit 0): .scout-artifacts/ios-testflight/2026-06-21T03-18-10-690Z/01-repo-sha.log
- pass xcode-version (exit 0): .scout-artifacts/ios-testflight/2026-06-21T03-18-10-690Z/02-xcode-version.log
- pass codesigning-identities (exit 0): .scout-artifacts/ios-testflight/2026-06-21T03-18-10-690Z/03-codesigning-identities.log
- blocked provisioning-profiles (exit 1): .scout-artifacts/ios-testflight/2026-06-21T03-18-10-690Z/04-provisioning-profiles.log
- pass release-build-settings (exit 0): .scout-artifacts/ios-testflight/2026-06-21T03-18-10-690Z/05-release-build-settings.log
- pass ios-signing-readiness (exit 0): .scout-artifacts/ios-testflight/2026-06-21T03-18-10-690Z/06-ios-signing-readiness.log
- pass mobile-check (exit 0): .scout-artifacts/ios-testflight/2026-06-21T03-18-10-690Z/07-mobile-check.log
- pass mobile-test (exit 0): .scout-artifacts/ios-testflight/2026-06-21T03-18-10-690Z/08-mobile-test.log
- pass capacitor-sync-ios (exit 0): .scout-artifacts/ios-testflight/2026-06-21T03-18-10-690Z/09-capacitor-sync-ios.log
- fail ios-archive (exit 65): .scout-artifacts/ios-testflight/2026-06-21T03-18-10-690Z/10-ios-archive.log

## Archive Failure Summary

Xcode currently exposes team `3CFU9J87A5`, labeled in Xcode preferences as `Christopher Hogg (Personal Team)`. The archive failed because Apple could not create a provisioning profile for `com.hoggcountry.trailassistant`: the team has no registered devices/profiles. For TestFlight, select the paid Apple Developer Program team in Xcode or pass that paid team id with `--team-id`.

## Next action

Resolve the first blocked or failing step above. If the blocked step is `ios-signing-readiness` or `ios-archive` with `requires a development team`, select Chris's Apple Developer Team for the App target or rerun with `--team-id TEAMID` after Xcode has a valid Apple account/signing identity.
