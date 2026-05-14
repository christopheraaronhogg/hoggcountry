# MVP3 Mid-Atlantic Tread / Rockiness Model Notes

Score buckets:
- 0 smooth, 1 mostly smooth, 2 moderate rocks/roots, 3 rocky/uneven, 4 very rocky, 5 severe rocks/boulders/scramble.

Pace penalties:
- 0 = 1.00x
- 1 = 1.03x
- 2 = 1.08x
- 3 = 1.15x
- 4 = 1.25x
- 5 = 1.40x

Signals used in MVP3:
- USGS 3DEP slope and local relief proxies.
- OpenStreetMap (OSM) surface/smoothness/trail_visibility/sac_scale are allowed source lanes, but MVP3 does not have a field-verified route-segment tag join for every mile.

Signals documented but not ingested into MVP3 scores:
- USDA SSURGO/gSSURGO rock fragments, shallow bedrock, rock outcrop, stony/bouldery terms.
- Geology, treated as weak signal only.
- Trusted user reports, if available later under user-submitted/licensed provenance.

No MVP3 tread score is field_verified. Each score is not field_verified and must be described as a model estimate.
