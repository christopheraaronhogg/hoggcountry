# Dad Scout local AI Eval Lab handoff

Generated at: 2026-06-29T01:14:20.746Z

## Current truth

- Eval suite: `dad-local-ai-100` version `2026-06-28.5`, 100 cases, hash `fnv1a32:741b2381`.
- Mobile suite copy matches canonical: yes.
- Eval gates complete: 5/10.
- Suite final-proof app requirement: `1.0 (>= 13)`.
- Target iOS build for Dad Eval Lab: `1.0 (28)`.
- Target build meets suite requirement: yes.
- Recorded Dad Pilot build: `1.0 (27)`.
- Recorded Dad Pilot build meets suite requirement: yes.
- Dad target-build proof: `docs/launch/proof/ios-testflight-build-28-missing-2026-06-28.md` (1.0 (28), <missing>, checked 2026-06-28T21:56:15.979Z).
- Dad target-build gates: 0/5 checked; targetReadyForDad no.
- Latest local target prep: `docs/launch/proof/ios-testflight-build-28-prep-current-suite-2026-06-29.md` (1.0 (28), checked 2026-06-29T00:44:40Z; not App Store Connect proof).
- Newer Xcode target pending App Store Connect: yes.
- Current checkout SHA: `e9a5be2e9ce50cedd2f746ecb3cee8e7d636c377`.
- Latest native upload source: `docs/launch/proof/ios-testflight-attempt-2026-06-28T03-43-37-454Z.md` (repo SHA `c9a49b6974d2f8f32532848e4621ee0d761c4a3c` from `.scout-artifacts/ios-testflight/2026-06-28T03-43-37-454Z/01-repo-sha.log`).
- Latest native upload attempt: `docs/launch/proof/ios-testflight-attempt-2026-06-28T03-43-37-454Z.md` (passed, upload requested yes, checked 2026-06-28T03:45:01.421Z).
- Current checkout newer than latest native upload: yes.
- Current native app source newer than latest native upload: yes.
- Imported full device runs: 3.
- Imported partial device runs: 0.
- Imported suite-compatible full device runs: 0.
- Imported suite-compatible partial device runs: 0.
- Inbox candidate exports: 0.
- Inbox final-ready/partial/blocked: 0/0/0.
- Latest inbox export: none in `data/scout-local-ai/inbox`.
- Dad TestFlight link: https://testflight.apple.com/join/BagBCrzf
- iOS Release signing: team `3CFU9J87A5`, profile `Hoggcountry App Store Connect`.

## Phone build path

- Use now: Wait for current-suite TestFlight upload before asking Dad for Run 100.
- Latest-code target: `1.0 (28)` still needs upload/refresh proof with the current eval suite.
- Latest-source proof: latest native upload contains suite 2026-06-27.2 (fnv1a32:b79f13dd), not current suite 2026-06-28.5 (fnv1a32:741b2381); upload and refresh the target build before asking Dad for Run 100.
- Do not count as final proof until: Dad Pilot/TestFlight proof and the exported run both show app build satisfying `1.0 (>= 13)` with the current eval suite.

## Main local test method

- Main local iteration lane: iPhone Simulator Gemma on the Mac mini (`npm run eval:scout-local-ai:ios-sim-gemma -- --limit 100`).
- Current simulator preflight: clean.
- Simulator preflight evidence: Latest simulator/debug local preflight device-local-ai-20260629T005630Z is clean: 100/100 cases, complete tools/source evidence, app 1.0 (28), install=debug, model=gemma-4-E2B-it-litert-lm.
- Simulator full runs: 3; partial runs: 0.
- Boundary: simulator/debug local preflight drives iteration but does not replace final TestFlight/iPhone proof.
- Latest simulator Run 100: `device-local-ai-20260629T005630Z` (100/100 cases, tools complete 100/100, sources complete 100/100, answer scan clean with 0 flagged).
- Final-proof mismatch by design: device-local-ai-20260629T005630Z (install=debug, expected testflight).

> Important: the recorded Dad Pilot build is not ready for this suite. Do not treat the final Eval Lab run as valid until App Store Connect shows Dad Pilot on the target build, or a current full TestFlight/iPhone export proves the target build was installed.

## Gate checklist

- [x] Versioned 100-question suite: 100 cases, version 2026-06-28.5, hash fnv1a32:741b2381
- [x] Objective coverage across hiker situations: trail-prep=29, daily-hiking-decisions=57, water=18, shelter=16, weather=24, resupply=36, safety=40, gear=33, bible-spiritual-support=10, offline-local-ai-use=22, document-vault-user-docs=3, document-writing-user-docs=3, domain-transfer-readiness=3, confusing-edge-cases=36
- [x] Full-suite tool routing proof: 3 current full run(s) with all required tools hit and source evidence recorded
- [x] Simulator/debug local full-suite preflight: Latest simulator/debug local preflight device-local-ai-20260629T005630Z is clean: 100/100 cases, complete tools/source evidence, app 1.0 (28), install=debug, model=gemma-4-E2B-it-litert-lm
- [ ] Dad Pilot has current suite-required TestFlight build: Latest TestFlight upload does not contain the current eval suite: target 1.0 (28); suite requires 1.0 (>= 13); Dad Pilot records 1.0 (27); latest native upload suite 2026-06-27.2 (fnv1a32:b79f13dd); current suite 2026-06-28.5 (fnv1a32:741b2381)
- [ ] Full TestFlight/iPhone Eval Lab run imported: No current full suite-compatible TestFlight/iPhone run found; 3 full device-on-device-gemma run(s) failed final-proof context: device-local-ai-20260628T235310Z (install=debug, expected testflight); device-local-ai-20260629T001151Z (install=debug, expected testflight); device-local-ai-20260629T005630Z (install=debug, expected testflight)
- [ ] Human review complete at 100/100 5-star: No current full device review is rated 100/100 at 5/5
- [x] Below-5 answers create iteration work: No completed below-5 device reviews yet
- [ ] Strict final device proof passed: No strict TestFlight/iPhone proof run passes
- [ ] Repeated stability proof ready: Need two distinct strict full TestFlight/iPhone runs before stability proof

## Upload readiness

- Xcode Release target: `1.0 (28)` from `mobile/ios/App/App.xcodeproj/project.pbxproj`.
- Signing team/profile: `3CFU9J87A5` / `Hoggcountry App Store Connect`.
- Latest successful native upload proof: `docs/launch/proof/ios-testflight-attempt-2026-06-28T03-43-37-454Z.md` (passed, checked 2026-06-28T03:45:01.421Z).
- Latest native upload attempt: `docs/launch/proof/ios-testflight-attempt-2026-06-28T03-43-37-454Z.md` (passed, checked 2026-06-28T03:45:01.421Z).
- Latest successful native upload repo SHA: `c9a49b6974d2f8f32532848e4621ee0d761c4a3c` from `.scout-artifacts/ios-testflight/2026-06-28T03-43-37-454Z/01-repo-sha.log`.
- Latest native upload suite: `2026-06-27.2` / `fnv1a32:b79f13dd`.
- Latest native upload contains current suite: no.
- Current source newer than latest native upload: yes.
- Current native app source newer than latest native upload: yes.
- Latest-source upload note: upload target build `1.0 (28)`; bump again only if App Store Connect already has build `28`.
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
npm run refresh:testflight-dad-pilot -- --build 28 --app-version 1.0
npm run refresh:testflight-dad-pilot -- --build 28 --app-version 1.0 --attach --submit-review --remove-previous --update-release-evidence
```

## Phone run steps

1. Confirm the phone build path above. For the next suite run, Wait for current-suite TestFlight upload before asking Dad for Run 100.
2. On the iPhone, open TestFlight and update Hoggcountry.
3. Open Hoggcountry > Settings > Scout Eval Lab.
4. Confirm the Eval Lab status says `TestFlight ready`.
5. Run `Run 3` only as a smoke check if needed; use `Run 100` for real proof.
6. When `Run 100` finishes, tap Share first and send the JSON export back. Use Copy only if Share fails.
7. Keep the phone awake and plugged in during the run; if interrupted, reopen Settings and tap Resume.

## Valid export checklist

Before review starts, the shared JSON should satisfy all of these import-proof checks:

- Suite fields: `suiteId=dad-local-ai-100`, `suiteVersion=2026-06-28.5`, `suiteHash=fnv1a32:741b2381`.
- Result count: `100/100` completed results from `Run 100`, not `Run 3` or an interrupted partial run.
- Evidence lane: `device-on-device-gemma` with `answerOrigin=device-on-device-gemma` answers.
- Native context: TestFlight iPhone install, app build satisfying `1.0 (>= 13)`; current Dad Pilot proof records `1.0 (27)`, while latest Xcode target is `1.0 (28)`.
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

Upload and attach target iOS build 1.0 (28) to Dad Pilot first; release evidence currently records Dad Pilot on 1.0 (27), while the suite requires 1.0 (>= 13). After App Store Connect shows the target build through the TestFlight link, update the iPhone, open Settings > Scout Eval Lab, run Run 100, Share the JSON, then prepare review with npm run prepare-review:scout-local-ai-device-run -- --run inbox.

## Boundary

This handoff does not prove Dad readiness by itself. Final readiness still requires a full current-suite TestFlight/iPhone `device-on-device-gemma` export, human review with all 100 answers rated 5/5, strict device proof, and repeated stability proof.
