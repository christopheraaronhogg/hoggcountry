import type { RequestHandler } from './$types';
import { requireWorkspace, ok } from '$lib/server/workspace-endpoint';
import { addWorkspaceManualNote } from '$lib/server/workspace-store';

export const POST: RequestHandler = async (event) => {
  const { workspaceId, betaProfile } = requireWorkspace(event);
  const payload = (await event.request.json()) as { sectionId?: string; title?: string; content?: string };
  return ok(
    await addWorkspaceManualNote(
      workspaceId,
      betaProfile,
      String(payload.sectionId ?? ''),
      String(payload.title ?? ''),
      String(payload.content ?? '')
    )
  );
};
