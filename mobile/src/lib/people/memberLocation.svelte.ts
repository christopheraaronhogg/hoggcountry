import { browser } from '$app/environment';
import type { DbConnection } from '../../../../apps/openclaw-web/src/lib/module_bindings';
import {
	spacetimeEnabled,
	connect,
	onSpacetimeConnect,
	onSpacetimeState,
	isSpacetimeConnected,
	spacetimeIdentityHex
} from '../spacetime/connection';

// Phase 3: LIVE group location, riding the single shared SpacetimeDB connection
// (see spacetime/connection.ts). The group_member / group_position tables are
// server-private; this store reads only the sender-scoped views
// my_group_positions / my_group_members, and can only publish AS its own identity
// within its own groups. No-op until SpacetimeDB is configured.

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

	#started = false;

	get available(): boolean {
		return spacetimeEnabled;
	}

	/** Subscribe to the two sender-scoped views over the shared connection.
	 *  Idempotent; no-op when SpacetimeDB isn't configured. */
	async start(): Promise<void> {
		if (!browser || !spacetimeEnabled) return;
		if (!this.#started) {
			this.#started = true;
			// Re-subscribe on every (re)connect; reflect connect/disconnect in state.
			onSpacetimeConnect((conn) => this.#subscribe(conn));
			onSpacetimeState(() => {
				this.connected = isSpacetimeConnected();
				this.myIdentityHex = spacetimeIdentityHex();
			});
		}
		await connect();
	}

	#subscribe(connection: DbConnection) {
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
	 *  durable across offline toggles and relaunches. */
	get myMembershipCodes(): string[] {
		return this.members.filter((m) => m.isSelf).map((m) => m.groupCode);
	}

	/** Group codes the server currently holds MY position in (reactive). */
	get myPositionCodes(): string[] {
		return this.positions.filter((p) => p.isSelf).map((p) => p.groupCode);
	}

	/** Join (or refresh display name in) a group by its shared code. */
	async joinGroup(groupCode: string, trailName: string): Promise<void> {
		const connection = await connect();
		if (!connection) return;
		connection.reducers.joinGroup({ groupCode, trailName });
	}

	async leaveGroup(groupCode: string): Promise<void> {
		const connection = await connect();
		if (!connection) return;
		connection.reducers.leaveGroup({ groupCode });
	}

	/** Publish my current mile to every group I'm in (the views scope who sees it). */
	async publish(mile: number, trailName: string, observedAt?: string): Promise<void> {
		if (!Number.isFinite(mile) || mile < 0) return;
		const connection = await connect();
		if (!connection) return;
		connection.reducers.publishPosition({ mile, trailName, observedAt });
	}

	/** Stop broadcasting entirely (membership kept; positions cleared). */
	async stopSharing(): Promise<void> {
		const connection = await connect();
		if (!connection) return;
		connection.reducers.stopSharingPosition({ confirm: true });
	}
}

export const memberLocation = new MemberLocationStore();
