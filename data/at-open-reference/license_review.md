# License Review

Last reviewed: 2026-05-13

## Safe Starting Sources

- USGS The National Map: public-domain federal data; attribution requested.
- USGS 3DEP: free and without use restrictions; attribution requested.
- NPS official land-manager pages: use only factual rule summaries with source
  URLs and timestamps; do not package full page snapshots.
- USFS official land-manager pages: use only factual rule summaries with source
  URLs and timestamps; check current forest orders before field advice.
- NOAA/NWS API: allowed API source for forecasts, alerts, observations, and
  other weather data. Use as a live connector and preserve timestamps.
- NPS API: authoritative NPS API for apps, maps, and websites. Use API-key
  access, cache responsibly, and preserve timestamps.
- USFS Geodata Clearinghouse: public federal GIS source, but each layer metadata
  should still be reviewed before processing.

## License-Sensitive Sources

- OpenStreetMap is ODbL. Keep OSM-derived data separated and labeled
  `open_license_share_alike`.
- OSM-derived route, shelter, corridor POI, access, and settlement candidates
  must stay in the ODbL/share-alike lane until downstream product exposure is
  reviewed.
- State land-manager pages and Baxter State Park pages are used as cited factual
  rule summaries only. Keep source URLs and last-checked dates visible, and avoid
  full-page copying.
- PASDA/NPS shelter and centerline candidates need exact dataset metadata review
  before they can enter `processed/`.

## Blocked Without Permission

Commercial guide apps, guidebooks, ATC web resources, and private PDFs are
blocked by default. This pack treats them as link/check targets only.

## Scout Answer Rules

- Generated milepoints are never official ATC miles.
- GIS water candidates are not reliable or potable by default.
- Current-condition claims require live retrieval or a visible source gap.
- Camping, permit, fee, and access rules must include last-checked dates and
  "verify with land manager" language when uncertainty remains.
