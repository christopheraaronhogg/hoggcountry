# iOS TestFlight build 32 prep

Checked at: 2026-06-29T06:16:15Z

## Local candidate

- Base repo SHA before prep: `c97b8dc52931b45ea1d49c9991b996ab43e7223d`
- Local iOS target: `1.0 (32)`
- Dad Pilot currently verified on: `1.0 (31)`
- Current eval suite: `2026-06-28.5` / `fnv1a32:741b2381`
- Public TestFlight link: https://testflight.apple.com/join/BagBCrzf
- Purpose: package the camp-shoes/loadout answer-quality improvement so the
  local Scout agent treats comfort and recovery gear as a weighed decision,
  not automatic safety gear.

## Completed locally

- `CURRENT_PROJECT_VERSION` bumped from `31` to `32` for Debug and Release in
  `mobile/ios/App/App.xcodeproj/project.pbxproj`.
- `npm --prefix mobile run check` passed with 0 errors and 0 warnings.
- `npm --prefix mobile test` passed with 240/240 tests.
- `node --test scripts/scout-local-ai-eval-suite.test.mjs` passed with
  115/115 tests.
- `npm --prefix mobile run build` passed.
- `npm run handoff:scout-local-ai-dad -- --out docs/launch/testflight-dad-handoff.md`
  regenerated the Dad Eval Lab handoff snapshot for target `1.0 (32)`.

## Boundary

This prep proof does **not** prove App Store Connect upload, processing, beta
review, Dad Pilot attachment, Dad install/update, a real iPhone Eval Lab run,
local model behavior on TestFlight, or 100/100 reviewed answers.

Build `31` remains the currently approved suite-compatible TestFlight build for
Dad's diagnostic Run 100. Build `32` is the latest-source candidate and still
needs App Store Connect upload, processing, and Dad Pilot refresh before it
counts as latest-code phone proof.

## Next commands

Upload build `32` with Chris/account-bound App Store Connect auth:

```sh
npm run ios:testflight -- --upload --team-id 3CFU9J87A5 \
  --asc-key-path ~/.appstoreconnect/private_keys/AuthKey_T272T83N98.p8 \
  --asc-key-id T272T83N98 \
  --asc-issuer-id <issuer-id>
```

After App Store Connect processing, refresh Dad Pilot proof:

```sh
npm run refresh:testflight-dad-pilot -- --build 32 --app-version 1.0
npm run refresh:testflight-dad-pilot -- --build 32 --app-version 1.0 --attach --submit-review --remove-previous --update-release-evidence
```
