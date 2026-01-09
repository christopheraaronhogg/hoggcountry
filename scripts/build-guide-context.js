import { readFile, writeFile, mkdir } from 'fs/promises';

const MASTER_GUIDE = 'MASTER_NOBO_FIELD_GUIDE.md';
const OUTPUT = 'public/guide-context.txt';

async function build() {
  // Use master guide as single source of truth
  const content = await readFile(MASTER_GUIDE, 'utf-8');
  await mkdir('public', { recursive: true });
  await writeFile(OUTPUT, content);
  console.log(`Built guide-context.txt: ${content.length} chars from ${MASTER_GUIDE}`);
}
build().catch(console.error);
