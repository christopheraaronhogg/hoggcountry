import type { RequestHandler } from './$types';
import { requireWorkspace, ok } from '$lib/server/workspace-endpoint';
import { getWorkspaceRecord } from '$lib/server/workspace-store';

export const GET: RequestHandler = async (event) => {
  const { workspaceId, betaProfile } = requireWorkspace(event);
  const record = await getWorkspaceRecord(workspaceId, betaProfile);
  const connection = record.providerConnections.find((item) => item.providerId === 'openai-codex') ?? null;

  return ok({
    workspaceId,
    connection,
    messages: record.clawMessages,
    factCandidates: record.factCandidates,
    hasPendingConnect: Boolean(record.pendingOpenAICodexAuth)
  });
};
