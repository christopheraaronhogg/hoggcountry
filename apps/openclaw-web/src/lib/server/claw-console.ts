import { getConfiguredClawConnection } from '$lib/server/claw-connection';
import { getWorkspaceRecord } from '$lib/server/workspace-store';

export async function getClawConsolePayload(
  workspaceId: string,
  betaProfile: NonNullable<App.Locals['betaProfile']>
) {
  const record = await getWorkspaceRecord(workspaceId, betaProfile);
  const connection = getConfiguredClawConnection(record);

  return {
    workspaceId,
    workspace: {
      profile: record.profile,
      sections: record.sections,
      documents: record.documents,
      resources: record.resources,
      tools: record.tools
    },
    connection,
    messages: record.clawMessages,
    factCandidates: record.factCandidates,
    hasPendingConnect: Boolean(record.pendingOpenAICodexAuth)
  };
}
