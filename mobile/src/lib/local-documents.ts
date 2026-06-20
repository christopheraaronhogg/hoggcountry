import type { LocalDocumentReference, LocalDocumentSource } from './scout/types.ts';
import type { TrailDocument } from './types';

export const MAX_LOCAL_DOCUMENTS = 50;
export const MAX_LOCAL_DOCUMENT_BODY_CHARS = 12_000;

export function cleanDocumentTitle(value: string, fallback = 'Untitled field note'): string {
	const trimmed = value.replace(/\s+/g, ' ').trim();
	return trimmed || fallback;
}

export function clampDocumentBody(value: string): string {
	return value.trim().slice(0, MAX_LOCAL_DOCUMENT_BODY_CHARS);
}

export function createTrailDocument(
	input: { title: string; body: string; source?: LocalDocumentSource },
	options: { id?: string; now?: string } = {}
): TrailDocument | null {
	const body = clampDocumentBody(input.body);
	if (!body) return null;
	const now = options.now ?? new Date().toISOString();
	return {
		id: options.id ?? crypto.randomUUID(),
		title: cleanDocumentTitle(input.title),
		body,
		source: input.source ?? 'manual',
		createdAt: now,
		updatedAt: now
	};
}

export function updateTrailDocument(
	document: TrailDocument,
	input: { title: string; body: string },
	now = new Date().toISOString()
): TrailDocument {
	return {
		...document,
		title: cleanDocumentTitle(input.title),
		body: clampDocumentBody(input.body),
		updatedAt: now
	};
}

export function limitTrailDocuments(
	documents: TrailDocument[],
	maxDocuments = MAX_LOCAL_DOCUMENTS
): TrailDocument[] {
	return documents.slice(0, maxDocuments);
}

export function toContextDocuments(documents: TrailDocument[]): LocalDocumentReference[] {
	return documents.map((document) => ({
		id: document.id,
		title: document.title,
		body: document.body,
		source: document.source,
		createdAt: document.createdAt,
		updatedAt: document.updatedAt
	}));
}
