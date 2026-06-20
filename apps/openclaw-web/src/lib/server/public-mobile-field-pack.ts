import { loadScoutAtOpenReferenceOfflineSummary } from '$lib/server/at-open-reference';
import { loadDadPilotSummary, type DadPilotSummary } from '$lib/server/dad';
import { loadReferencePack } from '$lib/server/map-pack';
import type { TrailMapWaypoint } from '$lib/map-pack-types';

const TOTAL_AT_MILES = 2197.4;
const PACK_VALID_MS = 6 * 60 * 60 * 1000;
const PILOT_CURRENT_MILE = 582.4;
const PILOT_GENERATED_AT = '2026-06-16T00:00:00.000Z';
const TRAIL_AHEAD_MILES = 36;
const TOWN_LOOKAHEAD_MILES = 80;
const MAX_WATER_POINTS = 12;
const MAX_SHELTERS = 8;
const MAX_TOWNS = 6;

type SourceKind = 'trail-pack' | 'field-guide' | 'official' | 'hiker-input' | 'cached-weather' | 'derived';

/**
 * Personalization for a user tracking their OWN hike (the mobile app passes
 * `?mile=&direction=&personal=1`). When personal, the pack is centered on the
 * user's mile and stripped of Dad/pilot-specific framing — position is theirs,
 * not the family pilot's. Absent these options the endpoint returns the default
 * Dad pilot pack exactly as before.
 */
export interface FieldPackOptions {
  readonly mile?: number;
  readonly direction?: 'NOBO' | 'SOBO';
  readonly personal?: boolean;
}

function clampServerMile(value: number): number {
  const bounded = Math.min(TOTAL_AT_MILES, Math.max(0, value));
  return Math.round(bounded * 10) / 10;
}

function resolvePersonal(options: FieldPackOptions): { personal: boolean; mile: number | null; direction: 'NOBO' | 'SOBO' } {
  const mile = finiteNumber(options.mile);
  // Defense-in-depth: once a caller signals personal intent with any finite mile,
  // serve a personal pack (clamping an out-of-range mile into the trail) — never
  // fall back to the Dad pack, which would leak Dad's location to that request.
  const personal = options.personal === true && mile !== null;
  return {
    personal,
    mile: personal ? clampServerMile(mile as number) : null,
    direction: options.direction === 'SOBO' ? 'SOBO' : 'NOBO'
  };
}

interface MobileSourceReceipt {
  readonly id: string;
  readonly title: string;
  readonly kind: SourceKind;
  readonly citation?: string;
  readonly url?: string;
  readonly generatedAt?: string;
  readonly miles?: { readonly from: number; readonly to?: number };
}

interface MobileContextPack {
  readonly frame: {
    readonly totalMiles: number;
    readonly startMile: number;
    readonly endMile: number;
    readonly source: string;
  };
  readonly hiker: {
    readonly trailName?: string;
    readonly currentMile: number;
    readonly direction: 'NOBO' | 'SOBO';
    readonly dayNumber: number;
    readonly targetMilesToday?: number;
  };
  readonly water: readonly {
    readonly name: string;
    readonly mile: number;
    readonly reliability: 'reliable' | 'seasonal' | 'thin';
    readonly note?: string;
  }[];
  readonly shelters: readonly {
    readonly name: string;
    readonly mile: number;
    readonly capacity?: number;
    readonly note?: string;
  }[];
  readonly towns: readonly {
    readonly name: string;
    readonly mile: number;
    readonly access: string;
    readonly servicesNote?: string;
  }[];
  readonly guideExcerpts: readonly {
    readonly id: string;
    readonly title: string;
    readonly body: string;
    readonly tags: readonly string[];
    readonly citation?: string;
  }[];
  readonly loadout: readonly {
    readonly name: string;
    readonly category: 'shelter' | 'sleep' | 'pack' | 'clothing' | 'kitchen' | 'electronics' | 'safety' | 'consumable';
    readonly weightOz?: number;
    readonly carried: boolean;
    readonly note?: string;
  }[];
  readonly weather: {
    readonly mile: number;
    readonly summary: string;
    readonly highF: number;
    readonly lowF: number;
    readonly windMph: number;
    readonly riskNote?: string;
    readonly generatedAt: string;
  } | null;
  readonly downloadedRegions: readonly string[];
  readonly generatedAt: string;
}

type MobileWaterReference = MobileContextPack['water'][number];
type MobileShelterReference = MobileContextPack['shelters'][number];
type MobileTownReference = MobileContextPack['towns'][number];

interface TrailAheadSlice {
  readonly startMile: number;
  readonly endMile: number;
  readonly water: readonly MobileWaterReference[];
  readonly shelters: readonly MobileShelterReference[];
  readonly towns: readonly MobileTownReference[];
  readonly downloadedRegions: readonly string[];
  readonly sourceReceipts: readonly MobileSourceReceipt[];
}

function validUntil(generatedAt: Date): string {
  return new Date(generatedAt.getTime() + PACK_VALID_MS).toISOString();
}

function finiteNumber(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function roundMile(value: number): number {
  return Math.round(value * 10) / 10;
}

function currentMileFromDad(dad: DadPilotSummary | null): number {
  const latest = dad?.latestTrailLocation;
  const nearest = finiteNumber(latest?.nearestMile);
  const offTrail = finiteNumber(latest?.distanceToTrailMiles);

  if (!dad?.latestFixIsPreview && nearest !== null && nearest > 10 && nearest < TOTAL_AT_MILES && (offTrail === null || offTrail <= 20)) {
    return roundMile(nearest);
  }

  return PILOT_CURRENT_MILE;
}

function personalNotice(trailAhead: TrailAheadSlice | null): string {
  return trailAhead
    ? 'Trail-ahead water, shelter, and town entries are generated from open-reference candidates centered on your current mile; confirm current water, services, rules, and access before relying on them.'
    : 'Trail-ahead open-reference slice was not reachable; app is using a compact cached pack. Confirm current water, services, and access before relying on it.';
}

function pilotNotice(dad: DadPilotSummary | null, trailAhead: TrailAheadSlice | null): string {
  const locationNote = dad
    ? dad.latestFixIsPreview
      ? 'Dad location is currently a preview/cache signal; do not treat it as a live safety fix.'
      : 'Dad location came from the public Garmin pilot summary; verify before safety-critical decisions.'
    : 'Dad public pilot summary was not reachable; app is using the cached pilot anchor.';

  const dataNote = trailAhead
    ? 'Trail-ahead water, shelter, and town entries are generated from open-reference candidates; confirm current water, services, rules, and access before relying on them.'
    : 'Trail-ahead open-reference slice was not reachable; app is using the compact cached pilot pack.';

  return `${locationNote} ${dataNote}`;
}

function inWindow(startMile: number, endMile: number) {
  return (point: TrailMapWaypoint) => point.mile >= startMile - 0.01 && point.mile <= endMile;
}

function statesFor(points: readonly TrailMapWaypoint[]): string {
  const states = Array.from(new Set(points.map((point) => point.state).filter(Boolean)));
  return states.length ? states.join('/') : 'AT corridor';
}

function distanceFromDetail(detail: string): number | null {
  const match = detail.match(/(\d+(?:\.\d+)?) mi off trail/u);
  if (!match) return null;
  const value = Number(match[1]);
  return Number.isFinite(value) ? value : null;
}

function uniqueByName<T extends { readonly name: string; readonly mile: number }>(items: readonly T[]): T[] {
  const seen = new Set<string>();
  const result: T[] = [];

  for (const item of items) {
    const key = `${item.name.toLowerCase()}:${Math.round(item.mile)}`;
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(item);
  }

  return result;
}

function mapWater(point: TrailMapWaypoint): MobileWaterReference {
  const detail = point.detail ? `${point.detail}. ` : '';
  return {
    name: point.name === 'Unnamed stream' ? 'Unnamed mapped stream' : point.name,
    mile: roundMile(point.mile),
    reliability: 'thin',
    note: `${detail}Mapped water candidate from public hydrography; reliability and potability unknown. Confirm current flow before relying on it.`
  };
}

function mapShelter(point: TrailMapWaypoint): MobileShelterReference {
  const detail = point.detail ? `${point.detail}. ` : '';
  return {
    name: point.name,
    mile: roundMile(point.mile),
    note: `${detail}Open-data shelter candidate; verify current status, capacity, water, fees, and local rules.`
  };
}

function mapTown(point: TrailMapWaypoint): MobileTownReference {
  const detail = point.detail ? `${point.detail}` : `${point.state} corridor`;
  return {
    name: point.name,
    mile: roundMile(point.mile),
    access: `Open-data settlement candidate (${detail})`,
    servicesNote: 'Services are not confirmed from guidebook/current hiker reports in this pack; verify grocery, lodging, shuttle, and hours before planning around it.'
  };
}

async function buildTrailAheadSlice(currentMile: number, now: Date, personal = false): Promise<TrailAheadSlice | null> {
  const reference = await loadReferencePack();
  const endMile = Math.min(TOTAL_AT_MILES, roundMile(currentMile + TRAIL_AHEAD_MILES));
  const townEndMile = Math.min(TOTAL_AT_MILES, roundMile(currentMile + TOWN_LOOKAHEAD_MILES));

  const waterPoints = reference.waypoints.water
    .filter(inWindow(currentMile, endMile))
    .sort((a, b) => a.mile - b.mile)
    .slice(0, MAX_WATER_POINTS);

  const shelterPoints = reference.waypoints.shelters
    .filter(inWindow(currentMile, townEndMile))
    .sort((a, b) => a.mile - b.mile)
    .slice(0, MAX_SHELTERS);

  const townPoints = reference.waypoints.towns
    .filter(inWindow(currentMile, townEndMile))
    .filter((point) => {
      const distance = distanceFromDetail(point.detail);
      return distance === null || distance <= 8;
    })
    .sort((a, b) => a.mile - b.mile)
    .slice(0, MAX_TOWNS);

  const allPoints = [...waterPoints, ...shelterPoints, ...townPoints];
  if (!allPoints.length) return null;

  const states = statesFor(allPoints);

  return {
    startMile: roundMile(currentMile),
    endMile,
    water: uniqueByName(waterPoints.map(mapWater)),
    shelters: uniqueByName(shelterPoints.map(mapShelter)),
    towns: uniqueByName(townPoints.map(mapTown)),
    downloadedRegions: [
      personal
        ? `Trail ahead ${roundMile(currentMile).toFixed(1)}-${endMile.toFixed(1)}`
        : `Dad trail-ahead ${roundMile(currentMile).toFixed(1)}-${endMile.toFixed(1)}`,
      `AT open-reference candidates (${states})`
    ],
    sourceReceipts: [
      {
        id: 'trail-pack:open-reference-slice',
        title: 'Scout AT open-reference trail-ahead slice',
        kind: 'trail-pack',
        citation: 'Scout full-trail open-reference pack, anchor-calibrated to AWOL 2026 frame',
        generatedAt: now.toISOString(),
        miles: { from: roundMile(currentMile), to: endMile }
      },
      {
        id: 'derived:usgs-water-candidates',
        title: 'Mapped water candidates',
        kind: 'derived',
        citation: 'USGS/NHD public hydrography; reliability and potability unknown',
        miles: { from: roundMile(currentMile), to: endMile }
      },
      {
        id: 'derived:osm-corridor-candidates',
        title: 'Shelter and town candidates',
        kind: 'derived',
        citation: 'OpenStreetMap contributors, ODbL; mapped candidates, not confirmed logistics',
        miles: { from: roundMile(currentMile), to: townEndMile }
      }
    ]
  };
}

function buildContextPack(
  now: Date,
  dad: DadPilotSummary | null,
  trailAhead: TrailAheadSlice | null,
  personalCtx: { personal: boolean; mile: number | null; direction: 'NOBO' | 'SOBO' }
): MobileContextPack {
  const generatedAt = now.toISOString();
  const personal = personalCtx.personal;
  const currentMile = personal ? (personalCtx.mile as number) : currentMileFromDad(dad);

  return {
    frame: {
      totalMiles: TOTAL_AT_MILES,
      startMile: 0,
      endMile: TOTAL_AT_MILES,
      source: personal
        ? 'AWOL 2026 reference length + Scout AT open-reference slice'
        : 'AWOL 2026 reference length + Hogg Country Dad pilot pack + Scout AT open-reference slice'
    },
    hiker: {
      // Personal packs carry the user's own position and no Dad identity; the app
      // owns the trail name and day number locally.
      trailName: personal ? undefined : 'Hogg',
      currentMile,
      direction: personal ? personalCtx.direction : 'NOBO',
      dayNumber: personal ? 0 : 42,
      targetMilesToday: personal ? undefined : 13.8
    },
    // Pilot fallbacks below are Southern-VA-specific. A personal pack must never
    // substitute them at an arbitrary user mile, so it degrades to honest empties.
    water: trailAhead?.water.length ? trailAhead.water : personal ? [] : [
      {
        name: 'Lick Creek',
        mile: 586.6,
        reliability: 'reliable',
        note: 'Best fill before the exposed Chestnut Knob ridge.'
      },
      {
        name: 'Spring below Chestnut Knob',
        mile: 589.9,
        reliability: 'seasonal',
        note: 'Seasonal; use only as a bonus source after filling at Lick Creek.'
      }
    ],
    shelters: trailAhead?.shelters.length ? trailAhead.shelters : personal ? [] : [
      {
        name: 'Chestnut Knob Shelter',
        mile: 589.7,
        capacity: 8,
        note: 'Enclosed structure, exposed to wind on the ridge.'
      },
      {
        name: 'Jenny Knob Shelter',
        mile: 605.7,
        capacity: 6,
        note: 'Backup shelter farther north; confirm crowding from recent hiker reports.'
      }
    ],
    towns: trailAhead?.towns.length ? trailAhead.towns : personal ? [] : [
      {
        name: 'Bland, VA',
        mile: 596.0,
        access: 'US-52 crossing, short road access into town',
        servicesNote: 'Resupply and recovery stop; confirm current hours before depending on a specific service.'
      },
      {
        name: 'Pearisburg, VA',
        mile: 632.4,
        access: 'VA-634 crossing',
        servicesNote: 'Bigger resupply and recovery option beyond this pilot window.'
      }
    ],
    guideExcerpts: [
      {
        id: 'pack-water-on-ridges',
        title: 'Pack water before ridge sections',
        body: 'Ridge sections in southern Virginia frequently lose water sources. Top off at the last reliable source before climbing onto a long ridge.',
        tags: ['water', 'planning', 'ridge'],
        citation: 'Hogg Country Field Guide, Section: Water Discipline'
      },
      {
        id: 'town-stop-readiness',
        title: 'Town stops are recovery first, logistics second',
        body: 'Treat town as a recovery interval. Calories, foot care, sleep, then logistics. Logistics-first town stops cost mileage two days later.',
        tags: ['town', 'recovery'],
        citation: 'Hogg Country Field Guide, Section: Town Discipline'
      },
      {
        id: 'cold-wind-risk',
        title: 'Cold wind multiplies fatigue',
        body: 'Sustained crosswind above 15 mph at 30-40F drains energy faster than mileage suggests. Cap target miles, eat more often, and protect extremities.',
        tags: ['weather', 'safety', 'cold'],
        citation: 'Hogg Country Field Guide, Section: Cold Weather'
      }
    ],
    loadout: [
      { name: 'Durston X-Mid Pro 2', category: 'shelter', weightOz: 19.6, carried: true },
      { name: 'Enlightened Equipment Revelation 20F', category: 'sleep', weightOz: 22.1, carried: true },
      { name: 'Hyperlite Southwest 55', category: 'pack', weightOz: 31.5, carried: true },
      { name: 'Patagonia R1 Hoody', category: 'clothing', weightOz: 13.4, carried: true },
      { name: 'BRS 3000T stove', category: 'kitchen', weightOz: 0.9, carried: true },
      { name: 'InReach Mini 2', category: 'safety', weightOz: 3.5, carried: true },
      { name: 'Anker 10k power bank', category: 'electronics', weightOz: 6.9, carried: true }
    ],
    // Personal packs ship no weather: the cached figures below are Dad's pilot
    // context, which would be misleading at the user's own mile. The app shows an
    // honest "no cached forecast" state until a real source is wired up.
    weather: personal
      ? null
      : {
          mile: currentMile,
          summary: 'Cached pilot weather: cold ridge wind with dry afternoon skies',
          highF: 46,
          lowF: 28,
          windMph: 17,
          riskNote: 'Weather in this pack is cached pilot context; refresh before exposed terrain.',
          generatedAt: PILOT_GENERATED_AT
        },
    downloadedRegions: trailAhead?.downloadedRegions.length
      ? trailAhead.downloadedRegions
      : personal
        ? [`Trail ahead near mile ${currentMile.toFixed(1)}`, 'AT open reference summary']
        : ['Dad pilot - Southern VA', 'AT open reference summary'],
    generatedAt
  };
}

function sourceReceipts(
  now: Date,
  contextPack: MobileContextPack,
  trailAhead: TrailAheadSlice | null,
  personal: boolean
): MobileSourceReceipt[] {
  return [
    personal
      ? {
          id: 'field-pack:mobile',
          title: 'Scout mobile field pack',
          kind: 'trail-pack',
          citation: 'Hogg Country public Scout mobile bootstrap, centered on your current mile',
          generatedAt: now.toISOString(),
          miles: { from: contextPack.hiker.currentMile, to: trailAhead?.endMile ?? contextPack.hiker.currentMile }
        }
      : {
          id: 'field-pack:dad-pilot',
          title: 'Dad pilot mobile field pack',
          kind: 'trail-pack',
          citation: 'Hogg Country public Scout mobile bootstrap',
          generatedAt: now.toISOString(),
          miles: { from: contextPack.hiker.currentMile, to: trailAhead?.endMile ?? 606.0 }
        },
    ...(trailAhead?.sourceReceipts ?? []),
    {
      id: 'field-guide:water-discipline',
      title: 'Water discipline field-guide excerpt',
      kind: 'field-guide',
      citation: 'Hogg Country Field Guide'
    },
    {
      id: 'derived:awol-length',
      title: 'AT reference length',
      kind: 'derived',
      citation: 'AWOL 2026 calibrated reference length',
      miles: { from: 0, to: TOTAL_AT_MILES }
    },
    {
      id: 'derived:generated-mile-caveat',
      title: 'Generated mile caveat',
      kind: 'derived',
      citation: 'Open-reference landmark miles are anchor-calibrated estimates; confirm exact guidebook mileage before safety-critical decisions.'
    }
  ];
}

export async function buildPublicMobileFieldPack(now = new Date(), options: FieldPackOptions = {}) {
  const { personal, mile, direction } = resolvePersonal(options);
  const [dad, atReference] = await Promise.all([
    // Personal packs never use the Dad summary, so skip the upstream Garmin fetch.
    personal ? Promise.resolve(null) : loadDadPilotSummary().catch(() => null),
    loadScoutAtOpenReferenceOfflineSummary(now).catch(() => null)
  ]);
  const centerMile = personal ? (mile as number) : currentMileFromDad(dad);
  const trailAhead = await buildTrailAheadSlice(centerMile, now, personal).catch(() => null);
  const contextPack = buildContextPack(now, dad, trailAhead, { personal, mile, direction });
  const receipts = sourceReceipts(now, contextPack, trailAhead, personal);

  return {
    data: {
      context_pack: contextPack,
      // A personal pack never carries Dad's Garmin location into a stranger's pack.
      dad: personal ? null : dad,
      at_reference: atReference,
      pilot_notice: personal ? personalNotice(trailAhead) : pilotNotice(dad, trailAhead)
    },
    meta: {
      pack_version: 1,
      generated_at: now.toISOString(),
      valid_until: validUntil(now),
      source_receipts: receipts,
      fallback_reason: personal ? null : dad ? null : 'dad-pilot-unavailable',
      request_id: crypto.randomUUID()
    },
    error: null
  };
}
