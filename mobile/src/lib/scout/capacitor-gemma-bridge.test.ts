import assert from 'node:assert/strict';
import test from 'node:test';

import {
	createCapacitorGemmaBridge,
	createCapacitorModelManager,
	getCapacitorScoutInstallSource,
	isNativePlatform,
	setCapacitorScoutEvalKeepAwake,
	WATCHDOG_STALL_MS,
	type ModelDownloadWatchdogTimers,
	type ScoutGemmaModelStatus
} from './capacitor-gemma-bridge.ts';

const WATCHDOG_TEST_MS = 100;
const STALLED_MESSAGE =
	'Model download stalled — no progress from the downloader for 2 minutes. Check your connection and try again.';

test('Gemma bridge reports awaited native warm-up truth', async () => {
	const bridge = createCapacitorGemmaBridge(
		nativeWindow({
			isAvailable: async () => ({ available: true }),
			describeModel: async () => null,
			generate: async () => ({ text: 'ok' }),
			warmUp: async () => ({ warmed: true, backend: 'cpu' })
		})
	);
	assert.ok(bridge);
	assert.deepEqual(await bridge.warmUp?.(), {
		warmed: true,
		state: 'ready',
		backend: 'cpu'
	});
});

test('Gemma bridge preserves native warm-up recovery instructions', async () => {
	const bridge = createCapacitorGemmaBridge(
		nativeWindow({
			isAvailable: async () => ({ available: true }),
			describeModel: async () => null,
			generate: async () => ({ text: 'should not run' }),
			warmUp: async () => ({
				warmed: false,
				state: 'failed',
				reason: 'Close and reopen Scout before trying local AI again.'
			})
		})
	);
	assert.ok(bridge);
	assert.deepEqual(await bridge.warmUp?.(), {
		warmed: false,
		state: 'failed',
		error: 'Close and reopen Scout before trying local AI again.'
	});
});

test('Gemma bridge fails closed when an older native build has no awaited warm-up', async () => {
	const bridge = createCapacitorGemmaBridge(
		nativeWindow({
			isAvailable: async () => ({ available: true }),
			describeModel: async () => null,
			generate: async () => ({ text: 'ok' })
		})
	);
	assert.ok(bridge);
	assert.deepEqual(await bridge.warmUp?.(), {
		warmed: false,
		state: 'failed',
		error: 'This native build does not expose awaited Gemma initialization.'
	});
});

test('Gemma bridge admits only one native generation listener at a time', async () => {
	const releases: Array<() => void> = [];
	let generateCalls = 0;
	const bridge = createCapacitorGemmaBridge(
		nativeWindow({
			isAvailable: async () => ({ available: true }),
			describeModel: async () => null,
			generate: async () => {
				generateCalls += 1;
				return new Promise<{ text: string }>((resolve) => {
					releases.push(() => resolve({ text: 'local answer' }));
				});
			},
			addListener: async () => ({ remove: async () => {} })
		})
	);
	assert.ok(bridge);

	const first = bridge.generate({ prompt: 'first', systemContext: 'system', maxTokens: 32 });
	await assert.rejects(
		bridge.generate({ prompt: 'second', systemContext: 'system', maxTokens: 32 }),
		/already running/u
	);
	assert.equal(generateCalls, 1);
	releases[0]?.();
	assert.deepEqual(await first, { text: 'local answer', truncated: false });
});

test('install-source helper reads native ScoutGemma diagnostics', async () => {
	const win = nativeWindow({
		getInstallSource: async () => ({
			type: 'testflight',
			sourceBuild: ' abc123 ',
			platform: 'ios',
			detectedBy: 'ios-app-store-receipt',
			receiptPresent: true,
			receiptLastPathComponent: 'sandboxReceipt',
			debugBuild: false,
			buildConfiguration: 'release'
		})
	});

	assert.equal(isNativePlatform(win), true);
	assert.deepEqual(await getCapacitorScoutInstallSource(win), {
		type: 'testflight',
		sourceBuild: 'abc123',
		platform: 'ios',
		detectedBy: 'ios-app-store-receipt',
		receiptPresent: true,
		receiptLastPathComponent: 'sandboxReceipt',
		installerPackage: null,
		debugBuild: false,
		buildConfiguration: 'release'
	});
});

test('install-source helper returns null outside native Capacitor', async () => {
	const win = {
		Capacitor: {
			isNativePlatform: () => false
		}
	} as unknown as Window;

	assert.equal(await getCapacitorScoutInstallSource(win), null);
});

test('eval keep-awake helper toggles native ScoutGemma idle protection', async () => {
	const calls: Array<{ active: boolean }> = [];
	const win = nativeWindow({
		setEvalKeepAwake: async (input: { active: boolean }) => {
			calls.push(input);
			return {
				active: input.active,
				supported: true,
				platform: 'ios'
			};
		}
	});

	assert.deepEqual(await setCapacitorScoutEvalKeepAwake(true, win), {
		active: true,
		supported: true,
		platform: 'ios'
	});
	assert.deepEqual(await setCapacitorScoutEvalKeepAwake(false, win), {
		active: false,
		supported: true,
		platform: 'ios'
	});
	assert.deepEqual(calls, [{ active: true }, { active: false }]);
});

test('eval keep-awake helper degrades outside native Capacitor or older plugins', async () => {
	const webWindow = {
		Capacitor: {
			isNativePlatform: () => false
		}
	} as unknown as Window;
	const oldNativeWindow = nativeWindow({});

	assert.equal(await setCapacitorScoutEvalKeepAwake(true, webWindow), null);
	assert.equal(await setCapacitorScoutEvalKeepAwake(true, oldNativeWindow), null);
});

test('install-source helper normalizes incomplete native payloads', async () => {
	const win = nativeWindow({
		getInstallSource: async () => ({
			type: '',
			sourceBuild: 42,
			platform: 'ios',
			receiptLastPathComponent: 42,
			installerPackage: 42
		})
	});

	assert.deepEqual(await getCapacitorScoutInstallSource(win), {
		type: 'unknown',
		platform: 'ios',
		receiptLastPathComponent: null,
		installerPackage: null
	});
});

test('model download watchdog defaults to two minutes', () => {
	assert.equal(WATCHDOG_STALL_MS, 120_000);
});

test('model download watchdog resets while progress flows', async () => {
	const timers = new FakeWatchdogTimers();
	const plugin = new FakeDownloadPlugin();
	const manager = modelManagerFor(plugin, timers);
	const progressEvents: Array<{ bytesDownloaded: number; totalBytes: number }> = [];

	const done = manager.startDownload((progress) => progressEvents.push(progress));
	await flushAsync();

	timers.advance(WATCHDOG_TEST_MS - 1);
	plugin.emit('scoutModelDownloadProgress', { bytesDownloaded: 10, totalBytes: 100 });
	await flushAsync();
	timers.advance(WATCHDOG_TEST_MS - 1);
	assert.equal(await isSettled(done), false);

	const ready = modelStatus();
	plugin.emit('scoutModelDownloadComplete', ready);

	assert.deepEqual(await done, ready);
	assert.deepEqual(progressEvents, [{ bytesDownloaded: 10, totalBytes: 100 }]);
	assert.equal(timers.pendingCount, 0);
	assert.equal(plugin.totalListenerCount(), 0);
});

test('model download watchdog rejects stalled downloads and removes listeners', async () => {
	const timers = new FakeWatchdogTimers();
	const plugin = new FakeDownloadPlugin();
	const manager = modelManagerFor(plugin, timers);

	const done = manager.startDownload();
	await flushAsync();
	assert.equal(plugin.totalListenerCount(), 4);

	timers.advance(WATCHDOG_TEST_MS);

	await assert.rejects(done, { message: STALLED_MESSAGE });
	assert.equal(plugin.totalListenerCount(), 0);
	assert.equal(plugin.removeCalls, 4);
	assert.equal(timers.pendingCount, 0);
});

test('model download watchdog resolves completion before the stall threshold', async () => {
	const timers = new FakeWatchdogTimers();
	const plugin = new FakeDownloadPlugin();
	const manager = modelManagerFor(plugin, timers);
	const ready = modelStatus();

	const done = manager.startDownload();
	await flushAsync();
	timers.advance(WATCHDOG_TEST_MS - 1);
	plugin.emit('scoutModelDownloadComplete', ready);

	assert.deepEqual(await done, ready);
	assert.equal(plugin.totalListenerCount(), 0);
	assert.equal(timers.pendingCount, 0);

	timers.advance(WATCHDOG_TEST_MS);
	await flushAsync();
	assert.equal(await isSettled(done), true);
});

test('model download watchdog is cleared by abort when download does not start', async () => {
	const timers = new FakeWatchdogTimers();
	const plugin = new FakeDownloadPlugin();
	const manager = modelManagerFor(plugin, timers);
	plugin.startResult = { ...modelStatus(), started: false };

	const status = await manager.startDownload();

	assert.equal(status.state, 'ready');
	assert.equal(plugin.totalListenerCount(), 0);
	assert.equal(timers.pendingCount, 0);

	timers.advance(WATCHDOG_TEST_MS);
	await flushAsync();
	assert.equal(plugin.totalListenerCount(), 0);
});

test('model download watchdog also protects reattached downloads', async () => {
	const timers = new FakeWatchdogTimers();
	const plugin = new FakeDownloadPlugin();
	const manager = modelManagerFor(plugin, timers);

	const done = manager.reattachDownload();
	await flushAsync();
	assert.equal(plugin.startCalls, 0);
	assert.equal(plugin.totalListenerCount(), 4);

	timers.advance(WATCHDOG_TEST_MS);

	await assert.rejects(done, { message: STALLED_MESSAGE });
	assert.equal(plugin.totalListenerCount(), 0);
	assert.equal(plugin.removeCalls, 4);
});

function nativeWindow(plugin: Record<string, unknown>): Window {
	return {
		Capacitor: {
			isNativePlatform: () => true,
			Plugins: {
				ScoutGemma: plugin
			}
		}
	} as unknown as Window;
}

function modelManagerFor(plugin: FakeDownloadPlugin, timers: FakeWatchdogTimers) {
	const manager = createCapacitorModelManager(
		nativeWindow(plugin as unknown as Record<string, unknown>),
		{
			watchdogStallMs: WATCHDOG_TEST_MS,
			watchdogTimers: timers
		}
	);
	assert.ok(manager);
	return manager;
}

function modelStatus(overrides: Partial<ScoutGemmaModelStatus> = {}): ScoutGemmaModelStatus {
	return {
		modelId: 'gemma-test',
		state: 'ready',
		fileName: 'gemma-test.task',
		filePath: '/models/gemma-test.task',
		exists: true,
		bytesOnDevice: 100,
		expectedBytes: 100,
		checksumAlgorithm: 'SHA-256',
		checksumConfigured: true,
		downloadConfigured: true,
		canDownload: true,
		runtimeConfigured: true,
		...overrides
	};
}

async function flushAsync() {
	for (let i = 0; i < 5; i += 1) {
		await Promise.resolve();
	}
}

async function isSettled(promise: Promise<unknown>): Promise<boolean> {
	let settled = false;
	promise.then(
		() => {
			settled = true;
		},
		() => {
			settled = true;
		}
	);
	await flushAsync();
	return settled;
}

class FakeWatchdogTimers implements ModelDownloadWatchdogTimers {
	#now = 0;
	#nextId = 1;
	#timers = new Map<number, { dueAt: number; callback: () => void }>();

	get pendingCount(): number {
		return this.#timers.size;
	}

	setTimeout(callback: () => void, ms: number): number {
		const id = this.#nextId;
		this.#nextId += 1;
		this.#timers.set(id, { dueAt: this.#now + ms, callback });
		return id;
	}

	clearTimeout(handle: unknown): void {
		if (typeof handle === 'number') {
			this.#timers.delete(handle);
		}
	}

	advance(ms: number): void {
		this.#now += ms;
		const dueTimers = Array.from(this.#timers.entries())
			.filter(([, timer]) => timer.dueAt <= this.#now)
			.sort((a, b) => a[1].dueAt - b[1].dueAt);
		for (const [id, timer] of dueTimers) {
			if (!this.#timers.has(id)) continue;
			this.#timers.delete(id);
			timer.callback();
		}
	}
}

class FakeDownloadPlugin {
	removeCalls = 0;
	startCalls = 0;
	startResult: ScoutGemmaModelStatus & { started?: boolean } = {
		...modelStatus({ state: 'needs_download', exists: false, bytesOnDevice: 0 }),
		started: true
	};
	downloadState = { active: true, bytesDownloaded: 0, totalBytes: 100 };
	#listeners = new Map<string, Set<(data: unknown) => void>>();

	isAvailable = async () => ({ available: true });
	describeModel = async () => null;
	generate = async () => ({ text: 'ok', truncated: false });
	getModelStatus = async () => modelStatus({ state: 'needs_download', exists: false, bytesOnDevice: 0 });
	getDownloadState = async () => this.downloadState;
	requestNotificationsPermission = async () => ({ granted: true });
	startModelDownload = async () => {
		this.startCalls += 1;
		return this.startResult;
	};
	addListener = async (eventName: string, listener: (data: unknown) => void) => {
		const listeners = this.#listeners.get(eventName) ?? new Set<(data: unknown) => void>();
		listeners.add(listener);
		this.#listeners.set(eventName, listeners);
		return {
			remove: async () => {
				this.removeCalls += 1;
				this.#listeners.get(eventName)?.delete(listener);
			}
		};
	};

	emit(eventName: string, data?: unknown): void {
		for (const listener of Array.from(this.#listeners.get(eventName) ?? [])) {
			listener(data);
		}
	}

	totalListenerCount(): number {
		return Array.from(this.#listeners.values()).reduce((total, listeners) => total + listeners.size, 0);
	}
}
