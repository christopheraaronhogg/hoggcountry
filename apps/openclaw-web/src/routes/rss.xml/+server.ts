import type { RequestHandler } from './$types';
import { loadBlogEntries, loadTrips } from '$lib/server/public-content';

function escapeXml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');
}

export const GET: RequestHandler = async ({ url }) => {
  const [posts, trips] = await Promise.all([loadBlogEntries(), loadTrips()]);
  const items = [
    ...posts.map((post) => ({
      title: post.title,
      description: post.description,
      link: new URL(`/blog/${post.slug}`, url.origin).toString(),
      date: post.date
    })),
    ...trips.map((trip) => ({
      title: trip.title,
      description: trip.description,
      link: new URL(`/trips/${trip.slug}`, url.origin).toString(),
      date: trip.date
    }))
  ].sort((left, right) => right.date.localeCompare(left.date)).slice(0, 30);

  const body = `<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0">
  <channel>
    <title>Hogg Country</title>
    <description>Dad's Appalachian Trail field guide, trail video dispatches, and a personal field manual workspace for hikers.</description>
    <link>${escapeXml(url.origin)}</link>
    ${items.map((item) => `
    <item>
      <title>${escapeXml(item.title)}</title>
      <description>${escapeXml(item.description)}</description>
      <link>${escapeXml(item.link)}</link>
      <guid>${escapeXml(item.link)}</guid>
      <pubDate>${new Date(item.date).toUTCString()}</pubDate>
    </item>`).join('')}
  </channel>
</rss>`;

  return new Response(body, {
    headers: {
      'content-type': 'application/rss+xml; charset=utf-8',
      'cache-control': 'public, max-age=0, s-maxage=600'
    }
  });
};
