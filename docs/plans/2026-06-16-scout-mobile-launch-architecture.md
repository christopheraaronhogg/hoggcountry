# Scout Mobile Launch Architecture

Date: 2026-06-16

## Product Target

Hogg Country should ship as two connected experiences:

1. `hoggcountry.com` is the public proof surface: Dad's live Appalachian Trail journey, real stats, current progress, pack/loadout, dispatches, and Scout as the app built from that real hike.
2. `mobile/` is the cross-platform iOS/Android Scout app: a trail-first assistant for planning before the hike and executing on trail when connectivity is weak or absent.

The app should feel like a practical field tool, not a generic chatbot. A hiker opens it to answer:

- What should I do today?
- What is the next water, shelter, road, town, climb, or risk?
- Can I safely push mileage?
- What does the next 20 miles look like?
- What do I need to confirm from current sources before depending on this?
- What is in my pack, what is missing, and what should change before the next section?

## Current Repo Reality

- Production web surface: `apps/openclaw-web` (SvelteKit 2 + Svelte 5).
- Native app candidate: `mobile/` (SvelteKit + Capacitor 7).
- Existing mobile prototype already has tabs for Today, Plan, Coach, Town, Safety, and Account.
- Existing Scout web already has calibrated trail data, Dad journey/progress/elevation, source-aware Scout work, loadout surfaces, offline field pack work, and reliability tests.
- New public/mobile work should not go into the legacy Astro tree unless it is strictly shared data/content still consumed by Scout web.

## Launch Shape

### Public Web

The homepage should become a live demo and sales path:

- First viewport: Dad's actual journey status and Scout's promise in the same frame.
- Show Dad's live/current trail stats: mile, state, percent complete, miles remaining, days on trail, average pace, latest fix when present.
- Show Dad's pack/loadout as a concrete artifact, not abstract marketing.
- Show the kinds of questions Scout handles: weather, water, shelter, resupply, upcoming 20 miles, elevation, difficulty, landmarks, traditions like the half-gallon challenge, and town logistics.
- Point cleanly to the mobile app path: App Store / Google Play when URLs exist, waitlist or early access while listings are not live.

### Mobile App

The app should be a dedicated field dashboard:

- Today: readiness, target miles, current mile, next water/shelter/town/road, weather risk, elevation/difficulty for the next 20 miles, offline pack status.
- Scout: on-device first chat with source receipts and tool-call style status, able to answer with saved trail data when offline.
- Map/Journey: current mile, trail strip, elevation profile, upcoming landmarks and services.
- Plan: rolling 7-day itinerary with confidence labels and what must be verified.
- Pack: gear/loadout, consumables, carried weight, missing items, weather-driven changes.
- Safety: check-ins, support circle, share controls, bailout options, low-signal mode.
- Account/Settings: model tier, downloaded regions, privacy, source packs, app listing/legal basics.

## Offline AI Architecture

The app should hide model/runtime details behind a small service boundary:

```text
Svelte UI
  -> ScoutRuntime
       -> ContextPackStore
       -> ToolRegistry
       -> ModelRouter
            -> OnDeviceGemmaProvider
            -> CloudScoutProvider
            -> DeterministicFallbackProvider
```

### ScoutRuntime

Owns conversation orchestration and response contracts. It should always return:

- answer text
- confidence: `high | medium | low | draft`
- source receipts
- required confirmations
- tool/context used
- offline/online mode
- safety flags when relevant

### ContextPackStore

Owns local data:

- calibrated AT mile frame
- state boundaries and landmarks
- water/shelter/town/access references that are rights-safe to bundle
- Dad field guide and Scout field guide excerpts
- hiker profile, loadout, preferences, current mile, downloaded regions
- cached weather/alerts with generated timestamps

This can start with browser storage/Capacitor Preferences, but should be designed so SQLite can replace it before serious scale.

### ToolRegistry

Tools should be callable by ScoutRuntime and by deterministic UI cards:

- weather lookup/cache
- current location to trail mile
- upcoming 20-mile terrain/elevation summary
- next water/shelter/town/road
- resupply/town snapshot
- pack/loadout check
- safety check-in
- source search

### ModelRouter

Routes between model modes:

- Fast phones: stronger on-device Gemma 4 model where feasible.
- Cheap phones: smaller on-device Gemma 4 model and shorter context.
- Offline or low battery: deterministic fallback plus concise local generation.
- Online and user allows it: cloud Scout can enrich current-source research.

Keep this as configuration, not hardcoded UI behavior. The app should still work if on-device model downloads are unavailable.

### On-Device Runtime Note

Google's current recommended path for on-device LLM work is LiteRT-LM rather than the older MediaPipe LLM path. Official docs describe LiteRT-LM as cross-platform across Android, iOS, Web, and Desktop, with hardware acceleration and APIs for Android, Swift, JavaScript, and Flutter:

- https://ai.google.dev/edge/litert-lm
- https://ai.google.dev/edge/litert-lm/overview
- https://ai.google.dev/gemma/docs/core
- https://ai.google.dev/gemma/docs/releases

For this repo, do not tangle LiteRT-specific code through Svelte components. Add an adapter/facade first, then plug real native bridge code into that boundary.

## Backend Direction

Laravel remains the operational backend for:

- auth and account state
- waitlist / beta access
- source/resource metadata
- cloud Scout/provider connection when online
- safety/support workflows
- public Dad data APIs
- moderation/privacy controls

Mobile should consume API contracts and cached field packs. It should not require a network call to open Today, view downloaded trail context, or produce a basic Scout answer.

## Data And Copyright Rules

- Bundle only data we can legally use: original Hogg Country content, public/open government data, official-source links and selected facts with citations, and our calibrated derived trail frame.
- Do not wholesale extract purchased guidebook or third-party waypoint tables.
- When facts are volatile/current, Scout should cite or ask the user to verify from a current source instead of pretending certainty.
- Source receipts are a launch feature, not polish.

## Implementation Lanes

### Lane 1: Public Proof Surface

Owns `apps/openclaw-web` public routes and shared public components. Build the homepage and Scout page so Dad's live hike proves the app.

### Lane 2: Mobile Field UX

Owns `mobile/src/lib/components`, `mobile/src/routes`, and `mobile/src/app.css`. Make the native app feel launch-quality and App Store screenshot-ready.

### Lane 3: Mobile Runtime Architecture

Owns `mobile/src/lib` non-component services/types. Add ScoutRuntime, ContextPackStore, ModelRouter, ToolRegistry contracts, local fallback implementation, and tests where practical.

### Lane 4: Backend/API Contracts And Data Bridges

Owns server/API/data bridge code and docs. Define the endpoints/contracts the mobile app needs for Dad journey, field packs, weather/cache, loadout, and source receipts without breaking offline behavior.

## Launch Acceptance

- `npm run check -w mobile` passes.
- `npm run build -w mobile` passes.
- `npm run check -w @hoggcountry/scout-web` passes.
- `SCOUT_WEB_ADAPTER=node npm run build -w @hoggcountry/scout-web` passes.
- Public homepage, `/scout`, `/journey`, and mobile root render cleanly on phone-sized screens.
- No exact trail-service claims are introduced without source receipts or a clear verification note.
- The app can answer a basic offline Scout prompt from local context.
- The app is still useful with no user account and no current connectivity.
