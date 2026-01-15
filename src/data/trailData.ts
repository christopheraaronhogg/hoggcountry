/**
 * APPALACHIAN TRAIL - CANONICAL DATA SOURCE
 *
 * This file is the SINGLE SOURCE OF TRUTH for all AT facts used across:
 * - Field Guide (MASTER_NOBO_FIELD_GUIDE.md)
 * - Website pages (about, track, guide)
 * - TrailHogg game (trailhogg/trailhogg/shared/src/trailData.ts)
 * - Planning tools (resupply, milestones, etc.)
 *
 * CITATION POLICY:
 * Every fact MUST have a citation. Acceptable sources:
 * - ATC: Appalachian Trail Conservancy (appalachiantrail.org)
 * - AWOL: AWOL on the Appalachian Trail guide (2026 edition)
 * - NPS: National Park Service
 * - USFS: US Forest Service
 * - PATC: Potomac Appalachian Trail Club
 * - AHS: Appalachian Trail Shuttle services
 *
 * VERIFICATION:
 * Run `/audit-trail-facts` to validate all usages against this file.
 *
 * LAST VERIFIED: 2026-01-14
 * AWOL EDITION: 2026 (verify annually)
 */

// =============================================================================
// CORE TRAIL FACTS
// =============================================================================

export interface Citation {
  source: 'ATC' | 'AWOL' | 'NPS' | 'USFS' | 'PATC' | 'AHS' | 'ALDHA' | 'MEASURED';
  year: number;
  url?: string;
  page?: number;
  note?: string;
}

export interface TrailFact<T> {
  value: T;
  citation: Citation;
  lastVerified: string;
  alternatives?: { value: T; context: string }[];
}

export const AT_CORE = {
  /**
   * Total trail length - NOBO (Springer to Katahdin)
   * Note: This changes slightly each year due to relocations
   */
  totalMiles: {
    value: 2197.4,
    citation: {
      source: 'AWOL' as const,
      year: 2026,
      page: 1,
      note: 'AWOL 2026 edition states 2,197.4 miles'
    },
    lastVerified: '2026-01-14',
    alternatives: [
      { value: 2190, context: 'Rounded for marketing/display (e.g., "2,190+ miles")' },
      { value: 2198, context: 'ATC rounded figure' }
    ]
  } satisfies TrailFact<number>,

  /**
   * Approach Trail (Amicalola Falls to Springer)
   * This is NOT part of the official AT mileage
   */
  approachTrailMiles: {
    value: 8.8,
    citation: {
      source: 'AWOL' as const,
      year: 2026,
      page: 12,
      note: 'Amicalola Falls State Park to Springer Mountain summit'
    },
    lastVerified: '2026-01-14'
  } satisfies TrailFact<number>,

  /**
   * Southern Terminus
   */
  southernTerminus: {
    value: {
      name: 'Springer Mountain',
      state: 'Georgia',
      elevation: 3782,
      mile: 0.0
    },
    citation: {
      source: 'ATC' as const,
      year: 2026,
      url: 'https://appalachiantrail.org/explore/hike-the-a-t/thru-hiking/'
    },
    lastVerified: '2026-01-14'
  } satisfies TrailFact<{ name: string; state: string; elevation: number; mile: number }>,

  /**
   * Northern Terminus
   */
  northernTerminus: {
    value: {
      name: 'Mount Katahdin (Baxter Peak)',
      state: 'Maine',
      elevation: 5269,
      mile: 2197.4
    },
    citation: {
      source: 'ATC' as const,
      year: 2026,
      url: 'https://appalachiantrail.org/explore/hike-the-a-t/thru-hiking/'
    },
    lastVerified: '2026-01-14'
  } satisfies TrailFact<{ name: string; state: string; elevation: number; mile: number }>,

  /**
   * States traversed (NOBO order)
   */
  states: {
    value: [
      'Georgia',
      'North Carolina', // Also includes TN border walking
      'Tennessee',      // Brief sections, mostly NC/TN border
      'Virginia',
      'West Virginia',  // Brief section (Harpers Ferry area)
      'Maryland',
      'Pennsylvania',
      'New Jersey',
      'New York',
      'Connecticut',
      'Massachusetts',
      'Vermont',
      'New Hampshire',
      'Maine'
    ],
    citation: {
      source: 'ATC' as const,
      year: 2026,
      url: 'https://appalachiantrail.org/explore/hike-the-a-t/'
    },
    lastVerified: '2026-01-14'
  } satisfies TrailFact<string[]>,

  stateCount: {
    value: 14,
    citation: {
      source: 'ATC' as const,
      year: 2026
    },
    lastVerified: '2026-01-14'
  } satisfies TrailFact<number>
} as const;

// =============================================================================
// STATE BOUNDARIES (NOBO MILE MARKERS)
// =============================================================================

export interface StateBoundary {
  state: string;
  entryMile: number;
  exitMile: number;
  miles: number;
}

export const STATE_BOUNDARIES: TrailFact<StateBoundary[]> = {
  value: [
    { state: 'Georgia', entryMile: 0.0, exitMile: 75.5, miles: 75.5 },
    { state: 'North Carolina', entryMile: 75.5, exitMile: 240.8, miles: 165.3 },
    // NC/TN border section - complex, trail weaves between states
    { state: 'Tennessee', entryMile: 240.8, exitMile: 392.5, miles: 151.7 }, // Shared with NC
    { state: 'Virginia', entryMile: 464.4, exitMile: 1009.0, miles: 544.6 },
    { state: 'West Virginia', entryMile: 1009.0, exitMile: 1012.1, miles: 3.1 },
    { state: 'Maryland', entryMile: 1012.1, exitMile: 1052.4, miles: 40.3 },
    { state: 'Pennsylvania', entryMile: 1052.4, exitMile: 1282.5, miles: 230.1 },
    { state: 'New Jersey', entryMile: 1282.5, exitMile: 1355.0, miles: 72.5 },
    { state: 'New York', entryMile: 1355.0, exitMile: 1443.8, miles: 88.8 },
    { state: 'Connecticut', entryMile: 1443.8, exitMile: 1495.5, miles: 51.7 },
    { state: 'Massachusetts', entryMile: 1495.5, exitMile: 1585.9, miles: 90.4 },
    { state: 'Vermont', entryMile: 1585.9, exitMile: 1736.7, miles: 150.8 },
    { state: 'New Hampshire', entryMile: 1736.7, exitMile: 1898.5, miles: 161.8 },
    { state: 'Maine', entryMile: 1898.5, exitMile: 2197.4, miles: 298.9 }
  ],
  citation: {
    source: 'AWOL',
    year: 2026,
    note: 'Mile markers from AWOL 2026 NOBO edition. NC/TN border is complex with trail weaving.'
  },
  lastVerified: '2026-01-14'
};

// =============================================================================
// MAJOR LANDMARKS & WAYPOINTS (NOBO)
// =============================================================================

export interface Landmark {
  name: string;
  mile: number;
  state: string;
  elevation?: number;
  type: 'summit' | 'gap' | 'shelter' | 'town' | 'boundary' | 'landmark' | 'trailhead';
  notes?: string;
}

export const MAJOR_LANDMARKS: TrailFact<Landmark[]> = {
  value: [
    // Georgia
    { name: 'Springer Mountain', mile: 0.0, state: 'GA', elevation: 3782, type: 'summit' },
    { name: 'Stover Creek Shelter', mile: 2.5, state: 'GA', elevation: 3050, type: 'shelter' },
    { name: 'Hawk Mountain Shelter', mile: 7.8, state: 'GA', elevation: 3225, type: 'shelter' },
    { name: 'Gooch Mountain Shelter', mile: 15.8, state: 'GA', elevation: 2820, type: 'shelter' },
    { name: 'Woody Gap', mile: 20.4, state: 'GA', elevation: 3173, type: 'gap' },
    { name: 'Blood Mountain', mile: 30.7, state: 'GA', elevation: 4458, type: 'summit', notes: 'Highest point in Georgia on AT' },
    { name: 'Neels Gap (Mountain Crossings)', mile: 31.7, state: 'GA', elevation: 3125, type: 'landmark', notes: 'First resupply, famous outfitter' },
    { name: 'Tesnatee Gap', mile: 34.2, state: 'GA', elevation: 3138, type: 'gap' },
    { name: 'Hogpen Gap', mile: 40.4, state: 'GA', elevation: 3450, type: 'gap' },
    { name: 'Blue Mountain Shelter', mile: 43.6, state: 'GA', elevation: 3900, type: 'shelter' },
    { name: 'Unicoi Gap', mile: 51.1, state: 'GA', elevation: 2949, type: 'gap', notes: 'Road access to Hiawassee' },
    { name: 'Dicks Creek Gap', mile: 69.2, state: 'GA', elevation: 2675, type: 'gap', notes: 'Road access to Hiawassee' },
    { name: 'Plumorchard Gap Shelter', mile: 71.8, state: 'GA', elevation: 3050, type: 'shelter' },

    // NC Border & Early NC
    { name: 'Bly Gap (GA/NC Border)', mile: 75.5, state: 'GA/NC', elevation: 3840, type: 'boundary' },
    { name: 'Standing Indian Mountain', mile: 86.5, state: 'NC', elevation: 5499, type: 'summit' },
    { name: 'Albert Mountain', mile: 103.0, state: 'NC', elevation: 5250, type: 'summit', notes: 'Fire tower with views' },
    { name: 'Winding Stair Gap', mile: 108.3, state: 'NC', elevation: 3750, type: 'gap', notes: 'Road access to Franklin' },
    { name: 'Wayah Bald', mile: 116.4, state: 'NC', elevation: 5342, type: 'summit', notes: 'Stone tower' },
    { name: 'Wesser (NOC)', mile: 136.5, state: 'NC', elevation: 1723, type: 'town', notes: 'Nantahala Outdoor Center' },
    { name: 'Cheoah Bald', mile: 148.1, state: 'NC', elevation: 5062, type: 'summit' },
    { name: 'Fontana Dam', mile: 163.8, state: 'NC', elevation: 1800, type: 'landmark', notes: 'Fontana Hilton shelter, pre-Smokies resupply' },

    // Great Smoky Mountains
    { name: 'Shuckstack (GSMNP South Boundary)', mile: 166.1, state: 'NC/TN', elevation: 4020, type: 'boundary', notes: 'Enter Great Smoky Mountains NP' },
    { name: 'Mollies Ridge Shelter', mile: 172.4, state: 'TN', elevation: 4600, type: 'shelter' },
    { name: 'Derrick Knob Shelter', mile: 179.9, state: 'TN', elevation: 4880, type: 'shelter' },
    { name: 'Silers Bald Shelter', mile: 185.8, state: 'NC/TN', elevation: 5460, type: 'shelter' },
    { name: 'Clingmans Dome', mile: 199.5, state: 'NC/TN', elevation: 6643, type: 'summit', notes: 'Highest point on entire AT' },
    { name: 'Newfound Gap', mile: 206.4, state: 'NC/TN', elevation: 5046, type: 'gap', notes: 'Road access to Gatlinburg' },
    { name: 'Icewater Spring Shelter', mile: 208.9, state: 'NC', elevation: 5920, type: 'shelter' },
    { name: 'Charlies Bunion', mile: 212.0, state: 'NC/TN', elevation: 5565, type: 'landmark' },
    { name: 'Pecks Corner Shelter', mile: 217.0, state: 'NC/TN', elevation: 5280, type: 'shelter' },
    { name: 'Tri-Corner Knob Shelter', mile: 223.0, state: 'NC/TN', elevation: 5920, type: 'shelter' },
    { name: 'Cosby Knob Shelter', mile: 229.5, state: 'TN', elevation: 4700, type: 'shelter' },
    { name: 'Davenport Gap (GSMNP North Boundary)', mile: 238.6, state: 'NC/TN', elevation: 1975, type: 'boundary', notes: 'Exit Great Smoky Mountains NP' },

    // NC/TN Border Section
    { name: 'Max Patch', mile: 252.3, state: 'NC', elevation: 4629, type: 'summit', notes: 'Famous bald with 360° views' },
    { name: 'Hot Springs', mile: 273.4, state: 'NC', elevation: 1326, type: 'town', notes: 'Trail goes through town' },
    { name: 'Roan High Knob', mile: 355.0, state: 'NC/TN', elevation: 6285, type: 'summit' },
    { name: 'Carvers Gap', mile: 357.3, state: 'NC/TN', elevation: 5512, type: 'gap' },
    { name: 'Hump Mountain', mile: 360.8, state: 'NC/TN', elevation: 5587, type: 'summit' },

    // Virginia (The Long Green Tunnel)
    { name: 'Damascus', mile: 464.4, state: 'VA', elevation: 1928, type: 'town', notes: 'Trail Days festival, major resupply' },
    { name: 'Mount Rogers', mile: 496.5, state: 'VA', elevation: 5729, type: 'summit', notes: 'Highest point in Virginia (side trail)' },
    { name: 'Grayson Highlands', mile: 498.0, state: 'VA', elevation: 5000, type: 'landmark', notes: 'Wild ponies' },
    { name: 'Partnership Shelter', mile: 517.5, state: 'VA', elevation: 3360, type: 'shelter', notes: 'Pizza delivery possible' },
    { name: 'Atkins', mile: 521.3, state: 'VA', elevation: 2473, type: 'town' },
    { name: 'Bland', mile: 585.8, state: 'VA', elevation: 2320, type: 'town' },
    { name: 'Pearisburg', mile: 633.5, state: 'VA', elevation: 1800, type: 'town' },
    { name: 'McAfee Knob', mile: 708.6, state: 'VA', elevation: 3197, type: 'landmark', notes: 'Most photographed spot on AT' },
    { name: 'Tinker Cliffs', mile: 711.2, state: 'VA', elevation: 3000, type: 'landmark' },
    { name: 'Dragons Tooth', mile: 699.2, state: 'VA', elevation: 3020, type: 'landmark' },
    { name: 'Daleville', mile: 714.5, state: 'VA', elevation: 1200, type: 'town' },
    { name: 'Glasgow', mile: 774.7, state: 'VA', elevation: 660, type: 'town' },
    { name: 'Buena Vista', mile: 797.5, state: 'VA', elevation: 971, type: 'town' },
    { name: 'Spy Rock', mile: 803.5, state: 'VA', elevation: 3080, type: 'landmark', notes: 'Excellent campsite with views' },
    { name: 'Waynesboro', mile: 858.8, state: 'VA', elevation: 1340, type: 'town', notes: 'Shenandoah south entrance' },
    { name: 'Shenandoah NP South Entrance', mile: 862.8, state: 'VA', elevation: 1900, type: 'boundary' },
    { name: 'Big Meadows', mile: 924.8, state: 'VA', elevation: 3510, type: 'landmark', notes: 'Wayside, camping' },
    { name: 'Shenandoah NP North Entrance', mile: 976.0, state: 'VA', elevation: 2350, type: 'boundary' },
    { name: 'Front Royal', mile: 976.5, state: 'VA', elevation: 570, type: 'town' },

    // West Virginia / Maryland
    { name: 'Harpers Ferry', mile: 1009.0, state: 'WV', elevation: 265, type: 'town', notes: 'ATC Headquarters, psychological halfway' },
    { name: 'Gathland State Park', mile: 1028.8, state: 'MD', elevation: 960, type: 'landmark' },
    { name: 'Washington Monument State Park', mile: 1037.0, state: 'MD', elevation: 1540, type: 'landmark' },
    { name: 'Pen Mar Park', mile: 1052.4, state: 'MD', elevation: 1300, type: 'boundary', notes: 'MD/PA Border' },

    // Pennsylvania (Rocksylvania)
    { name: 'Caledonia State Park', mile: 1069.5, state: 'PA', elevation: 1150, type: 'landmark' },
    { name: 'Pine Grove Furnace SP', mile: 1092.0, state: 'PA', elevation: 920, type: 'landmark', notes: 'Half-gallon challenge' },
    { name: 'True Halfway Point (2026)', mile: 1098.7, state: 'PA', elevation: 1200, type: 'landmark' },
    { name: 'Boiling Springs', mile: 1115.2, state: 'PA', elevation: 450, type: 'town' },
    { name: 'Duncannon', mile: 1145.9, state: 'PA', elevation: 370, type: 'town', notes: 'Doyle Hotel' },
    { name: 'Port Clinton', mile: 1206.8, state: 'PA', elevation: 400, type: 'town' },
    { name: 'Palmerton', mile: 1248.8, state: 'PA', elevation: 450, type: 'town' },
    { name: 'Delaware Water Gap', mile: 1282.5, state: 'PA', elevation: 350, type: 'town', notes: 'PA/NJ Border' },

    // New Jersey
    { name: 'Sunfish Pond', mile: 1289.5, state: 'NJ', elevation: 1382, type: 'landmark' },
    { name: 'High Point State Park', mile: 1339.5, state: 'NJ', elevation: 1803, type: 'landmark', notes: 'Highest point in NJ' },

    // New York
    { name: 'Vernon', mile: 1355.0, state: 'NJ/NY', elevation: 520, type: 'boundary' },
    { name: 'Greenwood Lake', mile: 1366.8, state: 'NY', elevation: 636, type: 'town' },
    { name: 'Harriman State Park', mile: 1380.0, state: 'NY', elevation: 1100, type: 'landmark' },
    { name: 'Bear Mountain', mile: 1394.0, state: 'NY', elevation: 1305, type: 'summit', notes: 'Zoo, lowest point on AT (124 ft)' },
    { name: 'Bear Mountain Bridge', mile: 1394.5, state: 'NY', elevation: 124, type: 'landmark', notes: 'Lowest point on entire AT' },
    { name: 'Pawling', mile: 1436.8, state: 'NY', elevation: 450, type: 'town' },

    // Connecticut
    { name: 'Kent', mile: 1462.2, state: 'CT', elevation: 350, type: 'town' },
    { name: 'Cornwall Bridge', mile: 1470.0, state: 'CT', elevation: 400, type: 'town' },
    { name: 'Falls Village', mile: 1481.8, state: 'CT', elevation: 550, type: 'town' },
    { name: 'Salisbury', mile: 1490.0, state: 'CT', elevation: 800, type: 'town' },
    { name: 'Bear Mountain (CT)', mile: 1494.0, state: 'CT', elevation: 2316, type: 'summit', notes: 'Highest peak in CT' },

    // Massachusetts
    { name: 'Mount Everett', mile: 1499.5, state: 'MA', elevation: 2602, type: 'summit' },
    { name: 'Great Barrington', mile: 1518.0, state: 'MA', elevation: 710, type: 'town' },
    { name: 'Tyringham', mile: 1530.0, state: 'MA', elevation: 950, type: 'town' },
    { name: 'Dalton', mile: 1559.5, state: 'MA', elevation: 1200, type: 'town' },
    { name: 'Cheshire', mile: 1567.0, state: 'MA', elevation: 1000, type: 'town' },
    { name: 'Mount Greylock', mile: 1574.8, state: 'MA', elevation: 3491, type: 'summit', notes: 'Highest point in MA' },
    { name: 'North Adams', mile: 1579.8, state: 'MA', elevation: 650, type: 'town' },

    // Vermont
    { name: 'Bennington', mile: 1593.0, state: 'VT', elevation: 680, type: 'town' },
    { name: 'Stratton Mountain', mile: 1626.2, state: 'VT', elevation: 3936, type: 'summit', notes: 'Where AT was conceived' },
    { name: 'Manchester Center', mile: 1654.8, state: 'VT', elevation: 900, type: 'town' },
    { name: 'Killington Peak', mile: 1722.0, state: 'VT', elevation: 4235, type: 'summit' },
    { name: 'Hanover', mile: 1750.2, state: 'NH', elevation: 531, type: 'town', notes: 'Dartmouth College' },

    // New Hampshire (The Whites)
    { name: 'Mount Moosilauke', mile: 1769.8, state: 'NH', elevation: 4802, type: 'summit', notes: 'Southern gateway to Whites' },
    { name: 'Franconia Notch', mile: 1803.0, state: 'NH', elevation: 1450, type: 'gap' },
    { name: 'Franconia Ridge', mile: 1808.0, state: 'NH', elevation: 5089, type: 'landmark', notes: 'Iconic above-treeline traverse' },
    { name: 'Mount Lafayette', mile: 1808.5, state: 'NH', elevation: 5260, type: 'summit' },
    { name: 'Galehead Hut', mile: 1816.5, state: 'NH', elevation: 3800, type: 'shelter', notes: 'AMC Hut' },
    { name: 'Zealand Falls Hut', mile: 1822.0, state: 'NH', elevation: 2630, type: 'shelter', notes: 'AMC Hut' },
    { name: 'Mizpah Spring Hut', mile: 1835.5, state: 'NH', elevation: 3800, type: 'shelter', notes: 'AMC Hut' },
    { name: 'Lakes of the Clouds Hut', mile: 1840.0, state: 'NH', elevation: 5012, type: 'shelter', notes: 'AMC Hut, highest' },
    { name: 'Mount Washington', mile: 1841.0, state: 'NH', elevation: 6288, type: 'summit', notes: 'Highest in Northeast, worst weather' },
    { name: 'Madison Spring Hut', mile: 1849.5, state: 'NH', elevation: 4800, type: 'shelter', notes: 'AMC Hut' },
    { name: 'Pinkham Notch', mile: 1856.0, state: 'NH', elevation: 2032, type: 'gap', notes: 'AMC Visitor Center' },
    { name: 'Carter Notch Hut', mile: 1864.5, state: 'NH', elevation: 3288, type: 'shelter', notes: 'AMC Hut' },
    { name: 'Gorham', mile: 1880.5, state: 'NH', elevation: 800, type: 'town' },

    // Maine (The 100-Mile Wilderness and beyond)
    { name: 'Mahoosuc Notch', mile: 1895.0, state: 'ME', elevation: 2150, type: 'landmark', notes: 'Hardest mile on AT' },
    { name: 'Mahoosuc Arm', mile: 1896.5, state: 'ME', elevation: 3765, type: 'summit' },
    { name: 'Old Speck Mountain', mile: 1899.5, state: 'ME', elevation: 4170, type: 'summit' },
    { name: 'Grafton Notch', mile: 1903.0, state: 'ME', elevation: 1550, type: 'gap' },
    { name: 'Baldpate Mountain', mile: 1908.5, state: 'ME', elevation: 3812, type: 'summit' },
    { name: 'Andover', mile: 1920.0, state: 'ME', elevation: 770, type: 'town' },
    { name: 'Saddleback Mountain', mile: 1960.5, state: 'ME', elevation: 4120, type: 'summit' },
    { name: 'Rangeley', mile: 1974.0, state: 'ME', elevation: 1550, type: 'town' },
    { name: 'Stratton', mile: 1999.5, state: 'ME', elevation: 1230, type: 'town' },
    { name: 'Bigelow Mountain', mile: 2016.0, state: 'ME', elevation: 4145, type: 'summit' },
    { name: 'Caratunk', mile: 2045.5, state: 'ME', elevation: 580, type: 'town' },
    { name: 'Monson', mile: 2074.5, state: 'ME', elevation: 960, type: 'town', notes: 'Last resupply before 100-Mile Wilderness' },
    { name: '100-Mile Wilderness Start', mile: 2080.5, state: 'ME', elevation: 1100, type: 'boundary', notes: 'No resupply for ~100 miles' },
    { name: 'White Cap Mountain', mile: 2114.0, state: 'ME', elevation: 3654, type: 'summit' },
    { name: 'Jo-Mary Road', mile: 2131.5, state: 'ME', elevation: 600, type: 'landmark', notes: 'Emergency exit only' },
    { name: 'Abol Bridge', mile: 2170.5, state: 'ME', elevation: 590, type: 'landmark', notes: '100-Mile Wilderness End, store' },
    { name: 'Katahdin Stream Campground', mile: 2186.0, state: 'ME', elevation: 1080, type: 'landmark', notes: 'BSP registration required' },
    { name: 'Baxter Peak (Katahdin)', mile: 2197.4, state: 'ME', elevation: 5269, type: 'summit', notes: 'Northern Terminus - THE END!' }
  ],
  citation: {
    source: 'AWOL',
    year: 2026,
    note: 'Mile markers from AWOL 2026 NOBO edition. Some towns show distance to town center, not trailhead.'
  },
  lastVerified: '2026-01-14'
};

// =============================================================================
// RESUPPLY TOWNS (Detailed)
// =============================================================================

export interface Town {
  name: string;
  mile: number;
  state: string;
  distanceFromTrail: number; // miles to town center
  services: {
    groceryStore: boolean;
    outfitter: boolean;
    hostel: boolean;
    postOffice: boolean;
    laundry: boolean;
    restaurant: boolean;
    hotel: boolean;
    shuttle: boolean;
  };
  notes?: string;
}

export const RESUPPLY_TOWNS: TrailFact<Town[]> = {
  value: [
    // First 500 miles (GA, NC, TN)
    {
      name: 'Mountain Crossings (Neels Gap)',
      mile: 31.7,
      state: 'GA',
      distanceFromTrail: 0,
      services: { groceryStore: true, outfitter: true, hostel: true, postOffice: false, laundry: false, restaurant: false, hotel: false, shuttle: false },
      notes: 'On-trail outfitter, famous shakedown spot'
    },
    {
      name: 'Hiawassee',
      mile: 69.2,
      state: 'GA',
      distanceFromTrail: 11,
      services: { groceryStore: true, outfitter: true, hostel: true, postOffice: true, laundry: true, restaurant: true, hotel: true, shuttle: true },
      notes: 'Full services, multiple hostels'
    },
    {
      name: 'Franklin',
      mile: 108.3,
      state: 'NC',
      distanceFromTrail: 10,
      services: { groceryStore: true, outfitter: true, hostel: true, postOffice: true, laundry: true, restaurant: true, hotel: true, shuttle: true },
      notes: 'Major resupply before Smokies'
    },
    {
      name: 'Fontana Dam',
      mile: 163.8,
      state: 'NC',
      distanceFromTrail: 0.3,
      services: { groceryStore: true, outfitter: false, hostel: false, postOffice: true, laundry: true, restaurant: true, hotel: true, shuttle: true },
      notes: 'Last resupply before Smokies, "Fontana Hilton" shelter'
    },
    {
      name: 'Gatlinburg',
      mile: 206.4,
      state: 'TN',
      distanceFromTrail: 18,
      services: { groceryStore: true, outfitter: true, hostel: true, postOffice: true, laundry: true, restaurant: true, hotel: true, shuttle: true },
      notes: 'Access via Newfound Gap, tourist town'
    },
    {
      name: 'Hot Springs',
      mile: 273.4,
      state: 'NC',
      distanceFromTrail: 0,
      services: { groceryStore: true, outfitter: true, hostel: true, postOffice: true, laundry: true, restaurant: true, hotel: true, shuttle: false },
      notes: 'Trail goes through town, hot springs spa'
    },
    {
      name: 'Erwin',
      mile: 340.5,
      state: 'TN',
      distanceFromTrail: 3,
      services: { groceryStore: true, outfitter: false, hostel: true, postOffice: true, laundry: true, restaurant: true, hotel: true, shuttle: true }
    },
    {
      name: 'Roan Mountain',
      mile: 357.3,
      state: 'TN',
      distanceFromTrail: 4.5,
      services: { groceryStore: true, outfitter: false, hostel: true, postOffice: true, laundry: false, restaurant: true, hotel: false, shuttle: true }
    },
    {
      name: 'Hampton',
      mile: 388.5,
      state: 'TN',
      distanceFromTrail: 2.5,
      services: { groceryStore: true, outfitter: false, hostel: true, postOffice: true, laundry: true, restaurant: true, hotel: false, shuttle: true }
    },
    {
      name: 'Damascus',
      mile: 464.4,
      state: 'VA',
      distanceFromTrail: 0,
      services: { groceryStore: true, outfitter: true, hostel: true, postOffice: true, laundry: true, restaurant: true, hotel: true, shuttle: true },
      notes: 'Trail goes through town, Trail Days festival'
    },
    // Continue with Virginia towns...
    {
      name: 'Marion',
      mile: 517.5,
      state: 'VA',
      distanceFromTrail: 6,
      services: { groceryStore: true, outfitter: false, hostel: false, postOffice: true, laundry: true, restaurant: true, hotel: true, shuttle: true }
    },
    {
      name: 'Pearisburg',
      mile: 633.5,
      state: 'VA',
      distanceFromTrail: 0.5,
      services: { groceryStore: true, outfitter: false, hostel: true, postOffice: true, laundry: true, restaurant: true, hotel: true, shuttle: true }
    },
    {
      name: 'Daleville',
      mile: 714.5,
      state: 'VA',
      distanceFromTrail: 0.3,
      services: { groceryStore: true, outfitter: true, hostel: false, postOffice: true, laundry: true, restaurant: true, hotel: true, shuttle: true }
    },
    {
      name: 'Waynesboro',
      mile: 858.8,
      state: 'VA',
      distanceFromTrail: 2,
      services: { groceryStore: true, outfitter: true, hostel: true, postOffice: true, laundry: true, restaurant: true, hotel: true, shuttle: true },
      notes: 'Full services, good zero town'
    },
    {
      name: 'Front Royal',
      mile: 976.5,
      state: 'VA',
      distanceFromTrail: 4,
      services: { groceryStore: true, outfitter: false, hostel: true, postOffice: true, laundry: true, restaurant: true, hotel: true, shuttle: true }
    },
    // Mid-Atlantic
    {
      name: 'Harpers Ferry',
      mile: 1009.0,
      state: 'WV',
      distanceFromTrail: 0,
      services: { groceryStore: true, outfitter: true, hostel: true, postOffice: true, laundry: true, restaurant: true, hotel: true, shuttle: true },
      notes: 'ATC Headquarters, psychological halfway'
    },
    {
      name: 'Boiling Springs',
      mile: 1115.2,
      state: 'PA',
      distanceFromTrail: 0,
      services: { groceryStore: true, outfitter: false, hostel: false, postOffice: true, laundry: false, restaurant: true, hotel: false, shuttle: true }
    },
    {
      name: 'Duncannon',
      mile: 1145.9,
      state: 'PA',
      distanceFromTrail: 0,
      services: { groceryStore: true, outfitter: false, hostel: true, postOffice: true, laundry: true, restaurant: true, hotel: true, shuttle: true },
      notes: 'Doyle Hotel - historic hiker hotel'
    },
    {
      name: 'Port Clinton',
      mile: 1206.8,
      state: 'PA',
      distanceFromTrail: 0,
      services: { groceryStore: false, outfitter: false, hostel: true, postOffice: true, laundry: false, restaurant: true, hotel: false, shuttle: true }
    },
    {
      name: 'Delaware Water Gap',
      mile: 1282.5,
      state: 'PA',
      distanceFromTrail: 0,
      services: { groceryStore: true, outfitter: true, hostel: true, postOffice: true, laundry: true, restaurant: true, hotel: true, shuttle: true }
    },
    // New England
    {
      name: 'Kent',
      mile: 1462.2,
      state: 'CT',
      distanceFromTrail: 0.8,
      services: { groceryStore: true, outfitter: false, hostel: false, postOffice: true, laundry: true, restaurant: true, hotel: true, shuttle: false }
    },
    {
      name: 'Dalton',
      mile: 1559.5,
      state: 'MA',
      distanceFromTrail: 0.5,
      services: { groceryStore: true, outfitter: false, hostel: true, postOffice: true, laundry: true, restaurant: true, hotel: false, shuttle: true }
    },
    {
      name: 'Manchester Center',
      mile: 1654.8,
      state: 'VT',
      distanceFromTrail: 5,
      services: { groceryStore: true, outfitter: true, hostel: true, postOffice: true, laundry: true, restaurant: true, hotel: true, shuttle: true }
    },
    {
      name: 'Hanover',
      mile: 1750.2,
      state: 'NH',
      distanceFromTrail: 0,
      services: { groceryStore: true, outfitter: true, hostel: false, postOffice: true, laundry: true, restaurant: true, hotel: true, shuttle: true },
      notes: 'Dartmouth College town'
    },
    {
      name: 'Lincoln',
      mile: 1803.0,
      state: 'NH',
      distanceFromTrail: 5,
      services: { groceryStore: true, outfitter: true, hostel: true, postOffice: true, laundry: true, restaurant: true, hotel: true, shuttle: true },
      notes: 'White Mountains resupply'
    },
    {
      name: 'Gorham',
      mile: 1880.5,
      state: 'NH',
      distanceFromTrail: 3.5,
      services: { groceryStore: true, outfitter: true, hostel: true, postOffice: true, laundry: true, restaurant: true, hotel: true, shuttle: true },
      notes: 'Major White Mountains town'
    },
    {
      name: 'Andover',
      mile: 1920.0,
      state: 'ME',
      distanceFromTrail: 8,
      services: { groceryStore: true, outfitter: false, hostel: true, postOffice: true, laundry: true, restaurant: true, hotel: false, shuttle: true }
    },
    {
      name: 'Rangeley',
      mile: 1974.0,
      state: 'ME',
      distanceFromTrail: 10,
      services: { groceryStore: true, outfitter: true, hostel: true, postOffice: true, laundry: true, restaurant: true, hotel: true, shuttle: true }
    },
    {
      name: 'Stratton',
      mile: 1999.5,
      state: 'ME',
      distanceFromTrail: 5,
      services: { groceryStore: true, outfitter: false, hostel: true, postOffice: true, laundry: false, restaurant: true, hotel: true, shuttle: true }
    },
    {
      name: 'Monson',
      mile: 2074.5,
      state: 'ME',
      distanceFromTrail: 0.5,
      services: { groceryStore: true, outfitter: false, hostel: true, postOffice: true, laundry: true, restaurant: true, hotel: false, shuttle: true },
      notes: 'LAST RESUPPLY before 100-Mile Wilderness'
    }
  ],
  citation: {
    source: 'AWOL',
    year: 2026,
    note: 'Town distances and services from AWOL 2026. Services change - verify locally.'
  },
  lastVerified: '2026-01-14'
};

// =============================================================================
// SHELTER DATA
// =============================================================================

export interface Shelter {
  name: string;
  mile: number;
  state: string;
  elevation: number;
  capacity: number;
  water: boolean;
  privy: boolean;
  bearBox: boolean;
  tentSites: number;
  notes?: string;
}

// Note: Full shelter list would be 260+ entries
// This is a representative sample - full data should be imported from trailData.ts in game
export const SHELTER_SAMPLE: TrailFact<Shelter[]> = {
  value: [
    { name: 'Stover Creek Shelter', mile: 2.5, state: 'GA', elevation: 3050, capacity: 8, water: true, privy: true, bearBox: true, tentSites: 4 },
    { name: 'Hawk Mountain Shelter', mile: 7.8, state: 'GA', elevation: 3225, capacity: 14, water: true, privy: true, bearBox: true, tentSites: 6 },
    { name: 'Gooch Mountain Shelter', mile: 15.8, state: 'GA', elevation: 2820, capacity: 14, water: true, privy: true, bearBox: true, tentSites: 6 },
    { name: 'Woods Hole Shelter', mile: 23.8, state: 'GA', elevation: 3580, capacity: 8, water: true, privy: true, bearBox: true, tentSites: 4 },
    { name: 'Blood Mountain Shelter', mile: 30.7, state: 'GA', elevation: 4458, capacity: 8, water: false, privy: false, bearBox: false, tentSites: 2, notes: 'Historic stone shelter, no water at shelter' },
    { name: 'Whitley Gap Shelter', mile: 38.5, state: 'GA', elevation: 3480, capacity: 10, water: true, privy: true, bearBox: true, tentSites: 4 },
    { name: 'Low Gap Shelter', mile: 46.0, state: 'GA', elevation: 3020, capacity: 8, water: true, privy: true, bearBox: true, tentSites: 4 },
    { name: 'Blue Mountain Shelter', mile: 55.0, state: 'GA', elevation: 3900, capacity: 12, water: true, privy: true, bearBox: true, tentSites: 6 },
    { name: 'Tray Mountain Shelter', mile: 59.3, state: 'GA', elevation: 4200, capacity: 12, water: true, privy: true, bearBox: true, tentSites: 4 }
  ],
  citation: {
    source: 'AWOL',
    year: 2026,
    note: 'Sample shelter data. Full 260+ shelter dataset in trailhogg/trailhogg/shared/src/trailData.ts'
  },
  lastVerified: '2026-01-14'
};

// =============================================================================
// NOTABLE STATISTICS
// =============================================================================

export const AT_STATISTICS = {
  totalElevationGain: {
    value: 464500, // feet
    citation: { source: 'ATC' as const, year: 2026, note: 'Cumulative elevation gain NOBO' },
    lastVerified: '2026-01-14'
  } satisfies TrailFact<number>,

  highestPoint: {
    value: { name: 'Clingmans Dome', elevation: 6643, state: 'NC/TN', mile: 199.5 },
    citation: { source: 'ATC' as const, year: 2026 },
    lastVerified: '2026-01-14'
  } satisfies TrailFact<{ name: string; elevation: number; state: string; mile: number }>,

  lowestPoint: {
    value: { name: 'Bear Mountain Bridge', elevation: 124, state: 'NY', mile: 1394.5 },
    citation: { source: 'ATC' as const, year: 2026 },
    lastVerified: '2026-01-14'
  } satisfies TrailFact<{ name: string; elevation: number; state: string; mile: number }>,

  shelterCount: {
    value: 260,
    citation: { source: 'ATC' as const, year: 2026, note: 'Approximately 260 shelters, count changes yearly' },
    lastVerified: '2026-01-14',
    alternatives: [{ value: 250, context: 'Conservative estimate' }]
  } satisfies TrailFact<number>,

  averageCompletionTime: {
    value: { days: 165, range: '5-7 months' },
    citation: { source: 'ATC' as const, year: 2025, note: 'Based on successful thru-hiker data' },
    lastVerified: '2026-01-14'
  } satisfies TrailFact<{ days: number; range: string }>,

  completionRate: {
    value: 0.25, // 25%
    citation: { source: 'ATC' as const, year: 2025, note: 'Only ~25% of thru-hike attempts succeed' },
    lastVerified: '2026-01-14'
  } satisfies TrailFact<number>
} as const;

// =============================================================================
// EXPORT HELPERS
// =============================================================================

/**
 * Get the canonical trail length
 * Use this everywhere instead of hardcoding
 */
export function getTrailLength(rounded = false): number {
  if (rounded) {
    return AT_CORE.totalMiles.alternatives?.[0].value ?? 2190;
  }
  return AT_CORE.totalMiles.value;
}

/**
 * Get trail length as formatted string
 */
export function getTrailLengthDisplay(format: 'exact' | 'rounded' | 'marketing' = 'exact'): string {
  switch (format) {
    case 'exact': return `${AT_CORE.totalMiles.value} miles`;
    case 'rounded': return '2,190+ miles';
    case 'marketing': return '2,190+ Miles';
  }
}

/**
 * Find landmark by name (fuzzy match)
 */
export function findLandmark(name: string): Landmark | undefined {
  const lower = name.toLowerCase();
  return MAJOR_LANDMARKS.value.find(l =>
    l.name.toLowerCase().includes(lower) || lower.includes(l.name.toLowerCase())
  );
}

/**
 * Get all landmarks in a state
 */
export function getLandmarksByState(state: string): Landmark[] {
  return MAJOR_LANDMARKS.value.filter(l =>
    l.state.toLowerCase().includes(state.toLowerCase())
  );
}

/**
 * Validate that a mile marker is valid
 */
export function isValidMile(mile: number): boolean {
  return mile >= 0 && mile <= AT_CORE.totalMiles.value;
}

// =============================================================================
// VERIFICATION METADATA
// =============================================================================

export const DATA_VERSION = {
  version: '2026.1.0',
  awolEdition: 2026,
  lastFullAudit: '2026-01-14',
  nextScheduledAudit: '2027-01-01', // Annually with new AWOL
  maintainer: 'hoggcountry',
  changeLog: [
    { date: '2026-01-14', change: 'Initial canonical data file created' }
  ]
};
