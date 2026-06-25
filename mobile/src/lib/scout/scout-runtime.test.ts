import test from 'node:test';
import assert from 'node:assert/strict';
import { createScoutRuntime, cloneDefaultContextPack } from './index.ts';
import type { CloudScoutBridge } from './providers/cloud-scout.ts';
import type { OnDeviceGemmaBridge } from './providers/on-device-gemma.ts';

const okBridge: OnDeviceGemmaBridge = {
	isAvailable: async () => true,
	describeModel: async () => null,
	generate: async () => ({ text: 'ON-DEVICE-ANSWER', truncated: false })
};

const throwingBridge: OnDeviceGemmaBridge = {
	isAvailable: async () => true,
	describeModel: async () => null,
	generate: async () => {
		throw new Error('engine boom');
	}
};

// Reports unavailable WITHOUT throwing from isAvailable — so the router selects it
// (under forced on-device) and generate() throws OnDeviceModelUnavailableError.
const unavailableBridge: OnDeviceGemmaBridge = {
	isAvailable: async () => false,
	describeModel: async () => null,
	generate: async () => ({ text: 'should-never-run', truncated: false })
};

test('offline ask with an available on-device engine answers on-device', async () => {
	const { runtime } = createScoutRuntime({ initialPack: cloneDefaultContextPack(), onDeviceBridge: okBridge });
	const ans = await runtime.ask({ prompt: 'where is the next water', onlineStatus: false });
	assert.equal(ans.provider, 'on-device-gemma');
	assert.equal(ans.mode, 'on-device');
	assert.match(ans.answer, /ON-DEVICE-ANSWER/);
	assert.ok(ans.generatedAt, 'stamps generatedAt');
});

test('on-device engine failure surfaces instead of using a synthetic answer', async () => {
	const { runtime } = createScoutRuntime({ initialPack: cloneDefaultContextPack(), onDeviceBridge: throwingBridge });
	await assert.rejects(() => runtime.ask({ prompt: 'where is the next water', onlineStatus: false }), /engine boom/);
});

test('under preferredMode on-device, an engine failure REthrows — never a silent template answer', async () => {
	// Regression for the "asked a question, it acted offline" bug: in a Gemma-only
	// build the caller forces preferredMode 'on-device'. A native generate() failure
	// must surface (so the caller can warm + retry), NOT masquerade as a normal
	// canned/template answer.
	const { runtime } = createScoutRuntime({
		initialPack: cloneDefaultContextPack(),
		onDeviceBridge: throwingBridge
	});
	await assert.rejects(
		() => runtime.ask({ prompt: 'what is happening homie', onlineStatus: false, preferredMode: 'on-device' }),
		/engine boom/
	);
});

test('under preferredMode on-device, an UNAVAILABLE engine surfaces — never a silent template answer', async () => {
	// isAvailable() returns false (no throw), so the router must still pick
	// on-device (forced), whose generate() throws OnDeviceModelUnavailableError,
	// which the runtime rethrows. It must NOT return canned prose.
	const { runtime } = createScoutRuntime({
		initialPack: cloneDefaultContextPack(),
		onDeviceBridge: unavailableBridge
	});
	await assert.rejects(() =>
		runtime.ask({ prompt: 'what is happening homie', onlineStatus: false, preferredMode: 'on-device' })
	);
});

test('with no engine and offline, Scout surfaces unavailable instead of answering synthetically', async () => {
	const { runtime } = createScoutRuntime({ initialPack: cloneDefaultContextPack() });
	await assert.rejects(() => runtime.ask({ prompt: 'how is the weather tomorrow', onlineStatus: false }));
});

test('a volatile prompt (weather) attaches a verify-from-current-source confirmation', async () => {
	const { runtime } = createScoutRuntime({ initialPack: cloneDefaultContextPack(), onDeviceBridge: okBridge });
	const ans = await runtime.ask({ prompt: 'how is the weather and wind tomorrow', onlineStatus: false });
	assert.ok(ans.toolInvocations.some((tool) => tool.toolId === 'weather_lookup'));
	assert.ok(
		ans.toolInvocations.some((tool) => tool.confidence === 'low'),
		'weather tool must not make unavailable weather look high-confidence'
	);
});

test('offline source search includes saved hiker documents with receipts', async () => {
	const pack = cloneDefaultContextPack();
	pack.documents = [
		{
			id: 'doc-shoes',
			title: 'Foot care note',
			body: 'Lace the left shoe looser near the top eyelet and stop after 6 miles to check the hot spot.',
			source: 'manual',
			createdAt: '2026-06-20T12:00:00.000Z',
			updatedAt: '2026-06-20T12:00:00.000Z'
		}
	];

	const { runtime } = createScoutRuntime({ initialPack: pack, onDeviceBridge: okBridge });
	const ans = await runtime.ask({ prompt: 'what did I write about the left shoe laces?', onlineStatus: false });

	assert.equal(ans.provider, 'on-device-gemma');
	assert.ok(
		ans.receipts.some((receipt) => receipt.kind === 'hiker-input' && receipt.title === 'Foot care note'),
		'saved docs should be cited as hiker-input'
	);
});

test('on-device Scout receives recent conversation in system context', async () => {
	let seenPrompt = '';
	let seenSystemContext = '';
	const bridge: OnDeviceGemmaBridge = {
		isAvailable: async () => true,
		describeModel: async () => null,
		generate: async (input) => {
			seenPrompt = input.prompt;
			seenSystemContext = input.systemContext;
			return { text: 'Your previous question was testing 123.', truncated: false };
		}
	};

	const { runtime } = createScoutRuntime({ initialPack: cloneDefaultContextPack(), onDeviceBridge: bridge });
	await runtime.ask({
		prompt: 'what was my last question?',
		onlineStatus: false,
		conversationHistory: [
			{
				role: 'user',
				content: 'testing 123',
				timestamp: '2026-06-25T17:54:00.000Z'
			},
			{
				role: 'assistant',
				content: 'I am here, Hogg. Send the trail question when ready.',
				timestamp: '2026-06-25T17:54:05.000Z'
			}
		]
	});

	assert.equal(seenPrompt, 'what was my last question?');
	assert.match(seenSystemContext, /Recent conversation before the current prompt/);
	assert.match(seenSystemContext, /Hiker \(2026-06-25T17:54:00\.000Z\): testing 123/);
	assert.match(seenSystemContext, /The current user prompt is not part of this history/);
});

test('cloud Scout payload includes recent conversation history', async () => {
	let seenPrompt = '';
	let seenPayload: Record<string, unknown> = {};
	const bridge: CloudScoutBridge = {
		isReachable: async () => true,
		ask: async (input) => {
			seenPrompt = input.prompt;
			seenPayload = input.payload;
			return {
				answer: 'Your previous question was testing 123.',
				confidence: 'medium',
				contextUsed: ['conversationHistory']
			};
		}
	};

	const { runtime } = createScoutRuntime({
		initialPack: cloneDefaultContextPack(),
		cloudBridge: bridge
	});
	await runtime.ask({
		prompt: 'what was my last question?',
		onlineStatus: true,
		allowCloud: true,
		conversationHistory: [
			{
				role: 'user',
				content: 'testing 123',
				timestamp: '2026-06-25T17:54:00.000Z'
			}
		]
	});

	assert.equal(seenPrompt, 'what was my last question?');
	assert.deepEqual(seenPayload.conversationHistory, [
		{
			role: 'user',
			content: 'testing 123',
			timestamp: '2026-06-25T17:54:00.000Z'
		}
	]);
});

test('cloud Scout payload includes water hierarchy and caveats from tools', async () => {
	let seenPayload: Record<string, unknown> = {};
	const bridge: CloudScoutBridge = {
		isReachable: async () => true,
		ask: async (input) => {
			seenPayload = input.payload;
			return {
				answer: 'Closest mapped water is 1.9 miles ahead; best loaded source is Riga Shelter spring.',
				confidence: 'medium',
				contextUsed: ['toolInvocations']
			};
		}
	};
	const pack = cloneDefaultContextPack();
	pack.hiker.currentMile = 1530;
	pack.water = [
		{
			name: 'Unnamed mapped stream',
			mile: 1531.9,
			reliability: 'thin',
			note: 'Mapped water candidate; confirm current flow.'
		},
		{
			name: 'Riga Shelter',
			mile: 1534.4,
			reliability: 'seasonal',
			note: 'AWOL-listed spring; confirm current flow.'
		}
	];

	const { runtime } = createScoutRuntime({ initialPack: pack, cloudBridge: bridge });
	await runtime.ask({
		prompt: 'what is my next reliable water source?',
		onlineStatus: true,
		allowCloud: true
	});

	const tools = seenPayload.toolInvocations as Array<{
		toolId: string;
		summary: string;
		safetyFlags: Array<{ id: string }>;
	}>;
	assert.equal(tools[0]?.toolId, 'next_water');
	assert.match(tools[0]?.summary ?? '', /Best loaded water source: Riga Shelter/);
	assert.ok(
		tools[0]?.safetyFlags.some((flag) => flag.id === 'water-seasonal-confirm-flow'),
		'cloud payload should carry low-confidence water caveats'
	);
});
