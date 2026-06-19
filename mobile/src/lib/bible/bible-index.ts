/**
 * On-device KJV index: lexical search + reader access, no embeddings and no
 * network. The verse text ships as a packaged static asset
 * ({@code static/bible/kjv.json}, King James Pure Cambridge Edition, 66 books /
 * 31,102 verses), so this works fully offline — the whole point for a hiker with
 * no signal.
 *
 * Two consumers:
 *  - the {@code bible_search} Scout tool, so on-device Gemma grounds and CITES
 *    real scripture instead of paraphrasing from memory; and
 *  - the in-app Bible reader (browse by book/chapter).
 *
 * The parsed data + an inverted token index are built once on first use and
 * cached at module scope. Search ranks by distinct query-token coverage first,
 * then total hits, then brevity (a tighter verse is usually the better cite).
 */

export interface KjvVerse {
	id: string;
	reference: string;
	number: number;
	text: string;
	readingText: string;
	searchText: string;
}

export interface KjvChapter {
	number: number;
	reference: string;
	verses: KjvVerse[];
}

export interface KjvBook {
	number: number;
	abbreviation: string;
	name: string;
	chapters: KjvChapter[];
}

export interface KjvData {
	schemaVersion?: number;
	source?: { name?: string; shortName?: string; edition?: string };
	books: KjvBook[];
}

export interface BibleSearchHit {
	reference: string;
	text: string;
	bookName: string;
	score: number;
}

export interface BibleIndex {
	data: KjvData;
	books: KjvBook[];
	search(query: string, limit?: number): BibleSearchHit[];
	getBook(name: string): KjvBook | undefined;
	getChapter(bookName: string, chapter: number): KjvChapter | undefined;
}

// Common English function words that would otherwise dominate scripture search
// (KJV is dense with "the/and/unto/shall"). Deliberately KEEPS words like "god",
// "lord", "love", "fear" — those are exactly what a faith query is about.
const STOPWORDS = new Set([
	'the', 'and', 'unto', 'that', 'shall', 'for', 'with', 'his', 'her', 'him',
	'they', 'them', 'their', 'was', 'were', 'are', 'but', 'not', 'all', 'you',
	'your', 'thou', 'thee', 'thy', 'thine', 'ye', 'which', 'from', 'this', 'have',
	'had', 'hath', 'will', 'would', 'should', 'can', 'may', 'what', 'when', 'who',
	'how', 'why', 'does', 'did', 'about', 'into', 'out', 'over', 'than', 'then',
	'there', 'here', 'been', 'being', 'has', 'our', 'its', 'it'
]);

export function tokenize(text: string): string[] {
	return text
		.toLowerCase()
		.replace(/[^a-z0-9\s]/g, ' ')
		.split(/\s+/)
		.filter((token) => token.length >= 3 && !STOPWORDS.has(token));
}

/**
 * Builds an in-memory index over already-parsed KJV data. Pure (no IO) so it is
 * unit-testable with a tiny fixture; {@link loadBibleIndex} handles the fetch.
 */
export function buildBibleIndex(data: KjvData): BibleIndex {
	const verses: KjvVerse[] = [];
	const verseBook: string[] = [];
	const booksByName = new Map<string, KjvBook>();

	for (const book of data.books) {
		booksByName.set(book.name.toLowerCase(), book);
		for (const chapter of book.chapters) {
			for (const verse of chapter.verses) {
				verses.push(verse);
				verseBook.push(book.name);
			}
		}
	}

	// Inverted index: token -> set of verse indices.
	const postings = new Map<string, Set<number>>();
	verses.forEach((verse, index) => {
		for (const token of new Set(tokenize(verse.searchText))) {
			let bucket = postings.get(token);
			if (!bucket) {
				bucket = new Set<number>();
				postings.set(token, bucket);
			}
			bucket.add(index);
		}
	});

	function search(query: string, limit = 5): BibleSearchHit[] {
		const tokens = [...new Set(tokenize(query))];
		if (!tokens.length) return [];

		// distinct-token coverage + total hits per candidate verse.
		const coverage = new Map<number, number>();
		const hits = new Map<number, number>();
		for (const token of tokens) {
			const bucket = postings.get(token);
			if (!bucket) continue;
			for (const index of bucket) {
				coverage.set(index, (coverage.get(index) ?? 0) + 1);
				hits.set(index, (hits.get(index) ?? 0) + 1);
			}
		}
		if (!coverage.size) return [];

		const ranked = [...coverage.keys()].sort((a, b) => {
			const cov = (coverage.get(b) ?? 0) - (coverage.get(a) ?? 0);
			if (cov) return cov;
			const hit = (hits.get(b) ?? 0) - (hits.get(a) ?? 0);
			if (hit) return hit;
			// Prefer the tighter verse — usually the cleaner citation.
			return verses[a].text.length - verses[b].text.length;
		});

		return ranked.slice(0, limit).map((index) => ({
			reference: verses[index].reference,
			text: verses[index].text,
			bookName: verseBook[index],
			score: coverage.get(index) ?? 0
		}));
	}

	function getBook(name: string): KjvBook | undefined {
		return booksByName.get(name.toLowerCase());
	}

	function getChapter(bookName: string, chapter: number): KjvChapter | undefined {
		return getBook(bookName)?.chapters.find((c) => c.number === chapter);
	}

	return { data, books: data.books, search, getBook, getChapter };
}

// Lazy, cached load of the packaged KJV asset. The promise is memoized so the
// 19MB parse + index build happens at most once per session.
let indexPromise: Promise<BibleIndex> | null = null;

export function loadBibleIndex(fetcher: typeof fetch = fetch): Promise<BibleIndex> {
	if (!indexPromise) {
		indexPromise = fetcher('/bible/kjv.json')
			.then((response) => {
				if (!response.ok) throw new Error(`KJV asset HTTP ${response.status}`);
				return response.json() as Promise<KjvData>;
			})
			.then((data) => buildBibleIndex(data))
			.catch((error) => {
				// Reset so a later call can retry (e.g. asset not yet available).
				indexPromise = null;
				throw error;
			});
	}
	return indexPromise;
}
