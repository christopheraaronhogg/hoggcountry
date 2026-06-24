import { createScoutRuntime } from './index.ts';
import {
	createCapacitorGemmaBridge,
	createCapacitorModelManager,
	type ScoutModelManager
} from './capacitor-gemma-bridge.ts';
import {
	ScoutModelDownloadSession,
	type ModelDownloadAutoStart
} from './model-download-session.svelte.ts';
import type {
	ContextPackStore,
	ScoutRuntime,
	ScoutAnswer
} from './types.ts';
import type {
	GemmaTier,
	OnDeviceGemmaBridge
} from './providers/on-device-gemma.ts';
import type { CloudScoutBridge } from './providers/cloud-scout.ts';

export type { ModelDownloadAutoStart } from './model-download-session.svelte.ts';

export interface ScoutAvailabilityInvalidator {
	invalidateAvailability(): void;
}

export interface ScoutRuntimeHandle {
	runtime: ScoutRuntime;
	onDeviceProvider: ScoutAvailabilityInvalidator | undefined;
}

export type NativeDownloadSession = Pick<
	ScoutModelDownloadSession,
	| 'status'
	| 'download'
	| 'error'
	| 'meteredPrompt'
	| 'supportsModelManagement'
	| 'refreshStatus'
	| 'startIfUseful'
	| 'unavailableAnswer'
	| 'downloadModel'
	| 'dismissMeteredPrompt'
	| 'reconcileDownload'
	| 'cancelDownload'
>;

export interface NativeDownloadSessionInput {
	getManager: () => ScoutModelManager | null;
	ensureNativeWiring: () => void;
	onModelReady: () => void;
}

type NativeScoutRuntimeFactory = (input: {
	store: ContextPackStore;
	onDeviceBridge?: OnDeviceGemmaBridge;
	onDeviceTier: GemmaTier;
	cloudBridge?: CloudScoutBridge;
}) => ScoutRuntimeHandle;

export interface NativeScoutRuntimeOptions {
	browserAvailable: boolean;
	store: ContextPackStore;
	tier?: GemmaTier;
	createBridge?: () => OnDeviceGemmaBridge | null;
	createManager?: () => ScoutModelManager | null;
	/**
	 * Cloud answer lane for the PWA. Returns a bridge in a browser (where Gemma
	 * can't run) and null on iOS (which stays pure on-device). Off by default.
	 */
	createCloudBridge?: () => CloudScoutBridge | null;
	createRuntime?: NativeScoutRuntimeFactory;
	createDownloadSession?: (input: NativeDownloadSessionInput) => NativeDownloadSession;
}

export class NativeScoutRuntime {
	#browserAvailable: boolean;
	#store: ContextPackStore;
	#tier: GemmaTier;
	#createBridge: () => OnDeviceGemmaBridge | null;
	#createManager: () => ScoutModelManager | null;
	#createRuntime: NativeScoutRuntimeFactory;
	#gemmaBridge: OnDeviceGemmaBridge | null;
	#cloudBridge: CloudScoutBridge | null;
	#modelManager: ScoutModelManager | null;
	#scout: ScoutRuntimeHandle;

	readonly downloads: NativeDownloadSession;

	constructor(options: NativeScoutRuntimeOptions) {
		this.#browserAvailable = options.browserAvailable;
		this.#store = options.store;
		this.#tier = options.tier ?? 'balanced';
		this.#createBridge = options.createBridge ?? createCapacitorGemmaBridge;
		this.#createManager = options.createManager ?? createCapacitorModelManager;
		this.#createRuntime = options.createRuntime ?? createScoutRuntime;
		this.#gemmaBridge = this.#browserAvailable ? this.#createBridge() : null;
		this.#cloudBridge = this.#browserAvailable ? (options.createCloudBridge?.() ?? null) : null;
		this.#modelManager = this.#browserAvailable ? this.#createManager() : null;
		this.#scout = this.#buildRuntime(this.#gemmaBridge);

		const createDownloadSession =
			options.createDownloadSession ??
			((input: NativeDownloadSessionInput) => new ScoutModelDownloadSession(input));
		this.downloads = createDownloadSession({
			getManager: () => this.#modelManager,
			ensureNativeWiring: () => this.ensureNativeWiring(),
			onModelReady: () => this.#handleModelReady()
		});
	}

	get runtime(): ScoutRuntime {
		return this.#scout.runtime;
	}

	ensureNativeWiring(): void {
		if (!this.#browserAvailable) return;
		if (!this.#modelManager) this.#modelManager = this.#createManager();
		if (this.#gemmaBridge) return;

		const bridge = this.#createBridge();
		if (!bridge) return;
		this.#gemmaBridge = bridge;
		this.#scout = this.#buildRuntime(bridge);
	}

	warmUpModel(): void {
		this.ensureNativeWiring();
		void this.#gemmaBridge?.warmUp?.();
	}

	async gemmaReady(required: boolean): Promise<boolean> {
		if (!required) return true;
		this.ensureNativeWiring();
		if (!this.#gemmaBridge) return false;
		return this.#gemmaBridge.isAvailable().catch(() => false);
	}

	startModelDownloadIfUseful(): Promise<ModelDownloadAutoStart> {
		return this.downloads.startIfUseful();
	}

	gemmaUnavailableAnswer(autoStart: ModelDownloadAutoStart = 'none'): ScoutAnswer {
		return this.downloads.unavailableAnswer(autoStart);
	}

	invalidateAvailability(): void {
		this.#scout.onDeviceProvider?.invalidateAvailability();
	}

	#buildRuntime(onDeviceBridge: OnDeviceGemmaBridge | null): ScoutRuntimeHandle {
		return this.#createRuntime({
			store: this.#store,
			onDeviceBridge: onDeviceBridge ?? undefined,
			onDeviceTier: this.#tier,
			cloudBridge: this.#cloudBridge ?? undefined
		});
	}

	#handleModelReady(): void {
		this.invalidateAvailability();
		this.warmUpModel();
	}
}
