import type { PersistenceAdapter } from './context-pack-store.ts';
import type { ScoutGemmaModelStatus } from './capacitor-gemma-bridge.ts';

export const SCOUT_OFFLINE_PROOF_SCHEMA = 1;
export const SCOUT_OFFLINE_PROOF_STORAGE_KEY = 'hoggcountry:scout-offline-proof:v1';

export type ScoutOfflineAppIdentity = {
	version: string;
	build: string;
	platform: string;
};

export type ScoutOfflineProofIdentity = {
	schemaVersion: typeof SCOUT_OFFLINE_PROOF_SCHEMA;
	modelId: string;
	expectedChecksum: string;
	expectedBytes: number;
	appVersion: string;
	appBuild: string;
	platform: string;
};

export type ScoutOfflineProof = ScoutOfflineProofIdentity & {
	passedAt: string;
};

export type ScoutRuntimeReadiness = 'idle' | 'initializing' | 'ready' | 'failed';
export type ScoutOfflineTestState = 'idle' | 'testing' | 'passed' | 'failed' | 'network-required';

export type ScoutOfflineReadinessStage =
	| 'unsupported'
	| 'needs_model'
	| 'file_verified'
	| 'initializing'
	| 'runtime_ready'
	| 'testing'
	| 'offline_ready'
	| 'failed';

export type ScoutOfflineReadiness = {
	stage: ScoutOfflineReadinessStage;
	label: string;
	detail: string;
	passedAt: string | null;
	canTest: boolean;
};

export function createScoutOfflineProofIdentity(
	model: ScoutGemmaModelStatus | null,
	app: ScoutOfflineAppIdentity | null
): ScoutOfflineProofIdentity | null {
	if (
		!model ||
		model.state !== 'ready' ||
		model.runtimeConfigured === false ||
		model.checksumConfigured !== true ||
		!model.expectedChecksum?.trim() ||
		!model.modelId.trim() ||
		!Number.isFinite(model.expectedBytes) ||
		model.expectedBytes <= 0 ||
		!app?.version.trim() ||
		!app.build.trim() ||
		!app.platform.trim()
	) {
		return null;
	}

	return {
		schemaVersion: SCOUT_OFFLINE_PROOF_SCHEMA,
		modelId: model.modelId.trim(),
		expectedChecksum: model.expectedChecksum.trim().toLowerCase(),
		expectedBytes: model.expectedBytes,
		appVersion: app.version.trim(),
		appBuild: app.build.trim(),
		platform: app.platform.trim().toLowerCase()
	};
}

export function createScoutOfflineProof(
	identity: ScoutOfflineProofIdentity,
	passedAt = new Date().toISOString()
): ScoutOfflineProof {
	if (!validIsoDate(passedAt)) throw new Error('Offline Scout proof needs a valid pass time.');
	return { ...identity, passedAt };
}

export function parseScoutOfflineProof(raw: string | null | undefined): ScoutOfflineProof | null {
	if (!raw) return null;
	try {
		const value = JSON.parse(raw) as Partial<ScoutOfflineProof>;
		if (
			value.schemaVersion !== SCOUT_OFFLINE_PROOF_SCHEMA ||
			typeof value.modelId !== 'string' ||
			!value.modelId.trim() ||
			typeof value.expectedChecksum !== 'string' ||
			!value.expectedChecksum.trim() ||
			typeof value.expectedBytes !== 'number' ||
			!Number.isFinite(value.expectedBytes) ||
			value.expectedBytes <= 0 ||
			typeof value.appVersion !== 'string' ||
			!value.appVersion.trim() ||
			typeof value.appBuild !== 'string' ||
			!value.appBuild.trim() ||
			typeof value.platform !== 'string' ||
			!value.platform.trim() ||
			typeof value.passedAt !== 'string' ||
			!validIsoDate(value.passedAt)
		) {
			return null;
		}

		return {
			schemaVersion: SCOUT_OFFLINE_PROOF_SCHEMA,
			modelId: value.modelId.trim(),
			expectedChecksum: value.expectedChecksum.trim().toLowerCase(),
			expectedBytes: value.expectedBytes,
			appVersion: value.appVersion.trim(),
			appBuild: value.appBuild.trim(),
			platform: value.platform.trim().toLowerCase(),
			passedAt: value.passedAt
		};
	} catch {
		return null;
	}
}

export function scoutOfflineProofMatches(
	proof: ScoutOfflineProof | null,
	identity: ScoutOfflineProofIdentity | null
): boolean {
	if (!proof || !identity) return false;
	return (
		proof.schemaVersion === identity.schemaVersion &&
		proof.modelId === identity.modelId &&
		proof.expectedChecksum === identity.expectedChecksum &&
		proof.expectedBytes === identity.expectedBytes &&
		proof.appVersion === identity.appVersion &&
		proof.appBuild === identity.appBuild &&
		proof.platform === identity.platform
	);
}

export async function loadScoutOfflineProof(
	adapter: PersistenceAdapter | null
): Promise<ScoutOfflineProof | null> {
	if (!adapter) return null;
	const raw = await adapter.get(SCOUT_OFFLINE_PROOF_STORAGE_KEY).catch(() => null);
	return parseScoutOfflineProof(raw);
}

export async function saveScoutOfflineProof(
	adapter: PersistenceAdapter | null,
	proof: ScoutOfflineProof
): Promise<void> {
	if (!adapter) return;
	await adapter.set(SCOUT_OFFLINE_PROOF_STORAGE_KEY, JSON.stringify(proof));
}

export async function loadScoutOfflineAppIdentity(): Promise<ScoutOfflineAppIdentity | null> {
	try {
		const [{ Capacitor }, { App }] = await Promise.all([
			import('@capacitor/core'),
			import('@capacitor/app')
		]);
		if (!Capacitor.isNativePlatform()) return null;
		const info = await App.getInfo();
		if (!info.version?.trim() || !info.build?.trim()) return null;
		return {
			version: info.version.trim(),
			build: info.build.trim(),
			platform: Capacitor.getPlatform()
		};
	} catch {
		return null;
	}
}

export function deriveScoutOfflineReadiness(input: {
	supported: boolean;
	model: ScoutGemmaModelStatus | null;
	identity: ScoutOfflineProofIdentity | null;
	proof: ScoutOfflineProof | null;
	runtime: ScoutRuntimeReadiness;
	test: ScoutOfflineTestState;
	error?: string | null;
}): ScoutOfflineReadiness {
	if (!input.supported) {
		return readiness('unsupported', 'Native app required', 'The web demo uses Cloud Scout.', null, false);
	}

	if (!input.model || input.model.state !== 'ready') {
		return readiness(
			'needs_model',
			'Download model',
			'Scout needs the verified Gemma 4 model on this phone.',
			null,
			false
		);
	}

	if (input.model.runtimeConfigured === false) {
		return readiness(
			'failed',
			'Runtime unavailable',
			input.model.reason ?? 'This build does not include the Gemma 4 runtime.',
			null,
			false
		);
	}

	if (input.test === 'testing') {
		return readiness('testing', 'Testing offline', 'Running a local-only Scout answer.', null, false);
	}

	if (input.runtime === 'initializing') {
		return readiness('initializing', 'Starting local AI', 'Loading Gemma 4 on this phone.', null, false);
	}

	if (input.runtime === 'failed' || input.test === 'failed') {
		return readiness(
			'failed',
			'Test failed',
			input.error?.trim() || 'Scout could not complete the local test. Try again while on power.',
			null,
			true
		);
	}

	if (input.test === 'network-required') {
		return readiness(
			'file_verified',
			'Model verified',
			'Turn on Airplane Mode and turn Wi-Fi off, then test again.',
			null,
			true
		);
	}

	if (scoutOfflineProofMatches(input.proof, input.identity)) {
		return readiness(
			'offline_ready',
			'Offline test passed',
			`Gemma 4 answered locally on this phone ${formatProofTime(input.proof?.passedAt)}.`,
			input.proof?.passedAt ?? null,
			true
		);
	}

	if (input.runtime === 'ready') {
		return readiness(
			'runtime_ready',
			'Local AI started',
			'Gemma 4 loaded successfully. Run the disconnected test before relying on it off-grid.',
			null,
			true
		);
	}

	return readiness(
		'file_verified',
		'Model verified',
		'The model file is intact. Test it disconnected before relying on Scout off-grid.',
		null,
		true
	);
}

function readiness(
	stage: ScoutOfflineReadinessStage,
	label: string,
	detail: string,
	passedAt: string | null,
	canTest: boolean
): ScoutOfflineReadiness {
	return { stage, label, detail, passedAt, canTest };
}

function validIsoDate(value: string): boolean {
	const parsed = Date.parse(value);
	return Number.isFinite(parsed) && new Date(parsed).toISOString() === value;
}

function formatProofTime(value: string | undefined): string {
	if (!value) return 'successfully';
	return new Date(value).toLocaleString([], {
		month: 'short',
		day: 'numeric',
		hour: 'numeric',
		minute: '2-digit'
	});
}
