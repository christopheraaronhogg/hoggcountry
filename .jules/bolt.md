## 2024-05-23 - Optimizing Linear Lookups in Game Loop
**Learning:** `TrailData.ts` used O(N) searches (`reduce`, `find`) on static data arrays (`SHELTERS`, `TOWNS`) which were called every frame in `GameScene` via `getElevationAtMile`. Replacing these with O(log N) binary search significantly reduces overhead for large datasets (260+ items).
**Action:** Always check data access patterns in `update` loops. Prefer sorted data and binary search for static game data lookups. Also, avoid `Distance.Between` in hot paths.
