import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import {
  type LatLon,
  type TrailMapDifficultySegment,
  type TrailMapElevationPoint,
  type TrailMapMilepoint,
  type TrailMapPack,
  type TrailMapPoint,
  type TrailMapRockinessSegment,
  type TrailMapRoute,
  type TrailMapSteepSection,
  type TrailMapTerrainSegment,
  type TrailMapWaypoint
} from '$lib/map-pack-types';
import { loadDadTrack } from './dad';
import { nearestAtMilepost } from './at-location';

const OFFICIAL_DISPLAY_MILES = 2197.4;
const HOGG_LABEL = 'hoggcountry';
const DEFAULT_HISTORY_LIMIT = 1600;

const RELATIVE_PATHS = {
  route: 'data/at-open-reference/full_trail_rc1/processed/route/full_at_route_rc1.geojson',
  publicMileposts: 'public/at-mileposts.json',
  elevation: 'data/at-open-reference/full_trail_rc1/processed/elevation/full_trail_elevation_samples_1_0mi.json',
  terrainSegments: 'data/at-open-reference/full_trail_rc1/processed/elevation/full_trail_elevation_by_1mi_segment_100m.json',
  steepSections: 'data/at-open-reference/full_trail_rc1/processed/elevation/full_trail_steep_grade_sections_100m.json',
  rockiness: 'data/at-open-reference/full_trail_rc1/processed/tread_rockiness_v2_1/full_trail_rockiness_v2_1_by_1mi.json',
  difficulty: 'data/at-open-reference/full_trail_rc1/processed/difficulty/full_trail_difficulty_by_10mi_segment.json',
  shelters: 'data/at-open-reference/full_trail_rc1/processed/waypoints/full_trail_shelters.json',
  huts: 'data/at-open-reference/full_trail_rc1/processed/waypoints/full_trail_huts.json',
  tentSites: 'data/at-open-reference/full_trail_rc1/processed/waypoints/full_trail_tent_sites.json',
  campsites: 'data/at-open-reference/full_trail_rc1/processed/waypoints/full_trail_campsites.json',
  water: 'data/at-open-reference/full_trail_rc1/processed/water/full_trail_water_candidates.json',
  roads: 'data/at-open-reference/full_trail_rc1/processed/waypoints/full_trail_road_crossings.json',
  towns: 'data/at-open-reference/full_trail_rc1/processed/waypoints/full_trail_towns_resupply_candidates.json',
  summits: 'data/at-open-reference/full_trail_rc1/processed/waypoints/full_trail_summits.json',
  vistas: 'data/at-open-reference/full_trail_rc1/processed/waypoints/full_trail_vistas.json'
} as const;

type FetchLike = typeof fetch;

interface LoadTrailMapPackOptions {
  readonly fetch: FetchLike;
  readonly requestOrigin: string;
  readonly historyLimit?: number;
}

interface GenericRecord {
  readonly [key: string]: unknown;
}

interface BackendHistoryPayload {
  readonly data?: {
    readonly trackers?: unknown;
  };
}

interface BackendLivePayload {
  readonly data?: {
    readonly fixes?: unknown;
  };
}

const jsonCache = new Map<string, Promise<unknown>>();
let referencePackPromise: Promise<Omit<TrailMapPack, 'generatedAt' | 'tracker'>> | null = null;

function normalizeNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
}

function normalizeText(value: unknown, fallback = ''): string {
  return typeof value === 'string' && value.trim() !== '' ? value.replace(/\s+/gu, ' ').trim() : fallback;
}

function repoRootCandidates(relativePath: string): string[] {
  const normalized = relativePath.replace(/^\/+/u, '');
  const roots = [process.cwd(), dirname(process.cwd())];
  const candidates = new Set<string>();

  for (const root of roots) {
    let cursor = root;
    for (let depth = 0; depth < 8; depth += 1) {
      candidates.add(join(cursor, normalized));
      candidates.add(join(cursor, '..', '..', normalized));
      const parent = dirname(cursor);
      if (parent === cursor) break;
      cursor = parent;
    }
  }

  return Array.from(candidates);
}

async function readJsonFile<T>(relativePath: string): Promise<T> {
  const explicit = process.env.SCOUT_REPO_ROOT ? [resolve(process.env.SCOUT_REPO_ROOT, relativePath)] : [];
  const candidates = [...explicit, ...repoRootCandidates(relativePath)];
  const attempted: string[] = [];

  for (const candidate of candidates) {
    attempted.push(candidate);
    if (!existsSync(candidate)) continue;
    return JSON.parse(await readFile(candidate, 'utf8')) as T;
  }

  throw new Error(`Map reference file not found: ${relativePath}. Checked ${attempted.slice(0, 5).join(', ')}`);
}

function cachedJson<T>(relativePath: string): Promise<T> {
  if (!jsonCache.has(relativePath)) {
    jsonCache.set(relativePath, readJsonFile<T>(relativePath));
  }

  return jsonCache.get(relativePath) as Promise<T>;
}

function mileFrom(record: GenericRecord, keys: readonly string[]): number | null {
  for (const key of keys) {
    const value = normalizeNumber(record[key]);
    if (value !== null) return value;
  }
  return null;
}

function stateFrom(record: GenericRecord): string {
  const raw = record.state;
  if (typeof raw === 'string' && raw.trim() !== '') return raw.trim();
  const states = record.states;
  if (Array.isArray(states) && typeof states[0] === 'string') return states[0];
  return '';
}

function downsampleLine(line: LatLon[], step: number): LatLon[] {
  if (line.length <= 2 || step <= 1) return line;
  return line.filter((_, index) => index % step === 0 || index === line.length - 1);
}

function routeSegmentsFromGeojson(geojson: GenericRecord, maxPoints = 5200): LatLon[][] {
  const features = Array.isArray(geojson.features) ? geojson.features as GenericRecord[] : [];
  const rawSegments: LatLon[][] = [];

  for (const feature of features) {
    const geometry = feature.geometry as GenericRecord | undefined;
    const type = normalizeText(geometry?.type);
    const coordinates = geometry?.coordinates;

    if (type === 'LineString' && Array.isArray(coordinates)) {
      rawSegments.push(coordinates
        .map((coord) => {
          if (!Array.isArray(coord)) return null;
          const lon = normalizeNumber(coord[0]);
          const lat = normalizeNumber(coord[1]);
          return lat !== null && lon !== null ? [lat, lon] as const : null;
        })
        .filter((coord): coord is LatLon => coord !== null));
    }

    if (type === 'MultiLineString' && Array.isArray(coordinates)) {
      for (const part of coordinates) {
        if (!Array.isArray(part)) continue;
        rawSegments.push(part
          .map((coord) => {
            if (!Array.isArray(coord)) return null;
            const lon = normalizeNumber(coord[0]);
            const lat = normalizeNumber(coord[1]);
            return lat !== null && lon !== null ? [lat, lon] as const : null;
          })
          .filter((coord): coord is LatLon => coord !== null));
      }
    }
  }

  const totalPoints = rawSegments.reduce((sum, segment) => sum + segment.length, 0);
  const step = Math.max(1, Math.ceil(totalPoints / maxPoints));
  return rawSegments.map((segment) => downsampleLine(segment, step)).filter((segment) => segment.length >= 2);
}

async function loadRoute(): Promise<TrailMapRoute> {
  const geojson = await cachedJson<GenericRecord>(RELATIVE_PATHS.route);
  const feature = Array.isArray(geojson.features) ? geojson.features[0] as GenericRecord | undefined : undefined;
  const properties = feature?.properties as GenericRecord | undefined;
  const measuredMiles = normalizeNumber(properties?.measured_length_miles) ?? 2106.2;
  const qualityFlags = Array.isArray(properties?.known_quality_flags) ? properties.known_quality_flags.map(String) : [];

  return {
    segments: routeSegmentsFromGeojson(geojson),
    measuredMiles,
    displayMiles: OFFICIAL_DISPLAY_MILES,
    sourceLabel: 'Open AT route candidate',
    qualityNotes: [
      'Generated/open-route miles are visual planning aids, not official ATC guidebook miles.',
      ...qualityFlags.slice(0, 3).map((flag) => flag.replace(/_/gu, ' '))
    ]
  };
}

async function loadMilepoints(): Promise<TrailMapMilepoint[]> {
  const payload = await cachedJson<{ readonly mileposts?: unknown }>(RELATIVE_PATHS.publicMileposts);
  const rows = Array.isArray(payload.mileposts) ? payload.mileposts as GenericRecord[] : [];

  return rows
    .map((row): TrailMapMilepoint | null => {
      const mile = normalizeNumber(row.mile);
      const lat = normalizeNumber(row.lat);
      const lon = normalizeNumber(row.lon);
      if (mile === null || lat === null || lon === null) return null;

      return {
        mile,
        scaledTrailMiles: normalizeNumber(row.scaledTrailMiles),
        lat,
        lon
      };
    })
    .filter((point): point is TrailMapMilepoint => point !== null);
}

async function loadTerrain() {
  const [elevationRows, terrainRows, steepRows, rockRows, difficultyRows] = await Promise.all([
    cachedJson<GenericRecord[]>(RELATIVE_PATHS.elevation),
    cachedJson<GenericRecord[]>(RELATIVE_PATHS.terrainSegments),
    cachedJson<GenericRecord[]>(RELATIVE_PATHS.steepSections),
    cachedJson<GenericRecord[]>(RELATIVE_PATHS.rockiness),
    cachedJson<GenericRecord[]>(RELATIVE_PATHS.difficulty)
  ]);

  const elevation: TrailMapElevationPoint[] = elevationRows
    .map((row): TrailMapElevationPoint | null => {
      const mile = mileFrom(row, ['mile_nobo_global_est', 'mile_nobo']);
      const lat = normalizeNumber(row.lat);
      const lon = normalizeNumber(row.lon);
      const elevationFt = normalizeNumber(row.elevation_ft);
      if (mile === null || lat === null || lon === null || elevationFt === null) return null;
      return { mile, lat, lon, elevationFt, state: stateFrom(row) };
    })
    .filter((point): point is TrailMapElevationPoint => point !== null);

  const segments: TrailMapTerrainSegment[] = terrainRows
    .map((row): TrailMapTerrainSegment | null => {
      const startMile = mileFrom(row, ['start_mile_nobo_global_est', 'start_mile_nobo']);
      const endMile = mileFrom(row, ['end_mile_nobo_global_est', 'end_mile_nobo']);
      if (startMile === null || endMile === null) return null;

      return {
        startMile,
        endMile,
        state: stateFrom(row),
        gainFt: normalizeNumber(row.elevation_gain_ft) ?? 0,
        lossFt: normalizeNumber(row.elevation_loss_ft) ?? 0,
        maxGradePercent: normalizeNumber(row.max_grade_percent) ?? 0,
        highestFt: normalizeNumber(row.highest_point_ft) ?? 0,
        lowestFt: normalizeNumber(row.lowest_point_ft) ?? 0
      };
    })
    .filter((segment): segment is TrailMapTerrainSegment => segment !== null);

  const steep: TrailMapSteepSection[] = steepRows
    .map((row): TrailMapSteepSection | null => {
      const startMile = mileFrom(row, ['start_mile_nobo_global_est', 'start_mile_nobo']);
      const endMile = mileFrom(row, ['end_mile_nobo_global_est', 'end_mile_nobo']);
      const grade = normalizeNumber(row.average_grade_percent) ?? normalizeNumber(row.max_step_grade_percent);
      if (startMile === null || endMile === null || grade === null || grade < 17) return null;
      const rawDirection = normalizeText(row.grade_direction);
      const direction = rawDirection === 'climb' || rawDirection === 'descent' ? rawDirection : 'mixed';
      return {
        startMile,
        endMile,
        direction,
        gradePercent: grade,
        verticalFt: normalizeNumber(row.elevation_delta_ft) ?? 0,
        state: stateFrom(row)
      };
    })
    .filter((section): section is TrailMapSteepSection => section !== null)
    .slice(0, 1200);

  const rockiness: TrailMapRockinessSegment[] = rockRows
    .map((row): TrailMapRockinessSegment | null => {
      const startMile = mileFrom(row, ['start_mile_nobo_global_est', 'start_mile_nobo']);
      const endMile = mileFrom(row, ['end_mile_nobo_global_est', 'end_mile_nobo']);
      const mile = mileFrom(row, ['mile_nobo_global_est', 'mile_nobo']);
      const score = normalizeNumber(row.rockiness_v2_1_score_0_10) ?? normalizeNumber(row.score);
      if (startMile === null || endMile === null || mile === null || score === null) return null;
      return {
        startMile,
        endMile,
        mile,
        score,
        label: normalizeText(row.rockiness_class ?? row.score_label, 'unknown'),
        confidence: normalizeText(row.confidence, 'model estimate')
      };
    })
    .filter((segment): segment is TrailMapRockinessSegment => segment !== null);

  const difficulty: TrailMapDifficultySegment[] = difficultyRows
    .map((row): TrailMapDifficultySegment | null => {
      const startMile = mileFrom(row, ['start_mile_nobo_global_est', 'start_mile_nobo']);
      const endMile = mileFrom(row, ['end_mile_nobo_global_est', 'end_mile_nobo']);
      const score = normalizeNumber(row.difficulty_score_0_10);
      if (startMile === null || endMile === null || score === null) return null;
      return {
        startMile,
        endMile,
        score,
        label: normalizeText(row.difficulty_label, 'screening'),
        confidence: normalizeText(row.confidence, 'model screening')
      };
    })
    .filter((segment): segment is TrailMapDifficultySegment => segment !== null);

  return { elevation, segments, steep, rockiness, difficulty };
}

function waypointId(row: GenericRecord, prefix: string, index: number): string {
  return normalizeText(row.waypoint_id ?? row.water_id ?? row.access_id ?? row.town_id ?? row.full_trail_record_id, `${prefix}-${index}`);
}

function normalizeWaypoint(row: GenericRecord, type: TrailMapWaypoint['type'], index: number): TrailMapWaypoint | null {
  const mile = mileFrom(row, ['mile_nobo_global_est', 'mile_nobo']);
  const lat = normalizeNumber(row.lat);
  const lon = normalizeNumber(row.lon);
  if (mile === null || lat === null || lon === null) return null;

  const name = normalizeText(row.name, type === 'water' ? 'Water candidate' : type);
  const flow = normalizeText(row.flow);
  const distanceMiles = normalizeNumber(row.distance_from_trail_miles);
  const detailParts = [
    stateFrom(row),
    type === 'water' && flow ? flow : '',
    type === 'town' && distanceMiles !== null ? `${distanceMiles.toFixed(1)} mi off trail` : ''
  ].filter(Boolean);

  return {
    id: waypointId(row, type, index),
    type,
    name,
    mile,
    lat,
    lon,
    state: stateFrom(row),
    detail: detailParts.join(' · '),
    confidence: normalizeText(row.confidence, 'mapped candidate')
  };
}

async function loadWaypointFile(path: string, type: TrailMapWaypoint['type']): Promise<TrailMapWaypoint[]> {
  const rows = await cachedJson<GenericRecord[]>(path);
  return rows
    .map((row, index) => normalizeWaypoint(row, type, index))
    .filter((point): point is TrailMapWaypoint => point !== null);
}

async function loadWaypoints(): Promise<TrailMapPack['waypoints']> {
  const [shelters, huts, tentSites, campsites, water, roads, towns, summits, vistas] = await Promise.all([
    loadWaypointFile(RELATIVE_PATHS.shelters, 'shelter'),
    loadWaypointFile(RELATIVE_PATHS.huts, 'shelter'),
    loadWaypointFile(RELATIVE_PATHS.tentSites, 'campsite'),
    loadWaypointFile(RELATIVE_PATHS.campsites, 'campsite'),
    loadWaypointFile(RELATIVE_PATHS.water, 'water'),
    loadWaypointFile(RELATIVE_PATHS.roads, 'road'),
    loadWaypointFile(RELATIVE_PATHS.towns, 'town'),
    loadWaypointFile(RELATIVE_PATHS.summits, 'summit'),
    loadWaypointFile(RELATIVE_PATHS.vistas, 'vista')
  ]);

  return {
    shelters: [...shelters, ...huts].sort((a, b) => a.mile - b.mile),
    water: water.sort((a, b) => a.mile - b.mile),
    roads: roads.sort((a, b) => a.mile - b.mile),
    towns: towns
      .filter((town) => !town.detail.includes('15.0 mi off trail'))
      .sort((a, b) => a.mile - b.mile),
    summits: summits.sort((a, b) => a.mile - b.mile),
    campsites: [...campsites, ...tentSites].sort((a, b) => a.mile - b.mile),
    vistas: vistas.sort((a, b) => a.mile - b.mile)
  };
}

async function loadReferencePack(): Promise<Omit<TrailMapPack, 'generatedAt' | 'tracker'>> {
  if (!referencePackPromise) {
    referencePackPromise = Promise.all([
      loadRoute(),
      loadMilepoints(),
      loadTerrain(),
      loadWaypoints()
    ]).then(([route, milepoints, terrain, waypoints]) => ({
      route,
      milepoints,
      terrain,
      waypoints,
      sourceNotes: [
        'Garmin points come from MapShare/Laravel history when available.',
        'Elevation is model-derived USGS 3DEP/EPQS screening data.',
        'Rockiness is Scout Rockiness V2.1 model output, not field verification.',
        'Open route miles are generated from an OSM-derived route candidate and remain visually useful but not official guidebook mileage.'
      ]
    }));
  }

  return referencePackPromise;
}

function apiBaseFor(requestOrigin: string): string {
  const configured = process.env.PUBLIC_API_BASE_URL?.trim();
  if (configured) {
    const normalized = configured.replace(/\/+$/u, '');
    if (/^https?:\/\//iu.test(normalized)) return normalized;
    return new URL(normalized.startsWith('/') ? normalized : `/${normalized}`, requestOrigin).toString().replace(/\/+$/u, '');
  }

  const hostname = new URL(requestOrigin).hostname;
  if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1') {
    return 'https://hoggcountry.on-forge.com/api/v1';
  }

  if (process.env.NODE_ENV === 'development') {
    return 'https://hoggcountry.on-forge.com/api/v1';
  }

  return new URL('/api/v1', requestOrigin).toString().replace(/\/+$/u, '');
}

function selectHoggRow(rows: unknown): GenericRecord | null {
  if (!Array.isArray(rows)) return null;
  const normalized = rows.filter((row): row is GenericRecord => typeof row === 'object' && row !== null);
  return normalized.find((row) => normalizeText(row.label).toLowerCase() === HOGG_LABEL)
    ?? normalized.find((row) => normalizeText(row.label).toLowerCase().includes('hogg'))
    ?? normalized[0]
    ?? null;
}

async function enrichPoint(point: TrailMapPoint): Promise<TrailMapPoint> {
  if (point.mile !== null) return point;

  try {
    const nearest = await nearestAtMilepost(point.lat, point.lon);
    return {
      ...point,
      mile: nearest.scaledTrailMiles ?? nearest.mile
    };
  } catch {
    return point;
  }
}

async function fetchBackendTracker(fetcher: FetchLike, requestOrigin: string, historyLimit: number): Promise<TrailMapPack['tracker'] | null> {
  const apiBase = apiBaseFor(requestOrigin);
  const historyUrl = new URL(`${apiBase}/trackers/public/history`);
  historyUrl.searchParams.set('label', HOGG_LABEL);
  historyUrl.searchParams.set('limit', String(historyLimit));

  const liveUrl = new URL(`${apiBase}/trackers/public/live`);
  liveUrl.searchParams.set('label', HOGG_LABEL);

  const [historyResponse, liveResponse] = await Promise.all([
    fetcher(historyUrl, { headers: { Accept: 'application/json' }, cache: 'no-store' }).catch(() => null),
    fetcher(liveUrl, { headers: { Accept: 'application/json' }, cache: 'no-store' }).catch(() => null)
  ]);

  const historyPayload = historyResponse?.ok ? await historyResponse.json().catch(() => null) as BackendHistoryPayload | null : null;
  const livePayload = liveResponse?.ok ? await liveResponse.json().catch(() => null) as BackendLivePayload | null : null;
  const selectedHistory = selectHoggRow(historyPayload?.data?.trackers);
  const selectedLive = selectHoggRow(livePayload?.data?.fixes);
  const rawPoints = Array.isArray(selectedHistory?.points) ? selectedHistory.points as GenericRecord[] : [];

  const history = await Promise.all(rawPoints
    .map((point): TrailMapPoint | null => {
      const lat = normalizeNumber(point.lat);
      const lon = normalizeNumber(point.lon);
      if (lat === null || lon === null) return null;
      return {
        lat,
        lon,
        mile: normalizeNumber(point.mile),
        observedAt: normalizeText(point.observed_at) || null,
        label: normalizeText(selectedHistory?.label, 'HoggCountry'),
        source: 'laravel_tracker_history'
      };
    })
    .filter((point): point is TrailMapPoint => point !== null)
    .map(enrichPoint));

  const currentCandidate = selectedLive ?? rawPoints.at(-1) ?? null;
  const current = currentCandidate
    ? await enrichPoint({
        lat: normalizeNumber(currentCandidate.lat) ?? history.at(-1)?.lat ?? 0,
        lon: normalizeNumber(currentCandidate.lon) ?? history.at(-1)?.lon ?? 0,
        mile: normalizeNumber(currentCandidate.mile),
        observedAt: normalizeText(currentCandidate.observed_at) || (history.at(-1)?.observedAt ?? null),
        label: normalizeText(currentCandidate.label ?? selectedHistory?.label, 'HoggCountry'),
        source: 'laravel_tracker_live'
      })
    : history.at(-1) ?? null;

  if (!current || current.lat === 0 || current.lon === 0) return null;

  return {
    label: current.label,
    source: 'laravel',
    current,
    history,
    staleAfterMinutes: 90
  };
}

function extractGarminPoints(track: Awaited<ReturnType<typeof loadDadTrack>>): TrailMapPoint[] {
  const points: TrailMapPoint[] = [];
  const features = Array.isArray(track.features) ? track.features as GenericRecord[] : [];

  for (const feature of features) {
    const geometry = feature.geometry as GenericRecord | undefined;
    if (normalizeText(geometry?.type) !== 'Point' || !Array.isArray(geometry?.coordinates)) continue;
    const lon = normalizeNumber(geometry.coordinates[0]);
    const lat = normalizeNumber(geometry.coordinates[1]);
    if (lat === null || lon === null) continue;
    const properties = feature.properties as GenericRecord | undefined;
    const kind = normalizeText(properties?.kind);
    if (kind === 'snapped-trail-mile') continue;
    points.push({
      lat,
      lon,
      mile: null,
      observedAt: normalizeText(properties?.when) || null,
      label: normalizeText(properties?.name, 'HoggCountry'),
      source: 'garmin_mapshare'
    });
  }

  return points.sort((a, b) => String(a.observedAt ?? '').localeCompare(String(b.observedAt ?? '')));
}

async function fallbackTrackerFromGarmin(): Promise<TrailMapPack['tracker']> {
  const track = await loadDadTrack();
  const latestPoint = track.properties?.latestPoint as { readonly coords?: [number, number]; readonly when?: string } | undefined;
  const history = await Promise.all(extractGarminPoints(track).map(enrichPoint));
  const current = latestPoint?.coords
    ? await enrichPoint({
        lat: latestPoint.coords[0],
        lon: latestPoint.coords[1],
        mile: null,
        observedAt: typeof latestPoint.when === 'string' ? latestPoint.when : null,
        label: 'HoggCountry',
        source: 'garmin_mapshare'
      })
    : history.at(-1) ?? null;

  return {
    label: 'HoggCountry',
    source: current ? 'garmin' : 'preview',
    current,
    history: history.length ? history : current ? [current] : [],
    staleAfterMinutes: 90
  };
}

function pointTime(point: TrailMapPoint | null): number {
  if (!point?.observedAt) return 0;
  const timestamp = Date.parse(point.observedAt);
  return Number.isFinite(timestamp) ? timestamp : 0;
}

function pointKey(point: TrailMapPoint): string {
  return `${point.observedAt ?? 'unknown'}:${point.lat.toFixed(6)},${point.lon.toFixed(6)}`;
}

function mergeHistory(points: TrailMapPoint[], limit: number): TrailMapPoint[] {
  const deduped = new Map<string, TrailMapPoint>();

  for (const point of points) {
    if (point.lat === 0 && point.lon === 0) continue;
    deduped.set(pointKey(point), point);
  }

  return Array.from(deduped.values())
    .sort((a, b) => pointTime(a) - pointTime(b))
    .slice(-limit);
}

function mergeTrackers(
  durable: TrailMapPack['tracker'] | null,
  garmin: TrailMapPack['tracker'],
  historyLimit: number
): TrailMapPack['tracker'] {
  if (!durable) return garmin;

  const garminIsNewer = pointTime(garmin.current) > pointTime(durable.current);
  const current = garminIsNewer ? garmin.current : durable.current ?? garmin.current;
  const history = mergeHistory([
    ...durable.history,
    ...garmin.history,
    ...(current ? [current] : [])
  ], historyLimit);

  return {
    label: current?.label ?? durable.label,
    source: garmin.current ? 'laravel+garmin' : durable.source,
    current,
    history,
    staleAfterMinutes: Math.min(durable.staleAfterMinutes, garmin.staleAfterMinutes)
  };
}

export function mapPackHistoryLimit(searchParams: URLSearchParams): number {
  const raw = Number(searchParams.get('limit') ?? DEFAULT_HISTORY_LIMIT);
  if (!Number.isFinite(raw)) return DEFAULT_HISTORY_LIMIT;
  return Math.max(1, Math.min(5000, Math.floor(raw)));
}

export async function loadTrailMapPack(options: LoadTrailMapPackOptions): Promise<TrailMapPack> {
  const historyLimit = options.historyLimit ?? DEFAULT_HISTORY_LIMIT;
  const [reference, durableTracker, garminTracker] = await Promise.all([
    loadReferencePack(),
    fetchBackendTracker(options.fetch, options.requestOrigin, historyLimit).catch(() => null),
    fallbackTrackerFromGarmin()
  ]);
  const tracker = mergeTrackers(durableTracker, garminTracker, historyLimit);

  return {
    generatedAt: new Date().toISOString(),
    tracker,
    ...reference
  };
}
