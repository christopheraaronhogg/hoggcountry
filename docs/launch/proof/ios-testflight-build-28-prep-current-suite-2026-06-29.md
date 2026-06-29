# iOS TestFlight build 28 current-suite prep

Checked at: 2026-06-29T00:44:40Z

## Local Candidate

- Repo SHA at status check: `6a87b3f8efea54e9893b45ae5d99be4e32a276a2`
- Local iOS target: `1.0 (28)`
- Current eval suite: `2026-06-28.5` / `fnv1a32:741b2381`
- Dad Pilot currently verified on: `1.0 (27)`
- Public TestFlight link: https://testflight.apple.com/join/BagBCrzf

## Current Proof

- Canonical suite, mobile static copy, and iOS copied public asset all report
  suite version `2026-06-28.5` with 100 cases.
- Xcode project settings report `MARKETING_VERSION = 1.0` and
  `CURRENT_PROJECT_VERSION = 28`.
- `npm --prefix mobile run check` passed with 0 errors and 0 warnings.
- `npm --prefix mobile test` passed with 240/240 tests.
- `LANG=en_US.UTF-8 LC_ALL=en_US.UTF-8 npm --prefix mobile run cap:sync:ios`
  passed, including `npm run build`, iOS preflight, `npx cap sync ios`, and
  ScoutGemma plugin registration.
- At this check, simulator/debug Gemma Run 100 was the latest local preflight:
  `device-local-ai-20260629T001151Z`, 100/100 cases, all required tools hit,
  all source evidence complete, 0 answer-quality flags.
- Later simulator preflight was refreshed by
  `docs/launch/proof/scout-local-ai-sim-preflight-2026-06-29T00-56-30Z.md`.
- App Store Connect read-only refresh was not rerun in this shell because
  `APP_STORE_CONNECT_API_KEY_PATH`, `APP_STORE_CONNECT_API_KEY_ID`, and
  `APP_STORE_CONNECT_API_ISSUER_ID` were not set. The latest recorded read-only
  refresh remains `docs/launch/proof/ios-testflight-build-28-missing-2026-06-28.md`.
- Latest successful native upload remains build `1.0 (27)` from commit
  `c9a49b6974d2f8f32532848e4621ee0d761c4a3c`, which contains suite
  `2026-06-27.2`.

## Boundary

This proof does **not** prove App Store Connect upload, processing, beta review,
Dad Pilot attachment, Dad install/update, a real iPhone Eval Lab run,
TestFlight/iPhone local-model behavior, or 100/100 reviewed answers.

Build `27` remains externally available in Dad Pilot, but it is stale for the
current suite. Build `28` is the current-suite TestFlight candidate and still
must be uploaded, attached to Dad Pilot, and verified through App Store Connect
before Dad should run `Run 100`.

## Next Commands

Chris/account-bound upload step:

```bash
npm run ios:testflight -- --upload \
  --team-id 3CFU9J87A5 \
  --asc-key-path ~/.appstoreconnect/private_keys/AuthKey_T272T83N98.p8 \
  --asc-key-id T272T83N98 \
  --asc-issuer-id <issuer-id>
```

After App Store Connect shows build `28` as processed, attach it to Dad Pilot,
submit beta review if needed, remove build `27` only after build `28` is
available, and refresh the local release ledger:

```bash
npm run refresh:testflight-dad-pilot -- \
  --build 28 \
  --app-version 1.0 \
  --attach \
  --submit-review \
  --wait-review \
  --remove-previous \
  --update-release-evidence \
  --proof-out docs/launch/proof/ios-testflight-build-28-$(date +%F).md
```
