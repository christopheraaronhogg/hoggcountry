
# Rockiness V2.1 Model Notes

Rockiness V2.1 keeps the RC1 Rockiness V2 score stable, then adds bounded source-extraction evidence from production-safe sources:
- 3DEP Seamless DEM STAC item metadata for the full A.T. corridor and high-priority calibration windows.
- USGS 3DEP LiDAR catalog metadata for AT-state items intersecting calibration windows.
- Existing ODbL OSM surface/tread signals from RC1.
- gSSURGO/SSURGO remains reviewed but not extracted in V2.1, so soil_stoniness_score stays null.

This is still a model screen and not field verified. V2.1 does not download DEM rasters, does not sample DEM raster pixels, does not stream LiDAR EPT tiles, does not join SSURGO attributes, and does not field-verify tread. Use it to improve source transparency and difficulty confidence, not to promise exact footing.
