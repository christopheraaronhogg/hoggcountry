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

export const SCOUT_LOCAL_AI_EVAL_SURFACE = 'mobile-settings-scout-eval-lab';
export const SCOUT_LOCAL_AI_BUNDLE_ID = 'com.hoggcountry.trailassistant';

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

export function scoutLocalAiEvalRunContextProblems(input: {
	runContext: Record<string, unknown> | null | undefined;
	finalProof?: ScoutLocalAiEvalFinalProofRequirement | null;
}): string[] {
	const problems: string[] = [];
	const finalProof = input.finalProof ?? {};
	const nativePlatform = finalProof.nativePlatform ?? 'ios';
	const installSource = finalProof.installSource ?? 'testflight';
	const native = recordAt(input.runContext, 'native');
	const app = recordAt(input.runContext, 'app');
	const install = recordAt(input.runContext, 'installSource');

	if (stringAt(input.runContext, 'surface') !== SCOUT_LOCAL_AI_EVAL_SURFACE) {
		problems.push('wrong Eval Lab surface');
	}
	if (booleanAt(native, 'isNativePlatform') !== true) {
		problems.push('not an installed native app run');
	}
	if (stringAt(native, 'platform') !== nativePlatform) {
		problems.push(`not a ${nativePlatform} run`);
	}
	if (stringAt(app, 'id') !== SCOUT_LOCAL_AI_BUNDLE_ID) {
		problems.push('wrong app bundle');
	}
	if (stringAt(install, 'type') !== installSource) {
		problems.push(`not a ${installSource} install`);
	}
	if (!appVersionMeetsRequirement(app, finalProof)) {
		problems.push(`app build is not ${appRequirementLabel(finalProof)}`);
	}
	if (booleanAt(input.runContext, 'runtimeConfigured') !== true) {
		problems.push('local runtime was not configured');
	}
	if (!stringAt(input.runContext, 'modelId')) {
		problems.push('model id is missing');
	}

	return problems;
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
	return appVersionMeetsRequirement({
		version: native.appVersion,
		build: native.appBuild
	}, finalProof);
}

function appVersionMeetsRequirement(
	app: Record<string, unknown> | null | undefined,
	finalProof: ScoutLocalAiEvalFinalProofRequirement | null | undefined
): boolean {
	const requiredVersion = String(finalProof?.minAppVersion ?? '').trim();
	const requiredBuild = finalProof?.minAppBuild;
	if (!requiredVersion && !requiredBuild) return true;
	if (requiredVersion && stringAt(app, 'version') !== requiredVersion) return false;
	if (!requiredBuild) return true;
	const appBuild = Number(stringAt(app, 'build'));
	return Number.isFinite(appBuild) && appBuild >= requiredBuild;
}

function appBuildLabel(native: ScoutLocalAiEvalNativePreflight): string {
	if (!native.metadataLoaded) return 'Checking';
	const version = native.appVersion || '?';
	const build = native.appBuild || '?';
	return `${version} (${build})`;
}

function appRequirementLabel(finalProof: ScoutLocalAiEvalFinalProofRequirement | null | undefined): string {
	const version = String(finalProof?.minAppVersion ?? '').trim() || '<any version>';
	const build = finalProof?.minAppBuild ? `>= ${finalProof.minAppBuild}` : '<any build>';
	return `${version} (${build})`;
}

function recordAt(value: unknown, key: string): Record<string, unknown> | null {
	if (!value || typeof value !== 'object') return null;
	const child = (value as Record<string, unknown>)[key];
	return child && typeof child === 'object' ? child as Record<string, unknown> : null;
}

function stringAt(value: Record<string, unknown> | null | undefined, key: string): string | null {
	const child = value?.[key];
	return typeof child === 'string' && child ? child : null;
}

function booleanAt(value: Record<string, unknown> | null | undefined, key: string): boolean | null {
	const child = value?.[key];
	return typeof child === 'boolean' ? child : null;
}
