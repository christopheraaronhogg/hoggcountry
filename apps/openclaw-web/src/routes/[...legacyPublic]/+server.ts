import { createReadStream, existsSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Readable } from 'node:stream';
import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

// Fallback for assets that still live in the legacy Astro public/ dir
// (game build, KJV corpus, field-guide PDF, og banner, etc.). Rest routes
// have the lowest matching priority in SvelteKit, so every explicit route
// and static/ file wins before a request lands here. This avoids
// duplicating ~20MB of binaries into apps/openclaw-web/static during the
// migration; move files into static/ (or retire them) to take them off
// this path.
const PUBLIC_ROOT = resolvePublicRoot();

function resolvePublicRoot(): string | null {
  const candidates = [
    path.resolve(process.cwd(), 'public'),
    path.resolve(process.cwd(), '../public'),
    path.resolve(process.cwd(), '../../public'),
    fileURLToPath(new URL('../../../../../../public/', import.meta.url))
  ];

  for (const candidate of candidates) {
    if (existsSync(path.join(candidate, 'robots.txt'))) return candidate;
  }

  return null;
}

const CONTENT_TYPES: Record<string, string> = {
  '.css': 'text/css; charset=utf-8',
  '.geojson': 'application/geo+json',
  '.gif': 'image/gif',
  '.html': 'text/html; charset=utf-8',
  '.ico': 'image/x-icon',
  '.jpeg': 'image/jpeg',
  '.jpg': 'image/jpeg',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.jsonl': 'application/x-ndjson; charset=utf-8',
  '.md': 'text/markdown; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.mp4': 'video/mp4',
  '.pdf': 'application/pdf',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.txt': 'text/plain; charset=utf-8',
  '.webp': 'image/webp',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.xml': 'application/xml; charset=utf-8'
};

const IMMUTABLE_PREFIXES = ['/game/assets/', '/fonts/'];

// Never serve these from the legacy dir. /sw.js is the retired Astro service
// worker: returning 404 makes browsers unregister stale registrations so the
// SvelteKit /service-worker.js can take over after cutover.
const BLOCKED = new Set(['sw.js']);

export const GET: RequestHandler = async ({ params, url }) => {
  if (!PUBLIC_ROOT) throw error(404, 'Not found');

  const requested = params.legacyPublic ?? '';
  if (!requested || requested.includes('\0') || BLOCKED.has(requested)) {
    throw error(404, 'Not found');
  }

  const resolved = path.resolve(PUBLIC_ROOT, requested);
  if (resolved !== PUBLIC_ROOT && !resolved.startsWith(`${PUBLIC_ROOT}${path.sep}`)) {
    throw error(404, 'Not found');
  }

  let filePath = resolved;
  let stats = existsSync(filePath) ? statSync(filePath) : null;

  // Directory requests fall through to an index.html (e.g. /game/).
  if (stats?.isDirectory()) {
    filePath = path.join(filePath, 'index.html');
    stats = existsSync(filePath) ? statSync(filePath) : null;
  }

  if (!stats?.isFile()) throw error(404, 'Not found');

  const extension = path.extname(filePath).toLowerCase();
  const contentType = CONTENT_TYPES[extension] ?? 'application/octet-stream';
  const cacheControl = IMMUTABLE_PREFIXES.some((prefix) => url.pathname.startsWith(prefix))
    ? 'public, max-age=31536000, immutable'
    : 'public, max-age=300';

  const stream = Readable.toWeb(createReadStream(filePath)) as ReadableStream;

  return new Response(stream, {
    headers: {
      'content-type': contentType,
      'content-length': String(stats.size),
      'cache-control': cacheControl
    }
  });
};
