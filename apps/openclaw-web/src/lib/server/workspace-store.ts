import { existsSync } from 'node:fs';
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  addUserBlock,
  buildStarterManual,
  buildStarterTools,
  createChecklistTool,
  createId,
  inferStandardDocumentSlotKey,
  isStandardDocumentSlotKey,
  nowIso,
  STANDARD_DOCUMENT_SLOTS,
  standardDocumentSlotForKey,
  updateProfileTimestamp,
  type ImportedDocument,
  type ImportedDocumentKind,
  type ImportedDocumentStatus,
  type ImportedDocumentVersion,
  type ImportedDocumentVisibility,
  type StandardDocumentSlotKey,
  type ManualProfile,
  type ManualSection,
  type WorkspaceResource,
  type WorkspaceResourceKind,
  type WorkspaceResourceSensitivity,
  type WorkspaceTool
} from '@hoggcountry/manual-core';
import {
  defaultScoutSkillSettings,
  normalizeScoutSkillSettings,
  setScoutSkillEnabled,
  type ScoutSkillSettings
} from '@hoggcountry/scout-skills';
import type { BetaProfileCookie } from '$lib/beta';
import { LOADOUT_CATEGORIES, LOADOUT_LIMITS, sanitizeLoadoutLink, type LoadoutCategory, type LoadoutItemInput } from '$lib/loadout';
import { OPENAI_CODEX_LOCAL_REDIRECT_URI } from '$lib/server/claw-openai-codex';

const MAX_STORED_CLAW_MESSAGES = 200;

export interface WorkspaceProviderConnection {
  readonly providerId: 'openai-codex';
  readonly label: string;
  readonly status: 'connected';
  readonly accountId: string | null;
  readonly expiresAt: string | null;
  readonly connectedAt: string;
  readonly updatedAt: string;
}

export interface WorkspaceClawSourceReceipt {
  readonly label: string;
  readonly status: string;
  readonly kind: string;
}

export interface WorkspaceClawMessage {
  readonly id: string;
  readonly role: 'user' | 'assistant';
  readonly text: string;
  readonly createdAt: string;
  readonly providerId: 'openai-codex' | 'openai' | 'opencode-go' | 'system' | null;
  readonly model: string | null;
  readonly error: boolean;
  readonly sourceReceipts?: WorkspaceClawSourceReceipt[];
}

export interface WorkspaceFactCandidate {
  readonly id: string;
  readonly kind: 'hostel' | 'resupply' | 'shuttle' | 'water' | 'closure' | 'weather_pattern' | 'gear' | 'medical' | 'other';
  readonly claimText: string;
  readonly regionSlug: string | null;
  readonly mileRangeStart: number | null;
  readonly mileRangeEnd: number | null;
  readonly sourceMessageId: string | null;
  readonly sourceRole: 'user' | 'assistant' | null;
  readonly sourceType: 'user_report' | 'delegate_extraction' | 'human_ops';
  readonly confidence: number;
  readonly status: 'pending' | 'needs_review' | 'approved' | 'rejected' | 'stale';
  readonly createdAt: string;
}

export interface WorkspaceFactCandidateInput {
  readonly kind: WorkspaceFactCandidate['kind'];
  readonly claimText: string;
  readonly regionSlug?: string | null;
  readonly mileRangeStart?: number | null;
  readonly mileRangeEnd?: number | null;
  readonly sourceMessageId?: string | null;
  readonly sourceRole?: WorkspaceFactCandidate['sourceRole'];
  readonly sourceType?: WorkspaceFactCandidate['sourceType'];
  readonly confidence?: number;
  readonly status?: WorkspaceFactCandidate['status'];
  readonly createdAt?: string;
}

export interface WorkspaceLocationFix {
  readonly id: string;
  readonly source: 'browser-gps';
  readonly recordedAt: string;
  readonly latitude: number;
  readonly longitude: number;
  readonly accuracyMeters: number | null;
  readonly nearestMile: number;
  readonly distanceToTrailMiles: number;
  readonly trailLatitude: number;
  readonly trailLongitude: number;
  readonly profileUpdated: boolean;
}

export interface WorkspaceLoadoutItem {
  readonly id: string;
  readonly name: string;
  readonly category: LoadoutCategory;
  readonly weightOz: number;
  readonly quantity: number;
  readonly worn: boolean;
  readonly consumable: boolean;
  readonly notes: string;
  readonly link: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface WorkspaceEncryptedSecret {
  readonly version: 1;
  readonly algorithm: 'aes-256-gcm';
  readonly iv: string;
  readonly tag: string;
  readonly ciphertext: string;
}

export interface WorkspacePendingOpenAICodexAuth {
  readonly state: string;
  readonly verifier: string;
  readonly authorizeUrl: string;
  readonly redirectUri: string;
  readonly createdAt: string;
}

export interface WorkspaceSnapshot {
  readonly workspaceId: string;
  readonly betaProfile: BetaProfileCookie;
  readonly profile: ManualProfile | null;
  readonly sections: ManualSection[];
  readonly documents: ImportedDocument[];
  readonly resources: WorkspaceResource[];
  readonly tools: WorkspaceTool[];
  readonly providerConnections: WorkspaceProviderConnection[];
  readonly clawMessages: WorkspaceClawMessage[];
  readonly factCandidates: WorkspaceFactCandidate[];
  readonly locationHistory: WorkspaceLocationFix[];
  readonly loadout: WorkspaceLoadoutItem[];
  readonly skillSettings: ScoutSkillSettings;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface WorkspaceRecord extends WorkspaceSnapshot {
  readonly version: 5;
  readonly openAICodexCredentials: WorkspaceEncryptedSecret | null;
  readonly pendingOpenAICodexAuth: WorkspacePendingOpenAICodexAuth | null;
}

function workspaceRoot(): string {
  if (process.env.SCOUT_WORKSPACE_DATA_DIR) {
    return resolve(process.cwd(), process.env.SCOUT_WORKSPACE_DATA_DIR);
  }

  if (process.env.OPENCLAW_WORKSPACE_DATA_DIR) {
    return resolve(process.cwd(), process.env.OPENCLAW_WORKSPACE_DATA_DIR);
  }

  const searchRoots = [process.cwd(), dirname(fileURLToPath(import.meta.url))];

  for (const root of searchRoots) {
    let cursor = root;

    for (let index = 0; index < 12; index += 1) {
      if (
        existsSync(join(cursor, 'apps/openclaw-web/package.json')) &&
        existsSync(join(cursor, 'backend/composer.json'))
      ) {
        return join(cursor, 'backend/storage/app/scout-workspaces');
      }

      const parent = dirname(cursor);
      if (parent === cursor) break;
      cursor = parent;
    }
  }

  return join(resolve(process.cwd(), 'backend'), 'storage/app/scout-workspaces');
}

function workspacePath(workspaceId: string): string {
  return join(workspaceRoot(), `${workspaceId}.json`);
}

async function ensureWorkspaceDir(): Promise<void> {
  await mkdir(workspaceRoot(), { recursive: true });
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function normalizeProviderConnections(input: unknown, createdAt: string): WorkspaceProviderConnection[] {
  if (!Array.isArray(input)) return [];

  return input
    .filter(isObject)
    .map((connection) => {
      const providerId = connection.providerId === 'openai-codex' ? 'openai-codex' : null;
      if (!providerId) return null;

      const connectedAt = typeof connection.connectedAt === 'string' && connection.connectedAt ? connection.connectedAt : createdAt;
      const updatedAt = typeof connection.updatedAt === 'string' && connection.updatedAt ? connection.updatedAt : connectedAt;

      return {
        providerId,
        label:
          typeof connection.label === 'string' && connection.label.trim().length > 0
            ? connection.label.trim()
            : 'ChatGPT connected account',
        status: 'connected' as const,
        accountId: typeof connection.accountId === 'string' && connection.accountId.trim().length > 0 ? connection.accountId.trim() : null,
        expiresAt: typeof connection.expiresAt === 'string' && connection.expiresAt ? connection.expiresAt : null,
        connectedAt,
        updatedAt
      };
    })
    .filter((connection): connection is WorkspaceProviderConnection => connection !== null);
}

function normalizeClawMessages(input: unknown): WorkspaceClawMessage[] {
  if (!Array.isArray(input)) return [];

  return input
    .filter(isObject)
    .map((message) => {
      const role = message.role === 'user' || message.role === 'assistant' ? message.role : null;
      if (!role) return null;

      const text = typeof message.text === 'string' ? message.text.trim() : '';
      if (!text) return null;

      const providerId =
        message.providerId === 'openai-codex' ||
        message.providerId === 'openai' ||
        message.providerId === 'opencode-go' ||
        message.providerId === 'system'
          ? message.providerId
          : null;
      const model = typeof message.model === 'string' && message.model.trim().length > 0 ? message.model.trim() : null;

      const sourceReceipts = Array.isArray(message.sourceReceipts)
        ? message.sourceReceipts
            .filter(isObject)
            .flatMap((receipt) => {
              const label = typeof receipt.label === 'string' ? receipt.label.trim() : '';
              const status = typeof receipt.status === 'string' ? receipt.status.trim() : '';
              const kind = typeof receipt.kind === 'string' && receipt.kind.trim() ? receipt.kind.trim() : 'source';
              return label && status ? [{ label, status, kind }] : [];
            })
            .slice(0, 8)
        : [];

      return {
        id: typeof message.id === 'string' && message.id ? message.id : createId(`claw-${role}`),
        role,
        text,
        createdAt:
          typeof message.createdAt === 'string' && message.createdAt.length > 0 ? message.createdAt : nowIso(),
        providerId,
        model,
        error: Boolean(message.error),
        ...(sourceReceipts.length > 0 ? { sourceReceipts } : {})
      };
    })
    .filter((message): message is WorkspaceClawMessage => message !== null)
    .sort((left, right) => left.createdAt.localeCompare(right.createdAt));
}

function normalizeFactCandidates(input: unknown): WorkspaceFactCandidate[] {
  if (!Array.isArray(input)) return [];

  return input
    .filter(isObject)
    .map((candidate) => {
      const kind =
        candidate.kind === 'hostel' ||
        candidate.kind === 'resupply' ||
        candidate.kind === 'shuttle' ||
        candidate.kind === 'water' ||
        candidate.kind === 'closure' ||
        candidate.kind === 'weather_pattern' ||
        candidate.kind === 'gear' ||
        candidate.kind === 'medical' ||
        candidate.kind === 'other'
          ? candidate.kind
          : null;
      const claimText = typeof candidate.claimText === 'string' ? candidate.claimText.trim() : '';
      if (!kind || !claimText) return null;

      const sourceType =
        candidate.sourceType === 'user_report' ||
        candidate.sourceType === 'delegate_extraction' ||
        candidate.sourceType === 'human_ops'
          ? candidate.sourceType
          : 'delegate_extraction';
      const sourceRole = candidate.sourceRole === 'user' || candidate.sourceRole === 'assistant' ? candidate.sourceRole : null;
      const status =
        candidate.status === 'pending' ||
        candidate.status === 'needs_review' ||
        candidate.status === 'approved' ||
        candidate.status === 'rejected' ||
        candidate.status === 'stale'
          ? candidate.status
          : 'pending';
      const confidence = typeof candidate.confidence === 'number'
        ? Math.min(1, Math.max(0, candidate.confidence))
        : 0.5;

      return {
        id: typeof candidate.id === 'string' && candidate.id ? candidate.id : createId('fact'),
        kind,
        claimText,
        regionSlug: typeof candidate.regionSlug === 'string' && candidate.regionSlug.trim().length > 0 ? candidate.regionSlug.trim() : null,
        mileRangeStart: typeof candidate.mileRangeStart === 'number' && Number.isFinite(candidate.mileRangeStart) ? candidate.mileRangeStart : null,
        mileRangeEnd: typeof candidate.mileRangeEnd === 'number' && Number.isFinite(candidate.mileRangeEnd) ? candidate.mileRangeEnd : null,
        sourceMessageId: typeof candidate.sourceMessageId === 'string' && candidate.sourceMessageId.trim().length > 0 ? candidate.sourceMessageId.trim() : null,
        sourceRole,
        sourceType,
        confidence,
        status,
        createdAt: typeof candidate.createdAt === 'string' && candidate.createdAt.length > 0 ? candidate.createdAt : nowIso()
      };
    })
    .filter((candidate): candidate is WorkspaceFactCandidate => candidate !== null)
    .sort((left, right) => right.createdAt.localeCompare(left.createdAt));
}


function finiteNumber(value: unknown): number | null {
  const numeric = typeof value === 'number' ? value : typeof value === 'string' ? Number(value) : Number.NaN;
  return Number.isFinite(numeric) ? numeric : null;
}

function normalizeLocationHistory(input: unknown): WorkspaceLocationFix[] {
  if (!Array.isArray(input)) return [];

  return input
    .filter(isObject)
    .map((fix) => {
      const latitude = finiteNumber(fix.latitude);
      const longitude = finiteNumber(fix.longitude);
      const nearestMile = finiteNumber(fix.nearestMile);
      const distanceToTrailMiles = finiteNumber(fix.distanceToTrailMiles);
      const trailLatitude = finiteNumber(fix.trailLatitude);
      const trailLongitude = finiteNumber(fix.trailLongitude);
      if (
        latitude === null || latitude < -90 || latitude > 90 ||
        longitude === null || longitude < -180 || longitude > 180 ||
        nearestMile === null || distanceToTrailMiles === null ||
        trailLatitude === null || trailLongitude === null
      ) return null;

      return {
        id: typeof fix.id === 'string' && fix.id ? fix.id : createId('loc'),
        source: 'browser-gps' as const,
        recordedAt: typeof fix.recordedAt === 'string' && fix.recordedAt ? fix.recordedAt : nowIso(),
        latitude,
        longitude,
        accuracyMeters: finiteNumber(fix.accuracyMeters),
        nearestMile,
        distanceToTrailMiles: Math.max(0, distanceToTrailMiles),
        trailLatitude,
        trailLongitude,
        profileUpdated: Boolean(fix.profileUpdated)
      };
    })
    .filter((fix): fix is WorkspaceLocationFix => fix !== null)
    .sort((left, right) => left.recordedAt.localeCompare(right.recordedAt))
    .slice(-120);
}

const LOADOUT_CATEGORY_IDS = new Set<string>(LOADOUT_CATEGORIES.map((category) => category.id));
const LOADOUT_CATEGORY_ORDER = new Map<string, number>(LOADOUT_CATEGORIES.map((category, index) => [category.id, index]));

function normalizeLoadoutCategory(value: unknown): LoadoutCategory {
  return typeof value === 'string' && LOADOUT_CATEGORY_IDS.has(value) ? value as LoadoutCategory : 'other';
}

function normalizeLoadoutWeightOz(value: unknown): number {
  const numeric = finiteNumber(value);
  return numeric !== null && numeric >= 0 ? Math.min(numeric, LOADOUT_LIMITS.maxWeightOz) : 0;
}

function normalizeLoadoutQuantity(value: unknown): number {
  const numeric = finiteNumber(value);
  return numeric !== null && numeric >= 1 ? Math.min(Math.floor(numeric), LOADOUT_LIMITS.maxQuantity) : 1;
}

function sortLoadout(items: WorkspaceLoadoutItem[]): WorkspaceLoadoutItem[] {
  return [...items].sort((left, right) =>
    (LOADOUT_CATEGORY_ORDER.get(left.category) ?? Number.MAX_SAFE_INTEGER)
      - (LOADOUT_CATEGORY_ORDER.get(right.category) ?? Number.MAX_SAFE_INTEGER)
    || left.name.localeCompare(right.name)
  );
}

function normalizeLoadout(input: unknown): WorkspaceLoadoutItem[] {
  if (!Array.isArray(input)) return [];

  return sortLoadout(
    input
      .filter(isObject)
      .map((item) => {
        const name = typeof item.name === 'string' ? item.name.trim().slice(0, LOADOUT_LIMITS.maxNameChars) : '';
        if (!name) return null;

        const createdAt = typeof item.createdAt === 'string' && item.createdAt ? item.createdAt : nowIso();

        return {
          id: typeof item.id === 'string' && item.id ? item.id : createId('loadout'),
          name,
          category: normalizeLoadoutCategory(item.category),
          weightOz: normalizeLoadoutWeightOz(item.weightOz),
          quantity: normalizeLoadoutQuantity(item.quantity),
          worn: Boolean(item.worn),
          consumable: Boolean(item.consumable),
          notes: typeof item.notes === 'string' ? item.notes.trim().slice(0, LOADOUT_LIMITS.maxNotesChars) : '',
          link: sanitizeLoadoutLink(item.link),
          createdAt,
          updatedAt: typeof item.updatedAt === 'string' && item.updatedAt ? item.updatedAt : createdAt
        };
      })
      .filter((item): item is WorkspaceLoadoutItem => item !== null)
      .slice(0, LOADOUT_LIMITS.maxItems)
  );
}

const DOCUMENT_STATUSES = ['draft', 'needs-review', 'active', 'archived'] as const satisfies readonly ImportedDocumentStatus[];
const DOCUMENT_VISIBILITIES = ['private', 'trusted-link', 'public'] as const satisfies readonly ImportedDocumentVisibility[];

function normalizeDocumentStatus(value: unknown, fallback: ImportedDocumentStatus): ImportedDocumentStatus {
  return typeof value === 'string' && (DOCUMENT_STATUSES as readonly string[]).includes(value) ? value as ImportedDocumentStatus : fallback;
}

function normalizeDocumentVisibility(value: unknown): ImportedDocumentVisibility {
  return typeof value === 'string' && (DOCUMENT_VISIBILITIES as readonly string[]).includes(value) ? value as ImportedDocumentVisibility : 'private';
}

const RESOURCE_KINDS = ['file', 'url', 'note', 'official-source'] as const satisfies readonly WorkspaceResourceKind[];
const RESOURCE_SENSITIVITIES = ['normal', 'private', 'sensitive', 'financial', 'medical'] as const satisfies readonly WorkspaceResourceSensitivity[];

function normalizeResourceKind(value: unknown): WorkspaceResourceKind {
  return typeof value === 'string' && (RESOURCE_KINDS as readonly string[]).includes(value) ? value as WorkspaceResourceKind : 'note';
}

function normalizeResourceSensitivity(value: unknown): WorkspaceResourceSensitivity {
  return typeof value === 'string' && (RESOURCE_SENSITIVITIES as readonly string[]).includes(value) ? value as WorkspaceResourceSensitivity : 'private';
}

function normalizeWorkspaceResources(input: unknown, workspaceId: string): WorkspaceResource[] {
  if (!Array.isArray(input)) return [];

  return input
    .filter(isObject)
    .map((raw) => {
      const title = typeof raw.title === 'string' && raw.title.trim() ? raw.title.trim() : 'Untitled resource';
      const createdAt = typeof raw.createdAt === 'string' && raw.createdAt ? raw.createdAt : nowIso();
      const updatedAt = typeof raw.updatedAt === 'string' && raw.updatedAt ? raw.updatedAt : createdAt;
      const status = raw.status === 'processing' || raw.status === 'ready' || raw.status === 'failed' || raw.status === 'archived' ? raw.status : 'ready';

      return {
        id: typeof raw.id === 'string' && raw.id ? raw.id : createId('resource'),
        workspaceId: typeof raw.workspaceId === 'string' && raw.workspaceId ? raw.workspaceId : workspaceId,
        kind: normalizeResourceKind(raw.kind),
        title,
        sourceUri: typeof raw.sourceUri === 'string' && raw.sourceUri.trim() ? raw.sourceUri.trim() : null,
        originalFileName: typeof raw.originalFileName === 'string' && raw.originalFileName.trim() ? raw.originalFileName.trim() : null,
        mimeType: typeof raw.mimeType === 'string' && raw.mimeType.trim() ? raw.mimeType.trim() : null,
        status,
        sensitivity: normalizeResourceSensitivity(raw.sensitivity),
        searchable: raw.searchable !== false,
        extractedText: typeof raw.extractedText === 'string' ? raw.extractedText : null,
        summary: typeof raw.summary === 'string' ? raw.summary.trim() : null,
        addedBy: raw.addedBy === 'scout' || raw.addedBy === 'system' ? raw.addedBy : 'user',
        createdAt,
        updatedAt,
        sizeBytes: typeof raw.sizeBytes === 'number' && Number.isFinite(raw.sizeBytes) ? Math.max(0, Math.floor(raw.sizeBytes)) : undefined
      };
    })
    .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
}

function normalizeStandardDocumentSlotKey(raw: Record<string, unknown>, title: string): StandardDocumentSlotKey | null {
  if (isStandardDocumentSlotKey(raw.slotKey)) return raw.slotKey;
  return inferStandardDocumentSlotKey(title);
}

function documentMatchesSlot(document: ImportedDocument, slotKey: StandardDocumentSlotKey): boolean {
  return document.slotKey === slotKey || inferStandardDocumentSlotKey(document.title) === slotKey;
}

function normalizeDocumentVersion(input: unknown, document: ImportedDocument, fallbackNumber: number): ImportedDocumentVersion | null {
  if (!isObject(input)) return null;

  const textContent = typeof input.textContent === 'string' ? input.textContent : '';
  const createdAt = typeof input.createdAt === 'string' && input.createdAt ? input.createdAt : document.importedAt;

  return {
    id: typeof input.id === 'string' && input.id ? input.id : createId('doc-version'),
    documentId: document.id,
    versionNumber: typeof input.versionNumber === 'number' && Number.isFinite(input.versionNumber) && input.versionNumber > 0
      ? Math.floor(input.versionNumber)
      : fallbackNumber,
    title: typeof input.title === 'string' && input.title.trim() ? input.title.trim() : document.title,
    textContent: textContent || document.textContent,
    note: typeof input.note === 'string' ? input.note.trim() : document.note,
    author: input.author === 'user' || input.author === 'scout' || input.author === 'system' ? input.author : document.rights === 'assistant-generated' ? 'scout' : 'user',
    sourceMessageId: typeof input.sourceMessageId === 'string' && input.sourceMessageId.trim() ? input.sourceMessageId.trim() : null,
    revisionPrompt: typeof input.revisionPrompt === 'string' && input.revisionPrompt.trim() ? input.revisionPrompt.trim() : null,
    createdAt,
    sizeBytes: typeof input.sizeBytes === 'number' && Number.isFinite(input.sizeBytes)
      ? Math.max(0, Math.floor(input.sizeBytes))
      : Buffer.byteLength(textContent || document.textContent, 'utf8')
  };
}

function initialDocumentVersion(document: ImportedDocument, author: ImportedDocumentVersion['author']): ImportedDocumentVersion {
  return {
    id: document.currentVersionId || `${document.id}:version:1`,
    documentId: document.id,
    versionNumber: 1,
    title: document.title,
    textContent: document.textContent,
    note: document.note,
    author,
    sourceMessageId: null,
    revisionPrompt: null,
    createdAt: document.importedAt,
    sizeBytes: document.sizeBytes
  };
}

function normalizeImportedDocuments(input: unknown): ImportedDocument[] {
  if (!Array.isArray(input)) return [];

  return input
    .filter(isObject)
    .map((raw) => {
      const id = typeof raw.id === 'string' && raw.id ? raw.id : createId('doc');
      const title = typeof raw.title === 'string' && raw.title.trim() ? raw.title.trim() : 'Untitled document';
      const fileName = typeof raw.fileName === 'string' && raw.fileName.trim() ? raw.fileName.trim() : `${slugifyDocumentTitle(title)}.md`;
      const kind = raw.kind === 'pdf' || raw.kind === 'markdown' || raw.kind === 'text' || raw.kind === 'html' ? raw.kind : 'text';
      const slotKey = normalizeStandardDocumentSlotKey(raw, title);
      const rights = raw.rights === 'assistant-generated' ? 'assistant-generated' : 'user-imported';
      const importedAt = typeof raw.importedAt === 'string' && raw.importedAt ? raw.importedAt : nowIso();
      const textContent = typeof raw.textContent === 'string' ? raw.textContent : '';
      const note = typeof raw.note === 'string' ? raw.note.trim() : '';
      const baseDocument: ImportedDocument = {
        id,
        title,
        fileName,
        kind,
        slotKey,
        rights,
        status: normalizeDocumentStatus(raw.status, 'active'),
        visibility: normalizeDocumentVisibility(raw.visibility),
        searchable: raw.searchable !== false,
        textContent,
        note,
        importedAt,
        updatedAt: typeof raw.updatedAt === 'string' && raw.updatedAt ? raw.updatedAt : importedAt,
        sizeBytes: typeof raw.sizeBytes === 'number' && Number.isFinite(raw.sizeBytes) ? Math.max(0, Math.floor(raw.sizeBytes)) : Buffer.byteLength(textContent, 'utf8')
      };
      const normalizedVersions = Array.isArray(raw.versions)
        ? raw.versions
            .map((version, index) => normalizeDocumentVersion(version, baseDocument, index + 1))
            .filter((version): version is ImportedDocumentVersion => version !== null)
        : [];
      const versions = (normalizedVersions.length > 0 ? normalizedVersions : [initialDocumentVersion(baseDocument, rights === 'assistant-generated' ? 'scout' : 'user')])
        .sort((left, right) => left.versionNumber - right.versionNumber)
        .map((version, index) => ({ ...version, versionNumber: index + 1 }));
      const currentVersionId = typeof raw.currentVersionId === 'string' && versions.some((version) => version.id === raw.currentVersionId)
        ? raw.currentVersionId
        : versions.at(-1)?.id;
      const currentVersion = versions.find((version) => version.id === currentVersionId) ?? versions.at(-1);

      return {
        ...baseDocument,
        title: currentVersion?.title ?? baseDocument.title,
        textContent: currentVersion?.textContent ?? baseDocument.textContent,
        note: currentVersion?.note ?? baseDocument.note,
        sizeBytes: currentVersion?.sizeBytes ?? baseDocument.sizeBytes,
        currentVersionId,
        versions
      };
    })
    .sort((left, right) => (right.updatedAt ?? right.importedAt).localeCompare(left.updatedAt ?? left.importedAt));
}

function createNextDocumentVersion(
  document: ImportedDocument,
  input: {
    title?: string;
    textContent: string;
    note?: string;
    author: ImportedDocumentVersion['author'];
    sourceMessageId?: string | null;
    revisionPrompt?: string | null;
    createdAt: string;
  }
): ImportedDocumentVersion {
  const versions = document.versions && document.versions.length > 0 ? document.versions : [initialDocumentVersion(document, document.rights === 'assistant-generated' ? 'scout' : 'user')];

  return {
    id: createId('doc-version'),
    documentId: document.id,
    versionNumber: versions.length + 1,
    title: input.title?.trim() || document.title,
    textContent: input.textContent,
    note: input.note?.trim() ?? document.note,
    author: input.author,
    sourceMessageId: input.sourceMessageId?.trim() || null,
    revisionPrompt: input.revisionPrompt?.trim() || null,
    createdAt: input.createdAt,
    sizeBytes: Buffer.byteLength(input.textContent, 'utf8')
  };
}

function withInitialDocumentVersion(
  document: ImportedDocument,
  author: ImportedDocumentVersion['author'],
  status: ImportedDocumentStatus = 'active'
): ImportedDocument {
  const version = initialDocumentVersion(document, author);
  return {
    ...document,
    status,
    visibility: document.visibility ?? 'private',
    updatedAt: document.updatedAt ?? document.importedAt,
    currentVersionId: version.id,
    versions: [version]
  };
}

function applyDocumentVersion(
  document: ImportedDocument,
  version: ImportedDocumentVersion,
  status: ImportedDocumentStatus,
  updatedAt = version.createdAt
): ImportedDocument {
  const existingVersions = document.versions && document.versions.length > 0 ? document.versions : [initialDocumentVersion(document, document.rights === 'assistant-generated' ? 'scout' : 'user')];
  const versions = [...existingVersions.filter((item) => item.id !== version.id), version]
    .sort((left, right) => left.versionNumber - right.versionNumber)
    .map((item, index) => ({ ...item, versionNumber: index + 1 }));
  const applied = versions.find((item) => item.id === version.id) ?? version;

  return {
    ...document,
    title: applied.title,
    textContent: applied.textContent,
    note: applied.note,
    status,
    visibility: document.visibility ?? 'private',
    updatedAt,
    sizeBytes: applied.sizeBytes,
    currentVersionId: applied.id,
    versions
  };
}

function normalizeEncryptedSecret(input: unknown): WorkspaceEncryptedSecret | null {
  if (!isObject(input)) return null;
  if (
    input.version !== 1 ||
    input.algorithm !== 'aes-256-gcm' ||
    typeof input.iv !== 'string' ||
    typeof input.tag !== 'string' ||
    typeof input.ciphertext !== 'string'
  ) {
    return null;
  }

  return {
    version: 1,
    algorithm: 'aes-256-gcm',
    iv: input.iv,
    tag: input.tag,
    ciphertext: input.ciphertext
  };
}

function normalizePendingOpenAICodexAuth(input: unknown): WorkspacePendingOpenAICodexAuth | null {
  if (!isObject(input)) return null;
  if (
    typeof input.state !== 'string' ||
    typeof input.verifier !== 'string' ||
    typeof input.authorizeUrl !== 'string' ||
    typeof input.createdAt !== 'string'
  ) {
    return null;
  }

  return {
    state: input.state,
    verifier: input.verifier,
    authorizeUrl: input.authorizeUrl,
    redirectUri:
      typeof input.redirectUri === 'string' && input.redirectUri.trim().length > 0
        ? input.redirectUri.trim()
        : OPENAI_CODEX_LOCAL_REDIRECT_URI,
    createdAt: input.createdAt
  };
}

function sanitizeRecord(record: WorkspaceRecord): WorkspaceSnapshot {
  return {
    workspaceId: record.workspaceId,
    betaProfile: record.betaProfile,
    profile: record.profile,
    sections: record.sections,
    documents: record.documents,
    resources: record.resources,
    tools: record.tools,
    providerConnections: record.providerConnections,
    clawMessages: record.clawMessages,
    factCandidates: record.factCandidates,
    locationHistory: record.locationHistory,
    loadout: record.loadout,
    skillSettings: record.skillSettings,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt
  };
}

function baseRecord(workspaceId: string, betaProfile: BetaProfileCookie): WorkspaceRecord {
  const timestamp = nowIso();

  return {
    version: 5,
    workspaceId,
    betaProfile,
    profile: null,
    sections: [],
    documents: [],
    resources: [],
    tools: [],
    providerConnections: [],
    clawMessages: [],
    factCandidates: [],
    locationHistory: [],
    loadout: [],
    skillSettings: defaultScoutSkillSettings(timestamp),
    openAICodexCredentials: null,
    pendingOpenAICodexAuth: null,
    createdAt: timestamp,
    updatedAt: timestamp
  };
}

function normalizeRecord(raw: unknown, workspaceId: string, betaProfile: BetaProfileCookie): WorkspaceRecord {
  const fallback = baseRecord(workspaceId, betaProfile);
  if (!isObject(raw)) return fallback;

  const createdAt = typeof raw.createdAt === 'string' && raw.createdAt ? raw.createdAt : fallback.createdAt;
  const updatedAt = typeof raw.updatedAt === 'string' && raw.updatedAt ? raw.updatedAt : createdAt;

  return {
    version: 5,
    workspaceId,
    betaProfile: isObject(raw.betaProfile)
      ? {
          email: typeof raw.betaProfile.email === 'string' ? raw.betaProfile.email : betaProfile.email,
          name: typeof raw.betaProfile.name === 'string' ? raw.betaProfile.name : betaProfile.name,
          trailName: typeof raw.betaProfile.trailName === 'string' ? raw.betaProfile.trailName : betaProfile.trailName
        }
      : betaProfile,
    profile: isObject(raw.profile) ? (raw.profile as unknown as ManualProfile) : null,
    sections: Array.isArray(raw.sections) ? (raw.sections as ManualSection[]) : [],
    documents: normalizeImportedDocuments(raw.documents),
    resources: normalizeWorkspaceResources(raw.resources, workspaceId),
    tools: Array.isArray(raw.tools) ? (raw.tools as WorkspaceTool[]) : [],
    providerConnections: normalizeProviderConnections(raw.providerConnections, createdAt),
    clawMessages: normalizeClawMessages(raw.clawMessages),
    factCandidates: normalizeFactCandidates(raw.factCandidates),
    locationHistory: normalizeLocationHistory(raw.locationHistory),
    loadout: normalizeLoadout(raw.loadout),
    skillSettings: normalizeScoutSkillSettings(raw.skillSettings, updatedAt),
    openAICodexCredentials: normalizeEncryptedSecret(raw.openAICodexCredentials),
    pendingOpenAICodexAuth: normalizePendingOpenAICodexAuth(raw.pendingOpenAICodexAuth),
    createdAt,
    updatedAt
  };
}

async function readRecord(workspaceId: string, betaProfile: BetaProfileCookie): Promise<WorkspaceRecord | null> {
  try {
    const raw = await readFile(workspacePath(workspaceId), 'utf8');
    return normalizeRecord(JSON.parse(raw), workspaceId, betaProfile);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return null;
    }

    throw error;
  }
}

async function writeRecord(record: WorkspaceRecord): Promise<void> {
  await ensureWorkspaceDir();

  const target = workspacePath(record.workspaceId);
  const temp = `${target}.${createId('tmp').replace(/[^a-z0-9:-]/giu, '')}`;
  await mkdir(dirname(target), { recursive: true });
  await writeFile(temp, JSON.stringify(record, null, 2), 'utf8');
  await rename(temp, target);
}

export async function getWorkspaceRecord(
  workspaceId: string,
  betaProfile: BetaProfileCookie
): Promise<WorkspaceRecord> {
  const existing = await readRecord(workspaceId, betaProfile);
  if (!existing) {
    const record = baseRecord(workspaceId, betaProfile);
    await writeRecord(record);
    return record;
  }

  if (
    existing.betaProfile.email !== betaProfile.email ||
    existing.betaProfile.name !== betaProfile.name ||
    existing.betaProfile.trailName !== betaProfile.trailName
  ) {
    const updated: WorkspaceRecord = {
      ...existing,
      betaProfile,
      updatedAt: nowIso()
    };
    await writeRecord(updated);
    return updated;
  }

  return existing;
}

export async function getWorkspace(
  workspaceId: string,
  betaProfile: BetaProfileCookie
): Promise<WorkspaceSnapshot> {
  return sanitizeRecord(await getWorkspaceRecord(workspaceId, betaProfile));
}

export async function updateWorkspaceScoutSkillSetting(
  workspaceId: string,
  betaProfile: BetaProfileCookie,
  skillId: string,
  enabled: boolean
): Promise<WorkspaceSnapshot> {
  const record = await getWorkspaceRecord(workspaceId, betaProfile);
  return sanitizeRecord(
    await persist({
      ...record,
      skillSettings: setScoutSkillEnabled(record.skillSettings, skillId, enabled, nowIso())
    })
  );
}

async function persist(record: WorkspaceRecord): Promise<WorkspaceRecord> {
  const updated: WorkspaceRecord = {
    ...record,
    updatedAt: nowIso()
  };
  await writeRecord(updated);
  return updated;
}

const VALID_DIRECTIONS = ['NOBO', 'SOBO'] as const satisfies readonly ManualProfile['direction'][];
const VALID_BUDGET_TIERS = ['dirtbag', 'balanced', 'comfortable'] as const satisfies readonly ManualProfile['budgetTier'][];
const VALID_EXPERIENCE_LEVELS = ['first-thru', 'some-backpacking', 'section-hiker', 'trail-veteran'] as const satisfies readonly ManualProfile['experienceLevel'][];
const VALID_GEAR_PHILOSOPHIES = ['ultralight', 'balanced', 'comfort-first'] as const satisfies readonly ManualProfile['gearPhilosophy'][];
const VALID_TOWN_STYLES = ['quick-hit', 'balanced', 'lingering'] as const satisfies readonly ManualProfile['townStyle'][];
const VALID_REFLECTION_STYLES = ['faith-informed', 'practical-only'] as const satisfies readonly ManualProfile['reflectionStyle'][];
const VALID_SHELTER_PREFERENCES = ['tent-first', 'shelter-first', 'mixed'] as const satisfies readonly ManualProfile['shelterPreference'][];

function stringOr(value: unknown, fallback: string): string {
  return typeof value === 'string' && value.trim() ? value.trim() : fallback;
}

function finiteNumberOr(value: unknown, fallback: number, options: { min?: number; max?: number } = {}): number {
  const numeric = typeof value === 'number' ? value : typeof value === 'string' ? Number(value) : Number.NaN;
  if (!Number.isFinite(numeric)) return fallback;
  const min = options.min ?? Number.NEGATIVE_INFINITY;
  const max = options.max ?? Number.POSITIVE_INFINITY;
  return Math.min(max, Math.max(min, numeric));
}

function oneOf<const T extends readonly string[]>(value: unknown, allowed: T, fallback: T[number]): T[number] {
  return typeof value === 'string' && (allowed as readonly string[]).includes(value) ? value : fallback;
}

function normalizeManualProfileInput(profile: Partial<ManualProfile> | null | undefined, betaProfile: BetaProfileCookie): ManualProfile {
  const input = profile && typeof profile === 'object' ? profile : {};
  const timestamp = nowIso();
  const createdAt = stringOr(input.createdAt, timestamp);
  const trailName = stringOr(input.trailName, betaProfile.trailName || betaProfile.name || 'Hiker');

  return {
    id: stringOr(input.id, createId('profile')),
    trailName,
    startDate: stringOr(input.startDate, new Date().toISOString().slice(0, 10)),
    direction: oneOf(input.direction, VALID_DIRECTIONS, 'NOBO'),
    currentMile: finiteNumberOr(input.currentMile, 0, { min: 0 }),
    targetPace: finiteNumberOr(input.targetPace, 10, { min: 1, max: 35 }),
    zeroDaysPerMonth: finiteNumberOr(input.zeroDaysPerMonth, 2, { min: 0, max: 31 }),
    budgetTier: oneOf(input.budgetTier, VALID_BUDGET_TIERS, 'balanced'),
    experienceLevel: oneOf(input.experienceLevel, VALID_EXPERIENCE_LEVELS, 'first-thru'),
    gearPhilosophy: oneOf(input.gearPhilosophy, VALID_GEAR_PHILOSOPHIES, 'balanced'),
    townStyle: oneOf(input.townStyle, VALID_TOWN_STYLES, 'balanced'),
    reflectionStyle: oneOf(input.reflectionStyle, VALID_REFLECTION_STYLES, 'faith-informed'),
    shelterPreference: oneOf(input.shelterPreference, VALID_SHELTER_PREFERENCES, 'mixed'),
    waterCapacityLiters: finiteNumberOr(input.waterCapacityLiters, 2, { min: 0, max: 12 }),
    healthNotes: typeof input.healthNotes === 'string' ? input.healthNotes.trim() : '',
    createdAt,
    updatedAt: stringOr(input.updatedAt, timestamp)
  };
}

function upsertProviderConnection(
  connections: WorkspaceProviderConnection[],
  connection: WorkspaceProviderConnection
): WorkspaceProviderConnection[] {
  return [connection, ...connections.filter((item) => item.providerId !== connection.providerId)];
}

export async function initializeWorkspace(
  workspaceId: string,
  betaProfile: BetaProfileCookie,
  profile: Partial<ManualProfile> | null | undefined
): Promise<WorkspaceSnapshot> {
  const record = await getWorkspaceRecord(workspaceId, betaProfile);
  const normalizedProfile = updateProfileTimestamp(normalizeManualProfileInput(profile, betaProfile));

  return sanitizeRecord(
    await persist({
      ...record,
      betaProfile,
      profile: normalizedProfile,
      sections: buildStarterManual(normalizedProfile),
      documents: record.documents,
      tools: record.tools.length > 0 ? record.tools : buildStarterTools(normalizedProfile)
    })
  );
}

export async function setWorkspaceCurrentMile(
  workspaceId: string,
  betaProfile: BetaProfileCookie,
  currentMile: number
): Promise<WorkspaceSnapshot> {
  const record = await getWorkspaceRecord(workspaceId, betaProfile);
  if (!record.profile) {
    return sanitizeRecord(record);
  }

  return sanitizeRecord(
    await persist({
      ...record,
      profile: updateProfileTimestamp({
        ...record.profile,
        currentMile: Number.isFinite(currentMile) ? Math.max(0, currentMile) : record.profile.currentMile
      })
    })
  );
}


export interface WorkspaceLocationFixInput {
  readonly latitude: number;
  readonly longitude: number;
  readonly accuracyMeters: number | null;
  readonly nearestMile: number;
  readonly distanceToTrailMiles: number;
  readonly trailLatitude: number;
  readonly trailLongitude: number;
  readonly profileUpdated: boolean;
}

const LOCATION_HISTORY_MAX_FIXES = 120;
const LOCATION_HISTORY_NEAR_TRAIL_MILES = 2;
const LOCATION_HISTORY_MIN_MILE_DELTA = 0.25;
const LOCATION_HISTORY_MIN_INTERVAL_MS = 20 * 60 * 1000;
const LOCATION_HISTORY_KEEPALIVE_MS = 60 * 60 * 1000;

function shouldAppendLocationFix(history: readonly WorkspaceLocationFix[], fix: WorkspaceLocationFix, nowMs: number): boolean {
  if (fix.distanceToTrailMiles > LOCATION_HISTORY_NEAR_TRAIL_MILES) return false;
  const previous = history.at(-1);
  if (!previous) return true;

  const elapsedMs = nowMs - Date.parse(previous.recordedAt);
  const mileDelta = Math.abs(fix.nearestMile - previous.nearestMile);
  if (mileDelta >= LOCATION_HISTORY_MIN_MILE_DELTA && elapsedMs >= LOCATION_HISTORY_MIN_INTERVAL_MS) return true;
  return elapsedMs >= LOCATION_HISTORY_KEEPALIVE_MS;
}

export async function recordWorkspaceLocationFix(
  workspaceId: string,
  betaProfile: BetaProfileCookie,
  input: WorkspaceLocationFixInput
): Promise<WorkspaceSnapshot> {
  const record = await getWorkspaceRecord(workspaceId, betaProfile);
  const recordedAt = nowIso();
  const fix: WorkspaceLocationFix = {
    id: createId('loc'),
    source: 'browser-gps',
    recordedAt,
    latitude: input.latitude,
    longitude: input.longitude,
    accuracyMeters: Number.isFinite(input.accuracyMeters) ? input.accuracyMeters : null,
    nearestMile: input.nearestMile,
    distanceToTrailMiles: input.distanceToTrailMiles,
    trailLatitude: input.trailLatitude,
    trailLongitude: input.trailLongitude,
    profileUpdated: input.profileUpdated
  };

  if (!shouldAppendLocationFix(record.locationHistory, fix, Date.parse(recordedAt))) {
    return sanitizeRecord(record);
  }

  return sanitizeRecord(
    await persist({
      ...record,
      locationHistory: [...record.locationHistory, fix].slice(-LOCATION_HISTORY_MAX_FIXES)
    })
  );
}

export async function addWorkspaceManualNote(
  workspaceId: string,
  betaProfile: BetaProfileCookie,
  sectionId: string,
  title: string,
  content: string
): Promise<WorkspaceSnapshot> {
  const record = await getWorkspaceRecord(workspaceId, betaProfile);

  return sanitizeRecord(
    await persist({
      ...record,
      sections: addUserBlock(record.sections, sectionId, title, content)
    })
  );
}

function detectDocumentKind(file: File): ImportedDocumentKind {
  const fileName = file.name.toLowerCase();
  if (file.type === 'application/pdf' || fileName.endsWith('.pdf')) return 'pdf';
  if (file.type === 'text/html' || fileName.endsWith('.html') || fileName.endsWith('.htm')) return 'html';
  if (fileName.endsWith('.md') || fileName.endsWith('.markdown')) return 'markdown';
  return 'text';
}

function htmlToText(html: string): string {
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

async function fileText(file: File, kind: ImportedDocumentKind): Promise<string> {
  if (kind === 'pdf') return '';
  const raw = await file.text();
  return kind === 'html' ? htmlToText(raw) : raw.replace(/\s+/g, ' ').trim();
}

function slugifyDocumentTitle(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/giu, '-')
    .replace(/^-+|-+$/gu, '') || 'scout-plan';
}

function previousUserPrompt(messages: WorkspaceClawMessage[], startIndex: number): string {
  for (let index = startIndex - 1; index >= 0; index -= 1) {
    const message = messages[index];
    if (message?.role === 'user') {
      return message.text.trim();
    }
  }

  return '';
}

function inferScoutDocumentTitle(prompt: string, explicitTitle?: string | null): string {
  const trimmedTitle = explicitTitle?.trim();
  if (trimmedTitle) return trimmedTitle;

  if (/7\s*-?\s*day|next\s+week/iu.test(prompt)) return '7-day trail plan';
  if (/loadout|pack|gear|base\s*weight/iu.test(prompt)) return 'Loadout plan';
  if (/carry|resupply|food/iu.test(prompt)) return 'Next food carry plan';
  if (/budget|finance|money|cost/iu.test(prompt)) return 'Budget and finances';
  if (/health|weight|injur|knee|feet|pain|body/iu.test(prompt)) return 'Health and body notes';
  if (/training|train|workout|conditioning/iu.test(prompt)) return 'Training plan';
  if (/safety|emergency|risk|bail|evac/iu.test(prompt)) return 'Safety and emergency plan';
  if (/hostel|town/iu.test(prompt)) return 'Town and hostel plan';
  if (/weakest\s+link|tighten/iu.test(prompt)) return 'Scout trail note';
  return 'Saved Scout plan';
}

const SCOUT_STARTER_DOCUMENTS = STANDARD_DOCUMENT_SLOTS;

function buildScoutStarterMarkdown(
  title: string,
  purpose: string,
  starterQuestions: readonly string[],
  meta: {
    readonly trailName: string;
    readonly currentMile: number | null;
    readonly savedAt: string;
  }
): string {
  return [
    `# ${title}`,
    '',
    'Living Scout document. Scout should revise this in place as conversations reveal better information.',
    '',
    `Created: ${new Date(meta.savedAt).toLocaleString()}`,
    `Trail name: ${meta.trailName || 'Unknown'}`,
    meta.currentMile !== null ? `Current mile: ${meta.currentMile.toFixed(1)}` : null,
    '',
    '## Purpose',
    '',
    purpose,
    '',
    '## Current snapshot',
    '',
    '- Not filled in yet.',
    '',
    '## Known facts',
    '',
    '- Not filled in yet.',
    '',
    '## Open questions for Scout',
    '',
    ...starterQuestions.map((question) => `- ${question}`),
    '',
    '## Next update triggers',
    '',
    '- New trail update, current mile change, town stop, gear change, health/body change, weather risk, or budget change.',
    '',
    '## Change history',
    '',
    `- ${new Date(meta.savedAt).toLocaleDateString()}: Starter document created.`
  ].filter((value): value is string => value !== null).join('\n').trim();
}

export async function seedWorkspaceScoutDocuments(
  workspaceId: string,
  betaProfile: BetaProfileCookie
): Promise<WorkspaceSnapshot> {
  const record = await getWorkspaceRecord(workspaceId, betaProfile);
  const existingTitles = new Set(record.documents.map((document) => document.title.toLowerCase()));
  const existingSlots = new Set(record.documents.map((document) => document.slotKey ?? inferStandardDocumentSlotKey(document.title)).filter(Boolean));
  const savedAt = nowIso();
  const currentMile = record.profile && Number.isFinite(record.profile.currentMile) ? record.profile.currentMile : null;
  const trailName = betaProfile.trailName || betaProfile.name || 'Unknown';

  const starterDocuments: ImportedDocument[] = SCOUT_STARTER_DOCUMENTS
    .filter((starter) => !existingTitles.has(starter.title.toLowerCase()) && !existingSlots.has(starter.key))
    .map((starter) => {
      const markdown = buildScoutStarterMarkdown(starter.title, starter.purpose, starter.starterQuestions, {
        trailName,
        currentMile,
        savedAt
      });

      return withInitialDocumentVersion(
        {
          id: createId('doc'),
          title: starter.title,
          fileName: `${slugifyDocumentTitle(starter.title)}.md`,
          kind: 'markdown',
          slotKey: starter.key,
          rights: 'assistant-generated',
          status: 'draft',
          visibility: 'private',
          searchable: true,
          textContent: markdown,
          note: 'Living Scout starter document. Talk to Scout to fill and revise this plan in place.',
          importedAt: savedAt,
          updatedAt: savedAt,
          sizeBytes: Buffer.byteLength(markdown, 'utf8')
        },
        'scout',
        'draft'
      );
    });

  if (starterDocuments.length === 0) {
    return sanitizeRecord(record);
  }

  return sanitizeRecord(
    await persist({
      ...record,
      documents: [...starterDocuments, ...record.documents].sort((left, right) => (right.updatedAt ?? right.importedAt).localeCompare(left.updatedAt ?? left.importedAt))
    })
  );
}

function buildScoutDocumentMarkdown(
  title: string,
  prompt: string,
  reply: string,
  meta: {
    readonly trailName: string;
    readonly currentMile: number | null;
    readonly savedAt: string;
  }
): string {
  const parts = [
    `# ${title}`,
    '',
    `Saved from Scout on ${new Date(meta.savedAt).toLocaleString()}.`,
    `Trail name: ${meta.trailName || 'Unknown'}`,
    meta.currentMile !== null ? `Current mile: ${meta.currentMile.toFixed(1)}` : null,
    prompt ? `## Source prompt\n\n${prompt}` : null,
    '## Saved reply',
    '',
    reply.trim()
  ].filter((value): value is string => Boolean(value && value.trim().length > 0));

  return parts.join('\n\n').trim();
}

export async function importWorkspaceDocuments(
  workspaceId: string,
  betaProfile: BetaProfileCookie,
  files: File[]
): Promise<WorkspaceSnapshot> {
  const record = await getWorkspaceRecord(workspaceId, betaProfile);
  const imported: ImportedDocument[] = [];

  for (const file of files) {
    const kind = detectDocumentKind(file);
    const searchable = kind !== 'pdf';

    const importedAt = nowIso();
    const textContent = await fileText(file, kind);

    imported.push(
      withInitialDocumentVersion(
        {
          id: createId('doc'),
          title: file.name.replace(/\.[^.]+$/u, ''),
          fileName: file.name,
          kind,
          rights: 'user-imported',
          status: 'active',
          visibility: 'private',
          searchable,
          textContent,
          note: searchable
            ? ''
            : 'Tracked in your private workspace. PDF text extraction can deepen later; paste/export text for Scout to read it today.',
          importedAt,
          updatedAt: importedAt,
          sizeBytes: file.size
        },
        'user',
        'active'
      )
    );
  }

  return sanitizeRecord(
    await persist({
      ...record,
      documents: [...imported, ...record.documents].sort((left, right) => (right.updatedAt ?? right.importedAt).localeCompare(left.updatedAt ?? left.importedAt))
    })
  );
}

const MAX_STORED_RESOURCE_TEXT_CHARS = 80_000;

function storedResourceText(text: string): string {
  const normalized = text.trim();
  return normalized.length > MAX_STORED_RESOURCE_TEXT_CHARS
    ? `${normalized.slice(0, MAX_STORED_RESOURCE_TEXT_CHARS).trimEnd()}\n\n[Resource text truncated for beta storage.]`
    : normalized;
}

function resourceSummary(text: string): string {
  const normalized = text.replace(/\s+/gu, ' ').trim();
  return normalized.length > 240 ? `${normalized.slice(0, 240).trimEnd()}…` : normalized;
}

export async function importWorkspaceResources(
  workspaceId: string,
  betaProfile: BetaProfileCookie,
  files: File[]
): Promise<WorkspaceSnapshot> {
  const record = await getWorkspaceRecord(workspaceId, betaProfile);
  const imported: WorkspaceResource[] = [];

  for (const file of files) {
    const kind = detectDocumentKind(file);
    const createdAt = nowIso();
    const extractedText = storedResourceText(await fileText(file, kind));
    const searchable = extractedText.trim().length > 0;

    imported.push({
      id: createId('resource'),
      workspaceId,
      kind: 'file',
      title: file.name.replace(/\.[^.]+$/u, '') || file.name,
      sourceUri: null,
      originalFileName: file.name,
      mimeType: file.type || null,
      status: 'ready',
      sensitivity: 'private',
      searchable,
      extractedText: extractedText || null,
      summary: searchable
        ? resourceSummary(extractedText)
        : 'Tracked in your private Resources locker. PDF text extraction can deepen later; paste/export text for Scout to read it today.',
      addedBy: 'user',
      createdAt,
      updatedAt: createdAt,
      sizeBytes: file.size
    });
  }

  return sanitizeRecord(
    await persist({
      ...record,
      resources: [...imported, ...record.resources].sort((left, right) => right.updatedAt.localeCompare(left.updatedAt))
    })
  );
}

export async function createWorkspaceResource(
  workspaceId: string,
  betaProfile: BetaProfileCookie,
  input: {
    kind: 'url' | 'note' | 'official-source';
    title?: string | null;
    sourceUri?: string | null;
    text?: string | null;
    sensitivity?: WorkspaceResourceSensitivity | null;
    searchable?: boolean | null;
  }
): Promise<{
  readonly workspace: WorkspaceSnapshot;
  readonly resource: WorkspaceResource;
}> {
  return createWorkspaceResourceForActor(workspaceId, betaProfile, input, 'user');
}

async function createWorkspaceResourceForActor(
  workspaceId: string,
  betaProfile: BetaProfileCookie,
  input: {
    kind: 'url' | 'note' | 'official-source';
    title?: string | null;
    sourceUri?: string | null;
    text?: string | null;
    sensitivity?: WorkspaceResourceSensitivity | null;
    searchable?: boolean | null;
  },
  addedBy: WorkspaceResource['addedBy']
): Promise<{
  readonly workspace: WorkspaceSnapshot;
  readonly resource: WorkspaceResource;
}> {
  const record = await getWorkspaceRecord(workspaceId, betaProfile);
  const createdAt = nowIso();
  const kind = input.kind === 'official-source' || input.kind === 'url' ? input.kind : 'note';
  const sourceUri = input.sourceUri?.trim() || null;
  const text = storedResourceText(input.text?.trim() || '');
  const title = input.title?.trim() || (sourceUri ? sourceUri.replace(/^https?:\/\//iu, '').replace(/\/$/u, '') : 'Trail note resource');

  if (kind !== 'note' && !sourceUri) {
    throw new Error('Resource URL is required.');
  }

  if (kind === 'note' && !text && !input.title?.trim()) {
    throw new Error('Resource note text is required.');
  }

  const extractedText = kind === 'note' ? text : text || sourceUri || '';
  const resource: WorkspaceResource = {
    id: createId('resource'),
    workspaceId,
    kind,
    title,
    sourceUri,
    originalFileName: null,
    mimeType: kind === 'note' ? 'text/plain' : null,
    status: 'ready',
    sensitivity: input.sensitivity ?? 'private',
    searchable: input.searchable !== false,
    extractedText: extractedText || null,
    summary: resourceSummary(extractedText || title),
    addedBy,
    createdAt,
    updatedAt: createdAt
  };

  const workspace = sanitizeRecord(
    await persist({
      ...record,
      resources: [resource, ...record.resources].sort((left, right) => right.updatedAt.localeCompare(left.updatedAt))
    })
  );

  return { workspace, resource };
}

export async function recordWorkspaceScoutResource(
  workspaceId: string,
  betaProfile: BetaProfileCookie,
  input: {
    kind: 'url' | 'note' | 'official-source';
    title?: string | null;
    sourceUri?: string | null;
    text?: string | null;
    sensitivity?: WorkspaceResourceSensitivity | null;
    searchable?: boolean | null;
  }
): Promise<{
  readonly workspace: WorkspaceSnapshot;
  readonly resource: WorkspaceResource;
}> {
  return createWorkspaceResourceForActor(workspaceId, betaProfile, {
    ...input,
    sensitivity: input.sensitivity ?? 'normal',
    searchable: input.searchable ?? true
  }, 'scout');
}

export async function deleteWorkspaceResource(
  workspaceId: string,
  betaProfile: BetaProfileCookie,
  resourceId: string
): Promise<WorkspaceSnapshot> {
  const record = await getWorkspaceRecord(workspaceId, betaProfile);

  return sanitizeRecord(
    await persist({
      ...record,
      resources: record.resources.filter((resource) => resource.id !== resourceId)
    })
  );
}

export async function createWorkspaceDocument(
  workspaceId: string,
  betaProfile: BetaProfileCookie,
  input: {
    title: string;
    textContent?: string | null;
    note?: string | null;
    slotKey?: StandardDocumentSlotKey | null;
  }
): Promise<{
  readonly workspace: WorkspaceSnapshot;
  readonly document: ImportedDocument;
}> {
  const record = await getWorkspaceRecord(workspaceId, betaProfile);
  const savedAt = nowIso();
  const slot = input.slotKey ? standardDocumentSlotForKey(input.slotKey) : null;
  const title = (slot?.title ?? input.title.trim()) || 'Untitled Scout doc';
  const textContent = input.textContent?.trim() || [
    `# ${title}`,
    '',
    slot ? slot.purpose : 'Private Scout workspace document.',
    '',
    '## Current notes',
    '',
    '- Draft started.',
    '',
    '## Open questions',
    '',
    ...(slot?.starterQuestions ?? ['What should Scout help fill in next?']).map((question) => `- ${question}`),
    '',
    '## Change history',
    '',
    `- ${new Date(savedAt).toLocaleDateString()}: Draft created.`
  ].join('\n').trim();
  const document = withInitialDocumentVersion(
    {
      id: createId('doc'),
      title,
      fileName: `${slugifyDocumentTitle(title)}.md`,
      kind: 'markdown',
      slotKey: slot?.key ?? null,
      rights: slot ? 'assistant-generated' : 'user-imported',
      status: 'draft',
      visibility: 'private',
      searchable: true,
      textContent,
      note: input.note?.trim() || (slot ? 'Standard Scout document draft.' : 'Extra private Scout document.'),
      importedAt: savedAt,
      updatedAt: savedAt,
      sizeBytes: Buffer.byteLength(textContent, 'utf8')
    },
    slot ? 'scout' : 'user',
    'draft'
  );

  const workspace = sanitizeRecord(
    await persist({
      ...record,
      documents: [document, ...record.documents].sort((left, right) => (right.updatedAt ?? right.importedAt).localeCompare(left.updatedAt ?? left.importedAt))
    })
  );

  return { workspace, document };
}

export async function saveWorkspaceScoutDocumentFromReply(
  workspaceId: string,
  betaProfile: BetaProfileCookie,
  input: {
    messageId: string;
    title?: string | null;
    slotKey?: StandardDocumentSlotKey | null;
  }
): Promise<{
  readonly workspace: WorkspaceSnapshot;
  readonly document: ImportedDocument;
}> {
  const record = await getWorkspaceRecord(workspaceId, betaProfile);
  const messageIndex = record.clawMessages.findIndex(
    (message) => message.id === input.messageId && message.role === 'assistant'
  );

  if (messageIndex < 0) {
    throw new Error('Scout reply not found.');
  }

  const reply = record.clawMessages[messageIndex];
  if (reply.error) {
    throw new Error('Cannot save a failed Scout reply.');
  }

  const prompt = previousUserPrompt(record.clawMessages, messageIndex);
  const slot = input.slotKey ? standardDocumentSlotForKey(input.slotKey) : null;
  const title = slot?.title ?? inferScoutDocumentTitle(prompt, input.title);
  const savedAt = nowIso();
  const markdown = buildScoutDocumentMarkdown(title, prompt, reply.text, {
    trailName: betaProfile.trailName || betaProfile.name || 'Unknown',
    currentMile: record.profile && Number.isFinite(record.profile.currentMile) ? record.profile.currentMile : null,
    savedAt
  });

  let existing: ImportedDocument | null = null;
  let document: ImportedDocument;

  if (slot) {
    existing = record.documents.find((item) => documentMatchesSlot(item, slot.key)) ?? null;
  }

  if (slot && existing) {
    document = applyDocumentVersion(
      {
        ...existing,
        slotKey: slot.key,
        rights: 'assistant-generated',
        visibility: existing.visibility ?? 'private',
        searchable: existing.searchable !== false
      },
      createNextDocumentVersion(existing, {
        title,
        textContent: markdown,
        note: `Proposed Scout update for ${slot.title}. Review this version before treating it as active.`,
        author: 'scout',
        sourceMessageId: reply.id,
        revisionPrompt: prompt,
        createdAt: savedAt
      }),
      'needs-review',
      savedAt
    );
  } else {
    document = withInitialDocumentVersion(
      {
        id: createId('doc'),
        title,
        fileName: `${slugifyDocumentTitle(title)}-${savedAt.slice(0, 10)}.md`,
        kind: 'markdown',
        slotKey: slot?.key ?? null,
        rights: 'assistant-generated',
        status: slot ? 'needs-review' : 'active',
        visibility: 'private',
        searchable: true,
        textContent: markdown,
        note: slot
          ? `Drafted by Scout for the ${slot.title} standard document slot. Review before marking active.`
          : 'Saved from Scout. Open Docs to keep refining or searching this plan later.',
        importedAt: savedAt,
        updatedAt: savedAt,
        sizeBytes: Buffer.byteLength(markdown, 'utf8')
      },
      'scout',
      slot ? 'needs-review' : 'active'
    );
  }

  const documents = existing
    ? record.documents.map((item) => (item.id === existing.id ? document : item))
    : [document, ...record.documents];

  const workspace = sanitizeRecord(
    await persist({
      ...record,
      documents: documents.sort((left, right) => (right.updatedAt ?? right.importedAt).localeCompare(left.updatedAt ?? left.importedAt))
    })
  );

  return {
    workspace,
    document
  };
}

export async function reviseWorkspaceScoutDocument(
  workspaceId: string,
  betaProfile: BetaProfileCookie,
  input: {
    documentId: string;
    prompt: string;
    replyText: string;
  }
): Promise<{
  readonly workspace: WorkspaceSnapshot;
  readonly document: ImportedDocument;
}> {
  const record = await getWorkspaceRecord(workspaceId, betaProfile);
  const existing = record.documents.find((document) => document.id === input.documentId);

  if (!existing || existing.rights !== 'assistant-generated') {
    throw new Error('Saved Scout plan not found.');
  }

  const savedAt = nowIso();
  const markdown = buildScoutDocumentMarkdown(existing.title, input.prompt, input.replyText, {
    trailName: betaProfile.trailName || betaProfile.name || 'Unknown',
    currentMile: record.profile && Number.isFinite(record.profile.currentMile) ? record.profile.currentMile : null,
    savedAt
  });
  const version = createNextDocumentVersion(existing, {
    title: existing.title,
    textContent: markdown,
    note: 'Proposed Scout revision. Review this version before treating it as active.',
    author: 'scout',
    revisionPrompt: input.prompt,
    createdAt: savedAt
  });
  const document = applyDocumentVersion(existing, version, 'needs-review', savedAt);

  const workspace = sanitizeRecord(
    await persist({
      ...record,
      documents: record.documents
        .map((item) => (item.id === input.documentId ? document : item))
        .sort((left, right) => (right.updatedAt ?? right.importedAt).localeCompare(left.updatedAt ?? left.importedAt))
    })
  );

  return {
    workspace,
    document
  };
}

export async function getWorkspaceDocument(
  workspaceId: string,
  betaProfile: BetaProfileCookie,
  documentId: string
): Promise<ImportedDocument | null> {
  const record = await getWorkspaceRecord(workspaceId, betaProfile);
  return record.documents.find((document) => document.id === documentId) ?? null;
}

export async function updateWorkspaceDocumentState(
  workspaceId: string,
  betaProfile: BetaProfileCookie,
  input: {
    documentId: string;
    status?: ImportedDocumentStatus | null;
    visibility?: ImportedDocumentVisibility | null;
    searchable?: boolean | null;
    currentVersionId?: string | null;
  }
): Promise<{
  readonly workspace: WorkspaceSnapshot;
  readonly document: ImportedDocument;
}> {
  const record = await getWorkspaceRecord(workspaceId, betaProfile);
  const existing = record.documents.find((document) => document.id === input.documentId);

  if (!existing) {
    throw new Error('Document not found.');
  }

  const versionToApply = input.currentVersionId
    ? existing.versions?.find((version) => version.id === input.currentVersionId) ?? null
    : null;

  if (input.currentVersionId && !versionToApply) {
    throw new Error('Document version not found.');
  }

  const updatedAt = nowIso();
  const document: ImportedDocument = versionToApply
    ? applyDocumentVersion(
        {
          ...existing,
          searchable: typeof input.searchable === 'boolean' ? input.searchable : existing.searchable,
          visibility: input.visibility ?? existing.visibility ?? 'private'
        },
        versionToApply,
        input.status ?? existing.status ?? 'active',
        updatedAt
      )
    : {
        ...existing,
        status: input.status ?? existing.status ?? 'active',
        visibility: input.visibility ?? existing.visibility ?? 'private',
        searchable: typeof input.searchable === 'boolean' ? input.searchable : existing.searchable,
        updatedAt
      };

  const workspace = sanitizeRecord(
    await persist({
      ...record,
      documents: record.documents
        .map((item) => (item.id === input.documentId ? document : item))
        .sort((left, right) => (right.updatedAt ?? right.importedAt).localeCompare(left.updatedAt ?? left.importedAt))
    })
  );

  return {
    workspace,
    document
  };
}

export async function updateWorkspaceDocumentContent(
  workspaceId: string,
  betaProfile: BetaProfileCookie,
  input: {
    documentId: string;
    title?: string | null;
    textContent: string;
    note?: string | null;
  }
): Promise<{
  readonly workspace: WorkspaceSnapshot;
  readonly document: ImportedDocument;
}> {
  const record = await getWorkspaceRecord(workspaceId, betaProfile);
  const existing = record.documents.find((document) => document.id === input.documentId);

  if (!existing) {
    throw new Error('Document not found.');
  }

  const textContent = input.textContent.trim();
  if (!textContent) {
    throw new Error('Document text is required.');
  }

  const savedAt = nowIso();
  const title = input.title?.trim() || existing.title;
  const version = createNextDocumentVersion(existing, {
    title,
    textContent,
    note: input.note?.trim() || 'Edited by user in Scout Docs.',
    author: 'user',
    createdAt: savedAt
  });
  const document = applyDocumentVersion(
    {
      ...existing,
      fileName: existing.fileName || `${slugifyDocumentTitle(title)}.md`
    },
    version,
    'active',
    savedAt
  );

  const workspace = sanitizeRecord(
    await persist({
      ...record,
      documents: record.documents
        .map((item) => (item.id === input.documentId ? document : item))
        .sort((left, right) => (right.updatedAt ?? right.importedAt).localeCompare(left.updatedAt ?? left.importedAt))
    })
  );

  return {
    workspace,
    document
  };
}

export async function deleteWorkspaceDocument(
  workspaceId: string,
  betaProfile: BetaProfileCookie,
  documentId: string
): Promise<WorkspaceSnapshot> {
  const record = await getWorkspaceRecord(workspaceId, betaProfile);

  return sanitizeRecord(
    await persist({
      ...record,
      documents: record.documents.filter((document) => document.id !== documentId)
    })
  );
}

export async function addWorkspaceChecklistTool(
  workspaceId: string,
  betaProfile: BetaProfileCookie,
  input: {
    title: string;
    summary: string;
    instructions: string;
    itemsText: string;
  }
): Promise<WorkspaceSnapshot> {
  const record = await getWorkspaceRecord(workspaceId, betaProfile);
  const tool = createChecklistTool({
    title: input.title,
    summary: input.summary,
    instructions: input.instructions,
    items: input.itemsText
      .split(/\r?\n/u)
      .map((line) => line.trim())
      .filter(Boolean),
    author: 'user'
  });

  return sanitizeRecord(
    await persist({
      ...record,
      tools: [tool, ...record.tools]
    })
  );
}

export async function deleteWorkspaceTool(
  workspaceId: string,
  betaProfile: BetaProfileCookie,
  toolId: string
): Promise<WorkspaceSnapshot> {
  const record = await getWorkspaceRecord(workspaceId, betaProfile);

  return sanitizeRecord(
    await persist({
      ...record,
      tools: record.tools.filter((tool) => tool.id !== toolId)
    })
  );
}

function loadoutItemFromInput(input: LoadoutItemInput, timestamp: string): WorkspaceLoadoutItem {
  const name = typeof input.name === 'string' ? input.name.trim() : '';
  if (!name) {
    throw new Error('Loadout item name is required.');
  }

  return {
    id: createId('loadout'),
    name: name.slice(0, LOADOUT_LIMITS.maxNameChars),
    category: normalizeLoadoutCategory(input.category),
    weightOz: normalizeLoadoutWeightOz(input.weightOz),
    quantity: normalizeLoadoutQuantity(input.quantity),
    worn: Boolean(input.worn),
    consumable: Boolean(input.consumable),
    notes: typeof input.notes === 'string' ? input.notes.trim().slice(0, LOADOUT_LIMITS.maxNotesChars) : '',
    link: sanitizeLoadoutLink(input.link),
    createdAt: timestamp,
    updatedAt: timestamp
  };
}

export async function addWorkspaceLoadoutItem(
  workspaceId: string,
  betaProfile: BetaProfileCookie,
  input: LoadoutItemInput
): Promise<WorkspaceSnapshot> {
  const record = await getWorkspaceRecord(workspaceId, betaProfile);
  if (record.loadout.length >= LOADOUT_LIMITS.maxItems) {
    throw new Error(`Loadout is full (${LOADOUT_LIMITS.maxItems} items).`);
  }
  const item = loadoutItemFromInput(input, nowIso());

  return sanitizeRecord(
    await persist({
      ...record,
      loadout: sortLoadout([...record.loadout, item])
    })
  );
}

export async function updateWorkspaceLoadoutItem(
  workspaceId: string,
  betaProfile: BetaProfileCookie,
  itemId: string,
  patch: Partial<LoadoutItemInput>
): Promise<WorkspaceSnapshot> {
  const record = await getWorkspaceRecord(workspaceId, betaProfile);
  const existing = record.loadout.find((item) => item.id === itemId);

  if (!existing) {
    throw new Error('Loadout item not found.');
  }

  const name = patch.name !== undefined ? (typeof patch.name === 'string' ? patch.name.trim() : '') : existing.name;
  if (!name) {
    throw new Error('Loadout item name is required.');
  }

  const updated: WorkspaceLoadoutItem = {
    ...existing,
    name,
    category: patch.category !== undefined ? normalizeLoadoutCategory(patch.category) : existing.category,
    weightOz: patch.weightOz !== undefined ? normalizeLoadoutWeightOz(patch.weightOz) : existing.weightOz,
    quantity: patch.quantity !== undefined ? normalizeLoadoutQuantity(patch.quantity) : existing.quantity,
    worn: patch.worn !== undefined ? Boolean(patch.worn) : existing.worn,
    consumable: patch.consumable !== undefined ? Boolean(patch.consumable) : existing.consumable,
    notes: patch.notes !== undefined ? (typeof patch.notes === 'string' ? patch.notes.trim() : '') : existing.notes,
    link: patch.link !== undefined ? (typeof patch.link === 'string' && patch.link.trim() ? patch.link.trim() : null) : existing.link,
    updatedAt: nowIso()
  };

  return sanitizeRecord(
    await persist({
      ...record,
      loadout: sortLoadout(record.loadout.map((item) => (item.id === itemId ? updated : item)))
    })
  );
}

export async function removeWorkspaceLoadoutItem(
  workspaceId: string,
  betaProfile: BetaProfileCookie,
  itemId: string
): Promise<WorkspaceSnapshot> {
  const record = await getWorkspaceRecord(workspaceId, betaProfile);

  return sanitizeRecord(
    await persist({
      ...record,
      loadout: record.loadout.filter((item) => item.id !== itemId)
    })
  );
}

export async function replaceWorkspaceLoadout(
  workspaceId: string,
  betaProfile: BetaProfileCookie,
  items: LoadoutItemInput[]
): Promise<WorkspaceSnapshot> {
  const record = await getWorkspaceRecord(workspaceId, betaProfile);
  const timestamp = nowIso();

  return sanitizeRecord(
    await persist({
      ...record,
      loadout: sortLoadout(items.slice(0, LOADOUT_LIMITS.maxItems).map((item) => loadoutItemFromInput(item, timestamp)))
    })
  );
}

export async function setWorkspacePendingOpenAICodexAuth(
  workspaceId: string,
  betaProfile: BetaProfileCookie,
  pendingAuth: WorkspacePendingOpenAICodexAuth
): Promise<void> {
  const record = await getWorkspaceRecord(workspaceId, betaProfile);
  await persist({
    ...record,
    pendingOpenAICodexAuth: pendingAuth
  });
}

export async function getWorkspacePendingOpenAICodexAuth(
  workspaceId: string,
  betaProfile: BetaProfileCookie
): Promise<WorkspacePendingOpenAICodexAuth | null> {
  const record = await getWorkspaceRecord(workspaceId, betaProfile);
  return record.pendingOpenAICodexAuth;
}

export async function clearWorkspacePendingOpenAICodexAuth(
  workspaceId: string,
  betaProfile: BetaProfileCookie
): Promise<void> {
  const record = await getWorkspaceRecord(workspaceId, betaProfile);
  if (!record.pendingOpenAICodexAuth) return;
  await persist({
    ...record,
    pendingOpenAICodexAuth: null
  });
}

export async function saveWorkspaceOpenAICodexConnection(
  workspaceId: string,
  betaProfile: BetaProfileCookie,
  input: {
    encryptedCredentials: WorkspaceEncryptedSecret;
    accountId: string | null;
    expiresAt: string | null;
    label?: string | null;
  }
): Promise<WorkspaceSnapshot> {
  const record = await getWorkspaceRecord(workspaceId, betaProfile);
  const existing = record.providerConnections.find((connection) => connection.providerId === 'openai-codex');
  const connectedAt = existing?.connectedAt ?? nowIso();
  const updatedAt = nowIso();
  const connection: WorkspaceProviderConnection = {
    providerId: 'openai-codex',
    label: input.label?.trim() || existing?.label || 'ChatGPT connected account',
    status: 'connected',
    accountId: input.accountId,
    expiresAt: input.expiresAt,
    connectedAt,
    updatedAt
  };

  return sanitizeRecord(
    await persist({
      ...record,
      providerConnections: upsertProviderConnection(record.providerConnections, connection),
      openAICodexCredentials: input.encryptedCredentials,
      pendingOpenAICodexAuth: null
    })
  );
}

export async function getWorkspaceOpenAICodexCredentials(
  workspaceId: string,
  betaProfile: BetaProfileCookie
): Promise<WorkspaceEncryptedSecret | null> {
  const record = await getWorkspaceRecord(workspaceId, betaProfile);
  return record.openAICodexCredentials;
}

export async function clearWorkspaceOpenAICodexConnection(
  workspaceId: string,
  betaProfile: BetaProfileCookie
): Promise<WorkspaceSnapshot> {
  const record = await getWorkspaceRecord(workspaceId, betaProfile);

  return sanitizeRecord(
    await persist({
      ...record,
      providerConnections: record.providerConnections.filter((connection) => connection.providerId !== 'openai-codex'),
      openAICodexCredentials: null,
      pendingOpenAICodexAuth: null
    })
  );
}

export async function replaceWorkspaceClawMessages(
  workspaceId: string,
  betaProfile: BetaProfileCookie,
  messages: WorkspaceClawMessage[]
): Promise<WorkspaceSnapshot> {
  const record = await getWorkspaceRecord(workspaceId, betaProfile);

  return sanitizeRecord(
    await persist({
      ...record,
      clawMessages: normalizeClawMessages(messages).slice(-MAX_STORED_CLAW_MESSAGES)
    })
  );
}

function factCandidateKey(candidate: Pick<WorkspaceFactCandidate, 'kind' | 'claimText' | 'regionSlug' | 'mileRangeStart' | 'mileRangeEnd'>): string {
  return [
    candidate.kind,
    candidate.claimText.trim().toLowerCase(),
    candidate.regionSlug?.trim().toLowerCase() || '',
    candidate.mileRangeStart ?? '',
    candidate.mileRangeEnd ?? ''
  ].join('|');
}

export async function appendWorkspaceFactCandidates(
  workspaceId: string,
  betaProfile: BetaProfileCookie,
  candidates: WorkspaceFactCandidateInput[]
): Promise<WorkspaceSnapshot> {
  const record = await getWorkspaceRecord(workspaceId, betaProfile);
  const normalized = normalizeFactCandidates(
    candidates.map((candidate) => ({
      id: createId('fact'),
      kind: candidate.kind,
      claimText: candidate.claimText,
      regionSlug: candidate.regionSlug ?? null,
      mileRangeStart: candidate.mileRangeStart ?? null,
      mileRangeEnd: candidate.mileRangeEnd ?? null,
      sourceMessageId: candidate.sourceMessageId ?? null,
      sourceRole: candidate.sourceRole ?? null,
      sourceType: candidate.sourceType ?? 'delegate_extraction',
      confidence: candidate.confidence ?? 0.5,
      status: candidate.status ?? 'pending',
      createdAt: candidate.createdAt ?? nowIso()
    }))
  );

  if (normalized.length === 0) {
    return sanitizeRecord(record);
  }

  const seen = new Set(record.factCandidates.map((candidate) => factCandidateKey(candidate)));
  const merged = [...record.factCandidates];

  for (const candidate of normalized) {
    const key = factCandidateKey(candidate);
    if (seen.has(key)) continue;
    seen.add(key);
    merged.unshift(candidate);
  }

  return sanitizeRecord(
    await persist({
      ...record,
      factCandidates: merged.slice(0, 200)
    })
  );
}
