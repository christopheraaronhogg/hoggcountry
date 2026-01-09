/**
 * Build Proverbs JSON database for verse lookup.
 * Structure allows exact verse retrieval by chapter:verse.
 */

import { writeFile, mkdir } from 'fs/promises';

const KJV_URL = 'https://raw.githubusercontent.com/thiagobodruk/bible/master/json/en_kjv.json';

async function build() {
  console.log('Fetching KJV Bible from GitHub...');

  const res = await fetch(KJV_URL);
  if (!res.ok) throw new Error(`Failed to fetch KJV: ${res.status}`);

  const books = await res.json();

  // Find Proverbs (abbreviation: prv)
  const proverbs = books.find(book => book.abbrev === 'prv');
  if (!proverbs) throw new Error('Proverbs not found in KJV data');

  console.log(`Found Proverbs with ${proverbs.chapters.length} chapters`);

  // Build structured database: { "3:5": "Trust in the LORD...", ... }
  const verses = {};
  let totalVerses = 0;

  for (let chapterIdx = 0; chapterIdx < proverbs.chapters.length; chapterIdx++) {
    const chapter = proverbs.chapters[chapterIdx];
    const chapterNum = chapterIdx + 1;

    for (let verseIdx = 0; verseIdx < chapter.length; verseIdx++) {
      const verseNum = verseIdx + 1;
      let verseText = chapter[verseIdx];

      // Clean up any annotation markers like {Heb. ...}
      verseText = verseText.replace(/\{[^}]+\}/g, '').trim();

      const key = `${chapterNum}:${verseNum}`;
      verses[key] = verseText;
      totalVerses++;
    }
  }

  await mkdir('public', { recursive: true });
  await writeFile('public/proverbs.json', JSON.stringify(verses, null, 0));

  const sizeKB = (Buffer.byteLength(JSON.stringify(verses), 'utf8') / 1024).toFixed(1);
  console.log(`Built proverbs.json: ${sizeKB} KB, ${totalVerses} verses`);
}

build().catch(err => {
  console.error('Build failed:', err);
  process.exit(1);
});
