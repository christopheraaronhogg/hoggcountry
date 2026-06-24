import { browser } from '$app/environment';

// The cloud auth token + device id live in Capacitor Preferences (native
// UserDefaults on iOS), NEVER localStorage — the token grants full account
// access. (Upgrading to the iOS Keychain via a secure-storage plugin is a
// later hardening step; Preferences already keeps it out of the web/JS store.)

type PreferenceStore = {
	get(options: { key: string }): Promise<{ value: string | null }>;
	set(options: { key: string; value: string }): Promise<void>;
	remove(options: { key: string }): Promise<void>;
};

declare global {
	interface Window {
		Capacitor?: {
			isNativePlatform?: () => boolean;
		};
	}
}

async function prefs(): Promise<PreferenceStore | null> {
	if (!browser || window.Capacitor?.isNativePlatform?.() !== true) return null;
	try {
		const { Preferences } = await import('@capacitor/preferences');
		return {
			get: (options) => Preferences.get(options),
			set: (options) => Preferences.set(options),
			remove: (options) => Preferences.remove(options)
		};
	} catch {
		return null;
	}
}

export async function secureGet(key: string): Promise<string | null> {
	const p = await prefs();
	if (!p) return null;
	try {
		return (await p.get({ key })).value ?? null;
	} catch {
		return null;
	}
}

export async function secureSet(key: string, value: string): Promise<void> {
	const p = await prefs();
	if (!p) return;
	try {
		await p.set({ key, value });
	} catch {
		/* storage unavailable */
	}
}

export async function secureRemove(key: string): Promise<void> {
	const p = await prefs();
	if (!p) return;
	try {
		await p.remove({ key });
	} catch {
		/* storage unavailable */
	}
}
