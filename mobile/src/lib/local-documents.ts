import type { LocalDocumentReference, LocalDocumentSource } from './scout/types.ts';
import type { TrailDocument } from './types';

export const MAX_LOCAL_DOCUMENTS = 50;
export const MAX_LOCAL_DOCUMENT_TOMBSTONES = 25;
export const MAX_LOCAL_DOCUMENT_BODY_CHARS = 12_000;
export const MAX_LOCAL_DOCUMENT_REVISIONS = 8;

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
		updatedAt: now,
		revision: 1,
		revisions: []
	};
}

export function updateTrailDocument(
	document: TrailDocument,
	input: { title: string; body: string },
	now = new Date().toISOString()
): TrailDocument {
	const title = cleanDocumentTitle(input.title);
	const body = clampDocumentBody(input.body);
	if (title === document.title && body === document.body && !document.deletedAt) return document;
	return {
		...document,
		title,
		body,
		updatedAt: now,
		deletedAt: undefined,
		revision: normalizeRevision(document.revision) + 1,
		revisions: appendRevision(document, document.revisions)
	};
}

export function deleteTrailDocument(
	document: TrailDocument,
	now = new Date().toISOString()
): TrailDocument {
	if (document.deletedAt) return document;
	return {
		...document,
		updatedAt: now,
		deletedAt: now,
		revision: normalizeRevision(document.revision) + 1,
		revisions: appendRevision(document, document.revisions)
	};
}

export function restoreTrailDocument(
	document: TrailDocument,
	now = new Date().toISOString()
): TrailDocument {
	if (!document.deletedAt) return document;
	return {
		...document,
		updatedAt: now,
		deletedAt: undefined,
		revision: normalizeRevision(document.revision) + 1,
		revisions: appendRevision(document, document.revisions)
	};
}

export function limitTrailDocuments(
	documents: TrailDocument[],
	maxDocuments = MAX_LOCAL_DOCUMENTS
): TrailDocument[] {
	const active = documents.filter((document) => !document.deletedAt).slice(0, maxDocuments);
	const deleted = documents
		.filter((document) => document.deletedAt)
		.slice(0, MAX_LOCAL_DOCUMENT_TOMBSTONES);
	return [...active, ...deleted];
}

export function toContextDocuments(documents: TrailDocument[]): LocalDocumentReference[] {
	return activeTrailDocuments(documents).map((document) => ({
		id: document.id,
		title: document.title,
		body: document.body,
		source: document.source,
		createdAt: document.createdAt,
		updatedAt: document.updatedAt
	}));
}

export function activeTrailDocuments(documents: TrailDocument[]): TrailDocument[] {
	return documents.filter((document) => !document.deletedAt);
}

export function deletedTrailDocuments(documents: TrailDocument[]): TrailDocument[] {
	return documents.filter((document) => Boolean(document.deletedAt));
}

export function normalizeTrailDocument(document: TrailDocument): TrailDocument {
	return {
		...document,
		revision: normalizeRevision(document.revision),
		revisions: normalizeRevisions(document.revisions),
		deletedAt: typeof document.deletedAt === 'string' && document.deletedAt ? document.deletedAt : undefined
	};
}

export function normalizeTrailDocuments(documents: TrailDocument[]): TrailDocument[] {
	return limitTrailDocuments(documents.map((document) => normalizeTrailDocument(document)));
}

function normalizeRevision(value: unknown): number {
	return typeof value === 'number' && Number.isFinite(value) && value >= 1 ? Math.floor(value) : 1;
}

function normalizeRevisions(value: unknown): TrailDocument['revisions'] {
	if (!Array.isArray(value)) return [];
	return value
		.filter((revision): revision is TrailDocument['revisions'][number] => (
			typeof revision?.revision === 'number' &&
			typeof revision?.title === 'string' &&
			typeof revision?.body === 'string' &&
			(revision?.source === 'manual' || revision?.source === 'scout-draft') &&
			typeof revision?.updatedAt === 'string'
		))
		.slice(-MAX_LOCAL_DOCUMENT_REVISIONS);
}

function appendRevision(
	document: TrailDocument,
	revisions: TrailDocument['revisions'] = []
): TrailDocument['revisions'] {
	return [
		...normalizeRevisions(revisions),
		{
			revision: normalizeRevision(document.revision),
			title: document.title,
			body: document.body,
			source: document.source,
			updatedAt: document.updatedAt
		}
	].slice(-MAX_LOCAL_DOCUMENT_REVISIONS);
}
