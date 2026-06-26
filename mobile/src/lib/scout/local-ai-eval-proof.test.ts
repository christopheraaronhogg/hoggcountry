import assert from 'node:assert/strict';
import { test } from 'node:test';

import { scoutLocalAiEvalProofStatus, type ScoutLocalAiEvalNativePreflight } from './local-ai-eval-proof.ts';

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
