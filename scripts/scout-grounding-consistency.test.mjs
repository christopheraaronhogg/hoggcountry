// Guards that Scout's deterministic route grounding (packages/trail-data
// AT_ROUTE_REFERENCE_POINTS) never grossly diverges from the calibrated mile
// frame (src/data/at-mile-anchors.yaml) that drives the map/journey. A few
// waypoints differ by ~2 mi due to point-choice / frame convention (e.g.
// Harpers Ferry ATC-HQ side trail vs the US-340 town crossing); that's
// tolerated. A reintroduced stale-frame value (e.g. Pine Grove at ~1092
// instead of ~1106) would be ~13 mi off and must fail.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import yaml from 'js-yaml';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const { AT_ROUTE_REFERENCE_POINTS } = await import('../packages/trail-data/src/at-route-validator.ts');
const anchors = yaml.load(fs.readFileSync(path.join(ROOT, 'src/data/at-mile-anchors.yaml'), 'utf8')).anchors;

const FAIL_OVER_MILES = 5; // gross drift — a stale frame or wrong waypoint
const WARN_OVER_MILES = 2; // frame-convention / point-choice differences

function haversineMiles(lat1, lon1, lat2, lon2) {
  const R = 3958.7613;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

test('Scout grounding waypoints reference the same calibrated mile frame', () => {
  const points = AT_ROUTE_REFERENCE_POINTS.filter(
    (p) => Number.isFinite(p.mile) && Number.isFinite(p.latitude) && Number.isFinite(p.longitude)
  );
  assert.ok(points.length >= 10, 'expected a populated reference-point catalog with coordinates');

  const grossDrift = [];
  const warnDrift = [];
  let matched = 0;

  for (const point of points) {
    // nearest anchor geographically; only compare when it's genuinely the same spot
    let best = null;
    let bestGeo = Infinity;
    for (const a of anchors) {
      const geo = haversineMiles(point.latitude, point.longitude, a.lat, a.lon);
      if (geo < bestGeo) {
        bestGeo = geo;
        best = a;
      }
    }
    if (!best || bestGeo > 1.5) continue; // no co-located anchor to check against
    matched += 1;
    const mileDelta = Math.abs(point.mile - best.mile);
    if (mileDelta > FAIL_OVER_MILES) grossDrift.push(`${point.name} (${point.mile}) vs anchor ${best.name} (${best.mile}) — ${mileDelta.toFixed(1)} mi`);
    else if (mileDelta > WARN_OVER_MILES) warnDrift.push(`${point.name}: ${point.mile} vs anchor ${best.mile} (${mileDelta.toFixed(1)} mi)`);
  }

  assert.ok(matched >= 3, `expected several co-located waypoints to cross-check (got ${matched})`);
  if (warnDrift.length) console.log('grounding frame notes (tolerated):\n - ' + warnDrift.join('\n - '));
  assert.equal(
    grossDrift.length,
    0,
    `Scout grounding diverges grossly from the calibrated frame (>${FAIL_OVER_MILES} mi):\n - ${grossDrift.join('\n - ')}`
  );
});
