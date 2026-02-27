# Trail Assistant Mobile API Contract (Draft)

Last updated: 2026-02-27

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

Responses include:
- `checkin` payload
- `progress` snapshot (`latest_mile_marker`, `percent_of_at_complete`, etc.)

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

## 5) Triage/admin visibility (auth)
`GET /trail-assistant/intakes`
`GET /trail-assistant/intakes/export.csv`

Use for support queue review/export with status/route/search filters.

---

## Mobile client behavior notes
- Queue check-ins locally when offline; replay on connectivity restore.
- Surface last successful check-in timestamp in UI.
- For urgent support, submit intake/chat with `route_label=on-trail` + urgency metadata.
- Include `Idempotency-Key` on retriable POST requests.
