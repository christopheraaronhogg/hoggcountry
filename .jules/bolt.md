## 2024-03-20 - Binary Search for Trail Data
**Learning:** The trail data (Shelters, Landmarks, etc.) is static and sorted by mile, but lookups were O(N) using `.find()` or `.reduce()`. This is fine for small N, but since these are "hot" functions potentially called in game loops or frequent UI updates, O(log N) provides significant speedup (~2-5x for N=200-300).
**Action:** When dealing with static sorted game data (like waypoints or inventory), always prefer binary search over linear scan for lookups. Verified with micro-benchmark before committing.
