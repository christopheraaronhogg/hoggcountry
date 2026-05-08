import type { RequestHandler } from './$types';
import { getClawConsolePayload } from '$lib/server/claw-console';
import { requireWorkspace, ok } from '$lib/server/workspace-endpoint';

export const GET: RequestHandler = async (event) => {
  const { workspaceId, betaProfile } = requireWorkspace(event);

  return ok(await getClawConsolePayload(workspaceId, betaProfile));
};
