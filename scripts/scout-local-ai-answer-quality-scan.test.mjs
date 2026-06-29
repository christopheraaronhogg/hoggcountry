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
		}),
		result({
			caseId: 'DLA-AIRPLANE',
			prompt: 'Can I use Scout with no cell service if I am in airplane mode?',
			answer: 'In airplane mode, Scout can answer from the cached field pack, on-device local AI model, saved offline maps/docs, and Bible text if it was packaged or downloaded. It cannot fetch fresh weather, closures, cloud sync, messages, or live location until you are back online.'
		}),
		result({
			caseId: 'DLA-098',
			prompt: 'What can you still answer in airplane mode?',
			answer: 'In airplane mode, Scout can answer from the cached field pack, on-device local AI model, saved offline maps/docs, and Bible text if it was packaged or downloaded. It cannot fetch fresh weather, official closures, cloud sync, messages, or live location until you are back online.'
		}),
		result({
			caseId: 'DLA-094',
			prompt: 'What must I do to be saved?',
			answer: 'The Bible answers directly: believe on the Lord Jesus Christ, repent and turn to God, receive salvation by grace through faith, and call on the name of the Lord.'
		})
	]));

	assert.deepEqual(checkIdsFor(report, 'DLA-BIBLE'), []);
	assert.deepEqual(checkIdsFor(report, 'DLA-OFFLINE'), []);
	assert.deepEqual(checkIdsFor(report, 'DLA-AIRPLANE'), []);
	assert.deepEqual(checkIdsFor(report, 'DLA-098'), []);
	assert.deepEqual(checkIdsFor(report, 'DLA-094'), []);
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

test('flags opened-document answers that hide the source basis', () => {
	const report = scanScoutLocalAiAnswerQuality(runWith([
		result({
			caseId: 'DLA-SOURCE-HIDDEN',
			prompt: 'What should I tell family about check-ins and what should they do if I miss one?',
			requiredTools: ['source_search:safety', 'open_source_doc:safety'],
			answer: 'Tell your family your usual check-in cadence, route area, next expected stop, and escalation window. If you miss that window, they should try direct contact first, then follow the emergency plan instead of guessing.'
		}),
		result({
			caseId: 'DLA-SOURCE-VISIBLE',
			prompt: 'What should I tell family about check-ins and what should they do if I miss one?',
			requiredTools: ['source_search:safety', 'open_source_doc:safety'],
			answer: 'The safety guidance says to give family your usual check-in cadence, route area, next expected stop, and escalation window. If you miss that window, they should try direct contact first, then follow the emergency plan instead of guessing.'
		}),
		result({
			caseId: 'DLA-TOOL-OPENED',
			prompt: 'How should Scout handle medical advice if I ask about symptoms?',
			answer: 'Scout can help you make a conservative field decision, but it cannot diagnose, clear you to keep hiking, or replace a clinician or emergency services. For symptoms, stop or reduce exertion, choose a safer stop or exit, and seek medical help for red flags.',
			toolInvocations: [{ toolId: 'open_source_doc', summary: 'Opened safety source.' }]
		})
	]));

	assert.deepEqual(checkIdsFor(report, 'DLA-SOURCE-HIDDEN'), ['source-grounding-visible-missing']);
	assert.deepEqual(checkIdsFor(report, 'DLA-SOURCE-VISIBLE'), []);
	assert.deepEqual(checkIdsFor(report, 'DLA-TOOL-OPENED'), ['source-grounding-visible-missing']);
});

test('flags document-writing prompts that omit the requested draft or save confirmation boundary', () => {
	const report = scanScoutLocalAiAnswerQuality(runWith([
		result({
			caseId: 'DLA-020',
			prompt: 'What should I screenshot or save before day one in case the app or signal acts up, and can you draft that checklist?',
			answer: 'Before day one, screenshot or save offline: current mile, itinerary, emergency contacts, next resupply, offline map status, permits, reservations, and medication notes. Do not paste private numbers into Scout chat.',
			improvementTags: ['document-writing']
		}),
		result({
			caseId: 'DLA-090',
			prompt: 'What should I update in Scout before leaving town, and can you draft my town-exit update note?',
			answer: 'Before leaving town, update Scout with your current mile, field pack, weather, closures, loadout, documents, offline maps, and airplane-mode test.',
			improvementTags: ['document-writing']
		}),
		result({
			caseId: 'DLA-DOC-GOOD',
			prompt: 'Can you draft my town-exit update note?',
			answer: 'Draft town-exit update note: 1. Source-backed facts from saved document summaries: current AT mile and field pack status, food and water carry, local AI model, cloud sync, offline maps/docs, weather, and closures. 2. Placeholders: private reservation numbers, shuttle details, lodging details, and medication details. 3. Open questions before walking out: water, shelter, town, terrain, bailout, and whether cached details are stale. Review this draft before saving; Scout should not save or overwrite a document unless you explicitly confirm it, and any saved update should be versioned so the previous document can be restored.',
			improvementTags: ['document-writing']
		})
	]));

	assert.ok(checkIdsFor(report, 'DLA-020').includes('document-writing-draft-missing'));
	assert.ok(checkIdsFor(report, 'DLA-090').includes('document-writing-draft-missing'));
	assert.deepEqual(checkIdsFor(report, 'DLA-DOC-GOOD'), []);
});

test('flags document-writing drafts that blur source-backed facts and assumptions', () => {
	const report = scanScoutLocalAiAnswerQuality(runWith([
		result({
			caseId: 'DLA-DOC-BOUNDARY-BAD',
			prompt: 'What documents and information should I keep saved offline before day one, and can you draft my offline checklist note?',
			answer: 'Draft offline document checklist note: 1. Photo ID saved offline. 2. Insurance card saved offline. 3. Emergency contacts saved and shared. 4. Medication summary saved. 5. Permits and reservations saved. Review this draft before saving; Scout should not save or overwrite a document unless you explicitly confirm it, and any saved update should be versioned so the previous document can be restored.',
			improvementTags: ['document-writing']
		}),
		result({
			caseId: 'DLA-DOC-BOUNDARY-GOOD',
			prompt: 'What documents and information should I keep saved offline before day one, and can you draft my offline checklist note?',
			answer: 'Draft offline document checklist note: 1. Source-backed facts from saved offline docs: photo ID category, insurance card category, emergency contact category, itinerary, and permit or reservation summaries. 2. Placeholders: private ID numbers, insurance details, medication details, reservation numbers, and exact current-mile specifics. 3. Open questions to verify later: current mile, permits, reservations, shuttles, lodging, weather, closures, water, and town services. Review this draft before saving; Scout should not save or overwrite a document unless you explicitly confirm it, and any saved update should be versioned so the previous document can be restored.',
			improvementTags: ['document-writing']
		})
	]));

	assert.deepEqual(checkIdsFor(report, 'DLA-DOC-BOUNDARY-BAD'), ['document-writing-source-boundary-missing']);
	assert.deepEqual(checkIdsFor(report, 'DLA-DOC-BOUNDARY-GOOD'), []);
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

function result({ caseId, prompt, answer, toolInvocations = [], error = null, improvementTags = [], requiredTools = [] }) {
	return {
		caseId,
		case: {
			id: caseId,
			domain: 'test',
			phase: 'test',
			prompt,
			improvementTags,
			requiredTools
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
