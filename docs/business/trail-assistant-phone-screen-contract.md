# Trail Assistant Phone App Screen Contract (Refined)

Last updated: 2026-02-28

## Goal
Define implementation-level contracts for the first five phone screens so frontend + backend stay aligned under low-signal trail conditions.

## Shared UX rules (all screens)
- Prioritize one-thumb use and low cognitive load.
- Every mutating action shows: `queued` | `syncing` | `synced` state.
- Never block core trail actions when offline; queue and replay.
- Show last successful sync timestamp where meaningful.

---

## 1) Home screen
### Core blocks
- Today plan card (distance/weather/risk cue)
- Next check-in CTA
- SOS CTA (high-contrast, deliberate tap affordance)
- Sync health pill

### Required data
- `GET /trail-assistant/progress`
- `GET /trail-assistant/map-sharing/settings`
- cached queue status (local)

### Offline behavior
- Use cached progress snapshot.
- Surface stale badge if last sync age > configured threshold.

---

## 2) Chat screen
### Core blocks
- Message timeline
- Quick chips: weather, mileage, town, gear
- Compose + send

### Required data
- `GET /trail-assistant/chat/messages?limit=...`
- `POST /trail-assistant/chat/messages`

### Offline behavior
- Compose/send writes to local queue first.
- Replay uses `client_event_id` + optional `Idempotency-Key`.
- Server echoes `idempotent_replay` and `duplicate_guard` for deterministic merge.

---

## 3) Check-in screen
### Core blocks
- GPS lock + precision state
- Mile marker input
- Optional note/battery
- Privacy preview (`scope`, `precision`, `delay`)

### Required data
- `GET/PUT /trail-assistant/map-sharing/settings`
- `POST /trail-assistant/checkins`

### Offline behavior
- Check-ins queue locally with:
  - `client_event_id`
  - optional `Idempotency-Key`
  - `replayed_from_offline=true` on replay
- Server returns sync metadata and replay flags to avoid duplicate UI entries.

---

## 4) Progress screen
### Core blocks
- latest mile
- miles since first check-in
- completion percent
- recent path summary

### Required data
- `GET /trail-assistant/progress`
- `GET /trail-assistant/checkins/history?limit=...`

### Offline behavior
- Show cached trend with explicit "offline snapshot" label.
- Merge replayed check-ins into local chart optimistically, reconcile on sync.

---

## 5) Account screen
### Core blocks
- profile basics
- map-sharing defaults
- subscription placeholder state
- data/safety links

### Required data
- `GET /auth/me`
- `GET/PUT /trail-assistant/map-sharing/settings`
- `GET /trail-assistant/plans`

### Offline behavior
- Settings edits queue if network unavailable.
- Show pending-change count and allow manual retry.

---

## Offline replay strategy hooks (backend-aligned)
1. **Chat replay hooks**
   - accepts `client_event_id`, optional `Idempotency-Key`, and `replayed_from_offline`.
   - response includes `idempotent_replay`, `duplicate_guard`, and sync metadata.
2. **Check-in replay hooks**
   - accepts `client_event_id`, optional `Idempotency-Key`, `sync_metadata`, `replayed_from_offline`.
   - enforces user-scoped replay de-duplication on both key types.
3. **Existing replay-ready lanes**
   - intake, map reports, and SOS already support `Idempotency-Key`.

## Client replay contract
- Generate stable `client_event_id` at enqueue time.
- Keep local `pending/synced/failed` states keyed by `client_event_id`.
- On 200 + `idempotent_replay=true`, mark local event synced (no duplicate insert).
- Retry with backoff; never drop unsent emergency payloads without user acknowledgment.
