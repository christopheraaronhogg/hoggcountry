import { createHash } from 'node:crypto';
import type { Handle } from '@sveltejs/kit';
import { BETA_COOKIE, decodeBetaProfile } from '$lib/beta';

export const handle: Handle = async ({ event, resolve }) => {
  event.locals.betaProfile = decodeBetaProfile(event.cookies.get(BETA_COOKIE));
  event.locals.workspaceId = event.locals.betaProfile
    ? createHash('sha256').update(event.locals.betaProfile.email.trim().toLowerCase()).digest('hex')
    : null;

  const response = await resolve(event);
  if (event.url.pathname.startsWith('/app') || event.url.pathname.startsWith('/app-api')) {
    response.headers.append('vary', 'cookie');
  }

  return response;
};
