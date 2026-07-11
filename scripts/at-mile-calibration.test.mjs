// Guards the anchor-calibrated mile frame: every mile the product displays
// derives from public/at-mileposts.json + src/data/at-mile-calibration.json,
// and both must stay consistent with the anchor table.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import yaml from 'js-yaml';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

const anchorsDoc = yaml.load(fs.readFileSync(path.join(ROOT, 'src/data/at-mile-anchors.yaml'), 'utf8'));
const calibration = JSON.parse(fs.readFileSync(path.join(ROOT, 'src/data/at-mile-calibration.json'), 'utf8'));
const milepostsPayload = JSON.parse(fs.readFileSync(path.join(ROOT, 'public/at-mileposts.json'), 'utf8'));
const mobileGeometry = JSON.parse(fs.readFileSync(path.join(ROOT, 'mobile/static/trail/elevation-100m.json'), 'utf8'));
const resupplyQuickRef = fs.readFileSync(path.join(ROOT, 'src/content/guide/quick/resupply.md'), 'utf8');

function haversineMiles(lat1, lon1, lat2, lon2) {
  const R = 3958.7613;
  const toRad = (deg) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

function snapToMobileGeometry(lat, lon) {
  const toRad = Math.PI / 180;
  const latRad = lat * toRad;
  let best = mobileGeometry[0];
  let bestDist = Infinity;
  for (const p of mobileGeometry) {
    const dx = (p.lon - lon) * toRad * Math.cos(latRad);
    const dy = (p.lat - lat) * toRad;
    const dist = dx * dx + dy * dy;
    if (dist < bestDist) {
      bestDist = dist;
      best = p;
    }
  }
  return {
    mile: best.m,
    distanceMiles: Math.sqrt(bestDist) * 3958.8
  };
}

test('calibration pairs are strictly monotonic in both frames', () => {
  const pairs = calibration.pairs;
  assert.ok(Array.isArray(pairs) && pairs.length >= 2, 'needs at least 2 control pairs');
  for (let i = 1; i < pairs.length; i += 1) {
    assert.ok(pairs[i][0] > pairs[i - 1][0], `measured not monotonic at pair ${i}`);
    assert.ok(pairs[i][1] > pairs[i - 1][1], `official not monotonic at pair ${i}`);
  }
});

test('calibration frame matches the anchor table', () => {
  assert.equal(calibration.frame.totalMiles, anchorsDoc.frame.total_miles);
});

test('hiker-facing resupply quick reference uses the calibrated mile frame consistently', () => {
  const rows = [...resupplyQuickRef.matchAll(/^\|\s*([^|]+?)\s*\|\s*~?([0-9.]+)\s*\|/gmu)];
  const valuesByLocation = new Map();
  for (const [, location, rawMile] of rows) {
    const key = location.trim();
    const values = valuesByLocation.get(key) ?? new Set();
    values.add(Number(rawMile));
    valuesByLocation.set(key, values);
  }

  for (const [location, values] of valuesByLocation) {
    assert.equal(values.size, 1, `${location} has contradictory quick-reference miles: ${[...values].join(', ')}`);
  }

  const expectedAnchors = new Map([
    ['Hot Springs, NC', 'Hot Springs, NC'],
    ['Erwin, TN', 'Nolichucky River / Erwin'],
    ['Pearisburg, VA', 'Pearisburg VA'],
    ['Daleville, VA', 'Daleville VA'],
    ['Waynesboro, VA', 'Rockfish Gap / Waynesboro'],
    ['Palmerton, PA', 'Lehigh Gap / Palmerton'],
    ['Great Barrington, MA', 'Great Barrington MA'],
    ['Gorham, NH', 'Gorham NH'],
    ['Damascus, VA', 'Damascus, VA'],
    ['Harpers Ferry, WV', 'Harpers Ferry WV'],
    ['Duncannon, PA', 'Duncannon PA'],
    ['Hanover, NH', 'Hanover NH'],
    ['Monson, ME', 'Monson ME']
  ]);

  for (const [location, anchorFragment] of expectedAnchors) {
    const anchor = anchorsDoc.anchors.find((candidate) => candidate.name.includes(anchorFragment));
    assert.ok(anchor, `missing canonical anchor for ${location}`);
    assert.deepEqual([...valuesByLocation.get(location) ?? []], [anchor.mile], `${location} must use calibrated mile ${anchor.mile}`);
  }
});

test('mileposts cover the official frame with monotonic miles', () => {
  const mileposts = milepostsPayload.mileposts;
  const total = anchorsDoc.frame.total_miles;
  assert.equal(mileposts[0].mile, 0);
  // The final milepost must be the true terminus (2197.4), not the truncated
  // integer — coordinate snaps at Katahdin must resolve to 100% complete.
  assert.equal(mileposts[mileposts.length - 1].mile, total, 'last milepost must be the official terminus');
  // Whole-mile spine increments by 1 up to floor(total); the appended fractional
  // terminus is the only sub-mile step.
  for (let i = 1; i < mileposts.length; i += 1) {
    const delta = mileposts[i].mile - mileposts[i - 1].mile;
    const isTerminusStep = i === mileposts.length - 1 && delta < 1;
    assert.ok(isTerminusStep || delta === 1, `unexpected milepost step at index ${i}: ${delta}`);
  }
});

test('milepost spacing is physically plausible', () => {
  const mileposts = milepostsPayload.mileposts;
  for (let i = 1; i < mileposts.length; i += 1) {
    const gap = haversineMiles(mileposts[i - 1].lat, mileposts[i - 1].lon, mileposts[i].lat, mileposts[i].lon);
    // Straight-line distance between consecutive official miles can never
    // exceed the mile itself, and a near-zero gap means a collapsed segment.
    assert.ok(gap <= 1.05, `mile ${mileposts[i].mile}: ${gap.toFixed(2)} mi straight-line gap`);
  }
});

test('every anchor lands at its official mile in the milepost skeleton', () => {
  const mileposts = milepostsPayload.mileposts;
  for (const anchor of anchorsDoc.anchors) {
    // Nearest milepost to the anchor's coordinates should carry (about) the
    // anchor's official mile. Tolerance covers anchors slightly off-trail
    // plus integer milepost rounding.
    let best = null;
    let bestDist = Infinity;
    for (const post of mileposts) {
      const d = haversineMiles(anchor.lat, anchor.lon, post.lat, post.lon);
      if (d < bestDist) {
        bestDist = d;
        best = post;
      }
    }
    assert.ok(best, `no milepost found for ${anchor.name}`);
    const mileError = Math.abs(best.mile - anchor.mile);
    assert.ok(
      mileError <= 1.5 + bestDist,
      `${anchor.name}: nearest milepost says ${best.mile}, anchor says ${anchor.mile} (off-trail ${bestDist.toFixed(2)} mi)`
    );
  }
});

test('mobile geometry uses the same official mile frame as web mileposts', () => {
  const total = anchorsDoc.frame.total_miles;
  assert.ok(mobileGeometry.length > 30_000, 'mobile geometry should keep dense 100m samples');
  assert.equal(mobileGeometry[0].m, 0);
  assert.equal(mobileGeometry[mobileGeometry.length - 1].m, total);
  for (let i = 1; i < mobileGeometry.length; i += 1) {
    assert.ok(mobileGeometry[i].m >= mobileGeometry[i - 1].m, `mobile geometry mile went backwards at index ${i}`);
  }
});

test('web mileposts snap back to matching mobile miles', () => {
  const mileposts = milepostsPayload.mileposts;
  let worstMileError = { mile: 0, error: 0, snapped: 0 };
  let worstDistance = { mile: 0, distanceMiles: 0 };

  for (const post of mileposts) {
    const snapped = snapToMobileGeometry(post.lat, post.lon);
    const error = snapped.mile - post.mile;
    if (Math.abs(error) > Math.abs(worstMileError.error)) {
      worstMileError = { mile: post.mile, error, snapped: snapped.mile };
    }
    if (snapped.distanceMiles > worstDistance.distanceMiles) {
      worstDistance = { mile: post.mile, distanceMiles: snapped.distanceMiles };
    }
  }

  assert.ok(
    Math.abs(worstMileError.error) <= 0.1,
    `mobile/web mile frame drift: web mile ${worstMileError.mile} snaps to mobile mile ${worstMileError.snapped} (${worstMileError.error.toFixed(3)} mi)`
  );
  assert.ok(
    worstDistance.distanceMiles <= 0.075,
    `mobile/web route geometry drift: web mile ${worstDistance.mile} is ${worstDistance.distanceMiles.toFixed(3)} mi from mobile geometry`
  );
});
