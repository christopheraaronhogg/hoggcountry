import { basename, relative } from 'node:path';

const VALID_FAILURES = new Set([
	'missing-data',
	'weak-tool',
	'bad-routing',
	'bad-prompt',
	'unsafe-wording',
	'poor-ux',
	'local-model-limitation'
]);

export function parseCliArgs(argv) {
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

export function createReviewTemplate(run, runPath, repoRoot) {
	return {
		schemaVersion: 1,
		runId: run.runId,
		suiteId: run.suiteId,
		runPath: relative(repoRoot, runPath),
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

export function summarizeReview(review) {
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

export function createBacklog(run, review, summary) {
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

export function inferOwnerLayer(categories, result) {
	if (categories.includes('missing-data')) return 'data';
	if (categories.includes('weak-tool') || (result?.toolExpectations?.missing ?? []).length) return 'tool-routing';
	if (categories.includes('bad-prompt')) return 'prompt';
	if (categories.includes('unsafe-wording')) return 'safety-prompt';
	if (categories.includes('poor-ux')) return 'ui';
	if (categories.includes('local-model-limitation')) return 'local-model';
	return 'unknown';
}
