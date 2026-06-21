import assert from 'node:assert/strict';
import test from 'node:test';

import { deriveModelPhase, formatModelBytes } from './model-download-phase.ts';
import type { ScoutGemmaModelStatus } from './capacitor-gemma-bridge.ts';

function status(patch: Partial<ScoutGemmaModelStatus> = {}): ScoutGemmaModelStatus {
	return {
		modelId: 'gemma-4',
		state: 'needs_download',
		fileName: 'gemma.litertlm',
		filePath: '/tmp/gemma.litertlm',
		exists: false,
		bytesOnDevice: 0,
		expectedBytes: 2_600_000_000,
		checksumAlgorithm: 'SHA-256',
		checksumConfigured: true,
		downloadConfigured: true,
		canDownload: true,
		runtimeConfigured: true,
		...patch
	};
}

test('formatModelBytes uses compact reader-facing units', () => {
	assert.equal(formatModelBytes(undefined), 'unknown size');
	assert.equal(formatModelBytes(-1), 'unknown size');
	assert.equal(formatModelBytes(0), '0 MB');
	assert.equal(formatModelBytes(142_000_000), '142 MB');
	assert.equal(formatModelBytes(2_600_000_000), '2.6 GB');
});

test('deriveModelPhase reports determinate download progress', () => {
	const phase = deriveModelPhase({
		download: { bytesDownloaded: 1_300_000_000, totalBytes: 2_600_000_000 },
		status: status(),
		error: null,
		meteredPrompt: null
	});

	assert.deepEqual(phase, {
		kind: 'downloading',
		percent: 50,
		bytesLabel: '1.3 GB / 2.6 GB'
	});
});

test('deriveModelPhase handles unknown download totals without fake percentages', () => {
	const phase = deriveModelPhase({
		download: { bytesDownloaded: 142_000_000, totalBytes: -1 },
		status: status(),
		error: null,
		meteredPrompt: null
	});

	assert.deepEqual(phase, {
		kind: 'downloading',
		percent: null,
		bytesLabel: '142 MB / unknown size'
	});
});

test('deriveModelPhase distinguishes metered, error, ready, and idle states', () => {
	assert.deepEqual(
		deriveModelPhase({
			download: null,
			status: status(),
			error: null,
			meteredPrompt: { connected: true, metered: true, type: 'cellular' }
		}),
		{ kind: 'metered', connectionType: 'cellular', modelSize: '2.6 GB' }
	);

	assert.deepEqual(
		deriveModelPhase({
			download: null,
			status: status(),
			error: 'No internet connection.',
			meteredPrompt: null
		}),
		{ kind: 'error', detail: 'No internet connection.' }
	);

	assert.deepEqual(
		deriveModelPhase({
			download: null,
			status: status({ state: 'ready' }),
			error: null,
			meteredPrompt: null
		}),
		{ kind: 'ready' }
	);

	assert.deepEqual(
		deriveModelPhase({ download: null, status: status(), error: null, meteredPrompt: null }),
		{ kind: 'idle' }
	);
});
