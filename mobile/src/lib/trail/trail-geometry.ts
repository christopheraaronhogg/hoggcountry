import type { TrailDirection } from '@hoggcountry/trail-data/trail-direction';

/**
 * Real Appalachian Trail route geometry + elevation. The elevation/profile
 * asset stays at ~100-metre (~0.06-mile) resolution from USGS 3DEP (public
 * domain), while GPS snapping uses a separate ~20-metre route index. Both are
 * calibrated through src/data/at-mile-calibration.json into the same 2197.4-mile
 * official frame as public/at-mileposts.json.
 *
 * The coordinates stay on the open OSM-derived centerline. The 20-m index is
 * generated from source data, not copied from proprietary guide/app tables.
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

export interface TrailSnapGeometry {
	spacingMeters?: number;
	totalMiles?: number;
	m: number[];
	lat: number[];
	lon: number[];
}

export type TrailSnapInput = TrailGeoPoint[] | TrailSnapGeometry | null | undefined;

const ELEVATION_ASSET_URL = '/trail/elevation-100m.json';
const SNAP_ASSET_URL = '/trail/route-snap-20m.json';
const browser = typeof window !== 'undefined' && typeof document !== 'undefined';

let elevationCache: TrailGeoPoint[] | null = null;
let elevationInFlight: Promise<TrailGeoPoint[]> | null = null;
let snapCache: TrailSnapGeometry | null = null;
let snapInFlight: Promise<TrailSnapGeometry | null> | null = null;

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
	if (elevationCache) return elevationCache;
	if (!browser) return [];
	elevationInFlight ??= fetchImpl(ELEVATION_ASSET_URL)
		.then(async (res) => {
			if (!res.ok) throw new Error(`Trail geometry HTTP ${res.status}`);
			// Yield before the ~1.9 MB synchronous JSON.parse so it can't interleave with
			// the leaflet import/init on a cold-launch-onto-Map boot frame (iOS freeze).
			await yieldToMacrotask();
			return (await res.json()) as TrailGeoPoint[];
		})
		.then((points) => {
			elevationCache = Array.isArray(points) ? points : [];
			return elevationCache;
		})
		.catch((error) => {
			elevationInFlight = null; // allow a retry on the next call
			throw error;
		});
	return elevationInFlight;
}

function normalizeSnapGeometry(value: unknown): TrailSnapGeometry {
	const geometry = value as Partial<TrailSnapGeometry>;
	if (
		!geometry ||
		typeof geometry !== 'object' ||
		!Array.isArray(geometry.m) ||
		!Array.isArray(geometry.lat) ||
		!Array.isArray(geometry.lon) ||
		geometry.m.length !== geometry.lat.length ||
		geometry.m.length !== geometry.lon.length
	) {
		throw new Error('Trail snap geometry has an unexpected shape');
	}
	return {
		spacingMeters: Number(geometry.spacingMeters) || 0,
		totalMiles: Number(geometry.totalMiles) || 0,
		m: geometry.m,
		lat: geometry.lat,
		lon: geometry.lon
	};
}

/** Load (and memoize) the dense GPS snap index. It is lazy so app boot and the
 * map/elevation profile do not parse the larger route asset unless a location
 * feature actually needs it. */
export async function loadTrailSnapGeometry(
	fetchImpl: typeof fetch = fetch
): Promise<TrailSnapGeometry | null> {
	if (snapCache) return snapCache;
	if (!browser) return null;
	snapInFlight ??= fetchImpl(SNAP_ASSET_URL)
		.then(async (res) => {
			if (!res.ok) throw new Error(`Trail snap geometry HTTP ${res.status}`);
			// The 20-m snap index is ~4.8 MB raw; always give the UI a frame before
			// JSON.parse on iOS.
			await yieldToMacrotask();
			return normalizeSnapGeometry(await res.json());
		})
		.then((geometry) => {
			snapCache = geometry;
			return snapCache;
		})
		.catch((error) => {
			snapInFlight = null;
			throw error;
		});
	return snapInFlight;
}

/**
 * The elevation profile for the window [fromMile, fromMile + miles], projected
 * into the ElevationPoint shape the UI already consumes. Returns [] when no
 * geometry is loaded or the window falls entirely outside the trail.
 */
export function elevationWindow(
	points: TrailGeoPoint[],
	fromMile: number,
	miles: number,
	direction: TrailDirection = 'NOBO'
): ElevationPoint[] {
	if (!points.length || !Number.isFinite(fromMile) || !Number.isFinite(miles) || miles < 0) return [];
	const toMile = direction === 'SOBO' ? fromMile - miles : fromMile + miles;
	const minMile = Math.min(fromMile, toMile);
	const maxMile = Math.max(fromMile, toMile);
	const window = points
		.filter((p) => p.m >= minMile && p.m <= maxMile)
		.map((p) => ({ mile: p.m, elevation: p.ft }));
	return direction === 'SOBO' ? window.reverse() : window;
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
 * approximation (accurate at trail scale) and projects onto each line segment,
 * so mile values are interpolated between known calibrated points instead of
 * jumping to the nearest stored sample.
 *
 * Returns null when geometry isn't loaded OR when the fix is farther than
 * `maxMiles` from the trail — so an off-trail location (a town hitch, a bad
 * fix) can never be published as a precise on-trail mile. Callers fall back to
 * the last known mile, honestly, rather than fabricating a position.
 */
export function snapToMile(
	points: TrailSnapInput,
	lat: number,
	lon: number,
	maxMiles = 2
): number | null {
	if (!points || !Number.isFinite(lat) || !Number.isFinite(lon)) return null;
	return Array.isArray(points)
		? snapPointArrayToMile(points, lat, lon, maxMiles)
		: snapColumnGeometryToMile(points, lat, lon, maxMiles);
}

function snapPointArrayToMile(
	points: TrailGeoPoint[],
	lat: number,
	lon: number,
	maxMiles: number
): number | null {
	if (!points.length) return null;
	const toRad = Math.PI / 180;
	const lonScale = EARTH_RADIUS_MILES * toRad * Math.cos(lat * toRad);
	const latScale = EARTH_RADIUS_MILES * toRad;
	const limit = Math.max(0, maxMiles);
	const limitSquared = limit * limit;
	let bestMile = points[0].m;
	let bestDistSquared = Infinity;
	let ax = (points[0].lon - lon) * lonScale;
	let ay = (points[0].lat - lat) * latScale;

	if (points.length === 1) {
		bestDistSquared = ax * ax + ay * ay;
		return bestDistSquared <= limitSquared ? bestMile : null;
	}

	for (let i = 1; i < points.length; i += 1) {
		const bx = (points[i].lon - lon) * lonScale;
		const by = (points[i].lat - lat) * latScale;
		const abx = bx - ax;
		const aby = by - ay;
		const lenSquared = abx * abx + aby * aby;
		const t =
			lenSquared > 0
				? Math.min(1, Math.max(0, -(ax * abx + ay * aby) / lenSquared))
				: 0;
		const px = ax + abx * t;
		const py = ay + aby * t;
		const distSquared = px * px + py * py;
		if (distSquared < bestDistSquared) {
			bestDistSquared = distSquared;
			bestMile = points[i - 1].m + (points[i].m - points[i - 1].m) * t;
		}
		ax = bx;
		ay = by;
	}
	return bestDistSquared <= limitSquared ? bestMile : null;
}

function snapColumnGeometryToMile(
	geometry: TrailSnapGeometry,
	lat: number,
	lon: number,
	maxMiles: number
): number | null {
	const { m, lat: lats, lon: lons } = geometry;
	if (m.length === 0 || m.length !== lats.length || m.length !== lons.length) return null;
	const toRad = Math.PI / 180;
	const lonScale = EARTH_RADIUS_MILES * toRad * Math.cos(lat * toRad);
	const latScale = EARTH_RADIUS_MILES * toRad;
	const limit = Math.max(0, maxMiles);
	const limitSquared = limit * limit;
	let bestMile = m[0];
	let bestDistSquared = Infinity;
	let ax = (lons[0] - lon) * lonScale;
	let ay = (lats[0] - lat) * latScale;

	if (m.length === 1) {
		bestDistSquared = ax * ax + ay * ay;
		return bestDistSquared <= limitSquared ? bestMile : null;
	}

	for (let i = 1; i < m.length; i += 1) {
		const bx = (lons[i] - lon) * lonScale;
		const by = (lats[i] - lat) * latScale;
		const abx = bx - ax;
		const aby = by - ay;
		const lenSquared = abx * abx + aby * aby;
		const t =
			lenSquared > 0
				? Math.min(1, Math.max(0, -(ax * abx + ay * aby) / lenSquared))
				: 0;
		const px = ax + abx * t;
		const py = ay + aby * t;
		const distSquared = px * px + py * py;
		if (distSquared < bestDistSquared) {
			bestDistSquared = distSquared;
			bestMile = m[i - 1] + (m[i] - m[i - 1]) * t;
		}
		ax = bx;
		ay = by;
	}
	return bestDistSquared <= limitSquared ? bestMile : null;
}
