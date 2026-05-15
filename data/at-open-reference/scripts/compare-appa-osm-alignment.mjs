import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const packRoot = path.resolve(__dirname, '..');
const rcRoot = path.join(packRoot, 'full_trail_rc1');
const outputRoot = path.join(packRoot, 'review', 'appa_centerline');

const GENERATED_DATE = process.env.APPA_OSM_COMPARISON_DATE ?? new Date().toISOString().slice(0, 10);
const GENERATED_AT = `${GENERATED_DATE}T00:00:00.000Z`;
const OFFICIAL_REFERENCE_MILES = 2197.9;
const SCOUT_OSM_RC1_MILES = 2106.2;
const BIN_MILES = 25;
const ITEM_ID = '71975f7fc14347c7a6c1059fdb593f91';
const ITEM_URL = `https://www.arcgis.com/home/item.html?id=${ITEM_ID}`;
const SERVICE_URL = 'https://services1.arcgis.com/fBc8EJBxQRMcHlei/arcgis/rest/services/ANST_Centerline/FeatureServer';
const QUERY_URL = `${SERVICE_URL}/0/query`;

function readJson(relativePath, root = packRoot) {
  return JSON.parse(fs.readFileSync(path.join(root, relativePath), 'utf8'));
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

function linesForGeometry(geometry) {
  if (geometry?.type === 'LineString') return [geometry.coordinates];
  if (geometry?.type === 'MultiLineString') return geometry.coordinates;
  return [];
}

function measureAndMidpoint(geometry) {
  const lines = linesForGeometry(geometry);
  const segmentRows = [];
  let totalMiles = 0;
  let vertices = 0;
  let maxSegmentMiles = 0;
  for (const line of lines) {
    vertices += line.length;
    for (let index = 1; index < line.length; index += 1) {
      const start = line[index - 1];
      const end = line[index];
      const miles = haversineMiles(start, end);
      totalMiles += miles;
      maxSegmentMiles = Math.max(maxSegmentMiles, miles);
      segmentRows.push({ start, end, miles });
    }
  }

  if (!segmentRows.length) {
    const first = lines[0]?.[0] ?? null;
    return { totalMiles: 0, midpoint: first, vertices, parts: lines.length, maxSegmentMiles };
  }

  const half = totalMiles / 2;
  let cursor = 0;
  for (const segment of segmentRows) {
    if (cursor + segment.miles >= half) {
      const ratio = segment.miles > 0 ? (half - cursor) / segment.miles : 0;
      return {
        totalMiles,
        midpoint: [
          segment.start[0] + (segment.end[0] - segment.start[0]) * ratio,
          segment.start[1] + (segment.end[1] - segment.start[1]) * ratio,
        ],
        vertices,
        parts: lines.length,
        maxSegmentMiles,
      };
    }
    cursor += segment.miles;
  }

  const lastSegment = segmentRows[segmentRows.length - 1];
  return { totalMiles, midpoint: lastSegment.end, vertices, parts: lines.length, maxSegmentMiles };
}

async function fetchJson(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Request failed ${response.status}: ${url}`);
  return response.json();
}

async function fetchAppaFeatures() {
  const features = [];
  for (let offset = 0; ; offset += 2000) {
    const params = new URLSearchParams({
      f: 'geojson',
      where: '1=1',
      outFields: 'OBJECTID,Name,Status,Publish,Shared_Use,Length_Ft,GNSS_Lengt,GNSS_3DLen,Surface,Trail_Club,Region',
      returnGeometry: 'true',
      resultOffset: String(offset),
      resultRecordCount: '2000',
      outSR: '4326',
    });
    const page = await fetchJson(`${QUERY_URL}?${params}`);
    if (!page.features?.length) break;
    features.push(...page.features);
    if (page.features.length < 2000) break;
  }
  return features;
}

function nearestMilepoint(point, milepoints) {
  let best = null;
  for (const milepoint of milepoints) {
    const distance = haversineMiles(point, milepoint.coordinates);
    if (!best || distance < best.distance_miles) {
      best = {
        distance_miles: distance,
        mile_nobo_global_est: milepoint.mile,
        region_id: milepoint.region_id,
        state: milepoint.state,
      };
    }
  }
  return best;
}

function binStartForMile(mile) {
  return Math.floor(mile / BIN_MILES) * BIN_MILES;
}

function emptyBin(start) {
  const end = Math.min(SCOUT_OSM_RC1_MILES, start + BIN_MILES);
  return {
    bin_id: `generated-${String(Math.round(start)).padStart(4, '0')}-${String(Math.round(end)).padStart(4, '0')}`,
    start_mile_nobo_global_est: round(start, 1),
    end_mile_nobo_global_est: round(end, 1),
    scout_osm_bin_miles: round(end - start, 3),
    appa_feature_count: 0,
    appa_length_ft_miles: 0,
    appa_geodesic_miles: 0,
    nearest_distance_sum_miles: 0,
    nearest_distance_max_miles: 0,
    offroute_feature_count_over_1mi: 0,
    publish_counts: {},
    shared_use_counts: {},
    regions: {},
  };
}

function addCount(object, key) {
  const safeKey = String(key ?? 'null');
  object[safeKey] = (object[safeKey] ?? 0) + 1;
}

function summarizeBin(bin) {
  const appaLength = bin.appa_length_ft_miles;
  const appaGeo = bin.appa_geodesic_miles;
  const count = bin.appa_feature_count;
  return {
    ...bin,
    appa_length_ft_miles: round(appaLength),
    appa_geodesic_miles: round(appaGeo),
    appa_length_ft_minus_scout_osm_miles: round(appaLength - bin.scout_osm_bin_miles),
    appa_geodesic_minus_scout_osm_miles: round(appaGeo - bin.scout_osm_bin_miles),
    avg_nearest_distance_miles: count ? round(bin.nearest_distance_sum_miles / count) : 0,
    nearest_distance_max_miles: round(bin.nearest_distance_max_miles),
    nearest_distance_sum_miles: undefined,
  };
}

function addRegion(regionMap, regionId, scoutLength, appaLength, appaGeo, count, maxDistance, offroute) {
  const current = regionMap.get(regionId) ?? {
    region_id: regionId,
    scout_osm_miles: scoutLength,
    appa_feature_count: 0,
    appa_length_ft_miles: 0,
    appa_geodesic_miles: 0,
    nearest_distance_max_miles: 0,
    offroute_feature_count_over_1mi: 0,
  };
  current.appa_feature_count += count;
  current.appa_length_ft_miles += appaLength;
  current.appa_geodesic_miles += appaGeo;
  current.nearest_distance_max_miles = Math.max(current.nearest_distance_max_miles, maxDistance);
  current.offroute_feature_count_over_1mi += offroute;
  regionMap.set(regionId, current);
}

function summarizeRegion(region) {
  return {
    ...region,
    appa_length_ft_miles: round(region.appa_length_ft_miles),
    appa_geodesic_miles: round(region.appa_geodesic_miles),
    appa_length_ft_minus_scout_osm_miles: round(region.appa_length_ft_miles - region.scout_osm_miles),
    appa_geodesic_minus_scout_osm_miles: round(region.appa_geodesic_miles - region.scout_osm_miles),
    nearest_distance_max_miles: round(region.nearest_distance_max_miles),
  };
}

function markdownRows(rows, limit = 12) {
  return rows.slice(0, limit).map((row) => (
    `| ${row.start_mile_nobo_global_est}-${row.end_mile_nobo_global_est} | ${row.appa_feature_count} | ${row.scout_osm_bin_miles} | ${row.appa_length_ft_miles} | ${row.appa_length_ft_minus_scout_osm_miles} | ${row.nearest_distance_max_miles} | ${Object.keys(row.regions).join(', ')} |`
  )).join('\n');
}

async function main() {
  const [appaFeatures, milepointGeojson, segmentChecks] = await Promise.all([
    fetchAppaFeatures(),
    Promise.resolve(readJson('processed/milepoints/full_at_milepoints_0_5mi.geojson', rcRoot)),
    Promise.resolve(readJson('processed/route/route_segment_length_checks.json', rcRoot)),
  ]);
  const milepoints = milepointGeojson.features.map((feature) => ({
    coordinates: feature.geometry.coordinates,
    mile: feature.properties.mile_nobo_global_est,
    region_id: feature.properties.region_id,
    state: feature.properties.state,
  }));
  const bins = new Map();
  for (let start = 0; start < SCOUT_OSM_RC1_MILES; start += BIN_MILES) {
    bins.set(round(start, 1), emptyBin(start));
  }
  const regionLengths = new Map(segmentChecks.map((check) => [check.region_id, check.generated_length_miles]));
  const regionMap = new Map();
  for (const [regionId, scoutLength] of regionLengths) {
    addRegion(regionMap, regionId, scoutLength, 0, 0, 0, 0, 0);
  }

  const snappedFeatures = [];
  let totalLengthFtMiles = 0;
  let totalGeodesicMiles = 0;
  let totalVertices = 0;
  let maxSegmentMiles = 0;
  let offrouteFeatureCountOver1mi = 0;

  for (const feature of appaFeatures) {
    const measured = measureAndMidpoint(feature.geometry);
    if (!measured.midpoint) continue;
    const nearest = nearestMilepoint(measured.midpoint, milepoints);
    const lengthFtMiles = (feature.properties?.Length_Ft ?? 0) / 5280;
    const geodesicMiles = measured.totalMiles;
    totalLengthFtMiles += lengthFtMiles;
    totalGeodesicMiles += geodesicMiles;
    totalVertices += measured.vertices;
    maxSegmentMiles = Math.max(maxSegmentMiles, measured.maxSegmentMiles);
    if (nearest.distance_miles > 1) offrouteFeatureCountOver1mi += 1;

    const binStart = round(binStartForMile(nearest.mile_nobo_global_est), 1);
    const bin = bins.get(binStart) ?? emptyBin(binStart);
    bin.appa_feature_count += 1;
    bin.appa_length_ft_miles += lengthFtMiles;
    bin.appa_geodesic_miles += geodesicMiles;
    bin.nearest_distance_sum_miles += nearest.distance_miles;
    bin.nearest_distance_max_miles = Math.max(bin.nearest_distance_max_miles, nearest.distance_miles);
    if (nearest.distance_miles > 1) bin.offroute_feature_count_over_1mi += 1;
    addCount(bin.publish_counts, feature.properties?.Publish);
    addCount(bin.shared_use_counts, feature.properties?.Shared_Use);
    addCount(bin.regions, nearest.region_id);
    bins.set(binStart, bin);
    addRegion(
      regionMap,
      nearest.region_id,
      regionLengths.get(nearest.region_id) ?? 0,
      lengthFtMiles,
      geodesicMiles,
      1,
      nearest.distance_miles,
      nearest.distance_miles > 1 ? 1 : 0,
    );

    snappedFeatures.push({
      object_id: feature.properties?.OBJECTID,
      length_ft_miles: round(lengthFtMiles),
      geodesic_miles: round(geodesicMiles),
      nearest_mile_nobo_global_est: nearest.mile_nobo_global_est,
      nearest_distance_miles: round(nearest.distance_miles),
      bin_start_mile_nobo_global_est: binStart,
      region_id: nearest.region_id,
      state: nearest.state,
      publish: feature.properties?.Publish ?? null,
      shared_use: feature.properties?.Shared_Use ?? null,
      appa_region: feature.properties?.Region ?? null,
    });
  }

  const binRows = [...bins.values()].map(summarizeBin);
  const topAdds = [...binRows].sort((a, b) => b.appa_length_ft_minus_scout_osm_miles - a.appa_length_ft_minus_scout_osm_miles);
  const topLosses = [...binRows].sort((a, b) => a.appa_length_ft_minus_scout_osm_miles - b.appa_length_ft_minus_scout_osm_miles);
  const outliers = [...snappedFeatures].sort((a, b) => b.nearest_distance_miles - a.nearest_distance_miles).slice(0, 30);
  const regionRows = [...regionMap.values()].map(summarizeRegion).sort((a, b) => b.appa_length_ft_minus_scout_osm_miles - a.appa_length_ft_minus_scout_osm_miles);

  const report = {
    comparison_id: 'appa_centerline_vs_scout_osm_25mi_bins',
    generated_at: GENERATED_AT,
    source: {
      appa_item_url: ITEM_URL,
      appa_service_url: SERVICE_URL,
      appa_license_status: 'unknown_review_required',
      scout_osm_route: 'data/at-open-reference/full_trail_rc1/processed/route/full_at_route_rc1.geojson',
      scout_milepoints: 'data/at-open-reference/full_trail_rc1/processed/milepoints/full_at_milepoints_0_5mi.geojson',
    },
    production_safe: false,
    method: {
      bin_miles: BIN_MILES,
      snapping: 'Each APPA feature is measured, assigned a midpoint along its returned geometry, snapped to the nearest Scout 0.5-mile generated milepoint, then aggregated into 25-mile Scout bins.',
      limitation: 'This is a diagnostic alignment screen. Whole APPA features are assigned to one bin by midpoint, so bin-level deltas are approximate and should be refined with geometry splitting before route replacement.',
    },
    totals: {
      official_reference_miles: OFFICIAL_REFERENCE_MILES,
      scout_osm_rc1_miles: SCOUT_OSM_RC1_MILES,
      appa_length_ft_miles: round(totalLengthFtMiles),
      appa_geodesic_miles: round(totalGeodesicMiles),
      appa_length_ft_minus_scout_osm_miles: round(totalLengthFtMiles - SCOUT_OSM_RC1_MILES),
      appa_length_ft_minus_official_reference_miles: round(totalLengthFtMiles - OFFICIAL_REFERENCE_MILES),
      appa_geodesic_minus_scout_osm_miles: round(totalGeodesicMiles - SCOUT_OSM_RC1_MILES),
      appa_geodesic_minus_official_reference_miles: round(totalGeodesicMiles - OFFICIAL_REFERENCE_MILES),
      appa_feature_count: appaFeatures.length,
      appa_vertices: totalVertices,
      max_appa_segment_miles: round(maxSegmentMiles),
      offroute_feature_count_over_1mi: offrouteFeatureCountOver1mi,
    },
    top_appa_additions_vs_scout_osm: topAdds.slice(0, 15),
    top_appa_losses_vs_scout_osm: topLosses.slice(0, 15),
    regional_summary: regionRows,
    offroute_outliers: outliers,
    all_bins: binRows,
    initial_read: [
      'APPA Length_Ft adds about 74.1 miles versus the Scout OSM/Waymarked spine.',
      'The largest positive APPA-vs-OSM bins are the first places to inspect for route simplification, missing road/abandoned-road tread, or source-order differences.',
      'The remaining 17.6-mile gap versus the 2026 official reference still needs methodology and license review.',
      'This diagnostic does not produce official milepoints and does not make APPA production-safe.',
    ],
  };

  writeJson('appa_osm_segment_comparison.json', report);
  writeText('appa_osm_segment_comparison.md', `
# APPA Vs Scout OSM Segment Comparison

Generated: ${GENERATED_AT}

APPA source: ${ITEM_URL}

## Status
- License status: unknown_review_required
- Production-safe: false
- This is a diagnostic alignment screen, not a route replacement.

## Method
Each APPA centerline feature is measured and assigned a midpoint, then snapped to the nearest Scout generated 0.5-mile point. Lengths are aggregated into ${BIN_MILES}-mile Scout bins. This tells us where APPA's own Length_Ft field adds or loses mileage against the current OSM/Waymarked spine.

Limitation: whole features are assigned to one bin by midpoint. Before route replacement, APPA geometry should be split by the Scout/selected route stationing line instead of assigned whole-feature.

## Totals
- Official 2026 reference: ${OFFICIAL_REFERENCE_MILES} mi
- Scout OSM RC1 route: ${SCOUT_OSM_RC1_MILES} mi
- APPA Length_Ft total: ${round(totalLengthFtMiles)} mi
- APPA geodesic total: ${round(totalGeodesicMiles)} mi
- APPA Length_Ft vs Scout OSM: +${round(totalLengthFtMiles - SCOUT_OSM_RC1_MILES)} mi
- APPA Length_Ft vs official reference: ${round(totalLengthFtMiles - OFFICIAL_REFERENCE_MILES)} mi
- APPA features snapped farther than 1 mi from Scout route: ${offrouteFeatureCountOver1mi}

## Top APPA Additions Vs Scout OSM
| Scout bin | APPA features | Scout mi | APPA Length_Ft mi | Delta mi | Max snap mi | Regions |
| --- | ---: | ---: | ---: | ---: | ---: | --- |
${markdownRows(topAdds)}

## Top APPA Losses Vs Scout OSM
| Scout bin | APPA features | Scout mi | APPA Length_Ft mi | Delta mi | Max snap mi | Regions |
| --- | ---: | ---: | ---: | ---: | ---: | --- |
${markdownRows(topLosses)}

## Regional Summary
| Region | Scout mi | APPA Length_Ft mi | Delta mi | APPA features | Max snap mi |
| --- | ---: | ---: | ---: | ---: | ---: |
${regionRows.map((row) => `| ${row.region_id} | ${row.scout_osm_miles} | ${row.appa_length_ft_miles} | ${row.appa_length_ft_minus_scout_osm_miles} | ${row.appa_feature_count} | ${row.nearest_distance_max_miles} |`).join('\n')}

## Initial Read
- APPA closes most of Scout's current OSM mileage gap: +${round(totalLengthFtMiles - SCOUT_OSM_RC1_MILES)} miles versus OSM.
- APPA remains ${Math.abs(round(totalLengthFtMiles - OFFICIAL_REFERENCE_MILES))} miles short of the 2026 official reference on its Length_Ft field.
- Inspect the top positive bins first; those are where APPA adds the most mileage against the current Scout spine.
- Keep APPA quarantined until licensing and route-measurement methodology are resolved.
`);

  console.log(JSON.stringify({
    ok: true,
    output: path.relative(process.cwd(), outputRoot),
    appa_length_ft_miles: report.totals.appa_length_ft_miles,
    appa_length_ft_minus_scout_osm_miles: report.totals.appa_length_ft_minus_scout_osm_miles,
    appa_length_ft_minus_official_reference_miles: report.totals.appa_length_ft_minus_official_reference_miles,
    top_addition: report.top_appa_additions_vs_scout_osm[0],
  }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
