# HoggCountry Profitability Execution Task List (Start Here System — Atomic Expansion)

**Date:** 2026-02-11  
**Owner:** CodeHogg / HoggCountry  
**Operating Rule:** This is a **100% completion system**. No skipped tasks. No silent carryover. Every line needs evidence.

---

## Executive summary

This plan preserves the original Start Here strategy, phase sequencing, and top-10 critical path intent, but expands execution from **36 parent tasks** into **126 atomic tasks** so work can be executed and audited with minimal ambiguity.

**What changed:**
- Parent strategy remained fixed (`BH-001`…`BH-036`).
- Each parent now contains 3–4 child tasks with hierarchical IDs (`BH-001.01`, `BH-001.02`, …).
- Every atomic task now has explicit ownership, dependency, KPI target, and Definition of Done fields in CSV.
- Checklist format is grouped by phase and parent to support true 100% completion tracking.

---

## Concise rationale for expanded granularity

The prior 36-item list was directionally strong but still too coarse for execution control. This expansion turns each parent objective into concrete build/QA/launch units, which improves:

1. **Execution clarity** — each line is small enough to assign, start, finish, and verify.
2. **Dependency management** — blockers are visible at child-task level instead of hidden inside broad parent work.
3. **Scorecard accuracy** — completion percentages now reflect real throughput, not partially-done parent buckets.
4. **Delegation reliability** — owner lanes can pick up atomic tasks without re-scoping every week.

---

## Atomic backlog snapshot

- **Total atomic tasks:** **126**
- **Phase 0 (0-14d):** 48 tasks
- **Phase 1 (15-45d):** 33 tasks
- **Phase 2 (46-90d):** 26 tasks
- **Phase 3 (90+d):** 19 tasks
- **Top-10 critical path atomic tasks:** 40

---

## Top 10 tasks (exact order; intent unchanged)

| Order | ID | Title | Why this slot |
|---:|---|---|---|
| 1 | BH-001 | Lock profitability event taxonomy + KPI dictionary | Lock definitions first so all downstream tracking and dashboards are coherent. |
| 2 | BH-002 | Instrument client-side funnel events across high-traffic surfaces | Without front-end instrumentation, there is no funnel data. |
| 3 | BH-003 | Create backend event ingestion API + analytics_events table | Events must persist server-side before decisions are made. |
| 4 | BH-004 | Ship weekly profitability scorecard generation (execution KPIs + money KPIs) | Turn raw data into weekly operating visibility. |
| 5 | BH-005 | Replace direct outbound gear links with tracked redirect flow | Convert biggest existing monetization surface (gear links) into attributable clicks. |
| 6 | BH-006 | Normalize gear link catalog + affiliate parameter map | Standardize links to avoid revenue leakage and compliance drift. |
| 7 | BH-007 | Add lead capture gate before Field Guide download | Capture leads from highest-value existing free asset (/guide downloads). |
| 8 | BH-008 | Integrate email service + 5-message welcome sequence | Follow-up system converts leads into buyers; no nurture = wasted leads. |
| 9 | BH-009 | Insert monetization CTAs in homepage, videos, and tools hub | Place CTAs where traffic already exists. |
| 10 | BH-010 | Launch Start Here-aligned offers landing page | Unify offers in one destination before paid traffic/retargeting scale. |


---

## Atomic master checklist (126 tasks)

### Phase 0 (0-14d)
#### BH-001 — Lock profitability event taxonomy + KPI dictionary (Critical Path #1)
- [ ] BH-001.01 — Audit existing tracked vs untracked user actions across BaseLayout, DownloadModal, BudgetGearBuilder, and TrailChat
  - Evidence: ____________________  Done date: __________  Done by: __________
- [ ] BH-001.02 — Define v1 event naming convention and payload schema (source, campaign, value, session) in profitability-event-taxonomy-start-here.md
  - Evidence: ____________________  Done date: __________  Done by: __________
- [ ] BH-001.03 — Map each event to funnel stage, KPI owner, and weekly scorecard metric in the dictionary
  - Evidence: ____________________  Done date: __________  Done by: __________
- [ ] BH-001.04 — Run taxonomy sign-off review and lock v1 changelog + instrumentation acceptance checklist
  - Evidence: ____________________  Done date: __________  Done by: __________

#### BH-002 — Instrument client-side funnel events across high-traffic surfaces (Critical Path #2)
- [ ] BH-002.01 — Add shared client tracking helper and BaseLayout bootstrap hook for reliable event dispatch
  - Evidence: ____________________  Done date: __________  Done by: __________
- [ ] BH-002.02 — Instrument guide/download and gear/tool CTA events in DownloadModal, BudgetGearBuilder, and ToolsDashboard
  - Evidence: ____________________  Done date: __________  Done by: __________
- [ ] BH-002.03 — Instrument TrailChat, videos index, and ProtoF Ranger/home CTA blocks with taxonomy-compliant events
  - Evidence: ____________________  Done date: __________  Done by: __________
- [ ] BH-002.04 — Execute click-through QA matrix and capture payload evidence for priority funnel events
  - Evidence: ____________________  Done date: __________  Done by: __________

#### BH-003 — Create backend event ingestion API + analytics_events table (Critical Path #3)
- [ ] BH-003.01 — Create analytics_events migration with indexed event_name, source, session/user, and occurred_at columns
  - Evidence: ____________________  Done date: __________  Done by: __________
- [ ] BH-003.02 — Implement AnalyticsEventController request validation, auth handling, and batched insert flow
  - Evidence: ____________________  Done date: __________  Done by: __________
- [ ] BH-003.03 — Register /api/v1/analytics/events route with rate limiting and abuse protection
  - Evidence: ____________________  Done date: __________  Done by: __________
- [ ] BH-003.04 — Add API tests plus load sanity run proving valid event persistence under expected traffic
  - Evidence: ____________________  Done date: __________  Done by: __________

#### BH-004 — Ship weekly profitability scorecard generation (execution KPIs + money KPIs) (Critical Path #4)
- [ ] BH-004.01 — Define weekly profitability scorecard schema and markdown output template in docs/business/scorecards/
  - Evidence: ____________________  Done date: __________  Done by: __________
- [ ] BH-004.02 — Build BuildProfitabilityScorecard aggregation logic for completion %, funnel, and money KPIs
  - Evidence: ____________________  Done date: __________  Done by: __________
- [ ] BH-004.03 — Wire scripts/profitability-scorecard.mjs and scheduling config for Monday automated generation
  - Evidence: ____________________  Done date: __________  Done by: __________
- [ ] BH-004.04 — Publish first two real weekly scorecards and reconcile metrics against source event/order data
  - Evidence: ____________________  Done date: __________  Done by: __________

#### BH-005 — Replace direct outbound gear links with tracked redirect flow (Critical Path #5)
- [ ] BH-005.01 — Design outbound redirect contract (item_id, source, campaign, destination, signed token)
  - Evidence: ____________________  Done date: __________  Done by: __________
- [ ] BH-005.02 — Implement OutboundLinkController redirect endpoint to log click data then issue safe 302
  - Evidence: ____________________  Done date: __________  Done by: __________
- [ ] BH-005.03 — Refactor BudgetGearBuilder Buy buttons to use src/lib/outboundLinks.ts tracked redirect URLs
  - Evidence: ____________________  Done date: __________  Done by: __________
- [ ] BH-005.04 — QA 20 sampled gear links confirming click records and final merchant destination accuracy
  - Evidence: ____________________  Done date: __________  Done by: __________

#### BH-006 — Normalize gear link catalog + affiliate parameter map (Critical Path #6)
- [ ] BH-006.01 — Audit gearRecommendations.json for duplicate SKUs, dead links, and missing monetization flags
  - Evidence: ____________________  Done date: __________  Done by: __________
- [ ] BH-006.02 — Create affiliateMap.json with partner parameter rules, disclosure tags, and exceptions
  - Evidence: ____________________  Done date: __________  Done by: __________
- [ ] BH-006.03 — Implement normalize-gear-links.mjs lint/normalize pass and remediate all catalog violations
  - Evidence: ____________________  Done date: __________  Done by: __________
- [ ] BH-006.04 — Publish partner-terms + tagging coverage report showing 100% monetizable-link classification
  - Evidence: ____________________  Done date: __________  Done by: __________

#### BH-007 — Add lead capture gate before Field Guide download (Critical Path #7)
- [ ] BH-007.01 — Design low-friction /guide lead gate UX and copy with email-only required field policy
  - Evidence: ____________________  Done date: __________  Done by: __________
- [ ] BH-007.02 — Implement lead form validation and modal state flow in DownloadModal and DownloadGuideButton
  - Evidence: ____________________  Done date: __________  Done by: __________
- [ ] BH-007.03 — Wire lead submit API call and unlock PDF/Markdown download only after successful capture event
  - Evidence: ____________________  Done date: __________  Done by: __________
- [ ] BH-007.04 — Run desktop/mobile funnel QA proving lead_created then asset_downloaded sequence integrity
  - Evidence: ____________________  Done date: __________  Done by: __________

#### BH-008 — Integrate email service + 5-message welcome sequence (Critical Path #8)
- [ ] BH-008.01 — Finalize email provider integration approach and configure credentials/env documentation
  - Evidence: ____________________  Done date: __________  Done by: __________
- [ ] BH-008.02 — Implement LeadCaptureController contact upsert + SendLeadWelcomeSequence trigger
  - Evidence: ____________________  Done date: __________  Done by: __________
- [ ] BH-008.03 — Author five-message welcome sequence (timing, objective, CTA) in start-here-welcome.md
  - Evidence: ____________________  Done date: __________  Done by: __________
- [ ] BH-008.04 — Validate deliverability with seed tests, bounce/error logging, and <5 minute first-send SLA
  - Evidence: ____________________  Done date: __________  Done by: __________

#### BH-009 — Insert monetization CTAs in homepage, videos, and tools hub (Critical Path #9)
- [ ] BH-009.01 — Define monetization CTA placement map for homepage/proto ranger, videos index, and tools hub
  - Evidence: ____________________  Done date: __________  Done by: __________
- [ ] BH-009.02 — Implement contextual CTA modules for Lead Magnet, Trail Launch Kit, and VideoHogg pilot paths
  - Evidence: ____________________  Done date: __________  Done by: __________
- [ ] BH-009.03 — Attach attribution parameters and event tracking to each CTA variant and location
  - Evidence: ____________________  Done date: __________  Done by: __________
- [ ] BH-009.04 — Publish 14-day baseline CTR report and iterate weak placements/copy before scale
  - Evidence: ____________________  Done date: __________  Done by: __________

#### BH-010 — Launch Start Here-aligned offers landing page (Critical Path #10)
- [ ] BH-010.01 — Draft offer hierarchy and messaging blocks for free/core/premium stack on start-here-offers page
  - Evidence: ____________________  Done date: __________  Done by: __________
- [ ] BH-010.02 — Build src/pages/start-here-offers.astro with proof blocks, CTA hierarchy, and route metadata
  - Evidence: ____________________  Done date: __________  Done by: __________
- [ ] BH-010.03 — Add OG asset + SEO metadata wiring (BaseHead, og image, canonical, social tags)
  - Evidence: ____________________  Done date: __________  Done by: __________
- [ ] BH-010.04 — Validate conversion links + analytics events on offers page and log launch evidence in scorecard
  - Evidence: ____________________  Done date: __________  Done by: __________

#### BH-011 — Document unit economics baseline (chat + VideoHogg + infra)
- [ ] BH-011.01 — Inventory variable/fixed cost inputs for TrailChat, VideoHogg, infra, and third-party tooling
  - Evidence: ____________________  Done date: __________  Done by: __________
- [ ] BH-011.02 — Build baseline unit-economics model with assumptions and formulas in unit-economics-baseline.md
  - Evidence: ____________________  Done date: __________  Done by: __________
- [ ] BH-011.03 — Attach source queries/log extracts for cost-per-100 asks and cost-per-VideoHogg run calculations
  - Evidence: ____________________  Done date: __________  Done by: __________
- [ ] BH-011.04 — Review and lock weekly unit-economics refresh cadence with threshold alerts
  - Evidence: ____________________  Done date: __________  Done by: __________

#### BH-012 — Implement AI usage guardrails to cap variable cost
- [ ] BH-012.01 — Define AI usage guardrail policy: per-user quotas, caching behavior, fallback responses, and hard caps
  - Evidence: ____________________  Done date: __________  Done by: __________
- [ ] BH-012.02 — Implement guardrail enforcement in ask.ts, TrailChat UX, and supporting backend routes
  - Evidence: ____________________  Done date: __________  Done by: __________
- [ ] BH-012.03 — Add monitoring counters for over-limit events, cache hit rate, and cost-per-active-user trend
  - Evidence: ____________________  Done date: __________  Done by: __________
- [ ] BH-012.04 — Run before/after analysis proving >=30% cost reduction without core UX regression
  - Evidence: ____________________  Done date: __________  Done by: __________

### Phase 1 (15-45d)
#### BH-013 — Finalize checkout provider and run first successful test transaction
- [ ] BH-013.01 — Evaluate checkout providers against HoggCountry requirements and document weighted decision record
  - Evidence: ____________________  Done date: __________  Done by: __________
- [ ] BH-013.02 — Configure selected provider credentials, webhook endpoints, and .env example values
  - Evidence: ____________________  Done date: __________  Done by: __________
- [ ] BH-013.03 — Execute staging + production-test-mode transaction walkthrough with replayable evidence
  - Evidence: ____________________  Done date: __________  Done by: __________

#### BH-014 — Create product catalog and pricing matrix (quick-pay buyers first)
- [ ] BH-014.01 — Define initial paid SKU set (digital, add-on, service) with buyer segment mapping
  - Evidence: ____________________  Done date: __________  Done by: __________
- [ ] BH-014.02 — Build pricing matrix with list price, COGS, margin %, fulfillment owner, and risk notes
  - Evidence: ____________________  Done date: __________  Done by: __________
- [ ] BH-014.03 — Publish products.json + pricing-matrix-start-here.md and obtain owner sign-off
  - Evidence: ____________________  Done date: __________  Done by: __________

#### BH-015 — Build orders + payment webhook + fulfillment state machine
- [ ] BH-015.01 — Design order lifecycle state machine and webhook event-to-state transition map
  - Evidence: ____________________  Done date: __________  Done by: __________
- [ ] BH-015.02 — Implement orders schema/model plus webhook signature verification and idempotency controls
  - Evidence: ____________________  Done date: __________  Done by: __________
- [ ] BH-015.03 — Add fulfillment event logging, retry queue behavior, and failure alert hooks
  - Evidence: ____________________  Done date: __________  Done by: __________
- [ ] BH-015.04 — Run webhook/payment test suite proving every successful payment yields a valid order record
  - Evidence: ____________________  Done date: __________  Done by: __________

#### BH-016 — Launch paid “Trail Launch Kit” digital offer from existing guide/tool assets
- [ ] BH-016.01 — Package Trail Launch Kit assets from existing guide/tools into versioned paid deliverable bundle
  - Evidence: ____________________  Done date: __________  Done by: __________
- [ ] BH-016.02 — Build trail-launch-kit offer page with value stack, FAQs, and checkout integration
  - Evidence: ____________________  Done date: __________  Done by: __________
- [ ] BH-016.03 — Implement automated post-purchase digital delivery and support instructions
  - Evidence: ____________________  Done date: __________  Done by: __________
- [ ] BH-016.04 — Launch offer and run daily conversion checks until first 20 paid sales milestone
  - Evidence: ____________________  Done date: __________  Done by: __________

#### BH-017 — Implement checklist-driven cross-sell / upsell prompts in tools
- [ ] BH-017.01 — Define upsell trigger points inside PackBuilder, BudgetCalculator, and GearBuilder user flows
  - Evidence: ____________________  Done date: __________  Done by: __________
- [ ] BH-017.02 — Implement upsell components with suppression/frequency rules across tool surfaces
  - Evidence: ____________________  Done date: __________  Done by: __________
- [ ] BH-017.03 — Validate attach-rate telemetry and optimize offer copy/rules to hit >=20% attach target
  - Evidence: ____________________  Done date: __________  Done by: __________

#### BH-018 — Create intentional referral system (codes, credits, reporting)
- [ ] BH-018.01 — Define referral program mechanics (code format, credit rules, expiration, anti-abuse constraints)
  - Evidence: ____________________  Done date: __________  Done by: __________
- [ ] BH-018.02 — Implement referrals table/model/controller plus code generation and redemption flow
  - Evidence: ____________________  Done date: __________  Done by: __________
- [ ] BH-018.03 — Build referrals page/account view with share links, redemption status, and event tracking
  - Evidence: ____________________  Done date: __________  Done by: __________
- [ ] BH-018.04 — Publish payout/credit reconciliation process and validate referral attribution reporting
  - Evidence: ____________________  Done date: __________  Done by: __________

#### BH-019 — Enable retargeting pixels and conversion event map
- [ ] BH-019.01 — Implement retargeting base pixel loading in BaseLayout/netlify config with privacy-safe controls
  - Evidence: ____________________  Done date: __________  Done by: __________
- [ ] BH-019.02 — Map and fire Lead/InitiateCheckout/Purchase conversion events from tracked funnel actions
  - Evidence: ____________________  Done date: __________  Done by: __________
- [ ] BH-019.03 — Validate audience growth and event diagnostics in ad manager with screenshot evidence
  - Evidence: ____________________  Done date: __________  Done by: __________

#### BH-020 — Build and execute 90-day marketing calendar
- [ ] BH-020.01 — Create 90-day marketing calendar with channel, asset, owner, publish date, and KPI target fields
  - Evidence: ____________________  Done date: __________  Done by: __________
- [ ] BH-020.02 — Convert calendar into weekly operating checklist with proof-link requirements
  - Evidence: ____________________  Done date: __________  Done by: __________
- [ ] BH-020.03 — Complete first 4 execution weeks (>=5 actions/week) and publish cadence performance recap
  - Evidence: ____________________  Done date: __________  Done by: __________

#### BH-021 — Implement SEO critical fixes from existing audit backlog
- [ ] BH-021.01 — Prioritize SEO audit backlog fixes by impact (schema, metadata, internal links, alt coverage)
  - Evidence: ____________________  Done date: __________  Done by: __________
- [ ] BH-021.02 — Implement critical SEO fixes in BaseHead, BlogPost layout, Footer, and blog index templates
  - Evidence: ____________________  Done date: __________  Done by: __________
- [ ] BH-021.03 — Run post-fix crawl/search-console validation and log baseline for 60-day organic growth tracking
  - Evidence: ____________________  Done date: __________  Done by: __________

#### BH-022 — Operationalize article publishing checklist for SEO content
- [ ] BH-022.01 — Create enforceable article upload checklist template with required SEO fields
  - Evidence: ____________________  Done date: __________  Done by: __________
- [ ] BH-022.02 — Implement content-seo-lint.mjs and integrate checklist validation into publishing workflow
  - Evidence: ____________________  Done date: __________  Done by: __________
- [ ] BH-022.03 — Ship 12 high-intent posts with completed checklist evidence in content/published-log.csv
  - Evidence: ____________________  Done date: __________  Done by: __________

### Phase 2 (46-90d)
#### BH-023 — Define premium live-map offer (paid layer/features) and validate demand
- [ ] BH-023.01 — Draft premium live-map offer PRD with feature bundle, value narrative, and pricing hypothesis
  - Evidence: ____________________  Done date: __________  Done by: __________
- [ ] BH-023.02 — Add waitlist/preorder capture surfaces on map/trail shell experiences
  - Evidence: ____________________  Done date: __________  Done by: __________
- [ ] BH-023.03 — Evaluate demand signals (waitlist/preorders) and record build/iterate/kill decision
  - Evidence: ____________________  Done date: __________  Done by: __________

#### BH-024 — Add plans/subscriptions/invoices schema and APIs
- [ ] BH-024.01 — Design plans/subscriptions/invoices schema covering statuses, periods, taxes, and ledger relationships
  - Evidence: ____________________  Done date: __________  Done by: __________
- [ ] BH-024.02 — Implement migrations/models/APIs for subscription create, renew, pause/cancel lifecycle actions
  - Evidence: ____________________  Done date: __________  Done by: __________
- [ ] BH-024.03 — Integrate invoice/subscription event handling and state reconciliation logic
  - Evidence: ____________________  Done date: __________  Done by: __________
- [ ] BH-024.04 — Execute lifecycle QA tests proving invoice accuracy and state integrity end-to-end
  - Evidence: ____________________  Done date: __________  Done by: __________

#### BH-025 — Build billing UI + premium access enforcement
- [ ] BH-025.01 — Build account billing UI for plan visibility, payment method management, and cancel/reactivate actions
  - Evidence: ____________________  Done date: __________  Done by: __________
- [ ] BH-025.02 — Enforce premium feature access controls in TrailShell/login flows using subscription state checks
  - Evidence: ____________________  Done date: __________  Done by: __________
- [ ] BH-025.03 — QA billing self-serve success and unauthorized-access prevention across critical scenarios
  - Evidence: ____________________  Done date: __________  Done by: __________

#### BH-026 — Commercialize VideoHogg from family beta to paid pilot
- [ ] BH-026.01 — Define paid VideoHogg pilot package, SLA promises, and qualification rubric
  - Evidence: ____________________  Done date: __________  Done by: __________
- [ ] BH-026.02 — Implement paid pilot application/onboarding flow on videohogg page with payment/invite gating
  - Evidence: ____________________  Done date: __________  Done by: __________
- [ ] BH-026.03 — Add backend processing states and client communication checkpoints for pilot jobs
  - Evidence: ____________________  Done date: __________  Done by: __________
- [ ] BH-026.04 — Close and document first paid pilot cohort outcomes (5 clients or 15 qualified applications)
  - Evidence: ____________________  Done date: __________  Done by: __________

#### BH-027 — Launch NPS + customer wow loop post-purchase
- [ ] BH-027.01 — Design post-purchase NPS survey schedule, question set, and automation triggers
  - Evidence: ____________________  Done date: __________  Done by: __________
- [ ] BH-027.02 — Implement checkout-success follow-up and detractor escalation workflow
  - Evidence: ____________________  Done date: __________  Done by: __________
- [ ] BH-027.03 — Review weekly NPS/refund metrics and execute customer wow recovery actions
  - Evidence: ____________________  Done date: __________  Done by: __________

#### BH-028 — Build bundle engine for post-purchase cross-sell
- [ ] BH-028.01 — Define bundle recommendation logic matrix and margin thresholds for post-purchase offers
  - Evidence: ____________________  Done date: __________  Done by: __________
- [ ] BH-028.02 — Implement OfferEngine bundle rules and checkout-success upsell surfaces
  - Evidence: ____________________  Done date: __________  Done by: __________
- [ ] BH-028.03 — Validate attach/conversion telemetry and iterate rules to reach >=20% post-purchase attach rate
  - Evidence: ____________________  Done date: __________  Done by: __________

#### BH-029 — Automate lead/customer winback sequences
- [ ] BH-029.01 — Define dormant lead/customer segments and winback trigger/suppression criteria
  - Evidence: ____________________  Done date: __________  Done by: __________
- [ ] BH-029.02 — Implement RunWinbackSequence job orchestration and email template variants
  - Evidence: ____________________  Done date: __________  Done by: __________
- [ ] BH-029.03 — Publish weekly reactivation report and optimize offers/subject lines from results
  - Evidence: ____________________  Done date: __________  Done by: __________

#### BH-030 — Run quarterly pricing experiments and document outcomes
- [ ] BH-030.01 — Create quarterly pricing experiment backlog with hypotheses, guardrails, and success criteria
  - Evidence: ____________________  Done date: __________  Done by: __________
- [ ] BH-030.02 — Run controlled pricing tests with control vs variant instrumentation on selected offers
  - Evidence: ____________________  Done date: __________  Done by: __________
- [ ] BH-030.03 — Publish experiment postmortems with keep/kill decisions and gross-profit impact analysis
  - Evidence: ____________________  Done date: __________  Done by: __________

### Phase 3 (90+d)
#### BH-031 — Finalize affiliate compliance + monthly revenue reporting
- [ ] BH-031.01 — Audit affiliate surfaces for disclosure placement, tracking completeness, and policy gaps
  - Evidence: ____________________  Done date: __________  Done by: __________
- [ ] BH-031.02 — Implement disclosures page and inline disclosure components on affiliate-linked surfaces
  - Evidence: ____________________  Done date: __________  Done by: __________
- [ ] BH-031.03 — Publish monthly affiliate compliance + revenue reconciliation report with evidence links
  - Evidence: ____________________  Done date: __________  Done by: __________

#### BH-032 — Publish sponsor/media kit and package page
- [ ] BH-032.01 — Build sponsor/media kit narrative with audience metrics, deliverables, and package tiers
  - Evidence: ____________________  Done date: __________  Done by: __________
- [ ] BH-032.02 — Publish sponsor landing page + downloadable media kit with tracked inquiry CTA
  - Evidence: ____________________  Done date: __________  Done by: __________
- [ ] BH-032.03 — Execute sponsor outreach cadence and log inquiry-to-close performance each month
  - Evidence: ____________________  Done date: __________  Done by: __________

#### BH-033 — Create B2B licensing offer for clubs/church/groups
- [ ] BH-033.01 — Define B2B licensing offer structure, onboarding flow, and commercial terms for groups/churches/clubs
  - Evidence: ____________________  Done date: __________  Done by: __________
- [ ] BH-033.02 — Implement b2b offer page plus org-account schema prerequisites for pilot deals
  - Evidence: ____________________  Done date: __________  Done by: __________
- [ ] BH-033.03 — Close first three pilot org opportunities and document repeatable onboarding playbook
  - Evidence: ____________________  Done date: __________  Done by: __________

#### BH-034 — Run marketing tracking wall + weekly accountability meeting ritual
- [ ] BH-034.01 — Build marketing tracking wall template tied directly to weekly scorecard KPIs
  - Evidence: ____________________  Done date: __________  Done by: __________
- [ ] BH-034.02 — Run weekly accountability meeting ritual with action-item ownership and deadlines
  - Evidence: ____________________  Done date: __________  Done by: __________
- [ ] BH-034.03 — Maintain 12-week meeting streak evidence and <24h corrective-action turnaround logs
  - Evidence: ____________________  Done date: __________  Done by: __________

#### BH-035 — Implement finance controls, reconciliation, and anti-fraud guardrails
- [ ] BH-035.01 — Define finance control matrix for approvals, reconciliation, refunds/chargebacks, and fraud checks
  - Evidence: ____________________  Done date: __________  Done by: __________
- [ ] BH-035.02 — Implement finance audit-log schema/policies and dual-approval checkpoints in backend flows
  - Evidence: ____________________  Done date: __________  Done by: __________
- [ ] BH-035.03 — Build monthly close checklist with discrepancy investigation and escalation steps
  - Evidence: ____________________  Done date: __________  Done by: __________
- [ ] BH-035.04 — Complete two monthly close cycles with zero unexplained payment discrepancies above $10
  - Evidence: ____________________  Done date: __________  Done by: __________

#### BH-036 — Create delegation SOP library so owner can run system, not tasks
- [ ] BH-036.01 — Identify recurring growth/ops tasks to delegate with primary/backup owner assignments
  - Evidence: ____________________  Done date: __________  Done by: __________
- [ ] BH-036.02 — Document SOP library for traffic, lead capture, sales, fulfillment, and support execution
  - Evidence: ____________________  Done date: __________  Done by: __________
- [ ] BH-036.03 — Validate >=80% owner-hands-off execution and revise SOPs from observed handoff gaps
  - Evidence: ____________________  Done date: __________  Done by: __________

---

## Weekly operating cadence (scorecard + review rhythm)

**Monday (Planning + Assignment, 45 min)**
- Pull previous week scorecard.
- Select weekly sprint lines from current phase only.
- Confirm owners, dependencies, and “by-when” for each in-progress task.

**Tuesday–Thursday (Execution + Daily control loop, 15 min/day)**
- Review active blockers, update status/evidence fields in backlog.
- Enforce WIP limits by owner lane.
- Push unblock decisions within 24h when work stalls.

**Wednesday (Midweek Unblock Review, 30 min)**
- Blocked-only review.
- Escalate dependency or scope decisions immediately.
- Reassign tasks if ownership bandwidth is broken.

**Friday (Scorecard + Review Rhythm, 45 min)**
- Calculate completion metrics (overall %, by-phase %, top-10 %).
- Review leads, conversion, revenue, CAC, AOV, gross margin, and MRR (if active).
- Log keep/kill/adjust decisions for next week.

**Month-end (Finance + Risk, 60 min)**
- Reconcile cash collection, refunds, and partner payouts.
- Review risk register and mitigation status.
- Confirm pricing and unit-economics assumptions still hold.

---

## Completion Protocol (preserved)

1. **Single source of truth:** This markdown + `docs/business/profitability-execution-backlog-start-here.csv`.
2. **WIP limit:** Max **2 In Progress tasks per owner lane**. Start less, finish more.
3. **Top-10 lock:** Only start non-top10 tasks after Top-10 % complete >= 80%.
4. **Definition of “Done” is strict:**
   - Code/docs merged to main
   - KPI target measured at least once
   - Verification evidence link filled in
   - Done date + done by filled
5. **Blocked handling:** if blocked >48h, create unblock note + owner decision within next daily review.
6. **Weekly cadence:**
   - Monday: choose weekly sprint lines from current phase
   - Wednesday: unblock-only review
   - Friday: KPI + completion audit, update scorecard
7. **No silent carryover:** unfinished items stay explicit with reason in evidence field.
8. **Phase gate rule:** next phase cannot start until current phase gate is explicitly marked 100%.

---

## Phase gates (preserved logic, atomic criteria)

### Phase 0 Gate (0-14d) = 100% when ALL are true
- All Phase 0 atomic tasks (`BH-001.*` … `BH-012.*`) are `Done`.
- Top-10 % complete = **100%** (all atomic tasks under `BH-001`…`BH-010` done).
- Event pipeline captures >=95% of intended events for 7 consecutive days.
- At least 2 weekly scorecards generated from real data.

### Phase 1 Gate (15-45d) = 100% when ALL are true
- All Phase 1 atomic tasks (`BH-013.*` … `BH-022.*`) are `Done`.
- At least one paid offer is live and has completed real purchase + fulfillment.
- 90-day calendar is active and first 4 weeks executed on schedule.
- SEO/content checklist enforcement is live for new articles.

### Phase 2 Gate (46-90d) = 100% when ALL are true
- All Phase 2 atomic tasks (`BH-023.*` … `BH-030.*`) are `Done`.
- Subscription/billing flow works end-to-end in production.
- NPS + winback loops are active with documented weekly outputs.
- Pricing experiment log contains at least 2 completed cycles.

### Phase 3 Gate (90+d) = 100% when ALL are true
- All Phase 3 atomic tasks (`BH-031.*` … `BH-036.*`) are `Done`.
- 12 consecutive weekly accountability meetings completed (`BH-034`).
- Monthly financial close and affiliate/sponsor reporting run without misses.
- Owner hands-off execution >=80% of recurring growth ops tasks.

---

## Weekly scorecard definitions (preserved formulas, updated denominators)

Use these exact formulas each week:

```text
Overall % Complete = (Count of tasks with Status=Done / 126) * 100

By-Phase % Complete (Phase X) = (Done in Phase X / Total tasks in Phase X) * 100
  - Phase 0 total: 48
  - Phase 1 total: 33
  - Phase 2 total: 26
  - Phase 3 total: 19

Top-10 % Complete = (Count of Done tasks where parent_id in BH-001..BH-010 / 40) * 100
```

Recommended companion profitability metrics in same scorecard: Leads/week, Lead→Buyer %, Revenue/week, Gross Margin %, CAC, AOV, MRR (when active).

---

## Validation checkpoint

- CSV columns include required fields: `phase`, `task_id`, `parent_id`, `critical_path_rank`, `title`, `profit_lever`, `repo_area_or_files`, `owner_lane`, `effort`, `dependencies`, `kpi_target`, `definition_of_done`, `status`, `verification_evidence`, `done_date`, `done_by`.
- Atomic checklist count aligns with CSV row count (126).
- Top-10 intent/order preserved exactly as original BH-001..BH-010 sequence.
