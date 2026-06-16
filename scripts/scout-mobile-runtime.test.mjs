import assert from 'node:assert/strict';
import test from 'node:test';

import {
	createScoutRuntime,
	DEFAULT_CONTEXT_PACK,
	DeterministicFallbackProvider,
	DefaultModelRouter,
	defaultToolRegistry,
	InMemoryContextPackStore,
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

test('default pack has the calibrated AT total mile frame', () => {
	assert.equal(DEFAULT_CONTEXT_PACK.frame.totalMiles, 2197.4);
});

test('runtime answers a basic water prompt offline using local pack only', async () => {
	const { runtime } = makeRuntime();
	const answer = await runtime.ask({ prompt: 'Where is the next reliable water?', onlineStatus: false });

	assert.equal(answer.mode, 'offline-local');
	assert.equal(answer.provider, 'deterministic-fallback');
	assert.ok(answer.answer.includes('Lick Creek'));
	assert.ok(answer.receipts.length > 0);
	assert.ok(answer.toolInvocations.some((tool) => tool.toolId === 'next_water'));
});

test('runtime flags volatile prompts with a confirmation request', async () => {
	const { runtime } = makeRuntime();
	const answer = await runtime.ask({ prompt: 'What is the weather looking like on the ridge?', onlineStatus: false });

	assert.ok(answer.requiredConfirmations.some((c) => c.reason === 'volatile'));
	assert.ok(answer.toolInvocations.some((tool) => tool.toolId === 'weather_lookup'));
});

test('runtime returns receipts and tool record for upcoming terrain prompt', async () => {
	const { runtime } = makeRuntime();
	const answer = await runtime.ask({ prompt: 'What do the next 20 miles look like?', onlineStatus: false });

	assert.ok(answer.toolInvocations.some((tool) => tool.toolId === 'upcoming_terrain'));
	assert.ok(answer.receipts.length > 0);
	assert.ok(['high', 'medium', 'low', 'draft'].includes(answer.confidence));
});

test('runtime stays answerable even with no matching keywords', async () => {
	const { runtime } = makeRuntime();
	const answer = await runtime.ask({ prompt: 'Tell me something about today.', onlineStatus: false });

	assert.ok(answer.answer.length > 0);
	assert.ok(answer.toolInvocations.some((tool) => tool.toolId === 'current_mile'));
});

test('runtime answers offline when the cloud bridge is missing and online is true', async () => {
	const { runtime } = makeRuntime();
	const answer = await runtime.ask({ prompt: 'Where is the next reliable water?', onlineStatus: true, allowCloud: true });

	assert.equal(answer.provider, 'deterministic-fallback');
	assert.equal(answer.mode, 'offline-local');
});

test('runtime downgrades confidence when the pack is stale', async () => {
	const oldDate = '2026-05-01T00:00:00.000Z';
	const { runtime } = createScoutRuntime({
		initialPack: { ...DEFAULT_CONTEXT_PACK, generatedAt: oldDate }
	});
	const answer = await runtime.ask({ prompt: 'next water?', onlineStatus: false });

	assert.ok(answer.requiredConfirmations.some((c) => c.reason === 'stale-cache'));
});

test('runtime falls back when on-device provider throws', async () => {
	const store = new InMemoryContextPackStore({ initial: { ...DEFAULT_CONTEXT_PACK } });
	const registry = defaultToolRegistry();
	const fallback = new DeterministicFallbackProvider();
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
	const router = new DefaultModelRouter({ fallback, onDevice });
	const { DefaultScoutRuntime } = await import('../mobile/src/lib/scout/scout-runtime.ts');
	const runtime = new DefaultScoutRuntime({ store, registry, router, clock: () => FIXED_NOW });

	const answer = await runtime.ask({ prompt: 'next water?', onlineStatus: false, preferredMode: 'on-device' });
	assert.equal(answer.provider, 'deterministic-fallback');
});

test('runToolsFor returns at least one invocation for any prompt', async () => {
	const records = await runToolsFor('random unrelated prompt', DEFAULT_CONTEXT_PACK, defaultToolRegistry(), FIXED_NOW);
	assert.ok(records.length >= 1);
});

test('on-device provider with no bridge reports unavailable', async () => {
	const provider = new OnDeviceGemmaProvider();
	const available = await provider.available();
	assert.equal(available, false);
});

test('router prefers cloud when allowed, online, and available', async () => {
	const fallback = new DeterministicFallbackProvider();
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
	const router = new DefaultModelRouter({ fallback, cloud });
	const decision = await router.pick({ onlineStatus: true, batterySaver: false, allowCloud: true });
	assert.equal(decision.provider.capabilities.id, 'cloud-scout');
});
