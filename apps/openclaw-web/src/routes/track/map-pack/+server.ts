import { json, type RequestHandler } from '@sveltejs/kit';
import { loadTrailMapPack, mapPackHistoryLimit } from '$lib/server/map-pack';

export const prerender = false;

// Public, non-credentialed trail data. The legacy Netlify-hosted site at
// hoggcountry.com fetches this cross-origin until the Forge cutover.
const CORS_HEADERS = {
  'access-control-allow-origin': '*',
  'access-control-allow-methods': 'GET, OPTIONS',
  'access-control-allow-headers': 'Accept'
};

export const GET: RequestHandler = async (event) => {
  const pack = await loadTrailMapPack({
    fetch: globalThis.fetch,
    requestOrigin: event.url.origin,
    historyLimit: mapPackHistoryLimit(event.url.searchParams)
  });

  return json(pack, {
    headers: {
      'cache-control': 'no-store',
      ...CORS_HEADERS
    }
  });
};

export const OPTIONS: RequestHandler = async () => {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
};
