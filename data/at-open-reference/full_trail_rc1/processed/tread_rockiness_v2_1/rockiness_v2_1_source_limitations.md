
# Rockiness V2.1 Source Limitations

- Bounded STAC/catalog extraction proves that source metadata exists for a corridor/window; it does not prove rockiness at a specific step.
- DEM raster pixels and LiDAR points are not sampled in V2.1. lidar_available remains false on records until point-cloud evidence is extracted.
- SSURGO/gSSURGO remains a reviewed future lane. soil_stoniness_score must remain null until bounded soil attributes are joined.
- OSM surface/tread signals remain ODbL-derived and unevenly populated.
- No Rockiness V2.1 record is field verified or current-conditions verified; in answer language say it is not field verified.
