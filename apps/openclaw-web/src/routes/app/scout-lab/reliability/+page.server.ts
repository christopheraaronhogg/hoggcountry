import type { PageServerLoad } from './$types';
import { loadScoutReliabilityData } from '$lib/server/scout-reliability';

export const load: PageServerLoad = async () => {
  return loadScoutReliabilityData();
};
