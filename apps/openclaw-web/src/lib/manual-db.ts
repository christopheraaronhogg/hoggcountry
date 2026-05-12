import {
  buildManualExportHtml,
  createId,
  nowIso,
  searchImportedDocuments,
  searchManualSections,
  searchWorkspaceResources,
  searchWorkspaceTools,
  type ImportedDocument,
  type ImportedDocumentStatus,
  type ImportedDocumentVisibility,
  type StandardDocumentSlotKey,
  type ManualProfile,
  type ManualSection,
  type SearchHit,
  type WorkspaceResource,
  type WorkspaceResourceSensitivity,
  type WorkspaceTool
} from '@hoggcountry/manual-core';
import { publicCorpus, searchPublicCorpus } from '@hoggcountry/corpus';
import type { ScoutSkill, ScoutSkillSettings } from '@hoggcountry/scout-skills';
import { cacheWorkspaceSnapshot, readCachedWorkspaceSnapshot, type OfflineWorkspaceSnapshot } from '$lib/offline-field-pack';

interface WorkspaceSnapshot extends OfflineWorkspaceSnapshot {
  readonly workspaceId: string;
  readonly profile: ManualProfile | null;
  readonly sections: ManualSection[];
  readonly documents: ImportedDocument[];
  readonly resources: WorkspaceResource[];
  readonly tools: WorkspaceTool[];
  readonly skillSettings: ScoutSkillSettings;
  readonly createdAt: string;
  readonly updatedAt: string;
}

const WORKSPACE_ENDPOINT = '/app-api/workspace';

async function requestJson<T>(input: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers ?? undefined);
  if (!(init?.body instanceof FormData) && !headers.has('content-type')) {
    headers.set('content-type', 'application/json');
  }

  const response = await fetch(input, {
    ...init,
    headers
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `Workspace request failed with ${response.status}.`);
  }

  return response.json() as Promise<T>;
}

async function getSnapshot(): Promise<WorkspaceSnapshot> {
  try {
    const snapshot = await requestJson<WorkspaceSnapshot>(WORKSPACE_ENDPOINT, { cache: 'no-store' });
    cacheWorkspaceSnapshot(snapshot);
    return snapshot;
  } catch (error) {
    const cached = readCachedWorkspaceSnapshot();
    if (cached) return cached as WorkspaceSnapshot;
    throw error;
  }
}

export function createDefaultProfile(seed?: { trailName?: string }): ManualProfile {
  const timestamp = nowIso();

  return {
    id: createId('profile'),
    trailName: seed?.trailName ?? '',
    startDate: new Date().toISOString().slice(0, 10),
    direction: 'NOBO',
    currentMile: 0,
    targetPace: 13,
    zeroDaysPerMonth: 1,
    budgetTier: 'balanced',
    experienceLevel: 'first-thru',
    gearPhilosophy: 'balanced',
    townStyle: 'balanced',
    reflectionStyle: 'faith-informed',
    shelterPreference: 'mixed',
    waterCapacityLiters: 2,
    healthNotes: '',
    createdAt: timestamp,
    updatedAt: timestamp
  };
}

export async function hasManual(): Promise<boolean> {
  return (await getSnapshot()).profile !== null;
}

export async function getProfile(): Promise<ManualProfile | null> {
  return (await getSnapshot()).profile;
}

export async function getSections(): Promise<ManualSection[]> {
  return (await getSnapshot()).sections;
}

export async function getTools(): Promise<WorkspaceTool[]> {
  return (await getSnapshot()).tools;
}

export async function initializeManual(profile: ManualProfile): Promise<void> {
  await requestJson(WORKSPACE_ENDPOINT + '/initialize', {
    method: 'POST',
    body: JSON.stringify(profile)
  });
}

export async function setCurrentMile(mile: number): Promise<ManualProfile | null> {
  const snapshot = await requestJson<WorkspaceSnapshot>(WORKSPACE_ENDPOINT + '/profile/current-mile', {
    method: 'POST',
    body: JSON.stringify({ currentMile: mile })
  });
  cacheWorkspaceSnapshot(snapshot);

  return snapshot.profile;
}

export async function addNoteToSection(sectionId: string, title: string, content: string): Promise<ManualSection[]> {
  const snapshot = await requestJson<WorkspaceSnapshot>(WORKSPACE_ENDPOINT + '/manual/note', {
    method: 'POST',
    body: JSON.stringify({ sectionId, title, content })
  });
  cacheWorkspaceSnapshot(snapshot);

  return snapshot.sections;
}

export async function listImportedDocuments(): Promise<ImportedDocument[]> {
  return (await getSnapshot()).documents;
}

export async function listWorkspaceResources(): Promise<WorkspaceResource[]> {
  return (await getSnapshot()).resources;
}

export async function getScoutSkillSettings(): Promise<{
  skills: ScoutSkill[];
  settings: ScoutSkillSettings;
  enabledSkillIds: string[];
}> {
  return requestJson('/app-api/workspace/skills');
}

export async function setWorkspaceScoutSkillEnabled(skillId: string, enabled: boolean): Promise<{
  skills: ScoutSkill[];
  settings: ScoutSkillSettings;
  enabledSkillIds: string[];
}> {
  return requestJson('/app-api/workspace/skills', {
    method: 'PATCH',
    body: JSON.stringify({ skillId, enabled })
  });
}

export async function importResourceFiles(files: FileList | File[]): Promise<WorkspaceResource[]> {
  const queue = Array.from(files);
  if (queue.length === 0) return [];

  const formData = new FormData();
  for (const file of queue) {
    formData.append('files', file);
  }

  const snapshot = await requestJson<WorkspaceSnapshot>(WORKSPACE_ENDPOINT + '/resources', {
    method: 'POST',
    body: formData
  });
  cacheWorkspaceSnapshot(snapshot);

  return snapshot.resources;
}

export async function createWorkspaceResource(input: {
  kind: 'url' | 'note' | 'official-source';
  title?: string;
  sourceUri?: string;
  text?: string;
  sensitivity?: WorkspaceResourceSensitivity;
  searchable?: boolean;
}): Promise<WorkspaceResource> {
  const payload = await requestJson<{ resource: WorkspaceResource; workspace: WorkspaceSnapshot }>(WORKSPACE_ENDPOINT + '/resources', {
    method: 'POST',
    body: JSON.stringify(input)
  });
  cacheWorkspaceSnapshot(payload.workspace);

  return payload.resource;
}

export async function deleteWorkspaceResource(resourceId: string): Promise<void> {
  await requestJson(WORKSPACE_ENDPOINT + `/resources/${resourceId}`, {
    method: 'DELETE'
  });
}

export async function importDocumentFiles(files: FileList | File[]): Promise<ImportedDocument[]> {
  const queue = Array.from(files);
  if (queue.length === 0) return [];

  const formData = new FormData();
  for (const file of queue) {
    formData.append('files', file);
  }

  const snapshot = await requestJson<WorkspaceSnapshot>(WORKSPACE_ENDPOINT + '/documents', {
    method: 'POST',
    body: formData
  });
  cacheWorkspaceSnapshot(snapshot);

  return snapshot.documents;
}

export async function createWorkspaceDocument(input: {
  title: string;
  textContent?: string;
  note?: string;
  slotKey?: StandardDocumentSlotKey | null;
}): Promise<ImportedDocument> {
  const payload = await requestJson<{ document: ImportedDocument; workspace: WorkspaceSnapshot }>(WORKSPACE_ENDPOINT + '/documents', {
    method: 'POST',
    body: JSON.stringify(input)
  });
  cacheWorkspaceSnapshot(payload.workspace);

  return payload.document;
}

export async function getImportedDocument(documentId: string): Promise<ImportedDocument> {
  const payload = await requestJson<{ document: ImportedDocument }>(WORKSPACE_ENDPOINT + `/documents/${documentId}`);
  return payload.document;
}

export async function updateImportedDocumentState(
  documentId: string,
  input: {
    status?: ImportedDocumentStatus;
    visibility?: ImportedDocumentVisibility;
    searchable?: boolean;
    currentVersionId?: string;
  }
): Promise<ImportedDocument> {
  const payload = await requestJson<{ document: ImportedDocument }>(WORKSPACE_ENDPOINT + `/documents/${documentId}`, {
    method: 'PATCH',
    body: JSON.stringify(input)
  });

  return payload.document;
}

export async function deleteImportedDocument(documentId: string): Promise<void> {
  await requestJson(WORKSPACE_ENDPOINT + `/documents/${documentId}`, {
    method: 'DELETE'
  });
}

export async function addChecklistTool(input: {
  title: string;
  summary: string;
  instructions: string;
  itemsText: string;
}): Promise<WorkspaceTool[]> {
  const snapshot = await requestJson<WorkspaceSnapshot>(WORKSPACE_ENDPOINT + '/tools/checklist', {
    method: 'POST',
    body: JSON.stringify(input)
  });
  cacheWorkspaceSnapshot(snapshot);

  return snapshot.tools;
}

export async function deleteTool(toolId: string): Promise<WorkspaceTool[]> {
  const snapshot = await requestJson<WorkspaceSnapshot>(WORKSPACE_ENDPOINT + `/tools/${toolId}`, {
    method: 'DELETE'
  });
  cacheWorkspaceSnapshot(snapshot);

  return snapshot.tools;
}

export async function searchWorkspace(query: string): Promise<SearchHit[]> {
  const snapshot = await getSnapshot();

  return [
    ...searchManualSections(snapshot.sections, query),
    ...searchPublicCorpus(publicCorpus, query),
    ...searchImportedDocuments(snapshot.documents, query),
    ...searchWorkspaceResources(snapshot.resources, query),
    ...searchWorkspaceTools(snapshot.tools, query)
  ]
    .sort((left, right) => right.score - left.score)
    .slice(0, 30);
}

export async function downloadManualExport(): Promise<void> {
  const snapshot = await getSnapshot();
  if (!snapshot.profile) {
    throw new Error('No manual exists yet.');
  }

  const html = buildManualExportHtml(snapshot.profile, snapshot.sections);
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `${(snapshot.profile.trailName || 'my').toLowerCase().replace(/[^a-z0-9]+/giu, '-')}-field-manual.html`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}
