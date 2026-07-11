import { createScoutRuntime } from './index.ts';
import {
	createCapacitorGemmaBridge,
	createCapacitorModelManager,
	type NetworkStatus,
	type ScoutModelManager
} from './capacitor-gemma-bridge.ts';
import { InMemoryContextPackStore } from './context-pack-store.ts';
import {
	ScoutModelDownloadSession,
	type ModelDownloadAutoStart
} from './model-download-session.svelte.ts';
import type {
	ContextPackStore,
	ContextPack,
	ScoutAskInput,
	ScoutRuntime,
	ScoutAnswer,
	ScoutDiagnosticsSink,
	TokenSink
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
	diagnostics?: ScoutDiagnosticsSink;
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
	diagnostics?: ScoutDiagnosticsSink;
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
	#diagnostics?: ScoutDiagnosticsSink;
	#runtimeInitialized = false;
	#runtimeWarmUpPromise: Promise<boolean> | null = null;
	#runtimeGeneration = 0;
	#runtimeFailureReason: string | null = null;

	readonly downloads: NativeDownloadSession;

	constructor(options: NativeScoutRuntimeOptions) {
		this.#browserAvailable = options.browserAvailable;
		this.#store = options.store;
		this.#tier = options.tier ?? 'balanced';
		this.#createBridge = options.createBridge ?? createCapacitorGemmaBridge;
		this.#createManager = options.createManager ?? createCapacitorModelManager;
		this.#createRuntime = options.createRuntime ?? createScoutRuntime;
		this.#diagnostics = options.diagnostics;
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

	get runtimeInitialized(): boolean {
		return this.#runtimeInitialized;
	}

	get runtimeFailureReason(): string | null {
		return this.#runtimeFailureReason;
	}

	async askWithContextPack(
		pack: ContextPack,
		input: ScoutAskInput,
		onToken?: TokenSink
	): Promise<ScoutAnswer> {
		this.ensureNativeWiring();
		const evalRuntime = this.#createRuntime({
			store: new InMemoryContextPackStore({ initial: pack }),
			onDeviceBridge: this.#gemmaBridge ?? undefined,
			onDeviceTier: this.#tier,
			cloudBridge: this.#cloudBridge ?? undefined,
			diagnostics: this.#diagnostics
		});
		return evalRuntime.runtime.ask(input, onToken);
	}

	ensureNativeWiring(): void {
		if (!this.#browserAvailable) return;
		if (!this.#modelManager) this.#modelManager = this.#createManager();
		if (this.#gemmaBridge) return;

		const bridge = this.#createBridge();
		if (!bridge) return;
		this.invalidateRuntimeReadiness();
		this.#gemmaBridge = bridge;
		this.#scout = this.#buildRuntime(bridge);
	}

	warmUpModel(): Promise<boolean> {
		this.ensureNativeWiring();
		if (this.#runtimeInitialized) return Promise.resolve(true);
		if (this.#runtimeWarmUpPromise) return this.#runtimeWarmUpPromise;
		const bridge = this.#gemmaBridge;
		if (!bridge?.warmUp) return Promise.resolve(false);

		const generation = this.#runtimeGeneration;
		const promise = (async () => {
			if (!(await bridge.isAvailable())) {
				if (generation === this.#runtimeGeneration) {
					this.#runtimeFailureReason = 'The verified Gemma model is not available to the native runtime.';
				}
				return false;
			}
			const result = await bridge.warmUp?.();
			const warmed = result?.warmed === true;
			if (generation === this.#runtimeGeneration && bridge === this.#gemmaBridge) {
				this.#runtimeInitialized = warmed;
				this.#runtimeFailureReason = warmed
					? null
					: cleanRuntimeFailureReason(result?.error) ??
						'Gemma 4 is verified, but the native runtime could not initialize it.';
			}
			return warmed;
		})()
			.catch((error) => {
				if (generation === this.#runtimeGeneration) {
					this.#runtimeInitialized = false;
					this.#runtimeFailureReason =
						cleanRuntimeFailureReason(error) ?? 'The native Gemma runtime failed to initialize.';
				}
				return false;
			})
			.finally(() => {
				if (this.#runtimeWarmUpPromise === promise) this.#runtimeWarmUpPromise = null;
			});
		this.#runtimeWarmUpPromise = promise;
		return promise;
	}

	async gemmaReady(required: boolean): Promise<boolean> {
		if (!required) return true;
		this.ensureNativeWiring();
		if (!this.#gemmaBridge) return false;
		return this.warmUpModel();
	}

	async getNetworkStatus(): Promise<NetworkStatus | null> {
		this.ensureNativeWiring();
		return this.#modelManager?.getNetworkStatus().catch(() => null) ?? null;
	}

	invalidateRuntimeReadiness(): void {
		this.#runtimeGeneration += 1;
		this.#runtimeInitialized = false;
		this.#runtimeWarmUpPromise = null;
		this.#runtimeFailureReason = null;
	}

	/**
	 * Raw on-device generation for callers that build their own prompt and grounding
	 * (e.g. Scripture Ask), bypassing the trail-companion persona and tool loop.
	 * Throws if the model is not present so the caller can fall back honestly.
	 */
	async generateText(input: { systemContext: string; prompt: string; maxTokens?: number }): Promise<string> {
		this.ensureNativeWiring();
		if (!this.#gemmaBridge || !(await this.gemmaReady(true))) {
			throw new Error('On-device model is not available.');
		}
		const result = await this.#gemmaBridge.generate({
			prompt: input.prompt,
			systemContext: input.systemContext,
			maxTokens: input.maxTokens ?? 512
		});
		if (!result.text || !result.text.trim()) {
			throw new Error('On-device model returned an empty response.');
		}
		return result.text;
	}

	startModelDownloadIfUseful(): Promise<ModelDownloadAutoStart> {
		return this.downloads.startIfUseful();
	}

	gemmaUnavailableAnswer(autoStart: ModelDownloadAutoStart = 'none'): ScoutAnswer {
		return this.downloads.unavailableAnswer(autoStart);
	}

	invalidateAvailability(): void {
		this.#scout.onDeviceProvider?.invalidateAvailability();
		this.invalidateRuntimeReadiness();
	}

	#buildRuntime(onDeviceBridge: OnDeviceGemmaBridge | null): ScoutRuntimeHandle {
		return this.#createRuntime({
			store: this.#store,
			onDeviceBridge: onDeviceBridge ?? undefined,
			onDeviceTier: this.#tier,
			cloudBridge: this.#cloudBridge ?? undefined,
			diagnostics: this.#diagnostics
		});
	}

	#handleModelReady(): void {
		this.invalidateAvailability();
		void this.warmUpModel();
	}
}

function cleanRuntimeFailureReason(value: unknown): string | null {
	const raw =
		typeof value === 'string'
			? value
			: value instanceof Error
				? value.message
				: value && typeof value === 'object' && 'message' in value
					? String(value.message)
					: '';
	const trimmed = raw.trim();
	return trimmed || null;
}
