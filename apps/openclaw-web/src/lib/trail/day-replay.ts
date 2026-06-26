// Pure, client-safe day-grouping + day-summary logic for the public AT map's
// "replay a day" mode. Kept dependency-free (no node, no $lib, no SvelteKit
// aliases) so it unit-tests under node:test (scripts/scout-day-replay.test.mjs)
// and runs unchanged in the browser.
//
// Data honesty rules baked in (see docs/trail-data-provenance.md):
//   - Miles come straight from the calibrated tracker fixes (official frame);
//     we never re-derive or invent a mile here.
//   - Garmin fixes carry NO per-fix elevation, so a day's gain/loss/high/low
//     is computed from the trail's MODELED elevation series over the miles
//     actually covered, and flagged `elevationModeled: true`. If no modeled
//     samples cover the range, every elevation field stays null — we do not
//     fabricate climb from sparse dots.
//   - Sparse/empty days return an honest confidence note instead of a
//     confident-looking number.

// AT day boundaries follow trail-local time. Eastern covers GA→ME; the few
// trail miles physically in a different zone are immaterial to "what did Dad
// do yesterday". Matches the convention the rest of the site uses.
export const TRAIL_TIME_ZONE = 'America/New_York';

export interface DayReplayPoint {
  readonly lat: number;
  readonly lon: number;
  readonly mile: number | null;
  readonly observedAt: string | null;
}

export interface DayElevationSample {
  readonly mile: number;
  readonly elevationFt: number;
}

export interface DayDifficultySegment {
  readonly startMile: number;
  readonly endMile: number;
  readonly score: number;
  readonly label: string;
}

export interface SummarizeDayInputs {
  readonly elevation?: readonly DayElevationSample[];
  readonly difficulty?: readonly DayDifficultySegment[];
}

export type DayConfidence = 'good' | 'fair' | 'sparse' | 'none';

export interface DaySummary {
  readonly dateKey: string; // YYYY-MM-DD in the trail timezone
  readonly pointCount: number;
  readonly startTime: string | null; // ISO of the first fix that day
  readonly endTime: string | null; // ISO of the last fix that day
  readonly elapsedMinutes: number | null;
  readonly startMile: number | null;
  readonly endMile: number | null;
  readonly milesCovered: number | null; // |endMile - startMile|, trail frame
  readonly elevationGainFt: number | null;
  readonly elevationLossFt: number | null;
  readonly highestFt: number | null;
  readonly lowestFt: number | null;
  readonly elevationModeled: boolean; // true → derived from the trail model, not the fixes
  readonly difficultyScore: number | null;
  readonly difficultyLabel: string | null;
  readonly confidence: DayConfidence;
  readonly confidenceNote: string | null;
}

export interface DayOption {
  readonly key: string; // YYYY-MM-DD
  readonly label: string; // "Today" / "Yesterday" / "3 days ago" / "Mon Apr 14"
  readonly count: number; // fixes recorded that day
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function parseTime(iso: string | null): number | null {
  if (!iso) return null;
  const t = Date.parse(iso);
  return Number.isFinite(t) ? t : null;
}

// Map an instant to its YYYY-MM-DD calendar date in the trail timezone.
// Intl with en-CA yields ISO-ordered date parts; this is the standard way to
// bucket UTC instants into local days without pulling in a date library.
export function dayKeyFor(iso: string | null, timeZone: string = TRAIL_TIME_ZONE): string | null {
  const t = parseTime(iso);
  if (t === null) return null;
  try {
    // en-CA → "2026-03-01"
    return new Intl.DateTimeFormat('en-CA', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).format(new Date(t));
  } catch {
    // Unknown timezone (very old runtime): fall back to UTC date.
    return new Date(t).toISOString().slice(0, 10);
  }
}

// Whole-day difference between two YYYY-MM-DD calendar keys (a - b), parsed as
// UTC midnights so DST never shifts the count.
function dayDelta(aKey: string, bKey: string): number | null {
  const a = Date.parse(`${aKey}T00:00:00Z`);
  const b = Date.parse(`${bKey}T00:00:00Z`);
  if (!Number.isFinite(a) || !Number.isFinite(b)) return null;
  return Math.round((a - b) / 86_400_000);
}

export function relativeDayLabel(dateKey: string, todayKey: string): string {
  const delta = dayDelta(todayKey, dateKey); // positive → dateKey is in the past
  if (delta === 0) return 'Today';
  if (delta === 1) return 'Yesterday';
  if (delta !== null && delta > 1 && delta < 7) return `${delta} days ago`;
  // Older (or future, which shouldn't happen): a stable weekday + date label,
  // formatted in UTC so the calendar date can't slip a day.
  const t = Date.parse(`${dateKey}T12:00:00Z`);
  if (!Number.isFinite(t)) return dateKey;
  return new Intl.DateTimeFormat('en-US', {
    timeZone: 'UTC',
    weekday: 'short',
    month: 'short',
    day: 'numeric'
  }).format(new Date(t));
}

// Compact label for the day-browse rail: "Today" / "Yest" / "Wed 24".
// Built piece-by-piece (not a single Intl call) so the weekday+day format is
// stable across runtimes; UTC so the calendar date can't slip.
export function shortDayLabel(dateKey: string, todayKey: string): string {
  const delta = dayDelta(todayKey, dateKey);
  if (delta === 0) return 'Today';
  if (delta === 1) return 'Yest';
  const t = Date.parse(`${dateKey}T12:00:00Z`);
  if (!Number.isFinite(t)) return dateKey;
  const date = new Date(t);
  const weekday = new Intl.DateTimeFormat('en-US', { timeZone: 'UTC', weekday: 'short' }).format(date);
  const day = new Intl.DateTimeFormat('en-US', { timeZone: 'UTC', day: 'numeric' }).format(date);
  return `${weekday} ${day}`;
}

// Unique day keys that have at least one usable fix, newest first.
export function listTrackedDays(
  points: readonly DayReplayPoint[],
  timeZone: string = TRAIL_TIME_ZONE
): string[] {
  const seen = new Set<string>();
  for (const point of points) {
    const key = dayKeyFor(point.observedAt, timeZone);
    if (key) seen.add(key);
  }
  return Array.from(seen).sort((a, b) => (a < b ? 1 : a > b ? -1 : 0));
}

// Day chips for the picker: the most recent `max` tracked days, each labeled
// relative to `todayKey` (today-in-trail-timezone, supplied by the caller so
// the function stays pure/testable).
export function buildDayOptions(
  points: readonly DayReplayPoint[],
  todayKey: string,
  timeZone: string = TRAIL_TIME_ZONE,
  max = 8
): DayOption[] {
  const counts = new Map<string, number>();
  for (const point of points) {
    const key = dayKeyFor(point.observedAt, timeZone);
    if (key) counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return Array.from(counts.keys())
    .sort((a, b) => (a < b ? 1 : a > b ? -1 : 0))
    .slice(0, max)
    .map((key) => ({ key, label: relativeDayLabel(key, todayKey), count: counts.get(key) ?? 0 }));
}

export function pointsForDay(
  points: readonly DayReplayPoint[],
  dateKey: string,
  timeZone: string = TRAIL_TIME_ZONE
): DayReplayPoint[] {
  return points
    .filter((point) => dayKeyFor(point.observedAt, timeZone) === dateKey)
    .sort((a, b) => (parseTime(a.observedAt) ?? 0) - (parseTime(b.observedAt) ?? 0));
}

// score → coarse difficulty band. Mirrors the bands the map uses for its
// terrain colors so the day note reads consistently with the live detail.
export function difficultyBandLabel(score: number): string {
  if (score >= 8.5) return 'severe';
  if (score >= 7) return 'hard';
  if (score >= 5) return 'steady';
  return 'cruise';
}

function elevationOverRange(
  samples: readonly DayElevationSample[],
  lo: number,
  hi: number
): { gainFt: number; lossFt: number; highestFt: number; lowestFt: number } | null {
  const inRange = samples
    .filter((s) => isFiniteNumber(s.mile) && isFiniteNumber(s.elevationFt) && s.mile >= lo && s.mile <= hi)
    .sort((a, b) => a.mile - b.mile);
  if (inRange.length < 2) return null;

  let gain = 0;
  let loss = 0;
  let highest = inRange[0].elevationFt;
  let lowest = inRange[0].elevationFt;
  for (let i = 1; i < inRange.length; i += 1) {
    const delta = inRange[i].elevationFt - inRange[i - 1].elevationFt;
    if (delta > 0) gain += delta;
    else loss += -delta;
    if (inRange[i].elevationFt > highest) highest = inRange[i].elevationFt;
    if (inRange[i].elevationFt < lowest) lowest = inRange[i].elevationFt;
  }
  // Round gain/loss to the nearest 10 ft — the model can't justify finer.
  return {
    gainFt: Math.round(gain / 10) * 10,
    lossFt: Math.round(loss / 10) * 10,
    highestFt: Math.round(highest),
    lowestFt: Math.round(lowest)
  };
}

function difficultyOverRange(
  segments: readonly DayDifficultySegment[],
  lo: number,
  hi: number
): { score: number; label: string } | null {
  if (hi <= lo) {
    // Zero-length range (one fix / no movement): use the segment covering the point.
    const at = segments.find((s) => lo >= s.startMile && lo <= s.endMile);
    return at ? { score: Math.round(at.score * 10) / 10, label: difficultyBandLabel(at.score) } : null;
  }
  let weighted = 0;
  let covered = 0;
  for (const s of segments) {
    const overlap = Math.min(hi, s.endMile) - Math.max(lo, s.startMile);
    if (overlap <= 0) continue;
    weighted += s.score * overlap;
    covered += overlap;
  }
  if (covered <= 0) return null;
  const score = weighted / covered;
  return { score: Math.round(score * 10) / 10, label: difficultyBandLabel(score) };
}

export function summarizeDay(
  allPoints: readonly DayReplayPoint[],
  dateKey: string,
  timeZone: string = TRAIL_TIME_ZONE,
  inputs: SummarizeDayInputs = {}
): DaySummary {
  const dayPoints = pointsForDay(allPoints, dateKey, timeZone);
  const empty: DaySummary = {
    dateKey,
    pointCount: 0,
    startTime: null,
    endTime: null,
    elapsedMinutes: null,
    startMile: null,
    endMile: null,
    milesCovered: null,
    elevationGainFt: null,
    elevationLossFt: null,
    highestFt: null,
    lowestFt: null,
    elevationModeled: false,
    difficultyScore: null,
    difficultyLabel: null,
    confidence: 'none',
    confidenceNote: 'No Garmin fixes recorded for this day.'
  };
  if (!dayPoints.length) return empty;

  const startTime = dayPoints[0].observedAt;
  const endTime = dayPoints[dayPoints.length - 1].observedAt;
  const startMs = parseTime(startTime);
  const endMs = parseTime(endTime);
  const elapsedMinutes =
    startMs !== null && endMs !== null && endMs > startMs ? Math.round((endMs - startMs) / 60_000) : null;

  const miles = dayPoints.map((p) => p.mile).filter(isFiniteNumber);
  const startMile = miles.length ? miles[0] : null;
  const endMile = miles.length ? miles[miles.length - 1] : null;
  const milesCovered =
    startMile !== null && endMile !== null ? Math.round(Math.abs(endMile - startMile) * 10) / 10 : null;

  // Elevation/difficulty span the miles actually covered (in trail order).
  const lo = startMile !== null && endMile !== null ? Math.min(startMile, endMile) : null;
  const hi = startMile !== null && endMile !== null ? Math.max(startMile, endMile) : null;

  let elevationGainFt: number | null = null;
  let elevationLossFt: number | null = null;
  let highestFt: number | null = null;
  let lowestFt: number | null = null;
  let elevationModeled = false;
  if (lo !== null && hi !== null && inputs.elevation?.length) {
    const elev = elevationOverRange(inputs.elevation, lo, hi);
    if (elev) {
      elevationGainFt = elev.gainFt;
      elevationLossFt = elev.lossFt;
      highestFt = elev.highestFt;
      lowestFt = elev.lowestFt;
      elevationModeled = true;
    }
  }

  let difficultyScore: number | null = null;
  let difficultyLabel: string | null = null;
  if (lo !== null && hi !== null && inputs.difficulty?.length) {
    const diff = difficultyOverRange(inputs.difficulty, lo, hi);
    if (diff) {
      difficultyScore = diff.score;
      difficultyLabel = diff.label;
    }
  }

  // Confidence reflects how much we can trust the day's mileage/elevation,
  // driven mainly by how many fixes Garmin recorded.
  const count = dayPoints.length;
  let confidence: DayConfidence;
  if (count >= 8) confidence = 'good';
  else if (count >= 4) confidence = 'fair';
  else confidence = 'sparse';

  const haveMiles = milesCovered !== null;
  const noteParts: string[] = [];
  if (confidence === 'sparse') {
    // Don't call mileage "approximate" when there's no mileage at all — the
    // "distance is unknown" sentence below carries that case.
    noteParts.push(
      haveMiles
        ? `Only ${count} ${count === 1 ? 'fix' : 'fixes'} this day, so ${
            elevationModeled ? 'mileage and elevation are' : 'mileage is'
          } approximate.`
        : `Only ${count} ${count === 1 ? 'fix' : 'fixes'} this day.`
    );
  } else if (confidence === 'fair') {
    noteParts.push(`${count} fixes this day — a rough but usable picture.`);
  }
  if (!haveMiles) {
    noteParts.push('No calibrated mile on these fixes, so distance is unknown.');
  }
  if (elevationModeled) {
    noteParts.push('Elevation is modeled for the miles covered (USGS 3DEP screen), not measured per fix.');
  } else if (milesCovered !== null) {
    noteParts.push('No modeled elevation covers this stretch, so gain/loss is unavailable.');
  }

  return {
    dateKey,
    pointCount: count,
    startTime,
    endTime,
    elapsedMinutes,
    startMile: startMile !== null ? Math.round(startMile * 10) / 10 : null,
    endMile: endMile !== null ? Math.round(endMile * 10) / 10 : null,
    milesCovered,
    elevationGainFt,
    elevationLossFt,
    highestFt,
    lowestFt,
    elevationModeled,
    difficultyScore,
    difficultyLabel,
    confidence,
    confidenceNote: noteParts.length ? noteParts.join(' ') : null
  };
}
