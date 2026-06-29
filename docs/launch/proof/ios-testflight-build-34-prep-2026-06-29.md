# iOS TestFlight build 34 prep

Checked at: 2026-06-29T08:25:40Z

## Local candidate

- Base repo SHA before prep: `b5c649a1476894dee175a6fca246ad5fa5d7fbf8`
- Local iOS target: `1.0 (34)`
- Dad Pilot currently verified on: `1.0 (33)`
- Current eval suite: `2026-06-28.5` / `fnv1a32:741b2381`
- Public TestFlight link: https://testflight.apple.com/join/BagBCrzf
- Purpose: package the latest Scout document-vault recovery work so TestFlight
  latest-source proof includes versioned/recoverable user document changes.

## Completed locally

- `CURRENT_PROJECT_VERSION` bumped from `33` to `34` for Debug and Release in
  `mobile/ios/App/App.xcodeproj/project.pbxproj`.
- `npm --prefix mobile run check` passed with 0 errors and 0 warnings.
- `npm --prefix mobile test` passed with 243/243 tests.
- `node --test scripts/scout-local-ai-eval-suite.test.mjs` passed with
  115/115 tests.
- `LANG=en_US.UTF-8 LC_ALL=en_US.UTF-8 npm --prefix mobile run cap:sync:ios`
  passed, including the mobile production build, iOS preflight, Capacitor sync,
  CocoaPods update, and ScoutGemma plugin registration.
- `npm run handoff:scout-local-ai-dad -- --out docs/launch/testflight-dad-handoff.md`
  regenerated the Dad Eval Lab handoff snapshot for target `1.0 (34)`.

## Boundary

This prep proof does **not** prove App Store Connect upload, processing, beta
review, Dad Pilot attachment, Dad install/update, a real iPhone Eval Lab run,
local model behavior on TestFlight, or 100/100 reviewed answers.

Build `33` remains the currently approved suite-compatible TestFlight build for
Dad's diagnostic Run 100. Build `34` is the latest-source candidate and still
needs App Store Connect upload, processing, and Dad Pilot refresh before it
counts as latest-code phone proof.

## Next commands

Upload build `34` with Chris/account-bound App Store Connect auth:

```sh
npm run ios:testflight -- --upload --team-id 3CFU9J87A5
```

After App Store Connect processing, refresh Dad Pilot proof:

```sh
npm run refresh:testflight-dad-pilot -- --build 34 --app-version 1.0
npm run refresh:testflight-dad-pilot -- --build 34 --app-version 1.0 --attach --submit-review --remove-previous --update-release-evidence
```
