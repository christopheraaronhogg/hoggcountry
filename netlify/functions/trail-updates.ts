import type { Handler } from '@netlify/functions';
import { getStore } from '@netlify/blobs';
import {
  isAdminAuthed,
  jsonHeaders,
  parseMultipart,
  publicUpdate,
  readUpdates,
  sanitizeStatus,
  sanitizeText,
  slugId,
  writeUpdates,
  type TrailUpdate,
} from './_trail-updates';

const MAX_MEDIA_BYTES = 20 * 1024 * 1024;
const ALLOWED_MEDIA = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'video/mp4',
  'video/quicktime',
  'video/webm',
]);

function filterForPublic(updates: TrailUpdate[], includeDrafts: boolean): TrailUpdate[] {
  return updates
    .filter((update) => includeDrafts || update.status === 'published')
    .map(publicUpdate);
}

function parseJsonBody(body: string | null): Record<string, unknown> | null {
  if (!body) return null;
  try {
    const parsed = JSON.parse(body);
    return parsed && typeof parsed === 'object' ? parsed as Record<string, unknown> : null;
  } catch {
    return null;
  }
}

const handler: Handler = async (event) => {
  if (event.httpMethod === 'GET') {
    const includeDrafts = event.queryStringParameters?.admin === '1' && isAdminAuthed(event);
    const limit = Math.max(1, Math.min(50, Number(event.queryStringParameters?.limit || 50)));
    const payload = await readUpdates();
    const updates = filterForPublic(payload.updates, includeDrafts).slice(0, limit);
    return {
      statusCode: 200,
      headers: jsonHeaders({
        'Cache-Control': includeDrafts ? 'no-store' : 'public, max-age=0, s-maxage=60, stale-while-revalidate=300',
        'Netlify-CDN-Cache-Control': includeDrafts ? 'no-store' : 'public, max-age=0, s-maxage=60, stale-while-revalidate=300',
      }),
      body: JSON.stringify({ updates }),
    };
  }

  if (!isAdminAuthed(event)) {
    return {
      statusCode: 401,
      headers: jsonHeaders(),
      body: JSON.stringify({ error: 'Admin passcode required' }),
    };
  }

  if (event.httpMethod === 'DELETE') {
    const id = sanitizeText(event.queryStringParameters?.id, 80);
    if (!id) {
      return { statusCode: 400, headers: jsonHeaders(), body: JSON.stringify({ error: 'Missing update id' }) };
    }
    const payload = await readUpdates();
    const target = payload.updates.find((item) => item.id === id);
    const updates = payload.updates.filter((item) => item.id !== id);
    await writeUpdates({ updates });
    if (target?.mediaKey) {
      await getStore('trail-update-media').delete(target.mediaKey).catch(() => undefined);
    }
    return { statusCode: 200, headers: jsonHeaders(), body: JSON.stringify({ ok: true }) };
  }

  if (event.httpMethod === 'PATCH') {
    const body = parseJsonBody(event.body);
    const id = sanitizeText(body?.id, 80);
    if (!id) return { statusCode: 400, headers: jsonHeaders(), body: JSON.stringify({ error: 'Missing update id' }) };

    const payload = await readUpdates();
    const updates = payload.updates.map((item) => {
      if (item.id !== id) return item;
      const status = sanitizeStatus(body?.status ?? item.status);
      return {
        ...item,
        title: sanitizeText(body?.title ?? item.title, 120),
        body: sanitizeText(body?.body ?? item.body, 4000),
        location: sanitizeText(body?.location ?? item.location, 120),
        trailMile: sanitizeText(body?.trailMile ?? item.trailMile, 40),
        status,
        featured: Boolean(body?.featured ?? item.featured),
        updatedAt: new Date().toISOString(),
        publishedAt: status === 'published' ? (item.publishedAt || new Date().toISOString()) : null,
      };
    });
    await writeUpdates({ updates });
    const update = updates.find((item) => item.id === id);
    return { statusCode: 200, headers: jsonHeaders(), body: JSON.stringify({ update: update ? publicUpdate(update) : null }) };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: jsonHeaders(), body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  const multipart = parseMultipart(event);
  if (!multipart) {
    return { statusCode: 400, headers: jsonHeaders(), body: JSON.stringify({ error: 'Expected multipart form data' }) };
  }

  const now = new Date().toISOString();
  const id = slugId();
  const status = sanitizeStatus(multipart.fields.status);
  let mediaKey: string | null = null;
  let mediaName: string | null = null;
  let mediaType: string | null = null;

  if (multipart.file) {
    if (multipart.file.data.length > MAX_MEDIA_BYTES) {
      return { statusCode: 413, headers: jsonHeaders(), body: JSON.stringify({ error: 'Media must be 20MB or smaller for v1.' }) };
    }
    if (!ALLOWED_MEDIA.has(multipart.file.contentType)) {
      return { statusCode: 415, headers: jsonHeaders(), body: JSON.stringify({ error: 'Use a JPG, PNG, WebP, GIF, MP4, MOV, or WebM file.' }) };
    }

    const ext = multipart.file.filename.includes('.') ? multipart.file.filename.split('.').pop() : 'bin';
    mediaKey = `${id}.${ext}`;
    mediaName = multipart.file.filename;
    mediaType = multipart.file.contentType;
    await getStore('trail-update-media').set(mediaKey, multipart.file.data, {
      metadata: { contentType: mediaType, originalName: mediaName },
    });
  }

  const update: TrailUpdate = {
    id,
    title: sanitizeText(multipart.fields.title, 120),
    body: sanitizeText(multipart.fields.body, 4000),
    location: sanitizeText(multipart.fields.location, 120),
    trailMile: sanitizeText(multipart.fields.trailMile, 40),
    status,
    featured: multipart.fields.featured === 'true' || multipart.fields.featured === 'on',
    mediaKey,
    mediaName,
    mediaType,
    mediaUrl: mediaKey ? `/.netlify/functions/trail-update-media?id=${encodeURIComponent(id)}` : null,
    createdAt: now,
    updatedAt: now,
    publishedAt: status === 'published' ? now : null,
  };

  if (!update.body && !update.mediaKey) {
    return { statusCode: 400, headers: jsonHeaders(), body: JSON.stringify({ error: 'Add a photo/video or a text update.' }) };
  }

  const payload = await readUpdates();
  await writeUpdates({ updates: [update, ...payload.updates] });

  return {
    statusCode: 201,
    headers: jsonHeaders(),
    body: JSON.stringify({ update: publicUpdate(update) }),
  };
};

export { handler };
