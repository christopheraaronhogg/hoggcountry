export const SCOUT_DATE_TIMEZONE = 'America/New_York';

export interface CurrentDatetimeDetails {
  readonly fetchedAt: string;
  readonly timezone: string;
  readonly today: { readonly iso: string; readonly weekday: string; readonly label: string };
  readonly tomorrow: { readonly iso: string; readonly weekday: string; readonly label: string };
  readonly authority: 'server-clock';
}

function datePartsInTimezone(value: Date, timezone: string): { iso: string; weekday: string; label: string } {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    weekday: 'long',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).formatToParts(value);
  const part = (type: string) => parts.find((item) => item.type === type)?.value ?? '';
  const iso = `${part('year')}-${part('month')}-${part('day')}`;
  const weekday = part('weekday');
  return {
    iso,
    weekday,
    label: `${weekday}, ${iso}`
  };
}

export function buildCurrentDatetimeDetails(now = new Date(), timezone = SCOUT_DATE_TIMEZONE): CurrentDatetimeDetails {
  const today = datePartsInTimezone(now, timezone);
  const tomorrowAnchor = new Date(Date.parse(`${today.iso}T12:00:00Z`) + 24 * 60 * 60 * 1000);
  const tomorrow = datePartsInTimezone(tomorrowAnchor, timezone);
  return {
    fetchedAt: now.toISOString(),
    timezone,
    today,
    tomorrow,
    authority: 'server-clock'
  };
}

export function buildCurrentDateAuthority(now = new Date(), timezone = SCOUT_DATE_TIMEZONE): string {
  const details = buildCurrentDatetimeDetails(now, timezone);

  return [
    `Current date authority: server clock fetched this turn at ${details.fetchedAt} (${details.timezone}).`,
    `Today is ${details.today.label}. Tomorrow is ${details.tomorrow.label}.`,
    'Resolve “today,” “tomorrow,” “tonight,” and weekday references from this date authority only.',
    'Never derive the current date from profile.updatedAt, saved documents, training plans, previous messages, or weather/source timestamps; those are data freshness signals only.'
  ].join(' ');
}

export function renderCurrentDatetime(details: CurrentDatetimeDetails): string {
  return [
    `Current datetime fetched from server clock at ${details.fetchedAt}.`,
    `Timezone: ${details.timezone}.`,
    `Today: ${details.today.label}.`,
    `Tomorrow: ${details.tomorrow.label}.`,
    'Use this as the only authority for today/tomorrow/weekday labels in this turn.'
  ].join('\n');
}
