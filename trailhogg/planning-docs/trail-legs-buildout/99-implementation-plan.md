# Trail Legs Build-Out
## Final Implementation Plan

**Version:** 1.0
**Date:** 2026-01-07
**Status:** Ready for Implementation

---

## Table of Contents

1. [Implementation Phases](#1-implementation-phases)
2. [Dependency Graph](#2-dependency-graph)
3. [Detailed Task Breakdown](#3-detailed-task-breakdown)
4. [Risk Register](#4-risk-register)
5. [Open Questions](#5-open-questions)
6. [Files to Create/Modify](#6-files-to-createmodify)
7. [Definition of Done](#7-definition-of-done)

---

## 1. Implementation Phases

### Phase Overview

```
PHASE 0: Setup (Foundation)
   └── Dependency upgrades, test infrastructure, project configuration
           │
           ▼
PHASE 1: Architecture (Foundation)
   └── Shared simulation, persistence layer, adapter pattern
           │
           ▼
PHASE 2: Mobile (Core Experience)
   └── Touch input, responsive UI, Capacitor setup
           │
           ▼
PHASE 3: Polish (Content)
   └── Pixel art assets, audio system, new scenes
           │
           ▼
PHASE 4: Deployment (Release)
   └── PWA, native builds, App Store submission
```

### Phase Timeline Summary

| Phase | Focus | Key Deliverables |
|-------|-------|------------------|
| **0: Setup** | Foundation | Updated deps, Vitest, project config |
| **1: Architecture** | Foundation | Shared simulation, IndexedDB, adapters |
| **2: Mobile** | Core Experience | Touch controls, responsive UI, Capacitor |
| **3: Polish** | Content | Sprites, audio, inventory/shelter scenes |
| **4: Deployment** | Release | PWA, native builds, store assets |

---

## 2. Dependency Graph

```
                    ┌─────────────────────┐
                    │  0.1 Upgrade Phaser │
                    │  0.2 Upgrade Vite   │
                    │  0.3 Add Vitest     │
                    └──────────┬──────────┘
                               │
              ┌────────────────┼────────────────┐
              │                │                │
              ▼                ▼                ▼
    ┌─────────────────┐ ┌──────────────┐ ┌─────────────────┐
    │ 1.1 Shared      │ │ 1.2 Storage  │ │ 1.3 Input       │
    │ Simulation      │ │ Layer        │ │ Manager         │
    └────────┬────────┘ └──────┬───────┘ └────────┬────────┘
             │                 │                  │
             └────────┬────────┴────────┬─────────┘
                      │                 │
                      ▼                 ▼
            ┌─────────────────┐ ┌─────────────────┐
            │ 1.4 Game        │ │ 1.5 Adapters    │
            │ Controller      │ │ Online/Offline  │
            └────────┬────────┘ └────────┬────────┘
                     │                   │
                     └─────────┬─────────┘
                               │
              ┌────────────────┼────────────────┐
              │                │                │
              ▼                ▼                ▼
    ┌─────────────────┐ ┌──────────────┐ ┌─────────────────┐
    │ 2.1 Touch Input │ │ 2.2 Respon-  │ │ 2.3 Capacitor   │
    │ Layer           │ │ sive UI      │ │ Setup           │
    └────────┬────────┘ └──────┬───────┘ └────────┬────────┘
             │                 │                  │
             └────────┬────────┴────────┬─────────┘
                      │                 │
                      ▼                 ▼
            ┌─────────────────┐ ┌─────────────────┐
            │ 3.1 Pixel Art   │ │ 3.2 Audio       │
            │ Assets          │ │ System          │
            └────────┬────────┘ └────────┬────────┘
                     │                   │
                     ├───────────────────┤
                     │                   │
                     ▼                   ▼
            ┌─────────────────┐ ┌─────────────────┐
            │ 3.3 Inventory   │ │ 3.4 Shelter     │
            │ Scene           │ │ Scene           │
            └────────┬────────┘ └────────┬────────┘
                     │                   │
                     └─────────┬─────────┘
                               │
                               ▼
            ┌─────────────────────────────────────┐
            │ 4.1 PWA Config                      │
            │ 4.2 Native Builds                   │
            │ 4.3 Store Assets & Submission       │
            └─────────────────────────────────────┘
```

---

## 3. Detailed Task Breakdown

### Phase 0: Setup (Foundation)

#### 0.1 Upgrade Dependencies

**Files to modify:** `package.json` (root, client, server, shared)

| Task | Details | Effort |
|------|---------|--------|
| Upgrade Phaser | 3.70.0 → 3.90.0 | Low |
| Upgrade Vite | 5.0.0 → 7.x | Low |
| Upgrade Colyseus | 0.15.0 → 0.16.5 | Low |
| Upgrade TypeScript | 5.3.3 → 5.7.x | Low |
| Add localforage | New dependency in shared | Low |
| Run npm audit | Fix any vulnerabilities | Low |

**Acceptance Criteria:**
- [ ] `npm install` succeeds
- [ ] `npm run build` succeeds
- [ ] `npm run dev` starts both client and server
- [ ] No TypeScript errors

#### 0.2 Configure Phaser for Mobile

**Files to modify:** `client/src/main.ts`

```typescript
const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.WEBGL,  // Explicit WebGL, not AUTO
  pixelArt: true,
  antialias: false,
  powerPreference: 'high-performance',
  // Remove unused physics
  // physics: { ... } <- DELETE
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  // ...
};
```

#### 0.3 Add Test Infrastructure

**Files to create:**
- `vitest.config.ts` (root)
- `playwright.config.ts` (root)

**Files to modify:** `package.json` scripts

| Script | Command |
|--------|---------|
| `test` | `vitest run` |
| `test:watch` | `vitest` |
| `test:coverage` | `vitest run --coverage` |
| `test:e2e` | `playwright test` |

**Dependencies to add:**
- `vitest`
- `@testing-library/dom`
- `happy-dom`
- `@playwright/test`

---

### Phase 1: Architecture (Foundation)

#### 1.1 Extract Shared Simulation

**Files to create:**
```
shared/src/simulation/
  index.ts
  hiking.ts
  resting.ts
  navigation.ts
  status.ts
  skills.ts
  weather.ts
  constants.ts
```

**Task breakdown:**

| Task | Details |
|------|---------|
| Create `hiking.ts` | Extract `processHiking()`, `calculateDistance()` from TrailRoom |
| Create `resting.ts` | Extract `processResting()`, `calculateRecovery()` |
| Create `navigation.ts` | Extract `checkBlazeVisibility()`, `processLostState()` |
| Create `status.ts` | Extract `processStatusEffects()`, `calculateMoodles()` |
| Create `skills.ts` | Extract `calculateSkillGain()`, `applySkillBonuses()` |
| Create `weather.ts` | Extract `maybeChangeWeather()`, `getWeatherEffects()` |
| Create `constants.ts` | Move magic numbers from TrailRoom (PACE_CONFIG, etc.) |
| Create `index.ts` | Re-export all functions |
| Write unit tests | 90%+ coverage target |

**Files to modify:**
- `server/src/rooms/TrailRoom.ts` - Use shared simulation functions
- `shared/package.json` - Add build scripts

**Acceptance Criteria:**
- [ ] All simulation logic in shared package
- [ ] TrailRoom imports and uses shared functions
- [ ] Unit tests pass for all simulation functions
- [ ] No behavioral changes in online mode

#### 1.2 Implement Storage Layer

**Files to create:**
```
client/src/storage/
  GameStorage.ts      # IndexedDB wrapper via localforage
  SaveManager.ts      # Auto-save orchestration
  SyncQueue.ts        # Offline action queue (foundation)
  types.ts            # SaveGameRecord, SettingsRecord interfaces
```

**Task breakdown:**

| Task | Details |
|------|---------|
| Create `GameStorage.ts` | `saveGame()`, `loadGame()`, `saveSettings()`, `loadSettings()` |
| Create `SaveManager.ts` | 60s interval, lifecycle events, debouncing |
| Create `types.ts` | Define save schema with version field |
| Add checksum | Compute/verify save integrity |
| Add migration framework | `migrateSaveData()` for schema versions |
| Write integration tests | Test save/load cycle |

**Acceptance Criteria:**
- [ ] Game state saves to IndexedDB
- [ ] Game resumes from saved state on reload
- [ ] Auto-save triggers every 60 seconds
- [ ] App background triggers immediate save
- [ ] Corrupted saves are detected

#### 1.3 Create Input Manager

**Files to create:**
```
client/src/input/
  InputManager.ts     # Unified input handling
  KeyboardInput.ts    # Existing keyboard bindings
  TouchInput.ts       # Touch gesture detection (stub for Phase 2)
  types.ts            # GameCommand interface
```

**Task breakdown:**

| Task | Details |
|------|---------|
| Define `GameCommand` interface | Unified command type |
| Create `InputManager.ts` | Routes keyboard/touch to commands |
| Extract `KeyboardInput.ts` | Existing keyboard handling |
| Create `TouchInput.ts` | Stub with interface, implement in Phase 2 |

**Acceptance Criteria:**
- [ ] Keyboard controls work through InputManager
- [ ] GameScene receives commands, not raw input
- [ ] TouchInput interface defined for Phase 2

#### 1.4 Create Game Controller

**Files to create:**
```
client/src/controllers/
  GameController.ts   # Central game state manager
  types.ts            # Controller interfaces
```

**Task breakdown:**

| Task | Details |
|------|---------|
| Create `GameController.ts` | Manages game state, routes commands |
| Integrate with adapters | Connect to OnlineAdapter or OfflineAdapter |
| Event emission | `state-update`, `game-event` events |
| Save orchestration | Trigger SaveManager on significant events |

**Acceptance Criteria:**
- [ ] GameController is single source of truth for game state
- [ ] Scenes subscribe to GameController events
- [ ] Commands route through GameController

#### 1.5 Implement Adapters

**Files to create:**
```
client/src/adapters/
  IGameAdapter.ts     # Interface definition
  OnlineAdapter.ts    # Colyseus wrapper
  OfflineAdapter.ts   # Local simulation
  ConnectionManager.ts # Adapter switching
```

**Task breakdown:**

| Task | Details |
|------|---------|
| Define `IGameAdapter` | `connect()`, `disconnect()`, `sendCommand()`, `onStateChange()` |
| Create `OnlineAdapter` | Wrap Colyseus client, translate to interface |
| Create `OfflineAdapter` | Use shared simulation, local state |
| Create `ConnectionManager` | Detect connectivity, switch adapters |
| Integrate with GameController | Controller uses adapters, not Colyseus directly |

**Acceptance Criteria:**
- [ ] GameScene has no Colyseus imports
- [ ] Online mode works through OnlineAdapter
- [ ] Offline mode uses OfflineAdapter with shared simulation
- [ ] Seamless switching on connectivity change

---

### Phase 2: Mobile (Core Experience)

#### 2.1 Implement Touch Input

**Files to modify:**
- `client/src/input/TouchInput.ts` (complete implementation)

**Task breakdown:**

| Gesture | Implementation |
|---------|----------------|
| Single tap | Start/stop hiking, button activation |
| Swipe up/down | Pace change (50px minimum) |
| Swipe left | Open inventory |
| Long-press (1.5s) | Rest/camp with visual progress |

**Requirements:**
- 200ms debounce on hiking toggle
- Gesture prevention for accidental inputs
- Visual feedback on touch (press states)

**Acceptance Criteria:**
- [ ] All actions achievable via touch
- [ ] No accidental inputs during scrolling
- [ ] Visual feedback on all touch targets

#### 2.2 Implement Responsive UI

**Files to modify:**
- `client/src/scenes/UIScene.ts` (major refactor)

**Files to create:**
```
client/src/ui/
  layouts/
    PortraitLayout.ts
    LandscapeLayout.ts
  components/
    StatusBar.ts
    Button.ts
    QuickActionBar.ts
    MoodleRow.ts
```

**Task breakdown:**

| Task | Details |
|------|---------|
| Responsive stat panel | Horizontal bars, flexible positioning |
| Quick action bar | 56x56 buttons: EAT, DRINK, REST, PACE |
| Moodle row | Icon badges with labels |
| Event log | Scrollable, fixed height |
| Safe area handling | Capacitor safe-area or CSS env() |
| Touch targets | 44pt minimum, 8px spacing |

**Layout breakpoints:**
- 320-375px: Compact (stacked stats)
- 376-428px: Standard (default)
- 429-480px: Large phone
- 481px+: Tablet/landscape considerations

**Acceptance Criteria:**
- [ ] UI readable on iPhone SE (320px)
- [ ] UI works on tablets
- [ ] Safe areas respected (notch, home indicator)
- [ ] All touch targets 44pt minimum

#### 2.3 Capacitor Setup

**Files to create:**
- `client/capacitor.config.ts`

**Task breakdown:**

| Task | Command/Details |
|------|-----------------|
| Install Capacitor | `npm install @capacitor/core @capacitor/cli` |
| Initialize | `npx cap init "Trail Legs" com.hoggcountry.traillegs` |
| Add plugins | `@capacitor/haptics`, `@capacitor/status-bar`, etc. |
| Add iOS | `npx cap add ios` |
| Add Android | `npx cap add android` |
| Configure | Splash screen, status bar settings |
| Test on simulators | Verify touch input works |

**Acceptance Criteria:**
- [ ] `npx cap sync ios` succeeds
- [ ] `npx cap sync android` succeeds
- [ ] App runs on iOS Simulator
- [ ] App runs on Android Emulator
- [ ] Touch input functional on native

#### 2.4 Haptic Feedback

**Files to modify:**
- `client/src/input/TouchInput.ts`
- Various button components

**Implementation:**
```typescript
import { Haptics, ImpactStyle } from '@capacitor/haptics';

// Button tap
await Haptics.impact({ style: ImpactStyle.Light });

// Action success
await Haptics.notification({ type: NotificationType.Success });

// Error
await Haptics.notification({ type: NotificationType.Error });
```

**Acceptance Criteria:**
- [ ] Buttons provide haptic feedback on native
- [ ] Milestone events have distinct haptic pattern
- [ ] Lost state has alert haptic

---

### Phase 3: Polish (Content)

#### 3.1 Pixel Art Assets

**Files to create:**
```
client/public/assets/
  sprites/
    gameplay.png + gameplay.json   # Hiker, trees, blazes
    ui.png + ui.json               # Buttons, bars, icons
    weather.png + weather.json     # Rain, fog particles
    terrain.png + terrain.json     # Trail, ground tiles
```

**Task breakdown:**

| Asset Set | Sprites Needed |
|-----------|----------------|
| Hiker | Walk 4 frames, idle 2 frames, tired variant |
| Trees | 3-5 variations, blaze attachment points |
| Blazes | Single, double, blue, cairn |
| Trail | Tileable path, ground tiles |
| Weather | Rain drop, fog overlay |
| UI | Status bar frame, buttons (normal/pressed/disabled), icons |

**Tool recommendation:** TexturePacker or free-tex-packer

**Files to modify:**
- `client/src/scenes/BootScene.ts` - Load atlases instead of generating

**Acceptance Criteria:**
- [ ] No placeholder rectangles visible
- [ ] Cohesive pixel art style
- [ ] Animations play smoothly
- [ ] Bundle size within budget (<2MB for sprites)

#### 3.2 Audio System

**Files to create:**
```
client/src/audio/
  AudioManager.ts
```

**Files to create:**
```
client/public/assets/audio/
  ambient/
    forest-day.ogg
    forest-night.ogg
    rain.ogg
    storm.ogg
  effects/
    footstep-1.mp3 through footstep-4.mp3
    eat.mp3
    drink.mp3
    alert.mp3
    success.mp3
  ui/
    button-tap.mp3
    menu-open.mp3
```

**Task breakdown:**

| Task | Details |
|------|---------|
| Create AudioManager | Volume controls, category muting |
| Ambient system | Loop forest sounds, crossfade weather |
| Footsteps | Variable by pace, pooled sounds |
| UI sounds | Button feedback, menu transitions |
| Settings integration | Master/effects/ambient volume |

**Acceptance Criteria:**
- [ ] Ambient audio plays during gameplay
- [ ] Weather sounds match weather state
- [ ] Volume controls work
- [ ] Audio respects system mute

#### 3.3 Inventory Scene

**Files to create:**
- `client/src/scenes/InventoryScene.ts`

**Layout:**
```
+------------------------------------------+
|  [X Close]       INVENTORY               |
+------------------------------------------+
|                                          |
|  GEAR (grid layout)                      |
|  [Backpack 95%] [Tent 90%] [Pad 85%]...  |
|                                          |
+------------------------------------------+
|  FOOD (list layout)                      |
|  Oatmeal (300 cal) x2                    |
|  Snickers (250 cal) x3                   |
|                                          |
+------------------------------------------+
|  WATER                                   |
|  [========--] 1.5 / 3.0 L                |
+------------------------------------------+
|  MONEY: $780                             |
+------------------------------------------+
```

**Acceptance Criteria:**
- [ ] All gear displays with condition
- [ ] All food displays with calories
- [ ] Water level visible
- [ ] Accessible via button/swipe
- [ ] Closes and returns to game

#### 3.4 Shelter Scene

**Files to create:**
- `client/src/scenes/ShelterScene.ts`

**Layout:**
```
+------------------------------------------+
|  [X Close]     SHELTER NAME              |
+------------------------------------------+
|                                          |
|  Capacity: 8 hikers                      |
|  Amenities: Privy, Water Source          |
|                                          |
+------------------------------------------+
|  [ENTER SHELTER]                         |
|  [ACCESS WATER]                          |
|  [SLEEP (8 hours)]                       |
+------------------------------------------+
```

**Task breakdown:**

| Task | Details |
|------|---------|
| Detect shelter proximity | Trigger notification at mile marker |
| Display shelter info | Name, capacity, amenities |
| Enter/exit actions | Update isResting, currentActivity |
| Water access | If available, refill option |
| Sleep action | Time advance, energy recovery |

**Acceptance Criteria:**
- [ ] Shelter UI appears at shelter locations
- [ ] Can enter and exit shelter
- [ ] Sleep advances time and restores energy
- [ ] Water source accessible if available

#### 3.5 Settings Scene

**Files to create:**
- `client/src/scenes/SettingsScene.ts`

**Settings:**
- Master volume
- Effects volume
- Ambient volume
- Haptic feedback toggle
- Credits/About

**Acceptance Criteria:**
- [ ] Settings accessible from menu
- [ ] Volume changes apply immediately
- [ ] Settings persist across sessions

---

### Phase 4: Deployment (Release)

#### 4.1 PWA Configuration

**Files to modify:**
- `client/vite.config.ts` - Add vite-plugin-pwa

**Files to create:**
- `client/public/icons/icon-192.png`
- `client/public/icons/icon-512.png`
- `client/public/apple-touch-icon.png`
- `client/public/favicon.ico`

**Task breakdown:**

| Task | Details |
|------|---------|
| Add vite-plugin-pwa | Configure Workbox |
| Create manifest | App name, colors, icons |
| Configure caching | Cache-first for assets |
| Test offline | Verify app works in airplane mode |

**Acceptance Criteria:**
- [ ] Lighthouse PWA audit passes
- [ ] App installable from mobile browser
- [ ] App works fully offline
- [ ] Cached assets load correctly

#### 4.2 Native Builds

**Task breakdown:**

| Task | Details |
|------|---------|
| iOS build | `npm run build:ios`, test in Simulator |
| Android build | `npm run build:android`, test in Emulator |
| Icon generation | All required sizes for both platforms |
| Splash screens | Configure in Capacitor |
| Sign iOS | Development + distribution certificates |
| Sign Android | Generate release keystore |

**Acceptance Criteria:**
- [ ] iOS IPA builds successfully
- [ ] Android APK/AAB builds successfully
- [ ] Apps install on physical devices
- [ ] Performance meets 60fps target

#### 4.3 Store Assets & Submission

**Assets needed:**

| Asset | iOS | Android |
|-------|-----|---------|
| App Icon | 1024x1024 (no alpha) | 512x512 |
| Screenshots | 6.5" and 5.5" | Phone + 7" tablet |
| Feature Graphic | -- | 1024x500 |
| App Preview Video | Optional | Optional |

**Store requirements:**
- Privacy policy URL
- App description
- Keywords/category
- Age rating questionnaire

**Acceptance Criteria:**
- [ ] iOS app submitted to App Store Connect
- [ ] Android app submitted to Google Play Console
- [ ] Apps approved and published

---

## 4. Risk Register

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| **Simulation drift** | High | High | Extract shared simulation first; extensive unit tests |
| **Offline persistence failure** | Medium | Critical | Test IndexedDB on all platforms; error recovery |
| **Touch input feels wrong** | Medium | High | Early device testing; iterative tuning |
| **60fps on low-end devices** | High | High | Phaser 3.90 Mobile Pipeline; object pooling; profiling |
| **Capacitor build issues** | Medium | Medium | Test native builds early, not last |
| **App Store rejection** | Medium | High | Follow guidelines strictly; privacy policy |
| **Art asset delays** | Medium | Medium | Start asset creation early; placeholders for dev |
| **iOS requires Mac** | High | Medium | Ensure Mac access for team member |
| **IndexedDB quota exceeded** | Low | Medium | Monitor save size; error handling |
| **Colyseus upgrade breaks schemas** | Low | Medium | Test multiplayer after upgrade |

---

## 5. Open Questions

### Blocking Questions (Need Answers Before Starting)

| # | Question | Owner | Impact if Unanswered |
|---|----------|-------|----------------------|
| 1 | Who creates pixel art assets? (in-house, purchase, commission) | Product | Blocks Phase 3 |
| 2 | Does Apple Developer account exist? ($99/year) | Product | Blocks iOS release |
| 3 | Does Google Play Console account exist? ($25 one-time) | Product | Blocks Android release |

### Non-Blocking Questions

| # | Question | Default Assumption |
|---|----------|-------------------|
| 4 | Audio assets - royalty-free or commission? | Use royalty-free initially |
| 5 | Domain for game (traillegs.game)? | Use hoggcountry.com subdomain |
| 6 | Server hosting budget? | Start with free tier (Render/Railway) |
| 7 | Is multiplayer required at launch? | Offline-only MVP acceptable |
| 8 | Testing devices available? | Use simulators + 1-2 physical devices |

---

## 6. Files to Create/Modify

### New Files (Create)

```
shared/src/simulation/
  index.ts
  hiking.ts
  resting.ts
  navigation.ts
  status.ts
  skills.ts
  weather.ts
  constants.ts

client/src/storage/
  GameStorage.ts
  SaveManager.ts
  SyncQueue.ts
  types.ts

client/src/input/
  InputManager.ts
  KeyboardInput.ts
  TouchInput.ts
  types.ts

client/src/controllers/
  GameController.ts
  types.ts

client/src/adapters/
  IGameAdapter.ts
  OnlineAdapter.ts
  OfflineAdapter.ts
  ConnectionManager.ts

client/src/audio/
  AudioManager.ts

client/src/ui/layouts/
  PortraitLayout.ts
  LandscapeLayout.ts

client/src/ui/components/
  StatusBar.ts
  Button.ts
  QuickActionBar.ts
  MoodleRow.ts

client/src/scenes/
  InventoryScene.ts
  SettingsScene.ts
  ShelterScene.ts

client/src/utils/
  platform.ts
  responsive.ts

client/capacitor.config.ts
client/public/manifest.json (via vite-plugin-pwa)

vitest.config.ts
playwright.config.ts

shared/src/simulation/__tests__/*.test.ts
client/src/storage/__tests__/*.test.ts
e2e/*.spec.ts
```

### Existing Files (Modify)

```
package.json (root)         - Add test scripts, upgrade deps
shared/package.json         - Add localforage, build scripts
client/package.json         - Add Capacitor, build scripts
server/package.json         - Upgrade Colyseus

client/vite.config.ts       - Add PWA plugin, mobile config
client/src/main.ts          - Phaser WebGL config, remove physics

client/src/scenes/BootScene.ts   - Load texture atlases
client/src/scenes/MenuScene.ts   - Touch-friendly character select
client/src/scenes/GameScene.ts   - Major refactor (rendering only)
client/src/scenes/UIScene.ts     - Major refactor (responsive)

server/src/rooms/TrailRoom.ts    - Use shared simulation
server/src/index.ts              - Add CORS, rate limiting
```

---

## 7. Definition of Done

### Phase 0: Setup
- [ ] All dependencies upgraded
- [ ] `npm run build` succeeds
- [ ] `npm run test` runs (even with 0 tests)
- [ ] Phaser configured for WebGL mobile

### Phase 1: Architecture
- [ ] Shared simulation package complete with 90%+ test coverage
- [ ] IndexedDB persistence works across page reloads
- [ ] Auto-save triggers every 60 seconds
- [ ] Offline mode uses shared simulation (identical behavior)
- [ ] GameScene has no Colyseus imports

### Phase 2: Mobile
- [ ] All actions achievable via touch
- [ ] UI readable on 320px screens
- [ ] Touch targets 44pt minimum
- [ ] App runs on iOS Simulator
- [ ] App runs on Android Emulator
- [ ] Haptic feedback on native

### Phase 3: Polish
- [ ] No placeholder graphics visible
- [ ] Audio plays appropriately
- [ ] Inventory scene functional
- [ ] Shelter interaction works
- [ ] Settings persist

### Phase 4: Deployment
- [ ] PWA installable and works offline
- [ ] iOS app builds and runs
- [ ] Android app builds and runs
- [ ] 60fps on target devices
- [ ] <50MB app bundle
- [ ] Apps submitted to stores

### Overall Done
- [ ] All Phase 0-4 items complete
- [ ] E2E smoke tests pass
- [ ] No P0 bugs open
- [ ] Documentation updated
- [ ] Apps published and accessible

---

## Appendix: Quick Reference

### Build Commands

```bash
# Development
npm run dev              # Start client + server

# Testing
npm run test             # Run unit tests
npm run test:e2e         # Run Playwright tests

# Building
npm run build            # Build all packages
npm run build:ios        # Build + sync iOS
npm run build:android    # Build + sync Android

# Native development
npx cap open ios         # Open Xcode
npx cap open android     # Open Android Studio
npx cap run ios          # Run on iOS device
npx cap run android      # Run on Android device
```

### Key File Locations

| Purpose | Location |
|---------|----------|
| Game simulation logic | `shared/src/simulation/` |
| IndexedDB persistence | `client/src/storage/GameStorage.ts` |
| Touch input handling | `client/src/input/TouchInput.ts` |
| Game state management | `client/src/controllers/GameController.ts` |
| Online/offline switching | `client/src/adapters/ConnectionManager.ts` |
| Capacitor config | `client/capacitor.config.ts` |
| PWA manifest | Generated by vite-plugin-pwa |

---

*End of Implementation Plan*
