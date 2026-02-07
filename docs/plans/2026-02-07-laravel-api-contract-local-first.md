# Laravel API Contract (Local-First Sync) — v1

Status: **ready for backend implementation**  
Date: **2026-02-07**  
Audience: Laravel developer + HoggCountry frontend maintainer

## 1) Codebase Audit Summary (Current Reality)

- Frontend stack is Astro + Svelte islands on Netlify.
- Current auth is Netlify Functions + env-backed users (`AUTH_USERS_JSON`) and signed cookie sessions.
- Canonical local user model is `localStorage["hcCharacter.v1"]` (large `CharacterV1` JSON).
- `trailContext` is now a compatibility mirror; source of truth is `hcCharacter.v1`.
- Map tracking already polls Garmin via `/.netlify/functions/garmin-track` every 30s (`Cache-Control: no-store`), so live points are not deploy-gated.
- Community tracker list currently comes from env (`COMMUNITY_TRACKERS_JSON`) via `/.netlify/functions/community-trackers`.
- Forecast page already supports `Now`, `Next 24h`, `Next 7d` UI modes.
- Known UX bug to fix in parallel: guide progress bar overlays the tools drawer on `/guide` because `.guide-header-wrapper` creates a stacking context below `FullGuideNav` progress z-index.

## 2) Product Direction

We want **local-first data** (fast, offline-capable, resilient), with authenticated cloud sync for:

1. Accounts and identity.
2. Cross-device continuity for profile/tool data.
3. Social map features (community hikers).
4. Future server-side features (subscriptions, documents, AI artifacts).

## 3) Scope for API v1

### In Scope

- Account system (register/login/logout/me/password reset/email verify).
- Device registration for sync.
- Sync endpoints for canonical docs (starting with `hcCharacter.v1`).
- Community tracker connections per user.
- Live tracker aggregation endpoint for map/social layer.

### Out of Scope (v1)

- Rewriting the whole site into Laravel views.
- Migrating every localStorage key on day 1.
- Replacing Open-Meteo weather API.
- Replacing all Netlify functions immediately.

## 4) Local-First Sync Contract

## 4.1 Canonical Sync Unit

Use a document model:

- `doc_type` (string): e.g. `character`, `guide_highlights`, `settings`.
- `doc_id` (string): e.g. `primary`.
- `content` (json): full document payload.
- `schema_version` (int): client schema version (`CharacterV1` => `1`).
- `client_updated_at` (datetime with ms, UTC).
- `server_updated_at` (datetime with ms, UTC).
- `deleted_at` (nullable datetime).
- `last_device_id` (uuid).
- `etag` (sha256 hash of normalized JSON).

For v1, sync only:

- `localStorage["hcCharacter.v1"]` -> `doc_type=character`, `doc_id=primary`, `schema_version=1`.

Optional v1.1:

- `localStorage["guide-highlights"]` -> `doc_type=guide_highlights`, `doc_id=primary`.

Do not sync yet (local-only/ephemeral):

- `hcAtMap.previewMile`, `hcAtWeather.previewMile`, temporary UI state keys.

## 4.2 Conflict Rule (Deterministic)

Use last-writer-wins with stable tie-breakers:

1. Higher `client_updated_at` wins.
2. If equal, higher `server_updated_at` wins.
3. If still equal, lexicographically higher `device_id` wins.

Server must return conflict metadata when rejecting a stale write.

## 4.3 Sync Sequence

1. Client authenticates.
2. Client registers/loads `device_id`.
3. Client calls bootstrap endpoint (gets docs + server cursor).
4. Client pushes local doc updates.
5. Client pulls remote changes since last cursor.

## 5) API Endpoints (v1)

Base URL: `https://app.hoggcountry.com/api/v1`

Authentication:

- Bearer token (Sanctum personal access token for API clients).
- All `/sync/*`, `/me/*`, `/community/*`, `/trackers/*` require auth.

Response envelope (recommended):

```json
{
  "data": {},
  "error": null,
  "meta": { "request_id": "uuid" }
}
```

## 5.1 Auth

1. `POST /auth/register`
2. `POST /auth/login`
3. `POST /auth/logout`
4. `POST /auth/forgot-password`
5. `POST /auth/reset-password`
6. `GET /auth/verify-email/{id}/{hash}`
7. `GET /auth/me`

Minimal `POST /auth/login` response:

```json
{
  "data": {
    "token": "plain-text-token",
    "user": { "id": "uuid", "email": "jimmy@example.com", "name": "Jimmy Hogg" }
  }
}
```

## 5.2 Devices

1. `POST /devices/register`
2. `GET /devices`
3. `DELETE /devices/{device_id}`

`POST /devices/register` request:

```json
{
  "device_id": "uuid-v4-generated-client-side",
  "platform": "web",
  "device_name": "Chris MacBook Safari"
}
```

## 5.3 Sync

1. `GET /sync/bootstrap`
- Returns all docs in scope + current cursor.

2. `POST /sync/push`
- Accepts batch upserts/deletes from one device.

Request:

```json
{
  "device_id": "uuid",
  "changes": [
    {
      "op": "upsert",
      "doc_type": "character",
      "doc_id": "primary",
      "schema_version": 1,
      "client_updated_at": "2026-02-07T19:48:00.123Z",
      "etag": "sha256hex",
      "content": { "version": 1, "trail": { "currentMile": 211.2 } }
    }
  ]
}
```

Response:

```json
{
  "data": {
    "applied": [
      {
        "doc_type": "character",
        "doc_id": "primary",
        "server_updated_at": "2026-02-07T19:48:01.102Z",
        "etag": "sha256hex"
      }
    ],
    "rejected": []
  }
}
```

3. `GET /sync/pull?cursor=<opaque>`
- Returns ordered remote changes since cursor.

Response:

```json
{
  "data": {
    "changes": [
      {
        "doc_type": "character",
        "doc_id": "primary",
        "op": "upsert",
        "schema_version": 1,
        "server_updated_at": "2026-02-07T19:48:01.102Z",
        "etag": "sha256hex",
        "content": { "version": 1, "trail": { "currentMile": 211.2 } }
      }
    ],
    "next_cursor": "opaque-cursor"
  }
}
```

## 5.4 Community / Social Tracking

1. `GET /community/trackers`
- Returns trackers user follows or has configured.

2. `POST /community/trackers`
- Add a tracker source.

Request:

```json
{
  "label": "Dad",
  "garmin_share_id": "hoggcountry",
  "color": "#2563eb",
  "is_public": false
}
```

3. `PATCH /community/trackers/{id}`
4. `DELETE /community/trackers/{id}`

5. `GET /trackers/live`
- Returns normalized live fix for all visible trackers (including own tracker).
- Server should cache upstream Garmin calls briefly (15-30s) to avoid thundering herd.

Example response:

```json
{
  "data": {
    "fixes": [
      {
        "tracker_id": "uuid",
        "label": "Dad",
        "lat": 34.79,
        "lon": -83.95,
        "mile": 38.4,
        "observed_at": "2026-02-07T19:47:25Z",
        "source": "garmin_mapshare"
      }
    ]
  }
}
```

## 6) Laravel Data Model (Migrations)

Minimum tables:

1. `users` (Laravel default + email verified timestamp).
2. `profiles` (`user_id`, `display_name`, `trail_name`, `bio`, `avatar_url`).
3. `devices` (`id uuid`, `user_id`, `platform`, `device_name`, `last_seen_at`).
4. `sync_documents`
   - `id uuid`
   - `user_id`
   - `doc_type`
   - `doc_id`
   - `schema_version`
   - `content json`
   - `etag`
   - `client_updated_at`
   - `server_updated_at`
   - `last_device_id`
   - `deleted_at`
   - unique index: (`user_id`, `doc_type`, `doc_id`)
5. `sync_changes` (append-only change feed for pull cursor)
   - `seq bigIncrements` (cursor)
   - `user_id`, `doc_type`, `doc_id`, `op`, `server_updated_at`, `payload json`, `etag`
6. `community_trackers`
   - `id uuid`, `user_id`, `label`, `garmin_share_id`, `color`, `is_public`, timestamps
7. `tracker_fixes` (optional but recommended cache/history)
   - `tracker_id`, `lat`, `lon`, `mile`, `observed_at`, `raw json`

## 7) Frontend Integration Contract

Frontend stays local-first:

- Load local docs first (instant UI).
- Sync runs in background after login and on app resume.
- If API fails, app continues on local data with a non-blocking sync warning badge.

Client sync cadence:

- Immediate push on meaningful writes (debounced 2-5s).
- Pull every 60-120s while app is open.
- Pull once on tab focus / app open.

## 8) Security + Ops Requirements

- Use HTTPS only.
- Enable CORS for Netlify origin(s) only.
- Rate-limit auth + tracker endpoints.
- Hash + store tokens securely (Sanctum).
- Add structured logs with request IDs.
- Add DB backups and queue worker health checks.

## 9) Phased Delivery Plan

## Phase 1: Auth Foundation (2-3 days)

- Laravel app bootstrapped (Forge), Sanctum tokens, auth endpoints, `/auth/me`.
- Done when frontend can login and fetch authenticated profile.

## Phase 2: Device + Character Sync (3-5 days)

- `devices`, `sync_documents`, `sync_changes` tables.
- `/sync/bootstrap`, `/sync/push`, `/sync/pull`.
- Done when `hcCharacter.v1` round-trips across 2 browsers.

## Phase 3: Community Tracker API (2-4 days)

- `community_trackers` CRUD.
- `/trackers/live` aggregator endpoint.
- Done when map can show configured community hikers from API data.

## Phase 4: Migration Cutover (2-3 days)

- Replace Netlify env-user auth with Laravel auth in frontend.
- Keep local-first behavior unchanged.
- Done when Netlify auth functions are no longer required for login/session.

## Phase 5: Extended Sync (optional)

- Add `guide-highlights` and other durable docs.
- Add subscriptions/documents later (Trail Vault).

## 10) Immediate Cross-Team Task List

1. Backend: implement Phase 1 endpoints and share Postman/OpenAPI collection.
2. Frontend: add API client + token storage + device registration.
3. Backend: implement Phase 2 sync endpoints with cursor-based pull.
4. Frontend: wire `hcCharacter.v1` push/pull cycle.
5. Frontend UX fix: raise `.guide-header-wrapper` z-index above `FullGuideNav` progress bar so tools drawer overlays correctly on `/guide`.
6. Infra: add Laravel API origin to `Content-Security-Policy` `connect-src` in `netlify.toml`.

## 11) Definition of Done (v1)

- User can sign up/login/logout against Laravel API.
- `hcCharacter.v1` syncs across devices without blocking local use.
- Conflict handling is deterministic and test-covered.
- Community tracker list is account-backed (not env var backed).
- Frontend still works offline and with API downtime.
