# iOS TestFlight build 28 current-suite prep

Checked at: 2026-06-28T23:13:46Z

## Local Candidate

- Repo SHA at status check: `dd6038121e427cdf2c38022a06e4055d6fe01c02`
- Local iOS target: `1.0 (28)`
- Current eval suite: `2026-06-28.4` / `fnv1a32:5eba0f98`
- Dad Pilot currently verified on: `1.0 (27)`
- Public TestFlight link: https://testflight.apple.com/join/BagBCrzf

## Current Proof

- Current simulator Gemma preflight passed:
  `docs/launch/proof/scout-local-ai-sim-preflight-2026-06-28T22-57-05Z.md`.
- Current TestFlight diagnose-only signing check passed:
  `docs/launch/proof/ios-testflight-attempt-2026-06-28T21-56-50-936Z.md`.
- App Store Connect read-only refresh confirms build `1.0 (28)` is not uploaded
  yet:
  `docs/launch/proof/ios-testflight-build-28-missing-2026-06-28.md`.
- Latest successful native upload remains build `1.0 (27)` from commit
  `c9a49b6974d2f8f32532848e4621ee0d761c4a3c`, which contains suite
  `2026-06-27.2`.

## Boundary

This proof does **not** prove App Store Connect upload, processing, beta review,
Dad Pilot attachment, Dad install/update, a real iPhone Eval Lab run, local
model behavior, or 100/100 reviewed answers.

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
