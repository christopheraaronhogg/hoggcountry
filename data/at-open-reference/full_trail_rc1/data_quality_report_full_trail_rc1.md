
# Data Quality Report: Full Trail RC1

## Work Completed
- Integrated MVP1-MVP6 with the base open full-route geometry.
- Created global full-trail generated milepoints and alignment notes.
- Merged elevation, water, waypoints, rules, live-source, tread, difficulty, and RAG metadata indexes.
- Created license/provenance audit docs and production-safe export tooling.
- Created 440 full-trail behavior QA questions.

## Source / License Summary
- OSM-derived data: open_license_share_alike / ODbL with attribution.
- USGS/NOAA/NWS style data: public domain or API-accessible with attribution notes.
- Land-manager pages: pointer/current-check lanes unless license-reviewed.
- ATC/FarOut/AT Guide/Data Book/Companion/AllTrails/Gaia/Hiking Project/copied guide content: blocked or pointer-only.

## Measured Length And Gaps
- RC1 generated open-route length: 2106.2 miles.
- 2026 official reference length for comparison: 2197.9 miles.
- Known material delta: -91.7 miles.
- Davenport Gap to Damascus/TN-VA regional coverage gap: yellow.

## Record Counts
- route: 1
- milepoints_0_1mi: 21062
- milepoints_0_5mi: 4213
- milepoints_1_0mi: 2107
- elevation_samples: 2107
- water_candidates: 1765
- major_ford_candidates: 259
- rules: 54
- live_sources: 35
- tread: 2108
- difficulty: 211
- rag_metadata: 85
- qa_questions: 440

## Weak Points
- Generated miles are not official and should not be used as exact field navigation.
- Davenport Gap to Damascus lacks regional MVP depth.
- Tread/difficulty are model screens, not field verified.
- Water/fords remain candidate-only unless verified.
- Current closures/weather/permits/fords/Katahdin status require live checks.

## Next Work
- Build a dedicated Davenport Gap to Damascus regional MVP.
- Improve verified campsite/hut/resupply/business data only where licensing permits.
- Add user-submitted, timestamped field reports with deletion/moderation and provenance.
- Build Planner Engine v1 on top of RC1 difficulty and live-condition gates.
