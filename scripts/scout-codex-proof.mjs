#!/usr/bin/env node

import { execFile } from 'node:child_process';
import process from 'node:process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);
const defaultPrompt = 'Reply with exactly: Hogg Country ChatGPT subscription proof.';
const prompt = process.argv.slice(2).join(' ').trim() || defaultPrompt;
const model = process.env.SCOUT_CODEX_MODEL || process.env.OPENCLAW_CODEX_MODEL || 'openai-codex/gpt-5.4';
const timeoutMs = Number.parseInt(process.env.SCOUT_CODEX_TIMEOUT_MS || process.env.OPENCLAW_CODEX_TIMEOUT_MS || '120000', 10);

function collectText(result) {
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

try {
  const { stdout, stderr } = await execFileAsync(
    'openclaw',
    ['infer', 'model', 'run', '--gateway', '--json', '--model', model, '--prompt', prompt],
    {
      timeout: Number.isFinite(timeoutMs) ? timeoutMs : 120000,
      maxBuffer: 4 * 1024 * 1024,
      env: process.env,
    },
  );

  const parsed = JSON.parse(stdout);
  const text = collectText(parsed);

  if (!text) {
    throw new Error(`Scout Codex proof returned no text output.${stderr ? ` stderr: ${stderr}` : ''}`);
  }

  process.stdout.write(`${text}\n`);
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  process.stderr.write(`scout-codex-proof failed: ${message}\n`);
  process.exitCode = 1;
}
