import type { RequestHandler } from './$types';

type CommunityTracker = {
  readonly id: string;
  readonly name: string;
  readonly color?: string;
};

function sanitizeId(value: unknown): string | null {
  const id = String(value ?? '').trim();
  return /^[a-zA-Z0-9_-]{2,64}$/u.test(id) ? id : null;
}

function sanitizeName(value: unknown, fallback: string): string {
  const raw = String(value ?? '').trim();
  return raw ? raw.slice(0, 40) : fallback;
}

function sanitizeColor(value: unknown): string | undefined {
  const color = String(value ?? '').trim();
  if (!color) return undefined;
  return /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/u.test(color) ? color : undefined;
}

function normalizeTracker(raw: unknown): CommunityTracker | null {
  const value = raw as Record<string, unknown> | null;
  const id = sanitizeId(value?.id);
  if (!id) return null;

  return {
    id,
    name: sanitizeName(value?.name, id),
    color: sanitizeColor(value?.color)
  };
}

function parseCsvStyle(raw: string): CommunityTracker[] {
  const trackers: CommunityTracker[] = [];
  const seen = new Set<string>();
  const tokens = raw
    .split(/[\n,;]+/u)
    .map((token) => token.trim())
    .filter(Boolean);

  for (const token of tokens) {
    const parts = token.includes('|') ? token.split('|') : token.includes(':') ? token.split(':') : [token];
    const id = sanitizeId(parts[0]);
    if (!id || seen.has(id)) continue;

    trackers.push({
      id,
      name: sanitizeName(parts[1], id),
      color: sanitizeColor(parts[2])
    });
    seen.add(id);
  }

  return trackers;
}

function parseTrackers(raw: string): CommunityTracker[] {
  const text = raw.trim();
  if (!text) return [];

  const seen = new Set<string>();
  const unique = (items: CommunityTracker[]) =>
    items.filter((item) => {
      if (seen.has(item.id)) return false;
      seen.add(item.id);
      return true;
    });

  try {
    const parsed = JSON.parse(text);
    if (Array.isArray(parsed)) {
      return unique(parsed.map(normalizeTracker).filter((item): item is CommunityTracker => item !== null));
    }
  } catch {
    // Fall through to CSV-style parsing.
  }

  return unique(parseCsvStyle(text));
}

export const GET: RequestHandler = async () => {
  const trackers = parseTrackers(process.env.COMMUNITY_TRACKERS_JSON || process.env.COMMUNITY_TRACKERS || '');

  return Response.json(
    {
      trackers,
      count: trackers.length,
      note: 'Set COMMUNITY_TRACKERS_JSON or COMMUNITY_TRACKERS to add public MapShare trackers.'
    },
    {
      headers: {
        'Cache-Control': 'no-store'
      }
    }
  );
};
