import type { Handler, HandlerEvent } from '@netlify/functions';

import { fetchYouTubeRSS } from '../../src/lib/youtube';
import { YT_CHANNEL_FEED_URL, YT_PLAYLIST_FEED_URL } from '../../src/lib/config';

function jsonHeaders(extra: Record<string, string> = {}): Record<string, string> {
  return { 'Content-Type': 'application/json; charset=utf-8', ...extra };
}

function isSafeId(id: string): boolean {
  // channel_id / playlist_id are URL-safe base64-ish strings (letters/numbers/_-)
  // Keep it strict to avoid SSRF via feedUrl.
  return /^[a-zA-Z0-9_-]{2,128}$/.test(id);
}

const handler: Handler = async (event: HandlerEvent) => {
  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, headers: jsonHeaders(), body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  const mode = (event.queryStringParameters?.mode || 'channel').toLowerCase();

  // Allow optional overrides for testing/preview without redeploy.
  const channelId = (event.queryStringParameters?.channel_id || '').trim();
  const playlistId = (event.queryStringParameters?.playlist_id || '').trim();

  let feedUrl: string | null = null;
  if (mode === 'playlist') {
    if (playlistId && !isSafeId(playlistId)) {
      return { statusCode: 400, headers: jsonHeaders(), body: JSON.stringify({ error: 'Invalid playlist_id' }) };
    }
    feedUrl = playlistId
      ? `https://www.youtube.com/feeds/videos.xml?playlist_id=${playlistId}`
      : YT_PLAYLIST_FEED_URL;
  } else {
    if (channelId && !isSafeId(channelId)) {
      return { statusCode: 400, headers: jsonHeaders(), body: JSON.stringify({ error: 'Invalid channel_id' }) };
    }
    feedUrl = channelId
      ? `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`
      : YT_CHANNEL_FEED_URL;
  }

  if (!feedUrl) {
    return { statusCode: 400, headers: jsonHeaders(), body: JSON.stringify({ error: 'No feed configured' }) };
  }

  try {
    const items = await fetchYouTubeRSS(feedUrl);

    return {
      statusCode: 200,
      headers: jsonHeaders({
        // CDN caching: keep it feeling "live", but don't hammer YouTube.
        'Cache-Control': 'public, max-age=0, s-maxage=300, stale-while-revalidate=86400',
        'Netlify-CDN-Cache-Control': 'public, max-age=0, s-maxage=300, stale-while-revalidate=86400',
      }),
      body: JSON.stringify({ items }),
    };
  } catch (err: any) {
    return {
      statusCode: 500,
      headers: jsonHeaders(),
      body: JSON.stringify({ error: 'Internal error', details: String(err?.message || err) }),
    };
  }
};

export { handler };
