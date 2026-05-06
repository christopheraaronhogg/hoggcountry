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

export function disabledScoutSkillOwnsSourceManifest(settings: ScoutSkillSettings, sourceManifestId: string): boolean {
  return BUILTIN_SCOUT_SKILLS.some((skill) => (
    !scoutSkillEnabled(settings, skill.id) && skillOwnsSourceManifest(skill, sourceManifestId)
  ));
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
