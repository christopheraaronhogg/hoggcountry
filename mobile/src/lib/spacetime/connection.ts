import { browser } from '$app/environment';
import { DbConnection, type ErrorContext } from '../../../../apps/openclaw-web/src/lib/module_bindings';

// ONE shared SpacetimeDB connection for the whole app (best practice: a single
// DbConnection, not one per feature). Trail Pulse, water reports, and live
// location all ride this connection — three separate connections each
// reconnecting independently was the boot "connection storm" that froze the iOS
// WebView. Features register a connect handler (to (re)establish their
// subscriptions) and call connect() to get the shared connection for reducers.
// Disabled (a no-op) until PUBLIC_SPACETIMEDB_HOST / _DB_NAME are configured.

const host = import.meta.env.PUBLIC_SPACETIMEDB_HOST ?? '';
const dbName = import.meta.env.PUBLIC_SPACETIMEDB_DB_NAME ?? '';
export const spacetimeEnabled = Boolean(host && dbName);
const tokenKey = spacetimeEnabled ? `${host}/${dbName}/mobile_auth_token` : 'spacetime/mobile-disabled';

const MAX_RECONNECT_ATTEMPTS = 6;
const BASE_RECONNECT_MS = 1000;
const MAX_RECONNECT_MS = 60_000;

type IdLike = { toHexString?: () => string };
type ConnectHandler = (conn: DbConnection) => void;

let connection: DbConnection | null = null;
let connecting: Promise<DbConnection | null> | null = null;
let identityHex: string | null = null;
let reconnectAttempts = 0;
let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
let lifecycleWired = false;

const connectHandlers = new Set<ConnectHandler>();
const stateListeners = new Set<() => void>();

function idHex(id: IdLike | null | undefined): string | null {
	if (!id) return null;
	try {
		return id.toHexString?.() ?? String(id);
	} catch {
		return null;
	}
}

function notify() {
	for (const l of stateListeners) {
		try {
			l();
		} catch {
			/* listener errors must not break the connection loop */
		}
	}
}

/** The shared connection's identity (hex), or null before connected. */
export function spacetimeIdentityHex(): string | null {
	return identityHex;
}

/** True while the shared connection is live. */
export function isSpacetimeConnected(): boolean {
	return !!connection?.isActive;
}

/** Subscribe to connect/disconnect transitions (for reactive UI state). */
export function onSpacetimeState(listener: () => void): void {
	stateListeners.add(listener);
}

/**
 * Register a handler that runs on every (re)connect — set up subscriptions and
 * row callbacks here so they re-establish after a reconnect. Runs immediately if
 * already connected.
 */
export function onSpacetimeConnect(handler: ConnectHandler): void {
	connectHandlers.add(handler);
	if (connection?.isActive) {
		try {
			handler(connection);
		} catch (error) {
			console.warn('SpacetimeDB connect handler failed:', error);
		}
	}
}

function wireLifecycle() {
	if (lifecycleWired || !browser) return;
	lifecycleWired = true;
	// The SDK doesn't auto-reconnect; recover on regained connectivity / resume.
	window.addEventListener('online', () => {
		reconnectAttempts = 0;
		void connect();
	});
	document.addEventListener('visibilitychange', () => {
		if (document.visibilityState === 'visible') {
			reconnectAttempts = 0;
			void connect();
		}
	});
}

function scheduleReconnect() {
	if (!browser || !spacetimeEnabled || reconnectTimer) return;
	if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) return; // bounded; online/resume re-arms
	reconnectAttempts++;
	const delay = Math.min(BASE_RECONNECT_MS * 2 ** reconnectAttempts, MAX_RECONNECT_MS);
	reconnectTimer = setTimeout(() => {
		reconnectTimer = null;
		void connect();
	}, delay);
}

/** Connect (or return the live shared connection). Coalesces concurrent calls. */
export function connect(): Promise<DbConnection | null> {
	if (!browser || !spacetimeEnabled) return Promise.resolve(null);
	if (connection?.isActive) return Promise.resolve(connection);
	wireLifecycle();
	connecting ??= new Promise((resolve) => {
		try {
			DbConnection.builder()
				.withUri(host)
				.withDatabaseName(dbName)
				.withToken(localStorage.getItem(tokenKey) || undefined)
				.onConnect((conn, identity, token) => {
					localStorage.setItem(tokenKey, token);
					connection = conn;
					identityHex = idHex(identity as IdLike);
					reconnectAttempts = 0;
					connecting = null;
					for (const handler of connectHandlers) {
						try {
							handler(conn);
						} catch (error) {
							console.warn('SpacetimeDB connect handler failed:', error);
						}
					}
					notify();
					resolve(conn);
				})
				.onDisconnect(() => {
					connection = null;
					connecting = null;
					notify();
					scheduleReconnect();
				})
				.onConnectError((_ctx: ErrorContext, error: Error) => {
					console.warn('SpacetimeDB connection failed:', error.message);
					connection = null;
					connecting = null;
					notify();
					scheduleReconnect();
					resolve(null);
				})
				.build();
		} catch (error) {
			console.warn('SpacetimeDB unavailable:', error instanceof Error ? error.message : error);
			connection = null;
			connecting = null;
			resolve(null);
		}
	});
	return connecting;
}
