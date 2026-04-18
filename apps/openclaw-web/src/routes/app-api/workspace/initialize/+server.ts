import type { RequestHandler } from './$types';
import { requireWorkspace, ok } from '$lib/server/workspace-endpoint';
import { initializeWorkspace } from '$lib/server/workspace-store';
import type { ManualProfile } from '@hoggcountry/manual-core';

export const POST: RequestHandler = async (event) => {
  const { workspaceId, betaProfile } = requireWorkspace(event);
  const profile = (await event.request.json()) as ManualProfile;
  return ok(await initializeWorkspace(workspaceId, betaProfile, profile));
};
