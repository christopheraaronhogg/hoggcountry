import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { basename, dirname, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
	parseCliArgs,
	summarizeReview
} from './lib/scout-local-ai-review.mjs';

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(SCRIPT_DIR, '..');
const DEFAULT_OUTPUT_DIR = 'data/scout-local-ai/iterations';

const cli = parseCliArgs(process.argv.slice(2));
if (!cli.plan || !cli.run || !cli.review) {
	throw new Error([
		'Usage: npm run verify:scout-local-ai-iteration -- --plan data/scout-local-ai/iterations/<plan>.iteration.json --run data/scout-local-ai/runs/<rerun>.json --review data/scout-local-ai/reviews/<rerun>.review.json',
		'Optional: --require-full-suite --output-dir data/scout-local-ai/iterations --resolution-id pass-1-resolution'
	].join('\n'));
}

const planPath = resolveInputPath(cli.plan);
const runPath = resolveInputPath(cli.run);
const reviewPath = resolveInputPath(cli.review);
const outputDir = resolveInputPath(cli.outputDir ?? DEFAULT_OUTPUT_DIR);
const requireFullSuite = Boolean(cli.requireFullSuite);

const plan = JSON.parse(await readFile(planPath, 'utf8'));
const run = JSON.parse(await readFile(runPath, 'utf8'));
const review = JSON.parse(await readFile(reviewPath, 'utf8'));
const validationErrors = validateInputs({ plan, run, review, requireFullSuite });
if (validationErrors.length) {
	console.error('Scout local AI iteration verification failed validation:');
	for (const error of validationErrors.slice(0, 80)) console.error(`- ${error}`);
	if (validationErrors.length > 80) console.error(`- ... ${validationErrors.length - 80} more errors`);
	process.exit(1);
}

const resolution = createResolution({
	plan,
	run,
	review,
	planPath,
	runPath,
	reviewPath,
	requireFullSuite
});
const resolutionId = safeFileName(String(cli.resolutionId ?? `${plan.planId}-${run.runId}-resolution`));
const jsonPath = resolve(outputDir, `${resolutionId}.resolution.json`);
const markdownPath = resolve(outputDir, `${resolutionId}.resolution.md`);
await mkdir(outputDir, { recursive: true });
await writeFile(jsonPath, `${JSON.stringify(resolution, null, 2)}\n`);
await writeFile(markdownPath, createResolutionMarkdown(resolution));

if (resolution.status !== 'passed') {
	console.error('Scout local AI iteration verification failed.');
	console.error(`Resolution: ${relative(REPO_ROOT, jsonPath)}`);
	console.error(`Resolved planned cases: ${resolution.summary.resolvedPlannedCases}/${resolution.summary.plannedCases}`);
	console.error(`Unresolved planned cases: ${resolution.summary.unresolvedPlannedCases}`);
	console.error(`Below-5 review cases: ${resolution.summary.belowFive}`);
	process.exit(1);
}

console.log('Scout local AI iteration verification passed.');
console.log(`Resolution: ${relative(REPO_ROOT, jsonPath)}`);
console.log(`Markdown: ${relative(REPO_ROOT, markdownPath)}`);
console.log(`Resolved planned cases: ${resolution.summary.resolvedPlannedCases}/${resolution.summary.plannedCases}`);
console.log(`Below-5 review cases: ${resolution.summary.belowFive}`);

function validateInputs({ plan, run, review, requireFullSuite }) {
	const errors = [];
	if (plan.schemaVersion !== 1) errors.push('plan.schemaVersion must be 1.');
	if (!plan.planId) errors.push('plan.planId is required.');
	if (!Array.isArray(plan.regressionCaseIds)) errors.push('plan.regressionCaseIds must be an array.');
	if (!Array.isArray(plan.sourceBacklogs) || !plan.sourceBacklogs.length) errors.push('plan.sourceBacklogs must be a non-empty array.');

	if (run.schemaVersion !== 1) errors.push('run.schemaVersion must be 1.');
	if (!Array.isArray(run.results)) errors.push('run.results must be an array.');
	if (run.caseCount !== run.results?.length) errors.push(`run.caseCount ${run.caseCount ?? '<missing>'} does not match results length ${run.results?.length ?? '<missing>'}.`);

	if (review.schemaVersion !== 1) errors.push('review.schemaVersion must be 1.');
	if (review.runId !== run.runId) errors.push(`review.runId ${review.runId ?? '<missing>'} does not match ${run.runId ?? '<missing>'}.`);
	if (review.suiteId !== run.suiteId) errors.push(`review.suiteId ${review.suiteId ?? '<missing>'} does not match ${run.suiteId ?? '<missing>'}.`);
	if (!Array.isArray(review.cases)) errors.push('review.cases must be an array.');

	const sourceSuiteIds = new Set((plan.sourceBacklogs ?? []).map((backlog) => backlog.suiteId).filter(Boolean));
	if (sourceSuiteIds.size > 1) errors.push(`plan source backlogs disagree on suiteId: ${[...sourceSuiteIds].join(', ')}.`);
	const expectedSuiteId = [...sourceSuiteIds][0] ?? plan.suiteId;
	if (expectedSuiteId && run.suiteId !== expectedSuiteId) {
		errors.push(`run.suiteId ${run.suiteId ?? '<missing>'} does not match plan suite ${expectedSuiteId}.`);
	}
	if (requireFullSuite && run.caseCount !== run.totalSuiteCases) {
		errors.push(`--require-full-suite needs run.caseCount to equal run.totalSuiteCases; got ${run.caseCount}/${run.totalSuiteCases}.`);
	}
	if (requireFullSuite && review.cases?.length !== run.totalSuiteCases) {
		errors.push(`--require-full-suite needs review.cases to equal ${run.totalSuiteCases}; got ${review.cases?.length ?? '<missing>'}.`);
	}

	const summary = Array.isArray(review.cases) ? summarizeReview(review) : { invalid: [], unrated: 0 };
	errors.push(...summary.invalid);
	if (summary.unrated) errors.push(`review must be complete before closing an iteration; ${summary.unrated} cases are unrated.`);

	return errors;
}

function createResolution({ plan, run, review, planPath, runPath, reviewPath, requireFullSuite }) {
	const runById = new Map((run.results ?? []).map((result) => [result.caseId, result]));
	const reviewById = new Map((review.cases ?? []).map((entry) => [entry.caseId, entry]));
	const planned = plan.regressionCaseIds ?? [];
	const resolvedItems = [];
	const unresolvedItems = [];

	for (const caseId of planned) {
		const runResult = runById.get(caseId);
		const reviewCase = reviewById.get(caseId);
		const problems = [];
		if (!runResult) problems.push('case missing from rerun results');
		if (!reviewCase) problems.push('case missing from rerun review');
		if (reviewCase && reviewCase.rating !== 5) problems.push(`rating is ${reviewCase.rating ?? '<missing>'}, not 5`);
		if ((reviewCase?.failureCategories ?? []).length) problems.push('stale failureCategories remain on a planned 5/5 case');
		if (String(reviewCase?.improvementTask ?? '').trim()) problems.push('stale improvementTask remains on a planned 5/5 case');
		if ((runResult?.toolExpectations?.missing ?? []).length) {
			problems.push(`missing required tools: ${runResult.toolExpectations.missing.join(', ')}`);
		}

		const item = {
			caseId,
			rating: reviewCase?.rating ?? null,
			missingTools: runResult?.toolExpectations?.missing ?? [],
			answerOrigin: runResult?.answerOrigin ?? reviewCase?.answerOrigin ?? null,
			problems
		};
		if (problems.length) unresolvedItems.push(item);
		else resolvedItems.push(item);
	}

	const belowFiveItems = (review.cases ?? [])
		.filter((entry) => Number.isInteger(entry.rating) && entry.rating < 5)
		.map((entry) => ({
			caseId: entry.caseId,
			rating: entry.rating,
			inPlan: planned.includes(entry.caseId),
			failureCategories: entry.failureCategories ?? [],
			ownerLayer: entry.ownerLayer ?? '',
			improvementTask: entry.improvementTask ?? ''
		}));
	const staleClosedItems = (review.cases ?? [])
		.filter((entry) => entry.rating === 5 && ((entry.failureCategories ?? []).length || String(entry.improvementTask ?? '').trim()))
		.map((entry) => ({
			caseId: entry.caseId,
			inPlan: planned.includes(entry.caseId),
			failureCategories: entry.failureCategories ?? [],
			improvementTask: entry.improvementTask ?? ''
		}));
	const status = unresolvedItems.length || belowFiveItems.length || staleClosedItems.length ? 'failed' : 'passed';

	return {
		schemaVersion: 1,
		status,
		planId: plan.planId,
		generatedAt: new Date().toISOString(),
		requireFullSuite,
		sourcePlan: relative(REPO_ROOT, planPath),
		rerun: {
			runPath: relative(REPO_ROOT, runPath),
			reviewPath: relative(REPO_ROOT, reviewPath),
			runId: run.runId,
			suiteId: run.suiteId,
			evidenceLane: run.evidenceLane,
			caseCount: run.caseCount,
			totalSuiteCases: run.totalSuiteCases
		},
		summary: {
			plannedCases: planned.length,
			resolvedPlannedCases: resolvedItems.length,
			unresolvedPlannedCases: unresolvedItems.length,
			belowFive: belowFiveItems.length,
			staleClosedCases: staleClosedItems.length,
			reviewedCases: review.cases?.length ?? 0
		},
		resolvedItems,
		unresolvedItems,
		belowFiveItems,
		staleClosedItems,
		nextActions: status === 'passed'
			? [
				'Re-run the full 100-case suite if this was only a regression rerun.',
				'Create the next review backlog if any new full-suite answer is below 5.',
				'Run strict device proof only after a full device review is 100/100 at 5/5.'
			]
			: [
				'Do not close this iteration yet.',
				'Convert unresolved or new below-5 cases into a fresh review backlog and iteration plan.',
				'Fix the responsible layer before rerunning these regression cases.'
			]
	};
}

function createResolutionMarkdown(resolution) {
	const lines = [
		`# Scout local AI iteration resolution: ${resolution.planId}`,
		'',
		`Generated at: ${resolution.generatedAt}`,
		`Status: ${resolution.status}`,
		'',
		'## Inputs',
		'',
		`- Plan: \`${resolution.sourcePlan}\``,
		`- Rerun: \`${resolution.rerun.runPath}\``,
		`- Review: \`${resolution.rerun.reviewPath}\``,
		`- Evidence lane: \`${resolution.rerun.evidenceLane}\``,
		`- Cases: ${resolution.rerun.caseCount}/${resolution.rerun.totalSuiteCases}`,
		`- Require full suite: ${resolution.requireFullSuite ? 'yes' : 'no'}`,
		'',
		'## Summary',
		'',
		`- Resolved planned cases: ${resolution.summary.resolvedPlannedCases}/${resolution.summary.plannedCases}`,
		`- Unresolved planned cases: ${resolution.summary.unresolvedPlannedCases}`,
		`- Below-5 review cases: ${resolution.summary.belowFive}`,
		`- Stale closed cases: ${resolution.summary.staleClosedCases}`,
		''
	];
	if (resolution.unresolvedItems.length) {
		lines.push('## Unresolved planned cases', '');
		for (const item of resolution.unresolvedItems) {
			lines.push(
				`### ${item.caseId}`,
				'',
				`- Rating: ${item.rating ?? 'missing'}`,
				`- Missing tools: ${item.missingTools.join(', ') || 'none'}`,
				'',
				'Problems:',
				...item.problems.map((problem) => `- ${problem}`),
				''
			);
		}
	}
	if (resolution.belowFiveItems.length) {
		lines.push('## Below-5 review cases', '');
		for (const item of resolution.belowFiveItems) {
			lines.push(
				`### ${item.caseId} - ${item.rating}/5`,
				'',
				`- In iteration plan: ${item.inPlan ? 'yes' : 'no'}`,
				`- Owner layer: ${item.ownerLayer || 'unknown'}`,
				`- Failure categories: ${item.failureCategories.join(', ') || 'none'}`,
				'',
				'Improvement task:',
				'',
				quoteBlock(item.improvementTask || '(missing)'),
				''
			);
		}
	}
	if (resolution.staleClosedItems.length) {
		lines.push('## Stale 5/5 review metadata', '');
		for (const item of resolution.staleClosedItems) {
			lines.push(
				`### ${item.caseId}`,
				'',
				`- In iteration plan: ${item.inPlan ? 'yes' : 'no'}`,
				`- Failure categories: ${item.failureCategories.join(', ') || 'none'}`,
				`- Improvement task: ${item.improvementTask || 'none'}`,
				''
			);
		}
	}
	lines.push('## Next actions', '');
	for (const action of resolution.nextActions) lines.push(`- ${action}`);
	return `${lines.join('\n')}\n`;
}

function resolveInputPath(value) {
	const text = String(value);
	if (text === '~') return process.env.HOME ?? text;
	if (text.startsWith('~/')) return resolve(process.env.HOME ?? REPO_ROOT, text.slice(2));
	return resolve(REPO_ROOT, text);
}

function safeFileName(value) {
	return basename(String(value).replace(/[^A-Za-z0-9._-]/g, '-'));
}

function quoteBlock(value) {
	return String(value ?? '')
		.split('\n')
		.map((line) => `> ${line}`)
		.join('\n');
}
