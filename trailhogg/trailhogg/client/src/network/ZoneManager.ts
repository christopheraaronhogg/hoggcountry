/**
 * ZoneManager - Handles zone-based P2P clustering for TrailHogg MMO
 *
 * The 2,197.9-mile AT is split into 28 zones (based on terrain zones).
 * Each zone operates as a semi-independent P2P cluster with a leader.
 * Players only sync with others in their zone + adjacent zones.
 */

import { getTerrainZone, getZoneById, getAdjacentZones, type TerrainZone } from '../data/TrailData';
import { networkManager, type PlayerState } from './NetworkManager';

export interface ZoneState {
  zoneId: string;
  leaderId: string | null;        // PeerJS ID of zone leader
  players: Map<string, PlayerState>;
  lastUpdate: number;
}

export interface ZonePlayer extends PlayerState {
  zoneId: string;
  isZoneLeader: boolean;
  joinedAt: number;
}

type ZoneEventType = 'zone-change' | 'leader-change' | 'player-join' | 'player-leave';
type ZoneEventCallback = (data: any) => void;

export class ZoneManager {
  private currentZoneId: string | null = null;
  private zones: Map<string, ZoneState> = new Map();
  private eventListeners: Map<ZoneEventType, Set<ZoneEventCallback>> = new Map();
  private leaderCheckInterval: number | null = null;

  // Time (ms) before assuming leader is dead if no heartbeat
  private readonly LEADER_TIMEOUT = 10000;
  // How often to check for leader health
  private readonly LEADER_CHECK_INTERVAL = 3000;

  constructor() {
    // Initialize event listener maps
    const events: ZoneEventType[] = ['zone-change', 'leader-change', 'player-join', 'player-leave'];
    events.forEach(event => this.eventListeners.set(event, new Set()));
  }

  /**
   * Initialize zone for a player based on their mile position
   */
  initializeZone(mile: number, playerId: string): string | null {
    const zone = getTerrainZone(mile);
    if (!zone) {
      console.warn('[ZoneManager] No zone found for mile:', mile);
      return null;
    }

    this.currentZoneId = zone.zoneId;

    // Create zone state if it doesn't exist
    if (!this.zones.has(zone.zoneId)) {
      this.zones.set(zone.zoneId, {
        zoneId: zone.zoneId,
        leaderId: null,
        players: new Map(),
        lastUpdate: Date.now()
      });
    }

    // Start leader health check
    this.startLeaderCheck();

    console.log(`[ZoneManager] Initialized in zone: ${zone.zoneId} (${zone.name})`);
    return zone.zoneId;
  }

  /**
   * Update player position and handle zone transitions
   */
  updatePlayerPosition(mile: number, playerId: string): boolean {
    const newZone = getTerrainZone(mile);
    if (!newZone) return false;

    if (newZone.zoneId !== this.currentZoneId) {
      const oldZoneId = this.currentZoneId;
      this.handleZoneTransition(oldZoneId, newZone.zoneId, playerId);
      return true; // Zone changed
    }

    return false; // Same zone
  }

  /**
   * Handle transition between zones
   */
  private handleZoneTransition(oldZoneId: string | null, newZoneId: string, playerId: string) {
    console.log(`[ZoneManager] Zone transition: ${oldZoneId} -> ${newZoneId}`);

    // Remove from old zone
    if (oldZoneId) {
      const oldZone = this.zones.get(oldZoneId);
      if (oldZone) {
        oldZone.players.delete(playerId);

        // If we were leader, need to trigger re-election
        if (oldZone.leaderId === playerId) {
          this.electNewLeader(oldZoneId);
        }
      }
    }

    // Add to new zone
    this.currentZoneId = newZoneId;
    if (!this.zones.has(newZoneId)) {
      this.zones.set(newZoneId, {
        zoneId: newZoneId,
        leaderId: null,
        players: new Map(),
        lastUpdate: Date.now()
      });
    }

    const newZone = this.zones.get(newZoneId)!;
    const zone = getZoneById(newZoneId);

    // Emit zone change event
    this.emit('zone-change', {
      oldZoneId,
      newZoneId,
      zoneName: zone?.name || newZoneId
    });

    // Check if we should become leader
    this.maybeBecomLeader(newZoneId, playerId);
  }

  /**
   * Try to become zone leader (first player in zone wins)
   */
  private maybeBecomLeader(zoneId: string, playerId: string) {
    const zone = this.zones.get(zoneId);
    if (!zone) return;

    // If no leader, claim leadership
    if (!zone.leaderId) {
      zone.leaderId = playerId;
      console.log(`[ZoneManager] Became leader of zone: ${zoneId}`);
      this.emit('leader-change', { zoneId, leaderId: playerId, isLocal: true });
    }
  }

  /**
   * Elect new leader for a zone (oldest player by joinedAt)
   */
  private electNewLeader(zoneId: string) {
    const zone = this.zones.get(zoneId);
    if (!zone || zone.players.size === 0) {
      if (zone) zone.leaderId = null;
      return;
    }

    // Simple election: first player in the map becomes leader
    // In a real implementation, would use consensus or oldest player
    const [firstPlayerId] = zone.players.keys();
    zone.leaderId = firstPlayerId;

    console.log(`[ZoneManager] New leader elected for ${zoneId}: ${firstPlayerId}`);
    this.emit('leader-change', {
      zoneId,
      leaderId: firstPlayerId,
      isLocal: firstPlayerId === networkManager.localPlayerId
    });
  }

  /**
   * Add a player to a zone
   */
  addPlayerToZone(player: PlayerState, zoneId: string) {
    let zone = this.zones.get(zoneId);
    if (!zone) {
      zone = {
        zoneId,
        leaderId: null,
        players: new Map(),
        lastUpdate: Date.now()
      };
      this.zones.set(zoneId, zone);
    }

    zone.players.set(player.peerId, player);
    zone.lastUpdate = Date.now();

    // If no leader, this player becomes leader
    if (!zone.leaderId) {
      zone.leaderId = player.peerId;
      this.emit('leader-change', {
        zoneId,
        leaderId: player.peerId,
        isLocal: player.peerId === networkManager.localPlayerId
      });
    }

    this.emit('player-join', { player, zoneId });
  }

  /**
   * Remove a player from their zone
   */
  removePlayerFromZone(playerId: string, zoneId: string) {
    const zone = this.zones.get(zoneId);
    if (!zone) return;

    const player = zone.players.get(playerId);
    zone.players.delete(playerId);

    // Elect new leader if needed
    if (zone.leaderId === playerId) {
      this.electNewLeader(zoneId);
    }

    this.emit('player-leave', { playerId, zoneId, player });
  }

  /**
   * Get all players in current zone + adjacent zones
   */
  getNearbyPlayers(): PlayerState[] {
    if (!this.currentZoneId) return [];

    const players: PlayerState[] = [];
    const currentZone = this.zones.get(this.currentZoneId);

    // Add players from current zone
    if (currentZone) {
      players.push(...currentZone.players.values());
    }

    // Add players from adjacent zones
    const adjacentZones = getAdjacentZones(this.currentZoneId);
    for (const adjZone of adjacentZones) {
      const zone = this.zones.get(adjZone.zoneId);
      if (zone) {
        players.push(...zone.players.values());
      }
    }

    return players;
  }

  /**
   * Check if local player is zone leader
   */
  isZoneLeader(): boolean {
    if (!this.currentZoneId) return false;
    const zone = this.zones.get(this.currentZoneId);
    return zone?.leaderId === networkManager.localPlayerId;
  }

  /**
   * Get current zone info
   */
  getCurrentZone(): TerrainZone | null {
    if (!this.currentZoneId) return null;
    return getZoneById(this.currentZoneId) || null;
  }

  /**
   * Get zone state
   */
  getZoneState(zoneId: string): ZoneState | undefined {
    return this.zones.get(zoneId);
  }

  /**
   * Get player count in a zone
   */
  getZonePlayerCount(zoneId: string): number {
    const zone = this.zones.get(zoneId);
    return zone?.players.size || 0;
  }

  /**
   * Start periodic leader health check
   */
  private startLeaderCheck() {
    if (this.leaderCheckInterval) return;

    this.leaderCheckInterval = window.setInterval(() => {
      if (!this.currentZoneId) return;

      const zone = this.zones.get(this.currentZoneId);
      if (!zone || !zone.leaderId) return;

      // If leader hasn't updated in timeout period, elect new one
      const timeSinceUpdate = Date.now() - zone.lastUpdate;
      if (timeSinceUpdate > this.LEADER_TIMEOUT) {
        console.log(`[ZoneManager] Leader timeout in zone ${this.currentZoneId}`);
        this.electNewLeader(this.currentZoneId);
      }
    }, this.LEADER_CHECK_INTERVAL);
  }

  /**
   * Stop leader check interval
   */
  private stopLeaderCheck() {
    if (this.leaderCheckInterval) {
      clearInterval(this.leaderCheckInterval);
      this.leaderCheckInterval = null;
    }
  }

  /**
   * Event subscription
   */
  on(event: ZoneEventType, callback: ZoneEventCallback) {
    this.eventListeners.get(event)?.add(callback);
  }

  off(event: ZoneEventType, callback: ZoneEventCallback) {
    this.eventListeners.get(event)?.delete(callback);
  }

  private emit(event: ZoneEventType, data: any) {
    this.eventListeners.get(event)?.forEach(cb => cb(data));
  }

  /**
   * Clean up
   */
  destroy() {
    this.stopLeaderCheck();
    this.zones.clear();
    this.currentZoneId = null;
    this.eventListeners.forEach(set => set.clear());
  }

  /**
   * Get zone summary for UI
   */
  getZoneSummary(): { zoneId: string; name: string; playerCount: number; isLeader: boolean }[] {
    const summary: { zoneId: string; name: string; playerCount: number; isLeader: boolean }[] = [];

    this.zones.forEach((state, zoneId) => {
      const zone = getZoneById(zoneId);
      summary.push({
        zoneId,
        name: zone?.name || zoneId,
        playerCount: state.players.size,
        isLeader: state.leaderId === networkManager.localPlayerId
      });
    });

    return summary.sort((a, b) => a.zoneId.localeCompare(b.zoneId));
  }
}

// Singleton export
export const zoneManager = new ZoneManager();
