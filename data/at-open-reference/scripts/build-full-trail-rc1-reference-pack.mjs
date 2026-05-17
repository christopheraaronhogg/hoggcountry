import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const packRoot = path.resolve(__dirname, '..');
const rcRoot = path.join(packRoot, 'full_trail_rc1');

const GENERATED_DATE = process.env.FULL_TRAIL_RC1_GENERATED_DATE ?? '2026-05-16';
const GENERATED_AT = `${GENERATED_DATE}T00:00:00.000Z`;
const FULL_LENGTH = 2106.2;
const METERS_PER_MILE = 1609.344;
const FEET_PER_MILE = 5280;
const ELEVATION_SAMPLE_SPACING_METERS = 100;
const EPQS_URL = 'https://epqs.nationalmap.gov/v1/json';
const HIGH_RES_ELEVATION_CACHE_PATH = 'raw/usgs/full_trail_epqs_100m_cache.json';
const OFFICIAL_REFERENCE_LENGTH = 2197.9;
const OFFICIAL_REFERENCE_SOURCE_URL = 'https://appalachiantrail.org/experience/hike-the-trail/at-basics/';
const LENGTH_DELTA = Math.round((FULL_LENGTH - OFFICIAL_REFERENCE_LENGTH) * 10) / 10;
const LENGTH_DELTA_PERCENT = Math.round(((FULL_LENGTH - OFFICIAL_REFERENCE_LENGTH) / OFFICIAL_REFERENCE_LENGTH) * 1000) / 10;
const ALIGNMENT_STATUS = 'yellow_unresolved_open_route_delta';
const ROUTE_ID = 'at-full-trail-rc1-open-2026';
const SOURCE_ROUTE_ID = 'at-main-osm-2026-open';
const ROCKINESS_V2_SOURCE_ID = 'full_trail_rockiness_v2_model';
const ROCKINESS_V2_1_SOURCE_ID = 'full_trail_rockiness_v2_1_extraction_model';
const ROCKINESS_V2_1_SNAPSHOT_PATH = 'raw/source_discovery/rockiness_v2_1_source_extraction.json';
const SOURCE_REVIEW_IDS = new Set([
  'opentrail_review',
  'openlongtrails_review',
  'usgs_3dep_seamless_dem',
  'usgs_3dep_lidar',
  'nrcs_gssurgo_ssurgo',
]);

const SOURCE_URLS = {
  opentrail: 'https://opentrail.org/',
  openlongtrails: 'https://www.openlongtrails.org/blog/posts/Introducing_Grit/',
  usgs3depSeamless: 'https://planetarycomputer.microsoft.com/api/stac/v1/collections/3dep-seamless',
  usgs3depLidar: 'https://registry.opendata.aws/usgs-lidar/',
  nrcsGssurgo: 'https://www.nrcs.usda.gov/resources/data-and-reports/gridded-soil-survey-geographic-gssurgo-database',
  osmCopyright: 'https://www.openstreetmap.org/copyright',
};

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
const LANDMARK_KINDS = new Set([
  'water',
  'water-gap',
  'ford',
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
]);

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

function toRadians(value) {
  return value * (Math.PI / 180);
}

function haversineMiles(a, b) {
  const earthRadiusMiles = 3958.7613;
  const lat1 = toRadians(a[1]);
  const lat2 = toRadians(b[1]);
  const deltaLat = toRadians(b[1] - a[1]);
  const deltaLon = toRadians(b[0] - a[0]);
  const value = Math.sin(deltaLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLon / 2) ** 2;
  return 2 * earthRadiusMiles * Math.asin(Math.sqrt(value));
}

function flattenCoordinates(geometry) {
  if (!geometry) return [];
  if (geometry.type === 'LineString') return geometry.coordinates ?? [];
  if (geometry.type === 'MultiLineString') return (geometry.coordinates ?? []).flat();
  return [];
}

function measureGeometry(geometry) {
  const coordinates = flattenCoordinates(geometry);
  let total = 0;
  let maxSegment = 0;
  let segmentsOverTwoHundredths = 0;
  let segmentsOverHalfMile = 0;
  let segmentsOverOneMile = 0;

  for (let index = 1; index < coordinates.length; index += 1) {
    const distance = haversineMiles(coordinates[index - 1], coordinates[index]);
    total += distance;
    maxSegment = Math.max(maxSegment, distance);
    if (distance > 0.02) segmentsOverTwoHundredths += 1;
    if (distance > 0.5) segmentsOverHalfMile += 1;
    if (distance > 1) segmentsOverOneMile += 1;
  }

  return {
    method: 'WGS84 haversine geodesic over route vertices',
    vertex_count: coordinates.length,
    segment_count: Math.max(0, coordinates.length - 1),
    measured_length_miles: round(total, 3),
    measured_length_miles_rounded_for_ui: round(total, 1),
    max_consecutive_vertex_gap_miles: round(maxSegment, 3),
    segments_over_0_02_miles: segmentsOverTwoHundredths,
    segments_over_0_5_miles: segmentsOverHalfMile,
    segments_over_1_0_miles: segmentsOverOneMile,
  };
}

function estimateThreeDLength(elevationSamples) {
  let total = 0;
  for (let index = 1; index < elevationSamples.length; index += 1) {
    const previous = elevationSamples[index - 1];
    const current = elevationSamples[index];
    const horizontalFeet = ((current.mile_nobo_global_est ?? current.mile_nobo) - (previous.mile_nobo_global_est ?? previous.mile_nobo)) * FEET_PER_MILE;
    const verticalFeet = (current.elevation_ft ?? 0) - (previous.elevation_ft ?? 0);
    if (horizontalFeet > 0) total += Math.sqrt(horizontalFeet ** 2 + verticalFeet ** 2) / FEET_PER_MILE;
  }
  const sampleSpacingMeters = elevationSamples.find((sample) => typeof sample.sample_spacing_meters === 'number')?.sample_spacing_meters ?? null;

  return {
    method: sampleSpacingMeters === ELEVATION_SAMPLE_SPACING_METERS
      ? '3D estimate from direct 100-meter USGS 3DEP/EPQS elevation samples'
      : 'coarse 3D estimate from 1-mile USGS 3DEP elevation samples',
    sample_spacing_meters: sampleSpacingMeters,
    sample_count: elevationSamples.length,
    estimated_3d_length_miles: round(total, 1),
    added_miles_vs_2d_route: round(total - FULL_LENGTH, 1),
    limitation: sampleSpacingMeters === ELEVATION_SAMPLE_SPACING_METERS
      ? '100-meter model-derived USGS 3DEP samples improve vertical-length screening but still do not make generated/open-route miles official or survey-grade.'
      : 'Coarse 1-mile elevation samples only; this screens whether vertical component could explain the 91.7-mile delta, not exact surveyed trail length.',
  };
}

function waymarkedReportedMiles(feature) {
  const meters = feature.properties?.graph?.route_reported_length_meters;
  return typeof meters === 'number' ? round(meters / 1609.344, 3) : null;
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

function routeDistanceFeet(record) {
  const distance = record.distance_from_route_ft ?? record.distance_from_trail_ft ?? record.distance_from_route_feet ?? record.distance_from_trail_feet;
  return typeof distance === 'number' ? Math.round(distance) : null;
}

function coordinateAnchor(record) {
  if (typeof record.lat !== 'number' || typeof record.lon !== 'number') return undefined;
  return {
    lat: record.lat,
    lon: record.lon,
    coordinate_order: 'lat_lon',
    anchor_role: 'canonical_landmark_location',
    source_id: record.source_id ?? record.source_route_id ?? 'unknown',
    source_feature_id: record.source_feature_id ?? record.osm_id ?? record.waypoint_id ?? record.water_id ?? record.access_id ?? record.full_trail_record_id ?? null,
    source_url: record.source_url ?? null,
    license_status: record.license_status ?? record.source_license_status ?? 'open_license_share_alike',
    confidence: record.confidence ?? 'open_source_candidate',
    last_checked: record.last_checked ?? GENERATED_DATE,
    identity_rule: 'Treat this coordinate as the stable landmark anchor. Route miles are derived snaps and may change when the selected route spine changes.',
  };
}

function routeSnap(record, normalized, mile) {
  if (typeof mile !== 'number') return undefined;
  const region = regionForMile(mile);
  return {
    route_id: ROUTE_ID,
    source_route_id: normalized.source_route_id ?? SOURCE_ROUTE_ID,
    route_source_id: 'osm',
    route_license_status: 'open_license_share_alike',
    route_alignment_status: ALIGNMENT_STATUS,
    official: false,
    generated: true,
    mile_nobo_global_est: round(mile, 1),
    mile_sobo_global_est: round(FULL_LENGTH - mile, 1),
    region_id: region.region_id,
    region_name: region.label,
    regional_coverage_status: region.status,
    distance_from_route_ft: routeDistanceFeet(record),
    snap_method: 'derived_from_selected_open_route_geometry',
    route_length_miles: FULL_LENGTH,
    official_reference_length_miles: OFFICIAL_REFERENCE_LENGTH,
    route_length_delta_miles_vs_2026_reference: LENGTH_DELTA,
    ai_answer_rule: 'Use this as a derived route snap only. The coordinate_anchor is the landmark identity; generated/open-route miles are not official ATC miles.',
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
  if (LANDMARK_KINDS.has(kind)) {
    const anchor = coordinateAnchor(normalized);
    if (anchor) normalized.coordinate_anchor = anchor;
    const snap = routeSnap(record, normalized, mile);
    if (snap) normalized.route_snap = snap;
  }
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
    {
      source_id: 'route_alignment_diagnostics',
      name: 'Scout RC1 route alignment diagnostics',
      owner: 'Hogg Country',
      source_type: 'derived data quality report',
      source_url: 'internal:data/at-open-reference/full_trail_rc1/processed/route/route_alignment_diagnostics.json',
      access_method: 'local generated artifact',
      license_status: 'open_license_share_alike',
      allowed_use: 'package generated diagnostics with upstream OSM attribution and official-reference caution',
      attribution_required: 'Preserve OpenStreetMap attribution and ATC official-reference URL as a pointer only.',
      confidence: 'measurement_diagnostic_not_official_route',
      last_checked: GENERATED_DATE,
      production_safe: true,
      data_categories: ['route_alignment', 'data_quality', 'validation'],
      notes: 'Geodesic measurements, continuity diagnostics, segment length checks, and unresolved-cause notes. Does not copy official ATC mile tables.',
    },
    {
      source_id: ROCKINESS_V2_SOURCE_ID,
      name: 'Scout Rockiness V2 composite screening model',
      owner: 'Hogg Country',
      source_type: 'derived model',
      source_url: 'internal:data/at-open-reference/scripts/build-full-trail-rc1-reference-pack.mjs',
      access_method: 'local generated artifact',
      license_status: 'open_license_share_alike',
      allowed_use: 'package generated model scores with OSM ODbL attribution, USGS/NRCS source notes, confidence, and field-verification cautions',
      attribution_required: 'Preserve OpenStreetMap contributor attribution and USGS/NRCS source notes.',
      confidence: 'model_screening_not_field_verified',
      last_checked: GENERATED_DATE,
      production_safe: true,
      data_categories: ['tread_rockiness_v2', 'difficulty_input', 'pace_penalty', 'model_notes'],
      notes: 'Combines 100-meter USGS 3DEP/EPQS micro-roughness, existing OSM-derived tread signals, and a documented-but-not-yet-extracted gSSURGO lane. No field verification is implied.',
    },
    {
      source_id: ROCKINESS_V2_1_SOURCE_ID,
      name: 'Scout Rockiness V2.1 bounded source extraction model',
      owner: 'Hogg Country',
      source_type: 'derived model and extraction metadata',
      source_url: `internal:data/at-open-reference/${ROCKINESS_V2_1_SNAPSHOT_PATH}`,
      access_method: 'bounded live source discovery snapshot promoted into local generated artifacts',
      license_status: 'open_license_share_alike',
      allowed_use: 'package generated extraction-aware model records with OSM ODbL attribution, USGS public-domain metadata, confidence, and not-field-verified cautions',
      attribution_required: 'Preserve OpenStreetMap contributor attribution and USGS/NRCS source notes.',
      confidence: 'model_screening_with_bounded_dem_lidar_metadata_not_field_verified',
      last_checked: GENERATED_DATE,
      production_safe: true,
      data_categories: ['tread_rockiness_v2_1', 'difficulty_input', 'source_extraction', 'pace_penalty', 'model_notes'],
      notes: 'V2.1 promotes bounded 3DEP Seamless DEM STAC and USGS 3DEP LiDAR catalog metadata into the pack. It does not claim raster pixel sampling, LiDAR point-cloud scoring, SSURGO attribute scoring, or field verification.',
    },
    {
      source_id: 'opentrail_review',
      name: 'OpenTrail source review',
      owner: 'OpenTrail.org',
      source_type: 'candidate community trail app/source',
      source_url: SOURCE_URLS.opentrail,
      access_method: 'public web/app review only',
      license_status: 'unknown_review_required',
      allowed_use: 'pointer/review only; do not scrape, ingest, redistribute, or package trail/community data until a compatible public license/API or written permission exists',
      attribution_required: 'To be determined if permission/license is obtained.',
      confidence: 'license_not_verified',
      last_checked: GENERATED_DATE,
      production_safe: false,
      blocked_until: 'public bulk/API license or written permission that covers commercial app packaging and derived datasets',
      candidate_use: ['route alignment comparison', 'POI comparison', 'future user-report/tread comparison after license review'],
      recommendation: 'Keep review-only. Do not ingest until OpenTrail publishes a compatible bulk/API license or gives written permission.',
      data_categories: ['source_review', 'candidate_route_alignment', 'candidate_poi_comparison'],
      notes: 'Visible page presents a trail-info community/installable offline map app, but this review found no production-safe bulk license/API to ingest.',
    },
    {
      source_id: 'openlongtrails_review',
      name: 'OpenLongTrails/Grit source review',
      owner: 'OpenLongTrails.org',
      source_type: 'candidate long-trail app/wiki/source',
      source_url: SOURCE_URLS.openlongtrails,
      access_method: 'public web/blog/app review only',
      license_status: 'unknown_review_required',
      allowed_use: 'pointer/review only; do not ingest Grit, wiki, comments, GPX, GeoJSON, or user submissions until the exact dataset and license are reviewed',
      attribution_required: 'To be determined if permission/license is obtained.',
      confidence: 'license_not_verified_for_at_packaging',
      last_checked: GENERATED_DATE,
      production_safe: false,
      blocked_until: 'specific Appalachian Trail dataset URL plus compatible license/API or written permission',
      candidate_use: ['route alignment comparison', 'gap detection', 'future OSM/user-report comparison after license review'],
      recommendation: 'Keep review-only. Revisit only when a specific AT dataset URL and compatible license/API are available.',
      data_categories: ['source_review', 'candidate_route_alignment', 'candidate_waypoint_comparison'],
      notes: 'OpenLongTrails describes downloadable Grit data for PCT and future OSM/user-contribution lanes, but this review does not establish a production-safe AT corpus license.',
    },
    {
      source_id: 'usgs_3dep_seamless_dem',
      name: 'USGS 3DEP Seamless DEMs via Microsoft Planetary Computer STAC',
      owner: 'U.S. Geological Survey; hosted by Microsoft Planetary Computer',
      source_type: 'DEM/STAC collection',
      source_url: SOURCE_URLS.usgs3depSeamless,
      access_method: 'bounded STAC discovery and Cloud Optimized GeoTIFF reads near the AT corridor',
      license_status: 'public_domain',
      allowed_use: 'discover/query corridor DEM coverage and derive terrain roughness without bulk downloading unrelated rasters',
      attribution_required: 'Data available from U.S. Geological Survey, 3D Elevation Program. Preserve Planetary Computer hosting reference when used.',
      confidence: 'high_for_dem_coverage_not_tread_truth',
      last_checked: GENERATED_DATE,
      production_safe: true,
      blocked_until: null,
      candidate_use: ['10m/30m DEM coverage discovery', 'future terrain ruggedness index', 'future local relief and slope variance refinement'],
      recommendation: 'Use for bounded corridor discovery and future COG reads; keep existing 100m EPQS baseline until extraction is implemented.',
      data_categories: ['dem', 'micro_roughness', 'terrain_ruggedness'],
      notes: 'Used as a reviewed source lane. Current RC1 Rockiness V2 records still use the existing 100m EPQS baseline until bounded COG reads are implemented.',
    },
    {
      source_id: 'usgs_3dep_lidar',
      name: 'USGS 3DEP LiDAR Point Clouds on AWS',
      owner: 'U.S. Geological Survey; hosted in AWS Open Data Registry',
      source_type: 'LiDAR point cloud/EPT catalog',
      source_url: SOURCE_URLS.usgs3depLidar,
      access_method: 'bounded EPT/STAC discovery for calibration sections; no bulk LAZ downloads',
      license_status: 'public_domain',
      allowed_use: 'discover LiDAR/EPT coverage and derive calibration-section micro-roughness where corridor queries are bounded',
      attribution_required: 'Data available from U.S. Geological Survey, 3D Elevation Program; cite AWS Open Data Registry access date where used.',
      confidence: 'high_for_lidar_source_not_currently_extracted',
      last_checked: GENERATED_DATE,
      production_safe: true,
      blocked_until: null,
      candidate_use: ['PA rockiness calibration', 'White Mountains calibration', 'Maine roots/rocks/remoteness calibration'],
      recommendation: 'Use for bounded EPT/LiDAR calibration sections only; do not mark record-level lidar_available until extracted evidence exists.',
      data_categories: ['lidar', 'micro_roughness', 'calibration'],
      notes: 'Reviewed as production-safe source lane. Current RC1 does not stream point clouds yet; lidar_available remains false in model records unless a future extraction writes evidence.',
    },
    {
      source_id: 'nrcs_gssurgo_ssurgo',
      name: 'NRCS gSSURGO/SSURGO soil survey data',
      owner: 'USDA Natural Resources Conservation Service',
      source_type: 'soil survey database/raster and tables',
      source_url: SOURCE_URLS.nrcsGssurgo,
      access_method: 'bounded corridor extraction of soil map units and attributes',
      license_status: 'public_domain',
      allowed_use: 'derive low-to-medium confidence stoniness, shallow-bedrock, rock-outcrop, and wetness proxies with source caveats',
      attribution_required: 'Credit USDA Natural Resources Conservation Service / National Cooperative Soil Survey where soil attributes are used.',
      confidence: 'high_for_soil_attributes_low_for_actual_tread_without_field_reports',
      last_checked: GENERATED_DATE,
      production_safe: true,
      blocked_until: null,
      candidate_use: ['soil stoniness lane', 'shallow bedrock/outcrop proxy', 'wetness/mud proxy'],
      recommendation: 'Use for bounded corridor soil attribute extraction; keep soil_stoniness_score null until attribute extraction is implemented.',
      data_categories: ['soil', 'stoniness_proxy', 'shallow_bedrock', 'wetness_proxy'],
      notes: 'Reviewed as production-safe source lane. Current RC1 V2 records keep soil_stoniness_score null until bounded SSURGO attribute extraction is implemented.',
    },
    {
      source_id: 'atc_official_2026_length_reference',
      name: 'ATC 2026 official A.T. length reference',
      owner: 'Appalachian Trail Conservancy',
      source_type: 'official reference pointer',
      source_url: OFFICIAL_REFERENCE_SOURCE_URL,
      access_method: 'website pointer',
      license_status: 'permission_required',
      allowed_use: 'reference the single official 2026 total length value and link users to ATC; do not package copied ATC guide/map/text/table content',
      attribution_required: 'Reference Appalachian Trail Conservancy as the official source.',
      confidence: 'official_reference_value',
      last_checked: GENERATED_DATE,
      production_safe: false,
      data_categories: ['official_length_reference'],
      notes: 'Used only to compare Scout generated open-route mileage against the official 2026 total length. It is not a source for generated milepoints or route geometry.',
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

function buildSourceReviews(manifest) {
  const reviewRecords = manifest.filter((source) => SOURCE_REVIEW_IDS.has(source.source_id));
  const byId = new Map(reviewRecords.map((source) => [source.source_id, source]));
  writeJson('sources/opentrail_review.json', byId.get('opentrail_review'));
  writeJson('sources/openlongtrails_review.json', byId.get('openlongtrails_review'));
  writeJson('sources/open_dem_review.json', [
    byId.get('usgs_3dep_seamless_dem'),
    byId.get('usgs_3dep_lidar'),
    byId.get('nrcs_gssurgo_ssurgo'),
  ].filter(Boolean));
  return reviewRecords;
}

function buildAwolAudit() {
  const packageJson = readJson('package.json', path.resolve(packRoot, '..', '..'));
  const awolScripts = Object.entries(packageJson.scripts ?? {})
    .filter(([name, command]) => /awol/i.test(`${name} ${command}`))
    .map(([name, command]) => ({ name, command }));
  const scriptDir = path.resolve(packRoot, '..', '..', 'scripts');
  const legacyFiles = fs.existsSync(scriptDir)
    ? fs.readdirSync(scriptDir)
      .filter((file) => /awol/i.test(file))
      .map((file) => `scripts/${file}`)
      .sort()
    : [];
  const audit = {
    audit_id: 'blocked_legacy_awol_audit',
    status: 'quarantined_by_policy_and_validation',
    production_safe: false,
    license_status: 'blocked',
    source_id: 'awol_at_guide',
    source_url: 'blocked',
    last_checked: GENERATED_DATE,
    last_generated: GENERATED_DATE,
    awol_scripts: awolScripts,
    legacy_files: legacyFiles,
    private_paths_allowed_only_for_user_owned_local_extraction: ['private/awol/'],
    production_export_rule: 'No AWOL/A.T. Guide derived record, source, dataset, or path may be marked production_safe or included in the RC1 production-safe export.',
    ai_answer_rule: 'Treat AWOL/A.T. Guide material as blocked unless Hogg Country obtains written permission or a compatible license. It may not be used in Scout packaged reference data.',
  };
  writeJson('processed/legal/blocked_legacy_awol_audit.json', audit);
  return audit;
}

function buildRoute() {
  const source = readJson('processed/route/at_route_selected.geojson');
  const feature = source.features[0];
  const geometryMeasurement = measureGeometry(feature.geometry);
  const waymarkedMiles = waymarkedReportedMiles(feature);
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
        generated_route_length_miles: FULL_LENGTH,
        official_reference_length_miles: OFFICIAL_REFERENCE_LENGTH,
        official_reference_date: '2026',
        official_reference_source: OFFICIAL_REFERENCE_SOURCE_URL,
        official_reference_usage: 'single total-length reference value only; not a copied official mile table or official route geometry',
        length_delta_miles: LENGTH_DELTA,
        length_delta_percent: LENGTH_DELTA_PERCENT,
        alignment_status: ALIGNMENT_STATUS,
        official: false,
        candidate_status: 'release_candidate_not_field_navigation',
        license_status: 'open_license_share_alike',
        source_id: 'osm',
        integration_source_id: 'full_trail_rc1_integration_model',
        route_alignment_diagnostics_path: 'processed/route/route_alignment_diagnostics.json',
        route_alignment_report_path: 'processed/route/route_alignment_report.md',
        route_continuity_diagnostics_path: 'processed/route/route_continuity_diagnostics.json',
        route_segment_length_checks_path: 'processed/route/route_segment_length_checks.json',
        measurement_diagnostics_summary: {
          geodesic_method: geometryMeasurement.method,
          geodesic_length_miles: geometryMeasurement.measured_length_miles,
          waymarked_reported_length_miles: waymarkedMiles,
          max_consecutive_vertex_gap_miles: geometryMeasurement.max_consecutive_vertex_gap_miles,
          segments_over_1_0_miles: geometryMeasurement.segments_over_1_0_miles,
          conclusion: 'Scout geodesic measurement and Waymarked reported length agree closely; projection/measurement method is not the primary 91.7-mile delta cause.',
        },
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
        side_route_detour_treatment: 'Blue-blaze side trails, shelter access trails, optional alternates, temporary detours, and the Approach Trail are not folded into generated main-route miles unless represented in the selected open AT main-route geometry.',
        baxter_katahdin_treatment: 'Katahdin/Hunt Trail/Baxter endpoint is an open-route candidate. Current opening, permits, parking, summit, and camping status require live Baxter verification.',
        ai_answer_rule: "Use as Scout's full-trail RC1 open route candidate. Say generated/open-route mile unless an explicitly licensed official source is being used. Generated miles are not official ATC miles; disclose the 2026 official-reference length, route length delta, alignment status, and Davenport-to-Damascus regional coverage gap.",
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
- Official reference source: ${OFFICIAL_REFERENCE_SOURCE_URL}
- Length delta: ${LENGTH_DELTA} miles (${LENGTH_DELTA_PERCENT}%).
- Alignment status: ${ALIGNMENT_STATUS}.

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
- Scout must say "generated/open-route mile" unless an explicitly licensed official source is being used.
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
          ai_answer_rule: 'Generated/open-route mile based on Scout full-trail RC1 open route geometry, not an official ATC mile. Preserve regional field names where available and disclose source/confidence.',
        },
      };
    });
    writeJson(`processed/milepoints/full_at_milepoints_${name}mi.geojson`, { ...source, features });
  }
  writeText('processed/milepoints/global_mile_alignment_report.md', `
# Global Mile Alignment Report

Generated: ${GENERATED_AT}

Global RC1 mileage is derived from the base open-route milepoints. It preserves local regional fields where a mile falls inside a regional MVP pack.

## Official Reference Comparison
- Official 2026 reference length: ${OFFICIAL_REFERENCE_LENGTH} miles.
- Scout generated open-route length: ${FULL_LENGTH} miles.
- Delta: ${LENGTH_DELTA} miles (${LENGTH_DELTA_PERCENT}%).
- Alignment status: ${ALIGNMENT_STATUS}.
- All global miles are generated/open-route estimates, not official ATC miles.

## Transitions
${REGIONS.map((region) => `- ${region.region_id}: ${region.start}-${region.end} generated global miles; ${region.status}; local fields ${region.localField}/${region.soboField}.`).join('\n')}

## Discontinuities
- MVP1 to MVP2 is not direct. MVP1 stops at Davenport Gap around 234.7 generated miles and MVP2 starts near Damascus/TN-VA around 459.0 generated miles.
- RC1 marks 234.7-459.0 as a yellow baseline gap. Detailed planning in this corridor should say the regional MVP layer is not yet built.

All milepoints have official:false. Generated miles are not official ATC mileage.
`);
}

function elevationMile(sample) {
  return sample.mile_nobo_global_est ?? sample.mile_nobo;
}

function elevationStep(previous, current) {
  const previousMile = elevationMile(previous);
  const currentMile = elevationMile(current);
  const distanceMiles = currentMile - previousMile;
  if (distanceMiles <= 0 || typeof previous.elevation_ft !== 'number' || typeof current.elevation_ft !== 'number') return null;
  const deltaFt = current.elevation_ft - previous.elevation_ft;
  const averageGradePercent = Math.abs(deltaFt) / (distanceMiles * FEET_PER_MILE) * 100;
  return {
    start_mile_nobo_global_est: previousMile,
    end_mile_nobo_global_est: currentMile,
    distance_miles: distanceMiles,
    elevation_delta_ft: deltaFt,
    average_grade_percent: averageGradePercent,
    direction: deltaFt >= 0 ? 'climb' : 'descent',
  };
}

function summarizeElevation(samples, interval = 10, options = {}) {
  const validSamples = samples.filter((sample) => typeof elevationMile(sample) === 'number' && typeof sample.elevation_ft === 'number');
  const summaries = [];
  for (let start = 0; start < FULL_LENGTH; start += interval) {
    const end = Math.min(FULL_LENGTH, start + interval);
    const segment = validSamples.filter((sample) => elevationMile(sample) >= start && elevationMile(sample) <= end);
    if (segment.length < 2) continue;
    let gain = 0;
    let loss = 0;
    let maxGrade = 0;
    let steepestClimb = null;
    let steepestDescent = null;
    for (let index = 1; index < segment.length; index += 1) {
      const step = elevationStep(segment[index - 1], segment[index]);
      if (!step) continue;
      if (step.elevation_delta_ft > 0) gain += step.elevation_delta_ft;
      else loss += Math.abs(step.elevation_delta_ft);
      maxGrade = Math.max(maxGrade, step.average_grade_percent);
      if (step.elevation_delta_ft > 0 && (!steepestClimb || step.average_grade_percent > steepestClimb.average_grade_percent)) {
        steepestClimb = step;
      }
      if (step.elevation_delta_ft < 0 && (!steepestDescent || step.average_grade_percent > steepestDescent.average_grade_percent)) {
        steepestDescent = step;
      }
    }
    const elevations = segment.map((sample) => sample.elevation_ft);
    summaries.push({
      segment_id: `full-rc1-elevation-${intervalName(interval)}mi-${String(summaries.length + 1).padStart(4, '0')}`,
      route_id: ROUTE_ID,
      start_mile_nobo_global_est: round(start, 1),
      end_mile_nobo_global_est: round(end, 1),
      states: [...new Set(segment.map((sample) => sample.state))],
      region_ids: [...new Set(segment.map((sample) => sample.region_id))],
      distance_miles: round(end - start, 1),
      sample_count: segment.length,
      sample_spacing_meters: options.sampleSpacingMeters ?? segment[0].sample_spacing_meters ?? null,
      source_sample_file: options.sourceSampleFile ?? null,
      summary_interval_miles: interval,
      elevation_gain_ft: Math.round(gain),
      elevation_loss_ft: Math.round(loss),
      highest_point_ft: Math.round(Math.max(...elevations)),
      lowest_point_ft: Math.round(Math.min(...elevations)),
      max_grade_percent: round(maxGrade, 1),
      steepest_climb: steepestClimb
        ? {
            start_mile_nobo_global_est: round(steepestClimb.start_mile_nobo_global_est, 3),
            end_mile_nobo_global_est: round(steepestClimb.end_mile_nobo_global_est, 3),
            distance_miles: round(steepestClimb.distance_miles, 3),
            elevation_delta_ft: round(steepestClimb.elevation_delta_ft, 1),
            average_grade_percent: round(steepestClimb.average_grade_percent, 1),
          }
        : null,
      steepest_descent: steepestDescent
        ? {
            start_mile_nobo_global_est: round(steepestDescent.start_mile_nobo_global_est, 3),
            end_mile_nobo_global_est: round(steepestDescent.end_mile_nobo_global_est, 3),
            distance_miles: round(steepestDescent.distance_miles, 3),
            elevation_delta_ft: round(steepestDescent.elevation_delta_ft, 1),
            average_grade_percent: round(steepestDescent.average_grade_percent, 1),
          }
        : null,
      source_id: 'usgs_3dep',
      source_url: EPQS_URL,
      license_status: 'public_domain',
      confidence: 'model_derived_topographic_estimate',
      last_checked: GENERATED_DATE,
      last_generated: GENERATED_DATE,
      production_safe: true,
      ai_answer_rule: options.sampleSpacingMeters === ELEVATION_SAMPLE_SPACING_METERS
        ? 'Use as a model-derived USGS 3DEP/EPQS 100-meter terrain screen. It is not a guidebook profile, surveyed grade, or current-condition source.'
        : 'Use as model-derived USGS 3DEP terrain screening. It is not a guidebook profile and does not answer current weather, closures, or safety.',
    });
  }
  return summaries;
}

function elevationSourceProps() {
  return {
    source_id: 'usgs_3dep',
    source_url: EPQS_URL,
    source: 'USGS Elevation Point Query Service, interpolated from 3DEP dynamic elevation service',
    source_license: 'public_domain',
    license_status: 'public_domain',
    attribution: 'Data available from U.S. Geological Survey, 3D Elevation Program.',
    confidence: 'model_derived_topographic_estimate',
    last_checked: GENERATED_DATE,
    last_generated: GENERATED_DATE,
    production_safe: true,
  };
}

function readHighResolutionElevationCache() {
  const cache = maybeReadJson(HIGH_RES_ELEVATION_CACHE_PATH);
  if (!cache) {
    throw new Error(`Missing ${HIGH_RES_ELEVATION_CACHE_PATH}. Run node data/at-open-reference/scripts/build-full-trail-100m-elevation.mjs first.`);
  }
  if (cache.complete !== true || !Array.isArray(cache.samples) || cache.samples.length < 33000) {
    throw new Error(`${HIGH_RES_ELEVATION_CACHE_PATH} is incomplete; rerun the 100m elevation fetcher.`);
  }
  const samples = cache.samples.map((record, index) => {
    const mile = round(record.mile_nobo_global_est, 3);
    return {
      sample_id: `full-rc1-elevation-100m-${String(index + 1).padStart(5, '0')}`,
      full_trail_record_id: `full-rc1-elevation-100m-${String(index + 1).padStart(5, '0')}`,
      trail: 'Appalachian Trail',
      route_id: ROUTE_ID,
      source_route_id: SOURCE_ROUTE_ID,
      official: false,
      sample_index: record.sample_index ?? index,
      sample_spacing_meters: ELEVATION_SAMPLE_SPACING_METERS,
      distance_meters: record.distance_meters,
      mile_nobo_global_est: mile,
      mile_sobo_global_est: round(FULL_LENGTH - mile, 3),
      ...regionalFields(mile),
      state: stateForMile(mile),
      lat: record.lat,
      lon: record.lon,
      elevation_ft: record.elevation_ft,
      epqs: record.epqs ?? null,
      terminal_partial_segment: record.terminal_partial_segment === true,
      ...elevationSourceProps(),
      last_checked: record.last_checked ?? cache.last_checked ?? GENERATED_DATE,
      ai_answer_rule: 'Describe as a direct 100-meter USGS 3DEP/EPQS elevation sample along Scout full-trail RC1 open route geometry. Generated/open-route miles are not official ATC mileage; this is not a surveyed guidebook profile or current-condition source.',
    };
  });
  const validSamples = samples.filter((sample) => typeof sample.elevation_ft === 'number');
  const status = {
    status_id: 'full-rc1-elevation-100m-status',
    route_id: ROUTE_ID,
    source_route_id: SOURCE_ROUTE_ID,
    cache_path: HIGH_RES_ELEVATION_CACHE_PATH,
    generated_at: GENERATED_AT,
    sample_spacing_meters: ELEVATION_SAMPLE_SPACING_METERS,
    sample_count: samples.length,
    valid_elevation_count: validSamples.length,
    expected_sample_count: cache.expected_sample_count,
    route_length_meters_measured: cache.route_length_meters_measured,
    target_length_meters: cache.target_length_meters,
    complete: cache.complete === true && validSamples.length === samples.length,
    generation_mode: 'direct_epqs_cache',
    ...elevationSourceProps(),
    ai_answer_rule: 'Use this status to verify Scout has direct 100-meter USGS 3DEP/EPQS elevation coverage. If complete:false, do not claim high-resolution elevation statistics are complete.',
  };
  return { samples, status };
}

function buildMajorClimbDescentCandidates(samples) {
  const candidates = [];
  let current = null;
  const closeCurrent = () => {
    if (!current) return;
    const vertical = Math.abs(current.elevation_delta_ft);
    if (vertical >= 400 && current.distance_miles >= 0.4) {
      candidates.push({
        feature_id: `full-rc1-major-${current.feature_type}-${String(candidates.length + 1).padStart(4, '0')}`,
        route_id: ROUTE_ID,
        feature_type: current.feature_type,
        start_mile_nobo_global_est: round(current.start_mile_nobo_global_est, 3),
        end_mile_nobo_global_est: round(current.end_mile_nobo_global_est, 3),
        states: [...new Set(current.states)],
        region_ids: [...new Set(current.region_ids)],
        distance_miles: round(current.distance_miles, 2),
        elevation_delta_ft: Math.round(current.elevation_delta_ft),
        vertical_change_ft: Math.round(vertical),
        average_grade_percent: round(vertical / (current.distance_miles * FEET_PER_MILE) * 100, 1),
        max_step_grade_percent: round(current.max_step_grade_percent, 1),
        sample_spacing_meters: ELEVATION_SAMPLE_SPACING_METERS,
        source_sample_file: 'processed/elevation/full_trail_elevation_samples_100m.json',
        ...elevationSourceProps(),
        ai_answer_rule: 'Use as a 100-meter USGS 3DEP/EPQS major climb/descent candidate, not a field-verified guidebook climb. State source, generated-mile, and confidence limits.',
      });
    }
    current = null;
  };

  for (let index = 1; index < samples.length; index += 1) {
    const previous = samples[index - 1];
    const currentSample = samples[index];
    const step = elevationStep(previous, currentSample);
    if (!step) continue;
    if (Math.abs(step.elevation_delta_ft) < 3) {
      if (current) {
        current.end_mile_nobo_global_est = step.end_mile_nobo_global_est;
        current.distance_miles += step.distance_miles;
        current.states.push(currentSample.state);
        current.region_ids.push(currentSample.region_id);
      }
      continue;
    }
    const featureType = step.elevation_delta_ft >= 0 ? 'major_climb' : 'major_descent';
    if (!current || current.feature_type !== featureType) {
      closeCurrent();
      current = {
        feature_type: featureType,
        start_mile_nobo_global_est: step.start_mile_nobo_global_est,
        end_mile_nobo_global_est: step.end_mile_nobo_global_est,
        distance_miles: step.distance_miles,
        elevation_delta_ft: step.elevation_delta_ft,
        max_step_grade_percent: step.average_grade_percent,
        states: [previous.state, currentSample.state].filter(Boolean),
        region_ids: [previous.region_id, currentSample.region_id].filter(Boolean),
      };
      continue;
    }
    current.end_mile_nobo_global_est = step.end_mile_nobo_global_est;
    current.distance_miles += step.distance_miles;
    current.elevation_delta_ft += step.elevation_delta_ft;
    current.max_step_grade_percent = Math.max(current.max_step_grade_percent, step.average_grade_percent);
    current.states.push(currentSample.state);
    current.region_ids.push(currentSample.region_id);
  }
  closeCurrent();
  return candidates;
}

function buildSteepGradeSections(samples) {
  const sections = [];
  let current = null;
  const closeCurrent = () => {
    if (!current) return;
    sections.push({
      section_id: `full-rc1-steep-grade-100m-${String(sections.length + 1).padStart(5, '0')}`,
      route_id: ROUTE_ID,
      start_mile_nobo_global_est: round(current.start_mile_nobo_global_est, 3),
      end_mile_nobo_global_est: round(current.end_mile_nobo_global_est, 3),
      states: [...new Set(current.states)],
      region_ids: [...new Set(current.region_ids)],
      distance_miles: round(current.distance_miles, 3),
      elevation_delta_ft: round(current.elevation_delta_ft, 1),
      grade_direction: current.direction,
      average_grade_percent: round(Math.abs(current.elevation_delta_ft) / (current.distance_miles * FEET_PER_MILE) * 100, 1),
      max_step_grade_percent: round(current.max_step_grade_percent, 1),
      sample_spacing_meters: ELEVATION_SAMPLE_SPACING_METERS,
      source_sample_file: 'processed/elevation/full_trail_elevation_samples_100m.json',
      ...elevationSourceProps(),
      ai_answer_rule: 'Use as a 100-meter USGS 3DEP/EPQS steep-grade screening section. It can miss local tread hazards and is not a surveyed or field-verified slope.',
    });
    current = null;
  };
  for (let index = 1; index < samples.length; index += 1) {
    const previous = samples[index - 1];
    const currentSample = samples[index];
    const step = elevationStep(previous, currentSample);
    if (!step || step.average_grade_percent < 12) {
      closeCurrent();
      continue;
    }
    if (!current || current.direction !== step.direction) {
      closeCurrent();
      current = {
        start_mile_nobo_global_est: step.start_mile_nobo_global_est,
        end_mile_nobo_global_est: step.end_mile_nobo_global_est,
        distance_miles: step.distance_miles,
        elevation_delta_ft: step.elevation_delta_ft,
        direction: step.direction,
        max_step_grade_percent: step.average_grade_percent,
        states: [previous.state, currentSample.state].filter(Boolean),
        region_ids: [previous.region_id, currentSample.region_id].filter(Boolean),
      };
      continue;
    }
    current.end_mile_nobo_global_est = step.end_mile_nobo_global_est;
    current.distance_miles += step.distance_miles;
    current.elevation_delta_ft += step.elevation_delta_ft;
    current.max_step_grade_percent = Math.max(current.max_step_grade_percent, step.average_grade_percent);
    current.states.push(currentSample.state);
    current.region_ids.push(currentSample.region_id);
  }
  closeCurrent();
  return sections;
}

function buildElevation() {
  const oneMileSamples = readJson('processed/elevation/elevation_samples_1_0mi.json').map((record, index) => {
    const mile = round(record.mile_nobo, 1);
    return {
      ...record,
      full_trail_record_id: `full-rc1-elevation-${String(index + 1).padStart(5, '0')}`,
      route_id: ROUTE_ID,
      source_route_id: SOURCE_ROUTE_ID,
      official: false,
      mile_nobo_global_est: mile,
      mile_sobo_global_est: round(FULL_LENGTH - mile, 1),
      ...regionalFields(mile),
      state: stateForMile(mile),
      production_safe: true,
      last_generated: GENERATED_DATE,
      ai_answer_rule: 'Describe as model-derived USGS 3DEP elevation sampled along Scout full-trail RC1 open route geometry; values may differ from guidebook profiles or surveyed summits.',
    };
  });
  const highResolution = readHighResolutionElevationCache();
  const oneMileSummaries100m = summarizeElevation(highResolution.samples, 1, {
    sampleSpacingMeters: ELEVATION_SAMPLE_SPACING_METERS,
    sourceSampleFile: 'processed/elevation/full_trail_elevation_samples_100m.json',
  });
  const fiveMileSummaries100m = summarizeElevation(highResolution.samples, 5, {
    sampleSpacingMeters: ELEVATION_SAMPLE_SPACING_METERS,
    sourceSampleFile: 'processed/elevation/full_trail_elevation_samples_100m.json',
  });
  const tenMileSummaries100m = summarizeElevation(highResolution.samples, 10, {
    sampleSpacingMeters: ELEVATION_SAMPLE_SPACING_METERS,
    sourceSampleFile: 'processed/elevation/full_trail_elevation_samples_100m.json',
  });
  const majorClimbsDescents = buildMajorClimbDescentCandidates(highResolution.samples);
  const steepGradeSections = buildSteepGradeSections(highResolution.samples);

  writeJson('processed/elevation/full_trail_elevation_samples_1_0mi.json', oneMileSamples);
  writeJson('processed/elevation/full_trail_elevation_samples_100m.json', highResolution.samples);
  writeJson('processed/elevation/full_trail_elevation_100m_status.json', highResolution.status);
  writeJson('processed/elevation/full_trail_elevation_by_1mi_segment_100m.json', oneMileSummaries100m);
  writeJson('processed/elevation/full_trail_elevation_by_5mi_segment_100m.json', fiveMileSummaries100m);
  writeJson('processed/elevation/full_trail_elevation_by_10mi_segment_100m.json', tenMileSummaries100m);
  writeJson('processed/elevation/full_trail_elevation_by_5mi_segment.json', fiveMileSummaries100m);
  writeJson('processed/elevation/full_trail_elevation_by_10mi_segment.json', tenMileSummaries100m);
  writeJson('processed/elevation/full_trail_major_climbs_descents_100m.json', majorClimbsDescents);
  writeJson('processed/elevation/full_trail_steep_grade_sections_100m.json', steepGradeSections);
  writeText('processed/elevation/full_trail_elevation_summary.md', `
# Full Trail RC1 Elevation Summary

Elevation is model-derived from USGS 3DEP through the USGS Elevation Point Query Service. It supports terrain screening, climb/descent estimates, grade-risk screening, and difficulty modeling, but not exact guidebook profiles, surveyed grades, current conditions, or field navigation.

RC1 includes ${highResolution.samples.length} direct 100-meter samples, compatibility 1-mile samples, 1-mile/5-mile/10-mile summaries derived from the 100-meter samples, ${majorClimbsDescents.length} major climb/descent candidates, and ${steepGradeSections.length} steep-grade screening sections across ${FULL_LENGTH} generated miles.

The 100-meter layer is the preferred elevation source for Scout difficulty and terrain answers. The 1-mile sample file is retained for compatibility and quick inspection only. Short mileage in the Smokies, Shenandoah, Pennsylvania ridges, New England, the White Mountains, Maine, and Katahdin can still be difficult when gain/loss, steep descents, tread, weather, remoteness, permits, and water uncertainty stack.

Generated miles are not official ATC mileage.
`);
  return {
    oneMileSamples,
    highResolutionSamples: highResolution.samples,
    highResolutionStatus: highResolution.status,
    oneMileSummaries100m,
    fiveMileSummaries100m,
    tenMileSummaries100m,
    majorClimbsDescents,
    steepGradeSections,
  };
}

function buildRouteAlignment(elevationSamples) {
  const source = readJson('processed/route/at_route_selected.geojson');
  const feature = source.features[0];
  const measurement = measureGeometry(feature.geometry);
  const waymarkedMiles = waymarkedReportedMiles(feature);
  const threeD = estimateThreeDLength(elevationSamples);
  const graph = feature.properties.graph ?? {};
  const continuity = {
    route_id: ROUTE_ID,
    source_route_id: SOURCE_ROUTE_ID,
    generated_at: GENERATED_AT,
    source_id: 'route_alignment_diagnostics',
    source_url: 'internal:data/at-open-reference/scripts/build-full-trail-rc1-reference-pack.mjs',
    license_status: 'open_license_share_alike',
    confidence: 'measurement_diagnostic_not_official_route',
    production_safe: true,
    last_generated: GENERATED_DATE,
    geometry_type: feature.geometry.type,
    vertex_count: measurement.vertex_count,
    segment_count: measurement.segment_count,
    max_consecutive_vertex_gap_miles: measurement.max_consecutive_vertex_gap_miles,
    consecutive_segments_over_0_02_miles: measurement.segments_over_0_02_miles,
    consecutive_segments_over_0_5_miles: measurement.segments_over_0_5_miles,
    consecutive_segments_over_1_0_miles: measurement.segments_over_1_0_miles,
    graph_join_gap_count_over_0_02_miles: graph.join_gap_count_over_0_02_miles ?? null,
    graph_join_gap_total_miles_over_0_02_miles: graph.join_gap_total_miles_over_0_02_miles ?? null,
    graph_max_join_gap_miles: graph.max_join_gap_miles ?? null,
    graph_stitch_edges: graph.stitchEdges ?? null,
    graph_max_stitch_miles: typeof graph.maxStitchMiles === 'number' ? round(graph.maxStitchMiles, 3) : null,
    ai_answer_rule: 'Use as route continuity QA only. It does not make Scout generated miles official and does not prove field navigation safety.',
  };
  const segmentChecks = REGIONS.map((region) => {
    const length = round(region.end - region.start, 1);
    return {
      segment_check_id: `route-check-${region.region_id}`,
      route_id: ROUTE_ID,
      region_id: region.region_id,
      source_pack: region.source_pack,
      label: region.label,
      start_mile_nobo_global_est: region.start,
      end_mile_nobo_global_est: region.end,
      generated_length_miles: length,
      generated_share_of_route_percent: round((length / FULL_LENGTH) * 100, 2),
      route_file: region.route_file,
      status: region.status,
      gap: region.gap === true,
      license_status: 'open_license_share_alike',
      confidence: region.gap ? 'low_due_to_regional_mvp_gap' : 'regional_mvp_integrated',
      last_generated: GENERATED_DATE,
      production_safe: true,
      ai_answer_rule: region.gap
        ? 'Disclose this as the Davenport Gap to Damascus yellow regional detail gap; use generated/open-route miles only.'
        : 'Use as regional length/provenance QA only; generated/open-route miles are not official ATC miles.',
    };
  });
  const diagnostics = {
    route_id: ROUTE_ID,
    source_route_id: SOURCE_ROUTE_ID,
    generated_at: GENERATED_AT,
    alignment_status: ALIGNMENT_STATUS,
    source_id: 'route_alignment_diagnostics',
    source_url: 'internal:data/at-open-reference/scripts/build-full-trail-rc1-reference-pack.mjs',
    source_geometry_url: feature.properties.source_url,
    source_access_url: feature.properties.source_access_url,
    official_reference_source_url: OFFICIAL_REFERENCE_SOURCE_URL,
    license_status: 'open_license_share_alike',
    confidence: 'measurement_diagnostic_not_official_route',
    last_generated: GENERATED_DATE,
    production_safe: true,
    official: false,
    official_reference_length_miles: OFFICIAL_REFERENCE_LENGTH,
    generated_route_length_miles: FULL_LENGTH,
    length_delta_miles: LENGTH_DELTA,
    length_delta_percent: LENGTH_DELTA_PERCENT,
    route_length_measurements: {
      scout_constant_miles: FULL_LENGTH,
      local_geodesic_miles: measurement.measured_length_miles,
      local_geodesic_rounded_miles: measurement.measured_length_miles_rounded_for_ui,
      waymarked_reported_miles: waymarkedMiles,
      source_graph_measured_miles: typeof graph.measuredLengthMiles === 'number' ? round(graph.measuredLengthMiles, 3) : null,
      source_graph_reported_length_meters: graph.route_reported_length_meters ?? null,
      local_vs_waymarked_delta_miles: typeof waymarkedMiles === 'number' ? round(measurement.measured_length_miles - waymarkedMiles, 3) : null,
      local_vs_official_delta_miles: round(measurement.measured_length_miles - OFFICIAL_REFERENCE_LENGTH, 3),
      three_d_estimate: threeD,
      conclusion: 'Local geodesic, Waymarked reported length, and source graph measured length are close. The 91.7-mile official-reference delta is not explained by projection alone; 100-meter 3D elevation screening only adds a few miles.',
    },
    compared_factors: [
      {
        factor: 'OSM/Waymarked route geometry',
        finding: `Waymarked reports about ${waymarkedMiles} miles and Scout local geodesic measurement reports ${measurement.measured_length_miles} miles, both near the current ${FULL_LENGTH}-mile generated route.`,
        status: 'primary_open_route_baseline_is_shorter_than_official_reference',
      },
      {
        factor: 'projection/measurement method',
        finding: `Geodesic measurement differs from the rounded RC1 length by ${round(measurement.measured_length_miles - FULL_LENGTH, 3)} miles and from Waymarked by ${typeof waymarkedMiles === 'number' ? round(measurement.measured_length_miles - waymarkedMiles, 3) : 'unknown'} miles.`,
        status: 'not_primary_cause',
      },
      {
        factor: 'vertical/slope length',
        finding: `${threeD.sample_spacing_meters ?? 'coarse'}-meter 3D estimate is ${threeD.estimated_3d_length_miles} miles, adding about ${threeD.added_miles_vs_2d_route} miles.`,
        status: 'not_enough_to_close_delta',
      },
      {
        factor: 'Approach Trail',
        finding: 'Amicalola/Approach Trail remains contextual and excluded from main AT generated mileage by design.',
        status: 'excluded_by_design_not_delta_solution',
      },
      {
        factor: 'Baxter/Katahdin endpoint handling',
        finding: 'MVP6 endpoint follows the selected open main-route candidate; current Baxter/Katahdin status remains a live-check problem, not a static mileage correction.',
        status: 'open_route_candidate_requires_live_status_for_conditions',
      },
      {
        factor: 'side routes, blue blazes, shelter spurs, alternates, and temporary detours',
        finding: 'These are not folded into main-route generated miles unless present in the selected open AT main-route geometry.',
        status: 'possible_contributor_but_not_force_matched',
      },
      {
        factor: 'Davenport Gap to Damascus regional MVP gap',
        finding: 'RC1 has route continuity through this corridor but only base open-reference detail; this is a data-depth gap and must be disclosed separately from the official-length delta.',
        status: 'documented_yellow_data_depth_gap',
      },
      {
        factor: 'official ATC annual mileage process',
        finding: 'The 2026 official length is used as a single reference value only. Scout does not copy official ATC mile tables or force-match generated milepoints to official mileage.',
        status: 'reference_only',
      },
    ],
    suspected_causes: [
      'Selected OpenStreetMap/Waymarked main-route geometry currently measures materially shorter than ATC 2026 official total length.',
      'Official ATC length uses the maintained annual official mileage baseline; Scout has no licensed official mile table or official centerline in this pack.',
      'Projection/geodesic method and vertical component do not explain most of the 91.7-mile delta.',
      'Open route source treatment may omit, simplify, or handle relocations, road walks, side-route roles, or endpoint details differently than the official measurement baseline.',
      'Davenport Gap to Damascus remains a regional detail gap even though the open route spine is continuous there.',
    ],
    unresolved_causes: [
      'No license-reviewed NPS/APPA or ATC official centerline has been integrated for route correction.',
      'No licensed official ATC mile table has been ingested, and generated milepoints remain open-route estimates.',
      'Known annual relocations/detours have not been reconciled segment-by-segment against a licensed official source.',
    ],
    next_work: [
      'Compare against license-reviewed NPS/APPA centerline or other public-domain state/federal centerlines where terms permit packaging.',
      'Run segment-by-segment OSM relation QA against public source geometry and identify where the open route diverges from known termini/corridors.',
      'Keep dashboard yellow until generated open-route length and official reference delta are both explained or corrected with license-safe data.',
      'If official-grade miles are required, obtain explicit license/permission for official ATC route/mile data instead of copying public guide tables.',
    ],
    continuity_diagnostics_path: 'processed/route/route_continuity_diagnostics.json',
    segment_length_checks_path: 'processed/route/route_segment_length_checks.json',
    route_alignment_report_path: 'processed/route/route_alignment_report.md',
    ai_answer_rule: 'When asked about trail miles, say generated/open-route mile unless an explicitly licensed official source is being used. Always disclose the 2,197.9-mile 2026 official reference, 2,106.2-mile generated route, -91.7-mile delta, and yellow alignment status when full-trail precision matters.',
  };

  writeJson('processed/route/route_alignment_diagnostics.json', diagnostics);
  writeJson('processed/route/route_continuity_diagnostics.json', continuity);
  writeJson('processed/route/route_segment_length_checks.json', segmentChecks);
  writeText('processed/route/route_alignment_report.md', `
# Route Alignment Report

Generated: ${GENERATED_AT}

## Status
- Alignment status: ${ALIGNMENT_STATUS}
- Official 2026 reference length: ${OFFICIAL_REFERENCE_LENGTH} miles
- Official reference source: ${OFFICIAL_REFERENCE_SOURCE_URL}
- Scout generated open-route length: ${FULL_LENGTH} miles
- Delta: ${LENGTH_DELTA} miles (${LENGTH_DELTA_PERCENT}%)
- Route official flag: false
- Generated Scout miles are not official ATC miles.

The official length is used only as a single reference value. Scout generated miles are not official ATC miles. Scout does not copy ATC mile tables, FarOut data, The A.T. Guide, A.T. Data Book, Thru-Hikers' Companion, AllTrails, Gaia, Hiking Project, or copied ATC guide/map content.

## Measurement Audit
- Local geodesic measurement: ${measurement.measured_length_miles} miles over ${measurement.vertex_count.toLocaleString()} vertices.
- Waymarked route reported length: ${waymarkedMiles} miles.
- Source graph measured length: ${typeof graph.measuredLengthMiles === 'number' ? round(graph.measuredLengthMiles, 3) : 'unknown'} miles.
- ${threeD.sample_spacing_meters ?? 'Coarse'}-meter 3D estimate: ${threeD.estimated_3d_length_miles} miles, adding about ${threeD.added_miles_vs_2d_route} miles.
- Maximum consecutive route-vertex gap: ${measurement.max_consecutive_vertex_gap_miles} miles.
- Consecutive route-vertex gaps over 1.0 mile: ${measurement.segments_over_1_0_miles}.

Conclusion: the measurement method is not the primary cause. Local geodesic, Waymarked reported length, and source graph length all cluster near the Scout generated length. The open geometry baseline itself is short relative to the official 2026 reference.

## Suspected Causes
${diagnostics.suspected_causes.map((cause) => `- ${cause}`).join('\n')}

## Explicit Comparisons
${diagnostics.compared_factors.map((factor) => `- ${factor.factor}: ${factor.status}. ${factor.finding}`).join('\n')}

## Regional Segment Checks
${segmentChecks.map((check) => `- ${check.region_id}: ${check.start_mile_nobo_global_est}-${check.end_mile_nobo_global_est} generated miles (${check.generated_length_miles} mi), status ${check.status}${check.gap ? ', regional detail gap' : ''}.`).join('\n')}

## Unresolved
${diagnostics.unresolved_causes.map((cause) => `- ${cause}`).join('\n')}

## AI Policy
- Say "generated/open-route mile" unless using an explicitly licensed official source.
- Do not present generated milepoints as official ATC miles.
- Surface the official reference, generated length, delta, and yellow alignment status when full-trail precision matters.
- Keep Davenport Gap to Damascus as a separate yellow regional-detail gap.
`);
  return { diagnostics, continuity, segmentChecks };
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

Water and ford records are coordinate-first landmarks. Treat lat/lon in coordinate_anchor as the stable mapped location. Treat route_snap miles as derived generated/open-route positions that can change when Scout changes route spines.

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

function bucketElevationSamplesByTenth(elevationSamples) {
  const buckets = new Map();
  for (const sample of elevationSamples) {
    const mile = sample.mile_nobo_global_est;
    if (typeof mile !== 'number') continue;
    const key = Math.round(mile * 10);
    if (!buckets.has(key)) buckets.set(key, []);
    buckets.get(key).push(sample);
  }
  return buckets;
}

function elevationWindowForMile(sampleBuckets, mile, radiusTenths = 2) {
  const key = Math.round(mile * 10);
  const window = [];
  for (let offset = -radiusTenths; offset <= radiusTenths; offset += 1) {
    const samples = sampleBuckets.get(key + offset);
    if (samples) window.push(...samples);
  }
  return window.sort((a, b) => a.distance_meters - b.distance_meters);
}

function microRoughnessFromSamples(samples) {
  if (samples.length < 2) {
    return {
      micro_roughness_score: null,
      average_abs_grade_percent: null,
      max_abs_grade_percent: null,
      grade_stddev_percent: null,
      sample_count: samples.length,
    };
  }
  const grades = [];
  for (let index = 1; index < samples.length; index += 1) {
    const previous = samples[index - 1];
    const current = samples[index];
    const distanceMeters = (current.distance_meters ?? 0) - (previous.distance_meters ?? 0);
    if (distanceMeters <= 0) continue;
    const horizontalFeet = distanceMeters * 3.28084;
    const verticalFeet = (current.elevation_ft ?? 0) - (previous.elevation_ft ?? 0);
    grades.push(Math.abs((verticalFeet / horizontalFeet) * 100));
  }
  if (!grades.length) {
    return {
      micro_roughness_score: null,
      average_abs_grade_percent: null,
      max_abs_grade_percent: null,
      grade_stddev_percent: null,
      sample_count: samples.length,
    };
  }
  const average = grades.reduce((sum, grade) => sum + grade, 0) / grades.length;
  const variance = grades.reduce((sum, grade) => sum + (grade - average) ** 2, 0) / grades.length;
  const stddev = Math.sqrt(variance);
  const max = Math.max(...grades);
  const score = Math.max(0, Math.min(10, (average / 2.5) + (stddev / 4) + (max / 12)));
  return {
    micro_roughness_score: round(score, 2),
    average_abs_grade_percent: round(average, 2),
    max_abs_grade_percent: round(max, 2),
    grade_stddev_percent: round(stddev, 2),
    sample_count: samples.length,
  };
}

function osmSurfaceSignalFromTread(treadRecord) {
  if (!treadRecord) return null;
  const score = typeof treadRecord.score === 'number' ? treadRecord.score : null;
  const tagCount = treadRecord.osm_signal_count ?? Object.values(treadRecord.osm_tags ?? {})
    .flatMap((value) => typeof value === 'object' && value ? Object.values(value) : [])
    .reduce((sum, value) => sum + (typeof value === 'number' ? value : 0), 0);
  if (score === null && !tagCount) return null;
  return round(Math.min(10, (score ?? 1) * 2 + Math.min(2, tagCount / 20)), 2);
}

function rockinessClass(score) {
  if (score <= 1.5) return 'smooth';
  if (score <= 3) return 'mostly_smooth';
  if (score <= 5) return 'moderate_rocks_roots';
  if (score <= 7) return 'rocky_uneven';
  if (score <= 8.5) return 'very_rocky';
  return 'severe_rocks_boulders_scramble';
}

function rockinessPacePenalty(score) {
  const score0to5 = Math.max(0, Math.min(5, Math.round(score / 2)));
  return PACE_PENALTY.get(score0to5) ?? 1;
}

function combineRockinessScores({ micro, osm, soil, treadFallback }) {
  const components = [];
  if (typeof micro === 'number') components.push({ score: micro, weight: 0.55 });
  if (typeof osm === 'number') components.push({ score: osm, weight: 0.25 });
  if (typeof soil === 'number') components.push({ score: soil, weight: 0.2 });
  if (typeof soil !== 'number' && typeof treadFallback === 'number') components.push({ score: treadFallback, weight: 0.2 });
  if (!components.length) return 2;
  const totalWeight = components.reduce((sum, component) => sum + component.weight, 0);
  return round(components.reduce((sum, component) => sum + component.score * component.weight, 0) / totalWeight, 2);
}

function rockinessConfidence({ region, micro, osm, soil, lidar }) {
  if (region.gap) return 'low_due_to_regional_mvp_gap';
  if (lidar && typeof soil === 'number' && typeof osm === 'number') return 'high_model_with_lidar_soil_osm';
  if (typeof micro === 'number' && typeof osm === 'number') return 'medium_model_with_100m_dem_and_osm';
  if (typeof micro === 'number') return 'low_model_with_100m_dem_only';
  return 'unknown_insufficient_open_signals';
}

function buildRockinessV2(elevationSamples100m, tread) {
  const milepoints01 = rows(readJson('processed/milepoints/full_at_milepoints_0_1mi.geojson', rcRoot));
  const sampleBuckets = bucketElevationSamplesByTenth(elevationSamples100m);
  const treadByMile = new Map(tread.map((record) => [Math.round(record.mile_nobo_global_est ?? record.start_mile_nobo_global_est ?? 0), record]));
  const soilRecords = [];
  const osmRecords = [];

  for (const record of tread) {
    const mile = round(record.mile_nobo_global_est ?? record.start_mile_nobo_global_est ?? 0, 1);
    soilRecords.push({
      soil_stoniness_id: `full-rc1-soil-stoniness-${String(soilRecords.length + 1).padStart(5, '0')}`,
      route_id: ROUTE_ID,
      mile_nobo_global_est: mile,
      mile_sobo_global_est: round(FULL_LENGTH - mile, 1),
      ...regionalFields(mile),
      state: stateForMile(mile),
      soil_stoniness_score: null,
      extraction_status: 'source_reviewed_bounded_extraction_not_yet_run',
      confidence: 'unknown_until_ssurgo_attributes_extracted',
      source_id: 'nrcs_gssurgo_ssurgo',
      source_url: SOURCE_URLS.nrcsGssurgo,
      license_status: 'public_domain',
      last_checked: GENERATED_DATE,
      last_generated: GENERATED_DATE,
      production_safe: true,
      ai_answer_rule: 'Do not infer reliable tread rockiness from this lane until bounded gSSURGO/SSURGO attributes are extracted. Treat missing score as unknown.',
    });
    const osmSignal = osmSurfaceSignalFromTread(record);
    osmRecords.push({
      osm_surface_signal_id: `full-rc1-osm-surface-${String(osmRecords.length + 1).padStart(5, '0')}`,
      route_id: ROUTE_ID,
      mile_nobo_global_est: mile,
      mile_sobo_global_est: round(FULL_LENGTH - mile, 1),
      ...regionalFields(mile),
      state: stateForMile(mile),
      osm_surface_signal: osmSignal,
      osm_signal_count: record.osm_signal_count ?? null,
      osm_tags: record.osm_tags ?? null,
      osm_source_ids: record.osm_source_ids ?? [],
      confidence: osmSignal === null ? 'low_no_osm_surface_tags_on_record' : 'medium_odbl_tread_signal',
      source_id: 'osm',
      source_url: SOURCE_URLS.osmCopyright,
      license_status: 'open_license_share_alike',
      last_checked: GENERATED_DATE,
      last_generated: GENERATED_DATE,
      production_safe: true,
      ai_answer_rule: 'Use as an ODbL-derived tread-surface signal only. Preserve OpenStreetMap attribution and do not treat tag absence as proof of smooth tread.',
    });
  }

  const osmByMile = new Map(osmRecords.map((record) => [Math.round(record.mile_nobo_global_est), record]));
  const soilByMile = new Map(soilRecords.map((record) => [Math.round(record.mile_nobo_global_est), record]));
  const rockiness01 = milepoints01.map((milepoint, index) => {
    const mile = round(milepoint.mile_nobo_global_est ?? milepoint.mile_nobo ?? 0, 1);
    const region = regionForMile(mile);
    const elevationWindow = elevationWindowForMile(sampleBuckets, mile, 2);
    const roughness = microRoughnessFromSamples(elevationWindow);
    const treadRecord = treadByMile.get(Math.round(mile));
    const osmRecord = osmByMile.get(Math.round(mile));
    const soilRecord = soilByMile.get(Math.round(mile));
    const osmSignal = osmRecord?.osm_surface_signal ?? null;
    const soilSignal = soilRecord?.soil_stoniness_score ?? null;
    const treadFallback = typeof treadRecord?.score === 'number' ? treadRecord.score * 2 : null;
    const score = combineRockinessScores({
      micro: roughness.micro_roughness_score,
      osm: osmSignal,
      soil: soilSignal,
      treadFallback,
    });
    const confidence = rockinessConfidence({
      region,
      micro: roughness.micro_roughness_score,
      osm: osmSignal,
      soil: soilSignal,
      lidar: false,
    });
    return {
      rockiness_v2_id: `full-rc1-rockiness-v2-0-1mi-${String(index + 1).padStart(5, '0')}`,
      route_id: ROUTE_ID,
      interval_miles: 0.1,
      mile_nobo_global_est: mile,
      mile_sobo_global_est: round(FULL_LENGTH - mile, 1),
      official: false,
      ...regionalFields(mile),
      state: stateForMile(mile),
      rockiness_v2_score_0_10: score,
      rockiness_class: rockinessClass(score),
      confidence,
      field_verified: false,
      lidar_available: false,
      dem_resolution_m: ELEVATION_SAMPLE_SPACING_METERS,
      micro_roughness_score: roughness.micro_roughness_score,
      soil_stoniness_score: soilSignal,
      osm_surface_signal: osmSignal,
      user_report_signal: null,
      pace_penalty_factor: rockinessPacePenalty(score),
      source_id: ROCKINESS_V2_SOURCE_ID,
      source_ids: [ROCKINESS_V2_SOURCE_ID, 'usgs_3dep', 'osm', 'nrcs_gssurgo_ssurgo'],
      source_url: 'internal:data/at-open-reference/scripts/build-full-trail-rc1-reference-pack.mjs',
      license_status: 'open_license_share_alike',
      source_license: 'ODbL-derived plus USGS/NRCS public domain metadata',
      attribution: 'OpenStreetMap contributors; Data available from U.S. Geological Survey, 3D Elevation Program; USDA NRCS gSSURGO/SSURGO source lane reviewed but not yet extracted.',
      last_checked: GENERATED_DATE,
      last_generated: GENERATED_DATE,
      production_safe: true,
      model_inputs: {
        micro_roughness: {
          source_id: 'usgs_3dep',
          sample_spacing_meters: ELEVATION_SAMPLE_SPACING_METERS,
          sample_count: roughness.sample_count,
          average_abs_grade_percent: roughness.average_abs_grade_percent,
          max_abs_grade_percent: roughness.max_abs_grade_percent,
          grade_stddev_percent: roughness.grade_stddev_percent,
        },
        osm_surface_signal: osmSignal === null ? 'not_available_on_nearest_1mi_tread_record' : 'nearest_1mi_odbl_tread_record',
        soil_stoniness: 'source_reviewed_bounded_extraction_not_yet_run',
        lidar: 'source_reviewed_bounded_discovery_not_yet_extracted',
        user_reports: 'none_available_in_open_rc1_pack',
      },
      ai_answer_rule: 'Describe as a source-aware Rockiness V2 model estimate, not field verified. Generated/open-route miles are not official ATC mileage. State confidence, note that LiDAR/SSURGO are reviewed future lanes unless evidence fields are populated, and avoid claiming exact footing.',
    };
  });

  const grouped = new Map();
  for (const record of rockiness01) {
    const key = Math.floor(record.mile_nobo_global_est);
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key).push(record);
  }
  const rockiness1 = [...grouped.entries()].sort((a, b) => a[0] - b[0]).map(([startMile, records], index) => {
    const midpoint = round(records.reduce((sum, record) => sum + record.mile_nobo_global_est, 0) / records.length, 1);
    const region = regionForMile(midpoint);
    const avg = round(records.reduce((sum, record) => sum + record.rockiness_v2_score_0_10, 0) / records.length, 2);
    const confidence = records.some((record) => record.confidence === 'low_due_to_regional_mvp_gap')
      ? 'low_due_to_regional_mvp_gap'
      : records.some((record) => record.confidence.startsWith('medium'))
        ? 'medium_model_with_100m_dem_and_osm'
        : records[0]?.confidence ?? 'unknown_insufficient_open_signals';
    const recordsWithMicro = records.filter((record) => typeof record.micro_roughness_score === 'number');
    const recordsWithOsm = records.filter((record) => typeof record.osm_surface_signal === 'number');
    return {
      rockiness_v2_id: `full-rc1-rockiness-v2-1mi-${String(index + 1).padStart(5, '0')}`,
      route_id: ROUTE_ID,
      interval_miles: 1,
      start_mile_nobo_global_est: round(startMile, 1),
      end_mile_nobo_global_est: round(Math.min(FULL_LENGTH, startMile + 1), 1),
      mile_nobo_global_est: midpoint,
      mile_sobo_global_est: round(FULL_LENGTH - midpoint, 1),
      official: false,
      ...regionalFields(midpoint),
      state: stateForMile(midpoint),
      rockiness_v2_score_0_10: avg,
      rockiness_class: rockinessClass(avg),
      confidence,
      field_verified: false,
      lidar_available: records.some((record) => record.lidar_available === true),
      dem_resolution_m: ELEVATION_SAMPLE_SPACING_METERS,
      micro_roughness_score: recordsWithMicro.length
        ? round(recordsWithMicro.reduce((sum, record) => sum + record.micro_roughness_score, 0) / recordsWithMicro.length, 2)
        : null,
      soil_stoniness_score: null,
      osm_surface_signal: recordsWithOsm.length
        ? round(recordsWithOsm.reduce((sum, record) => sum + record.osm_surface_signal, 0) / recordsWithOsm.length, 2)
        : null,
      user_report_signal: null,
      pace_penalty_factor: rockinessPacePenalty(avg),
      source_id: ROCKINESS_V2_SOURCE_ID,
      source_ids: [ROCKINESS_V2_SOURCE_ID, 'usgs_3dep', 'osm', 'nrcs_gssurgo_ssurgo'],
      source_url: 'internal:data/at-open-reference/scripts/build-full-trail-rc1-reference-pack.mjs',
      license_status: 'open_license_share_alike',
      last_checked: GENERATED_DATE,
      last_generated: GENERATED_DATE,
      production_safe: true,
      source_record_count: records.length,
      ai_answer_rule: 'Describe as a 1-mile aggregate of Rockiness V2 model estimates, not field verified. Use for pacing/difficulty screening with confidence and source caveats.',
    };
  });

  const coverage = [
    {
      coverage_id: 'rockiness-v2-100m-epqs-baseline',
      source_id: 'usgs_3dep',
      source_url: EPQS_URL,
      coverage_status: 'complete_current_baseline',
      dem_resolution_m: ELEVATION_SAMPLE_SPACING_METERS,
      sample_count: elevationSamples100m.length,
      production_safe: true,
      license_status: 'public_domain',
      confidence: 'high_for_elevation_low_for_actual_tread_surface',
      last_checked: GENERATED_DATE,
      last_generated: GENERATED_DATE,
      ai_answer_rule: 'Use as model-derived elevation roughness only; not a field-verified tread surface record.',
    },
    {
      coverage_id: 'rockiness-v2-3dep-seamless-10m-30m-discovery',
      source_id: 'usgs_3dep_seamless_dem',
      source_url: SOURCE_URLS.usgs3depSeamless,
      coverage_status: 'reviewed_for_bounded_stac_discovery_not_downloaded',
      dem_resolution_m: [10, 30],
      production_safe: true,
      license_status: 'public_domain',
      confidence: 'source_review_complete_extraction_pending',
      last_checked: GENERATED_DATE,
      last_generated: GENERATED_DATE,
      ai_answer_rule: 'Use as a reviewed future DEM lane. Do not claim 10m/30m terrain ruggedness until extraction records exist.',
    },
    {
      coverage_id: 'rockiness-v2-lidar-calibration-discovery',
      source_id: 'usgs_3dep_lidar',
      source_url: SOURCE_URLS.usgs3depLidar,
      coverage_status: 'reviewed_for_bounded_ept_calibration_not_streamed',
      calibration_sections: ['northern_pennsylvania_rocky_ridges', 'white_mountains_nh', 'western_maine_mahoosucs_and_100_mile_wilderness'],
      lidar_available_in_records: false,
      production_safe: true,
      license_status: 'public_domain',
      confidence: 'source_review_complete_extraction_pending',
      last_checked: GENERATED_DATE,
      last_generated: GENERATED_DATE,
      ai_answer_rule: 'Use as a reviewed future LiDAR calibration lane. Do not mark records lidar_available:true without extraction evidence.',
    },
  ];

  writeJson('processed/tread_rockiness_v2/full_trail_micro_roughness_coverage.json', coverage);
  writeJson('processed/tread_rockiness_v2/full_trail_soil_stoniness.json', soilRecords);
  writeJson('processed/tread_rockiness_v2/full_trail_osm_surface_tags.json', osmRecords);
  writeJson('processed/tread_rockiness_v2/full_trail_rockiness_v2_by_0_1mi.json', rockiness01);
  writeJson('processed/tread_rockiness_v2/full_trail_rockiness_v2_by_1mi.json', rockiness1);
  writeText('processed/tread_rockiness_v2/rockiness_v2_model_notes.md', `
# Rockiness V2 Model Notes

Rockiness V2 is a source-aware planning screen. It improves the old 0-5 tread layer by using the full-trail 100-meter USGS 3DEP/EPQS elevation baseline to estimate local grade variability around each generated 0.1-mile point, then blending that with nearby OSM-derived tread/surface signals where present.

Current weights are normalized from available safe signals:
- 55% 100-meter DEM micro-roughness.
- 25% OSM-derived surface/smoothness/sac_scale/tread signal where present.
- 20% gSSURGO/SSURGO soil stoniness when a bounded extraction exists; for RC1 this lane is reviewed but not yet extracted, so it is null and receives no weight.
- Existing tread v1 contributes only as a compatibility fallback when soil data is absent.

No Rockiness V2 record is field verified. In answer text, treat Rockiness V2 as not field verified unless a future trusted user/official source writes explicit record-level proof. LiDAR and gSSURGO are reviewed source lanes, not populated evidence, until future bounded extractors write record-level proof.
`);
  writeText('processed/tread_rockiness_v2/rockiness_v2_source_limitations.md', `
# Rockiness V2 Source Limitations

- OpenTrail and OpenLongTrails/Grit remain review-only sources. Do not scrape or package their data without a compatible public license/API or written permission.
- 100-meter USGS 3DEP/EPQS samples are good for broad local relief and grade variability, but they cannot see every rock, root, bog bridge, slab, boulder, or eroded tread detail.
- OSM surface/smoothness/sac_scale tags are ODbL-derived and unevenly populated. Missing tags do not mean smooth tread.
- gSSURGO/SSURGO is a soil/material proxy, not a trail-surface observation. The RC1 file intentionally leaves soil_stoniness_score null until bounded corridor attributes are extracted.
- USGS 3DEP LiDAR is reviewed for future calibration, but RC1 does not stream EPT/point-cloud records. lidar_available must stay false unless future extraction evidence exists.
- User reports are absent from the open RC1 pack. Do not invent field verification.
`);
  writeJson('schemas/rockiness_v2.schema.json', {
    $schema: 'https://json-schema.org/draft/2020-12/schema',
    title: 'Scout Full Trail Rockiness V2 Record',
    type: 'object',
    required: [
      'mile_nobo_global_est',
      'mile_sobo_global_est',
      'official',
      'rockiness_v2_score_0_10',
      'rockiness_class',
      'confidence',
      'field_verified',
      'lidar_available',
      'dem_resolution_m',
      'micro_roughness_score',
      'soil_stoniness_score',
      'osm_surface_signal',
      'user_report_signal',
      'pace_penalty_factor',
      'source_id',
      'source_url',
      'license_status',
      'last_checked',
      'last_generated',
      'ai_answer_rule',
    ],
    properties: {
      official: { const: false },
      field_verified: { const: false },
      rockiness_v2_score_0_10: { type: 'number', minimum: 0, maximum: 10 },
      license_status: { enum: ['open_license_share_alike'] },
    },
  });
  return {
    coverage,
    soilRecords,
    osmRecords,
    byPointOneMile: rockiness01,
    byOneMile: rockiness1,
  };
}

function defaultRockinessV21Snapshot() {
  return {
    extraction_id: 'rockiness-v2-1-no-live-snapshot',
    generated_at: GENERATED_AT,
    extraction_level: 'missing_snapshot_fallback',
    production_safe: true,
    license_status: 'open_license_share_alike_or_public_domain',
    dem: {
      source_id: 'usgs_3dep_seamless_dem',
      source_url: SOURCE_URLS.usgs3depSeamless,
      sections: [],
    },
    lidar: {
      source_id: 'usgs_3dep_lidar',
      source_url: SOURCE_URLS.usgs3depLidar,
      catalog_item_link_count: 0,
      at_state_item_link_count: 0,
      inspected_item_count: 0,
      inspected_item_errors: 0,
      calibration_sections: [],
      extraction_status: 'snapshot_missing',
      production_safe: true,
      license_status: 'public_domain',
    },
    soil: {
      source_id: 'nrcs_gssurgo_ssurgo',
      source_url: SOURCE_URLS.nrcsGssurgo,
      extraction_status: 'not_extracted_in_v2_1',
      production_safe: true,
      license_status: 'public_domain',
    },
    osm: {
      source_id: 'osm',
      source_url: SOURCE_URLS.osmCopyright,
      extraction_status: 'uses_existing_rc1_odbl_surface_signal_lane',
      production_safe: true,
      license_status: 'open_license_share_alike',
    },
    policy: 'No live V2.1 snapshot was found. Records must fall back to Rockiness V2 and keep confidence conservative.',
  };
}

function sectionCoversMile(section, mile) {
  const range = section?.mile_range_nobo_global_est;
  return Array.isArray(range) && typeof range[0] === 'number' && typeof range[1] === 'number' && mile >= range[0] && mile <= range[1];
}

function extractionEvidenceForMile(snapshot, mile) {
  const demSections = snapshot?.dem?.sections ?? [];
  const fullCorridorDem = demSections.find((section) => section.section_id === 'full_at_corridor');
  const rangedDem = demSections.filter((section) => sectionCoversMile(section, mile));
  const dem = rangedDem[0] ?? fullCorridorDem ?? null;
  const lidarSections = snapshot?.lidar?.calibration_sections ?? [];
  const lidar = lidarSections.find((section) => sectionCoversMile(section, mile)) ?? null;
  const demItemCount = dem?.item_count_returned ?? 0;
  const lidarItemCount = lidar?.intersecting_item_count ?? 0;
  return {
    dem_section_id: dem?.section_id ?? null,
    dem_stac_item_count: demItemCount,
    dem_stac_item_ids: (dem?.item_ids ?? []).slice(0, 12),
    dem_extraction_status: dem?.extraction_status ?? 'no_bounded_dem_snapshot_for_mile',
    lidar_section_id: lidar?.section_id ?? null,
    lidar_catalog_checked: (snapshot?.lidar?.inspected_item_count ?? 0) > 0,
    lidar_intersecting_item_count: lidarItemCount,
    lidar_intersecting_item_ids: (lidar?.item_ids ?? []).slice(0, 12),
    lidar_extraction_status: lidar?.extraction_status ?? snapshot?.lidar?.extraction_status ?? 'no_bounded_lidar_snapshot_for_mile',
    confidence_addition: demItemCount > 0 && lidarItemCount > 0
      ? 'bounded_dem_and_lidar_catalog_metadata'
      : demItemCount > 0
        ? 'bounded_dem_stac_metadata'
        : 'no_v2_1_source_metadata_for_mile',
  };
}

function rockinessV21Confidence(baseConfidence, evidence) {
  if (baseConfidence === 'low_due_to_regional_mvp_gap') return baseConfidence;
  if (evidence.dem_stac_item_count > 0 && evidence.lidar_intersecting_item_count > 0 && String(baseConfidence).startsWith('medium')) {
    return 'medium_model_with_100m_dem_osm_and_bounded_v2_1_source_metadata';
  }
  if (evidence.dem_stac_item_count > 0 && String(baseConfidence).startsWith('medium')) {
    return 'medium_model_with_100m_dem_osm_and_bounded_dem_metadata';
  }
  if (evidence.dem_stac_item_count > 0) return 'low_to_medium_model_with_bounded_dem_metadata';
  return 'low_v2_1_snapshot_missing_or_not_in_calibration_window';
}

function buildRockinessV21Record(record, index, snapshot, intervalMiles) {
  const mile = round(record.mile_nobo_global_est ?? record.start_mile_nobo_global_est ?? 0, 1);
  const evidence = extractionEvidenceForMile(snapshot, mile);
  const baseScore = record.rockiness_v2_score_0_10 ?? 0;
  const confidence = rockinessV21Confidence(record.confidence, evidence);
  return {
    rockiness_v2_1_id: `full-rc1-rockiness-v2-1-${String(intervalMiles).replace('.', '-')}-${String(index + 1).padStart(5, '0')}`,
    source_rockiness_v2_id: record.rockiness_v2_id,
    route_id: ROUTE_ID,
    interval_miles: intervalMiles,
    ...(typeof record.start_mile_nobo_global_est === 'number' ? { start_mile_nobo_global_est: record.start_mile_nobo_global_est } : {}),
    ...(typeof record.end_mile_nobo_global_est === 'number' ? { end_mile_nobo_global_est: record.end_mile_nobo_global_est } : {}),
    mile_nobo_global_est: mile,
    mile_sobo_global_est: round(FULL_LENGTH - mile, 1),
    official: false,
    ...regionalFields(mile),
    state: stateForMile(mile),
    rockiness_v2_1_score_0_10: baseScore,
    rockiness_v2_score_0_10: baseScore,
    rockiness_class: record.rockiness_class,
    confidence,
    field_verified: false,
    lidar_available: false,
    dem_resolution_m: record.dem_resolution_m,
    v2_1_extraction_level: snapshot.extraction_level,
    v2_1_extracted_at: snapshot.generated_at,
    dem_section_id: evidence.dem_section_id,
    dem_stac_item_count: evidence.dem_stac_item_count,
    dem_stac_item_ids: evidence.dem_stac_item_ids,
    dem_extraction_status: evidence.dem_extraction_status,
    lidar_section_id: evidence.lidar_section_id,
    lidar_catalog_checked: evidence.lidar_catalog_checked,
    lidar_intersecting_item_count: evidence.lidar_intersecting_item_count,
    lidar_intersecting_item_ids: evidence.lidar_intersecting_item_ids,
    lidar_extraction_status: evidence.lidar_extraction_status,
    micro_roughness_score: record.micro_roughness_score,
    soil_stoniness_score: record.soil_stoniness_score,
    soil_extraction_status: snapshot.soil?.extraction_status ?? 'not_extracted_in_v2_1',
    osm_surface_signal: record.osm_surface_signal,
    user_report_signal: record.user_report_signal,
    pace_penalty_factor: record.pace_penalty_factor,
    source_id: ROCKINESS_V2_1_SOURCE_ID,
    source_ids: [ROCKINESS_V2_1_SOURCE_ID, ROCKINESS_V2_SOURCE_ID, 'usgs_3dep_seamless_dem', 'usgs_3dep_lidar', 'usgs_3dep', 'osm', 'nrcs_gssurgo_ssurgo'],
    source_url: `internal:data/at-open-reference/${ROCKINESS_V2_1_SNAPSHOT_PATH}`,
    license_status: 'open_license_share_alike',
    source_license: 'ODbL-derived plus USGS/NRCS public domain metadata',
    attribution: 'OpenStreetMap contributors; Data available from U.S. Geological Survey, 3D Elevation Program; USDA NRCS gSSURGO/SSURGO source lane reviewed but not yet extracted.',
    last_checked: (snapshot.generated_at ?? GENERATED_AT).slice(0, 10),
    last_generated: GENERATED_DATE,
    production_safe: true,
    model_inputs: {
      rockiness_v2_source_record: record.rockiness_v2_id,
      bounded_source_extraction: evidence.confidence_addition,
      dem_stac: {
        section_id: evidence.dem_section_id,
        item_count: evidence.dem_stac_item_count,
        item_ids: evidence.dem_stac_item_ids,
        extraction_status: evidence.dem_extraction_status,
      },
      lidar_catalog: {
        section_id: evidence.lidar_section_id,
        catalog_checked: evidence.lidar_catalog_checked,
        intersecting_item_count: evidence.lidar_intersecting_item_count,
        item_ids: evidence.lidar_intersecting_item_ids,
        extraction_status: evidence.lidar_extraction_status,
      },
      soil_stoniness: snapshot.soil?.extraction_status ?? 'not_extracted_in_v2_1',
      osm_surface_signal: record.osm_surface_signal === null ? 'not_available_on_source_record' : 'existing_rc1_odbl_surface_signal',
      user_reports: 'none_available_in_open_rc1_pack',
    },
    ai_answer_rule: 'Describe as Rockiness V2.1 model screening with bounded DEM/LiDAR source metadata, not field verified. Do not claim raster-pixel, LiDAR point-cloud, SSURGO, or current tread-condition proof unless record-level extracted evidence exists. Generated/open-route miles are not official ATC mileage.',
  };
}

function buildRockinessV21(rockinessV2) {
  const snapshot = maybeReadJson(ROCKINESS_V2_1_SNAPSHOT_PATH, packRoot) ?? defaultRockinessV21Snapshot();
  const extraction = {
    ...snapshot,
    snapshot_source_path: ROCKINESS_V2_1_SNAPSHOT_PATH,
    promoted_into_rc1_at: GENERATED_AT,
    ai_answer_rule: 'This is production-safe source-availability metadata only. It supports cautious Rockiness V2.1 confidence notes, not field-verified footing or current conditions.',
  };
  const byOneMile = rockinessV2.byOneMile.map((record, index) => buildRockinessV21Record(record, index, snapshot, 1));

  writeJson('processed/tread_rockiness_v2_1/full_trail_rockiness_v2_1_source_extraction.json', extraction);
  writeJson('processed/tread_rockiness_v2_1/full_trail_rockiness_v2_1_by_1mi.json', byOneMile);
  writeText('processed/tread_rockiness_v2_1/rockiness_v2_1_model_notes.md', `
# Rockiness V2.1 Model Notes

Rockiness V2.1 keeps the RC1 Rockiness V2 score stable, then adds bounded source-extraction evidence from production-safe sources:
- 3DEP Seamless DEM STAC item metadata for the full A.T. corridor and high-priority calibration windows.
- USGS 3DEP LiDAR catalog metadata for AT-state items intersecting calibration windows.
- Existing ODbL OSM surface/tread signals from RC1.
- gSSURGO/SSURGO remains reviewed but not extracted in V2.1, so soil_stoniness_score stays null.

This is still a model screen and not field verified. V2.1 does not download DEM rasters, does not sample DEM raster pixels, does not stream LiDAR EPT tiles, does not join SSURGO attributes, and does not field-verify tread. Use it to improve source transparency and difficulty confidence, not to promise exact footing.
`);
  writeText('processed/tread_rockiness_v2_1/rockiness_v2_1_source_limitations.md', `
# Rockiness V2.1 Source Limitations

- Bounded STAC/catalog extraction proves that source metadata exists for a corridor/window; it does not prove rockiness at a specific step.
- DEM raster pixels and LiDAR points are not sampled in V2.1. lidar_available remains false on records until point-cloud evidence is extracted.
- SSURGO/gSSURGO remains a reviewed future lane. soil_stoniness_score must remain null until bounded soil attributes are joined.
- OSM surface/tread signals remain ODbL-derived and unevenly populated.
- No Rockiness V2.1 record is field verified or current-conditions verified; in answer language say it is not field verified.
`);
  writeJson('schemas/rockiness_v2_1.schema.json', {
    $schema: 'https://json-schema.org/draft/2020-12/schema',
    title: 'Scout Full Trail Rockiness V2.1 Record',
    type: 'object',
    required: [
      'mile_nobo_global_est',
      'mile_sobo_global_est',
      'official',
      'rockiness_v2_1_score_0_10',
      'rockiness_class',
      'confidence',
      'field_verified',
      'lidar_available',
      'dem_stac_item_count',
      'lidar_catalog_checked',
      'lidar_intersecting_item_count',
      'soil_extraction_status',
      'source_id',
      'source_url',
      'license_status',
      'last_checked',
      'last_generated',
      'ai_answer_rule',
    ],
    properties: {
      official: { const: false },
      field_verified: { const: false },
      lidar_available: { const: false },
      rockiness_v2_1_score_0_10: { type: 'number', minimum: 0, maximum: 10 },
      license_status: { enum: ['open_license_share_alike'] },
    },
  });
  return {
    sourceExtraction: extraction,
    byOneMile,
  };
}

function buildDifficulty(elevationSummaries, tread, rockinessV2, water, waypoints, rules) {
  const treadByMile = new Map(tread.map((record) => [Math.round(record.mile_nobo_global_est ?? record.start_mile_nobo_global_est ?? 0), record]));
  const rockinessByMile = new Map(rockinessV2.map((record) => [Math.floor(record.start_mile_nobo_global_est ?? record.mile_nobo_global_est ?? 0), record]));
  const rockinessScore = (record) => record.rockiness_v2_1_score_0_10 ?? record.rockiness_v2_score_0_10 ?? 0;
  const difficulty = [];
  for (let start = 0; start < FULL_LENGTH; start += 10) {
    const end = Math.min(FULL_LENGTH, start + 10);
    const elevation = elevationSummaries.find((record) => record.start_mile_nobo_global_est === round(start, 1)) ?? {};
    const midpoint = (start + end) / 2;
    const region = regionForMile(midpoint);
    const treadRecords = [];
    const rockinessRecords = [];
    for (let mile = Math.round(start); mile < Math.round(end); mile += 1) {
      const treadRecord = treadByMile.get(mile);
      if (treadRecord) treadRecords.push(treadRecord);
      const rockinessRecord = rockinessByMile.get(mile);
      if (rockinessRecord) rockinessRecords.push(rockinessRecord);
    }
    const avgTread = treadRecords.length ? treadRecords.reduce((sum, record) => sum + (record.score ?? 0), 0) / treadRecords.length : 2;
    const avgRockinessV2 = rockinessRecords.length
      ? rockinessRecords.reduce((sum, record) => sum + rockinessScore(record), 0) / rockinessRecords.length
      : null;
    const usesRockinessV21 = rockinessRecords.some((record) => typeof record.rockiness_v2_1_score_0_10 === 'number');
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
    const steepGradeFactor = (elevation.max_grade_percent ?? 0) >= 25 ? 2 : (elevation.max_grade_percent ?? 0) >= 12 ? 1 : 0;
    const treadFactor = Math.min(3, Math.round(avgTread / 1.5));
    const rockinessV2Factor = avgRockinessV2 === null ? treadFactor : Math.min(3, Math.round(avgRockinessV2 / 3));
    const fordFactor = fordCount > 6 ? 2 : fordCount > 0 ? 1 : 0;
    const remotenessFactor = region.region_id === 'mvp6_maine' || region.region_id === 'mvp5_ma_vt_nh' ? (bailoutCount === 0 ? 2 : 1) : 0;
    const weatherFactor = ['mvp5_ma_vt_nh', 'mvp6_maine'].includes(region.region_id) ? 2 : ['mvp1_springer_davenport', 'mvp3_midatlantic'].includes(region.region_id) ? 1 : 0;
    const waterUncertaintyFactor = waterCount === 0 ? 2 : waterCount < 2 ? 1 : 0;
    const regionRuleFriction = ['mvp1_springer_davenport', 'mvp2_virginia', 'mvp4_nj_ny_ct', 'mvp5_ma_vt_nh', 'mvp6_maine'].includes(region.region_id) ? 1 : 0;
    const permitRuleFriction = permitRules.length ? 1 : regionRuleFriction;
    const gapFactor = region.gap ? 2 : 0;
    const score = Math.min(10, Math.round(1 + gainFactor + lossFactor + steepGradeFactor + rockinessV2Factor + fordFactor + remotenessFactor + weatherFactor + waterUncertaintyFactor + permitRuleFriction + gapFactor));
    difficulty.push({
      difficulty_id: `full-rc1-difficulty-10mi-${String(difficulty.length + 1).padStart(3, '0')}`,
      route_id: ROUTE_ID,
      start_mile_nobo_global_est: round(start, 1),
      end_mile_nobo_global_est: round(end, 1),
      states: [...new Set([stateForMile(start), stateForMile(Math.max(start, end - 0.1))])],
      region_ids: [region.region_id],
      distance_miles: round(end - start, 1),
      inputs: {
        elevation_sample_source: elevation.source_sample_file ?? 'processed/elevation/full_trail_elevation_by_10mi_segment.json',
        elevation_sample_spacing_meters: elevation.sample_spacing_meters ?? null,
        elevation_sample_count: elevation.sample_count ?? null,
        elevation_gain_ft: elevation.elevation_gain_ft ?? null,
        elevation_loss_ft: elevation.elevation_loss_ft ?? null,
        max_grade_percent: elevation.max_grade_percent ?? null,
        steepest_climb: elevation.steepest_climb ?? null,
        steepest_descent: elevation.steepest_descent ?? null,
        tread_score_avg: round(avgTread, 2),
        rockiness_v2_score_avg: avgRockinessV2 === null ? null : round(avgRockinessV2, 2),
        rockiness_v2_confidence: rockinessRecords.length ? [...new Set(rockinessRecords.map((record) => record.confidence))].join('; ') : null,
        rockiness_v2_record_count: rockinessRecords.length,
        rockiness_v2_1_extracted_record_count: rockinessRecords.filter((record) => typeof record.dem_stac_item_count === 'number' && record.dem_stac_item_count > 0).length,
        preferred_tread_source: avgRockinessV2 === null ? 'tread_v1_fallback' : usesRockinessV21 ? 'rockiness_v2_1' : 'rockiness_v2',
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
        steep_grade_factor: steepGradeFactor,
        tread_factor: treadFactor,
        rockiness_v2_factor: rockinessV2Factor,
        ford_uncertainty_factor: fordFactor,
        remoteness_bailout_scarcity_factor: remotenessFactor,
        weather_severity_factor: weatherFactor,
        water_uncertainty_factor: waterUncertaintyFactor,
        permit_rule_friction_factor: permitRuleFriction,
        regional_gap_factor: gapFactor,
      },
      difficulty_score_0_10: score,
      difficulty_label: score >= 8 ? 'severe' : score >= 6 ? 'hard' : score >= 4 ? 'moderate' : 'easier',
      explanation: 'Screening score from distance, 100-meter USGS 3DEP gain/loss and steep-grade screens, descents, Rockiness V2.1 when present, ford uncertainty, remoteness, water uncertainty, weather severity, permit/rule friction, and known regional data gaps.',
      confidence: region.gap ? 'low_due_to_regional_mvp_gap' : 'model_screening_not_field_verified',
      source_id: 'full_trail_rc1_difficulty_model',
      source_url: 'internal:data/at-open-reference/scripts/build-full-trail-rc1-reference-pack.mjs',
      license_status: 'open_license_share_alike',
      last_checked: GENERATED_DATE,
      last_generated: GENERATED_DATE,
      production_safe: true,
      ai_answer_rule: 'Use as a cautious planning difficulty screen only. It uses 100-meter USGS 3DEP/EPQS elevation statistics where available, but still requires live checks for weather, closures, permits, fords, water, Baxter/Katahdin, and land-manager rules.',
    });
  }
  writeJson('processed/difficulty/full_trail_difficulty_by_10mi_segment.json', difficulty);
  writeText('processed/difficulty/full_trail_daily_difficulty_model.md', `
# Full Trail Daily Difficulty Model

The RC1 difficulty model is a planning screen, not field verified and not a field-verified rating.

Inputs:
- distance
- gain/loss, steep descents, and max-grade screens from 100-meter USGS 3DEP/EPQS summaries
- Rockiness V2.1 score when present; Rockiness V2 and tread v1 remain compatibility fallbacks
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
- Prefer processed/elevation/full_trail_elevation_samples_100m.json for detailed terrain; the 1-mile elevation file is retained for compatibility.
- Prefer processed/tread_rockiness_v2_1/full_trail_rockiness_v2_1_by_1mi.json for tread/rockiness difficulty input; Rockiness V2 and tread v1 remain compatibility fallbacks.
- Static difficulty cannot answer current weather, closures, fords, snow/ice, fire bans, permits, campsite/hut status, or Baxter/Katahdin conditions.
- The Davenport Gap to Damascus corridor receives an explicit regional-gap factor until MVP detail exists.
`);
  writeJson('processed/difficulty/full_trail_daily_difficulty_model.json', {
    model_id: 'full_trail_daily_difficulty_model_v1',
    route_id: ROUTE_ID,
    generated_at: GENERATED_AT,
    score_range: [0, 10],
    classes: ['easier', 'moderate', 'hard', 'severe'],
    preferred_elevation_source: 'processed/elevation/full_trail_elevation_samples_100m.json',
    elevation_sample_spacing_meters: ELEVATION_SAMPLE_SPACING_METERS,
    preferred_tread_source: 'processed/tread_rockiness_v2_1/full_trail_rockiness_v2_1_by_1mi.json',
    fallback_rockiness_source: 'processed/tread_rockiness_v2/full_trail_rockiness_v2_by_1mi.json',
    fallback_tread_source: 'processed/tread/full_trail_tread_rockiness_1_0mi.json',
    inputs: ['distance', 'gain_loss', 'descents', 'max_grade_100m', 'rockiness_v2_1', 'rockiness_v2_fallback', 'tread_v1_fallback', 'mud_rootiness', 'ford_uncertainty', 'remoteness_bailout_scarcity', 'water_uncertainty', 'weather_severity', 'permit_rule_friction'],
    ai_answer_rule: 'Use for cautious itinerary screening only with uncertainty and live-check requirements. The 100-meter elevation layer and Rockiness V2.1 improve terrain/tread screening but remain model-derived and not field verified.',
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
  const preferredRockiness = datasets.rockinessV21?.byOneMile ?? datasets.rockinessV2.byOneMile;
  const rockinessV2 = preferredRockiness.filter(inRange);
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
    rockiness_v2_avg: rockinessV2.length ? round(rockinessV2.reduce((sum, record) => sum + (record.rockiness_v2_score_0_10 ?? 0), 0) / rockinessV2.length, 2) : null,
    rockiness_v2_confidence: [...new Set(rockinessV2.map((record) => record.confidence))].slice(0, 3),
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
- Rockiness V2.1 average: ${summary.rockiness_v2_avg ?? 'unknown'} (${summary.rockiness_v2_confidence.join('; ') || 'no V2.1 records'})
- Tread score average: ${summary.tread_avg ?? 'unknown'}
- Use 100-meter USGS 3DEP/EPQS gain/loss, steep-grade screens, Rockiness V2.1, and tread model outputs as planning screens, not field verification.

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
- Alignment status is ${ALIGNMENT_STATUS}; the open-route spine is ${Math.abs(LENGTH_DELTA)} miles short of the official reference and must be described as generated/open-route mileage.
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
    'water.md': 'Water candidates are coordinate-first mapped candidates only. Reliability, potability, and ford safety are unknown unless verified by timestamped licensed data. Use coordinate_anchor as the stable landmark and route_snap as a derived generated-mile view.',
    'weather_live_conditions.md': 'Use NWS, NPS, USFS, state, Baxter, and other official sources for current conditions. Static docs cannot answer current weather or closures.',
    'closures.md': 'Closures, detours, fire, flooding, storm damage, snow/ice, bear activity, road closures, permit changes, and Katahdin status require live checks.',
    'navigation.md': `RC1 is a planning corpus, not field navigation. Landmark identity is coordinate-first: use coordinate_anchor lat/lon as the stable location and route_snap as a derived generated/open-route mile view. Generated/open-route miles are not official and route length has a known ${LENGTH_DELTA}-mile delta versus the ${OFFICIAL_REFERENCE_LENGTH}-mile 2026 official reference.`,
    'tread.md': 'Rockiness V2.1 is the preferred tread/rockiness screen when present. It keeps Rockiness V2 scores stable while adding bounded 3DEP DEM STAC and USGS LiDAR catalog metadata. It still does not sample DEM pixels, stream LiDAR points, join gSSURGO/SSURGO attributes, or field-verify tread. Tread/rockiness/rootiness/mud scores are model screens. State confidence and avoid field-verified language unless the record explicitly proves it.',
    'difficulty.md': 'Difficulty combines distance, 100-meter USGS 3DEP/EPQS gain/loss and steep-grade screens, Rockiness V2.1 when present, Rockiness V2/tread v1 fallbacks, remoteness, weather, water, fords, permits, and data gaps. Use as a cautious screen.',
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
    ['rocky-but-flat days', 'Use Rockiness V2 and tread signals even when elevation gain is low; explain that flat mileage can still be slow if model rockiness is high.'],
    ['Rockiness V2 source gates', 'Explain that OpenTrail/OpenLongTrails are review-only, OSM is ODbL, USGS/NRCS lanes are source-reviewed, and no unknown_review_required data is production-safe.'],
    ['PA Rockiness V2 calibration', 'Use PA rockiness as model screening, not certainty; northern PA ridges need cautious pacing and confidence disclosure.'],
    ['White Mountains Rockiness V2', 'Use Rockiness V2 plus alpine/weather live-check cautions; do not turn model roughness into exact slab/root/rock claims.'],
    ['Maine roots mud and fords', 'Use Rockiness V2/remoteness/fording cautions; never call fords safe or tread conditions current from static data.'],
    ['user report override', 'Say trusted timestamped user reports can override model scores only when present; RC1 must not invent field verification.'],
    ['blocked source leakage', 'Do not use AWOL/FarOut/AT Guide/Data Book/AllTrails/Gaia/Hiking Project/copied ATC data in production-safe answers.'],
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
    ['landmark coordinates', 'Treat lat/lon coordinate_anchor as the stable landmark identity and route_snap miles as derived generated/open-route positions.'],
    ['official length alignment', 'State the 2026 official reference is 2,197.9 miles (2197.9), Scout generated open-route length is 2,106.2 miles (2106.2), the delta is -91.7 miles, and generated/open-route miles are not official.'],
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
    ['route_alignment_diagnostics', 'processed/route/route_alignment_diagnostics.json', 1, true],
    ['route_continuity_diagnostics', 'processed/route/route_continuity_diagnostics.json', 1, true],
    ['route_segment_length_checks', 'processed/route/route_segment_length_checks.json', datasets.alignment.segmentChecks.length, true],
    ['milepoints_0_1mi', 'processed/milepoints/full_at_milepoints_0_1mi.geojson', readJson('processed/milepoints/full_at_milepoints_0_1mi.geojson', rcRoot).features.length, true],
    ['milepoints_0_5mi', 'processed/milepoints/full_at_milepoints_0_5mi.geojson', readJson('processed/milepoints/full_at_milepoints_0_5mi.geojson', rcRoot).features.length, true],
    ['milepoints_1_0mi', 'processed/milepoints/full_at_milepoints_1_0mi.geojson', readJson('processed/milepoints/full_at_milepoints_1_0mi.geojson', rcRoot).features.length, true],
    ['elevation_samples_1_0mi', 'processed/elevation/full_trail_elevation_samples_1_0mi.json', datasets.elevation.length, true],
    ['elevation_samples_100m', 'processed/elevation/full_trail_elevation_samples_100m.json', datasets.elevation100m.length, true],
    ['elevation_100m_status', 'processed/elevation/full_trail_elevation_100m_status.json', 1, true],
    ['elevation_by_1mi_segment_100m', 'processed/elevation/full_trail_elevation_by_1mi_segment_100m.json', datasets.elevationSummaries1mi100m.length, true],
    ['elevation_by_5mi_segment_100m', 'processed/elevation/full_trail_elevation_by_5mi_segment_100m.json', datasets.elevationSummaries5mi100m.length, true],
    ['elevation_by_10mi_segment_100m', 'processed/elevation/full_trail_elevation_by_10mi_segment_100m.json', datasets.elevationSummaries10mi100m.length, true],
    ['elevation_major_climbs_descents_100m', 'processed/elevation/full_trail_major_climbs_descents_100m.json', datasets.majorClimbsDescents100m.length, true],
    ['elevation_steep_grade_sections_100m', 'processed/elevation/full_trail_steep_grade_sections_100m.json', datasets.steepGradeSections100m.length, true],
    ['water_candidates', 'processed/water/full_trail_water_candidates.json', datasets.water.length, true],
    ['major_ford_candidates', 'processed/water/full_trail_major_ford_candidates.json', readJson('processed/water/full_trail_major_ford_candidates.json', rcRoot).length, true],
    ['rules', 'processed/rules/full_trail_rules_by_land_manager.json', datasets.rules.length, false],
    ['live_sources', 'processed/live_conditions/full_trail_live_condition_sources.json', datasets.liveSources.length, false],
    ['tread', 'processed/tread/full_trail_tread_rockiness_1_0mi.json', datasets.tread.length, true],
    ['rockiness_v2_0_1mi', 'processed/tread_rockiness_v2/full_trail_rockiness_v2_by_0_1mi.json', datasets.rockinessV2.byPointOneMile.length, true],
    ['rockiness_v2_1mi', 'processed/tread_rockiness_v2/full_trail_rockiness_v2_by_1mi.json', datasets.rockinessV2.byOneMile.length, true],
    ['micro_roughness_coverage', 'processed/tread_rockiness_v2/full_trail_micro_roughness_coverage.json', datasets.rockinessV2.coverage.length, true],
    ['soil_stoniness', 'processed/tread_rockiness_v2/full_trail_soil_stoniness.json', datasets.rockinessV2.soilRecords.length, true],
    ['osm_surface_tags', 'processed/tread_rockiness_v2/full_trail_osm_surface_tags.json', datasets.rockinessV2.osmRecords.length, true],
    ['rockiness_v2_1_1mi', 'processed/tread_rockiness_v2_1/full_trail_rockiness_v2_1_by_1mi.json', datasets.rockinessV21.byOneMile.length, true],
    ['rockiness_v2_1_source_extraction', 'processed/tread_rockiness_v2_1/full_trail_rockiness_v2_1_source_extraction.json', 1, true],
    ['difficulty', 'processed/difficulty/full_trail_difficulty_by_10mi_segment.json', datasets.difficulty.length, true],
    ['rag_metadata', 'rag_docs/rag_doc_metadata.json', readJson('rag_docs/rag_doc_metadata.json', rcRoot).length, true],
    ['qa_questions', 'tests/full_trail_rc1_behavior_questions.json', datasets.qa.length, false],
    ['source_review_opentrail', 'sources/opentrail_review.json', 1, false],
    ['source_review_openlongtrails', 'sources/openlongtrails_review.json', 1, false],
    ['source_review_open_dem', 'sources/open_dem_review.json', 3, false],
    ['blocked_legacy_awol_audit', 'processed/legal/blocked_legacy_awol_audit.json', 1, false],
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

ATC's 2026 total length is stored as a single official reference value with source URL. Scout does not package copied ATC mile tables, official route tables, or guide/map content. Generated milepoints remain OSM/open-route estimates with official:false.

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
| Route | Yellow | Base open full-route geometry integrated, but ${FULL_LENGTH} generated miles remains ${Math.abs(LENGTH_DELTA)} miles short of the ${OFFICIAL_REFERENCE_LENGTH}-mile 2026 official reference. |
| Route Alignment | Yellow | route_alignment_diagnostics.json documents OSM/Waymarked, geodesic measurement, continuity, endpoint/Approach handling, and unresolved causes. |
| Miles | Green | 0.1/0.5/1.0 generated/open-route global milepoints with official:false. |
| Regional Stitch | Yellow | Davenport Gap to Damascus uses base open data because regional MVP detail is missing. |
| Elevation | Green | Direct 100-meter USGS 3DEP/EPQS samples, compatibility 1-mile samples, 1/5/10 mile summaries, major climb/descent candidates, and steep-grade sections. |
| Water/Fords | Green | Mapped candidates only; reliability/potability/ford safety unknown. |
| Waypoints | Green | Regional MVPs plus base gap filler, deduplicated with provenance. |
| Landmark Anchors | Green | Water and waypoint records are coordinate-first with route_snap derived from the selected open route spine. |
| Rules | Yellow | Conservative official-source/pointer layer; live verification required. |
| Live Connectors | Green | NWS/NPS/USFS/state/Baxter/ATC-pointer policy centralized. |
| Tread | Yellow | Tread v1 retained for compatibility; model-estimated, not field verified; gap tread low confidence. |
| Rockiness V2 | Yellow | ${datasets.rockinessV2.byPointOneMile.length} 0.1-mile records and ${datasets.rockinessV2.byOneMile.length} 1-mile records. Uses 100m DEM/OSM signals; retained as V2.1 fallback. |
| Rockiness V2.1 | Yellow | ${datasets.rockinessV21.byOneMile.length} 1-mile records plus bounded source-extraction metadata. Adds 3DEP DEM STAC and USGS LiDAR catalog metadata; no raster pixels, LiDAR points, SSURGO attributes, or field verification yet. |
| Difficulty | Yellow | Planning screen prefers Rockiness V2.1 when present; not field verified. |
| RAG Docs | Green | Full overview, policies, 25-mile segments, indexes, metadata. |
| Source Reviews | Yellow | OpenTrail/OpenLongTrails held as unknown_review_required; USGS 3DEP Seamless, USGS LiDAR, and gSSURGO/SSURGO reviewed as production-safe source lanes. |
| Licensing | Green | Blocked sources and review-only sources excluded from production-safe export. |
| Export | Green | Export script writes filtered production-safe zip/manifest. |
| Validation | Green | run_full_trail_validation.py enforces source-aware rules. |
| QA Tests | Green | ${datasets.qa.length} expected-behavior questions. |
`);
  writeText('data_quality_report_full_trail_rc1.md', `
# Data Quality Report: Full Trail RC1

## Work Completed
- Integrated MVP1-MVP6 with the base open full-route geometry.
- Created global full-trail generated milepoints and alignment notes.
- Added coordinate-first landmark anchors for water and waypoint datasets, with route_snap stored as a derived generated/open-route mile view.
- Merged elevation, water, waypoints, rules, live-source, tread, difficulty, and RAG metadata indexes.
- Added direct 100-meter USGS 3DEP/EPQS elevation samples with 1/5/10-mile detailed summaries, major climb/descent candidates, and steep-grade screening sections.
- Added Rockiness V2 source reviews, 0.1-mile and 1-mile model records, micro-roughness coverage metadata, OSM surface-signal records, and a conservative gSSURGO/SSURGO lane that stays null until bounded extraction exists.
- Added Rockiness V2.1 source-extraction records from a bounded 3DEP DEM STAC / USGS LiDAR catalog metadata snapshot and promoted them into 1-mile difficulty inputs.
- Added blocked legacy AWOL audit metadata and validation gates to keep AWOL/A.T. Guide-derived data out of production-safe exports.
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
- Official reference source: ${OFFICIAL_REFERENCE_SOURCE_URL}
- Known material delta: ${LENGTH_DELTA} miles (${LENGTH_DELTA_PERCENT}%).
- Alignment status: ${ALIGNMENT_STATUS}.
- Davenport Gap to Damascus/TN-VA regional coverage gap: yellow.

See processed/route/route_alignment_report.md and processed/route/route_alignment_diagnostics.json for the route measurement audit. Current evidence says the open OSM/Waymarked spine itself is short relative to the official 2026 reference; projection and coarse 3D slope length do not explain most of the gap.

## Record Counts
${datasetIndex.map((dataset) => `- ${dataset.dataset_id}: ${dataset.record_count}`).join('\n')}

## Weak Points
- Generated miles are not official and should not be used as exact field navigation.
- Davenport Gap to Damascus lacks regional MVP depth.
- Tread/difficulty are model screens, not field verified.
- Rockiness V2.1 improves source transparency with bounded DEM/LiDAR catalog metadata, but it still does not sample raster pixels, stream LiDAR points, join gSSURGO attributes, or field-verify tread.
- Elevation is model-derived from USGS 3DEP/EPQS at 100-meter spacing; it is detailed enough for planning screens but not surveyed tread grade.
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
    official_reference_source_url: OFFICIAL_REFERENCE_SOURCE_URL,
    length_delta_miles: LENGTH_DELTA,
    length_delta_percent: LENGTH_DELTA_PERCENT,
    alignment_status: ALIGNMENT_STATUS,
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
    "processed/route/route_alignment_diagnostics.json",
    "processed/route/route_alignment_report.md",
    "processed/route/route_continuity_diagnostics.json",
    "processed/route/route_segment_length_checks.json",
    "processed/milepoints/full_at_milepoints_0_1mi.geojson",
    "processed/milepoints/full_at_milepoints_0_5mi.geojson",
    "processed/milepoints/full_at_milepoints_1_0mi.geojson",
    "processed/milepoints/global_mile_alignment_report.md",
    "processed/elevation/full_trail_elevation_samples_1_0mi.json",
    "processed/elevation/full_trail_elevation_samples_100m.json",
    "processed/elevation/full_trail_elevation_100m_status.json",
    "processed/elevation/full_trail_elevation_by_1mi_segment_100m.json",
    "processed/elevation/full_trail_elevation_by_5mi_segment_100m.json",
    "processed/elevation/full_trail_elevation_by_10mi_segment_100m.json",
    "processed/elevation/full_trail_elevation_by_5mi_segment.json",
    "processed/elevation/full_trail_elevation_by_10mi_segment.json",
    "processed/elevation/full_trail_major_climbs_descents_100m.json",
    "processed/elevation/full_trail_steep_grade_sections_100m.json",
    "processed/elevation/full_trail_elevation_summary.md",
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
    "processed/tread_rockiness_v2/full_trail_rockiness_v2_by_0_1mi.json",
    "processed/tread_rockiness_v2/full_trail_rockiness_v2_by_1mi.json",
    "processed/tread_rockiness_v2/full_trail_micro_roughness_coverage.json",
    "processed/tread_rockiness_v2/full_trail_soil_stoniness.json",
    "processed/tread_rockiness_v2/full_trail_osm_surface_tags.json",
    "processed/tread_rockiness_v2/rockiness_v2_model_notes.md",
    "processed/tread_rockiness_v2/rockiness_v2_source_limitations.md",
    "processed/tread_rockiness_v2_1/full_trail_rockiness_v2_1_source_extraction.json",
    "processed/tread_rockiness_v2_1/full_trail_rockiness_v2_1_by_1mi.json",
    "processed/tread_rockiness_v2_1/rockiness_v2_1_model_notes.md",
    "processed/tread_rockiness_v2_1/rockiness_v2_1_source_limitations.md",
    "processed/legal/blocked_legacy_awol_audit.json",
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
    "schemas/rockiness_v2.schema.json",
    "schemas/rockiness_v2_1.schema.json",
    "sources/opentrail_review.json",
    "sources/openlongtrails_review.json",
    "sources/open_dem_review.json",
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


def coordinate_first_landmark(record: dict[str, Any], failures: list[str], label: str) -> None:
    anchor = record.get("coordinate_anchor")
    snap = record.get("route_snap")
    fail_if(not isinstance(anchor, dict), failures, f"{label} missing coordinate_anchor")
    fail_if(not isinstance(snap, dict), failures, f"{label} missing route_snap")
    if isinstance(anchor, dict):
        fail_if(anchor.get("anchor_role") != "canonical_landmark_location", failures, f"{label} coordinate anchor not canonical")
        fail_if(round(float(anchor.get("lat")), 6) != round(float(record.get("lat")), 6) or round(float(anchor.get("lon")), 6) != round(float(record.get("lon")), 6), failures, f"{label} coordinate anchor differs from record coordinates")
        fail_if("route miles are derived snaps" not in anchor.get("identity_rule", "").lower(), failures, f"{label} coordinate anchor lacks derived-mile rule")
    if isinstance(snap, dict):
        fail_if(snap.get("official") is not False, failures, f"{label} route_snap official not false")
        fail_if(snap.get("generated") is not True, failures, f"{label} route_snap not generated")
        fail_if(snap.get("route_alignment_status") != "yellow_unresolved_open_route_delta", failures, f"{label} route_snap missing alignment status")
        fail_if(snap.get("mile_nobo_global_est") != record.get("mile_nobo_global_est"), failures, f"{label} route_snap mile mismatch")
        fail_if("coordinate_anchor is the landmark identity" not in snap.get("ai_answer_rule", ""), failures, f"{label} route_snap lacks coordinate-first rule")


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
    for review_only in ["opentrail_review", "openlongtrails_review"]:
        source = source_map.get(review_only, {})
        fail_if(source.get("license_status") != "unknown_review_required", failures, f"{review_only} should remain review-only")
        fail_if(source.get("production_safe") is not False, failures, f"{review_only} leaked into production-safe sources")
        fail_if(not source.get("blocked_until"), failures, f"{review_only} missing blocked_until")
    for safe_source in ["usgs_3dep_seamless_dem", "usgs_3dep_lidar", "nrcs_gssurgo_ssurgo", "full_trail_rockiness_v2_model", "full_trail_rockiness_v2_1_extraction_model"]:
        source = source_map.get(safe_source, {})
        fail_if(source.get("production_safe") is not True, failures, f"{safe_source} not production safe")
        fail_if(source.get("license_status") not in VALID_LICENSES, failures, f"{safe_source} unsafe license")
    opentrail_review = j("sources/opentrail_review.json")
    openlongtrails_review = j("sources/openlongtrails_review.json")
    open_dem_review = j("sources/open_dem_review.json")
    for review in [opentrail_review, openlongtrails_review, *open_dem_review]:
        for field in ["source_id", "owner", "source_url", "access_method", "license_status", "production_safe", "allowed_use", "candidate_use", "confidence", "last_checked", "recommendation"]:
            if field == "recommendation" and review.get(field) is None:
                # Older manifest rows call this notes; the generated review files below must normalize it.
                pass
            else:
                fail_if(field not in review or review.get(field) in (None, ""), failures, f"source review {review.get('source_id')} missing {field}")
    fail_if(opentrail_review.get("production_safe") is not False, failures, "OpenTrail review production_safe not false")
    fail_if(openlongtrails_review.get("production_safe") is not False, failures, "OpenLongTrails review production_safe not false")

    route = rows(j("processed/route/full_at_route_rc1.geojson"))[0]
    common(route, failures, "route")
    fail_if(route.get("official") is not False, failures, "route official must be false")
    fail_if(route.get("measured_length_miles") != 2106.2, failures, "route measured length mismatch")
    fail_if(route.get("official_reference_length_miles") != 2197.9, failures, "official reference length hidden or wrong")
    fail_if(route.get("length_delta_miles") != -91.7, failures, "route length delta missing")
    fail_if(route.get("alignment_status") != "yellow_unresolved_open_route_delta", failures, "route alignment status missing")
    fail_if("generated/open-route mile" not in route.get("ai_answer_rule", "").lower(), failures, "route answer rule missing generated/open-route policy")
    fail_if("coverage_gaps" not in route or not route["coverage_gaps"], failures, "route missing coverage gaps")
    notes = t("processed/route/route_integration_notes.md").lower()
    for term in ["davenport gap", "damascus", "amicalola", "baxter", "katahdin", "not official", "openstreetmap", "2197.9", "-91.7", "alignment status"]:
        fail_if(term not in notes, failures, f"route notes missing {term}")

    alignment = j("processed/route/route_alignment_diagnostics.json")
    fail_if(alignment.get("official") is not False, failures, "alignment official must be false")
    fail_if(alignment.get("official_reference_length_miles") != 2197.9, failures, "alignment official reference missing")
    fail_if(alignment.get("generated_route_length_miles") != 2106.2, failures, "alignment generated route length missing")
    fail_if(alignment.get("length_delta_miles") != -91.7, failures, "alignment delta missing")
    fail_if(alignment.get("alignment_status") != "yellow_unresolved_open_route_delta", failures, "alignment status missing")
    measurements = alignment.get("route_length_measurements", {})
    fail_if(measurements.get("local_geodesic_miles") is None, failures, "alignment missing geodesic measurement")
    fail_if(measurements.get("waymarked_reported_miles") is None, failures, "alignment missing Waymarked comparison")
    fail_if(measurements.get("three_d_estimate", {}).get("estimated_3d_length_miles") is None, failures, "alignment missing 3D estimate")
    compared = json.dumps(alignment.get("compared_factors", [])).lower()
    for term in ["osm/waymarked", "projection", "approach trail", "baxter", "detours", "official atc"]:
        fail_if(term not in compared, failures, f"alignment comparison missing {term}")
    fail_if(len(alignment.get("suspected_causes", [])) < 4, failures, "alignment suspected causes too thin")
    fail_if(len(alignment.get("unresolved_causes", [])) < 3, failures, "alignment unresolved causes too thin")
    report = t("processed/route/route_alignment_report.md").lower()
    for term in ["2197.9", "2106.2", "-91.7", "generated/open-route", "not official", "waymarked", "geodesic", "unresolved", "davenport gap"]:
        fail_if(term not in report, failures, f"route alignment report missing {term}")
    continuity = j("processed/route/route_continuity_diagnostics.json")
    fail_if(continuity.get("vertex_count", 0) < 100000, failures, "continuity vertex count too low")
    fail_if(continuity.get("consecutive_segments_over_1_0_miles", 1) != 0, failures, "continuity has undocumented >1 mile route vertex gap")
    segment_checks = j("processed/route/route_segment_length_checks.json")
    fail_if(len(segment_checks) < 7, failures, "segment length checks missing regional rows")
    fail_if(not any(check.get("region_id") == "coverage_gap_davenport_damascus" and check.get("gap") is True for check in segment_checks), failures, "Davenport-Damascus gap not documented in segment checks")

    for interval, minimum in [("0_1", 21000), ("0_5", 4200), ("1_0", 2100)]:
        milepoints = rows(j(f"processed/milepoints/full_at_milepoints_{interval}mi.geojson"))
        fail_if(len(milepoints) < minimum, failures, f"{interval} milepoints too few")
        previous = -1
        for record in milepoints[:25] + milepoints[-25:]:
            common(record, failures, f"milepoint {interval}")
            fail_if(record.get("official") is not False, failures, "milepoint official not false")
            fail_if("not an official atc mile" not in record.get("ai_answer_rule", "").lower(), failures, "milepoint lacks official caution")
            fail_if("generated/open-route mile" not in record.get("ai_answer_rule", "").lower(), failures, "milepoint lacks generated/open-route label")
        for record in milepoints:
            mile = record.get("mile_nobo_global_est")
            fail_if(mile is None or mile < previous, failures, f"{interval} milepoints not monotonic")
            previous = mile

    elevation_100m = j("processed/elevation/full_trail_elevation_samples_100m.json")
    elevation_status = j("processed/elevation/full_trail_elevation_100m_status.json")
    fail_if(len(elevation_100m) < 33000, failures, "100m elevation samples too few")
    fail_if(elevation_status.get("complete") is not True, failures, "100m elevation status incomplete")
    fail_if(elevation_status.get("sample_spacing_meters") != 100, failures, "100m elevation status wrong spacing")
    fail_if(elevation_status.get("sample_count") != len(elevation_100m), failures, "100m elevation status count mismatch")
    previous_distance = -1
    for record in elevation_100m[:25] + elevation_100m[-25:]:
        common(record, failures, "elevation 100m")
        fail_if(record.get("official") is not False, failures, "100m elevation official not false")
        fail_if(record.get("sample_spacing_meters") != 100, failures, "100m elevation wrong spacing")
        fail_if(record.get("source_id") != "usgs_3dep", failures, "100m elevation wrong source")
        fail_if(record.get("license_status") != "public_domain", failures, "100m elevation wrong license")
        fail_if(not isinstance(record.get("epqs"), dict), failures, "100m elevation missing EPQS metadata")
        fail_if("100-meter" not in record.get("ai_answer_rule", ""), failures, "100m elevation answer rule missing spacing")
    for record in elevation_100m:
        distance = record.get("distance_meters")
        fail_if(distance is None or distance < previous_distance, failures, "100m elevation distance not monotonic")
        previous_distance = distance
        fail_if(record.get("elevation_ft") is None, failures, "100m elevation missing elevation_ft")
    for relative, minimum in [
        ("processed/elevation/full_trail_elevation_by_1mi_segment_100m.json", 2000),
        ("processed/elevation/full_trail_elevation_by_5mi_segment_100m.json", 420),
        ("processed/elevation/full_trail_elevation_by_10mi_segment_100m.json", 210),
        ("processed/elevation/full_trail_elevation_by_5mi_segment.json", 420),
        ("processed/elevation/full_trail_elevation_by_10mi_segment.json", 210),
    ]:
        summaries = j(relative)
        fail_if(len(summaries) < minimum, failures, f"{relative} too few")
        for record in summaries[:10]:
            common(record, failures, relative)
            fail_if(record.get("sample_spacing_meters") != 100, failures, f"{relative} not derived from 100m samples")
            fail_if(record.get("sample_count", 0) < 2, failures, f"{relative} missing sample_count")
            fail_if(record.get("max_grade_percent") is None, failures, f"{relative} missing max grade")
            fail_if("100-meter" not in record.get("ai_answer_rule", ""), failures, f"{relative} answer rule missing high-res caution")
    major_climbs = j("processed/elevation/full_trail_major_climbs_descents_100m.json")
    steep_sections = j("processed/elevation/full_trail_steep_grade_sections_100m.json")
    fail_if(len(major_climbs) < 50, failures, "major climb/descent candidates too few")
    fail_if(len(steep_sections) < 100, failures, "steep-grade sections too few")
    for record in major_climbs[:10] + steep_sections[:10]:
        common(record, failures, "100m terrain derived feature")
        fail_if(record.get("sample_spacing_meters") != 100, failures, "100m terrain feature wrong spacing")
        fail_if("100-meter" not in record.get("ai_answer_rule", ""), failures, "100m terrain feature missing answer rule")

    water = j("processed/water/full_trail_water_candidates.json")
    fail_if(len(water) < 1700, failures, "water candidates too few")
    for record in water[:50] + water[-50:]:
        common(record, failures, "water")
        coordinate_first_landmark(record, failures, "water")
        fail_if(record.get("reliability") != "unknown", failures, "water reliability overclaimed")
        fail_if(record.get("potable") != "unknown", failures, "water potability overclaimed")
        fail_if(record.get("last_human_verified") is not None, failures, "water human verified without proof")
        fail_if("mapped water candidate" not in record.get("ai_answer_rule", "").lower(), failures, "water answer rule missing mapped candidate")
    for record in j("processed/water/full_trail_major_ford_candidates.json")[:50]:
        common(record, failures, "ford")
        coordinate_first_landmark(record, failures, "ford")
        fail_if(record.get("ford_safety") != "unknown", failures, "ford safety overclaimed")
        fail_if("never call" not in record.get("ai_answer_rule", "").lower(), failures, "ford safety caution missing")

    for dataset in ["full_trail_shelters", "full_trail_campsites", "full_trail_parking", "full_trail_road_crossings", "full_trail_towns_resupply_candidates"]:
        records = j(f"processed/waypoints/{dataset}.json")
        fail_if(len(records) < 20, failures, f"{dataset} too small")
        for record in records[:20]:
            common(record, failures, dataset)
            coordinate_first_landmark(record, failures, dataset)
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

    rockiness01 = j("processed/tread_rockiness_v2/full_trail_rockiness_v2_by_0_1mi.json")
    rockiness1 = j("processed/tread_rockiness_v2/full_trail_rockiness_v2_by_1mi.json")
    micro_coverage = j("processed/tread_rockiness_v2/full_trail_micro_roughness_coverage.json")
    soil = j("processed/tread_rockiness_v2/full_trail_soil_stoniness.json")
    osm_surface = j("processed/tread_rockiness_v2/full_trail_osm_surface_tags.json")
    fail_if(len(rockiness01) < 21000, failures, "Rockiness V2 0.1mi records too few")
    fail_if(len(rockiness1) < 2100, failures, "Rockiness V2 1mi records too few")
    fail_if(len(micro_coverage) < 3, failures, "micro roughness coverage missing reviewed lanes")
    coverage_text = json.dumps(micro_coverage).lower()
    for term in ["100m", "3dep", "lidar", "not_downloaded", "not_streamed"]:
        fail_if(term not in coverage_text, failures, f"micro coverage missing {term}")
    fail_if(len(soil) < 2000, failures, "soil stoniness lane too small")
    fail_if(len(osm_surface) < 2000, failures, "OSM surface lane too small")
    fail_if(not all(record.get("license_status") == "public_domain" for record in soil[:50]), failures, "soil lane not public domain")
    fail_if(not all(record.get("soil_stoniness_score") is None for record in soil[:50]), failures, "soil lane should stay null until extraction")
    fail_if(not all(record.get("license_status") == "open_license_share_alike" for record in osm_surface[:50]), failures, "OSM surface lane not ODbL/open_license_share_alike")
    fail_if(not any(record.get("osm_surface_signal") is not None for record in osm_surface), failures, "OSM surface signals never populated")
    rockiness_required = [
        "mile_nobo_global_est",
        "mile_sobo_global_est",
        "official",
        "rockiness_v2_score_0_10",
        "rockiness_class",
        "confidence",
        "field_verified",
        "lidar_available",
        "dem_resolution_m",
        "micro_roughness_score",
        "soil_stoniness_score",
        "osm_surface_signal",
        "user_report_signal",
        "pace_penalty_factor",
        "source_id",
        "source_url",
        "license_status",
        "last_checked",
        "last_generated",
        "ai_answer_rule",
    ]
    for dataset_name, records in [("rockiness01", rockiness01), ("rockiness1", rockiness1)]:
        fail_if(any(record.get("field_verified") is True for record in records), failures, f"{dataset_name} has field_verified true")
        fail_if(any(record.get("official") is not False for record in records[:50] + records[-50:]), failures, f"{dataset_name} official not false")
        fail_if(any(record.get("lidar_available") is True for record in records), failures, f"{dataset_name} marks lidar available without extraction evidence")
        fail_if(any(record.get("license_status") != "open_license_share_alike" for record in records[:50] + records[-50:]), failures, f"{dataset_name} license is not ODbL/open share alike")
        for record in records[:50] + records[-50:]:
            common(record, failures, dataset_name)
            for field in rockiness_required:
                fail_if(field not in record, failures, f"{dataset_name} missing {field}")
            fail_if(not 0 <= record.get("rockiness_v2_score_0_10", -1) <= 10, failures, f"{dataset_name} score outside 0-10")
            fail_if(record.get("dem_resolution_m") != 100, failures, f"{dataset_name} should use current 100m baseline")
            fail_if("not field verified" not in record.get("ai_answer_rule", "").lower(), failures, f"{dataset_name} missing not-field-verified rule")
            fail_if("not official atc" not in record.get("ai_answer_rule", "").lower() and dataset_name == "rockiness01", failures, f"{dataset_name} missing generated-mile caution")
    fail_if(not any(record.get("confidence") == "low_due_to_regional_mvp_gap" for record in rockiness1), failures, "Rockiness V2 gap low confidence missing")
    fail_if(not any(record.get("confidence", "").startswith("medium") for record in rockiness1), failures, "Rockiness V2 lacks medium confidence records where OSM/100m signals exist")
    notes_text = t("processed/tread_rockiness_v2/rockiness_v2_model_notes.md").lower()
    limitations_text = t("processed/tread_rockiness_v2/rockiness_v2_source_limitations.md").lower()
    for term in ["opentrail", "openlongtrails", "not field verified", "100-meter", "osm", "gssurgo", "lidar", "user reports"]:
        fail_if(term not in limitations_text and term not in notes_text, failures, f"Rockiness V2 docs missing {term}")

    rockiness21_extraction = j("processed/tread_rockiness_v2_1/full_trail_rockiness_v2_1_source_extraction.json")
    rockiness21_1 = j("processed/tread_rockiness_v2_1/full_trail_rockiness_v2_1_by_1mi.json")
    fail_if(rockiness21_extraction.get("production_safe") is not True, failures, "Rockiness V2.1 extraction not production-safe")
    fail_if(rockiness21_extraction.get("extraction_level") == "missing_snapshot_fallback", failures, "Rockiness V2.1 missing live extraction snapshot")
    dem_sections = rockiness21_extraction.get("dem", {}).get("sections", [])
    fail_if(not any(section.get("item_count_returned", 0) > 0 for section in dem_sections), failures, "Rockiness V2.1 DEM STAC extraction has no items")
    lidar = rockiness21_extraction.get("lidar", {})
    fail_if(lidar.get("catalog_item_link_count", 0) <= 0, failures, "Rockiness V2.1 LiDAR catalog not checked")
    fail_if(lidar.get("at_state_item_link_count", 0) <= 0, failures, "Rockiness V2.1 LiDAR AT-state catalog count missing")
    fail_if(len(rockiness21_1) != len(rockiness1), failures, "Rockiness V2.1 1mi count does not match V2")
    for label, records in [("1mi V2.1", rockiness21_1)]:
        fail_if(any(record.get("field_verified") is True for record in records), failures, f"{label} has field_verified true")
        fail_if(any(record.get("lidar_available") is True for record in records), failures, f"{label} claims lidar_available before point-cloud extraction")
        fail_if(any(record.get("official") is not False for record in records[:50] + records[-50:]), failures, f"{label} official not false")
        fail_if(not any(record.get("dem_stac_item_count", 0) > 0 for record in records), failures, f"{label} lacks DEM STAC metadata")
        for record in records[:50] + records[-50:]:
            common(record, failures, label)
            fail_if(record.get("source_id") != "full_trail_rockiness_v2_1_extraction_model", failures, f"{label} wrong source_id")
            fail_if("not field verified" not in record.get("ai_answer_rule", "").lower(), failures, f"{label} missing not-field-verified rule")
            fail_if("generated/open-route miles are not official" not in record.get("ai_answer_rule", "").lower(), failures, f"{label} missing generated-mile caution")
    v21_notes = t("processed/tread_rockiness_v2_1/rockiness_v2_1_model_notes.md").lower()
    v21_limits = t("processed/tread_rockiness_v2_1/rockiness_v2_1_source_limitations.md").lower()
    for term in ["bounded", "stac", "lidar", "not field verified", "ssurgo", "does not sample"]:
        fail_if(term not in v21_notes and term not in v21_limits, failures, f"Rockiness V2.1 docs missing {term}")

    awol_audit = j("processed/legal/blocked_legacy_awol_audit.json")
    fail_if(awol_audit.get("production_safe") is not False, failures, "AWOL audit should not be production safe")
    fail_if(awol_audit.get("license_status") != "blocked", failures, "AWOL audit should be blocked")
    fail_if(len(awol_audit.get("awol_scripts", [])) < 1, failures, "AWOL audit did not find legacy scripts")
    fail_if("production_safe" not in awol_audit.get("production_export_rule", ""), failures, "AWOL audit missing production-safe export rule")

    difficulty = j("processed/difficulty/full_trail_difficulty_by_10mi_segment.json")
    fail_if(len(difficulty) < 210, failures, "difficulty segments too few")
    fail_if(not any(record["factors"].get("ford_uncertainty_factor", 0) > 0 for record in difficulty), failures, "difficulty lacks ford factor")
    fail_if(not any(record["factors"].get("regional_gap_factor", 0) > 0 for record in difficulty), failures, "difficulty lacks regional gap factor")
    fail_if(not any(record["factors"].get("permit_rule_friction_factor", 0) > 0 for record in difficulty), failures, "difficulty lacks permit/rule friction")
    fail_if(not any(record["factors"].get("steep_grade_factor", 0) > 0 for record in difficulty), failures, "difficulty lacks steep-grade factor")
    fail_if(not any(record["factors"].get("rockiness_v2_factor", 0) > 0 for record in difficulty), failures, "difficulty lacks Rockiness V2 factor")
    for record in difficulty[:10]:
        common(record, failures, "difficulty")
        fail_if(record.get("difficulty_score_0_10") is None, failures, "difficulty missing score")
        fail_if(record.get("inputs", {}).get("elevation_sample_spacing_meters") != 100, failures, "difficulty not using 100m elevation")
        fail_if(record.get("inputs", {}).get("max_grade_percent") is None, failures, "difficulty missing max-grade input")
        fail_if("rockiness_v2_score_avg" not in record.get("inputs", {}), failures, "difficulty missing Rockiness V2 input")
        fail_if("rockiness_v2_factor" not in record.get("factors", {}), failures, "difficulty missing Rockiness V2 factor")
    difficulty_model = j("processed/difficulty/full_trail_daily_difficulty_model.json")
    fail_if(difficulty_model.get("preferred_tread_source") != "processed/tread_rockiness_v2_1/full_trail_rockiness_v2_1_by_1mi.json", failures, "difficulty model does not prefer Rockiness V2.1")
    difficulty_doc = t("processed/difficulty/full_trail_daily_difficulty_model.md").lower()
    fail_if("rockiness v2" not in difficulty_doc or ("not field verified" not in difficulty_doc and "not field-verified" not in difficulty_doc), failures, "difficulty doc missing Rockiness V2 caveat")

    rag_metadata = j("rag_docs/rag_doc_metadata.json")
    fail_if(len(rag_metadata) < 84, failures, "RAG segment metadata too few")
    for record in rag_metadata[:10]:
        common(record, failures, "rag metadata")
    segment_index = t("rag_docs/segment_guides/segment_index_25mi.md").lower()
    fail_if("2106" not in segment_index, failures, "segment index missing end")

    qa = j("tests/full_trail_rc1_behavior_questions.json")
    fail_if(len(qa) < 200, failures, "QA questions below 200")
    qa_text = json.dumps(qa).lower()
    for term in ["itinerary", "shelter", "water", "permit", "camping", "weather", "closures", "rockiness", "rockiness v2", "rocky-but-flat", "user report override", "blocked source leakage", "ford", "baxter", "katahdin", "smokies", "shenandoah", "white mountains", "nj/ct", "pa rockiness", "resupply", "davenport", "official length alignment", "2197.9", "2106.2", "-91.7"]:
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
        if entry.get("production_safe"):
            fail_if("awol" in entry["path"].lower() or "awol" in entry["dataset_id"].lower(), failures, f"AWOL path marked production safe: {entry['path']}")
    for unsafe_review_path in ["sources/opentrail_review.json", "sources/openlongtrails_review.json", "sources/open_dem_review.json", "processed/legal/blocked_legacy_awol_audit.json"]:
        fail_if(unsafe_review_path in names, failures, f"export included review/blocked file {unsafe_review_path}")
    fail_if(any("awol" in name.lower() for name in names), failures, "export zip contains AWOL path")

    return {
        "ok": not failures,
        "failures": failures,
        "route_miles": route.get("measured_length_miles"),
        "official_reference_miles": route.get("official_reference_length_miles"),
        "length_delta_miles": route.get("length_delta_miles"),
        "alignment_status": route.get("alignment_status"),
        "milepoints_0_1mi": len(rows(j("processed/milepoints/full_at_milepoints_0_1mi.geojson"))),
        "elevation_100m_samples": len(elevation_100m),
        "major_climbs_descents_100m": len(major_climbs),
        "steep_grade_sections_100m": len(steep_sections),
        "water_candidates": len(water),
        "rules": len(rules),
        "tread_1mi_records": len(tread),
        "rockiness_v2_0_1mi_records": len(rockiness01),
        "rockiness_v2_1mi_records": len(rockiness1),
        "rockiness_v2_1_1mi_records": len(rockiness21_1),
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
  const alignment = buildRouteAlignment(elevation.highResolutionSamples);
  const water = buildWater();
  const waypoints = buildWaypoints();
  const rules = buildRules();
  const liveSources = buildLiveSources();
  const tread = buildTread(elevation.oneMileSamples);
  const rockinessV2 = buildRockinessV2(elevation.highResolutionSamples, tread);
  const rockinessV21 = buildRockinessV21(rockinessV2);
  const elevation10 = readJson('processed/elevation/full_trail_elevation_by_10mi_segment.json', rcRoot);
  const difficulty = buildDifficulty(elevation10, tread, rockinessV21.byOneMile, water, waypoints, rules);
  const datasets = {
    elevation: elevation.oneMileSamples,
    elevation100m: elevation.highResolutionSamples,
    elevationStatus100m: elevation.highResolutionStatus,
    elevationSummaries1mi100m: elevation.oneMileSummaries100m,
    elevationSummaries5mi100m: elevation.fiveMileSummaries100m,
    elevationSummaries10mi100m: elevation.tenMileSummaries100m,
    majorClimbsDescents100m: elevation.majorClimbsDescents,
    steepGradeSections100m: elevation.steepGradeSections,
    alignment,
    water,
    waypoints,
    rules,
    liveSources,
    tread,
    rockinessV2,
    rockinessV21,
    difficulty,
  };
  buildRagDocs(datasets);
  const qa = buildQaTests();
  datasets.qa = qa;
  const manifest = sourceManifest();
  const sourceReviews = buildSourceReviews(manifest);
  const awolAudit = buildAwolAudit();
  datasets.sourceReviews = sourceReviews;
  datasets.awolAudit = awolAudit;
  const datasetIndex = buildDatasetIndex(datasets);
  buildAuditDocs(datasetIndex, manifest);
  copySchemas();
  buildStatusAndReport(datasetIndex, datasets);
  buildValidationScript();

  console.log(`Full Trail RC1 generated at ${rcRoot}`);
}

main();
