/**
 * Build Proverbs JSON database for verse lookup from the canonical KJV PCE pack.
 * Structure allows exact verse retrieval by chapter:verse.
 */

import { readFile, writeFile, mkdir } from 'fs/promises';

const KJV_PCE_CANONICAL_PATH = 'data/kjv-pce/kjv-pce.json';
const OUTPUT_PATH = 'public/proverbs.json';

async function build() {
  console.log('Building Proverbs JSON from canonical KJV PCE corpus...');
  const corpus = JSON.parse(await readFile(KJV_PCE_CANONICAL_PATH, 'utf8'));

  // Build structured database: { "3:5": "Trust in the LORD...", ... }
  const verses = {};
  let totalVerses = 0;

  for (const verse of corpus.verses) {
    if (verse.book !== 'Proverbs') continue;
    const key = `${verse.chapter}:${verse.verse}`;
    verses[key] = verse.text;
    totalVerses++;
  }

  if (totalVerses !== 915) throw new Error(`Expected 915 Proverbs verses, found ${totalVerses}`);

  await mkdir('public', { recursive: true });
  await writeFile(OUTPUT_PATH, JSON.stringify(verses, null, 0));

  const sizeKB = (Buffer.byteLength(JSON.stringify(verses), 'utf8') / 1024).toFixed(1);
  console.log(`Built proverbs.json: ${sizeKB} KB, ${totalVerses} verses`);
}

build().catch(err => {
  console.error('Build failed:', err);
  process.exit(1);
});
