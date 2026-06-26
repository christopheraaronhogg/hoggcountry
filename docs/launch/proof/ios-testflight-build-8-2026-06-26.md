# iOS TestFlight build 8 state

Checked at: 2026-06-26T18:00:47Z

## Build uploaded

- App Store Connect app: `Hoggcountry` (`6782505691`)
- Bundle id: `com.hoggcountry.trailassistant`
- Lane repo SHA captured before archive: `757a7f4fef22fbdedef0cd2c128b86d99780cf23`
- Uploaded build: `1.0` (`8`)
- Build id: `56eb8af9-20e9-409c-972d-b131b404ccb2`
- Processing state: `VALID`
- Internal beta state: `READY_FOR_BETA_TESTING`
- External beta state: `IN_BETA_TESTING`
- Beta review state: `APPROVED`
- Upload proof: `docs/launch/proof/ios-testflight-attempt-2026-06-26T17-52-16-552Z.md`
- Archive/upload artifacts: `.scout-artifacts/ios-testflight/2026-06-26T17-52-16-552Z/`

The archive contains `CFBundleShortVersionString=1.0` and `CFBundleVersion=8`.
This build includes the Scout Eval Lab autosave/resume workflow needed for Dad's
real-device 100-question local-AI run.

## Release gate results

- `npm run check`: passed
- `npm test`: passed
- `npm run cap:sync:ios`: passed
- `xcodebuild archive`: passed
- `xcodebuild -exportArchive` App Store Connect upload: passed
- App Store Connect Builds API: build `8` reached `processingState=VALID`

The upload log includes a non-blocking missing dSYM warning for
`CLiteRTLM.framework`, matching the prior TestFlight lane.

## Dad Pilot group

- Group id: `fc963396-a087-44c6-b56b-29847da31cd4`
- Group name: `Dad Pilot`
- Public link: `https://testflight.apple.com/join/BagBCrzf`
- Public link enabled: `true`
- Public link limit: `5`
- Build `8` is attached to Dad Pilot.
- Build `7` was removed from Dad Pilot.
- Dad Pilot now lists only build `8`.
- Dad tester `jimmy@hoggs.net` is `INVITED`.
- Public-link tester state is `INSTALLED`.

## Current status

Build `1.0 (8)` is live for external TestFlight in Dad Pilot. Dad can install or
update from the public TestFlight link above and should get the Eval Lab
autosave/resume build.
