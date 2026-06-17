import type {
	CachedWeather,
	ContextPack,
	ContextPackStatus,
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
	private statusListeners = new Set<(status: ContextPackStatus) => void>();
	private adapter?: PersistenceAdapter;
	private storageKey: string;
	private status: ContextPackStatus = {
		state: 'fallback',
		label: 'Bundled pilot pack',
		detail: 'Using the baked Scout field pack until a fresh pack is saved on this phone.',
		lastLoadedAt: null,
		validUntil: null,
		source: 'bundled'
	};

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
				this.setStatus(statusFromPack(this.pack, 'saved'));
			} catch {
				// keep current pack on parse failure
			}
		}

		return this.pack;
	}

	get(): ContextPack {
		return this.pack;
	}

	getStatus(): ContextPackStatus {
		return this.status;
	}

	async refreshFromEndpoint(endpoint: string, fetcher: typeof fetch = fetch): Promise<ContextPack> {
		this.setStatus({
			...this.status,
			state: 'refreshing',
			label: 'Refreshing field pack',
			detail: 'Checking Hogg Country for the latest Dad pilot pack.',
			error: undefined
		});

		try {
			const response = await fetcher(endpoint, {
				cache: 'no-store',
				headers: { Accept: 'application/json' }
			});

			if (!response.ok) {
				throw new Error(`Field pack refresh failed (${response.status})`);
			}

			const remotePack = normalizeRemoteContextPack(await response.json());
			if (!remotePack) {
				throw new Error('Field pack response did not match the mobile ContextPack contract.');
			}

			this.pack = { ...this.pack, ...remotePack };
			await this.persist();
			this.setStatus(statusFromPack(this.pack, 'remote'));
			this.emit();
			return this.pack;
		} catch (error) {
			const message = error instanceof Error ? error.message : 'Could not refresh field pack.';
			this.setStatus({
				...statusFromPack(this.pack, this.status.source),
				state: this.pack.validUntil && Date.parse(this.pack.validUntil) < Date.now() ? 'stale' : 'error',
				label: this.pack.validUntil && Date.parse(this.pack.validUntil) < Date.now() ? 'Stale field pack' : 'Cached field pack',
				detail: `${message} Scout will keep using the saved pack and mark volatile answers for confirmation.`,
				error: message
			});
			return this.pack;
		}
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

	subscribeStatus(listener: (status: ContextPackStatus) => void): () => void {
		this.statusListeners.add(listener);
		return () => {
			this.statusListeners.delete(listener);
		};
	}

	private emit() {
		for (const listener of this.listeners) {
			listener(this.pack);
		}
	}

	private emitStatus() {
		for (const listener of this.statusListeners) {
			listener(this.status);
		}
	}

	private setStatus(status: ContextPackStatus) {
		this.status = status;
		this.emitStatus();
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

function isObject(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null;
}

function isContextPack(value: unknown): value is ContextPack {
	if (!isObject(value)) return false;
	if (!isObject(value.frame) || !isObject(value.hiker)) return false;
	if (!Array.isArray(value.water) || !Array.isArray(value.shelters) || !Array.isArray(value.towns)) return false;
	if (!Array.isArray(value.guideExcerpts) || !Array.isArray(value.loadout) || !Array.isArray(value.downloadedRegions)) return false;
	return typeof value.generatedAt === 'string';
}

function normalizeRemoteContextPack(payload: unknown): ContextPack | null {
	if (isContextPack(payload)) return payload;
	if (!isObject(payload)) return null;

	const direct = payload.context_pack ?? payload.contextPack;
	if (isContextPack(direct)) return direct;

	const data = payload.data;
	const meta = payload.meta;
	if (isObject(data)) {
		const fromData = data.context_pack ?? data.contextPack;
		if (isContextPack(fromData)) {
			const pack = fromData;
			return {
				...pack,
				validUntil: isObject(meta) && typeof meta.valid_until === 'string' ? meta.valid_until : pack.validUntil,
				sourceReceipts: isObject(meta) && Array.isArray(meta.source_receipts) ? meta.source_receipts : pack.sourceReceipts,
				pilotNotice: typeof data.pilot_notice === 'string' ? data.pilot_notice : pack.pilotNotice
			};
		}
	}

	return null;
}

function statusFromPack(pack: ContextPack, source: ContextPackStatus['source']): ContextPackStatus {
	const validUntilMs = pack.validUntil ? Date.parse(pack.validUntil) : Number.NaN;
	const stale = Number.isFinite(validUntilMs) && validUntilMs < Date.now();
	const loadedAt = pack.generatedAt || null;
	const label = stale ? 'Stale field pack' : source === 'remote' ? 'Field pack ready' : 'Saved field pack';
	const regions = pack.downloadedRegions.length ? pack.downloadedRegions.join(' · ') : 'No named regions';

	return {
		state: stale ? 'stale' : source === 'remote' ? 'ready' : 'saved',
		label,
		detail: `${regions}. ${pack.pilotNotice ?? 'Use receipts and refresh before safety-critical decisions.'}`,
		lastLoadedAt: loadedAt,
		validUntil: pack.validUntil ?? null,
		source
	};
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
