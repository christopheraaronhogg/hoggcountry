import type { RequestHandler } from './$types';
import type { RequestEvent } from '@sveltejs/kit';
import { proxyScoutApiToClaw } from '$lib/server/scout-api-alias';

function proxy(event: RequestEvent<{ path: string }>) {
  return proxyScoutApiToClaw(event, event.params.path);
}

export const GET: RequestHandler = proxy;
export const POST: RequestHandler = proxy;
export const PATCH: RequestHandler = proxy;
export const DELETE: RequestHandler = proxy;
