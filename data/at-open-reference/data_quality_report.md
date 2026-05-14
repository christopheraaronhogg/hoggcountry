# Data Quality Report

Last updated: 2026-05-14

## Current Status

This is an early generated reference pack. It contains source policy, license
review notes, schemas, validation gates, an OSM-derived route candidate,
generated milepoints, mapped hydrography water candidates, and OSM shelter
waypoint candidates. It now includes coarse elevation summaries and filtered
OSM corridor candidates for campsites, privies/toilets, vistas, side trails,
parking, trailheads, road crossings, and nearby towns. It also includes an
initial official-source camping, permit, fee, and land-manager rules corpus.

## Completeness

- Source manifest: started.
- Blocked-source policy: started.
- Route baseline: generated from OSM relation 156553 via Waymarked Trails route ordering.
- Milepoints: generated at 0.1, 0.5, 1.0, and 5.0 mile intervals.
- Elevation: coarse 5-mile USGS EPQS/3DEP samples generated with 25-mile segment summaries and RAG docs.
- Water candidates: generated from USGS/NHD mapped hydrography and remapped to Scout's generated open milepoints.
- Shelter waypoints: generated from OSM shelter candidates and remapped to Scout's generated open milepoints.
- OSM corridor candidates: generated from a filtered Overpass corridor and
  packaged with compact accepted source elements only.
- Access/towns: OSM parking, trailhead, road-crossing, side-trail, and
  settlement candidates generated; services and private business records remain
  empty placeholders.
- Rules/permits/fees: initial official-source records generated for 17 major
  NPS, USFS, state, and Baxter land-manager rule lanes.
- Live connectors: app runtime has NWS/official-source lanes; this pack exports
  compact live-source connector metadata and current-condition answer policy.
- RAG docs: generated-mile, water, current-condition, state guide, and coarse
  elevation docs.

## Known Risks

- OSM-derived data has share-alike obligations and must stay separated.
- The first OSM-derived route candidate measures 2106.2 miles, which is 91.7
  miles shorter than the 2026 official calibration reference. Treat generated
  mileage as an open candidate baseline, not production-grade official route
  mileage.
- Elevation samples are currently coarse 5-mile point samples. They undercount
  short climbs/descents and must not be used for fine grade-risk advice until
  finer 0.1-mile or DEM-based sampling is generated.
- OSM campsite, privy, vista, side-trail, parking, trailhead, road-crossing, and
  town records are mapped candidates only. They do not prove current access,
  fees, capacity, services, blaze/junction accuracy, traffic safety, or
  land-manager legality.
- OSM town/resupply candidates are open-data settlements within 15 generated
  miles. They intentionally do not include guidebook town notes or confirmed
  hiker services.
- Camping, permit, and fee records are not exhaustive. They cover the first
  official-source pass and must be refreshed before current itinerary advice.
- PASDA/NPS candidate datasets need metadata/license review before use.
- Legacy repo scripts outside this pack may reference guidebook-derived data;
  they are not approved inputs for this open reference pack.
