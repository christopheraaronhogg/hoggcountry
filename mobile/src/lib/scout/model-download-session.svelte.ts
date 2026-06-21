import {
	type ModelDownloadProgress,
	type NetworkStatus,
	type ScoutGemmaModelStatus,
	type ScoutModelManager
} from './capacitor-gemma-bridge.ts';
import type { ScoutAnswer } from './types';

export type ModelDownloadAutoStart =
	| 'none'
	| 'started'
	| 'downloading'
	| 'metered'
	| 'offline'
	| 'runtime-unavailable'
	| 'unavailable';

function formatModelSize(bytes: number | undefined): string {
	if (!bytes || bytes < 0) return 'about 2.6 GB';
	const gb = bytes / 1e9;
	return gb >= 1 ? `${gb.toFixed(1)} GB` : `${Math.round(bytes / 1e6)} MB`;
}

export class ScoutModelDownloadSession {
	#status = $state<ScoutGemmaModelStatus | null>(null);
	#download = $state<{ bytesDownloaded: number; totalBytes: number } | null>(null);
	#error = $state<string | null>(null);
	#meteredPrompt = $state<NetworkStatus | null>(null);
	#getManager: () => ScoutModelManager | null;
	#ensureNativeWiring: () => void;
	#onModelReady: () => void;

	constructor(input: {
		getManager: () => ScoutModelManager | null;
		ensureNativeWiring: () => void;
		onModelReady: () => void;
	}) {
		this.#getManager = input.getManager;
		this.#ensureNativeWiring = input.ensureNativeWiring;
		this.#onModelReady = input.onModelReady;
	}

	get status(): ScoutGemmaModelStatus | null {
		return this.#status;
	}

	get download(): { bytesDownloaded: number; totalBytes: number } | null {
		return this.#download;
	}

	get error(): string | null {
		return this.#error;
	}

	get meteredPrompt(): NetworkStatus | null {
		return this.#meteredPrompt;
	}

	get supportsModelManagement(): boolean {
		return this.#getManager() !== null;
	}

	async refreshStatus(): Promise<ScoutGemmaModelStatus | null> {
		const manager = this.#getManager();
		if (!manager) return null;
		try {
			this.#status = await manager.getStatus();
		} catch {
			this.#status = null;
		}
		return this.#status;
	}

	async startIfUseful(): Promise<ModelDownloadAutoStart> {
		this.#ensureNativeWiring();
		const manager = this.#getManager();
		if (!manager) return 'unavailable';
		if (this.#download) return 'downloading';

		const status = this.#status ?? (await this.refreshStatus());
		if (!status || status.state === 'ready') return 'none';
		if (status.runtimeConfigured === false) return 'runtime-unavailable';
		if (
			!status.downloadConfigured ||
			(status.state !== 'needs_download' && status.state !== 'present_unverified')
		) {
			return 'unavailable';
		}

		const network = await manager.getNetworkStatus().catch(() => null);
		if (network && !network.connected) {
			this.#error = 'No internet connection. Connect to Wi-Fi to download the model.';
			return 'offline';
		}
		if (network?.metered) {
			this.#meteredPrompt = network;
			return 'metered';
		}

		void this.downloadModel();
		return 'started';
	}

	unavailableAnswer(autoStart: ModelDownloadAutoStart = 'none'): ScoutAnswer {
		const notInstalled = !this.#status || this.#status.state !== 'ready';
		const modelSize = formatModelSize(this.#status?.expectedBytes);
		let answer = 'My on-device model is still warming up. Give it a few seconds and ask again.';
		if (notInstalled) {
			if (autoStart === 'started') {
				answer = `I'm downloading my on-device model now (${modelSize}). You can watch progress right here. Once it verifies, ask again and I'll answer fully offline.`;
			} else if (autoStart === 'downloading' || this.#download) {
				answer =
					"My on-device model is still downloading. Watch the progress here; once it verifies, ask again and I'll answer from the local model.";
			} else if (autoStart === 'runtime-unavailable' || this.#status?.runtimeConfigured === false) {
				answer =
					"This iOS build can see Scout's model store, but the LiteRT-LM runtime is not linked yet. Install a build with the iOS runtime before testing on-device answers.";
			} else if (autoStart === 'metered' || this.#meteredPrompt) {
				answer = `My on-device model is ${modelSize}, and this connection looks metered. I paused before using mobile data; use the prompt here to allow it or wait for Wi-Fi.`;
			} else if (autoStart === 'offline') {
				answer = this.#error ?? "Connect to Wi-Fi to download Scout's on-device model.";
			} else if (autoStart === 'unavailable') {
				answer =
					"The on-device model download isn't available in this build yet. Scout will answer after the verified model/runtime is installed.";
			} else {
				answer =
					"My on-device model isn't installed yet. Send a message on Wi-Fi and I'll start the download here, then I can answer fully offline.";
			}
		}
		return {
			answer,
			confidence: 'draft',
			mode: 'on-device',
			provider: 'on-device-gemma',
			receipts: [],
			toolInvocations: [],
			requiredConfirmations: [],
			safetyFlags: notInstalled
				? [
						{
							id: 'on-device-model-not-installed',
							severity: 'warn',
							message:
								'Scout answers run on a Gemma model stored on your phone — download it once on Wi-Fi to chat offline.'
						}
					]
				: [],
			contextUsed: ['gemma4-only-policy'],
			generatedAt: new Date().toISOString()
		};
	}

	async downloadModel(options: { allowMetered?: boolean } = {}): Promise<void> {
		const manager = this.#getManager();
		if (!manager || this.#download) return;
		this.#error = null;

		await manager.requestNotificationsPermission().catch(() => false);

		const network = await manager.getNetworkStatus().catch(() => null);
		if (network && !network.connected) {
			this.#error = 'No internet connection. Connect to Wi-Fi to download the model.';
			return;
		}
		if (network?.metered && !options.allowMetered) {
			this.#meteredPrompt = network;
			return;
		}
		this.#meteredPrompt = null;

		this.#download = { bytesDownloaded: 0, totalBytes: this.#status?.expectedBytes ?? -1 };
		try {
			const status = await manager.startDownload((progress: ModelDownloadProgress) => {
				this.#download = {
					bytesDownloaded: progress.bytesDownloaded,
					totalBytes: progress.totalBytes
				};
			});
			this.#status = status;
			if (status.state === 'ready') {
				this.#onModelReady();
			}
		} catch (error) {
			this.#error = error instanceof Error ? error.message : 'Model download failed.';
			await this.refreshStatus();
		} finally {
			this.#download = null;
		}
	}

	dismissMeteredPrompt(): void {
		this.#meteredPrompt = null;
	}

	async reconcileDownload(): Promise<void> {
		this.#ensureNativeWiring();
		const manager = this.#getManager();
		if (!manager) return;
		await this.refreshStatus();
		if (this.#status?.state === 'ready') {
			this.#onModelReady();
			return;
		}
		if (this.#download) return;

		const state = await manager.getDownloadState().catch(() => null);
		if (!state?.active) return;

		this.#download = { bytesDownloaded: state.bytesDownloaded, totalBytes: state.totalBytes };
		try {
			const status = await manager.reattachDownload((progress: ModelDownloadProgress) => {
				this.#download = {
					bytesDownloaded: progress.bytesDownloaded,
					totalBytes: progress.totalBytes
				};
			});
			if (status) {
				this.#status = status;
				if (status.state === 'ready') {
					this.#onModelReady();
				}
			} else {
				await this.refreshStatus();
			}
		} catch (error) {
			this.#error = error instanceof Error ? error.message : 'Model download failed.';
			await this.refreshStatus();
		} finally {
			this.#download = null;
		}
	}

	async cancelDownload(): Promise<void> {
		const manager = this.#getManager();
		if (!manager) return;
		this.#meteredPrompt = null;
		await manager.cancelDownload();
	}
}
