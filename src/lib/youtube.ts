import { XMLParser } from 'fast-xml-parser';

export type YtVideo = {
  id: string;
  title: string;
  description: string;
  published: string; // ISO
  link: string;
  thumbnail: string;
};

const cacheByFeedUrl = new Map<string, { items: YtVideo[]; ts: number }>();
const TTL_MS = 5 * 60 * 1000; // 5 minutes

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
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
    
    const res = await fetch(feedUrl, { 
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; HoggCountry/1.0)'
      }
    });
    
    clearTimeout(timeoutId);
    
    if (!res.ok) {
      console.warn(`YouTube RSS fetch failed: ${res.status}`);
      return cached?.items || []; // Return cached data or empty array
    }
    
    const xml = await res.text();

    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: '',
      removeNSPrefix: false,
    });

    const data = parser.parse(xml) as any;
    const entries = Array.isArray(data.feed?.entry)
      ? data.feed.entry
      : data.feed?.entry
      ? [data.feed.entry]
      : [];

    const items: YtVideo[] = entries
      .map((e: any) => {
        const title = e.title || 'Untitled';
        let link = '';
        if (Array.isArray(e.link)) {
          link = e.link.find((l: any) => l.href)?.href || e.link[0]?.href || '';
        } else if (e.link && typeof e.link === 'object') {
          link = e.link.href || '';
        }
        const published = e.published || '';
        const videoId = e['yt:videoId'] || (link ? new URL(link).searchParams.get('v') : '') || '';
        const mg = e['media:group'];
        const description =
          pickText(mg?.['media:description']) ||
          pickText(e['media:description']) ||
          pickText(e.content) ||
          '';
        let thumbnail = '';
        if (mg && mg['media:thumbnail'] && mg['media:thumbnail'].url) {
          thumbnail = mg['media:thumbnail'].url;
        } else if (e['media:thumbnail'] && e['media:thumbnail'].url) {
          thumbnail = e['media:thumbnail'].url;
        } else if (videoId) {
          thumbnail = `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
        }
        return { id: videoId, title, description, published, link, thumbnail } as YtVideo;
      })
      .filter((v: YtVideo) => v.id);

    cacheByFeedUrl.set(feedUrl, { items, ts: Date.now() });
    return items;
    
  } catch (error) {
    console.warn('YouTube RSS fetch error:', error);
    return cached?.items || []; // Return cached data or empty array on error
  }
}
