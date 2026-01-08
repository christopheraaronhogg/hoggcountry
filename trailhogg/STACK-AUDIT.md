# Trail Legs - Technology Stack Audit Report

**Generated:** 2026-01-07
**Research Date:** 2026-01-07 (all searches performed on this date)

---

## Detected Stack

```
Trail Legs Monorepo
├── Client: @trail-legs/client
│   ├── Phaser 3.70.0 (2D game framework)
│   ├── colyseus.js 0.15.0 (multiplayer client)
│   ├── Vite 5.0.0 (build tool)
│   └── TypeScript 5.3.3
├── Server: @trail-legs/server
│   ├── Colyseus 0.15.0 (game server)
│   ├── Express 4.18.2 (HTTP server)
│   └── TypeScript 5.3.3
├── Shared: @trail-legs/shared
│   └── TypeScript 5.3.3
└── Root: trail-legs
    └── concurrently 8.2.2 (dev scripts)
```

---

## Executive Summary

| Metric | Value | Notes |
|--------|-------|-------|
| **Stack Health Score** | 7/10 | Solid foundation, needs version updates |
| **Packages Audited** | 8 | Core dependencies |
| **Outdated Packages** | 4 | Phaser, Vite, Colyseus need updates |
| **Architecture Fit** | 8/10 | Good choices for the use case |
| **Mobile Readiness** | 5/10 | Needs Capacitor setup + offline-first |

### Verdict: ✅ STACK IS APPROPRIATE

Your tech choices are well-suited for a hiking simulation game targeting browser, mobile web, and native apps. The core architecture (Phaser + Colyseus + TypeScript + Vite) is solid. Key recommendations below.

---

## Version Matrix

| Package | Installed | Latest Stable | Status | Priority |
|---------|-----------|---------------|--------|----------|
| Phaser | 3.70.0 | 3.90.0 | ⚠️ 20 versions behind | **High** |
| Vite | 5.0.0 | 7.3.1 | ❌ 2 majors behind | **High** |
| Colyseus | 0.15.0 | 0.16.5 | ⚠️ Minor behind | Medium |
| colyseus.js | 0.15.0 | 0.15.x | ✅ Current | - |
| TypeScript | 5.3.3 | 5.7.x | ⚠️ Minor behind | Low |
| Express | 4.18.2 | 4.21.x | ✅ Current-ish | Low |
| concurrently | 8.2.2 | 9.x | ⚠️ Major behind | Low |

---

## Package Assessments

### 1. Phaser 3 (Game Engine)

**Verdict: ✅ EXCELLENT CHOICE**

#### Version Status
- **Installed:** 3.70.0
- **Latest:** 3.90.0 "Tsugumi" (released May 23, 2025)
- **Status:** 20 patch versions behind
- **Action Required:** Update to 3.90.0

#### Why Phaser is Right for Trail Legs
- ✅ Proven 2D framework with 10+ years of active development
- ✅ Strong mobile support with automatic Mobile Pipeline (3.60+)
- ✅ TypeScript support out of the box
- ✅ Works with Capacitor for native deployment
- ✅ Pixel art mode perfect for your art style choice
- ✅ 40+ frontend framework integrations
- ✅ Active community and extensive documentation

#### Mobile Performance (Critical for Hikers)
From [Phaser 3.60 Mobile Performance](https://github.com/phaserjs/phaser/blob/v3.60.0/changelog/3.60/MobilePerformance.md):
> "Phaser 3.60 went right back to the drawing board with regard to the performance on mobile devices... The new Mobile Pipeline stopped all sub-data buffering, removing the blocking process from rendering."

**Phaser auto-detects iOS/Android and uses the optimized Mobile Pipeline.**

#### Best Practices to Implement
| Practice | Status | Notes |
|----------|--------|-------|
| Use texture atlases | ⚠️ Not implemented | Combine sprites into spritesheets |
| Object pooling | ⚠️ Not implemented | Prevent garbage collection hiccups |
| Limit tileSprites | ✅ Using sprites | Good - tileSprites are slow on mobile |
| Scene-based preloading | ⚠️ Partial | Only load assets per scene |
| Bitmap fonts | ❌ Using text | Switch to BitmapText for performance |

#### Sources
- [Phaser Download - Stable v3.90.0](https://phaser.io/download/stable) - accessed 2026-01-07
- [How I optimized my Phaser 3 action game](https://phaser.io/news/2025/03/how-i-optimized-my-phaser-3-action-game-in-2025) - accessed 2026-01-07
- [Phaser GitHub Releases](https://github.com/phaserjs/phaser/releases) - accessed 2026-01-07

---

### 2. Colyseus (Multiplayer Server)

**Verdict: ✅ EXCELLENT CHOICE**

#### Version Status
- **Installed:** 0.15.0
- **Latest:** 0.16.5 (published ~3 months ago)
- **Status:** Minor version behind
- **Action Required:** Update to 0.16.x

#### Why Colyseus is Right for Trail Legs
- ✅ Authoritative game server (prevents cheating)
- ✅ Real-time state synchronization built-in
- ✅ Room-based matchmaking for multiplayer
- ✅ TypeScript-first
- ✅ Works perfectly with Phaser (official examples)
- ✅ Self-hostable (important for cost control)
- ✅ MIT licensed, open source
- ✅ SDKs for Web, Unity, and more

#### Architecture Considerations for Hikers

**IMPORTANT: Your offline mode is correctly implemented!**

Your `GameScene.ts` already falls back to offline mode:
```typescript
} catch (error) {
  console.error('Connection failed:', error);
  this.runOfflineMode();
}
```

This is critical because hikers often have no connectivity on the trail.

#### Recommended Enhancements
| Feature | Priority | Notes |
|---------|----------|-------|
| Local save state | **High** | Persist to IndexedDB for offline |
| Sync when connected | Medium | Queue actions, replay on reconnect |
| WebTransport support | Low | On Colyseus roadmap for v1.0 |

#### Sources
- [Colyseus Official Site](https://colyseus.io/) - accessed 2026-01-07
- [Colyseus GitHub](https://github.com/colyseus/colyseus) - accessed 2026-01-07
- [Colyseus npm](https://www.npmjs.com/package/colyseus) - accessed 2026-01-07

---

### 3. Vite (Build Tool)

**Verdict: ✅ CORRECT CHOICE, NEEDS UPDATE**

#### Version Status
- **Installed:** 5.0.0
- **Latest:** 7.3.1 (current stable)
- **Status:** 2 major versions behind
- **Action Required:** **Migrate to Vite 7**

#### Why Vite 7 Matters
From [Vite 7.0 Announcement](https://vite.dev/blog/announcing-vite7):
- New baseline browser targeting for better mobile support
- Improved Environment API (useful for SSR if ever needed)
- Better build performance

#### Migration Path
```bash
npm install vite@latest
```

Vite 7 is backward compatible with Vite 6. Deprecated features removed:
- Sass legacy API (not used)
- splitVendorChunkPlugin (not used)

#### Sources
- [Vite Releases](https://vite.dev/releases) - accessed 2026-01-07
- [Vite 7.0 Announcement](https://vite.dev/blog/announcing-vite7) - accessed 2026-01-07
- [Migration from v6](https://vite.dev/guide/migration) - accessed 2026-01-07

---

### 4. Capacitor (Mobile Wrapper) - NOT YET INSTALLED

**Verdict: ✅ CORRECT CHOICE FOR NATIVE**

#### Current Status
- **Installed:** Not yet
- **Planned:** Yes (mentioned in README)

#### Why Capacitor Over Alternatives

| Option | Performance | Web Code Reuse | Recommendation |
|--------|-------------|----------------|----------------|
| **Capacitor** | Good (WebView) | 100% | ✅ Best for your use case |
| React Native | Better (native) | 0% (rewrite) | ❌ Would require full rewrite |
| PWA only | Good | 100% | ⚠️ Limited native features |
| Cordova | Legacy | 100% | ❌ Deprecated |

From [Capacitor vs React Native](https://nextnative.dev/blog/capacitor-vs-react-native):
> "Capacitor is the best choice for teams with web expertise who want to move fast and share code across platforms."

**For a Phaser game, Capacitor is ideal because:**
- ✅ Zero code changes to your Phaser game
- ✅ Official Phaser + Capacitor tutorials exist
- ✅ PWA support built-in (web install without app stores)
- ✅ Access to native device APIs (camera, GPS for trail tracking)
- ✅ Modern WKWebView on iOS (good game performance)

#### Phaser + Capacitor Integration
From [Phaser Capacitor Tutorial](https://phaser.io/tutorials/bring-your-phaser-game-to-ios-and-android-with-capacitor):
1. Add Capacitor: `npm install @capacitor/core @capacitor/cli`
2. Initialize: `npx cap init`
3. Add platforms: `npx cap add ios && npx cap add android`
4. Build & sync: `npm run build && npx cap sync`

#### Sources
- [Phaser Capacitor Tutorial](https://phaser.io/tutorials/bring-your-phaser-game-to-ios-and-android-with-capacitor) - accessed 2026-01-07
- [Capacitor vs React Native Comparison](https://nextnative.dev/blog/capacitor-vs-react-native) - accessed 2026-01-07
- [Phaser Capacitor Starter](https://github.com/gnesher/phaser-capacitor) - accessed 2026-01-07

---

### 5. TypeScript

**Verdict: ✅ EXCELLENT CHOICE**

#### Version Status
- **Installed:** 5.3.3
- **Latest:** 5.7.x
- **Status:** Slightly behind, no breaking changes
- **Action Required:** Update when convenient

Your TypeScript usage is solid. The shared types package is a good pattern.

---

## Critical Gap: Offline-First Architecture

### Current State
Your game has basic offline fallback but lacks persistent storage.

### Required for Hikers
Hikers need their game state to persist when:
- No cell signal (most of the AT)
- App closed/reopened
- Device restarted
- Multi-day sessions

### Recommended Solution: IndexedDB

From [Offline-First Frontend Apps 2025](https://blog.logrocket.com/offline-first-frontend-apps-2025-indexeddb-sqlite/):
> "IndexedDB is the browser's built-in, asynchronous, NoSQL database—perfect for offline-first applications."

**Storage limits:**
- Chrome: 60% of total disk space
- Firefox: 50% of total disk space
- Safari: 1GB (with 200MB prompts)

### Implementation Recommendation

```typescript
// Add to shared/src/storage.ts
import localforage from 'localforage';

export const gameStore = localforage.createInstance({
  name: 'trail-legs',
  storeName: 'game_state'
});

export async function saveGameState(state: HikerState): Promise<void> {
  await gameStore.setItem('current_hiker', state);
  await gameStore.setItem('last_save', Date.now());
}

export async function loadGameState(): Promise<HikerState | null> {
  return await gameStore.getItem('current_hiker');
}
```

**Package to add:** `localforage` (2KB, wraps IndexedDB with simple API)

#### Sources
- [RxDB Offline-First Guide](https://rxdb.info/offline-first.html) - accessed 2026-01-07
- [IndexedDB for Web Games](https://w3c.github.io/web-roadmaps/games/storage.html) - accessed 2026-01-07
- [localForage](https://github.com/localForage/localForage) - accessed 2026-01-07

---

## Recommended Package Updates

### Immediate (Before Further Development)

```bash
# Client updates
cd client
npm install phaser@latest vite@latest

# Server updates
cd ../server
npm install colyseus@latest @colyseus/core@latest

# Root updates
cd ..
npm install concurrently@latest
```

### Add for Offline-First

```bash
cd client
npm install localforage
```

### Add for Native Apps

```bash
cd client
npm install @capacitor/core @capacitor/cli
npx cap init "Trail Legs" "com.hoggcountry.traillegs"
npx cap add ios
npx cap add android
```

---

## Architecture Recommendations

### 1. Add Service Worker for PWA

For web users on the trail who can "install" the game:

```typescript
// vite.config.ts
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        globPatterns: ['**/*.{js,css,html,png,json}']
      }
    })
  ]
})
```

### 2. Implement Save/Load System

```
User starts game
    ↓
Load from IndexedDB (if exists)
    ↓
Play (offline or online)
    ↓
Auto-save every 60 seconds to IndexedDB
    ↓
If online: sync to server
```

### 3. Consider Future Multiplayer Sync

When connectivity returns:
1. Queue offline actions
2. Reconcile with server state
3. Handle conflicts (server wins)

---

## Summary: What to Do Next

### Phase 1: Update Dependencies (Now)
- [ ] Update Phaser 3.70.0 → 3.90.0
- [ ] Update Vite 5.0.0 → 7.3.1
- [ ] Update Colyseus 0.15.0 → 0.16.5
- [ ] Add localforage for offline storage

### Phase 2: Mobile Foundation
- [ ] Add Capacitor to client
- [ ] Implement touch controls
- [ ] Add PWA support with service worker
- [ ] Test on actual Android/iOS devices

### Phase 3: Offline-First
- [ ] Implement IndexedDB save/load
- [ ] Add auto-save mechanism
- [ ] Handle sync on reconnect

---

## Sources Summary

| Topic | Source | Accessed |
|-------|--------|----------|
| Phaser Latest | [phaser.io/download/stable](https://phaser.io/download/stable) | 2026-01-07 |
| Phaser Mobile Perf | [GitHub Changelog](https://github.com/phaserjs/phaser/blob/v3.60.0/changelog/3.60/MobilePerformance.md) | 2026-01-07 |
| Colyseus | [colyseus.io](https://colyseus.io/) | 2026-01-07 |
| Vite 7 | [vite.dev/blog/announcing-vite7](https://vite.dev/blog/announcing-vite7) | 2026-01-07 |
| Capacitor | [nextnative.dev comparison](https://nextnative.dev/blog/capacitor-vs-react-native) | 2026-01-07 |
| Phaser+Capacitor | [phaser.io tutorial](https://phaser.io/tutorials/bring-your-phaser-game-to-ios-and-android-with-capacitor) | 2026-01-07 |
| Offline-First | [logrocket.com](https://blog.logrocket.com/offline-first-frontend-apps-2025-indexeddb-sqlite/) | 2026-01-07 |
| IndexedDB Limits | [RxDB](https://rxdb.info/offline-first.html) | 2026-01-07 |

---

*Report generated by Stack Consultant - 2026-01-07*
