import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { requireWorkspace, ok } from '$lib/server/workspace-endpoint';
import { saveWorkspaceScoutDocumentFromReply } from '$lib/server/workspace-store';

export const POST: RequestHandler = async (event) => {
  const { workspaceId, betaProfile } = requireWorkspace(event);
  const payload = (await event.request.json().catch(() => null)) as {
    messageId?: unknown;
    title?: unknown;
  } | null;

  const messageId = typeof payload?.messageId === 'string' ? payload.messageId.trim() : '';
  const title = typeof payload?.title === 'string' ? payload.title.trim() : null;

  if (!messageId) {
    throw error(400, 'Message id is required.');
  }

  const result = await saveWorkspaceScoutDocumentFromReply(workspaceId, betaProfile, {
    messageId,
    title
  });

  return ok({
    document: result.document,
    documents: result.workspace.documents
  });
};
