# Trail Assistant release proof

Use this when deciding whether a mobile build is ready for App Store Connect,
Play Console, TestFlight, or a real-hiker reliance claim.

```bash
cd mobile
npm run release:proof
npm run release:proof -- --strict
```

The default command prints the current proof ledger and exits `0`, even when
manual evidence is still missing. `--strict` exits non-zero until every lane is
proven.

## What the ledger separates

- `code-build`: local scripts and contract tests that can be verified from the repo.
- `native-config`: iOS/Android project metadata, identifiers, privacy manifest,
  screenshots, and app resources.
- `store-metadata`: privacy policy, deletion route, store-copy, screenshots, and
  support/privacy URLs. Some rows stay `manual` until the live mailbox/routes are
  confirmed.
- `manual-account`: Apple Developer, App Store Connect, Android upload keystore,
  Play Console, archive/upload, and internal testing records.
- `device-smoke`: physical iPhone/Android proof for Scout model download and
  inference, GPS permission states, offline kill/relaunch, battery/thermal, and
  accessibility in real field conditions.
- `release-honesty`: docs that keep account/device gaps separate from green
  build/test output.

## Shipping rule

Do not call Trail Assistant store-ready from a green build alone. Store-ready
means:

1. `npm run check`, `npm test`, and `npm run build` pass in `mobile/`.
2. Root `npm test` passes.
3. `npm run release:proof -- --strict` passes.
4. Physical-device smoke evidence exists for the current build.
5. App Store Connect / Play Console metadata, privacy answers, support URL,
   deletion route, signing, archive/upload, and internal testing proof are
   captured for the current build.
