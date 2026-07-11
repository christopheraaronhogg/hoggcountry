export type TrailDirection = 'NOBO' | 'SOBO';

export const TRAIL_MILE_EPSILON = 0.01;

export interface TrailProgress {
  readonly completedMiles: number;
  readonly remainingMiles: number;
  readonly percent: number;
}

export interface DirectedTrailWindow {
  readonly fromMile: number;
  readonly toMile: number;
  readonly minMile: number;
  readonly maxMile: number;
  readonly spanMiles: number;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/** Positive means ahead in the hiker's direction; negative means behind. */
export function directedMileDelta(
  fromMile: number,
  targetMile: number,
  direction: TrailDirection
): number {
  return direction === 'SOBO' ? fromMile - targetMile : targetMile - fromMile;
}

/**
 * Return finite trail items at or ahead of the hiker, nearest first. The input
 * is never mutated. A max span of zero still includes an item exactly "here".
 */
export function trailAhead<T extends { readonly mile: number }>(
  items: readonly T[],
  fromMile: number,
  direction: TrailDirection,
  maxMiles?: number
): T[] {
  if (!Number.isFinite(fromMile)) return [];
  if (maxMiles !== undefined && (!Number.isFinite(maxMiles) || maxMiles < 0)) return [];

  return items
    .filter((item) => {
      if (!Number.isFinite(item.mile)) return false;
      const delta = directedMileDelta(fromMile, item.mile, direction);
      return delta >= -TRAIL_MILE_EPSILON
        && (maxMiles === undefined || delta <= maxMiles + TRAIL_MILE_EPSILON);
    })
    .sort((a, b) =>
      directedMileDelta(fromMile, a.mile, direction)
      - directedMileDelta(fromMile, b.mile, direction));
}

export function trailProgress(
  currentMile: number,
  totalMiles: number,
  direction: TrailDirection
): TrailProgress {
  if (!Number.isFinite(totalMiles) || totalMiles <= 0 || !Number.isFinite(currentMile)) {
    return { completedMiles: 0, remainingMiles: 0, percent: 0 };
  }

  const current = clamp(currentMile, 0, totalMiles);
  const completedMiles = direction === 'SOBO' ? totalMiles - current : current;
  const remainingMiles = totalMiles - completedMiles;
  return {
    completedMiles,
    remainingMiles,
    percent: (completedMiles / totalMiles) * 100
  };
}

export function directedTrailWindow(
  currentMile: number,
  requestedSpanMiles: number,
  totalMiles: number,
  direction: TrailDirection
): DirectedTrailWindow | null {
  if (
    !Number.isFinite(currentMile)
    || !Number.isFinite(requestedSpanMiles)
    || requestedSpanMiles < 0
    || !Number.isFinite(totalMiles)
    || totalMiles < 0
  ) return null;

  const fromMile = clamp(currentMile, 0, totalMiles);
  const requestedEnd = direction === 'SOBO'
    ? fromMile - requestedSpanMiles
    : fromMile + requestedSpanMiles;
  const toMile = clamp(requestedEnd, 0, totalMiles);
  return {
    fromMile,
    toMile,
    minMile: Math.min(fromMile, toMile),
    maxMile: Math.max(fromMile, toMile),
    spanMiles: Math.abs(toMile - fromMile)
  };
}
