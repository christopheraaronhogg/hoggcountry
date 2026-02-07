# Trail Hub Acceptance Criteria (Mobile-First)

Date: 2026-02-07  
Scope: `/trail` experience in `TrailShell.svelte`, `CharacterHub.svelte`, map/tool overlays, and live tracker integration.

## Objective
Make `/trail` feel like one cohesive command center (not separate tools), optimized for one-hand mobile use, with reliable live tracking status and clear mode-driven guidance.

## Product-Level Criteria

1. Cohesive Shell
- `/trail` must read as one integrated interface with a clear hierarchy:
  - `Command Deck` (status + intent),
  - `Character Hub` (identity + readiness),
  - `Contextual Actions` (next best actions),
  - `Overlays` (map/tools).
- No section should feel like an isolated mini-app.

2. Mode-Driven UX (`prep` / `live` / `post`)
- Mode must be obvious within 1 second of opening the page.
- Each mode must show distinct copy and at least 3 mode-specific suggested actions.
- Mode changes (`Start Hike`, `Stop`) must provide immediate visual and textual feedback.

3. Reliable Tracking Confidence
- User must see tracker confidence at a glance:
  - tracker configured state,
  - live/stale/private/error state,
  - last update age,
  - history depth (path point count).
- Path confidence should be derived from backend data (`/trackers/public/history`) and not rely solely on raw Garmin feed shape.

4. Mobile Reachability
- Core controls must be reachable in thumb zone on common mobile widths (`360px`, `390px`, `430px`).
- Primary map action must remain obvious while scrolling.
- All interactive controls target at least `44px` effective tap area.

5. Overlay Clarity
- Map and tool overlays must feel layered and intentional:
  - map = immersive fullscreen context,
  - tool = focused bottom sheet.
- Escape/back should close topmost layer first.

6. Local-First Trust Signals
- User should always know whether they are local-only, syncing, or out-of-date.
- Offline mode should remain fully usable and clearly communicated.

## Functional Acceptance Criteria

1. Command Deck
- A top command section must show:
  - mode badge,
  - session runtime state (`Not started` or elapsed),
  - sync freshness (`synced X ago` style),
  - tracker signal (`live`, `stale`, `private`, `not configured`, `error`).

2. Tracker Signal Panel
- Tracker panel must poll backend public endpoints and display:
  - latest fix age (minutes),
  - path/history point count,
  - clear failure message when unavailable.
- If tracker visibility is private, signal panel must explicitly indicate private mode.

3. Mission Cards
- Must provide 3 contextual mission cards with action buttons per mode.
- Actions must route to existing behavior (open tool, open map, start/stop hike) without adding new routes.

4. Garmin Config Surface
- Existing Garmin ID form must remain functional and integrated in shell style.
- Save must normalize ID/URL and persist via existing backend endpoints.

5. Map CTA
- Map CTA must include meaningful meta (mile and remaining) and visually indicate live tracking confidence when available.

## Visual/Design Acceptance Criteria

1. Distinct Visual Language
- Must avoid generic dashboard appearance.
- Must maintain established Hogg Country token palette while introducing stronger, intentional surfaces for command/status/missions.

2. Motion
- Entry and interaction motion should be purposeful and restrained:
  - command surfaces animate in smoothly,
  - no excessive perpetual animation,
  - reduced-motion users get equivalent static behavior.

3. Information Density
- Dense enough for trail use but not cluttered.
- Text hierarchy must keep key numbers readable on small screens.

## Resilience Criteria

1. No-auth state:
- Shell still works in local mode.
- Tracker save prompts login without breaking layout.

2. API failures:
- Failed tracker signal fetches show non-blocking error state.
- Map and tools remain usable.

3. Battery-aware behavior:
- Existing battery saver signals remain visible and compatible with new UI blocks.

## Verification Checklist

- `npm run build` passes.
- `/trail` loads with no runtime console errors.
- Mode transitions update deck + missions instantly.
- Tracker panel updates after Garmin save.
- Backend signal states visible for configured/not-configured/private/error cases.
- Layout remains coherent across mobile and desktop breakpoints.

## Execution Status

- [x] Acceptance criteria defined before implementation.
- [x] Added `Command Deck` with mode/runtime/sync/tracker confidence.
- [x] Added mode-specific `Mission Cards` with direct actions.
- [x] Added backend-powered tracker confidence polling in `/trail`.
- [x] Kept Garmin config embedded in shell with public/private control.
- [x] Applied cohesive mobile-first visual pass using existing token system.
- [ ] Post-deploy manual smoke check on production `/trail`.
