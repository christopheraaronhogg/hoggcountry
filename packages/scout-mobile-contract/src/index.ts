// Shared TypeScript contract for the Scout mobile field-pack API (v1).
//
// Companion to docs/business/2026-06-16-scout-mobile-api-contract.md. Both
// apps/openclaw-web (server) and mobile/ (client) depend on this package so
// payload shapes cannot drift between them.
//
// This module is dependency-free on purpose: it must be importable from the
// Capacitor mobile runtime, the SvelteKit node app, and plain node:test.

export const SCOUT_MOBILE_PACK_VERSION = 1 as const;
export type ScoutMobilePackVersion = typeof SCOUT_MOBILE_PACK_VERSION;

// --- Envelope ---------------------------------------------------------------

export type SourceReceiptKind = 'official' | 'derived' | 'first_party' | 'live' | 'community';
export type SourceReceiptStatus = 'verified' | 'cached' | 'stale' | 'preview' | 'unavailable';
export type SourceReceiptLicense =
  | 'public'
  | 'cc-by'
  | 'odbl'
  | 'fair-use-facts'
  | 'first-party'
  | 'partner-licensed';
export type Confidence = 'high' | 'medium' | 'low';
export type AnswerConfidence = Confidence | 'draft';

export interface SourceReceipt {
  readonly id: string;
  readonly label: string;
  readonly kind: SourceReceiptKind;
  readonly status: SourceReceiptStatus;
  readonly license: SourceReceiptLicense;
  readonly last_checked: string; // ISO 8601
  readonly citation_url: string | null;
  readonly confidence: Confidence;
  readonly notes: string | null;
}

export interface ScoutMobileMeta {
  readonly pack_version: ScoutMobilePackVersion;
  readonly generated_at: string; // ISO 8601
  readonly valid_until: string;  // ISO 8601, soft TTL
  readonly source_receipts: readonly SourceReceipt[];
  readonly fallback_reason: string | null;
  readonly request_id: string;
}

export interface ScoutMobileEnvelope<TData> {
  readonly data: TData;
  readonly meta: ScoutMobileMeta;
  readonly error: null;
}

// --- §2 Dad journey ---------------------------------------------------------

export interface DadTrailLocation {
  readonly mile: number;
  readonly label: string;
  readonly distance_off_trail_miles: number;
}

export interface DadLatestFix {
  readonly label: string;
  readonly at: string | null;
  readonly is_preview: boolean;
  readonly trail_location: DadTrailLocation | null;
}

export interface DadRecentDispatch {
  readonly title: string;
  readonly published_at: string | null;
  readonly trail_mile: number | null;
}

export interface DadTrailUpdateSummary {
  readonly id: string;
  readonly title: string;
  readonly body: string;
  readonly published_at: string | null;
  readonly location: string | null;
  readonly trail_mile: number | null;
  readonly media_type: string | null;
}

export interface DadJourneySnapshot {
  readonly current_mile: number;
  readonly total_miles: number;
  readonly percent_complete: number;
  readonly miles_remaining: number;
  readonly current_state: string | null;
  readonly days_on_trail: number;
  readonly pace_miles_per_day: number | null;
  readonly start_date: string; // ISO date
  readonly latest_fix: DadLatestFix;
  readonly recent_dispatch: DadRecentDispatch | null;
  readonly recent_trail_update: DadTrailUpdateSummary | null;
}

// --- §3 Trail ahead ---------------------------------------------------------

export type TrailAheadServiceKind =
  | 'shelter'
  | 'water'
  | 'road'
  | 'town'
  | 'summit'
  | 'campsite'
  | 'vista';

export interface TrailAheadMile {
  readonly mile: number;
  readonly elevation_ft: number;
  readonly state: string;
  readonly rockiness_score: number | null;
  readonly difficulty_score: number | null;
}

export interface TrailAheadService {
  readonly id: string;
  readonly kind: TrailAheadServiceKind;
  readonly name: string;
  readonly mile: number;
  readonly distance_miles: number;
  readonly state: string;
  readonly detail: string;
  readonly source_id: string;
  readonly confidence: Confidence;
}

export interface TrailAheadClimb {
  readonly start_mile: number;
  readonly end_mile: number;
  readonly direction: 'climb' | 'descent' | 'mixed';
  readonly grade_percent: number;
  readonly vertical_ft: number;
  readonly state: string;
}

export type TrailDifficultyLabel = 'cruise' | 'steady' | 'hard' | 'severe';

export interface TrailAheadSlice {
  readonly start_mile: number;
  readonly end_mile: number;
  readonly miles: readonly TrailAheadMile[];
  readonly upcoming_services: readonly TrailAheadService[];
  readonly upcoming_climbs: readonly TrailAheadClimb[];
  readonly difficulty_summary: {
    readonly avg_score: number;
    readonly max_score: number;
    readonly label: TrailDifficultyLabel;
  };
  readonly source_receipts: readonly SourceReceipt[];
}

// --- §4 Weather cache -------------------------------------------------------

export interface WeatherForecastPeriod {
  readonly name: string;
  readonly start_time: string | null;
  readonly end_time: string | null;
  readonly temperature: string;
  readonly wind: string;
  readonly short_forecast: string;
  readonly detailed_forecast: string;
}

export interface WeatherAlert {
  readonly event: string;
  readonly severity: string | null;
  readonly certainty: string | null;
  readonly urgency: string | null;
  readonly headline: string;
  readonly area_desc: string | null;
  readonly effective: string | null;
  readonly expires: string | null;
  readonly description: string;
  readonly instruction: string | null;
}

export interface AtcTrailUpdateCacheItem {
  readonly title: string;
  readonly href: string;
  readonly meta: string;
  readonly published_at: string | null;
  readonly modified_at: string | null;
  readonly excerpt: string;
  readonly score: number;
}

export interface WeatherCacheRegion {
  readonly region_id: string;
  readonly label: string;
  readonly bounds: { readonly min_mile: number; readonly max_mile: number };
  readonly forecast: {
    readonly fetched_at: string;
    readonly valid_until: string;
    readonly source: 'nws';
    readonly point_url: string;
    readonly forecast_url: string | null;
    readonly summary: readonly WeatherForecastPeriod[];
  } | null;
  readonly alerts: {
    readonly fetched_at: string;
    readonly source: 'nws';
    readonly alerts_url: string;
    readonly items: readonly WeatherAlert[];
  };
  readonly trail_updates: {
    readonly fetched_at: string;
    readonly source: 'atc';
    readonly items: readonly AtcTrailUpdateCacheItem[];
  };
}

export interface WeatherCacheIndex {
  readonly regions: readonly WeatherCacheRegion[];
  readonly default_authoritative_source: 'nws' | 'atc';
}

// --- §5 AT reference summary ------------------------------------------------

// This mirrors apps/openclaw-web/src/lib/offline-field-pack.ts:
// OfflineAtReferenceSummary, augmented with download metadata for mobile.

export interface AtReferenceDatasetSummary {
  readonly id: string;
  readonly label: string;
  readonly category: string;
  readonly path: string;
  readonly record_count: number;
  readonly source_ids: readonly string[];
  readonly license_statuses: readonly string[];
  readonly confidence: string;
  readonly last_checked: string;
  readonly ai_answer_rule: string | null;
  readonly bundled_payload_size_bytes: number | null;
  readonly download_url: string | null;
}

export interface AtReferenceSummary {
  readonly summary_id: string;
  readonly loaded_at: string;
  readonly available: boolean;
  readonly generated_at: string | null;
  readonly reason: string | null;
  readonly datasets: readonly AtReferenceDatasetSummary[];
  readonly totals: { readonly datasets: number; readonly records: number };
  readonly policies: {
    readonly generated_mile_disclosure: string;
    readonly route_quality_disclosure: string;
    readonly water_disclosure: string;
    readonly live_conditions_disclosure: string;
    readonly blocked_sources_disclosure: string;
    readonly offline_use_disclosure: string;
  };
}

// --- §6 Map pack manifest ---------------------------------------------------

export interface MapPackAsset {
  readonly content_hash: string;
  readonly url: string;
  readonly bytes: number;
  readonly license: SourceReceiptLicense;
  readonly source_id: string;
}

export interface MapPackManifest {
  readonly route: MapPackAsset;
  readonly milepoints: MapPackAsset;
  readonly elevation: MapPackAsset;
  readonly terrain_segments: MapPackAsset;
  readonly waypoint_groups: {
    readonly shelters: MapPackAsset;
    readonly water: MapPackAsset;
    readonly roads: MapPackAsset;
    readonly towns: MapPackAsset;
    readonly summits: MapPackAsset;
    readonly campsites: MapPackAsset;
    readonly vistas: MapPackAsset;
  };
}

// --- §7 Loadout ------------------------------------------------------------

export type LoadoutCategory =
  | 'pack'
  | 'shelter'
  | 'sleep'
  | 'sleepClothing'
  | 'insulation'
  | 'kitchen'
  | 'electronics'
  | 'worn'
  | 'traction'
  | 'water'
  | 'safety'
  | 'other';

export interface LoadoutItem {
  readonly id: string;
  readonly name: string;
  readonly category: LoadoutCategory;
  readonly weight_oz: number;
  readonly quantity: number;
  readonly worn: boolean;
  readonly consumable: boolean;
  readonly notes: string;
  readonly link: string | null;
  readonly last_updated: string;
}

export interface WeatherChangeHint {
  readonly label: string;
  readonly detail: string;
  readonly trigger: string; // e.g. 'low_below_freezing'
  readonly source_id: string;
}

export interface LoadoutSnapshot {
  readonly base_weight_oz: number;
  readonly worn_weight_oz: number;
  readonly consumable_weight_oz: number;
  readonly total_weight_oz: number;
  readonly item_count: number;
  readonly items: readonly LoadoutItem[];
  readonly missing_essentials: readonly string[];
  readonly weather_change_recommendations: readonly WeatherChangeHint[];
  readonly source_receipts: readonly SourceReceipt[];
}

// --- §8 Hiker + itinerary --------------------------------------------------

export type SharePrivacyScope = 'private' | 'trusted' | 'public';
export type SharePrivacyLocationMode = 'exact' | 'coarse';

export interface HikerProfileSnapshot {
  readonly user_id: string;
  readonly trail_name: string | null;
  readonly current_mile: number | null;
  readonly start_date: string | null;
  readonly pace_target_miles_per_day: number | null;
  readonly water_capacity_liters: number;
  readonly shelter_preference: 'tent-first' | 'shelter-first' | 'mixed';
  readonly preferences: {
    readonly privacy_share_scope: SharePrivacyScope;
    readonly privacy_location_mode: SharePrivacyLocationMode;
    readonly visibility_delay_minutes: number;
  };
}

export interface ItineraryDayContract {
  readonly day_label: string;
  readonly date_label: string;
  readonly status: 'today' | 'planned' | 'town' | 'recovery';
  readonly destination: string;
  readonly mileage: number;
  readonly elevation_gain: number;
  readonly weather: string;
  readonly note: string;
}

export interface ItineraryWindow {
  readonly days: readonly ItineraryDayContract[];
  readonly confidence: AnswerConfidence;
  readonly must_verify: readonly string[];
  readonly source_receipts: readonly SourceReceipt[];
}

export interface CheckInRecordContract {
  readonly id: string;
  readonly timestamp: string;
  readonly location: string;
  readonly mile: number;
  readonly status: 'safe' | 'delayed' | 'need-help';
  readonly note: string;
}

// --- Field packs ----------------------------------------------------------

export interface SourceReceiptCatalog {
  readonly receipts: readonly SourceReceipt[];
  readonly policy_links: {
    readonly provenance: string;
    readonly licensing: string;
  };
}

export interface PublicFieldPack {
  readonly dad: DadJourneySnapshot;
  readonly trail_ahead: TrailAheadSlice;
  readonly reference_loadout: LoadoutSnapshot;
  readonly weather_cache: WeatherCacheIndex;
  readonly at_reference_summary: AtReferenceSummary;
}

export interface AuthenticatedFieldPack extends PublicFieldPack {
  readonly hiker: HikerProfileSnapshot;
  readonly loadout: LoadoutSnapshot;
  readonly itinerary: ItineraryWindow;
  readonly recent_checkins: readonly CheckInRecordContract[];
}

// --- Runtime validation ---------------------------------------------------

// Lightweight structural validators. Goal: catch shape drift in CI and at
// the mobile/server boundary, NOT to be a full schema validator. Returns the
// validated value cast to the contract type or throws with a path-tagged
// reason. No dependencies, no schemas to compile.

export class ScoutMobileContractError extends Error {
  constructor(public readonly path: string, message: string) {
    super(`scout-mobile-contract: ${path}: ${message}`);
  }
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function expect(condition: boolean, path: string, message: string): void {
  if (!condition) {
    throw new ScoutMobileContractError(path, message);
  }
}

function expectString(value: unknown, path: string): string {
  expect(typeof value === 'string', path, 'expected string');
  return value as string;
}

function expectNumber(value: unknown, path: string): number {
  expect(typeof value === 'number' && Number.isFinite(value), path, 'expected finite number');
  return value as number;
}

function expectBoolean(value: unknown, path: string): boolean {
  expect(typeof value === 'boolean', path, 'expected boolean');
  return value as boolean;
}

function expectStringOrNull(value: unknown, path: string): string | null {
  if (value === null) return null;
  return expectString(value, path);
}

function expectArray<T>(value: unknown, path: string, item: (entry: unknown, itemPath: string) => T): readonly T[] {
  expect(Array.isArray(value), path, 'expected array');
  return (value as unknown[]).map((entry, index) => item(entry, `${path}[${index}]`));
}

function expectEnum<T extends string>(value: unknown, path: string, allowed: readonly T[]): T {
  const str = expectString(value, path);
  expect(allowed.includes(str as T), path, `expected one of ${allowed.join('|')}, got '${str}'`);
  return str as T;
}

function validateSourceReceipt(value: unknown, path: string): SourceReceipt {
  expect(isObject(value), path, 'expected object');
  const obj = value as Record<string, unknown>;
  return {
    id: expectString(obj.id, `${path}.id`),
    label: expectString(obj.label, `${path}.label`),
    kind: expectEnum(obj.kind, `${path}.kind`, ['official', 'derived', 'first_party', 'live', 'community'] as const),
    status: expectEnum(obj.status, `${path}.status`, [
      'verified',
      'cached',
      'stale',
      'preview',
      'unavailable'
    ] as const),
    license: expectEnum(obj.license, `${path}.license`, [
      'public',
      'cc-by',
      'odbl',
      'fair-use-facts',
      'first-party',
      'partner-licensed'
    ] as const),
    last_checked: expectString(obj.last_checked, `${path}.last_checked`),
    citation_url: expectStringOrNull(obj.citation_url, `${path}.citation_url`),
    confidence: expectEnum(obj.confidence, `${path}.confidence`, ['high', 'medium', 'low'] as const),
    notes: expectStringOrNull(obj.notes, `${path}.notes`)
  };
}

function validateMeta(value: unknown, path: string): ScoutMobileMeta {
  expect(isObject(value), path, 'expected object');
  const obj = value as Record<string, unknown>;
  expect(
    obj.pack_version === SCOUT_MOBILE_PACK_VERSION,
    `${path}.pack_version`,
    `expected ${SCOUT_MOBILE_PACK_VERSION}, got ${String(obj.pack_version)}`
  );
  return {
    pack_version: SCOUT_MOBILE_PACK_VERSION,
    generated_at: expectString(obj.generated_at, `${path}.generated_at`),
    valid_until: expectString(obj.valid_until, `${path}.valid_until`),
    source_receipts: expectArray(obj.source_receipts, `${path}.source_receipts`, validateSourceReceipt),
    fallback_reason: expectStringOrNull(obj.fallback_reason, `${path}.fallback_reason`),
    request_id: expectString(obj.request_id, `${path}.request_id`)
  };
}

function validateDadJourneySnapshot(value: unknown, path: string): DadJourneySnapshot {
  expect(isObject(value), path, 'expected object');
  const obj = value as Record<string, unknown>;
  const latestFixRaw = obj.latest_fix;
  expect(isObject(latestFixRaw), `${path}.latest_fix`, 'expected object');
  const latestFix = latestFixRaw as Record<string, unknown>;
  const trailLocationRaw = latestFix.trail_location;
  const trailLocation = trailLocationRaw === null
    ? null
    : (() => {
        expect(isObject(trailLocationRaw), `${path}.latest_fix.trail_location`, 'expected object or null');
        const loc = trailLocationRaw as Record<string, unknown>;
        return {
          mile: expectNumber(loc.mile, `${path}.latest_fix.trail_location.mile`),
          label: expectString(loc.label, `${path}.latest_fix.trail_location.label`),
          distance_off_trail_miles: expectNumber(
            loc.distance_off_trail_miles,
            `${path}.latest_fix.trail_location.distance_off_trail_miles`
          )
        };
      })();

  return {
    current_mile: expectNumber(obj.current_mile, `${path}.current_mile`),
    total_miles: expectNumber(obj.total_miles, `${path}.total_miles`),
    percent_complete: expectNumber(obj.percent_complete, `${path}.percent_complete`),
    miles_remaining: expectNumber(obj.miles_remaining, `${path}.miles_remaining`),
    current_state: expectStringOrNull(obj.current_state, `${path}.current_state`),
    days_on_trail: expectNumber(obj.days_on_trail, `${path}.days_on_trail`),
    pace_miles_per_day:
      obj.pace_miles_per_day === null ? null : expectNumber(obj.pace_miles_per_day, `${path}.pace_miles_per_day`),
    start_date: expectString(obj.start_date, `${path}.start_date`),
    latest_fix: {
      label: expectString(latestFix.label, `${path}.latest_fix.label`),
      at: expectStringOrNull(latestFix.at, `${path}.latest_fix.at`),
      is_preview: expectBoolean(latestFix.is_preview, `${path}.latest_fix.is_preview`),
      trail_location: trailLocation
    },
    recent_dispatch:
      obj.recent_dispatch === null
        ? null
        : (() => {
            expect(isObject(obj.recent_dispatch), `${path}.recent_dispatch`, 'expected object or null');
            const dispatch = obj.recent_dispatch as Record<string, unknown>;
            return {
              title: expectString(dispatch.title, `${path}.recent_dispatch.title`),
              published_at: expectStringOrNull(dispatch.published_at, `${path}.recent_dispatch.published_at`),
              trail_mile:
                dispatch.trail_mile === null
                  ? null
                  : expectNumber(dispatch.trail_mile, `${path}.recent_dispatch.trail_mile`)
            };
          })(),
    recent_trail_update:
      obj.recent_trail_update === null
        ? null
        : (() => {
            expect(isObject(obj.recent_trail_update), `${path}.recent_trail_update`, 'expected object or null');
            const update = obj.recent_trail_update as Record<string, unknown>;
            return {
              id: expectString(update.id, `${path}.recent_trail_update.id`),
              title: expectString(update.title, `${path}.recent_trail_update.title`),
              body: expectString(update.body, `${path}.recent_trail_update.body`),
              published_at: expectStringOrNull(update.published_at, `${path}.recent_trail_update.published_at`),
              location: expectStringOrNull(update.location, `${path}.recent_trail_update.location`),
              trail_mile:
                update.trail_mile === null
                  ? null
                  : expectNumber(update.trail_mile, `${path}.recent_trail_update.trail_mile`),
              media_type: expectStringOrNull(update.media_type, `${path}.recent_trail_update.media_type`)
            };
          })()
  };
}

function validateLoadoutItem(value: unknown, path: string): LoadoutItem {
  expect(isObject(value), path, 'expected object');
  const obj = value as Record<string, unknown>;
  return {
    id: expectString(obj.id, `${path}.id`),
    name: expectString(obj.name, `${path}.name`),
    category: expectEnum(obj.category, `${path}.category`, [
      'pack',
      'shelter',
      'sleep',
      'sleepClothing',
      'insulation',
      'kitchen',
      'electronics',
      'worn',
      'traction',
      'water',
      'safety',
      'other'
    ] as const),
    weight_oz: expectNumber(obj.weight_oz, `${path}.weight_oz`),
    quantity: expectNumber(obj.quantity, `${path}.quantity`),
    worn: expectBoolean(obj.worn, `${path}.worn`),
    consumable: expectBoolean(obj.consumable, `${path}.consumable`),
    notes: expectString(obj.notes, `${path}.notes`),
    link: expectStringOrNull(obj.link, `${path}.link`),
    last_updated: expectString(obj.last_updated, `${path}.last_updated`)
  };
}

function validateLoadoutSnapshot(value: unknown, path: string): LoadoutSnapshot {
  expect(isObject(value), path, 'expected object');
  const obj = value as Record<string, unknown>;
  return {
    base_weight_oz: expectNumber(obj.base_weight_oz, `${path}.base_weight_oz`),
    worn_weight_oz: expectNumber(obj.worn_weight_oz, `${path}.worn_weight_oz`),
    consumable_weight_oz: expectNumber(obj.consumable_weight_oz, `${path}.consumable_weight_oz`),
    total_weight_oz: expectNumber(obj.total_weight_oz, `${path}.total_weight_oz`),
    item_count: expectNumber(obj.item_count, `${path}.item_count`),
    items: expectArray(obj.items, `${path}.items`, validateLoadoutItem),
    missing_essentials: expectArray(obj.missing_essentials, `${path}.missing_essentials`, (entry, itemPath) =>
      expectString(entry, itemPath)
    ),
    weather_change_recommendations: expectArray(
      obj.weather_change_recommendations,
      `${path}.weather_change_recommendations`,
      (entry, itemPath) => {
        expect(isObject(entry), itemPath, 'expected object');
        const hint = entry as Record<string, unknown>;
        return {
          label: expectString(hint.label, `${itemPath}.label`),
          detail: expectString(hint.detail, `${itemPath}.detail`),
          trigger: expectString(hint.trigger, `${itemPath}.trigger`),
          source_id: expectString(hint.source_id, `${itemPath}.source_id`)
        } satisfies WeatherChangeHint;
      }
    ),
    source_receipts: expectArray(obj.source_receipts, `${path}.source_receipts`, validateSourceReceipt)
  };
}

function validateTrailAheadSlice(value: unknown, path: string): TrailAheadSlice {
  expect(isObject(value), path, 'expected object');
  const obj = value as Record<string, unknown>;
  const summaryRaw = obj.difficulty_summary;
  expect(isObject(summaryRaw), `${path}.difficulty_summary`, 'expected object');
  const summary = summaryRaw as Record<string, unknown>;
  return {
    start_mile: expectNumber(obj.start_mile, `${path}.start_mile`),
    end_mile: expectNumber(obj.end_mile, `${path}.end_mile`),
    miles: expectArray(obj.miles, `${path}.miles`, (entry, itemPath) => {
      expect(isObject(entry), itemPath, 'expected object');
      const mile = entry as Record<string, unknown>;
      return {
        mile: expectNumber(mile.mile, `${itemPath}.mile`),
        elevation_ft: expectNumber(mile.elevation_ft, `${itemPath}.elevation_ft`),
        state: expectString(mile.state, `${itemPath}.state`),
        rockiness_score:
          mile.rockiness_score === null
            ? null
            : expectNumber(mile.rockiness_score, `${itemPath}.rockiness_score`),
        difficulty_score:
          mile.difficulty_score === null
            ? null
            : expectNumber(mile.difficulty_score, `${itemPath}.difficulty_score`)
      } satisfies TrailAheadMile;
    }),
    upcoming_services: expectArray(obj.upcoming_services, `${path}.upcoming_services`, (entry, itemPath) => {
      expect(isObject(entry), itemPath, 'expected object');
      const service = entry as Record<string, unknown>;
      return {
        id: expectString(service.id, `${itemPath}.id`),
        kind: expectEnum(service.kind, `${itemPath}.kind`, [
          'shelter',
          'water',
          'road',
          'town',
          'summit',
          'campsite',
          'vista'
        ] as const),
        name: expectString(service.name, `${itemPath}.name`),
        mile: expectNumber(service.mile, `${itemPath}.mile`),
        distance_miles: expectNumber(service.distance_miles, `${itemPath}.distance_miles`),
        state: expectString(service.state, `${itemPath}.state`),
        detail: expectString(service.detail, `${itemPath}.detail`),
        source_id: expectString(service.source_id, `${itemPath}.source_id`),
        confidence: expectEnum(service.confidence, `${itemPath}.confidence`, ['high', 'medium', 'low'] as const)
      } satisfies TrailAheadService;
    }),
    upcoming_climbs: expectArray(obj.upcoming_climbs, `${path}.upcoming_climbs`, (entry, itemPath) => {
      expect(isObject(entry), itemPath, 'expected object');
      const climb = entry as Record<string, unknown>;
      return {
        start_mile: expectNumber(climb.start_mile, `${itemPath}.start_mile`),
        end_mile: expectNumber(climb.end_mile, `${itemPath}.end_mile`),
        direction: expectEnum(climb.direction, `${itemPath}.direction`, [
          'climb',
          'descent',
          'mixed'
        ] as const),
        grade_percent: expectNumber(climb.grade_percent, `${itemPath}.grade_percent`),
        vertical_ft: expectNumber(climb.vertical_ft, `${itemPath}.vertical_ft`),
        state: expectString(climb.state, `${itemPath}.state`)
      } satisfies TrailAheadClimb;
    }),
    difficulty_summary: {
      avg_score: expectNumber(summary.avg_score, `${path}.difficulty_summary.avg_score`),
      max_score: expectNumber(summary.max_score, `${path}.difficulty_summary.max_score`),
      label: expectEnum(summary.label, `${path}.difficulty_summary.label`, [
        'cruise',
        'steady',
        'hard',
        'severe'
      ] as const)
    },
    source_receipts: expectArray(obj.source_receipts, `${path}.source_receipts`, validateSourceReceipt)
  };
}

function validateWeatherCacheIndex(value: unknown, path: string): WeatherCacheIndex {
  expect(isObject(value), path, 'expected object');
  const obj = value as Record<string, unknown>;
  return {
    regions: expectArray(obj.regions, `${path}.regions`, (entry, itemPath) => {
      expect(isObject(entry), itemPath, 'expected object');
      const region = entry as Record<string, unknown>;
      const boundsRaw = region.bounds;
      expect(isObject(boundsRaw), `${itemPath}.bounds`, 'expected object');
      const bounds = boundsRaw as Record<string, unknown>;
      const alertsRaw = region.alerts;
      expect(isObject(alertsRaw), `${itemPath}.alerts`, 'expected object');
      const alerts = alertsRaw as Record<string, unknown>;
      const trailUpdatesRaw = region.trail_updates;
      expect(isObject(trailUpdatesRaw), `${itemPath}.trail_updates`, 'expected object');
      const trailUpdates = trailUpdatesRaw as Record<string, unknown>;
      const forecastRaw = region.forecast;
      const forecast = forecastRaw === null
        ? null
        : (() => {
            expect(isObject(forecastRaw), `${itemPath}.forecast`, 'expected object or null');
            const f = forecastRaw as Record<string, unknown>;
            return {
              fetched_at: expectString(f.fetched_at, `${itemPath}.forecast.fetched_at`),
              valid_until: expectString(f.valid_until, `${itemPath}.forecast.valid_until`),
              source: expectEnum(f.source, `${itemPath}.forecast.source`, ['nws'] as const),
              point_url: expectString(f.point_url, `${itemPath}.forecast.point_url`),
              forecast_url: expectStringOrNull(f.forecast_url, `${itemPath}.forecast.forecast_url`),
              summary: expectArray(f.summary, `${itemPath}.forecast.summary`, (p, pPath) => {
                expect(isObject(p), pPath, 'expected object');
                const period = p as Record<string, unknown>;
                return {
                  name: expectString(period.name, `${pPath}.name`),
                  start_time: expectStringOrNull(period.start_time, `${pPath}.start_time`),
                  end_time: expectStringOrNull(period.end_time, `${pPath}.end_time`),
                  temperature: expectString(period.temperature, `${pPath}.temperature`),
                  wind: expectString(period.wind, `${pPath}.wind`),
                  short_forecast: expectString(period.short_forecast, `${pPath}.short_forecast`),
                  detailed_forecast: expectString(period.detailed_forecast, `${pPath}.detailed_forecast`)
                } satisfies WeatherForecastPeriod;
              })
            };
          })();
      return {
        region_id: expectString(region.region_id, `${itemPath}.region_id`),
        label: expectString(region.label, `${itemPath}.label`),
        bounds: {
          min_mile: expectNumber(bounds.min_mile, `${itemPath}.bounds.min_mile`),
          max_mile: expectNumber(bounds.max_mile, `${itemPath}.bounds.max_mile`)
        },
        forecast,
        alerts: {
          fetched_at: expectString(alerts.fetched_at, `${itemPath}.alerts.fetched_at`),
          source: expectEnum(alerts.source, `${itemPath}.alerts.source`, ['nws'] as const),
          alerts_url: expectString(alerts.alerts_url, `${itemPath}.alerts.alerts_url`),
          items: expectArray(alerts.items, `${itemPath}.alerts.items`, (a, aPath) => {
            expect(isObject(a), aPath, 'expected object');
            const alert = a as Record<string, unknown>;
            return {
              event: expectString(alert.event, `${aPath}.event`),
              severity: expectStringOrNull(alert.severity, `${aPath}.severity`),
              certainty: expectStringOrNull(alert.certainty, `${aPath}.certainty`),
              urgency: expectStringOrNull(alert.urgency, `${aPath}.urgency`),
              headline: expectString(alert.headline, `${aPath}.headline`),
              area_desc: expectStringOrNull(alert.area_desc, `${aPath}.area_desc`),
              effective: expectStringOrNull(alert.effective, `${aPath}.effective`),
              expires: expectStringOrNull(alert.expires, `${aPath}.expires`),
              description: expectString(alert.description, `${aPath}.description`),
              instruction: expectStringOrNull(alert.instruction, `${aPath}.instruction`)
            } satisfies WeatherAlert;
          })
        },
        trail_updates: {
          fetched_at: expectString(trailUpdates.fetched_at, `${itemPath}.trail_updates.fetched_at`),
          source: expectEnum(trailUpdates.source, `${itemPath}.trail_updates.source`, ['atc'] as const),
          items: expectArray(trailUpdates.items, `${itemPath}.trail_updates.items`, (u, uPath) => {
            expect(isObject(u), uPath, 'expected object');
            const update = u as Record<string, unknown>;
            return {
              title: expectString(update.title, `${uPath}.title`),
              href: expectString(update.href, `${uPath}.href`),
              meta: expectString(update.meta, `${uPath}.meta`),
              published_at: expectStringOrNull(update.published_at, `${uPath}.published_at`),
              modified_at: expectStringOrNull(update.modified_at, `${uPath}.modified_at`),
              excerpt: expectString(update.excerpt, `${uPath}.excerpt`),
              score: expectNumber(update.score, `${uPath}.score`)
            } satisfies AtcTrailUpdateCacheItem;
          })
        }
      } satisfies WeatherCacheRegion;
    }),
    default_authoritative_source: expectEnum(
      obj.default_authoritative_source,
      `${path}.default_authoritative_source`,
      ['nws', 'atc'] as const
    )
  };
}

function validateAtReferenceSummary(value: unknown, path: string): AtReferenceSummary {
  expect(isObject(value), path, 'expected object');
  const obj = value as Record<string, unknown>;
  const totalsRaw = obj.totals;
  expect(isObject(totalsRaw), `${path}.totals`, 'expected object');
  const totals = totalsRaw as Record<string, unknown>;
  const policiesRaw = obj.policies;
  expect(isObject(policiesRaw), `${path}.policies`, 'expected object');
  const policies = policiesRaw as Record<string, unknown>;
  return {
    summary_id: expectString(obj.summary_id, `${path}.summary_id`),
    loaded_at: expectString(obj.loaded_at, `${path}.loaded_at`),
    available: expectBoolean(obj.available, `${path}.available`),
    generated_at: expectStringOrNull(obj.generated_at, `${path}.generated_at`),
    reason: expectStringOrNull(obj.reason, `${path}.reason`),
    datasets: expectArray(obj.datasets, `${path}.datasets`, (entry, itemPath) => {
      expect(isObject(entry), itemPath, 'expected object');
      const ds = entry as Record<string, unknown>;
      return {
        id: expectString(ds.id, `${itemPath}.id`),
        label: expectString(ds.label, `${itemPath}.label`),
        category: expectString(ds.category, `${itemPath}.category`),
        path: expectString(ds.path, `${itemPath}.path`),
        record_count: expectNumber(ds.record_count, `${itemPath}.record_count`),
        source_ids: expectArray(ds.source_ids, `${itemPath}.source_ids`, (e, ep) => expectString(e, ep)),
        license_statuses: expectArray(ds.license_statuses, `${itemPath}.license_statuses`, (e, ep) =>
          expectString(e, ep)
        ),
        confidence: expectString(ds.confidence, `${itemPath}.confidence`),
        last_checked: expectString(ds.last_checked, `${itemPath}.last_checked`),
        ai_answer_rule: expectStringOrNull(ds.ai_answer_rule, `${itemPath}.ai_answer_rule`),
        bundled_payload_size_bytes:
          ds.bundled_payload_size_bytes === null
            ? null
            : expectNumber(ds.bundled_payload_size_bytes, `${itemPath}.bundled_payload_size_bytes`),
        download_url: expectStringOrNull(ds.download_url, `${itemPath}.download_url`)
      } satisfies AtReferenceDatasetSummary;
    }),
    totals: {
      datasets: expectNumber(totals.datasets, `${path}.totals.datasets`),
      records: expectNumber(totals.records, `${path}.totals.records`)
    },
    policies: {
      generated_mile_disclosure: expectString(
        policies.generated_mile_disclosure,
        `${path}.policies.generated_mile_disclosure`
      ),
      route_quality_disclosure: expectString(
        policies.route_quality_disclosure,
        `${path}.policies.route_quality_disclosure`
      ),
      water_disclosure: expectString(policies.water_disclosure, `${path}.policies.water_disclosure`),
      live_conditions_disclosure: expectString(
        policies.live_conditions_disclosure,
        `${path}.policies.live_conditions_disclosure`
      ),
      blocked_sources_disclosure: expectString(
        policies.blocked_sources_disclosure,
        `${path}.policies.blocked_sources_disclosure`
      ),
      offline_use_disclosure: expectString(
        policies.offline_use_disclosure,
        `${path}.policies.offline_use_disclosure`
      )
    }
  };
}

export function validatePublicFieldPackEnvelope(
  value: unknown,
  rootPath = 'envelope'
): ScoutMobileEnvelope<PublicFieldPack> {
  expect(isObject(value), rootPath, 'expected object');
  const obj = value as Record<string, unknown>;
  expect(obj.error === null, `${rootPath}.error`, 'expected null');
  const meta = validateMeta(obj.meta, `${rootPath}.meta`);
  expect(isObject(obj.data), `${rootPath}.data`, 'expected object');
  const data = obj.data as Record<string, unknown>;
  return {
    data: {
      dad: validateDadJourneySnapshot(data.dad, `${rootPath}.data.dad`),
      trail_ahead: validateTrailAheadSlice(data.trail_ahead, `${rootPath}.data.trail_ahead`),
      reference_loadout: validateLoadoutSnapshot(data.reference_loadout, `${rootPath}.data.reference_loadout`),
      weather_cache: validateWeatherCacheIndex(data.weather_cache, `${rootPath}.data.weather_cache`),
      at_reference_summary: validateAtReferenceSummary(
        data.at_reference_summary,
        `${rootPath}.data.at_reference_summary`
      )
    },
    meta,
    error: null
  };
}

export function buildScoutMobileMeta(input: {
  generatedAt: string;
  validUntil: string;
  requestId: string;
  sourceReceipts: readonly SourceReceipt[];
  fallbackReason?: string | null;
}): ScoutMobileMeta {
  return {
    pack_version: SCOUT_MOBILE_PACK_VERSION,
    generated_at: input.generatedAt,
    valid_until: input.validUntil,
    source_receipts: input.sourceReceipts,
    fallback_reason: input.fallbackReason ?? null,
    request_id: input.requestId
  };
}
