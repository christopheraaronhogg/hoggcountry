
# Full Trail RC1 Status

Generated: 2026-05-16T00:00:00.000Z

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
| Tread | Yellow | Tread v1 retained for compatibility; model-estimated, not field verified; gap tread low confidence. |
| Rockiness V2 | Yellow | 21062 0.1-mile records and 2107 1-mile records. Uses 100m DEM/OSM signals; retained as V2.1 fallback. |
| Rockiness V2.1 | Yellow | 2107 1-mile records plus bounded source-extraction metadata. Adds 3DEP DEM STAC and USGS LiDAR catalog metadata; no raster pixels, LiDAR points, SSURGO attributes, or field verification yet. |
| Difficulty | Yellow | Planning screen prefers Rockiness V2.1 when present; not field verified. |
| RAG Docs | Green | Full overview, policies, 25-mile segments, indexes, metadata. |
| Source Reviews | Yellow | OpenTrail/OpenLongTrails held as unknown_review_required; USGS 3DEP Seamless, USGS LiDAR, and gSSURGO/SSURGO reviewed as production-safe source lanes. |
| Licensing | Green | Blocked sources and review-only sources excluded from production-safe export. |
| Export | Green | Export script writes filtered production-safe zip/manifest. |
| Validation | Green | run_full_trail_validation.py enforces source-aware rules. |
| QA Tests | Green | 638 expected-behavior questions. |
