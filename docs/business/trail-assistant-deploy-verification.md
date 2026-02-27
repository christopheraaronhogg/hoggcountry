# Trail Assistant Deploy Verification Runbook

Last updated: 2026-02-27

## Purpose
Verify Trail Assistant mobile-core endpoints are healthy after each deploy.

## Preconditions
- Backend deployed and migrations applied.
- Test auth token available for a non-production test user.
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

## 6) Triage visibility check (auth)
- `GET /api/v1/trail-assistant/intakes?status=new`
- `GET /api/v1/trail-assistant/intakes/export.csv?status=new`
- Confirm records are visible and CSV export downloads.

## 7) Security smoke-check
Without auth, verify protected endpoints return 401:
- `/trail-assistant/chat/messages`
- `/trail-assistant/checkins`
- `/trail-assistant/progress`
- `/trail-assistant/intakes`

## Pass criteria
- All checks pass with expected status codes and schemas.
- No 5xx errors.
- No cross-user data leakage.

## Fail protocol
- Log failure details in `docs/business/trail-assistant-runlog.md`.
- Roll back deploy if core API is broken.
- If owner decision is required and unresolved for >24h, send blocker email to `christopheraaronhogg@gmail.com` with Option A / Option B + default path.
