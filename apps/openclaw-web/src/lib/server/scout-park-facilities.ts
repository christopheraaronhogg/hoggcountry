import { scoutBackendApiBase } from '$lib/server/public-api';
import { npsParkCodesForState, npsParkLabel } from '$lib/server/scout-trail-conditions';

/**
 * NPS park-facilities loop: visitor centers and developed campgrounds for the
 * National Park units the AT crosses (GRSM, Shenandoah, Harpers Ferry NHP, etc.).
 *
 * Honest framing for thru-hikers: these are NOT the shelter/designated-site
 * system thru-hikers normally use. They're **info & overnight options** for the
 * regulated park sections — visitor centers (Harpers Ferry ATC HQ, Shenandoah
 * waysides for resupply/permits/info) and developed campgrounds (a legal bail-out
 * or zero-day option). Static-ish, so fetched through Codex's Laravel NPS proxy
 * (`/api/v1/nps/{visitorcenters,campgrounds}`) and cached for hours. The key
 * lives only in Laravel; scout-web holds none and degrades to empty if the proxy
 * isn't configured. NPS API content is public/attributed (trail-data-provenance §2).
 */

export type ParkFacilityKind = 'visitor-center' | 'campground';

export interface ParkFacility {
  readonly kind: ParkFacilityKind;
  readonly name: string;
  readonly parkLabel: string;
  readonly summary: string;
  readonly url: string | null;
  readonly reservationUrl: string | null;
  readonly lat: number | null;
  readonly lon: number | null;
}

export interface ParkFacilitiesPack {
  readonly items: readonly ParkFacility[];
  readonly parks: readonly string[];
  readonly fetchedAt: string;
  readonly note: string;
}

const FACILITY_CACHE_MS = 12 * 60 * 60 * 1000; // facilities are static — cache hard
const FACILITY_TIMEOUT_MS = 7000;
const MAX_FACILITIES = 10;

interface NpsFacilityRow {
  readonly name?: unknown;
  readonly description?: unknown;
  readonly url?: unknown;
  readonly reservationUrl?: unknown;
  readonly latitude?: unknown;
  readonly longitude?: unknown;
  readonly parkCode?: unknown;
}
interface NpsProxyEnvelope {
  readonly data?: { readonly payload?: { readonly data?: ReadonlyArray<NpsFacilityRow> } };
}

const cache = new Map<string, { readonly ts: number; readonly items: ParkFacility[] }>();

/** Test-only: clear the facilities cache so suites don't cross-contaminate. */
export function __resetParkFacilitiesCacheForTests(): void {
  cache.clear();
}

function text(value: unknown): string {
  return typeof value === 'string' ? value.replace(/\s+/gu, ' ').trim() : '';
}
function clip(value: string, maxLength: number): string {
  return value.length <= maxLength ? value : `${value.slice(0, maxLength - 1).trimEnd()}…`;
}
function num(value: unknown): number | null {
  const parsed = typeof value === 'number' ? value : Number.parseFloat(text(value));
  return Number.isFinite(parsed) ? parsed : null;
}
function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'unknown error';
}

async function fetchJsonWithTimeout(url: string): Promise<unknown> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), FACILITY_TIMEOUT_MS);
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

function normalizeFacility(kind: ParkFacilityKind, row: NpsFacilityRow): ParkFacility | null {
  const name = text(row.name);
  if (!name) return null;
  const parkCode = text(row.parkCode);
  return {
    kind,
    name,
    parkLabel: parkCode ? npsParkLabel(parkCode) : 'National Park Service',
    summary: clip(text(row.description), 360),
    url: text(row.url) || null,
    reservationUrl: text(row.reservationUrl) || null,
    lat: num(row.latitude),
    lon: num(row.longitude)
  };
}

async function fetchFacility(
  kind: ParkFacilityKind,
  resource: string,
  parkCodes: readonly string[],
  apiBase: string
): Promise<ParkFacility[]> {
  const key = `${resource}:${parkCodes.join(',')}`;
  const cached = cache.get(key);
  if (cached && Date.now() - cached.ts < FACILITY_CACHE_MS) return cached.items;

  const url = `${apiBase.replace(/\/+$/u, '')}/nps/${resource}?parkCode=${encodeURIComponent(parkCodes.join(','))}&limit=30`;
  const envelope = (await fetchJsonWithTimeout(url)) as NpsProxyEnvelope;
  const items = (envelope.data?.payload?.data ?? [])
    .map((row) => normalizeFacility(kind, row))
    .filter((item): item is ParkFacility => item !== null);

  cache.set(key, { ts: Date.now(), items });
  return items;
}

function buildNote(items: readonly ParkFacility[], parks: readonly string[], fetchedAt: string): string {
  if (!parks.length) return '';
  const where = parks.join(', ');
  if (!items.length) {
    return `No NPS visitor centers or developed campgrounds were returned for ${where} as of ${fetchedAt}; check the park site for current hours and reservations.`;
  }
  return `NPS visitor centers and developed campgrounds for ${where} (info, permits, resupply, and legal overnight/bail-out options — NOT the thru-hiker shelter system), fetched ${fetchedAt}. Confirm current hours, fees, and reservations before relying on them.`;
}

/**
 * Build the park-facilities slice for a field pack. Only does work in states the
 * AT shares with a developed NPS unit; never throws (a proxy failure degrades to
 * an empty slice).
 */
export async function buildParkFacilitiesPack(params: {
  readonly state: string | null;
  readonly now?: Date;
  readonly apiBase?: string;
}): Promise<ParkFacilitiesPack> {
  const now = params.now ?? new Date();
  const fetchedAt = now.toISOString();
  // Only developed units (drop `appa` — the trail unit has no facilities of its own).
  const parkCodes = npsParkCodesForState(params.state, true);
  if (!parkCodes.length) {
    return { items: [], parks: [], fetchedAt, note: '' };
  }

  const apiBase = params.apiBase ?? scoutBackendApiBase();
  const parks = parkCodes.map(npsParkLabel);
  const collected: ParkFacility[] = [];
  try {
    const [centers, campgrounds] = await Promise.all([
      fetchFacility('visitor-center', 'visitorcenters', parkCodes, apiBase),
      fetchFacility('campground', 'campgrounds', parkCodes, apiBase)
    ]);
    collected.push(...centers, ...campgrounds);
  } catch (error) {
    return {
      items: [],
      parks,
      fetchedAt,
      note: `NPS park facilities were unavailable (${errorMessage(error)}); check the park site for visitor-center hours and campground reservations.`
    };
  }

  // Visitor centers first (info/permits), then campgrounds; cap for prompt budget.
  const items = collected
    .sort((a, b) => (a.kind === b.kind ? 0 : a.kind === 'visitor-center' ? -1 : 1))
    .slice(0, MAX_FACILITIES);

  return { items, parks, fetchedAt, note: buildNote(items, parks, fetchedAt) };
}
