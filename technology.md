## Technology Stack

### Overview
Hogg Country is now a multi-surface monorepo, not a single Astro site.

Current stack shape:
- **`apps/public`**: Astro 5 public site for `hoggcountry.com`
- **`apps/openclaw-web`**: newer SvelteKit frontend for Dad updates, Dad's guide, product pitch, and gated `/app/*` flows
- **`apps/workspace`**: earlier SvelteKit workspace prototype still kept in-repo
- **`backend/`**: Laravel 12 API, auth, moderation, ops, and legacy/native proof surfaces
- **`mobile/`**: SvelteKit + Capacitor shell for native packaging work
- **`packages/*`**: shared TypeScript packages for brand, manual, corpus, and trail data

This repo mixes content publishing, product web apps, and Laravel-backed operational APIs in one place.

### Core frameworks and runtimes
- **Node.js + TypeScript** across the web apps, scripts, and shared packages
- **Astro 5** for the public content-first site
- **Svelte 5** for interactive islands and app UIs
- **SvelteKit 2** for the newer application-shaped frontends
- **Vite 7** for frontend builds
- **Tailwind CSS 4** plus shared brand/theme CSS
- **Laravel 12 / PHP 8.2+** for backend APIs and operational tooling
- **Laravel Sanctum** for auth
- **Laravel Socialite** where external login is needed
- **Inertia + Svelte** in the backend for the `/native` proof surface
- **Capacitor 7** for native iOS/Android packaging work in `mobile/`
- **SpacetimeDB** patterns and generated bindings in `apps/openclaw-web`

### Repo surfaces

#### Public site: `apps/public`
- Astro-rooted public experience
- content, guide, video, and public product pages
- still shares the repo-level Astro config and build pipeline

#### New web app: `apps/openclaw-web`
- SvelteKit app for:
  - Dad overview and update flows
  - public map and video surfaces
  - guide rendering
  - OpenClaw-for-hikers pitch
  - gated `/app`, `/app/setup`, `/app/today`, `/app/manual`, `/app/docs`, `/app/claw`
- uses shared packages like `@hoggcountry/brand`, `@hoggcountry/corpus`, `@hoggcountry/manual-core`, and `@hoggcountry/trail-data`
- includes SpacetimeDB module/binding scaffolding

#### Earlier workspace app: `apps/workspace`
- SvelteKit prototype app kept while the newer frontend takes over
- still consumes shared corpus/manual/trail packages

#### Backend: `backend/`
- Laravel API and auth layer
- Trail Assistant domains for intake, chat, check-ins, progress, governance, BYOS, and SOS-related flows
- moderation and operational boundaries live here
- includes the earlier `/native` Inertia + Svelte shell

#### Mobile shell: `mobile/`
- separate SvelteKit app configured for Capacitor
- current native packaging path for iOS/Android work
- better long-term fit for consumer mobile delivery than the Laravel `/native` proof route

### Shared package layer
Shared packages are now part of the actual architecture, not just convenience code:

- **`packages/brand`**: shared theme CSS / visual language
- **`packages/manual-core`**: manual schema and shared manual logic
- **`packages/trail-data`**: trail-aware domain data and helpers
- **`packages/corpus`**: bundled/manual search corpus logic

### Content and build pipeline
The field guide remains the main source-of-truth document:
- **`MASTER_NOBO_FIELD_GUIDE.md`** is the canonical guide source
- root scripts generate downstream artifacts before builds

Important build steps from the root `package.json`:
- `scripts/parse-master-guide.js`
- `scripts/generate-search-index.js`
- `scripts/build-public-corpus.js`
- `scripts/build-guide-context.js`
- `scripts/build-proverbs-json.js`
- `scripts/generate-asset-manifest.js`

This means the repo is not just serving static markdown. It has a content-compilation pipeline that feeds both public and app surfaces.

### Video and live data
Video handling is now split across static and live paths:

- Astro-side YouTube utilities still exist in `src/lib/youtube.ts`
- live video surfaces also use the Laravel endpoint:
  - **`GET /api/v1/videos/latest`**
- the backend `VideoFeedController` fetches YouTube Atom feeds and can fall back to the channel videos page when feed requests fail
- the live API returns no-cache headers so public/prototype UIs can poll fresh data safely

### Styling and design system
- **Tailwind CSS 4** is the main utility layer
- **CSS variables** still carry the Hogg Country visual language
- the public Astro site keeps global styling in files like `src/styles/global.css`
- shared brand styling for newer app surfaces lives in `packages/brand`

### Configuration and workspace tooling
The root workspace coordinates the monorepo:
- `dev:public`
- `dev:workspace`
- `dev:openclaw`
- `dev:all`
- `build:public`
- `build:workspace`
- `build:openclaw`
- `backend:*` commands for Laravel install, dev, migrate, frontend build, and tests
- `monorepo:check` for combined frontend/backend verification

### Deployment shape
Current deployment model:
- public/frontend web surfaces deploy separately from the Laravel backend
- Astro and SvelteKit web apps are Netlify-oriented
- Laravel is Forge-oriented

That split is part of the current architecture and also one of the main places drift can happen if public frontend URLs and backend API deployment do not stay aligned.

### Current reality notes
- Hogg Country is no longer accurately described as a single static Astro site
- `apps/openclaw-web` is the newer product-facing frontend direction
- `apps/workspace` remains in the repo as an earlier prototype surface
- the backend is an active product layer, not just a tiny helper API
- the dedicated `mobile/` app is the clearer long-term native path

### Follow-ups
- Keep this file aligned as the handoff from `apps/workspace` to `apps/openclaw-web` becomes more final
- Keep public/frontend docs explicit about which routes still live in Astro versus the newer SvelteKit app
- Close deploy drift between Netlify-facing surfaces and Forge-backed APIs so the public product flows stay reliable
