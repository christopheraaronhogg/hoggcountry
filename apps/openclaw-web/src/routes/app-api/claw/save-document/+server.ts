import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { isStandardDocumentSlotKey } from '@hoggcountry/manual-core';
import { requireWorkspace, ok } from '$lib/server/workspace-endpoint';
import { saveWorkspaceScoutDocumentFromReply } from '$lib/server/workspace-store';

export const POST: RequestHandler = async (event) => {
  const { workspaceId, betaProfile } = requireWorkspace(event);
  const payload = (await event.request.json().catch(() => null)) as {
    messageId?: unknown;
    title?: unknown;
    slotKey?: unknown;
  } | null;

  const messageId = typeof payload?.messageId === 'string' ? payload.messageId.trim() : '';
  const title = typeof payload?.title === 'string' ? payload.title.trim() : null;
  const slotKey = isStandardDocumentSlotKey(payload?.slotKey) ? payload.slotKey : null;

  if (!messageId) {
    throw error(400, 'Message id is required.');
  }

  const result = await saveWorkspaceScoutDocumentFromReply(workspaceId, betaProfile, {
    messageId,
    title,
    slotKey
  });

  return ok({
    document: result.document,
    documents: result.workspace.documents
  });
};
