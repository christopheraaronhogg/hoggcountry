import assert from 'node:assert/strict';
import test from 'node:test';

import { scanScoutLocalAiAnswerQuality } from './scan-scout-local-ai-answer-quality.mjs';

test('flags vague town readiness answers without flagging no-basemap map prompts', () => {
	const report = scanScoutLocalAiAnswerQuality(runWith([
		result({
			caseId: 'DLA-085',
			prompt: 'What should I charge, refresh, and download in town before I lose service again?',
			answer: 'This covers the offline readiness steps mentioned in the safety guidance.'
		}),
		result({
			caseId: 'DLA-063',
			prompt: 'How do I use the map when there is no basemap or cell signal?',
			answer: 'Use the cached trail line and any external offline maps you already saved. Do not rely on missing basemap tiles for complex navigation.'
		})
	]));

	assert.deepEqual(checkIdsFor(report, 'DLA-085'), [
		'town-offline-readiness-missing',
		'vague-source-only',
		'very-short-answer'
	]);
	assert.deepEqual(checkIdsFor(report, 'DLA-063'), []);
});

test('allows explicit Bible prompts and offline Bible readiness wording', () => {
	const report = scanScoutLocalAiAnswerQuality(runWith([
		result({
			caseId: 'DLA-BIBLE',
			prompt: 'Read John 3:16 and explain it simply.',
			answer: 'John 3:16 says God loved the world and gave his Son. The simple point is that grace is offered, not earned.'
		}),
		result({
			caseId: 'DLA-OFFLINE',
			prompt: 'What phone settings and offline downloads should I set before going offline?',
			answer: 'Before going offline, refresh maps and the field pack, confirm the local AI model works, verify Bible text is available offline, and keep the phone in low power mode.'
		})
	]));

	assert.deepEqual(checkIdsFor(report, 'DLA-BIBLE'), []);
	assert.deepEqual(checkIdsFor(report, 'DLA-OFFLINE'), []);
});

test('flags weather answers that omit fetched forecast details', () => {
	const prompt = 'Thunderstorms are possible this afternoon. What should I do with today\'s hike?';
	const toolInvocations = [
		{
			toolId: 'weather_lookup',
			summary: 'Cached forecast: high 67F / low 51F, wind 22 mph, storms after 2 PM.'
		}
	];
	const report = scanScoutLocalAiAnswerQuality(runWith([
		result({
			caseId: 'DLA-WEATHER-BAD',
			prompt,
			answer: 'Treat the weather as a real safety constraint. Start early, avoid exposed ridges, and be ready to stop before the storm window.',
			toolInvocations
		}),
		result({
			caseId: 'DLA-WEATHER-GOOD',
			prompt,
			answer: 'The cached forecast shows a 67F high with 22 mph wind and storms after 2 PM. Start early, avoid exposed ridges, and stop before lightning risk builds.',
			toolInvocations
		})
	]));

	assert.ok(checkIdsFor(report, 'DLA-WEATHER-BAD').includes('weather-summary-missing'));
	assert.deepEqual(checkIdsFor(report, 'DLA-WEATHER-GOOD'), []);
});

test('flags frozen-filter answers missing compromise, backup treatment, or warm-storage guidance', () => {
	const prompt = 'What if my water filter freezes overnight?';
	const report = scanScoutLocalAiAnswerQuality(runWith([
		result({
			caseId: 'DLA-FILTER-BAD',
			prompt,
			answer: 'If your filter freezes, use caution and check the next water source before depending on it.'
		}),
		result({
			caseId: 'DLA-FILTER-GOOD',
			prompt,
			answer: 'If a hollow-fiber filter froze, treat it as possibly compromised. Use backup water tablets until you can replace or verify it, and prevent another freeze by sleeping with the filter or keeping it warm overnight.'
		})
	]));

	assert.ok(checkIdsFor(report, 'DLA-FILTER-BAD').includes('frozen-filter-safety-missing'));
	assert.deepEqual(checkIdsFor(report, 'DLA-FILTER-GOOD'), []);
});

test('reports the heuristic boundary in machine output', () => {
	const report = scanScoutLocalAiAnswerQuality(runWith([]));

	assert.equal(report.caseCount, 0);
	assert.match(report.note, /does not replace human 1-5 ratings/iu);
	assert.match(report.note, /TestFlight\/iPhone proof/iu);
});

function runWith(results) {
	return {
		runId: 'answer-quality-scan-fixture',
		suiteId: 'dad-local-ai-100',
		suiteVersion: 'test',
		results
	};
}

function result({ caseId, prompt, answer, toolInvocations = [], error = null }) {
	return {
		caseId,
		case: {
			id: caseId,
			domain: 'test',
			phase: 'test',
			prompt
		},
		answer,
		error,
		toolInvocations
	};
}

function checkIdsFor(report, caseId) {
	const item = report.flagged.find((candidate) => candidate.caseId === caseId);
	return (item?.checks ?? []).map((check) => check.id).sort();
}
