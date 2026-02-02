## 2024-05-23 - Phaser Render Optimization
**Learning:** Redrawing `Graphics` objects (clear + fillPath) every frame in the `update` loop is a significant performance bottleneck.
**Action:** Use 'retained mode' for simple shapes: draw once in `create` (relative to 0,0), then just update `x`, `y`, and `visible` in `update`.

## 2024-05-23 - Build Artifacts in Repo
**Learning:** This repo tracks build artifacts (`public/game/`). Running local builds modifies them.
**Action:** Always revert changes to `public/game/` before submitting optimization PRs to keep the diff clean.
