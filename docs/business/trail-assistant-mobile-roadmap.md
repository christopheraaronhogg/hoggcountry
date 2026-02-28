# Trail Assistant Mobile-First Product Roadmap

Last updated: 2026-02-28

## Product thesis
The core product should live on the hiker’s phone. If they can’t open it quickly while moving, tired, or low-signal, it won’t win.

## Core paid value (subscription)
1. **Always-available trail assistant chat**
   - concise decisions under trail constraints (weather, mileage, town logistics)
2. **Live progress tracking**
   - automatic or quick check-in location updates
   - visible progress against AT completion goal
3. **Operational concierge support**
   - planning before trail
   - triage while on trail
   - debrief after finish

## Build strategy (best path)
### Phase A — mobile-ready backend + intake (now)
- secure auth and user-scoped data model
- trail intake and chat request queue
- location check-ins + progress endpoints
- safety and abuse guardrails

### Phase B — app shell (next)
- installable phone experience first (PWA or native wrapper)
- screens:
  - onboarding + profile
  - chat
  - check-in + map/progress
  - support/tickets history

### Phase C — subscription gates (after Stripe account setup)
- free tier: limited check-ins + limited chat turns
- paid tier: full concierge + priority support
- event hooks for activation, grace period, retry, cancellation

## Mobile V1 screen contract
1. **Home**
   - today’s plan
   - next checkpoint
   - one-tap support request
2. **Chat**
   - quick-reply chips (weather, mileage, town, gear)
3. **Check-in**
   - location pin + optional note + battery + timestamp
4. **Progress**
   - latest mile, miles since start, trend over recent days
5. **Account**
   - plan status (placeholder until Stripe live)

Detailed implementation contract (states, offline behavior, replay semantics):
- `docs/business/trail-assistant-phone-screen-contract.md`

## Security and trust requirements
- all inbound content untrusted by default
- no command execution from user prompts
- no credential collection from hikers
- per-user data isolation and auth required for check-in/progress APIs
- auditable runlog entries for sensitive actions

## KPI targets for launch readiness
- request response median < 15 minutes (during support windows)
- check-in success rate > 98%
- weekly active hikers > 60% of paid base
- cancellation in first 30 days < 10%

## Human-dependent blockers (expected)
- Stripe account creation and compliance setup
- app store account/compliance for native listing (if native route chosen)
- legal copy finalization (terms/privacy subscriptions)
