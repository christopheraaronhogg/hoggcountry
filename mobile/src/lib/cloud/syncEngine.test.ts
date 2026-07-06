import assert from 'node:assert/strict';
import { afterEach, test } from 'node:test';

import type { ApiError } from './api.ts';
import { makeUpsert, type RemoteDoc } from './sync-outbox.ts';
import type { PersistenceAdapter } from '../mobile-persistence.ts';

const g = globalThis as Record<string, unknown>;
g.$state = <T>(v: T): T => v;
g.$effect = Object.assign((_fn: () => void) => {}, {
	root: (fn: () => void) => {
		fn();
		return () => {};
	},
	pre: (_fn: () => void) => {}
});
g.$derived = <T>(v: T): T => v;

const { SyncEngine } = await import('./sync-engine-core.svelte.ts');

const STORE_KEY = 'hc-sync-outbox-v1';
const NOW = '2026-07-06T12:00:00.000Z';

type SyncEngineInstance = InstanceType<typeof SyncEngine>;
type ApiOptions = { method?: string; token?: string | null; body?: unknown };
type ApiCall = { path: string; options?: ApiOptions };
type ApiResponder = unknown | ((call: ApiCall) => unknown | Promise<unknown>);
type AuthStatus = 'unknown' | 'signed-out' | 'signed-in';
type PushChangePayload = { client_updated_at: string; doc_type: string; doc_id: string };

interface FakeAuth {
	status: AuthStatus;
	readonly signedIn: boolean;
	token: string | null;
	deviceIdCalls: number;
	ensureDeviceRegisteredCalls: number;
	revalidateCalls: number;
	deviceId(): Promise<string>;
	ensureDeviceRegistered(): Promise<void>;
	revalidate(): Promise<void>;
}

interface PersistedOutboxSnapshot {
	pending: Record<string, unknown>;
	quarantined?: Record<string, unknown>;
	synced: Record<string, string>;
	lastBackupAt: string | null;
	cursor: string;
	serverClockOffsetMs?: number;
}

const engines: SyncEngineInstance[] = [];

afterEach(() => {
	for (const engine of engines.splice(0)) {
		engine.stopForTest();
	}
});

class MemoryPersistenceAdapter implements PersistenceAdapter {
	#values = new Map<string, string>();

	async get(key: string): Promise<string | null> {
		return this.#values.get(key) ?? null;
	}

	async set(key: string, value: string): Promise<void> {
		this.#values.set(key, value);
	}

	raw(key: string): string | null {
		return this.#values.get(key) ?? null;
	}
}

function createFakeAuth(
	status: AuthStatus = 'signed-in',
	revalidate?: (auth: FakeAuth) => void | Promise<void>
): FakeAuth {
	let auth: FakeAuth;
	auth = {
		status,
		token: status === 'signed-in' ? 'token-1' : null,
		deviceIdCalls: 0,
		ensureDeviceRegisteredCalls: 0,
		revalidateCalls: 0,
		get signedIn() {
			return this.status === 'signed-in';
		},
		async deviceId() {
			this.deviceIdCalls++;
			return 'device-1';
		},
		async ensureDeviceRegistered() {
			this.ensureDeviceRegisteredCalls++;
		},
		async revalidate() {
			auth.revalidateCalls++;
			await revalidate?.(auth);
		}
	};
	return auth;
}

function createFakeApi() {
	const queued = new Map<string, ApiResponder[]>();
	const repeated = new Map<string, ApiResponder>();
	const calls: ApiCall[] = [];

	async function api<T>(path: string, options?: ApiOptions): Promise<T> {
		const call = { path, options };
		calls.push(call);
		const queue = queued.get(path);
		const responder = queue?.length ? queue.shift() : repeated.get(path);
		if (responder === undefined) {
			throw apiError(500, 'missing_fake', `No fake response queued for ${path}`);
		}
		const value = typeof responder === 'function' ? await responder(call) : await responder;
		return value as T;
	}

	return {
		api,
		calls,
		queue(path: string, responder: ApiResponder) {
			const queue = queued.get(path) ?? [];
			queue.push(responder);
			queued.set(path, queue);
		},
		repeat(path: string, responder: ApiResponder) {
			repeated.set(path, responder);
		},
		callsFor(path: string): ApiCall[] {
			return calls.filter((call) => call.path === path);
		}
	};
}

async function createHarness(options: {
	auth?: FakeAuth;
	online?: boolean;
	storage?: MemoryPersistenceAdapter;
	api?: ReturnType<typeof createFakeApi>;
	fresh?: boolean;
	apply?: (doc: RemoteDoc, fresh: boolean) => boolean;
} = {}) {
	const auth = options.auth ?? createFakeAuth();
	const fakeApi = options.api ?? createFakeApi();
	const storage = options.storage ?? new MemoryPersistenceAdapter();
	let online = options.online ?? true;
	const applied: Array<{ doc: RemoteDoc; fresh: boolean }> = [];
	const engine = new SyncEngine({
		browser: true,
		api: fakeApi.api,
		auth,
		storage,
		isOnline: () => online,
		now: () => NOW
	});
	engines.push(engine);
	engine.setRestoreProvider({
		isFresh: () => options.fresh ?? false,
		apply: (doc, fresh) => {
			applied.push({ doc, fresh });
			return options.apply?.(doc, fresh) ?? true;
		}
	});
	await engine.hydrateForTest();
	engine.stopForTest();

	return {
		engine,
		auth,
		api: fakeApi,
		storage,
		applied,
		setOnline(value: boolean) {
			online = value;
		}
	};
}

function enqueuePending(
	engine: SyncEngineInstance,
	docType = 'profile',
	docId = 'me',
	content: unknown = { trailName: 'Dad' }
): void {
	engine.enqueue(docType, docId, content);
	engine.stopForTest();
}

function apiError(status: number, code = 'http_error', message = code, details?: unknown): ApiError {
	return { code, message, status, ...(details === undefined ? {} : { details }) };
}

function throwing(error: ApiError): ApiResponder {
	return () => {
		throw error;
	};
}

function pushAppliesAll(call: ApiCall) {
	const body = call.options?.body as {
		changes?: Array<{ doc_type: string; doc_id: string; etag: string }>;
	};
	return {
		applied: (body.changes ?? []).map((change) => ({
			doc_type: change.doc_type,
			doc_id: change.doc_id,
			etag: change.etag
		})),
		rejected: []
	};
}

function persistedOutbox(storage: MemoryPersistenceAdapter): PersistedOutboxSnapshot {
	const raw = storage.raw(STORE_KEY);
	assert.ok(raw, 'expected a persisted sync outbox snapshot');
	return JSON.parse(raw) as PersistedOutboxSnapshot;
}

function createDeferred<T>() {
	let resolve!: (value: T) => void;
	let reject!: (reason?: unknown) => void;
	const promise = new Promise<T>((res, rej) => {
		resolve = res;
		reject = rej;
	});
	return { promise, resolve, reject };
}

async function settleMicrotasks(): Promise<void> {
	await Promise.resolve();
	await Promise.resolve();
	await Promise.resolve();
}

async function withSilencedConsole(fn: () => Promise<void>): Promise<void> {
	const originalError = console.error;
	try {
		console.error = () => {};
		await fn();
	} finally {
		console.error = originalError;
	}
}

async function withCapturedConsoleWarn(fn: () => Promise<void>): Promise<string[]> {
	const originalWarn = console.warn;
	const warnings: string[] = [];
	try {
		console.warn = (message?: unknown) => {
			warnings.push(String(message));
		};
		await fn();
		return warnings;
	} finally {
		console.warn = originalWarn;
	}
}

async function withMockedDateNow<T>(
	initialNowMs: number,
	fn: (setNow: (nextNowMs: number) => void) => Promise<T>
): Promise<T> {
	const originalNow = Date.now;
	let nowMs = initialNowMs;
	Date.now = () => nowMs;
	try {
		return await fn((nextNowMs) => {
			nowMs = nextNowMs;
		});
	} finally {
		Date.now = originalNow;
	}
}

function withImmediateTimeouts(fn: () => void): void {
	const originalSetTimeout = globalThis.setTimeout;
	const originalClearTimeout = globalThis.clearTimeout;
	globalThis.setTimeout = ((handler: TimerHandler, _timeout?: number, ...args: unknown[]) => {
		if (typeof handler === 'function') handler(...args);
		return 0 as unknown as ReturnType<typeof setTimeout>;
	}) as unknown as typeof setTimeout;
	globalThis.clearTimeout = ((_id?: ReturnType<typeof setTimeout>) => {}) as typeof clearTimeout;
	try {
		fn();
	} finally {
		globalThis.setTimeout = originalSetTimeout;
		globalThis.clearTimeout = originalClearTimeout;
	}
}

async function withCapturedTimeouts(fn: () => Promise<void>): Promise<number[]> {
	const originalSetTimeout = globalThis.setTimeout;
	const originalClearTimeout = globalThis.clearTimeout;
	const delays: number[] = [];
	globalThis.setTimeout = ((_handler: TimerHandler, timeout?: number, ..._args: unknown[]) => {
		delays.push(Number(timeout ?? 0));
		return delays.length as unknown as ReturnType<typeof setTimeout>;
	}) as unknown as typeof setTimeout;
	globalThis.clearTimeout = ((_id?: ReturnType<typeof setTimeout>) => {}) as typeof clearTimeout;
	try {
		await fn();
		return delays;
	} finally {
		globalThis.setTimeout = originalSetTimeout;
		globalThis.clearTimeout = originalClearTimeout;
	}
}

test('syncEngine: restore gate blocks push when bootstrap fails', async () => {
	const h = await createHarness();
	h.api.repeat('/sync/bootstrap', throwing(apiError(500, 'server_error')));
	enqueuePending(h.engine);

	await withSilencedConsole(async () => {
		await h.engine.flushForTest();
		await settleMicrotasks();
	});

	assert.equal(h.api.callsFor('/sync/push').length, 0);
	assert.equal(h.engine.status, 'error');
});

test('syncEngine: restore success unlocks drain', async () => {
	const h = await createHarness();
	h.api.queue('/sync/bootstrap', { docs: [], cursor: '1' });
	h.api.queue('/sync/push', pushAppliesAll);
	enqueuePending(h.engine, 'position', 'me', { mile: 1507.2 });

	await h.engine.flushForTest();

	const pushCalls = h.api.callsFor('/sync/push');
	assert.equal(pushCalls.length, 1);
	const body = pushCalls[0].options?.body as { changes: unknown[] };
	assert.equal(body.changes.length, 1);
	assert.equal(h.engine.pendingCount, 0);
	assert.equal(h.engine.status, 'idle');
	assert.equal(h.engine.lastBackupAt, NOW);
});

test('syncEngine: server_time clock offset stamps later queued changes', async () => {
	const baseNowMs = Date.parse(NOW);
	await withMockedDateNow(baseNowMs, async (setNow) => {
		const warnings = await withCapturedConsoleWarn(async () => {
			const h = await createHarness();
			h.api.queue('/sync/bootstrap', {
				docs: [],
				cursor: '1',
				server_time: new Date(baseNowMs + 10 * 60_000).toISOString()
			});

			await h.engine.flushForTest();
			h.engine.stopForTest();

			setNow(baseNowMs + 1000);
			enqueuePending(h.engine, 'position', 'me', { mile: 1507.2 });
			h.api.queue('/sync/push', pushAppliesAll);

			await h.engine.flushForTest();

			const pushCalls = h.api.callsFor('/sync/push');
			assert.equal(pushCalls.length, 1);
			const body = pushCalls[0].options?.body as { changes: PushChangePayload[] };
			assert.equal(
				body.changes[0].client_updated_at,
				new Date(baseNowMs + 10 * 60_000 + 1000).toISOString()
			);
			assert.equal(h.engine.lastBackupAt, NOW);
		});

		assert.deepEqual(warnings, [
			'Cloud backup clock differs from server by 600 seconds; client_updated_at will use server time.'
		]);
	});
});

test('syncEngine: server clock offset survives a persistence round-trip', async () => {
	const baseNowMs = Date.parse(NOW);
	await withMockedDateNow(baseNowMs, async (setNow) => {
		const storage = new MemoryPersistenceAdapter();
		await withCapturedConsoleWarn(async () => {
			const h = await createHarness({ storage });
			h.api.queue('/sync/bootstrap', {
				docs: [],
				cursor: '1',
				server_time: new Date(baseNowMs + 10 * 60_000).toISOString()
			});

			await h.engine.flushForTest();
			h.engine.stopForTest();
		});

		let snapshot = persistedOutbox(storage);
		assert.equal(snapshot.serverClockOffsetMs, 10 * 60_000);

		const fresh = await createHarness({ auth: createFakeAuth('signed-out'), storage });
		setNow(baseNowMs + 2000);
		withImmediateTimeouts(() => {
			fresh.engine.enqueue('profile', 'me', { trailName: 'Clocked Dad' });
		});
		fresh.engine.stopForTest();

		snapshot = persistedOutbox(storage);
		const entry = snapshot.pending['profile:me'] as { clientUpdatedAt: string };
		assert.equal(entry.clientUpdatedAt, new Date(baseNowMs + 10 * 60_000 + 2000).toISOString());
	});
});

test('syncEngine: missing or garbage server_time keeps local clock stamps', async () => {
	const baseNowMs = Date.parse(NOW);
	for (const serverTime of [undefined, 'not-a-date']) {
		await withMockedDateNow(baseNowMs, async (setNow) => {
			const warnings = await withCapturedConsoleWarn(async () => {
				const h = await createHarness();
				h.api.queue('/sync/bootstrap', {
					docs: [],
					cursor: '1',
					server_time: serverTime
				});

				await h.engine.flushForTest();
				h.engine.stopForTest();

				setNow(baseNowMs + 3000);
				enqueuePending(h.engine, 'settings', String(serverTime ?? 'missing'), { units: 'miles' });
				h.api.queue('/sync/push', pushAppliesAll);

				await h.engine.flushForTest();

				const pushCalls = h.api.callsFor('/sync/push');
				assert.equal(pushCalls.length, 1);
				const body = pushCalls[0].options?.body as { changes: PushChangePayload[] };
				assert.equal(body.changes[0].client_updated_at, new Date(baseNowMs + 3000).toISOString());
				assert.equal(persistedOutbox(h.storage).serverClockOffsetMs, 0);
			});

			assert.deepEqual(warnings, []);
		});
	}
});

test('syncEngine: restore applies remote docs into the synced baseline', async () => {
	const remote: RemoteDoc = {
		doc_type: 'profile',
		doc_id: 'me',
		op: 'upsert',
		content: { trailName: 'Dad' },
		etag: 'remote-etag-1'
	};
	const h = await createHarness({ fresh: true });
	h.api.queue('/sync/bootstrap', { docs: [remote], cursor: '1' });

	await h.engine.flushForTest();

	assert.deepEqual(h.applied, [{ doc: remote, fresh: true }]);
	const snapshot = persistedOutbox(h.storage);
	assert.equal(snapshot.synced['profile:me'], 'remote-etag-1');
	assert.equal(snapshot.pending['profile:me'], undefined);
});

test('syncEngine: offline signed-in device keeps pending local', async () => {
	const h = await createHarness({ online: false });
	enqueuePending(h.engine);

	await h.engine.flushForTest();
	await settleMicrotasks();

	assert.equal(h.engine.status, 'offline');
	assert.equal(h.api.calls.length, 0);
});

test('syncEngine: bootstrap 401 requests auth revalidation without signing out', async () => {
	const h = await createHarness();
	h.api.repeat('/sync/bootstrap', throwing(apiError(401, 'unauthenticated')));
	enqueuePending(h.engine);

	await h.engine.flushForTest();
	await settleMicrotasks();

	assert.equal(h.engine.status, 'error');
	assert.equal(h.api.callsFor('/sync/push').length, 0);
	assert.equal(h.auth.status, 'signed-in');
	assert.equal(h.auth.signedIn, true);
	assert.ok(h.auth.revalidateCalls > 0);
	assert.equal(h.auth.ensureDeviceRegisteredCalls, 0);
});

test('syncEngine: push 401 marks backup error and requests auth revalidation', async () => {
	const h = await createHarness();
	h.api.queue('/sync/bootstrap', { docs: [], cursor: '1' });
	h.api.queue('/sync/push', throwing(apiError(401, 'unauthenticated')));
	enqueuePending(h.engine);

	await h.engine.flushForTest();

	assert.equal(h.engine.status, 'error');
	assert.equal(h.auth.status, 'signed-in');
	assert.equal(h.auth.signedIn, true);
	assert.equal(h.auth.revalidateCalls, 1);
});

test('syncEngine: signed-out auth revalidation stops retries and preserves pending outbox', async () => {
	const storage = new MemoryPersistenceAdapter();
	await storage.set(
		STORE_KEY,
		JSON.stringify({
			pending: {
				'profile:me': makeUpsert('profile', 'me', { trailName: 'Dad' }, NOW)
			},
			synced: {},
			lastBackupAt: null,
			cursor: '0'
		} satisfies PersistedOutboxSnapshot)
	);
	const auth = createFakeAuth('signed-in', (current) => {
		current.status = 'signed-out';
		current.token = null;
	});
	const h = await createHarness({ auth, storage });

	await h.auth.revalidate();
	h.engine.notifyAuthChangedForTest();
	await h.engine.flushForTest();
	await settleMicrotasks();

	assert.equal(h.auth.revalidateCalls, 1);
	assert.equal(h.engine.status, 'signed-out');
	assert.equal(h.api.calls.length, 0);
	assert.equal(h.engine.pendingCount, 1);
	const snapshot = persistedOutbox(h.storage);
	assert.equal(Object.keys(snapshot.pending).length, 1);
	assert.ok(snapshot.pending['profile:me']);
});

test('syncEngine: validation push error quarantines the rejected pending change', async () => {
	const h = await createHarness();
	h.api.queue('/sync/bootstrap', { docs: [], cursor: '1' });
	h.api.queue(
		'/sync/push',
		throwing(
			apiError(422, 'validation_failed', 'The given data was invalid.', {
				errors: { 'changes.0.content': ['The changes.0.content field is required.'] }
			})
		)
	);
	enqueuePending(h.engine, 'settings', 'me', { units: 'miles' });

	await withSilencedConsole(async () => {
		await h.engine.flushForTest();
	});
	h.engine.stopForTest();

	assert.equal(h.engine.status, 'error');
	assert.equal(h.engine.pendingCount, 0);
	assert.equal(h.engine.quarantinedCount, 1);
	const snapshot = persistedOutbox(h.storage);
	assert.equal(snapshot.pending['settings:me'], undefined);
	assert.ok(snapshot.quarantined?.['settings:me']);
});

test('syncEngine: out-of-range validation index backs off instead of hot-looping', async () => {
	const h = await createHarness();
	h.api.queue('/sync/bootstrap', { docs: [], cursor: '1' });
	h.api.queue(
		'/sync/push',
		throwing(
			apiError(422, 'validation_failed', 'The given data was invalid.', {
				errors: { 'changes.9.content': ['The changes.9.content field must be an array.'] }
			})
		)
	);
	enqueuePending(h.engine, 'settings', 'me', { units: 'miles' });

	let delays: number[] = [];
	await withSilencedConsole(async () => {
		delays = await withCapturedTimeouts(async () => {
			await h.engine.flushForTest();
			await settleMicrotasks();
		});
	});
	h.engine.stopForTest();

	assert.equal(h.engine.status, 'error');
	assert.equal(h.engine.pendingCount, 1);
	assert.equal(h.engine.quarantinedCount, 0);
	assert.equal(h.api.callsFor('/sync/push').length, 1);
	assert.equal(delays[delays.length - 1], 20_000);
});

test('syncEngine: indexed 422 quarantines one bad change and drains the rest', async () => {
	const h = await createHarness();
	h.api.queue('/sync/bootstrap', { docs: [], cursor: '1' });
	h.api.queue(
		'/sync/push',
		throwing(
			apiError(422, 'validation_failed', 'The given data was invalid.', {
				errors: { 'changes.1.content': ['The changes.1.content field must be an array.'] }
			})
		)
	);
	enqueuePending(h.engine, 'documents', 'one', { body: 'one' });
	enqueuePending(h.engine, 'documents', 'two', { body: 'two' });
	enqueuePending(h.engine, 'documents', 'three', { body: 'three' });

	await withSilencedConsole(async () => {
		await h.engine.flushForTest();
	});
	h.engine.stopForTest();

	assert.equal(h.engine.status, 'error');
	assert.equal(h.engine.pendingCount, 2);
	assert.equal(h.engine.quarantinedCount, 1);
	let snapshot = persistedOutbox(h.storage);
	assert.ok(snapshot.pending['documents:one']);
	assert.equal(snapshot.pending['documents:two'], undefined);
	assert.ok(snapshot.pending['documents:three']);
	assert.ok(snapshot.quarantined?.['documents:two']);

	h.api.queue('/sync/push', pushAppliesAll);
	await h.engine.flushForTest();
	h.engine.stopForTest();

	assert.equal(h.engine.status, 'idle');
	assert.equal(h.engine.pendingCount, 0);
	assert.equal(h.engine.quarantinedCount, 1);
	snapshot = persistedOutbox(h.storage);
	assert.equal(Object.keys(snapshot.pending).length, 0);
	assert.ok(snapshot.quarantined?.['documents:two']);
});

test('syncEngine: unparseable 422 bisects until a single bad change is quarantined', async () => {
	const h = await createHarness();
	h.api.queue('/sync/bootstrap', { docs: [], cursor: '1' });
	h.api.repeat('/sync/push', (call: ApiCall) => {
		const body = call.options?.body as {
			changes?: Array<{ doc_id: string }>;
		};
		if ((body.changes?.length ?? 0) === 1) {
			throw apiError(422, 'validation_failed', 'The given data was invalid.');
		}
		if ((body.changes?.length ?? 0) === 2) return pushAppliesAll(call);
		throw apiError(422, 'validation_failed', 'The given data was invalid.');
	});
	enqueuePending(h.engine, 'documents', 'one', { body: 'one' });
	enqueuePending(h.engine, 'documents', 'two', { body: 'two' });
	enqueuePending(h.engine, 'documents', 'three', { body: 'three' });

	await withSilencedConsole(async () => {
		for (let i = 0; i < 8; i++) {
			await h.engine.flushForTest();
			h.engine.stopForTest();
		}
	});

	assert.equal(h.engine.status, 'error');
	assert.equal(h.engine.pendingCount, 2);
	assert.equal(h.engine.quarantinedCount, 1);
	let snapshot = persistedOutbox(h.storage);
	assert.equal(snapshot.pending['documents:one'], undefined);
	assert.ok(snapshot.pending['documents:two']);
	assert.ok(snapshot.pending['documents:three']);
	assert.ok(snapshot.quarantined?.['documents:one']);

	await h.engine.flushForTest();
	h.engine.stopForTest();

	assert.equal(h.engine.status, 'idle');
	assert.equal(h.engine.pendingCount, 0);
	assert.equal(h.engine.quarantinedCount, 1);
	snapshot = persistedOutbox(h.storage);
	assert.equal(Object.keys(snapshot.pending).length, 0);
	assert.ok(snapshot.quarantined?.['documents:one']);
	const pushLengths = h.api.callsFor('/sync/push').map((call) => {
		const body = call.options?.body as { changes?: unknown[] };
		return body.changes?.length ?? 0;
	});
	assert.deepEqual(pushLengths, [3, 3, 3, 3, 3, 3, 3, 1, 2]);
});

test('syncEngine: applied newer copy clears an older quarantined copy', async () => {
	const storage = new MemoryPersistenceAdapter();
	await storage.set(
		STORE_KEY,
		JSON.stringify({
			pending: {
				'settings:me': makeUpsert('settings', 'me', { units: 'kilometers' }, `${NOW}-new`)
			},
			quarantined: {
				'settings:me': makeUpsert('settings', 'me', { units: 'miles' }, `${NOW}-old`)
			},
			synced: {},
			lastBackupAt: null,
			cursor: '0'
		} satisfies PersistedOutboxSnapshot)
	);
	const h = await createHarness({ storage });
	h.api.queue('/sync/bootstrap', { docs: [], cursor: '1' });
	h.api.queue('/sync/push', pushAppliesAll);

	await h.engine.flushForTest();
	h.engine.stopForTest();

	assert.equal(h.engine.status, 'idle');
	assert.equal(h.engine.pendingCount, 0);
	assert.equal(h.engine.quarantinedCount, 0);
	const snapshot = persistedOutbox(h.storage);
	assert.equal(snapshot.pending['settings:me'], undefined);
	assert.equal(snapshot.quarantined?.['settings:me'], undefined);
});

test('syncEngine: unknown_device push response re-registers device', async () => {
	const h = await createHarness();
	h.api.queue('/sync/bootstrap', { docs: [], cursor: '1' });
	h.api.queue('/sync/push', throwing(apiError(422, 'unknown_device')));
	enqueuePending(h.engine);

	await h.engine.flushForTest();

	assert.equal(h.engine.status, 'error');
	assert.equal(h.auth.ensureDeviceRegisteredCalls, 1);
});

test('syncEngine: auth epoch discard ignores late bootstrap from signed-out session', async () => {
	const remote: RemoteDoc = {
		doc_type: 'profile',
		doc_id: 'me',
		op: 'upsert',
		content: { trailName: 'Cloud Dad' },
		etag: 'late-etag'
	};
	const bootstrap = createDeferred<{ docs: RemoteDoc[]; cursor: string }>();
	const h = await createHarness({ fresh: true });
	h.api.queue('/sync/bootstrap', () => bootstrap.promise);
	enqueuePending(h.engine);

	const flushing = h.engine.flushForTest();
	await settleMicrotasks();
	assert.equal(h.api.callsFor('/sync/bootstrap').length, 1);

	h.auth.status = 'signed-out';
	h.auth.token = null;
	h.engine.notifyAuthChangedForTest();
	bootstrap.resolve({ docs: [remote], cursor: '1' });
	await flushing;
	await settleMicrotasks();

	assert.equal(h.applied.length, 0);
	assert.equal(h.api.callsFor('/sync/push').length, 0);
});

test('syncEngine: persistence round-trip restores pending docs', async () => {
	const storage = new MemoryPersistenceAdapter();
	const h = await createHarness({ auth: createFakeAuth('signed-out'), storage });

	withImmediateTimeouts(() => {
		h.engine.enqueue('profile', 'me', { trailName: 'Dad' });
		h.engine.enqueue('settings', 'me', { units: 'miles' });
	});
	h.engine.stopForTest();

	const snapshot = persistedOutbox(storage);
	assert.equal(Object.keys(snapshot.pending).length, 2);

	const fresh = await createHarness({ auth: createFakeAuth('signed-out'), storage });
	assert.equal(fresh.engine.pendingCount, 2);
});
