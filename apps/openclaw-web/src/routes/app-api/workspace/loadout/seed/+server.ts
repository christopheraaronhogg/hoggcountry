import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { requireWorkspace, ok } from '$lib/server/workspace-endpoint';
import { getWorkspace, replaceWorkspaceLoadout } from '$lib/server/workspace-store';
import { LOADOUT_CATEGORIES, type LoadoutCategory, type LoadoutItemInput } from '$lib/loadout';

const GEAR_JSON_RELATIVE_PATH = 'src/data/gear.json';

const CATEGORY_IDS = new Set<string>(LOADOUT_CATEGORIES.map((category) => category.id));

interface GearTemplateFile {
  readonly items?: unknown;
}

function repoRootCandidates(relativePath: string): string[] {
  const normalized = relativePath.replace(/^\/+/u, '');
  const roots = [process.cwd(), dirname(process.cwd())];
  const candidates = new Set<string>();

  for (const root of roots) {
    let cursor = root;
    for (let depth = 0; depth < 8; depth += 1) {
      candidates.add(join(cursor, normalized));
      candidates.add(join(cursor, '..', '..', normalized));
      const parent = dirname(cursor);
      if (parent === cursor) break;
      cursor = parent;
    }
  }

  return Array.from(candidates);
}

async function readJsonFile<T>(relativePath: string): Promise<T> {
  const explicit = process.env.SCOUT_REPO_ROOT ? [resolve(process.env.SCOUT_REPO_ROOT, relativePath)] : [];
  const candidates = [...explicit, ...repoRootCandidates(relativePath)];
  const attempted: string[] = [];

  for (const candidate of candidates) {
    attempted.push(candidate);
    if (!existsSync(candidate)) continue;
    return JSON.parse(await readFile(candidate, 'utf8')) as T;
  }

  throw new Error(`Loadout template file not found: ${relativePath}. Checked ${attempted.slice(0, 5).join(', ')}`);
}

function gearWeightOz(value: unknown): number {
  if (typeof value === 'number' && Number.isFinite(value) && value >= 0) return value;
  if (typeof value === 'string') {
    const parsed = Number.parseFloat(value);
    if (Number.isFinite(parsed) && parsed >= 0) return parsed;
  }
  return 0;
}

function gearCategory(value: unknown): LoadoutCategory {
  return typeof value === 'string' && CATEGORY_IDS.has(value) ? value as LoadoutCategory : 'other';
}

async function loadStarterLoadoutItems(): Promise<LoadoutItemInput[]> {
  const template = await readJsonFile<GearTemplateFile>(GEAR_JSON_RELATIVE_PATH);
  const rows = Array.isArray(template.items) ? template.items : [];

  return rows
    .filter((row): row is Record<string, unknown> => typeof row === 'object' && row !== null)
    .filter((row) => row.season !== 'summer')
    .flatMap((row): LoadoutItemInput[] => {
      const name = typeof row.name === 'string' ? row.name.trim() : '';
      if (!name) return [];

      const category = gearCategory(row.category);

      return [{
        name,
        category,
        weightOz: gearWeightOz(row.weight),
        quantity: 1,
        worn: category === 'worn',
        consumable: /fuel|food|meal|snack/i.test(name),
        notes: typeof row.note === 'string' ? row.note.trim() : '',
        link: null
      }];
    });
}

export const POST: RequestHandler = async (event) => {
  const { workspaceId, betaProfile } = requireWorkspace(event);
  const current = await getWorkspace(workspaceId, betaProfile);

  if (current.loadout.length > 0) {
    throw error(409, 'Loadout already has items.');
  }

  const items = await loadStarterLoadoutItems();
  if (items.length === 0) {
    throw error(500, 'Starter loadout template has no usable items.');
  }

  const workspace = await replaceWorkspaceLoadout(workspaceId, betaProfile, items);
  return ok({ workspace });
};
