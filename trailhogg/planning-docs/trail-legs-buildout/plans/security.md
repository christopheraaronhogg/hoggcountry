# Security Assessment: Trail Legs Build-Out

**Project:** Trail Legs MVP Build-Out
**Date:** 2026-01-07
**Consultant:** Claude Security Engineer
**Scope:** PRD Review and Code Analysis

---

## Executive Summary

This security assessment evaluates the Trail Legs game build-out PRD and existing server/client codebase from a game security perspective. Trail Legs is a multiplayer hiking simulation with offline capability, targeting web browsers and native mobile platforms via Capacitor.

The current prototype is an MVP with minimal security controls, which is appropriate for its development stage. However, the proposed build-out introduces significant security surface area through IndexedDB persistence, offline/online sync, and native mobile apps. This assessment identifies practical threats relevant to a game context and provides prioritized recommendations.

**Overall Risk Rating: Medium**

The primary risks are:
1. Client-side save tampering (cheating)
2. Lack of server-side input validation
3. No authentication infrastructure for future features
4. Offline sync as a potential cheat vector

---

## 1. Threat Model

### 1.1 STRIDE Analysis for Trail Legs

| Threat | Applicability | Risk Level | Notes |
|--------|---------------|------------|-------|
| **Spoofing** | Low (currently) | Low | No user accounts yet. Session ID is ephemeral. Future risk when accounts are added. |
| **Tampering** | High | Medium | IndexedDB saves can be modified. Server accepts pace/action messages without bounds checking. |
| **Repudiation** | Low | Low | No financial transactions or competitive leaderboards (yet). Logging is minimal. |
| **Information Disclosure** | Low | Low | No sensitive PII. Hiker name is the only "personal" data. Game state is not confidential. |
| **Denial of Service** | Medium | Medium | Server has no rate limiting. A malicious client could spam messages. Room maxClients=8 provides some protection. |
| **Elevation of Privilege** | Low | Low | Single game room, no admin features. Server processes all hikers equally. |

### 1.2 Key Threat Actors

| Actor | Motivation | Capability | Likelihood |
|-------|------------|------------|------------|
| **Casual Cheater** | Skip boring gameplay, inflate stats | Browser DevTools, save editing | High |
| **Bored Scripter** | Grief other players, spam rooms | Simple JavaScript, message flooding | Medium |
| **Competitive Cheater** | Top leaderboards (if added) | Memory editing, proxy tools | Low (no leaderboards yet) |
| **Malicious Actor** | DoS, exploit vulnerabilities | Sophisticated tooling | Very Low (low-value target) |

### 1.3 Practical Game Threats

1. **Save File Editing** - Players can open DevTools, access IndexedDB, and modify:
   - `mile` position (teleport to Neels Gap)
   - `calories`, `hydration`, `energy` (infinite resources)
   - `skills` values (max out trail legs)
   - `inventory.money` (infinite money)

2. **Message Spoofing** - Malicious clients could send:
   - Invalid pace values (e.g., `pace: "godmode"`)
   - Negative drink amounts (to gain water instead of consuming)
   - Rapid message floods (DoS the room)

3. **Offline Cheating** - Offline mode simulation runs entirely client-side:
   - Time can be manipulated
   - Distance calculations can be modified
   - When syncing, cheated progress would persist

4. **Session Hijacking** (Low Risk Currently) - Colyseus sessionId is:
   - Generated per connection
   - Not persisted across sessions
   - Not tied to any authentication

---

## 2. Client-Side Security

### 2.1 Current State

**File:** `client/src/scenes/GameScene.ts`

The client currently has two modes:
- **Online Mode:** State is authoritative on the server, client sends commands
- **Offline Mode:** Full simulation runs locally (lines 165-293)

**Findings:**

| ID | Finding | Severity | Location |
|----|---------|----------|----------|
| CS-01 | Game instance exposed to window | Info | `main.ts:45` - `(window as any).game = game` |
| CS-02 | Offline mode has no integrity protection | Medium | `GameScene.ts:165-293` |
| CS-03 | No obfuscation or anti-tamper measures | Info | Entire client codebase |

### 2.2 IndexedDB Persistence (Proposed)

The PRD specifies using `localforage` for save persistence (FR-OFFLINE-01/02).

**Threats to Address:**

1. **Unencrypted Saves** - IndexedDB is easily readable via DevTools
2. **No Integrity Verification** - Modified saves would load without detection
3. **No Versioning** - Schema changes could corrupt saves

**Recommendations:**

| Priority | Recommendation | Effort |
|----------|----------------|--------|
| Medium | Add save file checksum/signature | 1-2 days |
| Low | Obfuscate save format (not security, just deterrent) | 1 day |
| Medium | Version saves with schema migration support | 1-2 days |

**Checksum Approach (Pragmatic):**

A simple approach for single-player/casual game:
- Store `{data: {...gameState}, signature: hmac(gameState, salt)}`
- On load, verify signature matches
- If mismatch: warn player, optionally reset progress

This does NOT prevent determined cheaters (salt is in client code), but:
- Blocks casual "edit JSON in DevTools" cheating
- Provides telemetry opportunity to detect tampering
- Maintains honest player experience

### 2.3 PWA/Service Worker Security (Proposed)

The PRD specifies adding PWA support (FR-INFRA-03).

**Recommendations:**

| Priority | Recommendation |
|----------|----------------|
| High | Use `vite-plugin-pwa` with integrity hashes for cached assets |
| Medium | Implement offline-first but validate critical state server-side when online |
| Low | Consider code-splitting to reduce attack surface in cached bundles |

---

## 3. Server Security

### 3.1 Current State

**File:** `server/src/index.ts`

The server is a minimal Express + Colyseus setup:
- Single room type: `trail`
- Static file serving from client dist
- Health check endpoint
- No authentication
- No rate limiting
- No CORS configuration (defaults)

**File:** `server/src/rooms/TrailRoom.ts`

| ID | Finding | Severity | Location |
|----|---------|----------|----------|
| SV-01 | No input validation on `create_hiker` | Medium | Line 167-189 |
| SV-02 | No input validation on `set_pace` | Medium | Line 76-82 |
| SV-03 | Unbounded message acceptance | Medium | All message handlers |
| SV-04 | No rate limiting on messages | Medium | Room level |
| SV-05 | Debug logging exposes session IDs | Low | Lines 679, 684 |

### 3.2 Input Validation Issues

**create_hiker (Line 167-189):**
```typescript
this.onMessage("create_hiker", (client, data) => {
  this.createHiker(client, data);
});

createHiker(client: Client, data: any) {
  const hiker = new HikerSchema();
  hiker.id = client.sessionId;
  hiker.name = data.name || "Hiker";  // No validation!
  hiker.build = data.build || "weekend_warrior";  // No validation!
```

**Issues:**
- `data.name` could be malicious string (XSS if rendered without escaping)
- `data.name` has no length limit
- `data.build` is checked against valid builds in `applyBuildBonuses`, but invalid build silently falls back

**set_pace (Line 76-82):**
```typescript
this.onMessage("set_pace", (client, data) => {
  const hiker = this.state.hikers.get(client.sessionId);
  if (hiker && PACE_CONFIG[data.pace as keyof typeof PACE_CONFIG]) {
    hiker.pace = data.pace;
```

**Positive:** Validates pace against `PACE_CONFIG` keys
**Issue:** Still using `as keyof typeof` which could mask invalid values

**drink (Line 130-140):**
```typescript
this.onMessage("drink", (client, data) => {
  const hiker = this.state.hikers.get(client.sessionId);
  if (hiker) {
    const amount = data.amount || 0.5;  // No bounds check!
    if (hiker.inventory.water >= amount) {
```

**Issue:** Negative `amount` would pass the check and INCREASE water

### 3.3 Recommendations

| Priority | Recommendation | Effort |
|----------|----------------|--------|
| High | Add input validation layer for all message handlers | 2-3 days |
| High | Sanitize hiker name (limit length, strip HTML) | 1 hour |
| High | Validate numeric bounds (drink amount > 0, <= water capacity) | 1 hour |
| Medium | Add message rate limiting per client | 1 day |
| Medium | Validate build against enum values | 1 hour |
| Low | Add structured logging with redacted session IDs | 1 day |

**Validation Schema Example:**
```typescript
// Recommended validation approach (using zod or similar)
const CreateHikerSchema = {
  name: string().max(32).regex(/^[a-zA-Z0-9\s\-']+$/),
  build: enum(['weekend_warrior', 'scout_leader', ...])
};

const DrinkSchema = {
  amount: number().min(0.1).max(3.0)
};
```

---

## 4. Offline/Online Sync

### 4.1 PRD Scope

The PRD states (FR-OFFLINE-04):
> "Prepare for future cloud sync without full implementation"
> "Structure offline action queue"
> "Timestamp all state changes"

**US-O3 Acceptance Criteria:**
> "Conflicts resolved (server authoritative)"

### 4.2 Security Design Requirements

When sync is implemented, the following must be addressed:

| Concern | Recommendation |
|---------|----------------|
| **Cheated Offline Progress** | Server must validate plausibility of sync data |
| **Replay Attacks** | Use monotonic timestamps or sequence numbers |
| **Selective Sync** | Prevent cherry-picking only beneficial actions |
| **Time Manipulation** | Server should calculate expected time from actions, not trust client timestamps |

### 4.3 Plausibility Validation

For a hiking game, server can validate:
- Maximum reasonable miles per minute based on pace
- Calorie burn rate matching activity
- Skill gain within reasonable bounds
- Time progression consistency

**Example Validation:**
```typescript
// On sync, check if progress is plausible
const syncedMiles = newState.mile - lastKnownMile;
const elapsedMinutes = newState.time - lastKnownTime;
const maxPossibleMiles = (3.0 / 60) * elapsedMinutes; // rush pace

if (syncedMiles > maxPossibleMiles * 1.1) { // 10% tolerance
  // Flag as suspicious, request re-sync
}
```

### 4.4 Recommendations

| Priority | Recommendation | When |
|----------|----------------|------|
| High | Design sync protocol with server-side validation | Before sync implementation |
| High | Store action log, not just state snapshots | Sync foundation phase |
| Medium | Implement plausibility checks for key metrics | Sync MVP |
| Low | Consider signed action records | Future anti-cheat |

---

## 5. Mobile App Security (Capacitor)

### 5.1 PRD Scope

FR-INFRA-02 specifies Capacitor for iOS/Android with:
- App identifier: `com.hoggcountry.traillegs`
- Splash screens and app icons

### 5.2 Capacitor-Specific Concerns

| Concern | Risk | Recommendation |
|---------|------|----------------|
| **WebView Debugging** | Medium | Disable WebView debugging in production builds |
| **Insecure Storage** | Medium | Use Capacitor Secure Storage for any sensitive data |
| **Deep Links** | Low | Validate deep link parameters if implemented |
| **Certificate Pinning** | Low | Consider pinning for future auth endpoints |
| **Jailbreak/Root Detection** | Low | Not critical for MVP, consider for anti-cheat later |

### 5.3 iOS-Specific

| Concern | Recommendation |
|---------|----------------|
| App Transport Security | Ensure all connections use HTTPS (already planned per GameScene.ts) |
| Keychain for Tokens | Use Keychain for future auth tokens (not localStorage) |
| Data Protection | Enable file protection for save data |

### 5.4 Android-Specific

| Concern | Recommendation |
|---------|----------------|
| Backup Exclusion | Exclude save files from Android backup (cheating vector) |
| Network Security Config | Pin certificates for production API endpoints |
| ProGuard/R8 | Enable obfuscation for release builds |

### 5.5 Capacitor Configuration Recommendations

```typescript
// capacitor.config.ts security settings
const config: CapacitorConfig = {
  appId: 'com.hoggcountry.traillegs',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    iosScheme: 'capacitor'  // Avoids WKWebView issues
  },
  plugins: {
    // If using Storage plugin
    Storage: {
      group: 'NativeStorage'  // iOS Keychain group
    }
  }
};
```

---

## 6. Authentication Preparation

### 6.1 Current State

The PRD explicitly states (Section 7):
> "User accounts and authentication" are OUT OF SCOPE

However, US-O3 mentions:
> "I can continue on other devices"

This implies future cross-device sync, which requires authentication.

### 6.2 Future-Ready Recommendations

Implement now to avoid rework:

| Priority | Recommendation | Effort |
|----------|----------------|--------|
| Low | Design user ID structure (UUID v4) | 1 hour |
| Low | Reserve session/auth header patterns in API | 1 hour |
| Low | Abstract storage layer to support user-specific saves | 1 day |

### 6.3 Authentication Architecture Notes

When authentication is added:

1. **Provider Options:**
   - OAuth2 (Google, Apple, Discord) - recommended for games
   - Email/password - requires secure password handling
   - Anonymous auth upgrade - best for mobile games

2. **Token Storage:**
   - Web: HttpOnly cookies preferred over localStorage
   - Mobile: Keychain (iOS) / EncryptedSharedPreferences (Android)

3. **Session Management:**
   - Colyseus can integrate auth via `onAuth` hook
   - Validate JWT/session token before room join

4. **Anonymous-to-Account Migration:**
   - Common pattern for games
   - Player starts anonymous, can "claim" account later
   - Design save structure to support this from start

---

## 7. Prioritized Recommendations

### Immediate (MVP Build-Out)

| ID | Recommendation | Effort | Impact |
|----|----------------|--------|--------|
| R-01 | Add input validation to all server message handlers | 2-3 days | Prevents basic exploits |
| R-02 | Validate drink/eat amounts (positive, within bounds) | 1 hour | Prevents resource duplication |
| R-03 | Sanitize hiker name (length, characters) | 1 hour | Prevents XSS |
| R-04 | Add save file checksum for IndexedDB persistence | 1-2 days | Deters casual cheating |
| R-05 | Disable WebView debugging in production Capacitor builds | 1 hour | Basic mobile hardening |

### Short-Term (Post-MVP)

| ID | Recommendation | Effort | Impact |
|----|----------------|--------|--------|
| R-06 | Add message rate limiting per client | 1 day | Prevents DoS |
| R-07 | Design sync protocol with server-side validation | 2-3 days | Enables secure sync |
| R-08 | Configure Capacitor security settings | 1 day | Mobile hardening |
| R-09 | Add structured logging (without sensitive data) | 1 day | Incident detection |

### Long-Term (Future Features)

| ID | Recommendation | Effort | Impact |
|----|----------------|--------|--------|
| R-10 | Implement plausibility validation for sync | 3-5 days | Anti-cheat |
| R-11 | Add authentication with anonymous-to-account flow | 1-2 weeks | Cross-device play |
| R-12 | Consider anti-tamper obfuscation | 3-5 days | Deters cheating |

---

## 8. Appendix

### A. Code References

| File | Location | Description |
|------|----------|-------------|
| `server/src/index.ts` | Full file | Server entry, no rate limiting |
| `server/src/rooms/TrailRoom.ts:167-189` | `createHiker` | No name/build validation |
| `server/src/rooms/TrailRoom.ts:130-140` | `drink` handler | No amount bounds check |
| `client/src/scenes/GameScene.ts:165-293` | `runOfflineMode` | Unprotected offline simulation |
| `client/src/main.ts:45` | Window exposure | Game exposed to DevTools |

### B. OWASP Top 10 Mapping

| Category | Applicability | Status |
|----------|---------------|--------|
| A01: Broken Access Control | Medium | No authz model yet |
| A02: Cryptographic Failures | Low | No encryption needed currently |
| A03: Injection | Medium | Name field needs sanitization |
| A04: Insecure Design | Medium | Offline mode trusts client |
| A05: Security Misconfiguration | Low | Minimal config currently |
| A06: Vulnerable Components | Unknown | Needs `npm audit` |
| A07: Auth Failures | N/A | No auth yet |
| A08: Data Integrity Failures | Medium | No save verification |
| A09: Logging Failures | Low | Minimal logging |
| A10: SSRF | N/A | No URL fetching |

### C. Dependency Check

Run before deployment:
```bash
npm audit
# Check for known vulnerabilities in:
# - colyseus@0.15.0
# - phaser@3.70.0
# - express@4.18.2
```

---

## Summary

Trail Legs has a reasonable security posture for an MVP game. The primary concerns are:

1. **Input Validation** - Server accepts messages without proper validation, enabling potential exploits (drink negative amounts, oversized names)

2. **Save Integrity** - Proposed IndexedDB persistence needs integrity verification to prevent trivial cheating

3. **Offline Mode** - Runs entirely client-side with no server reconciliation, enabling cheating (acceptable for MVP, needs addressing for sync)

The recommended approach is "pragmatic game security" - deterring casual cheaters without implementing enterprise-grade controls inappropriate for a hiking game. Focus on input validation now, design sync carefully later.

---

*End of Security Assessment*
