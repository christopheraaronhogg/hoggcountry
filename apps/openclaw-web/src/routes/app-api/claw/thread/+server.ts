import type { RequestHandler } from './$types';
import { getConfiguredClawConnection } from '$lib/server/claw-connection';
import { requireWorkspace, ok } from '$lib/server/workspace-endpoint';
import { getWorkspaceRecord, replaceWorkspaceClawMessages } from '$lib/server/workspace-store';

export const DELETE: RequestHandler = async (event) => {
  const { workspaceId, betaProfile } = requireWorkspace(event);
  const workspace = await replaceWorkspaceClawMessages(workspaceId, betaProfile, []);
  const record = await getWorkspaceRecord(workspaceId, betaProfile);
  const connection = getConfiguredClawConnection(record);

  return ok({
    workspaceId,
    connection,
    messages: workspace.clawMessages,
    factCandidates: workspace.factCandidates,
    hasPendingConnect: Boolean(record.pendingOpenAICodexAuth)
  });
};
