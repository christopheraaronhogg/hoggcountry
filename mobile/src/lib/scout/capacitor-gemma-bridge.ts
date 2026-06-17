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
	modelId: string;
	fileName: string;
	filePath: string;
	state:
		| 'unconfigured'
		| 'needs_download'
		| 'invalid_size'
		| 'invalid_checksum'
		| 'verification_failed'
		| 'downloaded_unverified'
		| 'ready';
	downloadConfigured: boolean;
	checksumConfigured: boolean;
	expectedBytes: number;
	bytesOnDevice: number;
	reason?: string;
	actualSha256?: string;
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
};

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
		async generate(input) {
			const result = await plugin.generate(input);
			return {
				text: result.text,
				truncated: result.truncated ?? false
			};
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
