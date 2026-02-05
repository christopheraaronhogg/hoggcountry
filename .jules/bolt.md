## 2024-05-22 - Phaser Collision Optimization
**Learning:** Phaser `Distance.Between` uses `Math.sqrt` which is expensive in hot loops. For collision checks against a threshold, use `Distance.Squared` and compare against the squared threshold.
**Action:** Always prefer `Distance.Squared` for distance comparisons in `update()` loops.
