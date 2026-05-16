import { XMLParser } from 'fast-xml-parser';

export interface YtVideo {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly published: string;
  readonly link: string;
  readonly thumbnail: string;
  readonly kind: 'video' | 'short';
}

const cacheByFeedUrl = new Map<string, { items: YtVideo[]; ts: number }>();
const TTL_MS = 5 * 60 * 1000;

function youtubeKind(link: string): YtVideo['kind'] {
  try {
    return new URL(link).pathname.startsWith('/shorts/') ? 'short' : 'video';
  } catch {
    return link.includes('/shorts/') ? 'short' : 'video';
  }
}

function youtubeVideoId(link: string, kind: YtVideo['kind']): string {
  try {
    const url = new URL(link);
    return kind === 'short'
      ? url.pathname.split('/').filter(Boolean).at(1) ?? ''
      : url.searchParams.get('v') ?? '';
  } catch {
    const shortMatch = link.match(/\/shorts\/([^/?#]+)/);
    if (shortMatch?.[1]) return shortMatch[1];

    const watchMatch = link.match(/[?&]v=([^&#]+)/);
    return watchMatch?.[1] ?? '';
  }
}

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
        'User-Agent': 'Mozilla/5.0 (compatible; HoggCountryScout/1.0)'
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
        const kind = youtubeKind(link);
        const videoId = record['yt:videoId'] || youtubeVideoId(link, kind);
        if (!videoId) return null;

        const mediaGroup = record['media:group'];
        const description =
          pickText(mediaGroup?.['media:description']) ||
          pickText(record['media:description']) ||
          pickText(record.content) ||
          '';

        const thumbnail = kind === 'short'
          ? `https://i.ytimg.com/vi/${videoId}/oardefault.jpg`
          : mediaGroup?.['media:thumbnail']?.url ||
            record['media:thumbnail']?.url ||
            `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;

        return {
          id: videoId,
          title,
          description,
          published,
          link,
          thumbnail,
          kind
        } satisfies YtVideo;
      })
      .filter((entry): entry is YtVideo => entry !== null);

    cacheByFeedUrl.set(feedUrl, { items, ts: Date.now() });
    return items;
  } catch {
    return cached?.items ?? [];
  }
}
