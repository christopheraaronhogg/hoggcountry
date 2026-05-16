# 2026-04-17: Front Page Rewrite in SvelteKit + SpacetimeDB

## Decision
Begin the public-frontend migration with the front page.

Rewrite the current home page experience in `apps/openclaw-web` and treat that route as the first serious cutover candidate for `hoggcountry.com`.

## Why start with the front page
The front page is the best forcing function for the next version of Hogg Country because it touches all the important decisions at once:

- the product story
- the live Dad-updates posture
- public SEO and first-load performance
- guide portability across surfaces
- the handoff between public marketing and gated product
- the realtime architecture boundary

If the front page still behaves like a mostly static brochure, the product will keep feeling split-brain. If the front page becomes the first good SvelteKit surface, the rest of the public migration gets much easier.

## Current reality
Today there are two overlapping home-page directions in the repo:

1. `src/pages/index.astro`
   - current public front page on the Astro side
   - strong split-story copy: Dad's public guide + private manual workspace
   - fetches videos through Astro-side YouTube helpers

2. `apps/openclaw-web/src/routes/+page.svelte`
   - newer SvelteKit version
   - already points in the right product direction
   - still loads most data through server utilities, not realtime subscriptions

That means the rewrite is not starting from zero. The right move is to turn the SvelteKit route into the real front page, not build a third competing homepage.

## Recommendation
Yes, rewrite the front page in SvelteKit.

But do **not** make the entire page depend on a live SpacetimeDB connection for first render.

The right architecture is:
- **SvelteKit SSR for first paint, SEO, sharing, and no-JS resilience**
- **SpacetimeDB for live modules that should update in place after hydration**
- **Laravel and existing server fetchers remain durable sources where trust, auditability, or external integration still matter**

Short version: **server-rendered first, realtime second**.

## Product intent for the new front page
The front page should feel like:
- a live front porch for Dad's hike
- a clear entry into Dad's guide
- the first convincing proof that Scout for hikers is a real product, not vague AI wallpaper

The public homepage should answer three questions fast:
1. What is happening on trail right now?
2. Why should I trust this guide/manual ecosystem?
3. What do I do next if I want the product?

## Content model for the new front page

### Static or mostly-stable blocks
These should be SSR-first and should still render correctly if realtime is down:
- hero copy and positioning
- guide CTA and proof blocks
- product framing for Scout for hikers
- core navigation
- canonical CTA stack

### Live blocks
These are good candidates for SpacetimeDB-backed subscriptions after hydration:
- latest Dad status card
- fresh map fix summary
- latest dispatch/video strip
- public announcement ribbon
- any lightweight "trail is live" heartbeat indicators

### Keep out of scope for phase 1
Do not overload the homepage rewrite with everything:
- full guide migration strategy
- account system rewrite
- billing/subscription UI
- full moderator/operator tooling
- replacing Laravel as system of record

## Data ownership rules
Use the same hybrid rule already implied elsewhere in the repo.

### Laravel / existing fetchers remain responsible for:
- trusted external pulls that need guardrails
- durable public API responses
- audit-friendly writes
- anything tied to auth, moderation, or compliance

### SpacetimeDB should own:
- fast fanout of public live state
- low-latency homepage updates
- lightweight shared public data that benefits from subscriptions

### Front-page rule of thumb
If losing the websocket should not break the page, it belongs in SSR fallback data.
If seeing it update live adds delight or usefulness, it can also be mirrored into SpacetimeDB.

## Proposed front-page architecture

### Route ownership
Primary route target:
- `apps/openclaw-web/src/routes/+page.server.ts`
- `apps/openclaw-web/src/routes/+page.svelte`

### Initial load path
1. SvelteKit server load fetches:
   - latest public video items
   - latest track summary
   - guide preview
   - any seeded public announcements
2. page renders complete HTML on first response
3. client hydrates
4. SpacetimeDB connection starts
5. live blocks subscribe and replace stale SSR snapshots when newer data exists

### Realtime tables to use or extend
Existing useful tables in `apps/openclaw-web/spacetimedb/src/index.ts`:
- `dad_update`
- `video_dispatch`
- `public_announcement`

Likely additions for homepage polish:
- `front_page_stat` or `front_page_signal`
- optional ordering/visibility metadata for announcement cards
- optional freshness timestamps / source tags for public modules

## UX principles for the rewrite
- mobile-first always
- one-handed readability
- no generic AI language
- live signals should look dependable, not gimmicky
- the guide remains the trust anchor
- the product CTA should feel earned by the public proof, not stapled on

## Technical principles
- keep the route server-renderable
- keep JS failure survivable
- no blank hero while waiting on realtime
- no hard dependency on SpacetimeDB for SEO-critical content
- keep module boundaries clean so the same guide data can serve Astro and SvelteKit until cutover is done

## Migration phases

### Phase 1: lock the front-page contract
Define and document:
- final section order
- which blocks are static vs live
- which data comes from SSR vs SpacetimeDB
- what the canonical CTA stack is
- what counts as MVP parity with the Astro homepage

### Phase 2: build parity in `apps/openclaw-web`
Bring the SvelteKit home route to feature parity or better with the current Astro route:
- hero
- public proof blocks
- guide CTA
- video strip
- map/update entry points
- product CTA

### Phase 3: add live subscriptions
Wire the homepage to SpacetimeDB for selective live modules:
- announcements
- latest Dad update
- dispatch freshness
- map-fix freshness signal

Keep SSR fallback data in place.

### Phase 4: define publishing/update path
Decide how homepage live data gets written:
- seed/manual ops path for now
- mirrored Laravel writes later where needed
- eventual admin/update tooling only after the public contract is stable

### Phase 5: cutover
When the SvelteKit home is clearly better than Astro:
- point the root homepage to the SvelteKit app
- keep the remaining Astro routes alive where needed during transition
- avoid a big-bang rewrite of every public page at once

## Acceptance criteria for the rewrite
The new front page is good enough to cut over when:
- it renders useful HTML without client JS
- it tells the Hogg Country story more clearly than the Astro page
- live data updates in place when realtime is available
- it still works gracefully when realtime is unavailable
- mobile performance remains strong
- the guide and product CTAs are clearer, not noisier

## Biggest risks

### 1. Realtime overreach
If the page depends too heavily on SpacetimeDB for first paint, the public front door gets less reliable.

### 2. Triple-drift
If Astro home, SvelteKit home, and docs all evolve separately, the repo gets confusing fast.

### 3. Story drift
If the front page becomes "AI product marketing" instead of "trail-first manual + live field proof," it will lose the thing that makes it credible.

## Immediate next tasks
1. freeze the homepage information architecture
2. define the SSR data contract for the SvelteKit home route
3. define the live-module contract for SpacetimeDB-backed blocks
4. upgrade `apps/openclaw-web/src/routes/+page.*` to be the clear replacement target
5. only then decide the root-domain cutover mechanics

## Practical recommendation
This is the right direction.

I would start by treating the SvelteKit front page as the new canonical implementation target, then rewrite it around a hybrid model:
- public and crawlable on first render
- live where freshness matters
- still grounded in Dad's guide and real trail state

That gives Hogg Country a homepage that finally behaves like the product you actually want to build, without making the public front door brittle.
