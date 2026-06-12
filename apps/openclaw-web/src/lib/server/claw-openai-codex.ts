import { createHash, randomBytes } from 'node:crypto';
import { getOAuthApiKey, type OAuthCredentials } from '@mariozechner/pi-ai/oauth';

const CLIENT_ID = 'app_EMoamEEZ73f0CkXaXp7hrann';
const AUTHORIZE_URL = 'https://auth.openai.com/oauth/authorize';
const TOKEN_URL = 'https://auth.openai.com/oauth/token';
export const OPENAI_CODEX_LOCAL_REDIRECT_URI = 'http://localhost:1455/auth/callback';
export const OPENAI_CODEX_CLOUD_CALLBACK_PATH = '/app-api/claw/connect/openai-codex/callback';
const SCOPE = 'openid profile email offline_access';
const JWT_CLAIM_PATH = 'https://api.openai.com/auth';

export interface OpenAICodexCredentials extends OAuthCredentials {
  readonly accountId?: string | null;
  readonly label?: string | null;
}

export interface OpenAICodexAuthorizationStart {
  readonly authorizeUrl: string;
  readonly state: string;
  readonly verifier: string;
  readonly redirectUri: string;
}

export interface ParsedAuthorizationInput {
  readonly code: string | null;
  readonly state: string | null;
}

function base64Url(buffer: Buffer): string {
  return buffer
    .toString('base64')
    .replace(/\+/gu, '-')
    .replace(/\//gu, '_')
    .replace(/=+$/gu, '');
}

function generatePkce(): { verifier: string; challenge: string } {
  const verifier = base64Url(randomBytes(32));
  const challenge = base64Url(createHash('sha256').update(verifier).digest());
  return { verifier, challenge };
}

function createState(): string {
  return randomBytes(16).toString('hex');
}

export function resolveOpenAICodexRedirectUri(requestOrigin?: string | null): string {
  const configured =
    process.env.SCOUT_OPENAI_CODEX_REDIRECT_URI?.trim() ||
    process.env.OPENCLAW_OPENAI_CODEX_REDIRECT_URI?.trim() ||
    process.env.HOGGCOUNTRY_OPENAI_CODEX_REDIRECT_URI?.trim();

  if (configured) {
    return configured;
  }

  if (requestOrigin) {
    try {
      const origin = new URL(requestOrigin);
      if (origin.protocol === 'https:') {
        return new URL(OPENAI_CODEX_CLOUD_CALLBACK_PATH, origin).toString();
      }
    } catch {
      // fall through
    }
  }

  return OPENAI_CODEX_LOCAL_REDIRECT_URI;
}

export function startOpenAICodexAuthorization(options?: {
  originator?: string;
  redirectUri?: string;
}): OpenAICodexAuthorizationStart {
  const { verifier, challenge } = generatePkce();
  const state = createState();
  const url = new URL(AUTHORIZE_URL);
  const redirectUri = options?.redirectUri || OPENAI_CODEX_LOCAL_REDIRECT_URI;
  const originator = options?.originator || 'hoggcountry';

  url.searchParams.set('response_type', 'code');
  url.searchParams.set('client_id', CLIENT_ID);
  url.searchParams.set('redirect_uri', redirectUri);
  url.searchParams.set('scope', SCOPE);
  url.searchParams.set('code_challenge', challenge);
  url.searchParams.set('code_challenge_method', 'S256');
  url.searchParams.set('state', state);
  url.searchParams.set('id_token_add_organizations', 'true');
  url.searchParams.set('codex_cli_simplified_flow', 'true');
  url.searchParams.set('originator', originator);

  return {
    authorizeUrl: url.toString(),
    state,
    verifier,
    redirectUri
  };
}

export function parseOpenAICodexAuthorizationInput(input: string): ParsedAuthorizationInput {
  const value = input.trim();
  if (!value) {
    return {
      code: null,
      state: null
    };
  }

  try {
    const url = new URL(value);
    return {
      code: url.searchParams.get('code'),
      state: url.searchParams.get('state')
    };
  } catch {
    // fall through
  }

  if (value.includes('#')) {
    const [code, state] = value.split('#', 2);
    return {
      code: code?.trim() || null,
      state: state?.trim() || null
    };
  }

  if (value.includes('code=')) {
    const params = new URLSearchParams(value);
    return {
      code: params.get('code'),
      state: params.get('state')
    };
  }

  return {
    code: value,
    state: null
  };
}

function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payload = parts[1];
    if (!payload) return null;
    return JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as Record<string, unknown>;
  } catch {
    return null;
  }
}

export function getOpenAICodexAccountId(accessToken: string): string | null {
  const payload = decodeJwtPayload(accessToken);
  const auth = payload?.[JWT_CLAIM_PATH];
  if (!auth || typeof auth !== 'object') return null;

  const accountId = (auth as Record<string, unknown>).chatgpt_account_id;
  return typeof accountId === 'string' && accountId.trim().length > 0 ? accountId.trim() : null;
}

export function buildOpenAICodexLabel(accountId: string | null | undefined): string {
  return accountId ? `ChatGPT connected (${accountId})` : 'ChatGPT connected account';
}

export async function exchangeOpenAICodexAuthorizationCode(
  code: string,
  verifier: string,
  redirectUri = OPENAI_CODEX_LOCAL_REDIRECT_URI
): Promise<OpenAICodexCredentials> {
  const { credentials } = await exchangeOpenAICodexAuthorizationCodeWithIdentity(code, verifier, redirectUri);
  return credentials;
}

// Login flows also need the OIDC id_token (verified server-side by the
// Laravel API) alongside the model-lane credentials.
export async function exchangeOpenAICodexAuthorizationCodeWithIdentity(
  code: string,
  verifier: string,
  redirectUri = OPENAI_CODEX_LOCAL_REDIRECT_URI
): Promise<{ credentials: OpenAICodexCredentials; idToken: string | null }> {
  const response = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: {
      'content-type': 'application/x-www-form-urlencoded'
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: CLIENT_ID,
      code,
      code_verifier: verifier,
      redirect_uri: redirectUri
    })
  });

  if (!response.ok) {
    const body = await response.text().catch(() => '');
    throw new Error(`OpenAI token exchange failed (${response.status}): ${body || 'empty response'}`);
  }

  const json = (await response.json()) as {
    access_token?: string;
    refresh_token?: string;
    expires_in?: number;
    id_token?: string;
  };

  if (!json.access_token || !json.refresh_token || typeof json.expires_in !== 'number') {
    throw new Error('OpenAI token exchange returned an incomplete credential set.');
  }

  const accountId = getOpenAICodexAccountId(json.access_token);

  return {
    credentials: {
      access: json.access_token,
      refresh: json.refresh_token,
      expires: Date.now() + json.expires_in * 1000,
      accountId,
      label: buildOpenAICodexLabel(accountId)
    },
    idToken: typeof json.id_token === 'string' && json.id_token.length > 0 ? json.id_token : null
  };
}

export async function resolveOpenAICodexApiKey(credentials: OpenAICodexCredentials): Promise<{
  readonly apiKey: string;
  readonly credentials: OpenAICodexCredentials;
}> {
  const result = await getOAuthApiKey('openai-codex', {
    'openai-codex': credentials
  });

  if (!result) {
    throw new Error('Connected ChatGPT account is missing or no longer available.');
  }

  const nextCredentials: OpenAICodexCredentials = {
    ...(result.newCredentials as OpenAICodexCredentials),
    accountId:
      (result.newCredentials as OpenAICodexCredentials).accountId || credentials.accountId || getOpenAICodexAccountId(result.newCredentials.access),
    label: credentials.label || buildOpenAICodexLabel(credentials.accountId ?? null)
  };

  return {
    apiKey: result.apiKey,
    credentials: nextCredentials
  };
}
