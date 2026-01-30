## 2024-05-23 - Replaced Euclidean Distance with Squared Distance in Game Loop
**Learning:** `Phaser.Math.Distance.Between` uses `Math.sqrt` which is computationally expensive when called hundreds of times per frame in the main game loop (`update`).
**Action:** Always prefer `Phaser.Math.Distance.Squared` for collision detection and proximity checks where the exact distance value is not needed, only comparison against a threshold. Square the threshold value instead of taking the root of the distance.
