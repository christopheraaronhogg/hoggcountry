import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { error } from '@sveltejs/kit';

const PUBLIC_ROOT_CANDIDATES = [
  join(process.cwd(), 'public'),
  join(process.cwd(), '..', '..', 'public'),
  join(process.cwd(), '..', '..', '..', 'public')
];

export async function readRootPublicAsset(relativePath: string): Promise<Uint8Array> {
  const normalized = relativePath.replace(/^\/+/u, '');

  for (const root of PUBLIC_ROOT_CANDIDATES) {
    const candidate = join(root, normalized);
    if (existsSync(candidate)) {
      return readFile(candidate);
    }
  }

  throw error(404, `Missing public asset: ${normalized}`);
}

export async function rootPublicAssetResponse(relativePath: string, contentType: string): Promise<Response> {
  const body = await readRootPublicAsset(relativePath);

  return new Response(body, {
    headers: {
      'Content-Type': contentType,
      'Cache-Control': 'public, max-age=3600'
    }
  });
}
