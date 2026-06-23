import { browser } from '$app/environment';
import { trailAssistant } from '$lib/trailState.svelte';
import { syncStateForLocalWrite } from '$lib/sync-state';
import type { SyncState } from '$lib/types';
import {
	publishWaterReport,
	startWaterReportSync,
	type RemoteWaterReport
} from '$lib/waterReportSpacetime';

// Crowdsourced water-status reports (FarOut-style). The open water dataset has no
// real flow data, so each source shows "unverified" until a hiker reports what
// they actually found — flowing / low / dry. Reports are keyed by a 0.1-mile
// bucket (WaterReference has no stable id), kept latest-wins for display, and
// persisted to localStorage immediately. Architected to drop a SpacetimeDB sync
// in alongside the local write the same way Trail Pulse does (see #sync).

export type WaterStatus = 'flowing' | 'low' | 'dry';
export const WATER_STATUS_WORD: Record<WaterStatus, string> = {
	flowing: 'Flowing',
	low: 'Low',
	dry: 'Dry'
};

export interface WaterReport {
	id: string;
	bucket: number; // Math.round(mile * 10) — the 0.1-mi source key
	mile: number;
	sourceName: string;
	status: WaterStatus;
	reporterTrailName?: string; // empty → "you"
	observedAt: string; // ISO — what the popup ages against
	syncState: SyncState;
}

const STORE_KEY = 'hc-water-reports-v1';
const DISPLAY_WINDOW_MS = 7 * 24 * 3600 * 1000;

export function waterBucket(mile: number): number {
	return Math.round(mile * 10);
}

function loadReports(): WaterReport[] {
	if (!browser) return [];
	try {
		const raw = localStorage.getItem(STORE_KEY);
		const parsed = raw ? (JSON.parse(raw) as WaterReport[]) : [];
		return Array.isArray(parsed) ? parsed : [];
	} catch {
		return [];
	}
}

class WaterReportStore {
	#reports = $state<WaterReport[]>(loadReports());

	#persist() {
		if (!browser) return;
		try {
			localStorage.setItem(STORE_KEY, JSON.stringify(this.#reports));
		} catch {
			/* storage may be unavailable */
		}
	}

	get all(): WaterReport[] {
		return this.#reports;
	}

	/** Latest report for a 0.1-mi bucket within the 7-day display window, else null. */
	latestForBucket(bucket: number): WaterReport | null {
		const cutoff = Date.now() - DISPLAY_WINDOW_MS;
		let best: WaterReport | null = null;
		for (const r of this.#reports) {
			if (r.bucket !== bucket) continue;
			const t = new Date(r.observedAt).getTime();
			if (!Number.isFinite(t) || t < cutoff) continue;
			if (!best || t > new Date(best.observedAt).getTime()) best = r;
		}
		return best;
	}

	/** "you" for the device owner's own report, else the reporter's trail name. */
	attribution(rep: WaterReport): string {
		const self = trailAssistant.hikeProfile?.trailName?.trim();
		const name = rep.reporterTrailName?.trim();
		return !name || (self && name === self) ? 'you' : name;
	}

	report(input: { bucket: number; mile: number; status: WaterStatus; name: string }): WaterReport {
		const online = trailAssistant.onlineStatus;
		const report: WaterReport = {
			id: crypto.randomUUID(),
			bucket: input.bucket,
			mile: input.mile,
			sourceName: input.name,
			status: input.status,
			reporterTrailName: trailAssistant.hikeProfile?.trailName?.trim() || undefined,
			observedAt: new Date().toISOString(),
			syncState: syncStateForLocalWrite(online)
		};
		this.#reports = [report, ...this.#reports].slice(0, 500);
		this.#persist();
		if (online) void this.#sync(report);
		return report;
	}

	queuedReports(): WaterReport[] {
		return this.#reports.filter((r) => r.syncState === 'queued-offline');
	}

	/** Start receiving the tramily's reports from the shared DB (no-op until the
	 *  sync is configured + deployed). Idempotent; safe to call on map mount. */
	#syncStarted = false;
	startSync() {
		if (!browser || this.#syncStarted) return;
		this.#syncStarted = true;
		startWaterReportSync((remote) => this.#ingestRemote(remote));
		// Re-publish anything written while offline.
		for (const r of this.queuedReports()) void this.#sync(r);
	}

	// A report from another hiker (or our own, echoed back). Dedup by the source +
	// timestamp + reporter so an echo of our own write doesn't double up; display is
	// latest-wins, so newer reports naturally supersede.
	#ingestRemote(remote: RemoteWaterReport) {
		const status = remote.status as WaterStatus;
		if (status !== 'flowing' && status !== 'low' && status !== 'dry') return;
		const bucket = waterBucket(remote.mile);
		const key = `${bucket}|${remote.observedAt}|${remote.reporterTrailName ?? ''}`;
		if (this.#reports.some((r) => `${r.bucket}|${r.observedAt}|${r.reporterTrailName ?? ''}` === key)) return;
		const report: WaterReport = {
			id: crypto.randomUUID(),
			bucket,
			mile: remote.mile,
			sourceName: remote.sourceName,
			status,
			reporterTrailName: remote.reporterTrailName,
			observedAt: remote.observedAt,
			syncState: 'synced'
		};
		this.#reports = [report, ...this.#reports].slice(0, 500);
		this.#persist();
	}

	// Publish to the shared DB, then mark the report synced or queued-offline.
	async #sync(report: WaterReport): Promise<void> {
		const result = await publishWaterReport({
			mile: report.mile,
			sourceName: report.sourceName,
			status: report.status,
			reporterTrailName: report.reporterTrailName,
			observedAt: report.observedAt
		}).catch(() => 'failed' as const);
		if (result === 'skipped') return; // sync not configured — keep the local state
		this.#setSyncState(report.id, result === 'synced' ? 'synced' : 'queued-offline');
		this.#persist();
	}

	#setSyncState(id: string, state: SyncState) {
		this.#reports = this.#reports.map((r) => (r.id === id ? { ...r, syncState: state } : r));
	}
}

export const waterReports = new WaterReportStore();

/** Relative age for display, computed at popup-build time (not a live clock). */
export function relAge(iso: string): string {
	const ms = Date.now() - new Date(iso).getTime();
	if (!Number.isFinite(ms) || ms < 60_000) return 'now';
	const m = Math.floor(ms / 60_000);
	if (m < 60) return `${m}m ago`;
	const h = Math.floor(m / 60);
	if (h < 24) return `${h}h ago`;
	const d = Math.floor(h / 24);
	return d < 7 ? `${d}d ago` : 'over a week ago';
}

/** Aging bucket → CSS class suffix on the state text (fresh/aging/stale). */
export function ageBucket(iso: string): 'fresh' | 'aging' | 'stale' {
	const h = (Date.now() - new Date(iso).getTime()) / 3_600_000;
	if (h < 2) return 'fresh';
	if (h < 12) return 'aging';
	return 'stale';
}
