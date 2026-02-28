# Trail Assistant SOS Escalation Runbook

Last updated: 2026-02-28

## Purpose
Define safe handling for `POST /api/v1/trail-assistant/sos/escalate` so emergency requests are triaged quickly without opening abuse vectors.

## API endpoints
- Hiker create: `POST /api/v1/trail-assistant/sos/escalate`
- Queue view (moderator): `GET /api/v1/trail-assistant/sos/escalations?scope=queue`
- Status update (moderator): `POST /api/v1/trail-assistant/sos/escalations/{escalationId}/status`

## Built-in abuse protections
1. `confirm_emergency=true` required.
2. Idempotency-key replay guard.
3. Duplicate fingerprint window guard.
4. Cooldown lockout for active recent escalations.
5. 24-hour per-user escalation cap.
6. Route throttle middleware (`throttle:4,10`).
7. `abuse_flags` capture for manual review context.

## Moderator triage flow
1. Open queue (`scope=queue`) sorted by latest `triggered_at`.
2. Validate location context + message quality.
3. If valid emergency signal:
   - set status to `acknowledged`
   - begin human responder flow (external contact is human-governed)
4. After closure:
   - set status to `resolved`
   - include closure note in moderation metadata

### Queue visibility signals (response `data.operations`)
- `open_total`, `pending_review`, `acknowledged`
- `oldest_open_age_minutes`, `oldest_pending_age_minutes`
- `pending_over_ack_sla`, `acknowledged_over_resolution_sla`
- `flagged_open`
- `contact_method_breakdown`

Use these counters to prioritize stale or high-risk backlog before taking less urgent items.

## Safety notes
- API creates **manual-review** tickets only; it does not auto-dispatch emergency services.
- Always instruct user to call local emergency services if immediate danger is present.
- Do not suppress a potentially real emergency solely due to `possible_test_keyword`; use moderator judgment.

## Incident logging
When abuse or misuse is observed:
- record details in `trail-assistant-runlog.md`
- include escalation IDs, timestamps, abuse flags, and decision rationale
