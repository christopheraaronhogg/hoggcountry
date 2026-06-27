import type { GemmaModelDescriptor, OnDeviceGemmaBridge } from './providers/on-device-gemma.ts';

type ScoutGemmaAvailability = {
	available: boolean;
	modelId?: string;
	modelState?: ScoutGemmaModelStatus['state'];
	runtimeConfigured?: boolean;
	reason?: string;
};

type ScoutGemmaDescriptor = GemmaModelDescriptor & {
	available?: boolean;
};

export type ScoutGemmaModelStatus = {
	// Required fields — emitted on all platforms for every status response.
	modelId: string;
	state: 'unconfigured' | 'needs_download' | 'present_unverified' | 'ready';
	fileName: string;
	filePath: string;
	exists: boolean;
	bytesOnDevice: number;
	expectedBytes: number;
	checksumAlgorithm: string; // always 'SHA-256'
	checksumConfigured: boolean;
	/** True when a download URL endpoint exists (hasDownloadUrl). NOT "url OR checksum". */
	downloadConfigured: boolean;
	canDownload: boolean;
	/** False when the native app can manage model files but the runtime is not linked. */
	runtimeConfigured?: boolean;
	// Optional fields — present only when the relevant feature is configured.
	/** Only emitted when checksumConfigured is true. */
	expectedChecksum?: string;
	/** Only emitted when downloadConfigured is true. */
	url?: string;
	/** Only emitted when present. */
	reason?: string;
};

/** Status shape plus the {@code started} flag startModelDownload adds. */
type ScoutDownloadStartResult = ScoutGemmaModelStatus & { started?: boolean };

type ScoutGemmaPlugin = {
	isAvailable(): Promise<ScoutGemmaAvailability>;
	describeModel(): Promise<ScoutGemmaDescriptor | ScoutGemmaAvailability | null>;
	generate(input: {
		prompt: string;
		systemContext: string;
		maxTokens: number;
	}): Promise<{ text: string; truncated?: boolean }>;
	/** Eagerly initialize the native engine (off the main thread) so the first
	 *  chat turn doesn't carry the heavy, sometimes-flaky lazy LiteRT init. */
	warmUp?: () => Promise<{ warmed: boolean }>;
	getModelStatus?: () => Promise<ScoutGemmaModelStatus>;
	prepareModelDownload?: () => Promise<ScoutGemmaModelStatus>;
	/**
	 * Kicks off the foreground-service download and resolves IMMEDIATELY (the
	 * transfer is decoupled from this call so it survives the app closing). The
	 * terminal outcome arrives via the scoutModelDownload{Complete,Error,Cancelled}
	 * events. {@code started} is false when the model is already ready.
	 */
	startModelDownload?: () => Promise<ScoutDownloadStartResult>;
	cancelModelDownload?: () => Promise<{ cancelled: boolean }>;
	/** Whether a background download is in flight + its last known progress. */
	getDownloadState?: () => Promise<DownloadState>;
	/** Active network type + metered flag, for Wi-Fi-aware downloads. */
	getNetworkStatus?: () => Promise<NetworkStatus>;
	/** Native install-source diagnostics for release/TestFlight proof gates. */
	getInstallSource?: () => Promise<ScoutInstallSource>;
	/** Disable/restore native idle sleep during a long foreground Eval Lab run. */
	setEvalKeepAwake?: (input: { active: boolean }) => Promise<ScoutEvalKeepAwakeResult>;
	checkNotificationsPermission?: () => Promise<{ granted: boolean }>;
	requestNotificationsPermission?: () => Promise<{ granted: boolean }>;
	addListener?: {
		(
			eventName: 'scoutModelDownloadProgress',
			listener: (data: ModelDownloadProgress) => void
		): Promise<{ remove: () => Promise<void> }>;
		(
			eventName: 'scoutModelDownloadComplete',
			listener: (data: ScoutGemmaModelStatus) => void
		): Promise<{ remove: () => Promise<void> }>;
		(
			eventName: 'scoutModelDownloadError',
			listener: (data: { message: string }) => void
		): Promise<{ remove: () => Promise<void> }>;
		(eventName: 'scoutModelDownloadCancelled', listener: () => void): Promise<{
			remove: () => Promise<void>;
		}>;
		(eventName: 'scoutGenerateToken', listener: (data: { text: string }) => void): Promise<{
			remove: () => Promise<void>;
		}>;
	};
};

export type ModelDownloadProgress = {
	bytesDownloaded: number;
	/** -1 when the total size is not known ahead of time. */
	totalBytes: number;
};

export type NetworkStatus = {
	connected: boolean;
	/** True on cellular / hotspot — surface a cost warning before a big download. */
	metered: boolean;
	type: 'wifi' | 'cellular' | 'ethernet' | 'other' | 'none';
};

export type ScoutInstallSource = {
	type: string;
	platform?: string;
	detectedBy?: string;
	receiptPresent?: boolean;
	receiptLastPathComponent?: string | null;
	installerPackage?: string | null;
	debugBuild?: boolean;
	buildConfiguration?: string;
	error?: string;
};

export type DownloadState = {
	active: boolean;
	bytesDownloaded: number;
	totalBytes: number;
};

export type ScoutEvalKeepAwakeResult = {
	active: boolean;
	supported?: boolean;
	platform?: string;
};

export interface ScoutModelManager {
	getStatus(): Promise<ScoutGemmaModelStatus | null>;
	prepareDownload(): Promise<ScoutGemmaModelStatus | null>;
	/**
	 * Starts the download and resolves when it terminates (complete/cancelled) or
	 * rejects on error. The transfer runs in a native foreground service, so if the
	 * app is closed mid-download this promise is lost but the download continues;
	 * use {@link reattachDownload} on resume to re-observe it.
	 */
	startDownload(onProgress?: (progress: ModelDownloadProgress) => void): Promise<ScoutGemmaModelStatus>;
	cancelDownload(): Promise<boolean>;
	/** Active network type + metered flag, or null when unsupported (e.g. iOS/web). */
	getNetworkStatus(): Promise<NetworkStatus | null>;
	/** Snapshot of any in-flight background download, or null when unsupported. */
	getDownloadState(): Promise<DownloadState | null>;
	/**
	 * Re-observe a download already running in the background service (after the
	 * app returns to the foreground). Resolves like {@link startDownload} when it
	 * ends, or resolves null immediately when no download is active.
	 */
	reattachDownload(
		onProgress?: (progress: ModelDownloadProgress) => void
	): Promise<ScoutGemmaModelStatus | null>;
	/** Ask for notification permission so the OS shows download progress (Android 13+). */
	requestNotificationsPermission(): Promise<boolean>;
}

type CapacitorWindow = Window & {
	Capacitor?: {
		isNativePlatform?: () => boolean;
		Plugins?: {
			ScoutGemma?: ScoutGemmaPlugin;
		};
	};
};

/**
 * True only inside the Capacitor native shell (iOS). False in a browser — which
 * is how the PWA at app.hoggcountry.com is detected, since on-device Gemma needs
 * the native ScoutGemma plugin and the PWA must use the cloud answer lane instead.
 */
export function isNativePlatform(win: Window | undefined = typeof window === 'undefined' ? undefined : window): boolean {
	return (win as CapacitorWindow | undefined)?.Capacitor?.isNativePlatform?.() === true;
}

export function createCapacitorGemmaBridge(win: Window = window): OnDeviceGemmaBridge | null {
	const capacitor = (win as CapacitorWindow).Capacitor;
	if (!capacitor?.isNativePlatform?.()) return null;

	const plugin = capacitor.Plugins?.ScoutGemma;
	if (!plugin) return null;

	return {
		async isAvailable() {
			const result = await plugin.isAvailable();
			return result.available;
		},
		async describeModel() {
			const descriptor = await plugin.describeModel();
			if (!isGemmaModelDescriptor(descriptor)) return null;
			return descriptor;
		},
		async warmUp() {
			// Best-effort: only call through if the native build exposes it.
			await plugin.warmUp?.();
		},
		async generate(input, onToken) {
			let handle: { remove: () => Promise<void> } | undefined;
			if (onToken && plugin.addListener) {
				handle = await plugin.addListener('scoutGenerateToken', (data) => onToken(data.text));
			}
			try {
				const result = await plugin.generate(input);
				return {
					text: result.text,
					truncated: result.truncated ?? false
				};
			} finally {
				await handle?.remove();
			}
		}
	};
}

export async function getCapacitorScoutInstallSource(win: Window = window): Promise<ScoutInstallSource | null> {
	const capacitor = (win as CapacitorWindow).Capacitor;
	if (!capacitor?.isNativePlatform?.()) return null;

	const source = await capacitor.Plugins?.ScoutGemma?.getInstallSource?.();
	if (!source || typeof source !== 'object') return null;
	return {
		...source,
		type: typeof source.type === 'string' && source.type ? source.type : 'unknown',
		receiptLastPathComponent:
			typeof source.receiptLastPathComponent === 'string' ? source.receiptLastPathComponent : null,
		installerPackage: typeof source.installerPackage === 'string' ? source.installerPackage : null
	};
}

export async function setCapacitorScoutEvalKeepAwake(
	active: boolean,
	win: Window = window
): Promise<ScoutEvalKeepAwakeResult | null> {
	const capacitor = (win as CapacitorWindow).Capacitor;
	if (!capacitor?.isNativePlatform?.()) return null;

	const result = await capacitor.Plugins?.ScoutGemma?.setEvalKeepAwake?.({ active });
	if (!result || typeof result !== 'object') return null;
	return {
		...result,
		active: result.active === true,
		supported: result.supported === undefined ? true : result.supported === true
	};
}

/**
 * Model-management surface (status + download), distinct from the generation
 * bridge. Returns null off-native or when the ScoutGemma plugin is absent, so
 * web/dev builds simply show no on-device model controls.
 */
export function createCapacitorModelManager(win: Window = window): ScoutModelManager | null {
	const capacitor = (win as CapacitorWindow).Capacitor;
	if (!capacitor?.isNativePlatform?.()) return null;

	const plugin = capacitor.Plugins?.ScoutGemma;
	if (!plugin) return null;

	// Attaches progress + terminal listeners and returns a promise that settles
	// when the background download ends. Shared by startDownload (which also kicks
	// the service off) and reattachDownload (which only observes). All four
	// listeners are removed exactly once, on the first terminal event or on abort.
	// Defined as a const arrow (not a hoisted declaration) so the non-null
	// narrowing of `plugin` above is preserved inside the closure.
	const observeTerminal = async (
		onProgress?: (progress: ModelDownloadProgress) => void
	): Promise<{ done: Promise<ScoutGemmaModelStatus>; abort: () => Promise<void> }> => {
		const handles: Array<{ remove: () => Promise<void> }> = [];
		const removeAll = async () => {
			const pending = handles.splice(0);
			await Promise.all(pending.map((h) => h.remove().catch(() => {})));
		};

		let settle!: (status: ScoutGemmaModelStatus) => void;
		let fail!: (error: Error) => void;
		const done = new Promise<ScoutGemmaModelStatus>((resolve, reject) => {
			settle = resolve;
			fail = reject;
		});

		if (plugin.addListener) {
			if (onProgress) {
				handles.push(await plugin.addListener('scoutModelDownloadProgress', onProgress));
			}
			handles.push(
				await plugin.addListener('scoutModelDownloadComplete', (status) => {
					void removeAll();
					settle(status);
				})
			);
			handles.push(
				await plugin.addListener('scoutModelDownloadError', (data) => {
					void removeAll();
					fail(new Error(data?.message || 'Model download failed.'));
				})
			);
			handles.push(
				await plugin.addListener('scoutModelDownloadCancelled', () => {
					void removeAll();
					// A user cancel is not an error: resolve with the current (partial)
					// status so callers clear progress without surfacing a failure.
					void plugin
						.getModelStatus?.()
						.then((status) => settle(status))
						.catch(() => fail(new Error('Model download cancelled.')));
				})
			);
		}
		return { done, abort: removeAll };
	};

	return {
		async getStatus() {
			if (!plugin.getModelStatus) return null;
			return plugin.getModelStatus();
		},
		async prepareDownload() {
			if (!plugin.prepareModelDownload) return null;
			return plugin.prepareModelDownload();
		},
		async startDownload(onProgress) {
			if (!plugin.startModelDownload) {
				throw new Error('On-device model download is not supported in this build.');
			}
			// Attach terminal listeners BEFORE starting so a fast completion can't
			// fire before we are listening.
			const { done, abort } = await observeTerminal(onProgress);
			try {
				const start = await plugin.startModelDownload();
				if (start.started === false) {
					// Nothing to download (already verified / ready) — return now.
					await abort();
					return start;
				}
				return await done;
			} catch (error) {
				await abort();
				throw error;
			}
		},
		async cancelDownload() {
			if (!plugin.cancelModelDownload) return false;
			const result = await plugin.cancelModelDownload();
			return result.cancelled;
		},
		async getNetworkStatus() {
			if (!plugin.getNetworkStatus) return null;
			return plugin.getNetworkStatus();
		},
		async getDownloadState() {
			if (!plugin.getDownloadState) return null;
			return plugin.getDownloadState();
		},
		async reattachDownload(onProgress) {
			if (!plugin.getDownloadState) return null;
			const state = await plugin.getDownloadState();
			if (!state.active) return null;
			const { done } = await observeTerminal(onProgress);
			// Seed the caller's progress UI with the last known bytes immediately.
			onProgress?.({ bytesDownloaded: state.bytesDownloaded, totalBytes: state.totalBytes });
			return done;
		},
		async requestNotificationsPermission() {
			if (!plugin.requestNotificationsPermission) return true;
			const result = await plugin.requestNotificationsPermission();
			return result.granted;
		}
	};
}

function isGemmaModelDescriptor(
	descriptor: ScoutGemmaDescriptor | ScoutGemmaAvailability | null
): descriptor is GemmaModelDescriptor {
	return Boolean(
		descriptor &&
			descriptor.available !== false &&
			'maxContextTokens' in descriptor &&
			'tier' in descriptor &&
			typeof descriptor.modelId === 'string' &&
			typeof descriptor.maxContextTokens === 'number' &&
			(descriptor.tier === 'fast' || descriptor.tier === 'balanced' || descriptor.tier === 'small')
	);
}
