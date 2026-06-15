// Builds the public "trail journey" timeline: Dad's live 2026 NOBO position
// projected against the calibrated state lines, landmarks, milestones, and
// dispatches. Every mile here is the official-frame mile (same source as the
// map and tracker banner) — see docs/trail-data-provenance.md.

// Runtime imports ($lib alias + cross-tree trail data) are loaded dynamically
// inside loadJourney so the pure buildJourney() stays importable by node:test
// without the SvelteKit alias graph (mirrors today-context.ts).

// The one place to correct the start date. The app stores use 2026-03-01;
// CLAUDE.md references "Feb 2026" — confirm against Dad's actual first fix.
export const HIKE_START_DATE = '2026-03-01';

export interface JourneyLandmark {
  readonly name: string;
  readonly mile: number;
  readonly type: string;
  readonly significance: string | null;
  readonly elevationFt: number | null;
  readonly reached: boolean;
}

export interface JourneyMilestone {
  readonly mile: number;
  readonly name: string;
  readonly emoji: string;
  readonly reached: boolean;
}

export interface JourneyDispatch {
  readonly id: string;
  readonly title: string;
  readonly body: string;
  readonly publishedAt: string | null;
  readonly trailMile: number | null;
}

// Minimal local shape for a trail-update dispatch (avoids importing the
// $lib/server/dad type at top level so the pure builder stays node:test-safe).
interface DispatchInput {
  readonly id: string;
  readonly title: string;
  readonly body: string;
  readonly publishedAt: string | null;
  readonly trailMile: number | null;
}

export interface JourneyState {
  readonly id: string;
  readonly name: string;
  readonly entryMile: number;
  readonly exitMile: number;
  readonly miles: number;
  readonly status: 'done' | 'current' | 'upcoming';
  readonly percentThrough: number | null; // only for the current state
  readonly landmarks: JourneyLandmark[];
  readonly milestones: JourneyMilestone[];
  readonly dispatches: JourneyDispatch[];
}

export interface JourneySummary {
  readonly currentMile: number;
  readonly totalMiles: number;
  readonly percentComplete: number;
  readonly milesHiked: number;
  readonly milesRemaining: number;
  readonly currentStateName: string | null;
  readonly daysOnTrail: number;
  readonly paceMilesPerDay: number | null;
  readonly startDate: string;
  readonly latestFixLabel: string | null;
  readonly latestFixAt: string | null;
  readonly isPreview: boolean;
}

export interface JourneyData {
  readonly summary: JourneySummary;
  readonly states: JourneyState[];
}

interface RawState {
  readonly id: string;
  readonly name: string;
  readonly entry_mile: number;
  readonly exit_mile: number;
  readonly miles: number;
}

interface RawLandmark {
  readonly name: string;
  readonly mile: number;
  readonly state?: string;
  readonly type?: string;
  readonly significance?: string;
  readonly elevation?: number;
}

export interface BuildJourneyInput {
  readonly currentMile: number;
  readonly totalMiles: number;
  readonly states: RawState[];
  readonly landmarks: RawLandmark[];
  readonly milestones: readonly { mile: number; name: string; emoji: string }[];
  readonly dispatches: readonly DispatchInput[];
  readonly startDateISO: string;
  readonly nowMs: number;
  readonly latestFixLabel: string | null;
  readonly latestFixAt: string | null;
  readonly isPreview: boolean;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function roundTenth(value: number): number {
  return Math.round(value * 10) / 10;
}

function daysBetween(startISO: string, nowMs: number): number {
  const start = Date.parse(`${startISO}T00:00:00Z`);
  if (!Number.isFinite(start)) return 0;
  const diff = nowMs - start;
  if (diff <= 0) return 0;
  return Math.floor(diff / 86_400_000) + 1; // day 1 = the start day
}

// Assign a mile to exactly one state by range (entry inclusive, exit exclusive;
// the final state is inclusive of the terminus). Mile-based assignment avoids
// the NC/TN boundary-label ambiguity and keeps everything monotonic.
function stateIndexForMile(mile: number, states: RawState[]): number {
  for (let i = 0; i < states.length; i += 1) {
    const last = i === states.length - 1;
    if (mile >= states[i].entry_mile && (mile < states[i].exit_mile || (last && mile <= states[i].exit_mile))) {
      return i;
    }
  }
  return mile < states[0].entry_mile ? 0 : states.length - 1;
}

export function buildJourney(input: BuildJourneyInput): JourneyData {
  const states = [...input.states].sort((a, b) => a.entry_mile - b.entry_mile);
  const total = input.totalMiles;
  const current = clamp(input.currentMile, 0, total);

  const milesByState: JourneyLandmark[][] = states.map(() => []);
  for (const lm of input.landmarks) {
    if (!Number.isFinite(lm.mile)) continue;
    const idx = stateIndexForMile(lm.mile, states);
    milesByState[idx].push({
      name: lm.name,
      mile: roundTenth(lm.mile),
      type: lm.type ?? 'landmark',
      significance: lm.significance ?? null,
      elevationFt: typeof lm.elevation === 'number' ? lm.elevation : null,
      reached: lm.mile <= current
    });
  }

  const milestonesByState: JourneyMilestone[][] = states.map(() => []);
  for (const ms of input.milestones) {
    const idx = stateIndexForMile(ms.mile, states);
    milestonesByState[idx].push({ mile: ms.mile, name: ms.name, emoji: ms.emoji, reached: ms.mile <= current });
  }

  const dispatchesByState: JourneyDispatch[][] = states.map(() => []);
  for (const d of input.dispatches) {
    if (typeof d.trailMile !== 'number' || !Number.isFinite(d.trailMile)) continue;
    const idx = stateIndexForMile(d.trailMile, states);
    dispatchesByState[idx].push({
      id: d.id,
      title: d.title,
      body: d.body,
      publishedAt: d.publishedAt,
      trailMile: roundTenth(d.trailMile)
    });
  }

  const journeyStates: JourneyState[] = states.map((s, i) => {
    const status: JourneyState['status'] =
      current >= s.exit_mile ? 'done' : current >= s.entry_mile ? 'current' : 'upcoming';
    const span = s.exit_mile - s.entry_mile;
    const percentThrough =
      status === 'current' && span > 0 ? roundTenth(clamp(((current - s.entry_mile) / span) * 100, 0, 100)) : null;
    return {
      id: s.id,
      name: s.name,
      entryMile: roundTenth(s.entry_mile),
      exitMile: roundTenth(s.exit_mile),
      miles: roundTenth(s.miles ?? s.exit_mile - s.entry_mile),
      status,
      percentThrough,
      landmarks: milesByState[i].sort((a, b) => a.mile - b.mile),
      milestones: milestonesByState[i].sort((a, b) => a.mile - b.mile),
      dispatches: dispatchesByState[i].sort((a, b) => (a.trailMile ?? 0) - (b.trailMile ?? 0))
    };
  });

  const currentStateIdx = stateIndexForMile(current, states);
  const daysOnTrail = daysBetween(input.startDateISO, input.nowMs);
  const paceMilesPerDay = daysOnTrail > 0 && current > 0 ? roundTenth(current / daysOnTrail) : null;

  return {
    summary: {
      currentMile: roundTenth(current),
      totalMiles: total,
      percentComplete: roundTenth(clamp((current / total) * 100, 0, 100)),
      milesHiked: roundTenth(current),
      milesRemaining: roundTenth(Math.max(0, total - current)),
      currentStateName: input.isPreview ? null : states[currentStateIdx]?.name ?? null,
      daysOnTrail,
      paceMilesPerDay,
      startDate: input.startDateISO,
      latestFixLabel: input.latestFixLabel,
      latestFixAt: input.latestFixAt,
      isPreview: input.isPreview
    },
    states: journeyStates
  };
}

interface LoadJourneyOptions {
  readonly fetch: typeof fetch;
  readonly requestOrigin: string;
}

export async function loadJourney(options: LoadJourneyOptions): Promise<JourneyData> {
  const [{ loadTrailMapPack }, { loadDadTrailUpdates }, { facts }, { MILESTONES }] = await Promise.all([
    import('$lib/server/map-pack'),
    import('$lib/server/dad'),
    import('../../../../../src/data/trailFacts'),
    import('../../../../../src/data/trailMilestones')
  ]);

  const [pack, dispatches] = await Promise.all([
    loadTrailMapPack({ fetch: options.fetch, requestOrigin: options.requestOrigin, historyLimit: 1 }),
    loadDadTrailUpdates(12).catch(() => [])
  ]);

  const current = pack.tracker.current;
  const isPreview = !current || current.source !== 'garmin_mapshare';
  const currentMile = typeof current?.mile === 'number' && Number.isFinite(current.mile) ? current.mile : 0;

  return buildJourney({
    currentMile,
    totalMiles: pack.route.displayMiles,
    states: facts.states as unknown as RawState[],
    landmarks: Object.values(facts.landmarks) as unknown as RawLandmark[],
    milestones: MILESTONES,
    dispatches,
    startDateISO: HIKE_START_DATE,
    nowMs: Date.now(),
    latestFixLabel: !isPreview ? `AT mile ${currentMile.toFixed(1)}` : null,
    latestFixAt: current?.observedAt ?? null,
    isPreview
  });
}
