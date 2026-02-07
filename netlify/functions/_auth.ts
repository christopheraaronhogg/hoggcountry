import { createHmac, randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';
import type { HandlerEvent } from '@netlify/functions';

export type AuthUser = {
  id: string;
  email: string;
  name: string;
};

export type AuthUserRecord = AuthUser & {
  salt: string;
  passwordHash: string;
};

type SessionPayload = {
  sub: string;
  email: string;
  name: string;
  iat: number;
  exp: number;
  v: 1;
};

const SESSION_COOKIE = 'hc_session';
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 14; // 14 days
const HASH_BYTES = 64;

function normalizeEmail(input: string): string {
  return input.trim().toLowerCase();
}

function isHex(input: string): boolean {
  return /^[0-9a-f]+$/i.test(input);
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object') return null;
  return value as Record<string, unknown>;
}

function pickString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function getSecret(): string | null {
  const secret = pickString(process.env.AUTH_SESSION_SECRET);
  return secret.length >= 32 ? secret : null;
}

function loadUserRecords(): AuthUserRecord[] {
  const raw = pickString(process.env.AUTH_USERS_JSON);
  if (!raw) return [];

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return [];
  }

  if (!Array.isArray(parsed)) return [];

  const users: AuthUserRecord[] = [];
  for (const item of parsed) {
    const record = asRecord(item);
    if (!record) continue;

    const email = normalizeEmail(pickString(record.email));
    const salt = pickString(record.salt);
    const passwordHash = pickString(record.passwordHash).toLowerCase();
    if (!email || !salt || !passwordHash || !isHex(passwordHash)) continue;

    const fallbackId = email.replace(/[^a-z0-9]+/gi, '-').replace(/^-+|-+$/g, '') || email;
    const id = pickString(record.id) || fallbackId;
    const name = pickString(record.name) || email.split('@')[0] || 'Hiker';

    users.push({ id, email, name, salt, passwordHash });
  }

  return users;
}

function hashPassword(password: string, salt: string): string {
  return scryptSync(password, salt, HASH_BYTES).toString('hex');
}

function safeEqualsHex(expectedHex: string, actualHex: string): boolean {
  if (!isHex(expectedHex) || !isHex(actualHex)) return false;
  const expected = Buffer.from(expectedHex, 'hex');
  const actual = Buffer.from(actualHex, 'hex');
  if (expected.length !== actual.length) return false;
  return timingSafeEqual(expected, actual);
}

function safeEqualsText(expectedText: string, actualText: string): boolean {
  const expected = Buffer.from(expectedText, 'utf8');
  const actual = Buffer.from(actualText, 'utf8');
  if (expected.length !== actual.length) return false;
  return timingSafeEqual(expected, actual);
}

function sign(unsignedToken: string, secret: string): string {
  return createHmac('sha256', secret).update(unsignedToken).digest('base64url');
}

function buildSessionPayload(user: AuthUser): SessionPayload {
  const now = Math.floor(Date.now() / 1000);
  return {
    sub: user.id,
    email: user.email,
    name: user.name,
    iat: now,
    exp: now + SESSION_TTL_SECONDS,
    v: 1,
  };
}

function parseCookies(event: HandlerEvent): Record<string, string> {
  const raw = event.headers.cookie ?? event.headers.Cookie ?? '';
  const pairs = raw.split(';').map((part) => part.trim()).filter(Boolean);
  const cookies: Record<string, string> = {};
  for (const pair of pairs) {
    const eqIndex = pair.indexOf('=');
    if (eqIndex < 1) continue;
    const key = pair.slice(0, eqIndex).trim();
    const value = pair.slice(eqIndex + 1).trim();
    cookies[key] = value;
  }
  return cookies;
}

function secureRequest(event: HandlerEvent): boolean {
  const proto = (event.headers['x-forwarded-proto'] ?? event.headers['X-Forwarded-Proto'] ?? '').toLowerCase();
  return proto === 'https' || process.env.NODE_ENV === 'production';
}

export function getAuthSetupIssues(): string[] {
  const issues: string[] = [];
  if (!getSecret()) issues.push('Missing or weak AUTH_SESSION_SECRET (min 32 chars).');
  if (loadUserRecords().length === 0) issues.push('Missing AUTH_USERS_JSON user records.');
  return issues;
}

export function authenticate(emailInput: string, passwordInput: string): AuthUser | null {
  const email = normalizeEmail(emailInput);
  const password = passwordInput.trim();
  if (!email || !password) return null;

  const user = loadUserRecords().find((entry) => entry.email === email);
  if (!user) return null;

  const candidateHash = hashPassword(password, user.salt);
  if (!safeEqualsHex(user.passwordHash, candidateHash)) return null;

  return { id: user.id, email: user.email, name: user.name };
}

export function createSessionToken(user: AuthUser): string | null {
  const secret = getSecret();
  if (!secret) return null;

  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' }), 'utf8').toString('base64url');
  const payload = Buffer.from(JSON.stringify(buildSessionPayload(user)), 'utf8').toString('base64url');
  const unsigned = `${header}.${payload}`;
  return `${unsigned}.${sign(unsigned, secret)}`;
}

export function readSessionUser(event: HandlerEvent): AuthUser | null {
  const secret = getSecret();
  if (!secret) return null;

  const cookies = parseCookies(event);
  const token = cookies[SESSION_COOKIE];
  if (!token) return null;

  const [header, payload, signature] = token.split('.');
  if (!header || !payload || !signature) return null;

  const unsigned = `${header}.${payload}`;
  const expectedSig = sign(unsigned, secret);
  const sigMatches = safeEqualsText(expectedSig, signature);
  if (!sigMatches) return null;

  let parsedPayload: unknown;
  try {
    parsedPayload = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
  } catch {
    return null;
  }

  const record = asRecord(parsedPayload);
  if (!record) return null;

  const sub = pickString(record.sub);
  const email = normalizeEmail(pickString(record.email));
  const name = pickString(record.name) || 'Hiker';
  const exp = Number(record.exp);
  if (!sub || !email || !Number.isFinite(exp)) return null;
  if (Math.floor(Date.now() / 1000) >= exp) return null;

  return { id: sub, email, name };
}

export function makeSessionCookie(event: HandlerEvent, token: string): string {
  const parts = [
    `${SESSION_COOKIE}=${token}`,
    `Max-Age=${SESSION_TTL_SECONDS}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
  ];
  if (secureRequest(event)) parts.push('Secure');
  return parts.join('; ');
}

export function clearSessionCookie(event: HandlerEvent): string {
  const parts = [
    `${SESSION_COOKIE}=`,
    'Max-Age=0',
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
  ];
  if (secureRequest(event)) parts.push('Secure');
  return parts.join('; ');
}

export function createAuthUserRecord(emailInput: string, password: string, nameInput = ''): AuthUserRecord {
  const email = normalizeEmail(emailInput);
  const name = nameInput.trim() || email.split('@')[0] || 'Hiker';
  const id = email.replace(/[^a-z0-9]+/gi, '-').replace(/^-+|-+$/g, '') || email;
  const salt = randomBytes(16).toString('hex');
  const passwordHash = hashPassword(password, salt);
  return { id, email, name, salt, passwordHash };
}
