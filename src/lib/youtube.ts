import { XMLParser } from 'fast-xml-parser';
import { YT_FEED_URL, MANUAL_VIDEOS, type ManualVideo } from './config';

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

/**
 * Convert a manual video entry to a full YtVideo object
 */
function manualToYtVideo(manual: ManualVideo): YtVideo {
  return {
    id: manual.id,
    title: manual.title || 'Untitled',
    published: manual.published || new Date().toISOString(),
    link: `https://www.youtube.com/watch?v=${manual.id}`,
    thumbnail: `https://i.ytimg.com/vi/${manual.id}/hqdefault.jpg`,
  };
}

/**
 * Get all videos - merges RSS feed with manual overrides
 *
 * - Manual videos take precedence (appear even if not in RSS yet)
 * - Deduplicates by video ID
 * - Sorts by published date (newest first)
 */
export async function getVideos(): Promise<YtVideo[]> {
  // Fetch from RSS feed
  const rssVideos = await fetchYouTubeRSS(YT_FEED_URL);

  // Convert manual videos to full YtVideo objects
  const manualVideos = MANUAL_VIDEOS.map(manualToYtVideo);

  // Create a map for deduplication (manual videos take precedence)
  const videoMap = new Map<string, YtVideo>();

  // Add RSS videos first
  for (const video of rssVideos) {
    videoMap.set(video.id, video);
  }

  // Add manual videos (overwrites RSS if duplicate)
  for (const video of manualVideos) {
    videoMap.set(video.id, video);
  }

  // Convert back to array and sort by published date (newest first)
  const allVideos = Array.from(videoMap.values());
  allVideos.sort((a, b) => {
    const dateA = new Date(a.published).getTime();
    const dateB = new Date(b.published).getTime();
    return dateB - dateA;
  });

  return allVideos;
}
