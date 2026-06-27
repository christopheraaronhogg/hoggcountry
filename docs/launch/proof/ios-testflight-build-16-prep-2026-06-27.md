# iOS TestFlight build 16 prep

Checked at: 2026-06-27T11:17:25Z

## Local candidate

- Base repo SHA before prep: `002856854559e38bab9bbd0a0c86bd47a674baf1`
- Local iOS target: `1.0 (16)`
- Dad Pilot currently verified on: `1.0 (15)`
- Public TestFlight link: https://testflight.apple.com/join/BagBCrzf
- Purpose: package the latest Scout Eval Lab status/handoff behavior and native
  source-drift reporting into the next TestFlight candidate, while preserving
  build `15` as the current approved Dad Pilot build until App Store Connect
  proves build `16` is processed and attached.

## Completed locally

- `CURRENT_PROJECT_VERSION` bumped from `15` to `16` for Debug and Release in
  `mobile/ios/App/App.xcodeproj/project.pbxproj`.
- `LANG=en_US.UTF-8 LC_ALL=en_US.UTF-8 npm --prefix mobile run cap:sync:ios`
  passed.
- `npm --prefix mobile run check` passed with 0 errors and 0 warnings.
- `npm --prefix mobile test` passed with 204/204 tests.
- `node --test scripts/scout-local-ai-eval-suite.test.mjs` passed with 94/94
  tests after updating the status and handoff expectations for target `16`.

## Boundary

This proof does **not** prove App Store Connect upload, processing, beta review,
Dad Pilot attachment, Dad install/update, a real iPhone Eval Lab run, local model
behavior, or 100/100 reviewed answers.

Build `15` remains the currently approved suite-compatible TestFlight build for
Dad. Build `16` is the latest-source candidate and needs the normal archive,
upload, and Dad Pilot refresh before Dad can install that exact build from
TestFlight.

## Next command

```bash
npm run ios:testflight -- --upload \
  --team-id 3CFU9J87A5 \
  --asc-key-path ~/.appstoreconnect/private_keys/AuthKey_T272T83N98.p8 \
  --asc-key-id T272T83N98 \
  --asc-issuer-id <issuer-id>
```
