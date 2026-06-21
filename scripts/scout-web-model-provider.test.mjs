import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync } from 'node:fs';
import { registerHooks } from 'node:module';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

const dataDir = mkdtempSync(join(tmpdir(), 'scout-web-model-provider-'));
process.env.SCOUT_WORKSPACE_DATA_DIR = dataDir;

const libRoot = new URL('../apps/openclaw-web/src/lib/', import.meta.url);
registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier.startsWith('$lib/')) {
      return nextResolve(new URL(`${specifier.slice('$lib/'.length)}.ts`, libRoot).href, context);
    }

    try {
      return nextResolve(specifier, context);
    } catch (error) {
      const isRelative = specifier.startsWith('./') || specifier.startsWith('../');
      const parentIsScoutLib = typeof context.parentURL === 'string' && context.parentURL.startsWith(libRoot.href);
      const hasExplicitExtension = /\.[cm]?[jt]s$/u.test(specifier);
      if (!isRelative || !parentIsScoutLib || hasExplicitExtension) {
        throw error;
      }

      return nextResolve(`${specifier}.ts`, context);
    }
  }
});

const {
  DEFAULT_OPENAI_API_MODEL,
  OPENAI_API_PROVIDER_ID,
  OPENCODE_GO_PROVIDER_ID,
  configuredHouseModelId,
  configuredHouseProviderId,
  getConfiguredClawConnection
} = await import('../apps/openclaw-web/src/lib/server/claw-connection.ts');
const {
  getWorkspaceRecord,
  replaceWorkspaceClawMessages
} = await import('../apps/openclaw-web/src/lib/server/workspace-store.ts');
const {
  simplifyMessages,
  toPiMessage
} = await import('../apps/openclaw-web/src/lib/server/claw-runtime.ts');

const savedEnv = {
  OPENAI_API_KEY: process.env.OPENAI_API_KEY,
  OPENAI_MODEL: process.env.OPENAI_MODEL,
  OPENCODE_API_KEY: process.env.OPENCODE_API_KEY,
  SCOUT_MODEL: process.env.SCOUT_MODEL,
  SCOUT_PROVIDER: process.env.SCOUT_PROVIDER,
  OPENCLAW_CLAW_MODEL: process.env.OPENCLAW_CLAW_MODEL,
  OPENCLAW_CLAW_PROVIDER: process.env.OPENCLAW_CLAW_PROVIDER,
  OPENCLAW_SCOUT_MODEL: process.env.OPENCLAW_SCOUT_MODEL,
  OPENCLAW_SCOUT_PROVIDER: process.env.OPENCLAW_SCOUT_PROVIDER
};

function resetProviderEnv() {
  for (const [key, value] of Object.entries(savedEnv)) {
    if (value === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = value;
    }
  }
}

function clearProviderEnv() {
  for (const key of Object.keys(savedEnv)) {
    delete process.env[key];
  }
}

test.afterEach(resetProviderEnv);

test('OpenAI API key selects a house-funded Scout lane by default', () => {
  clearProviderEnv();
  process.env.OPENAI_API_KEY = 'sk-test-not-real';

  assert.equal(configuredHouseProviderId(), OPENAI_API_PROVIDER_ID);
  assert.equal(configuredHouseModelId(OPENAI_API_PROVIDER_ID), DEFAULT_OPENAI_API_MODEL);
  assert.deepEqual(getConfiguredClawConnection({ providerConnections: [] }), {
    providerId: OPENAI_API_PROVIDER_ID,
    label: 'OpenAI API house lane',
    status: 'connected',
    accountId: null,
    expiresAt: null,
    model: DEFAULT_OPENAI_API_MODEL
  });
});

test('SCOUT_MODEL can override the OpenAI API model for launch experiments', () => {
  clearProviderEnv();
  process.env.OPENAI_API_KEY = 'sk-test-not-real';
  process.env.SCOUT_MODEL = 'gpt-5.5';

  assert.equal(configuredHouseProviderId(), OPENAI_API_PROVIDER_ID);
  assert.equal(configuredHouseModelId(OPENAI_API_PROVIDER_ID), 'gpt-5.5');
  assert.equal(getConfiguredClawConnection({ providerConnections: [] })?.model, 'gpt-5.5');
});

test('OpenAI API lane does not inherit a legacy OpenCode model name', () => {
  clearProviderEnv();
  process.env.OPENAI_API_KEY = 'sk-test-not-real';
  process.env.SCOUT_PROVIDER = OPENAI_API_PROVIDER_ID;
  process.env.OPENCLAW_CLAW_MODEL = 'deepseek-v4-pro';

  assert.equal(configuredHouseProviderId(), OPENAI_API_PROVIDER_ID);
  assert.equal(configuredHouseModelId(OPENAI_API_PROVIDER_ID), DEFAULT_OPENAI_API_MODEL);
});

test('OpenCode Go remains the fallback house lane when only its key is present', () => {
  clearProviderEnv();
  process.env.OPENCODE_API_KEY = 'opencode-test-not-real';

  assert.equal(configuredHouseProviderId(), OPENCODE_GO_PROVIDER_ID);
});

test('workspace messages preserve the OpenAI API provider id', async () => {
  clearProviderEnv();
  const betaProfile = {
    email: 'provider-test@hoggcountry.local',
    name: 'Provider Tester',
    trailName: 'Provider'
  };
  const workspaceId = 'provider-message-test';
  const message = {
    id: 'claw-assistant-openai',
    role: 'assistant',
    text: 'OpenAI API lane answer.',
    createdAt: '2026-06-21T12:00:00.000Z',
    providerId: OPENAI_API_PROVIDER_ID,
    model: 'gpt-5.4-mini',
    error: false
  };

  const snapshot = await replaceWorkspaceClawMessages(workspaceId, betaProfile, [message]);
  assert.equal(snapshot.clawMessages[0]?.providerId, OPENAI_API_PROVIDER_ID);

  const raw = JSON.parse(readFileSync(join(dataDir, `${workspaceId}.json`), 'utf8'));
  assert.equal(raw.clawMessages[0]?.providerId, OPENAI_API_PROVIDER_ID);

  const reloaded = await getWorkspaceRecord(workspaceId, betaProfile);
  assert.equal(reloaded.clawMessages[0]?.providerId, OPENAI_API_PROVIDER_ID);
});

test('OpenAI API workspace messages round-trip through the Pi adapter', () => {
  const workspaceMessage = {
    id: 'claw-assistant-openai-pi',
    role: 'assistant',
    text: 'OpenAI API lane answer.',
    createdAt: '2026-06-21T12:00:00.000Z',
    providerId: OPENAI_API_PROVIDER_ID,
    model: 'gpt-5.5',
    error: false
  };

  const piMessage = toPiMessage(workspaceMessage);
  assert.equal(piMessage.role, 'assistant');
  assert.equal(piMessage.provider, OPENAI_API_PROVIDER_ID);
  assert.equal(piMessage.api, 'openai-responses');
  assert.equal(piMessage.model, 'gpt-5.5');

  const [roundTripped] = simplifyMessages([piMessage]);
  assert.equal(roundTripped.providerId, OPENAI_API_PROVIDER_ID);
  assert.equal(roundTripped.model, 'gpt-5.5');
  assert.equal(roundTripped.text, workspaceMessage.text);
});
