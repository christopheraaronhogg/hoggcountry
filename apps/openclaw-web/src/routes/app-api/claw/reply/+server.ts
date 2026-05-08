import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { replyInWorkspaceClaw, ScoutAgentTimeoutError } from '$lib/server/claw-agent';
import { getConfiguredClawConnection } from '$lib/server/claw-connection';
import { requireWorkspace, ok } from '$lib/server/workspace-endpoint';

export const POST: RequestHandler = async (event) => {
  const { workspaceId, betaProfile } = requireWorkspace(event);
  const payload = (await event.request.json().catch(() => null)) as {
    message?: unknown;
    documentId?: unknown;
    resourceId?: unknown;
  } | null;
  const message = typeof payload?.message === 'string' ? payload.message.trim() : '';
  const documentId = typeof payload?.documentId === 'string' ? payload.documentId.trim() : '';
  const resourceId = typeof payload?.resourceId === 'string' ? payload.resourceId.trim() : '';

  if (!message) {
    throw error(400, 'Message is required.');
  }

  try {
    const result = await replyInWorkspaceClaw(workspaceId, betaProfile, message, {
      documentId: documentId || null,
      resourceId: resourceId || null
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
  } catch (caught) {
    if (caught instanceof ScoutAgentTimeoutError) {
      return json(
        { message: caught.message },
        {
          status: 504,
          headers: { 'cache-control': 'no-store' }
        }
      );
    }

    if (caught instanceof Error && (caught.message === 'Document not found.' || caught.message === 'Resource not found.')) {
      throw error(404, caught.message);
    }

    if (caught instanceof Error && caught.message.includes('Pi agent did not return an assistant reply')) {
      return json(
        { message: 'Scout did not return a usable reply. Try again with a narrower trail question, or use today’s brief first.' },
        {
          status: 502,
          headers: { 'cache-control': 'no-store' }
        }
      );
    }

    throw caught;
  }
};
