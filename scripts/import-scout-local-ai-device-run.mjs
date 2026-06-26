import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
	createReviewTemplate,
	parseCliArgs
} from './lib/scout-local-ai-review.mjs';
import {
	validateScoutLocalAiSuiteIdentity
} from './lib/scout-local-ai-suite.mjs';

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

const run = JSON.parse(await readFile(inputPath, 'utf8'));
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
if (validation.warnings.length) {
	console.log(`Warnings: ${validation.warnings.length}`);
	for (const warning of validation.warnings.slice(0, 8)) console.log(`- ${warning}`);
}
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
			warnings.push(`${result.caseId}: answerOrigin ${result.answerOrigin ?? '<missing>'} differs from run.evidenceLane ${run.evidenceLane}`);
		}
		if (typeof result.answer !== 'string') errors.push(`${result.caseId}: answer must be a string`);
		if (!result.answer && !result.error) warnings.push(`${result.caseId}: answer is empty and no error was recorded`);
		if (!result.toolExpectations || !Array.isArray(result.toolExpectations.missing)) {
			errors.push(`${result.caseId}: toolExpectations.missing must be present`);
		}
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

	return { errors, warnings };
}

function createReviewPacket(run, validation, importedRunPath, reviewPath, packetPath) {
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
		'',
		'Use this packet for human reading. Fill the checklist passed values and Reviewer fields here, then apply it back into the review JSON before running the review/backlog command.',
		'',
		'After filling this packet, run:',
		'',
		'```sh',
		`npm run apply-review:scout-local-ai -- --packet ${relative(REPO_ROOT, packetPath)} --review ${relative(REPO_ROOT, reviewPath)}`,
		'```',
		'',
		'Then validate ratings and create the iteration backlog:',
		'',
		'```sh',
		`npm run review:scout-local-ai -- --run ${relative(REPO_ROOT, importedRunPath)} --review ${relative(REPO_ROOT, reviewPath)}`,
		'```',
		''
	];

	if (validation.warnings.length) {
		lines.push('## Import warnings', '');
		for (const warning of validation.warnings) lines.push(`- ${warning}`);
		lines.push('');
	}

	for (const result of run.results) {
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
			'Source receipts:',
			...formatReceipts(result.receipts),
			'',
			'Required confirmations:',
			...formatConfirmations(result.requiredConfirmations),
			'',
			'Safety flags:',
			...formatSafetyFlags(result.safetyFlags),
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
	return confirmations.map((confirmation) => `- ${confirmation.id ?? '<missing>'}: ${confirmation.prompt ?? '(no prompt)'} (${confirmation.reason ?? 'reason unknown'})`);
}

function formatSafetyFlags(flags) {
	if (!Array.isArray(flags) || !flags.length) return ['- none'];
	return flags.map((flag) => `- ${flag.severity ?? 'unknown'}: ${flag.message ?? flag.id ?? '(no message)'}`);
}

function formatStringList(items) {
	if (!Array.isArray(items) || !items.length) return ['- none recorded'];
	return items.map((item) => `- ${item}`);
}

function compactJson(value) {
	const text = JSON.stringify(value);
	return text.length > 500 ? `${text.slice(0, 497)}...` : text;
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
