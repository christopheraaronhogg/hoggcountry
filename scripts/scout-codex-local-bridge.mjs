#!/usr/bin/env node

import { execFile } from 'node:child_process';
import { createServer } from 'node:http';
import process from 'node:process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

const HOST = process.env.SCOUT_CODEX_BRIDGE_HOST || process.env.OPENCLAW_CODEX_BRIDGE_HOST || '127.0.0.1';
const PORT = Number.parseInt(
  process.env.SCOUT_CODEX_BRIDGE_PORT || process.env.OPENCLAW_CODEX_BRIDGE_PORT || process.env.PORT || '4318',
  10,
);
const DEFAULT_MODEL = process.env.SCOUT_CODEX_MODEL || process.env.OPENCLAW_CODEX_MODEL || 'openai-codex/gpt-5.4';
const TIMEOUT_MS = Number.parseInt(
  process.env.SCOUT_CODEX_TIMEOUT_MS || process.env.OPENCLAW_CODEX_TIMEOUT_MS || '120000',
  10,
);
const MAX_BODY_BYTES = Number.parseInt(
  process.env.SCOUT_CODEX_MAX_BODY_BYTES || process.env.OPENCLAW_CODEX_MAX_BODY_BYTES || '262144',
  10,
);
const DEFAULT_ALLOWED_ORIGINS = [
  'https://hoggcountry.com',
  'https://www.hoggcountry.com',
  'https://hoggcountry.on-forge.com',
  'http://127.0.0.1:5173',
  'http://localhost:5173',
  'http://127.0.0.1:4175',
  'http://localhost:4175',
  'http://127.0.0.1:4176',
  'http://localhost:4176',
];

const allowedOrigins = (() => {
  const configured = (process.env.SCOUT_CODEX_BRIDGE_ALLOWED_ORIGINS || process.env.OPENCLAW_CODEX_BRIDGE_ALLOWED_ORIGINS || '')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);

  return configured.length > 0 ? configured : DEFAULT_ALLOWED_ORIGINS;
})();

function isAllowedOrigin(origin) {
  if (!origin) {
    return false;
  }

  return allowedOrigins.includes(origin);
}

function applyCors(req, res) {
  const origin = typeof req.headers.origin === 'string' ? req.headers.origin : '';

  if (isAllowedOrigin(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
  }

  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

function sendJson(req, res, statusCode, payload) {
  applyCors(req, res);
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(payload, null, 2));
}

function collectOutputText(result) {
  if (!result || typeof result !== 'object') {
    return '';
  }

  const outputs = Array.isArray(result.outputs) ? result.outputs : [];

  return outputs
    .map((entry) => (entry && typeof entry.text === 'string' ? entry.text.trim() : ''))
    .filter(Boolean)
    .join('\n\n')
    .trim();
}

function isSafeModelRef(value) {
  return /^[a-z0-9./_-]+$/i.test(value);
}

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;

    req.on('data', (chunk) => {
      size += chunk.length;
      if (size > MAX_BODY_BYTES) {
        reject(new Error(`Request body exceeds ${MAX_BODY_BYTES} bytes.`));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });

    req.on('end', () => {
      try {
        const raw = Buffer.concat(chunks).toString('utf8').trim();
        resolve(raw === '' ? {} : JSON.parse(raw));
      } catch (error) {
        reject(error);
      }
    });

    req.on('error', reject);
  });
}

async function runPrompt({ prompt, model }) {
  const { stdout, stderr } = await execFileAsync(
    'openclaw',
    ['infer', 'model', 'run', '--gateway', '--json', '--model', model, '--prompt', prompt],
    {
      timeout: Number.isFinite(TIMEOUT_MS) ? TIMEOUT_MS : 120000,
      maxBuffer: 4 * 1024 * 1024,
      env: process.env,
    },
  );

  const parsed = JSON.parse(stdout);
  const text = collectOutputText(parsed);

  if (!text) {
    throw new Error(`Scout Codex bridge returned no text output.${stderr ? ` stderr: ${stderr}` : ''}`);
  }

  return {
    provider: typeof parsed.provider === 'string' ? parsed.provider : 'openai-codex',
    model: typeof parsed.model === 'string' ? parsed.model : model,
    output: text,
  };
}

const server = createServer(async (req, res) => {
  try {
    if (!req.url || !req.method) {
      sendJson(req, res, 400, { ok: false, error: 'Missing method or URL.' });
      return;
    }

    if (req.method === 'OPTIONS') {
      applyCors(req, res);
      res.statusCode = 204;
      res.end();
      return;
    }

    if (req.method === 'GET' && req.url === '/health') {
      sendJson(req, res, 200, {
        ok: true,
        bridge: 'scout-codex-local',
        provider: 'openai-codex',
        defaultModel: DEFAULT_MODEL,
        allowedOrigins,
      });
      return;
    }

    if (req.method === 'POST' && req.url === '/reply') {
      const body = await readJsonBody(req);
      const prompt = typeof body.prompt === 'string' ? body.prompt.trim() : '';
      const requestedModel = typeof body.model === 'string' ? body.model.trim() : DEFAULT_MODEL;
      const model = requestedModel || DEFAULT_MODEL;

      if (prompt === '') {
        sendJson(req, res, 400, { ok: false, error: 'prompt is required.' });
        return;
      }

      if (prompt.length > 12000) {
        sendJson(req, res, 400, { ok: false, error: 'prompt is too long.' });
        return;
      }

      if (!isSafeModelRef(model)) {
        sendJson(req, res, 400, { ok: false, error: 'model contains invalid characters.' });
        return;
      }

      const result = await runPrompt({ prompt, model });

      sendJson(req, res, 200, {
        ok: true,
        provider: result.provider,
        model: result.model,
        output: result.output,
      });
      return;
    }

    sendJson(req, res, 404, { ok: false, error: 'Not found.' });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    sendJson(req, res, 502, { ok: false, error: message });
  }
});

server.listen(PORT, HOST, () => {
  process.stdout.write(
    `Scout Codex local bridge listening on http://${HOST}:${PORT} using ${DEFAULT_MODEL}\n`,
  );
});
