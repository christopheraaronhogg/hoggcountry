import { loadScoutAtOpenReferenceOfflineSummary } from '$lib/server/at-open-reference';
import { loadDadPilotSummary, type DadPilotSummary } from '$lib/server/dad';
import { loadReferencePack } from '$lib/server/map-pack';
import { summarizeTerrainAhead } from '$lib/server/today-context';
import {
  fetchNwsWeather,
  approximateAtStateForMile,
  type NwsWeatherResult
} from '$lib/server/scout-official-sources';
import {
  buildTrailConditionsPack,
  type TrailConditionItem,
  type TrailConditionsPack
} from '$lib/server/scout-trail-conditions';
import {
  buildParkFacilitiesPack,
  type ParkFacility,
  type ParkFacilitiesPack
} from '$lib/server/scout-park-facilities';
import {
  AWOL_WATER_SOURCES,
  AWOL_WATER_CITATION,
  type AwolWaterSource
} from '$lib/server/generated/awol-water-reference';
import type { TrailMapElevationPoint, TrailMapWaypoint } from '$lib/map-pack-types';
import {
  directedMileDelta,
  directedTrailWindow,
  trailAhead,
  type TrailDirection
} from '@hoggcountry/trail-data/trail-direction';

const TOTAL_AT_MILES = 2197.9;
const PACK_VALID_MS = 6 * 60 * 60 * 1000;
const PILOT_CURRENT_MILE = 582.4;
const PILOT_GENERATED_AT = '2026-06-16T00:00:00.000Z';
const TRAIL_AHEAD_MILES = 36;
const TOWN_LOOKAHEAD_MILES = 80;
const TERRAIN_LOOKAHEAD_MILES = 15;
const MAX_WATER_POINTS = 12;
const MAX_SHELTERS = 8;
const MAX_TOWNS = 6;
const MAX_TERRAIN_CLIMBS = 4;

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
    readonly source?: 'nws' | 'cached-pilot';
    readonly sourceLabel?: string;
    readonly sourceUrl?: string;
    readonly alertsUrl?: string;
    readonly forecastUpdatedAt?: string | null;
  } | null;
  readonly terrain: {
    readonly fromMile: number;
    readonly toMile: number;
    readonly lookaheadMiles: number;
    readonly gainFt: number | null;
    readonly lossFt: number | null;
    readonly maxGradePercent: number | null;
    readonly difficultyScore: number | null;
    readonly difficultyLabel: string | null;
    readonly climbs: readonly {
      readonly startMile: number;
      readonly endMile: number;
      readonly direction: 'climb' | 'descent' | 'mixed';
      readonly gradePercent: number;
      readonly verticalFt: number;
      readonly state?: string;
    }[];
    readonly sourceLabel: string;
    readonly generatedAt: string;
  } | null;
  // Live official closures / detours / fire & hazard alerts near the current mile,
  // ingested per pack build from license-clean sources (ATC + NPS). Null when no
  // source was reachable; an empty `items` with a note means "checked, none active."
  readonly conditions: {
    readonly items: readonly TrailConditionItem[];
    readonly fetchedAt: string;
    readonly note: string;
  } | null;
  // NPS visitor centers / developed campgrounds for the regulated park sections
  // the AT crosses (info, permits, resupply, legal bail-out/overnight options).
  // Null outside park states or when the NPS proxy isn't reachable.
  readonly parkServices: {
    readonly items: readonly ParkFacility[];
    readonly parks: readonly string[];
    readonly fetchedAt: string;
    readonly note: string;
  } | null;
  readonly downloadedRegions: readonly string[];
  readonly generatedAt: string;
}

type MobileWaterReference = MobileContextPack['water'][number];
type MobileShelterReference = MobileContextPack['shelters'][number];
type MobileTownReference = MobileContextPack['towns'][number];
type MobileWeatherSnapshot = NonNullable<MobileContextPack['weather']>;

interface WeatherPack {
  readonly weather: MobileWeatherSnapshot | null;
  readonly receipt: MobileSourceReceipt | null;
  readonly error: string | null;
}

interface TrailAheadSlice {
  readonly startMile: number;
  readonly endMile: number;
  readonly water: readonly MobileWaterReference[];
  readonly shelters: readonly MobileShelterReference[];
  readonly towns: readonly MobileTownReference[];
  readonly terrain: MobileContextPack['terrain'];
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

function nearestElevationPoint(points: readonly TrailMapElevationPoint[], mile: number): TrailMapElevationPoint | null {
  if (!points.length || !Number.isFinite(mile)) return null;
  let best: TrailMapElevationPoint | null = null;
  let bestDelta = Infinity;
  for (const point of points) {
    const delta = Math.abs(point.mile - mile);
    if (delta < bestDelta) {
      best = point;
      bestDelta = delta;
    }
  }
  return best;
}

function numberFromNwsTemperature(value: string): number | null {
  const match = value.match(/-?\d+(?:\.\d+)?/u);
  if (!match) return null;
  const parsed = Number(match[0]);
  return Number.isFinite(parsed) ? parsed : null;
}

function maxWindMph(value: string): number {
  const values = Array.from(value.matchAll(/\d+(?:\.\d+)?/gu))
    .map((match) => Number(match[0]))
    .filter(Number.isFinite);
  return values.length ? Math.round(Math.max(...values)) : 0;
}

function summarizeNwsWeather(nws: NwsWeatherResult, mile: number, generatedAt: string): MobileWeatherSnapshot | null {
  const periods = nws.periods.slice(0, 4);
  if (!periods.length) return null;
  const temperatures = periods
    .map((period) => numberFromNwsTemperature(period.temperature))
    .filter((value): value is number => value !== null);
  const first = periods[0];
  const alertHeadline = nws.alerts[0]?.headline;
  const sourceUrl = nws.forecastUrl ?? nws.pointUrl;

  return {
    mile: roundMile(mile),
    summary: `NWS ${first.name}: ${first.shortForecast}`,
    highF: temperatures.length ? Math.round(Math.max(...temperatures)) : 0,
    lowF: temperatures.length ? Math.round(Math.min(...temperatures)) : 0,
    windMph: Math.max(...periods.map((period) => maxWindMph(period.wind)), 0),
    riskNote: alertHeadline
      ? `Active NWS alert: ${alertHeadline}`
      : 'Official NWS point forecast for the nearest trail coordinate; refresh before exposed terrain or severe-weather decisions.',
    generatedAt,
    source: 'nws',
    sourceLabel: `NWS point forecast near ${nws.label}`,
    sourceUrl,
    alertsUrl: nws.alertsUrl,
    forecastUpdatedAt: nws.forecastUpdatedAt
  };
}

async function buildWeatherPack(currentMile: number, generatedAt: string): Promise<WeatherPack> {
  try {
    const reference = await loadReferencePack();
    const point = nearestElevationPoint(reference.terrain.elevation, currentMile);
    if (!point) {
      return { weather: null, receipt: null, error: 'No calibrated trail coordinate for this mile.' };
    }

    const nws = await fetchNwsWeather(point.lat, point.lon);
    const weather = summarizeNwsWeather(nws, currentMile, generatedAt);
    if (!weather) {
      return { weather: null, receipt: null, error: 'NWS returned no forecast periods for this mile.' };
    }

    return {
      weather,
      receipt: {
        id: 'official:nws-point-forecast',
        title: 'NWS point forecast',
        kind: 'official',
        citation: `National Weather Service point forecast near mile ${roundMile(currentMile).toFixed(1)}, fetched ${generatedAt}`,
        url: weather.sourceUrl,
        generatedAt,
        miles: { from: roundMile(currentMile) }
      },
      error: null
    };
  } catch (error) {
    return {
      weather: null,
      receipt: null,
      error: error instanceof Error ? error.message : 'NWS forecast fetch failed.'
    };
  }
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

function conditionsNotice(conditions: MobileContextPack['conditions']): string {
  if (!conditions) {
    return 'Live closure/detour sources were unavailable for this pack; verify current closures and fire orders from an official source before remote or exposed sections.';
  }
  if (!conditions.items.length) {
    return 'No active official closures were found near this mile at pack time; closures change fast, so still verify before remote sections.';
  }
  const high = conditions.items.filter((item) => item.severity === 'high').length;
  const base = `${conditions.items.length} active official trail condition${conditions.items.length === 1 ? '' : 's'} (closures/detours/alerts) are in this pack`;
  return high
    ? `${base}, including ${high} high-severity closure or fire alert${high === 1 ? '' : 's'}; confirm each before relying on it.`
    : `${base}; confirm each before relying on it.`;
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

function mapAwolWater(source: AwolWaterSource): MobileWaterReference {
  return {
    name: source.name,
    mile: source.mile,
    reliability: source.reliability,
    note: source.note
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

function buildTerrainSummary(
  reference: Awaited<ReturnType<typeof loadReferencePack>>,
  currentMile: number,
  generatedAt: string,
  direction: TrailDirection
): MobileContextPack['terrain'] {
  const window = directedTrailWindow(currentMile, TERRAIN_LOOKAHEAD_MILES, TOTAL_AT_MILES, direction);
  if (!window) return null;
  const summary = summarizeTerrainAhead(
    reference.terrain,
    currentMile,
    TERRAIN_LOOKAHEAD_MILES,
    direction
  );
  if (!summary) return null;

  const climbs = reference.terrain.steep
    .filter((section) => section.endMile > window.minMile - 0.01 && section.startMile < window.maxMile + 0.01)
    .sort((a, b) => {
      const aEntry = direction === 'SOBO' ? a.endMile : a.startMile;
      const bEntry = direction === 'SOBO' ? b.endMile : b.startMile;
      return directedMileDelta(currentMile, aEntry, direction) - directedMileDelta(currentMile, bEntry, direction);
    })
    .slice(0, MAX_TERRAIN_CLIMBS)
    .map((section) => {
      const reversedDirection = section.direction === 'climb'
        ? 'descent'
        : section.direction === 'descent'
          ? 'climb'
          : 'mixed';
      return {
        startMile: roundMile(direction === 'SOBO' ? section.endMile : section.startMile),
        endMile: roundMile(direction === 'SOBO' ? section.startMile : section.endMile),
        direction: direction === 'SOBO' ? reversedDirection : section.direction,
        gradePercent: Math.round(section.gradePercent * 10) / 10,
        verticalFt: Math.round(direction === 'SOBO' ? -section.verticalFt : section.verticalFt),
        state: section.state || undefined
      };
    });

  return {
    fromMile: roundMile(currentMile),
    toMile: roundMile(window.toMile),
    lookaheadMiles: window.spanMiles,
    gainFt: summary.gainFt,
    lossFt: summary.lossFt,
    maxGradePercent: summary.maxGradePercent,
    difficultyScore: summary.difficultyScore,
    difficultyLabel: summary.difficultyLabel,
    climbs,
    sourceLabel: direction === 'SOBO'
      ? 'Scout open-reference terrain: USGS 3DEP elevation in SOBO travel order'
      : 'Scout open-reference terrain: USGS 3DEP elevation + terrain-only difficulty screen',
    generatedAt
  };
}

async function buildTrailAheadSlice(
  currentMile: number,
  now: Date,
  personal = false,
  direction: TrailDirection = 'NOBO'
): Promise<TrailAheadSlice | null> {
  const reference = await loadReferencePack();
  const trailWindow = directedTrailWindow(currentMile, TRAIL_AHEAD_MILES, TOTAL_AT_MILES, direction);
  const townWindow = directedTrailWindow(currentMile, TOWN_LOOKAHEAD_MILES, TOTAL_AT_MILES, direction);
  const terrainWindow = directedTrailWindow(currentMile, TERRAIN_LOOKAHEAD_MILES, TOTAL_AT_MILES, direction);
  if (!trailWindow || !townWindow || !terrainWindow) return null;
  const endMile = roundMile(trailWindow.toMile);
  const generatedAt = now.toISOString();

  // Water layer: AWOL-listed real, named sources (facts from The A.T. Guide,
  // re-expressed + cited) are the primary list; OSM/USGS hydrography candidates
  // backfill only genuine gaps (>0.3 mi from any AWOL source), so a hiker sees
  // real named water instead of "unnamed mapped stream, potability unknown".
  const awolWaterPoints = trailAhead(AWOL_WATER_SOURCES, currentMile, direction, TRAIL_AHEAD_MILES);
  const osmWaterAll = trailAhead(reference.waypoints.water, currentMile, direction, TRAIL_AHEAD_MILES);
  const osmGapFill = osmWaterAll.filter(
    (osm) => !awolWaterPoints.some((awol) => Math.abs(awol.mile - osm.mile) <= 0.3)
  );
  const waterReferences: MobileWaterReference[] = [
    ...awolWaterPoints.map(mapAwolWater),
    ...osmGapFill.map(mapWater)
  ];
  const orderedWaterReferences = trailAhead(
    waterReferences,
    currentMile,
    direction,
    TRAIL_AHEAD_MILES
  ).slice(0, MAX_WATER_POINTS);

  const shelterPoints = trailAhead(
    reference.waypoints.shelters,
    currentMile,
    direction,
    TOWN_LOOKAHEAD_MILES
  )
    .slice(0, MAX_SHELTERS);

  const townPoints = trailAhead(
    reference.waypoints.towns,
    currentMile,
    direction,
    TOWN_LOOKAHEAD_MILES
  )
    .filter((point) => {
      const distance = distanceFromDetail(point.detail);
      return distance === null || distance <= 8;
    })
    .slice(0, MAX_TOWNS);

  if (!orderedWaterReferences.length && !shelterPoints.length && !townPoints.length) return null;

  // statesFor needs waypoints carrying a `state`; the OSM shelter/town/water
  // points are the canonical state source for the window label.
  const states = statesFor([...osmWaterAll, ...shelterPoints, ...townPoints]);

  return {
    startMile: roundMile(currentMile),
    endMile,
    water: uniqueByName(orderedWaterReferences),
    shelters: uniqueByName(shelterPoints.map(mapShelter)),
    towns: uniqueByName(townPoints.map(mapTown)),
    terrain: buildTerrainSummary(reference, currentMile, generatedAt, direction),
    downloadedRegions: [
      personal
        ? `Trail ahead ${roundMile(currentMile).toFixed(1)}→${endMile.toFixed(1)} ${direction}`
        : `Dad trail-ahead ${roundMile(currentMile).toFixed(1)}→${endMile.toFixed(1)} NOBO`,
      `AT open-reference candidates (${states})`
    ],
    sourceReceipts: [
      {
        id: 'trail-pack:open-reference-slice',
        title: 'Scout AT open-reference trail-ahead slice',
        kind: 'trail-pack',
        citation: 'Scout full-trail open-reference pack, anchor-calibrated to AWOL 2026 frame',
        generatedAt,
        miles: { from: trailWindow.minMile, to: trailWindow.maxMile }
      },
      {
        id: 'derived:terrain-summary',
        title: 'Scout cached terrain summary',
        kind: 'derived',
        citation: 'USGS 3DEP elevation sampled along Scout open route geometry; terrain-only difficulty screen, not a substitute for current guide/sign conditions',
        generatedAt,
        miles: { from: terrainWindow.minMile, to: terrainWindow.maxMile }
      },
      ...(awolWaterPoints.length
        ? [
            {
              id: 'field-guide:awol-water',
              title: 'AWOL water-source facts',
              kind: 'field-guide' as const,
              citation: AWOL_WATER_CITATION,
              url: 'https://www.theatguide.com/',
              miles: { from: trailWindow.minMile, to: trailWindow.maxMile }
            }
          ]
        : []),
      {
        id: 'derived:usgs-water-candidates',
        title: 'Mapped water candidates (gap-fill)',
        kind: 'derived',
        citation: 'USGS/NHD public hydrography; used only where AWOL has no nearby source — reliability and potability unknown',
        miles: { from: trailWindow.minMile, to: trailWindow.maxMile }
      },
      {
        id: 'derived:osm-corridor-candidates',
        title: 'Shelter and town candidates',
        kind: 'derived',
        citation: 'OpenStreetMap contributors, ODbL; mapped candidates, not confirmed logistics',
        miles: { from: townWindow.minMile, to: townWindow.maxMile }
      }
    ]
  };
}

function contextConditions(pack: TrailConditionsPack | null): MobileContextPack['conditions'] {
  // Only surface conditions when at least one source was actually reached, so the
  // app can tell "checked, none active" (useful, honest) apart from "couldn't
  // check" (null → the app keeps its own "verify live" framing).
  if (!pack || pack.sourcesChecked.length === 0) return null;
  return { items: pack.items, fetchedAt: pack.fetchedAt, note: pack.note };
}

function contextParkServices(pack: ParkFacilitiesPack | null): MobileContextPack['parkServices'] {
  // Only when the hiker is in a park state with at least one facility returned.
  if (!pack || !pack.parks.length || !pack.items.length) return null;
  return { items: pack.items, parks: pack.parks, fetchedAt: pack.fetchedAt, note: pack.note };
}

function buildContextPack(
  now: Date,
  dad: DadPilotSummary | null,
  trailAhead: TrailAheadSlice | null,
  weatherPack: WeatherPack,
  conditions: TrailConditionsPack | null,
  parkServices: ParkFacilitiesPack | null,
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
        id: 'shelter-camping-discipline',
        title: 'Shelter and camping entries need rule checks',
        body: 'Shelters, campsites, huts, and tent sites are planning candidates until current rules, availability, water, fees, and crowding are checked. In regulated areas, verify the land-manager rule before committing to an overnight plan.',
        tags: ['shelter', 'camping', 'campsite', 'rules'],
        citation: 'Hogg Country Field Guide, Section: Shelter Discipline'
      },
      {
        id: 'loadout-contents-discipline',
        title: 'Read the pack contents before gear advice',
        body: 'Loadout advice starts with what is actually carried, then compares that gear against weather, terrain, water carry, shelter choice, body condition, and next town timing. If pack contents are missing or stale, ask for the specific item or category instead of guessing.',
        tags: ['loadout', 'gear', 'pack', 'safety'],
        citation: 'Hogg Country Field Guide, Section: Gear System'
      },
      {
        id: 'safety-risk-discipline',
        title: 'Safety decisions prefer current checks and safer stops',
        body: 'Closures, fires, high water, injury, bear activity, heat, cold, and bailout decisions need current source checks when online. If Scout cannot verify a live risk, choose the lower-mileage or safer-stop option and name what still needs confirmation.',
        tags: ['safety', 'risk', 'closure', 'bailout'],
        citation: 'Hogg Country Field Guide, Section: Safety and Emergency'
      },
      {
        id: 'cold-wind-risk',
        title: 'Cold wind multiplies fatigue',
        body: 'Sustained crosswind above 15 mph at 30-40F drains energy faster than mileage suggests. Cap target miles, eat more often, and protect extremities.',
        tags: ['weather', 'safety', 'cold'],
        citation: 'Hogg Country Field Guide, Section: Cold Weather'
      }
    ],
    loadout: personal
      ? []
      : [
          { name: 'Durston X-Mid Pro 2', category: 'shelter', weightOz: 19.6, carried: true },
          { name: 'Enlightened Equipment Revelation 20F', category: 'sleep', weightOz: 22.1, carried: true },
          { name: 'Hyperlite Southwest 55', category: 'pack', weightOz: 31.5, carried: true },
          { name: 'Patagonia R1 Hoody', category: 'clothing', weightOz: 13.4, carried: true },
          { name: 'BRS 3000T stove', category: 'kitchen', weightOz: 0.9, carried: true },
          { name: 'InReach Mini 2', category: 'safety', weightOz: 3.5, carried: true },
          { name: 'Anker 10k power bank', category: 'electronics', weightOz: 6.9, carried: true }
        ],
    weather: weatherPack.weather ?? (
      personal
        ? null
        : {
            mile: currentMile,
            summary: 'Cached pilot weather: cold ridge wind with dry afternoon skies',
            highF: 46,
            lowF: 28,
            windMph: 17,
            riskNote: 'Weather in this pack is cached pilot context; refresh before exposed terrain.',
            generatedAt: PILOT_GENERATED_AT,
            source: 'cached-pilot',
            sourceLabel: 'Cached pilot weather'
          }
    ),
    terrain: trailAhead?.terrain ?? null,
    conditions: contextConditions(conditions),
    parkServices: contextParkServices(parkServices),
    downloadedRegions: trailAhead?.downloadedRegions.length
      ? trailAhead.downloadedRegions
      : personal
        ? [`Trail ahead near mile ${currentMile.toFixed(1)}`, 'AT open reference summary']
        : ['Dad pilot - Southern VA', 'AT open reference summary'],
    generatedAt
  };
}

function conditionReceipts(conditions: TrailConditionsPack | null): MobileSourceReceipt[] {
  if (!conditions) return [];
  const receipts: MobileSourceReceipt[] = [];
  if (conditions.sourcesChecked.includes('atc')) {
    receipts.push({
      id: 'official:atc-trail-updates',
      title: 'ATC Trail Updates',
      kind: 'official',
      citation: `Appalachian Trail Conservancy trail updates, fetched ${conditions.fetchedAt}`,
      url: 'https://appalachiantrail.org/trail-updates/',
      generatedAt: conditions.fetchedAt
    });
  }
  if (conditions.sourcesChecked.includes('nps')) {
    receipts.push({
      id: 'official:nps-park-alerts',
      title: 'NPS park alerts',
      kind: 'official',
      citation: `National Park Service alerts for AT park units, fetched ${conditions.fetchedAt}`,
      url: 'https://www.nps.gov/appa/planyourvisit/conditions.htm',
      generatedAt: conditions.fetchedAt
    });
  }
  return receipts;
}

function parkServicesReceipts(parkServices: ParkFacilitiesPack | null): MobileSourceReceipt[] {
  if (!parkServices || !parkServices.items.length) return [];
  return [
    {
      id: 'official:nps-park-facilities',
      title: 'NPS park facilities',
      kind: 'official',
      citation: `National Park Service visitor centers + campgrounds for ${parkServices.parks.join(', ')}, fetched ${parkServices.fetchedAt}`,
      url: 'https://www.nps.gov/appa/planyourvisit/index.htm',
      generatedAt: parkServices.fetchedAt
    }
  ];
}

function sourceReceipts(
  now: Date,
  contextPack: MobileContextPack,
  trailAhead: TrailAheadSlice | null,
  weatherPack: WeatherPack,
  conditions: TrailConditionsPack | null,
  parkServices: ParkFacilitiesPack | null,
  personal: boolean
): MobileSourceReceipt[] {
  const defaultEnd = personal ? contextPack.hiker.currentMile : 606.0;
  const receiptEnd = trailAhead?.endMile ?? defaultEnd;
  const packMiles = {
    from: Math.min(contextPack.hiker.currentMile, receiptEnd),
    to: Math.max(contextPack.hiker.currentMile, receiptEnd)
  };
  return [
    personal
      ? {
          id: 'field-pack:mobile',
          title: 'Scout mobile field pack',
          kind: 'trail-pack',
          citation: 'Hogg Country public Scout mobile bootstrap, centered on your current mile',
          generatedAt: now.toISOString(),
          miles: packMiles
        }
      : {
          id: 'field-pack:dad-pilot',
          title: 'Dad pilot mobile field pack',
          kind: 'trail-pack',
          citation: 'Hogg Country public Scout mobile bootstrap',
          generatedAt: now.toISOString(),
          miles: packMiles
        },
    ...(trailAhead?.sourceReceipts ?? []),
    ...(weatherPack.receipt ? [weatherPack.receipt] : []),
    ...conditionReceipts(conditions),
    ...parkServicesReceipts(parkServices),
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
  const generatedAt = now.toISOString();
  const centerState = approximateAtStateForMile(centerMile);
  const [trailAhead, weatherPack, conditions, parkServices] = await Promise.all([
    buildTrailAheadSlice(centerMile, now, personal, direction).catch(() => null),
    buildWeatherPack(centerMile, generatedAt),
    // Live closures/detours/fire alerts ride the pack build (the build is the
    // cadence); never let a flaky upstream block the pack.
    buildTrailConditionsPack({ mile: centerMile, now }).catch((): TrailConditionsPack | null => null),
    // NPS visitor centers / campgrounds for the park sections (empty outside them).
    buildParkFacilitiesPack({ state: centerState, now }).catch((): ParkFacilitiesPack | null => null)
  ]);
  const contextPack = buildContextPack(now, dad, trailAhead, weatherPack, conditions, parkServices, { personal, mile, direction });
  const receipts = sourceReceipts(now, contextPack, trailAhead, weatherPack, conditions, parkServices, personal);
  const notice = [
    personal ? personalNotice(trailAhead) : pilotNotice(dad, trailAhead),
    weatherPack.error
      ? `NWS weather was not available for this pack (${weatherPack.error}); verify weather from an official source before exposed terrain.`
      : 'Weather comes from an official NWS point forecast near the current trail mile; refresh before safety-critical decisions.',
    conditionsNotice(contextPack.conditions)
  ].join(' ');

  return {
    data: {
      context_pack: contextPack,
      // A personal pack never carries Dad's Garmin location into a stranger's pack.
      dad: personal ? null : dad,
      at_reference: atReference,
      pilot_notice: notice
    },
    meta: {
      pack_version: 1,
      generated_at: generatedAt,
      valid_until: validUntil(now),
      source_receipts: receipts,
      fallback_reason: personal ? null : dad ? null : 'dad-pilot-unavailable',
      request_id: crypto.randomUUID()
    },
    error: null
  };
}
