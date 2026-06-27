import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { mkdir, mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';
import { summarizeRunSourceEvidence } from './lib/scout-local-ai-source-evidence.mjs';
import { summarizeScoutLocalAiSuiteCoverage } from './lib/scout-local-ai-suite-coverage.mjs';
import { scoutLocalAiSuiteHash } from './lib/scout-local-ai-suite.mjs';

const SUITE_PATH = new URL('../data/scout-local-ai/dad-local-ai-100.json', import.meta.url);
const MOBILE_SUITE_PATH = new URL('../mobile/static/scout/dad-local-ai-100.json', import.meta.url);
const MOBILE_EVAL_LAB_PATH = new URL('../mobile/src/lib/components/ScoutEvalLab.svelte', import.meta.url);
const REPO_ROOT = fileURLToPath(new URL('../', import.meta.url));
const execFileAsync = promisify(execFile);
const VALID_PHASES = new Set(['pre-trail', 'on-trail']);
const VALID_TOOL_IDS = new Set([
	'current_mile',
	'next_water',
	'next_shelter',
	'next_town',
	'upcoming_terrain',
	'weather_lookup',
	'trail_conditions',
	'park_services',
	'loadout_check',
	'source_search',
	'open_source_doc',
	'bible_search'
]);
const VALID_SOURCE_SKILLS = new Set([
	'water',
	'shelter',
	'town',
	'weather',
	'trail conditions',
	'safety',
	'park services',
	'terrain',
	'loadout'
]);
const VALID_FAILURES = new Set([
	'missing-data',
	'weak-tool',
	'bad-routing',
	'bad-prompt',
	'unsafe-wording',
	'poor-ux',
	'local-model-limitation'
]);
const EXPECTED_DOMAINS = [
	'pretrip',
	'onboarding',
	'gear',
	'water',
	'shelter',
	'weather',
	'navigation',
	'safety',
	'town',
	'spiritual-offline-edge'
];

test('Dad local AI eval suite has 100 complete, reviewable cases', async () => {
	const suite = JSON.parse(await readFile(SUITE_PATH, 'utf8'));
	assert.equal(suite.schemaVersion, 1);
	assert.equal(suite.suiteId, 'dad-local-ai-100');
	assert.match(suite.version, /^\d{4}-\d{2}-\d{2}\.\d+$/u);
	assert.deepEqual(suite.finalProof, {
		nativePlatform: 'ios',
		installSource: 'testflight',
		minAppVersion: '1.0',
		minAppBuild: 11
	});
	assert.equal(suite.cases.length, 100);

	const ids = new Set();
	const domains = new Map();
	let preTrail = 0;
	let onTrail = 0;

	for (const testCase of suite.cases) {
		assert.match(testCase.id, /^DLA-\d{3}$/u, `${testCase.id} should use DLA-### id format`);
		assert.equal(ids.has(testCase.id), false, `${testCase.id} is duplicated`);
		ids.add(testCase.id);

		assert.ok(VALID_PHASES.has(testCase.phase), `${testCase.id} has invalid phase`);
		if (testCase.phase === 'pre-trail') preTrail += 1;
		if (testCase.phase === 'on-trail') onTrail += 1;

		assert.equal(typeof testCase.domain, 'string', `${testCase.id} needs a domain`);
		domains.set(testCase.domain, (domains.get(testCase.domain) ?? 0) + 1);

		assert.equal(typeof testCase.prompt, 'string', `${testCase.id} prompt must be a string`);
		assert.ok(testCase.prompt.length >= 20, `${testCase.id} prompt is too short`);
		assert.equal(typeof testCase.mile, 'number', `${testCase.id} mile must be numeric`);
		assert.ok(Number.isFinite(testCase.mile), `${testCase.id} mile must be finite`);

		assertNonEmptyStringArray(testCase.requiredTools, `${testCase.id} requiredTools`);
		assertNonEmptyStringArray(testCase.expectedTraits, `${testCase.id} expectedTraits`);
		assertNonEmptyStringArray(testCase.safetyCaveats, `${testCase.id} safetyCaveats`);
		assertNonEmptyStringArray(testCase.improvementTags, `${testCase.id} improvementTags`);

		for (const expectation of testCase.requiredTools) {
			assertValidToolExpectation(expectation, testCase.id);
		}
	}

	assert.ok(preTrail >= 20, 'suite should cover pre-trail preparation and setup');
	assert.ok(onTrail >= 60, 'suite should emphasize on-trail decisions');
	for (const domain of EXPECTED_DOMAINS) {
		assert.equal(domains.get(domain), 10, `${domain} should have exactly 10 cases`);
	}

	for (const category of suite.failureCategories) {
		assert.ok(VALID_FAILURES.has(category), `unknown failure category ${category}`);
	}
});

test('Dad local AI eval suite covers requested hiker objective areas', async () => {
	const suite = JSON.parse(await readFile(SUITE_PATH, 'utf8'));
	const coverage = summarizeScoutLocalAiSuiteCoverage(suite);
	const byId = Object.fromEntries(coverage.areas.map((area) => [area.id, area]));

	assert.equal(coverage.ok, true, coverage.errors.join('\n'));
	assert.equal(coverage.errors.length, 0);
	assert.ok(byId['trail-prep'].count >= 25);
	assert.ok(byId['daily-hiking-decisions'].count >= 45);
	assert.ok(byId.water.count >= 10);
	assert.ok(byId.shelter.count >= 10);
	assert.ok(byId.weather.count >= 10);
	assert.ok(byId.resupply.count >= 10);
	assert.ok(byId.safety.count >= 20);
	assert.ok(byId.gear.count >= 10);
	assert.ok(byId['bible-spiritual-support'].count >= 5);
	assert.ok(byId['offline-local-ai-use'].count >= 10);
	assert.ok(byId['confusing-edge-cases'].count >= 10);
});

test('objective coverage summary fails when a requested objective area disappears', async () => {
	const suite = JSON.parse(await readFile(SUITE_PATH, 'utf8'));
	const weakened = {
		...suite,
		cases: suite.cases.filter((testCase) => testCase.domain !== 'spiritual-offline-edge')
	};
	const coverage = summarizeScoutLocalAiSuiteCoverage(weakened);

	assert.equal(coverage.ok, false);
	assert.match(coverage.errors.join('\n'), /Bible and spiritual support coverage/u);
});

test('mobile embedded Dad local AI eval suite matches canonical suite', async () => {
	const canonical = JSON.parse(await readFile(SUITE_PATH, 'utf8'));
	const mobile = JSON.parse(await readFile(MOBILE_SUITE_PATH, 'utf8'));
	assert.deepEqual(mobile, canonical);
});

test('mobile Eval Lab exposes resilient iPhone export paths', async () => {
	const component = await readFile(MOBILE_EVAL_LAB_PATH, 'utf8');
	assert.match(component, /navigator\.share/u, 'Eval Lab needs native Share Sheet export');
	assert.match(component, /navigator\.clipboard\.writeText/u, 'Eval Lab needs clipboard export');
	assert.match(component, /document\.execCommand\('copy'\)/u, 'Eval Lab needs a textarea copy fallback');
	assert.match(component, /proofStatus\.canRunFinal/u, 'Run 100 should be gated by final-proof readiness');
	assert.match(component, /proofStatus\.canRunSmoke/u, 'Run 3 should remain available for smoke readiness');
	assert.match(component, /TestFlight/u, 'Eval Lab should surface TestFlight install-source readiness');
	assert.match(component, />\s*Share\s*</u, 'Share action should be visible when a run exists');
	assert.match(component, />\s*Copy\s*</u, 'Copy action should be visible when a run exists');
	assert.match(component, />\s*Download\s*</u, 'Download action should remain available');
});

test('status command keeps routing proof separate from missing device proof', async () => {
	const suite = JSON.parse(await readFile(SUITE_PATH, 'utf8'));
	const outputDir = await mkdtemp(join(tmpdir(), 'scout-local-ai-status-routing-'));
	const runsDir = join(outputDir, 'runs');
	const deviceRunsDir = join(outputDir, 'device-runs');
	const reviewsDir = join(outputDir, 'reviews');
	await mkdir(runsDir, { recursive: true });
	const routingRun = deviceRunForCases(suite, suite.cases, {
		runId: 'routing-status-proof',
		completeTools: true
	});
	routingRun.evidenceLane = 'scaffold-not-model';
	routingRun.runContext = null;
	for (const result of routingRun.results) result.answerOrigin = 'scaffold-not-model';
	await writeFile(join(runsDir, 'routing-status-proof.json'), `${JSON.stringify(routingRun, null, 2)}\n`);

	const result = await execFileAsync(
		process.execPath,
		[
			'scripts/status-scout-local-ai.mjs',
			'--runs-dir',
			runsDir,
			'--device-runs-dir',
			deviceRunsDir,
			'--reviews-dir',
			reviewsDir,
			'--json'
		],
		{ cwd: REPO_ROOT, maxBuffer: 1024 * 1024 * 2 }
	);
	const status = JSON.parse(result.stdout);
	const gates = Object.fromEntries(status.gates.map((gate) => [gate.id, gate]));

	assert.equal(status.suite.caseCount, 100);
	assert.equal(status.suite.coverage.ok, true);
	assert.equal(gates.suite.ok, true);
	assert.equal(gates.coverage.ok, true);
	assert.equal(gates.routing.ok, true);
	assert.equal(gates['testflight-target'].ok, false);
	assert.equal(gates['device-run'].ok, false);
	assert.equal(status.runs.currentFullRoutingRuns.length, 1);
	assert.equal(status.strictDeviceProofs.length, 0);
	assert.equal(status.suite.finalProof.requiredApp, '1.0 (>= 11)');
	assert.equal(status.testflight.targetBuild, '1.0 (11)');
	assert.equal(status.testflight.suiteRequiredBuild, '1.0 (>= 11)');
	assert.equal(status.testflight.targetBuildMeetsSuiteRequirement, true);
	assert.equal(status.testflight.recordedDadPilotBuild, '1.0 (10)');
	assert.equal(status.testflight.recordedDadPilotMeetsSuiteRequirement, false);
	assert.equal(status.testflight.targetBuildReadyForDad, false);
	assert.equal(status.testflight.targetBuildAvailableForDad, false);
	assert.equal(status.nextAction.kind, 'publish-target-build');
	assert.match(status.nextAction.text, /Upload and attach target iOS build 1\.0 \(11\)/u);
	assert.match(status.nextAction.text, /suite requires 1\.0 \(>= 11\)/u);
});

test('status command surfaces target TestFlight build gaps before phone eval', async () => {
	const suite = JSON.parse(await readFile(SUITE_PATH, 'utf8'));
	const outputDir = await mkdtemp(join(tmpdir(), 'scout-local-ai-status-build-gap-'));
	const runsDir = join(outputDir, 'runs');
	const deviceRunsDir = join(outputDir, 'device-runs');
	const reviewsDir = join(outputDir, 'reviews');
	const releaseEvidencePath = join(outputDir, 'release-evidence.json');
	await mkdir(runsDir, { recursive: true });
	const routingRun = deviceRunForCases(suite, suite.cases, {
		runId: 'routing-status-build-gap-proof',
		completeTools: true
	});
	routingRun.evidenceLane = 'scaffold-not-model';
	routingRun.runContext = null;
	for (const result of routingRun.results) result.answerOrigin = 'scaffold-not-model';
	await writeFile(join(runsDir, 'routing-status-build-gap-proof.json'), `${JSON.stringify(routingRun, null, 2)}\n`);
	await writeFile(releaseEvidencePath, `${JSON.stringify({
		schemaVersion: 1,
		items: {
			'dad-testflight-invite': {
				status: 'verified',
				summary: 'Dad Pilot is attached to Hoggcountry iOS build 1.0 (10), and build 11 is not attached yet.',
				publicLink: 'https://testflight.apple.com/join/BagBCrzf'
			}
		}
	}, null, 2)}\n`);

	const result = await execFileAsync(
		process.execPath,
		[
			'scripts/status-scout-local-ai.mjs',
			'--runs-dir',
			runsDir,
			'--device-runs-dir',
			deviceRunsDir,
			'--reviews-dir',
			reviewsDir,
			'--release-evidence',
			releaseEvidencePath,
			'--json'
		],
		{ cwd: REPO_ROOT, maxBuffer: 1024 * 1024 * 2 }
	);
	const status = JSON.parse(result.stdout);

	assert.equal(status.testflight.targetBuild, '1.0 (11)');
	assert.equal(status.testflight.suiteRequiredBuild, '1.0 (>= 11)');
	assert.equal(status.testflight.targetBuildMeetsSuiteRequirement, true);
	assert.equal(status.testflight.recordedDadPilotBuild, '1.0 (10)');
	assert.equal(status.testflight.recordedDadPilotMeetsSuiteRequirement, false);
	assert.equal(status.testflight.targetBuildReadyForDad, false);
	assert.equal(status.testflight.targetBuildAvailableForDad, false);
	assert.equal(status.nextAction.kind, 'publish-target-build');
	assert.match(status.nextAction.text, /Upload and attach target iOS build 1\.0 \(11\)/u);
	assert.match(status.nextAction.text, /Dad Pilot on 1\.0 \(10\)/u);
	assert.match(status.nextAction.text, /suite requires 1\.0 \(>= 11\)/u);
});

test('status command recognizes repeated strict TestFlight iPhone proof candidates', async () => {
	const suite = JSON.parse(await readFile(SUITE_PATH, 'utf8'));
	const outputDir = await mkdtemp(join(tmpdir(), 'scout-local-ai-status-device-'));
	const runsDir = join(outputDir, 'runs');
	const deviceRunsDir = join(outputDir, 'device-runs');
	const reviewsDir = join(outputDir, 'reviews');
	await mkdir(deviceRunsDir, { recursive: true });
	await mkdir(reviewsDir, { recursive: true });
	const runA = deviceRunForCases(suite, suite.cases, {
		runId: 'device-status-pass-a',
		completeTools: true,
		runContext: finalDeviceRunContext()
	});
	const runB = deviceRunForCases(suite, suite.cases, {
		runId: 'device-status-pass-b',
		completeTools: true,
		runContext: finalDeviceRunContext()
	});
	const reviewA = reviewForRun(runA, { rating: 5 });
	const reviewB = reviewForRun(runB, { rating: 5 });
	await writeFile(join(deviceRunsDir, 'device-status-pass-a.json'), `${JSON.stringify(runA, null, 2)}\n`);
	await writeFile(join(deviceRunsDir, 'device-status-pass-b.json'), `${JSON.stringify(runB, null, 2)}\n`);
	await writeFile(join(reviewsDir, 'device-status-pass-a.review.json'), `${JSON.stringify(reviewA, null, 2)}\n`);
	await writeFile(join(reviewsDir, 'device-status-pass-b.review.json'), `${JSON.stringify(reviewB, null, 2)}\n`);

	const result = await execFileAsync(
		process.execPath,
		[
			'scripts/status-scout-local-ai.mjs',
			'--runs-dir',
			runsDir,
			'--device-runs-dir',
			deviceRunsDir,
			'--reviews-dir',
			reviewsDir,
			'--json'
		],
		{ cwd: REPO_ROOT, maxBuffer: 1024 * 1024 * 2 }
	);
	const status = JSON.parse(result.stdout);
	const gates = Object.fromEntries(status.gates.map((gate) => [gate.id, gate]));

	assert.equal(gates['device-run'].ok, true);
	assert.equal(gates.review.ok, true);
	assert.equal(gates['strict-device-proof'].ok, true);
	assert.equal(gates.stability.ok, true);
	assert.equal(status.testflight.currentTargetDeviceRunCount, 2);
	assert.equal(gates['testflight-target'].ok, true);
	assert.equal(status.strictDeviceProofs.filter((proof) => proof.ok).length, 2);
	assert.equal(status.nextAction.kind, 'stability-ready');
});

test('Dad handoff command summarizes current TestFlight/iPhone eval next steps', async () => {
	const suite = JSON.parse(await readFile(SUITE_PATH, 'utf8'));
	const outputDir = await mkdtemp(join(tmpdir(), 'scout-local-ai-dad-handoff-'));
	const runsDir = join(outputDir, 'runs');
	const deviceRunsDir = join(outputDir, 'device-runs');
	const reviewsDir = join(outputDir, 'reviews');
	const releaseEvidencePath = join(outputDir, 'release-evidence.json');
	await mkdir(runsDir, { recursive: true });
	const routingRun = deviceRunForCases(suite, suite.cases, {
		runId: 'routing-handoff-proof',
		completeTools: true
	});
	routingRun.evidenceLane = 'scaffold-not-model';
	routingRun.runContext = null;
	for (const result of routingRun.results) result.answerOrigin = 'scaffold-not-model';
	await writeFile(join(runsDir, 'routing-handoff-proof.json'), `${JSON.stringify(routingRun, null, 2)}\n`);
	await writeFile(releaseEvidencePath, `${JSON.stringify({
		schemaVersion: 1,
		items: {
			'dad-testflight-invite': {
				status: 'verified',
				summary: 'Dad Pilot is attached to Hoggcountry iOS build 1.0 (10), and build 11 is not attached yet.',
				publicLink: 'https://testflight.apple.com/join/BagBCrzf'
			}
		}
	}, null, 2)}\n`);

	const result = await execFileAsync(
		process.execPath,
		[
			'scripts/scout-local-ai-dad-handoff.mjs',
			'--runs-dir',
			runsDir,
			'--device-runs-dir',
			deviceRunsDir,
			'--reviews-dir',
			reviewsDir,
			'--release-evidence',
			releaseEvidencePath
		],
		{ cwd: REPO_ROOT, maxBuffer: 1024 * 1024 * 2 }
	);

	assert.match(result.stdout, /# Dad Scout local AI Eval Lab handoff/u);
	assert.match(result.stdout, /Suite final-proof app requirement: `1\.0 \(>= 11\)`/u);
	assert.match(result.stdout, /Target iOS build for Dad Eval Lab: `1\.0 \(11\)`/u);
	assert.match(result.stdout, /Target build meets suite requirement: yes/u);
	assert.match(result.stdout, /Recorded Dad Pilot build: `1\.0 \(10\)`/u);
	assert.match(result.stdout, /Recorded Dad Pilot build meets suite requirement: no/u);
	assert.match(result.stdout, /https:\/\/testflight\.apple\.com\/join\/BagBCrzf/u);
	assert.match(result.stdout, /recorded Dad Pilot build is not ready for this suite/u);
	assert.match(result.stdout, /Upload and attach target iOS build 1\.0 \(11\)/u);
	assert.match(result.stdout, /use `Run 100` for real proof/u);
	assert.match(result.stdout, /npm run intake:scout-local-ai-device-run/u);
	assert.match(result.stdout, /npm run apply-review:scout-local-ai/u);
	assert.match(result.stdout, /npm run verify:scout-local-ai-stability-proof/u);
	assert.match(result.stdout, /Final readiness still requires a full current-suite TestFlight\/iPhone/u);
});

test('Dad local AI eval suite routes every case through expected Scout tools', async () => {
	const suite = JSON.parse(await readFile(SUITE_PATH, 'utf8'));
	const outputDir = await mkdtemp(join(tmpdir(), 'scout-local-ai-routing-'));
	await execFileAsync(
		process.execPath,
		[
			'--experimental-strip-types',
			'--experimental-transform-types',
			'scripts/run-scout-local-ai-eval.mjs',
			'--run-id',
			'routing-regression',
			'--output-dir',
			outputDir
		],
		{ cwd: REPO_ROOT, maxBuffer: 1024 * 1024 * 4 }
	);

	const run = JSON.parse(await readFile(join(outputDir, 'routing-regression.json'), 'utf8'));
	assert.equal(run.caseCount, 100);
	assert.equal(run.evidenceLane, 'scaffold-not-model');
	assert.equal(run.suiteVersion, suite.version);
	assert.equal(run.suiteHash, scoutLocalAiSuiteHash(suite));
	assert.equal(run.summary.toolExpectationComplete, 100);
	assert.deepEqual(run.summary.missingToolCounts, {});
	assert.equal(run.summary.sourceEvidenceComplete, 100);
	assert.equal(run.summary.missingSourceEvidenceCases, 0);
});

test('device run intake validates exports and creates review packet', async () => {
	const suite = JSON.parse(await readFile(SUITE_PATH, 'utf8'));
	const outputDir = await mkdtemp(join(tmpdir(), 'scout-local-ai-intake-'));
	const inputPath = join(outputDir, 'device-export.json');
	const run = deviceRunForCases(suite, suite.cases.slice(0, 2), { completeTools: true });
	await writeFile(inputPath, `${JSON.stringify(run, null, 2)}\n`);

	await execFileAsync(
		process.execPath,
		[
			'scripts/import-scout-local-ai-device-run.mjs',
			'--run',
			inputPath,
			'--allow-partial',
			'--device-run-dir',
			join(outputDir, 'device-runs'),
			'--review-dir',
			join(outputDir, 'reviews'),
			'--packet-dir',
			join(outputDir, 'review-packets')
		],
		{ cwd: REPO_ROOT, maxBuffer: 1024 * 1024 * 2 }
	);

	const imported = JSON.parse(await readFile(join(outputDir, 'device-runs', `${run.runId}.json`), 'utf8'));
	const review = JSON.parse(await readFile(join(outputDir, 'reviews', `${run.runId}.review.json`), 'utf8'));
	const packet = await readFile(join(outputDir, 'review-packets', `${run.runId}.review.md`), 'utf8');

	assert.equal(imported.evidenceLane, 'device-on-device-gemma');
	assert.equal(imported.suiteVersion, suite.version);
	assert.equal(imported.suiteHash, scoutLocalAiSuiteHash(suite));
	assert.equal(review.cases.length, 2);
	assert.equal(review.suiteVersion, suite.version);
	assert.equal(review.suiteHash, scoutLocalAiSuiteHash(suite));
	assert.equal(review.cases[0].caseId, suite.cases[0].id);
	assert.equal(review.cases[0].confidence, 'medium');
	assert.equal(review.cases[0].toolInvocationCount, suite.cases[0].requiredTools.length);
	assert.equal(review.cases[0].toolInvocations.length, suite.cases[0].requiredTools.length);
	assert.equal(review.cases[0].receipts.length, suite.cases[0].requiredTools.length);
	assert.equal(review.cases[0].answer, `device answer for ${suite.cases[0].id}`);
	assert.equal(review.cases[0].answerLength, `device answer for ${suite.cases[0].id}`.length);
	assert.equal(review.cases[0].traitChecks.length, suite.cases[0].expectedTraits.length);
	assert.equal(review.cases[0].traitChecks[0].passed, null);
	assert.equal(review.cases[0].safetyCaveatChecks.length, suite.cases[0].safetyCaveats.length);
	assert.match(review.cases[0].answerPreview, /device answer for/);
	assert.match(packet, /Scout local AI device review/u);
	assert.match(packet, new RegExp(suite.cases[0].id, 'u'));
	assert.match(packet, /Confidence: `medium`/u);
	assert.match(packet, /Trait checklist to fill in review JSON:/u);
	assert.match(packet, /Safety caveat checklist to fill in review JSON:/u);
	assert.match(packet, /Tool invocations:/u);
	assert.match(packet, /Source evidence gaps:/u);
	assert.match(packet, /Source receipts:/u);
	assert.match(packet, /Failure mode: `none`/u);
	assert.match(packet, /## Rating scale/u);
	assert.match(packet, /## Reviewer field choices/u);
	assert.match(packet, /Do not use the improvement task to weaken the eval rubric/u);
	assert.match(packet, /Valid failure categories: .*missing-data.*local-model-limitation/u);
	assert.match(packet, /Valid owner layers: data, tool-routing, prompt, safety-prompt, ui, local-model/u);
	assert.match(packet, /Suggested failure categories: `bad-routing, weak-tool`/u);
	assert.match(packet, /Suggested owner layer: `tool-routing`/u);
	assert.match(packet, /npm run apply-review:scout-local-ai/u);
	assert.match(packet, /Rating:/u);
});

test('device run intake rejects full exports with summary-only tool evidence', async () => {
	const suite = JSON.parse(await readFile(SUITE_PATH, 'utf8'));
	const outputDir = await mkdtemp(join(tmpdir(), 'scout-local-ai-intake-summary-only-'));
	const inputPath = join(outputDir, 'summary-only-device-export.json');
	const run = deviceRunForCases(suite, suite.cases, {
		runId: 'device-intake-summary-only',
		completeTools: true,
		runContext: finalDeviceRunContext()
	});
	run.results[0].toolInvocations = [];
	run.results[0].receipts = [];
	await writeFile(inputPath, `${JSON.stringify(run, null, 2)}\n`);

	await assert.rejects(
		execFileAsync(
			process.execPath,
			[
				'scripts/import-scout-local-ai-device-run.mjs',
				'--run',
				inputPath,
				'--device-run-dir',
				join(outputDir, 'device-runs'),
				'--review-dir',
				join(outputDir, 'reviews'),
				'--packet-dir',
				join(outputDir, 'review-packets')
			],
			{ cwd: REPO_ROOT, maxBuffer: 1024 * 1024 * 2 }
		),
		(error) => {
			assert.match(error.stderr, /Device run import failed validation/u);
			assert.match(error.stderr, /toolExpectations\.hit does not match actual toolInvocations/u);
			assert.match(error.stderr, /toolExpectations\.missing does not match actual toolInvocations; actual missing:/u);
			return true;
		}
	);
});

test('device run intake imports truthful missing-tool runs for review', async () => {
	const suite = JSON.parse(await readFile(SUITE_PATH, 'utf8'));
	const outputDir = await mkdtemp(join(tmpdir(), 'scout-local-ai-intake-missing-tools-'));
	const inputPath = join(outputDir, 'missing-tools-device-export.json');
	const run = deviceRunForCases(suite, suite.cases, {
		runId: 'device-intake-missing-tools',
		completeTools: true,
		runContext: finalDeviceRunContext()
	});
	run.results[0].toolInvocations = [];
	run.results[0].receipts = [];
	run.results[0].toolExpectations = {
		required: run.results[0].case.requiredTools,
		hit: [],
		missing: run.results[0].case.requiredTools
	};
	run.summary.toolExpectationComplete -= 1;
	run.summary.missingToolCases += 1;
	for (const missing of run.results[0].toolExpectations.missing) {
		run.summary.missingToolCounts[missing] = (run.summary.missingToolCounts[missing] ?? 0) + 1;
	}
	run.summary = {
		...run.summary,
		...summarizeRunSourceEvidence(run.results)
	};
	await writeFile(inputPath, `${JSON.stringify(run, null, 2)}\n`);

	const result = await execFileAsync(
		process.execPath,
		[
			'scripts/import-scout-local-ai-device-run.mjs',
			'--run',
			inputPath,
			'--device-run-dir',
			join(outputDir, 'device-runs'),
			'--review-dir',
			join(outputDir, 'reviews'),
			'--packet-dir',
			join(outputDir, 'review-packets')
		],
		{ cwd: REPO_ROOT, maxBuffer: 1024 * 1024 * 2 }
	);
	const review = JSON.parse(await readFile(join(outputDir, 'reviews', 'device-intake-missing-tools.review.json'), 'utf8'));
	const packet = await readFile(join(outputDir, 'review-packets', 'device-intake-missing-tools.review.md'), 'utf8');

	assert.match(result.stdout, /Device run imported/u);
	assert.match(result.stdout, /Required-tool complete: 99\/100/u);
	assert.match(result.stdout, /Warnings:/u);
	assert.match(result.stdout, /actual toolInvocations missed required tools/u);
	assert.equal(review.cases.length, 100);
	assert.deepEqual(review.cases[0].toolExpectations.missing, run.results[0].case.requiredTools);
	assert.match(packet, /Import warnings/u);
	assert.match(packet, /actual toolInvocations missed required tools/u);
	assert.match(packet, /Missing: /u);
});

test('device run intake imports truthful missing source receipts for review', async () => {
	const suite = JSON.parse(await readFile(SUITE_PATH, 'utf8'));
	const outputDir = await mkdtemp(join(tmpdir(), 'scout-local-ai-intake-source-missing-'));
	const inputPath = join(outputDir, 'source-missing-device-export.json');
	const sourceCase = suite.cases.find((testCase) => testCase.requiredTools.some((expectation) => expectation.includes(':')));
	assert.ok(sourceCase, 'suite should contain source-backed tool expectations');
	const run = deviceRunForCases(suite, suite.cases, {
		runId: 'device-intake-source-missing',
		completeTools: true,
		runContext: finalDeviceRunContext()
	});
	const result = run.results.find((entry) => entry.caseId === sourceCase.id);
	assert.ok(result, 'fixture run should include the source-backed case');
	for (const invocation of result.toolInvocations) {
		if (String(invocation.args?.sourceSkill ?? '').trim()) {
			invocation.receipts = [];
			invocation.sourceDocumentIds = [];
		}
	}
	result.receipts = result.toolInvocations.flatMap((record) => record.receipts ?? []);
	result.suggestedFailureCategories = [];
	run.summary = {
		...run.summary,
		...summarizeRunSourceEvidence(run.results)
	};
	await writeFile(inputPath, `${JSON.stringify(run, null, 2)}\n`);

	const importResult = await execFileAsync(
		process.execPath,
		[
			'scripts/import-scout-local-ai-device-run.mjs',
			'--run',
			inputPath,
			'--device-run-dir',
			join(outputDir, 'device-runs'),
			'--review-dir',
			join(outputDir, 'reviews'),
			'--packet-dir',
			join(outputDir, 'review-packets')
		],
		{ cwd: REPO_ROOT, maxBuffer: 1024 * 1024 * 2 }
	);
	const review = JSON.parse(await readFile(join(outputDir, 'reviews', 'device-intake-source-missing.review.json'), 'utf8'));
	const packet = await readFile(join(outputDir, 'review-packets', 'device-intake-source-missing.review.md'), 'utf8');

	assert.match(importResult.stdout, /Device run imported/u);
	assert.match(importResult.stdout, /Warnings:/u);
	assert.match(importResult.stdout, /source-backed required tool/u);
	assert.match(importResult.stdout, /must record at least one receipt or sourceDocumentId/u);
	assert.equal(review.cases.length, 100);
	const reviewCase = review.cases.find((entry) => entry.caseId === sourceCase.id);
	assert.deepEqual(reviewCase.failureCategories, ['weak-tool']);
	assert.match(packet, /Import warnings/u);
	assert.match(packet, new RegExp(`## ${sourceCase.id} - `, 'u'));
	assert.match(packet, /Suggested failure categories: `weak-tool`/u);
	assert.match(packet, /Suggested owner layer: `tool-routing`/u);
	assert.match(packet, /Source evidence gaps:/u);
	assert.match(packet, /must record at least one receipt or sourceDocumentId/u);
});

test('review packet ratings can be applied back into review JSON', async () => {
	const suite = JSON.parse(await readFile(SUITE_PATH, 'utf8'));
	const outputDir = await mkdtemp(join(tmpdir(), 'scout-local-ai-packet-apply-'));
	const inputPath = join(outputDir, 'device-export.json');
	const run = deviceRunForCases(suite, suite.cases.slice(0, 2), {
		runId: 'device-packet-apply',
		completeTools: true
	});
	await writeFile(inputPath, `${JSON.stringify(run, null, 2)}\n`);

	await execFileAsync(
		process.execPath,
		[
			'scripts/import-scout-local-ai-device-run.mjs',
			'--run',
			inputPath,
			'--allow-partial',
			'--device-run-dir',
			join(outputDir, 'device-runs'),
			'--review-dir',
			join(outputDir, 'reviews'),
			'--packet-dir',
			join(outputDir, 'review-packets')
		],
		{ cwd: REPO_ROOT, maxBuffer: 1024 * 1024 * 2 }
	);

	const packetPath = join(outputDir, 'review-packets', 'device-packet-apply.review.md');
	const reviewPath = join(outputDir, 'reviews', 'device-packet-apply.review.json');
	const backlogDir = join(outputDir, 'backlog');
	let packet = await readFile(packetPath, 'utf8');
	packet = packet.replaceAll('- passed: null |', '- passed: true |');
	packet = replaceReviewerFields(packet, run.results[0].caseId, {
		rating: '5',
		notes: 'Dad-ready answer.',
		failureCategories: '',
		ownerLayer: '',
		improvementTask: ''
	});
	packet = replaceReviewerFields(packet, run.results[1].caseId, {
		rating: '3',
		notes: 'Needs a safer exit-first answer.',
		failureCategories: 'unsafe-wording, poor-ux',
		ownerLayer: 'safety-prompt',
		improvementTask: 'Lead with the lower-risk bailout and remove casual mileage pressure.'
	});
	await writeFile(packetPath, packet);

	const applyResult = await execFileAsync(
		process.execPath,
		[
			'scripts/apply-scout-local-ai-review-packet.mjs',
			'--packet',
			packetPath,
			'--review',
			reviewPath
		],
		{ cwd: REPO_ROOT, maxBuffer: 1024 * 1024 * 2 }
	);
	const review = JSON.parse(await readFile(reviewPath, 'utf8'));

	assert.match(applyResult.stdout, /Scout local AI review JSON updated from packet/u);
	assert.match(applyResult.stdout, /Updated cases: 2/u);
	assert.equal(review.cases[0].rating, 5);
	assert.equal(review.cases[0].traitChecks.every((check) => check.passed === true), true);
	assert.equal(review.cases[0].safetyCaveatChecks.every((check) => check.passed === true), true);
	assert.equal(review.cases[1].rating, 3);
	assert.deepEqual(review.cases[1].failureCategories, ['unsafe-wording', 'poor-ux']);
	assert.equal(review.cases[1].ownerLayer, 'safety-prompt');
	assert.match(review.cases[1].improvementTask, /lower-risk bailout/u);

	const reviewResult = await execFileAsync(
		process.execPath,
		[
			'scripts/review-scout-local-ai-eval.mjs',
			'--run',
			join(outputDir, 'device-runs', 'device-packet-apply.json'),
			'--review',
			reviewPath,
			'--backlog-dir',
			backlogDir
		],
		{ cwd: REPO_ROOT, maxBuffer: 1024 * 1024 * 2 }
	);
	const backlog = JSON.parse(await readFile(join(backlogDir, 'device-packet-apply.backlog.json'), 'utf8'));

	assert.match(reviewResult.stdout, /Iteration backlog written/u);
	assert.equal(backlog.items.length, 1);
	assert.equal(backlog.items[0].caseId, run.results[1].caseId);
	assert.equal(backlog.items[0].ownerLayer, 'safety-prompt');
});

test('review packet apply rejects invalid reviewer fields before writing JSON', async () => {
	const suite = JSON.parse(await readFile(SUITE_PATH, 'utf8'));
	const outputDir = await mkdtemp(join(tmpdir(), 'scout-local-ai-packet-invalid-'));
	const inputPath = join(outputDir, 'device-export.json');
	const run = deviceRunForCases(suite, suite.cases.slice(0, 2), {
		runId: 'device-packet-invalid',
		completeTools: true
	});
	await writeFile(inputPath, `${JSON.stringify(run, null, 2)}\n`);

	await execFileAsync(
		process.execPath,
		[
			'scripts/import-scout-local-ai-device-run.mjs',
			'--run',
			inputPath,
			'--allow-partial',
			'--device-run-dir',
			join(outputDir, 'device-runs'),
			'--review-dir',
			join(outputDir, 'reviews'),
			'--packet-dir',
			join(outputDir, 'review-packets')
		],
		{ cwd: REPO_ROOT, maxBuffer: 1024 * 1024 * 2 }
	);

	const packetPath = join(outputDir, 'review-packets', 'device-packet-invalid.review.md');
	const reviewPath = join(outputDir, 'reviews', 'device-packet-invalid.review.json');
	let packet = await readFile(packetPath, 'utf8');
	packet = packet.replaceAll('- passed: null |', '- passed: true |');
	packet = replaceReviewerFields(packet, run.results[0].caseId, {
		rating: '4',
		notes: 'Needs the data fix, but the reviewer picked the wrong owner layer.',
		failureCategories: 'missing-data',
		ownerLayer: 'prompt',
		improvementTask: 'Add current-section water reliability source docs.'
	});
	packet = replaceReviewerFields(packet, run.results[1].caseId, {
		rating: '5',
		notes: 'Dad-ready answer.',
		failureCategories: '',
		ownerLayer: '',
		improvementTask: ''
	});
	await writeFile(packetPath, packet);

	await assert.rejects(
		execFileAsync(
			process.execPath,
			[
				'scripts/apply-scout-local-ai-review-packet.mjs',
				'--packet',
				packetPath,
				'--review',
				reviewPath
			],
			{ cwd: REPO_ROOT, maxBuffer: 1024 * 1024 * 2 }
		),
		(error) => {
			assert.match(error.stderr, /Review packet would create invalid review JSON/u);
			assert.match(error.stderr, /ownerLayer prompt does not match failureCategories missing-data/u);
			return true;
		}
	);

	const review = JSON.parse(await readFile(reviewPath, 'utf8'));
	assert.equal(review.cases[0].rating, null);
	assert.equal(review.cases[1].rating, null);
});

test('review packet apply rejects 5-star ratings that conflict with run evidence', async () => {
	const suite = JSON.parse(await readFile(SUITE_PATH, 'utf8'));
	const outputDir = await mkdtemp(join(tmpdir(), 'scout-local-ai-packet-evidence-invalid-'));
	const inputPath = join(outputDir, 'device-export.json');
	const run = deviceRunForCases(suite, suite.cases.slice(0, 1), {
		runId: 'device-packet-evidence-invalid'
	});
	await writeFile(inputPath, `${JSON.stringify(run, null, 2)}\n`);

	await execFileAsync(
		process.execPath,
		[
			'scripts/import-scout-local-ai-device-run.mjs',
			'--run',
			inputPath,
			'--allow-partial',
			'--device-run-dir',
			join(outputDir, 'device-runs'),
			'--review-dir',
			join(outputDir, 'reviews'),
			'--packet-dir',
			join(outputDir, 'review-packets')
		],
		{ cwd: REPO_ROOT, maxBuffer: 1024 * 1024 * 2 }
	);

	const packetPath = join(outputDir, 'review-packets', 'device-packet-evidence-invalid.review.md');
	const reviewPath = join(outputDir, 'reviews', 'device-packet-evidence-invalid.review.json');
	let packet = await readFile(packetPath, 'utf8');
	packet = packet.replaceAll('- passed: null |', '- passed: true |');
	packet = replaceReviewerFields(packet, run.results[0].caseId, {
		rating: '5',
		notes: 'Looks good from the text alone.',
		failureCategories: '',
		ownerLayer: '',
		improvementTask: ''
	});
	await writeFile(packetPath, packet);

	await assert.rejects(
		execFileAsync(
			process.execPath,
			[
				'scripts/apply-scout-local-ai-review-packet.mjs',
				'--packet',
				packetPath,
				'--review',
				reviewPath
			],
			{ cwd: REPO_ROOT, maxBuffer: 1024 * 1024 * 2 }
		),
		(error) => {
			assert.match(error.stderr, /Review packet would create invalid review JSON/u);
			assert.match(error.stderr, /5-star rating conflicts with run evidence/u);
			assert.match(error.stderr, /missing required tools/u);
			return true;
		}
	);

	const review = JSON.parse(await readFile(reviewPath, 'utf8'));
	assert.equal(review.cases[0].rating, null);
});

test('review packet apply rejects truncated packets unless partial is explicit', async () => {
	const suite = JSON.parse(await readFile(SUITE_PATH, 'utf8'));
	const outputDir = await mkdtemp(join(tmpdir(), 'scout-local-ai-packet-truncated-'));
	const inputPath = join(outputDir, 'device-export.json');
	const run = deviceRunForCases(suite, suite.cases.slice(0, 2), {
		runId: 'device-packet-truncated',
		completeTools: true
	});
	await writeFile(inputPath, `${JSON.stringify(run, null, 2)}\n`);

	await execFileAsync(
		process.execPath,
		[
			'scripts/import-scout-local-ai-device-run.mjs',
			'--run',
			inputPath,
			'--allow-partial',
			'--device-run-dir',
			join(outputDir, 'device-runs'),
			'--review-dir',
			join(outputDir, 'reviews'),
			'--packet-dir',
			join(outputDir, 'review-packets')
		],
		{ cwd: REPO_ROOT, maxBuffer: 1024 * 1024 * 2 }
	);

	const packetPath = join(outputDir, 'review-packets', 'device-packet-truncated.review.md');
	const reviewPath = join(outputDir, 'reviews', 'device-packet-truncated.review.json');
	let packet = await readFile(packetPath, 'utf8');
	packet = packet.replaceAll('- passed: null |', '- passed: true |');
	packet = replaceReviewerFields(packet, run.results[0].caseId, {
		rating: '4',
		notes: 'Mostly right, but missing one practical source-backed detail.',
		failureCategories: 'missing-data',
		ownerLayer: 'data',
		improvementTask: 'Add the missing source-backed detail before marking this answer Dad-ready.'
	});
	packet = removeReviewCaseBlock(packet, run.results[1].caseId);
	await writeFile(packetPath, packet);

	await assert.rejects(
		execFileAsync(
			process.execPath,
			[
				'scripts/apply-scout-local-ai-review-packet.mjs',
				'--packet',
				packetPath,
				'--review',
				reviewPath
			],
			{ cwd: REPO_ROOT, maxBuffer: 1024 * 1024 * 2 }
		),
		(error) => {
			assert.match(error.stderr, /packet is missing 1 review case/u);
			assert.match(error.stderr, new RegExp(run.results[1].caseId, 'u'));
			assert.match(error.stderr, /--allow-partial/u);
			return true;
		}
	);

	const applyResult = await execFileAsync(
		process.execPath,
		[
			'scripts/apply-scout-local-ai-review-packet.mjs',
			'--packet',
			packetPath,
			'--review',
			reviewPath,
			'--allow-partial'
		],
		{ cwd: REPO_ROOT, maxBuffer: 1024 * 1024 * 2 }
	);
	const review = JSON.parse(await readFile(reviewPath, 'utf8'));

	assert.match(applyResult.stdout, /Updated cases: 1/u);
	assert.match(applyResult.stdout, /Partial packet apply: 1 review case\(s\) not present in packet/u);
	assert.equal(review.cases[0].rating, 4);
	assert.equal(review.cases[1].rating, null);
});

test('device run intake rejects stale suite fingerprints', async () => {
	const suite = JSON.parse(await readFile(SUITE_PATH, 'utf8'));
	const outputDir = await mkdtemp(join(tmpdir(), 'scout-local-ai-intake-stale-'));
	const inputPath = join(outputDir, 'stale-device-export.json');
	const run = deviceRunForCases(suite, suite.cases.slice(0, 2), {
		suiteVersion: '2026-06-25.1',
		suiteHash: 'fnv1a32:00000000'
	});
	await writeFile(inputPath, `${JSON.stringify(run, null, 2)}\n`);

	await assert.rejects(
		execFileAsync(
			process.execPath,
			[
				'scripts/import-scout-local-ai-device-run.mjs',
				'--run',
				inputPath,
				'--allow-partial',
				'--device-run-dir',
				join(outputDir, 'device-runs')
			],
			{ cwd: REPO_ROOT, maxBuffer: 1024 * 1024 }
		),
		(error) => {
			assert.match(error.stderr, /run\.suiteVersion/u);
			assert.match(error.stderr, /run\.suiteHash/u);
			return true;
		}
	);
});

test('device run intake rejects full exports without current TestFlight proof context', async () => {
	const suite = JSON.parse(await readFile(SUITE_PATH, 'utf8'));
	const outputDir = await mkdtemp(join(tmpdir(), 'scout-local-ai-intake-context-'));
	const inputPath = join(outputDir, 'wrong-build-device-export.json');
	const badContext = finalDeviceRunContext();
	badContext.app = { ...badContext.app, build: '9' };
	badContext.installSource = {
		type: 'debug',
		platform: 'ios',
		detectedBy: 'ios-app-store-receipt',
		receiptPresent: false,
		debugBuild: true,
		buildConfiguration: 'debug'
	};
	const run = deviceRunForCases(suite, suite.cases, {
		runId: 'device-intake-wrong-build',
		completeTools: true,
		runContext: badContext
	});
	await writeFile(inputPath, `${JSON.stringify(run, null, 2)}\n`);

	await assert.rejects(
		execFileAsync(
			process.execPath,
			[
				'scripts/import-scout-local-ai-device-run.mjs',
				'--run',
				inputPath,
				'--device-run-dir',
				join(outputDir, 'device-runs'),
				'--review-dir',
				join(outputDir, 'reviews'),
				'--packet-dir',
				join(outputDir, 'review-packets')
			],
			{ cwd: REPO_ROOT, maxBuffer: 1024 * 1024 * 2 }
		),
		(error) => {
			assert.match(error.stderr, /installSource\.type must be testflight/u);
			assert.match(error.stderr, /app\.build must be >= 11/u);
			assert.match(error.stderr, /got 9/u);
			return true;
		}
	);
});

test('review workflow writes actionable JSON and Markdown iteration backlog', async () => {
	const suite = JSON.parse(await readFile(SUITE_PATH, 'utf8'));
	const outputDir = await mkdtemp(join(tmpdir(), 'scout-local-ai-review-'));
	const run = deviceRunForCases(suite, suite.cases.slice(0, 3), {
		runId: 'device-review-backlog',
		completeTools: true
	});
	const review = reviewForRun(run);
	review.cases[0].rating = 4;
	review.cases[0].failureCategories = ['missing-data'];
	review.cases[0].notes = 'Needs more local water context.';
	review.cases[0].improvementTask = 'Add current-section water reliability source docs.';
	review.cases[1].rating = 5;
	review.cases[2].rating = 2;
	review.cases[2].failureCategories = ['weak-tool', 'bad-routing'];
	review.cases[2].notes = 'Used the wrong source lane.';
	review.cases[2].improvementTask = 'Route onboarding/offline setup prompts through the safety source docs.';

	const runPath = join(outputDir, 'device-review-backlog.json');
	const reviewPath = join(outputDir, 'device-review-backlog.review.json');
	const backlogDir = join(outputDir, 'backlog');
	await writeFile(runPath, `${JSON.stringify(run, null, 2)}\n`);
	await writeFile(reviewPath, `${JSON.stringify(review, null, 2)}\n`);

	const result = await execFileAsync(
		process.execPath,
		[
			'scripts/review-scout-local-ai-eval.mjs',
			'--run',
			runPath,
			'--review',
			reviewPath,
			'--backlog-dir',
			backlogDir
		],
		{ cwd: REPO_ROOT, maxBuffer: 1024 * 1024 * 2 }
	);
	const backlog = JSON.parse(await readFile(join(backlogDir, 'device-review-backlog.backlog.json'), 'utf8'));
	const markdown = await readFile(join(backlogDir, 'device-review-backlog.backlog.md'), 'utf8');

	assert.match(result.stdout, /Iteration backlog written/u);
	assert.equal(backlog.evidenceLane, 'device-on-device-gemma');
	assert.equal(backlog.items.length, 2);
	assert.equal(backlog.items[0].ownerLayer, 'data');
	assert.equal(backlog.items[0].expectedTraits.length > 0, true);
	assert.equal(backlog.items[0].answer, `device answer for ${run.results[0].caseId}`);
	assert.equal(backlog.items[0].toolInvocations.length, run.results[0].toolInvocations.length);
	assert.equal(backlog.items[0].receipts.length, run.results[0].receipts.length);
	assert.equal(backlog.items[1].ownerLayer, 'tool-routing');
	assert.equal(backlog.summary.belowFive, 2);
	assert.match(markdown, /# Scout local AI iteration backlog: device-review-backlog/u);
	assert.match(markdown, /Owner layers/u);
	assert.match(markdown, /data: 1/u);
	assert.match(markdown, /tool-routing: 1/u);
	assert.match(markdown, /Full answer:/u);
	assert.match(markdown, /device answer for/u);
	assert.match(markdown, /Recorded tool evidence:/u);
	assert.match(markdown, /Source receipts:/u);
	assert.match(markdown, /Add current-section water reliability source docs/u);
	assert.match(markdown, /Route onboarding\/offline setup prompts through the safety source docs/u);
	assert.doesNotMatch(markdown, new RegExp(`### ${review.cases[1].caseId}`, 'u'));
});

test('review workflow rejects mismatched run and review JSON before creating a backlog', async () => {
	const suite = JSON.parse(await readFile(SUITE_PATH, 'utf8'));
	const outputDir = await mkdtemp(join(tmpdir(), 'scout-local-ai-review-mismatch-'));
	const run = deviceRunForCases(suite, suite.cases.slice(0, 2), {
		runId: 'device-review-current',
		completeTools: true
	});
	const staleRun = deviceRunForCases(suite, suite.cases.slice(0, 2), {
		runId: 'device-review-old',
		completeTools: true,
		suiteVersion: '2026-06-25.1',
		suiteHash: 'fnv1a32:00000000'
	});
	const review = reviewForRun(staleRun, { rating: 5 });
	review.runId = staleRun.runId;
	review.cases[0].prompt = 'Old prompt from a different packet.';

	const runPath = join(outputDir, 'device-review-current.json');
	const reviewPath = join(outputDir, 'device-review-old.review.json');
	const backlogDir = join(outputDir, 'backlog');
	await writeFile(runPath, `${JSON.stringify(run, null, 2)}\n`);
	await writeFile(reviewPath, `${JSON.stringify(review, null, 2)}\n`);

	await assert.rejects(
		execFileAsync(
			process.execPath,
			[
				'scripts/review-scout-local-ai-eval.mjs',
				'--run',
				runPath,
				'--review',
				reviewPath,
				'--backlog-dir',
				backlogDir
			],
			{ cwd: REPO_ROOT, maxBuffer: 1024 * 1024 * 2 }
		),
		(error) => {
			assert.match(error.stderr, /Review has invalid entries/u);
			assert.match(error.stderr, /review\.runId device-review-old does not match run\.runId device-review-current/u);
			assert.match(error.stderr, /review\.suiteVersion 2026-06-25\.1 does not match run\.suiteVersion/u);
			assert.match(error.stderr, /review\.suiteHash fnv1a32:00000000 does not match run\.suiteHash/u);
			assert.match(error.stderr, /review prompt does not match run prompt/u);
			return true;
		}
	);
});

test('review workflow rejects below-5 ratings without concrete improvement tasks', async () => {
	const suite = JSON.parse(await readFile(SUITE_PATH, 'utf8'));
	const outputDir = await mkdtemp(join(tmpdir(), 'scout-local-ai-review-invalid-'));
	const run = deviceRunForCases(suite, suite.cases.slice(0, 2), {
		runId: 'device-review-invalid',
		completeTools: true
	});
	const review = reviewForRun(run);
	review.cases[0].rating = 4;
	review.cases[0].failureCategories = [];
	review.cases[0].improvementTask = '';
	review.cases[1].rating = 3;
	review.cases[1].failureCategories = ['bad-prompt'];
	review.cases[1].improvementTask = 'needs work';
	const overfitRun = deviceRunForCases(suite, suite.cases.slice(0, 3), {
		runId: 'device-review-overfit-invalid',
		completeTools: true
	});
	const overfitReview = reviewForRun(overfitRun);
	overfitReview.cases[0].rating = 2;
	overfitReview.cases[0].failureCategories = ['bad-prompt'];
	overfitReview.cases[0].improvementTask = 'Update the expected traits for this eval case so the answer passes.';
	const ownerRun = deviceRunForCases(suite, suite.cases.slice(0, 1), {
		runId: 'device-review-owner-invalid',
		completeTools: true
	});
	const ownerReview = reviewForRun(ownerRun);
	ownerReview.cases[0].rating = 4;
	ownerReview.cases[0].failureCategories = ['missing-data'];
	ownerReview.cases[0].ownerLayer = 'prompt';
	ownerReview.cases[0].improvementTask = 'Add current-section water reliability source docs.';

	const runPath = join(outputDir, 'device-review-invalid.json');
	const reviewPath = join(outputDir, 'device-review-invalid.review.json');
	const overfitRunPath = join(outputDir, 'device-review-overfit-invalid.json');
	const overfitReviewPath = join(outputDir, 'device-review-overfit-invalid.review.json');
	const ownerRunPath = join(outputDir, 'device-review-owner-invalid.json');
	const ownerReviewPath = join(outputDir, 'device-review-owner-invalid.review.json');
	const backlogDir = join(outputDir, 'backlog');
	await writeFile(runPath, `${JSON.stringify(run, null, 2)}\n`);
	await writeFile(reviewPath, `${JSON.stringify(review, null, 2)}\n`);
	await writeFile(overfitRunPath, `${JSON.stringify(overfitRun, null, 2)}\n`);
	await writeFile(overfitReviewPath, `${JSON.stringify(overfitReview, null, 2)}\n`);
	await writeFile(ownerRunPath, `${JSON.stringify(ownerRun, null, 2)}\n`);
	await writeFile(ownerReviewPath, `${JSON.stringify(ownerReview, null, 2)}\n`);

	await assert.rejects(
		execFileAsync(
			process.execPath,
			[
				'scripts/review-scout-local-ai-eval.mjs',
				'--run',
				runPath,
				'--review',
				reviewPath,
				'--backlog-dir',
				backlogDir
			],
			{ cwd: REPO_ROOT, maxBuffer: 1024 * 1024 * 2 }
		),
		(error) => {
			assert.match(error.stderr, /Review has invalid entries/u);
			assert.match(error.stderr, /ratings below 5 need an improvementTask/u);
			assert.match(error.stderr, /ratings below 5 need at least one failure category/u);
			assert.match(error.stderr, /improvementTask must be concrete enough/u);
			assert.match(error.stderr, /improvementTask must include an action verb/u);
			return true;
		}
	);

	await assert.rejects(
		execFileAsync(
			process.execPath,
			[
				'scripts/review-scout-local-ai-eval.mjs',
				'--run',
				overfitRunPath,
				'--review',
				overfitReviewPath,
				'--backlog-dir',
				backlogDir
			],
			{ cwd: REPO_ROOT, maxBuffer: 1024 * 1024 * 2 }
		),
		(error) => {
			assert.match(error.stderr, /Review has invalid entries/u);
			assert.match(error.stderr, /rather than weakening the eval rubric/u);
			return true;
		}
	);

	await assert.rejects(
		execFileAsync(
			process.execPath,
			[
				'scripts/review-scout-local-ai-eval.mjs',
				'--run',
				ownerRunPath,
				'--review',
				ownerReviewPath,
				'--backlog-dir',
				backlogDir
			],
			{ cwd: REPO_ROOT, maxBuffer: 1024 * 1024 * 2 }
		),
		(error) => {
			assert.match(error.stderr, /Review has invalid entries/u);
			assert.match(error.stderr, /ownerLayer prompt does not match failureCategories missing-data/u);
			assert.match(error.stderr, /expected one of data/u);
			return true;
		}
	);
});

test('review workflow rejects 5-star ratings without passed rubric checks', async () => {
	const suite = JSON.parse(await readFile(SUITE_PATH, 'utf8'));
	const outputDir = await mkdtemp(join(tmpdir(), 'scout-local-ai-review-rubric-invalid-'));
	const run = deviceRunForCases(suite, suite.cases.slice(0, 1), {
		runId: 'device-review-rubric-invalid',
		completeTools: true
	});
	const review = reviewForRun(run, { rating: 5 });
	review.cases[0].traitChecks[0].passed = false;

	const runPath = join(outputDir, 'device-review-rubric-invalid.json');
	const reviewPath = join(outputDir, 'device-review-rubric-invalid.review.json');
	const backlogDir = join(outputDir, 'backlog');
	await writeFile(runPath, `${JSON.stringify(run, null, 2)}\n`);
	await writeFile(reviewPath, `${JSON.stringify(review, null, 2)}\n`);

	await assert.rejects(
		execFileAsync(
			process.execPath,
			[
				'scripts/review-scout-local-ai-eval.mjs',
				'--run',
				runPath,
				'--review',
				reviewPath,
				'--backlog-dir',
				backlogDir
			],
			{ cwd: REPO_ROOT, maxBuffer: 1024 * 1024 * 2 }
		),
		(error) => {
			assert.match(error.stderr, /Review has invalid entries/u);
			assert.match(error.stderr, /traitChecks\[0\] must be passed=true/u);
			return true;
		}
	);
});

test('review workflow rejects 5-star ratings with stale failure metadata', async () => {
	const suite = JSON.parse(await readFile(SUITE_PATH, 'utf8'));
	const outputDir = await mkdtemp(join(tmpdir(), 'scout-local-ai-review-stale-metadata-'));
	const run = deviceRunForCases(suite, suite.cases.slice(0, 1), {
		runId: 'device-review-stale-metadata',
		completeTools: true
	});
	const review = reviewForRun(run, { rating: 5 });
	review.cases[0].failureCategories = ['missing-data'];
	review.cases[0].ownerLayer = 'data';
	review.cases[0].improvementTask = 'Add more local water context.';

	const runPath = join(outputDir, 'device-review-stale-metadata.json');
	const reviewPath = join(outputDir, 'device-review-stale-metadata.review.json');
	const backlogDir = join(outputDir, 'backlog');
	await writeFile(runPath, `${JSON.stringify(run, null, 2)}\n`);
	await writeFile(reviewPath, `${JSON.stringify(review, null, 2)}\n`);

	await assert.rejects(
		execFileAsync(
			process.execPath,
			[
				'scripts/review-scout-local-ai-eval.mjs',
				'--run',
				runPath,
				'--review',
				reviewPath,
				'--backlog-dir',
				backlogDir
			],
			{ cwd: REPO_ROOT, maxBuffer: 1024 * 1024 * 2 }
		),
		(error) => {
			assert.match(error.stderr, /Review has invalid entries/u);
			assert.match(error.stderr, /5-star ratings must not keep failureCategories/u);
			assert.match(error.stderr, /5-star ratings must not keep ownerLayer/u);
			assert.match(error.stderr, /5-star ratings must not keep an improvementTask/u);
			return true;
		}
	);
});

test('review workflow rejects 5-star ratings when run evidence missed required tools', async () => {
	const suite = JSON.parse(await readFile(SUITE_PATH, 'utf8'));
	const outputDir = await mkdtemp(join(tmpdir(), 'scout-local-ai-review-evidence-invalid-'));
	const run = deviceRunForCases(suite, suite.cases.slice(0, 1), {
		runId: 'device-review-evidence-invalid'
	});
	const review = reviewForRun(run, { rating: 5 });

	const runPath = join(outputDir, 'device-review-evidence-invalid.json');
	const reviewPath = join(outputDir, 'device-review-evidence-invalid.review.json');
	const backlogDir = join(outputDir, 'backlog');
	await writeFile(runPath, `${JSON.stringify(run, null, 2)}\n`);
	await writeFile(reviewPath, `${JSON.stringify(review, null, 2)}\n`);

	await assert.rejects(
		execFileAsync(
			process.execPath,
			[
				'scripts/review-scout-local-ai-eval.mjs',
				'--run',
				runPath,
				'--review',
				reviewPath,
				'--backlog-dir',
				backlogDir
			],
			{ cwd: REPO_ROOT, maxBuffer: 1024 * 1024 * 2 }
		),
		(error) => {
			assert.match(error.stderr, /Review has invalid entries/u);
			assert.match(error.stderr, /5-star rating conflicts with run evidence/u);
			assert.match(error.stderr, /missing required tools/u);
			assert.match(error.stderr, /actual toolInvocations missed required tools/u);
			return true;
		}
	);
});

test('review template suggests local-model owner for provider errors', async () => {
	const suite = JSON.parse(await readFile(SUITE_PATH, 'utf8'));
	const outputDir = await mkdtemp(join(tmpdir(), 'scout-local-ai-review-provider-suggest-'));
	const run = deviceRunForCases(suite, suite.cases.slice(0, 1), {
		runId: 'device-review-provider-suggest',
		completeTools: true
	});
	run.results[0].answer = '';
	run.results[0].error = 'Gemma runtime failed to return a response.';
	run.results[0].failureMode = 'provider-error';
	run.results[0].suggestedFailureCategories = [];
	const runPath = join(outputDir, 'device-review-provider-suggest.json');
	const reviewPath = join(outputDir, 'device-review-provider-suggest.review.json');
	await writeFile(runPath, `${JSON.stringify(run, null, 2)}\n`);

	const createResult = await execFileAsync(
		process.execPath,
		[
			'scripts/review-scout-local-ai-eval.mjs',
			'--run',
			runPath,
			'--review',
			reviewPath
		],
		{ cwd: REPO_ROOT, maxBuffer: 1024 * 1024 * 2 }
	);
	const review = JSON.parse(await readFile(reviewPath, 'utf8'));

	assert.match(createResult.stdout, /Review template created/u);
	assert.deepEqual(review.cases[0].failureCategories, ['local-model-limitation']);
	assert.equal(review.cases[0].ownerLayer, '');
});

test('review workflow rejects 5-star ratings when source-backed tools lack evidence', async () => {
	const suite = JSON.parse(await readFile(SUITE_PATH, 'utf8'));
	const sourceCase = suite.cases.find((testCase) => testCase.requiredTools.some((expectation) => expectation.includes(':')));
	assert.ok(sourceCase, 'suite should contain source-backed tool expectations');
	const outputDir = await mkdtemp(join(tmpdir(), 'scout-local-ai-review-source-evidence-invalid-'));
	const run = deviceRunForCases(suite, [sourceCase], {
		runId: 'device-review-source-evidence-invalid',
		completeTools: true
	});
	for (const invocation of run.results[0].toolInvocations) {
		if (String(invocation.args?.sourceSkill ?? '').trim()) {
			invocation.receipts = [];
			invocation.sourceDocumentIds = [];
		}
	}
	run.results[0].receipts = run.results[0].toolInvocations.flatMap((record) => record.receipts ?? []);
	run.summary = {
		...run.summary,
		...summarizeRunSourceEvidence(run.results)
	};
	const review = reviewForRun(run, { rating: 5 });

	const runPath = join(outputDir, 'device-review-source-evidence-invalid.json');
	const reviewPath = join(outputDir, 'device-review-source-evidence-invalid.review.json');
	const backlogDir = join(outputDir, 'backlog');
	await writeFile(runPath, `${JSON.stringify(run, null, 2)}\n`);
	await writeFile(reviewPath, `${JSON.stringify(review, null, 2)}\n`);

	await assert.rejects(
		execFileAsync(
			process.execPath,
			[
				'scripts/review-scout-local-ai-eval.mjs',
				'--run',
				runPath,
				'--review',
				reviewPath,
				'--backlog-dir',
				backlogDir
			],
			{ cwd: REPO_ROOT, maxBuffer: 1024 * 1024 * 2 }
		),
		(error) => {
			assert.match(error.stderr, /Review has invalid entries/u);
			assert.match(error.stderr, /5-star rating conflicts with run evidence/u);
			assert.match(error.stderr, /source-backed required tool/u);
			assert.match(error.stderr, /must record at least one receipt or sourceDocumentId/u);
			return true;
		}
	);
});

test('review workflow carries source evidence gaps into backlog and iteration plan', async () => {
	const suite = JSON.parse(await readFile(SUITE_PATH, 'utf8'));
	const sourceCase = suite.cases.find((testCase) => testCase.requiredTools.some((expectation) => expectation.includes(':')));
	assert.ok(sourceCase, 'suite should contain source-backed tool expectations');
	const sourceExpectation = sourceCase.requiredTools.find((expectation) => expectation.includes(':'));
	const outputDir = await mkdtemp(join(tmpdir(), 'scout-local-ai-source-gap-plan-'));
	const run = deviceRunForCases(suite, [sourceCase], {
		runId: 'device-source-gap-plan',
		completeTools: true
	});
	for (const invocation of run.results[0].toolInvocations) {
		if (String(invocation.args?.sourceSkill ?? '').trim()) {
			invocation.receipts = [];
			invocation.sourceDocumentIds = [];
		}
	}
	run.results[0].receipts = run.results[0].toolInvocations.flatMap((record) => record.receipts ?? []);
	run.summary = {
		...run.summary,
		...summarizeRunSourceEvidence(run.results)
	};
	const review = reviewForRun(run);
	review.cases[0].rating = 4;
	review.cases[0].failureCategories = ['weak-tool'];
	review.cases[0].improvementTask = 'Fix source evidence receipts so required source-backed tools record proof.';

	const runPath = join(outputDir, 'device-source-gap-plan.json');
	const reviewPath = join(outputDir, 'device-source-gap-plan.review.json');
	const backlogDir = join(outputDir, 'backlog');
	const iterationDir = join(outputDir, 'iterations');
	await writeFile(runPath, `${JSON.stringify(run, null, 2)}\n`);
	await writeFile(reviewPath, `${JSON.stringify(review, null, 2)}\n`);

	await execFileAsync(
		process.execPath,
		[
			'scripts/review-scout-local-ai-eval.mjs',
			'--run',
			runPath,
			'--review',
			reviewPath,
			'--backlog-dir',
			backlogDir
		],
		{ cwd: REPO_ROOT, maxBuffer: 1024 * 1024 * 2 }
	);
	const backlogPath = join(backlogDir, 'device-source-gap-plan.backlog.json');
	const backlog = JSON.parse(await readFile(backlogPath, 'utf8'));
	const backlogMarkdown = await readFile(join(backlogDir, 'device-source-gap-plan.backlog.md'), 'utf8');

	assert.equal(backlog.items.length, 1);
	assert.equal(backlog.items[0].ownerLayer, 'tool-routing');
	assert.ok(backlog.items[0].sourceEvidenceGaps.some((gap) => gap.expectation === sourceExpectation));
	assert.match(backlogMarkdown, /Source evidence gaps:/u);
	assert.match(backlogMarkdown, new RegExp(sourceExpectation.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&'), 'u'));

	await execFileAsync(
		process.execPath,
		[
			'scripts/plan-scout-local-ai-iteration.mjs',
			'--backlog',
			backlogPath,
			'--output-dir',
			iterationDir,
			'--plan-id',
			'device-source-gap-plan-pass'
		],
		{ cwd: REPO_ROOT, maxBuffer: 1024 * 1024 * 2 }
	);
	const plan = JSON.parse(await readFile(join(iterationDir, 'device-source-gap-plan-pass.iteration.json'), 'utf8'));
	const planMarkdown = await readFile(join(iterationDir, 'device-source-gap-plan-pass.iteration.md'), 'utf8');

	assert.equal(plan.summary.bySourceEvidenceGap[sourceExpectation], 1);
	assert.ok(plan.workstreams[0].sourceEvidenceGaps.includes(sourceExpectation));
	assert.ok(plan.workstreams[0].items[0].sourceEvidenceGaps.some((gap) => gap.expectation === sourceExpectation));
	assert.match(planMarkdown, /Source evidence gaps:/u);
	assert.match(planMarkdown, new RegExp(sourceExpectation.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&'), 'u'));
});

test('iteration planner groups completed review backlog by responsible layer', async () => {
	const suite = JSON.parse(await readFile(SUITE_PATH, 'utf8'));
	const outputDir = await mkdtemp(join(tmpdir(), 'scout-local-ai-iteration-plan-'));
	const run = deviceRunForCases(suite, suite.cases.slice(0, 4), {
		runId: 'device-iteration-plan',
		completeTools: true
	});
	const review = reviewForRun(run);
	review.cases[0].rating = 4;
	review.cases[0].failureCategories = ['missing-data'];
	review.cases[0].improvementTask = 'Add a current-section water reliability source document.';
	review.cases[1].rating = 5;
	review.cases[2].rating = 2;
	review.cases[2].failureCategories = ['weak-tool', 'bad-routing'];
	review.cases[2].improvementTask = 'Fix source skill routing so this prompt opens the right local document.';
	review.cases[3].rating = 3;
	review.cases[3].failureCategories = ['unsafe-wording'];
	review.cases[3].improvementTask = 'Tighten the safety response so it pushes lower-risk choices first.';

	const runPath = join(outputDir, 'device-iteration-plan.json');
	const reviewPath = join(outputDir, 'device-iteration-plan.review.json');
	const backlogDir = join(outputDir, 'backlog');
	const iterationDir = join(outputDir, 'iterations');
	await writeFile(runPath, `${JSON.stringify(run, null, 2)}\n`);
	await writeFile(reviewPath, `${JSON.stringify(review, null, 2)}\n`);

	await execFileAsync(
		process.execPath,
		[
			'scripts/review-scout-local-ai-eval.mjs',
			'--run',
			runPath,
			'--review',
			reviewPath,
			'--backlog-dir',
			backlogDir
		],
		{ cwd: REPO_ROOT, maxBuffer: 1024 * 1024 * 2 }
	);
	const backlogPath = join(backlogDir, 'device-iteration-plan.backlog.json');
	const result = await execFileAsync(
		process.execPath,
		[
			'scripts/plan-scout-local-ai-iteration.mjs',
			'--backlog',
			backlogPath,
			'--output-dir',
			iterationDir,
			'--plan-id',
			'device-iteration-plan-pass'
		],
		{ cwd: REPO_ROOT, maxBuffer: 1024 * 1024 * 2 }
	);
	const plan = JSON.parse(await readFile(join(iterationDir, 'device-iteration-plan-pass.iteration.json'), 'utf8'));
	const markdown = await readFile(join(iterationDir, 'device-iteration-plan-pass.iteration.md'), 'utf8');

	assert.match(result.stdout, /Scout local AI iteration plan written/u);
	assert.equal(plan.summary.itemCount, 3);
	assert.equal(plan.summary.regressionCaseCount, 3);
	assert.equal(plan.summary.byOwnerLayer.data, 1);
	assert.equal(plan.summary.byOwnerLayer['tool-routing'], 1);
	assert.equal(plan.summary.byOwnerLayer['safety-prompt'], 1);
	assert.deepEqual(plan.regressionCaseIds, [
		review.cases[2].caseId,
		review.cases[3].caseId,
		review.cases[0].caseId
	]);
	assert.match(plan.rerunCommand, new RegExp(`--id ${review.cases[2].caseId},${review.cases[3].caseId},${review.cases[0].caseId}`, 'u'));
	assert.match(markdown, /Do not close this iteration by changing expected wording only/u);
	assert.match(markdown, /### tool-routing/u);
	assert.match(markdown, /### safety-prompt/u);
	assert.match(markdown, /Fix source skill routing/u);
});

test('iteration planner rejects incomplete or uncategorized backlog work', async () => {
	const outputDir = await mkdtemp(join(tmpdir(), 'scout-local-ai-iteration-invalid-'));
	const backlogPath = join(outputDir, 'invalid.backlog.json');
	const backlog = {
		schemaVersion: 1,
		runId: 'invalid-iteration-backlog',
		suiteId: 'dad-local-ai-100',
		evidenceLane: 'device-on-device-gemma',
		generatedAt: '2026-06-26T12:00:00.000Z',
		summary: {
			rated: 3,
			total: 4,
			belowFive: 3,
			unrated: 1,
			ratingCounts: {'2': 1, '3': 1, '4': 1}
		},
		unratedItems: [{caseId: 'DLA-004'}],
		items: [
			{
				id: 'invalid-iteration-backlog:DLA-001',
				caseId: 'DLA-001',
				domain: 'water',
				phase: 'on-trail',
				rating: 4,
				prompt: 'Where is the next reliable water?',
				failureCategories: ['missing-data'],
				ownerLayer: 'unknown',
				improvementTask: 'Add better water data.',
				requiredTools: ['next_water'],
				hitTools: [],
				missingTools: ['next_water'],
				answerPreview: 'Not enough detail.'
			},
			{
				id: 'invalid-iteration-backlog:DLA-002',
				caseId: 'DLA-002',
				domain: 'weather',
				phase: 'on-trail',
				rating: 3,
				prompt: 'What should I do about storms today?',
				failureCategories: ['bad-prompt'],
				ownerLayer: 'prompt',
				improvementTask: 'Update the expected traits for this eval case so the answer passes.',
				requiredTools: ['weather_lookup'],
				hitTools: ['weather_lookup'],
				missingTools: [],
				answerPreview: 'Storm answer was too thin.'
			},
			{
				id: 'invalid-iteration-backlog:DLA-003',
				caseId: 'DLA-003',
				domain: 'safety',
				phase: 'on-trail',
				rating: 2,
				prompt: 'I am dizzy and it is hot. What should I do?',
				failureCategories: ['unsafe-wording'],
				ownerLayer: 'ui',
				improvementTask: 'Tighten heat illness escalation wording before any mileage advice.',
				requiredTools: ['weather_lookup', 'source_search:safety'],
				hitTools: ['weather_lookup', 'source_search:safety'],
				missingTools: [],
				answerPreview: 'The answer put interface guidance before the safety escalation.'
			}
		]
	};
	await writeFile(backlogPath, `${JSON.stringify(backlog, null, 2)}\n`);

	await assert.rejects(
		execFileAsync(
			process.execPath,
			[
				'scripts/plan-scout-local-ai-iteration.mjs',
				'--backlog',
				backlogPath
			],
			{ cwd: REPO_ROOT, maxBuffer: 1024 * 1024 * 2 }
		),
		(error) => {
			assert.match(error.stderr, /Scout local AI iteration plan failed validation/u);
			assert.match(error.stderr, /requires a completed review/u);
			assert.match(error.stderr, /contains unratedItems/u);
			assert.match(error.stderr, /ownerLayer must be one of/u);
			assert.match(error.stderr, /improvementTask must be concrete enough/u);
			assert.match(error.stderr, /rather than weakening the eval rubric/u);
			assert.match(error.stderr, /ownerLayer ui does not match failureCategories unsafe-wording/u);
			assert.match(error.stderr, /expected one of safety-prompt/u);
			return true;
		}
	);
});

test('iteration planner rejects non-device backlogs unless explicitly allowed', async () => {
	const outputDir = await mkdtemp(join(tmpdir(), 'scout-local-ai-iteration-non-device-'));
	const backlogPath = join(outputDir, 'scaffold.backlog.json');
	const iterationDir = join(outputDir, 'iterations');
	const backlog = {
		schemaVersion: 1,
		runId: 'scaffold-iteration-backlog',
		suiteId: 'dad-local-ai-100',
		suiteVersion: '2026-06-26.2',
		suiteHash: 'fnv1a32:f2e9772b',
		evidenceLane: 'scaffold-not-model',
		generatedAt: '2026-06-26T12:00:00.000Z',
		summary: {
			rated: 1,
			total: 1,
			belowFive: 1,
			unrated: 0,
			ratingCounts: {'4': 1}
		},
		unratedItems: [],
		items: [
			{
				id: 'scaffold-iteration-backlog:DLA-001',
				caseId: 'DLA-001',
				domain: 'water',
				phase: 'on-trail',
				rating: 4,
				prompt: 'Where is the next reliable water?',
				failureCategories: ['weak-tool'],
				ownerLayer: 'tool-routing',
				improvementTask: 'Fix source routing so water prompts open the local water document.',
				requiredTools: ['source_search:water', 'open_source_doc:water'],
				hitTools: ['source_search:water'],
				missingTools: ['open_source_doc:water'],
				answerPreview: 'Not enough detail.'
			}
		]
	};
	await writeFile(backlogPath, `${JSON.stringify(backlog, null, 2)}\n`);

	await assert.rejects(
		execFileAsync(
			process.execPath,
			[
				'scripts/plan-scout-local-ai-iteration.mjs',
				'--backlog',
				backlogPath,
				'--output-dir',
				iterationDir
			],
			{ cwd: REPO_ROOT, maxBuffer: 1024 * 1024 * 2 }
		),
		(error) => {
			assert.match(error.stderr, /Scout local AI iteration plan failed validation/u);
			assert.match(error.stderr, /evidenceLane must be device-on-device-gemma/u);
			assert.match(error.stderr, /--allow-non-device/u);
			return true;
		}
	);

	const result = await execFileAsync(
		process.execPath,
		[
			'scripts/plan-scout-local-ai-iteration.mjs',
			'--backlog',
			backlogPath,
			'--output-dir',
			iterationDir,
			'--plan-id',
			'scaffold-iteration-plan',
			'--allow-non-device'
		],
		{ cwd: REPO_ROOT, maxBuffer: 1024 * 1024 * 2 }
	);
	const plan = JSON.parse(await readFile(join(iterationDir, 'scaffold-iteration-plan.iteration.json'), 'utf8'));

	assert.match(result.stdout, /Scout local AI iteration plan written/u);
	assert.equal(plan.summary.byEvidenceLane['scaffold-not-model'], 1);
	assert.equal(plan.sourceBacklogs[0].evidenceLane, 'scaffold-not-model');
});

test('iteration verifier passes when rerun resolves planned regression cases', async () => {
	const suite = JSON.parse(await readFile(SUITE_PATH, 'utf8'));
	const outputDir = await mkdtemp(join(tmpdir(), 'scout-local-ai-iteration-verify-pass-'));
	const sourceRun = deviceRunForCases(suite, suite.cases.slice(0, 3), {
		runId: 'device-iteration-source',
		completeTools: true
	});
	const sourceReview = reviewForRun(sourceRun);
	sourceReview.cases[0].rating = 4;
	sourceReview.cases[0].failureCategories = ['missing-data'];
	sourceReview.cases[0].improvementTask = 'Add a current-section water reliability source document.';
	sourceReview.cases[1].rating = 5;
	sourceReview.cases[2].rating = 2;
	sourceReview.cases[2].failureCategories = ['weak-tool', 'bad-routing'];
	sourceReview.cases[2].improvementTask = 'Fix source routing for the local safety document.';
	const sourceRunPath = join(outputDir, 'device-iteration-source.json');
	const sourceReviewPath = join(outputDir, 'device-iteration-source.review.json');
	const backlogDir = join(outputDir, 'backlog');
	const iterationDir = join(outputDir, 'iterations');
	await writeFile(sourceRunPath, `${JSON.stringify(sourceRun, null, 2)}\n`);
	await writeFile(sourceReviewPath, `${JSON.stringify(sourceReview, null, 2)}\n`);
	await execFileAsync(
		process.execPath,
		[
			'scripts/review-scout-local-ai-eval.mjs',
			'--run',
			sourceRunPath,
			'--review',
			sourceReviewPath,
			'--backlog-dir',
			backlogDir
		],
		{ cwd: REPO_ROOT, maxBuffer: 1024 * 1024 * 2 }
	);
	await execFileAsync(
		process.execPath,
		[
			'scripts/plan-scout-local-ai-iteration.mjs',
			'--backlog',
			join(backlogDir, 'device-iteration-source.backlog.json'),
			'--output-dir',
			iterationDir,
			'--plan-id',
			'device-iteration-resolution-pass'
		],
		{ cwd: REPO_ROOT, maxBuffer: 1024 * 1024 * 2 }
	);

	const rerunCases = [suite.cases[2], suite.cases[0]];
	const rerun = deviceRunForCases(suite, rerunCases, {
		runId: 'device-iteration-rerun-pass',
		completeTools: true
	});
	const rerunReview = reviewForRun(rerun, { rating: 5 });
	const rerunPath = join(outputDir, 'device-iteration-rerun-pass.json');
	const rerunReviewPath = join(outputDir, 'device-iteration-rerun-pass.review.json');
	await writeFile(rerunPath, `${JSON.stringify(rerun, null, 2)}\n`);
	await writeFile(rerunReviewPath, `${JSON.stringify(rerunReview, null, 2)}\n`);

	const result = await execFileAsync(
		process.execPath,
		[
			'scripts/verify-scout-local-ai-iteration.mjs',
			'--plan',
			join(iterationDir, 'device-iteration-resolution-pass.iteration.json'),
			'--run',
			rerunPath,
			'--review',
			rerunReviewPath,
			'--output-dir',
			iterationDir,
			'--resolution-id',
			'device-iteration-resolution-pass'
		],
		{ cwd: REPO_ROOT, maxBuffer: 1024 * 1024 * 2 }
	);
	const resolution = JSON.parse(await readFile(join(iterationDir, 'device-iteration-resolution-pass.resolution.json'), 'utf8'));
	const markdown = await readFile(join(iterationDir, 'device-iteration-resolution-pass.resolution.md'), 'utf8');

	assert.match(result.stdout, /Scout local AI iteration verification passed/u);
	assert.equal(resolution.status, 'passed');
	assert.equal(resolution.summary.resolvedPlannedCases, 2);
	assert.equal(resolution.summary.unresolvedPlannedCases, 0);
	assert.equal(resolution.summary.belowFive, 0);
	assert.match(markdown, /Resolved planned cases: 2\/2/u);
	assert.match(markdown, /Run strict device proof only after a full device review is 100\/100 at 5\/5/u);
});

test('iteration verifier rejects 5-star reruns that conflict with run evidence', async () => {
	const suite = JSON.parse(await readFile(SUITE_PATH, 'utf8'));
	const outputDir = await mkdtemp(join(tmpdir(), 'scout-local-ai-iteration-evidence-invalid-'));
	const plan = {
		schemaVersion: 1,
		planId: 'device-iteration-evidence-invalid',
		sourceBacklogs: [
			{
				path: 'data/scout-local-ai/backlog/source.backlog.json',
				runId: 'source-run',
				suiteId: suite.suiteId,
				suiteVersion: suite.version,
				suiteHash: scoutLocalAiSuiteHash(suite),
				evidenceLane: 'device-on-device-gemma'
			}
		],
		regressionCaseIds: [suite.cases[0].id]
	};
	const rerun = deviceRunForCases(suite, suite.cases.slice(0, 1), {
		runId: 'device-iteration-evidence-invalid'
	});
	const review = reviewForRun(rerun, { rating: 5 });
	const planPath = join(outputDir, 'device-iteration-evidence-invalid.iteration.json');
	const rerunPath = join(outputDir, 'device-iteration-evidence-invalid.json');
	const reviewPath = join(outputDir, 'device-iteration-evidence-invalid.review.json');
	const resolutionDir = join(outputDir, 'resolutions');
	await writeFile(planPath, `${JSON.stringify(plan, null, 2)}\n`);
	await writeFile(rerunPath, `${JSON.stringify(rerun, null, 2)}\n`);
	await writeFile(reviewPath, `${JSON.stringify(review, null, 2)}\n`);

	await assert.rejects(
		execFileAsync(
			process.execPath,
			[
				'scripts/verify-scout-local-ai-iteration.mjs',
				'--plan',
				planPath,
				'--run',
				rerunPath,
				'--review',
				reviewPath,
				'--output-dir',
				resolutionDir,
				'--resolution-id',
				'device-iteration-evidence-invalid'
			],
			{ cwd: REPO_ROOT, maxBuffer: 1024 * 1024 * 2 }
		),
		(error) => {
			assert.match(error.stderr, /Scout local AI iteration verification failed validation/u);
			assert.match(error.stderr, /5-star rating conflicts with run evidence/u);
			assert.match(error.stderr, /missing required tools/u);
			assert.match(error.stderr, /actual toolInvocations missed required tools/u);
			return true;
		}
	);
});

test('iteration verifier rejects non-device reruns unless explicitly allowed', async () => {
	const suite = JSON.parse(await readFile(SUITE_PATH, 'utf8'));
	const outputDir = await mkdtemp(join(tmpdir(), 'scout-local-ai-iteration-non-device-verify-'));
	const plan = {
		schemaVersion: 1,
		planId: 'scaffold-iteration-resolution',
		sourceBacklogs: [
			{
				path: 'data/scout-local-ai/backlog/scaffold.backlog.json',
				runId: 'scaffold-source-run',
				suiteId: suite.suiteId,
				suiteVersion: suite.version,
				suiteHash: scoutLocalAiSuiteHash(suite),
				evidenceLane: 'scaffold-not-model'
			}
		],
		regressionCaseIds: [suite.cases[0].id]
	};
	const rerun = deviceRunForCases(suite, suite.cases.slice(0, 1), {
		runId: 'scaffold-iteration-rerun-pass',
		completeTools: true
	});
	rerun.evidenceLane = 'scaffold-not-model';
	for (const result of rerun.results) result.answerOrigin = 'scaffold-not-model';
	const review = reviewForRun(rerun, { rating: 5 });
	const planPath = join(outputDir, 'scaffold-iteration-resolution.iteration.json');
	const rerunPath = join(outputDir, 'scaffold-iteration-rerun-pass.json');
	const reviewPath = join(outputDir, 'scaffold-iteration-rerun-pass.review.json');
	const resolutionDir = join(outputDir, 'resolutions');
	await writeFile(planPath, `${JSON.stringify(plan, null, 2)}\n`);
	await writeFile(rerunPath, `${JSON.stringify(rerun, null, 2)}\n`);
	await writeFile(reviewPath, `${JSON.stringify(review, null, 2)}\n`);

	await assert.rejects(
		execFileAsync(
			process.execPath,
			[
				'scripts/verify-scout-local-ai-iteration.mjs',
				'--plan',
				planPath,
				'--run',
				rerunPath,
				'--review',
				reviewPath,
				'--output-dir',
				resolutionDir,
				'--resolution-id',
				'scaffold-iteration-resolution'
			],
			{ cwd: REPO_ROOT, maxBuffer: 1024 * 1024 * 2 }
		),
		(error) => {
			assert.match(error.stderr, /Scout local AI iteration verification failed validation/u);
			assert.match(error.stderr, /run\.evidenceLane must be device-on-device-gemma/u);
			assert.match(error.stderr, /plan evidenceLane must be device-on-device-gemma/u);
			assert.match(error.stderr, /--allow-non-device/u);
			return true;
		}
	);

	const result = await execFileAsync(
		process.execPath,
		[
			'scripts/verify-scout-local-ai-iteration.mjs',
			'--plan',
			planPath,
			'--run',
			rerunPath,
			'--review',
			reviewPath,
			'--output-dir',
			resolutionDir,
			'--resolution-id',
			'scaffold-iteration-resolution',
			'--allow-non-device'
		],
		{ cwd: REPO_ROOT, maxBuffer: 1024 * 1024 * 2 }
	);
	const resolution = JSON.parse(await readFile(join(resolutionDir, 'scaffold-iteration-resolution.resolution.json'), 'utf8'));

	assert.match(result.stdout, /Scout local AI iteration verification passed/u);
	assert.equal(resolution.status, 'passed');
	assert.equal(resolution.rerun.evidenceLane, 'scaffold-not-model');
});

test('iteration verifier rejects reruns with unresolved planned cases', async () => {
	const suite = JSON.parse(await readFile(SUITE_PATH, 'utf8'));
	const outputDir = await mkdtemp(join(tmpdir(), 'scout-local-ai-iteration-verify-fail-'));
	const plan = {
		schemaVersion: 1,
		planId: 'device-iteration-resolution-fail',
		sourceBacklogs: [
			{
				path: 'data/scout-local-ai/backlog/source.backlog.json',
				runId: 'source-run',
				suiteId: suite.suiteId,
				evidenceLane: 'device-on-device-gemma'
			}
		],
		regressionCaseIds: [suite.cases[0].id, suite.cases[1].id]
	};
	const rerun = deviceRunForCases(suite, suite.cases.slice(0, 2), {
		runId: 'device-iteration-rerun-fail',
		completeTools: true
	});
	const rerunReview = reviewForRun(rerun, { rating: 5 });
	rerunReview.cases[1].rating = 4;
	rerunReview.cases[1].failureCategories = ['unsafe-wording'];
	rerunReview.cases[1].improvementTask = 'Tighten safety wording so the answer leads with bailout choices.';
	const planPath = join(outputDir, 'device-iteration-resolution-fail.iteration.json');
	const rerunPath = join(outputDir, 'device-iteration-rerun-fail.json');
	const rerunReviewPath = join(outputDir, 'device-iteration-rerun-fail.review.json');
	await writeFile(planPath, `${JSON.stringify(plan, null, 2)}\n`);
	await writeFile(rerunPath, `${JSON.stringify(rerun, null, 2)}\n`);
	await writeFile(rerunReviewPath, `${JSON.stringify(rerunReview, null, 2)}\n`);

	let thrown;
	try {
		await execFileAsync(
			process.execPath,
			[
				'scripts/verify-scout-local-ai-iteration.mjs',
				'--plan',
				planPath,
				'--run',
				rerunPath,
				'--review',
				rerunReviewPath,
				'--output-dir',
				outputDir,
				'--resolution-id',
				'device-iteration-resolution-fail'
			],
			{ cwd: REPO_ROOT, maxBuffer: 1024 * 1024 * 2 }
		);
	} catch (error) {
		thrown = error;
	}
	assert.ok(thrown, 'iteration verifier should fail unresolved planned cases');
	assert.match(thrown.stderr, /Scout local AI iteration verification failed/u);
	assert.match(thrown.stderr, /Unresolved planned cases: 1/u);
	assert.match(thrown.stderr, /Below-5 review cases: 1/u);
	const resolution = JSON.parse(await readFile(join(outputDir, 'device-iteration-resolution-fail.resolution.json'), 'utf8'));
	assert.equal(resolution.status, 'failed');
	assert.equal(resolution.summary.resolvedPlannedCases, 1);
	assert.equal(resolution.summary.unresolvedPlannedCases, 1);
	assert.equal(resolution.unresolvedItems[0].caseId, suite.cases[1].id);
	assert.match(resolution.unresolvedItems[0].problems.join(' '), /rating is 4, not 5/u);
});

test('review workflow rejects unrated cases by default', async () => {
	const suite = JSON.parse(await readFile(SUITE_PATH, 'utf8'));
	const outputDir = await mkdtemp(join(tmpdir(), 'scout-local-ai-review-unrated-'));
	const run = deviceRunForCases(suite, suite.cases.slice(0, 2), {
		runId: 'device-review-unrated',
		completeTools: true
	});
	const review = reviewForRun(run);
	review.cases[0].rating = 5;

	const runPath = join(outputDir, 'device-review-unrated.json');
	const reviewPath = join(outputDir, 'device-review-unrated.review.json');
	const backlogDir = join(outputDir, 'backlog');
	await writeFile(runPath, `${JSON.stringify(run, null, 2)}\n`);
	await writeFile(reviewPath, `${JSON.stringify(review, null, 2)}\n`);

	await assert.rejects(
		execFileAsync(
			process.execPath,
			[
				'scripts/review-scout-local-ai-eval.mjs',
				'--run',
				runPath,
				'--review',
				reviewPath,
				'--backlog-dir',
				backlogDir
			],
			{ cwd: REPO_ROOT, maxBuffer: 1024 * 1024 * 2 }
		),
		(error) => {
			assert.match(error.stderr, /Review is incomplete/u);
			assert.match(error.stderr, new RegExp(`${review.cases[1].caseId}: missing rating`, 'u'));
			assert.match(error.stderr, /--allow-unrated/u);
			return true;
		}
	);
});

test('partial review status keeps unrated cases explicit when allowed', async () => {
	const suite = JSON.parse(await readFile(SUITE_PATH, 'utf8'));
	const outputDir = await mkdtemp(join(tmpdir(), 'scout-local-ai-review-partial-'));
	const run = deviceRunForCases(suite, suite.cases.slice(0, 3), {
		runId: 'device-review-partial',
		completeTools: true
	});
	const review = reviewForRun(run);
	review.cases[0].rating = 5;

	const runPath = join(outputDir, 'device-review-partial.json');
	const reviewPath = join(outputDir, 'device-review-partial.review.json');
	const backlogDir = join(outputDir, 'backlog');
	await writeFile(runPath, `${JSON.stringify(run, null, 2)}\n`);
	await writeFile(reviewPath, `${JSON.stringify(review, null, 2)}\n`);

	const result = await execFileAsync(
		process.execPath,
		[
			'scripts/review-scout-local-ai-eval.mjs',
			'--run',
			runPath,
			'--review',
			reviewPath,
			'--backlog-dir',
			backlogDir,
			'--allow-unrated'
		],
		{ cwd: REPO_ROOT, maxBuffer: 1024 * 1024 * 2 }
	);
	const backlog = JSON.parse(await readFile(join(backlogDir, 'device-review-partial.backlog.json'), 'utf8'));
	const markdown = await readFile(join(backlogDir, 'device-review-partial.backlog.md'), 'utf8');

	assert.match(result.stdout, /Unrated: 2/u);
	assert.equal(backlog.summary.unrated, 2);
	assert.equal(backlog.items.length, 0);
	assert.equal(backlog.unratedItems.length, 2);
	assert.match(markdown, /No below-5 improvement tasks are available yet because the review is incomplete/u);
	assert.match(markdown, /## Unrated cases/u);
	assert.match(markdown, new RegExp(`### ${review.cases[1].caseId}`, 'u'));
	assert.doesNotMatch(markdown, /strict device proof gate for final readiness/u);
});

test('device run intake rejects scaffold runs by default', async () => {
	const suite = JSON.parse(await readFile(SUITE_PATH, 'utf8'));
	const outputDir = await mkdtemp(join(tmpdir(), 'scout-local-ai-intake-reject-'));
	const inputPath = join(outputDir, 'scaffold-export.json');
	const run = {
		...deviceRunForCases(suite, suite.cases.slice(0, 1)),
		evidenceLane: 'scaffold-not-model'
	};
	run.results[0].answerOrigin = 'scaffold-not-model';
	await writeFile(inputPath, `${JSON.stringify(run, null, 2)}\n`);

	await assert.rejects(
		execFileAsync(
			process.execPath,
			[
				'scripts/import-scout-local-ai-device-run.mjs',
				'--run',
				inputPath,
				'--allow-partial',
				'--device-run-dir',
				join(outputDir, 'device-runs')
			],
			{ cwd: REPO_ROOT, maxBuffer: 1024 * 1024 }
		),
		/evidenceLane must be device-on-device-gemma/u
	);
});

test('strict device proof accepts a full 5-star device review', async () => {
	const suite = JSON.parse(await readFile(SUITE_PATH, 'utf8'));
	const outputDir = await mkdtemp(join(tmpdir(), 'scout-local-ai-proof-pass-'));
	const run = deviceRunForCases(suite, suite.cases, {
		runId: 'device-final-proof-pass',
		completeTools: true,
		runContext: finalDeviceRunContext()
	});
	const review = reviewForRun(run, { rating: 5 });
	const runPath = join(outputDir, 'device-final-proof-pass.json');
	const reviewPath = join(outputDir, 'device-final-proof-pass.review.json');
	const proofPath = join(outputDir, 'device-final-proof-pass.proof.md');
	await writeFile(runPath, `${JSON.stringify(run, null, 2)}\n`);
	await writeFile(reviewPath, `${JSON.stringify(review, null, 2)}\n`);

	const result = await execFileAsync(
		process.execPath,
		[
			'scripts/verify-scout-local-ai-device-proof.mjs',
			'--run',
			runPath,
			'--review',
			reviewPath,
			'--proof-out',
			proofPath
		],
		{ cwd: REPO_ROOT, maxBuffer: 1024 * 1024 * 2 }
	);
	const proof = await readFile(proofPath, 'utf8');

	assert.match(result.stdout, /Scout local AI device proof passed/u);
	assert.match(result.stdout, /5\/5: 100\/100/u);
	assert.match(proof, /Ratings of 5: 100\/100/u);
	assert.ok(proof.includes(`Suite version: \`${suite.version}\``));
	assert.match(proof, /Suite hash: `fnv1a32:[0-9a-f]{8}`/u);
	assert.match(proof, /Required-tool complete: 100\/100/u);
	assert.match(proof, /App version\/build: `1\.0 \(11\)`/u);
	assert.match(proof, /Required app version\/build: `1\.0 \(>= 11\)`/u);
	assert.match(proof, /Install source: `testflight`/u);
});

test('strict device proof rejects 5-star reviews with missing required tool hits', async () => {
	const suite = JSON.parse(await readFile(SUITE_PATH, 'utf8'));
	const outputDir = await mkdtemp(join(tmpdir(), 'scout-local-ai-proof-fail-'));
	const run = deviceRunForCases(suite, suite.cases, {
		runId: 'device-final-proof-fail',
		runContext: finalDeviceRunContext()
	});
	const review = reviewForRun(run, { rating: 5 });
	const runPath = join(outputDir, 'device-final-proof-fail.json');
	const reviewPath = join(outputDir, 'device-final-proof-fail.review.json');
	await writeFile(runPath, `${JSON.stringify(run, null, 2)}\n`);
	await writeFile(reviewPath, `${JSON.stringify(review, null, 2)}\n`);

	await assert.rejects(
		execFileAsync(
			process.execPath,
			[
				'scripts/verify-scout-local-ai-device-proof.mjs',
				'--run',
				runPath,
				'--review',
				reviewPath
			],
			{ cwd: REPO_ROOT, maxBuffer: 1024 * 1024 * 2 }
		),
		(error) => {
			assert.match(error.stderr, /run.summary.toolExpectationComplete must be 100/u);
			assert.match(error.stderr, /missing required tools/u);
			return true;
		}
	);
});

test('strict device proof rejects summary-only tool hits without invocation evidence', async () => {
	const suite = JSON.parse(await readFile(SUITE_PATH, 'utf8'));
	const outputDir = await mkdtemp(join(tmpdir(), 'scout-local-ai-proof-summary-only-'));
	const run = deviceRunForCases(suite, suite.cases, {
		runId: 'device-final-proof-summary-only',
		completeTools: true,
		runContext: finalDeviceRunContext()
	});
	for (const result of run.results) {
		result.toolInvocations = [];
		result.receipts = [];
	}
	const review = reviewForRun(run, { rating: 5 });
	const runPath = join(outputDir, 'device-final-proof-summary-only.json');
	const reviewPath = join(outputDir, 'device-final-proof-summary-only.review.json');
	await writeFile(runPath, `${JSON.stringify(run, null, 2)}\n`);
	await writeFile(reviewPath, `${JSON.stringify(review, null, 2)}\n`);

	await assert.rejects(
		execFileAsync(
			process.execPath,
			[
				'scripts/verify-scout-local-ai-device-proof.mjs',
				'--run',
				runPath,
				'--review',
				reviewPath
			],
			{ cwd: REPO_ROOT, maxBuffer: 1024 * 1024 * 2 }
		),
		(error) => {
			assert.match(error.stderr, /actual toolInvocations missed required tools/u);
			assert.match(error.stderr, /toolExpectations\.hit does not match actual toolInvocations/u);
			return true;
		}
	);
});

test('strict device proof rejects source-backed tool hits without source evidence', async () => {
	const suite = JSON.parse(await readFile(SUITE_PATH, 'utf8'));
	const outputDir = await mkdtemp(join(tmpdir(), 'scout-local-ai-proof-source-evidence-'));
	const run = deviceRunForCases(suite, suite.cases, {
		runId: 'device-final-proof-source-evidence',
		completeTools: true,
		runContext: finalDeviceRunContext()
	});
	const sourceCase = suite.cases.find((testCase) => testCase.requiredTools.some((expectation) => expectation.includes(':')));
	assert.ok(sourceCase, 'suite should contain source-backed tool expectations');
	const sourceResult = run.results.find((result) => result.caseId === sourceCase.id);
	assert.ok(sourceResult, `run should contain ${sourceCase.id}`);
	for (const invocation of sourceResult.toolInvocations) {
		if (String(invocation.args?.sourceSkill ?? '').trim()) {
			invocation.receipts = [];
			invocation.sourceDocumentIds = [];
		}
	}
	sourceResult.receipts = sourceResult.toolInvocations.flatMap((record) => record.receipts ?? []);
	const review = reviewForRun(run, { rating: 5 });
	const runPath = join(outputDir, 'device-final-proof-source-evidence.json');
	const reviewPath = join(outputDir, 'device-final-proof-source-evidence.review.json');
	await writeFile(runPath, `${JSON.stringify(run, null, 2)}\n`);
	await writeFile(reviewPath, `${JSON.stringify(review, null, 2)}\n`);

	await assert.rejects(
		execFileAsync(
			process.execPath,
			[
				'scripts/verify-scout-local-ai-device-proof.mjs',
				'--run',
				runPath,
				'--review',
				reviewPath
			],
			{ cwd: REPO_ROOT, maxBuffer: 1024 * 1024 * 2 }
		),
		(error) => {
			assert.match(error.stderr, new RegExp(`${sourceCase.id}: source-backed required tool`, 'u'));
			assert.match(error.stderr, /must record at least one receipt or sourceDocumentId/u);
			return true;
		}
	);
});

test('strict device proof rejects 5-star reviews with unchecked rubric items', async () => {
	const suite = JSON.parse(await readFile(SUITE_PATH, 'utf8'));
	const outputDir = await mkdtemp(join(tmpdir(), 'scout-local-ai-proof-rubric-fail-'));
	const run = deviceRunForCases(suite, suite.cases, {
		runId: 'device-final-proof-rubric-fail',
		completeTools: true,
		runContext: finalDeviceRunContext()
	});
	const review = reviewForRun(run, { rating: 5 });
	review.cases[0].safetyCaveatChecks[0].passed = null;
	const runPath = join(outputDir, 'device-final-proof-rubric-fail.json');
	const reviewPath = join(outputDir, 'device-final-proof-rubric-fail.review.json');
	await writeFile(runPath, `${JSON.stringify(run, null, 2)}\n`);
	await writeFile(reviewPath, `${JSON.stringify(review, null, 2)}\n`);

	await assert.rejects(
		execFileAsync(
			process.execPath,
			[
				'scripts/verify-scout-local-ai-device-proof.mjs',
				'--run',
				runPath,
				'--review',
				reviewPath
			],
			{ cwd: REPO_ROOT, maxBuffer: 1024 * 1024 * 2 }
		),
		(error) => {
			assert.match(error.stderr, /safetyCaveatChecks\[0\] must be passed=true/u);
			return true;
		}
	);
});

test('strict device proof rejects final reviews without native app metadata', async () => {
	const suite = JSON.parse(await readFile(SUITE_PATH, 'utf8'));
	const outputDir = await mkdtemp(join(tmpdir(), 'scout-local-ai-proof-metadata-fail-'));
	const run = deviceRunForCases(suite, suite.cases, {
		runId: 'device-final-proof-metadata-fail',
		completeTools: true,
		runContext: { surface: 'mobile-settings-scout-eval-lab' }
	});
	const review = reviewForRun(run, { rating: 5 });
	const runPath = join(outputDir, 'device-final-proof-metadata-fail.json');
	const reviewPath = join(outputDir, 'device-final-proof-metadata-fail.review.json');
	await writeFile(runPath, `${JSON.stringify(run, null, 2)}\n`);
	await writeFile(reviewPath, `${JSON.stringify(review, null, 2)}\n`);

	await assert.rejects(
		execFileAsync(
			process.execPath,
			[
				'scripts/verify-scout-local-ai-device-proof.mjs',
				'--run',
				runPath,
				'--review',
				reviewPath
			],
			{ cwd: REPO_ROOT, maxBuffer: 1024 * 1024 * 2 }
		),
		(error) => {
			assert.match(error.stderr, /native\.isNativePlatform must be true/u);
			assert.match(error.stderr, /native\.platform must be ios/u);
			assert.match(error.stderr, /installSource\.type must be testflight/u);
			assert.match(error.stderr, /app\.build is required/u);
			assert.match(error.stderr, /runtimeConfigured must be true/u);
			return true;
		}
	);
});

test('strict device proof rejects non-TestFlight iPhone installs', async () => {
	const suite = JSON.parse(await readFile(SUITE_PATH, 'utf8'));
	const outputDir = await mkdtemp(join(tmpdir(), 'scout-local-ai-proof-install-source-fail-'));
	const run = deviceRunForCases(suite, suite.cases, {
		runId: 'device-final-proof-debug-install',
		completeTools: true,
		runContext: finalDeviceRunContext({
			installSource: {
				type: 'debug',
				platform: 'ios',
				detectedBy: 'ios-app-store-receipt',
				receiptPresent: false,
				debugBuild: true,
				buildConfiguration: 'debug'
			}
		})
	});
	const review = reviewForRun(run, { rating: 5 });
	const runPath = join(outputDir, 'device-final-proof-debug-install.json');
	const reviewPath = join(outputDir, 'device-final-proof-debug-install.review.json');
	await writeFile(runPath, `${JSON.stringify(run, null, 2)}\n`);
	await writeFile(reviewPath, `${JSON.stringify(review, null, 2)}\n`);

	await assert.rejects(
		execFileAsync(
			process.execPath,
			[
				'scripts/verify-scout-local-ai-device-proof.mjs',
				'--run',
				runPath,
				'--review',
				reviewPath
			],
			{ cwd: REPO_ROOT, maxBuffer: 1024 * 1024 * 2 }
		),
		(error) => {
			assert.match(error.stderr, /installSource\.type must be testflight/u);
			assert.match(error.stderr, /got debug/u);
			return true;
		}
	);
});

test('strict device proof rejects stale TestFlight app builds', async () => {
	const suite = JSON.parse(await readFile(SUITE_PATH, 'utf8'));
	const outputDir = await mkdtemp(join(tmpdir(), 'scout-local-ai-proof-stale-build-'));
	const staleRunContext = finalDeviceRunContext();
	staleRunContext.app = { ...staleRunContext.app, build: '9' };
	const run = deviceRunForCases(suite, suite.cases, {
		runId: 'device-final-proof-stale-build',
		completeTools: true,
		runContext: staleRunContext
	});
	const review = reviewForRun(run, { rating: 5 });
	const runPath = join(outputDir, 'device-final-proof-stale-build.json');
	const reviewPath = join(outputDir, 'device-final-proof-stale-build.review.json');
	await writeFile(runPath, `${JSON.stringify(run, null, 2)}\n`);
	await writeFile(reviewPath, `${JSON.stringify(review, null, 2)}\n`);

	await assert.rejects(
		execFileAsync(
			process.execPath,
			[
				'scripts/verify-scout-local-ai-device-proof.mjs',
				'--run',
				runPath,
				'--review',
				reviewPath
			],
			{ cwd: REPO_ROOT, maxBuffer: 1024 * 1024 * 2 }
		),
		(error) => {
			assert.match(error.stderr, /app\.build must be >= 11/u);
			assert.match(error.stderr, /got 9/u);
			return true;
		}
	);
});

test('strict device proof rejects stale suite fingerprints', async () => {
	const suite = JSON.parse(await readFile(SUITE_PATH, 'utf8'));
	const outputDir = await mkdtemp(join(tmpdir(), 'scout-local-ai-proof-stale-'));
	const run = deviceRunForCases(suite, suite.cases, {
		runId: 'device-final-proof-stale-suite',
		completeTools: true,
		runContext: finalDeviceRunContext(),
		suiteHash: 'fnv1a32:00000000'
	});
	const review = reviewForRun(run, { rating: 5 });
	const runPath = join(outputDir, 'device-final-proof-stale-suite.json');
	const reviewPath = join(outputDir, 'device-final-proof-stale-suite.review.json');
	await writeFile(runPath, `${JSON.stringify(run, null, 2)}\n`);
	await writeFile(reviewPath, `${JSON.stringify(review, null, 2)}\n`);

	await assert.rejects(
		execFileAsync(
			process.execPath,
			[
				'scripts/verify-scout-local-ai-device-proof.mjs',
				'--run',
				runPath,
				'--review',
				reviewPath
			],
			{ cwd: REPO_ROOT, maxBuffer: 1024 * 1024 * 2 }
		),
		(error) => {
			assert.match(error.stderr, /run\.suiteHash/u);
			assert.match(error.stderr, /review\.suiteHash/u);
			return true;
		}
	);
});

test('stability proof accepts two full 5-star device reviews', async () => {
	const suite = JSON.parse(await readFile(SUITE_PATH, 'utf8'));
	const outputDir = await mkdtemp(join(tmpdir(), 'scout-local-ai-stability-pass-'));
	const runA = deviceRunForCases(suite, suite.cases, {
		runId: 'device-stability-pass-a',
		completeTools: true,
		runContext: finalDeviceRunContext()
	});
	const runB = deviceRunForCases(suite, suite.cases, {
		runId: 'device-stability-pass-b',
		completeTools: true,
		runContext: finalDeviceRunContext()
	});
	runB.generatedAt = '2026-06-26T12:10:00.000Z';
	const reviewA = reviewForRun(runA, { rating: 5 });
	const reviewB = reviewForRun(runB, { rating: 5 });
	const runAPath = join(outputDir, 'device-stability-pass-a.json');
	const runBPath = join(outputDir, 'device-stability-pass-b.json');
	const reviewAPath = join(outputDir, 'device-stability-pass-a.review.json');
	const reviewBPath = join(outputDir, 'device-stability-pass-b.review.json');
	const proofPath = join(outputDir, 'device-stability.proof.md');
	await writeFile(runAPath, `${JSON.stringify(runA, null, 2)}\n`);
	await writeFile(runBPath, `${JSON.stringify(runB, null, 2)}\n`);
	await writeFile(reviewAPath, `${JSON.stringify(reviewA, null, 2)}\n`);
	await writeFile(reviewBPath, `${JSON.stringify(reviewB, null, 2)}\n`);

	const result = await execFileAsync(
		process.execPath,
		[
			'scripts/verify-scout-local-ai-stability-proof.mjs',
			'--pairs',
			`${runAPath}:${reviewAPath},${runBPath}:${reviewBPath}`,
			'--proof-out',
			proofPath
		],
		{ cwd: REPO_ROOT, maxBuffer: 1024 * 1024 * 2 }
	);
	const proof = await readFile(proofPath, 'utf8');

	assert.match(result.stdout, /Scout local AI stability proof passed/u);
	assert.match(result.stdout, /Runs: 2/u);
	assert.match(result.stdout, /Per-case repeated 5\/5: 100\/100/u);
	assert.match(proof, /Reviewed runs: 2/u);
	assert.match(proof, /Run 1: device-stability-pass-a/u);
	assert.match(proof, /Run 2: device-stability-pass-b/u);
	assert.match(proof, /Run generated at: `2026-06-26T12:10:00\.000Z`/u);
	assert.match(proof, /Install source: `testflight`/u);
	assert.match(proof, /Required app version\/build: `1\.0 \(>= 11\)`/u);
	assert.match(proof, /App version\/build: `1\.0 \(11\)`/u);
	assert.match(proof, /Per-case repeated 5\/5: 100\/100/u);
});

test('stability proof rejects a single perfect device review', async () => {
	const suite = JSON.parse(await readFile(SUITE_PATH, 'utf8'));
	const outputDir = await mkdtemp(join(tmpdir(), 'scout-local-ai-stability-fail-'));
	const run = deviceRunForCases(suite, suite.cases, {
		runId: 'device-stability-fail-one-run',
		completeTools: true,
		runContext: finalDeviceRunContext()
	});
	const review = reviewForRun(run, { rating: 5 });
	const runPath = join(outputDir, 'device-stability-fail-one-run.json');
	const reviewPath = join(outputDir, 'device-stability-fail-one-run.review.json');
	await writeFile(runPath, `${JSON.stringify(run, null, 2)}\n`);
	await writeFile(reviewPath, `${JSON.stringify(review, null, 2)}\n`);

	await assert.rejects(
		execFileAsync(
			process.execPath,
			[
				'scripts/verify-scout-local-ai-stability-proof.mjs',
				'--pairs',
				`${runPath}:${reviewPath}`
			],
			{ cwd: REPO_ROOT, maxBuffer: 1024 * 1024 * 2 }
		),
		(error) => {
			assert.match(error.stderr, /stability proof requires at least 2 distinct full device runs/u);
			return true;
		}
	);
});

test('stability proof rejects copied exports with new run ids', async () => {
	const suite = JSON.parse(await readFile(SUITE_PATH, 'utf8'));
	const outputDir = await mkdtemp(join(tmpdir(), 'scout-local-ai-stability-copy-'));
	const runA = deviceRunForCases(suite, suite.cases, {
		runId: 'device-stability-copy-a',
		completeTools: true,
		runContext: finalDeviceRunContext()
	});
	const runB = JSON.parse(JSON.stringify(runA));
	runB.runId = 'device-stability-copy-b';
	const reviewA = reviewForRun(runA, { rating: 5 });
	const reviewB = reviewForRun(runB, { rating: 5 });
	const runAPath = join(outputDir, 'device-stability-copy-a.json');
	const runBPath = join(outputDir, 'device-stability-copy-b.json');
	const reviewAPath = join(outputDir, 'device-stability-copy-a.review.json');
	const reviewBPath = join(outputDir, 'device-stability-copy-b.review.json');
	await writeFile(runAPath, `${JSON.stringify(runA, null, 2)}\n`);
	await writeFile(runBPath, `${JSON.stringify(runB, null, 2)}\n`);
	await writeFile(reviewAPath, `${JSON.stringify(reviewA, null, 2)}\n`);
	await writeFile(reviewBPath, `${JSON.stringify(reviewB, null, 2)}\n`);

	await assert.rejects(
		execFileAsync(
			process.execPath,
			[
				'scripts/verify-scout-local-ai-stability-proof.mjs',
				'--pairs',
				`${runAPath}:${reviewAPath},${runBPath}:${reviewBPath}`
			],
			{ cwd: REPO_ROOT, maxBuffer: 1024 * 1024 * 2 }
		),
		(error) => {
			assert.match(error.stderr, /duplicate run execution fingerprint/u);
			assert.match(error.stderr, /separate Eval Lab executions/u);
			return true;
		}
	);
});

function assertNonEmptyStringArray(value, label) {
	assert.ok(Array.isArray(value), `${label} must be an array`);
	assert.ok(value.length > 0, `${label} must not be empty`);
	for (const item of value) {
		assert.equal(typeof item, 'string', `${label} values must be strings`);
		assert.ok(item.trim().length > 0, `${label} values must not be blank`);
	}
}

function assertValidToolExpectation(expectation, caseId) {
	const [toolId, sourceSkill, extra] = expectation.split(':');
	assert.equal(extra, undefined, `${caseId} tool expectation ${expectation} has too many parts`);
	assert.ok(VALID_TOOL_IDS.has(toolId), `${caseId} requires unknown tool ${toolId}`);
	if (sourceSkill) {
		assert.ok(
			toolId === 'source_search' || toolId === 'open_source_doc',
			`${caseId} can only attach source skills to source_search/open_source_doc`
		);
		assert.ok(VALID_SOURCE_SKILLS.has(sourceSkill), `${caseId} has unknown source skill ${sourceSkill}`);
	}
}

function finalDeviceRunContext(patch = {}) {
	return {
		surface: 'mobile-settings-scout-eval-lab',
		scoutLane: 'ios-on-device-gemma',
		modelState: 'ready',
		modelId: 'gemma-3n-E4B-it-int4',
		runtimeConfigured: true,
		svelteKitVersion: 'test-version',
		userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X)',
		native: {
			isNativePlatform: true,
			platform: 'ios'
		},
		app: {
			id: 'com.hoggcountry.trailassistant',
			name: 'Hoggcountry',
			version: '1.0',
			build: '11'
		},
		installSource: {
			type: 'testflight',
			platform: 'ios',
			detectedBy: 'ios-app-store-receipt',
			receiptPresent: true,
			receiptLastPathComponent: 'sandboxReceipt',
			debugBuild: false,
			buildConfiguration: 'release'
		},
		...patch
	};
}

function deviceRunForCases(suite, cases, options = {}) {
	const results = cases.map((testCase, index) => {
		const toolInvocations = options.completeTools ? toolInvocationsFor(testCase) : [];
		return {
			caseId: testCase.id,
			index: index + 1,
			case: testCase,
			answer: `device answer for ${testCase.id}`,
			answerOrigin: 'device-on-device-gemma',
			confidence: 'medium',
			mode: 'on-device',
			provider: 'on-device-gemma',
			generatedAt: '2026-06-26T12:00:00.000Z',
			durationMs: 1200 + index,
			contextUsed: ['on-device-gemma'],
			receipts: toolInvocations.flatMap((record) => record.receipts),
			requiredConfirmations: [],
			safetyFlags: [],
			toolInvocations,
			toolExpectations: {
				required: testCase.requiredTools,
				hit: options.completeTools ? testCase.requiredTools : [],
				missing: options.completeTools ? [] : testCase.requiredTools
			},
			bridge: null,
			rating: null,
			reviewerNotes: '',
			failureMode: null,
			suggestedFailureCategories: ['bad-routing', 'weak-tool'],
			improvementTask: null
		};
	});
	const toolExpectationComplete = results.filter((result) => result.toolExpectations.missing.length === 0).length;
	const missingToolCounts = {};
	for (const result of results) {
		for (const missing of result.toolExpectations.missing) {
			missingToolCounts[missing] = (missingToolCounts[missing] ?? 0) + 1;
		}
	}
	return {
		schemaVersion: 1,
		runId: options.runId ?? 'device-smoke-run',
		suiteId: suite.suiteId,
		suiteTitle: suite.title,
		suiteVersion: options.suiteVersion ?? suite.version,
		suiteHash: options.suiteHash ?? scoutLocalAiSuiteHash(suite),
		suitePath: 'mobile/static/scout/dad-local-ai-100.json',
		generatedAt: '2026-06-26T12:00:00.000Z',
		evidenceLane: 'device-on-device-gemma',
		modelCommand: null,
		runContext: options.runContext ?? { surface: 'testflight-ios' },
		caseCount: results.length,
		totalSuiteCases: suite.cases.length,
		filters: { id: null, domain: null, phase: null, limit: results.length },
		ratingScale: suite.ratingScale,
		failureCategories: suite.failureCategories,
		summary: {
			toolExpectationComplete,
			missingToolCases: results.length - toolExpectationComplete,
			missingToolCounts,
			...summarizeRunSourceEvidence(results)
		},
		results
	};
}

function toolInvocationsFor(testCase) {
	return testCase.requiredTools.map((expectation) => {
		const [toolId, sourceSkill] = expectation.split(':');
		const receipt = {
			id: `test-receipt:${testCase.id}:${expectation}`,
			title: `Fixture receipt for ${expectation}`,
			kind: sourceSkill ? 'field-guide' : 'trail-pack',
			citation: `Fixture citation for ${testCase.id}`
		};
		return {
			toolId,
			args: sourceSkill ? { sourceSkill } : {},
			summary: `Fixture tool invocation for ${expectation}`,
			confidence: 'medium',
			receipts: [receipt],
			sourceDocumentIds: sourceSkill ? [`fixture-doc:${sourceSkill}`] : undefined
		};
	});
}

function reviewForRun(run, options = {}) {
	return {
		schemaVersion: 1,
		runId: run.runId,
		suiteId: run.suiteId,
		suiteVersion: run.suiteVersion,
		suiteHash: run.suiteHash,
		runPath: `${run.runId}.json`,
		evidenceLane: run.evidenceLane,
		ratingScale: run.ratingScale,
		failureCategories: run.failureCategories,
		cases: run.results.map((result) => ({
			caseId: result.caseId,
			domain: result.case.domain,
			phase: result.case.phase,
			prompt: result.case.prompt,
			answerOrigin: result.answerOrigin,
			expectedTraits: result.case.expectedTraits,
			safetyCaveats: result.case.safetyCaveats,
			traitChecks: rubricChecksFor(result.case.expectedTraits),
			safetyCaveatChecks: rubricChecksFor(result.case.safetyCaveats),
			toolExpectations: result.toolExpectations,
			safetyFlags: result.safetyFlags,
			requiredConfirmations: result.requiredConfirmations,
			answerPreview: result.answer.slice(0, 900),
			rating: options.rating ?? null,
			notes: '',
			failureCategories: [],
			improvementTask: '',
			ownerLayer: ''
		}))
	};
}

function rubricChecksFor(items) {
	return items.map((text) => ({
		text,
		passed: true,
		notes: ''
	}));
}

function replaceReviewerFields(packet, caseId, fields) {
	const headingPattern = new RegExp(`^## ${caseId} - .*$`, 'mu');
	const match = packet.match(headingPattern);
	assert.ok(match?.index !== undefined, `packet should contain ${caseId}`);
	const start = match.index;
	const nextHeading = packet.slice(start + match[0].length).search(/\n## DLA-\d{3} - /u);
	const end = nextHeading === -1 ? packet.length : start + match[0].length + nextHeading;
	let block = packet.slice(start, end);
	block = block
		.replace(/^- Rating:.*$/mu, `- Rating: ${fields.rating}`)
		.replace(/^- Notes:.*$/mu, `- Notes: ${fields.notes}`)
		.replace(/^- Failure categories:.*$/mu, `- Failure categories: ${fields.failureCategories}`)
		.replace(/^- Owner layer:.*$/mu, `- Owner layer: ${fields.ownerLayer}`)
		.replace(/^- Improvement task:.*$/mu, `- Improvement task: ${fields.improvementTask}`);
	return `${packet.slice(0, start)}${block}${packet.slice(end)}`;
}

function removeReviewCaseBlock(packet, caseId) {
	const headingPattern = new RegExp(`^## ${caseId} - .*$`, 'mu');
	const match = packet.match(headingPattern);
	assert.ok(match?.index !== undefined, `packet should contain ${caseId}`);
	const start = match.index;
	const nextHeading = packet.slice(start + match[0].length).search(/\n## DLA-\d{3} - /u);
	const end = nextHeading === -1 ? packet.length : start + match[0].length + nextHeading;
	const before = packet.slice(0, start).replace(/[ \t]*\n*$/u, '\n\n');
	const after = packet.slice(end).replace(/^\n+/u, '');
	return `${before}${after}`;
}
