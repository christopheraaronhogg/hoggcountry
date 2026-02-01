/**
 * Character Store (v1) — unified WoW-style "Character" model for all Trail Tools.
 *
 * Goal:
 * - One canonical object in localStorage: `hcCharacter.v1`
 * - All tools read/write slices of this character
 * - Migrate legacy tool keys on first load
 */

export type CharacterVersion = 1;

export type TrailDirection = 'NOBO' | 'SOBO' | 'FLIP';

export type GearTransitionAction = 'pick up' | 'send home' | 'swap';

export type GearRecommendationMode = 'value' | 'weight' | 'durability';

export type CharacterEquipmentItem = {
  id: string;
  category: string;
  name: string;
  weightOz?: number; // canonical numeric weight
  weightRaw?: string; // preserve original string input (for lossless migration)
  costUsd?: number;
  costRaw?: string;
  url?: string;
  worn?: boolean;
  tier?: number;
  templateName?: string;
  templateWeightRaw?: string;
};

export type CharacterGearTransition = {
  id: string;
  mile: number;
  action: GearTransitionAction;
  item: string; // free text for now
  note?: string;
};

export type CharacterMailDrop = {
  enabled: boolean;
  contents: string;
  packed: boolean;
  notified: boolean;
  shipped: boolean;
  trackingNumber: string;
  received: boolean;
  shippingCost: string;
  pickupFee: string;
  holdTimeOverride: string;
  leadMilesOverride: string;
  addressOverride: string;
  zipOverride: string;
  hoursOverride: string;
  phoneOverride: string;
};

export type CharacterBudgetCategory = {
  id: string;
  name: string;
  icon: string;
  color: string;
};

export type CharacterBudgetExpense = {
  date: string; // YYYY-MM-DD
  amount: number;
  category: string;
  note: string;
};

export type CharacterDevice = {
  id: string;
  name: string;
  icon?: string; // UI-only
  dailyDrawMah: number;
  batteryCapacityMah: number;
  priority: number;
  essential: boolean;
  chargeFreq: string;
};

export type CharacterProgressionActivityDay = {
  toolsOpened: Record<string, number>;
  milesAdvanced: number;
  mileUpdates: number;
};

export type CharacterProgression = {
  enabled: boolean;
  xp: number;
  marks: number;
  unlocked: Record<string, boolean>; // perkId -> true
  claimed: Record<string, boolean>; // `${YYYY-MM-DD}:${missionId}` -> true
  activity: {
    days: Record<string, CharacterProgressionActivityDay>; // YYYY-MM-DD -> counters
    lastPrunedAt: string | null;
  };
};

export type CharacterV1 = {
  version: CharacterVersion;
  updatedAt: string | null;

  core: {
    displayName: string;
    nickname: string;
    telegramUsername: string;
    bio: string;

    // "constraints" is intentionally open-ended.
    constraints: {
      noHitchhiking: boolean;
      scriptureTranslation: 'KJV' | 'other';
      cleanLanguage: boolean;
    };
  };

  trail: {
    startDate: string; // YYYY-MM-DD
    currentMile: number;
    targetPace: number; // mi/day
    zeroDaysPerMonth: number;
    direction: TrailDirection;

    // UI prefs
    contextExpanded: boolean;
  };

  equipment: {
    // multi-item inventory (pack contents)
    inventory: {
      items: CharacterEquipmentItem[];
    };

    // single-choice "slot" selections (budget gear builder)
    slots: {
      overridesByCategory: Record<string, string>; // categoryId -> itemId
    };

    // recommendation tuning (pack builder + gear builder)
    recommendations: {
      pack: {
        enabled: boolean;
        budget: number;
        mode: GearRecommendationMode;
        season: string; // '3-season' etc
        shelterPref: string; // 'tent' | 'tarp' | 'hammock'
      };
      gearBudget: {
        totalBudget: number;
        mode: GearRecommendationMode;
        season: string;
        shelterPref: string;
      };
    };

    transitions: CharacterGearTransition[];

    // pack-weight assumptions
    packPrefs: {
      typicalWaterCarryLiters: number;
      foodWeightPerDayLb: number;
    };
  };

  consumables: {
    food: {
      caloriesPerDay: number;
      caloriesPerOz: number;
      daysBetweenResupply: number;
    };
    water: {
      waterCapacityL: number;
      litersPer10Mi: number;
      bufferPct: number;
      treatmentMethod: string; // placeholder for future
    };
    power: {
      powerBankCapacityMah: number;
      powerBankCurrentPct: number;
      daysSinceTown: number;
      powerSaveMode: boolean;
      devices: CharacterDevice[];
      deviceLevelsPct: Record<string, number>; // deviceId -> pct
      rechargeStrategy: string; // placeholder
    };
  };

  logistics: {
    resupply: {
      carryDays: number;
      mailDropOnly: boolean;
      requireGrocery: boolean;
      requireOutfitter: boolean;
    };

    mail: {
      hikerName: string;
      supportName: string;
      supportPhone: string;
      returnAddress: string;
      triggerLeadMiles: number;
      defaultHoldTimeDays: number;
      dropsById: Record<string, CharacterMailDrop>;
    };
  };

  finance: {
    categories: CharacterBudgetCategory[];
    monthlyBudgets: Record<string, Record<string, number>>; // YYYY-MM -> { categoryId: amount }
    expenses: CharacterBudgetExpense[];
  };

  training: {
    currentFitness: string;
    hikingExperience: string;
    weeklyHours: number;
    completedBenchmarks: Record<string, boolean>;
  };

  emergency: {
    contacts: Array<{ id: number; name: string; relationship: string; phone: string }>;
    personal: {
      bloodType: string;
      allergies: string;
      conditions: string;
      medications: string;
      insurance: string;
      doctorPhone: string;
    };
  };

  progression: CharacterProgression;
};

const STORAGE_KEY = 'hcCharacter.v1';

function nowIso(): string {
  return new Date().toISOString();
}

function lsGet(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function asNumber(value: unknown, fallback: number): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function parseMoneyToNumber(raw: unknown): number | undefined {
  const n = Number(String(raw ?? '').replace(/[^0-9.\-]/g, ''));
  return Number.isFinite(n) ? n : undefined;
}

function weightToOz(raw: unknown): number | undefined {
  // Current UI assumes ounces; tolerate strings.
  const n = Number(String(raw ?? '').replace(/[^0-9.\-]/g, ''));
  return Number.isFinite(n) ? n : undefined;
}

function defaultCharacter(): CharacterV1 {
  return {
    version: 1,
    updatedAt: null,
    core: {
      displayName: '',
      nickname: '',
      telegramUsername: '',
      bio: '',
      constraints: {
        noHitchhiking: true,
        scriptureTranslation: 'KJV',
        cleanLanguage: true,
      },
    },
    trail: {
      startDate: '2026-03-01',
      currentMile: 0,
      targetPace: 15,
      zeroDaysPerMonth: 4,
      direction: 'NOBO',
      contextExpanded: true,
    },
    equipment: {
      inventory: { items: [] },
      slots: { overridesByCategory: {} },
      recommendations: {
        pack: {
          enabled: false,
          budget: 1500,
          mode: 'value',
          season: '3-season',
          shelterPref: 'tent',
        },
        gearBudget: {
          totalBudget: 1500,
          mode: 'value',
          season: '3-season',
          shelterPref: 'tent',
        },
      },
      transitions: [],
      packPrefs: {
        typicalWaterCarryLiters: 2,
        foodWeightPerDayLb: 1.75,
      },
    },
    consumables: {
      food: {
        caloriesPerDay: 4200,
        caloriesPerOz: 120,
        daysBetweenResupply: 4,
      },
      water: {
        waterCapacityL: 3,
        litersPer10Mi: 1.2,
        bufferPct: 20,
        treatmentMethod: '',
      },
      power: {
        powerBankCapacityMah: 30000,
        powerBankCurrentPct: 100,
        daysSinceTown: 2,
        powerSaveMode: false,
        devices: [],
        deviceLevelsPct: {},
        rechargeStrategy: '',
      },
    },
    logistics: {
      resupply: {
        carryDays: 4,
        mailDropOnly: false,
        requireGrocery: false,
        requireOutfitter: false,
      },
      mail: {
        hikerName: '',
        supportName: '',
        supportPhone: '',
        returnAddress: '',
        triggerLeadMiles: 125,
        defaultHoldTimeDays: 30,
        dropsById: {},
      },
    },
    finance: {
      categories: [],
      monthlyBudgets: {},
      expenses: [],
    },
    training: {
      currentFitness: 'moderate',
      hikingExperience: 'some',
      weeklyHours: 10,
      completedBenchmarks: {},
    },
    emergency: {
      contacts: [{ id: 1, name: '', relationship: '', phone: '' }],
      personal: {
        bloodType: '',
        allergies: '',
        conditions: '',
        medications: '',
        insurance: '',
        doctorPhone: '',
      },
    },

    progression: {
      enabled: true,
      xp: 0,
      marks: 0,
      unlocked: {},
      claimed: {},
      activity: {
        days: {},
        lastPrunedAt: null,
      },
    },
  };
}

function safeJsonParse<T>(raw: string | null): T | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function mergeDefaults(base: CharacterV1, incoming: Partial<CharacterV1>): CharacterV1 {
  // Cheap deep-ish merge, tuned for our shape.
  return {
    ...base,
    ...incoming,
    core: { ...base.core, ...(incoming.core || {}), constraints: { ...base.core.constraints, ...(incoming.core?.constraints || {}) } },
    trail: { ...base.trail, ...(incoming.trail || {}) },
    equipment: {
      ...base.equipment,
      ...(incoming.equipment || {}),
      inventory: { ...base.equipment.inventory, ...(incoming.equipment?.inventory || {}) },
      slots: { ...base.equipment.slots, ...(incoming.equipment?.slots || {}) },
      recommendations: {
        ...base.equipment.recommendations,
        ...(incoming.equipment?.recommendations || {}),
        pack: { ...base.equipment.recommendations.pack, ...(incoming.equipment?.recommendations?.pack || {}) },
        gearBudget: { ...base.equipment.recommendations.gearBudget, ...(incoming.equipment?.recommendations?.gearBudget || {}) },
      },
      packPrefs: { ...base.equipment.packPrefs, ...(incoming.equipment?.packPrefs || {}) },
      transitions: (incoming.equipment?.transitions as any) ?? base.equipment.transitions,
    },
    consumables: {
      ...base.consumables,
      ...(incoming.consumables || {}),
      food: { ...base.consumables.food, ...(incoming.consumables?.food || {}) },
      water: { ...base.consumables.water, ...(incoming.consumables?.water || {}) },
      power: { ...base.consumables.power, ...(incoming.consumables?.power || {}) },
    },
    logistics: {
      ...base.logistics,
      ...(incoming.logistics || {}),
      resupply: { ...base.logistics.resupply, ...(incoming.logistics?.resupply || {}) },
      mail: { ...base.logistics.mail, ...(incoming.logistics?.mail || {}) },
    },
    finance: {
      ...base.finance,
      ...(incoming.finance || {}),
      categories: (incoming.finance?.categories as any) ?? base.finance.categories,
      monthlyBudgets: (incoming.finance?.monthlyBudgets as any) ?? base.finance.monthlyBudgets,
      expenses: (incoming.finance?.expenses as any) ?? base.finance.expenses,
    },
    training: {
      ...base.training,
      ...(incoming.training || {}),
      completedBenchmarks: { ...base.training.completedBenchmarks, ...(incoming.training?.completedBenchmarks || {}) },
    },
    emergency: {
      ...base.emergency,
      ...(incoming.emergency || {}),
      contacts: (incoming.emergency?.contacts as any) ?? base.emergency.contacts,
      personal: { ...base.emergency.personal, ...(incoming.emergency?.personal || {}) },
    },

    progression: {
      ...base.progression,
      ...(incoming.progression || {}),
      unlocked: { ...base.progression.unlocked, ...(incoming.progression?.unlocked || {}) },
      claimed: { ...base.progression.claimed, ...(incoming.progression?.claimed || {}) },
      activity: {
        ...base.progression.activity,
        ...(incoming.progression?.activity || {}),
        days: (incoming.progression?.activity?.days as any) ?? base.progression.activity.days,
      },
    },
  };
}

function migrateFromLegacy(): Partial<CharacterV1> {
  if (typeof window === 'undefined') return {};

  // Use `any` internally to keep migration logic simple and resilient.
  const patch: any = {};

  // --- Trail context ---
  const legacyTrail = safeJsonParse<any>(lsGet('trailContext'));
  if (legacyTrail) {
    patch.trail = {
      startDate: legacyTrail.startDate || legacyTrail.tripStartDate,
      currentMile: asNumber(legacyTrail.currentMile, 0),
      targetPace: asNumber(legacyTrail.targetPace ?? legacyTrail.pace, 15),
      zeroDaysPerMonth: asNumber(legacyTrail.zeroDaysPerMonth, 4),
      contextExpanded: typeof legacyTrail.contextExpanded === 'boolean' ? legacyTrail.contextExpanded : true,
      // direction isn't in legacy trail context
      direction: 'NOBO',
    };
  }

  // --- Pack Builder ---
  const legacyPack = safeJsonParse<any>(lsGet('at-pack-builder-custom'));
  if (legacyPack) {
    const items = Array.isArray(legacyPack.items) ? legacyPack.items : [];
    patch.equipment = patch.equipment || {};
    patch.equipment.inventory = {
      items: items.map((it: any) => ({
        id: String(it.id || ''),
        category: String(it.category || 'pack'),
        name: String(it.name || ''),
        weightOz: weightToOz(it.weight),
        weightRaw: typeof it.weight === 'string' ? it.weight : undefined,
        costUsd: parseMoneyToNumber(it.cost),
        costRaw: typeof it.cost === 'string' ? it.cost : undefined,
        url: it.url ? String(it.url) : undefined,
        worn: !!it.worn,
        tier: typeof it.tier === 'number' ? it.tier : undefined,
        templateName: it.templateName ? String(it.templateName) : undefined,
        templateWeightRaw: it.templateWeight ? String(it.templateWeight) : undefined,
      })),
    };

    patch.equipment.packPrefs = {
      typicalWaterCarryLiters: asNumber(legacyPack.waterLiters, 2),
      foodWeightPerDayLb: asNumber(legacyPack.foodWeightPerDay, 1.75),
    };

    patch.equipment.recommendations = patch.equipment.recommendations || {};
    patch.equipment.recommendations.pack = {
      enabled: !!legacyPack.showRecommendations,
      budget: asNumber(legacyPack.recs?.budget, 1500),
      mode: (legacyPack.recs?.mode as GearRecommendationMode) || 'value',
      season: String(legacyPack.recs?.season || '3-season'),
      shelterPref: String(legacyPack.recs?.shelterPref || 'tent'),
    };

    // Use pack builder foodDays as a starting point for resupply carry days if present.
    if (typeof legacyPack.foodDays === 'number') {
      patch.logistics = patch.logistics || {};
      patch.logistics.resupply = patch.logistics.resupply || {};
      patch.logistics.resupply.carryDays = asNumber(legacyPack.foodDays, 4);
    }
  }

  // --- Gear Budget Builder ---
  const legacyGearBudget = safeJsonParse<any>(lsGet('at-gear-budget'));
  if (legacyGearBudget) {
    patch.equipment = patch.equipment || {};
    patch.equipment.recommendations = patch.equipment.recommendations || {};
    patch.equipment.recommendations.gearBudget = {
      totalBudget: asNumber(legacyGearBudget.budget, 1500),
      mode: (legacyGearBudget.mode as GearRecommendationMode) || 'value',
      season: String(legacyGearBudget.season || '3-season'),
      shelterPref: String(legacyGearBudget.shelterPref || 'tent'),
    };
    patch.equipment.slots = {
      overridesByCategory: legacyGearBudget.userOverrides && typeof legacyGearBudget.userOverrides === 'object'
        ? legacyGearBudget.userOverrides
        : {},
    };
  }

  // --- Gear transitions ---
  const legacyTransitions = safeJsonParse<any>(lsGet('at-gear-transitions-v1'));
  if (Array.isArray(legacyTransitions)) {
    patch.equipment = patch.equipment || {};
    patch.equipment.transitions = legacyTransitions.map((t: any) => ({
      id: String(t.id || String(Date.now())),
      mile: asNumber(t.mile, 0),
      action: (t.action as GearTransitionAction) || 'swap',
      item: String(t.item || ''),
      note: t.note ? String(t.note) : undefined,
    }));
  }

  // --- Food ---
  const legacyFood = safeJsonParse<any>(lsGet('at-food-v1'));
  if (legacyFood) {
    patch.consumables = patch.consumables || {};
    patch.consumables.food = {
      caloriesPerDay: asNumber(legacyFood.caloriesPerDay, 4200),
      caloriesPerOz: asNumber(legacyFood.caloriesPerOz, 120),
      daysBetweenResupply: asNumber(legacyFood.daysBetweenResupply, 4),
    };
  }

  // --- Water ---
  const legacyWater = safeJsonParse<any>(lsGet('at-water-carry-v1'));
  if (legacyWater) {
    patch.consumables = patch.consumables || {};
    patch.consumables.water = {
      waterCapacityL: asNumber(legacyWater.waterCapacityL, 3),
      litersPer10Mi: asNumber(legacyWater.litersPer10Mi, 1.2),
      bufferPct: asNumber(legacyWater.bufferPct, 20),
      treatmentMethod: '',
    };
  }

  // --- Power ---
  const legacyPower = safeJsonParse<any>(lsGet('powerManager'));
  if (legacyPower) {
    patch.consumables = patch.consumables || {};
    patch.consumables.power = {
      powerBankCapacityMah: asNumber(legacyPower.powerBankCapacity, 30000),
      powerBankCurrentPct: asNumber(legacyPower.powerBankCurrent, 100),
      daysSinceTown: asNumber(legacyPower.daysSinceTown, 2),
      powerSaveMode: !!legacyPower.powerSaveMode,
      devices: Array.isArray(legacyPower.devices)
        ? legacyPower.devices.map((d: any) => ({
            id: String(d.id || ''),
            name: String(d.name || ''),
            icon: d.icon ? String(d.icon) : undefined,
            dailyDrawMah: asNumber(d.dailyDraw, 0),
            batteryCapacityMah: asNumber(d.capacity, 0),
            priority: asNumber(d.priority, 999),
            essential: !!d.essential,
            chargeFreq: String(d.chargeFreq || ''),
          }))
        : [],
      deviceLevelsPct: legacyPower.deviceLevels && typeof legacyPower.deviceLevels === 'object'
        ? legacyPower.deviceLevels
        : {},
      rechargeStrategy: '',
    };
  }

  // --- Resupply prefs ---
  const legacyResupply = safeJsonParse<any>(lsGet('at-resupply-v1'));
  if (legacyResupply) {
    patch.logistics = patch.logistics || {};
    patch.logistics.resupply = {
      carryDays: asNumber(legacyResupply.carryDays, 4),
      mailDropOnly: !!legacyResupply.mailDropOnly,
      requireGrocery: !!legacyResupply.requireGrocery,
      requireOutfitter: !!legacyResupply.requireOutfitter,
    };
  }

  // --- Mail drops ---
  const legacyMail = safeJsonParse<any>(lsGet('mailDropPlannerV3'));
  if (legacyMail) {
    patch.logistics = patch.logistics || {};
    patch.logistics.mail = {
      hikerName: String(legacyMail.hikerName || ''),
      supportName: String(legacyMail.supportName || ''),
      supportPhone: String(legacyMail.supportPhone || ''),
      returnAddress: String(legacyMail.returnAddress || ''),
      triggerLeadMiles: asNumber(legacyMail.triggerLeadMiles, 125),
      defaultHoldTimeDays: asNumber(legacyMail.defaultHoldTimeDays, 30),
      dropsById: (legacyMail.drops && typeof legacyMail.drops === 'object') ? legacyMail.drops : {},
    };
  }

  // --- Budget ---
  const legacyBudget = safeJsonParse<any>(lsGet('at-budget-v3'));
  if (legacyBudget) {
    patch.finance = {
      categories: Array.isArray(legacyBudget.uCategories) ? legacyBudget.uCategories : [],
      monthlyBudgets: legacyBudget.monthlyBudgets && typeof legacyBudget.monthlyBudgets === 'object' ? legacyBudget.monthlyBudgets : {},
      expenses: Array.isArray(legacyBudget.expenses) ? legacyBudget.expenses : [],
    };
  }

  // --- Training ---
  const legacyTraining = safeJsonParse<any>(lsGet('at-training-planner'));
  const legacyBench = safeJsonParse<any>(lsGet('at-training-benchmarks'));
  if (legacyTraining || legacyBench) {
    patch.training = {
      currentFitness: String(legacyTraining?.currentFitness || 'moderate'),
      hikingExperience: String(legacyTraining?.hikingExperience || 'some'),
      weeklyHours: asNumber(legacyTraining?.weeklyHours, 10),
      completedBenchmarks: legacyBench && typeof legacyBench === 'object' ? legacyBench : {},
    };
  }

  // --- Emergency ---
  const legacyEmergency = safeJsonParse<any>(lsGet('at-emergency-info'));
  if (legacyEmergency) {
    patch.emergency = {
      contacts: Array.isArray(legacyEmergency.contacts) && legacyEmergency.contacts.length > 0
        ? legacyEmergency.contacts
        : [{ id: 1, name: '', relationship: '', phone: '' }],
      personal: legacyEmergency.personal && typeof legacyEmergency.personal === 'object'
        ? legacyEmergency.personal
        : undefined,
    } as any;
  }

  return patch as Partial<CharacterV1>;
}

// ====== STATE ======
let _character = $state<CharacterV1>(defaultCharacter());
let _loaded = $state(false);

export const character = {
  get loaded() { return _loaded; },
  get data() { return _character; },

  // convenience getters
  get core() { return _character.core; },
  get trail() { return _character.trail; },
  get equipment() { return _character.equipment; },
  get consumables() { return _character.consumables; },
  get logistics() { return _character.logistics; },
  get finance() { return _character.finance; },
  get training() { return _character.training; },
  get emergency() { return _character.emergency; },
  get progression() { return _character.progression; },
};

export function getCharacterSnapshot(): CharacterV1 {
  // Convert the reactive proxy into a plain JSON object.
  return JSON.parse(JSON.stringify(_character)) as CharacterV1;
}

export function loadCharacter(): void {
  if (typeof window === 'undefined') return;
  if (_loaded) return;

  const base = defaultCharacter();

  const stored = safeJsonParse<Partial<CharacterV1>>(lsGet(STORAGE_KEY));
  if (stored && stored.version === 1) {
    _character = mergeDefaults(base, stored);
    _loaded = true;
    return;
  }

  // Migrate
  const migrated = migrateFromLegacy();
  _character = mergeDefaults(base, migrated);
  _character.updatedAt = nowIso();

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(_character));
  } catch {}

  _loaded = true;
}

export function updateCharacter(patch: Partial<CharacterV1>): void {
  // Ensure loaded so we don't clobber migrations.
  loadCharacter();

  const merged = mergeDefaults(_character, patch as any);
  merged.updatedAt = nowIso();
  _character = merged;

  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(_character));
  } catch {}
}
