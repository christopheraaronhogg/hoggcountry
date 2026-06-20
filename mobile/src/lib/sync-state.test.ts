import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
	prepareQueuedReportsForSync,
	settleSyncingReports,
	settledSyncState,
	syncLabel,
	syncStateAfterOffline,
	syncStateForLocalWrite
} from './sync-state.ts';
import type { TrailConditionReport } from './types.ts';

function report(id: string, syncState: TrailConditionReport['syncState']): TrailConditionReport {
	return {
		id,
		trailId: 'at',
		source: 'text',
		noteText: id,
		snappedMile: 42,
		observedAt: '2026-06-20T12:00:00.000Z',
		status: 'active',
		createdAt: '2026-06-20T12:00:00.000Z',
		syncState
	};
}

test('syncLabel keeps UI copy centralized', () => {
	assert.equal(syncLabel('queued-offline'), 'Queued offline');
	assert.equal(syncLabel('syncing'), 'Syncing now');
	assert.equal(syncLabel('synced'), 'Synced');
});

test('queued report helpers select and mark only offline reports', () => {
	const reports = [report('queued', 'queued-offline'), report('syncing', 'syncing'), report('synced', 'synced')];
	const prepared = prepareQueuedReportsForSync(reports);

	assert.deepEqual(
		prepared.queuedReports.map((item) => item.id),
		['queued']
	);
	assert.deepEqual(
		prepared.reports.map((item) => [item.id, item.syncState]),
		[
			['queued', 'syncing'],
			['syncing', 'syncing'],
			['synced', 'synced']
		]
	);
});

test('settleSyncingReports updates in-flight reports and leaves others untouched', () => {
	const reports = [report('queued', 'queued-offline'), report('syncing', 'syncing'), report('synced', 'synced')];

	assert.deepEqual(
		settleSyncingReports(reports, 'queued-offline').map((item) => [item.id, item.syncState]),
		[
			['queued', 'queued-offline'],
			['syncing', 'queued-offline'],
			['synced', 'synced']
		]
	);
});

test('sync state transitions preserve honest offline behavior', () => {
	assert.equal(syncStateAfterOffline('syncing'), 'queued-offline');
	assert.equal(syncStateAfterOffline('queued-offline'), 'queued-offline');
	assert.equal(syncStateAfterOffline('synced'), 'synced');
	assert.equal(syncStateForLocalWrite(true), 'syncing');
	assert.equal(syncStateForLocalWrite(false), 'queued-offline');
	assert.equal(settledSyncState(true), 'synced');
	assert.equal(settledSyncState(false), 'queued-offline');
});
