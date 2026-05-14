import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const packRoot = path.resolve(__dirname, '..');
const repoRoot = path.resolve(packRoot, '..', '..');

const milepointsInput = path.join(packRoot, 'processed', 'milepoints', 'at_milepoints_0_1mi.geojson');
const sheltersInput = path.join(repoRoot, 'public', 'data', 'at-shelters.geojson');
const osmRelationUrl = 'https://www.openstreetmap.org/relation/156553';

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

function round(n, digits) {
  const factor = 10 ** digits;
  return Math.round(n * factor) / factor;
}

function loadMilepoints() {
  const data = JSON.parse(fs.readFileSync(milepointsInput, 'utf8'));
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

function nearestMilepoint(lat, lon, milepoints) {
  let best = null;
  for (const mp of milepoints) {
    const d = haversineMiles(lat, lon, mp.lat, mp.lon);
    if (!best || d < best.distanceMiles) best = { ...mp, distanceMiles: d };
  }
  return best;
}

function cleanString(value) {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function toShelterRecord(feature, nearest, index) {
  const props = feature.properties || {};
  const [lon, lat] = feature.geometry.coordinates;
  return {
    waypoint_id: `shelter-open-${String(index + 1).padStart(4, '0')}`,
    trail: 'Appalachian Trail',
    route_id: 'at-main-osm-2026-open',
    type: 'shelter',
    name: cleanString(props.name) || 'Unnamed shelter',
    mile_nobo: nearest ? round(nearest.mile, 1) : null,
    mile_sobo: nearest ? round(nearest.mileSobo, 1) : null,
    lat,
    lon,
    distance_from_route_ft: nearest ? Math.round(nearest.distanceMiles * 5280) : null,
    state: 'unknown',
    capacity: cleanString(props.capacity),
    fee: 'unknown',
    water_nearby: 'unknown',
    privy: 'unknown',
    source_id: 'osm',
    source_url: osmRelationUrl,
    source: 'OpenStreetMap contributors',
    source_license: 'ODbL',
    license_status: 'open_license_share_alike',
    attribution: 'OpenStreetMap contributors',
    confidence: 'mapped_poi',
    last_checked: '2026-05-13',
    last_verified: null,
    osm_type: props.osm_type || null,
    osm_id: props.osm_id || null,
    amenity: props.amenity || null,
    tourism: props.tourism || null,
    shelter_type: props.shelter_type || null,
    operator: cleanString(props.operator),
    website: cleanString(props.website),
    ai_answer_rule:
      'Describe as an OSM-mapped shelter candidate. Do not claim capacity, water, fee, or privy status unless explicitly present in licensed current data.',
  };
}

function main() {
  if (!fs.existsSync(milepointsInput)) throw new Error(`Missing generated milepoints: ${milepointsInput}`);
  if (!fs.existsSync(sheltersInput)) throw new Error(`Missing shelter input: ${sheltersInput}`);

  const milepoints = loadMilepoints();
  const shelters = JSON.parse(fs.readFileSync(sheltersInput, 'utf8'));
  const features = Array.isArray(shelters.features) ? shelters.features : [];

  const records = features
    .filter((feature) => feature?.geometry?.type === 'Point' && Array.isArray(feature.geometry.coordinates))
    .map((feature, index) => {
      const [lon, lat] = feature.geometry.coordinates;
      return toShelterRecord(feature, nearestMilepoint(lat, lon, milepoints), index);
    })
    .sort((a, b) => a.mile_nobo - b.mile_nobo || a.name.localeCompare(b.name));

  const outDir = path.join(packRoot, 'processed', 'waypoints');
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, 'shelters.json'), `${JSON.stringify(records)}\n`, 'utf8');

  const geojson = {
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
      confidence: 'mapped_poi',
      last_checked: '2026-05-13',
    },
  };
  fs.writeFileSync(path.join(outDir, 'shelters.geojson'), `${JSON.stringify(geojson)}\n`, 'utf8');
  console.log(`Built ${records.length} shelter waypoint candidates`);
}

main();
