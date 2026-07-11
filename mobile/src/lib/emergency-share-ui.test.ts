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
	assert.match(safetySource, /Share prepared details/);
	assert.match(safetySource, /Copy prepared details/);
	assert.match(safetySource, /Refresh GPS & draft/);
	assert.match(safetySource, /buildEmergencyShareText/);
	assert.match(safetySource, /getEmergencyShareFix/);
	assert.match(safetySource, /cannot confirm anything was sent/i);
	assert.match(safetySource, /handoffText/);
	assert.match(safetySource, /copyHandoffText/);
	assert.doesNotMatch(safetySource, /window\.location\.href\s*=\s*request\.href/u);
	assert.doesNotMatch(safetySource, /navigator\.geolocation/);
});

test('GPS preparation and the user-activated share handoff are separate steps', () => {
	const prepare = safetySource.match(
		/async function prepareEmergencyLocation\(\)[\s\S]*?\n\tasync function sharePreparedEmergency/u
	)?.[0];
	const share = safetySource.match(
		/async function sharePreparedEmergency\(\)[\s\S]*?\n\tasync function copyPreparedEmergency/u
	)?.[0];

	assert.ok(prepare, 'expected an emergency preparation function');
	assert.match(prepare, /getEmergencyShareFix/);
	assert.match(prepare, /emergencyPreparedText = share\.text/);
	assert.doesNotMatch(prepare, /handoffText/);
	assert.ok(share, 'expected a separate prepared-details share function');
	assert.match(share, /handoffText/);
	assert.doesNotMatch(share, /getEmergencyShareFix/);
});

test('Safety guards share actions against duplicate taps', () => {
	assert.match(safetySource, /if \(helpShareBusy\) return/);
	assert.match(safetySource, /if \(safeShareBusy\) return/);
	assert.match(safetySource, /if \(emergencyPrepareBusy \|\| emergencyHandoffAction\) return/);
	assert.match(safetySource, /if \(!emergencyCheckInLogged\)/);
	assert.match(safetySource, /if \(!fix && emergencyPreparedText\)/);
	assert.match(safetySource, /disabled=\{helpShareBusy\}/);
});

test('explicit sharing reaches the dedicated one-shot position service through the store', () => {
	assert.match(
		trailStateSource,
		/getEmergencyShareFix[\s\S]*this\.#position\.getPositionForExplicitShare\(\)/
	);
});
