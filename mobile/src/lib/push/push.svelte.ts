import { cloudAuth } from '$lib/cloud/auth.svelte';
import { apiRequest } from '$lib/cloud/api';
import { urlBase64ToUint8Array } from '$lib/push/push-encoding';

// Push-notification foundation — Phase 1: PWA Web Push.
//
// Opt-in, signed-in-only, device-local. A signed-out app never touches this.
// The user toggles it on (a real gesture, required for the permission prompt),
// we request Notification permission, subscribe through the service worker's
// PushManager with our VAPID public key, and register the subscription on the
// existing per-device row (POST /api/v1/devices/push). The Laravel sender then
// pushes to that subscription. iOS native (APNs via @capacitor/push-notifications)
// is Phase 2 — on a native shell this manager reports `unavailable` with a reason
// so the UI can point at the app build instead. Everything degrades gracefully:
// no support, no VAPID, or signed-out → a no-op, never a throw on the boot path.
// See docs/plans/2026-06-24-push-notifications-foundation.md.

const OPT_IN_KEY = 'hc-push-optin';

export type PushPermission = 'default' | 'granted' | 'denied' | 'unsupported';

function vapidPublicKey(): string {
	const key = (import.meta as { env?: Record<string, string | undefined> }).env?.PUBLIC_VAPID_PUBLIC_KEY;
	return typeof key === 'string' ? key.trim() : '';
}

function isNativeShell(): boolean {
	const cap = (globalThis as { Capacitor?: { isNativePlatform?: () => boolean } }).Capacitor;
	return cap?.isNativePlatform?.() === true;
}

function webPushSupported(): boolean {
	return (
		typeof navigator !== 'undefined' &&
		'serviceWorker' in navigator &&
		typeof window !== 'undefined' &&
		'PushManager' in window &&
		'Notification' in window
	);
}

class PushManagerStore {
	/** Notification permission, or 'unsupported' where Web Push can't run. */
	permission = $state<PushPermission>('unsupported');
	/** Subscribed AND opted in on this device. */
	enabled = $state(false);
	busy = $state(false);
	error = $state<string | null>(null);
	/** Why push can't be offered here (e.g. native shell, no VAPID), for the UI. */
	unavailableReason = $state<string | null>(null);

	#started = false;

	/** Can the user turn push on here? (supported, VAPID configured, signed in.) */
	get available(): boolean {
		return this.unavailableReason === null && this.permission !== 'unsupported';
	}

	/** Reflect current platform/permission/subscription state. Safe to call anytime. */
	async refresh(): Promise<void> {
		if (isNativeShell()) {
			this.permission = 'unsupported';
			this.unavailableReason = 'On iOS, notifications come with the installed app build (coming soon).';
			this.enabled = false;
			return;
		}
		if (!webPushSupported()) {
			this.permission = 'unsupported';
			this.unavailableReason = 'This browser does not support push notifications. Install the app to your home screen.';
			this.enabled = false;
			return;
		}
		if (!vapidPublicKey()) {
			this.permission = Notification.permission as PushPermission;
			this.unavailableReason = 'Push is not configured on this build yet.';
			this.enabled = false;
			return;
		}
		this.unavailableReason = null;
		this.permission = Notification.permission as PushPermission;
		const sub = await this.#existingSubscription();
		this.enabled = Boolean(sub) && this.#optedIn();
	}

	/**
	 * Turn push on: request permission, subscribe, and register with the backend.
	 * Requires a signed-in account (push needs a place to send to) and should be
	 * called from a user gesture so the permission prompt is allowed.
	 */
	async enable(): Promise<boolean> {
		this.error = null;
		if (!this.available) return false;
		if (!cloudAuth.signedIn) {
			this.error = 'Sign in first — notifications go to your account.';
			return false;
		}
		this.busy = true;
		try {
			const permission = await Notification.requestPermission();
			this.permission = permission as PushPermission;
			if (permission !== 'granted') {
				this.error = permission === 'denied' ? 'Notifications are blocked in your browser settings.' : null;
				return false;
			}

			const registration = await navigator.serviceWorker.ready;
			const sub =
				(await registration.pushManager.getSubscription()) ??
				(await registration.pushManager.subscribe({
					userVisibleOnly: true,
					// Cast: the lib types want BufferSource<ArrayBuffer>; our Uint8Array is byte-identical.
					applicationServerKey: urlBase64ToUint8Array(vapidPublicKey()) as BufferSource
				}));

			await this.#registerWithBackend(sub);
			this.#setOptIn(true);
			this.enabled = true;
			return true;
		} catch (error) {
			this.error = error instanceof Error ? error.message : 'Could not enable notifications.';
			return false;
		} finally {
			this.busy = false;
		}
	}

	/** Turn push off: unsubscribe locally and drop the subscription server-side. */
	async disable(): Promise<void> {
		this.busy = true;
		this.error = null;
		try {
			const sub = await this.#existingSubscription();
			if (sub) {
				await this.#unregisterWithBackend(sub).catch(() => {});
				await sub.unsubscribe().catch(() => {});
			}
			this.#setOptIn(false);
			this.enabled = false;
		} finally {
			this.busy = false;
		}
	}

	/**
	 * Re-affirm the subscription with the backend after sign-in (the device row may
	 * have been pruned, or this is a new sign-in on a browser that already granted
	 * permission). No prompt, no-op unless already opted in + subscribed.
	 */
	async resync(): Promise<void> {
		if (this.#started) return;
		this.#started = true;
		await this.refresh();
		if (this.available && this.#optedIn() && cloudAuth.signedIn) {
			const sub = await this.#existingSubscription();
			if (sub) await this.#registerWithBackend(sub).catch(() => {});
		}
	}

	async #existingSubscription(): Promise<PushSubscription | null> {
		if (!webPushSupported()) return null;
		try {
			const registration = await navigator.serviceWorker.ready;
			return await registration.pushManager.getSubscription();
		} catch {
			return null;
		}
	}

	#optedIn(): boolean {
		try {
			return localStorage.getItem(OPT_IN_KEY) === '1';
		} catch {
			return false;
		}
	}

	#setOptIn(on: boolean): void {
		try {
			if (on) localStorage.setItem(OPT_IN_KEY, '1');
			else localStorage.removeItem(OPT_IN_KEY);
		} catch {
			/* private mode / no storage — non-fatal */
		}
	}

	async #registerWithBackend(sub: PushSubscription): Promise<void> {
		const json = sub.toJSON();
		await apiRequest('/devices/push', {
			method: 'POST',
			token: cloudAuth.token,
			body: {
				device_id: await cloudAuth.deviceId(),
				provider: 'webpush',
				subscription: { endpoint: sub.endpoint, keys: json.keys ?? {} }
			}
		});
	}

	async #unregisterWithBackend(sub: PushSubscription): Promise<void> {
		await apiRequest('/devices/push', {
			method: 'DELETE',
			token: cloudAuth.token,
			body: { device_id: await cloudAuth.deviceId(), endpoint: sub.endpoint }
		});
	}
}

export const pushManager = new PushManagerStore();
