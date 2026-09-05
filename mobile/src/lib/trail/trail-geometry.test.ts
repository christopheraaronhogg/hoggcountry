import assert from 'node:assert/strict';
import { test } from 'node:test';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
	climbFeet,
	elevationWindow,
	snapToMile,
	type TrailGeoPoint,
	type TrailSnapGeometry
} from './trail-geometry.ts';

const MOBILE_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const geometry = JSON.parse(
	fs.readFileSync(path.join(MOBILE_ROOT, 'static/trail/elevation-100m.json'), 'utf8')
) as TrailGeoPoint[];
const snapGeometry = JSON.parse(
	fs.readFileSync(path.join(MOBILE_ROOT, 'static/trail/route-snap-20m.json'), 'utf8')
) as TrailSnapGeometry;

function metersBetween(a: { lat: number; lon: number }, b: { lat: number; lon: number }): number {
	const earthRadiusMeters = 6371008.8;
	const toRad = Math.PI / 180;
	const phi1 = a.lat * toRad;
	const phi2 = b.lat * toRad;
	const deltaPhi = (b.lat - a.lat) * toRad;
	const deltaLambda = (b.lon - a.lon) * toRad;
	const hav =
		Math.sin(deltaPhi / 2) ** 2 +
		Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) ** 2;
	return 2 * earthRadiusMeters * Math.atan2(Math.sqrt(hav), Math.sqrt(1 - hav));
}

test('mobile trail geometry is in the calibrated 2197.9-mile frame', () => {
	assert.ok(geometry.length > 30_000, 'expected the dense 100m geometry');
	assert.equal(geometry[0].m, 0);
	assert.equal(geometry[geometry.length - 1].m, 2197.9);

	for (let i = 1; i < geometry.length; i += 1) {
		assert.ok(geometry[i].m >= geometry[i - 1].m, `mile went backwards at index ${i}`);
	}
});

test('mobile GPS snap index keeps roughly 20m route spacing in the calibrated mile frame', () => {
	assert.equal(snapGeometry.spacingMeters, 20);
	assert.ok(snapGeometry.m.length > 160_000, 'expected the dense 20m snap geometry');
	assert.equal(snapGeometry.m.length, snapGeometry.lat.length);
	assert.equal(snapGeometry.m.length, snapGeometry.lon.length);
	assert.equal(snapGeometry.m[0], 0);
	assert.equal(snapGeometry.m[snapGeometry.m.length - 1], 2197.9);

	let maxMeters = 0;
	for (let i = 1; i < snapGeometry.m.length; i += 1) {
		assert.ok(snapGeometry.m[i] >= snapGeometry.m[i - 1], `mile went backwards at index ${i}`);
		maxMeters = Math.max(
			maxMeters,
			metersBetween(
				{ lat: snapGeometry.lat[i - 1], lon: snapGeometry.lon[i - 1] },
				{ lat: snapGeometry.lat[i], lon: snapGeometry.lon[i] }
			)
		);
	}
	assert.ok(maxMeters < 22, `expected max snap spacing under 22m, got ${maxMeters.toFixed(2)}m`);
});

test('GPS snapping projects onto trail segments instead of only picking stored points', () => {
	const coarseLine: TrailGeoPoint[] = [
		{ m: 10, ft: 0, lat: 0, lon: 0 },
		{ m: 20, ft: 0, lat: 0, lon: 0.01 }
	];
	const snapped = snapToMile(coarseLine, 0, 0.005, 1);
	assert.ok(snapped != null, 'expected midpoint to snap to the line segment');
	assert.ok(Math.abs(snapped - 15) < 0.01, `expected midpoint mile 15, got ${snapped}`);
});

test('mobile GPS snap agrees with the web/AWOL frame near the MA mismatch report', () => {
	const snapped = snapToMile(snapGeometry, 42.5412, -73.14655, 0.25);
	assert.ok(snapped != null, 'expected coordinate to snap to the AT');
	assert.ok(snapped > 1581 && snapped < 1583, `expected about mile 1582, got ${snapped}`);
	assert.ok(Math.abs(snapped - 1541.6) > 20, 'must not return the old generated-route mile frame');
});

test('SOBO elevation windows are returned in travel order so climb remains truthful', () => {
	const profile: TrailGeoPoint[] = [
		{ m: 8, ft: 100, lat: 0, lon: 0 },
		{ m: 9, ft: 200, lat: 0, lon: 0 },
		{ m: 10, ft: 150, lat: 0, lon: 0 }
	];

	const nobo = elevationWindow(profile, 8, 2, 'NOBO');
	const sobo = elevationWindow(profile, 10, 2, 'SOBO');

	assert.deepEqual(nobo.map((point) => point.mile), [8, 9, 10]);
	assert.deepEqual(sobo.map((point) => point.mile), [10, 9, 8]);
	assert.equal(climbFeet(nobo), 100);
	assert.equal(climbFeet(sobo), 50);
	assert.deepEqual(elevationWindow(profile, 0, 2, 'SOBO'), []);
});
