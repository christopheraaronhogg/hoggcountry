import { Agent, type AgentEvent, type AgentTool, type ThinkingLevel } from '@mariozechner/pi-agent-core';
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
import { searchKjvPce } from '@hoggcountry/corpus/kjv-pce';
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
  buildScoutSkillPromptContext,
  createScoutSkillSearchHit,
  disabledScoutSkillOwnsSourceManifest,
  scoutSkillEnabled
} from '@hoggcountry/scout-skills';
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
  type WorkspaceClawSourceReceipt,
  type WorkspaceFactCandidateInput,
  type WorkspaceRecord,
  type WorkspaceSnapshot
} from '$lib/server/workspace-store';
import { buildAtRouteGrounding, formatAtRouteMileage, type AtRouteGrounding } from '@hoggcountry/trail-data';
import {
  configuredHouseModelId,
  configuredHouseProviderId,
  DEFAULT_OPENCODE_GO_MODEL,
  OPENAI_CODEX_MODEL,
  OPENAI_CODEX_PROVIDER_ID,
  OPENCODE_GO_PROVIDER_ID,
  type ClawProviderId
} from './claw-connection';
import { SCOUT_VOICE_EXAMPLES } from './scout-voice-examples';
import { atMilepostNearMile } from './at-location';
import {
  SCOUT_DATE_TIMEZONE,
  buildCurrentDateAuthority,
  buildCurrentDatetimeDetails,
  renderCurrentDatetime,
  type CurrentDatetimeDetails
} from './scout-date-authority';
import { renderWebResearchResult, researchWeb, type WebResearchDetails } from './scout-web-research';

export { getConfiguredClawConnection, type WorkspaceClawConnectionPayload } from './claw-connection';
export { buildCurrentDateAuthority, buildCurrentDatetimeDetails } from './scout-date-authority';

const OPENCODE_GO_REPLY_MAX_TOKENS = 4000;
export type ScoutThinkingEffort = Extract<ThinkingLevel, 'off' | 'minimal' | 'low' | 'medium' | 'high'>;

export function normalizeScoutThinkingEffort(value: unknown): ScoutThinkingEffort {
  return value === 'off' || value === 'minimal' || value === 'medium' || value === 'high' ? value : 'low';
}
const SCOUT_AGENT_TURN_TIMEOUT_MS = 900_000;
const SCOUT_PRELOADED_SOURCE_MAX_CHARS = 2600;
const SCOUT_PRELOADED_SOURCE_PLAN_MAX_CHARS = 1800;
const SCOUT_PRELOADED_OFFICIAL_MAX_CHARS = 2400;
const SCOUT_PRELOADED_ROUTE_RESOURCE_MAX_CHARS = 3200;
const SCOUT_MODEL_HISTORY_MESSAGES = 8;
const SCOUT_STORED_HISTORY_MESSAGES = 200;

interface ClawRuntime {
  readonly providerId: ClawProviderId;
  readonly modelId: string;
  readonly model: Model<any>;
  readonly apiKey: string;
  readonly credentials: OpenAICodexCredentials | null;
}

export class ScoutAgentTimeoutError extends Error {
  constructor() {
    super('Scout took too long to finish that reply. The thread is intact — try again, or ask Scout to continue with a shorter first pass while I keep improving the long-reply path.');
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
  readonly skillId?: string;
  readonly resourceId?: string;
  readonly citation?: string;
  readonly confidence?: number;
  readonly relevance?: number;
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

interface ScoutResolvedLocation {
  readonly label: string;
  readonly latitude: number;
  readonly longitude: number;
  readonly mile: number | null;
  readonly source: 'explicit-coordinates' | 'known-location' | 'at-mile' | 'profile-current-mile' | 'latest-gps-fix' | 'dad-garmin';
  readonly fetchedAt: string;
  readonly confidence: 'high' | 'medium' | 'low';
  readonly note: string | null;
}

interface ScoutWeatherForecastDetails {
  readonly location: ScoutResolvedLocation | null;
  readonly official: OfficialTrailSourceCheckDetails;
}

interface ScoutWeatherAlertsDetails {
  readonly location: ScoutResolvedLocation | null;
  readonly official: OfficialTrailSourceCheckDetails;
}

interface ScoutSegmentPlanDetails {
  readonly query: string;
  readonly grounding: AtRouteGrounding | null;
  readonly fetchedAt: string;
  readonly missingChecks: readonly string[];
}

interface ScoutWebResearchToolDetails extends WebResearchDetails {}

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

const WEB_RESEARCH_PARAMETERS = Type.Object({
  query: Type.String({
    minLength: 3,
    maxLength: 300,
    description: 'The current web research query. Keep it specific and avoid private/internal URLs.'
  }),
  allowedDomains: Type.Optional(Type.String({
    maxLength: 300,
    description: 'Optional comma-separated public domains to restrict research to, such as appalachiantrail.org, nps.gov, weather.gov, or a hostel domain.'
  })),
  limit: Type.Optional(Type.Number({ minimum: 1, maximum: 5, description: 'Maximum web results to return.' })),
  fetchPages: Type.Optional(Type.Boolean({
    description: 'Fetch readable page excerpts for returned search results. Defaults to true.'
  }))
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
  })),
  useProfileLocation: Type.Optional(Type.Boolean({
    description: 'Use the workspace profile current AT mile as the NWS point forecast location when explicit coordinates are not provided. Defaults to true for weather questions with a usable current mile.'
  }))
});

const CURRENT_DATETIME_PARAMETERS = Type.Object({
  timezone: Type.Optional(Type.String({
    minLength: 1,
    maxLength: 80,
    description: 'IANA timezone to use for today/tomorrow labels. Defaults to the hiker workspace timezone.'
  }))
});

const RESOLVE_LOCATION_PARAMETERS = Type.Object({
  query: Type.Optional(Type.String({
    minLength: 1,
    maxLength: 240,
    description: 'Named place, AT mile, or location phrase to resolve, such as Harpers Ferry, AT mile 1024.6, or current profile location.'
  })),
  latitude: Type.Optional(Type.Number({ minimum: -90, maximum: 90, description: 'Explicit latitude when the user supplied coordinates.' })),
  longitude: Type.Optional(Type.Number({ minimum: -180, maximum: 180, description: 'Explicit longitude when the user supplied coordinates.' })),
  useProfileLocation: Type.Optional(Type.Boolean({
    description: 'Resolve to the workspace profile current AT mile when no explicit location is supplied. Defaults to true.'
  })),
  useLatestGps: Type.Optional(Type.Boolean({
    description: 'Resolve to the latest private GPS fix in the workspace when available.'
  })),
  useDadLocation: Type.Optional(Type.Boolean({
    description: 'Resolve to Dad public Garmin snapped trail location when the question is about Dad/public pilot context.'
  }))
});

const WEATHER_FORECAST_PARAMETERS = Type.Object({
  query: Type.Optional(Type.String({
    minLength: 1,
    maxLength: 240,
    description: 'Weather question or location phrase. Use this to preserve the user intent in the NWS query.'
  })),
  latitude: Type.Optional(Type.Number({ minimum: -90, maximum: 90, description: 'Explicit latitude for the NWS point forecast.' })),
  longitude: Type.Optional(Type.Number({ minimum: -180, maximum: 180, description: 'Explicit longitude for the NWS point forecast.' })),
  useProfileLocation: Type.Optional(Type.Boolean({
    description: 'Use the workspace profile current AT mile as the forecast point when coordinates are not supplied. Defaults to true.'
  })),
  useLatestGps: Type.Optional(Type.Boolean({
    description: 'Use latest private GPS fix when available.'
  })),
  useDadLocation: Type.Optional(Type.Boolean({
    description: 'Use Dad public Garmin snapped trail location when relevant.'
  }))
});

const WEATHER_ALERTS_PARAMETERS = WEATHER_FORECAST_PARAMETERS;

const PLAN_SEGMENT_PARAMETERS = Type.Object({
  query: Type.String({
    minLength: 4,
    maxLength: 800,
    description: 'The route, segment, or itinerary request to ground against the AT route resource.'
  })
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

async function profileCoordinates(record: WorkspaceRecord): Promise<{ readonly latitude: number; readonly longitude: number; readonly mile: number } | null> {
  const mile = record.profile?.currentMile;
  if (typeof mile !== 'number' || !Number.isFinite(mile) || mile <= 0) return null;

  try {
    const milepost = await atMilepostNearMile(mile);
    return {
      latitude: milepost.latitude,
      longitude: milepost.longitude,
      mile: milepost.mile
    };
  } catch {
    return null;
  }
}

function latestGpsLocation(record: WorkspaceRecord): ScoutResolvedLocation | null {
  const latest = record.locationHistory?.at(-1);
  if (!latest) return null;
  return {
    label: `Latest private GPS fix near AT mile ${latest.nearestMile.toFixed(1)}`,
    latitude: latest.trailLatitude,
    longitude: latest.trailLongitude,
    mile: latest.nearestMile,
    source: 'latest-gps-fix',
    fetchedAt: new Date().toISOString(),
    confidence: latest.distanceToTrailMiles <= 0.25 ? 'high' : latest.distanceToTrailMiles <= 1 ? 'medium' : 'low',
    note: `${latest.recordedAt}; ${latest.distanceToTrailMiles.toFixed(2)} mi from trail; accuracy ${latest.accuracyMeters !== null ? `${Math.round(latest.accuracyMeters)}m` : 'unknown'}`
  };
}

function dadGarminLocation(dadPilotSummary: DadPilotSummary | null): ScoutResolvedLocation | null {
  const location = dadPilotSummary?.latestTrailLocation;
  if (!location) return null;
  return {
    label: `Dad Garmin snapped location, ${location.label}`,
    latitude: location.trailLatitude,
    longitude: location.trailLongitude,
    mile: location.nearestMile,
    source: 'dad-garmin',
    fetchedAt: new Date().toISOString(),
    confidence: location.distanceToTrailMiles <= 0.5 ? 'high' : 'medium',
    note: `${dadPilotSummary.latestFixAt ? `Garmin fix ${dadPilotSummary.latestFixAt}; ` : ''}${location.distanceToTrailMiles.toFixed(2)} mi from raw fix${dadPilotSummary.latestFixIsPreview ? '; preview/fallback fix' : ''}`
  };
}

function knownTrailLocation(query: string): { readonly label: string; readonly latitude: number; readonly longitude: number; readonly mile: number | null } | null {
  const lowered = query.toLowerCase();
  if (/\bharper'?s?\s+ferry\b/u.test(lowered) || /\bharpers\s+ferry\b/u.test(lowered)) {
    return {
      label: 'Harpers Ferry, WV',
      latitude: 39.3245,
      longitude: -77.7398,
      mile: 1024.6
    };
  }
  return null;
}

async function resolveScoutLocation(
  record: WorkspaceRecord,
  dadPilotSummary: DadPilotSummary | null,
  input: {
    readonly query?: string | null;
    readonly latitude?: number | null;
    readonly longitude?: number | null;
    readonly useProfileLocation?: boolean | null;
    readonly useLatestGps?: boolean | null;
    readonly useDadLocation?: boolean | null;
  }
): Promise<ScoutResolvedLocation | null> {
  const fetchedAt = new Date().toISOString();
  if (typeof input.latitude === 'number' && Number.isFinite(input.latitude) && typeof input.longitude === 'number' && Number.isFinite(input.longitude)) {
    return {
      label: 'Provided coordinates',
      latitude: input.latitude,
      longitude: input.longitude,
      mile: null,
      source: 'explicit-coordinates',
      fetchedAt,
      confidence: 'high',
      note: null
    };
  }

  if (input.useDadLocation) {
    const dadLocation = dadGarminLocation(dadPilotSummary);
    if (dadLocation) return dadLocation;
  }

  if (input.useLatestGps) {
    const latest = latestGpsLocation(record);
    if (latest) return latest;
  }

  const query = input.query?.trim() ?? '';
  if (query) {
    const mileMatch = query.match(/\b(?:at\s*)?mile\s*(\d+(?:\.\d+)?)\b/iu) ?? query.match(/\b(\d{3,4}(?:\.\d+)?)\s*(?:nobo|sobo|at)?\s*mile\b/iu);
    if (mileMatch?.[1]) {
      const mile = Number(mileMatch[1]);
      if (Number.isFinite(mile)) {
        const milepost = await atMilepostNearMile(mile);
        return {
          label: `AT mile ${milepost.mile.toFixed(1)}`,
          latitude: milepost.latitude,
          longitude: milepost.longitude,
          mile: milepost.mile,
          source: 'at-mile',
          fetchedAt,
          confidence: 'high',
          note: `Resolved from requested mile ${mile.toFixed(1)}.`
        };
      }
    }

    const known = knownTrailLocation(query);
    if (known) {
      return {
        ...known,
        source: 'known-location',
        fetchedAt,
        confidence: 'high',
        note: 'Built-in AT landmark coordinate used for tool routing.'
      };
    }
  }

  if (input.useProfileLocation !== false) {
    const profilePoint = await profileCoordinates(record);
    if (profilePoint) {
      return {
        label: `Profile current AT mile ${profilePoint.mile.toFixed(1)}`,
        latitude: profilePoint.latitude,
        longitude: profilePoint.longitude,
        mile: profilePoint.mile,
        source: 'profile-current-mile',
        fetchedAt,
        confidence: 'medium',
        note: record.profile?.updatedAt ? `Profile updated ${record.profile.updatedAt}.` : null
      };
    }
  }

  return null;
}

function renderResolvedLocation(location: ScoutResolvedLocation | null): string {
  if (!location) {
    return 'Location resolution failed: no explicit coordinates, usable named AT landmark, latest GPS fix, Dad Garmin fix, or profile current mile was available.';
  }

  return [
    `Resolved location: ${location.label}.`,
    `Coordinates: ${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}.`,
    location.mile !== null ? `AT mile: ${location.mile.toFixed(1)}.` : null,
    `Source: ${location.source}; confidence ${location.confidence}; resolved at ${location.fetchedAt}.`,
    location.note
  ].filter((line): line is string => Boolean(line)).join('\n');
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

function skillEnabled(record: WorkspaceRecord, skillId: string): boolean {
  return scoutSkillEnabled(record.skillSettings, skillId);
}

function extractKjvReferenceCandidates(prompt: string): string[] {
  const references = prompt.match(/\b(?:[1-3]\s*)?[A-Z][a-z]+(?:\s+of\s+[A-Z][a-z]+)?\s+\d{1,3}:\d{1,3}(?:\s*[-–]\s*\d{1,3})?/gu) ?? [];
  return references.map((reference) => reference.replace(/\s+/gu, ' ').trim());
}

function promptAsksForScripture(prompt: string): boolean {
  return /\b(scripture|bible|kjv|king\s+james|pce|pure\s+cambridge|verse|verses|quote|proverbs|psalms?|gospel)\b/iu.test(prompt)
    || extractKjvReferenceCandidates(prompt).length > 0;
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
  if (promptAsksForScripture(prompt)) {
    queries.push(...extractKjvReferenceCandidates(prompt), 'KJV PCE scripture', 'Bible verse');
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

function recommendedScoutSources(record: WorkspaceRecord, prompt: string, limit = 6): ScoutSourceCatalogEntry[] {
  const terms = promptTerms(prompt);
  return [...SCOUT_SOURCE_CATALOG]
    .filter((entry) => !disabledScoutSkillOwnsSourceManifest(record.skillSettings, entry.id))
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

function searchKjvPceContext(record: WorkspaceRecord, query: string, limit = 8): ScoutContextHit[] {
  if (!skillEnabled(record, 'kjv-pce-scripture') || !promptAsksForScripture(query)) return [];
  return searchKjvPce(query, limit).map((hit) => ({
    ...createScoutSkillSearchHit({
      skillId: 'kjv-pce-scripture',
      resourceId: 'kjv-pce',
      sourceId: 'kjv-pce',
      title: hit.reference,
      excerpt: hit.text,
      citation: hit.citation,
      confidence: 0.95,
      relevance: Math.min(1, Math.max(0.25, hit.score / 1000))
    }),
    id: hit.id,
    sourceType: 'corpus' as const,
    sourceLabel: 'KJV PCE',
    title: hit.reference,
    excerpt: `${hit.citation}: ${hit.text}`,
    href: `/kjv-pce.md#${hit.verse.book.toLowerCase().replace(/[^a-z0-9]+/gu, '-')}`,
    score: hit.score,
    trust: 'reviewed' as const,
    access: 'searchable-now' as const
  }));
}

function searchScoutSources(record: WorkspaceRecord, dadPilotSummary: DadPilotSummary | null, prompt: string, limit = 8): ScoutContextHit[] {
  const queries = deriveScoutSourceQueries(prompt);
  const byKey = new Map<string, ScoutContextHit>();

  for (const query of queries) {
    const privateWorkspaceHits = skillEnabled(record, 'private-workspace-resources')
      ? [
          ...searchManualSections(record.sections, query),
          ...searchImportedDocuments(record.documents, query),
          ...searchWorkspaceResources(record.resources, query),
          ...searchWorkspaceTools(record.tools, query)
        ]
      : [];
    const hits = [
      ...privateWorkspaceHits,
      ...searchPublicCorpus(publicCorpus, query),
      ...searchKjvPceContext(record, query, 6)
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
    const skill = hit.skillId ? ` skill=${hit.skillId}` : '';
    const citation = hit.citation ? ` Citation: ${hit.citation}` : '';
    return `${index + 1}. [${hit.sourceLabel}; ${hit.trust}; ${hit.access}${skill}] ${hit.title}${href}: ${excerpt(hit.excerpt, 320)}${citation}`;
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
    recommendations: recommendedScoutSources(record, prompt)
  };
}

function buildScoutSourceCatalogDetails(input: {
  readonly query: string;
  readonly state?: string | null;
  readonly mileStart?: number | null;
  readonly mileEnd?: number | null;
  readonly includeUnavailable?: boolean | null;
  readonly limit?: number | null;
}, record?: WorkspaceRecord): ScoutSourceCatalogDetails {
  const mileRange = typeof input.mileStart === 'number' && typeof input.mileEnd === 'number'
    ? [input.mileStart, input.mileEnd] as const
    : null;
  const sources = selectScoutSourceManifests({
    query: input.query,
    state: input.state?.trim() || null,
    mileRange,
    includeUnavailable: input.includeUnavailable ?? false,
    limit: input.limit ?? 8
  }).filter((source) => !record || !disabledScoutSkillOwnsSourceManifest(record.skillSettings, source.id));
  return {
    query: input.query,
    state: input.state?.trim() || null,
    mileRange,
    sources
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

function buildScoutSourceCatalogTool(record: WorkspaceRecord): AgentTool<typeof SCOUT_SOURCE_CATALOG_PARAMETERS, ScoutSourceCatalogDetails> {
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
      }, record);
      const text = renderScoutSourceCatalogResult(details);

      return {
        content: [{ type: 'text', text: text.length > 6000 ? `${text.slice(0, 5999).trimEnd()}…` : text }],
        details
      };
    }
  };
}

function buildWebResearchTool(): AgentTool<typeof WEB_RESEARCH_PARAMETERS, ScoutWebResearchToolDetails> {
  return {
    name: 'research_web',
    label: 'Research the web',
    description: 'Searches the public web and fetches short page excerpts for general current research. Use for current facts that are not covered by private workspace search or dedicated official weather/trail tools. Do not use for local/private/internal URLs.',
    parameters: WEB_RESEARCH_PARAMETERS,
    executionMode: 'parallel',
    async execute(_toolCallId, params) {
      const details = await researchWeb({
        query: params.query,
        allowedDomains: params.allowedDomains ?? null,
        limit: params.limit ?? null,
        fetchPages: params.fetchPages ?? true
      });
      const text = renderWebResearchResult(details);

      return {
        content: [{ type: 'text', text: text.length > 8000 ? `${text.slice(0, 7999).trimEnd()}...` : text }],
        details
      };
    }
  };
}

function buildOfficialTrailSourceTool(record: WorkspaceRecord, dadPilotSummary: DadPilotSummary | null): AgentTool<typeof OFFICIAL_TRAIL_SOURCE_PARAMETERS, OfficialTrailSourceCheckDetails> {
  return {
    name: 'check_official_trail_sources',
    label: 'Check official trail sources',
    description: 'Fetches live official source context from ATC Trail Updates and NWS point forecast/alerts. Use for closures, detours, burn bans, bear warnings, storms, heat/cold, wind, flood risk, snow/ice, and other safety-sensitive current conditions. For weather, this tool will use explicit coordinates first, then the workspace profile current AT mile when available, then Dad Garmin if requested.',
    parameters: OFFICIAL_TRAIL_SOURCE_PARAMETERS,
    executionMode: 'parallel',
    async execute(_toolCallId, params) {
      const profilePoint = params.latitude === undefined || params.longitude === undefined
        ? await profileCoordinates(record)
        : null;
      const details = await checkOfficialTrailSources(
        {
          query: params.query,
          source: params.source ?? 'auto',
          state: params.state ?? null,
          latitude: params.latitude ?? (params.useProfileLocation === false ? null : profilePoint?.latitude ?? null),
          longitude: params.longitude ?? (params.useProfileLocation === false ? null : profilePoint?.longitude ?? null),
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

function buildCurrentDatetimeTool(): AgentTool<typeof CURRENT_DATETIME_PARAMETERS, CurrentDatetimeDetails> {
  return {
    name: 'get_current_datetime',
    label: 'Get current date/time',
    description: 'Returns the authoritative server-clock current datetime plus today/tomorrow labels. Use whenever the user asks about today, tomorrow, tonight, weekday labels, or freshness.',
    parameters: CURRENT_DATETIME_PARAMETERS,
    executionMode: 'parallel',
    async execute(_toolCallId, params) {
      const details = buildCurrentDatetimeDetails(new Date(), params.timezone?.trim() || SCOUT_DATE_TIMEZONE);
      return {
        content: [{ type: 'text', text: renderCurrentDatetime(details) }],
        details
      };
    }
  };
}

function buildResolveLocationTool(record: WorkspaceRecord, dadPilotSummary: DadPilotSummary | null): AgentTool<typeof RESOLVE_LOCATION_PARAMETERS, ScoutResolvedLocation | null> {
  return {
    name: 'resolve_location',
    label: 'Resolve trail location',
    description: 'Resolves explicit coordinates, AT mile references, known AT landmarks, latest private GPS fix, Dad Garmin snapped location, or the workspace profile current AT mile into coordinates for route/weather tools.',
    parameters: RESOLVE_LOCATION_PARAMETERS,
    executionMode: 'parallel',
    async execute(_toolCallId, params) {
      const details = await resolveScoutLocation(record, dadPilotSummary, {
        query: params.query ?? null,
        latitude: params.latitude ?? null,
        longitude: params.longitude ?? null,
        useProfileLocation: params.useProfileLocation ?? true,
        useLatestGps: params.useLatestGps ?? false,
        useDadLocation: params.useDadLocation ?? false
      });
      return {
        content: [{ type: 'text', text: renderResolvedLocation(details) }],
        details
      };
    }
  };
}

function renderWeatherForecast(details: ScoutWeatherForecastDetails): string {
  const locationText = renderResolvedLocation(details.location);
  const officialText = renderOfficialTrailSourceResult(details.official);
  return [
    'Weather forecast tool result:',
    locationText,
    officialText,
    'Forecast answer rule: use only the NWS periods returned above for forecast specifics. If periods are missing, say the NWS fetch failed or was skipped.'
  ].join('\n');
}

function renderWeatherAlerts(details: ScoutWeatherAlertsDetails): string {
  const alerts = details.official.weather?.alerts ?? [];
  const lines = [
    'Weather alerts tool result:',
    renderResolvedLocation(details.location),
    `Fetched at ${details.official.fetchedAt}. Provider: NWS.`,
    details.official.weather ? `NWS alerts URL: ${details.official.weather.alertsUrl}` : null
  ].filter((line): line is string => Boolean(line));

  if (alerts.length === 0) {
    lines.push(details.official.weather ? 'Active NWS alerts: none returned for this point.' : 'Active NWS alerts: unavailable because NWS weather did not return.');
  } else {
    lines.push('Active NWS alerts:');
    alerts.forEach((alert, index) => {
      lines.push(`${index + 1}. ${alert.event}${alert.severity ? ` (${alert.severity})` : ''}: ${alert.headline}${alert.expires ? ` Expires ${alert.expires}.` : ''}`);
      if (alert.instruction) lines.push(`   Instruction: ${excerpt(alert.instruction, 260)}`);
    });
  }

  if (details.official.skipped.length > 0) lines.push(`Skipped: ${details.official.skipped.join(' ')}`);
  if (details.official.errors.length > 0) lines.push(`Errors: ${details.official.errors.join(' ')}`);
  lines.push('Alert answer rule: do not invent alerts beyond the NWS alert list returned above.');
  return lines.join('\n');
}

async function buildWeatherDetails(
  record: WorkspaceRecord,
  dadPilotSummary: DadPilotSummary | null,
  params: {
    readonly query?: string | null;
    readonly latitude?: number | null;
    readonly longitude?: number | null;
    readonly useProfileLocation?: boolean | null;
    readonly useLatestGps?: boolean | null;
    readonly useDadLocation?: boolean | null;
  }
): Promise<ScoutWeatherForecastDetails> {
  const location = await resolveScoutLocation(record, dadPilotSummary, {
    query: params.query ?? null,
    latitude: params.latitude ?? null,
    longitude: params.longitude ?? null,
    useProfileLocation: params.useProfileLocation ?? true,
    useLatestGps: params.useLatestGps ?? false,
    useDadLocation: params.useDadLocation ?? false
  });
  const query = params.query?.trim() || 'weather forecast';
  const official = await checkOfficialTrailSources(
    {
      query,
      source: 'nws',
      state: record.profile ? approximateAtStateForMile(record.profile.currentMile) : null,
      latitude: location?.latitude ?? null,
      longitude: location?.longitude ?? null,
      useDadLocation: false
    },
    dadPilotSummary
  );

  return { location, official };
}

function buildWeatherForecastTool(record: WorkspaceRecord, dadPilotSummary: DadPilotSummary | null): AgentTool<typeof WEATHER_FORECAST_PARAMETERS, ScoutWeatherForecastDetails> {
  return {
    name: 'get_weather_forecast',
    label: 'Get NWS weather forecast',
    description: 'Fetches a current NWS point forecast and active alerts for a resolved trail location. Use for all current/future weather questions before giving forecast specifics.',
    parameters: WEATHER_FORECAST_PARAMETERS,
    executionMode: 'parallel',
    async execute(_toolCallId, params) {
      const details = await buildWeatherDetails(record, dadPilotSummary, params);
      const text = renderWeatherForecast(details);
      return {
        content: [{ type: 'text', text: text.length > 7000 ? `${text.slice(0, 6999).trimEnd()}…` : text }],
        details
      };
    }
  };
}

function buildWeatherAlertsTool(record: WorkspaceRecord, dadPilotSummary: DadPilotSummary | null): AgentTool<typeof WEATHER_ALERTS_PARAMETERS, ScoutWeatherAlertsDetails> {
  return {
    name: 'get_weather_alerts',
    label: 'Get NWS weather alerts',
    description: 'Fetches active NWS alerts for a resolved trail location. Use before making claims about watches, warnings, advisories, storm/flood/heat/cold alerts, or no active alerts.',
    parameters: WEATHER_ALERTS_PARAMETERS,
    executionMode: 'parallel',
    async execute(_toolCallId, params) {
      const details = await buildWeatherDetails(record, dadPilotSummary, params);
      const alertDetails: ScoutWeatherAlertsDetails = details;
      const text = renderWeatherAlerts(alertDetails);
      return {
        content: [{ type: 'text', text: text.length > 5000 ? `${text.slice(0, 4999).trimEnd()}…` : text }],
        details: alertDetails
      };
    }
  };
}

function buildPlanSegmentTool(record: WorkspaceRecord): AgentTool<typeof PLAN_SEGMENT_PARAMETERS, ScoutSegmentPlanDetails> {
  return {
    name: 'plan_segment',
    label: 'Plan AT segment',
    description: 'Runs deterministic AT route grounding for itinerary, segment, day-by-day, and access-point planning. Use before route logistics so the answer keeps landmarks and mileage in plausible order.',
    parameters: PLAN_SEGMENT_PARAMETERS,
    executionMode: 'parallel',
    async execute(_toolCallId, params) {
      const grounding = skillEnabled(record, 'at-mile-marker-reference') ? buildAtRouteGrounding({ prompt: params.query }) : null;
      const missingChecks = [
        'current guide/FarOut or user-owned guide for exact campsite/water/service details',
        'official closures/detours when safety-sensitive',
        'NWS forecast/alerts for the actual day and trail point',
        'parking/shuttle/legal overnight confirmation for road-access logistics'
      ];
      const details: ScoutSegmentPlanDetails = {
        query: params.query,
        grounding,
        fetchedAt: new Date().toISOString(),
        missingChecks
      };
      const text = grounding
        ? [
            'Segment planning tool result:',
            `Fetched at ${details.fetchedAt}.`,
            renderAtRouteResourceContext(grounding),
            `Missing current checks before commitment: ${missingChecks.join('; ')}.`
          ].join('\n')
        : [
            'Segment planning tool result:',
            `Fetched at ${details.fetchedAt}.`,
            'No deterministic AT route grounding matched this query, or AT mile marker reference is disabled.',
            `Missing current checks before commitment: ${missingChecks.join('; ')}.`
          ].join('\n');
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
    description: 'Searches private workspace notes, saved docs, checklists/tools, reviewed Hogg Country corpus, bundled KJV PCE scripture, and public Dad pilot signals. Also recommends source lanes Scout should request, import, or verify next.',
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

function buildScoutSourcePlanContext(record: WorkspaceRecord, prompt: string): string | null {
  const sources = selectScoutSourceManifests({
    query: prompt,
    state: record.profile ? approximateAtStateForMile(record.profile.currentMile) : null,
    limit: 8
  }).filter((source) => !disabledScoutSkillOwnsSourceManifest(record.skillSettings, source.id));

  if (sources.length === 0) return null;

  const sourceLines = sources.map((source) => {
    const receipt = buildScoutSourceReceipt(source.id);
    const status = source.accessMode === 'bundled-index' || source.accessMode === 'workspace-private'
      ? 'available now'
      : source.accessMode === 'route-validator'
        ? 'constraint/resource, not prose'
        : source.accessMode === 'live-fetch'
          ? 'must fetch or cite as missing'
          : source.accessMode === 'user-import-required'
            ? 'requires hiker-owned import'
            : 'not available by default';
    return `- ${source.title} (${source.trust}/${source.accessMode}; ${status}). Use for: ${source.useWhen} Receipt/caveat: ${receipt?.citation ?? source.citationTemplate}`;
  });

  const context = [
    'Scout source plan for this turn:',
    ...sourceLines,
    'Source-planning rule: decide from these lanes what is available now, what is only a route/legal/safety constraint, and what must be named as missing. Do not turn these into canned answer text.'
  ].join('\n');

  return context.length > SCOUT_PRELOADED_SOURCE_PLAN_MAX_CHARS
    ? `${context.slice(0, SCOUT_PRELOADED_SOURCE_PLAN_MAX_CHARS - 1).trimEnd()}…`
    : context;
}

function buildScoutSourceContext(record: WorkspaceRecord, dadPilotSummary: DadPilotSummary | null, prompt: string): string | null {
  const queries = deriveScoutSourceQueries(prompt);
  if (queries.length === 0) return null;

  const context = [
    'Scout source search context for this turn:',
    renderScoutSourceSearchResult(buildScoutSourceSearchDetails(record, dadPilotSummary, prompt)),
    'Grounding rules: use searchable-now hits as context; cite KJV PCE hits exactly for scripture and do not invent verse wording; do not claim live conditions from external-check or user-import sources unless the user has supplied/fetched them; for weather, closures, water reliability, and same-day town logistics, name the official/direct source that should be checked before acting.'
  ].join('\n');

  return context.length > SCOUT_PRELOADED_SOURCE_MAX_CHARS
    ? `${context.slice(0, SCOUT_PRELOADED_SOURCE_MAX_CHARS - 1).trimEnd()}…`
    : context;
}

function shouldPreloadOfficialTrailSources(prompt: string): boolean {
  return /\b(weather|forecast|alert|closure|closed|detour|reroute|burn ban|bear|storm|thunder|heat|cold|wind|flood|snow|ice|24 hours|daily trail brief|go\/no-go)\b/iu.test(prompt);
}

function renderAtRouteResourceContext(grounding: AtRouteGrounding): string {
  const pointLines = grounding.corridor.map((point, index) => {
    const fromStart = formatAtRouteMileage(Math.abs(point.mile - grounding.start.mile));
    return `${index + 1}. ${point.name} (${point.kind}, ${point.state}) route mile ${formatAtRouteMileage(point.mile)}; from start ${fromStart}${point.notes ? `; note: ${point.notes}` : ''}`;
  });

  const optionLines = grounding.planOptions.flatMap((option) => [
    `- ${option.label}: ${formatAtRouteMileage(option.totalMiles)} mi total`,
    ...option.days.map((day) => `  Day ${day.day}: ${day.from.name} → ${day.to.name}, ${formatAtRouteMileage(day.miles)} mi. ${day.note}`),
    ...option.caveats.map((caveat) => `  Caveat: ${caveat}`)
  ]);

  return [
    'Scout route resource for this turn:',
    `Source: ${grounding.source.label} [${grounding.source.authority}]`,
    `Citation: ${grounding.source.citation}`,
    `Use limit: ${grounding.source.exactMileageCaveat}`,
    `Direction: ${grounding.direction}`,
    grounding.destination
      ? `Corridor: ${grounding.start.name} → ${grounding.destination.name}`
      : `Corridor starts at ${grounding.start.name}`,
    grounding.targetDays ? `Requested/derived trip length: ${grounding.targetDays} day(s)` : null,
    'Route-order anchors:',
    pointLines.join('\n'),
    optionLines.length > 0 ? `Suggested resource-derived route shapes:\n${optionLines.join('\n')}` : null,
    grounding.warnings.length > 0 ? `Resource caveats:\n${grounding.warnings.map((warning) => `- ${warning}`).join('\n')}` : null,
    grounding.blockedEndpointNames.length > 0 ? `Blocked endpoint names for this prompt: ${grounding.blockedEndpointNames.join(', ')}` : null,
    'Validation-pass rule: before giving day-by-day logistics, state the validation result in normal trail language: route order, rough mileage split, practical access point(s) and confidence, legal overnight status, water, parking/shuttle, and weather. If any safety-critical item is missing, label the day-by-day as draft/uncommitted rather than final.',
    'Grounding rule: this is a deterministic resource, not an answer. Use it to improve route order, legal/safety caveats, and source receipts; generate the response yourself and say what still needs current official/user-owned verification.'
  ].filter((line): line is string => Boolean(line)).join('\n');
}

function buildPreloadedRouteResourceContext(prompt: string, record: WorkspaceRecord): string | null {
  if (!skillEnabled(record, 'at-mile-marker-reference')) return null;
  const grounding = buildAtRouteGrounding({ prompt });
  if (!grounding) return null;

  const context = renderAtRouteResourceContext(grounding);
  return context.length > SCOUT_PRELOADED_ROUTE_RESOURCE_MAX_CHARS
    ? `${context.slice(0, SCOUT_PRELOADED_ROUTE_RESOURCE_MAX_CHARS - 1).trimEnd()}…`
    : context;
}

interface PreloadedOfficialSourcePayload {
  readonly context: string;
  readonly details: OfficialTrailSourceCheckDetails;
}

async function buildPreloadedOfficialSourcePayload(prompt: string, record: WorkspaceRecord, dadPilotSummary: DadPilotSummary | null): Promise<PreloadedOfficialSourcePayload | null> {
  if (!skillEnabled(record, 'official-trail-sources')) return null;
  if (!shouldPreloadOfficialTrailSources(prompt)) return null;

  const useDadLocation = promptAsksForDadPilotContext(prompt);
  const profilePoint = useDadLocation ? null : await profileCoordinates(record);

  const details = await checkOfficialTrailSources(
    {
      query: prompt,
      source: 'auto',
      state: record.profile ? approximateAtStateForMile(record.profile.currentMile) : null,
      latitude: profilePoint?.latitude ?? null,
      longitude: profilePoint?.longitude ?? null,
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
    ? { context: `${context.slice(0, SCOUT_PRELOADED_OFFICIAL_MAX_CHARS - 1).trimEnd()}…`, details }
    : { context, details };
}

function buildOfficialSourceReceipts(details: OfficialTrailSourceCheckDetails): WorkspaceClawSourceReceipt[] {
  const receipts: WorkspaceClawSourceReceipt[] = [];

  if (details.weather) {
    receipts.push({
      label: 'NWS forecast and alerts',
      status: `fetched ${details.fetchedAt}; ${details.weather.label}; ${details.weather.forecastUrl ?? details.weather.pointUrl}`,
      kind: 'weather'
    });
  }

  if (details.atcUpdates.length > 0 || details.source === 'atc' || details.source === 'auto') {
    receipts.push({
      label: 'ATC Trail Updates',
      status: `fetched ${details.fetchedAt}; ${details.atcUpdates.length} match${details.atcUpdates.length === 1 ? '' : 'es'}`,
      kind: 'official'
    });
  }

  if (details.skipped.length > 0 || details.errors.length > 0) {
    receipts.push({
      label: 'Official source gaps',
      status: [...details.skipped, ...details.errors].join(' ').slice(0, 220),
      kind: 'official'
    });
  }

  return receipts;
}

function excerpt(value: string, maxLength: number): string {
  const normalized = value.replace(/\s+/gu, ' ').trim();
  if (normalized.length <= maxLength) return normalized;
  return `${normalized.slice(0, maxLength - 1).trimEnd()}…`;
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
      reasoning: true,
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

function applyOpenCodeGoPayloadCompat(payload: unknown, thinkingEffort: ScoutThinkingEffort): unknown {
  if (!payload || typeof payload !== 'object') return payload;

  const params = payload as {
    thinking?: { type: 'enabled' };
    reasoning_effort?: string;
    max_tokens?: number;
    max_completion_tokens?: number;
  };

  // Use OpenCode Go's native model thinking instead of a simulated scratchpad when requested.
  // Do not expose raw reasoning text to hikers; stream only activity/status signals.
  if (thinkingEffort === 'off') {
    delete params.thinking;
    delete params.reasoning_effort;
  } else {
    params.thinking = { type: 'enabled' };
    params.reasoning_effort = thinkingEffort;
  }

  // The OpenAI-compatible DeepSeek lane honors max_tokens. Keep an explicit
  // output budget so native thinking does not consume the entire visible reply.
  if (typeof params.max_completion_tokens === 'number' && typeof params.max_tokens !== 'number') {
    params.max_tokens = params.max_completion_tokens;
    delete params.max_completion_tokens;
  }

  return params;
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


function buildLocationHistoryContext(record: WorkspaceRecord): string {
  const history = record.locationHistory ?? [];
  if (history.length === 0) return 'Recent GPS fixes: none logged.';
  const latest = history.at(-1);
  const recent = history.slice(-6).map((fix) => (
    `${fix.recordedAt}: AT mile ${fix.nearestMile.toFixed(1)} (${fix.distanceToTrailMiles.toFixed(2)} mi from trail, accuracy ${fix.accuracyMeters !== null ? `${Math.round(fix.accuracyMeters)}m` : 'unknown'})`
  ));
  const oldest = history.at(0);
  const progress = oldest && latest
    ? `Logged trail progress: ${oldest.nearestMile.toFixed(1)} → ${latest.nearestMile.toFixed(1)} over ${history.length} useful fixes.`
    : null;

  return [
    latest ? `Latest GPS fix: ${latest.recordedAt}, nearest AT mile ${latest.nearestMile.toFixed(1)}, ${latest.distanceToTrailMiles.toFixed(2)} mi from trail.` : null,
    progress,
    `Recent useful GPS fixes: ${recent.join(' | ')}`
  ].filter((line): line is string => Boolean(line)).join('\n');
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
  const docs = record.documents.slice(0, 6).map((document) => `${document.title} (/app/docs/${encodeURIComponent(document.id)})`);
  const resources = record.resources.slice(0, 6).map((resource) => `${resource.title} (/app/resources#resource-${encodeURIComponent(resource.id)})`);
  const tools = record.tools.slice(0, 6).map((tool) => tool.title);
  const dadPilotContext = buildDadPilotSystemContext(dadPilotSummary ?? null);
  const skillContext = buildScoutSkillPromptContext(record.skillSettings);
  const officialSourcesEnabled = skillEnabled(record, 'official-trail-sources');
  const webResearchEnabled = skillEnabled(record, 'web-research');

  return [
    'You are Scout, Hogg Country\'s private trail delegate for a single hiker.',
    'Be direct, practical, calm, and trail-first.',
    'Use short useful answers. If context is thin, still give a safe beginner baseline, then ask only the one or two details that actually change the next decision.',
    'Do not require the hiker to arrive with a complete profile, guidebook, mileage source, or perfect prep. Build from almost nothing, infer cautiously from the conversation, and suggest optional artifacts only when they would materially improve the plan.',
    'Do not roleplay. Do not oversell certainty. Prefer concrete next actions over generic encouragement.',
    'Use private reasoning to understand the hiker\'s intent before answering. Do not expose your reasoning, tool plan, source-search process, validator names, or phrases like “let me catalog/search/pull.” Do the work silently, then answer naturally.',
    'When context conflicts, honor the user\'s obvious intent first. Mention stale GPS/profile/doc conflicts only when they change the decision. Do not let a stale profile mile dominate a clearly stated hypothetical or future section plan.',
    SCOUT_VOICE_EXAMPLES,
    '',
    `Hiker name: ${record.betaProfile.name || 'Unknown'}`,
    `Trail name: ${record.betaProfile.trailName || 'Unknown'}`,
    `Workspace id: ${record.workspaceId}`,
    buildCurrentDateAuthority(),
    profile
      ? `Profile: start ${profile.startDate || 'unknown'}, current mile ${Number.isFinite(profile.currentMile) ? profile.currentMile.toFixed(1) : 'unknown'}, last updated ${profile.updatedAt || 'unknown'}, direction ${profile.direction || 'unknown'}, target pace ${profile.targetPace || 0} mpd.`
      : 'Profile: not initialized yet.',
    buildLocationHistoryContext(record),
    notes.length > 0 ? `Manual notes: ${notes.join(' | ')}` : 'Manual notes: none yet.',
    dadPilotContext,
    docs.length > 0 ? `Saved docs: ${docs.join(', ')}` : 'Saved docs: none yet.',
    resources.length > 0 ? `Private resources: ${resources.join(', ')}` : 'Private resources: none yet.',
    tools.length > 0 ? `Available tools/checklists: ${tools.join(', ')}` : 'Available tools/checklists: none yet.',
    skillContext,
    'Be especially good at itinerary planning, loadout choices, food-carry limits, resupply timing, budget tradeoffs, health/body tracking, hostel or town sequencing, and turning rough trail constraints into usable plans.',
    'Before answering research-like questions, use the provided Scout source search context. Separate what is searchable-now from what still needs an official/direct live check or user import.',
    liveToolsAvailable
      ? 'You also have a catalog_scout_sources tool. Use it first when you need to decide which source lane applies, what Scout can use now, and what source must be imported or live-checked before a factual answer.'
      : 'This runtime may provide preloaded source-catalog context instead of live tool calls; use the context you have and clearly name missing source lanes.',
    liveToolsAvailable
      ? 'You also have get_current_datetime, resolve_location, get_weather_forecast, get_weather_alerts, and plan_segment tools. Use get_current_datetime for date disputes or relative-date labels, resolve_location before location-dependent fetches, get_weather_forecast for all current/future forecast details, get_weather_alerts for alert claims, and plan_segment for route/day logistics.'
      : 'This runtime may provide preloaded date, source, official-weather, and route context instead of live tool calls; use only that context for current facts and clearly name missing fetches.',
    liveToolsAvailable
      ? 'You also have a search_scout_sources tool. Use it when the user asks a research/planning question and the provided context is too thin, too broad, or needs a narrower location/topic search.'
      : 'This runtime may provide preloaded source-search context instead of live tool calls; use the context you have and clearly name missing searches.',
    liveToolsAvailable && webResearchEnabled
      ? 'You also have a research_web tool. Use it for current public web research that is not covered by private workspace search, route validation, or dedicated official trail/weather tools. Prefer allowedDomains for source-sensitive questions. Do not use it for private, local, loopback, intranet, or user-secret URLs.'
      : webResearchEnabled
        ? 'This runtime does not expose live web research tools; if general web evidence is needed, say that web research requires service connectivity.'
        : 'Web Research skill is disabled for this workspace; do not claim general internet research or cite fresh public web pages unless the user asks to enable that skill.',
    liveToolsAvailable && officialSourcesEnabled
      ? 'You also have a check_official_trail_sources tool. Use it for safety-sensitive current conditions: closures, detours, burn bans, bear warnings, storms, heat/cold, wind, flood risk, snow/ice, and other live ATC/NWS checks. For weather, call it; it can use explicit coordinates, the workspace profile current AT mile, or useDadLocation when the question is about Dad and the public Garmin fix is relevant.'
      : officialSourcesEnabled
        ? 'This runtime may provide preloaded official-source context instead of live tool calls; never imply live certainty beyond the named preloaded sources.'
        : 'Official Trail Sources skill is disabled for this workspace; do not call or imply official live-source retrieval unless the user asks to enable that skill.',
    'Claim gating: current datetime/date labels must come from the injected Current date authority or get_current_datetime only. Current/future weather, active alerts, and “no alerts” claims must come from get_weather_forecast, get_weather_alerts, check_official_trail_sources, or preloaded official-source context from this turn. If that evidence is missing, answer with the missing-source caveat and no forecast specifics.',
    'General current internet claims must come from research_web, a supplied user source, private workspace context, or preloaded source context. Cite source title, URL, and fetchedAt when using web research. For weather and safety-sensitive AT conditions, prefer get_weather_forecast/get_weather_alerts/check_official_trail_sources over general web search.',
    'For weather, closures, water reliability, and same-day town logistics, do not pretend to have live certainty unless a source was actually supplied. Do not say “fetched just now,” “NWS says,” or similar unless get_weather_forecast, get_weather_alerts, check_official_trail_sources, or preloaded official-source context returned that exact source this turn. If the tool/source is missing, say what is missing instead of filling the gap.',
    'For route planning, distinguish route shape from confirmed facts. It is fine to give a useful corridor, start/end options, and approximate mileages, but label exact mileages, legal camping, parking, shuttles, water, and service hours as verify-against-current-guide/direct-source items until the hiker supplies or fetches that source.',
    'Before giving day-by-day route logistics, do a quiet route validation pass and then summarize the result plainly: route order, rough mileage split, practical access point confidence, legal overnight status, water, parking/shuttle, and weather. If that pass is incomplete, say the itinerary is a draft shape and name the missing checks before commitment.',
    'For Harpers Ferry / Maryland / DC-family logistics, wrong mileage is the dangerous failure mode. Do not repeat old or suspicious mileage splits; call out corrected rough splits and require current guide/direct-source verification before Dad/family/shuttle decisions.',
    'For Maryland overnight anchors such as Ed Garvey Memorial Shelter, Dahlgren Backpack Campground, Gathland/Crampton Gap, or South Mountain, do not guess permit/reservation status. Use the exact posture: “I need to check current Maryland camping rules before recommending an overnight.” Then list the current rule/water/access checks needed.',
    'For Bears Den / VA 7 / Snickers Gap access, do not say only that road crossings are tricky. Name the practical option and confidence: Keys Gap/VA-WV 9 is the higher-confidence Dad-friendly Harpers Ferry finish access; Bears Den/VA 7/Snickers Gap is a longer south-side option needing parking/shuttle/overnight-parking confirmation; Weverton and Gathland/Dahlgren are Maryland access/endpoint candidates needing current parking and pickup confirmation.',
    'When a user describes miles before/after a named waypoint, keep the math honest: compute the rough corridor around that waypoint, do not conflate a shorter access-friendly segment with the full requested distance, and call out any shortcut as a separate option. Example: if the user asks for 15 miles leading into a town, do not treat a 6-mile road-crossing approach as the whole 15-mile lead-in.',
    'When a family member, shuttle, city side trip, or section-hike handoff is part of the plan, default to the practical questions that change the route: who carries water/snacks, month/weather window, and who has the car or shuttle after the side trip. Ask them conversationally, not as a form, and offer to keep it informal or save it into the 7-day plan/loadout only when useful.',
    'When the route resource gives internal QA mile anchors, use them to keep landmarks in the right order and avoid impossible routes; do not present those mileages as final guidebook truth. Say “planning estimate” or “roughly” when exact current mileage has not been supplied.',
    'Use sources as quiet grounding, not as the answer structure. Source receipts belong near the end, short and human-readable, unless the user asks for audit details.',
    'Do not return deterministic or hardwired planning answers. If the user asks for something deterministic, point them to the relevant saved docs, resources, source-search hits, or official source lanes by title and link, then explain what those documents can and cannot prove.',
    'For current-position questions, use the hiker profile current mile and its updatedAt timestamp as the first location signal. If the mile is 0/unset, stale, or does not match the question, ask the hiker to tap the current-location/GPS button or send the road crossing/AT mile; do not guess where they are.',
    scoutSourceContext,
    'Treat saved assistant-generated documents as living Scout documents, not one-off files. The user wants Scout to keep them current through conversation.',
    'When asked for a plan, prefer a compact artifact with current snapshot, assumptions, day-by-day or category breakdown, concrete next actions, and missing intel that would tighten the answer.',
    'For real-world AT planning, keep the tone natural. Use the dependable safety skeleton as coverage, not rigid headings: recommendation, route/day shape, mileage targets, logistics/parking/shuttle, water, weather, legal overnight/camping when relevant, bailout, final checklist, and source receipts or missing-source caveats.',
    'When revising a saved document, preserve useful existing structure, update stale facts, add a brief change-history note, and return the full revised document body.',
    skillEnabled(record, 'private-workspace-resources')
      ? buildActiveResourceContext(activeResource)
      : activeResource
        ? 'Private Workspace Resources skill is disabled; do not use the attached private resource content unless the user asks to enable that skill.'
        : null,
    activeDocument
      ? !skillEnabled(record, 'private-workspace-resources') && activeDocument.rights !== 'assistant-generated'
        ? 'Private Workspace Resources skill is disabled; do not use the attached private imported document unless the user asks to enable that skill.'
        : activeDocument.rights === 'assistant-generated'
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
    .slice(-SCOUT_STORED_HISTORY_MESSAGES);
}

function mergeClawMessageHistory(
  existing: readonly WorkspaceClawMessage[],
  next: readonly WorkspaceClawMessage[]
): WorkspaceClawMessage[] {
  const byId = new Map<string, WorkspaceClawMessage>();
  for (const message of [...existing, ...next]) {
    byId.set(message.id, message);
  }

  return [...byId.values()]
    .sort((left, right) => toTimestamp(left.createdAt) - toTimestamp(right.createdAt))
    .slice(-SCOUT_STORED_HISTORY_MESSAGES);
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

export async function replyInWorkspaceClaw(
  workspaceId: string,
  betaProfile: BetaProfileCookie,
  prompt: string,
  options?: {
    readonly documentId?: string | null;
    readonly resourceId?: string | null;
    readonly thinkingEffort?: ScoutThinkingEffort;
    readonly onPhase?: (phase: { phase: string; label: string; detail?: string }) => void | Promise<void>;
    readonly onSourceReceipts?: (receipts: readonly { label: string; status: string; kind: string }[]) => void | Promise<void>;
    readonly onTextDelta?: (delta: string) => void | Promise<void>;
    readonly onThinkingActivity?: (activity: { status: 'start' | 'delta' | 'end'; chars?: number }) => void | Promise<void>;
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

  await options?.onPhase?.({ phase: 'workspace', label: 'Reading workspace', detail: 'Loading private profile, docs, resources, and recent Scout messages.' });
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

  await options?.onPhase?.({ phase: 'provider', label: 'Checking Scout connection', detail: 'Selecting the configured model lane without exposing provider secrets.' });
  const runtime = await resolveClawRuntime(record);
  const thinkingEffort = normalizeScoutThinkingEffort(options?.thinkingEffort);
  const dadPilotSummary = shouldIncludeDadPilotContext(record, trimmedPrompt) ? await loadDadPilotSummary().catch(() => null) : null;
  const dateAuthority = buildCurrentDatetimeDetails();
  await options?.onPhase?.({ phase: 'sources', label: 'Checking source lanes', detail: 'Looking for private notes, route guardrails, and official-source opportunities.' });
  const preloadedOfficial = runtime.providerId === OPENCODE_GO_PROVIDER_ID
    ? await buildPreloadedOfficialSourcePayload(trimmedPrompt, record, dadPilotSummary)
    : null;
  const sourceContexts = [
    buildScoutSourcePlanContext(record, trimmedPrompt),
    buildScoutSourceContext(record, dadPilotSummary, trimmedPrompt),
    buildPreloadedRouteResourceContext(trimmedPrompt, record),
    preloadedOfficial?.context ?? null
  ].filter((context): context is string => Boolean(context));

  const sourceReceipts = [
    { label: 'Current datetime', status: `${dateAuthority.today.label}; fetched ${dateAuthority.fetchedAt}; ${dateAuthority.timezone}`, kind: 'time' },
    record.documents.length > 0 ? { label: 'Private Docs', status: `${record.documents.length} saved`, kind: 'workspace' } : null,
    record.resources.length > 0 ? { label: 'Private Resources', status: `${record.resources.length} available`, kind: 'workspace' } : null,
    sourceContexts.some((context) => context.includes('Scout route resource')) ? { label: 'AT route guardrails', status: 'loaded for validation', kind: 'route' } : null,
    sourceContexts.some((context) => context.includes('Scout source catalog')) ? { label: 'Scout source catalog', status: 'planned', kind: 'catalog' } : null,
    skillEnabled(record, 'web-research') ? { label: 'Web research', status: 'available when online', kind: 'web' } : null,
    ...(preloadedOfficial ? buildOfficialSourceReceipts(preloadedOfficial.details) : [])
  ].filter((receipt): receipt is WorkspaceClawSourceReceipt => receipt !== null);
  if (sourceReceipts.length > 0) {
    await options?.onSourceReceipts?.(sourceReceipts);
  }

  const baseSourceContext = sourceContexts.length > 0 ? sourceContexts.join('\n\n') : null;
  const turnDeadline = Date.now() + SCOUT_AGENT_TURN_TIMEOUT_MS;
  const runAgentPrompt = async (
    history: readonly WorkspaceClawMessage[],
    extraSystemInstruction: string | null = null
  ): Promise<{ nextMessages: WorkspaceClawMessage[]; reply: WorkspaceClawMessage | undefined }> => {
    const sourceContext = [baseSourceContext, extraSystemInstruction].filter(Boolean).join('\n\n') || null;
    const agentTools = runtime.providerId === OPENCODE_GO_PROVIDER_ID
      ? []
      : [
          buildCurrentDatetimeTool(),
          buildResolveLocationTool(record, dadPilotSummary),
          skillEnabled(record, 'official-trail-sources') ? buildWeatherForecastTool(record, dadPilotSummary) : null,
          skillEnabled(record, 'official-trail-sources') ? buildWeatherAlertsTool(record, dadPilotSummary) : null,
          skillEnabled(record, 'at-mile-marker-reference') ? buildPlanSegmentTool(record) : null,
          buildScoutSourceCatalogTool(record),
          buildScoutSourceSearchTool(record, dadPilotSummary),
          skillEnabled(record, 'web-research') ? buildWebResearchTool() : null,
          skillEnabled(record, 'official-trail-sources') ? buildOfficialTrailSourceTool(record, dadPilotSummary) : null
        ].filter((tool): tool is AgentTool<any, any> => tool !== null);
    const agent = new Agent({
      initialState: {
        systemPrompt: buildSystemPrompt(
          record,
          activeDocument,
          dadPilotSummary,
          sourceContext,
          runtime.providerId !== OPENCODE_GO_PROVIDER_ID,
          activeResource
        ),
        model: runtime.model,
        thinkingLevel: runtime.providerId === OPENCODE_GO_PROVIDER_ID ? thinkingEffort : 'medium',
        tools: agentTools,
        messages: history.map(toPiMessage)
      },
      sessionId: `workspace:${workspaceId}:claw`,
      transport: 'sse',
      getApiKey: async () => runtime.apiKey,
      onPayload: runtime.providerId === OPENCODE_GO_PROVIDER_ID ? (payload) => applyOpenCodeGoPayloadCompat(payload, thinkingEffort) : undefined
    });

    if (options?.onTextDelta || options?.onThinkingActivity) {
      agent.subscribe(async (event: AgentEvent) => {
        if (event.type !== 'message_update') return;
        const update = event.assistantMessageEvent as { type?: string; delta?: unknown; content?: unknown };

        if (update.type === 'text_delta' && typeof update.delta === 'string' && update.delta.length > 0) {
          await options.onTextDelta?.(update.delta);
          return;
        }

        if (update.type === 'thinking_start') {
          await options.onThinkingActivity?.({ status: 'start' });
          return;
        }

        if (update.type === 'thinking_delta') {
          await options.onThinkingActivity?.({
            status: 'delta',
            chars: typeof update.delta === 'string' ? update.delta.length : 0
          });
          return;
        }

        if (update.type === 'thinking_end') {
          await options.onThinkingActivity?.({ status: 'end' });
        }
      });
    }

    await options?.onPhase?.({ phase: 'model', label: 'Asking Scout', detail: sourceContext ? 'The model is answering with the selected context and validation guardrails.' : 'The model is answering from the private conversation context.' });
    await withScoutAgentTimeout(agent.prompt(trimmedPrompt), turnDeadline - Date.now());

    const nextMessages = simplifyMessages(agent.state.messages as Message[]);
    const reply = nextMessages.at(-1);
    return { nextMessages, reply };
  };

  const history = runtime.providerId === OPENCODE_GO_PROVIDER_ID ? record.clawMessages.slice(-SCOUT_MODEL_HISTORY_MESSAGES) : record.clawMessages;
  let nextMessages: WorkspaceClawMessage[];
  let reply: WorkspaceClawMessage | undefined;
  ({ nextMessages, reply } = await runAgentPrompt(history));

  if ((!reply || reply.role !== 'assistant' || reply.error) && runtime.providerId === OPENCODE_GO_PROVIDER_ID) {
    const retry = await runAgentPrompt(
      [],
      'Retry mode: the previous model call did not produce a usable assistant answer. Answer from the private workspace/source context above, keep the response concise, and do not invent missing source facts.'
    );
    nextMessages = mergeClawMessageHistory(record.clawMessages, retry.nextMessages);
    reply = retry.reply;
  }

  if (!reply || reply.role !== 'assistant') {
    throw new Error('Pi agent did not return an assistant reply.');
  }

  if (runtime.credentials) {
    await saveWorkspaceOpenAICodexConnection(workspaceId, betaProfile, {
      encryptedCredentials: encryptProviderJson(runtime.credentials),
      accountId: runtime.credentials.accountId ?? null,
      expiresAt: new Date(runtime.credentials.expires).toISOString(),
      label: runtime.credentials.label ?? null
    });
  }

  await options?.onPhase?.({ phase: 'saving', label: 'Saving answer', detail: 'Persisting the turn into the private workspace.' });
  const persistedMessages = mergeClawMessageHistory(record.clawMessages, nextMessages);
  const messagesWithReceipts = sourceReceipts.length > 0
    ? persistedMessages.map((message) => message.id === reply.id && message.role === 'assistant'
        ? { ...message, sourceReceipts }
        : message)
    : persistedMessages;
  let workspace = await replaceWorkspaceClawMessages(workspaceId, betaProfile, messagesWithReceipts);
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
