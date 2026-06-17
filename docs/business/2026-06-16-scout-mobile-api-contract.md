# Scout Mobile API Contract — v1

Date: 2026-06-16
Owner: Lane 4 (backend/API contracts and data bridges)
Companion: `docs/plans/2026-06-16-scout-mobile-launch-architecture.md`
Related: `docs/business/trail-assistant-mobile-api-contract.md` (auth/safety lanes),
`docs/business/trail-assistant-phone-screen-contract.md` (screen-level contracts),
`docs/trail-data-provenance.md` (data licensing rules).

This contract is the bridge for the cross-platform Scout mobile app (`mobile/`,
SvelteKit + Capacitor 7) to consume hike data from the existing two backends:

- Laravel `/api/v1` on Forge (auth, support, check-ins, SOS, safety, sync).
- SvelteKit `apps/openclaw-web/src/routes/app-api` (Scout web internal API).

This document only adds **new public/mobile surfaces and the cache/freshness
shape**. The auth, safety, and check-in surfaces are already defined in the
companion contract; do not re-define them here.

---

## Design rules

1. **Offline-first.** Every screen listed in the launch architecture (Today,
   Plan, Pack, Map, Safety, Account) must render from a cached payload. Network
   calls only enrich.
2. **Versioned envelope.** Every cached document carries `pack_version`,
   `generated_at`, and `valid_until`. Mobile uses these to decide refresh vs.
   reuse.
3. **No auth required for first-launch usefulness.** The "field pack bootstrap"
   endpoint is **public** and returns Dad's live public journey + the
   rights-safe AT context. The app must open and answer basic Scout prompts
   without any account or token.
4. **Source receipts are not polish.** Every claim derived from a third party
   carries a receipt (label, status, license, last_checked, citation_url).
   Receipts are surfaced in the UI, not hidden in logs.
5. **Copyright posture.** This contract never returns wholesale guidebook
   waypoint tables. It returns:
   - Our calibrated mile frame + open-reference derived datasets.
   - First-party Dad journey data.
   - Selected, individually-cited facts from official/public sources.
   - Live links to authoritative sources for verification.
   See `docs/trail-data-provenance.md` §2.
6. **Cache freshness, not stale safety.** Anything safety-relevant (water,
   weather, hazards, alerts) carries an explicit `fetched_at` and `valid_until`.
   The client must refuse to present stale safety data as current.
7. **Bytes budget.** A full field pack should fit comfortably under 8 MB
   compressed for the cross-state cache; per-region trail-ahead slices target
   ≤ 1 MB. Heavy assets (terrain pack, route GeoJSON) are pulled separately by
   `map-pack` and addressed by content hash.

---

## Versioning + envelope

All v1 mobile contract responses are JSON with this envelope:

```jsonc
{
  "data": { /* contract-specific payload */ },
  "meta": {
    "pack_version": 1,
    "generated_at": "2026-06-16T18:14:02.119Z",
    "valid_until": "2026-06-16T18:44:02.119Z", // soft TTL, client-suggested refresh
    "source_receipts": [SourceReceipt, ...],   // see §Source receipts
    "fallback_reason": null,                   // if data is partial/preview
    "request_id": "uuid"
  },
  "error": null
}
```

- Soft TTL only: clients must still render past `valid_until` and mark "offline".
- Bumping `pack_version` is a breaking change. Add fields, never re-purpose
  existing ones, between bumps.

---

## Endpoints — public (no auth)

All public endpoints serve `cache-control: public, max-age=60` and require no
authentication so the app is useful on first install without an account.

### 1. `GET /scout/field-pack`

Bootstrap pack for the mobile app. Composed of the same internal data the
SvelteKit `/app-api/offline-pack` route already builds, minus the gated
workspace/claw surfaces.

Response `data`:

```ts
PublicFieldPack {
  dad: DadJourneySnapshot;          // §2
  trail_ahead: TrailAheadSlice;     // §3, default radius 20 mi north of Dad
  reference_loadout: LoadoutSnapshot; // Dad's published loadout; user-specific overrides come via §8
  weather_cache: WeatherCacheIndex; // §4
  at_reference_summary: AtReferenceSummary; // §5
}
```

Implementation note: Scout web already has `loadDadPilotSummary()`,
`loadScoutAtOpenReferenceOfflineSummary()`, `buildScoutDailyBrief()`, and
`loadJourneySummary()` — this endpoint is a thin assembler over those, exposed
through the Forge Laravel proxy at `/scout/field-pack` or directly on the
SvelteKit node app. The legacy SvelteKit `/api/v1/public/scout/field-pack`
route still exists for direct Node/local use, but Forge's Laravel proxy keeps
`/api/*` on Laravel and will not forward that path to SvelteKit.

### 2. `GET /api/v1/public/scout/dad/journey`

Just the `DadJourneySnapshot`. Cheaper to poll than the full field pack.

Response is the public projection of the existing internal `JourneySummary` +
`states[]` slice (`apps/openclaw-web/src/lib/server/journey.ts`).

### 3. `GET /api/v1/public/scout/trail-ahead`

Query params:
- `from_mile` (number, required when not anchored to Dad). Falls back to Dad's
  current mile when omitted.
- `miles` (number, default 20, max 100).
- `direction` (`nobo` only for v1).

Returns `TrailAheadSlice` (§3).

### 4. `GET /api/v1/public/scout/weather-cache`

Returns the server's known weather cache index for the regions the app might
need. The body never contains a forecast itself — it points at NWS/ATC for
live fetches and reports how fresh each cached snapshot is.

Returns `WeatherCacheIndex` (§4).

### 5. `GET /api/v1/public/scout/sources`

Returns the full source manifest used by the rest of v1 (license, last_checked,
citation_url) so the app can render a "what powers this" screen offline.

Returns `SourceReceiptCatalog` (§6).

### 6. `GET /api/v1/public/scout/map-pack-manifest`

Wraps the existing `/app-api/map/pack` payload's static, license-safe parts in
a manifest the app can use to plan downloads:

```ts
MapPackManifest {
  route: { content_hash: string; url: string; bytes: number; license: string };
  milepoints: { content_hash: string; url: string; bytes: number };
  elevation: { content_hash: string; url: string; bytes: number };
  terrain_segments: { content_hash: string; url: string; bytes: number };
  waypoint_groups: {
    shelters: { content_hash; url; bytes; source_id; license };
    water:    { ... };
    roads:    { ... };
    towns:    { ... };
    summits:  { ... };
    campsites:{ ... };
    vistas:   { ... };
  };
}
```

Mobile downloads each addressed by content hash and stores under
Capacitor `Preferences` keys (or SQLite once introduced). The `map-pack`
endpoint itself stays a Scout-web internal — public clients consume via this
manifest + the referenced asset URLs, never by pulling the gated route.

---

## Endpoints — authenticated (Sanctum bearer)

All authenticated endpoints reuse `auth:sanctum` per
`backend/routes/api.php` and follow the existing trail-assistant envelope.

### 7. `GET /api/v1/scout/field-pack`

Authenticated superset of §1. Adds:

```ts
AuthenticatedFieldPack extends PublicFieldPack {
  hiker: HikerProfileSnapshot;     // current mile, days on trail, preferences
  loadout: LoadoutSnapshot;        // the *user's* loadout, not Dad's reference
  itinerary: ItineraryWindow;      // rolling 7-day plan, see §8
  recent_checkins: CheckInRecord[]; // last N (default 20) from existing /trail-assistant/checkins
}
```

`hiker.current_mile` is derived from the latest authenticated check-in (§3 of
the trail-assistant contract). When no check-ins exist the mobile app should
fall back to public Dad data.

### 8. `GET /api/v1/scout/loadout`

```ts
LoadoutSnapshot {
  pack_version: 1;
  base_weight_oz: number;
  worn_weight_oz: number;
  consumable_weight_oz: number;
  total_weight_oz: number;          // base + consumable (carried; matches lib/loadout.ts)
  item_count: number;
  items: LoadoutItem[];
  missing_essentials: string[];     // names from the essentials checklist not in items
  weather_change_recommendations: WeatherChangeHint[];
  source_receipts: SourceReceipt[]; // pack templates, essentials list, etc.
}
```

`LoadoutItem` mirrors `apps/openclaw-web/src/lib/loadout.ts:LoadoutItemInput`
plus `id` and `last_updated`.

### 9. `GET /api/v1/scout/itinerary`

Query params: `days` (default 7, max 14), `from_mile` (default derived).

```ts
ItineraryWindow {
  pack_version: 1;
  days: ItineraryDay[];             // shape from mobile/src/lib/types.ts
  confidence: 'high' | 'medium' | 'low' | 'draft';
  must_verify: string[];            // human-readable list of unsettled facts
  source_receipts: SourceReceipt[];
}
```

---

## Section §2 — DadJourneySnapshot

This is the public face of `loadDadPilotSummary()` + the public slice of
`loadJourneySummary()` from `apps/openclaw-web/src/lib/server/journey.ts`.

```ts
DadJourneySnapshot {
  current_mile: number;             // calibrated AT mile frame
  total_miles: 2197.4;
  percent_complete: number;
  miles_remaining: number;
  current_state: string | null;
  days_on_trail: number;
  pace_miles_per_day: number | null;
  start_date: '2026-03-01' | string; // HIKE_START_DATE; see provenance §4 gap
  latest_fix: {
    label: string;
    at: string | null;             // ISO; null when preview
    is_preview: boolean;           // true when no fresh Garmin fix
    trail_location: {
      mile: number;
      label: string;
      distance_off_trail_miles: number;
    } | null;
  };
  recent_dispatch: {
    title: string;
    published_at: string | null;
    trail_mile: number | null;
  } | null;
  recent_trail_update: DadTrailUpdateSummary | null;
}
```

`is_preview=true` is critical for safety messaging: when the field pack reports
a preview fix, the mobile app must not present Dad's mile as a live answer.

---

## Section §3 — TrailAheadSlice

A peak-preserving rollup of the next N miles. Mirrors the data already in
`loadTrailMapPack()` but normalised to a per-mile array the app can stride
without loading the full pack:

```ts
TrailAheadSlice {
  start_mile: number;
  end_mile: number;
  miles: TrailAheadMile[];
  upcoming_services: TrailAheadService[];  // shelters, water, roads, towns, vistas, summits
  upcoming_climbs: TrailAheadClimb[];       // steep sections per map-pack-types.ts:TrailMapSteepSection
  difficulty_summary: {
    avg_score: number;
    max_score: number;
    label: 'cruise' | 'steady' | 'hard' | 'severe';
  };
  source_receipts: SourceReceipt[];
}
```

```ts
TrailAheadMile {
  mile: number;
  elevation_ft: number;             // peak-preserved
  state: string;
  rockiness_score: number | null;
  difficulty_score: number | null;
}

TrailAheadService {
  id: string;                       // stable id from waypoint dataset
  kind: 'shelter' | 'water' | 'road' | 'town' | 'summit' | 'campsite' | 'vista';
  name: string;
  mile: number;
  distance_miles: number;           // from from_mile
  state: string;
  detail: string;
  source_id: string;                // license-tagged
  confidence: string;
}
```

`TrailAheadService.name`/`detail` are short, factual labels derived from our
open-reference dataset — never quoted from a copyrighted guidebook.

---

## Section §4 — WeatherCacheIndex

The server keeps cached NWS forecasts and ATC trail alerts. Mobile needs to
know what is cached, how fresh it is, and where to go for live data:

```ts
WeatherCacheIndex {
  regions: WeatherCacheRegion[];
  default_authoritative_source: 'nws' | 'atc';
}

WeatherCacheRegion {
  region_id: string;                // e.g. 'nc-tn-corridor'
  label: string;                    // human readable
  bounds: { min_mile: number; max_mile: number };
  forecast: {
    fetched_at: string;             // ISO
    valid_until: string;            // ISO; soft
    source: 'nws';
    point_url: string;
    forecast_url: string | null;
    summary: NwsForecastPeriodSummary[]; // shape from scout-official-sources.ts
  } | null;
  alerts: {
    fetched_at: string;
    source: 'nws';
    alerts_url: string;
    items: NwsAlertSummary[];
  };
  trail_updates: {
    fetched_at: string;
    source: 'atc';
    items: AtcTrailUpdateResult[];
  };
}
```

Mobile must surface:
- "Forecast as of X" when serving cached data.
- A "live check" affordance opening `forecast_url` / `alerts_url`.

---

## Section §5 — AtReferenceSummary

Already returned by `/app-api/offline-pack`. Re-exposed here so it's part of
the public contract.

Shape: `OfflineAtReferenceSummary` from
`apps/openclaw-web/src/lib/offline-field-pack.ts`. No change.

Adds (for mobile only): `bundled_payload_size_bytes` and `download_url` per
dataset so the app can decide what to ship vs. lazy-load.

---

## Section §6 — Source receipts

```ts
SourceReceipt {
  id: string;                        // stable id, also returned by /sources
  label: string;                     // 'AWOL 2026 anchor verification'
  kind: 'official' | 'derived' | 'first_party' | 'live' | 'community';
  status: 'verified' | 'cached' | 'stale' | 'preview' | 'unavailable';
  license: 'public' | 'cc-by' | 'odbl' | 'fair-use-facts' | 'first-party' | 'partner-licensed';
  last_checked: string;              // ISO
  citation_url: string | null;       // where the human can go check
  confidence: 'high' | 'medium' | 'low';
  notes: string | null;
}

SourceReceiptCatalog {
  pack_version: 1;
  receipts: SourceReceipt[];
  policy_links: {
    provenance: 'https://hoggcountry.com/about/data';   // future
    licensing: 'https://hoggcountry.com/about/sources'; // future
  };
}
```

Rules:
- Every Trail-Ahead, Weather, AT Reference and Itinerary payload includes
  receipts referencing entries in the catalog by `id`.
- A receipt with `status: 'preview'` or `'stale'` must be surfaced in the UI
  — never silently used as if `verified`.

---

## Section §7 — Loadout snapshot

Mirrors the shape and weight semantics in `apps/openclaw-web/src/lib/loadout.ts`
exactly. Worn items are excluded from carried weight; consumables are carried
but not base weight. The bounds in `LOADOUT_LIMITS` apply to writes (out of
scope here — see existing workspace loadout endpoints).

`missing_essentials` is computed server-side against a canonical essentials
list (to be added under `packages/scout-sources/src/essentials.ts`).

---

## Section §8 — Hiker profile + itinerary

`HikerProfileSnapshot` is the small portable shape mobile needs:

```ts
HikerProfileSnapshot {
  user_id: string;
  trail_name: string | null;
  current_mile: number | null;
  start_date: string | null;
  pace_target_miles_per_day: number | null;
  water_capacity_liters: number;
  shelter_preference: 'tent-first' | 'shelter-first' | 'mixed';
  preferences: {
    privacy_share_scope: 'private' | 'trusted' | 'public';
    privacy_location_mode: 'exact' | 'coarse';
    visibility_delay_minutes: number;
  };
}
```

`ItineraryWindow` reuses `ItineraryDay` from `mobile/src/lib/types.ts` so the
mobile types stay the source of truth for the rendering shape.

---

## Offline behaviour contract (server-side promises)

Mobile is the consumer; this contract is what mobile gets to assume:

1. The bootstrap field pack (§1) returns a complete `PublicFieldPack` in a
   single request. No follow-up calls are required to render Today, Trail
   Ahead, or Sources screens.
2. The field pack never embeds JS bundles or binary blobs. Heavy assets are
   linked from `MapPackManifest` (§6) and pulled separately.
3. Forecast, alert, and trail-update data inside the pack are *cached
   snapshots*. They carry `fetched_at` and the live source URL. The server
   must not silently fall through to a stale snapshot without updating
   `fallback_reason` in the envelope meta.
4. Authenticated endpoints degrade to public endpoints when the token is
   missing or expired. They never 401 the mobile app into an unusable state.
5. Pagination is not used in v1. All lists are explicitly bounded
   (`recent_checkins` ≤ 20, `services` ≤ 200, `miles` ≤ 100). Larger windows
   require a future `pack_version: 2`.

---

## What changes on the server

This document is a contract. Implementation lands in three small layers:

1. **Shared types**: `packages/scout-mobile-contract` (added in this PR) is
   the single source of truth for the response shapes. Both
   `apps/openclaw-web` and `mobile/` depend on it.
2. **Scout web (SvelteKit)**: public mobile bootstrap routes live on proxied
   non-`/api` paths such as
   `apps/openclaw-web/src/routes/scout/field-pack/+server.ts`, with legacy
   direct-node compatibility under
   `apps/openclaw-web/src/routes/api/v1/public/scout/*`. Forge's Laravel proxy
   excludes `/api/*`, so mobile defaults must use the proxied non-`/api` URL.
3. **Laravel**: no new domain logic. Sanctum-gated routes proxy to the
   SvelteKit node app under `/api/v1/scout/*` (the SvelteKit node app is
   already proxied — see `docs/runbooks/netlify-to-forge-cutover-checklist.md`).
   Existing trail-assistant routes are unchanged.

No new copyright surface is introduced. The endpoints listed above either
re-shape existing internal data (`/app-api/offline-pack`, `loadDadPilotSummary`,
`loadTrailMapPack`) or expose first-party data (`/sources`, `/dad/journey`).

---

## Acceptance — Lane 4

- Shared contract types compile and round-trip through the validator
  helper (covered by `scripts/scout-mobile-contract.test.mjs`).
- Doc references actual modules and functions that exist today
  (`loadDadPilotSummary`, `loadTrailMapPack`, `OfflineFieldPack`, `loadout.ts`).
- No new endpoint listed here returns wholesale guidebook waypoint tables,
  per `docs/trail-data-provenance.md` §2.
- `git diff --check` clean on changed files.
