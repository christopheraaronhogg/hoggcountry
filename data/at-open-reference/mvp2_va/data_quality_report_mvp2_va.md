# MVP2 Virginia Data Quality Report

Generated: 2026-05-14

## Work Completed
- Route subset from TN/VA border / Damascus area anchor to VA/WV border / Harpers Ferry approach anchor.
- Generated 0.1, 0.5, and 1.0 milepoints with global estimate, VA NOBO mile, and VA SOBO mile.
- USGS 3DEP elevation samples, 5-mile and 10-mile climb/descent summaries, major climbs/descents, high/low points, steep descents, and summary markdown.
- USGS hydrography water candidates, all reliability unknown and potability unknown.
- OSM-derived shelters, campsites, privies, parking, road crossings, trailheads, vistas, and town/resupply candidates.
- Rule source lanes for GWJ NF, Mount Rogers, Grayson Highlands, Blue Ridge Parkway, Shenandoah NP, Harpers Ferry approach, and local/state source gaps.
- Live-condition connector policy for NWS, NPS, Shenandoah-specific alerts, USFS/GWJ, Virginia DCR/state-local, and ATC pointer-only checks.
- Tread/rockiness model at 0.1, 1.0, and 5.0 mile intervals.
- VA state guide, 25-mile segment guides, policy docs, and >=50 behavior questions.
- Production-safe JSON export, manifest, and zip archive.

## Counts
- Water candidates: 333
- Shelters: 30
- Campsites: 66
- Road crossings: 708
- Town/resupply candidates: 155
- Tread 1-mile records: 547
- RAG docs: 28

## Gaps / Weak Points
- Generated miles are not official ATC miles.
- Parent OSM route has a known length gap versus official AT calibration references.
- MVP1-to-Damascus connector is not packaged in MVP2.
- WV/MD/PA are future scope; Harpers Ferry is a handoff, not full WV/MD coverage.
- Water reliability and potability are unknown by default.
- Private business/service details are not packaged unless license OK; town services remain unknown candidates.
- SSURGO/gSSURGO, geology, and user-report rockiness signals are documented but not ingested.
- Live condition caches are placeholders until online checks run.
- Rules outside major official source lanes may require land-manager verification.

## Sources and Licenses
- OSM and Waymarked Trails data are ODbL-derived and require OpenStreetMap attribution/share-alike handling.
- USGS 3DEP and USGS hydrography are public-domain source lanes.
- NWS and NPS are API-accessible live-condition lanes.
- NPS, Shenandoah-specific alert lane, USFS/GWJ, and Virginia Department of Conservation and Recreation (VA DCR) official pages are used for cautious rule/source pointers.
- ATC Trail Updates are a verification pointer only.
- Unknown-review and blocked sources are excluded from production-safe JSON and zip exports.

## Measured Length
Scout MVP2 Virginia measured length is 547.0 generated miles along the open route subset. This is not official ATC mileage and inherits the parent route's known length-gap warning.

## Blocked Sources
FarOut, The A.T. Guide/AWOL, A.T. Data Book, Thru-Hikers' Companion, AllTrails, Gaia, Hiking Project, copied ATC guide/map text/data, private guide PDFs, and copied guidebook blog data remain blocked unless explicitly licensed.

## Validation
Run:

```bash
python3 data/at-open-reference/mvp2_va/run_mvp2_va_validation.py
```

The validator writes `tests/validation_results_mvp2_va.json`. The expected checked-in result for this generation is `ok: true`.

## Next Work
- Replace source-gap rule lanes with more precise district/park records after legal/source review.
- Add validated OSM route-segment tread tag joins, then evaluate SSURGO/gSSURGO and geology signals.
- Add trusted user-submitted water/tread reports only with explicit provenance and timestamps.
- Build MVP3 WV/MD/PA as a separate pack.
