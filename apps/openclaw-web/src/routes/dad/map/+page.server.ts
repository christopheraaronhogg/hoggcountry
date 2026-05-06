import type { PageServerLoad } from './$types';
import { loadDadTrack, type DadTrailLocationSummary } from '$lib/server/dad';

export const load: PageServerLoad = async () => {
  const track = await loadDadTrack();

  return {
    track,
    latestTrailLocation: (track.properties?.latestTrailLocation as DadTrailLocationSummary | undefined) ?? null
  };
};
