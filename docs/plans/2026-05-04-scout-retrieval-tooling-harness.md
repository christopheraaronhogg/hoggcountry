# Scout retrieval and tooling harness plan

Date: 2026-05-04
Status: proposed next build slice after Pine Grove Furnace itinerary failure

## Why this exists

The Pine Grove Furnace 3-day NOBO dogfood run proved the model swap is not enough. `deepseek-v4-pro` is cheaper and usable for general language, but it still confidently invented or misordered Appalachian Trail route facts when asked for a real itinerary.

Scout needs a source-aware harness:

- know what source material is available;
- choose the right source lane for the question;
- search/open the relevant source material;
- validate mileage/order facts deterministically;
- cite evidence and say when evidence is missing;
- use live websites/APIs when that is the best reliable source;
- keep private hiker resources separate from public/shared trail intel.

The goal is not a generic web-scraping chatbot. The goal is a trail guide that can help real hikers without pretending uncertain facts are verified.

## Current state

Already shipped pieces:

- `search_scout_sources` in `apps/openclaw-web/src/lib/server/claw-agent.ts` searches private workspace sections, imported docs, resources, tools, reviewed corpus, and public Dad pilot signals.
- `check_official_trail_sources` in `apps/openclaw-web/src/lib/server/scout-official-sources.ts` fetches ATC Trail Updates and NWS point forecasts/alerts.
- Resources are private source material and can be attached to Scout turns.
- The source catalog doc already defines high-level lanes: private workspace, reviewed Hogg Country corpus, public hiker signals, user-owned guide data, and official/direct live checks.

Main gaps:

- The DeepSeek/OpenCode Go runtime currently gets preloaded source context but no true model tool calls.
- Existing official checks cover closures/weather, not route order/mileage.
- Search is lightweight lexical search over whole artifacts, not a real source catalog with chunk receipts.
- PDFs are metadata-only unless the user pastes/exported text.
- No deterministic AT route validator exists, so named shelters/towns/mileages can still be hallucinated.
- No eval harness blocks regressions like the Pine Grove Furnace failure.

## Design principles

1. **Harness first, model second.** The model writes the answer. Host code gathers/verifies evidence.
2. **Fail closed on trail facts.** If Scout cannot validate named route/mileage facts, it must say what to verify instead of filling gaps.
3. **One consistent route source per itinerary.** Do not mix unrelated mileage systems inside one proposed route without warning.
4. **Source catalog before broad web.** Scout should know which books/docs/APIs exist and when to open them.
5. **Use live websites where appropriate.** For weather, closures, town hours, land manager notices, and service availability, an allowlisted fetch/curl connector is acceptable and often better than stale bundled data.
6. **Private stays private.** User resources can ground that user’s answer; they do not become shared Scout knowledge without explicit review/approval.
7. **Citations are product UX, not decoration.** Tool receipts should be stored and displayed so the hiker can see what Scout actually used.

## Harness architecture

### 1. Source catalog manifest

Add a first-class source catalog package, likely `packages/scout-sources`, with source manifests and generated indexes.

Each source entry should include:

```ts
interface ScoutSourceManifest {
  id: string;
  title: string;
  lane: 'hogg-owned' | 'official-public' | 'open-data' | 'live-official' | 'direct-live' | 'user-private' | 'third-party-review-needed';
  trust: 'owned' | 'official' | 'reviewed' | 'open-crowd' | 'private' | 'unknown';
  accessMode: 'bundled-index' | 'workspace-private' | 'live-fetch' | 'user-import-required' | 'disabled-pending-review';
  license: {
    label: string;
    termsUrl?: string;
    attributionRequired: boolean;
    redistributionAllowed: boolean | 'unknown';
    notes: string;
  };
  freshness: {
    generatedAt?: string;
    updateCadence: 'static' | 'daily' | 'weekly' | 'manual' | 'live';
    staleAfterDays?: number;
  };
  coverage: {
    trail?: 'AT';
    states?: string[];
    mileStart?: number;
    mileEnd?: number;
    bbox?: [number, number, number, number];
    topics: string[];
  };
  citationTemplate: string;
  allowedActions: Array<'catalog' | 'search' | 'open' | 'route-validate' | 'live-fetch'>;
  caveats: string[];
}
```

This lets Scout answer: “I have the Hogg Country field guide, NPS/ATC centerline mileposts, NWS forecasts, USGS hydro data, OSM shelters with ODbL caveats, your private resources, and live ATC Trail Updates. I do not have bundled FarOut/AWOL unless you import your owned copy.”

### 2. Source artifacts and chunks

Represent every searchable source as artifacts/chunks, not one giant blob.

```ts
interface ScoutSourceChunk {
  id: string;
  sourceId: string;
  artifactId: string;
  title: string;
  text: string;
  sectionPath?: string[];
  url?: string;
  mileStart?: number;
  mileEnd?: number;
  lat?: number;
  lon?: number;
  state?: string;
  topics: string[];
  citation: string;
  updatedAt?: string;
}
```

MVP search can stay lexical/BM25-style using existing `manual-core` scoring helpers. Do not introduce a vector database until lexical+structured lookup fails a concrete eval. If a larger index is needed, prefer SQLite FTS before a hosted vector service.

### 3. Host-orchestrated tool loop

Do not depend on DeepSeek/OpenCode Go supporting native function calls.

Build a `ScoutGroundingOrchestrator` in server code that runs before the model call:

1. classify the prompt;
2. select needed source lanes;
3. run deterministic tools;
4. build a compact evidence packet;
5. call the model with that evidence;
6. optionally post-check the answer for unsupported named route facts.

For models with tool support, expose the same tools through pi-agent. For DeepSeek/OpenCode Go, run the tools in host code and preload results.

OpenCode/pi-agent patterns worth copying:

- typed tools with validated parameters;
- permissions/allowlists per tool/domain/source lane;
- `beforeToolCall`-style policy gates;
- `afterToolCall`-style receipt/citation shaping;
- parallel execution for independent searches;
- sequential execution for dependent route validation;
- tool errors returned to the model as explicit evidence, not hidden logs;
- visible progress/receipts for user trust.

## Core tools

### `catalog_sources`

Purpose: show Scout what sources exist for a question.

Input:

```ts
{ query: string; topics?: string[]; state?: string; mileRange?: [number, number]; includeUnavailable?: boolean }
```

Output:

- candidate sources;
- access mode;
- trust/license notes;
- whether Scout can search/open/fetch now;
- what must be imported or verified by the user.

### `search_source`

Purpose: search within one or more selected sources.

Input:

```ts
{ query: string; sourceIds?: string[]; mileRange?: [number, number]; state?: string; limit?: number }
```

Output:

- ranked chunks;
- source/citation metadata;
- exact snippets;
- stale/license caveats.

### `open_source_chunk`

Purpose: open the exact chunk(s) behind a search hit so the model has enough context without stuffing the whole source into the prompt.

Input:

```ts
{ chunkId: string; surroundingChunks?: number }
```

Output: chunk text plus citation and neighboring context.

### `validate_at_route`

Purpose: stop Pine Grove-style route hallucinations.

Input:

```ts
{
  start: string;
  direction: 'NOBO' | 'SOBO';
  durationDays?: number;
  targetMilesPerDay?: number;
  proposedStops?: string[];
  allowApproximateOpenData?: boolean;
}
```

Output:

- resolved start landmark;
- candidate route corridor/mile range;
- each proposed stop with resolved mile or unresolved status;
- ordered distances between stops;
- conflicts, reversals, implausible jumps, or unsupported names;
- confidence tier: `verified`, `approximate-open-data`, `user-guide-required`, or `unknown`;
- required verification source before the hiker acts.

Rule: if the route validator cannot resolve a stop from an allowed source, Scout must not present it as a factual shelter/town/mileage. It can say, “I need your A.T. Guide/FarOut/AWOL excerpt to name exact overnight options.”

### `check_live_official_sources`

Evolve the existing `check_official_trail_sources` into a broader allowlisted live checker:

- ATC Trail Updates;
- NWS API;
- NPS/USFS/state park alerts where a source manifest permits it;
- direct hostel/outfitter/shuttle pages only when same-day logistics require them and the domain is allowlisted.

### `fetch_allowed_url`

A constrained curl/web-fetch tool, not arbitrary browsing.

Rules:

- allowlisted domains from source manifests only;
- short timeout;
- small max bytes;
- no authenticated/private sites;
- cache response metadata and excerpt;
- respect robots/terms where applicable;
- cite the URL and fetched timestamp;
- never bulk-copy third-party guidebook content.

## Initial license-cleared source pack

Start with sources Hogg Country can reasonably use now, then mark uncertain sources clearly.

### Bundle/index now

1. **Hogg Country field guide and reviewed corpus**
   - owned/reviewed material;
   - good for general trail ops, packing, safety routines, resupply patterns;
   - not live or exact route mileage.

2. **Private hiker workspace resources**
   - user-owned/private;
   - searchable only for that workspace;
   - never promoted to shared intel without explicit review.

3. **NPS/ATC Appalachian Trail centerline mileposts already generated in `public/at-mileposts.json`**
   - useful for approximate coordinates and route corridor;
   - cite source/attribution from the generated metadata;
   - do not overclaim exact guidebook mileages.

4. **USGS/National Hydrography-derived hydro crossings where generated**
   - useful for map/water context;
   - must distinguish mapped hydro crossings from reliable potable water.

5. **NWS point forecasts/alerts**
   - live official weather;
   - use coordinates/elevation when possible.

### Use carefully with attribution/compliance

6. **OpenStreetMap shelters/track**
   - ODbL source, useful for approximate shelter coordinates;
   - include attribution and license caveats;
   - do not present as official shelter availability or exact guidebook mileage.

### Live fetch, not bundled until terms reviewed

7. **ATC Trail Updates**
   - official closures/detours/alerts;
   - current code already fetches this;
   - cite fetched timestamp and URL.

8. **NPS/USFS/state park pages**
   - land-manager rules, alerts, permits, road/trailhead access;
   - add source manifests one domain/page pattern at a time.

9. **Hostel/shuttle/outfitter direct pages**
   - direct logistics source;
   - use for availability/hours/contact only; still recommend direct confirmation for near-term plans.

### User import only / do not bundle

10. **A.T. Guide/AWOL/FarOut**
    - excellent for exact shelters, towns, water comments, and mile-by-mile planning;
    - do not scrape or ship bundled copyrighted data;
    - allow private user-provided excerpts/screenshots/exported text if legally supplied by the hiker;
    - cite as private user-supplied guide data and keep it isolated.

## Route and mileage grounding

Build an AT route gazetteer from allowed sources:

- mileposts from `public/at-mileposts.json`;
- state mile ranges;
- public/open landmarks with coordinates and license metadata;
- OSM shelter points snapped to nearest trail mile with `approximate-open-data` confidence;
- Hogg-owned known landmarks/manual facts;
- user-imported guidebook landmarks in that user’s private workspace only.

The route validator should be deterministic:

1. Resolve place names with fuzzy matching and aliases.
2. Snap coordinates to the route milepost corridor.
3. Enforce NOBO/SOBO ordering.
4. Compute segment distances.
5. Flag unsupported or contradictory stops.
6. Produce a compact evidence packet for the model.

For Pine Grove Furnace-type prompts, Scout should produce:

- a realistic mile range northbound from Pine Grove Furnace;
- options framed by confidence;
- exact named shelter/town claims only when a source supports them;
- clear “verify in A.T. Guide/FarOut/AWOL before leaving” notes when exact guide data is missing.

## Prompt/evidence policy

Before answering trail-planning questions, Scout gets an evidence packet like:

```md
Scout evidence packet

Question type: itinerary / route / safety
Required sources: route validator, weather, closures, user/private guide if available

Sources searched:
- Hogg Country corpus: 2 chunks
- AT route gazetteer: Pine Grove Furnace corridor, approximate-open-data
- ATC Trail Updates: fetched 2026-05-04T...
- NWS: skipped; no coordinates supplied / or fetched for lat,lon

Route validation:
- Start resolved: Pine Grove Furnace SP, PA, approximate mile ...
- Direction: NOBO
- Proposed named stops: none validated yet
- Confidence: approximate-open-data
- Must verify: exact shelters/campsites/services in A.T. Guide/FarOut/AWOL or official land manager/source

Answer rules:
- cite every factual route/weather/closure claim;
- label approximations;
- do not invent shelter names, town mileage, water status, or services;
- if evidence is thin, give a safe planning framework and a verification checklist.
```

## Eval harness

Add a regression suite before trusting this with real users.

Initial golden prompt:

> I'm going hiking next week on the Appalachian Trail. Assume I'm starting at the halfway mark around Pine Grove Furnace State Park in Pennsylvania and hiking northbound for 3 days. Build me a practical plan generated from Scout: route options, daily mileage targets, camping/shelter assumptions, food and water plan, gear/supply list, safety risks, weather/fire/tick considerations, and a final checklist of what I need to verify before leaving. If you are uncertain about exact mileages or services, say so plainly and tell me what source to verify.

Minimum passing criteria:

- does not misorder Pine Grove Furnace, Boiling Springs, Darlington Shelter, or Duncannon;
- does not invent exact shelters/campsites unless source-backed;
- states uncertainty around exact guidebook mileage/services when not available;
- recommends checking A.T. Guide/FarOut/AWOL or official/direct sources for exact overnight/service details;
- uses ATC/NWS/live checks only when actually fetched;
- produces a useful conservative 3-day framework despite uncertainty.

Add machine-checkable assertions:

- named place order assertions;
- max daily mileage sanity checks;
- citation/uncertainty required strings;
- banned unsupported claims list;
- scorecard JSON for each model/provider.

## Implementation phases

### Phase 0 — planning and guardrail doc

- Add this plan.
- Keep closed-beta docs honest: Scout is not route-planning-ready until route validator/evals pass.

### Phase 1 — source catalog package

- Add `packages/scout-sources` with source manifests and chunk types.
- Move the hardcoded `SCOUT_SOURCE_CATALOG` out of `claw-agent.ts` or mirror it from the package.
- Generate a small searchable index from Hogg Country corpus, manual sections, and source manifests.
- Add unit tests for catalog selection.

### Phase 2 — route gazetteer and validator

- Add a generated AT route gazetteer from `public/at-mileposts.json` plus allowed open/owned landmark sources.
- Snap OSM shelter points to nearest approximate mile with explicit ODbL attribution/caveat.
- Add `validate_at_route` and tests.
- Add the Pine Grove golden fixture.

### Phase 3 — host-grounding orchestrator

- Add `ScoutGroundingOrchestrator` before the pi-agent call.
- For DeepSeek/OpenCode Go, run tools server-side and preload the evidence packet.
- For OpenAI/Codex, expose the same tools through pi-agent as callable tools.
- Store source receipts in the Scout message model for UI display.

### Phase 4 — live fetch connector

- Add `fetch_allowed_url` against source-manifest allowlists.
- Expand official/direct source manifests one by one.
- Add cache/freshness metadata and clear “fetched at” receipts.

### Phase 5 — UI and dogfood

- Show source receipts under Scout replies.
- Add “source confidence” badges: verified, approximate, private, needs verification.
- Re-run the Pine Grove dogfood prompt against production-like DeepSeek.
- Only call Scout route-planning-ready if it passes the eval and manual review.

## Recommendation

Do not add more chat UI until Phase 2 and Phase 3 are working. The next highest-leverage code slice is:

1. `packages/scout-sources` manifest/index scaffolding;
2. `validate_at_route` with Pine Grove regression fixture;
3. host-side evidence packet for DeepSeek/OpenCode Go.

That gives the cheap model the best shot: less freedom to invent, more structured facts, and clear tool receipts the hiker can trust.
