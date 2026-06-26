import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { mkdtemp, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';

const SUITE_PATH = new URL('../data/scout-local-ai/dad-local-ai-100.json', import.meta.url);
const MOBILE_SUITE_PATH = new URL('../mobile/static/scout/dad-local-ai-100.json', import.meta.url);
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
