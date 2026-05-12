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
  readonly providerId: 'openai-codex' | 'opencode-go';
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

export interface OfflineFieldPack {
  readonly version: 1;
  readonly cachedAt: string;
  readonly workspaceId: string;
  readonly workspace: OfflineWorkspaceSnapshot | null;
  readonly claw: OfflineClawConsolePayload | null;
  readonly dailyBrief: OfflineScoutDailyBrief | null;
}

const FIELD_PACK_STORAGE_KEY = 'hoggcountry.scout.offlineFieldPack.v1';

function storageAvailable(): boolean {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
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
    dailyBrief: isObject(input.dailyBrief) ? input.dailyBrief as unknown as OfflineScoutDailyBrief : null
  };
}

export function readOfflineFieldPack(): OfflineFieldPack | null {
  if (!storageAvailable()) return null;

  try {
    const raw = window.localStorage.getItem(FIELD_PACK_STORAGE_KEY);
    if (!raw) return null;
    return normalizePack(JSON.parse(raw));
  } catch {
    return null;
  }
}

export function writeOfflineFieldPack(pack: OfflineFieldPack): OfflineFieldPack | null {
  if (!storageAvailable()) return null;

  try {
    window.localStorage.setItem(FIELD_PACK_STORAGE_KEY, JSON.stringify(pack));
    return pack;
  } catch {
    return null;
  }
}

function updatePack(update: Partial<OfflineFieldPack> & { readonly workspaceId?: string }): OfflineFieldPack | null {
  const existing = readOfflineFieldPack();
  const workspaceId = update.workspaceId ?? existing?.workspaceId ?? update.workspace?.workspaceId ?? update.claw?.workspaceId ?? 'unknown';
  return writeOfflineFieldPack({
    version: 1,
    cachedAt: new Date().toISOString(),
    workspaceId,
    workspace: update.workspace ?? existing?.workspace ?? null,
    claw: update.claw ?? existing?.claw ?? null,
    dailyBrief: update.dailyBrief ?? existing?.dailyBrief ?? null
  });
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
  return `${offlineFieldPackLabel(pack)} · ${docs} docs · ${resources} sources · ${messages} messages`;
}
