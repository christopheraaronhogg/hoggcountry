import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { basename, dirname, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(SCRIPT_DIR, '..');
const REVIEW_DIR = resolve(REPO_ROOT, 'data/scout-local-ai/reviews');
const BACKLOG_DIR = resolve(REPO_ROOT, 'data/scout-local-ai/backlog');
const VALID_FAILURES = new Set(['missing-data', 'weak-tool', 'bad-routing', 'bad-prompt', 'unsafe-wording', 'poor-ux', 'local-model-limitation']);

const cli = parseArgs(process.argv.slice(2));
if (!cli.run) {
	throw new Error('Usage: npm run review:scout-local-ai -- --run data/scout-local-ai/runs/<run-id>.json [--review path]');
}

const runPath = resolve(REPO_ROOT, String(cli.run));
const run = JSON.parse(await readFile(runPath, 'utf8'));
const reviewPath = resolve(REPO_ROOT, String(cli.review ?? `data/scout-local-ai/reviews/${run.runId}.review.json`));

let review;
try {
	review = JSON.parse(await readFile(reviewPath, 'utf8'));
} catch {
	review = createReviewTemplate(run, runPath);
	await mkdir(REVIEW_DIR, { recursive: true });
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
const backlog = createBacklog(run, review, summary);
await mkdir(BACKLOG_DIR, { recursive: true });
const backlogPath = resolve(BACKLOG_DIR, `${run.runId}.backlog.json`);
await writeFile(backlogPath, `${JSON.stringify(backlog, null, 2)}\n`);

console.log(`Review loaded: ${relative(REPO_ROOT, reviewPath)}`);
console.log(`Backlog written: ${relative(REPO_ROOT, backlogPath)}`);
console.log(`Rated: ${summary.rated}/${summary.total}`);
console.log(`5/5: ${summary.ratingCounts['5'] ?? 0}`);
console.log(`Below 5: ${summary.belowFive}`);
console.log(`Unrated: ${summary.unrated}`);
if (summary.invalid.length) {
	console.log(`Invalid review entries: ${summary.invalid.length}`);
	for (const issue of summary.invalid.slice(0, 8)) console.log(`- ${issue}`);
}

function parseArgs(argv) {
	const parsed = {};
	for (let i = 0; i < argv.length; i += 1) {
		const arg = argv[i];
		if (!arg.startsWith('--')) continue;
		const [rawKey, inlineValue] = arg.slice(2).split('=', 2);
		const key = rawKey.replace(/-([a-z])/g, (_, char) => char.toUpperCase());
		if (inlineValue !== undefined) {
			parsed[key] = inlineValue;
			continue;
		}
		const next = argv[i + 1];
		if (next && !next.startsWith('--')) {
			parsed[key] = next;
			i += 1;
		} else {
			parsed[key] = true;
		}
	}
	return parsed;
}

function createReviewTemplate(run, runPath) {
	return {
		schemaVersion: 1,
		runId: run.runId,
		suiteId: run.suiteId,
		runPath: relative(REPO_ROOT, runPath),
		evidenceLane: run.evidenceLane,
		reviewInstructions: [
			'Rate each answer 1-5 using the run ratingScale.',
			'Only use 5 when the answer is Dad-ready, grounded, safe, and clear.',
			'For every rating below 5, fill failureCategories and improvementTask.',
			'Do not count scaffold-not-model runs as final local-AI proof.'
		],
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
			rating: null,
			notes: '',
			failureCategories: result.suggestedFailureCategories ?? [],
			improvementTask: '',
			ownerLayer: ''
		}))
	};
}

function summarizeReview(review) {
	const ratingCounts = {};
	const byDomain = {};
	const invalid = [];
	let rated = 0;
	let belowFive = 0;
	let unrated = 0;

	for (const entry of review.cases) {
		const rating = entry.rating;
		if (rating === null || rating === undefined || rating === '') {
			unrated += 1;
			continue;
		}
		if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
			invalid.push(`${entry.caseId}: rating must be an integer 1-5 or null.`);
			continue;
		}
		rated += 1;
		ratingCounts[String(rating)] = (ratingCounts[String(rating)] ?? 0) + 1;
		byDomain[entry.domain] ??= { rated: 0, belowFive: 0, average: 0, totalScore: 0 };
		byDomain[entry.domain].rated += 1;
		byDomain[entry.domain].totalScore += rating;
		byDomain[entry.domain].average = Number((byDomain[entry.domain].totalScore / byDomain[entry.domain].rated).toFixed(2));
		if (rating < 5) {
			belowFive += 1;
			if (!entry.improvementTask || !entry.improvementTask.trim()) {
				invalid.push(`${entry.caseId}: ratings below 5 need an improvementTask.`);
			}
			if (!Array.isArray(entry.failureCategories) || !entry.failureCategories.length) {
				invalid.push(`${entry.caseId}: ratings below 5 need at least one failure category.`);
			}
		}
		for (const category of entry.failureCategories ?? []) {
			if (!VALID_FAILURES.has(category)) {
				invalid.push(`${entry.caseId}: unknown failure category "${category}".`);
			}
		}
	}

	return {
		total: review.cases.length,
		rated,
		unrated,
		belowFive,
		ratingCounts,
		byDomain,
		invalid
	};
}

function createBacklog(run, review, summary) {
	const runResultsByCaseId = new Map(run.results.map((result) => [result.caseId, result]));
	const items = [];
	for (const entry of review.cases) {
		if (!Number.isInteger(entry.rating) || entry.rating >= 5) continue;
		const result = runResultsByCaseId.get(entry.caseId);
		items.push({
			id: `${run.runId}:${entry.caseId}`,
			caseId: entry.caseId,
			domain: entry.domain,
			phase: entry.phase,
			rating: entry.rating,
			prompt: entry.prompt,
			failureCategories: entry.failureCategories ?? [],
			ownerLayer: entry.ownerLayer || inferOwnerLayer(entry.failureCategories ?? [], result),
			improvementTask: entry.improvementTask,
			notes: entry.notes,
			missingTools: result?.toolExpectations?.missing ?? [],
			answerOrigin: entry.answerOrigin,
			evidenceLane: run.evidenceLane
		});
	}
	return {
		schemaVersion: 1,
		runId: run.runId,
		suiteId: run.suiteId,
		sourceReview: `data/scout-local-ai/reviews/${basename(run.runId)}.review.json`,
		generatedAt: new Date().toISOString(),
		summary,
		items
	};
}

function inferOwnerLayer(categories, result) {
	if (categories.includes('missing-data')) return 'data';
	if (categories.includes('weak-tool') || (result?.toolExpectations?.missing ?? []).length) return 'tool-routing';
	if (categories.includes('bad-prompt')) return 'prompt';
	if (categories.includes('unsafe-wording')) return 'safety-prompt';
	if (categories.includes('poor-ux')) return 'ui';
	if (categories.includes('local-model-limitation')) return 'local-model';
	return 'unknown';
}
