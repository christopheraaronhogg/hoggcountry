## Architecture

### System overview

Hogg Country has three architecture tracks sharing one repository:

1. **Content platform**
   - Astro static site for timeline, guide, tools, and marketing surfaces
2. **OpenClaw web frontend**
   - SvelteKit + SpacetimeDB patterns for Dad updates, Dad's guide, and the gated hiker workspace
3. **Trail Assistant product**
   - Laravel-backed operational system for hiker support, safety, and future mobile experiences

The current shape is a content-rich public site, a new product-grade SvelteKit frontend, and a Laravel ops layer.

### High-level layers

- **Astro web layer**
  - static and hybrid pages in `src/pages/`
  - public Trail Assistant surfaces such as `/trail-assistant`, `/trail-assistant-profile`, and `/trail-assistant-byos`
- **Interactive client layer**
  - Svelte islands for targeted interactivity
  - future phone-first shell for Today / Plan / Coach / Town / Safety / Account
- **OpenClaw web app layer**
  - SvelteKit layouts and routes in `apps/openclaw-web`
  - public Dad, guide, and marketing surfaces
  - gated `/app/*` workspace for setup, Today, manual, docs, and Claw
  - SpacetimeDB client/provider patterns and generated bindings
- **Laravel API layer**
  - authenticated and public APIs under `backend/routes/api.php`
  - Trail Assistant domains for intake, chat, check-ins, progress, map sharing, map reports, SOS, governance, and BYOS
- **Operations layer**
  - moderation, runbooks, backlog, and queue-review docs in `docs/business/`

### Recommended stack by surface

- **Marketing, content, and public landing pages**
  - Astro 5
  - Svelte 5 islands where needed
  - Tailwind CSS 4 + CSS variables
- **New product web frontend**
  - SvelteKit
  - SpacetimeDB client/module patterns
  - shared brand CSS from `packages/brand`
- **Backend and operations**
  - Laravel 12
  - Sanctum for auth
  - Socialite where external login is needed
  - Forge-managed API deployment
- **Mobile app**
  - dedicated SvelteKit + Capacitor application for iOS and Android packaging
  - shared TypeScript domain logic where practical
  - local offline queue using device storage

The existing `/native` Laravel Inertia route is useful as a proving surface, but it should not be the long-term mobile architecture. Inertia is fine for internal or admin-adjacent app shells; it is not the clearest route to a polished consumer mobile app distributed through the App Store and Play Store.

### Content platform architecture

#### Static content
- Content sources:
  - `src/content/trips/`
  - `src/content/posts/`
  - `src/content/blog/`
  - `src/content/guide/`
- Guide source of truth:
  - `MASTER_NOBO_FIELD_GUIDE.md`
  - parsed by `scripts/parse-master-guide.js`

#### Primary public routes
- `/` — merged timeline of trips and videos
- `/guide` — full field guide
- `/tools` — planning tools
- `/app` — app landing page
- `/ask` — legacy AI chat surface
- `/trail-assistant` — public Trail Assistant intake flow
- `/trail-assistant-profile` — profile-state demo route
- `/trail-assistant-byos` — provider and entitlement demo route

#### Data flow
- trips come from content collections
- videos come from YouTube RSS
- guide chapters are generated from the master guide document
- static pages are built by Astro and enhanced with Svelte only where needed

### OpenClaw web app architecture

#### Primary app routes
- `/`
  - Dad updates + OpenClaw pitch
- `/dad`
  - Dad overview and update cards
- `/dad/map`
  - public map tracking surface
- `/dad/videos`
  - public YouTube dispatch feed
- `/guide`
  - Dad's field guide inside the SvelteKit app
- `/guide/[slug]`
  - chapter routes
- `/openclaw`
  - product pitch for the hiker workspace
- `/signup`
  - lightweight beta gate
- `/app/*`
  - gated manual-first workspace

#### State and data flow
- public Dad/video/guide data is loaded through SvelteKit server utilities
- product state is structured around SpacetimeDB tables/reducers and generated TypeScript bindings
- local device persistence still exists where offline manual/doc access matters
- Dad's field guide remains authored from `MASTER_NOBO_FIELD_GUIDE.md` and is reused by Astro and SvelteKit

### Trail Assistant application architecture

#### Product intent
Trail Assistant is moving toward a `WHOOP for hiking` model:
- daily Trail Readiness
- rolling 7-day Trail Plan
- grounded Trail Coach
- town logistics support
- safety and check-ins
- human concierge escalation

#### Current public product surfaces
- `src/pages/trail-assistant.astro`
- `src/pages/trail-assistant-profile.astro`
- `src/pages/trail-assistant-byos.astro`
- `src/components/TrailChat.svelte`
- `src/pages/ask.astro`

#### Current backend domains
- intake
- chat
- check-ins
- progress
- map-sharing settings and feeds
- map reports and moderation
- SOS escalation
- moderator governance
- BYOS provider registry and entitlement preview
- plan catalog metadata

These domains already establish the trust boundaries needed for a premium hiker-support product even though the final app experience is not yet assembled.

### Recommended target architecture

#### 1. Hiker state layer
Server-owned state that personalizes every recommendation:
- profile
- latest route and segment context
- recent check-ins
- daily log / symptom journal
- itinerary
- plan tier / entitlements

#### 2. Decision engine layer
Explainable services that convert state into actions:
- Trail Readiness service
- itinerary generation service
- risk and escalation rules
- model-grounding service for Coach responses

#### 3. Operations layer
Human workflows for non-routine cases:
- support queue
- urgent queue
- itinerary override tools
- partner directory
- audit trail

#### 4. Partner intelligence layer
Structured data for hostels, shuttles, outfitters, and local constraints:
- service catalog
- availability notes
- freshness timestamps
- region-specific caveats

### Request and decision flow

#### Today screen flow
1. client loads authenticated hiker state
2. backend combines profile, check-ins, daily logs, itinerary, and weather/segment context
3. readiness service calculates recommendation
4. client renders score, daily target, and top risk drivers

#### Coach flow
1. user asks a question
2. backend grounds the request in hiker state and current itinerary
3. model returns concise recommendation
4. low-confidence or high-risk scenarios offer concierge escalation

#### Safety flow
1. hiker submits check-in, map report, or SOS payload
2. backend applies auth, idempotency, privacy, cooldown, and moderation rules
3. appropriate queues and feeds update
4. operators review high-risk items when required

### Trust boundaries

- public routes may collect intake or show non-sensitive information
- authenticated APIs own user-specific state
- moderator-only APIs control visibility, governance, and emergency workflows
- raw secrets such as BYOS keys must stay server-side
- unverified public hazard data must never leak into trusted public feeds

### Directory layout (selected)

- `src/pages/` — Astro routes and public surfaces
- `src/components/` — Astro and Svelte UI pieces
- `src/lib/` — shared frontend utilities
- `src/content/` — markdown content collections
- `backend/routes/api.php` — Laravel API surface
- `backend/app/Http/Controllers/Api/V1/` — API controllers
- `backend/app/Support/` — support services such as BYOS provider logic
- `docs/business/` — product, safety, queue, and operating docs

### Deployment shape

- Astro site deploys to Netlify
- Laravel API deploys to Forge-managed infrastructure
- public Trail Assistant routes depend on correct API base alignment between those surfaces
- recommended mobile app build path is Capacitor-generated iOS and Android projects backed by the same Laravel APIs

Current known issue:
- deploy drift between Netlify and Forge remains the main production reliability risk for Trail Assistant public routes

### Design implications

- the public site can remain Astro-first
- the premium product should be phone-first and offline-aware
- user state and recommendation logic should stay server-owned for consistency and auditability
- AI should be treated as one decision service inside a larger ops system, not the system itself

### Priority next steps

- close public deploy drift
- add server-owned profile and daily log models
- build readiness and itinerary services
- replace the isolated chat surface with a grounded Coach experience
- build an operator console before scaling concierge volume
