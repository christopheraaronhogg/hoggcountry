
# Full Trail RC1 Status

Generated: 2026-05-14T00:00:00.000Z

| Area | Status | Notes |
| --- | --- | --- |
| Route | Green | Base open full-route geometry integrated into full_at_route_rc1.geojson. |
| Miles | Green | 0.1/0.5/1.0 generated global milepoints with official:false. |
| Regional Stitch | Yellow | Davenport Gap to Damascus uses base open data because regional MVP detail is missing. |
| Elevation | Green | USGS 3DEP-derived samples and 5/10 mile summaries. |
| Water/Fords | Green | Mapped candidates only; reliability/potability/ford safety unknown. |
| Waypoints | Green | Regional MVPs plus base gap filler, deduplicated with provenance. |
| Rules | Yellow | Conservative official-source/pointer layer; live verification required. |
| Live Connectors | Green | NWS/NPS/USFS/state/Baxter/ATC-pointer policy centralized. |
| Tread | Yellow | Model-estimated, not field verified; gap tread low confidence. |
| Difficulty | Yellow | Planning screen only; not field verified. |
| RAG Docs | Green | Full overview, policies, 25-mile segments, indexes, metadata. |
| Licensing | Green | Blocked sources excluded from production-safe export. |
| Export | Green | Export script writes filtered production-safe zip/manifest. |
| Validation | Green | run_full_trail_validation.py enforces source-aware rules. |
| QA Tests | Green | 440 expected-behavior questions. |
