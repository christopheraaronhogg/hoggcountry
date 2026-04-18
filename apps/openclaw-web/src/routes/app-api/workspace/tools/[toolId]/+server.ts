import type { RequestHandler } from './$types';
import { requireWorkspace, ok } from '$lib/server/workspace-endpoint';
import { deleteWorkspaceTool } from '$lib/server/workspace-store';

export const DELETE: RequestHandler = async (event) => {
  const { workspaceId, betaProfile } = requireWorkspace(event);
  return ok(await deleteWorkspaceTool(workspaceId, betaProfile, event.params.toolId));
};
