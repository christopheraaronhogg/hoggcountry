import type { PageServerLoad } from './$types';
import { loadDadVideos } from '$lib/server/dad';
import { loadJourneySummary } from '$lib/server/journey';
import { isEnabled } from '../../../../src/lib/features';

export const load: PageServerLoad = async () => {
  const showVideos = isEnabled('YOUTUBE_RSS');

  const [videos, journey] = await Promise.all([
    showVideos ? loadDadVideos(18) : Promise.resolve([]),
    loadJourneySummary()
  ]);

  return { videos, journey };
};
