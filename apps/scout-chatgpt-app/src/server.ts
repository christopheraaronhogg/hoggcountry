import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { readFile } from 'node:fs/promises';

import { publicCorpus, searchPublicCorpus, type PublicCorpusEntry } from '@hoggcountry/corpus';
import {
  STANDARD_DOCUMENT_SLOTS,
  standardDocumentSlotForKey,
  type Direction,
  type ManualProfile,
  type ShelterPreference,
  type StandardDocumentSlotKey,
} from '@hoggcountry/manual-core';
import {
  buildPlanLanes,
  buildTodayCards,
  getTrailPhase,
  TRAIL_FACTS,
} from '@hoggcountry/trail-data';
import { registerAppResource, registerAppTool, RESOURCE_MIME_TYPE } from '@modelcontextprotocol/ext-apps/server';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { z } from 'zod/v3';
import {
  atReferenceCorpus,
  buildReferenceSnapshot,
  buildSectionReference,
  findTrailReferenceContext,
  REFERENCE_CATEGORIES,
  type ReferenceCategory,
} from './at-reference.ts';

const PORT = Number(process.env.PORT ?? 8787);
const SITE_ORIGIN = process.env.PUBLIC_SITE_ORIGIN ?? 'https://hoggcountry.com';
const WIDGET_URI = 'ui://scout/today.html';
const WIDGET_HTML_URL = new URL('../public/scout-widget.html', import.meta.url);
const scoutKnowledgeCorpus: readonly PublicCorpusEntry[] = [...publicCorpus, ...atReferenceCorpus];
const READ_ONLY_LOCAL_ANNOTATIONS = {
  readOnlyHint: true,
  idempotentHint: true,
  destructiveHint: false,
  openWorldHint: false,
} as const;

const directionSchema = z.enum(['NOBO', 'SOBO']);
const shelterPreferenceSchema = z.enum(['tent-first', 'shelter-first', 'mixed']);
const referenceCategorySchema = z.enum(REFERENCE_CATEGORIES);
const documentSlotSchema = z.enum(
  STANDARD_DOCUMENT_SLOTS.map((slot) => slot.key) as [StandardDocumentSlotKey, ...StandardDocumentSlotKey[]],
);

const trailContextInput = {
  currentMile: z.number().min(0).max(TRAIL_FACTS.totalMiles).default(0),
  direction: directionSchema.default('NOBO'),
  targetPace: z.number().min(1).max(35).default(12),
  zeroDaysPerMonth: z.number().min(0).max(12).default(4),
  waterCapacityLiters: z.number().min(0.5).max(8).default(2),
  shelterPreference: shelterPreferenceSchema.default('mixed'),
  healthNotes: z.string().max(600).default(''),
};

type TrailContext = {
  currentMile: number;
  direction: Direction;
  targetPace: number;
  zeroDaysPerMonth: number;
  waterCapacityLiters: number;
  shelterPreference: ShelterPreference;
  healthNotes: string;
};

type DayPlanContext = TrailContext & {
  effort: 'conservative' | 'standard' | 'push';
};

type ResupplyContext = TrailContext & {
  query: string;
};

type NearbyTrailContext = {
  currentMile: number;
  direction: Direction;
  radiusMiles: number;
  categories: ReferenceCategory[];
  forwardOnly: boolean;
  state?: string;
};

type SectionPlanContext = {
  startMile: number;
  endMile: number;
  direction: Direction;
  targetPace: number;
  waterCapacityLiters: number;
  shelterPreference: ShelterPreference;
  state?: string;
};

type DraftDocumentContext = TrailContext & {
  slotKey: StandardDocumentSlotKey;
  notes: string;
  state?: string;
};

type ToolHandler<TArgs> = (args: TArgs) => unknown | Promise<unknown>;

function textContent(text: string) {
  return [{ type: 'text' as const, text }];
}

function registerScoutTool<TArgs>(
  server: McpServer,
  name: string,
  config: Record<string, unknown>,
  handler: ToolHandler<TArgs>,
): void {
  const registerTool = server.registerTool as unknown as (
    toolName: string,
    toolConfig: Record<string, unknown>,
    toolHandler: ToolHandler<TArgs>,
  ) => void;

  registerTool.call(server, name, config, handler);
}

function registerScoutAppTool<TArgs>(
  server: McpServer,
  name: string,
  config: Record<string, unknown>,
  handler: ToolHandler<TArgs>,
): void {
  const registerTool = registerAppTool as unknown as (
    mcpServer: McpServer,
    toolName: string,
    toolConfig: Record<string, unknown>,
    toolHandler: ToolHandler<TArgs>,
  ) => void;

  registerTool(server, name, config, handler);
}

function absoluteUrl(href: string): string {
  return new URL(href, SITE_ORIGIN).toString();
}

function makeProfile(context: TrailContext): ManualProfile {
  const now = new Date().toISOString();

  return {
    id: 'chatgpt-session',
    trailName: 'Appalachian Trail',
    startDate: now.slice(0, 10),
    direction: context.direction,
    currentMile: context.currentMile,
    targetPace: context.targetPace,
    zeroDaysPerMonth: context.zeroDaysPerMonth,
    budgetTier: 'balanced',
    experienceLevel: 'some-backpacking',
    gearPhilosophy: 'balanced',
    townStyle: 'balanced',
    reflectionStyle: 'practical-only',
    shelterPreference: context.shelterPreference,
    waterCapacityLiters: context.waterCapacityLiters,
    healthNotes: context.healthNotes,
    createdAt: now,
    updatedAt: now,
  };
}

function moveMile(currentMile: number, direction: Direction, miles: number): number {
  if (direction === 'SOBO') return Math.max(0, currentMile - miles);
  return Math.min(TRAIL_FACTS.totalMiles, currentMile + miles);
}

function routeLabel(direction: Direction): string {
  return `Appalachian Trail - ${direction}`;
}

function buildBrief(profile: ManualProfile) {
  const phase = getTrailPhase(profile.currentMile);
  const cards = buildTodayCards(profile);
  const cardById = new Map(cards.map((card) => [card.id, card]));

  const waterCard = cardById.get('water');
  const paceCard = cardById.get('pace');
  const shelterCard = cardById.get('shelter');
  const nextPhaseCard = cardById.get('next-phase');

  return {
    routeLabel: routeLabel(profile.direction),
    currentMile: profile.currentMile,
    phaseLabel: phase.label,
    generatedAt: new Date().toISOString(),
    cues: [
      {
        label: 'Phase',
        value: phase.label,
        detail: phase.focus,
        tone: 'steady' as const,
      },
      {
        label: 'Water',
        value: `${profile.waterCapacityLiters.toFixed(1)}L carry`,
        detail: waterCard?.detail ?? 'Confirm the next reliable fill before leaving camp or town.',
        tone: 'action' as const,
      },
      {
        label: 'Pace',
        value: `${profile.targetPace} mi/day`,
        detail: paceCard?.detail ?? 'Protect consistency before pushing mileage.',
        tone: 'caution' as const,
      },
      {
        label: 'Sleep',
        value: profile.shelterPreference.replace('-', ' '),
        detail: shelterCard?.detail ?? 'Pick the overnight option that protects sleep and decision quality.',
        tone: 'steady' as const,
      },
    ],
    actions: [
      nextPhaseCard?.detail ?? 'Check the next terrain shift before committing to a bigger mileage day.',
      'Confirm weather, closures, water reports, and town services with live sources before field reliance.',
      'Ask Scout to fetch any cited Hogg Country guide document before treating a planning detail as sourced.',
    ],
    sourceReceipts: [
      { label: 'Hogg Country trail phase model', status: 'local deterministic source' },
      { label: 'AT core facts audit', status: `last verified ${TRAIL_FACTS.lastVerified}` },
      { label: 'Current conditions', status: 'not live yet - user must confirm' },
    ],
  };
}

function referenceCategoriesForSlot(slotKey: StandardDocumentSlotKey): ReferenceCategory[] {
  switch (slotKey) {
    case 'current-plan':
      return ['water', 'shelters', 'campsites', 'resupply', 'terrain', 'live-sources'];
    case 'seven-day-plan':
      return ['water', 'shelters', 'campsites', 'resupply', 'terrain'];
    case 'resupply-plan':
      return ['resupply', 'trailheads', 'water', 'live-sources'];
    case 'gear-body-notes':
      return ['terrain', 'live-sources'];
    case 'safety-risk-brief':
      return ['terrain', 'rules', 'live-sources'];
    case 'hiker-profile':
    default:
      return ['terrain', 'live-sources'];
  }
}

function buildDraftDocument(context: DraftDocumentContext) {
  const slot = standardDocumentSlotForKey(context.slotKey);
  const profile = makeProfile(context);
  const categories = referenceCategoriesForSlot(context.slotKey);
  const reference = findTrailReferenceContext({
    currentMile: profile.currentMile,
    direction: profile.direction,
    radiusMiles: context.slotKey === 'seven-day-plan' ? profile.targetPace * 7 : Math.max(8, profile.targetPace),
    categories,
    forwardOnly: context.slotKey !== 'hiker-profile' && context.slotKey !== 'gear-body-notes',
    state: context.state,
    limit: 6,
  });

  return {
    slotKey: context.slotKey,
    title: slot?.title ?? context.slotKey,
    purpose: slot?.purpose ?? 'Scout planning document',
    summary: `Draft ${slot?.shortTitle ?? context.slotKey} for ${routeLabel(profile.direction)} around NOBO mile ${profile.currentMile.toFixed(1)}.`,
    stableFacts: [
      `Direction: ${profile.direction}`,
      `Current NOBO mile marker: ${profile.currentMile.toFixed(1)}`,
      `Planning pace: ${profile.targetPace} mi/day`,
      `Water capacity: ${profile.waterCapacityLiters.toFixed(1)}L`,
      `Shelter preference: ${profile.shelterPreference}`,
      context.notes ? `User notes: ${context.notes}` : undefined,
    ].filter(Boolean),
    workingPlan: [
      'Use Hogg Country guide/corpus documents for narrative planning context.',
      'Use the AT open reference pack for candidate water, overnight, town, terrain, and rule leads.',
      'Separate generated candidate data from live/official checks before making field commitments.',
    ],
    referenceContext: reference,
    openQuestions: slot?.starterQuestions ?? [
      'What source-backed facts are missing?',
      'What live checks must happen before the hiker depends on this?',
    ],
    sourceReceipts: reference.sourceReceipts,
  };
}

function buildDayReference(profile: ManualProfile, targetMiles: number) {
  return findTrailReferenceContext({
    currentMile: profile.currentMile,
    direction: profile.direction,
    radiusMiles: Math.max(8, targetMiles + 4),
    categories: ['water', 'shelters', 'campsites', 'resupply', 'terrain', 'live-sources'],
    forwardOnly: true,
    limit: 6,
  });
}

function buildSectionDays(startMile: number, endMile: number, targetPace: number) {
  const directionSign = endMile >= startMile ? 1 : -1;
  const distance = Math.abs(endMile - startMile);
  const dayCount = Math.max(1, Math.ceil(distance / Math.max(1, targetPace)));
  const days = [];
  let cursor = startMile;

  for (let day = 1; day <= dayCount; day += 1) {
    const remaining = Math.abs(endMile - cursor);
    const travel = Math.min(targetPace, remaining);
    const next = day === dayCount ? endMile : cursor + directionSign * travel;
    const dayReference = buildSectionReference({
      startMile: Math.min(cursor, next),
      endMile: Math.max(cursor, next),
      direction: directionSign >= 0 ? 'NOBO' : 'SOBO',
      categories: ['water', 'shelters', 'campsites', 'resupply', 'terrain'],
      limit: 4,
    });

    days.push({
      day,
      startMile: Number(cursor.toFixed(1)),
      endMile: Number(next.toFixed(1)),
      targetMiles: Number(Math.abs(next - cursor).toFixed(1)),
      waterLeads: dayReference.nearby.water ?? [],
      overnightLeads: [...(dayReference.nearby.shelters ?? []), ...(dayReference.nearby.campsites ?? [])].slice(0, 4),
      resupplyLeads: dayReference.nearby.resupply ?? [],
      gradeRisks: dayReference.terrain.gradeRisks.slice(0, 3),
      note:
        'Candidate-data planning day. Confirm live weather, closures, water reliability, legal camping, and town services before relying on it.',
    });
    cursor = next;
  }

  return days;
}

function toSearchResult(entry: ReturnType<typeof searchPublicCorpus>[number]) {
  return {
    id: entry.id,
    title: entry.title,
    text: entry.excerpt,
    url: absoluteUrl(entry.href ?? '/'),
    metadata: {
      source: entry.sourceLabel,
      sourceType: entry.sourceType,
    },
  };
}

function toFetchedDocument(entry: PublicCorpusEntry) {
  return {
    id: entry.id,
    title: entry.title,
    text: [entry.description, entry.headers, entry.content].filter(Boolean).join('\n\n'),
    url: absoluteUrl(entry.href),
    metadata: {
      source: entry.sourceLabel,
    },
  };
}

async function createScoutServer(): Promise<McpServer> {
  const widgetHtml = await readFile(WIDGET_HTML_URL, 'utf8');
  const server = new McpServer(
    {
      name: 'scout-chatgpt-app',
      version: '0.2.0',
    },
    {
      capabilities: {
        resources: {},
        tools: {},
      },
    },
  );

  registerAppResource(
    server,
    'Scout Today widget',
    WIDGET_URI,
    {
      title: 'Scout Today',
      description: 'Compact Scout heads-up display for a current Appalachian Trail context.',
      _meta: {
        ui: {
          prefersBorder: true,
          csp: {
            connectDomains: [],
            resourceDomains: [],
          },
          ...(process.env.SCOUT_APP_DOMAIN ? { domain: process.env.SCOUT_APP_DOMAIN } : {}),
        },
        'openai/widgetDescription':
          'Shows a compact Scout trail companion heads-up display with current phase, pace, water, sleep, and planning checks.',
      },
    },
    async () => ({
      contents: [
        {
          uri: WIDGET_URI,
          mimeType: RESOURCE_MIME_TYPE,
          text: widgetHtml,
          _meta: {
            ui: {
              prefersBorder: true,
              csp: {
                connectDomains: [],
                resourceDomains: [],
              },
              ...(process.env.SCOUT_APP_DOMAIN ? { domain: process.env.SCOUT_APP_DOMAIN } : {}),
            },
            'openai/widgetDescription':
              'Shows a compact Scout trail companion heads-up display with current phase, pace, water, sleep, and planning checks.',
          },
        },
      ],
    }),
  );

  registerScoutTool(
    server,
    'search',
    {
      title: 'Search Hogg Country Scout knowledge',
      description:
        'Use this when the user needs source-backed Hogg Country Scout context. Searches public guide and planning documents; call fetch next for full document text.',
      inputSchema: {
        query: z.string().min(1).describe('Search query for Scout guide, planning, resupply, gear, safety, or trail context.'),
      },
      annotations: READ_ONLY_LOCAL_ANNOTATIONS,
    },
    async ({ query }: { query: string }) => {
      const structuredContent = {
        results: searchPublicCorpus(scoutKnowledgeCorpus, query).slice(0, 10).map(toSearchResult),
      };

      return {
        structuredContent,
        content: textContent(JSON.stringify(structuredContent)),
      };
    },
  );

  registerScoutTool(
    server,
    'fetch',
    {
      title: 'Fetch Hogg Country Scout document',
      description:
        'Use this when search returns a relevant Hogg Country Scout document id and the model needs the full public source text before answering.',
      inputSchema: {
        id: z.string().min(1).describe('Document id returned by search.'),
      },
      annotations: READ_ONLY_LOCAL_ANNOTATIONS,
    },
    async ({ id }: { id: string }) => {
      const entry = scoutKnowledgeCorpus.find((candidate) => candidate.id === id);
      if (!entry) {
        return {
          isError: true,
          content: textContent(`No Hogg Country Scout document found for id "${id}".`),
        };
      }

      const structuredContent = toFetchedDocument(entry);
      return {
        structuredContent,
        content: textContent(JSON.stringify(structuredContent)),
      };
    },
  );

  registerScoutTool(
    server,
    'get_trail_reference_snapshot',
    {
      title: 'Get Scout AT reference inventory',
      description:
        'Use this when the user asks what Scout can draw from, what data is available, or what caveats apply to Scout AT planning data.',
      inputSchema: {
        focus: z.enum(['inventory', 'route-caveats', 'live-sources', 'all']).default('all'),
      },
      annotations: READ_ONLY_LOCAL_ANNOTATIONS,
    },
    async ({ focus }: { focus: 'inventory' | 'route-caveats' | 'live-sources' | 'all' }) => {
      const structuredContent = {
        snapshot: buildReferenceSnapshot(focus),
      };

      return {
        structuredContent,
        content: textContent(`Scout AT reference snapshot is ready for focus "${focus}". Use the caveats and source receipts before making field claims.`),
      };
    },
  );

  registerScoutAppTool(
    server,
    'find_nearby_trail_context',
    {
      title: 'Find nearby AT context',
      description:
        'Use this when the user needs nearby or ahead-of-hiker AT context: candidate water, shelters, campsites, privies, vistas, trailheads, resupply towns, terrain, rules, or live-source pointers.',
      inputSchema: {
        currentMile: trailContextInput.currentMile.describe('Current NOBO mile marker. For SOBO hikers, still pass the NOBO mile marker.'),
        direction: directionSchema.default('NOBO'),
        radiusMiles: z.number().min(0.5).max(80).default(8),
        categories: z.array(referenceCategorySchema).default(['water', 'shelters', 'campsites', 'resupply', 'terrain']),
        forwardOnly: z.boolean().default(false).describe('When true, only return candidates ahead of the hiker in their walking direction.'),
        state: z.string().min(2).max(2).optional().describe('Optional two-letter state code for permit, fee, and camping rule summaries.'),
      },
      annotations: READ_ONLY_LOCAL_ANNOTATIONS,
      _meta: {
        ui: {
          resourceUri: WIDGET_URI,
          visibility: ['model', 'app'],
        },
        'openai/toolInvocation/invoking': 'Finding Scout trail context...',
        'openai/toolInvocation/invoked': 'Scout trail context ready.',
        'openai/outputTemplate': WIDGET_URI,
      },
    },
    async (context: NearbyTrailContext) => {
      const nearby = findTrailReferenceContext(context);
      const structuredContent = {
        nearby,
      };

      return {
        structuredContent,
        content: textContent(
          `Scout found ${Object.values(nearby.categories).reduce((count, items) => count + (items?.length ?? 0), 0)} candidate trail-context records around NOBO mile ${nearby.currentMile.toFixed(1)}. Treat them as candidate leads until current sources confirm them.`,
        ),
      };
    },
  );

  registerScoutAppTool(
    server,
    'get_today_brief',
    {
      title: 'Show Scout Today',
      description:
        'Use this when the user wants a compact trail companion heads-up display for the current AT context. Shows deterministic planning cues, not live conditions.',
      inputSchema: trailContextInput,
      annotations: READ_ONLY_LOCAL_ANNOTATIONS,
      _meta: {
        ui: {
          resourceUri: WIDGET_URI,
          visibility: ['model', 'app'],
        },
        'openai/toolInvocation/invoking': 'Building Scout Today...',
        'openai/toolInvocation/invoked': 'Scout Today ready.',
        'openai/outputTemplate': WIDGET_URI,
      },
    },
    async (context: TrailContext) => {
      const profile = makeProfile(context);
      const structuredContent = {
        brief: buildBrief(profile),
        referenceContext: buildDayReference(profile, profile.targetPace),
      };

      return {
        structuredContent,
        content: textContent(
          `Scout Today is ready for ${routeLabel(profile.direction)} mile ${profile.currentMile.toFixed(1)}. Confirm live weather, closures, water, and town details before field reliance.`,
        ),
      };
    },
  );

  registerScoutAppTool(
    server,
    'plan_next_day',
    {
      title: 'Plan next trail day',
      description:
        'Use this when the user wants a next-day AT plan scaffold from current mile, direction, pace, water carry, and sleep preference. Does not confirm live conditions.',
      inputSchema: {
        ...trailContextInput,
        effort: z.enum(['conservative', 'standard', 'push']).default('standard'),
      },
      annotations: READ_ONLY_LOCAL_ANNOTATIONS,
      _meta: {
        ui: {
          resourceUri: WIDGET_URI,
          visibility: ['model', 'app'],
        },
        'openai/toolInvocation/invoking': 'Drafting Scout day plan...',
        'openai/toolInvocation/invoked': 'Scout day plan ready.',
        'openai/outputTemplate': WIDGET_URI,
      },
    },
    async (context: DayPlanContext) => {
      const profile = makeProfile(context);
      const multiplier = context.effort === 'conservative' ? 0.75 : context.effort === 'push' ? 1.2 : 1;
      const targetMiles = Number((profile.targetPace * multiplier).toFixed(1));
      const phase = getTrailPhase(profile.currentMile);
      const planLanes = buildPlanLanes(profile);
      const endMile = moveMile(profile.currentMile, profile.direction, targetMiles);
      const referenceContext = buildDayReference(profile, targetMiles);

      const structuredContent = {
        plan: {
          kind: 'next-day',
          routeLabel: routeLabel(profile.direction),
          startMile: profile.currentMile,
          endMile,
          targetMiles,
          effort: context.effort,
          phaseLabel: phase.label,
          actions: [
            `Aim for about ${targetMiles} miles, then adjust down if terrain, weather, feet, or water reports disagree.`,
            `Use the ${phase.label} focus: ${phase.focus}`,
            ...planLanes.flatMap((lane) => lane.actions.slice(0, 1)),
          ],
          checks: [
            'Fresh weather and thunder/wind risk',
            'Water reliability and carry before the longest dry stretch',
            'Shelter/tent options before dark',
            'Known closures, fire rules, and local alerts',
          ],
          sourceReceipts: [
            { label: 'Hogg Country planning lanes', status: 'local deterministic source' },
            { label: 'AT core facts audit', status: `last verified ${TRAIL_FACTS.lastVerified}` },
            { label: 'Current conditions', status: 'not live yet - user must confirm' },
          ],
          referenceContext,
        },
      };

      return {
        structuredContent,
        content: textContent(
          `Scout drafted a ${context.effort} next-day scaffold from mile ${profile.currentMile.toFixed(1)} to ${endMile.toFixed(1)}. Confirm live weather, closures, water, and overnight details before field reliance.`,
        ),
      };
    },
  );

  registerScoutAppTool(
    server,
    'plan_next_week',
    {
      title: 'Plan next trail week',
      description:
        'Use this when the user wants a 7-day rolling AT plan scaffold with mileage targets, zero/nero pressure, and source checks. Does not confirm live conditions.',
      inputSchema: trailContextInput,
      annotations: READ_ONLY_LOCAL_ANNOTATIONS,
      _meta: {
        ui: {
          resourceUri: WIDGET_URI,
          visibility: ['model', 'app'],
        },
        'openai/toolInvocation/invoking': 'Drafting Scout week plan...',
        'openai/toolInvocation/invoked': 'Scout week plan ready.',
        'openai/outputTemplate': WIDGET_URI,
      },
    },
    async (context: TrailContext) => {
      const profile = makeProfile(context);
      const days = [];
      let cursor = profile.currentMile;
      const shouldNero = profile.zeroDaysPerMonth >= 4;

      for (let day = 1; day <= 7; day += 1) {
        const plannedMiles = shouldNero && day === 4 ? Math.max(4, profile.targetPace * 0.35) : profile.targetPace;
        const startMile = cursor;
        const endMile = moveMile(startMile, profile.direction, plannedMiles);
        days.push({
          day,
          targetMiles: Number(Math.abs(endMile - startMile).toFixed(1)),
          startMile: Number(startMile.toFixed(1)),
          endMile: Number(endMile.toFixed(1)),
          note:
            shouldNero && day === 4
              ? 'Built-in nero pressure release. Use it for resupply, laundry, charging, and body reset if the week is wearing thin.'
              : 'Normal planning day. Confirm terrain, water, and overnight options before locking it.',
        });
        cursor = endMile;
      }

      const sectionReference = buildSectionReference({
        startMile: Math.min(profile.currentMile, cursor),
        endMile: Math.max(profile.currentMile, cursor),
        direction: profile.direction,
        categories: ['water', 'shelters', 'campsites', 'resupply', 'terrain'],
        limit: 10,
      });

      const structuredContent = {
        plan: {
          kind: 'next-week',
          routeLabel: routeLabel(profile.direction),
          startMile: profile.currentMile,
          endMile: Number(cursor.toFixed(1)),
          days,
          checks: [
            'Fetch any relevant Hogg Country guide documents for the section before treating the route plan as sourced.',
            'Add live weather, official closures, water reports, and town service checks before using this in the field.',
            'Revise the plan when body notes, storms, heat, or resupply friction change the assumptions.',
          ],
          sourceReceipts: [
            { label: 'Hogg Country 7-day planning scaffold', status: 'local deterministic source' },
            { label: 'AT core facts audit', status: `last verified ${TRAIL_FACTS.lastVerified}` },
            { label: 'Current conditions', status: 'not live yet - user must confirm' },
          ],
          sectionReference,
        },
      };

      return {
        structuredContent,
        content: textContent(
          `Scout drafted a 7-day scaffold from mile ${profile.currentMile.toFixed(1)} to ${Number(cursor.toFixed(1)).toFixed(1)} with candidate reference leads and source checks.`,
        ),
      };
    },
  );

  registerScoutAppTool(
    server,
    'find_next_resupply',
    {
      title: 'Find next resupply leads',
      description:
        'Use this when the user asks about next resupply options or town-planning leads. Returns public Hogg Country source leads, not live hours or inventory.',
      inputSchema: {
        ...trailContextInput,
        query: z.string().min(1).default('resupply').describe('Optional resupply search query.'),
      },
      annotations: READ_ONLY_LOCAL_ANNOTATIONS,
      _meta: {
        ui: {
          resourceUri: WIDGET_URI,
          visibility: ['model', 'app'],
        },
        'openai/toolInvocation/invoking': 'Finding Scout resupply leads...',
        'openai/toolInvocation/invoked': 'Scout resupply leads ready.',
        'openai/outputTemplate': WIDGET_URI,
      },
    },
    async (context: ResupplyContext) => {
      const profile = makeProfile(context);
      const phase = getTrailPhase(profile.currentMile);
      const query = `${context.query} ${phase.label}`.trim();
      const hits = searchPublicCorpus(scoutKnowledgeCorpus, query);
      const fallbackHits = hits.length ? hits : searchPublicCorpus(scoutKnowledgeCorpus, context.query);
      const referenceContext = findTrailReferenceContext({
        currentMile: profile.currentMile,
        direction: profile.direction,
        radiusMiles: 80,
        categories: ['resupply', 'trailheads', 'water', 'live-sources'],
        forwardOnly: true,
        limit: 8,
      });

      const structuredContent = {
        resupply: {
          routeLabel: routeLabel(profile.direction),
          currentMile: profile.currentMile,
          query,
          candidates: fallbackHits.slice(0, 5).map(toSearchResult),
          openReferenceCandidates: referenceContext.categories.resupply ?? [],
          trailheadCandidates: referenceContext.categories.trailheads ?? [],
          waterCandidates: referenceContext.categories.water ?? [],
          nextActions: [
            'Fetch the most relevant candidate document before quoting details.',
            'Confirm hours, lodging, shuttle, mail drop, and food availability with live/local sources.',
            'Carry enough buffer food if the plan depends on a small store, hostel box, or shuttle timing.',
          ],
          sourceReceipts: [
            { label: 'Hogg Country public corpus search', status: 'source leads only' },
            ...referenceContext.sourceReceipts,
            { label: 'Current town services', status: 'not live yet - user must confirm' },
          ],
          caveats: referenceContext.caveats,
        },
      };

      return {
        structuredContent,
        content: textContent(
          `Scout found ${(referenceContext.categories.resupply ?? []).length} open-reference resupply leads and ${fallbackHits.slice(0, 5).length} corpus matches. Confirm live hours, services, shuttles, lodging, and inventory before relying on them.`,
        ),
      };
    },
  );

  registerScoutAppTool(
    server,
    'build_section_plan',
    {
      title: 'Build AT section plan',
      description:
        'Use this when the user wants a source-aware plan for a specific AT mile range, including day chunks, candidate water, overnight options, resupply leads, and coarse terrain flags.',
      inputSchema: {
        startMile: z.number().min(0).max(TRAIL_FACTS.totalMiles).describe('Starting NOBO mile marker for the section.'),
        endMile: z.number().min(0).max(TRAIL_FACTS.totalMiles).describe('Ending NOBO mile marker for the section.'),
        direction: directionSchema.default('NOBO'),
        targetPace: z.number().min(1).max(35).default(12),
        waterCapacityLiters: z.number().min(0.5).max(8).default(2),
        shelterPreference: shelterPreferenceSchema.default('mixed'),
        state: z.string().min(2).max(2).optional().describe('Optional two-letter state code for rule summaries.'),
      },
      annotations: READ_ONLY_LOCAL_ANNOTATIONS,
      _meta: {
        ui: {
          resourceUri: WIDGET_URI,
          visibility: ['model', 'app'],
        },
        'openai/toolInvocation/invoking': 'Building Scout section plan...',
        'openai/toolInvocation/invoked': 'Scout section plan ready.',
        'openai/outputTemplate': WIDGET_URI,
      },
    },
    async (context: SectionPlanContext) => {
      const sectionReference = buildSectionReference({
        startMile: Math.min(context.startMile, context.endMile),
        endMile: Math.max(context.startMile, context.endMile),
        direction: context.direction,
        categories: ['water', 'shelters', 'campsites', 'privies', 'trailheads', 'resupply', 'terrain'],
        limit: 12,
      });
      const rules = context.state
        ? findTrailReferenceContext({
            currentMile: context.startMile,
            direction: context.direction,
            radiusMiles: Math.abs(context.endMile - context.startMile),
            categories: ['rules', 'live-sources'],
            state: context.state,
          })
        : null;
      const days = buildSectionDays(context.startMile, context.endMile, context.targetPace);

      const structuredContent = {
        sectionPlan: {
          routeLabel: routeLabel(context.direction),
          startMile: context.startMile,
          endMile: context.endMile,
          targetPace: context.targetPace,
          waterCapacityLiters: context.waterCapacityLiters,
          shelterPreference: context.shelterPreference,
          days,
          reference: sectionReference,
          rules: rules?.rules ?? [],
          liveSources: rules?.liveSources ?? [],
          checks: [
            'Confirm live weather and alerts for the exact dates.',
            'Verify water reliability and treatment needs with current/local sources.',
            'Verify legal camping, permits, fees, shuttles, stores, hostels, and road access before itinerary commitment.',
            'Treat generated open-route miles as Scout candidate miles, not official ATC guidebook miles.',
          ],
          sourceReceipts: [
            ...sectionReference.sourceReceipts,
            ...(rules?.sourceReceipts ?? []),
            { label: 'Current conditions', status: 'not live yet - user must confirm' },
          ],
        },
      };

      return {
        structuredContent,
        content: textContent(
          `Scout built a section plan from NOBO mile ${context.startMile.toFixed(1)} to ${context.endMile.toFixed(1)} with ${days.length} day chunks and candidate reference leads.`,
        ),
      };
    },
  );

  registerScoutAppTool(
    server,
    'draft_scout_document',
    {
      title: 'Draft Scout planning document',
      description:
        'Use this when the user wants ChatGPT to draft a structured Scout planning document such as a current plan, seven-day plan, resupply plan, gear/body notes, or safety risk brief. This drafts only; it does not save.',
      inputSchema: {
        ...trailContextInput,
        slotKey: documentSlotSchema,
        notes: z.string().max(1200).default(''),
        state: z.string().min(2).max(2).optional().describe('Optional two-letter state code for rule summaries.'),
      },
      annotations: READ_ONLY_LOCAL_ANNOTATIONS,
      _meta: {
        ui: {
          resourceUri: WIDGET_URI,
          visibility: ['model', 'app'],
        },
        'openai/toolInvocation/invoking': 'Drafting Scout document...',
        'openai/toolInvocation/invoked': 'Scout document ready.',
        'openai/outputTemplate': WIDGET_URI,
      },
    },
    async (context: DraftDocumentContext) => {
      const document = buildDraftDocument(context);
      const structuredContent = {
        document,
      };

      return {
        structuredContent,
        content: textContent(`Scout drafted "${document.title}" as a read-only planning document. Nothing was saved back to Scout.`),
      };
    },
  );

  return server;
}

function sendJson(res: ServerResponse, status: number, payload: unknown): void {
  res.writeHead(status, { 'content-type': 'application/json' });
  res.end(JSON.stringify(payload));
}

function sendText(res: ServerResponse, status: number, payload: string): void {
  res.writeHead(status, { 'content-type': 'text/plain; charset=utf-8' });
  res.end(payload);
}

async function handleMcpRequest(req: IncomingMessage, res: ServerResponse): Promise<void> {
  if (req.method !== 'POST') {
    sendJson(res, 405, {
      jsonrpc: '2.0',
      error: {
        code: -32000,
        message: 'Method not allowed. Use POST for the Streamable HTTP MCP endpoint.',
      },
      id: null,
    });
    return;
  }

  const server = await createScoutServer();
  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
  });

  try {
    await server.connect(transport);
    await transport.handleRequest(req, res);
  } catch (error) {
    console.error('Error handling Scout MCP request:', error);
    if (!res.headersSent) {
      sendJson(res, 500, {
        jsonrpc: '2.0',
        error: {
          code: -32603,
          message: 'Internal server error',
        },
        id: null,
      });
    }
  } finally {
    await transport.close();
    await server.close();
  }
}

const httpServer = createServer((req, res) => {
  void (async () => {
    const url = new URL(req.url ?? '/', `http://${req.headers.host ?? `localhost:${PORT}`}`);

    if (url.pathname === '/') {
      sendText(
        res,
        200,
        [
          'Scout ChatGPT App MCP server',
          '',
          `MCP endpoint: http://localhost:${PORT}/mcp`,
          `Widget resource: ${WIDGET_URI}`,
        ].join('\n'),
      );
      return;
    }

    if (url.pathname === '/mcp') {
      await handleMcpRequest(req, res);
      return;
    }

    sendText(res, 404, 'Not found');
  })().catch((error) => {
    console.error('Unhandled Scout app server error:', error);
    if (!res.headersSent) sendText(res, 500, 'Internal server error');
  });
});

httpServer.listen(PORT, () => {
  console.log(`Scout ChatGPT App MCP server listening on http://localhost:${PORT}/mcp`);
});

process.on('SIGINT', () => {
  httpServer.close(() => process.exit(0));
});
