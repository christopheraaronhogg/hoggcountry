/**
 * GPSService - Fetches and manages real thru-hiker GPS data
 *
 * Real hikers appear as green "ghosts" on the trail.
 * Privacy-first: opt-in only, mile snapping, no exact coordinates.
 *
 * Data sources (in priority order):
 * 1. TrailHogg API (future - our own opt-in mobile app)
 * 2. Public Garmin InReach feeds
 * 3. Public SPOT tracker pages
 * 4. Mock data for development
 */

import { getTerrainZone, getZoneIdForMile } from '../data/TrailData';

export type HikerDirection = 'NOBO' | 'SOBO' | 'flip-flop' | 'section';

export interface RealHikerGhost {
  id: string;                     // Anonymous unique ID
  trailName?: string;             // "Trekker" (opt-in, can be anonymous)
  direction: HikerDirection;
  mile: number;                   // Snapped to nearest 0.1 mile
  zoneId: string;                 // For filtering by zone
  lastUpdate: Date;               // When GPS pinged
  daysOnTrail: number;
  totalMilesHiked: number;
  startDate: Date;
  isVerified: boolean;            // Did they register officially with ATC?
  dataSource: 'trailhogg' | 'garmin' | 'spot' | 'mock';
}

type GPSEventType = 'hikers-updated' | 'error';
type GPSEventCallback = (data: any) => void;

// Snap miles to 0.1 increments for privacy
function snapMile(mile: number): number {
  return Math.round(mile * 10) / 10;
}

export class GPSService {
  private hikers: Map<string, RealHikerGhost> = new Map();
  private eventListeners: Map<GPSEventType, Set<GPSEventCallback>> = new Map();
  private pollInterval: number | null = null;
  private isPolling: boolean = false;

  // How often to fetch GPS data (5 minutes)
  private readonly POLL_INTERVAL = 5 * 60 * 1000;

  constructor() {
    this.eventListeners.set('hikers-updated', new Set());
    this.eventListeners.set('error', new Set());
  }

  /**
   * Start polling for GPS data
   */
  startPolling() {
    if (this.isPolling) return;
    this.isPolling = true;

    // Initial fetch
    this.fetchHikers();

    // Poll every 5 minutes
    this.pollInterval = window.setInterval(() => {
      this.fetchHikers();
    }, this.POLL_INTERVAL);

    console.log('[GPSService] Started polling for real hiker data');
  }

  /**
   * Stop polling
   */
  stopPolling() {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }
    this.isPolling = false;
    console.log('[GPSService] Stopped polling');
  }

  /**
   * Fetch hikers from all data sources
   */
  private async fetchHikers() {
    try {
      // For now, use mock data
      // TODO: Add real GPS feed integration
      const mockHikers = this.generateMockHikers();

      // Clear old data and add new
      this.hikers.clear();
      mockHikers.forEach(hiker => {
        this.hikers.set(hiker.id, hiker);
      });

      this.emit('hikers-updated', { count: this.hikers.size });
      console.log(`[GPSService] Updated ${this.hikers.size} real hikers`);

    } catch (error) {
      console.error('[GPSService] Error fetching hikers:', error);
      this.emit('error', { error });
    }
  }

  /**
   * Generate mock hiker data for development
   * Simulates ~50 hikers spread across the trail
   */
  private generateMockHikers(): RealHikerGhost[] {
    const hikers: RealHikerGhost[] = [];
    const now = new Date();

    // Trail names from real AT culture
    const trailNames = [
      'Sunshine', 'Whistle', 'Shortcut', 'Giggles', 'Patches',
      'Biscuit', 'Gandalf', 'Tortoise', 'Lightning', 'Cheese',
      'Pickles', 'Rainmaker', 'Compass', 'Maverick', 'Firefly',
      'Huckleberry', 'Sprocket', 'Vapor', 'Drifter', 'Honeybee',
      'Yeti', 'Bandit', 'Moose', 'Wildflower', 'Blister',
      'Songbird', 'Nomad', 'Rambler', 'Blaze', 'Summit'
    ];

    // Simulate hikers at various points
    // More concentrated in popular sections (GA start, VA, Whites)
    const hikerMiles = [
      // Georgia bubble (NOBO start)
      5.2, 12.8, 18.3, 25.1, 34.7, 42.3, 55.6, 68.9,
      // NC/TN
      89.4, 125.3, 178.5, 215.2, 267.8, 312.4, 358.9,
      // Virginia (longest section)
      485.2, 523.7, 589.1, 634.8, 712.3, 789.5, 856.2, 923.4, 987.6,
      // Mid-Atlantic
      1045.3, 1123.8, 1198.4, 1267.9, 1345.2,
      // NY/NJ/CT/MA
      1389.7, 1435.2, 1498.6, 1567.3, 1623.8,
      // Vermont
      1678.4, 1723.9,
      // White Mountains (congested)
      1812.5, 1845.3, 1867.8, 1889.2,
      // Maine
      1934.6, 1989.3, 2045.7, 2098.2, 2145.8,
      // 100-Mile Wilderness
      2167.4, 2189.5
    ];

    hikerMiles.forEach((mile, index) => {
      const snappedMile = snapMile(mile);
      const zoneId = getZoneIdForMile(snappedMile);

      if (!zoneId) return;

      // Calculate days on trail (assuming ~15 miles/day average)
      const daysOnTrail = Math.floor(snappedMile / 15) + Math.floor(Math.random() * 10);

      // Start date based on days
      const startDate = new Date(now);
      startDate.setDate(startDate.getDate() - daysOnTrail);

      // Randomize direction (90% NOBO, 8% SOBO, 2% flip-flop)
      const dirRand = Math.random();
      const direction: HikerDirection = dirRand < 0.90 ? 'NOBO' :
        dirRand < 0.98 ? 'SOBO' : 'flip-flop';

      // Some hikers anonymous (30%)
      const isAnonymous = Math.random() < 0.3;

      hikers.push({
        id: `mock_hiker_${index}`,
        trailName: isAnonymous ? undefined : trailNames[index % trailNames.length],
        direction,
        mile: snappedMile,
        zoneId,
        lastUpdate: new Date(now.getTime() - Math.random() * 60 * 60 * 1000), // Last hour
        daysOnTrail,
        totalMilesHiked: snappedMile,
        startDate,
        isVerified: Math.random() > 0.5,
        dataSource: 'mock'
      });
    });

    return hikers;
  }

  /**
   * Get all hikers in a specific zone + adjacent zones
   */
  getHikersInZone(zoneId: string, includeAdjacent: boolean = true): RealHikerGhost[] {
    const zone = getTerrainZone(0); // Get zone helper
    const targetZoneIds = new Set([zoneId]);

    if (includeAdjacent) {
      // Add adjacent zone IDs
      const zoneData = Array.from(this.hikers.values())
        .filter(h => h.zoneId === zoneId)[0];
      // Would need to import getAdjacentZones - simplified for now
    }

    return Array.from(this.hikers.values())
      .filter(h => targetZoneIds.has(h.zoneId));
  }

  /**
   * Get hikers within a mile range
   */
  getHikersInRange(centerMile: number, rangeMiles: number = 5): RealHikerGhost[] {
    return Array.from(this.hikers.values())
      .filter(h => Math.abs(h.mile - centerMile) <= rangeMiles);
  }

  /**
   * Get all hikers
   */
  getAllHikers(): RealHikerGhost[] {
    return Array.from(this.hikers.values());
  }

  /**
   * Get hiker count per zone (for UI)
   */
  getHikerCountByZone(): Map<string, number> {
    const counts = new Map<string, number>();

    this.hikers.forEach(hiker => {
      const current = counts.get(hiker.zoneId) || 0;
      counts.set(hiker.zoneId, current + 1);
    });

    return counts;
  }

  /**
   * Event subscription
   */
  on(event: GPSEventType, callback: GPSEventCallback) {
    this.eventListeners.get(event)?.add(callback);
  }

  off(event: GPSEventType, callback: GPSEventCallback) {
    this.eventListeners.get(event)?.delete(callback);
  }

  private emit(event: GPSEventType, data: any) {
    this.eventListeners.get(event)?.forEach(cb => cb(data));
  }

  /**
   * Clean up
   */
  destroy() {
    this.stopPolling();
    this.hikers.clear();
    this.eventListeners.forEach(set => set.clear());
  }

  // ============================================
  // Future: Real GPS Feed Integration
  // ============================================

  /**
   * Fetch from Garmin InReach public feeds
   * TODO: Implement when we have user-submitted feed URLs
   */
  private async fetchGarminFeeds(): Promise<RealHikerGhost[]> {
    // Garmin MapShare feeds are KML format
    // URL format: https://share.garmin.com/feed/share/[USERNAME]
    // Would need CORS proxy or server-side fetch
    return [];
  }

  /**
   * Fetch from SPOT tracker public pages
   * TODO: Implement when we have user-submitted feed URLs
   */
  private async fetchSpotFeeds(): Promise<RealHikerGhost[]> {
    // SPOT feeds require API key and account info
    // Would need server-side integration
    return [];
  }

  /**
   * Fetch from TrailHogg API (future mobile app)
   * TODO: Implement when mobile app exists
   */
  private async fetchTrailHoggAPI(): Promise<RealHikerGhost[]> {
    // Our own API for opt-in GPS sharing
    // Would be the primary source once available
    return [];
  }
}

// Singleton export
export const gpsService = new GPSService();
