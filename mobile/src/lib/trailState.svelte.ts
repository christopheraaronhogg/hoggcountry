import { browser } from '$app/environment';

import { migrateTab } from './types';
import type {
	ChatMessage,
	CheckInRecord,
	CheckInStatus,
	HikeProfile,
	PrivacySettings,
	SupportContact,
	SyncState,
	Tab,
	TrailConditionReport,
	TrailDocument,
	TrailPulseChip,
	TrailPulseSource,
	TrailLogSettings,
	TrailSettings,
	TrailState
} from './types';
import { publishTrailPulseReport } from './trailPulseSpacetime';
import { resolveModelPolicy } from './scout/model-policy.ts';
import {
	createTrailDocument,
	limitTrailDocuments,
	toContextDocuments,
	updateTrailDocument
} from './local-documents';
import {
	buildFieldPackUrl,
	clampMile,
	deriveDayNumber,
	DEFAULT_HIKE_PROFILE,
	isDadPilotContextPack,
	isSelfTracked,
	parseMileFromCheckIn,
	parseMileFromText,
	resolvePosition,
	todayISODate,
	type HikeMode,
	type MileSource
} from './scout/hike-profile.ts';
import { cloneDefaultContextPack } from './scout/default-pack.ts';
import { loadTrailGeometry, snapToMile, type TrailGeoPoint } from './trail/trail-geometry';
import { createCapacitorPreferencesAdapter, createScoutRuntime, InMemoryContextPackStore } from './scout';
import type { OnDeviceGemmaProvider } from './scout';
import {
	createCapacitorGemmaBridge,
	createCapacitorModelManager,
	type ModelDownloadProgress,
	type NetworkStatus,
	type ScoutGemmaModelStatus,
	type ScoutModelManager
} from './scout/capacitor-gemma-bridge.ts';
import type { ContextPack, ContextPackStatus, ScoutAnswer, ScoutRuntime } from './scout';
import type { PersistenceAdapter } from './scout/context-pack-store.ts';
import type { OnDeviceGemmaBridge } from './scout/providers/on-device-gemma.ts';

const STORAGE_KEY = 'hoggcountry:trail-assistant:mobile-prototype:v1';
const TRAIL_PULSE_RANGE_MILES = 0.1;
const AUTO_GPS_MIN_INTERVAL_MS = 10 * 60 * 1000;
const AUTO_GPS_MIN_DELTA_MILES = 0.2;
const AUTO_GPS_FORCE_DELTA_MILES = 1;
const TRAIL_ID = 'appalachian-trail';
const FIELD_PACK_ENDPOINT =
	(import.meta.env.VITE_SCOUT_FIELD_PACK_URL as string | undefined) ??
	'https://hoggcountry.com/scout/field-pack';
const MODEL_POLICY = resolveModelPolicy(
	import.meta.env.VITE_SCOUT_MODEL_POLICY as string | undefined,
	Boolean(import.meta.env.DEV)
);
const REQUIRE_GEMMA = MODEL_POLICY === 'gemma4-only';

// Dad's NOBO start date (src/data/gear.json startDate). Used as the day-number
// basis when following the Dad pilot hike; a self-tracked hiker's own start date
// (HikeProfile.startDate) takes over once they calibrate.
const HIKE_START_DATE = '2026-02-01';

function isoHoursFromNow(hours: number): string {
	return new Date(Date.now() + hours * 60 * 60 * 1000).toISOString();
}

function makeMessage(role: ChatMessage['role'], content: string): ChatMessage {
	return {
		id: crypto.randomUUID(),
		role,
		content,
		timestamp: new Date().toISOString()
	};
}

function makeCheckIn(status: CheckInStatus, note: string, mile: number): CheckInRecord {
	return {
		id: crypto.randomUUID(),
		timestamp: new Date().toISOString(),
		location: `Mile ${mile.toFixed(1)}`,
		mile,
		status,
		note
	};
}

function makeTrailPulseReport(input: {
	source: TrailPulseSource;
	chipText?: TrailPulseChip;
	noteText: string;
	reporterTrailName?: string;
	snappedMile: number;
	observedAt?: string;
	syncState?: SyncState;
}): TrailConditionReport {
	const observedAt = input.observedAt ?? new Date().toISOString();

	return {
		id: crypto.randomUUID(),
		trailId: TRAIL_ID,
		source: input.source,
		chipText: input.chipText,
		noteText: input.noteText,
		reporterTrailName: input.reporterTrailName?.trim() || undefined,
		snappedMile: Number(input.snappedMile.toFixed(1)),
		observedAt,
		status: 'active',
		createdAt: observedAt,
		syncState: input.syncState ?? 'synced'
	};
}

let nativePreferencesAdapterPromise: Promise<PersistenceAdapter | null> | null = null;

function isNativeCapacitor(): boolean {
	const capacitorWindow = window as Window & {
		Capacitor?: { isNativePlatform?: () => boolean };
	};

	return capacitorWindow.Capacitor?.isNativePlatform?.() ?? false;
}

async function nativePreferencesAdapter(): Promise<PersistenceAdapter | null> {
	if (!isNativeCapacitor()) return null;
	nativePreferencesAdapterPromise ??= import('@capacitor/preferences')
		.then(({ Preferences }) => createCapacitorPreferencesAdapter(Preferences))
		.catch(() => null);
	return nativePreferencesAdapterPromise;
}

function browserStorageAdapter(): PersistenceAdapter {
	return {
		async get(key: string) {
			const nativeAdapter = await nativePreferencesAdapter();
			if (nativeAdapter) {
				const value = await nativeAdapter.get(key);
				if (value !== null) return value;
			}
			return localStorage.getItem(key);
		},
		async set(key: string, value: string) {
			const nativeAdapter = await nativePreferencesAdapter();
			if (nativeAdapter) {
				try {
					await nativeAdapter.set(key, value);
				} catch (error) {
					console.warn('Capacitor Preferences write failed; keeping localStorage mirror only.', error);
				}
			}
			localStorage.setItem(key, value);
		}
	};
}

function trailPulseDisplayText(report: TrailConditionReport): string {
	const base = report.noteText.trim() || report.chipText || 'Trail note';
	const trailName = report.reporterTrailName?.trim();

	return trailName ? `${base} -${trailName}` : base;
}

const defaultState: TrailState = {
	activeTab: 'Today',
	hikeProfile: { ...DEFAULT_HIKE_PROFILE },
	coachMessages: [
		makeMessage(
			'assistant',
			"I'm Scout — your on-device trail assistant. Ask me about water, shelters, town, or safety and I'll answer from your saved field pack. Mapped water stays low-confidence until you confirm it from a current source or in the field."
		)
	],
	lastCheckIn: {
		id: crypto.randomUUID(),
		timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
		location: 'Mile 0.0',
		mile: 0,
		status: 'safe',
		note: 'Starter position only. Set your AT mile before relying on trail-ahead context.'
	},
	checkInHistory: [],
	documents: [],
	// Trail Pulse starts empty — reports are crowd-sourced from real hikers, so the
	// panel shows its honest "no one has reported nearby" empty state until one
	// arrives. (No seeded/fabricated reports.)
	trailPulseReports: [],
	seenTrailPulseReportIds: [],
	privacySettings: {
		stealthMode: true,
		sharePreciseLocation: false,
		allowCoachInsights: false,
		visibleToSupportCircle: true
	},
	trailSettings: {
		autoLogMileage: true,
		waterAlerts: true,
		batterySaver: false,
		lowSignalMode: true,
		offlineRegion: 'Starter pack - set your AT mile'
	},
	trailLogSettings: {
		autoPublish: false,
		footCareLogged: true,
		caloriesLogged: true,
		waterCarryChecked: true,
		stretchingDone: false
	},
	onlineStatus: true,
	syncState: 'synced',
	currentMile: 0,
	dayNumber: 1,
	nextCheckInDueAt: isoHoursFromNow(4),
	// Support circle starts empty — these are the hiker's own emergency contacts,
	// added on-device. No seeded/fabricated names.
	supportCircle: [],
	lastSyncAt: new Date(Date.now() - 12 * 60 * 1000).toISOString()
};

type PersistedState = TrailState;

/** A write-action Scout proposes from chat, rendered as a confirm card. */
type ProposedAction = { id: string; title: string; detail: string; confirmLabel: string };
type ModelDownloadAutoStart =
	| 'none'
	| 'started'
	| 'downloading'
	| 'metered'
	| 'offline'
	| 'runtime-unavailable'
	| 'unavailable';

function formatModelSize(bytes: number | undefined): string {
	if (!bytes || bytes < 0) return 'about 2.6 GB';
	const gb = bytes / 1e9;
	return gb >= 1 ? `${gb.toFixed(1)} GB` : `${Math.round(bytes / 1e6)} MB`;
}

class TrailAssistantStore {
	#state = $state<TrailState>(defaultState);
	#syncTimer: ReturnType<typeof setTimeout> | null = null;
	#stateStorage: PersistenceAdapter | null = browser ? browserStorageAdapter() : null;
	#stateHydrated = $state(false);
	#fieldPackStore = new InMemoryContextPackStore({
		adapter: browser ? browserStorageAdapter() : undefined
	});
	#gemmaBridge: OnDeviceGemmaBridge | null = browser ? createCapacitorGemmaBridge() : null;
	#modelManager: ScoutModelManager | null = browser ? createCapacitorModelManager() : null;
	#scout: { runtime: ScoutRuntime; onDeviceProvider: OnDeviceGemmaProvider | undefined } = createScoutRuntime({
		store: this.#fieldPackStore,
		onDeviceBridge: this.#gemmaBridge ?? undefined,
		onDeviceTier: 'balanced'
	});
	#fieldPack = $state.raw<ContextPack>(this.#fieldPackStore.get());
	#fieldPackStatus = $state<ContextPackStatus>(this.#fieldPackStore.getStatus());
	#lastScoutAnswer = $state<ScoutAnswer | null>(null);
	#scoutAnswersByMessage = new Map<string, ScoutAnswer>();
	#modelStatus = $state<ScoutGemmaModelStatus | null>(null);
	#modelDownload = $state<{ bytesDownloaded: number; totalBytes: number } | null>(null);
	#modelError = $state<string | null>(null);
	// Set when a download was requested on a metered (cellular/hotspot) connection
	// and the user has not yet okayed the data cost. The UI shows a confirm; calling
	// downloadModel({ allowMetered: true }) clears it and proceeds.
	#meteredDownloadPrompt = $state<NetworkStatus | null>(null);
	// True while a Scout reply is being generated (on-device inference can take
	// many seconds), so the chat can show a "thinking" indicator instead of
	// looking frozen.
	#scoutThinking = $state(false);
	// A write-action Scout proposed from chat, awaiting explicit user confirm.
	// Scout NEVER mutates trail state without the user confirming this card —
	// the confirm-before-apply gate for "Do" tools.
	#pendingAction = $state<ProposedAction | null>(null);
	#pendingApply: (() => void) | null = null;
	// Real AT route geometry + USGS elevation (1-mi NOBO samples), fetched once
	// from static/. Powers the elevation profile and GPS→mile snapping. Empty
	// until loaded, so UI renders an honest empty state in the meantime.
	#trailGeo = $state.raw<TrailGeoPoint[]>([]);
	#gpsWatchId: number | null = null;
	#lastAutoGpsAt = 0;
	// True while the "My hike" calibration sheet is showing. Opened on first run
	// (when the profile isn't calibrated yet) or from Settings to re-edit.
	#hikeSetupOpen = $state(false);

	constructor() {
		if (!browser) return;

		this.#state.onlineStatus = navigator.onLine;
		this.#fieldPackStore.subscribe((pack) => {
			this.#fieldPack = pack;
			this.#applyPackToTrailState(pack);
		});
		this.#fieldPackStore.subscribeStatus((status) => {
			this.#fieldPackStatus = status;
		});
		void this.#bootstrap();
		void loadTrailGeometry()
			.then((points) => {
				this.#trailGeo = points;
				this.#reconcileAutoGpsWatch();
			})
			.catch((error) => {
				console.error('Failed to load trail geometry', error);
			});
		// Re-observe any model download that kept running in the background service
		// while the app was closed (also refreshes status, which may now be ready).
		void this.reconcileDownload();

		window.addEventListener('online', () => {
			this.#state.onlineStatus = true;
			if (this.#state.syncState === 'queued-offline') {
				const queuedReports = this.#state.trailPulseReports.filter((report) => report.syncState === 'queued-offline');
				this.#state.trailPulseReports = this.#state.trailPulseReports.map((report) =>
					report.syncState === 'queued-offline' ? { ...report, syncState: 'syncing' } : report
				);
				for (const report of queuedReports) {
					void this.#syncTrailPulseReport(report);
				}
				this.#finishSync('syncing');
			}
			void this.refreshFieldPack();
		});

		window.addEventListener('offline', () => {
			this.#state.onlineStatus = false;
			if (this.#state.syncState === 'syncing') {
				this.#state.syncState = 'queued-offline';
			}
		});

		$effect.root(() => {
			$effect(() => {
				const snapshot = this.#snapshot();
				if (!this.#stateHydrated) return;
				void this.#persistState(snapshot);
			});
		});
	}

	async #bootstrap() {
		await this.#hydrate();
		await this.#loadFieldPack();
	}

	async #hydrate() {
		const raw = await this.#stateStorage?.get(STORAGE_KEY).catch(() => null);
		if (!raw) {
			this.#stateHydrated = true;
			return;
		}

		try {
			const parsed = JSON.parse(raw) as PersistedState;
			this.#state = { ...defaultState, ...parsed };
			// Persisted activeTab may reference a tab that no longer exists after the
			// IA change (Plan/Town/Safety/You) — map it onto the new pillars.
			this.#state.activeTab = migrateTab(this.#state.activeTab);
			// State persisted before "My hike" calibration existed has no profile —
			// fall back to the uncalibrated default so first-run setup still appears.
			if (!this.#state.hikeProfile?.mode) {
				this.#state.hikeProfile = { ...DEFAULT_HIKE_PROFILE };
			}
			if (!Array.isArray(this.#state.documents)) {
				this.#state.documents = [];
			}
		} catch (error) {
			console.error('Failed to restore Trail Assistant state', error);
		} finally {
			this.#stateHydrated = true;
		}
	}

	async #persistState(snapshot: PersistedState) {
		if (!this.#stateStorage) return;
		try {
			await this.#stateStorage.set(STORAGE_KEY, JSON.stringify(snapshot));
		} catch (error) {
			console.error('Failed to persist Trail Assistant state', error);
		}
	}

	#shouldAutoGpsWatch(): boolean {
		return Boolean(
			browser &&
				navigator.geolocation &&
				this.#trailGeo.length > 0 &&
				this.#state.privacySettings.sharePreciseLocation &&
				this.#state.trailSettings.autoLogMileage
		);
	}

	#reconcileAutoGpsWatch() {
		if (!browser || !navigator.geolocation) return;
		if (!this.#shouldAutoGpsWatch()) {
			this.#stopAutoGpsWatch();
			return;
		}
		if (this.#gpsWatchId !== null) return;

		this.#gpsWatchId = navigator.geolocation.watchPosition(
			(position) => {
				void this.#adoptAutoGpsPosition(position);
			},
			() => {
				// Manual "Use GPS" still reports a human-facing reason. The background
				// watcher stays quiet because losing a fix on trail is normal.
			},
			{ enableHighAccuracy: false, maximumAge: 15 * 60_000, timeout: 10_000 }
		);
	}

	#stopAutoGpsWatch() {
		if (!browser || !navigator.geolocation || this.#gpsWatchId === null) return;
		navigator.geolocation.clearWatch(this.#gpsWatchId);
		this.#gpsWatchId = null;
	}

	async #adoptAutoGpsPosition(position: GeolocationPosition) {
		if (!this.#shouldAutoGpsWatch()) return;
		const mile = snapToMile(this.#trailGeo, position.coords.latitude, position.coords.longitude);
		if (mile === null) return;
		const clamped = clampMile(mile);
		const delta = Math.abs(clamped - this.#state.currentMile);
		if (delta < AUTO_GPS_MIN_DELTA_MILES) return;
		const now = Date.now();
		if (now - this.#lastAutoGpsAt < AUTO_GPS_MIN_INTERVAL_MS && delta < AUTO_GPS_FORCE_DELTA_MILES) return;
		this.#lastAutoGpsAt = now;
		await this.updateCurrentMile(clamped, 'gps');
	}

	#snapshot(): PersistedState {
		return {
			activeTab: this.#state.activeTab,
			hikeProfile: { ...this.#state.hikeProfile },
			coachMessages: [...this.#state.coachMessages],
			lastCheckIn: { ...this.#state.lastCheckIn },
			checkInHistory: [...this.#state.checkInHistory],
			documents: this.#state.documents.map((document) => ({ ...document })),
			trailPulseReports: [...this.#state.trailPulseReports],
			seenTrailPulseReportIds: [...this.#state.seenTrailPulseReportIds],
			privacySettings: { ...this.#state.privacySettings },
			trailSettings: { ...this.#state.trailSettings },
			trailLogSettings: { ...this.#state.trailLogSettings },
			onlineStatus: this.#state.onlineStatus,
			syncState: this.#state.syncState,
			currentMile: this.#state.currentMile,
			dayNumber: this.#state.dayNumber,
			nextCheckInDueAt: this.#state.nextCheckInDueAt,
			supportCircle: [...this.#state.supportCircle],
			lastSyncAt: this.#state.lastSyncAt
		};
	}

	async #loadFieldPack() {
		let pack = await this.#fieldPackStore.load();
		if (!this.#state.hikeProfile.calibrated) {
			this.#state.hikeProfile = { ...DEFAULT_HIKE_PROFILE };
			this.#resetUncalibratedStarterState();
			pack = cloneDefaultContextPack();
			await this.#fieldPackStore.replace(pack, 'bundled');
		}
		this.#fieldPack = pack;
		this.#fieldPackStatus = this.#fieldPackStore.getStatus();
		await this.#syncDocumentsToFieldPack();
		this.#applyPackToTrailState(pack);
		if (this.#state.onlineStatus && this.#state.hikeProfile.calibrated) {
			await this.refreshFieldPack();
		}
	}

	#applyPackToTrailState(pack: ContextPack) {
		// A self-tracked hiker OWNS their position — the pack only supplies reference
		// data (water/shelters/towns), so a remote refresh must NOT pull them back to
		// the pack's centered mile. Following the Dad pilot pack still reads position
		// from the pack as before.
		if (!isSelfTracked(this.#state.hikeProfile)) {
			const position = resolvePosition(this.#state.hikeProfile, pack, HIKE_START_DATE, new Date());
			this.#state.currentMile = position.currentMile;
			this.#state.dayNumber = position.dayNumber;
		}
		this.#state.trailSettings = {
			...this.#state.trailSettings,
			offlineRegion: pack.downloadedRegions[0] ?? this.#state.trailSettings.offlineRegion
		};
	}

	async #syncDocumentsToFieldPack() {
		await this.#fieldPackStore.updateDocuments(toContextDocuments(this.#state.documents));
		this.#fieldPack = this.#fieldPackStore.get();
		this.#fieldPackStatus = this.#fieldPackStore.getStatus();
	}

	#resetUncalibratedStarterState() {
		this.#state.currentMile = 0;
		this.#state.dayNumber = 1;
		this.#state.trailSettings = {
			...this.#state.trailSettings,
			offlineRegion: 'Starter pack - set your AT mile'
		};
		this.#state.lastCheckIn = {
			id: crypto.randomUUID(),
			timestamp: new Date().toISOString(),
			location: 'Mile 0.0',
			mile: 0,
			status: 'safe',
			note: 'Starter position only. Set your AT mile before relying on trail-ahead context.'
		};
		this.#state.checkInHistory = [];
	}

	#finishSync(nextState: SyncState) {
		if (this.#syncTimer) clearTimeout(this.#syncTimer);
		this.#state.syncState = nextState;

		this.#syncTimer = setTimeout(() => {
			this.#state.syncState = this.#state.onlineStatus ? 'synced' : 'queued-offline';
			this.#state.trailPulseReports = this.#state.trailPulseReports.map((report) =>
				report.syncState === 'syncing' ? { ...report, syncState: this.#state.syncState } : report
			);
			this.#state.lastSyncAt = new Date().toISOString();
		}, nextState === 'syncing' ? 1300 : 0);
	}

	/**
	 * Re-resolve the native Capacitor wiring if it wasn't ready when this store was
	 * first constructed. The store is a module-level singleton built at import time,
	 * which can race Capacitor's plugin injection — if it lost that race the bridge
	 * was null for the whole session and on-device Scout never engaged. Calling this
	 * before chat/model work lets a late-registered plugin self-heal: once the
	 * bridge resolves we rebuild the Scout runtime around it.
	 */
	#ensureNativeWiring(): void {
		if (!browser) return;
		if (!this.#modelManager) this.#modelManager = createCapacitorModelManager();
		if (this.#gemmaBridge) return;
		const bridge = createCapacitorGemmaBridge();
		if (!bridge) return;
		this.#gemmaBridge = bridge;
		this.#scout = createScoutRuntime({
			store: this.#fieldPackStore,
			onDeviceBridge: bridge,
			onDeviceTier: 'balanced'
		});
	}

	/**
	 * Eagerly initialize the on-device engine so the FIRST chat turn doesn't carry
	 * (or risk) the heavy, sometimes-flaky lazy LiteRT init — the root of the
	 * "asked a question, it answered offline" intermittency. Best-effort and silent.
	 */
	#warmUpModel(): void {
		this.#ensureNativeWiring();
		void this.#gemmaBridge?.warmUp?.();
	}

	async #gemmaReady(): Promise<boolean> {
		if (!REQUIRE_GEMMA) return true;
		this.#ensureNativeWiring();
		if (!this.#gemmaBridge) return false;
		return this.#gemmaBridge.isAvailable().catch(() => false);
	}

	async #startModelDownloadIfUseful(): Promise<ModelDownloadAutoStart> {
		this.#ensureNativeWiring();
		if (!this.#modelManager) return 'unavailable';
		if (this.#modelDownload) return 'downloading';

		const status = this.#modelStatus ?? (await this.refreshModelStatus());
		if (!status || status.state === 'ready') return 'none';
		if (status.runtimeConfigured === false) return 'runtime-unavailable';
		if (
			!status.downloadConfigured ||
			(status.state !== 'needs_download' && status.state !== 'present_unverified')
		) {
			return 'unavailable';
		}

		const network = await this.#modelManager.getNetworkStatus().catch(() => null);
		if (network && !network.connected) {
			this.#modelError = 'No internet connection. Connect to Wi-Fi to download the model.';
			return 'offline';
		}
		if (network?.metered) {
			this.#meteredDownloadPrompt = network;
			return 'metered';
		}

		void this.downloadModel();
		return 'started';
	}

	#gemmaUnavailableAnswer(autoStart: ModelDownloadAutoStart = 'none'): ScoutAnswer {
		// Tailor the message: not-installed → guide to the download; otherwise the
		// model is present but the runtime hasn't warmed up yet.
		const notInstalled = !this.#modelStatus || this.#modelStatus.state !== 'ready';
		const modelSize = formatModelSize(this.#modelStatus?.expectedBytes);
		let answer = 'My on-device model is still warming up. Give it a few seconds and ask again.';
		if (notInstalled) {
			if (autoStart === 'started') {
				answer = `I'm starting the on-device model download now (${modelSize}). Once it verifies, Scout can answer fully offline. You can watch progress in Settings > On-device AI.`;
			} else if (autoStart === 'downloading' || this.#modelDownload) {
				answer = `Scout's on-device model is downloading now. Once it verifies, ask again and I'll answer from the local model.`;
			} else if (autoStart === 'runtime-unavailable' || this.#modelStatus?.runtimeConfigured === false) {
				answer =
					"This iOS build can see Scout's model store, but the LiteRT-LM runtime is not linked yet. Install a build with the iOS runtime before testing on-device answers.";
			} else if (autoStart === 'metered' || this.#meteredDownloadPrompt) {
				answer = `Scout's on-device model is ${modelSize}, and this connection looks metered. I paused before using mobile data. Open Settings > On-device AI if you want to approve the download anyway.`;
			} else if (autoStart === 'offline') {
				answer = this.#modelError ?? "Connect to Wi-Fi to download Scout's on-device model.";
			} else if (autoStart === 'unavailable') {
				answer =
					"The on-device model download isn't available in this build yet. Scout will answer after the verified model/runtime is installed.";
			} else {
				answer = `Scout's on-device model isn't installed yet. Download it once on Wi-Fi in Settings > On-device AI, then I can answer fully offline.`;
			}
		}
		return {
			answer,
			confidence: 'draft',
			mode: 'on-device',
			provider: 'on-device-gemma',
			// No citations on a status message — this is NOT a model answer, so it
			// must never carry source provenance. (The chat also renders it as a
			// plain status line, with no confidence badge — see #dispatchScoutReply.)
			receipts: [],
			toolInvocations: [],
			requiredConfirmations: [],
			safetyFlags: notInstalled
				? [
					{
						id: 'on-device-model-not-installed',
						severity: 'warn',
						message: 'Scout answers run on a Gemma model stored on your phone — download it in Settings to chat offline.'
					}
				]
				: [],
			contextUsed: ['gemma4-only-policy'],
			generatedAt: new Date().toISOString()
		};
	}

	#getCurrentPosition(): Promise<GeolocationPosition | null> {
		if (!browser || !navigator.geolocation) return Promise.resolve(null);
		// Enforce the privacy toggle: location is only read when the hiker has opted
		// in (default off). This is also why the OS permission prompt only appears
		// after they enable "Precise location" — we never read it silently.
		if (!this.#state.privacySettings.sharePreciseLocation) return Promise.resolve(null);

		return new Promise((resolve) => {
			navigator.geolocation.getCurrentPosition(
				(position) => resolve(position),
				() => resolve(null),
				{ enableHighAccuracy: true, maximumAge: 60_000, timeout: 4_000 }
			);
		});
	}

	/** Snap a GPS fix to the nearest real AT mile (USGS route geometry). Falls back
	 * to the last known mile when there's no fix or geometry isn't loaded yet. */
	#snapPositionToTrailMile(position: GeolocationPosition | null): number {
		if (!position) return this.#state.currentMile;
		const mile = snapToMile(this.#trailGeo, position.coords.latitude, position.coords.longitude);
		return mile ?? this.#state.currentMile;
	}

	async #syncTrailPulseReport(report: TrailConditionReport) {
		const result = await publishTrailPulseReport(report).catch(() => 'failed' as const);
		const syncState: SyncState = result === 'failed' ? 'queued-offline' : 'synced';

		this.#state.trailPulseReports = this.#state.trailPulseReports.map((candidate) =>
			candidate.id === report.id ? { ...candidate, syncState } : candidate
		);

		if (result !== 'failed') {
			this.#finishSync('syncing');
		} else {
			this.#state.syncState = 'queued-offline';
		}
	}

	get activeTab() {
		return this.#state.activeTab;
	}

	set activeTab(tab: Tab) {
		this.#state.activeTab = tab;
	}

	// Which tab to return to when leaving Settings — the gear can be opened from any
	// pillar, so "back" should land where you were, not hardcode Scout.
	#settingsReturnTab: Tab = 'Today';

	/** Open Settings, remembering the tab to return to. */
	openSettings() {
		if (this.#state.activeTab !== 'Settings') this.#settingsReturnTab = this.#state.activeTab;
		this.#state.activeTab = 'Settings';
	}

	/** Leave Settings, returning to whichever pillar opened it. */
	closeSettings() {
		this.#state.activeTab = this.#settingsReturnTab;
	}

	// Which section the Trail pillar opens to (Guide · Bible · Docs · Gear).
	// Shared so the Today "packing up?" glance can deep-link straight to Gear.
	#trailSection = $state<'guide' | 'bible' | 'docs' | 'gear'>('guide');
	get trailSection() {
		return this.#trailSection;
	}
	set trailSection(section: 'guide' | 'bible' | 'docs' | 'gear') {
		this.#trailSection = section;
	}

	/** Open the Trail pillar to a specific section (used by deep links like the
	 *  Today packing glance jumping to Gear). */
	openTrailSection(section: 'guide' | 'bible' | 'docs' | 'gear') {
		this.#trailSection = section;
		this.#state.activeTab = 'Trail';
	}

	get coachMessages() {
		return this.#state.coachMessages;
	}

	/** True while Scout is generating a reply (drives the chat "thinking" indicator). */
	get scoutThinking() {
		return this.#scoutThinking;
	}

	/** A write-action Scout proposed, awaiting the user's Confirm/Cancel (or null). */
	get pendingAction() {
		return this.#pendingAction;
	}

	get lastCheckIn() {
		return this.#state.lastCheckIn;
	}

	get checkInHistory() {
		return this.#state.checkInHistory;
	}

	get documents() {
		return this.#state.documents;
	}

	get trailPulseReports() {
		return this.#state.trailPulseReports;
	}

	get nearbyTrailPulseReports() {
		return this.#state.trailPulseReports
			.filter((report) => report.status === 'active' && Math.abs(this.#state.currentMile - report.snappedMile) <= TRAIL_PULSE_RANGE_MILES)
			.sort((a, b) => new Date(b.observedAt).getTime() - new Date(a.observedAt).getTime());
	}

	get pendingTrailPulseAlert() {
		return (
			this.nearbyTrailPulseReports.find((report) => !this.#state.seenTrailPulseReportIds.includes(report.id)) ??
			null
		);
	}

	get trailPulseRangeMiles() {
		return TRAIL_PULSE_RANGE_MILES;
	}

	get privacySettings() {
		return this.#state.privacySettings;
	}

	get trailSettings() {
		return this.#state.trailSettings;
	}

	get autoGpsActive() {
		return this.#gpsWatchId !== null;
	}

	get trailLogSettings() {
		return this.#state.trailLogSettings;
	}

	get onlineStatus() {
		return this.#state.onlineStatus;
	}

	get fieldPack() {
		return this.#fieldPack;
	}

	get fieldPackStatus() {
		return this.#fieldPackStatus;
	}

	/** On-device Gemma model file state, or null off-native / before first probe. */
	get modelStatus() {
		return this.#modelStatus;
	}

	/** Live download progress while a model download is in flight, else null. */
	get modelDownload() {
		return this.#modelDownload;
	}

	/** Last model-download error message, cleared when a new download starts. */
	get modelError() {
		return this.#modelError;
	}

	/**
	 * Non-null when a download was requested over a metered (cellular/hotspot)
	 * connection and is awaiting the user's okay on the data cost. The UI shows a
	 * "download over cellular?" confirm; downloadModel({ allowMetered: true })
	 * proceeds, dismissMeteredPrompt() backs out.
	 */
	get meteredDownloadPrompt() {
		return this.#meteredDownloadPrompt;
	}

	/** True when on-device model management is available (native build w/ plugin). */
	get supportsOnDeviceModel() {
		return this.#modelManager !== null;
	}

	get syncState() {
		return this.#state.syncState;
	}

	get currentMile() {
		return this.#state.currentMile;
	}

	get dayNumber() {
		const profile = this.#state.hikeProfile;
		if (!profile.calibrated) return this.#state.dayNumber;
		if (isSelfTracked(profile)) {
			return profile.startDate ? deriveDayNumber(profile.startDate, new Date()) : 1;
		}
		if (isDadPilotContextPack(this.#fieldPack)) {
			return deriveDayNumber(HIKE_START_DATE, new Date());
		}
		return this.#state.dayNumber;
	}

	/** The user's own hike identity + position ("My hike"). */
	get hikeProfile(): HikeProfile {
		return this.#state.hikeProfile;
	}

	/** True until the user has completed (or skipped) first-run calibration. */
	get needsCalibration(): boolean {
		return browser && !this.#state.hikeProfile.calibrated;
	}

	/** True while the "My hike" setup sheet should be shown (first run or re-edit). */
	get hikeSetupOpen(): boolean {
		return this.#hikeSetupOpen || this.needsCalibration;
	}

	openHikeSetup(): void {
		this.#hikeSetupOpen = true;
	}

	closeHikeSetup(): void {
		this.#hikeSetupOpen = false;
	}

	/** Real AT route geometry + elevation (1-mi samples), or [] before it loads. */
	get trailGeometry() {
		return this.#trailGeo;
	}

	get nextCheckInDueAt() {
		return this.#state.nextCheckInDueAt;
	}

	get supportCircle() {
		return this.#state.supportCircle;
	}

	get lastSyncAt() {
		return this.#state.lastSyncAt;
	}

	get missedCheckInRisk() {
		const hoursUntilDue =
			(new Date(this.#state.nextCheckInDueAt).getTime() - Date.now()) / (60 * 60 * 1000);

		if (!this.#state.onlineStatus && hoursUntilDue < 1.5) return 'high';
		if (hoursUntilDue < 2) return 'medium';
		return 'low';
	}

	get syncLabel() {
		if (this.#state.syncState === 'queued-offline') return 'Queued offline';
		if (this.#state.syncState === 'syncing') return 'Syncing now';
		return 'Synced';
	}

	sendCoachMessage(content: string) {
		const trimmed = content.trim();
		if (!trimmed) return;

		this.#state.coachMessages = [...this.#state.coachMessages, makeMessage('user', trimmed)];

		// "Do" tools: if the message is a write-action intent, Scout PROPOSES the
		// action (a confirm card) instead of just chatting. Nothing is written
		// until the user confirms. Falls through to a normal reply otherwise.
		const proposal = this.#detectActionIntent(trimmed);
		if (proposal) {
			this.#pendingAction = proposal.display;
			this.#pendingApply = proposal.apply;
			this.#state.coachMessages = [...this.#state.coachMessages, makeMessage('assistant', proposal.prompt)];
			return;
		}

		void this.#dispatchScoutReply(trimmed);
	}

	/**
	 * Detects a write-action intent in a chat message and returns a proposed
	 * action (display + apply closure + a prompt line), or null for plain chat.
	 * The "Do" tools are logging a check-in and updating the current mile (e.g.
	 * "I'm at mile 623.4"); the two can combine ("I'm safe at mile 700"). Apply is
	 * never run here — only on explicit confirm.
	 */
	#detectActionIntent(
		text: string
	): { display: ProposedAction; apply: () => void; prompt: string } | null {
		const lower = text.toLowerCase();
		let status: CheckInStatus | null = null;
		if (/\b(need help|need-help|emergency|injured|hurt|sos|rescue|bailing)\b/.test(lower)) {
			status = 'need-help';
		} else if (/\b(delayed|behind schedule|running late|short day|taking it slow|slowing down|resting up)\b/.test(lower)) {
			status = 'delayed';
		} else if (/\b(check ?in|checking in|i'?m safe|im safe|log me safe|all good|made camp|safe and sound)\b/.test(lower)) {
			status = 'safe';
		}

		// Pure position updates use the strict parser (strong false-positive guard);
		// a check-in additionally accepts a bare "at mile N" locator, so a stated
		// mile in "I'm safe at mile 700" / "need help at mile 1442" isn't lost.
		const parsedMile = status ? parseMileFromCheckIn(text) : parseMileFromText(text);
		if (!status && parsedMile === null) return null;

		// Pure position update ("I'm at mile 623.4") — no check-in status present.
		if (!status && parsedMile !== null) {
			const from = this.#state.currentMile;
			return {
				display: {
					id: crypto.randomUUID(),
					title: 'Update your position',
					detail: `Move to mile ${parsedMile.toFixed(1)} (from mile ${from.toFixed(1)})`,
					confirmLabel: 'Update mile'
				},
				apply: () => void this.updateCurrentMile(parsedMile, 'check-in'),
				prompt: `Want me to set your position to mile ${parsedMile.toFixed(1)}? I won't change anything until you confirm below.`
			};
		}

		const labels: Record<CheckInStatus, string> = {
			safe: 'Safe',
			delayed: 'Delayed',
			'need-help': 'Need help'
		};
		const confirmed = status as CheckInStatus;
		// A mile in the message moves the hiker first, so the check-in records at the
		// stated mile rather than the stale one.
		const mile = parsedMile ?? this.#state.currentMile;
		const movesPosition = parsedMile !== null && Math.abs(parsedMile - this.#state.currentMile) >= 0.05;
		return {
			display: {
				id: crypto.randomUUID(),
				title: `Log a "${labels[confirmed]}" check-in`,
				detail: `Mile ${mile.toFixed(1)} · "${text}"`,
				confirmLabel: 'Log check-in'
			},
			apply: () => {
				if (movesPosition) void this.updateCurrentMile(mile, 'check-in');
				this.performCheckIn(confirmed, text);
			},
			prompt: movesPosition
				? `Want me to mark you at mile ${mile.toFixed(1)} and log a "${labels[confirmed]}" check-in? I won't record anything until you confirm below.`
				: `Want me to log a "${labels[confirmed]}" check-in at mile ${mile.toFixed(1)}? I won't record anything until you confirm below.`
		};
	}

	/** Apply the pending Scout-proposed action (called from the confirm card). */
	confirmPendingAction() {
		const action = this.#pendingAction;
		const apply = this.#pendingApply;
		this.#pendingAction = null;
		this.#pendingApply = null;
		if (!action || !apply) return;
		apply();
		this.#state.coachMessages = [
			...this.#state.coachMessages,
			makeMessage('assistant', `Done — ${action.title.toLowerCase()} recorded. ✓`)
		];
	}

	/** Discard the pending Scout-proposed action without applying it. */
	cancelPendingAction() {
		if (!this.#pendingAction) return;
		this.#pendingAction = null;
		this.#pendingApply = null;
		this.#state.coachMessages = [
			...this.#state.coachMessages,
			makeMessage('assistant', `No problem — I didn't record anything.`)
		];
	}

	async #dispatchScoutReply(prompt: string) {
		// Self-heal the native wiring in case Capacitor wasn't ready at construction.
		this.#ensureNativeWiring();
		if (REQUIRE_GEMMA) await this.refreshModelStatus();
		this.#scoutThinking = true;

		// Stream tokens into a live-updating assistant bubble. The bubble is only
		// created on the FIRST token, so the "thinking" dots show until words start
		// arriving, then flip straight into the growing answer.
		let streamingId: string | null = null;
		const onToken = (chunk: string) => {
			if (!chunk) return;
			if (streamingId === null) {
				const message = makeMessage('assistant', chunk);
				streamingId = message.id;
				this.#scoutThinking = false;
				this.#state.coachMessages = [...this.#state.coachMessages, message];
			} else {
				const id = streamingId;
				this.#state.coachMessages = this.#state.coachMessages.map((m) =>
					m.id === id ? { ...m, content: m.content + chunk } : m
				);
			}
		};

		try {
			if (!(await this.#gemmaReady())) {
				// Model unavailable: append a PLAIN status message. Deliberately do
				// NOT register it as a ScoutAnswer or set lastScoutAnswer — it isn't a
				// model answer, so the chat shows no confidence badge or source chips.
				const autoStart = await this.#startModelDownloadIfUseful();
				const answer = this.#gemmaUnavailableAnswer(autoStart);
				this.#state.coachMessages = [...this.#state.coachMessages, makeMessage('assistant', answer.answer)];
				return;
			}

			const answer = await this.#scout.runtime.ask(
				{
					prompt,
					onlineStatus: this.#state.onlineStatus,
					batterySaver: this.#state.trailSettings.batterySaver,
					allowCloud: false,
					preferredMode: REQUIRE_GEMMA ? 'on-device' : undefined
				},
				onToken
			);
			this.#lastScoutAnswer = answer;

			if (streamingId !== null) {
				// Finalize the streamed bubble: snap to the provider's full text and
				// attach receipts/confidence so the source chips render.
				const id = streamingId;
				this.#scoutAnswersByMessage.set(id, answer);
				this.#state.coachMessages = this.#state.coachMessages.map((m) =>
					m.id === id ? { ...m, content: answer.answer } : m
				);
			} else {
				// Provider didn't stream (e.g. deterministic fallback) — append result.
				const message = makeMessage('assistant', answer.answer);
				this.#scoutAnswersByMessage.set(message.id, answer);
				this.#state.coachMessages = [...this.#state.coachMessages, message];
			}
		} catch (error) {
			// On-device generation failed this turn. Under the Gemma-only policy the
			// runtime rethrows rather than silently faking an offline answer (the
			// "acted offline" bug), so handle it honestly: reset the availability
			// probe, warm the engine for next time, and tell the hiker plainly with
			// a retry nudge — never a canned offline answer that hides the failure.
			// Log the real error so a genuine bug (store/tool failure) is debuggable
			// from device logs rather than silently swallowed.
			console.error('Scout reply failed', error);
			this.#scout.onDeviceProvider?.invalidateAvailability();
			this.#warmUpModel();
			// Keep the wording accurate for any failure here (on-device generation is
			// the dominant case under the Gemma-only policy, but a store/tool error
			// could also land here) while still nudging a retry — the warm-up above
			// means the next attempt usually succeeds.
			const snag =
				'Scout hit a snag answering that just now — give it a few seconds and ask again.';
			if (streamingId !== null) {
				const id = streamingId;
				this.#state.coachMessages = this.#state.coachMessages.map((m) =>
					m.id === id ? { ...m, content: snag } : m
				);
			} else {
				this.#state.coachMessages = [...this.#state.coachMessages, makeMessage('assistant', snag)];
			}
		} finally {
			this.#scoutThinking = false;
		}
	}

	async askScout(prompt: string): Promise<ScoutAnswer> {
		if (!(await this.#gemmaReady())) {
			// Return the unavailable STATUS to the caller, but do NOT record it as
			// lastScoutAnswer — otherwise Today's "last answer" recap would show a
			// status message with a confidence badge, as if it were a real answer.
			const autoStart = await this.#startModelDownloadIfUseful();
			return this.#gemmaUnavailableAnswer(autoStart);
		}

		const answer = await this.#scout.runtime.ask({
			prompt,
			onlineStatus: this.#state.onlineStatus,
			batterySaver: this.#state.trailSettings.batterySaver,
			allowCloud: false,
			preferredMode: REQUIRE_GEMMA ? 'on-device' : undefined
		});
		this.#lastScoutAnswer = answer;
		return answer;
	}

	async refreshFieldPack(): Promise<ContextPack> {
		if (!this.#state.hikeProfile.calibrated) {
			return this.#fieldPack;
		}
		// Self-tracked hikers fetch a pack centered on THEIR mile (?mile=&personal=1);
		// explicit Dad-pilot mode fetches the public pilot pack at the bare endpoint.
		const endpoint = buildFieldPackUrl(FIELD_PACK_ENDPOINT, this.#state.hikeProfile);
		await this.#fieldPackStore.refreshFromEndpoint(endpoint);
		await this.#syncDocumentsToFieldPack();
		const pack = this.#fieldPackStore.get();
		this.#fieldPack = pack;
		this.#fieldPackStatus = this.#fieldPackStore.getStatus();
		this.#applyPackToTrailState(pack);
		this.#state.lastSyncAt = new Date().toISOString();
		return pack;
	}

	createDocument(input: { title: string; body: string; source?: TrailDocument['source'] }): TrailDocument | null {
		const document = createTrailDocument(input);
		if (!document) return null;
		this.#state.documents = limitTrailDocuments([document, ...this.#state.documents]);
		void this.#syncDocumentsToFieldPack();
		return document;
	}

	updateDocument(id: string, input: { title: string; body: string }): void {
		this.#state.documents = this.#state.documents.map((document) =>
			document.id === id ? updateTrailDocument(document, input) : document
		);
		void this.#syncDocumentsToFieldPack();
	}

	deleteDocument(id: string): void {
		this.#state.documents = this.#state.documents.filter((document) => document.id !== id);
		void this.#syncDocumentsToFieldPack();
	}

	saveLastScoutAnswerAsDocument(title = 'Scout field draft'): TrailDocument | null {
		const answer = this.#lastScoutAnswer;
		if (!answer?.answer.trim()) return null;
		return this.createDocument({
			title,
			body: answer.answer,
			source: 'scout-draft'
		});
	}

	draftDocumentWithScout(topic: string): void {
		const trimmed = topic.trim();
		if (!trimmed) return;
		this.#state.activeTab = 'Scout';
		this.sendCoachMessage(
			`Draft an offline field document about "${trimmed}". Use my saved field pack, Bible/source tools when relevant, and any saved docs that match. Structure it with: what I know, what to do next, source-backed details, assumptions to verify later, and a short trail-ready checklist.`
		);
	}

	/**
	 * First-run (or re-edit) calibration. `self` mode makes position the user's own
	 * — owned by the profile, centered field pack, real day number from their start
	 * date. `dad-pilot` mode follows the Hogg family's public 2026 thru-hike.
	 */
	async calibrateHike(input: {
		mode: HikeMode;
		trailName?: string;
		direction?: 'NOBO' | 'SOBO';
		startDate?: string;
		currentMile?: number;
	}): Promise<void> {
		const now = new Date().toISOString();

		if (input.mode === 'dad-pilot') {
			this.#state.hikeProfile = {
				calibrated: true,
				mode: 'dad-pilot',
				direction: 'NOBO',
				currentMile: this.#fieldPack.hiker.currentMile,
				mileSource: 'pilot',
				updatedAt: now
			};
		} else {
			const mile = clampMile(input.currentMile ?? 0);
			this.#state.hikeProfile = {
				calibrated: true,
				mode: 'self',
				trailName: input.trailName?.trim() || undefined,
				direction: input.direction ?? 'NOBO',
				startDate: input.startDate || todayISODate(),
				currentMile: mile,
				mileSource: 'onboarding',
				updatedAt: now
			};
			this.#state.currentMile = mile;
			this.#anchorCheckInToSelf(mile);
		}

		this.#hikeSetupOpen = false;
		if (this.#state.onlineStatus) {
			await this.refreshFieldPack();
		} else {
			this.#applyPackToTrailState(this.#fieldPack);
		}
	}

	/**
	 * Re-anchor the seeded check-in to the user's own starting mile when a personal
	 * hike begins. A self-tracked hiker must never inherit a stale pilot location.
	 */
	#anchorCheckInToSelf(mile: number) {
		this.#state.lastCheckIn = {
			id: crypto.randomUUID(),
			timestamp: new Date().toISOString(),
			location: `Mile ${mile.toFixed(1)}`,
			mile,
			status: 'safe',
			note: 'Starting position set — log a check-in when you reach camp.'
		};
		this.#state.checkInHistory = [];
	}

	/**
	 * Move the hiker to a new current mile (from a chat check-in, a GPS snap, or a
	 * manual edit). Always flips the profile into self-tracking — once someone tells
	 * Scout where THEY are, position is theirs, not Dad's — and re-centers the field
	 * pack around the new mile when online.
	 */
	async updateCurrentMile(mile: number, source: MileSource): Promise<void> {
		const clamped = clampMile(mile);
		const previous = this.#state.hikeProfile;
		const becomingSelf = !previous.calibrated || previous.mode !== 'self';
		this.#state.hikeProfile = {
			...previous,
			calibrated: true,
			mode: 'self',
			direction: previous.direction ?? 'NOBO',
			startDate: previous.startDate ?? todayISODate(),
			currentMile: clamped,
			mileSource: source,
			updatedAt: new Date().toISOString()
		};
		this.#state.currentMile = clamped;
		// First transition into a personal hike: drop the bundled Dad-pilot check-in.
		if (becomingSelf) this.#anchorCheckInToSelf(clamped);
		if (this.#state.onlineStatus) {
			await this.refreshFieldPack();
		}
	}

	/**
	 * Snap the device GPS fix to the nearest real AT mile and adopt it as the
	 * current position. Honors the "precise location" privacy toggle and refuses to
	 * guess when the fix is far off-trail or geometry hasn't loaded — returning a
	 * reason the UI can show, rather than fabricating a mile.
	 */
	async useGpsForMile(): Promise<{ ok: boolean; mile?: number; reason?: string }> {
		if (!this.#state.privacySettings.sharePreciseLocation) {
			return { ok: false, reason: 'Turn on Precise location first, then I can snap your GPS fix to a trail mile.' };
		}
		const position = await this.#getCurrentPosition();
		if (!position) {
			return { ok: false, reason: "Couldn't get a GPS fix. Try again with a clearer view of the sky." };
		}
		const mile = snapToMile(this.#trailGeo, position.coords.latitude, position.coords.longitude);
		if (mile === null) {
			return {
				ok: false,
				reason: this.#trailGeo.length
					? "Your GPS fix is more than 2 miles from the AT route, so I won't guess a trail mile."
					: 'The trail map is still loading — try again in a moment.'
			};
		}
		await this.updateCurrentMile(mile, 'gps');
		return { ok: true, mile };
	}

	/** Refresh the on-device model file status (cheap; no network). */
	async refreshModelStatus(): Promise<ScoutGemmaModelStatus | null> {
		if (!this.#modelManager) return null;
		try {
			this.#modelStatus = await this.#modelManager.getStatus();
		} catch {
			this.#modelStatus = null;
		}
		return this.#modelStatus;
	}

	/**
	 * Download + verify the on-device Gemma model, tracking live progress. The
	 * native side runs the transfer in a foreground service so it survives the app
	 * being backgrounded; this method tracks it while the UI is open and reconciles
	 * on completion.
	 *
	 * Wi-Fi-aware: on a metered (cellular/hotspot) connection it stops and sets
	 * {@link meteredDownloadPrompt} so the UI can warn about the ~2.5GB cost; pass
	 * {@code allowMetered: true} to proceed anyway.
	 */
	async downloadModel(options: { allowMetered?: boolean } = {}): Promise<void> {
		if (!this.#modelManager || this.#modelDownload) return;
		this.#modelError = null;

		// Best-effort: ask for notification permission so the OS shows background
		// progress. Denial is non-fatal — the foreground service still runs.
		await this.#modelManager.requestNotificationsPermission().catch(() => false);

		// Wi-Fi-aware gate. Skip the download (don't burn cellular data) until the
		// user explicitly okays a metered connection.
		const network = await this.#modelManager.getNetworkStatus().catch(() => null);
		if (network && !network.connected) {
			this.#modelError = 'No internet connection. Connect to Wi-Fi to download the model.';
			return;
		}
		if (network?.metered && !options.allowMetered) {
			this.#meteredDownloadPrompt = network;
			return;
		}
		this.#meteredDownloadPrompt = null;

		this.#modelDownload = { bytesDownloaded: 0, totalBytes: this.#modelStatus?.expectedBytes ?? -1 };
		try {
			const status = await this.#modelManager.startDownload((progress: ModelDownloadProgress) => {
				this.#modelDownload = {
					bytesDownloaded: progress.bytesDownloaded,
					totalBytes: progress.totalBytes
				};
			});
			this.#modelStatus = status;
			// When the model is now ready, invalidate the cached availability so
			// the router re-probes the native engine on the next Scout turn —
			// without this the on-device path stays dead until the app restarts —
			// and warm the engine so the first chat turn isn't a cold (flaky) init.
			if (status.state === 'ready') {
				this.#scout.onDeviceProvider?.invalidateAvailability();
				this.#warmUpModel();
			}
		} catch (error) {
			this.#modelError = error instanceof Error ? error.message : 'Model download failed.';
			await this.refreshModelStatus();
		} finally {
			this.#modelDownload = null;
		}
	}

	/** Back out of the metered-connection download confirm without downloading. */
	dismissMeteredPrompt(): void {
		this.#meteredDownloadPrompt = null;
	}

	/**
	 * Re-observe a download that may have kept running in the background service
	 * while the app was closed/backgrounded. Call on app resume / when the model UI
	 * mounts: it re-attaches progress + terminal handling if a transfer is still in
	 * flight, and refreshes status (which may now be ready). No-op otherwise.
	 */
	async reconcileDownload(): Promise<void> {
		// Heal native wiring first — this runs on cold start and app resume, the
		// exact moments a Capacitor injection race might have left the bridge null.
		this.#ensureNativeWiring();
		if (!this.#modelManager) return;
		await this.refreshModelStatus();
		if (this.#modelStatus?.state === 'ready') {
			this.#scout.onDeviceProvider?.invalidateAvailability();
			this.#warmUpModel();
			return;
		}
		if (this.#modelDownload) return; // Already tracking in this session.

		const state = await this.#modelManager.getDownloadState().catch(() => null);
		if (!state?.active) return; // No background download to re-observe.

		// Seed the progress bar from the last known bytes before awaiting terminal.
		this.#modelDownload = { bytesDownloaded: state.bytesDownloaded, totalBytes: state.totalBytes };
		try {
			const status = await this.#modelManager.reattachDownload((progress: ModelDownloadProgress) => {
				this.#modelDownload = {
					bytesDownloaded: progress.bytesDownloaded,
					totalBytes: progress.totalBytes
				};
			});
			if (status) {
				this.#modelStatus = status;
				if (status.state === 'ready') {
					this.#scout.onDeviceProvider?.invalidateAvailability();
					this.#warmUpModel();
				}
			} else {
				// Finished between the state check and the re-attach — reconcile.
				await this.refreshModelStatus();
			}
		} catch (error) {
			this.#modelError = error instanceof Error ? error.message : 'Model download failed.';
			await this.refreshModelStatus();
		} finally {
			this.#modelDownload = null;
		}
	}

	/** Cancel an in-flight model download; the partial file is kept for resume. */
	async cancelModelDownload(): Promise<void> {
		if (!this.#modelManager) return;
		this.#meteredDownloadPrompt = null;
		await this.#modelManager.cancelDownload();
	}

	get lastScoutAnswer(): ScoutAnswer | null {
		return this.#lastScoutAnswer;
	}

	scoutAnswerFor(messageId: string): ScoutAnswer | null {
		return this.#scoutAnswersByMessage.get(messageId) ?? null;
	}

	runQuickPrompt(prompt: string) {
		this.sendCoachMessage(prompt);
	}

	/** True once at least one real check-in has been logged on this device. */
	get hasCheckedIn() {
		return this.#state.checkInHistory.length > 0;
	}

	/** Support contacts that can actually be reached (have a phone number). */
	get reachableSupportContacts() {
		return this.#state.supportCircle.filter((c) => !!c.phone);
	}

	addSupportContact(contact: SupportContact): void {
		const name = contact.name.trim();
		if (!name) return;
		this.#state.supportCircle = [
			...this.#state.supportCircle,
			{
				name,
				role: contact.role.trim() || 'Emergency contact',
				method: contact.method.trim() || (contact.phone?.trim() ? 'Text / call' : 'Reference'),
				phone: contact.phone?.trim() || undefined,
				email: contact.email?.trim() || undefined
			}
		];
	}

	removeSupportContact(name: string): void {
		this.#state.supportCircle = this.#state.supportCircle.filter((c) => c.name !== name);
	}

	/**
	 * Build a signal-gated "need help" SMS deep link to the support circle. This is
	 * NOT an SOS/PLB service — it opens the phone's Messages app pre-filled, which
	 * only sends when the hiker has a bar. Returns null when no contact has a phone,
	 * so the UI can prompt to add one instead of pretending help is wired.
	 */
	buildHelpSms(): { href: string; recipients: SupportContact[] } | null {
		const recipients = this.reachableSupportContacts;
		if (!recipients.length) return null;
		const mile = this.#state.currentMile.toFixed(1);
		const name = this.#state.hikeProfile.trailName?.trim() || this.#fieldPack.hiker.trailName || 'Hiker';
		const body = `${name} needs help on the AT. Near mile ${mile}. Sent from Hogg Country Trail Assistant.`;
		const numbers = recipients.map((c) => (c.phone ?? '').replace(/[^+\d]/g, '')).filter(Boolean);
		const href = `sms:${numbers.join(',')}?&body=${encodeURIComponent(body)}`;
		return { href, recipients };
	}

	performCheckIn(status: CheckInStatus, note: string) {
		const label: Record<CheckInStatus, string> = {
			safe: note || 'Still on plan and moving well.',
			delayed: note || 'Taking a lighter day and protecting recovery.',
			'need-help': note || 'Need human review on the next move.'
		};

		const record = makeCheckIn(status, label[status], this.#state.currentMile);
		this.#state.lastCheckIn = record;
		this.#state.checkInHistory = [record, ...this.#state.checkInHistory].slice(0, 6);
		this.#state.nextCheckInDueAt = isoHoursFromNow(status === 'need-help' ? 1 : 4);

		if (this.#state.onlineStatus) {
			this.#finishSync('syncing');
		} else {
			this.#state.syncState = 'queued-offline';
		}
	}

	async submitTrailPulseReport(input: {
		source: TrailPulseSource;
		chipText?: TrailPulseChip;
		noteText?: string;
		reporterTrailName?: string;
	}): Promise<TrailConditionReport | null> {
		const chipText = input.chipText;
		const noteText = (input.noteText?.trim() || chipText || '').trim();
		if (!noteText) return null;

		const position = await this.#getCurrentPosition();
		const report = makeTrailPulseReport({
			source: input.source,
			chipText,
			noteText,
			reporterTrailName: input.reporterTrailName,
			snappedMile: this.#snapPositionToTrailMile(position),
			syncState: this.#state.onlineStatus ? 'syncing' : 'queued-offline'
		});

		this.#state.trailPulseReports = [report, ...this.#state.trailPulseReports];
		this.markTrailPulseAlertSeen(report.id);

		if (this.#state.onlineStatus) {
			void this.#syncTrailPulseReport(report);
			this.#finishSync('syncing');
		} else {
			this.#state.syncState = 'queued-offline';
		}

		return report;
	}

	formatTrailPulseReport(report: TrailConditionReport): string {
		return trailPulseDisplayText(report);
	}

	markTrailPulseAlertSeen(reportId: string) {
		if (this.#state.seenTrailPulseReportIds.includes(reportId)) return;
		this.#state.seenTrailPulseReportIds = [reportId, ...this.#state.seenTrailPulseReportIds].slice(0, 120);
	}

	updatePrivacy(patch: Partial<PrivacySettings>) {
		this.#state.privacySettings = { ...this.#state.privacySettings, ...patch };
		this.#reconcileAutoGpsWatch();
	}

	updateTrailSetting<K extends keyof TrailSettings>(key: K, value: TrailSettings[K]) {
		this.#state.trailSettings = { ...this.#state.trailSettings, [key]: value };
		if (key === 'autoLogMileage') this.#reconcileAutoGpsWatch();
	}

	updateTrailLogSetting<K extends keyof TrailLogSettings>(key: K, value: TrailLogSettings[K]) {
		this.#state.trailLogSettings = { ...this.#state.trailLogSettings, [key]: value };
	}
}

export const trailAssistant = new TrailAssistantStore();
