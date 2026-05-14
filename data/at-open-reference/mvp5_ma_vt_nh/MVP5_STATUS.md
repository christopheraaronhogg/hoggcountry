# MVP5 MA/VT/NH Status

Status: generated; latest validation result is tracked in `tests/validation_results_mvp5_ma_vt_nh.json`.

| Lane | Status | Note |
| --- | --- | --- |
| Route | green | Open-route MA/VT/NH subset generated with explicit non-official mileage caution and MVP4/MVP6 handoffs. |
| Elevation | green | USGS 3DEP summaries generated. |
| Water | yellow | Mapped candidates only; reliability/potability unknown. |
| Waypoints | yellow | OSM candidates only; private business/service details not confirmed. |
| Rules | yellow | Major source lanes covered; local/current rules still require live verification. |
| Live connectors | yellow | Source pointers ready; caches are not current. |
| Tread | yellow | Rockiness/rootiness/mud model estimates only, not field verified. |
| Difficulty | yellow | Planning model only; live weather/closures/rules can override static difficulty. |
| RAG docs | green | MA/VT/NH guides, policy docs, and 25-mile segments generated. |
| Validation | green | Validator expected result: ok true. |
| Licensing | green | Blocked/unknown sources excluded from production-safe exports. |

Production-safe zip: `processed/export/scout_at_mvp5_ma_vt_nh_production_safe.zip`.
