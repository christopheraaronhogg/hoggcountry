import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { requireWorkspace, ok } from '$lib/server/workspace-endpoint';
import { removeWorkspaceLoadoutItem, updateWorkspaceLoadoutItem } from '$lib/server/workspace-store';
import { LOADOUT_CATEGORIES, LOADOUT_LIMITS, sanitizeLoadoutLink, type LoadoutCategory, type LoadoutItemInput } from '$lib/loadout';

const CATEGORY_IDS = new Set<string>(LOADOUT_CATEGORIES.map((category) => category.id));

function parseLoadoutItemPatch(raw: unknown): Partial<LoadoutItemInput> {
  if (typeof raw !== 'object' || raw === null) {
    throw error(400, 'Loadout patch payload is required.');
  }

  const input = raw as Record<string, unknown>;
  const patch: Partial<LoadoutItemInput> = {};

  if (input.name !== undefined) {
    const name = typeof input.name === 'string' ? input.name.trim() : '';
    if (!name) {
      throw error(400, 'Loadout item name is required.');
    }
    patch.name = name;
  }

  if (input.category !== undefined) {
    if (typeof input.category !== 'string' || !CATEGORY_IDS.has(input.category)) {
      throw error(400, 'Loadout item category is not recognized.');
    }
    patch.category = input.category as LoadoutCategory;
  }

  if (input.weightOz !== undefined) {
    if (typeof input.weightOz !== 'number' || !Number.isFinite(input.weightOz) || input.weightOz < 0 || input.weightOz > LOADOUT_LIMITS.maxWeightOz) {
      throw error(400, 'Loadout item weight must be 0 oz or more.');
    }
    patch.weightOz = input.weightOz;
  }

  if (input.quantity !== undefined) {
    if (typeof input.quantity !== 'number' || !Number.isInteger(input.quantity) || input.quantity < 1 || input.quantity > LOADOUT_LIMITS.maxQuantity) {
      throw error(400, `Loadout item quantity must be a whole number between 1 and ${LOADOUT_LIMITS.maxQuantity}.`);
    }
    patch.quantity = input.quantity;
  }

  if (input.worn !== undefined) {
    patch.worn = Boolean(input.worn);
  }

  if (input.consumable !== undefined) {
    patch.consumable = Boolean(input.consumable);
  }

  if (input.notes !== undefined) {
    patch.notes = typeof input.notes === 'string' ? input.notes.slice(0, LOADOUT_LIMITS.maxNotesChars) : '';
  }

  if (input.link !== undefined) {
    patch.link = sanitizeLoadoutLink(input.link);
  }

  return patch;
}

export const PATCH: RequestHandler = async (event) => {
  const { workspaceId, betaProfile } = requireWorkspace(event);
  const payload = (await event.request.json().catch(() => null)) as { patch?: unknown } | null;
  const patch = parseLoadoutItemPatch(payload?.patch);

  try {
    const workspace = await updateWorkspaceLoadoutItem(workspaceId, betaProfile, event.params.itemId, patch);
    return ok({ workspace });
  } catch (caught) {
    if (caught instanceof Error && caught.message === 'Loadout item not found.') {
      throw error(404, caught.message);
    }

    if (caught instanceof Error && caught.message === 'Loadout item name is required.') {
      throw error(400, caught.message);
    }

    throw caught;
  }
};

export const DELETE: RequestHandler = async (event) => {
  const { workspaceId, betaProfile } = requireWorkspace(event);
  const workspace = await removeWorkspaceLoadoutItem(workspaceId, betaProfile, event.params.itemId);
  return ok({ workspace });
};
