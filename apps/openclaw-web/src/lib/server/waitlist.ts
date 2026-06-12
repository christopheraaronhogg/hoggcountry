import { existsSync } from 'node:fs';
import { appendFile, mkdir, readFile } from 'node:fs/promises';
import path from 'node:path';

/**
 * App-launch waitlist: a flat JSONL file alongside the workspace storage so it
 * survives Forge release swaps without touching the Laravel layer. One line
 * per signup: { email, source, createdAt }.
 */

export interface WaitlistSignup {
  readonly email: string;
  readonly source: string;
  readonly createdAt: string;
}

const MAX_EMAIL_CHARS = 254;
const MAX_SOURCE_CHARS = 60;
const MAX_SIGNUPS = 50000;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/u;

function waitlistDir(): string {
  const configured =
    process.env.SCOUT_WAITLIST_DATA_DIR?.trim() ||
    process.env.HOGGCOUNTRY_WAITLIST_DATA_DIR?.trim();
  if (configured) return configured;

  // Same monorepo-root walk the workspace store uses: land in Laravel's
  // shared storage so the file persists across releases on Forge.
  let current = process.cwd();
  for (let depth = 0; depth < 12; depth += 1) {
    if (
      existsSync(path.join(current, 'apps/openclaw-web/package.json')) &&
      existsSync(path.join(current, 'backend/composer.json'))
    ) {
      return path.join(current, 'backend/storage/app/scout-waitlist');
    }
    const parent = path.dirname(current);
    if (parent === current) break;
    current = parent;
  }

  return path.join(process.cwd(), 'scout-waitlist');
}

function waitlistFile(): string {
  return path.join(waitlistDir(), 'signups.jsonl');
}

export function normalizeWaitlistEmail(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const email = value.trim().toLowerCase().slice(0, MAX_EMAIL_CHARS);
  return EMAIL_PATTERN.test(email) ? email : null;
}

export async function listWaitlistSignups(): Promise<WaitlistSignup[]> {
  let raw: string;
  try {
    raw = await readFile(waitlistFile(), 'utf-8');
  } catch {
    return [];
  }

  const seen = new Set<string>();
  const signups: WaitlistSignup[] = [];

  for (const line of raw.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    try {
      const parsed = JSON.parse(trimmed) as Partial<WaitlistSignup>;
      const email = normalizeWaitlistEmail(parsed.email);
      if (!email || seen.has(email)) continue;
      seen.add(email);
      signups.push({
        email,
        source: typeof parsed.source === 'string' ? parsed.source.slice(0, MAX_SOURCE_CHARS) : 'unknown',
        createdAt: typeof parsed.createdAt === 'string' ? parsed.createdAt : ''
      });
    } catch {
      // skip malformed lines
    }
  }

  return signups;
}

/** Returns 'added' | 'already-listed'. Throws on invalid email or a full list. */
export async function addWaitlistSignup(emailInput: unknown, sourceInput: unknown): Promise<'added' | 'already-listed'> {
  const email = normalizeWaitlistEmail(emailInput);
  if (!email) throw new Error('Enter a valid email address.');

  const existing = await listWaitlistSignups();
  if (existing.some((signup) => signup.email === email)) return 'already-listed';
  if (existing.length >= MAX_SIGNUPS) throw new Error('The waitlist is full.');

  const source = typeof sourceInput === 'string' && sourceInput.trim()
    ? sourceInput.trim().slice(0, MAX_SOURCE_CHARS)
    : 'site';

  await mkdir(waitlistDir(), { recursive: true });
  const entry: WaitlistSignup = { email, source, createdAt: new Date().toISOString() };
  await appendFile(waitlistFile(), `${JSON.stringify(entry)}\n`, 'utf-8');
  return 'added';
}
