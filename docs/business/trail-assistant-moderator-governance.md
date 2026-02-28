# Trail Assistant Moderator Governance Controls

Last updated: 2026-02-28

## Purpose
Provide a **non-secret**, auditable control plane for moderator policy settings without requiring deploy-time config edits.

This endpoint is intentionally limited to policy values only (IDs/emails/visibility rules). It does **not** expose credentials, API keys, or infrastructure secrets.

## Endpoints (auth + moderator only)
- `GET /api/v1/trail-assistant/governance/moderation`
- `PUT /api/v1/trail-assistant/governance/moderation`

## Supported controls
```json
{
  "moderator_user_ids": [123, 456],
  "moderator_emails": ["ops@example.com"],
  "map_report_trusted_user_ids": [789],
  "map_report_public_visible_verifications": ["trusted", "moderator_verified"]
}
```

### Control semantics
- `moderator_user_ids`: explicit user IDs granted moderation actions.
- `moderator_emails`: email allowlist for moderation actions.
- `map_report_trusted_user_ids`: reporter IDs auto-marked as `trusted` on map-report create.
- `map_report_public_visible_verifications`: which verification states are allowed in public map feed.

## Safety behavior
- If both moderator lists are submitted empty, system falls back to baseline config defaults (prevents total moderator lockout).
- Unknown/invalid values are sanitized out.
- Update responses include `updated_fields` + governance snapshot metadata (`source`, `updated_at`, `updated_by_user_id`).

## Operational process
1. **Review current policy**
   - `GET /governance/moderation`
2. **Prepare change request**
   - Include reason, target values, and rollback values.
3. **Apply change**
   - `PUT /governance/moderation` with updated policy payload.
4. **Verify effect**
   - Moderator access tests (`/sos/escalations?scope=queue`, map-report verify endpoint).
   - Public feed visibility behavior (`/map-reports/public`) as needed.
5. **Log action**
   - Add runlog entry with who changed what and why.

## Rollback
- Reapply previous known-good payload via `PUT`.
- If governance record is unavailable/corrupt, service falls back to `config/trail_assistant.php` defaults.

## Out of scope (must stay outside endpoint)
- API keys, tokens, SMTP creds, signing secrets, DB credentials.
- Emergency responder personal contact secrets.
