// ============================================
// TRAIL LEGS - Hot Springs, NC Town Layout
// ============================================
// Real trail town layout with authentic building positions
// The AT runs right down Bridge Street through town

import { HOT_SPRINGS_BUILDING_SPRITES } from './hot-springs-buildings';

// ============================================
// TYPES
// ============================================

export type BuildingServiceType =
  | 'gear'        // Hiking gear, equipment
  | 'food'        // Restaurant, diner
  | 'lodging'     // Hostel, motel, hotel
  | 'resupply'    // Grocery, mail drops
  | 'outfitter'   // Full outfitter (gear + fuel + maps)
  | 'info'        // Welcome center, tourist info
  | 'medical'     // Clinic, pharmacy
  | 'laundry'     // Laundromat
  | 'shower'      // Showers available
  | 'wifi'        // Internet access
  | 'charging'    // Phone/device charging
  | 'mail'        // Mail services, packages
  | 'shuttle'     // Shuttle services
  | 'hot_springs' // Natural hot springs
  | 'bar'         // Bar, tavern
  | 'coffee';     // Coffee shop

export interface BuildingInteractionPoint {
  type: 'door' | 'window' | 'sign';
  x: number;  // Relative to building position
  y: number;
  label: string;
  action?: string; // What happens when you interact
}

export interface TownBuilding {
  id: string;
  name: string;
  address: string;
  description: string;

  // Position on map (pixels)
  x: number;
  y: number;

  // Sprite references
  sprites: {
    base: string;
    wallSouth: string;
    wallNorth?: string;
    wallEast?: string;
    wallWest?: string;
    interior: string;
    roof: string;
  };

  // Dimensions
  width: number;
  height: number;

  // Services
  services: BuildingServiceType[];

  // Interaction points
  interactions: BuildingInteractionPoint[];

  // Business info
  hours?: string;
  priceLevel?: 1 | 2 | 3 | 4; // $ to $$$$

  // Status
  status: 'built' | 'placeholder'; // Whether sprite exists
}

export interface TrailPath {
  name: string;
  points: { x: number; y: number }[];
  width: number;
  markers?: { x: number; y: number; type: string }[];
}

export interface TownLayout {
  name: string;
  state: string;
  description: string;
  population: number;
  elevation: number; // feet

  // Map bounds
  bounds: {
    width: number;
    height: number;
  };

  // Trail path
  trail: TrailPath;

  // Main street
  mainStreet: {
    name: string;
    buildings: TownBuilding[];
  };

  // Other streets
  sideStreets?: {
    name: string;
    buildings: TownBuilding[];
  }[];

  // Landmarks
  landmarks: {
    name: string;
    x: number;
    y: number;
    type: string;
  }[];

  // Town stats (for gameplay)
  stats: {
    hikerTrafficPerYear: number;
    peakSeason: string;
    averageStayDays: number;
  };
}

// ============================================
// HOT SPRINGS TOWN LAYOUT
// ============================================

export const HOT_SPRINGS_LAYOUT: TownLayout = {
  name: 'Hot Springs',
  state: 'North Carolina',
  description: 'The only town in NC where the Appalachian Trail runs right down the main street. A classic trail town with natural hot springs, nestled along the French Broad River.',
  population: 520,
  elevation: 1326, // feet

  bounds: {
    width: 2000,  // pixels (will adjust based on testing)
    height: 800,
  },

  // AT path through town
  trail: {
    name: 'Appalachian Trail',
    points: [
      // Trail enters from south (Deer Park Mountain)
      { x: 50, y: 700 },
      { x: 100, y: 650 },

      // Turns onto Bridge Street
      { x: 150, y: 600 },
      { x: 200, y: 550 },

      // Runs down Bridge Street (main section)
      { x: 250, y: 500 },
      { x: 300, y: 450 },
      { x: 400, y: 400 },
      { x: 500, y: 400 },
      { x: 600, y: 400 },
      { x: 700, y: 400 },
      { x: 800, y: 400 },
      { x: 900, y: 400 },
      { x: 1000, y: 400 },
      { x: 1100, y: 400 },
      { x: 1200, y: 400 },
      { x: 1300, y: 400 },
      { x: 1400, y: 400 },
      { x: 1500, y: 400 },

      // Turns to climb Lover's Leap Mountain
      { x: 1600, y: 350 },
      { x: 1700, y: 300 },
      { x: 1800, y: 250 },
      { x: 1900, y: 200 },
      { x: 1950, y: 150 },
    ],
    width: 4, // pixels wide
    markers: [
      // White blazes embedded in sidewalk
      { x: 400, y: 400, type: 'blaze_white' },
      { x: 800, y: 400, type: 'blaze_white' },
      { x: 1200, y: 400, type: 'blaze_white' },
    ],
  },

  // Bridge Street (main drag)
  mainStreet: {
    name: 'Bridge Street',
    buildings: [

      // ============================================
      // TOBACCO ROAD BURLEY & BREW (20 Bridge St)
      // ============================================
      {
        id: 'tobacco_road',
        name: 'Tobacco Road Burley & Brew',
        address: '20 Bridge Street',
        description: 'Coffee shop and tobacco store',
        x: 300,
        y: 350,
        sprites: {
          base: 'tobaccoRoadBase', // TODO: Build sprite
          wallSouth: 'tobaccoRoadWallSouth',
          interior: 'tobaccoRoadInterior',
          roof: 'tobaccoRoadRoof',
        },
        width: 48,
        height: 48,
        services: ['coffee', 'wifi'],
        interactions: [
          { type: 'door', x: 24, y: 40, label: 'Enter Coffee Shop' },
        ],
        hours: '7am - 7pm',
        priceLevel: 2,
        status: 'placeholder',
      },

      // ============================================
      // ALPINE COURT MOTEL (50 Bridge St) - BUILT
      // ============================================
      {
        id: 'alpine_court',
        name: 'Alpine Court Motel',
        address: '50 Bridge Street',
        description: 'Budget motel popular with hikers. Simple, clean rooms at affordable prices. Check-in at office.',
        x: 500,
        y: 350,
        sprites: {
          base: 'alpineCourtBase',
          wallSouth: 'alpineCourtWallSouth',
          interior: 'alpineCourtInterior',
          roof: 'alpineCourtRoof',
        },
        width: 48,
        height: 48,
        services: ['lodging', 'shower', 'wifi'],
        interactions: [
          { type: 'door', x: 6, y: 40, label: 'Room 1', action: 'rest' },
          { type: 'door', x: 14, y: 40, label: 'Room 2', action: 'rest' },
          { type: 'door', x: 23, y: 40, label: 'Room 3', action: 'rest' },
          { type: 'door', x: 31, y: 40, label: 'Room 4', action: 'rest' },
          { type: 'sign', x: 24, y: 10, label: 'ALPINE COURT' },
        ],
        hours: '24/7 (Office: 8am - 10pm)',
        priceLevel: 1,
        status: 'built',
      },

      // ============================================
      // BLUFF MOUNTAIN OUTFITTERS (88 Bridge St) - BUILT
      // ============================================
      {
        id: 'bluff_mountain',
        name: 'Bluff Mountain Outfitters',
        address: '88 Bridge Street',
        description: 'THE hiker hub since 1997. Full outfitter with gear, fuel, maps, and resupply items. Founded by Daniel Gallagher and Wayne Crosby. Sees ~12 thru-hikers daily in spring.',
        x: 700,
        y: 350,
        sprites: {
          base: 'bluffMountainBase',
          wallSouth: 'bluffMountainWallSouth',
          interior: 'bluffMountainInterior',
          roof: 'bluffMountainRoof',
        },
        width: 48,
        height: 48,
        services: ['outfitter', 'gear', 'resupply', 'mail', 'wifi', 'info'],
        interactions: [
          { type: 'door', x: 24, y: 40, label: 'Enter Outfitters', action: 'shop_gear' },
          { type: 'window', x: 8, y: 20, label: 'View Gear Display' },
          { type: 'window', x: 35, y: 20, label: 'View Gear Display' },
          { type: 'sign', x: 24, y: 10, label: 'OUTFITTER' },
        ],
        hours: '9am - 6pm (extended hours in season)',
        priceLevel: 2,
        status: 'built',
      },

      // ============================================
      // HOT SPRINGS WELCOME CENTER (106 Bridge St)
      // ============================================
      {
        id: 'welcome_center',
        name: 'Hot Springs Welcome Center',
        address: '106 Bridge Street',
        description: 'Official visitor information center. Maps, trail updates, local info, and friendly advice.',
        x: 900,
        y: 350,
        sprites: {
          base: 'welcomeCenterBase', // TODO: Build sprite
          wallSouth: 'welcomeCenterWallSouth',
          interior: 'welcomeCenterInterior',
          roof: 'welcomeCenterRoof',
        },
        width: 48,
        height: 48,
        services: ['info', 'wifi', 'mail'],
        interactions: [
          { type: 'door', x: 24, y: 40, label: 'Enter Welcome Center', action: 'get_info' },
        ],
        hours: '9am - 5pm',
        priceLevel: 1,
        status: 'placeholder',
      },

      // ============================================
      // VASTE RIVIERE PROVISIONS (158 Bridge St)
      // ============================================
      {
        id: 'vaste_riviere',
        name: 'Vaste Riviere Provisions',
        address: '158 Bridge Street',
        description: 'Provisions and supplies for hikers',
        x: 1000,
        y: 350,
        sprites: {
          base: 'vasteRiviereBase', // TODO: Build sprite
          wallSouth: 'vasteRiviereWallSouth',
          interior: 'vasteRiviereInterior',
          roof: 'vasteRiviereRoof',
        },
        width: 48,
        height: 48,
        services: ['resupply', 'food'],
        interactions: [
          { type: 'door', x: 24, y: 40, label: 'Enter Store' },
        ],
        hours: '10am - 6pm',
        priceLevel: 2,
        status: 'placeholder',
      },

      // ============================================
      // SMOKY MOUNTAIN DINER - BUILT
      // ============================================
      {
        id: 'smoky_diner',
        name: 'Smoky Mountain Diner',
        address: 'Bridge Street', // Exact address not specified in research
        description: 'Hiker favorite for big breakfasts and hot meals. Classic trail town diner with generous portions and friendly service.',
        x: 1100,
        y: 350,
        sprites: {
          base: 'smokyMountainDinerBase',
          wallSouth: 'smokyMountainDinerWallSouth',
          interior: 'smokyMountainDinerInterior',
          roof: 'smokyMountainDinerRoof',
        },
        width: 48,
        height: 48,
        services: ['food', 'wifi'],
        interactions: [
          { type: 'door', x: 24, y: 40, label: 'Enter Diner', action: 'eat' },
          { type: 'window', x: 8, y: 20, label: 'See Menu' },
          { type: 'window', x: 35, y: 20, label: 'See Menu' },
          { type: 'sign', x: 24, y: 10, label: 'DINER' },
        ],
        hours: '6am - 8pm (6 days/week)',
        priceLevel: 2,
        status: 'built',
      },

      // ============================================
      // HOT SPRINGS RESORT & SPA (315 Bridge St)
      // ============================================
      {
        id: 'hot_springs_resort',
        name: 'Hot Springs Resort & Spa',
        address: '315 Bridge Street',
        description: 'Famous natural hot mineral springs! Riverside camping, RV sites, lodging, and of course - the hot springs themselves. A hiker favorite for relaxing tired muscles.',
        x: 1400,
        y: 350,
        sprites: {
          base: 'hotSpringsResortBase', // TODO: Build sprite
          wallSouth: 'hotSpringsResortWallSouth',
          interior: 'hotSpringsResortInterior',
          roof: 'hotSpringsResortRoof',
        },
        width: 64, // Larger building
        height: 64,
        services: ['hot_springs', 'lodging', 'shower', 'laundry'],
        interactions: [
          { type: 'door', x: 32, y: 55, label: 'Enter Resort', action: 'soak' },
          { type: 'sign', x: 32, y: 10, label: 'HOT SPRINGS' },
        ],
        hours: 'Daily (hours vary by season)',
        priceLevel: 2,
        status: 'placeholder',
      },

      // ============================================
      // DOLLAR GENERAL
      // ============================================
      {
        id: 'dollar_general',
        name: 'Dollar General',
        address: 'Bridge Street',
        description: 'Grocery store with food, first aid, and household items. Key resupply point for hikers.',
        x: 1200,
        y: 350,
        sprites: {
          base: 'dollarGeneralBase', // TODO: Build sprite
          wallSouth: 'dollarGeneralWallSouth',
          interior: 'dollarGeneralInterior',
          roof: 'dollarGeneralRoof',
        },
        width: 48,
        height: 48,
        services: ['resupply', 'food', 'medical'],
        interactions: [
          { type: 'door', x: 24, y: 40, label: 'Enter Store', action: 'shop_resupply' },
        ],
        hours: '8am - 9pm',
        priceLevel: 1,
        status: 'placeholder',
      },

      // ============================================
      // SPRING CREEK TAVERN & INN
      // ============================================
      {
        id: 'spring_creek_tavern',
        name: 'Spring Creek Tavern & Inn',
        address: 'Bridge Street',
        description: 'Bar and restaurant in the middle of town. Creekside deck seating. Central meeting place for hikers.',
        x: 1300,
        y: 350,
        sprites: {
          base: 'springCreekBase', // TODO: Build sprite
          wallSouth: 'springCreekWallSouth',
          interior: 'springCreekInterior',
          roof: 'springCreekRoof',
        },
        width: 48,
        height: 48,
        services: ['food', 'bar', 'lodging', 'wifi'],
        interactions: [
          { type: 'door', x: 24, y: 40, label: 'Enter Tavern', action: 'drink' },
        ],
        hours: '11am - 11pm',
        priceLevel: 2,
        status: 'placeholder',
      },
    ],
  },

  // Side streets
  sideStreets: [
    {
      name: 'Walnut Street',
      buildings: [
        // ============================================
        // ELMER'S SUNNYBANK INN (26 Walnut St)
        // ============================================
        {
          id: 'sunnybank_inn',
          name: "Elmer's Sunnybank Inn",
          address: '26 Walnut Street',
          description: 'Famous hiker hostel run by Elmer. Bunk beds, shower, laundry, and legendary hiker hospitality. A trail institution.',
          x: 800,
          y: 200, // North of Bridge Street
          sprites: {
            base: 'sunnybankBase', // TODO: Build sprite
            wallSouth: 'sunnybankWallSouth',
            interior: 'sunnybankInterior',
            roof: 'sunnybankRoof',
          },
          width: 48,
          height: 48,
          services: ['lodging', 'shower', 'laundry', 'wifi'],
          interactions: [
            { type: 'door', x: 24, y: 40, label: 'Enter Hostel', action: 'rest' },
          ],
          hours: '24/7 (Check-in after 3pm)',
          priceLevel: 1,
          status: 'placeholder',
        },
      ],
    },
  ],

  // Landmarks
  landmarks: [
    {
      name: 'French Broad River',
      x: 1000,
      y: 600,
      type: 'river',
    },
    {
      name: 'Spring Creek',
      x: 1300,
      y: 500,
      type: 'creek',
    },
    {
      name: 'Deer Park Mountain',
      x: 50,
      y: 750,
      type: 'mountain',
    },
    {
      name: "Lover's Leap Mountain",
      x: 1950,
      y: 100,
      type: 'mountain',
    },
    {
      name: 'AT Blaze (embedded in sidewalk)',
      x: 400,
      y: 400,
      type: 'trail_marker',
    },
    {
      name: 'AT Blaze (embedded in sidewalk)',
      x: 800,
      y: 400,
      type: 'trail_marker',
    },
    {
      name: 'AT Blaze (embedded in sidewalk)',
      x: 1200,
      y: 400,
      type: 'trail_marker',
    },
  ],

  // Town stats for gameplay
  stats: {
    hikerTrafficPerYear: 2000,
    peakSeason: 'March - May',
    averageStayDays: 2, // Most hikers stay 2 days (zero day + resupply)
  },
};

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Get all buildings in town (main street + side streets)
 */
export function getAllBuildings(): TownBuilding[] {
  const buildings = [...HOT_SPRINGS_LAYOUT.mainStreet.buildings];

  if (HOT_SPRINGS_LAYOUT.sideStreets) {
    HOT_SPRINGS_LAYOUT.sideStreets.forEach(street => {
      buildings.push(...street.buildings);
    });
  }

  return buildings;
}

/**
 * Get only built buildings (sprites exist)
 */
export function getBuiltBuildings(): TownBuilding[] {
  return getAllBuildings().filter(b => b.status === 'built');
}

/**
 * Get placeholder buildings (need sprites)
 */
export function getPlaceholderBuildings(): TownBuilding[] {
  return getAllBuildings().filter(b => b.status === 'placeholder');
}

/**
 * Find building by ID
 */
export function getBuildingById(id: string): TownBuilding | undefined {
  return getAllBuildings().find(b => b.id === id);
}

/**
 * Get buildings offering a specific service
 */
export function getBuildingsByService(service: BuildingServiceType): TownBuilding[] {
  return getAllBuildings().filter(b => b.services.includes(service));
}

/**
 * Get building stats
 */
export function getTownStats() {
  const all = getAllBuildings();
  const built = getBuiltBuildings();
  const placeholder = getPlaceholderBuildings();

  return {
    total: all.length,
    built: built.length,
    placeholder: placeholder.length,
    percentComplete: Math.round((built.length / all.length) * 100),
    services: {
      lodging: getBuildingsByService('lodging').length,
      food: getBuildingsByService('food').length,
      resupply: getBuildingsByService('resupply').length,
      outfitter: getBuildingsByService('outfitter').length,
    },
  };
}
