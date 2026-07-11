import assert from 'node:assert/strict';
import { test } from 'node:test';

import type { PersistenceAdapter } from './context-pack-store.ts';
import type { ScoutGemmaModelStatus } from './capacitor-gemma-bridge.ts';
import { cloneDefaultContextPack } from './default-pack.ts';
import { createScoutRuntime } from './index.ts';
import {
	SCOUT_OFFLINE_SMOKE_PROMPT,
	SCOUT_OFFLINE_PROOF_STORAGE_KEY,
	createScoutOfflineProof,
	createScoutOfflineProofIdentity,
	deriveScoutOfflineReadiness,
	loadScoutOfflineProof,
	parseScoutOfflineProof,
	saveScoutOfflineProof,
	scoutOfflineProofMatches,
	scoutOfflineSmokePassed,
	scoutOfflineWaterExpectation
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

const app = {
	version: '1.4.0',
	build: '204',
	platform: 'ios',
	sourceBuild: 'abc123-release-source'
};

function identity() {
	const result = createScoutOfflineProofIdentity(model, app);
	assert.ok(result);
	return result;
}

test('offline proof identity binds the exact model manifest and app build', () => {
	assert.deepEqual(identity(), {
		schemaVersion: 2,
		modelId: 'gemma-4-E2B-it-litert-lm',
		expectedChecksum: 'abc123',
		expectedBytes: 2_588_147_712,
		appVersion: '1.4.0',
		appBuild: '204',
		platform: 'ios',
		sourceBuild: 'abc123-release-source'
	});

	assert.equal(createScoutOfflineProofIdentity({ ...model, state: 'present_unverified' }, app), null);
	assert.equal(createScoutOfflineProofIdentity({ ...model, expectedChecksum: undefined }, app), null);
	assert.equal(createScoutOfflineProofIdentity(model, { ...app, build: '' }), null);
	assert.equal(createScoutOfflineProofIdentity(model, { ...app, sourceBuild: '' }), null);
});

test('offline proof parser fails closed on malformed, stale-schema, or incomplete records', () => {
	const proof = createScoutOfflineProof(identity(), '2026-07-11T12:30:00.000Z');
	assert.deepEqual(parseScoutOfflineProof(JSON.stringify(proof)), proof);
	assert.equal(parseScoutOfflineProof('{bad'), null);
	assert.equal(parseScoutOfflineProof(JSON.stringify({ ...proof, schemaVersion: 3 })), null);
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
		{ platform: 'android' },
		{ sourceBuild: 'different-native-source' }
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

test('a connected retest does not erase a still-bound offline pass', () => {
	const proof = createScoutOfflineProof(identity(), '2026-07-11T12:30:00.000Z');
	const readiness = deriveScoutOfflineReadiness({
		supported: true,
		model,
		identity: identity(),
		proof,
		runtime: 'ready',
		test: 'network-required'
	});

	assert.equal(readiness.stage, 'offline_ready');
	assert.match(readiness.detail, /To retest, turn on Airplane Mode/u);
});

test('offline smoke proof requires a real on-device answer with local source evidence', () => {
	const expectedWater = { name: 'Test Spring', mile: 42.5 };
	const answer = {
		answer: 'The next saved water source is Test Spring at mile 42.5.',
		confidence: 'medium' as const,
		mode: 'on-device' as const,
		provider: 'on-device-gemma' as const,
		receipts: [{ id: 'water', title: 'Saved field pack', kind: 'trail-pack' as const }],
		toolInvocations: [
			{
				toolId: 'next_water',
				args: {},
				summary: 'Test Spring at mile 42.5',
				confidence: 'medium' as const,
				receipts: [{ id: 'water', title: 'Saved field pack', kind: 'trail-pack' as const }]
			}
		],
		requiredConfirmations: [],
		safetyFlags: [],
		contextUsed: ['trail.water_ahead'],
		generatedAt: '2026-07-11T12:30:00.000Z'
	};

	assert.equal(scoutOfflineSmokePassed(answer, expectedWater), true);
	assert.equal(scoutOfflineSmokePassed({ ...answer, answer: 'I do not know.' }, expectedWater), false);
	assert.equal(scoutOfflineSmokePassed({ ...answer, answer: 'Test Spring is ahead.' }, expectedWater), false);
	assert.equal(scoutOfflineSmokePassed({ ...answer, answer: 'Water is at mile 42.5.' }, expectedWater), false);
	assert.equal(
		scoutOfflineSmokePassed(
			{ ...answer, answer: 'Test Spring is the next source at mile 142.5.' },
			expectedWater
		),
		false
	);
	assert.equal(
		scoutOfflineSmokePassed(
			{ ...answer, answer: 'Test Spring is the next source at mile 142.' },
			{ ...expectedWater, mile: 42 }
		),
		false
	);
	assert.equal(scoutOfflineSmokePassed({ ...answer, provider: 'cloud-scout', mode: 'cloud' }, expectedWater), false);
	assert.equal(scoutOfflineSmokePassed({ ...answer, receipts: [] }, expectedWater), false);
});

test('the shipped smoke prompt exercises local water tools and produces proof evidence', async () => {
	const pack = cloneDefaultContextPack();
	pack.hiker.currentMile = 40;
	pack.hiker.direction = 'NOBO';
	pack.water = [{ name: 'Test Spring', mile: 42.5, reliability: 'reliable' }];
	const expectedWater = scoutOfflineWaterExpectation(pack);
	assert.ok(expectedWater);

	const { runtime } = createScoutRuntime({
		initialPack: pack,
		onDeviceBridge: {
			isAvailable: async () => true,
			describeModel: async () => null,
			generate: async () => {
				return {
					text: `${expectedWater.name} is the next saved water source at mile ${expectedWater.mile}.`,
					truncated: false
				};
			}
		}
	});
	const answer = await runtime.ask({
		prompt: SCOUT_OFFLINE_SMOKE_PROMPT,
		onlineStatus: false,
		batterySaver: true,
		allowCloud: false,
		preferredMode: 'on-device'
	});

	assert.equal(answer.toolInvocations.some((tool) => tool.toolId === 'next_water'), true);
	assert.equal(answer.receipts.length > 0, true);
	assert.equal(scoutOfflineSmokePassed(answer, expectedWater), true);
});
