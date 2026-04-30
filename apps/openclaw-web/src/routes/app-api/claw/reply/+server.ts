import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getConfiguredClawConnection, replyInWorkspaceClaw } from '$lib/server/claw-agent';
import { requireWorkspace, ok } from '$lib/server/workspace-endpoint';

export const POST: RequestHandler = async (event) => {
  const { workspaceId, betaProfile } = requireWorkspace(event);
  const payload = (await event.request.json().catch(() => null)) as {
    message?: unknown;
    documentId?: unknown;
  } | null;
  const message = typeof payload?.message === 'string' ? payload.message.trim() : '';
  const documentId = typeof payload?.documentId === 'string' ? payload.documentId.trim() : '';

  if (!message) {
    throw error(400, 'Message is required.');
  }

  const result = await replyInWorkspaceClaw(workspaceId, betaProfile, message, {
    documentId: documentId || null
  });
  const connection = getConfiguredClawConnection(result.workspace);

  return ok({
    reply: result.reply,
    revisedDocument: result.revisedDocument,
    messages: result.workspace.clawMessages,
    documents: result.workspace.documents,
    factCandidates: result.workspace.factCandidates,
    connection
  });
};
