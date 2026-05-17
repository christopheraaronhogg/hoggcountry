import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals }) => {
  return {
    authUser: locals.authUser,
    betaProfile: locals.betaProfile
  };
};
