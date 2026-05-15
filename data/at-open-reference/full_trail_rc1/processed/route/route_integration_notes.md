
# Full AT Route RC1 Integration Notes

Generated: 2026-05-14T00:00:00.000Z

Scout RC1 stitches MVP1-MVP6 into one full-trail open reference layer using the base OpenStreetMap relation 156553 route geometry as the continuity spine.

## Source And License
- Full route geometry source: OpenStreetMap relation 156553 via the existing Scout open route candidate.
- License: ODbL / open_license_share_alike. Attribute OpenStreetMap contributors.
- Official status: false. Generated miles are not official ATC mileage.
- Measured RC1 length: 2106.2 generated miles.
- 2026 official reference length used for comparison only: 2197.9 miles.
- Official reference source: https://appalachiantrail.org/experience/hike-the-trail/at-basics/
- Length delta: -91.7 miles (-4.2%).
- Alignment status: yellow_unresolved_open_route_delta.

## Regional Stitch
- mvp1_springer_davenport: 0-234.7 generated miles, status green, MVP1 Springer/Amicalola context to Davenport Gap.
- coverage_gap_davenport_damascus: 234.7-459 generated miles, status yellow, Davenport Gap to Damascus/TN-VA baseline open-route gap filler.
- mvp2_virginia: 459-1006 generated miles, status green, MVP2 Virginia.
- mvp3_midatlantic: 1006-1270 generated miles, status green, MVP3 WV/MD/PA Mid-Atlantic.
- mvp4_nj_ny_ct: 1270-1476 generated miles, status green, MVP4 NJ/NY/CT.
- mvp5_ma_vt_nh: 1476-1853 generated miles, status green, MVP5 MA/VT/NH.
- mvp6_maine: 1853-2106.2 generated miles, status green, MVP6 Maine/Baxter/Katahdin.

## Known Gap
MVP1 ends at Davenport Gap / I-40 around generated mile 234.7. MVP2 starts at the TN/VA / Damascus anchor around generated mile 459.0. RC1 therefore uses the base open full-route geometry and base public/open datasets for that Davenport Gap to Damascus corridor and marks it yellow. It must not be represented as having the same regional MVP depth as the rest of the trail.

## Endpoint Handling
The Appalachian Trail main route is the primary geometry. Amicalola/Approach Trail context remains contextual source material in MVP1 and is not included as full-route main AT mileage.

Baxter/Katahdin/Hunt Trail handling comes from MVP6 as an open-route endpoint treatment. Current Baxter permits, Katahdin trail opening/closing, summit status, parking, camping, weather, and access must be live-checked before advice.

## AI Cautions
- Generated miles are estimated from open route geometry and are not official ATC miles.
- The full-route open geometry is materially shorter than the 2026 official reference and remains a planning corpus, not field navigation.
- Scout must say "generated/open-route mile" unless an explicitly licensed official source is being used.
- Static docs cannot answer current closures, weather, permits, ford safety, or Katahdin status.
- Water/fords from maps are candidates only; reliability, potability, and safe fordability remain unknown unless timestamped verified data exists.
