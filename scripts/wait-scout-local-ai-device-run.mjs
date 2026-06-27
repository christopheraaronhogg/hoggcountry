import { execFile } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';
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
const DEFAULT_POLL_MS = 5000;
const DEFAULT_TIMEOUT_MS = 0;

const cli = parseCliArgs(process.argv.slice(2));
const pollMs = positiveNumber(cli.pollMs, DEFAULT_POLL_MS);
const timeoutMs = nonNegativeNumber(cli.timeoutMs, DEFAULT_TIMEOUT_MS);
const sourceOrder = sourceOrderFor(cli.source ?? cli.sources ?? 'both');
const startedAt = Date.now();
let attempts = 0;
let lastReport = null;
const sourceReports = {};

if (!sourceOrder.length) {
	throw new Error('Use --source inbox, --source downloads, or --source both.');
}

while (true) {
	attempts += 1;
	for (const source of sourceOrder) {
		const result = await tryPrepare(source);
		if (result.ok) {
			const report = {
				schemaVersion: 1,
				status: 'prepared-from-watch',
				source,
				attempts,
				waitedMs: Date.now() - startedAt,
				prepare: result.report,
				nextAction: result.report.nextAction
			};
			await writeOutput(report);
			process.exit(0);
		}
		lastReport = result.report ?? {
			status: 'prepare-command-failed',
			source,
			error: result.error
		};
		sourceReports[source] = {
			status: lastReport?.status ?? 'prepare-command-failed',
			error: result.error ?? null,
			inspectionStatus: lastReport?.inspection?.status ?? lastReport?.acceptance?.status ?? null,
			inputMode: lastReport?.input?.mode ?? null,
			runId: lastReport?.input?.runId ?? lastReport?.run?.runId ?? null
		};
	}

	const waitedMs = Date.now() - startedAt;
	if (timeoutMs > 0 && waitedMs >= timeoutMs) {
		const report = {
			schemaVersion: 1,
			status: 'timed-out',
			sources: sourceOrder,
			attempts,
			waitedMs,
			pollMs,
			lastReport,
			sourceReports,
			nextAction: 'Keep waiting, or save the shared Scout Eval Lab JSON into data/scout-local-ai/inbox/ or Downloads. Then run npm run prepare-review:scout-local-ai-device-run -- --run inbox for the repo inbox, or npm run prepare-review:scout-local-ai-device-run -- --run latest for Downloads.'
		};
		await writeOutput(report);
		process.exit(1);
	}

	if (!cli.json) {
		process.stderr.write(`Waiting for Scout Eval Lab Run 100 export (${sourceOrder.join(', ')}); attempt ${attempts}, waited ${formatDuration(waitedMs)}.\n`);
	}
	await delay(pollMs);
}

async function tryPrepare(source) {
	const args = [
		'scripts/prepare-scout-local-ai-device-review.mjs',
		'--run',
		source === 'downloads' ? 'latest' : 'inbox',
		'--suite',
		resolveInputPath(cli.suite ?? DEFAULT_SUITE),
		'--downloads-dir',
		resolveInputPath(cli.downloadsDir ?? DEFAULT_DOWNLOADS_DIR),
		'--inbox-dir',
		resolveInputPath(cli.inboxDir ?? DEFAULT_INBOX_DIR),
		'--device-run-dir',
		resolveInputPath(cli.deviceRunDir ?? DEFAULT_DEVICE_RUN_DIR),
		'--review-dir',
		resolveInputPath(cli.reviewDir ?? DEFAULT_REVIEW_DIR),
		'--packet-dir',
		resolveInputPath(cli.packetDir ?? DEFAULT_PACKET_DIR),
		'--json'
	];
	if (cli.allowPartial) args.push('--allow-partial');
	if (cli.force) args.push('--force');
	try {
		const result = await execFileAsync(process.execPath, args, {
			cwd: REPO_ROOT,
			maxBuffer: 1024 * 1024 * 12
		});
		return {
			ok: true,
			report: JSON.parse(result.stdout)
		};
	} catch (err) {
		const stdout = typeof err?.stdout === 'string' ? err.stdout.trim() : '';
		const stderr = typeof err?.stderr === 'string' ? err.stderr.trim() : '';
		return {
			ok: false,
			report: parseJson(stdout),
			error: stderr || err?.message || 'prepare command failed'
		};
	}
}

function sourceOrderFor(value) {
	const parts = String(value).split(',').map((part) => part.trim().toLowerCase()).filter(Boolean);
	const expanded = parts.flatMap((part) => {
		if (part === 'both' || part === 'all') return ['inbox', 'downloads'];
		if (part === 'latest' || part === 'download' || part === 'downloads') return ['downloads'];
		if (part === 'inbox' || part === 'latest-inbox') return ['inbox'];
		return [part];
	});
	return [...new Set(expanded)].filter((part) => part === 'inbox' || part === 'downloads');
}

function positiveNumber(value, fallback) {
	const parsed = Number(value);
	return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function nonNegativeNumber(value, fallback) {
	const parsed = Number(value);
	return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
}

function parseJson(value) {
	if (!value) return null;
	try {
		return JSON.parse(value);
	} catch {
		return null;
	}
}

async function writeOutput(report) {
	if (cli.json) {
		await writeStdout(JSON.stringify(report, null, 2));
		return;
	}
	await writeStdout(formatReport(report));
}

function writeStdout(text) {
	return new Promise((resolve, reject) => {
		process.stdout.write(`${text.replace(/\n?$/u, '\n')}`, (err) => {
			if (err) reject(err);
			else resolve();
		});
	});
}

function formatReport(report) {
	if (report.status === 'prepared-from-watch') {
		const paths = report.prepare?.paths ?? {};
		return [
			`# Scout local AI device run wait: ${report.status}`,
			'',
			`- Source: ${report.source}`,
			`- Attempts: ${report.attempts}`,
			`- Waited: ${formatDuration(report.waitedMs)}`,
			`- Imported run: \`${paths.importedRun ?? '<missing>'}\``,
			`- Review JSON: \`${paths.review ?? '<missing>'}\``,
			`- Review packet: \`${paths.packet ?? '<missing>'}\``,
			'',
			'## Next action',
			'',
			report.nextAction,
			''
		].join('\n');
	}
	return [
		`# Scout local AI device run wait: ${report.status}`,
		'',
		`- Sources: ${report.sources.join(', ')}`,
		`- Attempts: ${report.attempts}`,
		`- Waited: ${formatDuration(report.waitedMs)}`,
		`- Last status: ${report.lastReport?.status ?? '<none>'}`,
		'',
		'## Source status',
		'',
		...sourceStatusLines(report.sourceReports),
		'',
		'## Next action',
		'',
		report.nextAction,
		''
	].join('\n');
}

function sourceStatusLines(sourceReports) {
	if (!sourceReports || !Object.keys(sourceReports).length) {
		return ['- <none>'];
	}
	return Object.entries(sourceReports)
		.sort(([left], [right]) => left.localeCompare(right))
		.map(([source, report]) => {
			const pieces = [`status=${report.status ?? '<unknown>'}`];
			if (report.inspectionStatus) pieces.push(`inspection=${report.inspectionStatus}`);
			if (report.inputMode) pieces.push(`input=${report.inputMode}`);
			if (report.runId) pieces.push(`run=${report.runId}`);
			if (report.error) pieces.push(`error=${report.error}`);
			return `- ${source}: ${pieces.join('; ')}`;
		});
}

function formatDuration(ms) {
	if (!Number.isFinite(ms) || ms < 0) return 'unknown';
	if (ms < 1000) return `${Math.round(ms)}ms`;
	const seconds = ms / 1000;
	if (seconds < 60) return `${seconds.toFixed(1)}s`;
	const minutes = Math.floor(seconds / 60);
	const remainder = Math.round(seconds % 60);
	return `${minutes}m ${remainder}s`;
}

function resolveInputPath(value) {
	const text = String(value);
	if (text === '~') return process.env.HOME ?? text;
	if (text.startsWith('~/')) return resolve(process.env.HOME ?? REPO_ROOT, text.slice(2));
	return resolve(REPO_ROOT, text);
}
