import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const packRoot = path.resolve(__dirname, '..');
const repoRoot = path.resolve(packRoot, '..', '..');

const DEFAULT_INPUT = path.join(repoRoot, 'public', 'data', 'appalachian-trail.geojson');
const SPRINGER = { lat: 34.6275, lon: -84.1932 };
const KATAHDIN = { lat: 45.9042, lon: -68.9211 };
const OFFICIAL_REFERENCE_2026_MILES = 2197.9;
const OFFICIAL_REFERENCE_SOURCE =
  'https://www.nationalparkstraveler.org/2025/12/appalachian-trail-will-gain-half-mile-2026';
const LICENSE_STATUS = 'open_license_share_alike';
const SOURCE_ID = 'osm';
const SOURCE_URL = 'https://www.openstreetmap.org/relation/156553';
const WAYMARKED_ACCESS_URL = 'https://hiking.waymarkedtrails.org/api/v1/details/relation/156553';

function parseArgs(argv) {
  const out = { input: DEFAULT_INPUT, help: false };
  const args = argv.slice(2);
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === '--input') out.input = args[++i];
    else if (a === '--help' || a === '-h') out.help = true;
  }
  return out;
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

function distMiles(a, b) {
  return haversineMiles(a[1], a[0], b[1], b[0]);
}

function round(n, digits) {
  const f = 10 ** digits;
  return Math.round(n * f) / f;
}

function quantKey(coord) {
  return `${Number(coord[0]).toFixed(5)},${Number(coord[1]).toFixed(5)}`;
}

function assertCoord(coord) {
  return (
    Array.isArray(coord) &&
    coord.length >= 2 &&
    Number.isFinite(Number(coord[0])) &&
    Number.isFinite(Number(coord[1]))
  );
}

function* lineStringsFromGeometry(geometry) {
  if (!geometry) return;
  if (geometry.type === 'LineString') {
    yield geometry.coordinates;
  } else if (geometry.type === 'MultiLineString') {
    for (const line of geometry.coordinates || []) yield line;
  }
}

function webMercatorToLonLat([x, y]) {
  const radius = 6378137;
  const lon = (Number(x) / radius) * (180 / Math.PI);
  const lat = (2 * Math.atan(Math.exp(Number(y) / radius)) - Math.PI / 2) * (180 / Math.PI);
  return [lon, lat];
}

function collectWaymarkedBaseWays(node, out = []) {
  if (!node || typeof node !== 'object') return out;
  if (Array.isArray(node.ways)) {
    for (const way of node.ways) {
      if (way?.geometry?.type === 'LineString' && Array.isArray(way.geometry.coordinates)) {
        out.push(way);
      }
    }
  }
  if (Array.isArray(node.main)) {
    for (const child of node.main) collectWaymarkedBaseWays(child, out);
  }
  return out;
}

function orientedLine(line, previousLast, isFirst) {
  if (line.length < 2) return line;
  const forwardStart = line[0];
  const forwardEnd = line[line.length - 1];
  const reversedStart = forwardEnd;
  const reversedEnd = forwardStart;

  if (isFirst) {
    return distMiles(forwardStart, [SPRINGER.lon, SPRINGER.lat]) <= distMiles(reversedStart, [SPRINGER.lon, SPRINGER.lat])
      ? line
      : [...line].reverse();
  }

  const forwardGap = distMiles(previousLast, forwardStart);
  const reversedGap = distMiles(previousLast, reversedStart);
  return forwardGap <= reversedGap ? line : [...line].reverse();
}

function readWaymarkedRouteLines(data) {
  const ways = collectWaymarkedBaseWays(data.route);
  if (!ways.length) return null;

  const lines = [];
  let previousLast = null;
  let maxGapMiles = 0;
  let totalGapMiles = 0;
  let gapCount = 0;

  for (const way of ways) {
    const converted = way.geometry.coordinates
      .filter(assertCoord)
      .map(webMercatorToLonLat)
      .filter(assertCoord)
      .map((c) => [Number(c[0]), Number(c[1])]);
    if (converted.length < 2) continue;

    const line = orientedLine(converted, previousLast, previousLast === null);
    if (previousLast) {
      const gap = distMiles(previousLast, line[0]);
      maxGapMiles = Math.max(maxGapMiles, gap);
      if (gap > 0.02) {
        totalGapMiles += gap;
        gapCount++;
      }
    }
    previousLast = line[line.length - 1];
    lines.push(line);
  }

  return {
    lines,
    metadata: {
      route_order_source: 'Waymarked Trails API over OpenStreetMap relation 156553',
      route_order_access_url: WAYMARKED_ACCESS_URL,
      route_reported_length_meters: data.route?.length ?? null,
      way_count: ways.length,
      max_join_gap_miles: round(maxGapMiles, 3),
      join_gap_count_over_0_02_miles: gapCount,
      join_gap_total_miles_over_0_02_miles: round(totalGapMiles, 3),
    },
  };
}

function readRouteLines(inputPath) {
  const raw = fs.readFileSync(inputPath, 'utf8');
  const data = JSON.parse(raw);
  const waymarked = readWaymarkedRouteLines(data);
  if (waymarked) return { data, lines: waymarked.lines, metadata: waymarked.metadata };

  const lines = [];
  const features = Array.isArray(data.features) ? data.features : [];

  for (const feature of features) {
    for (const line of lineStringsFromGeometry(feature.geometry)) {
      const coords = (line || [])
        .filter(assertCoord)
        .map((c) => [Number(c[0]), Number(c[1])]);
      if (coords.length >= 2) lines.push(coords);
    }
  }

  if (!lines.length) throw new Error(`No route lines found in ${inputPath}`);
  return { data, lines, metadata: { route_order_source: 'local GeoJSON graph from OpenStreetMap relation 156553' } };
}

function buildGraph(lines) {
  const nodeIndex = new Map();
  const nodes = [];
  const adj = [];

  const getNode = (coord) => {
    const key = quantKey(coord);
    const existing = nodeIndex.get(key);
    if (existing !== undefined) return existing;
    const idx = nodes.length;
    nodeIndex.set(key, idx);
    nodes.push([round(coord[0], 6), round(coord[1], 6)]);
    adj.push(new Map());
    return idx;
  };

  const addEdge = (u, v, w) => {
    if (u === v || w <= 0) return;
    const cur = adj[u].get(v);
    if (cur === undefined || w < cur) adj[u].set(v, w);
    const cur2 = adj[v].get(u);
    if (cur2 === undefined || w < cur2) adj[v].set(u, w);
  };

  for (const line of lines) {
    let prevNode = null;
    let prevCoord = null;
    for (const coord of line) {
      const node = getNode(coord);
      if (prevNode !== null && prevCoord) addEdge(prevNode, node, distMiles(prevCoord, coord));
      prevNode = node;
      prevCoord = coord;
    }
  }

  return { nodes, adj };
}

function findNearestNode(nodes, target) {
  let best = 0;
  let bestMiles = Infinity;
  for (let i = 0; i < nodes.length; i++) {
    const [lon, lat] = nodes[i];
    const miles = haversineMiles(lat, lon, target.lat, target.lon);
    if (miles < bestMiles) {
      best = i;
      bestMiles = miles;
    }
  }
  return { idx: best, miles: bestMiles };
}

function bfsReachable(adj, startIdx) {
  const seen = new Uint8Array(adj.length);
  const queue = new Int32Array(adj.length);
  let head = 0;
  let tail = 0;
  seen[startIdx] = 1;
  queue[tail++] = startIdx;

  while (head < tail) {
    const u = queue[head++];
    for (const v of adj[u].keys()) {
      if (seen[v]) continue;
      seen[v] = 1;
      queue[tail++] = v;
    }
  }

  return seen;
}

function connectComponentsByStitching(nodes, adj, startIdx, endIdx) {
  const maxStitchMiles = 0.75;
  let stitched = 0;

  const addEdge = (u, v, w) => {
    const cur = adj[u].get(v);
    if (cur === undefined || w < cur) adj[u].set(v, w);
    const cur2 = adj[v].get(u);
    if (cur2 === undefined || w < cur2) adj[v].set(u, w);
  };

  for (let iter = 0; iter < 40; iter++) {
    const reachable = bfsReachable(adj, startIdx);
    if (reachable[endIdx]) break;

    let best = null;
    let bestMiles = Infinity;
    for (let u = 0; u < nodes.length; u++) {
      if (!reachable[u] || adj[u].size > 1) continue;
      const [lonU, latU] = nodes[u];
      for (let v = 0; v < nodes.length; v++) {
        if (reachable[v] || adj[v].size > 1) continue;
        const [lonV, latV] = nodes[v];
        const miles = haversineMiles(latU, lonU, latV, lonV);
        if (miles < bestMiles) {
          best = { u, v, miles };
          bestMiles = miles;
        }
      }
    }

    if (!best || bestMiles > maxStitchMiles) break;
    addEdge(best.u, best.v, best.miles);
    stitched++;
  }

  return { stitched, maxStitchMiles, connected: Boolean(bfsReachable(adj, startIdx)[endIdx]) };
}

class MinHeap {
  constructor() {
    this.data = [];
  }
  push(item) {
    this.data.push(item);
    this.#bubbleUp(this.data.length - 1);
  }
  pop() {
    if (!this.data.length) return null;
    const top = this.data[0];
    const last = this.data.pop();
    if (this.data.length && last) {
      this.data[0] = last;
      this.#bubbleDown(0);
    }
    return top;
  }
  #bubbleUp(idx) {
    while (idx > 0) {
      const parent = Math.floor((idx - 1) / 2);
      if (this.data[parent][0] <= this.data[idx][0]) break;
      [this.data[parent], this.data[idx]] = [this.data[idx], this.data[parent]];
      idx = parent;
    }
  }
  #bubbleDown(idx) {
    const n = this.data.length;
    while (true) {
      const left = idx * 2 + 1;
      const right = left + 1;
      let min = idx;
      if (left < n && this.data[left][0] < this.data[min][0]) min = left;
      if (right < n && this.data[right][0] < this.data[min][0]) min = right;
      if (min === idx) break;
      [this.data[min], this.data[idx]] = [this.data[idx], this.data[min]];
      idx = min;
    }
  }
}

function dijkstra(nodes, adj, startIdx, endIdx) {
  const dist = new Float64Array(nodes.length);
  const prev = new Int32Array(nodes.length);
  dist.fill(Number.POSITIVE_INFINITY);
  prev.fill(-1);
  dist[startIdx] = 0;

  const heap = new MinHeap();
  heap.push([0, startIdx]);

  while (true) {
    const item = heap.pop();
    if (!item) break;
    const [curDist, u] = item;
    if (curDist !== dist[u]) continue;
    if (u === endIdx) break;

    for (const [v, w] of adj[u].entries()) {
      const next = curDist + w;
      if (next < dist[v]) {
        dist[v] = next;
        prev[v] = u;
        heap.push([next, v]);
      }
    }
  }

  if (prev[endIdx] === -1) throw new Error('No connected route found from Springer to Katahdin.');

  const path = [];
  let cur = endIdx;
  while (cur !== -1) {
    path.push(cur);
    if (cur === startIdx) break;
    cur = prev[cur];
  }
  path.reverse();
  return { path, distanceMiles: dist[endIdx] };
}

function cumulativeMiles(polyline) {
  const cum = new Array(polyline.length).fill(0);
  for (let i = 1; i < polyline.length; i++) cum[i] = cum[i - 1] + distMiles(polyline[i - 1], polyline[i]);
  return cum;
}

function interpolateAtMile(polyline, cum, mile) {
  let i = 1;
  while (i < cum.length && cum[i] < mile) i++;
  if (i >= cum.length) return null;
  const a = polyline[i - 1];
  const b = polyline[i];
  const aM = cum[i - 1];
  const bM = cum[i];
  const t = bM <= aM ? 0 : (mile - aM) / (bM - aM);
  return {
    lon: a[0] + (b[0] - a[0]) * t,
    lat: a[1] + (b[1] - a[1]) * t,
  };
}

function makeMilepoints(polyline, cum, totalMiles, interval) {
  const features = [];
  const steps = Math.floor(totalMiles / interval);

  for (let idx = 0; idx <= steps; idx++) {
    const mile = round(idx * interval, 1);
    const point = interpolateAtMile(polyline, cum, mile);
    if (!point) continue;
    const mileSobo = round(totalMiles - mile, 1);
    features.push({
      type: 'Feature',
      properties: {
        trail: 'Appalachian Trail',
        route_id: 'at-main-osm-2026-open',
        mile_nobo: mile,
        mile_sobo: mileSobo,
        milepoint_type: 'generated',
        official: false,
        confidence: 'estimated_from_open_route_geometry',
        source_id: SOURCE_ID,
        source_url: SOURCE_URL,
        license_status: LICENSE_STATUS,
        source_license: 'ODbL',
        attribution: 'OpenStreetMap contributors',
        last_checked: '2026-05-13',
        ai_answer_rule:
          "generated mile based on Scout's open route geometry, not an official ATC mile",
      },
      geometry: {
        type: 'Point',
        coordinates: [round(point.lon, 6), round(point.lat, 6)],
      },
    });
  }

  return {
    type: 'FeatureCollection',
    features,
    properties: {
      interval_miles: interval,
      generated_at: new Date().toISOString(),
      route_id: 'at-main-osm-2026-open',
      source_id: SOURCE_ID,
      source_url: SOURCE_URL,
      license_status: LICENSE_STATUS,
      confidence: 'estimated_from_open_route_geometry',
      ai_answer_rule: "generated mile based on Scout's open route geometry, not an official ATC mile",
    },
  };
}

function bboxForLine(polyline) {
  let minLon = Infinity;
  let minLat = Infinity;
  let maxLon = -Infinity;
  let maxLat = -Infinity;
  for (const [lon, lat] of polyline) {
    minLon = Math.min(minLon, lon);
    minLat = Math.min(minLat, lat);
    maxLon = Math.max(maxLon, lon);
    maxLat = Math.max(maxLat, lat);
  }
  return { minLon, minLat, maxLon, maxLat };
}

function writeJson(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(value)}\n`, 'utf8');
}

function buildRouteFeature(polyline, sourceData, graphStats, inputPath) {
  const measuredLengthMiles = graphStats.measuredLengthMiles;
  return {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        properties: {
          route_id: 'at-main-osm-2026-open',
          name: 'Appalachian Trail main route candidate',
          direction: 'NOBO',
          geometry_source: 'OpenStreetMap relation 156553',
          source_id: SOURCE_ID,
          source_url: SOURCE_URL,
          source_access_url: graphStats.route_order_access_url || SOURCE_URL,
          license_status: LICENSE_STATUS,
          source_license: 'ODbL',
          attribution: 'OpenStreetMap contributors',
          confidence: 'open_route_candidate',
          last_checked: '2026-05-13',
          measured_length_miles: round(measuredLengthMiles, 1),
          official_reference_length_miles: OFFICIAL_REFERENCE_2026_MILES,
          official_reference_date: '2026',
          official_reference_source: OFFICIAL_REFERENCE_SOURCE,
          length_delta_miles: round(measuredLengthMiles - OFFICIAL_REFERENCE_2026_MILES, 1),
          official: false,
          generated_from: path.relative(repoRoot, inputPath),
          source_fetched_at: sourceData.scout_provenance?.fetched_at || sourceData.features?.[0]?.properties?.fetched_at || null,
          bbox: bboxForLine(polyline),
          graph: graphStats,
          ai_answer_rule:
            "Use as Scout's open route geometry. Do not describe generated mileage as official ATC mileage.",
        },
        geometry: {
          type: 'LineString',
          coordinates: polyline.map(([lon, lat]) => [round(lon, 6), round(lat, 6)]),
        },
      },
    ],
  };
}

function writeRouteNotes(stats) {
  const notes = `# Route Selection Notes

Selected route: OpenStreetMap relation 156553, converted to a single generated NOBO LineString for Scout's open reference pack.

This route is not an official ATC mile table or official ATC centerline. It is an open, ODbL-derived geometry candidate that Scout can use for generated mileage and local-first planning with attribution and share-alike review.

Measured generated route length: ${round(stats.measuredLengthMiles, 1)} miles.
2026 official reference length used only as a calibration note: ${OFFICIAL_REFERENCE_2026_MILES} miles.
Length delta: ${round(stats.measuredLengthMiles - OFFICIAL_REFERENCE_2026_MILES, 1)} miles.

The measured length depends on source geometry, OSM completeness, line decimation, route stitching, projection method, and future trail relocations. Scout must describe any milepoint from this pack as: "generated mile based on Scout's open route geometry, not an official ATC mile."

Provenance:
- Source: OpenStreetMap relation 156553
- URL: ${SOURCE_URL}
- Route ordering access: ${stats.route_order_access_url || SOURCE_URL}
- License status: ${LICENSE_STATUS}
- Attribution: OpenStreetMap contributors
- Last checked: 2026-05-13
- Official calibration note source: ${OFFICIAL_REFERENCE_SOURCE}

Graph build stats:
- Source line count: ${stats.sourceLineCount}
- Route order source: ${stats.route_order_source}
- Graph nodes: ${stats.graphNodes}
- Path nodes: ${stats.pathNodes}
- Stitch edges added: ${stats.stitchEdges}
- Max stitch miles: ${stats.maxStitchMiles}
- Springer anchor distance: ${round(stats.startAnchorDistanceMiles, 3)} miles
- Katahdin anchor distance: ${round(stats.endAnchorDistanceMiles, 3)} miles
`;

  fs.writeFileSync(path.join(packRoot, 'processed', 'route', 'route_selection_notes.md'), notes, 'utf8');
}

function main() {
  const cfg = parseArgs(process.argv);
  if (cfg.help) {
    console.log('Usage: node data/at-open-reference/scripts/build-open-route-milepoints.mjs [--input public/data/appalachian-trail.geojson]');
    return;
  }

  const input = path.resolve(cfg.input);
  const { data: sourceData, lines, metadata } = readRouteLines(input);
  const { nodes, adj } = buildGraph(lines);
  const start = findNearestNode(nodes, SPRINGER);
  const end = findNearestNode(nodes, KATAHDIN);
  const stitched = connectComponentsByStitching(nodes, adj, start.idx, end.idx);
  if (!stitched.connected) throw new Error('Could not connect OSM route candidate with bounded stitching.');

  const { path: routePath } = dijkstra(nodes, adj, start.idx, end.idx);
  const polyline = routePath.map((idx) => nodes[idx]);
  const cum = cumulativeMiles(polyline);
  const totalMiles = cum[cum.length - 1] || 0;

  const stats = {
    ...metadata,
    sourceLineCount: lines.length,
    graphNodes: nodes.length,
    pathNodes: routePath.length,
    stitchEdges: stitched.stitched,
    maxStitchMiles: stitched.maxStitchMiles,
    startAnchorDistanceMiles: start.miles,
    endAnchorDistanceMiles: end.miles,
    measuredLengthMiles: totalMiles,
  };

  const route = buildRouteFeature(polyline, sourceData, stats, input);
  writeJson(path.join(packRoot, 'processed', 'route', 'at_route_candidate_osm.geojson'), route);
  writeJson(path.join(packRoot, 'processed', 'route', 'at_route_selected.geojson'), route);
  writeRouteNotes(stats);

  for (const interval of [0.1, 0.5, 1.0, 5.0]) {
    const label = interval.toFixed(1).replace('.', '_');
    writeJson(
      path.join(packRoot, 'processed', 'milepoints', `at_milepoints_${label}mi.geojson`),
      makeMilepoints(polyline, cum, totalMiles, interval),
    );
  }

  console.log(`Built open route and milepoints from ${path.relative(repoRoot, input)}`);
  console.log(`Measured length: ${round(totalMiles, 1)} miles; path nodes: ${routePath.length}; stitches: ${stitched.stitched}`);
}

main();
