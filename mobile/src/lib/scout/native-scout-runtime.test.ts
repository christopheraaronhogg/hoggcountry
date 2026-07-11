import assert from 'node:assert/strict';
import { test } from 'node:test';

import { cloneDefaultContextPack } from './default-pack.ts';
import {
	NativeScoutRuntime,
	type NativeDownloadSession,
	type NativeDownloadSessionInput
} from './native-scout-runtime.ts';
import type { ScoutModelManager } from './capacitor-gemma-bridge.ts';
import type { OnDeviceGemmaBridge } from './providers/on-device-gemma.ts';
import type {
	ContextPack,
	ContextPackStatus,
	ContextPackStore,
	HikerProfile,
	LocalDocumentReference,
	LoadoutItem,
	CachedWeather,
	ScoutAnswer,
	ScoutAskInput,
	TokenSink
} from './types.ts';

function contextStore(): ContextPackStore {
	const pack = cloneDefaultContextPack();
	const status: ContextPackStatus = {
		state: 'fallback',
		label: 'Fallback',
		detail: 'Fallback test store.',
		lastLoadedAt: null,
		validUntil: null,
		source: 'bundled'
	};
	return {
		load: () => Promise.resolve(pack),
		get: () => pack,
		getStatus: () => status,
		refreshFromEndpoint: () => Promise.resolve(pack),
		updateHiker: (_patch: Partial<HikerProfile>) => Promise.resolve(),
		updateWeather: (_weather: CachedWeather | null) => Promise.resolve(),
		updateLoadout: (_items: LoadoutItem[]) => Promise.resolve(),
		updateDocuments: (_documents: LocalDocumentReference[]) => Promise.resolve(),
		subscribe: (_listener: (pack: ContextPack) => void) => () => {},
		subscribeStatus: (_listener: (status: ContextPackStatus) => void) => () => {}
	};
}

function answer(): ScoutAnswer {
	return {
		answer: 'ok',
		confidence: 'draft',
		mode: 'on-device',
		provider: 'on-device-gemma',
		receipts: [],
		toolInvocations: [],
		requiredConfirmations: [],
		safetyFlags: [],
		contextUsed: [],
		generatedAt: '2026-06-20T12:00:00.000Z'
	};
}

function downloadSession(_input: NativeDownloadSessionInput): NativeDownloadSession {
	return {
		status: null,
		download: null,
		error: null,
		meteredPrompt: null,
		supportsModelManagement: true,
		refreshStatus: () => Promise.resolve(null),
		startIfUseful: () => Promise.resolve('none'),
		unavailableAnswer: () => answer(),
		downloadModel: () => Promise.resolve(),
		dismissMeteredPrompt: () => {},
		reconcileDownload: () => Promise.resolve(),
		cancelDownload: () => Promise.resolve()
	};
}

function bridge(available = true, warmups: string[] = []): OnDeviceGemmaBridge {
	return {
		isAvailable: () => Promise.resolve(available),
		describeModel: () => Promise.resolve(null),
		warmUp: () => {
			warmups.push('warm');
			return Promise.resolve({ warmed: true, state: 'ready' });
		},
		generate: () => Promise.resolve({ text: 'ok', truncated: false })
	};
}

function manager(): ScoutModelManager {
	return {
		getStatus: () => Promise.resolve(null),
		prepareDownload: () => Promise.resolve(null),
		startDownload: () => Promise.reject(new Error('not used')),
		cancelDownload: () => Promise.resolve(true),
		getNetworkStatus: () => Promise.resolve(null),
		getDownloadState: () => Promise.resolve(null),
		reattachDownload: () => Promise.resolve(null),
		requestNotificationsPermission: () => Promise.resolve(false)
	};
}

test('native runtime self-heals when a bridge appears after construction', async () => {
	const store = contextStore();
	const runtimeCalls: Array<{ hasBridge: boolean }> = [];
	const warmups: string[] = [];
	let currentBridge: OnDeviceGemmaBridge | null = null;
	const downloadInputs: NativeDownloadSessionInput[] = [];
	let invalidations = 0;

	const runtime = new NativeScoutRuntime({
		browserAvailable: true,
		store,
		createBridge: () => currentBridge,
		createManager: () => manager(),
		createRuntime: (input) => {
			runtimeCalls.push({ hasBridge: Boolean(input.onDeviceBridge) });
			return {
				runtime: { ask: (_input: ScoutAskInput, _onToken?: TokenSink) => Promise.resolve(answer()) },
				onDeviceProvider: { invalidateAvailability: () => (invalidations += 1) }
			};
		},
		createDownloadSession: (input) => {
			downloadInputs.push(input);
			return downloadSession(input);
		}
	});

	assert.deepEqual(runtimeCalls, [{ hasBridge: false }]);

	currentBridge = bridge(true, warmups);
	runtime.ensureNativeWiring();

	assert.deepEqual(runtimeCalls, [{ hasBridge: false }, { hasBridge: true }]);
	assert.equal(await runtime.gemmaReady(true), true);
	assert.equal(runtime.runtimeInitialized, true);

	const downloadInput = downloadInputs[0];
	assert.ok(downloadInput);
	downloadInput.onModelReady();

	assert.equal(invalidations, 1);
	assert.deepEqual(warmups, ['warm']);
});

test('native runtime does not call a file-present bridge ready until awaited warm-up succeeds', async () => {
	let warmUps = 0;
	const coldBridge: OnDeviceGemmaBridge = {
		isAvailable: () => Promise.resolve(true),
		describeModel: () => Promise.resolve(null),
		warmUp: async () => {
			warmUps += 1;
			return { warmed: false, state: 'failed', error: 'LiteRT init failed' };
		},
		generate: () => Promise.resolve({ text: 'should not run', truncated: false })
	};
	const runtime = new NativeScoutRuntime({
		browserAvailable: true,
		store: contextStore(),
		createBridge: () => coldBridge,
		createManager: () => manager(),
		createDownloadSession: downloadSession
	});

	assert.equal(await runtime.gemmaReady(true), false);
	assert.equal(runtime.runtimeInitialized, false);
	assert.equal(runtime.runtimeFailureReason, 'LiteRT init failed');
	assert.equal(warmUps, 1);
});

test('native runtime preserves rejected warm-up recovery instructions', async () => {
	const failedBridge: OnDeviceGemmaBridge = {
		isAvailable: () => Promise.resolve(true),
		describeModel: () => Promise.resolve(null),
		warmUp: () => Promise.reject(new Error('Close and reopen Scout before trying local AI again.')),
		generate: () => Promise.resolve({ text: 'should not run', truncated: false })
	};
	const runtime = new NativeScoutRuntime({
		browserAvailable: true,
		store: contextStore(),
		createBridge: () => failedBridge,
		createManager: () => manager(),
		createDownloadSession: downloadSession
	});

	assert.equal(await runtime.gemmaReady(true), false);
	assert.equal(
		runtime.runtimeFailureReason,
		'Close and reopen Scout before trying local AI again.'
	);
});

test('native runtime coalesces concurrent warm-ups and caches successful initialization', async () => {
	const warmUpReleases: Array<() => void> = [];
	let warmUps = 0;
	const warmingBridge: OnDeviceGemmaBridge = {
		isAvailable: () => Promise.resolve(true),
		describeModel: () => Promise.resolve(null),
		warmUp: () => {
			warmUps += 1;
			return new Promise((resolve) => {
				warmUpReleases.push(() => resolve({ warmed: true, state: 'ready' }));
			});
		},
		generate: () => Promise.resolve({ text: 'ok', truncated: false })
	};
	const runtime = new NativeScoutRuntime({
		browserAvailable: true,
		store: contextStore(),
		createBridge: () => warmingBridge,
		createManager: () => manager(),
		createDownloadSession: downloadSession
	});

	const first = runtime.warmUpModel();
	const second = runtime.warmUpModel();
	await Promise.resolve();
	assert.equal(warmUps, 1);
	warmUpReleases[0]?.();
	assert.deepEqual(await Promise.all([first, second]), [true, true]);
	assert.equal(await runtime.warmUpModel(), true);
	assert.equal(warmUps, 1);

	runtime.invalidateRuntimeReadiness();
	assert.equal(runtime.runtimeInitialized, false);
	assert.equal(runtime.runtimeFailureReason, null);
	const third = runtime.warmUpModel();
	await Promise.resolve();
	assert.equal(warmUps, 2);
	warmUpReleases[1]?.();
	assert.equal(await third, true);
});

test('native runtime stays inert off-browser and treats Gemma as unavailable when required', async () => {
	let bridgeCreations = 0;
	let managerCreations = 0;
	const runtime = new NativeScoutRuntime({
		browserAvailable: false,
		store: contextStore(),
		createBridge: () => {
			bridgeCreations += 1;
			return bridge();
		},
		createManager: () => {
			managerCreations += 1;
			return manager();
		},
		createDownloadSession: downloadSession
	});

	runtime.ensureNativeWiring();

	assert.equal(bridgeCreations, 0);
	assert.equal(managerCreations, 0);
	assert.equal(await runtime.gemmaReady(false), true);
	assert.equal(await runtime.gemmaReady(true), false);
});

test('native runtime catches transient availability probe failures', async () => {
	const throwingBridge: OnDeviceGemmaBridge = {
		isAvailable: () => Promise.reject(new Error('not warmed')),
		describeModel: () => Promise.resolve(null),
		generate: () => Promise.resolve({ text: 'ok', truncated: false })
	};
	const runtime = new NativeScoutRuntime({
		browserAvailable: true,
		store: contextStore(),
		createBridge: () => throwingBridge,
		createManager: () => manager(),
		createDownloadSession: downloadSession
	});

	assert.equal(await runtime.gemmaReady(true), false);
});

test('native runtime exposes native network truth for the airplane-mode gate', async () => {
	const disconnected = {
		connected: false,
		metered: false,
		type: 'none' as const
	};
	const networkManager = manager();
	networkManager.getNetworkStatus = () => Promise.resolve(disconnected);
	const runtime = new NativeScoutRuntime({
		browserAvailable: true,
		store: contextStore(),
		createBridge: () => bridge(),
		createManager: () => networkManager,
		createDownloadSession: downloadSession
	});

	assert.deepEqual(await runtime.getNetworkStatus(), disconnected);
});

test('native runtime asks with an isolated context pack for device evals', async () => {
	const evalPack = cloneDefaultContextPack();
	evalPack.hiker.currentMile = 501.8;
	let seenMile: number | null = null;

	const runtime = new NativeScoutRuntime({
		browserAvailable: true,
		store: contextStore(),
		createBridge: () => bridge(true),
		createManager: () => manager(),
		createRuntime: (input) => ({
			runtime: {
				ask: async (_input: ScoutAskInput, _onToken?: TokenSink) => {
					await input.store.load();
					seenMile = input.store.get().hiker.currentMile;
					return answer();
				}
			},
			onDeviceProvider: undefined
		}),
		createDownloadSession: downloadSession
	});

	await runtime.askWithContextPack(evalPack, {
		prompt: 'What water is ahead?',
		onlineStatus: false,
		allowCloud: false,
		preferredMode: 'on-device'
	});

	assert.equal(seenMile, 501.8);
});
