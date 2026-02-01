import type { Handler, HandlerEvent } from '@netlify/functions';

// Very small in-memory rate limiter (resets on cold start)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT = 60; // per minute
const RATE_WINDOW = 60 * 1000;

function jsonHeaders(extra: Record<string, string> = {}): Record<string, string> {
  return { 'Content-Type': 'application/json; charset=utf-8', ...extra };
}

function geoJsonHeaders(extra: Record<string, string> = {}): Record<string, string> {
  return { 'Content-Type': 'application/geo+json; charset=utf-8', ...extra };
}

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const rec = rateLimitMap.get(ip);

  if (!rec || rec.resetTime < now) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_WINDOW });
    return true;
  }

  if (rec.count >= RATE_LIMIT) return false;
  rec.count++;
  return true;
}

type GarminGeoJSON = {
  type: 'FeatureCollection';
  features: any[];
  properties?: Record<string, any>;
};

function parseKmlCoordinates(text: string): [number, number, number?][] {
  // KML coordinates are: lon,lat[,alt] separated by whitespace
  return text
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((chunk) => {
      const [lonS, latS, altS] = chunk.split(',');
      const lon = Number(lonS);
      const lat = Number(latS);
      const alt = altS == null ? undefined : Number(altS);
      if (!Number.isFinite(lon) || !Number.isFinite(lat)) return null;
      return alt != null && Number.isFinite(alt) ? ([lon, lat, alt] as const) : ([lon, lat] as const);
    })
    .filter(Boolean) as any;
}

function extractFirstTagContent(xml: string, tag: string): string | null {
  const re = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i');
  const m = re.exec(xml);
  return m ? m[1] : null;
}

function extractAllPlacemarkBlocks(xml: string): string[] {
  const out: string[] = [];
  const re = /<Placemark[\s\S]*?<\/Placemark>/gi;
  let m;
  while ((m = re.exec(xml))) out.push(m[0]);
  return out;
}

function textFromTag(block: string, tag: string): string | null {
  const inner = extractFirstTagContent(block, tag);
  if (!inner) return null;
  // strip any nested tags
  return inner.replace(/<[^>]+>/g, '').trim() || null;
}

function buildGeoJsonFromKml(kml: string, sourceUrl: string): GarminGeoJSON {
  const features: any[] = [];

  const docName = textFromTag(kml, 'name');

  // Placemarks: pull Point + LineString coords if present
  const placemarks = extractAllPlacemarkBlocks(kml);
  let latestPoint: { name?: string; when?: string; coords?: [number, number] } | null = null;

  for (const pm of placemarks) {
    const name = textFromTag(pm, 'name') || undefined;
    const when = extractFirstTagContent(pm, 'when')?.trim() || undefined;

    // Point
    const pointBlock = extractFirstTagContent(pm, 'Point');
    if (pointBlock) {
      const coordsText = extractFirstTagContent(pointBlock, 'coordinates');
      if (coordsText) {
        const coords = parseKmlCoordinates(coordsText);
        if (coords.length) {
          const c = coords[0];
          const lon = c[0];
          const lat = c[1];

          features.push({
            type: 'Feature',
            properties: {
              kind: 'point',
              name,
              when,
            },
            geometry: { type: 'Point', coordinates: [lon, lat] },
          });

          latestPoint = { name, when, coords: [lat, lon] };
        }
      }
    }

    // LineString
    const lineBlock = extractFirstTagContent(pm, 'LineString');
    if (lineBlock) {
      const coordsText = extractFirstTagContent(lineBlock, 'coordinates');
      if (coordsText) {
        const coords = parseKmlCoordinates(coordsText);
        if (coords.length >= 2) {
          features.push({
            type: 'Feature',
            properties: {
              kind: 'track',
              name,
              when,
            },
            geometry: { type: 'LineString', coordinates: coords.map((c) => [c[0], c[1]]) },
          });
        }
      }
    }
  }

  return {
    type: 'FeatureCollection',
    properties: {
      source: 'garmin-mapshare',
      sourceUrl,
      documentName: docName,
      fetchedAt: new Date().toISOString(),
      latestPoint: latestPoint || null,
      notes:
        'This is parsed from Garmin MapShare KML. If the device is not actively tracking/sending points, the feed may contain only a single point.',
    },
    features,
  };
}

const handler: Handler = async (event: HandlerEvent) => {
  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  const ip =
    event.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
    event.headers['x-nf-client-connection-ip'] ||
    'unknown';

  if (!checkRateLimit(ip)) {
    return {
      statusCode: 429,
      headers: jsonHeaders(),
      body: JSON.stringify({ error: 'Too many requests' }),
    };
  }

  const id = (event.queryStringParameters?.id || 'hoggcountry').trim();
  if (!/^[a-zA-Z0-9_-]{2,64}$/.test(id)) {
    return {
      statusCode: 400,
      headers: jsonHeaders(),
      body: JSON.stringify({ error: 'Invalid id' }),
    };
  }

  const sourceUrl = `https://inreach.garmin.com/Feed/Share/${encodeURIComponent(id)}`;

  try {
    const res = await fetch(sourceUrl, {
      headers: {
        // Garmin can be picky; keep this browser-ish.
        'User-Agent': 'Mozilla/5.0 (compatible; HoggCountryTracker/1.0)',
        Accept: 'application/vnd.google-earth.kml+xml, application/xml, text/xml;q=0.9, */*;q=0.8',
      },
    });

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      return {
        statusCode: 502,
        headers: jsonHeaders(),
        body: JSON.stringify({ error: 'Upstream fetch failed', status: res.status, details: text.slice(0, 200) }),
      };
    }

    const kml = await res.text();
    const geojson = buildGeoJsonFromKml(kml, sourceUrl);

    return {
      statusCode: 200,
      headers: geoJsonHeaders({
        // Cache at the edge to feel live without hammering Garmin.
        'Cache-Control': 'public, max-age=0, s-maxage=300, stale-while-revalidate=86400',
      }),
      body: JSON.stringify(geojson),
    };
  } catch (err: any) {
    return {
      statusCode: 500,
      headers: jsonHeaders(),
      body: JSON.stringify({ error: 'Internal error', details: String(err?.message || err) }),
    };
  }
};

export { handler };
