## 2024-05-23 - Phaser Particle Recreation Loop
**Learning:** Recreating `Phaser.GameObjects.Particles.ParticleEmitter` instances inside a recurring loop (like `offlineTick` running at 10Hz) causes significant performance degradation due to object allocation and garbage collection churn.
**Action:** Always cache the active state (e.g., `currentVisualWeather`) and only destroy/recreate effects when the state actually changes. Ensure `onResize` handlers invalidate this cache to force correct updates when dimensions change.
