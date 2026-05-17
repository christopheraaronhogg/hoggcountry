import type { RequestHandler } from './$types';

const OPENAI_APPS_CHALLENGE_TOKEN = 'NPq5X5GKiMrnRshyIekEns0st6nm8cF2Ke_0gWXH5tQ';

export const GET: RequestHandler = () => {
  return new Response(OPENAI_APPS_CHALLENGE_TOKEN, {
    headers: {
      'content-type': 'text/plain; charset=utf-8',
      'cache-control': 'public, max-age=300'
    }
  });
};
