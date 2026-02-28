# Trail Assistant Mobile API Contract (Draft)

Last updated: 2026-02-28

Base path: `/api/v1`
Auth: Bearer token (`auth:sanctum`) for protected endpoints.

## 0) Subscription plan metadata (public)
`GET /trail-assistant/plans`

Purpose: render pricing/entitlement cards before Stripe wiring is active.

---

## 1) Support intake (public)
`POST /trail-assistant/intake`

Body:
```json
{
  "route_label": "pre-trail|on-trail|post-finish",
  "source": "web_form|email|chat",
  "name": "optional",
  "email": "optional",
  "subject": "required",
  "message": "required",
  "metadata": {"optional": "object"}
}
```

### Duplicate protection
- Optional header: `Idempotency-Key: <client-generated-key>`
- Server also applies payload fingerprint duplicate-window guard.

---

## 2) Chat support lane (auth)
`POST /trail-assistant/chat/messages`
`GET /trail-assistant/chat/messages?limit=20`

Body (POST):
```json
{
  "route_label": "on-trail",
  "subject": "Need town stop advice",
  "message": "Core request text",
  "urgency": "normal|soon|urgent",
  "metadata": {"optional": "object"}
}
```

---

## 3) Location check-ins (auth)
`POST /trail-assistant/checkins`
`GET /trail-assistant/checkins?limit=120`
`GET /trail-assistant/checkins/latest`
`GET /trail-assistant/checkins/history?limit=120`

POST body:
```json
{
  "lat": 34.123456,
  "lon": -83.123456,
  "mile_marker": 101.2,
  "battery_percent": 64,
  "status_note": "Optional short note",
  "source": "mobile_app",
  "observed_at": "2026-02-27T10:15:00Z"
}
```

Check-in responses now include visibility snapshot fields:
- `share_scope` (`private|trusted|public`)
- `share_location_mode` (`exact|coarse`)
- `visible_after` (timestamp when point may appear in shared feeds)

---

## 4) Progress-only endpoint (auth)
`GET /trail-assistant/progress`

Response:
```json
{
  "data": {
    "progress": {
      "at_total_miles": 2197.4,
      "first_mile_marker": 101.2,
      "latest_mile_marker": 108.9,
      "miles_since_first_checkin": 7.7,
      "percent_of_at_complete": 4.96,
      "latest_observed_at": "2026-02-27T17:15:00.000000Z"
    }
  },
  "error": null,
  "meta": {"request_id": "..."}
}
```

---

## 5) Map-sharing privacy controls
### Settings (auth)
`GET /trail-assistant/map-sharing/settings`
`PUT /trail-assistant/map-sharing/settings`

PUT body:
```json
{
  "share_scope": "private|trusted|public",
  "location_mode": "exact|coarse",
  "visibility_delay_minutes": 90
}
```

### Shared feeds
- Public delayed feed: `GET /trail-assistant/map-sharing/public`
- Authenticated trusted+public feed: `GET /trail-assistant/map-sharing/feed`

Behavior:
- `private` scope: not visible to shared feeds.
- `trusted` scope: visible on authenticated feed once `visible_after` passes.
- `public` scope: visible on public feed once `visible_after` passes; minimum public delay is enforced.

---

## 6) Triage/admin visibility (auth)
`GET /trail-assistant/intakes`
`GET /trail-assistant/intakes/export.csv`

Use for support queue review/export with status/route/search filters.

---

## 7) Realtime map safety reports
### Public feed (safe visibility)
`GET /trail-assistant/map-reports/public`

Returns only active reports that pass visibility trust rules (`trusted` / `moderator_verified`).

### Authenticated write/read/moderation
`POST /trail-assistant/map-reports` (auth)
`GET /trail-assistant/map-reports` (auth)
`POST /trail-assistant/map-reports/{reportId}/verify` (moderator)
`GET /trail-assistant/map-reports/{reportId}/audit` (owner/moderator)
`POST /trail-assistant/map-reports/{reportId}/resolve` (owner/moderator)

POST body:
```json
{
  "lat": 35.611,
  "lon": -83.489,
  "mile_marker": 243.4,
  "kind": "tree_down|water_issue|bridge_out|trail_closed|injury_assist|wildlife|weather_hazard|other",
  "severity": "info|caution|danger|emergency",
  "message": "Optional short field report",
  "observed_at": "2026-02-27T18:00:00Z",
  "expires_in_hours": 48
}
```

Safety controls:
- idempotency replay support
- per-user duplicate-window guard
- expiration windows on hazard markers
- public feed excludes unverified reports
- moderator verification promotions write immutable audit events

---

## 8) SOS escalation (auth)
`POST /trail-assistant/sos/escalate`
`GET /trail-assistant/sos/escalations?scope=mine|queue`
`POST /trail-assistant/sos/escalations/{escalationId}/status` (moderator)

POST body:
```json
{
  "lat": 35.611,
  "lon": -83.489,
  "mile_marker": 243.4,
  "message": "Emergency details",
  "contact_method": "in_app|sms|satellite",
  "observed_at": "2026-02-28T00:10:00Z",
  "confirm_emergency": true,
  "metadata": {"optional": "object"}
}
```

Abuse protections:
- explicit emergency confirmation required
- idempotency replay support
- duplicate fingerprint window guard
- cooldown lockout for active escalations
- 24h per-user cap
- route-level throttle
- all escalations require manual responder review (`pending_review`)

---

## Mobile client behavior notes
- Queue check-ins locally when offline; replay on connectivity restore.
- Queue map hazard reports and SOS payloads when offline; send on reconnect with `Idempotency-Key`.
- Surface last successful check-in timestamp in UI.
- Surface map-sharing status (`scope`, `precision`, `delay`) clearly before user enables sharing.
- For urgent support, submit intake/chat with `route_label=on-trail` + urgency metadata.
- Include `Idempotency-Key` on retriable POST requests.
