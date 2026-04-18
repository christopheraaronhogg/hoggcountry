import type { RequestHandler } from './$types';
import { requireWorkspace, ok } from '$lib/server/workspace-endpoint';
import { importWorkspaceDocuments } from '$lib/server/workspace-store';

export const POST: RequestHandler = async (event) => {
  const { workspaceId, betaProfile } = requireWorkspace(event);
  const formData = await event.request.formData();
  const files = formData
    .getAll('files')
    .filter((value): value is File => value instanceof File && value.size > 0);

  return ok(await importWorkspaceDocuments(workspaceId, betaProfile, files));
};
