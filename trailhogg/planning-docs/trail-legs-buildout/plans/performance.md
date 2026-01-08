# Performance Budget: Trail Legs Build-Out

**Project:** Trail Legs Mobile Game
**Date:** 2026-01-07
**Consultant:** Claude Performance Consultant

---

## Executive Summary

The Trail Legs build-out targets a challenging mobile gaming scenario: 60fps sustained performance on 3-year-old devices with offline-first architecture. After reviewing the PRD requirements and current codebase, I have identified several performance risks and optimization opportunities that should be addressed during implementation.

The current prototype has a reasonable foundation but lacks critical mobile optimizations. The game loop runs at 100ms ticks (10 tps) which is appropriate for simulation but requires careful frame management on the render side. The main concerns are: (1) no object pooling for weather particles and game objects, (2) procedurally generated assets at runtime which should become texture atlases, (3) UI text objects created/destroyed per frame causing garbage collection pressure, and (4) no asset caching strategy for offline/PWA operation.

Achieving the PRD targets (60fps, <50MB bundle, <3s load, <200MB memory) is feasible but requires disciplined implementation of the recommendations below. The Phaser 3.90 Mobile Pipeline upgrade is the single highest-impact change available.

---

## Performance Score: 6/10 (Current Prototype)

| Area | Score | Notes |
|------|-------|-------|
| Mobile FPS Target | 5/10 | Missing Mobile Pipeline, object pooling |
| Memory Management | 5/10 | GC pressure from UI updates, no pooling |
| Asset Loading | 4/10 | Runtime texture generation, no atlases |
| Network Efficiency | 7/10 | Colyseus delta sync is efficient |
| Offline Capability | 3/10 | Basic fallback only, no IndexedDB |
| Bundle Size | 8/10 | Minimal dependencies currently |

---

## 1. Mobile Performance Targets

### PRD Requirements

| Metric | Target | Critical Threshold | Current Estimate |
|--------|--------|-------------------|------------------|
| Frame Rate | 60 fps sustained | 30 fps minimum | Unknown (untested) |
| Input Latency | <100ms | <150ms | ~16-32ms (keyboard) |
| Load Time | <3 seconds | <5 seconds | ~1-2s (no assets) |
| Memory Usage | <200MB peak | <250MB | ~50-80MB (minimal assets) |
| CPU Usage | <30% sustained | <50% | Unknown |
| App Bundle Size | <50MB | <100MB | ~2MB (no assets) |

### Target Device Baseline

For "3-year-old mid-range device" (circa 2023):
- **iOS:** iPhone 11 / SE 2nd Gen (A13 Bionic, 4GB RAM)
- **Android:** Samsung Galaxy A53 / Pixel 6a (Snapdragon 778G / Tensor, 6GB RAM)

These devices handle WebGL well but are sensitive to:
- Garbage collection pauses
- Overdraw and fill rate limits
- Large texture uploads
- Excessive draw calls (>100 per frame)

---

## 2. Phaser 3 Mobile Optimization

### Critical: Upgrade to Phaser 3.90.0

**Current Version:** 3.70.0
**Target Version:** 3.90.0 "Tsugumi"

The Mobile Pipeline introduced in Phaser 3.60 provides automatic optimization for iOS/Android:

| Feature | Benefit | Impact |
|---------|---------|--------|
| Mobile Pipeline | Auto-enabled on mobile, reduces buffer operations | 20-40% FPS improvement |
| Reduced sub-buffer allocation | Eliminates blocking I/O during render | Smoother frame times |
| WebGL context loss handling | Better recovery from background/foreground | Crash prevention |

**Action Required:** Update package.json from `"phaser": "^3.70.0"` to `"phaser": "^3.90.0"`

### Render Pipeline Configuration

```
Recommended Phaser Config Additions (main.ts):
- type: Phaser.WEBGL (explicit, not AUTO)
- antialias: false (for pixel art)
- powerPreference: 'high-performance'
- batchSize: 4096 (default is 4096, consider reduction on low-end)
- maxTextures: 8 (reduce from default 16 for memory)
```

### Current Issues Identified

| Issue | Location | Impact | Priority |
|-------|----------|--------|----------|
| AUTO renderer type | main.ts:8 | May select Canvas on capable WebGL devices | P1 |
| No explicit WebGL settings | main.ts config | Missing mobile optimizations | P1 |
| Physics enabled but unused | main.ts:28-32 | CPU overhead for idle physics world | P2 |
| No frame rate cap | main.ts config | Wastes battery on 120Hz displays | P2 |

---

## 3. Asset Loading Strategy

### Current State (BootScene.ts)

Assets are generated procedurally at runtime using `Graphics.generateTexture()`. This is acceptable for prototyping but problematic for production:

**Problems:**
1. CPU time spent generating textures on every load
2. Generated textures cannot be cached by service worker
3. No texture atlas benefits (separate draw calls per texture)
4. Quality limited to programmatic shapes

### Recommended: Texture Atlas Architecture

| Atlas | Contents | Max Size | Format |
|-------|----------|----------|--------|
| `gameplay.png` | Hiker, trees, blazes, shelter, water | 1024x1024 | PNG-8 (palette) |
| `ui.png` | Buttons, bars, icons, frames | 512x512 | PNG-8 (palette) |
| `weather.png` | Rain drops, fog particles, lightning | 256x256 | PNG-8 with alpha |
| `terrain.png` | Trail tiles, ground tiles, rocks | 512x512 | PNG-8 (palette) |

**Benefits:**
- Single draw call per atlas
- Service worker cacheable
- Faster load (one HTTP request per atlas)
- GPU memory efficiency

### PRD Asset Size Budget

| Category | Budget | Notes |
|----------|--------|-------|
| Sprites (PNG) | 2MB | 4 atlases @ ~500KB each |
| Audio (MP3/OGG) | 5MB | Compressed ambient loops |
| Fonts (WOFF2) | 200KB | 1-2 pixel fonts |
| Code (JS) | 3MB | Phaser + Colyseus + game code |
| **Total Initial** | **10MB** | PRD web target |

### Lazy Loading Strategy

```
Boot Phase (Required):
- Core UI atlas
- Hiker sprite
- Loading bar assets
- ~500KB

Menu Phase (Preload):
- Full gameplay atlas
- Menu audio
- ~1MB

Game Phase (Preload):
- Weather effects atlas
- Terrain tiles
- Ambient audio
- ~2MB

Deferred (Load on demand):
- Town/shelter detailed art
- Achievement badges
- Non-critical audio variations
```

### Service Worker Caching

For PWA/offline support:

| Asset Type | Cache Strategy | TTL |
|------------|---------------|-----|
| Static assets (atlas, audio) | Cache-first | Indefinite |
| HTML/JS bundles | Stale-while-revalidate | 24 hours |
| Game state | IndexedDB only | N/A |
| API responses | Network-first with fallback | Per request |

---

## 4. Memory Management

### Current Memory Concerns

#### 4.1 UI Text Object Churn (UIScene.ts)

**Problem:** The `updateMoodles()` function destroys and recreates Text objects every state update:

```
Location: UIScene.ts lines 256-302
Issue: Each moodle update creates new Text objects
Frequency: Every 100ms (game tick)
Impact: 10+ object allocations per second = GC pressure
```

**Solution:** Pool or reuse Text objects, toggle visibility instead of destroy/create.

#### 4.2 Weather Particle Lifecycle (GameScene.ts)

**Problem:** Weather effects create new particle emitters without pooling:

```
Location: GameScene.ts lines 321-368
Issue: Fog sprites created with tweens, then destroyed
Issue: Rain emitter created fresh on each weather change
Impact: Memory allocation spikes on weather transitions
```

**Solution:** Pre-allocate particle pools, enable/disable rather than create/destroy.

#### 4.3 Event Log Array Growth

**Problem:** Server-side event array with shift operations:

```
Location: TrailRoom.ts line 673-675
Issue: Array shift() is O(n) and causes memory reallocation
Impact: Minor but adds up over long sessions
```

**Solution:** Use circular buffer or linked list for event log.

### Memory Budget

| Component | Budget | Current Estimate |
|-----------|--------|------------------|
| Phaser framework | 30MB | 30MB |
| Textures (GPU) | 20MB | 5MB (minimal) |
| Audio buffers | 15MB | 0MB |
| Game objects | 10MB | 2MB |
| IndexedDB state | 1MB | 0MB |
| JavaScript heap | 50MB | 20MB |
| **Total** | **126MB** | ~57MB |
| **Buffer to 200MB** | **74MB** | Available for growth |

---

## 5. Render Optimization

### Draw Call Budget

Target: <50 draw calls per frame for smooth mobile performance.

| Element | Current Approach | Draw Calls | Optimized |
|---------|-----------------|------------|-----------|
| Ground tile | TileSprite | 1 | 1 |
| Trail tile | TileSprite | 1 | 1 |
| Trees (30) | Individual sprites | 30 | 1 (atlas batch) |
| Blazes (10) | Individual sprites | 10 | 1 (atlas batch) |
| Hiker | Single sprite | 1 | 1 |
| Rain (100 particles) | Particle emitter | 1 | 1 |
| Fog (20 sprites) | Individual sprites | 20 | 1 (atlas batch) |
| UI elements | Mixed | ~15 | ~5 (containers) |
| **Total** | | ~79 | ~12 |

### Overdraw Analysis

Current scene has moderate overdraw from:
- Full-screen ground tile (base layer)
- Overlapping tree sprites with transparency
- Weather overlay sprites
- UI panels with alpha backgrounds

**Recommendations:**
1. Use opaque backgrounds where possible (UI panels)
2. Cull off-screen trees before rendering
3. Reduce fog sprite count (10 instead of 20)
4. Consider depth sorting to enable early-Z rejection

### Particle Limits

| Weather | Current Particles | Recommended Max |
|---------|------------------|-----------------|
| Clear | 0 | 0 |
| Light Rain | ~60/sec emit | 100 max alive |
| Heavy Rain | ~180/sec emit | 200 max alive |
| Storm | ~300/sec emit | 250 max alive |
| Fog | 20 sprites | 10 sprites |

**Current Issue:** Rain quantity in GameScene.ts uses unbounded emit rates:
```
quantity: weather === 'storm' ? 5 : (weather === 'rain_heavy' ? 3 : 1)
```
This is particles per emission, but there is no `maxParticles` limit.

---

## 6. Network Efficiency

### Colyseus State Sync Analysis

The current Colyseus schema is well-structured for delta synchronization:

| Schema | Fields | Sync Frequency | Data Size |
|--------|--------|----------------|-----------|
| HikerSchema | 20+ fields | On change | ~200 bytes full, ~10-50 delta |
| GameRoomState | Time, weather, events | Every tick | ~50-100 bytes |
| EventSchema | 4 fields | On event | ~100 bytes each |

**Efficient Patterns in Use:**
- MapSchema for hikers (only changed hikers sync)
- ArraySchema for events (incremental updates)
- Primitive types for stats (minimal overhead)

**Potential Issues:**

1. **Tick Rate:** 100ms (10 tps) is reasonable but could be 200ms for mobile battery
2. **Event Array:** Stores 20 events, syncs entire array structure on each event
3. **Inventory Sync:** Full gear/food arrays sync on any item change

### Bandwidth Budget

| Scenario | Upstream | Downstream |
|----------|----------|------------|
| Idle (not hiking) | <100 B/s | <500 B/s |
| Active hiking | <200 B/s | <2 KB/s |
| Weather change | Burst | <1 KB |
| Peak (inventory change) | <500 B | <2 KB |

**Recommendation:** Current implementation is efficient. No immediate action required for MVP.

---

## 7. IndexedDB Performance

### PRD Requirements

- Auto-save every 60 seconds
- Save on app background/close
- Resume from exact state
- No frame drops during save

### Recommended Implementation Patterns

#### 7.1 Async Save Architecture

```
Pattern: Write-behind with debouncing

1. State changes accumulate in memory
2. Debounce timer (60s or immediate on significant event)
3. Async write to IndexedDB (non-blocking)
4. Continue gameplay uninterrupted
```

#### 7.2 Serialization Strategy

| Data | Size Estimate | Serialization |
|------|---------------|---------------|
| Hiker state | ~2KB | JSON.stringify |
| Inventory | ~5KB | JSON.stringify |
| Game time/weather | ~100B | JSON.stringify |
| Event log | ~2KB | JSON.stringify |
| **Total per save** | **~10KB** | <5ms operation |

#### 7.3 Frame Drop Prevention

**Critical:** IndexedDB writes are async but can block if transaction is synchronous.

**Do:**
- Use `localforage` library (abstracts async properly)
- Write in `requestIdleCallback()` or between frames
- Batch multiple saves into single transaction

**Do Not:**
- Save on every state change (too frequent)
- Use synchronous `localStorage` for game state
- Block render loop waiting for write confirmation

### Save Triggers

| Trigger | Priority | Implementation |
|---------|----------|----------------|
| Timer (60s) | Normal | setInterval with debounce |
| Shelter reached | High | Immediate async |
| Town reached | High | Immediate async |
| Milestone (Neels Gap) | Critical | Immediate + confirmation |
| visibilitychange (hidden) | Critical | Immediate async |
| beforeunload | Critical | Best-effort sync |

---

## 8. Recommendations Summary

### P0 - Critical (Block Release)

| Item | Effort | Impact | Notes |
|------|--------|--------|-------|
| Upgrade Phaser to 3.90.0 | Low | High | Mobile Pipeline essential |
| Implement texture atlases | Medium | High | Replace runtime generation |
| Add object pooling for weather | Medium | High | Prevent GC stutter |
| Implement IndexedDB saves | Medium | High | Core offline requirement |

### P1 - High Priority (Pre-Launch)

| Item | Effort | Impact | Notes |
|------|--------|--------|-------|
| Pool/reuse UI text objects | Low | Medium | Fix moodle update churn |
| Add particle limits | Low | Medium | Prevent frame drops in storms |
| Configure PWA service worker | Medium | High | Offline asset caching |
| Explicit WebGL config | Low | Medium | Optimize mobile renderer |

### P2 - Should Have (Post-MVP)

| Item | Effort | Impact | Notes |
|------|--------|--------|-------|
| Remove unused physics | Low | Low | Reduce memory footprint |
| Implement frame rate cap | Low | Low | Battery optimization |
| Add performance monitoring | Medium | Low | Track real-world metrics |
| Circular buffer for events | Low | Low | Micro-optimization |

### P3 - Nice to Have (Future)

| Item | Effort | Impact | Notes |
|------|--------|--------|-------|
| WebWorker for simulation | High | Medium | Offload game tick |
| WASM for pathfinding | High | Low | Not needed for current scope |
| Predictive asset loading | Medium | Low | Based on player progress |

---

## 9. Performance Testing Checklist

Before release, validate on actual devices:

### Device Testing Matrix

| Device | Priority | Target FPS | Target Load Time |
|--------|----------|------------|------------------|
| iPhone 11 | High | 60 fps | <3s |
| iPhone SE 2 | High | 60 fps | <3s |
| Samsung A53 | High | 60 fps | <3s |
| Pixel 6a | Medium | 60 fps | <3s |
| iPad (any) | Medium | 60 fps | <2s |
| Low-end Android | Low | 30 fps | <5s |

### Test Scenarios

1. **Cold start:** Measure time from tap to gameplay
2. **Storm weather:** Sustained fps with max particles
3. **Extended session:** 30-minute play, monitor memory
4. **Airplane mode:** Full gameplay without network
5. **Background/foreground:** State preservation
6. **Low battery mode:** Verify playability

### Monitoring Points

| Metric | Tool | Threshold |
|--------|------|-----------|
| FPS | Phaser debug, Chrome DevTools | >55 fps average |
| Memory | Chrome DevTools, Safari Timeline | <200MB |
| JS Heap | Chrome DevTools | <50MB, no leaks |
| Network | DevTools Network tab | <5KB/s sustained |
| Bundle size | Build output | <10MB web, <50MB native |

---

## Appendix A: Current Code Performance Notes

### main.ts Configuration Analysis

```typescript
// Current config - issues noted
const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,           // ISSUE: Should be WEBGL explicit
  parent: 'game-container',
  width: 800,
  height: 600,
  pixelArt: true,              // GOOD: Disables anti-aliasing
  backgroundColor: '#1a1a1a',
  scale: {
    mode: Phaser.Scale.FIT,    // GOOD: Responsive scaling
    autoCenter: Phaser.Scale.CENTER_BOTH,
    min: { width: 400, height: 300 },
    max: { width: 1600, height: 1200 }
  },
  scene: [BootScene, MenuScene, GameScene, UIScene],
  physics: {
    default: 'arcade',          // ISSUE: Physics not needed, remove
    arcade: { debug: false }
  }
};
```

### GameScene.ts Hot Path Analysis

The `update()` method runs every frame (~60x/second):

```typescript
update(time: number, delta: number) {
  // Line 498-532 - runs every frame when hiking
  if (this.hikerData?.isHiking) {
    // TileSprite position updates - EFFICIENT
    this.ground.tilePositionY -= scrollSpeed;
    this.trail.tilePositionY -= scrollSpeed;

    // Tree position updates - O(30) forEach
    this.trees.forEach(tree => { ... });  // ACCEPTABLE

    // Blaze updates - O(10) forEach
    this.blazes.forEach(blaze => { ... }); // ACCEPTABLE

    // Hiker bob - EFFICIENT (single Math.sin)
    this.hiker.y = ... + Math.sin(time / 100) * 2;
  }

  // Fog movement - O(20) forEach with Math.sin
  this.fogSprites.forEach(fog => { ... }); // CONSIDER: reduce to 10
}
```

### UIScene.ts Hot Path Analysis

State updates arrive at 10 tps (100ms interval):

```typescript
onStateUpdate(data) {
  // Line 202-254 - runs every 100ms
  // Text updates - ACCEPTABLE (setText is efficient)
  this.timeText.setText(...);

  // Status bar redraws - WARNING
  this.drawStatusBar(this.caloriesBar, ...);   // Clears and redraws
  this.drawStatusBar(this.hydrationBar, ...);  // 3x per update
  this.drawStatusBar(this.energyBar, ...);

  // Moodle updates - PROBLEM
  this.updateMoodles(hiker.moodles);  // Creates/destroys objects
}
```

---

## Appendix B: Asset Pipeline Recommendations

### Texture Atlas Generation

Recommended tool: **TexturePacker** or **free-tex-packer**

```
Output format: Phaser 3 JSON Hash
Max atlas size: 2048x2048 (safe for all mobile GPUs)
Padding: 2px (prevent bleeding)
Format: PNG-8 with palette (for pixel art)
```

### Audio Compression

| Type | Format | Bitrate | Notes |
|------|--------|---------|-------|
| Ambient loops | OGG Vorbis | 64kbps | Long loops, file size priority |
| Sound effects | MP3 | 128kbps | Short, quality priority |
| Fallback | M4A/AAC | 96kbps | Safari compatibility |

### Build Pipeline Integration

```
1. npm run assets:build
   - Run TexturePacker CLI
   - Compress audio files
   - Generate manifest

2. npm run build:web
   - Vite build
   - Service worker generation
   - Asset hashing for cache busting

3. npm run build:mobile
   - Capacitor sync
   - Native asset bundling
```

---

*End of Performance Assessment*
