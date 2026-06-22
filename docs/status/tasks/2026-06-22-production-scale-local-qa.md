# Production-Scale Local QA Pass

## Objective
Build sanitized, production-scale local data under production-like settings, inventory user-facing routes and controls, define acceptance criteria with finite edge cases, test as real users, fix shared causes, and rerun to a clean local pass without touching production or sensitive data.

## Non-Production Boundary
- No production deploy, push-triggered Forge deploy, live Forge verification, real customer/user data, or destructive action was performed.
- Local Forge-like services were used:
  - SvelteKit Scout node server: `http://127.0.0.1:3000`
  - Laravel API: `http://127.0.0.1:8000/api/v1`
  - SQLite database: `/Volumes/ChrisProjectsSSD/hoggcountry-qa.XPR8rv/backend.sqlite`
  - Scout workspace data: `/Volumes/ChrisProjectsSSD/hoggcountry-qa.XPR8rv/scout-workspaces`
- Production-like runtime flags included `NODE_ENV=production`, `APP_ENV=production`, `APP_DEBUG=false`, `ORIGIN=http://127.0.0.1:3000`, and local API origins wired through `PUBLIC_API_BASE_URL` and `TRAIL_UPDATES_API_BASE`.

## Sanitized Data Scale
- 24 users and profiles
- 48 devices
- 72 sync documents
- 72 sync changes
- 8 public/community trackers
- 960 tracker fixes
- 180 trail assistant check-ins
- 80 trail assistant intakes
- 64 trail assistant map reports
- 64 map report audits
- 18 SOS escalations
- 24 map visibility settings
- 36 VideoHogg runs
- Scout workspace seed:
  - profile: `HoggCountry`
  - current mile: `318.7`
  - sections: 7
  - documents: 24
  - resources: 30
  - tools: 16
  - loadout items: 42
  - sanitized null-link count: 37

## Inventory Coverage
The rerun inventory used the previously discovered route matrix and fresh browser contexts so public and authenticated state did not bleed together.

- User states:
  - public/anonymous
  - authenticated hiker
  - authenticated non-admin visiting admin routes, expected forbidden state
  - admin allowlisted smoke for admin-only pages
  - VideoHogg allowlisted local user
- Viewports:
  - desktop
  - mobile
- Route/control inventory after fixes:
  - 81 route/state entries
  - 162 route/viewport checks
  - 162 passed
  - 0 failures
  - 0 blank titles
  - visible control totals:
    - buttons: 2874
    - text inputs: 170
    - email inputs: 142
    - password inputs: 8
    - number inputs: 36
    - range inputs: 14
    - hidden inputs: 6
    - date inputs: 6
    - url inputs: 2
    - search inputs: 2
    - selects: 42
    - textareas: 32
    - file inputs: 6
    - checkboxes: 12
    - summaries/disclosures: 14
    - role-backed clickable divs: 20
    - role-backed anchors: 4

Full route/control evidence:
- `/Volumes/ChrisProjectsSSD/hoggcountry-qa.XPR8rv/artifacts/production-local-route-matrix-after-fixes.json`
- `/Volumes/ChrisProjectsSSD/hoggcountry-qa.XPR8rv/artifacts/production-local-route-matrix-after-fixes-summary.json`
- `/Volumes/ChrisProjectsSSD/hoggcountry-qa.XPR8rv/artifacts/app-title-smoke-after-fix.json`

## Acceptance Criteria and Edge Cases
### Public Site and Content Routes
Acceptance criteria:
- Route returns a non-empty document with a non-empty title.
- Main content is visible on desktop and mobile.
- Shared navigation renders without internal errors.
- Waitlist/sign-up entry points remain non-destructive in local QA.

Finite edge cases:
- Anonymous public visit.
- Public route after a separate authenticated run, isolated by fresh browser context.
- Mobile viewport nav/menu rendering.
- External media/resource console noise is recorded but does not fail a page unless it breaks visible content.

### Field Guide, Blog, Trips, Tags, and Static Legal Pages
Acceptance criteria:
- Generated content routes render titles, headings, and body text.
- Guide route set remains navigable at scale.
- Legal/support/data pages render without auth requirements.

Finite edge cases:
- Long guide chapters.
- Quick-reference guide routes.
- Empty or sparse archive buckets.
- Mobile body overflow risk on long generated pages.

### Trail Tools, Weather, Maps, and Tracking
Acceptance criteria:
- Tool pages render their visible inputs and controls.
- Map/tracking pages render without server or client internal errors.
- Weather and calculator controls remain visible and enabled where expected.

Finite edge cases:
- Numeric/range input pages.
- Search and checkbox tool pages.
- Map routes with third-party tile/resource loading noise.
- Desktop and mobile initial map states.

### Auth and Account
Acceptance criteria:
- Login, sign-up, forgot-password, and reset-password routes return expected status.
- Bad login is rejected.
- Protected app routes redirect anonymous users.
- Authenticated hiker can reach app routes.

Finite edge cases:
- Anonymous `/app`, `/app/today`, and `/app/map` redirect.
- Invalid credentials return `400`.
- Closed registration displays the launch-list path.
- Reset route renders without a live token.

### Scout Workspace
Acceptance criteria:
- Authenticated hiker can load Today, Scout, Claw, Map, Trail, Docs, Resources, Loadout, Profile, Setup, Tools, Manual, Skills, and Scout Lab routes.
- Seeded HoggCountry workspace data renders.
- Route titles are present and route-specific.
- No route displays `Internal Error`.

Finite edge cases:
- Production SSR render of `/app/scout` and `/app/claw`.
- Mobile and desktop workspace layouts.
- Workspace routes that rely on local seeded files.
- Service-worker/client navigation after direct route loads.

### Admin Routes
Acceptance criteria:
- Non-admin hiker receives expected forbidden/error route state for admin URLs.
- Admin-allowlisted user can load admin resources and reference progress pages.
- Admin titles and headings are present.

Finite edge cases:
- Non-admin direct URL visit.
- Admin direct URL visit after allowlist restart.
- Admin resources with production-scale seeded workspace data.

### VideoHogg and Trail Assistant Support Flows
Acceptance criteria:
- Intake/support routes render visible controls without production submit side effects.
- Allowlisted local account can reach VideoHogg UI.
- Trail Assistant demo/support routes load under production-like CSP.

Finite edge cases:
- File-input presence without uploading real media.
- Summary/disclosure controls visible.
- Public support and thanks routes.
- Local API origin allowed by CSP.

### Mobile App
Acceptance criteria:
- Unit/contract tests pass.
- Svelte check passes.
- Production mobile web build passes.
- User-facing route/action labels match test contracts.

Finite edge cases:
- Trail Pulse report action label.
- Release proof contract next-mode blocker list.
- Readable text floor on release-critical mobile screens.
- Existing launch proof separation between code-build and store/device evidence.

## Bug Log and Fixes
### BUG-001: `/app/scout` SSR crash in production node build
Evidence:
- Authenticated `/app/scout` returned an internal server error under production-like SvelteKit node.
- Root cause: `onDestroy` cleanup referenced `document` and `window` in a path that can run during SSR teardown.

Fix:
- Guarded browser globals in `apps/openclaw-web/src/routes/app/claw/+page.svelte`.

Regression:
- `scripts/scout-production-runtime.test.mjs` asserts the teardown source contract is SSR-safe.
- Authenticated `/app/scout` and `/app/claw` load cleanly in the rerun.

### BUG-002: Production-like CSP blocked local API calls
Evidence:
- Browser-side API calls to `http://127.0.0.1:8000` were blocked when the local node app ran with production headers.

Fix:
- Added `apps/openclaw-web/src/lib/server/security-headers.ts`.
- `connect-src` now includes origins from `PUBLIC_API_BASE_URL` and `TRAIL_UPDATES_API_BASE`, origin-only and without leaking paths or tokens.
- `apps/openclaw-web/src/hooks.server.ts` delegates header generation to the helper.

Regression:
- `scripts/scout-production-runtime.test.mjs` verifies configured API origins are present and sensitive path/token fragments are not.
- `curl -sI http://127.0.0.1:3000/trail-assistant` shows `connect-src ... http://127.0.0.1:8000`.

### BUG-003: Authenticated app routes had blank document titles
Evidence:
- The first full inventory found blank titles across authenticated `/app/*` route states.

Fix:
- Added route-aware app shell title handling in `apps/openclaw-web/src/routes/app/+layout.svelte`.

Regression:
- Focused smoke checked 14 authenticated app routes: 14 passed, 0 failed.
- Full rerun checked 162 route/viewport states: 0 blank titles.

### BUG-004: Mobile Trail Pulse action label contract drift
Evidence:
- Root `npm test` failed because the mobile route contract expected `Report conditions` and the UI exposed `Report`.

Fix:
- Updated the visible action label in `mobile/src/lib/components/MapTab.svelte`.

Regression:
- Targeted mobile route contract passed.
- Full root `npm test` passed.

### BUG-005: Mobile release proof next-mode contract was stale
Evidence:
- Root `npm test` expected old unresolved blocker names that no longer match the current evidence ledger.

Fix:
- Updated `scripts/mobile-release-proof-contract.test.mjs` to assert the current unresolved production/store/device blockers while still ensuring `code-build:` blockers are absent.

Regression:
- Targeted release proof contract passed.
- Full root `npm test` passed.

### BUG-006: Mobile Today HUD unit text was below the readable text floor
Evidence:
- Final root `npm test` failed `mobile-accessibility-contract.test.mjs` because `mobile/src/lib/components/TodayTab.svelte` used `0.78rem` for the `mi` unit suffix.

Fix:
- Replaced that local size with `var(--text-floor)`.

Regression:
- `node --experimental-strip-types --experimental-transform-types --test scripts/mobile-accessibility-contract.test.mjs` passed.
- `cd mobile && npm run check` passed.
- Full root `npm test` passed.

### ENV-001: Default temp volume was full
Evidence:
- Large local QA data generation could not safely fit in the default temp area.

Fix:
- Moved the QA sandbox to `/Volumes/ChrisProjectsSSD/hoggcountry-qa.XPR8rv`.

### WARN-001: Existing non-blocking build warnings
Evidence:
- `npm run build:scout:forge` reports unused CSS selector warnings in `TrailMapExplorer.svelte`.
- Mobile build reports Rollup annotation warnings for `/* @__PURE__ */` comments in `src/lib/trailState.svelte.ts`.

Disposition:
- Non-blocking. Builds pass and warnings were not introduced as part of the critical fixes.

## Verification Commands
- `npm run build:scout:forge` -> passed
- `node --experimental-strip-types --experimental-transform-types --test scripts/scout-production-runtime.test.mjs` -> passed
- `node scripts/verify-scout-field-readiness.mjs --base-url http://127.0.0.1:3000 --email hiker.qa@hoggcountry.local --password local-qa-pass-2026 --json` -> passed
- `curl -sI http://127.0.0.1:3000/trail-assistant` -> `200 OK`, CSP includes local API origin
- Full route/control inventory after fixes -> 162/162 passed
- Focused app title smoke after fixes -> 14/14 passed
- Admin allowlist smoke:
  - `/app/admin/resources` -> `200`, `Scout Resource Explorer | Hogg Country`
  - `/app/admin/reference-progress` -> `200`, `Reference Progress | Scout Admin`
- `npm run backend:test` -> 108 passed
- `cd mobile && npm test` -> 123 passed
- `cd mobile && npm run check` -> passed
- `cd mobile && npm run build` -> passed
- `npm test` -> 202 passed

## Outcome
Local production-scale QA is clean for the scoped non-production environment:
- Sanitized data is seeded at production-like scale.
- Production-like backend and node settings are running locally.
- Route/state/control inventory rerun passed after fixes.
- Shared causes were fixed with regression tests.
- Backend, mobile, Scout build, focused smokes, and root tests pass.

## Residual Production Handoff
These remain intentionally unperformed until explicitly approved:
- Push to `main`, because Forge auto-deploys `main`.
- Live `https://hoggcountry.com` verification with `npm run verify:forge`.
- Real TestFlight/App Store/Play Store, physical-device, or store-account proof.
- Any real user, sensitive-data, payment, email-send, upload, or destructive workflow.
