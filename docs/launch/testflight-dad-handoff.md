# Dad TestFlight Handoff

Goal: get Dad a real iOS TestFlight install for the native Hoggcountry app, then
use that phone to produce the final Scout local-AI `Run 100` export.

## Current State

- Dad Pilot is live through external TestFlight:
  `https://testflight.apple.com/join/BagBCrzf`.
- App Store Connect app id `6782505691` and bundle id
  `com.hoggcountry.trailassistant` are verified.
- Build `1.0 (19)` is live in Dad Pilot, Apple beta review is approved, and App
  Store Connect reports external state `IN_BETA_TESTING`.
- Latest native upload proof for build `19`:
  `docs/launch/proof/ios-testflight-attempt-2026-06-27T12-39-12-099Z.md`.
- Dad Pilot/App Store Connect proof for build `19`:
  `docs/launch/proof/ios-testflight-build-19-2026-06-27.md`.
- Build `20` was uploaded from commit `54fe3f9431d5973a2de6e0773604ad846be2dea3`
  as an intermediate, but later Scout chat scroll geometry changed before Dad
  Pilot refresh.
- The local Xcode target is now build `21` so the latest Scout chat transcript
  polish can be uploaded next. Build `21` is not Dad Pilot proof until App Store
  Connect processing and Dad Pilot refresh both pass.
- Dad can still run `Run 100` on build `19` for diagnosis because the suite
  allows `1.0 (>= 13)`. Latest-source phone proof should wait for build `21`.
- The remaining goal is not TestFlight availability. It is a real
  TestFlight/iPhone `Run 100` export, import, human review, and all 100 answers
  rated 5/5 with strict device proof.

## Dad Instructions

Use this generated message when asking Dad for the real device run:

```bash
npm run message:scout-local-ai-dad
```

Current message summary:

1. Open TestFlight and update Hoggcountry. If it only says Open, that is fine.
2. Open Hoggcountry > Settings > Scout Eval Lab.
3. Make sure the status says `TestFlight ready`.
4. Keep the phone plugged in and awake, then tap `Run 100`.
5. `Run 3` is only a quick smoke check; `Run 100` is the real proof.
6. When it finishes, tap Share and send the JSON file to Chris by Messages or
   AirDrop.
7. If Share does not send a file, tap Copy and send the copied text to Chris.
8. If it gets interrupted, reopen Hoggcountry > Settings > Scout Eval Lab and
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

- Account/TestFlight proof: build `1.0 (19)` is attached to Dad Pilot and
  externally available.
- Native upload proof: build `19` was archived, exported, and uploaded from the
  native app source in commit `2628c58dbefd9fe5f33f0e0ecd39bf259bfe4ad1`.
- Intermediate upload: build `20` was archived and uploaded from commit
  `54fe3f9431d5973a2de6e0773604ad846be2dea3`, but it is not the latest-source
  Dad Pilot target after the subsequent Scout chat scroll geometry change.
- Latest-source candidate: local Xcode target `1.0 (21)` is the next candidate,
  but it still
  needs upload, App Store Connect processing, and Dad Pilot refresh.
- Current repo proof: later commits may add docs/tests/proof. Check
  `npm run status:scout-local-ai` for whether native app source changed after
  the latest upload.
- Device/local-AI proof: still pending until a TestFlight iPhone exports a full
  current-suite `Run 100`.
- Dad-ready proof: requires the full `Run 100` export to import cleanly, every
  answer to be reviewed 5/5, strict device proof to pass, and repeated stability
  proof to pass.
