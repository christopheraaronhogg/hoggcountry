# Trail Legs Build-Out - Feature Requirements

**Date:** 2026-01-07
**Status:** Ready for planning

---

## What Are We Building?

Taking the existing Trail Legs MVP prototype and building it into a polished, playable game ready for:
- Web browser play
- Mobile web (responsive)
- Native iOS app (App Store)
- Native Android app (Google Play)

## Who Is It For?

**Primary Users:** Hikers interested in the Appalachian Trail experience
- May have limited or no connectivity (on trail)
- Mobile-first usage patterns (15-30 minute sessions)
- Mix of casual gamers and hiking enthusiasts
- Range from "dreaming about the AT" to actual thru-hike planners

**Secondary Users:**
- Gaming enthusiasts who enjoy simulation depth (Project Zomboid fans)
- Outdoor enthusiasts curious about thru-hiking

## What Problem Does It Solve?

1. **Entertainment:** Engaging simulation game with authentic AT experience
2. **Education:** Teaches real AT navigation, pacing, and preparation concepts
3. **Aspiration:** Lets people experience a thru-hike attempt virtually
4. **Community:** Multiplayer "bubble" experience mirrors real trail community

## Current State (What Exists)

### Implemented ✅
- Phaser 3 client with 4 scenes (Boot, Menu, Game, UI)
- Colyseus multiplayer server with room system
- Shared TypeScript types and trail data
- Navigation/blaze following system
- Lost state tracking with search/backtrack
- Pace control (4 speeds)
- Status effects (moodles): hunger, thirst, fatigue, anxiety, etc.
- Skill progression (10 skills)
- Weather system (6 types)
- Day/night cycle
- Resource consumption (calories, hydration, energy)
- Trail data for first 30 miles (6 shelters, 12 water sources)
- Basic offline fallback mode
- Procedural blaze generation

### Missing/Needs Work 🔧
- Real graphics/sprites (using placeholders)
- Touch controls for mobile
- Inventory UI screen
- Shelter/town interaction UI
- Injury/illness system
- Capacitor setup for native apps
- Offline-first storage (IndexedDB persistence)
- PWA support
- Audio system
- Character creation polish

## Constraints & Preferences

### Technical Constraints
- Must work offline (hikers have no signal)
- Mobile performance critical (older phones)
- Must share codebase across all platforms
- Self-hostable multiplayer servers

### Design Preferences
- Pixel art style (confirmed by user)
- Warm, hopeful tone (not grimdark)
- 15-30 minute session length
- ~25% completion rate target (authentic difficulty)

### Stack (Confirmed via Audit)
- Phaser 3.90.0 (upgrade from 3.70.0)
- Colyseus 0.16.5 (upgrade from 0.15.0)
- Vite 7.x (upgrade from 5.0.0)
- Capacitor (new - for native apps)
- TypeScript 5.x
- localforage (new - for IndexedDB)

## What Does Success Look Like?

### MVP Success (This Build-Out)
1. Game is playable on web, mobile web, and native apps
2. Works fully offline with persistent save state
3. Has real pixel art graphics (not placeholders)
4. Touch controls work naturally on mobile
5. Core loop is engaging enough to replay multiple times
6. Can build and deploy to app stores

### Metrics
- Players complete MVP section (30 miles) in 2-4 sessions
- 60%+ retry after first failure
- Works smoothly on 3-year-old phones
- < 50MB app size for mobile

## Key Build-Out Areas

1. **Dependency Updates** - Phaser, Vite, Colyseus to latest
2. **Capacitor Setup** - iOS/Android native builds
3. **Offline Storage** - IndexedDB via localforage, auto-save
4. **Pixel Art Assets** - Hiker, trees, trail, blazes, UI elements
5. **Touch Controls** - Mobile-friendly input layer
6. **Game Polish** - Inventory UI, shelter interactions, audio

## Reference Documents

- `trailhogg/trailhogg-prd.md` - Full product requirements
- `trailhogg/STACK-AUDIT.md` - Technology stack analysis
- `trailhogg/trailhogg/README.md` - Current implementation docs
- `trailhogg/trailhogg/shared/src/types.ts` - Game type definitions
- `trailhogg/trailhogg/shared/src/trailData.ts` - AT data model

---

*Ready for Phase 2: PRD Draft*
