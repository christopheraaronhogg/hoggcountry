import type { RequestHandler } from './$types';
import { loadScoutAtOpenReferenceOfflineSummary } from '$lib/server/at-open-reference';
import { getClawConsolePayload } from '$lib/server/claw-console';
import { loadDadPilotSummary } from '$lib/server/dad';
import { buildScoutDailyBrief } from '$lib/server/scout-daily-brief';
import { ok, requireWorkspace } from '$lib/server/workspace-endpoint';
import { getWorkspace, getWorkspaceRecord } from '$lib/server/workspace-store';

export const GET: RequestHandler = async (event) => {
  const { workspaceId, betaProfile } = requireWorkspace(event);
  const [workspace, claw, record, atReference] = await Promise.all([
    getWorkspace(workspaceId, betaProfile),
    getClawConsolePayload(workspaceId, betaProfile),
    getWorkspaceRecord(workspaceId, betaProfile),
    loadScoutAtOpenReferenceOfflineSummary()
  ]);
  const dadPilotSummary = await loadDadPilotSummary().catch(() => null);
  const dailyBrief = await buildScoutDailyBrief(record, dadPilotSummary).catch(() => null);

  return ok({
    version: 1,
    cachedAt: new Date().toISOString(),
    workspaceId,
    workspace,
    claw,
    dailyBrief,
    atReference
  });
};
