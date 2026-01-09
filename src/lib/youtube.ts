import { XMLParser } from 'fast-xml-parser';

export type YtVideo = {
  id: string;
  title: string;
  published: string; // ISO
  link: string;
  thumbnail: string;
};

let cache: { items: YtVideo[]; ts: number } | null = null;
const TTL_MS = 10 * 60 * 1000; // 10 minutes

export async function fetchYouTubeRSS(feedUrl: string): Promise<YtVideo[]> {
  if (cache && Date.now() - cache.ts < TTL_MS) return cache.items;

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
      return cache?.items || []; // Return cached data or empty array
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
        let thumbnail = '';
        const mg = e['media:group'];
        if (mg && mg['media:thumbnail'] && mg['media:thumbnail'].url) {
          thumbnail = mg['media:thumbnail'].url;
        } else if (e['media:thumbnail'] && e['media:thumbnail'].url) {
          thumbnail = e['media:thumbnail'].url;
        } else if (videoId) {
          thumbnail = `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
        }
        return { id: videoId, title, published, link, thumbnail } as YtVideo;
      })
      .filter((v: YtVideo) => v.id);

    cache = { items, ts: Date.now() };
    return items;
    
  } catch (error) {
    console.warn('YouTube RSS fetch error:', error);
    return cache?.items || []; // Return cached data or empty array on error
  }
}
