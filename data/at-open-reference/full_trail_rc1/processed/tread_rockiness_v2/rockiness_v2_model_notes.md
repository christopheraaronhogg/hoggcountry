
# Rockiness V2 Model Notes

Rockiness V2 is a source-aware planning screen. It improves the old 0-5 tread layer by using the full-trail 100-meter USGS 3DEP/EPQS elevation baseline to estimate local grade variability around each generated 0.1-mile point, then blending that with nearby OSM-derived tread/surface signals where present.

Current weights are normalized from available safe signals:
- 55% 100-meter DEM micro-roughness.
- 25% OSM-derived surface/smoothness/sac_scale/tread signal where present.
- 20% gSSURGO/SSURGO soil stoniness when a bounded extraction exists; for RC1 this lane is reviewed but not yet extracted, so it is null and receives no weight.
- Existing tread v1 contributes only as a compatibility fallback when soil data is absent.

No Rockiness V2 record is field verified. In answer text, treat Rockiness V2 as not field verified unless a future trusted user/official source writes explicit record-level proof. LiDAR and gSSURGO are reviewed source lanes, not populated evidence, until future bounded extractors write record-level proof.
