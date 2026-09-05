#!/usr/bin/env node
// Rebuild the compact mobile trail geometry in the same calibrated mile frame
// as public/at-mileposts.json. Source elevation samples keep their open-route
// measured miles (~2106 mi total); this output stores official NOBO miles
// (2197.9 mi total) so GPS snaps, map markers, and shared live locations agree
// with the web app and hiker-facing guidebook markers.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');

const CALIBRATION_PATH = path.join(ROOT, 'src/data/at-mile-calibration.json');
const SOURCE_ELEVATION_PATH = path.join(
	ROOT,
	'data/at-open-reference/full_trail_rc1/processed/elevation/full_trail_elevation_samples_100m.json'
);
const OUT_ELEVATION_PATH = path.join(ROOT, 'mobile/static/trail/elevation-100m.json');
const OUT_SNAP_PATH = path.join(ROOT, 'mobile/static/trail/route-snap-20m.json');

const SNAP_SPACING_METERS = 20;
const METERS_PER_MILE = 1609.344;

function readJson(file) {
	return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function makeConverter(pairs) {
	return (measured) => {
		if (measured <= pairs[0][0]) {
			const [aMeasured, aMile] = pairs[0];
			const [bMeasured, bMile] = pairs[1];
			const scale = (bMile - aMile) / (bMeasured - aMeasured);
			return aMile + (measured - aMeasured) * scale;
		}
		if (measured >= pairs[pairs.length - 1][0]) {
			const [aMeasured, aMile] = pairs[pairs.length - 2];
			const [bMeasured, bMile] = pairs[pairs.length - 1];
			const scale = (bMile - aMile) / (bMeasured - aMeasured);
			return bMile + (measured - bMeasured) * scale;
		}

		let lo = 0;
		let hi = pairs.length - 1;
		while (lo + 1 < hi) {
			const mid = (lo + hi) >> 1;
			if (pairs[mid][0] <= measured) lo = mid;
			else hi = mid;
		}
		const [aMeasured, aMile] = pairs[lo];
		const [bMeasured, bMile] = pairs[hi];
		const t = (measured - aMeasured) / (bMeasured - aMeasured);
		return aMile + (bMile - aMile) * t;
	};
}

function round(value, places) {
	const scale = 10 ** places;
	return Math.round(value * scale) / scale;
}

const calibration = readJson(CALIBRATION_PATH);
const totalMiles = calibration.frame?.totalMiles;
const pairs = calibration.pairs;

if (!Number.isFinite(totalMiles) || !Array.isArray(pairs) || pairs.length < 2) {
	throw new Error(`Invalid calibration file: ${path.relative(ROOT, CALIBRATION_PATH)}`);
}

const toOfficial = makeConverter(pairs);
const source = readJson(SOURCE_ELEVATION_PATH);
if (!Array.isArray(source) || source.length < 30_000) {
	throw new Error(`Unexpected elevation source shape: ${path.relative(ROOT, SOURCE_ELEVATION_PATH)}`);
}

const points = source.map((sample) => {
	const measured = sample.mile_nobo_global_est;
	const distance = sample.distance_meters;
	const lat = sample.lat;
	const lon = sample.lon;
	const ft = sample.elevation_ft;
	if (![measured, distance, lat, lon, ft].every(Number.isFinite)) {
		throw new Error(`Invalid elevation sample at index ${sample.sample_index ?? 'unknown'}`);
	}
	const official = Math.max(0, Math.min(totalMiles, toOfficial(measured)));
	return {
		m: round(official, 3),
		ft: round(ft, 1),
		lat: round(lat, 5),
		lon: round(lon, 5)
	};
});

points[0].m = 0;
points[points.length - 1].m = totalMiles;

for (let i = 1; i < points.length; i += 1) {
	if (points[i].m < points[i - 1].m) {
		throw new Error(`Calibrated mobile miles are not monotonic at index ${i}`);
	}
	if (source[i].distance_meters < source[i - 1].distance_meters) {
		throw new Error(`Source stationing is not monotonic at index ${i}`);
	}
}

fs.writeFileSync(OUT_ELEVATION_PATH, `${JSON.stringify(points)}\n`);
console.log(
	`Wrote ${path.relative(ROOT, OUT_ELEVATION_PATH)} (${points.length.toLocaleString('en-US')} points, 0-${totalMiles} mi)`
);

const snap = {
	spacingMeters: SNAP_SPACING_METERS,
	totalMiles,
	m: [],
	lat: [],
	lon: []
};

function sampleAtDistance(distanceMeters) {
	const clamped = Math.max(0, Math.min(source[source.length - 1].distance_meters, distanceMeters));
	let lo = 0;
	let hi = source.length - 1;
	while (lo + 1 < hi) {
		const mid = (lo + hi) >> 1;
		if (source[mid].distance_meters <= clamped) lo = mid;
		else hi = mid;
	}
	const a = source[lo];
	const b = source[hi];
	const span = b.distance_meters - a.distance_meters;
	const t = span > 0 ? (clamped - a.distance_meters) / span : 0;
	return {
		lat: a.lat + (b.lat - a.lat) * t,
		lon: a.lon + (b.lon - a.lon) * t
	};
}

function pushSnap(measuredMeters) {
	const coord = sampleAtDistance(measuredMeters);
	const official = Math.max(0, Math.min(totalMiles, toOfficial(measuredMeters / METERS_PER_MILE)));
	snap.m.push(round(official, 4));
	snap.lat.push(round(coord.lat, 5));
	snap.lon.push(round(coord.lon, 5));
}

const totalDistanceMeters = source[source.length - 1].distance_meters;
for (let distanceMeters = 0; distanceMeters < totalDistanceMeters; distanceMeters += SNAP_SPACING_METERS) {
	pushSnap(distanceMeters);
}
pushSnap(totalDistanceMeters);
snap.m[0] = 0;
snap.m[snap.m.length - 1] = totalMiles;

for (let i = 1; i < snap.m.length; i += 1) {
	if (snap.m[i] < snap.m[i - 1]) {
		throw new Error(`Calibrated snap miles are not monotonic at index ${i}`);
	}
}

fs.writeFileSync(OUT_SNAP_PATH, `${JSON.stringify(snap)}\n`);
console.log(
	`Wrote ${path.relative(ROOT, OUT_SNAP_PATH)} (${snap.m.length.toLocaleString('en-US')} points every ${SNAP_SPACING_METERS} m, 0-${totalMiles} mi)`
);
