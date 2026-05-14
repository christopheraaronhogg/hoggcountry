# MVP2 Virginia Prompt-To-Artifact Checklist

Generated: 2026-05-14

| Requirement | Evidence | Validation |
| --- | --- | --- |
| License-safe source rules; no FarOut/A.T. Guide/Data Book/Companion/AllTrails/Gaia/Hiking Project/copied ATC corpus data | `source_manifest.yaml`, `license_review.md`, `blocked_sources.md`, `attribution.md` | Validator checks blocked source IDs, OSM ODbL labeling, and production export exclusions. |
| Full Virginia route and generated miles from Damascus/TN-VA lane to Harpers Ferry approach | `processed/route/mvp2_va_route.geojson`, `processed/route/route_notes.md`, `processed/milepoints/*.geojson` | Validator checks 547.0 generated VA miles, global estimates, official:false, MVP1/WV-MD linkage notes. |
| USGS 3DEP elevation, 5/10 mile summaries, climbs/descents, high/low, steep descents | `processed/elevation/*` | Validator checks source IDs, sample counts, summaries, major climbs/descents, high/low, steep descents, and model cautions. |
| Water candidates with reliability and potability unknown unless verified | `processed/water/*` | Validator checks mapped water candidate wording, unknown reliability/potability, null human verification. |
| Waypoints/resupply candidates and private-business caution | `processed/waypoints/*` | Validator checks shelters/campsites/privies/parking/trailheads/roads/vistas/towns, source metadata, and no-guidebook service cautions. |
| Camping/permit/fee/food/dog/fire rules by land manager | `processed/rules/*`, `rag_docs/rules/camping_permit_fee_mvp2_va.md` | Validator checks GWJ, Mount Rogers, Grayson Highlands, Blue Ridge Parkway, Shenandoah, Harpers Ferry approach, and source-gap records. |
| Live connectors and ATC pointer-only policy | `processed/live_conditions/*`, `rag_docs/policies/weather_live_conditions.md` | Validator checks live terms for closures, fire, flooding, storm damage, bear activity, snow/ice, permit changes, dangerous weather, and ATC pointer-only handling. |
| Tread/rockiness at 0.1/1/5 miles with pace penalties | `processed/tread_rockiness/*`, `schemas/tread_rockiness.schema.json` | Validator checks score range, exact pace multipliers, field_verified:false, SSURGO/geology/user-report caveats. |
| VA RAG docs and >=50 behavior questions | `rag_docs/*`, `tests/mvp2_va_behavior_questions.json` | Validator checks metadata/file alignment, segment docs, caution language, and behavior coverage. |
| Report, status dashboard, production-safe JSON/zip export | `data_quality_report_mvp2_va.md`, `MVP2_STATUS.md`, `processed/export/*` | Validator writes `tests/validation_results_mvp2_va.json` and repo tests run it. |
