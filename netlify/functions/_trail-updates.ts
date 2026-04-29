import { createHmac, timingSafeEqual } from 'node:crypto';
import type { HandlerEvent } from '@netlify/functions';
import { getStore } from '@netlify/blobs';

export type TrailUpdate = {
  id: string;
  title: string;
  body: string;
  location: string;
  trailMile: string;
  status: 'draft' | 'published';
  featured: boolean;
  mediaKey: string | null;
  mediaName: string | null;
  mediaType: string | null;
  mediaUrl: string | null;
  createdAt: string;
  updatedAt: string;
  publishedAt: string | null;
};

export type TrailUpdatesPayload = {
  updates: TrailUpdate[];
};

const UPDATES_KEY = 'updates.json';
const ADMIN_COOKIE = 'hc_trail_updates_admin';
const ADMIN_TTL_SECONDS = 60 * 60 * 24 * 30;

export function jsonHeaders(extra: Record<string, string> = {}): Record<string, string> {
  return {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    ...extra,
  };
}

export function getAdminPasscode(): string {
  return String(process.env.HOGG_ADMIN_PASSCODE || process.env.TRAIL_UPDATES_PASSCODE || '0721').trim();
}

function getCookieSecret(): string {
  return String(
    process.env.TRAIL_UPDATES_SESSION_SECRET ||
    process.env.AUTH_SESSION_SECRET ||
    process.env.HOGG_ADMIN_PASSCODE ||
    process.env.TRAIL_UPDATES_PASSCODE ||
    '0721-local-dev-secret'
  );
}

function sign(value: string): string {
  return createHmac('sha256', getCookieSecret()).update(value).digest('base64url');
}

function safeEqual(a: string, b: string): boolean {
  const aa = Buffer.from(a, 'utf8');
  const bb = Buffer.from(b, 'utf8');
  if (aa.length !== bb.length) return false;
  return timingSafeEqual(aa, bb);
}

function parseCookies(event: HandlerEvent): Record<string, string> {
  const raw = event.headers.cookie ?? event.headers.Cookie ?? '';
  const out: Record<string, string> = {};
  for (const part of raw.split(';')) {
    const [name, ...value] = part.trim().split('=');
    if (!name) continue;
    out[name] = decodeURIComponent(value.join('='));
  }
  return out;
}

export function makeAdminCookie(event: HandlerEvent): string {
  const now = Math.floor(Date.now() / 1000);
  const payload = `v1.${now}`;
  const token = `${payload}.${sign(payload)}`;
  const secure = (event.headers['x-forwarded-proto'] || '').includes('https') || event.headers.host?.includes('netlify') || event.headers.host?.includes('hoggcountry.com');
  return `${ADMIN_COOKIE}=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${ADMIN_TTL_SECONDS}${secure ? '; Secure' : ''}`;
}

export function clearAdminCookie(): string {
  return `${ADMIN_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`;
}

export function isAdminAuthed(event: HandlerEvent): boolean {
  const token = parseCookies(event)[ADMIN_COOKIE];
  if (!token) return false;
  const parts = token.split('.');
  if (parts.length !== 3 || parts[0] !== 'v1') return false;
  const issuedAt = Number(parts[1]);
  if (!Number.isFinite(issuedAt)) return false;
  const age = Math.floor(Date.now() / 1000) - issuedAt;
  if (age < 0 || age > ADMIN_TTL_SECONDS) return false;
  return safeEqual(parts[2], sign(`v1.${parts[1]}`));
}

export function passcodeMatches(input: string): boolean {
  const expected = getAdminPasscode();
  return expected.length > 0 && safeEqual(expected, String(input || '').trim());
}

export function sanitizeText(input: unknown, max = 2000): string {
  return String(input ?? '').replace(/\u0000/g, '').trim().slice(0, max);
}

export function sanitizeStatus(input: unknown): 'draft' | 'published' {
  return input === 'draft' ? 'draft' : 'published';
}

export function slugId(): string {
  const now = new Date();
  const stamp = now.toISOString().replace(/[-:T.Z]/g, '').slice(0, 14);
  const rand = Math.random().toString(36).slice(2, 8);
  return `${stamp}-${rand}`;
}

export async function readUpdates(): Promise<TrailUpdatesPayload> {
  const store = getStore('trail-updates');
  const raw = await store.get(UPDATES_KEY, { type: 'json' }).catch(() => null) as TrailUpdatesPayload | null;
  if (!raw || !Array.isArray(raw.updates)) return { updates: [] };
  return {
    updates: raw.updates
      .filter((item) => item && typeof item.id === 'string')
      .map((item) => ({ ...item, mediaUrl: item.mediaKey ? `/.netlify/functions/trail-update-media?id=${encodeURIComponent(item.id)}` : null }))
      .sort((a, b) => String(b.publishedAt || b.createdAt).localeCompare(String(a.publishedAt || a.createdAt))),
  };
}

export async function writeUpdates(payload: TrailUpdatesPayload): Promise<void> {
  const store = getStore('trail-updates');
  await store.setJSON(UPDATES_KEY, payload);
}

export function publicUpdate(update: TrailUpdate): TrailUpdate {
  return {
    ...update,
    mediaUrl: update.mediaKey ? `/.netlify/functions/trail-update-media?id=${encodeURIComponent(update.id)}` : null,
  };
}

export function getBodyBuffer(event: HandlerEvent): Buffer {
  if (!event.body) return Buffer.alloc(0);
  return Buffer.from(event.body, event.isBase64Encoded ? 'base64' : 'utf8');
}

export type ParsedMultipart = {
  fields: Record<string, string>;
  file: { fieldName: string; filename: string; contentType: string; data: Buffer } | null;
};

function parseContentDisposition(header: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const part of header.split(';')) {
    const [rawKey, ...rawValue] = part.trim().split('=');
    if (!rawKey || !rawValue.length) continue;
    out[rawKey.toLowerCase()] = rawValue.join('=').replace(/^"|"$/g, '');
  }
  return out;
}

export function parseMultipart(event: HandlerEvent): ParsedMultipart | null {
  const contentType = event.headers['content-type'] || event.headers['Content-Type'] || '';
  const boundaryMatch = contentType.match(/boundary=([^;]+)/i);
  if (!boundaryMatch) return null;

  const boundary = `--${boundaryMatch[1]}`;
  const buffer = getBodyBuffer(event);
  const binary = buffer.toString('binary');
  const fields: Record<string, string> = {};
  let file: ParsedMultipart['file'] = null;

  for (const rawPart of binary.split(boundary)) {
    if (!rawPart || rawPart === '--\r\n' || rawPart === '--') continue;
    const part = rawPart.replace(/^\r\n/, '').replace(/\r\n--$/, '');
    const headerEnd = part.indexOf('\r\n\r\n');
    if (headerEnd === -1) continue;

    const rawHeaders = part.slice(0, headerEnd);
    let body = part.slice(headerEnd + 4);
    if (body.endsWith('\r\n')) body = body.slice(0, -2);

    const headers: Record<string, string> = {};
    for (const line of rawHeaders.split('\r\n')) {
      const [key, ...value] = line.split(':');
      if (!key || !value.length) continue;
      headers[key.toLowerCase()] = value.join(':').trim();
    }

    const disposition = parseContentDisposition(headers['content-disposition'] || '');
    const name = disposition.name;
    if (!name) continue;

    if (disposition.filename) {
      const data = Buffer.from(body, 'binary');
      if (data.length > 0) {
        file = {
          fieldName: name,
          filename: disposition.filename.replace(/[^a-zA-Z0-9._-]+/g, '-').slice(0, 120) || 'upload',
          contentType: headers['content-type'] || 'application/octet-stream',
          data,
        };
      }
    } else {
      fields[name] = Buffer.from(body, 'binary').toString('utf8').trim();
    }
  }

  return { fields, file };
}
