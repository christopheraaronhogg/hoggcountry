import kjvPceCorpusData from '../generated/kjv-pce.json' with { type: 'json' };

export interface KjvPceVerse {
  readonly book: string;
  readonly bookNumber: number;
  readonly chapter: number;
  readonly verse: number;
  readonly reference: string;
  readonly referenceKey: string;
  readonly text: string;
  readonly testament: 'Old Testament' | 'New Testament';
}

export interface KjvPceMetadata {
  readonly id: string;
  readonly title: string;
  readonly abbreviation: string;
  readonly generatedAt: string;
  readonly verseCount: number;
  readonly source: {
    readonly label: string;
    readonly url: string;
    readonly repo: string;
    readonly commit: string;
    readonly sha256: string;
    readonly license: string;
  };
  readonly verification: {
    readonly pceChecklistSource: string;
    readonly passedChecklist: readonly { readonly reference: string; readonly expected: string }[];
  };
}

export interface KjvPceSearchHit {
  readonly id: string;
  readonly reference: string;
  readonly citation: string;
  readonly text: string;
  readonly snippet: string;
  readonly score: number;
  readonly matchType: 'reference' | 'chapter' | 'phrase' | 'topic';
  readonly verse: KjvPceVerse;
}

export interface KjvPceReferenceRange {
  readonly book: string;
  readonly bookNumber: number;
  readonly chapter: number;
  readonly startVerse?: number;
  readonly endVerse?: number;
}

interface KjvPceCorpus {
  readonly metadata: KjvPceMetadata;
  readonly verses: readonly KjvPceVerse[];
}

const kjvPceCorpus = kjvPceCorpusData as KjvPceCorpus;

export const kjvPceMetadata = kjvPceCorpus.metadata;
export const kjvPceVerses: readonly KjvPceVerse[] = kjvPceCorpus.verses;

const BOOK_ALIASES: Record<string, readonly string[]> = {
  Genesis: ['gen', 'ge', 'gn'],
  Exodus: ['exod', 'exo', 'ex'],
  Leviticus: ['lev', 'le', 'lv'],
  Numbers: ['num', 'nu', 'nm', 'nb'],
  Deuteronomy: ['deut', 'deu', 'dt'],
  Joshua: ['josh', 'jos', 'jsh'],
  Judges: ['judg', 'jdg', 'jg'],
  Ruth: ['rth', 'ru'],
  '1 Samuel': ['1 samuel', '1 sam', '1sam', 'i samuel', 'i sam'],
  '2 Samuel': ['2 samuel', '2 sam', '2sam', 'ii samuel', 'ii sam'],
  '1 Kings': ['1 kings', '1 king', '1 kgs', '1kgs', 'i kings', 'i kgs'],
  '2 Kings': ['2 kings', '2 king', '2 kgs', '2kgs', 'ii kings', 'ii kgs'],
  '1 Chronicles': ['1 chronicles', '1 chron', '1 chr', '1chr', 'i chronicles', 'i chr'],
  '2 Chronicles': ['2 chronicles', '2 chron', '2 chr', '2chr', 'ii chronicles', 'ii chr'],
  Ezra: ['ezr'],
  Nehemiah: ['neh', 'ne'],
  Esther: ['esth', 'est'],
  Job: ['jb'],
  Psalms: ['psalm', 'psalms', 'ps', 'psa', 'psalm.'],
  Proverbs: ['prov', 'pro', 'prv', 'pr'],
  Ecclesiastes: ['eccl', 'ecc', 'qoheleth'],
  'Song of Solomon': ['song', 'song of songs', 'songs', 'sos', 'canticles'],
  Isaiah: ['isa', 'is'],
  Jeremiah: ['jer', 'je', 'jr'],
  Lamentations: ['lam', 'la'],
  Ezekiel: ['ezek', 'eze', 'ezk'],
  Daniel: ['dan', 'da', 'dn'],
  Hosea: ['hos', 'ho'],
  Joel: ['jl'],
  Amos: ['am'],
  Obadiah: ['obad', 'ob'],
  Jonah: ['jon'],
  Micah: ['mic'],
  Nahum: ['nah', 'na'],
  Habakkuk: ['hab'],
  Zephaniah: ['zeph', 'zep', 'zp'],
  Haggai: ['hag', 'hg'],
  Zechariah: ['zech', 'zec', 'zc'],
  Malachi: ['mal', 'ml'],
  Matthew: ['matt', 'mt'],
  Mark: ['mk', 'mrk'],
  Luke: ['lk', 'luk'],
  John: ['jn', 'jhn'],
  Acts: ['act', 'ac'],
  Romans: ['rom', 'ro', 'rm'],
  '1 Corinthians': ['1 corinthians', '1 cor', '1cor', 'i corinthians', 'i cor'],
  '2 Corinthians': ['2 corinthians', '2 cor', '2cor', 'ii corinthians', 'ii cor'],
  Galatians: ['gal', 'ga'],
  Ephesians: ['eph'],
  Philippians: ['phil', 'php'],
  Colossians: ['col'],
  '1 Thessalonians': ['1 thessalonians', '1 thess', '1 th', '1th', 'i thessalonians', 'i thess'],
  '2 Thessalonians': ['2 thessalonians', '2 thess', '2 th', '2th', 'ii thessalonians', 'ii thess'],
  '1 Timothy': ['1 timothy', '1 tim', '1ti', 'i timothy', 'i tim'],
  '2 Timothy': ['2 timothy', '2 tim', '2ti', 'ii timothy', 'ii tim'],
  Titus: ['tit'],
  Philemon: ['philem', 'phm'],
  Hebrews: ['heb'],
  James: ['jas', 'jam'],
  '1 Peter': ['1 peter', '1 pet', '1pe', 'i peter', 'i pet'],
  '2 Peter': ['2 peter', '2 pet', '2pe', 'ii peter', 'ii pet'],
  '1 John': ['1 john', '1 jn', '1jn', 'i john', 'i jn'],
  '2 John': ['2 john', '2 jn', '2jn', 'ii john', 'ii jn'],
  '3 John': ['3 john', '3 jn', '3jn', 'iii john', 'iii jn'],
  Jude: ['jud'],
  Revelation: ['rev', 're', 'apocalypse'],
};

const TOPIC_KEYWORDS: Record<string, readonly string[]> = {
  fear: ['afraid', 'anxious', 'worry', 'worried', 'panic', 'unsafe', 'scared'],
  endurance: ['patience', 'perseverance', 'keep going', 'long miles', 'slog', 'grit'],
  discouragement: ['downcast', 'hopeless', 'burned out', 'quit', 'lonely', 'sad'],
  gratitude: ['thankful', 'thanks', 'praise', 'joy', 'contentment'],
  guidance: ['direction', 'decision', 'next step', 'wisdom', 'route', 'discernment', 'path'],
  rest: ['sleep', 'recovery', 'stillness', 'calm', 'peaceful night'],
  provision: ['money', 'need', 'supply', 'food', 'resupply', 'lack'],
  wisdom: ['judgment', 'understanding', 'counsel', 'discernment', 'practical'],
  strength: ['strong', 'weakness', 'power', 'energy', 'faint'],
  peace: ['calm', 'troubled', 'steady', 'anxiety', 'comfort'],
};

const TOPIC_REFERENCES: Record<string, readonly string[]> = {
  fear: ['Psalms 56:3', 'Isaiah 41:10', 'Joshua 1:9', 'Psalms 27:1', '2 Timothy 1:7'],
  endurance: ['Hebrews 12:1-2', 'James 1:2-4', 'Romans 5:3-5', 'Galatians 6:9', 'Isaiah 40:31'],
  discouragement: ['Psalms 42:11', 'Deuteronomy 31:8', 'John 16:33', '2 Corinthians 4:8-9', 'Psalms 34:17-18'],
  gratitude: ['1 Thessalonians 5:18', 'Psalms 107:1', 'Colossians 3:15-17', 'Psalms 100:4', 'Philippians 4:6-7'],
  guidance: ['Proverbs 3:5-6', 'Psalms 119:105', 'Isaiah 30:21', 'James 1:5', 'Psalms 32:8'],
  rest: ['Matthew 11:28-30', 'Psalms 4:8', 'Psalms 23:1-3', 'Exodus 33:14', 'Proverbs 3:24'],
  provision: ['Matthew 6:31-34', 'Philippians 4:19', 'Psalms 37:25', 'Lamentations 3:22-23', 'Psalms 121:7-8'],
  wisdom: ['James 1:5', 'Proverbs 2:6', 'Proverbs 16:9', 'Proverbs 24:6', 'Psalms 119:66'],
  strength: ['Isaiah 40:29-31', 'Philippians 4:13', 'Psalms 18:32-33', '2 Corinthians 12:9-10', 'Ephesians 6:10'],
  peace: ['John 14:27', 'Philippians 4:6-7', 'Isaiah 26:3', 'Colossians 3:15', 'Romans 15:13'],
};

const verseByKey = new Map(kjvPceVerses.map((verse) => [verse.referenceKey, verse]));
const versesByChapter = new Map<string, readonly KjvPceVerse[]>();
const bookByReferenceName = new Map<string, { name: string; bookNumber: number }>();

for (const verse of kjvPceVerses) {
  const chapterKey = `${verse.bookNumber}:${verse.chapter}`;
  if (!versesByChapter.has(chapterKey)) {
    versesByChapter.set(chapterKey, kjvPceVerses.filter((candidate) => (
      candidate.bookNumber === verse.bookNumber && candidate.chapter === verse.chapter
    )));
  }
  bookByReferenceName.set(normalizeBookName(verse.book), { name: verse.book, bookNumber: verse.bookNumber });
  for (const alias of BOOK_ALIASES[verse.book] ?? []) {
    bookByReferenceName.set(normalizeBookName(alias), { name: verse.book, bookNumber: verse.bookNumber });
  }
}

export function normalizeKjvPceReferenceKey(book: string, chapter: number, verse: number): string {
  return `${book.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}-${chapter}-${verse}`;
}

export function formatKjvPceCitation(reference: string | KjvPceVerse): string {
  return `KJV PCE — ${typeof reference === 'string' ? reference : reference.reference}`;
}

export function formatKjvPceRangeCitation(verses: readonly KjvPceVerse[]): string {
  if (verses.length === 0) return 'KJV PCE';
  if (verses.length === 1) return formatKjvPceCitation(verses[0]);
  const first = verses[0];
  const last = verses[verses.length - 1];
  if (first.book === last.book && first.chapter === last.chapter) {
    return formatKjvPceCitation(`${first.book} ${first.chapter}:${first.verse}-${last.verse}`);
  }
  return `${formatKjvPceCitation(first)} through ${last.reference}`;
}

export function parseKjvPceReference(query: string): KjvPceReferenceRange | null {
  const normalized = query
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/\bchapter\b/giu, '')
    .replace(/\bverse\b/giu, ':')
    .replace(/\s+/g, ' ')
    .trim();

  const match = normalized.match(/^(.+?)\s+(\d{1,3})(?::\s*(\d{1,3})(?:\s*[-–]\s*(\d{1,3}))?)?$/u);
  if (!match) return null;

  const [, rawBook, rawChapter, rawStartVerse, rawEndVerse] = match;
  const book = bookByReferenceName.get(normalizeBookName(rawBook));
  if (!book) return null;

  const chapter = Number(rawChapter);
  const startVerse = rawStartVerse ? Number(rawStartVerse) : undefined;
  const endVerse = rawEndVerse ? Number(rawEndVerse) : startVerse;
  return {
    book: book.name,
    bookNumber: book.bookNumber,
    chapter,
    startVerse,
    endVerse,
  };
}

export function lookupKjvPceReference(query: string): readonly KjvPceVerse[] {
  const parsed = parseKjvPceReference(query);
  if (!parsed) return [];

  const chapterVerses = versesByChapter.get(`${parsed.bookNumber}:${parsed.chapter}`) ?? [];
  if (!parsed.startVerse) return chapterVerses;

  const endVerse = parsed.endVerse ?? parsed.startVerse;
  return chapterVerses.filter((verse) => verse.verse >= parsed.startVerse! && verse.verse <= endVerse);
}

export function searchKjvPce(query: string, limit = 12): KjvPceSearchHit[] {
  const normalized = normalizeText(query);
  if (!normalized) return [];

  const referenceHits = lookupKjvPceReference(query).map((verse, index) => buildHit(verse, 1000 - index, verse.text, 'reference'));
  if (referenceHits.length > 0) return referenceHits.slice(0, limit);

  const topicHits = searchTopicKjvPce(normalized, limit);
  const phraseHits = searchPhraseKjvPce(normalized, Math.max(limit, 20));
  const merged = new Map<string, KjvPceSearchHit>();
  for (const hit of [...topicHits, ...phraseHits]) {
    const current = merged.get(hit.id);
    if (!current || hit.score > current.score) merged.set(hit.id, hit);
  }

  return [...merged.values()]
    .sort((left, right) => right.score - left.score || left.verse.bookNumber - right.verse.bookNumber || left.verse.chapter - right.verse.chapter || left.verse.verse - right.verse.verse)
    .slice(0, limit);
}

function searchTopicKjvPce(normalizedQuery: string, limit: number): KjvPceSearchHit[] {
  const hits: KjvPceSearchHit[] = [];
  for (const [topic, aliases] of Object.entries(TOPIC_KEYWORDS)) {
    const topicMatches = topic.includes(normalizedQuery)
      || normalizedQuery.includes(topic)
      || aliases.some((alias) => normalizedQuery.includes(alias) || alias.includes(normalizedQuery));
    if (!topicMatches) continue;

    for (const reference of TOPIC_REFERENCES[topic] ?? []) {
      for (const verse of lookupKjvPceReference(reference)) {
        hits.push(buildHit(verse, 320, verse.text, 'topic'));
        if (hits.length >= limit) return hits;
      }
    }
  }
  return hits;
}

function searchPhraseKjvPce(normalizedQuery: string, limit: number): KjvPceSearchHit[] {
  const terms = normalizedQuery.split(' ').filter((term) => term.length > 2);
  const hits: KjvPceSearchHit[] = [];

  for (const verse of kjvPceVerses) {
    const normalizedVerse = normalizeText(`${verse.reference} ${verse.text}`);
    let score = 0;
    if (normalizedVerse.includes(normalizedQuery)) {
      score += normalizedVerse.startsWith(normalizedQuery) ? 500 : 420;
    }
    for (const term of terms) {
      if (normalizedVerse.includes(term)) score += 12;
    }
    if (score <= 0) continue;

    hits.push(buildHit(verse, score, snippetFor(verse.text, normalizedQuery), 'phrase'));
  }

  return hits
    .sort((left, right) => right.score - left.score || left.verse.bookNumber - right.verse.bookNumber || left.verse.chapter - right.verse.chapter || left.verse.verse - right.verse.verse)
    .slice(0, limit);
}

function buildHit(
  verse: KjvPceVerse,
  score: number,
  snippet: string,
  matchType: KjvPceSearchHit['matchType'],
): KjvPceSearchHit {
  return {
    id: `kjv-pce:${verse.referenceKey}`,
    reference: verse.reference,
    citation: formatKjvPceCitation(verse),
    text: verse.text,
    snippet,
    score,
    matchType,
    verse,
  };
}

function normalizeBookName(value: string): string {
  return value
    .toLowerCase()
    .replace(/\bfirst\b/gu, '1')
    .replace(/\bsecond\b/gu, '2')
    .replace(/\bthird\b/gu, '3')
    .replace(/\s+/g, ' ')
    .replace(/[^a-z0-9 ]+/g, '')
    .trim();
}

function normalizeText(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s:]+/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function snippetFor(text: string, normalizedQuery: string): string {
  const lowered = text.toLowerCase();
  const index = lowered.indexOf(normalizedQuery);
  if (index < 0) return text.length > 220 ? `${text.slice(0, 220).trimEnd()}...` : text;

  const start = Math.max(0, index - 60);
  const end = Math.min(text.length, index + normalizedQuery.length + 120);
  const prefix = start > 0 ? '...' : '';
  const suffix = end < text.length ? '...' : '';
  return `${prefix}${text.slice(start, end).trim()}${suffix}`;
}
