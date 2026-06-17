import type { GemmaModelDescriptor, OnDeviceGemmaBridge } from './providers/on-device-gemma.ts';

type ScoutGemmaAvailability = {
	available: boolean;
	modelId?: string;
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
	// Optional fields — present only when the relevant feature is configured.
	/** Only emitted when checksumConfigured is true. */
	expectedChecksum?: string;
	/** Only emitted when downloadConfigured is true. */
	url?: string;
	/** Only emitted when present. */
	reason?: string;
};

type ScoutGemmaPlugin = {
	isAvailable(): Promise<ScoutGemmaAvailability>;
	describeModel(): Promise<ScoutGemmaDescriptor | ScoutGemmaAvailability | null>;
	generate(input: {
		prompt: string;
		systemContext: string;
		maxTokens: number;
	}): Promise<{ text: string; truncated?: boolean }>;
	getModelStatus?: () => Promise<ScoutGemmaModelStatus>;
	prepareModelDownload?: () => Promise<ScoutGemmaModelStatus>;
	startModelDownload?: () => Promise<ScoutGemmaModelStatus>;
	cancelModelDownload?: () => Promise<{ cancelled: boolean }>;
	addListener?: {
		(
			eventName: 'scoutModelDownloadProgress',
			listener: (data: ModelDownloadProgress) => void
		): Promise<{ remove: () => Promise<void> }>;
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

export interface ScoutModelManager {
	getStatus(): Promise<ScoutGemmaModelStatus | null>;
	prepareDownload(): Promise<ScoutGemmaModelStatus | null>;
	startDownload(onProgress?: (progress: ModelDownloadProgress) => void): Promise<ScoutGemmaModelStatus>;
	cancelDownload(): Promise<boolean>;
}

type CapacitorWindow = Window & {
	Capacitor?: {
		isNativePlatform?: () => boolean;
		Plugins?: {
			ScoutGemma?: ScoutGemmaPlugin;
		};
	};
};

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
			let handle: { remove: () => Promise<void> } | undefined;
			if (onProgress && plugin.addListener) {
				handle = await plugin.addListener('scoutModelDownloadProgress', onProgress);
			}
			try {
				return await plugin.startModelDownload();
			} finally {
				await handle?.remove();
			}
		},
		async cancelDownload() {
			if (!plugin.cancelModelDownload) return false;
			const result = await plugin.cancelModelDownload();
			return result.cancelled;
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
