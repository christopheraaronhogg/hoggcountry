import test from 'node:test';
import assert from 'node:assert/strict';
import { DefaultModelRouter, NoScoutModelAvailableError } from './model-router.ts';
import type { ProviderId, ProviderResponse, ScoutMode, ScoutProvider } from './types.ts';

function fakeProvider(id: ProviderId, mode: ScoutMode, available: boolean): ScoutProvider {
	return {
		capabilities: { id, mode, requiresNetwork: mode === 'cloud', supportsToolCalls: false, maxContextChars: 1000 },
		available: () => available,
		generate: (): ProviderResponse => ({ answer: id, confidence: 'medium', mode, provider: id, contextUsed: [id] })
	};
}

test('offline + on-device available → on-device', async () => {
	const router = new DefaultModelRouter({
		onDevice: fakeProvider('on-device-gemma', 'on-device', true)
	});
	const d = await router.pick({ onlineStatus: false, batterySaver: false, allowCloud: false });
	assert.equal(d.provider.capabilities.id, 'on-device-gemma');
});

test('offline + on-device NOT available → unavailable error', async () => {
	const router = new DefaultModelRouter({
		onDevice: fakeProvider('on-device-gemma', 'on-device', false)
	});
	await assert.rejects(
		() => router.pick({ onlineStatus: false, batterySaver: false, allowCloud: false }),
		NoScoutModelAvailableError
	);
});

test('battery saver never downgrades to a synthetic answer', async () => {
	const router = new DefaultModelRouter({
		onDevice: fakeProvider('on-device-gemma', 'on-device', true)
	});
	const d = await router.pick({ onlineStatus: true, batterySaver: true, allowCloud: true });
	assert.equal(d.provider.capabilities.id, 'on-device-gemma');
});

test('online + cloud allowed + cloud available → cloud', async () => {
	const router = new DefaultModelRouter({
		onDevice: fakeProvider('on-device-gemma', 'on-device', true),
		cloud: fakeProvider('cloud-scout', 'cloud', true)
	});
	const d = await router.pick({ onlineStatus: true, batterySaver: false, allowCloud: true });
	assert.equal(d.provider.capabilities.id, 'cloud-scout');
});

test('online + cloud allowed but cloud unavailable → falls through to on-device', async () => {
	const router = new DefaultModelRouter({
		onDevice: fakeProvider('on-device-gemma', 'on-device', true),
		cloud: fakeProvider('cloud-scout', 'cloud', false)
	});
	const d = await router.pick({ onlineStatus: true, batterySaver: false, allowCloud: true });
	assert.equal(d.provider.capabilities.id, 'on-device-gemma');
});

test('preferredMode on-device keeps the real on-device provider even when the probe says unavailable', async () => {
	const router = new DefaultModelRouter({
		onDevice: fakeProvider('on-device-gemma', 'on-device', false)
	});
	const d = await router.pick({ onlineStatus: true, batterySaver: false, allowCloud: false, preferredMode: 'on-device' });
	assert.equal(d.provider.capabilities.id, 'on-device-gemma');
});

test('preferredMode on-device overrides battery saver', async () => {
	const router = new DefaultModelRouter({
		onDevice: fakeProvider('on-device-gemma', 'on-device', true)
	});
	const d = await router.pick({ onlineStatus: true, batterySaver: true, allowCloud: false, preferredMode: 'on-device' });
	assert.equal(d.provider.capabilities.id, 'on-device-gemma');
});

test('preferredMode offline-local is disabled', async () => {
	const router = new DefaultModelRouter({
		onDevice: fakeProvider('on-device-gemma', 'on-device', true),
		cloud: fakeProvider('cloud-scout', 'cloud', true)
	});
	await assert.rejects(
		() => router.pick({ onlineStatus: true, batterySaver: false, allowCloud: true, preferredMode: 'offline-local' }),
		NoScoutModelAvailableError
	);
});

test('no providers configured → unavailable error', async () => {
	const router = new DefaultModelRouter();
	await assert.rejects(
		() => router.pick({ onlineStatus: true, batterySaver: false, allowCloud: true }),
		NoScoutModelAvailableError
	);
});
