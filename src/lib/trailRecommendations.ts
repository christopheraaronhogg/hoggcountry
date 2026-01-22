/**
 * Trail Recommendations - Contextual alerts and suggestions based on mile position
 *
 * Provides "What Matters Now" data for the dashboard:
 * - State line alerts (celebrations!)
 * - Bear canister required zones
 * - Terrain warnings (Whites, PA rocks, etc.)
 * - Next town/resupply info
 */

// State boundaries (NOBO order) - from trail-facts.yaml
export const stateBoundaries = [
  { mile: 0, state: 'GA', name: 'Georgia', message: 'Starting at Springer Mountain!' },
  { mile: 75.5, state: 'NC', name: 'North Carolina', message: 'Welcome to North Carolina!' },
  { mile: 240.8, state: 'TN', name: 'Tennessee', message: 'Entering Tennessee!' },
  { mile: 392.5, state: 'VA', name: 'Virginia', message: 'The Long Green Tunnel begins!' },
  { mile: 464.4, state: 'VA', name: 'Virginia (cont.)', message: 'Virginia continues...' },
  { mile: 1009.0, state: 'WV', name: 'West Virginia', message: 'Harpers Ferry - The Psychological Halfway!' },
  { mile: 1012.1, state: 'MD', name: 'Maryland', message: 'Maryland - Quick but scenic!' },
  { mile: 1052.4, state: 'PA', name: 'Pennsylvania', message: 'Rocksylvania begins...' },
  { mile: 1282.5, state: 'NJ', name: 'New Jersey', message: 'The Garden State!' },
  { mile: 1355.0, state: 'NY', name: 'New York', message: 'Empire State trail!' },
  { mile: 1443.8, state: 'CT', name: 'Connecticut', message: 'Connecticut nutmeg country!' },
  { mile: 1495.5, state: 'MA', name: 'Massachusetts', message: 'Bay State adventures!' },
  { mile: 1585.9, state: 'VT', name: 'Vermont', message: 'Green Mountain State!' },
  { mile: 1741.8, state: 'NH', name: 'New Hampshire', message: 'The Whites await!' },
  { mile: 1902.4, state: 'ME', name: 'Maine', message: 'The final state! Katahdin calls!' },
];

// Bear canister required zones
export const bearZones = [
  {
    startMile: 166,
    endMile: 266,
    name: 'Great Smoky Mountains',
    requirement: 'Bear cables at shelters, food storage required',
  },
  {
    startMile: 1791,
    endMile: 1902,
    name: 'White Mountains',
    requirement: 'Bear boxes at campsites, proper food storage required',
  },
  {
    startMile: 1902,
    endMile: 2100,
    name: 'Maine (100-Mile Wilderness approach)',
    requirement: 'Bear canister strongly recommended',
  },
];

// Terrain warning zones
export const terrainZones = [
  {
    startMile: 1052,
    endMile: 1282,
    name: 'Rocksylvania',
    icon: '🪨',
    warning: 'Rocky terrain ahead - watch your ankles!',
  },
  {
    startMile: 1741,
    endMile: 1902,
    name: 'White Mountains',
    icon: '⛰️',
    warning: 'Above treeline exposure - check weather!',
  },
  {
    startMile: 2020,
    endMile: 2100,
    name: '100-Mile Wilderness',
    icon: '🌲',
    warning: 'No resupply for 100 miles - plan food carefully!',
  },
  {
    startMile: 2180,
    endMile: 2198,
    name: 'Katahdin',
    icon: '🏔️',
    warning: 'Final climb! Check Baxter State Park conditions.',
  },
];

// Major resupply towns
export const resupplyTowns = [
  { mile: 31, name: 'Neels Gap', services: ['outfitter', 'hostel'], note: 'First resupply!' },
  { mile: 110, name: 'Franklin, NC', services: ['grocery', 'hostel', 'outfitter', 'restaurant'] },
  { mile: 166, name: 'Fontana Dam', services: ['grocery', 'hostel'], note: 'Last stop before Smokies' },
  { mile: 241, name: 'Gatlinburg, TN', services: ['grocery', 'hostel', 'outfitter', 'restaurant'] },
  { mile: 274, name: 'Hot Springs, NC', services: ['grocery', 'hostel', 'restaurant'] },
  { mile: 386, name: 'Damascus, VA', services: ['grocery', 'hostel', 'outfitter', 'restaurant'], note: 'Trail Days!' },
  { mile: 550, name: 'Pearisburg, VA', services: ['grocery', 'hostel', 'restaurant'] },
  { mile: 702, name: 'Waynesboro, VA', services: ['grocery', 'hostel', 'outfitter', 'restaurant'] },
  { mile: 1025, name: 'Harpers Ferry, WV', services: ['grocery', 'hostel', 'restaurant'], note: 'ATC HQ!' },
  { mile: 1290, name: 'Delaware Water Gap', services: ['grocery', 'hostel', 'restaurant'] },
  { mile: 1392, name: 'Greenwood Lake, NY', services: ['grocery', 'restaurant'] },
  { mile: 1585, name: 'Dalton, MA', services: ['grocery', 'hostel'] },
  { mile: 1741, name: 'Gorham, NH', services: ['grocery', 'hostel', 'outfitter', 'restaurant'] },
  { mile: 1912, name: 'Monson, ME', services: ['grocery', 'hostel'], note: 'Last major stop before Katahdin!' },
];

export interface Alert {
  type: 'state-line' | 'bear' | 'terrain' | 'milestone';
  icon: string;
  title: string;
  message: string;
  distance?: number;
  priority: number; // Lower = higher priority
}

export interface TownInfo {
  mile: number;
  name: string;
  distance: number;
  services: string[];
  note?: string;
}

/**
 * Get contextual alerts based on current mile position
 */
export function getAlerts(currentMile: number, lookAheadMiles: number = 20): Alert[] {
  const alerts: Alert[] = [];

  // Check for upcoming state line
  for (const boundary of stateBoundaries) {
    const distance = boundary.mile - currentMile;
    if (distance > 0 && distance <= lookAheadMiles) {
      alerts.push({
        type: 'state-line',
        icon: '🎉',
        title: `Entering ${boundary.name}`,
        message: boundary.message,
        distance: Math.round(distance),
        priority: 1,
      });
      break; // Only show next state line
    }
  }

  // Check if in or approaching bear zone
  for (const zone of bearZones) {
    if (currentMile >= zone.startMile && currentMile <= zone.endMile) {
      alerts.push({
        type: 'bear',
        icon: '🐻',
        title: `${zone.name} Bear Zone`,
        message: zone.requirement,
        priority: 2,
      });
    } else if (zone.startMile - currentMile > 0 && zone.startMile - currentMile <= lookAheadMiles) {
      alerts.push({
        type: 'bear',
        icon: '🐻',
        title: `Bear Country Ahead`,
        message: `${zone.name} in ${Math.round(zone.startMile - currentMile)} miles - ${zone.requirement}`,
        distance: Math.round(zone.startMile - currentMile),
        priority: 3,
      });
    }
  }

  // Check for terrain warnings
  for (const zone of terrainZones) {
    if (currentMile >= zone.startMile && currentMile <= zone.endMile) {
      alerts.push({
        type: 'terrain',
        icon: zone.icon,
        title: zone.name,
        message: zone.warning,
        priority: 4,
      });
    } else if (zone.startMile - currentMile > 0 && zone.startMile - currentMile <= lookAheadMiles) {
      alerts.push({
        type: 'terrain',
        icon: zone.icon,
        title: `${zone.name} Ahead`,
        message: `${zone.warning} (${Math.round(zone.startMile - currentMile)} miles)`,
        distance: Math.round(zone.startMile - currentMile),
        priority: 5,
      });
    }
  }

  // Sort by priority
  return alerts.sort((a, b) => a.priority - b.priority);
}

/**
 * Get next resupply town from current position
 */
export function getNextTown(currentMile: number): TownInfo | null {
  for (const town of resupplyTowns) {
    if (town.mile > currentMile) {
      return {
        ...town,
        distance: Math.round(town.mile - currentMile),
      };
    }
  }
  return null;
}

/**
 * Get current state based on mile
 */
export function getCurrentState(currentMile: number): { state: string; name: string } | null {
  // Find the state we're currently in
  for (let i = stateBoundaries.length - 1; i >= 0; i--) {
    if (currentMile >= stateBoundaries[i].mile) {
      return {
        state: stateBoundaries[i].state,
        name: stateBoundaries[i].name,
      };
    }
  }
  return { state: 'GA', name: 'Georgia' };
}
