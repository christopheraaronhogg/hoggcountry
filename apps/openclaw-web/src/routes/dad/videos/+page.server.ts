import type { PageServerLoad } from './$types';
import { loadDadVideos } from '$lib/server/dad';

export const load: PageServerLoad = async () => {
  return {
    videos: await loadDadVideos(18)
  };
};
