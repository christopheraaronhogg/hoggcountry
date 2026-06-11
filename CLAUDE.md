# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Repo Is

Hogg Country is an Appalachian Trail platform built around Dad's Feb 2026 NOBO thru-hike: part public trail site, part Scout trail assistant, part operational backend. It is a **monorepo with four app layers** — always confirm which layer a task targets before editing:

| Layer | Path | Stack | Role |
|-------|------|-------|------|
| **Scout web (primary)** | `apps/openclaw-web/` | SvelteKit 2 + Svelte 5 | The whole public site + gated `/app/*` hiker workspace. This is the future of the site and the base for the planned mobile app (SvelteKit + Capacitor). |
| Public site (legacy) | root `src/` + `apps/public/` shim | Astro 5 | Being retired. Routes are migrated into Scout web. Shared Svelte components in `src/components/` are still imported cross-tree by Scout web — do not delete them. |
| Workspace prototype | `apps/workspace/` | SvelteKit | Earlier prototype, kept for reference. |
| Backend | `backend/` | Laravel 12 | APIs, auth (Sanctum), Trail Assistant domains, moderation, VideoHogg queue. Deploys to Forge. |

Shared packages live in `packages/` (brand, corpus, manual-core, scout-skills, scout-sources, trail-data). Eval/build tooling lives in `scripts/` (51 scripts).

**Direction (decided 2026-06): SvelteKit rules the whole site.** New public-surface work goes in `apps/openclaw-web`, not the Astro tree. The Astro app stays buildable only until the Netlify→Forge cutover completes (see `docs/runbooks/netlify-to-forge-cutover-checklist.md`).

## Deployment Reality

- `hoggcountry.com` — currently Netlify serving the **Astro** build (`dist/`). Stays live until DNS cutover.
- `hoggcountry.on-forge.com` — Forge box: Laravel serves `/api/*` and proxies everything else to the SvelteKit node app (`pm2` app `hoggcountry-scout`, port 3000). This is the cutover target for hoggcountry.com.
- Forge deploys on push to `main`. Netlify also deploys on push to `main`. **Every push to main hits production twice.**
- Post-deploy proof beats local proof: `npm run verify:forge` and check `https://hoggcountry.on-forge.com/api/v1/health`.

## Development Commands

```bash
npm install                      # root install (workspaces)
npm run dev:scout                # SvelteKit site (primary)
npm run dev                      # legacy Astro site
npm run build                    # builds public + workspace + scout
SCOUT_WEB_ADAPTER=node npm run build -w @hoggcountry/scout-web   # Forge-shape build
npm run check -w @hoggcountry/scout-web                          # svelte-check
npm test                         # node:test suites (guide parser, scout runtime, etc.)
npm run backend:test             # Laravel tests
```

## Scout Reliability Rules

Scout planning changes require evidence, not vibes. See `docs/scout-reliability-runbook.md`.

- Regression scenarios: `data/scout-reliability/scenarios.json`; holdout suite is an overfit detector — never patch one holdout prompt and claim readiness.
- Required validation for Scout slices: `npm run eval:scout-grounding`, `npm run eval:scout-sources`, `npm run eval:scout-reliability -- --difficulty-max 3`, `npm test`, svelte-check, build, `git diff --check`, post-deploy Forge smoke when applicable.
- Run artifacts in `data/scout-reliability/runs/` are committed (leaderboard evidence). `.openclaw-artifacts/` and `tmp/` are local-only (gitignored).
- If current trail/weather/provider data is involved, source live data; stale generated context can be unsafe for hikers.

## Trail Data Integrity System

**CRITICAL:** All AT facts must come from the canonical sources — `src/data/trail-facts.yaml` (guide template injection) and `src/data/trailData.ts` (code).

Key facts (AWOL 2026): total trail **2,197.4 miles** (not 2,197.9); approach trail **8.8 miles** (not in AT total); **14** states; **~260** shelters.

When adding AT facts: add to the canonical source with citation, import the value (never hardcode), then run `/audit-trail-facts` to validate (5-agent cross-check; see `.claude/skills/audit-trail-facts.md`).

## AT Field Guide

The Field Guide is built from `MASTER_NOBO_FIELD_GUIDE.md` (source of truth):

1. Edit/replace `MASTER_NOBO_FIELD_GUIDE.md`
2. `npm run update-guide` parses it into `src/content/guide/*.md` chapters (template `{{...}}` facts injected from trail-facts.yaml)
3. Quick-reference cards in `src/content/guide/quick/` are manually maintained — the parser never overwrites them

Both the Astro guide routes and the SvelteKit guide routes read this same generated content.

## Key Conventions

- TypeScript first; Svelte 5 runes (`$state`, `$derived`, `$effect`, `$props`) — no `export let`
- SvelteKit pages render content only; the shared shell lives in `apps/openclaw-web/src/routes/+layout.svelte`
- Cross-tree imports from root `src/` (components/stores/lib/data) are established precedent in Scout web during the migration
- Design tokens are CSS variables (`--bg`, `--pine`, `--alpine`, `--marker`, `--terra`); fonts Oswald/Anton/Lato/Caveat
- ISO dates (`YYYY-MM-DD`) in content frontmatter; respect Zod schemas
- Don't introduce new build tools or frameworks

## Commit Rule

- Always commit and push to `main` immediately after a successful change.
- Do not wait for permission. We can always revert.
- Remember both Netlify and Forge deploy from `main` — keep both builds green (`npm run build` covers the Astro/Netlify path; the scout-web node build covers Forge).

## Interrupt Handling

When the user mentions a bug, feature request, or task mid-conversation:
- **Default:** note it in the relevant roadmap/task list and continue current work
- **"Drop everything":** switch focus immediately
- Don't context-switch unless explicitly told to prioritize the interruption

## TrailHogg Game

Phaser 3.90 + Vite 7 sim of the full 2,197.4-mile AT (260+ real shelters, 24+ terrain zones, 25+ towns). Source in `trailhogg/`; a built copy is served statically at `/game` (committed under `public/game/` and `apps/openclaw-web/static/game/`). Feature-flagged "archived" in `src/lib/features.ts` — preserved, not part of the active product. Dev: `cd trailhogg/trailhogg && npm run dev:client`.

## Additional Documentation

- `AGENTS.md` — agent working notes (kept current more often than long-form docs)
- `architecture.md` — system tracks, Scout app architecture, target product architecture
- `docs/scout-reliability-runbook.md` — the reliability workflow (read before Scout changes)
- `docs/runbooks/` — Forge runtime, deploy recovery, Netlify→Forge cutover checklist
- `docs/business/` — Trail Assistant PRD, implementation plan, API/screen contracts
- `docs/plans/` — dated design plans (local-first phone AI, document system, etc.)
- `design.md`, `content-model.md` — visual system and content schemas
