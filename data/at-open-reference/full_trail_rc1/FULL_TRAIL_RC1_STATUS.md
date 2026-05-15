
# Full Trail RC1 Status

Generated: 2026-05-15T00:00:00.000Z

| Area | Status | Notes |
| --- | --- | --- |
| Route | Yellow | Base open full-route geometry integrated, but 2106.2 generated miles remains 91.7 miles short of the 2197.9-mile 2026 official reference. |
| Route Alignment | Yellow | route_alignment_diagnostics.json documents OSM/Waymarked, geodesic measurement, continuity, endpoint/Approach handling, and unresolved causes. |
| Miles | Green | 0.1/0.5/1.0 generated/open-route global milepoints with official:false. |
| Regional Stitch | Yellow | Davenport Gap to Damascus uses base open data because regional MVP detail is missing. |
| Elevation | Green | Direct 100-meter USGS 3DEP/EPQS samples, compatibility 1-mile samples, 1/5/10 mile summaries, major climb/descent candidates, and steep-grade sections. |
| Water/Fords | Green | Mapped candidates only; reliability/potability/ford safety unknown. |
| Waypoints | Green | Regional MVPs plus base gap filler, deduplicated with provenance. |
| Landmark Anchors | Green | Water and waypoint records are coordinate-first with route_snap derived from the selected open route spine. |
| Rules | Yellow | Conservative official-source/pointer layer; live verification required. |
| Live Connectors | Green | NWS/NPS/USFS/state/Baxter/ATC-pointer policy centralized. |
| Tread | Yellow | Model-estimated, not field verified; gap tread low confidence. |
| Difficulty | Yellow | Planning screen only; not field verified. |
| RAG Docs | Green | Full overview, policies, 25-mile segments, indexes, metadata. |
| Licensing | Green | Blocked sources excluded from production-safe export. |
| Export | Green | Export script writes filtered production-safe zip/manifest. |
| Validation | Green | run_full_trail_validation.py enforces source-aware rules. |
| QA Tests | Green | 484 expected-behavior questions. |
