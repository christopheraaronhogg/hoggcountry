# Trail Legs Build-Out
## Enriched Product Requirements Document

**Version:** 2.0 (Consultant-Enriched)
**Date:** 2026-01-07
**Status:** Ready for Implementation

---

## Document Purpose

This document synthesizes the original PRD draft with insights from 8 expert consultant assessments:
- Architecture
- Backend
- Database/Storage
- DevOps
- Performance
- QA
- Security
- UX

Each section below integrates consultant recommendations into actionable requirements.

---

## 1. Executive Summary

### Vision
Transform the Trail Legs prototype into a polished, production-ready cross-platform game targeting web browsers, PWA, iOS App Store, and Google Play Store.

### Critical Architectural Decisions (From Consultants)

| Decision | Approach | Rationale |
|----------|----------|-----------|
| **Shared Simulation** | Extract game logic to `shared/simulation/` | Prevents online/offline drift (Architecture, Backend) |
| **Adapter Pattern** | Abstract online/offline behind `IGameAdapter` | Clean separation, testable (Architecture) |
| **Persistence First** | Implement IndexedDB before other features | Foundation for offline-first (Database, QA) |
| **Mobile Pipeline** | Upgrade Phaser to 3.90.0 | 20-40% FPS improvement (Performance) |
| **Input Validation** | Add Zod schemas for all server messages | Prevents exploits (Security, Backend) |
| **Touch-First UI** | Redesign UI with 44pt minimum targets | Current UI unusable on mobile (UX) |

### Build-Out Scope Summary

| Area | Current State | Build-Out Target | Priority |
|------|---------------|------------------|----------|
| Dependencies | Phaser 3.70, Vite 5, Colyseus 0.15 | Phaser 3.90, Vite 7, Colyseus 0.16.5 | P0 |
| Architecture | Duplicated logic, monolithic scenes | Shared simulation, adapter pattern | P0 |
| Persistence | None (in-memory only) | IndexedDB via localforage | P0 |
| Graphics | Placeholder rectangles | Pixel art texture atlases | P1 |
| Mobile Input | Keyboard only | Touch gestures + button controls | P0 |
| Responsive UI | Fixed 800x600 | Mobile-first responsive layout | P0 |
| Native Apps | None | Capacitor iOS/Android | P1 |
| Audio | None | Ambient, effects, UI sounds | P2 |
| Testing | None | Vitest unit + Playwright E2E | P1 |

---

## 2. Architecture Requirements

### 2.1 Shared Simulation Package (Critical)

**Rationale:** Current code duplicates game logic between `TrailRoom.ts` (server) and `GameScene.ts` (offline mode). This will cause behavioral drift.

**Requirements:**
- Extract all simulation logic to `shared/src/simulation/`
- Create pure functions: `processHiking()`, `processResting()`, `processStatusEffects()`
- Server and client offline mode must use identical functions
- No external dependencies in shared package (TypeScript only)

**Files to Create:**
```
shared/src/simulation/
  index.ts           # Exports all simulation functions
  hiking.ts          # processHiking(), calculateDistance()
  resting.ts         # processResting(), calculateRecovery()
  navigation.ts      # checkBlazeVisibility(), processLostState()
  status.ts          # processStatusEffects(), calculateMoodles()
  skills.ts          # calculateSkillGain(), applySkillBonuses()
  weather.ts         # maybeChangeWeather(), getWeatherEffects()
```

### 2.2 Adapter Pattern for Connectivity

**Requirements:**
- Create `IGameAdapter` interface with: `connect()`, `disconnect()`, `sendCommand()`, `onStateChange()`
- Implement `OnlineAdapter` wrapping Colyseus client
- Implement `OfflineAdapter` using shared simulation
- Create `ConnectionManager` to handle switching between adapters
- GameScene should not import Colyseus directly

### 2.3 Persistence Layer

**Requirements:**
- Add `localforage` package for IndexedDB abstraction
- Create `GameStorage` class with: `saveGame()`, `loadGame()`, `saveSettings()`, `loadSettings()`
- Create `SaveManager` for auto-save scheduling (60s interval)
- Save on: interval, shelter reached, app background, app close
- Include schema version for migrations
- Add checksum for integrity verification (deters casual cheating)

**Save File Schema (from Database assessment):**
```typescript
interface SaveGameRecord {
  id: string;
  version: number;
  savedAt: number;
  hiker: HikerState;
  game: GameState;
  syncStatus: 'local' | 'synced' | 'pending';
  checksum: string;
}
```

### 2.4 Scene Refactoring

**GameScene Changes:**
- Remove all Colyseus imports (use adapter)
- Remove offline simulation (use shared package via OfflineAdapter)
- Keep only: rendering, camera, visual effects
- Receive state updates via GameController events

**UIScene Changes:**
- Remove direct state access
- Subscribe to GameController events
- Implement responsive layout system
- Add touch-friendly controls (44pt minimum targets)

---

## 3. Platform Requirements

### 3.1 Dependency Upgrades

| Package | Current | Target | Breaking Changes |
|---------|---------|--------|------------------|
| Phaser | 3.70.0 | 3.90.0 | Mobile Pipeline auto-enabled |
| Vite | 5.0.0 | 7.x | Minor config changes |
| Colyseus | 0.15.0 | 0.16.5 | Schema decorator changes |
| TypeScript | 5.3.3 | 5.7.x | Stricter types |

### 3.2 Capacitor Configuration

**Required Plugins:**
- `@capacitor/core` + `@capacitor/cli`
- `@capacitor/ios` + `@capacitor/android`
- `@capacitor/haptics` (touch feedback)
- `@capacitor/status-bar` (immersive mode)
- `@capacitor/splash-screen`
- `@capacitor/app` (lifecycle events)

**App Configuration:**
```typescript
const config: CapacitorConfig = {
  appId: 'com.hoggcountry.traillegs',
  appName: 'Trail Legs',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  }
};
```

### 3.3 PWA Configuration

**Requirements:**
- Add `vite-plugin-pwa` with Workbox
- Create web manifest with app icons
- Configure service worker for offline assets
- Cache strategy: Cache-first for assets, Stale-while-revalidate for HTML

### 3.4 Build Scripts

```json
{
  "build:web": "tsc && vite build",
  "build:ios": "npm run build && cap sync ios",
  "build:android": "npm run build && cap sync android",
  "open:ios": "cap open ios",
  "open:android": "cap open android"
}
```

---

## 4. Mobile UX Requirements (Critical)

### 4.1 Touch Input System

| Action | Primary Gesture | Alternate | Touch Zone |
|--------|-----------------|-----------|------------|
| Start/Stop Hiking | Single tap | -- | Main game area |
| Change Pace Up | Swipe up | Tap pace+ button | Game area / UI |
| Change Pace Down | Swipe down | Tap pace- button | Game area / UI |
| Open Inventory | Swipe left | Tap inventory icon | Game area / Top bar |
| Eat | Tap food button | -- | Quick action bar |
| Drink | Tap water button | -- | Quick action bar |
| Rest/Camp | Long-press (1.5s) | Tap rest button | Game area / Quick bar |

### 4.2 Touch Target Specifications

| Element | Minimum Size | Recommended | Spacing |
|---------|-------------|-------------|---------|
| Action buttons | 44x44 pts | 56x56 pts | 8px |
| Menu icons | 44x44 pts | 48x48 pts | 12px edge |
| List items | 44px height | 56px height | 4px between |

### 4.3 Responsive Layout

**Portrait (Primary):**
```
+------------------------------------------+
|  [=]  Status Bar                 [?][S]  | 60px
+------------------------------------------+
|  STATUS PANEL (Cal/H2O/Nrg bars)         | 100px
+------------------------------------------+
|                                          |
|           GAME VIEWPORT                  | Flex
|           (Hiker, trail, trees)          |
|                                          |
+------------------------------------------+
|  MOODLE ROW                              | 32px
+------------------------------------------+
|  QUICK ACTIONS [EAT][DRINK][REST][PACE]  | 80px
+------------------------------------------+
|  EVENT LOG (scrollable)                  | 80px
+------------------------------------------+
```

**Safe Area Requirements:**
- Respect notch/Dynamic Island (iOS)
- Respect home indicator (iOS)
- Respect navigation bar (Android)
- Use Capacitor safe-area plugin or CSS `env(safe-area-inset-*)`

### 4.4 Feedback Systems

**Haptic Patterns (Capacitor Haptics):**
- Button tap: Light impact
- Action completed: Success pattern (two quick taps)
- Warning: Error pattern (three quick taps)
- Lost state: Heavy impact
- Milestone: Notification pattern

---

## 5. Graphics Requirements

### 5.1 Texture Atlas Strategy

| Atlas | Contents | Max Size | Format |
|-------|----------|----------|--------|
| `gameplay.png` | Hiker, trees, blazes, shelter | 1024x1024 | PNG-8 |
| `ui.png` | Buttons, bars, icons, frames | 512x512 | PNG-8 |
| `weather.png` | Rain, fog, lightning | 256x256 | PNG-8 + alpha |
| `terrain.png` | Trail tiles, ground, rocks | 512x512 | PNG-8 |

### 5.2 Sprite Specifications

**Hiker:**
- Size: 32x48 pixels
- Walking animation: 4 frames minimum
- Idle animation: 2 frames minimum
- States: normal, tired

**Blazes:**
- Single white: 8x16 pixels
- Double white: 8x32 pixels
- Blue blaze: 8x16 pixels
- Cairn: 24x24 pixels

### 5.3 Asset Size Budget

| Category | Budget |
|----------|--------|
| Sprites (PNG) | 2MB |
| Audio (MP3/OGG) | 5MB |
| Fonts (WOFF2) | 200KB |
| Code (JS) | 3MB |
| **Total Initial** | **10MB** |

---

## 6. Performance Requirements

### 6.1 Performance Budgets

| Metric | Target | Failure Threshold |
|--------|--------|-------------------|
| Frame Rate | 60 fps sustained | <55 fps for >1s |
| Load Time | <3 seconds | >5 seconds |
| Memory | <200MB peak | >250MB |
| CPU | <30% sustained | >50% sustained |
| Bundle (web) | <10MB | >15MB |
| App Size (native) | <50MB | >75MB |
| Touch Latency | <100ms | >150ms |

### 6.2 Critical Optimizations (from Performance assessment)

1. **Upgrade Phaser to 3.90.0** - Mobile Pipeline provides 20-40% FPS improvement
2. **Texture Atlases** - Replace runtime generation with pre-built atlases
3. **Object Pooling** - Pool weather particles, reuse UI text objects
4. **Explicit WebGL** - Use `type: Phaser.WEBGL` not `AUTO`
5. **Particle Limits** - Cap rain at 200 particles, fog at 10 sprites
6. **Remove Unused Physics** - Current config enables Arcade physics but doesn't use it

### 6.3 Render Budget

Target: <50 draw calls per frame

| Element | Current | Optimized |
|---------|---------|-----------|
| Trees (30) | 30 | 1 (batched) |
| Blazes (10) | 10 | 1 (batched) |
| Fog (20) | 20 | 1 (batched) |
| UI elements | ~15 | ~5 (containers) |
| **Total** | ~79 | ~12 |

---

## 7. Backend Requirements

### 7.1 Input Validation (Critical - Security)

**All server message handlers must validate input:**

```typescript
// Example with Zod
const CreateHikerSchema = z.object({
  name: z.string().max(32).regex(/^[a-zA-Z0-9\s\-']+$/),
  build: z.enum(['weekend_warrior', 'scout_leader', ...])
});

const DrinkSchema = z.object({
  amount: z.number().min(0.1).max(3.0)
});
```

**Handlers requiring validation:**
- `create_hiker` - validate name length, build enum
- `drink` - validate amount > 0, <= capacity
- `eat` - validate foodId exists in inventory
- `set_pace` - validate pace enum

### 7.2 Server Hardening

| Issue | Current | Required |
|-------|---------|----------|
| CORS | None | Configure for mobile web |
| Rate limiting | None | Add per-client message limiting |
| Error responses | Silent failures | Send error messages to client |
| Reconnection | Immediate cleanup | 60-second grace period |

### 7.3 Sync Protocol Foundation

For future cloud sync, implement:
- Timestamp all state changes
- Queue offline actions with UUIDs
- Store action log, not just state snapshots
- Design plausibility validation for sync reconciliation

---

## 8. Testing Requirements

### 8.1 Test Infrastructure

| Package | Framework | Purpose |
|---------|-----------|---------|
| All | Vitest | Unit and integration tests |
| Client | happy-dom | DOM testing |
| E2E | Playwright | Cross-browser, mobile emulation |
| Performance | Lighthouse CI | Automated budgets |

### 8.2 Coverage Targets

| Package | Target Coverage |
|---------|-----------------|
| `shared` | 90%+ (simulation logic) |
| `client/storage` | 85%+ |
| `client/input` | 80%+ |
| `client/adapters` | 80%+ |
| `client/scenes` | 50%+ |

### 8.3 Platform Test Matrix

| Platform | Priority | Notes |
|----------|----------|-------|
| Desktop Chrome | P0 | Primary development |
| Mobile Safari (iOS 15+) | P0 | iPhone 11+ target |
| Mobile Chrome (Android 10+) | P0 | Samsung A53 target |
| Desktop Safari | P1 | Mac users |
| iOS Native (Capacitor) | P0 | App Store |
| Android Native (Capacitor) | P0 | Play Store |

### 8.4 Critical Test Scenarios

1. **Offline persistence** - Save/load survives app restart
2. **Simulation consistency** - Offline matches online behavior
3. **Touch input** - All actions achievable via touch
4. **Performance** - 60fps on 3-year-old devices
5. **Connectivity transitions** - Seamless online/offline switching

---

## 9. Security Requirements

### 9.1 MVP Security (Pragmatic)

| Concern | Approach |
|---------|----------|
| Save tampering | Checksum verification (deters casual cheating) |
| Input validation | Server-side Zod schemas |
| Message flooding | Rate limiting per client |
| Name injection | Sanitize + length limit |
| Production builds | Disable WebView debugging |

### 9.2 Defer to Post-MVP

- User authentication
- Cloud save encryption
- Anti-cheat obfuscation
- Certificate pinning

---

## 10. Open Questions

| Question | Owner | Decision Needed By |
|----------|-------|-------------------|
| Art style execution - who creates pixel art assets? | Product | Before graphics phase |
| Audio assets - royalty-free or commission? | Product | Before polish phase |
| Apple Developer account exists? | Product | Before iOS build |
| Google Play Console account exists? | Product | Before Android build |
| Server hosting budget? | Product | Before deployment |
| Domain for game (traillegs.game)? | Product | Before deployment |
| Is multiplayer required for launch? | Product | Architecture phase |

---

## 11. Success Criteria

### Platform Deployment
- [ ] Web version deployed and accessible
- [ ] PWA installs from mobile browser
- [ ] iOS app builds in Xcode without errors
- [ ] Android app builds in Android Studio without errors
- [ ] All four platforms run identical game

### Offline Functionality
- [ ] Game launches with airplane mode on
- [ ] Full gameplay works offline
- [ ] Progress persists after app close
- [ ] Progress persists after device restart

### Mobile Experience
- [ ] All actions achievable via touch
- [ ] UI readable without zooming
- [ ] No overlapping touch targets
- [ ] 44pt minimum touch targets
- [ ] Works in portrait and landscape

### Performance
- [ ] 60fps on iPhone 11 / Samsung A53
- [ ] < 50MB native app bundle
- [ ] < 3 second cold start
- [ ] < 200MB memory usage

### Quality
- [ ] 80%+ unit test coverage on shared package
- [ ] E2E smoke tests pass on Chrome and Safari
- [ ] No P0 bugs open

---

*End of Enriched PRD*
