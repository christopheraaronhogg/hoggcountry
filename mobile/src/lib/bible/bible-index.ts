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

export interface BibleReferenceQuery {
	bookName: string;
	chapter: number;
	startVerse?: number;
	endChapter?: number;
	endVerse?: number;
}

export interface BibleIndex {
	data: KjvData;
	books: KjvBook[];
	search(query: string, limit?: number): BibleSearchHit[];
	getBook(name: string): KjvBook | undefined;
	getChapter(bookName: string, chapter: number): KjvChapter | undefined;
	resolveReference(reference: string, limit?: number): BibleSearchHit[];
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

const COMMON_BOOK_ALIASES: Record<string, string[]> = {
	Genesis: ['gen'],
	Exodus: ['exo', 'exod'],
	Leviticus: ['lev'],
	Numbers: ['num', 'numb'],
	Deuteronomy: ['deut', 'dt'],
	Joshua: ['josh'],
	Judges: ['judg'],
	Psalms: ['psalm', 'ps', 'psa', 'psalm'],
	Proverbs: ['prov', 'prv'],
	Ecclesiastes: ['eccl'],
	'Song of Solomon': ['song', 'song of songs', 'sos', 'canticles'],
	Isaiah: ['isa'],
	Jeremiah: ['jer'],
	Lamentations: ['lam'],
	Ezekiel: ['ezek'],
	Daniel: ['dan'],
	Hosea: ['hos'],
	Obadiah: ['obad'],
	Jonah: ['jon'],
	Micah: ['mic'],
	Nahum: ['nah'],
	Habakkuk: ['hab'],
	Zephaniah: ['zeph'],
	Haggai: ['hag'],
	Zechariah: ['zech'],
	Malachi: ['mal'],
	Matthew: ['matt', 'mt'],
	Mark: ['mk', 'mrk'],
	Luke: ['lk'],
	John: ['jn', 'jhn'],
	Acts: ['act'],
	Romans: ['rom'],
	'1 Corinthians': ['1 cor', '1 corinth', 'i corinthians', 'i cor', 'first corinthians'],
	'2 Corinthians': ['2 cor', '2 corinth', 'ii corinthians', 'ii cor', 'second corinthians'],
	Galatians: ['gal'],
	Ephesians: ['eph'],
	Philippians: ['phil'],
	Colossians: ['col'],
	'1 Thessalonians': ['1 thess', '1 thes', 'i thessalonians', 'i thess', 'first thessalonians'],
	'2 Thessalonians': ['2 thess', '2 thes', 'ii thessalonians', 'ii thess', 'second thessalonians'],
	'1 Timothy': ['1 tim', 'i timothy', 'i tim', 'first timothy'],
	'2 Timothy': ['2 tim', 'ii timothy', 'ii tim', 'second timothy'],
	Titus: ['tit'],
	Philemon: ['philem', 'phlm'],
	Hebrews: ['heb'],
	James: ['jas'],
	'1 Peter': ['1 pet', 'i peter', 'i pet', 'first peter'],
	'2 Peter': ['2 pet', 'ii peter', 'ii pet', 'second peter'],
	'1 John': ['1 jn', '1 joh', 'i john', 'i jn', 'first john'],
	'2 John': ['2 jn', '2 joh', 'ii john', 'ii jn', 'second john'],
	'3 John': ['3 jn', '3 joh', 'iii john', 'iii jn', 'third john'],
	Revelation: ['rev', 'apocalypse']
};

export function tokenize(text: string): string[] {
	return text
		.toLowerCase()
		.replace(/[^a-z0-9\s]/g, ' ')
		.split(/\s+/)
		.filter((token) => token.length >= 3 && !STOPWORDS.has(token));
}

function normalizeReferenceText(value: string): string {
	return value
		.toLowerCase()
		.replace(/\./g, '')
		.replace(/\s+/g, ' ')
		.trim();
}

function addBookAlias(map: Map<string, KjvBook>, alias: string, book: KjvBook): void {
	const normalized = normalizeReferenceText(alias);
	if (normalized) map.set(normalized, book);
}

/**
 * Builds an in-memory index over already-parsed KJV data. Pure (no IO) so it is
 * unit-testable with a tiny fixture; {@link loadBibleIndex} handles the fetch.
 */
export function buildBibleIndex(data: KjvData): BibleIndex {
	const verses: KjvVerse[] = [];
	const verseBook: string[] = [];
	const booksByName = new Map<string, KjvBook>();
	const booksByAlias = new Map<string, KjvBook>();

	for (const book of data.books) {
		booksByName.set(book.name.toLowerCase(), book);
		addBookAlias(booksByAlias, book.name, book);
		addBookAlias(booksByAlias, book.abbreviation, book);
		for (const alias of COMMON_BOOK_ALIASES[book.name] ?? []) {
			addBookAlias(booksByAlias, alias, book);
		}
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
		const referenceHits = resolveReference(query, limit);
		if (referenceHits.length) return referenceHits;

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

		const expanded = expandQuestionAnswerVerses(ranked).slice(0, limit);
		return expanded.map((index) => ({
			reference: verses[index].reference,
			text: verses[index].text,
			bookName: verseBook[index],
			score: coverage.get(index) ?? 1
		}));
	}

	function expandQuestionAnswerVerses(indices: number[]): number[] {
		const expanded: number[] = [];
		const seen = new Set<number>();

		for (const index of indices) {
			if (!seen.has(index)) {
				expanded.push(index);
				seen.add(index);
			}

			const nextIndex = index + 1;
			const current = verses[index];
			const next = verses[nextIndex];
			if (
				current?.text.trim().endsWith('?') &&
				next &&
				verseBook[nextIndex] === verseBook[index] &&
				next.number === current.number + 1 &&
				!seen.has(nextIndex)
			) {
				expanded.push(nextIndex);
				seen.add(nextIndex);
			}
		}

		return expanded;
	}

	function getBook(name: string): KjvBook | undefined {
		return booksByName.get(name.toLowerCase()) ?? booksByAlias.get(normalizeReferenceText(name));
	}

	function getChapter(bookName: string, chapter: number): KjvChapter | undefined {
		return getBook(bookName)?.chapters.find((c) => c.number === chapter);
	}

	function parseReference(reference: string): BibleReferenceQuery | null {
		const normalized = normalizeReferenceText(reference);
		if (!normalized) return null;

		const aliases = [...booksByAlias.keys()].sort((a, b) => b.length - a.length);
		for (const alias of aliases) {
			if (normalized !== alias && !normalized.startsWith(`${alias} `)) continue;
			const book = booksByAlias.get(alias);
			if (!book) continue;
			const rest = normalized.slice(alias.length).trim();
			if (!rest) continue;
			const readableRest = rest
				.replace(/\bchapter\b|\bchap\b|\bch\b/g, ' ')
				.replace(/\bverses?\b|\bv\b/g, ':')
				.replace(/\s+/g, ' ')
				.trim();

			const verseMatch = readableRest.match(/^(\d+)\s*[:]\s*(\d+)(?:\s*[-–]\s*(?:(\d+)\s*[:]\s*)?(\d+))?$/);
			if (verseMatch) {
				const chapter = Number(verseMatch[1]);
				const startVerse = Number(verseMatch[2]);
				const endChapter = verseMatch[3] ? Number(verseMatch[3]) : undefined;
				const endVerse = verseMatch[4] ? Number(verseMatch[4]) : undefined;
				return {
					bookName: book.name,
					chapter,
					startVerse,
					endChapter,
					endVerse
				};
			}

			const chapterMatch = readableRest.match(/^(\d+)$/);
			if (chapterMatch) {
				return { bookName: book.name, chapter: Number(chapterMatch[1]) };
			}
		}

		return null;
	}

	function hitForVerse(verse: KjvVerse, bookName: string): BibleSearchHit {
		return {
			reference: verse.reference,
			text: verse.text,
			bookName,
			score: 999
		};
	}

	function resolveReference(reference: string, limit = 50): BibleSearchHit[] {
		const parsed = parseReference(reference);
		if (!parsed || !Number.isFinite(parsed.chapter)) return [];
		const book = getBook(parsed.bookName);
		const chapter = book?.chapters.find((c) => c.number === parsed.chapter);
		if (!book || !chapter) return [];

		if (parsed.startVerse == null) {
			return chapter.verses.slice(0, limit).map((verse) => hitForVerse(verse, book.name));
		}

		const startVerse = parsed.startVerse;
		const endChapter = parsed.endChapter ?? parsed.chapter;
		const endVerse = parsed.endVerse ?? parsed.startVerse;
		if (endChapter !== parsed.chapter) return [];
		const lo = Math.min(startVerse, endVerse);
		const hi = Math.max(startVerse, endVerse);
		return chapter.verses
			.filter((verse) => verse.number >= lo && verse.number <= hi)
			.slice(0, limit)
			.map((verse) => hitForVerse(verse, book.name));
	}

	return { data, books: data.books, search, getBook, getChapter, resolveReference };
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
