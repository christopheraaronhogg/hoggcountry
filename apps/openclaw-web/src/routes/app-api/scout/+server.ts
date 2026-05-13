import type { RequestHandler } from './$types';
import { proxyScoutApiToClaw } from '$lib/server/scout-api-alias';

export const GET: RequestHandler = (event) => proxyScoutApiToClaw(event);
export const POST: RequestHandler = (event) => proxyScoutApiToClaw(event);
export const PATCH: RequestHandler = (event) => proxyScoutApiToClaw(event);
export const DELETE: RequestHandler = (event) => proxyScoutApiToClaw(event);
