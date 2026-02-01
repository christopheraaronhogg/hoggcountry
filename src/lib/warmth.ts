import gearRecommendations from '../data/gearRecommendations.json';
import { loadCharacter, character } from '../stores/character.svelte';

type GearRecTier = 'budget' | 'mid' | 'premium' | 'luxury';

type GearRecItem = {
  id: string;
  name: string;
  category: string;
  price?: number;
  weight?: number;
  tier?: GearRecTier;
  season?: string;
  shelterType?: string;
  valueScore?: number;
  durabilityScore?: number;
  thruHikeViable?: boolean;
  why?: string;
};

export type WarmthStats = {
  warmthIndex: number;
  minutesDry40F: number;
  minutesStorm35F: number;
  sleepRatingF: number;
  sources: {
    sleepBagName: string | null;
    sleepPadName: string | null;
    insulationName: string | null;
    rainGearName: string | null;
    shelterName: string | null;
  };
  bonuses: {
    perkWarmthIndex: number;
    perkDrynessBonus: number;
  };
};

function clamp(n: number, min: number, max: number): number {
  if (!Number.isFinite(n)) return min;
  return Math.max(min, Math.min(max, n));
}

function tierToFactor(tier: GearRecTier | undefined): number {
  if (tier === 'budget') return 0.92;
  if (tier === 'mid') return 1.0;
  if (tier === 'premium') return 1.08;
  if (tier === 'luxury') return 1.14;
  return 1.0;
}

function getBudgetTier(budget: number): GearRecTier {
  if (budget < 800) return 'budget';
  if (budget < 1500) return 'mid';
  if (budget < 2500) return 'premium';
  return 'luxury';
}

const CATEGORY_BUDGETS: Record<string, number> = {
  backpack: 0.14,
  shelter: 0.20,
  sleepBag: 0.15,
  sleepPad: 0.06,
  insulation: 0.07,
  rainGear: 0.05,
  footwear: 0.08,
  kitchen: 0.06,
  water: 0.04,
  electronics: 0.06,
  safety: 0.03,
  trekkingPoles: 0.04,
  socks: 0.02,
};

function scoreRecItem(item: GearRecItem, mode: string, targetTier: GearRecTier): number {
  const weights =
    ({
      value: { value: 0.5, weight: 0.25, durability: 0.25 },
      weight: { value: 0.2, weight: 0.6, durability: 0.2 },
      durability: { value: 0.2, weight: 0.2, durability: 0.6 },
    } as const)[mode as 'value' | 'weight' | 'durability'] || { value: 0.5, weight: 0.25, durability: 0.25 };

  const avg = (gearRecommendations as any)?.categories?.[item.category]?.avgWeight || 1;
  const weight = Number(item.weight) || 0;

  const baseScore =
    (Number(item.valueScore) || 0) * weights.value +
    (11 - (weight / avg) * 5) * weights.weight +
    (Number(item.durabilityScore) || 0) * weights.durability;

  const tiers: GearRecTier[] = ['budget', 'mid', 'premium', 'luxury'];
  const itemTierIdx = tiers.indexOf((item.tier as GearRecTier) || 'mid');
  const targetTierIdx = tiers.indexOf(targetTier);
  const tierDistance = Math.abs(itemTierIdx - targetTierIdx);
  const tierBonus = tierDistance === 0 ? 1.0 : tierDistance === 1 ? 0.85 : 0.6;

  const viabilityPenalty = item.thruHikeViable === false ? 0.3 : 1.0;
  return baseScore * tierBonus * viabilityPenalty;
}

function buildRecommendedLoadout(opts: {
  budget: number;
  mode: string;
  season: string;
  shelterPref: string;
}): Record<string, GearRecItem | null> {
  const items: GearRecItem[] = ((gearRecommendations as any)?.items || []) as GearRecItem[];
  const budgetTier = getBudgetTier(opts.budget);

  const out: Record<string, GearRecItem | null> = {};
  for (const category of Object.keys(CATEGORY_BUDGETS)) {
    const categoryBudget = opts.budget * CATEGORY_BUDGETS[category] * 1.3;

    let candidates = items.filter((it) => {
      if (it.category !== category) return false;
      if (Number(it.price) && Number(it.price) > categoryBudget) return false;

      const season = String(it.season || 'both');
      if (season && season !== 'both' && season !== opts.season) return false;

      if (category === 'shelter' && it.shelterType && it.shelterType !== opts.shelterPref) return false;
      return true;
    });

    candidates = candidates
      .map((it) => ({ ...it, _score: scoreRecItem(it, opts.mode, budgetTier) }))
      .sort((a: any, b: any) => (Number(b._score) || 0) - (Number(a._score) || 0));

    if (candidates.length > 0) {
      out[category] = candidates[0];
      continue;
    }

    const fallback = items
      .filter((it) => it.category === category)
      .slice()
      .sort((a, b) => (Number(a.price) || 0) - (Number(b.price) || 0))[0];
    out[category] = fallback || null;
  }
  return out;
}

function parseTempF(text: string): number | null {
  const raw = String(text || '');
  const re1 = /(?:^|\b)(-?\d{1,2})\s*[°º]\s*F\b/i;
  const re2 = /(?:^|\b)(-?\d{1,2})\s*[°º]\b/;
  const re3 = /(?:^|\b)(-?\d{1,2})\s*F\b/i;

  const m = raw.match(re1) || raw.match(re2) || raw.match(re3);
  if (!m) return null;
  const n = Number(m[1]);
  if (!Number.isFinite(n)) return null;
  if (n < -40 || n > 80) return null;
  return n;
}

function parseRValue(text: string): number | null {
  const raw = String(text || '');
  const re = /\bR(?:-?value)?\s*(?:[:=≈~]|is)?\s*([0-9]+(?:\.[0-9]+)?)\b/i;
  const m = raw.match(re);
  if (!m) return null;
  const n = Number(m[1]);
  if (!Number.isFinite(n)) return null;
  if (n < 0.5 || n > 12) return null;
  return n;
}

function inferBagTempFromTier(tier: GearRecTier | undefined): number {
  if (tier === 'budget') return 25;
  if (tier === 'mid') return 20;
  if (tier === 'premium') return 20;
  if (tier === 'luxury') return 15;
  return 20;
}

function inferPadRFromTier(tier: GearRecTier | undefined): number {
  if (tier === 'budget') return 2.0;
  if (tier === 'mid') return 3.5;
  if (tier === 'premium') return 4.2;
  if (tier === 'luxury') return 5.5;
  return 3.5;
}

function bestInventoryTempF(): { tempF: number | null; name: string | null } {
  loadCharacter();
  const items = character.equipment.inventory.items || [];
  let best: { tempF: number; name: string } | null = null;
  for (const it of items) {
    const name = String((it as any)?.name || (it as any)?.templateName || '');
    if (!name) continue;
    if (!/(bag|quilt|sleep)/i.test(name)) continue;
    const t = parseTempF(name);
    if (t === null) continue;
    if (!best || t < best.tempF) best = { tempF: t, name };
  }
  return { tempF: best?.tempF ?? null, name: best?.name ?? null };
}

function bestInventoryPadR(): { r: number | null; name: string | null } {
  loadCharacter();
  const items = character.equipment.inventory.items || [];
  let best: { r: number; name: string } | null = null;
  for (const it of items) {
    const name = String((it as any)?.name || (it as any)?.templateName || '');
    if (!name) continue;
    if (!/(pad|sleeping pad|therm|tensor|x?lite|z\s*lite|r\s*[=:≈~]?\s*\d)/i.test(name)) continue;
    const r = parseRValue(name);
    if (r === null) continue;
    if (!best || r > best.r) best = { r, name };
  }
  return { r: best?.r ?? null, name: best?.name ?? null };
}

export function computeWarmthStats(): WarmthStats {
  loadCharacter();

  const rec = character.equipment.recommendations?.pack || { budget: 1500, mode: 'value', season: '3-season', shelterPref: 'tent' };
  const loadout = buildRecommendedLoadout({
    budget: Number((rec as any).budget) || 1500,
    mode: String((rec as any).mode || 'value'),
    season: String((rec as any).season || '3-season'),
    shelterPref: String((rec as any).shelterPref || 'tent'),
  });

  const recBag = loadout.sleepBag;
  const recPad = loadout.sleepPad;
  const recInsulation = loadout.insulation;
  const recRain = loadout.rainGear;
  const recShelter = loadout.shelter;

  const invBag = bestInventoryTempF();
  const invPad = bestInventoryPadR();

  const bagTempF =
    invBag.tempF ??
    parseTempF(recBag?.name || '') ??
    parseTempF(recBag?.why || '') ??
    inferBagTempFromTier(recBag?.tier);
  const padR =
    invPad.r ??
    parseRValue(recPad?.name || '') ??
    parseRValue(recPad?.why || '') ??
    inferPadRFromTier(recPad?.tier);

  const unlocked = (character as any).progression?.unlocked || (character as any).data?.progression?.unlocked || {};
  const perkWarmthIndex = (unlocked.perk_puffy_reflex ? 8 : 0) + (unlocked.perk_sleep_system_dialed ? 2 : 0);
  const perkDrynessBonus = unlocked.perk_dry_bag_protocol ? 0.15 : 0;
  const perkSleepBonusF = unlocked.perk_sleep_system_dialed ? 3 : 0;

  const sleepPoints = clamp(55 - bagTempF, 8, 42);
  const padPoints = clamp((padR - 1) * 8, 0, 28);
  const insulationPoints = Math.round(18 * tierToFactor(recInsulation?.tier));
  const rainPoints = Math.round(7 * tierToFactor(recRain?.tier));
  const shelterPoints = Math.round(6 * tierToFactor(recShelter?.tier));

  const warmthIndex = clamp(
    Math.round(sleepPoints + padPoints + insulationPoints + rainPoints + shelterPoints + perkWarmthIndex),
    0,
    100,
  );

  const minutesDry40F = clamp(Math.round(20 + warmthIndex * 1.15), 10, 240);

  // Storm scenario: 35F, moderate wind, wet clothes.
  const stormWindFactor = 0.82;
  const shellFactor = clamp(0.92 + (tierToFactor(recRain?.tier) - 1) * 1.2, 0.85, 1.1);
  const wetPenalty = clamp(0.65 + perkDrynessBonus, 0.55, 0.85);
  const minutesStorm35F = clamp(
    Math.round((15 + warmthIndex * 0.9) * stormWindFactor * shellFactor * wetPenalty),
    5,
    180,
  );

  const sleepRatingF = clamp(Math.round(bagTempF - (padR - 2) * 3 - perkSleepBonusF), -10, 60);

  return {
    warmthIndex,
    minutesDry40F,
    minutesStorm35F,
    sleepRatingF,
    sources: {
      sleepBagName: invBag.name || recBag?.name || null,
      sleepPadName: invPad.name || recPad?.name || null,
      insulationName: recInsulation?.name || null,
      rainGearName: recRain?.name || null,
      shelterName: recShelter?.name || null,
    },
    bonuses: {
      perkWarmthIndex,
      perkDrynessBonus,
    },
  };
}
