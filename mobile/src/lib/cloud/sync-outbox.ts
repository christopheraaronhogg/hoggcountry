// Pure, framework-free core of the cloud-backup outbox (Phase 1). The reactive
// engine in syncEngine.svelte.ts is a thin wrapper over these functions; keeping
// the change-detection, payload-building and last-write-wins reconciliation here
// (no runes, no I/O) makes the logic that guards a hiker's data unit-testable.

export type Op = 'upsert' | 'delete';

export interface OutboxEntry {
	docType: string;
	docId: string;
	op: Op;
	content: unknown | null;
	etag: string;
	clientUpdatedAt: string; // ISO; monotonic per doc (set when content last changed)
}

/** Wire shape the Laravel /sync/push endpoint validates (snake_case). */
export interface PushChange {
	op: Op;
	doc_type: string;
	doc_id: string;
	schema_version: number;
	client_updated_at: string;
	etag: string;
	content?: unknown;
}

export interface PushApplied {
	doc_type: string;
	doc_id: string;
	etag: string;
}

export interface PushRejected {
	doc_type: string;
	doc_id: string;
	reason: string;
	server?: { etag?: string };
}

/** A document as it comes back from /sync/bootstrap (restore). */
export interface RemoteDoc {
	doc_type: string;
	doc_id: string;
	op: Op;
	content: unknown;
	etag: string;
}

/** What restore should do with one remote document. */
export type RestoreDecision = 'apply' | 'skip-have' | 'skip-local';

export type PendingMap = Record<string, OutboxEntry>;
export type SyncedMap = Record<string, string>; // docKey -> etag confirmed on the server

export function docKey(docType: string, docId: string): string {
	return `${docType}:${docId}`;
}

/**
 * A short, stable content fingerprint (two rolling hashes + length, base36, ≤64
 * chars for the server's etag column). Used only for change detection: equal
 * fingerprint ⇒ unchanged ⇒ skip. A rare collision merely skips a backup of an
 * identical-length payload, never corrupts one.
 */
export function etagOf(content: unknown): string {
	const s = JSON.stringify(content) ?? 'null';
	let h1 = 5381;
	let h2 = 0;
	for (let i = 0; i < s.length; i++) {
		const c = s.charCodeAt(i);
		h1 = ((h1 << 5) + h1 + c) | 0;
		h2 = (c + (h2 << 6) + (h2 << 16) - h2) | 0;
	}
	return ((h1 >>> 0).toString(36) + (h2 >>> 0).toString(36) + s.length.toString(36)).slice(0, 64);
}

/**
 * Decide whether a freshly-fingerprinted upsert is worth queuing: skip if it's
 * already queued at this version, or already backed up (and not currently
 * queued). Returns true only when the content genuinely moved.
 */
export function shouldEnqueueUpsert(
	pending: PendingMap,
	synced: SyncedMap,
	key: string,
	etag: string
): boolean {
	const current = pending[key];
	if (current?.etag === etag) return false;
	if (!current && synced[key] === etag) return false;
	return true;
}

export function makeUpsert(
	docType: string,
	docId: string,
	content: unknown,
	nowIso: string
): OutboxEntry {
	return { docType, docId, op: 'upsert', content, etag: etagOf(content), clientUpdatedAt: nowIso };
}

export function makeDelete(docType: string, docId: string, nowIso: string): OutboxEntry {
	return {
		docType,
		docId,
		op: 'delete',
		content: null,
		etag: etagOf(`__deleted__${nowIso}`),
		clientUpdatedAt: nowIso
	};
}

/** Build the snake_case change array the server validates (delete omits content). */
export function toPushChanges(entries: OutboxEntry[], schemaVersion: number): PushChange[] {
	return entries.map((e) => ({
		op: e.op,
		doc_type: e.docType,
		doc_id: e.docId,
		schema_version: schemaVersion,
		client_updated_at: e.clientUpdatedAt,
		etag: e.etag,
		...(e.op === 'upsert' ? { content: e.content } : {})
	}));
}

/**
 * Fold a push response back into the outbox:
 *  - applied  → record the server etag; clear the queue entry UNLESS it was
 *               re-dirtied mid-flight (its etag changed), in which case keep it
 *               so the newer content backs up next round.
 *  - rejected → the server already holds a newer copy (another device synced
 *               since). On a backup the newest wins: adopt the server etag and
 *               drop our stale push rather than fight it.
 * Returns NEW maps; inputs are not mutated.
 */
export function reconcilePush(
	pending: PendingMap,
	synced: SyncedMap,
	applied: PushApplied[],
	rejected: PushRejected[]
): { pending: PendingMap; synced: SyncedMap; rejectedKeys: string[] } {
	const nextPending: PendingMap = { ...pending };
	const nextSynced: SyncedMap = { ...synced };
	const rejectedKeys: string[] = [];

	for (const a of applied) {
		const key = docKey(a.doc_type, a.doc_id);
		nextSynced[key] = a.etag;
		if (nextPending[key]?.etag === a.etag) delete nextPending[key];
	}
	for (const r of rejected) {
		// The server holds a newer copy (another device wrote since we synced). Drop
		// our losing push, and FORGET our baseline for this doc so the next restore
		// re-pulls and applies the server's authoritative content — converging local
		// to it. (Pinning synced to the server etag without applying its content
		// would leave local silently diverged, since a later restore would then
		// skip-have.) The caller re-runs restore when rejectedKeys is non-empty.
		const key = docKey(r.doc_type, r.doc_id);
		delete nextPending[key];
		delete nextSynced[key];
		rejectedKeys.push(key);
	}

	return { pending: nextPending, synced: nextSynced, rejectedKeys };
}

/**
 * Decide what restore should do with one remote document — the policy that keeps
 * a cloud restore from ever destroying data:
 *
 *  - `skip-have`  the remote etag already matches our synced baseline — we have
 *                 this exact version, nothing to do.
 *  - `apply`      adopt the remote copy. Always on a FRESH install (local state
 *                 is just defaults, so the backup must win); otherwise only when
 *                 the remote differs from our baseline AND we have no unsynced
 *                 local edit (i.e. another device changed it since we synced).
 *  - `skip-local` we hold an unsynced local edit for this doc (it's in the
 *                 outbox) — local wins; it will push up rather than be overwritten.
 *
 * `fresh` is sampled once at the start of restore (before any doc is applied),
 * so a backup that restores the profile doesn't flip the install to "not fresh"
 * mid-pass and start preserving the very defaults it's meant to replace.
 */
export function restoreDecision(
	pending: PendingMap,
	synced: SyncedMap,
	key: string,
	remoteEtag: string,
	fresh: boolean
): RestoreDecision {
	if (synced[key] === remoteEtag) return 'skip-have';
	if (fresh) return 'apply';
	if (pending[key]) return 'skip-local';
	return 'apply';
}
