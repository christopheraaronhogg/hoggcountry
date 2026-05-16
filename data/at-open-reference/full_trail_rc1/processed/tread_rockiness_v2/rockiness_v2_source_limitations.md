
# Rockiness V2 Source Limitations

- OpenTrail and OpenLongTrails/Grit remain review-only sources. Do not scrape or package their data without a compatible public license/API or written permission.
- 100-meter USGS 3DEP/EPQS samples are good for broad local relief and grade variability, but they cannot see every rock, root, bog bridge, slab, boulder, or eroded tread detail.
- OSM surface/smoothness/sac_scale tags are ODbL-derived and unevenly populated. Missing tags do not mean smooth tread.
- gSSURGO/SSURGO is a soil/material proxy, not a trail-surface observation. The RC1 file intentionally leaves soil_stoniness_score null until bounded corridor attributes are extracted.
- USGS 3DEP LiDAR is reviewed for future calibration, but RC1 does not stream EPT/point-cloud records. lidar_available must stay false unless future extraction evidence exists.
- User reports are absent from the open RC1 pack. Do not invent field verification.
