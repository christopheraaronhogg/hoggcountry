import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url }) => {
  const body = `<?xml version="1.0" encoding="UTF-8" ?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap><loc>${new URL('/sitemap.xml', url.origin).toString()}</loc></sitemap>
</sitemapindex>`;

  return new Response(body, {
    headers: {
      'content-type': 'application/xml; charset=utf-8',
      'cache-control': 'public, max-age=0, s-maxage=600'
    }
  });
};
