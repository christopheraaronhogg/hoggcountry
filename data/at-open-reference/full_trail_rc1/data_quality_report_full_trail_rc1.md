
# Data Quality Report: Full Trail RC1

## Work Completed
- Integrated MVP1-MVP6 with the base open full-route geometry.
- Created global full-trail generated milepoints and alignment notes.
- Added coordinate-first landmark anchors for water and waypoint datasets, with route_snap stored as a derived generated/open-route mile view.
- Merged elevation, water, waypoints, rules, live-source, tread, difficulty, and RAG metadata indexes.
- Added direct 100-meter USGS 3DEP/EPQS elevation samples with 1/5/10-mile detailed summaries, major climb/descent candidates, and steep-grade screening sections.
- Added Rockiness V2 source reviews, 0.1-mile and 1-mile model records, micro-roughness coverage metadata, OSM surface-signal records, and a conservative gSSURGO/SSURGO lane that stays null until bounded extraction exists.
- Added blocked legacy AWOL audit metadata and validation gates to keep AWOL/A.T. Guide-derived data out of production-safe exports.
- Created license/provenance audit docs and production-safe export tooling.
- Created 638 full-trail behavior QA questions.

## Source / License Summary
- OSM-derived data: open_license_share_alike / ODbL with attribution.
- USGS/NOAA/NWS style data: public domain or API-accessible with attribution notes.
- Land-manager pages: pointer/current-check lanes unless license-reviewed.
- ATC/FarOut/AT Guide/Data Book/Companion/AllTrails/Gaia/Hiking Project/copied guide content: blocked or pointer-only.

## Measured Length And Gaps
- RC1 generated open-route length: 2106.2 miles.
- 2026 official reference length for comparison: 2197.9 miles.
- Official reference source: https://appalachiantrail.org/experience/hike-the-trail/at-basics/
- Known material delta: -91.7 miles (-4.2%).
- Alignment status: yellow_unresolved_open_route_delta.
- Davenport Gap to Damascus/TN-VA regional coverage gap: yellow.

See processed/route/route_alignment_report.md and processed/route/route_alignment_diagnostics.json for the route measurement audit. Current evidence says the open OSM/Waymarked spine itself is short relative to the official 2026 reference; projection and coarse 3D slope length do not explain most of the gap.

## Record Counts
- route: 1
- route_alignment_diagnostics: 1
- route_continuity_diagnostics: 1
- route_segment_length_checks: 7
- milepoints_0_1mi: 21062
- milepoints_0_5mi: 4213
- milepoints_1_0mi: 2107
- elevation_samples_1_0mi: 2107
- elevation_samples_100m: 33897
- elevation_100m_status: 1
- elevation_by_1mi_segment_100m: 2107
- elevation_by_5mi_segment_100m: 422
- elevation_by_10mi_segment_100m: 211
- elevation_major_climbs_descents_100m: 606
- elevation_steep_grade_sections_100m: 3941
- water_candidates: 1765
- major_ford_candidates: 259
- rules: 54
- live_sources: 35
- tread: 2108
- rockiness_v2_0_1mi: 21062
- rockiness_v2_1mi: 2107
- micro_roughness_coverage: 3
- soil_stoniness: 2108
- osm_surface_tags: 2108
- difficulty: 211
- rag_metadata: 85
- qa_questions: 638
- source_review_opentrail: 1
- source_review_openlongtrails: 1
- source_review_open_dem: 3
- blocked_legacy_awol_audit: 1

## Weak Points
- Generated miles are not official and should not be used as exact field navigation.
- Davenport Gap to Damascus lacks regional MVP depth.
- Tread/difficulty are model screens, not field verified.
- Rockiness V2 improves roughness screening, but LiDAR and gSSURGO are reviewed future lanes in RC1; they are not record-level extracted evidence yet.
- Elevation is model-derived from USGS 3DEP/EPQS at 100-meter spacing; it is detailed enough for planning screens but not surveyed tread grade.
- Water/fords remain candidate-only unless verified.
- Current closures/weather/permits/fords/Katahdin status require live checks.

## Next Work
- Build a dedicated Davenport Gap to Damascus regional MVP.
- Improve verified campsite/hut/resupply/business data only where licensing permits.
- Add user-submitted, timestamped field reports with deletion/moderation and provenance.
- Build Planner Engine v1 on top of RC1 difficulty and live-condition gates.
