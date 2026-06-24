import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

test('Trail Pulse report UI is reachable from the active Today surface', () => {
	const today = read('mobile/src/lib/components/TodayTab.svelte');

	assert.match(today, /import TrailPulsePanel from '\.\/TrailPulsePanel\.svelte';/u);
	assert.match(today, /<TrailPulsePanel\s*\/>/u);
});

test('Trail Pulse report action is reachable from the active Map surface', () => {
	const map = read('mobile/src/lib/components/MapTab.svelte');

	assert.match(map, /import TrailPulseReportAction from '\.\/TrailPulseReportAction\.svelte';/u);
	assert.match(map, /<TrailPulseReportAction variant="fab" \/>/u);
});

test('Trail Pulse report sheet states the shared data and raw-coordinate boundary', () => {
	const action = read('mobile/src/lib/components/TrailPulseReportAction.svelte');

	assert.match(action, /Public condition report/u);
	assert.match(action, /approximate trail mile/u);
	assert.match(action, /Raw coordinates are not stored or sent/u);
	assert.doesNotMatch(action, /raw GPS leaves|exact GPS|precise GPS/u);
});

test('Trail Pulse offline state is labeled as a local queue, not a live publish', () => {
	const action = read('mobile/src/lib/components/TrailPulseReportAction.svelte');

	assert.match(action, /Save offline/u);
	assert.match(action, /queued on this phone until service returns/u);
});

test('Trail Pulse reports submitted by this phone are not re-alerted as nearby reports', () => {
	const state = read('mobile/src/lib/trailState.svelte.ts');

	assert.match(state, /this\.#state\.trailPulseReports = \[report, \.\.\.this\.#state\.trailPulseReports\];/u);
	assert.match(state, /this\.markTrailPulseAlertSeen\(report\.id\);/u);
});
