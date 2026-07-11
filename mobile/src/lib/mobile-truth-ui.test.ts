import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

function componentSource(name: string): string {
	return readFileSync(new URL(`./components/${name}.svelte`, import.meta.url), 'utf8');
}

test('Today presents the first mapped shelter as the next shelter, not a chosen camp', () => {
	const source = componentSource('TodayTab');
	assert.match(source, /Next shelter/);
	assert.doesNotMatch(source, /the day's planned end|Camp ·|now → camp|const camp\b/);
});

test('safe check-ins use explicit truth copy and keep circle texting separate', () => {
	for (const name of ['TodayTab', 'SafetyTab']) {
		const source = componentSource(name);
		assert.match(source, /SAFE_CHECK_IN_DISCLOSURE/, `${name} should show the disclosure`);
		assert.match(source, /SAFE_CHECK_IN_RECORDED/, `${name} should confirm the actual outcome`);
		assert.match(source, /Text my circle/, `${name} should expose a separate text action`);
	}

	const safety = componentSource('SafetyTab');
	assert.match(safety, /Family receives nothing unless/);
	assert.doesNotMatch(safety, /later upload actually sends/);
});

test('scoped freshness labels depend on the shared minute clock', () => {
	for (const name of ['TodayTab', 'SafetyTab', 'OfflineStatus', 'TrailPulsePanel']) {
		const source = componentSource(name);
		assert.match(source, /minuteClock/, `${name} should subscribe to the minute clock`);
		assert.match(source, /formatAge|formatTimeUntil/, `${name} should use a shared formatter`);
	}
});
