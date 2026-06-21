import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { requireWorkspace, ok } from '$lib/server/workspace-endpoint';
import { getWorkspace, setWorkspaceCurrentMile } from '$lib/server/workspace-store';

// Official AT length (src/data/trail-facts.yaml). Clamp so a stored profile
// mile can't exceed the trail and diverge Scout's prompt context from the UI.
const TRAIL_TOTAL_MILES = 2197.4;

export const POST: RequestHandler = async (event) => {
  const { workspaceId, betaProfile } = requireWorkspace(event);
  const payload = (await event.request.json()) as { currentMile?: number };
  const raw = Number(payload.currentMile ?? 0);
  const mile = Number.isFinite(raw) ? Math.max(0, Math.min(TRAIL_TOTAL_MILES, raw)) : 0;
  const currentWorkspace = await getWorkspace(workspaceId, betaProfile);
  if (!currentWorkspace.profile) {
    throw error(409, 'Set up your hiker profile before saving a mile.');
  }

  return ok(await setWorkspaceCurrentMile(workspaceId, betaProfile, mile));
};
