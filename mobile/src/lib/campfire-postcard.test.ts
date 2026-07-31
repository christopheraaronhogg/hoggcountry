import assert from 'node:assert/strict';
import test from 'node:test';

import {
	CAMPFIRE_NOTE_MAX_CHARS,
	buildCampfirePostcard,
	normalizeCampfireNote,
	shareCampfirePostcard
} from './campfire-postcard.ts';

test('buildCampfirePostcard renders deliberate trail facts, stale-weather context, and personal copy', () => {
	const postcard = buildCampfirePostcard({
		dayNumber: 143,
		currentMile: 1784.12,
		direction: 'NOBO',
		dateLabel: 'July 30, 2026',
		mood: 'tired',
		note: '  Long rocks today.\r\n\r\nGrateful for a dry camp.  ',
		trailName: '  Hogg   Country  ',
		weather: {
			mile: 1784.1,
			summary: 'NWS Overnight: Cool with clearing skies',
			highF: 68,
			lowF: 44,
			windMph: 8,
			generatedAt: '2026-07-30T12:00:00.000Z',
			source: 'nws'
		}
	});

	assert.equal(postcard.title, 'Campfire Postcard · July 30, 2026');
	assert.equal(postcard.trailLine, 'Day 143 · Mile 1,784.1');
	assert.equal(postcard.directionLabel, 'Northbound');
	assert.equal(postcard.summary, 'Day 143 · Mile 1,784.1 · Northbound');
	assert.equal(postcard.note, 'Long rocks today.\n\nGrateful for a dry camp.');
	assert.match(
		postcard.weatherLine ?? '',
		/^Saved forecast for around mile 1,784.1 from Jul 30 · check before relying on it: 68° \/ 44° · Overnight:/
	);
	assert.equal(postcard.signature, '— Hogg Country');
	assert.match(postcard.shareText, /Worn out and ready for camp\./);
	assert.match(postcard.shareText, /Worn out and ready for camp\.\nLong rocks/u);
	assert.match(postcard.shareText, /approximate trail mile, not live GPS tracking\./);
});

test('buildCampfirePostcard omits weather and uses the private fallback signature', () => {
	const postcard = buildCampfirePostcard({
		dayNumber: 0,
		currentMile: Number.NaN,
		direction: 'SOBO',
		dateLabel: 'July 30, 2026',
		mood: 'grateful',
		note: '',
		weather: null
	});

	assert.equal(postcard.summary, 'Day 1 · Mile 0.0 · Southbound');
	assert.equal(postcard.weatherLine, null);
	assert.equal(postcard.signature, '— From the trail');
	assert.doesNotMatch(postcard.shareText, /forecast/iu);
});

test('normalizeCampfireNote keeps paragraphs while bounding share payloads', () => {
	const note = normalizeCampfireNote(
		`  first   thought\n\n\n\n${'x'.repeat(CAMPFIRE_NOTE_MAX_CHARS + 100)}  `
	);

	assert.match(note, /^first thought\n\n/);
	assert.equal(note.length, CAMPFIRE_NOTE_MAX_CHARS);
});

test('shareCampfirePostcard treats the share sheet as closed without claiming delivery', async () => {
	const calls: unknown[] = [];
	const outcome = await shareCampfirePostcard(
		{
			share: async (payload) => {
				calls.push(payload);
			}
		},
		{ title: 'Tonight', shareText: 'Trail note' }
	);

	assert.equal(outcome, 'share-sheet-closed');
	assert.deepEqual(calls, [{ title: 'Tonight', text: 'Trail note' }]);
});

test('shareCampfirePostcard keeps cancellation neutral and falls back to clipboard after other failures', async () => {
	const cancelled = await shareCampfirePostcard(
		{ share: () => Promise.reject({ name: 'AbortError' }) },
		{ title: 'Tonight', shareText: 'Trail note' }
	);
	assert.equal(cancelled, 'cancelled');

	let copied = '';
	const recovered = await shareCampfirePostcard(
		{
			share: () => Promise.reject(new Error('share unavailable')),
			clipboard: {
				writeText: async (text) => {
					copied = text;
				}
			}
		},
		{ title: 'Tonight', shareText: 'Trail note' }
	);
	assert.equal(recovered, 'copied');
	assert.equal(copied, 'Trail note');
});

test('shareCampfirePostcard reports unavailable and failed fallbacks honestly', async () => {
	assert.equal(
		await shareCampfirePostcard({}, { title: 'Tonight', shareText: 'Trail note' }),
		'unavailable'
	);
	assert.equal(
		await shareCampfirePostcard(
			{ clipboard: { writeText: () => Promise.reject(new Error('denied')) } },
			{ title: 'Tonight', shareText: 'Trail note' }
		),
		'failed'
	);
});
