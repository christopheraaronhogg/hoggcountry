#!/usr/bin/env node

import { readScoutEvalRunJson } from './lib/scout-local-ai-run-json.mjs';
import { parseCliArgs } from './lib/scout-local-ai-review.mjs';

const cli = parseCliArgs(process.argv.slice(2));

if (cli.help || (!cli.run && !cli.input && !isImported())) {
	printUsage();
	if (!isImported()) process.exit(cli.help ? 0 : 1);
}

if (!isImported()) {
	const inputPath = String(cli.run ?? cli.input);
	const { run } = await readScoutEvalRunJson(inputPath);
	const report = scanScoutLocalAiAnswerQuality(run);
	if (cli.json) {
		console.log(JSON.stringify(report, null, 2));
	} else {
		console.log(formatAnswerQualityReport(report, inputPath));
	}
	if (cli.strict && report.errorCount > 0) process.exit(1);
	if (cli.failOnWarnings && report.flaggedCount > 0) process.exit(1);
}

export function scanScoutLocalAiAnswerQuality(run) {
	const results = Array.isArray(run?.results) ? run.results : [];
	const flagged = [];
	for (const result of results) {
		const caseId = String(result?.caseId ?? '<missing>');
		const prompt = String(result?.case?.prompt ?? '');
		const answer = String(result?.answer ?? '');
		const checks = runAnswerChecks({ result, prompt, answer });
		if (!checks.length) continue;
		flagged.push({
			caseId,
			domain: result?.case?.domain ?? null,
			phase: result?.case?.phase ?? null,
			prompt,
			answerPreview: compact(answer, 420),
			checks
		});
	}
	const errorCount = flagged.reduce((count, item) => count + item.checks.filter((check) => check.severity === 'error').length, 0);
	const warningCount = flagged.reduce((count, item) => count + item.checks.filter((check) => check.severity === 'warning').length, 0);
	const byCheck = {};
	for (const item of flagged) {
		for (const check of item.checks) byCheck[check.id] = (byCheck[check.id] ?? 0) + 1;
	}
	return {
		schemaVersion: 1,
		runId: run?.runId ?? null,
		suiteId: run?.suiteId ?? null,
		suiteVersion: run?.suiteVersion ?? null,
		caseCount: results.length,
		flaggedCount: flagged.length,
		errorCount,
		warningCount,
		byCheck,
		note: 'Heuristic scan only. It prioritizes review; it does not replace human 1-5 ratings or TestFlight/iPhone proof.',
		flagged
	};
}

export function formatAnswerQualityReport(report, inputPath = '<run>') {
	const lines = [
		`Scout local AI answer-quality scan: ${report.flaggedCount ? 'review-needed' : 'clean'}`,
		`- Run: ${report.runId ?? '<missing>'}`,
		`- File: ${inputPath}`,
		`- Cases scanned: ${report.caseCount}`,
		`- Flagged cases: ${report.flaggedCount}`,
		`- Errors: ${report.errorCount}`,
		`- Warnings: ${report.warningCount}`,
		`- Boundary: ${report.note}`,
		''
	];
	if (Object.keys(report.byCheck).length) {
		lines.push('Checks:');
		for (const [id, count] of Object.entries(report.byCheck).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))) {
			lines.push(`- ${id}: ${count}`);
		}
		lines.push('');
	}
	if (report.flagged.length) {
		lines.push('Flagged cases:');
		for (const item of report.flagged) {
			const checks = item.checks.map((check) => `${check.id} (${check.severity})`).join(', ');
			lines.push(`- ${item.caseId} [${item.domain ?? '<domain>'}]: ${checks}`);
			lines.push(`  Prompt: ${compact(item.prompt, 180)}`);
			lines.push(`  Answer: ${compact(item.answerPreview, 220)}`);
		}
	}
	return `${lines.join('\n')}\n`;
}

function runAnswerChecks({ result, prompt, answer }) {
	const checks = [];
	const trimmed = answer.trim();
	if (result?.error) {
		add(checks, 'provider-error', 'error', 'Provider returned an error for this case.');
	}
	if (!trimmed) {
		add(checks, 'empty-answer', 'error', 'Answer is empty.');
		return checks;
	}
	if (/^(?:this|that) (?:covers|summarizes|is based on)\b.*\b(?:guidance|steps|readiness|safety|discipline)\b\.?$/iu.test(trimmed)) {
		add(checks, 'vague-source-only', 'error', 'Answer only refers to source guidance without giving field-useful content.');
	}
	if (wordCount(trimmed) < 18) {
		add(checks, 'very-short-answer', 'warning', 'Answer is short enough to deserve human review.');
	}
	if (!/[.!?)]$/u.test(trimmed)) {
		add(checks, 'unfinished-tail', 'error', 'Answer does not end as a complete sentence.');
	}
	if (/\[(?:source_search|open_source_doc|next_water|next_shelter|next_town|weather_lookup|current_mile|bible_search|loadout_check|trail_conditions|park_services)\]/iu.test(trimmed)) {
		add(checks, 'internal-tool-reference', 'error', 'Answer exposes internal tool labels.');
	}
	if (/^Source basis:/iu.test(trimmed)) {
		add(checks, 'internal-source-basis-label', 'warning', 'Answer exposes internal source-basis wording instead of a plain hiker-facing answer.');
	}
	if (/\bLoaded (?:context|(?:shelter|exit|alert|nearby help\/access) context):|\bloaded (?:next )?(?:town\/access|terrain|shelter|water)[^.:]*candidate:/iu.test(trimmed)) {
		add(checks, 'internal-loaded-context-label', 'warning', 'Answer exposes loaded-context plumbing instead of a compact hiker-facing cue.');
	}
	if (sourceGroundingVisibleMissing({ result, answer: trimmed })) {
		add(checks, 'source-grounding-visible-missing', 'warning', 'Source-backed answer opened a document but does not visibly name its source/document basis.');
	}
	if (/^#{1,6}\s/mu.test(trimmed) || /\*\*/u.test(trimmed)) {
		add(checks, 'markdown-formatting', 'warning', 'Answer contains Markdown formatting even though Scout chat expects plain text.');
	}
	if (hasUnaskedBibleDrift({ prompt, answer: trimmed })) {
		add(checks, 'unasked-bible-drift', 'warning', 'Answer mentions Bible/scripture language when the prompt did not ask for it.');
	}
	if (hasUnaskedFearComfortDrift({ prompt, answer: trimmed })) {
		add(checks, 'unasked-fear-comfort-drift', 'warning', 'Answer adds fear/alone comfort language when the prompt did not ask for it.');
	}
	if (weatherSummaryMissing({ result, prompt, answer: trimmed })) {
		add(checks, 'weather-summary-missing', 'warning', 'Weather-sensitive answer does not visibly include the fetched weather details.');
	}
	if (frozenFilterSafetyMissing({ prompt, answer: trimmed })) {
		add(checks, 'frozen-filter-safety-missing', 'warning', 'Frozen-filter answer is missing compromise, backup treatment, or warm-storage guidance.');
	}
	if (budgetCategoriesMissing({ prompt, answer: trimmed })) {
		add(checks, 'budget-categories-missing', 'warning', 'Budget answer is missing required budget categories.');
	}
	if (townOfflineReadinessMissing({ prompt, answer: trimmed })) {
		add(checks, 'town-offline-readiness-missing', 'warning', 'Town/offline readiness answer is missing required pre-departure checklist pieces.');
	}
	if (documentWritingMissing({ result, prompt, answer: trimmed })) {
		add(checks, 'document-writing-draft-missing', 'error', 'Document-writing answer is missing a reviewable draft/checklist or explicit save/overwrite confirmation boundary.');
	}
	if (documentWritingSourceBoundaryMissing({ result, prompt, answer: trimmed })) {
		add(checks, 'document-writing-source-boundary-missing', 'error', 'Document-writing answer does not clearly separate source-backed facts from placeholders, assumptions, or open questions.');
	}
	if (documentWritingSaveRecoveryMissing({ result, prompt, answer: trimmed })) {
		add(checks, 'document-writing-save-recovery-missing', 'error', 'Document-writing answer does not make saved changes recoverable or versioned.');
	}
	return checks;
}

function add(checks, id, severity, message) {
	checks.push({ id, severity, message });
}

function hasUnaskedBibleDrift({ prompt, answer }) {
	if (isBiblePrompt(prompt)) return false;
	if (!/\b(?:bible|scripture|verse|verses|psalms?|isaiah|john|romans|proverbs?|timothy|lord|god|christ|jesus)\b/iu.test(answer)) return false;
	return !(isOfflineReadinessPrompt(prompt) && mentionsOfflineBibleAvailability(answer));
}

function mentionsOfflineBibleAvailability(answer) {
	return /verify Bible text is available offline|Bible text if it was packaged or downloaded|Bible text is available offline/iu.test(answer);
}

function hasUnaskedFearComfortDrift({ prompt, answer }) {
	return !isFearComfortPrompt(prompt) && /\b(?:scared|afraid|alone|anxious|anxiety|panic|comfort verses?)\b/iu.test(answer);
}

function weatherSummaryMissing({ result, prompt, answer }) {
	if (!isWeatherSensitivePrompt(prompt)) return false;
	const summary = (result?.toolInvocations ?? []).find((tool) => tool.toolId === 'weather_lookup')?.summary ?? '';
	if (!summary) return false;
	const expectedNumbers = String(summary).match(/\b\d+\s*(?:F|mph)\b/gu) ?? [];
	if (expectedNumbers.length) {
		const lowerAnswer = answer.toLowerCase();
		const matched = expectedNumbers.filter((value) => lowerAnswer.includes(value.toLowerCase())).length;
		return matched < Math.min(2, expectedNumbers.length);
	}
	return !/\b(?:cached weather|current forecast|weather note|refresh|verify)\b/iu.test(answer);
}

function budgetCategoriesMissing({ prompt, answer }) {
	if (!/\b(?:budget|overplanning|over-plan|money|cost|spend|spending)\b/iu.test(prompt)) return false;
	return !(/daily burn/iu.test(answer) &&
		/town spikes?/iu.test(answer) &&
		/(hostel|shuttle|laundry|meal)/iu.test(answer) &&
		/gear replacement/iu.test(answer) &&
		/emergency cushion/iu.test(answer));
}

function townOfflineReadinessMissing({ prompt, answer }) {
	const lowerPrompt = prompt.toLowerCase();
	const townOrService = /\b(?:town|service|cell signal|wi-?fi|before leaving|lose service|no signal)\b/u.test(lowerPrompt);
	const readinessAction = /\b(?:charge|refresh|download|update|field pack|local ai|model|cloud sync|battery bank)\b/u.test(lowerPrompt);
	if (!(townOrService && readinessAction)) return false;
	return !(/field[-\s]?pack/iu.test(answer) &&
		/(?:local ai|model|gemma)/iu.test(answer) &&
		/(?:cloud sync|sync finish|finish.*sync|backup)/iu.test(answer) &&
		/weather/iu.test(answer) &&
		/closure/iu.test(answer) &&
		/(?:stale|not current|until refreshed|refresh again|remains current indefinitely)/iu.test(answer));
}

function sourceGroundingVisibleMissing({ result, answer }) {
	const requiredTools = [
		...(result?.case?.requiredTools ?? []),
		...(result?.toolExpectations?.required ?? [])
	];
	const openedSourceDoc = requiredTools.some((tool) => String(tool).startsWith('open_source_doc')) ||
		(result?.toolInvocations ?? []).some((tool) => tool?.toolId === 'open_source_doc');
	if (!openedSourceDoc) return false;
	return !mentionsVisibleSourceBasis(answer);
}

function mentionsVisibleSourceBasis(answer) {
	return /\b(?:source|sources|source-backed|document|documents|guide|guidance|field[-\s]?pack|cached|according to|saved|vault|KJV|Bible|forecast|alert|loadout|discipline|weather note|water note|shelter note|town note|terrain note|medical-advice boundary|airplane-mode boundary)\b/iu.test(answer);
}

function documentWritingMissing({ result, prompt, answer }) {
	if (!asksDocumentWriting(result, prompt)) return false;
	return !(mentionsDocumentDraft(answer) && mentionsDocumentWriteConfirmation(answer));
}

function documentWritingSourceBoundaryMissing({ result, prompt, answer }) {
	if (!asksDocumentWriting(result, prompt)) return false;
	return !mentionsDocumentSourceBoundary(answer);
}

function documentWritingSaveRecoveryMissing({ result, prompt, answer }) {
	if (!asksDocumentWriting(result, prompt)) return false;
	return !mentionsDocumentSaveRecovery(answer);
}

function asksDocumentWriting(result, prompt) {
	const tags = result?.case?.improvementTags ?? [];
	const documentTask = String(result?.case?.documentTask ?? '');
	return documentTask === 'writing' ||
		documentTask === 'reading-writing' ||
		tags.includes('document-writing') ||
		isDocumentWritingPrompt(prompt);
}

function isDocumentWritingPrompt(prompt) {
	const lowerPrompt = prompt.toLowerCase();
	const writingVerb = /\b(?:draft|write|create|revise)\b/u;
	const documentObject = /\b(?:checklist|note|plan|summary|update|decision|document|document vault|vault)\b/u;
	return (writingVerb.test(lowerPrompt) && documentObject.test(lowerPrompt)) ||
		/\b(?:save|saving|saved)\b[^.?!\n]*(?:document vault|vault|note|checklist|document)\b/u.test(lowerPrompt) ||
		/\b(?:update my notes|update note|town[-\s]?exit update note|checklist note)\b/u.test(lowerPrompt);
}

function mentionsDocumentDraft(answer) {
	const hasDraftLabel = /\b(?:draft|checklist note|checklist:|town[-\s]?exit update note|offline document checklist|screenshot\/save checklist)\b/iu.test(answer);
	const hasDraftShape =
		/\b1\.\s+\S/iu.test(answer) ||
		/\b(?:current AT mile|photo ID|emergency contacts|open questions|weather and closures|food and water carry|permits|reservations)\b/iu.test(answer);
	return hasDraftLabel && hasDraftShape;
}

function mentionsDocumentWriteConfirmation(answer) {
	const mentionsReviewOrConfirm = /\b(?:review|confirm|confirmation|explicitly confirm|before saving|before save)\b/iu.test(answer);
	const mentionsSaveBoundary = /\b(?:save|saving|overwrite|document|draft)\b/iu.test(answer);
	return mentionsReviewOrConfirm && mentionsSaveBoundary;
}

function mentionsDocumentSourceBoundary(answer) {
	const mentionsSourceFacts = /\b(?:source-backed|source summaries?|saved document facts?|document vault facts?)\b/iu.test(answer);
	const mentionsAssumptionBoundary = /\b(?:assumptions?|open questions?|placeholders?|verify|confirm before saving|private values?)\b/iu.test(answer);
	return mentionsSourceFacts && mentionsAssumptionBoundary;
}

function mentionsDocumentSaveRecovery(answer) {
	return /\b(?:versioned?|recoverable|previous version|restore|restored|undo|history)\b/iu.test(answer) &&
		/\b(?:save|saved|saving|document|vault|change|update|overwrite)\b/iu.test(answer);
}

function isBiblePrompt(prompt) {
	return /\b(?:bible|scripture|verse|pray|prayer|psalm|proverb|john|romans|jesus|christ|lord|god|faith|salvation|spiritual|fear while|scared and alone)\b/iu.test(prompt) ||
		/\b(?:be saved|get saved|am i saved|do to be saved)\b/iu.test(prompt);
}

function isFearComfortPrompt(prompt) {
	return /\b(?:scared|afraid|alone|anxious|anxiety|panic|fear|fearful|comfort|nighttime support|night support)\b/iu.test(prompt);
}

function isOfflineReadinessPrompt(prompt) {
	return /\b(?:offline|airplane mode|airplane-mode|no cell|without service|what can you still answer|what can scout still answer|what still works|download|phone settings|day-one readiness|day one readiness|charge|refresh|lose service|town|service|field pack|local ai|model)\b/iu.test(prompt);
}

function isWeatherSensitivePrompt(prompt) {
	return /\b(?:weather|rains?|rainy|raining|storms?|thunderstorms?|thunder|lightning|winds?|cold|heat|hot|hypothermia|freez\w*|ridge|dry stretch|bad weather|zeros?|neros?|stop hiking)\b/iu.test(prompt);
}

function frozenFilterSafetyMissing({ prompt, answer }) {
	if (!/\b(?:filter|water filter|hollow[-\s]?fiber|sawyer|katadyn|befree)\b/iu.test(prompt)) return false;
	if (!/\b(?:freez\w*|frozen|froze)\b/iu.test(prompt)) return false;
	const mentionsCompromised = /\b(?:compromis\w*|not definitely safe|may not be safe|could be unsafe|replace|retire)\b/iu.test(answer);
	const mentionsBackupTreatment = /\b(?:backup (?:water )?(?:tablet|tablets|treatment)|water tablets|chemical treatment|chlorine dioxide|aquamira|boil)\b/iu.test(answer);
	const mentionsWarmStorage = /\b(?:sleep(?:ing)? with (?:it|the filter)|filter[^.?!\n]*(?:sleeping bag|keep warm|inside your bag|warm overnight)|keep[^.?!\n]*filter[^.?!\n]*warm)\b/iu.test(answer);
	return !(mentionsCompromised && mentionsBackupTreatment && mentionsWarmStorage);
}

function wordCount(value) {
	return value.trim().split(/\s+/u).filter(Boolean).length;
}

function compact(value, maxLength) {
	const normalized = String(value ?? '').replace(/\s+/gu, ' ').trim();
	if (normalized.length <= maxLength) return normalized;
	return `${normalized.slice(0, maxLength - 1).trimEnd()}...`;
}

function printUsage() {
	console.log([
		'Usage: npm run scan:scout-local-ai-answers -- --run <run-json>',
		'Optional: --json for machine-readable output.',
		'Optional: --strict to exit non-zero on error-level checks.',
		'Optional: --fail-on-warnings to exit non-zero on any flagged case.',
		'This is a heuristic triage aid; it does not replace human 1-5 review.'
	].join('\n'));
}

function isImported() {
	return import.meta.url !== `file://${process.argv[1]}`;
}
