import type { RequestHandler } from './$types';
import { requireWorkspace, ok } from '$lib/server/workspace-endpoint';
import { addWorkspaceChecklistTool } from '$lib/server/workspace-store';

export const POST: RequestHandler = async (event) => {
  const { workspaceId, betaProfile } = requireWorkspace(event);
  const payload = (await event.request.json()) as {
    title?: string;
    summary?: string;
    instructions?: string;
    itemsText?: string;
  };

  return ok(
    await addWorkspaceChecklistTool(workspaceId, betaProfile, {
      title: String(payload.title ?? ''),
      summary: String(payload.summary ?? ''),
      instructions: String(payload.instructions ?? ''),
      itemsText: String(payload.itemsText ?? '')
    })
  );
};
