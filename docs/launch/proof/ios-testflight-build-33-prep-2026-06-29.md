# iOS TestFlight build 33 prep

Checked at: 2026-06-29T07:25:00Z

## Local candidate

- Base repo SHA before prep: `538693f19e7f538ac1bf5517e16e8f9e6d8f0374`
- Local iOS target: `1.0 (33)`
- Dad Pilot currently verified on: `1.0 (32)`
- Current eval suite: `2026-06-28.5` / `fnv1a32:741b2381`
- Public TestFlight link: https://testflight.apple.com/join/BagBCrzf
- Purpose: package the Scout eval harness hardening so the installed Eval Lab
  records declared per-case context, prevents hidden follow-up leakage, and keeps
  field-critical answers governed by deterministic tool/source evidence.

## Completed locally

- `CURRENT_PROJECT_VERSION` bumped from `32` to `33` for Debug and Release in
  `mobile/ios/App/App.xcodeproj/project.pbxproj`.
- `npm --prefix mobile run check` passed with 0 errors and 0 warnings.
- `npm --prefix mobile test` passed with 241/241 tests.
- `node --test scripts/scout-local-ai-eval-suite.test.mjs` passed with
  115/115 tests.
- `LANG=en_US.UTF-8 LC_ALL=en_US.UTF-8 npm --prefix mobile run cap:sync:ios`
  passed, including the mobile production build, iOS preflight, Capacitor sync,
  CocoaPods update, and ScoutGemma plugin registration.
- `npm run handoff:scout-local-ai-dad -- --out docs/launch/testflight-dad-handoff.md`
  regenerated the Dad Eval Lab handoff snapshot for target `1.0 (33)`.

## Boundary

This prep proof does **not** prove App Store Connect upload, processing, beta
review, Dad Pilot attachment, Dad install/update, a real iPhone Eval Lab run,
local model behavior on TestFlight, or 100/100 reviewed answers.

Build `32` remains the currently approved suite-compatible TestFlight build for
Dad's diagnostic Run 100. Build `33` is the latest-source candidate and still
needs App Store Connect upload, processing, and Dad Pilot refresh before it
counts as latest-code phone proof.

## Next commands

Upload build `33` with Chris/account-bound App Store Connect auth:

```sh
npm run ios:testflight -- --upload --team-id 3CFU9J87A5 \
  --asc-key-path ~/.appstoreconnect/private_keys/AuthKey_T272T83N98.p8 \
  --asc-key-id T272T83N98 \
  --asc-issuer-id <issuer-id>
```

After App Store Connect processing, refresh Dad Pilot proof:

```sh
npm run refresh:testflight-dad-pilot -- --build 33 --app-version 1.0
npm run refresh:testflight-dad-pilot -- --build 33 --app-version 1.0 --attach --submit-review --remove-previous --update-release-evidence
```
