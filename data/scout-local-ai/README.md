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

The installed mobile app reads the suite from `mobile/static/scout/dad-local-ai-100.json`. After editing the canonical suite, run:

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
they hold raw model transcripts and human review notes.

For a quick `Run 3` smoke export, add `--allow-partial`. Do not use partial runs
as final proof.

The in-app Eval Lab autosaves each completed question locally on the phone. If a
100-question run is interrupted, reopen Settings, tap Resume, and export after it
finishes. Export also works after reopening the app because the last device run
is restored from local storage.

On iPhone, use Share first so the JSON can be sent through the native share
sheet. If that is unavailable, use Copy and paste the JSON into a file or note.
Download remains available as a browser fallback.

After filling the review JSON ratings and tasks:

```sh
npm run review:scout-local-ai -- --run data/scout-local-ai/device-runs/<run-id>.json --review data/scout-local-ai/reviews/<run-id>.review.json
```

That writes a backlog item for every answer rated below 5.

When a full device run has been reviewed and every case is honestly 5/5, run the
strict final gate:

```sh
npm run verify:scout-local-ai-device-proof -- --run data/scout-local-ai/device-runs/<run-id>.json --review data/scout-local-ai/reviews/<run-id>.review.json
```

This fails unless the run is a full 100-case `device-on-device-gemma` Eval Lab
run, every required tool expectation was hit, every review case is rated `5`,
and no stale failure categories or improvement tasks remain. Passing writes an
ignored proof summary under `data/scout-local-ai/final-proof/`.
