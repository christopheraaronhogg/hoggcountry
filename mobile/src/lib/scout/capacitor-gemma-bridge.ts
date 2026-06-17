import type { GemmaModelDescriptor, OnDeviceGemmaBridge } from './providers/on-device-gemma.ts';

type ScoutGemmaPlugin = {
	isAvailable(): Promise<{ available: boolean }>;
	describeModel(): Promise<GemmaModelDescriptor | null>;
	generate(input: {
		prompt: string;
		systemContext: string;
		maxTokens: number;
	}): Promise<{ text: string; truncated?: boolean }>;
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
			return plugin.describeModel();
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
