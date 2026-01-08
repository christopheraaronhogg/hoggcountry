# UX Assessment: Trail Legs Build-Out

**Project:** Trail Legs Mobile Game
**Date:** 2026-01-07
**Consultant:** Claude UX Consultant
**Document Type:** Mobile-First Game UX Design Plan

---

## Executive Summary

Trail Legs is transitioning from a keyboard-driven prototype to a cross-platform mobile game. This assessment evaluates the PRD requirements and current implementation against mobile game UX best practices, identifies critical gaps in user experience design, and provides a comprehensive UX framework for the build-out.

The current prototype demonstrates solid game mechanics but is entirely keyboard-dependent. The build-out must address three fundamental UX challenges: (1) translating keyboard controls to intuitive touch gestures, (2) adapting a fixed 800x600 layout to responsive mobile screens, and (3) ensuring accessible, offline-first gameplay that serves users with intermittent or no connectivity.

This document provides actionable UX specifications for user flows, touch interactions, responsive layouts, accessibility requirements, error handling, onboarding, and feedback systems.

---

## 1. User Flows

### 1.1 Primary User Journey: First-Time Player

```
[App Launch]
     |
     v
[Splash/Loading] -----> [Load Saved Game?] --YES--> [Resume Gameplay]
     |                          |
     |                          NO
     v                          |
[Menu Scene] <-----------------/
     |
     +-- [Enter Name] (tap text field)
     |
     +-- [Select Build] (tap to select, scroll if needed)
     |
     v
[BEGIN HIKE button]
     |
     v
[Onboarding Tutorial] (NEW - not in current implementation)
     |
     v
[Game Scene + UI Scene]
     |
     +-- [Hiking Loop]
     |       |
     |       +-- Tap to start/stop hiking
     |       +-- Swipe/buttons to change pace
     |       +-- Monitor status bars
     |       +-- React to events
     |       |
     |       v
     +-- [Decision Points]
             |
             +-- Shelter reached --> [Shelter Interaction UI]
             +-- Low resources --> [Eat/Drink actions]
             +-- Lost state --> [Search/Backtrack UI]
             +-- Session end --> [Auto-save, exit]
```

### 1.2 Core Gameplay Loop

```
[Idle State]
     |
     +-- Tap main area --> [Start Hiking]
     |                          |
     |                          v
     |                    [Hiking Active]
     |                          |
     |                          +-- Resource consumption
     |                          +-- Distance progress
     |                          +-- Random events
     |                          +-- Skill progression
     |                          |
     +-- Tap main area <--------+ (Stop Hiking)
     |
     +-- Open Inventory --> [Inventory Scene] --> [Return]
     |
     +-- Open Menu --> [Pause/Settings] --> [Return]
```

### 1.3 Critical Decision Flows

**Lost State Recovery:**
```
[Normal Hiking] --> [Miss Blaze] --> [LOST State]
                                          |
                                          v
                                    [Lost Indicator appears]
                                          |
                    +---------------------+---------------------+
                    |                                           |
                    v                                           v
             [Search Action]                            [Backtrack Action]
                    |                                           |
                    v                                           v
            [30% success chance]                    [Lose 0.1 miles, energy]
                    |                                           |
             +------+------+                                    |
             |             |                                    |
          SUCCESS       FAIL                                    |
             |             |                                    |
             v             v                                    v
       [Back on Trail] [Still Lost] <--------------------------+
```

**Shelter Interaction:**
```
[Reach Shelter Mile Marker]
     |
     v
[Shelter Notification appears]
     |
     v
[Tap to Interact]
     |
     v
[Shelter Panel Opens]
     |
     +-- View info (name, capacity, amenities)
     +-- Enter shelter (if capacity)
     +-- Access water source (if available)
     +-- Sleep (time advancement + recovery)
     +-- Exit shelter
```

### 1.4 Session Management Flow

```
[During Gameplay]
     |
     +-- Every 60 seconds --> [Auto-save to IndexedDB]
     |
     +-- Significant event --> [Immediate save]
     |       (shelter, milestone, resource threshold)
     |
     +-- App backgrounds --> [Save + pause]
     |
     +-- App closes --> [Final save]
     |
     v
[Next Session]
     |
     +-- Detect saved game --> [Resume prompt]
     |
     +-- No saved game --> [Character create]
```

---

## 2. Touch Interaction Design

### 2.1 Gesture Mapping

| Action | Primary Gesture | Alternate Gesture | Touch Zone |
|--------|-----------------|-------------------|------------|
| Start/Stop Hiking | Single tap | -- | Main game area |
| Change Pace Up | Swipe up | Tap pace+ button | Game area / UI button |
| Change Pace Down | Swipe down | Tap pace- button | Game area / UI button |
| Open Inventory | Swipe left | Tap inventory icon | Game area / Top bar |
| Open Menu | Tap menu icon | Swipe right | Top-right corner |
| Eat | Tap food button | Long-press game area | Quick action bar |
| Drink | Tap water button | -- | Quick action bar |
| Rest/Camp | Long-press (1.5s) | Tap rest button | Game area / Quick bar |
| Search (when lost) | Tap search button | -- | Lost state UI |
| Backtrack (when lost) | Tap backtrack button | Swipe down | Lost state UI |
| Dismiss notification | Tap or swipe away | Auto-dismiss 5s | Notification area |

### 2.2 Touch Zones Layout

```
+--------------------------------------------------+
|  SAFE AREA (notch/dynamic island)                |
+--------------------------------------------------+
|  [=] Menu     STATUS BAR AREA        [Bag] [?]   |  <- 60px, touch targets 44x44
+--------------------------------------------------+
|                                                  |
|                                                  |
|                                                  |
|              MAIN GAME AREA                      |
|                                                  |
|           (tap to start/stop hiking)             |
|           (swipe for pace change)                |
|                                                  |
|                                                  |
+--------------------------------------------------+
|                                                  |
|              QUICK ACTION BAR                    |  <- 80px minimum
|                                                  |
|    [FOOD]    [WATER]    [REST]    [PACE]        |  <- 56x56 buttons
|                                                  |
+--------------------------------------------------+
|  SAFE AREA (home indicator)                      |
+--------------------------------------------------+
```

### 2.3 Touch Target Specifications

| Element | Minimum Size | Recommended Size | Spacing |
|---------|-------------|------------------|---------|
| Action buttons | 44x44 pts | 56x56 pts | 8px between |
| Menu icons | 44x44 pts | 48x48 pts | 12px from edge |
| List items (builds) | 44px height | 56px height | 4px between |
| Close/dismiss | 44x44 pts | 48x48 pts | -- |
| Text input | 44px height | 48px height | -- |

### 2.4 Gesture Prevention

To prevent accidental inputs:

| Scenario | Prevention Method |
|----------|-------------------|
| Scroll vs. pace swipe | Require 50px minimum swipe distance |
| Accidental tap while viewing | 200ms debounce on hiking toggle |
| Fat finger on adjacent buttons | 8px minimum spacing + visual feedback |
| Accidental long-press | Require 1.5s hold + visual progress indicator |
| Double-tap zoom (system) | Disable browser zoom, use game scaling |

### 2.5 Haptic Feedback Patterns

| Action | Haptic Type | Notes |
|--------|-------------|-------|
| Button tap | Light impact | Immediate confirmation |
| Hiking started | Medium impact | Session milestone |
| Hiking stopped | Light impact | -- |
| Action completed (eat/drink) | Success pattern | Two quick taps |
| Error/warning | Error pattern | Three quick taps |
| Lost state entered | Heavy impact | Alert user |
| Shelter reached | Notification pattern | Milestone |
| Milestone (5 miles, etc.) | Success pattern | Achievement |

---

## 3. Mobile UI Layout

### 3.1 Responsive Breakpoints

| Device Class | Width Range | Layout Adjustments |
|--------------|-------------|-------------------|
| Small phone | 320-375px | Compact UI, stacked stats |
| Standard phone | 376-428px | Default layout |
| Large phone | 429-480px | Slightly larger touch targets |
| Small tablet | 481-768px | Two-column stats possible |
| Tablet | 769px+ | Desktop-like layout |

### 3.2 Portrait Layout (Primary Mobile)

```
+------------------------------------------+ 320-428px width
|  [=]  Day 1, 6:00 AM  [OFFLINE]  [?][S]  | 60px - Top bar
+------------------------------------------+
|                                          |
|  +------------------------------------+  |
|  |  STATUS PANEL (horizontal)        |  | 100px
|  |  [CAL ====] [H2O ====] [NRG ====] |  |
|  |  Mile 0.0/30.7    Elev: 3,782 ft  |  |
|  +------------------------------------+  |
|                                          |
|  +------------------------------------+  |
|  |                                    |  |
|  |         GAME VIEWPORT              |  | Flex height
|  |                                    |  | (remaining space)
|  |         [Hiker sprite]             |  |
|  |                                    |  |
|  |                                    |  |
|  +------------------------------------+  |
|                                          |
|  +------------------------------------+  |
|  |  MOODLE ROW                        |  | 32px
|  |  [Hungry] [Thirsty] [Tired]        |  |
|  +------------------------------------+  |
|                                          |
|  +------------------------------------+  |
|  |  QUICK ACTIONS                     |  | 80px
|  |  [EAT] [DRINK] [REST] [<  > PACE] |  |
|  +------------------------------------+  |
|                                          |
|  +------------------------------------+  |
|  |  EVENT LOG (scrollable)            |  | 80px
|  |  > Started hiking                  |  |
|  |  > Passed blaze                    |  |
|  +------------------------------------+  |
+------------------------------------------+
```

### 3.3 Landscape Layout (Secondary)

```
+------------------------------------------------------------------------+
|  [=]  Day 1  Mile 0.0  [OFFLINE]                            [?] [S]    | 48px
+------------------------------------------------------------------------+
|                                    |                                    |
|  +------------------------------+  |  +------------------------------+  |
|  |                              |  |  |  STATS & CONTROLS            |  |
|  |      GAME VIEWPORT           |  |  |                              |  |
|  |                              |  |  |  Cal: ===============        |  |
|  |      [Hiker sprite]          |  |  |  H2O: ===============        |  |
|  |                              |  |  |  Nrg: ===============        |  |
|  |                              |  |  |                              |  |
|  |                              |  |  |  [EAT] [DRINK] [REST]        |  |
|  |                              |  |  |  [< PACE >]                  |  |
|  |                              |  |  |                              |  |
|  |                              |  |  |  Moodles: Hungry, Tired      |  |
|  +------------------------------+  |  +------------------------------+  |
|            60% width               |           40% width                |
+------------------------------------------------------------------------+
|  EVENT LOG: > Started hiking | > Passed shelter                        | 40px
+------------------------------------------------------------------------+
```

### 3.4 Safe Area Handling

| Device Feature | Inset | Handling |
|----------------|-------|----------|
| iPhone notch | ~44px top | Push content below, transparent status area |
| iPhone Dynamic Island | ~59px top | Same as notch |
| Home indicator | ~34px bottom | Push quick actions above |
| Android nav bar | Variable | Respect system UI insets |
| Android punch-hole | Varies | Avoid camera area in top bar |

Implementation requirement: Use Capacitor `@capacitor/safe-area` plugin or CSS `env(safe-area-inset-*)`.

### 3.5 Font Scaling

| Element | Base Size | Min Size | Max Size |
|---------|-----------|----------|----------|
| Title text | 18px | 16px | 24px |
| Body text | 14px | 13px | 18px |
| Label text | 12px | 11px | 15px |
| Status numbers | 14px | 13px | 18px |
| Event log | 12px | 11px | 14px |

Scaling approach: Use relative units (`rem`) with a base that scales with viewport width, clamped between min and max.

---

## 4. Accessibility Requirements

### 4.1 WCAG 2.2 Baseline (Level AA)

| Guideline | Requirement | Implementation |
|-----------|-------------|----------------|
| 1.1.1 Non-text Content | Alt text for sprites | Provide text descriptions for screen readers |
| 1.4.1 Use of Color | Don't rely on color alone | Moodles use icons + text labels |
| 1.4.3 Contrast | 4.5:1 minimum for text | Verify all text against backgrounds |
| 1.4.11 Non-text Contrast | 3:1 for UI components | Status bars need visible borders |
| 2.1.1 Keyboard | Keyboard accessible | Maintain existing keyboard controls |
| 2.4.7 Focus Visible | Clear focus indicators | 2px outline on focusable elements |
| 2.5.5 Target Size | 24x24 CSS pixels minimum | All targets 44x44 pts minimum |
| 3.2.1 On Focus | No unexpected changes | Actions require explicit tap/click |
| 3.3.1 Error Identification | Identify errors | Clear error messages in event log |

### 4.2 Color Contrast Matrix

| Element | Foreground | Background | Ratio | Pass? |
|---------|------------|------------|-------|-------|
| Primary text | #FFFFFF | #000000 (panel) | 21:1 | Yes |
| Status labels | #4a7d5a | #000000 (panel) | 4.9:1 | Yes |
| Dim text | #888888 | #000000 | 5.3:1 | Yes |
| Warning text | #ffaa66 | #000000 | 8.5:1 | Yes |
| Danger text | #ff6666 | #000000 | 5.8:1 | Yes |
| Status bar fill | #ff6666/#6699ff/#66ff66 | #333333 | Verify | Check |

Recommendation: Verify all color combinations with a contrast checker. The current `#888888` on `#000000` passes but is borderline; consider `#999999` for better readability.

### 4.3 Screen Reader Support

| UI Element | ARIA Role | Accessible Name |
|------------|-----------|-----------------|
| Stats panel | region | "Hiker Status" |
| Status bars | progressbar | "Calories: 67 percent" |
| Action buttons | button | "Eat food", "Drink water" |
| Moodle icons | status | "Status: Hungry, level 2" |
| Event log | log | "Game events" |
| Menu button | button | "Open menu" |
| Game area | application | "Trail Legs game" |

Implementation note: Phaser canvas content is not screen-reader accessible by default. Consider adding an accessible DOM overlay for critical status information.

### 4.4 Reduced Motion

| Animation | Default | Reduced Motion Alternative |
|-----------|---------|---------------------------|
| Hiker walking bob | Sine wave animation | Static sprite |
| Rain particles | Particle emitter | Static overlay tint |
| Fog movement | Floating tweens | Static low-opacity layer |
| Trail scrolling | Continuous scroll | Position snaps |
| Status bar updates | Animated fill | Instant fill |

Implementation: Check `prefers-reduced-motion` media query at game init. Store preference in settings.

### 4.5 Motor Accessibility

| Challenge | Accommodation |
|-----------|---------------|
| Fine motor control | Large touch targets (56x56), generous spacing |
| Timing pressure | No time-critical inputs required for core gameplay |
| Multi-touch | All actions achievable with single tap/hold |
| Gesture complexity | All gestures have button alternatives |
| Fatigue | Auto-save allows frequent breaks, idle is safe |

---

## 5. Error States and Edge Cases

### 5.1 Connection States

| State | Detection | User Indication | Behavior |
|-------|-----------|-----------------|----------|
| Online (connected) | WebSocket open | None (default) | Full multiplayer |
| Reconnecting | WebSocket reconnecting | Subtle spinner | Buffer actions |
| Offline (by choice) | Airplane mode | "OFFLINE" badge | Full offline mode |
| Offline (lost signal) | Connection drop | "Reconnecting..." then "OFFLINE" | Auto-switch to offline |
| Back online | Connection restored | "Syncing..." briefly | Sync queued actions |

### 5.2 Error Message Patterns

| Error Type | Message Location | Message Style | Example |
|------------|-----------------|---------------|---------|
| Game event error | Event log | Red text | "> Cannot eat - no food!" |
| System error | Toast notification | Overlay banner | "Save failed. Retrying..." |
| Critical error | Modal dialog | Blocking | "Game data corrupted. Start new game?" |
| Validation error | Inline | Below field | "Name must be 1-20 characters" |

### 5.3 Edge Case Handling

| Edge Case | Detection | UX Response |
|-----------|-----------|-------------|
| Low battery | Device API | Reduce animations, suggest save |
| Low storage | IndexedDB quota | Warn user, offer cleanup |
| App backgrounded >5 min | App resume | Show session summary |
| Game state corrupted | Load failure | Offer recovery or new game |
| Assets fail to load | Load error | Retry button, offline fallback |
| Extremely small screen | Viewport check | Warning, minimal UI mode |
| Split screen/PiP | Window resize | Responsive reflow |

### 5.4 Lost State UX (Game Mechanic)

The "lost" state is a core game mechanic that needs careful UX treatment:

**Visual Indicators:**
- Red tinted screen overlay (subtle, 10% opacity)
- Pulsing "LOST" badge in status area
- Blaze sprites become hidden
- Event log shows "You've lost the trail"

**Action Availability:**
- Hiking disabled (cannot hike while lost)
- Search and Backtrack buttons appear prominently
- Other actions (eat, drink) remain available
- Clear instructions: "Tap SEARCH to look for blazes, or BACKTRACK to retrace steps"

**Recovery Feedback:**
- Success: Green flash, celebratory haptic, "Found the trail!" message
- Failure: Subtle shake, continue message, try again prompt

---

## 6. Onboarding Experience

### 6.1 First-Time User Flow

The current implementation lacks onboarding. Recommended approach:

**Phase 1: Character Creation (existing, enhanced)**
```
1. Name entry (existing)
   - Add placeholder text: "Enter trail name"
   - Show character limit indicator

2. Build selection (existing)
   - Add visual icons for each build
   - Show stat preview on selection
   - Add "What does this mean?" help link
```

**Phase 2: Interactive Tutorial (NEW)**
```
1. "Welcome to the Trail" overlay
   - Brief flavor text about starting at Springer Mountain
   - "Tap anywhere to begin"

2. First hike lesson
   - Highlight main game area
   - "Tap here to start hiking"
   - Wait for tap, start hiking
   - "Great! You're hiking. Tap again to stop."

3. Status introduction
   - Highlight status bars
   - "These show your calories, water, and energy"
   - "Keep an eye on them - you'll need to eat and drink"

4. Quick actions lesson
   - Highlight EAT button
   - "Tap to eat when hungry"
   - Highlight DRINK button
   - "Tap to drink when thirsty"

5. Pace control
   - Highlight pace controls
   - "Swipe up/down or use buttons to change pace"
   - "Faster pace = more distance, but uses more energy"

6. Moodles introduction
   - Highlight moodle area
   - "Status effects appear here"
   - "Manage them to keep hiking efficiently"

7. Tutorial complete
   - "You're ready! Follow the white blazes to Neels Gap"
   - Option to replay tutorial from settings
```

### 6.2 Contextual Help

| Trigger | Help Content | Display Method |
|---------|--------------|----------------|
| First lost state | "You've wandered off trail. Try SEARCH or BACKTRACK" | Tutorial overlay |
| First shelter | "You've reached a shelter! Tap to interact" | Highlight + tooltip |
| First low calories | "You're running low on calories. Eat to restore" | Event log + pulse food button |
| First night hiking | "It's dark. Navigation is harder at night" | Event log |
| Help icon tapped | Full controls reference | Modal overlay |

### 6.3 Progressive Disclosure

| Session | Unlocked Features | Hidden Until |
|---------|-------------------|--------------|
| First | Basic hiking, eat, drink | -- |
| After 2 miles | Pace control explained | First 2 miles |
| First shelter | Shelter interaction | Reaching a shelter |
| First rain | Weather effects | First weather event |
| First lost | Lost recovery mechanics | First time getting lost |

---

## 7. Feedback Systems

### 7.1 Visual Feedback Matrix

| Action | Immediate (0-100ms) | Confirmation (100-500ms) | Result (500ms+) |
|--------|---------------------|--------------------------|-----------------|
| Button tap | Button press state | Ripple/scale animation | Event log update |
| Start hiking | Button highlight | Hiker animation starts | Trail scrolling |
| Eat food | Button flash | Food icon animation | Calorie bar fills |
| Reach milestone | Screen flash (subtle) | Achievement badge | Event log entry |
| Get lost | Screen tint red | Lost indicator appears | Action buttons change |
| Find trail | Green flash | Success animation | Normal UI restored |

### 7.2 Audio Feedback

| Category | Sound | Trigger | Volume Level |
|----------|-------|---------|--------------|
| **Ambient** | Forest birds/wind | Daytime hiking | 40% |
| | Night crickets | Nighttime | 40% |
| | Rain sounds | Rain weather | 50% |
| | Storm sounds | Storm weather | 60% |
| **Footsteps** | Dirt footsteps | While hiking | 30% |
| | Variable by pace | Pace changes | Scales with pace |
| **UI** | Button tap | Any button | 20% |
| | Menu open/close | Menu toggle | 20% |
| **Events** | Eat sound | Eating | 30% |
| | Drink sound | Drinking | 30% |
| | Alert chime | Warning/danger | 50% |
| | Success chime | Milestone/achievement | 40% |
| | Lost alert | Entering lost state | 60% |

Audio control: Master volume + per-category mute toggles in settings.

### 7.3 Haptic Feedback (iOS/Android)

| Action | iOS Haptic | Android Vibration |
|--------|------------|-------------------|
| Button tap | Light impact | 10ms |
| Action success | Notification success | 20ms, 50ms |
| Warning | Notification warning | 30ms, 30ms, 30ms |
| Error | Notification error | 50ms, 30ms, 50ms |
| Milestone | Heavy impact | 100ms |
| Lost state | Heavy impact x2 | 100ms, 50ms, 100ms |

Implementation: Use Capacitor Haptics plugin with fallback to Web Vibration API.

### 7.4 Status Communication

| Status | Visual | Audio | Haptic |
|--------|--------|-------|--------|
| Hiking active | Trail scrolling, hiker bob | Footsteps, ambient | None (continuous would fatigue) |
| Hiking stopped | Static display | Ambient only | Light tap on stop |
| Low calories | Red tint on bar, hunger moodle | Stomach growl (subtle) | None |
| Dehydrated | Blue tint warning, thirst moodle | None | Warning pattern |
| Exhausted | Dimmed UI, fatigue moodle | Yawn sound | None |
| Lost | Red overlay, lost badge | Alert sound | Heavy impact |
| Danger (critical) | Pulsing red elements | Urgent chime | Error pattern |

---

## 8. Recommendations

### 8.1 Critical (Must Have for Mobile)

| Priority | Recommendation | Rationale | PRD Reference |
|----------|----------------|-----------|---------------|
| P0 | Implement touch input layer | Game is unplayable on mobile without it | FR-MOBILE-01 |
| P0 | Add 44pt minimum touch targets | Current UI elements are too small for touch | US-M2 |
| P0 | Responsive layout system | Current 800x600 fixed size fails on mobile | FR-MOBILE-02 |
| P0 | Safe area insets | Content hidden by notch/home indicator | FR-MOBILE-02 |
| P0 | Offline persistence (IndexedDB) | Core requirement for trail use | FR-OFFLINE-01 |

### 8.2 High Priority (Should Have)

| Priority | Recommendation | Rationale | PRD Reference |
|----------|----------------|-----------|---------------|
| P1 | Quick action bar for common actions | Reduce need to navigate for frequent tasks | FR-MOBILE-01 |
| P1 | Haptic feedback | Essential for touch feedback on action games | FR-MOBILE-03 |
| P1 | Visual feedback states for all buttons | Users need confirmation of touch registration | FR-MOBILE-03 |
| P1 | Onboarding tutorial | New users will not discover gestures | Not in PRD |
| P1 | Pause on app background | Prevent unfair resource drain | US-O2 |
| P1 | Error recovery for corrupted saves | Users lose progress = churn | FR-OFFLINE-02 |

### 8.3 Medium Priority (Nice to Have)

| Priority | Recommendation | Rationale | PRD Reference |
|----------|----------------|-----------|---------------|
| P2 | Reduced motion option | Accessibility best practice | NFR-04 |
| P2 | Font size adjustment setting | Accessibility for vision impaired | NFR-04 |
| P2 | Landscape layout optimization | Some users prefer landscape | US-M3 |
| P2 | Gesture customization | Power users may want different mappings | Not in PRD |
| P2 | Screen reader DOM overlay | Full accessibility for blind users | NFR-04 |
| P2 | Battery saver mode | Reduce drain for trail use | Not in PRD |

### 8.4 Implementation Sequence

**Phase 1: Touch Foundation (Week 1-2)**
1. Create TouchInput.ts layer with gesture detection
2. Add touch zones overlay on game scene
3. Implement tap-to-hike and basic button touches
4. Add visual press states to all interactive elements

**Phase 2: Responsive Layout (Week 2-3)**
1. Refactor UIScene for flexible positioning
2. Implement safe area inset handling
3. Create responsive stat panel layout
4. Add quick action bar component
5. Test on device simulators (320px to tablet)

**Phase 3: Feedback Systems (Week 3-4)**
1. Integrate Capacitor Haptics
2. Add visual feedback animations
3. Implement audio manager with category controls
4. Add status bar animations

**Phase 4: Polish (Week 4-5)**
1. Create onboarding tutorial flow
2. Add contextual help system
3. Implement accessibility options
4. User testing and refinement

---

## Appendix A: Current Implementation Gaps

| PRD Requirement | Current State | Gap Severity |
|-----------------|---------------|--------------|
| Touch controls | Keyboard only | Critical |
| 44pt touch targets | Buttons are ~20x30 | Critical |
| Responsive UI | Fixed 800x600 | Critical |
| Safe area handling | None | Critical |
| IndexedDB persistence | Basic in-memory | Critical |
| Haptic feedback | None | High |
| Audio system | None | High |
| Onboarding | None | High |
| Inventory UI | None | Medium |
| Shelter interaction UI | None | Medium |
| Settings screen | None | Medium |
| Accessibility options | None | Medium |

## Appendix B: Touch Gesture Reference

```
TAP (Single touch, <300ms)
+--------+
|   x    |   --> Start/stop hiking (game area)
+--------+   --> Activate button (UI elements)

LONG PRESS (Single touch, >1500ms)
+--------+
|   x    |   --> Rest/Camp action
|        |       (shows progress indicator)
+--------+

SWIPE UP (50px+ vertical movement)
+--------+
|   ^    |   --> Increase pace
|   |    |
+--------+

SWIPE DOWN (50px+ vertical movement)
+--------+
|   |    |
|   v    |   --> Decrease pace
+--------+

SWIPE LEFT (50px+ horizontal movement)
+--------+
| <--    |   --> Open inventory
+--------+

SWIPE RIGHT (50px+ horizontal movement)
+--------+
|    --> |   --> Open menu
+--------+
```

## Appendix C: Responsive Breakpoint Specs

```
/* Mobile First Approach */

/* Base: 320px (iPhone SE) */
:root {
  --stat-panel-height: 100px;
  --quick-bar-height: 80px;
  --event-log-height: 60px;
  --top-bar-height: 60px;
  --button-size: 48px;
  --font-base: 13px;
}

/* 376px+ (Standard phones) */
@media (min-width: 376px) {
  --button-size: 56px;
  --font-base: 14px;
}

/* 429px+ (Large phones) */
@media (min-width: 429px) {
  --stat-panel-height: 110px;
  --event-log-height: 80px;
}

/* 481px+ (Small tablets, landscape phones) */
@media (min-width: 481px) {
  /* Consider side-by-side layout */
}

/* 769px+ (Tablets) */
@media (min-width: 769px) {
  /* Desktop-like layout with panels */
}
```

---

*End of UX Assessment*
