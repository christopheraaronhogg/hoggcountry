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
    id: 'hoggcountry-gsmnp-at-corridor-qa-2026-05-05',
    title: 'Hogg Country GSMNP AT corridor and permit-rule QA validator',
    displayCategory: 'deterministic route/regulation validator',
    lane: 'hogg-owned',
    trust: 'reviewed',
    accessMode: 'route-validator',
    privacy: 'Shared internal QA fixture; no private user data.',
    useWhen: 'Fontana Dam to Newfound Gap / Great Smoky Mountains National Park AT section planning, route order checks, permit/camping rule guardrails, and unsafe shelter/tenting wording prevention.',
    license: HOGG_OWNED_LICENSE,
    freshness: { generatedAt: '2026-05-05', updateCadence: 'manual' },
    coverage: {
      trail: 'AT',
      states: ['NC', 'TN'],
      mileStart: 166.1,
      mileEnd: 208.1,
      topics: ['route validator', 'gsmnp', 'smokies', 'fontana dam', 'newfound gap', 'permits', 'shelters', 'camping', 'mileage']
    },
    citationTemplate: 'Hogg Country GSMNP AT corridor and permit-rule QA fixture, generated 2026-05-05 from dogfood QA and official NPS/Recreation.gov rule checks.',
    allowedActions: ['catalog', 'route-validate'],
    caveats: ['Use as a guardrail for route order and official-rule wording; exact shelter availability, water, closures, and current mileages still require current NPS/Recreation.gov/user-owned guide verification.'],
    keywords: ['gsmnp', 'smokies', 'great smoky mountains', 'fontana', 'fontana dam', 'newfound gap', 'mollies ridge', 'derrick knob', 'silers bald', 'mount collins', 'permit', 'reservation', 'shelter', 'camping', 'nobo', 'itinerary']
  },
  {
    id: 'hoggcountry-shenandoah-at-corridor-qa-2026-05-05',
    title: 'Hogg Country Shenandoah AT south/central corridor and regulation QA validator',
    displayCategory: 'deterministic route/regulation validator',
    lane: 'hogg-owned',
    trust: 'reviewed',
    accessMode: 'route-validator',
    privacy: 'Shared internal QA fixture; no private user data.',
    useWhen: 'Rockfish Gap to Swift Run Gap / Shenandoah National Park AT south/central section planning, route order checks, Recreation.gov permit/camping rule guardrails, water caution, and stale self-registration guidance prevention.',
    license: HOGG_OWNED_LICENSE,
    freshness: { generatedAt: '2026-05-05', updateCadence: 'manual' },
    coverage: {
      trail: 'AT',
      states: ['VA'],
      mileStart: 863.7,
      mileEnd: 909.6,
      topics: ['route validator', 'shenandoah', 'snp', 'rockfish gap', 'swift run gap', 'permits', 'recreation.gov', 'camping', 'setbacks', 'water', 'mileage']
    },
    citationTemplate: 'Hogg Country Shenandoah AT south/central corridor and regulation QA fixture, generated 2026-05-05 from dogfood QA and official NPS/Recreation.gov rule checks.',
    allowedActions: ['catalog', 'route-validate'],
    caveats: ['Use as a guardrail for route order and official-rule wording; exact campsite legality, hut use, water, closures, permit availability, and current mileages still require current NPS/Recreation.gov/user-owned guide verification.'],
    keywords: ['shenandoah', 'snp', 'rockfish gap', 'swift run gap', 'calf mountain', 'blackrock hut', 'pinefield hut', 'hightop hut', 'big meadows', 'byrds nest', 'permit', 'recreation.gov', 'camping', 'setbacks', 'water', 'nobo', 'itinerary']
  },
  {
    id: 'hoggcountry-100-mile-wilderness-qa-2026-05-06',
    title: 'Hogg Country 100-Mile Wilderness Monson to Abol Bridge corridor and logistics QA validator',
    displayCategory: 'deterministic route/logistics validator',
    lane: 'hogg-owned',
    trust: 'reviewed',
    accessMode: 'route-validator',
    privacy: 'Shared internal QA fixture; no private user data.',
    useWhen: 'Monson to Abol Bridge / 100-Mile Wilderness AT section planning, route order checks, food carry and food-drop assumptions, logging-road bailout/shuttle assumptions, water treatment, ford/rain delay guardrails, campsite/lean-to verification, and Baxter handoff warnings.',
    license: HOGG_OWNED_LICENSE,
    freshness: { generatedAt: '2026-05-06', updateCadence: 'manual' },
    coverage: {
      trail: 'AT',
      states: ['ME'],
      mileStart: 2078.1,
      mileEnd: 2177.7,
      topics: ['route validator', '100-mile wilderness', 'hundred mile wilderness', 'monson', 'abol bridge', 'food carry', 'food drops', 'bailouts', 'fords', 'water', 'campsites', 'shelters', 'mileage']
    },
    citationTemplate: 'Hogg Country 100-Mile Wilderness Monson ↔ Abol Bridge route/logistics QA fixture, generated 2026-05-06 from dogfood QA plus MATC/ATC/AMC/local logistics source checks.',
    allowedActions: ['catalog', 'route-validate'],
    caveats: ['Use as a guardrail for route order and fail-closed logistics wording; exact mileages, legal lean-tos/campsites, water, ford safety, food drops, logging-road access, closures, and shuttles still require current MATC/AMC/A.T. Guide/FarOut/local-provider verification.'],
    keywords: ['100 mile wilderness', '100-mile wilderness', 'hundred mile wilderness', 'monson', 'abol bridge', 'wilson valley', 'long pond stream', 'chairback', 'chairback gap', 'carl newhall', 'logan brook', 'white cap', 'east branch', 'cooper brook falls', 'antlers', 'jo-mary', 'jo mary', 'wadleigh', 'rainbow stream', 'food carry', 'food drop', 'resupply', 'bailout', 'logging road', 'ford', 'fords', 'water', 'nobo', 'sobo', 'itinerary']
  },
  {
    id: 'hoggcountry-baxter-katahdin-at-corridor-qa-2026-05-05',
    title: 'Hogg Country Baxter/Katahdin AT finish corridor and regulation QA validator',
    displayCategory: 'deterministic route/regulation validator',
    lane: 'hogg-owned',
    trust: 'reviewed',
    accessMode: 'route-validator',
    privacy: 'Shared internal QA fixture; no private user data.',
    useWhen: 'Abol Bridge, Katahdin Stream Campground, The Birches, Baxter Peak/Katahdin, 100-Mile Wilderness finish, SOBO Katahdin start, route order checks, Long-Distance Hiker Permit guardrails, The Birches eligibility, day-use/KTP access, summit timing, water, and weather/closure fail-closed wording.',
    license: HOGG_OWNED_LICENSE,
    freshness: { generatedAt: '2026-05-05', updateCadence: 'manual' },
    coverage: {
      trail: 'AT',
      states: ['ME'],
      mileStart: 2177.7,
      mileEnd: 2197.7,
      topics: ['route validator', 'baxter', 'katahdin', 'abol bridge', 'katahdin stream', 'the birches', 'permits', 'camping', 'closures', 'weather', 'water', 'mileage']
    },
    citationTemplate: 'Hogg Country Baxter/Katahdin AT finish corridor and regulation QA fixture, generated 2026-05-05 from Hogg Country guide data plus official Baxter State Park AT/hiking/camping pages and ATC permit checks.',
    allowedActions: ['catalog', 'route-validate'],
    caveats: ['Use as a guardrail for route order and official-rule wording; exact mileages, The Birches/campsite availability, Long-Distance Hiker Permit status, trail closures, water, weather, and road/parking access still require current Baxter State Park/user-owned guide verification.'],
    keywords: ['baxter', 'katahdin', 'baxter peak', 'mount katahdin', 'mt katahdin', 'abol bridge', 'katahdin stream', 'hurd brook', 'rainbow spring', 'the birches', 'birches', 'monson', '100 mile wilderness', 'hundred mile wilderness', 'long distance hiker permit', 'ld permit', 'ktp', 'katahdin trailhead pass', 'parking', 'camping', 'closure', 'weather', 'water', 'nobo', 'sobo', 'itinerary']
  },
  {
    id: 'hoggcountry-whites-franconia-crawford-qa-2026-05-06',
    title: 'Hogg Country White Mountains Franconia Notch to Crawford Notch corridor and regulation QA validator',
    displayCategory: 'deterministic route/regulation validator',
    lane: 'hogg-owned',
    trust: 'reviewed',
    accessMode: 'route-validator',
    privacy: 'Shared internal QA fixture; no private user data.',
    useWhen: 'Franconia Notch / I-93 to Crawford Notch / US 302 White Mountains AT section planning, route order checks, AMC hut/tentsite assumptions, WMNF/NH State Parks camping guardrails, exposed-ridge weather/lightning, water, bailouts, and shuttle logistics.',
    license: HOGG_OWNED_LICENSE,
    freshness: { generatedAt: '2026-05-06', updateCadence: 'manual' },
    coverage: {
      trail: 'AT',
      states: ['NH'],
      mileStart: 1825.1,
      mileEnd: 1863.9,
      topics: ['route validator', 'white mountains', 'whites', 'franconia notch', 'crawford notch', 'amc', 'wmnf', 'huts', 'tentsites', 'camping', 'weather', 'water', 'mileage']
    },
    citationTemplate: 'Hogg Country White Mountains Franconia Notch ↔ Crawford Notch route/regulation QA fixture, generated 2026-05-06 from dogfood QA and official WMNF/AMC/ATC/NH State Parks rule checks.',
    allowedActions: ['catalog', 'route-validate'],
    caveats: ['Use as a guardrail for route order and official-rule wording; exact mileages, hut/tentsite availability, fees, water, weather, road access, parking, and shuttle logistics still require current AMC/WMNF/NH State Parks/user-owned guide verification.'],
    keywords: ['white mountains', 'whites', 'franconia', 'franconia notch', 'crawford', 'crawford notch', 'i-93', 'us 302', 'liberty spring', 'garfield ridge', 'galehead', 'zealand', 'ethan pond', 'amc', 'wmnf', 'hut', 'huts', 'tentsite', 'camping', 'above treeline', 'alpine', 'weather', 'lightning', 'water', 'nobo', 'sobo', 'itinerary']
  },
  {
    id: 'white-mountain-national-forest-amc-rules',
    title: 'White Mountain National Forest, AMC, ATC, and NH State Parks camping/hut/weather rules',
    displayCategory: 'official/regional land-manager and hut rules',
    lane: 'official-public',
    trust: 'official',
    accessMode: 'live-fetch',
    privacy: 'Public official/regional source.',
    useWhen: 'White Mountains / WMNF / AMC hut and tentsite planning, alpine-zone and Forest Protection Area camping restrictions, Franconia/Crawford Notch state-park camping, hut reservations, work-for-stay uncertainty, water, weather, fires, parking, and road/trailhead access.',
    license: OFFICIAL_PUBLIC_LICENSE,
    freshness: { updateCadence: 'live', staleAfterDays: 7 },
    coverage: { trail: 'AT', states: ['NH'], topics: ['white mountains', 'wmnf', 'amc', 'nh state parks', 'camping', 'huts', 'tentsites', 'alpine', 'weather', 'water', 'parking'] },
    citationTemplate: 'WMNF/AMC/ATC/NH State Parks White Mountains camping, huts, and weather/access pages; live conditions/rules must be checked before leaving. Scout fetched timestamp: {fetchedAt}. https://www.fs.usda.gov/r09/whitemountain https://www.outdoors.org/ https://appalachiantrail.org/ https://www.nhstateparks.org/',
    allowedActions: ['catalog', 'live-fetch'],
    caveats: ['Rules, hut/tentsite availability, caretaker season, fees, water, weather, road access, and parking change; Scout should fail closed and tell the hiker to verify exact AMC/WMNF/NH State Parks conditions before leaving.'],
    keywords: ['white mountains', 'whites', 'wmnf', 'white mountain national forest', 'amc', 'appalachian mountain club', 'nh state parks', 'franconia notch', 'crawford notch', 'hut', 'huts', 'tentsite', 'camping', 'above treeline', 'alpine zone', 'forest protection area', 'work for stay', 'water', 'weather', 'parking', 'shuttle']
  },
  {
    id: 'hundred-mile-wilderness-matc-atc-logistics',
    title: '100-Mile Wilderness MATC/ATC/AMC and local logistics checks',
    displayCategory: 'official/regional corridor logistics and conditions',
    lane: 'official-public',
    trust: 'official',
    accessMode: 'live-fetch',
    privacy: 'Public official/regional source.',
    useWhen: '100-Mile Wilderness conditions, Monson/Abol Bridge logistics, food carry/drop verification, legal campsite/lean-to checks, ford/water risk, trail closures, land-manager notices, MATC/ATC updates, and shuttle/support provider confirmation.',
    license: OFFICIAL_PUBLIC_LICENSE,
    freshness: { updateCadence: 'live', staleAfterDays: 7 },
    coverage: { trail: 'AT', states: ['ME'], mileStart: 2078.1, mileEnd: 2177.7, topics: ['100-mile wilderness', 'matc', 'atc', 'amc', 'monson', 'abol bridge', 'food drops', 'fords', 'water', 'closures', 'shuttle'] },
    citationTemplate: 'MATC/ATC/AMC and local 100-Mile Wilderness logistics/conditions pages; live conditions and services must be checked before leaving. Scout fetched timestamp: {fetchedAt}. https://www.matc.org/ https://appalachiantrail.org/ https://www.outdoors.org/',
    allowedActions: ['catalog', 'live-fetch'],
    caveats: ['Food drops, road access, shuttles, campsite status, water, fords, closures, fees, and store/lodging hours change; Scout should fail closed and require current local/land-manager confirmation before entry.'],
    keywords: ['100 mile wilderness', '100-mile wilderness', 'hundred mile wilderness', 'matc', 'maine appalachian trail club', 'appalachian trail conservancy', 'amc', 'monson', 'abol bridge', 'food drop', 'food carry', 'resupply', 'bailout', 'logging road', 'shuttle', 'ford', 'fording', 'water', 'closure', 'conditions']
  },
  {
    id: 'baxter-state-park-at-permits',
    title: 'Baxter State Park AT Long-Distance Hiker Permit, The Birches, camping, trailhead access, water, and Katahdin conditions',
    displayCategory: 'official park permits, camping rules, and summit safety',
    lane: 'official-public',
    trust: 'official',
    accessMode: 'live-fetch',
    privacy: 'Public official source.',
    useWhen: 'Baxter/Katahdin AT finish or SOBO start planning, Long-Distance Hiker Permit, The Birches eligibility/capacity/fee/no-work-for-stay, campground reservations, Katahdin Trailhead Pass/day-use parking, trail/weather/shoulder-season closures, headlamp/water rules, safe-return timing, and park-specific prohibited items.',
    license: OFFICIAL_PUBLIC_LICENSE,
    freshness: { updateCadence: 'live', staleAfterDays: 7 },
    coverage: { trail: 'AT', states: ['ME'], topics: ['baxter', 'katahdin', 'permit', 'long-distance hiker permit', 'the birches', 'camping', 'trailhead pass', 'parking', 'closure', 'weather', 'water', 'rules'] },
    citationTemplate: 'Baxter State Park AT, hiking, camping, and ATC permits pages; live conditions/rules must be checked before leaving. Scout fetched timestamp: {fetchedAt}. https://baxterstatepark.org/general-info/the-at/ https://baxterstatepark.org/general-info/ https://baxterstatepark.org/camp-summer/ https://appalachiantrail.org/explore/hike-the-a-t/thru-hiking/permits-regulations/',
    allowedActions: ['catalog', 'live-fetch'],
    caveats: ['Rules, trail closures, campground availability, KTP/day-use access, weather, and permit status can change; Scout should fail closed and tell the hiker to verify the exact Baxter State Park conditions/reservation/permit plan before leaving.'],
    keywords: ['baxter', 'katahdin', 'baxter state park', 'baxter peak', 'mount katahdin', 'mt katahdin', 'long distance hiker permit', 'ld permit', 'the birches', 'birches', 'katahdin stream', 'abol bridge', 'ktp', 'katahdin trailhead pass', 'day use', 'parking', 'camping', 'closure', 'shoulder season', 'headlamp', 'water', 'weather', 'atc permit']
  },
  {
    id: 'shenandoah-backcountry-permits',
    title: 'Shenandoah National Park backcountry permits, camping regulations, food storage, water, and weather',
    displayCategory: 'official park permits and camping rules',
    lane: 'official-public',
    trust: 'official',
    accessMode: 'live-fetch',
    privacy: 'Public official source.',
    useWhen: 'Shenandoah overnight backcountry camping, Recreation.gov permits, campsite setback rules, food storage, backcountry fires, water treatment/reliability, weather, and park-specific closures.',
    license: OFFICIAL_PUBLIC_LICENSE,
    freshness: { updateCadence: 'live', staleAfterDays: 7 },
    coverage: { trail: 'AT', states: ['VA'], topics: ['shenandoah', 'snp', 'permit', 'recreation.gov', 'nps', 'backcountry', 'camping', 'setbacks', 'food storage', 'fire', 'water', 'weather'] },
    citationTemplate: 'NPS Shenandoah backcountry camping/permits, Recreation.gov Shenandoah Backcountry Permits, NPS food storage, drinking water, and weather pages; live availability/rules must be checked before leaving. Scout fetched timestamp: {fetchedAt}. https://www.nps.gov/shen/planyourvisit/backcountry-camping.htm and https://www.recreation.gov/permits/4675336',
    allowedActions: ['catalog', 'live-fetch'],
    caveats: ['Rules, closures, water status, and permit availability can change; Scout should fail closed and tell the hiker to verify the exact Recreation.gov/NPS permit itinerary before leaving.'],
    keywords: ['shenandoah', 'snp', 'permit', 'permits', 'recreation.gov', 'nps', 'backcountry', 'camping', 'setback', 'setbacks', 'food storage', 'bear', 'fire', 'water', 'weather', 'rockfish gap', 'swift run gap']
  },
  {
    id: 'gsmnp-backcountry-permits',
    title: 'Great Smoky Mountains National Park backcountry permits and camping rules',
    displayCategory: 'official park permits and camping rules',
    lane: 'official-public',
    trust: 'official',
    accessMode: 'live-fetch',
    privacy: 'Public official source.',
    useWhen: 'GSMNP overnight camping, shelter reservations, site/date-specific permits, shelter/tenting rules, parking tags, backcountry office contact, and Recreation.gov permit checks.',
    license: OFFICIAL_PUBLIC_LICENSE,
    freshness: { updateCadence: 'live', staleAfterDays: 7 },
    coverage: { trail: 'AT', states: ['NC', 'TN'], topics: ['gsmnp', 'permit', 'reservation', 'shelter', 'camping', 'parking', 'recreation.gov', 'nps'] },
    citationTemplate: 'NPS GSMNP backcountry camping and Recreation.gov GSMNP permits; live availability/rules must be checked before leaving. Scout fetched timestamp: {fetchedAt}. https://www.nps.gov/grsm/planyourvisit/backcountry-camping.htm and https://www.recreation.gov/permits/4675347',
    allowedActions: ['catalog', 'live-fetch'],
    caveats: ['Rules and availability can change; Scout should fail closed and tell the hiker to verify the exact Recreation.gov/NPS permit itinerary before leaving.'],
    keywords: ['gsmnp', 'smokies', 'great smoky mountains', 'permit', 'permits', 'reservation', 'recreation.gov', 'nps', 'backcountry', 'shelter', 'camping', 'parking tag', 'fontana', 'newfound gap']
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
    keywords: ['weather', 'storm', 'thunderstorm', 'thunder', 'lightning', 'rain', 'snow', 'ice', 'wind', 'heat', 'cold', 'flood', 'forecast', 'alert', 'nws', 'noaa']
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

function stateTokens(value: string | null | undefined): string[] {
  return value?.toUpperCase().split(/[^A-Z]+/u).filter((item) => item.length === 2) ?? [];
}

function manifestCoversState(manifest: ScoutSourceManifest, state: string | null | undefined): boolean {
  const queryStates = stateTokens(state);
  if (queryStates.length === 0) return true;
  const states = manifest.coverage.states;
  if (!states) return true;
  return queryStates.some((item) => states.includes(item));
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

  if (!manifestCoversState(manifest, query.state)) score -= manifest.coverage.states ? 24 : 4;
  if (!manifestCoversMileRange(manifest, query.mileRange)) score -= manifest.coverage.mileStart !== undefined && manifest.coverage.mileEnd !== undefined ? 12 : 4;
  if (manifest.accessMode === 'disabled-pending-review' && !query.includeUnavailable) score -= 8;
  if (manifest.trust === 'official' && /\b(weather|closure|detour|fire|alert|official|lightning|thunder|thunderstorm|wind|above[-\s]?treeline)\b/iu.test(query.query)) score += 3;
  if (manifest.accessMode === 'route-validator' && /\b(route|itinerary|mileage|mile|nobo|sobo|northbound|southbound|pine grove|halfway|fontana|newfound|gsmnp|smokies|great smoky|shenandoah|snp|rockfish|swift run|blackrock|pinefield|hightop|white\s+mountains|whites|franconia|crawford|galehead|zealand|ethan|garfield|baxter|katahdin|abol|monson|birches|100[-\s]?mile|hundred\s+mile|shelter|camp|permit)\b/iu.test(query.query)) score += 5;
  if (manifest.accessMode === 'user-import-required' && /\b(exact|guide|shelter|hut|huts|camp(?:site|sites|ing)?|water|mileage|mileages|service|farout|awol|a\.t\. guide)\b/iu.test(query.query)) score += 6;
  if (manifest.accessMode === 'workspace-private' && /\b(private|workspace|resource|document|doc|note|import|uploaded|source|sources|comments?|water|shelter)\b/iu.test(query.query)) score += 5;

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
