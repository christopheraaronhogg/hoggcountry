import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { loadDadTrack } from '$lib/server/dad';
import { fetchGarminTrack } from '$lib/server/garmin';
import { LIVE_TRACKING_URL } from '../../../../../../../src/lib/config';

function liveTrackingId(): string {
  try {
    const url = new URL(LIVE_TRACKING_URL);
    return url.pathname.replace(/^\/+/u, '').split('/')[0] || 'hoggcountry';
  } catch {
    return 'hoggcountry';
  }
}

function validateShareId(value: string): string {
  const id = value.trim() || liveTrackingId();
  if (!/^[a-zA-Z0-9_-]{2,64}$/u.test(id)) {
    throw error(400, 'Invalid id');
  }
  return id;
}

export const GET: RequestHandler = async ({ url }) => {
  const id = validateShareId(url.searchParams.get('id') ?? liveTrackingId());
  const track = id === liveTrackingId() ? await loadDadTrack() : await fetchGarminTrack(id);

  return json(track, {
    headers: {
      'Content-Type': 'application/geo+json; charset=utf-8',
      'Cache-Control': 'no-store'
    }
  });
};
