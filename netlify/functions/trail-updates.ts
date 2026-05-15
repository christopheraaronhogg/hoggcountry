import type { Handler } from '@netlify/functions';
import { connectLambda } from '@netlify/blobs';
import {
  jsonHeaders,
  publicUpdate,
  readUpdates,
  type TrailUpdate,
} from './_trail-updates';
import { YT_UPLOADS_FEED_URL } from '../../src/lib/config';
import { fetchYouTubeRSS, type YtVideo } from '../../src/lib/youtube';

const API_ORIGIN = String(process.env.TRAIL_UPDATES_API_ORIGIN || 'https://hoggcountry.on-forge.com').replace(/\/$/u, '');

type LaravelTrailUpdatesPayload = {
  data?: {
    updates?: TrailUpdate[];
  };
  updates?: TrailUpdate[];
};

function sortStamp(update: TrailUpdate): string {
  return String(update.publishedAt || update.createdAt || '');
}

function clipText(value: string, max = 240): string {
  const cleaned = String(value || '').replace(/\s+/gu, ' ').trim();
  if (cleaned.length <= max) return cleaned;
  return `${cleaned.slice(0, max).trimEnd()}...`;
}

function youtubeUpdate(video: YtVideo): TrailUpdate {
  const published = video.published || new Date().toISOString();
  const isShort = video.kind === 'short';

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
    mediaVariants: undefined,
    externalUrl: video.link,
    sourceLabel: isShort ? 'YouTube Short' : 'YouTube Video',
    sourceType: isShort ? 'youtube_short' : 'youtube_video',
    createdAt: published,
    updatedAt: published,
    publishedAt: published,
  };
}

function mergeUpdates(remote: TrailUpdate[], legacy: TrailUpdate[], youtube: TrailUpdate[], limit: number): TrailUpdate[] {
  const merged = new Map<string, TrailUpdate>();
  for (const update of remote) {
    if (update?.id) merged.set(update.id, update);
  }
  for (const update of legacy) {
    if (update?.id && !merged.has(update.id)) merged.set(update.id, update);
  }
  for (const update of youtube) {
    if (update?.id && !merged.has(update.id)) merged.set(update.id, update);
  }

  return Array.from(merged.values())
    .filter((update) => update.status === 'published')
    .sort((a, b) => sortStamp(b).localeCompare(sortStamp(a)))
    .slice(0, limit);
}

async function fetchLaravelUpdates(limit: number): Promise<TrailUpdate[]> {
  const url = new URL(`${API_ORIGIN}/api/v1/trail-updates`);
  url.searchParams.set('limit', String(limit));

  const response = await fetch(url, {
    headers: {
      Accept: 'application/json',
      'User-Agent': 'HoggCountry-NetlifyTrailUpdates/1.0',
    },
  });

  if (!response.ok) {
    throw new Error(`Laravel trail updates returned ${response.status}`);
  }

  const payload = await response.json() as LaravelTrailUpdatesPayload;
  const updates = payload.data?.updates ?? payload.updates ?? [];

  return Array.isArray(updates) ? updates : [];
}

async function fetchYouTubeUpdates(limit: number): Promise<TrailUpdate[]> {
  const items = await fetchYouTubeRSS(YT_UPLOADS_FEED_URL);

  return items.slice(0, limit).map(youtubeUpdate);
}

const handler: Handler = async (event) => {
  connectLambda(event as unknown as Parameters<typeof connectLambda>[0]);

  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 410,
      headers: jsonHeaders(),
      body: JSON.stringify({ error: 'Trail update writes now use the Laravel storage API. Reload /admin/updates/.' }),
    };
  }

  const limit = Math.max(1, Math.min(50, Number(event.queryStringParameters?.limit || 50)));
  const legacyPayload = await readUpdates().catch(() => ({ updates: [] }));
  const legacy = legacyPayload.updates
    .filter((update) => update.status === 'published')
    .map(publicUpdate);
  const remote = await fetchLaravelUpdates(limit).catch(() => []);
  const youtube = await fetchYouTubeUpdates(limit).catch(() => []);
  const updates = mergeUpdates(remote, legacy, youtube, limit);

  return {
    statusCode: 200,
    headers: jsonHeaders({
      'Cache-Control': 'public, max-age=0, s-maxage=60, stale-while-revalidate=300',
      'Netlify-CDN-Cache-Control': 'public, max-age=0, s-maxage=60, stale-while-revalidate=300',
    }),
    body: JSON.stringify({
      updates,
      source: remote.length > 0 ? 'laravel-storage' : 'netlify-blobs-fallback',
      youtube: youtube.length > 0,
    }),
  };
};

export { handler };
