import { loadScoutAtOpenReferenceOfflineSummary } from '$lib/server/at-open-reference';
import { loadDadPilotSummary } from '$lib/server/dad';

const TOTAL_AT_MILES = 2197.4;
const PACK_VALID_MS = 6 * 60 * 60 * 1000;
const PILOT_CURRENT_MILE = 582.4;
const PILOT_GENERATED_AT = '2026-06-16T00:00:00.000Z';

type SourceKind = 'trail-pack' | 'field-guide' | 'official' | 'hiker-input' | 'cached-weather' | 'derived';

interface MobileSourceReceipt {
  readonly id: string;
  readonly title: string;
  readonly kind: SourceKind;
  readonly citation?: string;
  readonly url?: string;
  readonly generatedAt?: string;
  readonly miles?: { readonly from: number; readonly to?: number };
}

interface MobileContextPack {
  readonly frame: {
    readonly totalMiles: number;
    readonly startMile: number;
    readonly endMile: number;
    readonly source: string;
  };
  readonly hiker: {
    readonly trailName?: string;
    readonly currentMile: number;
    readonly direction: 'NOBO' | 'SOBO';
    readonly dayNumber: number;
    readonly targetMilesToday?: number;
  };
  readonly water: readonly {
    readonly name: string;
    readonly mile: number;
    readonly reliability: 'reliable' | 'seasonal' | 'thin';
    readonly note?: string;
  }[];
  readonly shelters: readonly {
    readonly name: string;
    readonly mile: number;
    readonly capacity?: number;
    readonly note?: string;
  }[];
  readonly towns: readonly {
    readonly name: string;
    readonly mile: number;
    readonly access: string;
    readonly servicesNote?: string;
  }[];
  readonly guideExcerpts: readonly {
    readonly id: string;
    readonly title: string;
    readonly body: string;
    readonly tags: readonly string[];
    readonly citation?: string;
  }[];
  readonly loadout: readonly {
    readonly name: string;
    readonly category: 'shelter' | 'sleep' | 'pack' | 'clothing' | 'kitchen' | 'electronics' | 'safety' | 'consumable';
    readonly weightOz?: number;
    readonly carried: boolean;
    readonly note?: string;
  }[];
  readonly weather: {
    readonly mile: number;
    readonly summary: string;
    readonly highF: number;
    readonly lowF: number;
    readonly windMph: number;
    readonly riskNote?: string;
    readonly generatedAt: string;
  } | null;
  readonly downloadedRegions: readonly string[];
  readonly generatedAt: string;
}

function validUntil(generatedAt: Date): string {
  return new Date(generatedAt.getTime() + PACK_VALID_MS).toISOString();
}

function previewNote(latestFixIsPreview: boolean): string {
  return latestFixIsPreview
    ? 'Dad location is currently a preview/cache signal; do not treat it as a live safety fix.'
    : 'Dad location came from the public Garmin pilot summary; verify before safety-critical decisions.';
}

function buildContextPack(now: Date): MobileContextPack {
  const generatedAt = now.toISOString();

  return {
    frame: {
      totalMiles: TOTAL_AT_MILES,
      startMile: 0,
      endMile: TOTAL_AT_MILES,
      source: 'AWOL 2026 reference length + Hogg Country Dad pilot pack'
    },
    hiker: {
      trailName: 'Hogg',
      currentMile: PILOT_CURRENT_MILE,
      direction: 'NOBO',
      dayNumber: 42,
      targetMilesToday: 13.8
    },
    water: [
      {
        name: 'Lick Creek',
        mile: 586.6,
        reliability: 'reliable',
        note: 'Best fill before the exposed Chestnut Knob ridge.'
      },
      {
        name: 'Spring below Chestnut Knob',
        mile: 589.9,
        reliability: 'seasonal',
        note: 'Seasonal; use only as a bonus source after filling at Lick Creek.'
      }
    ],
    shelters: [
      {
        name: 'Chestnut Knob Shelter',
        mile: 589.7,
        capacity: 8,
        note: 'Enclosed structure, exposed to wind on the ridge.'
      },
      {
        name: 'Jenny Knob Shelter',
        mile: 605.7,
        capacity: 6,
        note: 'Backup shelter farther north; confirm crowding from recent hiker reports.'
      }
    ],
    towns: [
      {
        name: 'Bland, VA',
        mile: 596.0,
        access: 'US-52 crossing, short road access into town',
        servicesNote: 'Resupply and recovery stop; confirm current hours before depending on a specific service.'
      },
      {
        name: 'Pearisburg, VA',
        mile: 632.4,
        access: 'VA-634 crossing',
        servicesNote: 'Bigger resupply and recovery option beyond this pilot window.'
      }
    ],
    guideExcerpts: [
      {
        id: 'pack-water-on-ridges',
        title: 'Pack water before ridge sections',
        body: 'Ridge sections in southern Virginia frequently lose water sources. Top off at the last reliable source before climbing onto a long ridge.',
        tags: ['water', 'planning', 'ridge'],
        citation: 'Hogg Country Field Guide, Section: Water Discipline'
      },
      {
        id: 'town-stop-readiness',
        title: 'Town stops are recovery first, logistics second',
        body: 'Treat town as a recovery interval. Calories, foot care, sleep, then logistics. Logistics-first town stops cost mileage two days later.',
        tags: ['town', 'recovery'],
        citation: 'Hogg Country Field Guide, Section: Town Discipline'
      },
      {
        id: 'cold-wind-risk',
        title: 'Cold wind multiplies fatigue',
        body: 'Sustained crosswind above 15 mph at 30-40F drains energy faster than mileage suggests. Cap target miles, eat more often, and protect extremities.',
        tags: ['weather', 'safety', 'cold'],
        citation: 'Hogg Country Field Guide, Section: Cold Weather'
      }
    ],
    loadout: [
      { name: 'Durston X-Mid Pro 2', category: 'shelter', weightOz: 19.6, carried: true },
      { name: 'Enlightened Equipment Revelation 20F', category: 'sleep', weightOz: 22.1, carried: true },
      { name: 'Hyperlite Southwest 55', category: 'pack', weightOz: 31.5, carried: true },
      { name: 'Patagonia R1 Hoody', category: 'clothing', weightOz: 13.4, carried: true },
      { name: 'BRS 3000T stove', category: 'kitchen', weightOz: 0.9, carried: true },
      { name: 'InReach Mini 2', category: 'safety', weightOz: 3.5, carried: true },
      { name: 'Anker 10k power bank', category: 'electronics', weightOz: 6.9, carried: true }
    ],
    weather: {
      mile: PILOT_CURRENT_MILE,
      summary: 'Cached pilot weather: cold ridge wind with dry afternoon skies',
      highF: 46,
      lowF: 28,
      windMph: 17,
      riskNote: 'Weather in this pack is cached pilot context; refresh before exposed terrain.',
      generatedAt: PILOT_GENERATED_AT
    },
    downloadedRegions: ['Dad pilot - Southern VA', 'AT open reference summary'],
    generatedAt
  };
}

function sourceReceipts(now: Date): MobileSourceReceipt[] {
  return [
    {
      id: 'field-pack:dad-pilot',
      title: 'Dad pilot mobile field pack',
      kind: 'trail-pack',
      citation: 'Hogg Country public Scout mobile bootstrap',
      generatedAt: now.toISOString(),
      miles: { from: PILOT_CURRENT_MILE, to: 606.0 }
    },
    {
      id: 'field-guide:water-discipline',
      title: 'Water discipline field-guide excerpt',
      kind: 'field-guide',
      citation: 'Hogg Country Field Guide'
    },
    {
      id: 'derived:awol-length',
      title: 'AT reference length',
      kind: 'derived',
      citation: 'AWOL 2026 calibrated reference length',
      miles: { from: 0, to: TOTAL_AT_MILES }
    }
  ];
}

export async function buildPublicMobileFieldPack(now = new Date()) {
  const [dad, atReference] = await Promise.all([
    loadDadPilotSummary().catch(() => null),
    loadScoutAtOpenReferenceOfflineSummary(now).catch(() => null)
  ]);
  const contextPack = buildContextPack(now);
  const receipts = sourceReceipts(now);

  return {
    data: {
      context_pack: contextPack,
      dad,
      at_reference: atReference,
      pilot_notice: dad ? previewNote(dad.latestFixIsPreview) : 'Dad public pilot summary was not reachable; app is using the cached pilot pack.'
    },
    meta: {
      pack_version: 1,
      generated_at: now.toISOString(),
      valid_until: validUntil(now),
      source_receipts: receipts,
      fallback_reason: dad ? null : 'dad-pilot-unavailable',
      request_id: crypto.randomUUID()
    },
    error: null
  };
}
