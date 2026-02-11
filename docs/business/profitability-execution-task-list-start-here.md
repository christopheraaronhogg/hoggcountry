# HoggCountry Profitability Execution Task List (Start Here System)

**Date:** 2026-02-11  
**Owner:** CodeHogg / HoggCountry  
**Operating Rule:** This is a **100% completion system**. No skipped tasks. No silent carryover. Every line needs evidence.

---

## Why this exists (repo-grounded reality, not generic advice)

Current repo signals show strong product depth but weak monetization plumbing:

- `src/components/BudgetGearBuilder.svelte` has direct “Buy” links and a beta warning, but no unified attribution/reporting path.
- `src/components/DownloadModal.svelte` gives away PDF/Markdown downloads without lead capture.
- `netlify/functions/ask.ts` incurs variable API cost (`OPENAI_API_KEY`) but currently has no profitability guardrail metric tied to revenue.
- `src/layouts/BaseLayout.astro` has no analytics/retargeting instrumentation by default.
- `backend/database/migrations/` includes auth/sync/tracker/video tables but no plans/subscriptions/invoices tables yet.
- `src/pages/videohogg.astro` is still private allowlist beta, not a monetized onboarding funnel.
- Audit evidence already in repo confirms this gap (`audit-reports/20260107-163324/13-observability-assessment.md`: no analytics; `.../18-seo-assessment.md`: structured data + SEO gaps).

So this plan starts with prerequisites (measurement + lead capture + offer rails) before scaling tactics.

---

## Start Here principle mapping used in this plan

| Start Here chapter | How it is applied in HoggCountry execution |
|---|---|
| Section 5.3 “Building One Checklist at a Time” | Entire system is converted into checklist IDs with DoD/evidence fields. |
| Section 11.4 “Quarterly Execution Plans” | Backlog is phased into 0-14d, 15-45d, 46-90d, 90+d with hard gates. |
| Section 11.6 “Rolling Daily Actionable Items” | Weekly scorecard + daily/weekly completion protocol. |
| Section 18.1 “Marketing Calendar for 90 Days” | BH-020 creates and enforces a 90-day marketing calendar. |
| Section 18.3 “Marketing Tracking Wall” | BH-004 + BH-034 create measurable KPI wall and accountability ritual. |
| Section 19.1 “Retargeting Pixel” | BH-019 adds retargeting audiences and conversion events. |
| Section 19.3 “Referral System” | BH-018 implements referral codes/credits/reporting. |
| Section 19.6 “Checklist-Driven Cross-Sell/Upsell” | BH-017 and BH-028 add deterministic upsell flow. |
| Section 26.2 / 26.3 “Pricing Model” | BH-014 and BH-030 create price matrix + experiments. |
| Section 37.3 “Uploading Articles Checklist” | BH-022 operationalizes content publishing checklist for SEO growth. |

---

## Top 10 tasks (exact order; do not reorder)

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

## Master backlog table (36 tasks)

**Status legend:** Not Started / In Progress / Blocked / Done

| Phase | ID | Top10 | Title | Profit lever | Repo area/files touched | Owner lane | Effort | Dependencies | KPI target | DoD | Status | Verification evidence | Done date | Done by |
|---|---|---:|---|---|---|---|---|---|---|---|---|---|---|---|
| 0-14d | BH-001 | 1 | Lock profitability event taxonomy + KPI dictionary | Measurement foundation (faster decisions) | docs/business/profitability-event-taxonomy-start-here.md (new); docs/business/profitability-execution-task-list-start-here.md | Product/Ops | S (0.5-1d) | — | >=25 named events mapped to funnel stages and owners | Event dictionary committed; each event has owner, trigger, payload, KPI mapping | Not Started |  |  |  |
| 0-14d | BH-002 | 2 | Instrument client-side funnel events across high-traffic surfaces | Conversion visibility | src/layouts/BaseLayout.astro; src/components/BudgetGearBuilder.svelte; src/components/DownloadModal.svelte; src/components/TrailChat.svelte; src/pages/videos/index.astro; src/components/prototypes/ProtoF_Ranger.svelte | Frontend | M (2-3d) | BH-001 | >=90% of priority CTA clicks emit trackable events | Manual QA proves event fire for guide download, outbound gear click, video CTA, login, and chat usage | Not Started |  |  |  |
| 0-14d | BH-003 | 3 | Create backend event ingestion API + analytics_events table | Reliable KPI data | backend/database/migrations/*create_analytics_events_table.php (new); backend/app/Http/Controllers/Api/V1/AnalyticsEventController.php (new); backend/routes/api.php | Backend | M (2-3d) | BH-001 | 100% valid events persisted with <2s write latency | POST /api/v1/analytics/events accepts batched payloads; request validation + auth/rate-limit + tests pass | Not Started |  |  |  |
| 0-14d | BH-004 | 4 | Ship weekly profitability scorecard generation (execution KPIs + money KPIs) | Execution cadence | backend/app/Console/Commands/BuildProfitabilityScorecard.php (new); scripts/profitability-scorecard.mjs (new); docs/business/scorecards/ (new) | Ops/Finance | M (2-3d) | BH-002; BH-003 | Automated weekly scorecard generated every Monday by 8am | Scorecard includes overall % complete, by-phase %, top-10 %, leads, conversion, revenue, gross margin | Not Started |  |  |  |
| 0-14d | BH-005 | 5 | Replace direct outbound gear links with tracked redirect flow | Affiliate / partner attribution | backend/app/Http/Controllers/Api/V1/OutboundLinkController.php (new); backend/routes/api.php; src/components/BudgetGearBuilder.svelte; src/lib/outboundLinks.ts (new) | Backend + Frontend | M (2-3d) | BH-003 | >=95% product-link clicks recorded with source + item_id | All “Buy” buttons route through redirect endpoint; click records stored with campaign metadata | Not Started |  |  |  |
| 0-14d | BH-006 | 6 | Normalize gear link catalog + affiliate parameter map | Revenue per click | src/data/gearRecommendations.json; src/data/affiliateMap.json (new); scripts/normalize-gear-links.mjs (new) | Growth/Content | S-M (1-2d) | BH-005 | 100% monetizable links tagged OR explicitly marked non-affiliate | Link linter returns zero untagged monetizable links; doc of partner terms committed | Not Started |  |  |  |
| 0-14d | BH-007 | 7 | Add lead capture gate before Field Guide download | Lead volume | src/components/DownloadModal.svelte; src/components/DownloadGuideButton.svelte; src/pages/guide/index.astro; backend/routes/api.php | Frontend | M (2d) | BH-002; BH-003 | Guide lead capture rate >=8% of unique /guide visitors | Email capture completes before PDF/MD download and emits lead_created event | Not Started |  |  |  |
| 0-14d | BH-008 | 8 | Integrate email service + 5-message welcome sequence | Lead nurturing | backend/config/services.php; backend/app/Http/Controllers/Api/V1/LeadCaptureController.php (new); backend/app/Jobs/SendLeadWelcomeSequence.php (new); docs/business/email-sequences/start-here-welcome.md (new) | Backend/Growth | M-L (3-4d) | BH-007 | >=95% of new leads receive email #1 within 5 minutes | Lead creates contact + sequence trigger; bounce/error logging in place | Not Started |  |  |  |
| 0-14d | BH-009 | 9 | Insert monetization CTAs in homepage, videos, and tools hub | CTR to offer pages | src/components/prototypes/ProtoF_Ranger.svelte; src/pages/videos/index.astro; src/components/tools/ToolsDashboard.svelte; src/components/Header.astro | Frontend/Growth | M (2d) | BH-007; BH-008 | Sitewide offer CTA CTR >=3% in first 14 days | At least 3 contextual CTAs live (Lead magnet, Trail Kit, VideoHogg pilot), all tracked | Not Started |  |  |  |
| 0-14d | BH-010 | 10 | Launch Start Here-aligned offers landing page | Offer clarity and conversion | src/pages/start-here-offers.astro (new); src/components/BaseHead.astro; public/og-offers.png (new) | Product/Content | S-M (1-2d) | BH-009 | Landing page lead-to-interest click rate >=5% | Page includes offer stack, proof, CTA hierarchy, tracking params, and SEO metadata | Not Started |  |  |  |
| 0-14d | BH-011 | — | Document unit economics baseline (chat + VideoHogg + infra) | Margin control | netlify/functions/ask.ts; backend/app/Models/VideoHoggRun.php; docs/business/unit-economics-baseline.md (new) | Finance/Ops | S (1d) | BH-003 | Cost per 100 asks and cost per VideoHogg run calculated weekly | Baseline spreadsheet with assumptions + source query links committed | Not Started |  |  |  |
| 0-14d | BH-012 | — | Implement AI usage guardrails to cap variable cost | Cost containment | netlify/functions/ask.ts; src/components/TrailChat.svelte; backend/routes/api.php | Backend/Ops | M (2d) | BH-011 | Reduce ask API cost per active user by >=30% | Quota, caching, and fallback behavior enforced; over-limit requests handled gracefully | Not Started |  |  |  |
| 15-45d | BH-013 | — | Finalize checkout provider and run first successful test transaction | Payment conversion | backend/config/services.php; backend/.env.example; docs/business/checkout-decision-record.md (new) | Product/Backend | S-M (1-2d) | BH-010 | 1 end-to-end test payment succeeds in staging and production test mode | Provider selected, credentials configured, sandbox payment walkthrough recorded | Not Started |  |  |  |
| 15-45d | BH-014 | — | Create product catalog and pricing matrix (quick-pay buyers first) | Average order value + gross margin | src/data/products.json (new); docs/business/pricing-matrix-start-here.md (new) | Product/Finance | M (2d) | BH-011; BH-013 | >=3 paid offers with projected gross margin >=70% | SKU list approved (price, COGS, fulfillment owner, target buyer segment) | Not Started |  |  |  |
| 15-45d | BH-015 | — | Build orders + payment webhook + fulfillment state machine | Cash collection reliability | backend/database/migrations/*create_orders_table.php (new); backend/app/Models/Order.php (new); backend/app/Http/Controllers/Api/V1/CheckoutWebhookController.php (new); backend/routes/api.php | Backend | L (4-5d) | BH-013; BH-014 | 100% successful payments create order + fulfillment event | Webhook verification, idempotency, retries, and failure alerts implemented | Not Started |  |  |  |
| 15-45d | BH-016 | — | Launch paid “Trail Launch Kit” digital offer from existing guide/tool assets | New revenue stream | src/pages/trail-launch-kit.astro (new); docs/business/products/trail-launch-kit.md (new); public/downloads/trail-launch-kit/* (new) | Content/Product | L (4d) | BH-014; BH-015 | 20 paid sales within 30 days of launch | Offer page live, checkout linked, delivery assets shipped automatically | Not Started |  |  |  |
| 15-45d | BH-017 | — | Implement checklist-driven cross-sell / upsell prompts in tools | AOV lift | src/components/PackBuilder.svelte; src/components/BudgetCalculator.svelte; src/components/BudgetGearBuilder.svelte; src/components/tools/ToolsDashboard.svelte | Frontend/Growth | M (3d) | BH-016 | Attach rate >=20% for one add-on offer | Upsell surfaces appear at defined trigger points with event tracking and suppression rules | Not Started |  |  |  |
| 15-45d | BH-018 | — | Create intentional referral system (codes, credits, reporting) | Lower CAC | backend/database/migrations/*create_referrals_table.php (new); backend/app/Models/Referral.php (new); backend/app/Http/Controllers/Api/V1/ReferralController.php (new); src/pages/referrals.astro (new) | Backend/Growth | L (4d) | BH-015 | >=15% of paid buyers from referral channel by day 45 | Unique referral codes generated, redemption tracked, payout/credit logic documented | Not Started |  |  |  |
| 15-45d | BH-019 | — | Enable retargeting pixels and conversion event map | Retargeting conversion | src/layouts/BaseLayout.astro; netlify.toml; docs/business/retargeting-events-map.md (new) | Growth/Frontend | M (2d) | BH-002; BH-010 | Retargeting audience >=500 users in 30 days | ViewContent, Lead, InitiateCheckout, Purchase events validated in ad manager diagnostics | Not Started |  |  |  |
| 15-45d | BH-020 | — | Build and execute 90-day marketing calendar | Consistent lead flow | docs/business/marketing-calendar-90-day.md (new); docs/business/content-ops-checklists.md (new) | Growth/Owner | M (2d setup + weekly execution) | BH-010 | >=5 publish/promote actions per week for 4 consecutive weeks | Calendar has daily actions, owner, and proof links; first 4 weeks fully executed | Not Started |  |  |  |
| 15-45d | BH-021 | — | Implement SEO critical fixes from existing audit backlog | Organic traffic growth | src/components/BaseHead.astro; src/layouts/BaseLayout.astro; src/layouts/BlogPost.astro; src/components/Footer.astro; src/pages/blog/index.astro | Frontend/SEO | M-L (3-4d) | BH-020 | +30% non-brand organic clicks within 60 days | JSON-LD, alt-text coverage, nav/footer internal links, and page-specific metadata all shipped | Not Started |  |  |  |
| 15-45d | BH-022 | — | Operationalize article publishing checklist for SEO content | Compounding inbound demand | docs/business/seo-uploading-checklist-start-here.md (new); scripts/content-seo-lint.mjs (new); docs/business/content/published-log.csv (new) | Content/Ops | M (2-3d) | BH-021 | 100% of published posts pass checklist; 12 high-intent posts shipped in 30d | Checklist attached to each content PR; fail-fast lint blocks non-compliant posts | Not Started |  |  |  |
| 46-90d | BH-023 | — | Define premium live-map offer (paid layer/features) and validate demand | Recurring revenue design | docs/business/premium-live-map-prd.md (new); src/components/AtMap.svelte; src/components/trail/TrailShell.svelte | Product | M (2-3d) | BH-014 | 100 waitlist signups OR 10 paid preorders | PRD includes feature bundle, pricing hypothesis, and success metrics | Not Started |  |  |  |
| 46-90d | BH-024 | — | Add plans/subscriptions/invoices schema and APIs | MRR enablement | backend/database/migrations/*create_plans_table.php (new); *create_subscriptions_table.php (new); *create_invoices_table.php (new); backend/routes/api.php | Backend | L (4-5d) | BH-013; BH-023 | Create/cancel subscription in test mode with accurate invoice records | Schema migrated; CRUD endpoints and tests for lifecycle events pass | Not Started |  |  |  |
| 46-90d | BH-025 | — | Build billing UI + premium access enforcement | Paid access integrity | src/pages/account/billing.astro (new); src/pages/login.astro; src/components/trail/TrailShell.svelte; backend/routes/api.php | Frontend + Backend | L (4d) | BH-024 | 0 unauthorized premium access in QA; billing self-serve success >=95% | Users can view/manage plan; feature flags enforced by subscription state | Not Started |  |  |  |
| 46-90d | BH-026 | — | Commercialize VideoHogg from family beta to paid pilot | Service revenue | src/pages/videohogg.astro; backend/app/Http/Controllers/Api/V1/VideoHoggController.php; docs/business/videohogg-pilot-offer.md (new) | Product/Backend | L (4-5d) | BH-015; BH-014 | 5 paid pilot clients OR 15 qualified applications | Pilot onboarding flow includes payment/invite gate and fulfillment SLA | Not Started |  |  |  |
| 46-90d | BH-027 | — | Launch NPS + customer wow loop post-purchase | Retention / LTV | backend/routes/api.php; src/pages/checkout/success.astro (new); docs/business/nps-loop.md (new) | Growth/Ops | M (2-3d) | BH-016; BH-015 | NPS >=40 and refund rate <5% by day 90 | Survey sent after fulfillment; detractor follow-up workflow documented and running | Not Started |  |  |  |
| 46-90d | BH-028 | — | Build bundle engine for post-purchase cross-sell | AOV and LTV | src/data/products.json; backend/app/Services/OfferEngine.php (new); src/pages/checkout/success.astro (new) | Product/Backend | M (3d) | BH-017; BH-015 | Post-purchase attach rate >=20% | Rules-based offer recommendations live with conversion tracking | Not Started |  |  |  |
| 46-90d | BH-029 | — | Automate lead/customer winback sequences | Reactivation revenue | backend/app/Jobs/RunWinbackSequence.php (new); docs/business/email-sequences/winback.md (new); docs/business/scorecards/ | Growth/Backend | M (2-3d) | BH-008; BH-027 | Re-activate >=10% dormant leads/customers in 45 days | Automated segmentation + trigger rules in place with weekly reactivation reporting | Not Started |  |  |  |
| 46-90d | BH-030 | — | Run quarterly pricing experiments and document outcomes | Gross profit optimization | docs/business/pricing-experiments-log.md (new); docs/business/unit-economics-baseline.md | Finance/Product | M (ongoing) | BH-014; BH-027 | Gross profit/order +12% with conversion drop <=10% | At least 2 completed experiments with pre/post metrics and keep/kill decision | Not Started |  |  |  |
| 90+d | BH-031 | — | Finalize affiliate compliance + monthly revenue reporting | Compliance-safe partner revenue | src/pages/disclosures.astro (new); src/components/BudgetGearBuilder.svelte; docs/business/affiliate-disclosure-policy.md (new); docs/business/scorecards/ | Growth/Ops | M (2d) | BH-006; BH-005 | 100% affiliate surfaces show disclosure; monthly affiliate report published | Disclosure policy live; audit finds zero non-compliant affiliate links | Not Started |  |  |  |
| 90+d | BH-032 | — | Publish sponsor/media kit and package page | Sponsorship revenue | src/pages/sponsor.astro (new); public/media-kit.pdf (new); src/components/prototypes/ProtoF_Ranger.svelte | Content/Sales | M (2-3d) | BH-020; BH-021 | 10 sponsor inquiries/quarter and 2 signed deals | Media kit + pricing + contact flow live and tracked | Not Started |  |  |  |
| 90+d | BH-033 | — | Create B2B licensing offer for clubs/church/groups | High-ticket revenue | src/pages/b2b.astro (new); docs/business/b2b-offer.md (new); backend/database/migrations/*org_accounts_table.php (new) | Product/Sales | L (4d) | BH-015; BH-016 | 3 pilot org customers in first quarter | Offer, contract terms, pricing, and invoicing flow available for pilot buyers | Not Started |  |  |  |
| 90+d | BH-034 | — | Run marketing tracking wall + weekly accountability meeting ritual | Execution reliability | docs/business/marketing-tracking-wall.md (new); docs/business/scorecards/weekly-*.md | Owner/Ops | M (ongoing) | BH-004; BH-020; BH-030 | 12 consecutive weekly accountability sessions completed | Meeting cadence fixed, metrics reviewed weekly, corrective actions logged within 24h | Not Started |  |  |  |
| 90+d | BH-035 | — | Implement finance controls, reconciliation, and anti-fraud guardrails | Leak prevention | docs/business/finance-guardrails.md (new); backend/database/migrations/*finance_audit_logs_table.php (new); backend/app/Policies/* | Finance/Backend | L (4d) | BH-015 | 0 unexplained payment discrepancies >$10; monthly close by day 5 | Dual-approval rules, refund audit trail, and monthly reconciliation checklist operational | Not Started |  |  |  |
| 90+d | BH-036 | — | Create delegation SOP library so owner can run system, not tasks | Scalability + owner capacity | docs/business/sops/ (new); docs/business/completion-protocol.md (new); docs/business/marketing-calendar-90-day.md | Owner/Operations | L (4-6d) | BH-034 | >=80% of recurring weekly tasks executed without owner intervention | SOPs for traffic, lead capture, sales, fulfillment, and support are documented + assigned backups | Not Started |  |  |  |

---

## Completion Protocol (how to actually hit 100%)

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

## Phase gates (explicit 100% criteria)

### Phase 0 Gate (0-14d) = 100% when ALL are true
- All Phase 0 tasks (`BH-001`…`BH-012`) are `Done`.
- Top-10 % complete = **100%** (all `BH-001`…`BH-010` done).
- Event pipeline captures >=95% of intended events for 7 consecutive days.
- At least 2 weekly scorecards generated from real data.

### Phase 1 Gate (15-45d) = 100% when ALL are true
- All Phase 1 tasks (`BH-013`…`BH-022`) are `Done`.
- At least one paid offer is live and has completed real purchase + fulfillment.
- 90-day calendar is active and first 4 weeks executed on schedule.
- SEO/content checklist enforcement is live for new articles.

### Phase 2 Gate (46-90d) = 100% when ALL are true
- All Phase 2 tasks (`BH-023`…`BH-030`) are `Done`.
- Subscription/billing flow works end-to-end in production.
- NPS + winback loops are active with documented weekly outputs.
- Pricing experiment log contains at least 2 completed cycles.

### Phase 3 Gate (90+d) = 100% when ALL are true
- All Phase 3 tasks (`BH-031`…`BH-036`) are `Done`.
- 12 consecutive weekly accountability meetings completed (`BH-034`).
- Monthly financial close and affiliate/sponsor reporting run without misses.
- Owner hands-off execution >=80% of recurring growth ops tasks.

---

## Weekly scorecard definitions (required metrics)

Use these exact formulas each week:

```text
Overall % Complete = (Count of tasks with Status=Done / 36) * 100

By-Phase % Complete (Phase X) = (Done in Phase X / Total tasks in Phase X) * 100
  - Phase 0 total: 12
  - Phase 1 total: 10
  - Phase 2 total: 8
  - Phase 3 total: 6

Top-10 % Complete = (Count of Done tasks among BH-001..BH-010 / 10) * 100
```

Recommended companion profitability metrics in same scorecard: Leads/week, Lead→Buyer %, Revenue/week, Gross Margin %, CAC, AOV, MRR (when active).

---

## Printable master checklist (checkbox view)

### Phase 0-14d
- [ ] BH-001 — Lock profitability event taxonomy + KPI dictionary
  - Evidence: ____________________  Done date: __________  Done by: __________
- [ ] BH-002 — Instrument client-side funnel events across high-traffic surfaces
  - Evidence: ____________________  Done date: __________  Done by: __________
- [ ] BH-003 — Create backend event ingestion API + analytics_events table
  - Evidence: ____________________  Done date: __________  Done by: __________
- [ ] BH-004 — Ship weekly profitability scorecard generation (execution KPIs + money KPIs)
  - Evidence: ____________________  Done date: __________  Done by: __________
- [ ] BH-005 — Replace direct outbound gear links with tracked redirect flow
  - Evidence: ____________________  Done date: __________  Done by: __________
- [ ] BH-006 — Normalize gear link catalog + affiliate parameter map
  - Evidence: ____________________  Done date: __________  Done by: __________
- [ ] BH-007 — Add lead capture gate before Field Guide download
  - Evidence: ____________________  Done date: __________  Done by: __________
- [ ] BH-008 — Integrate email service + 5-message welcome sequence
  - Evidence: ____________________  Done date: __________  Done by: __________
- [ ] BH-009 — Insert monetization CTAs in homepage, videos, and tools hub
  - Evidence: ____________________  Done date: __________  Done by: __________
- [ ] BH-010 — Launch Start Here-aligned offers landing page
  - Evidence: ____________________  Done date: __________  Done by: __________
- [ ] BH-011 — Document unit economics baseline (chat + VideoHogg + infra)
  - Evidence: ____________________  Done date: __________  Done by: __________
- [ ] BH-012 — Implement AI usage guardrails to cap variable cost
  - Evidence: ____________________  Done date: __________  Done by: __________

### Phase 15-45d
- [ ] BH-013 — Finalize checkout provider and run first successful test transaction
  - Evidence: ____________________  Done date: __________  Done by: __________
- [ ] BH-014 — Create product catalog and pricing matrix (quick-pay buyers first)
  - Evidence: ____________________  Done date: __________  Done by: __________
- [ ] BH-015 — Build orders + payment webhook + fulfillment state machine
  - Evidence: ____________________  Done date: __________  Done by: __________
- [ ] BH-016 — Launch paid “Trail Launch Kit” digital offer from existing guide/tool assets
  - Evidence: ____________________  Done date: __________  Done by: __________
- [ ] BH-017 — Implement checklist-driven cross-sell / upsell prompts in tools
  - Evidence: ____________________  Done date: __________  Done by: __________
- [ ] BH-018 — Create intentional referral system (codes, credits, reporting)
  - Evidence: ____________________  Done date: __________  Done by: __________
- [ ] BH-019 — Enable retargeting pixels and conversion event map
  - Evidence: ____________________  Done date: __________  Done by: __________
- [ ] BH-020 — Build and execute 90-day marketing calendar
  - Evidence: ____________________  Done date: __________  Done by: __________
- [ ] BH-021 — Implement SEO critical fixes from existing audit backlog
  - Evidence: ____________________  Done date: __________  Done by: __________
- [ ] BH-022 — Operationalize article publishing checklist for SEO content
  - Evidence: ____________________  Done date: __________  Done by: __________

### Phase 46-90d
- [ ] BH-023 — Define premium live-map offer (paid layer/features) and validate demand
  - Evidence: ____________________  Done date: __________  Done by: __________
- [ ] BH-024 — Add plans/subscriptions/invoices schema and APIs
  - Evidence: ____________________  Done date: __________  Done by: __________
- [ ] BH-025 — Build billing UI + premium access enforcement
  - Evidence: ____________________  Done date: __________  Done by: __________
- [ ] BH-026 — Commercialize VideoHogg from family beta to paid pilot
  - Evidence: ____________________  Done date: __________  Done by: __________
- [ ] BH-027 — Launch NPS + customer wow loop post-purchase
  - Evidence: ____________________  Done date: __________  Done by: __________
- [ ] BH-028 — Build bundle engine for post-purchase cross-sell
  - Evidence: ____________________  Done date: __________  Done by: __________
- [ ] BH-029 — Automate lead/customer winback sequences
  - Evidence: ____________________  Done date: __________  Done by: __________
- [ ] BH-030 — Run quarterly pricing experiments and document outcomes
  - Evidence: ____________________  Done date: __________  Done by: __________

### Phase 90+d
- [ ] BH-031 — Finalize affiliate compliance + monthly revenue reporting
  - Evidence: ____________________  Done date: __________  Done by: __________
- [ ] BH-032 — Publish sponsor/media kit and package page
  - Evidence: ____________________  Done date: __________  Done by: __________
- [ ] BH-033 — Create B2B licensing offer for clubs/church/groups
  - Evidence: ____________________  Done date: __________  Done by: __________
- [ ] BH-034 — Run marketing tracking wall + weekly accountability meeting ritual
  - Evidence: ____________________  Done date: __________  Done by: __________
- [ ] BH-035 — Implement finance controls, reconciliation, and anti-fraud guardrails
  - Evidence: ____________________  Done date: __________  Done by: __________
- [ ] BH-036 — Create delegation SOP library so owner can run system, not tasks
  - Evidence: ____________________  Done date: __________  Done by: __________

---

## Do-not-do-yet (anti-priorities)

- Do **not** rewrite Astro/Svelte architecture before funnel + payment basics are live.
- Do **not** launch mobile app versions before web conversion engine is proven.
- Do **not** add physical merch fulfillment before digital offers have consistent conversion data.
- Do **not** open VideoHogg wide public beta before paid pilot + SLA + margin math are stable.
- Do **not** scale paid ads before BH-001..BH-010 are complete and tracked.
- Do **not** add extra channels (podcast/news app/Discord bot products) until current channels hit scorecard targets.
- Do **not** run discount-heavy pricing wars before BH-030 pricing experiments are complete.
- Do **not** run affiliate links without visible disclosures and monthly reconciliation.

---

## Risk register (with mitigations)

| Risk | Likelihood | Impact | Early signal | Mitigation | Owner lane |
|---|---|---|---|---|---|
| Tracking data is incomplete/inaccurate | Medium | High | Dashboard mismatches with logs | BH-001/BH-002/BH-003 validation tests + weekly QA sample | Ops + Frontend + Backend |
| Lead capture hurts UX and drops trust | Medium | Medium | Bounce rate spikes on /guide | Offer “why email” copy + friction test + cap required fields to email only | Product/Content |
| API costs rise faster than revenue | High | High | Cost per lead or cost per chat rises week-over-week | BH-011/BH-012 guardrails, quota rules, weekly unit economics review | Finance/Ops |
| Checkout/webhook failures lose orders | Medium | High | Paid user reports no delivery | Idempotent webhook handling + retry queue + alerting in BH-015 | Backend |
| Content cadence breaks after initial push | Medium | Medium | Missed weekly publish commitments | BH-020 calendar + BH-034 accountability wall | Growth/Owner |
| Compliance issues (affiliate disclosures/privacy pixels) | Medium | High | Partner warning or user complaints | BH-031 disclosure policy + CSP/privacy review before rollout | Growth/Ops |
| Scope creep dilutes execution | High | High | >2 blocked tasks and low completion velocity | Enforce WIP limits, anti-priorities, and phase gates | Owner/Ops |
| Premium feature adoption is weak | Medium | Medium | Low preorder/waitlist conversion | Demand validation in BH-023 before full build | Product |
| Fraud/refund leakage erodes margin | Low-Med | High | Chargeback/refund anomalies | BH-035 controls + monthly reconciliation checklist | Finance/Backend |

---

## Fast start this week (minimum action set)

1. Complete BH-001 and BH-002 first (instrumentation contract + events).
2. Ship BH-003/BH-004 same week to avoid “data but no dashboard” trap.
3. Then execute BH-007/BH-008/BH-009 to turn existing traffic into leads.
4. Lock BH-010 before ad/retargeting spend.

This follows Start Here’s sequence: systems first, guardrails second, sales machine third.
