// ============================================
// TRAILHOGG - Bubble System
// Persistent NPC hikers that travel the trail
// ============================================

import { generateNPCData, getGreeting, getQuitReason } from '../data/NPCNames';
import { TOWNS, SHELTERS } from '../data/TrailData';

export type NPCSpriteType = 'hikerBearded' | 'hikerPonytail' | 'hikerUltralight' | 'sectionHiker';
export type NPCPace = 'slow' | 'moderate' | 'fast';
export type NPCState = 'hiking' | 'resting' | 'town' | 'quit';

export interface BubbleNPC {
  id: string;
  trailName: string;
  realName: string;
  hometown: string;
  spriteType: NPCSpriteType;

  // Trail position
  mile: number;
  direction: 'nobo' | 'sobo';
  daysOnTrail: number;
  startMile: number;

  // Personality (affects behavior)
  personality: {
    pace: NPCPace;      // Hiking speed: slow=1.5, moderate=2.0, fast=2.5 mph
    social: number;     // 0-100: likelihood to stay at shelters
    frugal: number;     // 0-100: prefers camping over hostels
  };

  // Current state
  state: NPCState;
  currentLocation?: string;  // Town or shelter name if stopped
  energy: number;            // 0-100
  morale: number;            // 0-100

  // Player relationship
  relationship: {
    encounters: number;
    friendliness: number;    // 0-100
    lastSeenDay: number;
    memorableEvents: string[];
  };

  // Helpful trail tips they share
  trailTips: string[];
  quitReason?: string;
  
  // Companion status
  companionStatus?: 'available' | 'invited' | 'active' | 'resting';
}

// Pace in miles per game hour
const PACE_SPEEDS: Record<NPCPace, number> = {
  slow: 1.5,
  moderate: 2.0,
  fast: 2.5,
};

const SPRITE_TYPES: NPCSpriteType[] = ['hikerBearded', 'hikerPonytail', 'hikerUltralight', 'sectionHiker'];

export class BubbleSystem {
  private npcs: Map<string, BubbleNPC> = new Map();
  private yardSaleItems: YardSaleItem[] = [];
  private lastSimulationTime: number = 0;
  private activeCompanionId: string | null = null;

  constructor() {}

  // Generate initial bubble of 15-20 NPCs around the player's position
  generateBubble(playerMile: number, playerDaysOnTrail: number): void {
    this.npcs.clear();
    this.activeCompanionId = null;

    const count = 15 + Math.floor(Math.random() * 6); // 15-20 NPCs

    for (let i = 0; i < count; i++) {
      const npc = this.createNPC(i, playerMile, playerDaysOnTrail);
      this.npcs.set(npc.id, npc);
    }

    console.log(`[BubbleSystem] Generated ${count} NPCs around mile ${playerMile}`);
  }

  private createNPC(index: number, playerMile: number, playerDaysOnTrail: number): BubbleNPC {
    const data = generateNPCData(index, playerMile);

    // Distribute NPCs: some ahead, some behind, some at player's position
    // Range: -20 to +20 miles from player
    const mileOffset = (Math.random() - 0.5) * 40;
    const mile = Math.max(0, Math.min(2197.9, playerMile + mileOffset));

    // Days on trail correlates loosely with position
    const daysOffset = Math.floor(mileOffset / 2) + Math.floor(Math.random() * 10) - 5;
    const daysOnTrail = Math.max(1, playerDaysOnTrail + daysOffset);

    // Random personality
    const paces: NPCPace[] = ['slow', 'moderate', 'fast'];
    const pace = paces[Math.floor(Math.random() * 3)];

    // Sprite type based on index for variety
    const spriteType = SPRITE_TYPES[index % SPRITE_TYPES.length];

    return {
      id: `npc_${index}`,
      trailName: data.trailName,
      realName: data.realName,
      hometown: data.hometown,
      spriteType,

      mile,
      direction: 'nobo',
      daysOnTrail,
      startMile: 0,

      personality: {
        pace,
        social: 30 + Math.floor(Math.random() * 60),    // 30-90
        frugal: 20 + Math.floor(Math.random() * 70),    // 20-90
      },

      state: 'hiking',
      energy: 50 + Math.floor(Math.random() * 50),       // 50-100
      morale: 50 + Math.floor(Math.random() * 40),       // 50-90

      relationship: {
        encounters: 0,
        friendliness: 50,
        lastSeenDay: 0,
        memorableEvents: [],
      },

      trailTips: data.trailTips,
      companionStatus: 'available'
    };
  }

  // Simulate all NPCs - call every 5 seconds of real time
  simulateNPCs(playerMile: number, gameHour: number, gameDay: number): void {
    // Only simulate during hiking hours (6 AM - 8 PM)
    const isHikingHours = gameHour >= 6 && gameHour < 20;

    for (const npc of this.npcs.values()) {
      if (npc.state === 'quit') continue;

      // Special handling for active companion
      if (npc.id === this.activeCompanionId && npc.companionStatus === 'active') {
        this.simulateCompanion(npc, playerMile, isHikingHours);
      } else {
        this.simulateNPC(npc, playerMile, gameHour, gameDay, isHikingHours);
      }
    }
  }

  private simulateCompanion(npc: BubbleNPC, playerMile: number, isHikingHours: boolean): void {
    // Companion syncs to player position
    // If player is hiking, companion hikes.
    // We assume this is called when player moves, or periodically.
    // For simplicity, we snap companion to player mile with a small random offset
    // so they appear to be hiking alongside.
    
    // Offset oscillates slightly to look natural
    const offset = Math.sin(Date.now() / 1000) * 0.0005; 
    npc.mile = playerMile - 0.001 + offset; // Always slightly behind/beside
    
    // Energy management
    if (isHikingHours) {
        // Drain energy slightly slower than alone because of morale boost? 
        // Or same. Let's say standard drain.
        npc.energy = Math.max(0, npc.energy - 0.4); 
    } else {
        // Resting
        npc.energy = Math.min(100, npc.energy + 2);
    }
    
    // Morale boost from being a companion
    npc.morale = Math.min(100, npc.morale + 0.1);
  }

  private simulateNPC(
    npc: BubbleNPC,
    playerMile: number,
    gameHour: number,
    gameDay: number,
    isHikingHours: boolean
  ): void {
    switch (npc.state) {
      case 'hiking':
        if (!isHikingHours) {
          // Stop for the night
          npc.state = 'resting';
          npc.currentLocation = this.findNearestShelter(npc.mile) || undefined;
          break;
        }

        // Progress on trail
        const speed = PACE_SPEEDS[npc.personality.pace];
        const energyMod = npc.energy / 100;
        // 5 seconds = 5/3600 hours, but game time runs faster
        // Assume 1 real second = ~1 game minute at 1x speed
        // So 5 real seconds = ~5 game minutes = 5/60 hours
        const milesPerTick = (speed * (5 / 60)) * energyMod;

        if (npc.direction === 'nobo') {
          npc.mile = Math.min(2197.9, npc.mile + milesPerTick);
        } else {
          npc.mile = Math.max(0, npc.mile - milesPerTick);
        }

        // Energy drain
        npc.energy = Math.max(0, npc.energy - 0.5);

        // Check for town entry
        const nearbyTown = this.findNearbyTown(npc.mile);
        if (nearbyTown && npc.energy < 50) {
          npc.state = 'town';
          npc.currentLocation = nearbyTown;
          break;
        }

        // Check for shelter rest
        if (npc.energy < 30 && isHikingHours) {
          const shelter = this.findNearestShelter(npc.mile);
          if (shelter && npc.personality.social > 40) {
            npc.state = 'resting';
            npc.currentLocation = shelter || undefined;
          }
        }
        break;

      case 'resting':
        // Recover energy
        npc.energy = Math.min(100, npc.energy + 2);

        // Resume hiking in morning with full energy
        if (gameHour >= 6 && gameHour < 8 && npc.energy > 70) {
          npc.state = 'hiking';
          npc.currentLocation = undefined;
        }
        break;

      case 'town':
        // Slowly recover
        npc.energy = Math.min(100, npc.energy + 1);
        npc.morale = Math.min(100, npc.morale + 0.5);

        // Leave town when recovered (based on personality)
        const stayChance = (100 - npc.personality.frugal) / 100;
        if (npc.energy > 90 && Math.random() > stayChance * 0.1) {
          npc.state = 'hiking';
          npc.currentLocation = undefined;
        }
        break;
    }

    // Morale drift
    npc.morale += (Math.random() - 0.5) * 1;
    npc.morale = Math.max(0, Math.min(100, npc.morale));

    // Quit check - very low morale over time
    if (npc.morale < 15 && npc.energy < 20 && npc.daysOnTrail > 10) {
      if (Math.random() < 0.002) {
        this.npcQuits(npc);
      }
    }
  }

  private findNearbyTown(mile: number): string | null {
    for (const town of TOWNS) {
      if (Math.abs(town.mile - mile) < 0.3) {
        return town.name;
      }
    }
    return null;
  }

  private findNearestShelter(mile: number): string | null {
    let nearest: string | null = null;
    let minDist = Infinity;

    for (const shelter of SHELTERS) {
      const dist = Math.abs(shelter.mile - mile);
      if (dist < minDist && dist < 2) {
        minDist = dist;
        nearest = shelter.name;
      }
    }

    return nearest;
  }

  private npcQuits(npc: BubbleNPC): void {
    npc.state = 'quit';
    npc.quitReason = getQuitReason();

    // Generate yard sale items from their "gear"
    this.generateYardSaleItems(npc);

    console.log(`[BubbleSystem] ${npc.trailName} quit: ${npc.quitReason}`);
  }

  private generateYardSaleItems(npc: BubbleNPC): void {
    // Each quitting NPC adds 2-3 items
    const items: YardSaleItem[] = [
      {
        id: `${npc.id}_tent`,
        name: 'Used Tent',
        originalPrice: 250,
        salePrice: 100 + Math.floor(Math.random() * 50),
        condition: 50 + Math.floor(Math.random() * 30),
        weight: 2.5,
        seller: npc.trailName,
        reason: npc.quitReason || 'Moving on',
      },
      {
        id: `${npc.id}_pack`,
        name: 'Trail-Worn Pack',
        originalPrice: 200,
        salePrice: 60 + Math.floor(Math.random() * 40),
        condition: 40 + Math.floor(Math.random() * 30),
        weight: 3.0,
        seller: npc.trailName,
        reason: npc.quitReason || 'Moving on',
      },
    ];

    // Sometimes add a third item
    if (Math.random() > 0.5) {
      items.push({
        id: `${npc.id}_sleeping`,
        name: 'Sleeping Bag',
        originalPrice: 180,
        salePrice: 50 + Math.floor(Math.random() * 30),
        condition: 60 + Math.floor(Math.random() * 25),
        weight: 2.0,
        seller: npc.trailName,
        reason: npc.quitReason || 'Moving on',
      });
    }

    this.yardSaleItems.push(...items);
  }

  // Get NPCs within a certain radius of a mile marker
  getNPCsNearMile(mile: number, radius: number): BubbleNPC[] {
    const nearby: BubbleNPC[] = [];

    for (const npc of this.npcs.values()) {
      if (npc.state === 'quit') continue;

      const distance = Math.abs(npc.mile - mile);
      if (distance <= radius) {
        nearby.push(npc);
      }
    }

    // Sort by distance
    nearby.sort((a, b) => Math.abs(a.mile - mile) - Math.abs(b.mile - mile));

    return nearby;
  }

  // Get NPCs currently in a specific town
  getNPCsInTown(townName: string): BubbleNPC[] {
    const inTown: BubbleNPC[] = [];

    for (const npc of this.npcs.values()) {
      if (npc.state === 'town' && npc.currentLocation === townName) {
        inTown.push(npc);
      }
    }

    return inTown;
  }

  // Get NPCs at a specific shelter
  getNPCsAtShelter(shelterName: string): BubbleNPC[] {
    const atShelter: BubbleNPC[] = [];

    for (const npc of this.npcs.values()) {
      if (npc.state === 'resting' && npc.currentLocation === shelterName) {
        atShelter.push(npc);
      }
    }

    return atShelter;
  }

  // Record an encounter with the player
  recordEncounter(npcId: string, gameDay: number, event?: string): void {
    const npc = this.npcs.get(npcId);
    if (!npc) return;

    npc.relationship.encounters++;
    npc.relationship.lastSeenDay = gameDay;
    npc.relationship.friendliness = Math.min(100, npc.relationship.friendliness + 2);

    if (event) {
      npc.relationship.memorableEvents.push(event);
    }
  }

  // Get a greeting from an NPC
  getGreeting(npcId: string): string {
    const npc = this.npcs.get(npcId);
    if (!npc) return "Hey there!";

    return getGreeting(
      npc.relationship.encounters,
      npc.energy,
      npc.morale,
      npc.trailName
    );
  }

  // Get random gossip from an NPC
  getGossip(npcId: string): string {
    const npc = this.npcs.get(npcId);
    if (!npc) return "Just hiking along...";
    
    const gossips = [
        `I heard ${this.getRandomNPCName()} hiked 30 miles yesterday!`,
        `Did you see that bear near the last shelter?`,
        `Someone left amazing trail magic at the next gap.`,
        `My feet are killing me today.`,
        `I can't wait for a burger in town.`,
        `The weather is supposed to turn nasty tomorrow.`,
        `I lost my spork... eating with a tent stake now.`,
        `Have you met ${this.getRandomNPCName()}? They're hilarious.`,
        `This climb is brutal, isn't it?`
    ];
    return gossips[Math.floor(Math.random() * gossips.length)];
  }

  private getRandomNPCName(): string {
      const ids = Array.from(this.npcs.keys());
      if (ids.length === 0) return "some hiker";
      const randomId = ids[Math.floor(Math.random() * ids.length)];
      return this.npcs.get(randomId)?.trailName || "some hiker";
  }

  // Hiking Buddy Methods
  inviteCompanion(npcId: string): boolean {
      const npc = this.npcs.get(npcId);
      if (!npc) return false;
      if (this.activeCompanionId) return false; // Already have one
      
      // Check requirements
      if (npc.relationship.encounters < 3 && npc.relationship.friendliness < 60) return false;
      
      this.activeCompanionId = npcId;
      npc.companionStatus = 'active';
      console.log(`[BubbleSystem] Invited ${npc.trailName} as companion`);
      return true;
  }
  
  dismissCompanion(): void {
      if (!this.activeCompanionId) return;
      
      const npc = this.npcs.get(this.activeCompanionId);
      if (npc) {
          npc.companionStatus = 'available';
          // Move them slightly away so they don't instantly re-trigger
          npc.mile += 0.05; 
      }
      this.activeCompanionId = null;
      console.log(`[BubbleSystem] Dismissed companion`);
  }
  
  getActiveCompanion(): BubbleNPC | null {
      if (!this.activeCompanionId) return null;
      return this.npcs.get(this.activeCompanionId) || null;
  }

  // Get a helpful trail tip from an NPC
  getTrailTip(npcId: string): string | null {
    const npc = this.npcs.get(npcId);
    if (!npc || npc.trailTips.length === 0) return null;

    return npc.trailTips[Math.floor(Math.random() * npc.trailTips.length)];
  }

  // Yard sale access
  getYardSaleItems(): YardSaleItem[] {
    return [...this.yardSaleItems];
  }

  hasYardSaleItems(): boolean {
    return this.yardSaleItems.length > 0;
  }

  purchaseYardSaleItem(itemId: string): YardSaleItem | null {
    const index = this.yardSaleItems.findIndex(item => item.id === itemId);
    if (index === -1) return null;

    const [item] = this.yardSaleItems.splice(index, 1);
    return item;
  }

  // Get NPC by ID
  getNPC(id: string): BubbleNPC | undefined {
    return this.npcs.get(id);
  }

  // Get all active NPCs
  getAllNPCs(): BubbleNPC[] {
    return Array.from(this.npcs.values()).filter(npc => npc.state !== 'quit');
  }

  // Serialization for save/load
  serialize(): SerializedBubbleData {
    return {
      npcs: Array.from(this.npcs.values()),
      yardSaleItems: this.yardSaleItems,
      activeCompanionId: this.activeCompanionId
    };
  }

  deserialize(data: SerializedBubbleData): void {
    this.npcs.clear();
    for (const npc of data.npcs) {
      this.npcs.set(npc.id, npc);
    }
    this.yardSaleItems = data.yardSaleItems || [];
    this.activeCompanionId = data.activeCompanionId || null;

    console.log(`[BubbleSystem] Restored ${this.npcs.size} NPCs`);
  }

  // Check if bubble exists
  hasBubble(): boolean {
    return this.npcs.size > 0;
  }
}

// Yard sale item type
export interface YardSaleItem {
  id: string;
  name: string;
  originalPrice: number;
  salePrice: number;
  condition: number;     // 0-100
  weight: number;
  seller: string;        // Trail name
  reason: string;        // Why they quit
}

// Serialization format
export interface SerializedBubbleData {
  npcs: BubbleNPC[];
  yardSaleItems: YardSaleItem[];
  activeCompanionId?: string | null;
}

// Singleton instance
export const bubbleSystem = new BubbleSystem();
