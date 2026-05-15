
# APPA Route Candidate Review

Generated: 2026-05-15T00:00:00.000Z

APPA source: https://www.arcgis.com/home/item.html?id=71975f7fc14347c7a6c1059fdb593f91

## Status
- License status: unknown_review_required
- Production-safe: false
- Official milepoints: false
- Candidate status: review_only_not_production_safe

This is a quarantined route candidate. It is useful for alignment research, but it must not be used in production-safe exports or represented as official ATC mileage.

## Length Signals
- Official 2026 reference: 2197.9 mi
- Scout OSM RC1 route: 2106.2 mi
- APPA Length_Ft station length: 2180.348 mi
- APPA returned-geometry geodesic length: 2161.638 mi
- APPA Length_Ft vs Scout OSM: +74.148 mi
- APPA Length_Ft vs official reference: -17.552 mi

## Ordering / Stationing Method
Each APPA part is oriented from lower to higher nearest Scout generated 0.5-mile station. Parts are then sorted by APPA midpoint nearest Scout station. Review milepoints use APPA's `Length_Ft` cumulative length field for stationing, with coordinates interpolated along the returned geometry.

This is still review stationing. It is not proof that APPA's service field is the annual official ATC mileage method.

## Continuity Signals
- Parts: 3027
- Vertices: 690,117
- Max vertex segment: 0.3741 mi
- Max ordered-part gap: 0.867 mi
- Gaps over 0.02 mi: 1287
- Gaps over 0.1 mi: 906
- Gaps over 0.5 mi: 114
- Station overlaps by Scout snap: 235

## Endpoint Signals
- APPA start nearest Scout mile: 0 (0.1784 mi away)
- APPA end nearest Scout mile: 2106 (0.1812 mi away)
- APPA start distance to Scout start endpoint: 0.1784 mi
- APPA end distance to Scout end endpoint: 0.1812 mi

## Regional Summary
| Region | APPA parts | APPA Length_Ft mi | APPA geodesic mi |
| --- | ---: | ---: | ---: |
| mvp2_virginia | 778 | 559.867 | 553.865 |
| mvp5_ma_vt_nh | 335 | 401.351 | 396.513 |
| mvp6_maine | 224 | 272.073 | 266.942 |
| mvp3_midatlantic | 663 | 268.647 | 267.709 |
| mvp1_springer_davenport | 280 | 239.974 | 240.27 |
| coverage_gap_davenport_damascus | 319 | 228.697 | 228.045 |
| mvp4_nj_ny_ct | 428 | 209.738 | 208.294 |

## Next Review Work
- Visually inspect the largest continuity gaps and station overlaps.
- Confirm APPA license/use terms before any production use.
- Compare APPA endpoint treatment against official annual endpoint assumptions.
- Decide whether to rebuild Scout RC2 from APPA, OSM, or a hybrid source only after licensing and methodology review.
