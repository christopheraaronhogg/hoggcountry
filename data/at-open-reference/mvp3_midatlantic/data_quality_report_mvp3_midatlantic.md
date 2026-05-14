# MVP3 Mid-Atlantic Data Quality Report

Generated: 2026-05-14

## Work Completed
- Route subset from Harpers Ferry / VA-WV-MD transition anchor to PA/NJ / Delaware Water Gap anchor.
- Generated 0.1, 0.5, and 1.0 milepoints with global estimate, MVP3 NOBO mile, and MVP3 SOBO mile.
- USGS 3DEP elevation samples, 5-mile and 10-mile climb/descent summaries, major climbs/descents, high/low points, steep descents, and summary markdown.
- USGS hydrography water candidates and sparse/uncertain stretch flags, all reliability unknown and potability unknown.
- OSM-derived shelters, campsites, privies, parking, road crossings, trailheads, vistas, and town/resupply candidates.
- Rule source lanes for Harpers Ferry, C&O/Potomac, Maryland South Mountain, Pennsylvania DCNR forests/parks, Pennsylvania State Game Lands, Delaware Water Gap, and local/private/easement source gaps.
- Live-condition connector policy for NWS, NPS/Harpers Ferry/C&O/DWG, Maryland DNR, Pennsylvania DCNR, Pennsylvania Game Commission, and ATC pointer-only checks.
- Tread/rockiness model at 0.1, 1.0, and 5.0 mile intervals.
- Pennsylvania rockiness calibration report comparing south PA against northern rocky ridges with open model signals.
- WV, MD, and PA state guides, 25-mile segment guides, policy docs, and >=60 behavior questions.
- Production-safe JSON export, manifest, and zip archive.

## Counts
- Water candidates: 86
- Shelters: 20
- Campsites: 94
- Road crossings: 540
- Town/resupply candidates: 264
- Tread 1-mile records: 264
- RAG docs: 19

## Gaps / Weak Points
- Generated miles are not official ATC miles.
- Parent OSM route has a known length gap versus official AT calibration references.
- MVP2 Virginia handoff is at Harpers Ferry; generated global miles remain open-route estimates.
- NJ/NY/CT are future MVP4 scope; Delaware Water Gap is a handoff, not full New Jersey coverage.
- Water reliability and potability are unknown by default.
- Private business/service details are not packaged unless license OK; town services remain unknown candidates.
- SSURGO/gSSURGO, geology, and user-report rockiness signals are documented but not ingested.
- Live condition caches are placeholders until online checks run.
- Rules outside major official source lanes may require land-manager verification.

## Sources and Licenses
- OSM and Waymarked Trails data are ODbL-derived and require OpenStreetMap attribution/share-alike handling.
- USGS 3DEP and USGS hydrography are public-domain source lanes.
- NWS and NPS are API-accessible live-condition lanes.
- NPS, Maryland DNR, Pennsylvania DCNR, and Pennsylvania Game Commission official pages are used for cautious rule/source pointers.
- ATC Trail Updates are a verification pointer only.
- Unknown-review and blocked sources are excluded from production-safe JSON and zip exports.

## Measured Length
Scout MVP3 Mid-Atlantic measured length is 264.0 generated miles along the open route subset. This is not official ATC mileage and inherits the parent route's known length-gap warning.

## Blocked Sources
FarOut, The A.T. Guide/AWOL, A.T. Data Book, Thru-Hikers' Companion, AllTrails, Gaia, Hiking Project, copied ATC guide/map text/data, private guide PDFs, and copied guidebook blog data remain blocked unless explicitly licensed.

## Validation
Run:

```bash
python3 data/at-open-reference/mvp3_midatlantic/run_mvp3_midatlantic_validation.py
```

The validator writes `tests/validation_results_mvp3_midatlantic.json`. The expected checked-in result for this generation is `ok: true`.

## Next Work
- Replace source-gap rule lanes with more precise district/park records after legal/source review.
- Add validated OSM route-segment tread tag joins, then evaluate SSURGO/gSSURGO and geology signals.
- Add trusted user-submitted water/tread reports only with explicit provenance and timestamps.
- Build MVP4 NJ/NY/CT as a separate pack.
