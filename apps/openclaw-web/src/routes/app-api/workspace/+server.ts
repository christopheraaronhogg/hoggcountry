import type { RequestHandler } from './$types';
import { requireWorkspace, ok } from '$lib/server/workspace-endpoint';
import { getWorkspace } from '$lib/server/workspace-store';

export const GET: RequestHandler = async (event) => {
  const { workspaceId, betaProfile } = requireWorkspace(event);
  return ok(await getWorkspace(workspaceId, betaProfile));
};
