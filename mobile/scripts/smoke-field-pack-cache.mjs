import assert from 'node:assert/strict';

import {
	InMemoryContextPackStore,
	createCapacitorPreferencesAdapter
} from '../src/lib/scout/context-pack-store.ts';
import { cloneDefaultContextPack } from '../src/lib/scout/default-pack.ts';

const STORAGE_KEY = 'hoggcountry:test:field-pack-cache';

function memoryPreferences() {
	const values = new Map();

	return {
		values,
		async get({ key }) {
			return { value: values.get(key) ?? null };
		},
		async set({ key, value }) {
			values.set(key, value);
		}
	};
}

function response(status, body) {
	return {
		ok: status >= 200 && status < 300,
		status,
		async json() {
			return body;
		}
	};
}

function remoteEnvelope() {
	const pack = cloneDefaultContextPack();
	// Relative to "now" so the smoke isn't a calendar time bomb: a freshly fetched
	// pack is recent and not yet expired, which is what "ready" (not "stale") means.
	const now = Date.now();
	const generatedAt = new Date(now - 5 * 60 * 60 * 1000).toISOString();
	const validUntil = new Date(now + 24 * 60 * 60 * 1000).toISOString();

	return {
		ok: true,
		data: {
			context_pack: {
				...pack,
				generatedAt,
				validUntil,
				hiker: {
					...pack.hiker,
					trailName: 'Dad',
					currentMile: 1438.2,
					dayNumber: 112
				},
				water: [
					{
						name: 'Mapped stream crossing',
						mile: 1440.4,
						reliability: 'thin',
						note: 'Open-reference candidate. Confirm current flow before relying on it.'
					}
				],
				shelters: [
					{
						name: 'Ten Mile River Shelter',
						mile: 1448.1,
						note: 'Open-reference shelter candidate.'
					}
				],
				towns: [
					{
						name: 'Kent',
						mile: 1456.6,
						access: 'road walk / shuttle likely',
						servicesNote: 'Verify current hours and lodging before committing.'
					}
				],
				downloadedRegions: ['AT NY/CT pilot window'],
				sourceReceipts: [
					{
						id: 'open-reference:test',
						title: 'AT open-reference map pack',
						kind: 'trail-pack',
						generatedAt,
						miles: { from: 1438.2, to: 1460 }
					}
				],
				pilotNotice: 'Smoke-test pilot pack. Confirm volatile water and town logistics.'
			},
			pilot_notice: 'Smoke-test pilot pack. Confirm volatile water and town logistics.'
		},
		meta: {
			valid_until: validUntil,
			source_receipts: [
				{
					id: 'meta:test',
					title: 'Smoke envelope receipt',
					kind: 'trail-pack',
					generatedAt
				}
			]
		}
	};
}

const preferences = memoryPreferences();
const adapter = createCapacitorPreferencesAdapter(preferences);
const endpoint = 'https://example.test/api/v1/public/scout/field-pack';

const store = new InMemoryContextPackStore({ adapter, storageKey: STORAGE_KEY });
await store.load();

const refreshed = await store.refreshFromEndpoint(endpoint, async () => response(200, remoteEnvelope()));
assert.equal(refreshed.hiker.currentMile, 1438.2);
assert.equal(refreshed.water[0]?.reliability, 'thin');
assert.equal(refreshed.downloadedRegions[0], 'AT NY/CT pilot window');
assert.equal(refreshed.sourceReceipts?.[0]?.id, 'meta:test');
assert.equal(store.getStatus().state, 'ready');
assert.equal(store.getStatus().source, 'remote');
assert.ok(preferences.values.get(STORAGE_KEY), 'field pack should be persisted after a remote refresh');

const restoredStore = new InMemoryContextPackStore({ adapter, storageKey: STORAGE_KEY });
const restored = await restoredStore.load();
assert.equal(restored.hiker.currentMile, 1438.2);
assert.equal(restoredStore.getStatus().state, 'saved');
assert.equal(restoredStore.getStatus().source, 'saved');

const fallbackAfterFailure = await restoredStore.refreshFromEndpoint(endpoint, async () =>
	response(503, { error: 'service unavailable' })
);
assert.equal(fallbackAfterFailure.hiker.currentMile, 1438.2);
assert.equal(restoredStore.getStatus().state, 'error');
assert.equal(restoredStore.getStatus().label, 'Cached field pack');
assert.match(restoredStore.getStatus().detail, /failed \(503\)|saved pack/i);

console.log('field-pack cache smoke passed');
