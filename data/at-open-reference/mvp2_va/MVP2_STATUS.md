# MVP2 Virginia Status

Status: generated; latest validation result is tracked in `tests/validation_results_mvp2_va.json`.

| Lane | Status | Note |
| --- | --- | --- |
| Route | green | Open-route VA subset generated with explicit non-official mileage caution. |
| Elevation | green | USGS 3DEP summaries generated. |
| Water | yellow | Mapped candidates only; reliability/potability unknown. |
| Waypoints | yellow | OSM candidates only; private business/service details not confirmed. |
| Rules | yellow | Major source lanes covered; local/current rules still require live verification. |
| Live connectors | yellow | Source pointers ready; caches are not current. |
| Tread | yellow | Model estimates only, not field verified. |
| RAG docs | green | VA guide, policy docs, and 25-mile segments generated. |
| Validation | green | Validator expected result: ok true. |
| Licensing | green | Blocked/unknown sources excluded from production-safe exports. |

Production-safe zip: `processed/export/scout_at_mvp2_va_production_safe.zip`.
