import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const searchIndexPath = path.join(__dirname, '../public/guide-search-index.json');
const outputPath = path.join(__dirname, '../packages/corpus/generated/public-corpus.ts');

function buildHref(id) {
  return `/guide/#${id}`;
}

function main() {
  const raw = fs.existsSync(searchIndexPath)
    ? JSON.parse(fs.readFileSync(searchIndexPath, 'utf-8'))
    : [];

  const entries = raw.map((entry) => ({
    id: entry.id,
    title: entry.title,
    description: entry.description || '',
    content: entry.content || '',
    headers: entry.headers || '',
    href: buildHref(entry.id),
    sourceLabel: entry.quickRef ? 'Public Reference · Quick Ref' : 'Public Reference · Dad’s Field Guide',
  }));

  const source = `import type { PublicCorpusEntry } from '../src/index';\n\nexport const publicCorpus: readonly PublicCorpusEntry[] = ${JSON.stringify(entries, null, 2)};\n`;

  fs.writeFileSync(outputPath, source, 'utf-8');
  console.log(`Built public corpus: ${outputPath} (${entries.length} entries)`);
}

main();
