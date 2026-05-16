export interface GarminFeatureCollection {
  readonly type: 'FeatureCollection';
  readonly features: Array<Record<string, unknown>>;
  readonly properties?: Record<string, unknown>;
}

function parseKmlCoordinates(text: string): [number, number, number?][] {
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
      return alt != null && Number.isFinite(alt) ? [lon, lat, alt] as const : [lon, lat] as const;
    })
    .filter((value): value is [number, number, number?] => value !== null);
}

function extractFirstTagContent(xml: string, tag: string): string | null {
  const match = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i').exec(xml);
  return match ? match[1] : null;
}

function extractAllPlacemarkBlocks(xml: string): string[] {
  const placemarks: string[] = [];
  const matcher = /<Placemark[\s\S]*?<\/Placemark>/gi;
  let match: RegExpExecArray | null;
  while ((match = matcher.exec(xml))) {
    placemarks.push(match[0]);
  }
  return placemarks;
}

function textFromTag(block: string, tag: string): string | null {
  const inner = extractFirstTagContent(block, tag);
  if (!inner) return null;
  return inner.replace(/<[^>]+>/g, '').trim() || null;
}

export function normalizeGarminFeed(kml: string, sourceUrl: string): GarminFeatureCollection {
  const features: Array<Record<string, unknown>> = [];
  const pointCandidates: Array<{ when?: string; coords: [number, number] }> = [];
  const placemarks = extractAllPlacemarkBlocks(kml);

  for (const placemark of placemarks) {
    const name = textFromTag(placemark, 'name') ?? undefined;
    const when = extractFirstTagContent(placemark, 'when')?.trim() ?? undefined;

    const pointBlock = extractFirstTagContent(placemark, 'Point');
    if (pointBlock) {
      const coordsText = extractFirstTagContent(pointBlock, 'coordinates');
      if (coordsText) {
        const coords = parseKmlCoordinates(coordsText);
        if (coords.length > 0) {
          const [lon, lat] = coords[0];
          features.push({
            type: 'Feature',
            properties: {
              kind: 'point',
              name,
              when
            },
            geometry: {
              type: 'Point',
              coordinates: [lon, lat]
            }
          });
          pointCandidates.push({ when, coords: [lat, lon] });
        }
      }
    }

    const lineBlock = extractFirstTagContent(placemark, 'LineString');
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
              when
            },
            geometry: {
              type: 'LineString',
              coordinates: coords.map((entry) => [entry[0], entry[1]])
            }
          });
        }
      }
    }
  }

  const latestPoint = pointCandidates.reduce<typeof pointCandidates[number] | null>((best, current) => {
    if (!best) return current;
    const bestAt = best.when ? Date.parse(best.when) : Number.NaN;
    const currentAt = current.when ? Date.parse(current.when) : Number.NaN;
    if (Number.isFinite(bestAt) && Number.isFinite(currentAt)) {
      return currentAt > bestAt ? current : best;
    }
    return current;
  }, null);

  return {
    type: 'FeatureCollection',
    properties: {
      source: 'garmin-mapshare',
      sourceUrl,
      fetchedAt: new Date().toISOString(),
      latestPoint
    },
    features
  };
}

export async function fetchGarminTrack(shareId: string, options?: { readonly signal?: AbortSignal }): Promise<GarminFeatureCollection> {
  const sourceUrl = `https://explore.garmin.com/Feed/Share/${encodeURIComponent(shareId)}`;
  const response = await fetch(sourceUrl, {
    signal: options?.signal,
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; HoggCountryScout/1.0)',
      Accept: 'application/vnd.google-earth.kml+xml, application/xml, text/xml;q=0.9, */*;q=0.8'
    }
  });

  if (!response.ok) {
    throw new Error(`Garmin feed failed with ${response.status}`);
  }

  const kml = await response.text();
  return normalizeGarminFeed(kml, sourceUrl);
}
