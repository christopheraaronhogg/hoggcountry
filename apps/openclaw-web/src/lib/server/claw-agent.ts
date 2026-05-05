import { Agent, type AgentTool } from '@mariozechner/pi-agent-core';
import {
  searchImportedDocuments,
  searchManualSections,
  searchWorkspaceResources,
  searchWorkspaceTools,
  type ImportedDocument,
  type SearchHit,
  type WorkspaceResource
} from '@hoggcountry/manual-core';
import { publicCorpus, searchPublicCorpus } from '@hoggcountry/corpus';
import {
  buildAtRouteGrounding,
  formatAtRouteMileage,
  validateAtRouteAnswerClaims,
  type AtRouteClaimIssue,
  type AtRouteGrounding,
  type AtRoutePlanOption,
  type AtRoutePoint
} from '@hoggcountry/trail-data';
import { getModel, Type, type AssistantMessage, type Message, type Model, type ToolResultMessage, type UserMessage } from '@mariozechner/pi-ai';
import type { BetaProfileCookie } from '$lib/beta';
import { resolveOpenAICodexApiKey, type OpenAICodexCredentials } from '$lib/server/claw-openai-codex';
import { decryptProviderJson, encryptProviderJson } from '$lib/server/provider-crypto';
import { loadDadPilotSummary, type DadPilotSummary, type DadTrailUpdateSummary } from '$lib/server/dad';
import {
  approximateAtStateForMile,
  checkOfficialTrailSources,
  renderOfficialTrailSourceResult,
  type OfficialTrailSourceCheckDetails
} from '$lib/server/scout-official-sources';
import {
  appendWorkspaceFactCandidates,
  getWorkspaceRecord,
  replaceWorkspaceClawMessages,
  reviseWorkspaceScoutDocument,
  saveWorkspaceOpenAICodexConnection,
  type WorkspaceClawMessage,
  type WorkspaceFactCandidateInput,
  type WorkspaceRecord,
  type WorkspaceSnapshot
} from '$lib/server/workspace-store';

const OPENAI_CODEX_PROVIDER_ID = 'openai-codex';
const OPENCODE_GO_PROVIDER_ID = 'opencode-go';
const OPENAI_CODEX_MODEL = 'gpt-5.4';
const DEFAULT_OPENCODE_GO_MODEL = 'deepseek-v4-pro';
const OPENCODE_GO_REPLY_MAX_TOKENS = 900;
const SCOUT_AGENT_TURN_TIMEOUT_MS = 55_000;
const SCOUT_PRELOADED_SOURCE_MAX_CHARS = 2600;
const SCOUT_PRELOADED_OFFICIAL_MAX_CHARS = 2400;

type ClawProviderId = typeof OPENAI_CODEX_PROVIDER_ID | typeof OPENCODE_GO_PROVIDER_ID;

export interface WorkspaceClawConnectionPayload {
  readonly providerId: ClawProviderId;
  readonly label: string;
  readonly status: 'connected';
  readonly accountId: string | null;
  readonly expiresAt: string | null;
  readonly model: string;
}

interface ClawRuntime {
  readonly providerId: ClawProviderId;
  readonly modelId: string;
  readonly model: Model<any>;
  readonly apiKey: string;
  readonly credentials: OpenAICodexCredentials | null;
}

export class ScoutAgentTimeoutError extends Error {
  constructor() {
    super('Scout took too long to finish that reply. Try a narrower question, or ask Scout to use today’s brief first.');
    this.name = 'ScoutAgentTimeoutError';
  }
}

async function withScoutAgentTimeout<T>(promise: Promise<T>, remainingMs: number): Promise<T> {
  if (remainingMs <= 0) {
    throw new ScoutAgentTimeoutError();
  }

  let timeout: ReturnType<typeof setTimeout> | undefined;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeout = setTimeout(() => reject(new ScoutAgentTimeoutError()), remainingMs);
  });

  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    if (timeout) {
      clearTimeout(timeout);
    }
  }
}

const CLAW_MODEL = OPENAI_CODEX_MODEL;
const ZERO_USAGE = {
  input: 0,
  output: 0,
  cacheRead: 0,
  cacheWrite: 0,
  totalTokens: 0,
  cost: {
    input: 0,
    output: 0,
    cacheRead: 0,
    cacheWrite: 0,
    total: 0
  }
} as const;

type ScoutSourceTrust = 'private' | 'reviewed' | 'official' | 'crowd' | 'direct' | 'pilot';
type ScoutSourceAccess = 'searchable-now' | 'user-import' | 'external-check' | 'future-integration';

interface ScoutSourceCatalogEntry {
  readonly id: string;
  readonly label: string;
  readonly category: string;
  readonly trust: ScoutSourceTrust;
  readonly access: ScoutSourceAccess;
  readonly privacy: string;
  readonly useWhen: string;
  readonly caveat: string;
  readonly keywords: readonly string[];
}

interface ScoutContextHit extends SearchHit {
  readonly trust: ScoutSourceTrust;
  readonly access: ScoutSourceAccess;
}

interface ScoutSourceSearchDetails {
  readonly queries: string[];
  readonly hits: ScoutContextHit[];
  readonly recommendations: ScoutSourceCatalogEntry[];
}

const SCOUT_SOURCE_SEARCH_PARAMETERS = Type.Object({
  query: Type.String({
    minLength: 2,
    description: 'The trail question, location, or topic Scout should search sources for.'
  }),
  limit: Type.Optional(Type.Number({ minimum: 1, maximum: 10, description: 'Maximum searchable hits to return.' }))
});

const OFFICIAL_TRAIL_SOURCE_PARAMETERS = Type.Object({
  query: Type.String({
    minLength: 2,
    description: 'The trail condition, closure, detour, weather, or town-adjacent question to verify with official sources.'
  }),
  source: Type.Optional(Type.Union([Type.Literal('auto'), Type.Literal('atc'), Type.Literal('nws')], {
    description: 'Official source lane to check. auto checks ATC and checks NWS when weather terms plus coordinates are present.'
  })),
  state: Type.Optional(Type.String({
    maxLength: 32,
    description: 'Optional Appalachian Trail state abbreviation such as VA, TN, NC, or GA for filtering ATC trail updates.'
  })),
  latitude: Type.Optional(Type.Number({ minimum: -90, maximum: 90, description: 'Latitude for NWS point forecast/alerts.' })),
  longitude: Type.Optional(Type.Number({ minimum: -180, maximum: 180, description: 'Longitude for NWS point forecast/alerts.' })),
  useDadLocation: Type.Optional(Type.Boolean({
    description: 'Use the latest public Dad Garmin fix for NWS when the question is about Dad/current pilot context.'
  }))
});

const SCOUT_SOURCE_CATALOG: readonly ScoutSourceCatalogEntry[] = [
  {
    id: 'private-workspace',
    label: 'Private workspace: profile, manual notes, saved Scout docs, imported docs, tools',
    category: 'private workspace',
    trust: 'private',
    access: 'searchable-now',
    privacy: 'Private to the hiker by default.',
    useWhen: 'Personal constraints, current plan, gear/loadout, health notes, budget, pace, town style, living plans, and anything the hiker has imported or saved.',
    caveat: 'Treat as authoritative for the hiker, but still ask when details are stale or missing.',
    keywords: ['profile', 'manual', 'notes', 'gear', 'loadout', 'health', 'budget', 'pace', 'plan', 'docs', 'checklist', 'private']
  },
  {
    id: 'hogg-country-corpus',
    label: 'Hogg Country field guide and reviewed public corpus',
    category: 'reviewed guide corpus',
    trust: 'reviewed',
    access: 'searchable-now',
    privacy: 'Shared public/reviewed Hogg Country material.',
    useWhen: 'General AT operating guidance: gear, shelter-vs-tent, routines, resupply norms, zero days, trail culture, and known guide addenda.',
    caveat: 'Good baseline guidance, not a replacement for live closures, weather, or user-owned guidebook details.',
    keywords: ['guide', 'field guide', 'gear', 'shelter', 'tent', 'routine', 'resupply', 'zero', 'water', 'detour', 'helene']
  },
  {
    id: 'dad-public-pilot',
    label: 'Dad public pilot signals: Trail Updates, Garmin fix, YouTube dispatches',
    category: 'public hiker signals',
    trust: 'pilot',
    access: 'searchable-now',
    privacy: 'Only public Dad pilot context; do not infer private certainty.',
    useWhen: 'Testing Scout on a real hike, current public location/update context, and trail-story-to-planning loops.',
    caveat: 'Garmin can lag or be preview/fallback. Trail Updates are usually the freshest narrative signal.',
    keywords: ['dad', 'garmin', 'public pilot', 'trail update', 'youtube', 'dispatch', 'story']
  },
  {
    id: 'at-guide-user-owned',
    label: 'A.T. Guide / AWOL data imported by the hiker',
    category: 'licensed/user-owned guide data',
    trust: 'reviewed',
    access: 'user-import',
    privacy: 'Private if the hiker imports their legally owned copy.',
    useWhen: 'Mile-by-mile planning, elevation, shelters, campsites, trail towns, road crossings, and resupply structure.',
    caveat: 'Do not scrape or bundle copyrighted guide content; ask the hiker to import/search what they own.',
    keywords: ['awol', 'a.t. guide', 'guidebook', 'mileage', 'elevation', 'shelter', 'campsite', 'town', 'road crossing']
  },
  {
    id: 'farout-current-comments',
    label: 'FarOut recent comments/screenshots supplied by the hiker',
    category: 'current crowd intel',
    trust: 'crowd',
    access: 'user-import',
    privacy: 'Private if entered/imported by the hiker.',
    useWhen: 'Recent water reliability, shelter conditions, blowdowns, reroutes, campsite crowding, and trail-surface reports.',
    caveat: 'Crowd reports can be stale or wrong; prefer recent dated comments and cross-check risky claims.',
    keywords: ['farout', 'comment', 'water', 'source', 'dry', 'closure', 'reroute', 'blowdown', 'shelter', 'condition']
  },
  {
    id: 'atc-trail-updates',
    label: 'Appalachian Trail Conservancy official trail updates',
    category: 'official closures and detours',
    trust: 'official',
    access: 'external-check',
    privacy: 'Public official source.',
    useWhen: 'Closures, official detours, ferry/bridge status, fire restrictions, and land-manager notices.',
    caveat: 'Scout cannot claim a live check unless this source is fetched or imported for the turn.',
    keywords: ['atc', 'closure', 'detour', 'bridge', 'ferry', 'restriction', 'reroute', 'official', 'helene']
  },
  {
    id: 'nws-weather',
    label: 'National Weather Service point forecast, alerts, and forecast discussions',
    category: 'official weather',
    trust: 'official',
    access: 'external-check',
    privacy: 'Public official source.',
    useWhen: 'Weather decisions: thunderstorms, cold exposure, heat risk, wind, flood risk, snow/ice, and exposed-ridge timing.',
    caveat: 'Use exact location/elevation when possible; do not substitute broad town weather for ridge conditions without saying so.',
    keywords: ['weather', 'storm', 'rain', 'snow', 'ice', 'wind', 'heat', 'cold', 'flood', 'forecast', 'alert', 'nws', 'noaa']
  },
  {
    id: 'land-manager-pages',
    label: 'Official land-manager pages: NPS, USFS, state parks, AMC where applicable',
    category: 'official land management',
    trust: 'official',
    access: 'external-check',
    privacy: 'Public official source.',
    useWhen: 'Park-specific closures, permits, camping rules, fire restrictions, shelter/campsite rules, and road/trailhead access.',
    caveat: 'Jurisdiction changes along the AT; identify the responsible manager before treating a rule as universal.',
    keywords: ['permit', 'camping', 'park', 'forest', 'nps', 'usfs', 'state park', 'fire', 'road', 'trailhead', 'closure']
  },
  {
    id: 'hostel-shuttle-direct',
    label: 'Direct hostel, outfitter, shuttle, and town-service pages or phone-confirmed notes',
    category: 'direct town services',
    trust: 'direct',
    access: 'external-check',
    privacy: 'Public or hiker-entered private notes depending on source.',
    useWhen: 'Availability, hours, laundry/showers, shuttle logistics, resupply timing, mail drops, and reservation-sensitive plans.',
    caveat: 'Availability changes fast. For same-day or next-day logistics, recommend direct confirmation.',
    keywords: ['hostel', 'shuttle', 'outfitter', 'laundry', 'resupply', 'reservation', 'mail drop', 'town', 'hours']
  },
  {
    id: 'hiker-owned-social-profile',
    label: 'Hiker-owned profile, journal, trail updates, location history, gear/loadout, and shared guides',
    category: 'private-first hiker hub',
    trust: 'private',
    access: 'future-integration',
    privacy: 'Default private; the hiker chooses per artifact whether family/friends/link/public sharing is allowed.',
    useWhen: 'Longitudinal Scout memory, family-facing updates, personal journal grounding, gear evolution, location-aware planning, and opt-in shared learning.',
    caveat: 'Keep “use this to help me” separate from “share this publicly” and “promote into shared trail intel.”',
    keywords: ['profile', 'journal', 'family', 'friends', 'location', 'gear', 'loadout', 'share', 'social', 'updates']
  }
];

const QUERY_STOPWORDS = new Set([
  'about', 'after', 'again', 'ahead', 'could', 'current', 'doing', 'from', 'have', 'help', 'into', 'like', 'make', 'need', 'next',
  'plan', 'please', 'scout', 'should', 'that', 'their', 'there', 'this', 'trail', 'what', 'when', 'where', 'with', 'would', 'your'
]);

function uniqueStrings(values: readonly string[]): string[] {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))];
}

function promptTerms(input: string): string[] {
  return uniqueStrings(
    input
      .toLowerCase()
      .replace(/[^a-z0-9.\s-]/gu, ' ')
      .split(/\s+/u)
      .filter((term) => term.length >= 3 && !QUERY_STOPWORDS.has(term))
  );
}

function containsAny(input: string, needles: readonly string[]): boolean {
  return needles.some((needle) => input.includes(needle));
}

function promptAsksForDadPilotContext(prompt: string): boolean {
  const lowered = prompt.toLowerCase();
  const dadPattern = String.raw`(?:dad|garmin|public[- ]pilot|trail update|trail-update|dispatch|youtube)`;
  const negatedDadPattern = new RegExp(String.raw`\b(?:do not|don't|dont|avoid|exclude|without|no|not)\b[\s\S]{0,80}\b${dadPattern}\b`, 'iu');
  if (negatedDadPattern.test(lowered)) return false;
  return new RegExp(String.raw`\b${dadPattern}\b`, 'iu').test(lowered);
}

function recordLooksLikeDadPilot(record: WorkspaceRecord): boolean {
  return [record.betaProfile.name, record.betaProfile.trailName, record.betaProfile.email]
    .some((value) => /\bdad\b/iu.test(value ?? ''));
}

function shouldIncludeDadPilotContext(record: WorkspaceRecord, prompt = ''): boolean {
  return recordLooksLikeDadPilot(record) || promptAsksForDadPilotContext(prompt);
}

function deriveScoutSourceQueries(prompt: string): string[] {
  const lowered = prompt.toLowerCase();
  const terms = promptTerms(prompt);
  const queries: string[] = [];

  if (prompt.trim().length <= 90) queries.push(prompt.trim());
  if (terms.length > 0) {
    queries.push(terms.slice(0, 5).join(' '));
    if (terms.length > 5) queries.push(terms.slice(0, 12).join(' '));
    if (terms.length > 12) queries.push(terms.slice(-10).join(' '));
  }

  if (containsAny(lowered, ['weather', 'storm', 'rain', 'snow', 'ice', 'wind', 'heat', 'cold', 'forecast', 'alert'])) {
    queries.push('weather', 'cold', 'rain', 'storm');
  }
  if (containsAny(lowered, ['closure', 'detour', 'reroute', 'bridge', 'ferry', 'helene', 'closed'])) {
    queries.push('closure', 'detour', 'Helene');
  }
  if (containsAny(lowered, ['water', 'filter', 'dry source', 'thirst', 'hydration'])) {
    queries.push('water', 'filter');
  }
  if (containsAny(lowered, ['town', 'resupply', 'food', 'hostel', 'shuttle', 'outfitter', 'laundry', 'mail drop'])) {
    queries.push('resupply', 'town', 'hostel');
  }
  if (containsAny(lowered, ['gear', 'loadout', 'pack', 'tent', 'quilt', 'sleep', 'shoe', 'sock', 'rain jacket'])) {
    queries.push('gear', 'loadout', 'shelter');
  }
  if (containsAny(lowered, ['shelter', 'tent', 'camp', 'campsite', 'mouse', 'bear'])) {
    queries.push('shelter', 'tent', 'camp');
  }
  if (containsAny(lowered, ['injury', 'hurt', 'pain', 'knee', 'ankle', 'blister', 'medical', 'sick', 'health'])) {
    queries.push('pain', 'foot care', 'health', 'knee long descents daylight bailout food carry');
  }
  if (promptAsksForDadPilotContext(prompt)) {
    queries.push('Dad', 'Trail Update', 'Garmin');
  }
  if (containsAny(lowered, ['journal', 'family', 'friends', 'profile', 'share', 'public', 'private', 'location history'])) {
    queries.push('profile', 'journal', 'location', 'share');
  }

  return uniqueStrings(queries).slice(0, 12);
}

function catalogScore(entry: ScoutSourceCatalogEntry, prompt: string, terms: readonly string[]): number {
  const haystack = `${entry.label} ${entry.category} ${entry.useWhen} ${entry.keywords.join(' ')}`.toLowerCase();
  let score = entry.access === 'searchable-now' ? 1 : 0;

  for (const term of terms) {
    if (haystack.includes(term)) score += 2;
  }

  if (prompt.toLowerCase().includes(entry.id.replace(/-/gu, ' '))) score += 3;
  return score;
}

function recommendedScoutSources(prompt: string, limit = 6): ScoutSourceCatalogEntry[] {
  const terms = promptTerms(prompt);
  return [...SCOUT_SOURCE_CATALOG]
    .map((entry) => ({ entry, score: catalogScore(entry, prompt, terms) }))
    .filter((item) => item.score > 0)
    .sort((left, right) => right.score - left.score)
    .slice(0, limit)
    .map((item) => item.entry);
}

function decorateSearchHit(hit: SearchHit): ScoutContextHit {
  if (hit.sourceType === 'corpus') {
    return { ...hit, trust: 'reviewed', access: 'searchable-now' };
  }

  return { ...hit, trust: 'private', access: 'searchable-now' };
}

function dadPilotText(summary: DadPilotSummary): string {
  return [
    `Garmin fix: ${summary.latestFixLabel}${summary.latestFixAt ? ` at ${formatPilotDate(summary.latestFixAt)}` : ''}${summary.latestFixIsPreview ? ' (preview/fallback)' : ''}`,
    summary.latestTrailUpdate
      ? `Trail Update: ${summary.latestTrailUpdate.title}; ${summary.latestTrailUpdate.publishedAt ? `posted ${formatPilotDate(summary.latestTrailUpdate.publishedAt)}; ` : ''}${summary.latestTrailUpdate.location ? `location ${summary.latestTrailUpdate.location}; ` : ''}${summary.latestTrailUpdate.trailMile !== null ? `trail mile ${summary.latestTrailUpdate.trailMile.toFixed(1)}; ` : ''}${summary.latestTrailUpdate.body ?? ''}`
      : 'Trail Update: none available yet.',
    summary.latestDispatchTitle
      ? `YouTube dispatch: ${summary.latestDispatchTitle}${summary.latestDispatchPublished ? ` published ${formatPilotDate(summary.latestDispatchPublished)}` : ''}`
      : `YouTube dispatches loaded: ${summary.dispatchCount}`
  ].join('\n');
}

function searchDadPilotContext(summary: DadPilotSummary | null, queries: readonly string[]): ScoutContextHit[] {
  if (!summary) return [];
  const text = dadPilotText(summary);
  const lowered = text.toLowerCase();
  const hasMatch = queries.some((query) => promptTerms(query).some((term) => lowered.includes(term.toLowerCase())));
  const asksForPilot = queries.some((query) => promptAsksForDadPilotContext(query));

  if (!hasMatch && !asksForPilot) return [];

  return [
    {
      id: 'dad-public-pilot-context',
      sourceType: 'corpus',
      sourceLabel: 'Dad Public Pilot',
      title: 'Latest public Dad pilot context',
      excerpt: excerpt(text, 420),
      score: asksForPilot ? 8 : 4,
      trust: 'pilot',
      access: 'searchable-now'
    }
  ];
}

function searchScoutSources(record: WorkspaceRecord, dadPilotSummary: DadPilotSummary | null, prompt: string, limit = 8): ScoutContextHit[] {
  const queries = deriveScoutSourceQueries(prompt);
  const byKey = new Map<string, ScoutContextHit>();

  for (const query of queries) {
    const hits = [
      ...searchManualSections(record.sections, query),
      ...searchImportedDocuments(record.documents, query),
      ...searchWorkspaceResources(record.resources, query),
      ...searchWorkspaceTools(record.tools, query),
      ...searchPublicCorpus(publicCorpus, query)
    ];

    for (const hit of hits.map(decorateSearchHit)) {
      const key = `${hit.sourceType}:${hit.id}`;
      const existing = byKey.get(key);
      if (!existing || hit.score > existing.score) {
        byKey.set(key, hit);
      }
    }
  }

  for (const hit of searchDadPilotContext(dadPilotSummary, queries)) {
    byKey.set(hit.id, hit);
  }

  return [...byKey.values()].sort((left, right) => right.score - left.score).slice(0, limit);
}

function renderScoutSourceSearchResult(details: ScoutSourceSearchDetails): string {
  const hitLines = details.hits.map((hit, index) => {
    const href = hit.href ? ` href=${hit.href}` : '';
    return `${index + 1}. [${hit.sourceLabel}; ${hit.trust}; ${hit.access}] ${hit.title}${href}: ${excerpt(hit.excerpt, 320)}`;
  });

  const recommendationLines = details.recommendations.map((source, index) => (
    `${index + 1}. ${source.label} (${source.trust}; ${source.access}) — ${source.useWhen} Caveat: ${source.caveat}`
  ));

  return [
    `Search queries used: ${details.queries.join(' | ')}`,
    details.hits.length > 0
      ? `Searchable hits already available:
${hitLines.join('\n')}`
      : 'Searchable hits already available: none found in the private workspace, reviewed Hogg Country corpus, or public Dad pilot context for these queries.',
    details.recommendations.length > 0
      ? `Best source lanes to use or request next:
${recommendationLines.join('\n')}`
      : null,
    'Grounding rule: searchable-now hits can inform the answer. User-import, external-check, and future-integration lanes are not live evidence unless the hiker supplied/fetched them for this turn.'
  ].filter((line): line is string => Boolean(line)).join('\n');
}

function buildScoutSourceSearchDetails(
  record: WorkspaceRecord,
  dadPilotSummary: DadPilotSummary | null,
  prompt: string,
  limit = 5
): ScoutSourceSearchDetails {
  return {
    queries: deriveScoutSourceQueries(prompt),
    hits: searchScoutSources(record, dadPilotSummary, prompt, limit),
    recommendations: recommendedScoutSources(prompt)
  };
}

function buildOfficialTrailSourceTool(dadPilotSummary: DadPilotSummary | null): AgentTool<typeof OFFICIAL_TRAIL_SOURCE_PARAMETERS, OfficialTrailSourceCheckDetails> {
  return {
    name: 'check_official_trail_sources',
    label: 'Check official trail sources',
    description: 'Fetches live official source context from ATC Trail Updates and, when coordinates are available, NWS point forecast/alerts. Use for closures, detours, burn bans, bear warnings, storms, heat/cold, wind, flood risk, snow/ice, and other safety-sensitive current conditions.',
    parameters: OFFICIAL_TRAIL_SOURCE_PARAMETERS,
    executionMode: 'parallel',
    async execute(_toolCallId, params) {
      const details = await checkOfficialTrailSources(
        {
          query: params.query,
          source: params.source ?? 'auto',
          state: params.state ?? null,
          latitude: params.latitude ?? null,
          longitude: params.longitude ?? null,
          useDadLocation: params.useDadLocation ?? false
        },
        dadPilotSummary
      );
      const text = renderOfficialTrailSourceResult(details);

      return {
        content: [{ type: 'text', text: text.length > 7000 ? `${text.slice(0, 6999).trimEnd()}…` : text }],
        details
      };
    }
  };
}

function buildScoutSourceSearchTool(record: WorkspaceRecord, dadPilotSummary: DadPilotSummary | null): AgentTool<typeof SCOUT_SOURCE_SEARCH_PARAMETERS, ScoutSourceSearchDetails> {
  return {
    name: 'search_scout_sources',
    label: 'Search Scout sources',
    description: 'Searches private workspace notes, saved docs, checklists/tools, reviewed Hogg Country corpus, and public Dad pilot signals. Also recommends source lanes Scout should request, import, or verify next.',
    parameters: SCOUT_SOURCE_SEARCH_PARAMETERS,
    executionMode: 'parallel',
    async execute(_toolCallId, params) {
      const query = params.query.trim();
      const rawLimit = params.limit ?? 8;
      const limit = Number.isFinite(rawLimit) ? Math.min(10, Math.max(1, Math.round(rawLimit))) : 8;
      const details = buildScoutSourceSearchDetails(record, dadPilotSummary, query, limit);
      const text = renderScoutSourceSearchResult(details);

      return {
        content: [{ type: 'text', text: text.length > 6000 ? `${text.slice(0, 5999).trimEnd()}…` : text }],
        details
      };
    }
  };
}

function buildScoutSourceContext(record: WorkspaceRecord, dadPilotSummary: DadPilotSummary | null, prompt: string): string | null {
  const queries = deriveScoutSourceQueries(prompt);
  if (queries.length === 0) return null;

  const context = [
    'Scout source search context for this turn:',
    renderScoutSourceSearchResult(buildScoutSourceSearchDetails(record, dadPilotSummary, prompt)),
    'Grounding rules: use searchable-now hits as context; do not claim live conditions from external-check or user-import sources unless the user has supplied/fetched them; for weather, closures, water reliability, and same-day town logistics, name the official/direct source that should be checked before acting.'
  ].join('\n');

  return context.length > SCOUT_PRELOADED_SOURCE_MAX_CHARS
    ? `${context.slice(0, SCOUT_PRELOADED_SOURCE_MAX_CHARS - 1).trimEnd()}…`
    : context;
}

function shouldPreloadOfficialTrailSources(prompt: string): boolean {
  return /\b(weather|forecast|alert|closure|closed|detour|reroute|burn ban|bear|storm|thunder|heat|cold|wind|flood|snow|ice|24 hours|daily trail brief|go\/no-go)\b/iu.test(prompt);
}

async function buildPreloadedOfficialSourceContext(prompt: string, record: WorkspaceRecord, dadPilotSummary: DadPilotSummary | null): Promise<string | null> {
  if (!shouldPreloadOfficialTrailSources(prompt)) return null;

  const useDadLocation = promptAsksForDadPilotContext(prompt);

  const details = await checkOfficialTrailSources(
    {
      query: prompt,
      source: 'auto',
      state: record.profile ? approximateAtStateForMile(record.profile.currentMile) : null,
      useDadLocation
    },
    dadPilotSummary
  ).catch((error) => ({
    query: prompt,
    source: 'auto' as const,
    fetchedAt: new Date().toISOString(),
    atcUpdates: [],
    weather: null,
    skipped: [],
    errors: [`Official source preload failed: ${error instanceof Error ? error.message : 'unknown error'}`]
  } satisfies OfficialTrailSourceCheckDetails));

  const rendered = renderOfficialTrailSourceResult(details);
  const context = [
    'Preloaded official source check for this turn:',
    rendered,
    'Grounding rule: use this as current official context only for the sources named above. If coordinates were unavailable or a source was skipped, say so instead of filling the gap.'
  ].join('\n');

  return context.length > SCOUT_PRELOADED_OFFICIAL_MAX_CHARS
    ? `${context.slice(0, SCOUT_PRELOADED_OFFICIAL_MAX_CHARS - 1).trimEnd()}…`
    : context;
}

function excerpt(value: string, maxLength: number): string {
  const normalized = value.replace(/\s+/gu, ' ').trim();
  if (normalized.length <= maxLength) return normalized;
  return `${normalized.slice(0, maxLength - 1).trimEnd()}…`;
}

function configuredHouseProviderId(): ClawProviderId | null {
  const provider = (process.env.OPENCLAW_CLAW_PROVIDER || process.env.OPENCLAW_SCOUT_PROVIDER || '').trim();
  if (provider === OPENCODE_GO_PROVIDER_ID) return OPENCODE_GO_PROVIDER_ID;
  if (provider === OPENAI_CODEX_PROVIDER_ID) return null;
  return process.env.OPENCODE_API_KEY ? OPENCODE_GO_PROVIDER_ID : null;
}

function configuredHouseModelId(providerId: ClawProviderId): string {
  if (providerId === OPENCODE_GO_PROVIDER_ID) {
    return (process.env.OPENCLAW_CLAW_MODEL || process.env.OPENCLAW_SCOUT_MODEL || DEFAULT_OPENCODE_GO_MODEL).trim();
  }

  return OPENAI_CODEX_MODEL;
}

function resolveModelOrThrow(providerId: ClawProviderId, modelId: string): Model<any> {
  const model = getModel(providerId as never, modelId as never);
  if (model) return model;

  if (providerId === OPENCODE_GO_PROVIDER_ID) {
    return {
      id: modelId,
      name: modelId,
      api: 'openai-completions',
      provider: OPENCODE_GO_PROVIDER_ID,
      baseUrl: 'https://opencode.ai/zen/go/v1',
      reasoning: false,
      input: ['text'],
      cost: {
        input: 0,
        output: 0,
        cacheRead: 0,
        cacheWrite: 0
      },
      contextWindow: 128000,
      maxTokens: OPENCODE_GO_REPLY_MAX_TOKENS
    };
  }

  throw new Error(`Scout model is not registered: ${providerId} / ${modelId}`);
}

function getOpenCodeGoApiKey(): string {
  const apiKey = process.env.OPENCODE_API_KEY?.trim();
  if (!apiKey) {
    throw new Error('OPENCODE_API_KEY is required for the opencode-go Scout lane.');
  }
  return apiKey;
}

function applyOpenCodeGoPayloadCompat(payload: unknown): unknown {
  if (!payload || typeof payload !== 'object') return payload;

  const params = payload as {
    thinking?: { type: 'disabled' };
    max_tokens?: number;
    max_completion_tokens?: number;
  };

  // OpenCode Go's DeepSeek V4 Pro defaults to a thinking-only mode unless this is explicit.
  params.thinking = { type: 'disabled' };

  // The OpenAI-compatible DeepSeek lane honors max_tokens; keeping the completion-only
  // field can let the model spend the whole budget on reasoning before producing text.
  if (typeof params.max_completion_tokens === 'number' && typeof params.max_tokens !== 'number') {
    params.max_tokens = params.max_completion_tokens;
    delete params.max_completion_tokens;
  }

  return params;
}

export function getConfiguredClawConnection(record: Pick<WorkspaceSnapshot, 'providerConnections'>): WorkspaceClawConnectionPayload | null {
  const houseProviderId = configuredHouseProviderId();

  if (houseProviderId === OPENCODE_GO_PROVIDER_ID && process.env.OPENCODE_API_KEY?.trim()) {
    const modelId = configuredHouseModelId(houseProviderId);
    return {
      providerId: OPENCODE_GO_PROVIDER_ID,
      label: 'OpenCode Go house lane',
      status: 'connected',
      accountId: null,
      expiresAt: null,
      model: modelId
    };
  }

  const connection = record.providerConnections.find((item) => item.providerId === OPENAI_CODEX_PROVIDER_ID) ?? null;
  return connection
    ? {
        providerId: OPENAI_CODEX_PROVIDER_ID,
        label: connection.label,
        status: connection.status,
        accountId: connection.accountId,
        expiresAt: connection.expiresAt,
        model: OPENAI_CODEX_MODEL
      }
    : null;
}

async function resolveClawRuntime(record: WorkspaceRecord): Promise<ClawRuntime> {
  const houseProviderId = configuredHouseProviderId();

  if (houseProviderId === OPENCODE_GO_PROVIDER_ID) {
    const modelId = configuredHouseModelId(houseProviderId);
    return {
      providerId: OPENCODE_GO_PROVIDER_ID,
      modelId,
      model: resolveModelOrThrow(houseProviderId, modelId),
      apiKey: getOpenCodeGoApiKey(),
      credentials: null
    };
  }

  const credentials = await loadConnectedCredentials(record);
  const resolved = await resolveOpenAICodexApiKey(credentials);
  return {
    providerId: OPENAI_CODEX_PROVIDER_ID,
    modelId: OPENAI_CODEX_MODEL,
    model: resolveModelOrThrow(OPENAI_CODEX_PROVIDER_ID, OPENAI_CODEX_MODEL),
    apiKey: resolved.apiKey,
    credentials: resolved.credentials
  };
}

function userBlocksSummary(record: WorkspaceRecord): string[] {
  return record.sections
    .flatMap((section) =>
      section.blocks
        .filter((block) => block.type === 'user')
        .map((block) => `${section.title}: ${excerpt(block.content, 180)}`)
    )
    .slice(0, 6);
}

function formatPilotDate(value: string | null): string | null {
  if (!value) return null;
  const parsed = Date.parse(value);
  if (!Number.isFinite(parsed)) return value;
  return new Date(parsed).toISOString();
}

function formatDadTrailUpdate(update: DadTrailUpdateSummary | null): string {
  if (!update) return 'Trail Update: none available yet.';

  const details = [
    `Trail Update: ${update.title}`,
    update.publishedAt ? `posted ${formatPilotDate(update.publishedAt)}` : null,
    update.location ? `location ${update.location}` : null,
    update.trailMile !== null ? `trail mile ${update.trailMile.toFixed(1)}` : null,
    update.mediaType ? `media ${update.mediaType}` : null,
    update.body ? `note ${excerpt(update.body, 280)}` : null
  ].filter((line): line is string => Boolean(line));

  return details.join('; ') + '.';
}

function buildDadPilotSystemContext(summary: DadPilotSummary | null): string | null {
  if (!summary) return null;

  return [
    'Current public Dad pilot signals:',
    `Garmin fix: ${summary.latestFixLabel}${summary.latestFixAt ? ` at ${formatPilotDate(summary.latestFixAt)}` : ''}${summary.latestFixIsPreview ? ' (preview/fallback)' : ''}.`,
    formatDadTrailUpdate(summary.latestTrailUpdate),
    summary.latestDispatchTitle
      ? `YouTube dispatch: ${summary.latestDispatchTitle}${summary.latestDispatchPublished ? ` published ${formatPilotDate(summary.latestDispatchPublished)}` : ''}.`
      : `YouTube dispatches loaded: ${summary.dispatchCount}.`,
    'Use Trail Updates as the freshest hiker signal. Use Garmin as location signal. Use YouTube as broader narrative/context signal.',
    'This is public pilot context only; do not imply private certainty. If AT mile or location is unclear, say so and estimate conservatively.'
  ].join('\n');
}

function buildActiveResourceContext(activeResource: WorkspaceResource | null | undefined): string | null {
  if (!activeResource) return null;

  const source = [
    activeResource.extractedText,
    activeResource.summary,
    activeResource.sourceUri
  ].filter((value): value is string => typeof value === 'string' && value.trim().length > 0).join('\n');

  return [
    `Active private resource title: ${activeResource.title}`,
    `Resource type: ${activeResource.kind}. Sensitivity: ${activeResource.sensitivity}. Status: ${activeResource.status}.`,
    activeResource.sourceUri ? `Source URL: ${activeResource.sourceUri}` : null,
    activeResource.originalFileName ? `Original file: ${activeResource.originalFileName}` : null,
    'The user is asking with this private resource attached as source context.',
    'Use it as evidence, separate source-backed details from assumptions, and do not treat it as public/shared trail intel.',
    'If the user wants a maintained artifact, draft a saved-document-ready answer that they can review and save into Docs.',
    source ? `Private resource content:\n${excerpt(source, 4000)}` : 'Private resource content: no extracted text yet; use title/source metadata only and say extraction is thin.'
  ].filter((line): line is string => Boolean(line)).join('\n');
}

function buildSystemPrompt(
  record: WorkspaceRecord,
  activeDocument?: ImportedDocument | null,
  dadPilotSummary?: DadPilotSummary | null,
  scoutSourceContext?: string | null,
  liveToolsAvailable = true,
  activeResource?: WorkspaceResource | null
): string {
  const profile = record.profile;
  const notes = userBlocksSummary(record);
  const docs = record.documents.slice(0, 6).map((document) => document.title);
  const resources = record.resources.slice(0, 6).map((resource) => resource.title);
  const tools = record.tools.slice(0, 6).map((tool) => tool.title);
  const dadPilotContext = buildDadPilotSystemContext(dadPilotSummary ?? null);

  return [
    'You are Scout, Hogg Country\'s private trail delegate for a single hiker.',
    'Be direct, practical, calm, and trail-first.',
    'Use short useful answers. If context is thin, still give a safe beginner baseline, then ask only the one or two details that actually change the next decision.',
    'Do not require the hiker to arrive with a complete profile, guidebook, mileage source, or perfect prep. Build from almost nothing, infer cautiously from the conversation, and suggest optional artifacts only when they would materially improve the plan.',
    'Do not roleplay. Do not oversell certainty. Prefer concrete next actions over generic encouragement.',
    '',
    `Hiker name: ${record.betaProfile.name || 'Unknown'}`,
    `Trail name: ${record.betaProfile.trailName || 'Unknown'}`,
    `Workspace id: ${record.workspaceId}`,
    profile
      ? `Profile: start ${profile.startDate || 'unknown'}, current mile ${Number.isFinite(profile.currentMile) ? profile.currentMile.toFixed(1) : 'unknown'}, direction ${profile.direction || 'unknown'}, target pace ${profile.targetPace || 0} mpd.`
      : 'Profile: not initialized yet.',
    notes.length > 0 ? `Manual notes: ${notes.join(' | ')}` : 'Manual notes: none yet.',
    dadPilotContext,
    docs.length > 0 ? `Saved docs: ${docs.join(', ')}` : 'Saved docs: none yet.',
    resources.length > 0 ? `Private resources: ${resources.join(', ')}` : 'Private resources: none yet.',
    tools.length > 0 ? `Available tools/checklists: ${tools.join(', ')}` : 'Available tools/checklists: none yet.',
    'Be especially good at itinerary planning, loadout choices, food-carry limits, resupply timing, budget tradeoffs, health/body tracking, hostel or town sequencing, and turning rough trail constraints into usable plans.',
    'Before answering research-like questions, use the provided Scout source search context. Separate what is searchable-now from what still needs an official/direct live check or user import.',
    liveToolsAvailable
      ? 'You also have a search_scout_sources tool. Use it when the user asks a research/planning question and the provided context is too thin, too broad, or needs a narrower location/topic search.'
      : 'This runtime may provide preloaded source-search context instead of live tool calls; use the context you have and clearly name missing searches.',
    liveToolsAvailable
      ? 'You also have a check_official_trail_sources tool. Use it for safety-sensitive current conditions: closures, detours, burn bans, bear warnings, storms, heat/cold, wind, flood risk, snow/ice, and other live ATC/NWS checks. Pass latitude/longitude for NWS, or useDadLocation when the question is about Dad and the public Garmin fix is relevant.'
      : 'This runtime may provide preloaded official-source context instead of live tool calls; never imply live certainty beyond the named preloaded sources.',
    'For weather, closures, water reliability, and same-day town logistics, do not pretend to have live certainty unless a source was actually supplied; name the source that should be checked.',
    scoutSourceContext,
    'Treat saved assistant-generated documents as living Scout documents, not one-off files. The user wants Scout to keep them current through conversation.',
    'When asked for a plan, prefer a compact artifact with current snapshot, assumptions, day-by-day or category breakdown, concrete next actions, and missing intel that would tighten the answer.',
    'When revising a saved document, preserve useful existing structure, update stale facts, add a brief change-history note, and return the full revised document body.',
    buildActiveResourceContext(activeResource),
    activeDocument
      ? activeDocument.rights === 'assistant-generated'
        ? [
            `Active saved plan title: ${activeDocument.title}`,
            'The user is asking you to revise that saved plan in place.',
            'Return the full revised plan, not commentary about what changed.',
            `Current saved plan:\n${activeDocument.textContent}`
          ].join('\n')
        : [
            `Active private document title: ${activeDocument.title}`,
            'The user is asking with this private imported document attached as context.',
            'Use it as source material, quote or summarize only what is relevant, and do not treat it as public/shared trail intel.',
            'Do not rewrite this imported document in place unless the user explicitly asks for a separate new saved plan.',
            `Private document content:\n${activeDocument.textContent}`
          ].join('\n')
      : null,
    'Your job is to improve the hiker\'s plan quality and next decision quality.'
  ].filter((line): line is string => Boolean(line)).join('\n');
}

function toTimestamp(value: string): number {
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : Date.now();
}

function toPiMessage(message: WorkspaceClawMessage): Message {
  if (message.role === 'user') {
    const userMessage: UserMessage = {
      role: 'user',
      content: message.text,
      timestamp: toTimestamp(message.createdAt)
    };
    return userMessage;
  }

  const providerId = message.providerId === OPENCODE_GO_PROVIDER_ID ? OPENCODE_GO_PROVIDER_ID : OPENAI_CODEX_PROVIDER_ID;
  const assistantMessage: AssistantMessage = {
    role: 'assistant',
    content: [{ type: 'text', text: message.text }],
    api: providerId === OPENCODE_GO_PROVIDER_ID ? 'openai-completions' : 'openai-codex-responses',
    provider: providerId,
    model: message.model || (providerId === OPENCODE_GO_PROVIDER_ID ? DEFAULT_OPENCODE_GO_MODEL : CLAW_MODEL),
    usage: ZERO_USAGE,
    stopReason: message.error ? 'error' : 'stop',
    errorMessage: message.error ? message.text : undefined,
    timestamp: toTimestamp(message.createdAt)
  };

  return assistantMessage;
}

function assistantText(message: AssistantMessage | ToolResultMessage): string {
  if (message.role === 'toolResult') {
    return message.content
      .filter((content) => content.type === 'text')
      .map((content) => content.text)
      .join('\n')
      .trim();
  }

  return message.content
    .filter((content) => content.type === 'text')
    .map((content) => content.text)
    .join('\n')
    .trim();
}

function simplifyMessages(messages: Message[]): WorkspaceClawMessage[] {
  return messages
    .flatMap((message) => {
      if (message.role === 'user') {
        const text = typeof message.content === 'string'
          ? message.content.trim()
          : message.content
              .filter((content) => content.type === 'text')
              .map((content) => content.text)
              .join('\n')
              .trim();

        if (!text) return [];

        const workspaceMessage: WorkspaceClawMessage = {
          id: `claw-user-${message.timestamp}`,
          role: 'user',
          text,
          createdAt: new Date(message.timestamp).toISOString(),
          providerId: null,
          model: null,
          error: false
        };

        return [workspaceMessage];
      }

      if (message.role === 'assistant') {
        const text = assistantText(message);
        if (!text) return [];

        const providerId = message.provider === OPENAI_CODEX_PROVIDER_ID || message.provider === OPENCODE_GO_PROVIDER_ID ? message.provider : 'system';
        const workspaceMessage: WorkspaceClawMessage = {
          id: `claw-assistant-${message.timestamp}`,
          role: 'assistant',
          text,
          createdAt: new Date(message.timestamp).toISOString(),
          providerId,
          model: message.model || CLAW_MODEL,
          error: message.stopReason === 'error' || message.stopReason === 'aborted'
        };

        return [workspaceMessage];
      }

      return [];
    })
    .slice(-40);
}

function stripJsonFence(value: string): string {
  const trimmed = value.trim();
  if (!trimmed.startsWith('```')) return trimmed;
  return trimmed.replace(/^```(?:json)?\s*/u, '').replace(/\s*```$/u, '').trim();
}

function normalizeFactCandidateInput(input: unknown, sourceMessageId: string): WorkspaceFactCandidateInput | null {
  if (!input || typeof input !== 'object') return null;

  const candidate = input as Record<string, unknown>;
  const kind =
    candidate.kind === 'hostel' ||
    candidate.kind === 'resupply' ||
    candidate.kind === 'shuttle' ||
    candidate.kind === 'water' ||
    candidate.kind === 'closure' ||
    candidate.kind === 'weather_pattern' ||
    candidate.kind === 'gear' ||
    candidate.kind === 'medical' ||
    candidate.kind === 'other'
      ? candidate.kind
      : null;
  const claimText = typeof candidate.claimText === 'string' ? candidate.claimText.trim() : '';
  if (!kind || !claimText) return null;

  return {
    kind,
    claimText,
    regionSlug: typeof candidate.regionSlug === 'string' && candidate.regionSlug.trim().length > 0 ? candidate.regionSlug.trim() : null,
    mileRangeStart: typeof candidate.mileRangeStart === 'number' && Number.isFinite(candidate.mileRangeStart) ? candidate.mileRangeStart : null,
    mileRangeEnd: typeof candidate.mileRangeEnd === 'number' && Number.isFinite(candidate.mileRangeEnd) ? candidate.mileRangeEnd : null,
    sourceMessageId,
    sourceRole: 'assistant',
    sourceType: 'delegate_extraction',
    confidence: typeof candidate.confidence === 'number' ? Math.min(1, Math.max(0, candidate.confidence)) : 0.5
  };
}

function parseExtractedFactCandidates(text: string, sourceMessageId: string): WorkspaceFactCandidateInput[] {
  try {
    const parsed = JSON.parse(stripJsonFence(text)) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((candidate) => normalizeFactCandidateInput(candidate, sourceMessageId))
      .filter((candidate): candidate is WorkspaceFactCandidateInput => candidate !== null);
  } catch {
    return [];
  }
}

async function extractFactCandidatesFromTurn(
  runtime: ClawRuntime,
  record: WorkspaceRecord,
  userPrompt: string,
  reply: WorkspaceClawMessage
): Promise<WorkspaceFactCandidateInput[]> {
  const extractor = new Agent({
    initialState: {
      systemPrompt: [
        'You extract reusable Appalachian Trail fact candidates from one trail-planning exchange.',
        'Return ONLY a JSON array and nothing else.',
        'Each item must match this shape: {"kind":"hostel|resupply|shuttle|water|closure|weather_pattern|gear|medical|other","claimText":"short factual claim","regionSlug":null|string,"mileRangeStart":number|null,"mileRangeEnd":number|null,"confidence":0..1}.',
        'Only include claims that could help future hikers or improve shared trail documentation.',
        'Do not include personal preferences, hype, or private goals.',
        'If no reusable shared-intel facts are present, return [].'
      ].join('\n'),
      model: runtime.model,
      thinkingLevel: 'low',
      messages: []
    },
    sessionId: `workspace:${record.workspaceId}:claw-fact-extract:${reply.id}`,
    transport: 'sse',
    getApiKey: async () => runtime.apiKey
  });

  await extractor.prompt([
    `Trail name: ${record.betaProfile.trailName || 'Unknown'}`,
    record.profile ? `Current mile: ${record.profile.currentMile.toFixed(1)}` : 'Current mile: unknown',
    `User message:\n${userPrompt}`,
    `Assistant reply:\n${reply.text}`
  ].join('\n\n'));

  const extractedReply = simplifyMessages(extractor.state.messages as Message[]).at(-1);
  if (!extractedReply || extractedReply.role !== 'assistant') {
    return [];
  }

  return parseExtractedFactCandidates(extractedReply.text, reply.id);
}

async function loadConnectedCredentials(record: WorkspaceRecord): Promise<OpenAICodexCredentials> {
  const connection = record.providerConnections.find((item) => item.providerId === 'openai-codex');
  if (!connection || !record.openAICodexCredentials) {
    throw new Error('Connect ChatGPT before sending a cloud prompt.');
  }

  const credentials = decryptProviderJson<OpenAICodexCredentials>(record.openAICodexCredentials);
  if (!credentials) {
    throw new Error('Stored ChatGPT credentials could not be decrypted.');
  }

  return {
    ...credentials,
    accountId: credentials.accountId || connection.accountId,
    label: credentials.label || connection.label
  };
}

function deterministicClawTurn(
  record: WorkspaceRecord,
  runtime: ClawRuntime,
  prompt: string,
  replyText: string
): { readonly nextMessages: WorkspaceClawMessage[]; readonly reply: WorkspaceClawMessage } {
  const timestamp = Date.now();
  const userMessage: WorkspaceClawMessage = {
    id: `claw-user-${timestamp}`,
    role: 'user',
    text: prompt,
    createdAt: new Date(timestamp).toISOString(),
    providerId: null,
    model: null,
    error: false
  };
  const reply: WorkspaceClawMessage = {
    id: `claw-assistant-${timestamp + 1}`,
    role: 'assistant',
    text: replyText,
    createdAt: new Date(timestamp + 1).toISOString(),
    providerId: runtime.providerId,
    model: runtime.modelId,
    error: false
  };

  return {
    nextMessages: [...record.clawMessages, userMessage, reply].slice(-40),
    reply
  };
}

function promptAsksForPrivateImportSearch(prompt: string): boolean {
  const lowered = prompt.toLowerCase();
  return /\b(private|user-owned|imported|farout|a\.t\. guide|awol)\b/iu.test(lowered)
    && /\b(search|find|look|note|document|docs|source check)\b/iu.test(lowered);
}

function documentEvidenceChunks(document: ImportedDocument, prompt: string, limit = 4): string[] {
  const terms = promptTerms(prompt).filter((term) => ![
    'answer',
    'check',
    'context',
    'document',
    'fewer',
    'imported',
    'private',
    'public',
    'reply',
    'search',
    'source'
  ].includes(term));
  const text = document.textContent || document.note || '';
  const chunks = uniqueStrings(
    text
      .split(/(?<=[.!?])\s+|\n+/u)
      .map((chunk) => chunk.trim())
      .filter(Boolean)
  );

  const matches = chunks.filter((chunk) => {
    const lowered = chunk.toLowerCase();
    return terms.some((term) => lowered.includes(term));
  });

  return (matches.length > 0 ? matches : chunks).slice(0, limit).map((chunk) => excerpt(chunk, 240));
}

function buildPrivateImportSearchReply(record: WorkspaceRecord, prompt: string): string | null {
  if (!promptAsksForPrivateImportSearch(prompt)) return null;

  const privateDocuments = record.documents.filter((document) => document.rights === 'user-imported' && document.searchable !== false);
  if (privateDocuments.length === 0) return null;

  const queryCandidates = uniqueStrings([
    prompt,
    ...deriveScoutSourceQueries(prompt),
    promptTerms(prompt).join(' ')
  ]).filter(Boolean);
  const hits = queryCandidates
    .flatMap((query) => searchImportedDocuments(privateDocuments, query))
    .sort((left, right) => right.score - left.score);
  const bestHit = hits.at(0);
  if (!bestHit) return null;

  const document = privateDocuments.find((item) => item.id === bestHit.id);
  if (!document) return null;

  const text = document.textContent || document.note || '';
  const mentionsDescents = /\b(long descents?|descending|downhill)\b/iu.test(text);
  const mentionsDaylight = /\bdaylight|after\s+4\s*p\.?m\.?|late in the day\b/iu.test(text);
  const capMatch = text.match(/\bcap\b[^.]{0,90}?(\d+\s*(?:-|–|to)\s*\d+|\d+)\s*miles?/iu);
  const foodCarryMatch = text.match(/\b(?:food carries?|carry)\b[^.]{0,90}?\b(?:under|less than|fewer than)\s+four\s+days\b/iu);
  const targetPace = record.profile?.targetPace;
  const evidence = documentEvidenceChunks(document, prompt, 3);
  const label = document.fileName || document.title;
  const lines: string[] = [
    `- I searched your private imported docs and found \`${label}\`.`,
    ...evidence.map((chunk) => `- Source-backed from that import: ${chunk}`)
  ];

  if (capMatch) {
    lines.push(`- Mileage adjustment: use the note's ${capMatch[1].replace(/\s+/gu, '')}-mile cap when late descents stack up, instead of forcing the normal${typeof targetPace === 'number' ? ` ${targetPace} mpd` : ''} target.`);
  } else if (mentionsDescents || mentionsDaylight) {
    lines.push(`- Mileage adjustment: treat the normal${typeof targetPace === 'number' ? ` ${targetPace} mpd` : ''} target as a ceiling when descents or daylight are working against the knee.`);
  }

  if (mentionsDescents || mentionsDaylight) {
    lines.push('- Plan shape: avoid making the hardest downhill miles the last miles of the day; pick an earlier bailout or campsite if the profile stacks descending late.');
  }

  if (foodCarryMatch) {
    lines.push('- Resupply constraint: keep the carry under four days when practical so pack weight is not adding stress to the knee.');
  }

  lines.push('- Still needed: exact descents, shelter/road options, and sunset timing require your own FarOut/A.T. Guide import or another source for the specific mile segment.');
  return uniqueStrings(lines).slice(0, 6).join('\n');
}

function promptAsksForOfficialRelevanceReview(prompt: string): boolean {
  const lowered = prompt.toLowerCase();
  return /\b(atc|official|trail updates?|burn[- ]ban|bear|closure|closed|detour|reroute|alert)\b/iu.test(lowered)
    && /\b(relevant|my location|mile|virginia|va|current context|source-backed|source backed)\b/iu.test(lowered);
}

function atcUpdateMatchesApproxState(update: { readonly meta: string; readonly title: string }, state: string | null): boolean {
  if (!state) return false;
  const haystack = `${update.meta} ${update.title}`.toUpperCase();
  return new RegExp(String.raw`(?:^|[^A-Z])${state}(?:[^A-Z]|$)`, 'u').test(haystack);
}

async function buildOfficialRelevanceReply(record: WorkspaceRecord, prompt: string): Promise<string | null> {
  if (!promptAsksForOfficialRelevanceReview(prompt)) return null;

  const state = approximateAtStateForMile(record.profile?.currentMile);
  const details = await checkOfficialTrailSources({
    query: prompt,
    source: 'atc',
    state,
    useDadLocation: false
  }, null);
  const updates = details.atcUpdates.slice(0, 3);
  const profileBits = [
    record.betaProfile.trailName || 'this workspace',
    record.profile?.direction,
    typeof record.profile?.currentMile === 'number' ? `mile ${record.profile.currentMile.toFixed(1)}` : null,
    state ? `approx. ${state}` : null
  ].filter(Boolean).join(' · ');
  const lines: string[] = [
    `- Source-backed workspace context: ${profileBits || 'current mile/state not set in the profile'}.`,
    updates.length > 0
      ? `- Source-backed official check: ATC Trail Updates returned ${updates.length} current item${updates.length === 1 ? '' : 's'} for this review.`
      : '- Source-backed official check: ATC Trail Updates did not return a matching current item for this review.'
  ];

  for (const update of updates) {
    const stateMatch = atcUpdateMatchesApproxState(update, state);
    lines.push(`- ${stateMatch ? 'Potentially relevant' : 'Not state-matched'}: ${update.title}${update.meta ? ` (${update.meta})` : ''}${update.href ? ` — ${update.href}` : ''}`);
  }

  if (state) {
    const nonState = updates.filter((update) => !atcUpdateMatchesApproxState(update, state));
    if (nonState.length > 0) {
      lines.push(`- Assumption/check: items not tagged ${state} should not be treated as directly relevant to mile ${record.profile?.currentMile?.toFixed(1) ?? 'unknown'} without a mile-specific match.`);
    }
  }

  if (details.errors.length > 0) {
    lines.push(`- Source limitation: ${details.errors.join(' ')}`);
  }

  lines.push('- Still needed: FarOut or A.T. Guide import for exact mile-by-mile shelter, road, elevation, and whether an alert changes today’s specific endpoint.');
  return lines.slice(0, 6).join('\n');
}

function promptAsksForTrailOpsPlan(prompt: string): boolean {
  const lowered = prompt.toLowerCase();
  return /\b(next\s+24|24\s*hours?|3\s*(?:-|–|to)\s*7|three\s+to\s+seven|daily plan|mileage target)\b/iu.test(lowered)
    && /\b(plan|mile|pace|resupply|food carry|bailout|water|knee|trail)\b/iu.test(lowered);
}

function bestPrivateDocumentHit(record: WorkspaceRecord, prompt: string): ImportedDocument | null {
  const privateDocuments = record.documents.filter((document) => document.rights === 'user-imported' && document.searchable !== false);
  if (privateDocuments.length === 0) return null;

  const hits = uniqueStrings([prompt, ...deriveScoutSourceQueries(prompt), promptTerms(prompt).join(' ')])
    .flatMap((query) => searchImportedDocuments(privateDocuments, query))
    .sort((left, right) => right.score - left.score);
  const bestHit = hits.at(0);
  return bestHit ? privateDocuments.find((document) => document.id === bestHit.id) ?? null : null;
}

async function buildTrailOpsPlanReply(record: WorkspaceRecord, prompt: string): Promise<string | null> {
  if (!promptAsksForTrailOpsPlan(prompt)) return null;

  const profile = record.profile;
  const state = approximateAtStateForMile(profile?.currentMile);
  const official = await checkOfficialTrailSources({
    query: prompt,
    source: 'atc',
    state,
    useDadLocation: false
  }, null);
  const privateDoc = bestPrivateDocumentHit(record, prompt);
  const privateEvidence = privateDoc ? documentEvidenceChunks(privateDoc, prompt, 2) : [];
  const text = privateDoc?.textContent ?? '';
  const capMatch = text.match(/\bcap\b[^.]{0,90}?(\d+\s*(?:-|–|to)\s*\d+|\d+)\s*miles?/iu);
  const targetPace = profile?.targetPace;
  const conservativeMileage = capMatch
    ? capMatch[1].replace(/\s+/gu, '')
    : typeof targetPace === 'number'
      ? `${Math.max(8, Math.round(targetPace - 3))}-${Math.round(targetPace)} miles`
      : 'a conservative mileage range';
  const profileBits = [
    record.betaProfile.trailName || 'Hiker',
    profile?.direction,
    typeof profile?.currentMile === 'number' ? `mile ${profile.currentMile.toFixed(1)}` : null,
    state ? `approx. ${state}` : null,
    typeof targetPace === 'number' ? `target ${targetPace} mpd` : null,
    typeof profile?.waterCapacityLiters === 'number' ? `${profile.waterCapacityLiters}L water` : null
  ].filter(Boolean).join(' · ');
  const stateRelevantUpdates = official.atcUpdates.filter((update) => atcUpdateMatchesApproxState(update, state)).slice(0, 2);
  const lines: string[] = [
    `### Scout trail ops plan`,
    `**Source-backed facts**`,
    `- Workspace: ${profileBits || 'profile details are incomplete'}.`,
    profile?.healthNotes ? `- Workspace health/logistics notes: ${profile.healthNotes}` : null,
    privateDoc ? `- Private import: ${privateDoc.fileName || privateDoc.title}${privateEvidence.length > 0 ? ` — ${privateEvidence.join(' ')}` : ''}` : null,
    stateRelevantUpdates.length > 0
      ? `- ATC Trail Updates (${state ?? 'state'}-relevant): ${stateRelevantUpdates.map((update) => update.title).join('; ')}.`
      : '- ATC Trail Updates: no state-matched item was returned in this quick check.',
    `\n**Next 24 hours**`,
    `- Set the day as ${conservativeMileage}${typeof targetPace === 'number' ? ` rather than forcing ${targetPace} mpd` : ''} if descents, heat, or daylight are uncertain.`,
    '- End at a verified legal campsite/shelter/road option from your own guide data; do not depend on an unverified endpoint from Scout alone.',
    typeof profile?.waterCapacityLiters === 'number'
      ? `- Leave major water with up to ${profile.waterCapacityLiters}L until FarOut/A.T. Guide confirms the next reliable source.`
      : '- Confirm water before committing to a dry ridge or long gap.',
    '- Choose one bailout/short-day option before noon so the knee decision is made early, not after the hard miles.',
    `\n**3–7 day guardrails**`,
    '- Keep resupply legs under four days when practical; shorter carries protect the knee and reduce forced-mile pressure.',
    '- Avoid stacking long downhill finishes late in the day; put descents earlier or shorten the day.',
    '- Re-check ATC alerts before leaving town and use user-owned FarOut/A.T. Guide data for exact shelters, road crossings, water, elevation, and town mileage.'
  ].filter((line): line is string => Boolean(line));

  return lines.join('\n');
}

function formatStrictRoutePoint(point: AtRoutePoint, start: AtRoutePoint): string {
  const delta = point.mile - start.mile;
  const relative = delta === 0 ? 'start' : `${delta > 0 ? '+' : '-'}${formatAtRouteMileage(Math.abs(delta))}`;
  return `| ${point.name} | ${formatAtRouteMileage(point.mile)} | ${relative} | ${point.kind} |`;
}

function renderStrictRouteOption(option: AtRoutePlanOption): string[] {
  const lines = [`**${option.label}** — ${formatAtRouteMileage(option.totalMiles)} mi total`];
  lines.push('| Day | Leg | Miles | Guardrail note |');
  lines.push('|---|---|---:|---|');
  for (const day of option.days) {
    lines.push(`| ${day.day} | ${day.from.name} → ${day.to.name} | ${formatAtRouteMileage(day.miles)} | ${day.note} |`);
  }
  for (const caveat of option.caveats) {
    lines.push(`- ${caveat}`);
  }
  return lines;
}

function renderStrictRouteOfficialSummary(details: OfficialTrailSourceCheckDetails | null, state: string | null): string[] {
  if (!details) {
    return ['- Official/live check: not run for this route guardrail. Re-check ATC Trail Updates and NWS before leaving.'];
  }

  const lines: string[] = [`- Official/live check fetched: ${details.fetchedAt}.`];
  const stateRelevantUpdates = details.atcUpdates.filter((update) => atcUpdateMatchesApproxState(update, state)).slice(0, 2);
  if (stateRelevantUpdates.length > 0) {
    lines.push(`- ATC Trail Updates (${state ?? 'state'}-matched): ${stateRelevantUpdates.map((update) => `${update.title}${update.href ? ` (${update.href})` : ''}`).join('; ')}.`);
  } else if (details.atcUpdates.length > 0) {
    lines.push(`- ATC Trail Updates: returned items, but none were clearly tagged ${state ?? 'for this state'}; do not treat them as this route’s closure/fire condition without checking the page.`);
  } else {
    lines.push('- ATC Trail Updates: no matching item returned by the quick current-list check. Still re-check before leaving.');
  }

  if (details.weather) {
    if (details.weather.alerts.length > 0) {
      lines.push(`- NWS active alerts near ${details.weather.label}: ${details.weather.alerts.map((alert) => alert.event).join('; ')}.`);
    } else {
      lines.push(`- NWS active alerts near ${details.weather.label}: none returned for this point.`);
    }

    const periods = details.weather.periods.slice(0, 2).map((period) => `${period.name}: ${period.temperature}, ${period.wind}, ${period.shortForecast}`);
    if (periods.length > 0) lines.push(`- NWS near-term forecast: ${periods.join(' | ')}.`);
  } else {
    lines.push('- NWS: no forecast/alert receipt available in this turn. Pull the point forecast 24–48 hours before stepping off.');
  }

  if (details.skipped.length > 0) lines.push(`- Official skipped: ${details.skipped.join(' ')}`);
  if (details.errors.length > 0) lines.push(`- Official check limitation: ${details.errors.join(' ')}`);
  return lines;
}

function buildStrictAtRouteGrounding(record: WorkspaceRecord, prompt: string): AtRouteGrounding | null {
  return buildAtRouteGrounding({
    prompt,
    targetDailyMileage: record.profile?.targetPace ?? null
  });
}

async function buildStrictAtRouteItineraryReply(record: WorkspaceRecord, prompt: string): Promise<string | null> {
  const grounding = buildStrictAtRouteGrounding(record, prompt);
  if (!grounding) return null;

  const official = await checkOfficialTrailSources({
    query: prompt,
    source: 'auto',
    state: grounding.state,
    latitude: grounding.start.latitude ?? null,
    longitude: grounding.start.longitude ?? null,
    useDadLocation: false
  }, null).catch((error) => ({
    query: prompt,
    source: 'auto' as const,
    fetchedAt: new Date().toISOString(),
    atcUpdates: [],
    weather: null,
    skipped: [],
    errors: [`Official source check failed: ${error instanceof Error ? error.message : 'unknown error'}`]
  } satisfies OfficialTrailSourceCheckDetails));

  const profileBits = [
    record.betaProfile.trailName || record.betaProfile.name || 'Hiker',
    record.profile?.direction,
    typeof record.profile?.targetPace === 'number' ? `workspace target ${record.profile.targetPace} mpd` : null,
    typeof record.profile?.waterCapacityLiters === 'number' ? `${record.profile.waterCapacityLiters}L water capacity` : null
  ].filter(Boolean).join(' · ');

  const lines: string[] = [
    '### Scout strict-route plan',
    '',
    'I’m using strict route mode because this asks for a real AT itinerary. The route order below comes from the validator, not model memory.',
    profileBits ? `Workspace context: ${profileBits}.` : null,
    '',
    '**Route-order guardrail**',
    `- Direction: ${grounding.direction}.`,
    grounding.targetDays ? `- Requested trip length detected: ${grounding.targetDays} day${grounding.targetDays === 1 ? '' : 's'}.` : null,
    grounding.targetDailyMileage ? `- Planning pace context: ${formatAtRouteMileage(grounding.targetDailyMileage)} mpd${grounding.targetTotalMiles ? ` (~${formatAtRouteMileage(grounding.targetTotalMiles)} mi target)` : ''}.` : null,
    `- Source: ${grounding.source.label}. ${grounding.source.exactMileageCaveat}`,
    '',
    '| Point | Route mile | From start | Type |',
    '|---|---:|---:|---|',
    ...grounding.corridor.map((point) => formatStrictRoutePoint(point, grounding.start)),
    '',
    '**Important corrections / guardrails**',
    ...grounding.warnings.map((warning) => `- ${warning}`),
    '',
    '**Route options**'
  ].filter((line): line is string => line !== null);

  if (grounding.planOptions.length > 0) {
    for (const option of grounding.planOptions) {
      lines.push('', ...renderStrictRouteOption(option));
    }
  } else {
    lines.push('- I found a validated corridor, but no automatic day-by-day option is built for this start yet. Use the ordered points above and verify legal overnight endpoints from your guide.');
  }

  lines.push(
    '',
    '**Camping / shelter assumptions**',
    '- Shelter names in the route table are candidate endpoints only after current guide/FarOut-style condition checks confirm legality, capacity, and water.',
    '- Boiling Springs is a town/service stop in this guardrail, not an assumed legal campsite. Confirm lodging/camping before making it an overnight endpoint.',
    '- Do not use Tagg Run as a Pine Grove NOBO endpoint from Scout unless you import or fetch a source that proves it belongs in this segment.',
    '',
    '**Food and water**',
    '- Carry the full 3-day food plan from the start unless your current guide confirms a real resupply/pickup plan at Boiling Springs or Duncannon.',
    typeof record.profile?.waterCapacityLiters === 'number'
      ? `- Your workspace water capacity is ${record.profile.waterCapacityLiters}L; treat that as too tight for any uncertain dry stretch until current water comments confirm otherwise.`
      : '- Confirm water before committing to any shelter or dry ridge; Scout does not have current water reliability here.',
    '- Filter all natural sources. For each morning, verify the next reliable water before leaving camp/town.',
    '',
    '**Gear / supply focus**',
    '- Rain shell, dry sleep layers, treated socks/pants, tick remover, headlamp, offline maps/guide, water filter, and enough battery to check weather before committing to the next leg.',
    '- If fire risk is elevated, verify stove restrictions and do not assume campfires are allowed.',
    '',
    '**Safety / live conditions**',
    ...renderStrictRouteOfficialSummary(official, grounding.state),
    '- Ticks are a high-priority PA risk in May: permethrin, nightly checks, and fast removal plan.',
    '',
    '**Final checklist before leaving**',
    '- Verify exact route mileages and legal overnight endpoints in your current user-owned guide.',
    '- Re-check ATC Trail Updates for PA closures, detours, fire restrictions, and bear/camping notices.',
    '- Pull the NWS point forecast/alerts for Pine Grove Furnace and each overnight area 24–48 hours before departure.',
    '- Check water reliability and shelter comments for James Fry, Alec Kennedy, Darlington, and any town/road stop you plan to use.',
    '- Confirm parking, shuttle/pickup, town hours, lodging/camping, and bailout options before committing to the stronger plan.',
    '',
    '**Source receipts**',
    `- Route validator: ${grounding.source.citation}`,
    official ? `- Official/live sources: ATC Trail Updates and NWS checked at ${official.fetchedAt}.` : '- Official/live sources: not checked in this turn.',
    '- Missing source class: current user-owned guide / FarOut-style comments for exact shelter condition, water reliability, services, and legal camping.'
  );

  return lines.join('\n');
}

function buildRouteClaimFallbackReply(grounding: AtRouteGrounding, issues: readonly AtRouteClaimIssue[]): string {
  const blockingIssues = issues.filter((issue) => issue.severity === 'block');
  const lines: string[] = [
    '### Scout route validator blocked the draft',
    '',
    'The model draft contained route claims that did not pass the deterministic AT validator, so I’m not going to show it as a usable itinerary.',
    '',
    '**Blocked claims**',
    ...blockingIssues.slice(0, 5).map((issue) => `- ${issue.message} Evidence: “${issue.evidence}”`),
    '',
    '**Validated route order instead**',
    `- Direction: ${grounding.direction}.`,
    `- Source system: ${grounding.source.label}.`,
    '| Point | Route mile | From start | Type |',
    '|---|---:|---:|---|',
    ...grounding.corridor.map((point) => formatStrictRoutePoint(point, grounding.start)),
    '',
    '**Safe next step**',
    '- Use the validated order above as the skeleton, then verify exact mileages, legal camping, water, services, and closures in a current user-owned guide plus ATC/NWS before leaving.',
    grounding.blockedEndpointNames.length > 0 ? `- Do not use ${grounding.blockedEndpointNames.join(', ')} as a firm endpoint unless another source proves it belongs in this segment.` : null,
    '- If you want, ask again with an imported/current guide page attached and Scout will use that as the source layer instead of guessing.'
  ].filter((line): line is string => line !== null);
  return lines.join('\n');
}

export async function replyInWorkspaceClaw(
  workspaceId: string,
  betaProfile: BetaProfileCookie,
  prompt: string,
  options?: {
    readonly documentId?: string | null;
    readonly resourceId?: string | null;
  }
): Promise<{
  readonly workspace: WorkspaceSnapshot;
  readonly reply: WorkspaceClawMessage;
  readonly revisedDocument: ImportedDocument | null;
}> {
  const trimmedPrompt = prompt.trim();
  if (!trimmedPrompt) {
    throw new Error('Prompt cannot be empty.');
  }

  const record = await getWorkspaceRecord(workspaceId, betaProfile);
  const activeDocument = options?.documentId
    ? record.documents.find((document) => document.id === options.documentId) ?? null
    : null;
  const activeResource = options?.resourceId
    ? record.resources.find((resource) => resource.id === options.resourceId) ?? null
    : null;

  if (options?.documentId && !activeDocument) {
    throw new Error('Document not found.');
  }

  if (options?.resourceId && !activeResource) {
    throw new Error('Resource not found.');
  }

  const runtime = await resolveClawRuntime(record);

  if (!activeDocument && !activeResource) {
    const strictRouteReply = await buildStrictAtRouteItineraryReply(record, trimmedPrompt);
    if (strictRouteReply) {
      const { nextMessages, reply } = deterministicClawTurn(record, runtime, trimmedPrompt, strictRouteReply);
      const workspace = await replaceWorkspaceClawMessages(workspaceId, betaProfile, nextMessages);
      return { workspace, reply, revisedDocument: null };
    }

    const privateImportReply = buildPrivateImportSearchReply(record, trimmedPrompt);
    if (privateImportReply) {
      const { nextMessages, reply } = deterministicClawTurn(record, runtime, trimmedPrompt, privateImportReply);
      const workspace = await replaceWorkspaceClawMessages(workspaceId, betaProfile, nextMessages);
      return { workspace, reply, revisedDocument: null };
    }

    const officialRelevanceReply = await buildOfficialRelevanceReply(record, trimmedPrompt);
    if (officialRelevanceReply) {
      const { nextMessages, reply } = deterministicClawTurn(record, runtime, trimmedPrompt, officialRelevanceReply);
      const workspace = await replaceWorkspaceClawMessages(workspaceId, betaProfile, nextMessages);
      return { workspace, reply, revisedDocument: null };
    }

    const trailOpsPlanReply = await buildTrailOpsPlanReply(record, trimmedPrompt);
    if (trailOpsPlanReply) {
      const { nextMessages, reply } = deterministicClawTurn(record, runtime, trimmedPrompt, trailOpsPlanReply);
      const workspace = await replaceWorkspaceClawMessages(workspaceId, betaProfile, nextMessages);
      return { workspace, reply, revisedDocument: null };
    }
  }

  const dadPilotSummary = shouldIncludeDadPilotContext(record, trimmedPrompt) ? await loadDadPilotSummary().catch(() => null) : null;
  const sourceContexts = [
    buildScoutSourceContext(record, dadPilotSummary, trimmedPrompt),
    runtime.providerId === OPENCODE_GO_PROVIDER_ID ? await buildPreloadedOfficialSourceContext(trimmedPrompt, record, dadPilotSummary) : null
  ].filter((context): context is string => Boolean(context));

  const baseSourceContext = sourceContexts.length > 0 ? sourceContexts.join('\n\n') : null;
  const turnDeadline = Date.now() + SCOUT_AGENT_TURN_TIMEOUT_MS;
  const runAgentPrompt = async (
    history: readonly WorkspaceClawMessage[],
    extraSystemInstruction: string | null = null
  ): Promise<{ nextMessages: WorkspaceClawMessage[]; reply: WorkspaceClawMessage | undefined }> => {
    const sourceContext = [baseSourceContext, extraSystemInstruction].filter(Boolean).join('\n\n') || null;
    const agent = new Agent({
      initialState: {
        systemPrompt: buildSystemPrompt(
          record,
          activeDocument,
          dadPilotSummary,
          sourceContext,
          true,
          activeResource
        ),
        model: runtime.model,
        thinkingLevel: 'low',
        tools: [buildScoutSourceSearchTool(record, dadPilotSummary), buildOfficialTrailSourceTool(dadPilotSummary)],
        messages: history.map(toPiMessage)
      },
      sessionId: `workspace:${workspaceId}:claw`,
      transport: 'sse',
      getApiKey: async () => runtime.apiKey,
      onPayload: runtime.providerId === OPENCODE_GO_PROVIDER_ID ? applyOpenCodeGoPayloadCompat : undefined
    });

    await withScoutAgentTimeout(agent.prompt(trimmedPrompt), turnDeadline - Date.now());

    const nextMessages = simplifyMessages(agent.state.messages as Message[]);
    const reply = nextMessages.at(-1);
    return { nextMessages, reply };
  };

  const history = runtime.providerId === OPENCODE_GO_PROVIDER_ID ? record.clawMessages.slice(-8) : record.clawMessages;
  let { nextMessages, reply } = await runAgentPrompt(history);

  if ((!reply || reply.role !== 'assistant' || reply.error) && runtime.providerId === OPENCODE_GO_PROVIDER_ID) {
    const retry = await runAgentPrompt(
      [],
      'Retry mode: the previous model call did not produce a usable assistant answer. Answer from the private workspace/source context above, keep the response concise, and do not invent missing source facts.'
    );
    nextMessages = [...record.clawMessages, ...retry.nextMessages].slice(-40);
    reply = retry.reply;
  }

  if (!reply || reply.role !== 'assistant') {
    throw new Error('Pi agent did not return an assistant reply.');
  }

  const strictRouteGrounding = buildStrictAtRouteGrounding(record, trimmedPrompt);
  if (strictRouteGrounding) {
    const routeClaimIssues = validateAtRouteAnswerClaims(reply.text, strictRouteGrounding);
    if (routeClaimIssues.some((issue) => issue.severity === 'block')) {
      const safeReply: WorkspaceClawMessage = {
        ...reply,
        providerId: 'system',
        model: 'strict-route-validator',
        error: false,
        text: buildRouteClaimFallbackReply(strictRouteGrounding, routeClaimIssues)
      };
      nextMessages = [...nextMessages.slice(0, -1), safeReply];
      reply = safeReply;
    }
  }

  if (runtime.credentials) {
    await saveWorkspaceOpenAICodexConnection(workspaceId, betaProfile, {
      encryptedCredentials: encryptProviderJson(runtime.credentials),
      accountId: runtime.credentials.accountId ?? null,
      expiresAt: new Date(runtime.credentials.expires).toISOString(),
      label: runtime.credentials.label ?? null
    });
  }

  let workspace = await replaceWorkspaceClawMessages(workspaceId, betaProfile, nextMessages);
  let revisedDocument: ImportedDocument | null = null;

  if (activeDocument?.rights === 'assistant-generated') {
    const revised = await reviseWorkspaceScoutDocument(workspaceId, betaProfile, {
      documentId: activeDocument.id,
      prompt: trimmedPrompt,
      replyText: reply.text
    });
    workspace = revised.workspace;
    revisedDocument = revised.document;
  }

  if (runtime.providerId !== OPENCODE_GO_PROVIDER_ID) {
    try {
      const extractedFacts = await extractFactCandidatesFromTurn(runtime, record, trimmedPrompt, reply);
      if (extractedFacts.length > 0) {
        workspace = await appendWorkspaceFactCandidates(workspaceId, betaProfile, extractedFacts);
      }
    } catch (error) {
      console.error('Failed to extract workspace fact candidates', error);
    }
  }

  return {
    workspace,
    reply,
    revisedDocument
  };
}
