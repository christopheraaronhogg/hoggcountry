# MVP4 NJ/NY/CT Data Quality Report

Generated: 2026-05-14

## Work Completed
- Route subset from Delaware Water Gap / PA-NJ transition anchor to Sages Ravine / CT-MA handoff estimate.
- Generated 0.1, 0.5, and 1.0 milepoints with global estimate, MVP4 NOBO mile, and MVP4 SOBO mile.
- USGS 3DEP elevation samples, 5-mile and 10-mile climb/descent summaries, major climbs/descents, high/low points, steep descents, and summary markdown.
- USGS hydrography water candidates and sparse/uncertain stretch flags, all reliability unknown and potability unknown.
- OSM-derived shelters, campsites, privies, parking, road crossings, trailheads, vistas, and town/resupply candidates.
- Rule source lanes for Delaware Water Gap/NPS, NJDEP, NYS Parks/DEC, Harriman/Bear Mountain/Palisades, CT DEEP, Sages Ravine/CT-MA, and local/private/easement source gaps.
- Live-condition connector policy for NWS, NPS/APPA/DWG, NJDEP, NYS Parks/DEC, Palisades, CT DEEP, ATC, NY-NJ Trail Conference, and CT AMC pointer-only checks.
- Tread/rockiness model at 0.1, 1.0, and 5.0 mile intervals.
- MVP4-vs-MVP3 PA rockiness calibration report comparing open model signals without field-verification claims.
- NJ, NY, and CT state guides, 25-mile segment guides, policy docs, and >=60 behavior questions.
- Production-safe JSON export, manifest, and zip archive.

## Counts
- Water candidates: 152
- Shelters: 19
- Campsites: 36
- Road crossings: 407
- Town/resupply candidates: 213
- Tread 1-mile records: 206
- RAG docs: 17

## Gaps / Weak Points
- Generated miles are not official ATC miles.
- Parent OSM route has a known length gap versus official AT calibration references.
- MVP3 handoff is at Delaware Water Gap; generated global miles remain open-route estimates.
- MVP4 ends near Sages Ravine / CT-MA; Massachusetts is future MVP5 scope.
- Water reliability and potability are unknown by default.
- Private business/service details are not packaged unless license OK; town services remain unknown candidates.
- SSURGO/gSSURGO, geology, and user-report rockiness signals are documented but not ingested.
- Live condition caches are placeholders until online checks run.
- Rules outside major official source lanes may require land-manager verification.

## Sources and Licenses
- OSM and Waymarked Trails data are ODbL-derived and require OpenStreetMap attribution/share-alike handling.
- USGS 3DEP and USGS hydrography are public-domain source lanes.
- NWS and NPS are API-accessible live-condition lanes.
- NPS, NJDEP, NYS Parks/DEC, Palisades, and CT DEEP official pages are used for cautious rule/source pointers.
- ATC Trail Updates, NY-NJ Trail Conference, and CT AMC are verification pointers only unless licensed.
- Unknown-review and blocked sources are excluded from production-safe JSON and zip exports.

## Measured Length
Scout MVP4 NJ/NY/CT measured length is 206.0 generated miles along the open route subset. This is not official ATC mileage and inherits the parent route's known length-gap warning.

## Blocked Sources
FarOut, The A.T. Guide/AWOL, A.T. Data Book, Thru-Hikers' Companion, AllTrails, Gaia, Hiking Project, copied ATC guide/map text/data, private guide PDFs, and copied guidebook blog data remain blocked unless explicitly licensed.

## Validation
Run:

```bash
python3 data/at-open-reference/mvp4_nj_ny_ct/run_mvp4_nj_ny_ct_validation.py
```

The validator writes `tests/validation_results_mvp4_nj_ny_ct.json`. The expected checked-in result for this generation is `ok: true`.

## Next Work
- Replace source-gap rule lanes with more precise district/park records after legal/source review.
- Add validated OSM route-segment tread tag joins, then evaluate SSURGO/gSSURGO and geology signals.
- Add trusted user-submitted water/tread reports only with explicit provenance and timestamps.
- Build MVP5 MA/VT/NH as the next northbound pack.
