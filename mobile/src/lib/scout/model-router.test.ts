import test from 'node:test';
import assert from 'node:assert/strict';
import { DefaultModelRouter } from './model-router.ts';
import type { ProviderId, ProviderResponse, ScoutMode, ScoutProvider } from './types.ts';

function fakeProvider(id: ProviderId, mode: ScoutMode, available: boolean): ScoutProvider {
	return {
		capabilities: { id, mode, requiresNetwork: mode === 'cloud', supportsToolCalls: false, maxContextChars: 1000 },
		available: () => available,
		generate: (): ProviderResponse => ({ answer: id, confidence: 'medium', mode, provider: id, contextUsed: [id] })
	};
}

const fallback = () => fakeProvider('deterministic-fallback', 'offline-local', true);

test('offline + on-device available → on-device', async () => {
	const router = new DefaultModelRouter({
		fallback: fallback(),
		onDevice: fakeProvider('on-device-gemma', 'on-device', true)
	});
	const d = await router.pick({ onlineStatus: false, batterySaver: false, allowCloud: false });
	assert.equal(d.provider.capabilities.id, 'on-device-gemma');
});

test('offline + on-device NOT available → deterministic fallback', async () => {
	const router = new DefaultModelRouter({
		fallback: fallback(),
		onDevice: fakeProvider('on-device-gemma', 'on-device', false)
	});
	const d = await router.pick({ onlineStatus: false, batterySaver: false, allowCloud: false });
	assert.equal(d.provider.capabilities.id, 'deterministic-fallback');
});

test('battery saver forces the deterministic fallback even when on-device is available', async () => {
	const router = new DefaultModelRouter({
		fallback: fallback(),
		onDevice: fakeProvider('on-device-gemma', 'on-device', true)
	});
	const d = await router.pick({ onlineStatus: true, batterySaver: true, allowCloud: true });
	assert.equal(d.provider.capabilities.id, 'deterministic-fallback');
});

test('online + cloud allowed + cloud available → cloud', async () => {
	const router = new DefaultModelRouter({
		fallback: fallback(),
		onDevice: fakeProvider('on-device-gemma', 'on-device', true),
		cloud: fakeProvider('cloud-scout', 'cloud', true)
	});
	const d = await router.pick({ onlineStatus: true, batterySaver: false, allowCloud: true });
	assert.equal(d.provider.capabilities.id, 'cloud-scout');
});

test('online + cloud allowed but cloud unavailable → falls through to on-device', async () => {
	const router = new DefaultModelRouter({
		fallback: fallback(),
		onDevice: fakeProvider('on-device-gemma', 'on-device', true),
		cloud: fakeProvider('cloud-scout', 'cloud', false)
	});
	const d = await router.pick({ onlineStatus: true, batterySaver: false, allowCloud: true });
	assert.equal(d.provider.capabilities.id, 'on-device-gemma');
});

test('preferredMode on-device NEVER resolves to deterministic-fallback, even when the probe says unavailable', async () => {
	// Gemma-only contract: a flaky/unavailable on-device probe must still route to
	// on-device (whose generate() then throws and is surfaced) — never silently to
	// the deterministic "offline" answer. Regression guard for the masquerade bug.
	const router = new DefaultModelRouter({
		fallback: fallback(),
		onDevice: fakeProvider('on-device-gemma', 'on-device', false)
	});
	const d = await router.pick({ onlineStatus: true, batterySaver: false, allowCloud: false, preferredMode: 'on-device' });
	assert.equal(d.provider.capabilities.id, 'on-device-gemma');
	assert.notEqual(d.provider.capabilities.id, 'deterministic-fallback');
});

test('preferredMode on-device overrides battery saver (Gemma-only has no canned-offline alternative)', async () => {
	const router = new DefaultModelRouter({
		fallback: fallback(),
		onDevice: fakeProvider('on-device-gemma', 'on-device', true)
	});
	const d = await router.pick({ onlineStatus: true, batterySaver: true, allowCloud: false, preferredMode: 'on-device' });
	assert.equal(d.provider.capabilities.id, 'on-device-gemma');
});

test('preferredMode offline-local always uses the fallback', async () => {
	const router = new DefaultModelRouter({
		fallback: fallback(),
		onDevice: fakeProvider('on-device-gemma', 'on-device', true),
		cloud: fakeProvider('cloud-scout', 'cloud', true)
	});
	const d = await router.pick({ onlineStatus: true, batterySaver: false, allowCloud: true, preferredMode: 'offline-local' });
	assert.equal(d.provider.capabilities.id, 'deterministic-fallback');
});

test('no providers configured → deterministic fallback', async () => {
	const router = new DefaultModelRouter({ fallback: fallback() });
	const d = await router.pick({ onlineStatus: true, batterySaver: false, allowCloud: true });
	assert.equal(d.provider.capabilities.id, 'deterministic-fallback');
});
