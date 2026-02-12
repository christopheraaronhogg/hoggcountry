# HoggCountry API (Laravel)

Laravel 12 API backend for account auth, device registration, and local-first sync.

This backend now also hosts the first native app shell foundation with Inertia + Svelte at `/native`.

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

Native shell route:

```text
http://127.0.0.1:8000/native
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
- `GET /api/v1/trackers/public/live`
- `GET /api/v1/trackers/public/history`

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
- `POST /api/v1/videohogg/runs`
- `GET /api/v1/videohogg/runs`
- `POST /api/v1/videohogg/runs/claim`
- `POST /api/v1/videohogg/runs/{runId}/heartbeat`
- `POST /api/v1/videohogg/runs/{runId}/complete`
- `POST /api/v1/videohogg/runs/{runId}/fail`
- `POST /api/v1/videohogg/runs/{runId}/service-status`

## VideoHogg worker token (for queue watcher)

Create a Sanctum token for an allowlisted account:

```bash
php artisan tinker --execute="$u = App\\Models\\User::where('email','you@example.com')->first(); echo $u?->createToken('videohogg-worker')->plainTextToken;"
```

Use the token as `VIDEOHOGG_TOKEN` for the queue watcher process.

## Testing

```bash
npm run backend:test
```

## Scheduler

The heartbeat command in Forge should run every minute:

```bash
php8.3 /home/forge/hoggcountry.on-forge.com/current/backend/artisan schedule:run >> /home/forge/hoggcountry.on-forge.com/current/backend/storage/logs/scheduler.log 2>&1
```

Laravel schedule tasks:

- `trackers:refresh` (every minute) polls Garmin MapShare for each saved tracker and upserts fresh points into `tracker_fixes`.

Manual verification:

```bash
php artisan schedule:list
php artisan trackers:refresh
tail -f storage/logs/scheduler.log
tail -f storage/logs/laravel.log
```

`No trackers found for refresh.` means no `community_trackers` records exist yet for your user.

## Notes

- Default DB is SQLite (`backend/database/database.sqlite`).
- Sanctum token auth is enabled for API routes.
- Sync conflicts use deterministic checks based on `client_updated_at` and `device_id`.
- Google OAuth uses `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, and `GOOGLE_REDIRECT_URI`.
- Optional browser callback redirect: `FRONTEND_AUTH_CALLBACK_URL` (e.g., `https://hoggcountry.com/login`).
- Optional callback host allowlist: `FRONTEND_AUTH_ALLOWED_HOSTS` (comma-separated).
- VideoHogg intake allowlist: `VIDEOHOGG_ALLOWED_EMAILS` (comma-separated emails allowed to upload).
- VideoHogg YouTube ideas allowlist: `VIDEOHOGG_YOUTUBE_IDEA_EMAILS` (comma-separated emails allowed to trigger YouTube title/description generation).
- VideoHogg storage disk: `VIDEOHOGG_STORAGE_DISK` (`public` default, set to `s3` for Cloudflare R2/S3-backed storage).
- YouTube feed settings for live video lists: `YOUTUBE_CHANNEL_ID` (recommended), optional `YOUTUBE_PLAYLIST_ID` fallback.
- Public live videos API: `GET /api/v1/videos/latest?limit=12&source=channel` (returns latest feed entries with no-cache headers for always-fresh UI polling).
- R2/S3 endpoint settings use standard Laravel AWS vars (`AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_BUCKET`, `AWS_ENDPOINT`, `AWS_URL`, `AWS_DEFAULT_REGION`, `AWS_USE_PATH_STYLE_ENDPOINT`).
- VideoHogg queue statuses: `queued`, `processing`, `done`, `failed`.
- VideoHogg service lifecycle statuses: `submitted`, `in_hands`, `in_progress`, `packaging`, `delivered`, `revision_requested`, `completed`, `blocked`.
