import type { PageServerLoad } from './$types';
import { loadTrips } from '$lib/server/public-content';

export const load: PageServerLoad = async () => {
  return {
    trips: await loadTrips()
  };
};
