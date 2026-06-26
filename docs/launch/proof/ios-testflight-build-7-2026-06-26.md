# iOS TestFlight build 7 state

Checked at: 2026-06-26T17:32:50Z

## Build uploaded

- App Store Connect app: `Hoggcountry` (`6782505691`)
- Bundle id: `com.hoggcountry.trailassistant`
- Lane repo SHA captured before archive: `fc92133201a9a020ea3f119bef62c72e4bedc100`
- Uploaded build: `1.0` (`7`)
- Build id / delivery UUID: `533c8f6c-03d9-4220-b5ef-5b4233d49509`
- Processing state: `VALID`
- Internal beta state: `READY_FOR_BETA_TESTING`
- External beta state: `IN_BETA_TESTING`
- Upload proof: `docs/launch/proof/ios-testflight-attempt-2026-06-26T17-19-30-564Z.md`
- Archive/upload artifacts: `.scout-artifacts/ios-testflight/2026-06-26T17-19-30-564Z/`

The first Xcode account upload in this lane failed with `Failed to Use Accounts`.
The same signed archive was then exported locally and uploaded with App Store
Connect API-key auth, without rebuilding the archive.

## Release gate results

- `npm run check`: passed
- `npm test`: passed
- `npm run cap:sync:ios`: passed
- `xcodebuild archive`: passed
- Local App Store IPA export: passed
- `xcrun altool --upload-app`: passed
- `xcrun altool --build-status --wait`: `VALID`

## Dad Pilot group

- Group id: `fc963396-a087-44c6-b56b-29847da31cd4`
- Group name: `Dad Pilot`
- Public link: `https://testflight.apple.com/join/BagBCrzf`
- Public link limit: `5`
- Build `7` is attached to Dad Pilot.
- Build `6` was removed from Dad Pilot.
- Dad Pilot now lists only build `7`.
- Dad tester `jimmy@hoggs.net` is `INVITED`.

## Current status

Build `1.0 (7)` is live for external TestFlight in Dad Pilot. Dad can install
from the public TestFlight link above.
