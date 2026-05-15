
# Route Alignment Report

Generated: 2026-05-15T00:00:00.000Z

## Status
- Alignment status: yellow_unresolved_open_route_delta
- Official 2026 reference length: 2197.9 miles
- Official reference source: https://appalachiantrail.org/experience/hike-the-trail/at-basics/
- Scout generated open-route length: 2106.2 miles
- Delta: -91.7 miles (-4.2%)
- Route official flag: false
- Generated Scout miles are not official ATC miles.

The official length is used only as a single reference value. Scout generated miles are not official ATC miles. Scout does not copy ATC mile tables, FarOut data, The A.T. Guide, A.T. Data Book, Thru-Hikers' Companion, AllTrails, Gaia, Hiking Project, or copied ATC guide/map content.

## Measurement Audit
- Local geodesic measurement: 2106.163 miles over 191,541 vertices.
- Waymarked route reported length: 2106.762 miles.
- Source graph measured length: 2106.183 miles.
- 100-meter 3D estimate: 2118.7 miles, adding about 12.5 miles.
- Maximum consecutive route-vertex gap: 0.529 miles.
- Consecutive route-vertex gaps over 1.0 mile: 0.

Conclusion: the measurement method is not the primary cause. Local geodesic, Waymarked reported length, and source graph length all cluster near the Scout generated length. The open geometry baseline itself is short relative to the official 2026 reference.

## Suspected Causes
- Selected OpenStreetMap/Waymarked main-route geometry currently measures materially shorter than ATC 2026 official total length.
- Official ATC length uses the maintained annual official mileage baseline; Scout has no licensed official mile table or official centerline in this pack.
- Projection/geodesic method and vertical component do not explain most of the 91.7-mile delta.
- Open route source treatment may omit, simplify, or handle relocations, road walks, side-route roles, or endpoint details differently than the official measurement baseline.
- Davenport Gap to Damascus remains a regional detail gap even though the open route spine is continuous there.

## Explicit Comparisons
- OSM/Waymarked route geometry: primary_open_route_baseline_is_shorter_than_official_reference. Waymarked reports about 2106.762 miles and Scout local geodesic measurement reports 2106.163 miles, both near the current 2106.2-mile generated route.
- projection/measurement method: not_primary_cause. Geodesic measurement differs from the rounded RC1 length by -0.037 miles and from Waymarked by -0.599 miles.
- vertical/slope length: not_enough_to_close_delta. 100-meter 3D estimate is 2118.7 miles, adding about 12.5 miles.
- Approach Trail: excluded_by_design_not_delta_solution. Amicalola/Approach Trail remains contextual and excluded from main AT generated mileage by design.
- Baxter/Katahdin endpoint handling: open_route_candidate_requires_live_status_for_conditions. MVP6 endpoint follows the selected open main-route candidate; current Baxter/Katahdin status remains a live-check problem, not a static mileage correction.
- side routes, blue blazes, shelter spurs, alternates, and temporary detours: possible_contributor_but_not_force_matched. These are not folded into main-route generated miles unless present in the selected open AT main-route geometry.
- Davenport Gap to Damascus regional MVP gap: documented_yellow_data_depth_gap. RC1 has route continuity through this corridor but only base open-reference detail; this is a data-depth gap and must be disclosed separately from the official-length delta.
- official ATC annual mileage process: reference_only. The 2026 official length is used as a single reference value only. Scout does not copy official ATC mile tables or force-match generated milepoints to official mileage.

## Regional Segment Checks
- mvp1_springer_davenport: 0-234.7 generated miles (234.7 mi), status green.
- coverage_gap_davenport_damascus: 234.7-459 generated miles (224.3 mi), status yellow, regional detail gap.
- mvp2_virginia: 459-1006 generated miles (547 mi), status green.
- mvp3_midatlantic: 1006-1270 generated miles (264 mi), status green.
- mvp4_nj_ny_ct: 1270-1476 generated miles (206 mi), status green.
- mvp5_ma_vt_nh: 1476-1853 generated miles (377 mi), status green.
- mvp6_maine: 1853-2106.2 generated miles (253.2 mi), status green.

## Unresolved
- No license-reviewed NPS/APPA or ATC official centerline has been integrated for route correction.
- No licensed official ATC mile table has been ingested, and generated milepoints remain open-route estimates.
- Known annual relocations/detours have not been reconciled segment-by-segment against a licensed official source.

## AI Policy
- Say "generated/open-route mile" unless using an explicitly licensed official source.
- Do not present generated milepoints as official ATC miles.
- Surface the official reference, generated length, delta, and yellow alignment status when full-trail precision matters.
- Keep Davenport Gap to Damascus as a separate yellow regional-detail gap.
