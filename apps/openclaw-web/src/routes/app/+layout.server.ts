import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';
import { isScoutAdminProfile } from '$lib/server/scout-admin';

export const load: LayoutServerLoad = async ({ locals }) => {
  if (!locals.betaProfile) {
    throw redirect(302, '/signup');
  }

  return {
    betaProfile: locals.betaProfile,
    isAdmin: isScoutAdminProfile(locals.betaProfile)
  };
};
