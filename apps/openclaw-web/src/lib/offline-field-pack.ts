import type {
  ImportedDocument,
  ManualProfile,
  ManualSection,
  WorkspaceResource,
  WorkspaceTool
} from '@hoggcountry/manual-core';
import type { ScoutSkillSettings } from '@hoggcountry/scout-skills';

export interface OfflineWorkspaceSnapshot {
  readonly workspaceId: string;
  readonly betaProfile?: {
    readonly name: string;
    readonly email: string;
    readonly trailName: string;
  };
  readonly profile: ManualProfile | null;
  readonly sections: ManualSection[];
  readonly documents: ImportedDocument[];
  readonly resources: WorkspaceResource[];
  readonly tools: WorkspaceTool[];
  readonly providerConnections?: unknown[];
  readonly clawMessages?: OfflineClawMessage[];
  readonly factCandidates?: unknown[];
  readonly locationHistory?: unknown[];
  readonly skillSettings: ScoutSkillSettings;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface OfflineProviderConnection {
  readonly providerId: 'openai-codex' | 'openai' | 'opencode-go';
  readonly label: string;
  readonly status: 'connected';
  readonly accountId: string | null;
  readonly expiresAt: string | null;
  readonly model?: string;
}

export interface OfflineTurnSourceReceipt {
  readonly label: string;
  readonly status: string;
  readonly kind: string;
}

export interface OfflineClawMessage {
  readonly id: string;
  readonly role: 'user' | 'assistant';
  readonly text: string;
  readonly createdAt: string;
  readonly model: string | null;
  readonly error: boolean;
  readonly sourceReceipts?: OfflineTurnSourceReceipt[];
}

export interface OfflineClawConsolePayload {
  readonly workspaceId: string;
  readonly workspace: {
    readonly profile: ManualProfile | null;
    readonly sections: ManualSection[];
    readonly documents: ImportedDocument[];
    readonly resources: WorkspaceResource[];
    readonly tools: WorkspaceTool[];
  };
  readonly connection: OfflineProviderConnection | null;
  readonly messages: OfflineClawMessage[];
  readonly factCandidates: unknown[];
  readonly hasPendingConnect?: boolean;
}

export interface OfflineScoutDailyBriefSourceReceipt {
  readonly label: string;
  readonly status: string;
  readonly href?: string | null;
}

export interface OfflineScoutDailyBrief {
  readonly generatedAt: string;
  readonly title: string;
  readonly summary: string;
  readonly snapshot: string[];
  readonly risks: Array<{
    readonly label: string;
    readonly detail: string;
    readonly source: string;
    readonly severity: 'info' | 'watch' | 'urgent';
    readonly href?: string | null;
  }>;
  readonly actions: string[];
  readonly sourceReceipts: OfflineScoutDailyBriefSourceReceipt[];
  readonly scoutPrompt: string;
}

export interface OfflineAtReferenceDatasetSummary {
  readonly id: string;
  readonly label: string;
  readonly category: string;
  readonly path: string;
  readonly recordCount: number;
  readonly sourceIds: readonly string[];
  readonly licenseStatuses: readonly string[];
  readonly confidence: string;
  readonly lastChecked: string;
  readonly aiAnswerRule: string | null;
}

export interface OfflineAtReferenceSummary {
  readonly version: 1;
  readonly summaryId: string;
  readonly loadedAt: string;
  readonly available: boolean;
  readonly generatedAt?: string;
  readonly reason?: string;
  readonly sourceManifest?: {
    readonly totalSources: number;
    readonly licenseStatusCounts: Record<string, number>;
    readonly blockedSourceIds: readonly string[];
    readonly shareAlikeSourceIds: readonly string[];
    readonly liveApiSourceIds: readonly string[];
    readonly lastCheckedDates: readonly string[];
  };
  readonly route?: {
    readonly routeId: string;
    readonly sourceId: string;
    readonly licenseStatus: string;
    readonly confidence: string;
    readonly lastChecked: string;
    readonly measuredLengthMiles: number;
    readonly officialReferenceLengthMiles: number;
    readonly lengthDeltaMiles: number;
    readonly official: false;
    readonly candidateStatus: string;
    readonly knownQualityFlags: readonly string[];
    readonly aiAnswerRule: string;
  };
  readonly datasets?: readonly OfflineAtReferenceDatasetSummary[];
  readonly totals?: {
    readonly datasets: number;
    readonly records: number;
  };
  readonly policies?: {
    readonly generatedMileDisclosure: string;
    readonly routeQualityDisclosure: string;
    readonly waterDisclosure: string;
    readonly liveConditionsDisclosure: string;
    readonly blockedSourcesDisclosure: string;
    readonly offlineUseDisclosure: string;
  };
}

export interface OfflineFieldPack {
  readonly version: 1;
  readonly cachedAt: string;
  readonly workspaceId: string;
  readonly workspace: OfflineWorkspaceSnapshot | null;
  readonly claw: OfflineClawConsolePayload | null;
  readonly dailyBrief: OfflineScoutDailyBrief | null;
  readonly atReference: OfflineAtReferenceSummary | null;
}

export interface OfflineFieldPackScope {
  readonly identityId: string;
  readonly identityEmail: string;
  readonly workspaceId: string;
}

interface OfflineFieldPackEnvelope {
  readonly version: 2;
  readonly identityId: string;
  readonly workspaceId: string;
  readonly pack: OfflineFieldPack;
}

const LEGACY_FIELD_PACK_STORAGE_KEY = 'hoggcountry.scout.offlineFieldPack.v1';
const SCOPED_FIELD_PACK_STORAGE_PREFIX = 'hoggcountry.scout.offlineFieldPack.v2:';
const PRIVATE_RUNTIME_CACHE_PREFIX = 'scout-runtime-';
const PRIVATE_CACHE_PURGE_MESSAGE = 'PURGE_PRIVATE_APP_DATA';
let activeFieldPackScope: OfflineFieldPackScope | null = null;

function browserStorage(): Storage | null {
  if (typeof window === 'undefined') return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function fieldPackStorageKey(scope: OfflineFieldPackScope): string {
  return `${SCOPED_FIELD_PACK_STORAGE_PREFIX}${encodeURIComponent(scope.identityId)}:${encodeURIComponent(scope.workspaceId)}`;
}

export function configureOfflineFieldPackScope(scope: OfflineFieldPackScope | null): void {
  const identityId = scope?.identityId.trim() ?? '';
  const identityEmail = scope ? normalizeEmail(scope.identityEmail) : '';
  const workspaceId = scope?.workspaceId.trim() ?? '';
  activeFieldPackScope = identityId && identityEmail && workspaceId
    ? { identityId, identityEmail, workspaceId }
    : null;
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function normalizePack(input: unknown): OfflineFieldPack | null {
  if (!isObject(input) || input.version !== 1 || typeof input.cachedAt !== 'string' || typeof input.workspaceId !== 'string') {
    return null;
  }

  return {
    version: 1,
    cachedAt: input.cachedAt,
    workspaceId: input.workspaceId,
    workspace: isObject(input.workspace) ? input.workspace as unknown as OfflineWorkspaceSnapshot : null,
    claw: isObject(input.claw) ? input.claw as unknown as OfflineClawConsolePayload : null,
    dailyBrief: isObject(input.dailyBrief) ? input.dailyBrief as unknown as OfflineScoutDailyBrief : null,
    atReference: isObject(input.atReference) ? input.atReference as unknown as OfflineAtReferenceSummary : null
  };
}

function normalizeEnvelope(input: unknown): OfflineFieldPackEnvelope | null {
  if (
    !isObject(input)
    || input.version !== 2
    || typeof input.identityId !== 'string'
    || typeof input.workspaceId !== 'string'
  ) {
    return null;
  }

  const pack = normalizePack(input.pack);
  if (!pack) return null;

  return {
    version: 2,
    identityId: input.identityId,
    workspaceId: input.workspaceId,
    pack
  };
}

function packBelongsToScope(pack: OfflineFieldPack, scope: OfflineFieldPackScope): boolean {
  if (pack.workspaceId !== scope.workspaceId) return false;
  if (pack.workspace && pack.workspace.workspaceId !== scope.workspaceId) return false;
  if (pack.claw && pack.claw.workspaceId !== scope.workspaceId) return false;

  const workspaceEmail = pack.workspace?.betaProfile?.email;
  return !workspaceEmail || normalizeEmail(workspaceEmail) === scope.identityEmail;
}

function legacyPackBelongsToScope(pack: OfflineFieldPack, scope: OfflineFieldPackScope): boolean {
  const workspaceEmail = pack.workspace?.betaProfile?.email;
  return packBelongsToScope(pack, scope)
    && typeof workspaceEmail === 'string'
    && normalizeEmail(workspaceEmail) === scope.identityEmail;
}

export function readOfflineFieldPack(): OfflineFieldPack | null {
  const storage = browserStorage();
  const scope = activeFieldPackScope;
  if (!storage || !scope) return null;

  try {
    const storageKey = fieldPackStorageKey(scope);
    const raw = storage.getItem(storageKey);
    if (raw) {
      const envelope = normalizeEnvelope(JSON.parse(raw));
      if (
        envelope
        && envelope.identityId === scope.identityId
        && envelope.workspaceId === scope.workspaceId
        && packBelongsToScope(envelope.pack, scope)
      ) {
        return envelope.pack;
      }
      storage.removeItem(storageKey);
    }

    const legacyRaw = storage.getItem(LEGACY_FIELD_PACK_STORAGE_KEY);
    if (!legacyRaw) return null;
    const legacyPack = normalizePack(JSON.parse(legacyRaw));
    if (!legacyPack || !legacyPackBelongsToScope(legacyPack, scope)) {
      storage.removeItem(LEGACY_FIELD_PACK_STORAGE_KEY);
      return null;
    }

    const migrated = writeOfflineFieldPack(legacyPack);
    if (migrated) storage.removeItem(LEGACY_FIELD_PACK_STORAGE_KEY);
    return migrated;
  } catch {
    return null;
  }
}

export function writeOfflineFieldPack(pack: OfflineFieldPack): OfflineFieldPack | null {
  const storage = browserStorage();
  const scope = activeFieldPackScope;
  const normalized = normalizePack(pack);
  if (!storage || !scope || !normalized || !packBelongsToScope(normalized, scope)) return null;

  try {
    const envelope: OfflineFieldPackEnvelope = {
      version: 2,
      identityId: scope.identityId,
      workspaceId: scope.workspaceId,
      pack: normalized
    };
    storage.setItem(fieldPackStorageKey(scope), JSON.stringify(envelope));
    return normalized;
  } catch {
    return null;
  }
}

export function purgeOfflineFieldPackStorage(): void {
  const storage = browserStorage();
  activeFieldPackScope = null;
  if (!storage) return;

  try {
    const keys = Array.from({ length: storage.length }, (_, index) => storage.key(index))
      .filter((key): key is string => typeof key === 'string');
    for (const key of keys) {
      if (key === LEGACY_FIELD_PACK_STORAGE_KEY || key.startsWith(SCOPED_FIELD_PACK_STORAGE_PREFIX)) {
        storage.removeItem(key);
      }
    }
  } catch {
    // Privacy cleanup is best-effort in browsers that block storage access.
  }
}

function updatePack(update: Partial<OfflineFieldPack> & { readonly workspaceId?: string }): OfflineFieldPack | null {
  const existing = readOfflineFieldPack();
  const workspaceId = update.workspaceId
    ?? existing?.workspaceId
    ?? update.workspace?.workspaceId
    ?? update.claw?.workspaceId
    ?? activeFieldPackScope?.workspaceId;
  if (!workspaceId) return null;
  return writeOfflineFieldPack({
    version: 1,
    cachedAt: new Date().toISOString(),
    workspaceId,
    workspace: update.workspace ?? existing?.workspace ?? null,
    claw: update.claw ?? existing?.claw ?? null,
    dailyBrief: update.dailyBrief ?? existing?.dailyBrief ?? null,
    atReference: update.atReference ?? existing?.atReference ?? null
  });
}

function isPrivateAppCachePath(pathname: string): boolean {
  return pathname === '/app'
    || pathname.startsWith('/app/')
    || pathname === '/app-api'
    || pathname.startsWith('/app-api/');
}

async function purgePrivateRuntimeCachesDirectly(): Promise<void> {
  if (typeof window === 'undefined' || !('caches' in window)) return;

  const cacheNames = await window.caches.keys();
  await Promise.all(cacheNames
    .filter((cacheName) => cacheName.startsWith(PRIVATE_RUNTIME_CACHE_PREFIX))
    .map(async (cacheName) => {
      const cache = await window.caches.open(cacheName);
      const requests = await cache.keys();
      await Promise.all(requests
        .filter((request) => {
          try {
            return isPrivateAppCachePath(new URL(request.url).pathname);
          } catch {
            return false;
          }
        })
        .map((request) => cache.delete(request)));
    }));
}

async function requestPrivateCachePurgeFromServiceWorker(): Promise<boolean> {
  if (
    typeof navigator === 'undefined'
    || !('serviceWorker' in navigator)
    || !navigator.serviceWorker.controller
    || typeof MessageChannel === 'undefined'
  ) {
    return false;
  }

  const controller = navigator.serviceWorker.controller;
  return new Promise((resolve) => {
    const channel = new MessageChannel();
    let settled = false;
    let timeout: ReturnType<typeof setTimeout> | undefined;
    const finish = (purged: boolean) => {
      if (settled) return;
      settled = true;
      if (timeout !== undefined) clearTimeout(timeout);
      channel.port1.close();
      resolve(purged);
    };

    channel.port1.onmessage = (event) => finish(event.data?.ok === true);
    timeout = setTimeout(() => finish(false), 1_200);

    try {
      controller.postMessage({ type: PRIVATE_CACHE_PURGE_MESSAGE }, [channel.port2]);
    } catch {
      finish(false);
    }
  });
}

export async function purgePrivateAppData(): Promise<void> {
  purgeOfflineFieldPackStorage();
  if (typeof window === 'undefined') return;

  const workerPurged = await requestPrivateCachePurgeFromServiceWorker().catch(() => false);
  if (!workerPurged) {
    await purgePrivateRuntimeCachesDirectly().catch(() => undefined);
  }
}

export function cacheWorkspaceSnapshot(workspace: OfflineWorkspaceSnapshot | null | undefined): OfflineFieldPack | null {
  if (!workspace) return readOfflineFieldPack();
  return updatePack({ workspaceId: workspace.workspaceId, workspace });
}

export function readCachedWorkspaceSnapshot(): OfflineWorkspaceSnapshot | null {
  return readOfflineFieldPack()?.workspace ?? null;
}

export function cacheClawConsolePayload(claw: OfflineClawConsolePayload | null | undefined): OfflineFieldPack | null {
  if (!claw) return readOfflineFieldPack();
  return updatePack({ workspaceId: claw.workspaceId, claw });
}

export function cacheDailyBrief(dailyBrief: OfflineScoutDailyBrief | null | undefined): OfflineFieldPack | null {
  if (!dailyBrief) return readOfflineFieldPack();
  return updatePack({ dailyBrief });
}

export async function refreshOfflineFieldPack(): Promise<OfflineFieldPack> {
  const response = await fetch('/app-api/offline-pack', { cache: 'no-store' });
  if (!response.ok) {
    const message = await response.text().catch(() => '');
    throw new Error(message || `Could not refresh offline field pack (${response.status}).`);
  }

  const pack = normalizePack(await response.json());
  if (!pack) {
    throw new Error('Offline field pack response was not valid.');
  }

  const saved = writeOfflineFieldPack(pack);
  if (!saved) {
    throw new Error('Could not save offline field pack on this device.');
  }

  return saved;
}

export function offlineFieldPackLabel(pack: OfflineFieldPack | null = readOfflineFieldPack()): string {
  if (!pack) return 'No field pack saved';
  const parsed = Date.parse(pack.cachedAt);
  if (!Number.isFinite(parsed)) return 'Field pack saved';
  return `Saved ${new Date(parsed).toLocaleString([], { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}`;
}

export function offlineFieldPackSummary(pack: OfflineFieldPack | null = readOfflineFieldPack()): string {
  if (!pack) return 'No cached Scout context is saved on this device yet.';
  const docs = pack.workspace?.documents.length ?? pack.claw?.workspace.documents.length ?? 0;
  const resources = pack.workspace?.resources.length ?? pack.claw?.workspace.resources.length ?? 0;
  const messages = pack.claw?.messages.length ?? pack.workspace?.clawMessages?.length ?? 0;
  const atReference = pack.atReference?.available ? ` · AT ref ${pack.atReference.totals?.datasets ?? 0} sets` : '';
  return `${offlineFieldPackLabel(pack)} · ${docs} docs · ${resources} sources · ${messages} messages${atReference}`;
}
