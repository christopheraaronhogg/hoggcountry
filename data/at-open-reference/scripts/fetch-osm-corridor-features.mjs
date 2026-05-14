import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const packRoot = path.resolve(__dirname, '..');

const overpassUrl = 'https://overpass-api.de/api/interpreter';
const relationId = 156553;
const milepointsPath = path.join(packRoot, 'processed', 'milepoints', 'at_milepoints_5_0mi.geojson');
const outPath = path.join(packRoot, 'raw', 'osm', 'osm_corridor_features_relation_156553.json');

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function loadMilepoints() {
  const data = JSON.parse(fs.readFileSync(milepointsPath, 'utf8'));
  return data.features.map((feature) => {
    const [lon, lat] = feature.geometry.coordinates;
    return {
      mile: feature.properties.mile_nobo,
      lat,
      lon,
    };
  });
}

function bboxForPoints(points, padMiles = 16) {
  let minLat = Infinity;
  let maxLat = -Infinity;
  let minLon = Infinity;
  let maxLon = -Infinity;
  for (const p of points) {
    minLat = Math.min(minLat, p.lat);
    maxLat = Math.max(maxLat, p.lat);
    minLon = Math.min(minLon, p.lon);
    maxLon = Math.max(maxLon, p.lon);
  }
  const midLat = (minLat + maxLat) / 2;
  const padLat = padMiles / 69;
  const padLon = padMiles / (69 * Math.max(0.2, Math.cos((midLat * Math.PI) / 180)));
  return {
    south: minLat - padLat,
    west: minLon - padLon,
    north: maxLat + padLat,
    east: maxLon + padLon,
  };
}

function makeChunks(points, chunkMiles = 100) {
  const maxMile = Math.max(...points.map((p) => p.mile));
  const chunks = [];
  for (let start = 0; start <= maxMile; start += chunkMiles) {
    const end = Math.min(maxMile, start + chunkMiles);
    const pts = points.filter((p) => p.mile >= start && p.mile <= end);
    if (!pts.length) continue;
    chunks.push({ start, end, bbox: bboxForPoints(pts) });
  }
  return chunks;
}

function bboxString(bbox) {
  return `${bbox.south.toFixed(6)},${bbox.west.toFixed(6)},${bbox.north.toFixed(6)},${bbox.east.toFixed(6)}`;
}

function queryForBboxes(featureBbox, townBbox) {
  const f = bboxString(featureBbox);
  const t = bboxString(townBbox);
  return `[out:json][timeout:180];
(
  node(${f})[tourism=camp_site];
  way(${f})[tourism=camp_site];
  relation(${f})[tourism=camp_site];
  node(${f})[amenity=toilets];
  way(${f})[amenity=toilets];
  relation(${f})[amenity=toilets];
  node(${f})[amenity=parking];
  way(${f})[amenity=parking];
  relation(${f})[amenity=parking];
  node(${f})[highway=trailhead];
  way(${f})[highway=trailhead];
  relation(${f})[highway=trailhead];
  node(${f})[tourism=viewpoint];
  way(${f})[tourism=viewpoint];
  relation(${f})[tourism=viewpoint];
  node(${t})[place~"^(city|town|village)$"];
);
out body center geom;`;
}

async function fetchChunk(chunk, attempt = 1) {
  const query = queryForBboxes(chunk.featureBbox, chunk.townBbox);
  const response = await fetch(overpassUrl, {
    method: 'POST',
    headers: {
      'content-type': 'application/x-www-form-urlencoded;charset=UTF-8',
      accept: 'application/json',
      'user-agent': 'HoggCountryScout/0.1 (AT open reference pack; contact: repository owner)',
    },
    body: new URLSearchParams({ data: query }).toString(),
  });

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    if (attempt < 3) {
      await sleep(3000 * attempt);
      return fetchChunk(chunk, attempt + 1);
    }
    throw new Error(`Overpass chunk ${chunk.start}-${chunk.end} failed: ${response.status} ${response.statusText}\n${text.slice(0, 1000)}`);
  }

  const data = await response.json();
  return data.elements || [];
}

async function main() {
  if (!fs.existsSync(milepointsPath)) throw new Error(`Missing milepoints: ${milepointsPath}`);
  const milepoints = loadMilepoints();
  const chunks = makeChunks(milepoints).map((chunk) => ({
    start: chunk.start,
    end: chunk.end,
    featureBbox: bboxForPoints(milepoints.filter((p) => p.mile >= chunk.start && p.mile <= chunk.end), 2),
    townBbox: bboxForPoints(milepoints.filter((p) => p.mile >= chunk.start && p.mile <= chunk.end), 15),
  }));
  const byKey = new Map();
  const chunkSummaries = [];

  for (const [index, chunk] of chunks.entries()) {
    process.stdout.write(`\nChunk ${index + 1}/${chunks.length} miles ${chunk.start}-${chunk.end}...`);
    const elements = await fetchChunk(chunk);
    process.stdout.write(` ${elements.length} elements`);
    chunkSummaries.push({
      start_mile: chunk.start,
      end_mile: chunk.end,
      feature_bbox: chunk.featureBbox,
      town_bbox: chunk.townBbox,
      fetched_elements: elements.length,
    });
    for (const element of elements) {
      byKey.set(`${element.type}:${element.id}`, element);
    }
    await sleep(500);
  }
  process.stdout.write('\n');

  const data = {
    version: 0.6,
    generator: 'Scout AT Open Reference Pack chunked Overpass fetch',
    osm3s: null,
    elements: [...byKey.values()],
    scout_provenance: {
      fetched_at: new Date().toISOString(),
      source_id: 'osm',
      source_url: `https://www.openstreetmap.org/relation/${relationId}`,
      access_url: overpassUrl,
      license_status: 'open_license_share_alike',
      source_license: 'ODbL',
      attribution: 'OpenStreetMap contributors',
      confidence: 'osm_corridor_candidate_features',
      last_checked: '2026-05-13',
      chunk_miles: 100,
      feature_bbox_pad_miles: 2,
      town_bbox_pad_miles: 15,
      chunks: chunkSummaries,
    },
  };

  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, `${JSON.stringify(data)}\n`, 'utf8');
  console.log(`Wrote ${path.relative(process.cwd(), outPath)} (${data.elements.length} unique elements)`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
