# 2026-04-09: Public Site + Workspace Split

## Decision
Hogg Country now runs as two apps in one monorepo:

- `apps/public` remains the Astro public site at `hoggcountry.com`
- `apps/workspace` is the SvelteKit personal workspace intended for `app.hoggcountry.com`

This keeps the public side content-first and SEO-friendly while giving the personal field manual an app-shaped home.

## What stays central
- Dad's Appalachian Trail field guide remains the staple public artifact.
- Dad's video feed remains live on the public site as a secondary surface.
- The personal field manual is now the main private product artifact for hikers.

## Repo shape
- `apps/public`
- `apps/workspace`
- `packages/manual-core`
- `packages/trail-data`
- `packages/corpus`

## Product surfaces
Public:
- `/`
- `/guide/`
- `/videos/`
- `/lab/`

Workspace:
- `/setup`
- `/today`
- `/plan`
- `/manual`
- `/search`
- `/docs`

## Current implementation status
- Monorepo workspace scripts are in the root `package.json`
- The public landing page now points users toward the guide and workspace
- Header/footer/navigation were simplified around the new product shape
- Off-brand public routes such as `/ask`, `/kjv`, `/compare`, `/cat`, `/generate`, `/prototypes`, and `/tools/` now render shelved notices instead of presenting themselves as core product surfaces
- The SvelteKit workspace is local-first and stores manuals plus imported docs in IndexedDB
- The workspace builds with offline assets and `noindex` defaults
- Shared packages provide manual schema, trail-fact-driven Today/Plan logic, and bundled corpus search

## Operating rule
The manual is the source of truth. The assistant is the steward of the manual.

## Why not one framework everywhere
Astro remains the better fit for the public guide and discovery surfaces.
SvelteKit is the better fit for the private workspace because it behaves like an application, not a content site.
