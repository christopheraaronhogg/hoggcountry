import assert from 'node:assert/strict';
import { test } from 'node:test';

import { urlBase64ToUint8Array } from './push-encoding.ts';

test('urlBase64ToUint8Array decodes a base64url VAPID key with restored padding', () => {
	// "hello" → base64 "aGVsbG8=" → base64url "aGVsbG8" (no padding).
	const bytes = urlBase64ToUint8Array('aGVsbG8');
	assert.deepEqual([...bytes], [...Buffer.from('hello')]);
});

test('urlBase64ToUint8Array maps base64url -/_ back to +//', () => {
	// 0xFB 0xFF base64 = "+/8=", base64url = "-_8".
	const bytes = urlBase64ToUint8Array('-_8');
	assert.deepEqual([...bytes], [0xfb, 0xff]);
});

test('urlBase64ToUint8Array round-trips a 65-byte P-256 public key length', () => {
	// Real VAPID public keys are 65 raw bytes (uncompressed EC point) → 87 base64url chars.
	const raw = Buffer.alloc(65, 7);
	const b64url = raw.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
	const bytes = urlBase64ToUint8Array(b64url);
	assert.equal(bytes.length, 65);
	assert.deepEqual([...bytes], [...raw]);
});
