# MVP5 MA/VT/NH Data Quality Report

Generated: 2026-05-14

## Work Completed
- Route subset from CT/MA Sages Ravine handoff anchor to NH/ME Carlo Col-Full Goose handoff estimate.
- Generated 0.1, 0.5, and 1.0 milepoints with global estimate, MVP5 NOBO mile, and MVP5 SOBO mile.
- USGS 3DEP elevation samples, 5-mile and 10-mile climb/descent summaries, major climbs/descents, high/low points, steep descents, and summary markdown.
- USGS hydrography water candidates and sparse/uncertain stretch flags, all reliability unknown and potability unknown.
- OSM-derived shelters, campsites, privies, parking, road crossings, trailheads, vistas, huts, tent-site candidates, summits, alpine exposure points, and town/resupply candidates.
- Rule source lanes for Massachusetts, Green Mountain NF/Long Trail overlap, Vermont state/local lands, Hanover/local lands, White Mountain NF, AMC huts/campsites pointer, alpine/FPA, and local/private/easement source gaps.
- Live-condition connector policy for NWS, NPS/APPA, MA DCR, Vermont FPR, USFS GMNF/WMNF, NH state/local, ATC, AMC, and GMC pointer-only checks.
- Tread/rockiness/rootiness/mud model at 0.1, 1.0, and 5.0 mile intervals.
- Mountain tread/mud calibration report comparing MA, VT, NH, White Mountain, and Presidential Range model signals without field-verification claims.
- 10-mile difficulty model using distance, gain/loss, descents, tread, mud, alpine exposure, bailout scarcity, weather severity, and water uncertainty.
- MA, VT, and NH state guides, 25-mile segment guides, policy docs, and >=70 behavior questions.
- Production-safe JSON export, manifest, and zip archive.

## Counts
- Water candidates: 377
- Shelters: 39
- Campsites: 30
- Huts: 1
- Tent-site candidates: 35
- Alpine exposure points: 34
- Road crossings: 434
- Town/resupply candidates: 163
- Tread 1-mile records: 377
- Difficulty segments: 38
- RAG docs: 25

## Gaps / Weak Points
- Generated miles are not official ATC miles.
- Parent OSM route has a known length gap versus official AT calibration references.
- MVP4 handoff is near Sages Ravine / CT-MA; generated global miles remain open-route estimates.
- MVP5 ends near the NH/ME Carlo Col-Full Goose handoff estimate; Maine is future MVP6 scope.
- Water reliability and potability are unknown by default.
- Private business/service details are not packaged unless license OK; town services remain unknown candidates.
- SSURGO/gSSURGO, geology, and user-report rockiness signals are documented but not ingested.
- Live condition caches are placeholders until online checks run.
- Rules outside major official source lanes may require land-manager verification.

## Sources and Licenses
- OSM and Waymarked Trails data are ODbL-derived and require OpenStreetMap attribution/share-alike handling.
- USGS 3DEP and USGS hydrography are public-domain source lanes.
- NWS and NPS are API-accessible live-condition lanes.
- MA DCR, Vermont FPR, USFS GMNF/WMNF, NH state/local, and NPS/APPA official pages are used for cautious rule/source pointers.
- ATC Trail Updates, AMC, and Green Mountain Club are verification pointers only unless licensed.
- Unknown-review and blocked sources are excluded from production-safe JSON and zip exports.

## Measured Length
Scout MVP5 MA/VT/NH measured length is 377.0 generated miles along the open route subset. This is not official ATC mileage and inherits the parent route's known length-gap warning.

## Blocked Sources
FarOut, The A.T. Guide/AWOL, A.T. Data Book, Thru-Hikers' Companion, AllTrails, Gaia, Hiking Project, copied ATC guide/map text/data, private guide PDFs, and copied guidebook blog data remain blocked unless explicitly licensed.

## Validation
Run:

```bash
python3 data/at-open-reference/mvp5_ma_vt_nh/run_mvp5_ma_vt_nh_validation.py
```

The validator writes `tests/validation_results_mvp5_ma_vt_nh.json`. The expected checked-in result for this generation is `ok: true`.

## Next Work
- Replace source-gap rule lanes with more precise district/park records after legal/source review.
- Add validated OSM route-segment tread tag joins, then evaluate SSURGO/gSSURGO and geology signals.
- Add trusted user-submitted water/tread reports only with explicit provenance and timestamps.
- Build MVP6 Maine as the next northbound pack.
