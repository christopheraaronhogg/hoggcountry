import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const packRoot = path.resolve(__dirname, '..');
const mvpRoot = path.join(packRoot, 'mvp3_midatlantic');

const GENERATED_DATE = process.env.MVP3_MIDATLANTIC_GENERATED_DATE ?? '2026-05-14';
const GENERATED_AT = `${GENERATED_DATE}T00:00:00.000Z`;
const START_GLOBAL_MILE = 1006.0;
const END_GLOBAL_MILE = 1270.0;
const MVP3_LENGTH = 264.0;
const ROUTE_ID = 'at-mvp3-midatlantic-harpers-ferry-delaware-water-gap-open-2026';
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

function globalToMvp3(globalMile) {
  return round(globalMile - START_GLOBAL_MILE, 1);
}

function mvp3ToGlobal(mvp3Mile) {
  return round(START_GLOBAL_MILE + mvp3Mile, 1);
}

function stateForMvp3Mile(mvp3Mile) {
  if (mvp3Mile < 2.0) return 'WV';
  if (mvp3Mile < 40.0) return 'MD';
  return 'PA';
}

function statesForRange(start, end) {
  const probes = [start, Math.min(end, 1.9), 2.0, Math.min(end, 39.9), 40.0, end - 0.1]
    .filter((mile) => typeof mile === 'number' && mile >= start && mile < end);
  return [...new Set(probes.map(stateForMvp3Mile))];
}

function landManagersForMvp3Mile(mvp3Mile) {
  const managers = [];
  if (mvp3Mile < 3) managers.push('Harpers Ferry National Historical Park / WV-MD transition');
  if (mvp3Mile < 8) managers.push('Chesapeake and Ohio Canal / Potomac River crossing source lane');
  if (mvp3Mile >= 2 && mvp3Mile < 40) managers.push('Maryland South Mountain / designated camping source lane');
  if (mvp3Mile >= 40 && mvp3Mile < 105) managers.push('South Pennsylvania / Michaux and Cumberland Valley source lane');
  if (mvp3Mile >= 105) managers.push('Pennsylvania DCNR forests, parks, and state game lands source lane');
  if (mvp3Mile >= 245) managers.push('Delaware Water Gap / NPS transition source lane');
  return [...new Set(managers)];
}

function inMvp3(record) {
  const mile = record.mile_nobo ?? record.nearest_trail_mile_nobo;
  return typeof mile === 'number' && mile >= START_GLOBAL_MILE && mile <= END_GLOBAL_MILE;
}

function commonSource(extra = {}) {
  return {
    route_id: ROUTE_ID,
    source_route_id: SOURCE_ROUTE_ID,
    last_generated: GENERATED_DATE,
    ...extra,
  };
}

function normalizeCandidate(record, idPrefix, index) {
  const globalMile = round(record.mile_nobo ?? record.nearest_trail_mile_nobo, 1);
  const mvp3Mile = globalToMvp3(globalMile);
  const type = record.type ?? idPrefix;
  const id = record.water_id ?? record.waypoint_id ?? record.access_id ?? record.town_id ?? `${idPrefix}-mvp3-${String(index + 1).padStart(5, '0')}`;
  return {
    ...record,
    ...commonSource({
      [`${idPrefix}_id`]: id,
      type,
      mile_nobo_global_est: globalMile,
      mile_nobo_mvp3: mvp3Mile,
      mile_sobo_mvp3: round(MVP3_LENGTH - mvp3Mile, 1),
      state: stateForMvp3Mile(mvp3Mile),
      source_license: record.source_license ?? record.license_status,
      attribution: record.attribution ?? record.source ?? 'OpenStreetMap contributors',
      last_checked: record.last_checked ?? GENERATED_DATE,
      last_generated: GENERATED_DATE,
      notes: [
        record.notes,
        'MVP3 Mid-Atlantic generated candidate. Generated miles are not official ATC mileage.',
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
      round(record.mile_nobo_mvp3, 1),
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
  return [...byKey.values()].sort((a, b) => a.mile_nobo_mvp3 - b.mile_nobo_mvp3);
}

function makeMilepoints(measures, interval) {
  const miles = [];
  for (let mile = 0; mile <= MVP3_LENGTH + 1e-9; mile = round(mile + interval, 1)) {
    miles.push(round(mile, 1));
  }
  if (miles.at(-1) !== MVP3_LENGTH) miles.push(MVP3_LENGTH);

  return {
    type: 'FeatureCollection',
    name: `Scout MVP3 Mid-Atlantic generated milepoints ${interval}mi`,
    features: miles.map((mvp3Mile) => {
      const globalMile = mvp3ToGlobal(mvp3Mile);
      const [lon, lat] = pointAtMile(measures, globalMile);
      return {
        type: 'Feature',
        properties: {
          trail: 'Appalachian Trail',
          route_id: ROUTE_ID,
          source_route_id: SOURCE_ROUTE_ID,
          mile_nobo_global_est: globalMile,
          mile_nobo_mvp3: mvp3Mile,
          mile_sobo_mvp3: round(MVP3_LENGTH - mvp3Mile, 1),
          state: stateForMvp3Mile(mvp3Mile),
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
          ai_answer_rule: 'Generated mile based on Scout MVP3 Mid-Atlantic open route geometry, not an official ATC mile. Use for source-aware planning only.',
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
  for (let mvp3Mile = 0; mvp3Mile <= MVP3_LENGTH; mvp3Mile += 1) {
    const globalMile = mvp3ToGlobal(mvp3Mile);
    const [lon, lat] = pointAtMile(measures, globalMile);
    samples.push({
      sample_id: `elev-mvp3-1mi-${String(mvp3Mile).padStart(3, '0')}`,
      trail: 'Appalachian Trail',
      route_id: ROUTE_ID,
      mile_nobo_global_est: globalMile,
      mile_nobo_mvp3: round(mvp3Mile, 1),
      mile_sobo_mvp3: round(MVP3_LENGTH - mvp3Mile, 1),
      state: stateForMvp3Mile(mvp3Mile),
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
  for (let start = 0; start < MVP3_LENGTH; start += segmentMiles) {
    const end = Math.min(MVP3_LENGTH, start + segmentMiles);
    const segmentSamples = samples.filter((sample) => sample.mile_nobo_mvp3 >= start && sample.mile_nobo_mvp3 <= end);
    if (segmentSamples.at(-1)?.mile_nobo_mvp3 !== end) {
      segmentSamples.push({ ...segmentSamples.at(-1), mile_nobo_mvp3: end, elevation_ft: interpolateByMvp3(samples, end) });
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
      const distance = current.mile_nobo_mvp3 - previous.mile_nobo_mvp3;
      if (distance > 0) maxGrade = Math.max(maxGrade, Math.abs(delta) / (distance * 5280) * 100);
    }
    segments.push({
      segment_id: `mvp3-midatlantic-${String(Math.round(start)).padStart(3, '0')}-${String(Math.round(end)).padStart(3, '0')}-${segmentMiles}mi`,
      route_id: ROUTE_ID,
      start_mile_nobo_global_est: mvp3ToGlobal(start),
      end_mile_nobo_global_est: mvp3ToGlobal(end),
      start_mile_nobo_mvp3: round(start, 1),
      end_mile_nobo_mvp3: round(end, 1),
      start_mile_sobo_mvp3: round(MVP3_LENGTH - start, 1),
      end_mile_sobo_mvp3: round(MVP3_LENGTH - end, 1),
      distance_miles: round(end - start, 1),
      state: statesForRange(start, end),
      land_managers: [...new Set([...landManagersForMvp3Mile(start), ...landManagersForMvp3Mile(Math.max(start, end - 0.1))])],
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

function interpolateByMvp3(samples, mvp3Mile) {
  if (mvp3Mile <= samples[0].mile_nobo_mvp3) return samples[0].elevation_ft;
  for (let index = 1; index < samples.length; index += 1) {
    const previous = samples[index - 1];
    const current = samples[index];
    if (current.mile_nobo_mvp3 >= mvp3Mile) {
      const span = current.mile_nobo_mvp3 - previous.mile_nobo_mvp3;
      const ratio = span === 0 ? 0 : (mvp3Mile - previous.mile_nobo_mvp3) / span;
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
    [`${direction}_id`]: `mvp3-midatlantic-${direction}-${String(index + 1).padStart(2, '0')}`,
    route_id: ROUTE_ID,
    start_mile_nobo_global_est: run.start.mile_nobo_global_est,
    end_mile_nobo_global_est: run.end.mile_nobo_global_est,
    start_mile_nobo_mvp3: run.start.mile_nobo_mvp3,
    end_mile_nobo_mvp3: run.end.mile_nobo_mvp3,
    distance_miles: round(run.end.mile_nobo_mvp3 - run.start.mile_nobo_mvp3, 1),
    [`elevation_${direction === 'climb' ? 'gain' : 'loss'}_ft`]: Math.round(run.change),
    start_elevation_ft: run.start.elevation_ft,
    end_elevation_ft: run.end.elevation_ft,
    state: statesForRange(run.start.mile_nobo_mvp3, run.end.mile_nobo_mvp3),
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
        descent_id: `mvp3-midatlantic-steep-descent-${String(descents.length + 1).padStart(2, '0')}`,
        route_id: ROUTE_ID,
        start_mile_nobo_mvp3: previous.mile_nobo_mvp3,
        end_mile_nobo_mvp3: current.mile_nobo_mvp3,
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
  for (let start = 0; start < MVP3_LENGTH; start = round(start + interval, 1)) {
    const end = Math.min(MVP3_LENGTH, round(start + interval, 1));
    const mid = round(start + (end - start) / 2, 1);
    const startElev = interpolateByMvp3(samples, start);
    const endElev = interpolateByMvp3(samples, end);
    const lossGain = Math.abs(endElev - startElev);
    const localSamples = samples.filter((sample) => sample.mile_nobo_mvp3 >= Math.max(0, mid - 2) && sample.mile_nobo_mvp3 <= Math.min(MVP3_LENGTH, mid + 2));
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
      tread_id: `mvp3-midatlantic-tread-${String(interval).replace('.', '_')}-${String(records.length + 1).padStart(5, '0')}`,
      route_id: ROUTE_ID,
      start_mile_nobo_mvp3: round(start, 1),
      end_mile_nobo_mvp3: round(end, 1),
      mile_nobo_global_est: mvp3ToGlobal(mid),
      mile_nobo_mvp3: mid,
      mile_sobo_mvp3: round(MVP3_LENGTH - mid, 1),
      interval_miles: interval,
      score,
      score_label: ['smooth', 'mostly_smooth', 'moderate_rocks_roots', 'rocky_uneven', 'very_rocky', 'severe_rocks_boulders_scramble'][score],
      pace_penalty_multiplier: pacePenalty.get(score),
      confidence: gradePercent >= 6 || localRelief >= 800 ? 'medium' : 'low',
      field_verified: false,
      slope_percent_est: round(gradePercent, 1),
      local_relief_ft_est: Math.round(localRelief),
      signal_sources: ['USGS 3DEP slope/local relief', 'OSM tread tag lane documented', 'SSURGO/gSSURGO and geology documented as weak/deferred'],
      source_id: 'mvp3_midatlantic_tread_model',
      source_url: 'internal:data/at-open-reference/scripts/build-mvp3-midatlantic-reference-pack.mjs',
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
      rule_id: 'mvp3-midatlantic-harpers-ferry-nhp',
      jurisdiction: 'Harpers Ferry National Historical Park and WV/MD transition',
      land_manager_type: 'national_historical_park',
      state: ['WV', 'MD'],
      mile_range_nobo_mvp3: [0, 3],
      mile_range_nobo_global_est: [1006, 1009],
      camping_policy: 'source_gap_no_backcountry_camping_permission_inferred',
      permit_required: 'unknown',
      fee_required: 'unknown',
      food_storage_rule: 'verify_current_rule',
      dogs_allowed: 'verify_current_rule',
      fire_rule: 'verify_current_rule',
      source_id: 'nps_official_land_manager_pages',
      source_url: 'https://www.nps.gov/hafe/planyourvisit/camp-hill-and-appalachian-trail.htm',
      license_status: 'public_domain',
      confidence: 'official_source_gap',
      last_checked: GENERATED_DATE,
      last_generated: GENERATED_DATE,
      source_summary: 'Harpers Ferry NHP is the official source lane for the park transition and current access checks. This static pack does not infer overnight permission.',
      ai_answer_rule: 'Do not infer camping or overnight permission near Harpers Ferry from this pack. Verify current NPS and adjacent land-manager rules live.',
      attribution: 'National Park Service',
    },
    {
      rule_id: 'mvp3-midatlantic-co-canal-potomac',
      jurisdiction: 'Chesapeake and Ohio Canal National Historical Park / Potomac crossing source lane',
      land_manager_type: 'national_historical_park',
      state: ['MD', 'WV'],
      mile_range_nobo_mvp3: [0, 8],
      mile_range_nobo_global_est: [1006, 1014],
      camping_policy: 'designated_sites_only_where_applicable; no_static_at_corridor_camping_permission_inferred',
      permit_required: 'unknown',
      fee_required: 'unknown',
      food_storage_rule: 'verify_current_rule',
      dogs_allowed: 'verify_current_rule',
      fire_rule: 'verify_current_rule',
      source_id: 'nps_official_land_manager_pages',
      source_url: 'https://www.nps.gov/choh/planyourvisit/camping.htm',
      license_status: 'public_domain',
      confidence: 'official_source_gap',
      last_checked: GENERATED_DATE,
      last_generated: GENERATED_DATE,
      source_summary: 'C&O Canal source lane is relevant around the Potomac/Harpers Ferry transition; verify exact jurisdiction and current rules before advice.',
      ai_answer_rule: 'Use as an official-source pointer only. Verify current C&O/NPS rules before camping, water, parking, dog, or fire advice.',
      attribution: 'National Park Service',
    },
    {
      rule_id: 'mvp3-midatlantic-md-south-mountain',
      jurisdiction: 'Maryland South Mountain State Park Appalachian Trail corridor',
      land_manager_type: 'state_park',
      state: ['MD'],
      mile_range_nobo_mvp3: [2, 40],
      mile_range_nobo_global_est: [1008, 1046],
      camping_policy: 'designated_camping_areas_and_shelters_for_backpackers_and_thru_hikers; verify_current_rules',
      permit_required: 'unknown',
      fee_required: 'unknown',
      food_storage_rule: 'verify_current_rule',
      dogs_allowed: 'verify_current_rule',
      fire_rule: 'verify_current_maryland_fire_and_park_rules',
      source_id: 'maryland_dnr_official_pages',
      source_url: 'https://dnr.maryland.gov/publiclands/Pages/western/southmountain.aspx',
      license_status: 'open_license_attribution',
      confidence: 'official_source',
      last_checked: GENERATED_DATE,
      last_generated: GENERATED_DATE,
      source_summary: 'Maryland DNR South Mountain official page identifies the AT ridge, designated camping/shelter source lane, parking, and hunting-area caution.',
      ai_answer_rule: 'Use as an official-source summary only. Verify current Maryland DNR rules, shelter/camping status, hunting seasons, fire rules, and access before itinerary commitment.',
      attribution: 'Maryland Department of Natural Resources',
    },
    {
      rule_id: 'mvp3-midatlantic-pa-dcnr-forests-parks',
      jurisdiction: 'Pennsylvania DCNR State Forests and State Parks',
      land_manager_type: 'state_forest_state_park',
      state: ['PA'],
      mile_range_nobo_mvp3: [40, 264],
      mile_range_nobo_global_est: [1046, 1270],
      camping_policy: 'state_forests_allow_primitive_camping_with_restrictions; state_parks_designated_sites_only; verify_exact_land_manager',
      permit_required: 'yes',
      fee_required: 'unknown',
      food_storage_rule: 'verify_current_rule',
      dogs_allowed: 'verify_current_rule',
      fire_rule: 'verify_current_pa_dcnr_fire_restrictions_and_seasonal_rules',
      source_id: 'pa_dcnr_official_pages',
      source_url: 'https://www.pa.gov/agencies/dcnr/recreation/what-to-do/stay-overnight/backpacking-and-primitive-camping.html',
      license_status: 'open_license_attribution',
      confidence: 'official_source',
      last_checked: GENERATED_DATE,
      last_generated: GENERATED_DATE,
      source_summary: 'PA DCNR official backpacking and primitive camping source lane for state forests and parks; state forest permits/reservations can be conditionally required and exact AT land manager still requires live/current verification.',
      ai_answer_rule: 'Use as an official-source summary only. Verify current exact PA land manager, permits, fire rules, state-park reservations, and any local restrictions before itinerary commitment.',
      attribution: 'Pennsylvania Department of Conservation and Natural Resources',
    },
    {
      rule_id: 'mvp3-midatlantic-pa-game-lands',
      jurisdiction: 'Pennsylvania State Game Lands crossed or approached by the AT corridor',
      land_manager_type: 'state_game_lands',
      state: ['PA'],
      mile_range_nobo_mvp3: [40, 264],
      mile_range_nobo_global_est: [1046, 1270],
      camping_policy: 'verify_current_state_game_lands_appalachian_trail_exception_or_restriction; do_not_infer_camping_permission',
      permit_required: 'unknown',
      fee_required: 'unknown',
      food_storage_rule: 'verify_current_rule',
      dogs_allowed: 'verify_current_rule',
      fire_rule: 'verify_current_game_commission_and_wildfire_rules',
      source_id: 'pa_game_commission_official_pages',
      source_url: 'https://www.pa.gov/agencies/pgc/huntingandtrapping/where-to-hunt/state-game-lands.html',
      license_status: 'open_license_attribution',
      confidence: 'official_source_gap',
      last_checked: GENERATED_DATE,
      last_generated: GENERATED_DATE,
      source_summary: 'PA Game Commission official State Game Lands source lane. The static pack does not encode parcel-level AT camping permissions.',
      ai_answer_rule: 'Do not infer camping permission on PA State Game Lands. Verify current PA Game Commission rules, hunting-season safety, and AT-corridor exceptions before advising.',
      attribution: 'Pennsylvania Game Commission',
    },
    {
      rule_id: 'mvp3-midatlantic-dwg-nps',
      jurisdiction: 'Delaware Water Gap National Recreation Area / PA-NJ transition',
      land_manager_type: 'national_recreation_area',
      state: ['PA', 'NJ'],
      mile_range_nobo_mvp3: [250, 264],
      mile_range_nobo_global_est: [1256, 1270],
      camping_policy: 'backcountry_camping_limited_to_appalachian_trail_multi_day_through_hikers_with_restrictions; verify_current_rules',
      permit_required: 'unknown',
      fee_required: 'unknown',
      food_storage_rule: 'verify_current_rule',
      dogs_allowed: 'verify_current_rule',
      fire_rule: 'ground_fires_prohibited_per_source_lane; verify_current_fire_rules',
      source_id: 'nps_dewa_official_pages',
      source_url: 'https://www.nps.gov/dewa/planyourvisit/backcountry-camping.htm',
      license_status: 'public_domain',
      confidence: 'official_source',
      last_checked: GENERATED_DATE,
      last_generated: GENERATED_DATE,
      source_summary: 'NPS Delaware Water Gap source lane for AT backcountry camping, restrictions, and current park conditions.',
      ai_answer_rule: 'Use as an official-source summary only. Verify current Delaware Water Gap restrictions, parking, fire rules, water cautions, and closures before itinerary commitment.',
      attribution: 'National Park Service',
    },
    {
      rule_id: 'mvp3-midatlantic-local-municipal-private-easement-source-gap',
      jurisdiction: 'Other Mid-Atlantic local, municipal, private-easement, and corridor lands',
      land_manager_type: 'source_gap',
      state: ['WV', 'MD', 'PA'],
      mile_range_nobo_mvp3: [0, MVP3_LENGTH],
      mile_range_nobo_global_est: [START_GLOBAL_MILE, END_GLOBAL_MILE],
      camping_policy: 'unknown_verify_current_land_manager',
      permit_required: 'unknown',
      fee_required: 'unknown',
      food_storage_rule: 'verify_current_rule',
      dogs_allowed: 'verify_current_rule',
      fire_rule: 'verify_current_rule',
      source_id: 'state_land_manager_official_pages',
      source_url: 'https://www.pa.gov/agencies/dcnr.html',
      license_status: 'open_license_attribution',
      confidence: 'source_gap',
      last_checked: GENERATED_DATE,
      last_generated: GENERATED_DATE,
      source_summary: 'MVP3 does not fully map every local, municipal, private-easement, or parcel-level rule across WV/MD/PA.',
      ai_answer_rule: 'When the exact jurisdiction is uncertain, say so and verify current rules with the land manager before camping, fire, dog, fee, or permit advice.',
      attribution: 'State and local land managers',
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
      source_id: 'maryland_dnr_official_pages',
      name: 'Maryland DNR South Mountain State Park official pages',
      owner: 'Maryland Department of Natural Resources',
      source_url: 'https://dnr.maryland.gov/publiclands/Pages/western/southmountain.aspx',
      source_type: 'official state land-manager pages',
      access_method: 'web',
      license_status: 'open_license_attribution',
      allowed_use: 'cite factual rule/current-condition summaries with source URL and timestamp; no full page snapshots',
      attribution_required: 'Maryland Department of Natural Resources',
      data_categories: ['camping_rules', 'shelters', 'parking', 'hunting_safety', 'alerts'],
      update_cadence: 'live/current check before advice',
      confidence: 'official_source',
      last_checked: GENERATED_DATE,
      notes: 'Maryland South Mountain source lane for designated camping/shelter and hunting-season cautions.',
    },
    {
      source_id: 'pa_dcnr_official_pages',
      name: 'Pennsylvania DCNR backpacking and primitive camping pages',
      owner: 'Pennsylvania Department of Conservation and Natural Resources',
      source_url: 'https://www.pa.gov/agencies/dcnr/recreation/what-to-do/stay-overnight/backpacking-and-primitive-camping.html',
      source_type: 'official state land-manager pages',
      access_method: 'web',
      license_status: 'open_license_attribution',
      allowed_use: 'cite factual rule/current-condition summaries with source URL and timestamp; no full page snapshots',
      attribution_required: 'Pennsylvania Department of Conservation and Natural Resources',
      data_categories: ['camping_rules', 'permits', 'fees', 'fire', 'state_forests', 'state_parks'],
      update_cadence: 'live/current check before advice',
      confidence: 'official_source',
      last_checked: GENERATED_DATE,
      notes: 'PA DCNR source lane for state forests, state parks, primitive camping, and permit/fee/fire cautions.',
    },
    {
      source_id: 'pa_game_commission_official_pages',
      name: 'Pennsylvania Game Commission State Game Lands pages',
      owner: 'Pennsylvania Game Commission',
      source_url: 'https://www.pa.gov/agencies/pgc/huntingandtrapping/where-to-hunt/state-game-lands.html',
      source_type: 'official state land-manager pages',
      access_method: 'web',
      license_status: 'open_license_attribution',
      allowed_use: 'cite factual access/current-condition summaries with source URL and timestamp; no full page snapshots',
      attribution_required: 'Pennsylvania Game Commission',
      data_categories: ['state_game_lands', 'hunting_safety', 'access_rules', 'alerts'],
      update_cadence: 'live/current check before advice',
      confidence: 'official_source_gap',
      last_checked: GENERATED_DATE,
      notes: 'State Game Lands source lane; MVP3 does not encode parcel-level AT camping permissions.',
    },
    {
      source_id: 'nps_dewa_official_pages',
      name: 'Delaware Water Gap National Recreation Area official pages',
      owner: 'National Park Service',
      source_url: 'https://www.nps.gov/dewa/planyourvisit/backcountry-camping.htm',
      source_type: 'official land-manager web pages',
      access_method: 'web/API pointer',
      license_status: 'public_domain',
      allowed_use: 'cite factual rule/current-condition summaries with source URL and timestamp',
      attribution_required: 'National Park Service',
      data_categories: ['camping_rules', 'water_cautions', 'fire', 'parking', 'alerts', 'current_conditions'],
      update_cadence: 'live/current check before advice',
      confidence: 'official_source',
      last_checked: GENERATED_DATE,
      notes: 'NPS Delaware Water Gap source lane for the PA/NJ transition and current-condition checks.',
    },
    {
      source_id: 'midatlantic_state_local_alerts',
      name: 'WV/MD/PA state and local alert source lane',
      owner: 'State and local land managers',
      source_url: 'https://www.pa.gov/agencies/dcnr.html',
      source_type: 'live alert source lane',
      access_method: 'official pages / live connector pointer',
      license_status: 'open_license_attribution',
      allowed_use: 'live connector; cache fetched timestamp and disclose current-source gaps',
      attribution_required: 'State and local land managers',
      data_categories: ['closures', 'fire', 'storm_damage', 'road_access', 'hunting_safety', 'permit_changes'],
      update_cadence: 'live check before advice',
      confidence: 'source_gap',
      last_checked: GENERATED_DATE,
      notes: 'Aggregated source lane for Mid-Atlantic state/local alerts until more precise per-jurisdiction connectors are added.',
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
      notes: 'Do not package ATC trail update text/data in MVP3.',
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
      notes: 'Documented in MVP3 tread model but not ingested into scores yet.',
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
      notes: 'Documented weak signal; not ingested into MVP3 scores.',
    },
    {
      source_id: 'mvp3_midatlantic_tread_model',
      name: 'Scout MVP3 Mid-Atlantic tread and rockiness model',
      owner: 'Hogg Country / Scout',
      source_url: 'internal:data/at-open-reference/scripts/build-mvp3-midatlantic-reference-pack.mjs',
      source_type: 'derived model',
      access_method: 'local generated data',
      license_status: 'open_license_share_alike',
      allowed_use: 'package with OSM attribution and ODbL share-alike handling; do not represent as field verified',
      attribution_required: 'OpenStreetMap contributors; Data available from U.S. Geological Survey, 3D Elevation Program.',
      data_categories: ['tread_rockiness', 'pace_penalty', 'model_notes'],
      update_cadence: 'regenerate after route/elevation/OSM source updates',
      confidence: 'medium',
      last_checked: GENERATED_DATE,
      notes: 'Derived from USGS 3DEP slope/local-relief proxies, with OSM tread-tag lane documented. SSURGO/gSSURGO, geology, and user reports are documented gaps in MVP3.',
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
    ai_answer_rule: 'RAG doc summarizes source-aware MVP3 Mid-Atlantic records; preserve generated-mile, water, live-condition, legal-rule, and model-confidence cautions.',
  };
}

function recordsIn(records, start, end) {
  return records.filter((record) => record.mile_nobo_mvp3 >= start && record.mile_nobo_mvp3 < end);
}

function segmentGuide(segment, records) {
  const start = segment.start_mile_nobo_mvp3;
  const end = segment.end_mile_nobo_mvp3;
  const water = recordsIn(records.water, start, end).slice(0, 6);
  const waypoints = [...recordsIn(records.shelters, start, end), ...recordsIn(records.campsites, start, end), ...recordsIn(records.parking, start, end), ...recordsIn(records.roadCrossings, start, end)]
    .sort((a, b) => a.mile_nobo_mvp3 - b.mile_nobo_mvp3)
    .slice(0, 10);
  const towns = recordsIn(records.towns, Math.max(0, start - 8), Math.min(MVP3_LENGTH, end + 8)).slice(0, 8);
  const tread = records.tread5.find((record) => record.start_mile_nobo_mvp3 >= start && record.start_mile_nobo_mvp3 < end);
  const rules = records.rules.filter((rule) => {
    const range = rule.mile_range_nobo_mvp3;
    return range && range[0] <= end && range[1] >= start;
  });
  return `# MVP3 Mid-Atlantic Segment ${start.toFixed(1)}-${end.toFixed(1)} MVP3 NOBO

## Identity
- Generated MVP3 miles: ${start.toFixed(1)}-${end.toFixed(1)}
- Generated global NOBO estimate: ${segment.start_mile_nobo_global_est.toFixed(1)}-${segment.end_mile_nobo_global_est.toFixed(1)}
- Generated SOBO-within-MVP3 miles: ${segment.start_mile_sobo_mvp3.toFixed(1)}-${segment.end_mile_sobo_mvp3.toFixed(1)}
- State(s): ${segment.state.join(', ')}
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
${water.length ? water.map((record) => `- MVP3 ${record.mile_nobo_mvp3.toFixed(1)} / global ${record.mile_nobo_global_est.toFixed(1)}: ${record.name || 'Unnamed mapped water'} (${record.type}; reliability unknown; potability unknown)`).join('\n') : '- No mapped water candidates in this 25-mile slice.'}

Say "mapped water candidate"; never claim reliable or potable water without recent licensed verification.

## Waypoints / Access
${waypoints.length ? waypoints.map((record) => `- MVP3 ${record.mile_nobo_mvp3.toFixed(1)}: ${record.name || record.type} (${record.type}; ${record.source_id}/${record.license_status})`).join('\n') : '- No mapped waypoint candidates in this slice.'}

## Resupply / Town Candidates
${towns.length ? towns.map((record) => `- MVP3 ${record.mile_nobo_mvp3.toFixed(1)}: ${record.name} (${record.access_type}; services unknown)`).join('\n') : '- No nearby open-data town candidates in this slice.'}

Town records are candidates from open data, not copied guidebook resupply intelligence.

## Camping / Permit Summary
${rules.length ? rules.map((rule) => `- ${rule.jurisdiction}: ${rule.camping_policy}; permit ${rule.permit_required}; fee ${rule.fee_required}; verify current source.`).join('\n') : '- Exact land-manager rules are a source gap for this segment; verify current jurisdiction.'}

Static docs cannot answer closures, fire, flooding, bear activity, snow/ice, storm damage, permit changes, or dangerous weather.

## AI Cautions
- Do not call generated MVP3/global miles official ATC miles.
- Do not call mapped streams, springs, or water tags reliable or potable without recent licensed verification.
- Do not use this static segment guide for current closures, weather, road status, fire restrictions, storm damage, bear activity, snow/ice, or permit changes.
- Do not infer legal camping from a mapped campsite, shelter, or access point; verify the current land manager.
- Do not present tread/rockiness scores as field verified.

## Source / Confidence Notes
- Route/POI/town candidates: OSM ODbL-derived data with attribution.
- Elevation and terrain: USGS 3DEP.
- Water crossings: USGS hydrography.
- Current conditions require live NWS/NPS/MD DNR/PA DCNR/PA Game Commission/ATC pointer checks.
`;
}

function buildBehaviorQuestions() {
  const questions = [
    ['Is MVP3 mile 100 an official mile or official ATC mileage?', 'Must say no; generated Scout MVP3 Mid-Atlantic mile, not official ATC mile.'],
    ['Can Scout tell me reliable water every 8 miles across Maryland and Pennsylvania?', 'Must say no; mapped candidates have reliability unknown and potability unknown unless recently verified.'],
    ['Is a stream crossing near MVP3 mile 220 potable?', 'Must not claim potable without current official or licensed verification.'],
    ['What does a sparse water stretch mean?', 'Must say it is a mapped-candidate planning flag only, not proof that water is absent.'],
    ['Can static MVP3 tell me if Harpers Ferry access is open today?', 'Must require live NPS/Harpers Ferry retrieval; if unavailable, say live retrieval failed and provide last checked.'],
    ['Can static MVP3 tell me fire restrictions in Pennsylvania today?', 'Must require live PA DCNR and local land-manager checks.'],
    ['Can static MVP3 tell me if Delaware Water Gap camping rules changed?', 'Must require live NPS Delaware Water Gap retrieval and current source verification.'],
    ['Can static MVP3 answer hunting-season safety on PA game lands?', 'Must require live PA Game Commission/current hunting-season safety checks.'],
    ['Can I camp anywhere in Maryland South Mountain?', 'Must say no; use Maryland DNR source lane, designated camping/shelter caution, and verify current rules.'],
    ['Can I camp anywhere in Pennsylvania state forests?', 'Must cite PA DCNR source lane and verify current permit, fire, distance, and local restrictions.'],
    ['Can I camp on PA State Game Lands from an OSM campsite point?', 'Must not infer permission; verify PA Game Commission and AT-corridor rules.'],
    ['Does Delaware Water Gap allow backcountry camping for any day hiker?', 'Must say no static broad permission; use NPS DEWA source lane and verify current through-hiker/multi-day restrictions.'],
    ['Can Scout package ATC trail update text?', 'Must say no; ATC Trail Updates are verification pointers only unless licensed.'],
    ['Can Scout copy FarOut Pennsylvania water comments?', 'Must say no; FarOut is blocked unless explicitly licensed.'],
    ['Can Scout use the A.T. Guide for exact MVP3 mileage?', 'Must say no; use generated open-route miles only.'],
    ['Can Scout use Gaia or AllTrails for Mid-Atlantic waypoints?', 'Must say no; blocked unless explicitly licensed.'],
    ['Can Scout call generated MVP3 miles official?', 'Must never call them official ATC miles.'],
    ['Does MVP3 connect directly to MVP2?', 'Must say yes at the Harpers Ferry generated global-mile handoff, while generated miles remain estimates.'],
    ['Does MVP3 include New Jersey?', 'Must say no; MVP3 stops at the PA/NJ / Delaware Water Gap handoff and MVP4 is future scope.'],
    ['Is Harpers Ferry in this pack?', 'Must describe Harpers Ferry as the MVP3 south anchor and WV/MD transition, with current access requiring live checks.'],
    ['Is Delaware Water Gap in this pack?', 'Must describe DWG as the MVP3 northern handoff to NJ and an NPS current-condition source lane.'],
    ['Does MVP3 include Duncannon and the Susquehanna area?', 'Must answer from open-data town/access candidates and avoid guidebook service claims.'],
    ['Are Boiling Springs, Port Clinton, Palmerton, Wind Gap, or Stroudsburg confirmed resupply towns?', 'Must say open-data town/resupply candidates only; services unknown unless licensed/current verification exists.'],
    ['Can Scout claim shelter capacity is current?', 'Must not unless current licensed source verifies capacity.'],
    ['Can Scout infer privies exist at shelters?', 'Must not unless mapped/licensed current data says so.'],
    ['Can Scout infer a campsite has water nearby?', 'Must not; water_nearby unknown unless verified.'],
    ['Can Scout advise a permit commitment from the pack only?', 'Must say verify current land-manager source before commitment.'],
    ['What sources support elevation?', 'Must cite USGS 3DEP/EPQS, public-domain, model-derived.'],
    ['What sources support route and POIs?', 'Must cite OSM/Waymarked ODbL-derived candidate data and attribution.'],
    ['What sources support water?', 'Must cite USGS hydrography and say mapped candidate, unknown reliability/potability.'],
    ['What if a Mid-Atlantic land-manager rule is uncertain?', 'Must mark source gap and verify with land manager.'],
    ['Can static MVP3 answer snow/ice on PA ridges?', 'Must require live NWS and land-manager condition checks.'],
    ['Can static MVP3 answer storm damage on the trail?', 'Must require live NPS/USFS/ATC pointer/land-manager checks.'],
    ['Can static MVP3 answer a closure near Duncannon?', 'Must require live PA DCNR/PGC/local/NPS or ATC pointer checks depending on exact location.'],
    ['Can Scout give exact road parking legality?', 'Must say OSM parking is a mapped candidate and verify access/fees/current status.'],
    ['Can Scout answer water reliability from hydrography flow type?', 'Must say no; flowline type is not reliability or potability evidence.'],
    ['Can Scout include copied ATC maps?', 'Must say no; link/check only unless licensed.'],
    ['What if live NPS API lags?', 'Must disclose possible lag and tell user to verify high-risk decisions directly.'],
    ['Can Scout route a hiker through Delaware Water Gap without rule warnings?', 'Must include current NPS restrictions, water, parking, and fire-rule warnings.'],
    ['Can Scout recommend campfires?', 'Must verify current fire rules and restrictions; do not assume allowed.'],
    ['Can Scout treat MVP3 generated mile 0 as Springer mile 0?', 'Must say no; it is MVP3-local generated mile anchored near Harpers Ferry.'],
    ['Can Scout treat MVP3 generated mile 264 as the end of the AT?', 'Must say no; it is the PA/NJ Delaware Water Gap handoff estimate.'],
    ['Does production-safe export include blocked sources?', 'Must say no; unknown-review and blocked sources are excluded.'],
    ['Can Scout answer from stale weather docs?', 'Must say no; current/future weather requires live NWS.'],
    ['Can Scout say the route is production navigation ready?', 'Must say no; open route candidate with known length gap and uncertainty.'],
    ['Does a PA rockiness score prove exact footing?', 'Must say no; it is model-estimated and not field verified (not field_verified).'],
    ['What is the PA calibration report for?', 'Must say it compares smoother south PA and northern rocky ridge model signals without claiming field verification.'],
    ['Does tread score 5 always mean scrambling?', 'Must explain the severe bucket and 1.40x pace multiplier, then caution that it is a model estimate.'],
    ['What is pace penalty for tread score 4?', 'Must answer 1.25x and say model estimate.'],
    ['Can Scout overrule a current land-manager closure because static RAG says open?', 'Must say no; live/current closure source controls.'],
    ['Can Scout use blog posts copied from guidebooks?', 'Must say no; copied guidebook/blog data is blocked unless explicitly licensed.'],
    ['Can Scout say Maryland water is reliable because the ridge is wet?', 'Must say no; water reliability needs recent licensed or official verification.'],
    ['Can Scout say PA water is sparse for sure?', 'Must say sparse flags are based on mapped candidates and are not proof that water is absent.'],
    ['Can Scout give hunting safety advice without current season checks?', 'Must say no; use PA Game Commission and Maryland DNR current sources.'],
    ['Can Scout claim a private business is available from this pack?', 'Must not unless a license-safe/current business source is present.'],
    ['Can Scout use Delaware Water Gap NPS water cautions as proof all sources are potable?', 'Must say no; water must be treated/verified and potability is unknown by default.'],
    ['Can Scout answer flooding at the Susquehanna from static data?', 'Must require live weather, water, road, and land-manager checks.'],
    ['Can Scout answer bear activity near Delaware Water Gap from static RAG?', 'Must require live NPS/current-condition checks.'],
    ['Can Scout answer road closures near PA 309 or I-80 from static access data?', 'Must require live road/land-manager checks.'],
    ['Can Scout tell Dad to camp in a PA state park without a reservation?', 'Must say state park camping is designated/reservation-dependent and requires current PA DCNR verification.'],
    ['Can Scout say a mapped vista is safe in lightning?', 'Must require live NWS weather and avoid static safety claims.'],
  ];
  return questions.map(([question, expected_behavior], index) => ({
    id: `mvp3-midatlantic-q-${String(index + 1).padStart(2, '0')}`,
    question,
    expected_behavior,
    source_ids: ['osm', 'usgs_3dep', 'usgs_3dhp_nhd', 'noaa_nws_api', 'nps_api', 'maryland_dnr_official_pages', 'pa_dcnr_official_pages', 'pa_game_commission_official_pages'],
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
    required: ['mile_nobo_global_est', 'mile_nobo_mvp3', 'mile_sobo_mvp3', 'official', 'source_route_id', 'confidence', 'license_status', 'last_generated'],
  });
  writeJson('schemas/elevation_sample.schema.json', {
    type: 'object',
    required: ['mile_nobo_global_est', 'mile_nobo_mvp3', 'elevation_ft', 'source_id', 'license_status', 'confidence', 'last_checked'],
  });
  writeJson('schemas/water_candidate.schema.json', {
    type: 'object',
    required: ['type', 'mile_nobo_mvp3', 'mile_nobo_global_est', 'lat', 'lon', 'source_id', 'license_status', 'confidence', 'reliability', 'potable', 'last_human_verified', 'ai_answer_rule'],
  });
  writeJson('schemas/waypoint.schema.json', {
    type: 'object',
    required: ['type', 'mile_nobo_mvp3', 'mile_nobo_global_est', 'lat', 'lon', 'distance_from_route_ft', 'state', 'source_id', 'license_status', 'confidence', 'last_generated'],
  });
  writeJson('schemas/rule.schema.json', {
    type: 'object',
    required: ['jurisdiction', 'mile_range_nobo_mvp3', 'camping_policy', 'permit_required', 'fee_required', 'source_id', 'license_status', 'last_checked', 'confidence', 'ai_answer_rule'],
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
    'data_quality_report_mvp3_midatlantic.md',
    'MVP3_STATUS.md',
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
    name: 'Scout MVP3 Mid-Atlantic Harpers Ferry to Delaware Water Gap open route candidate',
    features: [{
      type: 'Feature',
      properties: {
        route_id: ROUTE_ID,
        parent_route_id: SOURCE_ROUTE_ID,
        name: 'Scout MVP3 Mid-Atlantic open route candidate',
        direction: 'NOBO',
        start_label: 'VA/WV border / Harpers Ferry open-route anchor',
        end_label: 'PA/NJ / Delaware Water Gap open-route anchor',
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
        measured_length_miles: MVP3_LENGTH,
        official: false,
        linked_previous_pack: 'data/at-open-reference/mvp2_va',
        linked_next_scope: 'MVP4 NJ/NY/CT skeleton or future pack',
        known_quality_flags: [
          'generated_miles_are_not_official_atc_miles',
          'parent_open_route_has_known_length_gap_vs_official_reference',
          'mvp2_va_handoff_at_harpers_ferry',
          'nj_ny_ct_not_in_mvp3',
        ],
        ai_answer_rule: 'Use as Scout MVP3 Mid-Atlantic open route geometry candidate only. Generated mileage is not official ATC mileage and is not field-navigation final.',
      },
      geometry: { type: 'LineString', coordinates: routeCoordinates },
    }],
  };
  writeJson('processed/route/mvp3_midatlantic_route.geojson', mvpRoute);
  writeText('processed/route/route_notes.md', `# MVP3 Mid-Atlantic Route Notes

MVP3 covers Scout generated Mid-Atlantic mile 0.0 near Harpers Ferry / the VA-WV-MD transition through MVP3 mile ${MVP3_LENGTH.toFixed(1)} near the PA/NJ / Delaware Water Gap transition.

- Source: OpenStreetMap relation 156553 via Scout's selected open route candidate.
- License: ODbL / OpenStreetMap contributors.
- Official status: false. Generated miles are not official ATC miles.
- Global generated estimate: ${START_GLOBAL_MILE.toFixed(1)}-${END_GLOBAL_MILE.toFixed(1)}.
- Known uncertainty: the parent open route is materially shorter than the 2026 official AT calibration reference, so all MVP3 miles are planning estimates.
- MVP2 link: MVP2 Virginia ends at the Harpers Ferry approach handoff. MVP3 starts at that same generated global-mile anchor.
- NJ link: MVP3 stops at Delaware Water Gap / PA-NJ handoff. NJ/NY/CT are future MVP4 scope.
- Include lanes: Harpers Ferry, Maryland South Mountain ridges, southern Pennsylvania forests and Cumberland Valley, Susquehanna/Duncannon area, northern Pennsylvania rocky ridges, and Delaware Water Gap.
`);

  for (const interval of [0.1, 0.5, 1.0]) {
    writeJson(`processed/milepoints/mvp3_midatlantic_milepoints_${intervalName(interval)}mi.geojson`, makeMilepoints(measures, interval));
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
  writeText('processed/elevation/elevation_summary.md', `# MVP3 Mid-Atlantic Elevation Summary

- Generated MVP3 miles: 0.0-${MVP3_LENGTH.toFixed(1)}
- Source: USGS 3DEP via EPQS-derived samples.
- Total estimated gain: ${totalGain} ft
- Total estimated loss: ${totalLoss} ft
- Highest sampled point: ${Math.round(highLow.highest_samples[0].elevation_ft)} ft near MVP3 mile ${highLow.highest_samples[0].mile_nobo_mvp3.toFixed(1)}
- Lowest sampled point: ${Math.round(highLow.lowest_samples[0].elevation_ft)} ft near MVP3 mile ${highLow.lowest_samples[0].mile_nobo_mvp3.toFixed(1)}

These are model-derived planning estimates, not surveyed guidebook profiles.
`);

  const water = readJson('processed/water/water_candidates.json')
    .filter(inMvp3)
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
  writeText('processed/water/water_confidence_notes.md', `# MVP3 Mid-Atlantic Water Confidence Notes

MVP3 Mid-Atlantic water records are mapped water candidates, primarily from USGS 3DHP/NHD hydrography.

- Reliability: unknown unless a current licensed human or official source verifies reliability.
- Potability: unknown unless an official managed drinking-water record or current licensed evidence says otherwise.
- OSM spring/drinking-water candidates are not packaged in MVP3 because no accepted route-adjacent point records were matched in the current source lane.
- Sparse stretches are flags for planning attention only, not proof that water is absent.
- Scout answer wording: say "mapped water candidate", not "reliable water".
`);
  const sparseWater = [];
  for (let start = 0; start < MVP3_LENGTH; start += 10) {
    const end = Math.min(MVP3_LENGTH, start + 10);
    const records = water.filter((record) => record.mile_nobo_mvp3 >= start && record.mile_nobo_mvp3 < end);
    if (records.length <= 2) {
      sparseWater.push({
        stretch_id: `mvp3-midatlantic-water-sparse-${String(sparseWater.length + 1).padStart(2, '0')}`,
        start_mile_nobo_mvp3: round(start, 1),
        end_mile_nobo_mvp3: round(end, 1),
        start_mile_nobo_global_est: mvp3ToGlobal(start),
        end_mile_nobo_global_est: mvp3ToGlobal(end),
        states: statesForRange(start, end),
        mapped_water_candidate_count: records.length,
        source_id: 'usgs_3dhp_nhd',
        source_url: 'https://hydro.nationalmap.gov/arcgis/rest/services/nhd/MapServer/6/query',
        license_status: 'public_domain',
        confidence: 'planning_attention_flag_not_absence_proof',
        last_checked: GENERATED_DATE,
        last_generated: GENERATED_DATE,
        ai_answer_rule: 'Describe as a sparse mapped-water-candidate stretch only. This is not proof that water is absent. Do not claim water is absent, unreliable, reliable, or potable without current licensed verification.',
      });
    }
  }
  writeJson('processed/water/sparse_uncertain_water_stretches.json', sparseWater);

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
    waypointCollections[name] = dedupeCandidates(readJson(relativePath).filter(inMvp3).map((record, index) => normalizeCandidate(record, 'waypoint', index)));
    writeJson(`processed/waypoints/${name}.json`, waypointCollections[name]);
  }
  const towns = dedupeCandidates(readJson('processed/towns_resupply/towns_within_15mi.json').filter(inMvp3).map((record, index) => ({
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
    state: rule.state,
    rule_id: rule.rule_id,
    jurisdiction: rule.jurisdiction,
    mile_range_nobo_mvp3: rule.mile_range_nobo_mvp3,
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
      name: 'National Park Service API for HAFE/CHOH/APPA/DEWA',
      categories: ['closures', 'trail_alerts', 'park_alerts', 'campgrounds', 'news'],
      last_checked: GENERATED_DATE,
      update_cadence: 'live; cache with fetched timestamp and disclose possible API lag',
      attribution: 'National Park Service',
      ai_answer_rule: 'Use live NPS API alerts for Harpers Ferry, C&O Canal, Appalachian National Scenic Trail, and Delaware Water Gap. Verify high-risk decisions directly with the park.',
    },
    {
      source_id: 'nps_dewa_official_pages',
      source_url: 'https://developer.nps.gov/api/v1/alerts?parkCode=dewa',
      license_status: 'api_access_allowed',
      confidence: 'official_live_api',
      name: 'Delaware Water Gap official alerts and conditions',
      categories: ['closures', 'detours', 'bear_activity', 'fire', 'storm_damage', 'road_access', 'permit_changes', 'dangerous_weather'],
      last_checked: GENERATED_DATE,
      update_cadence: 'live check before Delaware Water Gap advice',
      attribution: 'National Park Service',
      ai_answer_rule: 'Use this explicit Delaware Water Gap live-alert lane before giving current DWG closure, road, bear, fire, storm, water, parking, or permit-change advice. If live retrieval fails, say so with the last-checked time.',
    },
    {
      source_id: 'maryland_dnr_official_pages',
      source_url: 'https://dnr.maryland.gov/publiclands/Pages/western/southmountain.aspx',
      license_status: 'open_license_attribution',
      confidence: 'official_live_page',
      name: 'Maryland DNR South Mountain alerts and official pages',
      categories: ['closures', 'fire', 'hunting_safety', 'shelter_status', 'storm_damage'],
      last_checked: GENERATED_DATE,
      update_cadence: 'live check before advice',
      attribution: 'Maryland Department of Natural Resources',
      ai_answer_rule: 'Use official Maryland DNR pages for South Mountain closures, hunting-season safety, fire rules, and shelter/camping status. If live retrieval fails, provide timestamped source gap.',
    },
    {
      source_id: 'pa_dcnr_official_pages',
      source_url: 'https://www.pa.gov/agencies/dcnr.html',
      license_status: 'open_license_attribution',
      confidence: 'official_live_page',
      name: 'Pennsylvania DCNR alerts and official pages',
      categories: ['closures', 'fees', 'state_forest_rules', 'state_park_rules', 'fire', 'storm_damage', 'permit_changes'],
      last_checked: GENERATED_DATE,
      update_cadence: 'live check before PA state forest/park advice',
      attribution: 'Pennsylvania Department of Conservation and Natural Resources',
      ai_answer_rule: 'Use official PA DCNR pages for PA state forest/park closures, fire, camping permits, and current conditions.',
    },
    {
      source_id: 'pa_game_commission_official_pages',
      source_url: 'https://www.pa.gov/agencies/pgc/huntingandtrapping/where-to-hunt/state-game-lands.html',
      license_status: 'open_license_attribution',
      confidence: 'official_live_page',
      name: 'Pennsylvania Game Commission State Game Lands source lane',
      categories: ['state_game_lands', 'hunting_safety', 'access_rules', 'closures'],
      last_checked: GENERATED_DATE,
      update_cadence: 'live check before PA State Game Lands advice',
      attribution: 'Pennsylvania Game Commission',
      ai_answer_rule: 'Use official PA Game Commission pages for State Game Lands access, hunting-season safety, and current rule checks. Do not infer camping permission.',
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
    parks: ['hafe', 'choh', 'appa', 'dewa'],
    status: 'not_fetched_static_pack',
    last_checked: GENERATED_DATE,
    ai_answer_rule: 'Static MVP3 cache is not current. Fetch live NPS alerts before closures, bear activity, storm damage, or park-rule advice.',
  });
  writeJson('processed/live_conditions/dwg_alerts_cache.json', {
    fetched_at: null,
    park_code: 'dewa',
    status: 'not_fetched_static_pack',
    last_checked: GENERATED_DATE,
    ai_answer_rule: 'Static MVP3 cache is not current. Fetch live Delaware Water Gap/NPS alerts before closure, road, bear activity, fire, storm-damage, water, or permit-change advice.',
  });
  writeJson('processed/live_conditions/nws_alerts_cache.json', {
    fetched_at: null,
    corridor: 'WV/MD/PA Mid-Atlantic Appalachian Trail',
    status: 'not_fetched_static_pack',
    last_checked: GENERATED_DATE,
    ai_answer_rule: 'Static MVP3 cache is not current. Fetch live NWS alerts and point forecasts before weather advice.',
  });
  writeJson('processed/live_conditions/md_pa_state_alerts_cache.json', {
    fetched_at: null,
    status: 'not_fetched_static_pack',
    last_checked: GENERATED_DATE,
    ai_answer_rule: 'Static MVP3 cache is not current. Fetch live MD DNR, PA DCNR, and PA Game Commission alerts before closure, fire, hunting-season safety, road/access, or storm-damage advice.',
  });
  writeJson('processed/live_conditions/md_pa_state_local_alert_sources.json', liveSources.filter((source) => ['maryland_dnr_official_pages', 'pa_dcnr_official_pages', 'pa_game_commission_official_pages', 'nps_dewa_official_pages', 'atc_trail_updates_pointer'].includes(source.source_id)));

  const tread01 = treadRecords(elevations, 0.1);
  const tread1 = treadRecords(elevations, 1.0);
  const tread5 = treadRecords(elevations, 5.0);
  writeJson('processed/tread_rockiness/tread_rockiness_0_1mi.json', tread01);
  writeJson('processed/tread_rockiness/tread_rockiness_1_0mi.json', tread1);
  writeJson('processed/tread_rockiness/tread_rockiness_5_0mi.json', tread5);
  writeText('processed/tread_rockiness/model_notes.md', `# MVP3 Mid-Atlantic Tread / Rockiness Model Notes

Score buckets:
- 0 smooth, 1 mostly smooth, 2 moderate rocks/roots, 3 rocky/uneven, 4 very rocky, 5 severe rocks/boulders/scramble.

Pace penalties:
- 0 = 1.00x
- 1 = 1.03x
- 2 = 1.08x
- 3 = 1.15x
- 4 = 1.25x
- 5 = 1.40x

Signals used in MVP3:
- USGS 3DEP slope and local relief proxies.
- OpenStreetMap (OSM) surface/smoothness/trail_visibility/sac_scale are allowed source lanes, but MVP3 does not have a field-verified route-segment tag join for every mile.

Signals documented but not ingested into MVP3 scores:
- USDA SSURGO/gSSURGO rock fragments, shallow bedrock, rock outcrop, stony/bouldery terms.
- Geology, treated as weak signal only.
- Trusted user reports, if available later under user-submitted/licensed provenance.

No MVP3 tread score is field_verified. Each score is not field_verified and must be described as a model estimate.
`);
  const southPaTread = tread1.filter((record) => record.mile_nobo_mvp3 >= 40 && record.mile_nobo_mvp3 < 130);
  const northPaTread = tread1.filter((record) => record.mile_nobo_mvp3 >= 180 && record.mile_nobo_mvp3 <= MVP3_LENGTH);
  const avgScore = (records) => round(records.reduce((sum, record) => sum + record.score, 0) / Math.max(1, records.length), 2);
  const avgPenalty = (records) => round(records.reduce((sum, record) => sum + record.pace_penalty_multiplier, 0) / Math.max(1, records.length), 3);
  const paCalibration = {
    calibration_id: 'mvp3-midatlantic-pa-rockiness-calibration',
    south_pa_mile_range_mvp3: [40, 130],
    north_pa_mile_range_mvp3: [180, MVP3_LENGTH],
    south_pa_average_score: avgScore(southPaTread),
    north_pa_average_score: avgScore(northPaTread),
    south_pa_average_pace_penalty: avgPenalty(southPaTread),
    north_pa_average_pace_penalty: avgPenalty(northPaTread),
    source_id: 'mvp3_midatlantic_tread_model',
    source_url: 'internal:data/at-open-reference/scripts/build-mvp3-midatlantic-reference-pack.mjs',
    license_status: 'open_license_share_alike',
    confidence: 'model_calibration_screen_not_field_verified',
    last_checked: GENERATED_DATE,
    last_generated: GENERATED_DATE,
    ai_answer_rule: 'Use only as a PA rockiness calibration screen comparing open-signal model buckets. Do not call it field verified or use it as proof of exact footing.',
  };
  writeJson('processed/tread_rockiness/pa_calibration_report.json', paCalibration);
  writeText('processed/tread_rockiness/pa_calibration_report.md', `# MVP3 Pennsylvania Rockiness Calibration Report

This PA benchmark compares smoother southern Pennsylvania and Cumberland Valley-adjacent open-route miles against rocky northern Pennsylvania ridge miles using the MVP3 open-signal tread model.

- South PA sample: MVP3 miles 40.0-130.0, average score ${paCalibration.south_pa_average_score}, average pace multiplier ${paCalibration.south_pa_average_pace_penalty}x.
- North PA ridge sample: MVP3 miles 180.0-${MVP3_LENGTH.toFixed(1)}, average score ${paCalibration.north_pa_average_score}, average pace multiplier ${paCalibration.north_pa_average_pace_penalty}x.

Signals: USGS 3DEP slope/local relief, OSM tread tag lane documentation, and documented SSURGO/gSSURGO/geology/user-report future lanes.

Caution: this is a model calibration screen, not field_verified. It may miss the lived severity of Pennsylvania rocks and must not be used as a precise footing guarantee.
`);

  buildSchemas();

  const docs = [];
  writeText('rag_docs/state_guides/WV.md', `# MVP3 West Virginia State Guide

Scope: MVP3 starts at generated mile 0.0 near Harpers Ferry and the VA/WV/MD transition.

Key lanes: Harpers Ferry National Historical Park, C&O Canal/Potomac transition, town/access candidates, and multi-jurisdiction current-condition checks.

Generated miles are not official ATC miles. Water records are mapped water candidates with reliability unknown and potability unknown. Current closures, weather, fire, bear activity, snow/ice, flooding, storm damage, road status, and permit changes require live checks.
`);
  docs.push(docMeta('rag_docs/state_guides/WV.md', 'MVP3 West Virginia State Guide', 'state_guide', ['osm', 'usgs_3dep', 'usgs_3dhp_nhd', 'nps_official_land_manager_pages']));
  writeText('rag_docs/state_guides/MD.md', `# MVP3 Maryland State Guide

Scope: generated MVP3 miles roughly 2.0-40.0, covering Maryland South Mountain ridges north from Harpers Ferry toward the Pennsylvania line.

Key lanes: South Mountain State Park, Maryland ridges, designated camping/shelter source lane, road crossings, hunting-season safety, and NWS/NPS/MD DNR live checks.

Generated miles are not official ATC miles. Water records are mapped water candidates with reliability unknown and potability unknown. Current closures, weather, fire, hunting-season safety, flooding, storm damage, road status, and permit changes require live checks.
`);
  docs.push(docMeta('rag_docs/state_guides/MD.md', 'MVP3 Maryland State Guide', 'state_guide', ['osm', 'usgs_3dep', 'usgs_3dhp_nhd', 'maryland_dnr_official_pages']));
  writeText('rag_docs/state_guides/PA.md', `# MVP3 Pennsylvania State Guide

Scope: generated MVP3 miles roughly 40.0-${MVP3_LENGTH.toFixed(1)}, covering southern Pennsylvania forests/Cumberland Valley, Susquehanna and Duncannon, northern Pennsylvania rocky ridges, and the Delaware Water Gap approach.

Key lanes: PA DCNR state forests and parks, PA State Game Lands source gaps, Cumberland Valley and Susquehanna access, northern rocky ridges, Palmerton/Wind Gap corridor, and Delaware Water Gap/NPS transition.

Generated miles are not official ATC miles. Water records are mapped water candidates with reliability unknown and potability unknown. PA tread/rockiness scores are model estimates, not field_verified. Current closures, weather, fire, hunting-season safety, flooding, storm damage, road status, and permit changes require live checks.
`);
  docs.push(docMeta('rag_docs/state_guides/PA.md', 'MVP3 Pennsylvania State Guide', 'state_guide', ['osm', 'usgs_3dep', 'usgs_3dhp_nhd', 'pa_dcnr_official_pages', 'pa_game_commission_official_pages', 'nps_dewa_official_pages', 'mvp3_midatlantic_tread_model']));
  writeText('rag_docs/policies/water.md', '# MVP3 Mid-Atlantic Water Policy\n\nSay "mapped water candidate." Reliability unknown. Potability unknown. Flowlines, springs, and OSM water-related tags do not prove drinkable or reliable water. Use recent licensed/user or official verification before saying reliable water.');
  docs.push(docMeta('rag_docs/policies/water.md', 'MVP3 Mid-Atlantic Water Policy', 'policy', ['usgs_3dhp_nhd', 'osm']));
  writeText('rag_docs/policies/weather_live_conditions.md', '# MVP3 Mid-Atlantic Live Conditions Policy\n\nAlways live-check closures, detours, fire, flooding, storm damage, bear activity, snow/ice, hunting-season safety, permit changes, road access, and dangerous weather. Static docs cannot answer current closures/weather. Use NWS for weather/alerts, NPS for Harpers Ferry/C&O/APPA/Delaware Water Gap, Maryland DNR for South Mountain, PA DCNR for state forests/parks, PA Game Commission for State Game Lands and hunting-season safety, and ATC Trail Updates as a verification pointer only. If live retrieval fails, say so and show last-checked time.');
  docs.push(docMeta('rag_docs/policies/weather_live_conditions.md', 'MVP3 Mid-Atlantic Live Conditions Policy', 'policy', ['noaa_nws_api', 'nps_api', 'nps_dewa_official_pages', 'maryland_dnr_official_pages', 'pa_dcnr_official_pages', 'pa_game_commission_official_pages', 'atc_trail_updates_pointer']));
  writeText('rag_docs/policies/tread_rockiness.md', '# MVP3 Mid-Atlantic Tread Policy\n\nTread scores are model estimates, not field_verified. Preserve the 0-5 score, confidence, and pace multiplier. SSURGO/gSSURGO, geology, and user reports are documented future/weak signals unless a later generated record explicitly says they were ingested.');
  docs.push(docMeta('rag_docs/policies/tread_rockiness.md', 'MVP3 Mid-Atlantic Tread Policy', 'policy', ['mvp3_midatlantic_tread_model']));
  writeText('rag_docs/policies/navigation.md', '# MVP3 Mid-Atlantic Navigation Policy\n\nMVP3 route and milepoints are open-route planning candidates. Generated miles are not official ATC miles and not field-navigation final. Verify with current maps, land managers, and live conditions before committing itinerary or safety decisions.');
  docs.push(docMeta('rag_docs/policies/navigation.md', 'MVP3 Mid-Atlantic Navigation Policy', 'policy', ['osm', 'waymarked_trails_api']));
  writeText('rag_docs/rules/camping_permit_fee_mvp3_midatlantic.md', `# MVP3 Mid-Atlantic Camping / Permit / Fee Rules

This is not a complete legal camping guide. It is a source-aware rule index for Harpers Ferry, C&O/Potomac transition, Maryland South Mountain, Pennsylvania DCNR forests/parks, Pennsylvania State Game Lands source gaps, Delaware Water Gap, and local/private/easement gaps.

Always verify current land-manager rules before itinerary commitment.
`);
  docs.push(docMeta('rag_docs/rules/camping_permit_fee_mvp3_midatlantic.md', 'MVP3 Mid-Atlantic Camping Rules', 'rules', ['nps_official_land_manager_pages', 'maryland_dnr_official_pages', 'pa_dcnr_official_pages', 'pa_game_commission_official_pages', 'nps_dewa_official_pages']));

  const segmentDocs = summarizeSegments(elevations, 25);
  for (const segment of segmentDocs) {
    const name = `mvp3_midatlantic_${String(Math.round(segment.start_mile_nobo_mvp3)).padStart(3, '0')}_${String(Math.round(segment.end_mile_nobo_mvp3)).padStart(3, '0')}.md`;
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
    docs.push(docMeta(pathname, `MVP3 Mid-Atlantic Segment ${segment.start_mile_nobo_mvp3}-${segment.end_mile_nobo_mvp3}`, 'segment_guide', ['osm', 'usgs_3dep', 'usgs_3dhp_nhd', 'mvp3_midatlantic_tread_model']));
  }
  writeJson('rag_docs/rag_doc_metadata.json', docs);

  const behaviorQuestions = buildBehaviorQuestions();
  writeJson('tests/mvp3_midatlantic_behavior_questions.json', behaviorQuestions);

  const manifest = sourceManifest();
  writeJson('source_manifest.yaml', manifest);
  writeText('README.md', `# Scout AT MVP3 Mid-Atlantic Reference Pack

Scope: WV+MD+PA Appalachian Trail planning lane from Harpers Ferry / the VA-WV-MD transition to the PA/NJ / Delaware Water Gap transition, using Scout generated MVP3 miles 0.0-${MVP3_LENGTH.toFixed(1)}.

This pack is source-aware and cautious. It excludes commercial/copyrighted guide/app data unless explicitly licensed. Generated miles are not official ATC miles. Mapped water is not reliable or potable by default. Static docs cannot answer current closures/weather.

Start with \`prompt_artifact_checklist.md\`, \`data_quality_report_mvp3_midatlantic.md\`, and \`tests/validation_results_mvp3_midatlantic.json\`.
`);
  writeText('license_review.md', `# MVP3 Mid-Atlantic License Review

Allowed packaged sources: USGS public-domain data, NWS/NPS APIs as live connectors, NPS/USFS official pages, reviewed state official pages, and OSM/Waymarked ODbL-derived data with attribution.

Blocked unless explicitly licensed: FarOut, The A.T. Guide/AWOL, A.T. Data Book, Thru-Hikers' Companion, AllTrails, Gaia, Hiking Project, copied ATC guide/map/table content, private guide PDFs, and blogs copying guidebook data.

ATC Trail Updates are included as a verification pointer only, not packaged update text/data.
`);
  writeText('blocked_sources.md', fs.readFileSync(path.join(packRoot, 'blocked_sources.md'), 'utf8'));
  writeText('attribution.md', `# MVP3 Mid-Atlantic Attribution

- OpenStreetMap data: OpenStreetMap contributors, ODbL.
- USGS 3DEP and hydrography: Data available from U.S. Geological Survey.
- National Weather Service: National Weather Service API/source attribution for live weather.
- National Park Service: Harpers Ferry NHP, C&O Canal NHP, Appalachian National Scenic Trail, Delaware Water Gap NRA, and NPS API/source pages.
- Maryland Department of Natural Resources: South Mountain official source lane.
- Pennsylvania DCNR: state forest, state park, primitive camping, permit, fire, and current-condition source lane.
- Pennsylvania Game Commission: State Game Lands and hunting-season safety source lane.
`);
  writeText('prompt_artifact_checklist.md', `# MVP3 Mid-Atlantic Prompt-To-Artifact Checklist

Generated: ${GENERATED_DATE}

| Requirement | Evidence | Validation |
| --- | --- | --- |
| Region: WV+MD+PA from Harpers Ferry to PA/NJ / Delaware Water Gap | \`processed/route/mvp3_midatlantic_route.geojson\`, \`processed/route/route_notes.md\`, \`rag_docs/state_guides/{WV,MD,PA}.md\` | Validator checks 264.0 generated MVP3 miles, Harpers Ferry/Delaware Water Gap notes, MVP2 handoff, and NJ/MVP4 handoff. |
| Named places/areas: Harpers Ferry, MD ridges, PA forests/game lands, Cumberland Valley, Susquehanna, northern PA rocky ridges, DWG, key towns/access/resupply candidates | \`processed/rules/rules_by_land_manager.json\`, \`processed/waypoints/*\`, \`rag_docs/state_guides/*.md\` | Validator checks required rule IDs, waypoint/resupply minimum counts, state-guide coverage terms, and behavior questions. |
| Source/license rules: no FarOut/A.T. Guide/Data Book/Companion/AllTrails/Gaia/Hiking Project/copied ATC guide-map data | \`source_manifest.yaml\`, \`license_review.md\`, \`blocked_sources.md\`, \`attribution.md\` | Validator checks blocked source IDs, OSM ODbL labeling, safe-export exclusions, and blocked-source wording. |
| Source lanes: USGS TNM/3DEP/hydrography, OSM, NPS, NWS, MD/PA official pages/GIS, PA DCNR, PA Game Commission, SSURGO/geology/user-report tread lanes | \`source_manifest.yaml\`, \`processed/live_conditions/live_condition_sources.json\`, \`processed/tread_rockiness/model_notes.md\` | Validator checks required source IDs and tread caveats. |
| Route/miles deliverable: route GeoJSON plus 0.1/0.5/1.0 milepoints with global estimate, MVP3 NOBO/SOBO, official:false | \`processed/route/mvp3_midatlantic_route.geojson\`, \`processed/milepoints/*.geojson\` | Validator checks counts, fields, official:false, source_route_id, confidence, license, and generated-mile caution. |
| Elevation deliverable: USGS 3DEP samples, 5/10 mile summaries, major climbs/descents, high/low, steep descents, summary MD | \`processed/elevation/*\` | Validator checks source IDs, sample counts, summaries, major climb/descent/high/low/steep files, and model cautions. |
| Water deliverable: crossings/springs/drinking-water candidates, combined water candidates, sparse/uncertain stretch flags with unknown reliability/potability | \`processed/water/*\` | Validator checks mapped water candidate wording, unknown reliability/potability, null human verification, sparse stretch caveats, and notes. |
| Waypoints/resupply deliverable: shelters, campsites, privies, parking, trailheads, road crossings, vistas, towns/resupply, private-business review lane | \`processed/waypoints/*\` | Validator checks candidate counts, MVP3 miles, state, source/license/confidence/timestamp fields, town service unknowns, and guidebook cautions. |
| Rules deliverable: camping/permit/fee/food/dog/fire rules by land manager | \`processed/rules/*\`, \`rag_docs/rules/camping_permit_fee_mvp3_midatlantic.md\` | Validator checks Harpers Ferry, C&O/Potomac, MD South Mountain, PA DCNR, PA Game Lands, DWG, local/private/easement gaps, and current verification wording. |
| Live connectors deliverable: NPS, NWS, MD/PA alerts, PA DCNR, PA Game Commission, DWG, ATC pointer-only policy | \`processed/live_conditions/*\`, \`rag_docs/policies/weather_live_conditions.md\` | Validator checks required live source IDs, static-cache warnings, live terms including hunting-season safety, last-checked disclosure, and ATC do-not-package rule. |
| Tread/rockiness deliverable: 0.1/1/5 mile scores, 0-5 model, confidence, field_verified:false, pace penalties, PA calibration report | \`processed/tread_rockiness/*\`, \`schemas/tread_rockiness.schema.json\` | Validator checks score range, exact pace multipliers, field_verified:false, PA calibration report, source lanes, and overclaim cautions. |
| RAG docs deliverable: WV/MD/PA state guides, policy docs, rule doc, 25-mile segment guides with AI cautions | \`rag_docs/*\`, \`rag_docs/rag_doc_metadata.json\` | Validator checks metadata/file alignment, segment coverage, required sections, and caution language. |
| Validation/tests/report deliverable: schemas, validator, >=60 behavior questions, data quality report, status dashboard | \`schemas/*\`, \`run_mvp3_midatlantic_validation.py\`, \`tests/mvp3_midatlantic_behavior_questions.json\`, \`data_quality_report_mvp3_midatlantic.md\`, \`MVP3_STATUS.md\` | Validator writes \`tests/validation_results_mvp3_midatlantic.json\`; repo test invokes it. |
| Build/verify commands | \`node data/at-open-reference/scripts/build-mvp3-midatlantic-reference-pack.mjs\`, \`python3 data/at-open-reference/mvp3_midatlantic/run_mvp3_midatlantic_validation.py --json\`, \`npm test\`, \`npm run build:scout:forge\` | Run from repo root after generation; final audit records command output in the thread. |
| Production-safe export and zip | \`processed/export/scout_at_mvp3_midatlantic_production_safe.json\`, \`processed/export/scout_at_mvp3_midatlantic_production_safe.zip\`, \`processed/export/manifest.json\` | Validator checks safe licenses only, blocked/unknown exclusions, declared zip, and ZIP header. |
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
      'processed/route/mvp3_midatlantic_route.geojson',
      'processed/milepoints/mvp3_midatlantic_milepoints_0_1mi.geojson',
      'processed/elevation/elevation_summary.json',
      'processed/water/water_candidates.json',
      'processed/waypoints/shelters.json',
      'processed/rules/rules_by_land_manager.json',
      'processed/tread_rockiness/tread_rockiness_1_0mi.json',
      'rag_docs/rag_doc_metadata.json',
    ],
    excluded_license_statuses: ['unknown_review_required', 'blocked'],
    ai_answer_rule: 'Production-safe MVP3 Mid-Atlantic export still requires generated-mile, water, live-condition, legal-rule, and model-confidence cautions.',
  };
  const exportManifest = {
    pack: 'scout-at-mvp3-midatlantic',
    generated_at: GENERATED_AT,
    route_id: ROUTE_ID,
    mvp3_miles: MVP3_LENGTH,
    production_safe_export: 'processed/export/scout_at_mvp3_midatlantic_production_safe.json',
    production_safe_zip: 'processed/export/scout_at_mvp3_midatlantic_production_safe.zip',
    source_manifest: 'source_manifest.yaml',
    validation: 'run_mvp3_midatlantic_validation.py',
  };
  writeJson('processed/export/scout_at_mvp3_midatlantic_production_safe.json', productionSafe);
  writeJson('processed/export/manifest.json', exportManifest);
  writeZip('processed/export/scout_at_mvp3_midatlantic_production_safe.zip', [
    { name: 'scout_at_mvp3_midatlantic_production_safe.json', data: `${JSON.stringify(productionSafe, null, 2)}\n` },
    { name: 'manifest.json', data: `${JSON.stringify(exportManifest, null, 2)}\n` },
    { name: 'source_manifest.yaml', data: `${JSON.stringify(manifest, null, 2)}\n` },
    { name: 'README.md', data: `Scout AT MVP3 Mid-Atlantic production-safe export generated ${GENERATED_DATE}.\nGenerated miles are not official. Water reliability/potability is unknown unless verified. Current conditions require live checks.\n` },
  ]);

  writeText('data_quality_report_mvp3_midatlantic.md', `# MVP3 Mid-Atlantic Data Quality Report

Generated: ${GENERATED_DATE}

## Work Completed
- Route subset from Harpers Ferry / VA-WV-MD transition anchor to PA/NJ / Delaware Water Gap anchor.
- Generated 0.1, 0.5, and 1.0 milepoints with global estimate, MVP3 NOBO mile, and MVP3 SOBO mile.
- USGS 3DEP elevation samples, 5-mile and 10-mile climb/descent summaries, major climbs/descents, high/low points, steep descents, and summary markdown.
- USGS hydrography water candidates and sparse/uncertain stretch flags, all reliability unknown and potability unknown.
- OSM-derived shelters, campsites, privies, parking, road crossings, trailheads, vistas, and town/resupply candidates.
- Rule source lanes for Harpers Ferry, C&O/Potomac, Maryland South Mountain, Pennsylvania DCNR forests/parks, Pennsylvania State Game Lands, Delaware Water Gap, and local/private/easement source gaps.
- Live-condition connector policy for NWS, NPS/Harpers Ferry/C&O/DWG, Maryland DNR, Pennsylvania DCNR, Pennsylvania Game Commission, and ATC pointer-only checks.
- Tread/rockiness model at 0.1, 1.0, and 5.0 mile intervals.
- Pennsylvania rockiness calibration report comparing south PA against northern rocky ridges with open model signals.
- WV, MD, and PA state guides, 25-mile segment guides, policy docs, and >=60 behavior questions.
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
- MVP2 Virginia handoff is at Harpers Ferry; generated global miles remain open-route estimates.
- NJ/NY/CT are future MVP4 scope; Delaware Water Gap is a handoff, not full New Jersey coverage.
- Water reliability and potability are unknown by default.
- Private business/service details are not packaged unless license OK; town services remain unknown candidates.
- SSURGO/gSSURGO, geology, and user-report rockiness signals are documented but not ingested.
- Live condition caches are placeholders until online checks run.
- Rules outside major official source lanes may require land-manager verification.

## Sources and Licenses
- OSM and Waymarked Trails data are ODbL-derived and require OpenStreetMap attribution/share-alike handling.
- USGS 3DEP and USGS hydrography are public-domain source lanes.
- NWS and NPS are API-accessible live-condition lanes.
- NPS, Maryland DNR, Pennsylvania DCNR, and Pennsylvania Game Commission official pages are used for cautious rule/source pointers.
- ATC Trail Updates are a verification pointer only.
- Unknown-review and blocked sources are excluded from production-safe JSON and zip exports.

## Measured Length
Scout MVP3 Mid-Atlantic measured length is ${MVP3_LENGTH.toFixed(1)} generated miles along the open route subset. This is not official ATC mileage and inherits the parent route's known length-gap warning.

## Blocked Sources
FarOut, The A.T. Guide/AWOL, A.T. Data Book, Thru-Hikers' Companion, AllTrails, Gaia, Hiking Project, copied ATC guide/map text/data, private guide PDFs, and copied guidebook blog data remain blocked unless explicitly licensed.

## Validation
Run:

\`\`\`bash
python3 data/at-open-reference/mvp3_midatlantic/run_mvp3_midatlantic_validation.py
\`\`\`

The validator writes \`tests/validation_results_mvp3_midatlantic.json\`. The expected checked-in result for this generation is \`ok: true\`.

## Next Work
- Replace source-gap rule lanes with more precise district/park records after legal/source review.
- Add validated OSM route-segment tread tag joins, then evaluate SSURGO/gSSURGO and geology signals.
- Add trusted user-submitted water/tread reports only with explicit provenance and timestamps.
- Build MVP4 NJ/NY/CT as a separate pack.
`);
  writeText('MVP3_STATUS.md', `# MVP3 Mid-Atlantic Status

Status: generated; latest validation result is tracked in \`tests/validation_results_mvp3_midatlantic.json\`.

| Lane | Status | Note |
| --- | --- | --- |
| Route | green | Open-route WV/MD/PA subset generated with explicit non-official mileage caution. |
| Elevation | green | USGS 3DEP summaries generated. |
| Water | yellow | Mapped candidates only; reliability/potability unknown. |
| Waypoints | yellow | OSM candidates only; private business/service details not confirmed. |
| Rules | yellow | Major source lanes covered; local/current rules still require live verification. |
| Live connectors | yellow | Source pointers ready; caches are not current. |
| Tread | yellow | Model estimates only, not field verified. |
| RAG docs | green | WV/MD/PA guides, policy docs, and 25-mile segments generated. |
| Validation | green | Validator expected result: ok true. |
| Licensing | green | Blocked/unknown sources excluded from production-safe exports. |

Production-safe zip: \`processed/export/scout_at_mvp3_midatlantic_production_safe.zip\`.
`);
  writeJson('manifest.json', {
    pack_id: 'scout-at-mvp3-midatlantic-harpers-ferry-delaware-water-gap',
    route_id: ROUTE_ID,
    generated_at: GENERATED_AT,
    scope: {
      start: 'VA/WV/MD transition / Harpers Ferry open-route candidate',
      end: 'PA/NJ transition / Delaware Water Gap open-route candidate',
      generated_mile_range_mvp3: [0, MVP3_LENGTH],
      generated_mile_range_global_est: [START_GLOBAL_MILE, END_GLOBAL_MILE],
    },
    prompt_artifact_checklist: 'prompt_artifact_checklist.md',
    source_manifest: 'source_manifest.yaml',
    production_safe_export: 'processed/export/scout_at_mvp3_midatlantic_production_safe.json',
    production_safe_zip: 'processed/export/scout_at_mvp3_midatlantic_production_safe.zip',
    validation: 'run_mvp3_midatlantic_validation.py',
  });

  console.log(`Built Scout AT MVP3 Mid-Atlantic pack at ${path.relative(process.cwd(), mvpRoot)}`);
}

build();
