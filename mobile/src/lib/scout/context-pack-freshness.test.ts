import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
	contextPackStatusAt,
	InMemoryContextPackStore,
	type PersistenceAdapter
} from './context-pack-store.ts';
import { cloneDefaultContextPack } from './default-pack.ts';
import type { ContextPackStatus } from './types.ts';

const EXPIRES_AT = Date.parse('2026-07-11T18:00:00.000Z');

function readyStatus(overrides: Partial<ContextPackStatus> = {}): ContextPackStatus {
	return {
		state: 'ready',
		label: 'Field pack ready',
		detail: 'Dad trail-ahead pack.',
		lastLoadedAt: '2026-07-11T12:00:00.000Z',
		validUntil: new Date(EXPIRES_AT).toISOString(),
		source: 'remote',
		...overrides
	};
}

test('field-pack status becomes stale exactly at expiry without a reload', () => {
	const status = readyStatus();

	assert.equal(contextPackStatusAt(status, EXPIRES_AT - 1).state, 'ready');
	assert.equal(contextPackStatusAt(status, EXPIRES_AT).state, 'stale');
	assert.equal(contextPackStatusAt(status, EXPIRES_AT + 1).state, 'stale');
	assert.match(contextPackStatusAt(status, EXPIRES_AT).detail, /expired/i);
});

test('ready or saved packs with missing or invalid expiry fail closed', () => {
	for (const validUntil of [null, 'not-an-iso-time']) {
		for (const state of ['ready', 'saved'] as const) {
			const derived = contextPackStatusAt(
				readyStatus({ state, validUntil, source: state === 'ready' ? 'remote' : 'saved' }),
				EXPIRES_AT
			);
			assert.equal(derived.state, 'stale');
			assert.equal(derived.label, 'Pack freshness unknown');
			assert.match(derived.detail, /no valid expiry time/i);
		}
	}
});

test('refreshing, fallback, stale, and error states keep their more specific truth', () => {
	for (const state of ['refreshing', 'fallback', 'stale', 'error'] as const) {
		const status = readyStatus({
			state,
			label: `${state} label`,
			detail: `${state} detail`,
			error: state === 'error' ? 'storage write failed' : undefined
		});
		assert.deepEqual(contextPackStatusAt(status, EXPIRES_AT + 1), status);
	}
});

test('store status can be evaluated at a new time without loading again', async () => {
	const futureExpiry = Date.now() + 60_000;
	const pack = cloneDefaultContextPack();
	pack.generatedAt = '2026-07-11T12:00:00.000Z';
	pack.validUntil = new Date(futureExpiry).toISOString();
	let value = JSON.stringify(pack);
	const adapter: PersistenceAdapter = {
		get: async () => value,
		set: async (_key, next) => {
			value = next;
		}
	};
	const store = new InMemoryContextPackStore({ adapter });
	await store.load();

	assert.equal(store.getStatus(futureExpiry - 1).state, 'saved');
	assert.equal(store.getStatus(futureExpiry).state, 'stale');
});
