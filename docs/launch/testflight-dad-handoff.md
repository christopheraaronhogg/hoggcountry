# Dad TestFlight Handoff

Goal: get Dad a real iOS TestFlight install for the native Hoggcountry app, then
use that phone to produce the final Scout local-AI `Run 100` export.

## Current State

- Dad Pilot is live through external TestFlight:
  `https://testflight.apple.com/join/BagBCrzf`.
- App Store Connect app id `6782505691` and bundle id
  `com.hoggcountry.trailassistant` are verified.
- Build `1.0 (27)` is live in Dad Pilot, Apple beta review is approved, and App
  Store Connect reports external state `IN_BETA_TESTING`, but that upload
  contains eval suite `2026-06-27.2`.
- Latest native upload proof for build `27`:
  `docs/launch/proof/ios-testflight-attempt-2026-06-28T03-43-37-454Z.md`.
- Dad Pilot/App Store Connect proof for build `27`:
  `docs/launch/proof/ios-testflight-build-27-2026-06-28.md`.
- Build `26` was removed from Dad Pilot only after build `27` was attached and
  externally available.
- The local Xcode target is build `28`, which is the next upload target.
- Current-suite local build `28` prep proof:
  `docs/launch/proof/ios-testflight-build-28-prep-current-suite-2026-06-28.md`.
- Read-only App Store Connect refresh confirms build `28` is not uploaded yet:
  `docs/launch/proof/ios-testflight-build-28-missing-2026-06-28.md`.
- Dad should not run the current `Run 100` yet. The current suite is
  `2026-06-28.3`, so build `28` needs to be uploaded, attached to Dad Pilot,
  and verified through TestFlight first.
- The remaining goal is not TestFlight availability. It is a real
  TestFlight/iPhone `Run 100` export, import, human review, and all 100 answers
  rated 5/5 with strict device proof.

## Primary Local Regression

Use the Mac mini iPhone Simulator Gemma run as the default local regression
method before spending Dad's time on another phone run:

```bash
npm run eval:scout-local-ai:ios-sim-gemma -- --limit 100
```

For a focused diagnostic rerun through a known case boundary:

```bash
npm run eval:scout-local-ai:ios-sim-gemma -- --cases DLA-007,DLA-020,DLA-090
```

This simulator path is the main local iteration loop for Scout answer quality,
tool routing, and local Gemma behavior. It is not final Dad proof because the
install source is debug/simulator, not TestFlight on a physical iPhone.

After a simulator or device export is imported, the intake flow writes an
answer-quality scan and embeds it in the review packet:

```bash
npm run prepare-review:scout-local-ai-device-run -- --run inbox
```

The scan is the first triage pass for likely answer-quality defects. It does
not replace the full human 1-5 review or strict TestFlight/iPhone proof.

## Dad Instructions

Use this generated message when asking Dad for the real device run:

```bash
npm run message:scout-local-ai-dad
```

Current message summary:

1. Wait until Chris confirms build `1.0 (28)` is available in TestFlight.
2. Open TestFlight and update Hoggcountry. If it only says Open after Chris's
   confirmation, that is fine.
3. Open Hoggcountry > Settings > Scout Eval Lab.
4. Make sure the status says `TestFlight ready`.
5. Keep the phone plugged in and awake, then tap `Run 100`.
6. `Run 3` is only a quick smoke check; `Run 100` is the real proof.
7. When it finishes, tap Share and send the JSON file to Chris by Messages or
   AirDrop.
8. If Share does not send a file, tap Copy and send the copied text to Chris.
9. If it gets interrupted, reopen Hoggcountry > Settings > Scout Eval Lab and
   tap Resume, then Share when it finishes.

## Chris Intake

Save or drag Dad's shared JSON into `data/scout-local-ai/inbox/`, then prepare
the review with:

```bash
npm run prepare-review:scout-local-ai-device-run -- --run inbox
```

If the shared file lands in macOS Downloads, let the prep command select the
newest likely Scout export:

```bash
npm run prepare-review:scout-local-ai-device-run -- --run latest
```

If Dad sends copied JSON text or it lands on the macOS clipboard:

```bash
npm run receive:scout-local-ai-device-run -- --clipboard
```

For pasted/stdin JSON:

```bash
pbpaste | npm run receive:scout-local-ai-device-run -- --stdin
```

If Chris is waiting while Dad sends the export, the guarded watcher can stay
open and prepare the review automatically when a final-ready `Run 100` JSON
lands in the repo inbox or Downloads:

```bash
npm run wait:scout-local-ai-device-run
```

For a bounded check that reports inbox/Downloads status and exits if Dad has
not sent the file yet:

```bash
npm run wait:scout-local-ai-device-run -- --timeout-ms 300000 --poll-ms 10000
```

## Review Loop

Preview review progress without writing the review JSON:

```bash
npm run review-status:scout-local-ai -- --run data/scout-local-ai/device-runs/<run-id>.json --review data/scout-local-ai/reviews/<run-id>.review.json --packet data/scout-local-ai/review-packets/<run-id>.review.md
```

For a case-by-case pass, add `--next` so it opens the next unrated answer:

```bash
npm run review-status:scout-local-ai -- --run data/scout-local-ai/device-runs/<run-id>.json --review data/scout-local-ai/reviews/<run-id>.review.json --packet data/scout-local-ai/review-packets/<run-id>.review.md --next
```

Record an answer only after it has actually earned the rating:

```bash
npm run rate-case:scout-local-ai -- --packet data/scout-local-ai/review-packets/<run-id>.review.md --review data/scout-local-ai/reviews/<run-id>.review.json --case DLA-001 --rating 5 --mark-all-pass
```

Several already-reviewed answers can be recorded as an explicit human-reviewed
batch:

```bash
npm run rate-case:scout-local-ai -- --packet data/scout-local-ai/review-packets/<run-id>.review.md --review data/scout-local-ai/reviews/<run-id>.review.json --cases DLA-001,DLA-002,DLA-003 --rating 5 --notes "Dad-ready answer." --mark-all-pass
```

The batch form still validates every selected case before writing the packet.
Do not use it as an auto-pass.

## Future Upload Path

If mobile/native source changes before Dad runs the suite, bump the iOS build
number and upload a new TestFlight build:

```bash
npm run ios:testflight -- --upload \
  --team-id 3CFU9J87A5 \
  --asc-key-path ~/.appstoreconnect/private_keys/AuthKey_T272T83N98.p8 \
  --asc-key-id T272T83N98 \
  --asc-issuer-id <issuer-id>
```

After App Store Connect shows the target build as valid, attach it to Dad Pilot,
submit beta review if needed, remove the older build only after the new build is
approved/available, and refresh the local release ledger:

```bash
npm run refresh:testflight-dad-pilot -- \
  --build <next-build> \
  --app-version 1.0 \
  --attach \
  --submit-review \
  --wait-review \
  --remove-previous \
  --update-release-evidence \
  --proof-out docs/launch/proof/ios-testflight-build-<next-build>-$(date +%F).md
```

Run `npm --prefix mobile run cap:sync:ios` before archiving if web/mobile source
changed after the last successful upload.

## Proof Boundaries

- Account/TestFlight proof: build `1.0 (27)` is attached to Dad Pilot and
  externally available, but it is stale for the current suite.
- Native upload proof: build `27` was archived, exported, and uploaded from the
  native app source in commit `c9a49b6974d2f8f32532848e4621ee0d761c4a3c`.
- Previous Dad Pilot upload: build `25` was archived and uploaded from commit
  `b70dff76a8c7b7fd3e2653be86a37c77a0c2f85d`, then replaced by build `26`;
  build `26` was then replaced by build `27`.
- Latest-source TestFlight proof: pending. Local Xcode target `1.0 (28)` must
  be uploaded and attached to Dad Pilot before current-suite phone proof.
- Current repo proof: later commits may add docs/tests/proof. Check
  `npm run status:scout-local-ai` for whether native app source changed after
  the latest upload.
- Device/local-AI proof: still pending until a TestFlight iPhone exports a full
  current-suite `Run 100`.
- Dad-ready proof: requires the full `Run 100` export to import cleanly, every
  answer to be reviewed 5/5, strict device proof to pass, and repeated stability
  proof to pass.
