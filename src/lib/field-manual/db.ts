import { buildFieldManualFileName, buildFieldManualHtml } from './export';
import { readFieldManualImport } from './import';
import {
  createManualNoteEntry,
  normalizeManualEntry,
  sortManualEntries,
  type FieldManualEntry,
  type FieldManualEntryInput,
  type FieldManualImportResult,
} from './types';

const DB_NAME = 'hogg-country-field-manual';
const DB_VERSION = 1;
const STORE_NAME = 'manual';

type ManualListener = (entries: readonly FieldManualEntry[]) => void;

let dbPromise: Promise<IDBDatabase> | null = null;
let hydratePromise: Promise<readonly FieldManualEntry[]> | null = null;
let hydrated = false;
let cache: FieldManualEntry[] = [];
const listeners = new Set<ManualListener>();

function isBrowser(): boolean {
  return typeof window !== 'undefined' && typeof indexedDB !== 'undefined';
}

function emit(): void {
  const snapshot = Object.freeze([...cache]);
  for (const listener of listeners) {
    listener(snapshot);
  }
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
    throw new Error('Field Manual storage is only available in the browser.');
  }

  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(STORE_NAME)) {
        const store = database.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('by_position', 'position', { unique: false });
      }
    };

    request.onsuccess = () => {
      const database = request.result;
      database.onversionchange = () => {
        database.close();
        dbPromise = null;
      };
      resolve(database);
    };

    request.onerror = () => {
      reject(request.error ?? new Error('Could not open Field Manual storage.'));
    };
  });

  return dbPromise;
}

async function readAllEntries(): Promise<FieldManualEntry[]> {
  const database = await openDatabase();
  const transaction = database.transaction(STORE_NAME, 'readonly');
  const store = transaction.objectStore(STORE_NAME);
  const entries = await requestToPromise<FieldManualEntry[]>(store.getAll());
  await transactionToPromise(transaction);
  return sortManualEntries(entries);
}

async function writeEntries(entries: FieldManualEntry[]): Promise<void> {
  const database = await openDatabase();
  const transaction = database.transaction(STORE_NAME, 'readwrite');
  const store = transaction.objectStore(STORE_NAME);

  store.clear();
  for (const entry of entries) {
    store.put(entry);
  }

  await transactionToPromise(transaction);
}

function setCache(entries: FieldManualEntry[]): readonly FieldManualEntry[] {
  cache = sortManualEntries(entries).map((entry, index) => ({
    ...entry,
    position: index,
  }));
  hydrated = true;
  emit();
  return Object.freeze([...cache]);
}

function nextPosition(entries: readonly FieldManualEntry[]): number {
  return entries.length;
}

export function getManualSnapshot(): readonly FieldManualEntry[] {
  return Object.freeze([...cache]);
}

export function subscribeToManual(listener: ManualListener): () => void {
  listeners.add(listener);
  listener(getManualSnapshot());

  return () => {
    listeners.delete(listener);
  };
}

export async function hydrateManual(): Promise<readonly FieldManualEntry[]> {
  if (!isBrowser()) {
    return getManualSnapshot();
  }

  if (hydrated) {
    return getManualSnapshot();
  }

  if (hydratePromise) {
    return hydratePromise;
  }

  hydratePromise = readAllEntries()
    .then((entries) => setCache(entries))
    .finally(() => {
      hydratePromise = null;
    });

  return hydratePromise;
}

export async function pinToManual(entry: FieldManualEntryInput): Promise<void> {
  const entries = [...await hydrateManual()];
  const existing = entries.find((candidate) => candidate.id === entry.id);

  const normalized = normalizeManualEntry({
    ...entry,
    position: existing?.position ?? entry.position ?? nextPosition(entries),
  }, existing);

  const nextEntries = existing
    ? entries.map((candidate) => (candidate.id === normalized.id ? normalized : candidate))
    : [...entries, normalized];

  const orderedEntries = nextEntries.map((candidate, index) => ({
    ...candidate,
    position: index,
  }));

  await writeEntries(orderedEntries);
  setCache(orderedEntries);
}

export async function removeFromManual(entryId: string): Promise<void> {
  const entries = [...await hydrateManual()];
  const nextEntries = entries
    .filter((entry) => entry.id !== entryId)
    .map((entry, index) => ({
      ...entry,
      position: index,
    }));

  await writeEntries(nextEntries);
  setCache(nextEntries);
}

export async function listManual(): Promise<FieldManualEntry[]> {
  return [...await hydrateManual()];
}

export async function reorderManual(entryIds: string[]): Promise<void> {
  const entries = [...await hydrateManual()];
  const byId = new Map(entries.map((entry) => [entry.id, entry]));
  const reordered: FieldManualEntry[] = [];

  for (const entryId of entryIds) {
    const entry = byId.get(entryId);
    if (entry) {
      reordered.push(entry);
      byId.delete(entryId);
    }
  }

  for (const remaining of entries) {
    if (byId.has(remaining.id)) {
      reordered.push(remaining);
    }
  }

  const nextEntries = reordered.map((entry, index) => ({
    ...entry,
    position: index,
    updatedAt: new Date().toISOString(),
  }));

  await writeEntries(nextEntries);
  setCache(nextEntries);
}

export async function updateNote(entryId: string, note: string): Promise<void> {
  const entries = [...await hydrateManual()];
  const nextEntries = entries.map((entry) => (
    entry.id === entryId
      ? {
          ...entry,
          note,
          updatedAt: new Date().toISOString(),
        }
      : entry
  ));

  await writeEntries(nextEntries);
  setCache(nextEntries);
}

export async function exportToHTML(): Promise<Blob> {
  const entries = [...await listManual()];
  const html = buildFieldManualHtml(entries);
  return new Blob([html], { type: 'text/html;charset=utf-8' });
}

export async function importFromHTML(file: Blob): Promise<FieldManualImportResult> {
  const payload = await readFieldManualImport(file);
  const nextEntries = payload.entries.map((entry, index) => ({
    ...entry,
    position: index,
  }));

  await writeEntries(nextEntries);
  setCache(nextEntries);

  return {
    imported: nextEntries.length,
    version: payload.version,
  };
}

export async function downloadManualExport(): Promise<void> {
  if (!isBrowser()) return;

  const blob = await exportToHTML();
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = buildFieldManualFileName();
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

export { createManualNoteEntry };
