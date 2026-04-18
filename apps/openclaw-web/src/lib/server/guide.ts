import { existsSync } from 'node:fs';
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { marked } from 'marked';

export interface GuideEntry {
  readonly slug: string;
  readonly title: string;
  readonly description: string;
  readonly part: number;
  readonly order: number;
  readonly html: string;
  readonly markdown: string;
  readonly excerpt: string;
  readonly quickRef: boolean;
}

const GUIDE_DIR = resolveGuideDir();

function resolveGuideDir(): string {
  const candidates = [
    path.resolve(process.cwd(), 'src/content/guide'),
    path.resolve(process.cwd(), '../src/content/guide'),
    path.resolve(process.cwd(), '../../src/content/guide'),
    fileURLToPath(new URL('../../../../../../src/content/guide/', import.meta.url))
  ];

  for (const candidate of candidates) {
    if (existsSync(candidate)) {
      return candidate;
    }
  }

  return candidates[0];
}

async function listGuideFiles(dir: string, prefix = ''): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true });
  const nested = await Promise.all(
    entries.map(async (entry) => {
      if (entry.isDirectory()) {
        return listGuideFiles(path.join(dir, entry.name), path.posix.join(prefix, entry.name));
      }

      if (entry.isFile() && entry.name.endsWith('.md')) {
        return [path.posix.join(prefix, entry.name)];
      }

      return [] as string[];
    })
  );

  return nested.flat();
}

function parseFrontmatter(content: string): { frontmatter: Record<string, string | number | boolean>; body: string } {
  const match = /^---\n([\s\S]*?)\n---\n?/u.exec(content);
  if (!match) return { frontmatter: {}, body: content };

  const raw = match[1];
  const frontmatter: Record<string, string | number | boolean> = {};
  for (const line of raw.split('\n')) {
    const idx = line.indexOf(':');
    if (idx <= 0) continue;
    const key = line.slice(0, idx).trim();
    let value: string | number | boolean = line.slice(idx + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (value === 'true') value = true;
    else if (value === 'false') value = false;
    else if (value !== '' && !Number.isNaN(Number(value))) value = Number(value);
    frontmatter[key] = value;
  }

  return { frontmatter, body: content.slice(match[0].length).trim() };
}

function excerpt(text: string): string {
  const normalized = text.replace(/\s+/g, ' ').trim();
  return normalized.length <= 180 ? normalized : `${normalized.slice(0, 177).trimEnd()}...`;
}

async function loadGuideFile(fileName: string): Promise<GuideEntry> {
  const normalizedFileName = fileName.replace(/\\/gu, '/');
  const fullPath = path.join(GUIDE_DIR, normalizedFileName);
  const content = await readFile(fullPath, 'utf-8');
  const { frontmatter, body } = parseFrontmatter(content);
  const slug = normalizedFileName.replace(/\.md$/u, '');
  const title = String(frontmatter.title ?? slug);
  const description = String(frontmatter.description ?? excerpt(body));
  const html = await marked.parse(body);

  return {
    slug,
    title,
    description,
    part: Number(frontmatter.part ?? 0),
    order: Number(frontmatter.order ?? 0),
    html,
    markdown: body,
    excerpt: excerpt(body),
    quickRef: Boolean(frontmatter.quickRef ?? false)
  };
}

export async function loadGuideIndex(): Promise<GuideEntry[]> {
  const files = await listGuideFiles(GUIDE_DIR);
  const guide = await Promise.all(files.map((file) => loadGuideFile(file)));
  return guide.sort((left, right) => {
    if (left.part !== right.part) return left.part - right.part;
    return left.order - right.order;
  });
}

export async function loadGuideBySlug(slug: string): Promise<GuideEntry | null> {
  const normalizedSlug = slug.replace(/\\/gu, '/').replace(/^\/+|\/+$/gu, '');
  const segments = normalizedSlug.split('/').filter(Boolean);

  if (segments.length === 0 || segments.some((segment) => !/^[a-z0-9-]+$/iu.test(segment))) {
    return null;
  }

  const safeSlug = segments.join('/');
  const candidatePath = path.resolve(GUIDE_DIR, `${safeSlug}.md`);
  const relative = path.relative(GUIDE_DIR, candidatePath);

  if (relative.startsWith('..') || path.isAbsolute(relative)) {
    return null;
  }

  try {
    return await loadGuideFile(`${safeSlug}.md`);
  } catch {
    return null;
  }
}
