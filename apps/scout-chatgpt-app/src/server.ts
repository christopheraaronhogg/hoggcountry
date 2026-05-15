import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { readFile } from 'node:fs/promises';

import { publicCorpus, searchPublicCorpus, type PublicCorpusEntry } from '@hoggcountry/corpus';
import type { Direction, ManualProfile, ShelterPreference } from '@hoggcountry/manual-core';
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

const PORT = Number(process.env.PORT ?? 8787);
const SITE_ORIGIN = process.env.PUBLIC_SITE_ORIGIN ?? 'https://hoggcountry.com';
const WIDGET_URI = 'ui://scout/today.html';
const WIDGET_HTML_URL = new URL('../public/scout-widget.html', import.meta.url);

const directionSchema = z.enum(['NOBO', 'SOBO']);
const shelterPreferenceSchema = z.enum(['tent-first', 'shelter-first', 'mixed']);

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
      version: '0.1.0',
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
        'Search public Hogg Country guide and Scout planning documents. Use before fetch when the user asks for source-backed trail guidance.',
      inputSchema: {
        query: z.string().min(1).describe('Search query for Scout guide, planning, resupply, gear, safety, or trail context.'),
      },
      annotations: { readOnlyHint: true },
    },
    async ({ query }: { query: string }) => {
      const structuredContent = {
        results: searchPublicCorpus(publicCorpus, query).slice(0, 8).map(toSearchResult),
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
      description: 'Fetch a full public Hogg Country guide or Scout planning document by id after search returns a relevant result.',
      inputSchema: {
        id: z.string().min(1).describe('Document id returned by search.'),
      },
      annotations: { readOnlyHint: true },
    },
    async ({ id }: { id: string }) => {
      const entry = publicCorpus.find((candidate) => candidate.id === id);
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

  registerScoutAppTool(
    server,
    'get_today_brief',
    {
      title: 'Show Scout Today',
      description:
        'Render a compact Scout heads-up display for the current Appalachian Trail context. This is deterministic planning context, not live conditions.',
      inputSchema: trailContextInput,
      annotations: { readOnlyHint: true },
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
      };

      return {
        structuredContent,
        content: textContent(
          `Scout Today is ready for ${routeLabel(profile.direction)} mile ${profile.currentMile.toFixed(1)}. Confirm live weather, closures, water, and town details before field reliance.`,
        ),
      };
    },
  );

  registerScoutTool(
    server,
    'plan_next_day',
    {
      title: 'Plan next trail day',
      description:
        'Create a conservative next-day AT planning scaffold from current mile, direction, pace, water carry, and sleep preference.',
      inputSchema: {
        ...trailContextInput,
        effort: z.enum(['conservative', 'standard', 'push']).default('standard'),
      },
      annotations: { readOnlyHint: true },
    },
    async (context: DayPlanContext) => {
      const profile = makeProfile(context);
      const multiplier = context.effort === 'conservative' ? 0.75 : context.effort === 'push' ? 1.2 : 1;
      const targetMiles = Number((profile.targetPace * multiplier).toFixed(1));
      const phase = getTrailPhase(profile.currentMile);
      const planLanes = buildPlanLanes(profile);
      const endMile = moveMile(profile.currentMile, profile.direction, targetMiles);

      const structuredContent = {
        plan: {
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
        },
      };

      return {
        structuredContent,
        content: textContent(JSON.stringify(structuredContent)),
      };
    },
  );

  registerScoutTool(
    server,
    'plan_next_week',
    {
      title: 'Plan next trail week',
      description:
        'Create a 7-day rolling AT planning scaffold with mileage targets, zero/nero pressure, and source checks.',
      inputSchema: trailContextInput,
      annotations: { readOnlyHint: true },
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

      const structuredContent = {
        plan: {
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
        },
      };

      return {
        structuredContent,
        content: textContent(JSON.stringify(structuredContent)),
      };
    },
  );

  registerScoutTool(
    server,
    'find_next_resupply',
    {
      title: 'Find next resupply leads',
      description:
        'Search Hogg Country public Scout knowledge for resupply-related guide leads near the user context. This does not confirm live hours or inventory.',
      inputSchema: {
        ...trailContextInput,
        query: z.string().min(1).default('resupply').describe('Optional resupply search query.'),
      },
      annotations: { readOnlyHint: true },
    },
    async (context: ResupplyContext) => {
      const profile = makeProfile(context);
      const phase = getTrailPhase(profile.currentMile);
      const query = `${context.query} ${phase.label}`.trim();
      const hits = searchPublicCorpus(publicCorpus, query);
      const fallbackHits = hits.length ? hits : searchPublicCorpus(publicCorpus, context.query);

      const structuredContent = {
        resupply: {
          routeLabel: routeLabel(profile.direction),
          currentMile: profile.currentMile,
          query,
          candidates: fallbackHits.slice(0, 5).map(toSearchResult),
          nextActions: [
            'Fetch the most relevant candidate document before quoting details.',
            'Confirm hours, lodging, shuttle, mail drop, and food availability with live/local sources.',
            'Carry enough buffer food if the plan depends on a small store, hostel box, or shuttle timing.',
          ],
          sourceReceipts: [
            { label: 'Hogg Country public corpus search', status: 'source leads only' },
            { label: 'Current town services', status: 'not live yet - user must confirm' },
          ],
        },
      };

      return {
        structuredContent,
        content: textContent(JSON.stringify(structuredContent)),
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
