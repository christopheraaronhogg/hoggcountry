import type { PageServerLoad } from './$types';
import { buildDadStatusCards, loadDadTrack, loadDadVideos, type DadTrailLocationSummary } from '$lib/server/dad';

export const load: PageServerLoad = async () => {
  const [videos, track] = await Promise.all([loadDadVideos(6), loadDadTrack()]);
  const latestPoint = track.properties?.latestPoint as { coords?: [number, number] } | undefined;
  const latestTrailLocation = (track.properties?.latestTrailLocation as DadTrailLocationSummary | undefined) ?? null;
  const latestPointLabel = latestPoint?.coords
    ? `${latestPoint.coords[0].toFixed(3)}, ${latestPoint.coords[1].toFixed(3)}`
    : 'Preview fix';

  return {
    videos,
    track,
    latestTrailLocation,
    cards: buildDadStatusCards(videos.length, latestPointLabel, latestTrailLocation)
  };
};
