import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
	buildScoutLocalAiEvalPack,
	runScoutLocalAiEval,
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
		improvementTags: ['water'],
		...patch
	};
}

function suite(cases: ScoutLocalAiEvalCase[]): ScoutLocalAiEvalSuite {
	return {
		schemaVersion: 1,
		suiteId: 'dad-local-ai-100',
		title: 'Dad Local AI 100-question Scout evaluation',
		createdAt: '2026-06-26',
		successTarget: 'all 5/5',
		ratingScale: { '5': 'Dad-ready' },
		failureCategories: ['bad-routing'],
		cases
	};
}

function answer(prompt: string): ScoutAnswer {
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
				receipts: []
			}
		],
		requiredConfirmations: [],
		safetyFlags: [],
		contextUsed: ['on-device-gemma'],
		generatedAt: '2026-06-26T12:00:00.000Z'
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
	assert.deepEqual(run.runContext, { surface: 'test-device' });
	assert.equal(run.caseCount, 1);
	assert.equal(run.summary.toolExpectationComplete, 1);
	assert.equal(run.results[0].answerOrigin, 'device-on-device-gemma');
	assert.deepEqual(run.results[0].toolExpectations.missing, []);
	assert.equal(run.results[0].rating, null);
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
	assert.equal(resumed.caseCount, 3);
	assert.deepEqual(resumed.results.map((result) => result.caseId), ['DLA-001', 'DLA-002', 'DLA-003']);
	assert.deepEqual(snapshots, [1, 2, 3]);
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
