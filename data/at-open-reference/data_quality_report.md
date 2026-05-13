# Data Quality Report

Last updated: 2026-05-13

## Current Status

This is a scaffolded reference pack. It currently contains source policy,
license review notes, schemas, and validation gates. It does not yet contain a
complete processed Appalachian Trail route, generated milepoints, elevation
profiles, water candidates, waypoint candidates, or camping-rule corpus.

## Completeness

- Source manifest: started.
- Blocked-source policy: started.
- Route baseline: not generated.
- Milepoints: not generated.
- Elevation: not generated.
- Water candidates: not generated.
- Waypoints/access/towns: not generated.
- Rules/permits/fees: not generated.
- Live connectors: app runtime has NWS/official-source lanes; this pack has not
  exported connector metadata yet.
- RAG docs: policy docs only.

## Known Risks

- OSM-derived data has share-alike obligations and must stay separated.
- PASDA/NPS candidate datasets need metadata/license review before use.
- Legacy repo scripts outside this pack may reference guidebook-derived data;
  they are not approved inputs for this open reference pack.
