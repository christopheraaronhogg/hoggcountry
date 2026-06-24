# AGENTS.md

Working notes for AI agents in this repository.

## Active Status — `mobile/` is the primary product (2026-06-24)

The center of gravity has moved from the web tree to the **`mobile/` app** (Capacitor +
SvelteKit). "The app" means `mobile/`. One static build ships two ways: native **iOS**
(Capacitor → TestFlight) and an installable **PWA** (the same `build/` over HTTPS) — 100%
shared code. **Read `mobile/README.md` first** when touching app work; it has the
architecture map and the hard rules below.

Systems live now (all opt-in / privacy-first):

- **Cloud backup + restore** — offline-first outbox in `mobile/src/lib/cloud/` pushing to
  the Laravel `/api/v1/sync/*` API (document-level last-write-wins). Accounts are
  **invite-only**. Pure LWW/restore logic is unit-tested (`cloud/sync-outbox.test.ts`).
- **Live tramily/family location** (Life360-style) — rides **SpacetimeDB**. Tables are
  server-private; clients read only sender-scoped views (`my_group_positions` /
  `my_group_members`). Module: `apps/openclaw-web/spacetimedb/src/index.ts`; generated
  client bindings + the one shared `DbConnection` live in `mobile/src/lib/spacetime/`.

Deployment topology:

- **SpacetimeDB** is **self-hosted** at `stdb.hoggcountry.com` (v2.6, db `hoggcountry`),
  nginx TLS+WS reverse proxy. Runbook: `docs/runbooks/spacetimedb-self-host.md`. Not on
  Forge infra; not SpacetimeDB maincloud.
- **PWA** target is `app.hoggcountry.com` (serve `mobile/build/` over HTTPS).
- **iOS signed/TestFlight upload is Chris's manual step** — run `cap:sync:ios`, hand off
  the upload. (CocoaPods needs `LANG=en_US.UTF-8 LC_ALL=en_US.UTF-8`.)

Hard rules (each cost a real debugging session — full detail in `mobile/README.md`):

1. **Exactly ONE SpacetimeDB `DbConnection`** for the whole app
   (`mobile/src/lib/spacetime/connection.ts`). Features register via
   `onSpacetimeConnect(...)`; never build a second connection.
2. **Nothing heavy or looping on the boot/hydration path.** A connect burst in `+layout`
   boot froze the iOS WebView. Connect lazily from the tab that uses it.
3. Modal overlays are `position: fixed` (not `absolute`) under `viewport-fit=cover`;
   the `app.html` viewport meta locks zoom.

## Trail data — anchor calibration + licensing policy (2026-06-12)

All displayed AT miles come from the anchor-calibration pipeline
(`src/data/at-mile-anchors.yaml` → `scripts/calibrate-at-mileposts.mjs` →
`public/at-mileposts.json` + the map-pack boundary conversion). Never
hand-enter a trail mile; never add anchors from memory. Before touching any
trail data source — especially anything involving purchased guidebooks
(AWOL, ATC Data Book) or third-party apps (FarOut) — read
`docs/trail-data-provenance.md`. Short version: individual facts we select
and cite are fine; wholesale extraction of anyone's waypoint tables is not.

## Active Status — Netlify → Forge cutover completed (2026-06-12)

`hoggcountry.com` now serves from Forge. Netlify is no longer the production
host for the public domain.

1. Read `docs/runbooks/netlify-to-forge-cutover-checklist.md` — the
   **"Execution status (2026-06-12)"** section lists the DNS records, SSL
   status, and rollback snapshot.
2. Forge auto-deploys this repo's `main` (Laravel API + pm2 `hoggcountry-scout`
   SvelteKit node app behind a Laravel proxy). Deploys cause a ~5s 503 blip
   while pm2 reloads.
3. Netlify no longer deploys from this repo (builds stopped before 2026-06-11);
   the frozen pre-migration Netlify build is now only a rollback target.
4. The SvelteKit app handles security headers and the www→apex redirect itself.
5. After each production push, verify with
   `npm run verify:forge -- --base-url https://hoggcountry.com --sha=$(git rev-parse HEAD)`
   and the smoke list in the checklist.

Everything below this line predates the SvelteKit migration: the Astro routes it
references are legacy (being retired post-cutover). `CLAUDE.md` has the current
monorepo picture.

---

## Reference Table of Contents

Use this as the “front of book” index to jump to the right docs/areas fast.

- **Start here (orientation):** `README.md`, `developing.md`
- **Design & UI:** `design.md`, `src/styles/global.css`
- **Architecture (web + platform):** `architecture.md`, `docs/plans/2026-02-02-hoggcountry-platform-big-picture-diagram.md`
- **Content model & collections:** `content-model.md`, `src/content.config.ts`, `src/content/`
- **AT Field Guide pipeline:** `MASTER_NOBO_FIELD_GUIDE.md`, `scripts/parse-master-guide.js`, `src/content/guide/`
- **AI chat (Trail AI):** `src/pages/ask.astro`, `src/components/TrailChat.svelte`, `netlify/functions/ask.ts`
- **Maps & tracking:** `src/pages/at-map.astro`, `src/components/AtMap.svelte`, `src/pages/track.astro`, `netlify/functions/garmin-track.ts`
- **Build/deploy/config:** `astro.config.mjs`, `netlify.toml`, `src/consts.ts`, `src/lib/config.ts`
- **Validation & QA:** `link-verification.md`, `npm run astro -- check`, `npm run build`
- **Plans & decisions:** `docs/plans/` (dated design notes / decisions)
- **Skills (use these when applicable):**
  - **Before design/features:** `$brainstorming`
  - **When debugging bugs/tests:** `$systematic-debugging`
  - **For SEO work:** `$seo-audit`
  - **For site-wide audits:** `$audit-website`
  - **For browser automation:** `$playwright`

## Project Overview

Hogg Country is a digital hiking logbook built with Astro 5 (SSG). It displays trips, YouTube videos, and blog posts in a unified timeline with a warm, outdoorsy aesthetic.

## Index (Important Docs)

- **Platform “big picture” (Mermaid system architecture):** `docs/plans/2026-02-02-hoggcountry-platform-big-picture-diagram.md`

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

<!-- opensrc:start -->

## Source Code Reference

Source code for dependencies is available in `opensrc/` for deeper understanding of implementation details.

See `opensrc/sources.json` for the list of available packages and their versions.

Use this source code when you need to understand how a package works internally, not just its types/interface.

### Fetching Additional Source Code

To fetch source code for a package or repository you need to understand, run:

```bash
npx opensrc <package>           # npm package (e.g., npx opensrc zod)
npx opensrc pypi:<package>      # Python package (e.g., npx opensrc pypi:requests)
npx opensrc crates:<package>    # Rust crate (e.g., npx opensrc crates:serde)
npx opensrc <owner>/<repo>      # GitHub repo (e.g., npx opensrc vercel/ai)
```

<!-- opensrc:end -->
