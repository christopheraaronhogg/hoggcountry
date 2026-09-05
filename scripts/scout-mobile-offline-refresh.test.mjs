import assert from 'node:assert/strict';
import test from 'node:test';

import { InMemoryContextPackStore } from '../mobile/src/lib/scout/context-pack-store.ts';
import { cloneDefaultContextPack } from '../mobile/src/lib/scout/default-pack.ts';

// Offline refresh smoke harness for the Dad-ready mobile pilot.
//
// Proves the core promise of mobile/src/lib/scout/context-pack-store.ts:
//   1. A live /api/v1/public/scout/field-pack envelope normalizes into a ContextPack.
//   2. The normalized pack persists through the Capacitor-style adapter.
//   3. A new session reloads the cached pack from the adapter.
//   4. A failed/offline refresh keeps serving the cached pack and marks status
//      ('error' when fresh, 'stale' when validUntil has passed) without dropping
//      the honest caveats / source receipts Dad relies on.
//
// The remote envelope mirrors apps/openclaw-web/src/lib/server/public-mobile-field-pack.ts
// (data.context_pack + meta.valid_until/source_receipts + data.pilot_notice).

const STORAGE_KEY = 'hoggcountry:scout:context-pack:v1';

/** In-memory stand-in for the Capacitor Preferences persistence adapter. */
class MockAdapter {
	constructor() {
		this.store = new Map();
		this.failOnSet = false;
		this.writes = 0;
	}

	async get(key) {
		return this.store.has(key) ? this.store.get(key) : null;
	}

	async set(key, value) {
		if (this.failOnSet) throw new Error('simulated persistence failure');
		this.writes += 1;
		this.store.set(key, value);
	}
}

function jsonResponse(body, { ok = true, status = 200 } = {}) {
	return {
		ok,
		status,
		async json() {
			return body;
		}
	};
}

function makeFetcher(response) {
	return async (_endpoint, _init) => {
		if (response instanceof Error) throw response;
		return response;
	};
}

/**
 * Build a realistic public field-pack envelope. The context_pack carries honest
 * candidate caveats; validUntil / receipts / pilot notice live in meta + data,
 * exactly like the production endpoint.
 */
function buildRemoteEnvelope({ currentMile = 600.4, generatedAt, validUntil } = {}) {
	const now = generatedAt ?? new Date().toISOString();
	const expiry = validUntil ?? new Date(Date.parse(now) + 6 * 60 * 60 * 1000).toISOString();

	return {
		data: {
			context_pack: {
				frame: {
					totalMiles: 2197.9,
					startMile: 0,
					endMile: 2197.9,
					source: 'AWOL 2026 reference length + Hogg Country Dad pilot pack + Scout AT open-reference slice'
				},
				hiker: {
					trailName: 'Hogg',
					currentMile,
					direction: 'NOBO',
					dayNumber: 42,
					targetMilesToday: 13.8
				},
				water: [
					{
						name: 'Unnamed mapped stream',
						mile: 603.1,
						reliability: 'thin',
						note: 'Mapped water candidate from public hydrography; reliability and potability unknown. Confirm current flow before relying on it.'
					}
				],
				shelters: [
					{
						name: 'Jenny Knob Shelter',
						mile: 605.7,
						note: 'Open-data shelter candidate; verify current status, capacity, water, fees, and local rules.'
					}
				],
				towns: [
					{
						name: 'Bland, VA',
						mile: 596.0,
						access: 'Open-data settlement candidate (Virginia corridor)',
						servicesNote: 'Services are not confirmed from guidebook/current hiker reports in this pack; verify grocery, lodging, shuttle, and hours before planning around it.'
					}
				],
				guideExcerpts: [
					{
						id: 'pack-water-on-ridges',
						title: 'Pack water before ridge sections',
						body: 'Top off at the last reliable source before climbing onto a long ridge.',
						tags: ['water', 'planning', 'ridge'],
						citation: 'Hogg Country Field Guide, Section: Water Discipline'
					}
				],
				loadout: [
					{ name: 'Durston X-Mid Pro 2', category: 'shelter', weightOz: 19.6, carried: true }
				],
				weather: {
					mile: currentMile,
					summary: 'Cached pilot weather: cold ridge wind with dry afternoon skies',
					highF: 46,
					lowF: 28,
					windMph: 17,
					riskNote: 'Weather in this pack is cached pilot context; refresh before exposed terrain.',
					generatedAt: '2026-06-16T00:00:00.000Z'
				},
				downloadedRegions: [
					`Dad trail-ahead ${currentMile.toFixed(1)}-${(currentMile + 36).toFixed(1)}`,
					'AT open-reference candidates (Virginia)'
				],
				generatedAt: now
			},
			dad: null,
			at_reference: null,
			pilot_notice:
				'Dad public pilot summary was not reachable; app is using the cached pilot anchor. Trail-ahead water, shelter, and town entries are generated from open-reference candidates; confirm current water, services, rules, and access before relying on them.'
		},
		meta: {
			pack_version: 1,
			generated_at: now,
			valid_until: expiry,
			source_receipts: [
				{
					id: 'trail-pack:open-reference-slice',
					title: 'Scout AT open-reference trail-ahead slice',
					kind: 'trail-pack',
					citation: 'Scout full-trail open-reference pack, anchor-calibrated to AWOL 2026 frame'
				},
				{
					id: 'derived:generated-mile-caveat',
					title: 'Generated mile caveat',
					kind: 'derived',
					citation:
						'Open-reference landmark miles are anchor-calibrated estimates; confirm exact guidebook mileage before safety-critical decisions.'
				}
			],
			fallback_reason: 'dad-pilot-unavailable',
			request_id: 'smoke-test-1'
		},
		error: null
	};
}

function caveatTextOf(pack) {
	return [
		pack.pilotNotice ?? '',
		...pack.water.map((w) => w.note ?? ''),
		...pack.shelters.map((s) => s.note ?? ''),
		...pack.towns.map((t) => t.servicesNote ?? '')
	]
		.join(' ')
		.toLowerCase();
}

test('live envelope normalizes into a ContextPack and persists through the adapter', async () => {
	const adapter = new MockAdapter();
	const store = new InMemoryContextPackStore({ adapter, storageKey: STORAGE_KEY });
	const envelope = buildRemoteEnvelope({ currentMile: 600.4 });

	const pack = await store.refreshFromEndpoint('https://example.test/field-pack', makeFetcher(jsonResponse(envelope)));

	// Normalized into the mobile ContextPack contract.
	assert.equal(pack.frame.totalMiles, 2197.9);
	assert.equal(pack.hiker.currentMile, 600.4);
	assert.ok(Array.isArray(pack.water) && pack.water.length > 0);

	// meta + pilot_notice merged onto the pack.
	assert.equal(pack.validUntil, envelope.meta.valid_until);
	assert.equal(pack.sourceReceipts?.length, 2);
	assert.equal(pack.pilotNotice, envelope.data.pilot_notice);

	// Status reflects a fresh remote pack.
	const status = store.getStatus();
	assert.equal(status.state, 'ready');
	assert.equal(status.source, 'remote');
	assert.equal(status.validUntil, envelope.meta.valid_until);
	assert.deepEqual(store.getPersistenceResult(), {
		state: 'persisted',
		verified: true,
		error: null
	});

	// Persisted to the adapter under the expected key.
	assert.equal(adapter.writes, 1);
	const persisted = JSON.parse(adapter.store.get(STORAGE_KEY));
	assert.equal(persisted.hiker.currentMile, 600.4);
	assert.equal(persisted.validUntil, envelope.meta.valid_until);

	// Honest caveats survive normalization.
	const caveats = caveatTextOf(pack);
	assert.ok(caveats.includes('confirm current flow'), 'water caveat preserved');
	assert.ok(caveats.includes('verify current status'), 'shelter caveat preserved');
	assert.ok(caveats.includes('verify grocery'), 'town caveat preserved');
	assert.ok(pack.sourceReceipts.some((r) => r.id === 'derived:generated-mile-caveat'), 'mile caveat receipt preserved');
});

test('a fresh session reloads the cached pack from the adapter', async () => {
	const adapter = new MockAdapter();
	const writer = new InMemoryContextPackStore({ adapter, storageKey: STORAGE_KEY });
	const envelope = buildRemoteEnvelope({ currentMile: 611.2 });
	await writer.refreshFromEndpoint('https://example.test/field-pack', makeFetcher(jsonResponse(envelope)));

	// New store instance (simulates app relaunch) sharing the same adapter.
	const reader = new InMemoryContextPackStore({ adapter, storageKey: STORAGE_KEY });
	const loaded = await reader.load();

	assert.equal(loaded.hiker.currentMile, 611.2);
	assert.equal(loaded.pilotNotice, envelope.data.pilot_notice);
	assert.equal(loaded.sourceReceipts?.length, 2);

	const status = reader.getStatus();
	assert.equal(status.state, 'saved');
	assert.equal(status.source, 'saved');
	assert.equal(status.lastLoadedAt, loaded.generatedAt);
});

test('offline refresh on a still-valid pack keeps the cache and marks an error status', async () => {
	const adapter = new MockAdapter();
	const seed = new InMemoryContextPackStore({ adapter, storageKey: STORAGE_KEY });
	const envelope = buildRemoteEnvelope({ currentMile: 620.0 }); // validUntil 6h in the future
	await seed.refreshFromEndpoint('https://example.test/field-pack', makeFetcher(jsonResponse(envelope)));

	// Relaunch, load cache, then attempt a refresh while offline (fetch throws).
	const store = new InMemoryContextPackStore({ adapter, storageKey: STORAGE_KEY });
	await store.load();
	const beforeWrites = adapter.writes;

	const pack = await store.refreshFromEndpoint(
		'https://example.test/field-pack',
		makeFetcher(new TypeError('Failed to fetch'))
	);

	// Cached pack is still served, unchanged.
	assert.equal(pack.hiker.currentMile, 620.0);
	assert.equal(pack.pilotNotice, envelope.data.pilot_notice);

	const status = store.getStatus();
	assert.equal(status.state, 'error');
	assert.equal(status.label, 'Cached field pack');
	assert.ok(status.error && status.error.includes('Failed to fetch'));
	assert.ok(status.detail.includes('keep using the saved pack'));

	// No new persistence happened on failure; cache is intact.
	assert.equal(adapter.writes, beforeWrites);
	const persisted = JSON.parse(adapter.store.get(STORAGE_KEY));
	assert.equal(persisted.hiker.currentMile, 620.0);

	// Caveats still present on the served pack.
	assert.ok(caveatTextOf(pack).includes('confirm current'), 'caveats retained after failed refresh');
});

test('offline refresh on an expired pack marks it stale, not just errored', async () => {
	const expiredEnvelope = buildRemoteEnvelope({
		currentMile: 590.0,
		generatedAt: '2026-05-01T00:00:00.000Z',
		validUntil: '2026-05-01T06:00:00.000Z'
	});
	// Seed the cache directly with an expired pack.
	const cachedPack = {
		...cloneDefaultContextPack(),
		hiker: { ...cloneDefaultContextPack().hiker, currentMile: 590.0 },
		validUntil: '2026-05-01T06:00:00.000Z',
		generatedAt: '2026-05-01T00:00:00.000Z',
		pilotNotice: expiredEnvelope.data.pilot_notice
	};
	const adapter = new MockAdapter();
	adapter.store.set(STORAGE_KEY, JSON.stringify(cachedPack));

	const store = new InMemoryContextPackStore({ adapter, storageKey: STORAGE_KEY });
	await store.load();

	const pack = await store.refreshFromEndpoint(
		'https://example.test/field-pack',
		makeFetcher(new TypeError('Network request failed'))
	);

	assert.equal(pack.hiker.currentMile, 590.0);
	const status = store.getStatus();
	assert.equal(status.state, 'stale');
	assert.equal(status.label, 'Stale field pack');
	assert.ok(status.error);
});

test('a non-ok HTTP response preserves the cached pack and reports the status code', async () => {
	const adapter = new MockAdapter();
	const seed = new InMemoryContextPackStore({ adapter, storageKey: STORAGE_KEY });
	await seed.refreshFromEndpoint(
		'https://example.test/field-pack',
		makeFetcher(jsonResponse(buildRemoteEnvelope({ currentMile: 601.0 })))
	);

	const store = new InMemoryContextPackStore({ adapter, storageKey: STORAGE_KEY });
	await store.load();

	const pack = await store.refreshFromEndpoint(
		'https://example.test/field-pack',
		makeFetcher(jsonResponse({ error: 'upstream down' }, { ok: false, status: 503 }))
	);

	assert.equal(pack.hiker.currentMile, 601.0);
	const status = store.getStatus();
	assert.equal(status.state, 'error');
	assert.ok(status.error && status.error.includes('503'));
});

test('a malformed remote payload is rejected and the cached pack is preserved', async () => {
	const adapter = new MockAdapter();
	const seed = new InMemoryContextPackStore({ adapter, storageKey: STORAGE_KEY });
	await seed.refreshFromEndpoint(
		'https://example.test/field-pack',
		makeFetcher(jsonResponse(buildRemoteEnvelope({ currentMile: 602.0 })))
	);

	const store = new InMemoryContextPackStore({ adapter, storageKey: STORAGE_KEY });
	await store.load();

	// context_pack missing required arrays - must not poison the cache.
	const pack = await store.refreshFromEndpoint(
		'https://example.test/field-pack',
		makeFetcher(jsonResponse({ data: { context_pack: { frame: {}, hiker: {} } }, meta: {}, error: null }))
	);

	assert.equal(pack.hiker.currentMile, 602.0);
	const status = store.getStatus();
	assert.equal(status.state, 'error');
	assert.ok(status.error && status.error.includes('ContextPack contract'));
});

test('a persistence write failure keeps the pack session-only and never reports offline-ready', async () => {
	const adapter = new MockAdapter();
	adapter.failOnSet = true;
	const store = new InMemoryContextPackStore({ adapter, storageKey: STORAGE_KEY });

	const pack = await store.refreshFromEndpoint(
		'https://example.test/field-pack',
		makeFetcher(jsonResponse(buildRemoteEnvelope({ currentMile: 615.5 })))
	);

	// The refresh succeeds in memory even though the adapter.set threw.
	assert.equal(pack.hiker.currentMile, 615.5);
	const status = store.getStatus();
	assert.equal(status.state, 'error');
	assert.equal(status.label, 'Field pack loaded for this session');
	assert.equal(status.source, 'remote');
	assert.match(status.detail, /not saved for offline use/i);
	assert.match(status.error, /simulated persistence failure/i);
	assert.deepEqual(store.getPersistenceResult(), {
		state: 'loaded-only',
		verified: false,
		error: 'simulated persistence failure'
	});
	assert.equal(adapter.store.has(STORAGE_KEY), false);
});

test('read-after-write verification preserves the last known-good cached pack', async () => {
	const previousPack = {
		...cloneDefaultContextPack(),
		hiker: { ...cloneDefaultContextPack().hiker, currentMile: 588.2 }
	};
	const previousRaw = JSON.stringify(previousPack);
	const adapter = {
		value: previousRaw,
		writes: 0,
		async get() {
			return this.value;
		},
		async set(_key, _value) {
			this.writes += 1;
			// Simulate a storage layer that resolves without committing the write.
		}
	};
	const store = new InMemoryContextPackStore({ adapter, storageKey: STORAGE_KEY });
	await store.load();

	const current = await store.refreshFromEndpoint(
		'https://example.test/field-pack',
		makeFetcher(jsonResponse(buildRemoteEnvelope({ currentMile: 633.7 })))
	);

	assert.equal(current.hiker.currentMile, 633.7, 'fresh data remains usable this session');
	assert.equal(adapter.value, previousRaw, 'verified previous cache remains intact');
	assert.equal(store.getStatus().state, 'error');
	assert.match(store.getStatus().detail, /previously saved pack is still available/i);
	assert.deepEqual(store.getPersistenceResult(), {
		state: 'loaded-only',
		verified: false,
		error: 'Field pack storage verification failed.'
	});

	const relaunched = new InMemoryContextPackStore({ adapter, storageKey: STORAGE_KEY });
	assert.equal((await relaunched.load()).hiker.currentMile, 588.2);
});
