import { spacetimeEnabled, connect } from './spacetime/connection';
import type { TrailConditionReport } from './types';

// Trail Pulse publish path — rides the single shared SpacetimeDB connection (see
// spacetime/connection.ts). Publish-only; no subscription.

export async function publishTrailPulseReport(
	report: TrailConditionReport
): Promise<'synced' | 'skipped' | 'failed'> {
	if (!spacetimeEnabled) return 'skipped';

	const connection = await connect();
	if (!connection) return 'failed';

	await connection.reducers.submitTrailConditionReport({
		trailId: report.trailId,
		source: report.source,
		chipText: report.chipText,
		noteText: report.noteText,
		reporterTrailName: report.reporterTrailName,
		snappedMile: report.snappedMile,
		observedAt: report.observedAt
	});

	return 'synced';
}
