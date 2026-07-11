import type {
	ModelDownloadProgress,
	NetworkStatus,
	ScoutGemmaModelStatus
} from './capacitor-gemma-bridge.ts';

export type ScoutModelPhase =
	| { kind: 'idle' }
	| { kind: 'file_verified' }
	| { kind: 'metered'; connectionType: NetworkStatus['type']; modelSize: string }
	| { kind: 'downloading'; bytesLabel: string; percent: number | null }
	| { kind: 'error'; detail: string };

export function formatModelBytes(bytes: number | undefined): string {
	if (bytes === undefined || bytes < 0) return 'unknown size';
	const gb = bytes / 1e9;
	return gb >= 1 ? `${gb.toFixed(1)} GB` : `${Math.round(bytes / 1e6)} MB`;
}

export function deriveModelPhase(input: {
	download: ModelDownloadProgress | null;
	status: ScoutGemmaModelStatus | null;
	error: string | null;
	meteredPrompt: NetworkStatus | null;
}): ScoutModelPhase {
	if (input.download) {
		const percent =
			input.download.totalBytes > 0
				? Math.min(100, Math.max(0, Math.round((input.download.bytesDownloaded / input.download.totalBytes) * 100)))
				: null;
		const totalLabel =
			input.download.totalBytes > 0 ? formatModelBytes(input.download.totalBytes) : 'unknown size';
		return {
			kind: 'downloading',
			percent,
			bytesLabel: `${formatModelBytes(input.download.bytesDownloaded)} / ${totalLabel}`
		};
	}

	if (input.meteredPrompt) {
		return {
			kind: 'metered',
			connectionType: input.meteredPrompt.type,
			modelSize: formatModelBytes(input.status?.expectedBytes)
		};
	}

	if (input.error) return { kind: 'error', detail: input.error };
	if (input.status?.state === 'ready') return { kind: 'file_verified' };

	return { kind: 'idle' };
}
