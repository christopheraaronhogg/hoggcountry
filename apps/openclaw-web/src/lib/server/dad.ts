import { YT_FEED_URL, LIVE_TRACKING_URL } from '../../../../../src/lib/config';
import { fetchGarminTrack, type GarminFeatureCollection } from './garmin';
import { fetchYouTubeRSS, type YtVideo } from './youtube';

export interface DadStatusCard {
  readonly title: string;
  readonly detail: string;
  readonly value: string;
}

export interface DadPilotSummary {
  readonly latestFixLabel: string;
  readonly latestFixAt: string | null;
  readonly latestFixIsPreview: boolean;
  readonly dispatchCount: number;
  readonly latestDispatchTitle: string | null;
  readonly latestDispatchPublished: string | null;
}

export const DEFAULT_TRACK_POINT = {
  latitude: 34.6275,
  longitude: -84.193,
  detail: 'Previewing from the Springer corridor until a fresh Garmin fix comes in.'
} as const;

export async function loadDadVideos(limit = 8): Promise<YtVideo[]> {
  const items = await fetchYouTubeRSS(YT_FEED_URL);
  return items.slice(0, limit);
}

export async function loadDadTrack(): Promise<GarminFeatureCollection> {
  try {
    const shareId = LIVE_TRACKING_URL.split('/').filter(Boolean).at(-1) ?? 'hoggcountry';
    return await fetchGarminTrack(shareId);
  } catch {
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
}

export function buildDadStatusCards(videoCount: number, latestPointLabel: string): DadStatusCard[] {
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
      value: latestPointLabel,
      detail: 'Map status is ready for live Garmin points, with a graceful preview fallback when a fresh fix is not available.'
    }
  ];
}

export async function loadDadPilotSummary(): Promise<DadPilotSummary> {
  const [videos, track] = await Promise.all([loadDadVideos(6), loadDadTrack()]);
  const latestPoint = track.properties?.latestPoint as { coords?: [number, number]; when?: string } | undefined;

  return {
    latestFixLabel: latestPoint?.coords
      ? `${latestPoint.coords[0].toFixed(3)}, ${latestPoint.coords[1].toFixed(3)}`
      : 'Preview fix',
    latestFixAt: typeof latestPoint?.when === 'string' ? latestPoint.when : null,
    latestFixIsPreview: !latestPoint?.coords,
    dispatchCount: videos.length,
    latestDispatchTitle: videos[0]?.title ?? null,
    latestDispatchPublished: videos[0]?.published ?? null
  };
}
