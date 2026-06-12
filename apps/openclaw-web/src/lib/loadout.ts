/**
 * Pure loadout (gear list) helpers shared by the gated UI, server store,
 * and node tests. Keep this module dependency-free so it stays importable
 * from any runtime.
 */

export type LoadoutCategory =
  | 'pack'
  | 'shelter'
  | 'sleep'
  | 'sleepClothing'
  | 'insulation'
  | 'kitchen'
  | 'electronics'
  | 'worn'
  | 'traction'
  | 'water'
  | 'safety'
  | 'other';

export const LOADOUT_CATEGORIES: readonly { id: LoadoutCategory; label: string }[] = [
  { id: 'pack', label: 'Pack' },
  { id: 'shelter', label: 'Shelter' },
  { id: 'sleep', label: 'Sleep system' },
  { id: 'sleepClothing', label: 'Sleep clothing' },
  { id: 'insulation', label: 'Insulation' },
  { id: 'kitchen', label: 'Kitchen' },
  { id: 'electronics', label: 'Electronics' },
  { id: 'worn', label: 'Worn' },
  { id: 'traction', label: 'Traction' },
  { id: 'water', label: 'Water' },
  { id: 'safety', label: 'Safety' },
  { id: 'other', label: 'Other' }
];

export interface LoadoutItemInput {
  name: string;
  category: LoadoutCategory;
  weightOz: number;
  quantity: number;
  worn: boolean;
  consumable: boolean;
  notes: string;
  link: string | null;
}

// Bounds shared by the endpoints and the store normalizers so absurd values
// (1e308 oz, megabyte notes) can neither enter nor survive on disk.
export const LOADOUT_LIMITS = {
  maxItems: 300,
  maxWeightOz: 1600, // 100 lb — nobody base-weighs more than this on the AT
  maxQuantity: 99,
  maxNameChars: 200,
  maxNotesChars: 2000,
  maxLinkChars: 2000
} as const;

/** Accepts only http(s) URLs; everything else (javascript:, data:, garbage) becomes null. */
export function sanitizeLoadoutLink(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim().slice(0, LOADOUT_LIMITS.maxLinkChars);
  if (!trimmed) return null;
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol === 'http:' || parsed.protocol === 'https:') return trimmed;
  } catch {
    // fall through
  }
  return null;
}

export interface LoadoutSummary {
  readonly baseWeightOz: number;
  readonly wornWeightOz: number;
  readonly consumableWeightOz: number;
  readonly totalWeightOz: number;
  readonly itemCount: number;
}

function roundOz(value: number): number {
  return Math.round(value * 100) / 100;
}

/**
 * Weight buckets follow PackBuilder semantics: worn gear rides on-body and is
 * excluded from the carried total; consumables ride in the pack but are not
 * base weight. Each item lands in exactly one bucket (worn wins over consumable).
 */
export function computeLoadoutSummary(
  items: readonly { weightOz: number; quantity: number; worn: boolean; consumable: boolean }[]
): LoadoutSummary {
  let baseWeightOz = 0;
  let wornWeightOz = 0;
  let consumableWeightOz = 0;
  let itemCount = 0;

  for (const item of items) {
    const weightOz = Number.isFinite(item.weightOz) && item.weightOz > 0 ? item.weightOz : 0;
    const quantity = Number.isFinite(item.quantity) && item.quantity > 0 ? item.quantity : 0;
    const lineWeightOz = weightOz * quantity;

    itemCount += quantity;

    if (item.worn) {
      wornWeightOz += lineWeightOz;
    } else if (item.consumable) {
      consumableWeightOz += lineWeightOz;
    } else {
      baseWeightOz += lineWeightOz;
    }
  }

  return {
    baseWeightOz: roundOz(baseWeightOz),
    wornWeightOz: roundOz(wornWeightOz),
    consumableWeightOz: roundOz(consumableWeightOz),
    totalWeightOz: roundOz(baseWeightOz + consumableWeightOz),
    itemCount
  };
}

/**
 * Matches PackBuilder's formatWeight convention: ounces under a pound,
 * pounds from 16 oz up — with the leftover ounces kept visible.
 */
export function formatOz(oz: number): string {
  // Round to tenths before branching so 15.96 rolls over to '1 lb'
  // instead of rendering as '16.0 oz'.
  const safe = Number.isFinite(oz) ? Math.round(Math.max(0, oz) * 10) / 10 : 0;
  if (safe < 16) return `${safe.toFixed(1)} oz`;

  let pounds = Math.floor(safe / 16);
  let remainderOz = Math.round((safe - pounds * 16) * 10) / 10;

  if (remainderOz >= 16) {
    pounds += 1;
    remainderOz = 0;
  }

  return remainderOz > 0 ? `${pounds} lb ${remainderOz.toFixed(1)} oz` : `${pounds} lb`;
}
