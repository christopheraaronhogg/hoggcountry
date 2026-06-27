import { execFile } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, relative, resolve } from 'node:path';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';
import {
	inspectDeviceRun
} from './lib/scout-local-ai-device-run-inspector.mjs';
import {
	parseCliArgs
} from './lib/scout-local-ai-review.mjs';
import {
	parseScoutEvalRunJson
} from './lib/scout-local-ai-run-json.mjs';

const execFileAsync = promisify(execFile);
const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(SCRIPT_DIR, '..');

const DEFAULT_SUITE = 'data/scout-local-ai/dad-local-ai-100.json';
const DEFAULT_INBOX_DIR = 'data/scout-local-ai/inbox';
const DEFAULT_DEVICE_RUN_DIR = 'data/scout-local-ai/device-runs';
const DEFAULT_REVIEW_DIR = 'data/scout-local-ai/reviews';
const DEFAULT_PACKET_DIR = 'data/scout-local-ai/review-packets';

const cli = parseCliArgs(process.argv.slice(2));
const inputMode = cli.run ?? cli.input ?? (cli.stdin ? '-' : null) ?? (cli.clipboard || cli.fromClipboard ? 'clipboard' : null);

if (!inputMode) {
	throw new Error([
		'Usage: npm run receive:scout-local-ai-device-run -- --input ~/Downloads/<device-export>.json',
		'       npm run receive:scout-local-ai-device-run -- --stdin < shared-export.json',
		'       npm run receive:scout-local-ai-device-run -- --clipboard',
		'This saves Dad/Chris shared Scout Eval Lab JSON into data/scout-local-ai/inbox/, inspects it, and prepares review only when the export is eligible.',
		'Add --no-prepare to save/inspect without creating review files.'
	].join('\n'));
}

const suitePath = resolveInputPath(cli.suite ?? DEFAULT_SUITE);
const suite = JSON.parse(await readFile(suitePath, 'utf8'));
const inboxDir = resolveInputPath(cli.inboxDir ?? DEFAULT_INBOX_DIR);
const input = await readSharedInput(inputMode);
const parsedInput = parseScoutEvalRunJson(input.text);
const run = parsedInput.run;
const saved = await saveInboxRun(run, inboxDir);
const inspection = inspectDeviceRun({ run, suite, inputPath: saved.path });
const allowPartial = Boolean(cli.allowPartial);
const shouldPrepare = !cli.noPrepare;
const canPrepare = shouldPrepare && (inspection.readyForFinalIntake || (allowPartial && inspection.readyForPartialIntake));
const prepare = canPrepare
	? await prepareReview({
		runPath: saved.path,
		suitePath,
		allowPartial,
		deviceRunDir: resolveInputPath(cli.deviceRunDir ?? DEFAULT_DEVICE_RUN_DIR),
		reviewDir: resolveInputPath(cli.reviewDir ?? DEFAULT_REVIEW_DIR),
		packetDir: resolveInputPath(cli.packetDir ?? DEFAULT_PACKET_DIR),
		force: Boolean(cli.force)
	})
	: null;

const report = {
	schemaVersion: 1,
	status: receiveStatus({ inspection, prepare, shouldPrepare, allowPartial }),
	input: {
		mode: input.mode,
		path: input.path ? relative(REPO_ROOT, input.path) : null,
		extractedJson: parsedInput.extractedJson
	},
	inbox: {
		path: relative(REPO_ROOT, saved.path),
		alreadyExisted: saved.alreadyExisted,
		hash: saved.hash
	},
	inspection,
	prepare,
	nextAction: nextAction({ inspection, prepare, shouldPrepare, allowPartial, savedPath: saved.path })
};

if (cli.json) {
	console.log(JSON.stringify(report, null, 2));
} else {
	console.log(formatReport(report));
}

async function readSharedInput(mode) {
	if (mode === '-' || mode === 'stdin') {
		return {
			mode: 'stdin',
			path: null,
			text: await readStdin()
		};
	}
	if (mode === 'clipboard') {
		const result = await execFileAsync('pbpaste', [], { maxBuffer: 1024 * 1024 * 80 });
		return {
			mode: 'clipboard',
			path: null,
			text: result.stdout
		};
	}
	const path = resolveInputPath(mode);
	return {
		mode: 'file',
		path,
		text: await readFile(path, 'utf8')
	};
}

async function saveInboxRun(run, inboxDir) {
	await mkdir(inboxDir, { recursive: true });
	const text = `${JSON.stringify(run, null, 2)}\n`;
	const hash = createHash('sha256').update(text).digest('hex');
	const base = safeFileName(run.runId || `scout-eval-${hash.slice(0, 12)}`);
	const candidates = [
		resolve(inboxDir, `${base}.json`),
		resolve(inboxDir, `${base}-${hash.slice(0, 12)}.json`)
	];
	for (let index = 2; index < 100; index += 1) {
		candidates.push(resolve(inboxDir, `${base}-${hash.slice(0, 12)}-${index}.json`));
	}
	for (const path of candidates) {
		const existing = await readOptional(path);
		if (existing === text) {
			return { path, alreadyExisted: true, hash };
		}
		if (existing === null) {
			await writeFile(path, text);
			return { path, alreadyExisted: false, hash };
		}
	}
	throw new Error(`Could not choose an unused inbox filename for ${base}.`);
}

async function prepareReview({ runPath, suitePath, allowPartial, deviceRunDir, reviewDir, packetDir, force }) {
	const args = [
		'scripts/prepare-scout-local-ai-device-review.mjs',
		'--run',
		runPath,
		'--suite',
		suitePath,
		'--device-run-dir',
		deviceRunDir,
		'--review-dir',
		reviewDir,
		'--packet-dir',
		packetDir,
		'--json'
	];
	if (allowPartial) args.push('--allow-partial');
	if (force) args.push('--force');
	const result = await execFileAsync(process.execPath, args, {
		cwd: REPO_ROOT,
		maxBuffer: 1024 * 1024 * 24
	});
	return JSON.parse(result.stdout);
}

function receiveStatus({ inspection, prepare, shouldPrepare, allowPartial }) {
	if (prepare) return prepare.status;
	if (inspection.readyForFinalIntake) return shouldPrepare ? 'saved-final-ready' : 'saved-final-ready-no-prepare';
	if (inspection.readyForPartialIntake) return allowPartial ? 'saved-partial-ready' : 'saved-partial-diagnostic';
	return 'saved-blocked-before-review';
}

function nextAction({ inspection, prepare, shouldPrepare, allowPartial, savedPath }) {
	const runArg = relative(REPO_ROOT, savedPath);
	if (prepare?.nextAction) return prepare.nextAction;
	if (inspection.readyForFinalIntake && shouldPrepare) {
		return `Prepare review with npm run prepare-review:scout-local-ai-device-run -- --run ${runArg}.`;
	}
	if (inspection.readyForFinalIntake) {
		return `Saved final-ready export. Prepare review when ready with npm run prepare-review:scout-local-ai-device-run -- --run ${runArg}.`;
	}
	if (inspection.readyForPartialIntake && !allowPartial) {
		return `Saved diagnostic export. Finish Run 100 on the TestFlight iPhone for final proof, or rerun receive with --allow-partial only to debug this partial export.`;
	}
	if (inspection.readyForPartialIntake) {
		return `Saved partial diagnostic export. Prepare diagnostic review with npm run prepare-review:scout-local-ai-device-run -- --run ${runArg} --allow-partial.`;
	}
	return 'Saved the blocked export for inspection only. Fix or rerun Scout Eval Lab before review work starts.';
}

function formatReport(report) {
	const lines = [
		`# Scout local AI device run receive: ${report.status}`,
		'',
		`- Source: ${report.input.mode}${report.input.path ? ` (${report.input.path})` : ''}`,
		`- Extracted JSON from surrounding text: ${report.input.extractedJson ? 'yes' : 'no'}`,
		`- Inbox file: \`${report.inbox.path}\`${report.inbox.alreadyExisted ? ' (already existed)' : ''}`,
		`- Inspection: ${report.inspection.status}`,
		`- Run: ${report.inspection.run.runId}`,
		`- Cases: ${report.inspection.run.caseCount}/${report.inspection.suite.caseCount}`,
		`- Prepare status: ${report.prepare?.status ?? 'not run'}`,
		'',
		'## Next action',
		'',
		report.nextAction,
		''
	];
	appendList(lines, 'Structural errors', report.inspection.structuralErrors);
	appendList(lines, 'Stale suite reasons', report.inspection.staleReasons);
	appendList(lines, 'Proof context problems', report.inspection.contextProblems);
	appendList(lines, 'Warnings', report.inspection.warnings, report.inspection.warningCount);
	return lines.join('\n');
}

function appendList(lines, label, items, total = items.length) {
	if (!items?.length) return;
	lines.push('', `${label}:`);
	for (const item of items) lines.push(`- ${item}`);
	if (total > items.length) lines.push(`- ... ${total - items.length} more`);
}

async function readOptional(path) {
	try {
		return await readFile(path, 'utf8');
	} catch {
		return null;
	}
}

async function readStdin() {
	let text = '';
	process.stdin.setEncoding('utf8');
	for await (const chunk of process.stdin) text += chunk;
	return text;
}

function safeFileName(value) {
	return String(value ?? 'scout-eval-export')
		.trim()
		.toLowerCase()
		.replace(/[^a-z0-9._-]+/gu, '-')
		.replace(/^-+|-+$/gu, '')
		.slice(0, 96) || 'scout-eval-export';
}

function resolveInputPath(value) {
	const text = String(value);
	if (text === '~') return process.env.HOME ?? text;
	if (text.startsWith('~/')) return resolve(process.env.HOME ?? REPO_ROOT, text.slice(2));
	return resolve(REPO_ROOT, text);
}
