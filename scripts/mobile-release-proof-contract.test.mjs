import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
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
	assert.equal(proof.evidence.loaded, true);
	assert.equal(proof.evidence.path, 'docs/launch/release-evidence.json');
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
		'privacy-and-support-routes',
		'android-foreground-location-permission'
	]) {
		assert.ok(ids.has(requiredId), `missing release proof item: ${requiredId}`);
	}
});

test('mobile release proof can satisfy a manual gate from verified evidence', () => {
	const proofDir = mkdtempSync(join(tmpdir(), 'hogg-release-proof-'));
	const artifactPath = join(proofDir, 'mailbox-proof.txt');
	const evidencePath = join(proofDir, 'release-evidence.json');
	writeFileSync(artifactPath, 'privacy mailbox test received\n');
	writeFileSync(
		evidencePath,
		JSON.stringify(
			{
				schemaVersion: 1,
				items: {
					'privacy-contact-and-deletion': {
						status: 'verified',
						verifiedAt: '2026-06-20T18:46:11Z',
						verifiedBy: 'release-test',
						summary: 'Privacy mailbox receives deletion requests.',
						files: [artifactPath]
					}
				}
			},
			null,
			2
		)
	);

	const result = runProof(['--json', '--evidence', evidencePath]);
	const proof = JSON.parse(result.stdout);
	const item = proof.items.find((candidate) => candidate.id === 'privacy-contact-and-deletion');

	assert.equal(result.status, 0, result.stderr);
	assert.equal(item.status, 'pass');
	assert.match(item.detail, /Evidence verified 2026-06-20T18:46:11Z by release-test/u);
	assert.equal(proof.readyForSubmission, false);
});

test('mobile release proof turns broken verified evidence into a blocker', () => {
	const proofDir = mkdtempSync(join(tmpdir(), 'hogg-release-proof-'));
	const evidencePath = join(proofDir, 'release-evidence.json');
	writeFileSync(
		evidencePath,
		JSON.stringify(
			{
				schemaVersion: 1,
				items: {
					'privacy-contact-and-deletion': {
						status: 'verified',
						verifiedAt: '2026-06-20T18:46:11Z',
						verifiedBy: 'release-test',
						summary: 'Claims proof but references a missing file.',
						files: [join(proofDir, 'missing.txt')]
					}
				}
			},
			null,
			2
		)
	);

	const result = runProof(['--json', '--evidence', evidencePath]);
	const proof = JSON.parse(result.stdout);
	const item = proof.items.find((candidate) => candidate.id === 'privacy-contact-and-deletion');

	assert.equal(result.status, 0, result.stderr);
	assert.equal(item.status, 'blocker');
	assert.match(item.detail, /referenced file not found/u);
});

test('mobile release proof can record a failed proof attempt as blocked evidence', () => {
	const proofDir = mkdtempSync(join(tmpdir(), 'hogg-release-proof-'));
	const artifactPath = join(proofDir, 'mailbox-blocked.txt');
	const evidencePath = join(proofDir, 'release-evidence.json');
	writeFileSync(artifactPath, 'privacy mailbox bounced: relay access denied\n');
	writeFileSync(
		evidencePath,
		JSON.stringify(
			{
				schemaVersion: 1,
				items: {
					'privacy-contact-and-deletion': {
						status: 'blocked',
						summary: 'privacy mailbox bounced during release proof.',
						files: [artifactPath]
					}
				}
			},
			null,
			2
		)
	);

	const result = runProof(['--json', '--evidence', evidencePath]);
	const proof = JSON.parse(result.stdout);
	const item = proof.items.find((candidate) => candidate.id === 'privacy-contact-and-deletion');

	assert.equal(result.status, 0, result.stderr);
	assert.equal(item.status, 'blocker');
	assert.equal(item.detail, 'privacy mailbox bounced during release proof.');
});

test('mobile release proof rejects an evidence flag without a path', () => {
	const result = runProof(['--evidence']);

	assert.equal(result.status, 2);
	assert.match(result.stderr, /--evidence requires a path/u);
});

test('mobile release proof strict mode fails until manual/device/account proof is complete', () => {
	const result = runProof(['--strict']);

	assert.notEqual(result.status, 0);
	assert.match(result.stdout, /NOT READY for store submission/u);
	assert.match(result.stdout, /manual\/device\/account evidence remains/u);
});

test('mobile release proof next mode prints unresolved gates and evidence stubs', () => {
	const result = runProof(['--next']);

	assert.equal(result.status, 0, result.stderr);
	assert.match(result.stdout, /Trail Assistant remaining release proof/u);
	assert.match(result.stdout, /ios-development-team/u);
	assert.match(result.stdout, /app-store-connect-record/u);
	assert.match(result.stdout, /Evidence JSON stub/u);
	assert.doesNotMatch(result.stdout, /code-build:/u);
});

test('root test suite runs the mobile release proof contract', () => {
	const rootPackage = readFileSync(new URL('../package.json', import.meta.url), 'utf8');

	assert.match(rootPackage, /scripts\/mobile-release-proof-contract\.test\.mjs/u);
});
