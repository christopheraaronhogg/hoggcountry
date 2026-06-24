import test from 'node:test';
import assert from 'node:assert/strict';
import { createCloudScoutBridge } from './cloud-scout-bridge.ts';

function jsonResponse(body: unknown, status = 200): Response {
	return new Response(JSON.stringify(body), {
		status,
		headers: { 'Content-Type': 'application/json' }
	});
}

test('isReachable is false when signed out (no token)', async () => {
	const bridge = createCloudScoutBridge({ getToken: () => null, isOnline: () => true });
	assert.equal(await bridge.isReachable(), false);
});

test('isReachable is false when offline even with a token', async () => {
	const bridge = createCloudScoutBridge({ getToken: () => 'tok', isOnline: () => false });
	assert.equal(await bridge.isReachable(), false);
});

test('isReachable is true when signed in and online', async () => {
	const bridge = createCloudScoutBridge({ getToken: () => 'tok', isOnline: () => true });
	assert.equal(await bridge.isReachable(), true);
});

test('ask posts the prompt + payload with the bearer token and unwraps the answer', async () => {
	const calls: Array<{ url: string; init: RequestInit }> = [];
	const original = globalThis.fetch;
	globalThis.fetch = (async (url: string | URL, init: RequestInit = {}) => {
		calls.push({ url: String(url), init });
		return jsonResponse({
			data: { answer: 'Water is 0.3mi north.', confidence: 'medium', contextUsed: ['weather'] },
			error: null
		});
	}) as typeof fetch;

	try {
		const bridge = createCloudScoutBridge({ getToken: () => 'tok-123', isOnline: () => true });
		const result = await bridge.ask({ prompt: 'where is water?', payload: { weather: { tempF: 60 } } });

		assert.equal(result.answer, 'Water is 0.3mi north.');
		assert.equal(result.confidence, 'medium');
		assert.deepEqual(result.contextUsed, ['weather']);

		assert.equal(calls.length, 1);
		assert.match(calls[0].url, /\/scout\/ask$/);
		assert.equal(calls[0].init.method, 'POST');
		const headers = calls[0].init.headers as Record<string, string>;
		assert.equal(headers.Authorization, 'Bearer tok-123');
		const body = JSON.parse(calls[0].init.body as string);
		assert.equal(body.prompt, 'where is water?');
		assert.deepEqual(body.payload, { weather: { tempF: 60 } });
	} finally {
		globalThis.fetch = original;
	}
});

test('ask throws when signed out rather than calling the API', async () => {
	let called = false;
	const original = globalThis.fetch;
	globalThis.fetch = (async () => {
		called = true;
		return jsonResponse({ data: null, error: null });
	}) as typeof fetch;

	try {
		const bridge = createCloudScoutBridge({ getToken: () => null, isOnline: () => true });
		await assert.rejects(() => bridge.ask({ prompt: 'x', payload: {} }), /sign-in/i);
		assert.equal(called, false);
	} finally {
		globalThis.fetch = original;
	}
});
