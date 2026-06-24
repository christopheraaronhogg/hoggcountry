import { type EventContext } from '../../../apps/openclaw-web/src/lib/module_bindings';
import { spacetimeEnabled, connect, onSpacetimeConnect } from './spacetime/connection';

// Two-way SpacetimeDB sync for crowdsourced water reports, riding the single
// shared connection (see spacetime/connection.ts). Subscribes so a hiker RECEIVES
// the tramily's reports; publishes their own. No-op until SpacetimeDB is configured.

/** The fields the client cares about from a remote water_report row. */
export interface RemoteWaterReport {
	mile: number;
	sourceName: string;
	status: string;
	reporterTrailName?: string;
	observedAt: string;
}

export interface WaterReportPayload {
	mile: number;
	sourceName: string;
	status: string;
	reporterTrailName?: string;
	observedAt: string;
}

// The generated row shape we read (kept local so we don't depend on the exact
// exported binding type name).
type WaterReportRow = {
	mile: number;
	sourceName: string;
	status: string;
	reporterTrailName?: string | null;
	observedAt: string;
};

// Loosely-typed connection so we don't depend on the exact generated type name.
type Conn = Awaited<ReturnType<typeof connect>>;

let onRemote: ((report: RemoteWaterReport) => void) | null = null;
let started = false;

function emit(row: WaterReportRow) {
	onRemote?.({
		mile: row.mile,
		sourceName: row.sourceName,
		status: row.status,
		reporterTrailName: row.reporterTrailName ?? undefined,
		observedAt: row.observedAt
	});
}

// Runs on each (re)connect with the live connection — re-establishes the
// subscription so reports keep flowing after a reconnect.
function attachSubscription(connection: NonNullable<Conn>) {
	try {
		connection.db.waterReport.onInsert((_ctx: EventContext, row: WaterReportRow) => emit(row));
		connection
			.subscriptionBuilder()
			.onApplied(() => {
				for (const row of connection.db.waterReport.iter() as Iterable<WaterReportRow>) emit(row);
			})
			.subscribe(['SELECT * FROM water_report']);
	} catch (error) {
		console.warn('Water report subscription unavailable:', error instanceof Error ? error.message : error);
	}
}

/** Start receiving the tramily's water reports. Idempotent; a no-op when the sync
 *  isn't configured. */
export function startWaterReportSync(onReport: (report: RemoteWaterReport) => void): void {
	if (!spacetimeEnabled) return;
	onRemote = onReport;
	if (started) return;
	started = true;
	onSpacetimeConnect((conn) => attachSubscription(conn));
	void connect();
}

/** Publish one report to the shared DB. */
export async function publishWaterReport(
	report: WaterReportPayload
): Promise<'synced' | 'skipped' | 'failed'> {
	if (!spacetimeEnabled) return 'skipped';

	const connection = await connect();
	if (!connection) return 'failed';

	await connection.reducers.submitWaterReport({
		trailId: 'appalachian-trail',
		mile: report.mile,
		sourceName: report.sourceName,
		status: report.status,
		reporterTrailName: report.reporterTrailName,
		observedAt: report.observedAt
	});

	return 'synced';
}
