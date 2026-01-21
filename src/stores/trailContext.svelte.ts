export type TrailContextMode = 'planning' | 'trail';

export interface TrailLandmark {
  mile: number;
  name: string;
}

export interface TrailContextSnapshot {
  mode: TrailContextMode;
  isOnTrail: boolean;

  // Core inputs
  currentMile: number;
  startDate: string; // YYYY-MM-DD
  targetPace: number; // miles/day
  zeroDaysPerMonth: number;

  // Computed
  effectiveDate: string; // Today if startDate has passed; else startDate
  daysOnTrail: number;
  actualPace: number;
  percentComplete: number;
  nearestLandmark: TrailLandmark;
  projectedFinish: Date;
  hikingDaysPlanned: number;
  totalDaysPlanned: number;
  milesRemaining: number;
  daysToFinish: number;

  // Legacy aliases used by existing tool components
  pace: number;
  tripStartDate: string;
}

const TRAIL_TOTAL_MILES = 2198;
const STORAGE_KEY = 'trailContext';

const landmarks: TrailLandmark[] = [
  { mile: 0, name: 'Springer Mountain' },
  { mile: 31, name: 'Neels Gap' },
  { mile: 78, name: 'NC Border' },
  { mile: 110, name: 'Franklin' },
  { mile: 166, name: 'Fontana Dam' },
  { mile: 206, name: 'Newfound Gap' },
  { mile: 274, name: 'Hot Springs' },
  { mile: 386, name: 'Damascus' },
  { mile: 550, name: 'Pearisburg' },
  { mile: 702, name: 'Waynesboro' },
  { mile: 1025, name: 'Harpers Ferry' },
  { mile: 1099, name: 'Halfway Point' },
  { mile: 1290, name: 'Delaware Water Gap' },
  { mile: 1525, name: 'CT Border' },
  { mile: 1630, name: 'VT Border' },
  { mile: 1791, name: 'White Mountains' },
  { mile: 1912, name: 'Maine Border' },
  { mile: 2090, name: 'Monson' },
  { mile: 2198, name: 'Katahdin' },
];

function clampNumber(value: unknown, min: number, max: number, fallback: number): number {
  const num = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(num)) return fallback;
  return Math.max(min, Math.min(max, num));
}

function getNearestLandmark(mile: number): TrailLandmark {
  let closest = landmarks[0];
  let minDist = Math.abs(mile - landmarks[0].mile);
  for (const lm of landmarks) {
    const dist = Math.abs(mile - lm.mile);
    if (dist < minDist) {
      minDist = dist;
      closest = lm;
    }
  }
  return closest;
}

function getTodayStr(): string {
  return new Date().toISOString().split('T')[0]!;
}

function isPastDate(dateStr: string): boolean {
  return new Date(dateStr) <= new Date();
}

function daysBetween(date1: string, date2: string): number {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  return Math.floor((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24));
}

function addDaysToDate(dateStr: string, days: number): Date {
  const date = new Date(dateStr);
  date.setDate(date.getDate() + days);
  return date;
}

// =============================================================================
// Shared state (Svelte 5 runes module)
// =============================================================================

let hydrated = $state(false);

export const trailContextInput = $state({
  currentMile: 0,
  startDate: '2026-03-01',
  targetPace: 15,
  zeroDaysPerMonth: 4,
});

export function loadContext(): void {
  if (typeof localStorage === 'undefined') return;

  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    try {
      const ctx = JSON.parse(saved) as Record<string, unknown>;
      trailContextInput.currentMile = clampNumber(ctx.currentMile, 0, TRAIL_TOTAL_MILES, 0);
      trailContextInput.startDate = typeof ctx.startDate === 'string'
        ? ctx.startDate
        : (typeof ctx.tripStartDate === 'string' ? ctx.tripStartDate : trailContextInput.startDate);

      // Support legacy and current keys
      const maybePace = ctx.targetPace ?? ctx.pace;
      trailContextInput.targetPace = clampNumber(maybePace, 8, 30, trailContextInput.targetPace);
      trailContextInput.zeroDaysPerMonth = clampNumber(ctx.zeroDaysPerMonth, 0, 15, trailContextInput.zeroDaysPerMonth);
    } catch {
      // Ignore malformed saved context
    }
  }

  hydrated = true;
}

export function updateContext(next: Partial<Pick<TrailContextSnapshot, 'currentMile' | 'startDate' | 'targetPace' | 'zeroDaysPerMonth'>>): void {
  if (next.currentMile !== undefined) trailContextInput.currentMile = clampNumber(next.currentMile, 0, TRAIL_TOTAL_MILES, trailContextInput.currentMile);
  if (next.startDate !== undefined && typeof next.startDate === 'string') trailContextInput.startDate = next.startDate;
  if (next.targetPace !== undefined) trailContextInput.targetPace = clampNumber(next.targetPace, 8, 30, trailContextInput.targetPace);
  if (next.zeroDaysPerMonth !== undefined) trailContextInput.zeroDaysPerMonth = clampNumber(next.zeroDaysPerMonth, 0, 15, trailContextInput.zeroDaysPerMonth);
}

// Persist inputs (only after explicit loadContext() to avoid overwriting user data with defaults)
$effect(() => {
  if (!hydrated) return;
  if (typeof localStorage === 'undefined') return;

  const payload = {
    currentMile: trailContextInput.currentMile,
    startDate: trailContextInput.startDate,
    targetPace: trailContextInput.targetPace,
    zeroDaysPerMonth: trailContextInput.zeroDaysPerMonth,
    // Legacy aliases for tools that read localStorage directly (if any)
    pace: trailContextInput.targetPace,
    tripStartDate: trailContextInput.startDate,
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
});

// =============================================================================
// Computed snapshot (exported as state object)
// =============================================================================

function getCalendarDaysForMiles(miles: number): number {
  const hikingDays = Math.ceil(miles / trailContextInput.targetPace);
  return Math.ceil(hikingDays / (1 - trailContextInput.zeroDaysPerMonth / 30));
}

function computeSnapshot(): TrailContextSnapshot {
  const currentMile = trailContextInput.currentMile;
  const startDate = trailContextInput.startDate;
  const targetPace = trailContextInput.targetPace;
  const zeroDaysPerMonth = trailContextInput.zeroDaysPerMonth;

  const isOnTrail = currentMile > 0 || isPastDate(startDate);
  const mode: TrailContextMode = isOnTrail ? 'trail' : 'planning';

  const nearestLandmark = getNearestLandmark(currentMile);
  const today = getTodayStr();
  const daysOnTrail = isOnTrail ? Math.max(1, daysBetween(startDate, today)) : 0;
  const actualPace = isOnTrail && daysOnTrail > 0 ? Number((currentMile / daysOnTrail).toFixed(1)) : targetPace;
  const percentComplete = Number(((currentMile / TRAIL_TOTAL_MILES) * 100).toFixed(0));

  const hikingDaysPlanned = Math.ceil(TRAIL_TOTAL_MILES / targetPace);
  const totalDaysPlanned = Math.ceil(hikingDaysPlanned / (1 - zeroDaysPerMonth / 30));

  const effectiveDate = isPastDate(startDate) ? today : startDate;
  const milesRemaining = Math.max(0, TRAIL_TOTAL_MILES - currentMile);

  const daysToFinish = isOnTrail ? getCalendarDaysForMiles(milesRemaining) : totalDaysPlanned;
  const projectedFinish = addDaysToDate(effectiveDate, daysToFinish);

  return {
    mode,
    isOnTrail,
    currentMile,
    startDate,
    targetPace,
    zeroDaysPerMonth,
    effectiveDate,
    daysOnTrail,
    actualPace,
    percentComplete,
    nearestLandmark,
    projectedFinish,
    hikingDaysPlanned,
    totalDaysPlanned,
    milesRemaining,
    daysToFinish,
    pace: targetPace,
    tripStartDate: startDate,
  };
}

export const trailContext = $state<TrailContextSnapshot>(computeSnapshot());

$effect(() => {
  const next = computeSnapshot();
  Object.assign(trailContext, next);
});

export function getContextSnapshot(): TrailContextSnapshot {
  return trailContext;
}
