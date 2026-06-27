import { execFile } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { dirname, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import {
	parseCliArgs
} from './lib/scout-local-ai-review.mjs';

const execFileAsync = promisify(execFile);
const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(SCRIPT_DIR, '..');
const DEFAULT_SUITE = 'data/scout-local-ai/dad-local-ai-100.json';
const DEFAULT_BACKLOG_DIR = 'data/scout-local-ai/backlog';

const cli = parseCliArgs(process.argv.slice(2));

if (!cli.packet || !cli.review) {
	throw new Error([
		'Usage: npm run finalize-review:scout-local-ai -- --packet data/scout-local-ai/review-packets/<run>.review.md --review data/scout-local-ai/reviews/<run>.review.json',
		'Optional: --run data/scout-local-ai/device-runs/<run>.json --backlog-dir data/scout-local-ai/backlog --proof-out data/scout-local-ai/final-proof/<run>.proof.md',
		'This applies the human packet, checks review status, then runs the safe next validation step only when ready.'
	].join('\n'));
}

const packetPath = resolveInputPath(cli.packet);
const reviewPath = resolveInputPath(cli.review);
const suitePath = resolveInputPath(cli.suite ?? DEFAULT_SUITE);
const backlogDir = resolveInputPath(cli.backlogDir ?? DEFAULT_BACKLOG_DIR);
const proofOut = cli.proofOut ? resolveInputPath(cli.proofOut) : null;
const runPath = await resolveRunPath({ run: cli.run, reviewPath });

const commands = [];
const applyArgs = [
	'--packet',
	packetPath,
	'--review',
	reviewPath,
	'--run',
	runPath
];
if (cli.allowPartial) applyArgs.push('--allow-partial');
commands.push(await runTextScript('scripts/apply-scout-local-ai-review-packet.mjs', applyArgs));

const reviewStatus = await runJsonScript('scripts/status-scout-local-ai-review.mjs', [
	'--suite',
	suitePath,
	'--run',
	runPath,
	'--review',
	reviewPath,
	'--json'
]);
let status = 'review-needs-work';
let reviewOutput = null;
let proofOutput = null;
let nextAction = reviewStatus.nextAction;

if (reviewStatus.readyForStrictDeviceProof) {
	reviewOutput = await writeBacklog({ runPath, reviewPath, backlogDir });
	const proofArgs = [
		'--suite',
		suitePath,
		'--run',
		runPath,
		'--review',
		reviewPath
	];
	if (proofOut) proofArgs.push('--proof-out', proofOut);
	proofOutput = await runTextScript('scripts/verify-scout-local-ai-device-proof.mjs', proofArgs);
	status = 'strict-device-proof-passed';
	nextAction = 'Collect a second distinct full TestFlight/iPhone 5/5 run for stability proof.';
} else if (reviewStatus.readyForBacklog && reviewStatus.summary.belowFive > 0) {
	reviewOutput = await writeBacklog({ runPath, reviewPath, backlogDir });
	status = 'iteration-backlog-written';
	nextAction = 'Plan and execute the iteration backlog, then rerun the full device suite.';
} else if (reviewStatus.readyForBacklog && !reviewStatus.fullDeviceRun) {
	reviewOutput = await writeBacklog({ runPath, reviewPath, backlogDir });
	status = 'nonfinal-review-recorded';
	nextAction = 'Collect a full current-suite TestFlight/iPhone Run 100 before strict proof.';
} else if (reviewStatus.readyForBacklog && reviewStatus.strictDeviceProofErrors.length) {
	status = 'strict-device-proof-blocked';
	nextAction = `Fix the proof input before writing final proof; first issue: ${reviewStatus.strictDeviceProofErrors[0]}`;
}

const report = {
	schemaVersion: 1,
	status,
	paths: {
		packet: relative(REPO_ROOT, packetPath),
		run: relative(REPO_ROOT, runPath),
		review: relative(REPO_ROOT, reviewPath),
		backlogDir: relative(REPO_ROOT, backlogDir),
		proofOut: proofOut ? relative(REPO_ROOT, proofOut) : null
	},
	reviewStatus,
	commands: {
		applyReview: textLines(commands.join('\n')),
		review: reviewOutput ? textLines(reviewOutput) : [],
		proof: proofOutput ? textLines(proofOutput) : []
	},
	nextAction
};

if (cli.json) {
	console.log(JSON.stringify(report, null, 2));
} else {
	console.log(formatReport(report));
}

async function resolveRunPath(input) {
	if (input.run) return resolveInputPath(input.run);
	const review = JSON.parse(await readFile(input.reviewPath, 'utf8'));
	if (!review.runPath) {
		throw new Error('Review JSON is missing runPath. Pass --run data/scout-local-ai/device-runs/<run>.json.');
	}
	return resolveInputPath(review.runPath);
}

async function writeBacklog({ runPath, reviewPath, backlogDir }) {
	return runTextScript('scripts/review-scout-local-ai-eval.mjs', [
		'--run',
		runPath,
		'--review',
		reviewPath,
		'--backlog-dir',
		backlogDir
	]);
}

async function runJsonScript(script, args) {
	const result = await execFileAsync(process.execPath, [script, ...args], {
		cwd: REPO_ROOT,
		maxBuffer: 1024 * 1024 * 12
	});
	return JSON.parse(result.stdout);
}

async function runTextScript(script, args) {
	const result = await execFileAsync(process.execPath, [script, ...args], {
		cwd: REPO_ROOT,
		maxBuffer: 1024 * 1024 * 12
	});
	return result.stdout;
}

function formatReport(report) {
	const lines = [
		`# Scout local AI review finalizer: ${report.status}`,
		'',
		`Run: \`${report.paths.run}\``,
		`Review: \`${report.paths.review}\``,
		`Packet: \`${report.paths.packet}\``,
		'',
		'## Review Status',
		'',
		`- Rated: ${report.reviewStatus.summary.rated}/${report.reviewStatus.summary.total}`,
		`- 5/5: ${report.reviewStatus.summary.fiveStar}`,
		`- Below 5: ${report.reviewStatus.summary.belowFive}`,
		`- Unrated: ${report.reviewStatus.summary.unrated}`,
		`- Invalid review issues: ${report.reviewStatus.summary.invalidCount}`,
		`- Ready for backlog: ${report.reviewStatus.readyForBacklog ? 'yes' : 'no'}`,
		`- Ready for strict device proof: ${report.reviewStatus.readyForStrictDeviceProof ? 'yes' : 'no'}`,
		''
	];
	if (report.commands.review.length) {
		lines.push('## Review Command Output', '', ...report.commands.review.map((line) => `- ${line}`), '');
	}
	if (report.commands.proof.length) {
		lines.push('## Proof Command Output', '', ...report.commands.proof.map((line) => `- ${line}`), '');
	}
	if (report.reviewStatus.invalidEntries.length) {
		lines.push('## Invalid Entries', '');
		for (const issue of report.reviewStatus.invalidEntries.slice(0, 25)) lines.push(`- ${issue}`);
		lines.push('');
	}
	if (report.reviewStatus.nextUnrated) {
		lines.push('## Next Unrated', '', `- ${report.reviewStatus.nextUnrated.caseId}: ${report.reviewStatus.nextUnrated.promptPreview}`, '');
	}
	lines.push('## Next Action', '', report.nextAction, '');
	return `${lines.join('\n')}\n`;
}

function textLines(value) {
	return String(value ?? '').trim().split(/\r?\n/u).filter(Boolean);
}

function resolveInputPath(value) {
	const text = String(value);
	if (text === '~') return process.env.HOME ?? text;
	if (text.startsWith('~/')) return resolve(process.env.HOME ?? REPO_ROOT, text.slice(2));
	return resolve(REPO_ROOT, text);
}
