import {
  directedTrailWindow,
  trailAhead,
  trailProgress,
  type TrailDirection
} from '@hoggcountry/trail-data/trail-direction';

export interface TodayWaypoint {
  readonly name: string;
  readonly mile: number;
  readonly milesAhead: number;
  readonly type: string;
}

export interface TodayWeatherDay {
  readonly date: string;
  readonly label: string;
  readonly highF: number | null;
  readonly lowF: number | null;
  readonly precipChancePct: number | null;
  readonly windMaxMph: number | null;
}

export interface TodayTerrainAhead {
  readonly lookaheadMiles: number;
  readonly gainFt: number | null;
  readonly lossFt: number | null;
  readonly maxGradePercent: number | null;
  readonly difficultyScore: number | null;
  readonly difficultyLabel: string | null;
}

export interface TodayTrailContext {
  readonly generatedAt: string;
  readonly mile: number;
  readonly mileSource: 'profile' | 'tracker';
  readonly direction: TrailDirection;
  readonly totalMiles: number;
  readonly percentComplete: number;
  readonly milesRemaining: number;
  readonly coordinates: { readonly lat: number; readonly lon: number } | null;
  readonly weather: readonly TodayWeatherDay[];
  readonly weatherError: string | null;
  readonly next: {
    readonly shelter: TodayWaypoint | null;
    readonly water: TodayWaypoint | null;
    readonly town: TodayWaypoint | null;
    readonly road: TodayWaypoint | null;
  };
  readonly terrainAhead: TodayTerrainAhead | null;
}

export interface NextWaypointCandidate {
  readonly name: string;
  readonly mile: number | null;
  readonly type: string;
}

export interface TerrainSegmentLike {
  readonly startMile: number;
  readonly endMile: number;
  readonly gainFt: number;
  readonly lossFt: number;
  readonly maxGradePercent: number;
}

export interface DifficultySegmentLike {
  readonly startMile: number;
  readonly endMile: number;
  readonly score: number;
  readonly label: string;
}

export interface TerrainAheadInput {
  readonly segments: readonly TerrainSegmentLike[];
  readonly difficulty: readonly DifficultySegmentLike[];
}

export interface MilepointLike {
  readonly mile: number;
  readonly lat: number;
  readonly lon: number;
}

interface LoadTodayTrailContextOptions {
  readonly fetch: typeof fetch;
  readonly requestOrigin: string;
  readonly profileMile: number | null;
  readonly profileDirection: TrailDirection;
}

const TERRAIN_LOOKAHEAD_MILES = 15;
const OPEN_METEO_URL = 'https://api.open-meteo.com/v1/forecast';
const OPEN_METEO_CACHE_MS = 5 * 60 * 1000;
const OPEN_METEO_TIMEOUT_MS = 7000;

const cachedOpenMeteo = new Map<string, { readonly ts: number; readonly days: readonly TodayWeatherDay[] }>();

function finiteOrNull(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function roundTenth(value: number): number {
  return Math.round(value * 10) / 10;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

// Open-Meteo weathercode mapping (condensed), copied from src/components/AtWeather.svelte wxCodeLabel.
function weatherCodeLabel(code: unknown): string {
  const c = Number(code);
  if (!Number.isFinite(c)) return '—';
  if (c === 0) return 'Clear';
  if (c === 1) return 'Mostly clear';
  if (c === 2) return 'Partly cloudy';
  if (c === 3) return 'Overcast';
  if (c === 45 || c === 48) return 'Fog';
  if (c === 51 || c === 53 || c === 55) return 'Drizzle';
  if (c === 56 || c === 57) return 'Freezing drizzle';
  if (c === 61 || c === 63 || c === 65) return 'Rain';
  if (c === 66 || c === 67) return 'Freezing rain';
  if (c === 71 || c === 73 || c === 75) return 'Snow';
  if (c === 77) return 'Snow grains';
  if (c === 80 || c === 81 || c === 82) return 'Rain showers';
  if (c === 85 || c === 86) return 'Snow showers';
  if (c === 95) return 'Thunderstorm';
  if (c === 96 || c === 99) return 'Thunderstorm + hail';
  return `Weather (${c})`;
}

export function zipDailyWeather(daily: unknown): TodayWeatherDay[] {
  const record = daily && typeof daily === 'object' && !Array.isArray(daily)
    ? daily as { readonly [key: string]: unknown }
    : null;
  if (!record) return [];

  const times = Array.isArray(record.time) ? record.time : [];
  const highs = Array.isArray(record.temperature_2m_max) ? record.temperature_2m_max : [];
  const lows = Array.isArray(record.temperature_2m_min) ? record.temperature_2m_min : [];
  const precip = Array.isArray(record.precipitation_probability_max) ? record.precipitation_probability_max : [];
  const codes = Array.isArray(record.weather_code) ? record.weather_code : [];
  const winds = Array.isArray(record.wind_speed_10m_max) ? record.wind_speed_10m_max : [];

  const days: TodayWeatherDay[] = [];
  for (let index = 0; index < times.length; index += 1) {
    const date = typeof times[index] === 'string' ? times[index] as string : '';
    if (!date) continue;
    days.push({
      date,
      label: weatherCodeLabel(codes[index]),
      highF: finiteOrNull(highs[index]),
      lowF: finiteOrNull(lows[index]),
      precipChancePct: finiteOrNull(precip[index]),
      windMaxMph: finiteOrNull(winds[index])
    });
  }

  return days;
}

export function nextWaypointAhead(
  list: readonly NextWaypointCandidate[],
  mile: number,
  direction: TrailDirection = 'NOBO'
): TodayWaypoint | null {
  if (!Number.isFinite(mile)) return null;
  const next = trailAhead(
    list.filter((point): point is NextWaypointCandidate & { readonly mile: number } => point.mile != null),
    mile,
    direction
  )[0] ?? null;
  if (!next || next.mile == null) return null;

  return {
    name: next.name,
    mile: next.mile,
    milesAhead: roundTenth(direction === 'SOBO' ? mile - next.mile : next.mile - mile),
    type: next.type
  };
}

export function summarizeTerrainAhead(
  terrain: TerrainAheadInput,
  mile: number,
  lookaheadMiles: number = TERRAIN_LOOKAHEAD_MILES,
  direction: TrailDirection = 'NOBO'
): TodayTerrainAhead | null {
  if (!Number.isFinite(mile) || !Number.isFinite(lookaheadMiles) || lookaheadMiles <= 0) return null;

  const window = directedTrailWindow(mile, lookaheadMiles, Number.MAX_SAFE_INTEGER, direction);
  if (!window) return null;
  const overlapping = terrain.segments.filter((segment) =>
    Number.isFinite(segment.startMile)
    && Number.isFinite(segment.endMile)
    && segment.endMile > window.minMile
    && segment.startMile < window.maxMile);

  let gainFt: number | null = null;
  let lossFt: number | null = null;
  let maxGradePercent: number | null = null;

  if (overlapping.length > 0) {
    // Prorate edge segments by the fraction of their span inside the window so
    // climb already behind the hiker (or past the window end) is not counted.
    const overlapFraction = (segment: TerrainSegmentLike): number => {
      const span = segment.endMile - segment.startMile;
      if (!Number.isFinite(span) || span <= 0) return 1;
      const overlap = Math.min(segment.endMile, window.maxMile) - Math.max(segment.startMile, window.minMile);
      return clamp(overlap / span, 0, 1);
    };

    const authoredGain = Math.round(overlapping.reduce((sum, segment) =>
      sum + (Number.isFinite(segment.gainFt) ? segment.gainFt * overlapFraction(segment) : 0), 0));
    const authoredLoss = Math.round(overlapping.reduce((sum, segment) =>
      sum + (Number.isFinite(segment.lossFt) ? segment.lossFt * overlapFraction(segment) : 0), 0));
    gainFt = direction === 'SOBO' ? authoredLoss : authoredGain;
    lossFt = direction === 'SOBO' ? authoredGain : authoredLoss;
    maxGradePercent = roundTenth(Math.max(...overlapping.map((segment) => Number.isFinite(segment.maxGradePercent) ? segment.maxGradePercent : 0)));
  }

  // Cached difficulty weights ascent and descent differently and is authored
  // NOBO. Do not present that score as SOBO truth until direction-specific
  // difficulty is generated.
  const difficultyEntry = direction === 'NOBO'
    ? terrain.difficulty.find((entry) => mile >= entry.startMile && mile <= entry.endMile) ?? null
    : null;
  const difficultyScore = difficultyEntry && Number.isFinite(difficultyEntry.score) ? difficultyEntry.score : null;
  const difficultyLabel = difficultyEntry ? difficultyEntry.label.replace(/_/gu, ' ') : null;

  if (gainFt === null && lossFt === null && maxGradePercent === null && difficultyScore === null && difficultyLabel === null) {
    return null;
  }

  return { lookaheadMiles, gainFt, lossFt, maxGradePercent, difficultyScore, difficultyLabel };
}

// Linear interpolation between bracketing milepoints, mirroring TrailMapExplorer's coordForMile.
export function interpolateCoordinateForMile(
  milepoints: readonly MilepointLike[],
  mile: number
): { readonly lat: number; readonly lon: number } | null {
  if (milepoints.length === 0 || !Number.isFinite(mile)) return null;

  let lower = milepoints[0];
  let upper = milepoints[milepoints.length - 1];

  for (const point of milepoints) {
    if (point.mile <= mile) lower = point;
    if (point.mile >= mile) {
      upper = point;
      break;
    }
  }

  if (!lower || !upper) return null;
  if (lower.mile === upper.mile) return { lat: lower.lat, lon: lower.lon };

  const progress = (mile - lower.mile) / (upper.mile - lower.mile);
  return {
    lat: lower.lat + (upper.lat - lower.lat) * progress,
    lon: lower.lon + (upper.lon - lower.lon) * progress
  };
}

async function fetchOpenMeteoDaily(fetcher: typeof fetch, lat: number, lon: number): Promise<readonly TodayWeatherDay[]> {
  const cacheKey = `${lat.toFixed(3)},${lon.toFixed(3)}`;
  const cached = cachedOpenMeteo.get(cacheKey);
  if (cached && Date.now() - cached.ts < OPEN_METEO_CACHE_MS) return cached.days;

  const url = new URL(OPEN_METEO_URL);
  url.searchParams.set('latitude', lat.toFixed(4));
  url.searchParams.set('longitude', lon.toFixed(4));
  url.searchParams.set('timezone', 'auto');
  url.searchParams.set('temperature_unit', 'fahrenheit');
  url.searchParams.set('wind_speed_unit', 'mph');
  url.searchParams.set('precipitation_unit', 'inch');
  url.searchParams.set('daily', 'temperature_2m_max,temperature_2m_min,precipitation_probability_max,weather_code,wind_speed_10m_max');
  url.searchParams.set('forecast_days', '3');

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), OPEN_METEO_TIMEOUT_MS);

  try {
    const response = await fetcher(url, {
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
        'User-Agent': 'Mozilla/5.0 (compatible; HoggCountryScout/1.0; +https://hoggcountry.com)'
      }
    });

    if (!response.ok) {
      throw new Error(`${response.status} ${response.statusText}`.trim());
    }

    const payload = await response.json() as { readonly daily?: unknown };
    const days = zipDailyWeather(payload.daily);
    cachedOpenMeteo.set(cacheKey, { ts: Date.now(), days });
    return days;
  } finally {
    clearTimeout(timeoutId);
  }
}

async function loadTodayTrailContextUnsafe(options: LoadTodayTrailContextOptions): Promise<TodayTrailContext | null> {
  // Dynamic imports keep this module's pure helpers importable without the SvelteKit alias graph (node:test).
  const [{ loadTrailMapPack }, { atMilepostNearMile, nearestAtMilepost }] = await Promise.all([
    import('$lib/server/map-pack'),
    import('$lib/server/at-location')
  ]);

  const pack = await loadTrailMapPack({
    fetch: options.fetch,
    requestOrigin: options.requestOrigin,
    historyLimit: 1
  });

  let mile: number | null = null;
  let mileSource: 'profile' | 'tracker' = 'profile';

  if (typeof options.profileMile === 'number' && Number.isFinite(options.profileMile) && options.profileMile > 0) {
    mile = options.profileMile;
    mileSource = 'profile';
  } else {
    const current = pack.tracker.current;
    // Tracker miles arrive on mixed scales (Garmin enrichment uses centerline
    // scaledTrailMiles); re-derive a canonical 2197.4-scale mile from the fix
    // coordinates so every downstream number shares one frame.
    if (current && Number.isFinite(current.lat) && Number.isFinite(current.lon)) {
      try {
        const nearest = await nearestAtMilepost(current.lat, current.lon);
        const canonical = finiteOrNull(nearest?.mile);
        if (canonical !== null && canonical > 0) {
          mile = canonical;
          mileSource = 'tracker';
        }
      } catch {
        // fall through to the raw tracker mile below
      }
    }
    if (mile === null) {
      const trackerMile = finiteOrNull(current?.mile);
      if (trackerMile !== null && trackerMile > 0) {
        mile = trackerMile;
        mileSource = 'tracker';
      }
    }
  }

  if (mile === null) return null;

  // Official AT length per src/data/trail-facts.yaml (AWOL 2026).
  const totalMiles = pack.route.displayMiles;
  const direction = options.profileDirection;
  const progress = trailProgress(mile, totalMiles, direction);
  const percentComplete = roundTenth(progress.percent);
  const milesRemaining = roundTenth(progress.remainingMiles);

  // Waypoints and terrain are measured on the OSM-derived route scale
  // (~2106.2 mi) while the query mile is canonical (2197.4). Convert into the
  // measured frame for lookups, and convert results back for display.
  const measuredFactor = pack.route.measuredMiles > 0 && totalMiles > 0
    ? pack.route.measuredMiles / totalMiles
    : 1;
  const measuredMile = mile * measuredFactor;
  const toCanonicalWaypoint = (waypoint: TodayWaypoint | null): TodayWaypoint | null =>
    waypoint === null
      ? null
      : {
          ...waypoint,
          mile: roundTenth(waypoint.mile / measuredFactor),
          milesAhead: roundTenth(Math.max(0, waypoint.milesAhead / measuredFactor))
        };

  let coordinates: { readonly lat: number; readonly lon: number } | null = null;
  try {
    const nearest = await atMilepostNearMile(mile);
    if (Number.isFinite(nearest.latitude) && Number.isFinite(nearest.longitude)) {
      coordinates = { lat: nearest.latitude, lon: nearest.longitude };
    }
  } catch {
    coordinates = null;
  }
  coordinates ??= interpolateCoordinateForMile(pack.milepoints, mile);

  let weather: readonly TodayWeatherDay[] = [];
  let weatherError: string | null = null;

  if (coordinates) {
    try {
      weather = await fetchOpenMeteoDaily(options.fetch, coordinates.lat, coordinates.lon);
    } catch {
      weather = [];
      weatherError = 'Live forecast unavailable right now — check again when you have signal.';
    }
  } else {
    weatherError = 'No coordinates matched this mile yet, so the forecast is unavailable.';
  }

  return {
    generatedAt: new Date().toISOString(),
    mile,
    mileSource,
    direction,
    totalMiles,
    percentComplete,
    milesRemaining,
    coordinates,
    weather,
    weatherError,
    next: {
      shelter: toCanonicalWaypoint(nextWaypointAhead(pack.waypoints.shelters, measuredMile, direction)),
      water: toCanonicalWaypoint(nextWaypointAhead(pack.waypoints.water, measuredMile, direction)),
      town: toCanonicalWaypoint(nextWaypointAhead(pack.waypoints.towns, measuredMile, direction)),
      road: toCanonicalWaypoint(nextWaypointAhead(pack.waypoints.roads, measuredMile, direction))
    },
    terrainAhead: ((): TodayTerrainAhead | null => {
      const summary = summarizeTerrainAhead(
        pack.terrain,
        measuredMile,
        TERRAIN_LOOKAHEAD_MILES * measuredFactor,
        direction
      );
      return summary === null ? null : { ...summary, lookaheadMiles: TERRAIN_LOOKAHEAD_MILES };
    })()
  };
}

// Returns null only when no mile is known (no profile mile, no tracker fix).
// Infrastructure failures propagate so callers can distinguish "set your mile"
// from "the server fell over" — conflating them sent users chasing the wrong fix.
export async function loadTodayTrailContext(options: LoadTodayTrailContextOptions): Promise<TodayTrailContext | null> {
  return loadTodayTrailContextUnsafe(options);
}
