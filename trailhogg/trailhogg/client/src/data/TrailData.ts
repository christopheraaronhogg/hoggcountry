/**
 * Complete Appalachian Trail Data
 * From Springer Mountain, GA to Mt. Katahdin, ME
 *
 * Data sources:
 * - WhiteBlaze AT Shelter Database
 * - MASTER_NOBO_FIELD_GUIDE.md
 * - TNlandforms.us AT data
 * - AWOL's AT Guide (2025)
 */

import { TRAIL_TOTAL_MILES, TRAIL_TOTAL_STATES, KATAHDIN, KUWOHI, BEAR_MOUNTAIN_BRIDGE } from '@trailhogg/shared';

// Re-export trail constants for easy imports
export { TRAIL_TOTAL_MILES, TRAIL_TOTAL_STATES, KATAHDIN };

// ============================================================================
// SHELTER DATA - All 260+ AT Shelters
// ============================================================================

export interface Shelter {
  mile: number;
  name: string;
  elevation: number;
  state: string;
  hasWater: boolean;
  hasPrivy: boolean;
  capacity?: number;
  notes?: string;
}

export const SHELTERS: Shelter[] = [
  // GEORGIA (0-78.5)
  { mile: 0.2, name: 'Springer Mountain Shelter', elevation: 3730, state: 'GA', hasWater: true, hasPrivy: true, capacity: 12 },
  { mile: 2.8, name: 'Stover Creek Shelter', elevation: 2930, state: 'GA', hasWater: true, hasPrivy: true, capacity: 8 },
  { mile: 8.1, name: 'Hawk Mountain Shelter', elevation: 3200, state: 'GA', hasWater: true, hasPrivy: true, capacity: 14 },
  { mile: 15.7, name: 'Gooch Mountain Shelter', elevation: 2772, state: 'GA', hasWater: true, hasPrivy: true, capacity: 16 },
  { mile: 27.7, name: 'Woods Hole Shelter', elevation: 3600, state: 'GA', hasWater: true, hasPrivy: true, capacity: 8 },
  { mile: 28.9, name: 'Blood Mountain Shelter', elevation: 4450, state: 'GA', hasWater: false, hasPrivy: false, capacity: 8, notes: 'No water at shelter! Oldest shelter on AT.' },
  { mile: 38.0, name: 'Whitley Gap Shelter', elevation: 3370, state: 'GA', hasWater: true, hasPrivy: true, capacity: 8 },
  { mile: 43.0, name: 'Low Gap Shelter', elevation: 3050, state: 'GA', hasWater: true, hasPrivy: true, capacity: 14 },
  { mile: 50.3, name: 'Blue Mountain Shelter', elevation: 3900, state: 'GA', hasWater: true, hasPrivy: true, capacity: 8 },
  { mile: 58.4, name: 'Tray Mountain Shelter', elevation: 4200, state: 'GA', hasWater: true, hasPrivy: true, capacity: 14 },
  { mile: 65.8, name: 'Deep Gap Shelter', elevation: 3550, state: 'GA', hasWater: true, hasPrivy: true, capacity: 8 },
  { mile: 73.9, name: 'Plumorchard Gap Shelter', elevation: 3050, state: 'GA', hasWater: true, hasPrivy: true, capacity: 12 },

  // NORTH CAROLINA / TENNESSEE (78.5-469)
  { mile: 81.2, name: 'Muskrat Creek Shelter', elevation: 4600, state: 'NC', hasWater: true, hasPrivy: true, capacity: 8 },
  { mile: 86.1, name: 'Standing Indian Shelter', elevation: 4760, state: 'NC', hasWater: true, hasPrivy: true, capacity: 12 },
  { mile: 93.7, name: 'Carter Gap Shelter', elevation: 4540, state: 'NC', hasWater: true, hasPrivy: true, capacity: 10 },
  { mile: 102.4, name: 'Long Branch Shelter', elevation: 4437, state: 'NC', hasWater: true, hasPrivy: true, capacity: 8 },
  { mile: 105.8, name: 'Rock Gap Shelter', elevation: 3760, state: 'NC', hasWater: true, hasPrivy: true, capacity: 8 },
  { mile: 113.3, name: 'Siler Bald Shelter', elevation: 4600, state: 'NC', hasWater: true, hasPrivy: true, capacity: 12 },
  { mile: 120.6, name: 'Wayah Shelter', elevation: 4526, state: 'NC', hasWater: true, hasPrivy: true, capacity: 8 },
  { mile: 125.4, name: 'Cold Spring Shelter', elevation: 4920, state: 'NC', hasWater: true, hasPrivy: true, capacity: 6 },
  { mile: 131.2, name: 'Wesser Bald Shelter', elevation: 4115, state: 'NC', hasWater: true, hasPrivy: true, capacity: 8 },
  { mile: 136.1, name: 'A. Rufus Morgan Shelter', elevation: 2111, state: 'NC', hasWater: true, hasPrivy: true, capacity: 8 },
  { mile: 144.0, name: 'Sassafras Gap Shelter', elevation: 4330, state: 'NC', hasWater: true, hasPrivy: true, capacity: 8 },
  { mile: 153.1, name: 'Brown Fork Gap Shelter', elevation: 3800, state: 'NC', hasWater: true, hasPrivy: true, capacity: 6 },
  { mile: 159.4, name: 'Cable Gap Shelter', elevation: 2880, state: 'NC', hasWater: true, hasPrivy: true, capacity: 8 },
  { mile: 166.2, name: 'Fontana Dam Shelter', elevation: 1775, state: 'NC', hasWater: true, hasPrivy: true, capacity: 24, notes: 'The "Fontana Hilton" - showers nearby!' },

  // GREAT SMOKY MOUNTAINS (165.7-241)
  { mile: 178.0, name: 'Mollies Ridge Shelter', elevation: 4570, state: 'TN', hasWater: true, hasPrivy: true, capacity: 12 },
  { mile: 181.1, name: 'Russell Field Shelter', elevation: 4360, state: 'TN', hasWater: true, hasPrivy: true, capacity: 12 },
  { mile: 184.0, name: 'Spence Field Shelter', elevation: 4915, state: 'NC', hasWater: true, hasPrivy: true, capacity: 12 },
  { mile: 190.1, name: 'Derrick Knob Shelter', elevation: 4880, state: 'TN', hasWater: true, hasPrivy: true, capacity: 12 },
  { mile: 195.8, name: 'Silers Bald Shelter', elevation: 5460, state: 'NC', hasWater: true, hasPrivy: true, capacity: 12 },
  { mile: 197.5, name: 'Double Spring Gap Shelter', elevation: 5505, state: 'NC', hasWater: true, hasPrivy: true, capacity: 12 },
  { mile: 203.1, name: 'Mt. Collins Shelter', elevation: 5870, state: 'TN', hasWater: true, hasPrivy: true, capacity: 12 },
  { mile: 211.1, name: 'Icewater Spring Shelter', elevation: 5920, state: 'NC', hasWater: true, hasPrivy: true, capacity: 12 },
  { mile: 218.5, name: 'Pecks Corner Shelter', elevation: 5280, state: 'NC', hasWater: true, hasPrivy: true, capacity: 12 },
  { mile: 223.7, name: 'Tricorner Knob Shelter', elevation: 5920, state: 'NC', hasWater: true, hasPrivy: true, capacity: 12 },
  { mile: 231.4, name: 'Cosby Knob Shelter', elevation: 4740, state: 'NC', hasWater: true, hasPrivy: true, capacity: 12 },
  { mile: 238.3, name: 'Davenport Gap Shelter', elevation: 2600, state: 'TN', hasWater: true, hasPrivy: true, capacity: 12 },

  // NC/TN CONTINUED
  { mile: 249.0, name: 'Groundhog Creek Shelter', elevation: 2850, state: 'NC', hasWater: true, hasPrivy: true, capacity: 6 },
  { mile: 257.3, name: 'Roaring Fork Shelter', elevation: 3590, state: 'NC', hasWater: true, hasPrivy: true, capacity: 8 },
  { mile: 262.1, name: 'Walnut Mountain Shelter', elevation: 4260, state: 'TN', hasWater: true, hasPrivy: true, capacity: 6 },
  { mile: 272.0, name: 'Deer Park Mountain Shelter', elevation: 2330, state: 'NC', hasWater: true, hasPrivy: true, capacity: 8 },
  { mile: 286.2, name: 'Spring Mountain Shelter', elevation: 3300, state: 'TN', hasWater: true, hasPrivy: true, capacity: 6 },
  { mile: 294.8, name: 'Little Laurel Shelter', elevation: 3620, state: 'NC', hasWater: true, hasPrivy: true, capacity: 8 },
  { mile: 302.1, name: 'Jerry Cabin', elevation: 4150, state: 'NC', hasWater: true, hasPrivy: true, capacity: 6 },
  { mile: 308.8, name: 'Flint Mountain Shelter', elevation: 3570, state: 'NC', hasWater: true, hasPrivy: true, capacity: 8 },
  { mile: 317.6, name: 'Hogback Ridge Shelter', elevation: 4255, state: 'NC', hasWater: true, hasPrivy: true, capacity: 8 },
  { mile: 327.7, name: 'Bald Mountain Shelter', elevation: 5100, state: 'TN', hasWater: true, hasPrivy: true, capacity: 6 },
  { mile: 338.3, name: 'No Business Knob Shelter', elevation: 3180, state: 'TN', hasWater: true, hasPrivy: true, capacity: 8 },
  { mile: 348.8, name: 'Curley Maple Gap Shelter', elevation: 3070, state: 'TN', hasWater: true, hasPrivy: true, capacity: 6 },
  { mile: 361.7, name: 'Cherry Gap Shelter', elevation: 3900, state: 'TN', hasWater: true, hasPrivy: true, capacity: 8 },
  { mile: 370.8, name: 'Clyde Smith Shelter', elevation: 4400, state: 'TN', hasWater: true, hasPrivy: true, capacity: 8 },
  { mile: 379.3, name: 'Roan High Knob Shelter', elevation: 6275, state: 'TN', hasWater: true, hasPrivy: true, capacity: 15, notes: 'Highest shelter on the AT!' },
  { mile: 384.5, name: 'Stan Murray Shelter', elevation: 5050, state: 'NC', hasWater: true, hasPrivy: true, capacity: 8 },
  { mile: 386.4, name: 'Overmountain Shelter', elevation: 4550, state: 'NC', hasWater: true, hasPrivy: true, capacity: 20, notes: 'Historic barn shelter' },
  { mile: 404.4, name: 'Mountaineer Falls Shelter', elevation: 3200, state: 'TN', hasWater: true, hasPrivy: true, capacity: 8 },
  { mile: 414.0, name: 'Moreland Gap Shelter', elevation: 3815, state: 'TN', hasWater: true, hasPrivy: true, capacity: 6 },
  { mile: 422.2, name: 'Laurel Fork Shelter', elevation: 2445, state: 'TN', hasWater: true, hasPrivy: true, capacity: 6 },
  { mile: 430.8, name: 'Watauga Lake Shelter', elevation: 2130, state: 'TN', hasWater: true, hasPrivy: true, capacity: 8 },
  { mile: 438.0, name: 'Vandeventer Shelter', elevation: 3620, state: 'TN', hasWater: true, hasPrivy: true, capacity: 6 },
  { mile: 444.8, name: 'Iron Mountain Shelter', elevation: 4125, state: 'TN', hasWater: true, hasPrivy: true, capacity: 8 },
  { mile: 452.5, name: 'Double Springs Shelter', elevation: 4080, state: 'TN', hasWater: true, hasPrivy: true, capacity: 6 },
  { mile: 460.8, name: 'Abingdon Gap Shelter', elevation: 3785, state: 'TN', hasWater: true, hasPrivy: true, capacity: 8 },

  // VIRGINIA (469-1020)
  { mile: 480.0, name: 'Saunders Shelter', elevation: 3310, state: 'VA', hasWater: true, hasPrivy: true, capacity: 8 },
  { mile: 487.0, name: 'Lost Mountain Shelter', elevation: 3360, state: 'VA', hasWater: true, hasPrivy: true, capacity: 6 },
  { mile: 499.4, name: 'Thomas Knob Shelter', elevation: 5400, state: 'VA', hasWater: true, hasPrivy: true, capacity: 20, notes: 'Near Mt. Rogers, wild ponies!' },
  { mile: 504.5, name: 'Wise Shelter', elevation: 4460, state: 'VA', hasWater: true, hasPrivy: true, capacity: 8 },
  { mile: 510.5, name: 'Old Orchard Shelter', elevation: 4050, state: 'VA', hasWater: true, hasPrivy: true, capacity: 8 },
  { mile: 515.4, name: 'Hurricane Mountain Shelter', elevation: 3850, state: 'VA', hasWater: true, hasPrivy: true, capacity: 6 },
  { mile: 524.6, name: 'Trimpi Shelter', elevation: 2900, state: 'VA', hasWater: true, hasPrivy: true, capacity: 6 },
  { mile: 534.4, name: 'Partnership Shelter', elevation: 3360, state: 'VA', hasWater: true, hasPrivy: true, capacity: 16, notes: 'Pizza delivery to shelter!' },
  { mile: 541.4, name: 'Chatfield Shelter', elevation: 3150, state: 'VA', hasWater: true, hasPrivy: true, capacity: 8 },
  { mile: 560.7, name: 'Knot Maul Branch Shelter', elevation: 2880, state: 'VA', hasWater: true, hasPrivy: true, capacity: 8 },
  { mile: 570.1, name: 'Chestnut Knob Shelter', elevation: 4409, state: 'VA', hasWater: false, hasPrivy: true, capacity: 8, notes: 'Stone cabin, no water at shelter' },
  { mile: 580.8, name: 'Jenkins Shelter', elevation: 2500, state: 'VA', hasWater: true, hasPrivy: true, capacity: 8 },
  { mile: 594.3, name: 'Helveys Mill Shelter', elevation: 3090, state: 'VA', hasWater: true, hasPrivy: true, capacity: 8 },
  { mile: 604.0, name: 'Jenny Knob Shelter', elevation: 2593, state: 'VA', hasWater: true, hasPrivy: true, capacity: 8 },
  { mile: 618.5, name: 'Wapiti Shelter', elevation: 2640, state: 'VA', hasWater: true, hasPrivy: true, capacity: 10 },
  { mile: 628.0, name: 'Docs Knob Shelter', elevation: 3555, state: 'VA', hasWater: true, hasPrivy: true, capacity: 8 },
  { mile: 644.5, name: 'Rice Field Shelter', elevation: 3375, state: 'VA', hasWater: true, hasPrivy: true, capacity: 8 },
  { mile: 657.0, name: 'Pine Swamp Branch Shelter', elevation: 2530, state: 'VA', hasWater: true, hasPrivy: true, capacity: 8 },
  { mile: 660.9, name: 'Bailey Gap Shelter', elevation: 3525, state: 'VA', hasWater: true, hasPrivy: true, capacity: 8 },
  { mile: 669.7, name: 'War Spur Shelter', elevation: 2340, state: 'VA', hasWater: true, hasPrivy: true, capacity: 8 },
  { mile: 675.5, name: 'Laurel Creek Shelter', elevation: 2720, state: 'VA', hasWater: true, hasPrivy: true, capacity: 8 },
  { mile: 682.1, name: 'Sarver Hollow Shelter', elevation: 3000, state: 'VA', hasWater: true, hasPrivy: true, capacity: 8 },
  { mile: 688.1, name: 'Niday Shelter', elevation: 1800, state: 'VA', hasWater: true, hasPrivy: true, capacity: 8 },
  { mile: 698.2, name: 'Pickle Branch Shelter', elevation: 1845, state: 'VA', hasWater: true, hasPrivy: true, capacity: 8 },
  { mile: 711.8, name: 'Johns Spring Shelter', elevation: 1980, state: 'VA', hasWater: true, hasPrivy: true, capacity: 8 },
  { mile: 712.8, name: 'Catawba Mountain Shelter', elevation: 2179, state: 'VA', hasWater: true, hasPrivy: true, capacity: 8 },
  { mile: 715.2, name: 'Campbell Shelter', elevation: 2580, state: 'VA', hasWater: true, hasPrivy: true, capacity: 8 },
  { mile: 721.2, name: 'Lamberts Meadow Shelter', elevation: 2080, state: 'VA', hasWater: true, hasPrivy: true, capacity: 10 },
  { mile: 735.6, name: 'Fullhardt Knob Shelter', elevation: 2670, state: 'VA', hasWater: true, hasPrivy: true, capacity: 8 },
  { mile: 741.8, name: 'Wilson Creek Shelter', elevation: 1830, state: 'VA', hasWater: true, hasPrivy: true, capacity: 8 },
  { mile: 749.1, name: 'Bobblets Gap Shelter', elevation: 1920, state: 'VA', hasWater: true, hasPrivy: true, capacity: 8 },
  { mile: 755.6, name: 'Cove Mountain Shelter', elevation: 1925, state: 'VA', hasWater: true, hasPrivy: true, capacity: 8 },
  { mile: 762.6, name: 'Bryant Ridge Shelter', elevation: 1320, state: 'VA', hasWater: true, hasPrivy: true, capacity: 20, notes: 'Massive 2-story shelter!' },
  { mile: 767.5, name: 'Cornelius Creek Shelter', elevation: 3145, state: 'VA', hasWater: true, hasPrivy: true, capacity: 8 },
  { mile: 772.8, name: 'Thunder Hill Shelter', elevation: 3960, state: 'VA', hasWater: true, hasPrivy: true, capacity: 8 },
  { mile: 785.4, name: 'Matts Creek Shelter', elevation: 835, state: 'VA', hasWater: true, hasPrivy: true, capacity: 8 },
  { mile: 789.3, name: 'Johns Hollow Shelter', elevation: 1020, state: 'VA', hasWater: true, hasPrivy: true, capacity: 8 },
  { mile: 798.1, name: 'Punchbowl Shelter', elevation: 2500, state: 'VA', hasWater: true, hasPrivy: true, capacity: 6 },
  { mile: 807.6, name: 'Brown Mountain Creek Shelter', elevation: 1395, state: 'VA', hasWater: true, hasPrivy: true, capacity: 8 },
  { mile: 813.2, name: 'Cow Camp Shelter', elevation: 3160, state: 'VA', hasWater: true, hasPrivy: true, capacity: 8 },
  { mile: 823.4, name: 'Seeley-Woodworth Shelter', elevation: 3770, state: 'VA', hasWater: true, hasPrivy: true, capacity: 8 },
  { mile: 830.0, name: 'The Priest Shelter', elevation: 3840, state: 'VA', hasWater: true, hasPrivy: true, capacity: 8, notes: 'Near brutal Priest climb' },
  { mile: 837.6, name: 'Harpers Creek Shelter', elevation: 1800, state: 'VA', hasWater: true, hasPrivy: true, capacity: 8 },
  { mile: 843.8, name: 'Maupin Field Shelter', elevation: 2720, state: 'VA', hasWater: true, hasPrivy: true, capacity: 8 },
  { mile: 859.8, name: 'Paul C. Wolfe Shelter', elevation: 1700, state: 'VA', hasWater: true, hasPrivy: true, capacity: 8 },
  { mile: 872.3, name: 'Calf Mountain Shelter', elevation: 2700, state: 'VA', hasWater: true, hasPrivy: true, capacity: 8 },

  // SHENANDOAH NATIONAL PARK (880-1000)
  { mile: 885.3, name: 'Blackrock Hut', elevation: 2645, state: 'VA', hasWater: true, hasPrivy: true, capacity: 8 },
  { mile: 898.5, name: 'Pinefield Hut', elevation: 2430, state: 'VA', hasWater: true, hasPrivy: true, capacity: 8 },
  { mile: 906.7, name: 'Hightop Hut', elevation: 3175, state: 'VA', hasWater: true, hasPrivy: true, capacity: 8 },
  { mile: 919.1, name: 'Bearfence Mountain Hut', elevation: 3110, state: 'VA', hasWater: true, hasPrivy: true, capacity: 8 },
  { mile: 930.6, name: 'Rock Spring Hut', elevation: 3465, state: 'VA', hasWater: true, hasPrivy: true, capacity: 8 },
  { mile: 941.5, name: 'Byrds Nest 3', elevation: 3290, state: 'VA', hasWater: false, hasPrivy: true, capacity: 8, notes: 'Day-use only, no water' },
  { mile: 945.9, name: 'Pass Mountain Hut', elevation: 2690, state: 'VA', hasWater: true, hasPrivy: true, capacity: 8 },
  { mile: 959.0, name: 'Gravel Springs Hut', elevation: 2480, state: 'VA', hasWater: true, hasPrivy: true, capacity: 8 },
  { mile: 969.5, name: 'Tom Floyd Wayside', elevation: 1900, state: 'VA', hasWater: true, hasPrivy: true, capacity: 8 },
  { mile: 977.6, name: 'Jim & Molly Denton Shelter', elevation: 1310, state: 'VA', hasWater: true, hasPrivy: true, capacity: 12, notes: 'Has solar shower!' },
  { mile: 983.1, name: 'Manassas Gap Shelter', elevation: 1655, state: 'VA', hasWater: true, hasPrivy: true, capacity: 6 },
  { mile: 987.6, name: 'Whiskey Hollow Shelter', elevation: 1230, state: 'VA', hasWater: true, hasPrivy: true, capacity: 6 },
  { mile: 996.0, name: 'Rod Hollow Shelter', elevation: 840, state: 'VA', hasWater: true, hasPrivy: true, capacity: 8 },
  { mile: 1002.9, name: 'Sam Moore Shelter', elevation: 990, state: 'VA', hasWater: true, hasPrivy: true, capacity: 8 },

  // WEST VIRGINIA / MARYLAND (1020-1075)
  { mile: 1017.1, name: 'David Lesser Shelter', elevation: 1380, state: 'VA', hasWater: true, hasPrivy: true, capacity: 8 },
  { mile: 1033.0, name: 'Ed Garvey Shelter', elevation: 1100, state: 'MD', hasWater: true, hasPrivy: true, capacity: 12 },
  { mile: 1037.1, name: 'Crampton Gap Shelter', elevation: 1000, state: 'MD', hasWater: true, hasPrivy: true, capacity: 6 },
  { mile: 1042.1, name: 'Rocky Run Shelter', elevation: 970, state: 'MD', hasWater: true, hasPrivy: true, capacity: 6 },
  { mile: 1049.6, name: 'Pine Knob Shelter', elevation: 1360, state: 'MD', hasWater: true, hasPrivy: true, capacity: 8 },
  { mile: 1057.8, name: 'Ensign Cowall Shelter', elevation: 1430, state: 'MD', hasWater: true, hasPrivy: true, capacity: 6 },
  { mile: 1062.7, name: 'Raven Rock Shelter', elevation: 1654, state: 'MD', hasWater: true, hasPrivy: true, capacity: 6 },
  { mile: 1072.3, name: 'Deer Lick Shelters', elevation: 1420, state: 'PA', hasWater: true, hasPrivy: true, capacity: 12 },
  { mile: 1075.9, name: 'Tumbling Run Shelters', elevation: 1120, state: 'PA', hasWater: true, hasPrivy: true, capacity: 16 },

  // PENNSYLVANIA (1075-1298)
  { mile: 1082.5, name: 'Rocky Mountain Shelters', elevation: 1520, state: 'PA', hasWater: true, hasPrivy: true, capacity: 12 },
  { mile: 1088.1, name: 'Quarry Gap Shelters', elevation: 1455, state: 'PA', hasWater: true, hasPrivy: true, capacity: 14 },
  { mile: 1095.5, name: 'Birch Run Shelters', elevation: 1795, state: 'PA', hasWater: true, hasPrivy: true, capacity: 14 },
  { mile: 1101.7, name: 'Toms Run Shelters', elevation: 1300, state: 'PA', hasWater: true, hasPrivy: true, capacity: 12 },
  { mile: 1112.6, name: 'James Fry Shelter', elevation: 805, state: 'PA', hasWater: true, hasPrivy: true, capacity: 6 },
  { mile: 1120.7, name: 'Alec Kennedy Shelter', elevation: 850, state: 'PA', hasWater: true, hasPrivy: true, capacity: 8 },
  { mile: 1138.9, name: 'Darlington Shelter', elevation: 1250, state: 'PA', hasWater: true, hasPrivy: true, capacity: 8 },
  { mile: 1146.2, name: 'Thelma Marks Shelter', elevation: 1200, state: 'PA', hasWater: true, hasPrivy: true, capacity: 6 },
  { mile: 1154.5, name: 'Clarks Ferry Shelter', elevation: 1260, state: 'PA', hasWater: true, hasPrivy: true, capacity: 6 },
  { mile: 1161.2, name: 'Peters Mountain Shelter', elevation: 970, state: 'PA', hasWater: true, hasPrivy: true, capacity: 8 },
  { mile: 1179.2, name: 'Rausch Gap Shelter', elevation: 980, state: 'PA', hasWater: true, hasPrivy: true, capacity: 8 },
  { mile: 1192.6, name: 'William Penn Shelter', elevation: 1300, state: 'PA', hasWater: true, hasPrivy: true, capacity: 8 },
  { mile: 1196.7, name: '501 Shelter', elevation: 1460, state: 'PA', hasWater: true, hasPrivy: true, capacity: 12, notes: 'Enclosed shelter near road' },
  { mile: 1211.6, name: 'Eagles Nest Shelter', elevation: 1510, state: 'PA', hasWater: true, hasPrivy: true, capacity: 6 },
  { mile: 1226.3, name: 'Windsor Furnace Shelter', elevation: 940, state: 'PA', hasWater: true, hasPrivy: true, capacity: 8 },
  { mile: 1235.4, name: 'Eckville Shelter', elevation: 600, state: 'PA', hasWater: true, hasPrivy: true, capacity: 8 },
  { mile: 1242.8, name: 'Allentown Shelter', elevation: 1350, state: 'PA', hasWater: true, hasPrivy: true, capacity: 6 },
  { mile: 1252.8, name: 'Bake Oven Knob Shelter', elevation: 1380, state: 'PA', hasWater: true, hasPrivy: true, capacity: 8 },
  { mile: 1260.3, name: 'George Outerbridge Shelter', elevation: 1000, state: 'PA', hasWater: true, hasPrivy: true, capacity: 8 },
  { mile: 1277.3, name: 'Leroy Smith Shelter', elevation: 1410, state: 'PA', hasWater: true, hasPrivy: true, capacity: 8 },
  { mile: 1291.0, name: 'Kirkridge Shelter', elevation: 1480, state: 'PA', hasWater: true, hasPrivy: true, capacity: 8 },

  // NEW JERSEY / NEW YORK (1298-1433)
  { mile: 1322.3, name: 'Brink Road Shelter', elevation: 1110, state: 'NJ', hasWater: true, hasPrivy: true, capacity: 8 },
  { mile: 1329.0, name: 'Gren Anderson Shelter', elevation: 1320, state: 'NJ', hasWater: true, hasPrivy: true, capacity: 8 },
  { mile: 1334.8, name: 'Mashipacong Shelter', elevation: 1425, state: 'NJ', hasWater: true, hasPrivy: true, capacity: 8 },
  { mile: 1337.4, name: 'Rutherford Shelter', elevation: 1345, state: 'NJ', hasWater: true, hasPrivy: true, capacity: 6 },
  { mile: 1342.0, name: 'High Point Shelter', elevation: 1280, state: 'NJ', hasWater: true, hasPrivy: true, capacity: 8 },
  { mile: 1354.4, name: 'Pochuck Mountain Shelter', elevation: 840, state: 'NJ', hasWater: true, hasPrivy: true, capacity: 6 },
  { mile: 1365.9, name: 'Wawayanda Shelter', elevation: 1200, state: 'NJ', hasWater: true, hasPrivy: true, capacity: 8 },
  { mile: 1378.1, name: 'Wildcat Shelter', elevation: 1180, state: 'NY', hasWater: true, hasPrivy: true, capacity: 8 },
  { mile: 1392.6, name: 'Fingerboard Shelter', elevation: 1300, state: 'NY', hasWater: true, hasPrivy: true, capacity: 8 },
  { mile: 1397.9, name: 'William Brien Memorial Shelter', elevation: 1070, state: 'NY', hasWater: true, hasPrivy: true, capacity: 8 },
  { mile: 1403.2, name: 'West Mountain Shelter', elevation: 1240, state: 'NY', hasWater: true, hasPrivy: true, capacity: 8 },

  // NEW YORK / CONNECTICUT (1433-1520)
  { mile: 1434.5, name: 'RPH Shelter', elevation: 360, state: 'NY', hasWater: true, hasPrivy: true, capacity: 8 },
  { mile: 1443.5, name: 'Morgan Stewart Memorial Shelter', elevation: 1285, state: 'NY', hasWater: true, hasPrivy: true, capacity: 8 },
  { mile: 1451.3, name: 'Telephone Pioneers Shelter', elevation: 910, state: 'NY', hasWater: true, hasPrivy: true, capacity: 6 },
  { mile: 1460.1, name: 'Wiley Shelter', elevation: 740, state: 'NY', hasWater: true, hasPrivy: true, capacity: 6 },
  { mile: 1464.1, name: 'Ten Mile River Lean-to', elevation: 290, state: 'CT', hasWater: true, hasPrivy: true, capacity: 6, notes: 'Lowest shelter on AT!' },
  { mile: 1472.9, name: 'Mt. Algo Lean-to', elevation: 655, state: 'CT', hasWater: true, hasPrivy: true, capacity: 6 },
  { mile: 1480.4, name: 'Stewart Hollow Brook Lean-to', elevation: 425, state: 'CT', hasWater: true, hasPrivy: true, capacity: 6 },
  { mile: 1490.4, name: 'Pine Swamp Brook Lean-to', elevation: 1075, state: 'CT', hasWater: true, hasPrivy: true, capacity: 6 },
  { mile: 1503.1, name: 'Limestone Spring Lean-to', elevation: 980, state: 'CT', hasWater: true, hasPrivy: true, capacity: 6 },
  { mile: 1510.5, name: 'Riga Lean-to', elevation: 1610, state: 'CT', hasWater: true, hasPrivy: true, capacity: 6 },
  { mile: 1511.7, name: 'Brassie Brook Lean-to', elevation: 1705, state: 'CT', hasWater: true, hasPrivy: true, capacity: 6 },

  // MASSACHUSETTS (1520-1596)
  { mile: 1520.0, name: 'The Hemlocks Lean-to', elevation: 1880, state: 'MA', hasWater: true, hasPrivy: true, capacity: 6 },
  { mile: 1520.1, name: 'Glen Brook Lean-to', elevation: 1885, state: 'MA', hasWater: true, hasPrivy: true, capacity: 6 },
  { mile: 1534.4, name: 'Tom Leonard Lean-to', elevation: 1540, state: 'MA', hasWater: true, hasPrivy: true, capacity: 8 },
  { mile: 1539.8, name: 'Mt. Wilcox South Lean-to', elevation: 1720, state: 'MA', hasWater: true, hasPrivy: true, capacity: 6 },
  { mile: 1541.5, name: 'Mt. Wilcox North Lean-to', elevation: 2100, state: 'MA', hasWater: true, hasPrivy: true, capacity: 6 },
  { mile: 1555.7, name: 'Upper Goose Pond Cabin', elevation: 1483, state: 'MA', hasWater: true, hasPrivy: true, capacity: 12, notes: 'Caretaker cabin, canoe!' },
  { mile: 1564.5, name: 'October Mountain Lean-to', elevation: 1950, state: 'MA', hasWater: true, hasPrivy: true, capacity: 8 },
  { mile: 1573.3, name: 'Kay Wood Lean-to', elevation: 1860, state: 'MA', hasWater: true, hasPrivy: true, capacity: 6 },
  { mile: 1590.0, name: 'Mark Noepel Lean-to', elevation: 2750, state: 'MA', hasWater: true, hasPrivy: true, capacity: 8 },
  { mile: 1593.3, name: 'Bascom Lodge', elevation: 3491, state: 'MA', hasWater: true, hasPrivy: true, capacity: 32, notes: 'AMC lodge on Mt. Greylock summit' },
  { mile: 1596.6, name: 'Wilbur Clearing Lean-to', elevation: 2300, state: 'MA', hasWater: true, hasPrivy: true, capacity: 8 },

  // VERMONT (1596-1760)
  { mile: 1608.9, name: 'Seth Warner Shelter', elevation: 2180, state: 'VT', hasWater: true, hasPrivy: true, capacity: 8 },
  { mile: 1613.7, name: 'Congdon Shelter', elevation: 2060, state: 'VT', hasWater: true, hasPrivy: true, capacity: 8 },
  { mile: 1619.6, name: 'Melville Nauheim Shelter', elevation: 2330, state: 'VT', hasWater: true, hasPrivy: true, capacity: 8 },
  { mile: 1628.1, name: 'Goddard Shelter', elevation: 3540, state: 'VT', hasWater: true, hasPrivy: true, capacity: 12 },
  { mile: 1632.4, name: 'Caughnawaga Shelter', elevation: 2795, state: 'VT', hasWater: true, hasPrivy: true, capacity: 6 },
  { mile: 1637.0, name: 'Story Spring Shelter', elevation: 2810, state: 'VT', hasWater: true, hasPrivy: true, capacity: 8 },
  { mile: 1647.4, name: 'Stratton Pond Shelter', elevation: 2565, state: 'VT', hasWater: true, hasPrivy: true, capacity: 16 },
  { mile: 1652.3, name: 'William Douglas Shelter', elevation: 2210, state: 'VT', hasWater: true, hasPrivy: true, capacity: 8 },
  { mile: 1655.3, name: 'Spruce Peak Shelter', elevation: 2180, state: 'VT', hasWater: true, hasPrivy: true, capacity: 8 },
  { mile: 1660.1, name: 'Bromley Shelter', elevation: 2560, state: 'VT', hasWater: true, hasPrivy: true, capacity: 12 },
  { mile: 1668.2, name: 'Peru Peak Shelter', elevation: 2605, state: 'VT', hasWater: true, hasPrivy: true, capacity: 8 },
  { mile: 1672.9, name: 'Lost Pond Shelter', elevation: 2150, state: 'VT', hasWater: true, hasPrivy: true, capacity: 8 },
  { mile: 1674.4, name: 'Old Job Shelter', elevation: 1525, state: 'VT', hasWater: true, hasPrivy: true, capacity: 8 },
  { mile: 1674.6, name: 'Big Branch Shelter', elevation: 1460, state: 'VT', hasWater: true, hasPrivy: true, capacity: 8 },
  { mile: 1677.9, name: 'Little Rock Pond Shelter', elevation: 1920, state: 'VT', hasWater: true, hasPrivy: true, capacity: 8 },
  { mile: 1682.7, name: 'Greenwall Shelter', elevation: 2025, state: 'VT', hasWater: true, hasPrivy: true, capacity: 8 },
  { mile: 1687.8, name: 'Minerva Hinchey Shelter', elevation: 1605, state: 'VT', hasWater: true, hasPrivy: true, capacity: 8 },
  { mile: 1691.5, name: 'Clarendon Shelter', elevation: 1190, state: 'VT', hasWater: true, hasPrivy: true, capacity: 8 },
  { mile: 1697.6, name: 'Governor Clement Shelter', elevation: 1900, state: 'VT', hasWater: true, hasPrivy: true, capacity: 10 },
  { mile: 1701.9, name: 'Cooper Lodge', elevation: 3900, state: 'VT', hasWater: true, hasPrivy: true, capacity: 12, notes: 'Near Killington Peak' },
  { mile: 1704.4, name: 'Pico Camp', elevation: 3510, state: 'VT', hasWater: true, hasPrivy: true, capacity: 6 },
  { mile: 1706.3, name: 'Churchill Scott Shelter', elevation: 2560, state: 'VT', hasWater: true, hasPrivy: true, capacity: 8 },
  { mile: 1709.2, name: 'Tucker Johnson Shelter', elevation: 2250, state: 'VT', hasWater: true, hasPrivy: true, capacity: 6 },
  { mile: 1718.2, name: 'Stony Brook Shelter', elevation: 1760, state: 'VT', hasWater: true, hasPrivy: true, capacity: 8 },
  { mile: 1728.1, name: 'Wintturi Shelter', elevation: 1910, state: 'VT', hasWater: true, hasPrivy: true, capacity: 8 },
  { mile: 1740.4, name: 'Thistle Hill Shelter', elevation: 1680, state: 'VT', hasWater: true, hasPrivy: true, capacity: 8 },
  { mile: 1749.2, name: 'Happy Hill Shelter', elevation: 1460, state: 'VT', hasWater: true, hasPrivy: true, capacity: 8 },

  // NEW HAMPSHIRE (1756-1910)
  { mile: 1756.5, name: 'Velvet Rocks Shelter', elevation: 1040, state: 'NH', hasWater: true, hasPrivy: true, capacity: 8 },
  { mile: 1766.0, name: 'Moose Mountain Shelter', elevation: 1850, state: 'NH', hasWater: true, hasPrivy: true, capacity: 8 },
  { mile: 1771.7, name: 'Trapper John Shelter', elevation: 1345, state: 'NH', hasWater: true, hasPrivy: true, capacity: 8 },
  { mile: 1778.3, name: 'Smarts Mountain Cabin', elevation: 3220, state: 'NH', hasWater: true, hasPrivy: true, capacity: 8 },
  { mile: 1783.7, name: 'Hexacuba Shelter', elevation: 1980, state: 'NH', hasWater: true, hasPrivy: true, capacity: 6 },
  { mile: 1799.4, name: 'Jeffers Brook Shelter', elevation: 1350, state: 'NH', hasWater: true, hasPrivy: true, capacity: 8 },
  { mile: 1806.3, name: 'Beaver Brook Shelter', elevation: 3650, state: 'NH', hasWater: true, hasPrivy: true, capacity: 8 },
  { mile: 1815.3, name: 'Eliza Brook Shelter', elevation: 2400, state: 'NH', hasWater: true, hasPrivy: true, capacity: 10 },
  { mile: 1819.3, name: 'Kinsman Pond Shelter', elevation: 3750, state: 'NH', hasWater: true, hasPrivy: true, capacity: 10 },
  { mile: 1821.2, name: 'Lonesome Lake Hut', elevation: 2760, state: 'NH', hasWater: true, hasPrivy: true, capacity: 48, notes: 'AMC Hut - fee or work-for-stay' },
  { mile: 1830.5, name: 'Greenleaf Hut', elevation: 4200, state: 'NH', hasWater: true, hasPrivy: true, capacity: 48, notes: 'AMC Hut - near Franconia Ridge' },
  { mile: 1834.4, name: 'Garfield Ridge Shelter', elevation: 3900, state: 'NH', hasWater: true, hasPrivy: true, capacity: 12 },
  { mile: 1837.1, name: 'Galehead Hut', elevation: 3800, state: 'NH', hasWater: true, hasPrivy: true, capacity: 38, notes: 'AMC Hut' },
  { mile: 1839.9, name: 'Guyot Shelter', elevation: 4144, state: 'NH', hasWater: true, hasPrivy: true, capacity: 12 },
  { mile: 1844.1, name: 'Zealand Falls Hut', elevation: 2630, state: 'NH', hasWater: true, hasPrivy: true, capacity: 36, notes: 'AMC Hut - great falls!' },
  { mile: 1848.9, name: 'Ethan Pond Shelter', elevation: 2860, state: 'NH', hasWater: true, hasPrivy: true, capacity: 10 },
  { mile: 1858.2, name: 'Mizpah Spring Hut', elevation: 3800, state: 'NH', hasWater: true, hasPrivy: true, capacity: 60, notes: 'AMC Hut' },
  { mile: 1862.9, name: 'Lake of the Clouds Hut', elevation: 5012, state: 'NH', hasWater: true, hasPrivy: true, capacity: 90, notes: 'AMC Hut - highest, near Washington!' },
  { mile: 1864.3, name: 'Hermit Lake Shelters', elevation: 3875, state: 'NH', hasWater: true, hasPrivy: true, capacity: 86, notes: 'Multiple shelters' },
  { mile: 1868.5, name: 'The Perch', elevation: 4313, state: 'NH', hasWater: true, hasPrivy: true, capacity: 8 },
  { mile: 1870.0, name: 'Madison Springs Hut', elevation: 4825, state: 'NH', hasWater: true, hasPrivy: true, capacity: 52, notes: 'AMC Hut' },
  { mile: 1883.7, name: 'Carter Notch Hut', elevation: 3350, state: 'NH', hasWater: true, hasPrivy: true, capacity: 40, notes: 'AMC Hut' },
  { mile: 1890.9, name: 'Imp Shelter', elevation: 3250, state: 'NH', hasWater: true, hasPrivy: true, capacity: 10 },
  { mile: 1897.0, name: 'Rattle River Shelter', elevation: 1260, state: 'NH', hasWater: true, hasPrivy: true, capacity: 8 },
  { mile: 1910.7, name: 'Gentian Pond Shelter', elevation: 2166, state: 'NH', hasWater: true, hasPrivy: true, capacity: 10 },

  // MAINE (1916-2197.4)
  { mile: 1916.0, name: 'Carlo Col Shelter', elevation: 2945, state: 'ME', hasWater: true, hasPrivy: true, capacity: 8 },
  { mile: 1920.5, name: 'Full Goose Shelter', elevation: 3030, state: 'ME', hasWater: true, hasPrivy: true, capacity: 8 },
  { mile: 1925.4, name: 'Speck Pond Shelter', elevation: 3500, state: 'ME', hasWater: true, hasPrivy: true, capacity: 8, notes: 'Highest pond in Maine!' },
  { mile: 1932.3, name: 'Baldpate Lean-to', elevation: 2645, state: 'ME', hasWater: true, hasPrivy: true, capacity: 8 },
  { mile: 1935.8, name: 'Frye Notch Lean-to', elevation: 2280, state: 'ME', hasWater: true, hasPrivy: true, capacity: 6 },
  { mile: 1946.3, name: 'Hall Mountain Lean-to', elevation: 2635, state: 'ME', hasWater: true, hasPrivy: true, capacity: 6 },
  { mile: 1959.1, name: 'Bemis Mountain Lean-to', elevation: 2790, state: 'ME', hasWater: true, hasPrivy: true, capacity: 8 },
  { mile: 1967.4, name: 'Sabbath Day Pond Lean-to', elevation: 2390, state: 'ME', hasWater: true, hasPrivy: true, capacity: 8 },
  { mile: 1978.6, name: 'Piazza Rock Lean-to', elevation: 2080, state: 'ME', hasWater: true, hasPrivy: true, capacity: 8 },
  { mile: 1987.5, name: 'Poplar Ridge Lean-to', elevation: 2920, state: 'ME', hasWater: true, hasPrivy: true, capacity: 8 },
  { mile: 1995.5, name: 'Spaulding Mountain Lean-to', elevation: 3140, state: 'ME', hasWater: true, hasPrivy: true, capacity: 8 },
  { mile: 2014.1, name: 'Horns Pond Lean-tos', elevation: 3160, state: 'ME', hasWater: true, hasPrivy: true, capacity: 16 },
  { mile: 2024.3, name: 'Little Bigelow Lean-to', elevation: 1760, state: 'ME', hasWater: true, hasPrivy: true, capacity: 8 },
  { mile: 2032.0, name: 'West Carry Pond Lean-to', elevation: 1340, state: 'ME', hasWater: true, hasPrivy: true, capacity: 8 },
  { mile: 2042.0, name: 'Pierce Pond Lean-to', elevation: 1150, state: 'ME', hasWater: true, hasPrivy: true, capacity: 8 },
  { mile: 2051.7, name: 'Pleasant Pond Lean-to', elevation: 1320, state: 'ME', hasWater: true, hasPrivy: true, capacity: 8 },
  { mile: 2060.7, name: 'Bald Mountain Brook Lean-to', elevation: 1280, state: 'ME', hasWater: true, hasPrivy: true, capacity: 8 },
  { mile: 2064.8, name: 'Moxie Bald Lean-to', elevation: 1220, state: 'ME', hasWater: true, hasPrivy: true, capacity: 8 },
  { mile: 2073.7, name: 'Horseshoe Canyon Lean-to', elevation: 880, state: 'ME', hasWater: true, hasPrivy: true, capacity: 8 },
  { mile: 2085.7, name: 'Leeman Brook Lean-to', elevation: 1060, state: 'ME', hasWater: true, hasPrivy: true, capacity: 6 },
  { mile: 2093.1, name: 'Wilson Valley Lean-to', elevation: 1000, state: 'ME', hasWater: true, hasPrivy: true, capacity: 6 },
  { mile: 2097.8, name: 'Long Pond Stream Lean-to', elevation: 930, state: 'ME', hasWater: true, hasPrivy: true, capacity: 6 },
  { mile: 2101.8, name: 'Cloud Pond Lean-to', elevation: 2420, state: 'ME', hasWater: true, hasPrivy: true, capacity: 6 },
  { mile: 2108.9, name: 'Chairback Gap Lean-to', elevation: 2000, state: 'ME', hasWater: true, hasPrivy: true, capacity: 6 },
  { mile: 2118.8, name: 'Carl Newhall Lean-to', elevation: 1860, state: 'ME', hasWater: true, hasPrivy: true, capacity: 6 },
  { mile: 2126.0, name: 'Logan Brook Lean-to', elevation: 2480, state: 'ME', hasWater: true, hasPrivy: true, capacity: 6 },
  { mile: 2129.6, name: 'East Branch Lean-to', elevation: 1225, state: 'ME', hasWater: true, hasPrivy: true, capacity: 6 },
  { mile: 2137.7, name: 'Cooper Brook Falls Lean-to', elevation: 880, state: 'ME', hasWater: true, hasPrivy: true, capacity: 8 },
  { mile: 2149.1, name: 'Potaywadjo Spring Lean-to', elevation: 710, state: 'ME', hasWater: true, hasPrivy: true, capacity: 6 },
  { mile: 2153.6, name: 'Nahmakanta Lean-to', elevation: 512, state: 'ME', hasWater: true, hasPrivy: true, capacity: 8 },
  { mile: 2159.2, name: 'Wadleigh Stream Lean-to', elevation: 685, state: 'ME', hasWater: true, hasPrivy: true, capacity: 8 },
  { mile: 2167.3, name: 'Rainbow Stream Lean-to', elevation: 1020, state: 'ME', hasWater: true, hasPrivy: true, capacity: 8 },
  { mile: 2178.8, name: 'Hurd Brook Lean-to', elevation: 715, state: 'ME', hasWater: true, hasPrivy: true, capacity: 8 },
  { mile: 2192.2, name: 'The Birches', elevation: 1080, state: 'ME', hasWater: true, hasPrivy: true, capacity: 12, notes: 'Last shelter before Katahdin!' },
];

// ============================================================================
// STATE BOUNDARIES
// ============================================================================

export interface StateBoundary {
  mile: number;
  state: string;
  prevState: string;
  name: string;
  celebration: string;        // Message shown when crossing
  statesCompleted: number;    // How many states done (out of 14)
  percentComplete: number;    // Overall trail % at this point
  funFact?: string;           // Interesting fact about this milestone
}

export const STATE_BOUNDARIES: StateBoundary[] = [
  { mile: 0, state: 'GA', prevState: '', name: 'Springer Mountain - Southern Terminus', celebration: `Your journey begins! Touch the bronze plaque and take a deep breath. ${TRAIL_TOTAL_MILES.toLocaleString()} miles to Katahdin.`, statesCompleted: 0, percentComplete: 0, funFact: "Springer Mountain was designated the southern terminus in 1958." },
  { mile: 78.5, state: 'NC', prevState: 'GA', name: 'Georgia/North Carolina Border', celebration: "Goodbye Georgia! Hello North Carolina! You've completed your first state - only 13 more to go!", statesCompleted: 1, percentComplete: 3.6, funFact: "NC has 95.5 miles of AT but you'll cross through it multiple times with TN." },
  { mile: 166, state: 'GSMNP', prevState: 'NC', name: 'Great Smoky Mountains National Park', celebration: "Welcome to the Smokies! The most visited national park on the AT. Shelter camping required.", statesCompleted: 1, percentComplete: 7.5, funFact: "GSMNP has the highest sustained elevation on the entire AT." },
  { mile: 241, state: 'NC', prevState: 'GSMNP', name: 'Exit Smokies into NC', celebration: "You made it through the Smokies! That's a major accomplishment. The balds await!", statesCompleted: 1, percentComplete: 11.0, funFact: "The AT weaves between NC and TN multiple times through the highlands." },
  { mile: 325, state: 'TN', prevState: 'NC', name: 'NC/Tennessee Border', celebration: "Entering Tennessee! Roan Highlands ahead with some of the best balds on the trail.", statesCompleted: 2, percentComplete: 14.8, funFact: "TN state song 'Rocky Top' was written about a real spot on this section." },
  { mile: 469, state: 'VA', prevState: 'TN', name: 'Tennessee/Virginia Border - Damascus!', celebration: "DAMASCUS! The friendliest town on the AT! You've earned a real town stop. VA is 550 miles - pace yourself!", statesCompleted: 3, percentComplete: 21.3, funFact: "Virginia has more AT miles than any other state - nearly 25% of the trail." },
  { mile: 1020, state: 'WV', prevState: 'VA', name: 'Virginia/West Virginia Border', celebration: "You made it through Virginia! That's a HUGE accomplishment. WV is just 4 miles - blink and you'll miss it!", statesCompleted: 4, percentComplete: 46.4, funFact: "West Virginia has just 4 miles of AT - the shortest section of any state." },
  { mile: 1025, state: 'MD', prevState: 'WV', name: 'Harpers Ferry - ATC Headquarters!', celebration: "HARPERS FERRY! The psychological halfway point! Get your photo at ATC HQ and sign the register!", statesCompleted: 5, percentComplete: 46.6, funFact: "Harpers Ferry is where John Brown's raid took place in 1859." },
  { mile: 1072, state: 'PA', prevState: 'MD', name: 'Maryland/Pennsylvania Border', celebration: "Welcome to Pennsylvania - 229 miles of... rocks. They call it 'Rocksylvania' for a reason. Watch your ankles!", statesCompleted: 6, percentComplete: 48.8, funFact: "PA rocks are actually ancient lava flows from 440 million years ago." },
  { mile: 1298, state: 'NJ', prevState: 'PA', name: 'Delaware Water Gap', celebration: "You survived Rocksylvania! New Jersey awaits with boardwalks, lakes, and MUCH better footing!", statesCompleted: 7, percentComplete: 59.0, funFact: "NJ was the first state to have all its AT miles protected from development." },
  { mile: 1367, state: 'NY', prevState: 'NJ', name: 'New Jersey/New York Border', celebration: "Entering the Empire State! Bear Mountain and the Hudson River crossing ahead!", statesCompleted: 8, percentComplete: 62.2, funFact: "The lowest point on the entire AT (124 ft) is at Bear Mountain Bridge." },
  { mile: 1462, state: 'CT', prevState: 'NY', name: 'New York/Connecticut Border', celebration: "Hello Connecticut! Rolling hills, stone walls, and the Housatonic River valley ahead.", statesCompleted: 9, percentComplete: 66.5, funFact: "Connecticut has beautiful covered bridges along the trail." },
  { mile: 1518, state: 'MA', prevState: 'CT', name: 'Connecticut/Massachusetts Border', celebration: "Bay State bound! Mt. Greylock and Upper Goose Pond Cabin await. The trail is getting wilder!", statesCompleted: 10, percentComplete: 69.1, funFact: "Mt. Greylock inspired Melville's Moby Dick - he saw a white whale in the mountain." },
  { mile: 1600, state: 'VT', prevState: 'MA', name: 'Massachusetts/Vermont Border', celebration: "GREEN MOUNTAIN STATE! Welcome to Vermont - and the MUD! The Long Trail overlap begins.", statesCompleted: 11, percentComplete: 72.8, funFact: "Vermont means 'green mountain' in French." },
  { mile: 1754, state: 'NH', prevState: 'VT', name: 'Vermont/New Hampshire Border - Hanover!', celebration: "NEW HAMPSHIRE! The White Mountains await. This is where it gets REAL. Prepare for the hardest terrain on the AT!", statesCompleted: 12, percentComplete: 79.8, funFact: "The Presidential Range has some of the worst weather on Earth." },
  { mile: 1912, state: 'ME', prevState: 'NH', name: 'New Hampshire/Maine Border', celebration: "THE FINAL STATE! Welcome to Maine! Only 286 miles to Katahdin. You're going to finish this!", statesCompleted: 13, percentComplete: 87.0, funFact: "Maine has more remote wilderness than any other state on the AT." },
  { mile: TRAIL_TOTAL_MILES, state: 'END', prevState: 'ME', name: 'Baxter Peak - Katahdin - THE END!', celebration: `YOU DID IT!!! ${TRAIL_TOTAL_MILES.toLocaleString()} MILES! Touch the famous sign at Baxter Peak! You are now an AT thru-hiker! Cry. Take photos. You earned every single step.`, statesCompleted: 14, percentComplete: 100, funFact: "Only about 25% of people who start a thru-hike actually finish." },
];

// ============================================================================
// TERRAIN ZONES - Visual/gameplay changes
// ============================================================================

export type WaterReliability = 'abundant' | 'reliable' | 'moderate' | 'scarce' | 'carry_extra';

export interface TerrainZone {
  zoneId: string;               // Unique zone ID for multiplayer clustering
  startMile: number;
  endMile: number;
  type: string;
  name: string;
  description: string;
  difficulty: number;           // 1-5 scale
  treeType: string;
  groundType: string;
  avgElevation: number;
  adjacentZones: string[];      // IDs of neighboring zones (for P2P handoffs)

  // Gameplay modifiers (based on real AT difficulty)
  speedModifier: number;        // Multiplier: 1.0 = normal, 0.6 = very slow (rocks/alpine)
  energyModifier: number;       // Multiplier: 1.0 = normal, 1.8 = very tiring
  hazardNotes?: string;         // Warning text for dangerous terrain

  // Water sources
  waterReliability: WaterReliability;  // How reliable water sources are
  waterNotes?: string;                  // Specific water info for the zone

  // Cell service (for emergencies and town coordination)
  cellService: 'none' | 'spotty' | 'fair' | 'good';  // Typical cell coverage
  cellNotes?: string;                                  // Carrier-specific notes
}

export const TERRAIN_ZONES: TerrainZone[] = [
  // ============================================================================
  // GEORGIA (Zones 1-2) - Tough for green hikers, but manageable trail
  // ============================================================================
  { zoneId: 'zone_01_ga_south', startMile: 0, endMile: 30, type: 'ga_forest', name: 'Georgia Piedmont', description: 'Rolling hardwood forests, steep early climbs', difficulty: 3, treeType: 'hardwood_mixed', groundType: 'rocky_soil', avgElevation: 3500, adjacentZones: ['zone_02_ga_north'], speedModifier: 0.9, energyModifier: 1.3, hazardNotes: 'Steep climbs test green legs. Take your time.', waterReliability: 'reliable', waterNotes: 'Streams every 2-4 miles. Springs at shelters.', cellService: 'spotty', cellNotes: 'Verizon works at Springer summit. Patchy in valleys.' },
  { zoneId: 'zone_02_ga_north', startMile: 30, endMile: 78.5, type: 'ga_highlands', name: 'Georgia Highlands', description: 'Higher elevation, rhododendron tunnels', difficulty: 3, treeType: 'hardwood_rhodo', groundType: 'rocky', avgElevation: 3800, adjacentZones: ['zone_01_ga_south', 'zone_03_nc_nantahala'], speedModifier: 0.9, energyModifier: 1.2, waterReliability: 'reliable', waterNotes: 'Blood Mtn shelter has NO water - plan ahead!', cellService: 'spotty', cellNotes: 'Good at Neels Gap, patchy elsewhere.' },

  // ============================================================================
  // NORTH CAROLINA (Zones 3-4) - Building toward the Smokies
  // ============================================================================
  { zoneId: 'zone_03_nc_nantahala', startMile: 78.5, endMile: 137, type: 'nc_nantahala', name: 'Nantahala Range', description: 'Dense forests, river valleys', difficulty: 3, treeType: 'hardwood_mixed', groundType: 'dirt_roots', avgElevation: 4200, adjacentZones: ['zone_02_ga_north', 'zone_04_nc_approach'], speedModifier: 0.95, energyModifier: 1.1, waterReliability: 'abundant', waterNotes: 'Nantahala River valley has excellent water. Many streams.', cellService: 'fair', cellNotes: 'OK near NOC, spotty on ridges.' },
  { zoneId: 'zone_04_nc_approach', startMile: 137, endMile: 166, type: 'nc_approach', name: 'Smokies Approach', description: 'Building elevation toward the Smokies', difficulty: 3, treeType: 'hardwood_pine', groundType: 'rocky', avgElevation: 3000, adjacentZones: ['zone_03_nc_nantahala', 'zone_05_smokies'], speedModifier: 0.95, energyModifier: 1.15, waterReliability: 'reliable', waterNotes: 'Fill up at Fontana Dam. Good water sources throughout.', cellService: 'good', cellNotes: 'Fontana Dam has great service. Last good signal before Smokies.' },

  // ============================================================================
  // GREAT SMOKY MOUNTAINS (Zone 5) - High, foggy, demanding
  // ============================================================================
  { zoneId: 'zone_05_smokies', startMile: 166, endMile: 241, type: 'smokies', name: 'Great Smoky Mountains', description: 'Highest sustained elevations, spruce-fir forests, fog', difficulty: 4, treeType: 'spruce_fir', groundType: 'rocky_roots', avgElevation: 5200, adjacentZones: ['zone_04_nc_approach', 'zone_06_nc_tn_highlands'], speedModifier: 0.8, energyModifier: 1.4, hazardNotes: 'Shelter-to-shelter required. Bears active. Fog reduces visibility.', waterReliability: 'abundant', waterNotes: 'Smokies have excellent water. Springs at every shelter.', cellService: 'none', cellNotes: 'NO SERVICE in the Smokies. Plan ahead. Clingmans Dome may have weak signal.' },

  // ============================================================================
  // NC/TN HIGHLANDS (Zones 6-8) - Beautiful balds, some exposed sections
  // ============================================================================
  { zoneId: 'zone_06_nc_tn_highlands', startMile: 241, endMile: 330, type: 'nc_tn_highlands', name: 'NC/TN Highlands', description: 'Big balds, rhododendron, grassy summits', difficulty: 3, treeType: 'hardwood_rhodo', groundType: 'grassy', avgElevation: 4000, adjacentZones: ['zone_05_smokies', 'zone_07_roan'], speedModifier: 0.95, energyModifier: 1.1, waterReliability: 'reliable', waterNotes: 'Hot Springs has town water. Good streams in valleys.', cellService: 'spotty', cellNotes: 'Hot Springs has good service. Balds may get signal.' },
  { zoneId: 'zone_07_roan', startMile: 330, endMile: 395, type: 'roan_highlands', name: 'Roan Highlands', description: 'Alpine meadows, exposed balds, stunning views', difficulty: 4, treeType: 'open_bald', groundType: 'grassy_rock', avgElevation: 5500, adjacentZones: ['zone_06_nc_tn_highlands', 'zone_08_damascus'], speedModifier: 0.85, energyModifier: 1.3, hazardNotes: 'Exposed balds. Dangerous in lightning. Highest shelter on AT at Roan High Knob.', waterReliability: 'moderate', waterNotes: 'Exposed balds have limited water. Fill at shelters and road crossings.', cellService: 'spotty', cellNotes: 'Open balds may get signal. Valleys are dead zones.' },
  { zoneId: 'zone_08_damascus', startMile: 395, endMile: 469, type: 'tn_damascus', name: 'Approach to Damascus', description: 'Descending ridges, hardwood forests', difficulty: 2, treeType: 'hardwood_mixed', groundType: 'dirt', avgElevation: 3500, adjacentZones: ['zone_07_roan', 'zone_09_va_grayson'], speedModifier: 1.05, energyModifier: 0.95, waterReliability: 'abundant', waterNotes: 'Laurel Falls area has excellent water. Damascus has full services.', cellService: 'good', cellNotes: 'Damascus has full service. Trail approaching town improves.' },

  // ============================================================================
  // VIRGINIA - THE LONG STATE (Zones 9-14) - 550 miles of varied terrain
  // ============================================================================
  { zoneId: 'zone_09_va_grayson', startMile: 469, endMile: 530, type: 'va_grayson', name: 'Grayson Highlands', description: 'Wild ponies! Open meadows, rock outcrops', difficulty: 3, treeType: 'open_meadow', groundType: 'grassy_rock', avgElevation: 5000, adjacentZones: ['zone_08_damascus', 'zone_10_va_central'], speedModifier: 0.9, energyModifier: 1.15, hazardNotes: 'Exposed ridges. Wild ponies may approach - do not feed.', waterReliability: 'moderate', waterNotes: 'Open highlands mean longer carries. Springs at shelters.', cellService: 'fair', cellNotes: 'Mt. Rogers summit and ridges often have signal.' },
  { zoneId: 'zone_10_va_central', startMile: 530, endMile: 700, type: 'va_central', name: 'Central Virginia', description: 'Long ridgewalks, gentler grades', difficulty: 2, treeType: 'hardwood_oak', groundType: 'dirt_rock', avgElevation: 2800, adjacentZones: ['zone_09_va_grayson', 'zone_11_va_blue_ridge'], speedModifier: 1.05, energyModifier: 0.9, waterReliability: 'reliable', waterNotes: 'Partnership Shelter has shower! Regular streams throughout.', cellService: 'spotty', cellNotes: 'Patchy in valleys. Road crossings usually work.' },
  { zoneId: 'zone_11_va_blue_ridge', startMile: 700, endMile: 785, type: 'va_blue_ridge', name: 'Blue Ridge Parkway', description: 'Classic Appalachian ridges, McAfee Knob', difficulty: 3, treeType: 'hardwood_mixed', groundType: 'dirt', avgElevation: 3000, adjacentZones: ['zone_10_va_central', 'zone_12_va_priest'], speedModifier: 1.0, energyModifier: 1.0, waterReliability: 'reliable', waterNotes: 'Good springs near McAfee Knob area. Catawba has stores.', cellService: 'fair', cellNotes: 'McAfee Knob summit has great signal! Road crossings reliable.' },
  { zoneId: 'zone_12_va_priest', startMile: 785, endMile: 880, type: 'va_priest', name: 'The Priest & Three Ridges', description: 'Brutal 3,000ft climbs, quad-busters', difficulty: 4, treeType: 'hardwood_oak', groundType: 'rocky', avgElevation: 2500, adjacentZones: ['zone_11_va_blue_ridge', 'zone_13_shenandoah'], speedModifier: 0.8, energyModifier: 1.5, hazardNotes: 'The Priest: 3,000ft climb in 4 miles. Pack water!', waterReliability: 'scarce', waterNotes: 'LONG dry stretches on ridges. Carry 3L minimum for climbs!', cellService: 'spotty', cellNotes: 'Peaks may get signal. Deep valleys are dead.' },
  { zoneId: 'zone_13_shenandoah', startMile: 880, endMile: 1000, type: 'shenandoah', name: 'Shenandoah National Park', description: 'Gentle grades, waysides with food, deer everywhere', difficulty: 2, treeType: 'hardwood_oak', groundType: 'manicured', avgElevation: 3200, adjacentZones: ['zone_12_va_priest', 'zone_14_va_roller'], speedModifier: 1.15, energyModifier: 0.8, waterReliability: 'abundant', waterNotes: 'Waysides have water fountains! Springs at most shelters.', cellService: 'good', cellNotes: 'Waysides have great service. Skyline Drive crossings reliable.' },
  { zoneId: 'zone_14_va_roller', startMile: 1000, endMile: 1025, type: 'va_roller', name: 'Roller Coaster', description: 'Short steep PUDs (pointless ups and downs)', difficulty: 3, treeType: 'hardwood_mixed', groundType: 'rocky', avgElevation: 1200, adjacentZones: ['zone_13_shenandoah', 'zone_15_harpers'], speedModifier: 0.85, energyModifier: 1.25, hazardNotes: '13 steep hills in 13 miles. Mentally exhausting.', waterReliability: 'reliable', waterNotes: 'Bears Den hostel has water. Streams in valleys.', cellService: 'fair', cellNotes: 'Near DC suburbs - service improving as you go north.' },

  // ============================================================================
  // MID-ATLANTIC (Zones 15-17) - Harpers Ferry to NJ
  // ============================================================================
  { zoneId: 'zone_15_harpers', startMile: 1025, endMile: 1072, type: 'harpers_md', name: 'Harpers Ferry & Maryland', description: 'Historic sites, Civil War battlefields', difficulty: 2, treeType: 'hardwood_mixed', groundType: 'dirt_rock', avgElevation: 1200, adjacentZones: ['zone_14_va_roller', 'zone_16_pa_south'], speedModifier: 1.1, energyModifier: 0.85, waterReliability: 'reliable', waterNotes: 'Harpers Ferry has full services. Springs along C&O Canal.', cellService: 'good', cellNotes: 'Harpers Ferry has great service. DC suburbs nearby.' },
  { zoneId: 'zone_16_pa_south', startMile: 1072, endMile: 1180, type: 'pa_south', name: 'South Pennsylvania', description: 'Rocky but manageable, nice shelters', difficulty: 3, treeType: 'hardwood_oak', groundType: 'rocky', avgElevation: 1400, adjacentZones: ['zone_15_harpers', 'zone_17_pa_rocks'], speedModifier: 0.9, energyModifier: 1.1, waterReliability: 'reliable', waterNotes: 'Pine Grove Furnace has swimming! Good shelter springs.', cellService: 'fair', cellNotes: 'Patchy on ridges. Towns have good service.' },
  { zoneId: 'zone_17_pa_rocks', startMile: 1180, endMile: 1298, type: 'pa_rocks', name: 'Rocksylvania', description: 'ROCKS. Brutal ankle-breakers. Slowest miles on the AT.', difficulty: 5, treeType: 'hardwood_scrub', groundType: 'boulder_field', avgElevation: 1500, adjacentZones: ['zone_16_pa_south', 'zone_18_nj'], speedModifier: 0.65, energyModifier: 1.6, hazardNotes: 'Sharp, uneven rocks for 100+ miles. High ankle injury risk. Watch every step.', waterReliability: 'moderate', waterNotes: 'Long ridge walks can be dry. Port Clinton and Palmerton have water.', cellService: 'spotty', cellNotes: 'Ridge walking = spotty service. Towns reliable.' },

  // ============================================================================
  // NJ/NY (Zones 18-19) - Recovery from PA rocks
  // ============================================================================
  { zoneId: 'zone_18_nj', startMile: 1298, endMile: 1370, type: 'nj_ridges', name: 'New Jersey Highlands', description: 'Boardwalks, lakes, and swamps', difficulty: 2, treeType: 'hardwood_mixed', groundType: 'boardwalk_mud', avgElevation: 1200, adjacentZones: ['zone_17_pa_rocks', 'zone_19_ny'], speedModifier: 1.1, energyModifier: 0.85, hazardNotes: 'Boardwalks slippery when wet. Bears common near Sunfish Pond.', waterReliability: 'abundant', waterNotes: 'Lakes and ponds everywhere! Sunfish Pond is stunning.', cellService: 'fair', cellNotes: 'Suburban NJ - service generally available.' },
  { zoneId: 'zone_19_ny', startMile: 1370, endMile: 1462, type: 'ny_highlands', name: 'New York Highlands', description: 'Bear Mountain, frequent towns, zoo crossing', difficulty: 3, treeType: 'hardwood_mixed', groundType: 'rocky', avgElevation: 1100, adjacentZones: ['zone_18_nj', 'zone_20_ct'], speedModifier: 0.95, energyModifier: 1.05, waterReliability: 'abundant', waterNotes: 'Hudson River, lakes, and delis. Easy resupply.', cellService: 'good', cellNotes: 'Near NYC - excellent service. Bear Mountain has WiFi.' },

  // ============================================================================
  // NEW ENGLAND (Zones 20-23) - Building toward the Whites
  // ============================================================================
  { zoneId: 'zone_20_ct', startMile: 1462, endMile: 1518, type: 'ct_ridges', name: 'Connecticut', description: 'Rolling hills, stone walls, farmland', difficulty: 2, treeType: 'hardwood_birch', groundType: 'dirt_rock', avgElevation: 1200, adjacentZones: ['zone_19_ny', 'zone_21_ma'], speedModifier: 1.1, energyModifier: 0.85, waterReliability: 'reliable', waterNotes: 'Housatonic River valley. Towns have full services.', cellService: 'good', cellNotes: 'Suburban New England - reliable service.' },
  { zoneId: 'zone_21_ma', startMile: 1518, endMile: 1600, type: 'ma_berkshires', name: 'Massachusetts Berkshires', description: 'Mt. Greylock, cobblestone paths, historic inns', difficulty: 3, treeType: 'hardwood_birch', groundType: 'cobblestone', avgElevation: 2000, adjacentZones: ['zone_20_ct', 'zone_22_vt'], speedModifier: 0.95, energyModifier: 1.0, waterReliability: 'reliable', waterNotes: 'Upper Goose Pond Cabin has water. Bascom Lodge at Greylock.', cellService: 'fair', cellNotes: 'Greylock summit has signal. Valleys can be patchy.' },
  { zoneId: 'zone_22_vt', startMile: 1600, endMile: 1754, type: 'vt_green', name: 'Vermont Green Mountains', description: 'MUD! Roots! The Long Trail overlap', difficulty: 3, treeType: 'birch_spruce', groundType: 'mud_roots', avgElevation: 2500, adjacentZones: ['zone_21_ma', 'zone_23_nh_approach'], speedModifier: 0.8, energyModifier: 1.3, hazardNotes: 'Vermont is notorious for mud. Gaiters recommended. Slippery roots.', waterReliability: 'abundant', waterNotes: 'Vermont has water EVERYWHERE. Streams and springs constantly.', cellService: 'spotty', cellNotes: 'Green Mountains = limited service. Ski resorts have signal.' },
  { zoneId: 'zone_23_nh_approach', startMile: 1754, endMile: 1800, type: 'nh_approach', name: 'NH Approach', description: 'Building toward the Whites, trail getting steeper', difficulty: 3, treeType: 'hardwood_conifer', groundType: 'rocky', avgElevation: 2000, adjacentZones: ['zone_22_vt', 'zone_24_whites'], speedModifier: 0.9, energyModifier: 1.2, waterReliability: 'reliable', waterNotes: 'Hanover has full services. Good streams before the Whites.', cellService: 'good', cellNotes: 'Hanover (Dartmouth) has great service. Last reliable before Whites.' },

  // ============================================================================
  // WHITE MOUNTAINS (Zone 24) - THE HARDEST TERRAIN ON THE AT
  // ============================================================================
  { zoneId: 'zone_24_whites', startMile: 1800, endMile: 1912, type: 'whites', name: 'White Mountains', description: 'HARDEST terrain on AT. Above treeline. Alpine exposure. AMC Huts.', difficulty: 5, treeType: 'alpine_krummholz', groundType: 'granite_slabs', avgElevation: 4500, adjacentZones: ['zone_23_nh_approach', 'zone_25_mahoosuc'], speedModifier: 0.55, energyModifier: 2.0, hazardNotes: 'DANGER: Weather changes in minutes. Hypothermia risk even in summer. Carry full rain gear and extra food. 1 mile/hour is a realistic pace.', waterReliability: 'carry_extra', waterNotes: 'Above treeline has NO water. AMC Huts have water but cost $$$. Fill at every stream!', cellService: 'spotty', cellNotes: 'Mt. Washington summit has signal. Most of range is a dead zone. Pinkham Notch has WiFi.' },

  // ============================================================================
  // MAINE (Zones 25-28) - The wild, remote finish
  // ============================================================================
  { zoneId: 'zone_25_mahoosuc', startMile: 1912, endMile: 2000, type: 'me_mahoosuc', name: 'Mahoosuc Range', description: 'Mahoosuc Notch - THE hardest mile on the entire AT', difficulty: 5, treeType: 'spruce_fir', groundType: 'boulder_cave', avgElevation: 3000, adjacentZones: ['zone_24_whites', 'zone_26_me_lakes'], speedModifier: 0.5, energyModifier: 2.0, hazardNotes: 'Mahoosuc Notch: 1 mile takes 2-4 HOURS. Scrambling through boulder caves. Pack off required.', waterReliability: 'moderate', waterNotes: 'Streams in valleys only. Carry water for ridge sections.', cellService: 'none', cellNotes: 'Complete dead zone. No service until Andover.' },
  { zoneId: 'zone_26_me_lakes', startMile: 2000, endMile: 2093, type: 'me_lakes', name: 'Maine Lakes & Rivers', description: 'Lake country, river fords, remote wilderness', difficulty: 3, treeType: 'spruce_fir', groundType: 'roots_rocks', avgElevation: 2000, adjacentZones: ['zone_25_mahoosuc', 'zone_27_100mile'], speedModifier: 0.85, energyModifier: 1.2, hazardNotes: 'Ford crossings dangerous after rain. Consider wading sandals.', waterReliability: 'abundant', waterNotes: 'Lakes, rivers, streams everywhere. Pristine water but filter anyway.', cellService: 'spotty', cellNotes: 'Rangeley has service. Very limited on trail. Summits may work.' },
  { zoneId: 'zone_27_100mile', startMile: 2093, endMile: 2190, type: 'me_100mile', name: '100-Mile Wilderness', description: 'No resupply for 100 miles. True wilderness. Last big test.', difficulty: 4, treeType: 'spruce_fir', groundType: 'roots_rocks', avgElevation: 1500, adjacentZones: ['zone_26_me_lakes', 'zone_28_katahdin'], speedModifier: 0.8, energyModifier: 1.4, hazardNotes: 'Carry 7-10 days of food. Limited cell service. Self-rescue territory.', waterReliability: 'abundant', waterNotes: 'Streams and ponds constantly. White House Landing has resupply via boat.', cellService: 'none', cellNotes: 'ZERO service for 100 miles. Complete isolation. Plan your emergency contacts before entering.' },
  { zoneId: 'zone_28_katahdin', startMile: 2190, endMile: 2197.4, type: 'katahdin', name: 'Katahdin', description: 'The final climb. 4,000 ft in 5 miles. The northern terminus!', difficulty: 5, treeType: 'alpine_bare', groundType: 'granite', avgElevation: 3500, adjacentZones: ['zone_27_100mile'], speedModifier: 0.5, energyModifier: 2.2, hazardNotes: 'Hunt Trail is brutal - iron rungs, exposed scrambles. Summit closes in bad weather. This is it!', waterReliability: 'carry_extra', waterNotes: 'Fill at Katahdin Stream Campground. NO water above treeline!', cellService: 'spotty', cellNotes: 'Baxter Peak summit usually has signal! Call home from the top!' },
];

// ============================================================================
// TOWNS - Full service data from MASTER_NOBO_FIELD_GUIDE
// ============================================================================

export interface Town {
  mile: number;
  name: string;
  state: string;
  distance: string;
  services: string[];
  hasHostel: boolean;
  hasStore: boolean;
  hasRestaurant: boolean;
  hasOutfitter: boolean;
  hasLaundry: boolean;
  hasPO: boolean;
  notes?: string;
}

export const TOWNS: Town[] = [
  // ============================================================================
  // GEORGIA (Mile 0-78)
  // ============================================================================
  { mile: 0, name: 'Amicalola Falls SP', state: 'GA', distance: 'On Trail', services: ['lodge', 'restaurant'], hasHostel: true, hasStore: false, hasRestaurant: true, hasOutfitter: false, hasLaundry: false, hasPO: false, notes: 'Common NOBO start point' },
  { mile: 30.7, name: 'Neels Gap', state: 'GA', distance: 'On Trail', services: ['hostel', 'outfitter', 'shower', 'laundry'], hasHostel: true, hasStore: true, hasRestaurant: false, hasOutfitter: true, hasLaundry: true, hasPO: true, notes: 'Mountain Crossings - AT goes through building!' },
  { mile: 69, name: 'Hiawassee', state: 'GA', distance: '~11 mi', services: ['full town'], hasHostel: true, hasStore: true, hasRestaurant: true, hasOutfitter: false, hasLaundry: true, hasPO: true, notes: 'Hitch required' },

  // ============================================================================
  // NORTH CAROLINA / TENNESSEE (Mile 78-470)
  // ============================================================================
  { mile: 110, name: 'Franklin', state: 'NC', distance: '~10 mi', services: ['full town', 'urgent care'], hasHostel: true, hasStore: true, hasRestaurant: true, hasOutfitter: true, hasLaundry: true, hasPO: true, notes: 'Via Winding Stair Gap - good medical access' },
  { mile: 137, name: 'NOC', state: 'NC', distance: 'On Trail', services: ['hostel', 'outfitter', 'restaurant'], hasHostel: true, hasStore: true, hasRestaurant: true, hasOutfitter: true, hasLaundry: true, hasPO: true, notes: 'Nantahala Outdoor Center - rafting!' },
  { mile: 165, name: 'Fontana Dam', state: 'NC', distance: '~1.5 mi', services: ['resort', 'store'], hasHostel: true, hasStore: true, hasRestaurant: true, hasOutfitter: false, hasLaundry: true, hasPO: true, notes: 'Fontana Village resort, "Fontana Hilton" shelter' },
  { mile: 200, name: 'Gatlinburg', state: 'TN', distance: '~16 mi', services: ['full town'], hasHostel: true, hasStore: true, hasRestaurant: true, hasOutfitter: true, hasLaundry: true, hasPO: true, notes: 'Via Newfound Gap - major hitch required' },
  { mile: 241, name: 'Standing Bear Farm', state: 'NC', distance: '~0.2 mi', services: ['hostel', 'store'], hasHostel: true, hasStore: true, hasRestaurant: false, hasOutfitter: false, hasLaundry: true, hasPO: false, notes: 'Classic hiker hostel, trail history museum' },
  { mile: 274, name: 'Hot Springs', state: 'NC', distance: 'On Trail', services: ['hostels', 'DG', 'restaurants', 'laundry', 'PO'], hasHostel: true, hasStore: true, hasRestaurant: true, hasOutfitter: false, hasLaundry: true, hasPO: true, notes: 'Trail goes through downtown! Hot springs nearby' },
  { mile: 342, name: 'Erwin', state: 'TN', distance: '~0.5 mi', services: ['hostel', 'DG', 'restaurants'], hasHostel: true, hasStore: true, hasRestaurant: true, hasOutfitter: false, hasLaundry: true, hasPO: true, notes: "Uncle Johnny's Hostel, Johnson City medical nearby" },
  { mile: 365, name: 'Roan Mountain', state: 'TN', distance: '~5 mi', services: ['hostel', 'store'], hasHostel: true, hasStore: true, hasRestaurant: true, hasOutfitter: false, hasLaundry: true, hasPO: true, notes: 'Borderline walkable, most hitch' },
  { mile: 420, name: 'Hampton', state: 'TN', distance: '~1 mi', services: ['hostel', 'DG'], hasHostel: true, hasStore: true, hasRestaurant: false, hasOutfitter: false, hasLaundry: true, hasPO: true, notes: 'Walkable Dollar General' },

  // ============================================================================
  // VIRGINIA (Mile 470-1020) - The Long State
  // ============================================================================
  { mile: 469, name: 'Damascus', state: 'VA', distance: 'On Trail', services: ['hostels', 'outfitter', 'DG', 'restaurants', 'laundry', 'PO'], hasHostel: true, hasStore: true, hasRestaurant: true, hasOutfitter: true, hasLaundry: true, hasPO: true, notes: 'Trail Town USA! Trail Days festival, The Place hostel' },
  { mile: 508, name: 'Bland', state: 'VA', distance: '~0.5 mi', services: ['motel', 'store'], hasHostel: true, hasStore: true, hasRestaurant: true, hasOutfitter: false, hasLaundry: false, hasPO: false, notes: 'Big Walker Motel, quiet town' },
  { mile: 517, name: 'Bastian', state: 'VA', distance: '~0.5 mi', services: ['hostel'], hasHostel: true, hasStore: false, hasRestaurant: false, hasOutfitter: false, hasLaundry: false, hasPO: false, notes: 'Four Pines Hostel, very limited services' },
  { mile: 534, name: 'Partnership Shelter', state: 'VA', distance: 'On Trail', services: ['shelter'], hasHostel: false, hasStore: false, hasRestaurant: false, hasOutfitter: false, hasLaundry: false, hasPO: false, notes: 'Pizza delivery to shelter!' },
  { mile: 635, name: 'Pearisburg', state: 'VA', distance: '~0.8 mi', services: ['hostel', 'DG', 'restaurants'], hasHostel: true, hasStore: true, hasRestaurant: true, hasOutfitter: false, hasLaundry: true, hasPO: true, notes: 'Walkable DG, decent resupply' },
  { mile: 690, name: 'Catawba', state: 'VA', distance: '~1 mi', services: ['hostel', 'limited'], hasHostel: true, hasStore: false, hasRestaurant: true, hasOutfitter: false, hasLaundry: false, hasPO: false, notes: 'Four Pines Hostel, The Homeplace restaurant' },
  { mile: 729, name: 'Daleville', state: 'VA', distance: '~0.5 mi', services: ['hotels', 'DG', 'Kroger', 'restaurants'], hasHostel: false, hasStore: true, hasRestaurant: true, hasOutfitter: false, hasLaundry: true, hasPO: true, notes: 'Good resupply, right off I-81' },
  { mile: 783, name: 'Glasgow', state: 'VA', distance: '~3 mi', services: ['hostel', 'store', 'restaurants'], hasHostel: true, hasStore: true, hasRestaurant: true, hasOutfitter: false, hasLaundry: true, hasPO: true, notes: 'Borderline walkable, some hitch' },
  { mile: 880, name: 'Waynesboro', state: 'VA', distance: '~1-2 mi', services: ['motels', 'DG', 'grocery', 'restaurants', 'laundry', 'PO'], hasHostel: true, hasStore: true, hasRestaurant: true, hasOutfitter: false, hasLaundry: true, hasPO: true, notes: 'Major town, Shenandoah NP entrance' },
  // Shenandoah Waysides
  { mile: 894, name: 'Loft Mountain Wayside', state: 'VA', distance: 'On Trail', services: ['camp store', 'grill'], hasHostel: false, hasStore: true, hasRestaurant: true, hasOutfitter: false, hasLaundry: false, hasPO: false, notes: 'Seasonal, limited hours' },
  { mile: 931, name: 'Big Meadows', state: 'VA', distance: 'On Trail', services: ['camp store', 'restaurant'], hasHostel: false, hasStore: true, hasRestaurant: true, hasOutfitter: false, hasLaundry: false, hasPO: false, notes: 'Seasonal, popular Shenandoah stop' },
  { mile: 958, name: 'Skyland Resort', state: 'VA', distance: 'On Trail', services: ['lodge', 'restaurant'], hasHostel: true, hasStore: true, hasRestaurant: true, hasOutfitter: false, hasLaundry: false, hasPO: false, notes: 'Historic lodge in Shenandoah' },
  { mile: 999, name: 'Front Royal', state: 'VA', distance: '~1-3 mi', services: ['hostels', 'DG', 'grocery', 'restaurants'], hasHostel: true, hasStore: true, hasRestaurant: true, hasOutfitter: false, hasLaundry: true, hasPO: true, notes: 'Shenandoah north exit' },

  // ============================================================================
  // WEST VIRGINIA / MARYLAND (Mile 1020-1100)
  // ============================================================================
  { mile: 1024, name: 'Harpers Ferry', state: 'WV', distance: 'On Trail', services: ['hostel', 'store', 'restaurants'], hasHostel: true, hasStore: true, hasRestaurant: true, hasOutfitter: false, hasLaundry: false, hasPO: true, notes: 'ATC HQ! Psychological halfway point' },

  // ============================================================================
  // PENNSYLVANIA (Mile 1100-1300) - The Rocks
  // ============================================================================
  { mile: 1103, name: 'Pine Grove Furnace', state: 'PA', distance: 'On Trail', services: ['camp store'], hasHostel: false, hasStore: true, hasRestaurant: false, hasOutfitter: false, hasLaundry: false, hasPO: false, notes: 'Half Gallon Challenge! Actual halfway point' },
  { mile: 1136, name: 'Boiling Springs', state: 'PA', distance: 'On Trail', services: ['B&Bs', 'limited'], hasHostel: true, hasStore: false, hasRestaurant: true, hasOutfitter: false, hasLaundry: false, hasPO: false, notes: 'Beautiful town, ATC Mid-Atlantic, limited resupply' },
  { mile: 1149, name: 'Duncannon', state: 'PA', distance: '~0.5 mi', services: ['hotel', 'grocery', 'restaurants'], hasHostel: true, hasStore: true, hasRestaurant: true, hasOutfitter: false, hasLaundry: true, hasPO: true, notes: 'Doyle Hotel - "an experience", PA is hard on feet!' },
  { mile: 1217, name: 'Port Clinton', state: 'PA', distance: '~0.3 mi', services: ['hostel', 'convenience'], hasHostel: true, hasStore: true, hasRestaurant: true, hasOutfitter: false, hasLaundry: true, hasPO: true, notes: '2MP Hostel, pavilion camping' },
  { mile: 1278, name: 'Palmerton', state: 'PA', distance: '~1.5 mi', services: ['hostel', 'DG', 'grocery'], hasHostel: true, hasStore: true, hasRestaurant: true, hasOutfitter: false, hasLaundry: true, hasPO: true, notes: 'Jail hostel at church, walkable DG' },
  { mile: 1298, name: 'Delaware Water Gap', state: 'PA', distance: 'On Trail', services: ['hostels', 'convenience', 'restaurants', 'PO'], hasHostel: true, hasStore: true, hasRestaurant: true, hasOutfitter: false, hasLaundry: true, hasPO: true, notes: 'Church of the Mountain hostel, PA/NJ border' },

  // ============================================================================
  // NEW JERSEY / NEW YORK / CONNECTICUT (Mile 1300-1520)
  // ============================================================================
  { mile: 1342, name: 'Unionville', state: 'NY', distance: '~0.8 mi', services: ['hostel', 'general store'], hasHostel: true, hasStore: true, hasRestaurant: false, hasOutfitter: false, hasLaundry: false, hasPO: false, notes: "Horler's General Store hostel upstairs" },
  { mile: 1359, name: 'Greenwood Lake', state: 'NY', distance: '~1.5 mi', services: ['motels', 'grocery'], hasHostel: true, hasStore: true, hasRestaurant: true, hasOutfitter: false, hasLaundry: false, hasPO: true, notes: 'Borderline walkable' },
  { mile: 1410, name: 'Bear Mountain', state: 'NY', distance: '~0.5 mi', services: ['inn', 'limited'], hasHostel: true, hasStore: false, hasRestaurant: true, hasOutfitter: false, hasLaundry: false, hasPO: false, notes: 'Bear Mountain Inn (expensive), zoo, limited services' },
  { mile: 1469, name: 'Kent', state: 'CT', distance: '~1.5-2 mi', services: ['hostel', 'B&Bs', 'grocery'], hasHostel: true, hasStore: true, hasRestaurant: true, hasOutfitter: false, hasLaundry: true, hasPO: true, notes: 'Borderline walkable' },

  // ============================================================================
  // MASSACHUSETTS (Mile 1520-1630)
  // ============================================================================
  { mile: 1538, name: 'Great Barrington', state: 'MA', distance: '~1.5 mi', services: ['motels', 'DG', 'grocery'], hasHostel: true, hasStore: true, hasRestaurant: true, hasOutfitter: false, hasLaundry: true, hasPO: true, notes: 'Good town, walkable DG' },
  { mile: 1570, name: 'Dalton', state: 'MA', distance: 'On Trail', services: ['hostel', 'grocery', 'restaurants'], hasHostel: true, hasStore: true, hasRestaurant: true, hasOutfitter: false, hasLaundry: true, hasPO: true, notes: "Tom Levardi's legendary house (donation), trail through town" },
  { mile: 1590, name: 'North Adams', state: 'MA', distance: '~3 mi', services: ['full town'], hasHostel: true, hasStore: true, hasRestaurant: true, hasOutfitter: false, hasLaundry: true, hasPO: true, notes: 'Borderline walkable, most hitch' },

  // ============================================================================
  // VERMONT (Mile 1630-1790)
  // ============================================================================
  { mile: 1606, name: 'Bennington', state: 'VT', distance: '~5 mi', services: ['full town', 'hospital'], hasHostel: true, hasStore: true, hasRestaurant: true, hasOutfitter: true, hasLaundry: true, hasPO: true, notes: 'Hitch required, major medical access' },
  { mile: 1645, name: 'Manchester Center', state: 'VT', distance: '~5 mi', services: ['full town', 'outfitters'], hasHostel: true, hasStore: true, hasRestaurant: true, hasOutfitter: true, hasLaundry: true, hasPO: true, notes: 'Hitch required, great outfitters' },
  { mile: 1700, name: 'Killington', state: 'VT', distance: '~1-2 mi', services: ['inn', 'limited'], hasHostel: true, hasStore: false, hasRestaurant: true, hasOutfitter: false, hasLaundry: false, hasPO: false, notes: 'Inn at Long Trail on trail, town requires ride' },

  // ============================================================================
  // NEW HAMPSHIRE (Mile 1790-1912)
  // ============================================================================
  { mile: 1747, name: 'Hanover', state: 'NH', distance: 'On Trail', services: ['motels', 'co-op', 'restaurants', 'laundry', 'PO', 'hospital'], hasHostel: true, hasStore: true, hasRestaurant: true, hasOutfitter: false, hasLaundry: true, hasPO: true, notes: 'Dartmouth College town! Fix everything before Whites' },
  { mile: 1804, name: 'Glencliff', state: 'NH', distance: '~0.5 mi', services: ['hostel'], hasHostel: true, hasStore: false, hasRestaurant: true, hasOutfitter: false, hasLaundry: true, hasPO: false, notes: 'Hikers Welcome Hostel, very limited' },
  { mile: 1823, name: 'Lincoln/Woodstock', state: 'NH', distance: '~5-6 mi', services: ['full town', 'outfitter'], hasHostel: true, hasStore: true, hasRestaurant: true, hasOutfitter: true, hasLaundry: true, hasPO: true, notes: 'Last major resupply before Whites - hitch required' },
  { mile: 1832, name: 'Franconia Notch', state: 'NH', distance: 'On Trail', services: ['limited', 'seasonal'], hasHostel: false, hasStore: false, hasRestaurant: true, hasOutfitter: false, hasLaundry: false, hasPO: false, notes: 'Just parking area, no lodging' },
  { mile: 1869, name: 'Crawford Notch', state: 'NH', distance: 'On Trail', services: ['AMC lodge'], hasHostel: true, hasStore: true, hasRestaurant: true, hasOutfitter: false, hasLaundry: false, hasPO: false, notes: 'Highland Center Lodge (AMC, expensive)' },
  { mile: 1888, name: 'Pinkham Notch', state: 'NH', distance: 'On Trail', services: ['AMC lodge'], hasHostel: true, hasStore: true, hasRestaurant: true, hasOutfitter: false, hasLaundry: false, hasPO: false, notes: 'Joe Dodge Lodge (AMC base), very limited resupply' },
  { mile: 1898, name: 'Gorham', state: 'NH', distance: '~1.5 mi', services: ['hostels', 'DG', 'grocery', 'restaurants', 'laundry', 'PO'], hasHostel: true, hasStore: true, hasRestaurant: true, hasOutfitter: false, hasLaundry: true, hasPO: true, notes: "Major resupply after Whites, Hiker's Paradise hostel" },

  // ============================================================================
  // MAINE (Mile 1912-2197.4)
  // ============================================================================
  { mile: 1975, name: 'Andover', state: 'ME', distance: '~0.8 mi', services: ['hostel', 'grocery', 'restaurants'], hasHostel: true, hasStore: true, hasRestaurant: true, hasOutfitter: false, hasLaundry: true, hasPO: true, notes: 'Pine Ellis Hostel, small grocery' },
  { mile: 2001, name: 'Rangeley', state: 'ME', distance: '~9 mi', services: ['full town'], hasHostel: true, hasStore: true, hasRestaurant: true, hasOutfitter: true, hasLaundry: true, hasPO: true, notes: 'Hitch required, major resupply' },
  { mile: 2013, name: 'Caratunk', state: 'ME', distance: '~0.5 mi', services: ['hostel', 'limited'], hasHostel: true, hasStore: false, hasRestaurant: false, hasOutfitter: false, hasLaundry: false, hasPO: false, notes: 'Near Kennebec River Ferry crossing' },
  { mile: 2031, name: 'Stratton', state: 'ME', distance: '~5 mi', services: ['full town'], hasHostel: true, hasStore: true, hasRestaurant: true, hasOutfitter: false, hasLaundry: true, hasPO: true, notes: 'Hitch required, last major before 100-Mile Wilderness' },
  { mile: 2078, name: 'Monson', state: 'ME', distance: '~0.5 mi', services: ['hostels', 'grocery', 'restaurants', 'PO'], hasHostel: true, hasStore: true, hasRestaurant: true, hasOutfitter: false, hasLaundry: true, hasPO: true, notes: "LAST RESUPPLY! Shaw's offers 100-Mile food drops, gateway to wilderness" },
  { mile: 2133, name: "White House Landing", state: 'ME', distance: 'Boat Only', services: ['lodge', 'food'], hasHostel: true, hasStore: true, hasRestaurant: true, hasOutfitter: false, hasLaundry: false, hasPO: false, notes: 'Mid-100-Mile Wilderness option, boat taxi, famous burger' },
  { mile: 2190, name: 'Millinocket', state: 'ME', distance: '~15 mi', services: ['full town', 'hospital'], hasHostel: true, hasStore: true, hasRestaurant: true, hasOutfitter: true, hasLaundry: true, hasPO: true, notes: 'Shuttle required, celebration town, post-finish destination' },
];

// ============================================================================
// MAJOR PEAKS / LANDMARKS
// ============================================================================

export interface Peak {
  mile: number;
  name: string;
  elevation: number;
  state: string;
  netGain: number;
  difficulty: number; // 1-5
  notes?: string;
}

export const PEAKS: Peak[] = [
  { mile: 0, name: 'Springer Mountain', elevation: 3782, state: 'GA', netGain: 580, difficulty: 2, notes: 'Southern Terminus' },
  { mile: 28, name: 'Blood Mountain', elevation: 4458, state: 'GA', netGain: 1350, difficulty: 4, notes: 'Highest in Georgia' },
  { mile: 91, name: 'Standing Indian Mountain', elevation: 5499, state: 'NC', netGain: 2000, difficulty: 3 },
  { mile: 120, name: 'Wayah Bald', elevation: 5342, state: 'NC', netGain: 1540, difficulty: 3 },
  { mile: 152, name: 'Cheoah Bald', elevation: 5062, state: 'NC', netGain: 3300, difficulty: 4 },
  { mile: 209, name: 'Kuwohi (Clingmans Dome)', elevation: 6643, state: 'TN', netGain: 1640, difficulty: 3, notes: 'Highest point on AT!' },
  { mile: 378, name: 'Roan High Knob', elevation: 6285, state: 'TN', netGain: 2100, difficulty: 4, notes: 'Highest shelter on AT' },
  { mile: 500, name: 'Mt. Rogers Area', elevation: 5729, state: 'VA', netGain: 1700, difficulty: 3, notes: 'Wild ponies!' },
  { mile: 830, name: 'The Priest', elevation: 4063, state: 'VA', netGain: 3400, difficulty: 5, notes: 'One of hardest climbs on AT' },
  { mile: 840, name: 'Three Ridges', elevation: 3970, state: 'VA', netGain: 2470, difficulty: 4 },
  { mile: 710, name: 'McAfee Knob', elevation: 3171, state: 'VA', netGain: 1700, difficulty: 2, notes: 'Most photographed spot on AT' },
  { mile: 1590, name: 'Mt. Greylock', elevation: 3491, state: 'MA', netGain: 1700, difficulty: 3, notes: 'Highest in Massachusetts' },
  { mile: 1810, name: 'Mt. Moosilauke', elevation: 4802, state: 'NH', netGain: 2800, difficulty: 4, notes: 'First White Mountain peak' },
  { mile: 1833, name: 'Franconia Ridge', elevation: 5249, state: 'NH', netGain: 2250, difficulty: 5, notes: 'Exposed ridge walk!' },
  { mile: 1863, name: 'Mt. Washington', elevation: 6288, state: 'NH', netGain: 3900, difficulty: 5, notes: 'Worst weather in the world!' },
  { mile: 1925, name: 'Mahoosuc Notch', elevation: 2500, state: 'ME', netGain: 0, difficulty: 5, notes: 'Hardest mile on AT - boulder cave' },
  { mile: 2014, name: 'Bigelow Range', elevation: 4145, state: 'ME', netGain: 2800, difficulty: 4 },
  { mile: TRAIL_TOTAL_MILES, name: KATAHDIN.name, elevation: KATAHDIN.elevation, state: 'ME', netGain: 4000, difficulty: 5, notes: 'Northern Terminus! You did it!' },
];

// ============================================================================
// AMC HUTS - Appalachian Mountain Club's High Huts of the White Mountains
// These are staffed mountain lodges, NOT shelters. They offer bunks, meals,
// and water. Famous for "Work for Stay" (WFS) option for thru-hikers.
// ============================================================================

export interface AMCHut {
  mile: number;
  name: string;
  elevation: number;
  capacity: number;          // Number of bunks
  hasWater: boolean;         // Always true for huts
  hasMeals: boolean;         // Hot breakfast and dinner
  hasShowers: boolean;       // Most don't
  workForStay: boolean;      // WFS available for thru-hikers
  fullServiceCost: number;   // Approximate $ per night (2024 rates)
  workForStayCost: number;   // Usually reduced or free
  notes?: string;
  crooSize?: number;         // Number of staff ("croo")
}

export const AMC_HUTS: AMCHut[] = [
  // The 8 High Huts, ordered by NOBO mile marker
  // These form a chain through the White Mountains (Zone 24)

  { mile: 1820.4, name: 'Lonesome Lake Hut', elevation: 2760, capacity: 48, hasWater: true, hasMeals: true, hasShowers: false, workForStay: true, fullServiceCost: 175, workForStayCost: 0, crooSize: 5, notes: 'First AMC hut for NOBOs. On the shores of Lonesome Lake.' },

  { mile: 1837.3, name: 'Greenleaf Hut', elevation: 4200, capacity: 48, hasWater: true, hasMeals: true, hasShowers: false, workForStay: true, fullServiceCost: 175, workForStayCost: 0, crooSize: 5, notes: 'Perched below Mt. Lafayette with stunning views.' },

  { mile: 1848.5, name: 'Galehead Hut', elevation: 3780, capacity: 36, hasWater: true, hasMeals: true, hasShowers: false, workForStay: true, fullServiceCost: 175, workForStayCost: 0, crooSize: 4, notes: 'Most remote hut. All supplies packed in 4+ miles.' },

  { mile: 1851.8, name: 'Zealand Falls Hut', elevation: 2630, capacity: 36, hasWater: true, hasMeals: true, hasShowers: false, workForStay: true, fullServiceCost: 175, workForStayCost: 0, crooSize: 5, notes: 'Beautiful falls right at the hut. Self-service year-round.' },

  { mile: 1857.7, name: 'Mizpah Spring Hut', elevation: 3800, capacity: 60, hasWater: true, hasMeals: true, hasShowers: false, workForStay: true, fullServiceCost: 175, workForStayCost: 0, crooSize: 6, notes: 'Just below the Presidentials. Named for nearby spring.' },

  { mile: 1865.1, name: 'Lakes of the Clouds Hut', elevation: 5012, capacity: 90, hasWater: true, hasMeals: true, hasShowers: false, workForStay: true, fullServiceCost: 175, workForStayCost: 0, crooSize: 8, notes: 'Highest and largest hut. 1.5 miles from Mt. Washington summit. ICONIC!' },

  { mile: 1875.6, name: 'Madison Spring Hut', elevation: 4800, capacity: 52, hasWater: true, hasMeals: true, hasShowers: false, workForStay: true, fullServiceCost: 175, workForStayCost: 0, crooSize: 6, notes: 'Stone hut on exposed ridge. Views of Northern Presidentials.' },

  { mile: 1889.3, name: 'Carter Notch Hut', elevation: 3288, capacity: 40, hasWater: true, hasMeals: true, hasShowers: false, workForStay: true, fullServiceCost: 175, workForStayCost: 0, crooSize: 4, notes: 'Stone bunkhouses. Carter Lakes nearby. Self-service in winter.' },
];

// Helper function for AMC huts
export function getNearestAMCHut(mile: number): AMCHut | undefined {
  return binarySearchNearest(AMC_HUTS, mile, 'mile');
}

export function getAMCHutsInRange(startMile: number, endMile: number): AMCHut[] {
  return AMC_HUTS.filter(h => h.mile >= startMile && h.mile <= endMile);
}

// ============================================================================
// LANDMARKS - Famous viewpoints, waterfalls, historic sites, and trail features
// ============================================================================

export type LandmarkType =
  | 'viewpoint'      // Scenic overlooks
  | 'waterfall'      // Falls and cascades
  | 'water_feature'  // Rivers, lakes, gaps with water
  | 'historic'       // Historic sites, monuments
  | 'trail_feature'  // Notable trail characteristics
  | 'wildlife'       // Known wildlife areas
  | 'junction'       // Trail intersections
  | 'infrastructure' // Dams, bridges, roads
  | 'bald';          // Open balds and meadows

export interface Landmark {
  mile: number;
  name: string;
  type: LandmarkType;
  state: string;
  description: string;
  photoWorthy?: boolean;    // True for iconic photo spots
  notes?: string;
}

export const LANDMARKS: Landmark[] = [
  // ============================================================================
  // GEORGIA (0-78)
  // ============================================================================
  { mile: 0, name: 'Springer Mountain Summit', type: 'historic', state: 'GA', description: 'The southern terminus. Touch the bronze plaque!', photoWorthy: true, notes: 'Register at the plaque. Your journey begins.' },
  { mile: 2.5, name: 'Long Creek Falls', type: 'waterfall', state: 'GA', description: '50ft cascade - first waterfall on the trail' },
  { mile: 16.5, name: 'Woody Gap', type: 'trail_feature', state: 'GA', description: 'First road crossing. Trail magic common here.' },
  { mile: 28.8, name: 'Blood Mountain Summit', type: 'viewpoint', state: 'GA', description: '360° views from highest point in Georgia', photoWorthy: true },
  { mile: 58.6, name: 'Tray Mountain Summit', type: 'viewpoint', state: 'GA', description: 'Stunning views of North Georgia mountains', photoWorthy: true },
  { mile: 69.5, name: 'Dick Creek Gap', type: 'water_feature', state: 'GA', description: 'Creek crossing with good water source' },
  { mile: 75.6, name: 'Bly Gap', type: 'junction', state: 'GA', description: 'Entering North Carolina soon!' },

  // ============================================================================
  // NORTH CAROLINA / TENNESSEE (78-470)
  // ============================================================================
  { mile: 83.3, name: 'Muskrat Creek Shelter Area', type: 'viewpoint', state: 'NC', description: 'Views into Georgia you just left behind' },
  { mile: 97.1, name: 'Albert Mountain Fire Tower', type: 'viewpoint', state: 'NC', description: 'Climb the tower for 360° views', photoWorthy: true, notes: 'Steep rock scramble to reach tower' },
  { mile: 110, name: 'Winding Stair Gap', type: 'infrastructure', state: 'NC', description: 'Road to Franklin - first major resupply option' },
  { mile: 136, name: 'Wesser Bald Fire Tower', type: 'viewpoint', state: 'NC', description: 'Views over Nantahala Gorge', photoWorthy: true },
  { mile: 137.2, name: 'NOC (Nantahala Outdoor Center)', type: 'infrastructure', state: 'NC', description: 'On-trail outfitter, restaurant, river outfitter', notes: 'Major resupply right on trail!' },
  { mile: 152.4, name: 'Cheoah Bald', type: 'bald', state: 'NC', description: 'Grassy summit with panoramic views', photoWorthy: true },
  { mile: 165.7, name: 'Fontana Dam', type: 'infrastructure', state: 'NC', description: 'Tallest dam in Eastern US (480ft)', photoWorthy: true, notes: 'The "Fontana Hilton" shelter has showers!' },
  { mile: 177, name: 'Shuckstack Fire Tower', type: 'viewpoint', state: 'TN', description: 'Views over Fontana Lake and Smokies', photoWorthy: true },
  { mile: 184.5, name: 'Rocky Top', type: 'viewpoint', state: 'TN', description: 'THE Rocky Top from the song!', photoWorthy: true, notes: 'Tennessee state song was written about this spot' },
  { mile: 190, name: 'Thunderhead Mountain', type: 'viewpoint', state: 'TN', description: 'Massive grassy bald at 5,527ft' },
  { mile: 209, name: 'Kuwohi (Clingmans Dome)', type: 'viewpoint', state: 'TN', description: 'Highest point on entire AT - 6,643ft', photoWorthy: true, notes: 'Observation tower. Crowded with tourists.' },
  { mile: 211, name: 'Charlies Bunion', type: 'viewpoint', state: 'NC', description: 'Iconic rocky outcrop with stunning views', photoWorthy: true, notes: 'Named for Charlie Conner\'s bunion-like rock' },
  { mile: 224.5, name: 'The Sawteeth', type: 'trail_feature', state: 'NC', description: 'Brutal series of steep climbs and descents' },
  { mile: 241, name: 'Davenport Gap', type: 'infrastructure', state: 'TN', description: 'Exit from Great Smoky Mountains NP' },
  { mile: 252.5, name: 'Max Patch', type: 'bald', state: 'NC', description: 'Famous grassy bald with 360° views', photoWorthy: true, notes: 'Best sunset spot on southern AT. Popular camping.' },
  { mile: 273.9, name: 'Hot Springs, NC', type: 'infrastructure', state: 'NC', description: 'Trail runs through town center!', notes: 'Only town AT runs directly through' },
  { mile: 305.4, name: 'Big Bald', type: 'bald', state: 'NC', description: 'Massive grassy summit', photoWorthy: true },
  { mile: 332.7, name: 'Carvers Gap', type: 'junction', state: 'TN', description: 'Start of Roan Highlands - best balds on AT' },
  { mile: 343, name: 'Grassy Ridge Bald', type: 'bald', state: 'NC', description: 'Longest bald on AT - pure alpine meadow', photoWorthy: true },
  { mile: 355.2, name: 'Hump Mountain', type: 'bald', state: 'NC', description: 'Exposed summit, wild weather possible', photoWorthy: true },
  { mile: 386.4, name: 'Overmountain Shelter', type: 'historic', state: 'NC', description: 'Historic red barn - largest shelter on AT', photoWorthy: true, notes: 'Holds 20+ people. Famous landmark.' },
  { mile: 410.9, name: 'Laurel Falls', type: 'waterfall', state: 'TN', description: '50ft cascade along Laurel Fork', photoWorthy: true },
  { mile: 424.1, name: 'Watauga Lake', type: 'water_feature', state: 'TN', description: 'Gorgeous blue lake views' },
  { mile: 467.7, name: 'Damascus, VA', type: 'historic', state: 'VA', description: 'Trail Days festival town!', notes: 'The friendliest town on the AT' },

  // ============================================================================
  // VIRGINIA (469-1025)
  // ============================================================================
  { mile: 485.5, name: 'Whitetop Mountain', type: 'viewpoint', state: 'VA', description: 'Second highest peak in Virginia' },
  { mile: 500.5, name: 'Grayson Highlands', type: 'wildlife', state: 'VA', description: 'Wild ponies roam free!', photoWorthy: true, notes: 'Ponies are friendly but don\'t feed them' },
  { mile: 502.4, name: 'Wilburn Ridge', type: 'viewpoint', state: 'VA', description: 'Dramatic rocky ridge with ponies', photoWorthy: true },
  { mile: 533.9, name: 'Partnership Shelter', type: 'trail_feature', state: 'VA', description: 'Only shelter you can order pizza to!', notes: 'Call ahead to the visitor center' },
  { mile: 550.3, name: 'Crawfish Valley', type: 'water_feature', state: 'VA', description: 'Stream crossing in beautiful valley' },
  { mile: 570.1, name: 'Chestnut Knob', type: 'viewpoint', state: 'VA', description: 'Stone cabin shelter with incredible views', photoWorthy: true },
  { mile: 617, name: 'Dismal Falls', type: 'waterfall', state: 'VA', description: 'Beautiful waterfall near trail', photoWorthy: true },
  { mile: 643.6, name: 'Angel\'s Rest', type: 'viewpoint', state: 'VA', description: 'Stunning views over Pearisburg' },
  { mile: 663.4, name: 'Wind Rock', type: 'viewpoint', state: 'VA', description: 'Rocky outcrop with great views' },
  { mile: 702.5, name: 'Dragon\'s Tooth', type: 'viewpoint', state: 'VA', description: 'Iconic rock spire you can climb', photoWorthy: true, notes: 'Scramble to the top for photos' },
  { mile: 710.6, name: 'McAfee Knob', type: 'viewpoint', state: 'VA', description: 'MOST photographed spot on AT!', photoWorthy: true, notes: 'Iconic overhang. Classic AT bucket list.' },
  { mile: 714.7, name: 'Tinker Cliffs', type: 'viewpoint', state: 'VA', description: 'Half-mile cliff walk with views', photoWorthy: true },
  { mile: 762.6, name: 'Bryant Ridge Shelter', type: 'trail_feature', state: 'VA', description: 'Massive 2-story shelter', notes: 'Largest shelter on AT!' },
  { mile: 786.4, name: 'James River Foot Bridge', type: 'infrastructure', state: 'VA', description: 'Longest footbridge on AT (625ft)', photoWorthy: true },
  { mile: 830, name: 'The Priest Summit', type: 'viewpoint', state: 'VA', description: 'After brutal climb, amazing views', photoWorthy: true, notes: 'One of the "4 Apostles" - brutal climbs' },
  { mile: 855.4, name: 'Spy Rock', type: 'viewpoint', state: 'VA', description: 'Rocky outcrop, Civil War lookout', photoWorthy: true },
  { mile: 880.6, name: 'Rockfish Gap', type: 'junction', state: 'VA', description: 'Entrance to Shenandoah National Park' },
  { mile: 896, name: 'Blackrock Summit', type: 'viewpoint', state: 'VA', description: 'Boulder field with views', photoWorthy: true },
  { mile: 926.8, name: 'Big Meadows', type: 'infrastructure', state: 'VA', description: 'Wayside with restaurant and camping', notes: 'Famous for deer sightings' },
  { mile: 942.7, name: 'Stony Man Summit', type: 'viewpoint', state: 'VA', description: 'Views over Shenandoah Valley', photoWorthy: true },
  { mile: 958, name: 'Mary\'s Rock', type: 'viewpoint', state: 'VA', description: 'Popular viewpoint with scramble', photoWorthy: true },
  { mile: 999.2, name: 'Shenandoah NP Northern Boundary', type: 'infrastructure', state: 'VA', description: 'Leaving the park!' },
  { mile: 1011.5, name: 'Bears Den Hostel', type: 'historic', state: 'VA', description: 'Castle-like stone hostel', notes: 'Great views, historic building' },
  { mile: 1022.4, name: 'Harpers Ferry', type: 'historic', state: 'WV', description: 'ATC Headquarters! Psychological halfway', photoWorthy: true, notes: 'Get your photo taken, sign the register' },

  // ============================================================================
  // MID-ATLANTIC (1025-1298)
  // ============================================================================
  { mile: 1025.6, name: 'Harpers Ferry Overlook', type: 'viewpoint', state: 'WV', description: 'Views over confluence of rivers', photoWorthy: true },
  { mile: 1030.7, name: 'Weverton Cliffs', type: 'viewpoint', state: 'MD', description: 'Views over Potomac River', photoWorthy: true },
  { mile: 1038.4, name: 'Gathland State Park', type: 'historic', state: 'MD', description: 'Civil War Correspondents Memorial' },
  { mile: 1051.7, name: 'Washington Monument (MD)', type: 'historic', state: 'MD', description: 'First monument to George Washington', photoWorthy: true, notes: 'Stone tower you can climb' },
  { mile: 1057.8, name: 'Annapolis Rock', type: 'viewpoint', state: 'MD', description: 'Popular camping spot with views', photoWorthy: true },
  { mile: 1067.5, name: 'Pen Mar Park', type: 'infrastructure', state: 'MD', description: 'PA/MD border - historic park' },
  { mile: 1078.3, name: 'Caledonia State Park', type: 'infrastructure', state: 'PA', description: 'Blacksmith museum, swimming pool' },
  { mile: 1128.8, name: 'Pine Grove Furnace SP', type: 'historic', state: 'PA', description: 'Official AT midpoint! Half gallon challenge!', photoWorthy: true, notes: 'Eat half gallon of ice cream to celebrate' },
  { mile: 1155.8, name: 'Duncannon', type: 'infrastructure', state: 'PA', description: 'Trail runs through town on streets' },
  { mile: 1217.2, name: 'Port Clinton', type: 'infrastructure', state: 'PA', description: 'Trail runs along Schuylkill River' },
  { mile: 1229.3, name: 'Pinnacle', type: 'viewpoint', state: 'PA', description: 'Best views in Pennsylvania', photoWorthy: true },
  { mile: 1247.4, name: 'Knife Edge', type: 'trail_feature', state: 'PA', description: 'Rocky ridge walk' },
  { mile: 1268.7, name: 'Lehigh Gap', type: 'infrastructure', state: 'PA', description: 'Steep zinc mine superfund site', notes: 'Revegetation project visible' },
  { mile: 1295.6, name: 'Delaware Water Gap', type: 'viewpoint', state: 'PA', description: 'Dramatic gap through mountains', photoWorthy: true, notes: 'Crossing into NJ!' },

  // ============================================================================
  // NJ/NY/CT (1298-1518)
  // ============================================================================
  { mile: 1306.6, name: 'Sunfish Pond', type: 'water_feature', state: 'NJ', description: 'Glacial lake at 1,379ft', photoWorthy: true },
  { mile: 1336.3, name: 'High Point State Park', type: 'viewpoint', state: 'NJ', description: 'Highest point in NJ - 1,803ft', photoWorthy: true, notes: 'Monument visible from trail' },
  { mile: 1359.9, name: 'Stairway to Heaven', type: 'viewpoint', state: 'NJ', description: 'Boardwalk through wetlands to viewpoint', photoWorthy: true },
  { mile: 1373.1, name: 'Fitzgerald Falls', type: 'waterfall', state: 'NY', description: '25ft cascade' },
  { mile: 1385.7, name: 'Bear Mountain Bridge', type: 'infrastructure', state: 'NY', description: 'Cross the Hudson River!', photoWorthy: true, notes: 'Lowest elevation on AT (124ft)' },
  { mile: 1387.1, name: 'Bear Mountain Zoo', type: 'wildlife', state: 'NY', description: 'AT runs through the zoo!', notes: 'Free admission for thru-hikers' },
  { mile: 1392.6, name: 'Bear Mountain Summit', type: 'viewpoint', state: 'NY', description: 'Perkins Memorial Tower views', photoWorthy: true },
  { mile: 1402.8, name: 'Harriman State Park', type: 'trail_feature', state: 'NY', description: 'Lakes and woods near NYC' },
  { mile: 1423.9, name: 'Nuclear Lake', type: 'water_feature', state: 'NY', description: 'Former nuclear research site, now pristine' },
  { mile: 1455.7, name: 'Dover Oak', type: 'trail_feature', state: 'NY', description: 'Largest oak tree on AT', photoWorthy: true },
  { mile: 1463.3, name: 'Bulls Bridge', type: 'infrastructure', state: 'CT', description: 'Historic covered bridge over Housatonic', photoWorthy: true },
  { mile: 1476.5, name: 'St. Johns Ledges', type: 'viewpoint', state: 'CT', description: 'Cliffs over Housatonic River' },
  { mile: 1495.4, name: 'Lions Head', type: 'viewpoint', state: 'CT', description: 'Cliff overlook' },
  { mile: 1503.4, name: 'Sages Ravine', type: 'water_feature', state: 'CT', description: 'Beautiful cascading brook', photoWorthy: true },
  { mile: 1511.4, name: 'Bear Mountain (CT)', type: 'viewpoint', state: 'CT', description: 'Highest peak in CT', photoWorthy: true },
  { mile: 1517.6, name: 'Riga Lean-to Area', type: 'water_feature', state: 'MA', description: 'Beautiful pond setting' },

  // ============================================================================
  // MASSACHUSETTS / VERMONT (1518-1754)
  // ============================================================================
  { mile: 1534.7, name: 'Upper Goose Pond Cabin', type: 'trail_feature', state: 'MA', description: 'Cabin on pond with caretaker, pancakes!', notes: 'Famous for legendary hospitality' },
  { mile: 1568.4, name: 'October Mountain', type: 'trail_feature', state: 'MA', description: 'Largest state forest in MA' },
  { mile: 1586.3, name: 'Bascom Lodge', type: 'infrastructure', state: 'MA', description: 'Lodge at Mt. Greylock summit', notes: 'Meals and bunks available' },
  { mile: 1590, name: 'Mt. Greylock Summit', type: 'viewpoint', state: 'MA', description: 'Highest point in Massachusetts', photoWorthy: true },
  { mile: 1603.2, name: 'Seth Warner Shelter', type: 'junction', state: 'VT', description: 'Long Trail and AT join here' },
  { mile: 1638.2, name: 'Stratton Mountain', type: 'viewpoint', state: 'VT', description: 'Where Benton MacKaye conceived the AT', photoWorthy: true, notes: 'Fire tower. Birthplace of the AT!' },
  { mile: 1658.8, name: 'Bromley Mountain', type: 'viewpoint', state: 'VT', description: 'Ski mountain with observation deck', photoWorthy: true },
  { mile: 1710.7, name: 'Killington Peak', type: 'viewpoint', state: 'VT', description: 'Second highest peak in Vermont', photoWorthy: true, notes: 'Side trail to summit' },
  { mile: 1717.7, name: 'Maine Junction', type: 'junction', state: 'VT', description: 'Long Trail continues north, AT turns east', notes: 'Last overlap with Long Trail' },
  { mile: 1746.5, name: 'Hanover, NH', type: 'infrastructure', state: 'NH', description: 'Dartmouth College town', notes: 'Great town, food carts, gear shops' },

  // ============================================================================
  // WHITE MOUNTAINS (1754-1912)
  // ============================================================================
  { mile: 1754.3, name: 'Moose Mountain', type: 'viewpoint', state: 'NH', description: 'Views before the Whites' },
  { mile: 1771.7, name: 'Smarts Mountain', type: 'viewpoint', state: 'NH', description: 'Fire tower with cabin' },
  { mile: 1803, name: 'Mt. Cube', type: 'viewpoint', state: 'NH', description: 'Last peak before Moosilauke' },
  { mile: 1809.5, name: 'Mt. Moosilauke Summit', type: 'viewpoint', state: 'NH', description: 'First true White Mountain peak!', photoWorthy: true, notes: 'You\'re in the Whites now. Pace yourself.' },
  { mile: 1823.2, name: 'Kinsman Ridge', type: 'trail_feature', state: 'NH', description: 'Rough, rocky ridge' },
  { mile: 1831.6, name: 'Franconia Notch', type: 'infrastructure', state: 'NH', description: 'Flume Gorge, tramway nearby' },
  { mile: 1833, name: 'Franconia Ridge', type: 'viewpoint', state: 'NH', description: 'Exposed 2-mile ridgewalk above treeline', photoWorthy: true, notes: 'Most spectacular ridgewalk on AT. DANGEROUS in bad weather.' },
  { mile: 1836, name: 'Mt. Lincoln', type: 'viewpoint', state: 'NH', description: 'Part of Franconia Ridge traverse', photoWorthy: true },
  { mile: 1838.7, name: 'Mt. Lafayette', type: 'viewpoint', state: 'NH', description: 'Highest peak in Franconia Range', photoWorthy: true },
  { mile: 1848.5, name: 'Galehead Hut', type: 'infrastructure', state: 'NH', description: 'First AMC hut for NOBOs' },
  { mile: 1851.8, name: 'Zealand Falls Hut', type: 'infrastructure', state: 'NH', description: 'AMC hut near beautiful falls' },
  { mile: 1857.7, name: 'Crawford Notch', type: 'infrastructure', state: 'NH', description: 'Historic notch, AMC visitor center' },
  { mile: 1863, name: 'Mt. Washington Summit', type: 'viewpoint', state: 'NH', description: 'Highest peak in Northeast! 6,288ft', photoWorthy: true, notes: 'Cog railway, observatory. Worst weather in world recorded here.' },
  { mile: 1865.1, name: 'Lakes of the Clouds Hut', type: 'infrastructure', state: 'NH', description: 'Highest AMC hut. Iconic.', photoWorthy: true },
  { mile: 1872.6, name: 'Mizpah Spring Hut', type: 'infrastructure', state: 'NH', description: 'AMC hut in alpine zone' },
  { mile: 1878.4, name: 'Mt. Pierce (Clinton)', type: 'viewpoint', state: 'NH', description: 'Views back to Presidentials' },
  { mile: 1889.3, name: 'Carter Notch Hut', type: 'infrastructure', state: 'NH', description: 'Stone hut in dramatic notch' },
  { mile: 1896.7, name: 'Pinkham Notch', type: 'infrastructure', state: 'NH', description: 'AMC visitor center, hostel, cafeteria' },
  { mile: 1902.4, name: 'Wildcat Mountain', type: 'viewpoint', state: 'NH', description: 'Ski resort, views of Presidentials', photoWorthy: true },
  { mile: 1909.3, name: 'Carter Dome', type: 'viewpoint', state: 'NH', description: 'Last big peak in Whites', photoWorthy: true },

  // ============================================================================
  // MAINE (1912-2197.4)
  // ============================================================================
  { mile: 1925.4, name: 'Mahoosuc Notch', type: 'trail_feature', state: 'ME', description: 'THE hardest mile on AT - boulder cave scramble', photoWorthy: true, notes: '1 mile takes 2-4 hours. Ice in caves year-round.' },
  { mile: 1928.8, name: 'Mahoosuc Arm', type: 'trail_feature', state: 'ME', description: 'Steepest mile on AT', notes: '1,500ft in 0.8 miles. Hand-over-hand.' },
  { mile: 1935.7, name: 'Goose Eye Mountain', type: 'viewpoint', state: 'ME', description: 'Rocky summit with views' },
  { mile: 1942.1, name: 'Carlo Col Shelter', type: 'viewpoint', state: 'ME', description: 'Views at ME/NH border' },
  { mile: 1953.7, name: 'Baldpate Mountain', type: 'viewpoint', state: 'ME', description: 'Open ledges with views', photoWorthy: true },
  { mile: 1974.4, name: 'Old Speck Mountain', type: 'viewpoint', state: 'ME', description: 'Observation tower at summit' },
  { mile: 1983.2, name: 'Grafton Notch', type: 'infrastructure', state: 'ME', description: 'Last easy road access for 30 miles' },
  { mile: 1994.6, name: 'Bemis Stream Trail', type: 'water_feature', state: 'ME', description: 'Beautiful stream crossing' },
  { mile: 2003.4, name: 'Bemis Mountain Lean-to', type: 'viewpoint', state: 'ME', description: 'Views over Mooselookmeguntic Lake' },
  { mile: 2014.4, name: 'Saddleback Mountain', type: 'viewpoint', state: 'ME', description: 'Alpine zone, ski area', photoWorthy: true },
  { mile: 2028.7, name: 'The Horn', type: 'viewpoint', state: 'ME', description: 'Rocky summit traverse' },
  { mile: 2034.2, name: 'Sugarloaf Mountain', type: 'viewpoint', state: 'ME', description: 'Major ski resort nearby' },
  { mile: 2048.8, name: 'Crocker Mountain', type: 'viewpoint', state: 'ME', description: 'Views, then descent to Carrabassett Valley' },
  { mile: 2058.8, name: 'Bigelow Mountain', type: 'viewpoint', state: 'ME', description: 'Spectacular ridge walk', photoWorthy: true },
  { mile: 2073.2, name: 'Flagstaff Lake', type: 'water_feature', state: 'ME', description: 'Views over massive lake' },
  { mile: 2093, name: '100-Mile Wilderness Sign', type: 'historic', state: 'ME', description: 'Last resupply for 100 miles!', photoWorthy: true, notes: 'The final challenge begins.' },
  { mile: 2100.5, name: 'Gulf Hagas', type: 'water_feature', state: 'ME', description: 'Side trail to "Grand Canyon of Maine"', notes: 'Worth the detour!' },
  { mile: 2111.8, name: 'White Cap Mountain', type: 'viewpoint', state: 'ME', description: 'First views of Katahdin!', photoWorthy: true, notes: 'You can see the end!' },
  { mile: 2143.6, name: 'Rainbow Ledges', type: 'viewpoint', state: 'ME', description: 'Views of Rainbow Lake' },
  { mile: 2160.4, name: 'Abol Bridge', type: 'infrastructure', state: 'ME', description: 'Last store before Katahdin! Famous Katahdin view.', photoWorthy: true },
  { mile: 2170.4, name: 'Baxter State Park Boundary', type: 'historic', state: 'ME', description: 'Entering BSP - final 27 miles', notes: 'Register at Katahdin Stream Campground' },
  { mile: 2188.2, name: 'Katahdin Stream Falls', type: 'waterfall', state: 'ME', description: 'Falls near final campground' },
  { mile: 2190.4, name: 'The Hunt Trail', type: 'trail_feature', state: 'ME', description: 'Final climb begins - 5 miles, 4,000ft', notes: 'Iron rungs, exposed scrambles ahead' },
  { mile: 2194.5, name: 'The Tableland', type: 'trail_feature', state: 'ME', description: 'Above treeline plateau on Katahdin', photoWorthy: true },
  { mile: TRAIL_TOTAL_MILES, name: 'Baxter Peak - Katahdin', type: 'historic', state: 'ME', description: 'THE END. The Northern Terminus. You made it!', photoWorthy: true, notes: 'Touch the sign. Cry. Take photos. You did it!' },
];

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Binary search to find the item in a sorted array closest to the target value.
 * Assumes the array is sorted by the given key in ascending order.
 * O(log N) complexity.
 */
function binarySearchNearest<T>(array: T[], target: number, key: keyof T): T | undefined {
  if (array.length === 0) return undefined;
  if (array.length === 1) return array[0];

  let low = 0;
  let high = array.length - 1;

  // Binary search to find the insertion point or exact match
  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    const midVal = array[mid][key] as unknown as number;

    if (midVal === target) {
      return array[mid];
    } else if (midVal < target) {
      low = mid + 1;
    } else {
      high = mid - 1;
    }
  }

  // low is the insertion point. Check neighbors (high and low)
  // high might be -1, low might be array.length

  const idx1 = Math.max(0, high); // element before target (or 0)
  const idx2 = Math.min(array.length - 1, low); // element after target (or last)

  const val1 = array[idx1][key] as unknown as number;
  const val2 = array[idx2][key] as unknown as number;

  if (Math.abs(target - val1) <= Math.abs(target - val2)) {
    return array[idx1];
  } else {
    return array[idx2];
  }
}

export function getShelterByMile(mile: number): Shelter | undefined {
  const shelter = binarySearchNearest(SHELTERS, mile, 'mile');
  return shelter && Math.abs(shelter.mile - mile) < 0.5 ? shelter : undefined;
}

export function getLandmarksInRange(startMile: number, endMile: number): Landmark[] {
  return LANDMARKS.filter(l => l.mile >= startMile && l.mile <= endMile);
}

export function getNearestLandmark(mile: number): Landmark | undefined {
  return binarySearchNearest(LANDMARKS, mile, 'mile');
}

export function getNextShelter(mile: number): Shelter | undefined {
  return SHELTERS.find(s => s.mile > mile);
}

export function getSheltersInRange(startMile: number, endMile: number): Shelter[] {
  return SHELTERS.filter(s => s.mile >= startMile && s.mile <= endMile);
}

export function getTerrainZone(mile: number): TerrainZone | undefined {
  return TERRAIN_ZONES.find(z => mile >= z.startMile && mile < z.endMile);
}

export function getZoneById(zoneId: string): TerrainZone | undefined {
  return TERRAIN_ZONES.find(z => z.zoneId === zoneId);
}

export function getZoneIdForMile(mile: number): string | undefined {
  const zone = getTerrainZone(mile);
  return zone?.zoneId;
}

export function getAdjacentZones(zoneId: string): TerrainZone[] {
  const zone = getZoneById(zoneId);
  if (!zone) return [];
  return zone.adjacentZones.map(id => getZoneById(id)).filter((z): z is TerrainZone => z !== undefined);
}

export function getAllZoneIds(): string[] {
  return TERRAIN_ZONES.map(z => z.zoneId);
}

export function getCurrentState(mile: number): string {
  const boundary = [...STATE_BOUNDARIES].reverse().find(b => mile >= b.mile);
  return boundary?.state || 'GA';
}

export function getNextTown(mile: number): Town | undefined {
  return TOWNS.find(t => t.mile > mile);
}

export function getTownsInRange(startMile: number, endMile: number): Town[] {
  return TOWNS.filter(t => t.mile >= startMile && t.mile <= endMile);
}

export function getNextPeak(mile: number): Peak | undefined {
  return PEAKS.find(p => p.mile > mile);
}

export function getElevationAtMile(mile: number): number {
  // Interpolate elevation from terrain zones and peaks
  const zone = getTerrainZone(mile);
  if (!zone) return 3500;

  // Find nearby shelters for more accurate elevation
  const nearestShelter = binarySearchNearest(SHELTERS, mile, 'mile');

  if (nearestShelter && Math.abs(nearestShelter.mile - mile) < 2) {
    return nearestShelter.elevation;
  }

  return zone.avgElevation;
}

// ============================================================================
// TOTAL TRAIL STATS
// ============================================================================

export const TRAIL_STATS = {
  totalMiles: TRAIL_TOTAL_MILES,
  totalStates: TRAIL_TOTAL_STATES,
  totalShelters: SHELTERS.length,
  totalTowns: TOWNS.length,
  totalPeaks: PEAKS.length,
  highestPoint: { name: KUWOHI.name, elevation: KUWOHI.elevation, mile: KUWOHI.mile },
  lowestPoint: { name: BEAR_MOUNTAIN_BRIDGE.name, elevation: BEAR_MOUNTAIN_BRIDGE.elevation, mile: BEAR_MOUNTAIN_BRIDGE.mile },
  highestShelter: { name: 'Roan High Knob Shelter', elevation: 6275, mile: 379.3 },
  lowestShelter: { name: 'Ten Mile River Lean-to', elevation: 290, mile: 1464.1 },
};

// ============================================================================
// ROAD CROSSINGS - Trail Magic Spots & Hitchhiking Points
// ============================================================================

export type HitchDifficulty = 'easy' | 'moderate' | 'hard' | 'very_hard';
export type TrailMagicFrequency = 'rare' | 'occasional' | 'common' | 'frequent';

export interface RoadCrossing {
  mile: number;
  name: string;
  roadName: string;
  state: string;
  hitchDifficulty: HitchDifficulty;
  trailMagicFrequency: TrailMagicFrequency;
  nearestTown?: string;
  townDistance?: number;  // miles by road
  parking: boolean;       // Is there parking? (more traffic = easier hitch)
  notes?: string;
}

export const ROAD_CROSSINGS: RoadCrossing[] = [
  // GEORGIA
  { mile: 0.9, name: 'Springer Mountain Road', roadName: 'FS 42', state: 'GA', hitchDifficulty: 'hard', trailMagicFrequency: 'occasional', nearestTown: 'Dahlonega', townDistance: 20, parking: true, notes: 'Low traffic gravel road' },
  { mile: 8.8, name: 'Cooper Gap', roadName: 'FS 42/80', state: 'GA', hitchDifficulty: 'hard', trailMagicFrequency: 'rare', parking: true },
  { mile: 15.9, name: 'Woody Gap', roadName: 'GA 60', state: 'GA', hitchDifficulty: 'moderate', trailMagicFrequency: 'common', nearestTown: 'Dahlonega', townDistance: 12, parking: true, notes: 'First real road crossing. Trail magic common on weekends.' },
  { mile: 20.6, name: 'Jarrard Gap', roadName: 'FS 144', state: 'GA', hitchDifficulty: 'very_hard', trailMagicFrequency: 'rare', parking: false },
  { mile: 30.7, name: 'Neels Gap', roadName: 'US 19/129', state: 'GA', hitchDifficulty: 'easy', trailMagicFrequency: 'frequent', nearestTown: 'Dahlonega', townDistance: 18, parking: true, notes: 'Mountain Crossings outfitter! Trail goes THROUGH the store. First major resupply.' },
  { mile: 44.6, name: 'Tesnatee Gap', roadName: 'GA 348', state: 'GA', hitchDifficulty: 'moderate', trailMagicFrequency: 'occasional', nearestTown: 'Helen', townDistance: 8, parking: true },
  { mile: 47.6, name: 'Hogpen Gap', roadName: 'GA 348', state: 'GA', hitchDifficulty: 'moderate', trailMagicFrequency: 'occasional', nearestTown: 'Helen', townDistance: 10, parking: true },
  { mile: 56.3, name: 'Unicoi Gap', roadName: 'GA 75', state: 'GA', hitchDifficulty: 'easy', trailMagicFrequency: 'common', nearestTown: 'Helen', townDistance: 9, parking: true, notes: 'Easy hitch to Helen (party town!)' },
  { mile: 68.6, name: 'Dicks Creek Gap', roadName: 'US 76', state: 'GA', hitchDifficulty: 'easy', trailMagicFrequency: 'common', nearestTown: 'Hiawassee', townDistance: 11, parking: true, notes: 'Last Georgia gap. Shuttles available.' },

  // NORTH CAROLINA
  { mile: 88.1, name: 'Deep Gap', roadName: 'USFS 71', state: 'NC', hitchDifficulty: 'very_hard', trailMagicFrequency: 'rare', parking: true, notes: 'Remote. Low traffic.' },
  { mile: 95.8, name: 'Winding Stair Gap', roadName: 'US 64', state: 'NC', hitchDifficulty: 'easy', trailMagicFrequency: 'common', nearestTown: 'Franklin', townDistance: 10, parking: true, notes: 'Good hitch to Franklin' },
  { mile: 109.5, name: 'Wayah Gap', roadName: 'SR 1310', state: 'NC', hitchDifficulty: 'hard', trailMagicFrequency: 'occasional', parking: true },
  { mile: 135.8, name: 'Wesser (NOC)', roadName: 'US 19', state: 'NC', hitchDifficulty: 'easy', trailMagicFrequency: 'frequent', nearestTown: 'Bryson City', townDistance: 10, parking: true, notes: 'Nantahala Outdoor Center! Full services at crossing.' },
  { mile: 165.7, name: 'Fontana Dam', roadName: 'NC 28', state: 'NC', hitchDifficulty: 'moderate', trailMagicFrequency: 'common', nearestTown: 'Robbinsville', townDistance: 15, parking: true, notes: 'The Fontana Hilton. Showers, resupply at marina.' },

  // GREAT SMOKY MOUNTAINS - No road crossings for 72 miles!
  { mile: 238.7, name: 'Davenport Gap', roadName: 'NC 32', state: 'NC', hitchDifficulty: 'hard', trailMagicFrequency: 'occasional', parking: true, notes: 'First road after Smokies. Remote.' },

  // NC/TN CONTINUED
  { mile: 244.4, name: 'I-40 (Pigeon River)', roadName: 'I-40', state: 'NC', hitchDifficulty: 'moderate', trailMagicFrequency: 'occasional', parking: false, notes: 'Dont try to hitch on interstate! Walk to ramp.' },
  { mile: 273.2, name: 'Hot Springs', roadName: 'US 25/70', state: 'NC', hitchDifficulty: 'easy', trailMagicFrequency: 'frequent', nearestTown: 'Hot Springs', townDistance: 0, parking: true, notes: 'Trail goes through town! Hot tub by the river.' },
  { mile: 300.3, name: 'Sam Gap', roadName: 'US 23', state: 'NC', hitchDifficulty: 'moderate', trailMagicFrequency: 'occasional', parking: true },
  { mile: 331.8, name: 'Spivey Gap', roadName: 'US 19W', state: 'NC', hitchDifficulty: 'moderate', trailMagicFrequency: 'common', nearestTown: 'Erwin', townDistance: 4, parking: true, notes: 'Easy hitch to Erwin (Uncle Johnnys!)' },
  { mile: 341.8, name: 'Temple Hill Gap', roadName: 'TN 197', state: 'TN', hitchDifficulty: 'hard', trailMagicFrequency: 'rare', parking: true },
  { mile: 352.2, name: 'Hughes Gap', roadName: 'TN 107', state: 'TN', hitchDifficulty: 'hard', trailMagicFrequency: 'occasional', parking: true },
  { mile: 363.8, name: 'Iron Mountain Gap', roadName: 'TN 107/NC 226', state: 'TN', hitchDifficulty: 'moderate', trailMagicFrequency: 'occasional', parking: true },
  { mile: 376.6, name: 'Carvers Gap', roadName: 'TN 143', state: 'TN', hitchDifficulty: 'moderate', trailMagicFrequency: 'common', nearestTown: 'Roan Mountain', townDistance: 3, parking: true, notes: 'Rhododendron gardens nearby. Day hikers = trail magic.' },
  { mile: 393.5, name: 'US 19E', roadName: 'US 19E', state: 'TN', hitchDifficulty: 'easy', trailMagicFrequency: 'common', nearestTown: 'Elk Park', townDistance: 2, parking: true },
  { mile: 412.5, name: 'US 321', roadName: 'US 321', state: 'TN', hitchDifficulty: 'easy', trailMagicFrequency: 'common', nearestTown: 'Hampton', townDistance: 3, parking: true, notes: 'Kincora Hostel nearby!' },
  { mile: 435.1, name: 'Watauga Dam Road', roadName: 'TN 67', state: 'TN', hitchDifficulty: 'easy', trailMagicFrequency: 'common', nearestTown: 'Elizabethton', townDistance: 14, parking: true },
  { mile: 459.2, name: 'US 421', roadName: 'US 421', state: 'TN', hitchDifficulty: 'easy', trailMagicFrequency: 'occasional', nearestTown: 'Shady Valley', townDistance: 4, parking: true },
  { mile: 467.2, name: 'Low Gap (Damascus)', roadName: 'US 58', state: 'VA', hitchDifficulty: 'easy', trailMagicFrequency: 'frequent', nearestTown: 'Damascus', townDistance: 1, parking: true, notes: 'Trail Town USA! Legendary hospitality.' },

  // VIRGINIA - Long section with many crossings
  { mile: 489.8, name: 'VA 600', roadName: 'VA 600', state: 'VA', hitchDifficulty: 'hard', trailMagicFrequency: 'rare', parking: true },
  { mile: 526.4, name: 'VA 16', roadName: 'VA 16', state: 'VA', hitchDifficulty: 'moderate', trailMagicFrequency: 'common', nearestTown: 'Marion', townDistance: 6, parking: true },
  { mile: 545.8, name: 'VA 42', roadName: 'VA 42', state: 'VA', hitchDifficulty: 'moderate', trailMagicFrequency: 'occasional', nearestTown: 'Bland', townDistance: 3, parking: true },
  { mile: 551.8, name: 'I-77', roadName: 'I-77', state: 'VA', hitchDifficulty: 'easy', trailMagicFrequency: 'common', nearestTown: 'Bland', townDistance: 2, parking: true, notes: 'Big Walker Lookout nearby' },
  { mile: 600.2, name: 'VA 606 (Pearisburg)', roadName: 'VA 606', state: 'VA', hitchDifficulty: 'easy', trailMagicFrequency: 'common', nearestTown: 'Pearisburg', townDistance: 3, parking: true, notes: 'Angels Rest trailhead. Holy Family Hostel.' },
  { mile: 629.8, name: 'VA 311 (Catawba)', roadName: 'VA 311', state: 'VA', hitchDifficulty: 'easy', trailMagicFrequency: 'common', nearestTown: 'Catawba', townDistance: 1, parking: true, notes: 'Home Place restaurant (family style!)' },
  { mile: 643.2, name: 'McAfee Knob Parking', roadName: 'VA 311', state: 'VA', hitchDifficulty: 'easy', trailMagicFrequency: 'frequent', nearestTown: 'Salem', townDistance: 7, parking: true, notes: 'Busy on weekends. Most photographed spot on AT!' },
  { mile: 702.4, name: 'US 501', roadName: 'US 501', state: 'VA', hitchDifficulty: 'easy', trailMagicFrequency: 'common', nearestTown: 'Glasgow', townDistance: 3, parking: true },
  { mile: 724.5, name: 'Blue Ridge Parkway (Buena Vista)', roadName: 'BRP', state: 'VA', hitchDifficulty: 'moderate', trailMagicFrequency: 'occasional', parking: true },
  { mile: 765.6, name: 'Rockfish Gap', roadName: 'I-64/US 250', state: 'VA', hitchDifficulty: 'easy', trailMagicFrequency: 'common', nearestTown: 'Waynesboro', townDistance: 4, parking: true, notes: 'Enter Shenandoah! Waynesboro is great for zero days.' },
  { mile: 797.4, name: 'Swift Run Gap', roadName: 'US 33', state: 'VA', hitchDifficulty: 'moderate', trailMagicFrequency: 'occasional', nearestTown: 'Elkton', townDistance: 8, parking: true },
  { mile: 828.4, name: 'Thornton Gap', roadName: 'US 211', state: 'VA', hitchDifficulty: 'moderate', trailMagicFrequency: 'occasional', nearestTown: 'Luray', townDistance: 9, parking: true },
  { mile: 856.5, name: 'Front Royal', roadName: 'US 522', state: 'VA', hitchDifficulty: 'easy', trailMagicFrequency: 'common', nearestTown: 'Front Royal', townDistance: 4, parking: true, notes: 'End of Shenandoah. Good resupply.' },
  { mile: 867.6, name: 'VA 7 (Snickers Gap)', roadName: 'VA 7', state: 'VA', hitchDifficulty: 'easy', trailMagicFrequency: 'occasional', nearestTown: 'Bluemont', townDistance: 1, parking: true },
  { mile: 888.2, name: 'US 340 (Harpers Ferry)', roadName: 'US 340', state: 'WV', hitchDifficulty: 'easy', trailMagicFrequency: 'frequent', nearestTown: 'Harpers Ferry', townDistance: 0.5, parking: true, notes: 'ATC Headquarters! Psychological halfway point.' },

  // MARYLAND - Short but sweet
  { mile: 896.8, name: 'Gathland State Park', roadName: 'MD 67', state: 'MD', hitchDifficulty: 'moderate', trailMagicFrequency: 'occasional', parking: true },
  { mile: 912.2, name: 'US 40/I-70', roadName: 'I-70', state: 'MD', hitchDifficulty: 'easy', trailMagicFrequency: 'occasional', nearestTown: 'Hagerstown', townDistance: 10, parking: true, notes: 'Footbridge over I-70. Unusual crossing!' },
  { mile: 931.6, name: 'Pen-Mar Park', roadName: 'High Rock Rd', state: 'MD', hitchDifficulty: 'moderate', trailMagicFrequency: 'common', parking: true, notes: 'Historic park. Weekend trail magic common.' },

  // PENNSYLVANIA - Rocky and road-crossed
  { mile: 969.2, name: 'US 30 (Caledonia)', roadName: 'US 30', state: 'PA', hitchDifficulty: 'easy', trailMagicFrequency: 'common', parking: true },
  { mile: 986.1, name: 'PA 233 (Pine Grove)', roadName: 'PA 233', state: 'PA', hitchDifficulty: 'moderate', trailMagicFrequency: 'occasional', parking: true },
  { mile: 1008.2, name: 'PA 34 (Boiling Springs)', roadName: 'PA 34', state: 'PA', hitchDifficulty: 'easy', trailMagicFrequency: 'common', nearestTown: 'Boiling Springs', townDistance: 0.5, parking: true, notes: 'ATC regional office. Beautiful spring-fed lake.' },
  { mile: 1019.8, name: 'US 11', roadName: 'US 11', state: 'PA', hitchDifficulty: 'moderate', trailMagicFrequency: 'occasional', nearestTown: 'Carlisle', townDistance: 8, parking: false },
  { mile: 1024.8, name: 'I-81', roadName: 'I-81', state: 'PA', hitchDifficulty: 'hard', trailMagicFrequency: 'rare', parking: false, notes: 'Footbridge. Noisy area.' },
  { mile: 1031.8, name: 'PA 944', roadName: 'PA 944', state: 'PA', hitchDifficulty: 'hard', trailMagicFrequency: 'rare', parking: true },
  { mile: 1050.4, name: 'PA 225', roadName: 'PA 225', state: 'PA', hitchDifficulty: 'moderate', trailMagicFrequency: 'occasional', parking: true },
  { mile: 1070.8, name: 'PA 325 (Port Clinton)', roadName: 'PA 325', state: 'PA', hitchDifficulty: 'easy', trailMagicFrequency: 'common', nearestTown: 'Port Clinton', townDistance: 0.5, parking: true, notes: 'Pavilion, port-a-potty. Hikers welcome.' },
  { mile: 1088.3, name: 'PA 309', roadName: 'PA 309', state: 'PA', hitchDifficulty: 'moderate', trailMagicFrequency: 'occasional', parking: true },
  { mile: 1110.4, name: 'PA 248', roadName: 'PA 248', state: 'PA', hitchDifficulty: 'moderate', trailMagicFrequency: 'occasional', nearestTown: 'Palmerton', townDistance: 1, parking: true, notes: 'Jailhouse hostel!' },
  { mile: 1122.1, name: 'Wind Gap', roadName: 'PA 33', state: 'PA', hitchDifficulty: 'easy', trailMagicFrequency: 'common', nearestTown: 'Wind Gap', townDistance: 1, parking: true },
  { mile: 1149.3, name: 'Delaware Water Gap', roadName: 'PA 611', state: 'PA', hitchDifficulty: 'easy', trailMagicFrequency: 'frequent', nearestTown: 'Delaware Water Gap', townDistance: 0, parking: true, notes: 'Church of the Mountain hostel. Trail goes through town.' },

  // NEW JERSEY
  { mile: 1188.2, name: 'Culvers Gap', roadName: 'US 206', state: 'NJ', hitchDifficulty: 'easy', trailMagicFrequency: 'common', parking: true, notes: 'Gypsies cafe nearby!' },
  { mile: 1217.4, name: 'High Point', roadName: 'NJ 23', state: 'NJ', hitchDifficulty: 'moderate', trailMagicFrequency: 'occasional', parking: true },

  // NEW YORK
  { mile: 1239.7, name: 'NY 17A', roadName: 'NY 17A', state: 'NY', hitchDifficulty: 'moderate', trailMagicFrequency: 'occasional', nearestTown: 'Warwick', townDistance: 5, parking: true },
  { mile: 1254.6, name: 'NY 17 (Arden Valley)', roadName: 'NY 17', state: 'NY', hitchDifficulty: 'easy', trailMagicFrequency: 'occasional', parking: true },
  { mile: 1277.2, name: 'Bear Mountain', roadName: 'US 9W', state: 'NY', hitchDifficulty: 'easy', trailMagicFrequency: 'common', parking: true, notes: 'Bear Mountain Zoo, inn, Trailside Museum. Ice cream!' },
  { mile: 1280.3, name: 'Bear Mountain Bridge', roadName: 'US 6/202', state: 'NY', hitchDifficulty: 'moderate', trailMagicFrequency: 'occasional', parking: false, notes: 'Lowest point on AT! Hudson River crossing.' },
  { mile: 1334.8, name: 'NY 22 (Pawling)', roadName: 'NY 22', state: 'NY', hitchDifficulty: 'easy', trailMagicFrequency: 'common', nearestTown: 'Pawling', townDistance: 3, parking: true },
  { mile: 1364.8, name: 'NY 55', roadName: 'NY 55', state: 'NY', hitchDifficulty: 'moderate', trailMagicFrequency: 'occasional', parking: true },

  // CONNECTICUT
  { mile: 1413.4, name: 'Cornwall Bridge', roadName: 'US 7', state: 'CT', hitchDifficulty: 'easy', trailMagicFrequency: 'occasional', parking: true },
  { mile: 1428.2, name: 'CT 4 (Salisbury)', roadName: 'CT 4', state: 'CT', hitchDifficulty: 'easy', trailMagicFrequency: 'common', nearestTown: 'Salisbury', townDistance: 0.5, parking: true, notes: 'Beautiful town, good restaurant.' },
  { mile: 1440.6, name: 'CT 41', roadName: 'CT 41', state: 'CT', hitchDifficulty: 'moderate', trailMagicFrequency: 'occasional', parking: true },

  // MASSACHUSETTS
  { mile: 1469.7, name: 'US 7 (Sheffield)', roadName: 'US 7', state: 'MA', hitchDifficulty: 'easy', trailMagicFrequency: 'common', nearestTown: 'Sheffield', townDistance: 3, parking: true },
  { mile: 1479.4, name: 'US 20 (Lee)', roadName: 'US 20', state: 'MA', hitchDifficulty: 'easy', trailMagicFrequency: 'common', nearestTown: 'Lee', townDistance: 4, parking: true },
  { mile: 1506.6, name: 'MA 9 (Dalton)', roadName: 'MA 9', state: 'MA', hitchDifficulty: 'easy', trailMagicFrequency: 'common', nearestTown: 'Dalton', townDistance: 3, parking: true },
  { mile: 1527.4, name: 'MA 2 (North Adams)', roadName: 'MA 2', state: 'MA', hitchDifficulty: 'easy', trailMagicFrequency: 'common', nearestTown: 'North Adams', townDistance: 3, parking: true, notes: 'Good town stop before Vermont mud.' },

  // VERMONT
  { mile: 1550.8, name: 'VT 9 (Bennington)', roadName: 'VT 9', state: 'VT', hitchDifficulty: 'easy', trailMagicFrequency: 'common', nearestTown: 'Bennington', townDistance: 5, parking: true },
  { mile: 1605.2, name: 'VT 11/30 (Manchester)', roadName: 'VT 11/30', state: 'VT', hitchDifficulty: 'easy', trailMagicFrequency: 'common', nearestTown: 'Manchester', townDistance: 5, parking: true, notes: 'Outlet shopping!' },
  { mile: 1641.7, name: 'VT 103 (Clarendon Gorge)', roadName: 'VT 103', state: 'VT', hitchDifficulty: 'moderate', trailMagicFrequency: 'occasional', parking: true },
  { mile: 1654.9, name: 'US 4 (Killington)', roadName: 'US 4', state: 'VT', hitchDifficulty: 'easy', trailMagicFrequency: 'common', nearestTown: 'Rutland', townDistance: 10, parking: true, notes: 'Inn at Long Trail! Yellow Deli nearby.' },
  { mile: 1692.4, name: 'VT 12 (Woodstock)', roadName: 'VT 12', state: 'VT', hitchDifficulty: 'easy', trailMagicFrequency: 'occasional', nearestTown: 'Woodstock', townDistance: 4, parking: true },
  { mile: 1718.8, name: 'VT 14 (West Hartford)', roadName: 'VT 14', state: 'VT', hitchDifficulty: 'moderate', trailMagicFrequency: 'occasional', parking: true },

  // NEW HAMPSHIRE
  { mile: 1746.6, name: 'Hanover (Dartmouth)', roadName: 'NH 10', state: 'NH', hitchDifficulty: 'easy', trailMagicFrequency: 'frequent', nearestTown: 'Hanover', townDistance: 0, parking: true, notes: 'Trail goes through Dartmouth campus! Great pizza.' },
  { mile: 1775.8, name: 'NH 25', roadName: 'NH 25', state: 'NH', hitchDifficulty: 'moderate', trailMagicFrequency: 'occasional', parking: true },
  { mile: 1803.2, name: 'NH 25C', roadName: 'NH 25C', state: 'NH', hitchDifficulty: 'moderate', trailMagicFrequency: 'occasional', parking: true },
  { mile: 1815.8, name: 'Kinsman Notch', roadName: 'NH 112', state: 'NH', hitchDifficulty: 'moderate', trailMagicFrequency: 'occasional', nearestTown: 'Lincoln', townDistance: 6, parking: true },
  { mile: 1831.6, name: 'Franconia Notch', roadName: 'I-93 (Parkway)', state: 'NH', hitchDifficulty: 'easy', trailMagicFrequency: 'common', nearestTown: 'Lincoln', townDistance: 8, parking: true, notes: 'Flume Gorge, tramway. Tourist area = trail magic.' },
  { mile: 1857.8, name: 'Crawford Notch', roadName: 'US 302', state: 'NH', hitchDifficulty: 'easy', trailMagicFrequency: 'common', parking: true, notes: 'AMC Highland Center. Showers for thru-hikers!' },
  { mile: 1865.8, name: 'Mt Washington Auto Road', roadName: 'Auto Road', state: 'NH', hitchDifficulty: 'hard', trailMagicFrequency: 'rare', parking: true, notes: 'Summit only. Expensive food but warm!' },
  { mile: 1896.6, name: 'Pinkham Notch', roadName: 'NH 16', state: 'NH', hitchDifficulty: 'easy', trailMagicFrequency: 'common', nearestTown: 'Gorham', townDistance: 11, parking: true, notes: 'AMC headquarters! Cafeteria, showers, lodge.' },
  { mile: 1912.5, name: 'NH 2 (Gorham)', roadName: 'NH 2', state: 'NH', hitchDifficulty: 'easy', trailMagicFrequency: 'common', nearestTown: 'Gorham', townDistance: 4, parking: true, notes: 'Last NH town. Resupply for Mahoosuc!' },

  // MAINE
  { mile: 1941.1, name: 'ME 26 (Grafton Notch)', roadName: 'ME 26', state: 'ME', hitchDifficulty: 'moderate', trailMagicFrequency: 'occasional', parking: true, notes: 'After Mahoosuc! State park. Last easy road for 30 miles.' },
  { mile: 1969.6, name: 'ME 17 (Rangeley)', roadName: 'ME 17', state: 'ME', hitchDifficulty: 'easy', trailMagicFrequency: 'common', nearestTown: 'Rangeley', townDistance: 10, parking: true, notes: 'Height of Land overlook. Worth the hitch.' },
  { mile: 1990.6, name: 'ME 4 (Rangeley)', roadName: 'ME 4', state: 'ME', hitchDifficulty: 'easy', trailMagicFrequency: 'common', nearestTown: 'Rangeley', townDistance: 9, parking: true },
  { mile: 2011.4, name: 'ME 27 (Stratton)', roadName: 'ME 27', state: 'ME', hitchDifficulty: 'easy', trailMagicFrequency: 'common', nearestTown: 'Stratton', townDistance: 5, parking: true, notes: 'White Wolf Inn. Last mail drop before 100-mile.' },
  { mile: 2093.0, name: 'ME 15 (Monson)', roadName: 'ME 15', state: 'ME', hitchDifficulty: 'moderate', trailMagicFrequency: 'frequent', nearestTown: 'Monson', townDistance: 3, parking: true, notes: '100-MILE WILDERNESS STARTS HERE! Last resupply for 100 miles. Shaws hostel legendary.' },
  { mile: 2160.4, name: 'Abol Bridge', roadName: 'Golden Road', state: 'ME', hitchDifficulty: 'hard', trailMagicFrequency: 'occasional', parking: true, notes: 'Last store! Last view of Katahdin before climb. Campground.' },
  { mile: 2170.4, name: 'Katahdin Stream', roadName: 'Baxter Park Rd', state: 'ME', hitchDifficulty: 'hard', trailMagicFrequency: 'rare', parking: true, notes: 'Register for summit. Ranger station. Campground reservation required!' },
];

// ============================================================================
// FAMOUS WATER SOURCES - Named Springs and Reliable Sources
// ============================================================================

export type WaterQuality = 'pristine' | 'excellent' | 'good' | 'treat_required';
export type WaterFlow = 'strong_year_round' | 'reliable' | 'seasonal' | 'intermittent' | 'dry_in_drought';

export interface WaterSource {
  mile: number;
  name: string;
  state: string;
  type: 'spring' | 'stream' | 'river' | 'pond' | 'piped' | 'well';
  quality: WaterQuality;
  flow: WaterFlow;
  description: string;
  famous?: boolean;          // Is this a named/famous source?
  treatmentRecommended: boolean;
  notes?: string;
}

export const FAMOUS_WATER_SOURCES: WaterSource[] = [
  // GEORGIA
  { mile: 0.2, name: 'Springer Mountain Spring', state: 'GA', type: 'spring', quality: 'excellent', flow: 'reliable', description: 'Spring near summit shelter', treatmentRecommended: true, notes: 'First water on trail!' },
  { mile: 28.9, name: 'Blood Mountain Spring', state: 'GA', type: 'spring', quality: 'good', flow: 'seasonal', description: '0.3 miles down blue-blaze trail', famous: true, treatmentRecommended: true, notes: 'UNRELIABLE in dry weather. Carry water up!' },
  { mile: 46.2, name: 'Whitley Gap Spring', state: 'GA', type: 'spring', quality: 'excellent', flow: 'reliable', description: 'Flows from rock face', treatmentRecommended: true },

  // NORTH CAROLINA/TENNESSEE
  { mile: 120.6, name: 'Wayah Bald Spring', state: 'NC', type: 'spring', quality: 'good', flow: 'seasonal', description: 'Near Wayah Shelter', treatmentRecommended: true, notes: 'Can go dry in late summer' },
  { mile: 166.2, name: 'Fontana Dam Spigot', state: 'NC', type: 'piped', quality: 'pristine', flow: 'strong_year_round', description: 'Treated water at shelter', famous: true, treatmentRecommended: false, notes: 'The Fontana Hilton - full amenities!' },

  // GREAT SMOKY MOUNTAINS
  { mile: 195.8, name: 'Silers Bald Spring', state: 'NC', type: 'spring', quality: 'excellent', flow: 'reliable', description: 'Cold mountain spring', treatmentRecommended: true },
  { mile: 211.1, name: 'Icewater Spring', state: 'NC', type: 'spring', quality: 'pristine', flow: 'strong_year_round', description: 'Ice cold water from deep spring', famous: true, treatmentRecommended: true, notes: 'Named for its temperature. Legendary cold water.' },

  // ROAN HIGHLANDS
  { mile: 379.3, name: 'Roan High Knob Spring', state: 'TN', type: 'spring', quality: 'excellent', flow: 'reliable', description: 'Highest spring on AT', famous: true, treatmentRecommended: true, notes: 'At 6,200ft elevation!' },
  { mile: 386.4, name: 'Overmountain Spring', state: 'NC', type: 'spring', quality: 'excellent', flow: 'reliable', description: 'Strong flow near barn shelter', treatmentRecommended: true },

  // VIRGINIA
  { mile: 467.2, name: 'Damascus Town Spigots', state: 'VA', type: 'piped', quality: 'pristine', flow: 'strong_year_round', description: 'Multiple water sources in town', famous: true, treatmentRecommended: false, notes: 'Trail Town USA hospitality' },
  { mile: 602.4, name: 'Rice Field Shelter Spring', state: 'VA', type: 'spring', quality: 'good', flow: 'seasonal', description: 'Down steep trail', treatmentRecommended: true, notes: 'Long carry from here - fill up' },
  { mile: 643.2, name: 'McAfee Knob Parking', state: 'VA', type: 'piped', quality: 'pristine', flow: 'strong_year_round', description: 'Spigot at trailhead', famous: true, treatmentRecommended: false, notes: 'Fill up before climb to famous knob' },
  { mile: 766.8, name: 'Humpback Rocks Spring', state: 'VA', type: 'spring', quality: 'excellent', flow: 'reliable', description: 'Near parking area', treatmentRecommended: true },

  // SHENANDOAH - Many developed sources
  { mile: 770.4, name: 'Blackrock Hut Spring', state: 'VA', type: 'spring', quality: 'good', flow: 'seasonal', description: 'Spring 0.2mi on blue blaze', treatmentRecommended: true },
  { mile: 797.4, name: 'Swift Run Gap', state: 'VA', type: 'piped', quality: 'pristine', flow: 'strong_year_round', description: 'Developed spring at gap', treatmentRecommended: false },
  { mile: 819.4, name: 'Big Meadows', state: 'VA', type: 'piped', quality: 'pristine', flow: 'strong_year_round', description: 'Lodge with full amenities', famous: true, treatmentRecommended: false, notes: 'Famous blackberry milkshakes!' },

  // MARYLAND
  { mile: 912.6, name: 'Washington Monument State Park', state: 'MD', type: 'piped', quality: 'pristine', flow: 'strong_year_round', description: 'Spigot near monument', treatmentRecommended: false },

  // PENNSYLVANIA
  { mile: 1008.2, name: 'Boiling Springs', state: 'PA', type: 'spring', quality: 'pristine', flow: 'strong_year_round', description: 'Natural spring-fed lake', famous: true, treatmentRecommended: false, notes: 'The lake literally boils from spring water. Magical sight.' },
  { mile: 1070.8, name: 'Port Clinton Spring', state: 'PA', type: 'piped', quality: 'pristine', flow: 'strong_year_round', description: 'Town water at pavilion', treatmentRecommended: false },

  // NEW JERSEY
  { mile: 1191.8, name: 'High Point Spring', state: 'NJ', type: 'spring', quality: 'good', flow: 'reliable', description: 'Spring near shelter', treatmentRecommended: true },

  // NEW YORK
  { mile: 1267.4, name: 'Fingerboard Shelter Spring', state: 'NY', type: 'spring', quality: 'good', flow: 'seasonal', description: 'Spring 0.3mi downhill', treatmentRecommended: true, notes: 'NY water can be scarce in summer' },
  { mile: 1277.2, name: 'Bear Mountain Inn', state: 'NY', type: 'piped', quality: 'pristine', flow: 'strong_year_round', description: 'Treated water at inn', famous: true, treatmentRecommended: false, notes: 'Lowest point on AT. Ice cream available!' },

  // CONNECTICUT
  { mile: 1428.2, name: 'Salisbury Town Spigot', state: 'CT', type: 'piped', quality: 'pristine', flow: 'strong_year_round', description: 'Town water near trail', treatmentRecommended: false },
  { mile: 1461.2, name: 'Sages Ravine Brook', state: 'CT', type: 'stream', quality: 'excellent', flow: 'strong_year_round', description: 'Beautiful cascading brook', famous: true, treatmentRecommended: true, notes: 'One of the prettiest water sources on trail' },

  // MASSACHUSETTS
  { mile: 1534.7, name: 'Upper Goose Pond', state: 'MA', type: 'pond', quality: 'good', flow: 'strong_year_round', description: 'Lake water at famous cabin', famous: true, treatmentRecommended: true, notes: 'Caretaker serves pancakes! Legend.' },
  { mile: 1590.4, name: 'Mt. Greylock Summit', state: 'MA', type: 'piped', quality: 'pristine', flow: 'strong_year_round', description: 'Water at Bascom Lodge', famous: true, treatmentRecommended: false },

  // VERMONT
  { mile: 1603.2, name: 'Seth Warner Shelter Spring', state: 'VT', type: 'spring', quality: 'excellent', flow: 'reliable', description: 'Strong spring at shelter', treatmentRecommended: true },
  { mile: 1638.2, name: 'Stratton Pond', state: 'VT', type: 'pond', quality: 'good', flow: 'strong_year_round', description: 'Largest pond on Long Trail', famous: true, treatmentRecommended: true, notes: 'Where MacKaye conceived the AT' },
  { mile: 1710.7, name: 'Killington Peak Spring', state: 'VT', type: 'spring', quality: 'excellent', flow: 'reliable', description: 'Spring near Cooper Lodge', treatmentRecommended: true },

  // NEW HAMPSHIRE - Many mountain streams
  { mile: 1746.6, name: 'Hanover Water', state: 'NH', type: 'piped', quality: 'pristine', flow: 'strong_year_round', description: 'Town water everywhere', famous: true, treatmentRecommended: false, notes: 'Dartmouth hospitality' },
  { mile: 1809.5, name: 'Moosilauke Summit Spring', state: 'NH', type: 'spring', quality: 'excellent', flow: 'seasonal', description: 'Spring on descent', treatmentRecommended: true, notes: 'Unreliable late season' },
  { mile: 1831.6, name: 'Franconia Notch Stream', state: 'NH', type: 'stream', quality: 'excellent', flow: 'strong_year_round', description: 'Mountain stream at notch', treatmentRecommended: true },
  { mile: 1865.1, name: 'Lakes of the Clouds', state: 'NH', type: 'pond', quality: 'good', flow: 'strong_year_round', description: 'Alpine ponds at AMC hut', famous: true, treatmentRecommended: true, notes: 'Highest AMC hut. Treat or buy water.' },
  { mile: 1896.6, name: 'Pinkham Notch AMC', state: 'NH', type: 'piped', quality: 'pristine', flow: 'strong_year_round', description: 'Treated water at visitor center', famous: true, treatmentRecommended: false },

  // MAINE
  { mile: 1925.4, name: 'Mahoosuc Notch Ice Water', state: 'ME', type: 'spring', quality: 'pristine', flow: 'strong_year_round', description: 'Ice cold water from caves', famous: true, treatmentRecommended: true, notes: 'Water from snow/ice caves. Cold year-round!' },
  { mile: 1941.1, name: 'Grafton Notch Spring', state: 'ME', type: 'spring', quality: 'excellent', flow: 'reliable', description: 'Spring at state park', treatmentRecommended: true },
  { mile: 2093.0, name: 'Monson Town Water', state: 'ME', type: 'piped', quality: 'pristine', flow: 'strong_year_round', description: 'Last town water for 100 miles!', famous: true, treatmentRecommended: false, notes: 'FILL EVERYTHING before 100-mile!' },
  { mile: 2100.5, name: 'Gulf Hagas Brook', state: 'ME', type: 'stream', quality: 'excellent', flow: 'strong_year_round', description: 'Beautiful gorge stream', treatmentRecommended: true },
  { mile: 2160.4, name: 'Abol Bridge Store', state: 'ME', type: 'piped', quality: 'pristine', flow: 'strong_year_round', description: 'Store/campground water', famous: true, treatmentRecommended: false, notes: 'Last store. Last easy water.' },
  { mile: 2188.2, name: 'Katahdin Stream', state: 'ME', type: 'stream', quality: 'excellent', flow: 'strong_year_round', description: 'Stream at final campground', famous: true, treatmentRecommended: true, notes: 'Fill up for summit day!' },
];

// ============================================================================
// DANGEROUS CROSSINGS - Fords, Exposed Sections, Hazards
// ============================================================================

export type HazardType = 'river_ford' | 'exposed_ridge' | 'steep_descent' | 'boulder_field' | 'wildlife' | 'road_crossing' | 'slippery_rocks';
export type DangerLevel = 'caution' | 'moderate' | 'serious' | 'extreme';

export interface DangerousCrossing {
  mile: number;
  name: string;
  state: string;
  type: HazardType;
  danger: DangerLevel;
  description: string;
  conditions: string;          // When is it most dangerous?
  safetyTips: string[];
  alternateRoute?: string;
  notes?: string;
}

export const DANGEROUS_CROSSINGS: DangerousCrossing[] = [
  // GEORGIA
  {
    mile: 28.9,
    name: 'Blood Mountain Descent',
    state: 'GA',
    type: 'steep_descent',
    danger: 'caution',
    description: 'Steep rocky descent north of Blood Mountain',
    conditions: 'Wet weather, winter ice',
    safetyTips: ['Use trekking poles', 'Watch for loose rocks', 'Carry extra water - none at summit'],
  },

  // NORTH CAROLINA
  {
    mile: 135.8,
    name: 'Nantahala River Crossing',
    state: 'NC',
    type: 'river_ford',
    danger: 'caution',
    description: 'Cross Nantahala River at NOC',
    conditions: 'High water after heavy rain',
    safetyTips: ['Use bridge - fording not necessary', 'Watch for kayakers'],
  },

  // GREAT SMOKY MOUNTAINS
  {
    mile: 166.7,
    name: 'Shuckstack Tower Approach',
    state: 'NC',
    type: 'exposed_ridge',
    danger: 'moderate',
    description: 'Exposed climb to fire tower',
    conditions: 'Lightning, high winds',
    safetyTips: ['Skip tower in storms', 'Watch footing on rocks'],
  },

  // ROAN HIGHLANDS
  {
    mile: 377.2,
    name: 'Roan Balds Traverse',
    state: 'TN',
    type: 'exposed_ridge',
    danger: 'moderate',
    description: 'Open grassy balds above treeline',
    conditions: 'Thunderstorms, fog, winter conditions',
    safetyTips: ['Check weather', 'Descend in storms', 'Carry rain gear'],
    notes: 'Beautiful but exposed. Lightning kills here.',
  },

  // VIRGINIA
  {
    mile: 633.8,
    name: 'Dragon\'s Tooth',
    state: 'VA',
    type: 'boulder_field',
    danger: 'moderate',
    description: 'Steep rock scramble with iron rungs',
    conditions: 'Wet rocks, crowded weekends',
    safetyTips: ['Use all four limbs', 'Stow trekking poles', 'Go slow when wet'],
    notes: 'The rungs are slippery when wet. Many minor injuries here.',
  },
  {
    mile: 643.2,
    name: 'McAfee Knob Ledge',
    state: 'VA',
    type: 'exposed_ridge',
    danger: 'moderate',
    description: 'Iconic photo spot on cliff edge',
    conditions: 'Any weather - crowded weekends',
    safetyTips: ['Stay back from edge', 'Don\'t pose recklessly', 'Wind can gust suddenly'],
    notes: 'Deaths and injuries from falls. Worth photos but be careful!',
  },
  {
    mile: 702.4,
    name: 'James River Foot Bridge',
    state: 'VA',
    type: 'road_crossing',
    danger: 'caution',
    description: 'Long footbridge over James River',
    conditions: 'High winds, slippery deck',
    safetyTips: ['Hold handrails', 'Watch for cyclists'],
  },

  // PENNSYLVANIA
  {
    mile: 970.0,
    name: 'Rocky Ridge (PA rocks begin)',
    state: 'PA',
    type: 'boulder_field',
    danger: 'moderate',
    description: 'The infamous PA rocks begin here',
    conditions: 'Always. Worse when wet.',
    safetyTips: ['Watch ankles', 'Expect slow miles', 'Good shoes essential'],
    notes: 'PA rocks are notorious. Many thru-hikers injured here.',
  },
  {
    mile: 1070.8,
    name: 'Lehigh Gap Superfund Descent',
    state: 'PA',
    type: 'steep_descent',
    danger: 'moderate',
    description: 'Steep, rocky descent to Lehigh River',
    conditions: 'Wet weather, summer heat (no shade)',
    safetyTips: ['Poles essential', 'Carry extra water', 'No water or shade for miles'],
    notes: 'Former zinc smelter left barren moonscape. Recovering slowly.',
  },
  {
    mile: 1110.4,
    name: 'Lehigh Gap Superfund Climb',
    state: 'PA',
    type: 'steep_descent',
    danger: 'moderate',
    description: 'Steep, exposed climb from Palmerton',
    conditions: 'Summer heat, wet rocks',
    safetyTips: ['Start early in summer', 'Carry lots of water', 'Watch for loose rocks'],
    notes: 'Revegetation happening. Still harsh and exposed.',
  },

  // NEW JERSEY
  {
    mile: 1195.4,
    name: 'Wallkill River Boardwalk',
    state: 'NJ',
    type: 'slippery_rocks',
    danger: 'caution',
    description: 'Long boardwalk over wetlands',
    conditions: 'Wet weather, frost',
    safetyTips: ['Slippery when wet', 'Walk carefully', 'Don\'t run'],
  },

  // NEW YORK
  {
    mile: 1267.4,
    name: 'Lemon Squeezer',
    state: 'NY',
    type: 'boulder_field',
    danger: 'caution',
    description: 'Narrow rock passage between boulders',
    conditions: 'With large packs, wet conditions',
    safetyTips: ['Remove pack to squeeze through', 'Pass pack separately'],
    notes: 'Fun obstacle! But can trap larger hikers.',
  },
  {
    mile: 1277.2,
    name: 'Bear Mountain Descent',
    state: 'NY',
    type: 'steep_descent',
    danger: 'caution',
    description: 'Steep rock steps down Bear Mountain',
    conditions: 'Crowded weekends, wet weather',
    safetyTips: ['Go slow', 'Watch for day hikers', 'Poles helpful'],
  },

  // CONNECTICUT
  {
    mile: 1461.2,
    name: 'Sages Ravine Stream Crossings',
    state: 'CT',
    type: 'river_ford',
    danger: 'caution',
    description: 'Multiple stream crossings in ravine',
    conditions: 'High water after rain',
    safetyTips: ['Rock-hop carefully', 'Water shoes helpful'],
    notes: 'Beautiful but tricky after rain.',
  },

  // MASSACHUSETTS
  {
    mile: 1590.4,
    name: 'Mt. Greylock Descent',
    state: 'MA',
    type: 'steep_descent',
    danger: 'caution',
    description: 'Steep rocky descent from summit',
    conditions: 'Wet rocks, ice in spring',
    safetyTips: ['Poles helpful', 'Watch footing'],
  },

  // VERMONT
  {
    mile: 1641.7,
    name: 'Clarendon Gorge Suspension Bridge',
    state: 'VT',
    type: 'river_ford',
    danger: 'caution',
    description: 'Suspension bridge over gorge',
    conditions: 'High winds, icy in winter',
    safetyTips: ['Hold rails', 'Don\'t bounce bridge'],
    notes: 'Beautiful gorge. Swimming hole below!',
  },
  {
    mile: 1710.7,
    name: 'Killington Peak Descent',
    state: 'VT',
    type: 'steep_descent',
    danger: 'moderate',
    description: 'Steep, wet descent from Killington',
    conditions: 'Perpetually muddy, slippery roots',
    safetyTips: ['Vermont is mud season', 'Gaiters recommended', 'Go very slow'],
    notes: 'Vermont mud is legendary. Plan for slow miles.',
  },

  // NEW HAMPSHIRE - The Whites are serious
  {
    mile: 1809.5,
    name: 'Mt. Moosilauke Summit',
    state: 'NH',
    type: 'exposed_ridge',
    danger: 'serious',
    description: 'First above-treeline peak in Whites',
    conditions: 'Thunderstorms, fog, hypothermia risk year-round',
    safetyTips: ['Check weather obsessively', 'Carry layers even in summer', 'Descend immediately in storms'],
    notes: 'Welcome to the Whites. The weather can kill you here. Respect it.',
  },
  {
    mile: 1833.0,
    name: 'Franconia Ridge Traverse',
    state: 'NH',
    type: 'exposed_ridge',
    danger: 'extreme',
    description: '2 miles above treeline on exposed knife-edge ridge',
    conditions: 'Any bad weather - this is the most dangerous section',
    safetyTips: ['NEVER cross in storms', 'Have escape routes planned', 'Watch weather constantly', 'Carry extra layers + rain gear'],
    alternateRoute: 'Old Bridle Path or Greenleaf Hut for shelter',
    notes: 'MOST DANGEROUS SECTION ON AT. Deaths every few years. Beautiful but deadly. Turn back if weather changes.',
  },
  {
    mile: 1863.0,
    name: 'Presidential Range Traverse',
    state: 'NH',
    type: 'exposed_ridge',
    danger: 'extreme',
    description: '12+ miles above treeline including Mt. Washington',
    conditions: 'Weather changes in minutes. Holds world record for surface wind speed.',
    safetyTips: ['Check Mt Washington Observatory forecast', 'Know all hut locations', 'Carry overnight gear even for day hike', 'Turn back at first sign of weather'],
    alternateRoute: 'Lakes of the Clouds Hut, Madison Spring Hut for emergency shelter',
    notes: 'MT WASHINGTON HAS THE WORST WEATHER IN THE WORLD. 6,288ft summit. Deaths every year. No shame in waiting for good weather.',
  },
  {
    mile: 1889.3,
    name: 'Carter Notch Descent',
    state: 'NH',
    type: 'steep_descent',
    danger: 'moderate',
    description: 'Very steep descent with ladders',
    conditions: 'Wet rocks, ice in cold weather',
    safetyTips: ['Use hands', 'Go very slow', 'Poles may hinder - stow them'],
  },
  {
    mile: 1902.4,
    name: 'Wildcat Ridge Traverse',
    state: 'NH',
    type: 'exposed_ridge',
    danger: 'moderate',
    description: 'Exposed ridgewalk with steep scrambles',
    conditions: 'Bad weather, wet rocks',
    safetyTips: ['Use ski gondola as escape route', 'Check weather'],
  },

  // MAINE - Remote and rugged
  {
    mile: 1925.4,
    name: 'Mahoosuc Notch',
    state: 'ME',
    type: 'boulder_field',
    danger: 'extreme',
    description: 'THE hardest mile on the AT - giant boulder cave maze',
    conditions: 'Always difficult. Ice in caves year-round. Takes 2-4 hours for 1 mile.',
    safetyTips: ['Remove pack frequently', 'Wear pants not shorts', 'Scout before committing', 'Start early - no place to camp inside'],
    notes: 'NOTORIOUSLY DIFFICULT. Hikers have been trapped. Go slow, stay focused. Ice caves in July.',
  },
  {
    mile: 1928.8,
    name: 'Mahoosuc Arm',
    state: 'ME',
    type: 'steep_descent',
    danger: 'serious',
    description: 'Steepest mile on AT - 1,500ft in 0.8 miles',
    conditions: 'Wet weather, fatigue after Notch',
    safetyTips: ['Hand-over-hand in places', 'Poles hinder - stow them', 'Take your time'],
    notes: 'Right after the Notch. The hits keep coming. Brutal.',
  },
  {
    mile: 2014.4,
    name: 'Saddleback Range',
    state: 'ME',
    type: 'exposed_ridge',
    danger: 'moderate',
    description: 'Extended above-treeline traverse',
    conditions: 'Fog, storms, wind',
    safetyTips: ['Watch for cairns', 'Carry rain gear', 'Know bail points'],
  },
  {
    mile: 2058.8,
    name: 'Bigelow Range Traverse',
    state: 'ME',
    type: 'exposed_ridge',
    danger: 'moderate',
    description: 'Long ridge with multiple summits',
    conditions: 'Weather, fatigue',
    safetyTips: ['Plan water carefully', 'Check weather', 'Have bail points'],
    notes: 'One of the most beautiful traverses in Maine.',
  },
  {
    mile: 2100.5,
    name: 'Gulf Hagas Area Fords',
    state: 'ME',
    type: 'river_ford',
    danger: 'moderate',
    description: 'Multiple stream fords in 100-mile wilderness',
    conditions: 'High water after rain - can be impassable',
    safetyTips: ['Scout crossings', 'Unbuckle pack hip belt', 'Use trekking poles', 'Be willing to wait'],
    notes: '100-mile wilderness has NO BAILOUTS for help. Be prepared.',
  },
  {
    mile: 2190.4,
    name: 'Hunt Trail - Katahdin',
    state: 'ME',
    type: 'exposed_ridge',
    danger: 'extreme',
    description: 'Final climb - 5 miles, 4,000ft. Iron rungs, exposed scrambles.',
    conditions: 'Rangers close trail in bad weather. Above treeline from mile 3.',
    safetyTips: ['Start before 7am', 'Check ranger forecast', 'Carry extra food/water', 'Turn back if weather changes'],
    alternateRoute: 'Knife Edge (harder) or Saddle Trail for descent',
    notes: 'THE FINAL CHALLENGE. Baxter Park rangers close trail in bad weather - no exceptions. Your thru-hike may require waiting. Worth it.',
  },
];

// ============================================================================
// HELPER FUNCTIONS FOR NEW DATA
// ============================================================================

export function getRoadCrossingsInRange(startMile: number, endMile: number): RoadCrossing[] {
  return ROAD_CROSSINGS.filter(r => r.mile >= startMile && r.mile <= endMile);
}

export function getNextRoadCrossing(mile: number): RoadCrossing | undefined {
  return ROAD_CROSSINGS.find(r => r.mile > mile);
}

export function getWaterSourcesInRange(startMile: number, endMile: number): WaterSource[] {
  return FAMOUS_WATER_SOURCES.filter(w => w.mile >= startMile && w.mile <= endMile);
}

export function getNearestWaterSource(mile: number): WaterSource | undefined {
  return binarySearchNearest(FAMOUS_WATER_SOURCES, mile, 'mile');
}

export function getDangerousCrossingsInRange(startMile: number, endMile: number): DangerousCrossing[] {
  return DANGEROUS_CROSSINGS.filter(d => d.mile >= startMile && d.mile <= endMile);
}

export function getNextDangerousCrossing(mile: number): DangerousCrossing | undefined {
  return DANGEROUS_CROSSINGS.find(d => d.mile > mile);
}

export function getTrailMagicSpots(mile: number, range: number = 50): RoadCrossing[] {
  return ROAD_CROSSINGS.filter(r =>
    r.mile >= mile - range &&
    r.mile <= mile + range &&
    (r.trailMagicFrequency === 'frequent' || r.trailMagicFrequency === 'common')
  );
}

export function getHazardWarnings(mile: number, lookahead: number = 20): DangerousCrossing[] {
  return DANGEROUS_CROSSINGS.filter(d =>
    d.mile >= mile &&
    d.mile <= mile + lookahead &&
    (d.danger === 'serious' || d.danger === 'extreme')
  );
}

// ============================================================================
// WILDLIFE ENCOUNTER ZONES - Where Animals Are Commonly Seen
// ============================================================================

export type WildlifeType = 'bear' | 'deer' | 'moose' | 'snake' | 'turkey' | 'grouse' | 'porcupine' | 'skunk' | 'raccoon' | 'fox' | 'coyote' | 'bobcat' | 'eagle' | 'owl' | 'salamander' | 'mouse';
export type EncounterFrequency = 'rare' | 'occasional' | 'common' | 'very_common';
export type WildlifeDanger = 'harmless' | 'caution' | 'dangerous';

export interface WildlifeZone {
  startMile: number;
  endMile: number;
  animal: WildlifeType;
  frequency: EncounterFrequency;
  danger: WildlifeDanger;
  bestTime: 'dawn' | 'day' | 'dusk' | 'night' | 'any';
  description: string;
  behavior: string;
  notes?: string;
}

export const WILDLIFE_ZONES: WildlifeZone[] = [
  // BEAR ZONES - Black bears throughout, concentrated areas
  { startMile: 0, endMile: 78, animal: 'bear', frequency: 'common', danger: 'caution', bestTime: 'any', description: 'Georgia bears are habituated to hikers', behavior: 'Food-seeking, especially at shelters', notes: 'Hang your food! Bear canisters recommended.' },
  { startMile: 166, endMile: 241, animal: 'bear', frequency: 'very_common', danger: 'caution', bestTime: 'any', description: 'Smokies have highest bear density on AT', behavior: 'Bold and curious. Will approach hikers.', notes: 'MANDATORY bear cables at shelters. Never run!' },
  { startMile: 765, endMile: 856, animal: 'bear', frequency: 'very_common', danger: 'caution', bestTime: 'dusk', description: 'Shenandoah bears are everywhere', behavior: 'Habituated to humans but still wild', notes: 'Use bear poles at shelters. Make noise on trail.' },
  { startMile: 2093, endMile: 2197, animal: 'bear', frequency: 'common', danger: 'caution', bestTime: 'any', description: 'Maine wilderness bears', behavior: 'Less habituated, more wary', notes: 'Remote area - practice bear safety.' },

  // MOOSE ZONES - Maine and NH
  { startMile: 1754, endMile: 1912, animal: 'moose', frequency: 'occasional', danger: 'dangerous', bestTime: 'dawn', description: 'White Mountains moose territory', behavior: 'Unpredictable. Bulls dangerous in rut (Sept-Oct).', notes: 'NEVER approach. Give 100+ feet. Back away slowly.' },
  { startMile: 1912, endMile: 2197, animal: 'moose', frequency: 'common', danger: 'dangerous', bestTime: 'dawn', description: 'Prime Maine moose country', behavior: 'Can be aggressive, especially cows with calves', notes: 'Moose kill more people than bears. They look docile but arent!' },

  // DEER - Everywhere
  { startMile: 0, endMile: 500, animal: 'deer', frequency: 'very_common', danger: 'harmless', bestTime: 'dawn', description: 'White-tailed deer throughout southern AT', behavior: 'Skittish, will bound away', notes: 'Nice to watch. Non-threatening.' },
  { startMile: 500, endMile: 1100, animal: 'deer', frequency: 'very_common', danger: 'harmless', bestTime: 'dawn', description: 'Virginia and mid-Atlantic deer', behavior: 'Very common, often seen in groups', notes: 'Especially around farms and fields.' },
  { startMile: 1100, endMile: 1600, animal: 'deer', frequency: 'common', danger: 'harmless', bestTime: 'dawn', description: 'Northern deer', behavior: 'More wary in hunting areas', notes: 'Wear orange in hunting season!' },

  // VENOMOUS SNAKES
  { startMile: 0, endMile: 241, animal: 'snake', frequency: 'occasional', danger: 'dangerous', bestTime: 'day', description: 'Rattlesnakes and copperheads in southern AT', behavior: 'Coiled in rocks, sunning on trail', notes: 'Watch where you step and put hands. They want to avoid you.' },
  { startMile: 620, endMile: 700, animal: 'snake', frequency: 'common', danger: 'dangerous', bestTime: 'day', description: 'Timber rattlesnakes in VA rock areas', behavior: 'Love rocky outcrops and ledges', notes: 'Dragons Tooth and McAfee areas. Be alert on rocks.' },
  { startMile: 930, endMile: 1150, animal: 'snake', frequency: 'common', danger: 'dangerous', bestTime: 'day', description: 'PA rocks = rattlesnake heaven', behavior: 'Sun on rocks, hide in crevices', notes: 'Very common. Watch every step on rocky sections.' },

  // WILD TURKEYS
  { startMile: 0, endMile: 500, animal: 'turkey', frequency: 'common', danger: 'harmless', bestTime: 'dawn', description: 'Wild turkeys in southern forests', behavior: 'Loud, travel in groups, will fly explosively', notes: 'Startling but harmless. Fun to watch.' },
  { startMile: 500, endMile: 900, animal: 'turkey', frequency: 'very_common', danger: 'harmless', bestTime: 'dawn', description: 'Virginia turkey country', behavior: 'Gobbling at dawn is memorable', notes: 'Listen for gobbles in spring.' },

  // GROUSE
  { startMile: 1500, endMile: 1750, animal: 'grouse', frequency: 'common', danger: 'harmless', bestTime: 'any', description: 'Ruffed grouse in New England', behavior: 'Explosive flush from cover - heart attack birds!', notes: 'Will scare you half to death. Then youll laugh.' },
  { startMile: 1750, endMile: 2197, animal: 'grouse', frequency: 'common', danger: 'harmless', bestTime: 'any', description: 'Spruce grouse in northern woods', behavior: 'Less skittish than ruffed grouse', notes: 'Called "fool hen" - very tame.' },

  // PORCUPINES
  { startMile: 1500, endMile: 2197, animal: 'porcupine', frequency: 'occasional', danger: 'caution', bestTime: 'night', description: 'Porcupines in northern New England', behavior: 'Slow-moving, will eat anything salty (sweat, trekking poles!)', notes: 'Dont leave gear out! Theyll chew through packs for salt.' },

  // SKUNKS AND RACCOONS - Shelter bandits
  { startMile: 0, endMile: 2197, animal: 'skunk', frequency: 'occasional', danger: 'caution', bestTime: 'night', description: 'Skunks at shelters and food areas', behavior: 'Scavenging at night, will spray if startled', notes: 'Dont startle! Give them space. Theyre more scared of you.' },
  { startMile: 0, endMile: 1500, animal: 'raccoon', frequency: 'common', danger: 'caution', bestTime: 'night', description: 'Raccoons everywhere, especially at shelters', behavior: 'Clever food thieves, can be aggressive', notes: 'Hang your food! They can open zippers and buckles.' },

  // MICE - The real shelter menace
  { startMile: 0, endMile: 2197, animal: 'mouse', frequency: 'very_common', danger: 'caution', bestTime: 'night', description: 'Mice at EVERY shelter', behavior: 'Will run across your face. Chew through everything.', notes: 'Hang food from mouse hangers. Hantavirus risk - dont breathe dust.' },

  // OWLS
  { startMile: 0, endMile: 2197, animal: 'owl', frequency: 'occasional', danger: 'harmless', bestTime: 'night', description: 'Barred owls throughout', behavior: 'WHO COOKS FOR YOU? calls at night', notes: 'Magical to hear. Means healthy forest.' },

  // SALAMANDERS - Special mention
  { startMile: 166, endMile: 241, animal: 'salamander', frequency: 'very_common', danger: 'harmless', bestTime: 'day', description: 'Smokies are salamander capital of world!', behavior: 'Under rocks and logs, especially after rain', notes: '30+ species! Dont handle - oils harm them.' },
];

// ============================================================================
// SEASONAL CONDITIONS - What to Expect Each Season
// ============================================================================

export type Season = 'spring' | 'summer' | 'fall' | 'winter';

export interface SeasonalCondition {
  startMile: number;
  endMile: number;
  season: Season;
  condition: string;
  difficulty: 'easier' | 'normal' | 'harder' | 'extreme';
  notes: string;
}

export const SEASONAL_CONDITIONS: SeasonalCondition[] = [
  // GEORGIA Spring
  { startMile: 0, endMile: 78, season: 'spring', condition: 'Crowded! March-April is peak thru-hiker bubble', difficulty: 'normal', notes: 'Expect full shelters. Wildflowers blooming. Occasional cold snaps.' },
  { startMile: 0, endMile: 78, season: 'summer', condition: 'Hot and humid, but shelters empty', difficulty: 'harder', notes: 'Heat and humidity brutal. Fewer hikers. Thunderstorm season.' },
  { startMile: 0, endMile: 78, season: 'fall', condition: 'SOBO hikers, pleasant temps, fall colors', difficulty: 'easier', notes: 'Beautiful time to hike. SOBO bubble passing through.' },
  { startMile: 0, endMile: 78, season: 'winter', condition: 'Cold, icy, shorter days', difficulty: 'harder', notes: 'Possible ice/snow. Fewer services. Quiet solitude.' },

  // SMOKIES - All seasons challenging
  { startMile: 166, endMile: 241, season: 'spring', condition: 'Unpredictable weather, snow possible through May', difficulty: 'harder', notes: 'Spring in Smokies is winter in Georgia. Pack layers!' },
  { startMile: 166, endMile: 241, season: 'summer', condition: 'Crowded, humid, afternoon thunderstorms daily', difficulty: 'normal', notes: 'Start early to beat afternoon storms on balds.' },
  { startMile: 166, endMile: 241, season: 'fall', condition: 'Best weather, incredible fall colors', difficulty: 'easier', notes: 'Peak season. Reservations required for shelters.' },
  { startMile: 166, endMile: 241, season: 'winter', condition: 'Serious winter conditions, closures possible', difficulty: 'extreme', notes: 'Road closures, icy trail, short days. Experienced only.' },

  // VIRGINIA Spring
  { startMile: 469, endMile: 550, season: 'spring', condition: 'Rhododendron blooming, pleasant temps', difficulty: 'normal', notes: 'Beautiful time. May rains can make streams high.' },
  { startMile: 550, endMile: 765, season: 'summer', condition: 'Green tunnel, hot and humid, bugs', difficulty: 'harder', notes: 'Virginia blues set in. Long, monotonous green tunnel.' },

  // SHENANDOAH
  { startMile: 765, endMile: 856, season: 'spring', condition: 'Park services opening, wildflowers', difficulty: 'normal', notes: 'Some facilities still closed early spring.' },
  { startMile: 765, endMile: 856, season: 'summer', condition: 'Tourist crowds, full services, hot', difficulty: 'normal', notes: 'Waysides and lodges all open. Easy resupply.' },
  { startMile: 765, endMile: 856, season: 'fall', condition: 'Peak fall foliage brings massive crowds', difficulty: 'normal', notes: 'Skyline Drive packed. Beautiful but busy.' },

  // PENNSYLVANIA
  { startMile: 930, endMile: 1149, season: 'spring', condition: 'Rocks still rocks, but temps nice', difficulty: 'harder', notes: 'No season makes PA rocks easier. May be muddy.' },
  { startMile: 930, endMile: 1149, season: 'summer', condition: 'Hot, rocks radiate heat, water scarce', difficulty: 'harder', notes: 'Carry extra water. Start early to beat heat.' },
  { startMile: 930, endMile: 1149, season: 'fall', condition: 'Best time for PA - cool temps, dry rocks', difficulty: 'normal', notes: 'Hunting season - wear orange!' },

  // VERMONT
  { startMile: 1550, endMile: 1750, season: 'spring', condition: 'MUD SEASON - trail literally impassable in places', difficulty: 'extreme', notes: 'April-May is brutal. Trail may be closed. Consider skipping.' },
  { startMile: 1550, endMile: 1750, season: 'summer', condition: 'Bugs! Black flies in June, mosquitoes all summer', difficulty: 'harder', notes: 'Head net and bug spray essential. Still muddy in spots.' },
  { startMile: 1550, endMile: 1750, season: 'fall', condition: 'Stunning foliage, dry trail, perfect temps', difficulty: 'easier', notes: 'Peak September is magical. Less crowds than Whites.' },

  // WHITE MOUNTAINS - Serious all seasons
  { startMile: 1754, endMile: 1912, season: 'spring', condition: 'Winter conditions through May, snow likely', difficulty: 'extreme', notes: 'Full winter gear required. Ice axes, crampons for above treeline.' },
  { startMile: 1754, endMile: 1912, season: 'summer', condition: 'Best window (July-Aug) but weather always dangerous', difficulty: 'harder', notes: 'Check Mt Washington Observatory forecast DAILY. Storms form fast.' },
  { startMile: 1754, endMile: 1912, season: 'fall', condition: 'Colors beautiful but winter comes early', difficulty: 'harder', notes: 'Snow possible September. Be prepared for anything.' },
  { startMile: 1754, endMile: 1912, season: 'winter', condition: 'Full alpine winter - this is serious mountaineering', difficulty: 'extreme', notes: 'Only for experienced winter mountaineers. Deaths occur.' },

  // MAINE 100-Mile
  { startMile: 2093, endMile: 2197, season: 'spring', condition: 'Snow, high water, black flies, remote', difficulty: 'extreme', notes: 'Not recommended before July. Fords can be dangerous.' },
  { startMile: 2093, endMile: 2197, season: 'summer', condition: 'Bugs diminish in August, best conditions', difficulty: 'harder', notes: 'Baxter State Park closes Oct 15. Time your approach.' },
  { startMile: 2093, endMile: 2197, season: 'fall', condition: 'Cold nights, but beautiful. Daylight shrinking.', difficulty: 'harder', notes: 'Get to Katahdin before Oct 15! Park closes for winter.' },
];

// ============================================================================
// TRAIL MAGIC TIMING - When to Expect Trail Magic
// ============================================================================

export interface TrailMagicEvent {
  startMile: number;
  endMile: number;
  name: string;
  timing: string;            // When does this happen?
  probability: number;       // 0-1 likelihood on any given day
  description: string;
  notes?: string;
}

export const TRAIL_MAGIC_EVENTS: TrailMagicEvent[] = [
  { startMile: 30.7, endMile: 30.7, name: 'Neels Gap Magic', timing: 'March-April weekends', probability: 0.8, description: 'Trail magic at Mountain Crossings outfitter', notes: 'Hikers often overwhelmed here. Good vibes.' },
  { startMile: 56.3, endMile: 56.3, name: 'Unicoi Gap Setup', timing: 'March-April', probability: 0.5, description: 'Local angels set up at parking area', notes: 'Weekends especially' },
  { startMile: 135.8, endMile: 135.8, name: 'NOC Area', timing: 'Year-round', probability: 0.3, description: 'Random trail magic at NOC crossing', notes: 'Staff and locals generous' },
  { startMile: 273.2, endMile: 273.2, name: 'Hot Springs Town', timing: 'April-May', probability: 0.6, description: 'Free food and lodging often offered', notes: 'Hippie town with hiker hospitality' },
  { startMile: 331.8, endMile: 331.8, name: 'Uncle Johnnys Shuttle Pickup', timing: 'March-June', probability: 0.4, description: 'Trail magic at Spivey Gap', notes: 'Uncle Johnny is legendary' },
  { startMile: 376.6, endMile: 376.6, name: 'Carvers Gap Day Hikers', timing: 'May-October', probability: 0.5, description: 'Day hikers share food at gap', notes: 'Rhododendron season is peak' },
  { startMile: 467.2, endMile: 467.2, name: 'Damascus Everything', timing: 'April-May, especially Trail Days', probability: 0.9, description: 'Trail magic is Damascus way of life', notes: 'Trail Days (May) is legendary - whole town celebrates hikers' },
  { startMile: 629.8, endMile: 629.8, name: 'Home Place Sunday', timing: 'Sundays April-October', probability: 0.7, description: 'Church groups set up near Catawba', notes: 'After church = trail magic time' },
  { startMile: 643.2, endMile: 643.2, name: 'McAfee Knob Weekend', timing: 'Weekends year-round', probability: 0.4, description: 'Day hikers share at parking area', notes: 'Most popular day hike on AT' },
  { startMile: 765.6, endMile: 856.5, name: 'Shenandoah Waysides', timing: 'May-October', probability: 0.2, description: 'Random magic at park facilities', notes: 'Park visitors generous to thru-hikers' },
  { startMile: 888.2, endMile: 888.2, name: 'Harpers Ferry ATC', timing: 'April-June', probability: 0.5, description: 'Magic near ATC headquarters', notes: 'Psychological halfway celebration' },
  { startMile: 931.6, endMile: 931.6, name: 'Pen-Mar Park Magic', timing: 'Weekends May-September', probability: 0.6, description: 'Community often sets up coolers', notes: 'Historic picnic area tradition' },
  { startMile: 1008.2, endMile: 1008.2, name: 'Boiling Springs Churches', timing: 'Weekends April-June', probability: 0.5, description: 'Church-sponsored trail magic at park', notes: 'Community supports hikers' },
  { startMile: 1070.8, endMile: 1070.8, name: 'Port Clinton Pavilion', timing: 'May-June weekends', probability: 0.4, description: 'Locals bring food to hiker pavilion', notes: 'Community embraces thru-hikers' },
  { startMile: 1149.3, endMile: 1149.3, name: 'Delaware Water Gap Church', timing: 'April-June', probability: 0.7, description: 'Presbyterian Church hostel + magic', notes: 'Legendary hospitality' },
  { startMile: 1534.7, endMile: 1534.7, name: 'Upper Goose Pond Pancakes', timing: 'July-August', probability: 0.9, description: 'Caretaker makes pancakes for hikers!', notes: 'AMC tradition - legendary stop' },
  { startMile: 1746.6, endMile: 1746.6, name: 'Dartmouth Students', timing: 'School year', probability: 0.4, description: 'Dartmouth Outing Club supports hikers', notes: 'College kids generous' },
  { startMile: 1896.6, endMile: 1896.6, name: 'Pinkham Notch AMC', timing: 'Year-round', probability: 0.3, description: 'Random kindness from AMC staff/visitors', notes: 'Thru-hiker showers available!' },
  { startMile: 2093.0, endMile: 2093.0, name: 'Monson Pre-100-Mile', timing: 'July-September', probability: 0.6, description: 'Shaws and townspeople send hikers off right', notes: 'Last town celebration before finish' },
  { startMile: 2160.4, endMile: 2160.4, name: 'Abol Bridge Final Magic', timing: 'July-September', probability: 0.4, description: 'Random magic from other finishers/locals', notes: 'Last chance before Katahdin!' },
];

// ============================================================================
// SUNRISE/SUNSET VIEW SPOTS - Worth Timing Your Hike For
// ============================================================================

export interface ViewSpot {
  mile: number;
  name: string;
  state: string;
  bestFor: 'sunrise' | 'sunset' | 'both';
  direction: 'east' | 'west' | 'panoramic';
  description: string;
  campNearby: boolean;      // Can you camp to catch sunrise/sunset?
  notes?: string;
}

export const VIEW_SPOTS: ViewSpot[] = [
  // GEORGIA
  { mile: 0, name: 'Springer Mountain', state: 'GA', bestFor: 'sunrise', direction: 'east', description: 'Start your thru-hike with sunrise', campNearby: true, notes: 'Shelter 0.2 miles - camp there for sunrise start' },
  { mile: 28.9, name: 'Blood Mountain', state: 'GA', bestFor: 'sunrise', direction: 'panoramic', description: 'Highest peak in Georgia, 360° views', campNearby: true, notes: 'Shelter at summit but no water' },

  // NORTH CAROLINA
  { mile: 113.3, name: 'Siler Bald', state: 'NC', bestFor: 'sunset', direction: 'west', description: 'Open bald with western views', campNearby: true },
  { mile: 121.8, name: 'Wayah Bald Tower', state: 'NC', bestFor: 'both', direction: 'panoramic', description: 'Stone tower with 360° views', campNearby: true },

  // SMOKIES
  { mile: 209.0, name: 'Kuwohi (Clingmans Dome)', state: 'TN/NC', bestFor: 'sunrise', direction: 'panoramic', description: 'Highest point on AT - watch sun rise over clouds', campNearby: false, notes: 'No camping near summit. Worth the early start from shelter.' },

  // ROAN HIGHLANDS
  { mile: 377.5, name: 'Round Bald', state: 'TN', bestFor: 'sunset', direction: 'west', description: 'Grassy bald with incredible sunset views', campNearby: true, notes: 'One of the best sunset spots on entire AT' },
  { mile: 379.3, name: 'Roan High Knob', state: 'TN', bestFor: 'sunrise', direction: 'east', description: 'Highest shelter on AT - sunrise from 6,275ft', campNearby: true, notes: 'Camp at shelter for dawn views' },
  { mile: 386.4, name: 'Overmountain Shelter', state: 'NC', bestFor: 'sunrise', direction: 'east', description: 'Barn shelter overlooking valley', campNearby: true, notes: 'Famous sunrise from barn loft' },

  // VIRGINIA
  { mile: 600.2, name: 'Angels Rest', state: 'VA', bestFor: 'sunset', direction: 'west', description: 'Rocky overlook above Pearisburg', campNearby: false, notes: 'Day hike or time your passage for sunset' },
  { mile: 633.8, name: 'Dragons Tooth', state: 'VA', bestFor: 'sunset', direction: 'west', description: 'Rock spire with western views', campNearby: false, notes: 'Dramatic rock formation at sunset' },
  { mile: 643.2, name: 'McAfee Knob', state: 'VA', bestFor: 'sunrise', direction: 'east', description: 'THE most photographed spot on AT', campNearby: true, notes: 'Camp at Catawba Shelter and hike up for sunrise. Iconic.' },
  { mile: 652.5, name: 'Tinker Cliffs', state: 'VA', bestFor: 'sunset', direction: 'west', description: 'Mile-long cliff walk', campNearby: false, notes: 'Better for sunset. Lamberts Meadow Shelter nearby.' },
  { mile: 867.6, name: 'Bears Den', state: 'VA', bestFor: 'sunset', direction: 'west', description: 'Rocky outcrop with hostel', campNearby: true, notes: 'Hostel has sunset views' },

  // NEW YORK
  { mile: 1277.2, name: 'Bear Mountain', state: 'NY', bestFor: 'sunrise', direction: 'east', description: 'Views over Hudson River', campNearby: false, notes: 'Watch sunrise over the Hudson' },

  // VERMONT
  { mile: 1590.4, name: 'Mt. Greylock', state: 'MA', bestFor: 'sunrise', direction: 'east', description: 'Highest peak in MA, stone tower', campNearby: true, notes: 'Bascom Lodge offers bunks' },
  { mile: 1638.2, name: 'Stratton Mountain', state: 'VT', bestFor: 'both', direction: 'panoramic', description: 'Fire tower with 360° views - birthplace of AT', campNearby: true, notes: 'Where Benton MacKaye conceived the AT' },
  { mile: 1710.7, name: 'Killington Peak', state: 'VT', bestFor: 'sunrise', direction: 'east', description: 'Second highest peak in Vermont', campNearby: true, notes: 'Cooper Lodge nearby for overnight' },

  // WHITE MOUNTAINS
  { mile: 1809.5, name: 'Mt. Moosilauke', state: 'NH', bestFor: 'sunrise', direction: 'east', description: 'First above-treeline peak in Whites', campNearby: false, notes: 'Start early from Beaver Brook Shelter for sunrise summit' },
  { mile: 1833.0, name: 'Franconia Ridge', state: 'NH', bestFor: 'both', direction: 'panoramic', description: 'Most spectacular ridge on AT', campNearby: false, notes: 'Greenleaf Hut below for overnight. Time traverse for golden hour.' },
  { mile: 1838.7, name: 'Mt. Lafayette', state: 'NH', bestFor: 'sunrise', direction: 'east', description: 'Highest peak in Franconia Range', campNearby: false, notes: 'Greenleaf Hut is closest overnight' },
  { mile: 1863.0, name: 'Mt. Washington', state: 'NH', bestFor: 'sunrise', direction: 'panoramic', description: 'Highest peak in Northeast!', campNearby: true, notes: 'Lakes of the Clouds Hut 1.5mi below. Sunrise from summit is legendary.' },
  { mile: 1909.3, name: 'Carter Dome', state: 'NH', bestFor: 'sunset', direction: 'west', description: 'Views back to Presidentials', campNearby: true, notes: 'Carter Notch Hut below' },

  // MAINE
  { mile: 1953.7, name: 'Baldpate Mountain', state: 'ME', bestFor: 'sunrise', direction: 'east', description: 'Open ledges with dawn views', campNearby: true },
  { mile: 2014.4, name: 'Saddleback Mountain', state: 'ME', bestFor: 'both', direction: 'panoramic', description: 'Alpine zone with expansive views', campNearby: true },
  { mile: 2058.8, name: 'Bigelow Range', state: 'ME', bestFor: 'sunset', direction: 'west', description: 'Views over Flagstaff Lake', campNearby: true, notes: 'Beautiful sunset over lake' },
  { mile: 2111.8, name: 'White Cap Mountain', state: 'ME', bestFor: 'sunrise', direction: 'east', description: 'First views of Katahdin!', campNearby: true, notes: 'Seeing Katahdin at sunrise is emotional' },
  { mile: 2143.6, name: 'Rainbow Ledges', state: 'ME', bestFor: 'both', direction: 'panoramic', description: 'Views of Rainbow Lake and Katahdin', campNearby: true },
  { mile: TRAIL_TOTAL_MILES, name: 'Baxter Peak - Katahdin', state: 'ME', bestFor: 'sunrise', direction: 'east', description: 'THE END - First light hits Maine first', campNearby: false, notes: 'Camp at Katahdin Stream, start at 5am for sunrise summit. The ultimate.' },
];

// ============================================================================
// HIKER TRADITIONS AND RITUALS - What Thru-Hikers Do
// ============================================================================

export interface HikerTradition {
  mile: number;
  name: string;
  tradition: string;
  description: string;
  optional: boolean;        // Is this expected or optional?
  notes?: string;
}

export const HIKER_TRADITIONS: HikerTradition[] = [
  // SPRINGER
  { mile: 0, name: 'Springer Summit Plaque', tradition: 'Touch the plaque and take your photo', description: 'The official start - everyone photographs the bronze plaque', optional: false, notes: 'Sign the register at Springer shelter!' },
  { mile: 0, name: 'Sign the Register', tradition: 'Write your trail name and date in shelter register', description: 'First of many shelter registers youll sign', optional: false },

  // NEELS GAP
  { mile: 30.7, name: 'Walk Through the Outfitter', tradition: 'The AT goes THROUGH Mountain Crossings store', description: 'Only building the AT passes through. Buy something!', optional: false, notes: 'Free pack shakedowns. Many quit here - 20% dropout rate by mile 30.' },

  // FONTANA DAM
  { mile: 166.2, name: 'Fontana Hilton', tradition: 'Stay at the famous shelter before Smokies', description: 'Legendary shelter with showers nearby. Last hot shower for 72 miles.', optional: false, notes: 'Get your Smokies permit here!' },

  // SMOKIES
  { mile: 209.0, name: 'Clingmans Dome Tower', tradition: 'Walk the spiral to highest point', description: 'Climb the observation tower at highest point on AT', optional: false, notes: 'Often socked in with clouds. Go anyway.' },

  // HOT SPRINGS
  { mile: 273.2, name: 'Hot Springs Soak', tradition: 'Soak in the hot tubs by the river', description: 'Natural hot springs - first real soak since Fontana', optional: false, notes: 'Pay for private tub or free in river. Tradition since 1800s.' },

  // ROAN
  { mile: 379.3, name: 'Highest Shelter Night', tradition: 'Stay at Roan High Knob Shelter', description: 'Sleep at 6,275ft - highest shelter on entire AT', optional: true, notes: 'Cold even in summer. Worth it for the experience.' },

  // DAMASCUS
  { mile: 467.2, name: 'Damascus Tradition', tradition: 'Zero day in Trail Town USA', description: 'At least one full day in the friendliest trail town', optional: false, notes: 'Multiple hostels, free camping, legendary hospitality' },
  { mile: 467.2, name: 'Trail Days Return', tradition: 'Come back for Trail Days festival in May', description: 'Hikers return after finishing to celebrate', optional: true, notes: 'Biggest trail gathering. Hiker parade, talent show, chaos.' },

  // MCAFEE KNOB
  { mile: 643.2, name: 'McAfee Knob Photo', tradition: 'Take THE photo on the rock', description: 'Sit on the iconic rock jutting into space', optional: false, notes: 'Most photographed spot on AT. Be careful - deaths have occurred.' },

  // HARPERS FERRY
  { mile: 888.2, name: 'ATC Photo Wall', tradition: 'Take your official thru-hiker photo at ATC', description: 'Staff photographs you for the annual yearbook', optional: false, notes: 'Free! Sign the thru-hiker register. Youre officially halfway (psychologically).' },
  { mile: 888.2, name: 'Town Exploration', tradition: 'Explore historic Harpers Ferry', description: 'Where John Browns raid happened. Great restaurants, history.', optional: true },

  // HALFWAY MARKER
  { mile: 1098.9, name: 'True Halfway Point', tradition: 'Find the actual halfway marker', description: 'Pine Grove Furnace area - true mathematical halfway', optional: true, notes: 'Different from ATC "psychological" halfway' },
  { mile: 1009.2, name: 'Half Gallon Challenge', tradition: 'Eat half gallon of ice cream at Pine Grove Furnace', description: 'General store tradition - eat 1/2 gallon to celebrate halfway!', optional: true, notes: 'Only 25% of hikers finish it. Brain freeze and regret common.' },

  // DELAWARE WATER GAP
  { mile: 1149.3, name: 'Church of the Mountain', tradition: 'Stay at the Presbyterian Church hostel', description: 'Famous hiker hostel in church basement', optional: true, notes: 'Donation-based. Legendary hospitality since 1976.' },

  // NEW YORK
  { mile: 1277.2, name: 'Bear Mountain Zoo Walk', tradition: 'Walk through the Trailside Zoo', description: 'AT literally goes through a small zoo', optional: false, notes: 'See bears, eagles, etc. Free for thru-hikers.' },

  // VERMONT
  { mile: 1638.2, name: 'Stratton Tower', tradition: 'Climb tower where MacKaye conceived AT', description: 'Honor the birthplace of your thru-hike', optional: false, notes: 'Benton MacKaye stood here and dreamed the whole trail.' },

  // UPPER GOOSE POND
  { mile: 1534.7, name: 'Pancake Cabin', tradition: 'Stay at cabin, eat caretaker pancakes', description: 'AMC caretaker makes pancakes for hikers!', optional: true, notes: 'Cabin on pond. Magical. One of best nights on trail.' },

  // HANOVER
  { mile: 1746.6, name: 'Dartmouth Hospitality', tradition: 'Pizza, town walking, college experience', description: 'Walk through Dartmouth campus, eat lots', optional: false, notes: 'Great pizza. College students are generous.' },

  // WHITES
  { mile: 1809.5, name: 'Welcome to Whites', tradition: 'Reflect on what youre about to face', description: 'Moosilauke is first above-treeline peak. Reality check.', optional: false, notes: 'Everything changes now. Pace yourself.' },
  { mile: 1863.0, name: 'Mt. Washington Summit House', tradition: 'Buy overpriced food, brag about hiking up', description: 'Eat terrible expensive food, look smug at tourists', optional: true, notes: 'You EARNED this overpriced burger.' },

  // MAINE
  { mile: 1912.5, name: 'Goodbye to Whites', tradition: 'Celebrate surviving New Hampshire', description: 'Maine state line - hardest is behind you', optional: false, notes: 'Maine is hard but different. Youve got this.' },
  { mile: 2093.0, name: 'Last Town Zero', tradition: 'Full rest day in Monson before 100-mile', description: 'Prepare mind and body for final push', optional: false, notes: 'Shaws hostel legendary. Eat everything. Resupply carefully.' },
  { mile: 2093.0, name: '100-Mile Sign Photo', tradition: 'Photo at the 100-mile wilderness sign', description: 'Mark the beginning of the end', optional: false, notes: 'No resupply, no easy bailout for 100 miles. You ready?' },
  { mile: 2160.4, name: 'Abol Bridge View', tradition: 'First full view of Katahdin from Abol', description: 'See your destination. Its real. Its there.', optional: false, notes: 'Most hikers cry. Last store. Last easy night.' },
  { mile: TRAIL_TOTAL_MILES, name: 'Katahdin Summit Sign', tradition: 'Touch the sign. Take the photo. Cry.', description: 'THE moment. Touch the famous brown sign.', optional: false, notes: `You did it. All ${TRAIL_TOTAL_MILES.toLocaleString()} miles. Take it in. Then figure out how to get down.` },
];

// ============================================================================
// HELPER FUNCTIONS FOR NEW DATA
// ============================================================================

export function getWildlifeInZone(mile: number): WildlifeZone[] {
  return WILDLIFE_ZONES.filter(w => mile >= w.startMile && mile <= w.endMile);
}

export function getSeasonalConditions(mile: number, season: Season): SeasonalCondition[] {
  return SEASONAL_CONDITIONS.filter(c => mile >= c.startMile && mile <= c.endMile && c.season === season);
}

export function getTrailMagicProbability(mile: number): TrailMagicEvent[] {
  return TRAIL_MAGIC_EVENTS.filter(e => mile >= e.startMile && mile <= e.endMile);
}

export function getViewSpotsInRange(startMile: number, endMile: number): ViewSpot[] {
  return VIEW_SPOTS.filter(v => v.mile >= startMile && v.mile <= endMile);
}

export function getSunriseSpots(mile: number, range: number = 20): ViewSpot[] {
  return VIEW_SPOTS.filter(v =>
    v.mile >= mile && v.mile <= mile + range &&
    (v.bestFor === 'sunrise' || v.bestFor === 'both')
  );
}

export function getSunsetSpots(mile: number, range: number = 20): ViewSpot[] {
  return VIEW_SPOTS.filter(v =>
    v.mile >= mile && v.mile <= mile + range &&
    (v.bestFor === 'sunset' || v.bestFor === 'both')
  );
}

export function getTraditionsAtLocation(mile: number): HikerTradition[] {
  return HIKER_TRADITIONS.filter(t => Math.abs(t.mile - mile) < 5);
}

export function getUpcomingTraditions(mile: number, lookahead: number = 50): HikerTradition[] {
  return HIKER_TRADITIONS.filter(t => t.mile >= mile && t.mile <= mile + lookahead);
}

// ============================================================================
// TRAIL HISTORY - Historical Events and Lore
// ============================================================================

export interface TrailHistory {
  mile: number;
  name: string;
  year: number;
  type: 'founding' | 'tragedy' | 'achievement' | 'construction' | 'lore' | 'rescue';
  description: string;
  impact: string;
  notes?: string;
}

export const TRAIL_HISTORY: TrailHistory[] = [
  // FOUNDING AND CONSTRUCTION
  { mile: 0, name: 'AT Completed', year: 1937, type: 'founding', description: 'The Appalachian Trail was completed after 16 years of volunteer work', impact: 'First long-distance hiking trail in the world', notes: 'Vision of Benton MacKaye, realized by thousands of volunteers' },
  { mile: 1638.2, name: 'MacKaye\'s Vision', year: 1921, type: 'founding', description: 'Benton MacKaye conceived the AT on Stratton Mountain', impact: 'Birth of the long-distance hiking movement', notes: 'Published "An Appalachian Trail: A Project in Regional Planning" in 1921' },
  { mile: 888.2, name: 'ATC Founded', year: 1925, type: 'founding', description: 'Appalachian Trail Conservancy established in Washington DC', impact: 'Organization to manage and maintain the trail', notes: 'Moved to Harpers Ferry in 1972 - now the psychological halfway point' },

  // FIRST THRU-HIKERS
  { mile: TRAIL_TOTAL_MILES, name: 'First Thru-Hike', year: 1948, type: 'achievement', description: 'Earl Shaffer becomes first person to thru-hike the AT', impact: 'Proved it was possible, inspired generations', notes: '"Crazy One" completed it in 124 days carrying WWII army gear' },
  { mile: TRAIL_TOTAL_MILES, name: 'First Woman Thru-Hiker', year: 1955, type: 'achievement', description: 'Emma "Grandma" Gatewood thru-hikes at age 67', impact: 'Proved age/gender no barrier, inspired lightweight hiking', notes: 'Wore Keds sneakers, carried a shower curtain as shelter' },
  { mile: TRAIL_TOTAL_MILES, name: 'FKT First Set', year: 1973, type: 'achievement', description: 'Warren Doyle sets first recognized FKT: 66 days', impact: 'Birth of competitive thru-hiking', notes: 'Doyle went on to complete 18+ thru-hikes' },
  { mile: TRAIL_TOTAL_MILES, name: 'Speed Record Broken', year: 2015, type: 'achievement', description: 'Scott Jurek sets FKT at 46 days, 8 hours', impact: 'Pushed limits of human endurance on trail', notes: 'Ultra-running legend. Record has since been broken multiple times.' },

  // TRAGEDIES AND RESCUES
  { mile: 1863.0, name: 'Washington Death Zone', year: 1900, type: 'tragedy', description: 'First recorded fatality on Mt. Washington - 150+ deaths since', impact: 'Established need for weather awareness', notes: 'More deaths than any other AT peak. Weather kills.' },
  { mile: 1833.0, name: 'Franconia Ridge Tragedy', year: 1954, type: 'tragedy', description: 'Hikers caught in sudden storm on exposed ridge', impact: 'Led to better weather forecasting and trail signage', notes: 'Ridge has claimed multiple lives. Never underestimate.' },
  { mile: 1925.4, name: 'Mahoosuc Notch Injury', year: 1975, type: 'rescue', description: 'Major rescue operation after hiker trapped in boulder cave', impact: 'Established rescue protocols for difficult terrain', notes: 'Took 12+ hours to extract. Go slow, go safe.' },
  { mile: 2100.5, name: '100-Mile Rescue', year: 1980, type: 'rescue', description: 'Major search and rescue in 100-mile wilderness', impact: 'Emphasized need for proper planning and gear', notes: 'No easy bailouts for 100 miles. Be prepared.' },

  // TRAIL CHANGES
  { mile: 165.7, name: 'Fontana Dam Built', year: 1944, type: 'construction', description: 'TVA dam flooded original trail route', impact: 'Trail rerouted, Fontana Hilton shelter created', notes: 'Largest dam east of Rockies. Trail goes over it.' },
  { mile: 209.0, name: 'Clingmans Dome Tower', year: 1959, type: 'construction', description: 'Observation tower built at highest point', impact: 'Iconic landmark, accessible summit', notes: 'Designed by Hubert Bebb' },
  { mile: 1277.2, name: 'Bear Mountain Bridge Opens', year: 1924, type: 'construction', description: 'First vehicular crossing of Hudson River south of Albany', impact: 'Connected AT across the Hudson', notes: 'Lowest point on AT crosses highest point on bridge' },

  // TRAIL LORE
  { mile: 28.9, name: 'Blood Mountain Legend', year: 1755, type: 'lore', description: 'Cherokee and Creek battle stained mountain with blood', impact: 'Oldest shelter on AT built on historic ground', notes: 'Legend says blood flowed down the mountainside' },
  { mile: 467.2, name: 'Trail Days Founded', year: 1987, type: 'founding', description: 'Damascus starts annual hiker festival', impact: 'Largest gathering of AT hikers annually', notes: 'Parade, talent show, gear swap, hiker trash reunion' },
  { mile: 273.2, name: 'Hot Springs Tradition', year: 1778, type: 'lore', description: 'Cherokee used natural springs for healing', impact: 'Still used by hikers today', notes: 'Water bubbles up at 100°F naturally' },
  { mile: 379.3, name: 'Roan High Rhododendrons', year: 1799, type: 'lore', description: 'Early explorers described "purple mountains"', impact: 'Famous rhododendron gardens still bloom each June', notes: 'André Michaux explored here, sent specimens to France' },
];

// ============================================================================
// FAMOUS THRU-HIKERS - Legends of the Trail
// ============================================================================

export interface FamousHiker {
  name: string;
  trailName?: string;
  year: number;
  achievement: string;
  quote?: string;
  impact: string;
  notes?: string;
}

export const FAMOUS_HIKERS: FamousHiker[] = [
  {
    name: 'Earl Shaffer',
    trailName: 'Crazy One',
    year: 1948,
    achievement: 'First thru-hiker ever',
    quote: 'I did it to walk off the war.',
    impact: 'Proved the AT could be thru-hiked. Set the template.',
    notes: 'WWII veteran who thru-hiked again at 79 in 1998'
  },
  {
    name: 'Emma Gatewood',
    trailName: 'Grandma Gatewood',
    year: 1955,
    achievement: 'First woman to thru-hike, at age 67',
    quote: 'I thought it would be a nice lark. It wasnt.',
    impact: 'Inspired lightweight hiking movement. Proved anyone can do it.',
    notes: 'Wore Keds sneakers, carried homemade gear. Thru-hiked 3 times.'
  },
  {
    name: 'Warren Doyle',
    year: 1973,
    achievement: '18+ thru-hikes, first FKT',
    quote: 'The trail will provide.',
    impact: 'Created one of first AT training institutes',
    notes: 'More thru-hikes than anyone. Legend.'
  },
  {
    name: 'Bill Irwin',
    trailName: 'Orient Express',
    year: 1990,
    achievement: 'First blind person to thru-hike',
    quote: 'Blind faith.',
    impact: 'Showed disability is not disqualifier',
    notes: 'Hiked with guide dog Orient. Wrote "Blind Courage"'
  },
  {
    name: 'Jennifer Pharr Davis',
    trailName: 'Odyssa',
    year: 2011,
    achievement: 'Overall FKT holder (46 days, 11 hours)',
    quote: 'Its not about the pace, its about the purpose.',
    impact: 'First woman to hold overall FKT',
    notes: 'Broke mens record. Author and trail advocate.'
  },
  {
    name: 'Scott Jurek',
    year: 2015,
    achievement: 'Broke FKT as ultra-runner (46 days, 8 hours)',
    quote: 'Run when you can, walk when you have to, crawl if you must.',
    impact: 'Brought ultra-running attention to thru-hiking',
    notes: 'Legendary ultra-marathoner. Documented in "North"'
  },
  {
    name: 'Karl Meltzer',
    year: 2016,
    achievement: 'Current supported FKT (45 days, 22 hours)',
    quote: 'Just keep moving forward.',
    impact: 'Pushed physical limits further',
    notes: '100-mile race legend. Red Bull sponsored attempt.'
  },
  {
    name: 'Heather Anderson',
    trailName: 'Anish',
    year: 2015,
    achievement: 'Womens self-supported FKT (54 days)',
    quote: 'The trail doesnt care who you are.',
    impact: 'Showed what humans can do unsupported',
    notes: 'Also holds PCT and CDT self-supported FKTs. Triple Crown legend.'
  },
  {
    name: 'Dale "Greybeard" Sanders',
    trailName: 'Greybeard',
    year: 2017,
    achievement: 'Oldest person to thru-hike at age 82',
    quote: 'Age is just a number.',
    impact: 'Proved its never too late',
    notes: 'WWII Navy veteran. Inspiration to all.'
  },
  {
    name: 'Nimblewill Nomad',
    trailName: 'Nimblewill Nomad',
    year: 2021,
    achievement: 'Oldest person to thru-hike at age 83',
    quote: 'The trail is my home.',
    impact: 'Took Greybeards record, still hiking',
    notes: 'Has hiked 40,000+ miles across eastern trails'
  },
];

// ============================================================================
// TRAIL NAME GENERATOR DATA - Build Your Hiker Identity
// ============================================================================

// Trail names typically come from: personality traits, mishaps, gear, food preferences,
// hometown, appearance, or memorable trail moments

export const TRAIL_NAME_PREFIXES = [
  // Nature elements
  'Pine', 'Cedar', 'Oak', 'Maple', 'Birch', 'Aspen', 'Spruce', 'Hemlock',
  'Stone', 'Rock', 'River', 'Creek', 'Lake', 'Cloud', 'Storm', 'Thunder',
  'Wind', 'Rain', 'Sun', 'Moon', 'Star', 'Snow', 'Frost', 'Mist', 'Fog',
  'Bear', 'Wolf', 'Fox', 'Hawk', 'Eagle', 'Owl', 'Deer', 'Moose',
  'Ridge', 'Peak', 'Summit', 'Trail', 'Path', 'Blaze', 'Blue', 'White',
  // Personality
  'Steady', 'Swift', 'Slow', 'Happy', 'Lucky', 'Wild', 'Lone', 'Free',
  'Quiet', 'Loud', 'Easy', 'Lazy', 'Crazy', 'Salty', 'Sweet', 'Spicy',
  // Physical
  'Long', 'Short', 'Big', 'Little', 'Red', 'Grey', 'Old', 'Young',
  // Directions
  'North', 'South', 'East', 'West', 'Up', 'Down',
];

export const TRAIL_NAME_SUFFIXES = [
  // Animals
  'Bear', 'Wolf', 'Fox', 'Hawk', 'Eagle', 'Owl', 'Crow', 'Raven',
  'Deer', 'Moose', 'Elk', 'Turtle', 'Rabbit', 'Squirrel', 'Mouse',
  'Snake', 'Frog', 'Fish', 'Bee', 'Butterfly', 'Dragonfly',
  // Nature
  'Walker', 'Wanderer', 'Rambler', 'Strider', 'Stomper', 'Stepper',
  'Foot', 'Legs', 'Toes', 'Boots', 'Sticks', 'Poles',
  'Beard', 'Head', 'Heart', 'Soul', 'Spirit', 'Ghost',
  // Trail terms
  'Hiker', 'Trekker', 'Hobo', 'Nomad', 'Drifter', 'Rover',
  'Blaze', 'Blazer', 'Ridge', 'Peak', 'Summit', 'Pass',
  // Personality
  'Smile', 'Grin', 'Laugh', 'Song', 'Dance', 'Dream',
  'Zen', 'Sage', 'Guru', 'Chief', 'Doc', 'Professor',
  // Food (common source!)
  'Snacks', 'Cheese', 'Beans', 'Noodles', 'Oatmeal', 'Ramen',
  'Coffee', 'Whiskey', 'Cookie', 'Crumbs', 'Spork',
];

export const TRAIL_NAME_SINGLES = [
  // Complete names that stand alone
  'Stretch', 'Sticks', 'Socks', 'Boots', 'Flip-Flop', 'Crocs',
  'Blaze', 'Blazer', 'Strider', 'Stride', 'Cadence',
  'Karma', 'Zen', 'Serenity', 'Harmony', 'Balance',
  'Sherpa', 'Scout', 'Ranger', 'Nomad', 'Wanderer', 'Pilgrim',
  'Compass', 'Waypoint', 'Trailhead', 'Ridgerunner',
  'Songbird', 'Firefly', 'Dragonfly', 'Butterfly', 'Hummingbird',
  'Thunder', 'Lightning', 'Tornado', 'Hurricane', 'Storm',
  'Sunrise', 'Sunset', 'Twilight', 'Midnight', 'Dusk', 'Dawn',
  'Whisper', 'Echo', 'Shadow', 'Phantom', 'Ghost', 'Spirit',
  'Captain', 'Admiral', 'Major', 'General', 'Chief',
  'Doc', 'Professor', 'Wizard', 'Sage', 'Oracle',
  'Sasquatch', 'Bigfoot', 'Yeti', 'Gremlin', 'Hobbit', 'Gnome',
  'Snickers', 'Twix', 'Reeses', 'Skittles', 'Milky Way',
  'Ramen', 'Noodles', 'Oatmeal', 'Pancake', 'Waffle',
  'Whiskey', 'Bourbon', 'Moonshine', 'Hooch', 'Ginger',
  'Patches', 'Stitches', 'Wrinkles', 'Freckles', 'Dimples',
  'Giggles', 'Chuckles', 'Grumbles', 'Mumbles', 'Stumbles',
  'Crash', 'Splash', 'Flash', 'Dash', 'Bash',
  'Trek', 'Hike', 'Walk', 'Pace', 'Stride',
  'Pokey', 'Speedy', 'Steady', 'Ready', 'Giddy',
  'Goat', 'Mule', 'Turtle', 'Rabbit', 'Sloth',
  'Viking', 'Spartan', 'Ninja', 'Samurai', 'Cowboy',
  'Buckeye', 'Hoosier', 'Yankee', 'Dixie', 'Cajun',
  'Blisters', 'Chafing', 'Hangry', 'Bonk', 'Crampy',
];

// Trail names often come from stories - here are common themes
export const TRAIL_NAME_ORIGINS = [
  'Given after a memorable gear failure',
  'Named for their hiking pace',
  'Based on their favorite trail snack',
  'From their home state or region',
  'After a wildlife encounter',
  'From their profession back home',
  'Based on a physical characteristic',
  'After something they said repeatedly',
  'From a shelter register joke',
  'Named by their trail family',
  'Self-chosen before starting',
  'From a near-miss or injury',
  'Based on their trail routine',
  'After their hiking style',
  'From their shelter sleeping sounds',
];

// ============================================================================
// HELPER FUNCTIONS FOR NEW DATA
// ============================================================================

export function getTrailHistoryAtLocation(mile: number, range: number = 10): TrailHistory[] {
  return TRAIL_HISTORY.filter(h => Math.abs(h.mile - mile) <= range);
}

export function getRandomFamousHiker(): FamousHiker {
  return FAMOUS_HIKERS[Math.floor(Math.random() * FAMOUS_HIKERS.length)];
}

export function generateTrailName(): string {
  const roll = Math.random();

  if (roll < 0.4) {
    // Single name (most common)
    return TRAIL_NAME_SINGLES[Math.floor(Math.random() * TRAIL_NAME_SINGLES.length)];
  } else if (roll < 0.8) {
    // Prefix + Suffix combination
    const prefix = TRAIL_NAME_PREFIXES[Math.floor(Math.random() * TRAIL_NAME_PREFIXES.length)];
    const suffix = TRAIL_NAME_SUFFIXES[Math.floor(Math.random() * TRAIL_NAME_SUFFIXES.length)];
    return `${prefix} ${suffix}`;
  } else {
    // Just prefix as name
    return TRAIL_NAME_PREFIXES[Math.floor(Math.random() * TRAIL_NAME_PREFIXES.length)];
  }
}

export function getTrailNameOrigin(): string {
  return TRAIL_NAME_ORIGINS[Math.floor(Math.random() * TRAIL_NAME_ORIGINS.length)];
}
