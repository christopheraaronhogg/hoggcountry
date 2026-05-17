import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { basename, extname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

import { summarize } from '@hoggcountry/manual-core';
import type { PublicCorpusEntry } from '@hoggcountry/corpus';

export const REFERENCE_CATEGORIES = [
  'water',
  'shelters',
  'campsites',
  'privies',
  'vistas',
  'trailheads',
  'resupply',
  'terrain',
  'rules',
  'live-sources',
] as const;

export type ReferenceCategory = (typeof REFERENCE_CATEGORIES)[number];
export type Direction = 'NOBO' | 'SOBO';

interface ReferenceSummary {
  readonly generatedAt?: string;
  readonly sourceManifest?: {
    readonly totalSources?: number;
    readonly licenseStatusCounts?: Record<string, number>;
    readonly blockedSourceIds?: readonly string[];
    readonly liveApiSourceIds?: readonly string[];
    readonly lastCheckedDates?: readonly string[];
  };
  readonly route?: {
    readonly routeId?: string;
    readonly name?: string;
    readonly sourceUrl?: string;
    readonly licenseStatus?: string;
    readonly attribution?: string;
    readonly confidence?: string;
    readonly lastChecked?: string;
    readonly measuredLengthMiles?: number;
    readonly officialReferenceLengthMiles?: number;
    readonly officialReferenceDate?: string;
    readonly candidateStatus?: string;
    readonly knownQualityFlags?: readonly string[];
    readonly aiAnswerRule?: string;
  };
  readonly datasets?: readonly {
    readonly id: string;
    readonly label: string;
    readonly category: string;
    readonly recordCount?: number;
    readonly confidence?: string;
    readonly lastChecked?: string;
    readonly aiAnswerRule?: string;
  }[];
}

type JsonRecord = Record<string, unknown>;

export interface SourceReceipt {
  readonly label: string;
  readonly status: string;
  readonly href?: string;
}

export interface ReferenceCandidate {
  readonly id: string;
  readonly kind: ReferenceCategory;
  readonly name: string;
  readonly mileNobo: number;
  readonly distanceAheadMiles: number;
  readonly offTrailDistanceMiles?: number;
  readonly offTrailDistanceFt?: number;
  readonly lat?: number;
  readonly lon?: number;
  readonly details: readonly string[];
  readonly confidence?: string;
  readonly aiAnswerRule?: string;
  readonly sourceReceipt: SourceReceipt;
}

export interface TerrainSegment {
  readonly id: string;
  readonly startMileNobo: number;
  readonly endMileNobo: number;
  readonly gainFt?: number;
  readonly lossFt?: number;
  readonly highestPointFt?: number;
  readonly lowestPointFt?: number;
  readonly averageGradePercent?: number;
  readonly gradeDirection?: string;
  readonly limitation?: string;
  readonly sourceReceipt: SourceReceipt;
}

export interface ReferenceRule {
  readonly id: string;
  readonly jurisdiction: string;
  readonly state?: readonly string[];
  readonly policy?: string;
  readonly permitRequired?: string;
  readonly feeRequired?: string;
  readonly aiAnswerRule?: string;
  readonly sourceReceipt: SourceReceipt;
}

export interface LiveConditionSource {
  readonly id: string;
  readonly name: string;
  readonly categories: readonly string[];
  readonly updateCadence?: string;
  readonly aiAnswerRule?: string;
  readonly sourceReceipt: SourceReceipt;
}

export interface TrailReferenceContext {
  readonly currentMile: number;
  readonly direction: Direction;
  readonly radiusMiles: number;
  readonly mode: 'nearby' | 'ahead';
  readonly categories: Partial<Record<ReferenceCategory, readonly ReferenceCandidate[]>>;
  readonly terrain?: {
    readonly elevationSegments: readonly TerrainSegment[];
    readonly gradeRisks: readonly TerrainSegment[];
  };
  readonly rules?: readonly ReferenceRule[];
  readonly liveSources?: readonly LiveConditionSource[];
  readonly caveats: readonly string[];
  readonly sourceReceipts: readonly SourceReceipt[];
}

export interface SectionReference {
  readonly startMile: number;
  readonly endMile: number;
  readonly direction: Direction;
  readonly distanceMiles: number;
  readonly nearby: Partial<Record<ReferenceCategory, readonly ReferenceCandidate[]>>;
  readonly terrain: {
    readonly elevationSegments: readonly TerrainSegment[];
    readonly gradeRisks: readonly TerrainSegment[];
  };
  readonly caveats: readonly string[];
  readonly sourceReceipts: readonly SourceReceipt[];
}

const AT_REFERENCE_ROOT = fileURLToPath(new URL('../../../data/at-open-reference/', import.meta.url));
const DEFAULT_LIMIT = 8;

function readReferenceJson<T>(relativePath: string): T {
  return JSON.parse(readFileSync(join(AT_REFERENCE_ROOT, relativePath), 'utf8')) as T;
}

const referenceSummary = readReferenceJson<ReferenceSummary>('processed/summary/scout_offline_reference_summary.json');
const waterCandidates = readReferenceJson<JsonRecord[]>('processed/water/water_candidates.json');
const shelters = readReferenceJson<JsonRecord[]>('processed/waypoints/shelters.json');
const campsites = readReferenceJson<JsonRecord[]>('processed/waypoints/campsites.json');
const privies = readReferenceJson<JsonRecord[]>('processed/waypoints/privies.json');
const vistas = readReferenceJson<JsonRecord[]>('processed/waypoints/vistas.json');
const trailheads = readReferenceJson<JsonRecord[]>('processed/access/trailheads.json');
const resupplyCandidates = readReferenceJson<JsonRecord[]>('processed/towns_resupply/towns_within_15mi.json');
const elevationSegments = readReferenceJson<JsonRecord[]>('processed/elevation/climbs_descents_by_25mi_segment_1_0mi.json');
const gradeRiskSections = readReferenceJson<JsonRecord[]>('processed/elevation/grade_risk_sections_1_0mi.json');
const campingRules = readReferenceJson<JsonRecord[]>('processed/camping_rules/rules_by_state.json');
const permitRules = readReferenceJson<JsonRecord[]>('processed/permits_fees/permit_required_sections.json');
const feeRules = readReferenceJson<JsonRecord[]>('processed/permits_fees/fee_required_sections.json');
const liveConditionSources = readReferenceJson<JsonRecord[]>('processed/live_alerts/live_condition_sources.json');

const candidateData: Record<Exclude<ReferenceCategory, 'terrain' | 'rules' | 'live-sources'>, readonly JsonRecord[]> = {
  water: waterCandidates,
  shelters,
  campsites,
  privies,
  vistas,
  trailheads,
  resupply: resupplyCandidates,
};

function asString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

function asNumber(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

function asStringArray(value: unknown): string[] {
  if (Array.isArray(value)) return value.filter((item): item is string => typeof item === 'string');
  const single = asString(value);
  return single ? [single] : [];
}

function round(value: number, places = 1): number {
  const factor = 10 ** places;
  return Math.round(value * factor) / factor;
}

function recordMileNobo(record: JsonRecord): number | undefined {
  return asNumber(record.mile_nobo) ?? asNumber(record.start_mile_nobo);
}

function distanceAhead(recordMile: number, currentMile: number, direction: Direction): number {
  return direction === 'SOBO' ? currentMile - recordMile : recordMile - currentMile;
}

function sourceReceipt(record: JsonRecord, fallbackLabel = 'AT open reference pack'): SourceReceipt {
  const source = asString(record.source) ?? asString(record.source_id) ?? fallbackLabel;
  const confidence = asString(record.confidence);
  const checked = asString(record.last_checked) ?? asString(record.lastChecked);
  const license = asString(record.license_status) ?? asString(record.licenseStatus);
  const status = [confidence, checked ? `checked ${checked}` : undefined, license].filter(Boolean).join('; ');

  return {
    label: source,
    status: status || 'source-backed candidate',
    href: asString(record.source_url) ?? asString(record.sourceUrl),
  };
}

function candidateId(record: JsonRecord, category: ReferenceCategory): string {
  return (
    asString(record.water_id)
    ?? asString(record.waypoint_id)
    ?? asString(record.access_id)
    ?? asString(record.town_id)
    ?? asString(record.segment_id)
    ?? asString(record.rule_id)
    ?? `${category}-${asNumber(record.mile_nobo) ?? 'unknown'}-${asString(record.name) ?? 'candidate'}`
  );
}

function candidateName(record: JsonRecord, category: ReferenceCategory): string {
  const name = asString(record.name);
  if (name) return name;

  switch (category) {
    case 'water':
      return 'Mapped water candidate';
    case 'shelters':
      return 'Mapped shelter candidate';
    case 'campsites':
      return 'Mapped campsite candidate';
    case 'privies':
      return 'Mapped privy/toilet candidate';
    case 'vistas':
      return 'Mapped vista candidate';
    case 'trailheads':
      return 'Mapped trailhead candidate';
    case 'resupply':
      return 'Mapped town/resupply candidate';
    default:
      return 'Mapped AT candidate';
  }
}

function detailLine(label: string, value: unknown): string | undefined {
  if (value === null || value === undefined || value === '') return undefined;
  return `${label}: ${String(value)}`;
}

function candidateDetails(record: JsonRecord, category: ReferenceCategory): string[] {
  if (category === 'water') {
    return [
      detailLine('Flow', record.flow),
      detailLine('Reliability', record.reliability),
      detailLine('Potability', record.potable),
      detailLine('Seasonal note', record.seasonal),
    ].filter((line): line is string => Boolean(line));
  }

  if (category === 'shelters') {
    return [
      detailLine('Capacity', record.capacity),
      detailLine('Water nearby', record.water_nearby),
      detailLine('Privy', record.privy),
      detailLine('Operator', record.operator),
    ].filter((line): line is string => Boolean(line));
  }

  if (category === 'resupply') {
    const services = typeof record.candidate_services === 'object' && record.candidate_services
      ? Object.entries(record.candidate_services as Record<string, unknown>)
          .map(([key, value]) => `${key}: ${String(value)}`)
          .join(', ')
      : undefined;

    return [
      detailLine('Place type', record.place_type),
      detailLine('Access', record.access_type),
      detailLine('Distance from trail', asNumber(record.distance_from_trail_miles) !== undefined ? `${asNumber(record.distance_from_trail_miles)} mi` : undefined),
      services ? `Candidate services: ${services}` : undefined,
    ].filter((line): line is string => Boolean(line));
  }

  return [
    detailLine('Type', record.type),
    detailLine('State', record.state),
    detailLine('OSM type', record.osm_type),
  ].filter((line): line is string => Boolean(line));
}

function formatCandidate(
  category: Exclude<ReferenceCategory, 'terrain' | 'rules' | 'live-sources'>,
  record: JsonRecord,
  currentMile: number,
  direction: Direction,
): ReferenceCandidate | null {
  const mileNobo = recordMileNobo(record);
  if (mileNobo === undefined) return null;

  return {
    id: candidateId(record, category),
    kind: category,
    name: candidateName(record, category),
    mileNobo: round(mileNobo, 1),
    distanceAheadMiles: round(distanceAhead(mileNobo, currentMile, direction), 1),
    offTrailDistanceMiles: asNumber(record.distance_from_trail_miles),
    offTrailDistanceFt: asNumber(record.distance_from_route_ft) ?? asNumber(record.distance_from_trail_ft),
    lat: asNumber(record.lat),
    lon: asNumber(record.lon),
    details: candidateDetails(record, category),
    confidence: asString(record.confidence),
    aiAnswerRule: asString(record.ai_answer_rule),
    sourceReceipt: sourceReceipt(record),
  };
}

function findCandidates(
  category: Exclude<ReferenceCategory, 'terrain' | 'rules' | 'live-sources'>,
  currentMile: number,
  direction: Direction,
  radiusMiles: number,
  options: { readonly forwardOnly?: boolean; readonly limit?: number } = {},
): ReferenceCandidate[] {
  const limit = options.limit ?? DEFAULT_LIMIT;

  return candidateData[category]
    .map((record) => formatCandidate(category, record, currentMile, direction))
    .filter((candidate): candidate is ReferenceCandidate => {
      if (!candidate) return false;
      if (options.forwardOnly) return candidate.distanceAheadMiles >= -0.1 && candidate.distanceAheadMiles <= radiusMiles;
      return Math.abs(candidate.distanceAheadMiles) <= radiusMiles;
    })
    .sort((left, right) => {
      if (options.forwardOnly) return left.distanceAheadMiles - right.distanceAheadMiles;
      return Math.abs(left.distanceAheadMiles) - Math.abs(right.distanceAheadMiles);
    })
    .slice(0, limit);
}

function terrainReceipt(record: JsonRecord): SourceReceipt {
  return sourceReceipt(record, 'USGS 3DEP terrain model');
}

function formatElevationSegment(record: JsonRecord): TerrainSegment | null {
  const start = asNumber(record.start_mile_nobo);
  const end = asNumber(record.end_mile_nobo);
  if (start === undefined || end === undefined) return null;

  return {
    id: asString(record.segment_id) ?? `terrain-${start}-${end}`,
    startMileNobo: round(start, 1),
    endMileNobo: round(end, 1),
    gainFt: asNumber(record.elevation_gain_ft),
    lossFt: asNumber(record.elevation_loss_ft),
    highestPointFt: asNumber(record.highest_point_ft),
    lowestPointFt: asNumber(record.lowest_point_ft),
    averageGradePercent: asNumber(record.average_grade_percent),
    gradeDirection: asString(record.grade_direction),
    limitation: asString(record.limitation),
    sourceReceipt: terrainReceipt(record),
  };
}

function overlapsRange(record: JsonRecord, startMile: number, endMile: number): boolean {
  const start = asNumber(record.start_mile_nobo);
  const end = asNumber(record.end_mile_nobo);
  if (start === undefined || end === undefined) return false;
  const rangeStart = Math.min(startMile, endMile);
  const rangeEnd = Math.max(startMile, endMile);
  return start <= rangeEnd && end >= rangeStart;
}

function terrainForRange(startMile: number, endMile: number): { elevationSegments: TerrainSegment[]; gradeRisks: TerrainSegment[] } {
  const elevation = elevationSegments
    .filter((record) => overlapsRange(record, startMile, endMile))
    .map(formatElevationSegment)
    .filter((record): record is TerrainSegment => Boolean(record))
    .slice(0, 8);

  const gradeRisks = gradeRiskSections
    .filter((record) => overlapsRange(record, startMile, endMile))
    .map(formatElevationSegment)
    .filter((record): record is TerrainSegment => Boolean(record))
    .sort((left, right) => Math.abs(right.averageGradePercent ?? 0) - Math.abs(left.averageGradePercent ?? 0))
    .slice(0, 8);

  return { elevationSegments: elevation, gradeRisks };
}

function formatRule(record: JsonRecord): ReferenceRule {
  const state = asStringArray(record.state);

  return {
    id: asString(record.rule_id) ?? asString(record.jurisdiction) ?? 'rule',
    jurisdiction: asString(record.jurisdiction) ?? 'Unknown jurisdiction',
    state: state.length ? state : undefined,
    policy: asString(record.camping_policy),
    permitRequired: asString(record.permit_required),
    feeRequired: asString(record.fee_required),
    aiAnswerRule: asString(record.ai_answer_rule),
    sourceReceipt: sourceReceipt(record, 'Official land manager source'),
  };
}

function rulesForState(state: string | undefined): ReferenceRule[] {
  if (!state) return [];
  const normalized = state.toUpperCase();
  return [...campingRules, ...permitRules, ...feeRules]
    .filter((record) => asStringArray(record.state).map((candidate) => candidate.toUpperCase()).includes(normalized))
    .map(formatRule);
}

function formatLiveSource(record: JsonRecord): LiveConditionSource {
  return {
    id: asString(record.source_id) ?? asString(record.name) ?? 'live-source',
    name: asString(record.name) ?? 'Live condition source',
    categories: asStringArray(record.categories),
    updateCadence: asString(record.update_cadence),
    aiAnswerRule: asString(record.ai_answer_rule),
    sourceReceipt: sourceReceipt(record, 'Official live condition source'),
  };
}

function referenceCaveats(): string[] {
  return [
    referenceSummary.route?.aiAnswerRule,
    'Water records are mapped candidates with unknown reliability and unknown potability unless a licensed current source says otherwise.',
    'Shelter, campsite, trailhead, vista, privy, and town records are open-data candidates. Verify current access, fees, services, and land-manager rules before field reliance.',
    'Weather, closures, flooding, fire/smoke, bear activity, permit changes, and Katahdin/Baxter access require live official checks.',
  ].filter((line): line is string => Boolean(line));
}

function referenceSourceReceipts(): SourceReceipt[] {
  return [
    {
      label: 'Scout AT open reference summary',
      status: `generated ${referenceSummary.generatedAt ?? 'unknown'}; ${referenceSummary.sourceManifest?.totalSources ?? 0} source records`,
    },
    {
      label: referenceSummary.route?.name ?? 'AT open route candidate',
      status: [
        referenceSummary.route?.confidence,
        referenceSummary.route?.lastChecked ? `checked ${referenceSummary.route.lastChecked}` : undefined,
        referenceSummary.route?.licenseStatus,
        referenceSummary.route?.attribution,
      ].filter(Boolean).join('; '),
      href: referenceSummary.route?.sourceUrl,
    },
  ];
}

function walkMarkdownFiles(dir: string): string[] {
  if (!existsSync(dir)) return [];

  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return walkMarkdownFiles(path);
    return entry.isFile() && extname(entry.name) === '.md' ? [path] : [];
  });
}

function titleFromMarkdown(text: string, fallback: string): string {
  return text.match(/^#\s+(.+)$/mu)?.[1]?.trim() ?? fallback;
}

function headersFromMarkdown(text: string): string {
  return Array.from(text.matchAll(/^#{2,3}\s+(.+)$/gmu))
    .map((match) => match[1].trim())
    .slice(0, 12)
    .join(' | ');
}

function corpusIdForPath(path: string): string {
  return `at-open-reference:${relative(AT_REFERENCE_ROOT, path).replace(/[^a-z0-9]+/giu, '-').replace(/^-|-$/gu, '').toLowerCase()}`;
}

function buildReferenceCorpus(): PublicCorpusEntry[] {
  const docsRoot = join(AT_REFERENCE_ROOT, 'rag_docs');
  const markdownEntries = walkMarkdownFiles(docsRoot).map((path): PublicCorpusEntry => {
    const text = readFileSync(path, 'utf8');
    const title = titleFromMarkdown(text, basename(path, '.md').replace(/[-_]+/gu, ' '));

    return {
      id: corpusIdForPath(path),
      title,
      description: summarize(text.replace(/^#\s+.+$/mu, ''), 180),
      content: text,
      headers: headersFromMarkdown(text),
      href: '/app/scout',
      sourceLabel: 'AT Open Reference Pack',
    };
  });

  const datasetLines = referenceSummary.datasets
    ?.map((dataset) => `${dataset.label}: ${dataset.recordCount ?? 'unknown'} records; ${dataset.confidence ?? 'unknown confidence'}; ${dataset.aiAnswerRule ?? ''}`)
    .join('\n') ?? '';

  const liveLines = liveConditionSources
    .map((source) => `${asString(source.name) ?? asString(source.source_id) ?? 'Live source'}: ${asStringArray(source.categories).join(', ')}; ${asString(source.ai_answer_rule) ?? ''}`)
    .join('\n');

  return [
    {
      id: 'at-open-reference:summary',
      title: 'Scout AT Open Reference Pack Summary',
      description: 'Dataset inventory, source license status, route candidate caveats, and live-condition boundaries for Scout.',
      content: [
        `Generated: ${referenceSummary.generatedAt ?? 'unknown'}`,
        `Route: ${referenceSummary.route?.name ?? 'unknown'} (${referenceSummary.route?.candidateStatus ?? 'candidate'})`,
        `Measured open-route miles: ${referenceSummary.route?.measuredLengthMiles ?? 'unknown'}`,
        `Official reference miles: ${referenceSummary.route?.officialReferenceLengthMiles ?? 'unknown'} (${referenceSummary.route?.officialReferenceDate ?? 'unknown'})`,
        `Route answer rule: ${referenceSummary.route?.aiAnswerRule ?? ''}`,
        'Datasets:',
        datasetLines,
        'Live condition sources:',
        liveLines,
        'Caveats:',
        ...referenceCaveats(),
      ].join('\n\n'),
      headers: 'Route caveats | Dataset inventory | Live condition sources | AI answer rules',
      href: '/app/scout',
      sourceLabel: 'AT Open Reference Pack',
    },
    ...markdownEntries,
  ];
}

export const atReferenceCorpus: readonly PublicCorpusEntry[] = buildReferenceCorpus();

export function buildReferenceSnapshot(focus: 'inventory' | 'route-caveats' | 'live-sources' | 'all' = 'all') {
  const liveSources = liveConditionSources.map(formatLiveSource);

  return {
    focus,
    generatedAt: referenceSummary.generatedAt,
    route: referenceSummary.route,
    sourceManifest: referenceSummary.sourceManifest,
    datasets: focus === 'route-caveats'
      ? []
      : referenceSummary.datasets?.map((dataset) => ({
          id: dataset.id,
          label: dataset.label,
          category: dataset.category,
          recordCount: dataset.recordCount,
          confidence: dataset.confidence,
          lastChecked: dataset.lastChecked,
          aiAnswerRule: dataset.aiAnswerRule,
        })) ?? [],
    liveSources: focus === 'inventory' || focus === 'route-caveats' ? [] : liveSources,
    caveats: referenceCaveats(),
    sourceReceipts: referenceSourceReceipts(),
  };
}

export function findTrailReferenceContext(args: {
  readonly currentMile: number;
  readonly direction: Direction;
  readonly radiusMiles?: number;
  readonly categories?: readonly ReferenceCategory[];
  readonly forwardOnly?: boolean;
  readonly state?: string;
  readonly limit?: number;
}): TrailReferenceContext {
  const radiusMiles = args.radiusMiles ?? 8;
  const categories = args.categories?.length ? args.categories : REFERENCE_CATEGORIES;
  const candidateCategories = categories.filter(
    (category): category is Exclude<ReferenceCategory, 'terrain' | 'rules' | 'live-sources'> =>
      category !== 'terrain' && category !== 'rules' && category !== 'live-sources',
  );

  const foundCategories = Object.fromEntries(
    candidateCategories.map((category) => [
      category,
      findCandidates(category, args.currentMile, args.direction, radiusMiles, {
        forwardOnly: args.forwardOnly,
        limit: args.limit,
      }),
    ]),
  ) as Partial<Record<ReferenceCategory, readonly ReferenceCandidate[]>>;

  const terrain = categories.includes('terrain')
    ? terrainForRange(args.currentMile - radiusMiles, args.currentMile + radiusMiles)
    : undefined;

  const rules = categories.includes('rules') ? rulesForState(args.state) : undefined;
  const liveSources = categories.includes('live-sources') ? liveConditionSources.map(formatLiveSource) : undefined;

  return {
    currentMile: round(args.currentMile, 1),
    direction: args.direction,
    radiusMiles,
    mode: args.forwardOnly ? 'ahead' : 'nearby',
    categories: foundCategories,
    terrain,
    rules,
    liveSources,
    caveats: referenceCaveats(),
    sourceReceipts: referenceSourceReceipts(),
  };
}

function sectionCandidates(
  category: Exclude<ReferenceCategory, 'terrain' | 'rules' | 'live-sources'>,
  startMile: number,
  endMile: number,
  direction: Direction,
  limit: number,
): ReferenceCandidate[] {
  const low = Math.min(startMile, endMile);
  const high = Math.max(startMile, endMile);
  const current = direction === 'SOBO' ? high : low;

  return candidateData[category]
    .filter((record) => {
      const mile = recordMileNobo(record);
      return mile !== undefined && mile >= low && mile <= high;
    })
    .map((record) => formatCandidate(category, record, current, direction))
    .filter((candidate): candidate is ReferenceCandidate => Boolean(candidate))
    .sort((left, right) => Math.abs(left.distanceAheadMiles) - Math.abs(right.distanceAheadMiles))
    .slice(0, limit);
}

export function buildSectionReference(args: {
  readonly startMile: number;
  readonly endMile: number;
  readonly direction: Direction;
  readonly categories?: readonly ReferenceCategory[];
  readonly limit?: number;
}): SectionReference {
  const categories = args.categories?.length ? args.categories : ['water', 'shelters', 'campsites', 'resupply', 'terrain'];
  const limit = args.limit ?? 10;
  const candidateCategories = categories.filter(
    (category): category is Exclude<ReferenceCategory, 'terrain' | 'rules' | 'live-sources'> =>
      category !== 'terrain' && category !== 'rules' && category !== 'live-sources',
  );

  const nearby = Object.fromEntries(
    candidateCategories.map((category) => [category, sectionCandidates(category, args.startMile, args.endMile, args.direction, limit)]),
  ) as Partial<Record<ReferenceCategory, readonly ReferenceCandidate[]>>;

  return {
    startMile: round(args.startMile, 1),
    endMile: round(args.endMile, 1),
    direction: args.direction,
    distanceMiles: round(Math.abs(args.endMile - args.startMile), 1),
    nearby,
    terrain: terrainForRange(args.startMile, args.endMile),
    caveats: referenceCaveats(),
    sourceReceipts: referenceSourceReceipts(),
  };
}
