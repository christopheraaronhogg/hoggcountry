import type { RequestHandler } from './$types';
import { getConfiguredClawConnection } from '$lib/server/claw-connection';
import { requireWorkspace, ok } from '$lib/server/workspace-endpoint';
import { getWorkspaceRecord } from '$lib/server/workspace-store';

export const GET: RequestHandler = async (event) => {
  const { workspaceId, betaProfile } = requireWorkspace(event);
  const record = await getWorkspaceRecord(workspaceId, betaProfile);
  const connection = getConfiguredClawConnection(record);

  return ok({
    workspaceId,
    connection,
    messages: record.clawMessages,
    factCandidates: record.factCandidates,
    hasPendingConnect: Boolean(record.pendingOpenAICodexAuth)
  });
};
