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

export interface WorkspaceSnapshot {
  readonly workspaceId: string;
  readonly betaProfile: BetaProfileCookie;
  readonly profile: ManualProfile | null;
  readonly sections: ManualSection[];
  readonly documents: ImportedDocument[];
  readonly tools: WorkspaceTool[];
  readonly createdAt: string;
  readonly updatedAt: string;
}

interface WorkspaceRecord extends WorkspaceSnapshot {
  readonly version: 1;
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

async function readRecord(workspaceId: string): Promise<WorkspaceRecord | null> {
  try {
    const raw = await readFile(workspacePath(workspaceId), 'utf8');
    return JSON.parse(raw) as WorkspaceRecord;
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

function baseRecord(workspaceId: string, betaProfile: BetaProfileCookie): WorkspaceRecord {
  const timestamp = nowIso();

  return {
    version: 1,
    workspaceId,
    betaProfile,
    profile: null,
    sections: [],
    documents: [],
    tools: [],
    createdAt: timestamp,
    updatedAt: timestamp
  };
}

export async function getWorkspace(workspaceId: string, betaProfile: BetaProfileCookie): Promise<WorkspaceRecord> {
  const existing = await readRecord(workspaceId);
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

async function persist(record: WorkspaceRecord): Promise<WorkspaceRecord> {
  const updated: WorkspaceRecord = {
    ...record,
    updatedAt: nowIso()
  };
  await writeRecord(updated);
  return updated;
}

export async function initializeWorkspace(
  workspaceId: string,
  betaProfile: BetaProfileCookie,
  profile: ManualProfile
): Promise<WorkspaceRecord> {
  const record = await getWorkspace(workspaceId, betaProfile);
  const normalizedProfile = updateProfileTimestamp({
    ...profile,
    id: profile.id || createId('profile'),
    createdAt: profile.createdAt || nowIso(),
    trailName: profile.trailName || betaProfile.trailName
  });

  return persist({
    ...record,
    betaProfile,
    profile: normalizedProfile,
    sections: buildStarterManual(normalizedProfile),
    documents: record.documents,
    tools: record.tools.length > 0 ? record.tools : buildStarterTools(normalizedProfile)
  });
}

export async function setWorkspaceCurrentMile(
  workspaceId: string,
  betaProfile: BetaProfileCookie,
  currentMile: number
): Promise<WorkspaceRecord> {
  const record = await getWorkspace(workspaceId, betaProfile);
  if (!record.profile) {
    return record;
  }

  return persist({
    ...record,
    profile: updateProfileTimestamp({
      ...record.profile,
      currentMile: Number.isFinite(currentMile) ? Math.max(0, currentMile) : record.profile.currentMile
    })
  });
}

export async function addWorkspaceManualNote(
  workspaceId: string,
  betaProfile: BetaProfileCookie,
  sectionId: string,
  title: string,
  content: string
): Promise<WorkspaceRecord> {
  const record = await getWorkspace(workspaceId, betaProfile);

  return persist({
    ...record,
    sections: addUserBlock(record.sections, sectionId, title, content)
  });
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

export async function importWorkspaceDocuments(
  workspaceId: string,
  betaProfile: BetaProfileCookie,
  files: File[]
): Promise<WorkspaceRecord> {
  const record = await getWorkspace(workspaceId, betaProfile);
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

  return persist({
    ...record,
    documents: [...imported, ...record.documents].sort((left, right) => right.importedAt.localeCompare(left.importedAt))
  });
}

export async function deleteWorkspaceDocument(
  workspaceId: string,
  betaProfile: BetaProfileCookie,
  documentId: string
): Promise<WorkspaceRecord> {
  const record = await getWorkspace(workspaceId, betaProfile);

  return persist({
    ...record,
    documents: record.documents.filter((document) => document.id !== documentId)
  });
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
): Promise<WorkspaceRecord> {
  const record = await getWorkspace(workspaceId, betaProfile);
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

  return persist({
    ...record,
    tools: [tool, ...record.tools]
  });
}

export async function deleteWorkspaceTool(
  workspaceId: string,
  betaProfile: BetaProfileCookie,
  toolId: string
): Promise<WorkspaceRecord> {
  const record = await getWorkspace(workspaceId, betaProfile);

  return persist({
    ...record,
    tools: record.tools.filter((tool) => tool.id !== toolId)
  });
}
