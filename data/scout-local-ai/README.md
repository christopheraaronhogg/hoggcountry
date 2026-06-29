# Scout local AI eval loop

Goal: make Dad's on-device Scout answer 100 real hiker questions at 5/5 quality before we treat the local AI flow as pilot-ready.

Harness principle: keep the model replaceable and make the evaluation body durable.
The owned assets are the versioned suite, tool/source contracts, transcript
schema, answer-quality scanner, review packet, iteration planner, and proof-lane
status gates. Local Gemma, a Mac-side model bridge, or a future provider can
change without changing what "good" means. The AT/Dad domain is the first proof
domain, but the same harness should generalize to other document corpora where
an agent must search, open, summarize, compare, cite, draft, update, and preserve
reviewable user-owned notes.

The machine-readable boundary for that principle is
`harness-contract.json`. It defines the owned assets, swappable model lanes,
source classes, tool contracts, answer contract, document-writing contract,
review failure taxonomy, review gates, and anti-overfit rules. If a future model
swap, new document corpus, or TestFlight proof change conflicts with that
contract, change the harness deliberately and keep the tests updated. The review
engine accepts `poor-document-writing-flow` as its own failure category so draft,
confirmation, save-preview, or versioning misses do not get hidden under generic
UX.
The contract's `modelIndependenceProtocol` is the model-swap rulebook: any new
local model lane must reuse the same suite, answer contract, review rubric,
source/tool receipt requirements, and proof gates. A model can change; the
evidence standard cannot.
The contract also names independent reviewer roles for source grounding, trail
math/safety, document-writing, and proof-lane evidence. The answer path can
draft, but a 5/5 review has to verify the artifact separately: source-backed
facts must stay separate from placeholders, assumptions, and open questions, and
TestFlight/iPhone proof cannot be blended with simulator, browser, cloud, or
scaffold evidence.

The loop:

1. Keep the 100-question suite in `dad-local-ai-100.json`.
   Every case carries `documentTask`, which makes the reading/writing boundary
   explicit: `reading`, `writing`, `reading-writing`, or `none`.
2. Run the suite:

   ```sh
   npm run eval:scout-local-ai
   ```

3. Use the iPhone Simulator Gemma lane as the main local iteration loop on the
   Mac mini. It runs the real Capacitor/iOS app, the native ScoutGemma bridge,
   and the on-device Gemma model, then saves an inspectable device-style export:

   ```sh
   npm run eval:scout-local-ai:ios-sim-gemma -- --limit 3
   ```

   After a below-5 review, rerun the exact regression cases first:

   ```sh
   npm run eval:scout-local-ai:ios-sim-gemma -- --cases DLA-022,DLA-026,DLA-028
   ```

   Use `--limit 10` after a targeted tool/prompt/data change. Use `--limit 100`
   before asking Dad to spend time on a TestFlight run. Add
   `--simulator "iPhone 16e"` if several iPhone simulators are installed. The
   command runs `mobile` build/sync, Xcode simulator build/install, app launch,
   eval extraction, and the read-only device-run inspector.
   The runner saves both the simulator diagnostic export and a sibling
   `.scan.json` answer-quality scan. To create the human review packet from the
   simulator export, use the command printed at the end:

   ```sh
   npm run intake:scout-local-ai-device-run -- --run .scout-artifacts/scout-local-ai-runs/<ios-sim-gemma-run>.json --allow-partial
   ```

   Intake automatically writes an answer-quality scan to
   `data/scout-local-ai/answer-quality-scans/<run-id>.scan.json` and embeds that
   scan in the review packet. The scan is the first triage pass in both places;
   it does not replace reading and rating every answer 1-5.
   The packet also embeds the `harness-contract.json` independent review gates,
   so source grounding, trail math/safety, document-writing confirmation, and
   proof-lane separation are checked as separate review passes before any answer
   can honestly earn 5/5.

4. For quick routing smoke tests without a model, use the default scaffold lane.
   It exercises Scout tools and source routing, but it is not model proof.
5. For Mac-side non-iOS local model proof, set a command bridge that reads JSON
   from stdin and returns either raw answer text or JSON like
   `{ "text": "...", "truncated": false }`:

   ```sh
   SCOUT_LOCAL_AI_COMMAND="node path/to/local-model-bridge.mjs" npm run eval:scout-local-ai
   ```

   On Chris's Mac mini, use the OpenClaw local command bridge:

   ```sh
   npm run eval:scout-local-ai:openclaw-local -- --run-id mac-openclaw-gpt55-$(date -u +%Y%m%dT%H%MZ)
   ```

   The default model is `gpt-5.5`; override it with `SCOUT_OPENCLAW_LOCAL_MODEL=<model>`. This is useful Mac-side model evidence, but it does not replace the final TestFlight/iPhone Gemma proof.

6. Create or update the review file:

   ```sh
   npm run review:scout-local-ai -- --run data/scout-local-ai/runs/<run-id>.json
   ```

7. Rate every answer 1-5. Any answer below 5 needs failure categories and an improvement task.
8. Improve the responsible layer: data table, source skill, tool routing, prompt, UI recovery state, or local model path.
9. Re-run the simulator batch plus the regression cases until they are 5/5, then
   run the simulator `--limit 100` pass before the final TestFlight/iPhone pass.
   A simulator 100-case review can drive iteration, but it must not be promoted
   to strict Dad proof.

Proof lanes stay separate:

- `scaffold-not-model`: tool/source-routing smoke only.
- `external-local-model-command`: local model bridge proof, useful before device automation.
- `device-on-device-gemma` from a debug iPhone Simulator build: main local
  iteration proof for app/bridge/model behavior on the Mac mini.
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
use, document-vault reading, user-owned document drafting/updating, reusable
document-assistant transfer readiness, or confusing edge cases at the expected
minimum depth. Document-writing cases must stay reviewable and confirmation-bound:
Scout can draft or update user-owned vault notes, but it must not silently save
or overwrite private documents.
The `Simulator/debug local full-suite preflight` gate is the main Mac-mini
iteration signal: the latest debug/simulator `device-on-device-gemma` Run 100
must have complete tool/source evidence and a clean answer-quality scan before
we spend Dad's TestFlight time. It remains separate from final TestFlight/iPhone
proof.
It also checks `data/scout-local-ai/inbox/` and reports whether Dad's shared
iPhone JSON handoff folder is empty, has ignored/unreadable files, or has a
newest likely Scout Eval Lab export ready for `--run inbox` inspection.
When a likely inbox export exists and no final device run has been imported yet,
the next action switches to preparing that export instead of asking Dad to run
the phone again.
The status output also tracks below-5 review debt explicitly: a completed
below-5 review is marked as needing backlog/plan generation or already planned,
so improvement work cannot hide behind the broader "review is not 100/100" gate.

To rebuild the local history database and standalone timeline view:

```sh
npm run history:scout-local-ai
```

That writes `data/scout-local-ai/history/scout-local-ai-history.json` and
`data/scout-local-ai/history/scout-local-ai-history.html`. The JSON records each
run, per-case answer evolution, ratings, score deltas, confidence, failure mode,
model/runtime/build proof lane, tool/source evidence, answer-quality scan
results, and commit-level interventions. The HTML timeline includes filters for
domain, `documentTask`, proof lane, and model/runtime, plus searchable
confidence/failure diagnostics, so reading-only, writing, simulator,
TestFlight/iPhone, and model-swap runs can be reviewed separately instead of
blending document-agent progress into general hiker Q&A or final proof.

To audit the whole original goal against current evidence, run:

```sh
npm run audit:scout-local-ai-goal
```

That report maps the requested success criteria to the current suite, runner,
review, iteration, TestFlight, and strict device-proof evidence. It should stay
`Goal complete: no` until the current TestFlight build is available for Dad and
at least two full iPhone Eval Lab runs pass strict 100/100 5-star proof.
Its current-state summary also includes inbox candidate counts, so a shared
iPhone export waiting for inspection is visible without treating it as imported
device proof.

Before handing the phone to Dad or sending Chris the next TestFlight steps,
generate the current one-page phone/run/review checklist:

```sh
npm run handoff:scout-local-ai-dad
```

It combines the eval status with the recorded Dad Pilot/TestFlight build truth
so old TestFlight builds, the current target build, scaffold routing proof, and
final iPhone proof do not get blended.
The handoff has a `Phone build path` section that says which TestFlight build Dad
can use now, which Xcode build is only a latest-code candidate, and what proof is
still needed before a target build counts as Dad-ready. If the local target is
newer than the recorded Dad Pilot build, first run the read-only refresh command
shown in the handoff; after upload/processing, rerun it with
`--attach --submit-review --remove-previous --update-release-evidence` to update
the release ledger from App Store Connect truth.

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

If Dad sends copied JSON text, or the share lands in the macOS clipboard, use
the receiver instead of hand-making a file. It saves a normalized inbox JSON,
inspects it, and prepares review automatically when the export is final-ready:

```sh
npm run receive:scout-local-ai-device-run -- --clipboard
```

For pasted/stdin JSON:

```sh
pbpaste | npm run receive:scout-local-ai-device-run -- --stdin
```

For a file outside the inbox:

```sh
npm run receive:scout-local-ai-device-run -- --input ~/Downloads/<device-run>.json
```

Use `--no-prepare` when you only want to save and inspect the export. Partial or
wrong-context exports are saved for diagnosis, but they do not create review
files unless `--allow-partial` is explicit.

If you are waiting on Dad to send the file, leave the guarded watcher running:

```sh
npm run wait:scout-local-ai-device-run
```

For a bounded check that is easier to run from Codex or a temporary terminal,
add a timeout. It exits with a source-by-source status report if no final-ready
export appears:

```sh
npm run wait:scout-local-ai-device-run -- --timeout-ms 300000 --poll-ms 10000
```

It polls the repo inbox and Downloads, then runs the same prepare-review command
as soon as a final-ready `Run 100` export appears. It keeps polling past stale,
partial, or blocked candidates unless `--allow-partial` is explicit, so a smoke
run still cannot become final review evidence by accident.

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
read-only packet-draft review-status report. It refuses partial exports unless
`--allow-partial` is explicit, so a smoke/interrupted run cannot be mistaken for
final proof.
Its report also includes a `Review Acceptance` section:

- `final-review-ready` means the export imported cleanly and final human rating
  can start.
- `diagnostic-review-only` means the export can help debug an interrupted/smoke
  run, but it is not Dad proof and should not be used for final ratings.
- `blocked-before-review` means the export failed inspection; rerun or fix the
  handoff before anyone rates answers.

Even `final-review-ready` is only permission to begin review. Final Dad
readiness still requires all 100 cases rated 5/5, strict device proof, and a
second distinct stability run.

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
only then runs the safe next step: write an iteration backlog plus iteration
plan for below-5 answers, record a non-final review for smoke/partial runs, or
run strict device proof when the full TestFlight/iPhone review is 100/100 at
5/5. If the packet is incomplete or invalid, it stops at review status instead
of writing backlog, plan, or proof files.

During the rating pass, use the read-only progress check as often as needed:

```sh
npm run review-status:scout-local-ai -- --run data/scout-local-ai/device-runs/<run-id>.json --review data/scout-local-ai/reviews/<run-id>.review.json --packet data/scout-local-ai/review-packets/<run-id>.review.md
```

To review one answer at a time without hunting through the whole packet, add
`--next`. This prints a focused read-only card for the next unrated case, then
falls back to the next below-5 case after every answer is rated. Use
`--case DLA-001` when you want to jump to a specific answer. The focused card
includes the prompt, answer, rubric traits, safety caveats, tool/source evidence,
current reviewer fields, likely owner/category hints, and exact `rate-case`
command templates when a packet path is available:

```sh
npm run review-status:scout-local-ai -- --run data/scout-local-ai/device-runs/<run-id>.json --review data/scout-local-ai/reviews/<run-id>.review.json --packet data/scout-local-ai/review-packets/<run-id>.review.md --next
```

When a packet has multiple standard unrated cases, `review-status` also prints
small human-reviewed batch helpers. They group explicit case ids and produce a
ready `--cases` command, but they are only for answers you have already read.
Use `--batch-size <n>` when you want shorter or longer suggested reading groups.

After reading the focused card, you can update just that case in the Markdown
packet without touching review JSON yet. For a 5/5, pass `--mark-all-pass` only
after you have checked every trait, safety caveat, confirmation, and safety flag
for that case. After a successful update, the command prints both a focused
check for the selected case and a `--next` command that advances to the next
unrated or below-5 answer:

```sh
npm run rate-case:scout-local-ai -- --packet data/scout-local-ai/review-packets/<run-id>.review.md --review data/scout-local-ai/reviews/<run-id>.review.json --case DLA-001 --rating 5 --notes "Dad-ready answer." --mark-all-pass
```

After reviewing several answers, you can update an explicit human-reviewed
batch with the same 5/5 fields:

```sh
npm run rate-case:scout-local-ai -- --packet data/scout-local-ai/review-packets/<run-id>.review.md --review data/scout-local-ai/reviews/<run-id>.review.json --cases DLA-001,DLA-002,DLA-003 --rating 5 --notes "Dad-ready answer." --mark-all-pass
```

Batch updates still validate every selected case against the run evidence before
writing the packet. Use them only for cases you have actually read; for below-5
batches, only group cases that share the same failure categories, owner layer,
and improvement task.

For anything below 5, include the concrete owner/fix so the iteration backlog can
be created later:

```sh
npm run rate-case:scout-local-ai -- --packet data/scout-local-ai/review-packets/<run-id>.review.md --review data/scout-local-ai/reviews/<run-id>.review.json --case DLA-001 --rating 4 --notes "Needs fresher water evidence." --failure-categories missing-data --owner-layer data --improvement-task "Add current-section water reliability source docs for this trail context."
```

The same command is also available as `npm run status:scout-local-ai-review`
when you are thinking "status" first.

With `--packet`, it parses the in-progress Markdown packet into a temporary
draft review, reports rated/unrated counts, below-5 debt, invalid checklist/task
issues, the next highest-priority unrated case, and a strict device-proof
preview when a full 100-case review is otherwise 5/5. It does not write the
review JSON or backlog files, so a half-finished human review cannot be promoted
into iteration or proof evidence by accident. If the packet has a malformed
rating, missing case block, or checklist mismatch, status points at the packet
issue before anyone applies it.

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
During a run, the Eval Lab requests both the browser screen Wake Lock and the
native iOS idle-timer guard exposed by the ScoutGemma plugin, so a long `Run
100` is less likely to be interrupted by the phone sleeping. If either guard is
unsupported, the run still autosaves after each completed answer and can be
resumed.

The Eval Lab shows a final-proof preflight before Dad runs the suite. `Run 3`
stays available as an iOS smoke check once the local model is ready, but `Run
100` is reserved for a ready on-device iOS TestFlight install so a debug or web
run cannot be mistaken for final Dad proof.

On iPhone, use Share first so the JSON can be sent through the native share
sheet. If that is unavailable, use Copy and paste the JSON into a file or note.
Download remains available as a browser fallback.

If you need the lower-level manual command after filling the review JSON ratings
and tasks:

```sh
npm run review:scout-local-ai -- --run data/scout-local-ai/device-runs/<run-id>.json --review data/scout-local-ai/reviews/<run-id>.review.json
```

That writes a machine-readable backlog item for every answer rated below 5 and
a Markdown iteration backlog grouped for the next data/tool/prompt/UI fix pass.
The normal finalizer also runs the planner immediately after this backlog step
when any below-5 answer exists.
Backlog items keep source-evidence gaps as first-class fields when a source-backed
tool was called without a receipt or source document id, so the next iteration can
fix the retrieval/evidence layer instead of rediscovering the gap from raw
transcripts.
The review command fails instead of writing backlog files if any below-5 rating
is missing failure categories, an owner layer, or a concrete improvement task. A
concrete task needs enough detail for the next iteration and an action verb such
as add, fix, route, tighten, investigate, or improve. It also fails while any
case is unrated so an unfinished review cannot look like a clean 5/5 run. Use
`--allow-unrated` only when deliberately producing a partial status packet; the
result will include explicit unrated case entries.

For a `5` rating, every `traitChecks` and `safetyCaveatChecks` item in the
review JSON must have `passed: true`, and every recorded
`requiredConfirmationChecks` and `safetyFlagChecks` item must have
`acknowledged: true`. Leave failed or uncertain checks unpassed/unacknowledged
and rate below 5 with a concrete improvement task. A 5/5 case must not keep
failure categories, an owner layer, or an improvement task; clear those fields
when a rerun actually fixes the issue.

Plan the next fix pass from one or more completed backlogs when you are working
from manually-created or combined backlog files:

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
New Eval Lab exports include `runContext.execution.id`; the inspector and final
proof summary print it so two Dad runs can be compared without digging through
the raw JSON.

For final consistency proof, require at least two separate full TestFlight/iPhone
runs to pass the same strict gate:

```sh
npm run verify:scout-local-ai-stability-proof -- --pairs data/scout-local-ai/device-runs/<run-a>.json:data/scout-local-ai/reviews/<run-a>.review.json,data/scout-local-ai/device-runs/<run-b>.json:data/scout-local-ai/reviews/<run-b>.review.json
```

That fails unless every case is 5/5 in each run, every run is from the installed
iOS Eval Lab device lane, every run hit all required tool expectations, and the
runs have distinct execution fingerprints. A copied JSON export with a new
`runId` is not enough for stability proof.
`npm run status:scout-local-ai` uses the same execution-fingerprint rule before
showing the stability gate as ready, so the dashboard and final verifier should
not disagree about copied exports.
