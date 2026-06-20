import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

const releaseCriticalStyleFiles = [
	'mobile/src/app.css',
	'mobile/src/lib/components/AppHeader.svelte',
	'mobile/src/lib/components/TabNavigation.svelte',
	'mobile/src/lib/components/TodayTab.svelte',
	'mobile/src/lib/components/TrailPulsePanel.svelte',
	'mobile/src/lib/components/SafetyTab.svelte',
	'mobile/src/lib/components/HikeSetupSheet.svelte',
	'mobile/src/lib/components/OfflineStatus.svelte',
	'mobile/src/lib/components/PackStatus.svelte',
	'mobile/src/lib/components/SourceChip.svelte',
	'mobile/src/lib/components/ConfidenceBadge.svelte'
];

test('mobile release-critical surfaces keep a readable text floor', () => {
	const appCss = read('mobile/src/app.css');

	assert.match(appCss, /--text-floor:\s*0\.8125rem/u);

	for (const file of releaseCriticalStyleFiles) {
		const source = read(file);
		const smallFontSizes = [...source.matchAll(/font-size:\s*(0\.\d+)rem/gu)]
			.map((match) => Number(match[1]))
			.filter((size) => size < 0.8125);

		assert.deepEqual(smallFontSizes, [], `${file} contains font-size values below 13px`);
	}
});

test('mobile release-critical surfaces avoid compressed display tracking', () => {
	for (const file of releaseCriticalStyleFiles) {
		const source = read(file);

		assert.doesNotMatch(source, /letter-spacing:\s*-\d/u, `${file} contains negative letter-spacing`);
	}
});

test('mobile header and setup controls preserve field-sized touch targets', () => {
	const header = read('mobile/src/lib/components/AppHeader.svelte');
	const setup = read('mobile/src/lib/components/HikeSetupSheet.svelte');
	const safety = read('mobile/src/lib/components/SafetyTab.svelte');
	const nav = read('mobile/src/lib/components/TabNavigation.svelte');

	assert.match(header, /\.status-strip\s*\{[\s\S]*?min-height:\s*44px;/u);
	assert.match(header, /\.gear\s*\{[\s\S]*?width:\s*44px;[\s\S]*?height:\s*44px;/u);
	assert.match(setup, /\.close\s*\{[\s\S]*?width:\s*44px;[\s\S]*?height:\s*44px;/u);
	assert.match(safety, /\.remove-btn\s*\{[\s\S]*?width:\s*44px;[\s\S]*?height:\s*44px;/u);
	assert.match(nav, /\.nav\s*\{[\s\S]*?height:\s*var\(--nav-height\);/u);
});
