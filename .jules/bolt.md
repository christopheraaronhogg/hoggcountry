## 2026-01-17 - Phaser Texture Generation Optimization
**Learning:** Phaser 3 `Graphics` generation of large pixel-art assets is significantly slower (overhead of command buffer and replay) than direct Canvas 2D `fillRect` operations.
**Action:** For procedural pixel-art generation in Phaser, prefer `textures.createCanvas()` and `context.fillRect()` over `make.graphics()`.
