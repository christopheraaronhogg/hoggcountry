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
    workspace: {
      workspaceId: record.workspaceId,
      betaProfile: record.betaProfile,
      profile: record.profile,
      sections: record.sections,
      documents: record.documents,
      resources: record.resources,
      tools: record.tools,
      providerConnections: record.providerConnections,
      clawMessages: record.clawMessages,
      factCandidates: record.factCandidates,
      locationHistory: record.locationHistory,
      skillSettings: record.skillSettings,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt
    },
    connection,
    messages: record.clawMessages,
    factCandidates: record.factCandidates,
    hasPendingConnect: Boolean(record.pendingOpenAICodexAuth)
  });
};
