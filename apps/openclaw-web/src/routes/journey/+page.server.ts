import type { PageServerLoad } from './$types';
import { loadJourney, HIKE_START_DATE } from '$lib/server/journey';

// Graceful preview if a reference file/backend is unavailable, so /journey
// degrades to the "starts soon" shell instead of a 500.
const PREVIEW_JOURNEY = {
  summary: {
    currentMile: 0,
    totalMiles: 2197.4,
    percentComplete: 0,
    milesHiked: 0,
    milesRemaining: 2197.4,
    currentStateName: null,
    daysOnTrail: 0,
    paceMilesPerDay: null,
    startDate: HIKE_START_DATE,
    latestFixLabel: null,
    latestFixAt: null,
    isPreview: true
  },
  states: [],
  elevation: { points: [], minFt: 0, maxFt: 0 }
};

export const load: PageServerLoad = async ({ fetch, url }) => {
  try {
    const journey = await loadJourney({ fetch, requestOrigin: url.origin });
    return { journey };
  } catch {
    return { journey: PREVIEW_JOURNEY };
  }
};
