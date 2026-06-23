# Cloud backup & sync — architecture plan

**Date:** 2026-06-23
**Status:** approved; Phase 0 in progress
**Goal:** Back up the local-first mobile app to the cloud (durable backup + multi-device
restore + tramily sharing) **without breaking offline-first.**

## Decisions (locked)

1. **Identity:** support **both** email+password **and** Sign in with Apple from day one.
2. **Backup is opt-in** — the app stays fully anonymous + offline unless the user signs in.
3. Build it on the **existing Laravel/Sanctum sync backend** (see below) — no new infra.

Open decisions still needing Chris:
- A **non-prod Laravel target** to test Phase 0/1 against without polluting prod (a staging
  DB on `hoggcountry.on-forge.com`, or a test account). Needed before end-to-end verification.
- Check-ins via generic `sync_documents` (chosen for v1 uniformity) vs the existing
  first-class `TrailAssistantCheckin` endpoint (revisit if check-ins need server features).

## The finding that shapes everything

The Laravel backend (`backend/`) **already has a complete, unused offline-sync API**:

- `POST /api/v1/auth/{register,login,forgot-password,reset-password,logout}`, `/me`, Google OAuth
  (Socialite). **Sanctum tokens never expire** (`config/sanctum.php: expiration => null`) — ideal
  for a months-long hike.
- `POST /api/v1/devices/register` (+ index/destroy) — 1-device-1-account with a `409 device_conflict`
  guard (`DeviceController.php`).
- `GET /api/v1/sync/bootstrap`, `POST /api/v1/sync/push`, `GET /api/v1/sync/pull` — per-user,
  **document-level last-write-wins** with deterministic device-id tie-breaking, an append-only
  change log with pull cursors, soft deletes, and idempotent re-push detection (`SyncController.php`).
- Migrations: `create_sync_documents`, `create_sync_changes`, `create_devices` (2026-02-07).

Every sync query is scoped to `request->user()->id`, so cross-user reads are impossible by
construction. **The server half is done.** Almost all the work is mobile-side.

## Recommended architecture — hybrid (zero new infra)

- **SpacetimeDB stays** for *public, real-time, location-keyed* telemetry: Trail Pulse, water
  reports, and (Phase 3) live tramily positions. Anonymous by design, shared by mile bucket — no
  per-user ownership needed. (Its anonymous per-device token **cannot** anchor multi-device restore,
  and its tables are all `public:true` with no row security — so private PII must never go there.)
- **Laravel/Sanctum `sync_documents`** is the *private, durable* backup + restore store for
  everything personal.

**Key design move — decompose the blob.** Stop treating the monolithic
`hoggcountry:trail-assistant:...` localStorage blob as one record. Split it into small per-entity
sync documents keyed by `(doc_type, doc_id)`, so the backend's per-document LWW is *correct*
(independent fields live in independent docs):

| doc_type | doc_id | notes |
|---|---|---|
| `profile-identity` | `me` | hikeProfile minus live position |
| `position` | `me` | currentMile + mileSource; its own doc so GPS ticks never clobber profile |
| `checkin` | record id | one doc per check-in — append-only, union by id, never deleted on restore |
| `support-circle` | `me` | SENSITIVE (phones) |
| `people-group` | group id | SENSITIVE (phones) |
| `document` | note id | trip notes |
| `loadout` | `me` | gear |
| `settings` | each name | privacy / trail / trail-log settings |
| `bible-annotations` | `me` | highlights + notes; merge-by-verseId on bootstrap |
| `chat-tail` | `me` | OPTIONAL last-N Scout messages; lowest priority |

## What to back up

**Backup-critical (irreplaceable, user-authored):** hikeProfile, check-in history, support circle
(phones), people/tramily roster (phones), trip notes, loadout, settings, Bible highlights/notes.
Total typical payload is **sub-1 MB** — an architecture problem, not a volume problem.

**Derived / cacheable (do NOT back up):** the context/field pack (re-fetchable from
`/scout/field-pack`), trail geometry + KJV index (bundled assets), the SpacetimeDB device token.

**Already-synced, own pipeline (not private backup):** Trail Pulse + water reports → SpacetimeDB.

## Identity (the crux of restore)

The same account on a reinstalled phone is what makes the backup findable.

- **Email+password** Sanctum account (already built — zero backend work).
- **Sign in with Apple** (App Store-friendly, near-zero friction) — needs the Capacitor SiWA
  plugin + iOS "Sign in with Apple" capability + the backend Apple Socialite driver (mirror the
  existing Google flow). The native plugin + Apple Developer credentials + Xcode capability are
  Chris's steps (like the iOS build).
- Token + device UUID stored in **Capacitor Preferences (iOS Keychain)** — **never localStorage**
  (the token grants full account access). Device UUID generated once, survives restarts.

Restore = login → `GET /sync/bootstrap` → hydrate localStorage keys → `GET /sync/pull` loop from
the returned cursor.

## Offline never breaks

Sync never touches the write path. Every change writes to localStorage/Preferences first and
succeeds immediately. Backup is a separate, opportunistic, fire-and-forget layer.

- **Outbox** (`hc-sync-outbox-v1`, persisted so it survives app kills): on any change to a
  backup-critical entity, enqueue `{op, doc_type, doc_id, content, client_updated_at, etag}` where
  `etag = sha256(content)` truncated to ≤64 chars. **Coalesce by (doc_type, doc_id)** — a position
  that moves 50× offline collapses to one push.
- **Drain** on app-start / `online` event / periodic timer (online + signed in): `POST /sync/push`
  in batches → mark synced / remove / advance cursor. On `stale_client_updated_at` /
  `tie_breaker_lost` → server is newer → pull + apply locally (server wins). Then `GET /sync/pull`
  for other devices' changes.

**Conflict policy per type:** position = LWW by timestamp (a restored old phone must NEVER reset
live mile); check-ins = append-only union by id (never lose safety history); profile/settings/
support-circle/loadout = per-doc LWW; bible = merge by verse.

## Privacy & security

- All sync over HTTPS to `/api/v1/*` behind `auth:sanctum`; queries scoped to the user — no
  cross-user reads.
- **Token in Keychain, not localStorage** (the one hard requirement).
- Sensitive payloads (live position, phone numbers, "need-help" notes): Phase 1 relies on
  TLS + Sanctum + Postgres on the controlled Forge box. **Phase 4** adds app-level field encryption
  for the sensitive `doc_type`s (targeted, thanks to the decomposed model).
- Two distinct planes: **family/tramily real-time visibility** = SpacetimeDB pub/sub with per-group
  opt-in (gated by `privacySettings.stealthMode` / `sharePreciseLocation`); **private backup** =
  single-user, never shared (family members get their own accounts, never a shared login).
- A "delete my cloud backup" action (device delete + a purge endpoint). Permanent server-side
  deletion stays Chris's to run (standing rule on destructive data ops).

## Phased rollout

| Phase | What | Size | Before Feb 2026? |
|---|---|---|---|
| **0 — Foundations** | Device-UUID + auth/token modules (Keychain); email+password **and** Sign in with Apple; minimal opt-in "Back up my hike" UI in Account. No sync yet. | ~3–4 days | **Yes (critical path)** |
| **1 — Back up the crown jewels** | Outbox + push engine; decompose + push profile/position/check-ins/support-circle/people/settings/notes/loadout → `/sync/push` on change + online + timer; handle server-wins. **One-way: "if the phone dies, the hike is safe."** No restore UI yet. | ~3–5 days | **Yes (critical path)** |
| 2 — Restore + bootstrap | `/sync/bootstrap` → hydrate, `/pull` loop; "Restore from cloud" UI. Multi-device + reinstall-safe. + bible-annotations, chat-tail. | ~3–4 days | nice-to-have |
| 3 — Tramily live sharing | Opt-in per-group live position over SpacetimeDB (the Life360 vision), gated by privacy settings. Real-time pub/sub, NOT the backup store. | ~1 week | post-launch |
| 4 — Hardening | App-level field encryption for PII doc_types; backup-delete/purge; retry/backoff + observability; "last backed up" indicator. | as needed | post-launch |

**Critical path before the hike = Phase 0 + Phase 1 (~1 focused week).**

## Risks

- **Token security:** a Sanctum token in localStorage would be a real leak — MUST use Keychain. (Hard requirement.)
- **Server-wins on position** is correct for safety but a genuinely-newer offline edit on a long-dark device could lose to a stale-but-later value under clock skew; trust device-local monotonic timestamps; low impact for a single primary device.
- **etag column is 64 chars** — truncate the hash to fit (`SyncController` validates `max:64`).
- **iOS Keychain can be wiped on some restores** — then the user re-logs-in + bootstraps; no data loss, just re-auth.
- **No backend tests** exist for the dead sync endpoints — add feature tests (`php artisan test`) under the real mobile payload shapes as Phase 1 lands.
- **SpacetimeDB env** (`PUBLIC_SPACETIMEDB_HOST/_DB_NAME`) must be set in prod so water/Trail Pulse keep working independent of the new backup path.
