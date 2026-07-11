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

function recordOrEmpty(value: unknown): Record<string, unknown> {
	return isRecord(value) ? value : {};
}

function booleanOr(value: unknown, fallback: boolean): boolean {
	return typeof value === 'boolean' ? value : fallback;
}

function stringOr(value: unknown, fallback: string): string {
	return typeof value === 'string' ? value : fallback;
}

function finiteNumberOr(value: unknown, fallback: number): number {
	return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function arrayOr<T>(value: unknown, fallback: T[]): T[] {
	return Array.isArray(value) ? (value as T[]) : [...fallback];
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

	const privacy = recordOrEmpty(persisted.privacySettings);
	state.privacySettings = {
		stealthMode: booleanOr(privacy.stealthMode, defaultState.privacySettings.stealthMode),
		sharePreciseLocation: booleanOr(
			privacy.sharePreciseLocation,
			defaultState.privacySettings.sharePreciseLocation
		),
		allowCoachInsights: booleanOr(
			privacy.allowCoachInsights,
			defaultState.privacySettings.allowCoachInsights
		),
		visibleToSupportCircle: booleanOr(
			privacy.visibleToSupportCircle,
			defaultState.privacySettings.visibleToSupportCircle
		)
	};

	const trail = recordOrEmpty(persisted.trailSettings);
	state.trailSettings = {
		autoLogMileage: booleanOr(trail.autoLogMileage, defaultState.trailSettings.autoLogMileage),
		waterAlerts: booleanOr(trail.waterAlerts, defaultState.trailSettings.waterAlerts),
		batterySaver: booleanOr(trail.batterySaver, defaultState.trailSettings.batterySaver),
		lowSignalMode: booleanOr(trail.lowSignalMode, defaultState.trailSettings.lowSignalMode),
		offlineRegion: stringOr(trail.offlineRegion, defaultState.trailSettings.offlineRegion)
	};

	const trailLog = recordOrEmpty(persisted.trailLogSettings);
	state.trailLogSettings = {
		autoPublish: booleanOr(trailLog.autoPublish, defaultState.trailLogSettings.autoPublish),
		footCareLogged: booleanOr(
			trailLog.footCareLogged,
			defaultState.trailLogSettings.footCareLogged
		),
		caloriesLogged: booleanOr(
			trailLog.caloriesLogged,
			defaultState.trailLogSettings.caloriesLogged
		),
		waterCarryChecked: booleanOr(
			trailLog.waterCarryChecked,
			defaultState.trailLogSettings.waterCarryChecked
		),
		stretchingDone: booleanOr(
			trailLog.stretchingDone,
			defaultState.trailLogSettings.stretchingDone
		)
	};

	state.coachMessages = arrayOr(persisted.coachMessages, defaultState.coachMessages);
	state.checkInHistory = arrayOr(persisted.checkInHistory, defaultState.checkInHistory);
	state.personalLoadout = arrayOr(persisted.personalLoadout, defaultState.personalLoadout);
	state.trailPulseReports = arrayOr(persisted.trailPulseReports, defaultState.trailPulseReports);
	state.seenTrailPulseReportIds = arrayOr(
		persisted.seenTrailPulseReportIds,
		defaultState.seenTrailPulseReportIds
	);
	state.supportCircle = arrayOr(persisted.supportCircle, defaultState.supportCircle);
	state.lastCheckIn = isRecord(persisted.lastCheckIn)
		? state.lastCheckIn
		: { ...defaultState.lastCheckIn };
	state.currentMile = finiteNumberOr(persisted.currentMile, defaultState.currentMile);
	state.dayNumber = finiteNumberOr(persisted.dayNumber, defaultState.dayNumber);

	const hikeProfile = isRecord(persisted.hikeProfile) ? persisted.hikeProfile : null;
	if (!hikeProfile || (hikeProfile.mode !== 'self' && hikeProfile.mode !== 'dad-pilot')) {
		state = resetToUncalibratedStarterState(state);
	} else {
		state.hikeProfile = {
			...defaultState.hikeProfile,
			...hikeProfile,
			mode: hikeProfile.mode,
			calibrated: booleanOr(hikeProfile.calibrated, false),
			direction: hikeProfile.direction === 'SOBO' ? 'SOBO' : 'NOBO',
			currentMile: finiteNumberOr(hikeProfile.currentMile, state.currentMile),
			mileSource:
				hikeProfile.mileSource === 'onboarding' ||
				hikeProfile.mileSource === 'check-in' ||
				hikeProfile.mileSource === 'gps' ||
				hikeProfile.mileSource === 'manual' ||
				hikeProfile.mileSource === 'pilot'
					? hikeProfile.mileSource
					: defaultState.hikeProfile.mileSource,
			updatedAt: stringOr(hikeProfile.updatedAt, defaultState.hikeProfile.updatedAt)
		};
	}
	state.documents = normalizeTrailDocuments(
		arrayOr(persisted.documents, defaultState.documents)
	);

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
