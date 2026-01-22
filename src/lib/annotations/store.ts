/**
 * IndexedDB storage for highlights
 *
 * Provides CRUD operations + export/import for backup
 */
import type { Highlight } from './types';

const DB_NAME = 'guide-annotations';
const DB_VERSION = 1;
const STORE_NAME = 'highlights';

let dbPromise: Promise<IDBDatabase> | null = null;

function openDB(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('chapterId', 'chapterId', { unique: false });
        store.createIndex('createdAt', 'createdAt', { unique: false });
      }
    };
  });

  return dbPromise;
}

/**
 * Get all highlights for a specific chapter
 */
export async function getHighlightsForChapter(
  chapterId: string
): Promise<Highlight[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const index = store.index('chapterId');
    const request = index.getAll(chapterId);

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Get all highlights across all chapters
 */
export async function getAllHighlights(): Promise<Highlight[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const request = store.getAll();

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Save a new highlight
 */
export async function saveHighlight(highlight: Highlight): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const request = store.put(highlight);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

/**
 * Update an existing highlight
 */
export async function updateHighlight(
  id: string,
  updates: Partial<Omit<Highlight, 'id'>>
): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const getRequest = store.get(id);

    getRequest.onsuccess = () => {
      const existing = getRequest.result;
      if (!existing) {
        reject(new Error(`Highlight ${id} not found`));
        return;
      }

      const updated = {
        ...existing,
        ...updates,
        updatedAt: Date.now(),
      };

      const putRequest = store.put(updated);
      putRequest.onsuccess = () => resolve();
      putRequest.onerror = () => reject(putRequest.error);
    };

    getRequest.onerror = () => reject(getRequest.error);
  });
}

/**
 * Delete a highlight by ID
 */
export async function deleteHighlight(id: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const request = store.delete(id);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

/**
 * Export all highlights as JSON string (for backup)
 */
export async function exportHighlights(): Promise<string> {
  const highlights = await getAllHighlights();
  return JSON.stringify(
    {
      version: 1,
      exportedAt: new Date().toISOString(),
      highlights,
    },
    null,
    2
  );
}

/**
 * Import highlights from JSON string
 * Returns count of imported and skipped (duplicate) highlights
 */
export async function importHighlights(
  json: string
): Promise<{ imported: number; skipped: number }> {
  const data = JSON.parse(json);

  if (!data.highlights || !Array.isArray(data.highlights)) {
    throw new Error('Invalid export format');
  }

  const existing = await getAllHighlights();
  const existingIds = new Set(existing.map((h) => h.id));

  let imported = 0;
  let skipped = 0;

  for (const highlight of data.highlights) {
    if (existingIds.has(highlight.id)) {
      skipped++;
    } else {
      await saveHighlight(highlight);
      imported++;
    }
  }

  return { imported, skipped };
}

/**
 * Clear all highlights (use with caution!)
 */
export async function clearAllHighlights(): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const request = store.clear();

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}
