# Data Quality Report

Last updated: 2026-05-13

## Current Status

This is an early generated reference pack. It contains source policy, license
review notes, schemas, validation gates, an OSM-derived route candidate,
generated milepoints, mapped hydrography water candidates, and OSM shelter
waypoint candidates. It does not yet contain elevation profiles, access/town
datasets, or a camping-rule corpus.

## Completeness

- Source manifest: started.
- Blocked-source policy: started.
- Route baseline: generated from OSM relation 156553 via Waymarked Trails route ordering.
- Milepoints: generated at 0.1, 0.5, 1.0, and 5.0 mile intervals.
- Elevation: coarse 5-mile USGS EPQS/3DEP samples generated with 25-mile segment summaries and RAG docs.
- Water candidates: generated from USGS/NHD mapped hydrography and remapped to Scout's generated open milepoints.
- Shelter waypoints: generated from OSM shelter candidates and remapped to Scout's generated open milepoints.
- Access/towns: not generated.
- Rules/permits/fees: not generated.
- Live connectors: app runtime has NWS/official-source lanes; this pack has not
  exported connector metadata yet.
- RAG docs: policy docs only.

## Known Risks

- OSM-derived data has share-alike obligations and must stay separated.
- The first OSM-derived route candidate measures 2106.2 miles, which is 91.7
  miles shorter than the 2026 official calibration reference. Treat generated
  mileage as an open candidate baseline, not production-grade official route
  mileage.
- Elevation samples are currently coarse 5-mile point samples. They undercount
  short climbs/descents and must not be used for fine grade-risk advice until
  finer 0.1-mile or DEM-based sampling is generated.
- PASDA/NPS candidate datasets need metadata/license review before use.
- Legacy repo scripts outside this pack may reference guidebook-derived data;
  they are not approved inputs for this open reference pack.
