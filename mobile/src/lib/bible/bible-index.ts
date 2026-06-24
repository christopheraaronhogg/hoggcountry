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

// Words that frame a QUESTION about scripture rather than naming its content.
// "what does the bible say about X" collapses to just "say" (which is in every
// other verse) unless we drop the framing. Applied to QUERIES ONLY — verse text
// keeps every token so the reader and reference lookup are unaffected.
const QUERY_STOPWORDS = new Set([
	'bible', 'scripture', 'scriptures', 'verse', 'verses', 'passage', 'passages',
	'chapter', 'chapters', 'say', 'says', 'said', 'saying', 'tell', 'tells',
	'told', 'talk', 'talks', 'about', 'mention', 'mentions'
]);

// Concept → King James vocabulary. A natural-language question uses modern words
// ("testing", "anxiety") the 1600s text never does ("tempt", "careful"). Each
// query token expands into a concept GROUP; a verse covers the group if it
// matches ANY word in it, so coverage still counts distinct concepts (not raw
// token hits). Extend freely — every entry is a topical question we want to land.
const CONCEPT_SYNONYMS: Record<string, string[]> = {
	testing: ['tempt', 'tempted', 'temptation', 'temptations', 'prove', 'proved', 'try', 'tried', 'trying', 'trial', 'trials', 'tribulation'],
	test: ['tempt', 'tempted', 'temptation', 'prove', 'proved', 'try', 'tried', 'trying', 'trial', 'trials'],
	tested: ['tempted', 'proved', 'tried', 'trial'],
	trials: ['tribulation', 'tribulations', 'temptation', 'temptations', 'try', 'tried', 'trying'],
	anxiety: ['careful', 'carefulness', 'fear', 'afraid', 'troubled', 'trouble', 'cast'],
	anxious: ['careful', 'carefulness', 'fear', 'afraid', 'troubled', 'trouble'],
	worry: ['careful', 'carefulness', 'fear', 'afraid', 'troubled', 'thought', 'thoughts'],
	worried: ['careful', 'fear', 'afraid', 'troubled'],
	stress: ['careful', 'trouble', 'troubled', 'heavy', 'burden', 'rest'],
	fear: ['fear', 'afraid', 'feared', 'dread', 'terror'],
	afraid: ['fear', 'afraid', 'feared', 'dread'],
	money: ['money', 'riches', 'mammon', 'wealth', 'treasure', 'gold', 'silver', 'covetousness'],
	wealth: ['riches', 'mammon', 'wealth', 'treasure', 'abundance'],
	rich: ['riches', 'rich', 'wealth', 'mammon'],
	poverty: ['poor', 'poverty', 'needy', 'want'],
	marriage: ['marriage', 'wife', 'husband', 'wedded', 'wedding', 'married'],
	married: ['marriage', 'wife', 'husband', 'married'],
	divorce: ['divorce', 'divorced', 'adultery'],
	forgiveness: ['forgive', 'forgiven', 'forgiveness', 'pardon', 'trespasses', 'trespass'],
	forgive: ['forgive', 'forgiven', 'forgiveness', 'pardon', 'trespasses'],
	patience: ['patience', 'patient', 'longsuffering', 'endure', 'endured', 'endureth', 'wait'],
	patient: ['patience', 'patient', 'longsuffering', 'endure', 'wait'],
	anger: ['anger', 'angry', 'wrath', 'wroth', 'fury', 'displeased'],
	angry: ['anger', 'angry', 'wrath', 'wroth'],
	healing: ['heal', 'healed', 'healeth', 'healing', 'health', 'whole', 'recover'],
	heal: ['heal', 'healed', 'healeth', 'whole', 'recover'],
	sickness: ['sick', 'sickness', 'disease', 'diseases', 'infirmity', 'plague'],
	death: ['death', 'die', 'died', 'dead', 'grave', 'perish'],
	dying: ['death', 'die', 'died', 'perish'],
	grief: ['mourn', 'mourning', 'sorrow', 'weep', 'wept', 'grief', 'grieved', 'comfort'],
	mourning: ['mourn', 'mourning', 'sorrow', 'weep', 'grief', 'comfort'],
	suffering: ['suffer', 'suffered', 'suffereth', 'affliction', 'afflicted', 'tribulation'],
	suffer: ['suffer', 'suffered', 'affliction', 'tribulation'],
	strength: ['strength', 'strong', 'strengthen', 'strengthened', 'mighty', 'power', 'might'],
	strong: ['strength', 'strong', 'strengthen', 'mighty', 'power'],
	weakness: ['weak', 'weakness', 'infirmity', 'feeble'],
	hope: ['hope', 'hoped', 'hopeth', 'trust', 'expectation'],
	joy: ['joy', 'joyful', 'rejoice', 'rejoiced', 'glad', 'gladness', 'delight'],
	happiness: ['joy', 'joyful', 'rejoice', 'glad', 'gladness', 'blessed'],
	happy: ['joy', 'rejoice', 'glad', 'blessed'],
	peace: ['peace', 'peaceable', 'peacemakers', 'rest', 'quiet', 'quietness'],
	sin: ['sin', 'sinned', 'sins', 'sinneth', 'transgression', 'transgressions', 'iniquity', 'iniquities', 'trespass'],
	salvation: ['salvation', 'saved', 'save', 'saveth', 'redeem', 'redeemed', 'redemption', 'deliver', 'delivered'],
	saved: ['salvation', 'saved', 'save', 'redeemed', 'deliver'],
	faith: ['faith', 'faithful', 'faithfulness', 'believe', 'believed', 'believeth', 'trust'],
	belief: ['faith', 'believe', 'believed', 'believeth', 'trust'],
	love: ['love', 'loved', 'loveth', 'charity', 'beloved', 'lovingkindness'],
	pride: ['pride', 'proud', 'haughty', 'haughtiness', 'lofty', 'arrogancy'],
	humility: ['humble', 'humbled', 'humbleth', 'lowly', 'meek', 'meekness', 'lowliness'],
	humble: ['humble', 'humbled', 'lowly', 'meek', 'meekness'],
	wisdom: ['wisdom', 'wise', 'prudent', 'prudence', 'understanding', 'knowledge'],
	wise: ['wisdom', 'wise', 'prudent', 'understanding'],
	work: ['labour', 'laboured', 'work', 'works', 'worketh', 'toil', 'wrought'],
	works: ['labour', 'work', 'works', 'worketh', 'wrought'],
	prayer: ['pray', 'prayed', 'prayer', 'prayers', 'supplication', 'supplications', 'intercession'],
	pray: ['pray', 'prayed', 'prayer', 'supplication'],
	fasting: ['fast', 'fasted', 'fasting'],
	temptation: ['tempt', 'tempted', 'temptation', 'temptations', 'trial', 'trials'],
	doubt: ['doubt', 'doubted', 'doubtful', 'unbelief', 'wavering'],
	loneliness: ['alone', 'forsaken', 'desolate', 'comfortless'],
	lonely: ['alone', 'forsaken', 'desolate', 'comfortless'],
	enemies: ['enemy', 'enemies', 'foes', 'adversary', 'adversaries'],
	gratitude: ['thanks', 'thanksgiving', 'thankful', 'praise', 'bless'],
	thankfulness: ['thanks', 'thanksgiving', 'thankful', 'praise'],
	generosity: ['give', 'giveth', 'gave', 'bountiful', 'liberal', 'alms', 'cheerful'],
	giving: ['give', 'giveth', 'gave', 'alms', 'offering'],
	children: ['children', 'child', 'sons', 'daughters', 'offspring'],
	family: ['household', 'family', 'father', 'mother', 'children', 'kindred'],
	hunger: ['hunger', 'hungred', 'famine', 'bread'],
	judgment: ['judge', 'judged', 'judgment', 'judgement', 'condemn', 'condemnation'],
	judging: ['judge', 'judged', 'judgment', 'condemn']
};

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

/**
 * Turns a natural-language query into concept GROUPS for search. Each surviving
 * query token becomes a group of equivalent search tokens (itself + any KJV
 * synonyms), with question-framing words dropped. A verse covers a group if it
 * matches ANY token in it — so "testing" reaches verses about "tempt"/"trial"
 * and coverage still measures distinct CONCEPTS, not raw token hits. Exported
 * for unit tests.
 */
export function expandQueryToConceptGroups(query: string): string[][] {
	const groups: string[][] = [];
	const usedTokens = new Set<string>();
	for (const token of tokenize(query)) {
		if (QUERY_STOPWORDS.has(token) || usedTokens.has(token)) continue;
		usedTokens.add(token);
		const synonyms = CONCEPT_SYNONYMS[token] ?? [];
		// The literal token first, then synonyms, de-duped within the group.
		const group = [...new Set([token, ...synonyms])];
		groups.push(group);
	}
	return groups;
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

		const groups = expandQueryToConceptGroups(query);
		if (!groups.length) return [];

		// coverage   = distinct CONCEPT groups a verse satisfies (matching two
		//              synonyms of one concept still counts once);
		// literalCov = groups matched by the user's ACTUAL word, not a synonym —
		//              so a verse that uses the queried word outranks one that only
		//              hits an expansion;
		// hits       = every token match, the last fine tiebreaker.
		const coverage = new Map<number, number>();
		const literalCov = new Map<number, number>();
		const hits = new Map<number, number>();
		for (const group of groups) {
			const literalToken = group[0];
			const matchedByGroup = new Set<number>();
			const literalMatched = new Set<number>();
			for (const token of group) {
				const bucket = postings.get(token);
				if (!bucket) continue;
				for (const index of bucket) {
					matchedByGroup.add(index);
					hits.set(index, (hits.get(index) ?? 0) + 1);
					if (token === literalToken) literalMatched.add(index);
				}
			}
			for (const index of matchedByGroup) {
				coverage.set(index, (coverage.get(index) ?? 0) + 1);
			}
			for (const index of literalMatched) {
				literalCov.set(index, (literalCov.get(index) ?? 0) + 1);
			}
		}
		if (!coverage.size) return [];

		const ranked = [...coverage.keys()].sort((a, b) => {
			const cov = (coverage.get(b) ?? 0) - (coverage.get(a) ?? 0);
			if (cov) return cov;
			const lit = (literalCov.get(b) ?? 0) - (literalCov.get(a) ?? 0);
			if (lit) return lit;
			// Prefer the tighter verse — usually the cleaner citation.
			const brevity = verses[a].text.length - verses[b].text.length;
			if (brevity) return brevity;
			return (hits.get(b) ?? 0) - (hits.get(a) ?? 0);
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
