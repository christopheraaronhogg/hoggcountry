import test from 'node:test';
import assert from 'node:assert/strict';
import {
	OnDeviceGemmaProvider,
	renderSystemContext,
	type OnDeviceGemmaBridge
} from './providers/on-device-gemma.ts';
import { cloneDefaultContextPack } from './default-pack.ts';

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

test('system context keeps Scout plain-spoken and avoids markdown/corny voice', () => {
	const pack = cloneDefaultContextPack();
	pack.hiker.currentMile = 0;
	pack.hiker.dayNumber = 1;

	const systemContext = renderSystemContext({
		prompt: 'Man I dunno how hard is today gonna be?',
		pack,
		toolInvocations: [
			{
				toolId: 'trail-distance',
				args: {},
				summary: 'Next 10 miles include candidate water and Hawk Mountain Shelter.',
				confidence: 'medium',
				receipts: []
			}
		],
		now: new Date('2026-06-20T12:00:00Z')
	});

	assert.match(systemContext, /plain-spoken/);
	assert.match(systemContext, /Do not use "howdy", "partner", "well now"/);
	assert.match(systemContext, /Answer the hiker's immediate question first/);
	assert.match(systemContext, /Use plain text only/);
	assert.match(systemContext, /Do not use Markdown headings, bold markers, tables, or long bullet lists/);
	assert.match(systemContext, /Never turn candidate water, shelters, towns, or weather into guarantees/);
	assert.match(systemContext, /For water questions, use the next_water tool finding as the answer's spine/);
	assert.match(systemContext, /When a source_search finding is labeled as a source skill/);
});
