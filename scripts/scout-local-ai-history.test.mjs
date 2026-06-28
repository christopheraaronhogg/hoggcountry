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

test('Scout local AI history tracks answer evolution and score deltas', async () => {
	const root = await mkdtemp(join(tmpdir(), 'scout-history-'));
	const runDir = join(root, 'device-runs');
	const reviewDir = join(root, 'reviews');
	const scanDir = join(root, 'answer-quality-scans');
	await mkdir(runDir, { recursive: true });
	await mkdir(reviewDir, { recursive: true });
	await mkdir(scanDir, { recursive: true });
	const suitePath = join(root, 'dad-local-ai-100.json');
	await writeFile(suitePath, JSON.stringify({
		suiteId: 'dad-local-ai-100',
		version: '2026-06-27.2',
		hash: 'fnv1a32:test',
		cases: [
			{
				id: 'DLA-067',
				domain: 'navigation',
				phase: 'on-trail',
				prompt: 'What should I do if GPS jumps around and Scout shows the wrong spot?',
				requiredTools: ['current_mile', 'source_search:safety'],
				expectedTraits: ['manual correction'],
				safetyCaveats: ['no decisions from bad GPS']
			}
		]
	}, null, 2));

	await writeRunAndReview({
		runDir,
		reviewDir,
		scanDir,
		runId: 'device-local-ai-20260628T081954Z',
		startedAt: '2026-06-28T08:19:54.000Z',
		answer: 'Stop and use map and compass, but no Scout-specific recovery flow.',
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
	assert.equal(history.summary.caseCount, 1);
	assert.equal(history.summary.reviewedEntryCount, 2);
	assert.equal(history.summary.improvedToFive, 1);
	assert.equal(history.runs[0].runId, 'device-local-ai-20260628T081954Z');
	assert.equal(history.runs[1].reviewSummary.ratingCounts['5'], 1);
	assert.equal(history.runs[1].interventions.commitCount, 1);
	assert.deepEqual(history.runs[1].interventions.categories, ['document-grounding', 'tool-routing/source-retrieval']);
	assert.equal(history.summary.interventionCounts['prompt/answer-contract'], 1);
	assert.equal(history.summary.interventionCounts['tool-routing/source-retrieval'], 1);
	assert.equal(history.summary.pendingInterventionCommitCount, 1);
	assert.deepEqual(history.summary.pendingInterventionCategories, ['eval-review-process']);
	assert.equal(history.pendingInterventions.pendingSinceRunId, 'device-local-ai-20260628T143612Z');
	assert.equal(history.pendingInterventions.requiresRerun, true);
	const gpsCase = history.cases[0];
	assert.equal(gpsCase.caseId, 'DLA-067');
	assert.equal(gpsCase.firstRating, 3);
	assert.equal(gpsCase.latestRating, 5);
	assert.equal(gpsCase.scoreDelta, 2);
	assert.equal(gpsCase.answerChangeCount, 1);
	assert.equal(gpsCase.history[1].previousRating, 3);
	assert.equal(gpsCase.history[1].scoreDeltaFromPreviousRated, 2);
	assert.equal(gpsCase.history[1].improvementSincePrevious, true);
	assert.equal(gpsCase.history[1].sourceEvidenceComplete, true);
	assert.equal(gpsCase.history[1].interventions.commitCount, 1);

	const html = renderScoutLocalAiHistoryHtml(history);
	assert.match(html, /type="range"/u);
	assert.match(html, /Scout Local AI History/u);
	assert.match(html, /DLA-067/u);
	assert.match(html, /GPS jumps/u);
	assert.match(html, /Changes since previous run/u);
	assert.match(html, /Fix Scout GPS recovery source routing/u);
	assert.match(html, /Pending changes not yet measured by a run/u);
	assert.match(html, /Track Scout eval interventions in history/u);
	assert.doesNotMatch(html, /<\/script><script/u);
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

async function writeRunAndReview({
	runDir,
	reviewDir,
	scanDir,
	runId,
	startedAt,
	answer,
	rating,
	notes,
	failureCategories,
	ownerLayer,
	improvementTask
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
			safetyCaveats: ['no decisions from bad GPS']
		},
		answer,
		answerOrigin: 'device-on-device-gemma',
		mode: 'on-device',
		provider: 'on-device-gemma',
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
		cases: [{
			...result.case,
			caseId: 'DLA-067',
			prompt: result.case.prompt,
			answer,
			answerPreview: answer,
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
