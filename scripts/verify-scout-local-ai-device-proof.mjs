import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
	parseCliArgs,
	summarizeReview
} from './lib/scout-local-ai-review.mjs';

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(SCRIPT_DIR, '..');
const DEFAULT_SUITE = 'data/scout-local-ai/dad-local-ai-100.json';
const DEFAULT_PROOF_DIR = 'data/scout-local-ai/final-proof';
const DEVICE_EVIDENCE_LANE = 'device-on-device-gemma';
const DEVICE_SURFACE = 'mobile-settings-scout-eval-lab';

const cli = parseCliArgs(process.argv.slice(2));

if (!cli.run || !cli.review) {
	throw new Error([
		'Usage: npm run verify:scout-local-ai-device-proof -- --run data/scout-local-ai/device-runs/<run>.json --review data/scout-local-ai/reviews/<run>.review.json',
		'Optional: --suite data/scout-local-ai/dad-local-ai-100.json --proof-out data/scout-local-ai/final-proof/<run>.proof.md'
	].join('\n'));
}

const suitePath = resolveInputPath(cli.suite ?? DEFAULT_SUITE);
const runPath = resolveInputPath(cli.run);
const reviewPath = resolveInputPath(cli.review);
const suite = JSON.parse(await readFile(suitePath, 'utf8'));
const run = JSON.parse(await readFile(runPath, 'utf8'));
const review = JSON.parse(await readFile(reviewPath, 'utf8'));
const result = verifyScoutLocalAiDeviceProof({ suite, run, review });

if (result.errors.length) {
	console.error('Scout local AI device proof failed:');
	for (const error of result.errors.slice(0, 60)) console.error(`- ${error}`);
	if (result.errors.length > 60) console.error(`- ... ${result.errors.length - 60} more errors`);
	process.exit(1);
}

const proofOut = cli.proofOut
	? resolveInputPath(cli.proofOut)
	: resolveInputPath(`${DEFAULT_PROOF_DIR}/${safeFileName(run.runId)}.proof.md`);
await mkdir(dirname(proofOut), { recursive: true });
await writeFile(
	proofOut,
	createProofMarkdown({
		suite,
		run,
		summary: result.summary,
		suitePath,
		runPath,
		reviewPath
	})
);

console.log('Scout local AI device proof passed.');
console.log(`Run: ${relative(REPO_ROOT, runPath)}`);
console.log(`Review: ${relative(REPO_ROOT, reviewPath)}`);
console.log(`Proof: ${relative(REPO_ROOT, proofOut)}`);
console.log(`5/5: ${result.summary.ratingCounts['5'] ?? 0}/${result.summary.total}`);
console.log(`Required-tool complete: ${run.summary?.toolExpectationComplete ?? 0}/${run.caseCount}`);

function verifyScoutLocalAiDeviceProof({ suite, run, review }) {
	const errors = [];
	const summary = summarizeReview(review);

	if (suite.schemaVersion !== 1) errors.push('suite.schemaVersion must be 1.');
	if (suite.suiteId !== 'dad-local-ai-100') errors.push(`suite.suiteId must be dad-local-ai-100, got ${suite.suiteId ?? '<missing>'}.`);
	if (!Array.isArray(suite.cases) || suite.cases.length !== 100) {
		errors.push(`suite must contain exactly 100 cases, got ${suite.cases?.length ?? '<missing>'}.`);
	}

	if (run.schemaVersion !== 1) errors.push('run.schemaVersion must be 1.');
	if (run.evidenceLane !== DEVICE_EVIDENCE_LANE) {
		errors.push(`run.evidenceLane must be ${DEVICE_EVIDENCE_LANE}, got ${run.evidenceLane ?? '<missing>'}.`);
	}
	if (run.runContext?.surface !== DEVICE_SURFACE) {
		errors.push(`run.runContext.surface must be ${DEVICE_SURFACE} for final TestFlight/iPhone proof, got ${run.runContext?.surface ?? '<missing>'}.`);
	}
	if (run.suiteId !== suite.suiteId) errors.push(`run.suiteId ${run.suiteId ?? '<missing>'} does not match ${suite.suiteId}.`);
	if (!Array.isArray(run.results)) errors.push('run.results must be an array.');
	if (run.caseCount !== suite.cases.length) errors.push(`run.caseCount ${run.caseCount ?? '<missing>'} must equal ${suite.cases.length}.`);
	if (run.totalSuiteCases !== suite.cases.length) {
		errors.push(`run.totalSuiteCases ${run.totalSuiteCases ?? '<missing>'} must equal ${suite.cases.length}.`);
	}
	if (run.filters?.limit !== null && run.filters?.limit !== undefined && run.filters.limit !== suite.cases.length) {
		errors.push(`run.filters.limit must be null or ${suite.cases.length}, got ${run.filters.limit}.`);
	}
	if ((run.summary?.toolExpectationComplete ?? -1) !== suite.cases.length) {
		errors.push(`run.summary.toolExpectationComplete must be ${suite.cases.length}, got ${run.summary?.toolExpectationComplete ?? '<missing>'}.`);
	}
	if ((run.summary?.missingToolCases ?? 0) !== 0) {
		errors.push(`run.summary.missingToolCases must be 0, got ${run.summary?.missingToolCases ?? '<missing>'}.`);
	}

	if (review.schemaVersion !== 1) errors.push('review.schemaVersion must be 1.');
	if (review.runId !== run.runId) errors.push(`review.runId ${review.runId ?? '<missing>'} does not match ${run.runId}.`);
	if (review.suiteId !== suite.suiteId) errors.push(`review.suiteId ${review.suiteId ?? '<missing>'} does not match ${suite.suiteId}.`);
	if (review.evidenceLane !== DEVICE_EVIDENCE_LANE) {
		errors.push(`review.evidenceLane must be ${DEVICE_EVIDENCE_LANE}, got ${review.evidenceLane ?? '<missing>'}.`);
	}
	if (!Array.isArray(review.cases)) errors.push('review.cases must be an array.');
	if (summary.invalid.length) errors.push(...summary.invalid);
	if (summary.total !== suite.cases.length) errors.push(`review must contain exactly ${suite.cases.length} cases, got ${summary.total}.`);
	if (summary.rated !== suite.cases.length) errors.push(`review.rated must be ${suite.cases.length}, got ${summary.rated}.`);
	if (summary.unrated !== 0) errors.push(`review.unrated must be 0, got ${summary.unrated}.`);
	if (summary.belowFive !== 0) errors.push(`review.belowFive must be 0, got ${summary.belowFive}.`);
	if ((summary.ratingCounts['5'] ?? 0) !== suite.cases.length) {
		errors.push(`review must have ${suite.cases.length} ratings of 5, got ${summary.ratingCounts['5'] ?? 0}.`);
	}

	const runById = mapByCaseId(run.results ?? [], 'run', errors);
	const reviewById = mapByCaseId(review.cases ?? [], 'review', errors);
	for (const testCase of suite.cases ?? []) {
		const runResult = runById.get(testCase.id);
		const reviewCase = reviewById.get(testCase.id);
		if (!runResult) {
			errors.push(`${testCase.id}: missing from run results.`);
			continue;
		}
		if (!reviewCase) errors.push(`${testCase.id}: missing from review cases.`);
		if (runResult.case?.prompt !== testCase.prompt) errors.push(`${testCase.id}: run prompt does not match canonical suite.`);
		if (!sameStringArray(runResult.case?.requiredTools, testCase.requiredTools)) {
			errors.push(`${testCase.id}: run requiredTools do not match canonical suite.`);
		}
		if (reviewCase?.prompt !== testCase.prompt) errors.push(`${testCase.id}: review prompt does not match canonical suite.`);
		if (runResult.answerOrigin !== DEVICE_EVIDENCE_LANE) {
			errors.push(`${testCase.id}: answerOrigin must be ${DEVICE_EVIDENCE_LANE}, got ${runResult.answerOrigin ?? '<missing>'}.`);
		}
		if (runResult.mode !== 'on-device') errors.push(`${testCase.id}: mode must be on-device, got ${runResult.mode ?? '<missing>'}.`);
		if (runResult.provider !== 'on-device-gemma') errors.push(`${testCase.id}: provider must be on-device-gemma, got ${runResult.provider ?? '<missing>'}.`);
		if (!String(runResult.answer ?? '').trim()) errors.push(`${testCase.id}: answer is empty.`);
		if (runResult.error) errors.push(`${testCase.id}: run recorded provider error: ${runResult.error}`);
		if (!runResult.toolExpectations || !Array.isArray(runResult.toolExpectations.missing)) {
			errors.push(`${testCase.id}: toolExpectations.missing is missing.`);
		} else if (runResult.toolExpectations.missing.length) {
			errors.push(`${testCase.id}: missing required tools: ${runResult.toolExpectations.missing.join(', ')}.`);
		}
		if (reviewCase?.answerOrigin !== DEVICE_EVIDENCE_LANE) {
			errors.push(`${testCase.id}: review answerOrigin must be ${DEVICE_EVIDENCE_LANE}, got ${reviewCase?.answerOrigin ?? '<missing>'}.`);
		}
		if (reviewCase?.rating !== 5) errors.push(`${testCase.id}: review rating must be 5, got ${reviewCase?.rating ?? '<missing>'}.`);
		if ((reviewCase?.failureCategories ?? []).length) {
			errors.push(`${testCase.id}: 5/5 final proof must not carry failureCategories.`);
		}
		if (String(reviewCase?.improvementTask ?? '').trim()) {
			errors.push(`${testCase.id}: 5/5 final proof must not carry an open improvementTask.`);
		}
	}

	return { errors, summary };
}

function createProofMarkdown({ suite, run, summary, suitePath, runPath, reviewPath }) {
	const checkedAt = new Date().toISOString();
	const domainLines = Object.entries(summary.byDomain)
		.sort(([left], [right]) => left.localeCompare(right))
		.map(([domain, stats]) => `- ${domain}: ${stats.rated} rated, average ${stats.average}, below 5 ${stats.belowFive}`);
	const lines = [
		`# Scout local AI final device proof: ${run.runId}`,
		'',
		`Checked at: ${checkedAt}`,
		'',
		'## Proof inputs',
		'',
		`- Suite: \`${relative(REPO_ROOT, suitePath)}\``,
		`- Device run: \`${relative(REPO_ROOT, runPath)}\``,
		`- Review: \`${relative(REPO_ROOT, reviewPath)}\``,
		`- Suite id: \`${suite.suiteId}\``,
		`- Evidence lane: \`${run.evidenceLane}\``,
		`- Device surface: \`${run.runContext?.surface}\``,
		'',
		'## Result',
		'',
		`- Cases: ${run.caseCount}/${run.totalSuiteCases}`,
		`- Ratings of 5: ${summary.ratingCounts['5'] ?? 0}/${summary.total}`,
		`- Below 5: ${summary.belowFive}`,
		`- Unrated: ${summary.unrated}`,
		`- Required-tool complete: ${run.summary?.toolExpectationComplete ?? 0}/${run.caseCount}`,
		'',
		'## Domain summary',
		'',
		...domainLines,
		'',
		'## Boundary',
		'',
		'This proof only covers the reviewed local Scout eval run from the installed iOS Eval Lab. Keep TestFlight/App Store Connect build proof, simulator/browser proof, and any future production release proof separate.'
	];
	return `${lines.join('\n')}\n`;
}

function mapByCaseId(items, label, errors) {
	const mapped = new Map();
	for (const item of items) {
		if (!item?.caseId) {
			errors.push(`${label}: item missing caseId.`);
			continue;
		}
		if (mapped.has(item.caseId)) errors.push(`${label}: duplicate case ${item.caseId}.`);
		mapped.set(item.caseId, item);
	}
	return mapped;
}

function resolveInputPath(value) {
	const text = String(value);
	if (text === '~') return process.env.HOME ?? text;
	if (text.startsWith('~/')) return resolve(process.env.HOME ?? REPO_ROOT, text.slice(2));
	return resolve(REPO_ROOT, text);
}

function safeFileName(value) {
	return String(value).replace(/[^A-Za-z0-9._-]/g, '-');
}

function sameStringArray(left, right) {
	if (!Array.isArray(left) || !Array.isArray(right)) return false;
	if (left.length !== right.length) return false;
	return left.every((value, index) => value === right[index]);
}
