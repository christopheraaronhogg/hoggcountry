import { execFile } from 'node:child_process';
import { readdir, readFile, stat } from 'node:fs/promises';
import { dirname, relative, resolve } from 'node:path';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';
import {
	inspectDeviceRun
} from './lib/scout-local-ai-device-run-inspector.mjs';
import {
	parseCliArgs
} from './lib/scout-local-ai-review.mjs';

const execFileAsync = promisify(execFile);
const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(SCRIPT_DIR, '..');

const DEFAULT_SUITE = 'data/scout-local-ai/dad-local-ai-100.json';
const DEFAULT_DEVICE_RUN_DIR = 'data/scout-local-ai/device-runs';
const DEFAULT_REVIEW_DIR = 'data/scout-local-ai/reviews';
const DEFAULT_PACKET_DIR = 'data/scout-local-ai/review-packets';
const DEFAULT_DOWNLOADS_DIR = '~/Downloads';
const DEFAULT_INBOX_DIR = 'data/scout-local-ai/inbox';

const cli = parseCliArgs(process.argv.slice(2));
const input = cli.run ?? cli.input ?? (cli.latestInbox ? 'inbox' : cli.latestDownload ? 'latest' : null);

if (!input) {
	throw new Error([
		'Usage: npm run prepare-review:scout-local-ai-device-run -- --run ~/Downloads/<device-export>.json',
		'       npm run prepare-review:scout-local-ai-device-run -- --run latest',
		'       npm run prepare-review:scout-local-ai-device-run -- --run inbox',
		'This inspects first, imports only valid device exports, then prints review progress.',
		'Add --downloads-dir <dir> with --run latest when the shared JSON is not in ~/Downloads.',
		'Drop shared iPhone exports into data/scout-local-ai/inbox/ and use --run inbox for a repo-local handoff.',
		'Add --allow-partial only for deliberate smoke/interrupted-run diagnostics.'
	].join('\n'));
}

const suitePath = resolveInputPath(cli.suite ?? DEFAULT_SUITE);
const suite = JSON.parse(await readFile(suitePath, 'utf8'));
const allowPartial = Boolean(cli.allowPartial);
const selectedInput = await resolveRunInput(input, {
	downloadsDir: resolveInputPath(cli.downloadsDir ?? DEFAULT_DOWNLOADS_DIR),
	inboxDir: resolveInputPath(cli.inboxDir ?? DEFAULT_INBOX_DIR),
	suite,
	allowPartial
});
const inputPath = selectedInput.path;
const deviceRunDir = resolveInputPath(cli.deviceRunDir ?? DEFAULT_DEVICE_RUN_DIR);
const reviewDir = resolveInputPath(cli.reviewDir ?? DEFAULT_REVIEW_DIR);
const packetDir = resolveInputPath(cli.packetDir ?? DEFAULT_PACKET_DIR);
const force = Boolean(cli.force);

const inspection = await runJsonScript('scripts/inspect-scout-local-ai-device-run.mjs', [
	'--run',
	inputPath,
	'--suite',
	suitePath,
	'--json'
]);

const canImportFinal = inspection.readyForFinalIntake === true;
const canImportPartial = allowPartial && inspection.readyForPartialIntake === true;

if (!canImportFinal && !canImportPartial) {
	const blocked = {
		schemaVersion: 1,
		status: inspection.readyForPartialIntake ? 'partial-needs-explicit-allow-partial' : 'inspection-blocked',
		imported: false,
		input: selectedInput.report,
		inspection,
		nextAction: inspection.readyForPartialIntake
			? `Rerun with --allow-partial only if this is a deliberate smoke/interrupted-run diagnostic; otherwise finish Run 100 on the phone first.`
			: 'Fix the export or rerun Scout Eval Lab before importing review files.'
	};
	writeOutput(blocked);
	process.exit(1);
}

const importArgs = [
	'--run',
	inputPath,
	'--suite',
	suitePath,
	'--device-run-dir',
	deviceRunDir,
	'--review-dir',
	reviewDir,
	'--packet-dir',
	packetDir
];
if (canImportPartial) importArgs.push('--allow-partial');
if (force) importArgs.push('--force');

const importOutput = await runTextScript('scripts/import-scout-local-ai-device-run.mjs', importArgs);
const run = JSON.parse(await readFile(inputPath, 'utf8'));
const safeRunId = safeFileName(run.runId);
const importedRunPath = resolve(deviceRunDir, `${safeRunId}.json`);
const reviewPath = resolve(reviewDir, `${safeRunId}.review.json`);
const packetPath = resolve(packetDir, `${safeRunId}.review.md`);
const relativeImportedRunPath = relative(REPO_ROOT, importedRunPath);
const relativeReviewPath = relative(REPO_ROOT, reviewPath);
const relativePacketPath = relative(REPO_ROOT, packetPath);

const reviewStatus = await runJsonScript('scripts/status-scout-local-ai-review.mjs', [
	'--suite',
	suitePath,
	'--run',
	importedRunPath,
	'--review',
	reviewPath,
	'--packet',
	packetPath,
	'--json'
]);

writeOutput({
	schemaVersion: 1,
	status: canImportFinal ? 'prepared-for-final-review' : 'prepared-for-partial-diagnostic-review',
	imported: true,
	partial: canImportPartial,
	input: selectedInput.report,
	paths: {
		importedRun: relativeImportedRunPath,
		review: relativeReviewPath,
		packet: relativePacketPath
	},
	inspection,
	reviewStatus,
	importOutput: importOutput.trim().split(/\r?\n/u).filter(Boolean),
	nextAction: `Fill ${relativePacketPath}, then preview draft progress with npm run review-status:scout-local-ai -- --run ${relativeImportedRunPath} --review ${relativeReviewPath} --packet ${relativePacketPath}. When the packet is fully rated, run npm run finalize-review:scout-local-ai -- --packet ${relativePacketPath} --run ${relativeImportedRunPath} --review ${relativeReviewPath}.`
});

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

async function resolveRunInput(value, options) {
	const text = String(value);
	if (text === 'latest' || text === 'latest-download' || text === 'latest-downloads') {
		return latestScoutEvalRun({
			dir: options.downloadsDir,
			mode: 'latest-download',
			dirLabel: 'downloadsDir',
			suite: options.suite,
			allowPartial: options.allowPartial
		});
	}
	if (text === 'inbox' || text === 'latest-inbox' || text === 'latest-inbox-export') {
		return latestScoutEvalRun({
			dir: options.inboxDir,
			mode: 'latest-inbox',
			dirLabel: 'inboxDir',
			suite: options.suite,
			allowPartial: options.allowPartial
		});
	}
	const path = resolveInputPath(text);
	return {
		path,
		report: {
			mode: 'explicit-run',
			path: relative(REPO_ROOT, path)
		}
	};
}

async function latestScoutEvalRun({ dir, mode, dirLabel, suite, allowPartial }) {
	const candidates = [];
	for (const entry of await readdir(dir, { withFileTypes: true })) {
		if (!entry.isFile() || !entry.name.toLowerCase().endsWith('.json')) continue;
		const path = resolve(dir, entry.name);
		const candidate = await readScoutEvalCandidate(path, suite);
		if (!candidate) continue;
		const stats = await stat(path);
		candidates.push({
			...candidate,
			path,
			mtimeMs: stats.mtimeMs
		});
	}
	candidates.sort((left, right) => right.mtimeMs - left.mtimeMs || left.path.localeCompare(right.path));
	const latest = candidates[0] ?? null;
	const selected = candidates.find((candidate) => candidate.readyForFinalIntake) ??
		(allowPartial ? candidates.find((candidate) => candidate.readyForPartialIntake) : null) ??
		latest;
	if (!selected) {
		throw new Error(`No likely Scout Eval Lab JSON exports found in ${dir}. Pass --run /path/to/<device-export>.json if the file is elsewhere.`);
	}
	const finalReadyCount = candidates.filter((candidate) => candidate.readyForFinalIntake).length;
	const partialDiagnosticCount = candidates.filter((candidate) => candidate.readyForPartialIntake).length;
	const blockedCandidateCount = candidates.filter((candidate) => !candidate.readyForFinalIntake && !candidate.readyForPartialIntake).length;
	return {
		path: selected.path,
		report: {
			mode,
			[dirLabel]: relative(REPO_ROOT, dir),
			selected: relative(REPO_ROOT, selected.path),
			selectedIsLatest: latest?.path === selected.path,
			selectedInspectionStatus: selected.inspectionStatus,
			selectedReadyForFinalIntake: selected.readyForFinalIntake,
			selectedReadyForPartialIntake: selected.readyForPartialIntake,
			latest: latest ? {
				path: relative(REPO_ROOT, latest.path),
				runId: latest.runId,
				caseCount: latest.caseCount,
				inspectionStatus: latest.inspectionStatus
			} : null,
			runId: selected.runId,
			suiteId: selected.suiteId,
			caseCount: selected.caseCount,
			candidateCount: candidates.length,
			finalReadyCount,
			partialDiagnosticCount,
			blockedCandidateCount
		}
	};
}

async function readScoutEvalCandidate(path, suite) {
	try {
		const parsed = JSON.parse(await readFile(path, 'utf8'));
		if (!parsed || typeof parsed !== 'object') return null;
		if (parsed.schemaVersion !== 1) return null;
		if (parsed.suiteId !== suite.suiteId) return null;
		if (typeof parsed.runId !== 'string' || !parsed.runId) return null;
		if (!Array.isArray(parsed.results)) return null;
		const inspection = inspectDeviceRun({ run: parsed, suite, inputPath: path });
		return {
			runId: parsed.runId,
			suiteId: parsed.suiteId,
			caseCount: typeof parsed.caseCount === 'number' ? parsed.caseCount : parsed.results.length,
			inspectionStatus: inspection.status,
			readyForFinalIntake: inspection.readyForFinalIntake,
			readyForPartialIntake: inspection.readyForPartialIntake
		};
	} catch {
		return null;
	}
}

function writeOutput(report) {
	if (cli.json) {
		console.log(JSON.stringify(report, null, 2));
		return;
	}
	console.log(formatReport(report));
}

function formatReport(report) {
	const lines = [
		`# Scout local AI device review prep: ${report.status}`,
		'',
		`Imported: ${report.imported ? 'yes' : 'no'}`,
		`Inspection status: ${report.inspection.status}`,
		`Ready for final intake: ${report.inspection.readyForFinalIntake ? 'yes' : 'no'}`,
		`Ready for partial intake: ${report.inspection.readyForPartialIntake ? 'yes' : 'no'}`,
		''
	];
	if (report.paths) {
		lines.push(
			'## Files',
			'',
			`- Imported run: \`${report.paths.importedRun}\``,
			`- Review JSON: \`${report.paths.review}\``,
			`- Review packet: \`${report.paths.packet}\``,
			''
		);
	}
	if (report.input?.mode === 'latest-download' || report.input?.mode === 'latest-inbox') {
		const sourceLabel = report.input.mode === 'latest-inbox' ? 'Inbox dir' : 'Downloads dir';
		const sourceDir = report.input.inboxDir ?? report.input.downloadsDir;
		lines.push(
			'## Selected Export',
			'',
			`- ${sourceLabel}: \`${sourceDir}\``,
			`- Selected: \`${report.input.selected}\``,
			`- Selected status: ${report.input.selectedInspectionStatus ?? 'not inspected'}`,
			`- Selected is newest candidate: ${report.input.selectedIsLatest ? 'yes' : 'no'}`,
			`- Candidate Scout exports: ${report.input.candidateCount}`,
			`- Final-ready / partial / blocked: ${report.input.finalReadyCount ?? 0}/${report.input.partialDiagnosticCount ?? 0}/${report.input.blockedCandidateCount ?? 0}`,
			''
		);
		if (report.input.latest && !report.input.selectedIsLatest) {
			lines.push(
				`- Newest candidate: \`${report.input.latest.path}\` (${report.input.latest.runId}, ${report.input.latest.caseCount} cases, ${report.input.latest.inspectionStatus})`,
				''
			);
		}
	}
	if (report.reviewStatus) {
		lines.push(
			'## Review Status',
			'',
			`- Rated: ${report.reviewStatus.summary.rated}/${report.reviewStatus.summary.total}`,
			`- Unrated: ${report.reviewStatus.summary.unrated}`,
			`- Below 5: ${report.reviewStatus.summary.belowFive}`,
			`- Invalid review issues: ${report.reviewStatus.summary.invalidCount}`,
			`- Ready for backlog: ${report.reviewStatus.readyForBacklog ? 'yes' : 'no'}`,
			`- Ready for strict device proof: ${report.reviewStatus.readyForStrictDeviceProof ? 'yes' : 'no'}`,
			''
		);
		if (report.reviewStatus.triageSummary) {
			lines.push(
				'## Triage Summary',
				'',
				`- Focus cases: ${report.reviewStatus.triageSummary.focusCount} (${report.reviewStatus.triageSummary.unrated} unrated, ${report.reviewStatus.triageSummary.belowFive} below 5)`,
				`- Signals: ${formatCountMap(report.reviewStatus.triageSummary.signals)}`,
				`- Likely owner layers: ${formatCountMap(report.reviewStatus.triageSummary.ownerLayers)}`,
				`- Failure categories: ${formatCountMap(report.reviewStatus.triageSummary.failureCategories)}`,
				`- Missing tools: ${formatCountMap(report.reviewStatus.triageSummary.missingTools)}`,
				`- Source-evidence gaps: ${formatCountMap(report.reviewStatus.triageSummary.sourceEvidence)}`,
				''
			);
		}
	}
	if (report.inspection.structuralErrors?.length || report.inspection.staleReasons?.length || report.inspection.contextProblems?.length) {
		lines.push('## Blocking Inspection Issues', '');
		for (const issue of [
			...(report.inspection.structuralErrors ?? []),
			...(report.inspection.staleReasons ?? []),
			...(report.inspection.contextProblems ?? [])
		].slice(0, 25)) {
			lines.push(`- ${issue}`);
		}
		lines.push('');
	}
	lines.push('## Next action', '', report.nextAction, '');
	return `${lines.join('\n')}\n`;
}

function safeFileName(value) {
	return String(value).replace(/[^A-Za-z0-9._-]/g, '-');
}

function formatCountMap(counts) {
	const entries = Object.entries(counts ?? {});
	if (!entries.length) return 'none';
	return entries.map(([key, count]) => `${key}=${count}`).join(', ');
}

function resolveInputPath(value) {
	const text = String(value);
	if (text === '~') return process.env.HOME ?? text;
	if (text.startsWith('~/')) return resolve(process.env.HOME ?? REPO_ROOT, text.slice(2));
	return resolve(REPO_ROOT, text);
}
