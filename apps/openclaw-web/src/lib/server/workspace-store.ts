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
  nowIso,
  updateProfileTimestamp,
  type ImportedDocument,
  type ImportedDocumentKind,
  type ManualProfile,
  type ManualSection,
  type WorkspaceTool
} from '@hoggcountry/manual-core';
import type { BetaProfileCookie } from '$lib/beta';
import { OPENAI_CODEX_LOCAL_REDIRECT_URI } from '$lib/server/claw-openai-codex';

export interface WorkspaceProviderConnection {
  readonly providerId: 'openai-codex';
  readonly label: string;
  readonly status: 'connected';
  readonly accountId: string | null;
  readonly expiresAt: string | null;
  readonly connectedAt: string;
  readonly updatedAt: string;
}

export interface WorkspaceClawMessage {
  readonly id: string;
  readonly role: 'user' | 'assistant';
  readonly text: string;
  readonly createdAt: string;
  readonly providerId: 'openai-codex' | 'system' | null;
  readonly model: string | null;
  readonly error: boolean;
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
  readonly tools: WorkspaceTool[];
  readonly providerConnections: WorkspaceProviderConnection[];
  readonly clawMessages: WorkspaceClawMessage[];
  readonly factCandidates: WorkspaceFactCandidate[];
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface WorkspaceRecord extends WorkspaceSnapshot {
  readonly version: 3;
  readonly openAICodexCredentials: WorkspaceEncryptedSecret | null;
  readonly pendingOpenAICodexAuth: WorkspacePendingOpenAICodexAuth | null;
}

function workspaceRoot(): string {
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
        return join(cursor, 'backend/storage/app/openclaw-workspaces');
      }

      const parent = dirname(cursor);
      if (parent === cursor) break;
      cursor = parent;
    }
  }

  return join(resolve(process.cwd(), 'backend'), 'storage/app/openclaw-workspaces');
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

      const providerId = message.providerId === 'openai-codex' || message.providerId === 'system' ? message.providerId : null;
      const model = typeof message.model === 'string' && message.model.trim().length > 0 ? message.model.trim() : null;

      return {
        id: typeof message.id === 'string' && message.id ? message.id : createId(`claw-${role}`),
        role,
        text,
        createdAt:
          typeof message.createdAt === 'string' && message.createdAt.length > 0 ? message.createdAt : nowIso(),
        providerId,
        model,
        error: Boolean(message.error)
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
    tools: record.tools,
    providerConnections: record.providerConnections,
    clawMessages: record.clawMessages,
    factCandidates: record.factCandidates,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt
  };
}

function baseRecord(workspaceId: string, betaProfile: BetaProfileCookie): WorkspaceRecord {
  const timestamp = nowIso();

  return {
    version: 3,
    workspaceId,
    betaProfile,
    profile: null,
    sections: [],
    documents: [],
    tools: [],
    providerConnections: [],
    clawMessages: [],
    factCandidates: [],
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
    version: 3,
    workspaceId,
    betaProfile: isObject(raw.betaProfile)
      ? {
          email: typeof raw.betaProfile.email === 'string' ? raw.betaProfile.email : betaProfile.email,
          name: typeof raw.betaProfile.name === 'string' ? raw.betaProfile.name : betaProfile.name,
          trailName: typeof raw.betaProfile.trailName === 'string' ? raw.betaProfile.trailName : betaProfile.trailName,
          estimatedStart: typeof raw.betaProfile.estimatedStart === 'string' ? raw.betaProfile.estimatedStart : betaProfile.estimatedStart
        }
      : betaProfile,
    profile: isObject(raw.profile) ? (raw.profile as ManualProfile) : null,
    sections: Array.isArray(raw.sections) ? (raw.sections as ManualSection[]) : [],
    documents: Array.isArray(raw.documents) ? (raw.documents as ImportedDocument[]) : [],
    tools: Array.isArray(raw.tools) ? (raw.tools as WorkspaceTool[]) : [],
    providerConnections: normalizeProviderConnections(raw.providerConnections, createdAt),
    clawMessages: normalizeClawMessages(raw.clawMessages),
    factCandidates: normalizeFactCandidates(raw.factCandidates),
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
    existing.betaProfile.trailName !== betaProfile.trailName ||
    existing.betaProfile.estimatedStart !== betaProfile.estimatedStart
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

async function persist(record: WorkspaceRecord): Promise<WorkspaceRecord> {
  const updated: WorkspaceRecord = {
    ...record,
    updatedAt: nowIso()
  };
  await writeRecord(updated);
  return updated;
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
  profile: ManualProfile
): Promise<WorkspaceSnapshot> {
  const record = await getWorkspaceRecord(workspaceId, betaProfile);
  const normalizedProfile = updateProfileTimestamp({
    ...profile,
    id: profile.id || createId('profile'),
    createdAt: profile.createdAt || nowIso(),
    trailName: profile.trailName || betaProfile.trailName
  });

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

const SCOUT_STARTER_DOCUMENTS = [
  {
    title: '7-day trail plan',
    purpose: 'Keep the hiker oriented on the next practical week: terrain, mileage, weather risk, sleep targets, town timing, and unresolved assumptions.',
    starterQuestions: [
      'Where am I starting from today?',
      'What pace is realistic for this week?',
      'What terrain, weather, or town constraints could change the plan?'
    ]
  },
  {
    title: 'Loadout plan',
    purpose: 'Track what the hiker is carrying, what is working, what hurts, what should be sent home, and what should be added before the next section.',
    starterQuestions: ['What is the current pack setup?', 'What feels unnecessary?', 'What failed, broke, or caused discomfort?']
  },
  {
    title: 'Food and resupply plan',
    purpose: 'Track food carries, meal preferences, calorie gaps, town/resupply timing, and max carry constraints.',
    starterQuestions: ['How many days of food can I carry comfortably?', 'What food am I actually eating?', 'Where is the next realistic resupply?']
  },
  {
    title: 'Budget and finances',
    purpose: 'Track spend rate, upcoming expensive towns, lodging/shuttle choices, gear replacement risk, and whether the hike is staying financially sustainable.',
    starterQuestions: ['What is the current remaining budget?', 'What was spent recently?', 'What expenses are coming up next?']
  },
  {
    title: 'Health and body notes',
    purpose: 'Track weight, pain, injuries, energy, sleep, foot care, recovery needs, and health changes over the hike.',
    starterQuestions: ['What hurts right now?', 'What is changing with weight, appetite, or energy?', 'What needs rest or medical attention?']
  },
  {
    title: 'Training plan',
    purpose: 'Help the hiker prepare before the trail and adjust conditioning expectations during early trail miles.',
    starterQuestions: ['What is the start date?', 'What fitness baseline exists now?', 'What should be trained before the first big climb?']
  },
  {
    title: 'Town strategy',
    purpose: 'Track town stops, hostel options, chores, zero/nero logic, shuttles, mail drops, and social/logistics decisions.',
    starterQuestions: ['What town is coming next?', 'What chores need to happen there?', 'Is this a quick resupply, nero, or full zero?']
  },
  {
    title: 'Safety and emergency plan',
    purpose: 'Track contacts, bailout options, weather hazards, medical constraints, check-in rhythm, and emergency decision rules.',
    starterQuestions: ['Who should be contacted if plans change?', 'What hazards are ahead?', 'Where are the nearest bailout or help options?']
  }
] as const;

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
  const savedAt = nowIso();
  const currentMile = record.profile && Number.isFinite(record.profile.currentMile) ? record.profile.currentMile : null;
  const trailName = betaProfile.trailName || betaProfile.name || 'Unknown';

  const starterDocuments: ImportedDocument[] = SCOUT_STARTER_DOCUMENTS
    .filter((starter) => !existingTitles.has(starter.title.toLowerCase()))
    .map((starter) => {
      const markdown = buildScoutStarterMarkdown(starter.title, starter.purpose, starter.starterQuestions, {
        trailName,
        currentMile,
        savedAt
      });

      return {
        id: createId('doc'),
        title: starter.title,
        fileName: `${slugifyDocumentTitle(starter.title)}.md`,
        kind: 'markdown',
        rights: 'assistant-generated',
        searchable: true,
        textContent: markdown,
        note: 'Living Scout starter document. Talk to Scout to fill and revise this plan in place.',
        importedAt: savedAt,
        sizeBytes: Buffer.byteLength(markdown, 'utf8')
      };
    });

  if (starterDocuments.length === 0) {
    return sanitizeRecord(record);
  }

  return sanitizeRecord(
    await persist({
      ...record,
      documents: [...starterDocuments, ...record.documents].sort((left, right) => right.importedAt.localeCompare(left.importedAt))
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

    imported.push({
      id: createId('doc'),
      title: file.name.replace(/\.[^.]+$/u, ''),
      fileName: file.name,
      kind,
      rights: 'user-imported',
      searchable,
      textContent: await fileText(file, kind),
      note: searchable
        ? ''
        : 'Stored in your private workspace. PDF upload works now; text extraction can deepen later without changing the locker UI.',
      importedAt: nowIso(),
      sizeBytes: file.size
    });
  }

  return sanitizeRecord(
    await persist({
      ...record,
      documents: [...imported, ...record.documents].sort((left, right) => right.importedAt.localeCompare(left.importedAt))
    })
  );
}

export async function saveWorkspaceScoutDocumentFromReply(
  workspaceId: string,
  betaProfile: BetaProfileCookie,
  input: {
    messageId: string;
    title?: string | null;
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
  const title = inferScoutDocumentTitle(prompt, input.title);
  const savedAt = nowIso();
  const markdown = buildScoutDocumentMarkdown(title, prompt, reply.text, {
    trailName: betaProfile.trailName || betaProfile.name || 'Unknown',
    currentMile: record.profile && Number.isFinite(record.profile.currentMile) ? record.profile.currentMile : null,
    savedAt
  });
  const document: ImportedDocument = {
    id: createId('doc'),
    title,
    fileName: `${slugifyDocumentTitle(title)}-${savedAt.slice(0, 10)}.md`,
    kind: 'markdown',
    rights: 'assistant-generated',
    searchable: true,
    textContent: markdown,
    note: 'Saved from Scout. Open Docs to keep refining or searching this plan later.',
    importedAt: savedAt,
    sizeBytes: Buffer.byteLength(markdown, 'utf8')
  };

  const workspace = sanitizeRecord(
    await persist({
      ...record,
      documents: [document, ...record.documents].sort((left, right) => right.importedAt.localeCompare(left.importedAt))
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
  const document: ImportedDocument = {
    ...existing,
    textContent: markdown,
    note: 'Updated by Scout. Open Docs to keep refining or searching this plan later.',
    importedAt: savedAt,
    sizeBytes: Buffer.byteLength(markdown, 'utf8')
  };

  const workspace = sanitizeRecord(
    await persist({
      ...record,
      documents: record.documents
        .map((item) => (item.id === input.documentId ? document : item))
        .sort((left, right) => right.importedAt.localeCompare(left.importedAt))
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
      clawMessages: normalizeClawMessages(messages).slice(-40)
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
