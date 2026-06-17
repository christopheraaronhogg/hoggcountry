import test from 'node:test';
import assert from 'node:assert/strict';
import { OnDeviceGemmaProvider, type OnDeviceGemmaBridge } from './providers/on-device-gemma.ts';

function bridge(state: { available: boolean }): OnDeviceGemmaBridge {
	return {
		isAvailable: async () => state.available,
		describeModel: async () => null,
		generate: async () => ({ text: 'ok', truncated: false })
	};
}

// Regression guard for the feature-breaking bug: available() used to memoize the
// first (false) probe forever, so after a model download completed the router
// NEVER picked on-device until an app restart. It must re-probe while false and
// only cache a confirmed-true result.
test('available() re-probes after a false result (does NOT cache false)', async () => {
	const state = { available: false };
	const provider = new OnDeviceGemmaProvider({ bridge: bridge(state) });

	assert.equal(await provider.available(), false, 'model not ready yet');

	state.available = true; // model finished downloading + verified
	assert.equal(await provider.available(), true, 'must re-probe and see the model become available');
});

test('available() caches a confirmed-true result', async () => {
	const state = { available: true };
	const provider = new OnDeviceGemmaProvider({ bridge: bridge(state) });

	assert.equal(await provider.available(), true);
	state.available = false; // even if the bridge flips, the positive is cached
	assert.equal(await provider.available(), true);
});

test('invalidateAvailability() forces a re-probe', async () => {
	const state = { available: true };
	const provider = new OnDeviceGemmaProvider({ bridge: bridge(state) });

	assert.equal(await provider.available(), true);
	state.available = false;
	provider.invalidateAvailability();
	assert.equal(await provider.available(), false, 'after invalidate it re-probes and sees unavailable');
});

test('no bridge → never available, never throws', async () => {
	const provider = new OnDeviceGemmaProvider({});
	assert.equal(await provider.available(), false);
});

test('a throwing bridge does not cache and does not crash', async () => {
	let throwIt = true;
	const provider = new OnDeviceGemmaProvider({
		bridge: {
			isAvailable: async () => {
				if (throwIt) throw new Error('transient');
				return true;
			},
			describeModel: async () => null,
			generate: async () => ({ text: '', truncated: false })
		}
	});
	assert.equal(await provider.available(), false, 'transient error → false, not cached');
	throwIt = false;
	assert.equal(await provider.available(), true, 're-probes after a transient failure');
});
