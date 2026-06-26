import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
	createDeviceProofMarkdown,
	verifyScoutLocalAiDeviceProof
} from './lib/scout-local-ai-device-proof.mjs';
import {
	parseCliArgs
} from './lib/scout-local-ai-review.mjs';

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(SCRIPT_DIR, '..');
const DEFAULT_SUITE = 'data/scout-local-ai/dad-local-ai-100.json';
const DEFAULT_PROOF_DIR = 'data/scout-local-ai/final-proof';

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
	createDeviceProofMarkdown({
		suite,
		run,
		summary: result.summary,
		suitePath,
		runPath,
		reviewPath,
		repoRoot: REPO_ROOT
	})
);

console.log('Scout local AI device proof passed.');
console.log(`Run: ${relative(REPO_ROOT, runPath)}`);
console.log(`Review: ${relative(REPO_ROOT, reviewPath)}`);
console.log(`Proof: ${relative(REPO_ROOT, proofOut)}`);
console.log(`5/5: ${result.summary.ratingCounts['5'] ?? 0}/${result.summary.total}`);
console.log(`Required-tool complete: ${run.summary?.toolExpectationComplete ?? 0}/${run.caseCount}`);

function resolveInputPath(value) {
	const text = String(value);
	if (text === '~') return process.env.HOME ?? text;
	if (text.startsWith('~/')) return resolve(process.env.HOME ?? REPO_ROOT, text.slice(2));
	return resolve(REPO_ROOT, text);
}

function safeFileName(value) {
	return String(value).replace(/[^A-Za-z0-9._-]/g, '-');
}
