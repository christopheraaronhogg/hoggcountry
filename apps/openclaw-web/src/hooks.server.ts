import type { Handle } from '@sveltejs/kit';
import { BETA_COOKIE, decodeBetaProfile } from '$lib/beta';

export const handle: Handle = async ({ event, resolve }) => {
  event.locals.betaProfile = decodeBetaProfile(event.cookies.get(BETA_COOKIE));
  return resolve(event);
};
