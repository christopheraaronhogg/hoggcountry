import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';
import { runInNewContext } from 'node:vm';
import ts from 'typescript';

const ORIGIN = 'https://mobile.test';
const CURRENT_CACHE = 'hoggcountry-test-version';
const source = await readFile(new URL('../service-worker.ts', import.meta.url), 'utf8');

function requestPath(request: RequestInfo | URL): string {
	if (typeof request === 'string') return new URL(request, ORIGIN).pathname;
	if (request instanceof URL) return request.pathname;
	return new URL(request.url, ORIGIN).pathname;
}

class MemoryCache {
	readonly entries = new Map<string, Response>();

	constructor(private readonly failures: Set<string>) {}

	async add(request: RequestInfo | URL): Promise<void> {
		const path = requestPath(request);
		if (this.failures.has(path)) throw new Error(`failed to fetch ${path}`);
		this.entries.set(path, new Response(`network:${path}`, { status: 200 }));
	}

	async addAll(requests: readonly (RequestInfo | URL)[]): Promise<void> {
		for (const request of requests) {
			const path = requestPath(request);
			if (this.failures.has(path)) throw new Error(`failed to fetch ${path}`);
		}
		for (const request of requests) await this.add(request);
	}

	async match(request: RequestInfo | URL): Promise<Response | undefined> {
		return this.entries.get(requestPath(request))?.clone();
	}

	async put(request: RequestInfo | URL, response: Response): Promise<void> {
		this.entries.set(requestPath(request), response.clone());
	}
}

type ExtendableEventLike = { waitUntil(work: Promise<unknown>): void };
type WorkerListener = (event: ExtendableEventLike) => void;

function createHarness() {
	const failures = new Set(['/optional-missing.json']);
	const cacheMap = new Map<string, MemoryCache>();
	const listeners = new Map<string, WorkerListener>();
	const state = { skipWaitingCalls: 0 };

	const previous = new MemoryCache(failures);
	previous.entries.set(
		'/optional-missing.json',
		new Response('previous-known-good', { status: 200 })
	);
	cacheMap.set('hoggcountry-previous-version', previous);
	cacheMap.set('another-app-cache', new MemoryCache(new Set()));

	const cacheStorage = {
		async open(name: string) {
			let cache = cacheMap.get(name);
			if (!cache) {
				cache = new MemoryCache(failures);
				cacheMap.set(name, cache);
			}
			return cache;
		},
		async keys() {
			return [...cacheMap.keys()];
		},
		async delete(name: string) {
			return cacheMap.delete(name);
		}
	};

	const worker = {
		addEventListener(type: string, listener: WorkerListener) {
			listeners.set(type, listener);
		},
		async skipWaiting() {
			state.skipWaitingCalls += 1;
		},
		clients: {
			claim: () => Promise.resolve(),
			matchAll: () => Promise.resolve([]),
			openWindow: () => Promise.resolve(null)
		},
		registration: { showNotification: () => Promise.resolve() }
	};

	const injected = source.replace(
		"import { build, files, prerendered, version } from '$service-worker';",
		[
			"const build = ['/app-essential.js'];",
			"const files = ['/optional-good.json', '/optional-missing.json'];",
			"const prerendered = ['/'];",
			"const version = 'test-version';"
		].join('\n')
	);
	assert.notEqual(injected, source, 'service-worker build manifest import should be replaced');

	const executable = ts.transpileModule(injected, {
		compilerOptions: { module: ts.ModuleKind.None, target: ts.ScriptTarget.ES2022 }
	}).outputText;

	runInNewContext(executable, {
		self: worker,
		caches: cacheStorage,
		location: { origin: ORIGIN },
		URL,
		Request,
		Response,
		fetch: globalThis.fetch,
		console,
		setTimeout,
		clearTimeout,
		AbortController
	});

	return { cacheMap, caches: cacheStorage, listeners, state };
}

async function dispatch(harness: ReturnType<typeof createHarness>, type: string) {
	const listener = harness.listeners.get(type);
	assert.ok(listener, `${type} listener should be registered`);
	const work: Promise<unknown>[] = [];
	listener({
		waitUntil(promise) {
			work.push(Promise.resolve(promise));
		}
	});
	assert.ok(work.length > 0, `${type} should extend its lifetime`);
	await Promise.all(work);
}

test('one failed optional asset does not fail install and reuses a previous cached copy', async () => {
	const harness = createHarness();

	await assert.doesNotReject(() => dispatch(harness, 'install'));

	const current = await harness.caches.open(CURRENT_CACHE);
	assert.ok(await current.match('/app-essential.js'));
	assert.ok(await current.match('/'));
	assert.equal(await (await current.match('/optional-good.json'))?.text(), 'network:/optional-good.json');
	assert.equal(await (await current.match('/optional-missing.json'))?.text(), 'previous-known-good');
	assert.equal(harness.state.skipWaitingCalls, 1);
});

test('activation deletes only older Hogg Country caches', async () => {
	const harness = createHarness();
	await harness.caches.open(CURRENT_CACHE);

	await dispatch(harness, 'activate');

	assert.equal(harness.cacheMap.has('hoggcountry-previous-version'), false);
	assert.equal(harness.cacheMap.has('another-app-cache'), true);
	assert.equal(harness.cacheMap.has(CURRENT_CACHE), true);
});
