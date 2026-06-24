import { cloudAuth } from '$lib/cloud/auth.svelte';
import { apiRequest } from '$lib/cloud/api';
import { urlBase64ToUint8Array } from '$lib/push/push-encoding';
import type { Token, ActionPerformed } from '@capacitor/push-notifications';

// Push-notification foundation — two transports, one opt-in manager.
//
//   • PWA / Web Push (Phase 1): Notification permission → SW pushManager.subscribe
//     with our VAPID public key → POST the subscription. Works on the installed PWA
//     (iOS 16.4+ delivers Web Push to home-screen PWAs).
//   • iOS native / APNs (Phase 2): @capacitor/push-notifications requestPermissions
//     → register → the APNs token arrives on the 'registration' listener → POST it.
//
// Both converge on the existing per-device row (POST/DELETE /api/v1/devices/push).
// Opt-in, signed-in-only, device-local, never auto-sends. Everything degrades to a
// no-op (no support, no VAPID, no plugin, signed out) — never throws on boot.
// See docs/plans/2026-06-24-push-notifications-foundation.md.

const OPT_IN_KEY = 'hc-push-optin';

export type PushPermission = 'default' | 'granted' | 'denied' | 'unsupported';
type Transport = 'webpush' | 'apns' | 'none';

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

async function loadPushPlugin() {
	const mod = await import('@capacitor/push-notifications');
	return mod.PushNotifications;
}

function mapApnsPermission(state: string): PushPermission {
	if (state === 'granted') return 'granted';
	if (state === 'denied') return 'denied';
	return 'default';
}

class PushManagerStore {
	/** Notification permission, or 'unsupported' where push can't run. */
	permission = $state<PushPermission>('unsupported');
	/** Subscribed/registered AND opted in on this device. */
	enabled = $state(false);
	busy = $state(false);
	error = $state<string | null>(null);
	/** Why push can't be offered here (no support, no VAPID), for the UI. */
	unavailableReason = $state<string | null>(null);

	#started = false;
	#transport: Transport = 'none';
	#apnsListenersReady = false;

	/** Can the user turn push on here? (a usable transport + signed in). */
	get available(): boolean {
		return this.unavailableReason === null && this.#transport !== 'none';
	}

	/** Reflect current platform/permission/subscription state. Safe to call anytime. */
	async refresh(): Promise<void> {
		if (isNativeShell()) {
			try {
				const push = await loadPushPlugin();
				const perm = await push.checkPermissions();
				this.#transport = 'apns';
				this.unavailableReason = null;
				this.permission = mapApnsPermission(perm.receive);
				this.enabled = this.permission === 'granted' && this.#optedIn();
			} catch {
				this.#transport = 'none';
				this.permission = 'unsupported';
				this.unavailableReason = 'Push notifications are unavailable on this device.';
				this.enabled = false;
			}
			return;
		}
		if (!webPushSupported()) {
			this.#transport = 'none';
			this.permission = 'unsupported';
			this.unavailableReason = 'This browser does not support push. Install the app to your home screen.';
			this.enabled = false;
			return;
		}
		if (!vapidPublicKey()) {
			this.#transport = 'none';
			this.permission = Notification.permission as PushPermission;
			this.unavailableReason = 'Push is not configured on this build yet.';
			this.enabled = false;
			return;
		}
		this.#transport = 'webpush';
		this.unavailableReason = null;
		this.permission = Notification.permission as PushPermission;
		const sub = await this.#existingSubscription();
		this.enabled = Boolean(sub) && this.#optedIn();
	}

	/**
	 * Turn push on: request permission and register with the backend. Requires a
	 * signed-in account, and should be called from a user gesture (the OS permission
	 * prompt requires one).
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
			return this.#transport === 'apns' ? await this.#enableApns() : await this.#enableWebPush();
		} catch (error) {
			this.error = error instanceof Error ? error.message : 'Could not enable notifications.';
			return false;
		} finally {
			this.busy = false;
		}
	}

	/** Turn push off: drop the registration locally + server-side. */
	async disable(): Promise<void> {
		this.busy = true;
		this.error = null;
		try {
			if (this.#transport === 'webpush') {
				const sub = await this.#existingSubscription();
				if (sub) await sub.unsubscribe().catch(() => {});
			}
			await this.#removePushFromBackend().catch(() => {});
			this.#setOptIn(false);
			this.enabled = false;
		} finally {
			this.busy = false;
		}
	}

	/**
	 * After sign-in / app open: re-affirm the registration with the backend (the
	 * device row may have been pruned, or the APNs token rotated). No prompt; no-op
	 * unless already opted in + signed in.
	 */
	async resync(): Promise<void> {
		if (this.#started) return;
		this.#started = true;
		await this.refresh();
		if (!this.available || !this.#optedIn() || !cloudAuth.signedIn) return;
		try {
			if (this.#transport === 'apns') {
				const push = await loadPushPlugin();
				await this.#setupApnsListeners();
				if (this.permission === 'granted') await push.register();
			} else {
				const sub = await this.#existingSubscription();
				if (sub) await this.#registerWebPushWithBackend(sub);
			}
		} catch {
			/* best effort */
		}
	}

	// --- iOS APNs -------------------------------------------------------------
	async #enableApns(): Promise<boolean> {
		const push = await loadPushPlugin();
		await this.#setupApnsListeners();
		const perm = await push.requestPermissions();
		this.permission = mapApnsPermission(perm.receive);
		if (this.permission !== 'granted') {
			this.error = this.permission === 'denied' ? 'Notifications are off in iOS Settings.' : null;
			return false;
		}
		// The APNs token arrives on the 'registration' listener → backend.
		this.#setOptIn(true);
		await push.register();
		this.enabled = true;
		return true;
	}

	async #setupApnsListeners(): Promise<void> {
		if (this.#apnsListenersReady) return;
		this.#apnsListenersReady = true;
		const push = await loadPushPlugin();
		await push.addListener('registration', (token: Token) => {
			if (this.#optedIn()) void this.#registerApnsWithBackend(token.value);
		});
		await push.addListener('registrationError', () => {
			this.error = 'Could not register this device for notifications.';
		});
		await push.addListener('pushNotificationActionPerformed', (action: ActionPerformed) => {
			const url = (action.notification.data as { url?: string } | undefined)?.url;
			if (url && typeof window !== 'undefined') window.location.assign(url);
		});
	}

	async #registerApnsWithBackend(token: string): Promise<void> {
		await apiRequest('/devices/push', {
			method: 'POST',
			token: cloudAuth.token,
			body: { device_id: await cloudAuth.deviceId(), provider: 'apns', token }
		});
	}

	// --- PWA Web Push ---------------------------------------------------------
	async #enableWebPush(): Promise<boolean> {
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
		await this.#registerWebPushWithBackend(sub);
		this.#setOptIn(true);
		this.enabled = true;
		return true;
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

	async #registerWebPushWithBackend(sub: PushSubscription): Promise<void> {
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

	// --- shared ---------------------------------------------------------------
	async #removePushFromBackend(): Promise<void> {
		await apiRequest('/devices/push', {
			method: 'DELETE',
			token: cloudAuth.token,
			body: { device_id: await cloudAuth.deviceId() }
		});
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
}

export const pushManager = new PushManagerStore();
