import { YT_FEED_URL, LIVE_TRACKING_URL } from '../../../../../src/lib/config';
import { fetchGarminTrack, type GarminFeatureCollection } from './garmin';
import { fetchYouTubeRSS, type YtVideo } from './youtube';

export interface DadStatusCard {
  readonly title: string;
  readonly detail: string;
  readonly value: string;
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
