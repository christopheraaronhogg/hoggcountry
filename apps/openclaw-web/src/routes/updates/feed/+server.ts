import { json, type RequestHandler } from '@sveltejs/kit';
import { loadPublicTrailUpdates, trailUpdatesLimit } from '$lib/server/trail-updates';

export const GET: RequestHandler = async ({ url }) => {
  const payload = await loadPublicTrailUpdates(url.origin, trailUpdatesLimit(url.searchParams));

  return json(
    payload,
    {
      headers: {
        'Cache-Control': 'public, max-age=0, s-maxage=60, stale-while-revalidate=300'
      }
    }
  );
};
