import assert from 'node:assert/strict';
import { test } from 'node:test';

import { createDefaultTrailState } from './trail-state-defaults.ts';
import {
	dismissedQuarantineRecord,
	parsePersistedTrailState,
	parseQuarantineRecord,
	quarantineRecord,
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
					updatedAt: '2026-06-21T12:00:00.000Z',
					revision: 1,
					revisions: []
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

test('restorePersistedTrailState repairs damaged branches without discarding valid hike data', () => {
	const defaults = defaultState();
	const restored = restorePersistedTrailState(
		{
			activeTab: 'Map',
			hikeProfile: {
				...defaults.hikeProfile,
				calibrated: true,
				mode: 'self',
				trailName: 'Dad',
				currentMile: 702.4,
				mileSource: 'manual'
			},
			currentMile: 702.4,
			dayNumber: 88,
			coachMessages: { broken: true },
			checkInHistory: null,
			documents: 'not-an-array',
			personalLoadout: null,
			trailPulseReports: {},
			seenTrailPulseReportIds: 'all',
			supportCircle: null,
			lastCheckIn: null,
			privacySettings: { stealthMode: false },
			trailSettings: { waterAlerts: false },
			trailLogSettings: null
		},
		defaults
	);

	assert.equal(restored.activeTab, 'Map');
	assert.equal(restored.currentMile, 702.4);
	assert.equal(restored.dayNumber, 88);
	assert.equal(restored.hikeProfile.trailName, 'Dad');
	assert.deepEqual(restored.coachMessages, defaults.coachMessages);
	assert.deepEqual(restored.checkInHistory, []);
	assert.deepEqual(restored.documents, []);
	assert.deepEqual(restored.personalLoadout, []);
	assert.deepEqual(restored.trailPulseReports, []);
	assert.deepEqual(restored.seenTrailPulseReportIds, []);
	assert.deepEqual(restored.supportCircle, []);
	assert.deepEqual(restored.lastCheckIn, defaults.lastCheckIn);
	assert.deepEqual(restored.privacySettings, {
		...defaults.privacySettings,
		stealthMode: false
	});
	assert.deepEqual(restored.trailSettings, {
		...defaults.trailSettings,
		waterAlerts: false
	});
	assert.deepEqual(restored.trailLogSettings, defaults.trailLogSettings);
});

test('restorePersistedTrailState salvages a valid self-profile mile when the duplicate mile is damaged', () => {
	const defaults = defaultState();
	const restored = restorePersistedTrailState({
		hikeProfile: {
			...defaults.hikeProfile,
			calibrated: true,
			mode: 'self',
			currentMile: 702.4,
			mileSource: 'manual'
		},
		currentMile: null
	}, defaults);

	assert.equal(restored.currentMile, 702.4);
	assert.equal(restored.hikeProfile.currentMile, 702.4);
});

test('restorePersistedTrailState drops invalid collection members before downstream use', () => {
	const defaults = defaultState();
	const restored = restorePersistedTrailState({
		hikeProfile: { ...defaults.hikeProfile, calibrated: true, mode: 'self' },
		coachMessages: [null],
		checkInHistory: [null],
		documents: [null],
		personalLoadout: [null],
		trailPulseReports: [null],
		seenTrailPulseReportIds: [null, 'seen-1'],
		supportCircle: [null],
		lastCheckIn: []
	}, defaults);

	assert.deepEqual(restored.coachMessages, []);
	assert.deepEqual(restored.checkInHistory, []);
	assert.deepEqual(restored.documents, []);
	assert.deepEqual(restored.personalLoadout, []);
	assert.deepEqual(restored.trailPulseReports, []);
	assert.deepEqual(restored.seenTrailPulseReportIds, ['seen-1']);
	assert.deepEqual(restored.supportCircle, []);
	assert.deepEqual(restored.lastCheckIn, defaults.lastCheckIn);
});

test('parsePersistedTrailState restores JSON snapshots', () => {
	const restored = parsePersistedTrailState(JSON.stringify({ activeTab: 'Gear', documents: [] }));

	assert.equal(restored.activeTab, 'Trail');
	assert.deepEqual(restored.documents, []);
});

test('parsePersistedTrailState throws on corrupt JSON', () => {
	assert.throws(() => parsePersistedTrailState('not json {{{'));
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
			updatedAt: '2026-06-21T12:00:00.000Z',
			revision: 1,
			revisions: []
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

test('quarantineRecord writes a first corruption record', () => {
	const serialized = quarantineRecord(
		'not json {{{',
		'Unexpected token',
		null,
		'2026-07-06T12:00:00.000Z'
	);

	assert.ok(serialized);
	assert.deepEqual(JSON.parse(serialized), {
		savedAt: '2026-07-06T12:00:00.000Z',
		reason: 'Unexpected token',
		raw: 'not json {{{',
		dismissed: false
	});
});

test('quarantineRecord preserves a valid existing record', () => {
	const existing = JSON.stringify({
		savedAt: '2026-07-06T12:00:00.000Z',
		reason: 'first failure',
		raw: 'original blob',
		dismissed: false
	});

	const serialized = quarantineRecord(
		'later blob',
		'later failure',
		existing,
		'2026-07-06T13:00:00.000Z'
	);

	assert.equal(serialized, null);
});

test('quarantineRecord overwrites garbage existing records', () => {
	const serialized = quarantineRecord(
		'recovered raw',
		'new failure',
		'not quarantine json',
		'2026-07-06T14:00:00.000Z'
	);

	assert.ok(serialized);
	assert.deepEqual(JSON.parse(serialized), {
		savedAt: '2026-07-06T14:00:00.000Z',
		reason: 'new failure',
		raw: 'recovered raw',
		dismissed: false
	});
});

test('parseQuarantineRecord round-trips valid quarantine JSON', () => {
	const serialized = JSON.stringify({
		savedAt: '2026-07-06T12:00:00.000Z',
		reason: 'SyntaxError',
		raw: '{"partial"',
		dismissed: false
	});

	assert.deepEqual(parseQuarantineRecord(serialized), {
		savedAt: '2026-07-06T12:00:00.000Z',
		reason: 'SyntaxError',
		raw: '{"partial"',
		dismissed: false
	});
	assert.equal(parseQuarantineRecord('garbage'), null);
	assert.equal(parseQuarantineRecord(null), null);
});

test('dismissedQuarantineRecord serializes the same record as dismissed', () => {
	const serialized = dismissedQuarantineRecord({
		savedAt: '2026-07-06T12:00:00.000Z',
		reason: 'SyntaxError',
		raw: '{"partial"',
		dismissed: false
	});

	assert.deepEqual(JSON.parse(serialized), {
		savedAt: '2026-07-06T12:00:00.000Z',
		reason: 'SyntaxError',
		raw: '{"partial"',
		dismissed: true
	});
});
