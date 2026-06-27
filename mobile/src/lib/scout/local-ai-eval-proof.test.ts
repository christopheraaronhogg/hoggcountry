import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
	scoutLocalAiEvalProofStatus,
	scoutLocalAiEvalRunContextProblems,
	type ScoutLocalAiEvalNativePreflight
} from './local-ai-eval-proof.ts';

const finalProof = {
	nativePlatform: 'ios',
	installSource: 'testflight',
	minAppVersion: '1.0',
	minAppBuild: 11
};

const testflightNative: ScoutLocalAiEvalNativePreflight = {
	metadataLoaded: true,
	isNativePlatform: true,
	platform: 'ios',
	installSourceType: 'testflight',
	installSourceLabel: 'TestFlight',
	appVersion: '1.0',
	appBuild: '11'
};

test('Scout Eval Lab proof status unlocks the full run only for the required TestFlight iOS build', () => {
	const status = scoutLocalAiEvalProofStatus({
		suiteLoaded: true,
		modelReady: true,
		scoutUsesCloud: false,
		running: false,
		native: testflightNative,
		finalProof
	});

	assert.equal(status.canRunSmoke, true);
	assert.equal(status.canRunFinal, true);
	assert.equal(status.statusLabel, 'TestFlight ready');
	assert.equal(status.checks.find((check) => check.id === 'install')?.ok, true);
	assert.equal(status.checks.find((check) => check.id === 'build')?.ok, true);
});

test('Scout Eval Lab proof status allows smoke but blocks final 100 on debug installs', () => {
	const status = scoutLocalAiEvalProofStatus({
		suiteLoaded: true,
		modelReady: true,
		scoutUsesCloud: false,
		running: false,
		native: {
			...testflightNative,
			installSourceType: 'debug',
			installSourceLabel: 'Debug'
		},
		finalProof
	});

	assert.equal(status.canRunSmoke, true);
	assert.equal(status.canRunFinal, false);
	assert.equal(status.statusLabel, 'Smoke only');
	assert.deepEqual(
		status.checks.map((check) => [check.id, check.ok]),
		[
			['suite', true],
			['model', true],
			['lane', true],
			['shell', true],
			['install', false],
			['build', true]
		]
	);
});

test('Scout Eval Lab proof status allows smoke but blocks final 100 on stale TestFlight builds', () => {
	const status = scoutLocalAiEvalProofStatus({
		suiteLoaded: true,
		modelReady: true,
		scoutUsesCloud: false,
		running: false,
		native: {
			...testflightNative,
			appBuild: '10'
		},
		finalProof
	});

	assert.equal(status.canRunSmoke, true);
	assert.equal(status.canRunFinal, false);
	assert.equal(status.statusLabel, 'Build too old');
	assert.equal(status.checks.find((check) => check.id === 'build')?.ok, false);
	assert.equal(status.checks.find((check) => check.id === 'build')?.value, '1.0 (10)');
});

test('Scout Eval Lab proof status blocks web or cloud lanes', () => {
	const status = scoutLocalAiEvalProofStatus({
		suiteLoaded: true,
		modelReady: true,
		scoutUsesCloud: true,
		running: false,
		native: {
			metadataLoaded: true,
			isNativePlatform: false,
			platform: 'web',
			installSourceType: null,
			installSourceLabel: 'Unknown'
		},
		finalProof
	});

	assert.equal(status.canRunSmoke, false);
	assert.equal(status.canRunFinal, false);
	assert.equal(status.statusLabel, 'Web lane');
	assert.equal(status.checks.find((check) => check.id === 'lane')?.value, 'Cloud');
	assert.equal(status.checks.find((check) => check.id === 'shell')?.value, 'Web/PWA');
});

test('Scout Eval Lab proof status blocks while running or while the model is missing', () => {
	const running = scoutLocalAiEvalProofStatus({
		suiteLoaded: true,
		modelReady: true,
		scoutUsesCloud: false,
		running: true,
		native: testflightNative,
		finalProof
	});
	const missingModel = scoutLocalAiEvalProofStatus({
		suiteLoaded: true,
		modelReady: false,
		scoutUsesCloud: false,
		running: false,
		native: testflightNative,
		finalProof
	});

	assert.equal(running.canRunSmoke, false);
	assert.equal(running.canRunFinal, false);
	assert.equal(running.statusLabel, 'Running');
	assert.equal(missingModel.canRunSmoke, false);
	assert.equal(missingModel.statusLabel, 'Needs model');
});

test('Scout Eval Lab run context proves a full export came from the required TestFlight iPhone build', () => {
	const problems = scoutLocalAiEvalRunContextProblems({
		finalProof,
		runContext: {
			surface: 'mobile-settings-scout-eval-lab',
			scoutLane: 'ios-on-device-gemma',
			modelState: 'ready',
			modelId: 'gemma-3n-E4B-it-int4',
			runtimeConfigured: true,
			native: {
				isNativePlatform: true,
				platform: 'ios'
			},
			app: {
				id: 'com.hoggcountry.trailassistant',
				version: '1.0',
				build: '11'
			},
			installSource: {
				type: 'testflight',
				detectedBy: 'ios-app-store-receipt'
			}
		}
	});

	assert.deepEqual(problems, []);
});

test('Scout Eval Lab run context catches stale or non-TestFlight full exports before sharing', () => {
	const problems = scoutLocalAiEvalRunContextProblems({
		finalProof,
		runContext: {
			surface: 'mobile-settings-scout-eval-lab',
			modelId: '',
			runtimeConfigured: false,
			native: {
				isNativePlatform: true,
				platform: 'ios'
			},
			app: {
				id: 'com.hoggcountry.trailassistant',
				version: '1.0',
				build: '10'
			},
			installSource: {
				type: 'debug'
			}
		}
	});

	assert.ok(problems.includes('not a testflight install'));
	assert.ok(problems.includes('app build is not 1.0 (>= 11)'));
	assert.ok(problems.includes('local runtime was not configured'));
	assert.ok(problems.includes('model id is missing'));
});
