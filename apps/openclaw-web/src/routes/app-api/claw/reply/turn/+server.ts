import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { requireWorkspace } from '$lib/server/workspace-endpoint';
import { normalizeScoutThinkingEffort } from '$lib/server/claw-agent';
import { scoutReplyTurnSnapshot, startScoutReplyTurn } from '$lib/server/scout-reply-turns';

export const POST: RequestHandler = async (event) => {
  const { workspaceId, betaProfile } = requireWorkspace(event);
  const payload = (await event.request.json().catch(() => null)) as {
    message?: unknown;
    documentId?: unknown;
    resourceId?: unknown;
    thinkingEffort?: unknown;
  } | null;
  const message = typeof payload?.message === 'string' ? payload.message.trim() : '';
  const documentId = typeof payload?.documentId === 'string' ? payload.documentId.trim() : '';
  const resourceId = typeof payload?.resourceId === 'string' ? payload.resourceId.trim() : '';
  const thinkingEffort = normalizeScoutThinkingEffort(payload?.thinkingEffort);

  if (!message) {
    return json({ message: 'Message is required.' }, { status: 400 });
  }

  const turn = startScoutReplyTurn({
    workspaceId,
    betaProfile,
    message,
    documentId: documentId || null,
    resourceId: resourceId || null,
    thinkingEffort
  });

  return json({ turnId: turn.id }, { headers: { 'cache-control': 'no-store' } });
};

export const GET: RequestHandler = (event) => {
  const { workspaceId } = requireWorkspace(event);
  const turnId = event.url.searchParams.get('turnId')?.trim() ?? '';
  const snapshot = turnId ? scoutReplyTurnSnapshot(workspaceId, turnId) : null;

  if (!snapshot) {
    return json({ message: 'Scout turn not found.' }, { status: 404 });
  }

  return json(snapshot, { headers: { 'cache-control': 'no-store' } });
};
