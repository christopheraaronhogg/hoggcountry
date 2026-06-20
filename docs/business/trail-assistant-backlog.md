# Trail Assistant Backlog

Last updated: 2026-03-05 07:05 CT

## This Week (2026-03-02 → 2026-03-08)
- [x] **P0.1** Add FAQ from simulation gaps (privacy sharing + map verification expectations)
- [x] **P0.5** Restore a demo-ready Trail Assistant path (local fallback) with intake submit + profile-state route + evidence screenshots
- [x] **P0.6** Produce BYOS architecture decision for OpenAI/ChatGPT feasibility + scaffold provider/entitlement abstraction
- [x] **P0.8** Add BYOS entitlement preview endpoint + demo UI route for morning proof checks
- [ ] **P0.7** Resolve production deploy drift (Netlify/Forge route mismatch) and verify public Trail Assistant URLs post-deploy
- [x] **P0.2** Ship blocker email template helper + auto-send guard
- [x] **P0.3** Ship daily runlog autopdater helper
- [x] **P0.4** Ship daily/weekly queue review automation
- [ ] **P1.1** Build weekly content queue board (internal draft only; no public posting without approval)

## Re-ranked open backlog (impact + dependency)

## P0 — Reliability + autonomy critical path
- [x] Add FAQ from simulation gaps
  - Impact: closes the only known pilot response-quality gap before live inbound volume grows.
  - Dependency: pilot simulation + checklist baseline already complete.
- [x] Demo-ready local Trail Assistant path with profile state + intake submit evidence
  - Impact: provides a credible end-to-end fallback demo even while public deploy is misaligned.
  - Dependency: local frontend/backend startup + sqlite migrations.
- [x] BYOS feasibility decision + provider/entitlement scaffolding
  - Impact: unblocks monetization/auth architecture and prevents unsupported ChatGPT-subscription promises.
  - Dependency: source-backed policy research + minimal backend abstraction layer.
- [ ] Resolve production deploy drift (Netlify/Forge route mismatch)
  - Impact: restores public user-facing URLs and API parity.
  - Dependency: deploy access to Netlify + Forge env/branch alignment.
  - Latest status: GitHub push (`2c51960`) completed, but public endpoints remained unchanged after propagation monitoring.
- [x] Blocker email template helper + auto-send guard
  - Impact: enforces the >24h owner-escalation safety rule from the autonomy plan.
  - Dependency: none (shipped 2026-03-03).
  - Output: `scripts/trail_assistant_blocker_email_helper.py` + `docs/business/trail-assistant-blocker-email-helper.md` (draft-first mode with explicit auto-send guard token).
- [x] Daily runlog autopdater helper
  - Impact: keeps daily execution evidence current with less manual overhead.
  - Dependency: none (shipped 2026-03-04).
  - Output: `scripts/trail_assistant_runlog_autoupdater.py` + `docs/business/trail-assistant-runlog-autopdater-helper.md` + npm alias `trail-assistant:runlog-autoupdate`.
- [x] Daily/weekly queue review automation
  - Impact: preserves planning cadence and prevents silent backlog aging.
  - Dependency: none (shipped 2026-03-05).
  - Output: `scripts/trail_assistant_queue_review_helper.py` + `docs/business/trail-assistant-queue-review-helper.md` + npm alias `trail-assistant:queue-review`.

## P1 — Near-term growth setup
- [ ] Build weekly content queue board
  - Impact: creates the execution container for approval-gated marketing output.
  - Dependency: none (internal artifact).

## P2 — Marketing engine (approval-gated output layer)
- [ ] Draft 10 YouTube concepts for AT prep + on-trail support
- [ ] Draft 5 short-form posts that point to lead magnet
- [ ] Add performance tracking sheet (views, clicks, replies, leads)

## Current active task
- Active: P1.1 weekly content queue board (P0.7 deploy drift remains owner-decision blocked)

## Historical completion ledger

### Mobile core (shipped)
- [x] Intake endpoint + routing labels (`POST /api/v1/trail-assistant/intake`)
- [x] Public intake page + confirmation route
- [x] Intake form API submit wiring through the Forge API; no Netlify form fallback remains
- [x] Intake idempotency + duplicate guard (`Idempotency-Key` + fingerprint window)
- [x] Authenticated chat-message API lane (`POST/GET /api/v1/trail-assistant/chat/messages`)
- [x] Authenticated location check-in + progress APIs (`/checkins`, `/progress`)
- [x] Authenticated intake triage visibility endpoints (`/trail-assistant/intakes`, `/trail-assistant/intakes/export.csv`)
- [x] Safety map-report APIs (public feed + auth write/read/resolve)
- [x] Subscription-ready plan catalog endpoint (`GET /api/v1/trail-assistant/plans`) with Stripe wiring deferred
- [x] Mobile-ready API contract + deploy verification runbook docs

### Service reliability completed (shipped)
- [x] Simulate 5 realistic hiker requests and score response quality
- [x] Measure turnaround time and checklist pass rate (`trail-assistant-turnaround-checklist-baseline-2026-02-28.md`)
- [x] Add abuse/rate-limit policy and enforcement notes
- [x] Add suspicious-request quarantine path in triage workflow
- [x] Add map-report moderator verification workflow (promote unverified -> trusted/moderator_verified)
- [x] Add emergency/SOS escalation path and response protocol
- [x] Add privacy controls for shared map visibility (scope + coarse mode + delayed visibility)
- [x] Add moderator governance configuration endpoint + process docs (non-secret policy controls)
- [x] Improve SOS responder queue operational visibility payload (queue metrics + SLA signals)

### Mobile product layer (shipped)
- [x] Mobile-first roadmap drafted
- [x] Subscription event/state model documented (pre-Stripe)
- [x] Phone app screen contract refinement (Home / Chat / Check-in / Progress / Account)
- [x] Offline check-in replay strategy doc + implementation hooks

## Completed on 2026-02-27
- [x] Created autonomous MVP plan
- [x] Added security/ops docs and runlog/backlog system
- [x] Added mobile-first roadmap + API contract + subscription event model
- [x] Added intake dedupe guard + triage export visibility
- [x] Added chat/check-in/progress API lanes for mobile app core

## Completed on 2026-02-28
- [x] Added moderator verification workflow for map reports with auth guard + audit trail
- [x] Added emergency/SOS escalation API path with idempotency, cooldown, duplicate-window, and daily-cap abuse protections
- [x] Added map-sharing privacy controls (private/trusted/public scope, coarse mode, delayed visibility)
- [x] Added feature tests for map verification, SOS flow, and map privacy controls
- [x] Added suspicious-request quarantine workflow for intake triage (moderator-only quarantine/release + privacy-first queue scoping)
- [x] Completed pilot simulation round (5 realistic hiker requests) with quality scoring (`trail-assistant-pilot-simulation-2026-02-28.md`)
- [x] Measured turnaround time + checklist pass-rate baseline (`trail-assistant-turnaround-checklist-baseline-2026-02-28.md`)

## Completed on 2026-03-01
- [x] Closed cross-user idempotency replay risk in map-report/SOS flows via user-scoped idempotency checks + conflict response on cross-user key collisions

## Completed on 2026-03-02
- [x] Added Trail Assistant FAQ from simulation gaps covering privacy-sharing defaults, map-report verification expectations, abuse-resistance controls, and incident response path (`trail-assistant-faq.md`)

## Completed on 2026-03-03
- [x] Added demo-visible profile state path (`/trail-assistant-profile`) and linked it to intake metadata flow (`/trail-assistant`) with local proof artifacts.
- [x] Captured local + public evidence pack under `docs/business/daily-updates/assets/2026-03-03/trail-assistant-demo/`.
- [x] Published BYOS architecture decision for OpenAI/ChatGPT feasibility and scaffolded provider abstraction + entitlement checks (`trail-assistant-byos-architecture-decision-2026-03-03.md`).
- [x] Added BYOS entitlement preview lane (`POST /api/v1/trail-assistant/byos/entitlement-preview`) plus demo route (`/trail-assistant-byos`) with masked credential proof artifacts.
- [x] Shipped blocker escalation helper + guard (`trail-assistant:blocker-email`) with draft-first behavior and explicit auto-send confirmation token.

## Completed on 2026-03-04
- [x] Shipped daily runlog autopdater helper (`trail-assistant:runlog-autoupdate`) with date-section auto-create, structured entry formatting, and operator guide (`trail-assistant-runlog-autopdater-helper.md`).

## Completed on 2026-03-05
- [x] Shipped daily/weekly queue review automation helper (`trail-assistant:queue-review`) with stale-task detection, blocker escalation signal checks, and operator guide (`trail-assistant-queue-review-helper.md`).
