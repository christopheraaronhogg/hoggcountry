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

  const res = await fetch(feedUrl);
  if (!res.ok) throw new Error(`YouTube RSS fetch failed: ${res.status}`);
  const xml = await res.text();

  const items = parseYouTubeXML(xml);
  cache = { items, ts: Date.now() };
  return items;
}

function text(el: Element | null): string {
  return el?.textContent || '';
}

function parseYouTubeXML(xml: string): YtVideo[] {
  // Simple XML parse using DOMParser available in Astro env
  const { DOMParser } = globalThis as any;
  const parser = new DOMParser();
  const doc = parser.parseFromString(xml, 'text/xml');

  const entries = Array.from(doc.getElementsByTagName('entry'));
  const mediaNs = 'http://search.yahoo.com/mrss/';
  const ytNs = 'http://www.youtube.com/xml/schemas/2015';

  const items: YtVideo[] = entries.map((e) => {
    const title = text(e.getElementsByTagName('title')[0]);
    const link = e.getElementsByTagName('link')[0]?.getAttribute('href') || '';
    const published = text(e.getElementsByTagName('published')[0]);
    const vid = e.getElementsByTagNameNS(ytNs, 'videoId')[0]?.textContent
      || (link ? new URL(link).searchParams.get('v') : '')
      || '';
    const thumbEl = e.getElementsByTagNameNS(mediaNs, 'thumbnail')[0];
    const thumbnail = thumbEl?.getAttribute('url') || (vid ? `https://i.ytimg.com/vi/${vid}/hqdefault.jpg` : '');
    return { id: vid, title, published, link, thumbnail } as YtVideo;
  }).filter(v => v.id);

  return items;
}
