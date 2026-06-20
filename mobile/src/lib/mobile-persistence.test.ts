import assert from 'node:assert/strict';
import { test } from 'node:test';

import { createMobilePersistenceAdapter, type MobilePersistenceHost } from './mobile-persistence.ts';
import type { PersistenceAdapter } from './scout/context-pack-store.ts';

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

function host(
	localStorage: Pick<Storage, 'getItem' | 'setItem'>,
	native = false
): MobilePersistenceHost {
	return {
		Capacitor: { isNativePlatform: () => native },
		localStorage
	};
}

function nativeAdapter(initial: Record<string, string> = {}): PersistenceAdapter {
	const storage = memoryStorage(initial);
	return {
		get: (key: string) => Promise.resolve(storage.getItem(key)),
		set: (key: string, value: string) => Promise.resolve(storage.setItem(key, value))
	};
}

test('mobile persistence uses localStorage directly outside native Capacitor', async () => {
	const localStorage = memoryStorage({ trail: 'local' });
	let nativeLoads = 0;
	const adapter = createMobilePersistenceAdapter({
		getHost: () => host(localStorage),
		createNativeAdapter: async () => {
			nativeLoads += 1;
			return nativeAdapter();
		}
	});

	assert.equal(await adapter.get('trail'), 'local');
	await adapter.set('trail', 'updated');
	assert.equal(await adapter.get('trail'), 'updated');
	assert.equal(nativeLoads, 0);
});

test('mobile persistence prefers native values and mirrors writes locally', async () => {
	const localStorage = memoryStorage({ trail: 'local' });
	const native = nativeAdapter({ trail: 'native' });
	const adapter = createMobilePersistenceAdapter({
		getHost: () => host(localStorage, true),
		createNativeAdapter: () => Promise.resolve(native)
	});

	assert.equal(await adapter.get('trail'), 'native');
	await adapter.set('trail', 'synced');
	assert.equal(await native.get('trail'), 'synced');
	assert.equal(localStorage.getItem('trail'), 'synced');
});

test('mobile persistence falls back to the local mirror when native is empty', async () => {
	const localStorage = memoryStorage({ trail: 'local' });
	const adapter = createMobilePersistenceAdapter({
		getHost: () => host(localStorage, true),
		createNativeAdapter: () => Promise.resolve(nativeAdapter())
	});

	assert.equal(await adapter.get('trail'), 'local');
});

test('mobile persistence keeps local writes when native writes fail', async () => {
	const localStorage = memoryStorage();
	const warnings: string[] = [];
	const adapter = createMobilePersistenceAdapter({
		getHost: () => host(localStorage, true),
		createNativeAdapter: () =>
			Promise.resolve({
				get: () => Promise.resolve(null),
				set: () => Promise.reject(new Error('native unavailable'))
			}),
		warn: (message) => warnings.push(message)
	});

	await adapter.set('trail', 'queued');

	assert.equal(localStorage.getItem('trail'), 'queued');
	assert.deepEqual(warnings, ['Capacitor Preferences write failed; keeping localStorage mirror only.']);
});
