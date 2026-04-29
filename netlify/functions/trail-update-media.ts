import type { Handler } from '@netlify/functions';
import { connectLambda, getStore } from '@netlify/blobs';
import { jsonHeaders, readUpdates } from './_trail-updates';

const handler: Handler = async (event) => {
  connectLambda(event);

  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, headers: jsonHeaders(), body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  const id = String(event.queryStringParameters?.id || '').trim();
  if (!id) {
    return { statusCode: 400, headers: jsonHeaders(), body: JSON.stringify({ error: 'Missing media id' }) };
  }

  const payload = await readUpdates();
  const update = payload.updates.find((item) => item.id === id && item.mediaKey);
  if (!update?.mediaKey) {
    return { statusCode: 404, headers: jsonHeaders(), body: JSON.stringify({ error: 'Media not found' }) };
  }

  const data = await getStore('trail-update-media').get(update.mediaKey, { type: 'arrayBuffer' }).catch(() => null);
  if (!data) {
    return { statusCode: 404, headers: jsonHeaders(), body: JSON.stringify({ error: 'Media not found' }) };
  }

  return {
    statusCode: 200,
    isBase64Encoded: true,
    headers: {
      'Content-Type': update.mediaType || 'application/octet-stream',
      'Cache-Control': 'public, max-age=0, s-maxage=300, stale-while-revalidate=86400',
      'Netlify-CDN-Cache-Control': 'public, max-age=0, s-maxage=300, stale-while-revalidate=86400',
    },
    body: Buffer.from(data).toString('base64'),
  };
};

export { handler };
