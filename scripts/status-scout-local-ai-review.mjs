import { readFile } from 'node:fs/promises';
import { dirname, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
	parseCliArgs,
	reviewRunAlignmentProblems,
	reviewRunEvidenceProblems,
	summarizeReview
} from './lib/scout-local-ai-review.mjs';
import {
	sourceEvidenceProblems
} from './lib/scout-local-ai-source-evidence.mjs';

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(SCRIPT_DIR, '..');

const cli = parseCliArgs(process.argv.slice(2));

if (!cli.run || !cli.review) {
	throw new Error([
		'Usage: npm run review-status:scout-local-ai -- --run data/scout-local-ai/device-runs/<run-id>.json --review data/scout-local-ai/reviews/<run-id>.review.json',
		'Add --json for machine-readable progress.'
	].join('\n'));
}

const runPath = resolveInputPath(cli.run);
const reviewPath = resolveInputPath(cli.review);
const run = JSON.parse(await readFile(runPath, 'utf8'));
const review = JSON.parse(await readFile(reviewPath, 'utf8'));
const progress = buildReviewProgress(run, review, { runPath, reviewPath });

if (cli.json) {
	console.log(JSON.stringify(progress, null, 2));
} else {
	console.log(formatReviewProgress(progress));
}

function buildReviewProgress(run, review, paths) {
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
	const readyForStrictDeviceProof = readyForBacklog && summary.belowFive === 0 && fiveStar === summary.total && fullDeviceRun;

	return {
		schemaVersion: 1,
		runId: run.runId ?? review.runId ?? '<missing>',
		evidenceLane: run.evidenceLane ?? review.evidenceLane ?? '<missing>',
		paths: {
			run: relative(REPO_ROOT, paths.runPath),
			review: relative(REPO_ROOT, paths.reviewPath)
		},
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
		invalidEntries,
		nextUnrated,
		reviewQueue: queue,
		nextAction: nextAction({
			invalidEntries,
			nextUnrated,
			readyForBacklog,
			readyForStrictDeviceProof,
			fullDeviceRun,
			summary,
			runPath: relative(REPO_ROOT, paths.runPath),
			reviewPath: relative(REPO_ROOT, paths.reviewPath)
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
	if (input.invalidEntries.length) {
		return `Fix ${input.invalidEntries.length} invalid review issue(s), starting with: ${input.invalidEntries[0]}`;
	}
	if (input.nextUnrated) {
		return `Review next unrated case ${input.nextUnrated.caseId} (${input.nextUnrated.domain}) and rerun review-status:scout-local-ai.`;
	}
	if (input.readyForStrictDeviceProof) {
		return [
			'Review is complete at 100% 5/5.',
			`Run npm run review:scout-local-ai -- --run ${input.runPath} --review ${input.reviewPath}, then npm run verify:scout-local-ai-device-proof -- --run ${input.runPath} --review ${input.reviewPath}.`
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
		`Run: \`${progress.paths.run}\``,
		`Review: \`${progress.paths.review}\``,
		`Evidence lane: \`${progress.evidenceLane}\``,
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
		'',
		'## Next action',
		'',
		progress.nextAction,
		''
	];

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

	lines.push('## Review queue', '');
	lines.push('| Case | Rating | Signal | Domain | Prompt preview |');
	lines.push('| --- | --- | --- | --- | --- |');
	for (const item of progress.reviewQueue.slice(0, 25)) {
		lines.push([
			item.caseId,
			displayRating(item.rating),
			item.signal,
			item.domain,
			item.promptPreview
		].map(tableCell).join(' | ').replace(/^/u, '| ').replace(/$/u, ' |'));
	}
	if (progress.reviewQueue.length > 25) {
		lines.push(`| ... | ... | ... | ... | ${progress.reviewQueue.length - 25} more cases |`);
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

function resolveInputPath(value) {
	const text = String(value);
	if (text === '~') return process.env.HOME ?? text;
	if (text.startsWith('~/')) return resolve(process.env.HOME ?? REPO_ROOT, text.slice(2));
	return resolve(REPO_ROOT, text);
}
