# QA Assessment: Trail Legs Build-Out

**Project:** Trail Legs Game
**Date:** 2026-01-07
**Consultant:** QA Consultant
**Document Type:** Testing Strategy and Quality Plan

---

## Executive Summary

Trail Legs is a cross-platform Phaser 3 game targeting web, PWA, iOS, and Android. The PRD emphasizes offline-first functionality, mobile touch controls, and 60fps performance on 3-year-old devices. This creates a testing matrix with significant complexity: multiple platforms, offline/online states, touch and keyboard input, and real-time game simulation.

**Key Testing Challenges:**

1. **Cross-platform behavior** - Same codebase must work identically across 4+ platforms
2. **Offline-first architecture** - IndexedDB persistence must survive app restarts, crashes, and device reboots
3. **Touch input validation** - Gestures must feel natural, not ported keyboard controls
4. **Performance on constrained devices** - 60fps on older mobile hardware
5. **Game state consistency** - Offline simulation must match server simulation exactly

**Current State:** No test infrastructure exists. The project has no unit tests, integration tests, or E2E tests. Test frameworks are not configured in any package.json.

---

## 1. Test Strategy

### 1.1 Testing Pyramid for Game Development

Game testing requires a modified test pyramid that accounts for visual/interactive elements:

```
                    /\
                   /  \  Manual Playtesting (5%)
                  /----\  Device/Platform QA
                 /      \
                /   E2E  \  Cross-platform smoke (10%)
               /----------\
              /            \
             / Integration  \  Storage, Adapters, Input (25%)
            /----------------\
           /                  \
          /       Unit         \  Simulation Logic (60%)
         /----------------------\
```

### 1.2 Test Categories

| Category | Scope | Priority | Automation |
|----------|-------|----------|------------|
| **Unit Tests** | Shared simulation logic, utility functions | P0 | Full |
| **Integration Tests** | Storage layer, adapter pattern, input handling | P0 | Full |
| **Component Tests** | Phaser scenes in isolation | P1 | Partial |
| **E2E Tests** | Critical user flows across platforms | P1 | Partial |
| **Performance Tests** | Frame rate, memory, load time | P1 | Automated benchmarks |
| **Visual Tests** | Sprite rendering, UI layout | P2 | Screenshot comparison |
| **Exploratory Testing** | Gameplay balance, feel, edge cases | P1 | Manual |

### 1.3 Test Framework Recommendations

| Package | Framework | Rationale |
|---------|-----------|-----------|
| `shared` | Vitest | Fast, TypeScript-native, works with pure functions |
| `client` | Vitest + Testing Library | Component isolation, DOM testing |
| `server` | Vitest | Consistency across monorepo |
| E2E | Playwright | Cross-browser, mobile emulation, headless |
| Performance | Lighthouse CI | Automated performance budgets |

---

## 2. Platform Test Matrix

### 2.1 Primary Test Platforms

| Platform | Browser/Runtime | Minimum Version | Test Priority |
|----------|-----------------|-----------------|---------------|
| Desktop Chrome | Chrome | 100+ | P0 |
| Desktop Safari | Safari | 15+ | P1 |
| Desktop Firefox | Firefox | 100+ | P2 |
| Mobile Safari | iOS Safari | iOS 15+ | P0 |
| Mobile Chrome | Android Chrome | Android 10+ | P0 |
| iOS App | Capacitor WKWebView | iOS 15+ | P0 |
| Android App | Capacitor WebView | Android 10+ | P0 |
| PWA | Service Worker | Chrome/Safari | P1 |

### 2.2 Device Test Matrix

| Device Category | Example Devices | Purpose |
|-----------------|-----------------|---------|
| **High-end iOS** | iPhone 14+, iPad Pro | Feature completeness |
| **Mid-range iOS** | iPhone 11, iPad 9th gen | Performance baseline |
| **Low-end iOS** | iPhone SE (2020), older iPads | Performance stress |
| **High-end Android** | Samsung S23, Pixel 7 | Feature completeness |
| **Mid-range Android** | Samsung A53, Pixel 6a | Performance baseline |
| **Low-end Android** | 3-year-old budget devices | Performance stress (per PRD) |

### 2.3 Platform-Specific Test Cases

**Web Browser Tests:**
- [ ] Game loads in Chrome, Firefox, Safari, Edge
- [ ] Keyboard controls work correctly
- [ ] Browser back button does not break game state
- [ ] Fullscreen toggle works
- [ ] Game state persists across browser sessions
- [ ] No console errors during gameplay

**Mobile Web Tests:**
- [ ] Touch gestures recognized correctly
- [ ] UI elements are touch-target compliant (44x44pt minimum)
- [ ] Safe area insets respected (notch, home indicator)
- [ ] Portrait and landscape orientations work
- [ ] Add-to-homescreen / PWA install works
- [ ] No horizontal scroll or zoom issues

**Native App Tests:**
- [ ] App launches from home screen
- [ ] Status bar hidden/styled correctly
- [ ] Splash screen displays appropriately
- [ ] App returns to correct state after backgrounding
- [ ] Haptic feedback fires on supported devices
- [ ] Back button (Android) behaves correctly

---

## 3. Offline Testing

### 3.1 Offline Test Scenarios

The PRD requires "100% features work without server." This is the highest-risk area.

| Scenario | Test Steps | Expected Result |
|----------|------------|-----------------|
| **Cold start offline** | Enable airplane mode, launch app | Game loads from IndexedDB, play resumes |
| **Disconnect mid-session** | Start playing online, disable network | Game continues seamlessly, no error dialogs |
| **Reconnect after offline play** | Play offline, re-enable network | State syncs (future), no data loss |
| **Save during offline** | Play offline for 5 minutes | Auto-save triggers every 60 seconds |
| **App kill while offline** | Force-quit app during offline play | Progress preserved on relaunch |
| **Device restart offline** | Restart device with airplane mode | Progress preserved after reboot |
| **Storage full scenario** | Fill device storage, attempt save | Graceful error handling, no crash |

### 3.2 IndexedDB Persistence Tests

| Test Case | Validation |
|-----------|------------|
| **Schema versioning** | Saved games from v1.0 load in v1.1 |
| **Corrupt data handling** | Malformed IndexedDB entries don't crash |
| **Large state handling** | Game state up to 100KB saves/loads correctly |
| **Settings isolation** | User settings persist separately from game saves |
| **Multi-slot support** | (Stretch goal) Multiple saves don't interfere |

### 3.3 Sync Queue Tests (Foundation)

| Test Case | Validation |
|-----------|------------|
| **Action queuing** | Offline actions have timestamps and UUIDs |
| **Queue persistence** | Queued actions survive app restart |
| **Queue ordering** | Actions replay in timestamp order |
| **Idempotency** | Same action UUID is not processed twice |

### 3.4 Offline Testing Tools

| Tool | Purpose |
|------|---------|
| Chrome DevTools Network Throttling | Simulate offline/slow networks |
| Airplane mode (device) | True offline testing |
| Service Worker DevTools | Inspect cached assets |
| IndexedDB browser inspector | Verify stored data |
| Capacitor `Network` plugin | Programmatic offline detection |

---

## 4. Performance Testing

### 4.1 Performance Budgets (from PRD)

| Metric | Target | Failure Threshold |
|--------|--------|-------------------|
| Frame rate | 60fps sustained | <55fps for >1 second |
| Load time | <3 seconds | >5 seconds |
| Memory usage | <200MB peak | >250MB |
| CPU usage | <30% sustained | >50% sustained |
| Bundle size (web) | <10MB | >15MB |
| App size (native) | <50MB | >75MB |
| Touch latency | <100ms | >150ms |

### 4.2 Performance Test Scenarios

| Scenario | What to Measure | Tool |
|----------|-----------------|------|
| **Cold start** | Time to interactive | Lighthouse, manual stopwatch |
| **Extended play (30 min)** | Memory growth, frame drops | Chrome DevTools Performance tab |
| **Weather effects** | FPS during rain/storm | Phaser debug overlay |
| **Many sprites** | FPS with max blaze density | Custom benchmark |
| **Orientation change** | Time to re-layout | Manual measurement |
| **Background/foreground** | Resume latency | Capacitor App plugin |

### 4.3 Performance Testing on Target Devices

**Required Devices for PRD Compliance:**

The PRD specifies "60fps on 3-year-old mid-range device." Identify and acquire:
- **iOS:** iPhone 11 or SE (2020)
- **Android:** Samsung Galaxy A52 (2021) or similar

**Test Protocol:**
1. Run standardized gameplay loop (5 minute scenario)
2. Enable on-device profiling (Instruments / Android Profiler)
3. Capture frame time graph
4. Flag any frame that exceeds 16.67ms (60fps threshold)
5. Measure 95th percentile frame time

### 4.4 Automated Performance Monitoring

```yaml
# Example Lighthouse CI budget (for web builds)
budgets:
  - path: "/*"
    resourceSizes:
      - resourceType: script
        budget: 500000  # 500KB JS budget
      - resourceType: total
        budget: 10000000  # 10MB total
    timings:
      - metric: interactive
        budget: 3000  # 3 second TTI
      - metric: first-contentful-paint
        budget: 1500  # 1.5 second FCP
```

---

## 5. Acceptance Criteria by Feature Area

### 5.1 Platform and Infrastructure (FR-INFRA)

| Requirement | Acceptance Criteria | Test Type |
|-------------|---------------------|-----------|
| FR-INFRA-01 Dependency Upgrades | Phaser 3.90, Vite 7.x, Colyseus 0.16.5 install without errors | Build verification |
| FR-INFRA-02 Capacitor | `cap build ios` and `cap build android` succeed | CI build |
| FR-INFRA-03 PWA | Lighthouse PWA audit passes | Automated |
| FR-INFRA-04 Build Pipeline | All 4 build targets produce valid artifacts | CI build |

### 5.2 Offline Storage (FR-OFFLINE)

| Requirement | Acceptance Criteria | Test Type |
|-------------|---------------------|-----------|
| FR-OFFLINE-01 IndexedDB | `localforage.setItem()` and `getItem()` work on all platforms | Integration |
| FR-OFFLINE-02 Save/Load | Game resumes from exact position after app restart | E2E |
| FR-OFFLINE-03 Offline Detection | Offline indicator appears within 1 second of connectivity loss | Integration |
| FR-OFFLINE-04 Sync Queue | Queued actions have valid structure and timestamps | Unit |

### 5.3 Graphics and Assets (FR-GFX)

| Requirement | Acceptance Criteria | Test Type |
|-------------|---------------------|-----------|
| FR-GFX-01 Sprites | Hiker sprite animates (4+ frames walk, 2+ idle) | Visual inspection |
| FR-GFX-02 Texture Atlas | All sprites load from atlas, no 404s | E2E |
| FR-GFX-03 Color Palette | Visual consistency across all sprites | Visual inspection |

### 5.4 Mobile Experience (FR-MOBILE)

| Requirement | Acceptance Criteria | Test Type |
|-------------|---------------------|-----------|
| FR-MOBILE-01 Touch Input | All actions achievable via touch (see gesture table) | Manual |
| FR-MOBILE-02 Responsive UI | UI readable on 320x568 (iPhone SE) and tablet | Visual inspection |
| FR-MOBILE-03 Touch Feedback | Haptic fires on button press (native only) | Manual |
| FR-MOBILE-04 Virtual Controls | Touch overlay does not block game rendering | Visual inspection |

### 5.5 Game Polish (FR-POLISH)

| Requirement | Acceptance Criteria | Test Type |
|-------------|---------------------|-----------|
| FR-POLISH-01 Inventory UI | All gear items display with condition bars | Manual |
| FR-POLISH-02 Shelter Interaction | Enter/exit shelter, sleep with time advance | E2E |
| FR-POLISH-03 Audio | Footsteps, ambient, and UI sounds play correctly | Manual |
| FR-POLISH-04 Settings | Volume changes persist across app restart | Integration |

---

## 6. Test Automation Strategy

### 6.1 What to Automate

| Test Type | Automate? | Rationale |
|-----------|-----------|-----------|
| **Shared simulation logic** | YES | Pure functions, high value, low effort |
| **Storage layer** | YES | Critical path, testable in isolation |
| **Adapter interfaces** | YES | Contract testing for online/offline |
| **Input normalization** | YES | Keyboard and touch produce same commands |
| **Build verification** | YES | CI gate for all PRs |
| **Performance budgets** | YES | Lighthouse CI |
| **Visual regression** | PARTIAL | High-value screens only |
| **Cross-platform smoke** | PARTIAL | Playwright for web, manual for native |
| **Touch gesture feel** | NO | Requires human judgment |
| **Gameplay balance** | NO | Requires playtesting |

### 6.2 Unit Test Coverage Goals

| Package | Target Coverage | Critical Modules |
|---------|-----------------|------------------|
| `shared` | 90%+ | simulation/*, types.ts utilities |
| `client/storage` | 85%+ | GameStorage, SaveManager |
| `client/input` | 80%+ | InputManager, command normalization |
| `client/adapters` | 80%+ | OnlineAdapter, OfflineAdapter interface |
| `client/scenes` | 50%+ | Lower priority due to Phaser coupling |
| `server/rooms` | 80%+ | TrailRoom game logic (if not extracted) |

### 6.3 Sample Unit Test Structure

```typescript
// shared/src/simulation/__tests__/hiking.test.ts
import { describe, it, expect } from 'vitest';
import { processHiking, calculateDistance } from '../hiking';
import { HikerPace, TerrainType } from '../../types';

describe('processHiking', () => {
  it('advances hiker position based on pace and terrain', () => {
    const hiker = { mile: 0, pace: HikerPace.NORMAL };
    const terrain = TerrainType.SMOOTH;
    const result = processHiking(hiker, terrain, 1); // 1 tick

    expect(result.mile).toBeGreaterThan(0);
    expect(result.mile).toBeLessThan(0.1); // Sanity check
  });

  it('slows hiker on rocky terrain', () => {
    const hiker = { mile: 0, pace: HikerPace.NORMAL };
    const smoothResult = processHiking(hiker, TerrainType.SMOOTH, 10);
    const rockyResult = processHiking(hiker, TerrainType.ROCKY, 10);

    expect(rockyResult.mile).toBeLessThan(smoothResult.mile);
  });
});
```

### 6.4 Integration Test Structure

```typescript
// client/src/storage/__tests__/GameStorage.integration.test.ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { GameStorage } from '../GameStorage';

describe('GameStorage Integration', () => {
  beforeEach(async () => {
    await GameStorage.clear();
  });

  afterEach(async () => {
    await GameStorage.clear();
  });

  it('persists and retrieves game state', async () => {
    const state = { hiker: { mile: 5.3 }, savedAt: Date.now() };
    await GameStorage.saveGame(state);
    const loaded = await GameStorage.loadGame();

    expect(loaded).toEqual(state);
  });

  it('returns null when no save exists', async () => {
    const loaded = await GameStorage.loadGame();
    expect(loaded).toBeNull();
  });
});
```

### 6.5 E2E Test Structure

```typescript
// e2e/smoke.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Cross-platform smoke tests', () => {
  test('game loads and reaches menu', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('text=New Game')).toBeVisible({ timeout: 5000 });
  });

  test('can start new game and see hiker', async ({ page }) => {
    await page.goto('/');
    await page.click('text=New Game');
    await page.click('text=Weekend Warrior'); // Select build
    await page.click('text=Start');

    await expect(page.locator('[data-testid="hiker-sprite"]')).toBeVisible();
  });

  test('game persists after refresh', async ({ page }) => {
    await page.goto('/');
    await page.click('text=Continue'); // Assumes prior save

    const mileBefore = await page.locator('[data-testid="mile-marker"]').textContent();
    await page.reload();
    await page.click('text=Continue');
    const mileAfter = await page.locator('[data-testid="mile-marker"]').textContent();

    expect(mileAfter).toEqual(mileBefore);
  });
});
```

---

## 7. Testing Tools Recommendations

### 7.1 Development Testing Tools

| Tool | Purpose | Installation |
|------|---------|--------------|
| **Vitest** | Unit and integration tests | `npm install -D vitest` |
| **@testing-library/dom** | DOM assertions | `npm install -D @testing-library/dom` |
| **happy-dom** | Lightweight DOM for Vitest | `npm install -D happy-dom` |
| **Playwright** | E2E and cross-browser | `npm install -D @playwright/test` |
| **Lighthouse CI** | Performance budgets | `npm install -D @lhci/cli` |

### 7.2 Game-Specific Testing Tools

| Tool | Purpose | Notes |
|------|---------|-------|
| **Phaser Debug Plugin** | FPS overlay, physics debug | Built into Phaser |
| **dat.GUI** | Runtime variable tweaking | Useful for balance testing |
| **Chrome DevTools Performance** | Frame time profiling | Use regularly |
| **Android Profiler** | Native performance | Android Studio |
| **Instruments (Xcode)** | Native performance | macOS only |

### 7.3 Visual Testing Tools

| Tool | Purpose | Notes |
|------|---------|-------|
| **Percy** | Visual regression | Cloud service, paid |
| **Playwright screenshots** | Baseline comparison | Built-in, free |
| **Storybook** | Component isolation | If extracting UI components |

### 7.4 Mobile Testing Tools

| Tool | Purpose | Notes |
|------|---------|-------|
| **iOS Simulator** | iOS testing without device | macOS only |
| **Android Emulator** | Android testing without device | Slow on some machines |
| **BrowserStack** | Real device cloud | Paid service |
| **Firebase Test Lab** | Android device farm | Pay per test |

---

## 8. Recommendations

### 8.1 Priority 0 (Before Any Development)

| Task | Effort | Rationale |
|------|--------|-----------|
| Install Vitest in all packages | Low | Foundation for all testing |
| Add `npm test` script to root | Low | Unified test command |
| Write tests for existing `types.ts` utilities | Low | `formatMile`, `formatTime` are pure functions |
| Add CI build verification | Low | GitHub Actions for build-only |

### 8.2 Priority 1 (Alongside Feature Development)

| Task | Effort | Rationale |
|------|--------|-----------|
| Test extracted simulation logic | Medium | Highest-value unit tests |
| Test GameStorage integration | Medium | Critical for offline-first |
| Test InputManager normalization | Medium | Ensures keyboard/touch parity |
| Add Playwright smoke tests | Medium | Catches regressions |
| Define performance budgets | Low | Lighthouse CI configuration |

### 8.3 Priority 2 (After MVP Features Complete)

| Task | Effort | Rationale |
|------|--------|-----------|
| Full platform matrix testing | High | Requires devices, time |
| Visual regression baseline | Medium | Capture known-good screenshots |
| Extended stress testing | Medium | 30-minute play sessions |
| Accessibility audit | Medium | Screen reader, contrast |

### 8.4 Priority 3 (Pre-Launch)

| Task | Effort | Rationale |
|------|--------|-----------|
| App Store submission testing | Medium | iOS/Android specific requirements |
| Beta testing cohort | High | Real user feedback |
| Load testing (if multiplayer) | Medium | Colyseus capacity |

---

## 9. Test Environment Setup

### 9.1 Recommended Configuration Files

**`vitest.config.ts` (root):**

```typescript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'happy-dom',
    include: ['**/*.{test,spec}.{js,ts}'],
    coverage: {
      reporter: ['text', 'json', 'html'],
      exclude: ['**/node_modules/**', '**/dist/**']
    }
  }
});
```

**`playwright.config.ts`:**

```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
    { name: 'Mobile Chrome', use: { ...devices['Pixel 5'] } },
    { name: 'Mobile Safari', use: { ...devices['iPhone 12'] } },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
});
```

### 9.2 Package.json Scripts

```json
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest",
    "test:coverage": "vitest run --coverage",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "test:perf": "lhci autorun"
  }
}
```

---

## 10. Risk Assessment

### 10.1 High-Risk Areas

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| **Offline persistence failure** | Medium | Critical | Extensive IndexedDB testing, error recovery |
| **Simulation drift** | High | High | Extract shared simulation, identical tests |
| **Touch input feels wrong** | Medium | High | Early device testing, iterative tuning |
| **Performance on low-end devices** | High | High | Regular profiling on target devices |
| **Capacitor/native build failures** | Medium | Medium | Test native builds early, not last |

### 10.2 Testing Gaps to Monitor

| Gap | Risk Level | Notes |
|-----|------------|-------|
| No device lab | High | May need BrowserStack or physical devices |
| macOS required for iOS | Medium | Ensure team has Mac access |
| Manual playtesting time | Medium | Reserve time for non-automated testing |
| Colyseus integration testing | Low | Defer if offline-first is primary |

---

## 11. Quality Gates

### 11.1 PR Merge Requirements

- [ ] All unit tests pass
- [ ] TypeScript compiles without errors
- [ ] Build succeeds for web target
- [ ] No new lint warnings (if linter configured)

### 11.2 Release Requirements

- [ ] 80%+ unit test coverage on `shared` package
- [ ] E2E smoke tests pass on Chrome and Safari
- [ ] Performance budgets met on target devices
- [ ] Manual platform matrix testing complete
- [ ] Offline scenarios tested on real devices
- [ ] No P0 bugs open

---

## Summary

Trail Legs requires a testing strategy that balances automated verification of core logic with manual validation of game feel and cross-platform behavior. The highest-priority investment is:

1. **Unit tests for shared simulation** - Prevents online/offline drift
2. **Integration tests for IndexedDB storage** - Validates offline-first requirement
3. **E2E smoke tests** - Catches cross-platform regressions
4. **Device testing on low-end hardware** - Validates 60fps requirement

The current codebase has zero test coverage, which is a significant gap. Establishing test infrastructure alongside the architectural refactoring (simulation extraction) will provide maximum value for minimum effort.

**Estimated Testing Effort:** 15-20% of total development time should be allocated to testing activities, split between automation (70%) and manual testing (30%).

---

*End of QA Assessment*
