import assert from 'node:assert/strict';
import { test } from 'node:test';

import { createDefaultTrailState } from './trail-state-defaults.ts';
import {
	parsePersistedTrailState,
	restorePersistedTrailState,
	snapshotTrailState
} from './trail-state-persistence.ts';
import type { TrailState } from './types.ts';

function defaultState(): TrailState {
	return createDefaultTrailState({
		now: new Date('2026-06-21T12:00:00.000Z'),
		id: (() => {
			let index = 0;
			const ids = ['msg-default', 'check-default'];
			return () => ids[index++] ?? `id-${index}`;
		})()
	});
}

test('restorePersistedTrailState migrates old tabs onto the current IA', () => {
	const restored = restorePersistedTrailState({ activeTab: 'Safety' }, defaultState());

	assert.equal(restored.activeTab, 'Settings');
});

test('restorePersistedTrailState keeps the default tab when persisted state omits one', () => {
	const state = defaultState();
	state.activeTab = 'Map';

	const restored = restorePersistedTrailState({}, state);

	assert.equal(restored.activeTab, 'Map');
});

test('restorePersistedTrailState resets legacy uncalibrated position without deleting hiker data', () => {
	const restored = restorePersistedTrailState(
		{
			activeTab: 'Scout',
			currentMile: 1438,
			dayNumber: 140,
			hikeProfile: {},
			documents: [
				{
					id: 'doc-1',
					title: 'My water plan',
					body: 'Carry more after town.',
					source: 'manual',
					createdAt: '2026-06-21T12:00:00.000Z',
					updatedAt: '2026-06-21T12:00:00.000Z'
				}
			],
			supportCircle: [{ name: 'Home', role: 'Dad', method: 'Text', phone: '555-0100' }]
		},
		defaultState()
	);

	assert.equal(restored.activeTab, 'Scout');
	assert.equal(restored.hikeProfile.calibrated, false);
	assert.equal(restored.currentMile, 0);
	assert.equal(restored.dayNumber, 1);
	assert.equal(restored.documents.length, 1);
	assert.equal(restored.supportCircle.length, 1);
});

test('restorePersistedTrailState repairs missing document arrays from old persisted state', () => {
	const restored = restorePersistedTrailState({ documents: null }, defaultState());

	assert.deepEqual(restored.documents, []);
});

test('parsePersistedTrailState restores JSON snapshots', () => {
	const restored = parsePersistedTrailState(JSON.stringify({ activeTab: 'Gear', documents: [] }));

	assert.equal(restored.activeTab, 'Trail');
	assert.deepEqual(restored.documents, []);
});

test('snapshotTrailState clones persisted containers', () => {
	const state = defaultState();
	state.supportCircle = [{ name: 'Home', role: 'Contact', method: 'Text', phone: '555-0100' }];
	state.documents = [
		{
			id: 'doc-1',
			title: 'Plan',
			body: 'Keep moving.',
			source: 'manual',
			createdAt: '2026-06-21T12:00:00.000Z',
			updatedAt: '2026-06-21T12:00:00.000Z'
		}
	];

	const snapshot = snapshotTrailState(state);

	assert.deepEqual(snapshot, state);
	assert.notEqual(snapshot.hikeProfile, state.hikeProfile);
	assert.notEqual(snapshot.coachMessages, state.coachMessages);
	assert.notEqual(snapshot.coachMessages[0], state.coachMessages[0]);
	assert.notEqual(snapshot.documents[0], state.documents[0]);
	assert.notEqual(snapshot.supportCircle[0], state.supportCircle[0]);
});
