import type { PageServerLoad } from './$types';
import { loadDadTrack, type DadTrailLocationSummary } from '$lib/server/dad';
import { LIVE_TRACKING_URL } from '../../../../../src/lib/config';

export const load: PageServerLoad = async () => {
  const track = await loadDadTrack();
  const latestPoint = track.properties?.latestPoint as { coords?: [number, number]; when?: string } | undefined;
  const latestTrailLocation = (track.properties?.latestTrailLocation as DadTrailLocationSummary | undefined) ?? null;
  const trailTotalMiles = 2197.4;
  const currentMile = latestTrailLocation?.scaledTrailMiles ?? latestTrailLocation?.nearestMile ?? 0;
  const progressPercent = Math.max(0, Math.min(100, Math.round((currentMile / trailTotalMiles) * 100)));
  const startDate = new Date('2025-03-01T00:00:00-05:00');
  const today = new Date();
  const daysOnTrail = Math.max(0, Math.floor((today.getTime() - startDate.getTime()) / 86_400_000));
  const trackingId = (() => {
    try {
      const url = new URL(LIVE_TRACKING_URL);
      return url.pathname.replace(/^\/+/, '').split('/')[0] || 'hoggcountry';
    } catch {
      return 'hoggcountry';
    }
  })();

  return {
    liveTrackingUrl: LIVE_TRACKING_URL,
    trackingId,
    trailTotalMiles,
    daysOnTrail,
    startDateLabel: startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    latestFixLabel: latestPoint?.coords
      ? `${latestPoint.coords[0].toFixed(3)}, ${latestPoint.coords[1].toFixed(3)}`
      : 'Preview fix',
    latestFixAt: typeof latestPoint?.when === 'string' ? latestPoint.when : null,
    latestTrailLocation,
    currentMile,
    progressPercent
  };
};
