# iOS TestFlight build 31 prep

Checked at: 2026-06-29T05:34:00Z

## Local candidate

- Base repo SHA before prep: `3ab70e4859fefdd6f81d08ce9b660baed07af26e`
- Local iOS target: `1.0 (31)`
- Dad Pilot currently verified on: `1.0 (30)`
- Current eval suite: `2026-06-28.5` / `fnv1a32:741b2381`
- Public TestFlight link: https://testflight.apple.com/join/BagBCrzf
- Purpose: package the latest on-device Scout answer-polishing fix for
  ridge-water decisions into the next latest-source TestFlight candidate while
  preserving build `30` as the currently runnable suite-compatible Dad Pilot
  build.

## Completed locally

- `CURRENT_PROJECT_VERSION` bumped from `30` to `31` for Debug and Release in
  `mobile/ios/App/App.xcodeproj/project.pbxproj`.
- `npm --prefix mobile run check` passed with 0 errors and 0 warnings.
- `npm --prefix mobile test` passed with 240/240 tests.
- `node --test scripts/scout-local-ai-eval-suite.test.mjs` passed with
  115/115 tests.
- `LANG=en_US.UTF-8 LC_ALL=en_US.UTF-8 npm --prefix mobile run cap:sync:ios`
  passed, including the production build, iOS preflight, Capacitor sync, and
  ScoutGemma plugin registration.
- Diagnose-only TestFlight lane passed:
  `docs/launch/proof/ios-testflight-attempt-2026-06-29T05-33-39-250Z.md`.
- `npm run status:scout-local-ai` reports build `31` as the local target,
  build `30` as the suite-compatible Dad Pilot build, and no TestFlight/iPhone
  Run 100 export imported yet.

## Boundary

This prep proof does **not** prove App Store Connect upload, processing, beta
review, Dad Pilot attachment, Dad install/update, a real iPhone Eval Lab run,
local model behavior on TestFlight, or 100/100 reviewed answers.

Build `30` remains the currently approved suite-compatible TestFlight build for
Dad's diagnostic Run 100. Build `31` is the latest-source candidate and still
needs App Store Connect upload, processing, and Dad Pilot refresh before it
counts as latest-code phone proof.

## Next commands

Upload build `31` with Chris/account-bound App Store Connect auth:

```sh
npm run ios:testflight -- --upload --team-id 3CFU9J87A5 \
  --asc-key-path ~/.appstoreconnect/private_keys/AuthKey_T272T83N98.p8 \
  --asc-key-id T272T83N98 \
  --asc-issuer-id <issuer-id>
```

After App Store Connect processing, refresh Dad Pilot proof:

```sh
npm run refresh:testflight-dad-pilot -- --build 31 --app-version 1.0
npm run refresh:testflight-dad-pilot -- --build 31 --app-version 1.0 --attach --submit-review --remove-previous --update-release-evidence
```

