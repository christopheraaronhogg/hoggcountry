import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';

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
	assert.match(component, />\s*Share\s*</u, 'Share action should be visible when a run exists');
	assert.match(component, />\s*Copy\s*</u, 'Copy action should be visible when a run exists');
	assert.match(component, />\s*Download\s*</u, 'Download action should remain available');
});

test('Dad local AI eval suite routes every case through expected Scout tools', async () => {
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
	assert.equal(run.summary.toolExpectationComplete, 100);
	assert.deepEqual(run.summary.missingToolCounts, {});
});

test('device run intake validates exports and creates review packet', async () => {
	const suite = JSON.parse(await readFile(SUITE_PATH, 'utf8'));
	const outputDir = await mkdtemp(join(tmpdir(), 'scout-local-ai-intake-'));
	const inputPath = join(outputDir, 'device-export.json');
	const run = deviceRunForCases(suite, suite.cases.slice(0, 2));
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
	assert.equal(review.cases.length, 2);
	assert.equal(review.cases[0].caseId, suite.cases[0].id);
	assert.match(review.cases[0].answerPreview, /device answer for/);
	assert.match(packet, /Scout local AI device review/u);
	assert.match(packet, new RegExp(suite.cases[0].id, 'u'));
	assert.match(packet, /Rating:/u);
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
	assert.equal(backlog.items[1].ownerLayer, 'tool-routing');
	assert.equal(backlog.summary.belowFive, 2);
	assert.match(markdown, /# Scout local AI iteration backlog: device-review-backlog/u);
	assert.match(markdown, /Owner layers/u);
	assert.match(markdown, /data: 1/u);
	assert.match(markdown, /tool-routing: 1/u);
	assert.match(markdown, /Add current-section water reliability source docs/u);
	assert.match(markdown, /Route onboarding\/offline setup prompts through the safety source docs/u);
	assert.doesNotMatch(markdown, new RegExp(`### ${review.cases[1].caseId}`, 'u'));
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
	review.cases[1].rating = 5;

	const runPath = join(outputDir, 'device-review-invalid.json');
	const reviewPath = join(outputDir, 'device-review-invalid.review.json');
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
			assert.match(error.stderr, /ratings below 5 need an improvementTask/u);
			assert.match(error.stderr, /ratings below 5 need at least one failure category/u);
			return true;
		}
	);
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
		runContext: { surface: 'mobile-settings-scout-eval-lab' }
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
	assert.match(proof, /Required-tool complete: 100\/100/u);
});

test('strict device proof rejects 5-star reviews with missing required tool hits', async () => {
	const suite = JSON.parse(await readFile(SUITE_PATH, 'utf8'));
	const outputDir = await mkdtemp(join(tmpdir(), 'scout-local-ai-proof-fail-'));
	const run = deviceRunForCases(suite, suite.cases, {
		runId: 'device-final-proof-fail',
		runContext: { surface: 'mobile-settings-scout-eval-lab' }
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

function deviceRunForCases(suite, cases, options = {}) {
	const results = cases.map((testCase, index) => ({
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
		receipts: [],
		requiredConfirmations: [],
		safetyFlags: [],
		toolInvocations: [],
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
	}));
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
			missingToolCounts
		},
		results
	};
}

function reviewForRun(run, options = {}) {
	return {
		schemaVersion: 1,
		runId: run.runId,
		suiteId: run.suiteId,
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
