import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const packRoot = path.resolve(__dirname, '..');
const rcRoot = path.join(packRoot, 'full_trail_rc1');
const outputRoot = path.join(packRoot, 'review', 'appa_centerline');

const GENERATED_DATE = process.env.APPA_REVIEW_ROUTE_DATE ?? new Date().toISOString().slice(0, 10);
const GENERATED_AT = `${GENERATED_DATE}T00:00:00.000Z`;
const OFFICIAL_REFERENCE_MILES = 2197.9;
const SCOUT_OSM_RC1_MILES = 2106.2;
const ITEM_ID = '71975f7fc14347c7a6c1059fdb593f91';
const ITEM_URL = `https://www.arcgis.com/home/item.html?id=${ITEM_ID}`;
const SERVICE_URL = 'https://services1.arcgis.com/fBc8EJBxQRMcHlei/arcgis/rest/services/ANST_Centerline/FeatureServer';
const QUERY_URL = `${SERVICE_URL}/0/query`;
const LENGTH_FIELD = 'Length_Ft';
const MILEPOINT_INTERVALS = [0.1, 0.5, 1.0];

function readJson(relativePath, root = packRoot) {
  return JSON.parse(fs.readFileSync(path.join(root, relativePath), 'utf8'));
}

function writeJson(relativePath, value) {
  const target = path.join(outputRoot, relativePath);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

function writeGeoJson(relativePath, value) {
  const target = path.join(outputRoot, relativePath);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, `${JSON.stringify(value)}\n`, 'utf8');
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

function roundCoordinate(point) {
  return [round(point[0], 6), round(point[1], 6)];
}

function linesForGeometry(geometry) {
  if (geometry?.type === 'LineString') return [geometry.coordinates];
  if (geometry?.type === 'MultiLineString') return geometry.coordinates;
  return [];
}

function reverseLine(line) {
  return [...line].reverse();
}

function pointAtDistance(line, targetMiles) {
  if (!line.length) return null;
  if (targetMiles <= 0) return line[0];

  let cursor = 0;
  for (let index = 1; index < line.length; index += 1) {
    const start = line[index - 1];
    const end = line[index];
    const miles = haversineMiles(start, end);
    if (cursor + miles >= targetMiles) {
      const ratio = miles > 0 ? (targetMiles - cursor) / miles : 0;
      return [
        start[0] + (end[0] - start[0]) * ratio,
        start[1] + (end[1] - start[1]) * ratio,
      ];
    }
    cursor += miles;
  }

  return line[line.length - 1];
}

function measureLine(line) {
  let miles = 0;
  let maxSegmentMiles = 0;
  for (let index = 1; index < line.length; index += 1) {
    const segmentMiles = haversineMiles(line[index - 1], line[index]);
    miles += segmentMiles;
    maxSegmentMiles = Math.max(maxSegmentMiles, segmentMiles);
  }
  return { miles, maxSegmentMiles };
}

function measureLines(lines) {
  let miles = 0;
  let maxSegmentMiles = 0;
  let vertices = 0;
  for (const line of lines) {
    const measured = measureLine(line);
    miles += measured.miles;
    maxSegmentMiles = Math.max(maxSegmentMiles, measured.maxSegmentMiles);
    vertices += line.length;
  }
  return { miles, maxSegmentMiles, vertices, parts: lines.length };
}

function lineMidpoint(line) {
  const measured = measureLine(line);
  return pointAtDistance(line, measured.miles / 2);
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

function addCount(object, key) {
  const safeKey = String(key ?? 'unknown');
  object[safeKey] = (object[safeKey] ?? 0) + 1;
}

function addRegion(regions, regionId, lengthFtMiles, geodesicMiles, count = 1) {
  const current = regions.get(regionId) ?? {
    region_id: regionId,
    appa_feature_count: 0,
    appa_length_ft_miles: 0,
    appa_geodesic_miles: 0,
  };
  current.appa_feature_count += count;
  current.appa_length_ft_miles += lengthFtMiles;
  current.appa_geodesic_miles += geodesicMiles;
  regions.set(regionId, current);
}

function intervalSlug(interval) {
  return interval.toFixed(1).replace('.', '_');
}

function sourceProperties() {
  return {
    source_id: 'appa_official_centerline_public_review',
    source_url: ITEM_URL,
    source_service_url: SERVICE_URL,
    source_layer_query_url: QUERY_URL,
    source_length_field: LENGTH_FIELD,
    license_status: 'unknown_review_required',
    source_license: 'unknown_review_required',
    attribution: 'National Park Service / Appalachian National Scenic Trail GIS service, pending license review',
    production_safe: false,
    official: false,
    candidate_status: 'review_only_not_production_safe',
    confidence: 'official_centerline_candidate_pending_license_and_methodology_review',
    last_checked: GENERATED_DATE,
    last_generated: GENERATED_DATE,
    ai_answer_rule: 'Use only as a quarantined APPA centerline review candidate. Do not call these official ATC milepoints, do not include in production-safe exports, and disclose license/methodology review status.',
  };
}

function buildOrderedParts(appaFeatures, scoutMilepoints) {
  const parts = [];
  let partIndex = 0;

  for (const feature of appaFeatures) {
    const lines = linesForGeometry(feature.geometry);
    const featureLengthFtMiles = (feature.properties?.Length_Ft ?? 0) / 5280;
    const measuredLines = lines.map((line) => measureLine(line));
    const featureGeodesicMiles = measuredLines.reduce((sum, measured) => sum + measured.miles, 0);
    for (const [lineIndex, rawLine] of lines.entries()) {
      if (rawLine.length < 2) continue;
      const measuredForward = measuredLines[lineIndex] ?? measureLine(rawLine);
      const lengthFtMiles = featureGeodesicMiles > 0
        ? featureLengthFtMiles * (measuredForward.miles / featureGeodesicMiles)
        : featureLengthFtMiles / lines.length;
      const startNearest = nearestMilepoint(rawLine[0], scoutMilepoints);
      const endNearest = nearestMilepoint(rawLine[rawLine.length - 1], scoutMilepoints);
      const midpoint = lineMidpoint(rawLine);
      const midpointNearest = nearestMilepoint(midpoint, scoutMilepoints);
      const reversed = startNearest.mile_nobo_global_est > endNearest.mile_nobo_global_est;
      const line = reversed ? reverseLine(rawLine) : rawLine;
      const orientedStartNearest = reversed ? endNearest : startNearest;
      const orientedEndNearest = reversed ? startNearest : endNearest;

      parts.push({
        part_index_source_order: partIndex,
        object_id: feature.properties?.OBJECTID,
        name: feature.properties?.Name ?? null,
        status: feature.properties?.Status ?? null,
        publish: feature.properties?.Publish ?? null,
        shared_use: feature.properties?.Shared_Use ?? null,
        surface: feature.properties?.Surface ?? null,
        trail_club: feature.properties?.Trail_Club ?? null,
        appa_region: feature.properties?.Region ?? null,
        length_ft_miles: lengthFtMiles,
        geodesic_miles: measuredForward.miles,
        max_segment_miles: measuredForward.maxSegmentMiles,
        vertex_count: line.length,
        reversed_for_nobo_review_order: reversed,
        sort_mile_nobo_global_est: midpointNearest.mile_nobo_global_est,
        scout_midpoint_snap_distance_miles: midpointNearest.distance_miles,
        start_nearest_mile_nobo_global_est: orientedStartNearest.mile_nobo_global_est,
        end_nearest_mile_nobo_global_est: orientedEndNearest.mile_nobo_global_est,
        start_nearest_distance_miles: orientedStartNearest.distance_miles,
        end_nearest_distance_miles: orientedEndNearest.distance_miles,
        region_id: midpointNearest.region_id,
        state: midpointNearest.state,
        line,
      });
      partIndex += 1;
    }
  }

  return parts.sort((a, b) => {
    const byMile = a.sort_mile_nobo_global_est - b.sort_mile_nobo_global_est;
    if (Math.abs(byMile) > 0.00001) return byMile;
    return a.object_id - b.object_id;
  });
}

function assignCumulativeStationing(parts) {
  let lengthFtCursor = 0;
  let geodesicCursor = 0;

  return parts.map((part, orderedIndex) => {
    const stationed = {
      ...part,
      review_order_index: orderedIndex,
      appa_length_ft_start_mile: lengthFtCursor,
      appa_length_ft_end_mile: lengthFtCursor + part.length_ft_miles,
      appa_geodesic_start_mile: geodesicCursor,
      appa_geodesic_end_mile: geodesicCursor + part.geodesic_miles,
    };
    lengthFtCursor = stationed.appa_length_ft_end_mile;
    geodesicCursor = stationed.appa_geodesic_end_mile;
    return stationed;
  });
}

function continuityDiagnostics(parts) {
  const gaps = [];
  let totalGapMiles = 0;
  let maxGapMiles = 0;
  let gapCountOver002 = 0;
  let gapCountOver01 = 0;
  let gapCountOver05 = 0;
  let stationOverlapCount = 0;
  let stationRegressionCount = 0;
  let previous = null;

  for (const part of parts) {
    if (previous) {
      const previousEnd = previous.line[previous.line.length - 1];
      const currentStart = part.line[0];
      const gapMiles = haversineMiles(previousEnd, currentStart);
      totalGapMiles += gapMiles;
      maxGapMiles = Math.max(maxGapMiles, gapMiles);
      if (gapMiles > 0.02) gapCountOver002 += 1;
      if (gapMiles > 0.1) gapCountOver01 += 1;
      if (gapMiles > 0.5) gapCountOver05 += 1;
      if (part.start_nearest_mile_nobo_global_est < previous.end_nearest_mile_nobo_global_est) stationOverlapCount += 1;
      if (part.sort_mile_nobo_global_est < previous.sort_mile_nobo_global_est) stationRegressionCount += 1;
      gaps.push({
        from_review_order_index: previous.review_order_index,
        to_review_order_index: part.review_order_index,
        from_object_id: previous.object_id,
        to_object_id: part.object_id,
        gap_miles: round(gapMiles, 4),
        from_end_scout_mile: round(previous.end_nearest_mile_nobo_global_est, 1),
        to_start_scout_mile: round(part.start_nearest_mile_nobo_global_est, 1),
        from_region_id: previous.region_id,
        to_region_id: part.region_id,
      });
    }
    previous = part;
  }

  return {
    connection_count: Math.max(0, parts.length - 1),
    total_gap_miles_if_artificially_connected: round(totalGapMiles),
    max_gap_miles: round(maxGapMiles, 4),
    gap_count_over_0_02_miles: gapCountOver002,
    gap_count_over_0_1_miles: gapCountOver01,
    gap_count_over_0_5_miles: gapCountOver05,
    station_overlap_count: stationOverlapCount,
    station_regression_count: stationRegressionCount,
    top_gaps: gaps.sort((a, b) => b.gap_miles - a.gap_miles).slice(0, 25),
  };
}

function buildRouteCandidate(parts, totals, continuity, endpointDiagnostics, regionalSummary, publishCounts, sharedUseCounts) {
  const properties = {
    route_id: 'at-full-trail-appa-centerline-review-candidate-2026',
    name: 'Scout APPA centerline review route candidate',
    direction: 'NOBO',
    geometry_source: 'APPA Official Centerline public ArcGIS FeatureServer',
    ...sourceProperties(),
    measured_length_miles: totals.appa_length_ft_miles,
    appa_length_ft_miles: totals.appa_length_ft_miles,
    appa_returned_geometry_geodesic_miles: totals.appa_geodesic_miles,
    official_reference_length_miles: OFFICIAL_REFERENCE_MILES,
    official_reference_date: '2026',
    official_reference_usage: 'single total-length reference value only; not copied official mile tables or official milepoints',
    scout_osm_rc1_generated_miles: SCOUT_OSM_RC1_MILES,
    length_delta_miles_vs_official_reference: round(totals.appa_length_ft_miles - OFFICIAL_REFERENCE_MILES),
    length_delta_miles_vs_scout_osm_rc1: round(totals.appa_length_ft_miles - SCOUT_OSM_RC1_MILES),
    ordering_method: 'Each APPA part is oriented and ordered by nearest Scout RC1 generated 0.5-mile station, using APPA midpoint snap for sort order.',
    stationing_method: 'Review milepoints are generated from APPA Length_Ft cumulative stationing; coordinates are interpolated along returned geometry proportionally within each APPA part.',
    feature_count: totals.feature_count,
    part_count: totals.part_count,
    vertex_count: totals.vertex_count,
    continuity_summary: continuity,
    endpoint_diagnostics: endpointDiagnostics,
    regional_summary: regionalSummary,
    publish_counts: publishCounts,
    shared_use_counts: sharedUseCounts,
    route_candidate_outputs: {
      route_geojson: 'review/appa_centerline/appa_route_candidate_review.geojson',
      continuity_json: 'review/appa_centerline/appa_route_candidate_continuity.json',
      notes_md: 'review/appa_centerline/appa_route_candidate_notes.md',
      milepoints_0_1: 'review/appa_centerline/appa_review_milepoints_0_1mi.geojson',
      milepoints_0_5: 'review/appa_centerline/appa_review_milepoints_0_5mi.geojson',
      milepoints_1_0: 'review/appa_centerline/appa_review_milepoints_1_0mi.geojson',
    },
  };

  return {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        properties,
        geometry: {
          type: 'MultiLineString',
          coordinates: parts.map((part) => part.line.map(roundCoordinate)),
        },
      },
    ],
  };
}

function pointForLengthStation(parts, targetMile) {
  for (const part of parts) {
    if (targetMile <= part.appa_length_ft_end_mile + 0.000001) {
      const withinLengthMiles = Math.max(0, targetMile - part.appa_length_ft_start_mile);
      const ratio = part.length_ft_miles > 0 ? withinLengthMiles / part.length_ft_miles : 0;
      const targetGeodesicWithin = ratio * part.geodesic_miles;
      return {
        coordinate: pointAtDistance(part.line, targetGeodesicWithin),
        part,
        appa_geodesic_mile_est: part.appa_geodesic_start_mile + targetGeodesicWithin,
      };
    }
  }

  const last = parts[parts.length - 1];
  return {
    coordinate: last.line[last.line.length - 1],
    part: last,
    appa_geodesic_mile_est: last.appa_geodesic_end_mile,
  };
}

function buildMilepoints(parts, interval, totalLengthMiles) {
  const features = [];
  const count = Math.floor(totalLengthMiles / interval);
  for (let index = 0; index <= count; index += 1) {
    const mile = round(index * interval, 1);
    const point = pointForLengthStation(parts, mile);
    if (!point.coordinate) continue;
    features.push({
      type: 'Feature',
      properties: {
        trail: 'Appalachian Trail',
        route_id: 'at-full-trail-appa-centerline-review-candidate-2026',
        milepoint_type: 'generated_review_candidate',
        interval_miles: interval,
        mile_nobo_appa_length_ft_est: mile,
        mile_sobo_appa_length_ft_est: round(totalLengthMiles - mile, 1),
        mile_nobo_appa_geodesic_est: round(point.appa_geodesic_mile_est, 3),
        source_route_id: 'at-full-trail-appa-centerline-review-candidate-2026',
        object_id: point.part.object_id,
        review_order_index: point.part.review_order_index,
        region_id: point.part.region_id,
        state: point.part.state,
        ...sourceProperties(),
      },
      geometry: {
        type: 'Point',
        coordinates: roundCoordinate(point.coordinate),
      },
    });
  }

  const lastExisting = features[features.length - 1]?.properties.mile_nobo_appa_length_ft_est;
  if (Math.abs(totalLengthMiles - lastExisting) > 0.0001) {
    const point = pointForLengthStation(parts, totalLengthMiles);
    features.push({
      type: 'Feature',
      properties: {
        trail: 'Appalachian Trail',
        route_id: 'at-full-trail-appa-centerline-review-candidate-2026',
        milepoint_type: 'generated_review_candidate_endpoint',
        interval_miles: interval,
        mile_nobo_appa_length_ft_est: round(totalLengthMiles, 3),
        mile_sobo_appa_length_ft_est: 0,
        mile_nobo_appa_geodesic_est: round(point.appa_geodesic_mile_est, 3),
        source_route_id: 'at-full-trail-appa-centerline-review-candidate-2026',
        object_id: point.part.object_id,
        review_order_index: point.part.review_order_index,
        region_id: point.part.region_id,
        state: point.part.state,
        ...sourceProperties(),
      },
      geometry: {
        type: 'Point',
        coordinates: roundCoordinate(point.coordinate),
      },
    });
  }

  return {
    type: 'FeatureCollection',
    features,
  };
}

function endpointDiagnostics(parts, scoutMilepoints) {
  const first = parts[0];
  const last = parts[parts.length - 1];
  const firstCoordinate = first.line[0];
  const lastCoordinate = last.line[last.line.length - 1];
  const scoutStart = scoutMilepoints[0];
  const scoutEnd = scoutMilepoints[scoutMilepoints.length - 1];
  const firstNearest = nearestMilepoint(firstCoordinate, scoutMilepoints);
  const lastNearest = nearestMilepoint(lastCoordinate, scoutMilepoints);

  return {
    appa_start: {
      coordinates: roundCoordinate(firstCoordinate),
      object_id: first.object_id,
      nearest_scout_mile_nobo_global_est: firstNearest.mile_nobo_global_est,
      nearest_scout_distance_miles: round(firstNearest.distance_miles, 4),
      distance_to_scout_start_miles: round(haversineMiles(firstCoordinate, scoutStart.coordinates), 4),
      distance_to_scout_end_miles: round(haversineMiles(firstCoordinate, scoutEnd.coordinates), 4),
      region_id: first.region_id,
      state: first.state,
    },
    appa_end: {
      coordinates: roundCoordinate(lastCoordinate),
      object_id: last.object_id,
      nearest_scout_mile_nobo_global_est: lastNearest.mile_nobo_global_est,
      nearest_scout_distance_miles: round(lastNearest.distance_miles, 4),
      distance_to_scout_start_miles: round(haversineMiles(lastCoordinate, scoutStart.coordinates), 4),
      distance_to_scout_end_miles: round(haversineMiles(lastCoordinate, scoutEnd.coordinates), 4),
      region_id: last.region_id,
      state: last.state,
    },
    interpretation: 'Endpoint distances are measured against Scout RC1 generated 0.5-mile endpoints. They are a review signal only, not official endpoint validation.',
  };
}

function buildContinuityReport(parts, totals, continuity, endpoints, regionalSummary) {
  return {
    report_id: 'appa_route_candidate_continuity_review',
    generated_at: GENERATED_AT,
    source: {
      appa_item_url: ITEM_URL,
      appa_service_url: SERVICE_URL,
      appa_license_status: 'unknown_review_required',
      scout_reference_route: 'data/at-open-reference/full_trail_rc1/processed/route/full_at_route_rc1.geojson',
      scout_reference_milepoints: 'data/at-open-reference/full_trail_rc1/processed/milepoints/full_at_milepoints_0_5mi.geojson',
    },
    production_safe: false,
    official: false,
    candidate_status: 'review_only_not_production_safe',
    method: {
      ordering: 'APPA parts were oriented from lower to higher nearest Scout station, then sorted by midpoint nearest Scout station.',
      stationing: 'Cumulative APPA Length_Ft is used as the review station length. Returned geometry is used only to place coordinates.',
      limitation: 'Sorting by Scout station is a practical review method, not proof that APPA stationing matches official annual ATC mile methodology.',
    },
    totals,
    continuity,
    endpoints,
    regional_summary: regionalSummary,
    top_parts_by_length_ft: parts
      .slice()
      .sort((a, b) => b.length_ft_miles - a.length_ft_miles)
      .slice(0, 25)
      .map((part) => ({
        review_order_index: part.review_order_index,
        object_id: part.object_id,
        length_ft_miles: round(part.length_ft_miles),
        geodesic_miles: round(part.geodesic_miles),
        start_nearest_mile_nobo_global_est: round(part.start_nearest_mile_nobo_global_est, 1),
        end_nearest_mile_nobo_global_est: round(part.end_nearest_mile_nobo_global_est, 1),
        region_id: part.region_id,
        state: part.state,
        publish: part.publish,
        shared_use: part.shared_use,
      })),
    review_read: [
      'APPA Length_Ft stationing produces a 2,180.348-mile review candidate, materially closer to the 2,197.9-mile reference than Scout OSM RC1.',
      'The candidate remains 17.552 miles short of the 2026 reference and is not a solved official-mile system.',
      'Continuity gaps and overlaps should be inspected before any replacement of the Scout route spine.',
      'APPA remains quarantined until license/use terms are resolved.',
    ],
  };
}

function markdownTable(rows) {
  return rows.map((row) => (
    `| ${row.region_id} | ${row.appa_feature_count} | ${row.appa_length_ft_miles} | ${row.appa_geodesic_miles} |`
  )).join('\n');
}

async function main() {
  const [appaFeatures, scoutMilepointGeojson] = await Promise.all([
    fetchAppaFeatures(),
    Promise.resolve(readJson('processed/milepoints/full_at_milepoints_0_5mi.geojson', rcRoot)),
  ]);
  const scoutMilepoints = scoutMilepointGeojson.features.map((feature) => ({
    coordinates: feature.geometry.coordinates,
    mile: feature.properties.mile_nobo_global_est,
    region_id: feature.properties.region_id,
    state: feature.properties.state,
  }));

  const orderedParts = assignCumulativeStationing(buildOrderedParts(appaFeatures, scoutMilepoints));
  const measured = measureLines(orderedParts.map((part) => part.line));
  const lengthFtMiles = orderedParts.reduce((sum, part) => sum + part.length_ft_miles, 0);
  const publishCounts = {};
  const sharedUseCounts = {};
  const regions = new Map();

  for (const part of orderedParts) {
    addCount(publishCounts, part.publish);
    addCount(sharedUseCounts, part.shared_use);
    addRegion(regions, part.region_id, part.length_ft_miles, part.geodesic_miles);
  }

  const totals = {
    official_reference_miles: OFFICIAL_REFERENCE_MILES,
    scout_osm_rc1_miles: SCOUT_OSM_RC1_MILES,
    appa_length_ft_miles: round(lengthFtMiles),
    appa_geodesic_miles: round(measured.miles),
    appa_length_ft_minus_official_reference_miles: round(lengthFtMiles - OFFICIAL_REFERENCE_MILES),
    appa_length_ft_minus_scout_osm_miles: round(lengthFtMiles - SCOUT_OSM_RC1_MILES),
    appa_geodesic_minus_official_reference_miles: round(measured.miles - OFFICIAL_REFERENCE_MILES),
    appa_geodesic_minus_scout_osm_miles: round(measured.miles - SCOUT_OSM_RC1_MILES),
    feature_count: appaFeatures.length,
    part_count: measured.parts,
    vertex_count: measured.vertices,
    max_segment_miles: round(measured.maxSegmentMiles, 4),
  };
  const continuity = continuityDiagnostics(orderedParts);
  const endpoints = endpointDiagnostics(orderedParts, scoutMilepoints);
  const regionalSummary = [...regions.values()]
    .map((region) => ({
      ...region,
      appa_length_ft_miles: round(region.appa_length_ft_miles),
      appa_geodesic_miles: round(region.appa_geodesic_miles),
    }))
    .sort((a, b) => b.appa_length_ft_miles - a.appa_length_ft_miles);

  const routeCandidate = buildRouteCandidate(
    orderedParts,
    totals,
    continuity,
    endpoints,
    regionalSummary,
    publishCounts,
    sharedUseCounts,
  );
  const continuityReport = buildContinuityReport(orderedParts, totals, continuity, endpoints, regionalSummary);

  writeGeoJson('appa_route_candidate_review.geojson', routeCandidate);
  writeJson('appa_route_candidate_continuity.json', continuityReport);
  for (const interval of MILEPOINT_INTERVALS) {
    writeGeoJson(`appa_review_milepoints_${intervalSlug(interval)}mi.geojson`, buildMilepoints(orderedParts, interval, lengthFtMiles));
  }

  writeText('appa_route_candidate_notes.md', `
# APPA Route Candidate Review

Generated: ${GENERATED_AT}

APPA source: ${ITEM_URL}

## Status
- License status: unknown_review_required
- Production-safe: false
- Official milepoints: false
- Candidate status: review_only_not_production_safe

This is a quarantined route candidate. It is useful for alignment research, but it must not be used in production-safe exports or represented as official ATC mileage.

## Length Signals
- Official 2026 reference: ${OFFICIAL_REFERENCE_MILES} mi
- Scout OSM RC1 route: ${SCOUT_OSM_RC1_MILES} mi
- APPA Length_Ft station length: ${totals.appa_length_ft_miles} mi
- APPA returned-geometry geodesic length: ${totals.appa_geodesic_miles} mi
- APPA Length_Ft vs Scout OSM: +${totals.appa_length_ft_minus_scout_osm_miles} mi
- APPA Length_Ft vs official reference: ${totals.appa_length_ft_minus_official_reference_miles} mi

## Ordering / Stationing Method
Each APPA part is oriented from lower to higher nearest Scout generated 0.5-mile station. Parts are then sorted by APPA midpoint nearest Scout station. Review milepoints use APPA's \`${LENGTH_FIELD}\` cumulative length field for stationing, with coordinates interpolated along the returned geometry.

This is still review stationing. It is not proof that APPA's service field is the annual official ATC mileage method.

## Continuity Signals
- Parts: ${totals.part_count}
- Vertices: ${totals.vertex_count.toLocaleString()}
- Max vertex segment: ${totals.max_segment_miles} mi
- Max ordered-part gap: ${continuity.max_gap_miles} mi
- Gaps over 0.02 mi: ${continuity.gap_count_over_0_02_miles}
- Gaps over 0.1 mi: ${continuity.gap_count_over_0_1_miles}
- Gaps over 0.5 mi: ${continuity.gap_count_over_0_5_miles}
- Station overlaps by Scout snap: ${continuity.station_overlap_count}

## Endpoint Signals
- APPA start nearest Scout mile: ${endpoints.appa_start.nearest_scout_mile_nobo_global_est} (${endpoints.appa_start.nearest_scout_distance_miles} mi away)
- APPA end nearest Scout mile: ${endpoints.appa_end.nearest_scout_mile_nobo_global_est} (${endpoints.appa_end.nearest_scout_distance_miles} mi away)
- APPA start distance to Scout start endpoint: ${endpoints.appa_start.distance_to_scout_start_miles} mi
- APPA end distance to Scout end endpoint: ${endpoints.appa_end.distance_to_scout_end_miles} mi

## Regional Summary
| Region | APPA parts | APPA Length_Ft mi | APPA geodesic mi |
| --- | ---: | ---: | ---: |
${markdownTable(regionalSummary)}

## Next Review Work
- Visually inspect the largest continuity gaps and station overlaps.
- Confirm APPA license/use terms before any production use.
- Compare APPA endpoint treatment against official annual endpoint assumptions.
- Decide whether to rebuild Scout RC2 from APPA, OSM, or a hybrid source only after licensing and methodology review.
`);

  console.log(JSON.stringify({
    ok: true,
    output: path.relative(process.cwd(), outputRoot),
    route_candidate: 'appa_route_candidate_review.geojson',
    appa_length_ft_miles: totals.appa_length_ft_miles,
    appa_length_ft_minus_official_reference_miles: totals.appa_length_ft_minus_official_reference_miles,
    appa_length_ft_minus_scout_osm_miles: totals.appa_length_ft_minus_scout_osm_miles,
    part_count: totals.part_count,
    max_gap_miles: continuity.max_gap_miles,
    gaps_over_0_1_miles: continuity.gap_count_over_0_1_miles,
    endpoint_start_nearest_scout_mile: endpoints.appa_start.nearest_scout_mile_nobo_global_est,
    endpoint_end_nearest_scout_mile: endpoints.appa_end.nearest_scout_mile_nobo_global_est,
  }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
