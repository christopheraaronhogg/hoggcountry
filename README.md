# Hogg Country

**The Trailhead Logbook** — A digital hiking journal and AT thru-hiking command center.

Built for a February 2026 Appalachian Trail NOBO thru-hike, this site serves as both a personal trail logbook and a comprehensive planning/execution toolkit.

## Current app surfaces

This monorepo now carries four distinct app layers:

- `apps/public` - the Astro public site and current `hoggcountry.com` experience
- `apps/openclaw-web` - the SvelteKit frontend for Dad updates, Dad's guide, and the gated Scout hiker workspace
- `apps/workspace` - the earlier workspace prototype, kept while the new frontend takes over
- `backend/` - the Laravel operational backend and legacy Trail Assistant APIs

## Scout web frontend

The new frontend preserves the Hogg Country visual language while shifting the product around three clearer surfaces:

1. **Dad updates**
   - public Dad overview
   - public map tracking
   - public YouTube dispatch feed
2. **Scout for hikers**
   - public product pitch and onboarding path
   - Dad's field guide as the canonical example manual
3. **Gated app**
   - lightweight beta signup
   - private trail workspace keyed to the beta profile
   - manual, tool locker, and searchable source docs
   - `/app`
   - `/app/setup`
   - `/app/today`
   - `/app/manual`
   - `/app/tools`
   - `/app/docs`
   - `/app/scout`
   - `/app/claw` remains a compatibility route

The new app lives in `apps/openclaw-web/` and is intended for `app.hoggcountry.com`.

## Vision

Hogg Country is more than a blog — it's a trail-ready command center that works offline, provides real-time decision support on-trail, and documents the journey from planning through summit.

**Core Principles:**
- **Trail-first design** — Every feature optimized for mobile, offline, one-handed use
- **Decision support** — Tools that help make better choices, not just display data
- **Single source of truth** — One master guide document drives all chapter content
- **Performance obsession** — Code-split bundles, lazy loading, sub-second interactions

## Trail Assistant

Trail Assistant is the product track that turns Hogg Country from a planning site into a personal trail-ops platform. The target experience is closer to WHOOP than a generic hiking app: a hiker opens one screen each day, sees what their body and trail conditions can support, gets a concrete plan, and can escalate to a real human when trail reality stops matching the plan.

**Product thesis:**
- **Trail readiness over generic wellness** — Translate sleep, soreness, recent load, weather, and segment difficulty into a daily hiking recommendation.
- **Adaptive itinerary instead of static spreadsheets** — Keep a rolling 7-day plan for mileage, camps, hostels, resupply, shuttles, and weather pivots.
- **AI first, concierge second** — Let software handle routine trail decisions and let humans handle messy logistics, safety, and time-sensitive exceptions.
- **Partner network as moat** — Hostels, shuttle drivers, outfitters, and regional experts make the product materially better than an isolated app.

**Recommended stack shape for this product:**
- **Public site and marketing:** Astro 5 + Svelte islands
- **Core backend:** Laravel 12 APIs, auth, moderation, billing, and ops
- **Mobile app for iOS/Android:** dedicated SvelteKit + Capacitor client consuming the Laravel APIs
- **Current mobile proof surface:** Laravel Inertia + Svelte route at `/native` should be treated as a prototype, not the final app architecture

**Current Trail Assistant surfaces:**
- `/trail-assistant` — public intake + profile-state demo
- `/trail-assistant-profile` — browser-stored hiker profile proof path
- `/trail-assistant-byos` — provider and entitlement preview for BYOS model usage
- `/ask` — legacy AT Trail AI chat surface

**Core docs:**
- `docs/business/trail-assistant-prd.md` — product requirements and business model
- `docs/business/trail-assistant-implementation-plan.md` — phased delivery plan
- `docs/business/trail-assistant-mobile-api-contract.md` — current API contract
- `docs/business/trail-assistant-phone-screen-contract.md` — current mobile screen contract

## Features

### Timeline (`/`)
A chronological scrapbook merging trip logs, YouTube videos, and blog posts into a unified "stitched trail" timeline. Each entry type has its own visual identity (alpine green for trips, marker yellow for videos, terracotta for stories).

### App Landing (`/app`)
Mobile-first launch page that routes hikers to iOS App Store / Google Play listings and early-access signup while native builds are in flight.

### Trail Assistant (`/trail-assistant`, `/trail-assistant-profile`, `/trail-assistant-byos`, `/ask`)
An operational support layer for Appalachian Trail hikers that combines intake, chat, profile state, BYOS model-provider previews, and backend safety workflows.

**What it is becoming:**
- Daily trail readiness and mileage guidance
- 7-day adaptive itinerary planning
- Town-day logistics for hostels, shuttles, mail drops, and resupply
- Safety check-ins, map-sharing controls, and SOS escalation
- Human concierge handoff for urgent or ambiguous trail situations

**What already exists in the repo:**
- Public Trail Assistant intake flow with Netlify fallback
- Authenticated support/chat, check-in, progress, map-report, and SOS APIs
- Moderator governance, quarantine, and privacy controls
- BYOS provider registry and entitlement preview scaffolding

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
| **Gear** | Build your kit by budget |
| **Resupply** | Town distances, services, and resupply planning |
| **Water** | Water sources and carry calculations |
| **Budget** | Trail spending tracker |
| **Mail** | Mail drop planning and scheduling |
| **Power** | Device battery and charging management |
| **Food** | Calorie and food weight calculator |
| **Train** | Pre-trail training schedule |
| **Emergency** | Emergency contacts, bailout points, protocols |

**Technical highlights:**
- Global Trail Context bar (Planning vs On-Trail mode)
- Code-split bundles (45KB initial, tools load on-demand)
- All tools work offline once cached
- LocalStorage persistence for all settings

### VideoHogg Intake (`/videohogg`)
Private upload surface for Dad’s production workflow:
- Google-auth gated using existing account session
- Email allowlist gate (`PUBLIC_VIDEOHOGG_ALLOWED_EMAILS` in frontend, `VIDEOHOGG_ALLOWED_EMAILS` in backend)
- Multi-file video upload with per-clip cards, per-clip notes, and drag/drop ordering
- Thumbnail generation with fallback inline preview when browser codecs block frame extraction
- Creates run payloads via `POST /api/v1/videohogg/runs`
- Queue endpoints for worker automation (`queued → processing → done/failed`)

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
| API/Auth | Laravel 12 + Sanctum + Socialite |
| Current Native Prototype | Laravel Inertia + Svelte 5 (`backend` route `/native`) |
| Recommended Mobile App Path | Dedicated SvelteKit + Capacitor client for iOS/Android |

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
├── backend/                  # Laravel API/Auth + Inertia/Svelte native shell
│   ├── routes/api.php
│   ├── routes/web.php        # includes /native app shell route
│   ├── resources/js/Pages/   # Inertia Svelte pages
│   └── app/Http/Controllers/Api/V1/
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
│   │   ├── app.astro         # App Store / Play Store landing page
│   │   ├── guide/
│   │   │   ├── index.astro   # Full guide (single page)
│   │   │   └── [...slug].astro
│   │   ├── tools/index.astro
│   │   └── ...
│   ├── styles/global.css     # Design tokens + utilities
│   └── lib/                  # Utilities (youtube.ts, config.ts)
├── public/
│   ├── sw.js                 # Service worker
│   ├── default-background.svg # Standard topo map background
│   └── fonts/
├── scripts/
│   ├── parse-master-guide.js # Master → chapters
│   ├── generate-search-index.js
│   ├── generate-asset-manifest.js
│   ├── generate-at-mileposts.mjs # Builds /at-mileposts.json from NPS/ATC centerline
│   ├── build-at-hydro-crossings.js # USGS NHD → near-trail stream crossings
│   ├── validate-hydro-crossings.js
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
| `docs/business/trail-assistant-prd.md` | Trail Assistant product requirements doc |
| `docs/business/trail-assistant-implementation-plan.md` | Trail Assistant phased implementation plan |
| `docs/business/trail-assistant-mobile-api-contract.md` | Trail Assistant API contract |
| `docs/business/trail-assistant-phone-screen-contract.md` | Trail Assistant screen-by-screen app contract |

## Roadmap & Task List

### Completed
- [x] **YAML Trail Facts System** - `src/data/trail-facts.yaml` as single source of truth with template injection (2026-01-14)
- [x] **Parser Fact Injection** - `parse-master-guide.js` now injects facts from YAML into prose at build time (2026-01-14)
- [x] **#1 Distance Consistency** - All guide chapters now use 2,197.4 miles (AWOL 2026) via template system (2026-01-14)
- [x] **Multi-Agent Fact Checker** - `/audit-trail-facts` skill validates YAML against official sources (2026-01-14)
- [x] **Full Trail Data in Game** - 2,197.4 miles mapped with 260+ shelters, 25+ towns, 20+ peaks (2025)
- [x] **Field Guide Parser** - Auto-generates chapters from master document (2025)
- [x] **Offline PWA Support** - Full offline capability via service worker (2025)
- [x] **Code-Split Tools** - 14 tools lazy-loaded for performance (2025)

### In Progress
- [ ] **#9 AWOL 2026 Deep Dive** - Full audit comparing our guide to official AWOL 2026 data

### Backlog (Prioritized)
| # | Issue | Category | Status |
|---|-------|----------|--------|
| 2 | Broken links on videos main page | Bug | Pending |
| 3 | Clarify if miles include approach trail | Content | Pending |
| 4 | Resupply planner different on phone vs laptop | Responsive | Pending |
| 5 | Fontana comes before Smokies (ordering) | Content | Pending |
| 6 | Add Franklin to stops before Smokies | Content | Pending |
| 7 | Update hero image on website | Asset | Pending |
| 8 | Slider sensitivity too high | UX | Pending |
| 10 | Guide formatting off on mobile | Responsive | Pending |
| 11 | Personal finance missing gear replacements | Feature | Pending |
| 12 | Review Damascus drop list | Content | Pending |
| 13 | Snowbird/Blood Mountain bottom line fix | Content | Pending |
| 14 | Winter tent site checklist | New Content | Pending |

### Trail Data Architecture

All AT facts flow from a single YAML source with automatic injection:

```
src/data/trail-facts.yaml       ← SINGLE SOURCE OF TRUTH (YAML, cited)
    │
    ├──→ parse-master-guide.js  ← Injects {{...}} templates at build
    │         │
    │         └──→ src/content/guide/*.md (generated with real values)
    │
    ├──→ src/data/trailFacts.ts ← TypeScript wrapper for code
    │
    └──→ /audit-trail-facts     ← Multi-agent validation
```

**Template syntax in master guide:**
```markdown
The trail is {{trail.total_miles|commas}} miles long.
→ The trail is 2,197.4 miles long.

{{factbox:landmarks.blood_mountain}}
→ Generates cited fact card with mile, elevation, source
```

Run `npm run update-guide` to regenerate chapters from YAML.

### Hydro Stream Crossings (Open Data)

`src/data/at-hydro-crossings.json` is generated from the USGS National Hydrography Dataset (NHD) flowlines and snapped to the AT mile system.

- Build/update dataset: `npm run build:hydro`
- Validate dataset: `npm run check:hydro`

---

## License

Personal project. All rights reserved.

---

*Built for the trail. See you on Katahdin.*
