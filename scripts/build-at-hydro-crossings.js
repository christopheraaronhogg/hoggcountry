import fs from 'node:fs';
import path from 'node:path';

const SERVICE_URL = 'https://hydro.nationalmap.gov/arcgis/rest/services/nhd/MapServer/6/query';

const R_MI = 3958.8;
const DEG2RAD = Math.PI / 180;

function toRad(deg) {
  return deg * DEG2RAD;
}

function approxMilesBetweenRad(lat1, lon1, lat2, lon2) {
  // Equirectangular approximation (fast and accurate enough for <= a few miles).
  const x = (lon2 - lon1) * Math.cos((lat1 + lat2) / 2);
  const y = lat2 - lat1;
  return R_MI * Math.sqrt(x * x + y * y);
}

function toQuery(params) {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) sp.set(k, String(v));
  return `${SERVICE_URL}?${sp.toString()}`;
}

function asNumber(value, fallback = null) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

function normName(name) {
  return String(name || '')
    .toLowerCase()
    .trim()
    .replace(/[’']/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function flowFromFcode(fcode) {
  const code = asNumber(fcode, null);
  if (code === 46000 || code === 46006) return 'perennial';
  if (code === 46003) return 'intermittent';
  if (code === 46007) return 'ephemeral';
  return 'unknown';
}

function typeFromNameOrFcode(name, fcode) {
  const n = String(name || '').toLowerCase();
  if (/\briver\b/.test(n)) return 'river';
  // NHD Flowline is stream/river; keep as stream unless explicitly "river".
  const code = asNumber(fcode, null);
  if (code === 46000 || code === 46003 || code === 46006 || code === 46007) return 'stream';
  return 'stream';
}

function parseArgs(argv) {
  const out = {
    milepostsPath: 'public/at-mileposts.json',
    outPath: 'src/data/at-hydro-crossings.json',
    chunkMiles: 25,
    bboxPadMiles: 2.5,
    maxDistMiles: 0.08,
    stepMiles: 0.1,
    where: 'FTYPE = 460',
    pageSize: 2000,
    maxChunks: null,
  };

  const args = argv.slice(2);
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    const next = () => args[i + 1];

    if (a === '--mileposts') out.milepostsPath = next(), i++;
    else if (a === '--out') out.outPath = next(), i++;
    else if (a === '--chunk') out.chunkMiles = asNumber(next(), out.chunkMiles), i++;
    else if (a === '--pad') out.bboxPadMiles = asNumber(next(), out.bboxPadMiles), i++;
    else if (a === '--maxDist') out.maxDistMiles = asNumber(next(), out.maxDistMiles), i++;
    else if (a === '--step') out.stepMiles = asNumber(next(), out.stepMiles), i++;
    else if (a === '--where') out.where = next(), i++;
    else if (a === '--pageSize') out.pageSize = asNumber(next(), out.pageSize), i++;
    else if (a === '--maxChunks') out.maxChunks = asNumber(next(), null), i++;
    else if (a === '--help' || a === '-h') out.help = true;
  }

  return out;
}

function coordForMile(mile, mileCoord) {
  const lo = Math.floor(mile);
  const hi = Math.ceil(mile);
  const a = mileCoord.get(lo);
  const b = mileCoord.get(hi);

  if (!a && !b) return null;
  if (a && !b) return a;
  if (!a && b) return b;
  if (lo === hi) return a;

  const t = (mile - lo) / (hi - lo);
  return { lat: a.lat + (b.lat - a.lat) * t, lon: a.lon + (b.lon - a.lon) * t };
}

function makeTrailPoints(mileCoord, startMile, endMile, stepMiles) {
  const pts = [];
  const s = clamp(startMile, 0, 3000);
  const e = clamp(endMile, 0, 3000);
  const step = Math.max(0.01, stepMiles);

  for (let m = s; m <= e + 1e-9; m += step) {
    const ll = coordForMile(m, mileCoord);
    if (!ll) continue;
    pts.push({ mile: Math.round(m * 10) / 10, lat: ll.lat, lon: ll.lon, latRad: toRad(ll.lat), lonRad: toRad(ll.lon) });
  }

  return pts;
}

function bboxForPoints(points, padMiles) {
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

  if (!Number.isFinite(minLat) || !Number.isFinite(minLon)) return null;

  const midLat = (minLat + maxLat) / 2;
  const padLatDeg = padMiles / 69;
  const padLonDeg = padMiles / (69 * Math.max(0.2, Math.cos(toRad(midLat))));

  return {
    minLat: minLat - padLatDeg,
    maxLat: maxLat + padLatDeg,
    minLon: minLon - padLonDeg,
    maxLon: maxLon + padLonDeg,
  };
}

function* coordsFromGeometry(geometry) {
  if (!geometry || typeof geometry !== 'object') return;
  const g = geometry;

  const emit = (coord) => {
    if (!Array.isArray(coord) || coord.length < 2) return;
    const lon = asNumber(coord[0], null);
    const lat = asNumber(coord[1], null);
    if (lon === null || lat === null) return;
    return { lat, lon };
  };

  if (g.type === 'LineString') {
    for (const c of g.coordinates || []) {
      const pt = emit(c);
      if (pt) yield pt;
    }
  } else if (g.type === 'MultiLineString') {
    for (const part of g.coordinates || []) {
      for (const c of part || []) {
        const pt = emit(c);
        if (pt) yield pt;
      }
    }
  }
}

async function fetchFlowlinesGeoJson(bbox, where, pageSize) {
  const outFields = ['permanent_identifier', 'gnis_name', 'reachcode', 'ftype', 'fcode'].join(',');
  const geometry = `${bbox.minLon},${bbox.minLat},${bbox.maxLon},${bbox.maxLat}`;

  let offset = 0;
  const all = [];

  while (true) {
    const url = toQuery({
      where,
      outFields,
      returnGeometry: true,
      geometry,
      geometryType: 'esriGeometryEnvelope',
      spatialRel: 'esriSpatialRelIntersects',
      inSR: 4326,
      outSR: 4326,
      resultOffset: offset,
      resultRecordCount: pageSize,
      f: 'geojson',
    });

    const resp = await fetch(url, { method: 'GET' });
    if (!resp.ok) throw new Error(`NHD fetch failed (${resp.status}): ${url}`);

    const page = await resp.json();
    const features = Array.isArray(page.features) ? page.features : [];
    all.push(...features);

    if (features.length < pageSize) break;
    offset += pageSize;
  }

  return all;
}

function bestNearTrail(trailPoints, geometry) {
  let best = null;

  for (const pt of coordsFromGeometry(geometry)) {
    const latRad = toRad(pt.lat);
    const lonRad = toRad(pt.lon);

    for (const t of trailPoints) {
      const d = approxMilesBetweenRad(latRad, lonRad, t.latRad, t.lonRad);
      if (best === null || d < best.offTrailMiles) {
        best = { mile: t.mile, lat: pt.lat, lon: pt.lon, offTrailMiles: d };
      }
    }
  }

  return best;
}

function readMileposts(milepostsPath) {
  const raw = fs.readFileSync(milepostsPath, 'utf8');
  const data = JSON.parse(raw);
  const mileposts = Array.isArray(data?.mileposts) ? data.mileposts : [];

  const mileCoord = new Map();
  let maxMile = 0;

  for (const mp of mileposts) {
    const mile = asNumber(mp?.mile, null);
    const lat = asNumber(mp?.lat, null);
    const lon = asNumber(mp?.lon, null);
    if (mile === null || lat === null || lon === null) continue;
    mileCoord.set(mile, { lat, lon });
    if (mile > maxMile) maxMile = mile;
  }

  return { mileCoord, maxMile };
}

function round2(n) {
  return Math.round(n * 100) / 100;
}

function round5(n) {
  return Math.round(n * 1e5) / 1e5;
}

async function main() {
  const cfg = parseArgs(process.argv);
  if (cfg.help) {
    console.log('Usage: node scripts/build-at-hydro-crossings.js [options]'); // eslint-disable-line no-console
    console.log('Options:'); // eslint-disable-line no-console
    console.log('  --mileposts public/at-mileposts.json'); // eslint-disable-line no-console
    console.log('  --out       src/data/at-hydro-crossings.json'); // eslint-disable-line no-console
    console.log('  --chunk     25        (miles)'); // eslint-disable-line no-console
    console.log('  --pad       2.5       (miles bbox padding)'); // eslint-disable-line no-console
    console.log('  --maxDist   0.08      (miles from trail point)'); // eslint-disable-line no-console
    console.log('  --step      0.1       (miles sampling along trail)'); // eslint-disable-line no-console
    console.log('  --where     \"FTYPE = 460\"'); // eslint-disable-line no-console
    console.log('  --pageSize  2000'); // eslint-disable-line no-console
    console.log('  --maxChunks N         (debug)'); // eslint-disable-line no-console
    process.exit(0);
  }

  if (!fs.existsSync(cfg.milepostsPath)) {
    console.error(`Missing mileposts file: ${cfg.milepostsPath}`); // eslint-disable-line no-console
    console.error('Generate it with: node scripts/generate-at-mileposts.mjs'); // eslint-disable-line no-console
    process.exit(1);
  }

  const { mileCoord, maxMile } = readMileposts(cfg.milepostsPath);
  if (!mileCoord.size) {
    console.error(`No mileposts found in ${cfg.milepostsPath}`); // eslint-disable-line no-console
    process.exit(1);
  }

  const chunkMiles = Math.max(1, Math.round(cfg.chunkMiles));
  const maxChunks = cfg.maxChunks && cfg.maxChunks > 0 ? cfg.maxChunks : null;

  /** @type {Map<string, any>} */
  const byId = new Map();
  let fetchedFeatures = 0;

  const totalChunks = Math.ceil((maxMile + 1) / chunkMiles);

  for (let ci = 0; ci < totalChunks; ci++) {
    if (maxChunks !== null && ci >= maxChunks) break;

    const startMile = ci * chunkMiles;
    const endMile = Math.min(maxMile, (ci + 1) * chunkMiles);

    // Trail points for this chunk (+ a small guard band to reduce edge artifacts).
    const trailPoints = makeTrailPoints(mileCoord, Math.max(0, startMile - 1), Math.min(maxMile, endMile + 1), cfg.stepMiles);
    const bbox = bboxForPoints(trailPoints, cfg.bboxPadMiles);
    if (!bbox) continue;

    process.stdout.write(`\rChunk ${ci + 1}/${totalChunks} (mile ${startMile}-${endMile})… `);

    const features = await fetchFlowlinesGeoJson(bbox, cfg.where, cfg.pageSize);
    fetchedFeatures += features.length;

    for (const f of features) {
      const props = f?.properties || {};
      const permanentId =
        String(props.permanent_identifier ?? props.PERMANENT_IDENTIFIER ?? props.permanentIdentifier ?? '').trim();
      if (!permanentId) continue;

      const best = bestNearTrail(trailPoints, f?.geometry);
      if (!best) continue;
      if (best.offTrailMiles > cfg.maxDistMiles) continue;

      const gnis = String(props.gnis_name ?? props.GNIS_NAME ?? '').trim();
      const reachcode = String(props.reachcode ?? props.REACHCODE ?? '').trim();
      const ftype = asNumber(props.ftype ?? props.FTYPE, null);
      const fcode = asNumber(props.fcode ?? props.FCODE, null);

      const flow = flowFromFcode(fcode);
      const type = typeFromNameOrFcode(gnis, fcode);

      const prev = byId.get(permanentId);
      if (prev && prev.offTrailMiles <= best.offTrailMiles) continue;

      byId.set(permanentId, {
        mile: Math.round(best.mile * 10) / 10,
        name: gnis || 'Unnamed stream',
        type,
        flow,
        offTrail: round2(best.offTrailMiles),
        lat: round5(best.lat),
        lon: round5(best.lon),
        nhd: { permanentId, reachcode, ftype, fcode },
      });
    }
  }

  process.stdout.write('\n');

  const crossings = Array.from(byId.values()).sort((a, b) => a.mile - b.mile || a.name.localeCompare(b.name));

  // Secondary dedupe: avoid multiple segments that land on the same mile+name.
  const seen2 = new Set();
  const deduped = [];
  for (const r of crossings) {
    const key = `${r.mile.toFixed(1)}|${normName(r.name)}|${r.flow}|${r.type}`;
    if (seen2.has(key)) continue;
    seen2.add(key);
    deduped.push(r);
  }

  fs.mkdirSync(path.dirname(cfg.outPath), { recursive: true });
  fs.writeFileSync(cfg.outPath, JSON.stringify(deduped, null, 2) + '\n', 'utf8');

  const counts = deduped.reduce((acc, r) => {
    acc[r.flow] = (acc[r.flow] || 0) + 1;
    return acc;
  }, Object.create(null));

  console.log(`✅ Wrote ${cfg.outPath}`); // eslint-disable-line no-console
  console.log(`   features fetched: ${fetchedFeatures}`); // eslint-disable-line no-console
  console.log(`   crossings kept:   ${deduped.length}`); // eslint-disable-line no-console
  console.log('   by flow:', counts); // eslint-disable-line no-console
  console.log(`   source: ${SERVICE_URL}`); // eslint-disable-line no-console
}

main().catch((err) => {
  console.error('❌ build-at-hydro-crossings failed:', err); // eslint-disable-line no-console
  process.exit(1);
});

