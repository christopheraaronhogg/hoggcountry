import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
	buildScoutLocalAiEvalPack,
	SCOUT_LOCAL_AI_EVAL_PREPARE_REVIEW_COMMAND,
	SCOUT_LOCAL_AI_EVAL_REVIEW_INBOX_PATH,
	runScoutLocalAiEval,
	scoutLocalAiSuiteHash,
	type ScoutLocalAiEvalCase,
	type ScoutLocalAiEvalSuite
} from './local-ai-eval.ts';
import type { ScoutAnswer, ScoutConversationMessage } from './types.ts';

function evalCase(patch: Partial<ScoutLocalAiEvalCase> = {}): ScoutLocalAiEvalCase {
	return {
		id: 'DLA-001',
		phase: 'pre-trail',
		domain: 'pretrip',
		prompt: 'What water is ahead from my current mile?',
		mile: 31.7,
		requiredTools: ['next_water', 'source_search:water'],
		expectedTraits: ['answers with nearest water first'],
		safetyCaveats: ['does not invent current flow'],
		documentTask: 'reading',
		improvementTags: ['water'],
		...patch
	};
}

function suite(cases: ScoutLocalAiEvalCase[]): ScoutLocalAiEvalSuite {
	return {
		schemaVersion: 1,
		suiteId: 'dad-local-ai-100',
		title: 'Dad Local AI 100-question Scout evaluation',
		version: '2026-06-26.1',
		createdAt: '2026-06-26',
		successTarget: 'all 5/5',
		ratingScale: { '5': 'Dad-ready' },
		failureCategories: ['bad-routing'],
		cases
	};
}

function answer(prompt: string, options: { sourceEvidence?: boolean } = {}): ScoutAnswer {
	const sourceEvidence = options.sourceEvidence ?? true;
	return {
		answer: `answer for ${prompt}`,
		confidence: 'medium',
		mode: 'on-device',
		provider: 'on-device-gemma',
		receipts: [],
		toolInvocations: [
			{
				toolId: 'next_water',
				args: {},
				summary: 'Next water.',
				confidence: 'high',
				receipts: []
			},
			{
				toolId: 'source_search',
				args: { sourceSkill: 'water' },
				summary: 'Water source skill.',
				confidence: 'medium',
				receipts: sourceEvidence
					? [
						{
							id: 'receipt:water-source',
							title: 'Water source skill',
							kind: 'field-guide',
							citation: 'Eval water source'
						}
					]
					: [],
				sourceDocumentIds: sourceEvidence ? ['eval-water-discipline'] : []
			}
		],
		requiredConfirmations: [],
		safetyFlags: [],
		contextUsed: ['on-device-gemma'],
		generatedAt: '2026-06-26T12:00:00.000Z'
	};
}

function finalDeviceRunContext(): Record<string, unknown> {
	return {
		surface: 'mobile-settings-scout-eval-lab',
		native: {
			isNativePlatform: true,
			platform: 'ios'
		},
		app: {
			id: 'com.hoggcountry.trailassistant',
			name: 'Hoggcountry',
			version: '1.0',
			build: '13'
		},
		installSource: {
			type: 'testflight'
		},
		runtimeConfigured: true,
		modelId: 'gemma-3n-e2b-it-int4'
	};
}

test('runScoutLocalAiEval records on-device answers and tool expectations', async () => {
	const run = await runScoutLocalAiEval({
		suite: suite([evalCase()]),
		evidenceLane: 'device-on-device-gemma',
		runContext: { surface: 'test-device' },
		now: new Date('2026-06-26T12:00:00.000Z'),
		ask: ({ testCase, pack }) => {
			assert.equal(pack.hiker.currentMile, 31.7);
			return Promise.resolve(answer(testCase.prompt));
		}
	});

	assert.equal(run.evidenceLane, 'device-on-device-gemma');
	assert.equal(run.runContext?.surface, 'test-device');
	assert.match(String((run.runContext?.execution as Record<string, unknown>)?.id ?? ''), /^scout-eval-20260626T120000Z-/u);
	assert.deepEqual(run.runContext?.execution, {
		id: (run.runContext?.execution as Record<string, unknown>).id,
		runId: run.runId,
		startedAt: '2026-06-26T12:00:00.000Z',
		evidenceLane: 'device-on-device-gemma',
		source: 'scout-local-ai-eval'
	});
	assert.equal(run.suiteVersion, '2026-06-26.1');
	assert.equal(run.suiteHash, scoutLocalAiSuiteHash(suite([evalCase()])));
	assert.equal(run.caseCount, 1);
	assert.equal(run.summary.toolExpectationComplete, 1);
	assert.equal(run.summary.sourceEvidenceComplete, 1);
	assert.equal(run.summary.missingSourceEvidenceCases, 0);
	assert.equal(run.results[0].answerOrigin, 'device-on-device-gemma');
	assert.deepEqual(run.results[0].toolExpectations.missing, []);
	assert.equal(run.results[0].rating, null);
});

test('buildScoutLocalAiEvalPack carries cached terrain for offline difficulty questions', () => {
	const pack = buildScoutLocalAiEvalPack(
		evalCase({
			id: 'DLA-066',
			prompt: 'How far to the next climb and how hard is the terrain ahead?',
			mile: 247.3,
			requiredTools: ['upcoming_terrain', 'source_search:terrain', 'open_source_doc:terrain']
		}),
		new Date('2026-06-26T12:00:00.000Z')
	);

	assert.equal(pack.terrain?.fromMile, 247.3);
	assert.equal(pack.terrain?.toMile, 262.3);
	assert.equal(pack.terrain?.lookaheadMiles, 15);
	assert.equal(pack.terrain?.gainFt, 1420);
	assert.equal(pack.terrain?.lossFt, 760);
	assert.equal(pack.terrain?.maxGradePercent, 14.8);
	assert.equal(pack.terrain?.difficultyLabel, 'moderate-hard');
	assert.equal(pack.terrain?.climbs[0]?.startMile, 249.4);
	assert.match(pack.terrain?.sourceLabel ?? '', /cached terrain/i);
});

test('runScoutLocalAiEval can target explicit case ids for diagnostic reruns', async () => {
	const testSuite = suite([
		evalCase({ id: 'DLA-001', prompt: 'first case' }),
		evalCase({ id: 'DLA-022', prompt: 'rain pants case' }),
		evalCase({ id: 'DLA-028', prompt: 'slow filter case' })
	]);
	const seen: string[] = [];

	const run = await runScoutLocalAiEval({
		suite: testSuite,
		evidenceLane: 'device-on-device-gemma',
		caseIds: ['DLA-028', 'DLA-022'],
		now: new Date('2026-06-26T12:00:00.000Z'),
		ask: ({ testCase }) => {
			seen.push(testCase.id);
			return Promise.resolve(answer(testCase.prompt));
		}
	});

	assert.deepEqual(seen, ['DLA-028', 'DLA-022']);
	assert.deepEqual(run.results.map((result) => result.caseId), ['DLA-028', 'DLA-022']);
	assert.equal(run.caseCount, 2);
	assert.equal(run.filters.id, 'DLA-028,DLA-022');
	assert.equal(run.filters.limit, null);
	assert.equal(run.exportHandoff?.expectedAcceptanceStatus, 'diagnostic-review-only');
	assert.equal(run.exportHandoff?.run.targetCases, 2);
});

test('runScoutLocalAiEval rejects unknown targeted case ids before running', async () => {
	await assert.rejects(
		() =>
			runScoutLocalAiEval({
				suite: suite([evalCase({ id: 'DLA-001' })]),
				evidenceLane: 'device-on-device-gemma',
				caseIds: ['DLA-404'],
				ask: ({ testCase }) => Promise.resolve(answer(testCase.prompt))
			}),
		/Unknown Scout local AI eval case id requested: DLA-404/u
	);
});

test('runScoutLocalAiEval embeds final inbox handoff when device proof context matches', async () => {
	const testSuite = {
		...suite([evalCase()]),
		finalProof: {
			nativePlatform: 'ios',
			installSource: 'testflight',
			minAppVersion: '1.0',
			minAppBuild: 13
		}
	};
	const run = await runScoutLocalAiEval({
		suite: testSuite,
		evidenceLane: 'device-on-device-gemma',
		runContext: finalDeviceRunContext(),
		now: new Date('2026-06-26T12:00:00.000Z'),
		ask: ({ testCase }) => Promise.resolve(answer(testCase.prompt))
	});

	assert.equal(run.exportHandoff?.kind, 'final-run-100');
	assert.equal(run.exportHandoff?.expectedAcceptanceStatus, 'final-review-ready');
	assert.equal(run.exportHandoff?.canStartFinalReview, true);
	assert.equal(run.exportHandoff?.reviewInboxPath, SCOUT_LOCAL_AI_EVAL_REVIEW_INBOX_PATH);
	assert.equal(run.exportHandoff?.prepareReviewCommand, SCOUT_LOCAL_AI_EVAL_PREPARE_REVIEW_COMMAND);
	assert.equal(run.exportHandoff?.suite.hash, scoutLocalAiSuiteHash(testSuite));
	assert.equal(run.exportHandoff?.run.completedCases, 1);
	assert.deepEqual(run.exportHandoff?.proofContextProblems, []);
	assert.match(run.exportHandoff?.proofBoundary ?? '', /all 100 cases rated 5\/5/u);
});

test('runScoutLocalAiEval summarizes source-backed tool hits without evidence', async () => {
	const run = await runScoutLocalAiEval({
		suite: suite([evalCase()]),
		evidenceLane: 'device-on-device-gemma',
		now: new Date('2026-06-26T12:00:00.000Z'),
		ask: ({ testCase }) => Promise.resolve(answer(testCase.prompt, { sourceEvidence: false }))
	});

	assert.equal(run.summary.toolExpectationComplete, 1);
	assert.equal(run.summary.sourceEvidenceComplete, 0);
	assert.equal(run.summary.missingSourceEvidenceCases, 1);
	assert.deepEqual(run.summary.missingSourceEvidenceCounts, { 'source_search:water': 1 });
});

test('runScoutLocalAiEval preserves prior answer context for DLA-097 follow-ups', async () => {
	const histories: ScoutConversationMessage[][] = [];
	const run = await runScoutLocalAiEval({
		suite: suite([
			evalCase({ id: 'DLA-096', prompt: 'Can you pray with me but also help me make a safe plan?' }),
			evalCase({
				id: 'DLA-097',
				prompt: 'Answer my last question again but shorter.',
				requiredTools: ['next_water']
			})
		]),
		evidenceLane: 'device-on-device-gemma',
		now: new Date('2026-06-26T12:00:00.000Z'),
		ask: ({ testCase, conversationHistory }) => {
			histories.push(conversationHistory);
			return Promise.resolve(answer(testCase.prompt));
		}
	});

	assert.equal(run.caseCount, 2);
	assert.deepEqual(histories[0], []);
	assert.equal(histories[1][0]?.role, 'user');
	assert.match(histories[1][0]?.content ?? '', /pray with me/);
	assert.equal(histories[1][1]?.role, 'assistant');
});

test('runScoutLocalAiEval resumes from a saved partial run and snapshots progress', async () => {
	let asks = 0;
	const cases = [
		evalCase({ id: 'DLA-001', prompt: 'What water is ahead?' }),
		evalCase({ id: 'DLA-002', prompt: 'Where should I sleep tonight?', requiredTools: ['next_shelter'] }),
		evalCase({ id: 'DLA-003', prompt: 'How should I handle this storm?', requiredTools: ['weather_check'] })
	];
	const firstRun = await runScoutLocalAiEval({
		suite: suite(cases),
		evidenceLane: 'device-on-device-gemma',
		limit: 2,
		now: new Date('2026-06-26T12:00:00.000Z'),
		ask: ({ testCase }) => {
			asks += 1;
			return Promise.resolve(answer(testCase.prompt));
		}
	});
	const snapshots: number[] = [];

	const resumed = await runScoutLocalAiEval({
		suite: suite(cases),
		evidenceLane: 'device-on-device-gemma',
		previousRun: firstRun,
		now: new Date('2026-06-26T12:30:00.000Z'),
		onSnapshot: (snapshot) => {
			snapshots.push(snapshot.caseCount);
		},
		ask: ({ testCase }) => {
			asks += 1;
			return Promise.resolve(answer(testCase.prompt));
		}
	});

	assert.equal(asks, 3);
	assert.equal(resumed.runId, firstRun.runId);
	assert.equal(resumed.generatedAt, firstRun.generatedAt);
	assert.deepEqual(resumed.runContext?.execution, firstRun.runContext?.execution);
	assert.equal(resumed.caseCount, 3);
	assert.deepEqual(resumed.results.map((result) => result.caseId), ['DLA-001', 'DLA-002', 'DLA-003']);
	assert.deepEqual(snapshots, [1, 2, 3]);
});

test('runScoutLocalAiEval rejects stale saved runs from a different suite version', async () => {
	const cases = [
		evalCase({ id: 'DLA-001', prompt: 'What water is ahead?' }),
		evalCase({ id: 'DLA-002', prompt: 'Where should I sleep tonight?', requiredTools: ['next_shelter'] })
	];
	const oldSuite = suite(cases);
	const firstRun = await runScoutLocalAiEval({
		suite: oldSuite,
		evidenceLane: 'device-on-device-gemma',
		limit: 1,
		now: new Date('2026-06-26T12:00:00.000Z'),
		ask: ({ testCase }) => Promise.resolve(answer(testCase.prompt))
	});
	const nextSuite = {
		...oldSuite,
		version: '2026-06-27.1'
	};

	await assert.rejects(
		runScoutLocalAiEval({
			suite: nextSuite,
			evidenceLane: 'device-on-device-gemma',
			previousRun: firstRun,
			now: new Date('2026-06-26T12:30:00.000Z'),
			ask: ({ testCase }) => Promise.resolve(answer(testCase.prompt))
		}),
		/different 100-question suite|suite version/u
	);
});

test('runScoutLocalAiEval retries prior provider errors during resume', async () => {
	let asks = 0;
	const testSuite = suite([
		evalCase({ id: 'DLA-001', prompt: 'What water is ahead?' }),
		evalCase({ id: 'DLA-002', prompt: 'Where should I sleep tonight?', requiredTools: ['next_shelter'] })
	]);
	const failed = await runScoutLocalAiEval({
		suite: testSuite,
		evidenceLane: 'device-on-device-gemma',
		limit: 1,
		now: new Date('2026-06-26T12:00:00.000Z'),
		ask: () => {
			asks += 1;
			return Promise.reject(new Error('model stopped'));
		}
	});

	const resumed = await runScoutLocalAiEval({
		suite: testSuite,
		evidenceLane: 'device-on-device-gemma',
		previousRun: failed,
		now: new Date('2026-06-26T12:30:00.000Z'),
		ask: ({ testCase }) => {
			asks += 1;
			return Promise.resolve(answer(testCase.prompt));
		}
	});

	assert.equal(asks, 3);
	assert.equal(resumed.caseCount, 2);
	assert.equal(resumed.results[0].error, undefined);
	assert.match(resumed.results[0].answer, /What water is ahead/);
});

test('buildScoutLocalAiEvalPack creates isolated eval context for a case mile', () => {
	const pack = buildScoutLocalAiEvalPack(evalCase({ mile: 501.8 }), new Date('2026-06-26T12:00:00.000Z'));

	assert.equal(pack.hiker.currentMile, 501.8);
	assert.ok(pack.water.some((source) => source.mile > 501.8));
	assert.ok(pack.guideExcerpts.some((excerpt) => excerpt.id === 'eval-water-discipline'));
	assert.ok(pack.documents?.some((document) => document.id === 'dad-offline-setup'));
});
