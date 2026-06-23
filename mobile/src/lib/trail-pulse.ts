import type {
	SyncState,
	TrailConditionReport,
	TrailPulseChip,
	TrailPulseSource
} from './types';

export const TRAIL_PULSE_RANGE_MILES = 0.1;
const TRAIL_ID = 'appalachian-trail';
const MAX_SEEN_TRAIL_PULSE_IDS = 120;

export function createTrailPulseReport(input: {
	source: TrailPulseSource;
	chipText?: TrailPulseChip;
	noteText: string;
	reporterTrailName?: string;
	snappedMile: number;
	observedAt?: string;
	syncState?: SyncState;
	id?: string;
	photo?: string;
}): TrailConditionReport {
	const observedAt = input.observedAt ?? new Date().toISOString();

	return {
		id: input.id ?? crypto.randomUUID(),
		trailId: TRAIL_ID,
		source: input.source,
		chipText: input.chipText,
		noteText: input.noteText,
		reporterTrailName: input.reporterTrailName?.trim() || undefined,
		snappedMile: Number(input.snappedMile.toFixed(1)),
		observedAt,
		status: 'active',
		createdAt: observedAt,
		syncState: input.syncState ?? 'synced',
		photo: input.photo
	};
}

export function formatTrailPulseDisplayText(report: TrailConditionReport): string {
	const base = report.noteText.trim() || report.chipText || 'Trail note';
	const trailName = report.reporterTrailName?.trim();

	return trailName ? `${base} -${trailName}` : base;
}

export function nearbyTrailPulseReports(
	reports: TrailConditionReport[],
	currentMile: number,
	rangeMiles = TRAIL_PULSE_RANGE_MILES
): TrailConditionReport[] {
	return reports
		.filter(
			(report) =>
				report.status === 'active' && Math.abs(currentMile - report.snappedMile) <= rangeMiles
		)
		.sort((a, b) => new Date(b.observedAt).getTime() - new Date(a.observedAt).getTime());
}

export function pendingTrailPulseAlert(input: {
	reports: TrailConditionReport[];
	seenReportIds: string[];
	currentMile: number;
	rangeMiles?: number;
}): TrailConditionReport | null {
	return (
		nearbyTrailPulseReports(input.reports, input.currentMile, input.rangeMiles).find(
			(report) => !input.seenReportIds.includes(report.id)
		) ?? null
	);
}

export function updateTrailPulseSyncState(
	reports: TrailConditionReport[],
	reportId: string,
	syncState: SyncState
): TrailConditionReport[] {
	return reports.map((report) => (report.id === reportId ? { ...report, syncState } : report));
}

export function markTrailPulseReportSeen(seenReportIds: string[], reportId: string): string[] {
	if (seenReportIds.includes(reportId)) return seenReportIds;
	return [reportId, ...seenReportIds].slice(0, MAX_SEEN_TRAIL_PULSE_IDS);
}
