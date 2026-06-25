export type ScoutSkillCategory = 'scripture' | 'trail-reference' | 'official-sources' | 'private-workspace' | 'custom';
export type ScoutSkillAccessLevel = 'public-bundled' | 'official-live' | 'workspace-private' | 'mixed';
export type ScoutSkillRetrievalStrategy = 'exact-reference' | 'corpus-search' | 'route-validator' | 'live-source-check' | 'workspace-search';

export interface ScoutSkill {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly category: ScoutSkillCategory;
  readonly enabledByDefault: boolean;
  readonly userToggleable: boolean;
  readonly accessLevel: ScoutSkillAccessLevel;
  readonly resourceIds: readonly string[];
  readonly corpusIds: readonly string[];
  readonly sourceManifestIds: readonly string[];
  readonly triggerKeywords: readonly string[];
  readonly triggerIntents: readonly string[];
  readonly retrievalStrategy: ScoutSkillRetrievalStrategy;
  readonly citationTemplate: string;
  readonly promptInstructions: readonly string[];
  readonly caveats: readonly string[];
  readonly safetyRules: readonly string[];
  readonly version: string;
  readonly updatedAt: string;
}

export interface ScoutSkillPreference {
  readonly skillId: string;
  readonly enabled: boolean;
  readonly updatedAt: string;
}

export interface ScoutSkillSettings {
  readonly version: 1;
  readonly updatedAt: string;
  readonly preferences: readonly ScoutSkillPreference[];
}

export interface ScoutSkillSearchHit {
  readonly skillId: string;
  readonly resourceId: string;
  readonly sourceId: string;
  readonly title: string;
  readonly excerpt: string;
  readonly citation: string;
  readonly confidence: number;
  readonly relevance: number;
}

export const BUILTIN_SCOUT_SKILLS: readonly ScoutSkill[] = [
  {
    id: 'water-source-skill',
    title: 'Water Source Skill',
    description: 'Use the current mile, loaded water layer, water-specific field-guide docs, user reports, and official/current checks before answering water questions.',
    category: 'trail-reference',
    enabledByDefault: true,
    userToggleable: true,
    accessLevel: 'mixed',
    resourceIds: ['mobile:context-pack.water', 'field-guide:water-discipline', 'workspace:water-notes'],
    corpusIds: ['hogg-country-field-guide', 'at-open-reference'],
    sourceManifestIds: ['hogg-country-corpus'],
    triggerKeywords: ['water', 'spring', 'stream', 'creek', 'flow', 'dry', 'filter', 'potable', 'hydrate', 'top off'],
    triggerIntents: ['next-water-check', 'water-reliability-check', 'water-carry-planning', 'water-treatment-advice'],
    retrievalStrategy: 'corpus-search',
    citationTemplate: 'Water source skill — {title}',
    promptInstructions: [
      'For water prompts, first compare the hiker current mile and direction to the loaded water layer.',
      'Then read the water source-skill/field-guide docs and any saved hiker water notes before answering.',
      'Keep mapped water low-confidence unless a current source, user report, or field confirmation supports it.',
      'Mention closer unconfirmed candidates separately from better-known or reliable sources.'
    ],
    caveats: ['Mapped water is not proof of current flow or potability; recent/current confirmation still matters.'],
    safetyRules: ['Disabled means Scout should not inject water-specific source-skill instructions or rely on water-specific bundled source docs.'],
    version: '2026-06-25',
    updatedAt: '2026-06-25'
  },
  {
    id: 'shelter-camping-skill',
    title: 'Shelter and Camping Skill',
    description: 'Use shelter/campsite candidates, camping-rule docs, land-manager rules, and recent private/current reports for where to sleep.',
    category: 'trail-reference',
    enabledByDefault: true,
    userToggleable: true,
    accessLevel: 'mixed',
    resourceIds: ['mobile:context-pack.shelters', 'field-guide:shelter-discipline', 'workspace:camping-notes'],
    corpusIds: ['hogg-country-field-guide', 'at-open-reference'],
    sourceManifestIds: ['hogg-country-corpus'],
    triggerKeywords: ['shelter', 'camp', 'camping', 'campsite', 'tent site', 'lean-to', 'hut', 'privy', 'where sleep', 'overnight'],
    triggerIntents: ['next-shelter-check', 'camping-legality-check', 'shelter-condition-check', 'overnight-plan'],
    retrievalStrategy: 'corpus-search',
    citationTemplate: 'Shelter and camping skill — {title}',
    promptInstructions: [
      'For shelter/camping prompts, compare current mile and direction to the loaded shelter/campsite layer.',
      'Read shelter/camping field-guide docs and applicable land-manager rule sources before recommending an overnight plan.',
      'Do not treat open-data shelter/campsite candidates as current, legal, available, uncrowded, or fee-free without confirmation.',
      'For regulated areas, fail closed: name the rule source that must be checked before committing.'
    ],
    caveats: ['Shelter status, crowding, water, fees, permits, and legal camping rules can change quickly.'],
    safetyRules: ['Disabled means Scout should not inject shelter/camping source-skill instructions or retrieve shelter-specific bundled docs.'],
    version: '2026-06-25',
    updatedAt: '2026-06-25'
  },
  {
    id: 'town-resupply-skill',
    title: 'Town and Resupply Skill',
    description: 'Use town/resupply candidates, saved plan docs, current web checks, and user-owned guide imports for services and town logistics.',
    category: 'trail-reference',
    enabledByDefault: true,
    userToggleable: true,
    accessLevel: 'mixed',
    resourceIds: ['mobile:context-pack.towns', 'workspace:documents/resupply-plan', 'workspace:resources/town-services'],
    corpusIds: ['hogg-country-field-guide', 'at-open-reference'],
    sourceManifestIds: ['hogg-country-corpus'],
    triggerKeywords: ['town', 'resupply', 'hostel', 'shuttle', 'outfitter', 'laundry', 'groceries', 'mail drop', 'motel', 'restaurant'],
    triggerIntents: ['next-town-check', 'resupply-plan', 'town-service-research', 'shuttle-hostel-logistics'],
    retrievalStrategy: 'corpus-search',
    citationTemplate: 'Town and resupply skill — {title}',
    promptInstructions: [
      'For town/resupply prompts, compare current mile and direction to loaded town candidates and the hiker current plan.',
      'Read town/resupply source-skill docs, saved resupply docs, and relevant private resources before answering.',
      'Use live public/web checks when enabled and available for same-day hours, shuttle, hostel, outfitter, reservation, or pricing claims.',
      'Separate recovery priorities from logistics: food, feet, sleep, laundry/charge/resupply, then departure plan.'
    ],
    caveats: ['Town services, hours, shuttles, lodging, and prices change; same-day logistics require current confirmation.'],
    safetyRules: ['Disabled means Scout should not inject town/resupply source-skill instructions or claim current town-service research.'],
    version: '2026-06-25',
    updatedAt: '2026-06-25'
  },
  {
    id: 'pack-loadout-skill',
    title: 'Pack and Loadout Skill',
    description: 'Use the hiker loadout, gear/body notes, weather, and terrain context to answer what is packed, missing, too heavy, or condition-critical.',
    category: 'private-workspace',
    enabledByDefault: true,
    userToggleable: true,
    accessLevel: 'workspace-private',
    resourceIds: ['mobile:context-pack.loadout', 'workspace:documents/gear-body-notes', 'workspace:loadout'],
    corpusIds: ['hogg-country-field-guide'],
    sourceManifestIds: ['hogg-country-corpus'],
    triggerKeywords: ['pack', 'loadout', 'gear', 'base weight', 'carry', 'packed', 'rain gear', 'first aid', 'food carry', 'stove', 'quilt', 'tent'],
    triggerIntents: ['loadout-check', 'pack-contents-check', 'gear-gap-check', 'condition-specific-gear-plan'],
    retrievalStrategy: 'workspace-search',
    citationTemplate: 'Pack/loadout skill — {title}',
    promptInstructions: [
      'For pack/loadout prompts, read the current loadout and Gear + Body Notes before giving gear advice.',
      'Compare carried items against weather, terrain, water carry, shelter choice, and town/resupply timing.',
      'If the pack contents are unknown or stale, say what Scout cannot see and ask for the specific missing item/category.',
      'Do not invent carried gear from a starter/demo pack when answering for the hiker.'
    ],
    caveats: ['Loadout can be stale after town stops, mail drops, swaps, or lost/broken gear.'],
    safetyRules: ['Disabled means Scout should not retrieve private loadout or saved gear/body docs through this skill.'],
    version: '2026-06-25',
    updatedAt: '2026-06-25'
  },
  {
    id: 'weather-risk-skill',
    title: 'Weather Risk Skill',
    description: 'Use cached weather, NWS/official checks, elevation/exposure, and safety docs for weather-sensitive trail decisions.',
    category: 'official-sources',
    enabledByDefault: true,
    userToggleable: true,
    accessLevel: 'official-live',
    resourceIds: ['mobile:context-pack.weather', 'field-guide:weather-risk'],
    corpusIds: ['hogg-country-field-guide'],
    sourceManifestIds: ['hogg-country-corpus'],
    triggerKeywords: ['weather', 'forecast', 'storm', 'rain', 'snow', 'ice', 'wind', 'heat', 'cold', 'lightning', 'exposure'],
    triggerIntents: ['weather-safety-check', 'exposure-risk-check', 'weather-mileage-adjustment'],
    retrievalStrategy: 'live-source-check',
    citationTemplate: 'Weather risk skill — {title}',
    promptInstructions: [
      'For weather prompts, use cached pack weather only with its timestamp and staleness caveat.',
      'Use NWS/official weather tools for current decisions when official-source tools are enabled and available.',
      'Combine weather with exposure, elevation, daylight, body condition, and bailout options.',
      'Never claim live weather certainty unless a weather source was fetched or supplied this turn.'
    ],
    caveats: ['Weather and exposure risk change fast; stale cached weather is a planning prompt, not a go/no-go authority.'],
    safetyRules: ['Disabled means Scout should not inject weather-risk instructions or claim weather-source checks.'],
    version: '2026-06-25',
    updatedAt: '2026-06-25'
  },
  {
    id: 'trail-safety-conditions-skill',
    title: 'Trail Safety and Conditions Skill',
    description: 'Use official alerts, trail condition packs, safety docs, and hiker notes for closures, hazards, injury, bailout, and emergency-adjacent decisions.',
    category: 'official-sources',
    enabledByDefault: true,
    userToggleable: true,
    accessLevel: 'mixed',
    resourceIds: ['mobile:context-pack.conditions', 'field-guide:safety-risk', 'workspace:documents/safety-risk-brief'],
    corpusIds: ['hogg-country-field-guide', 'at-open-reference'],
    sourceManifestIds: ['hogg-country-corpus'],
    triggerKeywords: ['safety', 'closure', 'detour', 'hazard', 'injury', 'hurt', 'blister', 'bear', 'fire', 'flood', 'ford', 'bailout', 'emergency'],
    triggerIntents: ['current-condition-check', 'hazard-check', 'bailout-plan', 'body-risk-check', 'emergency-adjacent-planning'],
    retrievalStrategy: 'live-source-check',
    citationTemplate: 'Trail safety and conditions skill — {title}',
    promptInstructions: [
      'For safety, closure, hazard, body-risk, or bailout prompts, read the safety/risk source-skill docs and current condition sources.',
      'Use official alerts/land-manager checks when official-source tools are enabled and the answer depends on closures, fires, floods, fords, legal access, or emergency risk.',
      'Keep emergency boundaries clear: Scout can help plan and communicate, but is not emergency dispatch.',
      'Escalate uncertainty by choosing the safer stop, lower mileage, or live verification path.'
    ],
    caveats: ['Active hazards and body-risk facts can change faster than cached packs; official/current checks matter.'],
    safetyRules: ['Disabled means Scout should not inject safety/conditions source-skill instructions or claim current alert checks.'],
    version: '2026-06-25',
    updatedAt: '2026-06-25'
  },
  {
    id: 'terrain-pace-skill',
    title: 'Terrain and Pace Skill',
    description: 'Use route, elevation, nearby landmarks, daylight, weather, and current plan docs for push/hold/nero/zero mileage decisions.',
    category: 'trail-reference',
    enabledByDefault: true,
    userToggleable: true,
    accessLevel: 'mixed',
    resourceIds: ['mobile:context-pack.landmarks', 'public/at-mileposts.json', 'workspace:documents/current-plan'],
    corpusIds: ['at-route-validator', 'at-open-reference', 'hogg-country-field-guide'],
    sourceManifestIds: ['hogg-country-corpus'],
    triggerKeywords: ['pace', 'push', 'hold', 'miles', 'terrain', 'climb', 'descent', 'elevation', 'nero', 'zero', 'next 20', 'daylight'],
    triggerIntents: ['terrain-window-check', 'pace-decision', 'push-hold-decision', 'nero-zero-planning'],
    retrievalStrategy: 'route-validator',
    citationTemplate: 'Terrain and pace skill — {title}',
    promptInstructions: [
      'For mileage decisions, compare current mile and direction to upcoming landmarks, terrain, weather, daylight, water, shelter, and town options.',
      'Read current plan and terrain/pace source-skill docs before recommending a push, hold, nero, or zero.',
      'Use route validators when the AT mile/route skill is enabled for route order and impossible-leg checks, but do not turn approximate route data into exact guidebook mile claims.',
      'Prefer body-preserving recommendations when water, shelter, daylight, weather, or pain context is uncertain.'
    ],
    caveats: ['Generated route/elevation/landmark data is a planning screen; exact miles and current conditions still need confirmation.'],
    safetyRules: ['Disabled means Scout should not inject terrain/pace source-skill instructions or use route validators for mileage decisions.'],
    version: '2026-06-25',
    updatedAt: '2026-06-25'
  },
  {
    id: 'kjv-pce-scripture',
    title: 'KJV PCE Scripture',
    description: 'Use the bundled King James Version Pure Cambridge Edition corpus for scripture quotation, reference lookup, and phrase search.',
    category: 'scripture',
    enabledByDefault: true,
    userToggleable: true,
    accessLevel: 'public-bundled',
    resourceIds: ['public/kjv-pce.md', 'public/kjv-pce.jsonl'],
    corpusIds: ['kjv-pce'],
    sourceManifestIds: ['kjv-pce'],
    triggerKeywords: ['scripture', 'bible', 'kjv', 'king james', 'pce', 'pure cambridge', 'verse', 'quote', 'proverbs', 'psalms'],
    triggerIntents: ['scripture-quote', 'scripture-reference-lookup', 'scripture-phrase-search', 'faith-informed-reflection'],
    retrievalStrategy: 'exact-reference',
    citationTemplate: 'KJV PCE — {reference}',
    promptInstructions: [
      'Use KJV PCE search hits for scripture quotation.',
      'Do not invent verse wording from model memory when lookup is available.',
      'If exact lookup fails, say so and offer nearby reference or phrase-search results.',
      'Use scripture gently and only when relevant or requested.'
    ],
    caveats: ['KJV PCE is a bundled static corpus; do not relabel other KJV text as PCE.'],
    safetyRules: ['Disabled means no KJV PCE instruction injection and no KJV PCE retrieval.'],
    version: '2026-05-06',
    updatedAt: '2026-05-06'
  },
  {
    id: 'at-mile-marker-reference',
    title: 'AT Mile Marker Reference',
    description: 'Use bundled Appalachian Trail route and mile data for approximate trail order, route corridor checks, and location reasoning.',
    category: 'trail-reference',
    enabledByDefault: true,
    userToggleable: true,
    accessLevel: 'public-bundled',
    resourceIds: ['public/at-mileposts.json', '@hoggcountry/trail-data'],
    corpusIds: ['at-route-validator', 'at-mileposts'],
    sourceManifestIds: [
      'hoggcountry-pine-grove-route-qa-2026-05-04',
      'hoggcountry-gsmnp-at-corridor-qa-2026-05-05',
      'hoggcountry-shenandoah-at-corridor-qa-2026-05-05',
      'hoggcountry-harpers-ferry-mental-halfway-qa-2026-05-06',
      'hoggcountry-100-mile-wilderness-qa-2026-05-06',
      'hoggcountry-baxter-katahdin-at-corridor-qa-2026-05-05',
      'hoggcountry-whites-franconia-crawford-qa-2026-05-06'
    ],
    triggerKeywords: ['at mile', 'mile marker', 'nobo', 'sobo', 'corridor', 'route order', 'itinerary', 'section hike', 'trail mile'],
    triggerIntents: ['route-order-check', 'corridor-validation', 'approximate-location', 'strict-route-planning'],
    retrievalStrategy: 'route-validator',
    citationTemplate: 'Hogg Country AT mile/route reference — {title}',
    promptInstructions: [
      'Use bundled AT route and mile references for route order, approximate location, and corridor checks.',
      'Keep exact mileage caveats when current guidebook/user-owned data is still needed.',
      'Do not treat approximate bundled mile data as current shelter, water, permit, or closure truth.'
    ],
    caveats: ['Exact/current guidebook data may still be required for final mileage, services, water, camping, and closures.'],
    safetyRules: ['Disabled means deterministic AT mile/route retrieval and strict route validators should not be used.'],
    version: '2026-05-06',
    updatedAt: '2026-05-06'
  },
  {
    id: 'official-trail-sources',
    title: 'Official Trail Sources',
    description: 'Use official ATC, NPS, NWS, land-manager, permit, weather, closure, and safety source lanes.',
    category: 'official-sources',
    enabledByDefault: true,
    userToggleable: true,
    accessLevel: 'official-live',
    resourceIds: [],
    corpusIds: [],
    sourceManifestIds: [
      'atc-trail-updates',
      'nws-weather',
      'land-manager-pages',
      'white-mountain-national-forest-amc-rules',
      'harpers-ferry-maryland-dnr-nps-atc',
      'hundred-mile-wilderness-matc-atc-logistics',
      'baxter-state-park-at-permits',
      'shenandoah-backcountry-permits',
      'gsmnp-backcountry-permits'
    ],
    triggerKeywords: ['official', 'closure', 'detour', 'permit', 'weather', 'forecast', 'alert', 'nps', 'nws', 'atc', 'water'],
    triggerIntents: ['current-condition-check', 'closure-check', 'weather-safety-check', 'permit-rule-check', 'legal-camping-check'],
    retrievalStrategy: 'live-source-check',
    citationTemplate: '{sourceTitle}, fetched {fetchedAt}: {url}',
    promptInstructions: [
      'Use official trail source lanes for closures, permits, weather, safety, legal camping, and current-condition checks.',
      'Do not claim live certainty unless a source was actually fetched or supplied.',
      'When official data is missing, name the exact source class that still needs checking.'
    ],
    caveats: ['Official conditions and rules change; source freshness matters.'],
    safetyRules: ['Disabled means official-source live checks should not be called or injected unless the user asks to re-enable the skill.'],
    version: '2026-05-06',
    updatedAt: '2026-05-06'
  },
  {
    id: 'web-research',
    title: 'Public Web Research',
    description: 'Use live public web search and fetched page excerpts for current general research when Scout’s private, bundled, or dedicated official tools do not cover the question.',
    category: 'custom',
    enabledByDefault: true,
    userToggleable: true,
    accessLevel: 'mixed',
    resourceIds: [],
    corpusIds: [],
    sourceManifestIds: ['web-research'],
    triggerKeywords: ['internet', 'web', 'search', 'research', 'latest', 'current', 'today', 'website', 'online', 'look up', 'product', 'hostel', 'shuttle'],
    triggerIntents: ['general-web-research', 'current-public-source-check', 'town-service-research', 'gear-product-research'],
    retrievalStrategy: 'live-source-check',
    citationTemplate: 'Public web research, fetched {fetchedAt}: {url}',
    promptInstructions: [
      'Use public web research only for public current facts that are not better handled by official trail/weather tools, private workspace search, bundled route data, or user-owned guide imports.',
      'Cite source title, URL, and fetched timestamp for web-derived claims.',
      'Prefer domain filters for source-sensitive questions.',
      'Do not use public web search for private, local, loopback, intranet, or user-secret URLs.'
    ],
    caveats: ['General web results may be stale, promotional, incomplete, or unofficial.'],
    safetyRules: [
      'Weather, active alerts, closures, permits, legal camping, and safety-sensitive trail conditions should use official trail/weather source tools when available.',
      'Disabled means Scout should not claim fresh general web research or cite newly fetched public web pages.'
    ],
    version: '2026-05-12',
    updatedAt: '2026-05-12'
  },
  {
    id: 'private-workspace-resources',
    title: 'Private Workspace Resources',
    description: 'Use this workspace’s uploaded files, saved documents, manual notes, tools, and private resource locker as private source context.',
    category: 'private-workspace',
    enabledByDefault: true,
    userToggleable: true,
    accessLevel: 'workspace-private',
    resourceIds: ['workspace:manual', 'workspace:documents', 'workspace:resources', 'workspace:tools'],
    corpusIds: [],
    sourceManifestIds: ['private-workspace', 'at-guide-user-owned', 'farout-current-comments'],
    triggerKeywords: ['my resource', 'uploaded', 'private', 'workspace', 'manual', 'document', 'guidebook', 'farout', 'awol'],
    triggerIntents: ['workspace-resource-search', 'private-document-grounding', 'user-imported-guide-use'],
    retrievalStrategy: 'workspace-search',
    citationTemplate: 'Private workspace resource — {title}',
    promptInstructions: [
      'Use only resources from the current workspace.',
      'Cite private resource titles when using private files, notes, docs, or tools.',
      'Never treat private user-imported docs as public trail facts.',
      'Keep private data out of public/shared trail-intel claims.'
    ],
    caveats: ['Private resources may be stale, incomplete, user-entered, or copyrighted/user-owned.'],
    safetyRules: ['Disabled means private workspace search lanes should not retrieve manual sections, private docs, resources, or tools.'],
    version: '2026-05-06',
    updatedAt: '2026-05-06'
  }
] as const;

export function getScoutSkill(skillId: string): ScoutSkill | null {
  return BUILTIN_SCOUT_SKILLS.find((skill) => skill.id === skillId) ?? null;
}

export function defaultScoutSkillPreferences(updatedAt = new Date().toISOString()): ScoutSkillPreference[] {
  return BUILTIN_SCOUT_SKILLS.map((skill) => ({
    skillId: skill.id,
    enabled: skill.enabledByDefault,
    updatedAt
  }));
}

export function defaultScoutSkillSettings(updatedAt = new Date().toISOString()): ScoutSkillSettings {
  return {
    version: 1,
    updatedAt,
    preferences: defaultScoutSkillPreferences(updatedAt)
  };
}

export function normalizeScoutSkillSettings(input: unknown, updatedAt = new Date().toISOString()): ScoutSkillSettings {
  if (!input || typeof input !== 'object') return defaultScoutSkillSettings(updatedAt);
  const raw = input as { readonly updatedAt?: unknown; readonly preferences?: unknown };
  const rawPreferences = Array.isArray(raw.preferences) ? raw.preferences : [];
  const preferences = defaultScoutSkillPreferences(updatedAt).map((defaultPreference) => {
    const saved = rawPreferences.find((item): item is Record<string, unknown> => (
      Boolean(item)
      && typeof item === 'object'
      && (item as Record<string, unknown>).skillId === defaultPreference.skillId
    ));
    return {
      skillId: defaultPreference.skillId,
      enabled: typeof saved?.enabled === 'boolean' ? saved.enabled : defaultPreference.enabled,
      updatedAt: typeof saved?.updatedAt === 'string' && saved.updatedAt ? saved.updatedAt : defaultPreference.updatedAt
    };
  });

  return {
    version: 1,
    updatedAt: typeof raw.updatedAt === 'string' && raw.updatedAt ? raw.updatedAt : updatedAt,
    preferences
  };
}

export function setScoutSkillEnabled(
  settings: ScoutSkillSettings,
  skillId: string,
  enabled: boolean,
  updatedAt = new Date().toISOString()
): ScoutSkillSettings {
  const skill = getScoutSkill(skillId);
  if (!skill) throw new Error(`Unknown Scout skill: ${skillId}`);
  if (!skill.userToggleable) throw new Error(`Scout skill is not user-toggleable: ${skillId}`);

  const normalized = normalizeScoutSkillSettings(settings, updatedAt);
  return {
    version: 1,
    updatedAt,
    preferences: normalized.preferences.map((preference) => (
      preference.skillId === skillId ? { ...preference, enabled, updatedAt } : preference
    ))
  };
}

export function scoutSkillEnabled(settings: ScoutSkillSettings, skillId: string): boolean {
  const normalized = normalizeScoutSkillSettings(settings);
  const skill = getScoutSkill(skillId);
  if (!skill) return false;
  return normalized.preferences.find((preference) => preference.skillId === skillId)?.enabled ?? skill.enabledByDefault;
}

export function enabledScoutSkills(settings: ScoutSkillSettings): ScoutSkill[] {
  return BUILTIN_SCOUT_SKILLS.filter((skill) => scoutSkillEnabled(settings, skill.id));
}

export function buildScoutSkillPromptContext(settings: ScoutSkillSettings): string {
  const skills = enabledScoutSkills(settings);
  if (skills.length === 0) {
    return 'Enabled Scout skills: none. Do not retrieve bundled/public/private skill resources unless the user enables a skill.';
  }

  const lines = [
    'Enabled Scout skills:',
    ...skills.flatMap((skill) => [
      `- ${skill.title} (${skill.id}; ${skill.retrievalStrategy}; ${skill.accessLevel})`,
      `  - Use for: ${skill.triggerIntents.join(', ')}`,
      `  - Triggers: ${skill.triggerKeywords.join(', ')}`,
      `  - Resources: ${skill.resourceIds.length ? skill.resourceIds.join(', ') : 'configured source manifests/tools'}`,
      `  - Citation: ${skill.citationTemplate}`,
      `  - Instructions: ${skill.promptInstructions.join(' ')}`,
      `  - Caveats: ${[...skill.caveats, ...skill.safetyRules].join(' ')}`
    ])
  ];
  return lines.join('\n');
}

export function skillOwnsSourceManifest(skill: ScoutSkill, sourceManifestId: string): boolean {
  return skill.sourceManifestIds.includes(sourceManifestId);
}

export function scoutSkillsOwningSourceManifest(sourceManifestId: string): ScoutSkill[] {
  return BUILTIN_SCOUT_SKILLS.filter((skill) => skillOwnsSourceManifest(skill, sourceManifestId));
}

export function disabledScoutSkillOwnsSourceManifest(settings: ScoutSkillSettings, sourceManifestId: string): boolean {
  const owners = scoutSkillsOwningSourceManifest(sourceManifestId);
  return owners.length > 0 && owners.every((skill) => !scoutSkillEnabled(settings, skill.id));
}

export function createScoutSkillSearchHit(input: {
  readonly skillId: string;
  readonly resourceId: string;
  readonly sourceId?: string;
  readonly title: string;
  readonly excerpt: string;
  readonly citation: string;
  readonly confidence?: number;
  readonly relevance?: number;
}): ScoutSkillSearchHit {
  if (!input.citation.trim()) throw new Error('Scout skill search hits require a citation.');
  return {
    skillId: input.skillId,
    resourceId: input.resourceId,
    sourceId: input.sourceId ?? input.resourceId,
    title: input.title,
    excerpt: input.excerpt,
    citation: input.citation,
    confidence: Math.max(0, Math.min(1, input.confidence ?? 0.75)),
    relevance: Math.max(0, Math.min(1, input.relevance ?? 0.75))
  };
}
