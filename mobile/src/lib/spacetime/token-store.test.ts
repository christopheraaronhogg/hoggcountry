import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
	createSpacetimeTokenStore,
	type SpacetimeTokenHost
} from './token-store.ts';

function memoryStorage(initial: Record<string, string> = {}): Pick<Storage, 'getItem' | 'setItem'> {
	const values = new Map(Object.entries(initial));
	return {
		getItem(key: string) {
			return values.get(key) ?? null;
		},
		setItem(key: string, value: string) {
			values.set(key, value);
		}
	};
}

function host(localStorage: Pick<Storage, 'getItem' | 'setItem'>, native = false): SpacetimeTokenHost {
	return {
		Capacitor: { isNativePlatform: () => native },
		localStorage
	};
}

function preferences(initial: Record<string, string> = {}) {
	const values = new Map(Object.entries(initial));
	return {
		setCalls: 0,
		async get({ key }: { key: string }) {
			return { value: values.get(key) ?? null };
		},
		async set({ key, value }: { key: string; value: string }) {
			this.setCalls++;
			values.set(key, value);
		},
		raw(key: string) {
			return values.get(key) ?? null;
		}
	};
}

test('spacetime token store reads and writes Preferences on native Capacitor', async () => {
	const local = memoryStorage();
	const native = preferences({ token: 'native-token' });
	const store = createSpacetimeTokenStore({
		key: 'token',
		getHost: () => host(local, true),
		createNativeAdapter: () => Promise.resolve(native)
	});

	assert.equal(await store.get(), 'native-token');
	await store.set('updated-token');

	assert.equal(await store.get(), 'updated-token');
	assert.equal(native.raw('token'), 'updated-token');
	assert.equal(local.getItem('token'), null);
});

test('spacetime token store uses localStorage on web', async () => {
	const local = memoryStorage({ token: 'web-token' });
	let nativeLoads = 0;
	const store = createSpacetimeTokenStore({
		key: 'token',
		getHost: () => host(local),
		createNativeAdapter: async () => {
			nativeLoads++;
			return preferences();
		}
	});

	assert.equal(await store.get(), 'web-token');
	await store.set('web-updated');

	assert.equal(await store.get(), 'web-updated');
	assert.equal(local.getItem('token'), 'web-updated');
	assert.equal(nativeLoads, 0);
});

test('spacetime token store adopts a localStorage token into Preferences once', async () => {
	const local = memoryStorage({ token: 'local-token' });
	const native = preferences();
	const store = createSpacetimeTokenStore({
		key: 'token',
		getHost: () => host(local, true),
		createNativeAdapter: () => Promise.resolve(native)
	});

	assert.equal(await store.get(), 'local-token');
	assert.equal(native.raw('token'), 'local-token');
	assert.equal(native.setCalls, 1);

	assert.equal(await store.get(), 'local-token');
	assert.equal(native.setCalls, 1);
	assert.equal(local.getItem('token'), 'local-token');
});

test('spacetime token store prefers Preferences when both stores have a token', async () => {
	const local = memoryStorage({ token: 'local-token' });
	const native = preferences({ token: 'native-token' });
	const store = createSpacetimeTokenStore({
		key: 'token',
		getHost: () => host(local, true),
		createNativeAdapter: () => Promise.resolve(native)
	});

	assert.equal(await store.get(), 'native-token');
	assert.equal(native.setCalls, 0);
	assert.equal(local.getItem('token'), 'local-token');
});
