import { migrateTab } from './types.ts';
import type { TrailState } from './types.ts';
import {
	createDefaultTrailState,
	resetToUncalibratedStarterState
} from './trail-state-defaults.ts';

export type PersistedTrailState = TrailState;

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null;
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
	}
	if (!Array.isArray(state.personalLoadout)) {
		state.personalLoadout = [];
	}

	return state;
}

export function parsePersistedTrailState(raw: string): TrailState {
	return restorePersistedTrailState(JSON.parse(raw));
}

export function snapshotTrailState(state: TrailState): PersistedTrailState {
	return {
		activeTab: state.activeTab,
		hikeProfile: { ...state.hikeProfile },
		coachMessages: state.coachMessages.map((message) => ({ ...message })),
		lastCheckIn: { ...state.lastCheckIn },
		checkInHistory: state.checkInHistory.map((record) => ({ ...record })),
		documents: state.documents.map((document) => ({ ...document })),
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
