import {
  getModel,
  type AssistantMessage,
  type Message,
  type Model,
  type ToolResultMessage,
  type UserMessage
} from '@mariozechner/pi-ai';
import { createHash } from 'node:crypto';
import { resolveOpenAICodexApiKey, type OpenAICodexCredentials } from '$lib/server/claw-openai-codex';
import { decryptProviderJson } from '$lib/server/provider-crypto';
import type { WorkspaceClawMessage, WorkspaceRecord } from '$lib/server/workspace-store';
import {
  DEFAULT_OPENAI_API_MODEL,
  DEFAULT_OPENCODE_GO_MODEL,
  configuredHouseModelId,
  configuredHouseProviderId,
  OPENAI_API_PROVIDER_ID,
  OPENAI_CODEX_MODEL,
  OPENAI_CODEX_PROVIDER_ID,
  OPENCODE_GO_PROVIDER_ID,
  type ClawProviderId
} from './claw-connection';

const OPENCODE_GO_REPLY_MAX_TOKENS = 4000;
const OPENAI_PROMPT_CACHE_KEY_MAX_CHARS = 64;
export const SCOUT_STORED_HISTORY_MESSAGES = 200;

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

export interface ClawRuntime {
  readonly providerId: ClawProviderId;
  readonly modelId: string;
  readonly model: Model<any>;
  readonly apiKey: string;
  readonly credentials: OpenAICodexCredentials | null;
}

function resolveModelOrThrow(providerId: ClawProviderId, modelId: string): Model<any> {
  const model = getModel(providerId as never, modelId as never);
  if (model) return model;

  if (providerId === OPENAI_API_PROVIDER_ID) {
    return {
      id: modelId,
      name: modelId,
      api: 'openai-responses',
      provider: OPENAI_API_PROVIDER_ID,
      baseUrl: 'https://api.openai.com/v1',
      reasoning: /^gpt-5(?:\.|$|-)|^o[134](?:\.|$|-)/u.test(modelId),
      input: ['text', 'image'],
      cost: {
        input: 0,
        output: 0,
        cacheRead: 0,
        cacheWrite: 0
      },
      contextWindow: 400000,
      maxTokens: 128000
    };
  }

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

function getOpenAIApiKey(): string {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY is required for the OpenAI API Scout lane.');
  }
  return apiKey;
}

function getOpenCodeGoApiKey(): string {
  const apiKey = process.env.OPENCODE_API_KEY?.trim();
  if (!apiKey) {
    throw new Error('OPENCODE_API_KEY is required for the opencode-go Scout lane.');
  }
  return apiKey;
}

function compactOpenAIPromptCacheKey(value: string): string {
  const normalized = value.trim();
  if (normalized.length <= OPENAI_PROMPT_CACHE_KEY_MAX_CHARS) return normalized;

  const digest = createHash('sha256').update(normalized).digest('hex').slice(0, 32);
  return `scout_${digest}`;
}

export function applyOpenAIResponsesPayloadCompat(payload: unknown): unknown {
  if (!payload || typeof payload !== 'object') return payload;

  const params = payload as { prompt_cache_key?: unknown };
  if (typeof params.prompt_cache_key === 'string') {
    const compacted = compactOpenAIPromptCacheKey(params.prompt_cache_key);
    if (compacted) {
      params.prompt_cache_key = compacted;
    } else {
      delete params.prompt_cache_key;
    }
  } else if (params.prompt_cache_key !== undefined) {
    delete params.prompt_cache_key;
  }

  return params;
}

async function loadConnectedCredentials(record: WorkspaceRecord): Promise<OpenAICodexCredentials> {
  const connection = record.providerConnections.find((item) => item.providerId === OPENAI_CODEX_PROVIDER_ID);
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

export async function resolveClawRuntime(record: WorkspaceRecord): Promise<ClawRuntime> {
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

  if (houseProviderId === OPENAI_API_PROVIDER_ID) {
    const modelId = configuredHouseModelId(houseProviderId);
    return {
      providerId: OPENAI_API_PROVIDER_ID,
      modelId,
      model: resolveModelOrThrow(houseProviderId, modelId),
      apiKey: getOpenAIApiKey(),
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

function toTimestamp(value: string): number {
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : Date.now();
}

export function toPiMessage(message: WorkspaceClawMessage): Message {
  if (message.role === 'user') {
    const userMessage: UserMessage = {
      role: 'user',
      content: message.text,
      timestamp: toTimestamp(message.createdAt)
    };
    return userMessage;
  }

  const providerId =
    message.providerId === OPENCODE_GO_PROVIDER_ID
      ? OPENCODE_GO_PROVIDER_ID
      : message.providerId === OPENAI_API_PROVIDER_ID
        ? OPENAI_API_PROVIDER_ID
        : OPENAI_CODEX_PROVIDER_ID;
  const assistantMessage: AssistantMessage = {
    role: 'assistant',
    content: [{ type: 'text', text: message.text }],
    api:
      providerId === OPENCODE_GO_PROVIDER_ID
        ? 'openai-completions'
        : providerId === OPENAI_API_PROVIDER_ID
          ? 'openai-responses'
          : 'openai-codex-responses',
    provider: providerId,
    model: message.model || (
      providerId === OPENCODE_GO_PROVIDER_ID
        ? DEFAULT_OPENCODE_GO_MODEL
        : providerId === OPENAI_API_PROVIDER_ID
          ? DEFAULT_OPENAI_API_MODEL
          : OPENAI_CODEX_MODEL
    ),
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

export function simplifyMessages(messages: Message[]): WorkspaceClawMessage[] {
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

        const providerId =
          message.provider === OPENAI_CODEX_PROVIDER_ID ||
          message.provider === OPENAI_API_PROVIDER_ID ||
          message.provider === OPENCODE_GO_PROVIDER_ID
            ? message.provider
            : 'system';
        const workspaceMessage: WorkspaceClawMessage = {
          id: `claw-assistant-${message.timestamp}`,
          role: 'assistant',
          text,
          createdAt: new Date(message.timestamp).toISOString(),
          providerId,
          model: message.model || OPENAI_CODEX_MODEL,
          error: message.stopReason === 'error' || message.stopReason === 'aborted'
        };

        return [workspaceMessage];
      }

      return [];
    })
    .slice(-SCOUT_STORED_HISTORY_MESSAGES);
}
