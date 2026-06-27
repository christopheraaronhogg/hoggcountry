import { readFile } from 'node:fs/promises';
import { dirname, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
	inspectDeviceRun
} from './lib/scout-local-ai-device-run-inspector.mjs';
import {
	parseCliArgs
} from './lib/scout-local-ai-review.mjs';
import {
	readScoutEvalRunJson
} from './lib/scout-local-ai-run-json.mjs';

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(SCRIPT_DIR, '..');
const DEFAULT_SUITE = 'data/scout-local-ai/dad-local-ai-100.json';

const cli = parseCliArgs(process.argv.slice(2));
const input = cli.run ?? cli.input;

if (!input) {
	throw new Error([
		'Usage: npm run inspect:scout-local-ai-device-run -- --run ~/Downloads/<device-export>.json',
		'This is read-only. It does not copy the export or create review files.'
	].join('\n'));
}

const inputPath = resolveInputPath(input);
const suitePath = resolveInputPath(cli.suite ?? DEFAULT_SUITE);
const suite = JSON.parse(await readFile(suitePath, 'utf8'));
const { run } = await readScoutEvalRunJson(inputPath);
const report = inspectDeviceRun({ run, suite, inputPath });

if (cli.json) {
	console.log(JSON.stringify(report, null, 2));
} else {
	console.log(formatReport(report));
}

function formatReport(report) {
	const lines = [
		`Scout local AI device export inspection: ${report.status}`,
		`- File: ${report.inputPath}`,
		`- Run: ${report.run.runId}`,
		`- Lane: ${report.run.evidenceLane}`,
		`- Suite: ${report.run.suiteId} ${report.run.suiteVersion} (${report.run.suiteHash})`,
		`- Current suite: ${report.suite.suiteId} ${report.suite.version} (${report.suite.hash})`,
		`- Cases: ${report.run.caseCount}/${report.suite.caseCount}`,
		`- App: ${report.run.appVersion} (${report.run.appBuild}) via ${report.run.installSource}`,
		`- Native/model: ${report.run.nativePlatform} / ${report.run.modelId}`,
		`- Required-tool complete: ${report.summary.requiredToolComplete}/${report.run.caseCount}`,
		`- Source-evidence complete: ${report.summary.sourceEvidenceComplete}/${report.run.caseCount}`,
		`- Provider errors: ${report.summary.errorCases}`,
		''
	];

	if (report.handoff) {
		lines.push(
			`- Handoff: ${report.handoff.label} (${report.handoff.expectedAcceptanceStatus})`,
			`- Handoff command: ${report.handoff.prepareReviewCommand}`,
			`- Handoff inbox: ${report.handoff.reviewInboxPath}`,
			`- Handoff boundary: ${report.handoff.proofBoundary}`,
			''
		);
		appendList(lines, 'Handoff proof-context problems', report.handoff.proofContextProblems);
	}

	if (report.readyForFinalIntake) {
		lines.push('Result: ready for full TestFlight/iPhone intake and review.', '', 'Next:', report.nextCommand);
	} else if (report.readyForPartialIntake) {
		lines.push('Result: useful as a partial/smoke diagnostic, not final Dad proof.', '', 'Next:', report.nextCommand);
	} else {
		lines.push('Result: do not import as a final Dad proof export yet.');
	}

	appendList(lines, 'Structural errors', report.structuralErrors);
	appendList(lines, 'Stale suite reasons', report.staleReasons);
	appendList(lines, 'Proof context problems', report.contextProblems);
	appendList(lines, 'Warnings', report.warnings, report.warningCount);
	return `${lines.join('\n')}\n`;
}

function appendList(lines, label, items, total = items.length) {
	if (!items.length) return;
	lines.push('', `${label}:`);
	for (const item of items) lines.push(`- ${item}`);
	if (total > items.length) lines.push(`- ... ${total - items.length} more`);
}

function resolveInputPath(value) {
	const text = String(value);
	if (text === '~') return process.env.HOME ?? text;
	if (text.startsWith('~/')) return resolve(process.env.HOME ?? REPO_ROOT, text.slice(2));
	return resolve(REPO_ROOT, text);
}
