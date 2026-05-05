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

const EARTH_RADIUS_MILES = 3958.7613;

let milepostsPromise: Promise<NearestAtMilepost[]> | null = null;

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

function repoRootCandidates(): string[] {
  const roots = [process.cwd(), dirname(fileURLToPath(import.meta.url))];
  const candidates = new Set<string>();

  for (const root of roots) {
    let cursor = root;
    for (let index = 0; index < 12; index += 1) {
      candidates.add(join(cursor, 'public/at-mileposts.json'));
      candidates.add(join(cursor, 'dist/at-mileposts.json'));
      candidates.add(join(cursor, '../../public/at-mileposts.json'));
      candidates.add(join(cursor, '../../dist/at-mileposts.json'));

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

  for (const path of [...explicitPath, ...repoRootCandidates()]) {
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
