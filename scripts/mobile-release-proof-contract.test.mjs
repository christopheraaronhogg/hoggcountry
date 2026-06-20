import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const mobileDir = new URL('../mobile/', import.meta.url);

function runProof(args = []) {
	return spawnSync(process.execPath, ['scripts/release-proof.mjs', ...args], {
		cwd: mobileDir,
		encoding: 'utf8'
	});
}

test('mobile release proof keeps store readiness separate from green code/config checks', () => {
	const result = runProof(['--json']);

	assert.equal(result.status, 0, result.stderr);
	const proof = JSON.parse(result.stdout);

	assert.equal(proof.readyForSubmission, false);
	assert.ok(proof.summary.manual > 0);
	assert.ok(proof.items.some((item) => item.status === 'pass'));
	assert.ok(proof.items.some((item) => item.status === 'manual'));
});

test('mobile release proof tracks account, device, privacy, and accessibility gates', () => {
	const result = runProof(['--json']);
	const proof = JSON.parse(result.stdout);
	const ids = new Set(proof.items.map((item) => item.id));

	for (const requiredId of [
		'ios-development-team',
		'app-store-connect-record',
		'android-upload-keystore',
		'play-console-record',
		'ios-physical-scout-answer',
		'android-physical-scout-answer',
		'physical-gps-permission',
		'offline-kill-relaunch',
		'battery-thermal-latency',
		'accessibility-field-pass',
		'privacy-contact-and-deletion',
		'privacy-and-support-routes'
	]) {
		assert.ok(ids.has(requiredId), `missing release proof item: ${requiredId}`);
	}
});

test('mobile release proof strict mode fails until manual/device/account proof is complete', () => {
	const result = runProof(['--strict']);

	assert.notEqual(result.status, 0);
	assert.match(result.stdout, /NOT READY for store submission/u);
	assert.match(result.stdout, /manual\/device\/account evidence remains/u);
});

test('root test suite runs the mobile release proof contract', () => {
	const rootPackage = readFileSync(new URL('../package.json', import.meta.url), 'utf8');

	assert.match(rootPackage, /scripts\/mobile-release-proof-contract\.test\.mjs/u);
});
