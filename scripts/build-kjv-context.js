/**
 * Build the bundled KJV Pure Cambridge Edition resource pack.
 *
 * Canonical repo output is JSON. Derived outputs support Field Manual reading,
 * Scout retrieval, search indexing, and fast local lookup.
 */

import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import path from 'node:path';

const SOURCE_COMMIT = 'e892b40ae90667c6680eefc5faf9520079d18261';
const SOURCE_SQL_URL = `https://raw.githubusercontent.com/webplantmedia/the-holy-bible/${SOURCE_COMMIT}/mysql/bible-kjv.sql`;
const SOURCE_REPO_URL = 'https://github.com/webplantmedia/the-holy-bible';
const SOURCE_LABEL = 'webplantmedia/the-holy-bible cpe_bible table';
const GENERATED_AT = '2026-05-06';

const OUTPUT_DIR = 'data/kjv-pce';
const PACKAGE_GENERATED_DIR = 'packages/corpus/generated';
const PUBLIC_DIR = 'public';

const BOOKS = [
  ['Genesis', 50], ['Exodus', 40], ['Leviticus', 27], ['Numbers', 36], ['Deuteronomy', 34],
  ['Joshua', 24], ['Judges', 21], ['Ruth', 4], ['1 Samuel', 31], ['2 Samuel', 24],
  ['1 Kings', 22], ['2 Kings', 25], ['1 Chronicles', 29], ['2 Chronicles', 36], ['Ezra', 10],
  ['Nehemiah', 13], ['Esther', 10], ['Job', 42], ['Psalms', 150], ['Proverbs', 31],
  ['Ecclesiastes', 12], ['Song of Solomon', 8], ['Isaiah', 66], ['Jeremiah', 52], ['Lamentations', 5],
  ['Ezekiel', 48], ['Daniel', 12], ['Hosea', 14], ['Joel', 3], ['Amos', 9],
  ['Obadiah', 1], ['Jonah', 4], ['Micah', 7], ['Nahum', 3], ['Habakkuk', 3],
  ['Zephaniah', 3], ['Haggai', 2], ['Zechariah', 14], ['Malachi', 4], ['Matthew', 28],
  ['Mark', 16], ['Luke', 24], ['John', 21], ['Acts', 28], ['Romans', 16],
  ['1 Corinthians', 16], ['2 Corinthians', 13], ['Galatians', 6], ['Ephesians', 6], ['Philippians', 4],
  ['Colossians', 4], ['1 Thessalonians', 5], ['2 Thessalonians', 3], ['1 Timothy', 6], ['2 Timothy', 4],
  ['Titus', 3], ['Philemon', 1], ['Hebrews', 13], ['James', 5], ['1 Peter', 5],
  ['2 Peter', 3], ['1 John', 5], ['2 John', 1], ['3 John', 1], ['Jude', 1], ['Revelation', 22],
].map(([name, chapters], index) => ({
  name,
  chapters,
  number: index + 1,
  testament: index < 39 ? 'Old Testament' : 'New Testament',
}));

const PCE_CHECKLIST = [
  ['Joshua 19:2', 'or Sheba', 'and Sheba'],
  ['2 Chronicles 33:19', 'all his sin', 'all his sins'],
  ['Job 33:4', 'The Spirit of God', 'The spirit of God'],
  ['Jeremiah 34:16', 'whom ye', 'whom he'],
  ['Ezekiel 11:24', 'by the Spirit of God', 'by the spirit of God'],
  ['Nahum 3:16', 'flieth away', 'fleeth away'],
  ['Matthew 4:1', 'of the Spirit', 'of the spirit'],
  ['Matthew 26:39', 'a little further', 'a little farther'],
  ['Matthew 26:73', 'bewrayeth thee', 'betrayeth thee'],
  ['Mark 1:12', 'the Spirit driveth', 'the spirit driveth'],
  ['Acts 11:28', 'by the spirit', 'by the Spirit'],
  ['1 John 5:8', 'the spirit, and the water', 'the Spirit, and the water'],
  ['Ezra 2:26', 'Ramah and Geba', 'Ramah and Gaba'],
];

function normalizeReferenceKey(book, chapter, verse) {
  return `${book.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}-${chapter}-${verse}`;
}

function decodeSqlString(value) {
  return value
    .replace(/\\'/g, "'")
    .replace(/\\"/g, '"')
    .replace(/\\\\/g, '\\')
    .replace(/\\n/g, '\n')
    .replace(/\\r/g, '\r')
    .replace(/\\t/g, '\t');
}

function extractInsertTuples(sql, tableName) {
  const tuples = [];
  const insertMarker = `INSERT INTO \`${tableName}\``;
  let searchIndex = 0;

  while (searchIndex < sql.length) {
    const insertStart = sql.indexOf(insertMarker, searchIndex);
    if (insertStart < 0) break;

    const valuesStart = sql.indexOf('VALUES', insertStart);
    if (valuesStart < 0) break;

    let cursor = valuesStart + 'VALUES'.length;
    let inString = false;
    let escaped = false;
    for (; cursor < sql.length; cursor++) {
      const char = sql[cursor];
      if (inString) {
        if (escaped) {
          escaped = false;
        } else if (char === '\\') {
          escaped = true;
        } else if (char === "'") {
          inString = false;
        }
        continue;
      }
      if (char === "'") {
        inString = true;
        continue;
      }
      if (char === ';') break;
    }

    if (cursor >= sql.length) {
      throw new Error(`Could not find statement terminator for ${tableName} INSERT starting at ${insertStart}`);
    }

    const values = sql.slice(valuesStart + 'VALUES'.length, cursor);
    let index = 0;
    while (index < values.length) {
      const start = values.indexOf('(', index);
      if (start < 0) break;
      let cursor = start + 1;
      let inString = false;
      let escaped = false;
      let tuple = '';
      for (; cursor < values.length; cursor++) {
        const char = values[cursor];
        if (inString) {
          tuple += char;
          if (escaped) {
            escaped = false;
          } else if (char === '\\') {
            escaped = true;
          } else if (char === "'") {
            inString = false;
          }
          continue;
        }
        if (char === "'") {
          inString = true;
          tuple += char;
          continue;
        }
        if (char === ')') break;
        tuple += char;
      }
      tuples.push(tuple);
      index = cursor + 1;
    }

    searchIndex = cursor + 1;
  }
  return tuples;
}

function parseTupleFields(tuple) {
  const fields = [];
  let cursor = 0;
  while (cursor < tuple.length) {
    while (tuple[cursor] === ' ' || tuple[cursor] === '\n' || tuple[cursor] === '\t' || tuple[cursor] === ',') cursor++;
    if (tuple[cursor] === "'") {
      cursor++;
      let value = '';
      let escaped = false;
      for (; cursor < tuple.length; cursor++) {
        const char = tuple[cursor];
        if (escaped) {
          value += `\\${char}`;
          escaped = false;
          continue;
        }
        if (char === '\\') {
          escaped = true;
          continue;
        }
        if (char === "'") {
          cursor++;
          break;
        }
        value += char;
      }
      fields.push(decodeSqlString(value));
    } else {
      let value = '';
      for (; cursor < tuple.length && tuple[cursor] !== ','; cursor++) value += tuple[cursor];
      fields.push(Number(value.trim()));
    }
  }
  return fields;
}

async function loadSourceSql() {
  const sourceFlagIndex = process.argv.indexOf('--source');
  if (sourceFlagIndex >= 0 && process.argv[sourceFlagIndex + 1]) {
    return readFile(process.argv[sourceFlagIndex + 1], 'utf8');
  }

  const response = await fetch(SOURCE_SQL_URL);
  if (!response.ok) throw new Error(`Failed to fetch pinned KJV PCE SQL source: ${response.status}`);
  return response.text();
}

function buildVerses(sql) {
  const bookByNumber = new Map(BOOKS.map((book) => [book.number, book]));
  const tuples = extractInsertTuples(sql, 'cpe_bible');
  const verses = tuples.map((tuple) => {
    const [bookNumber, chapter, verse, rawText] = parseTupleFields(tuple);
    const book = bookByNumber.get(bookNumber);
    if (!book) throw new Error(`Unknown book number ${bookNumber}`);
    const text = String(rawText).replace(/\[([^\]]+)\]/g, '$1').replace(/\s+/g, ' ').trim();
    return {
      book: book.name,
      bookNumber,
      chapter,
      verse,
      reference: `${book.name} ${chapter}:${verse}`,
      referenceKey: normalizeReferenceKey(book.name, chapter, verse),
      text,
      testament: book.testament,
    };
  });

  verses.sort((left, right) => left.bookNumber - right.bookNumber || left.chapter - right.chapter || left.verse - right.verse);
  return verses;
}

function verifyCorpus(verses) {
  const errors = [];
  if (verses.length !== 31_102) errors.push(`Expected 31,102 verses, found ${verses.length}`);

  const byRef = new Map(verses.map((verse) => [verse.reference, verse]));
  for (const book of BOOKS) {
    for (let chapter = 1; chapter <= book.chapters; chapter++) {
      if (!verses.some((verse) => verse.bookNumber === book.number && verse.chapter === chapter)) {
        errors.push(`Missing ${book.name} ${chapter}`);
      }
    }
  }

  for (const [reference, expected, rejected] of PCE_CHECKLIST) {
    const verse = byRef.get(reference);
    if (!verse) {
      errors.push(`Missing PCE checklist verse ${reference}`);
      continue;
    }
    if (!verse.text.includes(expected)) errors.push(`${reference} does not contain required PCE reading "${expected}"`);
    if (verse.text.includes(rejected)) errors.push(`${reference} contains rejected non-PCE reading "${rejected}"`);
  }

  if (errors.length > 0) throw new Error(`KJV PCE corpus verification failed:\n- ${errors.join('\n- ')}`);
}

function csvEscape(value) {
  const text = String(value);
  return /[",\n\r]/u.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function buildMarkdown(verses, metadata) {
  const lines = [
    '# King James Version Pure Cambridge Edition',
    '',
    `Generated: ${metadata.generatedAt}`,
    `Source: ${metadata.source.label} (${metadata.source.url})`,
    '',
    'This bundled Hogg Country resource uses the KJV Pure Cambridge Edition source table and passes the PCE checklist used by purecambridgeedition.com. Exact verse wording should be retrieved from this corpus rather than model memory.',
    '',
  ];

  let currentBook = '';
  let currentChapter = 0;
  for (const verse of verses) {
    if (verse.book !== currentBook) {
      currentBook = verse.book;
      currentChapter = 0;
      lines.push('', `## ${verse.book}`, '');
    }
    if (verse.chapter !== currentChapter) {
      currentChapter = verse.chapter;
      lines.push('', `### ${verse.book} ${verse.chapter}`, '');
    }
    lines.push(`**${verse.verse}.** ${verse.text}`);
  }

  lines.push('');
  return lines.join('\n');
}

function buildLegacyContext(verses, metadata) {
  return [
    '# King James Version Bible (Pure Cambridge Edition)',
    '',
    `Generated: ${metadata.generatedAt}`,
    `Source: ${metadata.source.label}`,
    'Use exact verse lookup from the KJV PCE corpus; do not rely on model memory for scripture wording.',
    '',
    ...verses.map((verse) => `${verse.reference} ${verse.text}`),
    '',
  ].join('\n');
}

function writeSqlite(sqlitePath, verses) {
  if (!existsSync('/usr/bin/sqlite3') && !existsSync('/opt/homebrew/bin/sqlite3')) {
    console.warn('sqlite3 not found; skipping SQLite output.');
    return;
  }

  const rows = verses.map((verse) => [
    verse.referenceKey,
    verse.reference,
    verse.book,
    verse.bookNumber,
    verse.chapter,
    verse.verse,
    verse.testament,
    verse.text,
  ]);

  const sql = [
    'DROP TABLE IF EXISTS verses;',
    'CREATE TABLE verses (reference_key TEXT PRIMARY KEY, reference TEXT NOT NULL, book TEXT NOT NULL, book_number INTEGER NOT NULL, chapter INTEGER NOT NULL, verse INTEGER NOT NULL, testament TEXT NOT NULL, text TEXT NOT NULL);',
    'CREATE INDEX idx_kjv_pce_book_chapter ON verses(book_number, chapter, verse);',
    'CREATE VIRTUAL TABLE verses_fts USING fts5(reference, book, testament, text, content="verses", content_rowid="rowid");',
    'BEGIN;',
    ...rows.map((row) => `INSERT INTO verses(reference_key, reference, book, book_number, chapter, verse, testament, text) VALUES (${row.map((value) => `'${String(value).replace(/'/g, "''")}'`).join(', ')});`),
    'INSERT INTO verses_fts(rowid, reference, book, testament, text) SELECT rowid, reference, book, testament, text FROM verses;',
    'COMMIT;',
  ].join('\n');

  const result = spawnSync('sqlite3', [sqlitePath], { input: sql, encoding: 'utf8' });
  if (result.status !== 0) {
    throw new Error(`sqlite3 failed: ${result.stderr || result.stdout}`);
  }
}

async function build() {
  console.log('Building KJV PCE resource pack from pinned source...');
  const sql = await loadSourceSql();
  const sourceSha256 = createHash('sha256').update(sql).digest('hex');
  const verses = buildVerses(sql);
  verifyCorpus(verses);

  const metadata = {
    id: 'kjv-pce',
    title: 'King James Version Pure Cambridge Edition',
    abbreviation: 'KJV PCE',
    generatedAt: GENERATED_AT,
    verseCount: verses.length,
    source: {
      label: SOURCE_LABEL,
      url: SOURCE_SQL_URL,
      repo: SOURCE_REPO_URL,
      commit: SOURCE_COMMIT,
      sha256: sourceSha256,
      license: 'Repository is GPL-2.0; KJV text is public domain in the United States. Keep attribution and do not relabel unverified KJV data as PCE.',
    },
    verification: {
      pceChecklistSource: 'https://www.purecambridgeedition.com/checklist',
      passedChecklist: PCE_CHECKLIST.map(([reference, expected]) => ({ reference, expected })),
    },
  };

  const corpus = { metadata, verses };
  const canonicalJson = `${JSON.stringify(corpus, null, 2)}\n`;
  const jsonl = verses.map((verse) => JSON.stringify(verse)).join('\n') + '\n';
  const csv = [
    ['book', 'bookNumber', 'chapter', 'verse', 'reference', 'referenceKey', 'testament', 'text'].join(','),
    ...verses.map((verse) => [
      verse.book,
      verse.bookNumber,
      verse.chapter,
      verse.verse,
      verse.reference,
      verse.referenceKey,
      verse.testament,
      verse.text,
    ].map(csvEscape).join(',')),
  ].join('\n') + '\n';

  await mkdir(OUTPUT_DIR, { recursive: true });
  await mkdir(PACKAGE_GENERATED_DIR, { recursive: true });
  await mkdir(PUBLIC_DIR, { recursive: true });

  await writeFile(path.join(OUTPUT_DIR, 'kjv-pce.json'), canonicalJson);
  await writeFile(path.join(OUTPUT_DIR, 'kjv-pce.jsonl'), jsonl);
  await writeFile(path.join(OUTPUT_DIR, 'kjv-pce.csv'), csv);
  await writeFile(path.join(OUTPUT_DIR, 'kjv-pce.md'), buildMarkdown(verses, metadata));
  writeSqlite(path.join(OUTPUT_DIR, 'kjv-pce.sqlite'), verses);

  await writeFile(path.join(PACKAGE_GENERATED_DIR, 'kjv-pce.json'), canonicalJson);
  await writeFile(path.join(PUBLIC_DIR, 'kjv-pce.md'), buildMarkdown(verses, metadata));
  await writeFile(path.join(PUBLIC_DIR, 'kjv-pce.jsonl'), jsonl);
  await writeFile(path.join(PUBLIC_DIR, 'kjv-context.txt'), buildLegacyContext(verses, metadata));

  console.log(`Built KJV PCE corpus: ${verses.length} verses, source sha256 ${sourceSha256}`);
  console.log(`Outputs: ${OUTPUT_DIR}/kjv-pce.{json,jsonl,csv,md,sqlite}, ${PACKAGE_GENERATED_DIR}/kjv-pce.json, public/kjv-context.txt`);
}

build().catch((error) => {
  console.error(error);
  process.exit(1);
});
