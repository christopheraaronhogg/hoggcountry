#!/usr/bin/env node

import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const argv = process.argv.slice(2);

function readArgValue(flag, fallback = '') {
  const direct = `${flag}=`;
  const directMatch = argv.find((arg) => arg.startsWith(direct));
  if (directMatch) {
    return directMatch.slice(direct.length);
  }

  const index = argv.indexOf(flag);
  if (index >= 0 && index + 1 < argv.length) {
    return argv[index + 1];
  }

  return fallback;
}

const timeoutMs = Number.parseInt(readArgValue('--timeout-ms', '12000'), 10) || 12000;
const outputPath = readArgValue('--output', '');
const jsonPath = readArgValue('--json', '');

const checks = [
  {
    id: 'public_web_trail_assistant',
    lane: 'public',
    method: 'GET',
    url: 'https://hoggcountry.com/trail-assistant',
    expect: [200],
  },
  {
    id: 'public_web_trail_assistant_profile',
    lane: 'public',
    method: 'GET',
    url: 'https://hoggcountry.com/trail-assistant-profile',
    expect: [200],
  },
  {
    id: 'public_web_trail_assistant_byos',
    lane: 'public',
    method: 'GET',
    url: 'https://hoggcountry.com/trail-assistant-byos',
    expect: [200],
  },
  {
    id: 'public_web_trail_assistant_thanks',
    lane: 'public',
    method: 'GET',
    url: 'https://hoggcountry.com/trail-assistant-thanks',
    expect: [200],
  },
  {
    id: 'public_api_health',
    lane: 'public',
    method: 'GET',
    url: 'https://hoggcountry.on-forge.com/api/v1/health',
    expect: [200],
  },
  {
    id: 'public_api_plans',
    lane: 'public',
    method: 'GET',
    url: 'https://hoggcountry.on-forge.com/api/v1/trail-assistant/plans',
    expect: [200],
  },
  {
    id: 'public_api_byos_providers',
    lane: 'public',
    method: 'GET',
    url: 'https://hoggcountry.on-forge.com/api/v1/trail-assistant/byos/providers',
    expect: [200],
  },
  {
    id: 'public_api_byos_decision',
    lane: 'public',
    method: 'GET',
    url: 'https://hoggcountry.on-forge.com/api/v1/trail-assistant/byos/decision',
    expect: [200],
  },
  {
    id: 'local_web_trail_assistant',
    lane: 'local',
    method: 'GET',
    url: 'http://127.0.0.1:4321/trail-assistant',
    expect: [200],
  },
  {
    id: 'local_web_trail_assistant_profile',
    lane: 'local',
    method: 'GET',
    url: 'http://127.0.0.1:4321/trail-assistant-profile',
    expect: [200],
  },
  {
    id: 'local_web_trail_assistant_byos',
    lane: 'local',
    method: 'GET',
    url: 'http://127.0.0.1:4321/trail-assistant-byos',
    expect: [200],
  },
  {
    id: 'local_web_trail_assistant_thanks',
    lane: 'local',
    method: 'GET',
    url: 'http://127.0.0.1:4321/trail-assistant-thanks',
    expect: [200],
  },
  {
    id: 'local_api_health',
    lane: 'local',
    method: 'GET',
    url: 'http://127.0.0.1:18000/api/v1/health',
    expect: [200],
  },
  {
    id: 'local_api_plans',
    lane: 'local',
    method: 'GET',
    url: 'http://127.0.0.1:18000/api/v1/trail-assistant/plans',
    expect: [200],
  },
  {
    id: 'local_api_byos_providers',
    lane: 'local',
    method: 'GET',
    url: 'http://127.0.0.1:18000/api/v1/trail-assistant/byos/providers',
    expect: [200],
  },
  {
    id: 'local_api_byos_decision',
    lane: 'local',
    method: 'GET',
    url: 'http://127.0.0.1:18000/api/v1/trail-assistant/byos/decision',
    expect: [200],
  },
  {
    id: 'local_api_byos_entitlement_preview_valid',
    lane: 'local',
    method: 'POST',
    url: 'http://127.0.0.1:18000/api/v1/trail-assistant/byos/entitlement-preview',
    expect: [200],
    body: {
      provider: 'openai_api_key',
      credentials: {
        api_key: 'sk-demo-wave2-proof-12345678901234567890',
      },
    },
  },
  {
    id: 'local_api_byos_entitlement_preview_invalid',
    lane: 'local',
    method: 'POST',
    url: 'http://127.0.0.1:18000/api/v1/trail-assistant/byos/entitlement-preview',
    expect: [200],
    body: {
      provider: 'openai_api_key',
      credentials: {
        api_key: 'invalid-prefix-wave2-proof-12345678901234567890',
      },
    },
  },
];

function summarizeJsonPayload(id, payload) {
  const data = payload?.data ?? null;

  if (!data || typeof data !== 'object') {
    return null;
  }

  if (id.includes('health')) {
    return `health=${String(data.status || 'unknown')}`;
  }

  if (id.includes('plans') && Array.isArray(data.plans)) {
    return `plans=${data.plans.length}`;
  }

  if (id.includes('providers') && Array.isArray(data.providers)) {
    return `providers=${data.providers.length};default=${String(data.default_provider || '')}`;
  }

  if (id.includes('decision')) {
    const supported = Array.isArray(data.supported_now) ? data.supported_now.length : 0;
    const unsupported = Array.isArray(data.unsupported_now) ? data.unsupported_now.length : 0;
    return `decision=${String(data.status || 'unknown')};supported=${supported};unsupported=${unsupported}`;
  }

  if (id.includes('entitlement_preview')) {
    return `entitlement=${String(data.entitlement?.status || 'unknown')};reason=${String(data.entitlement?.reason || 'unknown')}`;
  }

  return null;
}

async function runCheck(check) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const startedAt = Date.now();

  try {
    const requestInit = {
      method: check.method,
      headers: {
        Accept: 'application/json, text/html;q=0.9,*/*;q=0.8',
      },
      signal: controller.signal,
    };

    if (check.body !== undefined) {
      requestInit.headers['Content-Type'] = 'application/json';
      requestInit.body = JSON.stringify(check.body);
    }

    const response = await fetch(check.url, requestInit);
    const durationMs = Date.now() - startedAt;
    const contentType = response.headers.get('content-type') || '';

    let detail = null;

    if (contentType.includes('application/json')) {
      const payload = await response.json().catch(() => null);
      detail = summarizeJsonPayload(check.id, payload);
    } else {
      const text = await response.text().catch(() => '');
      const compact = text.replace(/\s+/g, ' ').trim();
      detail = compact ? compact.slice(0, 120) : null;
    }

    const expected = Array.isArray(check.expect) ? check.expect : [];
    const matched = expected.length ? expected.includes(response.status) : true;

    return {
      ...check,
      status: response.status,
      ok: matched,
      error: null,
      duration_ms: durationMs,
      final_url: response.url,
      detail,
    };
  } catch (error) {
    const durationMs = Date.now() - startedAt;
    const message = error instanceof Error ? error.message : String(error);

    return {
      ...check,
      status: null,
      ok: false,
      error: message,
      duration_ms: durationMs,
      final_url: check.url,
      detail: null,
    };
  } finally {
    clearTimeout(timer);
  }
}

function formatLine(result) {
  const expected = Array.isArray(result.expect) && result.expect.length
    ? result.expect.join('|')
    : 'any';

  const status = result.status === null ? 'ERR' : String(result.status);
  const marker = result.ok ? 'PASS' : 'FAIL';
  const core = `[${result.lane}] ${result.method} ${result.url} -> ${status} (expect ${expected}) ${marker}`;

  if (result.error) {
    return `${core} :: error=${result.error}`;
  }

  if (result.detail) {
    return `${core} :: ${result.detail}`;
  }

  return core;
}

function buildTextReport(results, generatedAtIso) {
  const passes = results.filter((result) => result.ok).length;
  const fails = results.length - passes;
  const lines = [
    '# Trail Assistant URL Matrix Verification',
    `generated_at=${generatedAtIso}`,
    `timeout_ms=${timeoutMs}`,
    `total=${results.length} pass=${passes} fail=${fails}`,
    '',
  ];

  for (const result of results) {
    lines.push(formatLine(result));
  }

  lines.push('');

  return lines.join('\n');
}

async function writeFileIfRequested(filePath, content) {
  if (!filePath) {
    return;
  }

  const absolutePath = path.isAbsolute(filePath)
    ? filePath
    : path.join(process.cwd(), filePath);

  await fs.mkdir(path.dirname(absolutePath), { recursive: true });
  await fs.writeFile(absolutePath, content, 'utf8');
}

async function main() {
  const generatedAtIso = new Date().toISOString();
  const results = [];

  for (const check of checks) {
    // eslint-disable-next-line no-await-in-loop
    const result = await runCheck(check);
    results.push(result);
  }

  const report = buildTextReport(results, generatedAtIso);
  process.stdout.write(`${report}\n`);

  const payload = {
    generated_at: generatedAtIso,
    timeout_ms: timeoutMs,
    results,
  };

  await writeFileIfRequested(outputPath, report);
  await writeFileIfRequested(jsonPath, `${JSON.stringify(payload, null, 2)}\n`);

  const failed = results.some((result) => !result.ok);
  process.exitCode = failed ? 1 : 0;
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  process.stderr.write(`trail-assistant-url-matrix failed: ${message}\n`);
  process.exitCode = 1;
});
