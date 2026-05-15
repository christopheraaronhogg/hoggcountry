
# APPA Vs Scout OSM Segment Comparison

Generated: 2026-05-15T00:00:00.000Z

APPA source: https://www.arcgis.com/home/item.html?id=71975f7fc14347c7a6c1059fdb593f91

## Status
- License status: unknown_review_required
- Production-safe: false
- This is a diagnostic alignment screen, not a route replacement.

## Method
Each APPA centerline feature is measured and assigned a midpoint, then snapped to the nearest Scout generated 0.5-mile point. Lengths are aggregated into 25-mile Scout bins. This tells us where APPA's own Length_Ft field adds or loses mileage against the current OSM/Waymarked spine.

Limitation: whole features are assigned to one bin by midpoint. Before route replacement, APPA geometry should be split by the Scout/selected route stationing line instead of assigned whole-feature.

## Totals
- Official 2026 reference: 2197.9 mi
- Scout OSM RC1 route: 2106.2 mi
- APPA Length_Ft total: 2180.348 mi
- APPA geodesic total: 2161.638 mi
- APPA Length_Ft vs Scout OSM: +74.148 mi
- APPA Length_Ft vs official reference: -17.552 mi
- APPA features snapped farther than 1 mi from Scout route: 0

## Top APPA Additions Vs Scout OSM
| Scout bin | APPA features | Scout mi | APPA Length_Ft mi | Delta mi | Max snap mi | Regions |
| --- | ---: | ---: | ---: | ---: | ---: | --- |
| 650-675 | 55 | 25 | 31.814 | 6.814 | 0.393 | mvp2_virginia |
| 1850-1875 | 26 | 25 | 30.171 | 5.171 | 0.186 | mvp6_maine, mvp5_ma_vt_nh |
| 400-425 | 41 | 25 | 28.777 | 3.777 | 0.188 | coverage_gap_davenport_damascus |
| 2025-2050 | 15 | 25 | 28.441 | 3.441 | 0.191 | mvp6_maine |
| 1950-1975 | 23 | 25 | 28.234 | 3.234 | 0.231 | mvp6_maine |
| 1775-1800 | 17 | 25 | 28.218 | 3.218 | 0.228 | mvp5_ma_vt_nh |
| 775-800 | 24 | 25 | 28.117 | 3.117 | 0.232 | mvp2_virginia |
| 1925-1950 | 30 | 25 | 28.039 | 3.039 | 0.225 | mvp6_maine |
| 1650-1675 | 21 | 25 | 28.037 | 3.037 | 0.219 | mvp5_ma_vt_nh |
| 1600-1625 | 29 | 25 | 27.93 | 2.93 | 0.232 | mvp5_ma_vt_nh |
| 150-175 | 34 | 25 | 27.749 | 2.749 | 0.231 | mvp1_springer_davenport |
| 2000-2025 | 27 | 25 | 27.547 | 2.547 | 0.211 | mvp6_maine |

## Top APPA Losses Vs Scout OSM
| Scout bin | APPA features | Scout mi | APPA Length_Ft mi | Delta mi | Max snap mi | Regions |
| --- | ---: | ---: | ---: | ---: | ---: | --- |
| 425-450 | 38 | 25 | 22.649 | -2.351 | 0.232 | coverage_gap_davenport_damascus |
| 750-775 | 36 | 25 | 23.529 | -1.471 | 0.203 | mvp2_virginia |
| 975-1000 | 30 | 25 | 23.597 | -1.403 | 0.216 | mvp2_virginia |
| 700-725 | 44 | 25 | 23.844 | -1.156 | 0.205 | mvp2_virginia |
| 1975-2000 | 20 | 25 | 23.958 | -1.042 | 0.182 | mvp6_maine |
| 125-150 | 24 | 25 | 24.101 | -0.899 | 0.192 | mvp1_springer_davenport |
| 2050-2075 | 10 | 25 | 24.116 | -0.884 | 0.192 | mvp6_maine |
| 1375-1400 | 29 | 25 | 24.245 | -0.755 | 0.22 | mvp4_nj_ny_ct |
| 375-400 | 41 | 25 | 24.264 | -0.736 | 0.188 | coverage_gap_davenport_damascus |
| 825-850 | 23 | 25 | 24.309 | -0.691 | 0.228 | mvp2_virginia |
| 250-275 | 37 | 25 | 24.33 | -0.67 | 0.209 | coverage_gap_davenport_damascus |
| 1525-1550 | 26 | 25 | 24.361 | -0.639 | 0.22 | mvp5_ma_vt_nh |

## Regional Summary
| Region | Scout mi | APPA Length_Ft mi | Delta mi | APPA features | Max snap mi |
| --- | ---: | ---: | ---: | ---: | ---: |
| mvp5_ma_vt_nh | 377 | 401.351 | 24.351 | 335 | 0.239 |
| mvp6_maine | 253.2 | 272.073 | 18.873 | 224 | 0.235 |
| mvp2_virginia | 547 | 559.867 | 12.867 | 778 | 0.393 |
| mvp1_springer_davenport | 234.7 | 239.974 | 5.274 | 280 | 0.231 |
| mvp3_midatlantic | 264 | 268.647 | 4.647 | 661 | 0.246 |
| coverage_gap_davenport_damascus | 224.3 | 228.697 | 4.397 | 319 | 0.232 |
| mvp4_nj_ny_ct | 206 | 209.738 | 3.738 | 428 | 0.24 |

## Initial Read
- APPA closes most of Scout's current OSM mileage gap: +74.148 miles versus OSM.
- APPA remains 17.552 miles short of the 2026 official reference on its Length_Ft field.
- Inspect the top positive bins first; those are where APPA adds the most mileage against the current Scout spine.
- Keep APPA quarantined until licensing and route-measurement methodology are resolved.
