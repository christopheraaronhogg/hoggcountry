export type AtRouteDirection = 'NOBO' | 'SOBO';
export type AtRoutePointKind = 'park' | 'shelter' | 'road-crossing' | 'town' | 'landmark';

export interface AtRouteReferenceSource {
  readonly id: string;
  readonly label: string;
  readonly citation: string;
  readonly authority: 'internal-qa' | 'official' | 'reviewed' | 'user-supplied';
  readonly exactMileageCaveat: string;
}

export interface AtRoutePoint {
  readonly id: string;
  readonly name: string;
  readonly kind: AtRoutePointKind;
  readonly state: string;
  readonly mile: number;
  readonly aliases: readonly string[];
  readonly notes?: string;
  readonly latitude?: number;
  readonly longitude?: number;
}

export interface AtRouteLeg {
  readonly from: AtRoutePoint;
  readonly to: AtRoutePoint;
  readonly direction: AtRouteDirection;
  readonly miles: number;
}

export interface AtRouteSuggestedDay {
  readonly day: number;
  readonly from: AtRoutePoint;
  readonly to: AtRoutePoint;
  readonly miles: number;
  readonly note: string;
}

export interface AtRoutePlanOption {
  readonly id: string;
  readonly label: string;
  readonly totalMiles: number;
  readonly days: readonly AtRouteSuggestedDay[];
  readonly caveats: readonly string[];
}

export interface AtRouteGrounding {
  readonly source: AtRouteReferenceSource;
  readonly direction: AtRouteDirection;
  readonly state: string | null;
  readonly start: AtRoutePoint;
  readonly destination: AtRoutePoint | null;
  readonly targetDays: number | null;
  readonly targetDailyMileage: number | null;
  readonly targetTotalMiles: number | null;
  readonly corridor: readonly AtRoutePoint[];
  readonly legs: readonly AtRouteLeg[];
  readonly mentionedPoints: readonly AtRoutePoint[];
  readonly unrecognizedNames: readonly string[];
  readonly blockedEndpointNames: readonly string[];
  readonly planOptions: readonly AtRoutePlanOption[];
  readonly warnings: readonly string[];
}

export interface BuildAtRouteGroundingInput {
  readonly prompt: string;
  readonly direction?: AtRouteDirection | null;
  readonly startQuery?: string | null;
  readonly targetDays?: number | null;
  readonly targetDailyMileage?: number | null;
  readonly maxCorridorMiles?: number | null;
}

export type AtRouteClaimIssueKind = 'blocked-endpoint' | 'misordered-sequence' | 'bad-mileage' | 'unsafe-camping-rule' | 'stale-permit-rule' | 'unsafe-water-plan' | 'unsafe-summit-plan';

export interface AtRouteClaimIssue {
  readonly kind: AtRouteClaimIssueKind;
  readonly severity: 'block' | 'warn';
  readonly message: string;
  readonly sourceSystemId: string;
  readonly evidence: string;
}

export const AT_ROUTE_QA_SOURCE: AtRouteReferenceSource = {
  id: 'hoggcountry-pine-grove-route-qa-2026-05-04',
  label: 'Hogg Country Pine Grove route-order QA fixture',
  citation: 'Internal dogfood route-order guardrail created from Chris’s 2026-05-04 Pine Grove validation; verify exact mileages with the hiker’s current guide before leaving.',
  authority: 'internal-qa',
  exactMileageCaveat: 'Use these values as a guardrail to prevent wrong order and impossible legs. Treat exact mileages, legal camping, water, and services as verify-before-leaving facts.'
} as const;

export const GSMNP_AT_CORRIDOR_QA_SOURCE: AtRouteReferenceSource = {
  id: 'hoggcountry-gsmnp-at-corridor-qa-2026-05-05',
  label: 'Hogg Country GSMNP AT corridor and permit-rule QA fixture',
  citation: 'Internal dogfood guardrail created from 2026-05-05 Smokies QA plus official NPS/Recreation.gov camping rules; verify exact mileages, shelter availability, water, and closures before leaving.',
  authority: 'internal-qa',
  exactMileageCaveat: 'Use these values as a route-order and regulation guardrail, not as a replacement for a current A.T. Guide, NPS map, Recreation.gov itinerary, or recent water/shelter report.'
} as const;

export const SHENANDOAH_AT_CORRIDOR_QA_SOURCE: AtRouteReferenceSource = {
  id: 'hoggcountry-shenandoah-at-corridor-qa-2026-05-05',
  label: 'Hogg Country Shenandoah AT south/central corridor and regulation QA fixture',
  citation: 'Internal dogfood guardrail created from 2026-05-05 Shenandoah QA plus official NPS/Recreation.gov permit, campsite setback, food-storage, fire, water, and weather rule checks; verify exact mileages, campsite legality, water, closures, and permit flow before leaving.',
  authority: 'internal-qa',
  exactMileageCaveat: 'Use these values as a route-order and regulation guardrail, not as a replacement for a current A.T. Guide, NPS map, Recreation.gov itinerary, or recent water/shelter report.'
} as const;

export const BAXTER_KATAHDIN_AT_CORRIDOR_QA_SOURCE: AtRouteReferenceSource = {
  id: 'hoggcountry-baxter-katahdin-at-corridor-qa-2026-05-05',
  label: 'Hogg Country Baxter/Katahdin AT finish corridor and regulation QA fixture',
  citation: 'Internal dogfood guardrail created from Hogg Country Baxter/Katahdin guide data plus official Baxter State Park AT, hiking, camping, and ATC permit pages checked 2026-05-05: https://baxterstatepark.org/general-info/the-at/ https://baxterstatepark.org/general-info/ https://baxterstatepark.org/camp-summer/ https://appalachiantrail.org/explore/hike-the-a-t/thru-hiking/permits-regulations/',
  authority: 'internal-qa',
  exactMileageCaveat: 'Use these values as a route-order and regulation guardrail, not as a replacement for a current A.T. Guide, Baxter State Park conditions/ranger guidance, current camping reservation, or recent water/weather report.'
} as const;

export const AT_ROUTE_REFERENCE_POINTS: readonly AtRoutePoint[] = [
  {
    id: 'fontana-dam-nc',
    name: 'Fontana Dam',
    kind: 'landmark',
    state: 'NC',
    mile: 166.1,
    latitude: 35.4526,
    longitude: -83.8032,
    aliases: ['fontana dam', 'fontana', 'fontana dam nc', 'fontana dam north carolina'],
    notes: 'Southern AT gateway into Great Smoky Mountains National Park; parking tag and shuttle logistics require current confirmation.'
  },
  {
    id: 'mollies-ridge-shelter-nc-tn',
    name: 'Mollies Ridge Shelter',
    kind: 'shelter',
    state: 'NC',
    mile: 177.3,
    aliases: ['mollies ridge', 'mollies ridge shelter', 'mollie ridge', 'mollie ridge shelter'],
    notes: 'GSMNP shelter; permit/reservation and current water condition must be verified before relying on it.'
  },
  {
    id: 'russell-field-shelter-tn',
    name: 'Russell Field Shelter',
    kind: 'shelter',
    state: 'TN',
    mile: 180.4,
    aliases: ['russell field', 'russell field shelter'],
    notes: 'GSMNP shelter; permit/reservation and current water condition must be verified before relying on it.'
  },
  {
    id: 'spence-field-shelter-tn',
    name: 'Spence Field Shelter',
    kind: 'shelter',
    state: 'TN',
    mile: 183.2,
    aliases: ['spence field', 'spence field shelter'],
    notes: 'GSMNP shelter; permit/reservation and current water condition must be verified before relying on it.'
  },
  {
    id: 'derrick-knob-shelter-tn',
    name: 'Derrick Knob Shelter',
    kind: 'shelter',
    state: 'TN',
    mile: 189.3,
    aliases: ['derrick knob', 'derrick knob shelter'],
    notes: 'GSMNP shelter; permit/reservation and current water condition must be verified before relying on it.'
  },
  {
    id: 'silers-bald-shelter-tn',
    name: 'Silers Bald Shelter',
    kind: 'shelter',
    state: 'TN',
    mile: 195.8,
    aliases: ['silers bald', 'silers bald shelter', 'siler bald', 'siler bald shelter'],
    notes: 'GSMNP shelter; permit/reservation and current water condition must be verified before relying on it.'
  },
  {
    id: 'double-spring-gap-shelter-tn',
    name: 'Double Spring Gap Shelter',
    kind: 'shelter',
    state: 'TN',
    mile: 197.5,
    aliases: ['double spring gap', 'double spring gap shelter', 'double springs gap', 'double springs gap shelter'],
    notes: 'GSMNP shelter; permit/reservation and current water condition must be verified before relying on it.'
  },
  {
    id: 'mount-collins-shelter-tn',
    name: 'Mount Collins Shelter',
    kind: 'shelter',
    state: 'TN',
    mile: 203.1,
    aliases: ['mount collins', 'mount collins shelter', 'mt collins', 'mt collins shelter'],
    notes: 'GSMNP shelter near the Newfound Gap/Clingmans Dome corridor; permit/reservation and water must be verified.'
  },
  {
    id: 'newfound-gap-tn-nc',
    name: 'Newfound Gap',
    kind: 'road-crossing',
    state: 'TN',
    mile: 208.1,
    latitude: 35.6118,
    longitude: -83.4249,
    aliases: ['newfound gap', 'new found gap', 'us 441 newfound gap', 'newfound gap tn', 'newfound gap nc'],
    notes: 'High-elevation road crossing/pickup point; verify US 441 status, parking, pickup, and weather before committing.'
  },
  {
    id: 'rockfish-gap-va',
    name: 'Rockfish Gap',
    kind: 'road-crossing',
    state: 'VA',
    mile: 863.7,
    latitude: 38.0312,
    longitude: -78.8586,
    aliases: ['rockfish gap', 'rockfish gap va', 'rockfish gap virginia', 'i 64 rockfish gap', 'us 250 rockfish gap', 'shenandoah south entrance'],
    notes: 'Southern Shenandoah National Park AT gateway near Waynesboro; verify entrance, overnight parking, and shuttle logistics before committing.'
  },
  {
    id: 'calf-mountain-shelter-va',
    name: 'Calf Mountain Shelter',
    kind: 'shelter',
    state: 'VA',
    mile: 872.3,
    aliases: ['calf mountain', 'calf mountain shelter', 'calf mountain hut'],
    notes: 'Shenandoah-area shelter/hut candidate; legal overnight use, campsite setbacks, and water require current NPS/Recreation.gov and guide/current-comment checks.'
  },
  {
    id: 'blackrock-hut-va',
    name: 'Blackrock Hut',
    kind: 'shelter',
    state: 'VA',
    mile: 885.3,
    aliases: ['blackrock hut', 'blackrock shelter', 'blackrock', 'black rock hut', 'black rock shelter'],
    notes: 'Shenandoah hut candidate; do not assume tenting/overflow legality or water reliability without current checks.'
  },
  {
    id: 'pinefield-hut-va',
    name: 'Pinefield Hut',
    kind: 'shelter',
    state: 'VA',
    mile: 898.5,
    aliases: ['pinefield hut', 'pinefield shelter', 'pine field hut', 'pine field shelter'],
    notes: 'Shenandoah hut candidate; verify legal campsite use, water, closures, and permit itinerary before relying on it.'
  },
  {
    id: 'hightop-hut-va',
    name: 'Hightop Hut',
    kind: 'shelter',
    state: 'VA',
    mile: 906.7,
    aliases: ['hightop hut', 'hightop shelter', 'high top hut', 'high top shelter', 'hightop'],
    notes: 'Last major hut candidate before Swift Run Gap in this south/central guardrail; verify current water and legal overnight details.'
  },
  {
    id: 'swift-run-gap-va',
    name: 'Swift Run Gap',
    kind: 'road-crossing',
    state: 'VA',
    mile: 909.6,
    latitude: 38.3665,
    longitude: -78.5503,
    aliases: ['swift run gap', 'swift run gap va', 'swift run', 'us 33 swift run gap', 'skyline drive swift run gap'],
    notes: 'US 33 / Skyline Drive road crossing and logical south/central Shenandoah pickup point; verify parking, shuttle, and road status.'
  },
  {
    id: 'pine-grove-furnace-state-park-pa',
    name: 'Pine Grove Furnace State Park',
    kind: 'park',
    state: 'PA',
    mile: 1105.9,
    latitude: 40.0329,
    longitude: -77.3047,
    aliases: ['pine grove furnace', 'pine grove furnace state park', 'pine grove', 'halfway mark', 'halfway point']
  },
  {
    id: 'james-fry-shelter-pa',
    name: 'James Fry Shelter side trail',
    kind: 'shelter',
    state: 'PA',
    mile: 1113.1,
    aliases: ['james fry', 'james fry shelter', 'james fry shelter side trail'],
    notes: 'Shelter/water details still require a current hiker guide or recent field report.'
  },
  {
    id: 'alec-kennedy-shelter-pa',
    name: 'Alec Kennedy Shelter',
    kind: 'shelter',
    state: 'PA',
    mile: 1121.2,
    aliases: ['alec kennedy', 'alec kennedy shelter', 'kennedy shelter'],
    notes: 'Water can be seasonal/variable; verify with current guide comments before relying on it.'
  },
  {
    id: 'pa-174-boiling-springs-pa',
    name: 'PA 174 / Boiling Springs',
    kind: 'town',
    state: 'PA',
    mile: 1125.1,
    aliases: ['pa 174', 'pa-174', 'boiling springs', 'boiling springs pa', 'boiling springs pennsylvania'],
    notes: 'Town/service stop. Do not assume legal camping or lodging availability without a fresh check.'
  },
  {
    id: 'darlington-shelter-pa',
    name: 'Darlington Shelter',
    kind: 'shelter',
    state: 'PA',
    mile: 1139.4,
    aliases: ['darlington', 'darlington shelter'],
    notes: 'Shelter/water condition must be verified with a current hiker guide or recent field report.'
  },
  {
    id: 'duncannon-pa',
    name: 'Duncannon',
    kind: 'town',
    state: 'PA',
    mile: 1150.8,
    aliases: ['duncannon', 'duncannon pa', 'duncannon pennsylvania'],
    notes: 'Town/service stop; exact service hours and lodging require a fresh check.'
  },
  {
    id: 'monson-me',
    name: 'Monson',
    kind: 'town',
    state: 'ME',
    mile: 2090.0,
    aliases: ['monson', 'monson me', 'monson maine', '100 mile wilderness gateway', 'hundred mile wilderness gateway'],
    notes: 'Last major resupply before the 100-Mile Wilderness in local Hogg Country data; exact AT mileage and services require current guide/town confirmation.'
  },
  {
    id: 'abol-bridge-me',
    name: 'Abol Bridge',
    kind: 'road-crossing',
    state: 'ME',
    mile: 2177.7,
    latitude: 45.8379,
    longitude: -68.9913,
    aliases: ['abol bridge', 'abol bridge me', 'abol bridge maine', 'west branch penobscot', 'baxter southern boundary'],
    notes: 'Southern approach to Baxter State Park / Katahdin finish logistics; confirm park access, shuttle, and weather before committing.'
  },
  {
    id: 'rainbow-spring-campsite-me',
    name: 'Rainbow Spring Campsite',
    kind: 'landmark',
    state: 'ME',
    mile: 2178.5,
    aliases: ['rainbow spring', 'rainbow spring campsite', 'rainbow springs', 'rainbow springs campsite'],
    notes: 'Local water/campsite waypoint from bundled Hogg Country water data; verify current legal use and water before relying on it.'
  },
  {
    id: 'hurd-brook-lean-to-me',
    name: 'Hurd Brook Lean-to',
    kind: 'shelter',
    state: 'ME',
    mile: 2186.0,
    aliases: ['hurd brook', 'hurd brook lean-to', 'hurd brook leanto', 'hurd brook lean to'],
    notes: 'Final lean-to before Katahdin Stream in local Hogg Country water data; verify current status and water before relying on it.'
  },
  {
    id: 'katahdin-stream-campground-me',
    name: 'Katahdin Stream Campground',
    kind: 'landmark',
    state: 'ME',
    mile: 2192.5,
    latitude: 45.8864,
    longitude: -68.9991,
    aliases: ['katahdin stream campground', 'katahdin stream', 'ksc', 'katahdin stream ranger station', 'the birches', 'birches campsite', 'the birches campsite'],
    notes: 'Baxter State Park campground/ranger station and Hunt Trail AT summit base; camping, The Birches, and permits are controlled by current Baxter policies and availability.'
  },
  {
    id: 'baxter-peak-katahdin-me',
    name: 'Baxter Peak / Katahdin',
    kind: 'landmark',
    state: 'ME',
    mile: 2197.7,
    latitude: 45.9044,
    longitude: -68.9213,
    aliases: ['baxter peak', 'katahdin', 'mount katahdin', 'mt katahdin', 'katahdin summit', 'northern terminus', 'appalachian trail northern terminus'],
    notes: 'Northern terminus summit. Baxter can close Katahdin trails for weather/conditions; summit plans need current ranger/conditions checks and a safe return route.'
  }
] as const;

const KNOWN_BLOCKED_PINE_GROVE_ENDPOINTS = ['Tagg Run Shelter'] as const;
const KNOWN_BLOCKED_SHENANDOAH_SWIFT_ENDPOINTS = ['Big Meadows', "Byrd's Nest #3", 'Byrds Nest 3'] as const;
const KNOWN_BLOCKED_BAXTER_FINISH_ENDPOINTS = ['Knife Edge', 'Chimney Pond', 'Roaring Brook'] as const;
const SHENANDOAH_AT_POINT_IDS = [
  'rockfish-gap-va',
  'calf-mountain-shelter-va',
  'blackrock-hut-va',
  'pinefield-hut-va',
  'hightop-hut-va',
  'swift-run-gap-va'
] as const;
const BAXTER_KATAHDIN_AT_POINT_IDS = [
  'monson-me',
  'abol-bridge-me',
  'rainbow-spring-campsite-me',
  'hurd-brook-lean-to-me',
  'katahdin-stream-campground-me',
  'baxter-peak-katahdin-me'
] as const;

const ROUTE_PROMPT_TERMS = [
  'appalachian trail',
  ' at ',
  'nobo',
  'northbound',
  'sobo',
  'southbound',
  'route',
  'itinerary',
  'mileage',
  'mileages',
  'daily mileage',
  'shelter',
  'camping',
  'trail plan',
  'hiking'
] as const;

const NAMED_PLACE_PATTERNS: readonly { readonly label: string; readonly pattern: RegExp }[] = [
  { label: 'Tagg Run Shelter', pattern: /\btagg\s+run(?:\s+shelter)?\b/iu },
  { label: 'Big Meadows', pattern: /\bbig\s+meadows(?:\s+wayside)?\b/iu },
  { label: "Byrd's Nest #3", pattern: /\bbyrd'?s?\s+nest\s*(?:#\s*)?3\b/iu },
  { label: 'Knife Edge', pattern: /\bknife\s+edge\b/iu },
  { label: 'Chimney Pond', pattern: /\bchimney\s+pond\b/iu },
  { label: 'Roaring Brook', pattern: /\broaring\s+brook\b/iu }
];

function normalizeRouteText(value: string): string {
  return value
    .toLowerCase()
    .replace(/&/gu, ' and ')
    .replace(/[^a-z0-9]+/gu, ' ')
    .replace(/\s+/gu, ' ')
    .trim();
}

function includesNormalized(haystack: string, needle: string): boolean {
  const normalizedHaystack = ` ${normalizeRouteText(haystack)} `;
  const normalizedNeedle = normalizeRouteText(needle);
  return Boolean(normalizedNeedle) && normalizedHaystack.includes(` ${normalizedNeedle} `);
}

function aliasPattern(alias: string): RegExp {
  const parts = normalizeRouteText(alias).split(' ').filter(Boolean);
  if (parts.length === 1 && parts[0] === 'katahdin') {
    return /\bkatahdin\b(?!\W+(?:stream|trail|trails|trailhead|campground|lake|woods))/iu;
  }
  return new RegExp(`\\b${parts.map((part) => part.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&')).join('\\W+')}\\b`, 'iu');
}

function uniqueById<T extends { readonly id: string }>(items: readonly T[]): T[] {
  const seen = new Set<string>();
  const unique: T[] = [];
  for (const item of items) {
    if (seen.has(item.id)) continue;
    seen.add(item.id);
    unique.push(item);
  }
  return unique;
}

function roundMileage(value: number): number {
  return Math.round(value * 10) / 10;
}

export function formatAtRouteMileage(value: number): string {
  return roundMileage(value).toFixed(1);
}

export function inferAtRouteDirection(prompt: string): AtRouteDirection {
  if (/\b(sobo|southbound|south\s+bound)\b/iu.test(prompt)) return 'SOBO';
  return 'NOBO';
}

export function extractAtRouteDayCount(prompt: string): number | null {
  const digitMatch = prompt.match(/\b(\d{1,2})\s*(?:-\s*)?(?:(?:hiking|walking|trail)\s+)?(?:day|days)\b/iu);
  if (digitMatch?.[1]) {
    const days = Number.parseInt(digitMatch[1], 10);
    return Number.isFinite(days) && days > 0 && days <= 30 ? days : null;
  }

  const wordMatch = prompt.match(/\b(one|two|three|four|five|six|seven)\s*(?:-\s*)?(?:(?:hiking|walking|trail)\s+)?(?:day|days)\b/iu);
  const wordDays: Record<string, number> = { one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7 };
  if (wordMatch?.[1]) return wordDays[wordMatch[1].toLowerCase()] ?? null;

  const nightMatch = prompt.match(/\b(\d{1,2})\s*(?:-\s*)?(?:night|nights)\b/iu);
  if (nightMatch?.[1]) {
    const nights = Number.parseInt(nightMatch[1], 10);
    return Number.isFinite(nights) && nights >= 0 && nights < 30 ? nights + 1 : null;
  }

  const wordNightMatch = prompt.match(/\b(one|two|three|four|five|six|seven)\s*(?:-\s*)?(?:night|nights)\b/iu);
  if (wordNightMatch?.[1]) {
    const nights = wordDays[wordNightMatch[1].toLowerCase()];
    return typeof nights === 'number' ? nights + 1 : null;
  }

  return null;
}

export function shouldUseStrictAtRouteGrounding(prompt: string): boolean {
  const lowered = prompt.toLowerCase();
  const hasRouteContext = ROUTE_PROMPT_TERMS.some((term) => lowered.includes(term));
  const hasKnownPoint = AT_ROUTE_REFERENCE_POINTS.some((point) =>
    point.aliases.some((alias) => includesNormalized(prompt, alias))
  );
  const asksForPlan = /\b(plan|itinerary|route|daily|mileage|mileages|camp(?:ing)?|shelter|resupply|water|food|checklist|hiking)\b/iu.test(prompt);
  return hasRouteContext && hasKnownPoint && asksForPlan;
}

export function findAtRoutePoint(query: string | null | undefined): AtRoutePoint | null {
  const value = query?.trim();
  if (!value) return null;

  const exact = AT_ROUTE_REFERENCE_POINTS.find((point) =>
    point.aliases.some((alias) => normalizeRouteText(alias) === normalizeRouteText(value))
  );
  if (exact) return exact;

  return AT_ROUTE_REFERENCE_POINTS.find((point) =>
    point.aliases.some((alias) => includesNormalized(value, alias) || includesNormalized(alias, value))
  ) ?? null;
}

export function extractMentionedAtRoutePoints(prompt: string): readonly AtRoutePoint[] {
  return uniqueById(
    AT_ROUTE_REFERENCE_POINTS.filter((point) => point.aliases.some((alias) => includesNormalized(prompt, alias)))
  );
}

export function extractUnrecognizedAtRouteNames(prompt: string): readonly string[] {
  return NAMED_PLACE_PATTERNS
    .filter((entry) => entry.pattern.test(prompt) && !findAtRoutePoint(entry.label))
    .map((entry) => entry.label);
}

function corridorFrom(start: AtRoutePoint, direction: AtRouteDirection, maxCorridorMiles: number): readonly AtRoutePoint[] {
  const sorted = [...AT_ROUTE_REFERENCE_POINTS].sort((left, right) => left.mile - right.mile);
  const corridor = direction === 'NOBO'
    ? sorted.filter((point) => point.mile >= start.mile && point.mile - start.mile <= maxCorridorMiles)
    : sorted.filter((point) => point.mile <= start.mile && start.mile - point.mile <= maxCorridorMiles).reverse();

  return corridor.length > 0 ? corridor : [start];
}

function legsFor(corridor: readonly AtRoutePoint[], direction: AtRouteDirection): readonly AtRouteLeg[] {
  const legs: AtRouteLeg[] = [];
  for (let index = 0; index < corridor.length - 1; index += 1) {
    const from = corridor[index];
    const to = corridor[index + 1];
    legs.push({ from, to, direction, miles: roundMileage(Math.abs(to.mile - from.mile)) });
  }
  return legs;
}

function pointById(id: string): AtRoutePoint {
  const point = AT_ROUTE_REFERENCE_POINTS.find((item) => item.id === id);
  if (!point) throw new Error(`Missing AT route point fixture: ${id}`);
  return point;
}

function buildDay(day: number, fromId: string, toId: string, note: string): AtRouteSuggestedDay {
  const from = pointById(fromId);
  const to = pointById(toId);
  return {
    day,
    from,
    to,
    miles: roundMileage(Math.abs(to.mile - from.mile)),
    note
  };
}

function buildPineGrovePlanOptions(direction: AtRouteDirection): readonly AtRoutePlanOption[] {
  if (direction !== 'NOBO') return [];

  const conservativeDays = [
    buildDay(1, 'pine-grove-furnace-state-park-pa', 'james-fry-shelter-pa', 'Short first day; verify shelter/water in the current guide.'),
    buildDay(2, 'james-fry-shelter-pa', 'pa-174-boiling-springs-pa', 'Town/service day; only overnight here if lodging/camping is verified.'),
    buildDay(3, 'pa-174-boiling-springs-pa', 'darlington-shelter-pa', 'Shelter endpoint; verify water and shelter status before committing.')
  ] as const;

  const strongerDays = [
    buildDay(1, 'pine-grove-furnace-state-park-pa', 'alec-kennedy-shelter-pa', 'Longer first day; verify water before relying on the shelter.'),
    buildDay(2, 'alec-kennedy-shelter-pa', 'darlington-shelter-pa', 'Long middle day; use only if body, weather, water, and daylight all line up.'),
    buildDay(3, 'darlington-shelter-pa', 'duncannon-pa', 'Town finish; verify service hours and pickup/lodging before leaving.')
  ] as const;

  return [
    {
      id: 'pine-grove-conservative-darlington',
      label: 'Conservative 3-day shape to Darlington',
      totalMiles: roundMileage(conservativeDays.reduce((sum, day) => sum + day.miles, 0)),
      days: conservativeDays,
      caveats: [
        'Boiling Springs is treated as a town/service stop, not an assumed legal campsite.',
        'This option prioritizes avoiding an invented endpoint over forcing exactly 13 miles per day.'
      ]
    },
    {
      id: 'pine-grove-stronger-duncannon',
      label: 'Stronger 3-day shape to Duncannon',
      totalMiles: roundMileage(strongerDays.reduce((sum, day) => sum + day.miles, 0)),
      days: strongerDays,
      caveats: [
        'This is a bigger-mile option; Day 2 is the stress point.',
        'Use only with current water/shelter reports and a clear pickup/lodging plan.'
      ]
    }
  ];
}


function buildGsmnpPlanOptions(direction: AtRouteDirection): readonly AtRoutePlanOption[] {
  const conservativeDays = direction === 'NOBO' ? [
    buildDay(1, 'fontana-dam-nc', 'mollies-ridge-shelter-nc-tn', 'Big climb into GSMNP; start early and verify the exact shelter reservation before leaving Fontana.'),
    buildDay(2, 'mollies-ridge-shelter-nc-tn', 'derrick-knob-shelter-tn', 'Steady ridge day; verify water at both shelters before committing.'),
    buildDay(3, 'derrick-knob-shelter-tn', 'silers-bald-shelter-tn', 'Short conservative day that creates margin for late-October weather, fatigue, and reservation reality.'),
    buildDay(4, 'silers-bald-shelter-tn', 'newfound-gap-tn-nc', 'Longer finish over high-elevation terrain; confirm US 441/Newfound Gap pickup and weather first.')
  ] as const : [
    buildDay(1, 'newfound-gap-tn-nc', 'silers-bald-shelter-tn', 'Longer exposed opening from the road crossing; confirm weather and US 441 access before stepping off.'),
    buildDay(2, 'silers-bald-shelter-tn', 'derrick-knob-shelter-tn', 'Short conservative day that keeps margin for late-October weather and permit reality.'),
    buildDay(3, 'derrick-knob-shelter-tn', 'mollies-ridge-shelter-nc-tn', 'Steady ridge day; verify water at both shelters before committing.'),
    buildDay(4, 'mollies-ridge-shelter-nc-tn', 'fontana-dam-nc', 'Long descent out of GSMNP; confirm Fontana pickup/parking before leaving Newfound Gap.')
  ] as const;

  const balancedDays = direction === 'NOBO' ? [
    buildDay(1, 'fontana-dam-nc', 'mollies-ridge-shelter-nc-tn', 'Big climb into GSMNP; reasonable first shelter if the permit is available.'),
    buildDay(2, 'mollies-ridge-shelter-nc-tn', 'derrick-knob-shelter-tn', 'Solid full day; keep weather and daylight conservative.'),
    buildDay(3, 'derrick-knob-shelter-tn', 'mount-collins-shelter-tn', 'Longer high-elevation day; use only if water, forecast, body, and reservation all line up.'),
    buildDay(4, 'mount-collins-shelter-tn', 'newfound-gap-tn-nc', 'Short finish that protects shuttle/pickup timing.')
  ] as const : [
    buildDay(1, 'newfound-gap-tn-nc', 'mount-collins-shelter-tn', 'Short opening that protects travel-day timing, but still requires a valid shelter permit.'),
    buildDay(2, 'mount-collins-shelter-tn', 'derrick-knob-shelter-tn', 'Longer high-elevation day; use only if water, forecast, body, and reservation all line up.'),
    buildDay(3, 'derrick-knob-shelter-tn', 'mollies-ridge-shelter-nc-tn', 'Solid full day; keep weather and daylight conservative.'),
    buildDay(4, 'mollies-ridge-shelter-nc-tn', 'fontana-dam-nc', 'Long descent out to Fontana; confirm pickup/parking before committing.')
  ] as const;

  const strongerDays = direction === 'NOBO' ? [
    buildDay(1, 'fontana-dam-nc', 'russell-field-shelter-tn', 'Stronger first day; only use if the climb, daylight, and permit availability are comfortable.'),
    buildDay(2, 'russell-field-shelter-tn', 'derrick-knob-shelter-tn', 'Shorter recovery day after the stronger start.'),
    buildDay(3, 'derrick-knob-shelter-tn', 'mount-collins-shelter-tn', 'Longer high-elevation day; weather is the controlling risk.'),
    buildDay(4, 'mount-collins-shelter-tn', 'newfound-gap-tn-nc', 'Short finish to the pickup/road crossing.')
  ] as const : [
    buildDay(1, 'newfound-gap-tn-nc', 'mount-collins-shelter-tn', 'Short opening to a permit-controlled shelter; useful if arrival logistics are tight.'),
    buildDay(2, 'mount-collins-shelter-tn', 'derrick-knob-shelter-tn', 'Longer high-elevation day; weather is the controlling risk.'),
    buildDay(3, 'derrick-knob-shelter-tn', 'russell-field-shelter-tn', 'Shorter recovery day before the stronger finish.'),
    buildDay(4, 'russell-field-shelter-tn', 'fontana-dam-nc', 'Stronger final day; only use if the descent, daylight, and pickup logistics are comfortable.')
  ] as const;

  return [
    {
      id: direction === 'NOBO' ? 'gsmnp-conservative-silers-finish' : 'gsmnp-sobo-conservative-silers-start',
      label: direction === 'NOBO' ? 'Conservative 4-day Smokies shape via Silers Bald' : 'Conservative 4-day Smokies SOBO shape via Silers Bald',
      totalMiles: roundMileage(conservativeDays.reduce((sum, day) => sum + day.miles, 0)),
      days: conservativeDays,
      caveats: direction === 'NOBO'
        ? [
            'Day 3 is intentionally short to preserve safety margin in late-October Smokies conditions.',
            'Day 4 is the longest day; do not use this option without a confirmed weather/pickup plan.'
          ]
        : [
            'Day 2 is intentionally short to preserve safety margin in late-October Smokies conditions.',
            'Day 1 is exposed and logistics-sensitive; do not use this option without confirmed weather and US 441 access.'
          ]
    },
    {
      id: direction === 'NOBO' ? 'gsmnp-balanced-mount-collins-finish' : 'gsmnp-sobo-balanced-mount-collins-start',
      label: direction === 'NOBO' ? 'Balanced-if-conditions 4-day Smokies shape via Mount Collins' : 'Balanced-if-conditions 4-day Smokies SOBO shape via Mount Collins',
      totalMiles: roundMileage(balancedDays.reduce((sum, day) => sum + day.miles, 0)),
      days: balancedDays,
      caveats: direction === 'NOBO'
        ? [
            'This reduces the final-day pressure but makes Day 3 a real work day.',
            'Use only if the Mount Collins reservation, water, forecast, daylight, and body all line up.'
          ]
        : [
            'This protects the opening travel-day timing but makes Day 2 a real work day.',
            'Use only if the Mount Collins reservation, water, forecast, daylight, and body all line up.'
          ]
    },
    {
      id: direction === 'NOBO' ? 'gsmnp-stronger-russell-mount-collins' : 'gsmnp-sobo-stronger-russell-mount-collins',
      label: direction === 'NOBO' ? 'Stronger-permit-fit Smokies shape via Russell Field and Mount Collins' : 'Stronger-permit-fit Smokies SOBO shape via Russell Field and Mount Collins',
      totalMiles: roundMileage(strongerDays.reduce((sum, day) => sum + day.miles, 0)),
      days: strongerDays,
      caveats: direction === 'NOBO'
        ? [
            'This is the stronger hiker option, not the default late-October recommendation.',
            'The first climb and Day 3 exposure are the stress points.'
          ]
        : [
            'This is the stronger hiker option, not the default late-October recommendation.',
            'Day 2 exposure and the final-day descent distance are the stress points.'
          ]
    }
  ];
}


function buildShenandoahPlanOptions(direction: AtRouteDirection): readonly AtRoutePlanOption[] {
  const saferDays = direction === 'NOBO' ? [
    buildDay(1, 'rockfish-gap-va', 'calf-mountain-shelter-va', 'Short opening; keeps July heat and permit/campsite uncertainty from forcing a late finish.'),
    buildDay(2, 'calf-mountain-shelter-va', 'blackrock-hut-va', 'Moderate shelter-to-hut day; verify legal overnight use and water before committing.'),
    buildDay(3, 'blackrock-hut-va', 'pinefield-hut-va', 'Moderate full day; treat the hut as a candidate, not a confirmed legal endpoint.'),
    buildDay(4, 'pinefield-hut-va', 'swift-run-gap-va', 'Short finish to US 33 / Swift Run Gap; confirms the route does not continue to Big Meadows for this itinerary.')
  ] as const : [
    buildDay(1, 'swift-run-gap-va', 'pinefield-hut-va', 'Short opening from US 33; verify parking, shuttle, legal overnight use, and water.'),
    buildDay(2, 'pinefield-hut-va', 'blackrock-hut-va', 'Moderate full day; treat the hut as a candidate, not a confirmed legal endpoint.'),
    buildDay(3, 'blackrock-hut-va', 'calf-mountain-shelter-va', 'Moderate hut-to-shelter day; verify legal overnight use and water before committing.'),
    buildDay(4, 'calf-mountain-shelter-va', 'rockfish-gap-va', 'Short finish to Rockfish Gap / US 250 / I-64; confirm pickup before leaving camp.')
  ] as const;

  const strongerThreeDay = direction === 'NOBO' ? [
    buildDay(1, 'rockfish-gap-va', 'blackrock-hut-va', 'Very long late-July first day; not the default with a 2L carry unless heat, water, daylight, body, and permit/campsite legality all line up.'),
    buildDay(2, 'blackrock-hut-va', 'pinefield-hut-va', 'Moderate day; verify current water and legal overnight status.'),
    buildDay(3, 'pinefield-hut-va', 'swift-run-gap-va', 'Shorter finish to US 33; confirm shuttle/pickup and road access first.')
  ] as const : [
    buildDay(1, 'swift-run-gap-va', 'pinefield-hut-va', 'Short opening from US 33; verify parking, shuttle, legal overnight use, and water.'),
    buildDay(2, 'pinefield-hut-va', 'blackrock-hut-va', 'Moderate day; verify current water and legal overnight status.'),
    buildDay(3, 'blackrock-hut-va', 'rockfish-gap-va', 'Very long late-July finish; not the default with a 2L carry unless heat, water, daylight, body, and pickup all line up.')
  ] as const;

  return [
    {
      id: direction === 'NOBO' ? 'shenandoah-safer-four-day-rockfish-swift' : 'shenandoah-sobo-safer-four-day-swift-rockfish',
      label: direction === 'NOBO' ? 'Safer 4-day Shenandoah shape: Rockfish Gap to Swift Run Gap' : 'Safer 4-day Shenandoah SOBO shape: Swift Run Gap to Rockfish Gap',
      totalMiles: roundMileage(saferDays.reduce((sum, day) => sum + day.miles, 0)),
      days: saferDays,
      caveats: [
        'This is the safer default for late July heat and a small water carry; it does not force the requested 3-day pace.',
        'Huts/shelters are route-order candidates only. Current Recreation.gov/NPS permit rules, campsite setbacks, water, and closures control the final overnight plan.'
      ]
    },
    {
      id: direction === 'NOBO' ? 'shenandoah-stronger-three-day-blackrock-pinefield' : 'shenandoah-sobo-stronger-three-day-pinefield-blackrock',
      label: direction === 'NOBO' ? 'Stronger 3-day Shenandoah shape via Blackrock and Pinefield' : 'Stronger 3-day Shenandoah SOBO shape via Pinefield and Blackrock',
      totalMiles: roundMileage(strongerThreeDay.reduce((sum, day) => sum + day.miles, 0)),
      days: strongerThreeDay,
      caveats: [
        'This matches the 3-day / 2-night request but is not the conservative recommendation in late July with only 2L water capacity.',
        'Use only with a current legal permit/campsite plan, confirmed water every day, early starts, thunderstorm escape timing, and a confirmed shuttle.'
      ]
    }
  ];
}

function buildBaxterKatahdinPlanOptions(direction: AtRouteDirection): readonly AtRoutePlanOption[] {
  const saferFinishDays = [
    buildDay(1, 'abol-bridge-me', 'hurd-brook-lean-to-me', 'Shorter Baxter approach day; verify legal overnight use, water, and whether this fits your actual 100-Mile Wilderness carry.'),
    buildDay(2, 'hurd-brook-lean-to-me', 'katahdin-stream-campground-me', 'Reach Katahdin Stream with margin to secure the in-person LD hiker permit and confirm camping/return logistics.'),
    buildDay(3, 'katahdin-stream-campground-me', 'baxter-peak-katahdin-me', 'One-way AT summit leg only; plan the full descent/exit, turnaround time, weather, ranger guidance, and headlamp before starting.')
  ] as const;

  const compressedFinishDays = [
    buildDay(1, 'abol-bridge-me', 'katahdin-stream-campground-me', 'Longer final approach; use only with confirmed legal camping/Birches eligibility or a reserved site at Katahdin Stream.'),
    buildDay(2, 'katahdin-stream-campground-me', 'baxter-peak-katahdin-me', 'One-way AT summit leg only; start early and treat the day as an 8-12 hour strenuous round trip/exit problem.')
  ] as const;

  const soboStartDays = [
    buildDay(1, 'katahdin-stream-campground-me', 'baxter-peak-katahdin-me', 'SOBO start requires the same in-person LD permit plus a campground reservation or day-use/KTP access plan before attempting Katahdin.'),
    buildDay(2, 'katahdin-stream-campground-me', 'hurd-brook-lean-to-me', 'After descending/returning safely, leave Baxter only on a legal route with confirmed camping and food carry.')
  ] as const;

  return direction === 'SOBO'
    ? [
        {
          id: 'baxter-sobo-permit-and-hurd-brook-start',
          label: 'SOBO Katahdin start with legal access gate',
          totalMiles: roundMileage(soboStartDays.reduce((sum, day) => sum + day.miles, 0)),
          days: soboStartDays,
          caveats: [
            'The summit day mileage shown is one-way AT mileage; the real day includes descent/exit and can take 8-12 hours.',
            'SOBO hikers do not get to bypass Baxter access, camping, parking, or LD permit rules.'
          ]
        }
      ]
    : [
        {
          id: 'baxter-safer-three-day-abol-ksc-summit',
          label: 'Safer 3-day Baxter finish: Abol Bridge to Katahdin Stream, then summit',
          totalMiles: roundMileage(saferFinishDays.reduce((sum, day) => sum + day.miles, 0)),
          days: saferFinishDays,
          caveats: [
            'This creates margin for permit, campsite/Birches availability, weather, and a safe summit start.',
            'The summit day total shown is one-way AT mileage; descent/exit is additional and must be planned.'
          ]
        },
        {
          id: 'baxter-compressed-two-day-abol-ksc-summit',
          label: 'Compressed 2-day Baxter finish only if logistics are already locked',
          totalMiles: roundMileage(compressedFinishDays.reduce((sum, day) => sum + day.miles, 0)),
          days: compressedFinishDays,
          caveats: [
            'This is not the default if you still need a permit, The Birches space, campground reservation, shuttle, weather check, or recovery margin.',
            'Do not turn this into an afternoon summit push.'
          ]
        }
      ];
}

function findPointAliasesInOrder(text: string, points: readonly AtRoutePoint[]): readonly AtRoutePoint[] {
  const matches: { readonly point: AtRoutePoint; readonly index: number }[] = [];
  for (const point of points) {
    const indices = point.aliases
      .map((alias) => text.search(aliasPattern(alias)))
      .filter((index) => index >= 0);
    if (indices.length === 0) continue;
    matches.push({ point, index: Math.min(...indices) });
  }
  return matches.sort((left, right) => left.index - right.index).map((match) => match.point);
}

function lineHasRouteSequenceSyntax(line: string): boolean {
  return /(?:→|->|\bto\b|\bthen\b|\bafter\b|\bbefore\b)/iu.test(line);
}

function mileageClaimIssues(answer: string, grounding: AtRouteGrounding): AtRouteClaimIssue[] {
  const issues: AtRouteClaimIssue[] = [];
  const routeMilePattern = /(?:\b(?:route\s*)?mile\s*(\d{3,4}(?:\.\d)?)\b|\b(\d{3,4}(?:\.\d)?)\s*(?:route\s*)?mi\.?\b)/giu;
  for (const point of grounding.corridor) {
    const aliases = point.aliases.map(aliasPattern);
    const snippets = answer
      .split(/\n+/u)
      .filter((line) => {
        routeMilePattern.lastIndex = 0;
        return aliases.some((pattern) => pattern.test(line)) && routeMilePattern.test(line);
      });

    for (const snippet of snippets) {
      routeMilePattern.lastIndex = 0;
      const numbers = [...snippet.matchAll(routeMilePattern)].map((match) => Number.parseFloat(match[1] ?? match[2]));
      const badMiles = numbers.filter((value) => Number.isFinite(value) && Math.abs(value - point.mile) > 0.25);
      if (badMiles.length === 0) continue;
      issues.push({
        kind: 'bad-mileage',
        severity: 'block',
        sourceSystemId: grounding.source.id,
        evidence: snippet.trim(),
        message: `${point.name} was paired with route mile ${badMiles.map(formatAtRouteMileage).join(', ')}, but the validator has ${formatAtRouteMileage(point.mile)}.`
      });
    }
  }
  return issues;
}


function routeTotalMileageClaimIssues(answer: string, grounding: AtRouteGrounding): AtRouteClaimIssue[] {
  if (!grounding.destination) return [];

  const expected = roundMileage(Math.abs(grounding.destination.mile - grounding.start.mile));
  const startAliases = grounding.start.aliases.map(aliasPattern);
  const destinationAliases = grounding.destination.aliases.map(aliasPattern);
  const totalMileagePattern = /(?:~|about|approx(?:imately)?|around)?\s*(\d{1,3}(?:\.\d)?)\s*(?:AT\s*)?(?:miles|mi\.?)/giu;
  const issues: AtRouteClaimIssue[] = [];

  for (const rawLine of answer.split(/\n+|(?<=[.!?])\s+/u)) {
    const line = rawLine.trim();
    if (!line || !startAliases.some((pattern) => pattern.test(line)) || !destinationAliases.some((pattern) => pattern.test(line))) continue;
    totalMileagePattern.lastIndex = 0;
    const claimed = [...line.matchAll(totalMileagePattern)]
      .map((match) => ({ value: Number.parseFloat(match[1] ?? 'NaN'), index: match.index ?? 0 }))
      .filter((claim) => Number.isFinite(claim.value) && claim.value < 300);
    const badClaims = claimed.filter((claim) => {
      if (Math.abs(claim.value - expected) <= 1.5) return false;
      const beforeClaim = line.slice(Math.max(0, claim.index - 32), claim.index);
      return !/\b(?:not|isn'?t|is\s+not|wasn'?t|was\s+not)\b[^.]{0,24}$/iu.test(beforeClaim);
    });
    if (badClaims.length === 0) continue;
    issues.push({
      kind: 'bad-mileage',
      severity: 'block',
      sourceSystemId: grounding.source.id,
      evidence: line,
      message: `${grounding.start.name} → ${grounding.destination.name} was described as ${badClaims.map((claim) => formatAtRouteMileage(claim.value)).join(', ')} mi, but the validator has about ${formatAtRouteMileage(expected)} mi.`
    });
  }

  return issues;
}

function lineMarksOutdatedGuidance(line: string): boolean {
  return /\b(old|outdated|stale|obsolete|no\s+longer|not\s+current|do\s+not\s+use|don't\s+use|replaced|instead\s+of|not\s+the\s+current)\b/iu.test(line);
}


function lineNegatesUnsafeCamping(line: string): boolean {
  return /\b(no|not|never|avoid|prohibit(?:ed)?|illegal|do\s+not|don't|must\s+not|cannot|can't|unless\s+official|unless\s+the\s+official|verify\s+before)\b/iu.test(line);
}

function gsmnpRegulationClaimIssues(answer: string, grounding: AtRouteGrounding): AtRouteClaimIssue[] {
  if (grounding.source.id !== GSMNP_AT_CORRIDOR_QA_SOURCE.id) return [];

  const issues: AtRouteClaimIssue[] = [];
  for (const rawLine of answer.split(/\n+|(?<=[.!?])\s+/u)) {
    const line = rawLine.trim();
    if (!line) continue;

    const recommendsDispersed = /\b(?:stealth|dispersed)\s+camp(?:ing)?\b/iu.test(line) && !lineNegatesUnsafeCamping(line);
    const suggestsShelterOverflowTenting = /\b(?:shelter\s+is\s+full|shelter\s+full|full\s+shelter)\b/iu.test(line)
      && /\b(?:tent|tenting|pitch)\b/iu.test(line)
      && !lineNegatesUnsafeCamping(line);
    const suggestsTentNearShelter = /\b(?:tent|tenting|pitch)\b[^.]{0,80}\b(?:nearby|outside|by\s+the\s+shelter|at\s+the\s+shelter)\b/iu.test(line)
      && !lineNegatesUnsafeCamping(line);
    const suggestsUndesignatedCamping = /\b(?:camp|camping|tent|pitch|set\s+up|sleep)\b[^.]{0,100}\b(?:anywhere|wherever|unofficial|undesignated|near\s+the\s+trail|along\s+the\s+trail|roadside)\b/iu.test(line)
      && !lineNegatesUnsafeCamping(line);
    const suggestsSleepingOutsideShelter = /\b(?:sleep|camp|set\s+up|pitch)\b[^.]{0,100}\boutside\s+(?:the\s+)?shelter\b/iu.test(line)
      && !lineNegatesUnsafeCamping(line);

    if (!recommendsDispersed && !suggestsShelterOverflowTenting && !suggestsTentNearShelter && !suggestsUndesignatedCamping && !suggestsSleepingOutsideShelter) continue;

    issues.push({
      kind: 'unsafe-camping-rule',
      severity: 'block',
      sourceSystemId: grounding.source.id,
      evidence: line,
      message: 'GSMNP camping/shelter wording was too permissive. Section-hiker plans must fail closed: use the site/date-specific permit and do not plan tenting outside/inside shelters unless the current official permit/source explicitly allows it.'
    });
  }

  return issues;
}


function shenandoahRegulationClaimIssues(answer: string, grounding: AtRouteGrounding): AtRouteClaimIssue[] {
  if (grounding.source.id !== SHENANDOAH_AT_CORRIDOR_QA_SOURCE.id) return [];

  const issues: AtRouteClaimIssue[] = [];
  for (const rawLine of answer.split(/\n+|(?<=[.!?])\s+/u)) {
    const line = rawLine.trim();
    if (!line) continue;

    const marksOutdated = lineMarksOutdatedGuidance(line);
    const claimsOldPermitFlow = /\b(?:free\s+backcountry\s+permit|free\s+permit|self[-\s]?registration|paper\s+permit|no\s+advance\s+reservation\s+needed|entrance\s+stations?\s+or\s+visitor\s+centers?|visitor\s+centers?\s+or\s+entrance\s+stations?)\b/iu.test(line)
      && !marksOutdated;
    const claimsNoPermitFee = /\b(?:no\s+fee|free)\b/iu.test(line)
      && /\b(?:permit|backcountry)\b/iu.test(line)
      && !marksOutdated
      && !/\b(?:not|isn'?t|is\s+not|not\s+free|separate\s+from)\b/iu.test(line);

    if (claimsOldPermitFlow || claimsNoPermitFee) {
      issues.push({
        kind: 'stale-permit-rule',
        severity: 'block',
        sourceSystemId: grounding.source.id,
        evidence: line,
        message: 'Shenandoah permit wording appears stale. Current guardrail requires the hiker to use the NPS/Recreation.gov permit flow and not rely on old free/self-registration paper-permit guidance.'
      });
    }

    const suggestsFacilityCamping = /\b(?:camp|camping|tent|pitch|sleep|set\s+up)\b[^.]{0,120}\b(?:wayside|visitor\s+center|parking\s+lot|skyline\s+drive|paved\s+road|facility|building|roadside)\b/iu.test(line)
      && !lineNegatesUnsafeCamping(line);
    const suggestsUnqualifiedHutTenting = /\b(?:tent|tenting|tent\s+pads?|camp|camping|campsites?)\b[^.]{0,100}\b(?:at|near|adjacent\s+to|beside|outside)\b[^.]{0,60}\b(?:hut|shelter)\b/iu.test(line)
      && !lineNegatesUnsafeCamping(line)
      && !/\b(?:designated|current\s+permit|official|setback|verify|if\s+allowed)\b/iu.test(line);
    const suggestsNoSetbackCamping = /\b(?:camp|camping|tent|pitch|set\s+up|sleep)\b[^.]{0,100}\b(?:anywhere|wherever|near\s+the\s+trail|along\s+the\s+trail|roadside|near\s+water)\b/iu.test(line)
      && !lineNegatesUnsafeCamping(line);
    const suggestsBackcountryFire = /\b(?:campfire|fire|fires)\b[^.]{0,100}\b(?:anywhere|at\s+camp|at\s+your\s+campsite|fine|allowed|okay|ok)\b/iu.test(line)
      && !lineNegatesUnsafeCamping(line)
      && !/\b(?:pre-constructed|fireplace|hut|shelter|where\s+officially)\b/iu.test(line);

    if (suggestsFacilityCamping || suggestsUnqualifiedHutTenting || suggestsNoSetbackCamping || suggestsBackcountryFire) {
      issues.push({
        kind: 'unsafe-camping-rule',
        severity: 'block',
        sourceSystemId: grounding.source.id,
        evidence: line,
        message: 'Shenandoah camping/fire wording was too permissive. Plans must fail closed on Recreation.gov/NPS campsite setbacks, facility/road/wayside restrictions, hut/tent assumptions, and backcountry fire limits.'
      });
    }

    const saysTwoLitersEnough = /\b(?:2\s*l|2\s+liters|two\s+liters)\b[^.]{0,120}\b(?:enough|adequate|fine|plenty|sufficient)\b/iu.test(line)
      && /\b(?:july|summer|heat|hot|shenandoah|snp|water)\b/iu.test(line)
      && !/\b(?:not\s+enough|not\s+adequate|too\s+thin|thin|only\s+if|unless|verify|confirmed)\b/iu.test(line);
    const saysNaturalWaterUntreated = /\b(?:natural|spring|stream|creek|source)\b[^.]{0,80}\b(?:no\s+treatment|untreated|without\s+(?:filter|treat|purif))\b/iu.test(line)
      && !lineNegatesUnsafeCamping(line);

    if (saysTwoLitersEnough || saysNaturalWaterUntreated) {
      issues.push({
        kind: 'unsafe-water-plan',
        severity: 'block',
        sourceSystemId: grounding.source.id,
        evidence: line,
        message: 'Shenandoah water wording was too permissive. Late-July 2L plans must be treated as thin until current sources are confirmed, and natural water must be treated.'
      });
    }
  }

  return issues;
}

function baxterRegulationClaimIssues(answer: string, grounding: AtRouteGrounding): AtRouteClaimIssue[] {
  if (grounding.source.id !== BAXTER_KATAHDIN_AT_CORRIDOR_QA_SOURCE.id) return [];

  const issues: AtRouteClaimIssue[] = [];
  for (const rawLine of answer.split(/\n+|(?<=[.!?])\s+/u)) {
    const line = rawLine.trim();
    if (!line) continue;

    const marksOutdated = lineMarksOutdatedGuidance(line);
    const negatesUnsafe = lineNegatesUnsafeCamping(line);
    const mentionsBaxterPermit = /\b(?:baxter|katahdin|long[-\s]?distance|ld|a\.?t\.?|at)\b[^.]{0,120}\bpermit\b/iu.test(line)
      || /\bpermit\b[^.]{0,120}\b(?:baxter|katahdin|long[-\s]?distance|ld|a\.?t\.?|at)\b/iu.test(line);
    const claimsNoPermitNeeded = /\b(?:no|not|don'?t|do\s+not|without|skip)\b[^.]{0,60}\bpermit\b/iu.test(line)
      && mentionsBaxterPermit
      && !marksOutdated
      && !/\b(?:not\s+optional|required|must|before)\b/iu.test(line);
    const claimsOnlineOrWrongPermit = (/\b(?:online|recreation\.gov|atcamp|atc\s+hang\s+tag|hang\s+tag|visitor\s+center|millinocket|abol\s+bridge|headquarters|hq)\b[^.]{0,100}\bpermit\b/iu.test(line)
      || /\bpermit\b[^.]{0,100}\b(?:online|recreation\.gov|atcamp|atc\s+hang\s+tag|hang\s+tag|visitor\s+center|millinocket|abol\s+bridge|headquarters|hq)\b/iu.test(line))
      && mentionsBaxterPermit
      && !marksOutdated
      && !/\b(?:pre[-\s]?registration|not\s+the\s+permit|not\s+enough|not\s+valid|still\s+must|must\s+still|in\s+person|katahdin\s+stream)\b/iu.test(line);
    const claimsPermitAlwaysAvailable = /\bpermit\b[^.]{0,100}\b(?:guaranteed|unlimited|always\s+available|never\s+runs?\s+out)\b/iu.test(line)
      && mentionsBaxterPermit
      && !marksOutdated;
    const claimsBadKtp = /\b(?:ktp|katahdin\s+trailhead\s+pass|day[-\s]?use|parking\s+(?:pass|reservation)|trailhead\s+pass)\b[^.]{0,100}\b(?:not\s+needed|unnecessary|skip|no\s+need)\b/iu.test(line)
      && !/\b(?:camping|camped|reserved\s+camp|night\s+prior|if\s+you\s+camp)\b/iu.test(line)
      && !marksOutdated;

    if (claimsNoPermitNeeded || claimsOnlineOrWrongPermit || claimsPermitAlwaysAvailable || claimsBadKtp) {
      issues.push({
        kind: 'stale-permit-rule',
        severity: 'block',
        sourceSystemId: grounding.source.id,
        evidence: line,
        message: 'Baxter/Katahdin permit or access wording was unsafe. AT hikers must fail closed on the current in-person Long-Distance Hiker Permit at Katahdin Stream and current Baxter access/camping/parking rules.'
      });
    }

    const unsafeBirches = /\b(?:birches|the\s+birches)\b/iu.test(line)
      && /\b(?:guaranteed|anyone|everybody|reservation|reserve|multiple\s+nights?|two\s+nights?|work[-\s]?for[-\s]?stay|work\s+stay|free|no\s+fee|unlimited|more\s+than\s+12|over\s+12|always)\b/iu.test(line)
      && !negatesUnsafe
      && !/\b(?:eligible|space\s+available|if\s+space|12\s+persons|cash|no\s+work)\b/iu.test(line);
    const unsafeBaxterCamping = /\b(?:camp|camping|tent|pitch|sleep|bivy|stealth)\b[^.]{0,120}\b(?:anywhere|wherever|summit|baxter\s+peak|tableland|trailhead|parking\s+lot|roadside|near\s+katahdin\s+stream|near\s+the\s+ranger|outside\s+the\s+campground|without\s+(?:a\s+)?reservation)\b/iu.test(line)
      && !negatesUnsafe;
    const saysWorkForStay = /\bwork[-\s]?for[-\s]?stay\b/iu.test(line)
      && /\b(?:baxter|katahdin|birches)\b/iu.test(line)
      && !negatesUnsafe;

    if (unsafeBirches || unsafeBaxterCamping || saysWorkForStay) {
      issues.push({
        kind: 'unsafe-camping-rule',
        severity: 'block',
        sourceSystemId: grounding.source.id,
        evidence: line,
        message: 'Baxter camping wording was too permissive. Plans must fail closed on The Birches eligibility/12-person capacity/cash fee/no work-for-stay and on reserved legal campsites only.'
      });
    }

    const unsafeLateStart = /\b(?:start|leave|begin|summit\s+push)\b[^.]{0,80}\b(?:after\s+lunch|noon|midday|afternoon|2\s*p\.?m\.?|3\s*p\.?m\.?)\b/iu.test(line)
      && /\b(?:katahdin|baxter|hunt\s+trail|summit)\b/iu.test(line)
      && !/\b(?:avoid|do\s+not|don'?t|too\s+late|turnaround|not\s+safe)\b/iu.test(line);
    const unsafeKnifeEdge = /\bknife\s+edge\b/iu.test(line)
      && /\b(?:after|then|descend|return|loop|add|finish|continue|take)\b/iu.test(line)
      && !negatesUnsafe
      && !/\b(?:official|ranger|weather|closure|separate\s+plan)\b/iu.test(line);
    const unsafeShoulderSeason = /\b(?:late\s+october|after\s+oct(?:ober)?\s*15|after\s+oct(?:ober)?\s*22|november|shoulder\s+season)\b/iu.test(line)
      && /\b(?:fine|okay|ok|open|guaranteed|normal|no\s+issue|safe)\b/iu.test(line)
      && !marksOutdated
      && !/\b(?:not|do\s+not|don'?t|closure|closed|verify|ranger|weather|condition|before\s+oct(?:ober)?\s*15)\b/iu.test(line);
    const dismissesClosures = /\b(?:katahdin|hunt\s+trail|baxter)\b[^.]{0,100}\b(?:will\s+be\s+open|always\s+open|cannot\s+close|won'?t\s+close)\b/iu.test(line)
      && !/\b(?:not|do\s+not|don'?t|verify|may|can|could|temporary|weather|condition)\b/iu.test(line);
    const noHeadlamp = /\b(?:no|don'?t\s+need|skip|without)\b[^.]{0,60}\b(?:headlamp|flashlight|lamp)\b/iu.test(line)
      && /\b(?:katahdin|baxter|hunt\s+trail|summit)\b/iu.test(line)
      && !marksOutdated;

    if (unsafeLateStart || unsafeKnifeEdge || unsafeShoulderSeason || dismissesClosures || noHeadlamp) {
      issues.push({
        kind: 'unsafe-summit-plan',
        severity: 'block',
        sourceSystemId: grounding.source.id,
        evidence: line,
        message: 'Baxter/Katahdin summit wording was too permissive. Plans must fail closed on early starts, turnaround time, current trail/weather closures, headlamp rule, and avoiding non-AT exposed add-ons unless separately verified.'
      });
    }

    const saysOneLiterEnough = /\b(?:1\s*l|1\s+liter|one\s+liter)\b[^.]{0,120}\b(?:enough|adequate|fine|plenty|sufficient)\b/iu.test(line)
      && /\b(?:katahdin|baxter|hunt\s+trail|summit|water)\b/iu.test(line)
      && !/\b(?:not\s+enough|not\s+adequate|too\s+thin|thin|only\s+if|unless|verify|confirmed)\b/iu.test(line);
    const saysNaturalWaterUntreated = /\b(?:natural|spring|stream|brook|source|water)\b[^.]{0,80}\b(?:no\s+treatment|untreated|without\s+(?:filter|treat|purif))\b/iu.test(line)
      && /\b(?:baxter|katahdin|park)\b/iu.test(line)
      && !negatesUnsafe;

    if (saysOneLiterEnough || saysNaturalWaterUntreated) {
      issues.push({
        kind: 'unsafe-water-plan',
        severity: 'block',
        sourceSystemId: grounding.source.id,
        evidence: line,
        message: 'Baxter/Katahdin water wording was too permissive. Katahdin plans must carry at least the official minimum margin, more in heat, and treat natural water.'
      });
    }
  }

  return issues;
}

export function validateAtRouteAnswerClaims(answer: string, grounding: AtRouteGrounding): readonly AtRouteClaimIssue[] {
  const issues: AtRouteClaimIssue[] = [];
  for (const blockedName of grounding.blockedEndpointNames) {
    const evidenceLine = answer
      .split(/\n+|(?<=[.!?])\s+/u)
      .map((line) => line.trim())
      .find((line) => includesNormalized(line, blockedName) && !lineNegatesUnsafeCamping(line));
    if (!evidenceLine) continue;
    issues.push({
      kind: 'blocked-endpoint',
      severity: 'block',
      sourceSystemId: grounding.source.id,
      evidence: evidenceLine,
      message: `${blockedName} appears in the answer but is not validated for this route corridor.`
    });
  }

  const pointOrder = new Map(grounding.corridor.map((point, index) => [point.id, index]));
  for (const rawLine of answer.split(/\n+|(?<=[.!?])\s+/u)) {
    const line = rawLine.trim();
    if (!line || !lineHasRouteSequenceSyntax(line)) continue;
    const mentioned = findPointAliasesInOrder(line, grounding.corridor);
    if (mentioned.length < 2) continue;

    for (let index = 0; index < mentioned.length - 1; index += 1) {
      const from = mentioned[index];
      const to = mentioned[index + 1];
      const fromOrder = pointOrder.get(from.id);
      const toOrder = pointOrder.get(to.id);
      if (fromOrder === undefined || toOrder === undefined || fromOrder === toOrder) continue;
      const ordered = grounding.direction === 'NOBO' ? fromOrder < toOrder : fromOrder > toOrder;
      if (ordered) continue;
      issues.push({
        kind: 'misordered-sequence',
        severity: 'block',
        sourceSystemId: grounding.source.id,
        evidence: line,
        message: `${from.name} → ${to.name} is out of order for ${grounding.direction} from ${grounding.start.name}.`
      });
    }
  }

  issues.push(...mileageClaimIssues(answer, grounding));
  issues.push(...routeTotalMileageClaimIssues(answer, grounding));
  issues.push(...gsmnpRegulationClaimIssues(answer, grounding));
  issues.push(...shenandoahRegulationClaimIssues(answer, grounding));
  issues.push(...baxterRegulationClaimIssues(answer, grounding));
  return issues;
}

export function buildAtRouteGrounding(input: BuildAtRouteGroundingInput): AtRouteGrounding | null {
  const prompt = input.prompt.trim();
  if (!shouldUseStrictAtRouteGrounding(prompt)) return null;

  const mentionedPoints = extractMentionedAtRoutePoints(prompt);
  const mentionedInOrder = findPointAliasesInOrder(prompt, mentionedPoints);
  const start = findAtRoutePoint(input.startQuery)
    ?? mentionedInOrder[0]
    ?? mentionedPoints[0]
    ?? null;
  if (!start) return null;

  const direction = input.direction ?? inferAtRouteDirection(prompt);
  const targetDays = input.targetDays ?? extractAtRouteDayCount(prompt);
  const targetDailyMileage = typeof input.targetDailyMileage === 'number' && Number.isFinite(input.targetDailyMileage) && input.targetDailyMileage > 0
    ? roundMileage(input.targetDailyMileage)
    : null;
  const targetTotalMiles = targetDays && targetDailyMileage ? roundMileage(targetDays * targetDailyMileage) : null;
  const destination = [...mentionedInOrder].reverse().find((point) => point.id !== start.id) ?? null;
  const mentionedCorridorMiles = mentionedPoints.length > 0
    ? Math.max(...mentionedPoints.map((point) => Math.abs(point.mile - start.mile)))
    : 0;
  const maxCorridorMiles = Math.max(
    25,
    input.maxCorridorMiles ?? 0,
    targetTotalMiles ? targetTotalMiles + 10 : 45,
    mentionedCorridorMiles ? mentionedCorridorMiles + 2 : 0
  );
  const corridor = corridorFrom(start, direction, maxCorridorMiles);
  const legs = legsFor(corridor, direction);
  const unrecognizedNames = extractUnrecognizedAtRouteNames(prompt);
  const isPineGrove = start.id === 'pine-grove-furnace-state-park-pa';
  const isGsmnp = start.id === 'fontana-dam-nc' || corridor.some((point) => point.id === 'newfound-gap-tn-nc');
  const isShenandoah = corridor.some((point) => SHENANDOAH_AT_POINT_IDS.includes(point.id as typeof SHENANDOAH_AT_POINT_IDS[number]));
  const isBaxterKatahdin = corridor.some((point) => BAXTER_KATAHDIN_AT_POINT_IDS.includes(point.id as typeof BAXTER_KATAHDIN_AT_POINT_IDS[number]));
  const hasShenandoahHeatWaterConstraint = /\b(?:2\s*l|2\s+liters|two\s+liters|late\s+july|july|summer|heat|hot)\b/iu.test(prompt);
  const isSwiftRunRequest = destination?.id === 'swift-run-gap-va' || start.id === 'swift-run-gap-va' || includesNormalized(prompt, 'swift run gap');
  const source = isGsmnp
    ? GSMNP_AT_CORRIDOR_QA_SOURCE
    : isShenandoah
      ? SHENANDOAH_AT_CORRIDOR_QA_SOURCE
      : isBaxterKatahdin
        ? BAXTER_KATAHDIN_AT_CORRIDOR_QA_SOURCE
        : AT_ROUTE_QA_SOURCE;
  const blockedEndpointNames = isPineGrove
    ? [...KNOWN_BLOCKED_PINE_GROVE_ENDPOINTS]
    : isShenandoah && isSwiftRunRequest
      ? [...KNOWN_BLOCKED_SHENANDOAH_SWIFT_ENDPOINTS]
      : isBaxterKatahdin
        ? [...KNOWN_BLOCKED_BAXTER_FINISH_ENDPOINTS]
        : [];
  const planOptions = isPineGrove
    ? buildPineGrovePlanOptions(direction)
    : isGsmnp
      ? buildGsmnpPlanOptions(direction)
      : isShenandoah
        ? buildShenandoahPlanOptions(direction)
        : isBaxterKatahdin && (start.id === 'abol-bridge-me' || start.id === 'katahdin-stream-campground-me')
          ? buildBaxterKatahdinPlanOptions(direction)
          : [];
  const warnings = [
    source.exactMileageCaveat,
    direction === 'NOBO' && isPineGrove
      ? 'NOBO order guardrail: Boiling Springs comes before Darlington from Pine Grove Furnace.'
      : null,
    direction === 'NOBO' && isGsmnp
      ? 'GSMNP regulation guardrail: a section hiker should assume site/date-specific backcountry permits, designated shelters/campsites only, and no tenting outside a shelter unless the official permit/source explicitly allows it.'
      : null,
    isShenandoah
      ? 'Shenandoah regulation guardrail: use current NPS/Recreation.gov permit rules, campsite setbacks, food-storage/fire rules, and current water/closure checks; do not rely on old free/self-registration permit guidance.'
      : null,
    isShenandoah && isSwiftRunRequest
      ? "Swift Run route-order guardrail: Big Meadows and Byrd's Nest #3 are north of Swift Run Gap and must not be used as endpoints for a Rockfish Gap ↔ Swift Run Gap plan."
      : null,
    isShenandoah && hasShenandoahHeatWaterConstraint
      ? 'Late-July/2L water guardrail: treat 2L as thin until current water sources are confirmed; all natural water must be treated.'
      : null,
    isBaxterKatahdin
      ? 'Baxter/Katahdin permit guardrail: all AT hikers must secure the current Long-Distance Hiker Permit in person at Katahdin Stream before summiting; pre-registration cards, ATC registration, and online campground reservations are not substitutes.'
      : null,
    isBaxterKatahdin
      ? 'Baxter camping guardrail: The Birches is only for eligible NOBO hikers if space is available, is capped at 12 persons/night, requires the current cash fee, and has no work-for-stay.'
      : null,
    isBaxterKatahdin
      ? 'Baxter access/season guardrail: Katahdin trails can close for weather/conditions, shoulder-season closures apply, summer camping is not available after the posted October cutoff, and Baxter recommends AT hikers summit before October 15.'
      : null,
    isBaxterKatahdin
      ? 'Katahdin summit guardrail: treat the Hunt Trail summit as a very strenuous 8-12 hour round-trip/exit day with an early start, turnaround time, headlamp, at least 2 quarts water per person, treated natural water, and current ranger/forecast checks.'
      : null,
    blockedEndpointNames.length > 0
      ? `${blockedEndpointNames.join(', ')} is not in this validator corridor and must not be used as a firm endpoint without another source.`
      : null,
    unrecognizedNames.length > 0
      ? `Prompt mentioned unrecognized route names: ${unrecognizedNames.join(', ')}.`
      : null
  ].filter((warning): warning is string => Boolean(warning));

  return {
    source,
    direction,
    state: isGsmnp ? 'NC/TN' : start.state || null,
    start,
    destination,
    targetDays,
    targetDailyMileage,
    targetTotalMiles,
    corridor,
    legs,
    mentionedPoints,
    unrecognizedNames,
    blockedEndpointNames,
    planOptions,
    warnings
  };
}
