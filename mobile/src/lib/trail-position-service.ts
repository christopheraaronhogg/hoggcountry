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

interface TrailPositionServiceOptions {
	browserAvailable: boolean;
	getGeolocation: () => TrailGeolocation | null;
	getPrivacySettings: () => Pick<PrivacySettings, 'sharePreciseLocation'>;
	getTrailSettings: () => Pick<TrailSettings, 'autoLogMileage'>;
	getTrailGeometry: () => TrailPositionPoint[];
	setTrailGeometry: (points: TrailPositionPoint[]) => void;
	setAutoGpsActive: (active: boolean) => void;
	getCurrentMile: () => number;
	updateCurrentMile: (mile: number, source: MileSource) => void | Promise<void>;
	loadGeometry: () => Promise<TrailPositionPoint[]>;
	snapToMile: (points: TrailPositionPoint[], lat: number, lon: number) => number | null;
	onGeometryError?: (error: unknown) => void;
}

export class TrailPositionService {
	#browserAvailable: boolean;
	#getGeolocation: () => TrailGeolocation | null;
	#getPrivacySettings: () => Pick<PrivacySettings, 'sharePreciseLocation'>;
	#getTrailSettings: () => Pick<TrailSettings, 'autoLogMileage'>;
	#getTrailGeometry: () => TrailPositionPoint[];
	#setTrailGeometry: (points: TrailPositionPoint[]) => void;
	#setAutoGpsActive: (active: boolean) => void;
	#getCurrentMile: () => number;
	#updateCurrentMile: (mile: number, source: MileSource) => void | Promise<void>;
	#loadGeometry: () => Promise<TrailPositionPoint[]>;
	#snapToMile: (points: TrailPositionPoint[], lat: number, lon: number) => number | null;
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
		this.#setAutoGpsActive = options.setAutoGpsActive;
		this.#getCurrentMile = options.getCurrentMile;
		this.#updateCurrentMile = options.updateCurrentMile;
		this.#loadGeometry = options.loadGeometry;
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
		if (!this.#shouldAutoGpsWatch(geolocation)) {
			this.#stopAutoGpsWatch(geolocation);
			return;
		}
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
		const position = sharePreciseLocation ? await this.getCurrentPosition() : null;
		const snappedMile = position ? this.#snapPosition(position) : null;
		const result = resolveManualGpsMile({
			sharePreciseLocation,
			hasPosition: position !== null,
			snappedMile,
			trailGeometryLoaded: this.#getTrailGeometry().length > 0
		});
		if (result.ok) await this.#updateCurrentMile(result.mile, 'gps');
		return result;
	}

	getCurrentPosition(): Promise<TrailGpsPosition | null> {
		const geolocation = this.#geolocation();
		if (!geolocation) return Promise.resolve(null);
		if (!this.#getPrivacySettings().sharePreciseLocation) return Promise.resolve(null);

		return new Promise((resolve) => {
			geolocation.getCurrentPosition(
				(position) => resolve(position),
				() => resolve(null),
				{ enableHighAccuracy: true, maximumAge: 60_000, timeout: 4_000 }
			);
		});
	}

	snapPositionToTrailMile(position: TrailGpsPosition | null): number {
		if (!position) return this.#getCurrentMile();
		return this.#snapPosition(position) ?? this.#getCurrentMile();
	}

	#geolocation(): TrailGeolocation | null {
		return this.#browserAvailable ? this.#getGeolocation() : null;
	}

	#shouldAutoGpsWatch(geolocation: TrailGeolocation): boolean {
		return shouldAutoGpsWatch({
			browserAvailable: this.#browserAvailable,
			hasGeolocation: Boolean(geolocation),
			trailPointCount: this.#getTrailGeometry().length,
			privacySettings: this.#getPrivacySettings(),
			trailSettings: this.#getTrailSettings()
		});
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
			this.#getTrailGeometry(),
			position.coords.latitude,
			position.coords.longitude
		);
	}
}
