import assert from 'node:assert/strict';
import { mkdir, mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import {
	buildScoutLocalAiHistory,
	renderScoutLocalAiHistoryHtml,
	summarizeCommitInterventions
} from './build-scout-local-ai-history.mjs';
import { scoutLocalAiSuiteHash } from './lib/scout-local-ai-suite.mjs';

test('Scout local AI history tracks answer evolution and score deltas', async () => {
	const root = await mkdtemp(join(tmpdir(), 'scout-history-'));
	const runDir = join(root, 'device-runs');
	const reviewDir = join(root, 'reviews');
	const scanDir = join(root, 'answer-quality-scans');
	await mkdir(runDir, { recursive: true });
	await mkdir(reviewDir, { recursive: true });
	await mkdir(scanDir, { recursive: true });
	const suitePath = join(root, 'dad-local-ai-100.json');
	const suite = {
		suiteId: 'dad-local-ai-100',
		version: '2026-06-27.2',
		cases: [
			{
				id: 'DLA-067',
				domain: 'navigation',
				phase: 'on-trail',
				prompt: 'What should I do if GPS jumps around and Scout shows the wrong spot?',
				requiredTools: ['current_mile', 'source_search:safety'],
				expectedTraits: ['manual correction'],
				safetyCaveats: ['no decisions from bad GPS'],
				documentTask: 'reading-writing'
			}
		]
	};
	await writeFile(suitePath, JSON.stringify(suite, null, 2));

	await writeRunAndReview({
		runDir,
		reviewDir,
		scanDir,
		runId: 'device-local-ai-20260628T081954Z',
		startedAt: '2026-06-28T08:19:54.000Z',
		answer: 'Stop and use map and compass, but no Scout-specific recovery flow.',
		confidence: 'low',
		failureMode: 'weak-retrieval',
		rating: 3,
		notes: 'Missing manual mile correction and downstream tool warning.',
		failureCategories: ['bad-prompt'],
		ownerLayer: 'prompt',
		improvementTask: 'Add GPS wrong-spot recovery prompt polish.'
	});
	await writeRunAndReview({
		runDir,
		reviewDir,
		scanDir,
		runId: 'device-local-ai-20260628T143612Z',
		startedAt: '2026-06-28T14:36:12.000Z',
		answer: 'Stop, wait for GPS to settle, compare Scout to blazes, signs, map, compass, and last known point, set Current AT mile only from a confirmed location, refresh the field pack, and re-ask water, shelter, town, terrain, and bailout questions.',
		confidence: 'medium',
		failureMode: null,
		rating: 5,
		notes: 'Dad-ready GPS recovery answer.',
		failureCategories: [],
		ownerLayer: '',
		improvementTask: ''
	});

	const history = await buildScoutLocalAiHistory({
		repoRoot: root,
		suitePath,
		runDirs: [runDir],
		reviewDir,
		scanDir,
		gitCommits: [
			{
				sha: '1111111111111111111111111111111111111111',
				committedAt: '2026-06-28T08:00:00.000Z',
				subject: 'Clarify Scout GPS recovery answer contract',
				files: ['mobile/src/lib/scout/scout-runtime.ts']
			},
			{
				sha: '2222222222222222222222222222222222222222',
				committedAt: '2026-06-28T14:00:00.000Z',
				subject: 'Fix Scout GPS recovery source routing',
				files: ['mobile/src/lib/scout/built-in-tools.ts', 'packages/scout-skills/src/index.ts']
			},
			{
				sha: '3333333333333333333333333333333333333333',
				committedAt: '2026-06-28T15:00:00.000Z',
				subject: 'Track Scout eval interventions in history',
				files: ['scripts/build-scout-local-ai-history.mjs', 'scripts/scout-local-ai-history.test.mjs']
			}
		]
	});

	assert.equal(history.summary.runCount, 2);
	assert.equal(history.suite.hash, scoutLocalAiSuiteHash(suite));
	assert.equal(history.summary.caseCount, 1);
	assert.equal(history.summary.documentTaskCounts['reading-writing'], 1);
	assert.deepEqual(history.summary.evidenceLaneCounts, { 'device-on-device-gemma': 2 });
	assert.deepEqual(history.summary.modelRuntimeCounts, { 'gemma-4-E2B-it-litert-lm / on-device / on-device-gemma / debug': 2 });
	assert.equal(history.summary.confidenceCounts.low, 1);
	assert.equal(history.summary.confidenceCounts.medium, 1);
	assert.equal(history.summary.latestConfidenceCounts.medium, 1);
	assert.deepEqual(history.summary.latestEvidenceLaneCounts, { 'device-on-device-gemma': 1 });
	assert.deepEqual(history.summary.latestModelRuntimeCounts, { 'gemma-4-E2B-it-litert-lm / on-device / on-device-gemma / debug': 1 });
	assert.equal(history.summary.failureModeCounts.none, 1);
	assert.equal(history.summary.failureModeCounts['weak-retrieval'], 1);
	assert.equal(history.summary.latestFailureModeCounts.none, 1);
	assert.equal(history.summary.reviewedEntryCount, 2);
	assert.equal(history.summary.improvedToFive, 1);
	assert.deepEqual(history.summary.latestKnownRatings, { '5': 1 });
	assert.deepEqual(history.summary.currentRunRatingCounts, { '5': 1 });
	assert.equal(history.summary.currentRunRated, 1);
	assert.equal(history.summary.currentRunUnrated, 0);
	assert.equal(history.summary.currentRunIndependentReviewersPassed, 4);
	assert.equal(history.summary.currentRunIndependentReviewersTotal, 4);
	assert.equal(history.summary.currentRunReviewGatesPassed, 6);
	assert.equal(history.summary.currentRunReviewGatesTotal, 6);
	assert.equal(history.summary.reviewGateReadyRunCount, 2);
	assert.equal(history.runs[0].runId, 'device-local-ai-20260628T081954Z');
	assert.equal(history.runs[1].reviewSummary.ratingCounts['5'], 1);
	assert.equal(history.runs[1].independentReviewGates.reviewers.passed, 4);
	assert.equal(history.runs[1].independentReviewGates.reviewGates.passed, 6);
	assert.equal(history.runs[1].independentReviewGates.readyForStrictProof, true);
	assert.equal(history.runs[1].interventions.commitCount, 1);
	assert.deepEqual(history.runs[1].interventions.categories, ['document-grounding', 'tool-routing/source-retrieval']);
	assert.equal(history.summary.interventionCounts['prompt/answer-contract'], 1);
	assert.equal(history.summary.interventionCounts['tool-routing/source-retrieval'], 1);
	assert.equal(history.summary.pendingInterventionCommitCount, 1);
	assert.equal(history.summary.pendingRerunCommitCount, 0);
	assert.deepEqual(history.summary.pendingInterventionCategories, ['history/reporting']);
	assert.equal(history.pendingInterventions.pendingSinceRunId, 'device-local-ai-20260628T143612Z');
	assert.equal(history.pendingInterventions.rerunCommitCount, 0);
	assert.deepEqual(history.pendingInterventions.rerunCategories, []);
	assert.equal(history.pendingInterventions.requiresRerun, false);
	const gpsCase = history.cases[0];
	assert.equal(gpsCase.caseId, 'DLA-067');
	assert.equal(gpsCase.documentTask, 'reading-writing');
	assert.equal(gpsCase.firstRating, 3);
	assert.equal(gpsCase.latestRating, 5);
	assert.equal(gpsCase.scoreDelta, 2);
	assert.equal(gpsCase.answerChangeCount, 1);
	assert.equal(gpsCase.history[0].confidence, 'low');
	assert.equal(gpsCase.history[0].failureMode, 'weak-retrieval');
	assert.equal(gpsCase.history[1].confidence, 'medium');
	assert.equal(gpsCase.history[1].failureMode, null);
	assert.equal(gpsCase.history[1].previousRating, 3);
	assert.equal(gpsCase.history[1].scoreDeltaFromPreviousRated, 2);
	assert.equal(gpsCase.history[1].improvementSincePrevious, true);
	assert.equal(gpsCase.history[1].sourceEvidenceComplete, true);
	assert.equal(gpsCase.history[1].documentTask, 'reading-writing');
	assert.equal(gpsCase.history[1].interventions.commitCount, 1);

	const html = renderScoutLocalAiHistoryHtml(history);
	assert.match(html, /type="range"/u);
	assert.match(html, /id="documentTask"/u);
	assert.match(html, /All document tasks/u);
	assert.match(html, /id="evidenceLane"/u);
	assert.match(html, /All proof lanes/u);
	assert.match(html, /id="modelRuntime"/u);
	assert.match(html, /All model\/runtime/u);
	assert.match(html, /Scout Local AI History/u);
	assert.match(html, /DLA-067/u);
	assert.match(html, /GPS jumps/u);
	assert.match(html, /device-on-device-gemma/u);
	assert.match(html, /gemma-4-E2B-it-litert-lm/u);
	assert.match(html, /modelRuntimeKey\(item\)/u);
	assert.match(html, /Current Run Unrated/u);
	assert.match(html, /Reviewers Passed/u);
	assert.match(html, /Review Gates Passed/u);
	assert.match(html, /formatIndependentGateStats\(run\)/u);
	assert.match(html, /"currentRunIndependentReviewersPassed":4/u);
	assert.match(html, /"currentRunReviewGatesPassed":6/u);
	assert.match(html, /"readyForStrictProof":true/u);
	assert.match(html, /Latest Known 5\/5/u);
	assert.match(html, /Confidence: /u);
	assert.match(html, /Failure mode: /u);
	assert.match(html, /"confidence":"medium"/u);
	assert.match(html, /"failureMode":null/u);
	assert.match(html, /weak-retrieval/u);
	assert.match(html, /No cases match the selected proof-lane\/model filters/u);
	assert.match(html, /No matching answers for this case under the selected proof-lane\/model filters/u);
	assert.match(html, /Changes since previous run/u);
	assert.match(html, /Fix Scout GPS recovery source routing/u);
	assert.match(html, /Pending proof\/reporting context after latest run/u);
	assert.match(html, /no Scout answer rerun required/u);
	assert.match(html, /Track Scout eval interventions in history/u);
	assert.doesNotMatch(html, /<\/script><script/u);
});

test('Scout local AI history tracks independent review gate progress separately from answer ratings', async () => {
	const root = await mkdtemp(join(tmpdir(), 'scout-history-gates-'));
	const runDir = join(root, 'device-runs');
	const reviewDir = join(root, 'reviews');
	const scanDir = join(root, 'answer-quality-scans');
	await mkdir(runDir, { recursive: true });
	await mkdir(reviewDir, { recursive: true });
	await mkdir(scanDir, { recursive: true });
	const suitePath = join(root, 'dad-local-ai-100.json');
	await writeFile(suitePath, JSON.stringify({
		suiteId: 'dad-local-ai-100',
		version: '2026-06-29.4',
		cases: [{
			id: 'DLA-067',
			domain: 'navigation',
			phase: 'on-trail',
			prompt: 'What should I do if GPS jumps around and Scout shows the wrong spot?',
			requiredTools: ['current_mile', 'source_search:safety'],
			expectedTraits: ['manual correction'],
			safetyCaveats: ['no decisions from bad GPS'],
			documentTask: 'reading-writing'
		}]
	}, null, 2));
	await writeRunAndReview({
		runDir,
		reviewDir,
		scanDir,
		runId: 'device-local-ai-20260629T070000Z',
		startedAt: '2026-06-29T07:00:00.000Z',
		answer: 'Stop, verify location from blazes and map, then set the current AT mile from a confirmed point.',
		confidence: 'medium',
		failureMode: null,
		rating: 5,
		notes: 'Answer is rated, but independent proof gates are still blank.',
		failureCategories: [],
		ownerLayer: '',
		improvementTask: '',
		independentReviewerStatus: null,
		reviewGatePassed: null
	});

	const history = await buildScoutLocalAiHistory({
		repoRoot: root,
		suitePath,
		runDirs: [runDir],
		reviewDir,
		scanDir,
		gitCommits: []
	});

	const run = history.runs[0];
	assert.equal(history.summary.currentRunRatingCounts['5'], 1);
	assert.equal(history.summary.currentRunIndependentReviewersPassed, 0);
	assert.equal(history.summary.currentRunReviewGatesPassed, 0);
	assert.equal(history.summary.reviewGateReadyRunCount, 0);
	assert.equal(run.independentReviewGates.reviewers.blank, 4);
	assert.equal(run.independentReviewGates.reviewGates.blank, 6);
	assert.equal(run.independentReviewGates.readyForStrictProof, false);
	assert.deepEqual(run.independentReviewGates.pendingIds.slice(0, 2), [
		'reviewer:source_grounding_reviewer',
		'reviewer:trail_math_reviewer'
	]);
	const html = renderScoutLocalAiHistoryHtml(history);
	assert.match(html, /Reviewers Passed/u);
	assert.match(html, /Review Gates Passed/u);
	assert.match(html, /formatIndependentGateStats\(run\)/u);
	assert.match(html, /"currentRunIndependentReviewersPassed":0/u);
	assert.match(html, /"currentRunReviewGatesPassed":0/u);
	assert.match(html, /"blank":4/u);
	assert.match(html, /"blank":6/u);
	assert.match(html, /"readyForStrictProof":false/u);
});

test('Scout local AI history classifies document-grounding and release interventions', () => {
	const summary = summarizeCommitInterventions([
		{
			sha: '3333333333333333333333333333333333333333',
			committedAt: '2026-06-28T18:00:00.000Z',
			subject: 'Add Scout document vault eval routing',
			files: ['data/scout-local-ai/dad-local-ai-100.json', 'mobile/static/scout/dad-local-ai-100.json']
		},
		{
			sha: '4444444444444444444444444444444444444444',
			committedAt: '2026-06-28T19:00:00.000Z',
			subject: 'Document Scout build 28 upload handoff',
			files: ['docs/launch/testflight-dad-handoff.md']
		}
	]);

	assert.equal(summary.commitCount, 2);
	assert.ok(summary.categories.includes('suite-question-set'));
	assert.ok(summary.categories.includes('document-grounding'));
	assert.ok(summary.categories.includes('testflight/release-proof'));
	assert.equal(summary.categoryCounts['suite-question-set'], 1);
	assert.equal(summary.categoryCounts['testflight/release-proof'], 1);
});

test('Scout local AI history keeps current-run ratings separate from latest-known case ratings', async () => {
	const root = await mkdtemp(join(tmpdir(), 'scout-history-current-vs-known-'));
	const runDir = join(root, 'device-runs');
	const reviewDir = join(root, 'reviews');
	const scanDir = join(root, 'answer-quality-scans');
	await mkdir(runDir, { recursive: true });
	await mkdir(reviewDir, { recursive: true });
	await mkdir(scanDir, { recursive: true });
	const suitePath = join(root, 'dad-local-ai-100.json');
	await writeFile(suitePath, JSON.stringify({
		suiteId: 'dad-local-ai-100',
		version: '2026-06-29.2',
		hash: 'fnv1a32:current-vs-known',
		cases: [{
			id: 'DLA-067',
			domain: 'navigation',
			phase: 'on-trail',
			prompt: 'What should I do if GPS jumps around and Scout shows the wrong spot?',
			requiredTools: ['current_mile', 'source_search:safety'],
			expectedTraits: ['manual correction'],
			safetyCaveats: ['no decisions from bad GPS'],
			documentTask: 'reading-writing'
		}]
	}, null, 2));
	await writeRunAndReview({
		runDir,
		reviewDir,
		scanDir,
		runId: 'device-local-ai-20260629T050000Z',
		startedAt: '2026-06-29T05:00:00.000Z',
		answer: 'Stop, verify location from blazes and map, then set the current AT mile from a confirmed point.',
		confidence: 'medium',
		failureMode: null,
		rating: 5,
		notes: 'Dad-ready GPS recovery answer.',
		failureCategories: [],
		ownerLayer: '',
		improvementTask: ''
	});
	await writeRunAndReview({
		runDir,
		reviewDir,
		scanDir,
		runId: 'device-local-ai-20260629T061751Z',
		startedAt: '2026-06-29T06:17:51.000Z',
		answer: 'Stop, verify location from blazes and map, then set the current AT mile from a confirmed point. Then re-ask water and shelter questions.',
		confidence: 'medium',
		failureMode: null,
		rating: null,
		notes: '',
		failureCategories: [],
		ownerLayer: '',
		improvementTask: ''
	});

	const history = await buildScoutLocalAiHistory({
		repoRoot: root,
		suitePath,
		runDirs: [runDir],
		reviewDir,
		scanDir,
		gitCommits: []
	});

	assert.deepEqual(history.summary.latestRatings, { '5': 1 });
	assert.deepEqual(history.summary.latestKnownRatings, { '5': 1 });
	assert.equal(history.summary.currentRunId, 'device-local-ai-20260629T061751Z');
	assert.deepEqual(history.summary.currentRunRatingCounts, {});
	assert.equal(history.summary.currentRunRated, 0);
	assert.equal(history.summary.currentRunUnrated, 1);
	assert.equal(history.summary.currentRunBelowFive, 0);
	const html = renderScoutLocalAiHistoryHtml(history);
	assert.match(html, /Current Run Unrated/u);
	assert.match(html, /Latest Known 5\/5/u);
});

test('Scout local AI history does not demand rerun for proof-only pending commits', async () => {
	const root = await mkdtemp(join(tmpdir(), 'scout-history-proof-only-'));
	const runDir = join(root, 'device-runs');
	const reviewDir = join(root, 'reviews');
	const scanDir = join(root, 'answer-quality-scans');
	await mkdir(runDir, { recursive: true });
	await mkdir(reviewDir, { recursive: true });
	await mkdir(scanDir, { recursive: true });
	const suitePath = join(root, 'dad-local-ai-100.json');
	await writeFile(suitePath, JSON.stringify({
		suiteId: 'dad-local-ai-100',
		version: '2026-06-29.1',
		hash: 'fnv1a32:proof-only',
		cases: [{
			id: 'DLA-067',
			domain: 'navigation',
			phase: 'on-trail',
			prompt: 'What should I do if GPS jumps around and Scout shows the wrong spot?',
			requiredTools: ['current_mile', 'source_search:safety'],
			expectedTraits: ['manual correction'],
			safetyCaveats: ['no decisions from bad GPS'],
			documentTask: 'reading-writing'
		}]
	}, null, 2));
	await writeRunAndReview({
		runDir,
		reviewDir,
		scanDir,
		runId: 'device-local-ai-20260629T061751Z',
		startedAt: '2026-06-29T06:17:51.000Z',
		answer: 'Stop, verify location from blazes and map, then set the current AT mile from a confirmed point.',
		confidence: 'medium',
		failureMode: null,
		rating: 5,
		notes: 'Dad-ready GPS recovery answer.',
		failureCategories: [],
		ownerLayer: '',
		improvementTask: ''
	});

	const history = await buildScoutLocalAiHistory({
		repoRoot: root,
		suitePath,
		runDirs: [runDir],
		reviewDir,
		scanDir,
		gitCommits: [
			{
				sha: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
				committedAt: '2026-06-29T06:00:00.000Z',
				subject: 'Improve Scout GPS recovery answer',
				files: ['mobile/src/lib/scout/providers/on-device-gemma.ts']
			},
			{
				sha: 'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
				committedAt: '2026-06-29T06:40:00.000Z',
				subject: 'Record TestFlight upload for build 32',
				files: ['docs/launch/proof/ios-testflight-attempt-2026-06-29T06-36-29-834Z.md']
			},
			{
				sha: 'cccccccccccccccccccccccccccccccccccccccc',
				committedAt: '2026-06-29T06:43:00.000Z',
				subject: 'Refresh Dad Pilot for build 32',
				files: ['docs/launch/release-evidence.json', 'docs/launch/testflight-dad-handoff.md']
			},
			{
				sha: 'dddddddddddddddddddddddddddddddddddddddd',
				committedAt: '2026-06-29T06:45:00.000Z',
				subject: 'Track Scout status freshness',
				files: [
					'package.json',
					'data/scout-local-ai/README.md',
					'scripts/status-scout-local-ai.mjs',
					'scripts/scout-local-ai-status.test.mjs'
				]
			}
		]
	});

	assert.equal(history.pendingInterventions.commitCount, 3);
	assert.deepEqual(history.pendingInterventions.categories, ['docs/runbook', 'eval-review-process', 'history/reporting', 'testflight/release-proof']);
	assert.equal(history.pendingInterventions.rerunCommitCount, 0);
	assert.deepEqual(history.pendingInterventions.rerunCategories, []);
	assert.equal(history.pendingInterventions.requiresRerun, false);
	assert.equal(history.summary.pendingInterventionCommitCount, 3);
	assert.equal(history.summary.pendingRerunCommitCount, 0);
	const html = renderScoutLocalAiHistoryHtml(history);
	const pendingSection = extractPendingSection(html);
	assert.match(pendingSection, /Pending proof\/reporting context after latest run/u);
	assert.match(pendingSection, /no Scout answer rerun required/u);
	assert.doesNotMatch(pendingSection, /Pending Scout changes need a rerun/u);
	assert.match(pendingSection, /data-rerun="false"/u);
});

test('Scout local AI history flags pending Scout-affecting commits in HTML', async () => {
	const root = await mkdtemp(join(tmpdir(), 'scout-history-rerun-required-'));
	const runDir = join(root, 'device-runs');
	const reviewDir = join(root, 'reviews');
	const scanDir = join(root, 'answer-quality-scans');
	await mkdir(runDir, { recursive: true });
	await mkdir(reviewDir, { recursive: true });
	await mkdir(scanDir, { recursive: true });
	const suitePath = join(root, 'dad-local-ai-100.json');
	await writeFile(suitePath, JSON.stringify({
		suiteId: 'dad-local-ai-100',
		version: '2026-06-29.1',
		hash: 'fnv1a32:rerun-required',
		cases: [{
			id: 'DLA-067',
			domain: 'navigation',
			phase: 'on-trail',
			prompt: 'What should I do if GPS jumps around and Scout shows the wrong spot?',
			requiredTools: ['current_mile', 'source_search:safety'],
			expectedTraits: ['manual correction'],
			safetyCaveats: ['no decisions from bad GPS'],
			documentTask: 'reading-writing'
		}]
	}, null, 2));
	await writeRunAndReview({
		runDir,
		reviewDir,
		scanDir,
		runId: 'device-local-ai-20260629T061751Z',
		startedAt: '2026-06-29T06:17:51.000Z',
		answer: 'Stop, verify location from blazes and map, then set the current AT mile from a confirmed point.',
		confidence: 'medium',
		failureMode: null,
		rating: 5,
		notes: 'Dad-ready GPS recovery answer.',
		failureCategories: [],
		ownerLayer: '',
		improvementTask: ''
	});

	const history = await buildScoutLocalAiHistory({
		repoRoot: root,
		suitePath,
		runDirs: [runDir],
		reviewDir,
		scanDir,
		gitCommits: [
			{
				sha: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
				committedAt: '2026-06-29T06:00:00.000Z',
				subject: 'Baseline Scout GPS recovery answer',
				files: ['mobile/src/lib/scout/providers/on-device-gemma.ts']
			},
			{
				sha: 'dddddddddddddddddddddddddddddddddddddddd',
				committedAt: '2026-06-29T06:50:00.000Z',
				subject: 'Tighten Scout GPS recovery answer contract',
				files: ['mobile/src/lib/scout/providers/on-device-gemma.ts']
			}
		]
	});

	assert.equal(history.pendingInterventions.requiresRerun, true);
	assert.equal(history.pendingInterventions.rerunCommitCount, 1);
	assert.deepEqual(history.pendingInterventions.rerunCategories, ['prompt/answer-contract']);
	const html = renderScoutLocalAiHistoryHtml(history);
	const pendingSection = extractPendingSection(html);
	assert.match(pendingSection, /Pending Scout changes need a rerun/u);
	assert.match(pendingSection, /rerun required: 1 commit\(s\) \(prompt\/answer-contract\)/u);
	assert.doesNotMatch(pendingSection, /no Scout answer rerun required/u);
	assert.match(pendingSection, /data-rerun="true"/u);
});

function extractPendingSection(html) {
	return html.match(/<section class="panel pending" id="pendingChanges"[\s\S]*?<\/section>/u)?.[0] ?? '';
}

async function writeRunAndReview({
	runDir,
	reviewDir,
	scanDir,
	runId,
	startedAt,
	answer,
	confidence = 'medium',
	failureMode = null,
	rating,
	notes,
	failureCategories,
	ownerLayer,
	improvementTask,
	independentReviewerStatus = 'pass',
	reviewGatePassed = true
}) {
	const result = {
		caseId: 'DLA-067',
		case: {
			id: 'DLA-067',
			domain: 'navigation',
			phase: 'on-trail',
			prompt: 'What should I do if GPS jumps around and Scout shows the wrong spot?',
			requiredTools: ['current_mile', 'source_search:safety'],
			expectedTraits: ['manual correction'],
			safetyCaveats: ['no decisions from bad GPS'],
			documentTask: 'reading-writing'
		},
		answer,
		answerOrigin: 'device-on-device-gemma',
		mode: 'on-device',
		provider: 'on-device-gemma',
		confidence,
		failureMode,
		generatedAt: startedAt,
		durationMs: 1000,
		receipts: [{ id: 'field-guide:safety-risk-discipline' }],
		toolInvocations: [
			{ toolId: 'current_mile', args: {}, summary: 'Currently at mile 302.8.', receipts: [{ id: 'trail-pack:calibrated-at-mile-frame' }] },
			{
				toolId: 'source_search',
				args: { sourceSkill: 'safety' },
				summary: 'Safety guidance.',
				receipts: [{ id: 'field-guide:safety-risk-discipline' }],
				sourceDocumentIds: ['field-guide:safety-risk-discipline']
			}
		],
		toolExpectations: {
			required: ['current_mile', 'source_search:safety'],
			hit: ['current_mile', 'source_search:safety'],
			missing: []
		}
	};
	const run = {
		schemaVersion: 1,
		runId,
		suiteId: 'dad-local-ai-100',
		suiteVersion: '2026-06-27.2',
		suiteHash: 'fnv1a32:test',
		generatedAt: startedAt,
		evidenceLane: 'device-on-device-gemma',
		caseCount: 1,
		totalSuiteCases: 100,
		runContext: {
			modelId: 'gemma-4-E2B-it-litert-lm',
			native: { platform: 'ios' },
			app: { version: '1.0', build: '27' },
			installSource: { type: 'debug', platform: 'ios' },
			execution: { startedAt, evidenceLane: 'device-on-device-gemma' }
		},
		results: [result]
	};
	const review = {
		schemaVersion: 1,
		runId,
		suiteId: 'dad-local-ai-100',
		suiteVersion: '2026-06-27.2',
		suiteHash: 'fnv1a32:test',
		runPath: `device-runs/${runId}.json`,
		evidenceLane: 'device-on-device-gemma',
		independentReviewers: independentReviewersForHistory(independentReviewerStatus),
		reviewGates: reviewGatesForHistory(reviewGatePassed),
		cases: [{
			...result.case,
			caseId: 'DLA-067',
			prompt: result.case.prompt,
			answer,
			answerPreview: answer,
			confidence,
			failureMode,
			rating,
			notes,
			failureCategories,
			ownerLayer,
			improvementTask,
			receipts: result.receipts,
			toolInvocations: result.toolInvocations,
			toolExpectations: result.toolExpectations
		}]
	};
	await writeFile(join(runDir, `${runId}.json`), JSON.stringify(run, null, 2));
	await writeFile(join(reviewDir, `${runId}.review.json`), JSON.stringify(review, null, 2));
	await writeFile(join(scanDir, `${runId}.scan.json`), JSON.stringify({
		schemaVersion: 1,
		runId,
		flaggedCount: 0,
		errorCount: 0,
		warningCount: 0,
		flagged: []
	}, null, 2));
	assert.ok((await readFile(join(runDir, `${runId}.json`), 'utf8')).includes(runId));
}

function independentReviewersForHistory(status) {
	return [
		'source_grounding_reviewer',
		'trail_math_reviewer',
		'document_writing_reviewer',
		'proof_lane_reviewer'
	].map((id) => ({
		id,
		input: `Fixture input for ${id}`,
		checks: [`Fixture check for ${id}`],
		mustBeSeparateFrom: ['answer_generation'],
		status,
		notes: status === 'pass' ? 'Fixture reviewer pass.' : ''
	}));
}

function reviewGatesForHistory(passed) {
	return [
		'independent_artifact_review',
		'tool_source_evidence',
		'human_1_to_5_rating',
		'below_five_task',
		'strict_testflight_iphone',
		'stability_repeat'
	].map((id) => ({
		id,
		rule: `Fixture rule for ${id}`,
		passed,
		notes: passed === true ? 'Fixture gate pass.' : ''
	}));
}
