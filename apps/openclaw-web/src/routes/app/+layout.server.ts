import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';
import { authRedirectFor } from '$lib/server/auth';
import { isScoutAdminProfile } from '$lib/server/scout-admin';

export const load: LayoutServerLoad = async (event) => {
  if (!event.locals.authUser || !event.locals.betaProfile) {
    throw redirect(302, authRedirectFor(event));
  }

  return {
    authUser: event.locals.authUser,
    betaProfile: event.locals.betaProfile,
    isAdmin: isScoutAdminProfile(event.locals.betaProfile)
  };
};
