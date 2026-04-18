import type { RequestHandler } from './$types';
import { requireWorkspace, ok } from '$lib/server/workspace-endpoint';
import { setWorkspaceCurrentMile } from '$lib/server/workspace-store';

export const POST: RequestHandler = async (event) => {
  const { workspaceId, betaProfile } = requireWorkspace(event);
  const payload = (await event.request.json()) as { currentMile?: number };
  return ok(await setWorkspaceCurrentMile(workspaceId, betaProfile, Number(payload.currentMile ?? 0)));
};
