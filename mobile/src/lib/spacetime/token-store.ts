type PreferenceStore = {
	get(options: { key: string }): Promise<{ value: string | null }>;
	set(options: { key: string; value: string }): Promise<void>;
};

export interface SpacetimeTokenHost {
	Capacitor?: { isNativePlatform?: () => boolean };
	localStorage?: Pick<Storage, 'getItem' | 'setItem'>;
}

export interface SpacetimeTokenStoreOptions {
	key?: string;
	getHost?: () => SpacetimeTokenHost | null;
	createNativeAdapter?: () => Promise<PreferenceStore>;
}

const env = (import.meta as ImportMeta & { env?: Record<string, string | undefined> }).env;
const host = env?.PUBLIC_SPACETIMEDB_HOST ?? '';
const dbName = env?.PUBLIC_SPACETIMEDB_DB_NAME ?? '';
export const spacetimeTokenKey = host && dbName ? `${host}/${dbName}/mobile_auth_token` : 'spacetime/mobile-disabled';

function defaultHost(): SpacetimeTokenHost | null {
	if (typeof window === 'undefined') return null;
	return window;
}

async function defaultNativeAdapter(): Promise<PreferenceStore> {
	const { Preferences } = await import('@capacitor/preferences');
	return Preferences;
}

function isNativeHost(host: SpacetimeTokenHost | null): boolean {
	try {
		return host?.Capacitor?.isNativePlatform?.() === true;
	} catch {
		return false;
	}
}

function localGet(host: SpacetimeTokenHost | null, key: string): string | null {
	try {
		return host?.localStorage?.getItem(key) ?? null;
	} catch {
		return null;
	}
}

function localSet(host: SpacetimeTokenHost | null, key: string, value: string): void {
	try {
		host?.localStorage?.setItem(key, value);
	} catch {
		/* storage unavailable */
	}
}

export function createSpacetimeTokenStore(options: SpacetimeTokenStoreOptions = {}) {
	const key = options.key ?? spacetimeTokenKey;
	const getHost = options.getHost ?? defaultHost;
	const createNativeAdapter = options.createNativeAdapter ?? defaultNativeAdapter;
	let nativeAdapterPromise: Promise<PreferenceStore | null> | null = null;

	async function nativeAdapter(host: SpacetimeTokenHost | null): Promise<PreferenceStore | null> {
		if (!isNativeHost(host)) return null;
		nativeAdapterPromise ??= createNativeAdapter().catch(() => null);
		return nativeAdapterPromise;
	}

	return {
		async get(): Promise<string | null> {
			const currentHost = getHost();
			const adapter = await nativeAdapter(currentHost);
			if (!adapter) return localGet(currentHost, key);

			try {
				const nativeValue = (await adapter.get({ key })).value;
				if (nativeValue !== null) return nativeValue;
			} catch {
				return localGet(currentHost, key);
			}

			const localValue = localGet(currentHost, key);
			if (localValue !== null) {
				try {
					await adapter.set({ key, value: localValue });
				} catch {
					/* Preferences adoption failed; localStorage remains rollback-safe. */
				}
			}
			return localValue;
		},
		async set(token: string): Promise<void> {
			const currentHost = getHost();
			const adapter = await nativeAdapter(currentHost);
			if (adapter) {
				try {
					await adapter.set({ key, value: token });
					return;
				} catch {
					/* fall back to localStorage below */
				}
			}
			localSet(currentHost, key, token);
		}
	};
}

const store = createSpacetimeTokenStore();

export async function getSpacetimeToken(): Promise<string | null> {
	return store.get();
}

export async function setSpacetimeToken(token: string): Promise<void> {
	await store.set(token);
}
