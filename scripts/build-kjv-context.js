/**
 * Build KJV Bible context file for the Bible AI chat.
 * Fetches KJV from GitHub and formats it with book/chapter/verse references.
 */

import { writeFile, mkdir } from 'fs/promises';

const KJV_URL = 'https://raw.githubusercontent.com/thiagobodruk/bible/master/json/en_kjv.json';

// Book name mappings (abbrev -> full name)
const BOOK_NAMES = {
  gn: 'Genesis', ex: 'Exodus', lv: 'Leviticus', nm: 'Numbers', dt: 'Deuteronomy',
  js: 'Joshua', jud: 'Judges', rt: 'Ruth', '1sm': '1 Samuel', '2sm': '2 Samuel',
  '1kgs': '1 Kings', '2kgs': '2 Kings', '1ch': '1 Chronicles', '2ch': '2 Chronicles',
  ezr: 'Ezra', ne: 'Nehemiah', et: 'Esther', job: 'Job', ps: 'Psalms',
  prv: 'Proverbs', eccl: 'Ecclesiastes', so: 'Song of Solomon', is: 'Isaiah',
  jr: 'Jeremiah', lm: 'Lamentations', ez: 'Ezekiel', dn: 'Daniel', ho: 'Hosea',
  jl: 'Joel', am: 'Amos', ob: 'Obadiah', jn: 'Jonah', mi: 'Micah', na: 'Nahum',
  hk: 'Habakkuk', zp: 'Zephaniah', hg: 'Haggai', zc: 'Zechariah', ml: 'Malachi',
  mt: 'Matthew', mk: 'Mark', lk: 'Luke', jo: 'John', act: 'Acts',
  rm: 'Romans', '1co': '1 Corinthians', '2co': '2 Corinthians', gl: 'Galatians',
  eph: 'Ephesians', ph: 'Philippians', cl: 'Colossians', '1ts': '1 Thessalonians',
  '2ts': '2 Thessalonians', '1tm': '1 Timothy', '2tm': '2 Timothy', tt: 'Titus',
  phm: 'Philemon', hb: 'Hebrews', jm: 'James', '1pe': '1 Peter', '2pe': '2 Peter',
  '1jo': '1 John', '2jo': '2 John', '3jo': '3 John', jd: 'Jude', re: 'Revelation'
};

async function build() {
  console.log('Fetching KJV Bible from GitHub...');

  const res = await fetch(KJV_URL);
  if (!res.ok) throw new Error(`Failed to fetch KJV: ${res.status}`);

  const books = await res.json();
  console.log(`Loaded ${books.length} books`);

  let output = '# King James Version Bible (Pure Cambridge Edition)\n\n';
  let totalVerses = 0;

  for (const book of books) {
    const bookName = BOOK_NAMES[book.abbrev] || book.abbrev;
    output += `\n## ${bookName}\n\n`;

    for (let chapterIdx = 0; chapterIdx < book.chapters.length; chapterIdx++) {
      const chapter = book.chapters[chapterIdx];
      const chapterNum = chapterIdx + 1;

      for (let verseIdx = 0; verseIdx < chapter.length; verseIdx++) {
        const verseNum = verseIdx + 1;
        let verseText = chapter[verseIdx];

        // Clean up any annotation markers like {Heb. ...}
        verseText = verseText.replace(/\{[^}]+\}/g, '').trim();

        output += `${bookName} ${chapterNum}:${verseNum} ${verseText}\n`;
        totalVerses++;
      }
      output += '\n';
    }
  }

  await mkdir('public', { recursive: true });
  await writeFile('public/kjv-context.txt', output);

  const sizeKB = (Buffer.byteLength(output, 'utf8') / 1024).toFixed(1);
  console.log(`Built kjv-context.txt: ${sizeKB} KB, ${totalVerses} verses`);
}

build().catch(err => {
  console.error('Build failed:', err);
  process.exit(1);
});
