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

export type AtRouteClaimIssueKind = 'blocked-endpoint' | 'misordered-sequence' | 'bad-mileage';

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

export const AT_ROUTE_REFERENCE_POINTS: readonly AtRoutePoint[] = [
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
  }
] as const;

const KNOWN_BLOCKED_PINE_GROVE_ENDPOINTS = ['Tagg Run Shelter'] as const;

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
  { label: 'Tagg Run Shelter', pattern: /\btagg\s+run(?:\s+shelter)?\b/iu }
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
  const digitMatch = prompt.match(/\b(\d{1,2})\s*(?:-\s*)?(?:day|days)\b/iu);
  if (digitMatch?.[1]) {
    const days = Number.parseInt(digitMatch[1], 10);
    return Number.isFinite(days) && days > 0 && days <= 30 ? days : null;
  }

  const wordMatch = prompt.match(/\b(one|two|three|four|five|six|seven)\s*(?:-\s*)?(?:day|days)\b/iu);
  if (!wordMatch?.[1]) return null;
  const wordDays: Record<string, number> = { one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7 };
  return wordDays[wordMatch[1].toLowerCase()] ?? null;
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

export function validateAtRouteAnswerClaims(answer: string, grounding: AtRouteGrounding): readonly AtRouteClaimIssue[] {
  const issues: AtRouteClaimIssue[] = [];
  for (const blockedName of grounding.blockedEndpointNames) {
    if (!includesNormalized(answer, blockedName)) continue;
    issues.push({
      kind: 'blocked-endpoint',
      severity: 'block',
      sourceSystemId: grounding.source.id,
      evidence: blockedName,
      message: `${blockedName} appears in the answer but is not validated for this route corridor.`
    });
  }

  const pointOrder = new Map(grounding.corridor.map((point, index) => [point.id, index]));
  for (const rawLine of answer.split(/\n+/u)) {
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
  return issues;
}

export function buildAtRouteGrounding(input: BuildAtRouteGroundingInput): AtRouteGrounding | null {
  const prompt = input.prompt.trim();
  if (!shouldUseStrictAtRouteGrounding(prompt)) return null;

  const mentionedPoints = extractMentionedAtRoutePoints(prompt);
  const start = findAtRoutePoint(input.startQuery)
    ?? mentionedPoints.find((point) => point.kind === 'park' || point.kind === 'town' || point.kind === 'road-crossing')
    ?? mentionedPoints[0]
    ?? null;
  if (!start) return null;

  const direction = input.direction ?? inferAtRouteDirection(prompt);
  const targetDays = input.targetDays ?? extractAtRouteDayCount(prompt);
  const targetDailyMileage = typeof input.targetDailyMileage === 'number' && Number.isFinite(input.targetDailyMileage) && input.targetDailyMileage > 0
    ? roundMileage(input.targetDailyMileage)
    : null;
  const targetTotalMiles = targetDays && targetDailyMileage ? roundMileage(targetDays * targetDailyMileage) : null;
  const maxCorridorMiles = Math.max(
    25,
    input.maxCorridorMiles ?? 0,
    targetTotalMiles ? targetTotalMiles + 10 : 45
  );
  const corridor = corridorFrom(start, direction, maxCorridorMiles);
  const legs = legsFor(corridor, direction);
  const unrecognizedNames = extractUnrecognizedAtRouteNames(prompt);
  const blockedEndpointNames = start.id === 'pine-grove-furnace-state-park-pa' ? [...KNOWN_BLOCKED_PINE_GROVE_ENDPOINTS] : [];
  const planOptions = start.id === 'pine-grove-furnace-state-park-pa' ? buildPineGrovePlanOptions(direction) : [];
  const warnings = [
    AT_ROUTE_QA_SOURCE.exactMileageCaveat,
    direction === 'NOBO' && start.id === 'pine-grove-furnace-state-park-pa'
      ? 'NOBO order guardrail: Boiling Springs comes before Darlington from Pine Grove Furnace.'
      : null,
    blockedEndpointNames.length > 0
      ? `${blockedEndpointNames.join(', ')} is not in this validator corridor and must not be used as a firm endpoint without another source.`
      : null,
    unrecognizedNames.length > 0
      ? `Prompt mentioned unrecognized route names: ${unrecognizedNames.join(', ')}.`
      : null
  ].filter((warning): warning is string => Boolean(warning));

  return {
    source: AT_ROUTE_QA_SOURCE,
    direction,
    state: start.state || null,
    start,
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
