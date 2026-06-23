import { browser } from '$app/environment';
import { DbConnection, type ErrorContext, type EventContext } from '../../../apps/openclaw-web/src/lib/module_bindings';

// Two-way SpacetimeDB sync for crowdsourced water reports. Mirrors the Trail Pulse
// publish path and adds a subscription so a hiker also RECEIVES the tramily's
// reports (Trail Pulse is publish-only today). Disabled (a no-op) until
// PUBLIC_SPACETIMEDB_HOST / _DB_NAME are configured and the module is deployed.

const host = import.meta.env.PUBLIC_SPACETIMEDB_HOST ?? '';
const dbName = import.meta.env.PUBLIC_SPACETIMEDB_DB_NAME ?? '';
const enabled = Boolean(host && dbName);
const tokenKey = enabled ? `${host}/${dbName}/mobile_auth_token` : 'spacetime/mobile-disabled';

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

let connectionPromise: Promise<DbConnection | null> | null = null;
let activeConnection: DbConnection | null = null;
let subscribed = false;
let onRemote: ((report: RemoteWaterReport) => void) | null = null;

function emit(row: WaterReportRow) {
	onRemote?.({
		mile: row.mile,
		sourceName: row.sourceName,
		status: row.status,
		reporterTrailName: row.reporterTrailName ?? undefined,
		observedAt: row.observedAt
	});
}

function attachSubscription(connection: DbConnection) {
	if (subscribed) return;
	subscribed = true;
	try {
		connection.db.waterReport.onInsert((_ctx: EventContext, row: WaterReportRow) => emit(row));
		connection
			.subscriptionBuilder()
			.onApplied(() => {
				for (const row of connection.db.waterReport.iter() as Iterable<WaterReportRow>) emit(row);
			})
			.subscribe(['SELECT * FROM water_report']);
	} catch (error) {
		subscribed = false;
		console.warn('Water report subscription unavailable:', error instanceof Error ? error.message : error);
	}
}

function connectToSpacetime(): Promise<DbConnection | null> {
	if (!browser || !enabled) return Promise.resolve(null);
	if (activeConnection?.isActive) return Promise.resolve(activeConnection);

	connectionPromise ??= new Promise((resolve) => {
		try {
			DbConnection.builder()
				.withUri(host)
				.withDatabaseName(dbName)
				.withToken(localStorage.getItem(tokenKey) || undefined)
				.onConnect((connection, _identity, token) => {
					localStorage.setItem(tokenKey, token);
					activeConnection = connection;
					if (onRemote) attachSubscription(connection);
					resolve(connection);
				})
				.onDisconnect(() => {
					activeConnection = null;
					connectionPromise = null;
					subscribed = false;
				})
				.onConnectError((_ctx: ErrorContext, error: Error) => {
					console.warn('Water report SpacetimeDB connection failed:', error.message);
					activeConnection = null;
					connectionPromise = null;
					resolve(null);
				})
				.build();
		} catch (error) {
			console.warn('Water report SpacetimeDB is unavailable:', error instanceof Error ? error.message : error);
			activeConnection = null;
			connectionPromise = null;
			resolve(null);
		}
	});

	return connectionPromise;
}

/** Start receiving the tramily's water reports. Safe to call once at startup;
 *  a no-op when the sync isn't configured. */
export function startWaterReportSync(onReport: (report: RemoteWaterReport) => void): void {
	if (!enabled) return;
	onRemote = onReport;
	void connectToSpacetime().then((connection) => {
		if (connection) attachSubscription(connection);
	});
}

/** Publish one report to the shared DB. */
export async function publishWaterReport(report: WaterReportPayload): Promise<'synced' | 'skipped' | 'failed'> {
	if (!enabled) return 'skipped';

	const connection = await connectToSpacetime();
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
