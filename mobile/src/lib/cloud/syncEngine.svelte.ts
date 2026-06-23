import { browser } from '$app/environment';
import { apiRequest, type ApiError } from './api';
import { cloudAuth } from './auth.svelte';
import { createMobilePersistenceAdapter, type PersistenceAdapter } from '../mobile-persistence';
import {
	docKey,
	etagOf,
	makeDelete,
	makeUpsert,
	reconcilePush,
	shouldEnqueueUpsert,
	toPushChanges,
	type OutboxEntry,
	type PendingMap,
	type PushApplied,
	type PushRejected,
	type SyncedMap
} from './sync-outbox';

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
	| 'idle' // signed in, everything backed up
	| 'backing-up' // a push is in flight
	| 'offline' // signed in but no connection; queued locally
	| 'error'; // a push failed for a non-network reason; will retry

const STORE_KEY = 'hc-sync-outbox-v1';
const SCHEMA_VERSION = 1;
const PUSH_BATCH = 200; // server accepts up to 250 changes/push
const DRAIN_DEBOUNCE_MS = 1200;
const RETRY_MS = 20_000;
const HEARTBEAT_MS = 60_000;

function nowIso(): string {
	return new Date().toISOString();
}

interface PersistedOutbox {
	pending: PendingMap;
	synced: SyncedMap;
	lastBackupAt: string | null;
}

class SyncEngine {
	// Reactive surface for the UI (Account "Cloud backup" card).
	status = $state<BackupStatus>('signed-out');
	lastBackupAt = $state<string | null>(null);
	#pending = $state<PendingMap>({});

	#synced: SyncedMap = {};
	#storage: PersistenceAdapter | null = browser ? createMobilePersistenceAdapter() : null;
	#started = false;
	#hydrated = false;
	#draining = false;
	#drainTimer: ReturnType<typeof setTimeout> | null = null;
	#persistTimer: ReturnType<typeof setTimeout> | null = null;

	/** Number of changes waiting to back up (0 once everything is synced). */
	get pendingCount(): number {
		return Object.keys(this.#pending).length;
	}

	/**
	 * Record the latest durable state of one document. Cheap and synchronous:
	 * fingerprints the content and skips entirely if it already matches what's
	 * backed up (or already queued), so callers can fire this on every state
	 * change without worry. Safe to call before start() — the entry persists and
	 * drains once the engine is running and an account exists.
	 */
	enqueue(docType: string, docId: string, content: unknown): void {
		if (!browser) return;
		const key = docKey(docType, docId);
		const etag = etagOf(content);
		if (!shouldEnqueueUpsert(this.#pending, this.#synced, key, etag)) return;
		this.#queue(key, makeUpsert(docType, docId, content, nowIso()));
	}

	/** Queue a backup-side deletion (tombstone) for a document. */
	remove(docType: string, docId: string): void {
		if (!browser) return;
		const key = docKey(docType, docId);
		if (this.#synced[key] === undefined && this.#pending[key] === undefined) return;
		this.#queue(key, makeDelete(docType, docId, nowIso()));
	}

	#queue(key: string, entry: OutboxEntry): void {
		this.#pending = { ...this.#pending, [key]: entry };
		this.#persistSoon();
		this.#scheduleDrain();
	}

	/** Wire boot-time triggers (online/visibility/auth) and run a first drain. Idempotent. */
	start(): void {
		if (!browser || this.#started) return;
		this.#started = true;

		void this.#hydrate();

		window.addEventListener('online', () => this.#scheduleDrain(0));
		document.addEventListener('visibilitychange', () => {
			if (document.visibilityState === 'visible') this.#scheduleDrain(0);
		});
		// A slow heartbeat picks up anything a missed event left behind.
		setInterval(() => this.#scheduleDrain(0), HEARTBEAT_MS);

		// Drain whenever the account state flips to signed-in (the first sign-in
		// backs up everything already queued); reflect sign-out immediately.
		$effect.root(() => {
			$effect(() => {
				const authed = cloudAuth.status;
				if (authed === 'signed-in') {
					this.#scheduleDrain(0);
				} else if (authed === 'signed-out') {
					this.status = 'signed-out';
				}
			});
		});
	}

	async #hydrate(): Promise<void> {
		try {
			const raw = await this.#storage?.get(STORE_KEY);
			if (raw) {
				const parsed = JSON.parse(raw) as Partial<PersistedOutbox>;
				this.#pending = parsed.pending ?? {};
				this.#synced = parsed.synced ?? {};
				this.lastBackupAt = parsed.lastBackupAt ?? null;
			}
		} catch (error) {
			console.error('Failed to restore sync outbox', error);
		} finally {
			this.#hydrated = true;
			this.#scheduleDrain(0);
		}
	}

	#scheduleDrain(delay = DRAIN_DEBOUNCE_MS): void {
		if (!browser) return;
		if (this.#drainTimer) clearTimeout(this.#drainTimer);
		this.#drainTimer = setTimeout(() => {
			this.#drainTimer = null;
			void this.#drain();
		}, delay);
	}

	async #drain(): Promise<void> {
		if (!browser || this.#draining || !this.#hydrated) return;
		if (!cloudAuth.signedIn) {
			this.status = 'signed-out';
			return;
		}
		if (!navigator.onLine) {
			this.status = this.pendingCount ? 'offline' : 'idle';
			return;
		}
		const keys = Object.keys(this.#pending);
		if (!keys.length) {
			this.status = 'idle';
			return;
		}

		this.#draining = true;
		this.status = 'backing-up';
		try {
			const token = cloudAuth.token;
			const deviceId = await cloudAuth.deviceId();
			const batchKeys = keys.slice(0, PUSH_BATCH);
			const changes = toPushChanges(
				batchKeys.map((k) => this.#pending[k]),
				SCHEMA_VERSION
			);

			const result = await apiRequest<{ applied: PushApplied[]; rejected: PushRejected[] }>(
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
			for (const key of reconciled.rejectedKeys) {
				console.warn(`Backup superseded by a newer cloud copy for ${key}; server copy kept.`);
			}
			this.lastBackupAt = nowIso();
			this.#persistNow();

			if (this.pendingCount > 0) {
				this.status = 'backing-up';
				this.#scheduleDrain(0); // more batches to send
			} else {
				this.status = 'idle';
			}
		} catch (error) {
			const err = error as ApiError;
			if (err?.code === 'unknown_device') {
				// The device row was lost (or never bound). Re-register, then retry.
				await cloudAuth.ensureDeviceRegistered();
				this.status = 'error';
				this.#scheduleDrain(RETRY_MS);
			} else if (err?.status === 0 || err?.code === 'offline') {
				this.status = 'offline';
			} else if (err?.status === 401) {
				// Token died; auth.init/logout owns the sign-out, just pause backup.
				this.status = 'signed-out';
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
			synced: this.#synced,
			lastBackupAt: this.lastBackupAt
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

export const syncEngine = new SyncEngine();
