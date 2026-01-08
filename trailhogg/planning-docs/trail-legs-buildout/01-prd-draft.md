# Trail Legs Build-Out
## Product Requirements Document

**Version:** 1.0
**Date:** 2026-01-07
**Status:** Draft for Consultant Review

---

## 1. Executive Summary

This document defines the requirements for building out the Trail Legs MVP prototype into a polished, deployable game. The existing prototype has a working Phaser 3 client, Colyseus multiplayer server, and core game mechanics. This build-out focuses on making the game production-ready across four platforms: web browser, mobile web, iOS native, and Android native.

### What We Are NOT Doing

This is not a feature expansion. We are not adding new game content, extending the trail beyond the existing 30 miles, or building new game systems. The full game PRD (`trailhogg-prd.md`) defines the complete vision. This document focuses purely on making the existing MVP playable and polished for real users.

### Build-Out Scope Summary

| Area | What Exists | What We Are Building |
|------|-------------|---------------------|
| Dependencies | Phaser 3.70, Vite 5, Colyseus 0.15 | Upgrade to latest stable versions |
| Graphics | Placeholder colored rectangles | Pixel art sprites and assets |
| Offline | Basic fallback mode | Full IndexedDB persistence |
| Mobile | Keyboard controls only | Touch controls, responsive UI |
| Native Apps | None | Capacitor iOS/Android builds |
| Polish | Basic scene structure | Inventory UI, audio, shelter interactions |

---

## 2. Goals

### Primary Goals

1. **Cross-platform deployment** - Single codebase playable on web, mobile web, iOS App Store, and Google Play
2. **Offline-first architecture** - Game state persists in IndexedDB; works fully without connectivity
3. **Production graphics** - Replace all placeholder assets with cohesive pixel art
4. **Mobile-native experience** - Touch controls that feel natural, not ported keyboard controls

### Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Platform Coverage | 4 platforms | Web + Mobile Web + iOS + Android |
| Offline Functionality | 100% features | All gameplay works without server |
| App Bundle Size | < 50MB | iOS/Android build output |
| Mobile Performance | 60fps | 3-year-old device benchmark |
| Touch Responsiveness | < 100ms | Input-to-action latency |
| Session Persistence | 100% | Crash recovery, app switch, restart |

---

## 3. User Stories

### Platform Stories

**US-P1: Web Browser Player**
> As a player on a desktop or laptop, I want to play Trail Legs in my web browser so that I can start playing immediately without installing anything.

**Acceptance Criteria:**
- Game loads in Chrome, Firefox, Safari, Edge (current and previous major version)
- Full keyboard controls work
- Game state persists across browser sessions
- Can toggle fullscreen mode

**US-P2: Mobile Web Player**
> As a player on a smartphone, I want to play Trail Legs in my mobile browser so that I can play without installing an app.

**Acceptance Criteria:**
- Game responds to touch input
- UI elements are appropriately sized for touch
- Works in both portrait and landscape
- Add-to-homescreen / PWA installation works

**US-P3: iOS App User**
> As an iPhone or iPad user, I want to download Trail Legs from the App Store so that I have a native app experience.

**Acceptance Criteria:**
- App appears in App Store search
- Installs like any native app
- Opens instantly (no browser chrome)
- Receives push notifications for updates

**US-P4: Android App User**
> As an Android user, I want to download Trail Legs from Google Play so that I have a native app experience.

**Acceptance Criteria:**
- App appears in Google Play search
- Installs like any native app
- Works on Android 10+ (API 29+)
- Back button behaves correctly

### Offline Stories

**US-O1: Disconnected Play**
> As a hiker on the trail with no cell signal, I want to play Trail Legs offline so that I can enjoy the game anywhere.

**Acceptance Criteria:**
- Game launches without network connection
- All gameplay features work offline
- No error messages about connectivity
- Offline mode is seamless (no special steps needed)

**US-O2: Session Persistence**
> As a player who closes the app mid-session, I want my progress saved automatically so that I never lose game state.

**Acceptance Criteria:**
- Auto-save triggers every 60 seconds
- Save on app close/background
- Resume from exact state on reopen
- Works after device restart

**US-O3: Cloud Sync (Future-Ready)**
> As a player returning to connectivity, I want my offline progress to sync to the server so that I can continue on other devices.

**Acceptance Criteria:**
- Offline actions are queued
- Sync happens automatically when online
- Conflicts resolved (server authoritative)
- User notified of sync status

### Mobile Experience Stories

**US-M1: Touch Movement**
> As a mobile player, I want to control my hiker with touch gestures so that gameplay feels natural.

**Acceptance Criteria:**
- Tap to start/stop hiking
- Swipe or drag to change pace
- Touch targets minimum 44x44 points
- No accidental inputs from hold/scroll

**US-M2: Touch-Friendly UI**
> As a mobile player, I want UI elements sized appropriately for touch so that I can interact accurately.

**Acceptance Criteria:**
- All buttons minimum 44x44 touch target
- Status bars readable without zooming
- Menu items have adequate spacing
- No elements hidden by device notch/home indicator

**US-M3: Portrait and Landscape**
> As a mobile player, I want to play in either orientation so that I can hold my device comfortably.

**Acceptance Criteria:**
- UI adapts to orientation change
- No content clipped or hidden
- Controls reposition appropriately
- Orientation lock optional

### Graphics Stories

**US-G1: Hiker Character**
> As a player, I want to see a pixel art hiker sprite so that the game feels polished and intentional.

**Acceptance Criteria:**
- Hiker sprite with walking animation
- At least 4 directional views (or side-scroll appropriate)
- Idle animation
- Scale appropriate for mobile viewing

**US-G2: Trail Environment**
> As a player, I want to see a cohesive trail environment so that the game is visually appealing.

**Acceptance Criteria:**
- Trail path sprite/tileset
- Tree sprites (multiple variations)
- Ground/grass tiles
- White blaze sprites (single, double, blue)

**US-G3: Weather Effects**
> As a player, I want to see visual weather effects so that weather feels impactful.

**Acceptance Criteria:**
- Rain particle effect (light and heavy)
- Fog overlay effect
- Day/night tinting
- Storm effects (dark, rain, occasional flash)

**US-G4: UI Elements**
> As a player, I want pixel art UI elements so that the interface matches the game style.

**Acceptance Criteria:**
- Status bars with pixel styling
- Button sprites
- Icon set (food, water, rest, map)
- Moodle icons matching the pixel art style

### Polish Stories

**US-PL1: Inventory Screen**
> As a player, I want to view and manage my inventory so that I can track my gear and supplies.

**Acceptance Criteria:**
- Accessible via button or gesture
- Shows all gear items with condition
- Shows food supplies with calories
- Shows water level and capacity

**US-PL2: Shelter Interaction**
> As a player reaching a shelter, I want to interact with it so that I can rest and recover.

**Acceptance Criteria:**
- Shelter appears when at correct mile marker
- Can enter shelter (if capacity)
- See shelter info (privy, water source, etc.)
- Sleep option with time advancement

**US-PL3: Audio Feedback**
> As a player, I want audio that matches the trail experience so that the game is more immersive.

**Acceptance Criteria:**
- Footstep sounds
- Ambient forest audio (birds, wind)
- Rain audio that matches weather
- UI feedback sounds
- Master volume control

---

## 4. Functional Requirements

### 4.1 Platform and Infrastructure

#### FR-INFRA-01: Dependency Upgrades
Update all core dependencies to latest stable versions as identified in STACK-AUDIT.md.

| Package | Current | Target | Notes |
|---------|---------|--------|-------|
| Phaser | 3.70.0 | 3.90.0 | Required for mobile pipeline |
| Vite | 5.0.0 | 7.x | Breaking changes minimal |
| Colyseus | 0.15.0 | 0.16.5 | Minor version upgrade |
| TypeScript | 5.3.3 | 5.7.x | When convenient |

#### FR-INFRA-02: Capacitor Integration
Add Capacitor to enable native iOS and Android builds.

Requirements:
- Install `@capacitor/core` and `@capacitor/cli`
- Configure app identifier: `com.hoggcountry.traillegs`
- Add iOS platform with `npx cap add ios`
- Add Android platform with `npx cap add android`
- Configure splash screens and app icons

#### FR-INFRA-03: PWA Support
Enable Progressive Web App functionality for mobile web users.

Requirements:
- Add `vite-plugin-pwa` to build
- Configure service worker for offline assets
- Add web app manifest
- Configure icons for home screen installation

#### FR-INFRA-04: Build Pipeline
Configure builds for all platforms.

Requirements:
- `npm run build:web` - Web deployment bundle
- `npm run build:ios` - Xcode project sync
- `npm run build:android` - Android Studio project sync
- CI/CD pipeline for automated builds (optional for MVP)

### 4.2 Offline-First Storage

#### FR-OFFLINE-01: IndexedDB Persistence Layer
Implement persistent storage using localforage library.

Requirements:
- Add `localforage` package
- Create storage service in shared package
- Store: hiker state, game state, settings
- Auto-save every 60 seconds during active play

#### FR-OFFLINE-02: Save/Load System
Implement save game management.

Requirements:
- Auto-save on significant events (shelter reach, town reach)
- Auto-save on app background/close
- Load saved state on app launch
- Multiple save slot support (stretch goal)

#### FR-OFFLINE-03: Offline Mode Detection
Handle connectivity state gracefully.

Requirements:
- Detect online/offline status
- Show indicator when offline (subtle, not disruptive)
- Queue actions for sync when online
- Handle reconnection gracefully

#### FR-OFFLINE-04: Sync Protocol (Foundation Only)
Prepare for future cloud sync without full implementation.

Requirements:
- Structure offline action queue
- Timestamp all state changes
- Document sync protocol for future
- Note: Full sync is out of scope for this build-out

### 4.3 Graphics and Assets

#### FR-GFX-01: Sprite Requirements

**Hiker Character**
- Size: 32x48 pixels (scalable)
- Walking animation: 4 frames minimum
- Idle animation: 2 frames minimum
- States: normal, tired (slouched posture)

**Trees**
- 3-5 variations
- Size: ~64x96 pixels
- Support for blaze attachment point

**Trail**
- Tileable path texture
- Width: ~128 pixels
- Ground/grass tiles for sides

**Blazes**
- Single white blaze: 8x16 pixels
- Double white blaze: 8x32 pixels
- Blue blaze: 8x16 pixels
- Rock cairn: 24x24 pixels

**Weather**
- Rain drop sprite: 4x12 pixels
- Fog overlay: 256x256 alpha gradient
- Lightning flash: screen overlay

**UI Elements**
- Status bar frame
- Button sprites (normal, pressed, disabled)
- Icons: 16x16 or 24x24

#### FR-GFX-02: Texture Atlas
Package all sprites into texture atlases for performance.

Requirements:
- Main spritesheet for gameplay elements
- UI spritesheet for interface elements
- Use Phaser-compatible format (JSON + PNG)

#### FR-GFX-03: Color Palette
Establish consistent color palette.

Requirements:
- Document color codes in design spec
- Earthy greens, browns, grays for forest
- Warm accent colors for UI
- White for blazes (high contrast)

### 4.4 Mobile Experience

#### FR-MOBILE-01: Touch Input System
Implement touch controls for all game actions.

| Action | Touch Gesture | Notes |
|--------|---------------|-------|
| Start/Stop Hiking | Single tap (main area) | Avoid UI elements |
| Change Pace | Swipe up/down | Or tap pace buttons |
| Eat | Tap food button | Or swipe to inventory |
| Drink | Tap water button | Or swipe to inventory |
| Rest/Camp | Long press | Confirm dialog |
| Open Menu | Tap menu button | Top corner |
| Open Inventory | Tap inventory button | Or swipe left |

#### FR-MOBILE-02: Responsive UI Layout
Adapt UI to different screen sizes and orientations.

Requirements:
- Minimum supported: 320x568 (iPhone SE)
- Maximum: tablet displays
- Safe area insets for notch/home indicator
- Font sizes scale appropriately

#### FR-MOBILE-03: Touch Feedback
Provide haptic and visual feedback for touch actions.

Requirements:
- Visual: button press states
- Haptic: light tap on button press (Capacitor haptics)
- Audio: optional UI sounds

#### FR-MOBILE-04: Virtual Controls Layer
Create a dedicated input layer for touch.

Requirements:
- Overlay on game scene
- Does not interfere with game rendering
- Configurable position (future accessibility)

### 4.5 Game Polish

#### FR-POLISH-01: Inventory UI
Add dedicated inventory screen.

Requirements:
- Accessible from gameplay via button
- Grid layout for gear items
- List layout for consumables (food, water)
- Item details on tap
- Condition bars for gear

#### FR-POLISH-02: Shelter Interaction UI
Add shelter interaction when player reaches shelter location.

Requirements:
- Shelter info panel (name, capacity, amenities)
- Enter/exit shelter action
- Sleep action with duration selection
- Water source access (if available)

#### FR-POLISH-03: Audio System
Implement game audio.

Requirements:
- Audio manager class
- Preload audio assets in BootScene
- Volume control in settings
- Audio categories: ambient, effects, UI

| Audio Type | Files Needed |
|------------|--------------|
| Footsteps | 3-4 variations per terrain |
| Ambient | Day forest, night forest, rain, storm |
| Effects | Eat, drink, rest, alert |
| UI | Button tap, menu open/close |

#### FR-POLISH-04: Settings Screen
Add basic settings management.

Requirements:
- Audio volume (master, effects, ambient)
- Haptic feedback toggle
- Credits/About section

---

## 5. Non-Functional Requirements

### NFR-01: Performance

| Metric | Requirement | Notes |
|--------|-------------|-------|
| Frame Rate | 60 fps sustained | On 3-year-old mid-range device |
| Load Time | < 3 seconds | From cold start to gameplay |
| Memory | < 200MB | Peak usage during gameplay |
| CPU | < 30% sustained | Average during hiking |

### NFR-02: Size Constraints

| Platform | Max Size | Notes |
|----------|----------|-------|
| Web | < 10MB | Initial download |
| iOS | < 50MB | App Store download |
| Android | < 50MB | Play Store download |

### NFR-03: Compatibility

| Platform | Minimum Version |
|----------|-----------------|
| Chrome | 100+ |
| Firefox | 100+ |
| Safari | 15+ |
| Edge | 100+ |
| iOS | 15+ |
| Android | 10+ (API 29) |

### NFR-04: Accessibility (Baseline)

| Requirement | Implementation |
|-------------|----------------|
| Text size | Minimum 14pt equivalent |
| Color contrast | 4.5:1 for text |
| Touch targets | Minimum 44x44 points |
| Screen reader | Labels for UI elements |

### NFR-05: Data Storage

| Data Type | Storage Location | Size Estimate |
|-----------|-----------------|---------------|
| Game state | IndexedDB | < 100KB per save |
| Settings | localStorage | < 1KB |
| Assets | Cache (Service Worker) | < 15MB |

---

## 6. Success Criteria

This build-out is complete when:

### Platform Deployment
- [ ] Web version deployed and accessible
- [ ] PWA installs from mobile browser
- [ ] iOS app builds in Xcode without errors
- [ ] Android app builds in Android Studio without errors
- [ ] All four platforms run the same game

### Offline Functionality
- [ ] Game launches with airplane mode on
- [ ] Full gameplay works offline
- [ ] Progress persists after app close
- [ ] Progress persists after device restart

### Graphics
- [ ] No placeholder rectangles visible
- [ ] Cohesive pixel art style throughout
- [ ] Weather effects render correctly
- [ ] UI matches game aesthetic

### Mobile
- [ ] All actions achievable via touch
- [ ] UI readable without zooming
- [ ] No overlapping touch targets
- [ ] Works in portrait and landscape

### Performance
- [ ] 60fps on test devices
- [ ] < 50MB app bundle
- [ ] < 3 second load time

### Polish
- [ ] Inventory screen functional
- [ ] Shelter interaction works
- [ ] Audio plays correctly
- [ ] Settings persist

---

## 7. Out of Scope

The following are explicitly NOT part of this build-out:

### Game Content
- Extending trail beyond existing 30 miles
- Adding new skills or moodles
- New character builds or traits
- Injury/illness system expansion
- Trail name system
- Tramily mechanics

### Backend Features
- User accounts and authentication
- Cloud save synchronization (foundation only)
- Large-scale multiplayer servers
- Analytics and telemetry

### Platform Features
- Steam/desktop distribution
- Gamepad support
- Multiple save slots (stretch goal only)
- Achievements

### Art
- Cutscenes or story sequences
- Character customization visuals
- NPC hiker sprites (future)
- Town/shelter interior views

---

## 8. Technical Architecture Notes

### State Management Flow

```
[User Input]
     |
     v
[Touch/Keyboard Handler]
     |
     v
[Game Scene] <----> [Offline Simulation]
     |                     |
     v                     v
[Colyseus Client] <-> [IndexedDB Storage]
     |
     v
[Server (if online)]
```

### Offline-First Data Flow

```
1. App Launch
   |-> Check IndexedDB for saved state
   |-> If exists: Load and resume
   |-> If not: Show character create

2. During Play
   |-> All state changes write to IndexedDB
   |-> Timer triggers auto-save every 60s
   |-> Significant events trigger immediate save

3. App Close
   |-> Save current state to IndexedDB
   |-> Queue unsynced changes (for future sync)

4. Reconnection (future)
   |-> Send queued actions to server
   |-> Receive authoritative state
   |-> Reconcile local state
```

### Asset Loading Strategy

```
Boot Scene:
1. Show loading bar
2. Load sprite atlases
3. Load audio files
4. Initialize storage layer
5. Check for saved game
6. Proceed to Menu or Resume
```

---

## 9. Open Questions

1. **Art Style**: Need pixel art assets. Will they be created, purchased, or contracted?
2. **Audio**: Need audio assets. Use royalty-free, generate, or commission?
3. **App Store Accounts**: Do Apple Developer and Google Play Console accounts exist?
4. **Testing Devices**: What devices are available for mobile testing?
5. **Timeline**: What is the target completion date for this build-out?

---

## Appendix A: Existing Codebase Summary

### Files to Modify

| File | Changes |
|------|---------|
| `client/package.json` | Upgrade Phaser, Vite, add Capacitor |
| `client/vite.config.ts` | Add PWA plugin, Capacitor config |
| `client/src/main.ts` | Initialize storage, touch input |
| `client/src/scenes/BootScene.ts` | Load new assets, check saved state |
| `client/src/scenes/GameScene.ts` | Add touch controls, save triggers |
| `client/src/scenes/UIScene.ts` | Responsive layout, touch-friendly |
| `server/package.json` | Upgrade Colyseus |
| `shared/package.json` | Add localforage |

### New Files Needed

| File | Purpose |
|------|---------|
| `client/src/storage/GameStorage.ts` | IndexedDB wrapper |
| `client/src/input/TouchInput.ts` | Touch control handler |
| `client/src/scenes/InventoryScene.ts` | Inventory UI |
| `client/src/scenes/SettingsScene.ts` | Settings UI |
| `client/src/audio/AudioManager.ts` | Audio system |
| `client/capacitor.config.ts` | Capacitor configuration |
| `client/manifest.json` | PWA manifest |
| Assets in `client/public/assets/` | All graphics and audio |

---

*End of Build-Out PRD*
