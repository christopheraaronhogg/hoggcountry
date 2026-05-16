# 2026-04-10: Scout Web Frontend

## Decision

Add a new frontend in the monorepo:

- `apps/openclaw-web`
- SvelteKit for the web app shell, routing, server loaders, and gated app
- SpacetimeDB module plus generated bindings for realtime and shared-state patterns
- keep the current Astro frontend live while this app matures

## Why

The product needs a frontend that can do more than static marketing pages:

- public Dad updates with a map and video feed
- a public pitch for the new Scout-for-hikers product
- a gated app flow for setup, manual, docs, Today, and Claw

At the same time, Dad's field guide remains a staple of the codebase and should stay portable across surfaces.

## What shipped

### New app
- `apps/openclaw-web/`
- public routes for Dad, guide, and product pitch
- gated `/app/*` routes behind signup cookie
- shared Hogg Country look and feel via `packages/brand`

### SpacetimeDB
- `apps/openclaw-web/spacetimedb/src/index.ts`
- generated bindings in `apps/openclaw-web/src/lib/module_bindings/`
- frontend provider/bootstrap in `apps/openclaw-web/src/lib/spacetime.ts`

### Dad and guide surfaces
- Dad map page using Garmin-style tracking data
- Dad video feed page using YouTube feed data
- Dad's guide rendered in the new app from the same source pipeline as Astro

### Gated app
- `/app`
- `/app/setup`
- `/app/today`
- `/app/manual`
- `/app/docs`
- `/app/claw`

## Important implementation notes

- The guide source of truth is still `MASTER_NOBO_FIELD_GUIDE.md`.
- The Astro site and the new SvelteKit site both consume generated guide content.
- The new app uses SpacetimeDB patterns directly, but still keeps local device persistence where offline manual/doc access matters.
- The gated app is intentionally manual-first. The Claw surface is bounded to maintaining the field manual, not general chat.

## Next likely steps

1. Publish and configure the SpacetimeDB module for non-preview environments.
2. Move more manual/doc state from local-only persistence to identity-scoped SpacetimeDB records where appropriate.
3. Add real invite/auth beyond the lightweight beta gate.
4. Decide when `app.hoggcountry.com` becomes the primary frontend versus a beta surface.
