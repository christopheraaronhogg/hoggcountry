import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const safetySource = readFileSync(
	new URL('./components/SafetyTab.svelte', import.meta.url),
	'utf8'
);
const trailStateSource = readFileSync(new URL('./trailState.svelte.ts', import.meta.url), 'utf8');

test('Safety exposes a separate, explicit emergency-location share action', () => {
	assert.match(safetySource, /Prepare emergency share/);
	assert.match(safetySource, /buildEmergencyShareText/);
	assert.match(safetySource, /getEmergencyShareFix/);
	assert.match(safetySource, /cannot confirm anything was sent/i);
	assert.match(safetySource, /navigator\.share/);
	assert.match(safetySource, /clipboard\.writeText/);
	assert.doesNotMatch(safetySource, /navigator\.geolocation/);
});

test('explicit sharing reaches the dedicated one-shot position service through the store', () => {
	assert.match(
		trailStateSource,
		/getEmergencyShareFix[\s\S]*this\.#position\.getPositionForExplicitShare\(\)/
	);
});
