import assert from 'node:assert/strict';
import test from 'node:test';

import {
	CAMPFIRE_DRAFT_KEY,
	createCampfirePostcardDraft,
	isTodaysCampfireDraft,
	loadCampfirePostcardDraft,
	parseCampfirePostcardDraft,
	saveCampfirePostcardDraft
} from './campfire-postcard-draft.ts';
import type { PersistenceAdapter } from './mobile-persistence.ts';

function memoryPersistence(): PersistenceAdapter & {
	values: Map<string, string>;
} {
	const values = new Map<string, string>();
	return {
		values,
		get: (key) => Promise.resolve(values.get(key) ?? null),
		set: (key, value) => {
			values.set(key, value);
			return Promise.resolve();
		}
	};
}

test('campfire draft freezes the nightly trail snapshot and local date', () => {
	const now = new Date(2026, 6, 30, 20, 15);
	const draft = createCampfirePostcardDraft(
		{
			dayNumber: 143.9,
			currentMile: 1784.12,
			direction: 'NOBO',
			trailName: '  Hogg   Country ',
			includeWeather: true
		},
		now
	);

	assert.equal(draft.dateKey, '2026-07-30');
	assert.equal(draft.dayNumber, 143);
	assert.equal(draft.currentMile, 1784.12);
	assert.equal(draft.trailName, 'Hogg Country');
	assert.equal(isTodaysCampfireDraft(draft, now), true);
	assert.equal(isTodaysCampfireDraft(draft, new Date(2026, 6, 31, 0, 1)), false);
});

test('campfire draft persists and restores through the mobile adapter contract', async () => {
	const persistence = memoryPersistence();
	const draft = {
		...createCampfirePostcardDraft(
			{
				dayNumber: 143,
				currentMile: 1784.1,
				direction: 'NOBO',
				includeWeather: false
			},
			new Date(2026, 6, 30, 20, 15)
		),
		mood: 'tired' as const,
		note: 'A hard but good day.'
	};

	await saveCampfirePostcardDraft(persistence, draft);

	assert.ok(persistence.values.has(CAMPFIRE_DRAFT_KEY));
	assert.deepEqual(await loadCampfirePostcardDraft(persistence), draft);
});

test('parseCampfirePostcardDraft rejects malformed state and bounds restored notes', () => {
	assert.equal(parseCampfirePostcardDraft('not-json'), null);
	assert.equal(parseCampfirePostcardDraft(JSON.stringify({ version: 1 })), null);

	const draft = createCampfirePostcardDraft(
		{
			dayNumber: 143,
			currentMile: 1784.1,
			direction: 'NOBO',
			includeWeather: true
		},
		new Date(2026, 6, 30, 20, 15)
	);
	const restored = parseCampfirePostcardDraft(
		JSON.stringify({ ...draft, note: ` ${'x'.repeat(700)} ` })
	);

	assert.equal(restored?.note.length, 600);
});
