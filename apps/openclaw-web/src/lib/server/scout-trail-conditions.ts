import {
  approximateAtStateForMile,
  fetchAtcTrailUpdatesForState,
  type AtcTrailUpdateResult
} from '$lib/server/scout-official-sources';
import { publicApiBase } from '$lib/server/public-api';

/**
 * Live trail-conditions ingestion for the Scout field pack: official closures,
 * detours, fire/burn notices, and hazard alerts pulled from license-clean public
 * sources and stamped with a fetch time.
 *
 * This is the "live-conditions loop." It rides the existing field-pack build
 * (which has its own TTL + on-demand refresh) rather than a new cron — the pack
 * build IS the cadence. Two sources:
 *
 *   - **ATC Trail Updates** (no key) — the Appalachian Trail Conservancy's own
 *     closure/detour/notice feed, scoped to the hiker's current AT state.
 *   - **NPS park alerts** — alerts for the National Park units the AT runs
 *     through (the trail's own `appa` unit plus GRSM, Shenandoah, Harpers Ferry,
 *     etc.), fetched through the Laravel NPS proxy (`/api/v1/nps/alerts`) so the
 *     `NPS_API_KEY` stays server-side in Laravel. Degrades to ATC-only if the
 *     proxy/key isn't configured. See docs/runbooks/nps-api-key.md.
 *
 * Both are on the allowed side of `docs/trail-data-provenance.md` (NPS API +
 * ATC's own posted notices). This only *adds* timestamped current data labelled
 * "verify before relying on it" — it never rewrites Scout's grounding config, so
 * it stays on the safe side of the human-gate (the conditions are presented, not
 * trusted as ground truth). USFS forest-order alerts are a planned third source
 * (per-forest HTML; see TODO below) and are intentionally not wired here yet.
 */

export type TrailConditionSource = 'nps' | 'atc';
export type TrailConditionCategory = 'closure' | 'detour' | 'fire' | 'caution' | 'info';
export type TrailConditionSeverity = 'high' | 'moderate' | 'low';

export interface TrailConditionItem {
  readonly source: TrailConditionSource;
  readonly sourceLabel: string;
  readonly category: TrailConditionCategory;
  readonly title: string;
  readonly summary: string;
  readonly url: string | null;
  readonly area: string | null;
  readonly severity: TrailConditionSeverity;
  readonly publishedAt: string | null;
}

export interface TrailConditionsPack {
  readonly items: readonly TrailConditionItem[];
  readonly sourcesChecked: readonly TrailConditionSource[];
  readonly sourcesSkipped: readonly string[];
  readonly errors: readonly string[];
  readonly fetchedAt: string;
  readonly note: string;
}

// NPS is reached through the Laravel proxy (GET /api/v1/nps/alerts), NOT
// developer.nps.gov directly — the NPS_API_KEY lives only in Laravel (see
// docs/runbooks/nps-api-key.md). scout-web holds no key; if the proxy isn't
// configured it returns 503 and conditions degrade to ATC-only.
const NPS_PROXY_RESOURCE = 'nps/alerts';
const NPS_CACHE_MS = 10 * 60 * 1000;
const CONDITIONS_TIMEOUT_MS = 7000;
const MAX_CONDITION_ITEMS = 8;
const ATC_PUBLIC_URL = 'https://appalachiantrail.org/trail-updates/';
const NPS_AT_CONDITIONS_URL = 'https://www.nps.gov/appa/planyourvisit/conditions.htm';

// The Appalachian NST's own NPS unit — always checked, in every state.
const NPS_PARKS_ALWAYS: readonly string[] = ['appa'];

// NPS units the AT actually passes through, by AT state. Keep this conservative:
// only units the trail physically crosses, so alerts stay relevant to a hiker.
const NPS_PARKS_BY_STATE: Record<string, readonly string[]> = {
  NC: ['grsm'],
  TN: ['grsm'],
  VA: ['shen', 'blri'],
  WV: ['hafe'],
  MD: ['hafe', 'choh'],
  PA: ['dewa'],
  NJ: ['dewa']
};

const NPS_PARK_LABELS: Record<string, string> = {
  appa: 'Appalachian National Scenic Trail (NPS)',
  grsm: 'Great Smoky Mountains NP',
  shen: 'Shenandoah NP',
  blri: 'Blue Ridge Parkway',
  hafe: 'Harpers Ferry NHP',
  choh: 'C&O Canal NHP',
  dewa: 'Delaware Water Gap NRA'
};

interface NpsAlertsResponse {
  readonly data?: ReadonlyArray<{
    readonly title?: unknown;
    readonly description?: unknown;
    readonly url?: unknown;
    readonly category?: unknown;
    readonly parkCode?: unknown;
    readonly lastIndexedDate?: unknown;
  }>;
}

// The Laravel NPS proxy wraps the upstream NPS JSON: { data: { payload: <NPS> }, meta }.
interface NpsProxyEnvelope {
  readonly data?: { readonly payload?: NpsAlertsResponse };
}

const cachedNpsByKey = new Map<string, { readonly ts: number; readonly items: TrailConditionItem[] }>();

/** Test-only: clear the in-memory NPS cache so suites don't cross-contaminate. */
export function __resetTrailConditionsCacheForTests(): void {
  cachedNpsByKey.clear();
}

function text(value: unknown): string {
  return typeof value === 'string' ? value.replace(/\s+/gu, ' ').trim() : '';
}

function clip(value: string, maxLength: number): string {
  if (value.length <= maxLength) return value;
  return `${value.slice(0, maxLength - 1).trimEnd()}…`;
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'unknown error';
}

/** Keyword-classify a condition by what it actually is, so Scout/UI can rank it. */
function classifyConditionText(value: string): TrailConditionCategory {
  const t = value.toLowerCase();
  if (/\bfire\b|wildfire|burn ban|prescribed burn|smoke/u.test(t)) return 'fire';
  if (/detour|reroute|re-route|relocation|relocated/u.test(t)) return 'detour';
  if (/clos(e|ed|ure|ing)|shut|not accessible|impassable|no access/u.test(t)) return 'closure';
  if (/caution|hazard|danger|warning|advisory|flood|washout|bridge out|high water|ford|downed|blowdown/u.test(t)) {
    return 'caution';
  }
  return 'info';
}

function severityForCategory(category: TrailConditionCategory): TrailConditionSeverity {
  if (category === 'closure' || category === 'fire') return 'high';
  if (category === 'detour' || category === 'caution') return 'moderate';
  return 'low';
}

const SEVERITY_RANK: Record<TrailConditionSeverity, number> = { high: 0, moderate: 1, low: 2 };

async function fetchJsonWithTimeout(url: string): Promise<unknown> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), CONDITIONS_TIMEOUT_MS);
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
        'User-Agent': 'Mozilla/5.0 (compatible; HoggCountryScout/1.0; +https://hoggcountry.com)'
      }
    });
    if (!response.ok) throw new Error(`${response.status} ${response.statusText}`.trim());
    return JSON.parse(await response.text());
  } finally {
    clearTimeout(timeoutId);
  }
}

function normalizeNpsAlert(
  raw: NonNullable<NpsAlertsResponse['data']>[number]
): TrailConditionItem | null {
  const title = text(raw.title);
  const description = text(raw.description);
  if (!title && !description) return null;
  const parkCode = text(raw.parkCode).toLowerCase();
  const category = classifyConditionText(`${text(raw.category)} ${title} ${description}`);
  return {
    source: 'nps',
    sourceLabel: NPS_PARK_LABELS[parkCode] ?? 'National Park Service',
    category,
    title: title || 'Park alert',
    summary: clip(description || title, 400),
    url: text(raw.url) || NPS_AT_CONDITIONS_URL,
    area: NPS_PARK_LABELS[parkCode] ?? (parkCode ? parkCode.toUpperCase() : null),
    severity: severityForCategory(category),
    publishedAt: text(raw.lastIndexedDate) || null
  };
}

async function fetchNpsConditions(parkCodes: readonly string[], apiBase: string): Promise<TrailConditionItem[]> {
  const key = parkCodes.join(',');
  const cached = cachedNpsByKey.get(key);
  if (cached && Date.now() - cached.ts < NPS_CACHE_MS) return cached.items;

  // Through the Laravel proxy — no api_key on the wire; Laravel adds it server-side.
  const url = `${apiBase.replace(/\/+$/u, '')}/${NPS_PROXY_RESOURCE}?parkCode=${encodeURIComponent(key)}&limit=30`;
  const envelope = (await fetchJsonWithTimeout(url)) as NpsProxyEnvelope;
  const items = (envelope.data?.payload?.data ?? [])
    .map(normalizeNpsAlert)
    .filter((item): item is TrailConditionItem => item !== null);

  cachedNpsByKey.set(key, { ts: Date.now(), items });
  return items;
}

function atcUpdateToItem(update: AtcTrailUpdateResult): TrailConditionItem {
  const blob = `${update.title} ${update.meta} ${update.excerpt}`;
  const category = classifyConditionText(blob);
  return {
    source: 'atc',
    sourceLabel: 'ATC Trail Updates',
    category,
    title: update.title,
    summary: clip(text(update.excerpt) || update.meta, 400),
    url: update.href,
    area: text(update.meta) || null,
    // A freshly-flagged ATC update is at least a caution even if the keywords are bland.
    severity: update.updated && category === 'info' ? 'moderate' : severityForCategory(category),
    publishedAt: update.publishedAt ?? update.modifiedAt ?? null
  };
}

function rankConditions(items: readonly TrailConditionItem[]): TrailConditionItem[] {
  const seen = new Set<string>();
  return [...items]
    .sort((a, b) => {
      const bySeverity = SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity];
      if (bySeverity !== 0) return bySeverity;
      return (b.publishedAt ?? '').localeCompare(a.publishedAt ?? '');
    })
    .filter((item) => {
      const key = `${item.source}:${item.title.toLowerCase()}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}

function sourceLabelList(sources: readonly TrailConditionSource[]): string {
  const labels = sources.map((source) => (source === 'nps' ? 'NPS' : 'ATC'));
  if (labels.length === 0) return 'official sources';
  if (labels.length === 1) return labels[0];
  return `${labels.slice(0, -1).join(', ')} + ${labels[labels.length - 1]}`;
}

function buildNote(
  items: readonly TrailConditionItem[],
  sourcesChecked: readonly TrailConditionSource[],
  state: string | null,
  fetchedAt: string
): string {
  const where = state ? `${state}` : 'the AT corridor';
  if (sourcesChecked.length === 0) {
    return 'Live closure/alert sources were unavailable for this pack; verify current closures, detours, and fire orders from NPS, USFS, and ATC before remote or exposed sections.';
  }
  const sources = sourceLabelList(sourcesChecked);
  if (items.length === 0) {
    return `No active official closures or alerts were found for ${where} from ${sources} as of ${fetchedAt}. Conditions change fast — still verify before remote, exposed, or river sections.`;
  }
  return `${items.length} active official trail condition${items.length === 1 ? '' : 's'} for ${where} from ${sources}, fetched ${fetchedAt}. Treat each as current-but-unconfirmed: verify a closure or detour with the managing agency before relying on it.`;
}

/**
 * Build the live trail-conditions slice for a field pack. Never throws — every
 * source failure degrades into a recorded error/skip plus an honest note, so the
 * pack build is never blocked by a flaky upstream.
 */
export async function buildTrailConditionsPack(params: {
  readonly mile?: number | null;
  readonly state?: string | null;
  readonly now?: Date;
  /** Base for the Laravel API (…/api/v1). Defaults to the configured backend. */
  readonly apiBase?: string;
}): Promise<TrailConditionsPack> {
  const now = params.now ?? new Date();
  const fetchedAt = now.toISOString();
  const state = (params.state ?? approximateAtStateForMile(params.mile ?? null)) || null;

  const sourcesChecked: TrailConditionSource[] = [];
  const sourcesSkipped: string[] = [];
  const errors: string[] = [];
  const collected: TrailConditionItem[] = [];

  // ATC Trail Updates — no key required, so it's the always-on baseline.
  try {
    const atc = await fetchAtcTrailUpdatesForState(state, 6);
    collected.push(...atc.map(atcUpdateToItem));
    sourcesChecked.push('atc');
  } catch (error) {
    errors.push(`ATC trail updates failed: ${errorMessage(error)}`);
  }

  // NPS park alerts via the Laravel proxy. scout-web holds no key; if the proxy
  // (or its NPS_API_KEY) isn't configured the request fails and we degrade to
  // ATC-only — recorded as an error, never a crash.
  const apiBase = params.apiBase ?? publicApiBase();
  const parkCodes = [...NPS_PARKS_ALWAYS, ...(state ? NPS_PARKS_BY_STATE[state] ?? [] : [])];
  try {
    collected.push(...(await fetchNpsConditions(parkCodes, apiBase)));
    sourcesChecked.push('nps');
  } catch (error) {
    errors.push(`NPS alerts (proxy) failed: ${errorMessage(error)}`);
  }

  // TODO(usfs): wire USFS forest-order / alert pages (public domain, license-clean
  // per trail-data-provenance.md) for fire bans and road/trailhead closures in
  // national-forest sections. They're per-forest HTML, so they need their own
  // parser; tracked as the third source for this loop.

  const items = rankConditions(collected).slice(0, MAX_CONDITION_ITEMS);

  return {
    items,
    sourcesChecked,
    sourcesSkipped,
    errors,
    fetchedAt,
    note: buildNote(items, sourcesChecked, state, fetchedAt)
  };
}

export const __testing = { ATC_PUBLIC_URL, NPS_PROXY_RESOURCE };
