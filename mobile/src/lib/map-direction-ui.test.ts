import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

import {
	directedMileDelta,
	trailAhead,
	trailProgress
} from '@hoggcountry/trail-data/trail-direction';

const mapSource = readFileSync(new URL('./components/MapTab.svelte', import.meta.url), 'utf8');

test('SOBO map semantics compose the shared direction contract', () => {
	const water = [
		{ name: 'behind', mile: 181, reliability: 'reliable' },
		{ name: 'next', mile: 179, reliability: 'seasonal' }
	];

	assert.equal(trailAhead(water, 180, 'SOBO')[0]?.name, 'next');
	assert.equal(directedMileDelta(180, 179, 'SOBO'), 1);
	assert.equal(directedMileDelta(180, 181, 'SOBO'), -1);
	assert.deepEqual(trailProgress(180, 200, 'SOBO'), {
		completedMiles: 20,
		remainingMiles: 180,
		percent: 10
	});
});

test('MapTab wires navigation, measurement, progress, route shading, and head-up to hike direction', () => {
	assert.match(mapSource, /from '@hoggcountry\/trail-data\/trail-direction'/);
	assert.match(mapSource, /const direction = \$derived\(trailAssistant\.hikeProfile\.direction\)/);
	assert.match(mapSource, /trailAhead\(trailAssistant\.fieldPack\.water, from, direction\)\[0\]/);
	assert.match(mapSource, /directedMileDelta\(from, mile, direction\)/);
	assert.match(mapSource, /directedMileDelta\(fromClamped, target, direction\)/);
	assert.match(mapSource, /trailProgress\(from, TOTAL_MILES, direction\)\.percent/);
	assert.match(mapSource, /const doneIsUpper = direction === 'SOBO'/);
	assert.match(mapSource, /bearingAtMile\(fromClamped, direction\)/);
	assert.match(mapSource, /direction === 'SOBO' \? mile \+ 0\.5 : mile - 0\.5/);
	assert.match(mapSource, /direction === 'SOBO' \? mile - 0\.5 : mile \+ 0\.5/);
});
