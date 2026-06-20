import type { SyncState, TrailConditionReport } from './types.ts';

export function syncLabel(syncState: SyncState): string {
	if (syncState === 'queued-offline') return 'Queued offline';
	if (syncState === 'syncing') return 'Syncing now';
	return 'Synced';
}

export interface QueuedReportSync {
	queuedReports: TrailConditionReport[];
	reports: TrailConditionReport[];
}

export function prepareQueuedReportsForSync(reports: TrailConditionReport[]): QueuedReportSync {
	const queuedReports: TrailConditionReport[] = [];
	const nextReports = reports.map((report): TrailConditionReport => {
		if (report.syncState !== 'queued-offline') return report;
		queuedReports.push(report);
		return { ...report, syncState: 'syncing' };
	});

	return { queuedReports, reports: nextReports };
}

export function settleSyncingReports(
	reports: TrailConditionReport[],
	syncState: SyncState
): TrailConditionReport[] {
	return reports.map((report) => (report.syncState === 'syncing' ? { ...report, syncState } : report));
}

export function syncStateAfterOffline(syncState: SyncState): SyncState {
	return syncState === 'syncing' ? 'queued-offline' : syncState;
}

export function syncStateForLocalWrite(onlineStatus: boolean): Extract<SyncState, 'syncing' | 'queued-offline'> {
	return onlineStatus ? 'syncing' : 'queued-offline';
}

export function settledSyncState(onlineStatus: boolean): Extract<SyncState, 'synced' | 'queued-offline'> {
	return onlineStatus ? 'synced' : 'queued-offline';
}
