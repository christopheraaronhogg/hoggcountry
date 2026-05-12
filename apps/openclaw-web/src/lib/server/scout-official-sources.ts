import type { DadPilotSummary } from '$lib/server/dad';

export type OfficialTrailSourceKind = 'auto' | 'atc' | 'nws';

export interface OfficialTrailSourceCheckInput {
  readonly query: string;
  readonly source?: OfficialTrailSourceKind;
  readonly state?: string | null;
  readonly latitude?: number | null;
  readonly longitude?: number | null;
  readonly useDadLocation?: boolean;
}

export interface AtcTrailUpdateResult {
  readonly title: string;
  readonly meta: string;
  readonly href: string;
  readonly elapsed: string | null;
  readonly updated: boolean;
  readonly publishedAt: string | null;
  readonly modifiedAt: string | null;
  readonly excerpt: string;
  readonly score: number;
}

export interface NwsForecastPeriodSummary {
  readonly name: string;
  readonly startTime: string | null;
  readonly endTime: string | null;
  readonly temperature: string;
  readonly wind: string;
  readonly shortForecast: string;
  readonly detailedForecast: string;
}

export interface NwsAlertSummary {
  readonly event: string;
  readonly severity: string | null;
  readonly certainty: string | null;
  readonly urgency: string | null;
  readonly headline: string;
  readonly areaDesc: string | null;
  readonly effective: string | null;
  readonly expires: string | null;
  readonly description: string;
  readonly instruction: string | null;
}

export interface NwsWeatherResult {
  readonly latitude: number;
  readonly longitude: number;
  readonly label: string;
  readonly pointUrl: string;
  readonly forecastUrl: string | null;
  readonly alertsUrl: string;
  readonly forecastUpdatedAt: string | null;
  readonly periods: NwsForecastPeriodSummary[];
  readonly alerts: NwsAlertSummary[];
}

export interface OfficialTrailSourceCheckDetails {
  readonly query: string;
  readonly source: OfficialTrailSourceKind;
  readonly fetchedAt: string;
  readonly atcUpdates: AtcTrailUpdateResult[];
  readonly weather: NwsWeatherResult | null;
  readonly skipped: string[];
  readonly errors: string[];
}

interface ParsedAtcTrailUpdate {
  readonly title: string;
  readonly meta: string;
  readonly href: string;
  readonly elapsed: string | null;
  readonly updated: boolean;
  readonly excerpt: string;
}

interface AtcTrailUpdateDetail {
  readonly publishedAt: string | null;
  readonly modifiedAt: string | null;
  readonly excerpt: string | null;
}

interface NwsPointResponse {
  readonly properties?: {
    readonly forecast?: unknown;
    readonly relativeLocation?: {
      readonly properties?: {
        readonly city?: unknown;
        readonly state?: unknown;
      };
    };
  };
}

interface NwsForecastResponse {
  readonly properties?: {
    readonly updated?: unknown;
    readonly periods?: Array<{
      readonly name?: unknown;
      readonly startTime?: unknown;
      readonly endTime?: unknown;
      readonly temperature?: unknown;
      readonly temperatureUnit?: unknown;
      readonly windSpeed?: unknown;
      readonly windDirection?: unknown;
      readonly shortForecast?: unknown;
      readonly detailedForecast?: unknown;
    }>;
  };
}

interface NwsAlertsResponse {
  readonly features?: Array<{
    readonly properties?: {
      readonly event?: unknown;
      readonly severity?: unknown;
      readonly certainty?: unknown;
      readonly urgency?: unknown;
      readonly headline?: unknown;
      readonly areaDesc?: unknown;
      readonly effective?: unknown;
      readonly expires?: unknown;
      readonly description?: unknown;
      readonly instruction?: unknown;
    };
  }>;
}

const ATC_TRAIL_UPDATES_URL = 'https://appalachiantrail.org/trail-updates/';
const ATC_CACHE_MS = 10 * 60 * 1000;
const NWS_CACHE_MS = 5 * 60 * 1000;
const OFFICIAL_SOURCE_TIMEOUT_MS = 7000;

const COMMON_HTML_ENTITIES: Record<string, string> = {
  amp: '&',
  apos: "'",
  hellip: '…',
  nbsp: ' ',
  quot: '"',
  rsquo: '’',
  lsquo: '‘',
  rdquo: '”',
  ldquo: '“',
  ndash: '–',
  mdash: '—',
  lt: '<',
  gt: '>'
};

const SOURCE_STOPWORDS = new Set([
  'about',
  'after',
  'ahead',
  'along',
  'could',
  'current',
  'from',
  'have',
  'help',
  'into',
  'latest',
  'like',
  'need',
  'next',
  'please',
  'scout',
  'should',
  'that',
  'their',
  'there',
  'this',
  'trail',
  'what',
  'when',
  'where',
  'with',
  'would',
  'your'
]);

let cachedAtcList: { readonly ts: number; readonly items: ParsedAtcTrailUpdate[] } | null = null;
const cachedAtcDetails = new Map<string, { readonly ts: number; readonly detail: AtcTrailUpdateDetail }>();
const cachedNws = new Map<string, { readonly ts: number; readonly weather: NwsWeatherResult }>();

const AT_STATE_MILE_RANGES: readonly { readonly state: string; readonly start: number; readonly end: number }[] = [
  { state: 'GA', start: 0, end: 78.6 },
  { state: 'NC', start: 78.6, end: 167.5 },
  { state: 'TN', start: 167.5, end: 470.0 },
  { state: 'VA', start: 470.0, end: 1008.0 },
  { state: 'WV', start: 1008.0, end: 1025.0 },
  { state: 'MD', start: 1025.0, end: 1067.0 },
  { state: 'PA', start: 1067.0, end: 1296.0 },
  { state: 'NJ', start: 1296.0, end: 1369.0 },
  { state: 'NY', start: 1369.0, end: 1456.0 },
  { state: 'CT', start: 1456.0, end: 1508.0 },
  { state: 'MA', start: 1508.0, end: 1602.0 },
  { state: 'VT', start: 1602.0, end: 1751.0 },
  { state: 'NH', start: 1751.0, end: 1918.0 },
  { state: 'ME', start: 1918.0, end: 2200.0 }
];

export function approximateAtStateForMile(mile: number | null | undefined): string | null {
  if (typeof mile !== 'number' || !Number.isFinite(mile)) return null;
  return AT_STATE_MILE_RANGES.find((range) => mile >= range.start && mile < range.end)?.state ?? null;
}

function textValue(value: unknown): string {
  return typeof value === 'string' ? value.replace(/\s+/gu, ' ').trim() : '';
}

function excerpt(value: string, maxLength: number): string {
  const normalized = value.replace(/\s+/gu, ' ').trim();
  if (normalized.length <= maxLength) return normalized;
  return `${normalized.slice(0, maxLength - 1).trimEnd()}…`;
}

function decodeHtml(value: string): string {
  return value
    .replace(/&#(\d+);/gu, (_match, code: string) => String.fromCodePoint(Number(code)))
    .replace(/&#x([a-f0-9]+);/giu, (_match, code: string) => String.fromCodePoint(Number.parseInt(code, 16)))
    .replace(/&([a-z]+);/giu, (match, entity: string) => COMMON_HTML_ENTITIES[entity.toLowerCase()] ?? match);
}

function htmlToText(value: string): string {
  return decodeHtml(
    value
      .replace(/<script[\s\S]*?<\/script>/giu, ' ')
      .replace(/<style[\s\S]*?<\/style>/giu, ' ')
      .replace(/<br\s*\/?>/giu, '\n')
      .replace(/<\/p>/giu, '\n')
      .replace(/<\/h[1-6]>/giu, '\n')
      .replace(/<[^>]+>/gu, ' ')
  )
    .replace(/\s+/gu, ' ')
    .trim();
}

function matchGroup(value: string, regex: RegExp): string | null {
  const match = value.match(regex);
  return match?.[1] ? decodeHtml(match[1]).trim() : null;
}

function extractMetaContent(html: string, key: string): string | null {
  const escaped = key.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&');
  return matchGroup(html, new RegExp(`<meta[^>]+(?:name|property)=["']${escaped}["'][^>]+content=["']([^"']*)["'][^>]*>`, 'iu'))
    ?? matchGroup(html, new RegExp(`<meta[^>]+content=["']([^"']*)["'][^>]+(?:name|property)=["']${escaped}["'][^>]*>`, 'iu'));
}

function sourceTerms(input: string): string[] {
  return [...new Set(
    input
      .toLowerCase()
      .replace(/[^a-z0-9.\s-]/gu, ' ')
      .split(/\s+/u)
      .filter((term) => term.length >= 3 && !SOURCE_STOPWORDS.has(term))
  )];
}

function containsAny(input: string, needles: readonly string[]): boolean {
  const lowered = input.toLowerCase();
  return needles.some((needle) => lowered.includes(needle));
}

function normalizeAtcUrl(href: string): string {
  try {
    return new URL(href, ATC_TRAIL_UPDATES_URL).toString();
  } catch {
    return href;
  }
}

function isFiniteCoordinate(value: unknown, min: number, max: number): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= min && value <= max;
}

function parseLatLon(value: string): { readonly latitude: number; readonly longitude: number } | null {
  const match = value.match(/(-?\d{1,2}(?:\.\d+)?)[,\s]+(-?\d{1,3}(?:\.\d+)?)/u);
  if (!match) return null;
  const latitude = Number(match[1]);
  const longitude = Number(match[2]);
  if (!isFiniteCoordinate(latitude, -90, 90) || !isFiniteCoordinate(longitude, -180, 180)) return null;
  return { latitude, longitude };
}

function coordinatesFromInput(input: OfficialTrailSourceCheckInput, dadPilotSummary: DadPilotSummary | null): { readonly latitude: number; readonly longitude: number } | null {
  if (isFiniteCoordinate(input.latitude, -90, 90) && isFiniteCoordinate(input.longitude, -180, 180)) {
    return { latitude: input.latitude, longitude: input.longitude };
  }

  const queryCoordinates = parseLatLon(input.query);
  if (queryCoordinates) return queryCoordinates;

  if (input.useDadLocation && dadPilotSummary) {
    return parseLatLon(dadPilotSummary.latestFixLabel);
  }

  return null;
}

async function fetchTextResource(url: string, accept = 'text/html,application/xhtml+xml'): Promise<string> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), OFFICIAL_SOURCE_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        Accept: accept,
        'User-Agent': 'Mozilla/5.0 (compatible; HoggCountryScout/1.0; +https://hoggcountry.com)'
      }
    });

    if (!response.ok) {
      throw new Error(`${response.status} ${response.statusText}`.trim());
    }

    return await response.text();
  } finally {
    clearTimeout(timeoutId);
  }
}

async function fetchJsonResource<T>(url: string): Promise<T> {
  const text = await fetchTextResource(url, 'application/geo+json,application/json');
  return JSON.parse(text) as T;
}

function parseAtcList(html: string): ParsedAtcTrailUpdate[] {
  return html
    .split('<div class="trail-update-component thumbnail-style">')
    .slice(1)
    .map((block) => {
      const title = htmlToText(matchGroup(block, /<h3[^>]*class=["']update-title["'][^>]*>([\s\S]*?)<\/h3>/iu) ?? '');
      const detailsBlock = matchGroup(block, /<div[^>]*class=["']trail-update-details["'][^>]*>([\s\S]*?)<\/div>/iu) ?? '';
      const meta = htmlToText(matchGroup(detailsBlock, /<p[^>]*>([\s\S]*?)<\/p>/iu) ?? '');
      const href = normalizeAtcUrl(matchGroup(block, /<a[^>]+href=["']([^"']+)["'][^>]*>/iu) ?? '');
      const elapsed = htmlToText(matchGroup(block, /<p[^>]*class=["']elapsed-time["'][^>]*>([\s\S]*?)<\/p>/iu) ?? '') || null;
      const updated = /class=["']updated["']/iu.test(block);

      if (!title || !href) return null;

      return {
        title,
        meta,
        href,
        elapsed,
        updated,
        excerpt: [title, meta, elapsed ? `Updated ${elapsed}` : null].filter(Boolean).join('; ')
      } satisfies ParsedAtcTrailUpdate;
    })
    .filter((item): item is ParsedAtcTrailUpdate => item !== null);
}

async function getAtcTrailUpdatesList(): Promise<ParsedAtcTrailUpdate[]> {
  if (cachedAtcList && Date.now() - cachedAtcList.ts < ATC_CACHE_MS) {
    return cachedAtcList.items;
  }

  const html = await fetchTextResource(ATC_TRAIL_UPDATES_URL);
  const items = parseAtcList(html);
  cachedAtcList = { ts: Date.now(), items };
  return items;
}

function stateTokens(value: string | null | undefined): string[] {
  return value?.toUpperCase().split(/[^A-Z]+/u).filter((item) => item.length === 2) ?? [];
}

function atcUpdateMatchesState(update: ParsedAtcTrailUpdate, state: string | null): boolean {
  const queryStates = stateTokens(state);
  if (queryStates.length === 0) return false;
  const updateStates = new Set(stateTokens(update.meta));
  return queryStates.some((item) => updateStates.has(item));
}

function scoreAtcUpdate(update: ParsedAtcTrailUpdate, query: string, state: string | null): number {
  const haystack = `${update.title} ${update.meta} ${update.excerpt}`.toLowerCase();
  const terms = sourceTerms(query);
  let score = update.updated ? 1 : 0;

  for (const term of terms) {
    if (haystack.includes(term)) score += 2;
  }

  if (atcUpdateMatchesState(update, state)) {
    score += 8;
  }

  if (/hour|today|yesterday/iu.test(update.elapsed ?? '')) score += 1;
  return score;
}

async function fetchAtcTrailUpdateDetail(url: string): Promise<AtcTrailUpdateDetail> {
  const cached = cachedAtcDetails.get(url);
  if (cached && Date.now() - cached.ts < ATC_CACHE_MS) return cached.detail;

  const html = await fetchTextResource(url);
  const metaDescription = extractMetaContent(html, 'description') ?? extractMetaContent(html, 'og:description');
  const publishedAt = extractMetaContent(html, 'article:published_time');
  const modifiedAt = extractMetaContent(html, 'article:modified_time');
  const contentBlock = matchGroup(html, /<div[^>]*class=["']wp-content["'][^>]*>([\s\S]*?)<\/div>\s*<\/div>/iu);
  const contentText = contentBlock ? htmlToText(contentBlock) : null;
  const detail = {
    publishedAt: publishedAt || null,
    modifiedAt: modifiedAt || null,
    excerpt: excerpt(contentText || metaDescription || '', 1200) || null
  } satisfies AtcTrailUpdateDetail;

  cachedAtcDetails.set(url, { ts: Date.now(), detail });
  return detail;
}

async function fetchAtcTrailUpdates(query: string, state: string | null, limit = 5): Promise<AtcTrailUpdateResult[]> {
  const list = await getAtcTrailUpdatesList();
  const scored = list
    .map((update) => ({ update, score: scoreAtcUpdate(update, query, state), stateMatch: atcUpdateMatchesState(update, state) }))
    .sort((left, right) => right.score - left.score);
  const stateMatches = state ? scored.filter((item) => item.stateMatch) : [];
  const candidatePool = stateMatches.length > 0 ? stateMatches : scored;
  const hasPositiveMatch = candidatePool.some((item) => item.score > 0);
  const selected = (hasPositiveMatch ? candidatePool.filter((item) => item.score > 0) : candidatePool).slice(0, limit);

  return Promise.all(
    selected.map(async ({ update, score }) => {
      try {
        const detail = await fetchAtcTrailUpdateDetail(update.href);
        return {
          ...update,
          publishedAt: detail.publishedAt,
          modifiedAt: detail.modifiedAt,
          excerpt: detail.excerpt || update.excerpt,
          score
        } satisfies AtcTrailUpdateResult;
      } catch {
        return {
          ...update,
          publishedAt: null,
          modifiedAt: null,
          score
        } satisfies AtcTrailUpdateResult;
      }
    })
  );
}

function normalizeNwsPeriod(period: NonNullable<NwsForecastResponse['properties']>['periods'][number]): NwsForecastPeriodSummary {
  const temperature = typeof period.temperature === 'number'
    ? `${period.temperature}${textValue(period.temperatureUnit) ? `°${textValue(period.temperatureUnit)}` : '°'}`
    : textValue(period.temperature) || 'unknown';
  const wind = [textValue(period.windSpeed), textValue(period.windDirection)].filter(Boolean).join(' ') || 'unknown';

  return {
    name: textValue(period.name) || 'Forecast period',
    startTime: textValue(period.startTime) || null,
    endTime: textValue(period.endTime) || null,
    temperature,
    wind,
    shortForecast: textValue(period.shortForecast) || 'No short forecast available.',
    detailedForecast: excerpt(textValue(period.detailedForecast), 420)
  };
}

function normalizeNwsAlert(feature: NonNullable<NwsAlertsResponse['features']>[number]): NwsAlertSummary | null {
  const properties = feature.properties;
  if (!properties) return null;
  const event = textValue(properties.event);
  const headline = textValue(properties.headline);
  if (!event && !headline) return null;

  return {
    event: event || 'Weather alert',
    severity: textValue(properties.severity) || null,
    certainty: textValue(properties.certainty) || null,
    urgency: textValue(properties.urgency) || null,
    headline: headline || event || 'Weather alert',
    areaDesc: textValue(properties.areaDesc) || null,
    effective: textValue(properties.effective) || null,
    expires: textValue(properties.expires) || null,
    description: excerpt(textValue(properties.description), 600),
    instruction: textValue(properties.instruction) ? excerpt(textValue(properties.instruction), 420) : null
  };
}

async function fetchNwsWeather(latitude: number, longitude: number): Promise<NwsWeatherResult> {
  const cacheKey = `${latitude.toFixed(3)},${longitude.toFixed(3)}`;
  const cached = cachedNws.get(cacheKey);
  if (cached && Date.now() - cached.ts < NWS_CACHE_MS) return cached.weather;

  const pointUrl = `https://api.weather.gov/points/${latitude.toFixed(4)},${longitude.toFixed(4)}`;
  const alertsUrl = `https://api.weather.gov/alerts/active?point=${latitude.toFixed(4)},${longitude.toFixed(4)}`;
  const point = await fetchJsonResource<NwsPointResponse>(pointUrl);
  const forecastUrl = textValue(point.properties?.forecast) || null;
  const [forecast, alerts] = await Promise.all([
    forecastUrl ? fetchJsonResource<NwsForecastResponse>(forecastUrl) : Promise.resolve(null),
    fetchJsonResource<NwsAlertsResponse>(alertsUrl).catch(() => ({ features: [] }))
  ]);

  const city = textValue(point.properties?.relativeLocation?.properties?.city);
  const state = textValue(point.properties?.relativeLocation?.properties?.state);
  const label = [city, state].filter(Boolean).join(', ') || `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
  const periods = forecast?.properties?.periods?.slice(0, 5).map(normalizeNwsPeriod) ?? [];
  const alertItems = alerts.features?.map(normalizeNwsAlert).filter((item): item is NwsAlertSummary => item !== null).slice(0, 5) ?? [];

  const weather = {
    latitude,
    longitude,
    label,
    pointUrl,
    forecastUrl,
    alertsUrl,
    forecastUpdatedAt: textValue(forecast?.properties?.updated) || null,
    periods,
    alerts: alertItems
  } satisfies NwsWeatherResult;

  cachedNws.set(cacheKey, { ts: Date.now(), weather });
  return weather;
}

function shouldCheckAtc(input: OfficialTrailSourceCheckInput): boolean {
  if (input.source === 'atc') return true;
  if (input.source === 'nws') return false;
  return true;
}

function shouldCheckNws(input: OfficialTrailSourceCheckInput, coordinates: { readonly latitude: number; readonly longitude: number } | null): boolean {
  if (input.source === 'nws') return true;
  if (input.source === 'atc') return false;
  return Boolean(coordinates) && containsAny(input.query, ['weather', 'forecast', 'storm', 'rain', 'snow', 'ice', 'wind', 'heat', 'cold', 'alert', 'flood', 'thunder']);
}

export async function checkOfficialTrailSources(
  input: OfficialTrailSourceCheckInput,
  dadPilotSummary: DadPilotSummary | null
): Promise<OfficialTrailSourceCheckDetails> {
  const source = input.source ?? 'auto';
  const query = input.query.trim();
  const state = input.state?.trim().toUpperCase() || null;
  const coordinates = coordinatesFromInput(input, dadPilotSummary);
  const skipped: string[] = [];
  const errors: string[] = [];
  let atcUpdates: AtcTrailUpdateResult[] = [];
  let weather: NwsWeatherResult | null = null;

  if (shouldCheckAtc({ ...input, source })) {
    try {
      atcUpdates = await fetchAtcTrailUpdates(query, state, 5);
    } catch (error) {
      errors.push(`ATC Trail Updates check failed: ${error instanceof Error ? error.message : 'unknown error'}`);
    }
  }

  if (shouldCheckNws({ ...input, source }, coordinates)) {
    if (!coordinates) {
      skipped.push('NWS weather check skipped: latitude/longitude required. Pass coordinates, include them in the query, or set useDadLocation when Dad has a Garmin fix.');
    } else {
      try {
        weather = await fetchNwsWeather(coordinates.latitude, coordinates.longitude);
      } catch (error) {
        errors.push(`NWS weather check failed: ${error instanceof Error ? error.message : 'unknown error'}`);
      }
    }
  } else if (source === 'nws' && !coordinates) {
    skipped.push('NWS weather check skipped: latitude/longitude required.');
  }

  return {
    query,
    source,
    fetchedAt: new Date().toISOString(),
    atcUpdates,
    weather,
    skipped,
    errors
  };
}

export function renderOfficialTrailSourceResult(details: OfficialTrailSourceCheckDetails): string {
  const lines: string[] = [`Official trail source check fetched at ${details.fetchedAt}.`, `Query: ${details.query}`];

  if (details.atcUpdates.length > 0) {
    lines.push('ATC Trail Updates:');
    details.atcUpdates.forEach((update, index) => {
      const meta = [update.meta, update.elapsed, update.updated ? '*UPDATED*' : null].filter(Boolean).join(' | ');
      const dates = [update.publishedAt ? `published ${update.publishedAt}` : null, update.modifiedAt ? `modified ${update.modifiedAt}` : null].filter(Boolean).join('; ');
      lines.push(`${index + 1}. ${update.title}${meta ? ` (${meta})` : ''}${dates ? ` — ${dates}` : ''}`);
      lines.push(`   ${update.href}`);
      lines.push(`   ${excerpt(update.excerpt, 520)}`);
    });
  } else {
    lines.push('ATC Trail Updates: no matching updates returned from the current list check.');
  }

  if (details.weather) {
    lines.push(`NWS forecast for ${details.weather.label} (${details.weather.latitude.toFixed(4)}, ${details.weather.longitude.toFixed(4)}):`);
    if (details.weather.alerts.length > 0) {
      lines.push('Active NWS alerts:');
      details.weather.alerts.forEach((alert, index) => {
        lines.push(`${index + 1}. ${alert.event}${alert.severity ? ` (${alert.severity})` : ''}: ${alert.headline}${alert.expires ? ` Expires ${alert.expires}.` : ''}`);
        if (alert.instruction) lines.push(`   Instruction: ${excerpt(alert.instruction, 260)}`);
      });
    } else {
      lines.push('Active NWS alerts: none returned for this point.');
    }

    if (details.weather.periods.length > 0) {
      lines.push('Forecast periods:');
      details.weather.periods.forEach((period, index) => {
        const timing = [period.startTime ? `starts ${period.startTime}` : null, period.endTime ? `ends ${period.endTime}` : null].filter(Boolean).join('; ');
        lines.push(`${index + 1}. ${period.name}${timing ? ` (${timing})` : ''}: ${period.temperature}, ${period.wind}, ${period.shortForecast}. ${excerpt(period.detailedForecast, 260)}`);
      });
    }

    lines.push(`NWS source links: ${[details.weather.pointUrl, details.weather.forecastUrl, details.weather.alertsUrl].filter(Boolean).join(' | ')}`);
  }

  if (details.skipped.length > 0) {
    lines.push(`Skipped: ${details.skipped.join(' ')}`);
  }

  if (details.errors.length > 0) {
    lines.push(`Errors: ${details.errors.join(' ')}`);
  }

  lines.push('Use this as live/official source context for this turn only. Keep user-private workspace data separate from public/official source data.');
  return lines.join('\n');
}
