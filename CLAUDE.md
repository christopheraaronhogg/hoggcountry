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

## Additional Documentation

- `cursor.md` — Detailed AI assistant guidelines and common tasks
- `architecture.md` — High-level architecture and routes
- `design.md` — Visual design system, colors, typography
- `content-model.md` — Content schema examples

---

## Trail Legs Game Roadmap

An AT thru-hiking simulation game built with Phaser 3.70 + Colyseus. Located in `trailhogg/`.

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

### In Progress
- [ ] Phaser client rendering pipeline (SpriteGenerator → Phaser textures)
- [ ] Boot scene with asset loading

### Next Up
- [ ] Basic hiker movement and animation
- [ ] Trail segment rendering with parallax backgrounds
- [ ] Day/night cycle with lighting sprites
- [ ] Weather system visualization
- [ ] Blaze/trail marker interaction
- [ ] Shelter arrival scenes
- [ ] Town resupply UI
- [ ] Colyseus server integration for multiplayer state
- [ ] Save/load game state

### Future
- [ ] Full 2,190-mile trail data integration
- [ ] NPC hiker encounters with dialogue
- [ ] Gear/inventory management
- [ ] Food/water/energy systems
- [ ] Achievement badges
- [ ] Trail magic events
- [ ] Weather hazards and decision points

### Dev Commands (Trail Legs)
```bash
cd trailhogg/trailhogg
npm install              # Install all workspace deps
npm run dev:client       # Start Phaser client (Vite)
npm run dev:server       # Start Colyseus server
npm run dev              # Start both
npm run build            # Production build
```

**After completing Trail Legs work:** Update this roadmap by moving items between sections.
