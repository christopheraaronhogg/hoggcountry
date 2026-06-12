import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { loadTodayTrailContext } from '$lib/server/today-context';
import { ok, requireWorkspace } from '$lib/server/workspace-endpoint';
import { getWorkspaceRecord } from '$lib/server/workspace-store';

/**
 * GET /app-api/claw/today-context (also served at /app-api/scout/today-context via the scout alias).
 *
 * Response is a union the client must branch on:
 * - { unavailable: true } — no profile mile and no tracker mile, so no trail-ahead brief can be built.
 * - TodayTrailContext — see $lib/server/today-context (mile, mileSource, weather[], weatherError,
 *   next.{shelter,water,town,road}, terrainAhead).
 *
 * Optional ?mile= query override (finite, > 0) takes priority over the workspace profile mile.
 */
export const GET: RequestHandler = async (event) => {
  const { workspaceId, betaProfile } = requireWorkspace(event);
  const record = await getWorkspaceRecord(workspaceId, betaProfile);
  const profileMile = record.profile && Number.isFinite(record.profile.currentMile) ? record.profile.currentMile : null;

  const rawMile = event.url.searchParams.get('mile');
  let overrideMile: number | null = null;
  if (rawMile !== null && rawMile.trim() !== '') {
    const parsed = Number(rawMile);
    if (!Number.isFinite(parsed) || parsed <= 0 || parsed > 2200) {
      throw error(400, 'mile must be a finite number between 0 and 2200.');
    }
    // Quantize so the override cannot be used to bust the weather cache.
    overrideMile = Math.round(parsed * 10) / 10;
  }

  let context;
  try {
    context = await loadTodayTrailContext({
      fetch: globalThis.fetch,
      requestOrigin: event.url.origin,
      profileMile: overrideMile ?? profileMile
    });
  } catch (caught) {
    console.error('[today-context] failed to build trail context', caught);
    throw error(500, 'Trail context is unavailable right now.');
  }

  if (!context) return ok({ unavailable: true });
  return ok(context);
};
