import type { PageServerLoad } from './$types';
import { loadDadVideos } from '$lib/server/dad';
import { facts, getMeta } from '../../../../src/data/trailFacts';
import { isEnabled } from '../../../../src/lib/features';
import { WORKSPACE_URL } from '../../../../src/lib/config';

export const load: PageServerLoad = async () => {
  const showVideos = isEnabled('YOUTUBE_RSS');
  const videos = showVideos ? await loadDadVideos(3) : [];
  const meta = getMeta();

  return {
    showVideos,
    videos,
    workspaceUrl: WORKSPACE_URL,
    manualBuilderUrl: `${WORKSPACE_URL}/app/manual`,
    trailStats: {
      totalMiles: facts.trail.total_miles.value,
      shelterCount: facts.trail.shelter_count.value,
      lastVerified: meta.last_verified
    }
  };
};
