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
runs/reviews, strict device-proof candidates, objective coverage across the
requested hiker situations, and the exact next action. Use it after every
import/review/iteration pass so scaffold routing runs, partial reviews, and
missing TestFlight/iPhone proof stay visually separate. The coverage gate fails
if the suite stops covering trail prep, daily hiking decisions, water, shelters,
weather, resupply, safety, gear, Bible/spiritual support, offline/local-model
use, or confusing edge cases at the expected minimum depth.
It also checks `data/scout-local-ai/inbox/` and reports whether Dad's shared
iPhone JSON handoff folder is empty, has ignored/unreadable files, or has a
newest likely Scout Eval Lab export ready for `--run inbox` inspection.
The status output also tracks below-5 review debt explicitly: a completed
below-5 review is marked as needing backlog generation, needing an iteration
plan, or already planned, so improvement work cannot hide behind the broader
"review is not 100/100" gate.

To audit the whole original goal against current evidence, run:

```sh
npm run audit:scout-local-ai-goal
```

That report maps the requested success criteria to the current suite, runner,
review, iteration, TestFlight, and strict device-proof evidence. It should stay
`Goal complete: no` until the current TestFlight build is available for Dad and
at least two full iPhone Eval Lab runs pass strict 100/100 5-star proof.

Before handing the phone to Dad or sending Chris the next TestFlight steps,
generate the current one-page phone/run/review checklist:

```sh
npm run handoff:scout-local-ai-dad
```

It combines the eval status with the recorded Dad Pilot/TestFlight build truth
so old TestFlight builds, the current target build, scaffold routing proof, and
final iPhone proof do not get blended.

The installed mobile app reads the suite from `mobile/static/scout/dad-local-ai-100.json`. The suite carries a version, a deterministic hash, and the final app build requirement, so stale iPhone exports fail intake/final proof instead of being mixed with the current 100-question set. After editing the canonical suite, bump the top-level `version` and run:

```sh
npm run sync:scout-local-ai-suite
```

The suite test fails if the embedded mobile copy drifts.

## Dad TestFlight / iPhone intake

When Dad exports a real device run from the in-app Eval Lab, inspect it before
importing or rating:

```sh
npm run inspect:scout-local-ai-device-run -- --run ~/Downloads/<device-run>.json
```

The inspector is read-only. It classifies the export as final-intake ready,
partial/smoke diagnostic, stale-suite, wrong proof context, or invalid, then
prints the exact next command. Use it first when a shared JSON arrives so a
debug build, stale suite, interrupted `Run 100`, or wrong-lane export does not
turn into wasted review work.

For the normal Dad JSON handoff, save or drag the shared iPhone JSON into
`data/scout-local-ai/inbox/` and run:

```sh
npm run prepare-review:scout-local-ai-device-run -- --run inbox
```

Use `--inbox-dir <folder>` when staging the shared JSON somewhere else. The
selected file still goes through the same read-only inspection gate before any
review files are written.

If the export landed in Downloads instead, pass the explicit file:

```sh
npm run prepare-review:scout-local-ai-device-run -- --run ~/Downloads/<device-run>.json
```

If the Downloads filename is awkward, let the command select the newest likely
Scout Eval Lab JSON first:

```sh
npm run prepare-review:scout-local-ai-device-run -- --run latest
```

Use `--downloads-dir <folder>` with `--run latest` when the shared JSON is in a
different folder.

That command runs the read-only inspection first, imports only a valid final
device export, creates the review JSON and Markdown packet, and then prints the
read-only review-status report. It refuses partial exports unless
`--allow-partial` is explicit, so a smoke/interrupted run cannot be mistaken for
final proof.

When the inspector says the export is ready, import it before rating:

```sh
npm run intake:scout-local-ai-device-run -- --run ~/Downloads/<device-run>.json
```

That command verifies the export is `device-on-device-gemma` evidence, copies it
to `data/scout-local-ai/device-runs/`, creates a JSON review file in
`data/scout-local-ai/reviews/`, and creates a readable review packet in
`data/scout-local-ai/review-packets/`. These folders are ignored by git because
they hold raw model transcripts and human review notes. Full `Run 100` intake
also validates the native proof context before any review work is created:
Settings Eval Lab surface, iOS native shell, `com.hoggcountry.trailassistant`,
TestFlight install source, suite-required app version/build, configured runtime,
and model id. If Dad shares an old build, debug install, web/PWA run, or otherwise
wrong-lane export, intake should fail before anyone rates 100 unusable answers.
If the run is in the right lane but Scout truthfully missed tools, lacked source
receipts, returned low-confidence answers, or recorded provider errors, intake
keeps those failures reviewable and surfaces warnings in the packet so the
below-5 ratings can become concrete iteration tasks.
The review JSON is
self-contained for scoring: every case keeps the full answer plus confidence,
mode/provider, required tool hits, actual tool invocations, receipts, required
confirmations, safety flags, context used, failure mode, bridge diagnostics, and
the expected-trait / safety-caveat checklists that must be marked before a 5/5
rating is valid. A 5/5 rating must also match the recorded run evidence: no
empty answer, no provider error, no missing required tools, and actual tool
invocations must support the required tool hits. Use the Markdown review packet
as the easier reading surface
for device exports, but rate from the full evidence rather than the short answer
preview. The packet includes the rating scale, valid failure categories, valid
owner layers, and per-case suggested failure categories/owner layer when the run
already shows tool or routing gaps. You can fill the checklist `passed:` values
and Reviewer fields in the Markdown packet, then apply them back to the
machine-readable review JSON:

```sh
npm run apply-review:scout-local-ai -- --packet data/scout-local-ai/review-packets/<run-id>.review.md --review data/scout-local-ai/reviews/<run-id>.review.json
```

For the normal finished-packet handoff, use the one-command finalizer instead:

```sh
npm run finalize-review:scout-local-ai -- --packet data/scout-local-ai/review-packets/<run-id>.review.md --review data/scout-local-ai/reviews/<run-id>.review.json
```

The finalizer applies the packet, runs the read-only review status check, and
only then runs the safe next step: write an iteration backlog for below-5
answers, record a non-final review for smoke/partial runs, or run strict device
proof when the full TestFlight/iPhone review is 100/100 at 5/5. If the packet is
incomplete or invalid, it stops at review status instead of writing backlog or
proof files.

During the rating pass, use the read-only progress check as often as needed:

```sh
npm run review-status:scout-local-ai -- --run data/scout-local-ai/device-runs/<run-id>.json --review data/scout-local-ai/reviews/<run-id>.review.json
```

It reports rated/unrated counts, below-5 debt, invalid checklist/task issues,
the next highest-priority unrated case, and a strict device-proof preview when a
full 100-case review is otherwise 5/5. It does not write backlog files, so a
half-finished human review cannot be promoted into iteration or proof evidence
by accident.

Packet apply expects every case in the review JSON to be present in the Markdown
packet by default. If the packet was truncated or a case heading was accidentally
deleted, apply fails before writing review JSON. Add `--allow-partial` only when
you are intentionally applying an incremental packet or a smoke-run subset.
The review/backlog command also checks that the review JSON belongs to the exact
run being reviewed: run id, suite version/hash, evidence lane, case ids, prompts,
rubric traits, safety caveats, and required tool expectations must line up before
an iteration backlog is written.

For a quick `Run 3` smoke export, or an interrupted `Run 100` export that you
want to diagnose before Dad resumes, add `--allow-partial`. Do not use partial
runs as final proof. Partial intake can warn about missing final-proof context
without blocking the smoke packet, and `npm run status:scout-local-ai` will
surface the partial device run as a resume/diagnosis lane instead of counting it
as a completed phone proof.

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
Backlog items keep source-evidence gaps as first-class fields when a source-backed
tool was called without a receipt or source document id, so the next iteration can
fix the retrieval/evidence layer instead of rediscovering the gap from raw
transcripts.
The review command fails instead of writing backlog files if any below-5 rating
is missing failure categories or a concrete improvement task. A concrete task
needs enough detail for the next iteration and an action verb such as add, fix,
route, tighten, investigate, or improve. It also fails while any case is unrated
so an unfinished review cannot look like a clean 5/5 run. Use
`--allow-unrated` only when deliberately producing a partial status packet; the
result will include explicit unrated case entries.

For a `5` rating, every `traitChecks` and `safetyCaveatChecks` item in the
review JSON must have `passed: true`, and every recorded
`requiredConfirmationChecks` and `safetyFlagChecks` item must have
`acknowledged: true`. Leave failed or uncertain checks unpassed/unacknowledged
and rate below 5 with a concrete improvement task. A 5/5 case must not keep
failure categories, an owner layer, or an improvement task; clear those fields
when a rerun actually fixes the issue.

Plan the next fix pass from one or more completed backlogs:

```sh
npm run plan:scout-local-ai-iteration -- --backlog data/scout-local-ai/backlog/<run-id>.backlog.json
```

That writes an ignored JSON/Markdown iteration plan under
`data/scout-local-ai/iterations/`, groups misses by responsible layer, gives the
regression case command to rerun, summarizes missing tools and source-evidence
gaps, and fails if a below-5 item is uncategorized or lacks a concrete improvement
task. It also requires `device-on-device-gemma` backlogs by default so scaffold
routing smoke data cannot masquerade as Dad local-AI iteration proof. Add
`--allow-non-device` only for deliberate routing/local-lab experiments outside
final Dad proof. Each workstream includes likely fix targets for the affected
tools/source skills, such as local source docs, the Scout tool registry, water
or town data, safety prompts, Eval Lab recovery, or the on-device bridge. Use
the plan to fix the data, tool routing, prompt, safety wording, UI recovery
state, or local-model lane named by the backlog; do not close an iteration by
changing expected answer wording only.

After applying a fix and rerunning the plan's regression cases, verify that the
iteration really closed:

```sh
npm run verify:scout-local-ai-iteration -- --plan data/scout-local-ai/iterations/<plan-id>.iteration.json --run data/scout-local-ai/runs/<rerun-id>.json --review data/scout-local-ai/reviews/<rerun-id>.review.json
```

That writes an ignored resolution report under `data/scout-local-ai/iterations/`
and fails if any planned case is still below 5, any planned case still missed a
required tool, any below-5 review item remains, or a 5/5 case still carries stale
failure metadata. It also requires the rerun/review evidence lane to match the
plan and defaults to `device-on-device-gemma`; use `--allow-non-device` only for
routing/local-lab experiments outside final Dad proof. Add `--require-full-suite`
when the rerun is meant to prove the full 100-case pass. A passing iteration
resolution is useful progress, not final Dad readiness; final readiness still
requires the strict device gates below.

When a full device run has been reviewed and every case is honestly 5/5, run the
strict final gate:

```sh
npm run verify:scout-local-ai-device-proof -- --run data/scout-local-ai/device-runs/<run-id>.json --review data/scout-local-ai/reviews/<run-id>.review.json
```

This fails unless the run is a full 100-case `device-on-device-gemma` Eval Lab
run from the current suite version/hash and suite-declared minimum app build,
every required tool expectation was hit,
the required tools are backed by actual recorded `toolInvocations` rather than
summary-only flags, source-backed tool invocations include at least one recorded
source receipt or source document id, every review case is rated `5`, native iOS app metadata is
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
iOS Eval Lab device lane, every run hit all required tool expectations, and the
runs have distinct execution fingerprints. A copied JSON export with a new
`runId` is not enough for stability proof.
