# iOS TestFlight build 9 state

Checked at: 2026-06-26T18:19:17Z

## Build uploaded

- App Store Connect app: `Hoggcountry` (`6782505691`)
- Bundle id: `com.hoggcountry.trailassistant`
- Lane repo SHA captured before archive: `136e218e8bb2591c01af730bdd3bd0903f1d9229`
- Uploaded build: `1.0` (`9`)
- Build id: `5d4dd206-4fd1-452b-9a07-e742fac83f8e`
- Processing state: `VALID`
- Internal beta state: `READY_FOR_BETA_TESTING`
- External beta state: `IN_BETA_TESTING`
- Beta review state: `APPROVED`
- First upload attempt proof: `docs/launch/proof/ios-testflight-attempt-2026-06-26T18-13-55-379Z.md`
- Successful upload proof: `docs/launch/proof/ios-testflight-attempt-2026-06-26T18-15-33-779Z.md`
- Archive/upload artifacts: `.scout-artifacts/ios-testflight/2026-06-26T18-15-33-779Z/`

The archive contains `CFBundleShortVersionString=1.0` and `CFBundleVersion=9`.
This build includes the Scout Eval Lab iPhone export hardening: native Share
Sheet, clipboard Copy, and the existing Download fallback for Dad's real-device
100-question local-AI run exports.

## Release gate results

- `npm run check`: passed
- `npm test`: passed
- `npm run cap:sync:ios`: passed
- `xcodebuild archive`: passed
- `xcodebuild -exportArchive` App Store Connect upload: passed after rerunning
  with App Store Connect API-key auth. The first account-auth upload attempt
  archived successfully but stopped at `Failed to Use Accounts`.
- App Store Connect Builds API: build `9` reached `processingState=VALID`
- App Store Connect beta review: build `9` is `APPROVED`
- App Store Connect beta detail: build `9` is `IN_BETA_TESTING`

The upload log includes a non-blocking missing dSYM warning for
`CLiteRTLM.framework`, matching the prior TestFlight lane.

## Dad Pilot group

- Group id: `fc963396-a087-44c6-b56b-29847da31cd4`
- Group name: `Dad Pilot`
- Public link: `https://testflight.apple.com/join/BagBCrzf`
- Public link enabled: `true`
- Public link limit: `5`
- Build `9` is attached to Dad Pilot.
- Build `8` was removed from Dad Pilot.
- Dad Pilot now lists only build `9`.

## Current status

Build `1.0 (9)` is live for external TestFlight in Dad Pilot. Dad can install or
update from the public TestFlight link above and should get the Eval Lab
Share/Copy/Download export build.
