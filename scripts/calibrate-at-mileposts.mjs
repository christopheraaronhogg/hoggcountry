#!/usr/bin/env node
// Calibrate the open-route geometry to official AT miles using the anchor
// table, then regenerate the milepost skeleton in the official frame.
//
//   node scripts/calibrate-at-mileposts.mjs [--dry-run]
//
// Inputs
//   src/data/at-mile-anchors.yaml  — citation-backed (location, official mile) anchors
//   data/at-open-reference/full_trail_rc1/processed/milepoints/full_at_milepoints_0_1mi.geojson
//     — 0.1-mile points along the open route; `mile_nobo` is the measured
//       (geometric, ~2106.2-total) frame every processed dataset uses
//
// Outputs
//   src/data/at-mile-calibration.json — measured→official control pairs; the
//     server converts waypoint/terrain/elevation miles through this at the
//     map-pack boundary
//   public/at-mileposts.json — milepost per official mile 0..2197; replaces
//     the uniform-rescale output of generate-at-mileposts.mjs (whose
//     scaledTrailMiles field is intentionally dropped so every consumer's
//     `scaledTrailMiles ?? mile` fallback lands on the official mile)
//   data/at-mile-calibration/report.md — anchor residuals, interval scales,
//     leave-one-out cross-validation
//
// Mile markers change year to year. To recalibrate for a new AWOL edition,
// update the anchor table and re-run this script.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import yaml from 'js-yaml';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const ANCHORS_PATH = path.join(ROOT, 'src/data/at-mile-anchors.yaml');
const MILEPOINTS_PATH = path.join(
  ROOT,
  'data/at-open-reference/full_trail_rc1/processed/milepoints/full_at_milepoints_0_1mi.geojson'
);
const CALIBRATION_OUT = path.join(ROOT, 'src/data/at-mile-calibration.json');
const MILEPOSTS_OUT = path.join(ROOT, 'public/at-mileposts.json');
const REPORT_OUT = path.join(ROOT, 'data/at-mile-calibration/report.md');

const DRY_RUN = process.argv.includes('--dry-run');

const MAX_ANCHOR_OFF_TRAIL_MILES = 5; // road crossings/town anchors can sit off the centerline
const WARN_ANCHOR_OFF_TRAIL_MILES = 1.5;
const INTERVAL_SCALE_BOUNDS = [0.95, 1.35]; // official/measured per interval; geometry undercounts

function haversineMiles(lat1, lon1, lat2, lon2) {
  const R = 3958.7613;
  const toRad = (deg) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

// --- Load milepoints (measured frame backbone) -----------------------------
const milepointsRaw = JSON.parse(fs.readFileSync(MILEPOINTS_PATH, 'utf8'));
const backbone = milepointsRaw.features
  .map((f) => ({
    measured: f.properties.mile_nobo,
    lat: f.geometry.coordinates[1],
    lon: f.geometry.coordinates[0]
  }))
  .filter((p) => Number.isFinite(p.measured) && Number.isFinite(p.lat) && Number.isFinite(p.lon))
  .sort((a, b) => a.measured - b.measured);

if (backbone.length < 1000) {
  throw new Error(`Backbone unexpectedly small: ${backbone.length} milepoints`);
}
const measuredTotal = backbone[backbone.length - 1].measured;

// --- Load anchors -----------------------------------------------------------
const anchorsDoc = yaml.load(fs.readFileSync(ANCHORS_PATH, 'utf8'));
const officialTotal = anchorsDoc.frame?.total_miles;
if (!Number.isFinite(officialTotal)) throw new Error('frame.total_miles missing from anchor file');

const anchors = (anchorsDoc.anchors ?? [])
  .filter((a) => Number.isFinite(a.lat) && Number.isFinite(a.lon) && Number.isFinite(a.mile))
  .sort((a, b) => a.mile - b.mile);
if (anchors.length < 2) throw new Error('Need at least the two terminus anchors');

// --- Project anchors onto the backbone --------------------------------------
const warnings = [];
const projected = [];

for (const anchor of anchors) {
  let bestIdx = -1;
  let bestDist = Infinity;
  for (let i = 0; i < backbone.length; i += 1) {
    const d = haversineMiles(anchor.lat, anchor.lon, backbone[i].lat, backbone[i].lon);
    if (d < bestDist) {
      bestDist = d;
      bestIdx = i;
    }
  }
  if (bestDist > MAX_ANCHOR_OFF_TRAIL_MILES) {
    warnings.push(`DROPPED ${anchor.name}: ${bestDist.toFixed(2)} mi off the route (limit ${MAX_ANCHOR_OFF_TRAIL_MILES})`);
    continue;
  }
  if (bestDist > WARN_ANCHOR_OFF_TRAIL_MILES) {
    warnings.push(`WARN ${anchor.name}: ${bestDist.toFixed(2)} mi off the route — verify coordinates`);
  }
  projected.push({ ...anchor, measured: backbone[bestIdx].measured, offTrailMiles: bestDist });
}

// Enforce monotonic measured order; a violator usually means bad coordinates.
const control = [];
for (const p of projected) {
  const last = control[control.length - 1];
  if (last && (p.measured <= last.measured || p.mile <= last.mile)) {
    warnings.push(
      `DROPPED ${p.name}: breaks monotonic order (measured ${p.measured} after ${last.name} at ${last.measured})`
    );
    continue;
  }
  control.push(p);
}
if (control.length < 2) throw new Error('Fewer than 2 usable anchors after validation');

// --- Interval scale sanity ---------------------------------------------------
const intervals = [];
for (let i = 1; i < control.length; i += 1) {
  const dMeasured = control[i].measured - control[i - 1].measured;
  const dOfficial = control[i].mile - control[i - 1].mile;
  const scale = dOfficial / dMeasured;
  intervals.push({ from: control[i - 1].name, to: control[i].name, dMeasured, dOfficial, scale });
  if (scale < INTERVAL_SCALE_BOUNDS[0] || scale > INTERVAL_SCALE_BOUNDS[1]) {
    warnings.push(
      `WARN interval ${control[i - 1].name} → ${control[i].name}: scale ${scale.toFixed(3)} outside ${INTERVAL_SCALE_BOUNDS} — one of these anchors is suspect`
    );
  }
}

// --- Calibration functions ---------------------------------------------------
function makeConverter(pairs) {
  return (measured) => {
    if (measured <= pairs[0].measured) {
      const [a, b] = [pairs[0], pairs[1]];
      const s = (b.mile - a.mile) / (b.measured - a.measured);
      return a.mile + (measured - a.measured) * s;
    }
    if (measured >= pairs[pairs.length - 1].measured) {
      const [a, b] = [pairs[pairs.length - 2], pairs[pairs.length - 1]];
      const s = (b.mile - a.mile) / (b.measured - a.measured);
      return b.mile + (measured - b.measured) * s;
    }
    let lo = 0;
    let hi = pairs.length - 1;
    while (lo + 1 < hi) {
      const mid = (lo + hi) >> 1;
      if (pairs[mid].measured <= measured) lo = mid;
      else hi = mid;
    }
    const a = pairs[lo];
    const b = pairs[hi];
    const t = (measured - a.measured) / (b.measured - a.measured);
    return a.mile + (b.mile - a.mile) * t;
  };
}

function makeInverse(pairs) {
  return (official) => {
    if (official <= pairs[0].mile) {
      const [a, b] = [pairs[0], pairs[1]];
      const s = (b.measured - a.measured) / (b.mile - a.mile);
      return a.measured + (official - a.mile) * s;
    }
    if (official >= pairs[pairs.length - 1].mile) {
      const [a, b] = [pairs[pairs.length - 2], pairs[pairs.length - 1]];
      const s = (b.measured - a.measured) / (b.mile - a.mile);
      return b.measured + (official - b.mile) * s;
    }
    let lo = 0;
    let hi = pairs.length - 1;
    while (lo + 1 < hi) {
      const mid = (lo + hi) >> 1;
      if (pairs[mid].mile <= official) lo = mid;
      else hi = mid;
    }
    const a = pairs[lo];
    const b = pairs[hi];
    const t = (official - a.mile) / (b.mile - a.mile);
    return a.measured + (b.measured - a.measured) * t;
  };
}

// --- Leave-one-out cross-validation -----------------------------------------
const loo = [];
for (let i = 1; i < control.length - 1; i += 1) {
  const without = control.filter((_, idx) => idx !== i);
  const predict = makeConverter(without);
  const predicted = predict(control[i].measured);
  loo.push({ name: control[i].name, official: control[i].mile, predicted, errorMiles: predicted - control[i].mile });
}

// --- Position lookup along the backbone --------------------------------------
function positionAtMeasured(measured) {
  const clamped = Math.max(backbone[0].measured, Math.min(measuredTotal, measured));
  let lo = 0;
  let hi = backbone.length - 1;
  while (lo + 1 < hi) {
    const mid = (lo + hi) >> 1;
    if (backbone[mid].measured <= clamped) lo = mid;
    else hi = mid;
  }
  const a = backbone[lo];
  const b = backbone[hi];
  const span = b.measured - a.measured;
  const t = span > 0 ? (clamped - a.measured) / span : 0;
  return {
    lat: a.lat + (b.lat - a.lat) * t,
    lon: a.lon + (b.lon - a.lon) * t
  };
}

// --- Regenerate mileposts in the official frame ------------------------------
const toMeasured = makeInverse(control);
const mileposts = [];
const maxWholeMile = Math.floor(officialTotal);
for (let mile = 0; mile <= maxWholeMile; mile += 1) {
  const { lat, lon } = positionAtMeasured(toMeasured(mile));
  mileposts.push({ mile, lat: Number(lat.toFixed(6)), lon: Number(lon.toFixed(6)) });
}
// The integer loop stops at floor(total); append the true fractional terminus
// so coordinate/mile snaps at Katahdin resolve to the official 2197.9 (100%
// complete), not the truncated 2197.0. Use the highest-mile anchor's own
// coordinates (definitionally Baxter Peak) when it sits at the terminus.
if (officialTotal > maxWholeMile) {
  const terminus = control[control.length - 1];
  const { lat, lon } =
    terminus.mile >= officialTotal - 1e-6
      ? { lat: terminus.lat, lon: terminus.lon }
      : positionAtMeasured(toMeasured(officialTotal));
  mileposts.push({ mile: officialTotal, lat: Number(lat.toFixed(6)), lon: Number(lon.toFixed(6)) });
}

// --- Write outputs ------------------------------------------------------------
const calibration = {
  generatedAt: new Date().toISOString(),
  source: 'scripts/calibrate-at-mileposts.mjs',
  frame: { totalMiles: officialTotal, reference: anchorsDoc.frame?.reference ?? 'AWOL 2026' },
  measuredTotalMiles: measuredTotal,
  anchorsUsed: control.map((c) => ({
    name: c.name,
    officialMile: c.mile,
    measuredMile: c.measured,
    offTrailMiles: Number(c.offTrailMiles.toFixed(3)),
    confidence: c.confidence ?? 'unspecified'
  })),
  pairs: control.map((c) => [Number(c.measured.toFixed(4)), Number(c.mile.toFixed(4))])
};

const milepostsPayload = {
  meta: {
    generatedAt: new Date().toISOString(),
    source: 'scripts/calibrate-at-mileposts.mjs (anchor-calibrated; supersedes generate-at-mileposts.mjs miles)',
    frame: `official NOBO miles, ${anchorsDoc.frame?.reference ?? 'AWOL 2026'} (total ${officialTotal})`,
    anchors: control.length,
    calibration: 'src/data/at-mile-calibration.json',
    milepostsCount: mileposts.length
  },
  mileposts
};

const looAbs = loo.map((l) => Math.abs(l.errorMiles));
const looMax = looAbs.length ? Math.max(...looAbs) : 0;
const looMean = looAbs.length ? looAbs.reduce((a, b) => a + b, 0) / looAbs.length : 0;

const report = `# AT Mile Calibration Report

Generated: ${new Date().toISOString()}
Frame: official NOBO miles, ${anchorsDoc.frame?.reference ?? 'AWOL 2026'} (total ${officialTotal})
Backbone: ${backbone.length} milepoints, measured total ${measuredTotal} mi
Anchors used: ${control.length} of ${anchors.length}

## Anchors

| Anchor | Official mile | Measured mile | Off-trail (mi) | Interval scale | Confidence |
|---|---|---|---|---|---|
${control
  .map((c, i) => {
    const scale = i === 0 ? '—' : intervals[i - 1].scale.toFixed(3);
    return `| ${c.name} | ${c.mile} | ${c.measured.toFixed(1)} | ${c.offTrailMiles.toFixed(2)} | ${scale} | ${c.confidence ?? '—'} |`;
  })
  .join('\n')}

## Leave-one-out cross-validation

Predicting each interior anchor from the others. Error here estimates the
calibration accuracy BETWEEN anchors — more/better anchors shrink it.

| Anchor | Official | Predicted | Error (mi) |
|---|---|---|---|
${loo.map((l) => `| ${l.name} | ${l.official} | ${l.predicted.toFixed(1)} | ${l.errorMiles >= 0 ? '+' : ''}${l.errorMiles.toFixed(1)} |`).join('\n')}

Mean abs error: ${looMean.toFixed(2)} mi · Max abs error: ${looMax.toFixed(2)} mi

## Warnings

${warnings.length ? warnings.map((w) => `- ${w}`).join('\n') : '- none'}
`;

console.log(report);

if (DRY_RUN) {
  console.log('--dry-run: no files written');
} else {
  fs.mkdirSync(path.dirname(REPORT_OUT), { recursive: true });
  fs.writeFileSync(CALIBRATION_OUT, JSON.stringify(calibration, null, 2) + '\n');
  fs.writeFileSync(MILEPOSTS_OUT, JSON.stringify(milepostsPayload));
  fs.writeFileSync(REPORT_OUT, report);
  console.log(`Wrote ${path.relative(ROOT, CALIBRATION_OUT)}, ${path.relative(ROOT, MILEPOSTS_OUT)}, ${path.relative(ROOT, REPORT_OUT)}`);
}
