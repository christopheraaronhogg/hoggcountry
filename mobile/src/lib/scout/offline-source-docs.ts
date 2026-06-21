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

export function mergeOfflineSourceDocs(
	pack: ContextPack,
	offlineDocs: FieldGuideExcerpt[]
): { pack: ContextPack; changed: boolean } {
	if (!offlineDocs.length) return { pack, changed: false };
	const byId = new Map(pack.guideExcerpts.map((excerpt) => [excerpt.id, excerpt]));
	let changed = false;
	for (const doc of offlineDocs) {
		if (byId.has(doc.id)) continue;
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
