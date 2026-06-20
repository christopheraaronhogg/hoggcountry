import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
	createTrailPulseReport,
	formatTrailPulseDisplayText,
	markTrailPulseReportSeen,
	nearbyTrailPulseReports,
	pendingTrailPulseAlert,
	updateTrailPulseSyncState
} from './trail-pulse.ts';

test('createTrailPulseReport normalizes mile, trail name, and sync defaults', () => {
	const report = createTrailPulseReport({
		id: 'report-1',
		source: 'chip',
		chipText: 'Water',
		noteText: ' Spring is running ',
		reporterTrailName: '  Sprout ',
		snappedMile: 42.34,
		observedAt: '2026-02-02T12:00:00.000Z'
	});

	assert.equal(report.id, 'report-1');
	assert.equal(report.trailId, 'appalachian-trail');
	assert.equal(report.reporterTrailName, 'Sprout');
	assert.equal(report.snappedMile, 42.3);
	assert.equal(report.status, 'active');
	assert.equal(report.syncState, 'synced');
});

test('formatTrailPulseDisplayText falls back honestly and appends trail names', () => {
	assert.equal(
		formatTrailPulseDisplayText(
			createTrailPulseReport({
				id: 'report-2',
				source: 'chip',
				noteText: '',
				chipText: 'Blowdown',
				reporterTrailName: 'Maps',
				snappedMile: 10,
				observedAt: '2026-02-02T12:00:00.000Z'
			})
		),
		'Blowdown -Maps'
	);

	assert.equal(
		formatTrailPulseDisplayText(
			createTrailPulseReport({
				id: 'report-3',
				source: 'chip',
				noteText: '',
				snappedMile: 10,
				observedAt: '2026-02-02T12:00:00.000Z'
			})
		),
		'Trail note'
	);
});

test('nearbyTrailPulseReports filters by active range and newest first', () => {
	const reports = [
		createTrailPulseReport({
			id: 'old-nearby',
			source: 'chip',
			noteText: 'older',
			snappedMile: 50.05,
			observedAt: '2026-02-02T10:00:00.000Z'
		}),
		createTrailPulseReport({
			id: 'far',
			source: 'chip',
			noteText: 'far',
			snappedMile: 50.3,
			observedAt: '2026-02-02T12:00:00.000Z'
		}),
		createTrailPulseReport({
			id: 'new-nearby',
			source: 'chip',
			noteText: 'newer',
			snappedMile: 50.02,
			observedAt: '2026-02-02T11:00:00.000Z'
		})
	];

	assert.deepEqual(
		nearbyTrailPulseReports(reports, 50).map((report) => report.id),
		['new-nearby', 'old-nearby']
	);
});

test('pendingTrailPulseAlert ignores seen reports', () => {
	const reports = [
		createTrailPulseReport({
			id: 'seen',
			source: 'chip',
			noteText: 'seen',
			snappedMile: 12,
			observedAt: '2026-02-02T11:00:00.000Z'
		}),
		createTrailPulseReport({
			id: 'fresh',
			source: 'chip',
			noteText: 'fresh',
			snappedMile: 12,
			observedAt: '2026-02-02T10:00:00.000Z'
		})
	];

	assert.equal(
		pendingTrailPulseAlert({ reports, seenReportIds: ['seen'], currentMile: 12 })?.id,
		'fresh'
	);
});

test('sync and seen helpers update by id without duplicating seen ids', () => {
	const report = createTrailPulseReport({
		id: 'queued',
		source: 'chip',
		noteText: 'queued',
		snappedMile: 1,
		syncState: 'queued-offline'
	});

	assert.equal(updateTrailPulseSyncState([report], 'queued', 'synced')[0]?.syncState, 'synced');
	assert.deepEqual(markTrailPulseReportSeen(['queued'], 'queued'), ['queued']);
	assert.deepEqual(markTrailPulseReportSeen(['a'], 'queued'), ['queued', 'a']);
});
