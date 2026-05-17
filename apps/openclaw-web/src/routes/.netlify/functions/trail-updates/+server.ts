import { json, type RequestHandler } from '@sveltejs/kit';
import { YT_SHORTS_FEED_URL, YT_UPLOADS_FEED_URL } from '../../../../../../../src/lib/config';
import { fetchYouTubeRSS, type YtVideo } from '$lib/server/youtube';

type SourceType = 'trail_update' | 'youtube_video' | 'youtube_short' | 'post';

type TrailUpdate = {
  id: string;
  title: string;
  body: string;
  location: string;
  trailMile: string | number;
  status: 'draft' | 'published';
  featured: boolean;
  mediaKey: string | null;
  mediaName: string | null;
  mediaType: string | null;
  mediaSize?: number | null;
  mediaUrl: string | null;
  thumbnailUrl?: string | null;
  previewUrl?: string | null;
  mediaVariants?: Record<string, unknown>;
  externalUrl?: string | null;
  sourceLabel?: string | null;
  sourceType?: SourceType;
  createdAt: string;
  updatedAt: string;
  publishedAt: string | null;
};

type LaravelTrailUpdatesPayload = {
  data?: {
    updates?: TrailUpdate[];
  };
  updates?: TrailUpdate[];
};

function apiBaseFor(requestOrigin: string): string {
  const configured = (process.env.TRAIL_UPDATES_API_BASE || process.env.PUBLIC_API_BASE_URL || '').trim();

  if (configured) {
    const normalized = configured.replace(/\/+$/u, '');
    if (/^https?:\/\//iu.test(normalized)) return normalized;
    return new URL(normalized.startsWith('/') ? normalized : `/${normalized}`, requestOrigin).toString().replace(/\/+$/u, '');
  }

  if (process.env.NODE_ENV === 'development') {
    return 'http://127.0.0.1:8000/api/v1';
  }

  return new URL('/api/v1', requestOrigin).toString().replace(/\/+$/u, '');
}

function limitFor(url: URL): number {
  const raw = Number(url.searchParams.get('limit') ?? 50);
  if (!Number.isFinite(raw)) return 50;
  return Math.max(1, Math.min(50, Math.floor(raw)));
}

function sortStamp(update: TrailUpdate): string {
  return String(update.publishedAt || update.createdAt || '');
}

function clipText(value: string, max = 240): string {
  const cleaned = String(value || '').replace(/\s+/gu, ' ').trim();
  if (cleaned.length <= max) return cleaned;
  return `${cleaned.slice(0, max).trimEnd()}...`;
}

function youtubeUpdate(video: YtVideo, kindOverride?: YtVideo['kind']): TrailUpdate {
  const published = video.published || new Date().toISOString();
  const isShort = (kindOverride ?? video.kind) === 'short';

  return {
    id: `youtube-${video.id}`,
    title: video.title || (isShort ? 'YouTube Short' : 'YouTube video'),
    body: clipText(video.description),
    location: '',
    trailMile: '',
    status: 'published',
    featured: false,
    mediaKey: null,
    mediaName: null,
    mediaType: 'image/jpeg',
    mediaUrl: video.thumbnail || null,
    thumbnailUrl: video.thumbnail || null,
    previewUrl: video.thumbnail || null,
    externalUrl: video.link,
    sourceLabel: isShort ? 'YouTube Short' : 'YouTube Video',
    sourceType: isShort ? 'youtube_short' : 'youtube_video',
    createdAt: published,
    updatedAt: published,
    publishedAt: published
  };
}

function mergeUpdates(remote: TrailUpdate[], youtube: TrailUpdate[], limit: number): TrailUpdate[] {
  const merged = new Map<string, TrailUpdate>();

  for (const update of remote) {
    if (update?.id) merged.set(update.id, update);
  }

  for (const update of youtube) {
    if (update?.id && !merged.has(update.id)) merged.set(update.id, update);
  }

  return Array.from(merged.values())
    .filter((update) => update.status === 'published')
    .sort((a, b) => sortStamp(b).localeCompare(sortStamp(a)))
    .slice(0, limit);
}

async function fetchLaravelUpdates(apiBase: string, limit: number): Promise<TrailUpdate[]> {
  const url = new URL(`${apiBase}/trail-updates`);
  url.searchParams.set('limit', String(limit));

  const response = await fetch(url, {
    headers: {
      Accept: 'application/json',
      'User-Agent': 'HoggCountry-SvelteKitTrailUpdates/1.0'
    }
  });

  if (!response.ok) {
    throw new Error(`Laravel trail updates returned ${response.status}`);
  }

  const payload = (await response.json()) as LaravelTrailUpdatesPayload;
  const updates = payload.data?.updates ?? payload.updates ?? [];

  return Array.isArray(updates) ? updates : [];
}

async function fetchYouTubeUpdates(limit: number): Promise<TrailUpdate[]> {
  const [uploads, shorts] = await Promise.all([
    fetchYouTubeRSS(YT_UPLOADS_FEED_URL).catch(() => []),
    fetchYouTubeRSS(YT_SHORTS_FEED_URL).catch(() => [])
  ]);

  const merged = new Map<string, TrailUpdate>();
  for (const short of shorts) {
    merged.set(short.id, youtubeUpdate(short, 'short'));
  }

  for (const upload of uploads) {
    if (!merged.has(upload.id)) {
      merged.set(upload.id, youtubeUpdate(upload));
    }
  }

  return Array.from(merged.values())
    .sort((a, b) => sortStamp(b).localeCompare(sortStamp(a)))
    .slice(0, limit);
}

export const GET: RequestHandler = async ({ url }) => {
  const limit = limitFor(url);
  const [remote, youtube] = await Promise.all([
    fetchLaravelUpdates(apiBaseFor(url.origin), limit).catch(() => []),
    fetchYouTubeUpdates(limit).catch(() => [])
  ]);
  const updates = mergeUpdates(remote, youtube, limit);

  return json(
    {
      updates,
      source: remote.length > 0 ? 'laravel-storage' : 'youtube-fallback',
      youtube: youtube.length > 0
    },
    {
      headers: {
        'Cache-Control': 'public, max-age=0, s-maxage=60, stale-while-revalidate=300'
      }
    }
  );
};
