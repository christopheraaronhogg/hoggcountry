import type { PageServerLoad } from './$types';
import { getClawConsolePayload } from '$lib/server/claw-console';
import { requireWorkspace } from '$lib/server/workspace-endpoint';

export const load: PageServerLoad = async (event) => {
  const { workspaceId, betaProfile } = requireWorkspace(event);

  return {
    console: await getClawConsolePayload(workspaceId, betaProfile)
  };
};
