# Dad Scout local AI Eval Lab handoff

Generated at: 2026-07-14T15:36:15.299Z

This file is a generated snapshot. Run `npm run status:scout-local-ai` for live post-commit proof state.

## Current truth

- Eval suite: `dad-local-ai-100` version `2026-06-29.1`, 100 cases, hash `fnv1a32:92815d44`.
- Mobile suite copy matches canonical: yes.
- Eval gates complete: 6/12.
- Suite final-proof app requirement: `1.0 (>= 13)`.
- Target iOS build for Dad Eval Lab: `1.0 (43)`.
- Target build meets suite requirement: yes.
- Recorded Dad Pilot build: `1.0 (43)`.
- Recorded Dad Pilot build meets suite requirement: yes.
- Dad target-build proof: `docs/launch/proof/ios-testflight-build-43-refresh-2026-07-14T15-35.md` (1.0 (43), IN_BETA_TESTING, checked 2026-07-14T15:34:48.669Z).
- Dad target-build gates: 5/5 checked; targetReadyForDad yes.
- Latest local target prep: `docs/launch/proof/ios-testflight-build-35-prep-2026-06-30.md` (1.0 (35), checked 2026-06-30T18:29:02Z; not App Store Connect proof).
- Newer Xcode target pending App Store Connect: no.
- Snapshot checkout SHA: `c12c1092ccf1515ad6494c1409052b2dd798a035`.
- Latest native upload source: `docs/launch/proof/ios-testflight-attempt-2026-07-14T15-27-18-287Z.md` (repo SHA `c12c1092ccf1515ad6494c1409052b2dd798a035` from `.scout-artifacts/ios-testflight/2026-07-14T15-27-18-287Z/01-repo-sha.log`).
- Latest native upload attempt: `docs/launch/proof/ios-testflight-attempt-2026-07-14T15-27-18-287Z.md` (passed, upload requested yes, checked 2026-07-14T15:31:15.368Z).
- Snapshot checkout newer than latest native upload: no.
- Snapshot native app source newer than latest native upload: no.
- Imported full device runs: 0.
- Imported partial device runs: 0.
- Imported suite-compatible full device runs: 0.
- Imported suite-compatible partial device runs: 0.
- Inbox candidate exports: 0.
- Inbox final-ready/partial/blocked: 0/0/0.
- Latest inbox export: none in `data/scout-local-ai/inbox`.
- Dad TestFlight link: https://testflight.apple.com/join/BagBCrzf
- iOS Release signing: team `3CFU9J87A5`, profile `Hoggcountry App Store Connect`.

## Phone build path

- Use now: install/update the latest Dad Pilot TestFlight target `1.0 (43)`.
- Latest-code target: `1.0 (43)` is recorded in Dad Pilot and meets `1.0 (>= 13)`.
- Latest-source proof: latest native upload contains the snapshot checkout.
- Do not count as final proof until: Run 100 is imported from a TestFlight/iPhone export, reviewed 100/100 at 5/5, and strict/stability proof passes.

## Main local test method

- Main local iteration lane: iPhone Simulator Gemma on the Mac mini (`npm run eval:scout-local-ai:ios-sim-gemma -- --limit 100`).
- Current simulator preflight: needs work.
- Simulator preflight evidence: No full simulator/debug local preflight run found; run npm run eval:scout-local-ai:ios-sim-gemma -- --limit 100.
- Simulator full runs: 0; partial runs: 0.
- Boundary: simulator/debug local preflight drives iteration but does not replace final TestFlight/iPhone proof.
- Use this simulator lane before spending Dad TestFlight time, then rerun the handoff.

## Gate checklist

- [x] Versioned 100-question suite: 100 cases, version 2026-06-29.1, hash fnv1a32:92815d44
- [x] Objective coverage across hiker situations: trail-prep=29, daily-hiking-decisions=57, water=18, shelter=16, weather=24, resupply=36, safety=40, gear=33, bible-spiritual-support=10, offline-local-ai-use=22, document-vault-user-docs=3, document-writing-user-docs=3, domain-transfer-readiness=3, confusing-edge-cases=36
- [x] Representative task-class anti-overfit coverage: find-next-water=29, find-next-town-resupply=34, explain-today-difficulty=25, weather-tomorrow-or-stale=36, camp-or-push-decision=38, safety-escalation=61, offline-cache-honesty=34, source-backed-doc-answer=96, summarize-saved-user-docs=3, draft-update-vault-doc=3, compare-options=21, missing-data-honesty=24
- [x] Neighbor prompt-frame generalization coverage: next-water-decision=18(distance-ahead=5/carry-or-skip=7/reliability-or-conflict=6/treatment-or-gear=4), town-resupply-decision=20(arrival-recovery=4/food-carry-resupply=7/availability-contingency=6/offline-before-leaving-town=4), today-difficulty-decision=31(terrain-feature=14/pace-or-mileage=23/weather-interaction=14/body-safety-limit=12), offline-document-agent=22(offline-readiness=22/vault-reading=4/vault-writing=3/confirmation-privacy=3), safety-escalation=36(injury-or-symptoms=11/help-or-communication=7/environmental-threat=13/human-or-location-risk=10), missing-data-honesty=25(stale-cache=10/conflicting-source=5/failure-or-unavailable=10/safe-recovery-action=13)
- [ ] Full-suite tool routing proof: No current full 100-case run has complete required-tool hits and source evidence
- [ ] Simulator/debug local full-suite preflight: No full simulator/debug local preflight run found; run npm run eval:scout-local-ai:ios-sim-gemma -- --limit 100
- [x] Dad Pilot has current suite-required TestFlight build: Target build is available for Dad: target 1.0 (43); suite requires 1.0 (>= 13); Dad Pilot records 1.0 (43); latest native upload suite 2026-06-29.1 (fnv1a32:92815d44); current suite 2026-06-29.1 (fnv1a32:92815d44)
- [ ] Full TestFlight/iPhone Eval Lab run imported: No current full suite-compatible TestFlight/iPhone run found
- [ ] Human review complete at 100/100 5-star: No current full device review is rated 100/100 at 5/5
- [x] Below-5 answers create iteration work: No completed below-5 device reviews yet
- [ ] Strict final device proof passed: No strict TestFlight/iPhone proof run passes
- [ ] Repeated stability proof ready: Need two distinct strict full TestFlight/iPhone runs before stability proof

## Upload readiness

- Xcode Release target: `1.0 (43)` from `mobile/ios/App/App.xcodeproj/project.pbxproj`.
- Signing team/profile: `3CFU9J87A5` / `Hoggcountry App Store Connect`.
- Latest successful native upload proof: `docs/launch/proof/ios-testflight-attempt-2026-07-14T15-27-18-287Z.md` (passed, checked 2026-07-14T15:31:15.368Z).
- Latest native upload attempt: `docs/launch/proof/ios-testflight-attempt-2026-07-14T15-27-18-287Z.md` (passed, checked 2026-07-14T15:31:15.368Z).
- Latest successful native upload repo SHA: `c12c1092ccf1515ad6494c1409052b2dd798a035` from `.scout-artifacts/ios-testflight/2026-07-14T15-27-18-287Z/01-repo-sha.log`.
- Latest native upload suite: `2026-06-29.1` / `fnv1a32:92815d44`.
- Latest native upload contains current suite: yes.
- Snapshot source newer than latest native upload: no.
- Snapshot native app source newer than latest native upload: no.
- App Store Connect API key in latest successful upload proof: yes.
- App Store Connect API key in latest upload attempt: yes.
- Future uploads require Chris/account-bound App Store Connect auth: `APP_STORE_CONNECT_API_KEY_PATH`, `APP_STORE_CONNECT_API_KEY_ID`, and `APP_STORE_CONNECT_API_ISSUER_ID`, or matching `--asc-*` flags.

```sh
npm run ios:testflight -- --upload --team-id 3CFU9J87A5 \
  --asc-key-path ~/.appstoreconnect/private_keys/AuthKey_T272T83N98.p8 \
  --asc-key-id T272T83N98 \
  --asc-issuer-id <issuer-id>
```

After upload/processing, refresh Dad Pilot proof from App Store Connect:

```sh
npm run refresh:testflight-dad-pilot -- --build 43 --app-version 1.0
npm run refresh:testflight-dad-pilot -- --build 43 --app-version 1.0 --attach --submit-review --remove-previous --update-release-evidence
```

## Phone run steps

1. Confirm the phone build path above. For the next suite run, install/update the latest Dad Pilot TestFlight target `1.0 (43)`.
2. On the iPhone, open TestFlight and update Hoggcountry.
3. Open Hoggcountry > Settings > Scout Eval Lab.
4. Confirm the Eval Lab status says `Run 100 available`.
5. Run `Run 3` only as a smoke check if needed; use `Run 100` for real proof.
6. When `Run 100` finishes, tap Share first and send the JSON export back. Use Copy only if Share fails.
7. Keep the phone awake and plugged in during the run; if interrupted, reopen Settings and tap Resume.

## Valid export checklist

Before review starts, the shared JSON should satisfy all of these import-proof checks:

- Suite fields: `suiteId=dad-local-ai-100`, `suiteVersion=2026-06-29.1`, `suiteHash=fnv1a32:92815d44`.
- Result count: `100/100` completed results from `Run 100`, not `Run 3` or an interrupted partial run.
- Evidence lane: `device-on-device-gemma` with `answerOrigin=device-on-device-gemma` answers.
- Native context: TestFlight iPhone install, app build satisfying `1.0 (>= 13)`; current Dad Pilot proof records `1.0 (43)`, while latest Xcode target is `1.0 (43)`.
- Import status: `ready-for-final-intake` from the inspector, then `prepared-for-final-review` from the prepare command.
- Review triage: any provider error, missing required tool, or missing source evidence starts in the review-first queue before normal answer-quality ratings.

If any checklist item fails, do not rate it as final Dad proof. Resume or rerun `Run 100`, then share a fresh JSON export.

## Import and review

Safe one-command path:

```sh
npm run prepare-review:scout-local-ai-device-run -- --run ~/Downloads/<device-run>.json
```

If the shared filename is hard to identify but it is in Downloads:

```sh
npm run prepare-review:scout-local-ai-device-run -- --run latest
```

If you save or drag the shared JSON into `data/scout-local-ai/inbox/`:

```sh
npm run prepare-review:scout-local-ai-device-run -- --run inbox
```

If Dad sends copied JSON text instead of a file:

```sh
npm run receive:scout-local-ai-device-run -- --clipboard
pbpaste | npm run receive:scout-local-ai-device-run -- --stdin
```

If you are waiting for the shared export to land in Downloads or the inbox:

```sh
npm run wait:scout-local-ai-device-run
npm run wait:scout-local-ai-device-run -- --timeout-ms 300000 --poll-ms 10000
```

If the export may arrive as copied text in the macOS clipboard, opt into clipboard watching:

```sh
npm run wait:scout-local-ai-device-run:all
npm run wait:scout-local-ai-device-run -- --source clipboard
npm run wait:scout-local-ai-device-run -- --source all
```

Expanded manual path:

```sh
npm run inspect:scout-local-ai-device-run -- --run ~/Downloads/<device-run>.json
npm run intake:scout-local-ai-device-run -- --run ~/Downloads/<device-run>.json
npm run review-status:scout-local-ai -- --run data/scout-local-ai/device-runs/<run-id>.json --review data/scout-local-ai/reviews/<run-id>.review.json --packet data/scout-local-ai/review-packets/<run-id>.review.md
npm run apply-review:scout-local-ai -- --packet data/scout-local-ai/review-packets/<run-id>.review.md --review data/scout-local-ai/reviews/<run-id>.review.json
npm run finalize-review:scout-local-ai -- --packet data/scout-local-ai/review-packets/<run-id>.review.md --review data/scout-local-ai/reviews/<run-id>.review.json
```

## Final proof commands

```sh
npm run verify:scout-local-ai-device-proof -- --run data/scout-local-ai/device-runs/<run-id>.json --review data/scout-local-ai/reviews/<run-id>.review.json
npm run verify:scout-local-ai-stability-proof -- --pairs data/scout-local-ai/device-runs/<run-a>.json:data/scout-local-ai/reviews/<run-a>.review.json,data/scout-local-ai/device-runs/<run-b>.json:data/scout-local-ai/reviews/<run-b>.review.json
```

## Next action

Run npm run eval:scout-local-ai and fix any missing required-tool hits before Dad spends time on phone review.

## Boundary

This handoff does not prove Dad readiness by itself. Final readiness still requires a full current-suite TestFlight/iPhone `device-on-device-gemma` export, human review with all 100 answers rated 5/5, strict device proof, and repeated stability proof.
