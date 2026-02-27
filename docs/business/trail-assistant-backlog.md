# Trail Assistant Backlog

Last updated: 2026-02-27 17:30 CT

## P0 — Mobile core (must ship first)
- [x] Intake endpoint + routing labels (`POST /api/v1/trail-assistant/intake`)
- [x] Public intake page + confirmation route
- [x] Intake form API submit wiring with graceful Netlify fallback
- [x] Intake idempotency + duplicate guard (`Idempotency-Key` + fingerprint window)
- [x] Authenticated chat-message API lane (`POST/GET /api/v1/trail-assistant/chat/messages`)
- [x] Authenticated location check-in + progress APIs (`/checkins`, `/progress`)
- [x] Authenticated intake triage visibility endpoints (`/trail-assistant/intakes`, `/trail-assistant/intakes/export.csv`)
- [x] Subscription-ready plan catalog endpoint (`GET /api/v1/trail-assistant/plans`) with Stripe wiring deferred
- [x] Mobile-ready API contract + deploy verification runbook docs

## P1 — Service reliability + pilot readiness
- [ ] Simulate 5 realistic hiker requests and score response quality
- [ ] Measure turnaround time and checklist pass rate
- [ ] Add FAQ from simulation gaps
- [ ] Add abuse/rate-limit policy and enforcement notes
- [ ] Add suspicious-request quarantine path in triage workflow

## P1 — Operations automation
- [ ] Daily runlog autopdater helper
- [ ] Blocker email template helper + auto-send guard
- [ ] Daily/weekly queue review automation

## P2 — Mobile product layer
- [x] Mobile-first roadmap drafted
- [x] Subscription event/state model documented (pre-Stripe)
- [ ] Phone app screen contract refinement (Home / Chat / Check-in / Progress / Account)
- [ ] Offline check-in replay strategy doc + implementation hooks

## P2 — Marketing engine (approval-gated)
- [ ] Draft 10 YouTube concepts for AT prep + on-trail support
- [ ] Draft 5 short-form posts that point to lead magnet
- [ ] Build weekly content queue board
- [ ] Add performance tracking sheet (views, clicks, replies, leads)

## Current active task
- Active: P1 pilot simulation + quality scorecard hardening

## Completed on 2026-02-27
- [x] Created autonomous MVP plan
- [x] Added security/ops docs and runlog/backlog system
- [x] Added mobile-first roadmap + API contract + subscription event model
- [x] Added intake dedupe guard + triage export visibility
- [x] Added chat/check-in/progress API lanes for mobile app core
