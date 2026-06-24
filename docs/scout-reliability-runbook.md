# Scout AT Reliability Runbook

This workflow is for Scout planning reliability, not prose polishing. The goal is to keep Scout helpful while using deterministic checks to prevent wrong corridors, unsafe legal assumptions, invented current data, and missing caveats.

## Scenario Suite

Regression scenarios live in `data/scout-reliability/scenarios.json`.

Unseen generalization checks live in `data/scout-reliability/holdout-scenarios.json`. Treat the holdout suite as an overfit detector: do not patch Scout for a single holdout prompt and immediately count that same prompt as proof of general readiness. Keep failures as signal, improve general mechanisms, then add new unseen prompts before claiming broad progress.

Each scenario records:

- prompt
- region/state and approximate AT mile range
- expected corridor/start/end/direction
- expected plan type
- required sections and caveats
- disallowed mistakes
- difficulty score 1-10
- whether strict-route support exists now or is future work

Work difficulty 1-3 first. Do not tune against difficulty 8-10 until the easier scenarios are consistently passing.

## Run The Harness

Grounding-only easy slice:

```bash
npm run eval:scout-reliability -- --difficulty-max 3 --patch-notes "Short note for this run"
```

Specific scenario:

```bash
npm run eval:scout-reliability -- --id at-wv-md-002-harpers-failed-mixed-plan
```

API mode against a local or Forge URL:

```bash
SCOUT_RELIABILITY_COOKIE="your beta/session cookie" \
npm run eval:scout-reliability -- --mode api --base-url http://127.0.0.1:5173 --difficulty-max 3
```

Unseen holdout suite:

```bash
npm run eval:scout-holdout -- --patch-notes "Holdout grounding baseline"
SCOUT_RELIABILITY_ENV=forge-api-holdout \
npm run eval:scout-holdout -- --mode api --base-url https://hoggcountry.on-forge.com --api-timeout-ms 90000 --patch-notes "Holdout Forge API baseline"
```

The holdout score should be reported separately from the regression leaderboard.

Use `SCOUT_RELIABILITY_MODEL=deepseek-v4-pro` unless the task is explicitly model comparison. Later comparisons can reuse the same suite by changing only the model metadata and provider path.

## Critical Model Review

The harness captures responses and hard telemetry; it is not the quality judge. By default, quality review is an assistant/human rubric review over the saved artifact, not a paid model-judge API call. Do not spend external judge tokens unless Chris explicitly asks for it.

Use the local review script only as a first-pass organizer for deterministic-row exclusion and obvious text-scan notes:

```bash
npm run review:scout-model -- --run data/scout-reliability/runs/<run-id>.json
```

Then review model-authored responses directly against `data/scout-reliability/reference-responses.json`. The references are baseline expectations, not golden wording. Score the model critically for corridor correctness, source honesty, safety/legal realism, practical usefulness, and prompt fit. A response can beat the reference if it is more accurate or helpful. Rows that begin as deterministic guardrails or strict-route canned plans must be excluded from model comparison.

## Artifacts

Runs are written to `data/scout-reliability/runs/*.json`.

Each run stores:

- run id and timestamp
- git commit SHA and commit message
- changed files
- environment and model
- scenario count and pass/fail/skipped counts
- filters and difficulty range
- raw Scout responses
- deterministic assertion results
- source receipts and missing source classes
- manual review placeholder
- patch/deploy/known-failure notes

## GUI

Open:

```text
/app/scout-lab/reliability
```

Use it to inspect runs, filter scenarios, review raw responses, check assertion failures, compare two runs, and read patch notes/deployment notes.

## Required Validation Gates

Run the local gates for a completed slice:

```bash
npm run eval:scout-grounding
npm run eval:scout-sources
npm run eval:scout-reliability -- --difficulty-max 3
npm test
npm run check -w @hoggcountry/scout-web
SCOUT_WEB_ADAPTER=node npm run build -w @hoggcountry/scout-web
git diff --check
```

Then smoke the exact Harpers Ferry failure prompt and a few difficulty 1-3 scenarios through `/app-api/claw/reply`. After deploy, repeat through `https://hoggcountry.on-forge.com`.

## Why This Loop Stays Human-Gated

Everything above is Scout's verification loop: Scout produces a plan, the harness plus rubric review score it against the scenario suite, and failures feed back into the next change. That loop is deliberately **open** — we stop one rung short of closing it.

We do **not** run any process that reads the run traces and rewrites Scout's prompt, tools, or planning config on its own. Traces are evidence for a human decision, never the trigger for an automated one. This is a choice, not a missing feature, and it follows directly from the two rules at the top of this repo:

- **"Evidence, not vibes."** A self-tuning loop optimizes whatever the graders measure; the moment the rubric and the real failure mode diverge, it confidently ships the wrong thing and the leaderboard still goes up.
- **Stale or auto-generated context can be unsafe for hikers.** A wrong corridor, an invented water source, or a dropped caveat shipped unattended is a safety failure, not a metrics regression. The cost of one bad plan in Dad's hands outweighs the convenience of a hands-off loop.

So the return arrow comes back to a person, on purpose. Keep it that way until there is a grader we trust to gate a hiker-safety change without us reading the diff — and we are nowhere near that.
