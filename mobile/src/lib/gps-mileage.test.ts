import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
	AUTO_GPS_FORCE_DELTA_MILES,
	AUTO_GPS_MIN_DELTA_MILES,
	AUTO_GPS_MIN_INTERVAL_MS,
	nextAutoGpsAdoption,
	resolveManualGpsMile,
	shouldAutoGpsWatch
} from './gps-mileage.ts';

const privacyOn = { sharePreciseLocation: true };
const privacyOff = { sharePreciseLocation: false };
const autoLogOn = { autoLogMileage: true };
const autoLogOff = { autoLogMileage: false };

test('shouldAutoGpsWatch requires browser, geolocation, trail geometry, precise location, and auto-log', () => {
	assert.equal(
		shouldAutoGpsWatch({
			browserAvailable: true,
			hasGeolocation: true,
			trailPointCount: 10,
			privacySettings: privacyOn,
			trailSettings: autoLogOn
		}),
		true
	);
	assert.equal(
		shouldAutoGpsWatch({
			browserAvailable: false,
			hasGeolocation: true,
			trailPointCount: 10,
			privacySettings: privacyOn,
			trailSettings: autoLogOn
		}),
		false
	);
	assert.equal(
		shouldAutoGpsWatch({
			browserAvailable: true,
			hasGeolocation: false,
			trailPointCount: 10,
			privacySettings: privacyOn,
			trailSettings: autoLogOn
		}),
		false
	);
	assert.equal(
		shouldAutoGpsWatch({
			browserAvailable: true,
			hasGeolocation: true,
			trailPointCount: 0,
			privacySettings: privacyOn,
			trailSettings: autoLogOn
		}),
		false
	);
	assert.equal(
		shouldAutoGpsWatch({
			browserAvailable: true,
			hasGeolocation: true,
			trailPointCount: 10,
			privacySettings: privacyOff,
			trailSettings: autoLogOn
		}),
		false
	);
	assert.equal(
		shouldAutoGpsWatch({
			browserAvailable: true,
			hasGeolocation: true,
			trailPointCount: 10,
			privacySettings: privacyOn,
			trailSettings: autoLogOff
		}),
		false
	);
});

test('nextAutoGpsAdoption ignores null snaps and tiny movements', () => {
	assert.equal(
		nextAutoGpsAdoption({
			snappedMile: null,
			currentMile: 100,
			lastAutoGpsAt: 0,
			nowMs: 1_000_000
		}),
		null
	);
	assert.equal(
		nextAutoGpsAdoption({
			snappedMile: 100.14,
			currentMile: 100,
			lastAutoGpsAt: 0,
			nowMs: 1_000_000
		}),
		null
	);
});

test('nextAutoGpsAdoption throttles normal movement but allows forced large jumps', () => {
	assert.equal(
		nextAutoGpsAdoption({
			snappedMile: 100.5,
			currentMile: 100,
			lastAutoGpsAt: 1_000_000,
			nowMs: 1_000_000 + AUTO_GPS_MIN_INTERVAL_MS - 1
		}),
		null
	);
	assert.deepEqual(
		nextAutoGpsAdoption({
			snappedMile: 100 + AUTO_GPS_FORCE_DELTA_MILES,
			currentMile: 100,
			lastAutoGpsAt: 1_000_000,
			nowMs: 1_000_001
		}),
		{ mile: 101, recordedAt: 1_000_001 }
	);
	assert.deepEqual(
		nextAutoGpsAdoption({
			snappedMile: 100.3,
			currentMile: 100,
			lastAutoGpsAt: 1_000_000,
			nowMs: 1_000_000 + AUTO_GPS_MIN_INTERVAL_MS
		}),
		{ mile: 100.3, recordedAt: 1_000_000 + AUTO_GPS_MIN_INTERVAL_MS }
	);
});

test('resolveManualGpsMile returns honest user-facing failure reasons', () => {
	assert.deepEqual(
		resolveManualGpsMile({
			sharePreciseLocation: false,
			hasPosition: false,
			snappedMile: null,
			trailGeometryLoaded: false
		}),
		{
			ok: false,
			reason: 'Turn on Precise location first, then I can snap your GPS fix to a trail mile.'
		}
	);
	assert.deepEqual(
		resolveManualGpsMile({
			sharePreciseLocation: true,
			hasPosition: false,
			snappedMile: null,
			trailGeometryLoaded: true
		}),
		{ ok: false, reason: "Couldn't get a GPS fix. Try again with a clearer view of the sky." }
	);
	assert.deepEqual(
		resolveManualGpsMile({
			sharePreciseLocation: true,
			hasPosition: true,
			snappedMile: null,
			trailGeometryLoaded: true
		}),
		{
			ok: false,
			reason: "Your GPS fix is more than 2 miles from the AT route, so I won't guess a trail mile."
		}
	);
	assert.deepEqual(
		resolveManualGpsMile({
			sharePreciseLocation: true,
			hasPosition: true,
			snappedMile: null,
			trailGeometryLoaded: false
		}),
		{ ok: false, reason: 'The trail map is still loading — try again in a moment.' }
	);
});

test('resolveManualGpsMile returns a clamped mile for valid snaps', () => {
	assert.deepEqual(
		resolveManualGpsMile({
			sharePreciseLocation: true,
			hasPosition: true,
			snappedMile: 88.04,
			trailGeometryLoaded: true
		}),
		{ ok: true, mile: 88 }
	);
});
