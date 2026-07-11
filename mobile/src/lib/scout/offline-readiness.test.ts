import assert from 'node:assert/strict';
import { test } from 'node:test';

import type { PersistenceAdapter } from './context-pack-store.ts';
import type { ScoutGemmaModelStatus } from './capacitor-gemma-bridge.ts';
import {
	SCOUT_OFFLINE_PROOF_STORAGE_KEY,
	createScoutOfflineProof,
	createScoutOfflineProofIdentity,
	deriveScoutOfflineReadiness,
	loadScoutOfflineProof,
	parseScoutOfflineProof,
	saveScoutOfflineProof,
	scoutOfflineProofMatches
} from './offline-readiness.ts';

const model: ScoutGemmaModelStatus = {
	modelId: 'gemma-4-E2B-it-litert-lm',
	state: 'ready',
	fileName: 'gemma-4.litertlm',
	filePath: '/models/gemma-4.litertlm',
	exists: true,
	bytesOnDevice: 2_588_147_712,
	expectedBytes: 2_588_147_712,
	checksumAlgorithm: 'SHA-256',
	checksumConfigured: true,
	expectedChecksum: 'ABC123',
	downloadConfigured: true,
	canDownload: false,
	runtimeConfigured: true
};

const app = { version: '1.4.0', build: '204', platform: 'ios' };

function identity() {
	const result = createScoutOfflineProofIdentity(model, app);
	assert.ok(result);
	return result;
}

test('offline proof identity binds the exact model manifest and app build', () => {
	assert.deepEqual(identity(), {
		schemaVersion: 1,
		modelId: 'gemma-4-E2B-it-litert-lm',
		expectedChecksum: 'abc123',
		expectedBytes: 2_588_147_712,
		appVersion: '1.4.0',
		appBuild: '204',
		platform: 'ios'
	});

	assert.equal(createScoutOfflineProofIdentity({ ...model, state: 'present_unverified' }, app), null);
	assert.equal(createScoutOfflineProofIdentity({ ...model, expectedChecksum: undefined }, app), null);
	assert.equal(createScoutOfflineProofIdentity(model, { ...app, build: '' }), null);
});

test('offline proof parser fails closed on malformed, stale-schema, or incomplete records', () => {
	const proof = createScoutOfflineProof(identity(), '2026-07-11T12:30:00.000Z');
	assert.deepEqual(parseScoutOfflineProof(JSON.stringify(proof)), proof);
	assert.equal(parseScoutOfflineProof('{bad'), null);
	assert.equal(parseScoutOfflineProof(JSON.stringify({ ...proof, schemaVersion: 2 })), null);
	assert.equal(parseScoutOfflineProof(JSON.stringify({ ...proof, passedAt: 'yesterday' })), null);
	assert.equal(parseScoutOfflineProof(JSON.stringify({ ...proof, expectedChecksum: '' })), null);
});

test('offline proof is invalidated by model, checksum, size, app build, or platform changes', () => {
	const proof = createScoutOfflineProof(identity(), '2026-07-11T12:30:00.000Z');
	assert.equal(scoutOfflineProofMatches(proof, identity()), true);
	for (const patch of [
		{ modelId: 'gemma-next' },
		{ expectedChecksum: 'changed' },
		{ expectedBytes: 1 },
		{ appVersion: '1.5.0' },
		{ appBuild: '205' },
		{ platform: 'android' }
	]) {
		assert.equal(scoutOfflineProofMatches(proof, { ...identity(), ...patch }), false);
	}
});

test('offline proof persists in the device-local adapter without answer text', async () => {
	const values = new Map<string, string>();
	const adapter: PersistenceAdapter = {
		get: (key) => Promise.resolve(values.get(key) ?? null),
		set: (key, value) => {
			values.set(key, value);
			return Promise.resolve();
		}
	};
	const proof = createScoutOfflineProof(identity(), '2026-07-11T12:30:00.000Z');

	await saveScoutOfflineProof(adapter, proof);

	assert.deepEqual(await loadScoutOfflineProof(adapter), proof);
	assert.equal(values.has(SCOUT_OFFLINE_PROOF_STORAGE_KEY), true);
	assert.equal(values.get(SCOUT_OFFLINE_PROOF_STORAGE_KEY)?.includes('answer'), false);
});

test('readiness never treats a verified file as an offline-tested runtime', () => {
	const proof = createScoutOfflineProof(identity(), '2026-07-11T12:30:00.000Z');
	const base = {
		supported: true,
		model,
		identity: identity(),
		proof: null,
		runtime: 'idle' as const,
		test: 'idle' as const
	};

	assert.equal(deriveScoutOfflineReadiness(base).stage, 'file_verified');
	assert.equal(deriveScoutOfflineReadiness({ ...base, runtime: 'ready' }).stage, 'runtime_ready');
	assert.equal(deriveScoutOfflineReadiness({ ...base, proof }).stage, 'offline_ready');
	assert.equal(
		deriveScoutOfflineReadiness({ ...base, proof: { ...proof, appBuild: 'old' } }).stage,
		'file_verified'
	);
});

test('readiness prioritizes active, blocked, and failed test truth', () => {
	const base = {
		supported: true,
		model,
		identity: identity(),
		proof: null,
		runtime: 'idle' as const,
		test: 'idle' as const
	};

	assert.equal(deriveScoutOfflineReadiness({ ...base, test: 'testing' }).stage, 'testing');
	assert.equal(deriveScoutOfflineReadiness({ ...base, runtime: 'initializing' }).stage, 'initializing');
	assert.equal(deriveScoutOfflineReadiness({ ...base, test: 'network-required' }).stage, 'file_verified');
	assert.match(
		deriveScoutOfflineReadiness({ ...base, test: 'network-required' }).detail,
		/Airplane Mode/u
	);
	assert.equal(
		deriveScoutOfflineReadiness({ ...base, runtime: 'failed', error: 'LiteRT OOM' }).stage,
		'failed'
	);
	assert.equal(deriveScoutOfflineReadiness({ ...base, model: null }).stage, 'needs_model');
});
