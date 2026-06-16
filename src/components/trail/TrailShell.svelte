<script lang="ts">
  import { onMount } from 'svelte';
  import CharacterHub from './CharacterHub.svelte';
  import MapOverlay from './MapOverlay.svelte';
  import ToolOverlayHost from './ToolOverlayHost.svelte';
  import { loadCharacter, character, updateCharacter } from '../../stores/character.svelte';
  import { loadContext, trailContext } from '../../stores/trailContext.svelte';
  import {
    buildOverlaySearchParams,
    quickActionsForMode,
    readAuthToken,
    trailShell,
    type QuickAction,
    type ToolId,
  } from '../../lib/trail-shell-store';

  const API_BASE = (import.meta.env.PUBLIC_API_BASE_URL || 'https://hoggcountry.on-forge.com/api/v1').replace(/\/+$/, '');

  let mounted = $state(false);
  let authLoading = $state(false);
  let syncTicker: number | null = null;
  let noticeTimer: number | null = null;
  let permissionStatus: PermissionStatus | null = null;
  let trackerNoticeTimer: number | null = null;

  type CommunityTrackerRecord = {
    id: string;
    label: string;
    garmin_share_id: string;
    color: string;
    is_public: boolean;
  };

  let trackerLoading = $state(false);
  let trackerSaving = $state(false);
  let trackerError = $state('');
  let trackerSuccess = $state('');
  let trackerRecordId = $state<string | null>(null);
  let trackerLabel = $state('HoggCountry');
  let trackerShareId = $state('');
  let trackerColor = $state('#f97316');
  let trackerIsPublic = $state(true);
  let trackerSignalStatus = $state<'unknown' | 'live' | 'stale' | 'not_configured' | 'private' | 'error'>('unknown');
  let trackerSignalError = $state('');
  let trackerSignalObservedAt = $state<string | null>(null);
  let trackerHistoryPointCount = $state(0);
  let trackerSignalTicker: number | null = null;
  let clockTicker: number | null = null;
  let shellNowMs = $state(Date.now());

  type MissionIntent =
    | { kind: 'open-map' }
    | { kind: 'open-tool'; toolId: ToolId }
    | { kind: 'start-hike' }
    | { kind: 'stop-hike' };

  type MissionCard = {
    id: string;
    title: string;
    summary: string;
    cta: string;
    intent: MissionIntent;
  };

  const TRACKER_STALE_MS = 30 * 60 * 1000;
  const TRACKER_SIGNAL_POLL_MS = 90 * 1000;
  const CLOCK_TICK_MS = 30 * 1000;

  const FALLBACK_LOGIN_REDIRECT = '/trail/';

  function displayName(): string {
    const nickname = character.core.nickname?.trim();
    if (nickname) return nickname;

    const display = character.core.displayName?.trim();
    if (display) return display;

    const profileDisplay = $trailShell.user?.profile?.display_name?.trim();
    if (profileDisplay) return profileDisplay;

    return $trailShell.user?.name || 'Trail Character';
  }

  function avatarSource(): string | null {
    const avatar = $trailShell.user?.profile?.avatar_url;
    if (typeof avatar === 'string' && avatar.trim()) return avatar;
    return null;
  }

  let mapBadge = $derived.by(() => {
    const mile = Number(trailContext.currentMile || 0);
    return {
      mile,
      remaining: Math.max(0, 2197.4 - mile),
    };
  });

  let quickActions = $derived.by(() => quickActionsForMode($trailShell.mode));

  let modeLabel = $derived.by(() => {
    if ($trailShell.mode === 'live') return 'Live Trail';
    if ($trailShell.mode === 'post') return 'Post Trail';
    return 'Mile 0 Prep';
  });

  let modeSummary = $derived.by(() => {
    if ($trailShell.mode === 'live') return 'On-trail decisions, pace, and safety tools front and center.';
    if ($trailShell.mode === 'post') return 'Capture lessons and shape the next section strategy.';
    return 'Plan your kit, miles, and conditions before you go live.';
  });

  function parseIso(value: string | null | undefined): number | null {
    if (!value) return null;
    const parsed = Date.parse(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  function formatDuration(ms: number): string {
    const totalMinutes = Math.max(0, Math.floor(ms / 60000));
    const days = Math.floor(totalMinutes / 1440);
    const hours = Math.floor((totalMinutes % 1440) / 60);
    const minutes = totalMinutes % 60;

    if (days > 0) return `${days}d ${hours}h ${minutes}m`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  }

  function formatAge(iso: string | null): string {
    const parsed = parseIso(iso);
    if (parsed == null) return 'No data';
    const elapsedMs = Math.max(0, shellNowMs - parsed);
    if (elapsedMs < 60 * 1000) return 'Just now';
    if (elapsedMs < 60 * 60 * 1000) return `${Math.floor(elapsedMs / 60000)}m ago`;
    if (elapsedMs < 24 * 60 * 60 * 1000) return `${Math.floor(elapsedMs / (60 * 60 * 1000))}h ago`;
    return `${Math.floor(elapsedMs / (24 * 60 * 60 * 1000))}d ago`;
  }

  let sessionRuntimeLabel = $derived.by(() => {
    const startedAt = parseIso($trailShell.session.startedAt);
    if (startedAt == null) return 'Not started';

    const endedAt = parseIso($trailShell.session.endedAt);
    const endTs = $trailShell.session.isActive ? shellNowMs : endedAt ?? shellNowMs;
    return formatDuration(Math.max(0, endTs - startedAt));
  });

  let syncFreshnessLabel = $derived.by(() => {
    if (!$trailShell.lastSyncAt) return 'Waiting for first sync';
    return formatAge($trailShell.lastSyncAt);
  });

  let trackerSignalAgeLabel = $derived.by(() => formatAge(trackerSignalObservedAt));

  let trackerSignalBadgeLabel = $derived.by(() => {
    if (trackerSignalStatus === 'live') return 'Signal live';
    if (trackerSignalStatus === 'stale') return 'Signal stale';
    if (trackerSignalStatus === 'private') return 'Private signal';
    if (trackerSignalStatus === 'not_configured') return 'No signal';
    if (trackerSignalStatus === 'error') return 'Signal error';
    return 'Signal pending';
  });

  let missionCards = $derived.by((): MissionCard[] => {
    if ($trailShell.mode === 'live') {
      return [
        {
          id: 'live-map',
          title: 'Hold Position',
          summary: 'Open map overlay and verify your latest fix + heading context.',
          cta: 'Open Map',
          intent: { kind: 'open-map' },
        },
        {
          id: 'live-water',
          title: 'Water Check',
          summary: 'Update carry decisions before the next dry stretch.',
          cta: 'Open Water Tool',
          intent: { kind: 'open-tool', toolId: 'water' },
        },
        {
          id: 'live-stop',
          title: 'End Active Session',
          summary: 'Stop live mode once you are off trail for the day.',
          cta: 'Stop Hike',
          intent: { kind: 'stop-hike' },
        },
      ];
    }

    if ($trailShell.mode === 'post') {
      return [
        {
          id: 'post-review',
          title: 'Review Progress',
          summary: 'Capture completion velocity and compare against your target pace.',
          cta: 'Open Goals',
          intent: { kind: 'open-tool', toolId: 'goals' },
        },
        {
          id: 'post-notes',
          title: 'Record Trail Notes',
          summary: 'Lock in what worked before memory fades.',
          cta: 'Open Notes',
          intent: { kind: 'open-tool', toolId: 'notes' },
        },
        {
          id: 'post-map',
          title: 'Inspect Route',
          summary: 'Open the map and review line placement around key sections.',
          cta: 'Open Map',
          intent: { kind: 'open-map' },
        },
      ];
    }

    return [
      {
        id: 'prep-pack',
        title: 'Pack Calibration',
        summary: 'Tune worn vs packed gear and keep base weight in range.',
        cta: 'Open Pack Builder',
        intent: { kind: 'open-tool', toolId: 'pack' },
      },
      {
        id: 'prep-weather',
        title: 'Weather Check',
        summary: 'Read forecast context before locking today’s movement plan.',
        cta: 'Open Weather',
        intent: { kind: 'open-tool', toolId: 'weather' },
      },
      {
        id: 'prep-go-live',
        title: 'Go Live',
        summary: 'Switch to live mode when you are ready to track in motion.',
        cta: 'Start Hike',
        intent: { kind: 'start-hike' },
      },
    ];
  });

  function updateOverlayUrl(method: 'push' | 'replace'): void {
    if (typeof window === 'undefined') return;

    const state = trailShell.getState();
    const currentUrl = new URL(window.location.href);
    const params = buildOverlaySearchParams(currentUrl.searchParams, state);

    const query = params.toString();
    const nextHref = `${currentUrl.pathname}${query ? `?${query}` : ''}`;
    const currentHref = `${currentUrl.pathname}${currentUrl.search}`;

    if (nextHref === currentHref) return;

    if (method === 'push') {
      window.history.pushState({ overlay: state.overlay }, '', nextHref);
      return;
    }

    window.history.replaceState({ overlay: state.overlay }, '', nextHref);
  }

  function applyOverlayFromUrl(): void {
    if (typeof window === 'undefined') return;
    const currentUrl = new URL(window.location.href);
    trailShell.setOverlayFromQuery(currentUrl.searchParams);
  }

  function openMapOverlay(): void {
    const prev = trailShell.getState();
    trailShell.openMap();
    updateOverlayUrl(prev.overlay === 'none' ? 'push' : 'replace');
  }

  function openToolOverlay(toolId: ToolId): void {
    const prev = trailShell.getState();
    trailShell.openTool(toolId);
    updateOverlayUrl(prev.overlay === 'none' ? 'push' : 'replace');
  }

  function closeOverlay(): void {
    if (typeof window === 'undefined') {
      trailShell.closeOverlay();
      return;
    }

    const current = trailShell.getState();
    if (current.overlay === 'none') return;

    const hasOverlayQuery = new URL(window.location.href).searchParams.has('overlay');
    if (hasOverlayQuery && window.history.length > 1) {
      window.history.back();
      return;
    }

    trailShell.closeOverlay();
    updateOverlayUrl('replace');
  }

  function startHike(): void {
    trailShell.startHike();
    trailShell.setNotice('Live trail mode started. Quick actions are now on-trail focused.');
  }

  function stopHike(): void {
    const proceed = typeof window === 'undefined' ? true : window.confirm('Stop Live Trail mode and switch back to prep mode?');
    if (!proceed) return;

    trailShell.stopHike();
    trailShell.setNotice('Live trail mode stopped. Back in Mile 0 planning mode.');
  }

  function runQuickAction(action: QuickAction): void {
    if (action.intent === 'open-map') {
      openMapOverlay();
      return;
    }

    if (action.intent === 'open-tool' && action.openToolId) {
      openToolOverlay(action.openToolId);
      return;
    }

    if (action.intent === 'start-hike') {
      startHike();
      return;
    }

    if (action.intent === 'stop-hike') {
      stopHike();
    }
  }

  function runMissionIntent(intent: MissionIntent): void {
    if (intent.kind === 'open-map') {
      openMapOverlay();
      return;
    }

    if (intent.kind === 'open-tool') {
      openToolOverlay(intent.toolId);
      return;
    }

    if (intent.kind === 'start-hike') {
      startHike();
      return;
    }

    stopHike();
  }

  async function hydrateMe(): Promise<void> {
    const token = readAuthToken();
    if (!token) {
      trailShell.setUser(null);
      return;
    }

    authLoading = true;

    try {
      const response = await fetch(`${API_BASE}/auth/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        trailShell.setNotice('Auth session expired. Sign in again when ready.');
        return;
      }

      const payload = await response.json().catch(() => null);
      const me = payload?.data || null;

      if (!me || typeof me !== 'object') {
        return;
      }

      trailShell.setUser({
        id: String(me.id || ''),
        email: String(me.email || ''),
        name: String(me.name || me.email || 'Trail User'),
        profile: me.profile || null,
      });

      // Keep canonical local model local-first, but seed better display naming from auth profile.
      const nextDisplay = typeof me?.profile?.display_name === 'string' ? me.profile.display_name.trim() : '';
      const nextTrail = typeof me?.profile?.trail_name === 'string' ? me.profile.trail_name.trim() : '';

      if (nextDisplay || nextTrail) {
        updateCharacter({
          core: {
            ...character.core,
            displayName: nextDisplay || character.core.displayName,
            nickname: nextTrail || character.core.nickname,
          },
        } as any);
      }
    } catch {
      trailShell.setNotice('Could not verify account right now. Local mode remains active.');
    } finally {
      authLoading = false;
    }
  }

  async function syncBootstrap(): Promise<void> {
    const token = readAuthToken();
    if (!token || !$trailShell.isOnline) return;

    trailShell.setSyncState('syncing');

    try {
      const response = await fetch(`${API_BASE}/sync/bootstrap`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        trailShell.setSyncState('error');
        return;
      }

      trailShell.setSyncState('idle');
      trailShell.setLastSyncAt(new Date().toISOString());
    } catch {
      trailShell.setSyncState('error');
    }
  }

  function setupOnlineWatchers(): () => void {
    if (typeof window === 'undefined') return () => {};

    const handleOnline = () => {
      trailShell.setOnline(true);
      void syncBootstrap();
    };

    const handleOffline = () => {
      trailShell.setOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }

  async function setupPermissionWatcher(): Promise<() => void> {
    if (typeof navigator === 'undefined' || !('permissions' in navigator)) {
      trailShell.setLocationPermission('unsupported');
      return () => {};
    }

    try {
      permissionStatus = await navigator.permissions.query({ name: 'geolocation' });
      trailShell.setLocationPermission(permissionStatus.state);

      permissionStatus.onchange = () => {
        trailShell.setLocationPermission(permissionStatus?.state || 'unknown');
      };

      return () => {
        if (permissionStatus) permissionStatus.onchange = null;
        permissionStatus = null;
      };
    } catch {
      trailShell.setLocationPermission('unsupported');
      return () => {};
    }
  }

  async function setupBatteryWatcher(): Promise<() => void> {
    if (typeof navigator === 'undefined' || !('getBattery' in navigator)) {
      trailShell.setPowerSaveMode(false);
      return () => {};
    }

    try {
      const battery: any = await (navigator as any).getBattery();

      const applyBatteryState = () => {
        const low = battery.level <= 0.22;
        const saveMode = low && !battery.charging;
        trailShell.setPowerSaveMode(saveMode);
      };

      applyBatteryState();
      battery.addEventListener('chargingchange', applyBatteryState);
      battery.addEventListener('levelchange', applyBatteryState);

      return () => {
        battery.removeEventListener('chargingchange', applyBatteryState);
        battery.removeEventListener('levelchange', applyBatteryState);
      };
    } catch {
      trailShell.setPowerSaveMode(false);
      return () => {};
    }
  }

  function locationStatusLabel(): string {
    const state = $trailShell.locationPermission;
    if (state === 'granted') return 'Location ready';
    if (state === 'denied') return 'Location blocked';
    if (state === 'prompt') return 'Location pending';
    if (state === 'unsupported') return 'Location unavailable';
    return 'Location unknown';
  }

  function syncStatusLabel(): string {
    if (!$trailShell.isOnline) return 'Offline';
    if ($trailShell.syncState === 'syncing') return 'Syncing';
    if ($trailShell.syncState === 'error') return 'Sync issue';
    if ($trailShell.lastSyncAt) return 'Synced';
    return 'Local-first';
  }

  function clearTrackerFeedback(): void {
    trackerError = '';
    trackerSuccess = '';
  }

  function clearTrackerForm(): void {
    trackerRecordId = null;
    trackerLabel = displayName();
    trackerShareId = '';
    trackerColor = '#f97316';
    trackerIsPublic = true;
  }

  function clearTrackerSignal(): void {
    trackerSignalStatus = trackerRecordId ? 'unknown' : 'not_configured';
    trackerSignalError = '';
    trackerSignalObservedAt = null;
    trackerHistoryPointCount = 0;
  }

  function trackerLookupLabel(): string {
    const value = String(trackerLabel || displayName() || '').trim();
    return value;
  }

  function pickLabelMatch<T extends { label?: string }>(rows: T[], label: string): T | null {
    if (!rows.length) return null;
    const normalized = label.trim().toLowerCase();
    if (!normalized) return rows[0];

    const exact = rows.find((row) => String(row.label || '').trim().toLowerCase() === normalized);
    if (exact) return exact;

    const fuzzy = rows.find((row) => String(row.label || '').toLowerCase().includes(normalized));
    if (fuzzy) return fuzzy;

    return rows[0];
  }

  function normalizeGarminShareId(raw: string): string {
    const value = String(raw || '').trim();
    if (!value) return '';

    const feedPrefix = 'https://explore.garmin.com/Feed/Share/';
    if (value.toLowerCase().startsWith(feedPrefix.toLowerCase())) {
      return value.slice(feedPrefix.length).split(/[/?#]/)[0]?.trim() || '';
    }

    if (value.includes('://')) {
      try {
        const url = new URL(value);
        const parts = url.pathname.split('/').filter(Boolean);
        const shareIdx = parts.findIndex((part) => part.toLowerCase() === 'share');
        if (shareIdx >= 0 && parts[shareIdx + 1]) return parts[shareIdx + 1].trim();
        return parts[parts.length - 1]?.trim() || '';
      } catch {
        return value;
      }
    }

    return value;
  }

  function parseTrackerRecord(raw: any): CommunityTrackerRecord | null {
    if (!raw || typeof raw !== 'object') return null;

    const id = String(raw.id || '').trim();
    const garminShareId = String(raw.garmin_share_id || '').trim();
    if (!id || !garminShareId) return null;

    const label = String(raw.label || '').trim() || 'HoggCountry';
    const color = String(raw.color || '#f97316').trim() || '#f97316';
    const isPublic = Boolean(raw.is_public);

    return {
      id,
      label,
      garmin_share_id: garminShareId,
      color,
      is_public: isPublic,
    };
  }

  function applyTrackerRecord(record: CommunityTrackerRecord): void {
    trackerRecordId = record.id;
    trackerLabel = record.label;
    trackerShareId = record.garmin_share_id;
    trackerColor = record.color;
    trackerIsPublic = record.is_public;
  }

  async function loadPublicTrackerSignal(): Promise<void> {
    if (!trackerRecordId) {
      trackerSignalStatus = 'not_configured';
      trackerSignalError = '';
      trackerSignalObservedAt = null;
      trackerHistoryPointCount = 0;
      return;
    }

    if (!trackerIsPublic) {
      trackerSignalStatus = 'private';
      trackerSignalError = '';
      trackerSignalObservedAt = null;
      trackerHistoryPointCount = 0;
      return;
    }

    const label = trackerLookupLabel();
    if (!label) {
      trackerSignalStatus = 'error';
      trackerSignalError = 'Tracker label is missing.';
      return;
    }

    try {
      const liveUrl = new URL(`${API_BASE}/trackers/public/live`);
      liveUrl.searchParams.set('label', label);

      const historyUrl = new URL(`${API_BASE}/trackers/public/history`);
      historyUrl.searchParams.set('label', label);
      historyUrl.searchParams.set('limit', '1200');

      const [liveRes, historyRes] = await Promise.all([
        fetch(liveUrl.toString(), { headers: { Accept: 'application/json' }, cache: 'no-store' }),
        fetch(historyUrl.toString(), { headers: { Accept: 'application/json' }, cache: 'no-store' }),
      ]);

      const livePayload = await liveRes.json().catch(() => null);
      const historyPayload = await historyRes.json().catch(() => null);

      const liveRows = (Array.isArray(livePayload?.data?.fixes) ? livePayload.data.fixes : []) as Array<{
        label?: string;
        observed_at?: string;
      }>;
      const historyRows = (Array.isArray(historyPayload?.data?.trackers) ? historyPayload.data.trackers : []) as Array<{
        label?: string;
        points?: unknown[];
      }>;

      const liveRow = pickLabelMatch(liveRows, label);
      const historyRow = pickLabelMatch(historyRows, label);
      const points = Array.isArray(historyRow?.points) ? historyRow.points : [];

      trackerHistoryPointCount = points.length;
      trackerSignalObservedAt = typeof liveRow?.observed_at === 'string'
        ? liveRow.observed_at
        : (
            points.length && typeof (points[points.length - 1] as any)?.observed_at === 'string'
              ? String((points[points.length - 1] as any).observed_at)
              : null
          );

      trackerSignalError = '';

      const observedAtMs = parseIso(trackerSignalObservedAt);
      if (observedAtMs == null) {
        trackerSignalStatus = 'stale';
        return;
      }

      const age = shellNowMs - observedAtMs;
      trackerSignalStatus = age <= TRACKER_STALE_MS ? 'live' : 'stale';
    } catch {
      trackerSignalStatus = 'error';
      trackerSignalError = 'Could not read public tracker signal.';
    }
  }

  async function loadTrackerSettings(): Promise<void> {
    const token = readAuthToken();
    if (!token) {
      clearTrackerForm();
      clearTrackerFeedback();
      clearTrackerSignal();
      return;
    }

    trackerLoading = true;
    clearTrackerFeedback();

    try {
      const response = await fetch(`${API_BASE}/community/trackers`, {
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          clearTrackerForm();
          clearTrackerSignal();
          trackerError = 'Sign in again to manage Garmin tracking.';
          return;
        }

        trackerError = 'Could not load tracker settings right now.';
        return;
      }

      const payload = await response.json().catch(() => null);
      const rows = Array.isArray(payload?.data?.trackers) ? payload.data.trackers : [];

      const primary = rows[0] ? parseTrackerRecord(rows[0]) : null;
      if (!primary) {
        clearTrackerForm();
        clearTrackerSignal();
        return;
      }

      applyTrackerRecord(primary);
      await loadPublicTrackerSignal();
    } catch {
      trackerError = 'Could not load tracker settings right now.';
      trackerSignalStatus = trackerRecordId ? 'error' : 'not_configured';
      trackerSignalError = 'Could not load tracker signal.';
    } finally {
      trackerLoading = false;
    }
  }

  async function saveTrackerSettings(): Promise<void> {
    const token = readAuthToken();
    if (!token) {
      trackerError = 'Sign in with Google first, then save your Garmin Share ID.';
      return;
    }

    const garminShareId = normalizeGarminShareId(trackerShareId);
    if (!garminShareId) {
      trackerError = 'Enter a Garmin Share ID (or full Garmin feed URL).';
      return;
    }

    trackerSaving = true;
    clearTrackerFeedback();

    try {
      const response = await fetch(
        trackerRecordId
          ? `${API_BASE}/community/trackers/${trackerRecordId}`
          : `${API_BASE}/community/trackers`,
        {
          method: trackerRecordId ? 'PATCH' : 'POST',
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            label: (trackerLabel || displayName() || 'HoggCountry').trim().slice(0, 120),
            garmin_share_id: garminShareId,
            color: (trackerColor || '#f97316').trim(),
            is_public: trackerIsPublic,
          }),
        }
      );

      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        trackerError = String(payload?.error?.message || 'Could not save tracker settings.');
        return;
      }

      const saved = parseTrackerRecord(payload?.data?.tracker);
      if (!saved) {
        trackerError = 'Tracker saved, but response payload was invalid.';
        return;
      }

      applyTrackerRecord(saved);
      trackerSuccess = 'Tracker saved. Live map refresh runs automatically every minute.';
      trailShell.setNotice('Garmin tracker saved. You can now appear on the live map when fixes are available.');
      await loadPublicTrackerSignal();

      if (trackerNoticeTimer) {
        window.clearTimeout(trackerNoticeTimer);
      }

      trackerNoticeTimer = window.setTimeout(() => {
        trackerSuccess = '';
      }, 4200);
    } catch {
      trackerError = 'Could not save tracker settings.';
    } finally {
      trackerSaving = false;
    }
  }

  onMount(() => {
    loadCharacter();
    loadContext();

    trailShell.initFromStorage();
    trailShell.setOnline(typeof navigator === 'undefined' ? true : navigator.onLine);

    applyOverlayFromUrl();

    void hydrateMe();
    void syncBootstrap();
    clearTrackerSignal();
    void loadTrackerSettings();

    if (syncTicker) {
      window.clearInterval(syncTicker);
    }

    syncTicker = window.setInterval(() => {
      void syncBootstrap();
    }, 180000);

    if (clockTicker) {
      window.clearInterval(clockTicker);
    }

    clockTicker = window.setInterval(() => {
      shellNowMs = Date.now();
    }, CLOCK_TICK_MS);

    if (trackerSignalTicker) {
      window.clearInterval(trackerSignalTicker);
    }

    trackerSignalTicker = window.setInterval(() => {
      void loadPublicTrackerSignal();
    }, TRACKER_SIGNAL_POLL_MS);

    const removeOnlineWatchers = setupOnlineWatchers();

    const popListener = () => {
      applyOverlayFromUrl();
    };
    window.addEventListener('popstate', popListener);

    let cleanupPermissions = () => {};
    void setupPermissionWatcher().then((cleanup) => {
      cleanupPermissions = cleanup;
    });

    let cleanupBattery = () => {};
    void setupBatteryWatcher().then((cleanup) => {
      cleanupBattery = cleanup;
    });

    mounted = true;

    return () => {
      removeOnlineWatchers();
      window.removeEventListener('popstate', popListener);
      cleanupPermissions();
      cleanupBattery();

      if (syncTicker) {
        window.clearInterval(syncTicker);
        syncTicker = null;
      }

      if (clockTicker) {
        window.clearInterval(clockTicker);
        clockTicker = null;
      }

      if (trackerSignalTicker) {
        window.clearInterval(trackerSignalTicker);
        trackerSignalTicker = null;
      }

      if (noticeTimer) {
        window.clearTimeout(noticeTimer);
        noticeTimer = null;
      }

      if (trackerNoticeTimer) {
        window.clearTimeout(trackerNoticeTimer);
        trackerNoticeTimer = null;
      }
    };
  });

  $effect(() => {
    const notice = $trailShell.notice;
    if (!notice) return;

    if (noticeTimer) {
      window.clearTimeout(noticeTimer);
    }

    noticeTimer = window.setTimeout(() => {
      trailShell.setNotice(null);
    }, 5200);

    return () => {
      if (noticeTimer) {
        window.clearTimeout(noticeTimer);
        noticeTimer = null;
      }
    };
  });
</script>

<svelte:window
  onkeydown={(event) => {
    if (event.key !== 'Escape') return;
    closeOverlay();
  }}
/>

<section class="trail-shell" class:mounted class:power-save={$trailShell.powerSaveMode}>
  <header class="trail-topbar">
    <button
      class="profile-chip"
      type="button"
      onclick={() => openToolOverlay('goals')}
      aria-label="Open profile stats"
    >
      {#if avatarSource()}
        <img src={avatarSource() || ''} alt="" loading="lazy" decoding="async" />
      {:else}
        <span class="avatar-fallback" aria-hidden="true">{displayName().slice(0, 1).toUpperCase()}</span>
      {/if}
      <span class="profile-copy">
        <strong>{displayName()}</strong>
        <span>{authLoading ? 'Checking account...' : syncStatusLabel()}</span>
      </span>
    </button>

    <div class="status-cluster" aria-label="Connection and location">
      <span class="status-pill" class:online={$trailShell.isOnline}>{$trailShell.isOnline ? 'Online' : 'Offline'}</span>
      <span class="status-pill" class:ready={$trailShell.locationPermission === 'granted'}>{locationStatusLabel()}</span>
      {#if $trailShell.powerSaveMode}
        <span class="status-pill save">Battery saver</span>
      {/if}
    </div>
  </header>

  <section
    class="mode-strip"
    class:mode-prep={$trailShell.mode === 'prep'}
    class:mode-live={$trailShell.mode === 'live'}
    class:mode-post={$trailShell.mode === 'post'}
    aria-label="Current mode and trail position"
  >
    <div class="mode-meta">
      <span class="mode-kicker">Active Mode</span>
      <strong class="mode-title">{modeLabel}</strong>
      <p>{modeSummary}</p>
    </div>

    <div class="mile-block">
      <span class="mile-label">Current Mile</span>
      <strong class="mile-number">{mapBadge.mile.toFixed(1)}</strong>
      <span class="mile-remaining">{mapBadge.remaining.toFixed(0)} mi to Katahdin</span>
    </div>

    <button
      class="map-cta"
      class:signal-live={trackerSignalStatus === 'live'}
      class:signal-stale={trackerSignalStatus === 'stale'}
      type="button"
      onclick={openMapOverlay}
      aria-label="Open full-screen map"
    >
      <span class="map-cta-label">
        <span aria-hidden="true">🗺️</span>
        <span>Open Map</span>
      </span>
      <span class="map-cta-meta">{trackerSignalBadgeLabel}</span>
    </button>
  </section>

  <section class="command-deck" aria-label="Trail command deck">
    <header class="deck-head">
      <div>
        <p class="deck-kicker">Command Deck</p>
        <h2>Session &amp; Signal</h2>
      </div>
      <p>Runtime, sync freshness, and live tracker confidence — refreshed every minute.</p>
    </header>

    <div class="deck-grid">
      <article class="deck-card">
        <span class="deck-label">Session Runtime</span>
        <strong>{sessionRuntimeLabel}</strong>
        <p>{$trailShell.session.isActive ? 'Active trail session is running now.' : 'Session has not started yet.'}</p>
      </article>

      <article class="deck-card">
        <span class="deck-label">Sync Freshness</span>
        <strong>{syncStatusLabel()}</strong>
        <p>{syncFreshnessLabel}</p>
      </article>

      <article
        class="deck-card tracker-signal-card"
        class:signal-live={trackerSignalStatus === 'live'}
        class:signal-stale={trackerSignalStatus === 'stale'}
        class:signal-private={trackerSignalStatus === 'private'}
        class:signal-error={trackerSignalStatus === 'error'}
      >
        <span class="deck-label">Tracker Signal</span>
        <strong>{trackerSignalBadgeLabel}</strong>
        <p>
          {#if trackerSignalStatus === 'not_configured'}
            Add your Garmin tracker below to enable reliable live confidence checks.
          {:else if trackerSignalStatus === 'private'}
            Tracker is private. Public map signal is intentionally hidden.
          {:else if trackerSignalStatus === 'error'}
            {trackerSignalError || 'Could not reach public tracker signal.'}
          {:else}
            Last fix {trackerSignalAgeLabel} • {trackerHistoryPointCount} saved path points
          {/if}
        </p>
      </article>
    </div>
  </section>

  <CharacterHub mode={$trailShell.mode} user={$trailShell.user} visibility={$trailShell.session.visibility} />

  <section class="mission-board" aria-label="Mode missions">
    <header>
      <p class="deck-kicker">Mode Missions</p>
      <h3>Next Best Actions</h3>
    </header>

    <div class="mission-grid">
      {#each missionCards as mission}
        <article class="mission-card">
          <strong>{mission.title}</strong>
          <p>{mission.summary}</p>
          <button type="button" onclick={() => runMissionIntent(mission.intent)}>{mission.cta}</button>
        </article>
      {/each}
    </div>
  </section>

  <div class="presence-strip">
    <label for="presence-select">Community map visibility</label>
    <select
      id="presence-select"
      value={$trailShell.session.visibility}
      onchange={(event) => {
        const target = event.currentTarget as HTMLSelectElement;
        trailShell.setPresenceVisibility(target.value as any);
      }}
      disabled={$trailShell.locationPermission === 'denied'}
    >
      <option value="private">Private</option>
      <option value="friends">Friends</option>
      <option value="public">Public</option>
    </select>
    <p>
      Private by default. Public visibility only applies when GPS permission is granted and live tracking is active.
    </p>
  </div>

  {#if $trailShell.user}
    <section class="tracker-strip" aria-label="Garmin tracker settings">
      <div class="tracker-head">
        <p class="tracker-kicker">Garmin MapShare</p>
        <span class="tracker-state">
          {#if trackerLoading}
            Loading...
          {:else if trackerSaving}
            Saving...
          {:else if trackerRecordId}
            Saved
          {:else}
            Not configured
          {/if}
        </span>
      </div>

      <label for="tracker-share-id">Share ID or Garmin Feed URL</label>
      <input
        id="tracker-share-id"
        type="text"
        value={trackerShareId}
        placeholder="hoggcountry or https://explore.garmin.com/Feed/Share/..."
        oninput={(event) => {
          trackerShareId = (event.currentTarget as HTMLInputElement).value;
          if (trackerError) trackerError = '';
        }}
      />

      <label for="tracker-label">Public Tracker Label</label>
      <input
        id="tracker-label"
        type="text"
        value={trackerLabel}
        maxlength="120"
        placeholder="HoggCountry"
        oninput={(event) => {
          trackerLabel = (event.currentTarget as HTMLInputElement).value;
          if (trackerError) trackerError = '';
        }}
      />

      <label class="tracker-public-toggle">
        <input
          type="checkbox"
          checked={trackerIsPublic}
          onchange={(event) => {
            trackerIsPublic = (event.currentTarget as HTMLInputElement).checked;
          }}
        />
        <span>Expose this tracker on the public map feed</span>
      </label>

      <div class="tracker-actions">
        <button type="button" onclick={saveTrackerSettings} disabled={trackerSaving || trackerLoading}>
          {trackerSaving ? 'Saving...' : 'Save Tracker'}
        </button>
        <button type="button" class="secondary" onclick={loadTrackerSettings} disabled={trackerSaving || trackerLoading}>
          Refresh
        </button>
      </div>

      {#if trackerError}
        <p class="tracker-feedback error">{trackerError}</p>
      {/if}

      {#if trackerSuccess}
        <p class="tracker-feedback success">{trackerSuccess}</p>
      {/if}

      <p class="tracker-help">
        Paste either the share ID or full Garmin feed link. We poll Garmin every minute on the backend and refresh the map automatically.
      </p>
    </section>
  {/if}

  <nav class="quick-actions" aria-label="Contextual trail actions">
    {#each quickActions as action}
      <button
        type="button"
        class="quick-btn"
        onclick={() => runQuickAction(action)}
      >
        <span aria-hidden="true">{action.icon}</span>
        <span>{action.label}</span>
      </button>
    {/each}
  </nav>

  {#if $trailShell.notice}
    <div class="toast" role="status" aria-live="polite">{$trailShell.notice}</div>
  {/if}

  {#if !$trailShell.user}
    <a class="auth-link" href={`/login?redirect=${encodeURIComponent(FALLBACK_LOGIN_REDIRECT)}`}>
      Sign in with Google to sync across devices
    </a>
  {/if}

  {#if $trailShell.overlay === 'map'}
    <MapOverlay onClose={closeOverlay} />
  {/if}

  {#if $trailShell.overlay === 'tool'}
    <ToolOverlayHost
      toolId={$trailShell.activeTool}
      mode={$trailShell.mode}
      onClose={closeOverlay}
      onOpenTool={openToolOverlay}
    />
  {/if}
</section>

<style>
  .trail-shell {
    --shell-pad: clamp(0.85rem, 2.4vw, 1.4rem);
    position: relative;
    isolation: isolate;
    min-height: calc(100dvh - 120px);
    margin: 0 auto;
    width: min(1200px, 100%);
    padding: var(--shell-pad);
    background:
      radial-gradient(1200px 620px at 85% -120px, rgba(166, 181, 137, 0.22), transparent 60%),
      radial-gradient(900px 560px at -10% 110%, rgba(77, 89, 74, 0.16), transparent 58%),
      rgba(245, 242, 232, 0.7);
    border: 1px solid rgba(77, 89, 74, 0.15);
    border-radius: 20px;
    box-shadow: 0 30px 60px rgba(33, 46, 34, 0.12);
    opacity: 0;
    transform: translateY(10px);
    transition: opacity 220ms ease, transform 220ms ease;
  }

  .trail-shell.mounted {
    opacity: 1;
    transform: translateY(0);
  }

  .trail-topbar {
    position: sticky;
    top: calc(env(safe-area-inset-top) + 0.25rem);
    z-index: 12;
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 0.55rem 0.55rem;
    margin-bottom: 0.6rem;
    padding: 0.45rem 0.55rem;
    border-radius: 14px;
    border: 1px solid rgba(77, 89, 74, 0.18);
    background: rgba(255, 255, 255, 0.78);
    backdrop-filter: blur(10px);
  }

  .profile-chip {
    display: inline-flex;
    align-items: center;
    gap: 0.55rem;
    border-radius: 999px;
    padding: 0.3rem 0.35rem;
    border: 1px solid rgba(77, 89, 74, 0.24);
    background: rgba(255, 255, 255, 0.86);
    color: #1f2937;
    cursor: pointer;
    min-width: 0;
    max-width: min(72vw, 430px);
  }

  .profile-chip img,
  .avatar-fallback {
    width: 35px;
    height: 35px;
    border-radius: 999px;
    flex: 0 0 auto;
    object-fit: cover;
    background: rgba(77, 89, 74, 0.22);
    display: grid;
    place-items: center;
    color: #1f2937;
    font-weight: 700;
  }

  .profile-copy {
    display: grid;
    min-width: 0;
    text-align: left;
    line-height: 1.2;
  }

  .profile-copy strong {
    font-size: 0.86rem;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .profile-copy span {
    font-size: 0.72rem;
    color: rgba(31, 41, 55, 0.72);
  }

  .status-cluster {
    display: inline-flex;
    align-items: center;
    gap: 0.38rem;
    flex-wrap: wrap;
    justify-content: flex-end;
  }

  .status-pill {
    border-radius: 999px;
    border: 1px solid rgba(77, 89, 74, 0.24);
    padding: 0.29rem 0.56rem;
    font-size: 0.68rem;
    line-height: 1;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    background: rgba(255, 255, 255, 0.86);
    color: #1f2937;
  }

  .status-pill.online,
  .status-pill.ready {
    border-color: rgba(22, 163, 74, 0.4);
    background: rgba(22, 163, 74, 0.12);
  }

  .status-pill.save {
    border-color: rgba(217, 119, 6, 0.42);
    background: rgba(217, 119, 6, 0.15);
  }

  .mode-strip {
    margin-top: 0.6rem;
    display: grid;
    gap: 0.65rem;
    grid-template-columns: minmax(0, 1.2fr) auto;
    grid-template-areas:
      'meta mile'
      'cta  cta';
    padding: 0.85rem 0.9rem;
    border-radius: 16px;
    border: 1px solid rgba(77, 89, 74, 0.2);
    background:
      radial-gradient(720px 200px at 100% 0%, rgba(166, 181, 137, 0.25), transparent 60%),
      linear-gradient(165deg, rgba(255, 255, 255, 0.96), rgba(245, 240, 226, 0.9));
    box-shadow: 0 14px 28px rgba(30, 42, 31, 0.12);
  }

  .mode-strip.mode-live {
    border-color: rgba(217, 119, 6, 0.42);
    background:
      radial-gradient(720px 200px at 100% 0%, rgba(217, 119, 6, 0.16), transparent 60%),
      linear-gradient(165deg, rgba(255, 248, 235, 0.96), rgba(255, 235, 205, 0.86));
  }

  .mode-strip.mode-post {
    border-color: rgba(77, 89, 74, 0.35);
  }

  .mode-meta {
    grid-area: meta;
    display: grid;
    gap: 0.2rem;
    align-content: start;
    min-width: 0;
  }

  .mode-kicker {
    font-family: Oswald, sans-serif;
    font-size: 0.66rem;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: rgba(31, 41, 55, 0.62);
  }

  .mode-title {
    font-family: Oswald, Impact, sans-serif;
    font-size: 1.15rem;
    line-height: 1.08;
    color: #1f2937;
  }

  .mode-strip.mode-live .mode-title {
    color: var(--terra, #d97706);
  }

  .mode-meta p {
    margin: 0;
    font-size: 0.8rem;
    line-height: 1.4;
    color: rgba(31, 41, 55, 0.72);
  }

  .mile-block {
    grid-area: mile;
    display: grid;
    gap: 0.08rem;
    justify-items: end;
    align-content: start;
    min-width: 0;
  }

  .mile-label {
    font-family: Oswald, sans-serif;
    font-size: 0.62rem;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: rgba(31, 41, 55, 0.6);
  }

  .mile-number {
    font-family: Oswald, Impact, sans-serif;
    font-size: clamp(1.85rem, 6.5vw, 2.4rem);
    line-height: 1;
    color: var(--pine, #4d594a);
  }

  .mile-remaining {
    font-size: 0.72rem;
    color: rgba(31, 41, 55, 0.66);
  }

  .map-cta {
    grid-area: cta;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.6rem;
    padding: 0.62rem 0.9rem;
    min-height: 52px;
    border-radius: 12px;
    border: 1px solid rgba(77, 89, 74, 0.35);
    background: linear-gradient(160deg, #304136, #4b5d4d);
    color: #fff;
    cursor: pointer;
    text-align: left;
    box-shadow: 0 10px 22px rgba(33, 46, 34, 0.18);
    transition: transform 0.12s ease, box-shadow 0.12s ease;
  }

  .map-cta:hover {
    transform: translateY(-1px);
    box-shadow: 0 14px 28px rgba(33, 46, 34, 0.22);
  }

  .map-cta-label {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    font-family: Oswald, sans-serif;
    text-transform: uppercase;
    letter-spacing: 0.07em;
    font-size: 0.95rem;
  }

  .map-cta-meta {
    font-size: 0.72rem;
    color: rgba(255, 255, 255, 0.78);
  }

  .map-cta.signal-live {
    border-color: rgba(22, 163, 74, 0.55);
    box-shadow: 0 14px 28px rgba(22, 163, 74, 0.25);
  }

  .map-cta.signal-stale {
    border-color: rgba(217, 119, 6, 0.5);
  }

  .command-deck {
    margin-top: 0.72rem;
    border-radius: 16px;
    border: 1px solid rgba(77, 89, 74, 0.2);
    background:
      radial-gradient(740px 240px at 92% -64%, rgba(166, 181, 137, 0.22), transparent 60%),
      linear-gradient(170deg, rgba(255,255,255,0.92), rgba(245, 240, 226, 0.86));
    padding: 0.82rem 0.85rem;
    display: grid;
    gap: 0.7rem;
    box-shadow: 0 12px 26px rgba(30, 42, 31, 0.1);
  }

  .deck-head {
    display: grid;
    gap: 0.22rem;
  }

  .deck-head h2 {
    margin: 0;
    font-family: Oswald, Impact, sans-serif;
    font-size: 1.05rem;
    line-height: 1.1;
    color: #1f2937;
  }

  .deck-head p {
    margin: 0;
    font-size: 0.8rem;
    line-height: 1.4;
    color: rgba(31, 41, 55, 0.72);
  }

  .deck-kicker {
    margin: 0;
    font-size: 0.67rem;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: rgba(31, 41, 55, 0.65);
    font-family: Oswald, sans-serif;
  }

  .deck-grid {
    display: grid;
    gap: 0.5rem;
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .deck-card {
    border-radius: 12px;
    border: 1px solid rgba(77, 89, 74, 0.2);
    background: rgba(255, 255, 255, 0.88);
    padding: 0.56rem 0.62rem;
    display: grid;
    gap: 0.16rem;
    min-height: 96px;
  }

  .deck-label {
    font-size: 0.62rem;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: rgba(31, 41, 55, 0.62);
  }

  .deck-card strong {
    font-size: 0.87rem;
    color: #111827;
  }

  .deck-card p {
    margin: 0;
    font-size: 0.74rem;
    line-height: 1.35;
    color: rgba(31, 41, 55, 0.72);
  }

  .tracker-signal-card {
    grid-column: 1 / -1;
  }

  .tracker-signal-card.signal-live {
    border-color: rgba(22, 163, 74, 0.44);
    background: rgba(236, 253, 245, 0.88);
  }

  .tracker-signal-card.signal-stale {
    border-color: rgba(217, 119, 6, 0.44);
    background: rgba(255, 247, 237, 0.88);
  }

  .tracker-signal-card.signal-private {
    border-color: rgba(59, 130, 246, 0.38);
    background: rgba(239, 246, 255, 0.9);
  }

  .tracker-signal-card.signal-error {
    border-color: rgba(185, 28, 28, 0.38);
    background: rgba(254, 242, 242, 0.9);
  }

  .mission-board {
    margin-top: 0.72rem;
    border-radius: 16px;
    border: 1px solid rgba(77, 89, 74, 0.18);
    background: rgba(255, 255, 255, 0.82);
    padding: 0.68rem 0.72rem;
    display: grid;
    gap: 0.54rem;
  }

  .mission-board header {
    display: grid;
    gap: 0.18rem;
  }

  .mission-board h3 {
    margin: 0;
    font-size: 0.96rem;
    color: #1f2937;
  }

  .mission-grid {
    display: grid;
    gap: 0.46rem;
  }

  .mission-card {
    border-radius: 12px;
    border: 1px solid rgba(77, 89, 74, 0.16);
    background: rgba(249, 247, 240, 0.9);
    padding: 0.56rem 0.58rem;
    display: grid;
    gap: 0.28rem;
  }

  .mission-card strong {
    font-size: 0.84rem;
    color: #1f2937;
  }

  .mission-card p {
    margin: 0;
    font-size: 0.75rem;
    line-height: 1.35;
    color: rgba(31, 41, 55, 0.74);
  }

  .mission-card button {
    justify-self: start;
    border-radius: 999px;
    border: 1px solid rgba(77, 89, 74, 0.28);
    background: linear-gradient(160deg, #304136, #4b5d4d);
    color: #fff;
    padding: 0.5rem 0.95rem;
    font-family: Oswald, sans-serif;
    font-size: 0.78rem;
    letter-spacing: 0.05em;
    text-transform: uppercase;
    font-weight: 700;
    cursor: pointer;
    min-height: 44px;
    transition: transform 0.12s ease, box-shadow 0.12s ease;
  }

  .mission-card button:hover {
    transform: translateY(-1px);
    box-shadow: 0 8px 16px rgba(30, 42, 31, 0.18);
  }

  .presence-strip {
    margin-top: 0.72rem;
    display: grid;
    gap: 0.36rem;
    border-radius: 14px;
    border: 1px solid rgba(77, 89, 74, 0.17);
    background: rgba(255, 255, 255, 0.78);
    padding: 0.64rem 0.74rem;
  }

  .presence-strip label {
    font-size: 0.72rem;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: rgba(31, 41, 55, 0.75);
    font-family: Oswald, sans-serif;
  }

  .presence-strip select {
    border-radius: 9px;
    border: 1px solid rgba(77, 89, 74, 0.24);
    background: rgba(255, 255, 255, 0.92);
    color: #1f2937;
    padding: 0.45rem 0.52rem;
    font-size: 0.86rem;
    max-width: 230px;
  }

  .presence-strip p {
    margin: 0;
    font-size: 0.75rem;
    line-height: 1.4;
    color: rgba(31, 41, 55, 0.7);
  }

  .tracker-strip {
    margin-top: 0.72rem;
    display: grid;
    gap: 0.42rem;
    border-radius: 14px;
    border: 1px solid rgba(77, 89, 74, 0.17);
    background: rgba(255, 255, 255, 0.82);
    padding: 0.66rem 0.74rem 0.7rem;
  }

  .tracker-head {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 0.5rem;
  }

  .tracker-kicker {
    margin: 0;
    font-size: 0.72rem;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: rgba(31, 41, 55, 0.75);
    font-family: Oswald, sans-serif;
  }

  .tracker-state {
    font-size: 0.68rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: rgba(31, 41, 55, 0.7);
    border: 1px solid rgba(77, 89, 74, 0.2);
    border-radius: 999px;
    padding: 0.2rem 0.5rem;
    background: rgba(255, 255, 255, 0.86);
  }

  .tracker-strip label {
    font-size: 0.72rem;
    color: rgba(31, 41, 55, 0.75);
  }

  .tracker-strip input {
    width: 100%;
    border-radius: 9px;
    border: 1px solid rgba(77, 89, 74, 0.24);
    background: rgba(255, 255, 255, 0.95);
    color: #1f2937;
    padding: 0.5rem 0.56rem;
    font-size: 0.86rem;
  }

  .tracker-public-toggle {
    display: inline-flex;
    align-items: center;
    gap: 0.46rem;
    font-size: 0.77rem;
    color: rgba(31, 41, 55, 0.75);
  }

  .tracker-public-toggle input {
    width: 16px;
    height: 16px;
    accent-color: #4d594a;
  }

  .tracker-actions {
    display: flex;
    gap: 0.42rem;
  }

  .tracker-actions button {
    border-radius: 9px;
    border: 1px solid rgba(77, 89, 74, 0.25);
    background: rgba(77, 89, 74, 0.9);
    color: #fff;
    padding: 0.48rem 0.72rem;
    font-size: 0.79rem;
    font-weight: 700;
    cursor: pointer;
  }

  .tracker-actions button.secondary {
    background: rgba(255, 255, 255, 0.9);
    color: #1f2937;
  }

  .tracker-actions button:disabled {
    opacity: 0.65;
    cursor: not-allowed;
  }

  .tracker-feedback {
    margin: 0;
    font-size: 0.75rem;
    line-height: 1.4;
  }

  .tracker-feedback.error {
    color: #b91c1c;
  }

  .tracker-feedback.success {
    color: #166534;
  }

  .tracker-help {
    margin: 0;
    font-size: 0.73rem;
    line-height: 1.4;
    color: rgba(31, 41, 55, 0.7);
  }

  .quick-actions {
    position: sticky;
    bottom: max(0.5rem, env(safe-area-inset-bottom));
    z-index: 24;
    margin-top: 0.85rem;
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 0.5rem;
    padding: 0.45rem;
    border-radius: 16px;
    border: 1px solid rgba(77, 89, 74, 0.2);
    background: rgba(244, 239, 227, 0.94);
    backdrop-filter: blur(10px);
  }

  .quick-btn {
    border-radius: 12px;
    border: 1px solid rgba(77, 89, 74, 0.24);
    background: rgba(255, 255, 255, 0.84);
    color: #1f2937;
    padding: 0.52rem 0.4rem;
    min-height: 54px;
    display: grid;
    place-items: center;
    gap: 0.2rem;
    font-size: 0.74rem;
    cursor: pointer;
    text-align: center;
  }

  .quick-btn span:first-child {
    font-size: 1rem;
    line-height: 1;
  }

  .toast {
    position: fixed;
    left: 50%;
    bottom: max(5.4rem, env(safe-area-inset-bottom) + 4.8rem);
    transform: translateX(-50%);
    z-index: var(--layer-toast, 95);
    border-radius: 12px;
    border: 1px solid rgba(77, 89, 74, 0.24);
    background: rgba(18, 25, 19, 0.92);
    color: rgba(255, 255, 255, 0.95);
    font-size: 0.78rem;
    padding: 0.48rem 0.72rem;
    max-width: min(92vw, 600px);
    text-align: center;
  }

  .auth-link {
    display: inline-flex;
    margin-top: 0.72rem;
    border-radius: 999px;
    border: 1px solid rgba(77, 89, 74, 0.24);
    background: rgba(255, 255, 255, 0.86);
    text-decoration: none;
    color: #1f2937;
    padding: 0.48rem 0.72rem;
    font-size: 0.78rem;
    font-weight: 700;
  }

  .trail-shell.power-save .map-cta,
  .trail-shell.power-save .quick-btn,
  .trail-shell.power-save .profile-chip {
    transition: none;
    animation: none;
  }

  @media (min-width: 920px) {
    .trail-shell {
      padding: 1rem 1.1rem 1.2rem;
      min-height: calc(100dvh - 140px);
    }

    .mode-strip {
      grid-template-columns: minmax(0, 2fr) auto auto;
      grid-template-areas: 'meta mile cta';
      align-items: center;
      gap: 1rem;
      padding: 1rem 1.1rem;
    }

    .map-cta {
      min-width: 200px;
    }

    .quick-actions {
      grid-template-columns: repeat(6, minmax(0, 1fr));
      max-width: 980px;
      margin-inline: auto;
    }

    .deck-grid {
      grid-template-columns: repeat(3, minmax(0, 1fr));
    }

    .tracker-signal-card {
      grid-column: auto;
    }

    .mission-grid {
      grid-template-columns: repeat(3, minmax(0, 1fr));
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .trail-shell,
    .map-cta,
    .mission-card button,
    .quick-btn {
      transition: none;
      animation: none;
    }
  }
</style>
