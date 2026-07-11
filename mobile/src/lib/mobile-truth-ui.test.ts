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

test('safe check-ins use explicit truth copy and keep portable sharing separate', () => {
	for (const name of ['TodayTab', 'SafetyTab']) {
		const source = componentSource(name);
		assert.match(source, /SAFE_CHECK_IN_DISCLOSURE/, `${name} should show the disclosure`);
		assert.match(source, /SAFE_CHECK_IN_RECORDED/, `${name} should confirm the actual outcome`);
		assert.match(source, /Share safe update/, `${name} should expose a separate share action`);
		assert.match(source, /handoffText/, `${name} should use the portable handoff`);
		assert.match(source, /if \(safeShareBusy\) return/, `${name} should guard duplicate safe shares`);
		assert.match(source, /if \(helpShareBusy\) return/, `${name} should guard duplicate help logs`);
		assert.match(source, /let text = helpPreparedText/, `${name} should reuse an existing help draft`);
		assert.match(source, /if \(!text\)[\s\S]*requestHelp/, `${name} should log only the first help attempt`);
		assert.match(source, /helpPreparedText = text/, `${name} should retain help text for recovery`);
		assert.match(source, /Share help details again/, `${name} should label retries as shares, not new logs`);
		assert.match(source, /function startNewHelpRequest\(\)/, `${name} should allow a deliberate new incident`);
		assert.match(source, /helpPreparedText = ''[\s\S]*needHelp\(\)/, `${name} should rebuild a new incident`);
		assert.match(source, /PreparedHelpDraft/, `${name} should expose explicit copy recovery`);
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

test('every visible trail preference has an observable app effect', () => {
	const account = componentSource('AccountTab');
	const today = componentSource('TodayTab');

	assert.match(account, /Controls that change the app/);
	assert.match(account, /Show water ahead/);
	assert.match(today, /trailSettings\.waterAlerts/);
	assert.doesNotMatch(account, /<strong>Battery saver<\/strong>/);
	assert.doesNotMatch(account, /<strong>Low-signal mode<\/strong>/);
	assert.doesNotMatch(account, /Reduce sync behavior/);
});

test('Today puts a truthful trail-data refresh beside weather', () => {
	const source = componentSource('TodayTab');

	assert.match(source, /fieldPackStatus/);
	assert.match(source, /Refresh trail data/);
	assert.match(source, /refreshFieldPack\(\)/);
	assert.match(source, /!trailAssistant\.onlineStatus/);
	assert.match(source, /packStatus\.state === 'refreshing'/);
	assert.match(source, /packStatus\.detail/);
	assert.match(source, /role="status"/);
	assert.match(source, /Cached forecast — not live/);
});

test('direction-sensitive mobile surfaces use the shared trail-direction contract', () => {
	const today = componentSource('TodayTab');
	assert.match(today, /@hoggcountry\/trail-data\/trail-direction/);
	assert.match(today, /trailProgress\(/);
	assert.match(today, /trailAhead\(/);
	assert.match(today, /directedMileDelta\(/);
	assert.match(today, /elevationWindow\(geo, from, nextShelterDistance, direction\)/);
	assert.doesNotMatch(today, /next(?:Water|Shelter)\.mile - from/);

	const safety = componentSource('SafetyTab');
	assert.match(safety, /trailAhead\(/);
	assert.match(safety, /directedMileDelta\(/);
	assert.doesNotMatch(safety, /(?:town|shelter)\.mile - from/);

	const account = componentSource('AccountTab');
	assert.match(account, /trailProgress\(/);
	assert.match(account, /hikeProgress\.completedMiles/);
	assert.match(account, /hikeProgress\.remainingMiles/);

	const header = componentSource('AppHeader');
	assert.match(header, /trailProgress\(/);
	assert.match(header, /progress\.percent/);
});
