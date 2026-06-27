import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
	createReviewTemplate,
	inferOwnerLayer,
	parseCliArgs,
	suggestedFailureCategoriesForResult,
	VALID_OWNER_LAYERS
} from './lib/scout-local-ai-review.mjs';
import {
	validateScoutLocalAiSuiteIdentity
} from './lib/scout-local-ai-suite.mjs';
import {
	validateScoutLocalAiDeviceRunContext
} from './lib/scout-local-ai-device-proof.mjs';
import {
	sourceEvidenceProblems,
	summarizeRunSourceEvidence
} from './lib/scout-local-ai-source-evidence.mjs';
import {
	readScoutEvalRunJson
} from './lib/scout-local-ai-run-json.mjs';

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(SCRIPT_DIR, '..');
const DEFAULT_SUITE = 'data/scout-local-ai/dad-local-ai-100.json';
const DEFAULT_DEVICE_RUN_DIR = 'data/scout-local-ai/device-runs';
const DEFAULT_REVIEW_DIR = 'data/scout-local-ai/reviews';
const DEFAULT_PACKET_DIR = 'data/scout-local-ai/review-packets';
const DEVICE_EVIDENCE_LANE = 'device-on-device-gemma';

const cli = parseCliArgs(process.argv.slice(2));
const input = cli.run ?? cli.input;

if (!input) {
	throw new Error([
		'Usage: npm run intake:scout-local-ai-device-run -- --run ~/Downloads/<device-export>.json',
		'Optional: --allow-partial for Run 3 smoke exports, --force to overwrite generated review files.'
	].join('\n'));
}

const inputPath = resolveInputPath(input);
const suitePath = resolveInputPath(cli.suite ?? DEFAULT_SUITE);
const deviceRunDir = resolveInputPath(cli.deviceRunDir ?? DEFAULT_DEVICE_RUN_DIR);
const reviewDir = resolveInputPath(cli.reviewDir ?? DEFAULT_REVIEW_DIR);
const packetDir = resolveInputPath(cli.packetDir ?? DEFAULT_PACKET_DIR);
const allowPartial = Boolean(cli.allowPartial);
const allowNonDevice = Boolean(cli.allowNonDevice);
const force = Boolean(cli.force);

const { run } = await readScoutEvalRunJson(inputPath);
const suite = JSON.parse(await readFile(suitePath, 'utf8'));
const validation = validateDeviceRun(run, suite, { allowPartial, allowNonDevice });

if (validation.errors.length) {
	console.error('Device run import failed validation:');
	for (const error of validation.errors) console.error(`- ${error}`);
	process.exit(1);
}

const safeRunId = safeFileName(run.runId);
const importedRunPath = resolve(deviceRunDir, `${safeRunId}.json`);
const reviewPath = resolve(reviewDir, `${safeRunId}.review.json`);
const packetPath = resolve(packetDir, `${safeRunId}.review.md`);

await writeJson(importedRunPath, run, { force });

const review = createReviewTemplate(run, importedRunPath, REPO_ROOT);
const reviewWritten = await writeJson(reviewPath, review, { force, skipExisting: true });
const packetWritten = await writeText(packetPath, createReviewPacket(run, validation, importedRunPath, reviewPath, packetPath), {
	force,
	skipExisting: true
});

console.log(`Device run imported: ${relative(REPO_ROOT, importedRunPath)}`);
console.log(`Review template ${reviewWritten ? 'created' : 'already exists'}: ${relative(REPO_ROOT, reviewPath)}`);
console.log(`Review packet ${packetWritten ? 'created' : 'already exists'}: ${relative(REPO_ROOT, packetPath)}`);
console.log(`Evidence lane: ${run.evidenceLane}`);
console.log(`Cases: ${run.caseCount}/${run.totalSuiteCases}`);
console.log(`Required-tool complete: ${run.summary?.toolExpectationComplete ?? 0}/${run.caseCount}`);
const sourceEvidenceSummary = summarizeRunSourceEvidence(run.results);
console.log(`Source-evidence complete: ${sourceEvidenceSummary.sourceEvidenceComplete}/${run.caseCount}`);
if (validation.warnings.length) {
	console.log(`Warnings: ${validation.warnings.length}`);
	for (const warning of validation.warnings.slice(0, 8)) console.log(`- ${warning}`);
}
console.log(`Progress check: npm run review-status:scout-local-ai -- --run ${relative(REPO_ROOT, importedRunPath)} --review ${relative(REPO_ROOT, reviewPath)} --packet ${relative(REPO_ROOT, packetPath)}`);
console.log(`Next focused card: npm run review-status:scout-local-ai -- --run ${relative(REPO_ROOT, importedRunPath)} --review ${relative(REPO_ROOT, reviewPath)} --packet ${relative(REPO_ROOT, packetPath)} --next`);
console.log('Batch helpers: the progress check prints Human-reviewed batch helpers when standard unrated cases can be grouped; use them only after reading every listed focused card.');
console.log(`Next: npm run review:scout-local-ai -- --run ${relative(REPO_ROOT, importedRunPath)} --review ${relative(REPO_ROOT, reviewPath)}`);

function validateDeviceRun(run, suite, options) {
	const errors = [];
	const warnings = [];

	if (!run || typeof run !== 'object') {
		return { errors: ['run JSON must be an object'], warnings };
	}
	if (run.schemaVersion !== 1) errors.push('run.schemaVersion must be 1');
	if (!run.runId || typeof run.runId !== 'string') errors.push('run.runId must be a string');
	if (run.suiteId !== suite.suiteId) errors.push(`run.suiteId ${run.suiteId ?? '<missing>'} does not match ${suite.suiteId}`);
	validateScoutLocalAiSuiteIdentity({ suite, run, errors });
	if (!Array.isArray(run.results)) errors.push('run.results must be an array');
	if (!run.failureCategories?.length) errors.push('run.failureCategories must be present');
	if (!run.ratingScale || typeof run.ratingScale !== 'object') errors.push('run.ratingScale must be present');
	if (!options.allowNonDevice && run.evidenceLane !== DEVICE_EVIDENCE_LANE) {
		errors.push(`run.evidenceLane must be ${DEVICE_EVIDENCE_LANE} for Dad device proof; got ${run.evidenceLane ?? '<missing>'}`);
	}
	if (errors.length) return { errors, warnings };

	const canonicalById = new Map(suite.cases.map((testCase) => [testCase.id, testCase]));
	const seen = new Set();
	for (const result of run.results) {
		if (!result?.caseId) {
			errors.push('each result must have caseId');
			continue;
		}
		if (seen.has(result.caseId)) errors.push(`${result.caseId}: duplicate result`);
		seen.add(result.caseId);

		const expectedCase = canonicalById.get(result.caseId);
		if (!expectedCase) {
			errors.push(`${result.caseId}: not found in canonical suite`);
			continue;
		}
		if (result.case?.prompt !== expectedCase.prompt) errors.push(`${result.caseId}: prompt does not match canonical suite`);
		if (!sameStringArray(result.case?.requiredTools, expectedCase.requiredTools)) {
			errors.push(`${result.caseId}: requiredTools do not match canonical suite`);
		}
		if (result.answerOrigin !== run.evidenceLane) {
			const message = `${result.caseId}: answerOrigin must match run.evidenceLane ${run.evidenceLane}, got ${result.answerOrigin ?? '<missing>'}`;
			if (options.allowNonDevice) warnings.push(message);
			else errors.push(message);
		}
		if (run.evidenceLane === DEVICE_EVIDENCE_LANE && result.mode !== 'on-device') {
			const message = `${result.caseId}: mode must be on-device for ${DEVICE_EVIDENCE_LANE}, got ${result.mode ?? '<missing>'}`;
			if (options.allowNonDevice) warnings.push(message);
			else errors.push(message);
		}
		if (run.evidenceLane === DEVICE_EVIDENCE_LANE && result.provider !== 'on-device-gemma') {
			const message = `${result.caseId}: provider must be on-device-gemma for ${DEVICE_EVIDENCE_LANE}, got ${result.provider ?? '<missing>'}`;
			if (options.allowNonDevice) warnings.push(message);
			else errors.push(message);
		}
		if (typeof result.answer !== 'string') errors.push(`${result.caseId}: answer must be a string`);
		if (!result.answer && !result.error) warnings.push(`${result.caseId}: answer is empty and no error was recorded`);
		if (!result.toolExpectations || !Array.isArray(result.toolExpectations.missing)) {
			errors.push(`${result.caseId}: toolExpectations.missing must be present`);
		}
		const evidence = resultEvidenceValidation(result, expectedCase);
		for (const problem of evidence.errors) errors.push(`${result.caseId}: ${problem}`);
		for (const warning of evidence.warnings) warnings.push(`${result.caseId}: ${warning}`);
	}

	if (run.caseCount !== run.results.length) {
		errors.push(`run.caseCount ${run.caseCount} does not match results length ${run.results.length}`);
	}
	if (run.totalSuiteCases !== suite.cases.length) {
		errors.push(`run.totalSuiteCases ${run.totalSuiteCases} does not match canonical suite length ${suite.cases.length}`);
	}

	const missingCanonical = suite.cases.filter((testCase) => !seen.has(testCase.id)).map((testCase) => testCase.id);
	if (!options.allowPartial && missingCanonical.length) {
		errors.push(`full device proof is missing ${missingCanonical.length} cases: ${missingCanonical.slice(0, 10).join(', ')}`);
	}
	if (options.allowPartial && missingCanonical.length) {
		warnings.push(`partial import missing ${missingCanonical.length} canonical cases`);
	}

	const recomputedComplete = run.results.filter((result) => result.toolExpectations?.missing?.length === 0).length;
	if (run.summary?.toolExpectationComplete !== recomputedComplete) {
		warnings.push(`summary.toolExpectationComplete ${run.summary?.toolExpectationComplete ?? '<missing>'} differs from recomputed ${recomputedComplete}`);
	}
	const sourceEvidenceSummary = summarizeRunSourceEvidence(run.results);
	if (
		run.summary?.sourceEvidenceComplete !== undefined &&
		run.summary.sourceEvidenceComplete !== sourceEvidenceSummary.sourceEvidenceComplete
	) {
		warnings.push(`summary.sourceEvidenceComplete ${run.summary.sourceEvidenceComplete} differs from recomputed ${sourceEvidenceSummary.sourceEvidenceComplete}`);
	}
	if (sourceEvidenceSummary.missingSourceEvidenceCases) {
		warnings.push(
			`source evidence missing for ${sourceEvidenceSummary.missingSourceEvidenceCases} case(s): ${formatSourceEvidenceCounts(sourceEvidenceSummary.missingSourceEvidenceCounts)}`
		);
	}

	const contextProblems = validateScoutLocalAiDeviceRunContext({ suite, run });
	if (run.evidenceLane === DEVICE_EVIDENCE_LANE && contextProblems.length) {
		if (options.allowPartial) {
			for (const problem of contextProblems) {
				warnings.push(`partial smoke export is not final Dad proof: ${problem}`);
			}
		} else if (!options.allowNonDevice) {
			errors.push(...contextProblems);
		}
	}

	return { errors, warnings };
}

function resultEvidenceValidation(result, expectedCase) {
	const errors = [];
	const warnings = [];
	const invocations = result.toolInvocations;
	if (!Array.isArray(invocations)) {
		errors.push('toolInvocations must be recorded for device proof');
		return { errors, warnings };
	}
	const actualExpectations = evaluateToolExpectations(expectedCase.requiredTools, invocations);
	if (actualExpectations.missing.length) {
		warnings.push(`actual toolInvocations missed required tools: ${actualExpectations.missing.join(', ')}`);
	}
	if (!sameStringArray(result.toolExpectations?.hit, actualExpectations.hit)) {
		errors.push('toolExpectations.hit does not match actual toolInvocations');
	}
	if (!sameStringArray(result.toolExpectations?.missing, actualExpectations.missing)) {
		errors.push(`toolExpectations.missing does not match actual toolInvocations; actual missing: ${actualExpectations.missing.join(', ') || 'none'}`);
	}
	for (const problem of sourceEvidenceProblems(expectedCase.requiredTools, invocations)) {
		warnings.push(problem.message);
	}
	return { errors, warnings };
}

function evaluateToolExpectations(requiredTools, invocations) {
	const hit = [];
	const missing = [];
	for (const expectation of requiredTools ?? []) {
		if ((invocations ?? []).some((record) => matchesToolExpectation(expectation, record))) {
			hit.push(expectation);
		} else {
			missing.push(expectation);
		}
	}
	return { hit, missing };
}

function matchesToolExpectation(expectation, record) {
	const [toolId, sourceSkill] = String(expectation).split(':');
	if (record?.toolId !== toolId) return false;
	if (!sourceSkill) return true;
	return String(record.args?.sourceSkill ?? '').toLowerCase() === sourceSkill.toLowerCase();
}

function createReviewPacket(run, validation, importedRunPath, reviewPath, packetPath) {
	const sourceEvidenceSummary = summarizeRunSourceEvidence(run.results);
	const lines = [
		`# Scout local AI device review: ${run.runId}`,
		'',
		`Imported run: \`${relative(REPO_ROOT, importedRunPath)}\``,
		`Review JSON: \`${relative(REPO_ROOT, reviewPath)}\``,
		`Evidence lane: \`${run.evidenceLane}\``,
		`Suite version: \`${run.suiteVersion ?? '<missing>'}\``,
		`Suite hash: \`${run.suiteHash ?? '<missing>'}\``,
		`Cases: ${run.caseCount}/${run.totalSuiteCases}`,
		`Required-tool complete: ${run.summary?.toolExpectationComplete ?? 0}/${run.caseCount}`,
		`Source-evidence complete: ${sourceEvidenceSummary.sourceEvidenceComplete}/${run.caseCount}`,
		'',
		'Use this packet for human reading. Fill the checklist passed values and Reviewer fields here, then apply it back into the review JSON before running the review/backlog command.',
		'',
		'## Rating scale',
		'',
		...formatRatingScale(run.ratingScale),
		'',
		'## Reviewer field choices',
		'',
		'For a 5/5 rating, every trait/safety-caveat checklist item must be `passed: true`, every required-confirmation/safety-flag checklist item must be `acknowledged: true`, and Failure categories, Owner layer, and Improvement task should stay blank. For any rating below 5, choose at least one failure category, choose the owner layer that should be fixed, and write a concrete improvement task with an action verb and a specific Scout target, such as `Add current-section water reliability source docs.` Do not use the improvement task to weaken the eval rubric, expected traits, or question wording.',
		'',
		`Valid failure categories: ${(run.failureCategories ?? []).join(', ')}`,
		`Valid owner layers: ${VALID_OWNER_LAYERS.join(', ')}`,
		'',
		'After filling this packet, run:',
		'',
		'```sh',
		`npm run apply-review:scout-local-ai -- --packet ${relative(REPO_ROOT, packetPath)} --review ${relative(REPO_ROOT, reviewPath)}`,
		'```',
		'',
		'Preview draft packet progress any time without writing review JSON or backlog files:',
		'',
		'```sh',
		`npm run review-status:scout-local-ai -- --run ${relative(REPO_ROOT, importedRunPath)} --review ${relative(REPO_ROOT, reviewPath)} --packet ${relative(REPO_ROOT, packetPath)}`,
		'```',
		'',
		'Open the next unrated answer as a focused review card:',
		'',
		'```sh',
		`npm run review-status:scout-local-ai -- --run ${relative(REPO_ROOT, importedRunPath)} --review ${relative(REPO_ROOT, reviewPath)} --packet ${relative(REPO_ROOT, packetPath)} --next`,
		'```',
		'',
		'The progress check may also print Human-reviewed batch helpers for standard unrated cases. Treat those as reading groups only: read every listed focused card first, then use the printed `rate-case --cases ...` command only when each answer honestly earned 5/5.',
		'',
		'Then validate complete ratings and run the safe next step. A below-5 review writes both an iteration backlog and an iteration plan; a full 100/100 5-star TestFlight/iPhone review runs strict device proof:',
		'',
		'```sh',
		`npm run finalize-review:scout-local-ai -- --packet ${relative(REPO_ROOT, packetPath)} --run ${relative(REPO_ROOT, importedRunPath)} --review ${relative(REPO_ROOT, reviewPath)}`,
		'```',
		''
	];

	if (validation.warnings.length) {
		lines.push('## Import warnings', '');
		for (const warning of validation.warnings) lines.push(`- ${warning}`);
		lines.push('');
	}

	lines.push(
		'## Review-first triage',
		'',
		'Use this as the first pass before reading all 100 answers. It only counts rows with hard evidence issues: provider errors, missing required tools, or missing source evidence.',
		'',
		...formatReviewFirstTriage(run.results),
		'',
		'## Review queue summary',
		'',
		'Start with `review-first` rows. Those rows have provider errors, missing required tools, or missing source evidence. The full case blocks below remain the source of truth for ratings.',
		'',
		...formatReviewQueueSummary(run.results),
		''
	);

	for (const result of run.results) {
		const suggestedFailureCategories = suggestedFailureCategoriesForResult(result);
		const suggestedOwnerLayer = inferOwnerLayer(suggestedFailureCategories, result);
		const sourceEvidenceGaps = sourceEvidenceProblems(result.case?.requiredTools ?? [], result.toolInvocations ?? []);
		lines.push(
			`## ${result.caseId} - ${result.case.domain}`,
			'',
			`Phase: \`${result.case.phase}\`  `,
			`Mile: \`${result.case.mile}\`  `,
			`Answer origin: \`${result.answerOrigin}\`  `,
			`Confidence: \`${result.confidence ?? '<missing>'}\`  `,
			`Mode/provider: \`${result.mode ?? '<missing>'} / ${result.provider ?? '<missing>'}\`  `,
			`Duration: \`${result.durationMs}ms\``,
			`Failure mode: \`${result.failureMode ?? 'none'}\``,
			`Suggested failure categories: \`${suggestedFailureCategories.join(', ') || 'none'}\`  `,
			`Suggested owner layer: \`${suggestedOwnerLayer}\``,
			'',
			'Prompt:',
			'',
			quoteBlock(result.case.prompt),
			'',
			'Expected traits:',
			...result.case.expectedTraits.map((trait) => `- ${trait}`),
			'',
			'Trait checklist to fill in review JSON:',
			...formatRubricChecklist(result.case.expectedTraits),
			'',
			'Safety caveats:',
			...result.case.safetyCaveats.map((caveat) => `- ${caveat}`),
			'',
			'Safety caveat checklist to fill in review JSON:',
			...formatRubricChecklist(result.case.safetyCaveats),
			'',
			'Tool expectations:',
			`- Required: ${(result.toolExpectations?.required ?? []).join(', ') || 'none'}`,
			`- Hit: ${(result.toolExpectations?.hit ?? []).join(', ') || 'none'}`,
			`- Missing: ${(result.toolExpectations?.missing ?? []).join(', ') || 'none'}`,
			'',
			'Tool invocations:',
			...formatToolInvocations(result.toolInvocations),
			'',
			'Source evidence gaps:',
			...(sourceEvidenceGaps.length ? sourceEvidenceGaps.map((problem) => `- ${problem.message}`) : ['- none']),
			'',
			'Source receipts:',
			...formatReceipts(result.receipts),
			'',
			'Required confirmations:',
			...formatConfirmations(result.requiredConfirmations),
			'',
			'Required confirmation acknowledgement checklist to fill in review JSON:',
			...formatSignalChecklist(result.requiredConfirmations, confirmationReviewText),
			'',
			'Safety flags:',
			...formatSafetyFlags(result.safetyFlags),
			'',
			'Safety flag acknowledgement checklist to fill in review JSON:',
			...formatSignalChecklist(result.safetyFlags, safetyFlagReviewText),
			'',
			'Context used:',
			...formatStringList(result.contextUsed),
			'',
			'Answer:',
			'',
			result.answer ? quoteBlock(result.answer) : quoteBlock(result.error ? `ERROR: ${result.error}` : '(empty answer)'),
			'',
			'Reviewer fields:',
			'',
			'- Rating: ',
			'- Notes: ',
			'- Failure categories: ',
			'- Owner layer: ',
			'- Improvement task: ',
			''
		);
	}

	return `${lines.join('\n')}\n`;
}

function formatReviewFirstTriage(results) {
	if (!Array.isArray(results) || !results.length) return ['No results were imported.'];
	const reviewFirst = [];
	for (const result of results) {
		const sourceEvidenceGaps = sourceEvidenceProblems(result.case?.requiredTools ?? [], result.toolInvocations ?? []);
		const signal = reviewQueueSignal(result, sourceEvidenceGaps);
		if (!signal.startsWith('review-first')) continue;
		const suggestedFailureCategories = suggestedFailureCategoriesForResult(result);
		const suggestedOwnerLayer = inferOwnerLayer(suggestedFailureCategories, result);
		reviewFirst.push({
			result,
			sourceEvidenceGaps,
			signal,
			suggestedFailureCategories,
			suggestedOwnerLayer
		});
	}

	if (!reviewFirst.length) {
		return [
			`- Review-first cases: 0/${results.length}`,
			'- Signals: none',
			'- Likely owner layers: none',
			'- Suggested failure categories: none',
			'- Missing tools: none',
			'- Source-evidence gaps: none',
			'',
			'No hard evidence issues were recorded before human rating. Continue through the full review queue for answer quality, clarity, safety, and prompt fit.'
		];
	}

	return [
		`- Review-first cases: ${reviewFirst.length}/${results.length}`,
		`- Signals: ${formatCountMap(countBy(reviewFirst, (item) => item.signal))}`,
		`- Likely owner layers: ${formatCountMap(countBy(reviewFirst, (item) => item.suggestedOwnerLayer || 'unknown'))}`,
		`- Suggested failure categories: ${formatCountMap(countBy(reviewFirst.flatMap((item) => item.suggestedFailureCategories.length ? item.suggestedFailureCategories : ['none']), (item) => item))}`,
		`- Missing tools: ${formatCountMap(countBy(reviewFirst.flatMap((item) => item.result.toolExpectations?.missing ?? []), (item) => item))}`,
		`- Source-evidence gaps: ${formatCountMap(countBy(reviewFirst.flatMap((item) => item.sourceEvidenceGaps.map((problem) => problem.expectation ?? problem.message)), (item) => item))}`,
		'',
		'Top review-first cases:',
		...reviewFirst.slice(0, 8).map((item) => {
			const result = item.result;
			return `- ${result.caseId ?? '<missing>'}: ${item.signal}; likely owner ${item.suggestedOwnerLayer}; gaps ${formatReviewQueueEvidenceGaps(result, item.sourceEvidenceGaps)}`;
		})
	];
}

function formatReviewQueueSummary(results) {
	if (!Array.isArray(results) || !results.length) return ['No results were imported.'];
	const rows = [
		'| Case | Phase | Domain | Signal | Likely owner | Suggested categories | Evidence gaps | Prompt preview |',
		'| --- | --- | --- | --- | --- | --- | --- | --- |'
	];
	for (const result of results) {
		const suggestedFailureCategories = suggestedFailureCategoriesForResult(result);
		const suggestedOwnerLayer = inferOwnerLayer(suggestedFailureCategories, result);
		const sourceEvidenceGaps = sourceEvidenceProblems(result.case?.requiredTools ?? [], result.toolInvocations ?? []);
		rows.push([
			result.caseId ?? '<missing>',
			result.case?.phase ?? '<missing>',
			result.case?.domain ?? '<missing>',
			reviewQueueSignal(result, sourceEvidenceGaps),
			suggestedOwnerLayer,
			suggestedFailureCategories.join(', ') || 'none',
			formatReviewQueueEvidenceGaps(result, sourceEvidenceGaps),
			truncateForTable(result.case?.prompt ?? '', 110)
		].map(tableCell).join(' | ').replace(/^/u, '| ').replace(/$/u, ' |'));
	}
	return rows;
}

function reviewQueueSignal(result, sourceEvidenceGaps) {
	if (String(result?.error ?? '').trim()) return 'review-first: provider error';
	if ((result?.toolExpectations?.missing ?? []).length) return 'review-first: missing required tools';
	if (sourceEvidenceGaps.length) return 'review-first: source evidence gap';
	return 'standard';
}

function formatReviewQueueEvidenceGaps(result, sourceEvidenceGaps) {
	const gaps = [];
	if ((result?.toolExpectations?.missing ?? []).length) {
		gaps.push(`missing tools: ${result.toolExpectations.missing.join(', ')}`);
	}
	if (sourceEvidenceGaps.length) {
		gaps.push(`source evidence: ${sourceEvidenceGaps.map((problem) => problem.expectation ?? problem.message).join(', ')}`);
	}
	if (String(result?.error ?? '').trim()) gaps.push(`error: ${truncateForTable(result.error, 80)}`);
	return gaps.join('; ') || 'none';
}

function formatSourceEvidenceCounts(counts) {
	const entries = Object.entries(counts ?? {}).sort(([left], [right]) => left.localeCompare(right));
	if (!entries.length) return 'none';
	return entries.map(([expectation, count]) => `${expectation}=${count}`).join(', ');
}

function countBy(items, keyFor) {
	const counts = {};
	for (const item of items ?? []) {
		const key = String(keyFor(item) ?? '').trim();
		if (!key) continue;
		counts[key] = (counts[key] ?? 0) + 1;
	}
	return Object.fromEntries(
		Object.entries(counts).sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))
	);
}

function formatCountMap(counts) {
	const entries = Object.entries(counts ?? {});
	if (!entries.length) return 'none';
	return entries.map(([key, count]) => `${key}=${count}`).join(', ');
}

function formatRatingScale(ratingScale) {
	const entries = Object.entries(ratingScale ?? {})
		.sort(([left], [right]) => Number(left) - Number(right));
	if (!entries.length) return ['- 1-5; use 5 only for a Dad-ready, grounded, safe answer.'];
	return entries.map(([rating, label]) => `- ${rating}: ${label}`);
}

function formatToolInvocations(invocations) {
	if (!Array.isArray(invocations) || !invocations.length) return ['- none recorded'];
	return invocations.flatMap((record, index) => {
		const lines = [
			`- ${index + 1}. \`${record.toolId ?? '<missing>'}\` (${record.confidence ?? 'unknown'}): ${record.summary ?? '(no summary)'}`,
			`  - Args: \`${compactJson(record.args ?? {})}\``
		];
		if (record.sourceDocumentIds?.length) lines.push(`  - Source docs: ${record.sourceDocumentIds.join(', ')}`);
		if (record.receipts?.length) lines.push(`  - Receipts: ${record.receipts.map(formatReceiptInline).join(' | ')}`);
		if (record.confirmations?.length) lines.push(`  - Confirmations: ${record.confirmations.map((item) => item.id ?? item.reason ?? 'confirmation').join(', ')}`);
		if (record.safetyFlags?.length) lines.push(`  - Safety flags: ${record.safetyFlags.map((item) => item.id ?? item.severity ?? 'flag').join(', ')}`);
		return lines;
	});
}

function formatRubricChecklist(items) {
	if (!Array.isArray(items) || !items.length) return ['- none'];
	return items.map((item) => `- passed: null | text: ${item} | notes:`);
}

function formatSignalChecklist(items, textFor) {
	if (!Array.isArray(items) || !items.length) return ['- none'];
	return items.map((item) => `- acknowledged: null | text: ${textFor(item)} | notes:`);
}

function formatReceipts(receipts) {
	if (!Array.isArray(receipts) || !receipts.length) return ['- none recorded'];
	return receipts.map((receipt) => `- ${formatReceiptInline(receipt)}`);
}

function formatReceiptInline(receipt) {
	const bits = [
		receipt.id ?? '<missing-id>',
		receipt.kind ? `kind=${receipt.kind}` : null,
		receipt.title ?? null,
		receipt.citation ?? null,
		receipt.url ?? null
	].filter(Boolean);
	return bits.join(' - ');
}

function formatConfirmations(confirmations) {
	if (!Array.isArray(confirmations) || !confirmations.length) return ['- none'];
	return confirmations.map((confirmation) => `- ${confirmationReviewText(confirmation)}`);
}

function formatSafetyFlags(flags) {
	if (!Array.isArray(flags) || !flags.length) return ['- none'];
	return flags.map((flag) => `- ${safetyFlagReviewText(flag)}`);
}

function confirmationReviewText(confirmation) {
	const id = confirmation?.id ?? '<missing>';
	const prompt = confirmation?.prompt ?? '(no prompt)';
	const reason = confirmation?.reason ?? 'reason unknown';
	return `${id}: ${prompt} (${reason})`;
}

function safetyFlagReviewText(flag) {
	const severity = flag?.severity ?? 'unknown';
	const message = flag?.message ?? '(no message)';
	const id = flag?.id ?? '<missing>';
	return `${severity}: ${message} (${id})`;
}

function formatStringList(items) {
	if (!Array.isArray(items) || !items.length) return ['- none recorded'];
	return items.map((item) => `- ${item}`);
}

function compactJson(value) {
	const text = JSON.stringify(value);
	return text.length > 500 ? `${text.slice(0, 497)}...` : text;
}

function tableCell(value) {
	return String(value ?? '')
		.replace(/\r?\n/gu, ' ')
		.replace(/\|/gu, '\\|')
		.trim();
}

function truncateForTable(value, maxLength) {
	const text = String(value ?? '').replace(/\s+/gu, ' ').trim();
	if (text.length <= maxLength) return text;
	return `${text.slice(0, Math.max(0, maxLength - 3))}...`;
}

function quoteBlock(text) {
	return String(text)
		.split('\n')
		.map((line) => `> ${line}`)
		.join('\n');
}

async function writeJson(path, value, options) {
	return writeText(path, `${JSON.stringify(value, null, 2)}\n`, options);
}

async function writeText(path, text, options) {
	if (options.skipExisting && !options.force) {
		try {
			await readFile(path, 'utf8');
			return false;
		} catch {
			// Continue and create the missing file.
		}
	}
	await mkdir(dirname(path), { recursive: true });
	await writeFile(path, text);
	return true;
}

function safeFileName(value) {
	return String(value).replace(/[^A-Za-z0-9._-]/g, '-');
}

function resolveInputPath(value) {
	const text = String(value);
	if (text === '~') return process.env.HOME ?? text;
	if (text.startsWith('~/')) return resolve(process.env.HOME ?? REPO_ROOT, text.slice(2));
	return resolve(REPO_ROOT, text);
}

function sameStringArray(left, right) {
	if (!Array.isArray(left) || !Array.isArray(right)) return false;
	if (left.length !== right.length) return false;
	return left.every((value, index) => value === right[index]);
}
