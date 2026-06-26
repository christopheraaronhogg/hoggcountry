import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
	createBacklog,
	createBacklogMarkdown,
	createReviewTemplate,
	parseCliArgs,
	reviewRunEvidenceProblems,
	summarizeReview
} from './lib/scout-local-ai-review.mjs';

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(SCRIPT_DIR, '..');
const BACKLOG_DIR = resolve(REPO_ROOT, 'data/scout-local-ai/backlog');

const cli = parseCliArgs(process.argv.slice(2));
if (!cli.run) {
	throw new Error('Usage: npm run review:scout-local-ai -- --run data/scout-local-ai/runs/<run-id>.json [--review path]');
}

const runPath = resolve(REPO_ROOT, String(cli.run));
const run = JSON.parse(await readFile(runPath, 'utf8'));
const reviewPath = resolve(REPO_ROOT, String(cli.review ?? `data/scout-local-ai/reviews/${run.runId}.review.json`));
const backlogDir = resolveInputPath(cli.backlogDir ?? BACKLOG_DIR);
const allowUnrated = Boolean(cli.allowUnrated);

let review;
try {
	review = JSON.parse(await readFile(reviewPath, 'utf8'));
} catch {
	review = createReviewTemplate(run, runPath, REPO_ROOT);
	await mkdir(dirname(reviewPath), { recursive: true });
	await writeFile(reviewPath, `${JSON.stringify(review, null, 2)}\n`);
	console.log(`Review template created: ${relative(REPO_ROOT, reviewPath)}`);
	console.log('Fill rating 1-5, notes, failureCategories, and improvementTask for each case, then run this command again.');
	console.log(`Evidence lane: ${run.evidenceLane}`);
	if (run.evidenceLane === 'scaffold-not-model') {
		console.log('Warning: this run used scaffold answers. Use it to check routing/tool evidence, not final answer quality.');
	}
	process.exit(0);
}

const summary = summarizeReview(review);
const invalidEntries = [
	...summary.invalid,
	...reviewRunEvidenceProblems(run, review)
];
if (invalidEntries.length) {
	console.error('Review has invalid entries. Fix these before creating an iteration backlog:');
	for (const issue of invalidEntries.slice(0, 20)) console.error(`- ${issue}`);
	if (invalidEntries.length > 20) console.error(`- ... ${invalidEntries.length - 20} more`);
	process.exit(1);
}
if (summary.unrated && !allowUnrated) {
	console.error('Review is incomplete. Rate every case 1-5 before creating an iteration backlog.');
	const unrated = review.cases.filter((entry) => entry.rating === null || entry.rating === undefined || entry.rating === '');
	for (const entry of unrated.slice(0, 20)) console.error(`- ${entry.caseId}: missing rating`);
	if (unrated.length > 20) console.error(`- ... ${unrated.length - 20} more`);
	console.error('Use --allow-unrated only for a deliberately partial review status report.');
	process.exit(1);
}

const backlog = createBacklog(run, review, summary);
await mkdir(backlogDir, { recursive: true });
const backlogPath = resolve(backlogDir, `${run.runId}.backlog.json`);
const backlogMarkdownPath = resolve(backlogDir, `${run.runId}.backlog.md`);
await writeFile(backlogPath, `${JSON.stringify(backlog, null, 2)}\n`);
await writeFile(backlogMarkdownPath, createBacklogMarkdown(backlog));

console.log(`Review loaded: ${relative(REPO_ROOT, reviewPath)}`);
console.log(`Backlog written: ${relative(REPO_ROOT, backlogPath)}`);
console.log(`Iteration backlog written: ${relative(REPO_ROOT, backlogMarkdownPath)}`);
console.log(`Rated: ${summary.rated}/${summary.total}`);
console.log(`5/5: ${summary.ratingCounts['5'] ?? 0}`);
console.log(`Below 5: ${summary.belowFive}`);
console.log(`Unrated: ${summary.unrated}`);

function resolveInputPath(value) {
	const text = String(value);
	if (text === '~') return process.env.HOME ?? text;
	if (text.startsWith('~/')) return resolve(process.env.HOME ?? REPO_ROOT, text.slice(2));
	return resolve(REPO_ROOT, text);
}
