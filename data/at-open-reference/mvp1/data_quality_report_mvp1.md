# MVP1 Data Quality Report

Generated: 2026-05-14

## Work Completed
- Route subset from Springer open-route mile 0.0 to Davenport Gap / I-40 corridor candidate mile 234.7.
- Generated 0.1, 0.5, and 1.0 milepoints with SOBO-within-MVP1 miles.
- USGS 3DEP 1-mile elevation samples, 5-mile and 10-mile climb/descent summaries, steep sections, major climbs, and total gain/loss summary.
- USGS hydrography water candidates, all reliability unknown and potability unknown.
- OSM-derived shelters, campsites, privies, parking, road crossings, trailheads, vistas, and town/resupply candidates.
- Source-aware rules for Amicalola source gap, Chattahoochee-Oconee NF, Nantahala NF, GRSM, and Cherokee/Davenport Gap adjacent lane.
- Live-condition source policy for NWS, NPS, USFS, and land-manager pages.
- Tread/rockiness model at 0.1, 1.0, and 5.0 mile intervals.
- RAG docs and >=40 behavior questions.

## Counts
- Water candidates: 159
- Shelters: 18
- Campsites: 243
- Road crossings: 127
- Town/resupply candidates: 36
- Tread 1-mile records: 235
- RAG docs: 17

## Gaps / Uncertainty
- Generated miles are not official ATC miles.
- Parent OSM route has a known length gap versus official AT calibration references.
- Amicalola Approach Trail geometry and detailed backcountry rules are source gaps in MVP1.
- OSM waypoints/towns are mapped candidates, not guidebook-confirmed hiker intelligence.
- Water reliability and potability are unknown by default.
- SSURGO/gSSURGO, geology, and user-report rockiness signals are not ingested yet.
- Live conditions caches are placeholders until online checks run.

## Sources and Licenses
- OSM and Waymarked Trails data are ODbL-derived and require OpenStreetMap attribution/share-alike handling.
- USGS 3DEP and USGS hydrography are public-domain source lanes.
- NWS and NPS are API-accessible live-condition lanes.
- NPS, USFS, and reviewed state official pages are used for cautious rule/source pointers.
- Unknown-review and blocked sources are excluded from production-safe exports.

## Measured Length
Scout MVP1 measured length is 234.7 generated miles along the open route subset. This is not official ATC mileage and inherits the parent route's known length-gap warning.

## Blocked Sources
FarOut, The A.T. Guide/AWOL, A.T. Data Book, Thru-Hikers' Companion, AllTrails, Gaia, Hiking Project, copied ATC guide/map content, private guide PDFs, and copied guidebook blog data remain blocked unless explicitly licensed.

## Validation
Run:

```bash
python3 data/at-open-reference/mvp1/run_mvp1_validation.py
```

The validator writes `tests/validation_results_mvp1.json`. The expected
checked-in result for this generation is `ok: true`; any future failure should
be treated as a blocking data-quality issue or documented before use.

Done criteria: validation passes or failures are documented and Scout answers cautiously with source, license, confidence, and timestamps.
