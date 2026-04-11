import {
  addUserBlock,
  buildManualExportHtml,
  buildStarterManual,
  createId,
  nowIso,
  searchImportedDocuments,
  searchManualSections,
  updateProfileTimestamp,
  type ImportedDocument,
  type ImportedDocumentKind,
  type ManualProfile,
  type ManualSection,
  type SearchHit
} from '@hoggcountry/manual-core';
import { publicCorpus, searchPublicCorpus } from '@hoggcountry/corpus';

const DB_NAME = 'hogg-country-openclaw-web';
const DB_VERSION = 1;
const KV_STORE = 'workspace';
const DOC_STORE = 'documents';
const PROFILE_KEY = 'profile';
const SECTION_KEY = 'sections';

interface KvRecord<T> {
  readonly key: string;
  readonly value: T;
  readonly updatedAt: string;
}

let dbPromise: Promise<IDBDatabase> | null = null;

function isBrowser(): boolean {
  return typeof window !== 'undefined' && typeof indexedDB !== 'undefined';
}

function requestToPromise<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('IndexedDB request failed.'));
  });
}

function transactionToPromise(transaction: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error ?? new Error('IndexedDB transaction failed.'));
    transaction.onabort = () => reject(transaction.error ?? new Error('IndexedDB transaction aborted.'));
  });
}

async function openDatabase(): Promise<IDBDatabase> {
  if (!isBrowser()) {
    throw new Error('Workspace storage is only available in the browser.');
  }

  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(KV_STORE)) {
        database.createObjectStore(KV_STORE, { keyPath: 'key' });
      }
      if (!database.objectStoreNames.contains(DOC_STORE)) {
        database.createObjectStore(DOC_STORE, { keyPath: 'id' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('Could not open workspace database.'));
  });

  return dbPromise;
}

async function readKv<T>(key: string): Promise<T | null> {
  const database = await openDatabase();
  const transaction = database.transaction(KV_STORE, 'readonly');
  const store = transaction.objectStore(KV_STORE);
  const record = await requestToPromise<KvRecord<T> | undefined>(store.get(key));
  await transactionToPromise(transaction);
  return record?.value ?? null;
}

async function writeKv<T>(key: string, value: T): Promise<void> {
  const database = await openDatabase();
  const transaction = database.transaction(KV_STORE, 'readwrite');
  const store = transaction.objectStore(KV_STORE);

  store.put({
    key,
    value,
    updatedAt: nowIso()
  } satisfies KvRecord<T>);

  await transactionToPromise(transaction);
}

function detectDocumentKind(file: File): ImportedDocumentKind {
  const fileName = file.name.toLowerCase();
  if (file.type === 'application/pdf' || fileName.endsWith('.pdf')) return 'pdf';
  if (file.type === 'text/html' || fileName.endsWith('.html') || fileName.endsWith('.htm')) return 'html';
  if (fileName.endsWith('.md') || fileName.endsWith('.markdown')) return 'markdown';
  return 'text';
}

function htmlToText(html: string): string {
  if (typeof DOMParser === 'undefined') {
    return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  }

  const document = new DOMParser().parseFromString(html, 'text/html');
  return document.body.textContent?.replace(/\s+/g, ' ').trim() ?? '';
}

async function fileText(file: File, kind: ImportedDocumentKind): Promise<string> {
  if (kind === 'pdf') return '';
  const raw = await file.text();
  return kind === 'html' ? htmlToText(raw) : raw.replace(/\s+/g, ' ').trim();
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
  return (await readKv<ManualProfile>(PROFILE_KEY)) !== null;
}

export async function getProfile(): Promise<ManualProfile | null> {
  if (!isBrowser()) return null;
  return readKv<ManualProfile>(PROFILE_KEY);
}

export async function getSections(): Promise<ManualSection[]> {
  if (!isBrowser()) return [];
  return (await readKv<ManualSection[]>(SECTION_KEY)) ?? [];
}

export async function saveProfile(profile: ManualProfile): Promise<ManualProfile> {
  const nextProfile = updateProfileTimestamp(profile);
  await writeKv(PROFILE_KEY, nextProfile);
  return nextProfile;
}

export async function saveSections(sections: ManualSection[]): Promise<void> {
  await writeKv(SECTION_KEY, sections);
}

export async function initializeManual(profile: ManualProfile): Promise<void> {
  const normalizedProfile = updateProfileTimestamp({
    ...profile,
    id: profile.id || createId('profile'),
    createdAt: profile.createdAt || nowIso()
  });
  const starterSections = buildStarterManual(normalizedProfile);

  await writeKv(PROFILE_KEY, normalizedProfile);
  await writeKv(SECTION_KEY, starterSections);
}

export async function setCurrentMile(mile: number): Promise<ManualProfile | null> {
  const profile = await getProfile();
  if (!profile) return null;

  const nextProfile = await saveProfile({
    ...profile,
    currentMile: Number.isFinite(mile) ? Math.max(0, mile) : profile.currentMile
  });

  return nextProfile;
}

export async function addNoteToSection(sectionId: string, title: string, content: string): Promise<ManualSection[]> {
  const sections = await getSections();
  const nextSections = addUserBlock(sections, sectionId, title, content);
  await saveSections(nextSections);
  return nextSections;
}

export async function listImportedDocuments(): Promise<ImportedDocument[]> {
  if (!isBrowser()) return [];

  const database = await openDatabase();
  const transaction = database.transaction(DOC_STORE, 'readonly');
  const store = transaction.objectStore(DOC_STORE);
  const docs = await requestToPromise<ImportedDocument[]>(store.getAll());
  await transactionToPromise(transaction);
  return docs.sort((left, right) => right.importedAt.localeCompare(left.importedAt));
}

export async function importDocumentFiles(files: FileList | File[]): Promise<ImportedDocument[]> {
  const queue = Array.from(files);
  if (queue.length === 0) return [];

  const imported: ImportedDocument[] = [];
  const database = await openDatabase();
  const transaction = database.transaction(DOC_STORE, 'readwrite');
  const store = transaction.objectStore(DOC_STORE);

  for (const file of queue) {
    const kind = detectDocumentKind(file);
    const textContent = await fileText(file, kind);
    const searchable = kind !== 'pdf';
    const importedAt = nowIso();

    const record: ImportedDocument = {
      id: createId('doc'),
      title: file.name.replace(/\.[^.]+$/u, ''),
      fileName: file.name,
      kind,
      rights: 'user-imported',
      searchable,
      textContent,
      note: searchable
        ? ''
        : 'Stored locally. PDF upload works now; text extraction can be layered in later without changing the locker UI.',
      importedAt,
      sizeBytes: file.size
    };

    store.put(record);
    imported.push(record);
  }

  await transactionToPromise(transaction);
  return imported;
}

export async function deleteImportedDocument(documentId: string): Promise<void> {
  const database = await openDatabase();
  const transaction = database.transaction(DOC_STORE, 'readwrite');
  transaction.objectStore(DOC_STORE).delete(documentId);
  await transactionToPromise(transaction);
}

export async function searchWorkspace(query: string): Promise<SearchHit[]> {
  const [sections, docs] = await Promise.all([getSections(), listImportedDocuments()]);

  return [
    ...searchManualSections(sections, query),
    ...searchPublicCorpus(publicCorpus, query),
    ...searchImportedDocuments(docs, query)
  ]
    .sort((left, right) => right.score - left.score)
    .slice(0, 30);
}

export async function downloadManualExport(): Promise<void> {
  const [profile, sections] = await Promise.all([getProfile(), getSections()]);
  if (!profile) {
    throw new Error('No manual exists yet.');
  }

  const html = buildManualExportHtml(profile, sections);
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `${(profile.trailName || 'my').toLowerCase().replace(/[^a-z0-9]+/giu, '-')}-field-manual.html`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}
