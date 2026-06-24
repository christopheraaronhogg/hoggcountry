import { browser } from '$app/environment';

/**
 * Real Appalachian Trail route geometry + elevation, sampled at ~100-metre
 * (~0.06-mile) NOBO resolution from USGS 3DEP (public domain) — ~16x finer than
 * the old 1-mile cut, so gain/loss, grade, and the elevation profile are honest
 * at sub-mile scale. Fetched at runtime (same pattern as the offline KJV Bible).
 * Each point: mile (NOBO), elevation (ft), lat, lon.
 *
 * Powers (a) the Today/Map elevation profile and (b) snapping an on-device GPS
 * fix to a real trail mile. This replaces the former hand-authored "illustrative"
 * elevation fixture.
 */
export interface TrailGeoPoint {
	m: number;
	ft: number;
	lat: number;
	lon: number;
}

export interface ElevationPoint {
	mile: number;
	elevation: number;
	label?: string;
}

const ASSET_URL = '/trail/elevation-100m.json';

let cache: TrailGeoPoint[] | null = null;
let inFlight: Promise<TrailGeoPoint[]> | null = null;

/** Yield to a macrotask so a following heavy sync step lands on its own frame. */
function yieldToMacrotask(): Promise<void> {
	return new Promise((resolve) => {
		if (typeof requestIdleCallback === 'function') requestIdleCallback(() => resolve(), { timeout: 200 });
		else setTimeout(resolve, 0);
	});
}

/** Load (and memoize) the trail geometry. Returns [] when unavailable so callers
 * render an honest empty state rather than crashing. */
export async function loadTrailGeometry(fetchImpl: typeof fetch = fetch): Promise<TrailGeoPoint[]> {
	if (cache) return cache;
	if (!browser) return [];
	inFlight ??= fetchImpl(ASSET_URL)
		.then(async (res) => {
			if (!res.ok) throw new Error(`Trail geometry HTTP ${res.status}`);
			// Yield before the ~1.9 MB synchronous JSON.parse so it can't interleave with
			// the leaflet import/init on a cold-launch-onto-Map boot frame (iOS freeze).
			await yieldToMacrotask();
			return (await res.json()) as TrailGeoPoint[];
		})
		.then((points) => {
			cache = Array.isArray(points) ? points : [];
			return cache;
		})
		.catch((error) => {
			inFlight = null; // allow a retry on the next call
			throw error;
		});
	return inFlight;
}

/**
 * The elevation profile for the window [fromMile, fromMile + miles], projected
 * into the ElevationPoint shape the UI already consumes. Returns [] when no
 * geometry is loaded or the window falls entirely outside the trail.
 */
export function elevationWindow(
	points: TrailGeoPoint[],
	fromMile: number,
	miles: number
): ElevationPoint[] {
	if (!points.length || !Number.isFinite(fromMile)) return [];
	const to = fromMile + miles;
	return points
		.filter((p) => p.m >= fromMile && p.m <= to)
		.map((p) => ({ mile: p.m, elevation: p.ft }));
}

/** Total feet of climb across an ordered elevation window. */
export function climbFeet(profile: ElevationPoint[]): number {
	let gain = 0;
	for (let i = 1; i < profile.length; i += 1) {
		const delta = profile[i].elevation - profile[i - 1].elevation;
		if (delta > 0) gain += delta;
	}
	return Math.round(gain);
}

const EARTH_RADIUS_MILES = 3958.8;

/**
 * Snap a GPS fix to the nearest real trail mile. Uses an equirectangular
 * approximation (accurate at trail scale) over the 1-mile sample points.
 *
 * Returns null when geometry isn't loaded OR when the fix is farther than
 * `maxMiles` from the trail — so an off-trail location (a town hitch, a bad
 * fix) can never be published as a precise on-trail mile. Callers fall back to
 * the last known mile, honestly, rather than fabricating a position.
 */
export function snapToMile(
	points: TrailGeoPoint[],
	lat: number,
	lon: number,
	maxMiles = 2
): number | null {
	if (!points.length || !Number.isFinite(lat) || !Number.isFinite(lon)) return null;
	const toRad = Math.PI / 180;
	const latRad = lat * toRad;
	let bestMile = points[0].m;
	let bestDist = Infinity;
	for (const p of points) {
		const dx = (p.lon - lon) * toRad * Math.cos(latRad);
		const dy = (p.lat - lat) * toRad;
		const dist = dx * dx + dy * dy;
		if (dist < bestDist) {
			bestDist = dist;
			bestMile = p.m;
		}
	}
	const milesFromTrail = Math.sqrt(bestDist) * EARTH_RADIUS_MILES;
	return milesFromTrail <= maxMiles ? bestMile : null;
}
