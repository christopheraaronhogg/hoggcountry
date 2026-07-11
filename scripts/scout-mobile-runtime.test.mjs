import assert from 'node:assert/strict';
import test from 'node:test';

import {
	createScoutRuntime,
	DEFAULT_CONTEXT_PACK,
	DefaultModelRouter,
	defaultToolRegistry,
	InMemoryContextPackStore,
	NoScoutModelAvailableError,
	OnDeviceGemmaProvider,
	OnDeviceModelUnavailableError,
	runToolsFor
} from '../mobile/src/lib/scout/index.ts';

const FIXED_NOW = new Date('2026-06-16T15:00:00.000Z');

function makeRuntime(overrides = {}) {
	return createScoutRuntime({
		initialPack: { ...DEFAULT_CONTEXT_PACK, ...overrides }
	});
}

function fakeBridge(text = 'Model-authored answer from the local Gemma bridge.', expectedToolId) {
	return {
		async isAvailable() {
			return true;
		},
		async describeModel() {
			return { tier: 'balanced', modelId: 'gemma-fake', maxContextTokens: 8192 };
		},
		async generate(input, onToken) {
			assert.match(input.systemContext, /Source packet from local search\/tools:/u);
			assert.ok(
				input.systemContext.includes(`[${expectedToolId}]`),
				`expected ${expectedToolId} result in the model context`
			);
			onToken?.(text);
			return { text, truncated: false };
		}
	};
}

test('default pack has the calibrated AT total mile frame', () => {
	assert.equal(DEFAULT_CONTEXT_PACK.frame.totalMiles, 2197.4);
});

test('default pack is a neutral starter, not Dad pilot data', () => {
	assert.equal(DEFAULT_CONTEXT_PACK.hiker.currentMile, 0);
	assert.equal(DEFAULT_CONTEXT_PACK.hiker.dayNumber, 1);
	assert.equal(DEFAULT_CONTEXT_PACK.hiker.trailName, undefined);
	assert.equal(DEFAULT_CONTEXT_PACK.loadout.length, 0);
	assert.equal(DEFAULT_CONTEXT_PACK.weather, null);
	assert.ok(DEFAULT_CONTEXT_PACK.downloadedRegions.every((region) => !/dad|1438/i.test(region)));
	assert.ok(DEFAULT_CONTEXT_PACK.sourceReceipts?.every((receipt) => !/dad|1438/i.test(JSON.stringify(receipt))));
});

test('runtime rejects offline questions when no real model provider is available', async () => {
	const { runtime } = makeRuntime();
	await assert.rejects(
		() => runtime.ask({ prompt: 'Where is the next reliable water?', onlineStatus: false }),
		NoScoutModelAvailableError
	);
});

test('runtime answers offline through the on-device model and still runs tools first', async () => {
	const { runtime } = createScoutRuntime({
		initialPack: { ...DEFAULT_CONTEXT_PACK },
		onDeviceBridge: fakeBridge(
			'Use the source chips below; water is not loaded yet.',
			'next_water'
		)
	});
	const answer = await runtime.ask({ prompt: 'Where is the next reliable water?', onlineStatus: false });
	const waterTool = answer.toolInvocations.find((tool) => tool.toolId === 'next_water');

	assert.equal(answer.mode, 'on-device');
	assert.equal(answer.provider, 'on-device-gemma');
	assert.ok(waterTool, 'expected next_water tool invocation');
	assert.equal(waterTool.confidence, 'low');
	assert.ok(waterTool.summary.includes('No water source or mapped water candidate'));
	assert.ok(waterTool.safetyFlags?.some((flag) => flag.id === 'water-gap'));
	assert.ok(answer.receipts.length > 0);
});

test('volatile prompts still attach source/confirmation records before model synthesis', async () => {
	const { runtime } = createScoutRuntime({
		initialPack: { ...DEFAULT_CONTEXT_PACK },
		onDeviceBridge: fakeBridge(
			'No cached weather is loaded. Refresh from NWS before exposed terrain.',
			'weather_lookup'
		)
	});
	const answer = await runtime.ask({ prompt: 'What is the weather looking like on the ridge?', onlineStatus: false });

	assert.ok(answer.requiredConfirmations.some((c) => c.reason === 'volatile'));
	assert.ok(answer.toolInvocations.some((tool) => tool.toolId === 'weather_lookup'));
});

test('runToolsFor returns receipts and tool record for upcoming terrain prompt', async () => {
	const records = await runToolsFor('What do the next 20 miles look like?', DEFAULT_CONTEXT_PACK, defaultToolRegistry(), FIXED_NOW);

	assert.ok(records.some((tool) => tool.toolId === 'upcoming_terrain'));
	assert.ok(records.flatMap((tool) => tool.receipts).length > 0);
});

test('runToolsFor returns at least one invocation for any prompt', async () => {
	const records = await runToolsFor('random unrelated prompt', DEFAULT_CONTEXT_PACK, defaultToolRegistry(), FIXED_NOW);
	assert.ok(records.length >= 1);
});

test('runtime rejects online/cloud-allowed questions when no real provider is configured', async () => {
	const { runtime } = makeRuntime();
	await assert.rejects(
		() => runtime.ask({ prompt: 'Where is the next reliable water?', onlineStatus: true, allowCloud: true }),
		NoScoutModelAvailableError
	);
});

function makeThrowingOnDeviceRuntime() {
	const store = new InMemoryContextPackStore({ initial: { ...DEFAULT_CONTEXT_PACK } });
	const registry = defaultToolRegistry();
	const onDevice = new OnDeviceGemmaProvider({
		bridge: {
			async isAvailable() {
				return true;
			},
			async describeModel() {
				return { tier: 'balanced', modelId: 'gemma-fake', maxContextTokens: 8192 };
			},
			async generate() {
				throw new OnDeviceModelUnavailableError('simulated bridge failure');
			}
		}
	});
	const router = new DefaultModelRouter({ onDevice });

	return { store, registry, router };
}

test('runtime surfaces auto-selected on-device provider failures', async () => {
	const { store, registry, router } = makeThrowingOnDeviceRuntime();
	const { DefaultScoutRuntime } = await import('../mobile/src/lib/scout/scout-runtime.ts');
	const runtime = new DefaultScoutRuntime({ store, registry, router, clock: () => FIXED_NOW });

	await assert.rejects(
		() => runtime.ask({ prompt: 'next water?', onlineStatus: false }),
		OnDeviceModelUnavailableError
	);
});

test('runtime rethrows when preferredMode forces on-device and provider throws', async () => {
	const { store, registry, router } = makeThrowingOnDeviceRuntime();
	const { DefaultScoutRuntime } = await import('../mobile/src/lib/scout/scout-runtime.ts');
	const runtime = new DefaultScoutRuntime({ store, registry, router, clock: () => FIXED_NOW });

	await assert.rejects(
		() => runtime.ask({ prompt: 'next water?', onlineStatus: false, preferredMode: 'on-device' }),
		OnDeviceModelUnavailableError
	);
});

test('on-device provider with no bridge reports unavailable', async () => {
	const provider = new OnDeviceGemmaProvider();
	const available = await provider.available();
	assert.equal(available, false);
});

test('router prefers cloud when allowed, online, and available', async () => {
	const cloud = {
		capabilities: {
			id: 'cloud-scout',
			mode: 'cloud',
			requiresNetwork: true,
			supportsToolCalls: true,
			maxContextChars: 1000
		},
		async available() {
			return true;
		},
		async generate() {
			return {
				answer: 'cloud answer',
				confidence: 'high',
				mode: 'cloud',
				provider: 'cloud-scout',
				additionalReceipts: [],
				additionalConfirmations: [],
				contextUsed: ['cloud']
			};
		}
	};
	const router = new DefaultModelRouter({ cloud });
	const decision = await router.pick({ onlineStatus: true, batterySaver: false, allowCloud: true });
	assert.equal(decision.provider.capabilities.id, 'cloud-scout');
});
