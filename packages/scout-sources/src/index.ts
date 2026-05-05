export type ScoutSourceLane =
  | 'hogg-owned'
  | 'official-public'
  | 'open-data'
  | 'live-official'
  | 'direct-live'
  | 'user-private'
  | 'third-party-review-needed';

export type ScoutSourceManifestTrust = 'owned' | 'official' | 'reviewed' | 'open-crowd' | 'private' | 'unknown';
export type ScoutSourceAccessMode =
  | 'bundled-index'
  | 'workspace-private'
  | 'live-fetch'
  | 'user-import-required'
  | 'disabled-pending-review'
  | 'route-validator';

export type ScoutSourceAction = 'catalog' | 'search' | 'open' | 'route-validate' | 'live-fetch';
export type ScoutSourceUpdateCadence = 'static' | 'daily' | 'weekly' | 'manual' | 'live';

export interface ScoutSourceLicense {
  readonly label: string;
  readonly termsUrl?: string;
  readonly attributionRequired: boolean;
  readonly redistributionAllowed: boolean | 'unknown';
  readonly notes: string;
}

export interface ScoutSourceFreshness {
  readonly generatedAt?: string;
  readonly updateCadence: ScoutSourceUpdateCadence;
  readonly staleAfterDays?: number;
}

export interface ScoutSourceCoverage {
  readonly trail?: 'AT';
  readonly states?: readonly string[];
  readonly mileStart?: number;
  readonly mileEnd?: number;
  readonly bbox?: readonly [number, number, number, number];
  readonly topics: readonly string[];
}

export interface ScoutSourceManifest {
  readonly id: string;
  readonly title: string;
  readonly displayCategory: string;
  readonly lane: ScoutSourceLane;
  readonly trust: ScoutSourceManifestTrust;
  readonly accessMode: ScoutSourceAccessMode;
  readonly privacy: string;
  readonly useWhen: string;
  readonly license: ScoutSourceLicense;
  readonly freshness: ScoutSourceFreshness;
  readonly coverage: ScoutSourceCoverage;
  readonly citationTemplate: string;
  readonly allowedActions: readonly ScoutSourceAction[];
  readonly caveats: readonly string[];
  readonly keywords: readonly string[];
}

export interface ScoutSourceChunk {
  readonly id: string;
  readonly sourceId: string;
  readonly artifactId: string;
  readonly title: string;
  readonly text: string;
  readonly sectionPath?: readonly string[];
  readonly url?: string;
  readonly mileStart?: number;
  readonly mileEnd?: number;
  readonly lat?: number;
  readonly lon?: number;
  readonly state?: string;
  readonly topics: readonly string[];
  readonly citation: string;
  readonly updatedAt?: string;
}

export type ScoutSourceTrust = 'private' | 'reviewed' | 'official' | 'crowd' | 'direct' | 'pilot';
export type ScoutSourceAccess = 'searchable-now' | 'user-import' | 'external-check' | 'future-integration';

export interface ScoutSourceCatalogEntry {
  readonly id: string;
  readonly label: string;
  readonly category: string;
  readonly trust: ScoutSourceTrust;
  readonly access: ScoutSourceAccess;
  readonly privacy: string;
  readonly useWhen: string;
  readonly caveat: string;
  readonly keywords: readonly string[];
}

export interface ScoutSourceCatalogQuery {
  readonly query: string;
  readonly topics?: readonly string[];
  readonly state?: string | null;
  readonly mileRange?: readonly [number, number] | null;
  readonly includeUnavailable?: boolean;
  readonly limit?: number;
}

export interface ScoutSourceReceipt {
  readonly sourceId: string;
  readonly title: string;
  readonly trust: ScoutSourceManifestTrust;
  readonly accessMode: ScoutSourceAccessMode;
  readonly actions: readonly ScoutSourceAction[];
  readonly citation: string;
  readonly caveats: readonly string[];
  readonly fetchedAt?: string;
}

const STANDARD_PRIVATE_LICENSE: ScoutSourceLicense = {
  label: 'Private user-supplied workspace material',
  attributionRequired: false,
  redistributionAllowed: false,
  notes: 'Use only inside the owning hiker workspace unless the user explicitly chooses otherwise.'
};

const HOGG_OWNED_LICENSE: ScoutSourceLicense = {
  label: 'Hogg Country owned/reviewed material',
  attributionRequired: false,
  redistributionAllowed: true,
  notes: 'Owned or reviewed Hogg Country material suitable for general Scout grounding.'
};

const OFFICIAL_PUBLIC_LICENSE: ScoutSourceLicense = {
  label: 'Official public source',
  attributionRequired: true,
  redistributionAllowed: 'unknown',
  notes: 'Fetch or cite the official page/API for the turn; do not imply a live check unless fetched.'
};

export const SCOUT_SOURCE_MANIFESTS: readonly ScoutSourceManifest[] = [
  {
    id: 'private-workspace',
    title: 'Private workspace: profile, manual notes, saved Scout docs, imported docs, tools',
    displayCategory: 'private workspace',
    lane: 'user-private',
    trust: 'private',
    accessMode: 'workspace-private',
    privacy: 'Private to the hiker by default.',
    useWhen: 'Personal constraints, current plan, gear/loadout, health notes, budget, pace, town style, living plans, and anything the hiker has imported or saved.',
    license: STANDARD_PRIVATE_LICENSE,
    freshness: { updateCadence: 'manual' },
    coverage: { topics: ['profile', 'manual', 'notes', 'gear', 'health', 'budget', 'pace', 'plan', 'docs', 'checklist'] },
    citationTemplate: 'Private workspace artifact: {title}',
    allowedActions: ['catalog', 'search', 'open'],
    caveats: ['Treat as authoritative for the hiker, but still ask when details are stale or missing.'],
    keywords: ['profile', 'manual', 'notes', 'gear', 'loadout', 'health', 'budget', 'pace', 'plan', 'docs', 'checklist', 'private']
  },
  {
    id: 'hogg-country-corpus',
    title: 'Hogg Country field guide and reviewed public corpus',
    displayCategory: 'reviewed guide corpus',
    lane: 'hogg-owned',
    trust: 'reviewed',
    accessMode: 'bundled-index',
    privacy: 'Shared public/reviewed Hogg Country material.',
    useWhen: 'General AT operating guidance: gear, shelter-vs-tent, routines, resupply norms, zero days, trail culture, and known guide addenda.',
    license: HOGG_OWNED_LICENSE,
    freshness: { updateCadence: 'manual' },
    coverage: { trail: 'AT', topics: ['guide', 'gear', 'shelter', 'routine', 'resupply', 'zero', 'water', 'detour'] },
    citationTemplate: 'Hogg Country reviewed corpus: {title}',
    allowedActions: ['catalog', 'search', 'open'],
    caveats: ['Good baseline guidance, not a replacement for live closures, weather, or user-owned guidebook details.'],
    keywords: ['guide', 'field guide', 'gear', 'shelter', 'tent', 'routine', 'resupply', 'zero', 'water', 'detour', 'helene']
  },
  {
    id: 'dad-public-pilot',
    title: 'Dad public pilot signals: Trail Updates, Garmin fix, YouTube dispatches',
    displayCategory: 'public hiker signals',
    lane: 'direct-live',
    trust: 'reviewed',
    accessMode: 'bundled-index',
    privacy: 'Only public Dad pilot context; do not infer private certainty.',
    useWhen: 'Testing Scout on a real hike, current public location/update context, and trail-story-to-planning loops.',
    license: HOGG_OWNED_LICENSE,
    freshness: { updateCadence: 'daily', staleAfterDays: 7 },
    coverage: { trail: 'AT', topics: ['dad', 'garmin', 'public pilot', 'trail update', 'youtube', 'dispatch', 'story'] },
    citationTemplate: 'Dad public pilot signal: {title}',
    allowedActions: ['catalog', 'search', 'open'],
    caveats: ['Garmin can lag or be preview/fallback. Trail Updates are usually the freshest narrative signal.'],
    keywords: ['dad', 'garmin', 'public pilot', 'trail update', 'youtube', 'dispatch', 'story']
  },
  {
    id: 'at-guide-user-owned',
    title: 'A.T. Guide / AWOL data imported by the hiker',
    displayCategory: 'licensed/user-owned guide data',
    lane: 'user-private',
    trust: 'reviewed',
    accessMode: 'user-import-required',
    privacy: 'Private if the hiker imports their legally owned copy.',
    useWhen: 'Mile-by-mile planning, elevation, shelters, campsites, trail towns, road crossings, and resupply structure.',
    license: {
      label: 'User-owned third-party guide data',
      termsUrl: 'https://www.theatguide.com/',
      attributionRequired: true,
      redistributionAllowed: false,
      notes: 'Do not scrape or bundle copyrighted guide content. Use only user-supplied excerpts inside that user workspace.'
    },
    freshness: { updateCadence: 'manual' },
    coverage: { trail: 'AT', topics: ['guidebook', 'mileage', 'elevation', 'shelter', 'campsite', 'town', 'road crossing'] },
    citationTemplate: 'Private user-owned A.T. Guide/AWOL excerpt: {title}',
    allowedActions: ['catalog', 'search', 'open'],
    caveats: ['Do not scrape or bundle copyrighted guide content; ask the hiker to import/search what they own.'],
    keywords: ['awol', 'a.t. guide', 'guidebook', 'mileage', 'elevation', 'shelter', 'campsite', 'town', 'road crossing']
  },
  {
    id: 'farout-current-comments',
    title: 'FarOut recent comments/screenshots supplied by the hiker',
    displayCategory: 'current crowd intel',
    lane: 'user-private',
    trust: 'open-crowd',
    accessMode: 'user-import-required',
    privacy: 'Private if entered/imported by the hiker.',
    useWhen: 'Recent water reliability, shelter conditions, blowdowns, reroutes, campsite crowding, and trail-surface reports.',
    license: {
      label: 'User-supplied third-party/crowd comments',
      attributionRequired: true,
      redistributionAllowed: false,
      notes: 'Do not bulk-copy or share third-party app content. Use only hiker-supplied snippets for that hiker.'
    },
    freshness: { updateCadence: 'manual', staleAfterDays: 14 },
    coverage: { trail: 'AT', topics: ['farout', 'comments', 'water', 'closure', 'reroute', 'shelter', 'conditions'] },
    citationTemplate: 'Private user-supplied FarOut/current comment: {title}',
    allowedActions: ['catalog', 'search', 'open'],
    caveats: ['Crowd reports can be stale or wrong; prefer recent dated comments and cross-check risky claims.'],
    keywords: ['farout', 'comment', 'water', 'source', 'dry', 'closure', 'reroute', 'blowdown', 'shelter', 'condition']
  },
  {
    id: 'hoggcountry-pine-grove-route-qa-2026-05-04',
    title: 'Hogg Country Pine Grove route-order QA validator',
    displayCategory: 'deterministic route validator',
    lane: 'hogg-owned',
    trust: 'reviewed',
    accessMode: 'route-validator',
    privacy: 'Shared internal QA fixture; no private user data.',
    useWhen: 'Pine Grove Furnace / AT halfway northbound planning, route order checks, known misorder prevention, and exact-claim blocking.',
    license: HOGG_OWNED_LICENSE,
    freshness: { generatedAt: '2026-05-04', updateCadence: 'manual' },
    coverage: {
      trail: 'AT',
      states: ['PA'],
      mileStart: 1105.9,
      mileEnd: 1150.8,
      topics: ['route validator', 'pine grove furnace', 'halfway', 'boiling springs', 'darlington', 'duncannon', 'mileage']
    },
    citationTemplate: 'Hogg Country Pine Grove route-order QA fixture, generated 2026-05-04.',
    allowedActions: ['catalog', 'route-validate'],
    caveats: ['Use as a guardrail for route order and impossible legs; exact camping, water, service, and guidebook facts still require current verification.'],
    keywords: ['pine grove furnace', 'halfway', 'nobo', 'northbound', 'boiling springs', 'darlington', 'duncannon', 'james fry', 'alec kennedy', 'mileage', 'itinerary']
  },
  {
    id: 'atc-trail-updates',
    title: 'Appalachian Trail Conservancy official trail updates',
    displayCategory: 'official closures and detours',
    lane: 'live-official',
    trust: 'official',
    accessMode: 'live-fetch',
    privacy: 'Public official source.',
    useWhen: 'Closures, official detours, ferry/bridge status, fire restrictions, and land-manager notices.',
    license: OFFICIAL_PUBLIC_LICENSE,
    freshness: { updateCadence: 'live', staleAfterDays: 1 },
    coverage: { trail: 'AT', topics: ['atc', 'closure', 'detour', 'bridge', 'ferry', 'restriction', 'reroute', 'official'] },
    citationTemplate: 'ATC Trail Updates, fetched {fetchedAt}: {url}',
    allowedActions: ['catalog', 'live-fetch'],
    caveats: ['Scout cannot claim a live check unless this source is fetched or imported for the turn.'],
    keywords: ['atc', 'closure', 'detour', 'bridge', 'ferry', 'restriction', 'reroute', 'official', 'helene']
  },
  {
    id: 'nws-weather',
    title: 'National Weather Service point forecast, alerts, and forecast discussions',
    displayCategory: 'official weather',
    lane: 'live-official',
    trust: 'official',
    accessMode: 'live-fetch',
    privacy: 'Public official source.',
    useWhen: 'Weather decisions: thunderstorms, cold exposure, heat risk, wind, flood risk, snow/ice, and exposed-ridge timing.',
    license: OFFICIAL_PUBLIC_LICENSE,
    freshness: { updateCadence: 'live', staleAfterDays: 1 },
    coverage: { topics: ['weather', 'storm', 'rain', 'snow', 'ice', 'wind', 'heat', 'cold', 'flood', 'forecast', 'alert'] },
    citationTemplate: 'National Weather Service point forecast/alerts, fetched {fetchedAt}: {url}',
    allowedActions: ['catalog', 'live-fetch'],
    caveats: ['Use exact location/elevation when possible; do not substitute broad town weather for ridge conditions without saying so.'],
    keywords: ['weather', 'storm', 'rain', 'snow', 'ice', 'wind', 'heat', 'cold', 'flood', 'forecast', 'alert', 'nws', 'noaa']
  },
  {
    id: 'land-manager-pages',
    title: 'Official land-manager pages: NPS, USFS, state parks, AMC where applicable',
    displayCategory: 'official land management',
    lane: 'live-official',
    trust: 'official',
    accessMode: 'live-fetch',
    privacy: 'Public official source.',
    useWhen: 'Park-specific closures, permits, camping rules, fire restrictions, shelter/campsite rules, and road/trailhead access.',
    license: OFFICIAL_PUBLIC_LICENSE,
    freshness: { updateCadence: 'live', staleAfterDays: 7 },
    coverage: { trail: 'AT', topics: ['permit', 'camping', 'park', 'forest', 'nps', 'usfs', 'state park', 'fire', 'road', 'trailhead', 'closure'] },
    citationTemplate: 'Official land-manager page, fetched {fetchedAt}: {url}',
    allowedActions: ['catalog', 'live-fetch'],
    caveats: ['Jurisdiction changes along the AT; identify the responsible manager before treating a rule as universal.'],
    keywords: ['permit', 'camping', 'park', 'forest', 'nps', 'usfs', 'state park', 'fire', 'road', 'trailhead', 'closure']
  },
  {
    id: 'hostel-shuttle-direct',
    title: 'Direct hostel, outfitter, shuttle, and town-service pages or phone-confirmed notes',
    displayCategory: 'direct town services',
    lane: 'direct-live',
    trust: 'unknown',
    accessMode: 'live-fetch',
    privacy: 'Public or hiker-entered private notes depending on source.',
    useWhen: 'Availability, hours, laundry/showers, shuttle logistics, resupply timing, mail drops, and reservation-sensitive plans.',
    license: {
      label: 'Direct public service pages or hiker notes',
      attributionRequired: true,
      redistributionAllowed: 'unknown',
      notes: 'Use short cited excerpts only and recommend direct confirmation for time-sensitive logistics.'
    },
    freshness: { updateCadence: 'live', staleAfterDays: 2 },
    coverage: { trail: 'AT', topics: ['hostel', 'shuttle', 'outfitter', 'laundry', 'resupply', 'reservation', 'mail drop', 'town', 'hours'] },
    citationTemplate: 'Direct service page/note, fetched or supplied {fetchedAt}: {url}',
    allowedActions: ['catalog', 'live-fetch'],
    caveats: ['Availability changes fast. For same-day or next-day logistics, recommend direct confirmation.'],
    keywords: ['hostel', 'shuttle', 'outfitter', 'laundry', 'resupply', 'reservation', 'mail drop', 'town', 'hours']
  },
  {
    id: 'hiker-owned-social-profile',
    title: 'Hiker-owned profile, journal, trail updates, location history, gear/loadout, and shared guides',
    displayCategory: 'private-first hiker hub',
    lane: 'user-private',
    trust: 'private',
    accessMode: 'disabled-pending-review',
    privacy: 'Default private; the hiker chooses per artifact whether family/friends/link/public sharing is allowed.',
    useWhen: 'Longitudinal Scout memory, family-facing updates, personal journal grounding, gear evolution, location-aware planning, and opt-in shared learning.',
    license: STANDARD_PRIVATE_LICENSE,
    freshness: { updateCadence: 'manual' },
    coverage: { topics: ['profile', 'journal', 'family', 'friends', 'location', 'gear', 'loadout', 'share', 'social', 'updates'] },
    citationTemplate: 'Private hiker hub artifact: {title}',
    allowedActions: ['catalog'],
    caveats: ['Keep “use this to help me” separate from “share this publicly” and “promote into shared trail intel.”'],
    keywords: ['profile', 'journal', 'family', 'friends', 'location', 'gear', 'loadout', 'share', 'social', 'updates']
  }
] as const;

function legacyTrust(manifest: ScoutSourceManifest): ScoutSourceTrust {
  if (manifest.id === 'dad-public-pilot') return 'pilot';
  if (manifest.id === 'hostel-shuttle-direct') return 'direct';
  if (manifest.trust === 'private') return 'private';
  if (manifest.trust === 'official') return 'official';
  if (manifest.trust === 'open-crowd') return 'crowd';
  return 'reviewed';
}

function legacyAccess(manifest: ScoutSourceManifest): ScoutSourceAccess {
  if (manifest.accessMode === 'workspace-private' || manifest.accessMode === 'bundled-index') return 'searchable-now';
  if (manifest.accessMode === 'user-import-required') return 'user-import';
  if (manifest.accessMode === 'live-fetch' || manifest.accessMode === 'route-validator') return 'external-check';
  return 'future-integration';
}

export function toScoutSourceCatalogEntry(manifest: ScoutSourceManifest): ScoutSourceCatalogEntry {
  return {
    id: manifest.id,
    label: manifest.title,
    category: manifest.displayCategory,
    trust: legacyTrust(manifest),
    access: legacyAccess(manifest),
    privacy: manifest.privacy,
    useWhen: manifest.useWhen,
    caveat: manifest.caveats.join(' '),
    keywords: manifest.keywords
  };
}

export const SCOUT_SOURCE_CATALOG: readonly ScoutSourceCatalogEntry[] = SCOUT_SOURCE_MANIFESTS.map(toScoutSourceCatalogEntry);

export function getScoutSourceManifest(sourceId: string): ScoutSourceManifest | null {
  return SCOUT_SOURCE_MANIFESTS.find((manifest) => manifest.id === sourceId) ?? null;
}

function normalizeText(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9.\s-]/gu, ' ').replace(/\s+/gu, ' ').trim();
}

function queryTerms(query: string, topics: readonly string[] = []): string[] {
  const terms = [...query.split(/\s+/u), ...topics]
    .map((term) => normalizeText(term))
    .flatMap((term) => term.split(/\s+/u))
    .filter((term) => term.length >= 3);
  return [...new Set(terms)];
}

function manifestCoversState(manifest: ScoutSourceManifest, state: string | null | undefined): boolean {
  if (!state) return true;
  const states = manifest.coverage.states;
  return !states || states.includes(state.toUpperCase());
}

function manifestCoversMileRange(manifest: ScoutSourceManifest, mileRange: readonly [number, number] | null | undefined): boolean {
  if (!mileRange || manifest.coverage.mileStart === undefined || manifest.coverage.mileEnd === undefined) return true;
  const [start, end] = mileRange[0] <= mileRange[1] ? mileRange : [mileRange[1], mileRange[0]];
  return manifest.coverage.mileEnd >= start && manifest.coverage.mileStart <= end;
}

export function scoreScoutSourceManifest(manifest: ScoutSourceManifest, query: ScoutSourceCatalogQuery): number {
  const terms = queryTerms(query.query, query.topics ?? []);
  const haystack = normalizeText([
    manifest.id,
    manifest.title,
    manifest.displayCategory,
    manifest.useWhen,
    manifest.privacy,
    ...manifest.coverage.topics,
    ...manifest.keywords,
    ...manifest.caveats
  ].join(' '));

  let score = 0;
  for (const term of terms) {
    if (haystack.includes(term)) score += manifest.keywords.includes(term) ? 4 : 2;
  }

  if (!manifestCoversState(manifest, query.state)) score -= 4;
  if (!manifestCoversMileRange(manifest, query.mileRange)) score -= 4;
  if (manifest.accessMode === 'disabled-pending-review' && !query.includeUnavailable) score -= 8;
  if (manifest.trust === 'official' && /\b(weather|closure|detour|fire|alert|official)\b/iu.test(query.query)) score += 3;
  if (manifest.accessMode === 'route-validator' && /\b(route|itinerary|mileage|mile|nobo|sobo|northbound|southbound|pine grove|halfway|shelter|camp)\b/iu.test(query.query)) score += 5;
  if (manifest.accessMode === 'user-import-required' && /\b(exact|guide|shelter|water|service|farout|awol|a\.t\. guide)\b/iu.test(query.query)) score += 3;

  return score;
}

export function selectScoutSourceManifests(query: ScoutSourceCatalogQuery): ScoutSourceManifest[] {
  const limit = Math.max(1, Math.min(query.limit ?? 6, 20));
  return [...SCOUT_SOURCE_MANIFESTS]
    .filter((manifest) => query.includeUnavailable || manifest.accessMode !== 'disabled-pending-review')
    .map((manifest) => ({ manifest, score: scoreScoutSourceManifest(manifest, query) }))
    .filter((entry) => entry.score > 0 || query.includeUnavailable)
    .sort((left, right) => right.score - left.score || left.manifest.title.localeCompare(right.manifest.title))
    .slice(0, limit)
    .map((entry) => entry.manifest);
}

export function buildScoutSourceReceipt(sourceId: string, options: { readonly fetchedAt?: string; readonly url?: string } = {}): ScoutSourceReceipt | null {
  const manifest = getScoutSourceManifest(sourceId);
  if (!manifest) return null;
  return {
    sourceId: manifest.id,
    title: manifest.title,
    trust: manifest.trust,
    accessMode: manifest.accessMode,
    actions: manifest.allowedActions,
    citation: manifest.citationTemplate
      .replace('{fetchedAt}', options.fetchedAt ?? 'not fetched')
      .replace('{url}', options.url ?? 'source URL not recorded')
      .replace('{title}', manifest.title),
    caveats: manifest.caveats,
    fetchedAt: options.fetchedAt
  };
}
