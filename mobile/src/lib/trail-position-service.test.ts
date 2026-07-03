import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
	TrailPositionService,
	type TrailGeolocation,
	type TrailGpsPosition,
	type TrailPositionPoint,
	type TrailSnapGeometry
} from './trail-position-service.ts';
import type { PrivacySettings, TrailSettings } from './types.ts';

const points: TrailPositionPoint[] = [
	{ m: 0, ft: 0, lat: 0, lon: 0 },
	{ m: 88.04, ft: 1000, lat: 1, lon: 1 }
];
const snapGeometry: TrailSnapGeometry = {
	m: points.map((point) => point.m),
	lat: points.map((point) => point.lat),
	lon: points.map((point) => point.lon)
};

function position(lat: number, lon: number): TrailGpsPosition {
	return { coords: { latitude: lat, longitude: lon } };
}

function createFakeGeolocation(nextPosition: TrailGpsPosition | null = null) {
	let watchSuccess: ((position: TrailGpsPosition) => void) | null = null;
	const calls = {
		watch: 0,
		clear: [] as number[],
		get: 0
	};
	const geolocation: TrailGeolocation = {
		getCurrentPosition(success, error) {
			calls.get += 1;
			if (nextPosition) {
				success(nextPosition);
			} else {
				error?.();
			}
		},
		watchPosition(success) {
			calls.watch += 1;
			watchSuccess = success;
			return 7;
		},
		clearWatch(id) {
			calls.clear.push(id);
		}
	};

	return {
		calls,
		geolocation,
		emit(position: TrailGpsPosition) {
			watchSuccess?.(position);
		},
		setNextPosition(position: TrailGpsPosition | null) {
			nextPosition = position;
		}
	};
}

function createService(options: {
	geolocation?: TrailGeolocation | null;
	privacy?: Pick<PrivacySettings, 'sharePreciseLocation'>;
	settings?: Pick<TrailSettings, 'autoLogMileage'>;
	geometry?: TrailPositionPoint[];
	snapGeometry?: TrailSnapGeometry | null;
	currentMile?: number;
	onUpdate?: (mile: number, source: string) => void;
	onActive?: (active: boolean) => void;
	loadGeometry?: () => Promise<TrailPositionPoint[]>;
	loadSnapGeometry?: () => Promise<TrailSnapGeometry | null>;
	snapToMile?: (
		points: TrailPositionPoint[] | TrailSnapGeometry | null,
		lat: number,
		lon: number
	) => number | null;
} = {}) {
	let geometry = options.geometry ?? points;
	let loadedSnapGeometry = options.snapGeometry === undefined ? snapGeometry : options.snapGeometry;
	let currentMile = options.currentMile ?? 0;
	const updates: Array<{ mile: number; source: string }> = [];
	const activeStates: boolean[] = [];
	const service = new TrailPositionService({
		browserAvailable: true,
		getGeolocation: () => options.geolocation ?? null,
		getPrivacySettings: () => options.privacy ?? { sharePreciseLocation: true },
		getTrailSettings: () => options.settings ?? { autoLogMileage: true },
		getTrailGeometry: () => geometry,
		setTrailGeometry: (points) => {
			geometry = points;
		},
		getSnapGeometry: () => loadedSnapGeometry,
		setSnapGeometry: (geometry) => {
			loadedSnapGeometry = geometry;
		},
		setAutoGpsActive: (active) => {
			activeStates.push(active);
			options.onActive?.(active);
		},
		getCurrentMile: () => currentMile,
		updateCurrentMile: (mile, source) => {
			currentMile = mile;
			updates.push({ mile, source });
			options.onUpdate?.(mile, source);
		},
		loadGeometry: options.loadGeometry ?? (() => Promise.resolve(geometry)),
		loadSnapGeometry: options.loadSnapGeometry ?? (() => Promise.resolve(loadedSnapGeometry)),
		snapToMile:
			options.snapToMile ??
			((_points, lat) => {
				return lat === 1 ? 88.04 : null;
			})
	});

	return {
		activeStates,
		get geometry() {
			return geometry;
		},
		get snapGeometry() {
			return loadedSnapGeometry;
		},
		get currentMile() {
			return currentMile;
		},
		service,
		updates
	};
}

test('TrailPositionService loads geometry and starts the auto GPS watcher when allowed', async () => {
	const fake = createFakeGeolocation();
	const loaded = [{ m: 12, ft: 1200, lat: 12, lon: 12 }];
	const harness = createService({
		geolocation: fake.geolocation,
		geometry: [],
		loadGeometry: () => Promise.resolve(loaded)
	});

	await harness.service.loadTrailGeometry();

	assert.equal(harness.geometry, loaded);
	assert.equal(fake.calls.watch, 1);
	assert.equal(harness.service.autoGpsActive, true);
	assert.deepEqual(harness.activeStates, [true]);
});

test('TrailPositionService loads snap geometry before adopting a manual GPS fix', async () => {
	const fake = createFakeGeolocation(position(1, 1));
	let loadSnapCalls = 0;
	const harness = createService({
		geolocation: fake.geolocation,
		geometry: [],
		snapGeometry: null,
		loadSnapGeometry: () => {
			loadSnapCalls += 1;
			return Promise.resolve(snapGeometry);
		}
	});

	const result = await harness.service.useGpsForMile();

	assert.deepEqual(result, { ok: true, mile: 88 });
	assert.equal(loadSnapCalls, 1);
	assert.equal(harness.snapGeometry, snapGeometry);
	assert.deepEqual(harness.updates, [{ mile: 88, source: 'gps' }]);
});

test('TrailPositionService stops the watcher when precise location is disabled', () => {
	const fake = createFakeGeolocation();
	const privacy = { sharePreciseLocation: true };
	const harness = createService({ geolocation: fake.geolocation, privacy });

	harness.service.reconcileAutoGpsWatch();
	privacy.sharePreciseLocation = false;
	harness.service.reconcileAutoGpsWatch();

	assert.deepEqual(fake.calls.clear, [7]);
	assert.equal(harness.service.autoGpsActive, false);
	assert.deepEqual(harness.activeStates, [true, false]);
});

test('TrailPositionService does not request a GPS fix when precise location is disabled', async () => {
	const fake = createFakeGeolocation(position(1, 1));
	const harness = createService({
		geolocation: fake.geolocation,
		privacy: { sharePreciseLocation: false }
	});

	const result = await harness.service.useGpsForMile();

	assert.deepEqual(result, {
		ok: false,
		reason: 'Turn on Precise location first, then I can snap your GPS fix to a trail mile.'
	});
	assert.equal(fake.calls.get, 0);
	assert.deepEqual(harness.updates, []);
});

test('TrailPositionService snaps a manual GPS fix and updates the current mile', async () => {
	const fake = createFakeGeolocation(position(1, 1));
	const harness = createService({ geolocation: fake.geolocation });

	const result = await harness.service.useGpsForMile();

	assert.deepEqual(result, { ok: true, mile: 88 });
	assert.deepEqual(harness.updates, [{ mile: 88, source: 'gps' }]);
});

test('TrailPositionService adopts background GPS fixes through the same mile update path', () => {
	const fake = createFakeGeolocation();
	const harness = createService({ geolocation: fake.geolocation });

	harness.service.reconcileAutoGpsWatch();
	fake.emit(position(1, 1));

	assert.deepEqual(harness.updates, [{ mile: 88, source: 'gps' }]);
	assert.equal(harness.currentMile, 88);
});
