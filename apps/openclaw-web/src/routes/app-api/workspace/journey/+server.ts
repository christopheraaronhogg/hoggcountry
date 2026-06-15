import type { RequestHandler } from './$types';
import { requireWorkspace, ok } from '$lib/server/workspace-endpoint';
import { getWorkspace } from '$lib/server/workspace-store';
import { loadProfileJourney } from '$lib/server/journey';

export const GET: RequestHandler = async (event) => {
  const { workspaceId, betaProfile } = requireWorkspace(event);
  const workspace = await getWorkspace(workspaceId, betaProfile);
  const profile = workspace.profile;
  const result = await loadProfileJourney(
    profile
      ? { currentMile: profile.currentMile, startDate: profile.startDate, targetPace: profile.targetPace }
      : null,
    { fetch: event.fetch, requestOrigin: event.url.origin }
  );
  return ok({ ...result, trailName: profile?.trailName ?? null });
};
