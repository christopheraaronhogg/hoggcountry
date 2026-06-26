import { basename, relative } from 'node:path';
import {
	matchesToolExpectation,
	sourceEvidenceProblems
} from './scout-local-ai-source-evidence.mjs';

export const VALID_FAILURE_CATEGORIES = [
	'missing-data',
	'weak-tool',
	'bad-routing',
	'bad-prompt',
	'unsafe-wording',
	'poor-ux',
	'local-model-limitation'
];

export const VALID_OWNER_LAYERS = [
	'data',
	'tool-routing',
	'prompt',
	'safety-prompt',
	'ui',
	'local-model'
];

const VALID_FAILURES = new Set(VALID_FAILURE_CATEGORIES);
const FAILURE_CATEGORY_OWNER_LAYERS = {
	'missing-data': ['data'],
	'weak-tool': ['tool-routing'],
	'bad-routing': ['tool-routing'],
	'bad-prompt': ['prompt'],
	'unsafe-wording': ['safety-prompt'],
	'poor-ux': ['ui'],
	'local-model-limitation': ['local-model']
};
const IMPROVEMENT_ACTION_RE =
	/\b(add|adjust|build|cache|change|create|expose|fix|generate|improve|investigate|lead|record|refactor|remove|route|surface|teach|test|tighten|update|wire)\b/iu;
const VAGUE_IMPROVEMENT_TASKS = new Set([
	'fix',
	'fix it',
	'fix answer',
	'fix the answer',
	'improve',
	'improve answer',
	'improve the answer',
	'make better',
	'make it better',
	'needs work',
	'bad answer'
]);
const OVERFITTING_IMPROVEMENT_PATTERNS = [
	/\b(?:change|adjust|update|rewrite|edit|relax|loosen|remove|weaken)\b.{0,60}\b(?:expected\s+traits?|expectedtraits|safety\s+caveats?|rubric|rating\s+scale|review\s+checklist)\b/iu,
	/\b(?:change|adjust|update|rewrite|edit|relax|loosen|remove|weaken)\b.{0,60}\b(?:eval\s+(?:suite|case|question)|test\s+case|question\s+wording)\b/iu,
	/\b(?:mark|rate|accept)\b.{0,40}\b(?:answer|case|review)\b.{0,40}\b(?:5|five|passing|pass)\b/iu,
	/\bignore\b.{0,50}\b(?:missing\s+tools?|source\s+evidence|receipts?|unchecked\s+traits?|failed\s+caveats?)\b/iu
];

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
		suiteVersion: run.suiteVersion,
		suiteHash: run.suiteHash,
		runPath: relative(repoRoot, runPath),
		evidenceLane: run.evidenceLane,
		reviewInstructions: [
			'Rate each answer 1-5 using the run ratingScale.',
			'Only use 5 when the answer is Dad-ready, grounded, safe, and clear.',
			'For every 5, mark every traitChecks and safetyCaveatChecks item passed=true.',
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
			confidence: result.confidence,
			mode: result.mode,
			provider: result.provider,
			contextUsed: result.contextUsed ?? [],
			generatedAt: result.generatedAt ?? '',
			durationMs: result.durationMs ?? null,
			expectedTraits: result.case.expectedTraits ?? [],
			safetyCaveats: result.case.safetyCaveats ?? [],
			traitChecks: createRubricChecks(result.case.expectedTraits),
			safetyCaveatChecks: createRubricChecks(result.case.safetyCaveats),
			receipts: result.receipts ?? [],
			receiptCount: result.receipts?.length ?? 0,
			toolInvocations: result.toolInvocations ?? [],
			toolInvocationCount: result.toolInvocations?.length ?? 0,
			toolExpectations: result.toolExpectations,
			safetyFlags: result.safetyFlags,
			requiredConfirmations: result.requiredConfirmations,
			bridge: result.bridge ?? null,
			failureMode: result.failureMode,
			error: result.error ?? '',
			answer: result.answer ?? '',
			answerLength: String(result.answer ?? '').length,
			answerPreview: String(result.answer ?? '').slice(0, 900),
			rating: null,
			notes: '',
			failureCategories: suggestedFailureCategoriesForResult(result),
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
			} else {
				for (const problem of improvementTaskProblems(entry.improvementTask)) {
					invalid.push(`${entry.caseId}: ${problem}`);
				}
			}
			if (!Array.isArray(entry.failureCategories) || !entry.failureCategories.length) {
				invalid.push(`${entry.caseId}: ratings below 5 need at least one failure category.`);
			} else {
				for (const problem of ownerLayerProblems(entry.failureCategories, entry.ownerLayer)) {
					invalid.push(`${entry.caseId}: ${problem}`);
				}
			}
		}
		if (rating === 5) {
			if ((entry.failureCategories ?? []).length) {
				invalid.push(`${entry.caseId}: 5-star ratings must not keep failureCategories.`);
			}
			if (String(entry.ownerLayer ?? '').trim()) {
				invalid.push(`${entry.caseId}: 5-star ratings must not keep ownerLayer.`);
			}
			if (String(entry.improvementTask ?? '').trim()) {
				invalid.push(`${entry.caseId}: 5-star ratings must not keep an improvementTask.`);
			}
			for (const problem of rubricProblems(entry.traitChecks, entry.expectedTraits, 'traitChecks')) {
				invalid.push(`${entry.caseId}: ${problem}`);
			}
			for (const problem of rubricProblems(entry.safetyCaveatChecks, entry.safetyCaveats, 'safetyCaveatChecks')) {
				invalid.push(`${entry.caseId}: ${problem}`);
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

export function reviewRunEvidenceProblems(run, review) {
	const problems = [];
	if (!Array.isArray(run?.results) || !Array.isArray(review?.cases)) return problems;
	const runById = new Map(run.results.map((result) => [result.caseId, result]));

	for (const entry of review.cases) {
		if (entry.rating !== 5) continue;
		const result = runById.get(entry.caseId);
		if (!result) {
			problems.push(`${entry.caseId}: 5-star rating has no matching run result.`);
			continue;
		}
		const evidenceProblems = fiveStarRunEvidenceProblems(result);
		for (const problem of evidenceProblems) {
			problems.push(`${entry.caseId}: 5-star rating conflicts with run evidence; ${problem}`);
		}
	}

	return problems;
}

export function suggestedFailureCategoriesForResult(result) {
	const categories = [];
	const add = (category) => {
		if (VALID_FAILURES.has(category) && !categories.includes(category)) categories.push(category);
	};
	for (const category of result?.suggestedFailureCategories ?? []) add(category);
	if ((result?.toolExpectations?.missing ?? []).length) {
		add('bad-routing');
		add('weak-tool');
	}
	const sourceProblems = sourceEvidenceProblems(
		result?.case?.requiredTools ?? result?.toolExpectations?.required ?? [],
		result?.toolInvocations ?? []
	);
	if (sourceProblems.length) add('weak-tool');
	if (String(result?.error ?? '').trim() || String(result?.failureMode ?? '').includes('provider')) {
		add('local-model-limitation');
	}
	return categories;
}

export function reviewRunAlignmentProblems(run, review) {
	const problems = [];
	if (!run || typeof run !== 'object') return ['run JSON must be an object.'];
	if (!review || typeof review !== 'object') return ['review JSON must be an object.'];
	if (review.runId !== run.runId) {
		problems.push(`review.runId ${review.runId ?? '<missing>'} does not match run.runId ${run.runId ?? '<missing>'}.`);
	}
	if (review.suiteId !== run.suiteId) {
		problems.push(`review.suiteId ${review.suiteId ?? '<missing>'} does not match run.suiteId ${run.suiteId ?? '<missing>'}.`);
	}
	if (review.suiteVersion !== run.suiteVersion) {
		problems.push(`review.suiteVersion ${review.suiteVersion ?? '<missing>'} does not match run.suiteVersion ${run.suiteVersion ?? '<missing>'}.`);
	}
	if (review.suiteHash !== run.suiteHash) {
		problems.push(`review.suiteHash ${review.suiteHash ?? '<missing>'} does not match run.suiteHash ${run.suiteHash ?? '<missing>'}.`);
	}
	if (review.evidenceLane !== run.evidenceLane) {
		problems.push(`review.evidenceLane ${review.evidenceLane ?? '<missing>'} does not match run.evidenceLane ${run.evidenceLane ?? '<missing>'}.`);
	}
	if (!Array.isArray(run.results)) problems.push('run.results must be an array.');
	if (!Array.isArray(review.cases)) problems.push('review.cases must be an array.');
	if (!Array.isArray(run.results) || !Array.isArray(review.cases)) return problems;

	const runById = mapByCaseId(run.results, 'run.results', problems);
	const reviewById = mapByCaseId(review.cases, 'review.cases', problems);
	const missingReviewCases = [...runById.keys()].filter((caseId) => !reviewById.has(caseId));
	const extraReviewCases = [...reviewById.keys()].filter((caseId) => !runById.has(caseId));
	if (missingReviewCases.length) {
		problems.push(`review is missing ${missingReviewCases.length} run case(s): ${formatCaseList(missingReviewCases)}.`);
	}
	if (extraReviewCases.length) {
		problems.push(`review has ${extraReviewCases.length} case(s) not found in run results: ${formatCaseList(extraReviewCases)}.`);
	}

	for (const [caseId, result] of runById) {
		const reviewCase = reviewById.get(caseId);
		if (!reviewCase) continue;
		if (reviewCase.prompt !== result.case?.prompt) problems.push(`${caseId}: review prompt does not match run prompt.`);
		if (reviewCase.domain !== result.case?.domain) problems.push(`${caseId}: review domain does not match run domain.`);
		if (reviewCase.phase !== result.case?.phase) problems.push(`${caseId}: review phase does not match run phase.`);
		if (reviewCase.answerOrigin !== result.answerOrigin) {
			problems.push(`${caseId}: review answerOrigin ${reviewCase.answerOrigin ?? '<missing>'} does not match run answerOrigin ${result.answerOrigin ?? '<missing>'}.`);
		}
		if (!sameStringArray(reviewCase.expectedTraits, result.case?.expectedTraits ?? [])) {
			problems.push(`${caseId}: review expectedTraits do not match run case expectedTraits.`);
		}
		if (!sameStringArray(reviewCase.safetyCaveats, result.case?.safetyCaveats ?? [])) {
			problems.push(`${caseId}: review safetyCaveats do not match run case safetyCaveats.`);
		}
		if (!sameStringArray(reviewCase.toolExpectations?.required, result.toolExpectations?.required)) {
			problems.push(`${caseId}: review required tool expectations do not match run result.`);
		}
	}

	return problems;
}

export function improvementTaskProblems(task) {
	const text = String(task ?? '').trim();
	if (!text) return ['ratings below 5 need an improvementTask.'];
	const normalized = text.toLowerCase().replace(/\s+/gu, ' ');
	const wordCount = normalized.split(/\s+/u).filter(Boolean).length;
	const problems = [];
	if (VAGUE_IMPROVEMENT_TASKS.has(normalized) || wordCount < 6) {
		problems.push('improvementTask must be concrete enough for the next iteration.');
	}
	if (!IMPROVEMENT_ACTION_RE.test(text)) {
		problems.push('improvementTask must include an action verb such as add, fix, route, tighten, investigate, or improve.');
	}
	if (OVERFITTING_IMPROVEMENT_PATTERNS.some((pattern) => pattern.test(text))) {
		problems.push('improvementTask must target Scout behavior, data, tools, prompts, UI, or local-model runtime rather than weakening the eval rubric.');
	}
	return problems;
}

export function ownerLayerProblems(failureCategories, ownerLayer) {
	const normalizedOwner = String(ownerLayer ?? '').trim();
	if (!normalizedOwner) return [];
	const categories = Array.isArray(failureCategories)
		? failureCategories.filter((category) => VALID_FAILURES.has(category))
		: [];
	if (!categories.length) return [];
	const expectedLayers = [...new Set(categories.flatMap((category) => FAILURE_CATEGORY_OWNER_LAYERS[category] ?? []))];
	if (!expectedLayers.length || expectedLayers.includes(normalizedOwner)) return [];
	return [
		`ownerLayer ${normalizedOwner} does not match failureCategories ${categories.join(', ')}; expected one of ${expectedLayers.join(', ')}.`
	];
}

export function createBacklog(run, review, summary) {
	const runResultsByCaseId = new Map(run.results.map((result) => [result.caseId, result]));
	const items = [];
	const unratedItems = [];
	for (const entry of review.cases) {
		const result = runResultsByCaseId.get(entry.caseId);
		if (entry.rating === null || entry.rating === undefined || entry.rating === '') {
			unratedItems.push({
				caseId: entry.caseId,
				domain: entry.domain,
				phase: entry.phase,
				prompt: entry.prompt,
				requiredTools: result?.toolExpectations?.required ?? [],
				hitTools: result?.toolExpectations?.hit ?? [],
				missingTools: result?.toolExpectations?.missing ?? [],
				confidence: result?.confidence ?? null,
				failureMode: result?.failureMode ?? null,
				answerPreview: entry.answerPreview,
				answer: entry.answer ?? result?.answer ?? '',
				answerLength: entry.answerLength ?? String(entry.answer ?? result?.answer ?? '').length,
				toolInvocations: entry.toolInvocations ?? result?.toolInvocations ?? [],
				receipts: entry.receipts ?? result?.receipts ?? [],
				requiredConfirmations: entry.requiredConfirmations ?? result?.requiredConfirmations ?? [],
				safetyFlags: entry.safetyFlags ?? result?.safetyFlags ?? [],
				contextUsed: entry.contextUsed ?? result?.contextUsed ?? [],
				bridge: entry.bridge ?? result?.bridge ?? null,
				answerOrigin: entry.answerOrigin,
				evidenceLane: run.evidenceLane
			});
			continue;
		}
		if (!Number.isInteger(entry.rating) || entry.rating >= 5) continue;
		items.push({
			id: `${run.runId}:${entry.caseId}`,
			caseId: entry.caseId,
			domain: entry.domain,
			phase: entry.phase,
			rating: entry.rating,
			prompt: entry.prompt,
			expectedTraits: result?.case?.expectedTraits ?? [],
			safetyCaveats: result?.case?.safetyCaveats ?? [],
			failedTraits: failedRubricChecks(entry.traitChecks),
			failedSafetyCaveats: failedRubricChecks(entry.safetyCaveatChecks),
			failureCategories: entry.failureCategories ?? [],
			ownerLayer: entry.ownerLayer || inferOwnerLayer(entry.failureCategories ?? [], result),
			improvementTask: entry.improvementTask,
			notes: entry.notes,
			requiredTools: result?.toolExpectations?.required ?? [],
			hitTools: result?.toolExpectations?.hit ?? [],
			missingTools: result?.toolExpectations?.missing ?? [],
			confidence: result?.confidence ?? null,
			failureMode: result?.failureMode ?? null,
			requiredConfirmations: result?.requiredConfirmations ?? [],
			safetyFlags: result?.safetyFlags ?? [],
			answerPreview: entry.answerPreview,
			answer: entry.answer ?? result?.answer ?? '',
			answerLength: entry.answerLength ?? String(entry.answer ?? result?.answer ?? '').length,
			toolInvocations: entry.toolInvocations ?? result?.toolInvocations ?? [],
			receipts: entry.receipts ?? result?.receipts ?? [],
			contextUsed: entry.contextUsed ?? result?.contextUsed ?? [],
			bridge: entry.bridge ?? result?.bridge ?? null,
			answerOrigin: entry.answerOrigin,
			evidenceLane: run.evidenceLane
		});
	}
	return {
		schemaVersion: 1,
		runId: run.runId,
		suiteId: run.suiteId,
		suiteVersion: run.suiteVersion,
		suiteHash: run.suiteHash,
		evidenceLane: run.evidenceLane,
		sourceReview: `data/scout-local-ai/reviews/${basename(run.runId)}.review.json`,
		generatedAt: new Date().toISOString(),
		summary,
		unratedItems,
		items
	};
}

export function createBacklogMarkdown(backlog) {
	const ratingCounts = Object.entries(backlog.summary.ratingCounts)
		.sort(([left], [right]) => Number(left) - Number(right))
		.map(([rating, count]) => `- ${rating}/5: ${count}`);
	const ownerCounts = countBy(backlog.items, (item) => item.ownerLayer || 'unknown');
	const failureCounts = countBy(
		backlog.items.flatMap((item) => item.failureCategories.length ? item.failureCategories : ['uncategorized']),
		(item) => item
	);
	const lines = [
		`# Scout local AI iteration backlog: ${backlog.runId}`,
		'',
		`Generated at: ${backlog.generatedAt}`,
		`Evidence lane: \`${backlog.evidenceLane ?? backlog.items[0]?.evidenceLane ?? 'n/a'}\``,
		'',
		'## Review summary',
		'',
		`- Rated: ${backlog.summary.rated}/${backlog.summary.total}`,
		`- 5/5: ${backlog.summary.ratingCounts['5'] ?? 0}`,
		`- Below 5: ${backlog.summary.belowFive}`,
		`- Unrated: ${backlog.summary.unrated}`,
		'',
		'Rating counts:',
		'',
		...(ratingCounts.length ? ratingCounts : ['- none yet']),
		''
	];

	if (!backlog.items.length && backlog.summary.unrated === 0) {
		lines.push('## Items', '', 'All rated answers are currently 5/5. Re-run the strict device proof gate for final readiness.', '');
		return `${lines.join('\n')}\n`;
	}

	if (backlog.items.length) {
		lines.push('## Owner layers', '');
		for (const [owner, count] of ownerCounts) lines.push(`- ${owner}: ${count}`);
		lines.push('', '## Failure categories', '');
		for (const [category, count] of failureCounts) lines.push(`- ${category}: ${count}`);
		lines.push('', '## Items', '');
	} else {
		lines.push(
			'## Items',
			'',
			'No below-5 improvement tasks are available yet because the review is incomplete. Finish rating every case before treating this run as clean.',
			''
		);
	}

	for (const item of backlog.items) {
		lines.push(
			`### ${item.caseId} - ${item.domain} - ${item.rating}/5`,
			'',
			`- Owner layer: ${item.ownerLayer || 'unknown'}`,
			`- Failure categories: ${item.failureCategories.join(', ') || 'none'}`,
			`- Missing tools: ${item.missingTools.join(', ') || 'none'}`,
			`- Required tools: ${item.requiredTools.join(', ') || 'none'}`,
			`- Hit tools: ${item.hitTools.join(', ') || 'none'}`,
			`- Confidence: ${item.confidence ?? 'missing'}`,
			`- Failure mode: ${item.failureMode ?? 'none'}`,
			'',
			'Improvement task:',
			'',
			quoteBlock(item.improvementTask || '(missing improvement task)'),
			'',
			'Reviewer notes:',
			'',
			quoteBlock(item.notes || '(none)'),
			'',
			'Prompt:',
			'',
			quoteBlock(item.prompt),
			'',
			'Expected traits:',
			...item.expectedTraits.map((trait) => `- ${trait}`),
			'',
			'Failed or unchecked traits:',
			...(item.failedTraits?.length ? item.failedTraits.map((trait) => `- ${trait}`) : ['- none recorded']),
			'',
			'Safety caveats:',
			...item.safetyCaveats.map((caveat) => `- ${caveat}`),
			'',
			'Failed or unchecked safety caveats:',
			...(item.failedSafetyCaveats?.length ? item.failedSafetyCaveats.map((caveat) => `- ${caveat}`) : ['- none recorded']),
			'',
			'Answer preview:',
			'',
			quoteBlock(item.answerPreview || '(empty)'),
			'',
			'Full answer:',
			'',
			quoteBlock(item.answer || '(empty)'),
			'',
			'Recorded tool evidence:',
			...(item.toolInvocations?.length ? item.toolInvocations.map(formatToolEvidence) : ['- none recorded']),
			'',
			'Source receipts:',
			...(item.receipts?.length ? item.receipts.map(formatReceiptEvidence) : ['- none recorded']),
			''
		);
	}

	if (backlog.unratedItems?.length) {
		lines.push('## Unrated cases', '');
		for (const item of backlog.unratedItems) {
			lines.push(
				`### ${item.caseId} - ${item.domain}`,
				'',
				`- Required tools: ${item.requiredTools.join(', ') || 'none'}`,
				`- Hit tools: ${item.hitTools.join(', ') || 'none'}`,
				`- Missing tools: ${item.missingTools.join(', ') || 'none'}`,
				`- Confidence: ${item.confidence ?? 'missing'}`,
				`- Failure mode: ${item.failureMode ?? 'none'}`,
				'',
				'Prompt:',
				'',
				quoteBlock(item.prompt),
				'',
				'Answer preview:',
				'',
				quoteBlock(item.answerPreview || '(empty)'),
				'',
				'Full answer:',
				'',
				quoteBlock(item.answer || '(empty)'),
				''
			);
		}
	}

	return `${lines.join('\n')}\n`;
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

function createRubricChecks(values) {
	return (values ?? []).map((text) => ({
		text,
		passed: null,
		notes: ''
	}));
}

function rubricProblems(checks, expected, fieldName) {
	if (!Array.isArray(expected) || !expected.length) return [];
	if (!Array.isArray(checks)) return [`${fieldName} must be an array before rating 5.`];
	if (checks.length !== expected.length) {
		return [`${fieldName} must contain ${expected.length} items, got ${checks.length}.`];
	}
	const problems = [];
	for (const [index, expectedText] of expected.entries()) {
		const check = checks[index];
		if (check?.text !== expectedText) {
			problems.push(`${fieldName}[${index}].text must match the expected rubric text.`);
		}
		if (check?.passed !== true) {
			problems.push(`${fieldName}[${index}] must be passed=true before rating 5.`);
		}
	}
	return problems;
}

function failedRubricChecks(checks) {
	if (!Array.isArray(checks)) return [];
	return checks
		.filter((check) => check?.passed !== true)
		.map((check) => check?.text ?? '<missing rubric text>');
}

function fiveStarRunEvidenceProblems(result) {
	const problems = [];
	if (!String(result.answer ?? '').trim()) problems.push('answer is empty');
	if (result.error) problems.push(`run recorded provider error: ${result.error}`);
	const missingTools = result.toolExpectations?.missing;
	if (!Array.isArray(missingTools)) {
		problems.push('toolExpectations.missing is not recorded');
	} else if (missingTools.length) {
		problems.push(`missing required tools: ${missingTools.join(', ')}`);
	}
	const requiredTools = result.case?.requiredTools ?? result.toolExpectations?.required ?? [];
	if (requiredTools.length) {
		if (!Array.isArray(result.toolInvocations)) {
			problems.push('toolInvocations are not recorded');
		} else {
			const actualExpectations = evaluateToolExpectations(requiredTools, result.toolInvocations);
			if (actualExpectations.missing.length) {
				problems.push(`actual toolInvocations missed required tools: ${actualExpectations.missing.join(', ')}`);
			}
			for (const problem of sourceEvidenceProblems(requiredTools, result.toolInvocations)) {
				problems.push(problem.message);
			}
			if (
				Array.isArray(result.toolExpectations?.hit) &&
				!sameStringArray(result.toolExpectations.hit, actualExpectations.hit)
			) {
				problems.push('toolExpectations.hit does not match actual toolInvocations');
			}
		}
	}
	return problems;
}

function evaluateToolExpectations(requiredTools, invocations) {
	const hit = [];
	const missing = [];
	for (const expectation of requiredTools) {
		if (invocations.some((record) => matchesToolExpectation(expectation, record))) {
			hit.push(expectation);
		} else {
			missing.push(expectation);
		}
	}
	return { hit, missing };
}

function sameStringArray(left, right) {
	if (!Array.isArray(left) || !Array.isArray(right)) return false;
	if (left.length !== right.length) return false;
	return left.every((value, index) => value === right[index]);
}

function mapByCaseId(items, label, problems) {
	const mapped = new Map();
	for (const item of items) {
		if (!item?.caseId) {
			problems.push(`${label}: item missing caseId.`);
			continue;
		}
		if (mapped.has(item.caseId)) problems.push(`${label}: duplicate case ${item.caseId}.`);
		mapped.set(item.caseId, item);
	}
	return mapped;
}

function formatCaseList(caseIds) {
	const preview = caseIds.slice(0, 10).join(', ');
	const suffix = caseIds.length > 10 ? `, and ${caseIds.length - 10} more` : '';
	return `${preview}${suffix}`;
}

function countBy(items, keyFor) {
	const counts = new Map();
	for (const item of items) {
		const key = keyFor(item);
		counts.set(key, (counts.get(key) ?? 0) + 1);
	}
	return [...counts.entries()].sort(([left], [right]) => left.localeCompare(right));
}

function quoteBlock(value) {
	return String(value ?? '')
		.split('\n')
		.map((line) => `> ${line}`)
		.join('\n');
}

function formatToolEvidence(record) {
	const toolId = record?.toolId ?? '<missing-tool>';
	const confidence = record?.confidence ?? 'unknown';
	const summary = record?.summary ?? '(no summary)';
	const sourceDocs = record?.sourceDocumentIds?.length ? `; source docs: ${record.sourceDocumentIds.join(', ')}` : '';
	return `- ${toolId} (${confidence}): ${summary}${sourceDocs}`;
}

function formatReceiptEvidence(receipt) {
	const bits = [
		receipt?.id ?? '<missing-id>',
		receipt?.kind ? `kind=${receipt.kind}` : null,
		receipt?.title ?? null,
		receipt?.citation ?? null,
		receipt?.url ?? null
	].filter(Boolean);
	return `- ${bits.join(' - ')}`;
}
