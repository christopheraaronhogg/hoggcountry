## 2025-05-23 - Phaser Collision Optimization
**Learning:** In Phaser `update` loops, collision checks using `Phaser.Math.Distance.Between` are expensive due to square roots. Replacing them with `Phaser.Math.Distance.Squared` and comparing against the squared threshold significantly reduces CPU load per frame.
**Action:** Always prefer squared distance checks for proximity/collision logic in high-frequency loops.
