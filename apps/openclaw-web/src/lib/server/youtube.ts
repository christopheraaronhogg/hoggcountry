import { XMLParser } from 'fast-xml-parser';

export interface YtVideo {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly published: string;
  readonly link: string;
  readonly thumbnail: string;
}

const cacheByFeedUrl = new Map<string, { items: YtVideo[]; ts: number }>();
const TTL_MS = 5 * 60 * 1000;

function pickText(value: unknown): string {
  if (typeof value === 'string') return value.trim();
  if (value && typeof value === 'object') {
    const record = value as Record<string, unknown>;
    if (typeof record['#text'] === 'string') return record['#text'].trim();
    if (typeof record['__cdata'] === 'string') return record['__cdata'].trim();
  }
  return '';
}

export async function fetchYouTubeRSS(feedUrl: string): Promise<YtVideo[]> {
  const cached = cacheByFeedUrl.get(feedUrl);
  if (cached && Date.now() - cached.ts < TTL_MS) return cached.items;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    const response = await fetch(feedUrl, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; HoggCountryOpenClaw/1.0)'
      }
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      return cached?.items ?? [];
    }

    const xml = await response.text();
    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: '',
      removeNSPrefix: false
    });
    const data = parser.parse(xml) as Record<string, unknown>;
    const feed = data.feed as Record<string, unknown> | undefined;
    const entries = Array.isArray(feed?.entry) ? feed.entry : feed?.entry ? [feed.entry] : [];

    const items = entries
      .map((entry) => {
        const record = entry as Record<string, any>;
        const title = record.title || 'Untitled';
        const published = record.published || '';
        const link = Array.isArray(record.link)
          ? record.link.find((candidate: { href?: string }) => candidate.href)?.href ?? record.link[0]?.href ?? ''
          : record.link?.href ?? '';
        const videoId = record['yt:videoId'] || (link ? new URL(link).searchParams.get('v') : '') || '';
        if (!videoId) return null;

        const mediaGroup = record['media:group'];
        const description =
          pickText(mediaGroup?.['media:description']) ||
          pickText(record['media:description']) ||
          pickText(record.content) ||
          '';

        const thumbnail =
          mediaGroup?.['media:thumbnail']?.url ||
          record['media:thumbnail']?.url ||
          `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;

        return {
          id: videoId,
          title,
          description,
          published,
          link,
          thumbnail
        } satisfies YtVideo;
      })
      .filter((entry): entry is YtVideo => entry !== null);

    cacheByFeedUrl.set(feedUrl, { items, ts: Date.now() });
    return items;
  } catch {
    return cached?.items ?? [];
  }
}
