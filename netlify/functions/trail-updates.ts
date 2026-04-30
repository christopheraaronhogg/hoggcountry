import type { Handler } from '@netlify/functions';
import { connectLambda } from '@netlify/blobs';
import {
  jsonHeaders,
  publicUpdate,
  readUpdates,
  type TrailUpdate,
} from './_trail-updates';

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

function mergeUpdates(remote: TrailUpdate[], legacy: TrailUpdate[], limit: number): TrailUpdate[] {
  const merged = new Map<string, TrailUpdate>();
  for (const update of remote) {
    if (update?.id) merged.set(update.id, update);
  }
  for (const update of legacy) {
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

const handler: Handler = async (event) => {
  connectLambda(event);

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
  const updates = mergeUpdates(remote, legacy, limit);

  return {
    statusCode: 200,
    headers: jsonHeaders({
      'Cache-Control': 'public, max-age=0, s-maxage=60, stale-while-revalidate=300',
      'Netlify-CDN-Cache-Control': 'public, max-age=0, s-maxage=60, stale-while-revalidate=300',
    }),
    body: JSON.stringify({
      updates,
      source: remote.length > 0 ? 'laravel-storage' : 'netlify-blobs-fallback',
    }),
  };
};

export { handler };
