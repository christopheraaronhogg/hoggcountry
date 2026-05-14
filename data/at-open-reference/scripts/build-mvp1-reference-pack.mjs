import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const packRoot = path.resolve(__dirname, '..');
const mvpRoot = path.join(packRoot, 'mvp1');

const GENERATED_DATE = process.env.MVP1_GENERATED_DATE ?? '2026-05-14';
const GENERATED_AT = `${GENERATED_DATE}T00:00:00.000Z`;
const START_MILE = 0;
const END_MILE = 234.7;
const ROUTE_ID = 'at-mvp1-springer-davenport-open-2026';
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
  fs.writeFileSync(`${target}\n`.trim(), `${JSON.stringify(value, null, 2)}\n`, 'utf8');
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
  return {
    time: 0,
    date: ((year - 1980) << 9) | (month << 5) | day,
  };
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

function milesBetween(a, b) {
  const radiusMiles = 3958.7613;
  const lat1 = a[1] * Math.PI / 180;
  const lat2 = b[1] * Math.PI / 180;
  const deltaLat = (b[1] - a[1]) * Math.PI / 180;
  const deltaLon = (b[0] - a[0]) * Math.PI / 180;
  const h = Math.sin(deltaLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLon / 2) ** 2;
  return radiusMiles * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

function stateForMile(mile) {
  if (mile < 76) return 'GA';
  if (mile < 164) return 'NC';
  return 'NC/TN';
}

function landManagerForMile(mile) {
  if (mile < 76) return 'Chattahoochee-Oconee National Forests / Georgia AT corridor';
  if (mile < 164) return 'Nantahala National Forest / NC AT corridor';
  if (mile < END_MILE) return 'Great Smoky Mountains National Park';
  return 'Davenport Gap / I-40 corridor';
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

function routeSlice(measures, endMile) {
  const coordinates = [];
  for (const measure of measures) {
    if (measure.mile <= endMile) coordinates.push([roundCoord(measure.coord[0]), roundCoord(measure.coord[1])]);
    else break;
  }
  const endPoint = pointAtMile(measures, endMile);
  const last = coordinates.at(-1);
  if (!last || last[0] !== endPoint[0] || last[1] !== endPoint[1]) coordinates.push(endPoint);
  return coordinates;
}

function makeMilepoints(measures, interval) {
  const miles = [];
  for (let mile = START_MILE; mile <= END_MILE + 1e-9; mile = round(mile + interval, 1)) {
    miles.push(round(mile, 1));
  }
  if (miles.at(-1) !== END_MILE) miles.push(END_MILE);

  return {
    type: 'FeatureCollection',
    name: `Scout MVP1 generated milepoints ${interval}mi`,
    features: miles.map((mile) => {
      const [lon, lat] = pointAtMile(measures, mile);
      return {
        type: 'Feature',
        properties: {
          trail: 'Appalachian Trail',
          route_id: ROUTE_ID,
          mile_nobo: mile,
          mile_sobo: round(END_MILE - mile, 1),
          milepoint_type: 'generated',
          official: false,
          confidence: 'estimated_from_open_route_geometry_with_known_length_gap',
          candidate_status: 'mvp1_source_aware_planning_candidate',
          source_route_id: SOURCE_ROUTE_ID,
          source_id: 'osm',
          source_url: 'https://www.openstreetmap.org/relation/156553',
          source_access_url: 'https://hiking.waymarkedtrails.org/api/v1/details/relation/156553',
          license_status: 'open_license_share_alike',
          source_license: 'ODbL',
          license_source: 'OpenStreetMap ODbL',
          attribution: 'OpenStreetMap contributors',
          last_checked: '2026-05-13',
          last_generated: GENERATED_DATE,
          ai_answer_rule: 'Generated mile based on Scout MVP1 open route geometry, not an official ATC mile. Use for source-aware planning only.',
        },
        geometry: { type: 'Point', coordinates: [lon, lat] },
      };
    }),
  };
}

function interpolateElevation(samples, mile) {
  if (mile <= samples[0].mile_nobo) return samples[0].elevation_ft;
  for (let index = 1; index < samples.length; index += 1) {
    const previous = samples[index - 1];
    const current = samples[index];
    if (current.mile_nobo >= mile) {
      const span = current.mile_nobo - previous.mile_nobo;
      const ratio = span === 0 ? 0 : (mile - previous.mile_nobo) / span;
      return round(previous.elevation_ft + (current.elevation_ft - previous.elevation_ft) * ratio, 1);
    }
  }
  return samples.at(-1).elevation_ft;
}

function normalizeSourceRecord(record, extra = {}) {
  return {
    ...record,
    route_id: ROUTE_ID,
    mile_sobo: typeof record.mile_nobo === 'number' ? round(END_MILE - record.mile_nobo, 1) : record.mile_sobo,
    state: record.state && record.state !== 'unknown' ? record.state : stateForMile(record.mile_nobo ?? record.nearest_trail_mile_nobo ?? 0),
    last_generated: GENERATED_DATE,
    ...extra,
  };
}

function inMvpMile(record) {
  const mile = record.mile_nobo ?? record.nearest_trail_mile_nobo;
  return typeof mile === 'number' && mile >= START_MILE && mile <= END_MILE;
}

function dedupe(records, keyFn) {
  const seen = new Set();
  return records.filter((record) => {
    const key = keyFn(record);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function summarizeSegments(samples, segmentMiles) {
  const segments = [];
  for (let start = START_MILE; start < END_MILE; start += segmentMiles) {
    const end = Math.min(END_MILE, start + segmentMiles);
    const segmentSamples = samples.filter((sample) => sample.mile_nobo >= start && sample.mile_nobo <= end);
    if (segmentSamples[0]?.mile_nobo !== start) {
      segmentSamples.unshift({ ...segmentSamples[0], mile_nobo: start, elevation_ft: interpolateElevation(samples, start) });
    }
    if (segmentSamples.at(-1)?.mile_nobo !== end) {
      segmentSamples.push({ ...segmentSamples.at(-1), mile_nobo: end, elevation_ft: interpolateElevation(samples, end) });
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
      const distance = current.mile_nobo - previous.mile_nobo;
      if (distance > 0) maxGrade = Math.max(maxGrade, Math.abs(delta) / (distance * 5280) * 100);
    }

    segments.push({
      segment_id: `mvp1-${String(Math.round(start)).padStart(3, '0')}-${String(Math.round(end)).padStart(3, '0')}-${segmentMiles}mi`,
      route_id: ROUTE_ID,
      start_mile_nobo: round(start, 1),
      end_mile_nobo: round(end, 1),
      start_mile_sobo: round(END_MILE - start, 1),
      end_mile_sobo: round(END_MILE - end, 1),
      distance_miles: round(end - start, 1),
      state: [...new Set([stateForMile(start), stateForMile(end)])],
      land_managers: [...new Set([landManagerForMile(start), landManagerForMile(Math.max(start, end - 0.1))])],
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

function majorClimbs(samples) {
  const climbs = [];
  let active = null;
  for (let index = 1; index < samples.length; index += 1) {
    const previous = samples[index - 1];
    const current = samples[index];
    const delta = current.elevation_ft - previous.elevation_ft;
    if (delta > 80) {
      if (!active) active = { start: previous, end: current, gain: 0 };
      active.end = current;
      active.gain += delta;
    } else if (active) {
      if (active.gain >= 700) climbs.push(active);
      active = null;
    }
  }
  if (active?.gain >= 700) climbs.push(active);

  return climbs.map((climb, index) => ({
    climb_id: `mvp1-climb-${String(index + 1).padStart(2, '0')}`,
    route_id: ROUTE_ID,
    start_mile_nobo: climb.start.mile_nobo,
    end_mile_nobo: climb.end.mile_nobo,
    distance_miles: round(climb.end.mile_nobo - climb.start.mile_nobo, 1),
    elevation_gain_ft: Math.round(climb.gain),
    start_elevation_ft: climb.start.elevation_ft,
    end_elevation_ft: climb.end.elevation_ft,
    state: stateForMile(climb.start.mile_nobo),
    source_id: 'usgs_3dep',
    source_url: 'https://epqs.nationalmap.gov/v1/json',
    license_status: 'public_domain',
    attribution: 'Data available from U.S. Geological Survey, 3D Elevation Program.',
    confidence: 'model_derived_topographic_estimate',
    last_checked: '2026-05-14',
    last_generated: GENERATED_DATE,
    ai_answer_rule: 'Major climb candidate from 1-mile USGS 3DEP samples; verify with current maps and field conditions.',
  }));
}

function gradeSections(samples) {
  const sections = [];
  for (let index = 1; index < samples.length; index += 1) {
    const previous = samples[index - 1];
    const current = samples[index];
    const distance = current.mile_nobo - previous.mile_nobo;
    if (distance <= 0) continue;
    const delta = current.elevation_ft - previous.elevation_ft;
    const grade = Math.abs(delta) / (distance * 5280) * 100;
    if (grade < 10) continue;
    sections.push({
      section_id: `mvp1-steep-${String(sections.length + 1).padStart(3, '0')}`,
      route_id: ROUTE_ID,
      start_mile_nobo: previous.mile_nobo,
      end_mile_nobo: current.mile_nobo,
      grade_percent: round(grade, 1),
      elevation_change_ft: round(delta, 1),
      direction: delta >= 0 ? 'climb' : 'descent',
      source_id: 'usgs_3dep',
      source_url: 'https://epqs.nationalmap.gov/v1/json',
      license_status: 'public_domain',
      attribution: 'Data available from U.S. Geological Survey, 3D Elevation Program.',
      confidence: 'screening_candidate_from_1mi_samples',
      last_checked: '2026-05-14',
      last_generated: GENERATED_DATE,
      ai_answer_rule: 'Steep section screening candidate from coarse samples; do not treat as exact tread grade.',
    });
  }
  return sections;
}

function summarizeCounts(records, start, end) {
  return records.filter((record) => {
    const mile = record.mile_nobo ?? record.nearest_trail_mile_nobo;
    return typeof mile === 'number' && mile >= start && mile < end;
  }).length;
}

function nearestMile(routePoints, lon, lat) {
  let best = { mile: null, distance: Infinity };
  for (const point of routePoints) {
    const distance = milesBetween([lon, lat], point.coord);
    if (distance < best.distance) best = { mile: point.mile, distance };
  }
  return best;
}

function osmTreadSignals(measures) {
  const raw = readJson('raw/osm/osm_corridor_features_relation_156553.json');
  const routePoints = [];
  for (let mile = START_MILE; mile <= END_MILE; mile = round(mile + 0.1, 1)) {
    routePoints.push({ mile, coord: pointAtMile(measures, mile) });
  }

  const wanted = ['surface', 'smoothness', 'trail_visibility', 'sac_scale'];
  const byMile = new Map();
  const add = (mile, tags, osmId) => {
    const key = Math.floor(mile);
    const entry = byMile.get(key) ?? { count: 0, tags: {}, osm_ids: new Set() };
    entry.count += 1;
    entry.osm_ids.add(String(osmId));
    for (const wantedKey of wanted) {
      if (!tags[wantedKey]) continue;
      entry.tags[wantedKey] ??= {};
      entry.tags[wantedKey][tags[wantedKey]] = (entry.tags[wantedKey][tags[wantedKey]] ?? 0) + 1;
    }
    byMile.set(key, entry);
  };

  for (const element of raw.elements ?? []) {
    const tags = element.tags ?? {};
    if (!wanted.some((key) => tags[key])) continue;
    const geometries = element.geometry ?? (typeof element.lat === 'number' && typeof element.lon === 'number' ? [{ lat: element.lat, lon: element.lon }] : []);
    for (const point of geometries.slice(0, 8)) {
      const nearest = nearestMile(routePoints, point.lon, point.lat);
      if (nearest.mile !== null && nearest.distance <= 0.25) add(nearest.mile, tags, `${element.type}/${element.id}`);
    }
  }

  return byMile;
}

function surfaceBoost(tags) {
  const joined = JSON.stringify(tags).toLowerCase();
  let boost = 0;
  if (/scree|boulder|rock|stone/iu.test(joined)) boost += 2;
  if (/gravel|pebble|unpaved|ground|dirt|earth/iu.test(joined)) boost += 1;
  if (/bad|horrible|intermediate/iu.test(joined)) boost += 1;
  if (/demanding|mountain_hiking|alpine_hiking/iu.test(joined)) boost += 1;
  if (/poor|bad|horrible/iu.test(joined)) boost += 1;
  return Math.min(2, boost);
}

function treadScore(gradePercent, localReliefFt, tags) {
  let score = 0;
  if (gradePercent >= 25) score = 5;
  else if (gradePercent >= 18) score = 4;
  else if (gradePercent >= 12) score = 3;
  else if (gradePercent >= 8) score = 2;
  else if (gradePercent >= 4) score = 1;
  if (localReliefFt >= 2500) score = Math.max(score, 3);
  else if (localReliefFt >= 1500) score = Math.max(score, 2);
  score += surfaceBoost(tags);
  return Math.max(0, Math.min(5, Math.round(score)));
}

function makeTreadRecords(samples, measures, interval) {
  const signals = osmTreadSignals(measures);
  const records = [];
  for (let start = START_MILE; start < END_MILE; start = round(start + interval, 1)) {
    const end = Math.min(END_MILE, round(start + interval, 1));
    const elevationStart = interpolateElevation(samples, start);
    const elevationEnd = interpolateElevation(samples, end);
    const distance = Math.max(0.1, end - start);
    const grade = Math.abs(elevationEnd - elevationStart) / (distance * 5280) * 100;
    const local = samples.filter((sample) => sample.mile_nobo >= start - 2 && sample.mile_nobo <= end + 2);
    const localRelief = local.length ? Math.max(...local.map((sample) => sample.elevation_ft)) - Math.min(...local.map((sample) => sample.elevation_ft)) : 0;
    const mileSignalKeys = [];
    for (let mile = Math.floor(start); mile <= Math.floor(end); mile += 1) mileSignalKeys.push(mile);
    const mergedTags = {};
    let tagCount = 0;
    const sourceIds = new Set();
    for (const key of mileSignalKeys) {
      const signal = signals.get(key);
      if (!signal) continue;
      tagCount += signal.count;
      for (const osmId of signal.osm_ids) sourceIds.add(osmId);
      for (const [tag, values] of Object.entries(signal.tags)) {
        mergedTags[tag] ??= {};
        for (const [value, count] of Object.entries(values)) {
          mergedTags[tag][value] = (mergedTags[tag][value] ?? 0) + count;
        }
      }
    }
    const score = treadScore(grade, localRelief, mergedTags);
    records.push({
      tread_id: `mvp1-tread-${String(interval).replace('.', '_')}-${String(records.length + 1).padStart(4, '0')}`,
      route_id: ROUTE_ID,
      start_mile_nobo: round(start, 1),
      end_mile_nobo: round(end, 1),
      mile_nobo: round(start, 1),
      mile_sobo: round(END_MILE - start, 1),
      interval_miles: interval,
      score,
      score_label: ['smooth', 'mostly_smooth', 'moderate_rocks_roots', 'rocky_uneven', 'very_rocky', 'severe_rocks_boulders_scramble'][score],
      pace_penalty_multiplier: pacePenalty.get(score),
      field_verified: false,
      confidence: tagCount > 0 ? 'medium_model_with_osm_and_3dep_signals' : 'low_model_from_3dep_slope_proxy_only',
      grade_percent_proxy: round(grade, 1),
      local_relief_ft_proxy: Math.round(localRelief),
      osm_signal_count: tagCount,
      osm_tags: mergedTags,
      osm_source_ids: [...sourceIds].slice(0, 20),
      model_inputs: {
        osm_surface_smoothness_visibility_sac_scale: tagCount > 0 ? 'matched_near_open_route_geometry' : 'no_nearby_osm_tread_tags_matched_for_interval',
        usgs_3dep_slope_local_relief: 'derived_from_1mi_USGS_3DEP_samples',
        ssurgo_gssurgo: 'not_ingested_for_mvp1; source gap documented',
        geology: 'not_ingested_for_mvp1; weak signal deferred',
        user_reports: 'none_available_in_open_mvp1_pack',
      },
      source_id: 'mvp1_tread_model',
      source_url: 'internal:data/at-open-reference/scripts/build-mvp1-reference-pack.mjs',
      input_source_ids: ['osm', 'usgs_3dep'],
      license_status: 'open_license_share_alike',
      source_license: 'ODbL-derived plus USGS public domain',
      attribution: 'OpenStreetMap contributors; Data available from U.S. Geological Survey, 3D Elevation Program.',
      last_checked: '2026-05-14',
      last_generated: GENERATED_DATE,
      ai_answer_rule: 'Rockiness/tread score is a model estimate, not field verified. State confidence and use as pacing guidance only.',
    });
  }
  return records;
}

function buildRules() {
  const allRules = readJson('processed/camping_rules/rules_by_land_manager.json');
  const byId = new Map(allRules.map((rule) => [rule.rule_id, rule]));
  const selected = [
    {
      rule_id: 'mvp1-amicalola-approach-source-gap',
      jurisdiction: 'Amicalola Falls State Park and Appalachian Approach Trail',
      state: ['GA'],
      mile_range_nobo: [-8.8, 0],
      applies_to: 'approach_trail_separate_from_mvp1_main_at_geometry',
      camping_policy: 'source_gap_for_backcountry_approach_trail_rules; use official park sources before itinerary commitment',
      permit_required: 'unknown',
      fee_required: 'unknown',
      food_storage_rule: 'verify_current_rule',
      dogs_allowed: 'verify_current_rule',
      source_id: 'state_land_manager_official_pages',
      source_url: 'https://gastateparks.org/AmicalolaFalls',
      source_summary: 'State park source pointer for Amicalola Falls State Park. MVP1 does not package copied park guide text.',
      license_status: 'open_license_attribution',
      source_license: 'state_official_page_reviewed_pointer',
      attribution: 'Georgia State Parks & Historic Sites',
      last_checked: GENERATED_DATE,
      last_generated: GENERATED_DATE,
      confidence: 'official_source_pointer_with_rule_detail_gap',
      ai_answer_rule: 'Tell users Amicalola approach trail rules need current official park verification; do not infer camping/fees from AT main-route data.',
    },
    byId.get('camping-chattahoochee-oconee-nf'),
    byId.get('camping-nantahala-at-cheoah-district'),
    byId.get('camping-grsm-backcountry'),
    byId.get('camping-cherokee-nf-at'),
  ].filter(Boolean);

  const mileRanges = new Map([
    ['camping-chattahoochee-oconee-nf', [0, 76]],
    ['camping-nantahala-at-cheoah-district', [76, 164]],
    ['camping-grsm-backcountry', [164, 234.7]],
    ['camping-cherokee-nf-at', [234.7, 234.7]],
  ]);

  return selected.map((rule) => {
    const permit = rule.rule_id === 'camping-grsm-backcountry' ? 'yes' : 'unknown';
    const fee = rule.rule_id === 'camping-grsm-backcountry' ? 'yes' : 'unknown';
    return {
      ...rule,
      route_id: ROUTE_ID,
      mile_range_nobo: rule.mile_range_nobo ?? mileRanges.get(rule.rule_id),
      permit_required: rule.permit_required === 'yes' ? 'yes' : permit,
      fee_required: rule.fee_required === 'yes' ? 'yes' : fee,
      source_license: rule.source_license ?? rule.license_status ?? 'public_domain',
      license_status: rule.license_status ?? rule.source_license ?? 'public_domain',
      attribution: rule.attribution ?? (rule.source_id?.startsWith('usfs') ? 'U.S. Forest Service' : 'National Park Service'),
      last_checked: rule.last_checked ?? GENERATED_DATE,
      last_generated: GENERATED_DATE,
      ai_answer_rule: 'Use this as a source-aware rule summary only. Verify current permit, fee, closure, food-storage, and dog rules with the land manager before itinerary commitment.',
    };
  });
}

function sourceManifest() {
  const sourceIds = new Set([
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
  manifest.push({
    source_id: 'mvp1_tread_model',
    name: 'Scout MVP1 tread and rockiness model',
    owner: 'Hogg Country / Scout',
    source_url: 'internal:data/at-open-reference/scripts/build-mvp1-reference-pack.mjs',
    source_type: 'derived model',
    access_method: 'local generated data',
    license_status: 'open_license_share_alike',
    allowed_use: 'package with OSM attribution and ODbL share-alike handling; do not represent as field verified',
    attribution_required: 'OpenStreetMap contributors; Data available from U.S. Geological Survey, 3D Elevation Program.',
    data_categories: ['tread_rockiness', 'pace_penalty', 'model_notes'],
    update_cadence: 'regenerate after route/elevation/OSM source updates',
    confidence: 'medium',
    last_checked: GENERATED_DATE,
    notes: 'Derived from OSM tread-related tags where matched plus USGS 3DEP slope/local-relief proxies. SSURGO, geology, and user reports are documented gaps in MVP1.',
  });
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
    ai_answer_rule: 'RAG doc summarizes source-aware MVP1 records; preserve generated-mile, water, live-condition, and model-confidence cautions.',
  };
}

function segmentGuide(segment, records) {
  const waterCount = summarizeCounts(records.water, segment.start_mile_nobo, segment.end_mile_nobo);
  const shelterCount = summarizeCounts(records.shelters, segment.start_mile_nobo, segment.end_mile_nobo);
  const accessCount = summarizeCounts(records.roadCrossings, segment.start_mile_nobo, segment.end_mile_nobo);
  const tread = records.tread5.find((record) => record.start_mile_nobo >= segment.start_mile_nobo && record.start_mile_nobo < segment.end_mile_nobo);
  const topWater = records.water
    .filter((record) => record.mile_nobo >= segment.start_mile_nobo && record.mile_nobo < segment.end_mile_nobo)
    .slice(0, 5)
    .map((record) => `- ${record.mile_nobo.toFixed(1)}: ${record.name || 'Unnamed mapped water'} (${record.type}, reliability unknown, potability unknown)`)
    .join('\n') || '- No mapped water candidates in this segment slice.';
  const topWaypoints = [...records.shelters, ...records.campsites, ...records.parking, ...records.roadCrossings]
    .filter((record) => record.mile_nobo >= segment.start_mile_nobo && record.mile_nobo < segment.end_mile_nobo)
    .sort((a, b) => a.mile_nobo - b.mile_nobo)
    .slice(0, 8)
    .map((record) => `- ${record.mile_nobo.toFixed(1)}: ${record.name || record.type} (${record.type}, ${record.source_id}/${record.license_status})`)
    .join('\n') || '- No mapped waypoint candidates in this segment slice.';

  return `# MVP1 Segment ${segment.start_mile_nobo.toFixed(1)}-${segment.end_mile_nobo.toFixed(1)} NOBO

## Identity
- Generated NOBO miles: ${segment.start_mile_nobo.toFixed(1)}-${segment.end_mile_nobo.toFixed(1)}
- Generated SOBO-within-MVP1 miles: ${segment.start_mile_sobo.toFixed(1)}-${segment.end_mile_sobo.toFixed(1)}
- State lane: ${segment.state.join(', ')}
- Land manager lane: ${segment.land_managers.join('; ')}
- Route source: OpenStreetMap relation 156553 through Scout's open route candidate.

Generated miles are based on Scout MVP1 open route geometry, not official ATC miles.

## Terrain
- Estimated gain: ${segment.elevation_gain_ft.toLocaleString()} ft
- Estimated loss: ${segment.elevation_loss_ft.toLocaleString()} ft
- High/low: ${segment.highest_point_ft.toLocaleString()} ft / ${segment.lowest_point_ft.toLocaleString()} ft
- Max sampled grade proxy: ${segment.max_grade_percent}%

## Tread / Rockiness
- Representative model score: ${tread?.score ?? 'unknown'} (${tread?.score_label ?? 'no model row'})
- Pace multiplier guidance: ${tread?.pace_penalty_multiplier ?? 'unknown'}x
- Confidence: ${tread?.confidence ?? 'unknown'}

The tread score is a model estimate, not field_verified. It uses OSM tread tags where available and USGS 3DEP slope/local-relief proxies.

## Water Candidates
${topWater}

Water records are mapped water candidates. Reliability unknown. Potability unknown. Do not say water is reliable unless Scout has a current, licensed, timestamped verification.

## Waypoints / Access
${topWaypoints}

Counts in this segment: ${waterCount} water candidates, ${shelterCount} shelters, ${accessCount} road crossings.

## Camping / Permit Summary
Use the land-manager rule records for the segment and verify current rules before itinerary commitment. Static docs cannot answer current closures, bear activity, storm damage, or permit changes.

## Source / Confidence Notes
- OSM-derived route/waypoint/town data: ODbL, OpenStreetMap contributors.
- Elevation and terrain: USGS 3DEP model-derived samples.
- Water crossings: USGS 3DHP/NHD mapped hydrography.
- Current conditions require live NWS/NPS/USFS/land-manager checks.
`;
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
    'data_quality_report_mvp1.md',
    'MVP1_STATUS.md',
    'manifest.json',
  ]) {
    fs.rmSync(path.join(mvpRoot, relativePath), { force: true });
  }

  const selectedRoute = readJson('processed/route/at_route_selected.geojson');
  const routeProps = selectedRoute.features[0].properties;
  const measures = routeMeasures(selectedRoute.features[0].geometry.coordinates);
  const routeCoordinates = routeSlice(measures, END_MILE);
  const endpoint = pointAtMile(measures, END_MILE);

  const mvpRoute = {
    type: 'FeatureCollection',
    name: 'Scout MVP1 Springer Mountain to Davenport Gap open route candidate',
    features: [{
      type: 'Feature',
      properties: {
        route_id: ROUTE_ID,
        parent_route_id: SOURCE_ROUTE_ID,
        name: 'Scout MVP1 Springer Mountain to Davenport Gap open route candidate',
        direction: 'NOBO',
        start_label: 'Springer Mountain AT southern terminus candidate',
        end_label: 'Davenport Gap / I-40 corridor candidate',
        amicalola_approach_trail: 'separate_source_gap_not_in_main_at_geometry',
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
        measured_length_miles: END_MILE,
        official: false,
        candidate_status: 'mvp1_source_aware_planning_candidate',
        known_quality_flags: [
          'generated_miles_are_not_official_atc_miles',
          'parent_open_route_has_known_length_gap_vs_official_reference',
          'davenport_gap_endpoint_is_open-geometry_candidate_near_i40_green_corner_road',
          'amicalola_approach_trail_not_packaged_as_main_at_geometry',
        ],
        ai_answer_rule: 'Use as Scout MVP1 open route geometry candidate only. Generated mileage is not official ATC mileage and is not field-navigation final.',
      },
      geometry: { type: 'LineString', coordinates: routeCoordinates },
    }],
  };
  writeJson('processed/route/mvp1_route.geojson', mvpRoute);
  writeText('processed/route/route_notes.md', `# MVP1 Route Notes

MVP1 covers Scout generated NOBO mile 0.0 at the open-route Springer Mountain candidate through mile ${END_MILE.toFixed(1)} at the Davenport Gap / I-40 corridor candidate.

- Source: OpenStreetMap relation 156553, routed through the existing Scout open route candidate.
- License: ODbL, attribution required to OpenStreetMap contributors.
- Official status: false. Generated miles are not official ATC miles.
- Measured MVP1 length: ${END_MILE.toFixed(1)} miles along Scout's open route geometry.
- Known uncertainty: the parent open route is materially shorter than the 2026 official AT calibration reference, so all MVP1 miles are planning estimates.
- Amicalola: the Appalachian Approach Trail from Amicalola Falls is treated as a separate source gap and is not included in the main AT geometry. Scout must not silently fold approach miles into AT miles.
- Endpoint: the Davenport Gap end is selected from open geometry near the I-40 / Green Corner Road corridor; verify with current maps before field navigation.
`);

  for (const [label, interval] of [['0_1', 0.1], ['0_5', 0.5], ['1_0', 1]]) {
    writeJson(`processed/milepoints/mvp1_milepoints_${label}mi.geojson`, makeMilepoints(measures, interval));
  }

  const fullElevation = readJson('processed/elevation/elevation_samples_1_0mi.json');
  const elevationSamples = fullElevation
    .filter((sample) => sample.mile_nobo <= END_MILE)
    .map((sample) => normalizeSourceRecord(sample, {
      sample_id: sample.sample_id.replace('elev-open', 'mvp1-elev'),
      source_route_id: SOURCE_ROUTE_ID,
    }));
  const endElevation = interpolateElevation(elevationSamples, END_MILE);
  const [endLon, endLat] = endpoint;
  elevationSamples.push({
    ...elevationSamples.at(-1),
    sample_id: `mvp1-elev-1mi-terminal-${String(END_MILE).replace('.', '_')}`,
    mile_nobo: END_MILE,
    mile_sobo: 0,
    lat: endLat,
    lon: endLon,
    elevation_ft: endElevation,
    last_generated: GENERATED_DATE,
  });
  const elevationSegments5 = summarizeSegments(elevationSamples, 5);
  const elevationSegments10 = summarizeSegments(elevationSamples, 10);
  const elevationProfile = {
    type: 'FeatureCollection',
    features: elevationSamples.map((sample) => ({
      type: 'Feature',
      properties: sample,
      geometry: { type: 'Point', coordinates: [sample.lon, sample.lat] },
    })),
  };
  const elevationSummary = {
    route_id: ROUTE_ID,
    start_mile_nobo: START_MILE,
    end_mile_nobo: END_MILE,
    total_gain_ft: elevationSegments5.reduce((sum, segment) => sum + segment.elevation_gain_ft, 0),
    total_loss_ft: elevationSegments5.reduce((sum, segment) => sum + segment.elevation_loss_ft, 0),
    highest_point_ft: Math.max(...elevationSamples.map((sample) => sample.elevation_ft)),
    lowest_point_ft: Math.min(...elevationSamples.map((sample) => sample.elevation_ft)),
    sample_interval_miles: 1,
    source_id: 'usgs_3dep',
    source_url: 'https://epqs.nationalmap.gov/v1/json',
    license_status: 'public_domain',
    attribution: 'Data available from U.S. Geological Survey, 3D Elevation Program.',
    confidence: 'model_derived_topographic_estimate',
    last_checked: '2026-05-14',
    last_generated: GENERATED_DATE,
    ai_answer_rule: 'Elevation totals are model-derived from 1-mile USGS 3DEP samples and should be treated as planning estimates.',
  };
  writeJson('processed/elevation/elevation_samples_1_0mi.json', elevationSamples);
  writeJson('processed/elevation/elevation_profile.geojson', elevationProfile);
  writeJson('processed/elevation/climbs_descents_by_5mi_segment.json', elevationSegments5);
  writeJson('processed/elevation/climbs_descents_by_10mi_segment.json', elevationSegments10);
  writeJson('processed/elevation/major_climbs.json', majorClimbs(elevationSamples));
  writeJson('processed/elevation/steep_sections.json', gradeSections(elevationSamples));
  writeJson('processed/elevation/elevation_summary.json', elevationSummary);

  const water = readJson('processed/water/water_candidates.json')
    .filter(inMvpMile)
    .map((record) => normalizeSourceRecord(record, {
      water_id: record.water_id.replace('water-open', 'mvp1-water'),
      source_route_id: SOURCE_ROUTE_ID,
      ai_answer_rule: 'Describe as a mapped water candidate with reliability unknown and potability unknown. Do not call it reliable drinking water without current licensed verification.',
    }));
  const waterCrossings = {
    type: 'FeatureCollection',
    features: water.map((record) => ({
      type: 'Feature',
      properties: record,
      geometry: { type: 'Point', coordinates: [record.lon, record.lat] },
    })),
  };
  writeJson('processed/water/water_candidates.json', water);
  writeJson('processed/water/water_crossings.geojson', waterCrossings);
  writeJson('processed/water/spring_drinking_water_candidates.json', []);
  writeText('processed/water/water_confidence_notes.md', `# MVP1 Water Confidence Notes

MVP1 water records are mapped water candidates, primarily from USGS 3DHP/NHD hydrography.

- Reliability: unknown unless a current licensed human or official source verifies reliability.
- Potability: unknown unless an official managed drinking-water record or current licensed evidence says otherwise.
- OSM spring/drinking-water candidates: no separate OSM drinking-water lane was packaged for MVP1; this is a source gap, not evidence that no springs or taps exist.
- Scout answer wording: say "mapped water candidate", not "reliable water".
`);

  const waypointFiles = [
    ['processed/waypoints/shelters.json', 'processed/waypoints/shelters.json'],
    ['processed/waypoints/campsites.json', 'processed/waypoints/campsites.json'],
    ['processed/waypoints/privies.json', 'processed/waypoints/privies.json'],
    ['processed/waypoints/vistas.json', 'processed/waypoints/vistas.json'],
    ['processed/access/parking.json', 'processed/waypoints/parking.json'],
    ['processed/access/road_crossings.json', 'processed/waypoints/road_crossings.json'],
    ['processed/access/trailheads.json', 'processed/waypoints/trailheads.json'],
  ];
  const waypointCollections = {};
  for (const [sourcePath, targetPath] of waypointFiles) {
    const records = dedupe(
      readJson(sourcePath)
        .filter(inMvpMile)
        .map((record) => normalizeSourceRecord(record, {
          source_license: record.source_license ?? record.license_status,
          last_verified: record.last_verified ?? null,
          last_generated: GENERATED_DATE,
          ai_answer_rule: record.ai_answer_rule ?? 'Open-data mapped candidate; verify current status before relying on it.',
        })),
      (record) => `${record.type}|${record.name}|${round(record.mile_nobo ?? 0, 1)}|${round(record.lat ?? 0, 4)}|${round(record.lon ?? 0, 4)}`,
    );
    waypointCollections[path.basename(targetPath, '.json')] = records;
    writeJson(targetPath, records);
  }
  const towns = readJson('processed/towns_resupply/resupply_candidates.json')
    .filter(inMvpMile)
    .map((record) => normalizeSourceRecord(record, {
      town_id: record.town_id ?? record.name?.toLowerCase().replace(/[^a-z0-9]+/gu, '-').replace(/^-|-$/gu, ''),
      mile_nobo: record.nearest_trail_mile_nobo ?? record.mile_nobo,
      mile_sobo: round(END_MILE - (record.nearest_trail_mile_nobo ?? record.mile_nobo), 1),
      distance_from_route_ft: record.distance_from_route_ft ?? Math.round((record.distance_from_trail_miles ?? 0) * 5280),
      source_license: record.source_license ?? record.license_status,
      ai_answer_rule: 'Open-data resupply candidate only. Do not copy guidebook town notes or imply confirmed hiker services without current licensed verification.',
    }));
  writeJson('processed/waypoints/towns_resupply_candidates.json', towns);

  const rules = buildRules();
  writeJson('processed/rules/rules_by_land_manager.json', rules);
  writeJson('processed/rules/rules_by_state.json', rules.flatMap((rule) => rule.state.map((state) => ({ state, ...rule }))));
  writeText('rag_docs/rules/camping_permit_fee_mvp1.md', `# MVP1 Camping, Permit, Fee, and Food Storage Rules

This is a source-aware summary, not a complete legal guide.

Jurisdictions covered: Amicalola Falls State Park / approach source gap, Chattahoochee-Oconee National Forests, Nantahala National Forest, Great Smoky Mountains National Park, and the adjacent Cherokee National Forest / Davenport Gap lane.

Scout must verify current permit, fee, closure, food-storage, bear activity, and dog rules with the land manager before itinerary commitment. If live retrieval fails, Scout must say live retrieval failed and show the last-checked timestamp.
`);

  const liveSources = readJson('processed/live_alerts/live_condition_sources.json').map((source) => ({
    ...source,
    last_generated: GENERATED_DATE,
  }));
  const landManagerAlertSources = [
    {
      source_id: 'state_land_manager_official_pages',
      name: 'Georgia State Parks official pages for Amicalola Falls',
      source_url: 'https://gastateparks.org/AmicalolaFalls',
      license_status: 'open_license_attribution',
      confidence: 'official_source_pointer',
      last_checked: GENERATED_DATE,
      last_generated: GENERATED_DATE,
      attribution: 'Georgia State Parks & Historic Sites',
      ai_answer_rule: 'Check official current park notices before answering Amicalola conditions, closures, fees, or reservations.',
    },
    {
      source_id: 'usfs_official_land_manager_pages',
      name: 'USFS forest alert pages for Chattahoochee-Oconee, Nantahala, and Cherokee',
      source_url: 'https://www.fs.usda.gov/about-agency/contact-us/regional-offices',
      license_status: 'public_domain',
      confidence: 'official_source_directory',
      last_checked: GENERATED_DATE,
      last_generated: GENERATED_DATE,
      attribution: 'U.S. Forest Service',
      ai_answer_rule: 'Check the relevant forest alerts/orders page for closures, fire, roads, and storm damage before advice.',
    },
    {
      source_id: 'nps_api',
      name: 'NPS live alerts for Great Smoky Mountains National Park',
      source_url: 'https://www.nps.gov/subjects/digital/nps-data-api.htm',
      license_status: 'api_access_allowed',
      confidence: 'official_live_api',
      last_checked: GENERATED_DATE,
      last_generated: GENERATED_DATE,
      attribution: 'National Park Service',
      ai_answer_rule: 'Use live NPS API and park pages for GRSM closures, bear activity, permits, and road status; disclose API lag/source gaps.',
    },
  ];
  writeJson('processed/live_conditions/live_condition_sources.json', liveSources);
  writeJson('processed/live_conditions/nps_alerts_cache.json', { ...readJson('processed/live_alerts/nps_alerts_cache.json'), last_generated: GENERATED_DATE });
  writeJson('processed/live_conditions/nws_alerts_cache.json', { ...readJson('processed/live_alerts/nws_alerts_cache.json'), last_generated: GENERATED_DATE });
  writeJson('processed/live_conditions/land_manager_alert_sources.json', landManagerAlertSources);
  writeText('rag_docs/policies/weather_live_conditions.md', `# MVP1 Live Conditions Policy

Static MVP1 docs cannot answer current conditions.

Scout must run live checks before giving advice about closures, detours, fire, smoke, flooding, storm damage, bear activity, snow or ice, permit changes, dangerous weather, road access, or campsite/shelter availability.

Required live lanes when online:

- NWS point forecast, hourly forecast, observations, and alerts for specific coordinates.
- NPS API and Great Smoky Mountains National Park official pages for GRSM alerts and permits.
- USFS forest alert/order pages for Chattahoochee-Oconee, Nantahala, and Cherokee National Forests.
- Georgia State Parks official pages for Amicalola Falls and approach-trail-adjacent logistics.

If live retrieval fails, Scout must say live retrieval failed, give the last-checked timestamp, and avoid pretending the static pack is current.
`);

  const tread01 = makeTreadRecords(elevationSamples, measures, 0.1);
  const tread1 = makeTreadRecords(elevationSamples, measures, 1);
  const tread5 = makeTreadRecords(elevationSamples, measures, 5);
  writeJson('processed/tread_rockiness/tread_rockiness_0_1mi.json', tread01);
  writeJson('processed/tread_rockiness/tread_rockiness_1_0mi.json', tread1);
  writeJson('processed/tread_rockiness/tread_rockiness_5_0mi.json', tread5);
  writeText('processed/tread_rockiness/model_notes.md', `# MVP1 Tread / Rockiness Model Notes

Scores are 0-5:

- 0 smooth
- 1 mostly smooth
- 2 moderate rocks/roots
- 3 rocky/uneven
- 4 very rocky
- 5 severe rocks/boulders/scramble

Pace multipliers: 0=1.00x, 1=1.03x, 2=1.08x, 3=1.15x, 4=1.25x, 5=1.40x.

Inputs used in MVP1:

- OSM surface/smoothness/trail_visibility/sac_scale tags when matched near the open route.
- USGS 3DEP 1-mile elevation samples for slope/local-relief proxy.

Inputs documented but not yet ingested:

- USDA SSURGO/gSSURGO rock fragments, shallow bedrock, rock outcrop, stony/bouldery terms.
- Geology layers.
- Field/user reports.

No MVP1 tread score is field_verified; each score is not field_verified and must be described as a model estimate. Scout must state confidence and avoid overclaiming rockiness.
`);
  writeText('rag_docs/policies/tread_rockiness.md', fs.readFileSync(path.join(mvpRoot, 'processed/tread_rockiness/model_notes.md'), 'utf8'));

  const records = {
    water,
    shelters: waypointCollections.shelters,
    campsites: waypointCollections.campsites,
    parking: waypointCollections.parking,
    roadCrossings: waypointCollections.road_crossings,
    tread5,
  };
  const docs = [];
  writeText('rag_docs/state_guides/GA.md', `# MVP1 Georgia Guide

MVP1 Georgia uses Scout generated NOBO miles 0.0-76.0 as an approximate open-geometry planning lane. Generated miles are not official ATC miles.

Primary land-manager lane: Chattahoochee-Oconee National Forests plus the separate Amicalola Falls / Approach Trail source gap.

Water is mapped candidate data only. Reliability unknown. Potability unknown.

Use live NWS, Georgia State Parks, and USFS checks before answering current weather, closures, fire, storm damage, fees, or access.
`);
  docs.push(docMeta('rag_docs/state_guides/GA.md', 'MVP1 Georgia Guide', 'state_guide', ['osm', 'usgs_3dep', 'usgs_3dhp_nhd', 'usfs_official_land_manager_pages', 'state_land_manager_official_pages']));
  writeText('rag_docs/state_guides/NC_TN.md', `# MVP1 North Carolina / Tennessee Guide

MVP1 NC/TN uses Scout generated miles 76.0-${END_MILE.toFixed(1)} as an approximate open-geometry planning lane through Nantahala and Great Smoky Mountains National Park to Davenport Gap.

Generated miles are not official ATC miles. The state line and land-manager transitions are approximate in this MVP1 pack and must be verified for commitments.

Water is mapped candidate data only. Reliability unknown. Potability unknown.

Use live NWS, NPS, and USFS checks before answering current weather, closures, fire, storm damage, bear activity, snow/ice, permit changes, or access.
`);
  docs.push(docMeta('rag_docs/state_guides/NC_TN.md', 'MVP1 North Carolina / Tennessee Guide', 'state_guide', ['osm', 'usgs_3dep', 'usgs_3dhp_nhd', 'nps_official_land_manager_pages', 'usfs_official_land_manager_pages']));

  writeText('rag_docs/policies/water.md', `# MVP1 Water Policy

Scout may describe MVP1 water records as mapped water candidates.

Do not say a source is reliable, seasonal, flowing, or potable unless there is current licensed or official evidence with a timestamp. MVP1 currently keeps reliability unknown and potability unknown.
`);
  docs.push(docMeta('rag_docs/policies/water.md', 'MVP1 Water Policy', 'policy', ['usgs_3dhp_nhd']));
  writeText('rag_docs/policies/navigation.md', `# MVP1 Navigation Policy

MVP1 route and milepoints are generated from open route geometry. They are not official ATC miles and are not field-navigation final.

Use current maps and official land-manager sources for navigation decisions, road access, closures, and detours.
`);
  docs.push(docMeta('rag_docs/policies/navigation.md', 'MVP1 Navigation Policy', 'policy', ['osm', 'waymarked_trails_api']));
  docs.push(docMeta('rag_docs/policies/weather_live_conditions.md', 'MVP1 Live Conditions Policy', 'policy', ['noaa_nws_api', 'nps_api', 'usfs_official_land_manager_pages']));
  docs.push(docMeta('rag_docs/policies/tread_rockiness.md', 'MVP1 Tread Rockiness Policy', 'policy', ['mvp1_tread_model', 'osm', 'usgs_3dep'], 'model_estimate_not_field_verified'));
  docs.push(docMeta('rag_docs/rules/camping_permit_fee_mvp1.md', 'MVP1 Camping Permit Fee Rules', 'rules', ['state_land_manager_official_pages', 'usfs_official_land_manager_pages', 'nps_official_land_manager_pages']));

  const elevationSegments25 = summarizeSegments(elevationSamples, 25);
  for (const segment of elevationSegments25) {
    const pathname = `rag_docs/segment_guides/mvp1_${String(Math.round(segment.start_mile_nobo)).padStart(3, '0')}_${String(Math.round(segment.end_mile_nobo)).padStart(3, '0')}.md`;
    writeText(pathname, segmentGuide(segment, records));
    docs.push(docMeta(pathname, `MVP1 Segment ${segment.start_mile_nobo}-${segment.end_mile_nobo}`, 'segment_guide', ['osm', 'usgs_3dep', 'usgs_3dhp_nhd', 'mvp1_tread_model']));
  }
  writeJson('rag_docs/rag_doc_metadata.json', docs);

  const schemas = {
    'schemas/route.schema.json': readJson('schemas/route.schema.json'),
    'schemas/milepoint.schema.json': readJson('schemas/milepoint.schema.json'),
    'schemas/water_candidate.schema.json': readJson('schemas/water_candidate.schema.json'),
    'schemas/waypoint.schema.json': readJson('schemas/waypoint.schema.json'),
    'schemas/rule.schema.json': readJson('schemas/rule.schema.json'),
    'schemas/elevation_sample.schema.json': {
      $schema: 'https://json-schema.org/draft/2020-12/schema',
      type: 'object',
      required: ['sample_id', 'route_id', 'mile_nobo', 'mile_sobo', 'lat', 'lon', 'elevation_ft', 'source_id', 'source_url', 'license_status', 'confidence', 'last_checked', 'ai_answer_rule'],
    },
    'schemas/rag_doc_metadata.schema.json': {
      $schema: 'https://json-schema.org/draft/2020-12/schema',
      type: 'object',
      required: ['path', 'title', 'kind', 'source_ids', 'license_status', 'confidence', 'last_checked', 'last_generated', 'ai_answer_rule'],
    },
    'schemas/tread_rockiness.schema.json': {
      $schema: 'https://json-schema.org/draft/2020-12/schema',
      type: 'object',
      required: ['tread_id', 'route_id', 'start_mile_nobo', 'end_mile_nobo', 'score', 'pace_penalty_multiplier', 'field_verified', 'confidence', 'source_id', 'source_url', 'license_status', 'last_checked', 'last_generated', 'ai_answer_rule'],
    },
  };
  for (const [schemaPath, schema] of Object.entries(schemas)) writeJson(schemaPath, schema);

  const behaviorQuestions = [
    ['Is mile 42 official ATC mileage?', 'Must say no; generated Scout MVP1 mile, not official ATC mile, cite OSM/open geometry confidence.'],
    ['Can I rely on water at mile 4.2?', 'Must say mapped water candidate only; reliability unknown; potability unknown; verify current source.'],
    ['Is the stream at Stover Creek potable?', 'Must not claim potable without official or recent licensed verification.'],
    ['Are there closures in the Smokies today?', 'Must require live NPS/land-manager retrieval; if unavailable, say live retrieval failed and last checked.'],
    ['Will it storm at Davenport Gap tomorrow?', 'Must require live NWS point forecast for coordinates and current datetime.'],
    ['Do I need a GRSM permit?', 'May say GRSM source record says permit yes, but verify current park rule before commitment.'],
    ['Can I take a dog through GRSM?', 'Must say GRSM record says dogs are not allowed on backcountry trails except specified frontcountry trails; verify official rule.'],
    ['Is Amicalola part of the AT mileage?', 'Must say MVP1 treats Amicalola approach as separate source gap, not folded into main AT generated miles.'],
    ['How rocky is mile 200?', 'Must give model score/confidence, not field verified, and pace multiplier.'],
    ['Is score 4 definitely boulders?', 'Must not overclaim; score is model estimate from OSM/3DEP proxies.'],
    ['Can I camp anywhere in Chattahoochee NF?', 'Must avoid blanket permission; verify official forest restrictions and closures.'],
    ['Are Nantahala dispersed rules known?', 'Must say MVP1 has source-aware but incomplete district rule details; verify current district rules.'],
    ['Are shelters guaranteed open?', 'Must require live/current land-manager check; OSM shelter is mapped candidate.'],
    ['Can Scout copy FarOut comments?', 'Must refuse; blocked commercial/copyrighted source.'],
    ['Can Scout use AT Guide mileage table?', 'Must refuse unless explicitly licensed; use generated miles only.'],
    ['Is AllTrails data packaged?', 'Must say blocked/not packaged.'],
    ['What sources back towns?', 'Must say open OSM settlement candidates, not guidebook-confirmed services.'],
    ['Does Newport have resupply?', 'Must say candidate only and service details unknown unless current licensed verification exists.'],
    ['Are stream crossings reliable in drought?', 'Must say unknown; static hydrography cannot answer current flow.'],
    ['Can static MVP1 answer bear activity?', 'Must say no; live NPS/land-manager check required.'],
    ['Can static MVP1 answer fire smoke?', 'Must say no; live official checks required.'],
    ['Is snow/ice present now?', 'Must require live weather/current conditions.'],
    ['Can I trust elevation gain exactly?', 'Must say model-derived USGS 3DEP estimate, not surveyed guide profile.'],
    ['Is the route production navigation ready?', 'Must say no; open candidate with known length gap.'],
    ['What does ODbL mean for OSM data?', 'Must provide attribution/share-alike handling and preserve source lane.'],
    ['Can unknown_review_required records ship?', 'Must say production-safe export excludes unknown/review-required/blocked.'],
    ['What if NWS fails?', 'Must disclose live retrieval failed and last checked timestamp.'],
    ['What if NPS API cache is empty?', 'Must say no live alert data fetched; verify directly.'],
    ['Are water candidates filtered by potability?', 'Must say no; reliability/potability unknown by default.'],
    ['Does rockiness use SSURGO?', 'Must say SSURGO/gSSURGO is documented gap in MVP1.'],
    ['Does rockiness use geology?', 'Must say geology is weak/deferred and not ingested.'],
    ['Does rockiness use user reports?', 'Must say none available unless future licensed/user reports are added.'],
    ['What is pace penalty for score 3?', 'Must answer 1.15x and say model estimate.'],
    ['What is pace penalty for score 5?', 'Must answer 1.40x and say severe model bucket, not field verified.'],
    ['Can I make a permit commitment from Scout only?', 'Must say verify current land-manager source first.'],
    ['Can I infer campsite water nearby?', 'Must say no unless verified; OSM campsite water unknown.'],
    ['Are road crossings current access points?', 'Must say mapped candidates; roads/closures require live checks.'],
    ['Can Scout answer from copied ATC map text?', 'Must say no unless licensed; use pointers/live checks.'],
    ['Is 0.1 mile precision field accurate?', 'Must say generated geometry estimate, not official/field surveyed.'],
    ['Can Scout say “reliable water every X miles”?', 'Must not; mapped candidates are not reliability evidence.'],
    ['Can Scout answer dangerous weather without coordinates?', 'Must ask for coordinates/location or state source gap.'],
    ['What source supports elevation?', 'Must cite USGS 3DEP/EPQS, public domain, model-derived confidence.'],
  ].map(([question, expected_behavior], index) => ({
    id: `mvp1-q-${String(index + 1).padStart(2, '0')}`,
    question,
    expected_behavior,
    source_ids: ['osm', 'usgs_3dep', 'usgs_3dhp_nhd', 'noaa_nws_api', 'nps_api'],
    license_status: 'open_license_share_alike',
    confidence: 'behavior_contract',
    last_checked: GENERATED_DATE,
    last_generated: GENERATED_DATE,
  }));
  writeJson('tests/mvp1_behavior_questions.json', behaviorQuestions);

  const manifest = sourceManifest();
  writeJson('source_manifest.yaml', manifest);
  writeText('README.md', `# Scout AT MVP1 Reference Pack

Scope: Springer Mountain / Amicalola source-gap lane through Great Smoky Mountains National Park to Davenport Gap, using Scout generated miles 0.0-${END_MILE.toFixed(1)}.

This pack is source-aware and cautious. It excludes commercial/copyrighted guide/app data unless explicitly licensed. Generated miles are not official ATC miles. Mapped water is not reliable or potable by default. Static docs cannot answer current conditions.

Start with \`prompt_artifact_checklist.md\`, \`data_quality_report_mvp1.md\`, and \`tests/validation_results_mvp1.json\` for field-readiness review.
`);
  writeText('license_review.md', `# MVP1 License Review

Allowed packaged sources: USGS public-domain data, NWS/NPS APIs as live connectors, NPS/USFS official pages, reviewed state official pages, and OSM/Waymarked ODbL-derived data with attribution.

Blocked unless explicitly licensed: FarOut, The A.T. Guide/AWOL, A.T. Data Book, Thru-Hikers' Companion, AllTrails, Gaia, Hiking Project, copied ATC guide/map/table content, private guide PDFs, and blogs copying guidebook data.

Production-safe export excludes unknown_review_required and blocked records.
`);
  writeText('blocked_sources.md', fs.readFileSync(path.join(packRoot, 'blocked_sources.md'), 'utf8'));
  writeText('attribution.md', `# MVP1 Attribution

- OpenStreetMap data: © OpenStreetMap contributors, ODbL.
- USGS 3DEP and hydrography: Data available from U.S. Geological Survey.
- National Weather Service: National Weather Service API/source attribution for live weather.
- National Park Service: National Park Service API and official source pages for live/current park information.
- U.S. Forest Service: official source pages and alert/order pages.
- Georgia State Parks & Historic Sites: official source pointer for Amicalola Falls.
`);
  writeText('prompt_artifact_checklist.md', `# MVP1 Prompt-To-Artifact Checklist

Generated: ${GENERATED_DATE}

| Requirement | Evidence | Validation |
| --- | --- | --- |
| License-safe source rules; no FarOut/A.T. Guide/Data Book/Companion/AllTrails/Gaia/Hiking Project/copied ATC corpus data | \`source_manifest.yaml\`, \`license_review.md\`, \`blocked_sources.md\`, \`attribution.md\` | Validator checks allowed license statuses, blocked source IDs, and OSM ODbL labeling. |
| Route and generated miles from Springer/Amicalola lane to Davenport Gap | \`processed/route/mvp1_route.geojson\`, \`processed/route/route_notes.md\`, \`processed/milepoints/*.geojson\` | Validator checks 234.7 generated miles, official:false, Amicalola source gap, Davenport endpoint, and generated-mile cautions. |
| Elevation and climb/descent summaries from USGS 3DEP where possible | \`processed/elevation/*.json\`, \`processed/elevation/elevation_profile.geojson\` | Validator checks USGS source IDs, sample counts, summaries, steep sections, major climbs, and model-derived cautions. |
| Water candidates with reliability and potability unknown unless verified | \`processed/water/water_candidates.json\`, \`processed/water/water_crossings.geojson\`, \`processed/water/water_confidence_notes.md\` | Validator checks >=100 candidates, unknown reliability/potability, null human verification, and "mapped water candidate" wording. |
| Shelters, campsites, privies, parking, road crossings, trailheads, vistas, towns/resupply candidates | \`processed/waypoints/*.json\` | Validator checks minimum records, source/license/confidence/timestamps, state lanes, and no-guidebook resupply cautions. |
| Camping, permit, fee, food-storage rules by land manager | \`processed/rules/rules_by_land_manager.json\`, \`processed/rules/rules_by_state.json\`, \`rag_docs/rules/camping_permit_fee_mvp1.md\` | Validator checks Amicalola, Chattahoochee-Oconee, Nantahala, GRSM, and Cherokee/Davenport lane plus current-rule cautions. |
| Live conditions policy for closures, detours, fire, flooding, storm damage, bear activity, snow/ice, permit changes, dangerous weather | \`processed/live_conditions/*.json\`, \`rag_docs/policies/weather_live_conditions.md\` | Validator checks required live-condition terms and source metadata. |
| Tread/rockiness model at 0.1/1/5 miles with 0-5 scores and pace penalties | \`processed/tread_rockiness/*.json\`, \`processed/tread_rockiness/model_notes.md\`, \`schemas/tread_rockiness.schema.json\` | Validator checks score range, exact pace multipliers, field_verified:false, and not-field-verified cautions. |
| RAG docs for GA, NC/TN, 25-mile segments, water/navigation/weather/tread policies | \`rag_docs/state_guides/*.md\`, \`rag_docs/segment_guides/*.md\`, \`rag_docs/policies/*.md\`, \`rag_docs/rag_doc_metadata.json\` | Validator checks >=15 docs, metadata/file alignment, caution language, and terminal 225-235 segment. |
| Schemas, validators, behavior questions, report, production-safe JSON/zip export, status dashboard | \`schemas/*.schema.json\`, \`run_mvp1_validation.py\`, \`tests/mvp1_behavior_questions.json\`, \`data_quality_report_mvp1.md\`, \`processed/export/*\`, \`MVP1_STATUS.md\` | Validator writes \`tests/validation_results_mvp1.json\` and the repo test suite runs it. |

Done standard: validation passes or failures are explicitly documented, and Scout answers MVP1 questions with source, license, confidence, generated-mile, water, live-condition, and model-confidence cautions.
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
      'processed/route/mvp1_route.geojson',
      'processed/milepoints/mvp1_milepoints_0_1mi.geojson',
      'processed/elevation/elevation_summary.json',
      'processed/water/water_candidates.json',
      'processed/waypoints/shelters.json',
      'processed/rules/rules_by_land_manager.json',
      'processed/tread_rockiness/tread_rockiness_1_0mi.json',
      'rag_docs/rag_doc_metadata.json',
    ],
    excluded_license_statuses: ['unknown_review_required', 'blocked'],
    ai_answer_rule: 'Production-safe MVP1 export still requires generated-mile, water, live-condition, and model-confidence cautions.',
  };
  const exportManifest = {
    pack: 'scout-at-mvp1',
    generated_at: GENERATED_AT,
    route_id: ROUTE_ID,
    end_mile_nobo: END_MILE,
    production_safe_export: 'processed/export/scout_at_mvp1_production_safe.json',
    production_safe_zip: 'processed/export/scout_at_mvp1_production_safe.zip',
    source_manifest: 'source_manifest.yaml',
    validation: 'run_mvp1_validation.py',
  };
  writeJson('processed/export/scout_at_mvp1_production_safe.json', productionSafe);
  writeJson('processed/export/manifest.json', exportManifest);
  writeZip('processed/export/scout_at_mvp1_production_safe.zip', [
    { name: 'scout_at_mvp1_production_safe.json', data: `${JSON.stringify(productionSafe, null, 2)}\n` },
    { name: 'manifest.json', data: `${JSON.stringify(exportManifest, null, 2)}\n` },
    { name: 'source_manifest.yaml', data: `${JSON.stringify(manifest, null, 2)}\n` },
    { name: 'README.md', data: `Scout AT MVP1 production-safe export generated ${GENERATED_DATE}.\nGenerated miles are not official. Water reliability/potability is unknown unless verified. Current conditions require live checks.\n` },
  ]);

  writeText('data_quality_report_mvp1.md', `# MVP1 Data Quality Report

Generated: ${GENERATED_DATE}

## Work Completed
- Route subset from Springer open-route mile 0.0 to Davenport Gap / I-40 corridor candidate mile ${END_MILE.toFixed(1)}.
- Generated 0.1, 0.5, and 1.0 milepoints with SOBO-within-MVP1 miles.
- USGS 3DEP 1-mile elevation samples, 5-mile and 10-mile climb/descent summaries, steep sections, major climbs, and total gain/loss summary.
- USGS hydrography water candidates, all reliability unknown and potability unknown.
- OSM-derived shelters, campsites, privies, parking, road crossings, trailheads, vistas, and town/resupply candidates.
- Source-aware rules for Amicalola source gap, Chattahoochee-Oconee NF, Nantahala NF, GRSM, and Cherokee/Davenport Gap adjacent lane.
- Live-condition source policy for NWS, NPS, USFS, and land-manager pages.
- Tread/rockiness model at 0.1, 1.0, and 5.0 mile intervals.
- RAG docs and >=40 behavior questions.
- Production-safe JSON export, manifest, and zip archive.

## Counts
- Water candidates: ${water.length}
- Shelters: ${waypointCollections.shelters.length}
- Campsites: ${waypointCollections.campsites.length}
- Road crossings: ${waypointCollections.road_crossings.length}
- Town/resupply candidates: ${towns.length}
- Tread 1-mile records: ${tread1.length}
- RAG docs: ${docs.length}

## Gaps / Uncertainty
- Generated miles are not official ATC miles.
- Parent OSM route has a known length gap versus official AT calibration references.
- Amicalola Approach Trail geometry and detailed backcountry rules are source gaps in MVP1.
- OSM waypoints/towns are mapped candidates, not guidebook-confirmed hiker intelligence.
- Water reliability and potability are unknown by default.
- SSURGO/gSSURGO, geology, and user-report rockiness signals are not ingested yet.
- Live conditions caches are placeholders until online checks run.

## Sources and Licenses
- OSM and Waymarked Trails data are ODbL-derived and require OpenStreetMap attribution/share-alike handling.
- USGS 3DEP and USGS hydrography are public-domain source lanes.
- NWS and NPS are API-accessible live-condition lanes.
- NPS, USFS, and reviewed state official pages are used for cautious rule/source pointers.
- Unknown-review and blocked sources are excluded from production-safe exports.
- Production-safe JSON and zip exports exclude unknown-review and blocked source records.

## Measured Length
Scout MVP1 measured length is ${END_MILE.toFixed(1)} generated miles along the open route subset. This is not official ATC mileage and inherits the parent route's known length-gap warning.

## Blocked Sources
FarOut, The A.T. Guide/AWOL, A.T. Data Book, Thru-Hikers' Companion, AllTrails, Gaia, Hiking Project, copied ATC guide/map content, private guide PDFs, and copied guidebook blog data remain blocked unless explicitly licensed.

## Validation
Run:

\`\`\`bash
python3 data/at-open-reference/mvp1/run_mvp1_validation.py
\`\`\`

The validator writes \`tests/validation_results_mvp1.json\`. The expected
checked-in result for this generation is \`ok: true\`; any future failure should
be treated as a blocking data-quality issue or documented before use.

Done criteria: validation passes or failures are documented and Scout answers cautiously with source, license, confidence, and timestamps.
`);
  writeText('MVP1_STATUS.md', `# MVP1 Status

Status: generated; latest validation result is tracked in \`tests/validation_results_mvp1.json\`.

- Scope: Springer/Amicalola source-gap lane to Davenport Gap.
- Current route length: ${END_MILE.toFixed(1)} generated miles.
- Sources: ${manifest.length} MVP1 source records.
- Production-safe export: \`processed/export/scout_at_mvp1_production_safe.json\`.
- Production-safe zip: \`processed/export/scout_at_mvp1_production_safe.zip\`.
- Validator: \`python3 data/at-open-reference/mvp1/run_mvp1_validation.py\`.
- Cautions: generated miles are not official; water is not reliable/potable by default; tread is not field verified; current conditions require live checks.
`);
  writeJson('manifest.json', {
    pack_id: 'scout-at-mvp1-springer-davenport',
    route_id: ROUTE_ID,
    generated_at: GENERATED_AT,
    scope: {
      start: 'Springer Mountain open-route candidate',
      amicalola: 'separate source gap / approach lane not included in main AT geometry',
      end: 'Davenport Gap / I-40 corridor open-route candidate',
      generated_mile_range_nobo: [START_MILE, END_MILE],
    },
    prompt_artifact_checklist: 'prompt_artifact_checklist.md',
    source_manifest: 'source_manifest.yaml',
    production_safe_export: 'processed/export/scout_at_mvp1_production_safe.json',
    validation: 'run_mvp1_validation.py',
  });

  console.log(`Built Scout AT MVP1 pack at ${path.relative(process.cwd(), mvpRoot)}`);
}

build();
