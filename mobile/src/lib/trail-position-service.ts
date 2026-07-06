import {
	nextAutoGpsAdoption,
	resolveManualGpsMile,
	shouldAutoGpsWatch,
	type ManualGpsMileResult
} from './gps-mileage.ts';
import type { MileSource } from './scout/hike-profile.ts';
import type { PrivacySettings, TrailSettings } from './types.ts';

export interface TrailPositionPoint {
	m: number;
	ft: number;
	lat: number;
	lon: number;
}

export interface TrailSnapGeometry {
	m: number[];
	lat: number[];
	lon: number[];
}

export interface TrailGpsPosition {
	coords: {
		latitude: number;
		longitude: number;
	};
}

interface TrailGpsOptions {
	enableHighAccuracy?: boolean;
	maximumAge?: number;
	timeout?: number;
}

export interface TrailGeolocation {
	getCurrentPosition(
		success: (position: TrailGpsPosition) => void,
		error?: () => void,
		options?: TrailGpsOptions
	): void;
	watchPosition(
		success: (position: TrailGpsPosition) => void,
		error?: () => void,
		options?: TrailGpsOptions
	): number;
	clearWatch(id: number): void;
}

export function createBrowserGeolocation(browserAvailable: boolean): TrailGeolocation | null {
	if (!browserAvailable || typeof navigator === 'undefined' || !navigator.geolocation) return null;
	const { geolocation } = navigator;
	return {
		getCurrentPosition: (success, error, options) =>
			geolocation.getCurrentPosition(success, error, options),
		watchPosition: (success, error, options) =>
			geolocation.watchPosition(success, error, options),
		clearWatch: (id) => geolocation.clearWatch(id)
	};
}

interface TrailPositionServiceOptions {
	browserAvailable: boolean;
	getGeolocation: () => TrailGeolocation | null;
	getPrivacySettings: () => Pick<PrivacySettings, 'sharePreciseLocation'>;
	getTrailSettings: () => Pick<TrailSettings, 'autoLogMileage'>;
	getTrailGeometry: () => TrailPositionPoint[];
	setTrailGeometry: (points: TrailPositionPoint[]) => void;
	getSnapGeometry: () => TrailSnapGeometry | null;
	setSnapGeometry: (geometry: TrailSnapGeometry | null) => void;
	setAutoGpsActive: (active: boolean) => void;
	getCurrentMile: () => number;
	updateCurrentMile: (mile: number, source: MileSource) => void | Promise<void>;
	loadGeometry: () => Promise<TrailPositionPoint[]>;
	loadSnapGeometry: () => Promise<TrailSnapGeometry | null>;
	snapToMile: (
		points: TrailPositionPoint[] | TrailSnapGeometry | null,
		lat: number,
		lon: number
	) => number | null;
	onGeometryError?: (error: unknown) => void;
}

export class TrailPositionService {
	#browserAvailable: boolean;
	#getGeolocation: () => TrailGeolocation | null;
	#getPrivacySettings: () => Pick<PrivacySettings, 'sharePreciseLocation'>;
	#getTrailSettings: () => Pick<TrailSettings, 'autoLogMileage'>;
	#getTrailGeometry: () => TrailPositionPoint[];
	#setTrailGeometry: (points: TrailPositionPoint[]) => void;
	#getSnapGeometry: () => TrailSnapGeometry | null;
	#setSnapGeometry: (geometry: TrailSnapGeometry | null) => void;
	#setAutoGpsActive: (active: boolean) => void;
	#getCurrentMile: () => number;
	#updateCurrentMile: (mile: number, source: MileSource) => void | Promise<void>;
	#loadGeometry: () => Promise<TrailPositionPoint[]>;
	#loadSnapGeometry: () => Promise<TrailSnapGeometry | null>;
	#snapToMile: (
		points: TrailPositionPoint[] | TrailSnapGeometry | null,
		lat: number,
		lon: number
	) => number | null;
	#onGeometryError?: (error: unknown) => void;
	#gpsWatchId: number | null = null;
	#lastAutoGpsAt = 0;

	constructor(options: TrailPositionServiceOptions) {
		this.#browserAvailable = options.browserAvailable;
		this.#getGeolocation = options.getGeolocation;
		this.#getPrivacySettings = options.getPrivacySettings;
		this.#getTrailSettings = options.getTrailSettings;
		this.#getTrailGeometry = options.getTrailGeometry;
		this.#setTrailGeometry = options.setTrailGeometry;
		this.#getSnapGeometry = options.getSnapGeometry;
		this.#setSnapGeometry = options.setSnapGeometry;
		this.#setAutoGpsActive = options.setAutoGpsActive;
		this.#getCurrentMile = options.getCurrentMile;
		this.#updateCurrentMile = options.updateCurrentMile;
		this.#loadGeometry = options.loadGeometry;
		this.#loadSnapGeometry = options.loadSnapGeometry;
		this.#snapToMile = options.snapToMile;
		this.#onGeometryError = options.onGeometryError;
	}

	get autoGpsActive(): boolean {
		return this.#gpsWatchId !== null;
	}

	async loadTrailGeometry(): Promise<void> {
		try {
			this.#setTrailGeometry(await this.#loadGeometry());
			this.reconcileAutoGpsWatch();
		} catch (error) {
			this.#onGeometryError?.(error);
		}
	}

	reconcileAutoGpsWatch(): void {
		const geolocation = this.#geolocation();
		if (!geolocation) return;
		if (!this.#autoGpsRequested(geolocation)) {
			this.#stopAutoGpsWatch(geolocation);
			return;
		}
		if (this.#snapPointCount() === 0) {
			this.#stopAutoGpsWatch(geolocation);
			void this.#ensureSnapGeometry();
			return;
		}
		if (!this.#shouldAutoGpsWatch(geolocation)) return;
		if (this.#gpsWatchId !== null) return;

		this.#gpsWatchId = geolocation.watchPosition(
			(position) => {
				void this.#adoptAutoGpsPosition(position);
			},
			() => {
				// Manual "Use GPS" still reports a human-facing reason. The background
				// watcher stays quiet because losing a fix on trail is normal.
			},
			{ enableHighAccuracy: false, maximumAge: 15 * 60_000, timeout: 10_000 }
		);
		this.#setAutoGpsActive(true);
	}

	async useGpsForMile(): Promise<ManualGpsMileResult> {
		const sharePreciseLocation = this.#getPrivacySettings().sharePreciseLocation;
		if (!sharePreciseLocation) {
			return resolveManualGpsMile({
				sharePreciseLocation,
				hasPosition: false,
				snappedMile: null,
				trailGeometryLoaded: this.#snapPointCount() > 0
			});
		}

		const snapReadyPromise = this.#ensureSnapGeometry();
		const position = await this.getCurrentPosition();
		const snapReady = position ? await snapReadyPromise : this.#snapPointCount() > 0;
		const snappedMile = position && snapReady ? this.#snapPosition(position) : null;
		const result = resolveManualGpsMile({
			sharePreciseLocation,
			hasPosition: position !== null,
			snappedMile,
			trailGeometryLoaded: snapReady
		});
		if (result.ok) await this.#updateCurrentMile(result.mile, 'gps');
		return result;
	}

	async getCurrentPosition(): Promise<TrailGpsPosition | null> {
		const geolocation = this.#geolocation();
		if (!geolocation) return Promise.resolve(null);
		if (!this.#getPrivacySettings().sharePreciseLocation) return Promise.resolve(null);

		const precisePosition = await this.#requestPosition(geolocation, {
			enableHighAccuracy: true,
			maximumAge: 60_000,
			timeout: 15_000
		});
		if (precisePosition) return precisePosition;

		// Fresh high-accuracy fixes can lose to AT canopy; a coarse fallback is safe
		// because the 2-mile snap guard still refuses far-off-trail positions.
		return this.#requestPosition(geolocation, {
			enableHighAccuracy: false,
			maximumAge: 5 * 60_000,
			timeout: 8_000
		});
	}

	#requestPosition(
		geolocation: TrailGeolocation,
		options: TrailGpsOptions
	): Promise<TrailGpsPosition | null> {
		return new Promise((resolve) => {
			geolocation.getCurrentPosition(
				(position) => resolve(position),
				() => resolve(null),
				options
			);
		});
	}

	async snapPositionToTrailMile(position: TrailGpsPosition | null): Promise<number> {
		if (!position) return this.#getCurrentMile();
		const snapReady = await this.#ensureSnapGeometry();
		if (!snapReady) return this.#getCurrentMile();
		return this.#snapPosition(position) ?? this.#getCurrentMile();
	}

	#geolocation(): TrailGeolocation | null {
		return this.#browserAvailable ? this.#getGeolocation() : null;
	}

	#shouldAutoGpsWatch(geolocation: TrailGeolocation): boolean {
		return shouldAutoGpsWatch({
			browserAvailable: this.#browserAvailable,
			hasGeolocation: Boolean(geolocation),
			trailPointCount: this.#snapPointCount(),
			privacySettings: this.#getPrivacySettings(),
			trailSettings: this.#getTrailSettings()
		});
	}

	#autoGpsRequested(geolocation: TrailGeolocation): boolean {
		return shouldAutoGpsWatch({
			browserAvailable: this.#browserAvailable,
			hasGeolocation: Boolean(geolocation),
			trailPointCount: 1,
			privacySettings: this.#getPrivacySettings(),
			trailSettings: this.#getTrailSettings()
		});
	}

	#snapPointCount(): number {
		return this.#getSnapGeometry()?.m.length ?? 0;
	}

	async #ensureSnapGeometry(): Promise<boolean> {
		if (this.#snapPointCount() > 0) return true;
		try {
			this.#setSnapGeometry(await this.#loadSnapGeometry());
			this.reconcileAutoGpsWatch();
			return this.#snapPointCount() > 0;
		} catch (error) {
			this.#onGeometryError?.(error);
			return false;
		}
	}

	#stopAutoGpsWatch(geolocation: TrailGeolocation): void {
		if (this.#gpsWatchId === null) return;
		geolocation.clearWatch(this.#gpsWatchId);
		this.#gpsWatchId = null;
		this.#setAutoGpsActive(false);
	}

	async #adoptAutoGpsPosition(position: TrailGpsPosition): Promise<void> {
		const geolocation = this.#geolocation();
		if (!geolocation || !this.#shouldAutoGpsWatch(geolocation)) return;
		const adoption = nextAutoGpsAdoption({
			snappedMile: this.#snapPosition(position),
			currentMile: this.#getCurrentMile(),
			lastAutoGpsAt: this.#lastAutoGpsAt
		});
		if (!adoption) return;
		this.#lastAutoGpsAt = adoption.recordedAt;
		await this.#updateCurrentMile(adoption.mile, 'gps');
	}

	#snapPosition(position: TrailGpsPosition): number | null {
		return this.#snapToMile(
			this.#getSnapGeometry(),
			position.coords.latitude,
			position.coords.longitude
		);
	}
}
