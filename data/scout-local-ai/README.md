# Scout local AI eval loop

Goal: make Dad's on-device Scout answer 100 real hiker questions at 5/5 quality before we treat the local AI flow as pilot-ready.

The loop:

1. Keep the 100-question suite in `dad-local-ai-100.json`.
2. Run the suite:

   ```sh
   npm run eval:scout-local-ai
   ```

3. For quick routing smoke tests, use the default scaffold lane. It exercises Scout tools and source routing, but it is not model proof.
4. For local model proof, set a command bridge that reads JSON from stdin and returns either raw answer text or JSON like `{ "text": "...", "truncated": false }`:

   ```sh
   SCOUT_LOCAL_AI_COMMAND="node path/to/local-model-bridge.mjs" npm run eval:scout-local-ai
   ```

5. Create or update the review file:

   ```sh
   npm run review:scout-local-ai -- --run data/scout-local-ai/runs/<run-id>.json
   ```

6. Rate every answer 1-5. Any answer below 5 needs failure categories and an improvement task.
7. Improve the responsible layer: data table, source skill, tool routing, prompt, UI recovery state, or local model path.
8. Re-run the full suite plus the regression cases until all 100 are 5/5.

Proof lanes stay separate:

- `scaffold-not-model`: tool/source-routing smoke only.
- `external-local-model-command`: local model bridge proof, useful before device automation.
- `real TestFlight/iPhone`: final Dad-readiness proof.

To see the current loop state without blending those lanes, run:

```sh
npm run status:scout-local-ai
```

This checks the canonical suite, embedded mobile suite copy, current saved
runs/reviews, strict device-proof candidates, and the exact next action. Use it
after every import/review/iteration pass so scaffold routing runs, partial
reviews, and missing TestFlight/iPhone proof stay visually separate.

The installed mobile app reads the suite from `mobile/static/scout/dad-local-ai-100.json`. The suite carries a version and every run export carries a deterministic suite hash, so stale iPhone exports fail intake/final proof instead of being mixed with the current 100-question set. After editing the canonical suite, bump the top-level `version` and run:

```sh
npm run sync:scout-local-ai-suite
```

The suite test fails if the embedded mobile copy drifts.

## Dad TestFlight / iPhone intake

When Dad exports a real device run from the in-app Eval Lab, import it before rating:

```sh
npm run intake:scout-local-ai-device-run -- --run ~/Downloads/<device-run>.json
```

That command verifies the export is `device-on-device-gemma` evidence, copies it
to `data/scout-local-ai/device-runs/`, creates a JSON review file in
`data/scout-local-ai/reviews/`, and creates a readable review packet in
`data/scout-local-ai/review-packets/`. These folders are ignored by git because
they hold raw model transcripts and human review notes. The review JSON is
self-contained for scoring: every case keeps the full answer plus confidence,
mode/provider, required tool hits, actual tool invocations, receipts, required
confirmations, safety flags, context used, failure mode, bridge diagnostics, and
the expected-trait / safety-caveat checklists that must be marked before a 5/5
rating is valid. Use the Markdown review packet as the easier reading surface
for device exports, but rate from the full evidence rather than the short answer
preview.

For a quick `Run 3` smoke export, add `--allow-partial`. Do not use partial runs
as final proof.

The in-app Eval Lab autosaves each completed question locally on the phone. If a
100-question run is interrupted, reopen Settings, tap Resume, and export after it
finishes. Export also works after reopening the app because the last device run
is restored from local storage.

The Eval Lab shows a final-proof preflight before Dad runs the suite. `Run 3`
stays available as an iOS smoke check once the local model is ready, but `Run
100` is reserved for a ready on-device iOS TestFlight install so a debug or web
run cannot be mistaken for final Dad proof.

On iPhone, use Share first so the JSON can be sent through the native share
sheet. If that is unavailable, use Copy and paste the JSON into a file or note.
Download remains available as a browser fallback.

After filling the review JSON ratings and tasks:

```sh
npm run review:scout-local-ai -- --run data/scout-local-ai/device-runs/<run-id>.json --review data/scout-local-ai/reviews/<run-id>.review.json
```

That writes a machine-readable backlog item for every answer rated below 5 and
a Markdown iteration backlog grouped for the next data/tool/prompt/UI fix pass.
The review command fails instead of writing backlog files if any below-5 rating
is missing failure categories or an improvement task. It also fails while any
case is unrated so an unfinished review cannot look like a clean 5/5 run. Use
`--allow-unrated` only when deliberately producing a partial status packet; the
result will include explicit unrated case entries.

For a `5` rating, every `traitChecks` and `safetyCaveatChecks` item in the
review JSON must have `passed: true`. Leave failed or uncertain checks unpassed
and rate below 5 with a concrete improvement task.

Plan the next fix pass from one or more completed backlogs:

```sh
npm run plan:scout-local-ai-iteration -- --backlog data/scout-local-ai/backlog/<run-id>.backlog.json
```

That writes an ignored JSON/Markdown iteration plan under
`data/scout-local-ai/iterations/`, groups misses by responsible layer, gives the
regression case command to rerun, and fails if a below-5 item is uncategorized or
lacks a concrete improvement task. Use the plan to fix the data, tool routing,
prompt, safety wording, UI recovery state, or local-model lane named by the
backlog; do not close an iteration by changing expected answer wording only.

After applying a fix and rerunning the plan's regression cases, verify that the
iteration really closed:

```sh
npm run verify:scout-local-ai-iteration -- --plan data/scout-local-ai/iterations/<plan-id>.iteration.json --run data/scout-local-ai/runs/<rerun-id>.json --review data/scout-local-ai/reviews/<rerun-id>.review.json
```

That writes an ignored resolution report under `data/scout-local-ai/iterations/`
and fails if any planned case is still below 5, any planned case still missed a
required tool, any below-5 review item remains, or a 5/5 case still carries stale
failure metadata. Add `--require-full-suite` when the rerun is meant to prove
the full 100-case pass. A passing iteration resolution is useful progress, not
final Dad readiness; final readiness still requires the strict device gates
below.

When a full device run has been reviewed and every case is honestly 5/5, run the
strict final gate:

```sh
npm run verify:scout-local-ai-device-proof -- --run data/scout-local-ai/device-runs/<run-id>.json --review data/scout-local-ai/reviews/<run-id>.review.json
```

This fails unless the run is a full 100-case `device-on-device-gemma` Eval Lab
run from the current suite version/hash, every required tool expectation was hit,
the required tools are backed by actual recorded `toolInvocations` rather than
summary-only flags, every review case is rated `5`, native iOS app metadata is
present (`com.hoggcountry.trailassistant`, app version/build,
`native.platform = ios`, `installSource.type = testflight`, runtime configured),
and no stale failure categories or improvement tasks remain. It also requires
every expected-trait and safety-caveat rubric item to be explicitly checked as
passed. Passing writes an ignored proof summary under
`data/scout-local-ai/final-proof/`.

For final consistency proof, require at least two separate full TestFlight/iPhone
runs to pass the same strict gate:

```sh
npm run verify:scout-local-ai-stability-proof -- --pairs data/scout-local-ai/device-runs/<run-a>.json:data/scout-local-ai/reviews/<run-a>.review.json,data/scout-local-ai/device-runs/<run-b>.json:data/scout-local-ai/reviews/<run-b>.review.json
```

That fails unless every case is 5/5 in each run, every run is from the installed
iOS Eval Lab device lane, and every run hit all required tool expectations.
