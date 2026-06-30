# iOS TestFlight build 35 prep

Checked at: 2026-06-30T18:29:02Z

## Local candidate

- Base repo SHA before prep: `e63f07b8403e4c5b336231140765b60502065516`
- Local iOS target: `1.0 (35)`
- Dad Pilot currently recorded on: `1.0 (34)`
- Current eval suite: `2026-06-29.1` / `fnv1a32:92815d44`
- Latest uploaded native suite: `2026-06-28.5` / `fnv1a32:741b2381`
- Public TestFlight link: https://testflight.apple.com/join/BagBCrzf
- Purpose: package the current Scout local-AI eval suite and latest native app
  source so Dad Pilot can run the real TestFlight/iPhone Run 100 against the
  same suite currently passing simulator/debug Gemma preflight.

## Completed locally

- `CURRENT_PROJECT_VERSION` bumped from `34` to `35` for Debug and Release in
  `mobile/ios/App/App.xcodeproj/project.pbxproj`.
- `docs/launch/config/build-config.md` updated so the local build target and
  TestFlight/current-suite boundary are explicit.
- `LANG=en_US.UTF-8 LC_ALL=en_US.UTF-8 npm --prefix mobile run cap:sync:ios`
  passed, including the mobile production build, iOS preflight, Capacitor sync,
  CocoaPods update, and ScoutGemma plugin registration.
- `npm --prefix mobile run check` passed with 0 errors and 0 warnings.
- `npm --prefix mobile test` passed with 244/244 tests.
- `node --test scripts/scout-local-ai-eval-suite.test.mjs scripts/scout-local-ai-status.test.mjs scripts/scout-local-ai-history.test.mjs`
  passed with 131/131 tests.
- `npm run handoff:scout-local-ai-dad -- --out docs/launch/testflight-dad-handoff.md`
  regenerated the Dad Eval Lab handoff snapshot for target `1.0 (35)`.
- `npm run status:scout-local-ai -- --json` confirmed target `1.0 (35)`,
  recorded Dad Pilot `1.0 (34)`, current suite `2026-06-29.1` /
  `fnv1a32:92815d44`, and next action to upload and attach build `35`.
- `npm run audit:scout-local-ai-goal` confirmed the goal is still incomplete
  until build `35` is in Dad Pilot and a real TestFlight/iPhone Run 100 plus
  human 5/5 review and strict/stability proof are imported.
- XcodeBuildMCP `build_run_sim` passed on the booted `iPhone 16e` simulator
  using the `App` scheme from `mobile/ios/App/App.xcworkspace`; the native app
  launched as bundle `com.hoggcountry.trailassistant`.

## Boundary

This prep proof does **not** prove App Store Connect upload, processing, beta
review, Dad Pilot attachment, Dad install/update, a real iPhone Eval Lab run,
local model behavior on TestFlight, or 100/100 reviewed answers.

Build `34` remains the currently recorded Dad Pilot TestFlight build, but its
latest native upload contains suite `2026-06-28.5`. Build `35` is the
current-suite candidate and still needs App Store Connect upload, processing,
and Dad Pilot refresh before it counts as current-suite phone proof.

## Next commands

Upload build `35` with Chris/account-bound App Store Connect auth:

```sh
npm run ios:testflight -- --upload --team-id 3CFU9J87A5
```

After App Store Connect processing, refresh Dad Pilot proof:

```sh
npm run refresh:testflight-dad-pilot -- --build 35 --app-version 1.0
npm run refresh:testflight-dad-pilot -- --build 35 --app-version 1.0 --attach --submit-review --remove-previous --update-release-evidence
```
