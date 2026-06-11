# GEMINI.md

This file provides guidance to Gemini when working with code in this repository.

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
