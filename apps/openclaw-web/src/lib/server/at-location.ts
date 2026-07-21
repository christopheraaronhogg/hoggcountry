import { readFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export interface NearestAtMilepost {
  readonly mile: number;
  readonly scaledTrailMiles: number | null;
  readonly latitude: number;
  readonly longitude: number;
  readonly distanceMiles: number;
}

interface AtMilepostRecord {
  readonly mile?: unknown;
  readonly scaledTrailMiles?: unknown;
  readonly lat?: unknown;
  readonly lon?: unknown;
}

interface AtMilepostsPayload {
  readonly mileposts?: unknown;
}

export interface AtTrailSnapGeometry {
  readonly spacingMeters?: number;
  readonly totalMiles?: number;
  readonly m: readonly number[];
  readonly lat: readonly number[];
  readonly lon: readonly number[];
}

const EARTH_RADIUS_MILES = 3958.7613;

let milepostsPromise: Promise<NearestAtMilepost[]> | null = null;
let trailSnapPromise: Promise<AtTrailSnapGeometry> | null = null;

function isFiniteCoordinate(value: unknown, min: number, max: number): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= min && value <= max;
}

function radians(value: number): number {
  return value * Math.PI / 180;
}

function distanceMiles(latitudeA: number, longitudeA: number, latitudeB: number, longitudeB: number): number {
  const latA = radians(latitudeA);
  const latB = radians(latitudeB);
  const deltaLat = radians(latitudeB - latitudeA);
  const deltaLon = radians(longitudeB - longitudeA);
  const sinLat = Math.sin(deltaLat / 2);
  const sinLon = Math.sin(deltaLon / 2);
  const haversine = sinLat * sinLat + Math.cos(latA) * Math.cos(latB) * sinLon * sinLon;
  return 2 * EARTH_RADIUS_MILES * Math.atan2(Math.sqrt(haversine), Math.sqrt(Math.max(0, 1 - haversine)));
}

function assetCandidates(relativePaths: readonly string[]): string[] {
  const roots = [process.cwd(), dirname(fileURLToPath(import.meta.url))];
  const candidates = new Set<string>();

  for (const root of roots) {
    let cursor = root;
    for (let index = 0; index < 12; index += 1) {
      for (const relativePath of relativePaths) candidates.add(join(cursor, relativePath));

      const parent = dirname(cursor);
      if (parent === cursor) break;
      cursor = parent;
    }
  }

  return Array.from(candidates);
}

async function readAtMilepostsPayload(): Promise<AtMilepostsPayload> {
  const explicitPath = process.env.AT_MILEPOSTS_PATH ? [resolve(process.cwd(), process.env.AT_MILEPOSTS_PATH)] : [];
  const attempted: string[] = [];

  for (const path of [
    ...explicitPath,
    ...assetCandidates([
      'public/at-mileposts.json',
      'dist/at-mileposts.json',
      '../../public/at-mileposts.json',
      '../../dist/at-mileposts.json'
    ])
  ]) {
    attempted.push(path);
    try {
      return JSON.parse(await readFile(path, 'utf8')) as AtMilepostsPayload;
    } catch (error) {
      if (error instanceof SyntaxError) {
        throw new Error(`AT milepost data is not valid JSON at ${path}.`);
      }
    }
  }

  throw new Error(`AT milepost data not found. Checked ${attempted.slice(0, 6).join(', ')}${attempted.length > 6 ? ', …' : ''}.`);
}

async function loadTrailSnapGeometry(): Promise<AtTrailSnapGeometry> {
  const explicitPath = process.env.AT_ROUTE_SNAP_PATH
    ? [resolve(process.cwd(), process.env.AT_ROUTE_SNAP_PATH)]
    : [];
  const attempted: string[] = [];

  for (const path of [
    ...explicitPath,
    ...assetCandidates([
      'mobile/static/trail/route-snap-20m.json',
      '../../mobile/static/trail/route-snap-20m.json'
    ])
  ]) {
    attempted.push(path);
    try {
      const geometry = JSON.parse(await readFile(path, 'utf8')) as Partial<AtTrailSnapGeometry>;
      if (
        !Array.isArray(geometry.m) ||
        !Array.isArray(geometry.lat) ||
        !Array.isArray(geometry.lon) ||
        geometry.m.length < 2 ||
        geometry.m.length !== geometry.lat.length ||
        geometry.m.length !== geometry.lon.length
      ) {
        throw new Error(`AT trail snap data has an unexpected shape at ${path}.`);
      }
      return geometry as AtTrailSnapGeometry;
    } catch (error) {
      if (error instanceof SyntaxError) {
        throw new Error(`AT trail snap data is not valid JSON at ${path}.`);
      }
      if (error instanceof Error && error.message.includes('unexpected shape')) throw error;
    }
  }

  throw new Error(
    `AT trail snap data not found. Checked ${attempted.slice(0, 6).join(', ')}${attempted.length > 6 ? ', …' : ''}.`
  );
}

async function loadMileposts(): Promise<NearestAtMilepost[]> {
  const payload = await readAtMilepostsPayload();
  const rawMileposts = Array.isArray(payload.mileposts) ? payload.mileposts : [];
  const mileposts = rawMileposts
    .map((raw): NearestAtMilepost | null => {
      const milepost = raw as AtMilepostRecord;
      if (!isFiniteCoordinate(milepost.lat, -90, 90) || !isFiniteCoordinate(milepost.lon, -180, 180) || typeof milepost.mile !== 'number' || !Number.isFinite(milepost.mile)) {
        return null;
      }

      return {
        mile: milepost.mile,
        scaledTrailMiles: typeof milepost.scaledTrailMiles === 'number' && Number.isFinite(milepost.scaledTrailMiles) ? milepost.scaledTrailMiles : null,
        latitude: milepost.lat,
        longitude: milepost.lon,
        distanceMiles: 0
      };
    })
    .filter((milepost): milepost is NearestAtMilepost => Boolean(milepost));

  if (mileposts.length === 0) {
    throw new Error('AT milepost data did not include usable mileposts.');
  }

  return mileposts;
}

export async function nearestAtMilepost(latitude: number, longitude: number): Promise<NearestAtMilepost> {
  if (!isFiniteCoordinate(latitude, -90, 90) || !isFiniteCoordinate(longitude, -180, 180)) {
    throw new Error('A valid latitude and longitude are required.');
  }

  // Use the same calibrated ~20 m route and segment interpolation as the
  // installed mobile app. The whole-mile skeleton remains a deployment-safe
  // fallback, but it is no longer the normal source for Dad's Journey marker.
  try {
    trailSnapPromise ??= loadTrailSnapGeometry();
    return nearestAtMilepostInGeometry(latitude, longitude, await trailSnapPromise);
  } catch {
    // Older/incomplete releases may not carry the dense asset yet.
  }

  milepostsPromise ??= loadMileposts();
  const mileposts = await milepostsPromise;
  let nearest: NearestAtMilepost | null = null;

  for (const milepost of mileposts) {
    const distance = distanceMiles(latitude, longitude, milepost.latitude, milepost.longitude);
    if (!nearest || distance < nearest.distanceMiles) {
      nearest = { ...milepost, distanceMiles: distance };
    }
  }

  if (!nearest) {
    throw new Error('Could not match that location to the AT milepost data.');
  }

  return nearest;
}

/**
 * Snap onto the closest route segment, interpolating both the calibrated mile
 * and coordinate between the dense samples. Exported so the 20 m accuracy
 * contract can be regression-tested without filesystem or SvelteKit setup.
 */
export function nearestAtMilepostInGeometry(
  latitude: number,
  longitude: number,
  geometry: AtTrailSnapGeometry
): NearestAtMilepost {
  if (!isFiniteCoordinate(latitude, -90, 90) || !isFiniteCoordinate(longitude, -180, 180)) {
    throw new Error('A valid latitude and longitude are required.');
  }

  const { m, lat, lon } = geometry;
  if (m.length < 2 || m.length !== lat.length || m.length !== lon.length) {
    throw new Error('AT trail snap data did not include usable route segments.');
  }

  const toRad = Math.PI / 180;
  const lonScale = EARTH_RADIUS_MILES * toRad * Math.cos(latitude * toRad);
  const latScale = EARTH_RADIUS_MILES * toRad;
  let bestDistanceSquared = Infinity;
  let bestMile = m[0];
  let bestLatitude = lat[0];
  let bestLongitude = lon[0];
  let ax = (lon[0] - longitude) * lonScale;
  let ay = (lat[0] - latitude) * latScale;

  for (let index = 1; index < m.length; index += 1) {
    const bx = (lon[index] - longitude) * lonScale;
    const by = (lat[index] - latitude) * latScale;
    const abx = bx - ax;
    const aby = by - ay;
    const lengthSquared = abx * abx + aby * aby;
    const t = lengthSquared > 0
      ? Math.min(1, Math.max(0, -(ax * abx + ay * aby) / lengthSquared))
      : 0;
    const projectedX = ax + abx * t;
    const projectedY = ay + aby * t;
    const distanceSquared = projectedX * projectedX + projectedY * projectedY;

    if (distanceSquared < bestDistanceSquared) {
      bestDistanceSquared = distanceSquared;
      bestMile = m[index - 1] + (m[index] - m[index - 1]) * t;
      bestLatitude = lat[index - 1] + (lat[index] - lat[index - 1]) * t;
      bestLongitude = lon[index - 1] + (lon[index] - lon[index - 1]) * t;
    }
    ax = bx;
    ay = by;
  }

  if (![bestMile, bestLatitude, bestLongitude, bestDistanceSquared].every(Number.isFinite)) {
    throw new Error('Could not match that location to the AT trail snap data.');
  }

  return {
    mile: bestMile,
    scaledTrailMiles: null,
    latitude: bestLatitude,
    longitude: bestLongitude,
    distanceMiles: Math.sqrt(bestDistanceSquared)
  };
}

export async function atMilepostNearMile(mile: number): Promise<NearestAtMilepost> {
  if (typeof mile !== 'number' || !Number.isFinite(mile)) {
    throw new Error('A valid AT mile is required.');
  }

  try {
    trailSnapPromise ??= loadTrailSnapGeometry();
    const geometry = await trailSnapPromise;
    let low = 0;
    let high = geometry.m.length - 1;
    while (low + 1 < high) {
      const middle = (low + high) >> 1;
      if (geometry.m[middle] <= mile) low = middle;
      else high = middle;
    }
    const index = Math.abs(geometry.m[high] - mile) < Math.abs(geometry.m[low] - mile) ? high : low;
    return {
      mile: geometry.m[index],
      scaledTrailMiles: null,
      latitude: geometry.lat[index],
      longitude: geometry.lon[index],
      distanceMiles: Math.abs(geometry.m[index] - mile)
    };
  } catch {
    // Fall through to the whole-mile skeleton on older releases.
  }

  milepostsPromise ??= loadMileposts();
  const mileposts = await milepostsPromise;
  let nearest: NearestAtMilepost | null = null;

  for (const milepost of mileposts) {
    const distance = Math.abs(milepost.mile - mile);
    if (!nearest || distance < Math.abs(nearest.mile - mile)) {
      nearest = {
        ...milepost,
        distanceMiles: distance
      };
    }
  }

  if (!nearest) {
    throw new Error('Could not match that AT mile to the milepost data.');
  }

  return nearest;
}
