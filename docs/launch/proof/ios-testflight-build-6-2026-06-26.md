# iOS TestFlight build 6 state

Checked at: 2026-06-26T15:46:38Z

## Build uploaded

- App Store Connect app: `Hoggcountry` (`6782505691`)
- Bundle id: `com.hoggcountry.trailassistant`
- Repo SHA: `07e248df21e2ed4eb4b14705bf3c5d5edf12fe53`
- Uploaded build: `1.0` (`6`)
- Build id / delivery UUID: `04adec30-b363-4285-9917-67d571b0889a`
- Processing state: `VALID`
- Internal beta state: `READY_FOR_BETA_TESTING`
- External beta state: `IN_BETA_TESTING`
- Upload proof: `docs/launch/proof/ios-testflight-attempt-2026-06-26T15-30-42-068Z.md`
- Archive/upload artifacts: `.scout-artifacts/ios-testflight/2026-06-26T15-30-42-068Z/`

## Release gate results

- `npm run check`: passed
- `npm test`: passed
- `npm run cap:sync:ios`: passed
- `xcodebuild archive`: passed
- Xcode direct upload: stopped after App Store Connect SPI analysis did not return
- Local App Store IPA export: passed
- `xcrun altool --upload-app`: passed
- `xcrun altool --build-status --wait`: `VALID`

## Dad Pilot group

- Group id: `fc963396-a087-44c6-b56b-29847da31cd4`
- Group name: `Dad Pilot`
- Public link: `https://testflight.apple.com/join/BagBCrzf`
- Public link limit: `5`
- Build `6` is attached to Dad Pilot.
- Build `5` was removed from Dad Pilot.
- Dad Pilot now lists only build `6`.

## Current status

Build `1.0 (6)` is live for external TestFlight in Dad Pilot. Dad can install from the public TestFlight link above.
