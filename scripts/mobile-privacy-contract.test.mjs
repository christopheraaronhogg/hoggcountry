import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

test('Trail Pulse reports never persist raw GPS coordinates in mobile state', () => {
	const types = read('mobile/src/lib/types.ts');
	const state = read('mobile/src/lib/trailState.svelte.ts');

	assert.doesNotMatch(types, /\brawLatitude\b|\brawLongitude\b/u);
	assert.doesNotMatch(state, /\brawLatitude\b|\brawLongitude\b/u);
});

test('Trail Pulse outbound reducer payload sends snapped mile, not raw coordinates', () => {
	const publisher = read('mobile/src/lib/trailPulseSpacetime.ts');

	assert.match(publisher, /\bsnappedMile:\s*report\.snappedMile\b/u);
	assert.doesNotMatch(publisher, /\brawLatitude\b|\brawLongitude\b|\blatitude\b|\blongitude\b/u);
});

test('iOS privacy manifest declares coarse location only, not precise location', () => {
	const manifest = read('mobile/ios/App/App/PrivacyInfo.xcprivacy');

	assert.match(manifest, /NSPrivacyCollectedDataTypeCoarseLocation/u);
	assert.doesNotMatch(manifest, /NSPrivacyCollectedDataTypePreciseLocation/u);
});

test('Android requests foreground location for GPS snapping, not background tracking', () => {
	const manifest = read('mobile/android/app/src/main/AndroidManifest.xml');

	assert.match(manifest, /android\.permission\.ACCESS_COARSE_LOCATION/u);
	assert.match(manifest, /android\.permission\.ACCESS_FINE_LOCATION/u);
	assert.doesNotMatch(manifest, /android\.permission\.ACCESS_BACKGROUND_LOCATION/u);
});
