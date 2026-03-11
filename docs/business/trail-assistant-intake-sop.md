# Trail Assistant Intake SOP

## Intake channels (MVP)
1. `/trail-assistant` web form
2. Email with subject containing `Trail Assistant Request`
3. Existing direct messages where user explicitly asks for trail help

## Triage tags
- `PREP` (pre-trail)
- `ONTRAIL` (currently hiking)
- `POST` (post-finish)
- `URGENT` (same-day needed)
- `BLOCKER` (requires owner decision)

## Intake checklist
For each request, capture:
- Name + contact method
- Trail stage (pre/on/post)
- Urgency
- Specific question
- Constraints (budget, injuries, schedule, gear limits)
- Required output type (quick answer vs detailed plan)

## Response SLAs (target)
- Normal: within 24–48h
- Soon: same day
- Urgent: fastest possible same-day response with short actionable first pass

## Output templates
- Quick Answer (5–10 bullets)
- 7-Day Action Plan
- Gear Shakedown Corrections
- Resupply/Town Decision Memo
- Contingency Branch Plan (weather/injury)
- FAQ-safe response snippets for privacy + map verification questions (`trail-assistant-faq.md`)

## Emergency/SOS handling
- Use dedicated API path: `POST /api/v1/trail-assistant/sos/escalate`.
- Never route true emergencies through normal intake triage first.
- Moderator queue endpoint for active SOS review: `GET /api/v1/trail-assistant/sos/escalations?scope=queue`.
- Follow `trail-assistant-sos-runbook.md` for acknowledgment and closure workflow.

## Completion rule
A request is complete only when:
- response delivered,
- summary logged to runlog,
  - preferred helper: `npm run trail-assistant:runlog-autoupdate -- ...` (see `trail-assistant-runlog-autopdater-helper.md`)
- follow-up date set if needed.

## Queue review cadence (daily/weekly)
- run `npm run trail-assistant:queue-review -- --date YYYY-MM-DD --print-report`
- review generated report at `docs/business/daily-updates/assets/YYYY-MM-DD/queue-review.md`
- action stale/blocked items before picking the next execution target

## Blocker rule
If blocked >24h and owner decision is required:
- generate/send blocker email to `christopheraaronhogg@gmail.com`
- include option A / option B + default path deadline
- use helper: `npm run trail-assistant:blocker-email -- ...` (see `trail-assistant-blocker-email-helper.md`)
