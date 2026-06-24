// Pure Web Push encoding helpers (no runes), so they're unit-testable under node:test.

/**
 * Convert a base64url-encoded VAPID public key into the Uint8Array that
 * `pushManager.subscribe({ applicationServerKey })` requires. base64url uses
 * `-`/`_` instead of `+`/`/` and drops `=` padding, so we restore both before
 * decoding. Getting this wrong silently breaks the subscription.
 */
export function urlBase64ToUint8Array(base64String: string): Uint8Array {
	const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
	const base64 = (base64String + padding).replace(/-/gu, '+').replace(/_/gu, '/');
	const raw = atob(base64);
	const out = new Uint8Array(raw.length);
	for (let i = 0; i < raw.length; i += 1) out[i] = raw.charCodeAt(i);
	return out;
}
