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
  let trackerShareId = $state('');
  let trackerColor = $state('#f97316');
  let trackerIsPublic = $state(true);

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
    trackerShareId = '';
    trackerColor = '#f97316';
    trackerIsPublic = true;
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
    trackerShareId = record.garmin_share_id;
    trackerColor = record.color;
    trackerIsPublic = record.is_public;
  }

  async function loadTrackerSettings(): Promise<void> {
    const token = readAuthToken();
    if (!token) {
      clearTrackerForm();
      clearTrackerFeedback();
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
        return;
      }

      applyTrackerRecord(primary);
    } catch {
      trackerError = 'Could not load tracker settings right now.';
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
            label: (displayName() || 'HoggCountry').trim().slice(0, 120),
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
    void loadTrackerSettings();

    if (syncTicker) {
      window.clearInterval(syncTicker);
    }

    syncTicker = window.setInterval(() => {
      void syncBootstrap();
    }, 180000);

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

  <button class="map-fab" type="button" onclick={openMapOverlay} aria-label="Open full-screen map">
    <span class="fab-main">🗺️ Map</span>
    <span class="fab-meta">Mile {mapBadge.mile.toFixed(1)} • {mapBadge.remaining.toFixed(0)} left</span>
  </button>

  <CharacterHub mode={$trailShell.mode} user={$trailShell.user} visibility={$trailShell.session.visibility} />

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
    --shell-pad: clamp(0.75rem, 2.2vw, 1.25rem);
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
    justify-content: space-between;
    gap: 0.55rem;
    margin-bottom: 0.55rem;
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

  .map-fab {
    position: fixed;
    right: max(1rem, env(safe-area-inset-right));
    top: max(84px, env(safe-area-inset-top) + 72px);
    z-index: 18;
    border-radius: 14px;
    border: 1px solid rgba(77, 89, 74, 0.28);
    background: linear-gradient(150deg, rgba(255,255,255,0.95), rgba(252, 249, 240, 0.94));
    box-shadow: 0 16px 30px rgba(33, 46, 34, 0.16);
    color: #1f2937;
    display: grid;
    gap: 0.1rem;
    padding: 0.54rem 0.68rem;
    cursor: pointer;
    min-width: 126px;
    text-align: left;
  }

  .fab-main {
    font-family: Oswald, sans-serif;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    font-size: 0.8rem;
  }

  .fab-meta {
    font-size: 0.67rem;
    color: rgba(31, 41, 55, 0.74);
  }

  .presence-strip {
    margin-top: 0.75rem;
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

  .trail-shell.power-save .map-fab,
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

    .map-fab {
      right: calc(50vw - min(600px, 47vw));
    }

    .quick-actions {
      grid-template-columns: repeat(6, minmax(0, 1fr));
      max-width: 980px;
      margin-inline: auto;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .trail-shell,
    .map-fab,
    .quick-btn {
      transition: none;
      animation: none;
    }
  }
</style>
