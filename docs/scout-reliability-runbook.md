# Scout AT Reliability Runbook

This workflow is for Scout planning reliability, not prose polishing. The goal is to keep Scout helpful while using deterministic checks to prevent wrong corridors, unsafe legal assumptions, invented current data, and missing caveats.

## Scenario Suite

Scenarios live in `data/scout-reliability/scenarios.json`.

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

Use `SCOUT_RELIABILITY_MODEL=deepseek-v4-pro` unless the task is explicitly model comparison. Later comparisons can reuse the same suite by changing only the model metadata and provider path.

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
npm run check -w @hoggcountry/openclaw-web
OPENCLAW_WEB_ADAPTER=node npm run build -w @hoggcountry/openclaw-web
git diff --check
```

Then smoke the exact Harpers Ferry failure prompt and a few difficulty 1-3 scenarios through `/app-api/claw/reply`. After deploy, repeat through `https://hoggcountry.on-forge.com`.
