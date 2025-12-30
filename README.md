# Hogg Country

**The Trailhead Logbook** — A digital hiking journal and AT thru-hiking command center.

Built for a February 2026 Appalachian Trail NOBO thru-hike, this site serves as both a personal trail logbook and a comprehensive planning/execution toolkit.

## Vision

Hogg Country is more than a blog — it's a trail-ready command center that works offline, provides real-time decision support on-trail, and documents the journey from planning through summit.

**Core Principles:**
- **Trail-first design** — Every feature optimized for mobile, offline, one-handed use
- **Decision support** — Tools that help make better choices, not just display data
- **Single source of truth** — One master guide document drives all chapter content
- **Performance obsession** — Code-split bundles, lazy loading, sub-second interactions

## Features

### Timeline (`/`)
A chronological scrapbook merging trip logs, YouTube videos, and blog posts into a unified "stitched trail" timeline. Each entry type has its own visual identity (alpine green for trips, marker yellow for videos, terracotta for stories).

### AT Field Guide (`/guide`)
A complete 21-chapter thru-hiking manual covering gear, clothing, water, shelter, weather, food, resupply, town strategy, permits, mail drops, power, medical, safety, trail sections, content creation, and financial planning. Plus 5 quick-reference cards for on-trail decisions.

**Key features:**
- Single-page "book" view with inline chapter navigation
- Full-text search across all chapters
- Offline-capable (works without cell service)
- PDF export for printing
- Auto-synced from `MASTER_NOBO_FIELD_GUIDE.md`

### Trail Tools (`/tools`)
14 interactive planning and decision-support tools:

| Tool | Purpose |
|------|---------|
| **Layers** | What to wear based on temperature, activity, precipitation |
| **Shelter** | Tent vs shelter decision based on conditions and preferences |
| **Weather** | Weather assessment, heat zones, and daylight calculator |
| **Milestones** | Journey timeline and pace planning |
| **Pack** | Gear list builder with weight tracking |
| **Resupply** | Town distances, services, and resupply planning |
| **Water** | Water sources and carry calculations |
| **Budget** | Trail spending tracker |
| **Mail** | Mail drop planning and scheduling |
| **Power** | Device battery and charging management |
| **Food** | Calorie and food weight calculator |
| **Swap** | Gear transition planning (seasonal swaps) |
| **Train** | Pre-trail training schedule |
| **Emergency** | Emergency contacts, bailout points, protocols |

**Technical highlights:**
- Global Trail Context bar (Planning vs On-Trail mode)
- Code-split bundles (45KB initial, tools load on-demand)
- All tools work offline once cached
- LocalStorage persistence for all settings

### Offline Support (PWA)
Full offline capability via service worker:
- All pages cached on first visit
- All tool chunks pre-cached from asset manifest
- Guide chapters available without service
- "Save for Offline" button with visual feedback

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Astro 5 (Static Site Generation) |
| UI Islands | Svelte 5 (runes: `$state`, `$derived`, `$effect`) |
| Styling | Tailwind CSS 4 + CSS custom properties |
| Content | Markdown collections with Zod schemas |
| Build | Vite with code-splitting |
| Types | TypeScript throughout |

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         Build Time                          │
├─────────────────────────────────────────────────────────────┤
│  MASTER_NOBO_FIELD_GUIDE.md                                 │
│         ↓ (parse-master-guide.js)                           │
│  src/content/guide/*.md (21 chapters)                       │
│         ↓                                                   │
│  Content Collections (Zod validated)                        │
│         ↓                                                   │
│  Astro SSG → Static HTML + Svelte Islands                   │
│         ↓                                                   │
│  Vite Code-Splitting → Separate chunks per tool             │
│         ↓                                                   │
│  dist/ (static files + asset-manifest.json)                 │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                        Runtime                              │
├─────────────────────────────────────────────────────────────┤
│  Service Worker                                             │
│    ├── Precaches all assets from manifest                   │
│    ├── Cache-first for static assets                        │
│    └── Network-first for HTML pages                         │
│                                                             │
│  Svelte Islands (hydrate on load)                           │
│    ├── ToolsApp.svelte (global state + dynamic imports)     │
│    ├── Gallery.svelte (lightbox)                            │
│    └── GuideInlineSearch.svelte (full-text search)          │
└─────────────────────────────────────────────────────────────┘
```

## Project Structure

```
hoggcountry/
├── src/
│   ├── components/           # Astro + Svelte components
│   │   ├── ToolsApp.svelte   # Main tools orchestrator
│   │   ├── LayeringAdvisor.svelte
│   │   ├── ShelterDecision.svelte
│   │   ├── ... (12 more tools)
│   │   ├── Timeline.astro
│   │   ├── Gallery.svelte
│   │   └── Header.astro
│   ├── content/
│   │   ├── guide/            # Auto-generated from master
│   │   │   ├── 00-introduction.md
│   │   │   ├── ... (21 chapters)
│   │   │   └── quick/        # Manually maintained
│   │   ├── trips/            # Trip logs
│   │   ├── posts/            # Blog posts
│   │   └── blog/             # MDX blog entries
│   ├── pages/
│   │   ├── index.astro       # Timeline homepage
│   │   ├── guide/
│   │   │   ├── index.astro   # Full guide (single page)
│   │   │   └── [...slug].astro
│   │   ├── tools/index.astro
│   │   └── ...
│   ├── styles/global.css     # Design tokens + utilities
│   └── lib/                  # Utilities (youtube.ts, config.ts)
├── public/
│   ├── sw.js                 # Service worker
│   ├── topo.svg              # Background texture
│   └── fonts/
├── scripts/
│   ├── parse-master-guide.js # Master → chapters
│   ├── generate-search-index.js
│   ├── generate-asset-manifest.js
│   └── generate-pdf.js
├── MASTER_NOBO_FIELD_GUIDE.md  # Source of truth for guide
├── CLAUDE.md                   # AI assistant instructions
└── package.json
```

## Design System

### Color Palette

| Token | Hex | Usage |
|-------|-----|-------|
| `--bg` | `#f5f2e8` | Cloud White (paper background) |
| `--pine` | `#4d594a` | Shadow Pine (headings, brand) |
| `--alpine` | `#a6b589` | Alpine Green (trips, badges) |
| `--marker` | `#f0e000` | Trail Marker Yellow (CTAs, videos) |
| `--terra` | `#d97706` | Terracotta Sun (stories, accents) |
| `--stone` | `#cccccc` | Stone Gray (borders, muted) |
| `--ink` | `#1f2937` | Ink (titles) |
| `--muted` | `#5c665a` | Muted text |

### Typography

| Role | Font | Weight |
|------|------|--------|
| Display (H1/H2) | Oswald | 600-700 |
| Chapter markers | Anton | 400 |
| Body | Lato | 400/600 |
| Handwritten accents | Caveat | 400/600 |

### Components

- **Cards**: White background, stone border, 14px radius, lift on hover
- **Badges**: Pill-shaped, white fill, stone border
- **Timeline**: Dashed "stitch" axis with alternating entries
- **Buttons**: Primary (marker yellow), Secondary (white + border)

## Content Model

### Trips (`src/content/trips/*.md`)
```yaml
title: "Pikes Peak Summit"
date: 2025-06-15
state: "Colorado"
trail_name: "Crags Trail"
distance_miles: 13
elevation_gain_ft: 4300
difficulty: "Strenuous"
cover_image: "/images/pikes-peak.jpg"
gallery: ["/images/pp-1.jpg", "/images/pp-2.jpg"]
youtube: ["dQw4w9WgXcQ"]
tags: ["14er", "colorado", "summit"]
```

### Guide Chapters (`src/content/guide/*.md`)
```yaml
title: "Gear System"
part: 3
order: 3
description: "Complete gear breakdown with weights and alternatives"
icon: "backpack"
quickRef: false
```

### Quick Reference Cards (`src/content/guide/quick/*.md`)
```yaml
title: "Shelter Decision Triggers"
part: 100
order: 1
description: "When to tent vs shelter"
quickRef: true
```

## Tools Architecture

### Code-Splitting Strategy

Tools use Vite's dynamic imports for optimal loading:

```javascript
// Static import for default tool (SSR with CSS)
import LayeringAdvisor from './LayeringAdvisor.svelte';

// Dynamic imports for other tools (code-split)
const toolLoaders = {
  shelter: () => import('./ShelterDecision.svelte'),
  weather: () => import('./WeatherAssessor.svelte'),
  // ...
};
```

**Results:**
- Initial bundle: 45KB (down from 296KB)
- Each tool: 12-40KB loaded on-demand
- CSS bundled with each chunk (no missing styles)

### Trail Context System

Global state shared across all tools:

```javascript
// Planning mode
{ mode: 'planning', startDate, pace, zeroDaysPerMonth }

// Trail mode
{ mode: 'trail', currentMile, tripStartDate, zeroDaysTaken, targetPace }

// Computed
{ daysOnTrail, hikingDays, actualPace, percentComplete, nearestLandmark }
```

## Field Guide Workflow

### Updating the Guide

1. Edit `MASTER_NOBO_FIELD_GUIDE.md`
2. Run `npm run update-guide` (or it runs automatically on build)
3. Chapters are regenerated in `src/content/guide/`

### Parser Behavior

The `parse-master-guide.js` script:
- Auto-detects all `## PART X:` sections
- Extracts titles from headings
- Generates slugified filenames
- Assigns appropriate icons based on keywords
- Preserves `quick/` directory (not overwritten)

## Development

### Commands

```bash
npm install           # Install dependencies
npm run dev           # Dev server at localhost:4321
npm run build         # Production build to ./dist/
npm run preview       # Preview production build
npm run update-guide  # Regenerate guide from master
npm run build:pdf     # Generate PDF of guide
npm run test          # Run guide parser tests
```

### Build Pipeline

```
prebuild:  parse-master-guide.js → generate-search-index.js
build:     astro build (SSG + code-splitting)
postbuild: generate-asset-manifest.js (for service worker)
```

### Validation

Before committing:
- [ ] `npm run build` succeeds
- [ ] `npm run preview` shows all routes
- [ ] Tools page loads and switches correctly
- [ ] Guide search works
- [ ] Mobile layout intact

## Key Decisions

### Why Astro + Svelte?
- **Astro**: Zero JS by default, perfect for content-heavy pages
- **Svelte 5**: Minimal runtime, excellent for interactive islands
- **Islands architecture**: Only hydrate what needs interactivity

### Why Code-Split Tools?
- Initial 296KB bundle was too large
- CSS hiding caused all 14 tools to mount simultaneously
- Conditional `{#if}` broke CSS (not included in SSR)
- Dynamic imports solve both: small initial load + proper CSS

### Why Single Master Guide?
- One authoritative source prevents drift
- Easy to update externally (AI, editors)
- Parser handles chapter extraction automatically
- Quick reference cards remain manually maintained

### Why Offline-First?
- Trail conditions = no cell service
- Guide must work in backcountry
- Tools needed for on-trail decisions
- Service worker + asset manifest = full offline capability

## Deployment

Currently deployed to Netlify. On push to `main`:
1. Netlify triggers build
2. `npm run build` runs full pipeline
3. Static files served from CDN
4. Service worker updates on next visit

**Important**: After deploy, users should hard-refresh (Cmd+Shift+R) to get new service worker.

## Documentation

| File | Purpose |
|------|---------|
| `CLAUDE.md` | AI assistant (Claude) instructions |
| `design.md` | Visual design system details |
| `architecture.md` | High-level architecture |
| `content-model.md` | Content schema examples |
| `cursor.md` | Cursor AI guidelines |
| `TOOL_EVALUATION.md` | Tool consolidation analysis |

## License

Personal project. All rights reserved.

---

*Built for the trail. See you on Katahdin.*
