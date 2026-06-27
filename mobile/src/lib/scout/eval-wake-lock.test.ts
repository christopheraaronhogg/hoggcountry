import assert from 'node:assert/strict';
import { test } from 'node:test';

import { createScoutEvalWakeLock } from './eval-wake-lock.ts';

type Listener = () => void;

class FakeDocument {
	visibilityState: DocumentVisibilityState = 'visible';
	#listeners = new Map<string, Set<Listener>>();

	addEventListener(type: string, listener: Listener) {
		const listeners = this.#listeners.get(type) ?? new Set<Listener>();
		listeners.add(listener);
		this.#listeners.set(type, listeners);
	}

	removeEventListener(type: string, listener: Listener) {
		this.#listeners.get(type)?.delete(listener);
	}

	emit(type: string) {
		for (const listener of this.#listeners.get(type) ?? []) listener();
	}

	listenerCount(type: string): number {
		return this.#listeners.get(type)?.size ?? 0;
	}
}

class FakeSentinel {
	releases = 0;
	#listeners = new Set<Listener>();

	addEventListener(_type: 'release', listener: Listener) {
		this.#listeners.add(listener);
	}

	removeEventListener(_type: 'release', listener: Listener) {
		this.#listeners.delete(listener);
	}

	async release() {
		this.releases += 1;
	}

	emitRelease() {
		for (const listener of this.#listeners) listener();
	}
}

test('Scout Eval Lab wake lock requests a screen lock and releases it after the run', async () => {
	const doc = new FakeDocument();
	const sentinels: FakeSentinel[] = [];
	const lock = createScoutEvalWakeLock({
		document: doc,
		navigator: {
			wakeLock: {
				async request(type) {
					assert.equal(type, 'screen');
					const sentinel = new FakeSentinel();
					sentinels.push(sentinel);
					return sentinel;
				}
			}
		}
	});

	assert.equal(await lock.request(), true);
	assert.equal(lock.hasLock(), true);
	assert.equal(sentinels.length, 1);
	assert.equal(doc.listenerCount('visibilitychange'), 1);

	await lock.release();

	assert.equal(lock.hasLock(), false);
	assert.equal(sentinels[0].releases, 1);
	assert.equal(doc.listenerCount('visibilitychange'), 0);
});

test('Scout Eval Lab wake lock degrades quietly when unsupported', async () => {
	const errors: unknown[] = [];
	const lock = createScoutEvalWakeLock({
		document: new FakeDocument(),
		navigator: {},
		onError: (error) => errors.push(error)
	});

	assert.equal(await lock.request(), false);
	assert.equal(lock.hasLock(), false);
	assert.deepEqual(errors, []);
});

test('Scout Eval Lab wake lock reacquires after a visible document loses its lock', async () => {
	const doc = new FakeDocument();
	const sentinels: FakeSentinel[] = [];
	const lock = createScoutEvalWakeLock({
		document: doc,
		navigator: {
			wakeLock: {
				async request() {
					const sentinel = new FakeSentinel();
					sentinels.push(sentinel);
					return sentinel;
				}
			}
		}
	});

	await lock.request();
	sentinels[0].emitRelease();
	await Promise.resolve();

	assert.equal(lock.hasLock(), true);
	assert.equal(sentinels.length, 2);

	await lock.release();
	assert.equal(sentinels[1].releases, 1);
});

test('Scout Eval Lab wake lock does not reacquire after dispose', async () => {
	const doc = new FakeDocument();
	let requests = 0;
	const lock = createScoutEvalWakeLock({
		document: doc,
		navigator: {
			wakeLock: {
				async request() {
					requests += 1;
					return new FakeSentinel();
				}
			}
		}
	});

	await lock.request();
	lock.dispose();
	doc.emit('visibilitychange');
	await Promise.resolve();

	assert.equal(requests, 1);
	assert.equal(doc.listenerCount('visibilitychange'), 0);
});
