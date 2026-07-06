import { migrateTab } from './types.ts';
import type { TrailState } from './types.ts';
import {
	createDefaultTrailState,
	resetToUncalibratedStarterState
} from './trail-state-defaults.ts';
import { normalizeTrailDocuments } from './local-documents.ts';

export type PersistedTrailState = TrailState;

export interface TrailStateQuarantineRecord {
	savedAt: string;
	reason: string;
	raw: string;
	dismissed: boolean;
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null;
}

function isQuarantineRecord(value: unknown): value is TrailStateQuarantineRecord {
	return (
		isRecord(value) &&
		typeof value.savedAt === 'string' &&
		typeof value.reason === 'string' &&
		typeof value.raw === 'string' &&
		typeof value.dismissed === 'boolean'
	);
}

export function restorePersistedTrailState(
	value: unknown,
	defaultState: TrailState = createDefaultTrailState()
): TrailState {
	// Quarantine the untrusted JSON boundary here; callers only receive a repaired
	// TrailState with legacy IA/profile/document holes normalized below.
	const persisted = isRecord(value) ? (value as Partial<TrailState>) : {};
	let state: TrailState = {
		...defaultState,
		...persisted,
		activeTab: migrateTab(persisted.activeTab ?? defaultState.activeTab)
	};

	if (!state.hikeProfile?.mode) {
		state = resetToUncalibratedStarterState(state);
	}
	if (!Array.isArray(state.documents)) {
		state.documents = [];
	} else {
		state.documents = normalizeTrailDocuments(state.documents);
	}
	if (!Array.isArray(state.personalLoadout)) {
		state.personalLoadout = [];
	}

	return state;
}

export function parsePersistedTrailState(raw: string): TrailState {
	return restorePersistedTrailState(JSON.parse(raw));
}

export function parseQuarantineRecord(value: string | null): TrailStateQuarantineRecord | null {
	if (!value) return null;

	try {
		const parsed = JSON.parse(value);
		return isQuarantineRecord(parsed)
			? {
					savedAt: parsed.savedAt,
					reason: parsed.reason,
					raw: parsed.raw,
					dismissed: parsed.dismissed
				}
			: null;
	} catch {
		return null;
	}
}

export function quarantineRecord(
	raw: string,
	reason: string,
	existing: string | null,
	nowIso: string
): string | null {
	if (parseQuarantineRecord(existing)) return null;

	const record: TrailStateQuarantineRecord = {
		savedAt: nowIso,
		reason,
		raw,
		dismissed: false
	};
	return JSON.stringify(record);
}

export function dismissedQuarantineRecord(record: TrailStateQuarantineRecord): string {
	return JSON.stringify({ ...record, dismissed: true });
}

export function snapshotTrailState(state: TrailState): PersistedTrailState {
	return {
		activeTab: state.activeTab,
		hikeProfile: { ...state.hikeProfile },
		coachMessages: state.coachMessages.map((message) => ({ ...message })),
		lastCheckIn: { ...state.lastCheckIn },
		checkInHistory: state.checkInHistory.map((record) => ({ ...record })),
		documents: state.documents.map((document) => ({
			...document,
			revisions: document.revisions.map((revision) => ({ ...revision }))
		})),
		personalLoadout: state.personalLoadout.map((item) => ({ ...item })),
		trailPulseReports: state.trailPulseReports.map((report) => ({ ...report })),
		seenTrailPulseReportIds: [...state.seenTrailPulseReportIds],
		privacySettings: { ...state.privacySettings },
		trailSettings: { ...state.trailSettings },
		trailLogSettings: { ...state.trailLogSettings },
		onlineStatus: state.onlineStatus,
		syncState: state.syncState,
		currentMile: state.currentMile,
		dayNumber: state.dayNumber,
		nextCheckInDueAt: state.nextCheckInDueAt,
		supportCircle: state.supportCircle.map((contact) => ({ ...contact })),
		lastSyncAt: state.lastSyncAt
	};
}
