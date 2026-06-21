import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import test from 'node:test';

const root = new URL('../', import.meta.url);
const read = (path) => readFileSync(new URL(path, root), 'utf8');

test('ChatGPT login routes exist with PKCE start and same-origin callback', () => {
  assert.equal(existsSync(new URL('apps/openclaw-web/src/routes/auth/chatgpt/start/+server.ts', root)), true);
  assert.equal(existsSync(new URL('apps/openclaw-web/src/routes/auth/chatgpt/callback/+server.ts', root)), true);

  const start = read('apps/openclaw-web/src/routes/auth/chatgpt/start/+server.ts');
  assert.match(start, /startOpenAICodexAuthorization/u);
  assert.match(start, /hoggcountry-login/u);
  assert.match(start, /\/auth\/chatgpt\/callback/u);
  assert.match(start, /httpOnly: true/u);

  const callback = read('apps/openclaw-web/src/routes/auth/chatgpt/callback/+server.ts');
  assert.match(callback, /exchangeOpenAICodexAuthorizationCodeWithIdentity/u);
  assert.match(callback, /\/auth\/openai\/exchange/u);
  assert.match(callback, /setAuthCookie/u);
  assert.match(callback, /saveWorkspaceOpenAICodexConnection/u);
  assert.match(callback, /state !== pending\.state/u);
});

test('login flow keeps lane storage non-fatal so auth still succeeds', () => {
  const callback = read('apps/openclaw-web/src/routes/auth/chatgpt/callback/+server.ts');
  assert.match(callback, /connected lane save failed; login continues/u);
});

test('login ChatGPT is gated and signup is waitlist-only during private hosted beta', () => {
  const login = read('apps/openclaw-web/src/routes/login/+page.svelte');
  assert.match(login, /Continue with ChatGPT/u);
  assert.match(login, /\{#if data\.chatgptUrl\}/u);
  assert.match(login, /Join launch list/u);
  assert.doesNotMatch(login, /Create account/u);

  const loginServer = read('apps/openclaw-web/src/routes/login/+page.server.ts');
  assert.match(loginServer, /PUBLIC_CHATGPT_LOGIN_ENABLED/u);

  const signup = read('apps/openclaw-web/src/routes/signup/+page.svelte');
  assert.match(signup, /Private web beta/u);
  assert.match(signup, /WaitlistSignup/u);
  assert.doesNotMatch(signup, /Continue with ChatGPT/u);
  assert.doesNotMatch(signup, /\/auth\/chatgpt\/start/u);
});

test('backend auth keeps registration closed unless explicitly enabled', () => {
  const config = read('backend/config/app.php');
  assert.match(config, /public_registration_enabled/u);
  assert.match(config, /PUBLIC_REGISTRATION_ENABLED/u);
  assert.match(config, /SCOUT_LAUNCH_INVITE/u);

  const controller = read('backend/app/Http/Controllers/Api/V1/AuthController.php');
  assert.match(controller, /registration_closed/u);
  assert.match(controller, /resolveLaunchInviteUser/u);
  assert.match(controller, /launch_invite/u);
  assert.match(controller, /registrationIsClosed\(\)/u);
});

test('server-side auth calls use an absolute same-origin API base in production', async () => {
  const savedNodeEnv = process.env.NODE_ENV;
  const savedPublicApiBase = process.env.PUBLIC_API_BASE_URL;
  process.env.NODE_ENV = 'production';
  delete process.env.PUBLIC_API_BASE_URL;

  try {
    const { publicApiBase } = await import('../apps/openclaw-web/src/lib/server/public-api.ts');
    assert.equal(publicApiBase('https://hoggcountry.com/login'), 'https://hoggcountry.com/api/v1');
  } finally {
    if (savedNodeEnv === undefined) {
      delete process.env.NODE_ENV;
    } else {
      process.env.NODE_ENV = savedNodeEnv;
    }
    if (savedPublicApiBase === undefined) {
      delete process.env.PUBLIC_API_BASE_URL;
    } else {
      process.env.PUBLIC_API_BASE_URL = savedPublicApiBase;
    }
  }

  const hooks = read('apps/openclaw-web/src/hooks.server.ts');
  assert.match(hooks, /loadAuthenticatedUser\(event\.locals\.authToken, event\.fetch, event\.url\.origin\)/u);

  const auth = read('apps/openclaw-web/src/lib/server/auth.ts');
  assert.match(auth, /const request = origin \? fetch : fetcher/u);

  const loginServer = read('apps/openclaw-web/src/routes/login/+page.server.ts');
  assert.match(loginServer, /publicApiBase\(origin\)/u);
  assert.match(loginServer, /fetch, url\.origin/u);

  const forgotServer = read('apps/openclaw-web/src/routes/forgot-password/+page.server.ts');
  assert.match(forgotServer, /fetch, url\.origin/u);

  const resetServer = read('apps/openclaw-web/src/routes/reset-password/+page.server.ts');
  assert.match(resetServer, /fetch, url\.origin/u);
});

test('OAuth redirect defaults to the registered localhost URI (cloud rejected by OpenAI)', async () => {
  const { resolveOpenAICodexRedirectUri, OPENAI_CODEX_LOCAL_REDIRECT_URI } = await import(
    '../apps/openclaw-web/src/lib/server/claw-openai-codex.ts'
  );

  assert.equal(resolveOpenAICodexRedirectUri('https://hoggcountry.com'), OPENAI_CODEX_LOCAL_REDIRECT_URI);

  process.env.SCOUT_OPENAI_CODEX_REDIRECT_URI = 'https://example.com/cb';
  try {
    assert.equal(resolveOpenAICodexRedirectUri('https://hoggcountry.com'), 'https://example.com/cb');
  } finally {
    delete process.env.SCOUT_OPENAI_CODEX_REDIRECT_URI;
  }
});

test('Laravel exchange endpoint is registered and verifies tokens via JWKS', () => {
  const routes = read('backend/routes/api.php');
  assert.match(routes, /auth\/openai\/exchange|\/openai\/exchange/u);
  assert.match(routes, /openaiExchange/u);

  const controller = read('backend/app/Http/Controllers/Api/V1/AuthController.php');
  assert.match(controller, /OpenAIIdToken::verify/u);
  assert.match(controller, /'provider' => 'openai'/u);

  const verifier = read('backend/app/Support/OpenAIIdToken.php');
  assert.match(verifier, /app_EMoamEEZ73f0CkXaXp7hrann/u);
  assert.match(verifier, /jwks\.json/u);
  assert.match(verifier, /JWK::parseKeySet/u);
});

test('token exchange exposes the OIDC id_token for login flows', () => {
  const lib = read('apps/openclaw-web/src/lib/server/claw-openai-codex.ts');
  assert.match(lib, /exchangeOpenAICodexAuthorizationCodeWithIdentity/u);
  assert.match(lib, /id_token/u);
});
