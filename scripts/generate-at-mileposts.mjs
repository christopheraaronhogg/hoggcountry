// SUPERSEDED for mile values: this script uniformly rescales geometric
// centerline distance to 2,197.4, which drifts up to ~23 mi from official
// guidebook miles mid-trail. public/at-mileposts.json is now produced by
// scripts/calibrate-at-mileposts.mjs (anchor-calibrated against
// src/data/at-mile-anchors.yaml). Keep this script only as a reference for
// fetching fresh centerline geometry; do NOT run it to regenerate mileposts.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Source: NPS/ATC official centerline FeatureServer (public ArcGIS Online item)
const SERVICE_URL = 'https://services1.arcgis.com/fBc8EJBxQRMcHlei/arcgis/rest/services/ANST_Centerline/FeatureServer/0/query';
const WHERE = '1=1';

// Rough endpoints for anchoring direction (NOBO: Springer -> Katahdin)
const SPRINGER = { lat: 34.6275, lon: -84.1932 };
const KATAHDIN = { lat: 45.9042, lon: -68.9211 };

const OUT_PATH = path.join(__dirname, '..', 'public', 'at-mileposts.json');

function haversineMiles(lat1, lon1, lat2, lon2) {
  const R = 3958.8; // miles
  const toRad = (deg) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

function distMiles(a, b) {
  // coords are [lon, lat]
  return haversineMiles(a[1], a[0], b[1], b[0]);
}

function toQuery(params) {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) sp.set(k, String(v));
  return `${SERVICE_URL}?${sp.toString()}`;
}

async function fetchGeoJsonAll() {
  const pageSize = 2000;
  let offset = 0;
  /** @type {any[]} */
  const all = [];

  while (true) {
    const url = toQuery({
      where: WHERE,
      outFields: 'OBJECTID',
      returnGeometry: true,
      outSR: 4326,
      resultOffset: offset,
      resultRecordCount: pageSize,
      f: 'geojson',
    });

    const resp = await fetch(url, { method: 'GET' });
    if (!resp.ok) throw new Error(`Fetch failed (${resp.status}): ${url}`);
    const page = await resp.json();

    const features = Array.isArray(page.features) ? page.features : [];
    all.push(...features);

    if (features.length < pageSize) break;
    offset += pageSize;
  }

  return all;
}

function quantKey(coord) {
  // ~1m-ish grid. Much less chance of accidental "teleport" shortcuts at close switchbacks/crossings.
  // We'll stitch components if the source has small gaps.
  return `${coord[0].toFixed(5)},${coord[1].toFixed(5)}`;
}

function simplifyByStepMiles(coords, stepMiles) {
  if (stepMiles <= 0) return coords;
  if (coords.length <= 2) return coords;
  /** @type {Array<[number,number]>} */
  const out = [coords[0]];
  let last = coords[0];
  for (let i = 1; i < coords.length - 1; i++) {
    const pt = coords[i];
    if (distMiles(last, pt) >= stepMiles) {
      out.push(pt);
      last = pt;
    }
  }
  out.push(coords[coords.length - 1]);
  return out;
}

class MinHeap {
  constructor() {
    /** @type {Array<[number, number]>} */
    this.data = [];
  }
  push(item) {
    this.data.push(item);
    this.#bubbleUp(this.data.length - 1);
  }
  pop() {
    if (this.data.length === 0) return null;
    const top = this.data[0];
    const last = this.data.pop();
    if (this.data.length > 0 && last) {
      this.data[0] = last;
      this.#bubbleDown(0);
    }
    return top;
  }
  #bubbleUp(i) {
    while (i > 0) {
      const p = Math.floor((i - 1) / 2);
      if (this.data[p][0] <= this.data[i][0]) break;
      [this.data[p], this.data[i]] = [this.data[i], this.data[p]];
      i = p;
    }
  }
  #bubbleDown(i) {
    const n = this.data.length;
    while (true) {
      const l = i * 2 + 1;
      const r = l + 1;
      let m = i;
      if (l < n && this.data[l][0] < this.data[m][0]) m = l;
      if (r < n && this.data[r][0] < this.data[m][0]) m = r;
      if (m === i) break;
      [this.data[m], this.data[i]] = [this.data[i], this.data[m]];
      i = m;
    }
  }
}

function buildGraphFromFeatures(features) {
  /** @type {Map<string, number>} */
  const nodeIndex = new Map();
  /** @type {Array<[number,number]>} */
  const nodes = [];
  /** @type {Array<Map<number, number>>} */
  const adj = [];

  const getNode = (coord) => {
    const key = quantKey(coord);
    const existing = nodeIndex.get(key);
    if (existing !== undefined) return existing;
    const idx = nodes.length;
    nodeIndex.set(key, idx);
    nodes.push([Number(coord[0].toFixed(6)), Number(coord[1].toFixed(6))]);
    adj.push(new Map());
    return idx;
  };

  const addEdge = (u, v, w) => {
    const mu = adj[u];
    const cur = mu.get(v);
    if (cur === undefined || w < cur) mu.set(v, w);
    const mv = adj[v];
    const cur2 = mv.get(u);
    if (cur2 === undefined || w < cur2) mv.set(u, w);
  };

  // NOTE: Keep all vertices to preserve connectivity where segment endpoints meet other segments mid-line.
  const STEP_SIMPLIFY_MILES = 0;

  for (const f of features) {
    const g = f?.geometry;
    if (!g) continue;

    const handleCoords = (coords) => {
      if (!Array.isArray(coords) || coords.length < 2) return;
      const simplified = simplifyByStepMiles(coords, STEP_SIMPLIFY_MILES);
      let prevNode = null;
      let prevCoord = null;
      let carryMiles = 0;
      for (const coord of simplified) {
        const n = getNode(coord);
        if (prevNode !== null && prevCoord !== null) {
          const step = distMiles(prevCoord, coord);
          if (n === prevNode) {
            carryMiles += step;
          } else {
            addEdge(prevNode, n, carryMiles + step);
            carryMiles = 0;
          }
        }
        prevNode = n;
        prevCoord = coord;
      }
    };

    if (g.type === 'LineString') {
      handleCoords(g.coordinates);
    } else if (g.type === 'MultiLineString') {
      for (const part of g.coordinates) handleCoords(part);
    }
  }

  return { nodes, adj };
}

function bfsReachable(adj, startIdx) {
  const seen = new Uint8Array(adj.length);
  const q = new Int32Array(adj.length);
  let head = 0;
  let tail = 0;
  seen[startIdx] = 1;
  q[tail++] = startIdx;

  while (head < tail) {
    const u = q[head++];
    for (const v of adj[u].keys()) {
      if (seen[v]) continue;
      seen[v] = 1;
      q[tail++] = v;
    }
  }

  return seen;
}

function connectComponentsByStitching(nodes, adj, startIdx, endIdx) {
  // Only add stitch edges if needed to connect the Springer component to the Katahdin component.
  const MAX_STITCH_MILES = 0.25;
  const CELL_DEG = 0.02; // ~1–1.4 miles depending on latitude

  const addEdge = (u, v, w) => {
    const cur = adj[u].get(v);
    if (cur === undefined || w < cur) adj[u].set(v, w);
    const cur2 = adj[v].get(u);
    if (cur2 === undefined || w < cur2) adj[v].set(u, w);
  };

  let stitched = 0;
  for (let iter = 0; iter < 25; iter++) {
    const reachable = bfsReachable(adj, startIdx);
    if (reachable[endIdx]) return { stitched, maxStitchMiles: MAX_STITCH_MILES };

    /** @type {number[]} */
    const inEnds = [];
    /** @type {number[]} */
    const outEnds = [];
    for (let i = 0; i < adj.length; i++) {
      if (adj[i].size !== 1) continue;
      if (reachable[i]) inEnds.push(i);
      else outEnds.push(i);
    }

    if (inEnds.length === 0 || outEnds.length === 0) break;

    // Bucket out-of-component endpoints for nearest-neighbor lookup
    const buckets = new Map();
    const bucketKey = (lon, lat) => `${Math.floor(lon / CELL_DEG)},${Math.floor(lat / CELL_DEG)}`;
    for (const idx of outEnds) {
      const [lon, lat] = nodes[idx];
      const k = bucketKey(lon, lat);
      if (!buckets.has(k)) buckets.set(k, []);
      buckets.get(k).push(idx);
    }

    let best = null;
    let bestD = Infinity;

    for (const u of inEnds) {
      const [lonU, latU] = nodes[u];
      const bu = Math.floor(lonU / CELL_DEG);
      const bv = Math.floor(latU / CELL_DEG);
      for (let dx = -1; dx <= 1; dx++) {
        for (let dy = -1; dy <= 1; dy++) {
          const arr = buckets.get(`${bu + dx},${bv + dy}`);
          if (!arr) continue;
          for (const v of arr) {
            const [lonV, latV] = nodes[v];
            const d = haversineMiles(latU, lonU, latV, lonV);
            if (d < bestD) {
              bestD = d;
              best = { u, v, d };
            }
          }
        }
      }
    }

    if (!best || bestD > MAX_STITCH_MILES) break;

    addEdge(best.u, best.v, best.d);
    stitched++;
  }

  return { stitched, maxStitchMiles: MAX_STITCH_MILES };
}

function findNearestNode(nodes, target) {
  let best = 0;
  let bestD = Infinity;
  for (let i = 0; i < nodes.length; i++) {
    const n = nodes[i];
    const d = haversineMiles(n[1], n[0], target.lat, target.lon);
    if (d < bestD) {
      bestD = d;
      best = i;
    }
  }
  return { idx: best, miles: bestD };
}

function dijkstra(nodes, adj, start, goal) {
  const dist = new Float64Array(nodes.length);
  const prev = new Int32Array(nodes.length);
  dist.fill(Number.POSITIVE_INFINITY);
  prev.fill(-1);

  dist[start] = 0;
  const heap = new MinHeap();
  heap.push([0, start]);

  while (true) {
    const item = heap.pop();
    if (!item) break;
    const [d, u] = item;
    if (d !== dist[u]) continue;
    if (u === goal) break;

    const edges = adj[u];
    for (const [v, w] of edges.entries()) {
      const alt = d + w;
      if (alt < dist[v]) {
        dist[v] = alt;
        prev[v] = u;
        heap.push([alt, v]);
      }
    }
  }

  if (prev[goal] === -1) throw new Error('No route found between endpoints in the graph.');

  /** @type {number[]} */
  const path = [];
  let cur = goal;
  while (cur !== -1) {
    path.push(cur);
    if (cur === start) break;
    cur = prev[cur];
  }
  path.reverse();

  return { path, miles: dist[goal] };
}

function cumulativeMilesFromPath(nodes, path) {
  /** @type {Array<[number,number]>} */
  const polyline = path.map((idx) => nodes[idx]);
  const cum = new Array(polyline.length).fill(0);
  for (let i = 1; i < polyline.length; i++) {
    cum[i] = cum[i - 1] + distMiles(polyline[i - 1], polyline[i]);
  }
  return { polyline, cumMiles: cum, totalMiles: cum[cum.length - 1] ?? 0 };
}

function interpolateMileposts(polyline, cumMiles, maxWholeMile) {
  /** @type {Array<{mile:number, lat:number, lon:number}>} */
  const out = [];
  let segIdx = 1;

  for (let mile = 0; mile <= maxWholeMile; mile++) {
    while (segIdx < cumMiles.length && cumMiles[segIdx] < mile) segIdx++;
    if (segIdx >= cumMiles.length) break;

    const prevIdx = Math.max(0, segIdx - 1);
    const a = polyline[prevIdx];
    const b = polyline[segIdx];
    const aM = cumMiles[prevIdx];
    const bM = cumMiles[segIdx];
    const span = bM - aM;
    const t = span <= 0 ? 0 : (mile - aM) / span;
    const lon = a[0] + (b[0] - a[0]) * t;
    const lat = a[1] + (b[1] - a[1]) * t;
    out.push({ mile, lat, lon });
  }

  return out;
}

function interpolateMilepostsScaled(polyline, cumMiles, canonicalMiles, maxWholeMile) {
  const total = cumMiles[cumMiles.length - 1] ?? 0;
  /** @type {Array<{mile:number, lat:number, lon:number, scaledTrailMiles:number}>} */
  const out = [];

  let segIdx = 1;
  for (let mile = 0; mile <= maxWholeMile; mile++) {
    const target = (mile / canonicalMiles) * total;

    while (segIdx < cumMiles.length && cumMiles[segIdx] < target) segIdx++;
    if (segIdx >= cumMiles.length) break;

    const prevIdx = Math.max(0, segIdx - 1);
    const a = polyline[prevIdx];
    const b = polyline[segIdx];
    const aM = cumMiles[prevIdx];
    const bM = cumMiles[segIdx];
    const span = bM - aM;
    const t = span <= 0 ? 0 : (target - aM) / span;
    const lon = a[0] + (b[0] - a[0]) * t;
    const lat = a[1] + (b[1] - a[1]) * t;
    out.push({ mile, lat, lon, scaledTrailMiles: Number(target.toFixed(6)) });
  }

  return { out, total };
}

async function main() {
  console.log('Fetching ANST centerline segments (NPS/ATC)…');
  const features = await fetchGeoJsonAll();
  console.log(`Fetched ${features.length} features`);

  console.log('Building simplified vertex graph…');
  const { nodes, adj } = buildGraphFromFeatures(features);
  console.log(`Graph nodes: ${nodes.length}`);

  const start = findNearestNode(nodes, SPRINGER);
  const end = findNearestNode(nodes, KATAHDIN);
  console.log(`Start node ~${start.miles.toFixed(2)} mi from Springer`);
  console.log(`End node ~${end.miles.toFixed(2)} mi from Katahdin`);

  const stitched = connectComponentsByStitching(nodes, adj, start.idx, end.idx);
  console.log(`Stitch edges added: ${stitched.stitched} (<= ${stitched.maxStitchMiles} mi)`);

  console.log('Running Dijkstra (this can take a bit)…');
  const { path, miles } = dijkstra(nodes, adj, start.idx, end.idx);
  console.log(`Path nodes: ${path.length}`);

  const { polyline, cumMiles, totalMiles } = cumulativeMilesFromPath(nodes, path);
  console.log(`Path distance (graph): ${miles.toFixed(1)} miles`);
  console.log(`Approx distance (haversine along path): ${totalMiles.toFixed(1)} miles`);

  // Generate mile markers against a canonical mileage (AWOL/ATC-style).
  // Since centerline geometry can be simplified, we scale distances along the centerline to match canonical miles.
  const canonicalMiles = 2197.4;
  const maxMile = Math.floor(canonicalMiles);
  const { out: mileposts, total: centerlineMiles } = interpolateMilepostsScaled(polyline, cumMiles, canonicalMiles, maxMile);

  // Ensure NOBO direction
  if (haversineMiles(mileposts[0].lat, mileposts[0].lon, KATAHDIN.lat, KATAHDIN.lon) <
      haversineMiles(mileposts[0].lat, mileposts[0].lon, SPRINGER.lat, SPRINGER.lon)) {
    mileposts.reverse();
  }

  const payload = {
    meta: {
      generatedAt: new Date().toISOString(),
      source: {
        name: 'Appalachian National Scenic Trail - Official Centerline (NPS/ATC)',
        url: 'https://services1.arcgis.com/fBc8EJBxQRMcHlei/arcgis/rest/services/ANST_Centerline/FeatureServer/0',
        where: WHERE,
        attribution: 'National Park Service Appalachian National Scenic Trail & Appalachian Trail Conservancy (2023)',
        disclaimer:
          'General reference only; no warranty as to accuracy, reliability, or completeness. Verify with land managers for on-the-ground work.',
      },
      anchors: { springer: SPRINGER, katahdin: KATAHDIN },
      graph: {
        quantization: '0.00001° (~1m)',
        simplifyStepMiles: 0,
        startNodeDistanceMiles: Number(start.miles.toFixed(3)),
        endNodeDistanceMiles: Number(end.miles.toFixed(3)),
        pathNodes: path.length,
      },
      centerlineMilesApprox: Number(centerlineMiles.toFixed(2)),
      canonicalMiles,
      scaleFactor: Number((centerlineMiles / canonicalMiles).toFixed(6)),
      milepostsCount: mileposts.length,
    },
    mileposts,
  };

  fs.writeFileSync(OUT_PATH, JSON.stringify(payload));
  console.log(`Wrote ${OUT_PATH}`);
}

await main();
