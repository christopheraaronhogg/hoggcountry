import { createHash } from 'node:crypto';
import type { Handle } from '@sveltejs/kit';
import {
  authUserToBetaProfile,
  clearAuthCookie,
  loadAuthenticatedUser,
  readAuthToken
} from '$lib/server/auth';

export const handle: Handle = async ({ event, resolve }) => {
  event.locals.authToken = readAuthToken(event.cookies);
  event.locals.authUser = await loadAuthenticatedUser(event.locals.authToken, event.fetch);

  if (event.locals.authToken && !event.locals.authUser) {
    clearAuthCookie(event.cookies, event.url);
    event.locals.authToken = null;
  }

  event.locals.betaProfile = event.locals.authUser
    ? authUserToBetaProfile(event.locals.authUser)
    : null;
  event.locals.workspaceId = event.locals.betaProfile
    ? createHash('sha256').update(event.locals.betaProfile.email.trim().toLowerCase()).digest('hex')
    : null;

  if (event.url.pathname.startsWith('/app-api') && !event.locals.authUser) {
    return new Response(JSON.stringify({ error: 'Authentication required.' }), {
      status: 401,
      headers: {
        'content-type': 'application/json; charset=utf-8',
        'cache-control': 'no-store',
        vary: 'cookie'
      }
    });
  }

  const response = await resolve(event);
  if (event.url.pathname.startsWith('/app') || event.url.pathname.startsWith('/app-api')) {
    response.headers.append('vary', 'cookie');
  }

  return response;
};
