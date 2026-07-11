import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const safetySource = readFileSync(
	new URL('./components/SafetyTab.svelte', import.meta.url),
	'utf8'
);
const trailStateSource = readFileSync(new URL('./trailState.svelte.ts', import.meta.url), 'utf8');

test('Safety exposes a separate, explicit emergency-location draft action', () => {
	assert.match(safetySource, /Share emergency location/);
	assert.match(safetySource, /buildEmergencyShareSms/);
	assert.match(safetySource, /getCoordinatesForExplicitShare/);
	assert.match(safetySource, /does not send automatically/i);
	assert.doesNotMatch(safetySource, /navigator\.geolocation/);
});

test('explicit sharing reaches the existing privacy-gated one-shot position service through the store', () => {
	assert.match(
		trailStateSource,
		/getCoordinatesForExplicitShare[\s\S]*this\.#position\.getCurrentPosition\(\)/
	);
});
