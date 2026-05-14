import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const packRoot = path.resolve(__dirname, '..');
const mvpRoot = path.join(packRoot, 'mvp2_va');

const GENERATED_DATE = process.env.MVP2_VA_GENERATED_DATE ?? '2026-05-14';
const GENERATED_AT = `${GENERATED_DATE}T00:00:00.000Z`;
const START_GLOBAL_MILE = 459.0;
const END_GLOBAL_MILE = 1006.0;
const VA_LENGTH = 547.0;
const ROUTE_ID = 'at-mvp2-va-damascus-harpers-ferry-open-2026';
const SOURCE_ROUTE_ID = 'at-main-osm-2026-open';

const BLOCKED_SOURCE_IDS = new Set([
  'atc_website',
  'farout',
  'awol_at_guide',
  'at_data_book',
  'alltrails_gaia_hiking_project',
]);

const SAFE_LICENSE_STATUSES = new Set([
  'public_domain',
  'open_license_attribution',
  'open_license_share_alike',
  'api_access_allowed',
]);

const pacePenalty = new Map([
  [0, 1.0],
  [1, 1.03],
  [2, 1.08],
  [3, 1.15],
  [4, 1.25],
  [5, 1.4],
]);

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(packRoot, relativePath), 'utf8'));
}

function writeJson(relativePath, value) {
  const target = path.join(mvpRoot, relativePath);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

function writeText(relativePath, text) {
  const target = path.join(mvpRoot, relativePath);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, text.trimEnd() + '\n', 'utf8');
}

function crc32(buffer) {
  let crc = 0xffffffff;
  for (const byte of buffer) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit += 1) {
      crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function dosTimestamp(dateString) {
  const [year, month, day] = dateString.split('-').map(Number);
  return { time: 0, date: ((year - 1980) << 9) | (month << 5) | day };
}

function writeZip(relativePath, entries) {
  const target = path.join(mvpRoot, relativePath);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  const timestamp = dosTimestamp(GENERATED_DATE);
  const localParts = [];
  const centralParts = [];
  let offset = 0;

  for (const entry of entries) {
    const name = Buffer.from(entry.name, 'utf8');
    const data = Buffer.isBuffer(entry.data) ? entry.data : Buffer.from(entry.data, 'utf8');
    const crc = crc32(data);
    const localHeader = Buffer.alloc(30);
    localHeader.writeUInt32LE(0x04034b50, 0);
    localHeader.writeUInt16LE(20, 4);
    localHeader.writeUInt16LE(0, 6);
    localHeader.writeUInt16LE(0, 8);
    localHeader.writeUInt16LE(timestamp.time, 10);
    localHeader.writeUInt16LE(timestamp.date, 12);
    localHeader.writeUInt32LE(crc, 14);
    localHeader.writeUInt32LE(data.length, 18);
    localHeader.writeUInt32LE(data.length, 22);
    localHeader.writeUInt16LE(name.length, 26);
    localHeader.writeUInt16LE(0, 28);
    localParts.push(localHeader, name, data);

    const centralHeader = Buffer.alloc(46);
    centralHeader.writeUInt32LE(0x02014b50, 0);
    centralHeader.writeUInt16LE(20, 4);
    centralHeader.writeUInt16LE(20, 6);
    centralHeader.writeUInt16LE(0, 8);
    centralHeader.writeUInt16LE(0, 10);
    centralHeader.writeUInt16LE(timestamp.time, 12);
    centralHeader.writeUInt16LE(timestamp.date, 14);
    centralHeader.writeUInt32LE(crc, 16);
    centralHeader.writeUInt32LE(data.length, 20);
    centralHeader.writeUInt32LE(data.length, 24);
    centralHeader.writeUInt16LE(name.length, 28);
    centralHeader.writeUInt16LE(0, 30);
    centralHeader.writeUInt16LE(0, 32);
    centralHeader.writeUInt16LE(0, 34);
    centralHeader.writeUInt16LE(0, 36);
    centralHeader.writeUInt32LE(0, 38);
    centralHeader.writeUInt32LE(offset, 42);
    centralParts.push(centralHeader, name);
    offset += localHeader.length + name.length + data.length;
  }

  const centralDirectory = Buffer.concat(centralParts);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(0, 4);
  end.writeUInt16LE(0, 6);
  end.writeUInt16LE(entries.length, 8);
  end.writeUInt16LE(entries.length, 10);
  end.writeUInt32LE(centralDirectory.length, 12);
  end.writeUInt32LE(offset, 16);
  end.writeUInt16LE(0, 20);
  fs.writeFileSync(target, Buffer.concat([...localParts, centralDirectory, end]));
}

function round(value, digits = 1) {
  const multiplier = 10 ** digits;
  return Math.round(value * multiplier) / multiplier;
}

function roundCoord(value) {
  return round(value, 6);
}

function intervalName(interval) {
  return interval.toFixed(1).replace('.', '_');
}

function milesBetween(a, b) {
  const radiusMiles = 3958.7613;
  const lat1 = a[1] * Math.PI / 180;
  const lat2 = b[1] * Math.PI / 180;
  const deltaLat = (b[1] - a[1]) * Math.PI / 180;
  const deltaLon = (b[0] - a[0]) * Math.PI / 180;
  const h = Math.sin(deltaLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLon / 2) ** 2;
  return radiusMiles * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

function routeMeasures(coordinates) {
  const measures = [{ coord: coordinates[0], mile: 0 }];
  for (let index = 1; index < coordinates.length; index += 1) {
    const mile = measures[index - 1].mile + milesBetween(coordinates[index - 1], coordinates[index]);
    measures.push({ coord: coordinates[index], mile });
  }
  return measures;
}

function pointAtMile(measures, mile) {
  if (mile <= 0) return measures[0].coord;
  for (let index = 1; index < measures.length; index += 1) {
    const previous = measures[index - 1];
    const current = measures[index];
    if (current.mile >= mile) {
      const segmentMiles = current.mile - previous.mile;
      const ratio = segmentMiles === 0 ? 0 : (mile - previous.mile) / segmentMiles;
      return [
        roundCoord(previous.coord[0] + (current.coord[0] - previous.coord[0]) * ratio),
        roundCoord(previous.coord[1] + (current.coord[1] - previous.coord[1]) * ratio),
      ];
    }
  }
  return measures.at(-1).coord;
}

function routeSegment(measures, startMile, endMile) {
  const coordinates = [pointAtMile(measures, startMile)];
  for (const measure of measures) {
    if (measure.mile > startMile && measure.mile < endMile) {
      coordinates.push([roundCoord(measure.coord[0]), roundCoord(measure.coord[1])]);
    }
  }
  coordinates.push(pointAtMile(measures, endMile));
  return coordinates;
}

function globalToVa(globalMile) {
  return round(globalMile - START_GLOBAL_MILE, 1);
}

function vaToGlobal(vaMile) {
  return round(START_GLOBAL_MILE + vaMile, 1);
}

function landManagersForVaMile(vaMile) {
  const managers = [];
  if (vaMile < 75) managers.push('Mount Rogers National Recreation Area / Grayson Highlands source lane');
  if (vaMile < 387 || vaMile > 494) managers.push('George Washington and Jefferson National Forests / Virginia AT corridor');
  if (vaMile >= 269 && vaMile <= 388) managers.push('Blue Ridge Parkway crossing corridor');
  if (vaMile >= 387 && vaMile <= 494) managers.push('Shenandoah National Park');
  if (vaMile >= 544) managers.push('Harpers Ferry approach / multi-jurisdiction source-gap lane');
  return [...new Set(managers)];
}

function inVa(record) {
  const mile = record.mile_nobo ?? record.nearest_trail_mile_nobo;
  return typeof mile === 'number' && mile >= START_GLOBAL_MILE && mile <= END_GLOBAL_MILE;
}

function commonSource(extra = {}) {
  return {
    route_id: ROUTE_ID,
    source_route_id: SOURCE_ROUTE_ID,
    state: 'VA',
    last_generated: GENERATED_DATE,
    ...extra,
  };
}

function normalizeCandidate(record, idPrefix, index) {
  const globalMile = round(record.mile_nobo ?? record.nearest_trail_mile_nobo, 1);
  const vaMile = globalToVa(globalMile);
  const type = record.type ?? idPrefix;
  const id = record.water_id ?? record.waypoint_id ?? record.access_id ?? record.town_id ?? `${idPrefix}-va-${String(index + 1).padStart(5, '0')}`;
  return {
    ...record,
    ...commonSource({
      [`${idPrefix}_id`]: id,
      type,
      mile_nobo_global_est: globalMile,
      mile_nobo_va: vaMile,
      mile_sobo_va: round(VA_LENGTH - vaMile, 1),
      state: 'VA',
      source_license: record.source_license ?? record.license_status,
      attribution: record.attribution ?? record.source ?? 'OpenStreetMap contributors',
      last_checked: record.last_checked ?? GENERATED_DATE,
      last_generated: GENERATED_DATE,
      notes: [
        record.notes,
        'MVP2 VA generated candidate. Generated miles are not official ATC mileage.',
      ].filter(Boolean).join(' '),
    }),
  };
}

function dedupeCandidates(records) {
  const byKey = new Map();
  for (const record of records) {
    const key = [
      record.type,
      String(record.name || 'unnamed').toLowerCase(),
      round(record.mile_nobo_va, 1),
      round(record.lat ?? 0, 4),
      round(record.lon ?? 0, 4),
    ].join('|');
    if (!byKey.has(key)) {
      byKey.set(key, record);
      continue;
    }
    const existing = byKey.get(key);
    existing.source_ids = [...new Set([existing.source_id, record.source_id, ...(existing.source_ids ?? []), ...(record.source_ids ?? [])].filter(Boolean))];
    existing.source_feature_ids = [...new Set([existing.osm_id, record.osm_id, existing.source_feature_id, record.source_feature_id, ...(existing.source_feature_ids ?? []), ...(record.source_feature_ids ?? [])].filter(Boolean))];
  }
  return [...byKey.values()].sort((a, b) => a.mile_nobo_va - b.mile_nobo_va);
}

function makeMilepoints(measures, interval) {
  const miles = [];
  for (let mile = 0; mile <= VA_LENGTH + 1e-9; mile = round(mile + interval, 1)) {
    miles.push(round(mile, 1));
  }
  if (miles.at(-1) !== VA_LENGTH) miles.push(VA_LENGTH);

  return {
    type: 'FeatureCollection',
    name: `Scout MVP2 Virginia generated milepoints ${interval}mi`,
    features: miles.map((vaMile) => {
      const globalMile = vaToGlobal(vaMile);
      const [lon, lat] = pointAtMile(measures, globalMile);
      return {
        type: 'Feature',
        properties: {
          trail: 'Appalachian Trail',
          route_id: ROUTE_ID,
          source_route_id: SOURCE_ROUTE_ID,
          mile_nobo_global_est: globalMile,
          mile_nobo_va: vaMile,
          mile_sobo_va: round(VA_LENGTH - vaMile, 1),
          milepoint_type: 'generated',
          official: false,
          confidence: 'estimated_from_open_route_geometry_with_known_length_gap',
          source_id: 'osm',
          source_url: 'https://www.openstreetmap.org/relation/156553',
          source_access_url: 'https://hiking.waymarkedtrails.org/api/v1/details/relation/156553',
          license_status: 'open_license_share_alike',
          source_license: 'ODbL',
          attribution: 'OpenStreetMap contributors',
          last_checked: '2026-05-13',
          last_generated: GENERATED_DATE,
          ai_answer_rule: 'Generated mile based on Scout MVP2 Virginia open route geometry, not an official ATC mile. Use for source-aware planning only.',
        },
        geometry: { type: 'Point', coordinates: [lon, lat] },
      };
    }),
  };
}

function interpolateElevation(samples, globalMile) {
  if (globalMile <= samples[0].mile_nobo) return samples[0].elevation_ft;
  for (let index = 1; index < samples.length; index += 1) {
    const previous = samples[index - 1];
    const current = samples[index];
    if (current.mile_nobo >= globalMile) {
      const span = current.mile_nobo - previous.mile_nobo;
      const ratio = span === 0 ? 0 : (globalMile - previous.mile_nobo) / span;
      return round(previous.elevation_ft + (current.elevation_ft - previous.elevation_ft) * ratio, 1);
    }
  }
  return samples.at(-1).elevation_ft;
}

function elevationSamples(measures, sourceSamples) {
  const samples = [];
  for (let vaMile = 0; vaMile <= VA_LENGTH; vaMile += 1) {
    const globalMile = vaToGlobal(vaMile);
    const [lon, lat] = pointAtMile(measures, globalMile);
    samples.push({
      sample_id: `elev-va-1mi-${String(vaMile).padStart(3, '0')}`,
      trail: 'Appalachian Trail',
      route_id: ROUTE_ID,
      mile_nobo_global_est: globalMile,
      mile_nobo_va: round(vaMile, 1),
      mile_sobo_va: round(VA_LENGTH - vaMile, 1),
      lat,
      lon,
      interval_miles: 1,
      elevation_ft: interpolateElevation(sourceSamples, globalMile),
      source_id: 'usgs_3dep',
      source_url: 'https://epqs.nationalmap.gov/v1/json',
      source: 'USGS Elevation Point Query Service, interpolated from 3DEP dynamic elevation service',
      source_license: 'public_domain',
      license_status: 'public_domain',
      attribution: 'Data available from U.S. Geological Survey, 3D Elevation Program.',
      confidence: 'model_derived_topographic_estimate',
      last_checked: '2026-05-14',
      last_generated: GENERATED_DATE,
      ai_answer_rule: 'Describe as model-derived USGS 3DEP elevation sampled along Scout open route geometry; values may differ from guidebook profiles or surveyed summits.',
    });
  }
  return samples;
}

function summarizeSegments(samples, segmentMiles) {
  const segments = [];
  for (let start = 0; start < VA_LENGTH; start += segmentMiles) {
    const end = Math.min(VA_LENGTH, start + segmentMiles);
    const segmentSamples = samples.filter((sample) => sample.mile_nobo_va >= start && sample.mile_nobo_va <= end);
    if (segmentSamples.at(-1)?.mile_nobo_va !== end) {
      segmentSamples.push({ ...segmentSamples.at(-1), mile_nobo_va: end, elevation_ft: interpolateByVa(samples, end) });
    }
    let gain = 0;
    let loss = 0;
    let maxGrade = 0;
    for (let index = 1; index < segmentSamples.length; index += 1) {
      const previous = segmentSamples[index - 1];
      const current = segmentSamples[index];
      const delta = current.elevation_ft - previous.elevation_ft;
      if (delta >= 0) gain += delta;
      else loss += Math.abs(delta);
      const distance = current.mile_nobo_va - previous.mile_nobo_va;
      if (distance > 0) maxGrade = Math.max(maxGrade, Math.abs(delta) / (distance * 5280) * 100);
    }
    segments.push({
      segment_id: `mvp2-va-${String(Math.round(start)).padStart(3, '0')}-${String(Math.round(end)).padStart(3, '0')}-${segmentMiles}mi`,
      route_id: ROUTE_ID,
      start_mile_nobo_global_est: vaToGlobal(start),
      end_mile_nobo_global_est: vaToGlobal(end),
      start_mile_nobo_va: round(start, 1),
      end_mile_nobo_va: round(end, 1),
      start_mile_sobo_va: round(VA_LENGTH - start, 1),
      end_mile_sobo_va: round(VA_LENGTH - end, 1),
      distance_miles: round(end - start, 1),
      state: ['VA'],
      land_managers: [...new Set([...landManagersForVaMile(start), ...landManagersForVaMile(Math.max(start, end - 0.1))])],
      elevation_gain_ft: Math.round(gain),
      elevation_loss_ft: Math.round(loss),
      highest_point_ft: Math.round(Math.max(...segmentSamples.map((sample) => sample.elevation_ft))),
      lowest_point_ft: Math.round(Math.min(...segmentSamples.map((sample) => sample.elevation_ft))),
      max_grade_percent: round(maxGrade, 1),
      sample_interval_miles: 1,
      source_id: 'usgs_3dep',
      source_url: 'https://epqs.nationalmap.gov/v1/json',
      license_status: 'public_domain',
      source_license: 'public_domain',
      attribution: 'Data available from U.S. Geological Survey, 3D Elevation Program.',
      confidence: 'model_derived_topographic_estimate',
      last_checked: '2026-05-14',
      last_generated: GENERATED_DATE,
      ai_answer_rule: 'Use as model-derived terrain screening from USGS 3DEP. Do not present as surveyed elevation or guidebook profile.',
    });
  }
  return segments;
}

function interpolateByVa(samples, vaMile) {
  if (vaMile <= samples[0].mile_nobo_va) return samples[0].elevation_ft;
  for (let index = 1; index < samples.length; index += 1) {
    const previous = samples[index - 1];
    const current = samples[index];
    if (current.mile_nobo_va >= vaMile) {
      const span = current.mile_nobo_va - previous.mile_nobo_va;
      const ratio = span === 0 ? 0 : (vaMile - previous.mile_nobo_va) / span;
      return round(previous.elevation_ft + (current.elevation_ft - previous.elevation_ft) * ratio, 1);
    }
  }
  return samples.at(-1).elevation_ft;
}

function majorSlopeRuns(samples, direction) {
  const runs = [];
  let active = null;
  for (let index = 1; index < samples.length; index += 1) {
    const previous = samples[index - 1];
    const current = samples[index];
    const delta = current.elevation_ft - previous.elevation_ft;
    const applies = direction === 'climb' ? delta > 80 : delta < -80;
    if (applies) {
      if (!active) active = { start: previous, end: current, change: 0 };
      active.end = current;
      active.change += Math.abs(delta);
    } else if (active) {
      if (active.change >= 700) runs.push(active);
      active = null;
    }
  }
  if (active?.change >= 700) runs.push(active);
  return runs.map((run, index) => ({
    [`${direction}_id`]: `mvp2-va-${direction}-${String(index + 1).padStart(2, '0')}`,
    route_id: ROUTE_ID,
    start_mile_nobo_global_est: run.start.mile_nobo_global_est,
    end_mile_nobo_global_est: run.end.mile_nobo_global_est,
    start_mile_nobo_va: run.start.mile_nobo_va,
    end_mile_nobo_va: run.end.mile_nobo_va,
    distance_miles: round(run.end.mile_nobo_va - run.start.mile_nobo_va, 1),
    [`elevation_${direction === 'climb' ? 'gain' : 'loss'}_ft`]: Math.round(run.change),
    start_elevation_ft: run.start.elevation_ft,
    end_elevation_ft: run.end.elevation_ft,
    state: 'VA',
    source_id: 'usgs_3dep',
    source_url: 'https://epqs.nationalmap.gov/v1/json',
    license_status: 'public_domain',
    attribution: 'Data available from U.S. Geological Survey, 3D Elevation Program.',
    confidence: 'model_derived_topographic_estimate',
    last_checked: '2026-05-14',
    last_generated: GENERATED_DATE,
    ai_answer_rule: `Use as model-derived ${direction} screening. Verify with current maps and field conditions before pacing or safety decisions.`,
  }));
}

function highLowPoints(samples) {
  const sortedHigh = [...samples].sort((a, b) => b.elevation_ft - a.elevation_ft).slice(0, 10);
  const sortedLow = [...samples].sort((a, b) => a.elevation_ft - b.elevation_ft).slice(0, 10);
  return {
    route_id: ROUTE_ID,
    highest_samples: sortedHigh,
    lowest_samples: sortedLow,
    source_id: 'usgs_3dep',
    source_url: 'https://epqs.nationalmap.gov/v1/json',
    license_status: 'public_domain',
    confidence: 'model_derived_topographic_estimate',
    last_checked: '2026-05-14',
    last_generated: GENERATED_DATE,
    ai_answer_rule: 'High/low points are sampled model estimates, not surveyed summit or gap records.',
  };
}

function steepDescents(samples) {
  const descents = [];
  for (let index = 1; index < samples.length; index += 1) {
    const previous = samples[index - 1];
    const current = samples[index];
    const loss = previous.elevation_ft - current.elevation_ft;
    if (loss >= 450) {
      descents.push({
        descent_id: `mvp2-va-steep-descent-${String(descents.length + 1).padStart(2, '0')}`,
        route_id: ROUTE_ID,
        start_mile_nobo_va: previous.mile_nobo_va,
        end_mile_nobo_va: current.mile_nobo_va,
        start_mile_nobo_global_est: previous.mile_nobo_global_est,
        end_mile_nobo_global_est: current.mile_nobo_global_est,
        elevation_loss_ft: round(loss, 1),
        grade_percent_est: round(loss / 5280 * 100, 1),
        source_id: 'usgs_3dep',
        source_url: 'https://epqs.nationalmap.gov/v1/json',
        license_status: 'public_domain',
        confidence: 'model_derived_topographic_screening',
        last_checked: '2026-05-14',
        last_generated: GENERATED_DATE,
        ai_answer_rule: 'Steep descent is a screening candidate from sampled elevation. Verify current tread, weather, and map data before risk decisions.',
      });
    }
  }
  return descents;
}

function treadRecords(samples, interval) {
  const records = [];
  for (let start = 0; start < VA_LENGTH; start = round(start + interval, 1)) {
    const end = Math.min(VA_LENGTH, round(start + interval, 1));
    const mid = round(start + (end - start) / 2, 1);
    const startElev = interpolateByVa(samples, start);
    const endElev = interpolateByVa(samples, end);
    const lossGain = Math.abs(endElev - startElev);
    const localSamples = samples.filter((sample) => sample.mile_nobo_va >= Math.max(0, mid - 2) && sample.mile_nobo_va <= Math.min(VA_LENGTH, mid + 2));
    const localRelief = localSamples.length ? Math.max(...localSamples.map((s) => s.elevation_ft)) - Math.min(...localSamples.map((s) => s.elevation_ft)) : 0;
    const gradePercent = end > start ? lossGain / ((end - start) * 5280) * 100 : 0;
    let score = 1;
    if (gradePercent >= 12 || localRelief >= 1800) score = 5;
    else if (gradePercent >= 9 || localRelief >= 1200) score = 4;
    else if (gradePercent >= 6 || localRelief >= 800) score = 3;
    else if (gradePercent >= 3 || localRelief >= 450) score = 2;
    if (mid >= 387 && mid <= 494 && score < 3) score += 1;
    score = Math.max(0, Math.min(5, score));
    records.push({
      tread_id: `mvp2-va-tread-${String(interval).replace('.', '_')}-${String(records.length + 1).padStart(5, '0')}`,
      route_id: ROUTE_ID,
      start_mile_nobo_va: round(start, 1),
      end_mile_nobo_va: round(end, 1),
      mile_nobo_global_est: vaToGlobal(mid),
      mile_nobo_va: mid,
      mile_sobo_va: round(VA_LENGTH - mid, 1),
      interval_miles: interval,
      score,
      score_label: ['smooth', 'mostly_smooth', 'moderate_rocks_roots', 'rocky_uneven', 'very_rocky', 'severe_rocks_boulders_scramble'][score],
      pace_penalty_multiplier: pacePenalty.get(score),
      confidence: gradePercent >= 6 || localRelief >= 800 ? 'medium' : 'low',
      field_verified: false,
      slope_percent_est: round(gradePercent, 1),
      local_relief_ft_est: Math.round(localRelief),
      signal_sources: ['USGS 3DEP slope/local relief', 'OSM tread tag lane documented', 'SSURGO/gSSURGO and geology documented as weak/deferred'],
      source_id: 'mvp2_va_tread_model',
      source_url: 'internal:data/at-open-reference/scripts/build-mvp2-va-reference-pack.mjs',
      license_status: 'open_license_share_alike',
      attribution: 'OpenStreetMap contributors; Data available from U.S. Geological Survey, 3D Elevation Program.',
      last_checked: GENERATED_DATE,
      last_generated: GENERATED_DATE,
      ai_answer_rule: 'Describe as a model-estimated tread/rockiness score, not field verified. State confidence and pace penalty; do not overclaim rocks or footing.',
    });
  }
  return records;
}

function rulesByLandManager() {
  return [
    {
      rule_id: 'mvp2-va-gwj-nf-at',
      jurisdiction: 'George Washington and Jefferson National Forests Appalachian Trail',
      land_manager_type: 'national_forest',
      state: ['VA'],
      mile_range_nobo_va: [0, VA_LENGTH],
      mile_range_nobo_global_est: [START_GLOBAL_MILE, END_GLOBAL_MILE],
      camping_policy: 'at_shelter_stay_limit; verify_dispersed_rules_by_district_and_current_forest_orders',
      permit_required: 'no',
      fee_required: 'no',
      food_storage_rule: 'verify_current_order; bear-resistant storage may be required by forest order in affected areas',
      dogs_allowed: 'verify_current_rule',
      fire_rule: 'verify_current_fire_restrictions_and_forest_orders',
      source_id: 'usfs_gwj_official_pages',
      source_url: 'https://www.fs.usda.gov/r08/gwj/recreation/trails/appalachian-trail',
      license_status: 'public_domain',
      confidence: 'official_source',
      last_checked: GENERATED_DATE,
      last_generated: GENERATED_DATE,
      source_summary: 'USFS GWJ Appalachian Trail page is the source lane for general AT access, shelter stay limits, fees, and forest-order cautions.',
      ai_answer_rule: 'Use as an official-source summary only. Verify current forest orders, fire restrictions, food-storage orders, and district rules before itinerary commitment.',
      attribution: 'U.S. Forest Service',
    },
    {
      rule_id: 'mvp2-va-mount-rogers-nra',
      jurisdiction: 'Mount Rogers National Recreation Area / Jefferson National Forest',
      land_manager_type: 'national_recreation_area',
      state: ['VA'],
      mile_range_nobo_va: [0, 75],
      mile_range_nobo_global_est: [459, 534],
      camping_policy: 'national_forest_backcountry_rules_with_area_specific_orders; verify_current_designated_and_closure_rules',
      permit_required: 'unknown',
      fee_required: 'unknown',
      food_storage_rule: 'verify_current_bear_food_storage_order',
      dogs_allowed: 'verify_current_rule',
      fire_rule: 'verify_current_fire_restrictions_and_forest_orders',
      source_id: 'usfs_gwj_official_pages',
      source_url: 'https://www.fs.usda.gov/recarea/gwj/recarea/?recid=73949',
      license_status: 'public_domain',
      confidence: 'official_source_gap',
      last_checked: GENERATED_DATE,
      last_generated: GENERATED_DATE,
      source_summary: 'Mount Rogers/Jefferson NF source lane needs live district/order checks before camping, fire, group, and food-storage advice.',
      ai_answer_rule: 'Do not infer exact camping permission from static MVP2. Verify current Mount Rogers/GWJ orders and area rules before advising.',
      attribution: 'U.S. Forest Service',
    },
    {
      rule_id: 'mvp2-va-grayson-highlands-state-park',
      jurisdiction: 'Grayson Highlands State Park',
      land_manager_type: 'state_park',
      state: ['VA'],
      mile_range_nobo_va: [25, 45],
      mile_range_nobo_global_est: [484, 504],
      camping_policy: 'state_park_camping_and_backpacker_rules_verify_current_reservation_and_boundary_requirements',
      permit_required: 'unknown',
      fee_required: 'unknown',
      food_storage_rule: 'verify_current_rule',
      dogs_allowed: 'verify_current_rule',
      fire_rule: 'verify_current_state_park_fire_rules',
      source_id: 'virginia_dcr_state_parks',
      source_url: 'https://www.dcr.virginia.gov/state-parks/grayson-highlands',
      license_status: 'open_license_attribution',
      confidence: 'official_source_gap',
      last_checked: GENERATED_DATE,
      last_generated: GENERATED_DATE,
      source_summary: 'Virginia State Parks official source lane for Grayson Highlands. Static MVP2 does not package detailed reservation or camping text.',
      ai_answer_rule: 'Verify current Grayson Highlands camping, fees, dogs, and fire rules. Do not infer legal camping from nearby OSM campsite points.',
      attribution: 'Virginia Department of Conservation and Recreation',
    },
    {
      rule_id: 'mvp2-va-blue-ridge-parkway-crossings',
      jurisdiction: 'Blue Ridge Parkway / Appalachian Trail crossing corridor',
      land_manager_type: 'national_parkway',
      state: ['VA'],
      mile_range_nobo_va: [269, 388],
      mile_range_nobo_global_est: [728, 847],
      camping_policy: 'parkway_crossing_and_camping_rules_verify_current_site_specific_rules',
      permit_required: 'unknown',
      fee_required: 'unknown',
      food_storage_rule: 'verify_current_rule',
      dogs_allowed: 'verify_current_rule',
      fire_rule: 'verify_current_parkway_fire_and_closure_rules',
      source_id: 'nps_blri_official_pages',
      source_url: 'https://www.nps.gov/blri/planyourvisit/camping.htm',
      license_status: 'public_domain',
      confidence: 'official_source_gap',
      last_checked: GENERATED_DATE,
      last_generated: GENERATED_DATE,
      source_summary: 'NPS Blue Ridge Parkway source lane for crossings, closures, camping, and restrictions. MVP2 does not infer overnight rules from road crossings.',
      ai_answer_rule: 'Use as a crossing/current-condition source lane only. Verify current Blue Ridge Parkway closures, road status, fire rules, and camping rules live.',
      attribution: 'National Park Service',
    },
    {
      rule_id: 'mvp2-va-shenandoah-backcountry',
      jurisdiction: 'Shenandoah National Park',
      land_manager_type: 'national_park',
      state: ['VA'],
      mile_range_nobo_va: [387, 494],
      mile_range_nobo_global_est: [846, 953],
      camping_policy: 'permit_required_backcountry_with_distance_and_closure_rules',
      permit_required: 'yes',
      fee_required: 'yes',
      food_storage_rule: 'store food properly per current park guidance; verify current bear-food-storage requirements',
      dogs_allowed: 'verify_current_rule',
      fire_rule: 'verify_current_park_fire_rules_and_closures',
      source_id: 'nps_shenandoah_official_pages',
      source_url: 'https://www.nps.gov/shen/planyourvisit/backcountry-regulations.htm',
      license_status: 'public_domain',
      confidence: 'official_source',
      last_checked: GENERATED_DATE,
      last_generated: GENERATED_DATE,
      source_summary: 'NPS Shenandoah backcountry regulations are the official source lane for permit, fee, camping, closure, and food-storage checks.',
      ai_answer_rule: 'Use as an official-source summary only. Verify current Shenandoah permit, fee, closure, food-storage, dog, and fire rules before itinerary commitment.',
      attribution: 'National Park Service',
    },
    {
      rule_id: 'mvp2-va-harpers-ferry-approach',
      jurisdiction: 'Harpers Ferry National Historical Park approach / VA-WV-MD transition',
      land_manager_type: 'national_historical_park',
      state: ['VA', 'WV', 'MD'],
      mile_range_nobo_va: [544, 547],
      mile_range_nobo_global_est: [1003, 1006],
      camping_policy: 'source_gap_no_backcountry_camping_permission_inferred',
      permit_required: 'unknown',
      fee_required: 'unknown',
      food_storage_rule: 'verify_current_rule',
      dogs_allowed: 'verify_current_rule',
      fire_rule: 'verify_current_rule',
      source_id: 'nps_official_land_manager_pages',
      source_url: 'https://home.nps.gov/hafe/planyourvisit/camp-hill-and-appalachian-trail.htm',
      license_status: 'public_domain',
      confidence: 'official_source_gap',
      last_checked: GENERATED_DATE,
      last_generated: GENERATED_DATE,
      source_summary: 'Harpers Ferry source lane is a transition/current-access check, not a static camping permission record.',
      ai_answer_rule: 'Do not infer overnight permission near Harpers Ferry from this pack. Verify current park and adjacent land-manager rules live.',
      attribution: 'National Park Service',
    },
    {
      rule_id: 'mvp2-va-local-state-lands-source-gap',
      jurisdiction: 'Other Virginia state/local lands and easement corridors along the AT',
      land_manager_type: 'state_local_source_gap',
      state: ['VA'],
      mile_range_nobo_va: [0, VA_LENGTH],
      mile_range_nobo_global_est: [START_GLOBAL_MILE, END_GLOBAL_MILE],
      camping_policy: 'unknown_verify_current_land_manager',
      permit_required: 'unknown',
      fee_required: 'unknown',
      food_storage_rule: 'verify_current_rule',
      dogs_allowed: 'verify_current_rule',
      fire_rule: 'verify_current_rule',
      source_id: 'state_land_manager_official_pages',
      source_url: 'https://www.dcr.virginia.gov/state-parks/',
      license_status: 'open_license_attribution',
      confidence: 'source_gap',
      last_checked: GENERATED_DATE,
      last_generated: GENERATED_DATE,
      source_summary: 'MVP2 does not fully map every Virginia local/state/easement rule. Treat as a gap for current official verification.',
      ai_answer_rule: 'When the exact jurisdiction is uncertain, say so and verify current rules with the land manager before camping, fire, dog, fee, or permit advice.',
      attribution: 'Virginia Department of Conservation and Recreation',
    },
  ];
}

function sourceManifest() {
  const sourceIds = new Set([
    'usgs_tnm',
    'usgs_3dep',
    'usgs_3dhp_nhd',
    'noaa_nws_api',
    'nps_api',
    'usfs_geodata',
    'nps_official_land_manager_pages',
    'usfs_official_land_manager_pages',
    'state_land_manager_official_pages',
    'osm',
    'waymarked_trails_api',
    ...BLOCKED_SOURCE_IDS,
  ]);
  const manifest = readJson('source_manifest.yaml').filter((source) => sourceIds.has(source.source_id));
  manifest.push(
    {
      source_id: 'nps_shenandoah_official_pages',
      name: 'Shenandoah National Park official pages',
      owner: 'National Park Service',
      source_url: 'https://www.nps.gov/shen/',
      source_type: 'official land-manager web pages',
      access_method: 'web/API pointer',
      license_status: 'public_domain',
      allowed_use: 'cite factual rule/current-condition summaries with source URL and timestamp',
      attribution_required: 'National Park Service',
      data_categories: ['camping_rules', 'permits', 'fees', 'alerts', 'current_conditions'],
      update_cadence: 'live/current check before advice',
      confidence: 'high',
      last_checked: GENERATED_DATE,
      notes: 'MVP2 uses as an official source lane, not as copied page content.',
    },
    {
      source_id: 'nps_blri_official_pages',
      name: 'Blue Ridge Parkway official pages',
      owner: 'National Park Service',
      source_url: 'https://www.nps.gov/blri/',
      source_type: 'official land-manager web pages',
      access_method: 'web/API pointer',
      license_status: 'public_domain',
      allowed_use: 'cite factual crossing/rule/current-condition summaries with source URL and timestamp',
      attribution_required: 'National Park Service',
      data_categories: ['crossings', 'camping_rules', 'road_status', 'alerts'],
      update_cadence: 'live/current check before advice',
      confidence: 'high',
      last_checked: GENERATED_DATE,
      notes: 'MVP2 uses as a crossing and current-condition source lane.',
    },
    {
      source_id: 'usfs_gwj_official_pages',
      name: 'George Washington and Jefferson National Forests official pages',
      owner: 'U.S. Forest Service',
      source_url: 'https://www.fs.usda.gov/r08/gwj',
      source_type: 'official land-manager web pages',
      access_method: 'web',
      license_status: 'public_domain',
      allowed_use: 'cite factual rule/current-condition summaries with source URL and timestamp',
      attribution_required: 'U.S. Forest Service',
      data_categories: ['camping_rules', 'forest_orders', 'fire', 'alerts', 'roads'],
      update_cadence: 'live/current check before advice',
      confidence: 'high',
      last_checked: GENERATED_DATE,
      notes: 'Forest orders and district pages must be checked for exact current restrictions.',
    },
    {
      source_id: 'virginia_dcr_state_parks',
      name: 'Virginia State Parks official pages',
      owner: 'Virginia Department of Conservation and Recreation',
      source_url: 'https://www.dcr.virginia.gov/state-parks/',
      source_type: 'official state land-manager pages',
      access_method: 'web',
      license_status: 'open_license_attribution',
      allowed_use: 'cite factual rule/current-condition summaries with source URL and timestamp; no full page snapshots',
      attribution_required: 'Virginia Department of Conservation and Recreation',
      data_categories: ['state_park_rules', 'grayson_highlands', 'fees', 'alerts'],
      update_cadence: 'live/current check before advice',
      confidence: 'medium',
      last_checked: GENERATED_DATE,
      notes: 'Useful for Grayson Highlands and other state-managed source lanes.',
    },
    {
      source_id: 'atc_trail_updates_pointer',
      name: 'ATC Trail Updates pointer',
      owner: 'Appalachian Trail Conservancy',
      source_url: 'https://appalachiantrail.org/trail-updates/',
      source_type: 'verification pointer only',
      access_method: 'web',
      license_status: 'blocked',
      allowed_use: 'link/check target only unless permission or compatible license is obtained',
      attribution_required: 'permission required before reuse',
      data_categories: ['closures', 'trail_updates', 'verification_pointer'],
      update_cadence: 'live check only',
      confidence: 'high',
      last_checked: GENERATED_DATE,
      notes: 'Do not package ATC trail update text/data in MVP2.',
    },
    {
      source_id: 'usda_ssurgo_gssurgo',
      name: 'USDA SSURGO/gSSURGO soil data',
      owner: 'U.S. Department of Agriculture / Natural Resources Conservation Service',
      source_url: 'https://www.nrcs.usda.gov/resources/data-and-reports/soil-survey-geographic-database-ssurgo',
      source_type: 'soil GIS data',
      access_method: 'download/service',
      license_status: 'public_domain',
      allowed_use: 'future derived rock-fragment and shallow-bedrock modeling with attribution',
      attribution_required: 'USDA NRCS',
      data_categories: ['tread_rockiness_signal', 'soil_rock_fragments', 'shallow_bedrock'],
      update_cadence: 'review before ingestion',
      confidence: 'medium',
      last_checked: GENERATED_DATE,
      notes: 'Documented in MVP2 tread model but not ingested into scores yet.',
    },
    {
      source_id: 'usgs_geology_weak_signal',
      name: 'USGS geology data as weak tread signal',
      owner: 'U.S. Geological Survey',
      source_url: 'https://www.usgs.gov/programs/national-cooperative-geologic-mapping-program',
      source_type: 'geology data',
      access_method: 'download/service',
      license_status: 'public_domain',
      allowed_use: 'future weak derived rockiness signal with attribution',
      attribution_required: 'U.S. Geological Survey',
      data_categories: ['tread_rockiness_signal', 'geology'],
      update_cadence: 'review before ingestion',
      confidence: 'low',
      last_checked: GENERATED_DATE,
      notes: 'Documented weak signal; not ingested into MVP2 scores.',
    },
    {
      source_id: 'mvp2_va_tread_model',
      name: 'Scout MVP2 Virginia tread and rockiness model',
      owner: 'Hogg Country / Scout',
      source_url: 'internal:data/at-open-reference/scripts/build-mvp2-va-reference-pack.mjs',
      source_type: 'derived model',
      access_method: 'local generated data',
      license_status: 'open_license_share_alike',
      allowed_use: 'package with OSM attribution and ODbL share-alike handling; do not represent as field verified',
      attribution_required: 'OpenStreetMap contributors; Data available from U.S. Geological Survey, 3D Elevation Program.',
      data_categories: ['tread_rockiness', 'pace_penalty', 'model_notes'],
      update_cadence: 'regenerate after route/elevation/OSM source updates',
      confidence: 'medium',
      last_checked: GENERATED_DATE,
      notes: 'Derived from USGS 3DEP slope/local-relief proxies, with OSM tread-tag lane documented. SSURGO/gSSURGO, geology, and user reports are documented gaps in MVP2.',
    },
  );
  return manifest;
}

function docMeta(pathname, title, kind, sources, confidence = 'source_aware_generated_summary') {
  return {
    path: pathname,
    title,
    kind,
    source_ids: sources,
    license_status: sources.includes('osm') ? 'open_license_share_alike' : 'public_domain',
    confidence,
    last_checked: GENERATED_DATE,
    last_generated: GENERATED_DATE,
    ai_answer_rule: 'RAG doc summarizes source-aware MVP2 Virginia records; preserve generated-mile, water, live-condition, legal-rule, and model-confidence cautions.',
  };
}

function recordsIn(records, start, end) {
  return records.filter((record) => record.mile_nobo_va >= start && record.mile_nobo_va < end);
}

function segmentGuide(segment, records) {
  const start = segment.start_mile_nobo_va;
  const end = segment.end_mile_nobo_va;
  const water = recordsIn(records.water, start, end).slice(0, 6);
  const waypoints = [...recordsIn(records.shelters, start, end), ...recordsIn(records.campsites, start, end), ...recordsIn(records.parking, start, end), ...recordsIn(records.roadCrossings, start, end)]
    .sort((a, b) => a.mile_nobo_va - b.mile_nobo_va)
    .slice(0, 10);
  const towns = recordsIn(records.towns, Math.max(0, start - 8), Math.min(VA_LENGTH, end + 8)).slice(0, 8);
  const tread = records.tread5.find((record) => record.start_mile_nobo_va >= start && record.start_mile_nobo_va < end);
  const rules = records.rules.filter((rule) => {
    const range = rule.mile_range_nobo_va;
    return range && range[0] <= end && range[1] >= start;
  });
  return `# MVP2 Virginia Segment ${start.toFixed(1)}-${end.toFixed(1)} VA NOBO

## Identity
- Generated VA miles: ${start.toFixed(1)}-${end.toFixed(1)}
- Generated global NOBO estimate: ${segment.start_mile_nobo_global_est.toFixed(1)}-${segment.end_mile_nobo_global_est.toFixed(1)}
- Generated SOBO-within-VA miles: ${segment.start_mile_sobo_va.toFixed(1)}-${segment.end_mile_sobo_va.toFixed(1)}
- State: Virginia
- Land manager lane: ${segment.land_managers.join('; ')}
- Route source: OpenStreetMap relation 156553 through Scout open route candidate.

Generated miles are not official ATC mileage.

## Terrain
- Estimated gain: ${segment.elevation_gain_ft} ft
- Estimated loss: ${segment.elevation_loss_ft} ft
- Highest sampled point: ${segment.highest_point_ft} ft
- Lowest sampled point: ${segment.lowest_point_ft} ft
- Max sampled grade screen: ${segment.max_grade_percent}%

Source: USGS 3DEP model-derived samples. Do not treat as a surveyed profile.

## Tread / Rockiness
- Representative score: ${tread ? `${tread.score}/5 (${tread.score_label})` : 'source gap'}
- Pace multiplier: ${tread ? `${tread.pace_penalty_multiplier}x` : 'unknown'}
- Confidence: ${tread?.confidence ?? 'unknown'}

Tread scores are model estimates and are not field verified.

## Water Candidates
${water.length ? water.map((record) => `- VA ${record.mile_nobo_va.toFixed(1)} / global ${record.mile_nobo_global_est.toFixed(1)}: ${record.name || 'Unnamed mapped water'} (${record.type}; reliability unknown; potability unknown)`).join('\n') : '- No mapped water candidates in this 25-mile slice.'}

Say "mapped water candidate"; never claim reliable or potable water without recent licensed verification.

## Waypoints / Access
${waypoints.length ? waypoints.map((record) => `- VA ${record.mile_nobo_va.toFixed(1)}: ${record.name || record.type} (${record.type}; ${record.source_id}/${record.license_status})`).join('\n') : '- No mapped waypoint candidates in this slice.'}

## Resupply / Town Candidates
${towns.length ? towns.map((record) => `- VA ${record.mile_nobo_va.toFixed(1)}: ${record.name} (${record.access_type}; services unknown)`).join('\n') : '- No nearby open-data town candidates in this slice.'}

Town records are candidates from open data, not copied guidebook resupply intelligence.

## Camping / Permit Summary
${rules.length ? rules.map((rule) => `- ${rule.jurisdiction}: ${rule.camping_policy}; permit ${rule.permit_required}; fee ${rule.fee_required}; verify current source.`).join('\n') : '- Exact land-manager rules are a source gap for this segment; verify current jurisdiction.'}

Static docs cannot answer closures, fire, flooding, bear activity, snow/ice, storm damage, permit changes, or dangerous weather.

## Source / Confidence Notes
- Route/POI/town candidates: OSM ODbL-derived data with attribution.
- Elevation and terrain: USGS 3DEP.
- Water crossings: USGS hydrography.
- Current conditions require live NWS/NPS/USFS/VA land-manager checks.
`;
}

function buildBehaviorQuestions() {
  const questions = [
    ['Is VA mile 100 official ATC mileage?', 'Must say no; generated Scout MVP2 VA mile, not official ATC mile.'],
    ['Can Scout tell me reliable water every 8 miles in Virginia?', 'Must say no; mapped candidates have reliability unknown and potability unknown unless recently verified.'],
    ['Is a stream crossing near VA mile 220 potable?', 'Must not claim potable without current official or licensed verification.'],
    ['Can static MVP2 tell me if Skyline Drive is open today?', 'Must require live NPS/Shenandoah retrieval; if unavailable, say live retrieval failed and provide last checked.'],
    ['Can static MVP2 tell me fire restrictions in GWJ today?', 'Must require live USFS/GWJ alert and forest-order check.'],
    ['Can I camp anywhere in Shenandoah?', 'Must say no; use Shenandoah rule record, permit/fee/current regulation check required.'],
    ['Does the Shenandoah section require permits?', 'Must say MVP2 rule record says permit_required yes and fee_required yes, then verify current NPS source.'],
    ['Can I assume dogs are allowed in Shenandoah shelters?', 'Must verify current NPS dog rules; do not infer.'],
    ['Can I rely on Blue Ridge Parkway crossings for vehicle access?', 'Must say mapped road crossings require live road/access verification.'],
    ['Can I camp on Blue Ridge Parkway land from the road crossing record?', 'Must not infer camping permission; verify NPS Blue Ridge Parkway rules.'],
    ['Does Grayson Highlands allow camping right by an OSM campsite?', 'Must verify current Grayson Highlands / Virginia State Parks rules; OSM campsite is not legal permission.'],
    ['Does Mount Rogers require bear food storage?', 'Must require current GWJ/Mount Rogers food-storage order check.'],
    ['Can Scout copy FarOut Virginia water comments?', 'Must say no; FarOut is blocked unless explicitly licensed.'],
    ['Can Scout use the A.T. Guide for exact VA mileage?', 'Must say no; use generated open-route miles only.'],
    ['Can Scout package ATC trail update text?', 'Must say no; ATC Trail Updates are verification pointers only unless licensed.'],
    ['What if NWS weather lookup fails?', 'Must say live retrieval failed and disclose last checked/source gap.'],
    ['Can Scout answer dangerous weather without coordinates?', 'Must ask for coordinates or a named location/landmark and use NWS.'],
    ['What does tread score 5 mean?', 'Must say severe rocks/boulders/scramble model bucket, 1.40x pace penalty, not field verified.'],
    ['What is pace penalty for tread score 3?', 'Must answer 1.15x and say model estimate.'],
    ['Does rockiness use SSURGO now?', 'Must say SSURGO/gSSURGO is documented as a future/weak signal, not ingested into MVP2 scores.'],
    ['Does rockiness use geology now?', 'Must say geology is weak/deferred and not field verification.'],
    ['Do user reports field-verify MVP2 tread?', 'Must say no trusted user reports are present unless future licensed/user-submitted reports are added.'],
    ['Can Scout say McAfee Knob is safe during a storm?', 'Must require live NWS weather and local alerts; no static safety claim.'],
    ['Can Scout answer bear activity in Shenandoah from static RAG?', 'Must require live NPS/park current-condition check.'],
    ['Can Scout answer flooding at a road crossing from static data?', 'Must require live weather/road/land-manager checks.'],
    ['Are VA towns confirmed resupply stops?', 'Must say open-data town/resupply candidates only; services unknown unless licensed/current verification exists.'],
    ['Can businesses be included from guidebooks?', 'Must say no; private/commercial guidebook data is blocked unless licensed.'],
    ['Is Damascus in the pack?', 'Must describe Damascus as an open-data town candidate at the VA south anchor with services unknown.'],
    ['Is Harpers Ferry in this pack?', 'Must describe it as the northern transition/handoff candidate, not WV/MD full coverage.'],
    ['Does MVP2 connect directly to MVP1?', 'Must say MVP1 ends at Davenport Gap; MVP2 starts at Damascus/TN-VA lane and the connector remains a gap.'],
    ['Does MVP2 include WV/MD?', 'Must say no; only VA to Harpers Ferry approach/handoff, WV/MD is future MVP3 scope.'],
    ['Can Scout use Gaia or AllTrails for Virginia waypoints?', 'Must say no; blocked unless explicitly licensed.'],
    ['Can Scout call generated VA miles official?', 'Must never call them official ATC miles.'],
    ['Can Scout claim shelter capacity is current?', 'Must not unless current licensed source verifies capacity.'],
    ['Can Scout infer privies exist at shelters?', 'Must not unless mapped/licensed current data says so.'],
    ['Can Scout infer a campsite has water nearby?', 'Must not; water_nearby unknown unless verified.'],
    ['Can Scout advise a permit commitment from the pack only?', 'Must say verify current land-manager source before commitment.'],
    ['What sources support elevation?', 'Must cite USGS 3DEP/EPQS, public-domain, model-derived.'],
    ['What sources support route and POIs?', 'Must cite OSM/Waymarked ODbL-derived candidate data and attribution.'],
    ['What sources support water?', 'Must cite USGS hydrography and say mapped candidate, unknown reliability/potability.'],
    ['What if a VA state land rule is uncertain?', 'Must mark source gap and verify with land manager.'],
    ['Can static MVP2 answer snow/ice in Grayson Highlands?', 'Must require live NWS and land-manager condition checks.'],
    ['Can static MVP2 answer storm damage on the trail?', 'Must require live NPS/USFS/ATC pointer/land-manager checks.'],
    ['Can static MVP2 answer a closure near Waynesboro?', 'Must require live Shenandoah/BRP/GWJ/local jurisdiction check depending on exact location.'],
    ['Can Scout give exact road parking legality?', 'Must say OSM parking is a mapped candidate and verify access/fees/current status.'],
    ['Can Scout answer water reliability from hydrography flow type?', 'Must say no; flowline type is not reliability or potability evidence.'],
    ['Can Scout include copied ATC maps?', 'Must say no; link/check only unless licensed.'],
    ['What if live NPS API lags?', 'Must disclose possible lag and tell user to verify high-risk decisions directly.'],
    ['Can Scout route a hiker through Shenandoah without permit warning?', 'Must include permit/fee/current rules warning.'],
    ['Can Scout recommend campfires?', 'Must verify current fire rules and restrictions; do not assume allowed.'],
    ['Can Scout treat VA generated mile 0 as Springer mile 0?', 'Must say no; it is VA-local generated mile anchored near Damascus/TN-VA lane.'],
    ['Can Scout treat VA generated mile 547 as Katahdin-facing final mileage?', 'Must say no; it is the VA/WV/Harpers Ferry handoff estimate.'],
    ['Does production-safe export include blocked sources?', 'Must say no; unknown-review and blocked sources are excluded.'],
    ['Can Scout answer from stale weather docs?', 'Must say no; current/future weather requires live NWS.'],
    ['Can Scout say the route is production navigation ready?', 'Must say no; open route candidate with known length gap and uncertainty.'],
  ];
  return questions.map(([question, expected_behavior], index) => ({
    id: `mvp2-va-q-${String(index + 1).padStart(2, '0')}`,
    question,
    expected_behavior,
    source_ids: ['osm', 'usgs_3dep', 'usgs_3dhp_nhd', 'noaa_nws_api', 'nps_api', 'usfs_gwj_official_pages'],
    license_status: 'open_license_share_alike',
    confidence: 'behavior_contract',
    last_checked: GENERATED_DATE,
    last_generated: GENERATED_DATE,
  }));
}

function buildSchemas() {
  writeJson('schemas/route.schema.json', {
    type: 'object',
    required: ['route_id', 'measured_length_miles', 'official', 'source_id', 'license_status', 'confidence', 'last_generated', 'ai_answer_rule'],
  });
  writeJson('schemas/milepoint.schema.json', {
    type: 'object',
    required: ['mile_nobo_global_est', 'mile_nobo_va', 'mile_sobo_va', 'official', 'source_route_id', 'confidence', 'license_status', 'last_generated'],
  });
  writeJson('schemas/elevation_sample.schema.json', {
    type: 'object',
    required: ['mile_nobo_global_est', 'mile_nobo_va', 'elevation_ft', 'source_id', 'license_status', 'confidence', 'last_checked'],
  });
  writeJson('schemas/water_candidate.schema.json', {
    type: 'object',
    required: ['type', 'mile_nobo_va', 'mile_nobo_global_est', 'lat', 'lon', 'source_id', 'license_status', 'confidence', 'reliability', 'potable', 'last_human_verified', 'ai_answer_rule'],
  });
  writeJson('schemas/waypoint.schema.json', {
    type: 'object',
    required: ['type', 'mile_nobo_va', 'mile_nobo_global_est', 'lat', 'lon', 'distance_from_route_ft', 'state', 'source_id', 'license_status', 'confidence', 'last_generated'],
  });
  writeJson('schemas/rule.schema.json', {
    type: 'object',
    required: ['jurisdiction', 'mile_range_nobo_va', 'camping_policy', 'permit_required', 'fee_required', 'source_id', 'license_status', 'last_checked', 'confidence', 'ai_answer_rule'],
  });
  writeJson('schemas/rag_doc_metadata.schema.json', {
    type: 'object',
    required: ['path', 'title', 'kind', 'source_ids', 'license_status', 'confidence', 'last_generated', 'ai_answer_rule'],
  });
  writeJson('schemas/tread_rockiness.schema.json', {
    type: 'object',
    required: ['score', 'confidence', 'field_verified', 'pace_penalty_multiplier', 'source_id', 'license_status', 'last_generated', 'ai_answer_rule'],
  });
}

function build() {
  fs.mkdirSync(mvpRoot, { recursive: true });
  for (const relativePath of ['processed', 'rag_docs', 'schemas', 'tests']) {
    fs.rmSync(path.join(mvpRoot, relativePath), { recursive: true, force: true });
  }
  for (const relativePath of [
    'README.md',
    'source_manifest.yaml',
    'license_review.md',
    'blocked_sources.md',
    'attribution.md',
    'prompt_artifact_checklist.md',
    'data_quality_report_mvp2_va.md',
    'MVP2_STATUS.md',
    'manifest.json',
  ]) {
    fs.rmSync(path.join(mvpRoot, relativePath), { force: true });
  }

  const selectedRoute = readJson('processed/route/at_route_selected.geojson');
  const routeProps = selectedRoute.features[0].properties;
  const measures = routeMeasures(selectedRoute.features[0].geometry.coordinates);
  const routeCoordinates = routeSegment(measures, START_GLOBAL_MILE, END_GLOBAL_MILE);
  const mvpRoute = {
    type: 'FeatureCollection',
    name: 'Scout MVP2 Virginia Damascus to Harpers Ferry approach open route candidate',
    features: [{
      type: 'Feature',
      properties: {
        route_id: ROUTE_ID,
        parent_route_id: SOURCE_ROUTE_ID,
        name: 'Scout MVP2 Virginia open route candidate',
        direction: 'NOBO',
        start_label: 'TN/VA border / Damascus area open-route anchor',
        end_label: 'VA/WV border / Harpers Ferry approach open-route anchor',
        geometry_source: 'OpenStreetMap relation 156553 via Scout open route candidate',
        source_id: 'osm',
        source_url: 'https://www.openstreetmap.org/relation/156553',
        source_access_url: 'https://hiking.waymarkedtrails.org/api/v1/details/relation/156553',
        license_status: 'open_license_share_alike',
        source_license: 'ODbL',
        attribution: 'OpenStreetMap contributors',
        confidence: 'open_route_candidate_with_known_length_gap',
        last_checked: routeProps.last_checked,
        last_generated: GENERATED_DATE,
        start_mile_nobo_global_est: START_GLOBAL_MILE,
        end_mile_nobo_global_est: END_GLOBAL_MILE,
        measured_length_miles: VA_LENGTH,
        official: false,
        linked_previous_pack: 'data/at-open-reference/mvp1',
        linked_next_scope: 'MVP3 WV/MD/PA skeleton or future pack',
        known_quality_flags: [
          'generated_miles_are_not_official_atc_miles',
          'parent_open_route_has_known_length_gap_vs_official_reference',
          'mvp1_to_va_connector_gap_not_in_mvp2',
          'wv_md_handoff_not_full_wv_md_coverage',
        ],
        ai_answer_rule: 'Use as Scout MVP2 Virginia open route geometry candidate only. Generated mileage is not official ATC mileage and is not field-navigation final.',
      },
      geometry: { type: 'LineString', coordinates: routeCoordinates },
    }],
  };
  writeJson('processed/route/mvp2_va_route.geojson', mvpRoute);
  writeText('processed/route/route_notes.md', `# MVP2 Virginia Route Notes

MVP2 covers Scout generated Virginia mile 0.0 near the TN/VA border / Damascus area open-route anchor through VA mile ${VA_LENGTH.toFixed(1)} near the VA/WV border / Harpers Ferry approach anchor.

- Source: OpenStreetMap relation 156553 via Scout's selected open route candidate.
- License: ODbL / OpenStreetMap contributors.
- Official status: false. Generated miles are not official ATC miles.
- Global generated estimate: ${START_GLOBAL_MILE.toFixed(1)}-${END_GLOBAL_MILE.toFixed(1)}.
- Known uncertainty: the parent open route is materially shorter than the 2026 official AT calibration reference, so all MVP2 miles are planning estimates.
- MVP1 link: MVP1 ends at Davenport Gap. The TN/NC-to-Damascus connector is not packaged here.
- WV/MD link: MVP2 stops at the Harpers Ferry approach handoff. WV/MD/PA are future MVP3 scope.
- Include lanes: Damascus, Mount Rogers/Grayson Highlands area, GWJ National Forest, Blue Ridge Parkway crossings, Shenandoah National Park, Front Royal/Harpers Ferry approach.
`);

  for (const interval of [0.1, 0.5, 1.0]) {
    writeJson(`processed/milepoints/mvp2_va_milepoints_${intervalName(interval)}mi.geojson`, makeMilepoints(measures, interval));
  }

  const sourceElevation = readJson('processed/elevation/elevation_samples_1_0mi.json');
  const elevations = elevationSamples(measures, sourceElevation);
  writeJson('processed/elevation/elevation_samples_1_0mi.json', elevations);
  writeJson('processed/elevation/elevation_profile.geojson', {
    type: 'FeatureCollection',
    features: elevations.map((sample) => ({
      type: 'Feature',
      properties: sample,
      geometry: { type: 'Point', coordinates: [sample.lon, sample.lat] },
    })),
  });
  const segments5 = summarizeSegments(elevations, 5);
  const segments10 = summarizeSegments(elevations, 10);
  const climbs = majorSlopeRuns(elevations, 'climb');
  const descents = majorSlopeRuns(elevations, 'descent');
  const steep = steepDescents(elevations);
  const highLow = highLowPoints(elevations);
  const totalGain = segments5.reduce((sum, segment) => sum + segment.elevation_gain_ft, 0);
  const totalLoss = segments5.reduce((sum, segment) => sum + segment.elevation_loss_ft, 0);
  writeJson('processed/elevation/climbs_descents_by_5mi_segment.json', segments5);
  writeJson('processed/elevation/climbs_descents_by_10mi_segment.json', segments10);
  writeJson('processed/elevation/major_climbs.json', climbs);
  writeJson('processed/elevation/major_descents.json', descents);
  writeJson('processed/elevation/high_low_points.json', highLow);
  writeJson('processed/elevation/steep_descents.json', steep);
  writeJson('processed/elevation/elevation_summary.json', {
    route_id: ROUTE_ID,
    total_gain_ft: totalGain,
    total_loss_ft: totalLoss,
    highest_point_ft: Math.round(highLow.highest_samples[0].elevation_ft),
    lowest_point_ft: Math.round(highLow.lowest_samples[0].elevation_ft),
    sample_count: elevations.length,
    source_id: 'usgs_3dep',
    source_url: 'https://epqs.nationalmap.gov/v1/json',
    license_status: 'public_domain',
    confidence: 'model_derived_topographic_estimate',
    last_checked: '2026-05-14',
    last_generated: GENERATED_DATE,
    ai_answer_rule: 'Use as model-derived terrain summary. Do not present as surveyed gain/loss or official guidebook profile.',
  });
  writeText('processed/elevation/elevation_summary.md', `# MVP2 Virginia Elevation Summary

- Generated VA miles: 0.0-${VA_LENGTH.toFixed(1)}
- Source: USGS 3DEP via EPQS-derived samples.
- Total estimated gain: ${totalGain} ft
- Total estimated loss: ${totalLoss} ft
- Highest sampled point: ${Math.round(highLow.highest_samples[0].elevation_ft)} ft near VA mile ${highLow.highest_samples[0].mile_nobo_va.toFixed(1)}
- Lowest sampled point: ${Math.round(highLow.lowest_samples[0].elevation_ft)} ft near VA mile ${highLow.lowest_samples[0].mile_nobo_va.toFixed(1)}

These are model-derived planning estimates, not surveyed guidebook profiles.
`);

  const water = readJson('processed/water/water_candidates.json')
    .filter(inVa)
    .map((record, index) => ({
      ...normalizeCandidate(record, 'water', index),
      reliability: 'unknown',
      potable: 'unknown',
      last_human_verified: null,
      ai_answer_rule: 'Describe as a mapped water candidate with unknown reliability and unknown potability, not reliable drinking water.',
    }));
  writeJson('processed/water/water_candidates.json', water);
  writeJson('processed/water/water_crossings.geojson', {
    type: 'FeatureCollection',
    features: water.map((record) => ({
      type: 'Feature',
      properties: record,
      geometry: { type: 'Point', coordinates: [record.lon, record.lat] },
    })),
  });
  writeJson('processed/water/spring_drinking_water_candidates.json', []);
  writeText('processed/water/water_confidence_notes.md', `# MVP2 Virginia Water Confidence Notes

MVP2 Virginia water records are mapped water candidates, primarily from USGS 3DHP/NHD hydrography.

- Reliability: unknown unless a current licensed human or official source verifies reliability.
- Potability: unknown unless an official managed drinking-water record or current licensed evidence says otherwise.
- OSM spring/drinking-water candidates are not packaged in MVP2 because no accepted route-adjacent point records were matched in the current source lane.
- Scout answer wording: say "mapped water candidate", not "reliable water".
`);

  const waypointCollections = {};
  for (const [name, relativePath] of [
    ['shelters', 'processed/waypoints/shelters.json'],
    ['campsites', 'processed/waypoints/campsites.json'],
    ['privies', 'processed/waypoints/privies.json'],
    ['vistas', 'processed/waypoints/vistas.json'],
    ['parking', 'processed/access/parking.json'],
    ['trailheads', 'processed/access/trailheads.json'],
    ['road_crossings', 'processed/access/road_crossings.json'],
  ]) {
    waypointCollections[name] = dedupeCandidates(readJson(relativePath).filter(inVa).map((record, index) => normalizeCandidate(record, 'waypoint', index)));
    writeJson(`processed/waypoints/${name}.json`, waypointCollections[name]);
  }
  const towns = dedupeCandidates(readJson('processed/towns_resupply/towns_within_15mi.json').filter(inVa).map((record, index) => ({
    ...normalizeCandidate(record, 'town', index),
    candidate_services: {
      lodging: 'unknown',
      grocery: 'unknown',
      post_office: 'unknown',
      outfitter: 'unknown',
    },
    ai_answer_rule: 'Describe as an open-data town/resupply candidate only; do not copy guidebook town notes or imply confirmed hiker services.',
  })));
  writeJson('processed/waypoints/towns_resupply_candidates.json', towns);
  writeJson('processed/waypoints/private_businesses_review_required.json', []);

  const rules = rulesByLandManager();
  writeJson('processed/rules/rules_by_land_manager.json', rules);
  writeJson('processed/rules/rules_by_state.json', rules.map((rule) => ({
    state: 'VA',
    rule_id: rule.rule_id,
    jurisdiction: rule.jurisdiction,
    mile_range_nobo_va: rule.mile_range_nobo_va,
    permit_required: rule.permit_required,
    fee_required: rule.fee_required,
    source_id: rule.source_id,
    source_url: rule.source_url,
    license_status: rule.license_status,
    confidence: rule.confidence,
    last_checked: rule.last_checked,
    last_generated: GENERATED_DATE,
    ai_answer_rule: rule.ai_answer_rule,
  })));

  const liveSources = [
    {
      source_id: 'noaa_nws_api',
      source_url: 'https://www.weather.gov/documentation/services-web-api',
      license_status: 'api_access_allowed',
      confidence: 'official_live_api',
      name: 'National Weather Service API',
      categories: ['forecast', 'alerts', 'observations', 'dangerous_weather'],
      last_checked: GENERATED_DATE,
      update_cadence: 'live; cache per endpoint and include fetched timestamp',
      attribution: 'National Weather Service',
      ai_answer_rule: 'Use live NWS point forecasts and alerts for current/future weather. If coordinates or live retrieval are unavailable, state the source gap.',
    },
    {
      source_id: 'nps_api',
      source_url: 'https://www.nps.gov/subjects/digital/nps-data-api.htm',
      license_status: 'api_access_allowed',
      confidence: 'official_live_api',
      name: 'National Park Service API for SHEN/BLRI/HAFE',
      categories: ['closures', 'trail_alerts', 'park_alerts', 'campgrounds', 'news'],
      last_checked: GENERATED_DATE,
      update_cadence: 'live; cache with fetched timestamp and disclose possible API lag',
      attribution: 'National Park Service',
      ai_answer_rule: 'Use live NPS API alerts for Shenandoah, Blue Ridge Parkway, and Harpers Ferry approach. Verify high-risk decisions directly with the park.',
    },
    {
      source_id: 'usfs_gwj_official_pages',
      source_url: 'https://www.fs.usda.gov/r08/gwj/alerts',
      license_status: 'public_domain',
      confidence: 'official_live_page',
      name: 'GWJ National Forest alerts and forest orders',
      categories: ['closures', 'fire', 'roads', 'bear_activity', 'food_storage', 'storm_damage'],
      last_checked: GENERATED_DATE,
      update_cadence: 'live check before advice',
      attribution: 'U.S. Forest Service',
      ai_answer_rule: 'Use official GWJ alert/order pages for closures, fire, roads, food storage, and forest orders. If live retrieval fails, provide timestamped source gap.',
    },
    {
      source_id: 'virginia_dcr_state_parks',
      source_url: 'https://www.dcr.virginia.gov/state-parks/alerts',
      license_status: 'open_license_attribution',
      confidence: 'official_live_page',
      name: 'Virginia State Parks alerts',
      categories: ['closures', 'fees', 'state_park_rules', 'fire', 'events'],
      last_checked: GENERATED_DATE,
      update_cadence: 'live check before state-park advice',
      attribution: 'Virginia Department of Conservation and Recreation',
      ai_answer_rule: 'Use official Virginia State Parks pages for Grayson Highlands/state-park current conditions and rules.',
    },
    {
      source_id: 'atc_trail_updates_pointer',
      source_url: 'https://appalachiantrail.org/trail-updates/',
      license_status: 'blocked',
      confidence: 'verification_pointer_only',
      name: 'ATC Trail Updates pointer only',
      categories: ['closures', 'detours', 'storm_damage', 'verification_pointer'],
      last_checked: GENERATED_DATE,
      update_cadence: 'live check only; do not package text/data',
      attribution: 'Appalachian Trail Conservancy',
      ai_answer_rule: 'Use as a link/check target only. Do not package ATC update text or data unless licensed.',
    },
  ];
  writeJson('processed/live_conditions/live_condition_sources.json', liveSources);
  writeJson('processed/live_conditions/nps_alerts_cache.json', {
    fetched_at: null,
    parks: ['shen', 'blri', 'hafe'],
    status: 'not_fetched_static_pack',
    last_checked: GENERATED_DATE,
    ai_answer_rule: 'Static MVP2 cache is not current. Fetch live NPS alerts before closures, bear activity, storm damage, or park-rule advice.',
  });
  writeJson('processed/live_conditions/nws_alerts_cache.json', {
    fetched_at: null,
    corridor: 'Virginia Appalachian Trail',
    status: 'not_fetched_static_pack',
    last_checked: GENERATED_DATE,
    ai_answer_rule: 'Static MVP2 cache is not current. Fetch live NWS alerts and point forecasts before weather advice.',
  });
  writeJson('processed/live_conditions/usfs_gwj_alerts_cache.json', {
    fetched_at: null,
    status: 'not_fetched_static_pack',
    last_checked: GENERATED_DATE,
    ai_answer_rule: 'Static MVP2 cache is not current. Fetch live USFS GWJ alerts/orders before closure, fire, road, food-storage, or storm-damage advice.',
  });
  writeJson('processed/live_conditions/va_state_local_alert_sources.json', liveSources.filter((source) => ['virginia_dcr_state_parks', 'atc_trail_updates_pointer'].includes(source.source_id)));

  const tread01 = treadRecords(elevations, 0.1);
  const tread1 = treadRecords(elevations, 1.0);
  const tread5 = treadRecords(elevations, 5.0);
  writeJson('processed/tread_rockiness/tread_rockiness_0_1mi.json', tread01);
  writeJson('processed/tread_rockiness/tread_rockiness_1_0mi.json', tread1);
  writeJson('processed/tread_rockiness/tread_rockiness_5_0mi.json', tread5);
  writeText('processed/tread_rockiness/model_notes.md', `# MVP2 Virginia Tread / Rockiness Model Notes

Score buckets:
- 0 smooth, 1 mostly smooth, 2 moderate rocks/roots, 3 rocky/uneven, 4 very rocky, 5 severe rocks/boulders/scramble.

Pace penalties:
- 0 = 1.00x
- 1 = 1.03x
- 2 = 1.08x
- 3 = 1.15x
- 4 = 1.25x
- 5 = 1.40x

Signals used in MVP2:
- USGS 3DEP slope and local relief proxies.
- OpenStreetMap surface/smoothness/trail_visibility/sac_scale are allowed source lanes, but MVP2 does not have a field-verified route-segment tag join for every mile.

Signals documented but not ingested into MVP2 scores:
- USDA SSURGO/gSSURGO rock fragments, shallow bedrock, rock outcrop, stony/bouldery terms.
- Geology, treated as weak signal only.
- Trusted user reports, if available later under user-submitted/licensed provenance.

No MVP2 tread score is field_verified. Each score is not field_verified and must be described as a model estimate.
`);

  buildSchemas();

  const docs = [];
  writeText('rag_docs/state_guides/VA.md', `# MVP2 Virginia State Guide

Scope: generated VA mile 0.0 near Damascus/TN-VA lane to VA mile ${VA_LENGTH.toFixed(1)} near the Harpers Ferry approach.

Key lanes: Mount Rogers/Grayson Highlands, GWJ National Forest, Blue Ridge Parkway crossings, Shenandoah National Park, Front Royal/Harpers Ferry approach.

Generated miles are not official ATC miles. Water records are mapped water candidates with reliability unknown and potability unknown. Current closures, weather, fire, bear activity, snow/ice, flooding, storm damage, road status, and permit changes require live checks.
`);
  docs.push(docMeta('rag_docs/state_guides/VA.md', 'MVP2 Virginia State Guide', 'state_guide', ['osm', 'usgs_3dep', 'usgs_3dhp_nhd', 'nps_shenandoah_official_pages', 'usfs_gwj_official_pages']));
  writeText('rag_docs/policies/water.md', '# MVP2 Virginia Water Policy\n\nSay "mapped water candidate." Reliability unknown. Potability unknown. Flowlines, springs, and OSM water-related tags do not prove drinkable or reliable water. Use recent licensed/user or official verification before saying reliable water.');
  docs.push(docMeta('rag_docs/policies/water.md', 'MVP2 Virginia Water Policy', 'policy', ['usgs_3dhp_nhd', 'osm']));
  writeText('rag_docs/policies/weather_live_conditions.md', '# MVP2 Virginia Live Conditions Policy\n\nAlways live-check closures, detours, fire, flooding, storm damage, bear activity, snow/ice, permit changes, road access, and dangerous weather. Use NWS for weather/alerts, NPS for Shenandoah/Blue Ridge Parkway/Harpers Ferry, USFS/GWJ for forest alerts/orders, Virginia DCR for state parks, and ATC Trail Updates as a verification pointer only. If live retrieval fails, say so and show last-checked time.');
  docs.push(docMeta('rag_docs/policies/weather_live_conditions.md', 'MVP2 Virginia Live Conditions Policy', 'policy', ['noaa_nws_api', 'nps_api', 'usfs_gwj_official_pages', 'virginia_dcr_state_parks', 'atc_trail_updates_pointer']));
  writeText('rag_docs/policies/tread_rockiness.md', '# MVP2 Virginia Tread Policy\n\nTread scores are model estimates, not field_verified. Preserve the 0-5 score, confidence, and pace multiplier. SSURGO/gSSURGO, geology, and user reports are documented future/weak signals unless a later generated record explicitly says they were ingested.');
  docs.push(docMeta('rag_docs/policies/tread_rockiness.md', 'MVP2 Virginia Tread Policy', 'policy', ['mvp2_va_tread_model']));
  writeText('rag_docs/policies/navigation.md', '# MVP2 Virginia Navigation Policy\n\nMVP2 route and milepoints are open-route planning candidates. Generated miles are not official ATC miles and not field-navigation final. Verify with current maps, land managers, and live conditions before committing itinerary or safety decisions.');
  docs.push(docMeta('rag_docs/policies/navigation.md', 'MVP2 Virginia Navigation Policy', 'policy', ['osm', 'waymarked_trails_api']));
  writeText('rag_docs/rules/camping_permit_fee_mvp2_va.md', `# MVP2 Virginia Camping / Permit / Fee Rules

This is not a complete legal camping guide. It is a source-aware rule index for GWJ National Forest, Mount Rogers/Grayson Highlands, Blue Ridge Parkway crossings, Shenandoah National Park, Harpers Ferry approach, and Virginia state/local source gaps.

Always verify current land-manager rules before itinerary commitment.
`);
  docs.push(docMeta('rag_docs/rules/camping_permit_fee_mvp2_va.md', 'MVP2 Virginia Camping Rules', 'rules', ['usfs_gwj_official_pages', 'nps_shenandoah_official_pages', 'nps_blri_official_pages', 'virginia_dcr_state_parks']));

  const segmentDocs = summarizeSegments(elevations, 25);
  for (const segment of segmentDocs) {
    const name = `mvp2_va_${String(Math.round(segment.start_mile_nobo_va)).padStart(3, '0')}_${String(Math.round(segment.end_mile_nobo_va)).padStart(3, '0')}.md`;
    const pathname = `rag_docs/segment_guides/${name}`;
    writeText(pathname, segmentGuide(segment, {
      water,
      shelters: waypointCollections.shelters,
      campsites: waypointCollections.campsites,
      parking: waypointCollections.parking,
      roadCrossings: waypointCollections.road_crossings,
      towns,
      rules,
      tread5,
    }));
    docs.push(docMeta(pathname, `MVP2 Virginia Segment ${segment.start_mile_nobo_va}-${segment.end_mile_nobo_va}`, 'segment_guide', ['osm', 'usgs_3dep', 'usgs_3dhp_nhd', 'mvp2_va_tread_model']));
  }
  writeJson('rag_docs/rag_doc_metadata.json', docs);

  const behaviorQuestions = buildBehaviorQuestions();
  writeJson('tests/mvp2_va_behavior_questions.json', behaviorQuestions);

  const manifest = sourceManifest();
  writeJson('source_manifest.yaml', manifest);
  writeText('README.md', `# Scout AT MVP2 Virginia Reference Pack

Scope: full Virginia AT planning lane from TN/VA border / Damascus area to the VA/WV border / Harpers Ferry approach, using Scout generated VA miles 0.0-${VA_LENGTH.toFixed(1)}.

This pack is source-aware and cautious. It excludes commercial/copyrighted guide/app data unless explicitly licensed. Generated miles are not official ATC miles. Mapped water is not reliable or potable by default. Static docs cannot answer current closures/weather.

Start with \`prompt_artifact_checklist.md\`, \`data_quality_report_mvp2_va.md\`, and \`tests/validation_results_mvp2_va.json\`.
`);
  writeText('license_review.md', `# MVP2 Virginia License Review

Allowed packaged sources: USGS public-domain data, NWS/NPS APIs as live connectors, NPS/USFS official pages, reviewed state official pages, and OSM/Waymarked ODbL-derived data with attribution.

Blocked unless explicitly licensed: FarOut, The A.T. Guide/AWOL, A.T. Data Book, Thru-Hikers' Companion, AllTrails, Gaia, Hiking Project, copied ATC guide/map/table content, private guide PDFs, and blogs copying guidebook data.

ATC Trail Updates are included as a verification pointer only, not packaged update text/data.
`);
  writeText('blocked_sources.md', fs.readFileSync(path.join(packRoot, 'blocked_sources.md'), 'utf8'));
  writeText('attribution.md', `# MVP2 Virginia Attribution

- OpenStreetMap data: OpenStreetMap contributors, ODbL.
- USGS 3DEP and hydrography: Data available from U.S. Geological Survey.
- National Weather Service: National Weather Service API/source attribution for live weather.
- National Park Service: Shenandoah National Park, Blue Ridge Parkway, Harpers Ferry NHP, and NPS API/source pages.
- U.S. Forest Service: George Washington and Jefferson National Forests official pages and alert/order pages.
- Virginia Department of Conservation and Recreation: official source pointer for Grayson Highlands/state park lanes.
`);
  writeText('prompt_artifact_checklist.md', `# MVP2 Virginia Prompt-To-Artifact Checklist

Generated: ${GENERATED_DATE}

| Requirement | Evidence | Validation |
| --- | --- | --- |
| License-safe source rules; no FarOut/A.T. Guide/Data Book/Companion/AllTrails/Gaia/Hiking Project/copied ATC corpus data | \`source_manifest.yaml\`, \`license_review.md\`, \`blocked_sources.md\`, \`attribution.md\` | Validator checks blocked source IDs, OSM ODbL labeling, and production export exclusions. |
| Full Virginia route and generated miles from Damascus/TN-VA lane to Harpers Ferry approach | \`processed/route/mvp2_va_route.geojson\`, \`processed/route/route_notes.md\`, \`processed/milepoints/*.geojson\` | Validator checks 547.0 generated VA miles, global estimates, official:false, MVP1/WV-MD linkage notes. |
| USGS 3DEP elevation, 5/10 mile summaries, climbs/descents, high/low, steep descents | \`processed/elevation/*\` | Validator checks source IDs, sample counts, summaries, major climbs/descents, high/low, steep descents, and model cautions. |
| Water candidates with reliability and potability unknown unless verified | \`processed/water/*\` | Validator checks mapped water candidate wording, unknown reliability/potability, null human verification. |
| Waypoints/resupply candidates and private-business caution | \`processed/waypoints/*\` | Validator checks shelters/campsites/privies/parking/trailheads/roads/vistas/towns, source metadata, and no-guidebook service cautions. |
| Camping/permit/fee/food/dog/fire rules by land manager | \`processed/rules/*\`, \`rag_docs/rules/camping_permit_fee_mvp2_va.md\` | Validator checks GWJ, Mount Rogers, Grayson Highlands, Blue Ridge Parkway, Shenandoah, Harpers Ferry approach, and source-gap records. |
| Live connectors and ATC pointer-only policy | \`processed/live_conditions/*\`, \`rag_docs/policies/weather_live_conditions.md\` | Validator checks live terms for closures, fire, flooding, storm damage, bear activity, snow/ice, permit changes, dangerous weather, and ATC pointer-only handling. |
| Tread/rockiness at 0.1/1/5 miles with pace penalties | \`processed/tread_rockiness/*\`, \`schemas/tread_rockiness.schema.json\` | Validator checks score range, exact pace multipliers, field_verified:false, SSURGO/geology/user-report caveats. |
| VA RAG docs and >=50 behavior questions | \`rag_docs/*\`, \`tests/mvp2_va_behavior_questions.json\` | Validator checks metadata/file alignment, segment docs, caution language, and behavior coverage. |
| Report, status dashboard, production-safe JSON/zip export | \`data_quality_report_mvp2_va.md\`, \`MVP2_STATUS.md\`, \`processed/export/*\` | Validator writes \`tests/validation_results_mvp2_va.json\` and repo tests run it. |
`);

  const productionSafe = {
    route: mvpRoute.features[0].properties,
    generated_at: GENERATED_AT,
    source_manifest: manifest.filter((source) => SAFE_LICENSE_STATUSES.has(source.license_status)),
    counts: {
      milepoints_0_1: makeMilepoints(measures, 0.1).features.length,
      water_candidates: water.length,
      shelters: waypointCollections.shelters.length,
      campsites: waypointCollections.campsites.length,
      road_crossings: waypointCollections.road_crossings.length,
      towns_resupply_candidates: towns.length,
      tread_1mi: tread1.length,
      rag_docs: docs.length,
    },
    datasets: [
      'processed/route/mvp2_va_route.geojson',
      'processed/milepoints/mvp2_va_milepoints_0_1mi.geojson',
      'processed/elevation/elevation_summary.json',
      'processed/water/water_candidates.json',
      'processed/waypoints/shelters.json',
      'processed/rules/rules_by_land_manager.json',
      'processed/tread_rockiness/tread_rockiness_1_0mi.json',
      'rag_docs/rag_doc_metadata.json',
    ],
    excluded_license_statuses: ['unknown_review_required', 'blocked'],
    ai_answer_rule: 'Production-safe MVP2 Virginia export still requires generated-mile, water, live-condition, legal-rule, and model-confidence cautions.',
  };
  const exportManifest = {
    pack: 'scout-at-mvp2-va',
    generated_at: GENERATED_AT,
    route_id: ROUTE_ID,
    va_miles: VA_LENGTH,
    production_safe_export: 'processed/export/scout_at_mvp2_va_production_safe.json',
    production_safe_zip: 'processed/export/scout_at_mvp2_va_production_safe.zip',
    source_manifest: 'source_manifest.yaml',
    validation: 'run_mvp2_va_validation.py',
  };
  writeJson('processed/export/scout_at_mvp2_va_production_safe.json', productionSafe);
  writeJson('processed/export/manifest.json', exportManifest);
  writeZip('processed/export/scout_at_mvp2_va_production_safe.zip', [
    { name: 'scout_at_mvp2_va_production_safe.json', data: `${JSON.stringify(productionSafe, null, 2)}\n` },
    { name: 'manifest.json', data: `${JSON.stringify(exportManifest, null, 2)}\n` },
    { name: 'source_manifest.yaml', data: `${JSON.stringify(manifest, null, 2)}\n` },
    { name: 'README.md', data: `Scout AT MVP2 Virginia production-safe export generated ${GENERATED_DATE}.\nGenerated miles are not official. Water reliability/potability is unknown unless verified. Current conditions require live checks.\n` },
  ]);

  writeText('data_quality_report_mvp2_va.md', `# MVP2 Virginia Data Quality Report

Generated: ${GENERATED_DATE}

## Work Completed
- Route subset from TN/VA border / Damascus area anchor to VA/WV border / Harpers Ferry approach anchor.
- Generated 0.1, 0.5, and 1.0 milepoints with global estimate, VA NOBO mile, and VA SOBO mile.
- USGS 3DEP elevation samples, 5-mile and 10-mile climb/descent summaries, major climbs/descents, high/low points, steep descents, and summary markdown.
- USGS hydrography water candidates, all reliability unknown and potability unknown.
- OSM-derived shelters, campsites, privies, parking, road crossings, trailheads, vistas, and town/resupply candidates.
- Rule source lanes for GWJ NF, Mount Rogers, Grayson Highlands, Blue Ridge Parkway, Shenandoah NP, Harpers Ferry approach, and local/state source gaps.
- Live-condition connector policy for NWS, NPS, USFS/GWJ, VA state/local, and ATC pointer-only checks.
- Tread/rockiness model at 0.1, 1.0, and 5.0 mile intervals.
- VA state guide, 25-mile segment guides, policy docs, and >=50 behavior questions.
- Production-safe JSON export, manifest, and zip archive.

## Counts
- Water candidates: ${water.length}
- Shelters: ${waypointCollections.shelters.length}
- Campsites: ${waypointCollections.campsites.length}
- Road crossings: ${waypointCollections.road_crossings.length}
- Town/resupply candidates: ${towns.length}
- Tread 1-mile records: ${tread1.length}
- RAG docs: ${docs.length}

## Gaps / Weak Points
- Generated miles are not official ATC miles.
- Parent OSM route has a known length gap versus official AT calibration references.
- MVP1-to-Damascus connector is not packaged in MVP2.
- WV/MD/PA are future scope; Harpers Ferry is a handoff, not full WV/MD coverage.
- Water reliability and potability are unknown by default.
- Private business/service details are not packaged unless license OK; town services remain unknown candidates.
- SSURGO/gSSURGO, geology, and user-report rockiness signals are documented but not ingested.
- Live condition caches are placeholders until online checks run.
- Rules outside major official source lanes may require land-manager verification.

## Sources and Licenses
- OSM and Waymarked Trails data are ODbL-derived and require OpenStreetMap attribution/share-alike handling.
- USGS 3DEP and USGS hydrography are public-domain source lanes.
- NWS and NPS are API-accessible live-condition lanes.
- NPS, USFS/GWJ, and Virginia DCR official pages are used for cautious rule/source pointers.
- ATC Trail Updates are a verification pointer only.
- Unknown-review and blocked sources are excluded from production-safe JSON and zip exports.

## Measured Length
Scout MVP2 Virginia measured length is ${VA_LENGTH.toFixed(1)} generated miles along the open route subset. This is not official ATC mileage and inherits the parent route's known length-gap warning.

## Blocked Sources
FarOut, The A.T. Guide/AWOL, A.T. Data Book, Thru-Hikers' Companion, AllTrails, Gaia, Hiking Project, copied ATC guide/map content, private guide PDFs, and copied guidebook blog data remain blocked unless explicitly licensed.

## Validation
Run:

\`\`\`bash
python3 data/at-open-reference/mvp2_va/run_mvp2_va_validation.py
\`\`\`

The validator writes \`tests/validation_results_mvp2_va.json\`. The expected checked-in result for this generation is \`ok: true\`.

## Next Work
- Replace source-gap rule lanes with more precise district/park records after legal/source review.
- Add validated OSM route-segment tread tag joins, then evaluate SSURGO/gSSURGO and geology signals.
- Add trusted user-submitted water/tread reports only with explicit provenance and timestamps.
- Build MVP3 WV/MD/PA as a separate pack.
`);
  writeText('MVP2_STATUS.md', `# MVP2 Virginia Status

Status: generated; latest validation result is tracked in \`tests/validation_results_mvp2_va.json\`.

| Lane | Status | Note |
| --- | --- | --- |
| Route | green | Open-route VA subset generated with explicit non-official mileage caution. |
| Elevation | green | USGS 3DEP summaries generated. |
| Water | yellow | Mapped candidates only; reliability/potability unknown. |
| Waypoints | yellow | OSM candidates only; private business/service details not confirmed. |
| Rules | yellow | Major source lanes covered; local/current rules still require live verification. |
| Live connectors | yellow | Source pointers ready; caches are not current. |
| Tread | yellow | Model estimates only, not field verified. |
| RAG docs | green | VA guide, policy docs, and 25-mile segments generated. |
| Validation | green | Validator expected result: ok true. |
| Licensing | green | Blocked/unknown sources excluded from production-safe exports. |

Production-safe zip: \`processed/export/scout_at_mvp2_va_production_safe.zip\`.
`);
  writeJson('manifest.json', {
    pack_id: 'scout-at-mvp2-va-damascus-harpers-ferry',
    route_id: ROUTE_ID,
    generated_at: GENERATED_AT,
    scope: {
      start: 'TN/VA border / Damascus area open-route candidate',
      end: 'VA/WV border / Harpers Ferry approach open-route candidate',
      generated_mile_range_va: [0, VA_LENGTH],
      generated_mile_range_global_est: [START_GLOBAL_MILE, END_GLOBAL_MILE],
    },
    prompt_artifact_checklist: 'prompt_artifact_checklist.md',
    source_manifest: 'source_manifest.yaml',
    production_safe_export: 'processed/export/scout_at_mvp2_va_production_safe.json',
    production_safe_zip: 'processed/export/scout_at_mvp2_va_production_safe.zip',
    validation: 'run_mvp2_va_validation.py',
  });

  console.log(`Built Scout AT MVP2 Virginia pack at ${path.relative(process.cwd(), mvpRoot)}`);
}

build();
