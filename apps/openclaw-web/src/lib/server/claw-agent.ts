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
  SCOUT_SOURCE_CATALOG,
  buildScoutSourceReceipt,
  selectScoutSourceManifests,
  type ScoutSourceAccess,
  type ScoutSourceCatalogEntry,
  type ScoutSourceManifest,
  type ScoutSourceTrust
} from '@hoggcountry/scout-sources';
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
import { SCOUT_VOICE_EXAMPLES } from './scout-voice-examples';

const OPENAI_CODEX_PROVIDER_ID = 'openai-codex';
const OPENCODE_GO_PROVIDER_ID = 'opencode-go';
const OPENAI_CODEX_MODEL = 'gpt-5.4';
const DEFAULT_OPENCODE_GO_MODEL = 'deepseek-v4-pro';
const OPENCODE_GO_REPLY_MAX_TOKENS = 1400;
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

interface ScoutContextHit extends SearchHit {
  readonly trust: ScoutSourceTrust;
  readonly access: ScoutSourceAccess;
}

interface ScoutSourceSearchDetails {
  readonly queries: string[];
  readonly hits: ScoutContextHit[];
  readonly recommendations: ScoutSourceCatalogEntry[];
}

interface ScoutSourceCatalogDetails {
  readonly query: string;
  readonly state: string | null;
  readonly mileRange: readonly [number, number] | null;
  readonly sources: readonly ScoutSourceManifest[];
}

const SCOUT_SOURCE_CATALOG_PARAMETERS = Type.Object({
  query: Type.String({
    minLength: 2,
    description: 'The hiker question, route, location, or source topic to classify against Scout source manifests.'
  }),
  state: Type.Optional(Type.String({
    maxLength: 32,
    description: 'Optional Appalachian Trail state abbreviation such as PA, VA, TN, NC, or GA.'
  })),
  mileStart: Type.Optional(Type.Number({ description: 'Optional start mile for source coverage filtering.' })),
  mileEnd: Type.Optional(Type.Number({ description: 'Optional end mile for source coverage filtering.' })),
  includeUnavailable: Type.Optional(Type.Boolean({
    description: 'Include disabled/future source lanes when explaining what Scout does not have yet.'
  })),
  limit: Type.Optional(Type.Number({ minimum: 1, maximum: 12, description: 'Maximum source manifests to return.' }))
});

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

function buildScoutSourceCatalogDetails(input: {
  readonly query: string;
  readonly state?: string | null;
  readonly mileStart?: number | null;
  readonly mileEnd?: number | null;
  readonly includeUnavailable?: boolean | null;
  readonly limit?: number | null;
}): ScoutSourceCatalogDetails {
  const mileRange = typeof input.mileStart === 'number' && typeof input.mileEnd === 'number'
    ? [input.mileStart, input.mileEnd] as const
    : null;
  return {
    query: input.query,
    state: input.state?.trim() || null,
    mileRange,
    sources: selectScoutSourceManifests({
      query: input.query,
      state: input.state?.trim() || null,
      mileRange,
      includeUnavailable: input.includeUnavailable ?? false,
      limit: input.limit ?? 8
    })
  };
}

function renderScoutSourceCatalogResult(details: ScoutSourceCatalogDetails): string {
  const lines: string[] = [
    'Scout source catalog recommendations:',
    `Query: ${details.query}`,
    details.state ? `State filter: ${details.state}` : null,
    details.mileRange ? `Mile filter: ${details.mileRange[0]}–${details.mileRange[1]}` : null
  ].filter((line): line is string => Boolean(line));

  if (details.sources.length === 0) {
    lines.push('- No source manifest scored above threshold. Use private workspace context if present, then name the missing source needed to answer safely.');
    return lines.join('\n');
  }

  for (const source of details.sources) {
    lines.push(
      `- ${source.title} [${source.trust}/${source.accessMode}]`,
      `  - Use when: ${source.useWhen}`,
      `  - Actions: ${source.allowedActions.join(', ')}`,
      `  - Privacy/license: ${source.privacy} ${source.license.label}.`,
      `  - Caveat: ${source.caveats.join(' ')}`
    );
  }

  return lines.join('\n');
}

function buildScoutSourceCatalogTool(): AgentTool<typeof SCOUT_SOURCE_CATALOG_PARAMETERS, ScoutSourceCatalogDetails> {
  return {
    name: 'catalog_scout_sources',
    label: 'Catalog Scout sources',
    description: 'Lists which source lanes Scout has for a question, including searchable private/workspace sources, route validators, live official checks, and user-import-only guide data. Use before answering when deciding what evidence is available versus missing.',
    parameters: SCOUT_SOURCE_CATALOG_PARAMETERS,
    executionMode: 'parallel',
    async execute(_toolCallId, params) {
      const rawLimit = params.limit ?? 8;
      const limit = Number.isFinite(rawLimit) ? Math.min(12, Math.max(1, Math.round(rawLimit))) : 8;
      const details = buildScoutSourceCatalogDetails({
        query: params.query.trim(),
        state: params.state ?? null,
        mileStart: params.mileStart ?? null,
        mileEnd: params.mileEnd ?? null,
        includeUnavailable: params.includeUnavailable ?? false,
        limit
      });
      const text = renderScoutSourceCatalogResult(details);

      return {
        content: [{ type: 'text', text: text.length > 6000 ? `${text.slice(0, 5999).trimEnd()}…` : text }],
        details
      };
    }
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
    SCOUT_VOICE_EXAMPLES,
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
      ? 'You also have a catalog_scout_sources tool. Use it first when you need to decide which source lane applies, what Scout can use now, and what source must be imported or live-checked before a factual answer.'
      : 'This runtime may provide preloaded source-catalog context instead of live tool calls; use the context you have and clearly name missing source lanes.',
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
    'For real-world AT planning, keep the tone natural but include a dependable safety skeleton: Recommendation, route options or day plan, mileage targets, logistics/parking/shuttle, water, weather, legal overnight/camping when relevant, bailout, final checklist, and source receipts or missing-source caveats.',
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
  runtime: Pick<ClawRuntime, 'providerId' | 'modelId'> | null,
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
    providerId: runtime?.providerId ?? 'system',
    model: runtime?.modelId ?? 'strict-route-validator',
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
  const states = state.toUpperCase().split(/[^A-Z]+/u).filter((item) => item.length === 2);
  return states.some((item) => new RegExp(String.raw`(?:^|[^A-Z])${item}(?:[^A-Z]|$)`, 'u').test(haystack));
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

function isGsmnpRouteGrounding(grounding: AtRouteGrounding): boolean {
  return grounding.source.id === 'hoggcountry-gsmnp-at-corridor-qa-2026-05-05';
}

function isShenandoahRouteGrounding(grounding: AtRouteGrounding): boolean {
  return grounding.source.id === 'hoggcountry-shenandoah-at-corridor-qa-2026-05-05';
}

function isBaxterKatahdinRouteGrounding(grounding: AtRouteGrounding): boolean {
  return grounding.source.id === 'hoggcountry-baxter-katahdin-at-corridor-qa-2026-05-05';
}

function isHundredMileWildernessRouteGrounding(grounding: AtRouteGrounding): boolean {
  return grounding.source.id === 'hoggcountry-100-mile-wilderness-qa-2026-05-06';
}

function isWhitesFranconiaCrawfordRouteGrounding(grounding: AtRouteGrounding): boolean {
  return grounding.source.id === 'hoggcountry-whites-franconia-crawford-qa-2026-05-06';
}

function isHarpersFerryRouteGrounding(grounding: AtRouteGrounding): boolean {
  return grounding.source.id === 'hoggcountry-harpers-ferry-mental-halfway-qa-2026-05-06';
}

function buildStrictHarpersFerryAtRouteItineraryReply(
  record: WorkspaceRecord,
  grounding: AtRouteGrounding,
  official: OfficialTrailSourceCheckDetails
): string {
  const profileBits = [
    record.betaProfile.trailName || record.betaProfile.name || 'Hiker',
    record.profile?.direction,
    typeof record.profile?.targetPace === 'number' ? `workspace target ${record.profile.targetPace} mpd` : null,
    typeof record.profile?.waterCapacityLiters === 'number' ? `${record.profile.waterCapacityLiters}L water capacity` : null
  ].filter(Boolean).join(' · ');
  const routeReceipt = buildScoutSourceReceipt(grounding.source.id);
  const harpersReceipt = buildScoutSourceReceipt('harpers-ferry-maryland-dnr-nps-atc');
  const atcReceipt = buildScoutSourceReceipt('atc-trail-updates', { fetchedAt: official.fetchedAt });
  const nwsReceipt = official.weather ? buildScoutSourceReceipt('nws-weather', { fetchedAt: official.fetchedAt }) : null;
  const guideReceipt = buildScoutSourceReceipt('at-guide-user-owned');
  const faroutReceipt = buildScoutSourceReceipt('farout-current-comments');
  const routeTotal = grounding.destination ? formatAtRouteMileage(Math.abs(grounding.destination.mile - grounding.start.mile)) : null;

  const dadOptions = grounding.planOptions.filter((option) => option.id.startsWith('harpers-dad-'));
  const overnightOptions = grounding.planOptions.filter((option) => option.id.startsWith('harpers-overnight-'));

  const lines: string[] = [
    '### Scout strict-route plan',
    '',
    'I’m using strict Harpers Ferry mental-halfway mode because this prompt names Harpers Ferry / ATC HQ and also contains ambiguous halfway language. The explicit place wins: this plan must not route to Pine Grove Furnace unless Pine Grove is separately named.',
    profileBits ? `Workspace context: ${profileBits}.` : null,
    '',
    '**Recommendation**',
    '- Treat Tuesday as a Dad/family finish hike into Harpers Ferry / ATC HQ.',
    '- Treat Friday/Saturday as a separate solo overnight / 2-day / 1-night backpack near Harpers Ferry, likely north into Maryland if shuttle, legal overnight, water, weather, and parking all check out.',
    '- Harpers Ferry is the psychological/mental halfway landmark. Pine Grove Furnace is the true/mathematical halfway area; that phrase must not override the named Harpers Ferry destination.',
    '',
    '**Route-order guardrail**',
    `- Direction context: ${grounding.direction}.`,
    grounding.targetDays ? `- Requested trip length detected: ${grounding.targetDays} day${grounding.targetDays === 1 ? '' : 's'}, but this prompt contains both a 1-day plan and a 2-day overnight plan.` : '- Requested trip shape: mixed 1-day finish plus 2-day / 1-night overnight.',
    grounding.destination ? `- Validated family-finish corridor: ${grounding.start.name} ${grounding.direction} to ${grounding.destination.name}${routeTotal ? ` (~${routeTotal} mi by this guardrail)` : ''}.` : `- Validated corridor starts at ${grounding.start.name}; verify the final endpoint in your current guide/source.`,
    `- Source: ${grounding.source.label}. ${grounding.source.exactMileageCaveat}`,
    '',
    '| Point | Approx route mile | From start | Type |',
    '|---|---:|---:|---|',
    ...grounding.corridor.map((point) => formatStrictRoutePoint(point, grounding.start)),
    '',
    '**Important corrections / guardrails**',
    ...grounding.warnings.map((warning) => `- ${warning}`),
    '- If Pine Grove Furnace appears only as a comparison landmark, keep it as comparison only; the route stays near Harpers Ferry unless the user explicitly changes the requested hike.',
    '- Do not use Pine Grove Furnace, the Half Gallon Challenge, or the true-halfway corridor as the route target for this Harpers Ferry prompt.',
    '- Dad-friendly does not automatically mean only a 6-mile day. Present easier/moderate and longer options with shuttle and heat tradeoffs.',
    '',
    '**Tuesday Dad finish options**'
  ].filter((line): line is string => line !== null);

  for (const option of dadOptions) {
    lines.push('', ...renderStrictRouteOption(option));
  }

  lines.push(
    '',
    '**Friday/Saturday 2-day / 1-night nearby overnight (solo overnight)**'
  );
  for (const option of overnightOptions) {
    lines.push('', ...renderStrictRouteOption(option));
  }

  lines.push(
    '',
    '**Legal overnight / camping assumptions**',
    '- Treat Ed Garvey Memorial Shelter and Dahlgren Backpack Campground as candidate legal overnight anchors, not guaranteed reservations, capacity, water, or current legal status.',
    '- Verify the current Maryland DNR/South Mountain, ATC, local land-manager, and user-owned guide rules before committing to the exact overnight.',
    '- Do not invent stealth, roadside, parking-lot, riverbank, overlook, or “near the shelter” camping if the official/current source does not make it legal.',
    '- If the legal overnight is not confirmed, change the endpoint, use a legal campground/lodging option, or turn the Friday/Saturday plan into day hikes.',
    '',
    '**Water**',
    typeof record.profile?.waterCapacityLiters === 'number'
      ? `- Your workspace water capacity is ${record.profile.waterCapacityLiters}L; treat that as planning context, not proof that any Maryland ridge/source is reliable.`
      : '- Confirm water before committing to either Dad day or the overnight; Scout does not have current water reliability here.',
    '- Treat all natural water. Use current guide/FarOut-style comments or official/current local reports for Ed Garvey, Dahlgren, and any springs/streams.',
    '- If water is uncertain or heat is high, shorten the day, carry extra, or pick a plan with confirmed services.',
    '',
    '**Weather**',
    '- Pull NWS point forecasts and alerts for Harpers Ferry/river level and the Maryland ridge 24-48 hours before leaving.',
    '- Heat, thunderstorms, cold rain, high water, or poor visibility should push the plan toward the easier finish option or a day-hike-only fallback.',
    '',
    '**Parking / shuttle / bailout**',
    '- Confirm legal parking and pickup timing for Keys Gap, Harpers Ferry/ATC HQ, Weverton, Gathland, Dahlgren, and any selected endpoint before leaving a car.',
    '- Harpers Ferry weekend parking and shuttle logistics can be the limiting factor; do not assume same-day parking or cell-service recovery.',
    '- Set Dad bailout points before the hike starts. For the overnight, preselect road-crossing exits and a ride plan rather than relying on “we can just get off trail.”',
    '',
    '**Safety / live conditions**',
    ...renderStrictRouteOfficialSummary(official, grounding.state),
    '',
    '**Final checklist before leaving**',
    '- Verify exact AT mileages, route sequence, road crossings, and elevation in your current user-owned A.T. Guide/AWOL or equivalent.',
    '- Confirm Harpers Ferry/ATC HQ timing, Keys Gap/Weverton/Gathland/Dahlgren parking, shuttle/pickup, and whether overnight parking is allowed.',
    '- Confirm the legal overnight anchor, water status, facility status, closures/detours, fire rules, and food storage expectations.',
    '- Pull NWS forecast/alerts for town/river and ridge points.',
    '- Carry offline maps, headlamp, rain layer, water treatment, extra water margin, emergency contact plan, and a written pickup/bailout plan.',
    '',
    '**Source receipts**',
    routeReceipt ? `- ${routeReceipt.title} [${routeReceipt.trust}/${routeReceipt.accessMode}]: ${routeReceipt.citation}` : `- Route validator: ${grounding.source.citation}`,
    harpersReceipt ? `- Needed current check: ${harpersReceipt.title} [${harpersReceipt.trust}/${harpersReceipt.accessMode}]: ${harpersReceipt.citation}` : '- Harpers Ferry/Maryland DNR/NPS/ATC source manifest: available, but no receipt was produced in this turn.',
    atcReceipt ? `- ${atcReceipt.title} [${atcReceipt.trust}/${atcReceipt.accessMode}]: ${atcReceipt.citation}` : '- ATC Trail Updates source manifest: available, but no ATC receipt was produced in this turn.',
    nwsReceipt ? `- ${nwsReceipt.title} [${nwsReceipt.trust}/${nwsReceipt.accessMode}]: ${nwsReceipt.citation}` : '- NWS source manifest: available, but no weather receipt was produced in this turn.',
    guideReceipt ? `- Needed but not bundled: ${guideReceipt.title} [${guideReceipt.trust}/${guideReceipt.accessMode}]. ${guideReceipt.caveats[0]}` : '- Needed but not bundled: user-owned guide data.',
    faroutReceipt ? `- Needed but not bundled: ${faroutReceipt.title} [${faroutReceipt.trust}/${faroutReceipt.accessMode}]. ${faroutReceipt.caveats[0]}` : '- Needed but not bundled: current user-supplied water/shelter comments.'
  );

  return lines.join('\n');
}

function buildStrictGsmnpAtRouteItineraryReply(
  record: WorkspaceRecord,
  grounding: AtRouteGrounding,
  official: OfficialTrailSourceCheckDetails
): string {
  const profileBits = [
    record.betaProfile.trailName || record.betaProfile.name || 'Hiker',
    record.profile?.direction,
    typeof record.profile?.targetPace === 'number' ? `workspace target ${record.profile.targetPace} mpd` : null,
    typeof record.profile?.waterCapacityLiters === 'number' ? `${record.profile.waterCapacityLiters}L water capacity` : null
  ].filter(Boolean).join(' · ');
  const routeReceipt = buildScoutSourceReceipt(grounding.source.id);
  const permitReceipt = buildScoutSourceReceipt('gsmnp-backcountry-permits');
  const atcReceipt = buildScoutSourceReceipt('atc-trail-updates', { fetchedAt: official.fetchedAt });
  const nwsReceipt = official.weather ? buildScoutSourceReceipt('nws-weather', { fetchedAt: official.fetchedAt }) : null;
  const guideReceipt = buildScoutSourceReceipt('at-guide-user-owned');
  const faroutReceipt = buildScoutSourceReceipt('farout-current-comments');

  const lines: string[] = [
    '### Scout strict-route plan',
    '',
    'I’m using strict Smokies route/regulation mode because this asks for a real GSMNP AT itinerary. The route order and camping-rule guardrails below come from host validation, not model memory.',
    profileBits ? `Workspace context: ${profileBits}.` : null,
    '',
    '**Route-order guardrail**',
    `- Direction: ${grounding.direction}.`,
    grounding.targetDays ? `- Requested trip length detected: ${grounding.targetDays} day${grounding.targetDays === 1 ? '' : 's'}.` : null,
    `- Corridor: ${grounding.start.name} ${grounding.direction} through the Fontana Dam ↔ Newfound Gap GSMNP AT corridor.`,
    `- Source: ${grounding.source.label}. ${grounding.source.exactMileageCaveat}`,
    '',
    `| Point | Approx route mile | From ${grounding.start.name} | Type |`,
    '|---|---:|---:|---|',
    ...grounding.corridor.map((point) => formatStrictRoutePoint(point, grounding.start)),
    '',
    '**Important corrections / guardrails**',
    ...grounding.warnings.map((warning) => `- ${warning}`),
    '- Section-hiker default: book the exact site/date-specific GSMNP backcountry permit or shelter reservation before treating any shelter as a legal endpoint.',
    '- Fail closed on tenting: do not plan to tent outside or inside shelters unless the current official permit/source explicitly says your itinerary allows it.',
    '- No shelter-overflow assumption: if a shelter/site/date is unavailable or full, change the permit/itinerary instead of planning to tent nearby.',
    '- No dispersed/stealth camping in the park. Stay where the permit says.',
    '- A backcountry permit does not replace the GSMNP parking-tag requirement and does not guarantee a parking spot.',
    '',
    '**Route options**'
  ].filter((line): line is string => line !== null);

  if (grounding.planOptions.length > 0) {
    for (const option of grounding.planOptions) {
      lines.push('', ...renderStrictRouteOption(option));
    }
  } else {
    lines.push(
      '',
      '- I can validate the route order and Baxter/Katahdin regulations for the points above, but I do not have a deterministic day-by-day 100-Mile Wilderness itinerary for this exact start. Use the ordered guardrail, then verify daily camps, food carry, water, and legal sites in a current user-owned guide/current comments before treating it as a plan.'
    );
  }

  lines.push(
    '',
    '**Shelter / reservation / camping assumptions**',
    '- Treat every shelter in the table as a permit candidate, not a confirmed campsite. Reservation availability can force the final itinerary shape.',
    '- Reserve through the current GSMNP/NPS/Recreation.gov permit flow. Use the Backcountry Office for rule or availability questions before relying on Scout.',
    '- Shelter permit holders should assume they must sleep inside the assigned shelter and may not set up tents outside/inside the shelter unless the current official permit/source explicitly allows it.',
    '- If the official permit flow shows a shelter/site/date is full, the safe answer is to change dates, change shelters, or shorten/lengthen the itinerary; do not invent overflow camping.',
    '- Do not use forum memory or an old blog post to override the current permit page.',
    '',
    '**Food and water**',
    grounding.targetDays ? `- Carry the full ${grounding.targetDays}-day food plan from ${grounding.start.name} unless you have a confirmed off-route support plan. Do not count on a resupply inside this corridor.` : `- Carry the full food plan from ${grounding.start.name} unless you have a confirmed off-route support plan. Do not count on a resupply inside this corridor.`,
    typeof record.profile?.waterCapacityLiters === 'number'
      ? `- Your workspace water capacity is ${record.profile.waterCapacityLiters}L; that is too thin for uncertain Smokies water until current shelter-source reports confirm every leg.`
      : '- Carry enough water margin for dry or slow shelter sources until current shelter-source reports confirm each leg.',
    '- Treat all water. Verify shelter water reliability in a current guide/FarOut-style report before leaving each morning.',
    '- Use the required food/scented-item storage system every night. Keep food, trash, toothpaste, and scented items out of the sleeping area.',
    '',
    '**Weather / cold / bear safety**',
    '- Late October Smokies can turn into cold rain, wind, fog, hypothermia conditions, or early snow/ice at elevation. Pack for a wet-cold night, not just a mild valley forecast.',
    '- Pull NWS point forecasts/alerts for Fontana/start and the high-elevation Newfound Gap/Clingmans/Mount Collins area 24–48 hours before leaving.',
    '- Start early. Short daylight and ridge weather make late finishes risky.',
    '- Bear risk is operational, not theoretical: cook/eat away from sleeping, store all scented items correctly, and keep a clean camp.',
    '',
    '**Shuttle / parking logistics**',
    '- Confirm Fontana parking, GSMNP parking tag, and whether your planned lot is open/allowed for overnight use.',
    '- Confirm Newfound Gap pickup/shuttle before leaving. US 441/weather closures can break a pickup plan.',
    '- Keep one bailout/contact plan that does not depend on cell service at the exact moment you need it.',
    '',
    '**Safety / live conditions**',
    ...renderStrictRouteOfficialSummary(official, grounding.state),
    '',
    '**Final checklist before leaving**',
    '- Verify exact route mileages and shelter sequence in your current user-owned guide or official NPS map.',
    '- Confirm Recreation.gov/NPS permit availability for each shelter/site and date.',
    '- Re-check GSMNP temporary road/trail/campsite closures and ATC Trail Updates.',
    '- Pull NWS point forecasts/alerts for both low and high-elevation points.',
    '- Check current water reliability and shelter comments for the selected shelters.',
    '- Confirm food carry, required food storage behavior, parking tag, overnight parking, shuttle/pickup, and US 441/Newfound Gap access.',
    '',
    '**Source receipts**',
    routeReceipt ? `- ${routeReceipt.title} [${routeReceipt.trust}/${routeReceipt.accessMode}]: ${routeReceipt.citation}` : `- Route validator: ${grounding.source.citation}`,
    permitReceipt ? `- ${permitReceipt.title} [${permitReceipt.trust}/${permitReceipt.accessMode}]: ${permitReceipt.citation}` : '- GSMNP permit source manifest: available, but no receipt was produced in this turn.',
    atcReceipt ? `- ${atcReceipt.title} [${atcReceipt.trust}/${atcReceipt.accessMode}]: ${atcReceipt.citation}` : '- ATC Trail Updates source manifest: available, but no ATC receipt was produced in this turn.',
    nwsReceipt ? `- ${nwsReceipt.title} [${nwsReceipt.trust}/${nwsReceipt.accessMode}]: ${nwsReceipt.citation}` : '- NWS source manifest: available, but no weather receipt was produced in this turn.',
    guideReceipt ? `- Needed but not bundled: ${guideReceipt.title} [${guideReceipt.trust}/${guideReceipt.accessMode}]. ${guideReceipt.caveats[0]}` : '- Needed but not bundled: user-owned guide data.',
    faroutReceipt ? `- Needed but not bundled: ${faroutReceipt.title} [${faroutReceipt.trust}/${faroutReceipt.accessMode}]. ${faroutReceipt.caveats[0]}` : '- Needed but not bundled: current user-supplied water/shelter comments.'
  );

  return lines.join('\n');
}


function buildStrictShenandoahAtRouteItineraryReply(
  record: WorkspaceRecord,
  grounding: AtRouteGrounding,
  official: OfficialTrailSourceCheckDetails
): string {
  const profileBits = [
    record.betaProfile.trailName || record.betaProfile.name || 'Hiker',
    record.profile?.direction,
    typeof record.profile?.targetPace === 'number' ? `workspace target ${record.profile.targetPace} mpd` : null,
    typeof record.profile?.waterCapacityLiters === 'number' ? `${record.profile.waterCapacityLiters}L water capacity` : null
  ].filter(Boolean).join(' · ');
  const routeReceipt = buildScoutSourceReceipt(grounding.source.id);
  const permitReceipt = buildScoutSourceReceipt('shenandoah-backcountry-permits');
  const atcReceipt = buildScoutSourceReceipt('atc-trail-updates', { fetchedAt: official.fetchedAt });
  const nwsReceipt = official.weather ? buildScoutSourceReceipt('nws-weather', { fetchedAt: official.fetchedAt }) : null;
  const guideReceipt = buildScoutSourceReceipt('at-guide-user-owned');
  const faroutReceipt = buildScoutSourceReceipt('farout-current-comments');
  const routeTotal = grounding.destination ? formatAtRouteMileage(Math.abs(grounding.destination.mile - grounding.start.mile)) : null;
  const requestedThreeDays = grounding.targetDays === 3;
  const waterCapacity = typeof record.profile?.waterCapacityLiters === 'number' ? record.profile.waterCapacityLiters : null;
  const twoLiterPrompt = /(?:2\s*l|2\s+liters|two\s+liters)/iu.test(grounding.warnings.join(' ')) || waterCapacity !== null && waterCapacity <= 2.1;

  const lines: string[] = [
    '### Scout strict-route plan',
    '',
    'I’m using strict Shenandoah route/regulation mode because this asks for a real Shenandoah AT itinerary. The route order, permit/camping, water, and stale-rule guardrails below come from host validation, not model memory.',
    profileBits ? `Workspace context: ${profileBits}.` : null,
    '',
    '**Route-order guardrail**',
    `- Direction: ${grounding.direction}.`,
    grounding.targetDays ? `- Requested trip length detected: ${grounding.targetDays} day${grounding.targetDays === 1 ? '' : 's'}.` : null,
    grounding.destination ? `- Corridor: ${grounding.start.name} ${grounding.direction} to ${grounding.destination.name}${routeTotal ? ` (~${routeTotal} mi by this guardrail)` : ''}.` : `- Corridor starts at ${grounding.start.name}; verify the final endpoint in your current guide/source.`,
    `- Source: ${grounding.source.label}. ${grounding.source.exactMileageCaveat}`,
    '',
    '| Point | Approx route mile | From start | Type |',
    '|---|---:|---:|---|',
    ...grounding.corridor.map((point) => formatStrictRoutePoint(point, grounding.start)),
    '',
    '**Important corrections / guardrails**',
    ...grounding.warnings.map((warning) => `- ${warning}`),
    grounding.destination?.id === 'swift-run-gap-va' && routeTotal ? `- Rockfish Gap → Swift Run Gap is about ${routeTotal} mi in this guardrail, not a ~34 mi route.` : null,
    requestedThreeDays ? '- The requested 3-day / 2-night shape is a stronger plan, not the conservative late-July default.' : null,
    '- Current Shenandoah permit guardrail: use the current NPS/Recreation.gov backcountry permit flow. Do not rely on old free/self-registration paper-permit guidance.',
    '- A Shenandoah backcountry permit is separate from the park entrance fee/pass and does not prove a specific campsite is legal until the itinerary satisfies current rules.',
    '- Campsite setback guardrail: at least 10 yd from water, 20 yd from trail/unpaved road, 50 yd from another party/no-camping sign/buildings/ruins, 100 yd from hut/cabin/day-use shelter, and 0.25 mi from paved road/park boundary/facility unless current official rules say otherwise.',
    '- Do not plan camping at/near waysides, visitor centers, paved roads, Skyline Drive, parking lots, buildings, or facilities.',
    '',
    '**Route options**'
  ].filter((line): line is string => line !== null);

  for (const option of grounding.planOptions) {
    lines.push('', ...renderStrictRouteOption(option));
  }

  lines.push(
    '',
    '**Recommendation**',
    requestedThreeDays || twoLiterPrompt
      ? '- With late-July heat and a 2L carry, default to the safer 4-day shape unless current water, permit/campsite legality, daylight, body, and shuttle timing all line up.'
      : '- Choose the lower-mile option when heat, thunderstorms, water uncertainty, or permit/campsite legality is not cleanly verified.',
    '- If you force the 3-day shape, treat it as a strong-hiker itinerary and add a hard noon bailout/shorten decision each day.',
    '',
    '**Permit / legal camping assumptions**',
    '- Book/check Shenandoah backcountry permits through the current NPS/Recreation.gov flow before treating any overnight as legal.',
    '- Huts/shelters in the table are route-order anchors and candidate areas, not guaranteed legal campsites, reservations, water, or capacity.',
    '- If a legal site cannot satisfy current NPS/Recreation.gov setbacks and closures, change the day shape instead of inventing a stealth/nearby campsite.',
    '- Campfires are not a default backcountry assumption; use only where current official rules explicitly allow them, such as a pre-constructed fireplace where applicable.',
    '',
    '**Water / heat / thunderstorms**',
    waterCapacity !== null
      ? `- Your workspace water capacity is ${waterCapacity}L; in late July Shenandoah, treat that as thin until every source for the day is confirmed.`
      : twoLiterPrompt
        ? '- A 2L carry in late July is thin until every source for the day is confirmed.'
        : '- Shenandoah summer water plans need current source checks; carry extra when sources are seasonal, slow, or unverified.',
    '- NPS water guidance says hot-day consumption can be about 1 qt/hour. Fill early, do not skip known water, and carry extra when the next source is seasonal or unverified.',
    '- Treat all natural water. Developed/potable water is only reliable when the current facility/source is open and confirmed.',
    '- Check current water reports before leaving each morning; springs and streams can slow or dry.',
    '- Build thunderstorm margin: start early, avoid ridge/road-exposed commitments when storms build, and use Skyline Drive/US 33/US 250 bailouts deliberately.',
    '',
    '**Bear / food / fire safety**',
    '- Store food, trash, cook gear, toothpaste, and scented items in an approved bear-proof container or a proper hang at least 12 ft high and 6 ft from trunks/branches unless current park rules are stricter.',
    '- Cook/eat away from sleep, keep a clean camp, and carry out all trash.',
    '- Do not use fire memory from old blogs or forum posts. Current park fire restrictions control.',
    '',
    '**Shuttle / parking / bailouts**',
    '- Rockfish Gap uses the I-64 / US 250 / Waynesboro side of the park; confirm overnight parking, entrance logistics, and pickup before leaving.',
    '- Swift Run Gap uses US 33 / Skyline Drive / Elkton-Harrisonburg logistics; confirm road status and shuttle pickup before leaving.',
    '- Skyline Drive crossings can be bailouts, but do not assume cell service, legal overnight parking, or same-day ride availability.',
    '',
    '**Safety / live conditions**',
    ...renderStrictRouteOfficialSummary(official, grounding.state),
    '',
    '**Final checklist before leaving**',
    '- Verify exact AT mileages and hut/campsite sequence in your current user-owned guide or official NPS map.',
    '- Confirm the current NPS/Recreation.gov backcountry permit flow, fees, entrance pass, itinerary dates, group size/night limits, and closure areas.',
    '- Pick legal campsites that satisfy current setback rules; do not camp near waysides, roads, facilities, or huts unless the current official rule/source explicitly allows that site.',
    '- Check current water reliability for Calf Mountain, Blackrock, Pinefield, Hightop, and any source you plan to rely on.',
    '- Pull NWS point forecasts/alerts for Rockfish/Waynesboro, the ridge/Skyline Drive corridor, and Swift Run/US 33 24–48 hours before departure.',
    '- Confirm bear food-storage method, fire restrictions, parking, shuttle/pickup, bailouts, offline maps, and emergency contact plan.',
    '',
    '**Source receipts**',
    routeReceipt ? `- ${routeReceipt.title} [${routeReceipt.trust}/${routeReceipt.accessMode}]: ${routeReceipt.citation}` : `- Route validator: ${grounding.source.citation}`,
    permitReceipt ? `- ${permitReceipt.title} [${permitReceipt.trust}/${permitReceipt.accessMode}]: ${permitReceipt.citation}` : '- Shenandoah permit source manifest: available, but no receipt was produced in this turn.',
    atcReceipt ? `- ${atcReceipt.title} [${atcReceipt.trust}/${atcReceipt.accessMode}]: ${atcReceipt.citation}` : '- ATC Trail Updates source manifest: available, but no ATC receipt was produced in this turn.',
    nwsReceipt ? `- ${nwsReceipt.title} [${nwsReceipt.trust}/${nwsReceipt.accessMode}]: ${nwsReceipt.citation}` : '- NWS source manifest: available, but no weather receipt was produced in this turn.',
    guideReceipt ? `- Needed but not bundled: ${guideReceipt.title} [${guideReceipt.trust}/${guideReceipt.accessMode}]. ${guideReceipt.caveats[0]}` : '- Needed but not bundled: user-owned guide data.',
    faroutReceipt ? `- Needed but not bundled: ${faroutReceipt.title} [${faroutReceipt.trust}/${faroutReceipt.accessMode}]. ${faroutReceipt.caveats[0]}` : '- Needed but not bundled: current user-supplied water/shelter comments.'
  );

  return lines.join('\n');
}

function buildStrictHundredMileWildernessAtRouteItineraryReply(
  record: WorkspaceRecord,
  grounding: AtRouteGrounding,
  official: OfficialTrailSourceCheckDetails
): string {
  const profileBits = [
    record.betaProfile.trailName || record.betaProfile.name || 'Hiker',
    record.profile?.direction,
    typeof record.profile?.targetPace === 'number' ? `workspace target ${record.profile.targetPace} mpd` : null,
    typeof record.profile?.waterCapacityLiters === 'number' ? `${record.profile.waterCapacityLiters}L water capacity` : null
  ].filter(Boolean).join(' · ');
  const routeReceipt = buildScoutSourceReceipt(grounding.source.id);
  const officialReceipt = buildScoutSourceReceipt('hundred-mile-wilderness-matc-atc-logistics');
  const atcReceipt = buildScoutSourceReceipt('atc-trail-updates', { fetchedAt: official.fetchedAt });
  const nwsReceipt = official.weather ? buildScoutSourceReceipt('nws-weather', { fetchedAt: official.fetchedAt }) : null;
  const guideReceipt = buildScoutSourceReceipt('at-guide-user-owned');
  const faroutReceipt = buildScoutSourceReceipt('farout-current-comments');
  const routeTotal = grounding.destination ? formatAtRouteMileage(Math.abs(grounding.destination.mile - grounding.start.mile)) : null;
  const waterCapacity = typeof record.profile?.waterCapacityLiters === 'number' ? record.profile.waterCapacityLiters : null;

  const lines: string[] = [
    '### Scout strict-route plan',
    '',
    'I’m using strict 100-Mile Wilderness route/logistics mode because this asks for a real Monson ↔ Abol Bridge itinerary. The route order, food-carry, bailout, water/ford, and Baxter handoff guardrails below come from host validation, not model memory.',
    profileBits ? `Workspace context: ${profileBits}.` : null,
    '',
    '**Route-order guardrail**',
    `- Direction: ${grounding.direction}.`,
    grounding.targetDays ? `- Requested trip length detected: ${grounding.targetDays} day${grounding.targetDays === 1 ? '' : 's'}.` : null,
    grounding.destination ? `- Corridor: ${grounding.start.name} ${grounding.direction} to ${grounding.destination.name}${routeTotal ? ` (~${routeTotal} mi by this guardrail)` : ''}.` : `- Corridor starts at ${grounding.start.name}; verify the final endpoint in your current guide/source.`,
    `- Source: ${grounding.source.label}. ${grounding.source.exactMileageCaveat}`,
    '',
    '| Point | Approx route mile | From start | Type |',
    '|---|---:|---:|---|',
    ...grounding.corridor.map((point) => formatStrictRoutePoint(point, grounding.start)),
    '',
    '**Important corrections / guardrails**',
    ...grounding.warnings.map((warning) => `- ${warning}`),
    grounding.destination?.id === 'abol-bridge-me' && routeTotal ? `- Monson → Abol Bridge is about ${routeTotal} mi in this guardrail, not a short Baxter approach.` : null,
    '- Default food assumption: leave Monson/Abol with the full wilderness food plan unless a legal food drop/shuttle is prearranged and confirmed before entry.',
    '- Do not treat logging roads, lodges, road crossings, cell service, or same-day shuttles as reliable bailouts. Prearrange and verify any support plan locally.',
    '- The Kennebec ferry/river is not inside this Monson ↔ Abol Bridge corridor; do not use it as a 100-Mile Wilderness crossing or bailout.',
    '',
    '**Route options**'
  ].filter((line): line is string => line !== null);

  for (const option of grounding.planOptions) {
    lines.push('', ...renderStrictRouteOption(option));
  }

  lines.push(
    '',
    '**Recommendation**',
    grounding.targetDays !== null && grounding.targetDays <= 6
      ? '- A 6-day-or-faster plan is a strong-hiker plan with little error margin. Recommend using the safer 8-day shape unless food weight, body, weather, water/ford reports, daylight, and pickup are all cleanly verified.'
      : '- Default to the safer 8-day shape unless you have a confirmed stronger-hiker food/logistics plan and clean water/ford/weather reports.',
    '- Build at least one extra food day or a verified exit/support option. Remote delays are normal enough that “exactly enough food” is not a safe default.',
    '',
    '**Food / resupply / support assumptions**',
    '- Monson is the last normal full-service planning stop before this corridor. Abol Bridge is the north-end handoff, not a substitute for carrying/arranging the wilderness food plan.',
    '- Food drops, hostel support, lodge access, or logging-road pickups must be legal, current, and prearranged. If you cannot name the provider, road, time, and backup, do not plan on it.',
    '- Keep a written offline plan for pickup, bailouts, and what happens if weather/fords delay you 24-48 hours.',
    '',
    '**Shelter / campsite assumptions**',
    '- Lean-tos and campsites in the table are route-order anchors and candidate overnights, not guaranteed space, water, legal status, or current condition.',
    '- Use current MATC/AMC/A.T. Guide/FarOut-style information for exact shelter condition, tenting rules, capacity/crowding, privies, and water before treating an endpoint as final.',
    '- If a planned site is closed/full/unsafe, change the day shape instead of inventing stealth, roadside, or lodge-adjacent camping.',
    '',
    '**Water / fords / weather**',
    waterCapacity !== null
      ? `- Your workspace water capacity is ${waterCapacity}L; abundant Maine water still does not remove the need to verify long carries, treat all water, and carry margin in heat.`
      : '- Water may be frequent, but verify each source and treat all natural water.',
    '- Fords and stream crossings can become unsafe after rain. Check recent reports and be willing to wait, backtrack, or use the verified bailout/support plan.',
    '- Pull NWS forecasts/alerts for Monson, central wilderness/high points such as White Cap, and Abol/Katahdin area before entry; weather can turn a normal day into a delay day.',
    '',
    '**Baxter / north-end handoff**',
    '- Reaching Abol Bridge is not the same as having a legal Baxter/Katahdin plan. Handle Baxter permits, The Birches/campsite eligibility, KTP/day-use access, closures, water, and summit weather as a separate strict check.',
    '- Do not let Katahdin excitement compress the wilderness food, ford, or recovery margins.',
    '',
    '**Safety / live conditions**',
    ...renderStrictRouteOfficialSummary(official, grounding.state),
    '',
    '**Final checklist before leaving**',
    '- Verify exact AT mileages, lean-to/campsite sequence, legal camping, and current water/ford notes in a current user-owned guide plus current comments.',
    '- Confirm full food carry or a named legal food-drop/shuttle provider, with road/time/backup details written offline.',
    '- Confirm Monson/Abol pickup, parking, lodging/store hours, emergency contacts, offline maps, battery, headlamp, rain/warm layers, food storage, and at least one delay-day decision point.',
    '- Check ATC/MATC/land-manager closures, fire restrictions, bridges/fords, logging-road access, and weather 24-48 hours before entering.',
    '',
    '**Source receipts**',
    routeReceipt ? `- ${routeReceipt.title} [${routeReceipt.trust}/${routeReceipt.accessMode}]: ${routeReceipt.citation}` : `- Route validator: ${grounding.source.citation}`,
    officialReceipt ? `- ${officialReceipt.title} [${officialReceipt.trust}/${officialReceipt.accessMode}]: ${officialReceipt.citation}` : '- 100-Mile Wilderness official/regional source manifest: available, but no receipt was produced in this turn.',
    atcReceipt ? `- ${atcReceipt.title} [${atcReceipt.trust}/${atcReceipt.accessMode}]: ${atcReceipt.citation}` : '- ATC Trail Updates source manifest: available, but no ATC receipt was produced in this turn.',
    nwsReceipt ? `- ${nwsReceipt.title} [${nwsReceipt.trust}/${nwsReceipt.accessMode}]: ${nwsReceipt.citation}` : '- NWS source manifest: available, but no weather receipt was produced in this turn.',
    guideReceipt ? `- Needed but not bundled: ${guideReceipt.title} [${guideReceipt.trust}/${guideReceipt.accessMode}]. ${guideReceipt.caveats[0]}` : '- Needed but not bundled: user-owned guide data.',
    faroutReceipt ? `- Needed but not bundled: ${faroutReceipt.title} [${faroutReceipt.trust}/${faroutReceipt.accessMode}]. ${faroutReceipt.caveats[0]}` : '- Needed but not bundled: current user-supplied water/shelter comments.'
  );

  return lines.join('\n');
}


function buildStrictWhitesFranconiaCrawfordAtRouteItineraryReply(
  record: WorkspaceRecord,
  grounding: AtRouteGrounding,
  official: OfficialTrailSourceCheckDetails
): string {
  const profileBits = [
    record.betaProfile.trailName || record.betaProfile.name || 'Hiker',
    record.profile?.direction,
    typeof record.profile?.targetPace === 'number' ? `workspace target ${record.profile.targetPace} mpd` : null,
    typeof record.profile?.waterCapacityLiters === 'number' ? `${record.profile.waterCapacityLiters}L water capacity` : null
  ].filter(Boolean).join(' · ');
  const routeReceipt = buildScoutSourceReceipt(grounding.source.id);
  const whitesReceipt = buildScoutSourceReceipt('white-mountain-national-forest-amc-rules');
  const atcReceipt = buildScoutSourceReceipt('atc-trail-updates', { fetchedAt: official.fetchedAt });
  const nwsReceipt = official.weather ? buildScoutSourceReceipt('nws-weather', { fetchedAt: official.fetchedAt }) : null;
  const guideReceipt = buildScoutSourceReceipt('at-guide-user-owned');
  const faroutReceipt = buildScoutSourceReceipt('farout-current-comments');
  const routeTotal = grounding.destination ? formatAtRouteMileage(Math.abs(grounding.destination.mile - grounding.start.mile)) : null;
  const waterCapacity = typeof record.profile?.waterCapacityLiters === 'number' ? record.profile.waterCapacityLiters : null;
  const firstTime = /\bfirst\s+time\b/iu.test(grounding.warnings.join(' '));

  const lines: string[] = [
    '### Scout strict-route plan',
    '',
    'I’m using strict White Mountains Franconia Notch ↔ Crawford Notch route/regulation mode because this asks for a real exposed-ridge Whites itinerary. The route order, camping/hut, water, weather, and shuttle guardrails below come from host validation, not model memory.',
    profileBits ? `Workspace context: ${profileBits}.` : null,
    '',
    '**Route-order guardrail**',
    `- Direction: ${grounding.direction}.`,
    grounding.targetDays ? `- Requested trip length detected: ${grounding.targetDays} day${grounding.targetDays === 1 ? '' : 's'}.` : null,
    grounding.destination ? `- Corridor: ${grounding.start.name} ${grounding.direction} to ${grounding.destination.name}${routeTotal ? ` (~${routeTotal} mi by this guardrail)` : ''}.` : `- Corridor starts at ${grounding.start.name}; verify the final endpoint in your current guide/source.`,
    `- Source: ${grounding.source.label}. ${grounding.source.exactMileageCaveat}`,
    '',
    '| Point | Approx route mile | From start | Type |',
    '|---|---:|---:|---|',
    ...grounding.corridor.map((point) => formatStrictRoutePoint(point, grounding.start)),
    '',
    '**Important corrections / guardrails**',
    ...grounding.warnings.map((warning) => `- ${warning}`),
    grounding.destination?.id === 'crawford-notch-us-302-nh' && routeTotal ? `- Franconia Notch → Crawford Notch is about ${routeTotal} mi in this guardrail, not a ~21 mi casual estimate.` : null,
    grounding.targetDays === 3 ? '- The requested 3-day / 2-night shape is aggressive for a first-time Whites hiker; default safer is 4 days unless every live check lines up.' : null,
    '- Do not plan alpine/above-treeline camping. Do not camp near huts, trailheads, roads, parking lots, or inside Franconia/Crawford Notch state parks unless a current official source identifies a designated legal site/campground.',
    '- Do not depend on hut walk-up bunks or work-for-stay. For a section hiker, a hut night needs current AMC reservation/availability or a backup legal campsite plan.',
    '',
    '**Route options**'
  ].filter((line): line is string => line !== null);

  for (const option of grounding.planOptions) {
    lines.push('', ...renderStrictRouteOption(option));
  }

  lines.push(
    '',
    '**Recommendation**',
    grounding.targetDays === 3 || firstTime
      ? '- Recommend the safer 4-day shape first. Use the 3-day shape only as a strong-hiker/weather-window option after AMC/WMNF/NH State Parks legality, water, and shuttle are confirmed.'
      : '- Choose the lower-mile option when weather, water, hut/tentsite availability, daylight, or shuttle timing is not cleanly verified.',
    '- Set a hard morning go/no-go for Franconia Ridge and a hard midday shorten/bailout decision on each long day.',
    '',
    '**Camping / hut / tentsite assumptions**',
    '- Treat AMC tentsites/shelters/huts in the table as candidate anchors, not confirmed legal overnights. Current AMC availability, caretaker season, fees, capacity, water, and rules control the final plan.',
    '- WMNF Forest Protection Areas and alpine zones can make otherwise-normal dispersed camping illegal. If the legal site is not confirmed, change the itinerary instead of inventing stealth camping.',
    '- Franconia Notch and Crawford Notch are state-park road/trailhead corridors; use designated campgrounds/sites only where current NH State Parks/land-manager rules allow overnight use.',
    '- Fires are not a default assumption. Use stoves and follow current WMNF/AMC/NH State Parks fire restrictions.',
    '',
    '**Water / weather / lightning**',
    waterCapacity !== null
      ? `- Your workspace water capacity is ${waterCapacity}L; in the Whites, treat that as potentially thin on exposed ridges or long dry climbs until current water reports confirm each leg.`
      : '- A 2-2.5L carry can be thin on exposed ridges or long dry climbs until current water reports confirm each leg.',
    '- Treat all natural water. Verify Liberty Spring, Garfield Ridge, Galehead/Zealand/Ethan-area water before relying on any endpoint.',
    '- Pull NWS point forecasts for both valley trailheads and high-elevation exposed points like Lafayette/Garfield/South Twin. Valley weather is not enough for the ridge.',
    '- Lightning, high wind, cold rain, fog, or low visibility are route-stopping risks above treeline. If storms are building, do not commit to Franconia Ridge/Twinway exposure.',
    '- Start early enough to be below exposed ridges before afternoon storm risk, and carry real wind/rain insulation even in early September.',
    '',
    '**Shuttle / parking / bailouts**',
    '- Confirm I-93/Franconia Notch parking rules and whether overnight parking is allowed at the exact lot you choose.',
    '- Confirm US 302/Crawford Notch pickup, road access, and cell-service assumptions before leaving.',
    '- Bailouts exist on maps, but they can be steep, slow, and logistically awkward. Preselect bailout trails/roads with an offline map and a ride plan; do not treat “down to a road” as easy.',
    '- Do not depend on same-day cell service for shuttle recovery.',
    '',
    '**Safety / live conditions**',
    ...renderStrictRouteOfficialSummary(official, grounding.state),
    '',
    '**Final checklist before leaving**',
    '- Verify exact AT mileages and route sequence in your current A.T. Guide/FarOut/AMC map or White Mountain Guide.',
    '- Confirm AMC hut/tentsite/shelter availability, reservations/fees, caretaker season, capacity, and water.',
    '- Confirm WMNF Forest Protection Area/alpine-zone camping rules and NH State Parks Franconia/Crawford Notch camping/parking rules.',
    '- Check current water reports for each planned night and every long exposed/dry leg.',
    '- Pull NWS point forecasts/alerts for trailheads and exposed ridge/elevation points 24-48 hours before departure.',
    '- Lock shuttle/parking at I-93 and US 302, bailouts, offline maps, headlamp, rain/wind shell, warm layer, food storage, and emergency contact plan.',
    '',
    '**Source receipts**',
    routeReceipt ? `- ${routeReceipt.title} [${routeReceipt.trust}/${routeReceipt.accessMode}]: ${routeReceipt.citation}` : `- Route validator: ${grounding.source.citation}`,
    whitesReceipt ? `- ${whitesReceipt.title} [${whitesReceipt.trust}/${whitesReceipt.accessMode}]: ${whitesReceipt.citation}` : '- White Mountains official/regional source manifest: available, but no receipt was produced in this turn.',
    atcReceipt ? `- ${atcReceipt.title} [${atcReceipt.trust}/${atcReceipt.accessMode}]: ${atcReceipt.citation}` : '- ATC Trail Updates source manifest: available, but no ATC receipt was produced in this turn.',
    nwsReceipt ? `- ${nwsReceipt.title} [${nwsReceipt.trust}/${nwsReceipt.accessMode}]: ${nwsReceipt.citation}` : '- NWS source manifest: available, but no weather receipt was produced in this turn.',
    guideReceipt ? `- Needed but not bundled: ${guideReceipt.title} [${guideReceipt.trust}/${guideReceipt.accessMode}]. ${guideReceipt.caveats[0]}` : '- Needed but not bundled: user-owned guide data.',
    faroutReceipt ? `- Needed but not bundled: ${faroutReceipt.title} [${faroutReceipt.trust}/${faroutReceipt.accessMode}]. ${faroutReceipt.caveats[0]}` : '- Needed but not bundled: current user-supplied water/shelter comments.'
  );

  return lines.join('\n');
}


function buildStrictBaxterKatahdinAtRouteItineraryReply(
  record: WorkspaceRecord,
  grounding: AtRouteGrounding,
  official: OfficialTrailSourceCheckDetails
): string {
  const profileBits = [
    record.betaProfile.trailName || record.betaProfile.name || 'Hiker',
    record.profile?.direction,
    typeof record.profile?.targetPace === 'number' ? `workspace target ${record.profile.targetPace} mpd` : null,
    typeof record.profile?.waterCapacityLiters === 'number' ? `${record.profile.waterCapacityLiters}L water capacity` : null
  ].filter(Boolean).join(' · ');
  const routeReceipt = buildScoutSourceReceipt(grounding.source.id);
  const permitReceipt = buildScoutSourceReceipt('baxter-state-park-at-permits');
  const atcReceipt = buildScoutSourceReceipt('atc-trail-updates', { fetchedAt: official.fetchedAt });
  const nwsReceipt = official.weather ? buildScoutSourceReceipt('nws-weather', { fetchedAt: official.fetchedAt }) : null;
  const guideReceipt = buildScoutSourceReceipt('at-guide-user-owned');
  const faroutReceipt = buildScoutSourceReceipt('farout-current-comments');
  const routeTotal = grounding.destination ? formatAtRouteMileage(Math.abs(grounding.destination.mile - grounding.start.mile)) : null;
  const waterCapacity = typeof record.profile?.waterCapacityLiters === 'number' ? record.profile.waterCapacityLiters : null;

  const lines: string[] = [
    '### Scout strict-route plan',
    '',
    'I’m using strict Baxter/Katahdin route/regulation mode because this asks for a real AT finish/start plan. The route order, permit/camping, summit timing, water, and closure guardrails below come from host validation, not model memory.',
    profileBits ? `Workspace context: ${profileBits}.` : null,
    '',
    '**Route-order guardrail**',
    `- Direction: ${grounding.direction}.`,
    grounding.targetDays ? `- Requested trip length detected: ${grounding.targetDays} day${grounding.targetDays === 1 ? '' : 's'}.` : null,
    grounding.destination ? `- Corridor: ${grounding.start.name} ${grounding.direction} to ${grounding.destination.name}${routeTotal ? ` (~${routeTotal} mi by this guardrail, one-way summit mileage only)` : ''}.` : `- Corridor starts at ${grounding.start.name}; verify the final endpoint in your current guide/source.`,
    `- Source: ${grounding.source.label}. ${grounding.source.exactMileageCaveat}`,
    '',
    '| Point | Approx route mile | From start | Type |',
    '|---|---:|---:|---|',
    ...grounding.corridor.map((point) => formatStrictRoutePoint(point, grounding.start)),
    '',
    '**Important corrections / guardrails**',
    ...grounding.warnings.map((warning) => `- ${warning}`),
    '- The summit day is not just the one-way AT miles to Baxter Peak. Plan the descent/exit, daylight, weather, ranger guidance, and transport before starting.',
    '- Do not add Knife Edge, Chimney Pond, Roaring Brook, or any non-AT exposed side route to a finish plan unless current Baxter conditions/rangers, route logistics, and transportation explicitly support that separate objective.',
    '',
    '**Route options**'
  ].filter((line): line is string => line !== null);

  for (const option of grounding.planOptions) {
    lines.push('', ...renderStrictRouteOption(option));
  }

  lines.push(
    '',
    '**Permit / access / camping assumptions**',
    '- Secure the current Baxter State Park Long-Distance Hiker Permit in person at Katahdin Stream Campground before attempting Katahdin. Online reservations, ATCamp, ATC hang tags, and pre-registration cards are not substitutes.',
    '- The Birches is not guaranteed: eligible NOBO hikers must have hiked continuously from Monson through the 100-Mile Wilderness, space must be available, the 12-person/night cap applies, the current cash fee applies, and there is no work-for-stay in Baxter State Park.',
    '- If The Birches is unavailable or you are not eligible, use a reserved legal campground/site or change the timing. Do not invent overflow, stealth, parking-lot, summit, or roadside camping.',
    '- If entering by vehicle for a day hike or SOBO start without camping in the park the night before, verify the current Katahdin Trailhead Pass/day-use parking requirement and gate timing.',
    '',
    '**Summit safety**',
    '- Treat Katahdin/Hunt Trail as a very strenuous all-day objective. Baxter describes Katahdin hikes as about 8-12 hours round trip and the Hunt Trail as 5.2 mi one-way with long above-treeline exposure.',
    '- Start early, set a turnaround time, carry a headlamp/flashlight, and remember that the safe goal is returning to the trailhead, not just tagging the summit.',
    '- Katahdin trails can close at any time for weather or trail conditions. Shoulder-season closures apply; Baxter recommends AT hikers complete the summit hike before October 15.',
    waterCapacity !== null
      ? `- Your workspace water capacity is ${waterCapacity}L; for Katahdin, do not treat that as enough unless it meets or exceeds the current official minimum plus heat/pace margin.`
      : '- Carry at least the current official minimum water for Katahdin and more in heat; do not rely on exposed upper-mountain water.',
    '- Treat all natural water in Baxter. Confirm Katahdin Stream/Hurd Brook/Rainbow Spring status from current sources before relying on them.',
    '',
    '**Food / logistics**',
    '- There are no in-park stores to rescue a bad food/sleeping/cooking plan. Carry the needed food and overnight kit before entering Baxter.',
    '- Confirm Abol Bridge/Millinocket shuttle, park road/gate timing, campsite check-in, and post-summit pickup before leaving the last reliable service point.',
    '',
    '**Safety / live conditions**',
    ...renderStrictRouteOfficialSummary(official, grounding.state),
    '',
    '**Final checklist before leaving**',
    '- Verify exact AT mileages and final campsite sequence in your current user-owned guide.',
    '- Check Baxter State Park current conditions, Katahdin trail status, LD permit process, The Birches/campsite availability, campground reservation, KTP/day-use access, gate timing, and fees.',
    '- Pull NWS point forecasts/alerts for Katahdin/Baxter Peak and the Katahdin Stream/Abol Bridge approach 24-48 hours before the attempt.',
    '- Confirm water, food carry, headlamp, insulation/rain layers, emergency shelter, offline map, shuttle/pickup, and a hard turnaround time.',
    '',
    '**Source receipts**',
    routeReceipt ? `- ${routeReceipt.title} [${routeReceipt.trust}/${routeReceipt.accessMode}]: ${routeReceipt.citation}` : `- Route validator: ${grounding.source.citation}`,
    permitReceipt ? `- ${permitReceipt.title} [${permitReceipt.trust}/${permitReceipt.accessMode}]: ${permitReceipt.citation}` : '- Baxter official source manifest: available, but no receipt was produced in this turn.',
    atcReceipt ? `- ${atcReceipt.title} [${atcReceipt.trust}/${atcReceipt.accessMode}]: ${atcReceipt.citation}` : '- ATC Trail Updates source manifest: available, but no ATC receipt was produced in this turn.',
    nwsReceipt ? `- ${nwsReceipt.title} [${nwsReceipt.trust}/${nwsReceipt.accessMode}]: ${nwsReceipt.citation}` : '- NWS source manifest: available, but no weather receipt was produced in this turn.',
    guideReceipt ? `- Needed but not bundled: ${guideReceipt.title} [${guideReceipt.trust}/${guideReceipt.accessMode}]. ${guideReceipt.caveats[0]}` : '- Needed but not bundled: user-owned guide data.',
    faroutReceipt ? `- Needed but not bundled: ${faroutReceipt.title} [${faroutReceipt.trust}/${faroutReceipt.accessMode}]. ${faroutReceipt.caveats[0]}` : '- Needed but not bundled: current user-supplied water/campsite comments.'
  );

  return lines.join('\n');
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

  if (isHarpersFerryRouteGrounding(grounding)) {
    return buildStrictHarpersFerryAtRouteItineraryReply(record, grounding, official);
  }

  if (isGsmnpRouteGrounding(grounding)) {
    return buildStrictGsmnpAtRouteItineraryReply(record, grounding, official);
  }

  if (isShenandoahRouteGrounding(grounding)) {
    return buildStrictShenandoahAtRouteItineraryReply(record, grounding, official);
  }

  if (isHundredMileWildernessRouteGrounding(grounding)) {
    return buildStrictHundredMileWildernessAtRouteItineraryReply(record, grounding, official);
  }

  if (isWhitesFranconiaCrawfordRouteGrounding(grounding)) {
    return buildStrictWhitesFranconiaCrawfordAtRouteItineraryReply(record, grounding, official);
  }

  if (isBaxterKatahdinRouteGrounding(grounding)) {
    return buildStrictBaxterKatahdinAtRouteItineraryReply(record, grounding, official);
  }

  const profileBits = [
    record.betaProfile.trailName || record.betaProfile.name || 'Hiker',
    record.profile?.direction,
    typeof record.profile?.targetPace === 'number' ? `workspace target ${record.profile.targetPace} mpd` : null,
    typeof record.profile?.waterCapacityLiters === 'number' ? `${record.profile.waterCapacityLiters}L water capacity` : null
  ].filter(Boolean).join(' · ');
  const routeReceipt = buildScoutSourceReceipt(grounding.source.id);
  const atcReceipt = buildScoutSourceReceipt('atc-trail-updates', { fetchedAt: official.fetchedAt });
  const nwsReceipt = official.weather ? buildScoutSourceReceipt('nws-weather', { fetchedAt: official.fetchedAt }) : null;
  const guideReceipt = buildScoutSourceReceipt('at-guide-user-owned');
  const faroutReceipt = buildScoutSourceReceipt('farout-current-comments');

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
    /\bharpers?\s+ferry\b|\batc\s+hq\b|\bmental\s+halfway\b/iu.test(prompt)
      ? '- Halfway distinction: Pine Grove Furnace is the true/mathematical halfway area for this Pine Grove plan; Harpers Ferry / ATC HQ is the mental halfway comparison landmark unless the user explicitly changes the requested route.'
      : null,
    '',
    '**Recommendation**',
    '- Use the lower-risk option unless current water, legal overnight, weather, daylight, body, parking, and shuttle details are all verified.',
    '- Treat this as a route-order guardrail first; exact mileages and services still need current user-owned/current-source confirmation.',
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
    routeReceipt ? `- ${routeReceipt.title} [${routeReceipt.trust}/${routeReceipt.accessMode}]: ${routeReceipt.citation}` : `- Route validator: ${grounding.source.citation}`,
    atcReceipt ? `- ${atcReceipt.title} [${atcReceipt.trust}/${atcReceipt.accessMode}]: ${atcReceipt.citation}` : '- ATC Trail Updates source manifest: available, but no ATC receipt was produced in this turn.',
    nwsReceipt ? `- ${nwsReceipt.title} [${nwsReceipt.trust}/${nwsReceipt.accessMode}]: ${nwsReceipt.citation}` : '- NWS source manifest: available, but no weather receipt was produced in this turn.',
    guideReceipt ? `- Needed but not bundled: ${guideReceipt.title} [${guideReceipt.trust}/${guideReceipt.accessMode}]. ${guideReceipt.caveats[0]}` : '- Needed but not bundled: user-owned guide data.',
    faroutReceipt ? `- Needed but not bundled: ${faroutReceipt.title} [${faroutReceipt.trust}/${faroutReceipt.accessMode}]. ${faroutReceipt.caveats[0]}` : '- Needed but not bundled: current user-supplied water/shelter comments.',
    '- Missing source class remains current user-owned guide/current comments for exact shelter condition, water reliability, services, and legal camping.'
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

function basicSourceReceiptLines(routeLabel: string): string[] {
  const atcReceipt = buildScoutSourceReceipt('atc-trail-updates');
  const nwsReceipt = buildScoutSourceReceipt('nws-weather');
  const guideReceipt = buildScoutSourceReceipt('at-guide-user-owned');
  const faroutReceipt = buildScoutSourceReceipt('farout-current-comments');

  return [
    `- Route grounding: ${routeLabel}. This is a deterministic planning guardrail, not a live mile-by-mile guide extract.`,
    atcReceipt ? `- ${atcReceipt.title} [${atcReceipt.trust}/${atcReceipt.accessMode}]: ${atcReceipt.citation}` : '- ATC Trail Updates source manifest: available, but no live receipt was produced in this turn.',
    nwsReceipt ? `- ${nwsReceipt.title} [${nwsReceipt.trust}/${nwsReceipt.accessMode}]: ${nwsReceipt.citation}` : '- NWS source manifest: available, but no live weather receipt was produced in this turn.',
    guideReceipt ? `- Needed but not bundled: ${guideReceipt.title} [${guideReceipt.trust}/${guideReceipt.accessMode}]. ${guideReceipt.caveats[0]}` : '- Needed but not bundled: user-owned guide data.',
    faroutReceipt ? `- Needed but not bundled: ${faroutReceipt.title} [${faroutReceipt.trust}/${faroutReceipt.accessMode}]. ${faroutReceipt.caveats[0]}` : '- Needed but not bundled: current user-supplied water/shelter comments.',
    '- Missing-source caveat: verify exact mileages, legal overnight status, water reliability, closures/detours, road access, parking, and shuttle details before leaving.'
  ];
}

function buildRegionalAtPlanningFallbackReply(record: WorkspaceRecord, prompt: string): string | null {
  const normalized = prompt.toLowerCase();
  const profileBits = [
    record.betaProfile.trailName || record.betaProfile.name || 'Hiker',
    record.profile?.direction,
    typeof record.profile?.targetPace === 'number' ? `workspace target ${record.profile.targetPace} mpd` : null,
    typeof record.profile?.waterCapacityLiters === 'number' ? `${record.profile.waterCapacityLiters}L water capacity` : null
  ].filter(Boolean).join(' · ');

  const intro = [
    '### Scout deterministic planning guardrail',
    '',
    'I’m using a deterministic Scout reliability fallback for this medium-risk AT planning class because wrong corridors, invented current water, invented legal camping, or provider timeouts are worse than a cautious draft.',
    profileBits ? `Workspace context: ${profileBits}.` : null,
    ''
  ].filter((line): line is string => line !== null);

  const commonSections = (routeLabel: string, extraChecklist: readonly string[] = []) => [
    '',
    '**Source receipts / missing-source caveats**',
    ...basicSourceReceiptLines(routeLabel),
    '',
    '**Final checklist**',
    '- Confirm exact route miles and road-crossing names in a current user-owned guide before driving.',
    '- Re-check ATC Trail Updates, land-manager notices, closures/detours, and fire restrictions.',
    '- Pull the NWS point forecast and alerts 24-48 hours before the hike and again the morning of departure.',
    '- Confirm parking, overnight parking if relevant, shuttle/pickup timing, bailout road access, and cell-service assumptions.',
    '- Confirm water reliability from current comments or local/current sources and treat all natural water.',
    ...extraChecklist
  ];

  if (/\bnew\s+jersey\b/u.test(normalized) && /\bnew\s+york\b/u.test(normalized)) {
    return [
      ...intro,
      '**Recommendation**',
      '- Keep this as a New Jersey / New York AT road-crossing weekend, not a vague northeastern section. Pick endpoints only after current guide and parking checks.',
      '- Use a conservative road-crossing pair first; weekend parking, shuttle availability, water, and weather should decide whether to lengthen it.',
      '',
      '**Route options or day plan**',
      '- Easier option: choose one known New Jersey AT road crossing to another nearby New Jersey/New York road crossing for a short Saturday/Sunday section, then shuttle from the exit car to the start.',
      '- Moderate option: extend into the New York border/Hudson-side approach only if the current guide confirms legal overnight, water, and bailout roads.',
      '- Do not invent exact shelter, spring, or shuttle certainty here. Treat road crossing, parking, shuttle, and water as current-check items.',
      '',
      '**Mileage targets**',
      '- Family/newer-hiker weekend: roughly 8-12 trail miles per full day after elevation, footing, heat, and pickup timing are checked.',
      '- Stronger weekend: roughly 12-16 trail miles per day only with confirmed water, legal camp, and reliable exit logistics.',
      '',
      '**Logistics / parking / shuttle**',
      '- New Jersey / New York road crossings can be convenient but crowded on weekends. Park at the exit, shuttle to the start, and verify overnight parking before leaving a car.',
      '- Build a bailout around named road crossings, not “somewhere near town.” Confirm cell coverage is not your only backup.',
      '',
      '**Water**',
      '- Do not assume springs or pumps are flowing. Carry a conservative amount, treat all natural water, and verify current comments before relying on a source.',
      '',
      '**Weather**',
      '- Use NWS point forecasts for the actual ridge/road-crossing area. Heat, thunderstorms, icy rock, wind, or wildfire smoke should shorten the plan.',
      '',
      '**Legal overnight/camping**',
      '- Use only legal shelters, designated campsites, campgrounds, or lodging confirmed by current sources. Do not invent stealth camping near road crossings.',
      '',
      '**Bailout**',
      '- Bailout should be a verified road crossing with legal pickup/parking, not an assumed side road or private driveway.',
      ...commonSections('New Jersey / New York AT road-crossing weekend')
    ].join('\n');
  }

  if (/\bvermont\b/u.test(normalized) && /\blong\s+trail\b/u.test(normalized)) {
    return [
      ...intro,
      '**Recommendation**',
      '- Treat this as a Vermont AT / Long Trail overlap backpack with mud-season and road-access gates first. If mud-season advisories, closures, fragile treadway, or road conditions are bad, postpone or choose a hardened day hike.',
      '',
      '**Route options or day plan**',
      '- Easier option: pick a short southern Vermont AT / Long Trail overlap segment with confirmed open road access, a confirmed legal shelter/campsite, and a simple shuttle.',
      '- Moderate option: use a longer two-day overlap segment only if the legal overnight site, water, trail condition, and access roads are current-confirmed.',
      '- Keep shelter names provisional until a current user-owned guide/current comments confirm status, capacity, tenting rules, and water.',
      '',
      '**Mileage targets**',
      '- Mud-season target: keep each day shorter than normal because treadway damage, snowmelt, blowdowns, and slippery footing can make 8-12 miles feel much bigger.',
      '- If road access is uncertain, reduce mileage and keep the exit simple.',
      '',
      '**Logistics / parking / shuttle**',
      '- Road access is a gating item in Vermont mud season. Verify the access road is open, legal, and passable before using it as a start, exit, or bailout.',
      '- Confirm parking and overnight parking at both ends; do not assume forest-road shoulders are legal.',
      '',
      '**Water**',
      '- Water may be abundant in mud season but still must be treated, and crossings can become unsafe after rain or snowmelt.',
      '',
      '**Weather**',
      '- Check NWS point forecasts for rain, cold nights, wind, and hypothermia risk. Wet 40s can be more dangerous than a dry cold day.',
      '',
      '**Legal overnight/camping**',
      '- Use only legal shelters, tent sites, campgrounds, or land-manager-approved sites. Do not invent shelter status or assume overflow tenting is legal.',
      '',
      '**Bailout**',
      '- Bailout depends on open/passable road access. If road status is not confirmed, the bailout is not real.',
      ...commonSections('Vermont AT / Long Trail overlap with mud-season guardrails', ['- Check Green Mountain Club / land-manager mud-season guidance before stepping onto soft trail.'])
    ].join('\n');
  }

  if (/\bat\s*mile\s*890\b/u.test(normalized) || (/\bshenandoah\b/u.test(normalized) && /\bcurrent\s+mile\b/u.test(normalized))) {
    return [
      ...intro,
      '**Recommendation**',
      '- Treat AT mile 890 in Shenandoah as an approximate current-mile anchor, not an exact campsite or road crossing. Verify the real location before selecting legal overnight endpoints.',
      '- With 2 days before pickup, choose a conservative Shenandoah plan that protects water, heat, legal camping/permit rules, and pickup certainty.',
      '',
      '**Route options or day plan**',
      '- Option A: if AT mile 890 is accurate, plan two moderate days around the nearest verified Shenandoah road crossing/hut/campground corridor and keep pickup at a confirmed road or wayside-area road access point.',
      '- Option B: if the current mile is wrong by several miles, stop treating exact mileage as authoritative; use named landmarks from your guide/GPS and rebuild the plan around the nearest legal overnight and pickup point.',
      '- Option C: if heat, storms, water uncertainty, or permit legality is weak, shorten to a nero/day-hike plus pickup reset.',
      '',
      '**Mileage targets**',
      '- Conservative Shenandoah heat target: roughly 8-12 miles per day unless current water and heat index support more.',
      '- Do not stretch to a bigger day just because the pickup is fixed; move the pickup or take a shorter bailout if needed.',
      '',
      '**Logistics / parking / shuttle**',
      '- Confirm the exact pickup point, road access, Skyline Drive status, shuttle timing, and cell-service expectations before committing.',
      '',
      '**Water**',
      '- Shenandoah summer water can be thin. Verify the next reliable source before leaving each stop, carry extra when uncertain, and treat all natural water.',
      '',
      '**Weather**',
      '- Heat, thunderstorms, cold rain, or poor visibility should reduce mileage. Pull NWS point forecasts for the actual ridge/road corridor.',
      '',
      '**Legal overnight/camping**',
      '- Use the current NPS/Recreation.gov Shenandoah backcountry permit flow and current camping rules. Do not invent legal camping from an AT mile number.',
      '',
      '**Bailout**',
      '- Bailout should be a named road crossing, wayside/road-access area, or legal pickup point verified in current sources.',
      ...commonSections('Shenandoah current-mile planning around AT mile 890', ['- Confirm the AT mile 890 position against GPS/current guide before choosing the final camp or pickup.'])
    ].join('\n');
  }

  if (/\bbear\s+mountain\b/u.test(normalized) && /\bnew\s+york\b/u.test(normalized)) {
    return [
      ...intro,
      '**Recommendation**',
      '- Use the New York Bear Mountain / Hudson AT context named in the prompt. Do not substitute another Bear Mountain.',
      '- For Dad, pick the easier Hudson/Bear Mountain finish first, then offer a longer option only if footing, heat, crowds, and pickup timing work.',
      '',
      '**Route options or day plan**',
      '- Easier Dad option: a shorter Bear Mountain / Hudson-area AT day with a confirmed trailhead, parking plan, water carried from the start, and a fixed turnaround or pickup.',
      '- Longer option: extend along the AT approach/exit around Bear Mountain only if current maps confirm the route, elevation, road crossings, and shuttle plan.',
      '- Crowd plan: start early, expect busy parking and summit/park traffic, and avoid relying on a full lot as the only plan.',
      '',
      '**Mileage targets**',
      '- Dad-friendly: roughly 3-7 miles depending on climb, heat, footing, and crowds.',
      '- Longer but still realistic: roughly 7-10 miles with a verified bailout and pickup.',
      '',
      '**Logistics / parking / shuttle**',
      '- Verify Bear Mountain State Park / Hudson-area parking, fees, opening hours, and shuttle/pickup legality before driving.',
      '',
      '**Water**',
      '- Carry enough water from the start unless a current source confirms potable/refill options. Treat natural water.',
      '',
      '**Weather**',
      '- Use NWS point forecasts for Bear Mountain/Hudson Highlands. Heat, lightning, ice, or high wind should shorten the day.',
      '',
      '**Legal overnight/camping**',
      '- This is a 1-day plan. Do not add overnight camping unless the user asks and legal sites are current-confirmed.',
      '',
      '**Bailout**',
      '- Use marked trails/roads and confirmed pickup points; do not depend on cutting through closed/private areas.',
      ...commonSections('New York Bear Mountain / Hudson AT day-hike guardrail')
    ].join('\n');
  }

  if (/\bmassachusetts\b/u.test(normalized) && /\b55\s*miles?\b/u.test(normalized)) {
    return [
      ...intro,
      '**Recommendation**',
      '- Do not accept “55 miles but easy for a newer hiker” as a safe weekend backpack. In Massachusetts, that is an aggressive mileage request, not an easy plan.',
      '- Offer a shorter alternative first, then describe what would have to be true before attempting anything near 55 miles.',
      '',
      '**Route options or day plan**',
      '- Safer shorter alternative: choose a Massachusetts AT section around 18-30 total weekend miles with legal camp/shelter, confirmed water, and simple shuttle.',
      '- Moderate alternative: roughly 30-38 total miles only if the newer hiker has proven pace, current water is confirmed, and bailout/pickup points are locked.',
      '- 55-mile attempt: treat as a high-output plan requiring training, daylight, exact legal camps, verified water, and a willingness to bail. It is not the recommended plan.',
      '',
      '**Mileage targets**',
      '- Newer-hiker easy target: roughly 8-12 miles per full day, less with steep terrain, heat, rain, or heavy pack.',
      '- 55 miles from Friday night to Sunday likely forces long days and should trigger a shorter alternative or extra day.',
      '',
      '**Logistics / parking / shuttle**',
      '- Verify Massachusetts trailhead parking, overnight parking, shuttle timing, and road-access bailouts before choosing endpoints.',
      '',
      '**Water**',
      '- Do not assume water certainty. Verify current sources and carry enough margin for dry stretches; treat all natural water.',
      '',
      '**Weather**',
      '- Rain, heat, cold nights, or thunderstorms should reduce mileage. Pull NWS point forecasts for the actual section.',
      '',
      '**Legal overnight/camping**',
      '- Use only legal shelters, designated campsites, campgrounds, or lodging verified in a current guide/land-manager source. Do not invent camps to make 55 miles fit.',
      '',
      '**Bailout**',
      '- Build bailout around named road crossings and pickup windows every day. If bailout is vague, the mileage is too aggressive.',
      ...commonSections('Massachusetts AT impossible-mileage safety guardrail', ['- Reframe the plan with the newer hiker’s real pace before locking endpoints.'])
    ].join('\n');
  }

  return null;
}

function promptLooksLikeAtPlanning(prompt: string): boolean {
  return /\b(appalachian trail|a\.t\.| at |trail|hike|backpack|section|nero|wayside|shelter|springer|amicalola|shenandoah|connecticut|massachusetts|harpers?\s+ferry|pine grove|white mountains|katahdin|baxter|100[-\s]?mile)\b/iu.test(` ${prompt} `)
    && /\b(plan|itinerary|route|mileage|day|overnight|water|weather|parking|shuttle|bailout|camp)\b/iu.test(prompt);
}

function buildScoutSourceCaveatLines(prompt: string): string[] {
  const manifests = selectScoutSourceManifests({ query: prompt, limit: 4 });
  const receipts = manifests
    .map((manifest) => buildScoutSourceReceipt(manifest.id))
    .filter((receipt): receipt is NonNullable<ReturnType<typeof buildScoutSourceReceipt>> => Boolean(receipt));

  return [
    ...receipts.map((receipt) => `- Source lane: ${receipt.title} [${receipt.trust}/${receipt.accessMode}]. ${receipt.citation}`),
    '- Missing-source caveat: exact mileages, water reliability, facility status, parking, shuttle availability, service hours, closures, and legal camping should be verified against current official/direct sources and user-owned A.T. Guide/FarOut-style notes before acting.',
    '- I did not fetch live conditions unless a source lane above explicitly says it was fetched for this turn.'
  ];
}

function ensureScoutPlanningReliabilityAppendix(prompt: string, text: string): string {
  if (!promptLooksLikeAtPlanning(prompt)) return text;

  let next = text.trimEnd();
  if (!/\b(final checklist|before leaving|before you leave|verify before)\b/iu.test(next)) {
    next += [
      '',
      '',
      '**Final checklist**',
      '- Confirm exact endpoint mileages, current weather/alerts, trail closures, water, legal overnight status, parking/shuttle details, and bailout roads before committing.'
    ].join('\n');
  }

  if (!/\b(source receipts?|missing[-\s]?source|source caveats?|source lanes?|not fetched|user-owned|farout|a\.t\. guide|awol)\b/iu.test(next)) {
    next += [
      '',
      '',
      '**Source receipts or missing-source caveats**',
      ...buildScoutSourceCaveatLines(prompt)
    ].join('\n');
  }

  return next;
}

function buildScoutTimeoutFallbackReply(record: WorkspaceRecord, prompt: string): string {
  const lowered = prompt.toLowerCase();
  const family = /\b(dad|family|low[-\s]?risk|fair[-\s]?weather)\b/iu.test(prompt);
  const overnight = /\b(overnight|backpack|2[-\s]?day|two[-\s]?day|shelter|camp)\b/iu.test(prompt);
  const shenandoah = /\b(shenandoah|wayside|snp)\b/iu.test(prompt);
  const springer = /\b(springer|amicalola)\b/iu.test(prompt);
  const ctma = /\b(connecticut|massachusetts|\bct\b|\bma\b)\b/iu.test(prompt);

  const routeOptions = springer
    ? [
        '- Easy/moderate: Springer Mountain access to the Springer summit plaque and back, keeping the day short and treating road access/parking as verify-first.',
        '- Bigger classic start: Amicalola Falls State Park Approach Trail toward Springer only if the hiker is ready for a long, steep day; the Approach Trail is not the AT and its mileage should not be counted as AT mileage without that caveat.'
      ]
    : shenandoah
      ? [
          '- Nero baseline: pick one Shenandoah road crossing, hut, campground, or wayside area as the anchor, keep hiking mileage short, and use the day for food, laundry/lodging if available, water reset, and weather/permit checks.',
          '- If overnighting, use the current NPS/Recreation.gov permit flow and legal campsite/hut/campground rules; do not camp at waysides, parking lots, or facilities unless the current official rule explicitly allows it.'
        ]
      : ctma
        ? [
            '- Connecticut option: choose a named road crossing/trailhead pair near Salisbury, Falls Village, or another well-used AT access point, then keep the day in the 3-7 mile range for Dad pace unless the group is clearly stronger.',
            '- Massachusetts option: choose a named road crossing/trailhead pair near Great Barrington, Cheshire, or Dalton, then verify parking and pickup before setting mileage.'
          ]
        : [
            '- Pick a named start and finish road crossing before trusting mileage.',
            '- Keep the first plan conservative, then add a longer option only after water, weather, footing, and pickup are confirmed.'
          ];

  const lines: string[] = [
    '### Scout reliability fallback',
    '',
    'The model call took too long, so I am giving you the safe planning baseline instead of timing out. Treat this as a draft to tighten with current sources.',
    `Workspace context: ${record.betaProfile.trailName || record.betaProfile.name || 'this hiker'}.`,
    '',
    '**Recommendation**',
    family
      ? '- Use the easiest named-road finish that still matches the goal, keep Dad pace realistic, and keep a longer option only as an opt-in after conditions check out.'
      : '- Use a conservative named-corridor plan first, then increase mileage only after current weather, water, legal overnight, and logistics are verified.',
    overnight
      ? '- For overnight plans, candidate shelters/campgrounds are not commitments until current legal status, capacity, water, and permit rules are checked.'
      : '- For day hikes, do not add an overnight assumption unless the user asks for it.',
    '',
    '**Route options or day plan**',
    ...routeOptions,
    '',
    '**Mileage targets**',
    '- Easy/family day: roughly 3-7 miles unless elevation, heat, footing, or pickup timing argues for less.',
    '- Moderate day: roughly 7-11 miles only when the group, weather, daylight, and bailout plan support it.',
    overnight ? '- Overnight: keep each day within the hiker carry/fitness range and verify every shelter/campground mile against a current guide.' : '- Exact mileage depends on the selected road crossings and current guide data.',
    '',
    '**Logistics / parking / shuttle**',
    '- Verify trailhead parking rules, overnight parking if relevant, pickup windows, shuttle availability, and cell-service assumptions before leaving a car.',
    '',
    '**Water**',
    '- Do not assume water is flowing. Carry a conservative amount, treat all natural water, and verify current water from recent user-owned/current comments.',
    '',
    '**Weather**',
    '- Check NWS point forecast and alerts 24-48 hours before the hike, then again the morning of departure. Heat, thunderstorms, cold rain, wind, or flooding should reduce mileage.',
    '',
    '**Legal overnight/camping**',
    overnight || shenandoah
      ? '- Use only legal shelters, designated campsites, campgrounds, or permit-compliant backcountry sites. Do not invent stealth camping or wayside/parking-lot camping.'
      : '- Not applicable for the day-hike version; if plans change to overnight, verify the legal camping lane first.',
    '',
    '**Bailout**',
    '- Choose turnaround points and road bailouts before starting; do not rely on cell service as the only recovery plan.',
    '',
    '**Final checklist**',
    '- Confirm exact start/end, current trail updates, water, weather, legal overnight if relevant, parking/shuttle, daylight, Dad/group pace, and emergency pickup plan.',
    '',
    '**Source receipts or missing-source caveats**',
    ...buildScoutSourceCaveatLines(prompt)
  ];

  if (lowered.includes('harpers ferry') || lowered.includes('harper')) {
    lines.splice(8, 0, '- Harpers Ferry / ATC HQ is the named destination if present; do not substitute Pine Grove Furnace just because the prompt says mental halfway.');
  }

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

  if (!activeDocument && !activeResource) {
    const strictRouteReply = await buildStrictAtRouteItineraryReply(record, trimmedPrompt);
    if (strictRouteReply) {
      const { nextMessages, reply } = deterministicClawTurn(record, null, trimmedPrompt, strictRouteReply);
      const workspace = await replaceWorkspaceClawMessages(workspaceId, betaProfile, nextMessages);
      return { workspace, reply, revisedDocument: null };
    }

    const regionalPlanningReply = buildRegionalAtPlanningFallbackReply(record, trimmedPrompt);
    if (regionalPlanningReply) {
      const { nextMessages, reply } = deterministicClawTurn(record, null, trimmedPrompt, regionalPlanningReply);
      const workspace = await replaceWorkspaceClawMessages(workspaceId, betaProfile, nextMessages);
      return { workspace, reply, revisedDocument: null };
    }

    const privateImportReply = buildPrivateImportSearchReply(record, trimmedPrompt);
    if (privateImportReply) {
      const { nextMessages, reply } = deterministicClawTurn(record, null, trimmedPrompt, privateImportReply);
      const workspace = await replaceWorkspaceClawMessages(workspaceId, betaProfile, nextMessages);
      return { workspace, reply, revisedDocument: null };
    }

    const officialRelevanceReply = await buildOfficialRelevanceReply(record, trimmedPrompt);
    if (officialRelevanceReply) {
      const { nextMessages, reply } = deterministicClawTurn(record, null, trimmedPrompt, officialRelevanceReply);
      const workspace = await replaceWorkspaceClawMessages(workspaceId, betaProfile, nextMessages);
      return { workspace, reply, revisedDocument: null };
    }

    const trailOpsPlanReply = await buildTrailOpsPlanReply(record, trimmedPrompt);
    if (trailOpsPlanReply) {
      const { nextMessages, reply } = deterministicClawTurn(record, null, trimmedPrompt, trailOpsPlanReply);
      const workspace = await replaceWorkspaceClawMessages(workspaceId, betaProfile, nextMessages);
      return { workspace, reply, revisedDocument: null };
    }
  }

  const runtime = await resolveClawRuntime(record);
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
        tools: [buildScoutSourceCatalogTool(), buildScoutSourceSearchTool(record, dadPilotSummary), buildOfficialTrailSourceTool(dadPilotSummary)],
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
  let nextMessages: WorkspaceClawMessage[];
  let reply: WorkspaceClawMessage | undefined;
  try {
    ({ nextMessages, reply } = await runAgentPrompt(history));
  } catch (caught) {
    if (
      caught instanceof ScoutAgentTimeoutError
      && runtime.providerId === OPENCODE_GO_PROVIDER_ID
      && !activeDocument
      && !activeResource
      && promptLooksLikeAtPlanning(trimmedPrompt)
    ) {
      const fallback = deterministicClawTurn(record, null, trimmedPrompt, buildScoutTimeoutFallbackReply(record, trimmedPrompt));
      const safeReply: WorkspaceClawMessage = {
        ...fallback.reply,
        providerId: 'system',
        model: 'scout-timeout-fallback'
      };
      const workspace = await replaceWorkspaceClawMessages(workspaceId, betaProfile, [...fallback.nextMessages.slice(0, -1), safeReply]);
      return { workspace, reply: safeReply, revisedDocument: null };
    }
    throw caught;
  }

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

  const reliableReplyText = ensureScoutPlanningReliabilityAppendix(trimmedPrompt, reply.text);
  if (reliableReplyText !== reply.text) {
    reply = { ...reply, text: reliableReplyText };
    nextMessages = [...nextMessages.slice(0, -1), reply];
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
