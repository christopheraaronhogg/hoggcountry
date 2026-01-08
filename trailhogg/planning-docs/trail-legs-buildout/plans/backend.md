# Backend Assessment: Trail Legs Build-Out

**Date:** 2026-01-07
**Scope:** Game Server Architecture Review
**PRD Reference:** `01-prd-draft.md`

---

## Executive Summary

The Trail Legs server is a **Colyseus 0.15-based multiplayer game server** with a single room type (`TrailRoom`) that manages hiking simulation state for up to 8 concurrent players. The current implementation is a functional MVP prototype with working game mechanics, but requires architectural adjustments to support the offline-first requirements defined in the PRD.

**Key Finding:** The PRD emphasizes offline-first gameplay (FR-OFFLINE-01 through FR-OFFLINE-04), but the current architecture treats the server as authoritative with client fallback. This inversion needs careful design to ensure consistent gameplay across online/offline modes while preventing desynchronization issues.

**Critical Path Items:**
1. Define offline/online state reconciliation protocol
2. Establish server authority boundaries for multiplayer fairness
3. Implement stateless sync endpoints for reconnection scenarios

---

## 1. Current Server Architecture

### 1.1 Server Entry Point

**File:** `trailhogg/server/src/index.ts`

The server uses a minimal Express + Colyseus setup:

```typescript
const app = express();
const server = createServer(app);
const gameServer = new Server({ server });
gameServer.define("trail", TrailRoom);
```

**Observations:**

| Component | Status | Notes |
|-----------|--------|-------|
| HTTP Server | Express 4.18 | Adequate for health checks |
| WebSocket | Colyseus built-in | Standard WebSocket transport |
| Room Registration | Single room type | `trail` room handles all gameplay |
| Health Endpoint | `/health` | Returns basic status JSON |
| Static Serving | Configured | Serves client from `../../client/dist` |

**Gaps Identified:**

1. **No CORS configuration** - Will cause issues with mobile web and potentially Capacitor
2. **No rate limiting** - Vulnerable to connection spam
3. **No graceful shutdown handling** - Could lose state on restart
4. **Hardcoded port** - Uses `PORT` env var or 2567 default

### 1.2 Room Architecture

**File:** `trailhogg/server/src/rooms/TrailRoom.ts` (694 lines)

The `TrailRoom` class is a **monolithic room handler** containing:

- State initialization
- Message handlers for 12 action types
- Game simulation loop (100ms tick)
- Hiker CRUD operations
- Weather system (inline)
- Navigation/lost system (inline)
- Skill progression (inline)
- Status effect calculations

**Room Configuration:**

```typescript
maxClients = 8;
TICK_RATE = 100; // ms
MINUTES_PER_TICK = 1;
```

**Message Types Registered:**

| Message | Purpose | Validation |
|---------|---------|------------|
| `create_hiker` | Character creation | Basic null checks |
| `set_pace` | Change hiking pace | Enum validation |
| `start_hiking` | Begin hiking | State check |
| `stop_hiking` | Stop hiking | State check |
| `make_camp` | Set up camp | None |
| `break_camp` | Leave camp | State check |
| `eat` | Consume food | Inventory check |
| `drink` | Consume water | Inventory check |
| `fill_water` | Refill water | None (simplified) |
| `search_blaze` | Find trail when lost | Lost state check |
| `backtrack` | Return to last blaze | Lost state check |

**Lifecycle Hooks:**

- `onCreate`: Initializes state, registers handlers, starts game loop
- `onJoin`: Logs session (expects `create_hiker` message)
- `onLeave`: Removes hiker from state map
- `onDispose`: Clears tick interval

### 1.3 State Schema

**File:** `trailhogg/server/src/schema/GameState.ts` (126 lines)

Well-structured Colyseus schema with nested types:

```
GameRoomState
  - time: GameTimeSchema
  - phase: string
  - weather: string
  - temperature: number
  - hikers: MapSchema<HikerSchema>
  - events: ArraySchema<EventSchema>
  - isPaused: boolean
  - tickCount: number

HikerSchema
  - Position (mile, elevation)
  - Core stats (calories, hydration, energy, health)
  - State flags (pace, lostState, isHiking, isResting)
  - Tracking (totalMiles, daysOnTrail, currentDayMiles)
  - Systems (SkillsSchema, MoodlesSchema, InventorySchema)
```

**Schema Observations:**

| Aspect | Assessment |
|--------|------------|
| Type Safety | All fields decorated with `@type` |
| Nesting | Appropriate use of sub-schemas |
| Array Usage | `ArraySchema` for gear, food, events |
| Map Usage | `MapSchema` for hikers by sessionId |
| Field Count | ~50 synchronized fields per hiker |

---

## 2. Colyseus Room Design Assessment

### 2.1 State Management

**Current Pattern:** Server-authoritative with 100ms tick simulation.

The game loop runs continuously:

```typescript
gameTick() {
  if (this.state.isPaused) return;
  this.state.tickCount++;
  this.advanceTime();
  this.updatePhase();
  this.state.hikers.forEach((hiker) => {
    if (hiker.isHiking) this.processHiking(hiker);
    if (hiker.isResting) this.processResting(hiker);
    this.processStatusEffects(hiker);
  });
  if (this.state.tickCount % 30 === 0) this.maybeChangeWeather();
}
```

**Strengths:**
- Deterministic simulation
- Consistent state across all clients
- Anti-cheat: clients cannot modify state directly

**Concerns:**

1. **Tick rate vs network latency** - 100ms ticks with 1 game-minute per tick means clients see delayed state. Hiking 1 mile at normal pace (2 mph) takes 30 real-world seconds. Acceptable for casual play.

2. **State size growth** - Each hiker has ~50 synchronized fields. With 8 players:
   - 400 fields synchronized per tick
   - Colyseus delta-encoding helps, but frequent changes (position, stats) create overhead

3. **Event log unbounded** - Events array capped at 20, but no TTL:
   ```typescript
   while (this.state.events.length > 20) {
     this.state.events.shift();
   }
   ```

### 2.2 Message Handling

**Pattern:** Command pattern via `onMessage` handlers.

**Assessment:**

| Criteria | Rating | Notes |
|----------|--------|-------|
| Input Validation | Medium | Basic type checks, no schema validation |
| Error Handling | Low | Silent failures, no error messages to client |
| Authorization | Low | Any client can send any message |
| Idempotency | None | Duplicate messages could cause issues |

**Example Issue - No Input Validation:**

```typescript
this.onMessage("eat", (client, data) => {
  const hiker = this.state.hikers.get(client.sessionId);
  if (hiker) {
    this.eatFood(hiker, data.foodId); // No validation of foodId
  }
});
```

If `data.foodId` is undefined or malformed, `eatFood` fails silently.

### 2.3 System Organization

The `TrailRoom` class contains game logic that should be externalized. Three system files exist but are **not imported or used**:

- `systems/WeatherSystem.ts` - Standalone weather logic
- `systems/HikerSimulation.ts` - Hiker stat calculations
- `systems/NavigationSystem.ts` - Blaze visibility and lost logic

**Current State:** Logic is duplicated inline in `TrailRoom.ts`.

**Recommendation:** Refactor to use the existing system classes:

```typescript
// Instead of inline weather logic
this.maybeChangeWeather();

// Use the system
WeatherSystem.updateWeather(this.state.weather, this.state.time, averageElevation);
```

---

## 3. Offline/Online Reconciliation

### 3.1 PRD Requirements Analysis

The PRD specifies:

| Requirement | Description |
|-------------|-------------|
| FR-OFFLINE-01 | IndexedDB persistence via localforage |
| FR-OFFLINE-02 | Auto-save every 60s + on significant events |
| FR-OFFLINE-03 | Detect online/offline, queue actions |
| FR-OFFLINE-04 | Foundation for future sync (timestamps) |

**User Story US-O3:**
> "Offline actions are queued. Sync happens automatically when online. Conflicts resolved (server authoritative)."

### 3.2 Current Client Behavior

**File:** `client/src/scenes/GameScene.ts`

The client already has offline fallback:

```typescript
async connectToServer() {
  try {
    this.room = await this.client.joinOrCreate('trail', {});
    // ...
  } catch (error) {
    console.error('Connection failed:', error);
    this.runOfflineMode(); // Fallback to local simulation
  }
}
```

**Offline Mode Implementation:**

```typescript
runOfflineMode() {
  this.hikerData = { /* hardcoded initial state */ };
  this.gameState = { /* hardcoded initial state */ };

  this.time.addEvent({
    delay: 100,
    callback: this.offlineTick,
    loop: true
  });
}
```

**Problem:** Offline simulation duplicates server logic but is simpler. Results will diverge.

### 3.3 Recommended Sync Architecture

For an offline-first game with occasional multiplayer:

**Option A: Client-Authoritative with Server Validation** (Recommended for MVP)

```
[Client] ---> Local state updates (immediate)
         ---> Queue action log (IndexedDB)
         ---> On reconnect: send action log to server
[Server] ---> Validate actions, calculate official state
         ---> Return reconciled state to client
         ---> Client overwrites local with server state
```

**Pros:**
- Responsive offline play
- Simple conflict resolution (server wins)
- No duplicate simulation logic needed

**Cons:**
- Potential for player confusion if state differs significantly
- Server must process action logs efficiently

**Option B: Shared Simulation Core**

Extract simulation logic to `shared/` package. Run identical simulation on client and server.

```
[Shared Package]
  - HikerSimulation (already exists)
  - TimeSimulation
  - WeatherSimulation (deterministic with seed)

[Client] Uses shared simulation offline
[Server] Uses shared simulation for authority

On reconnect:
  - Client sends local timestamp + action log
  - Server replays from last known state
  - Client receives corrected state
```

**Pros:**
- Consistent behavior offline/online
- Easier testing (single codebase)

**Cons:**
- Weather randomness must be seeded
- More complex initial setup

### 3.4 Server Changes Required

To support offline sync, the server needs:

1. **Reconnection endpoint** - Accept saved state + action log

   ```typescript
   this.onMessage("sync_state", (client, data: {
     lastSyncTimestamp: number;
     currentState: HikerState;
     actionLog: GameAction[];
   }) => {
     // Validate and reconcile
   });
   ```

2. **Action validation** - Server verifies actions are possible

   ```typescript
   interface GameAction {
     type: string;
     timestamp: number; // Game time when action occurred
     params: any;
   }
   ```

3. **State snapshot endpoint** - Return current authoritative state

   ```typescript
   this.onMessage("request_state", (client) => {
     const hiker = this.state.hikers.get(client.sessionId);
     client.send("state_snapshot", {
       hiker: hiker?.toJSON(),
       gameTime: this.state.time.toJSON(),
       serverTimestamp: Date.now()
     });
   });
   ```

---

## 4. API Design

### 4.1 Current Endpoints

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/health` | Health check |
| WS | `/trail` | Colyseus room connection |

### 4.2 Recommended Additional Endpoints

For PWA support and mobile native apps:

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/status` | Server status with player count |
| POST | `/api/offline-sync` | REST fallback for sync if WS fails |
| GET | `/api/trail-data` | Return trail data JSON (cacheable) |

**Rationale:**

1. **Status endpoint** - Mobile apps need to check server availability before attempting WebSocket
2. **Offline sync REST** - Backup if WebSocket reconnection fails
3. **Trail data** - Currently embedded in `shared/trailData.ts`; could be served as API for dynamic updates

### 4.3 Colyseus Message Schema

Current messages lack formal schemas. Recommend defining types:

```typescript
// shared/src/messages.ts
export interface CreateHikerMessage {
  name: string;
  build: CharacterBuild;
}

export interface SetPaceMessage {
  pace: HikerPace;
}

export interface EatMessage {
  foodId: string;
}

// etc.
```

Then validate in handlers:

```typescript
this.onMessage("create_hiker", (client, data: CreateHikerMessage) => {
  if (!data.name || data.name.length > 20) {
    client.send("error", { code: "INVALID_NAME" });
    return;
  }
  // ...
});
```

---

## 5. Scalability Assessment

### 5.1 Current Capacity

| Metric | Value | Notes |
|--------|-------|-------|
| Max clients per room | 8 | Hardcoded in `TrailRoom` |
| Tick rate | 10 Hz | CPU-bound on fast hardware |
| State size per hiker | ~2KB | Estimated serialized size |
| Rooms per server | Unlimited | Colyseus auto-creates |

**Single Room Calculation:**

- 8 hikers x 2KB state = 16KB per room
- 10 ticks/second x 16KB (worst case) = 160KB/s outbound per room
- Colyseus delta encoding reduces this by ~90% for stable state
- Effective: ~16KB/s per room

### 5.2 Horizontal Scaling

Colyseus supports scaling via:

1. **Multiple rooms** - Already works (auto-matchmaking)
2. **Multiple processes** - Requires Redis for room discovery
3. **Multiple servers** - Requires load balancer + Redis

**For MVP (PRD scope):** Single server is sufficient. The PRD explicitly states:
> "Large-scale multiplayer servers" are out of scope.

### 5.3 Performance Concerns

1. **Tick processing** - All hikers processed every tick. With 8 hikers:
   - `processHiking()`: O(1) with blaze array iteration O(n)
   - `processStatusEffects()`: O(1)
   - Total: ~O(n) where n = blaze count (300+)

   **Mitigation:** Pre-compute blaze positions per segment, binary search.

2. **Event log accumulation** - Fixed at 20 entries, low concern.

3. **Memory per room** - Schemas are efficient. 8 hikers with full inventory ~100KB.

---

## 6. Error Handling Assessment

### 6.1 Current State

| Area | Rating | Evidence |
|------|--------|----------|
| Connection errors | Low | Client catches, logs, falls back offline |
| Message validation | Low | No validation, silent failures |
| Room errors | Low | `onError` handler logs only |
| Crash recovery | None | No state persistence |

### 6.2 Error Scenarios

**Scenario 1: Client sends invalid message**
- Current: Server ignores, no feedback
- Needed: Send error message to client

**Scenario 2: Server crashes mid-game**
- Current: All state lost
- Needed: Periodic state snapshots or event sourcing

**Scenario 3: Client disconnects during action**
- Current: `onLeave` removes hiker, `consented` flag ignored
- Needed: Reconnection window before hiker removal

### 6.3 Recommended Patterns

1. **Client error feedback:**

   ```typescript
   client.send("error", {
     code: "INVALID_ACTION",
     message: "Cannot eat while hiking at rush pace",
     action: "eat"
   });
   ```

2. **Reconnection grace period:**

   ```typescript
   private disconnectedClients = new Map<string, { hiker: HikerSchema, expiry: number }>();

   onLeave(client: Client, consented: boolean) {
     if (!consented) {
       // Store for reconnection
       this.disconnectedClients.set(client.sessionId, {
         hiker: this.state.hikers.get(client.sessionId)!,
         expiry: Date.now() + 60000 // 1 minute grace
       });
     }
     this.state.hikers.delete(client.sessionId);
   }
   ```

3. **State persistence (future):**

   ```typescript
   // On room dispose or interval
   await redis.set(`room:${this.roomId}:state`, JSON.stringify(this.state.toJSON()));
   ```

---

## 7. Recommendations

### Priority 1: Critical for Offline-First (Before Build-Out)

| Item | Effort | Impact |
|------|--------|--------|
| Define offline sync message protocol | Medium | Enables FR-OFFLINE-03/04 |
| Add client error message handling | Low | Improves debugging |
| Extract simulation to shared package | Medium | Consistent offline/online behavior |

### Priority 2: High Value for MVP

| Item | Effort | Impact |
|------|--------|--------|
| Integrate existing system classes | Low | Code organization, testability |
| Add CORS for mobile web | Low | Unblocks mobile web testing |
| Add reconnection grace period | Medium | Better UX on flaky connections |
| Implement message validation | Medium | Prevents silent failures |

### Priority 3: Nice to Have

| Item | Effort | Impact |
|------|--------|--------|
| Add `/api/status` endpoint | Low | Mobile app connectivity check |
| Add `/api/offline-sync` REST fallback | Medium | Backup sync path |
| Upgrade Colyseus to 0.16.x | Medium | Per PRD requirement |
| Implement state persistence | High | Crash recovery |

### Priority 4: Post-MVP

| Item | Effort | Impact |
|------|--------|--------|
| Horizontal scaling setup | High | Not in PRD scope |
| Analytics integration | Medium | Explicitly out of scope |
| Full cloud save sync | High | Foundation only for this phase |

---

## Appendix A: File Reference

| File | Lines | Purpose |
|------|-------|---------|
| `server/src/index.ts` | 35 | Server entry point |
| `server/src/rooms/TrailRoom.ts` | 694 | Room logic (monolithic) |
| `server/src/schema/GameState.ts` | 126 | Colyseus state schemas |
| `server/src/systems/WeatherSystem.ts` | 232 | Weather logic (unused) |
| `server/src/systems/HikerSimulation.ts` | 259 | Hiker stat logic (unused) |
| `server/src/systems/NavigationSystem.ts` | 301 | Navigation logic (unused) |
| `shared/src/types.ts` | 280 | Shared type definitions |
| `shared/src/trailData.ts` | 154 | Trail segment/shelter data |
| `client/src/scenes/GameScene.ts` | 533 | Client with offline fallback |

---

## Appendix B: Sync Protocol Draft

For FR-OFFLINE-04, a foundation sync protocol:

```typescript
// Client -> Server on reconnect
interface SyncRequest {
  sessionToken: string;      // Persistent client ID (not sessionId)
  lastSyncTimestamp: number; // Server timestamp of last sync
  localState: {
    hikerSnapshot: HikerState;
    gameTimeSnapshot: GameTime;
  };
  actionLog: Array<{
    type: string;
    gameTime: GameTime;
    params: any;
    clientTimestamp: number;
  }>;
}

// Server -> Client response
interface SyncResponse {
  status: "accepted" | "conflict" | "rejected";
  serverState: {
    hiker: HikerState;
    gameTime: GameTime;
  };
  serverTimestamp: number;
  conflictDetails?: string;
}
```

**Conflict Resolution Rules:**
1. Server state always wins for position (mile marker)
2. Inventory discrepancies favor fewer items (anti-cheat)
3. Skill values take the lower of client/server
4. Time advances to whichever is further

---

*End of Backend Assessment*
