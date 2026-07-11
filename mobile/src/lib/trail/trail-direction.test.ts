import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
	directedMileDelta,
	directedTrailWindow,
	trailAhead,
	trailProgress
} from '../../../../packages/trail-data/src/trail-direction.ts';

test('directed mile deltas use the hiker travel direction', () => {
	assert.equal(directedMileDelta(100, 102, 'NOBO'), 2);
	assert.equal(directedMileDelta(100, 98, 'SOBO'), 2);
	assert.equal(directedMileDelta(100, 98, 'NOBO'), -2);
	assert.equal(directedMileDelta(100, 102, 'SOBO'), -2);
});

test('trailAhead returns only the next items in encounter order without mutating input', () => {
	const items = [
		{ name: 'north', mile: 101 },
		{ name: 'far south', mile: 95 },
		{ name: 'near south', mile: 99 },
		{ name: 'bad', mile: Number.NaN },
		{ name: 'here', mile: 100.005 }
	];
	const original = items.map((item) => item.name);

	assert.deepEqual(
		trailAhead(items, 100, 'SOBO').map((item) => item.name),
		['here', 'near south', 'far south']
	);
	assert.deepEqual(
		trailAhead(items, 100, 'NOBO').map((item) => item.name),
		['here', 'north']
	);
	assert.deepEqual(
		trailAhead(items, 100, 'SOBO', 2).map((item) => item.name),
		['here', 'near south']
	);
	assert.deepEqual(items.map((item) => item.name), original);
});

test('trailAhead rejects unusable spans and preserves an exact-current item', () => {
	const items = [{ mile: 100 }, { mile: 99 }];
	assert.deepEqual(trailAhead(items, 100, 'SOBO', 0), [{ mile: 100 }]);
	assert.deepEqual(trailAhead(items, 100, 'SOBO', -1), []);
	assert.deepEqual(trailAhead(items, 100, 'SOBO', Number.NaN), []);
});

test('trail progress is direction-aware and clamped at trail endpoints', () => {
	assert.deepEqual(trailProgress(50, 200, 'NOBO'), {
		completedMiles: 50,
		remainingMiles: 150,
		percent: 25
	});
	assert.deepEqual(trailProgress(180, 200, 'SOBO'), {
		completedMiles: 20,
		remainingMiles: 180,
		percent: 10
	});
	assert.deepEqual(trailProgress(250, 200, 'SOBO'), {
		completedMiles: 0,
		remainingMiles: 200,
		percent: 0
	});
});

test('directed windows retain travel order and normalized physical bounds', () => {
	assert.deepEqual(directedTrailWindow(100, 15, 200, 'NOBO'), {
		fromMile: 100,
		toMile: 115,
		minMile: 100,
		maxMile: 115,
		spanMiles: 15
	});
	assert.deepEqual(directedTrailWindow(10, 15, 200, 'SOBO'), {
		fromMile: 10,
		toMile: 0,
		minMile: 0,
		maxMile: 10,
		spanMiles: 10
	});
});
