import type { RequestHandler } from './$types';
import { loadPublicTrailUpdates } from '$lib/server/trail-updates';

function escapeXml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');
}

export const GET: RequestHandler = async ({ url }) => {
  const { updates } = await loadPublicTrailUpdates(url.origin, 30);
  const items = updates
    .map((update) => ({
      title: update.title,
      description: update.body || update.sourceLabel || 'Hogg Country trail update',
      link: update.externalUrl || new URL('/updates', url.origin).toString(),
      date: update.publishedAt || update.createdAt
    }))
    .filter((item) => item.date)
    .sort((left, right) => right.date.localeCompare(left.date))
    .slice(0, 30);

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
