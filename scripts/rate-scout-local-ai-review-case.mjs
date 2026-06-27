import { readFile, writeFile } from 'node:fs/promises';
import { dirname, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
	applyPacketToReview,
	parseReviewPacket
} from './apply-scout-local-ai-review-packet.mjs';
import {
	parseCliArgs,
	reviewRunEvidenceProblems,
	summarizeReview
} from './lib/scout-local-ai-review.mjs';

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(SCRIPT_DIR, '..');

const cli = parseCliArgs(process.argv.slice(2));

if (!cli.packet || !cli.review || !cli.case) {
	throw new Error([
		'Usage: npm run rate-case:scout-local-ai -- --packet data/scout-local-ai/review-packets/<run>.review.md --review data/scout-local-ai/reviews/<run>.review.json --case DLA-001 --rating 5 --mark-all-pass',
		'For below-5 ratings also pass --failure-categories, --owner-layer, and --improvement-task.',
		'Optional: --run data/scout-local-ai/device-runs/<run>.json when review.runPath is unavailable.',
		'Optional: --notes "...", --dry-run.'
	].join('\n'));
}

const packetPath = resolveInputPath(cli.packet);
const reviewPath = resolveInputPath(cli.review);
const packet = await readFile(packetPath, 'utf8');
const review = JSON.parse(await readFile(reviewPath, 'utf8'));
const run = await loadRunForReview(cli, review);
const updatedPacket = updatePacketCase(packet, cli);
const validation = validateSelectedCaseUpdate({
	packet: updatedPacket,
	review,
	run,
	caseId: cli.case
});

if (validation.problems.length) {
	console.error(`Scout local AI packet case ${validation.caseId} was not updated.`);
	console.error('The selected case would be invalid:');
	for (const problem of validation.problems) console.error(`- ${problem}`);
	process.exit(1);
}

if (!cli.dryRun) {
	await writeFile(packetPath, updatedPacket);
}

console.log(cli.dryRun ? 'Scout local AI review packet case update is valid (dry run).' : 'Scout local AI review packet case updated.');
console.log(`Packet: ${relative(REPO_ROOT, packetPath)}`);
console.log(`Case: ${validation.caseId}`);
console.log(`Rating: ${validation.rating ?? 'unrated'}`);
console.log(`Notes: ${validation.notes || 'blank'}`);
console.log(`Next focused check: npm run review-status:scout-local-ai -- --run ${relative(REPO_ROOT, resolveInputPath(cli.run ?? review.runPath))} --review ${relative(REPO_ROOT, reviewPath)} --packet ${relative(REPO_ROOT, packetPath)} --case ${validation.caseId}`);

function updatePacketCase(markdown, input) {
	const caseId = String(input.case).trim();
	const { start, end, block } = findCaseBlock(markdown, caseId);
	let updated = block;
	let changed = false;

	if (hasCliValue(input, 'rating')) {
		updated = updateField(updated, 'Rating', input.rating);
		changed = true;
	}
	if (hasCliValue(input, 'notes')) {
		updated = updateField(updated, 'Notes', input.notes);
		changed = true;
	}
	if (Number(String(input.rating ?? '').trim()) === 5) {
		updated = updateField(updated, 'Failure categories', hasCliValue(input, 'failureCategories') ? input.failureCategories : '');
		updated = updateField(updated, 'Owner layer', hasCliValue(input, 'ownerLayer') ? input.ownerLayer : '');
		updated = updateField(updated, 'Improvement task', hasCliValue(input, 'improvementTask') ? input.improvementTask : '');
		changed = true;
	} else {
		if (hasCliValue(input, 'failureCategories')) {
			updated = updateField(updated, 'Failure categories', input.failureCategories);
			changed = true;
		}
		if (hasCliValue(input, 'ownerLayer')) {
			updated = updateField(updated, 'Owner layer', input.ownerLayer);
			changed = true;
		}
		if (hasCliValue(input, 'improvementTask')) {
			updated = updateField(updated, 'Improvement task', input.improvementTask);
			changed = true;
		}
	}

	if (input.markAllPass) {
		updated = updated
			.replace(/^- passed:\s*[^|]*?(\s*\|\s*text:)/gmu, '- passed: true$1')
			.replace(/^- acknowledged:\s*[^|]*?(\s*\|\s*text:)/gmu, '- acknowledged: true$1');
		changed = true;
	}

	if (!changed) {
		throw new Error(`No review fields were provided for ${caseId}.`);
	}

	return `${markdown.slice(0, start)}${updated}${markdown.slice(end)}`;
}

function validateSelectedCaseUpdate({ packet, review, run, caseId }) {
	const draftReview = JSON.parse(JSON.stringify(review));
	const parsed = parseReviewPacket(packet);
	applyPacketToReview(draftReview, parsed, { allowPartial: true });
	const selectedReviewCase = draftReview.cases.find((entry) => sameCaseId(entry.caseId, caseId));
	const selectedRunResult = run.results?.find((entry) => sameCaseId(entry.caseId, caseId));

	if (!selectedReviewCase) {
		return {
			caseId,
			rating: null,
			notes: '',
			problems: [`${caseId}: not found in review JSON.`]
		};
	}

	const selectedReview = {
		...draftReview,
		cases: [selectedReviewCase]
	};
	const selectedRun = {
		...run,
		results: selectedRunResult ? [selectedRunResult] : []
	};
	const summary = summarizeReview(selectedReview);
	const problems = [
		...summary.invalid,
		...reviewRunEvidenceProblems(selectedRun, selectedReview)
	];

	return {
		caseId: selectedReviewCase.caseId,
		rating: selectedReviewCase.rating,
		notes: selectedReviewCase.notes ?? '',
		problems
	};
}

async function loadRunForReview(input, review) {
	const runInput = input.run ?? review.runPath;
	if (!runInput) {
		throw new Error('Review JSON is missing runPath. Pass --run <run.json> so selected 5-star ratings can be checked against run evidence.');
	}
	return JSON.parse(await readFile(resolveInputPath(runInput), 'utf8'));
}

function findCaseBlock(markdown, caseId) {
	const escaped = escapeRegExp(caseId);
	const headingPattern = new RegExp(`^##\\s+${escaped}\\s+-\\s+.*$`, 'mu');
	const match = markdown.match(headingPattern);
	if (match?.index === undefined) {
		throw new Error(`Packet does not contain case ${caseId}.`);
	}
	const start = match.index;
	const afterHeadingStart = start + match[0].length;
	const nextHeading = markdown.slice(afterHeadingStart).search(/\n## DLA-\d{3} - /u);
	const end = nextHeading === -1 ? markdown.length : afterHeadingStart + nextHeading;
	return {
		start,
		end,
		block: markdown.slice(start, end)
	};
}

function updateField(block, fieldName, value) {
	const escaped = escapeRegExp(fieldName);
	const pattern = new RegExp(`^- ${escaped}:.*$`, 'mu');
	if (!pattern.test(block)) {
		throw new Error(`Selected packet case is missing reviewer field "${fieldName}".`);
	}
	return block.replace(pattern, `- ${fieldName}: ${String(value ?? '').trim()}`);
}

function hasCliValue(input, key) {
	return Object.prototype.hasOwnProperty.call(input, key);
}

function sameCaseId(left, right) {
	return String(left ?? '').toLowerCase() === String(right ?? '').toLowerCase();
}

function escapeRegExp(value) {
	return String(value).replace(/[.*+?^${}()|[\]\\]/gu, '\\$&');
}

function resolveInputPath(value) {
	const text = String(value);
	if (text === '~') return process.env.HOME ?? text;
	if (text.startsWith('~/')) return resolve(process.env.HOME ?? REPO_ROOT, text.slice(2));
	return resolve(REPO_ROOT, text);
}
