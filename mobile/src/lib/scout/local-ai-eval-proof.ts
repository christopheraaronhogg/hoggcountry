export type ScoutLocalAiEvalNativePreflight = {
	metadataLoaded: boolean;
	metadataError?: string | null;
	isNativePlatform: boolean | null;
	platform: string | null;
	installSourceType: string | null;
	installSourceLabel: string;
	appVersion?: string | null;
	appBuild?: string | null;
};

export type ScoutLocalAiEvalProofStatusInput = {
	suiteLoaded: boolean;
	modelReady: boolean;
	scoutUsesCloud: boolean;
	running: boolean;
	native: ScoutLocalAiEvalNativePreflight;
};

export type ScoutLocalAiEvalProofCheck = {
	id: 'suite' | 'model' | 'lane' | 'shell' | 'install';
	label: string;
	value: string;
	ok: boolean;
};

export type ScoutLocalAiEvalProofStatus = {
	statusLabel: string;
	canRunSmoke: boolean;
	canRunFinal: boolean;
	checks: ScoutLocalAiEvalProofCheck[];
};

export function scoutLocalAiEvalProofStatus(
	input: ScoutLocalAiEvalProofStatusInput
): ScoutLocalAiEvalProofStatus {
	const suiteOk = input.suiteLoaded;
	const modelOk = input.modelReady;
	const laneOk = !input.scoutUsesCloud;
	const shellOk = input.native.isNativePlatform === true && input.native.platform === 'ios';
	const installOk = input.native.installSourceType === 'testflight';
	const canRunSmoke = suiteOk && modelOk && laneOk && shellOk && !input.running;
	const canRunFinal = canRunSmoke && installOk;
	const checks: ScoutLocalAiEvalProofCheck[] = [
		{
			id: 'suite',
			label: 'Suite',
			value: suiteOk ? 'Loaded' : 'Loading',
			ok: suiteOk
		},
		{
			id: 'model',
			label: 'Model',
			value: modelOk ? 'Ready' : 'Needs model',
			ok: modelOk
		},
		{
			id: 'lane',
			label: 'Lane',
			value: laneOk ? 'On-device' : 'Cloud',
			ok: laneOk
		},
		{
			id: 'shell',
			label: 'Shell',
			value: shellLabel(input.native),
			ok: shellOk
		},
		{
			id: 'install',
			label: 'Install',
			value: input.native.metadataLoaded ? input.native.installSourceLabel : 'Checking',
			ok: installOk
		}
	];

	return {
		statusLabel: statusLabel({ input, canRunSmoke, canRunFinal, shellOk, installOk }),
		canRunSmoke,
		canRunFinal,
		checks
	};
}

function shellLabel(native: ScoutLocalAiEvalNativePreflight): string {
	if (native.isNativePlatform === true && native.platform === 'ios') return 'iOS app';
	if (native.isNativePlatform === true && native.platform) return `${native.platform} app`;
	if (native.isNativePlatform === false) return 'Web/PWA';
	return native.metadataError ? 'Unknown' : 'Checking';
}

function statusLabel(input: {
	input: ScoutLocalAiEvalProofStatusInput;
	canRunSmoke: boolean;
	canRunFinal: boolean;
	shellOk: boolean;
	installOk: boolean;
}): string {
	if (input.input.running) return 'Running';
	if (input.canRunFinal) return 'TestFlight ready';
	if (!input.input.suiteLoaded) return 'Loading suite';
	if (!input.input.modelReady) return 'Needs model';
	if (input.input.scoutUsesCloud) return 'Web lane';
	if (!input.shellOk) return 'iOS app only';
	if (input.canRunSmoke && !input.installOk) return 'Smoke only';
	return 'Checking';
}
