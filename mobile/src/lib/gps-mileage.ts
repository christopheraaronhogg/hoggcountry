import { clampMile } from './scout/hike-profile.ts';
import type { PrivacySettings, TrailSettings } from './types';

export const AUTO_GPS_MIN_INTERVAL_MS = 10 * 60 * 1000;
export const AUTO_GPS_MIN_DELTA_MILES = 0.2;
export const AUTO_GPS_FORCE_DELTA_MILES = 1;

export function shouldAutoGpsWatch(input: {
	browserAvailable: boolean;
	hasGeolocation: boolean;
	trailPointCount: number;
	privacySettings: Pick<PrivacySettings, 'sharePreciseLocation'>;
	trailSettings: Pick<TrailSettings, 'autoLogMileage'>;
}): boolean {
	return Boolean(
		input.browserAvailable &&
			input.hasGeolocation &&
			input.trailPointCount > 0 &&
			input.privacySettings.sharePreciseLocation &&
			input.trailSettings.autoLogMileage
	);
}

export function nextAutoGpsAdoption(input: {
	snappedMile: number | null;
	currentMile: number;
	lastAutoGpsAt: number;
	nowMs?: number;
	minIntervalMs?: number;
	minDeltaMiles?: number;
	forceDeltaMiles?: number;
}): { mile: number; recordedAt: number } | null {
	if (input.snappedMile === null) return null;
	const mile = clampMile(input.snappedMile);
	const delta = Math.abs(mile - input.currentMile);
	const minDeltaMiles = input.minDeltaMiles ?? AUTO_GPS_MIN_DELTA_MILES;
	if (delta < minDeltaMiles) return null;

	const now = input.nowMs ?? Date.now();
	const minIntervalMs = input.minIntervalMs ?? AUTO_GPS_MIN_INTERVAL_MS;
	const forceDeltaMiles = input.forceDeltaMiles ?? AUTO_GPS_FORCE_DELTA_MILES;
	if (now - input.lastAutoGpsAt < minIntervalMs && delta < forceDeltaMiles) return null;

	return { mile, recordedAt: now };
}

export type ManualGpsMileResult = { ok: true; mile: number } | { ok: false; reason: string };

export function resolveManualGpsMile(input: {
	sharePreciseLocation: boolean;
	hasPosition: boolean;
	snappedMile: number | null;
	trailGeometryLoaded: boolean;
}): ManualGpsMileResult {
	if (!input.sharePreciseLocation) {
		return {
			ok: false,
			reason: 'Turn on Precise location first, then I can snap your GPS fix to a trail mile.'
		};
	}
	if (!input.hasPosition) {
		return { ok: false, reason: "Couldn't get a GPS fix. Try again with a clearer view of the sky." };
	}
	if (input.snappedMile === null) {
		return {
			ok: false,
			reason: input.trailGeometryLoaded
				? "Your GPS fix is more than 2 miles from the AT route, so I won't guess a trail mile."
				: 'The trail map is still loading — try again in a moment.'
		};
	}
	return { ok: true, mile: clampMile(input.snappedMile) };
}
