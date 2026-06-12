import { createHash } from 'node:crypto';
import type { Handle } from '@sveltejs/kit';
import {
  authUserToBetaProfile,
  clearAuthCookie,
  loadAuthenticatedUser,
  readAuthToken
} from '$lib/server/auth';

export const handle: Handle = async ({ event, resolve }) => {
  // Canonical host: www resolves to the apex after the Forge cutover.
  if (event.url.hostname.startsWith('www.')) {
    const target = new URL(event.url);
    target.hostname = event.url.hostname.slice(4);
    return new Response(null, { status: 301, headers: { location: target.toString() } });
  }

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

  applySecurityHeaders(response.headers);

  return response;
};

// Mirrors the header set netlify.toml applied while Netlify fronted the
// public site, so protection survives the Forge cutover. CSP additions over
// the Netlify version: tile.openstreetmap.fr (map fallbacks) stays out until
// used; share.garmin.com is framed by /dispatch.
const CONTENT_SECURITY_POLICY = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' blob:",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com",
  "img-src 'self' data: blob: https://hoggcountry.on-forge.com https://i.ytimg.com https://img.youtube.com https://*.tile.openstreetmap.org https://*.tile.opentopomap.org",
  "media-src 'self' blob: https://hoggcountry.on-forge.com",
  "frame-src https://www.youtube-nocookie.com https://share.garmin.com",
  "connect-src 'self' https://www.youtube.com https://api.open-meteo.com https://hoggcountry.on-forge.com https://app.hoggcountry.com wss:",
  "worker-src 'self' blob:"
].join('; ');

function applySecurityHeaders(headers: Headers): void {
  if (!headers.has('x-frame-options')) headers.set('x-frame-options', 'SAMEORIGIN');
  if (!headers.has('x-content-type-options')) headers.set('x-content-type-options', 'nosniff');
  if (!headers.has('referrer-policy')) headers.set('referrer-policy', 'strict-origin-when-cross-origin');
  if (!headers.has('permissions-policy')) {
    headers.set('permissions-policy', 'geolocation=(self), microphone=(), camera=()');
  }
  if (!headers.has('content-security-policy')) {
    headers.set('content-security-policy', CONTENT_SECURITY_POLICY);
  }
}
