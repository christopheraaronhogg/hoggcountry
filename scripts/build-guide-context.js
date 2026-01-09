import { readdir, readFile, writeFile, mkdir } from 'fs/promises';
import { join } from 'path';

const GUIDE_DIR = 'src/content/guide';
const OUTPUT = 'public/guide-context.txt';

async function build() {
  const files = (await readdir(GUIDE_DIR)).filter(f => f.endsWith('.md')).sort();
  let content = '# AT Field Guide\n\n';
  for (const f of files) {
    const text = await readFile(join(GUIDE_DIR, f), 'utf-8');
    content += text.replace(/^---[\s\S]*?---\n*/m, '') + '\n\n---\n\n';
  }
  try {
    const quick = await readdir(join(GUIDE_DIR, 'quick'));
    for (const f of quick.filter(x => x.endsWith('.md')).sort()) {
      const text = await readFile(join(GUIDE_DIR, 'quick', f), 'utf-8');
      content += text.replace(/^---[\s\S]*?---\n*/m, '') + '\n\n---\n\n';
    }
  } catch {}
  await mkdir('public', { recursive: true });
  await writeFile(OUTPUT, content);
  console.log(`Built: ${content.length} chars`);
}
build().catch(console.error);
