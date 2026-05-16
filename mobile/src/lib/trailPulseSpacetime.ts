import { browser } from '$app/environment';
import { DbConnection, type ErrorContext } from '../../../apps/openclaw-web/src/lib/module_bindings';
import type { TrailConditionReport } from './types';

const host = import.meta.env.PUBLIC_SPACETIMEDB_HOST ?? '';
const dbName = import.meta.env.PUBLIC_SPACETIMEDB_DB_NAME ?? '';
const enabled = Boolean(host && dbName);
const tokenKey = enabled ? `${host}/${dbName}/mobile_auth_token` : 'spacetime/mobile-disabled';

let connectionPromise: Promise<DbConnection | null> | null = null;
let activeConnection: DbConnection | null = null;

function connectToSpacetime(): Promise<DbConnection | null> {
	if (!browser || !enabled) return Promise.resolve(null);
	if (activeConnection?.isActive) return Promise.resolve(activeConnection);

	connectionPromise ??= new Promise((resolve) => {
		try {
			const builder = DbConnection.builder()
				.withUri(host)
				.withDatabaseName(dbName)
				.withToken(localStorage.getItem(tokenKey) || undefined)
				.onConnect((connection, _identity, token) => {
					localStorage.setItem(tokenKey, token);
					activeConnection = connection;
					resolve(connection);
				})
				.onDisconnect(() => {
					activeConnection = null;
					connectionPromise = null;
				})
				.onConnectError((_ctx: ErrorContext, error: Error) => {
					console.warn('Trail Pulse SpacetimeDB connection failed:', error.message);
					activeConnection = null;
					connectionPromise = null;
					resolve(null);
				});

			builder.build();
		} catch (error) {
			console.warn('Trail Pulse SpacetimeDB is unavailable:', error instanceof Error ? error.message : error);
			activeConnection = null;
			connectionPromise = null;
			resolve(null);
		}
	});

	return connectionPromise;
}

export async function publishTrailPulseReport(report: TrailConditionReport): Promise<'synced' | 'skipped' | 'failed'> {
	if (!enabled) return 'skipped';

	const connection = await connectToSpacetime();
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
