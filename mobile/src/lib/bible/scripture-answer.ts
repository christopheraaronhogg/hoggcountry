/**
 * Scripture Ask — the conversational layer over {@link bible-index}.
 *
 * Flow: lexical search pulls candidate PCE verses → a scripture-focused persona
 * prompt is built around ONLY those verses → a model writes a short, grounded
 * answer → {@link enforceScriptureCitations} rewrites any quoted verse with exact
 * PCE text. The model is pluggable via {@link ScriptureGenerator}:
 *   - on iOS, the on-device Gemma bridge (required, like Scout);
 *   - on the web PWA, the Laravel `/scripture/answer` proxy (Chris's OpenAI key).
 * Whichever runs, the displayed verses always come from the index, and quotes in
 * the prose are always re-sourced from the PCE — the model can't put words in
 * scripture's mouth.
 */

import { apiRequest } from '../cloud/api.ts';
import type { BibleIndex } from './bible-index.ts';
import { enforceScriptureCitations } from './scripture-citations.ts';

export interface ScriptureVerse {
	reference: string;
	text: string;
}

export interface ScriptureGenerateInput {
	/** Full persona + verses system prompt (used by the on-device path). */
	systemContext: string;
	/** The hiker's raw question. */
	prompt: string;
	/** The exact PCE verses (used by the cloud path, which builds its own prompt). */
	verses: ScriptureVerse[];
}

export type ScriptureGenerator = (input: ScriptureGenerateInput) => Promise<string>;

export interface ScriptureAnswer {
	answer: string;
	verses: ScriptureVerse[];
	references: string[];
	invalidReferences: string[];
	corrections: number;
}

const MAX_VERSES = 5;

/**
 * The scripture persona. Kept deliberately tight: ground ONLY in the supplied
 * verses, quote them verbatim in the `Reference — "text"` shape the enforcer
 * expects, and never cite anything not in the list. Mirrored server-side for the
 * cloud path; enforcement makes correctness independent of either copy.
 */
export function buildScriptureSystemPrompt(verses: ScriptureVerse[]): string {
	const verseBlock = verses.length
		? verses.map((verse) => `${verse.reference} — "${verse.text}"`).join('\n')
		: '(no verse matched this question)';
	return [
		'You are a plain-spoken scripture companion. You help someone understand what the King James Bible says about their question.',
		'Ground your answer ONLY in the verses listed below. Do not bring in other verses, outside doctrine, or facts that are not here. If these verses do not address the question, say so honestly rather than inventing support.',
		'Speak warmly and simply, like a thoughtful friend — not a preacher, scholar, or chatbot. Keep it short: two to four short paragraphs.',
		'When you cite a verse, write its reference, an em dash, and the verse in double quotes exactly as shown below — for example: James 1:3 — "the trying of your faith worketh patience." Quote at most two verses; refer to any others by reference only.',
		'Never reword, modernize, or paraphrase the text inside quotation marks. Never cite a reference that is not in the list.',
		'Use plain text only — no markdown headings, bold, or bullet lists.',
		'',
		'Verses you may use:',
		verseBlock
	].join('\n');
}

/**
 * Run the full Scripture Ask flow. Throws if {@code generate} throws (offline,
 * model unavailable) — callers fall back to showing the verse cards alone.
 */
export async function answerScripture(opts: {
	question: string;
	index: BibleIndex;
	generate: ScriptureGenerator;
	limit?: number;
}): Promise<ScriptureAnswer> {
	const { question, index, generate } = opts;
	const hits = index.search(question, opts.limit ?? MAX_VERSES);
	const verses: ScriptureVerse[] = hits.map((hit) => ({ reference: hit.reference, text: hit.text }));

	// No verses to stand on — don't spend a model call (or hit the paid proxy)
	// only to ground on nothing. The caller shows the "no verses" state.
	if (!verses.length) {
		return { answer: '', verses, references: [], invalidReferences: [], corrections: 0 };
	}

	const systemContext = buildScriptureSystemPrompt(verses);
	const raw = await generate({ systemContext, prompt: question, verses });
	const enforced = enforceScriptureCitations((raw ?? '').trim(), index);

	return {
		answer: enforced.text.trim(),
		verses,
		references: enforced.references,
		invalidReferences: enforced.invalidReferences,
		corrections: enforced.corrections
	};
}

/**
 * Web PWA generator: posts the question + exact verses to the Laravel proxy,
 * which holds the OpenAI key and builds the persona server-side. We deliberately
 * do NOT send a client-authored system prompt — that would turn the key into an
 * open proxy.
 */
export function createCloudScriptureGenerator(): ScriptureGenerator {
	return async ({ prompt, verses }) => {
		const data = await apiRequest<{ answer: string }>('/scripture/answer', {
			method: 'POST',
			body: { question: prompt, verses }
		});
		return data?.answer ?? '';
	};
}
