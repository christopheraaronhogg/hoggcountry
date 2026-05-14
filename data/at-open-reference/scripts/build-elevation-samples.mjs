import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const packRoot = path.resolve(__dirname, '..');

const epqsUrl = 'https://epqs.nationalmap.gov/v1/json';

function parseArgs(argv) {
  const out = { interval: 5.0, concurrency: 4 };
  const args = argv.slice(2);
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--interval') out.interval = Number(args[++i]);
    else if (arg === '--concurrency') out.concurrency = Number(args[++i]);
    else if (arg === '--help' || arg === '-h') out.help = true;
  }
  return out;
}

function intervalLabel(interval) {
  return interval.toFixed(1).replace('.', '_');
}

function intervalShortLabel(interval) {
  return `${String(interval).replace('.', '_')}mi`;
}

function round(n, digits = 1) {
  const factor = 10 ** digits;
  return Math.round(n * factor) / factor;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function baseProps(lastChecked = '2026-05-14') {
  return {
    source_id: 'usgs_3dep',
    source_url: epqsUrl,
    source: 'USGS Elevation Point Query Service, interpolated from 3DEP dynamic elevation service',
    source_license: 'public_domain',
    license_status: 'public_domain',
    attribution: 'Data available from U.S. Geological Survey, 3D Elevation Program.',
    confidence: 'model_derived_topographic_estimate',
    last_checked: lastChecked,
    ai_answer_rule:
      'Describe as model-derived USGS 3DEP elevation sampled along Scout open route geometry; values may differ from guidebook profiles or surveyed summits.',
  };
}

async function fetchElevationFt(lon, lat, attempt = 1) {
  const url = new URL(epqsUrl);
  url.searchParams.set('x', String(lon));
  url.searchParams.set('y', String(lat));
  url.searchParams.set('units', 'Feet');
  url.searchParams.set('wkid', '4326');
  url.searchParams.set('includeDate', 'false');

  const response = await fetch(url, {
    headers: {
      accept: 'application/json',
      'user-agent': 'HoggCountryScout/0.1 (AT open reference pack; contact: repository owner)',
    },
  });

  if (!response.ok) {
    if (attempt < 3) {
      await sleep(500 * attempt);
      return fetchElevationFt(lon, lat, attempt + 1);
    }
    throw new Error(`EPQS failed: ${response.status} ${response.statusText}`);
  }

  const payload = await response.json();
  const value = Number(payload.value);
  if (!Number.isFinite(value) || value < -100000) return null;
  return {
    elevation_ft: round(value, 1),
    raster_id: payload.rasterId ?? null,
    resolution: payload.resolution ?? null,
  };
}

function loadMilepoints(interval) {
  const milepointsPath = path.join(packRoot, 'processed', 'milepoints', `at_milepoints_${intervalLabel(interval)}mi.geojson`);
  const data = JSON.parse(fs.readFileSync(milepointsPath, 'utf8'));
  return data.features.map((feature) => {
    const [lon, lat] = feature.geometry.coordinates;
    return {
      mile_nobo: feature.properties.mile_nobo,
      mile_sobo: feature.properties.mile_sobo,
      lat,
      lon,
    };
  });
}

async function mapLimit(items, limit, mapper) {
  const out = new Array(items.length);
  let next = 0;
  async function worker() {
    while (next < items.length) {
      const index = next++;
      out[index] = await mapper(items[index], index);
    }
  }
  await Promise.all(Array.from({ length: limit }, worker));
  return out;
}

function buildSamples(points, elevations, interval) {
  const shortLabel = intervalShortLabel(interval);
  return points.map((point, index) => ({
    sample_id: `elev-open-${shortLabel}-${String(index + 1).padStart(5, '0')}`,
    trail: 'Appalachian Trail',
    route_id: 'at-main-osm-2026-open',
    mile_nobo: point.mile_nobo,
    mile_sobo: point.mile_sobo,
    lat: point.lat,
    lon: point.lon,
    interval_miles: interval,
    elevation_ft: elevations[index]?.elevation_ft ?? null,
    epqs: elevations[index]
      ? {
          raster_id: elevations[index].raster_id,
          resolution: elevations[index].resolution,
        }
      : null,
    ...baseProps(),
  }));
}

function buildSegments(samples, interval) {
  const segments = [];
  const step = Math.max(1, Math.round(25 / interval));
  for (let start = 0; start < samples.length; start += step) {
    const group = samples.slice(start, start + step + 1).filter((s) => typeof s.elevation_ft === 'number');
    if (group.length < 2) continue;
    let gain = 0;
    let loss = 0;
    for (let i = 1; i < group.length; i++) {
      const delta = group[i].elevation_ft - group[i - 1].elevation_ft;
      if (delta > 0) gain += delta;
      else loss += Math.abs(delta);
    }
    const elevations = group.map((s) => s.elevation_ft);
    segments.push({
      segment_id: `elev-seg-${String(segments.length + 1).padStart(3, '0')}`,
      route_id: 'at-main-osm-2026-open',
      start_mile_nobo: group[0].mile_nobo,
      end_mile_nobo: group[group.length - 1].mile_nobo,
      distance_miles: round(group[group.length - 1].mile_nobo - group[0].mile_nobo, 1),
      elevation_gain_ft: Math.round(gain),
      elevation_loss_ft: Math.round(loss),
      highest_point_ft: Math.max(...elevations),
      lowest_point_ft: Math.min(...elevations),
      sample_interval_miles: interval,
      limitation:
        interval <= 1
          ? '1-mile samples improve climb/descent screening but still smooth short, steep pitches; use finer 0.1-mile or DEM-based slope samples before field-grade grade-risk advice.'
          : 'Coarse 5-mile samples undercount short climbs and descents; use finer USGS 3DEP sampling before field-grade terrain advice.',
      ...baseProps(),
    });
  }
  return segments;
}

function buildGradeRiskSections(samples, interval) {
  if (interval > 1) {
    return [
      {
        route_id: 'at-main-osm-2026-open',
        source_id: 'usgs_3dep',
        source_url: epqsUrl,
        license_status: 'public_domain',
        confidence: 'insufficient_resolution_for_grade_risk',
        last_checked: baseProps().last_checked,
        limitation: `${interval}-mile elevation samples are too coarse for grade-risk detection. Generate finer 0.1-mile or DEM-based slope samples before using this for risk sections.`,
        ai_answer_rule: `Do not infer grade-risk sections from this coarse ${interval}-mile elevation file.`,
      },
    ];
  }

  const sections = [];
  for (let i = 1; i < samples.length; i++) {
    const prev = samples[i - 1];
    const cur = samples[i];
    if (typeof prev.elevation_ft !== 'number' || typeof cur.elevation_ft !== 'number') continue;
    const distanceMiles = cur.mile_nobo - prev.mile_nobo;
    if (distanceMiles <= 0) continue;
    const deltaFt = cur.elevation_ft - prev.elevation_ft;
    const averageGradePercent = Math.abs(deltaFt) / (distanceMiles * 5280) * 100;
    if (averageGradePercent < 8) continue;
    sections.push({
      segment_id: `grade-screen-${String(sections.length + 1).padStart(4, '0')}`,
      route_id: 'at-main-osm-2026-open',
      start_mile_nobo: prev.mile_nobo,
      end_mile_nobo: cur.mile_nobo,
      distance_miles: round(distanceMiles, 1),
      elevation_delta_ft: round(deltaFt, 1),
      average_grade_percent: round(averageGradePercent, 1),
      grade_direction: deltaFt >= 0 ? 'climb' : 'descent',
      source_id: 'usgs_3dep',
      source_url: epqsUrl,
      source_license: 'public_domain',
      license_status: 'public_domain',
      attribution: 'Data available from U.S. Geological Survey, 3D Elevation Program.',
      confidence: 'one_mile_grade_screening_candidate',
      last_checked: baseProps().last_checked,
      limitation:
        'Average grade is computed between 1-mile sampled points and can miss short steep pitches or switchback detail. Use as screening only, not field-grade slope analysis.',
      ai_answer_rule:
        'Describe as a 1-mile USGS 3DEP grade-screening candidate only; do not call it a precise grade-risk section without finer DEM or 0.1-mile sampling.',
    });
  }
  return sections;
}

function writeJson(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(value)}\n`, 'utf8');
}

async function main() {
  const cfg = parseArgs(process.argv);
  if (cfg.help) {
    console.log('Usage: node data/at-open-reference/scripts/build-elevation-samples.mjs [--interval 5.0|1.0] [--concurrency 4]');
    return;
  }
  if (![5, 1].includes(cfg.interval)) throw new Error(`Unsupported interval ${cfg.interval}; expected 5.0 or 1.0.`);
  const label = intervalLabel(cfg.interval);
  const milepointsPath = path.join(packRoot, 'processed', 'milepoints', `at_milepoints_${label}mi.geojson`);
  if (!fs.existsSync(milepointsPath)) throw new Error(`Missing milepoints: ${milepointsPath}`);
  const points = loadMilepoints(cfg.interval);
  const elevations = await mapLimit(points, cfg.concurrency, async (point, index) => {
    if (index > 0 && index % 50 === 0) process.stdout.write(` ${index}/${points.length}`);
    return fetchElevationFt(point.lon, point.lat);
  });
  process.stdout.write('\n');

  const samples = buildSamples(points, elevations, cfg.interval);
  const segments = buildSegments(samples, cfg.interval);
  const gradeRiskSections = buildGradeRiskSections(samples, cfg.interval);
  const validSamples = samples.filter((s) => typeof s.elevation_ft === 'number');
  const high = validSamples.reduce((best, row) => (row.elevation_ft > best.elevation_ft ? row : best), validSamples[0]);
  const low = validSamples.reduce((best, row) => (row.elevation_ft < best.elevation_ft ? row : best), validSamples[0]);

  const outDir = path.join(packRoot, 'processed', 'elevation');
  writeJson(path.join(outDir, `elevation_samples_${label}mi.json`), samples);
  writeJson(path.join(outDir, `climbs_descents_by_25mi_segment_${label}mi.json`), segments);
  writeJson(path.join(outDir, `high_low_points_${label}mi.json`), [
    { point_type: 'highest_sampled_point', ...high },
    { point_type: 'lowest_sampled_point', ...low },
  ]);
  writeJson(path.join(outDir, `grade_risk_sections_${label}mi.json`), gradeRiskSections);

  const profile = {
    type: 'FeatureCollection',
    features: samples.map((sample) => ({
      type: 'Feature',
      properties: sample,
      geometry: { type: 'Point', coordinates: [sample.lon, sample.lat] },
    })),
    properties: {
      route_id: 'at-main-osm-2026-open',
      sample_interval_miles: cfg.interval,
      ...baseProps(),
    },
  };
  writeJson(path.join(outDir, `elevation_profile_${label}mi.geojson`), profile);

  console.log(`Built ${samples.length} elevation samples, ${segments.length} segment summaries, and ${gradeRiskSections.length} grade-screening records at ${cfg.interval}-mile interval`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
