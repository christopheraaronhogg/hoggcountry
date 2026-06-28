import { execFile } from 'node:child_process';
import { access, readFile } from 'node:fs/promises';
import { dirname, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import {
	parseCliArgs
} from './lib/scout-local-ai-review.mjs';

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(SCRIPT_DIR, '..');
const execFileAsync = promisify(execFile);

const DEFAULT_SUITE = 'data/scout-local-ai/dad-local-ai-100.json';
const DEFAULT_MOBILE_SUITE = 'mobile/static/scout/dad-local-ai-100.json';
const DEFAULT_RUNS_DIR = 'data/scout-local-ai/runs';
const DEFAULT_DEVICE_RUNS_DIR = 'data/scout-local-ai/device-runs';
const DEFAULT_INBOX_DIR = 'data/scout-local-ai/inbox';
const DEFAULT_DOWNLOADS_DIR = process.env.SCOUT_LOCAL_AI_DOWNLOADS_DIR ?? '~/Downloads';
const DEFAULT_REVIEWS_DIR = 'data/scout-local-ai/reviews';
const DEFAULT_BACKLOG_DIR = 'data/scout-local-ai/backlog';
const DEFAULT_ITERATIONS_DIR = 'data/scout-local-ai/iterations';
const DEFAULT_XCODE_PROJECT = 'mobile/ios/App/App.xcodeproj/project.pbxproj';
const DEFAULT_RELEASE_EVIDENCE = 'docs/launch/release-evidence.json';

const cli = parseCliArgs(process.argv.slice(2));
const paths = {
	suite: resolveInputPath(cli.suite ?? DEFAULT_SUITE),
	mobileSuite: resolveInputPath(cli.mobileSuite ?? DEFAULT_MOBILE_SUITE),
	runsDir: resolveInputPath(cli.runsDir ?? DEFAULT_RUNS_DIR),
	deviceRunsDir: resolveInputPath(cli.deviceRunsDir ?? DEFAULT_DEVICE_RUNS_DIR),
	inboxDir: resolveInputPath(cli.inboxDir ?? DEFAULT_INBOX_DIR),
	downloadsDir: resolveInputPath(cli.downloadsDir ?? DEFAULT_DOWNLOADS_DIR),
	reviewsDir: resolveInputPath(cli.reviewsDir ?? DEFAULT_REVIEWS_DIR),
	backlogDir: resolveInputPath(cli.backlogDir ?? DEFAULT_BACKLOG_DIR),
	iterationsDir: resolveInputPath(cli.iterationsDir ?? DEFAULT_ITERATIONS_DIR),
	xcodeProject: resolveInputPath(cli.xcodeProject ?? DEFAULT_XCODE_PROJECT),
	releaseEvidence: resolveInputPath(cli.releaseEvidence ?? DEFAULT_RELEASE_EVIDENCE)
};

const [
	status,
	suite,
	packageJson,
	reviewSource,
	planSource,
	verifyIterationSource
] = await Promise.all([
	loadStatus(paths),
	readJson(paths.suite),
	readJson(resolve(REPO_ROOT, 'package.json')),
	readText(resolve(REPO_ROOT, 'scripts/lib/scout-local-ai-review.mjs')),
	readText(resolve(REPO_ROOT, 'scripts/plan-scout-local-ai-iteration.mjs')),
	readText(resolve(REPO_ROOT, 'scripts/verify-scout-local-ai-iteration.mjs'))
]);

const transcriptRuns = await loadTranscriptRuns(status);
const scriptMap = packageJson.scripts ?? {};
const gates = Object.fromEntries(status.gates.map((gate) => [gate.id, gate]));
const requirements = createRequirementAudit({
	status,
	suite,
	scriptMap,
	reviewSource,
	planSource,
	verifyIterationSource,
	transcriptRuns,
	gates
});
const finalGateIds = [
	'suite',
	'coverage',
	'routing',
	'testflight-target',
	'device-run',
	'review',
	'iteration-loop',
	'strict-device-proof',
	'stability'
];
const goalComplete = finalGateIds.every((id) => gates[id]?.ok === true);
const audit = {
	schemaVersion: 1,
	generatedAt: new Date().toISOString(),
	goalComplete,
	requirements,
	gates: status.gates,
	currentStatus: {
		suiteVersion: status.suite.version,
		suiteHash: status.suite.hash,
		caseCount: status.suite.caseCount,
		targetBuild: status.testflight.targetBuild,
		recordedDadPilotBuild: status.testflight.recordedDadPilotBuild,
		currentFullRoutingRuns: status.runs.currentFullRoutingRuns.length,
		currentFullDeviceRuns: status.runs.currentFullDeviceRuns.length,
		currentPartialDeviceRuns: status.runs.currentPartialDeviceRuns.length,
		inboxCandidateExports: status.inbox?.candidateCount ?? 0,
		inboxJsonFiles: status.inbox?.jsonFileCount ?? 0,
		latestInboxExport: summarizeLatestInboxExport(status.inbox?.latestCandidate),
		downloadsCandidateExports: status.downloads?.candidateCount ?? 0,
		downloadsJsonFiles: status.downloads?.jsonFileCount ?? 0,
		latestDownloadsExport: summarizeLatestInboxExport(status.downloads?.latestCandidate),
		currentDeviceReviews: status.reviews.currentDeviceReviews.length,
		strictDeviceProofPasses: status.strictDeviceProofs.filter((proof) => proof.ok).length,
		nextAction: status.nextAction
	}
};

if (cli.json) {
	console.log(JSON.stringify(audit, null, 2));
} else {
	console.log(createAuditMarkdown(audit));
}

function createRequirementAudit(input) {
	const suiteGate = input.gates.suite;
	const coverageGate = input.gates.coverage;
	const routingGate = input.gates.routing;
	const testflightGate = input.gates['testflight-target'];
	const deviceRunGate = input.gates['device-run'];
	const reviewGate = input.gates.review;
	const iterationLoopGate = input.gates['iteration-loop'];
	const strictProofGate = input.gates['strict-device-proof'];
	const stabilityGate = input.gates.stability;
	const transcriptEvidence = summarizeTranscriptEvidence(input.transcriptRuns);
	const caseRubricProblems = caseRubricAudit(input.suite);
	const scripts = input.scriptMap;
	const reviewWorkflowEvidence = summarizeReviewWorkflowEvidence({ scripts, reviewSource: input.reviewSource, iterationLoopGate });
	const deviceProofBoundaryEvidence = summarizeDeviceProofBoundaryEvidence({ scripts, deviceRunGate, strictProofGate, stabilityGate });
	const documentGroundingEvidence = summarizeDocumentGroundingGoal(input);

	return [
		requirement({
			id: 'versioned-100-question-suite',
			label: '100 realistic hiker questions exist in a versioned eval file',
			ok: suiteGate?.ok === true && coverageGate?.ok === true,
			evidence: `${suiteGate?.evidence ?? '<missing suite gate>'}; ${coverageGate?.evidence ?? '<missing coverage gate>'}`
		}),
		requirement({
			id: 'per-case-rubrics-and-tools',
			label: 'Each question has expected answer traits, required source/tool expectations, and safety caveats',
			ok: caseRubricProblems.length === 0,
			evidence: caseRubricProblems.length
				? caseRubricProblems.slice(0, 8).join('; ')
				: `All ${input.suite.cases?.length ?? 0} cases include non-empty expectedTraits, requiredTools, and safetyCaveats.`
		}),
		requirement({
			id: 'document-grounded-system-goal',
			label: 'Goal covers a model-agnostic document-grounded assistant beyond AT-specific content',
			ok: documentGroundingEvidence.ok,
			evidence: documentGroundingEvidence.evidence
		}),
		requirement({
			id: 'runner-saves-transcripts',
			label: 'Eval runner can execute all 100 and save full transcripts',
			ok: Boolean(scripts['eval:scout-local-ai']) && routingGate?.ok === true && transcriptEvidence.ok,
			evidence: transcriptEvidence.ok
				? `${scripts['eval:scout-local-ai']}; ${transcriptEvidence.evidence}`
				: transcriptEvidence.evidence
		}),
		requirement({
			id: 'review-ratings-and-notes',
			label: 'Review workflow supports 1-5 ratings plus notes',
			ok: Boolean(scripts['review:scout-local-ai']) &&
				input.reviewSource.includes('rating: null') &&
				input.reviewSource.includes("notes: ''") &&
				input.reviewSource.includes('Rate each answer 1-5'),
			evidence: scripts['review:scout-local-ai']
				? 'Review template records rating, notes, answer text, evidence, checklists, failure categories, owner layer, and improvement task.'
				: 'package.json is missing review:scout-local-ai script.'
		}),
		requirement({
			id: 'below-five-creates-task',
			label: 'Any answer below 5 creates a concrete improvement task',
			ok: reviewWorkflowEvidence.ok,
			evidence: reviewWorkflowEvidence.evidence
		}),
		requirement({
			id: 'iterations-target-responsible-layer',
			label: 'Iterations improve data/tools/prompts/UI/local model rather than overfitting wording',
			ok: Boolean(scripts['plan:scout-local-ai-iteration']) &&
				Boolean(scripts['verify:scout-local-ai-iteration']) &&
				input.reviewSource.includes('OVERFITTING_IMPROVEMENT_PATTERNS') &&
				input.reviewSource.includes('rather than weakening the eval rubric') &&
				input.planSource.includes('Fix the responsible layer named by ownerLayer') &&
				input.verifyIterationSource.includes('stale improvementTask remains on a planned 5/5 case'),
			evidence: 'Review rejects rubric-weakening tasks; planner groups misses by ownerLayer; verifier rejects unresolved/stale iteration closures.'
		}),
		requirement({
			id: 'device-proof-lane-separated',
			label: 'Final proof keeps local AI/device proof separate from browser/cloud/scaffold proof',
			ok: deviceProofBoundaryEvidence.ok,
			evidence: deviceProofBoundaryEvidence.evidence
		}),
		requirement({
			id: 'target-testflight-build',
			label: 'Dad Pilot has the current suite-required TestFlight build',
			ok: testflightGate?.ok === true,
			evidence: testflightGate?.evidence ?? '<missing TestFlight gate>'
		}),
		requirement({
			id: 'final-100-rated-five',
			label: 'Final proof includes all 100 questions rated 5/5 on TestFlight/iPhone',
			ok: reviewGate?.ok === true && strictProofGate?.ok === true && stabilityGate?.ok === true,
			evidence: [
				reviewGate?.evidence ?? '<missing review gate>',
				strictProofGate?.evidence ?? '<missing strict proof gate>',
				stabilityGate?.evidence ?? '<missing stability gate>'
			].join('; ')
		})
	];
}

function summarizeDocumentGroundingGoal(input) {
	const problems = [];
	const goal = input.suite.documentGroundingGoal ?? {};
	const northStar = String(goal.northStar ?? '');
	const sourceClasses = Array.isArray(goal.sourceClasses) ? goal.sourceClasses.map((item) => String(item).toLowerCase()) : [];
	const transferAcceptance = String(goal.transferAcceptance ?? '');
	const writeAcceptance = String(goal.writeAcceptance ?? '');
	const coverageAreas = new Map((input.status.suite?.coverage?.areas ?? []).map((area) => [area.id, area]));
	const vaultCoverage = coverageAreas.get('document-vault-user-docs');
	const writeCoverage = coverageAreas.get('document-writing-user-docs');
	const transferCoverage = coverageAreas.get('domain-transfer-readiness');

	if (!/\blocal-first\b/i.test(northStar)) problems.push('documentGroundingGoal.northStar must state local-first behavior.');
	if (!/\bmodel-agnostic\b/i.test(northStar)) problems.push('documentGroundingGoal.northStar must state model-agnostic behavior.');
	if (!/\bdocument-grounded\b/i.test(northStar)) problems.push('documentGroundingGoal.northStar must state document-grounded behavior.');
	if (!sourceClasses.some((item) => item.includes('user document vault'))) problems.push('documentGroundingGoal.sourceClasses must include user document vault files.');
	if (!sourceClasses.some((item) => item.includes('user-owned document drafts and updates'))) problems.push('documentGroundingGoal.sourceClasses must include user-owned document drafts and updates.');
	if (!sourceClasses.some((item) => item.includes('non-trail document corpora'))) problems.push('documentGroundingGoal.sourceClasses must include future non-trail document corpora.');
	if (!/\b(internal company documents|sops|project notes|customer docs|private knowledge bases)\b/i.test(transferAcceptance)) {
		problems.push('documentGroundingGoal.transferAcceptance must name non-trail document corpora.');
	}
	if (!/\b(draft|write|update)\b/i.test(writeAcceptance)) problems.push('documentGroundingGoal.writeAcceptance must cover document drafting or updates.');
	if (!/\b(user-owned documents?|document vault)\b/i.test(writeAcceptance)) problems.push('documentGroundingGoal.writeAcceptance must cover user-owned documents.');
	if (!/\b(explicitly asks|explicit confirmation|confirmation)\b/i.test(writeAcceptance)) problems.push('documentGroundingGoal.writeAcceptance must require explicit user intent or confirmation.');
	if (!/\breviewable\b/i.test(writeAcceptance)) problems.push('documentGroundingGoal.writeAcceptance must require reviewable generated content.');
	if (!/\bnever silently overwrite\b/i.test(writeAcceptance)) problems.push('documentGroundingGoal.writeAcceptance must prohibit silent overwrites.');
	if (vaultCoverage?.ok !== true) problems.push(`document-vault coverage is not satisfied: ${vaultCoverage?.count ?? 0}/${vaultCoverage?.minCases ?? '?'}.`);
	if (writeCoverage?.ok !== true) problems.push(`document-writing coverage is not satisfied: ${writeCoverage?.count ?? 0}/${writeCoverage?.minCases ?? '?'}.`);
	if (transferCoverage?.ok !== true) problems.push(`domain-transfer readiness coverage is not satisfied: ${transferCoverage?.count ?? 0}/${transferCoverage?.minCases ?? '?'}.`);

	return {
		ok: problems.length === 0,
		evidence: problems.length
			? problems.join('; ')
			: `${northStar} Source classes include ${goal.sourceClasses.join(', ')}. Transfer target: ${transferAcceptance} Write target: ${writeAcceptance} Coverage: document vault ${vaultCoverage.count}/${vaultCoverage.minCases}, document writing ${writeCoverage.count}/${writeCoverage.minCases}, transfer readiness ${transferCoverage.count}/${transferCoverage.minCases}.`
	};
}

function summarizeReviewWorkflowEvidence({ scripts, reviewSource, iterationLoopGate }) {
	const problems = [];
	if (!scripts['apply-review:scout-local-ai']) problems.push('package.json is missing apply-review:scout-local-ai.');
	if (!scripts['review:scout-local-ai']) problems.push('package.json is missing review:scout-local-ai.');
	if (!reviewSource.includes('ratings below 5 need an improvementTask')) {
		problems.push('review validation does not require improvementTask for below-5 ratings.');
	}
	if (!reviewSource.includes('ratings below 5 need an ownerLayer')) {
		problems.push('review validation does not require ownerLayer for below-5 ratings.');
	}
	if (!reviewSource.includes('improvementTask must be concrete enough')) {
		problems.push('review validation does not reject vague improvementTask entries.');
	}
	if (!iterationLoopGate) problems.push('iteration-loop status gate is missing.');
	return {
		ok: problems.length === 0,
		evidence: problems.length
			? problems.join('; ')
			: `Workflow guardrail present: below-5 ratings require failure categories, ownerLayer, and concrete improvementTask before backlog/iteration planning. Current device-review debt: ${iterationLoopGate.evidence}`
	};
}

function summarizeDeviceProofBoundaryEvidence({ scripts, deviceRunGate, strictProofGate, stabilityGate }) {
	const problems = [];
	for (const scriptName of [
		'intake:scout-local-ai-device-run',
		'prepare-review:scout-local-ai-device-run',
		'verify:scout-local-ai-device-proof',
		'verify:scout-local-ai-stability-proof'
	]) {
		if (!scripts[scriptName]) problems.push(`package.json is missing ${scriptName}.`);
	}
	if (!deviceRunGate) problems.push('device-run status gate is missing.');
	if (!strictProofGate) problems.push('strict-device-proof status gate is missing.');
	if (!stabilityGate) problems.push('stability status gate is missing.');
	return {
		ok: problems.length === 0,
		evidence: problems.length
			? problems.join('; ')
			: `Boundary guardrail present: intake and proof commands keep TestFlight/iPhone device proof separate from scaffold/browser/cloud evidence. Current device proof status: ${deviceRunGate.evidence}; ${strictProofGate.evidence}; ${stabilityGate.evidence}`
	};
}

function requirement(input) {
	return {
		id: input.id,
		label: input.label,
		ok: Boolean(input.ok),
		evidence: input.evidence
	};
}

function caseRubricAudit(suite) {
	const problems = [];
	if (!Array.isArray(suite.cases)) return ['suite.cases must be an array'];
	for (const testCase of suite.cases) {
		for (const key of ['expectedTraits', 'requiredTools', 'safetyCaveats']) {
			if (!Array.isArray(testCase[key]) || testCase[key].length === 0) {
				problems.push(`${testCase.id ?? '<missing-id>'}: ${key} must be a non-empty array`);
			}
		}
	}
	return problems;
}

function summarizeTranscriptEvidence(runs) {
	if (!runs.length) {
		return {
			ok: false,
			evidence: 'No current full tool-complete run is available to inspect for transcript fields.'
		};
	}
	const problems = [];
	let resultCount = 0;
	for (const run of runs) {
		if (!Array.isArray(run.results)) {
			problems.push(`${run.runId ?? '<missing-run>'}: results must be an array`);
			continue;
		}
		resultCount += run.results.length;
		for (const result of run.results) {
			const label = `${run.runId ?? '<missing-run>'}:${result.caseId ?? '<missing-case>'}`;
			if (typeof result.answer !== 'string') problems.push(`${label}: answer must be a string`);
			if (!Array.isArray(result.receipts)) problems.push(`${label}: receipts must be recorded`);
			if (!Array.isArray(result.toolInvocations)) problems.push(`${label}: toolInvocations must be recorded`);
			if (!String(result.confidence ?? '').trim()) problems.push(`${label}: confidence must be recorded`);
			if (!Object.hasOwn(result, 'failureMode')) problems.push(`${label}: failureMode must be recorded`);
			if (!result.toolExpectations || !Array.isArray(result.toolExpectations.missing)) {
				problems.push(`${label}: toolExpectations.missing must be recorded`);
			}
		}
	}
	return {
		ok: problems.length === 0,
		evidence: problems.length
			? problems.slice(0, 8).join('; ')
			: `${runs.length} current full run(s) / ${resultCount} result transcript(s) include answer, receipts, toolInvocations, confidence, failureMode, and tool expectations.`
	};
}

async function loadTranscriptRuns(status) {
	const entries = status.runs.currentFullToolCompleteRuns.length
		? status.runs.currentFullToolCompleteRuns
		: status.runs.currentFullRoutingRuns;
	const runs = [];
	for (const entry of entries) {
		const path = resolve(REPO_ROOT, entry.path);
		if (!(await exists(path))) continue;
		runs.push(await readJson(path));
	}
	return runs;
}

async function loadStatus(paths) {
	const args = [
		'scripts/status-scout-local-ai.mjs',
		'--json',
		'--suite',
		relative(REPO_ROOT, paths.suite),
		'--mobile-suite',
		relative(REPO_ROOT, paths.mobileSuite),
		'--runs-dir',
		relative(REPO_ROOT, paths.runsDir),
		'--device-runs-dir',
		relative(REPO_ROOT, paths.deviceRunsDir),
		'--inbox-dir',
		relative(REPO_ROOT, paths.inboxDir),
		'--downloads-dir',
		relative(REPO_ROOT, paths.downloadsDir),
		'--reviews-dir',
		relative(REPO_ROOT, paths.reviewsDir),
		'--backlog-dir',
		relative(REPO_ROOT, paths.backlogDir),
		'--iterations-dir',
		relative(REPO_ROOT, paths.iterationsDir),
		'--xcode-project',
		relative(REPO_ROOT, paths.xcodeProject),
		'--release-evidence',
		relative(REPO_ROOT, paths.releaseEvidence)
	];
	const result = await execFileAsync(process.execPath, args, {
		cwd: REPO_ROOT,
		maxBuffer: 1024 * 1024 * 6
	});
	return JSON.parse(result.stdout);
}

function createAuditMarkdown(audit) {
	const lines = [
		'# Scout local AI goal audit',
		'',
		`Generated at: ${audit.generatedAt}`,
		`Goal complete: ${audit.goalComplete ? 'yes' : 'no'}`,
		'',
		'## Requirements',
		''
	];
	for (const item of audit.requirements) {
		lines.push(
			`- ${item.ok ? '[x]' : '[ ]'} ${item.label}`,
			`  Evidence: ${item.evidence}`
		);
	}
	lines.push(
		'',
		'## Current State',
		'',
		`- Suite: \`${audit.currentStatus.suiteVersion}\` / \`${audit.currentStatus.suiteHash}\``,
		`- Cases: ${audit.currentStatus.caseCount}`,
		`- Target build: \`${audit.currentStatus.targetBuild ?? '<unknown>'}\``,
		`- Recorded Dad Pilot build: \`${audit.currentStatus.recordedDadPilotBuild ?? '<unknown>'}\``,
		`- Full routing runs: ${audit.currentStatus.currentFullRoutingRuns}`,
		`- Full device runs: ${audit.currentStatus.currentFullDeviceRuns}`,
		`- Inbox candidate exports: ${audit.currentStatus.inboxCandidateExports}`,
		audit.currentStatus.latestInboxExport
			? `- Latest inbox export: \`${audit.currentStatus.latestInboxExport.path}\` (${audit.currentStatus.latestInboxExport.runId}, ${audit.currentStatus.latestInboxExport.caseCount} cases)`
			: '- Latest inbox export: none',
		`- Downloads candidate exports: ${audit.currentStatus.downloadsCandidateExports}`,
		audit.currentStatus.latestDownloadsExport
			? `- Latest Downloads export: \`${audit.currentStatus.latestDownloadsExport.path}\` (${audit.currentStatus.latestDownloadsExport.runId}, ${audit.currentStatus.latestDownloadsExport.caseCount} cases)`
			: '- Latest Downloads export: none',
		`- Device reviews: ${audit.currentStatus.currentDeviceReviews}`,
		`- Strict proof passes: ${audit.currentStatus.strictDeviceProofPasses}`,
		'',
		'## Next Action',
		'',
		audit.currentStatus.nextAction.text
	);
	return `${lines.join('\n')}\n`;
}

function summarizeLatestInboxExport(candidate) {
	if (!candidate) return null;
	return {
		path: candidate.path,
		runId: candidate.runId,
		caseCount: candidate.caseCount,
		evidenceLane: candidate.evidenceLane,
		appVersion: candidate.appVersion,
		appBuild: candidate.appBuild,
		installSource: candidate.installSource
	};
}

async function readJson(path) {
	return JSON.parse(await readFile(path, 'utf8'));
}

async function readText(path) {
	return readFile(path, 'utf8');
}

async function exists(path) {
	try {
		await access(path);
		return true;
	} catch {
		return false;
	}
}

function resolveInputPath(value) {
	const text = String(value);
	if (text === '~') return process.env.HOME ?? text;
	if (text.startsWith('~/')) return resolve(process.env.HOME ?? REPO_ROOT, text.slice(2));
	return resolve(REPO_ROOT, text);
}
