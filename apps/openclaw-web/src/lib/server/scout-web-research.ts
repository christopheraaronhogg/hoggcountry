export interface WebResearchInput {
  readonly query: string;
  readonly allowedDomains?: string | null;
  readonly limit?: number | null;
  readonly fetchPages?: boolean | null;
}

export interface WebResearchPageExcerpt {
  readonly url: string;
  readonly fetchedAt: string;
  readonly excerpt: string;
  readonly error: string | null;
}

export interface WebResearchSearchResult {
  readonly title: string;
  readonly url: string;
  readonly snippet: string;
  readonly domain: string;
  readonly page: WebResearchPageExcerpt | null;
}

export interface WebResearchDetails {
  readonly query: string;
  readonly fetchedAt: string;
  readonly provider: 'DuckDuckGo HTML';
  readonly allowedDomains: readonly string[];
  readonly results: readonly WebResearchSearchResult[];
  readonly skipped: readonly string[];
  readonly errors: readonly string[];
}

const SEARCH_URL = 'https://duckduckgo.com/html/';
const WEB_RESEARCH_TIMEOUT_MS = 8000;
const WEB_RESEARCH_MAX_RESULTS = 5;
const PAGE_EXCERPT_CHARS = 1400;
const USER_AGENT = 'Mozilla/5.0 (compatible; HoggCountryScout/1.0; +https://hoggcountry.com)';

const COMMON_HTML_ENTITIES: Record<string, string> = {
  amp: '&',
  apos: "'",
  hellip: '...',
  nbsp: ' ',
  quot: '"',
  rsquo: "'",
  lsquo: "'",
  rdquo: '"',
  ldquo: '"',
  ndash: '-',
  mdash: '-',
  lt: '<',
  gt: '>'
};

function excerpt(value: string, maxLength: number): string {
  const normalized = value.replace(/\s+/gu, ' ').trim();
  if (normalized.length <= maxLength) return normalized;
  return `${normalized.slice(0, maxLength - 3).trimEnd()}...`;
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
      .replace(/<noscript[\s\S]*?<\/noscript>/giu, ' ')
      .replace(/<svg[\s\S]*?<\/svg>/giu, ' ')
      .replace(/<br\s*\/?>/giu, '\n')
      .replace(/<\/(?:p|li|h[1-6]|tr|div)>/giu, '\n')
      .replace(/<[^>]+>/gu, ' ')
  )
    .replace(/\s+/gu, ' ')
    .trim();
}

function matchGroup(value: string, regex: RegExp): string | null {
  const match = value.match(regex);
  return match?.[1] ? decodeHtml(match[1]).trim() : null;
}

function normalizeDomain(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//u, '')
    .replace(/^www\./u, '')
    .replace(/\/.*$/u, '')
    .replace(/^\./u, '');
}

function parseAllowedDomains(input: string | null | undefined): string[] {
  if (!input) return [];
  return [...new Set(
    input
      .split(/[\s,;]+/u)
      .map(normalizeDomain)
      .filter((domain) => /^[a-z0-9.-]+\.[a-z]{2,}$/u.test(domain))
  )].slice(0, 8);
}

function domainMatches(hostname: string, allowedDomains: readonly string[]): boolean {
  if (allowedDomains.length === 0) return true;
  const normalized = normalizeDomain(hostname);
  return allowedDomains.some((domain) => normalized === domain || normalized.endsWith(`.${domain}`));
}

function isPrivateIpv4(hostname: string): boolean {
  const parts = hostname.split('.').map((part) => Number(part));
  if (parts.length !== 4 || parts.some((part) => !Number.isInteger(part) || part < 0 || part > 255)) return false;
  const [a, b] = parts;
  return (
    a === 0 ||
    a === 10 ||
    a === 127 ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168)
  );
}

function privateIpv6Literal(hostname: string): string | null {
  const literal = hostname.startsWith('[') && hostname.endsWith(']')
    ? hostname.slice(1, -1)
    : hostname.includes(':')
      ? hostname
      : '';
  if (!literal) return null;
  const normalized = literal.toLowerCase();
  if (normalized === '::1' || normalized.startsWith('fc') || normalized.startsWith('fd') || normalized.startsWith('fe80')) {
    return normalized;
  }
  return null;
}

export function assertPublicResearchUrl(rawUrl: string): URL {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    throw new Error('Invalid URL.');
  }

  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new Error('Only http/https web URLs can be researched.');
  }

  const hostname = url.hostname.toLowerCase();
  if (
    hostname === 'localhost' ||
    hostname.endsWith('.localhost') ||
    hostname === '0.0.0.0' ||
    isPrivateIpv4(hostname) ||
    privateIpv6Literal(hostname)
  ) {
    throw new Error('Private, loopback, and local network URLs are blocked for web research.');
  }

  return url;
}

async function fetchText(url: string, accept = 'text/html,application/xhtml+xml,text/plain;q=0.9'): Promise<string> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), WEB_RESEARCH_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        Accept: accept,
        'User-Agent': USER_AGENT
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

function normalizeDuckDuckGoResultUrl(href: string): string | null {
  const decoded = decodeHtml(href);
  try {
    const url = new URL(decoded, SEARCH_URL);
    if (url.hostname.includes('duckduckgo.com') && url.pathname === '/l/') {
      const target = url.searchParams.get('uddg');
      return target ? assertPublicResearchUrl(target).toString() : null;
    }

    return assertPublicResearchUrl(url.toString()).toString();
  } catch {
    return null;
  }
}

export function extractDuckDuckGoResults(html: string, allowedDomains: readonly string[] = [], limit = WEB_RESEARCH_MAX_RESULTS): WebResearchSearchResult[] {
  const results: WebResearchSearchResult[] = [];
  const seen = new Set<string>();
  const anchorRegex = /<a[^>]+class=["'][^"']*\bresult__a\b[^"']*["'][^>]+href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/giu;

  for (const match of html.matchAll(anchorRegex)) {
    const href = match[1] ?? '';
    const title = htmlToText(match[2] ?? '');
    const url = normalizeDuckDuckGoResultUrl(href);
    if (!url || !title || seen.has(url)) continue;

    let parsed: URL;
    try {
      parsed = assertPublicResearchUrl(url);
    } catch {
      continue;
    }

    if (!domainMatches(parsed.hostname, allowedDomains)) continue;

    const blockStart = match.index ?? 0;
    const nextAnchorIndex = html.slice(blockStart + match[0].length).search(/<a[^>]+class=["'][^"']*\bresult__a\b/iu);
    const block = nextAnchorIndex >= 0
      ? html.slice(blockStart, blockStart + match[0].length + nextAnchorIndex)
      : html.slice(blockStart, blockStart + 5000);
    const snippetHtml = matchGroup(block, /<a[^>]+class=["'][^"']*\bresult__snippet\b[^"']*["'][^>]*>([\s\S]*?)<\/a>/iu)
      ?? matchGroup(block, /<div[^>]+class=["'][^"']*\bresult__snippet\b[^"']*["'][^>]*>([\s\S]*?)<\/div>/iu)
      ?? '';
    const snippet = htmlToText(snippetHtml);

    seen.add(url);
    results.push({
      title,
      url,
      snippet,
      domain: normalizeDomain(parsed.hostname),
      page: null
    });

    if (results.length >= limit) break;
  }

  return results;
}

async function fetchPageExcerpt(url: string): Promise<WebResearchPageExcerpt> {
  const fetchedAt = new Date().toISOString();
  try {
    assertPublicResearchUrl(url);
    const html = await fetchText(url);
    const text = htmlToText(html);
    return {
      url,
      fetchedAt,
      excerpt: excerpt(text || 'No readable page text returned.', PAGE_EXCERPT_CHARS),
      error: null
    };
  } catch (error) {
    return {
      url,
      fetchedAt,
      excerpt: '',
      error: error instanceof Error ? error.message : 'Page fetch failed.'
    };
  }
}

export async function researchWeb(input: WebResearchInput): Promise<WebResearchDetails> {
  const query = input.query.trim();
  if (query.length < 3) {
    throw new Error('Research query must be at least 3 characters.');
  }

  const fetchedAt = new Date().toISOString();
  const allowedDomains = parseAllowedDomains(input.allowedDomains);
  const limit = Math.min(WEB_RESEARCH_MAX_RESULTS, Math.max(1, Math.round(input.limit ?? 4)));
  const search = new URL(SEARCH_URL);
  search.searchParams.set('q', allowedDomains.length > 0
    ? `${query} ${allowedDomains.map((domain) => `site:${domain}`).join(' OR ')}`
    : query);

  const skipped: string[] = [];
  const errors: string[] = [];
  let results: WebResearchSearchResult[] = [];

  try {
    const html = await fetchText(search.toString());
    results = extractDuckDuckGoResults(html, allowedDomains, limit);
  } catch (error) {
    errors.push(`Search failed: ${error instanceof Error ? error.message : 'unknown error'}`);
  }

  if (results.length === 0 && errors.length === 0) {
    skipped.push('No web search results matched the query and allowed domain filter.');
  }

  if (input.fetchPages !== false && results.length > 0) {
    const pages = await Promise.all(results.slice(0, limit).map((result) => fetchPageExcerpt(result.url)));
    results = results.map((result, index) => ({
      ...result,
      page: pages[index] ?? null
    }));
  }

  return {
    query,
    fetchedAt,
    provider: 'DuckDuckGo HTML',
    allowedDomains,
    results,
    skipped,
    errors
  };
}

export function renderWebResearchResult(details: WebResearchDetails): string {
  const lines = [
    `Web research fetched at ${details.fetchedAt}.`,
    `Search provider: ${details.provider}.`,
    `Query: ${details.query}`,
    details.allowedDomains.length > 0 ? `Domain filter: ${details.allowedDomains.join(', ')}` : null
  ].filter((line): line is string => Boolean(line));

  if (details.results.length === 0) {
    lines.push('Results: none returned.');
  } else {
    lines.push('Results:');
    details.results.forEach((result, index) => {
      lines.push(`${index + 1}. ${result.title}`);
      lines.push(`   URL: ${result.url}`);
      if (result.snippet) lines.push(`   Search snippet: ${excerpt(result.snippet, 360)}`);
      if (result.page?.excerpt) lines.push(`   Page excerpt fetched ${result.page.fetchedAt}: ${excerpt(result.page.excerpt, 700)}`);
      if (result.page?.error) lines.push(`   Page fetch error: ${result.page.error}`);
    });
  }

  if (details.skipped.length > 0) lines.push(`Skipped: ${details.skipped.join(' ')}`);
  if (details.errors.length > 0) lines.push(`Errors: ${details.errors.join(' ')}`);
  lines.push('Answer rule: cite the title, URL, and fetched timestamp for any web-derived claim. General web research is not official trail/weather truth unless the source itself is official.');
  return lines.join('\n');
}
