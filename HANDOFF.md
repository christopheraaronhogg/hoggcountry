# Hogg Country — Agent Handoff

**Date of handoff:** 2026-04-07
**Status of product:** Brief locked, infrastructure in place, **primary product not yet built**.
**What you are taking over:** building Hogg Country's new primary product — the **personal Field Manual builder**.

Read `PRODUCT_BRIEF.md` before you touch anything. It is the locked source of truth for v1 scope and it wins every disagreement until it is explicitly reopened.

---

## TL;DR

Hogg Country is pivoting from a personal AT hiking blog + multi-tool dashboard into **the free, offline-first AT operating manual for first-time NOBO thru-hikers**. Positioning: *"FarOut tells you what exists. Hogg Country tells you what to do."*

The product is a **judgment layer** on top of audited trail facts, and an **authorship layer** where every hiker builds their own **Field Manual**. One noun, two owners:

- **Hogg Country's Field Manual** — the canonical searchable library (trail wisdom + KJV scripture)
- **Your Field Manual** — the personal authored copy every hiker builds by pinning entries, notes, Today cards, Plan outputs

**Your primary job:** build the authorship layer and the data spine it sits on, then dogfood it end-to-end before anything else changes on the public-facing site.

---

## What Is Already Done

### The brief (`PRODUCT_BRIEF.md`)
- Positioning, persona, three surfaces (Today / Plan / Field Manual), kill criterion, success criteria, non-goals, locked decisions, seed content priorities, post-v1 roadmap, four architectural spines, governance.
- **Field Manuals section** (the authorship layer) is fully specified: authored, personal, offline-first, portable, shareable. Storage is IndexedDB. Format is a single self-contained HTML file with an embedded JSON blob for re-import. Sharing is free peer-to-peer trading — explicitly **not a marketplace, not an account-based social platform**.
- Fourth architectural spine: **Personal Field Manual data layer.** This is your first deliverable.
- Do not reopen locked decisions without explicit user instruction.

### Feature flags (`src/lib/features.ts`)
- Rewritten from a flat boolean map to a typed flag map with per-flag `status` (`live` | `experimental` | `merged` | `deferred` | `archived`) and a human-readable `reason`.
- Exports: `isEnabled(key)`, `getFlag(key)`, `allFlags()`, `flagsByStatus(status)`.
- ~20 flags covering public surfaces (SURFACE_TODAY, SURFACE_PLAN, SURFACE_MANUAL, SURFACE_LAB), Field Manual capabilities (FIELD_GUIDE_SEARCH, SCRIPTURE_SEARCH), legacy routes, and post-v1 work.
- Use `isEnabled('KEY')` when gating features. Do not import `FEATURES` directly from new code.

### `/lab` (`src/pages/lab.astro`)
- Dev-facing flag index. Groups flags by status with colored badges and reasons. 216 lines, unlinked from public nav. Useful for understanding what's on/off at a glance.

### PWA shell (`public/sw.js`, `public/manifest.json`)
- Service worker `CACHE_NAME = 'hogg-country-v17'`.
- Network-first for HTML, cache-first for static assets, background revalidation.
- `CORE_PAGES = ['/', '/about/', '/guide/', '/lab/']` — scoped to the v1 IA. Add `/today/` and `/plan/` here when those surfaces ship.
- Precaches all 19 guide chapters + 5 quick-reference cards + `guide-search-index.json` + `guide-context.txt` + `kjv-context.txt` + `proverbs.json`.
- Manifest name/description/shortcuts rewritten for the v1 product.

### Trail data integrity
- `src/data/trail-facts.yaml` is the canonical substrate. Every recommendation surfaces cite it.
- Use `/audit-trail-facts` skill to validate.
- Total trail length is **2,197.4 miles** (AWOL 2026), not 2,197.9. Approach trail is 8.8 miles and **not** part of the AT total.

### Build pipeline
- `prebuild` no longer builds the TrailHogg game. The `build:game` script still exists for manual rebuilds but is excluded from the main build.

### Recent commits (most-recent first)
```
8f5d2103 docs: add Field Manuals — the authorship layer
2ff4268b docs: clarify audience non-goal — not a personal trail blog
49ff8adb feat(pwa): align service worker and manifest with v1 IA
1d69ab50 feat(lab): add /lab index and exclude TrailHogg from main build
fc99b6b5 feat(features): expand flag map with surfaces, routes, and status metadata
f30b9b78 docs: fold KJV scripture into Field Manual as second search corpus
66993f25 chore: restore pre-pivot WIP, resolve rebase conflicts
092c2bb2 docs: lock v1 product brief — judgment layer for AT thru-hikers
```

---

## What Is NOT Done (Your Work)

### 1. Personal Field Manual data layer — the spine (FIRST)

This must exist before any pin-to-manual UI lands. It is the fourth architectural spine and the foundation for everything else.

**Requirements:**
- IndexedDB, local-first, no account, no server sync.
- Single `manual` store with a typed schema — one source of truth for what an "entry" is. An entry can be: a library entry (trail wisdom or scripture), a Today recommendation, a Plan output, or a free-form note authored by the hiker.
- Typed end-to-end. Define the entry interface in TypeScript and use it everywhere.
- Expose a small, stable API:
  - `pinToManual(entry): Promise<void>`
  - `removeFromManual(entryId): Promise<void>`
  - `listManual(): Promise<Entry[]>` — returns entries in the hiker's chosen order
  - `reorderManual(entryIds: string[]): Promise<void>`
  - `updateNote(entryId, note): Promise<void>`
  - `exportToHTML(): Promise<Blob>` — returns a single self-contained HTML file
  - `importFromHTML(file): Promise<void>` — v1.1 target, but scaffold the function signature in v1 so import can land without a schema change
- No external dependencies if you can avoid them. The whole thing should be a thin wrapper around the native IndexedDB API. If you must bring in a helper library, pick something small and audited (e.g., `idb`) and justify it in the commit message.
- Hydrate on app boot so any surface can read the Field Manual synchronously after initial load.

**Where it lives:** `src/lib/field-manual/` is the suggested directory. Keep it framework-agnostic so Astro pages, Svelte islands, and vanilla scripts can all import it.

### 2. Authorship UI on the existing `/guide/`

The `/guide/` route already exists and serves as Hogg Country's Field Manual today (the library). You are layering authorship on top of it, not replacing it.

**Add:**
- **"Save to my Field Manual"** button on every guide entry and every search result. This is a first-class action, not a hover-reveal. It must be obvious.
- **"My Field Manual"** view — a second mode on the `/guide/` surface showing everything the hiker has pinned. Reorderable, note-able, removable. Treat it like a book the hiker is writing.
- **Export button** in the "My Field Manual" view → downloads a single self-contained HTML file. No account required, no server round-trip.

**Tab model:** the `/guide/` surface now has two modes — *Hogg Country's Field Manual* (the searchable library, default) and *Mine* (the hiker's pinned collection). See the brief's "Three Surfaces" section for the exact framing.

### 3. Dogfood it

Before anything else lands, the human user should be able to:
1. Open `/guide/`, search for 10–20 entries across trail + scripture
2. Pin each one with a single tap
3. Switch to "My Field Manual" view and see them all
4. Reorder, add notes, remove one
5. Click Export and download a single HTML file
6. Open that HTML file in a fresh browser (or incognito) and have it read like a book — styled, readable, offline, no dependencies
7. (v1.1) Drag that HTML file back into the site and see the Field Manual rehydrate

If any of those steps feel wrong, stop and fix before moving on. **This is the product. Everything else is scaffolding.**

### 4. Export format — single self-contained HTML

Locked in the brief. Requirements:
- One `.html` file, no external requests on open.
- Embedded CSS (styled like a book — serif body, generous line-height, printable).
- Embedded base64 images if any.
- A hidden `<script type="application/json" id="field-manual-data">` block containing the full JSON payload, for re-import.
- Opens in any modern browser and renders correctly.
- Survives `hoggcountry.com` going down in 2035.

### 5. Seed content — atomize the master guide

Parallel track. The authorship layer is useless if there's nothing worth pinning.

- `MASTER_NOBO_FIELD_GUIDE.md` at repo root is the source doc.
- `scripts/parse-master-guide.js` currently splits it into chapter files at `src/content/guide/`.
- You need to atomize it further — each chapter into pinnable micro-entries (target: 3-line tactical answers). Start with the ATC 2025 hiker-survey priorities: **water planning, stream/flood crossing, navigation in poorly-marked areas, food protection.**
- Build a curated scripture topical index so searches like "fear," "endurance," "discouragement," "gratitude" return meaningful verses, not keyword-literal matches. Reference corpora: `public/kjv-context.txt` (already exists) and `public/proverbs.json` (already exists).

### 6. DO NOT TOUCH YET

The user has explicitly reordered execution. **Do not change the public-facing front door until the Field Manual builder is real and dogfooded.** That means:

- `src/pages/index.astro` — leave it. It currently renders `ProtoF_Ranger`. Do not swap it to a new landing page until the product is real.
- `src/components/Header.astro` — leave the nav alone. No premature Today/Plan/Field Manual links.
- `/today`, `/plan` — no placeholder pages. Not until they're real surfaces.

The billboard stays the same until the product behind it exists. This ordering is a user decision, not a suggestion.

---

## Tooling Reference

### opensrc (optional, dev-time)

Vercel Labs ships a CLI called **opensrc**: https://github.com/vercel-labs/opensrc

It fetches the source code of npm/PyPI/crates/GitHub packages into `opensrc/<package>/` so AI coding agents can read implementation details instead of just type signatures. Use it when you want to understand how a dep actually works before adopting it.

**Usage:**
- `npx opensrc <npm-package>` — fetch an npm package
- `npx opensrc <owner>/<repo>` — fetch a GitHub repo
- Output lands in `opensrc/` at the repo root (add to `.gitignore` if you don't want it committed)

**When you might use it:**
- If you bring in `idb` for IndexedDB, fetch its source first and skim it so you understand the transaction semantics you're relying on.
- If you want to reference any local-first authoring/export pattern from another project, fetch it here and read it.

It is **not** a framework, not a starter kit. It is `git clone` with a directory convention. Don't expect a scaffold.

### audit-trail-facts skill

Validates AT facts across the codebase using 5 cross-checking agents. Run with `/audit-trail-facts`. See `.claude/skills/audit-trail-facts.md`.

### Dev commands

```bash
npm run dev            # Astro dev server at localhost:4321
npm run build          # Production build to ./dist/
npm run preview        # Preview production build
npm run astro -- check # Validate content collections
```

---

## Conventions & Constraints

- **Stack is locked:** Astro 5 SSG + Svelte 5 islands + Tailwind CSS 4 + TypeScript. No new frameworks. No new build tools.
- **TypeScript first.** Minimal `any`. Type the Field Manual entry interface end-to-end and use it everywhere.
- **Astro for pages, Svelte only for interactivity.** Keep Svelte islands minimal.
- **Design tokens are CSS variables in `src/styles/global.css`.** Use them. Don't hardcode colors.
- **Use semantic CSS classes** (`.card`, `.badge`, `.timeline-*`) where they exist.
- **Content dates are ISO:** `YYYY-MM-DD`.
- **Commit rule** (from `CLAUDE.md`): commit and push to `main` immediately after successful changes. Don't wait for permission. Small focused commits, not batches.
- **Every recommendation cites its source.** Trail facts must trace to `src/data/trail-facts.yaml`. No invented numbers.
- **PWA cache version:** if you add new precached assets or new core pages, bump `CACHE_NAME` in `public/sw.js` (currently `hogg-country-v17` → bump to `v18`) and add the new paths to `CORE_PAGES` or `STATIC_ASSETS`.
- **Offline-first is non-negotiable.** Everything you ship must work in airplane mode after first load. Test in DevTools offline mode before committing.

---

## Files You Will Touch

**New files (expected):**
- `src/lib/field-manual/db.ts` — IndexedDB wrapper, `pinToManual` etc.
- `src/lib/field-manual/types.ts` — Entry interface + related types
- `src/lib/field-manual/export.ts` — HTML export generator
- `src/lib/field-manual/import.ts` — HTML re-import (scaffold in v1, finish in v1.1)
- `src/components/field-manual/SaveButton.svelte` — "Save to my Field Manual" action
- `src/components/field-manual/MyManualView.svelte` — the "Mine" tab contents
- `src/pages/guide/mine.astro` — or integrate as a tab on the existing `/guide/` index, your call

**Existing files you will modify:**
- `src/pages/guide/index.astro` or similar — add the tab model (Hogg Country's / Mine)
- `src/content/guide/*.md` — atomize into pinnable micro-entries (parallel to the data layer work)
- `public/sw.js` — bump cache version, add new JS chunks if precache is needed
- `src/lib/features.ts` — flip `SURFACE_MANUAL` or related flags as work ships

**Existing files you will leave alone:**
- `src/pages/index.astro`
- `src/components/Header.astro`
- `PRODUCT_BRIEF.md` (unless you have a locked-decision conflict — in which case surface it to the user, don't edit)

---

## The One-Sentence Test

Before you ship any piece of work, ask: *does this help a hiker (a) decide what to do now, (b) plan what to do next, or (c) find the right guidance fast?* If not, it doesn't belong in v1. See the **Kill Criterion** section of the brief.

---

## First Moves When You Start

1. Read `PRODUCT_BRIEF.md` end to end.
2. Read `src/lib/features.ts` to understand the flag system.
3. Read `public/sw.js` to understand the PWA cache contract you're working inside.
4. Explore `src/content/guide/` and `public/kjv-context.txt` / `public/proverbs.json` to see what content already exists.
5. Sketch the Field Manual entry TypeScript interface. Get the shape right before you write any IndexedDB code — the entry type is the thing every surface will read and write.
6. Build `src/lib/field-manual/db.ts` as a thin native-IndexedDB wrapper. Write tests if you can.
7. Ship `pinToManual` + `listManual` behind a flag, wire one "Save" button on one guide entry, verify round-trip.
8. Then build the "My Field Manual" view.
9. Then export-to-HTML.
10. Then dogfood with the user before moving on.

Good luck. The product is small but the discipline is strict. When in doubt, re-read the brief and apply the kill criterion.
