# MVP6 Maine Data Quality Report

Generated: 2026-05-14

## Work Completed
- Route subset from NH/ME Carlo Col-Full Goose handoff estimate to Katahdin/Baxter northern terminus endpoint.
- Generated 0.1, 0.5, and 1.0 milepoints with global estimate, MVP6 NOBO mile, and MVP6 SOBO mile.
- USGS 3DEP elevation samples, 5-mile and 10-mile climb/descent summaries, major climbs/descents, high/low points, steep descents, Mahoosuc difficulty flags, Katahdin climb summary, and summary markdown.
- USGS hydrography water candidates, major river/fording candidates, and sparse/uncertain stretch flags, all reliability unknown, potability unknown, and ford safety unknown.
- OSM-derived shelters, campsites, privies, parking, road crossings, trailheads, vistas, huts/tent-site candidates where present, summits, alpine exposure points, river crossings, bailout access points, Monson logistics candidates, and town/resupply candidates.
- Rule source lanes for western Maine, Monson pointer, 100-Mile Wilderness, Baxter State Park, Katahdin/Hunt Trail, and local/private/easement source gaps.
- Live-condition connector policy for NWS, NPS/APPA, Maine state/local/private corridor checks, Baxter current conditions, Baxter official pages, Monson pointer, and ATC pointer-only checks.
- Tread/rockiness/rootiness/mud/fording/remoteness model at 0.1, 1.0, and 5.0 mile intervals.
- Maine tread/remoteness calibration report comparing Mahoosuc, western Maine, Monson approach, 100-Mile Wilderness, Baxter, and Katahdin model signals without field-verification claims.
- 10-mile difficulty model using distance, gain/loss, descents, tread, mud/rootiness, ford uncertainty, remoteness/bailout scarcity, weather severity, and water uncertainty.
- Maine state guide, 25-mile segment guides, policy docs, and >=80 behavior questions.
- Production-safe JSON export, manifest, and zip archive.

## Counts
- Water candidates: 169
- Major ford candidates: 169
- Shelters: 33
- Campsites: 36
- Huts: 0
- Tent-site candidates: 36
- River crossing candidates: 169
- Bailout/access candidates: 123
- Monson logistics candidates: 8
- Alpine exposure points: 6
- Road crossings: 87
- Town/resupply candidates: 33
- Tread 1-mile records: 254
- Difficulty segments: 26
- RAG docs: 18

## Gaps / Weak Points
- Generated miles are not official ATC miles.
- Parent OSM route has a known length gap versus official AT calibration references.
- MVP5 handoff is near Carlo Col / Full Goose at the NH-ME line; generated global miles remain open-route estimates.
- Katahdin/Hunt Trail endpoint treatment is an open-route geometry assumption, not an official mileage table.
- Water reliability, potability, and ford safety are unknown by default.
- Private business/service details are not packaged unless license OK; town services remain unknown candidates.
- SSURGO/gSSURGO, geology, and user-report rockiness signals are documented but not ingested.
- Live condition caches are placeholders until online checks run.
- Rules outside major official source lanes may require land-manager verification.

## Sources and Licenses
- OSM and Waymarked Trails data are ODbL-derived and require OpenStreetMap attribution/share-alike handling.
- USGS 3DEP and USGS hydrography are public-domain source lanes.
- NWS and NPS are API-accessible live-condition lanes.
- Maine state/local/private corridor, Baxter State Park, and NPS/APPA official pages are used for cautious rule/source pointers.
- Monson/private service sources and ATC Trail Updates are verification pointers only unless licensed.
- Unknown-review and blocked sources are excluded from production-safe JSON and zip exports.

## Measured Length
Scout MVP6 Maine measured length is 253.2 generated miles along the open route subset. This is not official ATC mileage and inherits the parent route's known length-gap warning.

## Blocked Sources
FarOut, The A.T. Guide/AWOL, A.T. Data Book, Thru-Hikers' Companion, AllTrails, Gaia, Hiking Project, copied ATC guide/map text/data, private guide PDFs, and copied guidebook blog data remain blocked unless explicitly licensed.

## Validation
Run:

```bash
python3 data/at-open-reference/mvp6_maine/run_mvp6_maine_validation.py
```

The validator writes `tests/validation_results_mvp6_maine.json`. The expected checked-in result for this generation is `ok: true`.

## Next Work
- Replace source-gap rule lanes with more precise district/park records after legal/source review.
- Add validated OSM route-segment tread tag joins, then evaluate SSURGO/gSSURGO and geology signals.
- Add trusted user-submitted water/tread/ford reports only with explicit provenance and timestamps.
- Build a full-trail integration skeleton across MVP1-MVP6.
