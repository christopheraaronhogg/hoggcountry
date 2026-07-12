import assert from 'node:assert/strict';
import { test } from 'node:test';

import { cloneDefaultContextPack } from './default-pack.ts';
import {
	buildSavedTrailFacts,
	SAVED_TRAIL_FACTS_MAX_MILES,
	shouldShowSavedTrailFacts
} from './saved-trail-facts.ts';
import type { ContextPackStatus } from './types.ts';

function status(
	state: ContextPackStatus['state'] = 'saved',
	label = 'Saved field pack'
): ContextPackStatus {
	return {
		state,
		label,
		detail: 'Test pack.',
		lastLoadedAt: '2026-07-11T12:00:00.000Z',
		validUntil: '2026-07-11T18:00:00.000Z',
		source: 'saved'
	};
}

function persistence(verified = true) {
	return {
		state: verified ? ('persisted' as const) : ('loaded-only' as const),
		verified,
		error: verified ? null : 'Field pack storage verification failed.'
	};
}

test('builds strict NOBO saved facts in encounter order without mutating the pack', () => {
	const pack = cloneDefaultContextPack();
	pack.water = [
		{ name: 'Behind spring', mile: 98, reliability: 'reliable' },
		{ name: 'Seasonal creek', mile: 103, reliability: 'seasonal' },
		{ name: 'Bull Spring', mile: 108, reliability: 'reliable' },
		{ name: 'Far water', mile: 221, reliability: 'reliable' }
	];
	pack.shelters = [
		{ name: 'Behind shelter', mile: 99 },
		{ name: 'Pine Shelter', mile: 105 }
	];
	pack.towns = [
		{ name: 'Behind town', mile: 97, access: 'road' },
		{ name: 'Trail Town', mile: 115, access: 'Blue-blaze road crossing' }
	];
	const before = JSON.stringify(pack);

	const facts = buildSavedTrailFacts({
		pack,
		currentMile: 100,
		direction: 'NOBO',
		status: status(),
		persistence: persistence()
	});

	assert.ok(facts);
	assert.equal(facts.currentMile, 100);
	assert.equal(facts.direction, 'NOBO');
	assert.equal(facts.maxMiles, SAVED_TRAIL_FACTS_MAX_MILES);
	assert.equal(facts.nextWater?.name, 'Seasonal creek');
	assert.equal(facts.nextWater?.milesAhead, 3);
	assert.equal(facts.nextReliableWater?.name, 'Bull Spring');
	assert.equal(facts.nextReliableWater?.milesAhead, 8);
	assert.equal(facts.nextShelter?.name, 'Pine Shelter');
	assert.equal(facts.nextTown?.name, 'Trail Town');
	assert.equal(facts.nextTown?.access, 'Blue-blaze road crossing');
	assert.equal(facts.cachedOnly, false);
	assert.match(facts.notice, /conditions can change/i);
	assert.equal(JSON.stringify(pack), before);
});

test('SOBO facts reject higher-mile records and never expose negative zero', () => {
	const pack = cloneDefaultContextPack();
	pack.water = [
		{ name: 'Behind water', mile: 202, reliability: 'reliable' },
		{ name: 'Water here', mile: 200.005, reliability: 'thin' },
		{ name: 'South spring', mile: 194, reliability: 'reliable' }
	];
	pack.shelters = [{ name: 'South Shelter', mile: 190 }];
	pack.towns = [{ name: 'South Town', mile: 180, access: 'road candidate' }];

	const facts = buildSavedTrailFacts({
		pack,
		currentMile: 200,
		direction: 'SOBO',
		status: status(),
		persistence: persistence()
	});

	assert.ok(facts);
	assert.equal(facts.nextWater?.name, 'Water here');
	assert.equal(Object.is(facts.nextWater?.milesAhead, -0), false);
	assert.equal(facts.nextWater?.milesAhead, 0);
	assert.equal(facts.nextReliableWater?.name, 'South spring');
	assert.equal(facts.nextShelter?.milesAhead, 10);
	assert.equal(facts.nextTown?.milesAhead, 20);
});

test('the 120-mile cap is inclusive and blank or invalid records are ignored', () => {
	const pack = cloneDefaultContextPack();
	pack.water = [
		{ name: ' ', mile: 101, reliability: 'reliable' },
		{ name: 'Invalid mile', mile: Number.NaN, reliability: 'reliable' },
		{ name: 'Boundary spring', mile: 220, reliability: 'reliable' },
		{ name: 'Beyond spring', mile: 220.02, reliability: 'reliable' }
	];
	pack.shelters = [{ name: 'Too far shelter', mile: 220.02 }];
	pack.towns = [{ name: 'Blank access town', mile: 110, access: '   ' }];

	const facts = buildSavedTrailFacts({
		pack,
		currentMile: 100,
		direction: 'NOBO',
		status: status(),
		persistence: persistence()
	});

	assert.ok(facts);
	assert.equal(facts.nextWater?.name, 'Boundary spring');
	assert.equal(facts.nextWater?.milesAhead, 120);
	assert.equal(facts.nextShelter, null);
	assert.equal(facts.nextTown?.access, null);
});

test('an empty sanitized slice says facts are not loaded instead of implying absence', () => {
	const pack = cloneDefaultContextPack();
	pack.water = [];
	pack.shelters = [];
	pack.towns = [];

	const facts = buildSavedTrailFacts({
		pack,
		currentMile: 765.4,
		direction: 'NOBO',
		status: status('stale', 'Pack freshness unknown'),
		persistence: persistence()
	});

	assert.ok(facts);
	assert.equal(facts.nextWater, null);
	assert.equal(facts.nextReliableWater, null);
	assert.equal(facts.nextShelter, null);
	assert.equal(facts.nextTown, null);
	assert.equal(facts.hasLandmarks, false);
	assert.equal(facts.cachedOnly, true);
	assert.match(facts.notice, /cached planning facts only/i);
	assert.match(facts.notice, /does not prove current conditions/i);
});

test('invalid live position fails closed instead of selecting from a stale pack center', () => {
	const pack = cloneDefaultContextPack();
	pack.water = [{ name: 'Pack water', mile: 1, reliability: 'reliable' }];

	assert.equal(
		buildSavedTrailFacts({
			pack,
			currentMile: Number.NaN,
			direction: 'NOBO',
			status: status(),
			persistence: persistence()
		}),
		null
	);
});

test('malformed nested cached entries are ignored instead of crashing Scout', () => {
	const pack = cloneDefaultContextPack();
	pack.water = [
		null,
		{ name: 17, mile: 101, reliability: 'reliable' },
		{ name: 'Valid spring', mile: 102, reliability: 'reliable', note: { bad: true } }
	] as unknown as typeof pack.water;
	pack.shelters = [null, { name: 'Valid Shelter', mile: 103 }] as unknown as typeof pack.shelters;
	pack.towns = [
		42,
		{ name: 'Valid Town', mile: 104, access: { bad: true } }
	] as unknown as typeof pack.towns;

	const facts = buildSavedTrailFacts({
		pack,
		currentMile: 100,
		direction: 'NOBO',
		status: status(),
		persistence: persistence()
	});

	assert.equal(facts?.nextWater?.name, 'Valid spring');
	assert.equal(facts?.nextWater?.note, null);
	assert.equal(facts?.nextShelter?.name, 'Valid Shelter');
	assert.equal(facts?.nextTown?.name, 'Valid Town');
	assert.equal(facts?.nextTown?.access, null);
});

test('a session-only pack never claims its in-memory facts are saved offline', () => {
	const pack = cloneDefaultContextPack();
	const sessionStatus = status('error', 'Field pack loaded for this session');
	const facts = buildSavedTrailFacts({
		pack,
		currentMile: 100,
		direction: 'NOBO',
		status: sessionStatus,
		persistence: persistence(false)
	});

	assert.equal(facts?.heading, 'Loaded trail facts');
	assert.equal(facts?.storage, 'session');
	assert.match(facts?.notice ?? '', /loaded for this session/i);
	assert.match(facts?.notice ?? '', /storage verification failed/i);
});

test('saved facts appear only while native Gemma cannot answer or is under test', () => {
	for (const stage of ['needs_model', 'initializing', 'testing', 'failed'] as const) {
		assert.equal(shouldShowSavedTrailFacts(stage), true, stage);
	}
	for (const stage of [
		'unsupported',
		'file_verified',
		'runtime_ready',
		'offline_ready'
	] as const) {
		assert.equal(shouldShowSavedTrailFacts(stage), false, stage);
	}
});
