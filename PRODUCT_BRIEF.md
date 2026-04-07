# Hogg Country — v1 Product Brief

**Status:** Locked 2026-04-07. Changes require explicit reopening.

## Positioning

The free, offline-first AT operating manual that tells first-time thru-hikers what to do today, at this mile, with their setup.

> FarOut tells you what exists. Hogg Country tells you what to do.

The product is a **judgment layer** on top of audited trail facts. Not another database, not another blog, not another toolbox.

## v1 Persona

First-time NOBO thru-hiker, from the "I'm thinking about it" stage through the Virginia blues. Overwhelmed by data, rationing phone battery, often without signal. Needs calm, decisive answers — not more information to sort through.

## Three Surfaces

- **Today** — What to wear, water to carry, shelter vs. tent, storm/stream caution, next-town priority. The flagship.
- **Plan** — Journey (pace/timeline), Town Stop (resupply/food/mail/budget), Transitions (gear swaps/training/replacement).
- **Field Manual** — Search-first atomic guidance. A hiker searches "frozen filter" and gets a 3-line answer first, chapter context second.

Plus `/lab` — a developer-facing index of flagged-off work. Not part of the public product.

## Kill Criterion

If a feature does not help a hiker (a) decide what to do now, (b) plan what to do next, or (c) find the right guidance fast — **it does not ship in v1.**

## Measurable Success Criteria

1. Every Today recommendation traces to a fact in `src/data/trail-facts.yaml` with a visible citation.
2. Field Manual search returns a decisive answer in under 1 second on throttled 3G.
3. Entire app functions in airplane mode after first load (PWA).
4. Public navigation exposes exactly 3 surfaces. No other routes appear in production nav.
5. Lighthouse mobile performance ≥ 95.
6. At least one real 2027 NOBO planner walks through core flows without getting stuck.

## Non-Goals (v1)

- **Not another FarOut.** No GPS navigation, no waypoint database.
- **Not a blog/journal/social platform.**
- **Not SOBO- or section-hiker-optimized.** Future consideration.
- **Not a permit transaction layer.** Links out to ATC/NPS only.
- **Not a faith-specific product.** v1 is a neutral utility. Faith-specific content may return post-v1 as a distinct opt-in surface if deliberately chosen.
- **Not TrailHogg.** The game stays flagged off and excluded from the main build.

## Locked Decisions

- **Stack:** Astro 5 + Svelte islands + Tailwind + TypeScript. No changes.
- **Brand:** Hogg Country. No rename in v1.
- **Substrate:** `src/data/trail-facts.yaml` and the `audit-trail-facts` skill are the source of truth. Recommendations surface the audit trail visibly.
- **Demoted (flagged off):** trips, videos, blog, the current multi-tool dashboard, TrailHogg, `/ask`, `/kjv`, `/cat`, `/compare`, `/generate`, `/prototypes`, and every utility not clearly part of Today, Plan, or Field Manual.

## Seed Content Priorities

Drawn from ATC's 2025 long-distance hiker survey, which identified the skills hikers most wished they'd had before starting:

1. Water planning and carry logic.
2. Stream and flood crossing judgment.
3. Navigation in poorly-marked areas.
4. Food protection.

These are the first topics atomized in the Field Manual and the first scenarios built into Today. Everything else is post-v1.

## Post-v1 Roadmap (tight)

- Gear longevity predictions ("Your Lone Peaks have ~200 miles left; nearest outfitter is Damascus").
- Budget tiering for dirtbag hikers.
- Stronger town-priority logic.
- Permit reminders inside Plan.
- Alert translation (ATC closures → "does this affect my hike?").

Nothing else without explicit reopening of this brief.

## Architectural Spine

Three things must exist before any surface is built, and cannot be cut:

1. **Feature flag system** (`src/config/features.ts`) — the kill switch for every surface.
2. **Single trail context model** — one shared TypeScript type (mile, start date, pace, season, weather, water capacity, shelter preference, gear setup, budget tier) that every recommendation reads from. The thing that keeps the judgment layer coherent instead of devolving into another toolbox.
3. **PWA shell + offline architecture** — decided before components are written, not retrofitted after.

## Governance

This brief is the source of truth for v1 scope. If a decision contradicts it, the brief wins until the brief is explicitly revised. Post-v1 additions must cite which success criterion they strengthen or which roadmap item they fulfill.
