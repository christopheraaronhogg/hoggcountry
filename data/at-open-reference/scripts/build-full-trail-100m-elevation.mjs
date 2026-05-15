import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const packRoot = path.resolve(__dirname, '..');

const GENERATED_DATE = process.env.FULL_TRAIL_RC1_GENERATED_DATE ?? '2026-05-15';
const FULL_LENGTH_MILES = 2106.2;
const METERS_PER_MILE = 1609.344;
const SAMPLE_SPACING_METERS = 100;
const EPQS_URL = 'https://epqs.nationalmap.gov/v1/json';
const ROUTE_ID = 'at-full-trail-rc1-open-2026';
const SOURCE_ROUTE_ID = 'at-main-osm-2026-open';
const CACHE_RELATIVE_PATH = 'raw/usgs/full_trail_epqs_100m_cache.json';

function parseArgs(argv) {
  const out = { concurrency: 8, force: false, dryRun: false, maxSamples: null };
  const args = argv.slice(2);
  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i];
    if (arg === '--concurrency') out.concurrency = Number(args[++i]);
    else if (arg === '--force') out.force = true;
    else if (arg === '--dry-run') out.dryRun = true;
    else if (arg === '--max-samples') out.maxSamples = Number(args[++i]);
    else if (arg === '--help' || arg === '-h') out.help = true;
  }
  return out;
}

function round(value, digits = 1) {
  if (typeof value !== 'number' || !Number.isFinite(value)) return value;
  const multiplier = 10 ** digits;
  return Math.round(value * multiplier) / multiplier;
}

function toRadians(value) {
  return value * (Math.PI / 180);
}

function haversineMeters(a, b) {
  const earthRadiusMeters = 6371008.8;
  const lat1 = toRadians(a[1]);
  const lat2 = toRadians(b[1]);
  const deltaLat = toRadians(b[1] - a[1]);
  const deltaLon = toRadians(b[0] - a[0]);
  const value = Math.sin(deltaLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLon / 2) ** 2;
  return 2 * earthRadiusMeters * Math.asin(Math.sqrt(value));
}

function flattenCoordinates(geometry) {
  if (!geometry) return [];
  if (geometry.type === 'LineString') return geometry.coordinates ?? [];
  if (geometry.type === 'MultiLineString') return (geometry.coordinates ?? []).flat();
  throw new Error(`Unsupported route geometry type: ${geometry.type}`);
}

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(packRoot, relativePath), 'utf8'));
}

function maybeReadJson(relativePath) {
  const target = path.join(packRoot, relativePath);
  return fs.existsSync(target) ? JSON.parse(fs.readFileSync(target, 'utf8')) : null;
}

function writeJson(relativePath, value) {
  const target = path.join(packRoot, relativePath);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

function buildSegments(coordinates) {
  const segments = [];
  let cumulativeMeters = 0;
  for (let index = 1; index < coordinates.length; index += 1) {
    const start = coordinates[index - 1];
    const end = coordinates[index];
    const lengthMeters = haversineMeters(start, end);
    if (lengthMeters <= 0) continue;
    segments.push({
      start,
      end,
      start_meters: cumulativeMeters,
      end_meters: cumulativeMeters + lengthMeters,
      length_meters: lengthMeters,
    });
    cumulativeMeters += lengthMeters;
  }
  return { segments, routeLengthMeters: cumulativeMeters };
}

function coordinateAtMeters(segments, distanceMeters, cursor) {
  while (cursor.index < segments.length - 1 && distanceMeters > segments[cursor.index].end_meters) cursor.index += 1;
  const segment = segments[cursor.index];
  const ratio = segment.length_meters === 0 ? 0 : (distanceMeters - segment.start_meters) / segment.length_meters;
  const lon = segment.start[0] + (segment.end[0] - segment.start[0]) * ratio;
  const lat = segment.start[1] + (segment.end[1] - segment.start[1]) * ratio;
  return [round(lon, 7), round(lat, 7)];
}

function buildStations(routeGeometry) {
  const coordinates = flattenCoordinates(routeGeometry);
  if (coordinates.length < 2) throw new Error('Route geometry has fewer than two coordinates.');
  const { segments, routeLengthMeters } = buildSegments(coordinates);
  const targetMeters = Math.min(routeLengthMeters, FULL_LENGTH_MILES * METERS_PER_MILE);
  const cursor = { index: 0 };
  const stations = [];
  const wholeSteps = Math.floor(targetMeters / SAMPLE_SPACING_METERS);
  for (let index = 0; index <= wholeSteps; index += 1) {
    const distanceMeters = index * SAMPLE_SPACING_METERS;
    const [lon, lat] = coordinateAtMeters(segments, distanceMeters, cursor);
    stations.push({
      sample_index: index,
      distance_meters: distanceMeters,
      mile_nobo_global_est: round(distanceMeters / METERS_PER_MILE, 3),
      mile_sobo_global_est: round(FULL_LENGTH_MILES - distanceMeters / METERS_PER_MILE, 3),
      lat,
      lon,
      terminal_partial_segment: false,
    });
  }
  const last = stations[stations.length - 1];
  if (targetMeters - last.distance_meters > 1) {
    const [lon, lat] = coordinateAtMeters(segments, targetMeters, cursor);
    stations.push({
      sample_index: stations.length,
      distance_meters: round(targetMeters, 1),
      mile_nobo_global_est: round(targetMeters / METERS_PER_MILE, 3),
      mile_sobo_global_est: round(FULL_LENGTH_MILES - targetMeters / METERS_PER_MILE, 3),
      lat,
      lon,
      terminal_partial_segment: true,
    });
  }
  return {
    stations,
    routeLengthMeters: round(routeLengthMeters, 1),
    targetMeters: round(targetMeters, 1),
  };
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchElevationFt(lon, lat, attempt = 1) {
  const url = new URL(EPQS_URL);
  url.searchParams.set('x', String(lon));
  url.searchParams.set('y', String(lat));
  url.searchParams.set('units', 'Feet');
  url.searchParams.set('wkid', '4326');
  url.searchParams.set('includeDate', 'false');

  const response = await fetch(url, {
    headers: {
      accept: 'application/json',
      'user-agent': 'HoggCountryScout/0.1 (AT full-trail 100m elevation pack; contact: repository owner)',
    },
  });

  if (!response.ok) {
    if (attempt < 4) {
      await sleep(750 * attempt);
      return fetchElevationFt(lon, lat, attempt + 1);
    }
    throw new Error(`EPQS failed: ${response.status} ${response.statusText}`);
  }

  const payload = await response.json();
  const value = Number(payload.value);
  if (!Number.isFinite(value) || value < -100000) {
    return { elevation_ft: null, raster_id: payload.rasterId ?? null, resolution: payload.resolution ?? null };
  }
  return {
    elevation_ft: round(value, 1),
    raster_id: payload.rasterId ?? null,
    resolution: payload.resolution ?? null,
  };
}

async function mapLimit(items, limit, mapper) {
  const output = new Array(items.length);
  let next = 0;
  async function worker() {
    while (next < items.length) {
      const index = next;
      next += 1;
      output[index] = await mapper(items[index], index);
    }
  }
  await Promise.all(Array.from({ length: Math.max(1, limit) }, worker));
  return output;
}

function buildCacheDocument(samples, routeStats, complete) {
  const validSamples = samples.filter((sample) => typeof sample.elevation_ft === 'number');
  return {
    cache_id: 'usgs_epqs_full_trail_100m_v1',
    route_id: ROUTE_ID,
    source_route_id: SOURCE_ROUTE_ID,
    generated_at: `${GENERATED_DATE}T00:00:00.000Z`,
    last_checked: GENERATED_DATE,
    sample_spacing_meters: SAMPLE_SPACING_METERS,
    route_length_meters_measured: routeStats.routeLengthMeters,
    target_length_meters: routeStats.targetMeters,
    expected_sample_count: routeStats.stations.length,
    sample_count: samples.length,
    valid_elevation_count: validSamples.length,
    complete,
    source_id: 'usgs_3dep',
    source_url: EPQS_URL,
    source: 'USGS Elevation Point Query Service, interpolated from 3DEP dynamic elevation service',
    source_license: 'public_domain',
    license_status: 'public_domain',
    attribution: 'Data available from U.S. Geological Survey, 3D Elevation Program.',
    confidence: 'model_derived_topographic_estimate',
    ai_answer_rule: 'Use as the direct 100-meter USGS 3DEP/EPQS elevation cache for Scout full-trail RC1. Generated miles are not official ATC mileage.',
    samples,
  };
}

function normalizeCachedSample(sample) {
  return {
    sample_index: sample.sample_index,
    distance_meters: sample.distance_meters,
    mile_nobo_global_est: sample.mile_nobo_global_est,
    mile_sobo_global_est: sample.mile_sobo_global_est,
    lat: sample.lat,
    lon: sample.lon,
    terminal_partial_segment: sample.terminal_partial_segment === true,
    elevation_ft: sample.elevation_ft,
    epqs: sample.epqs ?? {
      raster_id: sample.raster_id ?? null,
      resolution: sample.resolution ?? null,
    },
    last_checked: sample.last_checked ?? GENERATED_DATE,
  };
}

async function main() {
  const cfg = parseArgs(process.argv);
  if (cfg.help) {
    console.log('Usage: node data/at-open-reference/scripts/build-full-trail-100m-elevation.mjs [--concurrency 8] [--force] [--dry-run] [--max-samples N]');
    return;
  }

  const route = readJson('processed/route/at_route_selected.geojson');
  const routeStats = buildStations(route.features[0].geometry);
  if (cfg.maxSamples !== null) routeStats.stations = routeStats.stations.slice(0, cfg.maxSamples);
  if (cfg.dryRun) {
    console.log(JSON.stringify({
      route_length_meters_measured: routeStats.routeLengthMeters,
      target_length_meters: routeStats.targetMeters,
      sample_spacing_meters: SAMPLE_SPACING_METERS,
      expected_sample_count: routeStats.stations.length,
      cache_path: CACHE_RELATIVE_PATH,
    }, null, 2));
    return;
  }

  const existing = cfg.force ? null : maybeReadJson(CACHE_RELATIVE_PATH);
  const cacheByIndex = new Map((existing?.samples ?? []).map((sample) => [sample.sample_index, normalizeCachedSample(sample)]));
  const output = routeStats.stations.map((station) => cacheByIndex.get(station.sample_index) ?? null);
  const missing = routeStats.stations.filter((station) => {
    const cached = cacheByIndex.get(station.sample_index);
    return !cached || typeof cached.elevation_ft !== 'number';
  });

  const writeCache = (complete) => {
    const samples = output.filter(Boolean);
    writeJson(CACHE_RELATIVE_PATH, buildCacheDocument(samples, routeStats, complete));
  };

  if (missing.length === 0 && output.every(Boolean)) {
    writeCache(true);
    console.log(`100m elevation cache already complete: ${output.length} samples`);
    return;
  }

  console.log(`Fetching ${missing.length} missing 100m EPQS samples (${routeStats.stations.length} total) at concurrency ${cfg.concurrency}`);
  let completed = 0;
  await mapLimit(missing, cfg.concurrency, async (station) => {
    const elevation = await fetchElevationFt(station.lon, station.lat);
    output[station.sample_index] = {
      ...station,
      elevation_ft: elevation.elevation_ft,
      epqs: {
        raster_id: elevation.raster_id,
        resolution: elevation.resolution,
      },
      last_checked: GENERATED_DATE,
    };
    completed += 1;
    if (completed % 250 === 0) {
      process.stdout.write(` ${completed}/${missing.length}`);
      writeCache(false);
    }
  });
  process.stdout.write('\n');

  const complete = output.filter(Boolean).length === routeStats.stations.length && output.every((sample) => typeof sample.elevation_ft === 'number');
  writeCache(complete);
  if (!complete) throw new Error('100m elevation cache has missing or null EPQS samples after fetch.');
  console.log(`Built 100m elevation cache: ${output.length} samples at ${CACHE_RELATIVE_PATH}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
