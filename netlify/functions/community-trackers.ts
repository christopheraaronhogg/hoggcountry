import type { Handler, HandlerEvent } from "@netlify/functions";

type CommunityTracker = {
  id: string;
  name: string;
  color?: string;
};

function jsonHeaders(extra: Record<string, string> = {}): Record<string, string> {
  return { "Content-Type": "application/json; charset=utf-8", ...extra };
}

function sanitizeId(value: unknown): string | null {
  const id = String(value ?? "").trim();
  return /^[a-zA-Z0-9_-]{2,64}$/.test(id) ? id : null;
}

function sanitizeName(value: unknown, fallback: string): string {
  const raw = String(value ?? "").trim();
  if (!raw) return fallback;
  return raw.slice(0, 40);
}

function sanitizeColor(value: unknown): string | undefined {
  const color = String(value ?? "").trim();
  if (!color) return undefined;
  return /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(color) ? color : undefined;
}

function normalizeTracker(raw: any): CommunityTracker | null {
  const id = sanitizeId(raw?.id);
  if (!id) return null;
  return {
    id,
    name: sanitizeName(raw?.name, id),
    color: sanitizeColor(raw?.color),
  };
}

function parseCsvStyle(raw: string): CommunityTracker[] {
  const out: CommunityTracker[] = [];
  const seen = new Set<string>();
  const tokens = raw
    .split(/[\n,;]+/)
    .map((s) => s.trim())
    .filter(Boolean);

  for (const token of tokens) {
    const parts = token.includes("|")
      ? token.split("|")
      : token.includes(":")
        ? token.split(":")
        : [token];

    const id = sanitizeId(parts[0]);
    if (!id || seen.has(id)) continue;

    const name = sanitizeName(parts[1], id);
    const color = sanitizeColor(parts[2]);

    out.push({ id, name, color });
    seen.add(id);
  }

  return out;
}

function parseTrackers(raw: string): CommunityTracker[] {
  const text = raw.trim();
  if (!text) return [];

  const seen = new Set<string>();
  const pushUnique = (items: CommunityTracker[]): CommunityTracker[] => {
    const out: CommunityTracker[] = [];
    for (const item of items) {
      if (!item?.id || seen.has(item.id)) continue;
      seen.add(item.id);
      out.push(item);
    }
    return out;
  };

  try {
    const parsed = JSON.parse(text);
    if (Array.isArray(parsed)) {
      const normalized = parsed
        .map((item) => normalizeTracker(item))
        .filter(Boolean) as CommunityTracker[];
      return pushUnique(normalized);
    }
  } catch {
    // Fall through to CSV-style parsing.
  }

  return pushUnique(parseCsvStyle(text));
}

const handler: Handler = async (event: HandlerEvent) => {
  if (event.httpMethod !== "GET") {
    return {
      statusCode: 405,
      headers: jsonHeaders(),
      body: JSON.stringify({ error: "Method not allowed" }),
    };
  }

  const raw =
    process.env.COMMUNITY_TRACKERS_JSON ||
    process.env.COMMUNITY_TRACKERS ||
    "";

  const trackers = parseTrackers(raw);

  return {
    statusCode: 200,
    headers: jsonHeaders({
      "Cache-Control": "no-store",
      "Netlify-CDN-Cache-Control": "no-store",
    }),
    body: JSON.stringify({
      trackers,
      count: trackers.length,
      note:
        'Set COMMUNITY_TRACKERS_JSON (JSON array) or COMMUNITY_TRACKERS ("id|Name|#RRGGBB,id2|Name2").',
    }),
  };
};

export { handler };
