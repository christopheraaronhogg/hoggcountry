import assert from 'node:assert/strict';
import { test } from 'node:test';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { snapToMile, type TrailGeoPoint } from './trail-geometry.ts';

const MOBILE_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const geometry = JSON.parse(
	fs.readFileSync(path.join(MOBILE_ROOT, 'static/trail/elevation-100m.json'), 'utf8')
) as TrailGeoPoint[];

test('mobile trail geometry is in the calibrated 2197.4-mile frame', () => {
	assert.ok(geometry.length > 30_000, 'expected the dense 100m geometry');
	assert.equal(geometry[0].m, 0);
	assert.equal(geometry[geometry.length - 1].m, 2197.4);

	for (let i = 1; i < geometry.length; i += 1) {
		assert.ok(geometry[i].m >= geometry[i - 1].m, `mile went backwards at index ${i}`);
	}
});

test('mobile GPS snap agrees with the web/AWOL frame near the MA mismatch report', () => {
	const snapped = snapToMile(geometry, 42.5412, -73.14655, 0.25);
	assert.ok(snapped != null, 'expected coordinate to snap to the AT');
	assert.ok(snapped > 1581 && snapped < 1583, `expected about mile 1582, got ${snapped}`);
	assert.ok(Math.abs(snapped - 1541.6) > 20, 'must not return the old generated-route mile frame');
});
