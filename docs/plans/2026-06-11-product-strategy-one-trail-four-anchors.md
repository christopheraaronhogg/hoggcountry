# Product Strategy: One Trail, Four Anchors

Date: 2026-06-11
Status: agreed direction (Chris + Claude session, night of the Forge cutover)

## Thesis

The trail is the spine; the mile is the universal key. Every dataset in this
repo (shelters, water, terrain, Garmin fixes, towns, elevation, Scout context,
character position) is already keyed to a mile on the 2,197.4-mile line.
The product is not a bag of features — it is **one continuous object, the
trail, with four lenses on it**. Cohesion falls out of committing to that.

## The four anchors

One app shell, one bottom nav. Everything else becomes a card inside an anchor.

| Anchor | Role | Built from |
|--------|------|------------|
| **Map** | Home. "Where am I / where am I looking." | TrailMapExplorer (live Garmin, difficulty/grade/rockiness layers, tap-to-inspect) |
| **Scout** | The brain. Grounded answers with visible trust. | Scout runtime + reliability harness; surface citations, freshness stamps, "verify live" flags as product behavior |
| **Manual** | The memory. The hiker's own documents. | Field Guide → Field Manual pipeline, saved chapters, notes, highlights, journal |
| **Loadout** | The body. The bag as a first-class object. | PackBuilder + BudgetGearBuilder + geartrans logic + at-gear-database.json |

The 16-tool hub dissolves into these: pack/gear/budget → Loadout; water/
resupply/mail/town → Map layers + mile-context cards; layers/shelter/weather →
Today decisions via Scout; milestones/training → profile/plan.

## The daily loop (Today screen)

The ritual that makes it an app: open → your mile → weather at your mile →
next shelter/water/town with distances → plan vs. actual → one Scout
observation → log a check-in. All data already exists in /track/map-pack;
Today is an assembly job.

## The funnel is the live expedition

Public site = follow Dad (map dot, dispatches, videos) on the SAME surfaces a
hiker uses. Viewer → follower → planner (guide/manual) → hiker (Scout).
Marketing and product are one surface; the expedition is the demo.

## Trust as moat

- Scout answers carry citations and data freshness ("water report: 3 days old").
- Anything time-sensitive carries an explicit "verify live" flag.
- The reliability runbook discipline (regression + holdout suites) stays
  mandatory for Scout changes; it is the product's safety case.

## Sequencing

1. **Converge** (post-cutover): one shell, four anchors, retire legacy
   surfaces (timeline blog, tool hub sprawl, trail-assistant demos,
   workspace prototype). Mostly deletion + navigation.
2. **Today screen**: daily loop from map-pack data.
3. **Loadout v1**: account-backed bag, item weights, worn/consumed flags,
   base weight, seasonal section-aware swap hints, public share link.
4. **Plan**: rolling 7-day itinerary + town-day logistics (per the
   trail-assistant PRD).
5. **Capacitor + offline packs**: same SvelteKit app to app stores; map pack
   + manual + loadout cached offline. Local-first phone AI
   (docs/plans/2026-05-12-scout-local-first-phone-ai.md) slots in here.
6. **Concierge + partners**: premium tier, only after the daily loop has
   real users.

## Monetization shape

Thru-hikers think in seasons, not subscriptions:

- **Free**: follow the expedition, read the guide.
- **Season pass**: Scout + Loadout + offline packs.
- **Concierge**: premium human-escalation tier.
- **BYOS** keeps AI margin sane (already scaffolded).

## Emotional design

- Keep and extend the expedition-instrument aesthetic (the map's ranger chrome
  is the voice of the product).
- Mile-aware everything = the app "knows the trail."
- Celebration moments from the TrailHogg game DNA (state lines, mile 100,
  halfway at Harpers) — shareable, screenshot-worthy, not gamified.
- The Manual + journal becomes a keepsake: "your thru-hike, documented."

## Non-goals (for now)

- No new standalone tools or routes outside the four anchors.
- No multiplayer/social graph beyond Loadout sharing and the public map.
- No additional trails until the AT loop is loved (data model already
  generalizes: a trail is a line with mile-keyed lenses).
