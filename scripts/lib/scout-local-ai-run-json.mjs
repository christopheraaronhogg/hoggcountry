import { readFile } from 'node:fs/promises';
import { extname } from 'node:path';

const SUPPORTED_EXPORT_EXTENSIONS = new Set(['.json', '.txt', '.text']);

export function isSupportedScoutEvalExportFileName(name) {
	return SUPPORTED_EXPORT_EXTENSIONS.has(extname(String(name)).toLowerCase());
}

export async function readScoutEvalRunJson(path) {
	return parseScoutEvalRunJson(await readFile(path, 'utf8'));
}

export function parseScoutEvalRunJson(text) {
	const trimmed = String(text ?? '').trim();
	const direct = parseJsonObject(trimmed);
	if (direct) {
		return { run: direct, extractedJson: false };
	}
	const candidates = extractJsonObjectCandidates(trimmed)
		.map((candidate) => parseJsonObject(candidate))
		.filter(isLikelyScoutEvalRunObject);
	if (candidates.length === 1) {
		return { run: candidates[0], extractedJson: true };
	}
	if (candidates.length > 1) {
		throw new Error('Shared Scout Eval Lab JSON contains more than one run-like JSON object; paste only the Run 100 export.');
	}
	throw new Error('Shared Scout Eval Lab JSON could not be parsed: no run-like JSON object found.');
}

export function isLikelyScoutEvalRunObject(value) {
	return Boolean(value) &&
		typeof value === 'object' &&
		!Array.isArray(value) &&
		typeof value.runId === 'string' &&
		Array.isArray(value.results);
}

function parseJsonObject(text) {
	try {
		const parsed = JSON.parse(text);
		if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
			throw new Error('shared export must be a JSON object');
		}
		return parsed;
	} catch {
		return null;
	}
}

function extractJsonObjectCandidates(text) {
	const candidates = [];
	let depth = 0;
	let start = -1;
	let inString = false;
	let escaped = false;
	for (let index = 0; index < text.length; index += 1) {
		const char = text[index];
		if (inString) {
			if (escaped) {
				escaped = false;
			} else if (char === '\\') {
				escaped = true;
			} else if (char === '"') {
				inString = false;
			}
			continue;
		}
		if (char === '"') {
			inString = true;
			continue;
		}
		if (char === '{') {
			if (depth === 0) start = index;
			depth += 1;
			continue;
		}
		if (char !== '}' || depth === 0) continue;
		depth -= 1;
		if (depth === 0 && start >= 0) {
			candidates.push(text.slice(start, index + 1));
			start = -1;
		}
	}
	return candidates;
}
