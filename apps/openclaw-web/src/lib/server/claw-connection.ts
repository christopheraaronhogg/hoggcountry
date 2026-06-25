import type { WorkspaceSnapshot } from '$lib/server/workspace-store';

export const OPENAI_CODEX_PROVIDER_ID = 'openai-codex';
export const OPENAI_API_PROVIDER_ID = 'openai';
export const OPENCODE_GO_PROVIDER_ID = 'opencode-go';
export const OPENAI_CODEX_MODEL = 'gpt-5.5';
// BYOK / api-provider default stays a current "mini" — there is no gpt-5.5-mini.
// The house Scout runs gpt-5.5 via the SCOUT_MODEL / OPENAI_MODEL env override.
export const DEFAULT_OPENAI_API_MODEL = 'gpt-5.4-mini';
export const DEFAULT_OPENCODE_GO_MODEL = 'deepseek-v4-pro';

export type ClawProviderId =
  | typeof OPENAI_CODEX_PROVIDER_ID
  | typeof OPENAI_API_PROVIDER_ID
  | typeof OPENCODE_GO_PROVIDER_ID;

export interface WorkspaceClawConnectionPayload {
  readonly providerId: ClawProviderId;
  readonly label: string;
  readonly status: 'connected';
  readonly accountId: string | null;
  readonly expiresAt: string | null;
  readonly model: string;
}

export function configuredHouseProviderId(): ClawProviderId | null {
  const provider = (
    process.env.SCOUT_PROVIDER ||
    process.env.OPENCLAW_CLAW_PROVIDER ||
    process.env.OPENCLAW_SCOUT_PROVIDER ||
    ''
  ).trim();
  if (provider === OPENCODE_GO_PROVIDER_ID) return OPENCODE_GO_PROVIDER_ID;
  if (provider === OPENAI_API_PROVIDER_ID) return OPENAI_API_PROVIDER_ID;
  if (provider === OPENAI_CODEX_PROVIDER_ID) return null;
  if (process.env.OPENAI_API_KEY?.trim()) return OPENAI_API_PROVIDER_ID;
  return process.env.OPENCODE_API_KEY ? OPENCODE_GO_PROVIDER_ID : null;
}

export function configuredHouseModelId(providerId: ClawProviderId): string {
  if (providerId === OPENCODE_GO_PROVIDER_ID) {
    return (
      process.env.SCOUT_MODEL ||
      process.env.OPENCLAW_CLAW_MODEL ||
      process.env.OPENCLAW_SCOUT_MODEL ||
      DEFAULT_OPENCODE_GO_MODEL
    ).trim();
  }

  if (providerId === OPENAI_API_PROVIDER_ID) {
    return (
      process.env.SCOUT_MODEL ||
      process.env.OPENAI_MODEL ||
      DEFAULT_OPENAI_API_MODEL
    ).trim();
  }

  return OPENAI_CODEX_MODEL;
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

  if (houseProviderId === OPENAI_API_PROVIDER_ID && process.env.OPENAI_API_KEY?.trim()) {
    const modelId = configuredHouseModelId(houseProviderId);
    return {
      providerId: OPENAI_API_PROVIDER_ID,
      label: 'OpenAI API house lane',
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
