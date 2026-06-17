import { json, type RequestHandler } from '@sveltejs/kit';

import { buildPublicMobileFieldPack } from '$lib/server/public-mobile-field-pack';

export const GET: RequestHandler = async () => {
  return json(await buildPublicMobileFieldPack(), {
    headers: {
      'cache-control': 'public, max-age=60'
    }
  });
};
