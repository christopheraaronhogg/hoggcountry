#!/usr/bin/env node

import { execFile } from 'node:child_process';
import process from 'node:process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

const DEFAULT_MODEL = 'gpt-5.5';
const model = process.env.SCOUT_OPENCLAW_LOCAL_MODEL || process.env.OPENCLAW_LOCAL_MODEL || DEFAULT_MODEL;
const timeoutMs = Number.parseInt(
	process.env.SCOUT_OPENCLAW_LOCAL_TIMEOUT_MS || process.env.SCOUT_LOCAL_AI_TIMEOUT_MS || '120000',
	10
);

const payload = JSON.parse(await readStdin());
const prompt = buildPrompt(payload);

const { stdout, stderr } = await execFileAsync(
	'openclaw',
	['infer', 'model', 'run', '--local', '--json', '--model', model, '--prompt', prompt],
	{
		timeout: Number.isFinite(timeoutMs) ? timeoutMs : 120000,
		maxBuffer: 8 * 1024 * 1024,
		env: process.env
	}
);

const parsed = JSON.parse(stdout);
const text = collectOutputText(parsed);

if (!text) {
	throw new Error(`OpenClaw returned no model text.${stderr ? ` stderr: ${stderr.slice(0, 1000)}` : ''}`);
}

process.stdout.write(`${JSON.stringify({
	text,
	truncated: false,
	provider: typeof parsed.provider === 'string' ? parsed.provider : null,
	model: typeof parsed.model === 'string' ? parsed.model : model,
	transport: typeof parsed.transport === 'string' ? parsed.transport : 'local'
})}\n`);

function readStdin() {
	return new Promise((resolve, reject) => {
		let input = '';
		process.stdin.setEncoding('utf8');
		process.stdin.on('data', (chunk) => {
			input += chunk;
		});
		process.stdin.on('end', () => resolve(input.trim()));
		process.stdin.on('error', reject);
	});
}

function buildPrompt(input) {
	const caseId = typeof input.caseId === 'string' ? input.caseId : 'unknown-case';
	const systemContext = typeof input.systemContext === 'string' ? input.systemContext.trim() : '';
	const userPrompt = typeof input.prompt === 'string' ? input.prompt.trim() : '';

	if (!userPrompt) {
		throw new Error('Scout OpenClaw bridge requires payload.prompt.');
	}

	return [
		`Scout local AI eval case: ${caseId}`,
		'Answer as Scout for a hiker. Use only the supplied Scout context, cite the concrete source/tool facts you used, and say when the context is insufficient.',
		systemContext ? `Scout context:\n${systemContext}` : '',
		`Hiker question:\n${userPrompt}`
	].filter(Boolean).join('\n\n');
}

function collectOutputText(result) {
	if (!result || typeof result !== 'object') return '';
	const outputs = Array.isArray(result.outputs) ? result.outputs : [];
	return outputs
		.map((entry) => (entry && typeof entry.text === 'string' ? entry.text.trim() : ''))
		.filter(Boolean)
		.join('\n\n')
		.trim();
}
