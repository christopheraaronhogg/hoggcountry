# Architecture Design: Trail Legs Build-Out

**Document Type:** Architecture Assessment
**Version:** 1.0
**Date:** 2026-01-07
**Consultant:** Claude Software Architect

---

## 1. Current Architecture Summary

### 1.1 System Overview

Trail Legs is a multiplayer hiking simulation game with a monorepo structure containing three packages:

```
trailhogg/
  client/         # Phaser 3 game client (Vite build)
  server/         # Colyseus multiplayer server (Express)
  shared/         # Common types and utilities
```

### 1.2 Current Technology Stack

| Layer | Technology | Version | Purpose |
|-------|------------|---------|---------|
| Game Engine | Phaser | 3.70.0 | Client-side game rendering |
| Multiplayer | Colyseus | 0.15.0 | Real-time state sync |
| Build Tool | Vite | 5.0.0 | Client bundling |
| Server Runtime | Node.js | - | Server execution |
| Type System | TypeScript | 5.3.3 | Type safety |

### 1.3 Current Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                        CLIENT                                │
│  ┌───────────────────────────────────────────────────────┐  │
│  │                    Phaser Game                         │  │
│  │  ┌─────────┐  ┌──────────┐  ┌────────┐  ┌─────────┐  │  │
│  │  │BootScene│->│MenuScene │->│GameScene│<>│UIScene  │  │  │
│  │  └─────────┘  └──────────┘  └────┬───┘  └────┬────┘  │  │
│  │                                  │           │        │  │
│  │                    Event Bus ────┴───────────┘        │  │
│  └───────────────────────┬───────────────────────────────┘  │
│                          │                                   │
│                 ┌────────▼────────┐                         │
│                 │ Colyseus Client │                         │
│                 └────────┬────────┘                         │
└──────────────────────────┼──────────────────────────────────┘
                           │ WebSocket
                           │
┌──────────────────────────▼──────────────────────────────────┐
│                        SERVER                                │
│  ┌───────────────────────────────────────────────────────┐  │
│  │                   Colyseus Server                      │  │
│  │  ┌──────────┐  ┌───────────────────────────────────┐  │  │
│  │  │TrailRoom │  │        GameRoomState              │  │  │
│  │  │          │  │  ┌──────────┐  ┌───────────────┐  │  │  │
│  │  │ - Game   │  │  │HikerSchema│  │EventSchema   │  │  │  │
│  │  │   Loop   │  │  │          │  │              │  │  │  │
│  │  │ - State  │──│  │SkillsSchema│ │GameTimeSchema│  │  │  │
│  │  │   Sync   │  │  │MoodlesSchema│              │  │  │  │
│  │  └──────────┘  │  │InventorySchema             │  │  │  │
│  │                │  └──────────┘  └───────────────┘  │  │  │
│  │                └───────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌──────────────────────────────────────────────────────────────┐
│                       SHARED                                  │
│  ┌─────────────┐  ┌──────────────┐  ┌───────────────────┐   │
│  │   types.ts  │  │ trailData.ts │  │    index.ts       │   │
│  │ (enums,     │  │ (shelters,   │  │ (exports)         │   │
│  │  interfaces)│  │  segments)   │  │                   │   │
│  └─────────────┘  └──────────────┘  └───────────────────┘   │
└──────────────────────────────────────────────────────────────┘
```

### 1.4 Data Flow Analysis

**Current Online Mode:**
1. GameScene connects to Colyseus server via WebSocket
2. Client sends messages (`start_hiking`, `set_pace`, `eat`, etc.)
3. Server processes in TrailRoom game loop (100ms tick)
4. Server updates GameRoomState (Colyseus Schema)
5. State changes auto-sync to all clients
6. GameScene receives `onStateChange` callback
7. GameScene emits `state-update` event to UIScene

**Current Offline Mode (Basic):**
1. GameScene catches connection failure
2. Creates local `hikerData` object
3. Runs `offlineTick()` via Phaser timer (100ms)
4. Emits `state-update` events locally
5. NO persistence - state lost on page close

### 1.5 Key Files Summary

| File | Purpose | Lines | Complexity |
|------|---------|-------|------------|
| `client/src/scenes/GameScene.ts` | Main game logic, rendering, offline sim | ~530 | High |
| `client/src/scenes/UIScene.ts` | HUD rendering, event display | ~320 | Medium |
| `client/src/scenes/BootScene.ts` | Asset generation (placeholders) | ~145 | Low |
| `server/src/rooms/TrailRoom.ts` | Authoritative game loop, all game logic | ~695 | High |
| `server/src/schema/GameState.ts` | Colyseus state schemas | ~126 | Low |
| `shared/src/types.ts` | Enums, interfaces, constants | ~280 | Low |

---

## 2. Component Boundaries

### 2.1 Current Boundary Issues

The existing codebase has several architectural concerns that must be addressed:

**Problem 1: Duplicated Game Logic**
Game simulation logic exists in both:
- `TrailRoom.ts` (server-side, ~700 lines)
- `GameScene.ts` (`offlineTick()`, ~100 lines)

This duplication will diverge and cause inconsistencies.

**Problem 2: Monolithic GameScene**
`GameScene.ts` handles:
- Visual rendering (sprites, weather effects)
- Game state management
- Offline simulation
- Input handling (keyboard)
- Colyseus connection management
- Camera control

This violates Single Responsibility Principle.

**Problem 3: No Persistence Layer**
Offline mode has no save capability. State is stored in-memory only.

### 2.2 Recommended Component Boundaries

```
┌─────────────────────────────────────────────────────────────────┐
│                     PRESENTATION LAYER                          │
│  ┌─────────────┐  ┌────────────┐  ┌────────────┐  ┌─────────┐  │
│  │ GameScene   │  │ UIScene    │  │ Inventory  │  │Settings │  │
│  │ (rendering) │  │ (HUD)      │  │ Scene      │  │ Scene   │  │
│  └──────┬──────┘  └─────┬──────┘  └─────┬──────┘  └────┬────┘  │
│         │               │               │               │       │
└─────────┼───────────────┼───────────────┼───────────────┼───────┘
          │               │               │               │
          └───────────────┴───────────────┴───────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                     INPUT LAYER                                  │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  │
│  │ KeyboardInput   │  │ TouchInput      │  │ GestureHandler  │  │
│  │ (existing)      │  │ (NEW)           │  │ (NEW)           │  │
│  └────────┬────────┘  └────────┬────────┘  └────────┬────────┘  │
│           └────────────────────┼────────────────────┘           │
└────────────────────────────────┼────────────────────────────────┘
                                 ▼
┌─────────────────────────────────────────────────────────────────┐
│                     GAME LOGIC LAYER                             │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │                    GameController                           ││
│  │  - Receives player commands (abstract input)                ││
│  │  - Routes to online OR offline simulation                   ││
│  │  - Emits state updates to presentation layer                ││
│  └─────────────────────────────┬───────────────────────────────┘│
│                                │                                 │
│  ┌─────────────────────────────▼───────────────────────────────┐│
│  │                   HikerSimulation (SHARED)                  ││
│  │  - Extracted from TrailRoom.ts                              ││
│  │  - Pure functions: processHiking(), processResting(), etc.  ││
│  │  - Used by both server AND client offline mode              ││
│  └─────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────┐
│                     CONNECTIVITY LAYER                           │
│  ┌─────────────────────┐              ┌────────────────────┐    │
│  │ OnlineAdapter       │              │ OfflineAdapter     │    │
│  │ - Colyseus client   │              │ - Local simulation │    │
│  │ - Server state sync │              │ - Uses HikerSim    │    │
│  └──────────┬──────────┘              └──────────┬─────────┘    │
│             │                                     │              │
│             └──────────────┬──────────────────────┘              │
│                            ▼                                     │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │                  ConnectionManager                          ││
│  │  - Detects online/offline                                   ││
│  │  - Switches adapters seamlessly                             ││
│  │  - Handles reconnection                                     ││
│  └─────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────┐
│                     PERSISTENCE LAYER                            │
│  ┌─────────────────────┐  ┌─────────────────┐  ┌──────────────┐ │
│  │ GameStorage         │  │ SaveManager     │  │ SyncQueue    │ │
│  │ (IndexedDB via      │  │ - Auto-save     │  │ - Offline    │ │
│  │  localforage)       │  │ - Manual save   │  │   actions    │ │
│  │                     │  │ - Load state    │  │ - Future sync│ │
│  └─────────────────────┘  └─────────────────┘  └──────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

### 2.3 Clear Responsibility Matrix

| Component | Responsibility | Does NOT Handle |
|-----------|---------------|-----------------|
| GameScene | Sprite rendering, camera, visual effects | Game logic, state management |
| UIScene | HUD display, event log | User input handling |
| TouchInput | Gesture recognition, tap detection | Game commands |
| GameController | Command routing, adapter selection | Simulation math |
| HikerSimulation | Pure game calculations | I/O, rendering |
| GameStorage | IndexedDB CRUD operations | Save timing |
| SaveManager | Auto-save scheduling, state serialization | Storage details |

---

## 3. State Management Architecture

### 3.1 State Types

The build-out introduces three distinct state contexts:

```
┌──────────────────────────────────────────────────────────────┐
│                     STATE CONTEXTS                            │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  1. AUTHORITATIVE STATE (Server)                             │
│     - Lives in: TrailRoom.GameRoomState                      │
│     - Source of truth when online                            │
│     - Synced via Colyseus schemas                            │
│                                                               │
│  2. LOCAL STATE (Client Memory)                              │
│     - Lives in: GameController.currentState                  │
│     - Mirror of server state when online                     │
│     - Becomes authoritative when offline                     │
│     - Drives all rendering                                   │
│                                                               │
│  3. PERSISTED STATE (IndexedDB)                              │
│     - Lives in: localforage store                            │
│     - Snapshot of local state                                │
│     - Survives app restarts                                  │
│     - Contains: hikerData, gameState, settings               │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

### 3.2 State Flow Diagrams

**Scenario A: Online Play**

```
User Action
     │
     ▼
┌────────────┐     ┌────────────┐     ┌─────────────┐
│ TouchInput │────>│ GameCtrl   │────>│ Colyseus    │
│            │     │            │     │ Client      │
└────────────┘     └────────────┘     └──────┬──────┘
                                             │
                                    WebSocket│
                                             ▼
                                      ┌──────────────┐
                                      │ TrailRoom    │
                                      │ (Server)     │
                                      └──────┬───────┘
                                             │
                                    State    │ Sync
                                             ▼
┌────────────┐     ┌────────────┐     ┌─────────────┐
│ GameScene  │<────│ GameCtrl   │<────│ onStateChg  │
│ (render)   │     │ localState │     │ callback    │
└────────────┘     └─────┬──────┘     └─────────────┘
                         │
                    Auto-save (60s)
                         │
                         ▼
                  ┌──────────────┐
                  │ IndexedDB    │
                  └──────────────┘
```

**Scenario B: Offline Play**

```
User Action
     │
     ▼
┌────────────┐     ┌────────────┐     ┌─────────────┐
│ TouchInput │────>│ GameCtrl   │────>│ Offline     │
│            │     │            │     │ Adapter     │
└────────────┘     └────────────┘     └──────┬──────┘
                                             │
                                   HikerSimulation
                                             │
                                             ▼
┌────────────┐     ┌────────────┐     ┌─────────────┐
│ GameScene  │<────│ GameCtrl   │<────│ Updated     │
│ (render)   │     │ localState │     │ State       │
└────────────┘     └─────┬──────┘     └─────────────┘
                         │
                    Auto-save (60s)
                         │
                         ▼
                  ┌──────────────┐
                  │ IndexedDB    │
                  │ + SyncQueue  │
                  └──────────────┘
```

**Scenario C: App Launch (Resume)**

```
App Start
     │
     ▼
┌────────────────────────────────────┐
│ BootScene                          │
│ 1. Load assets                     │
│ 2. Check IndexedDB for saved game  │
└────────────────┬───────────────────┘
                 │
        ┌────────┴────────┐
        │                 │
   Has Save?         No Save
        │                 │
        ▼                 ▼
┌───────────────┐  ┌───────────────┐
│ Load State    │  │ MenuScene     │
│ from IDB      │  │ (new game)    │
└───────┬───────┘  └───────────────┘
        │
        ▼
┌───────────────┐
│ Check Online? │
└───────┬───────┘
        │
   ┌────┴────┐
   │         │
Online    Offline
   │         │
   ▼         ▼
┌───────────────┐  ┌───────────────┐
│ Connect to    │  │ Resume with   │
│ server, sync  │  │ local state   │
└───────────────┘  └───────────────┘
```

### 3.3 State Schema (Persistence)

```typescript
// Storage schema for IndexedDB
interface SavedGameState {
  version: number;              // Schema version for migrations
  savedAt: number;              // Unix timestamp

  hiker: {
    id: string;
    name: string;
    build: string;
    mile: number;
    elevation: number;
    calories: number;
    hydration: number;
    energy: number;
    health: number;
    pace: string;
    lostState: string;
    lastBlazeSeenMile: number;
    isHiking: boolean;
    isResting: boolean;
    totalMilesHiked: number;
    daysOnTrail: number;
    currentDayMiles: number;
    skills: Skills;
    moodles: Moodles;
    inventory: Inventory;
  };

  game: {
    time: { day: number; hour: number; minute: number };
    phase: string;
    weather: string;
    temperature: number;
  };

  syncQueue: QueuedAction[];    // Actions pending server sync
}

interface QueuedAction {
  id: string;                   // UUID for idempotency
  type: string;                 // Action type
  payload: any;                 // Action data
  timestamp: number;            // When action occurred
}
```

### 3.4 Settings Storage (Separate from Game State)

```typescript
interface UserSettings {
  audio: {
    masterVolume: number;       // 0-1
    effectsVolume: number;      // 0-1
    ambientVolume: number;      // 0-1
    musicVolume: number;        // 0-1
  };
  haptics: boolean;             // Enable vibration feedback
  showFPS: boolean;             // Debug overlay
  orientation: 'auto' | 'portrait' | 'landscape';
}
```

---

## 4. Module Structure

### 4.1 Recommended File Organization

```
trailhogg/
├── client/
│   ├── capacitor.config.ts           # NEW: Capacitor settings
│   ├── manifest.json                 # NEW: PWA manifest
│   ├── index.html
│   ├── package.json
│   ├── vite.config.ts                # MODIFY: Add PWA plugin
│   │
│   ├── public/
│   │   └── assets/
│   │       ├── sprites/              # NEW: Pixel art spritesheets
│   │       │   ├── hiker.png
│   │       │   ├── hiker.json        # Texture atlas
│   │       │   ├── environment.png
│   │       │   ├── environment.json
│   │       │   └── ui.png
│   │       ├── audio/                # NEW: Sound files
│   │       │   ├── ambient/
│   │       │   ├── effects/
│   │       │   └── ui/
│   │       └── icons/                # NEW: App icons
│   │
│   └── src/
│       ├── main.ts                   # Entry point
│       │
│       ├── config/
│       │   └── game.config.ts        # Phaser config extraction
│       │
│       ├── scenes/
│       │   ├── BootScene.ts          # MODIFY: Load real assets
│       │   ├── MenuScene.ts
│       │   ├── GameScene.ts          # REFACTOR: Rendering only
│       │   ├── UIScene.ts            # REFACTOR: Touch-friendly
│       │   ├── InventoryScene.ts     # NEW
│       │   ├── SettingsScene.ts      # NEW
│       │   └── ShelterScene.ts       # NEW: Shelter interaction
│       │
│       ├── controllers/              # NEW
│       │   ├── GameController.ts     # Central game state manager
│       │   └── SaveController.ts     # Auto-save orchestration
│       │
│       ├── adapters/                 # NEW
│       │   ├── OnlineAdapter.ts      # Colyseus wrapper
│       │   └── OfflineAdapter.ts     # Local simulation runner
│       │
│       ├── input/                    # NEW
│       │   ├── InputManager.ts       # Unified input handling
│       │   ├── KeyboardInput.ts      # Keyboard bindings
│       │   └── TouchInput.ts         # Touch gestures
│       │
│       ├── storage/                  # NEW
│       │   ├── GameStorage.ts        # IndexedDB operations
│       │   ├── SaveManager.ts        # Save/load logic
│       │   └── SyncQueue.ts          # Offline action queue
│       │
│       ├── audio/                    # NEW
│       │   └── AudioManager.ts       # Sound system
│       │
│       ├── ui/                       # NEW
│       │   ├── components/           # Reusable UI pieces
│       │   │   ├── StatusBar.ts
│       │   │   ├── Button.ts
│       │   │   └── Modal.ts
│       │   └── layouts/              # Responsive layouts
│       │       ├── PortraitLayout.ts
│       │       └── LandscapeLayout.ts
│       │
│       └── utils/
│           ├── platform.ts           # NEW: Platform detection
│           └── responsive.ts         # NEW: Screen size utils
│
├── server/
│   ├── src/
│   │   ├── index.ts
│   │   ├── rooms/
│   │   │   └── TrailRoom.ts          # REFACTOR: Use shared sim
│   │   ├── schema/
│   │   │   └── GameState.ts
│   │   └── systems/                  # Existing (may remove)
│   │       ├── WeatherSystem.ts
│   │       ├── HikerSimulation.ts
│   │       └── NavigationSystem.ts
│   └── package.json
│
├── shared/                           # EXPAND
│   ├── src/
│   │   ├── index.ts
│   │   ├── types.ts
│   │   ├── trailData.ts
│   │   │
│   │   ├── simulation/               # NEW: Extracted game logic
│   │   │   ├── index.ts
│   │   │   ├── hiking.ts             # processHiking()
│   │   │   ├── resting.ts            # processResting()
│   │   │   ├── navigation.ts         # lost/found logic
│   │   │   ├── status.ts             # moodle calculations
│   │   │   ├── skills.ts             # skill XP calculations
│   │   │   └── weather.ts            # weather transitions
│   │   │
│   │   └── constants/                # NEW: Shared constants
│   │       ├── pace.ts
│   │       ├── weather.ts
│   │       └── builds.ts
│   │
│   └── package.json
│
├── ios/                              # NEW: Capacitor iOS
│   └── (generated by Capacitor)
│
├── android/                          # NEW: Capacitor Android
│   └── (generated by Capacitor)
│
└── package.json
```

### 4.2 Import Dependency Rules

To maintain clean architecture, enforce these import rules:

```typescript
// ALLOWED IMPORTS:

// Scenes can import:
//   - controllers/*
//   - ui/components/*
//   - audio/*
//   - utils/*
//   - @trail-legs/shared (types only)

// Controllers can import:
//   - adapters/*
//   - storage/*
//   - @trail-legs/shared

// Adapters can import:
//   - @trail-legs/shared
//   - colyseus.js (OnlineAdapter only)

// Storage can import:
//   - @trail-legs/shared (types only)
//   - localforage

// Shared package:
//   - NO external dependencies (except TypeScript)
//   - Can be used by both client and server

// FORBIDDEN IMPORTS:
//   - Scenes should NOT import colyseus.js directly
//   - Controllers should NOT import Phaser
//   - Storage should NOT import game logic
```

---

## 5. Integration Points

### 5.1 Capacitor Integration

```
┌─────────────────────────────────────────────────────────────┐
│                    WEB APPLICATION                          │
│  ┌────────────────────────────────────────────────────────┐ │
│  │                    Vite Build                          │ │
│  │  ┌─────────────────────────────────────────────────┐   │ │
│  │  │ Phaser Game + Colyseus Client + Storage Layer │   │ │
│  │  └─────────────────────────────────────────────────┘   │ │
│  └──────────────────────────┬─────────────────────────────┘ │
└─────────────────────────────┼───────────────────────────────┘
                              │
              ┌───────────────┼───────────────┐
              │               │               │
              ▼               ▼               ▼
       ┌──────────┐    ┌──────────┐    ┌──────────┐
       │   Web    │    │   iOS    │    │ Android  │
       │ Browser  │    │ WKWebView│    │ WebView  │
       └──────────┘    └────┬─────┘    └────┬─────┘
                            │               │
                    ┌───────▼───────────────▼───────┐
                    │     Capacitor Bridge          │
                    │  - @capacitor/haptics         │
                    │  - @capacitor/status-bar      │
                    │  - @capacitor/splash-screen   │
                    │  - @capacitor/app             │
                    └───────────────────────────────┘
```

**Key Capacitor Plugins Required:**

| Plugin | Purpose |
|--------|---------|
| `@capacitor/core` | Core runtime |
| `@capacitor/haptics` | Touch feedback |
| `@capacitor/status-bar` | Hide status bar for immersion |
| `@capacitor/splash-screen` | Native loading screen |
| `@capacitor/app` | App lifecycle (background/foreground) |

**Platform Detection Pattern:**

```typescript
// src/utils/platform.ts
import { Capacitor } from '@capacitor/core';

export const platform = {
  isNative: Capacitor.isNativePlatform(),
  isIOS: Capacitor.getPlatform() === 'ios',
  isAndroid: Capacitor.getPlatform() === 'android',
  isWeb: Capacitor.getPlatform() === 'web',
  isMobile: /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)
};
```

### 5.2 PWA Integration

**Service Worker Strategy:**

```typescript
// vite.config.ts with vite-plugin-pwa
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        globPatterns: ['**/*.{js,css,html,png,json,mp3,ogg}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/.*\.(?:png|json)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'asset-cache',
              expiration: { maxEntries: 100 }
            }
          }
        ]
      },
      manifest: {
        name: 'Trail Legs',
        short_name: 'TrailLegs',
        theme_color: '#355E3B',
        background_color: '#1a1a1a',
        display: 'fullscreen',
        orientation: 'any',
        icons: [/* icon array */]
      }
    })
  ]
});
```

### 5.3 Storage Integration

**Storage Access Pattern:**

```typescript
// src/storage/GameStorage.ts
import localforage from 'localforage';

const gameStore = localforage.createInstance({
  name: 'trail-legs',
  storeName: 'game_saves'
});

const settingsStore = localforage.createInstance({
  name: 'trail-legs',
  storeName: 'settings'
});

export class GameStorage {
  static async saveGame(state: SavedGameState): Promise<void> {
    await gameStore.setItem('current', state);
  }

  static async loadGame(): Promise<SavedGameState | null> {
    return gameStore.getItem<SavedGameState>('current');
  }

  static async saveSettings(settings: UserSettings): Promise<void> {
    await settingsStore.setItem('user', settings);
  }

  static async loadSettings(): Promise<UserSettings | null> {
    return settingsStore.getItem<UserSettings>('user');
  }
}
```

---

## 6. Architectural Concerns

### 6.1 Critical Issues

| # | Issue | Severity | Risk | Mitigation |
|---|-------|----------|------|------------|
| 1 | **Duplicated game logic** | High | Logic drift between server and client offline mode | Extract to shared `simulation/` package |
| 2 | **No state persistence** | High | Users lose progress on app close | Implement IndexedDB layer before other features |
| 3 | **Monolithic GameScene** | Medium | Hard to add touch controls without breaking existing code | Refactor to separate rendering from logic |
| 4 | **Hardcoded dimensions** | Medium | 800x600 won't work on all devices | Implement responsive scaling |
| 5 | **Colyseus in GameScene** | Medium | Tight coupling prevents clean offline mode | Introduce adapter pattern |

### 6.2 Technical Debt to Address

1. **Placeholder Assets in Code**
   BootScene generates assets programmatically. This must be replaced with actual asset loading, but keep the generator as a fallback for development.

2. **Magic Numbers**
   TrailRoom contains hardcoded values (TRAIL_END_MILE = 30.7, tick rates, pace speeds). Move to shared constants.

3. **Missing Error Handling**
   - Colyseus connection errors have basic catch block
   - No retry logic for connection drops
   - Storage errors not handled

4. **Type Safety Gaps**
   - `hikerData: any` in GameScene
   - `(hiker.skills as any)[skill]` pattern in TrailRoom
   - Should leverage shared types properly

### 6.3 Scalability Considerations

**Current Limitations:**
- Single Colyseus room handles all players
- No horizontal scaling strategy
- All game state in memory

**Future-Proofing (Not Implemented Now):**
- Room should support multiple instances
- Consider Redis for state sharing if scaling needed
- Document sync protocol for cloud saves

---

## 7. Recommendations

### 7.1 Implementation Priority Order

```
PHASE 1: FOUNDATION (Do First)
┌─────────────────────────────────────────────────────────────┐
│ 1. Extract shared simulation logic                          │
│    - Create shared/simulation/* modules                     │
│    - Refactor TrailRoom to use shared functions             │
│    - Update client offline mode to use same functions       │
│                                                              │
│ 2. Implement persistence layer                              │
│    - Add localforage dependency                             │
│    - Create GameStorage class                               │
│    - Add SaveManager with auto-save                         │
│    - Modify BootScene to check for saved game               │
│                                                              │
│ 3. Refactor GameScene                                       │
│    - Extract input handling to InputManager                 │
│    - Extract Colyseus logic to adapters                     │
│    - Keep only rendering in GameScene                       │
└─────────────────────────────────────────────────────────────┘

PHASE 2: MOBILE (After Foundation)
┌─────────────────────────────────────────────────────────────┐
│ 4. Add touch input system                                   │
│    - Create TouchInput class                                │
│    - Add gesture recognition                                │
│    - Ensure InputManager routes touch to same commands      │
│                                                              │
│ 5. Make UI responsive                                       │
│    - Create responsive layout components                    │
│    - Add safe area handling                                 │
│    - Test portrait and landscape                            │
│                                                              │
│ 6. Add Capacitor                                            │
│    - Install Capacitor and plugins                          │
│    - Configure iOS and Android projects                     │
│    - Add PWA support for mobile web                         │
└─────────────────────────────────────────────────────────────┘

PHASE 3: POLISH (After Mobile)
┌─────────────────────────────────────────────────────────────┐
│ 7. Replace placeholder graphics                             │
│    - Create/acquire pixel art assets                        │
│    - Modify BootScene to load from files                    │
│    - Update sprite references in GameScene                  │
│                                                              │
│ 8. Add audio system                                         │
│    - Create AudioManager                                    │
│    - Add ambient and effect sounds                          │
│    - Integrate with game events                             │
│                                                              │
│ 9. Add new scenes                                           │
│    - InventoryScene                                         │
│    - SettingsScene                                          │
│    - ShelterScene                                           │
└─────────────────────────────────────────────────────────────┘
```

### 7.2 Architectural Patterns to Follow

**Pattern 1: Adapter Pattern for Connectivity**

```typescript
interface IGameAdapter {
  connect(): Promise<void>;
  disconnect(): void;
  sendCommand(type: string, payload?: any): void;
  onStateChange(callback: (state: GameState) => void): void;
  isOnline(): boolean;
}

class OnlineAdapter implements IGameAdapter { /* Colyseus */ }
class OfflineAdapter implements IGameAdapter { /* Local sim */ }
```

**Pattern 2: Event-Driven Communication**

```typescript
// Use Phaser's event system for loose coupling
class GameController {
  constructor(scene: Phaser.Scene) {
    this.events = new Phaser.Events.EventEmitter();
  }

  // Other components subscribe
  this.events.emit('state-update', newState);
  this.events.emit('game-event', { type, message });
}
```

**Pattern 3: Command Pattern for Input**

```typescript
interface GameCommand {
  type: 'START_HIKING' | 'STOP_HIKING' | 'SET_PACE' | 'EAT' | 'DRINK';
  payload?: any;
}

// Input handlers emit commands, not call methods directly
inputManager.on('command', (cmd: GameCommand) => {
  gameController.executeCommand(cmd);
});
```

### 7.3 ADRs (Architecture Decision Records)

#### ADR-001: Use LocalForage for Storage

**Status:** Proposed
**Context:** Need offline persistence that works in browsers and Capacitor.
**Decision:** Use `localforage` library for IndexedDB abstraction.
**Consequences:**
- (+) Unified API across platforms
- (+) Automatic fallback to localStorage/WebSQL
- (+) Promise-based, TypeScript friendly
- (-) Adds ~8KB to bundle
**Alternatives:** Raw IndexedDB, Dexie.js

#### ADR-002: Extract Simulation to Shared Package

**Status:** Proposed
**Context:** Game logic duplicated between server and client.
**Decision:** Move pure simulation functions to `@trail-legs/shared/simulation`.
**Consequences:**
- (+) Single source of truth for game rules
- (+) Offline mode behaves identically to server
- (+) Easier testing of game logic
- (-) Requires careful management of state mutations
**Alternatives:** Keep duplication, accept drift

#### ADR-003: Adapter Pattern for Online/Offline

**Status:** Proposed
**Context:** Need seamless switching between online and offline play.
**Decision:** Abstract connectivity behind IGameAdapter interface.
**Consequences:**
- (+) GameController doesn't know about Colyseus
- (+) Can add new backends (e.g., P2P) later
- (+) Testable with mock adapters
- (-) Additional abstraction layer
**Alternatives:** Keep Colyseus in GameScene with offline fallback

#### ADR-004: Phaser for Responsive UI

**Status:** Proposed
**Context:** Need touch-friendly UI that scales across devices.
**Decision:** Use Phaser's built-in Scale Manager, not CSS-based responsive.
**Consequences:**
- (+) Single coordinate system for game and UI
- (+) Consistent behavior across platforms
- (-) Must implement all responsive logic manually
- (-) Cannot use CSS media queries
**Alternatives:** HTML overlay for UI, Phaser for game only

---

## 8. Summary

### Current State

The Trail Legs MVP has a solid foundation with working Phaser rendering and Colyseus multiplayer. The core game mechanics are implemented and functional. However, the codebase is not production-ready due to:

- No offline persistence
- Duplicated game logic
- Desktop-only input handling
- Monolithic scene structure

### Required Changes

1. **Extract and Share** - Move simulation logic to shared package
2. **Persist and Resume** - Add IndexedDB storage layer
3. **Abstract and Adapt** - Create adapter pattern for online/offline
4. **Respond and Scale** - Make UI responsive and touch-friendly
5. **Wrap and Deploy** - Add Capacitor for native builds

### Estimated Complexity

| Work Area | Effort | Risk |
|-----------|--------|------|
| Shared simulation extraction | Medium | Low |
| Persistence layer | Low | Low |
| GameScene refactoring | High | Medium |
| Touch input system | Medium | Low |
| Responsive UI | High | Medium |
| Capacitor integration | Low | Low |
| Asset replacement | Medium (external) | Low |
| Audio system | Low | Low |

### Final Recommendation

Begin with Phase 1 (Foundation) before any mobile or polish work. The shared simulation extraction and persistence layer are prerequisites for reliable offline play. Without these, subsequent work builds on an unstable foundation.

The refactoring is significant but necessary. The current architecture cannot support the PRD requirements without these changes.

---

*End of Architecture Assessment*
