import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { nearestAtMilepost } from '$lib/server/at-location';
import { getWorkspace, setWorkspaceCurrentMile } from '$lib/server/workspace-store';
import { requireWorkspace, ok } from '$lib/server/workspace-endpoint';

const PROFILE_UPDATE_MAX_DISTANCE_MILES = 15;

function finiteCoordinate(value: unknown, min: number, max: number): number | null {
  const numeric = typeof value === 'number' ? value : typeof value === 'string' ? Number(value) : Number.NaN;
  return Number.isFinite(numeric) && numeric >= min && numeric <= max ? numeric : null;
}

function finitePositive(value: unknown): number | null {
  const numeric = typeof value === 'number' ? value : typeof value === 'string' ? Number(value) : Number.NaN;
  return Number.isFinite(numeric) && numeric >= 0 ? numeric : null;
}

export const POST: RequestHandler = async (event) => {
  const { workspaceId, betaProfile } = requireWorkspace(event);
  const payload = (await event.request.json().catch(() => null)) as {
    latitude?: unknown;
    longitude?: unknown;
    accuracyMeters?: unknown;
  } | null;
  const latitude = finiteCoordinate(payload?.latitude, -90, 90);
  const longitude = finiteCoordinate(payload?.longitude, -180, 180);
  const accuracyMeters = finitePositive(payload?.accuracyMeters);

  if (latitude === null || longitude === null) {
    throw error(400, 'Valid latitude and longitude are required.');
  }

  const nearest = await nearestAtMilepost(latitude, longitude);
  const currentWorkspace = await getWorkspace(workspaceId, betaProfile);
  const closeEnoughForProfile = nearest.distanceMiles <= PROFILE_UPDATE_MAX_DISTANCE_MILES;
  const profileUpdated = Boolean(currentWorkspace.profile && closeEnoughForProfile);
  const workspace = profileUpdated
    ? await setWorkspaceCurrentMile(workspaceId, betaProfile, nearest.mile)
    : currentWorkspace;
  const profileUpdateReason = profileUpdated
    ? null
    : currentWorkspace.profile
      ? `GPS fix is ${nearest.distanceMiles.toFixed(1)} miles from the nearest AT milepost, outside the ${PROFILE_UPDATE_MAX_DISTANCE_MILES}-mile update corridor.`
      : 'Create your hiker profile before Scout can update the current mile.';

  return ok({
    location: {
      latitude,
      longitude,
      accuracyMeters,
      nearestMile: nearest.mile,
      scaledTrailMiles: nearest.scaledTrailMiles,
      distanceToTrailMiles: nearest.distanceMiles,
      trailLatitude: nearest.latitude,
      trailLongitude: nearest.longitude
    },
    profileUpdated,
    profileUpdateReason,
    workspace
  });
};
