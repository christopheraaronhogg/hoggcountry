# MVP1 Prompt-To-Artifact Checklist

Generated: 2026-05-14

| Requirement | Evidence | Validation |
| --- | --- | --- |
| License-safe source rules; no FarOut/A.T. Guide/Data Book/Companion/AllTrails/Gaia/Hiking Project/copied ATC corpus data | `source_manifest.yaml`, `license_review.md`, `blocked_sources.md`, `attribution.md` | Validator checks allowed license statuses, blocked source IDs, and OSM ODbL labeling. |
| Route and generated miles from Springer/Amicalola lane to Davenport Gap | `processed/route/mvp1_route.geojson`, `processed/route/route_notes.md`, `processed/milepoints/*.geojson` | Validator checks 234.7 generated miles, official:false, Amicalola source gap, Davenport endpoint, and generated-mile cautions. |
| Elevation and climb/descent summaries from USGS 3DEP where possible | `processed/elevation/*.json`, `processed/elevation/elevation_profile.geojson` | Validator checks USGS source IDs, sample counts, summaries, steep sections, major climbs, and model-derived cautions. |
| Water candidates with reliability and potability unknown unless verified | `processed/water/water_candidates.json`, `processed/water/water_crossings.geojson`, `processed/water/water_confidence_notes.md` | Validator checks >=100 candidates, unknown reliability/potability, null human verification, and "mapped water candidate" wording. |
| Shelters, campsites, privies, parking, road crossings, trailheads, vistas, towns/resupply candidates | `processed/waypoints/*.json` | Validator checks minimum records, source/license/confidence/timestamps, state lanes, and no-guidebook resupply cautions. |
| Camping, permit, fee, food-storage rules by land manager | `processed/rules/rules_by_land_manager.json`, `processed/rules/rules_by_state.json`, `rag_docs/rules/camping_permit_fee_mvp1.md` | Validator checks Amicalola, Chattahoochee-Oconee, Nantahala, GRSM, and Cherokee/Davenport lane plus current-rule cautions. |
| Live conditions policy for closures, detours, fire, flooding, storm damage, bear activity, snow/ice, permit changes, dangerous weather | `processed/live_conditions/*.json`, `rag_docs/policies/weather_live_conditions.md` | Validator checks required live-condition terms and source metadata. |
| Tread/rockiness model at 0.1/1/5 miles with 0-5 scores and pace penalties | `processed/tread_rockiness/*.json`, `processed/tread_rockiness/model_notes.md`, `schemas/tread_rockiness.schema.json` | Validator checks score range, exact pace multipliers, field_verified:false, and not-field-verified cautions. |
| RAG docs for GA, NC/TN, 25-mile segments, water/navigation/weather/tread policies | `rag_docs/state_guides/*.md`, `rag_docs/segment_guides/*.md`, `rag_docs/policies/*.md`, `rag_docs/rag_doc_metadata.json` | Validator checks >=15 docs, metadata/file alignment, caution language, and terminal 225-235 segment. |
| Schemas, validators, behavior questions, report, production-safe export, status dashboard | `schemas/*.schema.json`, `run_mvp1_validation.py`, `tests/mvp1_behavior_questions.json`, `data_quality_report_mvp1.md`, `processed/export/*`, `MVP1_STATUS.md` | Validator writes `tests/validation_results_mvp1.json` and the repo test suite runs it. |

Done standard: validation passes or failures are explicitly documented, and Scout answers MVP1 questions with source, license, confidence, generated-mile, water, live-condition, and model-confidence cautions.
