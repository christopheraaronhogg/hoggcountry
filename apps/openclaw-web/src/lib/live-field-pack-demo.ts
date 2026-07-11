type Direction = 'NOBO' | 'SOBO';

export interface LiveDemoWaypoint {
  readonly name: string;
  readonly mile: number;
  readonly milesAhead: number;
  readonly note: string | null;
  readonly reliability?: 'reliable' | 'seasonal' | 'thin';
}

export interface LiveDemoWeather {
  readonly summary: string;
  readonly highF: number;
  readonly lowF: number;
  readonly windMph: number;
  readonly sourceLabel: string;
  readonly riskNote: string | null;
}

export type LiveFieldPackSummary =
  | {
      readonly status: 'unavailable';
      readonly message: string;
    }
  | {
      readonly status: 'ready';
      readonly trailName: string;
      readonly currentMile: number;
      readonly direction: Direction;
      readonly dayNumber: number | null;
      readonly nextWater: LiveDemoWaypoint | null;
      readonly nextShelter: LiveDemoWaypoint | null;
      readonly weather: LiveDemoWeather | null;
      readonly generatedAt: string;
      readonly validUntil: string | null;
      readonly packAgeLabel: string;
      readonly fixAgeLabel: string | null;
      readonly isExpired: boolean;
      readonly isPreview: boolean;
      readonly notice: string;
    };

const UNAVAILABLE: LiveFieldPackSummary = {
  status: 'unavailable',
  message: 'Dad’s live Scout field pack is unavailable right now.'
};

function record(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null;
}

function finiteNumber(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function text(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function dateMs(value: unknown): number | null {
  const raw = text(value);
  if (!raw) return null;
  const parsed = Date.parse(raw);
  return Number.isFinite(parsed) ? parsed : null;
}

export function formatLiveAge(timestamp: string, nowMs = Date.now()): string {
  const parsed = dateMs(timestamp);
  if (parsed === null) return 'age unknown';
  const minutes = Math.max(0, Math.floor((nowMs - parsed) / 60_000));
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes} min old`;
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  if (hours < 24) {
    return remainingMinutes === 0
      ? `${hours} hr old`
      : `${hours} hr ${remainingMinutes} min old`;
  }
  const days = Math.floor(hours / 24);
  return `${days} ${days === 1 ? 'day' : 'days'} old`;
}

function nextWaypoint(
  value: unknown,
  currentMile: number,
  direction: Direction,
  includeReliability: boolean
): LiveDemoWaypoint | null {
  if (!Array.isArray(value)) return null;

  const candidates = value.flatMap((item): LiveDemoWaypoint[] => {
    const waypoint = record(item);
    if (!waypoint) return [];
    const name = text(waypoint.name);
    const mile = finiteNumber(waypoint.mile);
    if (!name || mile === null) return [];
    const signedDistance = direction === 'SOBO' ? currentMile - mile : mile - currentMile;
    if (signedDistance < -0.05) return [];
    const reliability = waypoint.reliability;
    return [{
      name,
      mile,
      milesAhead: Math.round(Math.max(0, signedDistance) * 10) / 10,
      note: text(waypoint.note),
      ...(includeReliability && (reliability === 'reliable' || reliability === 'seasonal' || reliability === 'thin')
        ? { reliability }
        : {})
    }];
  });

  return candidates.sort((a, b) => a.milesAhead - b.milesAhead)[0] ?? null;
}

function weatherSummary(value: unknown): LiveDemoWeather | null {
  const weather = record(value);
  if (!weather) return null;
  const summary = text(weather.summary);
  const highF = finiteNumber(weather.highF);
  const lowF = finiteNumber(weather.lowF);
  const windMph = finiteNumber(weather.windMph);
  const sourceLabel = text(weather.sourceLabel);
  if (!summary || highF === null || lowF === null || windMph === null || !sourceLabel) return null;
  return {
    summary,
    highF,
    lowF,
    windMph,
    sourceLabel,
    riskNote: text(weather.riskNote)
  };
}

/**
 * Converts the public mobile bootstrap into the intentionally small view model
 * used by /scout. Keep this defensive: the public demo must fail closed rather
 * than presenting stale example values as Dad's live state.
 */
export function summarizeLiveFieldPack(payload: unknown, nowMs = Date.now()): LiveFieldPackSummary {
  const root = record(payload);
  const data = record(root?.data);
  const contextPack = record(data?.context_pack);
  const hiker = record(contextPack?.hiker);
  const meta = record(root?.meta);
  const dad = record(data?.dad);

  const currentMile = finiteNumber(hiker?.currentMile);
  const generatedAt = text(meta?.generated_at) ?? text(contextPack?.generatedAt);
  const generatedAtMs = dateMs(generatedAt);
  if (currentMile === null || !generatedAt || generatedAtMs === null) return UNAVAILABLE;

  const direction: Direction = hiker?.direction === 'SOBO' ? 'SOBO' : 'NOBO';
  const validUntil = text(meta?.valid_until);
  const validUntilMs = dateMs(validUntil);
  const latestFixAt = text(dad?.latestFixAt);
  const dayNumber = finiteNumber(hiker?.dayNumber);

  return {
    status: 'ready',
    trailName: text(hiker?.trailName) ?? 'Hogg',
    currentMile,
    direction,
    dayNumber,
    nextWater: nextWaypoint(contextPack?.water, currentMile, direction, true),
    nextShelter: nextWaypoint(contextPack?.shelters, currentMile, direction, false),
    weather: weatherSummary(contextPack?.weather),
    generatedAt,
    validUntil,
    packAgeLabel: formatLiveAge(generatedAt, nowMs),
    fixAgeLabel: latestFixAt && dateMs(latestFixAt) !== null ? formatLiveAge(latestFixAt, nowMs) : null,
    isExpired: validUntilMs !== null ? validUntilMs <= nowMs : true,
    isPreview: dad?.latestFixIsPreview === true,
    notice: text(data?.pilot_notice) ?? 'Verify live conditions before safety-critical decisions.'
  };
}
