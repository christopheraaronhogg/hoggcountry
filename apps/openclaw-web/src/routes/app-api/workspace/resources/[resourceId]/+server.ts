import type { RequestHandler } from './$types';
import { requireWorkspace, ok } from '$lib/server/workspace-endpoint';
import { deleteWorkspaceResource } from '$lib/server/workspace-store';

export const DELETE: RequestHandler = async (event) => {
  const { workspaceId, betaProfile } = requireWorkspace(event);
  return ok(await deleteWorkspaceResource(workspaceId, betaProfile, event.params.resourceId));
};
