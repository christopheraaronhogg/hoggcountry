import type { PageServerLoad } from './$types';
import { buildDadStatusCards, loadDadTrack, loadDadVideos } from '$lib/server/dad';
import { loadGuideIndex } from '$lib/server/guide';

export const load: PageServerLoad = async () => {
  const [videos, track, guide] = await Promise.all([
    loadDadVideos(3),
    loadDadTrack(),
    loadGuideIndex()
  ]);

  const latestPoint = track.properties?.latestPoint as { coords?: [number, number] } | undefined;
  const latestPointLabel = latestPoint?.coords
    ? `${latestPoint.coords[0].toFixed(3)}, ${latestPoint.coords[1].toFixed(3)}`
    : 'Preview fix';

  return {
    videos,
    track,
    guidePreview: guide.slice(0, 4),
    dadCards: buildDadStatusCards(videos.length, latestPointLabel)
  };
};
