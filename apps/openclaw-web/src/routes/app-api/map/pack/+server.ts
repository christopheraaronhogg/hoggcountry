import { json, type RequestHandler } from '@sveltejs/kit';
import { loadTrailMapPack, mapPackHistoryLimit } from '$lib/server/map-pack';

export const prerender = false;

export const GET: RequestHandler = async (event) => {
  const pack = await loadTrailMapPack({
    fetch: globalThis.fetch,
    requestOrigin: event.url.origin,
    historyLimit: mapPackHistoryLimit(event.url.searchParams)
  });

  return json(pack, {
    headers: {
      'cache-control': 'no-store',
      vary: 'cookie'
    }
  });
};
