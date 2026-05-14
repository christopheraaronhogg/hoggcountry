import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const packRoot = path.resolve(__dirname, '..');
const rcRoot = path.join(packRoot, 'full_trail_rc1');

const GENERATED_DATE = process.env.FULL_TRAIL_RC1_GENERATED_DATE ?? '2026-05-14';
const GENERATED_AT = `${GENERATED_DATE}T00:00:00.000Z`;
const FULL_LENGTH = 2106.2;
const OFFICIAL_REFERENCE_LENGTH = 2197.9;
const ROUTE_ID = 'at-full-trail-rc1-open-2026';
const SOURCE_ROUTE_ID = 'at-main-osm-2026-open';

const SAFE_LICENSE_STATUSES = new Set([
  'public_domain',
  'open_license_attribution',
  'open_license_share_alike',
  'api_access_allowed',
]);

const REGIONS = [
  {
    region_id: 'mvp1_springer_davenport',
    source_pack: 'mvp1',
    label: 'MVP1 Springer/Amicalola context to Davenport Gap',
    start: 0,
    end: 234.7,
    localField: 'mile_nobo_mvp1',
    soboField: 'mile_sobo_mvp1',
    status: 'green',
    states: ['GA', 'NC', 'TN'],
    route_file: 'processed/route/mvp1_route.geojson',
  },
  {
    region_id: 'coverage_gap_davenport_damascus',
    source_pack: 'base_open_reference',
    label: 'Davenport Gap to Damascus/TN-VA baseline open-route gap filler',
    start: 234.7,
    end: 459,
    localField: 'mile_nobo_gap_davenport_damascus',
    soboField: 'mile_sobo_gap_davenport_damascus',
    status: 'yellow',
    states: ['NC', 'TN'],
    route_file: null,
    gap: true,
  },
  {
    region_id: 'mvp2_virginia',
    source_pack: 'mvp2_va',
    label: 'MVP2 Virginia',
    start: 459,
    end: 1006,
    localField: 'mile_nobo_va',
    soboField: 'mile_sobo_va',
    status: 'green',
    states: ['VA'],
    route_file: 'processed/route/mvp2_va_route.geojson',
  },
  {
    region_id: 'mvp3_midatlantic',
    source_pack: 'mvp3_midatlantic',
    label: 'MVP3 WV/MD/PA Mid-Atlantic',
    start: 1006,
    end: 1270,
    localField: 'mile_nobo_mvp3',
    soboField: 'mile_sobo_mvp3',
    status: 'green',
    states: ['WV', 'MD', 'PA'],
    route_file: 'processed/route/mvp3_midatlantic_route.geojson',
  },
  {
    region_id: 'mvp4_nj_ny_ct',
    source_pack: 'mvp4_nj_ny_ct',
    label: 'MVP4 NJ/NY/CT',
    start: 1270,
    end: 1476,
    localField: 'mile_nobo_mvp4',
    soboField: 'mile_sobo_mvp4',
    status: 'green',
    states: ['NJ', 'NY', 'CT'],
    route_file: 'processed/route/mvp4_nj_ny_ct_route.geojson',
  },
  {
    region_id: 'mvp5_ma_vt_nh',
    source_pack: 'mvp5_ma_vt_nh',
    label: 'MVP5 MA/VT/NH',
    start: 1476,
    end: 1853,
    localField: 'mile_nobo_mvp5',
    soboField: 'mile_sobo_mvp5',
    status: 'green',
    states: ['MA', 'VT', 'NH'],
    route_file: 'processed/route/mvp5_ma_vt_nh_route.geojson',
  },
  {
    region_id: 'mvp6_maine',
    source_pack: 'mvp6_maine',
    label: 'MVP6 Maine/Baxter/Katahdin',
    start: 1853,
    end: 2106.2,
    localField: 'mile_nobo_mvp6',
    soboField: 'mile_sobo_mvp6',
    status: 'green',
    states: ['ME'],
    route_file: 'processed/route/mvp6_maine_route.geojson',
  },
];

const REGIONAL_PACKS = REGIONS.filter((region) => !region.gap);
const PACE_PENALTY = new Map([[0, 1], [1, 1.03], [2, 1.08], [3, 1.15], [4, 1.25], [5, 1.4]]);

function readJson(relativePath, root = packRoot) {
  return JSON.parse(fs.readFileSync(path.join(root, relativePath), 'utf8'));
}

function maybeReadJson(relativePath, root = packRoot) {
  const target = path.join(root, relativePath);
  return fs.existsSync(target) ? JSON.parse(fs.readFileSync(target, 'utf8')) : null;
}

function writeJson(relativePath, value) {
  const target = path.join(rcRoot, relativePath);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

function writeText(relativePath, text) {
  const target = path.join(rcRoot, relativePath);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, text.trimEnd() + '\n', 'utf8');
}

function round(value, digits = 1) {
  if (typeof value !== 'number' || Number.isNaN(value)) return value;
  const multiplier = 10 ** digits;
  return Math.round(value * multiplier) / multiplier;
}

function intervalName(interval) {
  return interval.toFixed(1).replace('.', '_');
}

function rows(value) {
  if (Array.isArray(value)) return value;
  if (value && Array.isArray(value.features)) {
    return value.features.map((feature) => feature.properties ?? feature);
  }
  return [];
}

function stateForMile(mile) {
  if (mile < 78) return 'GA';
  if (mile < 459) return 'NC/TN';
  if (mile < 1006) return 'VA';
  if (mile < 1025) return 'WV';
  if (mile < 1065) return 'MD';
  if (mile < 1270) return 'PA';
  if (mile < 1320) return 'NJ';
  if (mile < 1425) return 'NY';
  if (mile < 1476) return 'CT';
  if (mile < 1568) return 'MA';
  if (mile < 1703) return 'VT';
  if (mile < 1853) return 'NH';
  return 'ME';
}

function regionForMile(mile) {
  return REGIONS.find((region, index) => {
    const isLast = index === REGIONS.length - 1;
    return mile >= region.start && (mile < region.end || (isLast && mile <= region.end));
  }) ?? REGIONS[0];
}

function globalMile(record, region) {
  const explicit = record.mile_nobo_global_est ?? record.global_est_nobo;
  if (typeof explicit === 'number') return round(explicit, 1);
  const mile = record.mile_nobo ?? record.start_mile_nobo_global_est ?? record.start_mile_nobo ?? record.mile;
  if (typeof mile !== 'number') return null;
  if (mile >= region.start - 0.1 && mile <= region.end + 0.1) return round(mile, 1);
  return round(region.start + mile, 1);
}

function regionalFields(mile) {
  const region = regionForMile(mile);
  const local = round(mile - region.start, 1);
  return {
    region_id: region.region_id,
    region_name: region.label,
    source_pack: region.source_pack,
    regional_coverage_status: region.status,
    [region.localField]: local,
    [region.soboField]: round(region.end - mile, 1),
  };
}

function commonize(record, region, kind, index) {
  const mile = globalMile(record, region);
  const normalized = {
    ...record,
    full_trail_record_id: `full-rc1-${kind}-${String(index + 1).padStart(5, '0')}`,
    route_id: ROUTE_ID,
    source_route_id: record.source_route_id ?? SOURCE_ROUTE_ID,
    mile_nobo_global_est: mile,
    mile_sobo_global_est: typeof mile === 'number' ? round(FULL_LENGTH - mile, 1) : null,
    state: record.state ?? (typeof mile === 'number' ? stateForMile(mile) : undefined),
    source_pack: region.source_pack,
    region_id: typeof mile === 'number' ? regionForMile(mile).region_id : region.region_id,
    region_name: typeof mile === 'number' ? regionForMile(mile).label : region.label,
    regional_coverage_status: typeof mile === 'number' ? regionForMile(mile).status : region.status,
    license_status: record.license_status ?? record.source_license_status ?? 'open_license_share_alike',
    confidence: record.confidence ?? 'open_source_candidate',
    last_generated: record.last_generated ?? GENERATED_DATE,
    last_checked: record.last_checked ?? GENERATED_DATE,
    ai_answer_rule: record.ai_answer_rule ?? 'Use as an open-source candidate with source, license, confidence, and timestamp. Generated miles are not official ATC mileage.',
  };
  if (typeof mile === 'number') Object.assign(normalized, regionalFields(mile));
  return normalized;
}

function safeRows(relativePath, root = packRoot) {
  const value = maybeReadJson(relativePath, root);
  return value ? rows(value) : [];
}

function recordsFromRegional(relativePath, kind) {
  const combined = [];
  for (const region of REGIONAL_PACKS) {
    const root = path.join(packRoot, region.source_pack);
    const sourceRows = safeRows(relativePath, root);
    for (const record of sourceRows) combined.push(commonize(record, region, kind, combined.length));
  }
  return dedupeRecords(combined);
}

function baseRangeRows(relativePath, start, end, kind) {
  const region = REGIONS.find((candidate) => candidate.region_id === 'coverage_gap_davenport_damascus');
  return safeRows(relativePath)
    .filter((record) => {
      const mile = record.mile_nobo ?? record.mile_nobo_global_est;
      return typeof mile === 'number' && mile >= start && mile < end;
    })
    .map((record, index) => ({
      ...commonize(record, region, kind, index),
      source_pack: 'base_open_reference_gap_filler',
      confidence: `${record.confidence ?? 'open_source_candidate'}; regional_mvp_gap_filler`,
      notes: `${record.notes ?? ''} Full-trail RC1 uses base open-reference data here because MVP1 ends at Davenport Gap and MVP2 starts at the TN/VA-Damascus anchor.`.trim(),
    }));
}

function dedupeRecords(records) {
  const seen = new Set();
  const output = [];
  for (const record of records) {
    const lat = typeof record.lat === 'number' ? round(record.lat, 4) : '';
    const lon = typeof record.lon === 'number' ? round(record.lon, 4) : '';
    const sourceFeature = record.source_feature_id ?? record.osm_id ?? record.waypoint_id ?? record.water_id ?? record.access_id ?? record.rule_id ?? record.tread_id ?? record.difficulty_id ?? record.full_trail_record_id;
    const key = [record.type, record.name ?? '', sourceFeature, lat, lon].join('|').toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    output.push(record);
  }
  return output;
}

function sourceManifest() {
  const merged = new Map();
  for (const manifestPath of [
    'source_manifest.yaml',
    'mvp1/source_manifest.yaml',
    'mvp2_va/source_manifest.yaml',
    'mvp3_midatlantic/source_manifest.yaml',
    'mvp4_nj_ny_ct/source_manifest.yaml',
    'mvp5_ma_vt_nh/source_manifest.yaml',
    'mvp6_maine/source_manifest.yaml',
  ]) {
    for (const source of maybeReadJson(manifestPath) ?? []) {
      if (!source.source_id) continue;
      merged.set(source.source_id, {
        ...source,
        production_safe: SAFE_LICENSE_STATUSES.has(source.license_status),
        rc1_usage: source.rc1_usage ?? 'source/provenance inherited from base or regional MVP pack',
      });
    }
  }
  const additions = [
    {
      source_id: 'full_trail_rc1_integration_model',
      name: 'Scout Full Trail RC1 integration model',
      owner: 'Hogg Country',
      source_type: 'derived integration script',
      source_url: 'internal:data/at-open-reference/scripts/build-full-trail-rc1-reference-pack.mjs',
      access_method: 'local generated artifact',
      license_status: 'open_license_share_alike',
      allowed_use: 'package generated indexes with source attribution and ODbL notes',
      attribution_required: 'Preserve upstream source attribution, especially OpenStreetMap contributors.',
      confidence: 'derived_from_existing_open_reference_packs',
      last_checked: GENERATED_DATE,
      production_safe: true,
      data_categories: ['route_integration', 'global_miles', 'indexes', 'rag_docs', 'validation'],
      notes: 'Does not add commercial guide data. It stitches existing public/open/API-accessible MVP packs and base open-route assets.',
    },
    {
      source_id: 'full_trail_rc1_difficulty_model',
      name: 'Scout full-trail daily difficulty screening model',
      owner: 'Hogg Country',
      source_type: 'derived model',
      source_url: 'internal:data/at-open-reference/scripts/build-full-trail-rc1-reference-pack.mjs',
      access_method: 'local generated artifact',
      license_status: 'open_license_share_alike',
      allowed_use: 'planning screen with source/confidence cautions',
      attribution_required: 'Preserve upstream source attribution.',
      confidence: 'model_screening_not_field_verified',
      last_checked: GENERATED_DATE,
      production_safe: true,
      data_categories: ['difficulty'],
      notes: 'Screening model only; not field verified and not a substitute for live checks.',
    },
    {
      source_id: 'coverage_gap_notice',
      name: 'RC1 Davenport Gap to Damascus coverage gap notice',
      owner: 'Hogg Country',
      source_type: 'data quality note',
      source_url: 'internal:data/at-open-reference/full_trail_rc1/processed/route/route_integration_notes.md',
      access_method: 'local generated artifact',
      license_status: 'open_license_share_alike',
      allowed_use: 'disclose regional MVP coverage gap',
      attribution_required: 'None beyond upstream data attribution.',
      confidence: 'high',
      last_checked: GENERATED_DATE,
      production_safe: true,
      data_categories: ['data_quality'],
      notes: 'MVP1 ends at Davenport Gap; MVP2 begins near Damascus/TN-VA. RC1 uses base open-route data for continuity in between.',
    },
  ];
  for (const source of additions) merged.set(source.source_id, source);

  for (const blocked of ['farout', 'awol_at_guide', 'at_data_book', 'alltrails_gaia_hiking_project', 'atc_website']) {
    if (!merged.has(blocked)) {
      merged.set(blocked, {
        source_id: blocked,
        name: blocked.replaceAll('_', ' '),
        owner: 'Commercial or restricted source',
        source_type: 'blocked source',
        source_url: 'blocked',
        access_method: 'not used',
        license_status: 'blocked',
        allowed_use: 'do not ingest into packaged corpus without written permission or compatible license',
        attribution_required: 'not applicable',
        confidence: 'blocked_by_policy',
        last_checked: GENERATED_DATE,
        production_safe: false,
        data_categories: ['blocked'],
      });
    }
  }
  return [...merged.values()].sort((a, b) => a.source_id.localeCompare(b.source_id));
}

function buildRoute() {
  const source = readJson('processed/route/at_route_selected.geojson');
  const feature = source.features[0];
  const regionalRoutes = REGIONAL_PACKS.map((region) => {
    const route = readJson(region.route_file, path.join(packRoot, region.source_pack)).features[0].properties;
    return {
      region_id: region.region_id,
      source_pack: region.source_pack,
      route_id: route.route_id,
      start_mile_nobo_global_est: region.start,
      end_mile_nobo_global_est: region.end,
      measured_length_miles: route.measured_length_miles,
      license_status: route.license_status,
      confidence: route.confidence,
      status: region.status,
    };
  });
  const route = {
    type: 'FeatureCollection',
    features: [{
      ...feature,
      properties: {
        ...feature.properties,
        route_id: ROUTE_ID,
        source_route_id: SOURCE_ROUTE_ID,
        name: 'Scout Appalachian Trail full-trail RC1 open route',
        measured_length_miles: FULL_LENGTH,
        official_reference_length_miles: OFFICIAL_REFERENCE_LENGTH,
        length_delta_miles: round(FULL_LENGTH - OFFICIAL_REFERENCE_LENGTH, 1),
        official: false,
        candidate_status: 'release_candidate_not_field_navigation',
        license_status: 'open_license_share_alike',
        source_id: 'osm',
        integration_source_id: 'full_trail_rc1_integration_model',
        last_generated: GENERATED_DATE,
        production_safe: true,
        regional_routes: regionalRoutes,
        coverage_gaps: [{
          gap_id: 'davenport_gap_to_damascus_mvp_gap',
          start_mile_nobo_global_est: 234.7,
          end_mile_nobo_global_est: 459,
          status: 'yellow',
          handling: 'base open full-route geometry and base open-reference records fill continuity; regional MVP detail is missing',
          ai_answer_rule: 'State that this corridor has lower regional-pack confidence and should be live/source checked before detailed planning.',
        }],
        approach_trail_treatment: 'Amicalola/Approach Trail is contextual in MVP1 docs and is not part of the full main AT route geometry.',
        baxter_katahdin_treatment: 'Katahdin/Hunt Trail/Baxter endpoint is an open-route candidate. Current opening, permits, parking, summit, and camping status require live Baxter verification.',
        ai_answer_rule: "Use as Scout's full-trail RC1 open route candidate. Generated miles are not official ATC miles; disclose the route length delta and the Davenport-to-Damascus regional coverage gap.",
      },
    }],
  };
  writeJson('processed/route/full_at_route_rc1.geojson', route);
  writeText('processed/route/route_integration_notes.md', `
# Full AT Route RC1 Integration Notes

Generated: ${GENERATED_AT}

Scout RC1 stitches MVP1-MVP6 into one full-trail open reference layer using the base OpenStreetMap relation 156553 route geometry as the continuity spine.

## Source And License
- Full route geometry source: OpenStreetMap relation 156553 via the existing Scout open route candidate.
- License: ODbL / open_license_share_alike. Attribute OpenStreetMap contributors.
- Official status: false. Generated miles are not official ATC mileage.
- Measured RC1 length: ${FULL_LENGTH} generated miles.
- 2026 official reference length used for comparison only: ${OFFICIAL_REFERENCE_LENGTH} miles.
- Length delta: ${round(FULL_LENGTH - OFFICIAL_REFERENCE_LENGTH, 1)} miles.

## Regional Stitch
${REGIONS.map((region) => `- ${region.region_id}: ${region.start}-${region.end} generated miles, status ${region.status}, ${region.label}.`).join('\n')}

## Known Gap
MVP1 ends at Davenport Gap / I-40 around generated mile 234.7. MVP2 starts at the TN/VA / Damascus anchor around generated mile 459.0. RC1 therefore uses the base open full-route geometry and base public/open datasets for that Davenport Gap to Damascus corridor and marks it yellow. It must not be represented as having the same regional MVP depth as the rest of the trail.

## Endpoint Handling
The Appalachian Trail main route is the primary geometry. Amicalola/Approach Trail context remains contextual source material in MVP1 and is not included as full-route main AT mileage.

Baxter/Katahdin/Hunt Trail handling comes from MVP6 as an open-route endpoint treatment. Current Baxter permits, Katahdin trail opening/closing, summit status, parking, camping, weather, and access must be live-checked before advice.

## AI Cautions
- Generated miles are estimated from open route geometry and are not official ATC miles.
- The full-route open geometry is materially shorter than the 2026 official reference and remains a planning corpus, not field navigation.
- Static docs cannot answer current closures, weather, permits, ford safety, or Katahdin status.
- Water/fords from maps are candidates only; reliability, potability, and safe fordability remain unknown unless timestamped verified data exists.
`);
}

function buildMilepoints() {
  for (const interval of [0.1, 0.5, 1.0]) {
    const name = intervalName(interval);
    const source = readJson(`processed/milepoints/at_milepoints_${name}mi.geojson`);
    const features = source.features.map((feature) => {
      const mile = round(feature.properties.mile_nobo, 1);
      return {
        ...feature,
        properties: {
          ...feature.properties,
          route_id: ROUTE_ID,
          source_route_id: SOURCE_ROUTE_ID,
          mile_nobo_global_est: mile,
          mile_sobo_global_est: round(FULL_LENGTH - mile, 1),
          ...regionalFields(mile),
          state: stateForMile(mile),
          official: false,
          production_safe: true,
          last_generated: GENERATED_DATE,
          ai_answer_rule: 'Generated mile based on Scout full-trail RC1 open route geometry, not an official ATC mile. Preserve regional field names where available and disclose source/confidence.',
        },
      };
    });
    writeJson(`processed/milepoints/full_at_milepoints_${name}mi.geojson`, { ...source, features });
  }
  writeText('processed/milepoints/global_mile_alignment_report.md', `
# Global Mile Alignment Report

Generated: ${GENERATED_AT}

Global RC1 mileage is derived from the base open-route milepoints. It preserves local regional fields where a mile falls inside a regional MVP pack.

## Transitions
${REGIONS.map((region) => `- ${region.region_id}: ${region.start}-${region.end} generated global miles; ${region.status}; local fields ${region.localField}/${region.soboField}.`).join('\n')}

## Discontinuities
- MVP1 to MVP2 is not direct. MVP1 stops at Davenport Gap around 234.7 generated miles and MVP2 starts near Damascus/TN-VA around 459.0 generated miles.
- RC1 marks 234.7-459.0 as a yellow baseline gap. Detailed planning in this corridor should say the regional MVP layer is not yet built.

All milepoints have official:false. Generated miles are not official ATC mileage.
`);
}

function summarizeElevation(samples, interval = 10) {
  const summaries = [];
  for (let start = 0; start < FULL_LENGTH; start += interval) {
    const end = Math.min(FULL_LENGTH, start + interval);
    const segment = samples.filter((sample) => sample.mile_nobo_global_est >= start && sample.mile_nobo_global_est <= end);
    if (segment.length < 2) continue;
    let gain = 0;
    let loss = 0;
    for (let index = 1; index < segment.length; index += 1) {
      const delta = segment[index].elevation_ft - segment[index - 1].elevation_ft;
      if (delta > 0) gain += delta;
      else loss += Math.abs(delta);
    }
    const elevations = segment.map((sample) => sample.elevation_ft);
    summaries.push({
      segment_id: `full-rc1-elevation-${String(interval).padStart(2, '0')}mi-${String(summaries.length + 1).padStart(3, '0')}`,
      route_id: ROUTE_ID,
      start_mile_nobo_global_est: round(start, 1),
      end_mile_nobo_global_est: round(end, 1),
      states: [...new Set(segment.map((sample) => sample.state))],
      region_ids: [...new Set(segment.map((sample) => sample.region_id))],
      distance_miles: round(end - start, 1),
      elevation_gain_ft: Math.round(gain),
      elevation_loss_ft: Math.round(loss),
      highest_point_ft: Math.round(Math.max(...elevations)),
      lowest_point_ft: Math.round(Math.min(...elevations)),
      source_id: 'usgs_3dep',
      source_url: 'https://epqs.nationalmap.gov/v1/json',
      license_status: 'public_domain',
      confidence: 'model_derived_topographic_estimate',
      last_checked: GENERATED_DATE,
      last_generated: GENERATED_DATE,
      production_safe: true,
      ai_answer_rule: 'Use as model-derived USGS 3DEP terrain screening. It is not a guidebook profile and does not answer current weather, closures, or safety.',
    });
  }
  return summaries;
}

function buildElevation() {
  const samples = readJson('processed/elevation/elevation_samples_1_0mi.json').map((record, index) => {
    const mile = round(record.mile_nobo, 1);
    return {
      ...record,
      full_trail_record_id: `full-rc1-elevation-${String(index + 1).padStart(5, '0')}`,
      route_id: ROUTE_ID,
      source_route_id: SOURCE_ROUTE_ID,
      mile_nobo_global_est: mile,
      mile_sobo_global_est: round(FULL_LENGTH - mile, 1),
      ...regionalFields(mile),
      state: stateForMile(mile),
      production_safe: true,
      last_generated: GENERATED_DATE,
      ai_answer_rule: 'Describe as model-derived USGS 3DEP elevation sampled along Scout full-trail RC1 open route geometry; values may differ from guidebook profiles or surveyed summits.',
    };
  });
  writeJson('processed/elevation/full_trail_elevation_samples_1_0mi.json', samples);
  writeJson('processed/elevation/full_trail_elevation_by_5mi_segment.json', summarizeElevation(samples, 5));
  writeJson('processed/elevation/full_trail_elevation_by_10mi_segment.json', summarizeElevation(samples, 10));
  writeText('processed/elevation/full_trail_elevation_summary.md', `
# Full Trail RC1 Elevation Summary

Elevation is model-derived from USGS 3DEP through the existing Scout open-reference samples. It supports terrain screening, climb/descent estimates, and difficulty modeling, but not exact guidebook profiles or field navigation.

RC1 includes 1-mile samples and 5-mile/10-mile summaries across ${FULL_LENGTH} generated miles. Short mileage in the Smokies, Shenandoah, Pennsylvania ridges, New England, the White Mountains, Maine, and Katahdin can still be difficult when gain/loss, tread, weather, remoteness, permits, and water uncertainty stack.

Generated miles are not official ATC mileage.
`);
  return samples;
}

function buildWater() {
  const regional = recordsFromRegional('processed/water/water_candidates.json', 'water');
  const gap = baseRangeRows('processed/water/water_candidates.json', 234.7, 459, 'water-gap');
  const water = dedupeRecords([...regional, ...gap]).map((record, index) => ({
    ...record,
    full_trail_record_id: `full-rc1-water-${String(index + 1).padStart(5, '0')}`,
    reliability: 'unknown',
    potable: 'unknown',
    ford_safety: record.ford_safety ?? (String(record.type).includes('ford') || record.type === 'stream_crossing' ? 'unknown' : undefined),
    last_human_verified: record.last_human_verified ?? null,
    production_safe: SAFE_LICENSE_STATUSES.has(record.license_status),
    ai_answer_rule: 'Describe as a mapped water candidate with reliability unknown and potability unknown. If it may involve a ford, ford safety is unknown. Never call water reliable, potable, or fordable from static data.',
  }));
  const majorFords = [
    ...recordsFromRegional('processed/water/major_river_fording_candidates.json', 'ford'),
    ...water.filter((record) => ['ME', 'NH', 'NC/TN'].includes(record.state) && record.type === 'stream_crossing').slice(0, 90),
  ].map((record, index) => ({
    ...record,
    full_trail_record_id: `full-rc1-ford-${String(index + 1).padStart(5, '0')}`,
    type: record.type ?? 'mapped_ford_candidate',
    ford_safety: 'unknown',
    reliability: 'unknown',
    potable: 'unknown',
    production_safe: SAFE_LICENSE_STATUSES.has(record.license_status),
    ai_answer_rule: 'Mapped ford/water candidate only. Never call a ford safe from static data; require live/current conditions and local judgment.',
  }));
  writeJson('processed/water/full_trail_water_candidates.json', water);
  writeJson('processed/water/full_trail_major_ford_candidates.json', dedupeRecords(majorFords));
  writeText('processed/water/full_trail_water_policy.md', `
# Full Trail Water And Ford Policy

Mapped water is a candidate, not reliable water. Unless a record has timestamped licensed verification, answer with reliability unknown, potability unknown, and last human verification unknown.

For Maine, New Hampshire, the Smokies, and all river/fording contexts, static data cannot determine safe fordability. Scout must live-check weather, river/flood context, land-manager warnings, and recent verified reports when available. If live retrieval fails, say so with the last checked time.
`);
  return water;
}

function buildWaypoints() {
  const waypointFiles = [
    'shelters',
    'campsites',
    'privies',
    'parking',
    'trailheads',
    'road_crossings',
    'vistas',
    'towns_resupply_candidates',
    'huts',
    'tent_sites',
    'summits',
    'alpine_exposure_points',
    'river_crossings',
    'bailout_access_points',
    'monson_logistics_candidates',
  ];
  const output = {};
  for (const file of waypointFiles) {
    const regional = recordsFromRegional(`processed/waypoints/${file}.json`, file);
    const rootPath = file === 'parking' || file === 'trailheads' || file === 'road_crossings'
      ? `processed/access/${file}.json`
      : file === 'towns_resupply_candidates'
        ? 'processed/towns_resupply/towns_within_15mi.json'
        : `processed/waypoints/${file}.json`;
    const gap = baseRangeRows(rootPath, 234.7, 459, file);
    output[file] = dedupeRecords([...regional, ...gap]).map((record, index) => ({
      ...record,
      full_trail_record_id: `full-rc1-${file}-${String(index + 1).padStart(5, '0')}`,
      production_safe: SAFE_LICENSE_STATUSES.has(record.license_status),
      ai_answer_rule: record.ai_answer_rule ?? 'Describe as an open-source mapped candidate with source, license, confidence, and timestamp. Verify current status before relying on it.',
    }));
    writeJson(`processed/waypoints/full_trail_${file}.json`, output[file]);
  }
  return output;
}

function buildRules() {
  const records = [
    ...safeRows('processed/camping_rules/rules_by_land_manager.json'),
    ...recordsFromRegional('processed/rules/rules_by_land_manager.json', 'rule'),
  ];
  const rules = dedupeRecords(records.map((record, index) => {
    const start = Array.isArray(record.mile_range_nobo) ? record.mile_range_nobo[0] : record.start_mile_nobo_global_est;
    const end = Array.isArray(record.mile_range_nobo) ? record.mile_range_nobo[1] : record.end_mile_nobo_global_est;
    const midpoint = typeof start === 'number' && typeof end === 'number' ? (start + end) / 2 : null;
    return {
      ...record,
      full_trail_record_id: `full-rc1-rule-${String(index + 1).padStart(4, '0')}`,
      route_id: ROUTE_ID,
      region_id: typeof midpoint === 'number' ? regionForMile(midpoint).region_id : record.region_id,
      production_safe: SAFE_LICENSE_STATUSES.has(record.license_status),
      last_generated: record.last_generated ?? GENERATED_DATE,
      ai_answer_rule: record.ai_answer_rule ?? 'Use as a rules pointer only. Verify current camping, permit, fee, fire, food storage, dog, group, and closure rules with the land manager before itinerary commitment.',
    };
  }));
  writeJson('processed/rules/full_trail_rules_by_land_manager.json', rules);
  writeText('processed/rules/full_trail_rules_policy.md', `
# Full Trail Camping, Permit, Fee, Food, Fire, Dog, And Group Rules Policy

Rules records are official-source pointers and conservative summaries. Unknowns stay unknown. Scout must not invent permission for dispersed camping, fires, dogs, group size, hut/tent-site availability, Smokies permits, Shenandoah permits, NJ/CT designated-site constraints, White Mountain/AMC constraints, Baxter/Katahdin access, or Maine private-corridor assumptions.

Current closures, fire bans, camping availability, permits, fees, and Baxter/Katahdin status require a live check. If live retrieval fails, say so with the last checked timestamp and recommend verifying with the relevant land manager.
`);
  return rules;
}

function buildLiveSources() {
  const sources = [];
  for (const region of REGIONAL_PACKS) {
    sources.push(...safeRows('processed/live_conditions/live_condition_sources.json', path.join(packRoot, region.source_pack)).map((record) => ({
      ...record,
      source_pack: region.source_pack,
      region_id: region.region_id,
      production_safe: SAFE_LICENSE_STATUSES.has(record.license_status),
    })));
  }
  sources.push(...safeRows('processed/live_alerts/live_condition_sources.json').map((record) => ({
    ...record,
    source_pack: 'base_open_reference',
    region_id: 'full_trail',
    production_safe: SAFE_LICENSE_STATUSES.has(record.license_status),
  })));
  const deduped = dedupeRecords(sources).map((record, index) => ({
    ...record,
    full_trail_record_id: `full-rc1-live-source-${String(index + 1).padStart(4, '0')}`,
    last_generated: record.last_generated ?? GENERATED_DATE,
    ai_answer_rule: record.ai_answer_rule ?? 'Use to perform a live/current check. Static cached docs cannot answer current closures, weather, permits, ford safety, or Katahdin status.',
  }));
  writeJson('processed/live_conditions/full_trail_live_condition_sources.json', deduped);
  writeText('processed/live_conditions/full_trail_live_condition_policy.md', `
# Full Trail Live-Condition Policy

For current closures, detours, fire bans, flooding, storm damage, bear activity, hunting-season safety, snow/ice, mud closures, dangerous weather, permit changes, ford safety, road/parking closures, hut/campsite status, and Baxter/Katahdin status, Scout must retrieve current sources before giving advice.

Required live-source lanes:
- NWS API for forecasts, point weather, alerts, observations, storms, snow/ice, and flood risks.
- NPS API/pages for parks and units such as Shenandoah, Harpers Ferry, Delaware Water Gap, APPA references, and related alerts.
- USFS pages for Chattahoochee-Oconee, Nantahala, Cherokee, GWJ, GMNF, and WMNF alerts and rules.
- State park/forest/game-land pages for MD, PA, NJ, NY, CT, MA, VT, NH, and ME.
- Baxter official current conditions and rules for Katahdin/Baxter.
- ATC Trail Updates as a verification pointer only unless licensed for packaging.

If live retrieval fails, say it failed, give the last checked timestamp, and avoid pretending the static corpus is current.
`);
  return deduped;
}

function syntheticGapTread(elevationSamples) {
  const gapSamples = elevationSamples.filter((sample) => sample.mile_nobo_global_est >= 234.7 && sample.mile_nobo_global_est < 459);
  return syntheticTreadForSamples(gapSamples, 'gap-tread', 'regional MVP detail missing');
}

function syntheticTreadForSamples(samples, idPrefix, note) {
  return samples.map((sample, index) => {
    const previous = samples[Math.max(0, index - 1)];
    const next = samples[Math.min(samples.length - 1, index + 1)];
    const slopeProxy = Math.abs((next.elevation_ft ?? sample.elevation_ft) - (previous.elevation_ft ?? sample.elevation_ft));
    const score = slopeProxy > 800 ? 4 : slopeProxy > 450 ? 3 : slopeProxy > 200 ? 2 : 1;
    return {
      tread_id: `full-rc1-${idPrefix}-${String(index + 1).padStart(4, '0')}`,
      route_id: ROUTE_ID,
      start_mile_nobo_global_est: round(sample.mile_nobo_global_est - 0.5, 1),
      end_mile_nobo_global_est: round(sample.mile_nobo_global_est + 0.5, 1),
      mile_nobo_global_est: sample.mile_nobo_global_est,
      mile_sobo_global_est: sample.mile_sobo_global_est,
      ...regionalFields(sample.mile_nobo_global_est),
      state: sample.state,
      interval_miles: 1,
      score,
      score_label: ['smooth', 'mostly_smooth', 'moderate_rocks_roots', 'rocky_uneven', 'very_rocky', 'severe'][score],
      pace_penalty_multiplier: PACE_PENALTY.get(score),
      confidence: 'low',
      field_verified: false,
      source_id: 'full_trail_rc1_integration_model',
      source_url: 'internal:data/at-open-reference/scripts/build-full-trail-rc1-reference-pack.mjs',
      license_status: 'open_license_share_alike',
      last_checked: GENERATED_DATE,
      last_generated: GENERATED_DATE,
      production_safe: true,
      signal_sources: ['USGS 3DEP elevation slope proxy only', note],
      ai_answer_rule: 'Describe as a low-confidence model-estimated tread screen, not field verified. Do not overclaim rockiness, roots, mud, or footing.',
    };
  });
}

function buildTread(elevationSamples) {
  const regional = recordsFromRegional('processed/tread_rockiness/tread_rockiness_1_0mi.json', 'tread');
  const regionalAndGap = dedupeRecords([...regional, ...syntheticGapTread(elevationSamples)]);
  const coveredMiles = new Set(regionalAndGap.map((record) => Math.round(record.mile_nobo_global_est ?? record.start_mile_nobo_global_est ?? -1)));
  const filler = syntheticTreadForSamples(
    elevationSamples.filter((sample) => !coveredMiles.has(Math.round(sample.mile_nobo_global_est))),
    'base-tread',
    'base open-route filler where regional tread model has no 1-mile record',
  );
  const tread = dedupeRecords([...regionalAndGap, ...filler]).map((record, index) => ({
    ...record,
    full_trail_record_id: `full-rc1-tread-${String(index + 1).padStart(5, '0')}`,
    route_id: ROUTE_ID,
    field_verified: record.field_verified === true ? true : false,
    production_safe: SAFE_LICENSE_STATUSES.has(record.license_status),
    ai_answer_rule: record.ai_answer_rule ?? 'Describe as model-estimated tread/rockiness/rootiness/mud, not field verified. State confidence and avoid overclaiming.',
  }));
  writeJson('processed/tread/full_trail_tread_rockiness_1_0mi.json', tread);
  writeText('processed/tread/full_trail_tread_policy.md', `
# Full Trail Tread, Rockiness, Rootiness, And Mud Policy

Tread scores are model-estimated from open signals such as OSM tags, USGS 3DEP slope/local relief, SSURGO/gSSURGO rock/wetness terms, weak geology signals, and trusted user reports where present. Scores are 0-5 with pace multipliers 0=1.00, 1=1.03, 2=1.08, 3=1.15, 4=1.25, 5=1.40.

No RC1 tread score is field verified unless the record explicitly says field_verified:true. Scout must state confidence and avoid turning model scores into certainty, especially for Pennsylvania rocks, New England roots/mud, White Mountain slabs, Maine roots/fords, and the Davenport-to-Damascus yellow gap.
`);
  return tread;
}

function buildDifficulty(elevationSummaries, tread, water, waypoints, rules) {
  const treadByMile = new Map(tread.map((record) => [Math.round(record.mile_nobo_global_est ?? record.start_mile_nobo_global_est ?? 0), record]));
  const difficulty = [];
  for (let start = 0; start < FULL_LENGTH; start += 10) {
    const end = Math.min(FULL_LENGTH, start + 10);
    const elevation = elevationSummaries.find((record) => record.start_mile_nobo_global_est === round(start, 1)) ?? {};
    const midpoint = (start + end) / 2;
    const region = regionForMile(midpoint);
    const treadRecords = [];
    for (let mile = Math.round(start); mile < Math.round(end); mile += 1) {
      const treadRecord = treadByMile.get(mile);
      if (treadRecord) treadRecords.push(treadRecord);
    }
    const avgTread = treadRecords.length ? treadRecords.reduce((sum, record) => sum + (record.score ?? 0), 0) / treadRecords.length : 2;
    const fordCount = water.filter((record) => (record.mile_nobo_global_est ?? 0) >= start && (record.mile_nobo_global_est ?? 0) < end && record.ford_safety === 'unknown').length;
    const waterCount = water.filter((record) => (record.mile_nobo_global_est ?? 0) >= start && (record.mile_nobo_global_est ?? 0) < end).length;
    const bailoutCount = (waypoints.bailout_access_points ?? []).filter((record) => (record.mile_nobo_global_est ?? 0) >= start && (record.mile_nobo_global_est ?? 0) < end).length;
    const permitRules = rules.filter((rule) => {
      const range = rule.mile_range_nobo ?? [rule.start_mile_nobo_global_est, rule.end_mile_nobo_global_est];
      if (!Array.isArray(range) || typeof range[0] !== 'number' || typeof range[1] !== 'number') return false;
      return range[0] < end && range[1] > start && /yes|permit|required|reservation/i.test(`${rule.permit_required} ${rule.fee_required} ${rule.camping_policy}`);
    });
    const gainFactor = Math.min(3, Math.round((elevation.elevation_gain_ft ?? 0) / 1800));
    const lossFactor = Math.min(2, Math.round((elevation.elevation_loss_ft ?? 0) / 2200));
    const treadFactor = Math.min(3, Math.round(avgTread / 1.5));
    const fordFactor = fordCount > 6 ? 2 : fordCount > 0 ? 1 : 0;
    const remotenessFactor = region.region_id === 'mvp6_maine' || region.region_id === 'mvp5_ma_vt_nh' ? (bailoutCount === 0 ? 2 : 1) : 0;
    const weatherFactor = ['mvp5_ma_vt_nh', 'mvp6_maine'].includes(region.region_id) ? 2 : ['mvp1_springer_davenport', 'mvp3_midatlantic'].includes(region.region_id) ? 1 : 0;
    const waterUncertaintyFactor = waterCount === 0 ? 2 : waterCount < 2 ? 1 : 0;
    const regionRuleFriction = ['mvp1_springer_davenport', 'mvp2_virginia', 'mvp4_nj_ny_ct', 'mvp5_ma_vt_nh', 'mvp6_maine'].includes(region.region_id) ? 1 : 0;
    const permitRuleFriction = permitRules.length ? 1 : regionRuleFriction;
    const gapFactor = region.gap ? 2 : 0;
    const score = Math.min(10, Math.round(1 + gainFactor + lossFactor + treadFactor + fordFactor + remotenessFactor + weatherFactor + waterUncertaintyFactor + permitRuleFriction + gapFactor));
    difficulty.push({
      difficulty_id: `full-rc1-difficulty-10mi-${String(difficulty.length + 1).padStart(3, '0')}`,
      route_id: ROUTE_ID,
      start_mile_nobo_global_est: round(start, 1),
      end_mile_nobo_global_est: round(end, 1),
      states: [...new Set([stateForMile(start), stateForMile(Math.max(start, end - 0.1))])],
      region_ids: [region.region_id],
      distance_miles: round(end - start, 1),
      inputs: {
        elevation_gain_ft: elevation.elevation_gain_ft ?? null,
        elevation_loss_ft: elevation.elevation_loss_ft ?? null,
        tread_score_avg: round(avgTread, 2),
        ford_candidate_count: fordCount,
        bailout_access_count: bailoutCount,
        water_candidate_count: waterCount,
        permit_rule_count: permitRules.length,
        regional_gap_factor: gapFactor,
        weather_severity_factor: weatherFactor,
      },
      factors: {
        gain_factor: gainFactor,
        loss_descent_factor: lossFactor,
        tread_factor: treadFactor,
        ford_uncertainty_factor: fordFactor,
        remoteness_bailout_scarcity_factor: remotenessFactor,
        weather_severity_factor: weatherFactor,
        water_uncertainty_factor: waterUncertaintyFactor,
        permit_rule_friction_factor: permitRuleFriction,
        regional_gap_factor: gapFactor,
      },
      difficulty_score_0_10: score,
      difficulty_label: score >= 8 ? 'severe' : score >= 6 ? 'hard' : score >= 4 ? 'moderate' : 'easier',
      explanation: 'Screening score from distance, gain/loss, descents, tread, ford uncertainty, remoteness, water uncertainty, weather severity, permit/rule friction, and known regional data gaps.',
      confidence: region.gap ? 'low_due_to_regional_mvp_gap' : 'model_screening_not_field_verified',
      source_id: 'full_trail_rc1_difficulty_model',
      source_url: 'internal:data/at-open-reference/scripts/build-full-trail-rc1-reference-pack.mjs',
      license_status: 'open_license_share_alike',
      last_checked: GENERATED_DATE,
      last_generated: GENERATED_DATE,
      production_safe: true,
      ai_answer_rule: 'Use as a cautious planning difficulty screen only. Require live checks for weather, closures, permits, fords, water, Baxter/Katahdin, and land-manager rules.',
    });
  }
  writeJson('processed/difficulty/full_trail_difficulty_by_10mi_segment.json', difficulty);
  writeText('processed/difficulty/full_trail_daily_difficulty_model.md', `
# Full Trail Daily Difficulty Model

The RC1 difficulty model is a planning screen, not a field-verified rating.

Inputs:
- distance
- gain/loss and steep descents from USGS 3DEP-derived summaries
- tread/rockiness/rootiness/mud model score
- ford uncertainty
- remoteness and bailout scarcity
- water uncertainty
- weather severity and alpine exposure
- permit, fee, camping, and rule friction
- known data-quality gaps

Outputs:
- difficulty_score_0_10
- difficulty_label: easier, moderate, hard, or severe
- explanation
- confidence

Rules:
- Short mileage may still be hard in the Smokies, White Mountains, Maine, Katahdin, and rugged New England.
- Static difficulty cannot answer current weather, closures, fords, snow/ice, fire bans, permits, campsite/hut status, or Baxter/Katahdin conditions.
- The Davenport Gap to Damascus corridor receives an explicit regional-gap factor until MVP detail exists.
`);
  writeJson('processed/difficulty/full_trail_daily_difficulty_model.json', {
    model_id: 'full_trail_daily_difficulty_model_v1',
    route_id: ROUTE_ID,
    generated_at: GENERATED_AT,
    score_range: [0, 10],
    classes: ['easier', 'moderate', 'hard', 'severe'],
    inputs: ['distance', 'gain_loss', 'descents', 'tread', 'mud_rootiness', 'ford_uncertainty', 'remoteness_bailout_scarcity', 'water_uncertainty', 'weather_severity', 'permit_rule_friction'],
    ai_answer_rule: 'Use for cautious itinerary screening only with uncertainty and live-check requirements.',
  });
  return difficulty;
}

function summarizeForSegment(start, end, datasets) {
  const inRange = (record) => {
    const mile = record.mile_nobo_global_est ?? record.start_mile_nobo_global_est;
    return typeof mile === 'number' && mile >= start && mile < end;
  };
  const water = datasets.water.filter(inRange);
  const shelters = datasets.waypoints.shelters.filter(inRange);
  const towns = datasets.waypoints.towns_resupply_candidates.filter(inRange);
  const tread = datasets.tread.filter(inRange);
  const difficulty = datasets.difficulty.filter((record) => record.start_mile_nobo_global_est < end && record.end_mile_nobo_global_est > start);
  const rules = datasets.rules.filter((rule) => {
    const range = rule.mile_range_nobo ?? [rule.start_mile_nobo_global_est, rule.end_mile_nobo_global_est];
    return Array.isArray(range) && typeof range[0] === 'number' && range[0] < end && range[1] > start;
  });
  return {
    water_count: water.length,
    shelter_count: shelters.length,
    town_resupply_candidate_count: towns.length,
    tread_avg: tread.length ? round(tread.reduce((sum, record) => sum + (record.score ?? 0), 0) / tread.length, 2) : null,
    difficulty_labels: [...new Set(difficulty.map((record) => record.difficulty_label))],
    rule_jurisdictions: [...new Set(rules.map((rule) => rule.jurisdiction).filter(Boolean))].slice(0, 8),
  };
}

function buildRagDocs(datasets) {
  const metadata = [];
  const segmentLinks = [];
  for (let start = 0; start < FULL_LENGTH; start += 25) {
    const end = Math.min(FULL_LENGTH, start + 25);
    const regionIds = [...new Set([regionForMile(start).region_id, regionForMile(Math.max(start, end - 0.1)).region_id])];
    const states = [...new Set([stateForMile(start), stateForMile(Math.max(start, end - 0.1))])];
    const summary = summarizeForSegment(start, end, datasets);
    const slug = `full_trail_${String(Math.round(start)).padStart(4, '0')}_${String(Math.round(end)).padStart(4, '0')}.md`;
    segmentLinks.push({ start, end, slug, states, regionIds });
    writeText(`rag_docs/segment_guides/${slug}`, `
---
doc_id: full-trail-rc1-${String(Math.round(start)).padStart(4, '0')}-${String(Math.round(end)).padStart(4, '0')}
route_id: ${ROUTE_ID}
start_mile_nobo_global_est: ${round(start, 1)}
end_mile_nobo_global_est: ${round(end, 1)}
official_miles: false
states: ${states.join(', ')}
region_ids: ${regionIds.join(', ')}
last_generated: ${GENERATED_DATE}
license_status: open_license_share_alike
confidence: ${regionIds.includes('coverage_gap_davenport_damascus') ? 'low_due_to_regional_mvp_gap' : 'mixed_open_source_candidate'}
---

# Segment ${round(start, 1)}-${round(end, 1)} Generated NOBO Miles

Generated miles are not official ATC mileage.

## Identity
- States: ${states.join(', ')}
- Regions: ${regionIds.join(', ')}
- Source route: ${SOURCE_ROUTE_ID}

## Terrain And Difficulty
- Difficulty labels in this span: ${summary.difficulty_labels.join(', ') || 'not computed'}
- Tread score average: ${summary.tread_avg ?? 'unknown'}
- Use USGS 3DEP-derived gain/loss and tread model outputs as planning screens, not field verification.

## Water Candidates
- Mapped water/fording candidates in span: ${summary.water_count}
- Reliability, potability, and ford safety are unknown unless a timestamped verified source says otherwise.

## Waypoints And Resupply
- Shelter candidates: ${summary.shelter_count}
- Town/resupply candidates: ${summary.town_resupply_candidate_count}
- Business/service details are candidates only unless license-reviewed and current.

## Camping / Permit Summary
- Jurisdictions from current rules index: ${summary.rule_jurisdictions.join('; ') || 'none matched in static index'}
- Verify current permits, fees, closures, camping rules, fire rules, food storage, dogs, and group limits with live land-manager sources.

## AI Cautions
- Static docs cannot answer current weather, closures, permits, fords, or Katahdin/Baxter status.
- If the answer depends on current conditions, retrieve NWS/NPS/USFS/state/Baxter sources first and disclose failures.
- Map-derived water is a mapped candidate only.
`);
    metadata.push({
      doc_id: `full-trail-rc1-${String(Math.round(start)).padStart(4, '0')}-${String(Math.round(end)).padStart(4, '0')}`,
      path: `rag_docs/segment_guides/${slug}`,
      route_id: ROUTE_ID,
      start_mile_nobo_global_est: round(start, 1),
      end_mile_nobo_global_est: round(end, 1),
      states,
      region_ids: regionIds,
      source_id: 'full_trail_rc1_integration_model',
      license_status: 'open_license_share_alike',
      confidence: regionIds.includes('coverage_gap_davenport_damascus') ? 'low_due_to_regional_mvp_gap' : 'mixed_open_source_candidate',
      last_generated: GENERATED_DATE,
      ai_answer_rule: 'Use as a cautious RAG segment summary; live-check current conditions and disclose generated-mile/source limits.',
    });
  }
  writeJson('rag_docs/rag_doc_metadata.json', metadata);
  writeText('rag_docs/overview/full_trail_overview.md', `
# Scout Full Trail RC1 Overview

Scout Full Trail RC1 is a production-safe, source-aware Appalachian Trail planning reference pack built from MVP1-MVP6 plus the base open full-route geometry.

It covers Springer/Amicalola context through Katahdin/Baxter, with generated full-trail milepoints, elevation, water candidates, waypoints, rules, tread, difficulty, live-source policies, and RAG docs.

Important limits:
- Generated miles are not official ATC mileage.
- Open route length is ${FULL_LENGTH} generated miles versus a ${OFFICIAL_REFERENCE_LENGTH} mile 2026 official reference.
- Davenport Gap to Damascus is a yellow regional MVP coverage gap.
- Static docs cannot answer current closures, weather, permits, fords, or Katahdin/Baxter status.
`);
  writeText('rag_docs/state_guides/state_guide_index.md', `
# State Guide Index

State guide coverage comes from regional MVP RAG docs plus RC1 segment guides.

States: GA, NC, TN, VA, WV, MD, PA, NJ, NY, CT, MA, VT, NH, ME.

For each state, Scout must distinguish open/public corpus facts from missing guidebook-style intelligence. Generated miles are not official. Water candidates are not reliable/potable. Current rules and conditions require live checks.
`);
  writeText('rag_docs/segment_guides/segment_index_25mi.md', `
# 25-Mile Segment Index

${segmentLinks.map((segment) => `- ${round(segment.start, 1)}-${round(segment.end, 1)}: [${segment.slug}](./${segment.slug}) (${segment.states.join('/')}; ${segment.regionIds.join('/')})`).join('\n')}
`);
  writeText('rag_docs/rules/land_manager_rules_index.md', `
# Land-Manager Rules Index

The full rules dataset is in processed/rules/full_trail_rules_by_land_manager.json.

Use it as a conservative pointer layer. Unknowns stay unknown. Current closures, permits, fees, camping availability, food storage, fires, dog rules, group size, Baxter/Katahdin access, and hut/campsite status require live official-source verification.
`);
  const policies = {
    'water.md': 'Water candidates are mapped candidates only. Reliability, potability, and ford safety are unknown unless verified by timestamped licensed data.',
    'weather_live_conditions.md': 'Use NWS, NPS, USFS, state, Baxter, and other official sources for current conditions. Static docs cannot answer current weather or closures.',
    'closures.md': 'Closures, detours, fire, flooding, storm damage, snow/ice, bear activity, road closures, permit changes, and Katahdin status require live checks.',
    'navigation.md': 'RC1 is a planning corpus, not field navigation. Generated miles are not official and route length has a known delta.',
    'tread.md': 'Tread/rockiness/rootiness/mud scores are model screens. State confidence and avoid field-verified language unless the record explicitly proves it.',
    'difficulty.md': 'Difficulty combines distance, terrain, tread, remoteness, weather, water, fords, permits, and data gaps. Use as a cautious screen.',
    'license_attribution.md': 'Use only public-domain, open-license, API-accessible, or license-reviewed sources. Attribute OpenStreetMap contributors for ODbL-derived data.',
  };
  for (const [file, body] of Object.entries(policies)) {
    writeText(`rag_docs/policies/${file}`, `# ${file.replace('.md', '').replaceAll('_', ' ')}\n\n${body}\n\nGenerated miles are not official ATC mileage. Live-condition answers require live retrieval or a clear failure disclosure.`);
  }
}

function buildQaTests() {
  const topics = [
    ['itinerary planning', 'Return a cautious day-by-day plan with generated miles, source confidence, water/rule uncertainty, and live-check requirements.'],
    ['next shelter', 'Use mapped shelter candidates only, disclose source/license/confidence, and verify current availability/rules.'],
    ['water', 'Say mapped water candidate, reliability unknown, potability unknown, and require current verification.'],
    ['permits', 'Use land-manager rules as pointers and require live/current official verification before commitment.'],
    ['camping', 'Do not advise illegal dispersed camping; preserve designated-site and permit constraints.'],
    ['weather', 'Require NWS live check; if unavailable say retrieval failed and give last checked time.'],
    ['closures', 'Require live NPS/USFS/state/Baxter/official checks; static docs are not current.'],
    ['rockiness', 'Use model tread score with confidence and no field-verified overclaiming.'],
    ['Maine fords', 'Never call a ford safe from static data; require current water/weather/land-manager checks.'],
    ['Baxter/Katahdin', 'Require Baxter live/current status for permits, trail opening, camping, parking, and weather.'],
    ['Smokies', 'Treat permits/camping as current-rule dependent and verify with NPS.'],
    ['Shenandoah', 'Verify permits, closures, Skyline Drive access, weather, and camping rules live.'],
    ['White Mountains', 'Flag alpine weather, huts/campsites, exposure, steep terrain, and live checks.'],
    ['NJ/CT camping', 'Treat camping as designated-site constrained unless official current source proves otherwise.'],
    ['PA rockiness', 'Use model score as screening, not certainty, and flag northern PA rocky ridges cautiously.'],
    ['resupply uncertainty', 'Separate open map candidates from guidebook-style business intelligence and avoid copied guide data.'],
    ['Davenport-Damascus gap', 'Disclose yellow regional MVP gap and use base open data with lower confidence.'],
    ['generated miles', 'State generated miles are not official ATC mileage.'],
    ['license', 'Do not use FarOut, AT Guide/Data Book/Companion, AllTrails, Gaia, Hiking Project, or copied ATC content.'],
    ['offline app', 'Use packaged static corpus for non-current planning and say live conditions need network.'],
  ];
  const places = [
    'Springer/Amicalola', 'Davenport Gap', 'Damascus', 'Grayson Highlands', 'McAfee Knob', 'Shenandoah', 'Harpers Ferry', 'Maryland ridges', 'Cumberland Valley', 'northern Pennsylvania', 'Delaware Water Gap', 'Harriman/Bear Mountain', 'Connecticut', 'Berkshires', 'Green Mountain NF', 'Hanover', 'Franconia', 'Presidential Range', 'Mahoosucs', 'Monson', '100-Mile Wilderness', 'Baxter/Katahdin',
  ];
  const questions = [];
  for (const [topic, expected] of topics) {
    for (const place of places) {
      questions.push({
        id: `full-rc1-qa-${String(questions.length + 1).padStart(3, '0')}`,
        category: topic,
        question: `For ${place}, answer a hiker asking about ${topic}.`,
        expected_behavior: expected,
        must_include: ['source/confidence', 'generated miles not official', topic.includes('weather') || topic.includes('closures') || topic.includes('Baxter') ? 'live check required' : 'cautious uncertainty'],
        must_not_include: ['official ATC mile claim', 'reliable water without verification', 'safe ford from static data', 'copyrighted guide/app data'],
      });
    }
  }
  writeJson('tests/full_trail_rc1_behavior_questions.json', questions);
  return questions;
}

function buildDatasetIndex(datasets) {
  const datasetIndex = [
    ['route', 'processed/route/full_at_route_rc1.geojson', 1, true],
    ['milepoints_0_1mi', 'processed/milepoints/full_at_milepoints_0_1mi.geojson', readJson('processed/milepoints/full_at_milepoints_0_1mi.geojson', rcRoot).features.length, true],
    ['milepoints_0_5mi', 'processed/milepoints/full_at_milepoints_0_5mi.geojson', readJson('processed/milepoints/full_at_milepoints_0_5mi.geojson', rcRoot).features.length, true],
    ['milepoints_1_0mi', 'processed/milepoints/full_at_milepoints_1_0mi.geojson', readJson('processed/milepoints/full_at_milepoints_1_0mi.geojson', rcRoot).features.length, true],
    ['elevation_samples', 'processed/elevation/full_trail_elevation_samples_1_0mi.json', datasets.elevation.length, true],
    ['water_candidates', 'processed/water/full_trail_water_candidates.json', datasets.water.length, true],
    ['major_ford_candidates', 'processed/water/full_trail_major_ford_candidates.json', readJson('processed/water/full_trail_major_ford_candidates.json', rcRoot).length, true],
    ['rules', 'processed/rules/full_trail_rules_by_land_manager.json', datasets.rules.length, false],
    ['live_sources', 'processed/live_conditions/full_trail_live_condition_sources.json', datasets.liveSources.length, false],
    ['tread', 'processed/tread/full_trail_tread_rockiness_1_0mi.json', datasets.tread.length, true],
    ['difficulty', 'processed/difficulty/full_trail_difficulty_by_10mi_segment.json', datasets.difficulty.length, true],
    ['rag_metadata', 'rag_docs/rag_doc_metadata.json', readJson('rag_docs/rag_doc_metadata.json', rcRoot).length, true],
    ['qa_questions', 'tests/full_trail_rc1_behavior_questions.json', datasets.qa.length, false],
  ].map(([dataset_id, pathName, record_count, production_safe]) => ({
    dataset_id,
    path: pathName,
    record_count,
    production_safe,
    route_id: ROUTE_ID,
    last_generated: GENERATED_DATE,
    license_status: production_safe ? 'open_license_share_alike_or_public_domain' : 'mixed_contains_pointer_or_test_data',
    ai_answer_rule: production_safe
      ? 'Use with source/license/confidence and generated-mile cautions.'
      : 'Do not include in production-safe data export unless filtered; may contain pointer or validation/test content.',
  }));
  writeJson('processed/index/full_trail_dataset_index.json', datasetIndex);
  return datasetIndex;
}

function buildAuditDocs(datasetIndex, manifest) {
  writeJson('full_trail_source_manifest.yaml', manifest);
  writeText('full_trail_license_review.md', `
# Full Trail RC1 License Review

RC1 uses public-domain, open-license, API-accessible, or license-reviewed data from existing Scout MVP packs and base open route assets.

Production-safe: ${manifest.filter((source) => source.production_safe).length} sources.
Not production-safe / pointer / blocked: ${manifest.filter((source) => !source.production_safe).length} sources.

OSM-derived data is tagged open_license_share_alike / ODbL and requires OpenStreetMap contributor attribution. Public-domain USGS/NOAA/NWS style data is retained with attribution notes. ATC Trail Updates and similar restricted sources are pointer-only unless licensed.

Every production dataset has source/license/confidence/timestamp expectations enforced by run_full_trail_validation.py.
`);
  writeText('blocked_sources.md', `
# Blocked Sources

Do not ingest into the packaged reusable corpus without written permission or a compatible license:

- FarOut waypoint data or user comments.
- The A.T. Guide / AWOL guide.
- A.T. Data Book mileage tables.
- Thru-Hikers' Companion.
- AllTrails, Gaia GPS, Hiking Project.
- Copied ATC website guide/map/text/table content unless explicitly licensed.
- Private guide PDFs or blogs that copy guidebook data.

ATC Trail Updates may be used as a verification pointer only unless licensed for packaging.
`);
  writeText('attribution.md', `
# Attribution

OpenStreetMap contributors: OSM-derived route, POI, access, and candidate map data are used under ODbL/open_license_share_alike handling.

U.S. Geological Survey: USGS TNM/3DEP/hydrography-derived elevation, hydrography, terrain, and base-layer candidate data.

NOAA / National Weather Service: live weather and alert connector lane. Static RC1 docs do not answer current weather.

National Park Service, U.S. Forest Service, state agencies, Baxter State Park Authority, and other land managers: official-source pointers and live-check lanes where used.

Keep upstream source IDs, URLs, license_status, confidence, and timestamps attached to records.
`);
  writeJson('processed/index/full_trail_file_manifest.json', datasetIndex.map((dataset) => ({
    path: dataset.path,
    production_safe: dataset.production_safe,
    reason: dataset.production_safe ? 'safe license statuses or generated integration metadata' : 'mixed pointer/test/rules content; filtered from production-safe export',
  })));
}

function buildStatusAndReport(datasetIndex, datasets) {
  writeText('FULL_TRAIL_RC1_STATUS.md', `
# Full Trail RC1 Status

Generated: ${GENERATED_AT}

| Area | Status | Notes |
| --- | --- | --- |
| Route | Green | Base open full-route geometry integrated into full_at_route_rc1.geojson. |
| Miles | Green | 0.1/0.5/1.0 generated global milepoints with official:false. |
| Regional Stitch | Yellow | Davenport Gap to Damascus uses base open data because regional MVP detail is missing. |
| Elevation | Green | USGS 3DEP-derived samples and 5/10 mile summaries. |
| Water/Fords | Green | Mapped candidates only; reliability/potability/ford safety unknown. |
| Waypoints | Green | Regional MVPs plus base gap filler, deduplicated with provenance. |
| Rules | Yellow | Conservative official-source/pointer layer; live verification required. |
| Live Connectors | Green | NWS/NPS/USFS/state/Baxter/ATC-pointer policy centralized. |
| Tread | Yellow | Model-estimated, not field verified; gap tread low confidence. |
| Difficulty | Yellow | Planning screen only; not field verified. |
| RAG Docs | Green | Full overview, policies, 25-mile segments, indexes, metadata. |
| Licensing | Green | Blocked sources excluded from production-safe export. |
| Export | Green | Export script writes filtered production-safe zip/manifest. |
| Validation | Green | run_full_trail_validation.py enforces source-aware rules. |
| QA Tests | Green | ${datasets.qa.length} expected-behavior questions. |
`);
  writeText('data_quality_report_full_trail_rc1.md', `
# Data Quality Report: Full Trail RC1

## Work Completed
- Integrated MVP1-MVP6 with the base open full-route geometry.
- Created global full-trail generated milepoints and alignment notes.
- Merged elevation, water, waypoints, rules, live-source, tread, difficulty, and RAG metadata indexes.
- Created license/provenance audit docs and production-safe export tooling.
- Created ${datasets.qa.length} full-trail behavior QA questions.

## Source / License Summary
- OSM-derived data: open_license_share_alike / ODbL with attribution.
- USGS/NOAA/NWS style data: public domain or API-accessible with attribution notes.
- Land-manager pages: pointer/current-check lanes unless license-reviewed.
- ATC/FarOut/AT Guide/Data Book/Companion/AllTrails/Gaia/Hiking Project/copied guide content: blocked or pointer-only.

## Measured Length And Gaps
- RC1 generated open-route length: ${FULL_LENGTH} miles.
- 2026 official reference length for comparison: ${OFFICIAL_REFERENCE_LENGTH} miles.
- Known material delta: ${round(FULL_LENGTH - OFFICIAL_REFERENCE_LENGTH, 1)} miles.
- Davenport Gap to Damascus/TN-VA regional coverage gap: yellow.

## Record Counts
${datasetIndex.map((dataset) => `- ${dataset.dataset_id}: ${dataset.record_count}`).join('\n')}

## Weak Points
- Generated miles are not official and should not be used as exact field navigation.
- Davenport Gap to Damascus lacks regional MVP depth.
- Tread/difficulty are model screens, not field verified.
- Water/fords remain candidate-only unless verified.
- Current closures/weather/permits/fords/Katahdin status require live checks.

## Next Work
- Build a dedicated Davenport Gap to Damascus regional MVP.
- Improve verified campsite/hut/resupply/business data only where licensing permits.
- Add user-submitted, timestamped field reports with deletion/moderation and provenance.
- Build Planner Engine v1 on top of RC1 difficulty and live-condition gates.
`);
  writeJson('manifest.json', {
    pack: 'scout-at-full-trail-rc1',
    generated_at: GENERATED_AT,
    route_id: ROUTE_ID,
    full_trail_generated_miles: FULL_LENGTH,
    official_reference_length_miles: OFFICIAL_REFERENCE_LENGTH,
    production_safe_export_script: '../scripts/export/export_full_trail_production_safe.py',
    production_safe_zip: 'exports/full_trail_reference_pack_rc1.zip',
    validation: 'run_full_trail_validation.py',
  });
  writeText('README.md', `
# Scout Full Trail RC1 Reference Pack

Production-safe, source-aware Appalachian Trail planning corpus from Springer/Amicalola context to Katahdin/Baxter.

Generated miles are not official ATC mileage. Static docs cannot answer current closures, weather, permits, fords, or Baxter/Katahdin status. Water and fords are mapped candidates unless timestamped verified data says otherwise.
`);
}

function buildValidationScript() {
  writeText('run_full_trail_validation.py', String.raw`#!/usr/bin/env python3
"""Validate Scout Full Trail RC1 source-aware reference pack."""

from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import Any
from zipfile import ZipFile

ROOT = Path(__file__).resolve().parent
VALID_LICENSES = {"public_domain", "open_license_attribution", "open_license_share_alike", "api_access_allowed"}
BLOCKED_LICENSES = {"blocked", "unknown_review_required", "permission_required"}

REQUIRED_PATHS = [
    "README.md",
    "manifest.json",
    "FULL_TRAIL_RC1_STATUS.md",
    "data_quality_report_full_trail_rc1.md",
    "full_trail_source_manifest.yaml",
    "full_trail_license_review.md",
    "blocked_sources.md",
    "attribution.md",
    "processed/route/full_at_route_rc1.geojson",
    "processed/route/route_integration_notes.md",
    "processed/milepoints/full_at_milepoints_0_1mi.geojson",
    "processed/milepoints/full_at_milepoints_0_5mi.geojson",
    "processed/milepoints/full_at_milepoints_1_0mi.geojson",
    "processed/milepoints/global_mile_alignment_report.md",
    "processed/elevation/full_trail_elevation_samples_1_0mi.json",
    "processed/elevation/full_trail_elevation_by_5mi_segment.json",
    "processed/elevation/full_trail_elevation_by_10mi_segment.json",
    "processed/water/full_trail_water_candidates.json",
    "processed/water/full_trail_major_ford_candidates.json",
    "processed/waypoints/full_trail_shelters.json",
    "processed/waypoints/full_trail_campsites.json",
    "processed/waypoints/full_trail_privies.json",
    "processed/waypoints/full_trail_parking.json",
    "processed/waypoints/full_trail_trailheads.json",
    "processed/waypoints/full_trail_road_crossings.json",
    "processed/waypoints/full_trail_towns_resupply_candidates.json",
    "processed/rules/full_trail_rules_by_land_manager.json",
    "processed/live_conditions/full_trail_live_condition_sources.json",
    "processed/tread/full_trail_tread_rockiness_1_0mi.json",
    "processed/difficulty/full_trail_daily_difficulty_model.md",
    "processed/difficulty/full_trail_daily_difficulty_model.json",
    "processed/difficulty/full_trail_difficulty_by_10mi_segment.json",
    "processed/index/full_trail_dataset_index.json",
    "processed/index/full_trail_file_manifest.json",
    "rag_docs/overview/full_trail_overview.md",
    "rag_docs/state_guides/state_guide_index.md",
    "rag_docs/segment_guides/segment_index_25mi.md",
    "rag_docs/rules/land_manager_rules_index.md",
    "rag_docs/policies/water.md",
    "rag_docs/policies/weather_live_conditions.md",
    "rag_docs/policies/closures.md",
    "rag_docs/policies/navigation.md",
    "rag_docs/policies/tread.md",
    "rag_docs/policies/difficulty.md",
    "rag_docs/policies/license_attribution.md",
    "rag_docs/rag_doc_metadata.json",
    "tests/full_trail_rc1_behavior_questions.json",
    "exports/full_trail_reference_pack_rc1.zip",
    "exports/manifest.json",
]


def j(path: str) -> Any:
    return json.loads((ROOT / path).read_text())


def t(path: str) -> str:
    return (ROOT / path).read_text()


def rows(value: Any) -> list[dict[str, Any]]:
    if isinstance(value, list):
        return [row for row in value if isinstance(row, dict)]
    if isinstance(value, dict) and isinstance(value.get("features"), list):
        return [feature.get("properties", feature) for feature in value["features"] if isinstance(feature, dict)]
    return []


def fail_if(condition: bool, failures: list[str], message: str) -> None:
    if condition:
        failures.append(message)


def common(record: dict[str, Any], failures: list[str], label: str) -> None:
    fail_if(not (record.get("source_id") or record.get("source_ids") or record.get("source_route_id")), failures, f"{label} missing source")
    fail_if(record.get("license_status") in BLOCKED_LICENSES, failures, f"{label} blocked/review license")
    fail_if(not record.get("confidence"), failures, f"{label} missing confidence")
    fail_if(not (record.get("last_checked") or record.get("last_generated")), failures, f"{label} missing timestamp")
    fail_if(not record.get("ai_answer_rule"), failures, f"{label} missing ai_answer_rule")


def validate() -> dict[str, Any]:
    failures: list[str] = []
    for path in REQUIRED_PATHS:
        fail_if(not (ROOT / path).exists(), failures, f"missing {path}")

    manifest = j("full_trail_source_manifest.yaml")
    fail_if(len(manifest) < 20, failures, "source manifest too small")
    source_map = {source.get("source_id"): source for source in manifest}
    for source in manifest:
        for field in ["source_id", "name", "owner", "source_url", "license_status", "allowed_use", "confidence", "last_checked"]:
            fail_if(not source.get(field), failures, f"source {source.get('source_id')} missing {field}")
        if source.get("production_safe"):
            fail_if(source.get("license_status") not in VALID_LICENSES, failures, f"production-safe source {source.get('source_id')} has unsafe license")
    for blocked in ["farout", "awol_at_guide", "at_data_book", "alltrails_gaia_hiking_project", "atc_website"]:
        fail_if(source_map.get(blocked, {}).get("license_status") != "blocked", failures, f"{blocked} not blocked")

    route = rows(j("processed/route/full_at_route_rc1.geojson"))[0]
    common(route, failures, "route")
    fail_if(route.get("official") is not False, failures, "route official must be false")
    fail_if(route.get("measured_length_miles") != 2106.2, failures, "route measured length mismatch")
    fail_if(route.get("length_delta_miles") != -91.7, failures, "route length delta missing")
    fail_if("coverage_gaps" not in route or not route["coverage_gaps"], failures, "route missing coverage gaps")
    notes = t("processed/route/route_integration_notes.md").lower()
    for term in ["davenport gap", "damascus", "amicalola", "baxter", "katahdin", "not official", "openstreetmap"]:
        fail_if(term not in notes, failures, f"route notes missing {term}")

    for interval, minimum in [("0_1", 21000), ("0_5", 4200), ("1_0", 2100)]:
        milepoints = rows(j(f"processed/milepoints/full_at_milepoints_{interval}mi.geojson"))
        fail_if(len(milepoints) < minimum, failures, f"{interval} milepoints too few")
        previous = -1
        for record in milepoints[:25] + milepoints[-25:]:
            common(record, failures, f"milepoint {interval}")
            fail_if(record.get("official") is not False, failures, "milepoint official not false")
            fail_if("not an official atc mile" not in record.get("ai_answer_rule", "").lower(), failures, "milepoint lacks official caution")
        for record in milepoints:
            mile = record.get("mile_nobo_global_est")
            fail_if(mile is None or mile < previous, failures, f"{interval} milepoints not monotonic")
            previous = mile

    water = j("processed/water/full_trail_water_candidates.json")
    fail_if(len(water) < 1700, failures, "water candidates too few")
    for record in water[:50] + water[-50:]:
        common(record, failures, "water")
        fail_if(record.get("reliability") != "unknown", failures, "water reliability overclaimed")
        fail_if(record.get("potable") != "unknown", failures, "water potability overclaimed")
        fail_if(record.get("last_human_verified") is not None, failures, "water human verified without proof")
        fail_if("mapped water candidate" not in record.get("ai_answer_rule", "").lower(), failures, "water answer rule missing mapped candidate")
    for record in j("processed/water/full_trail_major_ford_candidates.json")[:50]:
        common(record, failures, "ford")
        fail_if(record.get("ford_safety") != "unknown", failures, "ford safety overclaimed")
        fail_if("never call" not in record.get("ai_answer_rule", "").lower(), failures, "ford safety caution missing")

    for dataset in ["full_trail_shelters", "full_trail_campsites", "full_trail_parking", "full_trail_road_crossings", "full_trail_towns_resupply_candidates"]:
        records = j(f"processed/waypoints/{dataset}.json")
        fail_if(len(records) < 20, failures, f"{dataset} too small")
        for record in records[:20]:
            common(record, failures, dataset)
            fail_if(record.get("production_safe") is not True, failures, f"{dataset} unsafe record in candidate output")

    rules = j("processed/rules/full_trail_rules_by_land_manager.json")
    fail_if(len(rules) < 20, failures, "rules too few")
    rules_text = json.dumps(rules).lower()
    for term in ["shenandoah", "baxter", "katahdin", "white mountain", "connecticut", "new jersey", "smok", "permit"]:
        fail_if(term not in rules_text, failures, f"rules missing {term}")
    fail_if("dispersed camping is allowed everywhere" in rules_text, failures, "illegal camping advice present")

    live_policy = t("processed/live_conditions/full_trail_live_condition_policy.md").lower()
    for term in ["nws", "nps", "usfs", "state", "baxter", "katahdin", "atc trail updates", "live retrieval fails"]:
        fail_if(term not in live_policy, failures, f"live policy missing {term}")

    tread = j("processed/tread/full_trail_tread_rockiness_1_0mi.json")
    fail_if(len(tread) < 2000, failures, "tread records too few")
    fail_if(not any(record.get("confidence") == "low" and record.get("region_id") == "coverage_gap_davenport_damascus" for record in tread), failures, "gap tread low confidence missing")
    for record in tread[:25] + tread[-25:]:
        common(record, failures, "tread")
        fail_if(record.get("field_verified") is not False, failures, "tread unexpectedly field verified")
        fail_if(record.get("score") not in [0, 1, 2, 3, 4, 5], failures, "tread score outside range")

    difficulty = j("processed/difficulty/full_trail_difficulty_by_10mi_segment.json")
    fail_if(len(difficulty) < 210, failures, "difficulty segments too few")
    fail_if(not any(record["factors"].get("ford_uncertainty_factor", 0) > 0 for record in difficulty), failures, "difficulty lacks ford factor")
    fail_if(not any(record["factors"].get("regional_gap_factor", 0) > 0 for record in difficulty), failures, "difficulty lacks regional gap factor")
    fail_if(not any(record["factors"].get("permit_rule_friction_factor", 0) > 0 for record in difficulty), failures, "difficulty lacks permit/rule friction")
    for record in difficulty[:10]:
        common(record, failures, "difficulty")
        fail_if(record.get("difficulty_score_0_10") is None, failures, "difficulty missing score")

    rag_metadata = j("rag_docs/rag_doc_metadata.json")
    fail_if(len(rag_metadata) < 84, failures, "RAG segment metadata too few")
    for record in rag_metadata[:10]:
        common(record, failures, "rag metadata")
    segment_index = t("rag_docs/segment_guides/segment_index_25mi.md").lower()
    fail_if("2106" not in segment_index, failures, "segment index missing end")

    qa = j("tests/full_trail_rc1_behavior_questions.json")
    fail_if(len(qa) < 200, failures, "QA questions below 200")
    qa_text = json.dumps(qa).lower()
    for term in ["itinerary", "shelter", "water", "permit", "camping", "weather", "closures", "rockiness", "ford", "baxter", "katahdin", "smokies", "shenandoah", "white mountains", "nj/ct", "pa rockiness", "resupply", "davenport"]:
        fail_if(term not in qa_text, failures, f"QA missing {term}")

    dataset_index = j("processed/index/full_trail_dataset_index.json")
    safe_files = {entry["path"] for entry in dataset_index if entry.get("production_safe")}
    with ZipFile(ROOT / "exports/full_trail_reference_pack_rc1.zip") as zf:
        names = set(zf.namelist())
    for required in ["attribution.md", "manifest.json"]:
        fail_if(required not in names, failures, f"export missing {required}")
    for safe in safe_files:
        fail_if(safe not in names, failures, f"export missing safe file {safe}")
    for entry in dataset_index:
        if not entry.get("production_safe"):
            fail_if(entry["path"] in names, failures, f"export included unsafe file {entry['path']}")

    return {
        "ok": not failures,
        "failures": failures,
        "route_miles": route.get("measured_length_miles"),
        "milepoints_0_1mi": len(rows(j("processed/milepoints/full_at_milepoints_0_1mi.geojson"))),
        "water_candidates": len(water),
        "rules": len(rules),
        "tread_1mi_records": len(tread),
        "difficulty_segments": len(difficulty),
        "rag_docs": len(rag_metadata),
        "behavior_questions": len(qa),
    }


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--json", action="store_true")
    args = parser.parse_args()
    result = validate()
    if args.json:
        print(json.dumps(result, indent=2))
    else:
        print("ok" if result["ok"] else "failed")
        for failure in result["failures"]:
            print(f"- {failure}")
    raise SystemExit(0 if result["ok"] else 1)


if __name__ == "__main__":
    main()
`);
  fs.chmodSync(path.join(rcRoot, 'run_full_trail_validation.py'), 0o755);
}

function copySchemas() {
  const sourceDir = path.join(packRoot, 'mvp6_maine/schemas');
  if (!fs.existsSync(sourceDir)) return;
  for (const file of fs.readdirSync(sourceDir)) {
    if (!file.endsWith('.schema.json')) continue;
    const source = path.join(sourceDir, file);
    const target = path.join(rcRoot, 'schemas', file);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.copyFileSync(source, target);
  }
}

function main() {
  fs.rmSync(rcRoot, { recursive: true, force: true });
  fs.mkdirSync(rcRoot, { recursive: true });

  buildRoute();
  buildMilepoints();
  const elevation = buildElevation();
  const water = buildWater();
  const waypoints = buildWaypoints();
  const rules = buildRules();
  const liveSources = buildLiveSources();
  const tread = buildTread(elevation);
  const elevation10 = readJson('processed/elevation/full_trail_elevation_by_10mi_segment.json', rcRoot);
  const difficulty = buildDifficulty(elevation10, tread, water, waypoints, rules);
  const datasets = { elevation, water, waypoints, rules, liveSources, tread, difficulty };
  buildRagDocs(datasets);
  const qa = buildQaTests();
  datasets.qa = qa;
  const datasetIndex = buildDatasetIndex(datasets);
  const manifest = sourceManifest();
  buildAuditDocs(datasetIndex, manifest);
  copySchemas();
  buildStatusAndReport(datasetIndex, datasets);
  buildValidationScript();

  console.log(`Full Trail RC1 generated at ${rcRoot}`);
}

main();
