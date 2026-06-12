import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { requireWorkspace, ok } from '$lib/server/workspace-endpoint';
import { addWorkspaceLoadoutItem, getWorkspace } from '$lib/server/workspace-store';
import { LOADOUT_CATEGORIES, LOADOUT_LIMITS, sanitizeLoadoutLink, type LoadoutCategory, type LoadoutItemInput } from '$lib/loadout';

const CATEGORY_IDS = new Set<string>(LOADOUT_CATEGORIES.map((category) => category.id));

function parseLoadoutItemInput(raw: unknown): LoadoutItemInput {
  if (typeof raw !== 'object' || raw === null) {
    throw error(400, 'Loadout item payload is required.');
  }

  const item = raw as Record<string, unknown>;
  const name = typeof item.name === 'string' ? item.name.trim() : '';
  if (!name) {
    throw error(400, 'Loadout item name is required.');
  }

  if (typeof item.category !== 'string' || !CATEGORY_IDS.has(item.category)) {
    throw error(400, 'Loadout item category is not recognized.');
  }

  if (typeof item.weightOz !== 'number' || !Number.isFinite(item.weightOz) || item.weightOz < 0 || item.weightOz > LOADOUT_LIMITS.maxWeightOz) {
    throw error(400, `Loadout item weight must be between 0 and ${LOADOUT_LIMITS.maxWeightOz} oz.`);
  }

  if (typeof item.quantity !== 'number' || !Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > LOADOUT_LIMITS.maxQuantity) {
    throw error(400, `Loadout item quantity must be a whole number between 1 and ${LOADOUT_LIMITS.maxQuantity}.`);
  }

  return {
    name: name.slice(0, LOADOUT_LIMITS.maxNameChars),
    category: item.category as LoadoutCategory,
    weightOz: item.weightOz,
    quantity: item.quantity,
    worn: Boolean(item.worn),
    consumable: Boolean(item.consumable),
    notes: typeof item.notes === 'string' ? item.notes.slice(0, LOADOUT_LIMITS.maxNotesChars) : '',
    link: sanitizeLoadoutLink(item.link)
  };
}

export const GET: RequestHandler = async (event) => {
  const { workspaceId, betaProfile } = requireWorkspace(event);
  return ok(await getWorkspace(workspaceId, betaProfile));
};

export const POST: RequestHandler = async (event) => {
  const { workspaceId, betaProfile } = requireWorkspace(event);
  const payload = (await event.request.json().catch(() => null)) as { item?: unknown } | null;
  const input = parseLoadoutItemInput(payload?.item);

  let workspace;
  try {
    workspace = await addWorkspaceLoadoutItem(workspaceId, betaProfile, input);
  } catch (caught) {
    if (caught instanceof Error && caught.message.startsWith('Loadout is full')) {
      throw error(400, caught.message);
    }
    throw caught;
  }
  return ok({ workspace });
};
