// Builds the public "trail journey" timeline: Dad's live 2026 NOBO position
// projected against the calibrated state lines, landmarks, milestones, and
// dispatches. Every mile here is the official-frame mile (same source as the
// map and tracker banner) — see docs/trail-data-provenance.md.

// Runtime imports ($lib alias + cross-tree trail data) are loaded dynamically
// inside loadJourney so the pure buildJourney() stays importable by node:test
// without the SvelteKit alias graph (mirrors today-context.ts).

// The one place to correct the start date. The app stores use 2026-03-01;
// CLAUDE.md references "Feb 2026" — confirm against Dad's actual first fix.
import { DAD_HIKE_COMPLETED_ON } from '../dad-hike.ts';
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
  readonly completedOn: string | null;
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

export interface JourneyElevation {
  readonly points: { readonly mile: number; readonly ft: number }[];
  readonly minFt: number;
  readonly maxFt: number;
}

export interface JourneyData {
  readonly summary: JourneySummary;
  readonly states: JourneyState[];
  readonly elevation: JourneyElevation;
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
  readonly completedOn?: string | null;
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
  // Per-mile elevation samples (official frame). Downsampled into a silhouette
  // for the profile chart. Optional so the personal/app path can omit it.
  readonly elevationSamples?: readonly { mile: number; elevationFt: number }[];
}

// Peak-preserving downsample of the elevation series into ~`bins` columns:
// take the max elevation per mile-bin so the Whites/Katahdin spikes survive.
function buildElevation(
  samples: readonly { mile: number; elevationFt: number }[] | undefined,
  totalMiles: number,
  bins = 280
): JourneyElevation {
  const valid = (samples ?? []).filter((s) => Number.isFinite(s.mile) && Number.isFinite(s.elevationFt));
  if (!valid.length || totalMiles <= 0) return { points: [], minFt: 0, maxFt: 0 };

  const binWidth = totalMiles / bins;
  const binMax: (number | null)[] = new Array(bins).fill(null);
  for (const s of valid) {
    const bi = Math.min(bins - 1, Math.max(0, Math.floor(s.mile / binWidth)));
    if (binMax[bi] === null || s.elevationFt > (binMax[bi] as number)) binMax[bi] = s.elevationFt;
  }

  const points: { mile: number; ft: number }[] = [];
  let minFt = Infinity;
  let maxFt = -Infinity;
  for (let i = 0; i < bins; i += 1) {
    if (binMax[i] === null) continue; // sparse gap — skip rather than fabricate
    const ft = Math.max(0, Math.round(binMax[i] as number));
    points.push({ mile: Math.round((i + 0.5) * binWidth * 10) / 10, ft });
    if (ft < minFt) minFt = ft;
    if (ft > maxFt) maxFt = ft;
  }
  return { points, minFt: minFt === Infinity ? 0 : minFt, maxFt: maxFt === -Infinity ? 0 : maxFt };
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
  const completedOn = input.completedOn ?? null;
  const current = completedOn ? total : clamp(input.currentMile, 0, total);
  const isPreview = !completedOn && input.isPreview;

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
  const daysOnTrail = daysBetween(input.startDateISO, completedOn ? Date.parse(`${completedOn}T00:00:00Z`) : input.nowMs);
  const paceMilesPerDay = daysOnTrail > 0 && current > 0 ? roundTenth(current / daysOnTrail) : null;

  return {
    summary: {
      completedOn,
      currentMile: roundTenth(current),
      totalMiles: total,
      percentComplete: roundTenth(clamp((current / total) * 100, 0, 100)),
      milesHiked: roundTenth(current),
      milesRemaining: roundTenth(Math.max(0, total - current)),
      currentStateName: isPreview ? null : states[currentStateIdx]?.name ?? null,
      // In preview there's no known position, so time-on-trail/pace are
      // meaningless and would contradict the "starts soon" / "mile 0" hero.
      daysOnTrail: isPreview ? 0 : daysOnTrail,
      paceMilesPerDay: isPreview ? null : paceMilesPerDay,
      startDate: input.startDateISO,
      latestFixLabel: input.latestFixLabel,
      latestFixAt: input.latestFixAt,
      isPreview
    },
    states: journeyStates,
    elevation: buildElevation(input.elevationSamples, total)
  };
}

// Lean summary for the homepage teaser: uses the light Garmin-track path
// (snapped to the calibrated mileposts) instead of the full map pack, so it
// never parks the homepage behind a 30k-point geojson parse. Returns the
// preview summary on any failure so the homepage always renders.
export async function loadJourneySummary(): Promise<JourneySummary> {
  // Completion no longer depends on Garmin availability or a post-hike fix.
  const { facts } = await import('../../../../../src/data/trailFacts');
  if (DAD_HIKE_COMPLETED_ON) {
    return buildJourney({
      completedOn: DAD_HIKE_COMPLETED_ON,
      currentMile: facts.trail.total_miles.value,
      totalMiles: facts.trail.total_miles.value,
      states: facts.states as unknown as RawState[],
      landmarks: [], milestones: [], dispatches: [],
      startDateISO: HIKE_START_DATE, nowMs: Date.now(),
      latestFixLabel: null, latestFixAt: null, isPreview: false
    }).summary;
  }
  try {
    const [{ loadDadTrack }, { facts }] = await Promise.all([
      import('$lib/server/dad'),
      import('../../../../../src/data/trailFacts')
    ]);
    const track = await loadDadTrack();
    const props = (track.properties ?? {}) as {
      source?: string;
      latestPoint?: { coords?: [number, number]; when?: string };
      latestTrailLocation?: { nearestMile?: number };
    };
    const isPreview = props.source === 'preview' || !props.latestPoint?.coords;
    const currentMile = typeof props.latestTrailLocation?.nearestMile === 'number' ? props.latestTrailLocation.nearestMile : 0;
    const totalMiles = (facts.trail?.total_miles?.value as number) ?? 2197.9;

    return buildJourney({
      currentMile,
      totalMiles,
      states: facts.states as unknown as RawState[],
      landmarks: [],
      milestones: [],
      dispatches: [],
      startDateISO: HIKE_START_DATE,
      nowMs: Date.now(),
      latestFixLabel: isPreview ? null : `AT mile ${currentMile.toFixed(1)}`,
      latestFixAt: props.latestPoint?.when ?? null,
      isPreview
    }).summary;
  } catch {
    return {
      completedOn: null,
      currentMile: 0,
      totalMiles: 2197.9,
      percentComplete: 0,
      milesHiked: 0,
      milesRemaining: 2197.9,
      currentStateName: null,
      daysOnTrail: 0,
      paceMilesPerDay: null,
      startDate: HIKE_START_DATE,
      latestFixLabel: null,
      latestFixAt: null,
      isPreview: true
    };
  }
}

export interface ProfileJourneyInput {
  readonly currentMile?: number | null;
  readonly startDate?: string | null;
  readonly targetPace?: number | null;
}

export interface ProfileJourney {
  readonly journey: JourneyData;
  readonly targetPace: number | null;
  readonly hasProfile: boolean;
}

// The hiker's OWN journey — same engine and frame as the public /journey,
// driven by their workspace profile mile instead of Dad's live fix. No
// dispatches/landmarks-significance differences; it reuses the calibrated
// states + landmarks so a hiker sees the real trail ahead of them.
export async function loadProfileJourney(
  profile: ProfileJourneyInput | null,
  options?: { fetch: typeof fetch; requestOrigin: string }
): Promise<ProfileJourney> {
  const [{ facts }, { MILESTONES }] = await Promise.all([
    import('../../../../../src/data/trailFacts'),
    import('../../../../../src/data/trailMilestones')
  ]);

  // The trail silhouette is identical for everyone; pull the calibrated
  // elevation series from the reference pack when caller wires fetch/origin.
  // Best-effort: a pack failure must not sink the hiker's progress view.
  let elevationSamples: { mile: number; elevationFt: number }[] = [];
  if (options) {
    try {
      // Reference pack only (calibrated geometry/terrain) — no tracker network
      // round-trips, since the elevation silhouette is identical for everyone
      // and the hiker's own mile comes from their profile, not Dad's fix.
      const { loadReferencePack } = await import('$lib/server/map-pack');
      const pack = await loadReferencePack();
      elevationSamples = pack.terrain.elevation.map((e) => ({ mile: e.mile, elevationFt: e.elevationFt }));
    } catch {
      elevationSamples = [];
    }
  }

  const hasProfile = !!profile;
  const currentMile =
    profile && typeof profile.currentMile === 'number' && Number.isFinite(profile.currentMile)
      ? Math.max(0, profile.currentMile)
      : 0;
  const totalMiles = (facts.trail?.total_miles?.value as number) ?? 2197.9;
  const startDateISO =
    profile?.startDate && /^\d{4}-\d{2}-\d{2}/.test(profile.startDate) ? profile.startDate : HIKE_START_DATE;
  const isPreview = !hasProfile || currentMile <= 0;

  const journey = buildJourney({
    currentMile,
    totalMiles,
    states: facts.states as unknown as RawState[],
    landmarks: Object.values(facts.landmarks) as unknown as RawLandmark[],
    milestones: MILESTONES,
    dispatches: [],
    startDateISO,
    nowMs: Date.now(),
    latestFixLabel: null,
    latestFixAt: null,
    isPreview,
    elevationSamples
  });

  const targetPace =
    profile && typeof profile.targetPace === 'number' && Number.isFinite(profile.targetPace) && profile.targetPace > 0
      ? profile.targetPace
      : null;

  return { journey, targetPace, hasProfile };
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
    completedOn: DAD_HIKE_COMPLETED_ON,
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
    isPreview,
    elevationSamples: pack.terrain.elevation.map((e) => ({ mile: e.mile, elevationFt: e.elevationFt }))
  });
}
