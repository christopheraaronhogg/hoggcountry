import { browser } from '$app/environment';
import { secureGet, secureSet, secureRemove } from './secureStore';
import { apiRequest, type ApiError } from './api';

// Phase 0 of the cloud-backup plan (docs/plans/2026-06-23-cloud-backup-sync.md):
// the OPT-IN account layer that makes backup + multi-device restore possible.
// Backup is off until the user signs in; the app is fully usable signed-out.
// Token + device id are kept in Capacitor Preferences only (see secureStore).

const TOKEN_KEY = 'hc-cloud-token';
const DEVICE_KEY = 'hc-device-id';
const DEVICE_NAME = 'Hogg Country (iOS)';

export interface CloudUser {
	name: string;
	email: string;
}

type Status = 'unknown' | 'signed-out' | 'signed-in';

class CloudAuth {
	status = $state<Status>('unknown');
	user = $state<CloudUser | null>(null);
	busy = $state(false);
	error = $state<string | null>(null);
	#token: string | null = null;

	get signedIn(): boolean {
		return this.status === 'signed-in';
	}

	/** Restore a saved session on boot (validates the token if online). */
	async init(): Promise<void> {
		if (!browser || this.status !== 'unknown') return;
		this.#token = await secureGet(TOKEN_KEY);
		if (!this.#token) {
			this.status = 'signed-out';
			return;
		}
		try {
			const me = await apiRequest<{ user: CloudUser }>('/auth/me', { token: this.#token });
			this.user = me.user;
			this.status = 'signed-in';
		} catch (e) {
			// Offline → keep the token and treat as signed-in (backup resumes later);
			// a real 401 → the token is dead, sign out.
			if ((e as ApiError).status === 401) {
				await this.#clear();
			} else {
				this.status = 'signed-in';
			}
		}
	}

	async register(input: { name: string; email: string; password: string }): Promise<boolean> {
		return this.#run(async () => {
			const data = await apiRequest<{ token: string; user: CloudUser }>('/auth/register', {
				method: 'POST',
				body: {
					name: input.name.trim(),
					email: input.email.trim(),
					password: input.password,
					password_confirmation: input.password,
					device_name: DEVICE_NAME
				}
			});
			await this.#onAuthed(data.token, data.user);
		});
	}

	async login(input: { email: string; password: string }): Promise<boolean> {
		return this.#run(async () => {
			const data = await apiRequest<{ token: string; user: CloudUser }>('/auth/login', {
				method: 'POST',
				body: { email: input.email.trim(), password: input.password, device_name: DEVICE_NAME }
			});
			await this.#onAuthed(data.token, data.user);
		});
	}

	// Sign in with Apple — Phase 0 wiring placeholder. The native flow needs the
	// @capacitor-community/apple-sign-in plugin (iOS capability) + a backend
	// /auth/apple/handoff route mirroring the existing Google Socialite flow, then
	// onAuthed(token, user) with the returned Sanctum token. Surfaced honestly until
	// those land so the button isn't a silent no-op.
	async signInWithApple(): Promise<void> {
		this.error = 'Sign in with Apple runs in the installed iOS app (needs the native sign-in step).';
	}

	async logout(): Promise<void> {
		if (this.#token) {
			try {
				await apiRequest('/auth/logout', { method: 'POST', token: this.#token });
			} catch {
				/* best effort */
			}
		}
		await this.#clear();
	}

	get token(): string | null {
		return this.#token;
	}

	/** Stable per-install device UUID (binds this device to the account). */
	async deviceId(): Promise<string> {
		let id = await secureGet(DEVICE_KEY);
		if (!id) {
			id = crypto.randomUUID();
			await secureSet(DEVICE_KEY, id);
		}
		return id;
	}

	async #onAuthed(token: string, user: CloudUser): Promise<void> {
		this.#token = token;
		this.user = user;
		this.status = 'signed-in';
		await secureSet(TOKEN_KEY, token);
		await this.ensureDeviceRegistered();
	}

	/**
	 * Bind this device to the account (idempotent server-side). Best-effort at
	 * sign-in; the sync engine also calls this to recover if a push ever comes
	 * back `unknown_device` (e.g. the device row was pruned).
	 */
	async ensureDeviceRegistered(): Promise<void> {
		if (!this.#token) return;
		try {
			await apiRequest('/devices/register', {
				method: 'POST',
				token: this.#token,
				body: { device_id: await this.deviceId(), platform: 'ios', device_name: DEVICE_NAME }
			});
		} catch {
			/* device bind is non-fatal; sync still works, retried later */
		}
	}

	async #clear(): Promise<void> {
		this.#token = null;
		this.user = null;
		this.status = 'signed-out';
		await secureRemove(TOKEN_KEY);
	}

	async #run(fn: () => Promise<void>): Promise<boolean> {
		this.busy = true;
		this.error = null;
		try {
			await fn();
			return true;
		} catch (e) {
			this.error = this.#friendly(e as ApiError);
			return false;
		} finally {
			this.busy = false;
		}
	}

	#friendly(err: ApiError): string {
		switch (err?.code) {
			case 'registration_closed':
				return 'Sign-ups are invite-only right now — ask Chris for an invite, or sign in.';
			case 'account_exists':
				return 'An account already exists for that email — sign in instead.';
			case 'offline':
				return "You're offline — your hike is saved on this phone; it'll back up when you reconnect.";
		}
		if (err?.status === 401 || err?.status === 422) return 'Email or password looks off — give it another try.';
		return err?.message || 'Something went wrong. Try again.';
	}
}

export const cloudAuth = new CloudAuth();
