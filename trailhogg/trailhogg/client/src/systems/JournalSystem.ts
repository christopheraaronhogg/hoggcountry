// ============================================
// TRAILHOGG - Journal System
// Records milestones, encounters, and memories
// ============================================

export type JournalCategory = 'milestone' | 'scenic' | 'encounter' | 'memory';

export interface JournalEntry {
  id: string;
  gameDay: number;
  gameHour: number;
  playerMile: number;
  category: JournalCategory;
  emoji: string;
  title: string;
  message: string;
  data?: {
    location?: string;
    npcName?: string;
    weather?: string;
    elevation?: number;
    state?: string;
  };
}

export interface SerializedJournalData {
  entries: JournalEntry[];
}

// Category-specific emojis
const CATEGORY_EMOJIS: Record<JournalCategory, string[]> = {
  milestone: ['🏔️', '🎉', '⭐', '🏁', '📍'],
  scenic: ['🌅', '🌈', '🦌', '🌸', '🌲'],
  encounter: ['👋', '🤝', '❤️', '🔥', '👥'],
  memory: ['📝', '💭', '✨', '🎵', '🌟'],
};

class JournalSystem {
  private entries: JournalEntry[] = [];
  private entryIdCounter: number = 0;

  constructor() {}

  /**
   * Add a new journal entry
   */
  addEntry(
    category: JournalCategory,
    title: string,
    message: string,
    gameDay: number,
    gameHour: number,
    playerMile: number,
    data?: JournalEntry['data']
  ): JournalEntry {
    // Pick a random emoji from the category
    const emojis = CATEGORY_EMOJIS[category];
    const emoji = emojis[Math.floor(Math.random() * emojis.length)];

    const entry: JournalEntry = {
      id: `journal_${++this.entryIdCounter}_${Date.now()}`,
      gameDay,
      gameHour,
      playerMile,
      category,
      emoji,
      title,
      message,
      data,
    };

    this.entries.push(entry);
    console.log(`[Journal] New entry: ${emoji} ${title}`);

    return entry;
  }

  /**
   * Get all entries, optionally filtered by category
   */
  getEntries(filter?: JournalCategory): JournalEntry[] {
    if (!filter) {
      return [...this.entries].sort((a, b) => {
        // Sort by day descending, then hour descending
        if (b.gameDay !== a.gameDay) return b.gameDay - a.gameDay;
        return b.gameHour - a.gameHour;
      });
    }

    return this.entries
      .filter(e => e.category === filter)
      .sort((a, b) => {
        if (b.gameDay !== a.gameDay) return b.gameDay - a.gameDay;
        return b.gameHour - a.gameHour;
      });
  }

  /**
   * Get entries by mile range
   */
  getEntriesNearMile(mile: number, range: number = 5): JournalEntry[] {
    return this.entries
      .filter(e => Math.abs(e.playerMile - mile) <= range)
      .sort((a, b) => Math.abs(a.playerMile - mile) - Math.abs(b.playerMile - mile));
  }

  /**
   * Get the total number of entries
   */
  getEntryCount(): number {
    return this.entries.length;
  }

  /**
   * Get count by category
   */
  getCategoryCount(category: JournalCategory): number {
    return this.entries.filter(e => e.category === category).length;
  }

  /**
   * Check if we have an entry for a specific milestone
   * Useful to avoid duplicate milestone entries
   */
  hasMilestone(title: string): boolean {
    return this.entries.some(e => e.category === 'milestone' && e.title === title);
  }

  /**
   * Get most recent entry
   */
  getLatestEntry(): JournalEntry | null {
    if (this.entries.length === 0) return null;
    return this.entries[this.entries.length - 1];
  }

  /**
   * Clear all entries (for new game)
   */
  clear(): void {
    this.entries = [];
    this.entryIdCounter = 0;
  }

  /**
   * Serialize for saving
   */
  serialize(): SerializedJournalData {
    return {
      entries: [...this.entries],
    };
  }

  /**
   * Deserialize from save data
   */
  deserialize(data: SerializedJournalData): void {
    this.entries = data.entries || [];

    // Find highest ID to set counter correctly
    let maxId = 0;
    for (const entry of this.entries) {
      const match = entry.id.match(/journal_(\d+)_/);
      if (match) {
        maxId = Math.max(maxId, parseInt(match[1], 10));
      }
    }
    this.entryIdCounter = maxId;

    console.log(`[Journal] Restored ${this.entries.length} entries`);
  }
}

// Singleton instance
export const journalSystem = new JournalSystem();
