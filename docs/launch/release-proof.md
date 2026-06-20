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

The manual evidence ledger lives at `docs/launch/release-evidence.json`.
Pending rows are only reminders; they do not satisfy a gate. If a manual proof
attempt finds a real issue, change that row to `blocked` with a dated artifact
so the release ledger shows a blocker instead of a vague manual reminder.

To clear a manual row, change that row to `verified` and include:

```json
{
  "status": "verified",
  "verifiedAt": "2026-06-20T18:46:11Z",
  "verifiedBy": "Chris Hogg",
  "summary": "What was proven for this exact build.",
  "files": ["docs/launch/proof/example.txt"],
  "urls": ["https://example.com/account-proof"],
  "commands": ["the command and result used as proof"]
}
```

At least one `files`, `urls`, or `commands` reference is required for
`verified` rows. Referenced files must exist or the gate becomes a blocker.

Supported evidence statuses:

- `pending`: reminder only; the release proof row keeps its default status.
- `blocked`: a proof attempt found a real release blocker; the row reports as
  `blocker` until fixed.
- `verified`: the proof exists and references at least one file, URL, or
  command; the row reports as `pass`.

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
