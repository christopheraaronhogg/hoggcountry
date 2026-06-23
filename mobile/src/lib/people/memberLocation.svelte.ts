import { browser } from '$app/environment';
import { DbConnection, type ErrorContext, type EventContext } from '../../../../apps/openclaw-web/src/lib/module_bindings';

// Phase 3 of "Life360 for the tramily": LIVE group location over SpacetimeDB,
// kept PRIVATE by the module's design. The group_member / group_position tables
// are server-private (not in the client bindings at all); a client can only read
// the sender-scoped views my_group_positions / my_group_members, which the server
// filters to the groups the caller actually belongs to. So this store can only
// ever see — and can only ever publish AS — its own identity, within its own
// groups. Disabled (a no-op) until PUBLIC_SPACETIMEDB_HOST / _DB_NAME are set and
// the module is deployed; the app stays fully usable with the local-only roster.

const host = import.meta.env.PUBLIC_SPACETIMEDB_HOST ?? '';
const dbName = import.meta.env.PUBLIC_SPACETIMEDB_DB_NAME ?? '';
const enabled = Boolean(host && dbName);
// Shared identity token with the other SpacetimeDB features, so this device is
// the SAME identity everywhere (its group membership is bound to that identity).
const tokenKey = enabled ? `${host}/${dbName}/mobile_auth_token` : 'spacetime/mobile-disabled';

/** A co-member's live position, as surfaced to the map. */
export interface LiveMemberPosition {
	identityHex: string;
	groupCode: string;
	trailName: string;
	mile: number;
	observedAt: string;
	updatedAt: string;
	isSelf: boolean;
}

/** A member of a group the caller can see (roster). */
export interface LiveMember {
	identityHex: string;
	groupCode: string;
	trailName: string;
	isSelf: boolean;
}

// Loose row shapes (we don't depend on the exact generated binding type names).
type IdLike = { toHexString?: () => string };
type PositionRow = {
	groupCode: string;
	identity: IdLike;
	trailName: string;
	mile: number;
	observedAt: string;
	updatedAt: string;
};
type MemberRow = { groupCode: string; identity: IdLike; trailName: string };

function idHex(id: IdLike | null | undefined): string {
	if (!id) return '';
	try {
		return id.toHexString?.() ?? String(id);
	} catch {
		return String(id);
	}
}

class MemberLocationStore {
	connected = $state(false);
	myIdentityHex = $state<string | null>(null);
	positions = $state<LiveMemberPosition[]>([]);
	members = $state<LiveMember[]>([]);

	#connection: DbConnection | null = null;
	#connecting: Promise<DbConnection | null> | null = null;
	#subscribed = false;
	#lifecycleWired = false;
	#reconnectTimer: ReturnType<typeof setTimeout> | null = null;
	#reconnectDelay = 2000;

	get available(): boolean {
		return enabled;
	}

	/** Connect + subscribe to the two sender-scoped views. Idempotent; no-op when
	 *  SpacetimeDB isn't configured. Wires reconnect triggers (online / app resume)
	 *  on first call — the v2 SDK does NOT auto-reconnect, and without recovery a
	 *  single signal drop on the trail would silently stop live sharing AND strip
	 *  "going dark" of its server round-trip until the app was relaunched. */
	async start(): Promise<void> {
		if (!browser || !enabled) return;
		if (!this.#lifecycleWired) {
			this.#lifecycleWired = true;
			window.addEventListener('online', () => void this.#connect());
			document.addEventListener('visibilitychange', () => {
				if (document.visibilityState === 'visible') void this.#connect();
			});
		}
		await this.#connect();
	}

	#scheduleReconnect(): void {
		if (!browser || !enabled || this.#reconnectTimer) return;
		this.#reconnectTimer = setTimeout(() => {
			this.#reconnectTimer = null;
			void this.#connect();
		}, this.#reconnectDelay);
		this.#reconnectDelay = Math.min(this.#reconnectDelay * 2, 60_000); // capped backoff
	}

	#connect(): Promise<DbConnection | null> {
		if (!browser || !enabled) return Promise.resolve(null);
		if (this.#connection?.isActive) return Promise.resolve(this.#connection);
		this.#connecting ??= new Promise((resolve) => {
			try {
				DbConnection.builder()
					.withUri(host)
					.withDatabaseName(dbName)
					.withToken(localStorage.getItem(tokenKey) || undefined)
					.onConnect((connection, identity, token) => {
						localStorage.setItem(tokenKey, token);
						this.#connection = connection;
						this.myIdentityHex = idHex(identity as IdLike);
						this.connected = true;
						this.#reconnectDelay = 2000; // recovered — reset backoff
						this.#subscribe(connection);
						resolve(connection);
					})
					.onDisconnect(() => {
						this.#connection = null;
						this.#connecting = null;
						this.#subscribed = false;
						this.connected = false;
						// The SDK won't reconnect itself; drive recovery so a dropped
						// leave/stop (going dark) and live updates resume within the session.
						this.#scheduleReconnect();
					})
					.onConnectError((_ctx: ErrorContext, error: Error) => {
						console.warn('Live location SpacetimeDB connection failed:', error.message);
						this.#connection = null;
						this.#connecting = null;
						this.#scheduleReconnect();
						resolve(null);
					})
					.build();
			} catch (error) {
				console.warn('Live location SpacetimeDB unavailable:', error instanceof Error ? error.message : error);
				this.#connection = null;
				this.#connecting = null;
				resolve(null);
			}
		});
		return this.#connecting;
	}

	#subscribe(connection: DbConnection) {
		if (this.#subscribed) return;
		this.#subscribed = true;
		try {
			const refreshPositions = () => this.#refreshPositions(connection);
			const refreshMembers = () => this.#refreshMembers(connection);
			connection.db.myGroupPositions.onInsert(refreshPositions);
			connection.db.myGroupPositions.onUpdate(refreshPositions);
			connection.db.myGroupPositions.onDelete(refreshPositions);
			connection.db.myGroupMembers.onInsert(refreshMembers);
			connection.db.myGroupMembers.onDelete(refreshMembers);
			connection
				.subscriptionBuilder()
				.onApplied(() => {
					refreshPositions();
					refreshMembers();
				})
				.subscribe(['SELECT * FROM my_group_positions', 'SELECT * FROM my_group_members']);
		} catch (error) {
			this.#subscribed = false;
			console.warn('Live location subscription unavailable:', error instanceof Error ? error.message : error);
		}
	}

	#refreshPositions(connection: DbConnection) {
		const me = this.myIdentityHex;
		const next: LiveMemberPosition[] = [];
		for (const row of connection.db.myGroupPositions.iter() as Iterable<PositionRow>) {
			const identityHex = idHex(row.identity);
			next.push({
				identityHex,
				groupCode: row.groupCode,
				trailName: row.trailName,
				mile: row.mile,
				observedAt: row.observedAt,
				updatedAt: row.updatedAt,
				isSelf: !!me && identityHex === me
			});
		}
		this.positions = next;
	}

	#refreshMembers(connection: DbConnection) {
		const me = this.myIdentityHex;
		const next: LiveMember[] = [];
		for (const row of connection.db.myGroupMembers.iter() as Iterable<MemberRow>) {
			const identityHex = idHex(row.identity);
			next.push({ identityHex, groupCode: row.groupCode, trailName: row.trailName, isSelf: !!me && identityHex === me });
		}
		this.members = next;
	}

	/** Co-members (not me) currently sharing a position in a given group. */
	positionsForGroup(groupCode: string | undefined): LiveMemberPosition[] {
		if (!groupCode) return [];
		return this.positions.filter((p) => p.groupCode === groupCode && !p.isSelf);
	}

	/** Group codes the SERVER currently has me as a member of (reactive). The
	 *  coordinator reconciles this against the desired sharing set so revocation is
	 *  durable across offline toggles and relaunches — not trusted to an in-memory
	 *  set that a dropped reducer call or a restart would desync. */
	get myMembershipCodes(): string[] {
		return this.members.filter((m) => m.isSelf).map((m) => m.groupCode);
	}

	/** Group codes the server currently holds MY position in (reactive). */
	get myPositionCodes(): string[] {
		return this.positions.filter((p) => p.isSelf).map((p) => p.groupCode);
	}

	/** Join a group by its shared code (idempotent server-side). */
	async joinGroup(groupCode: string, trailName: string): Promise<void> {
		const connection = await this.#connect();
		if (!connection) return;
		connection.reducers.joinGroup({ groupCode, trailName });
	}

	async leaveGroup(groupCode: string): Promise<void> {
		const connection = await this.#connect();
		if (!connection) return;
		connection.reducers.leaveGroup({ groupCode });
	}

	/** Publish my current mile to every group I'm in (the views scope who sees it). */
	async publish(mile: number, trailName: string, observedAt?: string): Promise<void> {
		if (!Number.isFinite(mile) || mile < 0) return;
		const connection = await this.#connect();
		if (!connection) return;
		connection.reducers.publishPosition({ mile, trailName, observedAt });
	}

	/** Stop broadcasting entirely (membership kept; positions cleared). */
	async stopSharing(): Promise<void> {
		const connection = await this.#connect();
		if (!connection) return;
		connection.reducers.stopSharingPosition({ confirm: true });
	}
}

export const memberLocation = new MemberLocationStore();
