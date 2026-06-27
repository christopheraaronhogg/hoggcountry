import { readFile } from 'node:fs/promises';
import { dirname, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
	applyPacketToReview,
	parseReviewPacket
} from './apply-scout-local-ai-review-packet.mjs';
import {
	verifyScoutLocalAiDeviceProof
} from './lib/scout-local-ai-device-proof.mjs';
import {
	inferOwnerLayer,
	parseCliArgs,
	reviewRunAlignmentProblems,
	reviewRunEvidenceProblems,
	summarizeReview,
	suggestedFailureCategoriesForResult
} from './lib/scout-local-ai-review.mjs';
import {
	sourceEvidenceProblems
} from './lib/scout-local-ai-source-evidence.mjs';

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(SCRIPT_DIR, '..');
const DEFAULT_SUITE = 'data/scout-local-ai/dad-local-ai-100.json';

const cli = parseCliArgs(process.argv.slice(2));

if (!cli.run || !cli.review) {
	throw new Error([
		'Usage: npm run review-status:scout-local-ai -- --run data/scout-local-ai/device-runs/<run-id>.json --review data/scout-local-ai/reviews/<run-id>.review.json',
		'Optional: --packet data/scout-local-ai/review-packets/<run-id>.review.md to preview draft packet progress without writing review JSON.',
		'Add --json for machine-readable progress.'
	].join('\n'));
}

const runPath = resolveInputPath(cli.run);
const reviewPath = resolveInputPath(cli.review);
const suitePath = resolveInputPath(cli.suite ?? DEFAULT_SUITE);
const packetPath = cli.packet ? resolveInputPath(cli.packet) : null;
const suite = JSON.parse(await readFile(suitePath, 'utf8'));
const run = JSON.parse(await readFile(runPath, 'utf8'));
const review = JSON.parse(await readFile(reviewPath, 'utf8'));
const packetDraft = packetPath ? await buildPacketDraft({ packetPath, review }) : null;
const progressReview = packetDraft?.applied ? packetDraft.review : review;
const progress = buildReviewProgress({
	suite,
	run,
	review: progressReview,
	packetDraft,
	paths: { suitePath, runPath, reviewPath, packetPath }
});

if (cli.json) {
	console.log(JSON.stringify(progress, null, 2));
} else {
	console.log(formatReviewProgress(progress));
}

async function buildPacketDraft({ packetPath, review }) {
	try {
		const packet = await readFile(packetPath, 'utf8');
		const draftReview = JSON.parse(JSON.stringify(review));
		const parsed = parseReviewPacket(packet);
		const result = applyPacketToReview(draftReview, parsed, { allowPartial: true });
		return {
			applied: true,
			path: relative(REPO_ROOT, packetPath),
			updatedCases: result.updatedCases,
			missingCases: result.missingCases ?? [],
			review: draftReview,
			errors: []
		};
	} catch (error) {
		return {
			applied: false,
			path: relative(REPO_ROOT, packetPath),
			updatedCases: 0,
			missingCases: [],
			review: null,
			errors: packetErrorLines(error)
		};
	}
}

function buildReviewProgress({ suite, run, review, packetDraft, paths }) {
	const summary = Array.isArray(review?.cases)
		? summarizeReview(review)
		: emptyReviewSummary();
	const alignmentProblems = reviewRunAlignmentProblems(run, review);
	const evidenceProblems = reviewRunEvidenceProblems(run, review);
	const invalidEntries = [
		...alignmentProblems,
		...summary.invalid,
		...evidenceProblems
	];
	const reviewByCaseId = new Map((review.cases ?? []).map((entry) => [entry.caseId, entry]));
	const queue = (run.results ?? []).map((result, index) => {
		const entry = reviewByCaseId.get(result.caseId) ?? {};
		const sourceGaps = sourceEvidenceProblems(
			result.case?.requiredTools ?? result.toolExpectations?.required ?? [],
			result.toolInvocations ?? []
		);
		const signal = reviewSignal(result, sourceGaps);
		const rating = entry.rating ?? null;
		const suggestedFailureCategories = suggestedFailureCategoriesForResult(result);
		const suggestedOwnerLayer = inferOwnerLayer(suggestedFailureCategories, result);
		return {
			caseId: result.caseId,
			domain: result.case?.domain ?? entry.domain ?? '<missing>',
			phase: result.case?.phase ?? entry.phase ?? '<missing>',
			signal,
			signalRank: signalRank(signal),
			rating,
			unrated: rating === null || rating === undefined || rating === '',
			belowFive: Number.isInteger(rating) && rating < 5,
			missingTools: result.toolExpectations?.missing ?? [],
			sourceEvidenceGaps: sourceGaps.map((problem) => problem.message),
			sourceEvidenceGapExpectations: sourceGaps.map((problem) => problem.expectation),
			suggestedFailureCategories,
			suggestedOwnerLayer,
			evidenceGapSummary: formatQueueEvidenceGaps(result, sourceGaps),
			promptPreview: truncate(result.case?.prompt ?? entry.prompt ?? '', 120),
			answerPreview: truncate(entry.answerPreview ?? result.answer ?? result.error ?? '', 220),
			index
		};
	}).sort((left, right) => {
		if (left.unrated !== right.unrated) return left.unrated ? -1 : 1;
		if (left.signalRank !== right.signalRank) return left.signalRank - right.signalRank;
		return left.index - right.index;
	});
	const nextUnrated = queue.find((entry) => entry.unrated) ?? null;
	const fiveStar = summary.ratingCounts['5'] ?? 0;
	const fullDeviceRun = run.evidenceLane === 'device-on-device-gemma' && run.caseCount === run.totalSuiteCases;
	const readyForBacklog = invalidEntries.length === 0 && summary.unrated === 0;
	const strictDeviceProofErrors = readyForBacklog && summary.belowFive === 0 && fiveStar === summary.total && fullDeviceRun
		? verifyScoutLocalAiDeviceProof({ suite, run, review }).errors
		: [];
	const readyForStrictDeviceProof = strictDeviceProofErrors.length === 0 &&
		readyForBacklog &&
		summary.belowFive === 0 &&
		fiveStar === summary.total &&
		fullDeviceRun;

	return {
		schemaVersion: 1,
		runId: run.runId ?? review.runId ?? '<missing>',
		evidenceLane: run.evidenceLane ?? review.evidenceLane ?? '<missing>',
		paths: {
			suite: relative(REPO_ROOT, paths.suitePath),
			run: relative(REPO_ROOT, paths.runPath),
			review: relative(REPO_ROOT, paths.reviewPath),
			packet: paths.packetPath ? relative(REPO_ROOT, paths.packetPath) : null
		},
		progressSource: packetDraft ? 'packet-draft' : 'review-json',
		packetDraft: packetDraft
			? {
				applied: packetDraft.applied,
				path: packetDraft.path,
				updatedCases: packetDraft.updatedCases,
				missingCaseCount: packetDraft.missingCases.length,
				errors: packetDraft.errors
			}
			: null,
		summary: {
			total: summary.total,
			rated: summary.rated,
			unrated: summary.unrated,
			fiveStar,
			belowFive: summary.belowFive,
			ratingCounts: summary.ratingCounts,
			byDomain: summary.byDomain,
			invalidCount: invalidEntries.length
		},
		fullDeviceRun,
		readyForBacklog,
		readyForStrictDeviceProof,
		strictDeviceProofErrors,
		invalidEntries,
		nextUnrated,
		reviewQueue: queue,
		nextAction: nextAction({
			invalidEntries,
			nextUnrated,
			readyForBacklog,
			readyForStrictDeviceProof,
			fullDeviceRun,
			strictDeviceProofErrors,
			summary,
			runPath: relative(REPO_ROOT, paths.runPath),
			reviewPath: relative(REPO_ROOT, paths.reviewPath),
			packetPath: paths.packetPath ? relative(REPO_ROOT, paths.packetPath) : null,
			packetDraft
		})
	};
}

function reviewSignal(result, sourceGaps) {
	if (String(result?.error ?? '').trim()) return 'review-first: provider error';
	if ((result?.toolExpectations?.missing ?? []).length) return 'review-first: missing required tools';
	if (sourceGaps.length) return 'review-first: source evidence gap';
	if ((result?.safetyFlags ?? []).length) return 'review-first: safety flag';
	if ((result?.requiredConfirmations ?? []).length) return 'review-first: required confirmation';
	return 'standard';
}

function signalRank(signal) {
	if (signal.includes('provider error')) return 0;
	if (signal.includes('missing required tools')) return 1;
	if (signal.includes('source evidence gap')) return 2;
	if (signal.includes('safety flag')) return 3;
	if (signal.includes('required confirmation')) return 4;
	return 5;
}

function nextAction(input) {
	if (input.packetDraft && !input.packetDraft.applied) {
		return `Fix draft packet parse/apply issue before checking rating progress: ${input.packetDraft.errors[0] ?? 'unknown packet error'}`;
	}
	if (input.invalidEntries.length) {
		const target = input.packetDraft ? ' in the packet draft' : '';
		return `Fix ${input.invalidEntries.length} invalid review issue(s)${target}, starting with: ${input.invalidEntries[0]}`;
	}
	if (input.nextUnrated) {
		const target = input.packetDraft ? ' in the packet' : '';
		return `Review next unrated case ${input.nextUnrated.caseId} (${input.nextUnrated.domain})${target} and rerun review-status:scout-local-ai.`;
	}
	if (input.packetDraft) {
		return [
			'Packet draft is fully rated and valid.',
			`Apply it with npm run apply-review:scout-local-ai -- --packet ${input.packetPath} --review ${input.reviewPath} --run ${input.runPath}, then run npm run finalize-review:scout-local-ai -- --packet ${input.packetPath} --run ${input.runPath} --review ${input.reviewPath}.`
		].join(' ');
	}
	if (input.readyForStrictDeviceProof) {
		return [
			'Review is complete at 100% 5/5.',
			`Run npm run review:scout-local-ai -- --run ${input.runPath} --review ${input.reviewPath}, then npm run verify:scout-local-ai-device-proof -- --run ${input.runPath} --review ${input.reviewPath}.`
		].join(' ');
	}
	if (input.readyForBacklog && input.summary.belowFive === 0 && input.fullDeviceRun && input.strictDeviceProofErrors.length) {
		return [
			`Review is complete at 100% 5/5, but strict device proof still has ${input.strictDeviceProofErrors.length} issue(s).`,
			`Fix the proof input first; starting issue: ${input.strictDeviceProofErrors[0]}`
		].join(' ');
	}
	if (input.readyForBacklog && input.summary.belowFive === 0 && !input.fullDeviceRun) {
		return [
			'Review has no below-5 cases for this run, but the run is not a full TestFlight/iPhone device proof candidate.',
			`Run npm run review:scout-local-ai -- --run ${input.runPath} --review ${input.reviewPath} for the record, then collect a full Run 100 before strict proof.`
		].join(' ');
	}
	if (input.readyForBacklog) {
		return [
			`Review is complete with ${input.summary.belowFive} below-5 case(s).`,
			`Run npm run review:scout-local-ai -- --run ${input.runPath} --review ${input.reviewPath}, then plan the iteration backlog.`
		].join(' ');
	}
	return 'Keep reviewing; the progress report should say readyForBacklog=true before backlog or proof commands run.';
}

function formatReviewProgress(progress) {
	const lines = [
		`# Scout local AI review status: ${progress.runId}`,
		'',
		`Suite: \`${progress.paths.suite}\``,
		`Run: \`${progress.paths.run}\``,
		`Review: \`${progress.paths.review}\``,
		progress.paths.packet ? `Packet draft: \`${progress.paths.packet}\`` : null,
		`Evidence lane: \`${progress.evidenceLane}\``,
		`Progress source: \`${progress.progressSource}\``,
		'',
		'## Progress',
		'',
		`- Rated: ${progress.summary.rated}/${progress.summary.total}`,
		`- 5/5: ${progress.summary.fiveStar}`,
		`- Below 5: ${progress.summary.belowFive}`,
		`- Unrated: ${progress.summary.unrated}`,
		`- Invalid review issues: ${progress.summary.invalidCount}`,
		`- Full device run: ${progress.fullDeviceRun ? 'yes' : 'no'}`,
		`- Ready for backlog: ${progress.readyForBacklog ? 'yes' : 'no'}`,
		`- Ready for strict device proof: ${progress.readyForStrictDeviceProof ? 'yes' : 'no'}`,
		`- Strict proof preview issues: ${progress.strictDeviceProofErrors.length}`,
		'',
		'## Next action',
		'',
		progress.nextAction,
		''
	].filter((line) => line !== null);

	if (progress.packetDraft) {
		lines.push('## Packet Draft', '');
		lines.push(`- Parsed/applied: ${progress.packetDraft.applied ? 'yes' : 'no'}`);
		lines.push(`- Cases applied: ${progress.packetDraft.updatedCases}`);
		lines.push(`- Missing case count: ${progress.packetDraft.missingCaseCount}`);
		if (progress.packetDraft.errors.length) {
			lines.push('- Errors:');
			for (const issue of progress.packetDraft.errors.slice(0, 10)) lines.push(`  - ${issue}`);
			if (progress.packetDraft.errors.length > 10) lines.push(`  - ... ${progress.packetDraft.errors.length - 10} more`);
		}
		lines.push('');
	}

	if (Object.keys(progress.summary.byDomain).length) {
		lines.push('## By domain', '');
		for (const [domain, value] of Object.entries(progress.summary.byDomain).sort(([left], [right]) => left.localeCompare(right))) {
			lines.push(`- ${domain}: rated ${value.rated}, below 5 ${value.belowFive}, average ${value.average}`);
		}
		lines.push('');
	}

	if (progress.invalidEntries.length) {
		lines.push('## Invalid entries', '');
		for (const issue of progress.invalidEntries.slice(0, 25)) lines.push(`- ${issue}`);
		if (progress.invalidEntries.length > 25) lines.push(`- ... ${progress.invalidEntries.length - 25} more`);
		lines.push('');
	}

	if (progress.strictDeviceProofErrors.length) {
		lines.push('## Strict Proof Preview Issues', '');
		for (const issue of progress.strictDeviceProofErrors.slice(0, 25)) lines.push(`- ${issue}`);
		if (progress.strictDeviceProofErrors.length > 25) lines.push(`- ... ${progress.strictDeviceProofErrors.length - 25} more`);
		lines.push('');
	}

	lines.push('## Review queue', '');
	lines.push('| Case | Rating | Signal | Likely owner | Suggested categories | Evidence gaps | Domain | Prompt preview | Answer preview |');
	lines.push('| --- | --- | --- | --- | --- | --- | --- | --- | --- |');
	for (const item of progress.reviewQueue.slice(0, 25)) {
		lines.push([
			item.caseId,
			displayRating(item.rating),
			item.signal,
			item.suggestedOwnerLayer,
			item.suggestedFailureCategories.join(', ') || 'none',
			item.evidenceGapSummary,
			item.domain,
			item.promptPreview,
			item.answerPreview
		].map(tableCell).join(' | ').replace(/^/u, '| ').replace(/$/u, ' |'));
	}
	if (progress.reviewQueue.length > 25) {
		lines.push(`| ... | ... | ... | ... | ... | ... | ... | ... | ${progress.reviewQueue.length - 25} more cases |`);
	}
	lines.push('');

	return `${lines.join('\n')}\n`;
}

function tableCell(value) {
	return String(value ?? '')
		.replace(/\r?\n/gu, ' ')
		.replace(/\|/gu, '\\|')
		.trim();
}

function displayRating(value) {
	if (value === null || value === undefined || value === '') return 'unrated';
	return value;
}

function formatQueueEvidenceGaps(result, sourceGaps) {
	const gaps = [];
	if ((result?.toolExpectations?.missing ?? []).length) {
		gaps.push(`missing tools: ${result.toolExpectations.missing.join(', ')}`);
	}
	if (sourceGaps.length) {
		gaps.push(`source evidence: ${sourceGaps.map((problem) => problem.expectation ?? problem.message).join(', ')}`);
	}
	if (String(result?.error ?? '').trim()) gaps.push(`error: ${truncate(result.error, 80)}`);
	return gaps.join('; ') || 'none';
}

function truncate(value, maxLength) {
	const text = String(value ?? '').replace(/\s+/gu, ' ').trim();
	if (text.length <= maxLength) return text;
	return `${text.slice(0, Math.max(0, maxLength - 3))}...`;
}

function emptyReviewSummary() {
	return {
		total: 0,
		rated: 0,
		unrated: 0,
		belowFive: 0,
		ratingCounts: {},
		byDomain: {},
		invalid: []
	};
}

function packetErrorLines(error) {
	if (Array.isArray(error?.errors)) return error.errors.map((line) => String(line));
	return String(error?.message ?? error ?? 'unknown packet error')
		.split(/\r?\n/u)
		.map((line) => line.replace(/^- /u, '').trim())
		.filter(Boolean);
}

function resolveInputPath(value) {
	const text = String(value);
	if (text === '~') return process.env.HOME ?? text;
	if (text.startsWith('~/')) return resolve(process.env.HOME ?? REPO_ROOT, text.slice(2));
	return resolve(REPO_ROOT, text);
}
