import { get, writable } from 'svelte/store';

export type AppMode = 'prep' | 'live' | 'post';
export type OverlayView = 'none' | 'map' | 'tool';
export type ToolId = 'weather' | 'budget' | 'water' | 'food' | 'goals' | 'pack' | 'notes' | 'sos';
export type PresenceVisibility = 'private' | 'friends' | 'public';

export type QuickAction = {
  id: string;
  label: string;
  icon: string;
  modeVisibility: AppMode[];
  openToolId?: ToolId;
  priority: number;
  intent: 'open-map' | 'open-tool' | 'start-hike' | 'stop-hike';
};

export type TrailLocation = {
  lat: number;
  lon: number;
  accuracyM?: number;
  recordedAt: string;
};

export type TrailSession = {
  startedAt: string | null;
  endedAt: string | null;
  isActive: boolean;
  tripId: string | null;
  lastKnownLocation: TrailLocation | null;
  visibility: PresenceVisibility;
};

export type ShellUser = {
  id: string;
  email: string;
  name: string;
  profile?: {
    display_name?: string | null;
    trail_name?: string | null;
    avatar_url?: string | null;
  } | null;
};

export type SyncState = 'idle' | 'syncing' | 'error';

export type TrailShellState = {
  mode: AppMode;
  overlay: OverlayView;
  activeTool: ToolId | null;
  session: TrailSession;
  user: ShellUser | null;
  isOnline: boolean;
  locationPermission: PermissionState | 'unsupported' | 'unknown';
  powerSaveMode: boolean;
  syncState: SyncState;
  lastSyncAt: string | null;
  notice: string | null;
};

type PersistedStateV1 = {
  version: 1;
  mode: AppMode;
  session: TrailSession;
};

const STORAGE_KEY = 'hcTrailShell.v1';
const AUTH_KEY = 'hcApiAuth.v1';

const PREP_QUICK_ACTIONS: QuickAction[] = [
  {
    id: 'start-hike',
    label: 'Start Hike',
    icon: '▶',
    modeVisibility: ['prep'],
    priority: 1,
    intent: 'start-hike',
  },
  {
    id: 'map',
    label: 'Map',
    icon: '🗺️',
    modeVisibility: ['prep', 'live', 'post'],
    priority: 2,
    intent: 'open-map',
  },
  {
    id: 'pack',
    label: 'Pack',
    icon: '🎒',
    modeVisibility: ['prep'],
    openToolId: 'pack',
    priority: 3,
    intent: 'open-tool',
  },
  {
    id: 'budget',
    label: 'Budget',
    icon: '💰',
    modeVisibility: ['prep'],
    openToolId: 'budget',
    priority: 4,
    intent: 'open-tool',
  },
  {
    id: 'weather',
    label: 'Weather',
    icon: '🌤️',
    modeVisibility: ['prep', 'live'],
    openToolId: 'weather',
    priority: 5,
    intent: 'open-tool',
  },
  {
    id: 'goals',
    label: 'Goals',
    icon: '📈',
    modeVisibility: ['prep', 'post'],
    openToolId: 'goals',
    priority: 6,
    intent: 'open-tool',
  },
];

const LIVE_QUICK_ACTIONS: QuickAction[] = [
  {
    id: 'stop-hike',
    label: 'Stop',
    icon: '⏹',
    modeVisibility: ['live'],
    priority: 1,
    intent: 'stop-hike',
  },
  {
    id: 'map',
    label: 'Map',
    icon: '🗺️',
    modeVisibility: ['prep', 'live', 'post'],
    priority: 2,
    intent: 'open-map',
  },
  {
    id: 'water',
    label: 'Water',
    icon: '💧',
    modeVisibility: ['live'],
    openToolId: 'water',
    priority: 3,
    intent: 'open-tool',
  },
  {
    id: 'food',
    label: 'Food',
    icon: '🍽️',
    modeVisibility: ['live'],
    openToolId: 'food',
    priority: 4,
    intent: 'open-tool',
  },
  {
    id: 'notes',
    label: 'Notes',
    icon: '📝',
    modeVisibility: ['live'],
    openToolId: 'notes',
    priority: 5,
    intent: 'open-tool',
  },
  {
    id: 'sos',
    label: 'SOS',
    icon: '🆘',
    modeVisibility: ['live', 'post'],
    openToolId: 'sos',
    priority: 6,
    intent: 'open-tool',
  },
];

const POST_QUICK_ACTIONS: QuickAction[] = [
  {
    id: 'map',
    label: 'Map',
    icon: '🗺️',
    modeVisibility: ['prep', 'live', 'post'],
    priority: 1,
    intent: 'open-map',
  },
  {
    id: 'goals',
    label: 'Goals',
    icon: '📈',
    modeVisibility: ['prep', 'post'],
    openToolId: 'goals',
    priority: 2,
    intent: 'open-tool',
  },
  {
    id: 'notes',
    label: 'Notes',
    icon: '📝',
    modeVisibility: ['live', 'post'],
    openToolId: 'notes',
    priority: 3,
    intent: 'open-tool',
  },
  {
    id: 'sos',
    label: 'SOS',
    icon: '🆘',
    modeVisibility: ['live', 'post'],
    openToolId: 'sos',
    priority: 4,
    intent: 'open-tool',
  },
];

function nowIso(): string {
  return new Date().toISOString();
}

function safeJsonParse<T>(raw: string | null): T | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function defaultSession(): TrailSession {
  return {
    startedAt: null,
    endedAt: null,
    isActive: false,
    tripId: null,
    lastKnownLocation: null,
    visibility: 'private',
  };
}

function initialState(): TrailShellState {
  return {
    mode: 'prep',
    overlay: 'none',
    activeTool: null,
    session: defaultSession(),
    user: null,
    isOnline: typeof navigator === 'undefined' ? true : navigator.onLine,
    locationPermission: 'unknown',
    powerSaveMode: false,
    syncState: 'idle',
    lastSyncAt: null,
    notice: null,
  };
}

function mergeSession(session: TrailSession | null | undefined): TrailSession {
  const base = defaultSession();
  if (!session) return base;

  const visibility: PresenceVisibility =
    session.visibility === 'friends' || session.visibility === 'public' ? session.visibility : 'private';

  const merged: TrailSession = {
    startedAt: typeof session.startedAt === 'string' ? session.startedAt : null,
    endedAt: typeof session.endedAt === 'string' ? session.endedAt : null,
    isActive: Boolean(session.isActive),
    tripId: typeof session.tripId === 'string' && session.tripId ? session.tripId : null,
    lastKnownLocation:
      session.lastKnownLocation &&
      Number.isFinite(session.lastKnownLocation.lat) &&
      Number.isFinite(session.lastKnownLocation.lon)
        ? {
            lat: Number(session.lastKnownLocation.lat),
            lon: Number(session.lastKnownLocation.lon),
            accuracyM: Number.isFinite(session.lastKnownLocation.accuracyM)
              ? Number(session.lastKnownLocation.accuracyM)
              : undefined,
            recordedAt:
              typeof session.lastKnownLocation.recordedAt === 'string'
                ? session.lastKnownLocation.recordedAt
                : nowIso(),
          }
        : null,
    visibility,
  };

  if (merged.isActive) {
    merged.endedAt = null;
  }

  return merged;
}

function readPersistedState(): PersistedStateV1 | null {
  if (typeof window === 'undefined') return null;

  const parsed = safeJsonParse<PersistedStateV1>(localStorage.getItem(STORAGE_KEY));
  if (!parsed || parsed.version !== 1) return null;

  const mode: AppMode = parsed.mode === 'live' || parsed.mode === 'post' ? parsed.mode : 'prep';

  return {
    version: 1,
    mode,
    session: mergeSession(parsed.session),
  };
}

function persistState(state: TrailShellState): void {
  if (typeof window === 'undefined') return;

  const payload: PersistedStateV1 = {
    version: 1,
    mode: state.mode,
    session: mergeSession(state.session),
  };

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // Local persistence is best effort.
  }
}

function isToolId(value: string | null | undefined): value is ToolId {
  return (
    value === 'weather' ||
    value === 'budget' ||
    value === 'water' ||
    value === 'food' ||
    value === 'goals' ||
    value === 'pack' ||
    value === 'notes' ||
    value === 'sos'
  );
}

function sanitizeQueryState(params: URLSearchParams): {
  overlay: OverlayView;
  tool: ToolId | null;
} {
  const overlayParam = params.get('overlay');
  const toolParam = params.get('tool');

  if (overlayParam === 'map') {
    return { overlay: 'map', tool: null };
  }

  if (overlayParam === 'tool' && isToolId(toolParam)) {
    return { overlay: 'tool', tool: toolParam };
  }

  return { overlay: 'none', tool: null };
}

function normalizeMode(mode: AppMode, session: TrailSession): AppMode {
  if (mode === 'live' && !session.isActive) return 'prep';
  if (mode !== 'live' && session.isActive) return 'live';
  return mode;
}

function createTrailShellStore() {
  const store = writable<TrailShellState>(initialState());
  const { subscribe, set, update } = store;

  function mutate(mutator: (state: TrailShellState) => TrailShellState, persist = true): void {
    update((current) => {
      const next = mutator(current);
      if (persist) persistState(next);
      return next;
    });
  }

  function initFromStorage(): void {
    const base = initialState();
    const persisted = readPersistedState();

    if (!persisted) {
      set(base);
      return;
    }

    const session = mergeSession(persisted.session);
    const mode = normalizeMode(persisted.mode, session);

    set({
      ...base,
      mode,
      session,
    });
  }

  return {
    subscribe,

    initFromStorage,

    getState(): TrailShellState {
      return get(store);
    },

    setOverlayFromQuery(params: URLSearchParams): void {
      const next = sanitizeQueryState(params);
      mutate((state) => ({
        ...state,
        overlay: next.overlay,
        activeTool: next.tool,
      }), false);
    },

    openMap(): void {
      mutate((state) => ({
        ...state,
        overlay: 'map',
        activeTool: null,
      }), false);
    },

    openTool(tool: ToolId): void {
      mutate((state) => ({
        ...state,
        overlay: 'tool',
        activeTool: tool,
      }), false);
    },

    closeOverlay(): void {
      mutate((state) => ({
        ...state,
        overlay: 'none',
        activeTool: null,
      }), false);
    },

    startHike(): void {
      mutate((state) => ({
        ...state,
        mode: 'live',
        overlay: 'none',
        activeTool: null,
        session: {
          ...state.session,
          isActive: true,
          startedAt: state.session.startedAt || nowIso(),
          endedAt: null,
        },
      }));
    },

    stopHike(): void {
      mutate((state) => ({
        ...state,
        mode: 'prep',
        overlay: 'none',
        activeTool: null,
        session: {
          ...state.session,
          isActive: false,
          endedAt: nowIso(),
        },
      }));
    },

    markPostHike(): void {
      mutate((state) => ({
        ...state,
        mode: 'post',
      }));
    },

    setPresenceVisibility(visibility: PresenceVisibility): void {
      mutate((state) => ({
        ...state,
        session: {
          ...state.session,
          visibility,
        },
      }));
    },

    setLastKnownLocation(location: TrailLocation): void {
      mutate((state) => ({
        ...state,
        session: {
          ...state.session,
          lastKnownLocation: {
            ...location,
            recordedAt: location.recordedAt || nowIso(),
          },
        },
      }));
    },

    setOnline(isOnline: boolean): void {
      mutate((state) => ({
        ...state,
        isOnline,
      }), false);
    },

    setLocationPermission(permission: PermissionState | 'unsupported' | 'unknown'): void {
      mutate((state) => ({
        ...state,
        locationPermission: permission,
      }), false);

      if (permission === 'denied') {
        mutate((state) => ({
          ...state,
          notice: 'Location access is off. GPS sharing stays private until permission is restored.',
          session: {
            ...state.session,
            visibility: 'private',
          },
        }));
      }
    },

    setPowerSaveMode(enabled: boolean): void {
      mutate((state) => ({
        ...state,
        powerSaveMode: enabled,
      }), false);
    },

    setSyncState(syncState: SyncState): void {
      mutate((state) => ({
        ...state,
        syncState,
      }), false);
    },

    setLastSyncAt(lastSyncAt: string | null): void {
      mutate((state) => ({
        ...state,
        lastSyncAt,
      }), false);
    },

    setNotice(notice: string | null): void {
      mutate((state) => ({
        ...state,
        notice,
      }), false);
    },

    setUser(user: ShellUser | null): void {
      mutate((state) => ({
        ...state,
        user,
      }), false);
    },
  };
}

export const trailShell = createTrailShellStore();

export function quickActionsForMode(mode: AppMode): QuickAction[] {
  if (mode === 'live') return LIVE_QUICK_ACTIONS;
  if (mode === 'post') return POST_QUICK_ACTIONS;
  return PREP_QUICK_ACTIONS;
}

export function readAuthToken(): string | null {
  if (typeof window === 'undefined') return null;

  const parsed = safeJsonParse<{ token?: string }>(localStorage.getItem(AUTH_KEY));
  if (!parsed || typeof parsed.token !== 'string' || !parsed.token) return null;
  return parsed.token;
}

export function buildOverlaySearchParams(current: URLSearchParams, state: TrailShellState): URLSearchParams {
  const params = new URLSearchParams(current);
  params.delete('overlay');
  params.delete('tool');

  if (state.overlay === 'map') {
    params.set('overlay', 'map');
  }

  if (state.overlay === 'tool' && state.activeTool) {
    params.set('overlay', 'tool');
    params.set('tool', state.activeTool);
  }

  return params;
}

export function overlayFromUrl(url: URL): {
  overlay: OverlayView;
  tool: ToolId | null;
} {
  return sanitizeQueryState(url.searchParams);
}

export function isTrailToolId(value: string | null | undefined): value is ToolId {
  return isToolId(value);
}
