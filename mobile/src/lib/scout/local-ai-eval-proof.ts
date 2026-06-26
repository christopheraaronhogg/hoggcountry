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

export type ScoutLocalAiEvalFinalProofRequirement = {
	nativePlatform?: string;
	installSource?: string;
	minAppVersion?: string;
	minAppBuild?: number;
};

export type ScoutLocalAiEvalProofStatusInput = {
	suiteLoaded: boolean;
	modelReady: boolean;
	scoutUsesCloud: boolean;
	running: boolean;
	native: ScoutLocalAiEvalNativePreflight;
	finalProof?: ScoutLocalAiEvalFinalProofRequirement | null;
};

export type ScoutLocalAiEvalProofCheck = {
	id: 'suite' | 'model' | 'lane' | 'shell' | 'install' | 'build';
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
	const nativePlatform = input.finalProof?.nativePlatform ?? 'ios';
	const installSource = input.finalProof?.installSource ?? 'testflight';
	const shellOk = input.native.isNativePlatform === true && input.native.platform === nativePlatform;
	const installOk = input.native.installSourceType === installSource;
	const buildOk = appBuildMeetsRequirement(input.native, input.finalProof);
	const canRunSmoke = suiteOk && modelOk && laneOk && shellOk && !input.running;
	const canRunFinal = canRunSmoke && installOk && buildOk;
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
		},
		{
			id: 'build',
			label: 'Build',
			value: appBuildLabel(input.native),
			ok: buildOk
		}
	];

	return {
		statusLabel: statusLabel({ input, canRunSmoke, canRunFinal, shellOk, installOk, buildOk }),
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
	buildOk: boolean;
}): string {
	if (input.input.running) return 'Running';
	if (input.canRunFinal) return 'TestFlight ready';
	if (!input.input.suiteLoaded) return 'Loading suite';
	if (!input.input.modelReady) return 'Needs model';
	if (input.input.scoutUsesCloud) return 'Web lane';
	if (!input.shellOk) return 'iOS app only';
	if (input.canRunSmoke && !input.installOk) return 'Smoke only';
	if (input.canRunSmoke && !input.buildOk) return 'Build too old';
	return 'Checking';
}

function appBuildMeetsRequirement(
	native: ScoutLocalAiEvalNativePreflight,
	finalProof: ScoutLocalAiEvalFinalProofRequirement | null | undefined
): boolean {
	const requiredVersion = String(finalProof?.minAppVersion ?? '').trim();
	const requiredBuild = finalProof?.minAppBuild;
	if (!requiredVersion && !requiredBuild) return true;
	if (requiredVersion && native.appVersion !== requiredVersion) return false;
	if (!requiredBuild) return true;
	const appBuild = Number(native.appBuild);
	return Number.isFinite(appBuild) && appBuild >= requiredBuild;
}

function appBuildLabel(native: ScoutLocalAiEvalNativePreflight): string {
	if (!native.metadataLoaded) return 'Checking';
	const version = native.appVersion || '?';
	const build = native.appBuild || '?';
	return `${version} (${build})`;
}
