# iOS TestFlight build 21 prep

Checked at: 2026-06-27T14:17:28Z

## Local candidate

- Base repo SHA before prep: `54fe3f9431d5973a2de6e0773604ad846be2dea3`
- Local iOS target: `1.0 (21)`
- Dad Pilot currently verified on: `1.0 (19)`
- Intermediate upload: build `20` uploaded from commit
  `54fe3f9431d5973a2de6e0773604ad846be2dea3`, but this build `21` candidate
  adds the subsequent Scout chat scroll-geometry fix.
- Public TestFlight link: https://testflight.apple.com/join/BagBCrzf
- Purpose: package the latest Scout transcript search/deep-link UI and the
  safer chat scroll geometry into the next TestFlight candidate, while
  preserving build `19` as the current approved Dad Pilot build until App Store
  Connect proves build `21` is processed and attached.

## Boundary

This proof does **not** prove App Store Connect upload, processing, beta review,
Dad Pilot attachment, Dad install/update, a real iPhone Eval Lab run, local
model behavior, or 100/100 reviewed answers.

Build `19` remains the currently approved suite-compatible TestFlight build for
Dad. Build `21` is the latest-source candidate and needs the normal archive,
upload, and Dad Pilot refresh before Dad can install that exact build from
TestFlight.

## Completed locally

- `CURRENT_PROJECT_VERSION` bumped from `20` to `21` for Debug and Release in
  `mobile/ios/App/App.xcodeproj/project.pbxproj`.
- Svelte MCP autofixer reported no issues for `CoachTab.svelte` after the
  chat scroll-geometry fix was validated.
- `npm --prefix mobile run check` passed with 0 errors and 0 warnings.
- `npm --prefix mobile test` passed with 210/210 tests.
- `node --test scripts/scout-local-ai-eval-suite.test.mjs` passed with 103/103
  tests after updating target-build expectations for `1.0 (21)` and preserving
  Dad Pilot build `1.0 (19)` as the current suite-compatible run-now build.
- `LANG=en_US.UTF-8 LC_ALL=en_US.UTF-8 npm --prefix mobile run cap:sync:ios`
  passed, including the production build and iOS Capacitor sync.
- `npm test` passed with 337/337 tests.

## Next command

```bash
npm run ios:testflight -- --upload \
  --team-id 3CFU9J87A5 \
  --asc-key-path ~/.appstoreconnect/private_keys/AuthKey_T272T83N98.p8 \
  --asc-key-id T272T83N98 \
  --asc-issuer-id <issuer-id>
```
