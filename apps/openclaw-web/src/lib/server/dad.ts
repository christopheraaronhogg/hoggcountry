import { YT_FEED_URL, LIVE_TRACKING_URL } from '../../../../../src/lib/config';
import { nearestAtMilepost } from './at-location';
import { fetchGarminTrack, type GarminFeatureCollection } from './garmin';
import { fetchYouTubeRSS, type YtVideo } from './youtube';

export interface DadStatusCard {
  readonly title: string;
  readonly detail: string;
  readonly value: string;
}

export interface DadTrailUpdateSummary {
  readonly id: string;
  readonly title: string;
  readonly body: string;
  readonly publishedAt: string | null;
  readonly location: string | null;
  readonly trailMile: number | null;
  readonly mediaType: string | null;
}

export interface DadTrailLocationSummary {
  readonly nearestMile: number;
  readonly scaledTrailMiles: number | null;
  readonly trailLatitude: number;
  readonly trailLongitude: number;
  readonly distanceToTrailMiles: number;
  readonly label: string;
}

export interface DadPilotSummary {
  readonly latestFixLabel: string;
  readonly latestFixAt: string | null;
  readonly latestFixIsPreview: boolean;
  readonly latestTrailLocation: DadTrailLocationSummary | null;
  readonly dispatchCount: number;
  readonly latestDispatchTitle: string | null;
  readonly latestDispatchPublished: string | null;
  readonly trailUpdateCount: number;
  readonly latestTrailUpdate: DadTrailUpdateSummary | null;
}

interface TrailUpdatesApiItem {
  readonly id?: unknown;
  readonly title?: unknown;
  readonly body?: unknown;
  readonly publishedAt?: unknown;
  readonly createdAt?: unknown;
  readonly location?: unknown;
  readonly trailMile?: unknown;
  readonly mediaType?: unknown;
}

interface TrailUpdatesApiResponse {
  readonly data?: {
    readonly updates?: TrailUpdatesApiItem[];
  };
}

export const DEFAULT_TRACK_POINT = {
  latitude: 34.6275,
  longitude: -84.193,
  detail: 'Previewing from the Springer corridor until a fresh Garmin fix comes in.'
} as const;

const TRAIL_UPDATES_CACHE_MS = 60 * 1000;
const TRACK_CACHE_MS = 60 * 1000;
let cachedTrailUpdates: { readonly items: DadTrailUpdateSummary[]; readonly ts: number } | null = null;
let cachedTrack: { readonly track: GarminFeatureCollection; readonly ts: number } | null = null;

export async function loadDadVideos(limit = 8): Promise<YtVideo[]> {
  const items = await fetchYouTubeRSS(YT_FEED_URL);
  return items.slice(0, limit);
}

function previewTrack(): GarminFeatureCollection {
  return {
    type: 'FeatureCollection',
    properties: {
      source: 'preview',
      fetchedAt: new Date().toISOString(),
      latestPoint: {
        coords: [DEFAULT_TRACK_POINT.latitude, DEFAULT_TRACK_POINT.longitude]
      }
    },
    features: [
      {
        type: 'Feature',
        properties: {
          kind: 'point',
          name: 'Preview checkpoint'
        },
        geometry: {
          type: 'Point',
          coordinates: [DEFAULT_TRACK_POINT.longitude, DEFAULT_TRACK_POINT.latitude]
        }
      }
    ]
  };
}

async function attachTrailLocation(track: GarminFeatureCollection): Promise<GarminFeatureCollection> {
  const latestPoint = track.properties?.latestPoint as { coords?: [number, number]; when?: string } | undefined;
  const coords = latestPoint?.coords;

  if (!coords) return track;

  try {
    const [latitude, longitude] = coords;
    const nearest = await nearestAtMilepost(latitude, longitude);
    const latestTrailLocation: DadTrailLocationSummary = {
      nearestMile: nearest.mile,
      scaledTrailMiles: nearest.scaledTrailMiles,
      trailLatitude: nearest.latitude,
      trailLongitude: nearest.longitude,
      distanceToTrailMiles: nearest.distanceMiles,
      label: `AT mile ${nearest.mile.toFixed(1)}`
    };

    return {
      ...track,
      properties: {
        ...track.properties,
        latestTrailLocation
      },
      features: [
        ...track.features,
        {
          type: 'Feature',
          properties: {
            kind: 'snapped-trail-mile',
            name: `${latestTrailLocation.label} · ${nearest.distanceMiles.toFixed(1)} mi from Garmin fix`,
            when: latestPoint.when
          },
          geometry: {
            type: 'Point',
            coordinates: [nearest.longitude, nearest.latitude]
          }
        }
      ]
    };
  } catch {
    return track;
  }
}

export async function loadDadTrack(): Promise<GarminFeatureCollection> {
  if (cachedTrack && Date.now() - cachedTrack.ts < TRACK_CACHE_MS) {
    return cachedTrack.track;
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 4000);

  try {
    const shareId = LIVE_TRACKING_URL.split('/').filter(Boolean).at(-1) ?? 'hoggcountry';
    const track = await attachTrailLocation(await fetchGarminTrack(shareId, { signal: controller.signal }));
    cachedTrack = { track, ts: Date.now() };
    return track;
  } catch {
    const fallback = cachedTrack?.track ?? await attachTrailLocation(previewTrack());
    return fallback;
  } finally {
    clearTimeout(timeoutId);
  }
}

function trailUpdatesApiBase(): string {
  const configured = process.env.TRAIL_UPDATES_API_BASE || process.env.PUBLIC_API_BASE_URL || 'https://hoggcountry.on-forge.com/api/v1';
  return configured.replace(/\/+$/, '');
}

function normalizeText(value: unknown): string {
  return typeof value === 'string' ? value.replace(/\s+/g, ' ').trim() : '';
}

function normalizeNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function normalizeTrailUpdate(update: TrailUpdatesApiItem): DadTrailUpdateSummary | null {
  const id = normalizeText(update.id);
  if (!id) return null;

  return {
    id,
    title: normalizeText(update.title) || 'Trail update',
    body: normalizeText(update.body),
    publishedAt: normalizeText(update.publishedAt) || normalizeText(update.createdAt) || null,
    location: normalizeText(update.location) || null,
    trailMile: normalizeNumber(update.trailMile),
    mediaType: normalizeText(update.mediaType) || null
  };
}

export async function loadDadTrailUpdates(limit = 3): Promise<DadTrailUpdateSummary[]> {
  if (cachedTrailUpdates && Date.now() - cachedTrailUpdates.ts < TRAIL_UPDATES_CACHE_MS) {
    return cachedTrailUpdates.items.slice(0, limit);
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 4000);

  try {
    const response = await fetch(`${trailUpdatesApiBase()}/trail-updates?limit=${limit}`, {
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
        'User-Agent': 'Mozilla/5.0 (compatible; HoggCountryOpenClaw/1.0)'
      }
    });

    if (!response.ok) {
      return cachedTrailUpdates?.items.slice(0, limit) ?? [];
    }

    const payload = (await response.json()) as TrailUpdatesApiResponse;
    const updates = Array.isArray(payload.data?.updates) ? payload.data.updates : [];
    const items = updates.map(normalizeTrailUpdate).filter((entry): entry is DadTrailUpdateSummary => entry !== null);
    cachedTrailUpdates = { items, ts: Date.now() };
    return items.slice(0, limit);
  } catch {
    return cachedTrailUpdates?.items.slice(0, limit) ?? [];
  } finally {
    clearTimeout(timeoutId);
  }
}

export function buildDadStatusCards(videoCount: number, latestPointLabel: string, latestTrailLocation?: DadTrailLocationSummary | null): DadStatusCard[] {
  const trailLocationLabel = latestTrailLocation
    ? `${latestTrailLocation.label} (${latestTrailLocation.distanceToTrailMiles.toFixed(1)} mi off fix)`
    : latestPointLabel;

  return [
    {
      title: 'Guide',
      value: '19 chapters',
      detail: 'Dad’s field guide stays the canonical reference and the example manual for the product.'
    },
    {
      title: 'Dispatches',
      value: `${videoCount}+ clips`,
      detail: 'Daily YouTube dispatches stay in the public funnel so hikers can follow the real trail rhythm.'
    },
    {
      title: 'Latest fix',
      value: trailLocationLabel,
      detail: latestTrailLocation
        ? `Garmin coordinates snap to the nearest AT mile marker; raw fix ${latestPointLabel}.`
        : 'Map status is ready for live Garmin points, with a graceful preview fallback when a fresh fix is not available.'
    }
  ];
}

export async function loadDadPilotSummary(): Promise<DadPilotSummary> {
  const [videos, track, trailUpdates] = await Promise.all([loadDadVideos(6), loadDadTrack(), loadDadTrailUpdates(3)]);
  const latestPoint = track.properties?.latestPoint as { coords?: [number, number]; when?: string } | undefined;
  const latestTrailLocation = (track.properties?.latestTrailLocation as DadTrailLocationSummary | undefined) ?? null;

  return {
    latestFixLabel: latestPoint?.coords
      ? `${latestPoint.coords[0].toFixed(3)}, ${latestPoint.coords[1].toFixed(3)}`
      : 'Preview fix',
    latestFixAt: typeof latestPoint?.when === 'string' ? latestPoint.when : null,
    latestFixIsPreview: !latestPoint?.coords,
    latestTrailLocation,
    dispatchCount: videos.length,
    latestDispatchTitle: videos[0]?.title ?? null,
    latestDispatchPublished: videos[0]?.published ?? null,
    trailUpdateCount: trailUpdates.length,
    latestTrailUpdate: trailUpdates[0] ?? null
  };
}
