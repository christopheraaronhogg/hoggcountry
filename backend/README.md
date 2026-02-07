# HoggCountry API (Laravel)

Laravel 12 API backend for account auth, device registration, and local-first sync.

## Local Run

From the monorepo root:

```bash
npm run backend:install
npm run backend:dev
```

API base URL:

```text
http://127.0.0.1:8000/api/v1
```

## Core Endpoints

Public:

- `POST /api/v1/auth/register`
- `POST /api/v1/auth/login`
- `GET /api/v1/auth/google/redirect`
- `GET /api/v1/auth/google/callback`
- `POST /api/v1/auth/forgot-password`
- `POST /api/v1/auth/reset-password`
- `GET /api/v1/auth/verify-email/{id}/{hash}`
- `GET /api/v1/health`

Authenticated (`Authorization: Bearer <token>`):

- `POST /api/v1/auth/logout`
- `GET /api/v1/auth/me`
- `POST /api/v1/devices/register`
- `GET /api/v1/devices`
- `DELETE /api/v1/devices/{deviceId}`
- `GET /api/v1/sync/bootstrap`
- `POST /api/v1/sync/push`
- `GET /api/v1/sync/pull`
- `GET /api/v1/community/trackers`
- `POST /api/v1/community/trackers`
- `PATCH /api/v1/community/trackers/{trackerId}`
- `DELETE /api/v1/community/trackers/{trackerId}`
- `GET /api/v1/trackers/live`

## Testing

```bash
npm run backend:test
```

## Notes

- Default DB is SQLite (`backend/database/database.sqlite`).
- Sanctum token auth is enabled for API routes.
- Sync conflicts use deterministic checks based on `client_updated_at` and `device_id`.
- Google OAuth uses `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, and `GOOGLE_REDIRECT_URI`.
