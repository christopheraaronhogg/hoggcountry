import { createHash } from 'node:crypto';
import type { Handle } from '@sveltejs/kit';
import {
  authUserToBetaProfile,
  clearAuthCookie,
  loadAuthenticatedUser,
  readAuthToken
} from '$lib/server/auth';
import { applySecurityHeaders } from '$lib/server/security-headers';

const APP_HOST = 'app.hoggcountry.com';

export const handle: Handle = async ({ event, resolve }) => {
  // Canonical host: www resolves to the apex after the Forge cutover.
  if (event.url.hostname.startsWith('www.')) {
    const target = new URL(event.url);
    target.hostname = event.url.hostname.slice(4);
    return new Response(null, { status: 301, headers: { location: target.toString() } });
  }

  if (event.url.hostname === APP_HOST && event.url.pathname === '/') {
    const target = new URL(event.url);
    target.pathname = '/app';
    target.search = '';
    return new Response(null, { status: 302, headers: { location: target.toString() } });
  }

  event.locals.authToken = readAuthToken(event.cookies);
  event.locals.authUser = await loadAuthenticatedUser(event.locals.authToken, event.fetch, event.url.origin);

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

  applySecurityHeaders(response.headers);

  return response;
};
