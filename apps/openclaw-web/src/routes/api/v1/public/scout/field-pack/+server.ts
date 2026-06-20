import { json, type RequestHandler } from '@sveltejs/kit';

import { buildPublicMobileFieldPack } from '$lib/server/public-mobile-field-pack';

const CORS_HEADERS = {
  'access-control-allow-origin': '*',
  'access-control-allow-methods': 'GET, OPTIONS',
  'access-control-allow-headers': 'Accept'
};

// `?mile=623.4&direction=NOBO&personal=1` returns a pack centered on the caller's
// own mile, stripped of Dad/pilot framing (the mobile "My hike" flow). With no
// params it returns the default Dad pilot pack, fully backward-compatible.
export const GET: RequestHandler = async ({ url }) => {
  const mileParam = url.searchParams.get('mile');
  const mile = mileParam !== null && mileParam.trim() !== '' ? Number(mileParam) : undefined;
  const directionParam = url.searchParams.get('direction');
  const direction = directionParam === 'SOBO' ? 'SOBO' : directionParam === 'NOBO' ? 'NOBO' : undefined;
  const personal = url.searchParams.get('personal') === '1' && typeof mile === 'number' && Number.isFinite(mile);

  const pack = await buildPublicMobileFieldPack(new Date(), { mile, direction, personal });

  return json(pack, {
    headers: {
      'cache-control': personal ? 'private, max-age=30' : 'public, max-age=60',
      ...CORS_HEADERS
    }
  });
};

export const OPTIONS: RequestHandler = async () => {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
};
