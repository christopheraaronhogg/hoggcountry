import type { ContextPack, FieldGuideExcerpt } from './types.ts';

interface OfflineSourceDocsPayload {
	version: number;
	generatedAt: string;
	count: number;
	documents: FieldGuideExcerpt[];
}

const OFFLINE_SOURCE_DOCS_URL = '/scout/offline-source-docs.json';

let docsPromise: Promise<FieldGuideExcerpt[]> | null = null;

function isFieldGuideExcerpt(value: unknown): value is FieldGuideExcerpt {
	return (
		typeof value === 'object' &&
		value !== null &&
		typeof (value as FieldGuideExcerpt).id === 'string' &&
		typeof (value as FieldGuideExcerpt).title === 'string' &&
		typeof (value as FieldGuideExcerpt).body === 'string' &&
		Array.isArray((value as FieldGuideExcerpt).tags)
	);
}

export async function loadOfflineSourceDocs(fetcher: typeof fetch = fetch): Promise<FieldGuideExcerpt[]> {
	if (!docsPromise) {
		docsPromise = fetcher(OFFLINE_SOURCE_DOCS_URL)
			.then((response) => {
				if (!response.ok) throw new Error(`Offline source docs HTTP ${response.status}`);
				return response.json() as Promise<OfflineSourceDocsPayload>;
			})
			.then((payload) => {
				const documents = Array.isArray(payload.documents) ? payload.documents : [];
				return documents.filter(isFieldGuideExcerpt);
			})
			.catch((error) => {
				docsPromise = null;
				throw error;
			});
	}
	return docsPromise;
}

function sameBundledDoc(a: FieldGuideExcerpt, b: FieldGuideExcerpt): boolean {
	return (
		a.body === b.body &&
		(a.prose ?? '') === (b.prose ?? '') &&
		a.title === b.title &&
		(a.citation ?? '') === (b.citation ?? '')
	);
}

export function mergeOfflineSourceDocs(
	pack: ContextPack,
	offlineDocs: FieldGuideExcerpt[]
): { pack: ContextPack; changed: boolean } {
	if (!offlineDocs.length) return { pack, changed: false };
	const byId = new Map(pack.guideExcerpts.map((excerpt) => [excerpt.id, excerpt]));
	let changed = false;
	for (const doc of offlineDocs) {
		// Bundled offline docs are canonical and read-only: add new ones, and
		// refresh any whose content changed (e.g. a new `prose` field) so guide
		// updates reach packs persisted before the change. Identical ones are left
		// alone, so a no-op re-merge reports no change.
		const existing = byId.get(doc.id);
		if (existing && sameBundledDoc(existing, doc)) continue;
		byId.set(doc.id, doc);
		changed = true;
	}
	if (!changed) return { pack, changed: false };
	return {
		pack: {
			...pack,
			guideExcerpts: Array.from(byId.values())
		},
		changed: true
	};
}
