# Trail Assistant Overnight Demo-Readiness + BYOS Decision Sprint

## Objective
Ship a credible demoable Trail Assistant flow by morning, produce hard evidence (screenshots + live checks), and make a source-backed architecture decision for BYOS around ChatGPT/OpenAI feasibility.

## Context
Starting external state at sprint kickoff:
- `https://hoggcountry.com/trail-assistant` → 404
- `https://hoggcountry.com/trail-assistant-thanks` → 404
- `https://hoggcountry.on-forge.com/` → 500
- `https://hoggcountry.on-forge.com/api/v1/health` → 200
- `https://hoggcountry.on-forge.com/api/v1/trail-assistant/plans` → 404

Repo already contained Trail Assistant implementation, but production surfaces were not aligned with latest routes.

## Implementation Summary
1. **Demo path hardening (frontend)**
   - Enhanced `src/pages/trail-assistant.astro` with:
     - local profile-state capture/save/clear UI,
     - preview state panel,
     - metadata bridge from saved profile into intake API payload,
     - link to dedicated profile route.
   - Added `src/pages/trail-assistant-profile.astro` as explicit profile-state path for demos.
   - Updated `src/pages/trail-assistant-thanks.astro` to link back to profile view.

2. **BYOS architecture + scaffold (backend)**
   - Added ADR doc: `docs/business/trail-assistant-byos-architecture-decision-2026-03-03.md`.
   - Added provider abstraction + entitlement service:
     - `backend/app/Support/TrailAssistantByosProviderRegistry.php`
     - `backend/app/Support/TrailAssistantByosEntitlementService.php`
     - `backend/app/Support/TrailAssistantByosEntitlement.php`
   - Added capability API route + controller:
     - `GET /api/v1/trail-assistant/byos/providers`
     - `backend/app/Http/Controllers/Api/V1/TrailAssistantByosController.php`
     - route wiring in `backend/routes/api.php`
   - Added BYOS config surface in `backend/config/trail_assistant.php`.

3. **Evidence artifact pack**
   - Created: `docs/business/daily-updates/assets/2026-03-03/trail-assistant-demo/`
   - Added screenshots (local journey + public mismatch)
   - Added HTTP verification outputs and local DB evidence.

## Files Touched
- `src/pages/trail-assistant.astro`
- `src/pages/trail-assistant-profile.astro`
- `src/pages/trail-assistant-thanks.astro`
- `backend/config/trail_assistant.php`
- `backend/routes/api.php`
- `backend/app/Http/Controllers/Api/V1/TrailAssistantByosController.php`
- `backend/app/Support/TrailAssistantByosProviderRegistry.php`
- `backend/app/Support/TrailAssistantByosEntitlementService.php`
- `backend/app/Support/TrailAssistantByosEntitlement.php`
- `backend/tests/Feature/Api/V1/TrailAssistantByosApiTest.php`
- `backend/tests/Unit/TrailAssistantByosEntitlementServiceTest.php`
- `docs/business/trail-assistant-byos-architecture-decision-2026-03-03.md`
- `docs/business/trail-assistant-backlog.md`
- `docs/business/trail-assistant-runlog.md`
- `docs/business/daily-updates/assets/2026-03-03/trail-assistant-demo/*`

## Validation / Evidence
- `php artisan test tests/Feature/Api/V1/TrailAssistantByosApiTest.php tests/Unit/TrailAssistantByosEntitlementServiceTest.php` ✅
- `npm run build` ✅ (includes `/trail-assistant-profile` route)
- Local smoke checks captured in:
  - `verification-http-statuses.txt`
  - includes local intake POST 201 and route/API 200s
- DB evidence captured in same file shows intake metadata includes saved profile snapshot (`trail_name=MiniHogg`, `direction=NOBO`).

## Outcome
- **Demo-ready path achieved locally** with:
  - accessible landing/intake route,
  - successful submit + thanks redirect,
  - visible profile-state path and persistence,
  - screenshot + curl evidence pack.
- **BYOS decision made**: user-provided OpenAI API key is the viable current model; ChatGPT subscription passthrough is not currently supportable from public OpenAI docs.
- **Production URLs remain misaligned** (deploy drift persists), so local demo path is the reliable morning fallback.
- GitHub push to `main` completed (`2c51960`), but repeated post-push checks still returned 404/500 mismatch externally.

## Follow-ups
1. Resolve Netlify/Forge deploy alignment and re-run same curl matrix publicly.
2. Add secure server-side storage + rotation UI for BYO API keys (currently abstraction only).
3. Add authenticated profile persistence endpoint to replace localStorage-only profile state for production.
4. Run full deploy verification runbook once production deploy is reachable.
