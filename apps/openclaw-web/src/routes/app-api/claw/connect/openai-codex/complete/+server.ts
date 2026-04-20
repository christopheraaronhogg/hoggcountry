import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import {
  buildOpenAICodexLabel,
  exchangeOpenAICodexAuthorizationCode,
  parseOpenAICodexAuthorizationInput
} from '$lib/server/claw-openai-codex';
import { encryptProviderJson } from '$lib/server/provider-crypto';
import { requireWorkspace, ok } from '$lib/server/workspace-endpoint';
import {
  clearWorkspacePendingOpenAICodexAuth,
  getWorkspacePendingOpenAICodexAuth,
  saveWorkspaceOpenAICodexConnection
} from '$lib/server/workspace-store';

export const POST: RequestHandler = async (event) => {
  const { workspaceId, betaProfile } = requireWorkspace(event);
  const payload = (await event.request.json().catch(() => null)) as { authorizationInput?: unknown } | null;
  const authorizationInput = typeof payload?.authorizationInput === 'string' ? payload.authorizationInput : '';
  const parsed = parseOpenAICodexAuthorizationInput(authorizationInput);

  if (!parsed.code) {
    throw error(400, 'Paste the callback URL or authorization code to finish connect.');
  }

  const pending = await getWorkspacePendingOpenAICodexAuth(workspaceId, betaProfile);
  if (!pending) {
    throw error(409, 'Start a new ChatGPT connect flow first.');
  }

  if (parsed.state && parsed.state !== pending.state) {
    throw error(400, 'That pasted callback does not match the latest ChatGPT connect attempt.');
  }

  const credentials = await exchangeOpenAICodexAuthorizationCode(parsed.code, pending.verifier, pending.redirectUri);
  const snapshot = await saveWorkspaceOpenAICodexConnection(workspaceId, betaProfile, {
    encryptedCredentials: encryptProviderJson(credentials),
    accountId: credentials.accountId ?? null,
    expiresAt: new Date(credentials.expires).toISOString(),
    label: credentials.label || buildOpenAICodexLabel(credentials.accountId ?? null)
  });

  await clearWorkspacePendingOpenAICodexAuth(workspaceId, betaProfile);

  return ok({
    connection: snapshot.providerConnections.find((item) => item.providerId === 'openai-codex') ?? null
  });
};
