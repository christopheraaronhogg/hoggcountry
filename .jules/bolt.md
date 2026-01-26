## 2025-02-23 - [Phaser Object Recreation in Update Loop]
**Learning:** Found a severe performance bottleneck where particle emitters and sprites were being destroyed and recreated every single frame (60fps) in the `update` loop via `updateWeatherEffects`. This happens because the method had no check for state changes and was called unconditionally.
**Action:** Always check state equality before applying expensive visual updates in the game loop. Use a `lastState` tracker to return early.
