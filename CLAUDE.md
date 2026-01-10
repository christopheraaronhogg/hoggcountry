# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Hogg Country is a digital hiking logbook built with Astro 5 (SSG). It displays trips, YouTube videos, and blog posts in a unified timeline with a warm, outdoorsy aesthetic.

## Development Commands

```bash
npm install           # Install dependencies
npm run dev           # Start dev server at localhost:4321
npm run build         # Build to ./dist/
npm run preview       # Preview production build
npm run astro -- check # Validate content collections
```

## Architecture

**Stack:** Astro 5 + Svelte 5 islands + Tailwind CSS 4 + TypeScript

**Content Sources:**
- Trips: `src/content/trips/*.md` (schema in `src/content.config.ts`)
- Posts: `src/content/posts/*.md` (schema in `src/content.config.ts`)
- Blog: `src/content/blog/**/*.{md,mdx}` (schema in `src/content/config.ts`)
- Videos: YouTube RSS feed, fetched at build time with 10-minute cache (`src/lib/youtube.ts`)

**Timeline Data Flow:**
1. `index.astro` fetches trips (content collections) + videos (YouTube RSS)
2. Transforms to common shape with `kind` (trip/video)
3. Merges and sorts by date descending
4. Client-side filter pills filter by `data-kind` attribute

**Key Components:**
- `BaseHead.astro` — Single source of truth for meta tags, fonts, canonical URLs
- `Timeline.astro` / `TimelineItem.astro` — Timeline layout system
- `YouTubeEmbed.astro` — Privacy-friendly click-to-play embeds (youtube-nocookie.com)
- `Gallery.svelte` — Lightbox island for trip photos

## Key Conventions

**Content:**
- Use ISO dates: `YYYY-MM-DD`
- Images go in `src/assets/` or `public/`
- Respect Zod schemas; update schemas if frontmatter changes

**Code:**
- TypeScript first, minimal `any`
- Astro for pages, Svelte only for interactivity (islands)
- Use semantic CSS classes from `src/styles/global.css` (`.card`, `.badge`, `.timeline-*`)
- Design tokens are CSS variables in `global.css`

**What to Avoid:**
- Don't introduce new build tools or frameworks
- Don't remove Tailwind layers or design tokens
- Keep Svelte islands minimal; prefer vanilla JS for simple interactivity

## AT Field Guide

The Field Guide (`/guide/`) is built from a master markdown document. To update:

1. Replace `MASTER_NOBO_FIELD_GUIDE.md` with the new version
2. Run `npm run update-guide` to parse and regenerate chapter files
3. Run `npm run build` to rebuild the site

**Structure:**
- Master doc: `MASTER_NOBO_FIELD_GUIDE.md` (source of truth)
- Parser: `scripts/parse-master-guide.js` (splits into chapters)
- Chapters: `src/content/guide/*.md` (auto-generated from master)
- Quick refs: `src/content/guide/quick/*.md` (manually maintained)

The parser extracts:
- Introduction (before PART I)
- Parts I–XVII (main chapters)
- Conclusion (The Path to Katahdin)

Quick reference cards in `quick/` are NOT overwritten by the parser.

## Configuration

- `astro.config.mjs`: Update `site` for production domain (affects canonical URLs, RSS, sitemaps)
- `src/lib/config.ts`: YouTube channel ID
- `src/consts.ts`: SITE_TITLE, SITE_DESCRIPTION

## Validation Checklist

Before committing:
- `npm run build` succeeds
- `npm run preview` shows expected routes without console errors
- Content schemas validate (`npm run astro -- check`)
- Timeline layout works on mobile and desktop

## Commit Rule

- Always commit and push to `main` immediately after a successful change.
- Do not wait for permission.
- We can always revert changes if needed.

## Interrupt Handling

When the user mentions a bug, feature request, or task mid-conversation:
- **Default:** Add it to the relevant roadmap/task list and continue current work
- **"Drop everything":** Stop current work immediately and focus on the new request
- Don't context-switch unless explicitly told to prioritize the interruption

## Additional Documentation

- `cursor.md` — Detailed AI assistant guidelines and common tasks
- `architecture.md` — High-level architecture and routes
- `design.md` — Visual design system, colors, typography
- `content-model.md` — Content schema examples

---

## TrailHogg Game Roadmap

An AT thru-hiking simulation game. **Live at [hoggcountry.com/game](https://hoggcountry.com/game)**

**Stack:** Phaser 3.90 + Vite 7 + TypeScript. Located in `trailhogg/`.

### Vision
A gritty, immersive AT simulation with Project Zomboid pacing. Slow and deliberate by default (0.5x speed), with player-adjustable speeds (0.25x to 8x). The entire 2,197.9 miles mapped with real shelters, towns, terrain zones, and landmarks.

### Completed
- [x] Project scaffold (client/server/shared monorepo)
- [x] 32-color pixel art palette system
- [x] 358 programmatic sprites across 43 categories
- [x] Sprite catalog page at `/cat` (unlisted)
- [x] Core sprite types: hiker, environment, blazes, structures, weather, UI
- [x] Extended sprites: wildlife, trail features, items, signs, terrain, plants
- [x] Character sprites: NPCs, expressions, clothing
- [x] Location sprites: towns, shelters, summits, bridges, trailheads, campsites
- [x] Famous landmarks: McAfee Knob, Dragon's Tooth, Katahdin sign
- [x] AMC huts, lighting effects, celebrations, ruins, vistas
- [x] Optimized /cat catalog (CSS variable scaling, 1 update vs 358)
- [x] Phase 0: Rename to TrailHogg, upgrade deps (Phaser 3.90, Vite 7)
- [x] Phase 0: Add Vitest test infrastructure (10 tests passing)
- [x] Phase 0: Deploy to /game path on Netlify (offline single-player mode)
- [x] Vertical scroller gameplay with SPACE to hike
- [x] Mobile joystick controls
- [x] Project Zomboid-style game speed system (0.25x-8x, default 0.5x)
- [x] IndexedDB save/load persistence
- [x] Day/night cycle with headlamp
- [x] Weather system (rain, fog)
- [x] Shelter and town scenes with stores/hostels
- [x] Inventory management and food system
- [x] Moodles system (fatigue, hunger, morale, anxiety)
- [x] Wildlife encounters (deer, bear, snake, turkey, squirrel)
- [x] Trail magic random events
- [x] In-game Field Guide (G key)
- [x] **FULL TRAIL DATA**: 2,197.9 miles with:
  - 260+ real shelters (mile, elevation, water, privy, capacity)
  - 24+ terrain zones with unique visuals (PA rocks, Whites, Smokies, etc.)
  - 25+ real towns with services (hostels, stores, restaurants, outfitters)
  - 20+ major peaks and landmarks
  - 14 state boundaries with celebration messages
- [x] **Terrain-adaptive visuals**: Tree/ground/sky colors change by zone

### In Progress
- [ ] P2P multiplayer (see architecture below)

### Next Up
- [ ] Real pixel art assets (replace procedural)
- [ ] Audio system (ambient + SFX)
- [ ] NPC hiker encounters with dialogue
- [ ] PWA + app store deployment

### P2P Multiplayer Architecture (Project Zomboid Style)

**Goal:** Drop-in co-op where friends can join your hike. No central servers, no monthly costs.

**Stack Options:**

1. **WebRTC + PeerJS** (Recommended for v1)
   - Pure P2P, works in browsers
   - Host runs simulation, guests sync state
   - Free signaling via PeerJS public server (or self-host)
   - Pros: Zero server cost, works offline after connection
   - Cons: NAT traversal can be tricky, one player must host

2. **libp2p / Hyperswarm** (For advanced P2P)
   - DHT-based peer discovery
   - Works without any central server at all
   - Better for truly decentralized games
   - Cons: More complex, less browser support

3. **Steam Relay / Epic Online Services** (For desktop)
   - Handles NAT traversal automatically
   - Free for games on their platforms
   - Cons: Requires platform integration

**Implementation Plan:**
```
1. Host starts game → generates room code (PeerJS ID)
2. Guests enter code → WebRTC connection established
3. Host runs authoritative simulation, sends state updates
4. Guests send inputs (hike, rest, eat), host validates
5. All players see each other on trail in real-time
```

**Data Sync:**
- Host broadcasts: position, energy, weather, time of day
- Guests send: input intentions (not direct state changes)
- Conflict resolution: Host wins (authoritative)

**Offline Fallback:**
- Game works 100% offline (current state)
- P2P is optional enhancement for co-op
- Save data stays local (IndexedDB)

### Research Backlog
- [ ] **SpacetimeDB evaluation** — All-in-one DB+server with SQL subscriptions, 60 FPS transaction rate, time-travel debugging. Pros: Perfect for real-time multiplayer, cheap ($5/hr for thousands of players), simpler than traditional servers. Cons: Rust/C# only (no TypeScript SDK yet), would require server rewrite. Revisit when TS support lands.

### Dev Commands
```bash
cd trailhogg/trailhogg
npm install              # Install all workspace deps
npm run dev:client       # Start Phaser client at localhost:3000
npm run build            # Production build
npm test                 # Run Vitest tests
```

**After completing TrailHogg work:** Update this roadmap by moving items between sections.
