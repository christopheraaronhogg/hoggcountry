import type { ManualProfile, ReflectionStyle, ShelterPreference } from '@hoggcountry/manual-core';

export * from './at-route-validator.ts';
export * from './trail-direction.ts';

export interface TrailPhase {
  readonly id: string;
  readonly label: string;
  readonly mileStart: number;
  readonly mileEnd: number;
  readonly focus: string;
}

export interface TodayCard {
  readonly id: string;
  readonly title: string;
  readonly detail: string;
  readonly citation: string;
  readonly tone: 'steady' | 'action' | 'caution';
}

export interface PlanLane {
  readonly id: string;
  readonly title: string;
  readonly summary: string;
  readonly actions: readonly string[];
  readonly citation: string;
}

export const TRAIL_FACTS = {
  totalMiles: 2197.9,
  shelterCount: 260,
  averageCompletionDays: 165,
  lastVerified: '2026-01-14',
} as const;

export const TRAIL_PHASES: readonly TrailPhase[] = [
  {
    id: 'launch',
    label: 'Launch Window',
    mileStart: 0,
    mileEnd: 275,
    focus: 'Patience, gear shakeout, and conservative decisions.',
  },
  {
    id: 'southern-rhythm',
    label: 'Southern Rhythm',
    mileStart: 275,
    mileEnd: 750,
    focus: 'Build repeatable trail days before mileage pride takes over.',
  },
  {
    id: 'virginia-blues',
    label: 'Virginia Blues',
    mileStart: 750,
    mileEnd: 1200,
    focus: 'Protect morale and consistency when the trail feels endless.',
  },
  {
    id: 'northern-shift',
    label: 'Northern Shift',
    mileStart: 1200,
    mileEnd: 1700,
    focus: 'Prepare for stronger terrain and tighter weather windows.',
  },
  {
    id: 'whites-and-maine',
    label: 'Whites and Maine',
    mileStart: 1700,
    mileEnd: TRAIL_FACTS.totalMiles,
    focus: 'Move deliberately. Terrain judgment matters more than big-mile ego.',
  },
] as const;

function waterRule(capacityLiters: number): string {
  if (capacityLiters >= 3) {
    return `You can carry ${capacityLiters.toFixed(1)}L. Leave town full when heat, ridgeline exposure, or uncertain reports stack up.`;
  }

  if (capacityLiters >= 2) {
    return `You carry ${capacityLiters.toFixed(1)}L. Treat long dry comments or exposed climbs as a fill-up trigger, not background chatter.`;
  }

  return `You only carry ${capacityLiters.toFixed(1)}L. Build your day around refill certainty and conservative exits from town.`;
}

function shelterRule(preference: ShelterPreference): string {
  switch (preference) {
    case 'tent-first':
      return 'Default to your tent when crowding, condensation, or sleep quality matter more than speed.';
    case 'shelter-first':
      return 'Default to shelters when conditions are calm, but switch quickly when noise, mice, or illness shift the tradeoff.';
    default:
      return 'Start with the easiest overnight option, then change fast when weather or morale says the night is slipping.';
  }
}

function reflectionRule(style: ReflectionStyle, phase: TrailPhase): string {
  if (style === 'faith-informed') {
    return `This phase is about ${phase.focus.toLowerCase()} Keep the next right decision in front of you and let the rest stay small.`;
  }

  return `This phase is about ${phase.focus.toLowerCase()} Narrow the day down to the next clear action and ignore the noise you do not need.`;
}

export function getTrailPhase(currentMile: number): TrailPhase {
  return (
    TRAIL_PHASES.find((phase) => currentMile >= phase.mileStart && currentMile < phase.mileEnd)
    ?? TRAIL_PHASES[TRAIL_PHASES.length - 1]
  );
}

export function buildTodayCards(profile: ManualProfile): readonly TodayCard[] {
  const phase = getTrailPhase(profile.currentMile);
  const nextPhase = TRAIL_PHASES.find((candidate) => candidate.mileStart > profile.currentMile);

  return [
    {
      id: 'phase',
      title: phase.label,
      detail: `${phase.focus} You are roughly at mile ${profile.currentMile.toFixed(1)} of ${TRAIL_FACTS.totalMiles}.`,
      citation: 'Trail facts audit · 2026 core AT facts',
      tone: 'steady',
    },
    {
      id: 'water',
      title: 'Water carry',
      detail: waterRule(profile.waterCapacityLiters),
      citation: 'ATC 2025 long-distance hiker survey priority: water planning',
      tone: 'action',
    },
    {
      id: 'shelter',
      title: 'Sleep decision',
      detail: shelterRule(profile.shelterPreference),
      citation: 'Hogg Country operating rule',
      tone: 'steady',
    },
    {
      id: 'pace',
      title: 'Pace guardrail',
      detail: `Your planning pace is ${profile.targetPace} mi/day. Protect consistency first; mileage can rise after the body, feet, and weather agree.`,
      citation: 'Hogg Country planning template',
      tone: 'caution',
    },
    {
      id: 'reflection',
      title: 'Trail note',
      detail: reflectionRule(profile.reflectionStyle, phase),
      citation: profile.reflectionStyle === 'faith-informed' ? 'Personal voice layer' : 'Practical-only reflection layer',
      tone: 'steady',
    },
    {
      id: 'next-phase',
      title: 'Look ahead',
      detail: nextPhase
        ? `The next shift is ${nextPhase.label} at mile ${nextPhase.mileStart}. Start adjusting your gear, recovery, and expectations before you hit it.`
        : 'You are in the final phase. Protect judgment, weather windows, and body maintenance more than speed.',
      citation: 'Trail phase model',
      tone: 'action',
    },
  ];
}

export function buildPlanLanes(profile: ManualProfile): readonly PlanLane[] {
  const finishWindowDays = Math.round(TRAIL_FACTS.totalMiles / Math.max(1, profile.targetPace)) + (profile.zeroDaysPerMonth * 5);
  const paceSummary = `At ${profile.targetPace} mi/day with ${profile.zeroDaysPerMonth} zero days per month, your rough finish runway is about ${finishWindowDays} days.`;

  return [
    {
      id: 'journey',
      title: 'Journey',
      summary: paceSummary,
      actions: [
        'Review whether your current pace still matches terrain and recovery.',
        'Set one checkpoint where you will reconsider mileage instead of changing it every day.',
        'Keep one slower-weather fallback in the manual so bad weeks do not feel like failure.',
      ],
      citation: 'Journey planning lane',
    },
    {
      id: 'town-stop',
      title: 'Town Stop',
      summary: `Your town style is ${profile.townStyle}. Town time should solve problems, not create drift.`,
      actions: [
        'Decide your top three town jobs before you walk in.',
        'Protect charging, calories, cleanup, and resupply before comfort spending.',
        profile.budgetTier === 'dirtbag'
          ? 'Treat hostels and restaurant splurges as deliberate tradeoffs, not defaults.'
          : 'Use money to remove genuine blockers, not to erase every inconvenience.',
      ],
      citation: 'Town stop operating lane',
    },
    {
      id: 'transitions',
      title: 'Transitions',
      summary: `Your gear philosophy is ${profile.gearPhilosophy}. Change gear when conditions or repeated friction justify it, not because the internet got loud.`,
      actions: [
        'Mark the next shoe-replacement window before the current pair becomes a crisis.',
        'Keep one cold-weather and one hot-weather checkpoint in the manual.',
        'Write down what is truly failing before you buy a replacement or swap systems.',
      ],
      citation: 'Gear transition lane',
    },
  ];
}
