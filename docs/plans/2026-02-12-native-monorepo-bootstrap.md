# 2026-02-12 - Native Monorepo Bootstrap

## Goal
Start the native app track inside the existing repository without breaking current web + API deployments.

## Repository Topology
- `src/`, `public/`, `netlify/`: Astro marketing + tools web app
- `backend/`: Laravel 12 API/auth service, now also hosts Inertia + Svelte app shell route
- Shared root scripts coordinate both app surfaces (`monorepo:dev`, `monorepo:check`)

## What Was Bootstrapped
1. Laravel Inertia + Svelte 5 foundation in `backend/`.
2. First app shell route at `GET /native`.
3. First Svelte page at `backend/resources/js/Pages/NativeLanding.svelte`.
4. New public app landing route at `GET /app` in Astro with App Store / Play Store CTAs.
5. Header navigation now includes `Get App`.

## Local Commands
```bash
# Run Astro + Laravel together
npm run monorepo:dev

# Validate web build + backend frontend build + backend tests
npm run monorepo:check
```

## Environment Variables
- `PUBLIC_APP_STORE_URL` - iOS listing URL
- `PUBLIC_PLAY_STORE_URL` - Android listing URL
- `PUBLIC_APP_WAITLIST_URL` - optional fallback CTA destination (defaults to `/login?redirect=%2Ftrail`)

## Native Build Track (Next)
1. Add authenticated Inertia routes for upload/map/session shell state.
2. Introduce NativePHP packaging config and platform build targets.
3. Wire app auth bootstrap to existing Sanctum token/session flow.
4. Add local media proxy generation path for unsupported codecs.
5. Add device background sync + heartbeat telemetry endpoints.
