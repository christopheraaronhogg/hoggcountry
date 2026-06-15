import type { PageServerLoad } from './$types';
import { loadJourney } from '$lib/server/journey';

export const load: PageServerLoad = async ({ fetch, url }) => {
  const journey = await loadJourney({ fetch, requestOrigin: url.origin });
  return { journey };
};
