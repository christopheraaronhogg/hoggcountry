import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const packRoot = path.resolve(__dirname, '..');
const repoRoot = path.resolve(packRoot, '..', '..');

const hydroInput = path.join(repoRoot, 'src', 'data', 'at-hydro-crossings.json');
const milepointsInput = path.join(packRoot, 'processed', 'milepoints', 'at_milepoints_0_1mi.geojson');
const sourceUrl = 'https://hydro.nationalmap.gov/arcgis/rest/services/nhd/MapServer/6/query';

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

function nearestMilepoint(point, milepoints) {
  let best = null;
  for (const mp of milepoints) {
    const d = haversineMiles(point.lat, point.lon, mp.lat, mp.lon);
    if (!best || d < best.distanceMiles) best = { ...mp, distanceMiles: d };
  }
  return best;
}

function normalizeType(row) {
  if (row.type === 'river') return 'river_crossing';
  return 'stream_crossing';
}

function toRecord(row, nearest, index) {
  const sourceName = row.name || 'Unnamed stream';
  return {
    water_id: `water-open-${String(index + 1).padStart(5, '0')}`,
    trail: 'Appalachian Trail',
    route_id: 'at-main-osm-2026-open',
    mile_nobo: nearest ? round(nearest.mile, 1) : null,
    mile_sobo: nearest ? round(nearest.mileSobo, 1) : null,
    type: normalizeType(row),
    name: sourceName,
    lat: row.lat,
    lon: row.lon,
    distance_from_trail_ft: nearest ? Math.round(nearest.distanceMiles * 5280) : null,
    source_id: 'usgs_3dhp_nhd',
    source_url: sourceUrl,
    source: 'USGS National Hydrography Dataset flowline service',
    source_license: 'public_domain',
    license_status: 'public_domain',
    attribution: 'Data available from U.S. Geological Survey.',
    confidence: 'mapped_hydrography',
    reliability: 'unknown',
    potable: 'unknown',
    seasonal: row.flow === 'perennial' ? 'unknown_perennial_mapped_flowline' : 'unknown',
    flow: row.flow || 'unknown',
    last_human_verified: null,
    last_checked: '2026-05-13',
    source_feature_id: row.nhd?.permanentId || null,
    nhd: row.nhd || null,
    ai_answer_rule: 'Describe as a mapped water candidate with unknown reliability and unknown potability, not reliable drinking water.',
  };
}

function main() {
  if (!fs.existsSync(hydroInput)) throw new Error(`Missing hydro input: ${hydroInput}`);
  if (!fs.existsSync(milepointsInput)) throw new Error(`Missing generated milepoints: ${milepointsInput}`);

  const hydro = JSON.parse(fs.readFileSync(hydroInput, 'utf8'));
  const milepoints = loadMilepoints();
  const records = hydro.map((row, index) => toRecord(row, nearestMilepoint(row, milepoints), index));

  const byId = new Map();
  for (const record of records) {
    const key = `${record.source_feature_id || record.water_id}|${record.mile_nobo}|${record.name}`;
    if (!byId.has(key)) byId.set(key, record);
  }
  const deduped = [...byId.values()].sort((a, b) => a.mile_nobo - b.mile_nobo || a.name.localeCompare(b.name));

  const waterDir = path.join(packRoot, 'processed', 'water');
  fs.mkdirSync(waterDir, { recursive: true });
  fs.writeFileSync(path.join(waterDir, 'water_candidates.json'), `${JSON.stringify(deduped)}\n`, 'utf8');

  const geojson = {
    type: 'FeatureCollection',
    features: deduped.map((record) => ({
      type: 'Feature',
      properties: record,
      geometry: {
        type: 'Point',
        coordinates: [record.lon, record.lat],
      },
    })),
    properties: {
      source_id: 'usgs_3dhp_nhd',
      source_url: sourceUrl,
      license_status: 'public_domain',
      confidence: 'mapped_hydrography',
      reliability: 'unknown',
      potable: 'unknown',
      last_checked: '2026-05-13',
      ai_answer_rule: 'Mapped water candidates only; reliability and potability remain unknown unless separately verified.',
    },
  };
  fs.writeFileSync(path.join(waterDir, 'water_crossings.geojson'), `${JSON.stringify(geojson)}\n`, 'utf8');

  const notes = `# Water Confidence Notes

This dataset contains mapped hydrography candidates derived from USGS/NHD flowlines and remapped to Scout's generated open route milepoints.

These records do not prove water reliability, seasonal availability, safety, or potability. Scout must describe them as mapped water candidates unless a separate, licensed, timestamped report or official managed drinking-water source supports stronger wording.

Allowed answer labels:
- Mapped water candidate
- Unknown reliability
- Unknown potability

Source: ${sourceUrl}
License status: public_domain
Attribution: Data available from U.S. Geological Survey.
Last checked: 2026-05-13
Records: ${deduped.length}
`;
  fs.writeFileSync(path.join(waterDir, 'water_confidence_notes.md'), notes, 'utf8');

  console.log(`Built ${deduped.length} water candidates`);
}

main();
