import type { PageServerLoad } from './$types';
import { loadDadVideos } from '$lib/server/dad';
import { isEnabled } from '../../../../src/lib/features';

export const load: PageServerLoad = async () => {
  const showVideos = isEnabled('YOUTUBE_RSS');

  return {
    videos: showVideos ? await loadDadVideos(8) : []
  };
};
