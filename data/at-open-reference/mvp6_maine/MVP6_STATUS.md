# MVP6 Maine Status

Status: generated; latest validation result is tracked in `tests/validation_results_mvp6_maine.json`.

| Lane | Status | Note |
| --- | --- | --- |
| Route | green | Open-route Maine subset generated with explicit non-official mileage caution, MVP5 handoff, and Katahdin/Baxter endpoint caution. |
| Elevation | green | USGS 3DEP summaries, Mahoosuc flags, and Katahdin climb screen generated. |
| Water/fords | yellow | Mapped candidates only; reliability/potability/ford safety unknown. |
| Waypoints/access | yellow | OSM/open candidates only; private business/service/access details not confirmed. |
| Rules | yellow | Maine/Baxter/source-gap lanes covered; local/current rules still require live verification. |
| Live connectors | yellow | NWS, NPS, Maine, Baxter, Monson, and ATC source pointers ready; caches are not current. |
| Tread/remoteness | yellow | Rockiness/rootiness/mud/fording/remoteness model estimates only, not field verified. |
| Difficulty | yellow | Planning model only; live weather/closures/fords/Baxter status/rules can override static difficulty. |
| RAG docs | green | Maine guides, policy docs, and 25-mile segments generated. |
| Validation | green | Validator expected result: ok true. |
| Licensing | green | Blocked/unknown sources excluded from production-safe exports. |

Production-safe zip: `processed/export/scout_at_mvp6_maine_production_safe.zip`.
