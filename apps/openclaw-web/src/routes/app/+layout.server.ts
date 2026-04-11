import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals }) => {
  if (!locals.betaProfile) {
    throw redirect(302, '/signup');
  }

  return {
    betaProfile: locals.betaProfile
  };
};
