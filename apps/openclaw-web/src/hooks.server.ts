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

// Owner allowlist for the paid LLM lanes (/app-api/claw/*, /app-api/scout/*),
// which spend the node app's OpenAI/opencode key. Mirrors the Laravel
// `services.openai.allowed_emails` guard so ONLY the owner (Dad) can spend the
// key, regardless of who else can authenticate. Empty ⇒ inert (set
// SCOUT_LLM_ALLOWED_EMAILS or SCOUT_LAUNCH_INVITE_EMAIL on the node app).
const LLM_OWNER_ALLOWLIST = (
  process.env.SCOUT_LLM_ALLOWED_EMAILS ||
  process.env.SCOUT_LAUNCH_INVITE_EMAIL ||
  ''
)
  .split(',')
  .map((email) => email.trim().toLowerCase())
  .filter(Boolean);

function isPaidLlmLane(pathname: string): boolean {
  return pathname.startsWith('/app-api/claw/') || pathname.startsWith('/app-api/scout/');
}

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

  // Owner-only spend gate: even an authenticated non-owner cannot drive the paid
  // LLM lanes. Inert when no allowlist is configured.
  if (
    LLM_OWNER_ALLOWLIST.length > 0 &&
    isPaidLlmLane(event.url.pathname) &&
    event.locals.authUser &&
    !LLM_OWNER_ALLOWLIST.includes(event.locals.authUser.email.trim().toLowerCase())
  ) {
    return new Response(JSON.stringify({ error: 'This account is not permitted to use the assistant.' }), {
      status: 403,
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
