import { Agent } from '@mariozechner/pi-agent-core';
import type { ImportedDocument } from '@hoggcountry/manual-core';
import { getModel, type AssistantMessage, type Message, type Model, type ToolResultMessage, type UserMessage } from '@mariozechner/pi-ai';
import type { BetaProfileCookie } from '$lib/beta';
import { resolveOpenAICodexApiKey, type OpenAICodexCredentials } from '$lib/server/claw-openai-codex';
import { decryptProviderJson, encryptProviderJson } from '$lib/server/provider-crypto';
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
      maxTokens: 2048
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

function buildSystemPrompt(record: WorkspaceRecord, activeDocument?: ImportedDocument | null): string {
  const profile = record.profile;
  const notes = userBlocksSummary(record);
  const docs = record.documents.slice(0, 6).map((document) => document.title);
  const tools = record.tools.slice(0, 6).map((tool) => tool.title);

  return [
    'You are Scout, Hogg Country\'s private trail delegate for a single hiker.',
    'Be direct, practical, calm, and trail-first.',
    'Use short useful answers. If context is thin, say what is missing and propose the next artifact to tighten.',
    'Do not roleplay. Do not oversell certainty. Prefer concrete next actions over generic encouragement.',
    '',
    `Hiker name: ${record.betaProfile.name || 'Unknown'}`,
    `Trail name: ${record.betaProfile.trailName || 'Unknown'}`,
    `Workspace id: ${record.workspaceId}`,
    profile
      ? `Profile: start ${profile.startDate || 'unknown'}, current mile ${Number.isFinite(profile.currentMile) ? profile.currentMile.toFixed(1) : 'unknown'}, direction ${profile.direction || 'unknown'}, pace ${profile.averageMilesPerDay || 0} mpd.`
      : 'Profile: not initialized yet.',
    notes.length > 0 ? `Manual notes: ${notes.join(' | ')}` : 'Manual notes: none yet.',
    docs.length > 0 ? `Source docs: ${docs.join(', ')}` : 'Source docs: none yet.',
    tools.length > 0 ? `Available tools/checklists: ${tools.join(', ')}` : 'Available tools/checklists: none yet.',
    'Be especially good at itinerary planning, loadout choices, food-carry limits, resupply timing, budget tradeoffs, health/body tracking, hostel or town sequencing, and turning rough trail constraints into usable plans.',
    'Treat saved assistant-generated documents as living Scout documents, not one-off files. The user wants Scout to keep them current through conversation.',
    'When asked for a plan, prefer a compact artifact with current snapshot, assumptions, day-by-day or category breakdown, concrete next actions, and missing intel that would tighten the answer.',
    'When revising a saved document, preserve useful existing structure, update stale facts, add a brief change-history note, and return the full revised document body.',
    activeDocument
      ? [
          `Active saved plan title: ${activeDocument.title}`,
          'The user is asking you to revise that saved plan in place.',
          'Return the full revised plan, not commentary about what changed.',
          `Current saved plan:\n${activeDocument.textContent}`
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

export async function replyInWorkspaceClaw(
  workspaceId: string,
  betaProfile: BetaProfileCookie,
  prompt: string,
  options?: {
    readonly documentId?: string | null;
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
    ? record.documents.find((document) => document.id === options.documentId && document.rights === 'assistant-generated') ?? null
    : null;

  if (options?.documentId && !activeDocument) {
    throw new Error('Saved Scout plan not found.');
  }

  const runtime = await resolveClawRuntime(record);

  const agent = new Agent({
    initialState: {
      systemPrompt: buildSystemPrompt(record, activeDocument),
      model: runtime.model,
      thinkingLevel: 'low',
      messages: record.clawMessages.map(toPiMessage)
    },
    sessionId: `workspace:${workspaceId}:claw`,
    transport: 'sse',
    getApiKey: async () => runtime.apiKey
  });

  await agent.prompt(trimmedPrompt);

  const nextMessages = simplifyMessages(agent.state.messages as Message[]);
  const reply = nextMessages.at(-1);

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

  let workspace = await replaceWorkspaceClawMessages(workspaceId, betaProfile, nextMessages);
  let revisedDocument: ImportedDocument | null = null;

  if (activeDocument) {
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
