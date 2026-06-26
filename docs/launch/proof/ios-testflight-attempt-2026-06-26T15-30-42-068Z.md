# iOS TestFlight lane attempt

Checked at: 2026-06-26T15:38:55.874Z
Repo SHA: see repo-sha log
Status: passed via fallback upload
Output directory: .scout-artifacts/ios-testflight/2026-06-26T15-30-42-068Z

## Mode

- Upload: yes
- Archive only: no
- Internal TestFlight only: no
- Team override provided: yes
- Provisioning profile: Hoggcountry App Store Connect
- App Store Connect API key provided: yes

## Steps

- pass repo-sha (exit 0): .scout-artifacts/ios-testflight/2026-06-26T15-30-42-068Z/01-repo-sha.log
- pass xcode-version (exit 0): .scout-artifacts/ios-testflight/2026-06-26T15-30-42-068Z/02-xcode-version.log
- pass codesigning-identities (exit 0): .scout-artifacts/ios-testflight/2026-06-26T15-30-42-068Z/03-codesigning-identities.log
- pass provisioning-profiles (exit 0): .scout-artifacts/ios-testflight/2026-06-26T15-30-42-068Z/04-provisioning-profiles.log
- pass release-build-settings (exit 0): .scout-artifacts/ios-testflight/2026-06-26T15-30-42-068Z/05-release-build-settings.log
- pass ios-signing-readiness (exit 0): .scout-artifacts/ios-testflight/2026-06-26T15-30-42-068Z/06-ios-signing-readiness.log
- pass mobile-check (exit 0): .scout-artifacts/ios-testflight/2026-06-26T15-30-42-068Z/07-mobile-check.log
- pass mobile-test (exit 0): .scout-artifacts/ios-testflight/2026-06-26T15-30-42-068Z/08-mobile-test.log
- pass capacitor-sync-ios (exit 0): .scout-artifacts/ios-testflight/2026-06-26T15-30-42-068Z/09-capacitor-sync-ios.log
- pass ios-archive (exit 0): .scout-artifacts/ios-testflight/2026-06-26T15-30-42-068Z/10-ios-archive.log
- fail upload-to-app-store-connect (exit null): .scout-artifacts/ios-testflight/2026-06-26T15-30-42-068Z/11-upload-to-app-store-connect.log

## Next action

The built archive was valid, but Xcode's direct upload path was stopped after it stayed at `Waiting for App Store Connect SPI analysis response`. A local App Store IPA export and `altool` upload then succeeded for the same archive.

## Follow-up upload proof

- Local IPA export: passed (`.scout-artifacts/ios-testflight/2026-06-26T15-30-42-068Z/export-local/App.ipa`)
- Upload tool: `xcrun altool --upload-app`
- Delivery UUID / build id: `04adec30-b363-4285-9917-67d571b0889a`
- App Store Connect processing: `VALID`
- Final external TestFlight state: `IN_BETA_TESTING`
- Dad Pilot public link: `https://testflight.apple.com/join/BagBCrzf`
