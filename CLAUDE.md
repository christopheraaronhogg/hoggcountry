# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Repo Is

Hogg Country is an Appalachian Trail platform built around Dad's Feb 2026 NOBO thru-hike: part public trail site, part Scout trail assistant, part operational backend. **The primary product is now the `mobile/` app** ("the app" = `mobile/`). It is a monorepo — always confirm which layer a task targets before editing:

| Layer | Path | Stack | Role |
|-------|------|-------|------|
| **Mobile app (PRIMARY)** | `mobile/` | SvelteKit 2 + Svelte 5, Capacitor | Dad's app. ONE SvelteKit build, two delivery shells: **iOS** (Capacitor → TestFlight) and an installable **PWA** (same build, served on the web). On-device Scout (Gemma), cloud backup, live tramily location. See `mobile/README.md`. |
| Scout web | `apps/openclaw-web/` | SvelteKit 2 + Svelte 5 | The public website + gated `/app/*` workspace. **Also home to the SpacetimeDB module** (`spacetimedb/`) and the generated client bindings (`src/lib/module_bindings/`, imported cross-tree by `mobile/`). |
| Public site (legacy) | root `src/` + `apps/public/` shim | Astro 5 | Being retired. Shared Svelte components in `src/components/` are still imported cross-tree — do not delete them. |
| Workspace prototype | `apps/workspace/` | SvelteKit | Earlier prototype, kept for reference. |
| Backend | `backend/` | Laravel 12 | APIs, auth (Sanctum), Trail Assistant domains, **the cloud-backup `/api/v1/sync/*` API**, moderation, VideoHogg queue. Deploys to Forge. |

Shared packages live in `packages/` (brand, corpus, manual-core, scout-skills, scout-sources, trail-data). Eval/build tooling lives in `scripts/` (51 scripts).

**Direction (decided 2026-06): SvelteKit rules the whole site.** New public-surface work goes in `apps/openclaw-web`, not the Astro tree. The Astro app stays buildable as rollback/archive material after the Netlify→Forge cutover (see `docs/runbooks/netlify-to-forge-cutover-checklist.md`).

## Mobile app (`mobile/`) — the primary product

One SvelteKit static build, delivered two ways: **iOS** via Capacitor (`cap:sync` → Xcode → TestFlight; signed upload is Chris's step), and an installable **PWA** (the same `build/` served over HTTPS — manifest + `src/service-worker.ts` make it installable + offline). 100% shared code; build once, ship both. Full architecture + commands: `mobile/README.md`.

Major systems on top of the Scout field-pack core:

- **Cloud backup + restore** (opt-in): a coalescing on-device outbox (`src/lib/cloud/`) decomposes durable state into per-entity docs and pushes to the Laravel **`/api/v1/sync/*`** API (document-level last-write-wins); restore pulls `/sync/bootstrap` on sign-in. Accounts are **invite-only** (`SCOUT_LAUNCH_INVITE_*`; public registration gated off). Pure LWW/restore logic is unit-tested in `src/lib/cloud/sync-outbox.ts`.
- **Live tramily/family location** (Life360-style, privacy-first): rides SpacetimeDB. The `group_member`/`group_position` tables are **server-private**; clients read only sender-scoped views. People layer in `src/lib/people/`.

**Hard rules for this app (learned the hard way — see memory + `mobile/README.md`):**
- **Exactly ONE SpacetimeDB `DbConnection` for the whole app** (`src/lib/spacetime/connection.ts`). Never build a second one — three separate connections was a boot "connection storm."
- **No heavy/looping network or SDK work on the boot/hydration path.** A SpacetimeDB connect burst at boot froze the iOS WebView during hydration (white "Day 1" screen, no taps). Connect lazily from the tab that uses it (e.g. the Map), never from `+layout` boot.
- Modal overlays use `position: fixed` (not `absolute`) under `viewport-fit=cover`; the viewport meta locks zoom (`maximum-scale=1, user-scalable=no`) in `app.html`.
- Native plugins (Capacitor Preferences, StatusBar, Gemma) degrade gracefully on web so the PWA works.

## Deployment Reality

- `hoggcountry.com` — production, served from Forge.
- `www.hoggcountry.com` — redirects to the apex domain.
- `hoggcountry.on-forge.com` — Forge validation domain. Laravel serves `/api/*` and proxies everything else to the SvelteKit node app (`pm2` app `hoggcountry-scout`, port 3000).
- Forge deploys on push to `main`. Netlify is no longer the production deploy path for this repo.
- Post-deploy proof beats local proof: `npm run verify:forge -- --base-url https://hoggcountry.com --sha=$(git rev-parse HEAD)` and check `https://hoggcountry.com/api/v1/health`.
- **SpacetimeDB** — **self-hosted** (not Maincloud) at `stdb.hoggcountry.com` (Forge box, nginx TLS+WS proxy → local SpacetimeDB; runbook: `docs/runbooks/spacetimedb-self-host.md`). Runs the public module in `apps/openclaw-web/spacetimedb` (db `hoggcountry`): Trail Pulse, water reports, and live location. The mobile build connects via `PUBLIC_SPACETIMEDB_HOST` / `PUBLIC_SPACETIMEDB_DB_NAME` (set in `mobile/.env.production`; only resolve because `mobile/vite.config.ts` has `envPrefix: ['VITE_','PUBLIC_']`).
- **PWA hosting** — the `mobile/build/` static PWA is served at `app.hoggcountry.com` (HTTPS required for installability). This is what Dad installs without TestFlight.
- **Mobile delivery is Chris's step**: iOS signed TestFlight upload needs his Apple account; `cap:sync` is fine to run, the upload is handed off.

## Development Commands

```bash
npm install                      # root install (workspaces)

# Mobile app (the primary product) — run these from repo root with --prefix mobile
npm --prefix mobile run dev      # mobile app dev server (the PWA/Capacitor web build)
npm --prefix mobile run check    # svelte-check (0 errors expected)
npm --prefix mobile run build    # static build → mobile/build/ (the PWA + Capacitor source)
npm --prefix mobile test         # node:test suites (incl. cloud sync-outbox LWW/restore)
LANG=en_US.UTF-8 LC_ALL=en_US.UTF-8 npm --prefix mobile run cap:sync:ios   # build + sync into iOS project (LANG fixes a CocoaPods encoding crash)
# spacetimedb module: edit apps/openclaw-web/spacetimedb/src/index.ts, then:
npm run spacetime:generate -w @hoggcountry/scout-web   # regenerate client bindings

# Web / backend
npm run dev:scout                # public SvelteKit site
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

Key facts (AWOL 2026): total trail **2,197.9 miles** (not 2,197.9); approach trail **8.8 miles** (not in AT total); **14** states; **~260** shelters.

When adding AT facts: add to the canonical source with citation, import the value (never hardcode), then run `/audit-trail-facts` to validate (5-agent cross-check; see `.claude/skills/audit-trail-facts.md`).

**Mile markers** are anchor-calibrated, never hand-entered: `src/data/at-mile-anchors.yaml` → `scripts/calibrate-at-mileposts.mjs` → everything (map, tracker, Today, Scout, trail-facts derivations). Annual guidebook updates touch only the anchor file. Licensing rules — what data we may extract from purchased guides (facts: yes; their waypoint tables: never) — live in `docs/trail-data-provenance.md`. Read it before touching any trail data source.

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
- Forge deploys from `main`; keep the Scout node build green for production and keep the legacy Astro build green until the rollback/archive cleanup is intentionally done.

## Interrupt Handling

When the user mentions a bug, feature request, or task mid-conversation:
- **Default:** note it in the relevant roadmap/task list and continue current work
- **"Drop everything":** switch focus immediately
- Don't context-switch unless explicitly told to prioritize the interruption

## TrailHogg Game

Phaser 3.90 + Vite 7 sim of the full 2,197.9-mile AT (260+ real shelters, 24+ terrain zones, 25+ towns). Source in `trailhogg/`; a built copy is served statically at `/game` (committed under `public/game/` and `apps/openclaw-web/static/game/`). Feature-flagged "archived" in `src/lib/features.ts` — preserved, not part of the active product. Dev: `cd trailhogg/trailhogg && npm run dev:client`.

## Additional Documentation

- `AGENTS.md` — agent working notes (kept current more often than long-form docs)
- `architecture.md` — system tracks, Scout app architecture, target product architecture
- `docs/scout-reliability-runbook.md` — the reliability workflow (read before Scout changes)
- `docs/runbooks/` — Forge runtime, deploy recovery, Netlify→Forge cutover checklist
- `docs/business/` — Trail Assistant PRD, implementation plan, API/screen contracts
- `docs/plans/` — dated design plans (local-first phone AI, document system, etc.)
- `design.md`, `content-model.md` — visual system and content schemas
