import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const packRoot = path.resolve(__dirname, '..');

const rawPath = path.join(packRoot, 'raw', 'osm', 'osm_corridor_features_relation_156553.json');
const milepointsPath = path.join(packRoot, 'processed', 'milepoints', 'at_milepoints_1_0mi.geojson');
const osmRelationUrl = 'https://www.openstreetmap.org/relation/156553';

const sourceBase = {
  source_id: 'osm',
  source_url: osmRelationUrl,
  source: 'OpenStreetMap contributors',
  source_license: 'ODbL',
  license_status: 'open_license_share_alike',
  attribution: 'OpenStreetMap contributors',
  confidence: 'mapped_osm_candidate',
  last_checked: '2026-05-13',
};

const maxDistanceMiles = {
  campsite: 1.25,
  privy_or_toilet: 1,
  vista: 1.25,
  parking: 1,
  trailhead: 1.25,
  road_crossing: 0.075,
  town_candidate: 15,
};

const keptTagNames = new Set([
  'access',
  'amenity',
  'capacity',
  'fee',
  'highway',
  'name',
  'operator',
  'parking',
  'place',
  'ref',
  'tourism',
  'website',
]);

function round(n, digits) {
  const f = 10 ** digits;
  return Math.round(n * f) / f;
}

function haversineMiles(lat1, lon1, lat2, lon2) {
  const r = 3958.8;
  const toRad = (deg) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * r * Math.asin(Math.sqrt(a));
}

function loadMilepoints() {
  const data = JSON.parse(fs.readFileSync(milepointsPath, 'utf8'));
  return data.features.map((feature) => {
    const [lon, lat] = feature.geometry.coordinates;
    return {
      mile: feature.properties.mile_nobo,
      mileSobo: feature.properties.mile_sobo,
      lat,
      lon,
    };
  });
}

function nearestMilepoint(point, milepoints) {
  let best = null;
  for (const mp of milepoints) {
    const d = haversineMiles(point.lat, point.lon, mp.lat, mp.lon);
    if (!best || d < best.distanceMiles) best = { ...mp, distanceMiles: d };
  }
  return best;
}

function pointFromElement(element, milepoints, preferNearestGeometry = false) {
  if (element.type === 'node' && Number.isFinite(element.lat) && Number.isFinite(element.lon)) {
    return { lat: element.lat, lon: element.lon };
  }

  const geometry = Array.isArray(element.geometry)
    ? element.geometry.filter((point) => Number.isFinite(point.lat) && Number.isFinite(point.lon))
    : [];

  if (preferNearestGeometry && geometry.length) {
    let best = null;
    for (const point of geometry) {
      const nearest = nearestMilepoint(point, milepoints);
      if (!best || nearest.distanceMiles < best.distanceMiles) {
        best = { lat: point.lat, lon: point.lon, distanceMiles: nearest.distanceMiles };
      }
    }
    return best ? { lat: best.lat, lon: best.lon } : null;
  }

  if (element.center && Number.isFinite(element.center.lat) && Number.isFinite(element.center.lon)) {
    return { lat: element.center.lat, lon: element.center.lon };
  }

  if (geometry.length) {
    const sum = geometry.reduce(
      (acc, point) => ({ lat: acc.lat + point.lat, lon: acc.lon + point.lon }),
      { lat: 0, lon: 0 },
    );
    return { lat: sum.lat / geometry.length, lon: sum.lon / geometry.length };
  }

  return null;
}

function cleanString(value) {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function selectTags(tags = {}) {
  return Object.fromEntries(Object.entries(tags).filter(([key]) => keptTagNames.has(key)));
}

function osmIdentity(element) {
  return {
    osm_type: element.type,
    osm_id: element.id,
  };
}

function commonRecord(element, point, nearest, id, type, name, extra = {}) {
  return {
    ...id,
    trail: 'Appalachian Trail',
    route_id: 'at-main-osm-2026-open',
    type,
    name: cleanString(name) || `Unnamed ${type.replaceAll('_', ' ')}`,
    mile_nobo: nearest ? round(nearest.mile, 1) : null,
    mile_sobo: nearest ? round(nearest.mileSobo, 1) : null,
    lat: round(point.lat, 6),
    lon: round(point.lon, 6),
    distance_from_route_ft: nearest ? Math.round(nearest.distanceMiles * 5280) : null,
    ...sourceBase,
    ...osmIdentity(element),
    last_verified: null,
    osm_tags: selectTags(element.tags),
    ...extra,
  };
}

function isRoad(element) {
  const highway = element.tags?.highway;
  return Boolean(highway && !/^(path|footway|steps|cycleway|bridleway|pedestrian|platform|corridor|construction|proposed)$/u.test(highway));
}

function classify(element) {
  const tags = element.tags || {};
  if (tags.tourism === 'camp_site') return 'campsite';
  if (tags.amenity === 'toilets') return 'privy_or_toilet';
  if (tags.amenity === 'parking') return 'parking';
  if (tags.highway === 'trailhead') return 'trailhead';
  if (tags.tourism === 'viewpoint') return 'vista';
  if (tags.place && /^(city|town|village)$/u.test(tags.place)) return 'town_candidate';
  if (isRoad(element)) return 'road_crossing';
  return null;
}

function pushRecord(buckets, record) {
  const bucket = {
    campsite: 'campsites',
    privy_or_toilet: 'privies',
    vista: 'vistas',
    parking: 'parking',
    trailhead: 'trailheads',
    road_crossing: 'road_crossings',
    town_candidate: 'towns',
  }[record.type];
  if (bucket) buckets[bucket].push(record);
}

function dedupe(records) {
  const seen = new Set();
  const out = [];
  for (const record of records) {
    const roundedLat = round(record.lat, 4);
    const roundedLon = round(record.lon, 4);
    const key = record.name.startsWith('Unnamed ')
      ? `${record.osm_type}:${record.osm_id}:${record.type}`
      : `${record.type}:${record.name.toLowerCase()}:${roundedLat}:${roundedLon}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(record);
  }
  return out.sort((a, b) => (a.mile_nobo ?? 99999) - (b.mile_nobo ?? 99999) || a.name.localeCompare(b.name));
}

function writeJson(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(value)}\n`, 'utf8');
}

function writeGeoJson(filePath, records) {
  writeJson(filePath, {
    type: 'FeatureCollection',
    features: records.map((record) => ({
      type: 'Feature',
      properties: record,
      geometry: { type: 'Point', coordinates: [record.lon, record.lat] },
    })),
    properties: {
      source_id: 'osm',
      source_url: osmRelationUrl,
      license_status: 'open_license_share_alike',
      confidence: 'mapped_osm_candidate',
      last_checked: '2026-05-13',
    },
  });
}

function compactRawElement(element) {
  const compact = {
    type: element.type,
    id: element.id,
    tags: selectTags(element.tags),
  };
  if (Number.isFinite(element.lat) && Number.isFinite(element.lon)) {
    compact.lat = round(element.lat, 7);
    compact.lon = round(element.lon, 7);
  }
  if (element.center && Number.isFinite(element.center.lat) && Number.isFinite(element.center.lon)) {
    compact.center = {
      lat: round(element.center.lat, 7),
      lon: round(element.center.lon, 7),
    };
  }
  return compact;
}

function compactAcceptedRaw(raw, acceptedElements, counts) {
  writeJson(rawPath, {
    version: raw.version ?? 0.6,
    generator: raw.generator ?? 'Scout AT Open Reference Pack Overpass fetch',
    elements: acceptedElements.map(compactRawElement),
    scout_provenance: {
      ...(raw.scout_provenance || {}),
      source_id: 'osm',
      source_url: osmRelationUrl,
      license_status: 'open_license_share_alike',
      source_license: 'ODbL',
      attribution: 'OpenStreetMap contributors',
      confidence: 'osm_corridor_candidate_features_filtered_for_scout',
      processing_note:
        'Compacted after filtering to Scout AT candidate records; full Overpass snapshots are not packaged by default.',
      accepted_feature_counts: counts,
    },
  });
}

function main() {
  if (!fs.existsSync(rawPath)) throw new Error(`Missing raw OSM corridor features: ${rawPath}`);
  if (!fs.existsSync(milepointsPath)) throw new Error(`Missing generated milepoints: ${milepointsPath}`);

  const raw = JSON.parse(fs.readFileSync(rawPath, 'utf8'));
  const milepoints = loadMilepoints();
  const acceptedElements = new Map();
  const buckets = {
    campsites: [],
    privies: [],
    vistas: [],
    parking: [],
    trailheads: [],
    road_crossings: [],
    towns: [],
  };

  for (const element of raw.elements || []) {
    const type = classify(element);
    if (!type) continue;
    const point = pointFromElement(element, milepoints, type === 'road_crossing');
    if (!point) continue;
    const nearest = nearestMilepoint(point, milepoints);
    if (!nearest || nearest.distanceMiles > maxDistanceMiles[type]) continue;

    const tags = element.tags || {};
    const name = tags.name || tags.ref || tags.highway || tags.place;
    const idPrefix = {
      campsite: 'campsite-open',
      privy_or_toilet: 'privy-open',
      vista: 'vista-open',
      parking: 'parking-open',
      trailhead: 'trailhead-open',
      road_crossing: 'road-open',
      town_candidate: 'town-open',
    }[type];

    const idField = type === 'town_candidate' ? 'town_id' : type === 'road_crossing' || type === 'parking' || type === 'trailhead' ? 'access_id' : 'waypoint_id';
    const extra =
      type === 'town_candidate'
        ? {
            access_type: nearest.distanceMiles <= 0.25 ? 'trail_town_candidate' : 'nearby_settlement_candidate',
            distance_from_trail_miles: round(nearest.distanceMiles, 1),
            place_type: tags.place,
            candidate_services: {
              lodging: 'unknown',
              grocery: 'unknown',
              post_office: 'unknown',
              outfitter: 'unknown',
            },
            confidence: 'open_data_settlement_candidate',
            ai_answer_rule:
              'Describe as an open-data town/resupply candidate only; do not copy guidebook town notes or imply confirmed hiker services.',
          }
        : {
            ai_answer_rule:
              'Describe as an OSM-mapped candidate. Verify current status, access rights, fees, and land-manager rules before relying on it.',
          };

    pushRecord(
      buckets,
      commonRecord(element, point, nearest, { [idField]: `${idPrefix}-${element.type}-${element.id}` }, type, name, extra),
    );
    acceptedElements.set(`${element.type}:${element.id}`, element);
  }

  for (const key of Object.keys(buckets)) buckets[key] = dedupe(buckets[key]);

  const waypointDir = path.join(packRoot, 'processed', 'waypoints');
  writeJson(path.join(waypointDir, 'campsites.json'), buckets.campsites);
  writeGeoJson(path.join(waypointDir, 'campsites.geojson'), buckets.campsites);
  writeJson(path.join(waypointDir, 'privies.json'), buckets.privies);
  writeGeoJson(path.join(waypointDir, 'privies.geojson'), buckets.privies);
  writeJson(path.join(waypointDir, 'vistas.json'), buckets.vistas);
  writeGeoJson(path.join(waypointDir, 'vistas.geojson'), buckets.vistas);
  writeJson(path.join(waypointDir, 'side_trails.json'), []);

  const accessDir = path.join(packRoot, 'processed', 'access');
  writeJson(path.join(accessDir, 'parking.json'), buckets.parking);
  writeGeoJson(path.join(accessDir, 'parking.geojson'), buckets.parking);
  writeJson(path.join(accessDir, 'trailheads.json'), buckets.trailheads);
  writeGeoJson(path.join(accessDir, 'trailheads.geojson'), buckets.trailheads);
  writeJson(path.join(accessDir, 'road_crossings.json'), buckets.road_crossings);
  writeGeoJson(path.join(accessDir, 'road_crossings.geojson'), buckets.road_crossings);

  const townsDir = path.join(packRoot, 'processed', 'towns_resupply');
  writeJson(path.join(townsDir, 'towns_within_15mi.json'), buckets.towns);
  writeJson(path.join(townsDir, 'resupply_candidates.json'), buckets.towns);
  writeJson(path.join(townsDir, 'road_access_to_towns.json'), []);
  writeJson(path.join(townsDir, 'private_businesses_review_required.json'), []);

  const counts = {
    campsites: buckets.campsites.length,
    privies: buckets.privies.length,
    vistas: buckets.vistas.length,
    parking: buckets.parking.length,
    trailheads: buckets.trailheads.length,
    road_crossings: buckets.road_crossings.length,
    towns: buckets.towns.length,
  };
  compactAcceptedRaw(raw, [...acceptedElements.values()], counts);
  console.log(JSON.stringify(counts, null, 2));
}

main();
