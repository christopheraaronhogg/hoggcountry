import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const packRoot = path.resolve(__dirname, '..');
const outputRoot = path.join(packRoot, 'review', 'appa_centerline');

const GENERATED_DATE = process.env.APPA_CENTERLINE_PROBE_DATE ?? new Date().toISOString().slice(0, 10);
const GENERATED_AT = `${GENERATED_DATE}T00:00:00.000Z`;
const OFFICIAL_REFERENCE_MILES = 2197.9;
const SCOUT_OSM_RC1_MILES = 2106.2;
const ITEM_ID = '71975f7fc14347c7a6c1059fdb593f91';
const ITEM_URL = `https://www.arcgis.com/home/item.html?id=${ITEM_ID}`;
const ITEM_REST_URL = `https://www.arcgis.com/sharing/rest/content/items/${ITEM_ID}?f=json`;
const SERVICE_URL = 'https://services1.arcgis.com/fBc8EJBxQRMcHlei/arcgis/rest/services/ANST_Centerline/FeatureServer';
const LAYER_URL = `${SERVICE_URL}/0`;
const QUERY_URL = `${LAYER_URL}/query`;

function round(value, digits = 3) {
  if (typeof value !== 'number' || Number.isNaN(value)) return value;
  const multiplier = 10 ** digits;
  return Math.round(value * multiplier) / multiplier;
}

function toRadians(value) {
  return value * (Math.PI / 180);
}

function haversineMiles(a, b) {
  const earthRadiusMiles = 3958.7613;
  const deltaLat = toRadians(b[1] - a[1]);
  const deltaLon = toRadians(b[0] - a[0]);
  const lat1 = toRadians(a[1]);
  const lat2 = toRadians(b[1]);
  const value = Math.sin(deltaLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLon / 2) ** 2;
  return 2 * earthRadiusMiles * Math.asin(Math.sqrt(value));
}

function measureGeometry(geometry) {
  const lines = geometry?.type === 'LineString'
    ? [geometry.coordinates]
    : geometry?.type === 'MultiLineString'
      ? geometry.coordinates
      : [];
  let miles = 0;
  let maxSegmentMiles = 0;
  let vertices = 0;
  for (const line of lines) {
    vertices += line.length;
    for (let index = 1; index < line.length; index += 1) {
      const distance = haversineMiles(line[index - 1], line[index]);
      miles += distance;
      maxSegmentMiles = Math.max(maxSegmentMiles, distance);
    }
  }
  return {
    miles,
    parts: lines.length,
    vertices,
    maxSegmentMiles,
  };
}

async function fetchJson(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Request failed ${response.status}: ${url}`);
  return response.json();
}

async function fetchGeoJsonPage(offset) {
  const params = new URLSearchParams({
    f: 'geojson',
    where: '1=1',
    outFields: 'OBJECTID,Name,Status,Publish,Shared_Use,Length_Ft,GNSS_Lengt,GNSS_3DLen,Surface,Trail_Club,Region',
    returnGeometry: 'true',
    resultOffset: String(offset),
    resultRecordCount: '2000',
    outSR: '4326',
  });
  return fetchJson(`${QUERY_URL}?${params}`);
}

async function fetchStatistics() {
  const outStatistics = [
    { statisticType: 'count', onStatisticField: 'OBJECTID', outStatisticFieldName: 'feature_count' },
    { statisticType: 'sum', onStatisticField: 'Length_Ft', outStatisticFieldName: 'sum_length_ft' },
    { statisticType: 'sum', onStatisticField: 'GNSS_Lengt', outStatisticFieldName: 'sum_gnss_lengt' },
    { statisticType: 'sum', onStatisticField: 'GNSS_3DLen', outStatisticFieldName: 'sum_gnss_3dlen' },
  ];
  const params = new URLSearchParams({
    f: 'json',
    where: '1=1',
    outStatistics: JSON.stringify(outStatistics),
  });
  const json = await fetchJson(`${QUERY_URL}?${params}`);
  return json.features?.[0]?.attributes ?? {};
}

function addGroup(map, key, lengthFeet, geodesicMiles) {
  const groupKey = String(key ?? 'null');
  const current = map.get(groupKey) ?? { count: 0, lengthFeet: 0, geodesicMiles: 0 };
  current.count += 1;
  current.lengthFeet += lengthFeet;
  current.geodesicMiles += geodesicMiles;
  map.set(groupKey, current);
}

function groupRows(map) {
  return [...map.entries()]
    .map(([key, value]) => ({
      key,
      count: value.count,
      length_ft_miles: round(value.lengthFeet / 5280),
      geodesic_miles: round(value.geodesicMiles),
    }))
    .sort((a, b) => b.length_ft_miles - a.length_ft_miles);
}

function writeJson(relativePath, value) {
  const target = path.join(outputRoot, relativePath);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

function writeText(relativePath, text) {
  const target = path.join(outputRoot, relativePath);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, text.trimEnd() + '\n', 'utf8');
}

async function main() {
  const [item, layer, statistics] = await Promise.all([
    fetchJson(ITEM_REST_URL),
    fetchJson(`${LAYER_URL}?f=json`),
    fetchStatistics(),
  ]);
  const features = [];
  for (let offset = 0; ; offset += 2000) {
    const page = await fetchGeoJsonPage(offset);
    if (!page.features?.length) break;
    features.push(...page.features);
    if (page.features.length < 2000) break;
  }

  const groups = {
    publish: new Map(),
    shared_use: new Map(),
    region: new Map(),
  };
  const geometry = {
    geodesic_miles: 0,
    parts: 0,
    vertices: 0,
    max_segment_miles: 0,
  };

  for (const feature of features) {
    const measured = measureGeometry(feature.geometry);
    const lengthFeet = feature.properties?.Length_Ft ?? 0;
    geometry.geodesic_miles += measured.miles;
    geometry.parts += measured.parts;
    geometry.vertices += measured.vertices;
    geometry.max_segment_miles = Math.max(geometry.max_segment_miles, measured.maxSegmentMiles);
    addGroup(groups.publish, feature.properties?.Publish, lengthFeet, measured.miles);
    addGroup(groups.shared_use, feature.properties?.Shared_Use, lengthFeet, measured.miles);
    addGroup(groups.region, feature.properties?.Region, lengthFeet, measured.miles);
  }

  const lengthFtMiles = statistics.sum_length_ft / 5280;
  const gnssLengthMiles = statistics.sum_gnss_lengt / 5280;
  const gnss3dMiles = statistics.sum_gnss_3dlen / 5280;
  const report = {
    probe_id: 'appa_official_centerline_public_probe',
    generated_at: GENERATED_AT,
    source: {
      item_id: ITEM_ID,
      item_url: ITEM_URL,
      service_url: SERVICE_URL,
      layer_url: LAYER_URL,
      title: item.title,
      snippet: item.snippet,
      access: item.access,
      type: item.type,
      service_capabilities: layer.capabilities,
      service_supported_query_formats: layer.supportedQueryFormats,
      access_information: item.accessInformation,
      license_info: item.licenseInfo,
    },
    license_status: 'unknown_review_required',
    production_safe: false,
    feature_count: features.length,
    official_reference_miles: OFFICIAL_REFERENCE_MILES,
    scout_osm_rc1_generated_miles: SCOUT_OSM_RC1_MILES,
    source_attribute_lengths: {
      length_ft_miles: round(lengthFtMiles),
      gnss_lengt_miles: round(gnssLengthMiles),
      gnss_3dlen_miles: round(gnss3dMiles),
      notes: [
        'Length_Ft is the most plausible service-provided route length field from this first pass.',
        'GNSS_Lengt and GNSS_3DLen are retained for review but do not align with the official 2026 reference in this raw sum.',
      ],
    },
    geometry_measurement: {
      method: 'WGS84 haversine over GeoJSON feature vertices returned by the ArcGIS layer',
      geodesic_miles: round(geometry.geodesic_miles),
      vertices: geometry.vertices,
      parts: geometry.parts,
      max_segment_miles: round(geometry.max_segment_miles),
      limitation: 'This measures returned service geometry and may differ from service attribute length fields or official annual ATC mileage methodology.',
    },
    deltas: {
      length_ft_minus_official_reference_miles: round(lengthFtMiles - OFFICIAL_REFERENCE_MILES),
      geodesic_minus_official_reference_miles: round(geometry.geodesic_miles - OFFICIAL_REFERENCE_MILES),
      length_ft_minus_scout_osm_rc1_miles: round(lengthFtMiles - SCOUT_OSM_RC1_MILES),
      geodesic_minus_scout_osm_rc1_miles: round(geometry.geodesic_miles - SCOUT_OSM_RC1_MILES),
    },
    grouped_lengths: {
      publish: groupRows(groups.publish),
      shared_use: groupRows(groups.shared_use),
      region: groupRows(groups.region),
    },
    initial_assessment: [
      'APPA Official Centerline is public and official-labeled, but its license/use terms need review before packaging.',
      `The Length_Ft sum is ${round(lengthFtMiles)} miles, about ${round(lengthFtMiles - OFFICIAL_REFERENCE_MILES)} miles from the 2026 official reference and ${round(lengthFtMiles - SCOUT_OSM_RC1_MILES)} miles longer than Scout RC1 OSM.`,
      `The returned GeoJSON geodesic measurement is ${round(geometry.geodesic_miles)} miles, closer than Scout RC1 OSM but still ${round(geometry.geodesic_miles - OFFICIAL_REFERENCE_MILES)} miles from the official reference.`,
      'This source looks materially better than the current OSM spine for official-alignment research, but it still does not directly solve official milepoint licensing.',
    ],
  };

  writeJson('appa_centerline_probe.json', report);
  writeText('appa_centerline_probe.md', `
# APPA Official Centerline Probe

Generated: ${GENERATED_AT}

Source: ${ITEM_URL}

Service: ${SERVICE_URL}

## License / Use Status
- Access: ${item.access}
- Attribution: ${item.accessInformation}
- License status in Scout: unknown_review_required
- Production-safe: false

The service is public and official-labeled, but the item terms are reference/no-warranty language rather than an explicit open-data license. Keep this out of production-safe exports until reviewed.

## First-Pass Length Signals
- Official 2026 reference: ${OFFICIAL_REFERENCE_MILES} miles
- Scout RC1 OSM generated route: ${SCOUT_OSM_RC1_MILES} miles
- APPA Length_Ft sum: ${round(lengthFtMiles)} miles
- APPA returned-geometry geodesic sum: ${round(geometry.geodesic_miles)} miles
- APPA Length_Ft delta vs official: ${round(lengthFtMiles - OFFICIAL_REFERENCE_MILES)} miles
- APPA Length_Ft delta vs Scout RC1 OSM: +${round(lengthFtMiles - SCOUT_OSM_RC1_MILES)} miles

## Geometry Shape
- Features: ${features.length}
- Vertices: ${geometry.vertices.toLocaleString()}
- Parts: ${geometry.parts.toLocaleString()}
- Max vertex-to-vertex segment: ${round(geometry.max_segment_miles)} miles

## Grouped By Publish
${groupRows(groups.publish).map((row) => `- ${row.key}: ${row.count} features, ${row.length_ft_miles} Length_Ft miles, ${row.geodesic_miles} geodesic miles`).join('\n')}

## Grouped By Region
${groupRows(groups.region).map((row) => `- ${row.key}: ${row.count} features, ${row.length_ft_miles} Length_Ft miles, ${row.geodesic_miles} geodesic miles`).join('\n')}

## Assessment
- This appears much closer to the official 2026 reference than the current OSM/Waymarked spine.
- It does not fully align with 2,197.9 on the first pass: Length_Ft is short by ${Math.abs(round(lengthFtMiles - OFFICIAL_REFERENCE_MILES))} miles.
- It may still be the best public source to investigate next for route alignment.
- Do not produce official Scout milepoints from it unless licensing and methodology are resolved.
`);

  console.log(JSON.stringify({
    ok: true,
    output: path.relative(process.cwd(), outputRoot),
    feature_count: report.feature_count,
    length_ft_miles: report.source_attribute_lengths.length_ft_miles,
    geodesic_miles: report.geometry_measurement.geodesic_miles,
    length_ft_delta_vs_official: report.deltas.length_ft_minus_official_reference_miles,
    length_ft_delta_vs_scout_osm: report.deltas.length_ft_minus_scout_osm_rc1_miles,
  }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
