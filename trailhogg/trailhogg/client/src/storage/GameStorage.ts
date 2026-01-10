// ============================================
// TRAILHOGG - IndexedDB Game Storage
// Persists game state for offline play
// ============================================

const DB_NAME = 'trailhogg';
const DB_VERSION = 1;
const STORE_NAME = 'saves';

export interface SaveData {
  id: string;
  timestamp: number;
  hikerName: string;
  mile: number;
  daysOnTrail: number;
  hiker: HikerSaveData;
  game: GameSaveData;
}

export interface HikerSaveData {
  name: string;
  build?: string;
  mile: number;
  elevation: number;
  calories: number;
  hydration: number;
  energy: number;
  health: number;
  pace: string;
  lostState: string;
  isHiking: boolean;
  currentDayMiles: number;
  totalMilesHiked: number;
  daysOnTrail: number;
  skills: {
    trailLegs: number;
    navigation: number;
    campCraft: number;
    firstAid: number;
    mentalFortitude: number;
    [key: string]: number;
  };
  moodles: {
    hunger: number;
    thirst: number;
    fatigue: number;
    morale: number;
    anxiety: number;
    [key: string]: number;
  };
  inventory: {
    water: number;
    waterCapacity: number;
    money: number;
    [key: string]: number;
  };
}

export interface GameSaveData {
  time: { day: number; hour: number; minute: number };
  phase: string;
  weather: string;
  temperature: number;
}

class GameStorage {
  private db: IDBDatabase | null = null;
  private dbReady: Promise<void>;

  constructor() {
    this.dbReady = this.initDB();
  }

  private initDB(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        console.error('Failed to open IndexedDB:', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        console.log('IndexedDB opened successfully');
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create saves store
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
          store.createIndex('timestamp', 'timestamp', { unique: false });
          store.createIndex('hikerName', 'hikerName', { unique: false });
          console.log('Created saves store');
        }
      };
    });
  }

  async save(hiker: HikerSaveData, game: GameSaveData, slotId: string = 'autosave'): Promise<void> {
    await this.dbReady;

    if (!this.db) {
      throw new Error('Database not initialized');
    }

    const saveData: SaveData = {
      id: slotId,
      timestamp: Date.now(),
      hikerName: hiker.name,
      mile: hiker.mile,
      daysOnTrail: hiker.daysOnTrail,
      hiker,
      game
    };

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.put(saveData);

      request.onsuccess = () => {
        console.log(`Game saved to slot: ${slotId}`);
        resolve();
      };

      request.onerror = () => {
        console.error('Failed to save game:', request.error);
        reject(request.error);
      };
    });
  }

  async load(slotId: string = 'autosave'): Promise<SaveData | null> {
    await this.dbReady;

    if (!this.db) {
      throw new Error('Database not initialized');
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(slotId);

      request.onsuccess = () => {
        if (request.result) {
          console.log(`Game loaded from slot: ${slotId}`);
          resolve(request.result);
        } else {
          resolve(null);
        }
      };

      request.onerror = () => {
        console.error('Failed to load game:', request.error);
        reject(request.error);
      };
    });
  }

  async hasSave(slotId: string = 'autosave'): Promise<boolean> {
    try {
      const save = await this.load(slotId);
      return save !== null;
    } catch {
      return false;
    }
  }

  async getSaveInfo(slotId: string = 'autosave'): Promise<{
    exists: boolean;
    hikerName?: string;
    mile?: number;
    daysOnTrail?: number;
    timestamp?: number;
  }> {
    try {
      const save = await this.load(slotId);
      if (save) {
        return {
          exists: true,
          hikerName: save.hikerName,
          mile: save.mile,
          daysOnTrail: save.daysOnTrail,
          timestamp: save.timestamp
        };
      }
      return { exists: false };
    } catch {
      return { exists: false };
    }
  }

  async deleteSave(slotId: string = 'autosave'): Promise<void> {
    await this.dbReady;

    if (!this.db) {
      throw new Error('Database not initialized');
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(slotId);

      request.onsuccess = () => {
        console.log(`Deleted save: ${slotId}`);
        resolve();
      };

      request.onerror = () => {
        console.error('Failed to delete save:', request.error);
        reject(request.error);
      };
    });
  }

  async getAllSaves(): Promise<SaveData[]> {
    await this.dbReady;

    if (!this.db) {
      throw new Error('Database not initialized');
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAll();

      request.onsuccess = () => {
        resolve(request.result || []);
      };

      request.onerror = () => {
        console.error('Failed to get all saves:', request.error);
        reject(request.error);
      };
    });
  }
}

// Export singleton instance
export const gameStorage = new GameStorage();
