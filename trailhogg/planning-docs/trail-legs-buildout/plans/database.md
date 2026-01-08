# Database/Storage Assessment: Trail Legs Build-Out

**Project:** Trail Legs MVP Build-Out
**Date:** 2026-01-07
**Consultant:** Claude Database Consultant
**Scope:** Client-side game storage, offline persistence, sync-ready architecture

---

## Executive Summary

Trail Legs is a Phaser 3/Colyseus multiplayer game that requires offline-first storage for mobile deployment. The current prototype has well-structured TypeScript types and Colyseus schema definitions, but lacks persistent client-side storage. The PRD specifies IndexedDB persistence via localforage, auto-save functionality, and foundation for future cloud sync.

This assessment evaluates the existing data structures, recommends IndexedDB schema design, defines save game formats, and establishes patterns for sync-ready data architecture. The goal is 100% offline functionality with seamless online sync when connectivity returns.

The data model is relatively simple for a game (single-player focus with optional multiplayer), making IndexedDB an appropriate choice. Primary concerns are save/load reliability, efficient static data loading, and conflict resolution patterns for future sync.

---

## Storage Health Score: 6/10

| Category | Score | Notes |
|----------|-------|-------|
| Data Model Design | 8/10 | Well-typed, clear separation of concerns |
| Client Persistence | 2/10 | Currently non-existent |
| Save/Load System | 3/10 | Offline mode exists but ephemeral |
| Sync Readiness | 4/10 | Timestamps needed, no action queue |
| Static Data Loading | 7/10 | Good structure, could optimize |
| Schema Evolution | 5/10 | No versioning strategy |

---

## 1. Current Data Model Analysis

### 1.1 Entity Inventory

The game defines the following core entities:

```
+-------------------+     +-------------------+
|   GameRoomState   |     |    HikerSchema    |
+-------------------+     +-------------------+
| time: GameTime    |     | id, name          |
| phase             |     | mile, elevation   |
| weather           |     | calories, etc.    |
| temperature       |     | skills            |
| hikers (Map)      |-----| moodles           |
| events[]          |     | inventory         |
| isPaused          |     | isHiking, etc.    |
+-------------------+     +-------------------+
                                   |
                    +--------------+--------------+
                    |              |              |
            +-------+----+  +------+-----+  +-----+------+
            | SkillsSchema| | MoodlesSchema| |InventorySchema|
            +------------+  +------------+  +--------------+
            | trailLegs  |  | hunger     |  | gear[]      |
            | navigation |  | thirst     |  | food[]      |
            | ...10 total|  | ...11 total|  | water       |
            +------------+  +------------+  | money       |
                                            +--------------+
```

### 1.2 Data Categories

| Category | Source | Mutability | Storage Location |
|----------|--------|------------|------------------|
| Static Trail Data | `trailData.ts` | Read-only | Bundle (JS) |
| Game Configuration | `types.ts` | Read-only | Bundle (JS) |
| Hiker State | Runtime | High | IndexedDB |
| Game State | Runtime | High | IndexedDB |
| Settings | User preference | Low | localStorage |
| Events Log | Runtime | Append-only | IndexedDB (limited) |

### 1.3 Current Offline Mode Analysis

The `GameScene.ts` implements a basic offline mode:

```typescript
// Lines 165-216: Simulated local state
this.hikerData = {
  name: this.registry.get('hikerName'),
  mile: 0,
  // ... all hiker properties
};

this.gameState = {
  time: { day: 1, hour: 6, minute: 0 },
  phase: 'morning',
  // ...
};
```

**Issues Identified:**
1. State exists only in memory - lost on refresh
2. No save triggers or persistence layer
3. Offline tick loop duplicates server logic
4. No way to restore previous session

### 1.4 Type Quality Assessment

| Aspect | Status | Notes |
|--------|--------|-------|
| TypeScript Strictness | Good | Clear interfaces |
| Enum Usage | Good | Prevents magic strings |
| Default Values | Good | `DEFAULT_SKILLS`, `DEFAULT_MOODLES` |
| Nullable Handling | Fair | Some `any` types in scene code |
| ID Strategy | Inconsistent | Mix of string IDs and session IDs |

---

## 2. IndexedDB Schema Design

### 2.1 Recommended Database Structure

```
Database: "trail_legs_db"
Version: 1

Object Stores:
+------------------+-------------+------------------+
| Store Name       | Key Path    | Indexes          |
+------------------+-------------+------------------+
| saves            | id          | updatedAt        |
| settings         | key         | -                |
| syncQueue        | id          | timestamp        |
| staticCache      | key         | version          |
+------------------+-------------+------------------+
```

### 2.2 Save Game Store Schema

```typescript
interface SaveGameRecord {
  // Identification
  id: string;              // UUID or slot number
  slotName: string;        // "Auto Save", "Slot 1", etc.
  version: number;         // Schema version for migrations

  // Timestamps
  createdAt: number;       // Unix timestamp
  updatedAt: number;       // Last save time
  playTime: number;        // Total seconds played

  // Hiker State (flattened from HikerSchema)
  hiker: {
    id: string;
    name: string;
    trailName: string;
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
    currentActivity: string;
    totalMilesHiked: number;
    daysOnTrail: number;
    currentDayMiles: number;
    skills: Skills;
    moodles: Moodles;
    inventory: {
      gear: GearItem[];
      food: FoodItem[];
      water: number;
      waterCapacity: number;
      money: number;
    };
  };

  // Game State
  game: {
    time: GameTime;
    phase: string;
    weather: string;
    temperature: number;
    tickCount: number;
  };

  // Sync Metadata (for future cloud sync)
  syncStatus: 'local' | 'synced' | 'pending';
  lastSyncedAt: number | null;
  checksum: string;        // For integrity verification
}
```

### 2.3 Settings Store Schema

```typescript
interface SettingsRecord {
  key: string;             // 'audio', 'controls', 'display'
  value: {
    // Audio settings
    masterVolume?: number;
    effectsVolume?: number;
    ambientVolume?: number;

    // Control settings
    hapticFeedback?: boolean;

    // Display settings
    orientationLock?: 'portrait' | 'landscape' | 'none';
  };
}
```

### 2.4 Sync Queue Store Schema

```typescript
interface SyncQueueItem {
  id: string;              // UUID
  timestamp: number;       // When action occurred
  actionType: string;      // 'hiker_update', 'milestone', etc.
  payload: object;         // Action-specific data
  saveId: string;          // Which save file this belongs to
  attempts: number;        // Retry count
  lastAttempt: number;     // Last sync attempt timestamp
}
```

### 2.5 Static Cache Store Schema

```typescript
interface StaticCacheRecord {
  key: string;             // 'trail_data', 'item_database'
  version: string;         // Data version hash
  data: object;            // Cached static data
  cachedAt: number;        // When cached
}
```

---

## 3. Save Game Format

### 3.1 Save File Size Estimate

| Component | Estimated Size |
|-----------|---------------|
| Hiker base data | ~500 bytes |
| Skills (10 numbers) | ~100 bytes |
| Moodles (11 numbers) | ~110 bytes |
| Inventory gear (9 items) | ~1 KB |
| Inventory food (7 items) | ~700 bytes |
| Game state | ~200 bytes |
| Metadata | ~300 bytes |
| **Total per save** | **~3-4 KB** |

This is well under the PRD's <100KB target. Multiple save slots are feasible.

### 3.2 Save Trigger Points

| Trigger | Priority | Timing |
|---------|----------|--------|
| Interval auto-save | High | Every 60 seconds |
| Milestone reached | High | Shelter, town, POI |
| App backgrounding | Critical | Immediate |
| App close | Critical | Immediate |
| Inventory change | Medium | Debounced 5 seconds |
| Session start | Medium | After load verification |

### 3.3 Save File Versioning Strategy

```typescript
const CURRENT_SAVE_VERSION = 1;

interface SaveMigration {
  fromVersion: number;
  toVersion: number;
  migrate: (data: any) => any;
}

const MIGRATIONS: SaveMigration[] = [
  // Future migrations go here
  // { fromVersion: 1, toVersion: 2, migrate: (data) => {...} }
];

function migrateSaveData(data: SaveGameRecord): SaveGameRecord {
  let current = data;
  while (current.version < CURRENT_SAVE_VERSION) {
    const migration = MIGRATIONS.find(m => m.fromVersion === current.version);
    if (!migration) throw new Error(`No migration from version ${current.version}`);
    current = migration.migrate(current);
    current.version = migration.toVersion;
  }
  return current;
}
```

### 3.4 Save File Integrity

```typescript
function computeChecksum(save: SaveGameRecord): string {
  // Create deterministic JSON (sorted keys)
  const { checksum, ...data } = save;
  const json = JSON.stringify(data, Object.keys(data).sort());
  // Simple hash for integrity check
  return hashString(json);
}

function validateSave(save: SaveGameRecord): boolean {
  return computeChecksum(save) === save.checksum;
}
```

---

## 4. Server State Considerations

### 4.1 Current Server Role

The Colyseus server currently:
- Manages authoritative game state during multiplayer
- Runs simulation loop for all connected hikers
- Broadcasts state changes to clients

### 4.2 Server Persistence Requirements (MVP)

For the build-out MVP, server persistence is **NOT** required:

| Use Case | Server Persistence Needed? |
|----------|---------------------------|
| Single-player offline | No |
| Casual multiplayer session | No (ephemeral) |
| Cross-device sync | Yes (future) |
| Leaderboards | Yes (future) |

### 4.3 Future Server Storage (Out of Scope)

When cloud sync is implemented, the server will need:
- User account storage (external auth provider)
- Save file storage per user
- Conflict resolution logic
- Rate limiting for sync requests

---

## 5. Static Trail Data Loading

### 5.1 Current Implementation

Static data is currently bundled in `trailData.ts`:

```typescript
// ~154 lines of static data
export const WATER_SOURCES: WaterSource[] = [...];  // 12 items
export const SHELTERS: Shelter[] = [...];           // 6 items
export const TOWNS: Town[] = [...];                 // 1 item
export const TRAIL_SEGMENTS: TrailSegment[] = [...];// 10 items
export const ELEVATION_PROFILE: ElevationPoint[] = [...]; // 17 points
export const POINTS_OF_INTEREST: PointOfInterest[] = [...]; // 6 items
export const BLAZES: Blaze[] = generateBlazes();    // ~250 items
```

### 5.2 Data Size Analysis

| Data Set | Items | Estimated Size | Cacheable? |
|----------|-------|----------------|------------|
| Water Sources | 12 | ~1.5 KB | Yes |
| Shelters | 6 | ~2 KB | Yes |
| Towns | 1 | ~0.5 KB | Yes |
| Trail Segments | 10 | ~1.5 KB | Yes |
| Elevation Profile | 17 | ~0.5 KB | Yes |
| POIs | 6 | ~1 KB | Yes |
| Blazes (generated) | ~250 | ~8 KB | Yes |
| **Total** | | **~15 KB** | |

### 5.3 Loading Strategy Recommendations

**Option A: Bundle Everything (Current)**
- Pros: Simplest, no async loading, works offline immediately
- Cons: Initial bundle size, can't update without app update
- Recommendation: **Keep for MVP** - 15KB is negligible

**Option B: Lazy Load Large Datasets**
- Load blazes on-demand as player progresses
- Cache in IndexedDB after first load
- Not worth complexity for 15KB

**Option C: External Data Files (Future)**
- When full AT data is added (~500 MB estimated for 2,190 miles)
- Load chunks by trail section
- Cache in IndexedDB with version checking

### 5.4 Blaze Generation Optimization

Current code regenerates blazes on every import:

```typescript
export const BLAZES: Blaze[] = generateBlazes();
```

**Recommendation:** Pre-generate and cache:

```typescript
// During build or first run
const BLAZES = await getBlazes();

async function getBlazes(): Promise<Blaze[]> {
  const cached = await localforage.getItem('blazes_v1');
  if (cached) return cached;

  const generated = generateBlazes();
  await localforage.setItem('blazes_v1', generated);
  return generated;
}
```

---

## 6. Future Cloud Sync Design

### 6.1 Sync-Ready Data Patterns

To enable future cloud sync without major refactoring:

**6.1.1 Timestamp Everything**
```typescript
interface TimestampedEntity {
  createdAt: number;
  updatedAt: number;
}

// Apply to all mutable entities
interface HikerState extends TimestampedEntity {
  // ... existing fields
}
```

**6.1.2 Immutable Event Log**
```typescript
interface GameEvent {
  id: string;           // UUID
  timestamp: number;    // Server time when possible
  sessionId: string;    // Client session
  type: string;
  payload: object;
}

// Events are append-only, used for sync reconciliation
```

**6.1.3 Vector Clocks (Optional Complexity)**
For more sophisticated conflict resolution:
```typescript
interface VectorClock {
  [deviceId: string]: number;
}
```

### 6.2 Conflict Resolution Strategy

| Scenario | Resolution |
|----------|------------|
| Same save, different progress | Server has higher mile wins |
| Same save, different inventory | Merge with last-write-wins |
| Same save, different time | Take later timestamp |
| Offline for extended period | User chooses which to keep |

### 6.3 Sync Queue Design

```typescript
// Queue actions for sync when online
interface SyncAction {
  id: string;
  type: 'SAVE_UPDATE' | 'ACHIEVEMENT' | 'STATS';
  payload: object;
  queuedAt: number;
  priority: number;
}

// Process queue when online
async function processSync() {
  const queue = await localforage.getItem<SyncAction[]>('syncQueue') || [];
  const sorted = queue.sort((a, b) => a.priority - b.priority);

  for (const action of sorted) {
    try {
      await sendToServer(action);
      await removeFromQueue(action.id);
    } catch (e) {
      // Retry later
      break;
    }
  }
}
```

---

## 7. Recommendations

### 7.1 Critical (Must Have for Launch)

| # | Recommendation | Effort | Impact |
|---|----------------|--------|--------|
| 1 | Implement localforage storage layer | Medium | Critical |
| 2 | Add auto-save on interval (60s) | Low | Critical |
| 3 | Add save on app background/close | Medium | Critical |
| 4 | Add save file versioning | Low | High |
| 5 | Implement save/load on scene transitions | Medium | Critical |

### 7.2 High Priority (Should Have)

| # | Recommendation | Effort | Impact |
|---|----------------|--------|--------|
| 6 | Add save integrity checksums | Low | Medium |
| 7 | Implement save migration framework | Medium | High |
| 8 | Add timestamp tracking to all entities | Low | Medium |
| 9 | Create storage service abstraction | Medium | High |
| 10 | Add error recovery for corrupted saves | Medium | High |

### 7.3 Future (Nice to Have)

| # | Recommendation | Effort | Impact |
|---|----------------|--------|--------|
| 11 | Multiple save slots | Low | Medium |
| 12 | Export/import save files | Medium | Low |
| 13 | Sync queue infrastructure | High | Medium |
| 14 | Static data versioning | Medium | Low |

---

## 8. Implementation Roadmap

### Phase 1: Basic Persistence (Week 1)

1. Add `localforage` dependency
2. Create `GameStorage.ts` service
3. Implement single-slot save/load
4. Add interval auto-save (60s)
5. Wire up app lifecycle events (background/close)

### Phase 2: Reliability (Week 2)

1. Add save versioning
2. Implement checksum validation
3. Add corrupted save recovery
4. Add save/load UI feedback
5. Test across platforms (web, iOS, Android)

### Phase 3: Sync Foundation (Future)

1. Add timestamps to all entities
2. Implement sync queue store
3. Add offline action logging
4. Design sync API contract
5. Implement conflict resolution UI

---

## Appendix A: localforage API Reference

```typescript
// Recommended wrapper API
class GameStorage {
  private readonly SAVE_KEY = 'current_save';
  private readonly SETTINGS_KEY = 'settings';

  async save(data: SaveGameRecord): Promise<void> {
    data.updatedAt = Date.now();
    data.checksum = computeChecksum(data);
    await localforage.setItem(this.SAVE_KEY, data);
  }

  async load(): Promise<SaveGameRecord | null> {
    const data = await localforage.getItem<SaveGameRecord>(this.SAVE_KEY);
    if (!data) return null;
    if (!validateSave(data)) throw new Error('Corrupted save');
    return migrateSaveData(data);
  }

  async deleteSave(): Promise<void> {
    await localforage.removeItem(this.SAVE_KEY);
  }

  async getSettings(): Promise<SettingsRecord> {
    return await localforage.getItem(this.SETTINGS_KEY) || defaultSettings();
  }

  async setSettings(settings: SettingsRecord): Promise<void> {
    await localforage.setItem(this.SETTINGS_KEY, settings);
  }
}
```

---

## Appendix B: Save File Example

```json
{
  "id": "save_001",
  "slotName": "Auto Save",
  "version": 1,
  "createdAt": 1736265600000,
  "updatedAt": 1736269200000,
  "playTime": 3600,
  "hiker": {
    "id": "h_abc123",
    "name": "Trail Blazer",
    "trailName": "",
    "build": "weekend_warrior",
    "mile": 8.5,
    "elevation": 3225,
    "calories": 1850,
    "hydration": 75,
    "energy": 65,
    "health": 100,
    "pace": "normal",
    "lostState": "on_trail",
    "lastBlazeSeenMile": 8.4,
    "isHiking": false,
    "isResting": true,
    "currentActivity": "camping",
    "totalMilesHiked": 8.5,
    "daysOnTrail": 2,
    "currentDayMiles": 6.0,
    "skills": {
      "trailLegs": 12,
      "navigation": 16,
      "foraging": 5,
      "campCraft": 11,
      "gearMaintenance": 10,
      "firstAid": 10,
      "trailCooking": 10,
      "weatherReading": 10,
      "social": 20,
      "mentalFortitude": 20
    },
    "moodles": {
      "hunger": 1,
      "thirst": 1,
      "fatigue": 2,
      "pain": 0,
      "cold": 0,
      "heat": 0,
      "wetness": 0,
      "morale": 55,
      "loneliness": 0,
      "anxiety": 0,
      "homesickness": 0
    },
    "inventory": {
      "gear": [
        {"id": "backpack", "name": "Backpack", "weight": 48, "condition": 95, "category": "misc"},
        {"id": "tent", "name": "2-Person Tent", "weight": 56, "condition": 90, "category": "shelter"}
      ],
      "food": [
        {"id": "oatmeal_1", "name": "Instant Oatmeal", "calories": 300, "weight": 2, "servings": 2},
        {"id": "snickers_1", "name": "Snickers Bars", "calories": 250, "weight": 2, "servings": 3}
      ],
      "water": 1.5,
      "waterCapacity": 3.0,
      "money": 780
    }
  },
  "game": {
    "time": {"day": 2, "hour": 18, "minute": 30},
    "phase": "evening",
    "weather": "clear",
    "temperature": 52,
    "tickCount": 1530
  },
  "syncStatus": "local",
  "lastSyncedAt": null,
  "checksum": "a1b2c3d4e5f6"
}
```

---

## Appendix C: Platform-Specific Notes

### IndexedDB Limits

| Platform | Storage Limit |
|----------|---------------|
| Chrome (Web) | ~80% of disk |
| Safari (iOS) | ~1 GB |
| Android WebView | ~80% of disk |
| Capacitor (native) | Device storage |

### localforage Driver Priority

```typescript
localforage.config({
  driver: [
    localforage.INDEXEDDB,    // Preferred
    localforage.WEBSQL,       // Fallback for old Safari
    localforage.LOCALSTORAGE  // Last resort
  ],
  name: 'trail_legs',
  storeName: 'game_data'
});
```

---

*End of Database/Storage Assessment*
