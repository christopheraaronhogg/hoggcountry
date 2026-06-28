# iOS TestFlight build 28 prep

Checked at: 2026-06-28T19:40:00Z

## Local Candidate

- Repo SHA: `6f1b4781ca9755f76d00798fa61d780b8cb7126d`
- Local iOS target: `1.0 (28)`
- Current eval suite: `2026-06-28.2` / `fnv1a32:9b0b2e8a`
- Dad Pilot currently verified on: `1.0 (27)`
- Latest successful native upload SHA: `c9a49b6974d2f8f32532848e4621ee0d761c4a3c`
- Latest successful native upload suite: `2026-06-27.2` / `fnv1a32:b79f13dd`
- Public TestFlight link, after refresh: https://testflight.apple.com/join/BagBCrzf

## Boundary

This proof does **not** prove App Store Connect upload, processing, beta review,
Dad Pilot attachment, Dad install/update, a real iPhone Eval Lab run, local
model behavior, or 100/100 reviewed answers.

Build `27` remains externally available in Dad Pilot, but it is stale for the
current suite. Build `28` is the current-suite TestFlight candidate and must be
uploaded, attached to Dad Pilot, and verified through App Store Connect before
Dad should run `Run 100`.

## Completed Locally

- `CURRENT_PROJECT_VERSION` is `28` for Debug and Release in
  `mobile/ios/App/App.xcodeproj/project.pbxproj`.
- Release build settings show bundle `com.hoggcountry.trailassistant`,
  `MARKETING_VERSION = 1.0`, `CURRENT_PROJECT_VERSION = 28`,
  `DEVELOPMENT_TEAM = 3CFU9J87A5`, `CODE_SIGN_IDENTITY = Apple Distribution`,
  `CODE_SIGN_STYLE = Manual`, and provisioning profile
  `Hoggcountry App Store Connect`.
- Diagnose-only TestFlight lane passed:
  `docs/launch/proof/ios-testflight-attempt-2026-06-28T19-39-51-340Z.md`.
- `npm test` passed with 346/346 tests.
- `node --test scripts/scout-local-ai-eval-suite.test.mjs` passed with
  106/106 tests.
- `npm --prefix mobile run check` passed with 0 errors and 0 warnings.
- `npm --prefix mobile run cap:sync:ios` passed.
- `npm run status:scout-local-ai` correctly blocks Dad until build `28`
  contains the current eval suite in TestFlight.
- GitHub Actions for the pushed commit are green for Scout CI and Forge Deploy;
  the prior Mobile CI for the build-target change is green.
- Forge deploy verification passed for `https://hoggcountry.com` at
  `6f1b4781ca9755f76d00798fa61d780b8cb7126d`.

## Next Commands

Upload build `28` with Chris/account-bound App Store Connect auth:

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

Then rerun:

```bash
npm run status:scout-local-ai
npm run message:scout-local-ai-dad
```
