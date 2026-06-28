#!/usr/bin/env node

import { execFile } from 'node:child_process';
import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import { basename, dirname, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import { parseCliArgs, summarizeReview } from './lib/scout-local-ai-review.mjs';
import { sourceEvidenceProblems } from './lib/scout-local-ai-source-evidence.mjs';

const execFileAsync = promisify(execFile);
const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(SCRIPT_DIR, '..');
const DEFAULT_SUITE = 'data/scout-local-ai/dad-local-ai-100.json';
const DEFAULT_RUN_DIRS = ['data/scout-local-ai/device-runs', 'data/scout-local-ai/runs'];
const DEFAULT_REVIEW_DIR = 'data/scout-local-ai/reviews';
const DEFAULT_SCAN_DIR = 'data/scout-local-ai/answer-quality-scans';
const DEFAULT_OUTPUT_DIR = 'data/scout-local-ai/history';

const cli = parseCliArgs(process.argv.slice(2));

if (cli.help) {
	printUsage();
	process.exit(0);
}

if (!isImported()) {
	const history = await buildScoutLocalAiHistory({
		repoRoot: REPO_ROOT,
		suitePath: resolveInputPath(cli.suite ?? DEFAULT_SUITE),
		runDirs: parseList(cli.runDirs ?? cli.runDir ?? DEFAULT_RUN_DIRS.join(','), DEFAULT_RUN_DIRS).map(resolveInputPath),
		reviewDir: resolveInputPath(cli.reviewDir ?? DEFAULT_REVIEW_DIR),
		scanDir: resolveInputPath(cli.scanDir ?? DEFAULT_SCAN_DIR),
		includeGit: cli.git !== false && cli.git !== 'false'
	});
	const outputDir = resolveInputPath(cli.outputDir ?? DEFAULT_OUTPUT_DIR);
	await mkdir(outputDir, { recursive: true });
	const jsonPath = resolve(outputDir, String(cli.jsonName ?? 'scout-local-ai-history.json'));
	const htmlPath = resolve(outputDir, String(cli.htmlName ?? 'scout-local-ai-history.html'));
	await writeFile(jsonPath, `${JSON.stringify(history, null, 2)}\n`);
	await writeFile(htmlPath, renderScoutLocalAiHistoryHtml(history));
	console.log(formatHistorySummary(history, { jsonPath, htmlPath }));
}

export async function buildScoutLocalAiHistory({
	repoRoot = REPO_ROOT,
	suitePath = resolve(repoRoot, DEFAULT_SUITE),
	runDirs = DEFAULT_RUN_DIRS.map((path) => resolve(repoRoot, path)),
	reviewDir = resolve(repoRoot, DEFAULT_REVIEW_DIR),
	scanDir = resolve(repoRoot, DEFAULT_SCAN_DIR),
	includeGit = true
} = {}) {
	const suite = await readJsonFile(suitePath);
	const reviews = await loadJsonMap(reviewDir, (file, value) => reviewRunId(value) ?? runIdFromFile(file, '.review.json'));
	const scans = await loadJsonMap(scanDir, (file, value) => value?.runId ?? runIdFromFile(file, '.scan.json'));
	const commits = includeGit ? await loadGitCommits(repoRoot) : [];
	const runFiles = [];
	for (const runDir of runDirs) {
		runFiles.push(...await listJsonFiles(runDir));
	}

	const runRecords = [];
	const caseMap = new Map();
	for (const runPath of runFiles) {
		const run = await readJsonFile(runPath);
		if (!Array.isArray(run?.results)) continue;
		const runId = String(run.runId ?? runIdFromFile(runPath, '.json'));
		const review = reviews.get(runId) ?? null;
		const scan = scans.get(runId) ?? null;
		const sortTime = runSortTime(run);
		const reviewSummary = review?.cases ? summarizeReview(review) : null;
		const commit = commitAtOrBefore(commits, sortTime);
		const runRecord = buildRunRecord({ repoRoot, run, runPath, review, reviewSummary, scan, sortTime, commit });
		runRecords.push(runRecord);
		const reviewCases = new Map((review?.cases ?? []).map((entry) => [entry.caseId, entry]));
		const scanCases = new Map((scan?.flagged ?? []).map((entry) => [entry.caseId, entry]));
		for (const result of run.results) {
			const caseId = String(result.caseId ?? result.case?.id ?? '');
			if (!caseId) continue;
			const reviewEntry = reviewCases.get(caseId) ?? null;
			const scanEntry = scanCases.get(caseId) ?? null;
			if (!caseMap.has(caseId)) {
				caseMap.set(caseId, {
					caseId,
					domain: result.case?.domain ?? reviewEntry?.domain ?? null,
					phase: result.case?.phase ?? reviewEntry?.phase ?? null,
					prompt: result.case?.prompt ?? reviewEntry?.prompt ?? '',
					expectedTraits: result.case?.expectedTraits ?? reviewEntry?.expectedTraits ?? [],
					safetyCaveats: result.case?.safetyCaveats ?? reviewEntry?.safetyCaveats ?? [],
					history: []
				});
			}
			caseMap.get(caseId).history.push(buildCaseEntry({ result, reviewEntry, scanEntry, runRecord }));
		}
	}

	runRecords.sort(compareBySortTime);
	const runOrder = new Map(runRecords.map((run, index) => [run.runId, index]));
	const cases = [...caseMap.values()]
		.sort((a, b) => a.caseId.localeCompare(b.caseId))
		.map((record) => finalizeCaseHistory(record, runOrder));

	return {
		schemaVersion: 1,
		generatedAt: new Date().toISOString(),
		suite: {
			suiteId: suite.suiteId ?? null,
			version: suite.version ?? null,
			hash: suite.hash ?? suite.suiteHash ?? null,
			caseCount: Array.isArray(suite.cases) ? suite.cases.length : null,
			path: relative(repoRoot, suitePath)
		},
		source: {
			runDirs: runDirs.map((path) => relative(repoRoot, path)),
			reviewDir: relative(repoRoot, reviewDir),
			scanDir: relative(repoRoot, scanDir),
			gitCommitCount: commits.length
		},
		summary: buildHistorySummary(runRecords, cases),
		runs: runRecords,
		cases
	};
}

export function renderScoutLocalAiHistoryHtml(history) {
	const data = JSON.stringify(history).replace(/</gu, '\\u003c');
	return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Scout Local AI History</title>
<style>
:root {
	color-scheme: light;
	--bg: #f7f4ef;
	--ink: #1f2933;
	--muted: #667085;
	--line: #d8d0c4;
	--panel: #fffdfa;
	--good: #176b45;
	--warn: #9a5b11;
	--bad: #a23434;
	--accent: #275f86;
}
* { box-sizing: border-box; }
body {
	margin: 0;
	padding: 24px 24px 132px;
	background: var(--bg);
	color: var(--ink);
	font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
}
header { max-width: 1280px; margin: 0 auto 18px; }
h1 { margin: 0 0 8px; font-size: 28px; line-height: 1.15; }
.meta { color: var(--muted); margin: 0; }
.metrics {
	display: grid;
	grid-template-columns: repeat(5, minmax(120px, 1fr));
	gap: 10px;
	max-width: 1280px;
	margin: 0 auto 16px;
}
.metric, .panel, .case-list button, .answer-card {
	background: var(--panel);
	border: 1px solid var(--line);
	border-radius: 8px;
}
.metric { padding: 12px; }
.metric span, .label { display: block; color: var(--muted); font-size: 12px; text-transform: uppercase; letter-spacing: .04em; }
.metric strong { display: block; font-size: 22px; margin-top: 4px; }
main {
	max-width: 1280px;
	margin: 0 auto;
	display: grid;
	grid-template-columns: minmax(300px, 420px) minmax(0, 1fr);
	gap: 16px;
	align-items: start;
}
.panel { padding: 14px; }
.controls { display: grid; grid-template-columns: 1fr 150px; gap: 10px; margin-bottom: 12px; }
input, select {
	width: 100%;
	border: 1px solid var(--line);
	border-radius: 6px;
	padding: 9px 10px;
	font: inherit;
	background: #fff;
	color: var(--ink);
}
.case-list { display: grid; gap: 8px; max-height: 70vh; overflow: auto; padding-right: 4px; }
.case-list button {
	display: grid;
	grid-template-columns: 74px 1fr 42px;
	gap: 8px;
	align-items: center;
	width: 100%;
	padding: 9px;
	text-align: left;
	color: inherit;
	cursor: pointer;
}
.case-list button[aria-selected="true"] { border-color: var(--accent); outline: 2px solid rgba(39,95,134,.18); }
.case-id { font-weight: 700; }
.prompt { color: var(--muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.rating { text-align: center; font-weight: 700; border-radius: 999px; padding: 4px 0; background: #eef2f6; }
.rating[data-rating="5"] { color: var(--good); background: #e8f5ee; }
.rating[data-low="true"] { color: var(--bad); background: #f9e9e9; }
.detail h2 { margin: 0 0 4px; font-size: 22px; }
.detail .question { margin: 0 0 14px; color: var(--muted); }
.answer-grid { display: grid; gap: 12px; }
.answer-card { padding: 12px; }
.answer-card[data-current="true"] { border-color: var(--accent); }
.answer-head { display: flex; justify-content: space-between; gap: 12px; margin-bottom: 8px; }
.answer-head strong { font-size: 14px; }
.answer-text { white-space: pre-wrap; line-height: 1.45; margin: 8px 0; }
.notes, .tools, .change { color: var(--muted); font-size: 13px; line-height: 1.35; }
.change[data-good="true"] { color: var(--good); font-weight: 700; }
.timeline {
	position: fixed;
	left: 0;
	right: 0;
	bottom: 0;
	background: rgba(255,253,250,.97);
	border-top: 1px solid var(--line);
	padding: 14px 24px 18px;
	box-shadow: 0 -6px 24px rgba(31,41,51,.08);
}
.timeline-inner { max-width: 1280px; margin: 0 auto; display: grid; gap: 8px; }
.timeline-label { display: flex; justify-content: space-between; gap: 12px; color: var(--muted); font-size: 13px; }
.timeline input[type="range"] { padding: 0; accent-color: var(--accent); }
@media (max-width: 860px) {
	body { padding: 16px 14px 128px; }
	.metrics { grid-template-columns: repeat(2, minmax(0, 1fr)); }
	main { grid-template-columns: 1fr; }
	.case-list { max-height: 40vh; }
	.controls { grid-template-columns: 1fr; }
}
</style>
</head>
<body>
<header>
<h1>Scout Local AI History</h1>
<p class="meta" id="meta"></p>
</header>
<section class="metrics" id="metrics"></section>
<main>
<section class="panel">
<div class="controls">
<input id="search" type="search" placeholder="Search cases, prompts, answers">
<select id="domain"></select>
</div>
<div class="case-list" id="caseList"></div>
</section>
<section class="panel detail" id="detail"></section>
</main>
<div class="timeline">
<div class="timeline-inner">
<div class="timeline-label"><strong id="timelineRun"></strong><span id="timelineStats"></span></div>
<input id="runSlider" type="range" min="0" max="0" value="0" aria-label="Run timeline">
<div class="timeline-label"><span id="timelineStart"></span><span id="timelineEnd"></span></div>
</div>
</div>
<script id="history-data" type="application/json">${data}</script>
<script>
const historyData = JSON.parse(document.getElementById('history-data').textContent);
const state = { runIndex: Math.max(0, historyData.runs.length - 1), caseId: historyData.cases[0]?.caseId ?? null, search: '', domain: 'all' };
const runs = historyData.runs;
const runSlider = document.getElementById('runSlider');
const caseList = document.getElementById('caseList');
const detail = document.getElementById('detail');
const search = document.getElementById('search');
const domain = document.getElementById('domain');
document.getElementById('meta').textContent = [historyData.suite.suiteId, historyData.suite.version, historyData.suite.hash, 'generated ' + formatDate(historyData.generatedAt)].filter(Boolean).join(' | ');
runSlider.max = String(Math.max(0, runs.length - 1));
runSlider.value = String(state.runIndex);
document.getElementById('timelineStart').textContent = runs[0] ? shortRun(runs[0]) : 'No runs';
document.getElementById('timelineEnd').textContent = runs.length ? shortRun(runs[runs.length - 1]) : 'No runs';
domain.innerHTML = ['all', ...new Set(historyData.cases.map((item) => item.domain).filter(Boolean).sort())].map((value) => '<option value="' + escapeHtml(value) + '">' + escapeHtml(value === 'all' ? 'All domains' : value) + '</option>').join('');
search.addEventListener('input', () => { state.search = search.value.toLowerCase(); render(); });
domain.addEventListener('change', () => { state.domain = domain.value; render(); });
runSlider.addEventListener('input', () => { state.runIndex = Number(runSlider.value); render(); });
render();
function render() {
	const run = runs[state.runIndex] ?? null;
	renderMetrics(run);
	renderTimeline(run);
	const visible = filteredCases(run);
	if (!visible.some((item) => item.caseId === state.caseId)) state.caseId = visible[0]?.caseId ?? historyData.cases[0]?.caseId ?? null;
	caseList.innerHTML = visible.map((item) => caseButton(item, run)).join('');
	for (const button of caseList.querySelectorAll('button')) button.addEventListener('click', () => { state.caseId = button.dataset.caseId; render(); });
	renderDetail(historyData.cases.find((item) => item.caseId === state.caseId), run);
}
function renderMetrics(run) {
	const metrics = [
		['Runs', historyData.summary.runCount],
		['Cases', historyData.summary.caseCount],
		['Reviewed Entries', historyData.summary.reviewedEntryCount],
		['Current Run Rated', run?.reviewSummary?.rated ?? 0],
		['Current Run 5/5', run?.reviewSummary?.ratingCounts?.['5'] ?? 0]
	];
	document.getElementById('metrics').innerHTML = metrics.map(([label, value]) => '<div class="metric"><span>' + escapeHtml(label) + '</span><strong>' + escapeHtml(String(value ?? 0)) + '</strong></div>').join('');
}
function renderTimeline(run) {
	document.getElementById('timelineRun').textContent = run ? shortRun(run) : 'No run selected';
	document.getElementById('timelineStats').textContent = run ? [run.evidenceLane, run.caseCount + '/' + run.totalSuiteCases + ' cases', run.reviewSummary ? run.reviewSummary.rated + ' rated' : 'unreviewed'].filter(Boolean).join(' | ') : '';
}
function filteredCases(run) {
	const needle = state.search;
	return historyData.cases.filter((item) => {
		if (state.domain !== 'all' && item.domain !== state.domain) return false;
		if (!needle) return true;
		const entry = entryAtRun(item, run);
		return [item.caseId, item.domain, item.prompt, entry?.answer, entry?.notes, entry?.improvementTask].some((value) => String(value ?? '').toLowerCase().includes(needle));
	});
}
function caseButton(item, run) {
	const entry = entryAtRun(item, run);
	const rating = entry?.rating ?? 'na';
	const low = Number.isFinite(Number(rating)) && Number(rating) < 5;
	return '<button data-case-id="' + escapeHtml(item.caseId) + '" aria-selected="' + String(item.caseId === state.caseId) + '"><span class="case-id">' + escapeHtml(item.caseId) + '</span><span class="prompt">' + escapeHtml(item.prompt) + '</span><span class="rating" data-rating="' + escapeHtml(String(rating)) + '" data-low="' + String(low) + '">' + escapeHtml(String(rating)) + '</span></button>';
}
function renderDetail(item, run) {
	if (!item) { detail.innerHTML = '<p>No case selected.</p>'; return; }
	const entries = item.history.filter((entry) => !run || entry.runOrder <= run.order);
	const current = entryAtRun(item, run);
	detail.innerHTML = '<h2>' + escapeHtml(item.caseId + ' - ' + (item.domain ?? '')) + '</h2>' +
		'<p class="question">' + escapeHtml(item.prompt) + '</p>' +
		'<div class="answer-grid">' + entries.map((entry) => answerCard(entry, current)).join('') + '</div>';
}
function answerCard(entry, current) {
	const currentFlag = current && entry.runId === current.runId;
	const rating = entry.rating ?? 'unrated';
	const change = entry.improvementSincePrevious ? 'Improved from ' + entry.previousRating + ' to ' + entry.rating : (entry.scoreDeltaFromPreviousRated ? 'Score delta ' + signed(entry.scoreDeltaFromPreviousRated) : 'No rated score change');
	return '<article class="answer-card" data-current="' + String(currentFlag) + '">' +
		'<div class="answer-head"><strong>' + escapeHtml(shortRun(entry)) + '</strong><span class="rating" data-rating="' + escapeHtml(String(rating)) + '" data-low="' + String(Number(rating) < 5) + '">' + escapeHtml(String(rating)) + '</span></div>' +
		'<div class="change" data-good="' + String(entry.improvementSincePrevious) + '">' + escapeHtml(change) + '</div>' +
		'<p class="answer-text">' + escapeHtml(entry.answer || entry.error || '') + '</p>' +
		'<p class="notes">' + escapeHtml(entry.notes || entry.improvementTask || '') + '</p>' +
		'<p class="tools">' + escapeHtml('Tools: ' + (entry.toolHit ?? []).join(', ') + ' | missing: ' + (entry.missingTools ?? []).join(', ') + ' | source evidence: ' + (entry.sourceEvidenceComplete ? 'complete' : 'gaps')) + '</p>' +
		(entry.commit?.sha ? '<p class="tools">' + escapeHtml('Commit at run: ' + entry.commit.sha.slice(0, 8) + ' ' + entry.commit.subject) + '</p>' : '') +
		'</article>';
}
function entryAtRun(item, run) {
	if (!run) return item.history.length ? item.history[item.history.length - 1] : null;
	let selected = null;
	for (const entry of item.history) {
		if (entry.runOrder <= run.order) selected = entry;
	}
	return selected;
}
function shortRun(run) { return [run.runId, formatDate(run.sortTime)].filter(Boolean).join(' | '); }
function formatDate(value) { return value ? new Date(value).toLocaleString() : ''; }
function signed(value) { return value > 0 ? '+' + value : String(value); }
function escapeHtml(value) {
	return String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
}
</script>
</body>
</html>
`;
}

function buildRunRecord({ repoRoot, run, runPath, review, reviewSummary, scan, sortTime, commit }) {
	const install = run.runContext?.installSource ?? {};
	const app = run.runContext?.app ?? {};
	return {
		runId: String(run.runId ?? basename(runPath, '.json')),
		order: 0,
		sortTime,
		path: relative(repoRoot, runPath),
		evidenceLane: run.evidenceLane ?? run.runContext?.execution?.evidenceLane ?? null,
		caseCount: run.caseCount ?? run.results?.length ?? 0,
		totalSuiteCases: run.totalSuiteCases ?? null,
		fullRun: (run.caseCount ?? run.results?.length ?? 0) === (run.totalSuiteCases ?? 100),
		suiteId: run.suiteId ?? null,
		suiteVersion: run.suiteVersion ?? null,
		suiteHash: run.suiteHash ?? null,
		modelId: run.runContext?.modelId ?? null,
		mode: run.results?.[0]?.mode ?? null,
		provider: run.results?.[0]?.provider ?? null,
		app: {
			version: app.version ?? null,
			build: app.build ?? null,
			installType: install.type ?? null,
			platform: install.platform ?? run.runContext?.native?.platform ?? null
		},
		reviewPath: review ? review.runPath ?? `data/scout-local-ai/reviews/${run.runId}.review.json` : null,
		reviewSummary: reviewSummary ? compactReviewSummary(reviewSummary) : null,
		answerQuality: scan ? {
			flaggedCount: scan.flaggedCount ?? 0,
			errorCount: scan.errorCount ?? 0,
			warningCount: scan.warningCount ?? 0
		} : null,
		commit
	};
}

function buildCaseEntry({ result, reviewEntry, scanEntry, runRecord }) {
	const required = result.toolExpectations?.required ?? result.case?.requiredTools ?? [];
	const sourceGaps = sourceEvidenceProblems(required, result.toolInvocations ?? []);
	return {
		runId: runRecord.runId,
		runOrder: 0,
		sortTime: runRecord.sortTime,
		evidenceLane: runRecord.evidenceLane,
		modelId: runRecord.modelId,
		app: runRecord.app,
		commit: runRecord.commit,
		answerOrigin: result.answerOrigin ?? null,
		mode: result.mode ?? null,
		provider: result.provider ?? null,
		generatedAt: result.generatedAt ?? null,
		durationMs: result.durationMs ?? null,
		answer: result.answer ?? '',
		answerPreview: compact(result.answer ?? result.error ?? '', 420),
		error: result.error ?? '',
		rating: normalizeRating(reviewEntry?.rating ?? result.rating),
		notes: reviewEntry?.notes ?? result.reviewerNotes ?? '',
		failureCategories: reviewEntry?.failureCategories ?? result.suggestedFailureCategories ?? [],
		ownerLayer: reviewEntry?.ownerLayer ?? '',
		improvementTask: reviewEntry?.improvementTask ?? result.improvementTask ?? '',
		toolRequired: required,
		toolHit: result.toolExpectations?.hit ?? [],
		missingTools: result.toolExpectations?.missing ?? [],
		requiredToolComplete: !(result.toolExpectations?.missing ?? []).length,
		sourceEvidenceComplete: sourceGaps.length === 0,
		sourceEvidenceGaps: sourceGaps.map((gap) => gap.expectation),
		receiptCount: result.receipts?.length ?? reviewEntry?.receiptCount ?? 0,
		toolInvocationCount: result.toolInvocations?.length ?? reviewEntry?.toolInvocationCount ?? 0,
		answerQualityChecks: scanEntry?.checks ?? [],
		scoreDeltaFromPreviousRated: null,
		previousRating: null,
		improvementSincePrevious: false,
		answerChangedFromPrevious: false
	};
}

function finalizeCaseHistory(record, runOrder) {
	record.history.sort((a, b) => {
		const orderDiff = (runOrder.get(a.runId) ?? 0) - (runOrder.get(b.runId) ?? 0);
		return orderDiff || a.runId.localeCompare(b.runId);
	});
	let previousRated = null;
	let previousAnswer = null;
	let answerChangeCount = 0;
	for (const entry of record.history) {
		entry.runOrder = runOrder.get(entry.runId) ?? 0;
		if (previousAnswer !== null) {
			entry.answerChangedFromPrevious = normalizeAnswer(entry.answer) !== previousAnswer;
			if (entry.answerChangedFromPrevious) answerChangeCount += 1;
		}
		previousAnswer = normalizeAnswer(entry.answer);
		if (entry.rating !== null) {
			if (previousRated !== null) {
				entry.previousRating = previousRated;
				entry.scoreDeltaFromPreviousRated = entry.rating - previousRated;
				entry.improvementSincePrevious = previousRated < 5 && entry.rating === 5;
			}
			previousRated = entry.rating;
		}
	}
	const rated = record.history.filter((entry) => entry.rating !== null);
	const firstRated = rated[0] ?? null;
	const latestRated = rated.at(-1) ?? null;
	record.runCount = record.history.length;
	record.answerChangeCount = answerChangeCount;
	record.firstRating = firstRated?.rating ?? null;
	record.latestRating = latestRated?.rating ?? null;
	record.bestRating = rated.length ? Math.max(...rated.map((entry) => entry.rating)) : null;
	record.scoreDelta = firstRated && latestRated ? latestRated.rating - firstRated.rating : null;
	record.latestRunId = record.history.at(-1)?.runId ?? null;
	return record;
}

function buildHistorySummary(runs, cases) {
	const reviewedEntryCount = cases.reduce((count, item) => count + item.history.filter((entry) => entry.rating !== null).length, 0);
	const improvedToFive = cases.filter((item) => item.history.some((entry) => entry.improvementSincePrevious)).length;
	const latestRatings = {};
	for (const item of cases) {
		if (item.latestRating !== null) latestRatings[String(item.latestRating)] = (latestRatings[String(item.latestRating)] ?? 0) + 1;
	}
	runs.forEach((run, index) => {
		run.order = index;
	});
	return {
		runCount: runs.length,
		caseCount: cases.length,
		reviewedEntryCount,
		improvedToFive,
		latestRatings,
		fullRunCount: runs.filter((run) => run.fullRun).length,
		partialRunCount: runs.filter((run) => !run.fullRun).length
	};
}

function compactReviewSummary(summary) {
	return {
		total: summary.total,
		rated: summary.rated,
		unrated: summary.unrated,
		belowFive: summary.belowFive,
		ratingCounts: summary.ratingCounts,
		byDomain: summary.byDomain,
		invalidCount: summary.invalid?.length ?? 0
	};
}

function formatHistorySummary(history, { jsonPath, htmlPath }) {
	return [
		'Scout local AI history built.',
		`- Runs: ${history.summary.runCount}`,
		`- Cases: ${history.summary.caseCount}`,
		`- Reviewed entries: ${history.summary.reviewedEntryCount}`,
		`- Improved to 5/5: ${history.summary.improvedToFive}`,
		`- JSON: ${relative(REPO_ROOT, jsonPath)}`,
		`- Timeline: ${relative(REPO_ROOT, htmlPath)}`,
		''
	].join('\n');
}

async function loadJsonMap(dir, keyFor) {
	const map = new Map();
	for (const file of await listJsonFiles(dir)) {
		const value = await readJsonFile(file);
		const key = keyFor(file, value);
		if (key) map.set(String(key), value);
	}
	return map;
}

async function listJsonFiles(dir) {
	try {
		const entries = await readdir(dir, { withFileTypes: true });
		return entries
			.filter((entry) => entry.isFile() && entry.name.endsWith('.json'))
			.map((entry) => resolve(dir, entry.name))
			.sort((a, b) => a.localeCompare(b));
	} catch (error) {
		if (error?.code === 'ENOENT') return [];
		throw error;
	}
}

async function readJsonFile(path) {
	return JSON.parse(await readFile(path, 'utf8'));
}

async function loadGitCommits(repoRoot) {
	try {
		const { stdout } = await execFileAsync('git', ['log', '--all', '--format=%H%x09%cI%x09%s', '--max-count=500'], { cwd: repoRoot });
		return stdout.trim().split('\n').filter(Boolean).map((line) => {
			const [sha, committedAt, ...subjectParts] = line.split('\t');
			return { sha, committedAt, subject: subjectParts.join('\t') };
		}).filter((commit) => commit.sha && commit.committedAt)
			.sort((a, b) => new Date(a.committedAt) - new Date(b.committedAt));
	} catch {
		return [];
	}
}

function commitAtOrBefore(commits, sortTime) {
	if (!commits.length || !sortTime) return null;
	const target = new Date(sortTime).getTime();
	let selected = null;
	for (const commit of commits) {
		if (new Date(commit.committedAt).getTime() <= target) selected = commit;
	}
	return selected;
}

function runSortTime(run) {
	return run.runContext?.execution?.startedAt ?? run.generatedAt ?? timestampFromRunId(run.runId) ?? new Date(0).toISOString();
}

function timestampFromRunId(runId) {
	const match = String(runId ?? '').match(/(\d{8}T\d{6}Z)/u);
	if (!match) return null;
	const raw = match[1];
	return `${raw.slice(0, 4)}-${raw.slice(4, 6)}-${raw.slice(6, 8)}T${raw.slice(9, 11)}:${raw.slice(11, 13)}:${raw.slice(13, 15)}Z`;
}

function runIdFromFile(file, suffix) {
	return basename(file).replace(suffix, '');
}

function reviewRunId(review) {
	return review?.runId ?? (review?.runPath ? basename(String(review.runPath), '.json') : null);
}

function compareBySortTime(a, b) {
	return new Date(a.sortTime) - new Date(b.sortTime) || a.runId.localeCompare(b.runId);
}

function normalizeRating(value) {
	if (value === null || value === undefined || value === '') return null;
	const rating = Number(value);
	return Number.isInteger(rating) && rating >= 1 && rating <= 5 ? rating : null;
}

function normalizeAnswer(value) {
	return String(value ?? '').replace(/\s+/gu, ' ').trim();
}

function compact(value, max) {
	const text = normalizeAnswer(value);
	if (text.length <= max) return text;
	return `${text.slice(0, Math.max(0, max - 1)).trim()}…`;
}

function parseList(value, fallback) {
	if (Array.isArray(value)) return value;
	const list = String(value ?? '').split(',').map((item) => item.trim()).filter(Boolean);
	return list.length ? list : fallback;
}

function resolveInputPath(path) {
	return resolve(REPO_ROOT, String(path));
}

function printUsage() {
	console.log(`Usage: npm run history:scout-local-ai -- [options]

Builds a generated local history database and standalone HTML timeline from Scout local-AI runs, reviews, and scans.

Options:
  --suite <path>          Suite JSON. Default: ${DEFAULT_SUITE}
  --run-dirs <a,b>        Run directories. Default: ${DEFAULT_RUN_DIRS.join(',')}
  --review-dir <path>     Review directory. Default: ${DEFAULT_REVIEW_DIR}
  --scan-dir <path>       Answer-quality scan directory. Default: ${DEFAULT_SCAN_DIR}
  --output-dir <path>     Output directory. Default: ${DEFAULT_OUTPUT_DIR}
  --git false             Skip commit-at-time enrichment.
`);
}

function isImported() {
	return process.argv[1] && resolve(process.argv[1]) !== fileURLToPath(import.meta.url);
}
