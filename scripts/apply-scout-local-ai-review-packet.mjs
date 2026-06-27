import { readFile, writeFile } from 'node:fs/promises';
import { dirname, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
	parseCliArgs,
	reviewRunAlignmentProblems,
	reviewRunEvidenceProblems,
	summarizeReview
} from './lib/scout-local-ai-review.mjs';

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(SCRIPT_DIR, '..');

if (isDirectRun()) {
	await main();
}

async function main() {
	const cli = parseCliArgs(process.argv.slice(2));

	if (!cli.packet || !cli.review) {
		throw new Error([
			'Usage: npm run apply-review:scout-local-ai -- --packet data/scout-local-ai/review-packets/<run>.review.md --review data/scout-local-ai/reviews/<run>.review.json',
			'Optional: --run data/scout-local-ai/device-runs/<run>.json when review.runPath is unavailable',
			'Optional: --out data/scout-local-ai/reviews/<run>.review.json',
			'Optional: --allow-partial for intentional smoke or incremental packet updates'
		].join('\n'));
	}

	const packetPath = resolveInputPath(cli.packet);
	const reviewPath = resolveInputPath(cli.review);
	const outPath = cli.out ? resolveInputPath(cli.out) : reviewPath;
	const packet = await readFile(packetPath, 'utf8');
	const review = JSON.parse(await readFile(reviewPath, 'utf8'));
	const run = await loadRunForReview(cli, review);
	const parsed = parseReviewPacket(packet);
	const result = applyPacketToReview(review, parsed, { allowPartial: Boolean(cli.allowPartial) });
	const summary = summarizeReview(review);
	const invalidEntries = [
		...reviewRunAlignmentProblems(run, review),
		...summary.invalid,
		...reviewRunEvidenceProblems(run, review)
	];

	if (invalidEntries.length) {
		console.error('Review packet would create invalid review JSON. Fix the packet before applying:');
		for (const issue of invalidEntries.slice(0, 20)) console.error(`- ${issue}`);
		if (invalidEntries.length > 20) console.error(`- ... ${invalidEntries.length - 20} more`);
		process.exit(1);
	}

	await writeFile(outPath, `${JSON.stringify(review, null, 2)}\n`);

	console.log('Scout local AI review JSON updated from packet.');
	console.log(`Packet: ${relative(REPO_ROOT, packetPath)}`);
	console.log(`Review: ${relative(REPO_ROOT, outPath)}`);
	console.log(`Updated cases: ${result.updatedCases}`);
	if (result.missingCases?.length) {
		console.log(`Partial packet apply: ${result.missingCases.length} review case(s) not present in packet.`);
	}
	console.log(`Rated: ${summary.rated}/${summary.total}`);
	console.log(`5/5: ${summary.ratingCounts['5'] ?? 0}`);
	console.log(`Below 5: ${summary.belowFive}`);
	console.log(`Unrated: ${summary.unrated}`);
}

async function loadRunForReview(cli, review) {
	const runInput = cli.run ?? review.runPath;
	if (!runInput) {
		throw new Error('Review JSON is missing runPath. Pass --run <run.json> so 5-star ratings can be checked against run evidence.');
	}
	return JSON.parse(await readFile(resolveInputPath(runInput), 'utf8'));
}

export function parseReviewPacket(markdown) {
	const blocks = extractCaseBlocks(markdown);
	const cases = [];
	const errors = [];

	if (!blocks.length) {
		errors.push('packet did not contain any DLA case blocks.');
	}

	for (const block of blocks) {
		const traitChecks = parseChecklist({
			block: block.body,
			startLabel: 'Trait checklist to fill in review JSON:',
			endLabel: 'Safety caveats:',
			caseId: block.caseId,
			fieldName: 'traitChecks',
			errors
		});
		const safetyCaveatChecks = parseChecklist({
			block: block.body,
			startLabel: 'Safety caveat checklist to fill in review JSON:',
			endLabel: 'Tool expectations:',
			caseId: block.caseId,
			fieldName: 'safetyCaveatChecks',
			errors
		});
		const requiredConfirmationChecks = parseSignalChecklist({
			block: block.body,
			startLabel: 'Required confirmation acknowledgement checklist to fill in review JSON:',
			endLabel: 'Safety flags:',
			caseId: block.caseId,
			fieldName: 'requiredConfirmationChecks',
			errors
		});
		const safetyFlagChecks = parseSignalChecklist({
			block: block.body,
			startLabel: 'Safety flag acknowledgement checklist to fill in review JSON:',
			endLabel: 'Context used:',
			caseId: block.caseId,
			fieldName: 'safetyFlagChecks',
			errors
		});
		cases.push({
			caseId: block.caseId,
			rating: parseRating(parseField(block.body, 'Rating'), block.caseId, errors),
			notes: parseField(block.body, 'Notes') ?? '',
			failureCategories: splitList(parseField(block.body, 'Failure categories')),
			ownerLayer: parseField(block.body, 'Owner layer') ?? '',
			improvementTask: parseField(block.body, 'Improvement task') ?? '',
			traitChecks,
			safetyCaveatChecks,
			requiredConfirmationChecks,
			safetyFlagChecks
		});
	}

	if (errors.length) {
		const error = new Error(`Review packet could not be parsed:\n- ${errors.join('\n- ')}`);
		error.errors = errors;
		throw error;
	}
	return { cases };
}

export function applyPacketToReview(review, packetReview, options = {}) {
	if (!Array.isArray(review.cases)) throw new Error('review.cases must be an array.');
	const reviewById = new Map(review.cases.map((entry) => [entry.caseId, entry]));
	const packetCaseIds = new Set();
	const updates = [];
	const errors = [];

	for (const packetCase of packetReview.cases) {
		if (packetCaseIds.has(packetCase.caseId)) {
			errors.push(`${packetCase.caseId}: duplicated in packet.`);
			continue;
		}
		packetCaseIds.add(packetCase.caseId);
		const reviewCase = reviewById.get(packetCase.caseId);
		if (!reviewCase) {
			errors.push(`${packetCase.caseId}: found in packet but not in review JSON.`);
			continue;
		}
		validateChecklist(reviewCase.traitChecks, packetCase.traitChecks, `${packetCase.caseId}: traitChecks`, errors);
		validateChecklist(
			reviewCase.safetyCaveatChecks,
			packetCase.safetyCaveatChecks,
			`${packetCase.caseId}: safetyCaveatChecks`,
			errors
		);
		validateSignalChecklist(
			reviewCase.requiredConfirmationChecks,
			packetCase.requiredConfirmationChecks,
			`${packetCase.caseId}: requiredConfirmationChecks`,
			errors
		);
		validateSignalChecklist(
			reviewCase.safetyFlagChecks,
			packetCase.safetyFlagChecks,
			`${packetCase.caseId}: safetyFlagChecks`,
			errors
		);
		updates.push({ reviewCase, packetCase });
	}

	const missingCases = review.cases
		.map((entry) => entry.caseId)
		.filter((caseId) => !packetCaseIds.has(caseId));
	if (!options.allowPartial && missingCases.length) {
		errors.push(
			`packet is missing ${missingCases.length} review case(s): ${formatCaseList(missingCases)}. Use --allow-partial only for intentional smoke or incremental packet updates.`
		);
	}

	if (errors.length) {
		throw new Error(`Review packet did not match review JSON:\n- ${errors.join('\n- ')}`);
	}
	for (const { reviewCase, packetCase } of updates) {
		reviewCase.rating = packetCase.rating;
		reviewCase.notes = packetCase.notes;
		reviewCase.failureCategories = packetCase.failureCategories;
		reviewCase.ownerLayer = packetCase.ownerLayer;
		reviewCase.improvementTask = packetCase.improvementTask;
		copyChecklistValues(reviewCase.traitChecks, packetCase.traitChecks);
		copyChecklistValues(reviewCase.safetyCaveatChecks, packetCase.safetyCaveatChecks);
		copySignalChecklistValues(reviewCase.requiredConfirmationChecks, packetCase.requiredConfirmationChecks);
		copySignalChecklistValues(reviewCase.safetyFlagChecks, packetCase.safetyFlagChecks);
	}
	const updatedCases = updates.length;
	return { updatedCases, missingCases };
}

function extractCaseBlocks(markdown) {
	const headingPattern = /^##\s+(DLA-\d{3})\s+-\s+(.+)$/gmu;
	const matches = [...markdown.matchAll(headingPattern)];
	return matches.map((match, index) => {
		const start = match.index + match[0].length;
		const end = matches[index + 1]?.index ?? markdown.length;
		return {
			caseId: match[1],
			title: match[2],
			body: markdown.slice(start, end)
		};
	});
}

function parseChecklist({ block, startLabel, endLabel, caseId, fieldName, errors }) {
	const start = block.indexOf(startLabel);
	if (start === -1) return [];
	const afterStart = block.slice(start + startLabel.length);
	const end = afterStart.indexOf(endLabel);
	const section = end === -1 ? afterStart : afterStart.slice(0, end);
	return section
		.split(/\r?\n/u)
		.map((line) => line.trim())
		.filter((line) => line.startsWith('- passed:'))
		.map((line, index) => parseChecklistLine(line, `${caseId}: ${fieldName}[${index}]`, errors));
}

function parseChecklistLine(line, label, errors) {
	const match = line.match(/^- passed:\s*([^|]*?)\s*\|\s*text:\s*(.*?)\s*\|\s*notes:\s*(.*)$/u);
	if (!match) {
		errors.push(`${label}: expected "- passed: true|false|null | text: ... | notes: ..."`);
		return { text: '', passed: null, notes: '' };
	}
	return {
		passed: parseBooleanChoice(match[1], label, 'passed', errors),
		text: match[2].trim(),
		notes: match[3].trim()
	};
}

function parseSignalChecklist({ block, startLabel, endLabel, caseId, fieldName, errors }) {
	const start = block.indexOf(startLabel);
	if (start === -1) return [];
	const afterStart = block.slice(start + startLabel.length);
	const end = afterStart.indexOf(endLabel);
	const section = end === -1 ? afterStart : afterStart.slice(0, end);
	return section
		.split(/\r?\n/u)
		.map((line) => line.trim())
		.filter((line) => line.startsWith('- acknowledged:'))
		.map((line, index) => parseSignalChecklistLine(line, `${caseId}: ${fieldName}[${index}]`, errors));
}

function parseSignalChecklistLine(line, label, errors) {
	const match = line.match(/^- acknowledged:\s*([^|]*?)\s*\|\s*text:\s*(.*?)\s*\|\s*notes:\s*(.*)$/u);
	if (!match) {
		errors.push(`${label}: expected "- acknowledged: true|false|null | text: ... | notes: ..."`);
		return { text: '', acknowledged: null, notes: '' };
	}
	return {
		acknowledged: parseBooleanChoice(match[1], label, 'acknowledged', errors),
		text: match[2].trim(),
		notes: match[3].trim()
	};
}

function parseBooleanChoice(value, label, fieldName, errors) {
	const normalized = String(value ?? '').trim().toLowerCase();
	if (!normalized || normalized === 'null' || normalized === 'n/a' || normalized === 'na') return null;
	if (['true', 'yes', 'y', 'pass', 'passed'].includes(normalized)) return true;
	if (['false', 'no', 'n', 'fail', 'failed'].includes(normalized)) return false;
	errors.push(`${label}: ${fieldName} must be true, false, or null; got "${value}".`);
	return null;
}

function parseField(block, fieldName) {
	const escaped = fieldName.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&');
	const match = block.match(new RegExp(`^- ${escaped}:[ \\t]*(.*)$`, 'mu'));
	return match ? match[1].trim() : null;
}

function parseRating(value, caseId, errors) {
	const text = String(value ?? '').trim();
	if (!text || text.toLowerCase() === 'null') return null;
	const rating = Number(text);
	if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
		errors.push(`${caseId}: rating must be an integer 1-5 or blank, got "${value}".`);
		return null;
	}
	return rating;
}

function splitList(value) {
	return String(value ?? '')
		.split(/[;,]/u)
		.map((item) => item.trim())
		.filter(Boolean);
}

function validateChecklist(reviewChecks, packetChecks, label, errors) {
	if (!packetChecks.length) return;
	if (!Array.isArray(reviewChecks)) {
		errors.push(`${label}: review JSON checklist is missing.`);
		return;
	}
	if (reviewChecks.length !== packetChecks.length) {
		errors.push(`${label}: packet has ${packetChecks.length} checks but review JSON has ${reviewChecks.length}.`);
		return;
	}
	for (const [index, packetCheck] of packetChecks.entries()) {
		const reviewCheck = reviewChecks[index];
		if (reviewCheck.text !== packetCheck.text) {
			errors.push(`${label}[${index}]: packet text does not match review JSON.`);
		}
	}
}

function validateSignalChecklist(reviewChecks, packetChecks, label, errors) {
	if (!packetChecks.length) return;
	if (!Array.isArray(reviewChecks)) {
		errors.push(`${label}: review JSON checklist is missing.`);
		return;
	}
	if (reviewChecks.length !== packetChecks.length) {
		errors.push(`${label}: packet has ${packetChecks.length} checks but review JSON has ${reviewChecks.length}.`);
		return;
	}
	for (const [index, packetCheck] of packetChecks.entries()) {
		const reviewCheck = reviewChecks[index];
		if (reviewCheck.text !== packetCheck.text) {
			errors.push(`${label}[${index}]: packet text does not match review JSON.`);
		}
	}
}

function copyChecklistValues(reviewChecks, packetChecks) {
	if (!packetChecks.length) return;
	for (const [index, packetCheck] of packetChecks.entries()) {
		reviewChecks[index].passed = packetCheck.passed;
		reviewChecks[index].notes = packetCheck.notes;
	}
}

function copySignalChecklistValues(reviewChecks, packetChecks) {
	if (!packetChecks.length) return;
	for (const [index, packetCheck] of packetChecks.entries()) {
		reviewChecks[index].acknowledged = packetCheck.acknowledged;
		reviewChecks[index].notes = packetCheck.notes;
	}
}

function formatCaseList(caseIds) {
	const preview = caseIds.slice(0, 10).join(', ');
	const suffix = caseIds.length > 10 ? `, and ${caseIds.length - 10} more` : '';
	return `${preview}${suffix}`;
}

function resolveInputPath(value) {
	const text = String(value);
	if (text === '~') return process.env.HOME ?? text;
	if (text.startsWith('~/')) return resolve(process.env.HOME ?? REPO_ROOT, text.slice(2));
	return resolve(REPO_ROOT, text);
}

function isDirectRun() {
	return resolve(process.argv[1] ?? '') === fileURLToPath(import.meta.url);
}
