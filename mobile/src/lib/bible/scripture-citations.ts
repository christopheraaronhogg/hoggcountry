/**
 * Citation enforcement for scripture answers.
 *
 * The hard rule: any verse text shown to a reader must be the exact King James
 * Pure Cambridge Edition wording from our packaged index — NEVER what a language
 * model typed. A small on-device model (or even a cloud one) will happily
 * paraphrase or misremember a verse; this module guarantees it can't reach the
 * reader. It scans an answer for `Reference — "quote"` citations and rewrites
 * every quoted span with the canonical PCE text, validating each reference
 * against the index. References that don't resolve are reported as suspect.
 *
 * Pure (index in, text in, text out) so it is fully unit-testable and runs the
 * same way whether the prose came from Gemma on-device or the cloud proxy.
 */

import type { BibleIndex } from './bible-index.ts';

export interface ScriptureCitationResult {
	/** The answer with every cited quote rewritten to exact PCE text. */
	text: string;
	/** Canonical references that resolved against the PCE index. */
	references: string[];
	/** References the model cited that do NOT exist in the PCE — likely invented. */
	invalidReferences: string[];
	/** How many inline quotes were rewritten because they diverged from PCE. */
	corrections: number;
}

function escapeRegExp(value: string): string {
	return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Loose word-only comparison: punctuation, casing and spacing don't count. */
function normalizeForCompare(value: string): string {
	return value
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, ' ')
		.trim();
}

/** Alternation of every book name + abbreviation the index knows, longest-first. */
function bookAlternation(index: BibleIndex): string {
	const names = new Set<string>();
	for (const book of index.books) {
		names.add(book.name);
		if (book.abbreviation) names.add(book.abbreviation);
	}
	return [...names]
		.sort((a, b) => b.length - a.length)
		.map(escapeRegExp)
		.join('|');
}

const REFERENCE_BODY = '\\s+\\d+:\\d+(?:\\s*[\\u2013-]\\s*\\d+)?';

/** Exact PCE text for a reference string ('John 3:16' or 'John 3:16-17'). */
function canonicalTextFor(index: BibleIndex, reference: string): { reference: string; text: string } | null {
	const hits = index.resolveReference(reference);
	if (!hits.length) return null;
	return {
		reference: hits.length > 1 ? `${hits[0].reference}–${hits[hits.length - 1].reference.split(':').pop()}` : hits[0].reference,
		text: hits.map((hit) => hit.text).join(' ')
	};
}

/**
 * Rewrite every `Reference — "quote"` so the quote is exact PCE text, and report
 * which references were valid vs. invented. Bare quotes with no adjacent
 * reference are left untouched — the persona prompt requires a reference on
 * every quote, and the always-from-index verse cards remain the source of truth.
 */
export function enforceScriptureCitations(answer: string, index: BibleIndex): ScriptureCitationResult {
	const books = bookAlternation(index);
	if (!books || !answer) {
		return { text: answer, references: [], invalidReferences: [], corrections: 0 };
	}

	let corrections = 0;

	// Pass 1 — reference followed by a quoted span: replace the span with PCE text.
	const refWithQuote = new RegExp(
		`((?:${books})${REFERENCE_BODY})(\\s*[\\u2014:-]?\\s*)([\"\\u201c])([^\"\\u201d]*)([\"\\u201d])`,
		'g'
	);
	const text = answer.replace(refWithQuote, (whole, reference, separator, openQuote, inner, closeQuote) => {
		const canonical = canonicalTextFor(index, reference);
		if (!canonical) return whole; // unresolved reference — handled in pass 2
		if (normalizeForCompare(inner) !== normalizeForCompare(canonical.text)) corrections += 1;
		const sep = separator && separator.trim() ? separator : ' — ';
		return `${reference}${sep}${openQuote}${canonical.text}${closeQuote}`;
	});

	// Pass 2 — every reference (quoted or not): validate against the PCE index.
	const references: string[] = [];
	const invalidReferences: string[] = [];
	const seen = new Set<string>();
	const refOnly = new RegExp(`(?:${books})${REFERENCE_BODY}`, 'g');
	for (const match of text.matchAll(refOnly)) {
		const raw = match[0].replace(/\s+/g, ' ').trim();
		if (seen.has(raw)) continue;
		seen.add(raw);
		const canonical = canonicalTextFor(index, raw);
		if (canonical) references.push(canonical.reference);
		else invalidReferences.push(raw);
	}

	return { text, references, invalidReferences, corrections };
}
