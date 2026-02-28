# Trail Assistant Governance + SOS Ops Visibility + Offline Replay Hooks

## Objective
Ship the next safety-first Trail Assistant tranche by:
1) finalizing runlog/backlog updates,
2) adding moderator governance policy controls via API + docs,
3) improving SOS responder queue operational visibility,
4) refining phone screen contract and wiring offline replay hooks,
5) validating and preparing push to `main`.

## Context
Base system already had map moderation, SOS escalation, and map-sharing privacy controls. Remaining gap was non-secret policy governance operations, queue observability for responder triage, and mobile offline replay contract hooks.

## Implementation Summary
1. **Moderator governance endpoint + policy layer**
   - Added governance persistence model/table (`trail_assistant_governance_settings`).
   - Added `TrailAssistantGovernanceConfig` for normalized policy snapshot + updates.
   - Added moderator governance API:
     - `GET /api/v1/trail-assistant/governance/moderation`
     - `PUT /api/v1/trail-assistant/governance/moderation`
   - Updated moderator and map-report logic to consume governance controls.
2. **SOS queue operations visibility improvements**
   - Extended queue index filtering (`contact_method`, `since`).
   - Added `operations` snapshot payload for queue scope:
     - open/pending/ack/resolved counters
     - flagged-open count
     - oldest age metrics
     - SLA thresholds + breach counts
     - contact-method breakdown
   - Added per-row ops fields: `queue_age_minutes`, `is_ack_sla_breached`, `is_resolution_sla_breached`.
3. **Offline replay hooks**
   - Added check-in sync fields + constraints:
     - `idempotency_key`, `client_event_id`, `replayed_from_offline`, `sync_metadata`
     - user-scoped uniqueness for idempotency + client event IDs
   - Added check-in replay de-duplication and replay metadata responses.
   - Added chat replay hooks with idempotency/client-event handling and replay response metadata.
4. **Documentation updates**
   - Added moderator governance process doc.
   - Added refined phone app screen contract doc.
   - Updated mobile API contract/roadmap, security policy, backlog, and runlog.

## Files Touched
- `backend/app/Http/Controllers/Api/V1/TrailAssistantGovernanceController.php`
- `backend/app/Http/Controllers/Api/V1/TrailAssistantSosController.php`
- `backend/app/Http/Controllers/Api/V1/TrailAssistantCheckinController.php`
- `backend/app/Http/Controllers/Api/V1/TrailAssistantChatController.php`
- `backend/app/Http/Controllers/Api/V1/TrailAssistantMapReportController.php`
- `backend/app/Models/TrailAssistantGovernanceSetting.php`
- `backend/app/Models/TrailAssistantCheckin.php`
- `backend/app/Support/TrailAssistantGovernanceConfig.php`
- `backend/app/Support/TrailAssistantModeratorGate.php`
- `backend/database/migrations/2026_02_28_183100_create_trail_assistant_governance_settings_table.php`
- `backend/database/migrations/2026_02_28_183200_add_offline_replay_fields_to_trail_assistant_checkins_table.php`
- `backend/routes/api.php`
- `backend/config/trail_assistant.php`
- `backend/tests/Feature/Api/V1/TrailAssistantGovernanceApiTest.php`
- `backend/tests/Feature/Api/V1/TrailAssistantSosApiTest.php`
- `backend/tests/Feature/Api/V1/TrailAssistantCheckinApiTest.php`
- `backend/tests/Feature/Api/V1/TrailAssistantChatApiTest.php`
- `docs/business/trail-assistant-moderator-governance.md`
- `docs/business/trail-assistant-phone-screen-contract.md`
- `docs/business/trail-assistant-mobile-api-contract.md`
- `docs/business/trail-assistant-mobile-roadmap.md`
- `docs/business/trail-assistant-security-policy.md`
- `docs/business/trail-assistant-backlog.md`
- `docs/business/trail-assistant-runlog.md`

## Validation / Evidence
- `./vendor/bin/pint --dirty` ✅
- `php artisan test tests/Feature/Api/V1/TrailAssistantGovernanceApiTest.php tests/Feature/Api/V1/TrailAssistantSosApiTest.php tests/Feature/Api/V1/TrailAssistantChatApiTest.php tests/Feature/Api/V1/TrailAssistantCheckinApiTest.php tests/Feature/Api/V1/TrailAssistantMapReportApiTest.php tests/Feature/Api/V1/TrailAssistantMapVisibilityApiTest.php tests/Feature/Api/V1/TrailAssistantOpsApiTest.php` ✅ (29 tests, 189 assertions)

## Outcome
Safety-first operational controls are now API-manageable (non-secret), SOS queue triage has richer operational telemetry, and phone-side offline replay has concrete backend hooks + contract docs.

## Follow-ups
- Run pilot simulation pack (5 realistic hiker requests) and score SLA/quality.
- Implement suspicious-request quarantine workflow in intake triage.
- Add automation helpers for daily runlog and blocker-template generation.
