import type { RequestHandler } from './$types';
import { requireWorkspace, ok } from '$lib/server/workspace-endpoint';
import { clearWorkspaceOpenAICodexConnection } from '$lib/server/workspace-store';

export const POST: RequestHandler = async (event) => {
  const { workspaceId, betaProfile } = requireWorkspace(event);
  const snapshot = await clearWorkspaceOpenAICodexConnection(workspaceId, betaProfile);

  return ok({
    connection: snapshot.providerConnections.find((item) => item.providerId === 'openai-codex') ?? null
  });
};
