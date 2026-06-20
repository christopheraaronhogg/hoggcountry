import {
	createCapacitorPreferencesAdapter,
	type PersistenceAdapter
} from './scout/context-pack-store.ts';

export type { PersistenceAdapter } from './scout/context-pack-store.ts';

declare global {
	interface Window {
		Capacitor?: { isNativePlatform?: () => boolean };
	}
}

export interface MobilePersistenceHost {
	Capacitor?: { isNativePlatform?: () => boolean };
	localStorage: Pick<Storage, 'getItem' | 'setItem'>;
}

export interface MobilePersistenceOptions {
	getHost?: () => MobilePersistenceHost | null;
	createNativeAdapter?: () => Promise<PersistenceAdapter>;
	warn?: (message: string, error: unknown) => void;
}

function defaultHost(): MobilePersistenceHost | null {
	if (typeof window === 'undefined') return null;
	return window;
}

async function defaultNativeAdapter(): Promise<PersistenceAdapter> {
	const { Preferences } = await import('@capacitor/preferences');
	return createCapacitorPreferencesAdapter(Preferences);
}

export function createMobilePersistenceAdapter(options: MobilePersistenceOptions = {}): PersistenceAdapter {
	const getHost = options.getHost ?? defaultHost;
	const createNativeAdapter = options.createNativeAdapter ?? defaultNativeAdapter;
	const warn = options.warn ?? console.warn;
	let nativeAdapterPromise: Promise<PersistenceAdapter | null> | null = null;

	async function nativeAdapter(): Promise<PersistenceAdapter | null> {
		const host = getHost();
		if (!host?.Capacitor?.isNativePlatform?.()) return null;
		nativeAdapterPromise ??= createNativeAdapter().catch(() => null);
		return nativeAdapterPromise;
	}

	return {
		async get(key: string) {
			const host = getHost();
			const adapter = await nativeAdapter();
			const nativeValue = adapter ? await adapter.get(key) : null;
			return nativeValue ?? host?.localStorage.getItem(key) ?? null;
		},
		async set(key: string, value: string) {
			const host = getHost();
			const adapter = await nativeAdapter();
			if (adapter) {
				try {
					await adapter.set(key, value);
				} catch (error) {
					warn('Capacitor Preferences write failed; keeping localStorage mirror only.', error);
				}
			}
			host?.localStorage.setItem(key, value);
		}
	};
}
