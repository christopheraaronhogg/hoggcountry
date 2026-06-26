# iOS TestFlight build 10 state

Checked at: 2026-06-26T21:21:00Z

## Build uploaded

- App Store Connect app: `Hoggcountry` (`6782505691`)
- Bundle id: `com.hoggcountry.trailassistant`
- Lane repo SHA captured before archive: `642ff0051cea6dd144d9b254b2bd13a1ca4688eb`
- Uploaded build: `1.0` (`10`)
- Build id: `b21136ce-bdde-4423-b2b2-25f48a655c5b`
- Processing state: `VALID`
- Internal beta state: `READY_FOR_BETA_TESTING`
- External beta state: `IN_BETA_TESTING`
- Beta review state: `APPROVED`
- Upload proof: `docs/launch/proof/ios-testflight-attempt-2026-06-26T21-15-35-601Z.md`
- Archive/upload artifacts: `.scout-artifacts/ios-testflight/2026-06-26T21-15-35-601Z/`

The archive contains `CFBundleShortVersionString=1.0` and `CFBundleVersion=10`.
This build includes the Scout Eval Lab final-proof gates that require a
TestFlight iPhone install on build `10` or newer before a 100-question device
run can count as Dad proof.

## Release gate results

- `npm run check`: passed
- `npm test`: passed
- `npm run cap:sync:ios`: passed
- `xcodebuild archive`: passed
- `xcodebuild -exportArchive` App Store Connect upload: passed with API-key auth.
- App Store Connect Builds API: build `10` reached `processingState=VALID`.
- App Store Connect beta review: build `10` is `APPROVED`.
- App Store Connect beta detail: build `10` is `IN_BETA_TESTING`.

The upload log includes a non-blocking missing dSYM warning for
`CLiteRTLM.framework`, matching prior TestFlight uploads.

## Dad Pilot group

- Group id: `fc963396-a087-44c6-b56b-29847da31cd4`
- Group name: `Dad Pilot`
- Public link: `https://testflight.apple.com/join/BagBCrzf`
- Public link enabled: `true`
- Public link limit: `5`
- Build `10` is attached to Dad Pilot.
- Build `9` was removed from Dad Pilot.
- Dad Pilot now lists only build `10`.
- Dad Pilot tester count: `2`

## Current status

Build `1.0 (10)` is live for external TestFlight in Dad Pilot. Dad can install
or update from the public TestFlight link above and should get the Scout Eval
Lab build that can produce valid 100-question local-AI device proof.
