import type { PageServerLoad } from './$types';
import { loadDadTrack } from '$lib/server/dad';

export const load: PageServerLoad = async () => {
  return {
    track: await loadDadTrack()
  };
};
