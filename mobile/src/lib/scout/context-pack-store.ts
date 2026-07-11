import type {
	CachedWeather,
	ContextPack,
	ContextPackStatus,
	ContextPackStore,
	HikerProfile,
	LocalDocumentReference,
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

export interface ContextPackPersistenceResult {
	state: 'persisted' | 'loaded-only';
	verified: boolean;
	error: string | null;
}

const DEFAULT_STORAGE_KEY = 'hoggcountry:scout:context-pack:v1';
const STORAGE_VERIFICATION_ERROR = 'Field pack storage verification failed.';

export class InMemoryContextPackStore implements ContextPackStore {
	private pack: ContextPack;
	private listeners = new Set<(pack: ContextPack) => void>();
	private statusListeners = new Set<(status: ContextPackStatus) => void>();
	private adapter?: PersistenceAdapter;
	private storageKey: string;
	private lastKnownGoodRaw: string | null = null;
	private persistenceResult: ContextPackPersistenceResult = loadedOnlyResult(null);
	private status: ContextPackStatus = {
		state: 'fallback',
		label: 'Bundled field pack',
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

		let raw: string | null;
		try {
			raw = await this.adapter.get(this.storageKey);
		} catch (error) {
			const message = errorMessage(error, 'Could not read saved field-pack storage.');
			this.persistenceResult = loadedOnlyResult(message);
			this.setStatus(storageReadFailureStatus(this.status, message));
			return this.pack;
		}

		if (raw) {
			const parsed = parseStoredContextPack(raw);
			if (parsed) {
				this.pack = { ...this.pack, ...parsed };
				this.lastKnownGoodRaw = raw;
				this.persistenceResult = persistedResult();
				this.setStatus(statusFromPack(this.pack, 'saved'));
			} else {
				const message = 'Saved field pack is invalid or incomplete.';
				this.persistenceResult = loadedOnlyResult(message);
				this.setStatus(storageReadFailureStatus(this.status, message));
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

	getPersistenceResult(): ContextPackPersistenceResult {
		return { ...this.persistenceResult };
	}

	async refreshFromEndpoint(endpoint: string, fetcher: typeof fetch = fetch): Promise<ContextPack> {
		this.setStatus({
			...this.status,
			state: 'refreshing',
			label: 'Refreshing field pack',
			detail: 'Checking Hogg Country for the latest field pack.',
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
			await this.persistCurrentPack('remote');
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
		await this.persistCurrentPack(this.status.source);
		this.emit();
	}

	async updateWeather(weather: CachedWeather | null): Promise<void> {
		this.pack = { ...this.pack, weather };
		await this.persistCurrentPack(this.status.source);
		this.emit();
	}

	async updateLoadout(items: LoadoutItem[]): Promise<void> {
		this.pack = { ...this.pack, loadout: items };
		await this.persistCurrentPack(this.status.source);
		this.emit();
	}

	async updateDocuments(documents: LocalDocumentReference[]): Promise<void> {
		this.pack = { ...this.pack, documents: documents.map((document) => ({ ...document })) };
		await this.persistCurrentPack(this.status.source);
		this.emit();
	}

	async replace(pack: ContextPack, source: ContextPackStatus['source'] = 'saved'): Promise<void> {
		this.pack = cloneContextPack(pack);
		await this.persistCurrentPack(source);
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

	private async persistCurrentPack(
		source: ContextPackStatus['source']
	): Promise<ContextPackPersistenceResult> {
		const result = await this.persist();
		if (result.state === 'persisted') {
			this.setStatus(statusFromPack(this.pack, source));
		} else {
			this.setStatus(
				persistenceFailureStatus(
					this.pack,
					source,
					result.error ?? 'Field pack storage is unavailable.',
					this.lastKnownGoodRaw !== null
				)
			);
		}
		return result;
	}

	private async persist(): Promise<ContextPackPersistenceResult> {
		if (!this.adapter) {
			this.persistenceResult = loadedOnlyResult('Persistent field-pack storage is unavailable.');
			return this.persistenceResult;
		}

		const nextRaw = JSON.stringify(this.pack);
		let previousRaw = this.lastKnownGoodRaw;

		if (!previousRaw) {
			try {
				const existingRaw = await this.adapter.get(this.storageKey);
				if (existingRaw && parseStoredContextPack(existingRaw)) {
					previousRaw = existingRaw;
					this.lastKnownGoodRaw = existingRaw;
				}
			} catch {
				// A verified new write can still recover from an unreadable old value.
			}
		}

		try {
			await this.adapter.set(this.storageKey, nextRaw);
			const verifiedRaw = await this.adapter.get(this.storageKey);
			if (verifiedRaw !== nextRaw) throw new Error(STORAGE_VERIFICATION_ERROR);

			this.lastKnownGoodRaw = nextRaw;
			this.persistenceResult = persistedResult();
			return this.persistenceResult;
		} catch (error) {
			let message = errorMessage(error, 'Field pack storage write failed.');

			if (previousRaw) {
				try {
					let storedRaw: string | null = null;
					try {
						storedRaw = await this.adapter.get(this.storageKey);
					} catch {
						// Restore defensively when the failed write cannot be inspected.
					}

					if (storedRaw !== previousRaw) {
						await this.adapter.set(this.storageKey, previousRaw);
						const restoredRaw = await this.adapter.get(this.storageKey);
						if (restoredRaw !== previousRaw) {
							throw new Error('Previous field-pack cache restoration could not be verified.');
						}
					}
				} catch (restoreError) {
					message = `${message} ${errorMessage(
						restoreError,
						'The previous saved pack could not be verified.'
					)}`;
				}
			}

			this.persistenceResult = loadedOnlyResult(message);
			return this.persistenceResult;
		}
	}
}

function cloneContextPack(pack: ContextPack): ContextPack {
	return JSON.parse(JSON.stringify(pack)) as ContextPack;
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

function parseStoredContextPack(raw: string): ContextPack | null {
	try {
		const parsed = JSON.parse(raw) as unknown;
		return isContextPack(parsed) ? parsed : null;
	} catch {
		return null;
	}
}

function persistedResult(): ContextPackPersistenceResult {
	return { state: 'persisted', verified: true, error: null };
}

function loadedOnlyResult(error: string | null): ContextPackPersistenceResult {
	return { state: 'loaded-only', verified: false, error };
}

function errorMessage(error: unknown, fallback: string): string {
	if (error instanceof Error && error.message) return error.message;
	if (typeof error === 'string' && error) return error;
	return fallback;
}

function storageReadFailureStatus(status: ContextPackStatus, error: string): ContextPackStatus {
	return {
		...status,
		state: 'error',
		label: 'Saved field pack unavailable',
		detail: `${error} Scout is using the bundled fallback pack instead.`,
		error
	};
}

function persistenceFailureStatus(
	pack: ContextPack,
	source: ContextPackStatus['source'],
	error: string,
	hasPreviousPack: boolean
): ContextPackStatus {
	const base = statusFromPack(pack, source);
	return {
		...base,
		state: base.state === 'stale' ? 'stale' : 'error',
		label:
			base.state === 'stale'
				? 'Stale field pack loaded for this session'
				: 'Field pack loaded for this session',
		detail: `This field pack is available in the running app but was not saved for offline use. ${
			hasPreviousPack
				? 'The previously saved pack is still available after restart.'
				: 'Refresh again before depending on this pack without service.'
		}`,
		error
	};
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
