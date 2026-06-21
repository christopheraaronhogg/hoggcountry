import test from 'node:test';
import assert from 'node:assert/strict';
import { createScoutRuntime, cloneDefaultContextPack } from './index.ts';
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
