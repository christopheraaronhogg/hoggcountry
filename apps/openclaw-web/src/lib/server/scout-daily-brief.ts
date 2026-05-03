import type { DadPilotSummary } from '$lib/server/dad';
import {
  approximateAtStateForMile,
  checkOfficialTrailSources,
  type AtcTrailUpdateResult,
  type OfficialTrailSourceCheckDetails,
  type NwsForecastPeriodSummary
} from '$lib/server/scout-official-sources';
import type { WorkspaceRecord } from '$lib/server/workspace-store';

export type ScoutDailyBriefSeverity = 'info' | 'watch' | 'urgent';

export interface ScoutDailyBriefItem {
  readonly label: string;
  readonly detail: string;
  readonly source: string;
  readonly severity: ScoutDailyBriefSeverity;
  readonly href?: string | null;
}

export interface ScoutDailyBriefSourceReceipt {
  readonly label: string;
  readonly status: string;
  readonly href?: string | null;
}

export interface ScoutDailyBrief {
  readonly generatedAt: string;
  readonly title: string;
  readonly summary: string;
  readonly snapshot: string[];
  readonly risks: ScoutDailyBriefItem[];
  readonly actions: string[];
  readonly sourceReceipts: ScoutDailyBriefSourceReceipt[];
  readonly scoutPrompt: string;
}

function excerpt(value: string, maxLength: number): string {
  const normalized = value.replace(/\s+/gu, ' ').trim();
  if (normalized.length <= maxLength) return normalized;
  return `${normalized.slice(0, maxLength - 1).trimEnd()}…`;
}

function formatDate(value: string | null): string | null {
  if (!value) return null;
  const parsed = Date.parse(value);
  if (!Number.isFinite(parsed)) return value;
  return new Date(parsed).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZoneName: 'short'
  });
}

function atcSeverity(update: AtcTrailUpdateResult): ScoutDailyBriefSeverity {
  const text = `${update.title} ${update.meta} ${update.excerpt}`.toLowerCase();
  if (/missing person|closed|closure|burn ban|fire|hurricane|flood|storm|danger|emergency/u.test(text)) return 'urgent';
  if (/bear|warning|detour|reroute|parking|animal|alert/u.test(text)) return 'watch';
  return 'info';
}

function forecastSeverity(period: NwsForecastPeriodSummary): ScoutDailyBriefSeverity {
  const text = `${period.shortForecast} ${period.detailedForecast} ${period.wind}`.toLowerCase();
  if (/thunderstorm|severe|flood|snow|ice|freezing|wind advisory|heavy rain|danger/u.test(text)) return 'watch';
  if (/rain|showers|wind|cold|hot|fog/u.test(text)) return 'info';
  return 'info';
}

function recordLooksLikeDadPilot(record: WorkspaceRecord): boolean {
  return [record.betaProfile.name, record.betaProfile.trailName, record.betaProfile.email]
    .some((value) => /\bdad\b/iu.test(value ?? ''));
}

function shouldUseDadPilotContext(record: WorkspaceRecord, dadPilotSummary: DadPilotSummary | null): boolean {
  return Boolean(dadPilotSummary && (!record.profile || recordLooksLikeDadPilot(record)));
}

function snapshotLines(record: WorkspaceRecord, dadPilotSummary: DadPilotSummary | null): string[] {
  const lines: string[] = [];
  const profile = record.profile;

  if (profile) {
    lines.push(
      `Workspace hiker: ${record.betaProfile.trailName || record.betaProfile.name || 'unnamed'} · ${profile.direction} · mile ${profile.currentMile.toFixed(1)} · target ${profile.targetPace.toFixed(1)} mpd.`
    );
  } else {
    lines.push('Workspace profile is not initialized yet, so Scout is leaning on public pilot context and saved artifacts.');
  }

  if (shouldUseDadPilotContext(record, dadPilotSummary)) {
    lines.push(
      `Dad public fix: ${dadPilotSummary.latestFixLabel}${dadPilotSummary.latestFixAt ? ` at ${formatDate(dadPilotSummary.latestFixAt)}` : ''}.`
    );

    if (dadPilotSummary.latestTrailUpdate) {
      const update = dadPilotSummary.latestTrailUpdate;
      lines.push(
        `Latest Trail Update: ${update.title}${update.location ? ` near ${update.location}` : ''}${update.trailMile !== null ? ` · mile ${update.trailMile.toFixed(1)}` : ''}${update.publishedAt ? ` · ${formatDate(update.publishedAt)}` : ''}.`
      );
    } else {
      lines.push('No public Dad Trail Update is available yet.');
    }

    if (dadPilotSummary.latestDispatchTitle) {
      lines.push(`Latest dispatch: ${dadPilotSummary.latestDispatchTitle}${dadPilotSummary.latestDispatchPublished ? ` · ${formatDate(dadPilotSummary.latestDispatchPublished)}` : ''}.`);
    }
  }

  return lines;
}

function officialQuery(record: WorkspaceRecord, dadPilotSummary: DadPilotSummary | null): string {
  const parts = ['weather forecast active alerts ATC closures detours burn bans bear warnings'];

  if (record.profile) {
    parts.push(`AT mile ${record.profile.currentMile.toFixed(1)} ${record.profile.direction}`);
  }

  const update = shouldUseDadPilotContext(record, dadPilotSummary) ? dadPilotSummary?.latestTrailUpdate : null;
  if (update) {
    parts.push(update.title);
    if (update.location) parts.push(update.location);
    if (update.trailMile !== null) parts.push(`AT mile ${update.trailMile.toFixed(1)}`);
    if (update.body) parts.push(excerpt(update.body, 180));
  }

  return parts.join(' · ');
}

function buildRiskItems(official: OfficialTrailSourceCheckDetails | null): ScoutDailyBriefItem[] {
  const risks: ScoutDailyBriefItem[] = [];

  for (const update of official?.atcUpdates.slice(0, 3) ?? []) {
    risks.push({
      label: update.title,
      detail: excerpt([update.meta, update.elapsed, update.excerpt].filter(Boolean).join(' · '), 360),
      source: 'ATC Trail Updates',
      severity: atcSeverity(update),
      href: update.href
    });
  }

  for (const alert of official?.weather?.alerts.slice(0, 3) ?? []) {
    risks.push({
      label: alert.event,
      detail: excerpt(`${alert.headline}${alert.expires ? ` Expires ${formatDate(alert.expires)}.` : ''}${alert.instruction ? ` ${alert.instruction}` : ''}`, 360),
      source: 'NWS active alerts',
      severity: alert.severity === 'Extreme' || alert.severity === 'Severe' ? 'urgent' : 'watch'
    });
  }

  const nextPeriod = official?.weather?.periods[0] ?? null;
  if (nextPeriod) {
    risks.push({
      label: `Weather: ${nextPeriod.name}`,
      detail: excerpt(`${nextPeriod.temperature}, ${nextPeriod.wind}, ${nextPeriod.shortForecast}. ${nextPeriod.detailedForecast}`, 360),
      source: official?.weather?.label ? `NWS forecast for ${official.weather.label}` : 'NWS forecast',
      severity: forecastSeverity(nextPeriod),
      href: official?.weather?.forecastUrl ?? official?.weather?.pointUrl ?? null
    });
  }

  return risks.slice(0, 6);
}

function buildSourceReceipts(record: WorkspaceRecord, official: OfficialTrailSourceCheckDetails | null, dadPilotSummary: DadPilotSummary | null): ScoutDailyBriefSourceReceipt[] {
  const receipts: ScoutDailyBriefSourceReceipt[] = [
    {
      label: 'Private workspace',
      status: 'Checked profile, saved docs/tools summary, and Scout workspace context.'
    }
  ];

  if (shouldUseDadPilotContext(record, dadPilotSummary)) {
    receipts.push({
      label: 'Dad public pilot',
      status: 'Checked public Garmin/Trail Update/dispatch summary.'
    });
  }

  if (official) {
    receipts.push({
      label: 'ATC Trail Updates',
      status: official.atcUpdates.length > 0 ? `Fetched ${official.atcUpdates.length} current update candidates.` : 'Fetched current list; no matching updates returned.',
      href: 'https://appalachiantrail.org/trail-updates/'
    });

    if (official.weather) {
      receipts.push({
        label: 'NWS forecast and alerts',
        status: `Fetched point forecast/alerts for ${official.weather.label}.`,
        href: official.weather.pointUrl
      });
    } else {
      receipts.push({
        label: 'NWS forecast and alerts',
        status: official.skipped.find((line) => line.includes('NWS')) ?? 'Not checked; coordinates were not available or weather was not relevant.'
      });
    }

    for (const error of official.errors) {
      receipts.push({ label: 'Source error', status: error });
    }
  }

  return receipts;
}

function buildActions(record: WorkspaceRecord, dadPilotSummary: DadPilotSummary | null, risks: ScoutDailyBriefItem[], official: OfficialTrailSourceCheckDetails | null): string[] {
  const actions: string[] = [];

  const urgent = risks.find((risk) => risk.severity === 'urgent');
  if (urgent) {
    actions.push(`Treat “${urgent.label}” as the first go/no-go check before committing to today’s route.`);
  }

  const weatherAlert = official?.weather?.alerts[0] ?? null;
  if (weatherAlert) {
    actions.push(`Read the active NWS alert details before exposed ridges, long gaps between bailouts, or campsite decisions.`);
  }

  if (shouldUseDadPilotContext(record, dadPilotSummary) && dadPilotSummary?.latestTrailUpdate) {
    actions.push('Use the latest Trail Update as the freshest hiker signal; ask what changed since that post before revising a multi-day plan.');
  }

  if (record.profile) {
    actions.push(`Have Scout draft the next 24 hours and next 7 days from mile ${record.profile.currentMile.toFixed(1)}, with max food carry and bailout/town assumptions called out.`);
  } else {
    actions.push('Finish the workspace profile so Daily Brief can anchor around a real mile, pace, direction, and food-carry limit.');
  }

  actions.push('If water, campsite crowding, or exact mile-by-mile services matter today, import or paste FarOut/A.T. Guide notes before treating the plan as final.');

  return [...new Set(actions)].slice(0, 5);
}

function buildScoutPrompt(brief: Omit<ScoutDailyBrief, 'scoutPrompt'>): string {
  return [
    'Use this Daily Trail Brief as source context and turn it into a practical plan.',
    `Generated: ${brief.generatedAt}`,
    `Summary: ${brief.summary}`,
    'Snapshot:',
    ...brief.snapshot.map((line) => `- ${line}`),
    'Risks:',
    ...(brief.risks.length > 0 ? brief.risks.map((risk) => `- [${risk.severity}] ${risk.label}: ${risk.detail} (${risk.source})`) : ['- No specific risk items returned.']),
    'Recommended actions:',
    ...brief.actions.map((action) => `- ${action}`),
    'Now produce: (1) next 24 hours, (2) next 3-7 day planning implications, (3) missing source checks, and (4) what Chris should ask the hiker next.'
  ].join('\n');
}

export async function buildScoutDailyBrief(record: WorkspaceRecord, dadPilotSummary: DadPilotSummary | null): Promise<ScoutDailyBrief> {
  const generatedAt = new Date().toISOString();
  const query = officialQuery(record, dadPilotSummary);
  const official = await checkOfficialTrailSources(
    {
      query,
      source: 'auto',
      state: record.profile ? approximateAtStateForMile(record.profile.currentMile) : null,
      useDadLocation: shouldUseDadPilotContext(record, dadPilotSummary)
    },
    dadPilotSummary
  ).catch((error) => ({
    query,
    source: 'auto' as const,
    fetchedAt: new Date().toISOString(),
    atcUpdates: [],
    weather: null,
    skipped: [],
    errors: [`Official source check failed: ${error instanceof Error ? error.message : 'unknown error'}`]
  } satisfies OfficialTrailSourceCheckDetails));

  const snapshot = snapshotLines(record, dadPilotSummary);
  const risks = buildRiskItems(official);
  const actions = buildActions(record, dadPilotSummary, risks, official);
  const highRiskCount = risks.filter((risk) => risk.severity === 'urgent' || risk.severity === 'watch').length;
  const summary = highRiskCount > 0
    ? `${highRiskCount} current risk signal${highRiskCount === 1 ? '' : 's'} need attention before the next plan is trusted.`
    : 'No urgent official risk signal surfaced, but mile-by-mile guide/FarOut details may still be needed.';

  const withoutPrompt = {
    generatedAt,
    title: 'Daily Trail Brief',
    summary,
    snapshot,
    risks,
    actions,
    sourceReceipts: buildSourceReceipts(record, official, dadPilotSummary)
  } satisfies Omit<ScoutDailyBrief, 'scoutPrompt'>;

  return {
    ...withoutPrompt,
    scoutPrompt: buildScoutPrompt(withoutPrompt)
  };
}
