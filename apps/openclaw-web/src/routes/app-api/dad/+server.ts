import type { RequestHandler } from './$types';
import { loadDadPilotSummary } from '$lib/server/dad';
import { ok } from '$lib/server/workspace-endpoint';

export const GET: RequestHandler = async () => {
  return ok(await loadDadPilotSummary());
};
