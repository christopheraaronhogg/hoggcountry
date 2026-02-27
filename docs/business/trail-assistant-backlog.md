# Trail Assistant Backlog

Last updated: 2026-02-27 17:04 CT

## P0 — Build the operating core
- [x] Create intake endpoint + routing labels (pre-trail / on-trail / post-finish) — API: `POST /api/v1/trail-assistant/intake`
- [ ] Create request triage checklist
- [ ] Create response templates (quick reply, 7-day plan, gear sheet, resupply memo)
- [ ] Create daily runlog autopdater (or disciplined manual append)
- [ ] Create blocker email template helper

## P1 — Pilot readiness
- [ ] Simulate 5 realistic hiker requests and produce responses
- [ ] Measure response turnaround time + quality checklist pass rate
- [ ] Add FAQ from simulation gaps
- [ ] Draft pilot invite copy (approval required before posting)

## P1 — Security hardening
- [ ] Write explicit untrusted-input handling checklist
- [ ] Add forbidden-actions list for inbound requests
- [ ] Add credential-handling policy references
- [ ] Add incident response mini-runbook for suspicious requests

## P2 — Marketing engine (approval-gated)
- [ ] Draft 10 YouTube concepts for AT prep + on-trail support
- [ ] Draft 5 short-form posts that point to lead magnet
- [ ] Build weekly content queue board
- [ ] Add performance tracking sheet (views, clicks, replies, leads)

## P2 — Payment-ready (but deferred)
- [ ] Define product tiers and pricing assumptions
- [ ] Define Stripe objects/events needed later
- [ ] Define purchase-to-delivery automation handoff points

## Current active task
- Active: P0 setup of intake/triage/templates + cron ops loops

## Completed on 2026-02-27
- [x] Created public intake page + confirmation route
- [x] Created security policy document
- [x] Created intake SOP
- [x] Created response template library
- [x] Created autonomous marketing engine draft pipeline
