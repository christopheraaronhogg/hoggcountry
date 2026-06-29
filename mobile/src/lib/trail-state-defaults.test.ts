import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
	SCOUT_STARTER_MESSAGE,
	STARTER_CHECK_IN_NOTE,
	STARTER_OFFLINE_REGION,
	createDefaultTrailState,
	resetToUncalibratedStarterState
} from './trail-state-defaults.ts';

function ids(values: string[]): () => string {
	let index = 0;
	return () => values[index++] ?? `id-${index}`;
}

test('createDefaultTrailState starts as a neutral uncalibrated hiker, not Dad pilot data', () => {
	const now = new Date('2026-06-20T12:00:00.000Z');
	const state = createDefaultTrailState({ now, id: ids(['msg-1', 'check-1']) });

	assert.equal(state.currentMile, 0);
	assert.equal(state.dayNumber, 1);
	assert.equal(state.hikeProfile.calibrated, false);
	assert.equal(state.hikeProfile.currentMile, 0);
	assert.equal(state.hikeProfile.trailName, undefined);
	assert.equal(state.trailSettings.offlineRegion, STARTER_OFFLINE_REGION);
	assert.equal(state.lastCheckIn.location, 'Mile 0.0');
	assert.equal(state.lastCheckIn.mile, 0);
	assert.equal(state.lastCheckIn.note, STARTER_CHECK_IN_NOTE);
	assert.equal(state.lastCheckIn.timestamp, '2026-06-20T10:00:00.000Z');
	assert.equal(state.nextCheckInDueAt, '2026-06-20T16:00:00.000Z');
	assert.equal(state.lastSyncAt, '2026-06-20T11:48:00.000Z');
	assert.deepEqual(state.checkInHistory, []);
	assert.deepEqual(state.documents, []);
	assert.deepEqual(state.supportCircle, []);
	assert.equal(state.coachMessages[0]?.content, SCOUT_STARTER_MESSAGE);
});

test('createDefaultTrailState returns fresh mutable containers each time', () => {
	const first = createDefaultTrailState({ id: ids(['a', 'b']) });
	const second = createDefaultTrailState({ id: ids(['c', 'd']) });

	first.documents.push({
		id: 'doc',
		title: 'Note',
		body: 'Body',
		source: 'manual',
		createdAt: '2026-06-20T12:00:00.000Z',
		updatedAt: '2026-06-20T12:00:00.000Z',
		revision: 1,
		revisions: []
	});

	assert.equal(second.documents.length, 0);
	assert.notEqual(first.hikeProfile, second.hikeProfile);
	assert.notEqual(first.privacySettings, second.privacySettings);
	assert.notEqual(first.trailSettings, second.trailSettings);
});

test('resetToUncalibratedStarterState only resets starter-owned position fields', () => {
	const now = new Date('2026-06-20T12:00:00.000Z');
	const state = createDefaultTrailState({ now, id: ids(['msg', 'check']) });
	state.hikeProfile = {
		calibrated: true,
		mode: 'self',
		trailName: 'Spruce',
		direction: 'NOBO',
		startDate: '2026-02-01',
		currentMile: 700,
		mileSource: 'gps',
		updatedAt: '2026-06-20T12:00:00.000Z'
	};
	state.currentMile = 700;
	state.dayNumber = 140;
	state.checkInHistory = [state.lastCheckIn];
	state.documents = [
		{
			id: 'doc',
			title: 'My plan',
			body: 'Keep this.',
			source: 'manual',
			createdAt: '2026-06-20T12:00:00.000Z',
			updatedAt: '2026-06-20T12:00:00.000Z',
			revision: 1,
			revisions: []
		}
	];
	state.supportCircle = [{ name: 'Home', role: 'Contact', method: 'Text', phone: '555-0100' }];

	const reset = resetToUncalibratedStarterState(state, {
		now,
		id: ids(['reset-check'])
	});

	assert.equal(reset.hikeProfile.calibrated, false);
	assert.equal(reset.hikeProfile.currentMile, 0);
	assert.equal(reset.currentMile, 0);
	assert.equal(reset.dayNumber, 1);
	assert.equal(reset.trailSettings.offlineRegion, STARTER_OFFLINE_REGION);
	assert.equal(reset.lastCheckIn.id, 'reset-check');
	assert.equal(reset.lastCheckIn.note, STARTER_CHECK_IN_NOTE);
	assert.equal(reset.lastCheckIn.timestamp, '2026-06-20T12:00:00.000Z');
	assert.deepEqual(reset.checkInHistory, []);
	assert.equal(reset.documents.length, 1);
	assert.equal(reset.supportCircle.length, 1);
});
