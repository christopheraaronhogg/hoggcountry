# Trail Assistant Stack Decision — Mobile + Realtime

Last updated: 2026-02-27

## Decision
Use a **hybrid architecture**:

1. **Laravel API (system of record)**
   - auth / identity
   - intake, chat history, support queue
   - subscription entitlement state
   - moderation + audit logs

2. **SpacetimeDB (realtime sidecar)**
   - live map fanout
   - presence / active trail rooms
   - low-latency report and chat broadcast

This keeps billing/security deterministic while enabling strong realtime UX.

## Why not SpacetimeDB-only?
- Subscription + account/compliance workflows are easier and safer in Laravel.
- Durable ops/history/moderation/auditing remains clearer in transactional app DB.
- Realtime events can still be mirrored to Laravel for forensics and rollback safety.

## Mobile readiness
SpacetimeDB is viable for mobile when app runtime supports persistent websocket connections (typical iOS/Android app runtimes do). For production mobile behavior:
- use reconnect/backoff strategy,
- queue offline writes locally,
- replay writes with idempotency keys,
- keep Laravel fallback path when realtime channel is unavailable.

## Safety-first realtime rules
- Public map only exposes trusted/verified safety reports.
- Unverified reports remain visible only to authenticated users with caution labeling.
- Emergency markers expire quickly unless reconfirmed.
- Every realtime write is mirrored to Laravel with actor ID + timestamp.

## Realtime event classes
- `map_report_created`
- `map_report_resolved`
- `checkin_updated`
- `chat_message_posted`
- `safety_broadcast`

## Integration phases
1. Current: Laravel-only APIs for all mobile core flows.
2. Next: add SpacetimeDB stream for map + presence while preserving Laravel writes.
3. Later: optimize hot paths (live map/chat) to primary realtime via SpacetimeDB with guaranteed write-through to Laravel.
