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

test('offline ask with an available on-device engine answers on-device', async () => {
	const { runtime } = createScoutRuntime({ initialPack: cloneDefaultContextPack(), onDeviceBridge: okBridge });
	const ans = await runtime.ask({ prompt: 'where is the next water', onlineStatus: false });
	assert.equal(ans.provider, 'on-device-gemma');
	assert.equal(ans.mode, 'on-device');
	assert.match(ans.answer, /ON-DEVICE-ANSWER/);
	assert.ok(ans.generatedAt, 'stamps generatedAt');
});

test('on-device engine failure degrades to the deterministic fallback (never throws to the user)', async () => {
	const { runtime } = createScoutRuntime({ initialPack: cloneDefaultContextPack(), onDeviceBridge: throwingBridge });
	const ans = await runtime.ask({ prompt: 'where is the next water', onlineStatus: false });
	assert.equal(ans.provider, 'deterministic-fallback');
	assert.equal(ans.mode, 'offline-local');
	assert.ok(ans.answer.length > 0);
});

test('under preferredMode on-device, an engine failure REthrows — never a silent offline fallback', async () => {
	// Regression for the "asked a question, it acted offline" bug: in a Gemma-only
	// build the caller forces preferredMode 'on-device'. A native generate() failure
	// must surface (so the caller can warm + retry), NOT masquerade as a normal
	// deterministic offline answer.
	const { runtime } = createScoutRuntime({
		initialPack: cloneDefaultContextPack(),
		onDeviceBridge: throwingBridge
	});
	await assert.rejects(
		() => runtime.ask({ prompt: 'what is happening homie', onlineStatus: false, preferredMode: 'on-device' }),
		/engine boom/
	);
});

test('with no engine and offline, it answers deterministically — never a cloud provider', async () => {
	const { runtime } = createScoutRuntime({ initialPack: cloneDefaultContextPack() });
	const ans = await runtime.ask({ prompt: 'how is the weather tomorrow', onlineStatus: false });
	assert.equal(ans.provider, 'deterministic-fallback');
	assert.equal(ans.mode, 'offline-local');
	assert.notEqual(ans.mode, 'cloud');
});

test('a volatile prompt (weather) attaches a verify-from-current-source confirmation', async () => {
	const { runtime } = createScoutRuntime({ initialPack: cloneDefaultContextPack() });
	const ans = await runtime.ask({ prompt: 'how is the weather and wind tomorrow', onlineStatus: false });
	assert.ok(
		ans.requiredConfirmations.some((c) => c.reason === 'volatile'),
		'volatile facts must carry a verify-live confirmation'
	);
});
