# Scout source catalog and grounding lanes (2026-05-01)

## Decision

Give Scout more capability by making it source-aware before it gets more chat UI.

Scout should prefer this order:

1. **Private hiker workspace** — profile, manual notes, saved Scout plans, imported docs, tools/checklists.
2. **Reviewed Hogg Country corpus** — current field guide and approved/shared trail knowledge.
3. **Public hiker signals** — Trail Updates, location fixes, dispatches, journals, and shared guides the hiker has explicitly made available.
4. **User-owned guide data** — A.T. Guide/AWOL/FarOut screenshots or exports only when the hiker legally supplies them.
5. **Official/direct live checks** — ATC, NWS/NOAA, land managers, hostel/shuttle/outfitter direct pages or phone-confirmed notes.

Privacy rule: using a source to help the hiker is not the same as sharing it. Everything starts private unless the hiker opts into family/friends, link-only, public, or reviewed shared-intel promotion.

---

## Source lanes

| Lane | Access now | Trust | Best use | Caveat |
|---|---:|---|---|---|
| Private workspace | Yes | Hiker-private | Personal constraints, gear, health, plans, budget, current mile, living docs | Ask when stale/missing |
| Hogg Country corpus | Yes | Reviewed/internal | General AT ops, routines, gear, shelter/tent, resupply norms | Not live conditions |
| Dad public pilot | Yes | Public pilot | Real-world Scout testing from Trail Updates/Garmin/dispatches | Garmin can lag; public only |
| A.T. Guide / AWOL | Import | Reviewed/user-owned | Mileage, elevation, shelters, campsites, towns, crossings | Do not scrape/bundle copyrighted data |
| FarOut recent comments | Import/manual | Crowd/current | Water, blowdowns, closures, shelter/campsite condition | Dated and cross-check risky claims |
| ATC Trail Updates | External live check | Official | Closures, detours, ferry/bridge status, fire restrictions | Scout must not pretend it checked live if it did not |
| NWS / NOAA | External live check | Official | Weather, storms, heat/cold, wind, flood, snow/ice | Use point/elevation when possible |
| Land managers | External live check | Official | Permits, camping rules, road/trailhead access, park/forest closures | Jurisdiction changes often |
| Hostel/shuttle/outfitter direct | External/direct | Direct | Availability, hours, laundry, shuttles, reservations, mail drops | Same-day logistics need confirmation |
| Hiker-owned social/profile hub | Future | Hiker-private by default | Journal, location history, gear/loadout, family-facing profile, shared guides | Share controls must be explicit per artifact |

---

## Shipped code hook

`apps/openclaw-web/src/lib/server/claw-agent.ts` now gives Scout three source-aware behaviors:

1. It builds a source context for each reply turn by searching currently available workspace/manual/docs/tools/corpus/Dad-pilot context.
2. It registers a `search_scout_sources` tool Scout can call when the user’s question needs a narrower source search during the turn.
3. It registers a `check_official_trail_sources` tool backed by `apps/openclaw-web/src/lib/server/scout-official-sources.ts`, which can fetch ATC Trail Updates and NWS point forecasts/alerts when coordinates are available.

These paths also give Scout the best source lanes to request or verify next.

The first product surface using this is the `/app/claw` Daily Trail Brief card. It calls `/app-api/claw/daily-brief`, combines private workspace/Dad-pilot context with ATC/NWS checks, shows source receipts, highlights risk signals, and can paste a structured brief into Scout for a next-24-hours / next-7-days planning turn.

This is intentionally not a broad web scraper. It gives Scout better grounding without violating guide licensing, hiker privacy, or live-condition certainty.

## Next implementation steps

1. Expand the Daily Trail Brief into a scheduled/proactive brief once messaging rules are clear.
2. Add per-artifact sharing flags before turning journal/location/profile into family-facing surfaces.
3. Add import helpers for hiker-owned FarOut screenshots/notes and A.T. Guide excerpts.
4. Add richer source receipts in the Scout thread after tool calls, not just on the Daily Brief card.
5. Promote only reviewed, opt-in fact candidates into the shared trail intelligence corpus.
