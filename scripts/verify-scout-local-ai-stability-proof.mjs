import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
	verifyScoutLocalAiDeviceProof
} from './lib/scout-local-ai-device-proof.mjs';
import {
	parseCliArgs
} from './lib/scout-local-ai-review.mjs';

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(SCRIPT_DIR, '..');
const DEFAULT_SUITE = 'data/scout-local-ai/dad-local-ai-100.json';
const DEFAULT_PROOF_DIR = 'data/scout-local-ai/final-proof';
const DEFAULT_MIN_RUNS = 2;

const cli = parseCliArgs(process.argv.slice(2));
const pairs = parsePairs(cli);
const minRuns = Number(cli.minRuns ?? DEFAULT_MIN_RUNS);

if (!pairs.length) {
	throw new Error([
		'Usage: npm run verify:scout-local-ai-stability-proof -- --pairs data/scout-local-ai/device-runs/<run-a>.json:data/scout-local-ai/reviews/<run-a>.review.json,data/scout-local-ai/device-runs/<run-b>.json:data/scout-local-ai/reviews/<run-b>.review.json',
		'Optional: --suite data/scout-local-ai/dad-local-ai-100.json --min-runs 2 --proof-out data/scout-local-ai/final-proof/stability.proof.md',
		'Alternative: --runs run-a.json,run-b.json --reviews review-a.json,review-b.json'
	].join('\n'));
}
if (!Number.isInteger(minRuns) || minRuns < 2) {
	throw new Error(`--min-runs must be an integer of at least 2, got ${cli.minRuns ?? DEFAULT_MIN_RUNS}.`);
}

const suitePath = resolveInputPath(cli.suite ?? DEFAULT_SUITE);
const suite = JSON.parse(await readFile(suitePath, 'utf8'));
const records = [];
const errors = [];
const seenRunIds = new Map();

if (pairs.length < minRuns) {
	errors.push(`stability proof requires at least ${minRuns} distinct full device runs, got ${pairs.length}.`);
}

for (const [index, pair] of pairs.entries()) {
	const runPath = resolveInputPath(pair.run);
	const reviewPath = resolveInputPath(pair.review);
	const run = JSON.parse(await readFile(runPath, 'utf8'));
	const review = JSON.parse(await readFile(reviewPath, 'utf8'));
	const result = verifyScoutLocalAiDeviceProof({ suite, run, review });
	const label = `pair ${index + 1} (${relative(REPO_ROOT, runPath)})`;

	if (seenRunIds.has(run.runId)) {
		errors.push(`${label}: duplicate runId ${run.runId}; previous pair was ${seenRunIds.get(run.runId)}.`);
	} else {
		seenRunIds.set(run.runId, `pair ${index + 1}`);
	}
	if (result.errors.length) {
		for (const error of result.errors) errors.push(`${label}: ${error}`);
	}
	records.push({ runPath, reviewPath, run, review, result });
}

const perCaseRepeatedFive = countRepeatedFiveCases(suite, records);
if (perCaseRepeatedFive !== suite.cases.length) {
	errors.push(`per-case repeated 5/5 count must be ${suite.cases.length}, got ${perCaseRepeatedFive}.`);
}

if (errors.length) {
	console.error('Scout local AI stability proof failed:');
	for (const error of errors.slice(0, 80)) console.error(`- ${error}`);
	if (errors.length > 80) console.error(`- ... ${errors.length - 80} more errors`);
	process.exit(1);
}

const proofOut = cli.proofOut
	? resolveInputPath(cli.proofOut)
	: resolveInputPath(`${DEFAULT_PROOF_DIR}/stability-${safeFileName(suite.suiteId)}-${compactTimestamp(new Date())}.proof.md`);
await mkdir(dirname(proofOut), { recursive: true });
await writeFile(
	proofOut,
	createStabilityProofMarkdown({
		suite,
		suitePath,
		records,
		minRuns,
		perCaseRepeatedFive
	})
);

console.log('Scout local AI stability proof passed.');
console.log(`Runs: ${records.length}`);
console.log(`Suite: ${relative(REPO_ROOT, suitePath)}`);
console.log(`Proof: ${relative(REPO_ROOT, proofOut)}`);
console.log(`Per-case repeated 5/5: ${perCaseRepeatedFive}/${suite.cases.length}`);

function parsePairs(args) {
	if (args.pairs) {
		return String(args.pairs)
			.split(',')
			.map((pair) => pair.trim())
			.filter(Boolean)
			.map((pair) => {
				const [run, review, extra] = pair.split(':');
				if (!run || !review || extra !== undefined) throw new Error(`Invalid --pairs entry: ${pair}`);
				return { run, review };
			});
	}
	if (args.runs || args.reviews) {
		const runs = String(args.runs ?? '').split(',').map((item) => item.trim()).filter(Boolean);
		const reviews = String(args.reviews ?? '').split(',').map((item) => item.trim()).filter(Boolean);
		if (runs.length !== reviews.length) {
			throw new Error(`--runs and --reviews must contain the same number of comma-separated paths; got ${runs.length} runs and ${reviews.length} reviews.`);
		}
		return runs.map((run, index) => ({ run, review: reviews[index] }));
	}
	return [];
}

function countRepeatedFiveCases(suite, records) {
	let count = 0;
	for (const testCase of suite.cases) {
		if (records.every((record) => {
			const reviewCase = record.review.cases.find((entry) => entry.caseId === testCase.id);
			return reviewCase?.rating === 5;
		})) {
			count += 1;
		}
	}
	return count;
}

function createStabilityProofMarkdown({ suite, suitePath, records, minRuns, perCaseRepeatedFive }) {
	const checkedAt = new Date().toISOString();
	const lines = [
		'# Scout local AI stability proof',
		'',
		`Checked at: ${checkedAt}`,
		'',
		'## Proof inputs',
		'',
		`- Suite: \`${relative(REPO_ROOT, suitePath)}\``,
		`- Suite id: \`${suite.suiteId}\``,
		`- Required runs: ${minRuns}`,
		`- Reviewed runs: ${records.length}`,
		'',
		'## Result',
		'',
		`- Per-case repeated 5/5: ${perCaseRepeatedFive}/${suite.cases.length}`,
		`- Full device runs passing strict gate: ${records.length}/${records.length}`,
		`- Required-tool complete in every run: ${records.every((record) => record.run.summary?.toolExpectationComplete === suite.cases.length) ? 'yes' : 'no'}`,
		'',
		'## Runs',
		''
	];

	for (const [index, record] of records.entries()) {
		lines.push(
			`### Run ${index + 1}: ${record.run.runId}`,
			'',
			`- Device run: \`${relative(REPO_ROOT, record.runPath)}\``,
			`- Review: \`${relative(REPO_ROOT, record.reviewPath)}\``,
			`- Evidence lane: \`${record.run.evidenceLane}\``,
			`- Device surface: \`${record.run.runContext?.surface}\``,
			`- Cases: ${record.run.caseCount}/${record.run.totalSuiteCases}`,
			`- Ratings of 5: ${record.result.summary.ratingCounts['5'] ?? 0}/${record.result.summary.total}`,
			`- Required-tool complete: ${record.run.summary?.toolExpectationComplete ?? 0}/${record.run.caseCount}`,
			''
		);
	}

	lines.push(
		'## Boundary',
		'',
		'This proof covers repeated reviewed local Scout eval runs from the installed iOS Eval Lab. Keep TestFlight/App Store Connect build proof, simulator/browser proof, and any future production release proof separate.'
	);

	return `${lines.join('\n')}\n`;
}

function resolveInputPath(value) {
	const text = String(value);
	if (text === '~') return process.env.HOME ?? text;
	if (text.startsWith('~/')) return resolve(process.env.HOME ?? REPO_ROOT, text.slice(2));
	return resolve(REPO_ROOT, text);
}

function compactTimestamp(date) {
	return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/u, 'Z');
}

function safeFileName(value) {
	return String(value).replace(/[^A-Za-z0-9._-]/g, '-');
}
