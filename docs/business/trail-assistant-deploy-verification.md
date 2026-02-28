# Trail Assistant Deploy Verification Runbook

Last updated: 2026-02-28

## Purpose
Verify Trail Assistant safety-critical mobile endpoints are healthy after each deploy.

## Preconditions
- Backend deployed and migrations applied.
- Test auth tokens available for:
  - standard hiker user
  - moderator user
- Base URL known (example: `https://<host>/api/v1`).

## 1) Health check
- `GET /api/v1/health`
- Expect HTTP 200 and `data.status=ok`.

## 2) Public plan + intake checks
1. `GET /api/v1/trail-assistant/plans` → expect 200 + plan array.
2. `POST /api/v1/trail-assistant/intake` with sample payload + `Idempotency-Key`.
3. Replay same request with same key → expect no duplicate row and replay response.

## 3) Auth check
- `GET /api/v1/auth/me` with bearer token.
- Expect HTTP 200 and current test user.

## 4) Chat lane check (auth)
- `POST /api/v1/trail-assistant/chat/messages` with sample message.
- `GET /api/v1/trail-assistant/chat/messages?limit=1`.
- Expect HTTP 201 + HTTP 200.

## 5) Check-in + progress check (auth)
- `POST /api/v1/trail-assistant/checkins` with lat/lon/mile.
- `GET /api/v1/trail-assistant/checkins?limit=1`.
- `GET /api/v1/trail-assistant/progress`.
- Expect latest check-in reflected in progress snapshot.

## 6) Map-sharing privacy controls
1. `GET /api/v1/trail-assistant/map-sharing/settings` (auth).
2. `PUT /api/v1/trail-assistant/map-sharing/settings` with:
   - `share_scope=public`
   - `location_mode=coarse`
   - `visibility_delay_minutes >= min_public_delay`
3. `GET /api/v1/trail-assistant/map-sharing/public` immediately after check-in should *not* include delayed point.
4. After delay window, point should appear with coarse precision.

## 7) Map-report moderation safety
1. Hiker submits map report (`POST /trail-assistant/map-reports`) and receives `verification=unverified`.
2. Public feed (`GET /trail-assistant/map-reports/public`) should exclude that report pre-verification.
3. Moderator promotes report (`POST /trail-assistant/map-reports/{reportId}/verify`).
4. Audit endpoint (`GET /trail-assistant/map-reports/{reportId}/audit`) should include `verification_promoted` event.
5. Public feed should now include report (if active/not expired).

## 8) SOS escalation path
1. Submit SOS (`POST /trail-assistant/sos/escalate`) with `confirm_emergency=true`.
2. Replay with same `Idempotency-Key` should return existing escalation.
3. Immediate second distinct escalation should receive cooldown rejection (429).
4. Moderator queue view (`GET /trail-assistant/sos/escalations?scope=queue`) should include pending escalation.
5. Moderator status update (`POST /trail-assistant/sos/escalations/{id}/status`) should transition to `acknowledged`.

## 9) Triage visibility check (auth)
- `GET /api/v1/trail-assistant/intakes?status=new`
- `GET /api/v1/trail-assistant/intakes/export.csv?status=new`
- Confirm records are visible and CSV export downloads.

## 10) Security smoke-check
Without auth, verify protected endpoints return 401:
- `/trail-assistant/chat/messages`
- `/trail-assistant/checkins`
- `/trail-assistant/progress`
- `/trail-assistant/intakes`
- `/trail-assistant/map-sharing/settings`
- `/trail-assistant/sos/escalate`

## Pass criteria
- All checks pass with expected status codes and schemas.
- No 5xx errors.
- No cross-user data leakage.
- Unverified hazards never leak to public map feed.
- SOS abuse guards behave as expected (idempotency + cooldown + cap).

## Fail protocol
- Log failure details in `docs/business/trail-assistant-runlog.md`.
- Roll back deploy if safety-critical API is broken.
- If owner decision is required and unresolved for >24h, send blocker email to `christopheraaronhogg@gmail.com` with Option A / Option B + default path.
