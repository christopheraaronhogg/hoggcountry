# Trail Assistant Implementation Plan

Last updated: 2026-03-11
Status: Draft execution plan

## 1. Purpose

This plan turns the Trail Assistant product thesis into a build order. It assumes the existing Hogg Country repo remains the system of record for the web experience, Laravel API surface, and early mobile shell experiments.

## 2. Starting point in the repo

### Already shipped or partially shipped
- public intake flow: `/trail-assistant`
- profile-state proof path: `/trail-assistant-profile`
- BYOS preview path: `/trail-assistant-byos`
- legacy AI chat path: `/ask`
- native proof route: `/native` via Laravel Inertia + Svelte
- authenticated APIs for:
  - support chat
  - location check-ins
  - progress
  - map-sharing settings and feeds
  - map reports and moderation
  - SOS escalation
  - triage visibility and quarantine
  - plan catalog metadata
- governance, security, and operational runbooks

### Already documented
- `docs/business/trail-assistant-mobile-roadmap.md`
- `docs/business/trail-assistant-phone-screen-contract.md`
- `docs/business/trail-assistant-mobile-api-contract.md`
- `docs/business/trail-assistant-security-policy.md`
- `docs/business/trail-assistant-sos-runbook.md`

### Gaps to close
- no cohesive premium mobile experience yet
- no Trail Readiness engine
- no adaptive itinerary engine
- no structured town/partner operations layer
- no concierge dashboard
- no production-clean deploy parity
- no live subscription/billing integration

## 3. Delivery principles

- ship a closed-loop hiker workflow before adding breadth
- prefer operational leverage over visual surface area
- design for weak signal and offline first
- keep humans inside the system for edge cases
- instrument every queue and handoff
- keep one clear mobile path: dedicated SvelteKit + Capacitor app, not a stretched responsive website

## 4. Recommended stack

### Public site
- Astro 5
- Svelte 5 islands
- Tailwind CSS 4

### Backend
- Laravel 12
- Sanctum auth
- Socialite where external login is appropriate
- Forge-managed API deployment

### Mobile
- SvelteKit + Capacitor as the committed iOS/Android path
- TypeScript shared domain logic where useful
- offline queue and replay stored on device

### What not to do
- do not make Astro the primary mobile app shell
- do not treat the existing Inertia `/native` route as the end-state app architecture
- do not split the backend into a second API stack for mobile unless forced by scale

## 5. Recommended product slice order

1. **Today**
2. **Plan**
3. **Coach**
4. **Check-In + Safety**
5. **Town**
6. **Concierge console**
7. **Partner network**
8. **Subscription + growth loops**

That order keeps the product useful before it becomes operationally heavy.

## 6. Workstreams

### Workstream A — Deploy and platform reliability

Goal: make the current public Trail Assistant surface trustworthy enough to iterate on.

Tasks:
- resolve Netlify/Forge route drift and verify all public Trail Assistant URLs
- standardize environment configuration for `PUBLIC_API_BASE_URL`
- add CI checks for Trail Assistant route and API smoke tests
- add deploy verification automation for public URLs and critical endpoints

Acceptance criteria:
- `/trail-assistant`, `/trail-assistant-profile`, and `/trail-assistant-byos` work on the public domain
- public APIs used by those routes resolve correctly
- deploy verification runbook can be executed without manual detective work

### Workstream B — Information architecture and design system

Goal: define the product UI model before heavy frontend buildout.

Tasks:
- finalize tab model: Today, Plan, Coach, Town, Safety, Account
- define shared hiker state model used across all surfaces
- define visual language for “WHOOP for hiking” without copying WHOOP directly
- define low-signal/offline visual states
- define action hierarchy for push/hold/nero/zero/slackpack recommendations

Acceptance criteria:
- screen contracts exist for all v1 tabs
- shared component inventory exists
- each screen has empty, loading, stale, offline, and synced states documented

### Workstream B2 — Mobile app shell

Goal: establish the real iOS/Android delivery surface early so product decisions are made against the right constraints.

Tasks:
- create a dedicated `mobile/` workspace for SvelteKit + Capacitor
- wire auth bootstrap against existing Laravel APIs
- define device storage strategy for offline queue and cached hiker state
- confirm push notification and background location plugin strategy
- create CI build path for iOS and Android targets

Acceptance criteria:
- mobile app can authenticate, fetch profile state, and persist offline cache
- Android and iOS projects build from the same Capacitor source tree
- no critical user flow depends on Astro web pages inside the app shell

### Workstream C — Hiker profile and state foundation

Goal: create the unified data model that powers personalized recommendations.

Tasks:
- move profile from browser-only demo state to authenticated server-side profile
- define hiker profile fields:
  - direction
  - start date
  - experience level
  - target pace
  - injury history
  - gear profile
  - budget profile
  - resupply preferences
  - emergency contacts
- define daily trail log fields:
  - sleep quality
  - soreness
  - foot issues
  - appetite
  - hydration
  - GI issues
  - shoe mileage
  - medication flags
- define itinerary state and latest segment context

Data model additions:
- `trail_assistant_profiles`
- `trail_assistant_daily_logs`
- `trail_assistant_itineraries`
- `trail_assistant_itinerary_days`
- `trail_assistant_partner_directory`

Acceptance criteria:
- authenticated profile CRUD exists
- daily log CRUD exists
- hiker state can be fetched in one request for app hydration

### Workstream D — Trail Readiness engine

Goal: turn hiker state into a clear daily recommendation.

Version 1 inputs:
- prior 3-day mileage
- prior 3-day elevation gain
- sleep quality
- soreness / injury flags
- weather severity
- current segment difficulty
- time pressure vs plan

Outputs:
- readiness score
- confidence band
- recommended day type: push | standard | hold | nero | zero | seek help
- recommended mileage and vert cap
- top three reasons driving the recommendation

Tasks:
- define scoring heuristic first, ML later if ever
- create rules engine with explainable output
- store readiness snapshots for auditability
- render “why this changed” in the app

Acceptance criteria:
- readiness output is deterministic and explainable
- recommendation can be recalculated on any state change
- high-risk cases trigger concierge review suggestions

### Workstream E — Adaptive itinerary engine

Goal: maintain a rolling 7-day plan that updates as conditions change.

Version 1 responsibilities:
- next camps / shelters / hostels
- planned town stop
- resupply window
- weather pivot suggestions
- bailout point visibility
- budget estimate for next 7 days

Tasks:
- define itinerary inputs from route, pace, weather, and partner data
- create itinerary generation service
- support manual concierge overrides with audit trail
- expose plan diffs to the user

Acceptance criteria:
- itinerary can be generated for a configured hiker profile
- itinerary can be regenerated after a missed day, storm, zero, or injury flag
- user sees both plan and reason for change

### Workstream F — Coach experience

Goal: make chat useful because it is grounded, not because it is verbose.

Tasks:
- unify the legacy `/ask` lane with authenticated Trail Assistant context
- pass profile, readiness, itinerary, segment, and recent logs into the model layer
- create quick-action intents:
  - weather
  - mileage
  - town
  - resupply
  - gear
  - pain / injury
  - shuttle
- add confidence scoring and human escalation logic
- keep answer format short, actionable, and context-aware

Acceptance criteria:
- chat replies reference the hiker’s current context
- users can escalate from chat to support without restating everything
- low-confidence scenarios are routed into human triage

### Workstream G — Town intelligence and partner network

Goal: build the first moat beyond content and AI.

Version 1 data to capture:
- lodging availability notes
- shuttle windows
- shower / laundry / breakfast availability
- resupply quality
- mail-drop handling
- slackpacking availability
- known closures or seasonal caveats

Tasks:
- create partner directory schema and admin UI
- seed 3 launch regions manually
- define freshness windows and owner fields for partner data
- create internal ops playbook for partner updates

Acceptance criteria:
- Town screen can render structured partner data for pilot regions
- concierge can update or override partner info quickly
- stale partner data is visibly marked internally

### Workstream H — Safety and support-circle experience

Goal: make safety visible without becoming a surveillance product.

Tasks:
- refine check-in UX and stale/missed check-in logic
- define support-circle permissions and visibility levels
- add family-facing status summary page or notifications
- integrate SOS and map-report flows into the Today/Safety surfaces
- evaluate Garmin inReach import or relay as a later integration path

Acceptance criteria:
- a missed check-in creates a deterministic escalation path
- user can control sharing scope clearly
- support-circle view never exposes more than configured

### Workstream I — Concierge operations console

Goal: give human operators one place to act, not just observe.

Console modules:
- queue overview
- active hikers needing review
- urgent safety queue
- itinerary override tools
- partner directory lookups
- communication timeline

Tasks:
- build role-based operator dashboard
- unify intake/chat/SOS/map signals into one queue view
- create escalation states and SLA timers
- add notes, assignment, and resolution workflow

Acceptance criteria:
- operator can resolve a town/logistics case without leaving the system
- all sensitive actions are audited
- SLA timers and stale queue alerts are visible

### Workstream J — Subscription and monetization

Goal: convert product value into a sustainable seasonal business.

Tasks:
- formalize plan matrix: Free, Hiker, Trail Pro, Concierge
- connect entitlement model to Stripe when owner setup is ready
- gate premium features in app and operator tools
- add trial / grace / past_due handling

Acceptance criteria:
- plan-based feature access is enforced consistently
- billing failure states degrade gracefully
- concierge upsell path is clear but not spammy

## 7. Phase plan

### Phase 0 — Doc and deploy alignment
Duration: 1-2 weeks

Deliverables:
- PRD and implementation docs approved
- deploy drift resolved
- public Trail Assistant demo path healthy
- architecture and API docs refreshed

### Phase 1 — Closed pilot MVP
Duration: 4-6 weeks

Scope:
- dedicated SvelteKit + Capacitor app shell
- authenticated profile
- daily log
- Today screen
- basic 7-day Plan
- grounded Coach
- improved Check-In and Safety screen

Pilot target:
- 10-25 hikers
- manually supported concierge backup

### Phase 2 — Regional logistics depth
Duration: 4-6 weeks

Scope:
- Town screen
- partner directory for 3 regions
- concierge console
- support-circle visibility

Pilot target:
- 25-75 hikers
- at least 10 active partners across launch regions

### Phase 3 — Paid product hardening
Duration: 3-5 weeks

Scope:
- Stripe-backed subscriptions
- entitlement enforcement
- queue instrumentation
- SLA and retention reporting
- support playbooks and launch ops

### Phase 4 — Expansion
Duration: ongoing

Scope:
- broader region coverage
- deeper partner ops
- richer family features
- selective integrations like weather enrichment and satellite-device workflows

## 8. Detailed backlog by phase

### Phase 0
- close P0.7 deploy drift
- reconcile root docs and Trail Assistant docs
- define v1 design language
- confirm source-of-truth route and API docs

### Phase 1
- create `mobile/` app shell with Capacitor
- implement auth session bootstrap in mobile app
- implement device queue and replay engine
- build authenticated profile endpoints and storage
- build daily log endpoints and storage
- implement Today readiness service
- implement itinerary generation service
- build app shell tabs for Today, Plan, Coach, Safety, Account
- connect chat grounding to profile + readiness + itinerary
- add event instrumentation for open, submit, sync, escalate

### Phase 2
- build partner directory tables and admin CRUD
- build Town screen and region seed data
- build concierge console queue overview
- add itinerary override workflow
- add support-circle settings and summary experience

### Phase 3
- integrate Stripe
- enforce plan gates
- implement trial, grace, and downgrade handling
- add revenue, conversion, and retention dashboards

## 9. Suggested implementation sequence by repository area

### Backend (`backend/`)
- stabilize public API deployment
- add profile, daily log, itinerary, partner, and operator domain models
- add services for readiness and planning
- add operator console routes and auth policies
- add subscription provider integration

### Web / Astro (`src/pages`, `src/components`)
- keep public marketing and intake surfaces in Astro
- use Svelte islands for interactive Trail Assistant surfaces where appropriate
- migrate the legacy `/ask` experience toward authenticated Trail Assistant Coach flows

### Mobile app (`mobile/`)
- build dedicated SvelteKit + Capacitor client
- implement phone-first tabs
- implement offline queue and replay semantics
- keep UI thin and server-driven where possible

### Existing Inertia proof shell (`backend/resources/js`)
- keep `/native` only as a prototype or internal proving path
- do not let it become the long-term consumer mobile client by accident

### Ops docs (`docs/business`)
- maintain queue, safety, support, deploy, and partner operating docs
- keep screen contract, PRD, and implementation plan current

## 10. Metrics and instrumentation plan

Track from day one:
- Today screen opens per active hiker
- readiness recalculations per user-week
- plan changes accepted vs ignored
- concierge escalation rate
- first-response SLA
- urgent case resolution time
- check-in completion rate
- retention through day 30 / day 60 / Katahdin completion proxy

## 11. Risks and mitigations

- **Risk:** product tries to replace too many trail tools at once
  - **Mitigation:** lead with Today + Plan + Coach, not a giant map suite
- **Risk:** partner data gets stale
  - **Mitigation:** freshness metadata, owner assignment, and narrow launch regions
- **Risk:** safety support load becomes operationally expensive
  - **Mitigation:** clear escalation thresholds, staffed windows, and premium tiering
- **Risk:** deploy drift undermines trust
  - **Mitigation:** URL verification in every release gate
- **Risk:** mobile architecture stays ambiguous too long
  - **Mitigation:** create the dedicated SvelteKit + Capacitor shell in Phase 1, even if features are still thin
- **Risk:** unclear legal positioning around guiding
  - **Mitigation:** position as planning/logistics/concierge, not trailwide guiding

## 12. Definition of done for v1

Trail Assistant v1 is ready when:
- Android and iOS builds come from the dedicated mobile app shell
- a pilot hiker can onboard, log state, get a daily recommendation, and receive a live 7-day plan
- the Coach can answer with user-specific context instead of generic AT advice
- town/logistics escalations can be handled in one operator workflow
- check-ins, privacy controls, and SOS flows are reliable
- public and authenticated routes are stable in production
- at least one paid tier can be enforced end to end
