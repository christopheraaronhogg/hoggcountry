import { existsSync } from 'node:fs';
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import yaml from 'js-yaml';
import { marked } from 'marked';
import { loadGuideIndex } from './guide';

export interface PublicContentEntry {
  readonly slug: string;
  readonly title: string;
  readonly description: string;
  readonly date: string;
  readonly html: string;
  readonly markdown: string;
  readonly excerpt: string;
  readonly tags: readonly string[];
  readonly coverImage?: string;
  readonly collection: 'blog' | 'posts';
}

export interface TripEntry {
  readonly slug: string;
  readonly title: string;
  readonly description: string;
  readonly date: string;
  readonly state?: string;
  readonly trailName?: string;
  readonly location?: string;
  readonly distanceMiles?: number;
  readonly elevationGainFt?: number;
  readonly difficulty?: string;
  readonly coverImage?: string;
  readonly gallery: readonly string[];
  readonly gpxUrl?: string;
  readonly youtube: readonly string[];
  readonly tags: readonly string[];
  readonly html: string;
  readonly markdown: string;
}

export interface TagBucket {
  readonly tag: string;
  readonly trips: readonly TripEntry[];
  readonly posts: readonly PublicContentEntry[];
}

const CONTENT_ROOT = resolveContentRoot();

function resolveContentRoot(): string {
  const candidates = [
    path.resolve(process.cwd(), 'src/content'),
    path.resolve(process.cwd(), '../src/content'),
    path.resolve(process.cwd(), '../../src/content'),
    fileURLToPath(new URL('../../../../../../src/content/', import.meta.url))
  ];

  for (const candidate of candidates) {
    if (existsSync(candidate)) return candidate;
  }

  return candidates[0];
}

async function listMarkdownFiles(dir: string, prefix = ''): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true });
  const nested = await Promise.all(
    entries.map(async (entry) => {
      const nextPrefix = path.posix.join(prefix, entry.name);
      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory()) return listMarkdownFiles(fullPath, nextPrefix);
      if (entry.isFile() && /\.(?:md|mdx)$/iu.test(entry.name)) return [nextPrefix];
      return [] as string[];
    })
  );

  return nested.flat();
}

function parseFrontmatter(content: string): { frontmatter: Record<string, unknown>; body: string } {
  const match = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/u.exec(content);
  if (!match) return { frontmatter: {}, body: content.trim() };

  const parsed = yaml.load(match[1]);
  return {
    frontmatter: parsed && typeof parsed === 'object' ? parsed as Record<string, unknown> : {},
    body: content.slice(match[0].length).trim()
  };
}

function cleanMdxBody(body: string): string {
  return body
    .replace(/^import\s+.+?;?\s*$/gmu, '')
    .replace(/<HeaderLink\b[^>]*>([\s\S]*?)<\/HeaderLink>/giu, '$1')
    .trim();
}

function asString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function asNumber(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return undefined;
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.map((entry) => asString(entry)).filter(Boolean);
}

function normalizeImage(value: unknown): string | undefined {
  const text = asString(value);
  if (!text) return undefined;
  if (text.startsWith('../../assets/')) return undefined;
  return text;
}

function normalizeDate(value: unknown): string {
  if (value instanceof Date) return value.toISOString();
  if (typeof value === 'string' || typeof value === 'number') {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) return parsed.toISOString();
  }
  return new Date(0).toISOString();
}

function excerpt(markdown: string, description?: string): string {
  const preferred = description?.trim();
  if (preferred) return preferred;
  const normalized = markdown
    .replace(/```[\s\S]*?```/gmu, ' ')
    .replace(/<[^>]+>/gmu, ' ')
    .replace(/[#>*_`[\]()-]/gmu, ' ')
    .replace(/\s+/gmu, ' ')
    .trim();
  return normalized.length <= 180 ? normalized : `${normalized.slice(0, 177).trimEnd()}...`;
}

function byDateDesc<T extends { readonly date: string }>(left: T, right: T): number {
  return String(right.date).localeCompare(String(left.date));
}

async function loadContentFile(collection: 'blog' | 'posts', fileName: string): Promise<PublicContentEntry> {
  const fullPath = path.join(CONTENT_ROOT, collection, fileName);
  const content = await readFile(fullPath, 'utf-8');
  const { frontmatter, body } = parseFrontmatter(content);
  const markdown = cleanMdxBody(body);
  const title = asString(frontmatter.title) || fileName.replace(/\.(?:md|mdx)$/iu, '');
  const description = asString(frontmatter.description) || asString(frontmatter.summary);
  const date = normalizeDate(frontmatter.pubDate ?? frontmatter.date ?? frontmatter.updatedDate);

  return {
    slug: fileName.replace(/\.(?:md|mdx)$/iu, ''),
    title,
    description: excerpt(markdown, description),
    date,
    html: await marked.parse(markdown),
    markdown,
    excerpt: excerpt(markdown, description),
    tags: asStringArray(frontmatter.tags),
    coverImage: normalizeImage(frontmatter.heroImage ?? frontmatter.cover_image),
    collection
  };
}

async function loadTripFile(fileName: string): Promise<TripEntry> {
  const fullPath = path.join(CONTENT_ROOT, 'trips', fileName);
  const content = await readFile(fullPath, 'utf-8');
  const { frontmatter, body } = parseFrontmatter(content);
  const markdown = cleanMdxBody(body);
  const title = asString(frontmatter.title) || fileName.replace(/\.md$/iu, '');
  const description = asString(frontmatter.description) || excerpt(markdown);

  return {
    slug: fileName.replace(/\.md$/iu, ''),
    title,
    description,
    date: normalizeDate(frontmatter.date),
    state: asString(frontmatter.state) || undefined,
    trailName: asString(frontmatter.trail_name) || undefined,
    location: asString(frontmatter.location) || undefined,
    distanceMiles: asNumber(frontmatter.distance_miles),
    elevationGainFt: asNumber(frontmatter.elevation_gain_ft),
    difficulty: asString(frontmatter.difficulty) || undefined,
    coverImage: normalizeImage(frontmatter.cover_image),
    gallery: asStringArray(frontmatter.gallery),
    gpxUrl: asString(frontmatter.gpx_url) || undefined,
    youtube: asStringArray(frontmatter.youtube),
    tags: asStringArray(frontmatter.tags),
    html: await marked.parse(markdown),
    markdown
  };
}

export async function loadTrips(): Promise<TripEntry[]> {
  const dir = path.join(CONTENT_ROOT, 'trips');
  const files = await listMarkdownFiles(dir);
  const trips = await Promise.all(files.map((file) => loadTripFile(file)));
  return trips.sort(byDateDesc);
}

export async function loadTripBySlug(slug: string): Promise<TripEntry | null> {
  const normalized = normalizeSlug(slug, 'md');
  if (!normalized) return null;

  try {
    return await loadTripFile(normalized);
  } catch {
    return null;
  }
}

export async function loadBlogEntries(): Promise<PublicContentEntry[]> {
  const dir = path.join(CONTENT_ROOT, 'blog');
  const files = await listMarkdownFiles(dir);
  const entries = await Promise.all(files.map((file) => loadContentFile('blog', file)));
  return entries.sort(byDateDesc);
}

export async function loadBlogEntryBySlug(slug: string): Promise<PublicContentEntry | null> {
  const normalized = normalizeSlug(slug, 'md');
  if (!normalized) return null;

  for (const extension of ['md', 'mdx'] as const) {
    try {
      return await loadContentFile('blog', normalized.replace(/\.md$/u, `.${extension}`));
    } catch {
      // Try the other supported extension.
    }
  }

  return null;
}

export async function loadPosts(): Promise<PublicContentEntry[]> {
  const dir = path.join(CONTENT_ROOT, 'posts');
  const files = await listMarkdownFiles(dir);
  const entries = await Promise.all(files.map((file) => loadContentFile('posts', file)));
  return entries.sort(byDateDesc);
}

export async function loadTags(): Promise<TagBucket[]> {
  const [trips, posts] = await Promise.all([loadTrips(), loadPosts()]);
  const buckets = new Map<string, { trips: TripEntry[]; posts: PublicContentEntry[] }>();

  for (const trip of trips) {
    for (const tag of trip.tags) {
      const bucket = buckets.get(tag) ?? { trips: [], posts: [] };
      bucket.trips.push(trip);
      buckets.set(tag, bucket);
    }
  }

  for (const post of posts) {
    for (const tag of post.tags) {
      const bucket = buckets.get(tag) ?? { trips: [], posts: [] };
      bucket.posts.push(post);
      buckets.set(tag, bucket);
    }
  }

  return Array.from(buckets.entries())
    .map(([tag, bucket]) => ({ tag, trips: bucket.trips, posts: bucket.posts }))
    .sort((left, right) => right.trips.length + right.posts.length - (left.trips.length + left.posts.length));
}

export async function loadTag(tag: string): Promise<TagBucket> {
  const decoded = decodeURIComponent(tag);
  const tags = await loadTags();
  return tags.find((entry) => entry.tag === decoded) ?? { tag: decoded, trips: [], posts: [] };
}

export async function loadPublicUrls(origin: string): Promise<string[]> {
  const guide = await loadGuideIndex();
  const baseUrls = [
    '/',
    '/updates',
    '/videos',
    '/guide',
    '/tools',
    '/at-map',
    '/mountains-ahead',
    '/track',
    '/about',
    '/login',
    '/privacy',
    '/terms'
  ];
  const urls = [
    ...baseUrls,
    ...guide.map((chapter) => `/guide/${chapter.slug}`)
  ];

  return urls.map((url) => new URL(url, origin).toString());
}

function normalizeSlug(slug: string, extension: 'md'): string | null {
  const normalized = slug.replace(/\\/gu, '/').replace(/^\/+|\/+$/gu, '');
  const segments = normalized.split('/').filter(Boolean);

  if (segments.length === 0 || segments.some((segment) => !/^[a-z0-9._-]+$/iu.test(segment))) return null;

  return `${segments.join('/')}.${extension}`;
}
