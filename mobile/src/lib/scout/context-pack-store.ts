import type {
	CachedWeather,
	ContextPack,
	ContextPackStore,
	HikerProfile,
	LoadoutItem
} from './types.ts';
import { cloneDefaultContextPack } from './default-pack.ts';

export interface PersistenceAdapter {
	get(key: string): Promise<string | null>;
	set(key: string, value: string): Promise<void>;
}

export interface InMemoryContextPackStoreOptions {
	initial?: ContextPack;
	adapter?: PersistenceAdapter;
	storageKey?: string;
}

const DEFAULT_STORAGE_KEY = 'hoggcountry:scout:context-pack:v1';

export class InMemoryContextPackStore implements ContextPackStore {
	private pack: ContextPack;
	private listeners = new Set<(pack: ContextPack) => void>();
	private adapter?: PersistenceAdapter;
	private storageKey: string;

	constructor(options: InMemoryContextPackStoreOptions = {}) {
		this.pack = options.initial ?? cloneDefaultContextPack();
		this.adapter = options.adapter;
		this.storageKey = options.storageKey ?? DEFAULT_STORAGE_KEY;
	}

	async load(): Promise<ContextPack> {
		if (!this.adapter) return this.pack;

		const raw = await this.adapter.get(this.storageKey).catch(() => null);
		if (raw) {
			try {
				const parsed = JSON.parse(raw) as ContextPack;
				this.pack = { ...this.pack, ...parsed };
			} catch {
				// keep current pack on parse failure
			}
		}

		return this.pack;
	}

	get(): ContextPack {
		return this.pack;
	}

	async updateHiker(patch: Partial<HikerProfile>): Promise<void> {
		this.pack = {
			...this.pack,
			hiker: { ...this.pack.hiker, ...patch }
		};
		await this.persist();
		this.emit();
	}

	async updateWeather(weather: CachedWeather | null): Promise<void> {
		this.pack = { ...this.pack, weather };
		await this.persist();
		this.emit();
	}

	async updateLoadout(items: LoadoutItem[]): Promise<void> {
		this.pack = { ...this.pack, loadout: items };
		await this.persist();
		this.emit();
	}

	subscribe(listener: (pack: ContextPack) => void): () => void {
		this.listeners.add(listener);
		return () => {
			this.listeners.delete(listener);
		};
	}

	private emit() {
		for (const listener of this.listeners) {
			listener(this.pack);
		}
	}

	private async persist() {
		if (!this.adapter) return;
		try {
			await this.adapter.set(this.storageKey, JSON.stringify(this.pack));
		} catch {
			// persistence failures are non-fatal; the in-memory pack still serves answers
		}
	}
}

export function createCapacitorPreferencesAdapter(preferences: {
	get(opts: { key: string }): Promise<{ value: string | null }>;
	set(opts: { key: string; value: string }): Promise<void>;
}): PersistenceAdapter {
	return {
		async get(key: string) {
			const result = await preferences.get({ key });
			return result.value;
		},
		async set(key: string, value: string) {
			await preferences.set({ key, value });
		}
	};
}
