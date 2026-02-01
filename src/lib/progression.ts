import { loadCharacter, character, updateCharacter } from '../stores/character.svelte';

export type LevelInfo = {
  level: number;
  title: string;
  xpTotal: number;
  xpIntoLevel: number;
  xpToNext: number;
  xpForNextLevelTotal: number;
  pctToNext: number;
};

export type DailyMissionStatus = {
  id: string;
  title: string;
  description: string;
  rewardXp: number;
  rewardMarks: number;
  progress: number;
  target: number;
  done: boolean;
  claimed: boolean;
};

export type ClaimResult =
  | { ok: true; gainedXp: number; gainedMarks: number; levelBefore: number; levelAfter: number }
  | { ok: false; reason: 'disabled' | 'not-found' | 'not-done' | 'already-claimed' };

export type Perk = {
  id: string;
  name: string;
  description: string;
  costMarks: number;
};

export type PerkStatus = Perk & {
  unlocked: boolean;
  canAfford: boolean;
};

type MissionTrigger =
  | { kind: 'tool_open'; toolId: string; count: number }
  | { kind: 'tool_open_any'; count: number }
  | { kind: 'mile_updates'; count: number }
  | { kind: 'miles_advance'; miles: number };

type MissionTemplate = {
  id: string;
  title: string;
  description: string;
  rewardXp: number;
  rewardMarks: number;
  trigger: MissionTrigger;
};

const LEVEL_TITLES: Array<{ minLevel: number; title: string }> = [
  { minLevel: 1, title: 'Greenhorn' },
  { minLevel: 5, title: 'Trailhand' },
  { minLevel: 10, title: 'Ridgeline' },
  { minLevel: 15, title: 'Backcountry' },
  { minLevel: 20, title: 'Ranger' },
  { minLevel: 25, title: 'Pathfinder' },
  { minLevel: 30, title: 'Old Growth' },
];

const DAILY_MISSION_POOL: MissionTemplate[] = [
  {
    id: 'tool_any_2',
    title: 'Check Your Instruments',
    description: 'Open any two Trail Tools today.',
    rewardXp: 40,
    rewardMarks: 4,
    trigger: { kind: 'tool_open_any', count: 2 },
  },
  {
    id: 'tool_pack_1',
    title: 'Pack Audit',
    description: 'Open Pack Builder and sanity-check your kit.',
    rewardXp: 35,
    rewardMarks: 3,
    trigger: { kind: 'tool_open', toolId: 'pack', count: 1 },
  },
  {
    id: 'tool_weather_1',
    title: 'Sky Read',
    description: 'Open Weather and look at the next window.',
    rewardXp: 30,
    rewardMarks: 3,
    trigger: { kind: 'tool_open', toolId: 'weather', count: 1 },
  },
  {
    id: 'tool_water_1',
    title: 'Water Plan',
    description: 'Open Water and plan your next carry.',
    rewardXp: 30,
    rewardMarks: 3,
    trigger: { kind: 'tool_open', toolId: 'water', count: 1 },
  },
  {
    id: 'tool_resupply_1',
    title: 'Resupply Brain',
    description: 'Open Resupply and sanity-check the next town.',
    rewardXp: 35,
    rewardMarks: 3,
    trigger: { kind: 'tool_open', toolId: 'resupply', count: 1 },
  },
  {
    id: 'mile_update_1',
    title: 'Set Your Mile',
    description: 'Update your current mile once today.',
    rewardXp: 40,
    rewardMarks: 4,
    trigger: { kind: 'mile_updates', count: 1 },
  },
  {
    id: 'miles_advance_1',
    title: 'Forward Motion',
    description: 'Advance 1.0 mile today (any method).',
    rewardXp: 50,
    rewardMarks: 5,
    trigger: { kind: 'miles_advance', miles: 1 },
  },
];

const PERKS: Perk[] = [
  {
    id: 'perk_puffy_reflex',
    name: 'Puffy Reflex',
    description: 'You throw insulation on instantly when you stop. +8 warmth index.',
    costMarks: 10,
  },
  {
    id: 'perk_dry_bag_protocol',
    name: 'Dry Bag Protocol',
    description: 'Better dryness discipline under stress. Less wet penalty in storms.',
    costMarks: 8,
  },
  {
    id: 'perk_sleep_system_dialed',
    name: 'Dialed Sleep System',
    description: 'Fewer drafts, better routine. Sleep rating improves by ~3°F.',
    costMarks: 12,
  },
];

function clamp(n: number, min: number, max: number): number {
  if (!Number.isFinite(n)) return min;
  return Math.max(min, Math.min(max, n));
}

function todayKey(d: Date = new Date()): string {
  return d.toISOString().slice(0, 10);
}

function hashToU32(input: string): number {
  // FNV-1a 32-bit
  let h = 0x811c9dc5;
  for (let i = 0; i < input.length; i += 1) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffleInPlace<T>(arr: T[], rand: () => number): void {
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rand() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}

function titleForLevel(level: number): string {
  let best = LEVEL_TITLES[0]?.title || 'Greenhorn';
  for (const t of LEVEL_TITLES) {
    if (level >= t.minLevel) best = t.title;
  }
  return best;
}

function xpToNextLevel(level: number): number {
  const l = clamp(Math.floor(level), 1, 999);
  // Fast early gains, slower later. Tuned for small daily missions.
  const base = 110;
  const linear = (l - 1) * 40;
  const curve = Math.pow(l - 1, 1.35) * 14;
  return Math.round(base + linear + curve);
}

export function getLevelInfo(xpTotal: number): LevelInfo {
  const xp = Math.max(0, Math.floor(Number(xpTotal) || 0));
  let level = 1;
  let remaining = xp;

  // Find the level by consuming thresholds.
  // Caps the loop to keep things safe even for huge xp values.
  for (let i = 0; i < 500; i += 1) {
    const need = xpToNextLevel(level);
    if (remaining < need) break;
    remaining -= need;
    level += 1;
  }

  const xpToNext = xpToNextLevel(level);
  const pct = xpToNext > 0 ? clamp(Math.round((remaining / xpToNext) * 100), 0, 100) : 0;
  return {
    level,
    title: titleForLevel(level),
    xpTotal: xp,
    xpIntoLevel: remaining,
    xpToNext,
    xpForNextLevelTotal: xp + (xpToNext - remaining),
    pctToNext: pct,
  };
}

function getActivity(date: string) {
  loadCharacter();
  const day = character.progression.activity?.days?.[date];
  return {
    toolsOpened: day?.toolsOpened || {},
    milesAdvanced: Number(day?.milesAdvanced) || 0,
    mileUpdates: Number(day?.mileUpdates) || 0,
  };
}

function missionSeed(date: string): number {
  loadCharacter();
  const seedStr = [
    date,
    (character.core.nickname || '').trim(),
    (character.core.displayName || '').trim(),
    (character.core.telegramUsername || '').trim(),
  ].join('|');
  return hashToU32(seedStr);
}

function pickDailyMissions(date: string): MissionTemplate[] {
  const seed = missionSeed(date);
  const rand = mulberry32(seed);
  const pool = DAILY_MISSION_POOL.slice();
  shuffleInPlace(pool, rand);
  return pool.slice(0, 3);
}

function evaluateTrigger(trigger: MissionTrigger, activity: ReturnType<typeof getActivity>): { progress: number; target: number; done: boolean } {
  if (trigger.kind === 'tool_open') {
    const progress = Number(activity.toolsOpened?.[trigger.toolId]) || 0;
    const target = clamp(trigger.count, 1, 99);
    return { progress, target, done: progress >= target };
  }
  if (trigger.kind === 'tool_open_any') {
    const progress = Object.values(activity.toolsOpened || {}).reduce((a, b) => a + (Number(b) || 0), 0);
    const target = clamp(trigger.count, 1, 99);
    return { progress, target, done: progress >= target };
  }
  if (trigger.kind === 'mile_updates') {
    const progress = Number(activity.mileUpdates) || 0;
    const target = clamp(trigger.count, 1, 99);
    return { progress, target, done: progress >= target };
  }
  if (trigger.kind === 'miles_advance') {
    const progress = Number(activity.milesAdvanced) || 0;
    const target = Math.max(0.1, Number(trigger.miles) || 0);
    return { progress, target, done: progress >= target };
  }
  return { progress: 0, target: 1, done: false };
}

export function getDailyMissions(date: string = todayKey()): DailyMissionStatus[] {
  loadCharacter();
  const enabled = !!character.progression.enabled;
  if (!enabled) return [];

  const activity = getActivity(date);
  const missions = pickDailyMissions(date);
  return missions.map((m) => {
    const { progress, target, done } = evaluateTrigger(m.trigger, activity);
    const claimKey = `${date}:${m.id}`;
    const claimed = !!character.progression.claimed?.[claimKey];
    return {
      id: m.id,
      title: m.title,
      description: m.description,
      rewardXp: m.rewardXp,
      rewardMarks: m.rewardMarks,
      progress,
      target,
      done,
      claimed,
    };
  });
}

export function claimDailyMission(date: string, missionId: string): ClaimResult {
  loadCharacter();
  if (!character.progression.enabled) return { ok: false, reason: 'disabled' };

  const missions = getDailyMissions(date);
  const m = missions.find((x) => x.id === missionId);
  if (!m) return { ok: false, reason: 'not-found' };

  if (!m.done) return { ok: false, reason: 'not-done' };
  if (m.claimed) return { ok: false, reason: 'already-claimed' };

  const claimKey = `${date}:${missionId}`;
  const levelBefore = getLevelInfo(character.progression.xp).level;

  updateCharacter({
    progression: {
      xp: (character.progression.xp || 0) + m.rewardXp,
      marks: (character.progression.marks || 0) + m.rewardMarks,
      claimed: { [claimKey]: true },
    },
  } as any);

  const levelAfter = getLevelInfo(character.progression.xp).level;
  return { ok: true, gainedXp: m.rewardXp, gainedMarks: m.rewardMarks, levelBefore, levelAfter };
}

export function getPerkStatuses(): PerkStatus[] {
  loadCharacter();
  const marks = Number(character.progression.marks) || 0;
  const unlocked = character.progression.unlocked || {};
  return PERKS.map((p) => ({
    ...p,
    unlocked: !!unlocked[p.id],
    canAfford: marks >= p.costMarks,
  }));
}

export type PurchasePerkResult =
  | { ok: true; perkId: string }
  | { ok: false; reason: 'disabled' | 'not-found' | 'already-unlocked' | 'insufficient-marks' };

export function purchasePerk(perkId: string): PurchasePerkResult {
  loadCharacter();
  if (!character.progression.enabled) return { ok: false, reason: 'disabled' };

  const perk = PERKS.find((p) => p.id === perkId);
  if (!perk) return { ok: false, reason: 'not-found' };

  if (character.progression.unlocked?.[perkId]) return { ok: false, reason: 'already-unlocked' };

  const marks = Number(character.progression.marks) || 0;
  if (marks < perk.costMarks) return { ok: false, reason: 'insufficient-marks' };

  updateCharacter({
    progression: {
      marks: marks - perk.costMarks,
      unlocked: { [perkId]: true },
    },
  } as any);

  return { ok: true, perkId };
}

function pruneActivityDays(days: Record<string, any>, keepDays: number): Record<string, any> {
  const keys = Object.keys(days || {}).sort();
  if (keys.length <= keepDays) return days;
  const keep = new Set(keys.slice(keys.length - keepDays));
  const next: Record<string, any> = {};
  for (const k of keys) {
    if (keep.has(k)) next[k] = days[k];
  }
  return next;
}

export function recordToolOpened(toolId: string): void {
  if (typeof window === 'undefined') return;
  if (!toolId) return;
  loadCharacter();
  if (!character.progression.enabled) return;

  const date = todayKey();
  const days = character.progression.activity?.days || {};
  const day = days[date] || { toolsOpened: {}, milesAdvanced: 0, mileUpdates: 0 };
  const prev = Number(day.toolsOpened?.[toolId]) || 0;

  const nextDay = {
    ...day,
    toolsOpened: {
      ...(day.toolsOpened || {}),
      [toolId]: prev + 1,
    },
  };

  const nextDays = pruneActivityDays({ ...days, [date]: nextDay }, 45);
  updateCharacter({
    progression: {
      activity: {
        days: nextDays,
        lastPrunedAt: new Date().toISOString(),
      },
    },
  } as any);
}

export function recordMileUpdate(fromMile: number, toMile: number): void {
  if (typeof window === 'undefined') return;
  loadCharacter();
  if (!character.progression.enabled) return;

  const from = Number(fromMile);
  const to = Number(toMile);
  if (!Number.isFinite(from) || !Number.isFinite(to)) return;

  const delta = Math.max(0, to - from);

  const date = todayKey();
  const days = character.progression.activity?.days || {};
  const day = days[date] || { toolsOpened: {}, milesAdvanced: 0, mileUpdates: 0 };

  const nextDay = {
    ...day,
    milesAdvanced: (Number(day.milesAdvanced) || 0) + delta,
    mileUpdates: (Number(day.mileUpdates) || 0) + 1,
  };

  const nextDays = pruneActivityDays({ ...days, [date]: nextDay }, 45);
  updateCharacter({
    progression: {
      activity: {
        days: nextDays,
        lastPrunedAt: new Date().toISOString(),
      },
    },
  } as any);
}
