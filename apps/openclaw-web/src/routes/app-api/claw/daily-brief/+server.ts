import type { RequestHandler } from './$types';
import { loadDadPilotSummary } from '$lib/server/dad';
import { buildScoutDailyBrief } from '$lib/server/scout-daily-brief';
import { ok, requireWorkspace } from '$lib/server/workspace-endpoint';
import { getWorkspaceRecord } from '$lib/server/workspace-store';

export const GET: RequestHandler = async (event) => {
  const { workspaceId, betaProfile } = requireWorkspace(event);
  const record = await getWorkspaceRecord(workspaceId, betaProfile);
  const dadPilotSummary = await loadDadPilotSummary().catch(() => null);

  return ok(await buildScoutDailyBrief(record, dadPilotSummary));
};
