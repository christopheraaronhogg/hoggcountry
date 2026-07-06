import type { ApiError } from './api.ts';
import type { PersistenceAdapter } from '../mobile-persistence.ts';
import {
	docKey,
	etagOf,
	makeDelete,
	makeUpsert,
	parsePoisonIndexes,
	reconcilePush,
	restoreDecision,
	shouldEnqueueUpsert,
	toPushChanges,
	type OutboxEntry,
	type PendingMap,
	type PushApplied,
	type PushRejected,
	type RemoteDoc,
	type RestoreDecision,
	type SyncedMap
} from './sync-outbox.ts';

// Phase 1 of the cloud-backup plan (docs/plans/2026-06-23-cloud-backup-sync.md):
// the offline-first BACKUP engine. Every store decomposes its durable state into
// small per-entity documents and calls enqueue(); this engine coalesces them into
// an outbox (persisted on-device, so a crash never loses a queued change) and
// drains it to the Laravel /sync/push API — document-level last-write-wins — only
// when the hiker is signed in AND online. Signed-out or offline, writes just pile
// up locally and back up the moment a connection + account exist. The app never
// blocks on the network; backup is a background consequence of normal use. The
// pure change-detection/reconciliation logic lives in (and is tested via)
// sync-outbox.ts; this file is the reactive + I/O wrapper.

/** What the UI shows for the backup state. */
export type BackupStatus =
	| 'signed-out' // backup is off (opt-in); nothing is sent
	| 'restoring' // pulling the cloud copy down on sign-in (new phone / fresh install)
	| 'idle' // signed in, everything backed up
	| 'backing-up' // a push is in flight
	| 'offline' // signed in but no connection; queued locally
	| 'error'; // a push failed for a non-network reason; will retry

/** A restore pass hands each backed-up document to this callback to apply it to
 *  the right local store; it returns whether the document was applied. Kept
 *  synchronous so the whole apply loop runs in one tick — the stores' persistence
 *  effects then flush ONCE over fully-restored state, never mid-restore. */
export type RestoreApply = (doc: RemoteDoc, fresh: boolean) => boolean;

/** Supplied by the store-aware orchestrator so the engine can run the restore
 *  loop while staying ignorant of the individual stores. */
export interface RestoreProvider {
	apply: RestoreApply;
	/** Whether local state is just defaults (a fresh/lost-phone install). Sampled
	 *  once at the start of a restore pass. */
	isFresh: () => boolean;
}

const STORE_KEY = 'hc-sync-outbox-v1';
const SCHEMA_VERSION = 1;
const PUSH_BATCH = 200; // server accepts up to 250 changes/push
const DRAIN_DEBOUNCE_MS = 1200;
const RETRY_MS = 20_000;
const HEARTBEAT_MS = 60_000;

interface PersistedOutbox {
	pending: PendingMap;
	quarantined?: PendingMap;
	synced: SyncedMap;
	lastBackupAt: string | null;
	cursor: string;
}

export interface SyncEngineDeps {
	browser: boolean;
	api: <T>(
		path: string,
		options?: { method?: string; token?: string | null; body?: unknown }
	) => Promise<T>;
	auth: {
		readonly status: 'unknown' | 'signed-out' | 'signed-in';
		readonly signedIn: boolean;
		readonly token: string | null;
		deviceId(): Promise<string>;
		ensureDeviceRegistered(): Promise<void>;
		revalidate(): Promise<void>;
	};
	storage: PersistenceAdapter | null;
	isOnline: () => boolean;
	now: () => string;
}

export class SyncEngine {
	// Reactive surface for the UI (Account "Cloud backup" card).
	status = $state<BackupStatus>('signed-out');
	lastBackupAt = $state<string | null>(null);
	#pending = $state<PendingMap>({});
	#quarantined = $state<PendingMap>({});

	#synced: SyncedMap = {};
	#cursor = '0'; // highest change seq we've reconciled (for future incremental pulls)
	#batchLimit = PUSH_BATCH;
	#storage: PersistenceAdapter | null;
	#restore: RestoreProvider | null = null;
	#started = false;
	#hydrated = false;
	#resolveHydrated!: () => void;
	#hydratedDone = new Promise<void>((resolve) => {
		this.#resolveHydrated = resolve;
	});
	#draining = false;
	#restoring = false;
	#ensuring = false;
	// The critical safety gate: while signed in, NO push is allowed until a
	// bootstrap pull has actually SUCCEEDED this session. Without it, a new phone
	// whose restore pull fails transiently would push its default state up and the
	// server's last-write-wins (defaults stamped now() beat the real older backup)
	// would overwrite — and destroy — the cloud backup. Reset on sign-out.
	#restoreOk = false;
	// Bumped on every auth transition. An in-flight restore captures the epoch and
	// re-checks it after each await; if it changed (sign-out, or relogin as another
	// account while a bootstrap was in flight), the pull is DISCARDED — its docs are
	// never applied and #restoreOk is never set — so one account's data can't land
	// on a signed-out device or another account.
	#authEpoch = 0;
	#drainTimer: ReturnType<typeof setTimeout> | null = null;
	#persistTimer: ReturnType<typeof setTimeout> | null = null;
	#deps: SyncEngineDeps;

	constructor(deps: SyncEngineDeps) {
		this.#deps = deps;
		this.#storage = deps.storage;
	}

	/** Number of changes waiting to back up (0 once everything is synced). */
	get pendingCount(): number {
		return Object.keys(this.#pending).length;
	}

	get quarantinedCount(): number {
		return Object.keys(this.#quarantined).length;
	}

	/**
	 * Record the latest durable state of one document. Cheap and synchronous:
	 * fingerprints the content and skips entirely if it already matches what's
	 * backed up (or already queued), so callers can fire this on every state
	 * change without worry. Safe to call before start() — the entry persists and
	 * drains once the engine is running and an account exists.
	 */
	enqueue(docType: string, docId: string, content: unknown): void {
		if (!this.#deps.browser) return;
		const key = docKey(docType, docId);
		const etag = etagOf(content);
		if (!shouldEnqueueUpsert(this.#pending, this.#synced, key, etag)) return;
		this.#queue(key, makeUpsert(docType, docId, content, this.#deps.now()));
	}

	/** Queue a backup-side deletion (tombstone) for a document. */
	remove(docType: string, docId: string): void {
		if (!this.#deps.browser) return;
		const key = docKey(docType, docId);
		if (this.#synced[key] === undefined && this.#pending[key] === undefined) return;
		this.#queue(key, makeDelete(docType, docId, this.#deps.now()));
	}

	#queue(key: string, entry: OutboxEntry): void {
		this.#pending = { ...this.#pending, [key]: entry };
		this.#persistSoon();
		this.#scheduleDrain();
	}

	#quarantine(keys: string[], reason: string): boolean {
		const nextPending = { ...this.#pending };
		const nextQuarantined = { ...this.#quarantined };
		let moved = false;

		for (const key of keys) {
			const entry = nextPending[key];
			if (!entry) continue;
			nextQuarantined[key] = entry;
			delete nextPending[key];
			moved = true;
			console.error(`Backup change quarantined for ${key}: ${reason}`);
		}

		if (!moved) return false;
		this.#pending = nextPending;
		this.#quarantined = nextQuarantined;
		this.#persistNow();
		return true;
	}

	/** Register the store-aware restore applier (called once at boot, before start). */
	setRestoreProvider(provider: RestoreProvider): void {
		this.#restore = provider;
	}

	/** Wire boot-time triggers (online/visibility/auth) and run a first drain. Idempotent. */
	start(): void {
		if (!this.#deps.browser || this.#started) return;
		this.#started = true;

		void this.#hydrate();

		window.addEventListener('online', () => this.#scheduleDrain(0));
		document.addEventListener('visibilitychange', () => {
			if (document.visibilityState === 'visible') this.#scheduleDrain(0);
		});
		// A slow heartbeat picks up anything a missed event left behind.
		setInterval(() => this.#scheduleDrain(0), HEARTBEAT_MS);

		// On sign-in, restore the cloud copy FIRST (new-phone case), then drain what's
		// queued; reflect sign-out immediately. Restoring-before-draining is critical:
		// it stops a fresh install from pushing its default state up and clobbering the
		// real backup before pulling it down.
		$effect.root(() => {
			$effect(() => {
				// Keep this in lockstep with notifyAuthChangedForTest().
				const authed = this.#deps.auth.status;
				// Any auth transition invalidates an in-flight restore (see #authEpoch).
				this.#authEpoch++;
				if (authed === 'signed-in') {
					void this.#ensureRestoredThenDrain();
				} else if (authed === 'signed-out') {
					this.#restoreOk = false;
					this.status = 'signed-out';
				}
			});
		});
	}

	async flushForTest(): Promise<void> {
		await this.#ensureRestoredThenDrain();
		await this.#drain();
	}

	notifyAuthChangedForTest(): void {
		// Keep this in lockstep with the $effect body in start().
		const authed = this.#deps.auth.status;
		// Any auth transition invalidates an in-flight restore (see #authEpoch).
		this.#authEpoch++;
		if (authed === 'signed-in') {
			void this.#ensureRestoredThenDrain();
		} else if (authed === 'signed-out') {
			this.#restoreOk = false;
			this.status = 'signed-out';
		}
	}

	whenHydratedForTest(): Promise<void> {
		return this.#hydratedDone;
	}

	async hydrateForTest(): Promise<void> {
		await this.#hydrate();
	}

	stopForTest(): void {
		if (this.#drainTimer) {
			clearTimeout(this.#drainTimer);
			this.#drainTimer = null;
		}
		if (this.#persistTimer) {
			clearTimeout(this.#persistTimer);
			this.#persistTimer = null;
		}
	}

	/**
	 * Guarantee a successful restore precedes the first push of a signed-in
	 * session, then drain. This is the gate that protects the backup: if the
	 * bootstrap pull can't run or fails (offline, transient 5xx), it does NOT fall
	 * through to a drain — a drain while {@link #restoreOk} is false would push
	 * local defaults and the server's last-write-wins would overwrite the real
	 * backup. Instead it leaves the queue intact and retries on the next trigger.
	 */
	async #ensureRestoredThenDrain(): Promise<void> {
		if (this.#restoreOk) {
			this.#scheduleDrain(0);
			return;
		}
		if (this.#restoring || this.#ensuring) return;
		this.#ensuring = true;
		const epoch = this.#authEpoch; // the session this restore belongs to
		try {
			await this.#hydratedDone; // never restore over an un-hydrated outbox
			if (epoch !== this.#authEpoch) {
				this.#scheduleDrain(0); // auth changed — let the new session re-evaluate
				return;
			}
			if (!this.#deps.auth.signedIn) {
				this.status = 'signed-out';
				return;
			}
			if (!this.#deps.browser || !this.#deps.isOnline() || !this.#restore) {
				// Can't safely restore yet — wait for the online/visibility trigger.
				// Critically, do NOT drain here.
				this.status = this.pendingCount ? 'offline' : 'idle';
				return;
			}
			this.#restoring = true;
			this.status = 'restoring';
			let ok = false;
			try {
				ok = await this.#runRestore(epoch);
			} catch (error) {
				console.error('Cloud restore failed', error);
			} finally {
				this.#restoring = false;
			}
			if (epoch !== this.#authEpoch) {
				// Signed out / switched accounts during the restore — discard the
				// result (docs were not applied) and let the new session re-evaluate.
				this.#scheduleDrain(0);
				return;
			}
			this.#restoreOk = ok;
			if (!ok) this.status = 'error'; // a failed pull retries; don't sit on "restoring"
			// On success, drain immediately; on failure, back off and retry restore
			// (never a straight drain, which could push defaults).
			this.#scheduleDrain(ok ? 0 : RETRY_MS);
		} finally {
			this.#ensuring = false;
		}
	}

	/**
	 * Pull the account's backed-up documents and hand each to the registered
	 * applier under the last-write-wins restore policy. `fresh` is sampled once
	 * up front so applying the profile mid-pass can't flip the decision. The apply
	 * loop is fully synchronous, so the stores' persistence effects flush once
	 * afterward over fully-restored state — and because every applied doc's etag is
	 * adopted as the synced baseline, that flush re-enqueues nothing. Returns
	 * whether a bootstrap response was actually received (the success signal that
	 * unlocks pushing).
	 */
	async #runRestore(epoch: number): Promise<boolean> {
		if (!this.#deps.browser || !this.#restore || !this.#deps.auth.signedIn || !this.#deps.isOnline()) return false;
		const bootstrap = await this.#fetchBootstrap();
		if (!bootstrap) return false;
		// The pull was authenticated with the session's token; if that session ended
		// (sign-out) or changed (relogin) while it was in flight, DISCARD it — applying
		// another account's docs onto a signed-out/other-account device is data loss.
		if (epoch !== this.#authEpoch || !this.#deps.auth.signedIn) return false;

		const fresh = this.#restore.isFresh();
		for (const doc of bootstrap.docs) {
			if (doc.op === 'delete') continue;
			const key = docKey(doc.doc_type, doc.doc_id);
			const decision: RestoreDecision = restoreDecision(
				this.#pending,
				this.#synced,
				key,
				doc.etag,
				fresh
			);
			if (decision !== 'apply') continue;
			let applied = false;
			try {
				applied = this.#restore.apply(doc, fresh);
			} catch (error) {
				console.error(`Restore failed to apply ${key}`, error);
			}
			if (applied) this.#adoptRemote(doc.doc_type, doc.doc_id, doc.etag);
		}
		if (bootstrap.cursor) this.#cursor = bootstrap.cursor;
		this.#persistNow();
		return true;
	}

	async #fetchBootstrap(): Promise<{ docs: RemoteDoc[]; cursor: string } | null> {
		try {
			return await this.#deps.api<{ docs: RemoteDoc[]; cursor: string }>('/sync/bootstrap', {
				token: this.#deps.auth.token
			});
		} catch (error) {
			const err = error as ApiError;
			// Offline or a dead token → no restore this pass; the backup is untouched.
			if (err?.status === 401) void this.#deps.auth.revalidate();
			if (err?.status !== 0 && err?.code !== 'offline' && err?.status !== 401) {
				console.error('Bootstrap pull failed', error);
			}
			return null;
		}
	}

	/**
	 * Mark a document as restored: its content is now the synced baseline, and any
	 * queued copy (e.g. the default enqueued at boot) is dropped so the restored
	 * value is never overwritten by a stale local push.
	 */
	#adoptRemote(docType: string, docId: string, etag: string): void {
		const key = docKey(docType, docId);
		this.#synced[key] = etag;
		if (this.#pending[key]) {
			const next = { ...this.#pending };
			delete next[key];
			this.#pending = next;
		}
	}

	async #hydrate(): Promise<void> {
		try {
			const raw = await this.#storage?.get(STORE_KEY);
			if (raw) {
				const parsed = JSON.parse(raw) as Partial<PersistedOutbox>;
				this.#pending = parsed.pending ?? {};
				this.#quarantined = parsed.quarantined ?? {};
				this.#synced = parsed.synced ?? {};
				this.lastBackupAt = parsed.lastBackupAt ?? null;
				this.#cursor = parsed.cursor ?? '0';
			}
		} catch (error) {
			console.error('Failed to restore sync outbox', error);
		} finally {
			this.#hydrated = true;
			this.#resolveHydrated();
			this.#scheduleDrain(0);
		}
	}

	#scheduleDrain(delay = DRAIN_DEBOUNCE_MS): void {
		if (!this.#deps.browser) return;
		if (this.#drainTimer) clearTimeout(this.#drainTimer);
		this.#drainTimer = setTimeout(() => {
			this.#drainTimer = null;
			void this.#drain();
		}, delay);
	}

	async #drain(): Promise<void> {
		if (!this.#deps.browser || this.#draining || this.#restoring || !this.#hydrated) return;
		if (!this.#deps.auth.signedIn) {
			this.status = 'signed-out';
			return;
		}
		if (!this.#deps.isOnline()) {
			this.status = this.pendingCount ? 'offline' : 'idle';
			return;
		}
		// Never push until a bootstrap restore has succeeded this session — route
		// through restore first so a fresh install can't overwrite the cloud backup
		// with its defaults (the new-phone + transient-failure / reconnect cases).
		if (!this.#restoreOk) {
			void this.#ensureRestoredThenDrain();
			return;
		}
		const keys = Object.keys(this.#pending);
		if (!keys.length) {
			this.status = 'idle';
			return;
		}
		const batchKeys = keys.slice(0, this.#batchLimit);

		this.#draining = true;
		this.status = 'backing-up';
		try {
			const token = this.#deps.auth.token;
			const deviceId = await this.#deps.auth.deviceId();
			const changes = toPushChanges(
				batchKeys.map((k) => this.#pending[k]),
				SCHEMA_VERSION
			);

			const result = await this.#deps.api<{ applied: PushApplied[]; rejected: PushRejected[] }>(
				'/sync/push',
				{ method: 'POST', token, body: { device_id: deviceId, changes } }
			);

			const reconciled = reconcilePush(
				this.#pending,
				this.#synced,
				result.applied ?? [],
				result.rejected ?? []
			);
			this.#pending = reconciled.pending;
			this.#synced = reconciled.synced;
			this.#batchLimit = PUSH_BATCH;
			const appliedKeys = (result.applied ?? []).map((applied) => docKey(applied.doc_type, applied.doc_id));
			if (appliedKeys.some((key) => this.#quarantined[key])) {
				const nextQuarantined = { ...this.#quarantined };
				for (const key of appliedKeys) delete nextQuarantined[key];
				this.#quarantined = nextQuarantined;
			}
			// Only claim a backup happened if the server actually accepted something —
			// an all-rejected push must not show "Backed up · just now".
			if ((result.applied?.length ?? 0) > 0) this.lastBackupAt = this.#deps.now();
			this.#persistNow();

			if (reconciled.rejectedKeys.length) {
				for (const key of reconciled.rejectedKeys) {
					console.warn(`Backup superseded by a newer cloud copy for ${key}; re-pulling to converge.`);
				}
				// A reject means another device's copy is newer. Re-run restore so we
				// pull and apply its content (local converges to the server) before
				// pushing anything else.
				this.#restoreOk = false;
				this.#scheduleDrain(0);
			} else if (this.pendingCount > 0) {
				this.status = 'backing-up';
				this.#scheduleDrain(0); // more batches to send
			} else {
				this.status = 'idle';
			}
		} catch (error) {
			const err = error as ApiError;
			if (err?.code === 'unknown_device') {
				// The device row was lost (or never bound). Re-register, then retry.
				await this.#deps.auth.ensureDeviceRegistered();
				this.status = 'error';
				this.#scheduleDrain(RETRY_MS);
			} else if (err?.status === 0 || err?.code === 'offline') {
				this.status = 'offline';
			} else if (err?.status === 401) {
				// Auth owns confirming whether the token is dead and flipping the UI
				// to signed-out. Until then, backup is paused and will retry later.
				this.status = 'error';
				void this.#deps.auth.revalidate();
			} else if (err?.status === 422) {
				// A single malformed outbox doc can make Laravel reject the whole batch;
				// isolate it so it cannot wedge every later backup on a hiker's phone.
				const badIndexes = parsePoisonIndexes(err?.details, err?.message);
				let progress = false;
				if (badIndexes.length) {
					const badKeys = badIndexes
						.map((i) => batchKeys[i])
						.filter((key): key is string => typeof key === 'string');
					progress = this.#quarantine(
						badKeys,
						'rejected by server validation'
					);
					this.#batchLimit = PUSH_BATCH;
				} else if (this.#batchLimit === 1) {
					const badKey = batchKeys[0];
					if (badKey) progress = this.#quarantine([badKey], 'single-item push rejected by server');
					this.#batchLimit = PUSH_BATCH;
				} else {
					const nextBatchLimit = Math.max(1, Math.floor(this.#batchLimit / 2));
					progress = nextBatchLimit < this.#batchLimit;
					this.#batchLimit = nextBatchLimit;
				}
				this.status = 'error';
				this.#scheduleDrain(progress ? 0 : RETRY_MS);
			} else {
				console.error('Backup push failed', error);
				this.status = 'error';
				this.#scheduleDrain(RETRY_MS);
			}
		} finally {
			this.#draining = false;
		}
	}

	#snapshot(): string {
		return JSON.stringify({
			pending: this.#pending,
			quarantined: this.#quarantined,
			synced: this.#synced,
			lastBackupAt: this.lastBackupAt,
			cursor: this.#cursor
		} satisfies PersistedOutbox);
	}

	#persistSoon(): void {
		if (!this.#storage) return;
		if (this.#persistTimer) clearTimeout(this.#persistTimer);
		this.#persistTimer = setTimeout(() => {
			this.#persistTimer = null;
			this.#persistNow();
		}, 400);
	}

	#persistNow(): void {
		if (!this.#storage) return;
		if (this.#persistTimer) {
			clearTimeout(this.#persistTimer);
			this.#persistTimer = null;
		}
		void this.#storage.set(STORE_KEY, this.#snapshot()).catch((error) => {
			console.error('Failed to persist sync outbox', error);
		});
	}
}
