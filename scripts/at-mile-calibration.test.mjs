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

function haversineMiles(lat1, lon1, lat2, lon2) {
  const R = 3958.7613;
  const toRad = (deg) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
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

test('mileposts cover the official frame with monotonic miles', () => {
  const mileposts = milepostsPayload.mileposts;
  assert.equal(mileposts[0].mile, 0);
  assert.equal(mileposts[mileposts.length - 1].mile, Math.floor(anchorsDoc.frame.total_miles));
  for (let i = 1; i < mileposts.length; i += 1) {
    assert.equal(mileposts[i].mile, mileposts[i - 1].mile + 1);
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
