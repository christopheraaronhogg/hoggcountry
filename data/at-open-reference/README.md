# Scout AT Open Reference Pack

This directory is the legal and technical staging area for Scout's Appalachian
Trail reference corpus.

Scout can use this pack for route grounding, conservative water/camping/resupply
answers, RAG snippets, and later local-first phone bundles. The pack is not a
place for copied guidebook data, commercial waypoint databases, ATC web text, or
unclear-license downloads.

## Required Files

- `source_manifest.yaml` records every source before use.
- `blocked_sources.md` lists sources that cannot be packaged without permission.
- `license_review.md` explains allowed and blocked use.
- `attribution.md` contains attribution text for downstream Scout surfaces.
- `data_quality_report.md` tracks current corpus completeness.
- `schemas/` defines record contracts.
- `scripts/validate-at-open-reference.mjs` enforces source and record rules.
- `tests/at-open-reference.test.mjs` runs the validator in the repo test suite.

## Ingestion Rules

Every processed record must include source provenance, license status,
confidence, and cautious answer guidance where safety or current conditions are
involved.

Generated milepoints are never official ATC miles. Water candidates from open GIS
are never reliable or potable by default. Live/current condition claims must come
from live connectors or include a clear source gap.

## Generation

Current generated lanes:

```bash
node data/at-open-reference/scripts/fetch-waymarked-at-route.mjs
node data/at-open-reference/scripts/build-open-route-milepoints.mjs --input data/at-open-reference/raw/osm/waymarked_relation_156553.json
node data/at-open-reference/scripts/build-water-candidates.mjs
node data/at-open-reference/scripts/build-waypoint-candidates.mjs
node data/at-open-reference/scripts/build-elevation-samples.mjs
node data/at-open-reference/scripts/build-elevation-rag-docs.mjs
node data/at-open-reference/scripts/fetch-osm-corridor-features.mjs
node data/at-open-reference/scripts/build-osm-corridor-candidates.mjs
node data/at-open-reference/scripts/build-camping-rules.mjs
```

The current OSM-derived route candidate is useful as a legally separable open
baseline, but its measured length is materially shorter than the 2026 official
calibration reference. Scout must keep the generated-mile caution visible.

OSM corridor POIs are filtered and compacted after fetch. The packaged raw file
contains only accepted source elements plus provenance metadata, not a full
Overpass snapshot.
