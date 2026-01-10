/**
 * Complete Appalachian Trail Data
 * 2,197.9 miles from Springer Mountain, GA to Mt. Katahdin, ME
 *
 * Data sources:
 * - WhiteBlaze AT Shelter Database
 * - MASTER_NOBO_FIELD_GUIDE.md
 * - TNlandforms.us AT data
 * - ATC official mileages (2025)
 */

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

  // MAINE (1916-2197.9)
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
}

export const STATE_BOUNDARIES: StateBoundary[] = [
  { mile: 0, state: 'GA', prevState: '', name: 'Springer Mountain - Southern Terminus' },
  { mile: 78.5, state: 'NC', prevState: 'GA', name: 'Georgia/North Carolina Border' },
  { mile: 166, state: 'GSMNP', prevState: 'NC', name: 'Great Smoky Mountains National Park' },
  { mile: 241, state: 'NC', prevState: 'GSMNP', name: 'Exit Smokies into NC' },
  { mile: 325, state: 'TN', prevState: 'NC', name: 'NC/Tennessee Border' },
  { mile: 469, state: 'VA', prevState: 'TN', name: 'Tennessee/Virginia Border - Damascus!' },
  { mile: 1020, state: 'WV', prevState: 'VA', name: 'Virginia/West Virginia Border' },
  { mile: 1025, state: 'MD', prevState: 'WV', name: 'West Virginia/Maryland Border' },
  { mile: 1072, state: 'PA', prevState: 'MD', name: 'Maryland/Pennsylvania Border' },
  { mile: 1298, state: 'NJ', prevState: 'PA', name: 'Pennsylvania/New Jersey Border' },
  { mile: 1367, state: 'NY', prevState: 'NJ', name: 'New Jersey/New York Border' },
  { mile: 1462, state: 'CT', prevState: 'NY', name: 'New York/Connecticut Border' },
  { mile: 1518, state: 'MA', prevState: 'CT', name: 'Connecticut/Massachusetts Border' },
  { mile: 1600, state: 'VT', prevState: 'MA', name: 'Massachusetts/Vermont Border' },
  { mile: 1754, state: 'NH', prevState: 'VT', name: 'Vermont/New Hampshire Border' },
  { mile: 1912, state: 'ME', prevState: 'NH', name: 'New Hampshire/Maine Border' },
  { mile: 2197.9, state: 'END', prevState: 'ME', name: 'Katahdin - Northern Terminus!' },
];

// ============================================================================
// TERRAIN ZONES - Visual/gameplay changes
// ============================================================================

export interface TerrainZone {
  startMile: number;
  endMile: number;
  type: string;
  name: string;
  description: string;
  difficulty: number; // 1-5 scale
  treeType: string;
  groundType: string;
  avgElevation: number;
}

export const TERRAIN_ZONES: TerrainZone[] = [
  // Georgia
  { startMile: 0, endMile: 30, type: 'ga_forest', name: 'Georgia Piedmont', description: 'Rolling hardwood forests, steep early climbs', difficulty: 3, treeType: 'hardwood_mixed', groundType: 'rocky_soil', avgElevation: 3500 },
  { startMile: 30, endMile: 78.5, type: 'ga_highlands', name: 'Georgia Highlands', description: 'Higher elevation, rhododendron tunnels', difficulty: 3, treeType: 'hardwood_rhodo', groundType: 'rocky', avgElevation: 3800 },

  // North Carolina
  { startMile: 78.5, endMile: 137, type: 'nc_nantahala', name: 'Nantahala Range', description: 'Dense forests, river valleys', difficulty: 3, treeType: 'hardwood_mixed', groundType: 'dirt_roots', avgElevation: 4200 },
  { startMile: 137, endMile: 166, type: 'nc_approach', name: 'Smokies Approach', description: 'Building elevation toward the Smokies', difficulty: 3, treeType: 'hardwood_pine', groundType: 'rocky', avgElevation: 3000 },

  // Great Smoky Mountains
  { startMile: 166, endMile: 241, type: 'smokies', name: 'Great Smoky Mountains', description: 'Highest sustained elevations, spruce-fir forests, fog', difficulty: 4, treeType: 'spruce_fir', groundType: 'rocky_roots', avgElevation: 5200 },

  // NC/TN
  { startMile: 241, endMile: 330, type: 'nc_tn_highlands', name: 'NC/TN Highlands', description: 'Big balds, rhododendron, grassy summits', difficulty: 3, treeType: 'hardwood_rhodo', groundType: 'grassy', avgElevation: 4000 },
  { startMile: 330, endMile: 395, type: 'roan_highlands', name: 'Roan Highlands', description: 'Alpine meadows, exposed balds, stunning views', difficulty: 4, treeType: 'open_bald', groundType: 'grassy_rock', avgElevation: 5500 },
  { startMile: 395, endMile: 469, type: 'tn_damascus', name: 'Approach to Damascus', description: 'Descending ridges, hardwood forests', difficulty: 2, treeType: 'hardwood_mixed', groundType: 'dirt', avgElevation: 3500 },

  // Virginia - The Long State
  { startMile: 469, endMile: 530, type: 'va_grayson', name: 'Grayson Highlands', description: 'Wild ponies! Open meadows, rock outcrops', difficulty: 3, treeType: 'open_meadow', groundType: 'grassy_rock', avgElevation: 5000 },
  { startMile: 530, endMile: 700, type: 'va_central', name: 'Central Virginia', description: 'Long ridgewalks, gentler grades', difficulty: 2, treeType: 'hardwood_oak', groundType: 'dirt_rock', avgElevation: 2800 },
  { startMile: 700, endMile: 785, type: 'va_blue_ridge', name: 'Blue Ridge Parkway', description: 'Classic Appalachian ridges', difficulty: 3, treeType: 'hardwood_mixed', groundType: 'dirt', avgElevation: 3000 },
  { startMile: 785, endMile: 880, type: 'va_priest', name: 'The Priest & Three Ridges', description: 'Brutal climbs, then gentle Shenandoah approach', difficulty: 4, treeType: 'hardwood_oak', groundType: 'rocky', avgElevation: 2500 },
  { startMile: 880, endMile: 1000, type: 'shenandoah', name: 'Shenandoah National Park', description: 'Gentle grades, waysides, deer everywhere', difficulty: 2, treeType: 'hardwood_oak', groundType: 'manicured', avgElevation: 3200 },
  { startMile: 1000, endMile: 1025, type: 'va_roller', name: 'Roller Coaster', description: 'Short steep PUDs (pointless ups and downs)', difficulty: 3, treeType: 'hardwood_mixed', groundType: 'rocky', avgElevation: 1200 },

  // Mid-Atlantic
  { startMile: 1025, endMile: 1072, type: 'harpers_md', name: 'Harpers Ferry & Maryland', description: 'Historic sites, Civil War battlefields', difficulty: 2, treeType: 'hardwood_mixed', groundType: 'dirt_rock', avgElevation: 1200 },
  { startMile: 1072, endMile: 1180, type: 'pa_south', name: 'South Pennsylvania', description: 'Rocky but manageable', difficulty: 3, treeType: 'hardwood_oak', groundType: 'rocky', avgElevation: 1400 },
  { startMile: 1180, endMile: 1298, type: 'pa_rocks', name: 'Rocksylvania', description: 'ROCKS. Brutal ankle-breakers. Slowest miles.', difficulty: 5, treeType: 'hardwood_scrub', groundType: 'boulder_field', avgElevation: 1500 },

  // NJ/NY
  { startMile: 1298, endMile: 1370, type: 'nj_ridges', name: 'New Jersey Highlands', description: 'Boardwalks, lakes, and swamps', difficulty: 2, treeType: 'hardwood_mixed', groundType: 'boardwalk_mud', avgElevation: 1200 },
  { startMile: 1370, endMile: 1462, type: 'ny_highlands', name: 'New York Highlands', description: 'Bear Mountain, frequent towns', difficulty: 3, treeType: 'hardwood_mixed', groundType: 'rocky', avgElevation: 1100 },

  // New England
  { startMile: 1462, endMile: 1518, type: 'ct_ridges', name: 'Connecticut', description: 'Rolling hills, stone walls, farmland', difficulty: 2, treeType: 'hardwood_birch', groundType: 'dirt_rock', avgElevation: 1200 },
  { startMile: 1518, endMile: 1600, type: 'ma_berkshires', name: 'Massachusetts Berkshires', description: 'Mt. Greylock, cobblestone paths', difficulty: 3, treeType: 'hardwood_birch', groundType: 'cobblestone', avgElevation: 2000 },
  { startMile: 1600, endMile: 1754, type: 'vt_green', name: 'Vermont Green Mountains', description: 'Mud! Roots! The Long Trail overlap', difficulty: 3, treeType: 'birch_spruce', groundType: 'mud_roots', avgElevation: 2500 },

  // White Mountains
  { startMile: 1754, endMile: 1800, type: 'nh_approach', name: 'NH Approach', description: 'Building toward the Whites', difficulty: 3, treeType: 'hardwood_conifer', groundType: 'rocky', avgElevation: 2000 },
  { startMile: 1800, endMile: 1912, type: 'whites', name: 'White Mountains', description: 'HARDEST terrain on AT. Above treeline. Alpine exposure.', difficulty: 5, treeType: 'alpine_krummholz', groundType: 'granite_slabs', avgElevation: 4500 },

  // Maine
  { startMile: 1912, endMile: 2000, type: 'me_mahoosuc', name: 'Mahoosuc Range', description: 'Mahoosuc Notch - hardest mile on AT', difficulty: 5, treeType: 'spruce_fir', groundType: 'boulder_cave', avgElevation: 3000 },
  { startMile: 2000, endMile: 2093, type: 'me_lakes', name: 'Maine Lakes & Rivers', description: 'Lake country, rivers, remote', difficulty: 3, treeType: 'spruce_fir', groundType: 'roots_rocks', avgElevation: 2000 },
  { startMile: 2093, endMile: 2190, type: 'me_100mile', name: '100-Mile Wilderness', description: 'No resupply for 100 miles. Remote wilderness.', difficulty: 4, treeType: 'spruce_fir', groundType: 'roots_rocks', avgElevation: 1500 },
  { startMile: 2190, endMile: 2197.9, type: 'katahdin', name: 'Katahdin', description: 'The final climb. 4,000 ft in 5 miles. You made it!', difficulty: 5, treeType: 'alpine_bare', groundType: 'granite', avgElevation: 3500 },
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
  // Georgia
  { mile: 0, name: 'Amicalola Falls SP', state: 'GA', distance: 'On Trail', services: ['lodge', 'restaurant'], hasHostel: true, hasStore: false, hasRestaurant: true, hasOutfitter: false, hasLaundry: false, hasPO: false, notes: 'Common NOBO start point' },
  { mile: 30.7, name: 'Neels Gap', state: 'GA', distance: 'On Trail', services: ['hostel', 'outfitter', 'shower', 'laundry'], hasHostel: true, hasStore: true, hasRestaurant: false, hasOutfitter: true, hasLaundry: true, hasPO: true, notes: 'Mountain Crossings - AT goes through building!' },
  { mile: 69, name: 'Hiawassee', state: 'GA', distance: '~11 mi', services: ['full town'], hasHostel: true, hasStore: true, hasRestaurant: true, hasOutfitter: false, hasLaundry: true, hasPO: true, notes: 'Hitch required' },

  // NC/TN
  { mile: 137, name: 'NOC', state: 'NC', distance: 'On Trail', services: ['hostel', 'outfitter', 'restaurant'], hasHostel: true, hasStore: true, hasRestaurant: true, hasOutfitter: true, hasLaundry: true, hasPO: true, notes: 'Nantahala Outdoor Center' },
  { mile: 165, name: 'Fontana Dam', state: 'NC', distance: '~1.5 mi', services: ['resort', 'store'], hasHostel: true, hasStore: true, hasRestaurant: true, hasOutfitter: false, hasLaundry: true, hasPO: true, notes: 'Fontana Village resort' },
  { mile: 241, name: 'Standing Bear Farm', state: 'NC', distance: '~0.2 mi', services: ['hostel', 'store'], hasHostel: true, hasStore: true, hasRestaurant: false, hasOutfitter: false, hasLaundry: true, hasPO: false, notes: 'Classic hiker hostel' },
  { mile: 274, name: 'Hot Springs', state: 'NC', distance: 'On Trail', services: ['hostels', 'grocery', 'restaurants', 'laundry', 'PO'], hasHostel: true, hasStore: true, hasRestaurant: true, hasOutfitter: false, hasLaundry: true, hasPO: true, notes: 'Trail goes through downtown!' },
  { mile: 342, name: 'Erwin', state: 'TN', distance: '~0.5 mi', services: ['hostel', 'grocery', 'restaurants'], hasHostel: true, hasStore: true, hasRestaurant: true, hasOutfitter: false, hasLaundry: true, hasPO: true, notes: "Uncle Johnny's Hostel" },

  // Virginia
  { mile: 469, name: 'Damascus', state: 'VA', distance: 'On Trail', services: ['hostels', 'outfitter', 'grocery', 'restaurants', 'laundry', 'PO'], hasHostel: true, hasStore: true, hasRestaurant: true, hasOutfitter: true, hasLaundry: true, hasPO: true, notes: 'Trail Town USA!' },
  { mile: 534, name: 'Partnership Shelter', state: 'VA', distance: 'On Trail', services: ['shelter'], hasHostel: false, hasStore: false, hasRestaurant: false, hasOutfitter: false, hasLaundry: false, hasPO: false, notes: 'Pizza delivery to shelter!' },
  { mile: 635, name: 'Pearisburg', state: 'VA', distance: '~0.8 mi', services: ['hostel', 'grocery', 'restaurants'], hasHostel: true, hasStore: true, hasRestaurant: true, hasOutfitter: false, hasLaundry: true, hasPO: true },
  { mile: 729, name: 'Daleville', state: 'VA', distance: '~0.5 mi', services: ['hotels', 'grocery', 'restaurants'], hasHostel: false, hasStore: true, hasRestaurant: true, hasOutfitter: false, hasLaundry: true, hasPO: true },
  { mile: 880, name: 'Waynesboro', state: 'VA', distance: '~1-2 mi', services: ['motels', 'grocery', 'restaurants', 'laundry', 'PO'], hasHostel: true, hasStore: true, hasRestaurant: true, hasOutfitter: false, hasLaundry: true, hasPO: true, notes: 'Before Shenandoah' },
  { mile: 999, name: 'Front Royal', state: 'VA', distance: '~1-3 mi', services: ['hostels', 'grocery', 'restaurants'], hasHostel: true, hasStore: true, hasRestaurant: true, hasOutfitter: false, hasLaundry: true, hasPO: true },

  // Harpers Ferry & PA
  { mile: 1024, name: 'Harpers Ferry', state: 'WV', distance: 'On Trail', services: ['hostel', 'store', 'restaurants'], hasHostel: true, hasStore: true, hasRestaurant: true, hasOutfitter: false, hasLaundry: false, hasPO: true, notes: 'ATC HQ! Psychological halfway' },
  { mile: 1103, name: 'Pine Grove Furnace', state: 'PA', distance: 'On Trail', services: ['camp store'], hasHostel: false, hasStore: true, hasRestaurant: false, hasOutfitter: false, hasLaundry: false, hasPO: false, notes: 'Half Gallon Challenge!' },
  { mile: 1149, name: 'Duncannon', state: 'PA', distance: '~0.5 mi', services: ['hotel', 'grocery', 'restaurants'], hasHostel: true, hasStore: true, hasRestaurant: true, hasOutfitter: false, hasLaundry: true, hasPO: true, notes: 'Doyle Hotel - "an experience"' },
  { mile: 1298, name: 'Delaware Water Gap', state: 'PA', distance: 'On Trail', services: ['hostels', 'grocery', 'restaurants', 'PO'], hasHostel: true, hasStore: true, hasRestaurant: true, hasOutfitter: false, hasLaundry: true, hasPO: true },

  // NJ/NY/CT/MA
  { mile: 1410, name: 'Bear Mountain', state: 'NY', distance: '~0.5 mi', services: ['limited'], hasHostel: false, hasStore: false, hasRestaurant: true, hasOutfitter: false, hasLaundry: false, hasPO: false, notes: 'Zoo, limited services' },
  { mile: 1570, name: 'Dalton', state: 'MA', distance: 'On Trail', services: ['hostel', 'grocery', 'restaurants'], hasHostel: true, hasStore: true, hasRestaurant: true, hasOutfitter: false, hasLaundry: true, hasPO: true, notes: "Tom Levardi's legendary" },

  // Vermont/NH
  { mile: 1700, name: 'Killington', state: 'VT', distance: '~1-2 mi', services: ['inn', 'limited'], hasHostel: true, hasStore: false, hasRestaurant: true, hasOutfitter: false, hasLaundry: false, hasPO: false, notes: 'Inn at Long Trail' },
  { mile: 1747, name: 'Hanover', state: 'NH', distance: 'On Trail', services: ['hostels', 'grocery', 'restaurants', 'laundry', 'PO'], hasHostel: true, hasStore: true, hasRestaurant: true, hasOutfitter: false, hasLaundry: true, hasPO: true, notes: 'Dartmouth College town!' },
  { mile: 1823, name: 'Lincoln/Woodstock', state: 'NH', distance: '~5-6 mi', services: ['full town'], hasHostel: true, hasStore: true, hasRestaurant: true, hasOutfitter: true, hasLaundry: true, hasPO: true, notes: 'Last major before Whites' },
  { mile: 1898, name: 'Gorham', state: 'NH', distance: '~1.5 mi', services: ['hostels', 'grocery', 'restaurants', 'laundry', 'PO'], hasHostel: true, hasStore: true, hasRestaurant: true, hasOutfitter: false, hasLaundry: true, hasPO: true, notes: 'Major resupply after Whites' },

  // Maine
  { mile: 1975, name: 'Andover', state: 'ME', distance: '~0.8 mi', services: ['hostel', 'grocery', 'restaurants'], hasHostel: true, hasStore: true, hasRestaurant: true, hasOutfitter: false, hasLaundry: true, hasPO: true },
  { mile: 2013, name: 'Caratunk', state: 'ME', distance: '~0.5 mi', services: ['hostel', 'limited'], hasHostel: true, hasStore: false, hasRestaurant: false, hasOutfitter: false, hasLaundry: false, hasPO: false, notes: 'Near Kennebec Ferry' },
  { mile: 2078, name: 'Monson', state: 'ME', distance: '~0.5 mi', services: ['hostels', 'grocery', 'restaurants', 'PO'], hasHostel: true, hasStore: true, hasRestaurant: true, hasOutfitter: false, hasLaundry: true, hasPO: true, notes: 'Last resupply! Gateway to 100-Mile' },
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
  { mile: 2197.9, name: 'Mt. Katahdin', elevation: 5269, state: 'ME', netGain: 4000, difficulty: 5, notes: 'Northern Terminus! You did it!' },
];

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

export function getShelterByMile(mile: number): Shelter | undefined {
  return SHELTERS.find(s => Math.abs(s.mile - mile) < 0.5);
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
  const nearestShelter = SHELTERS.reduce((prev, curr) => {
    return Math.abs(curr.mile - mile) < Math.abs(prev.mile - mile) ? curr : prev;
  });

  if (Math.abs(nearestShelter.mile - mile) < 2) {
    return nearestShelter.elevation;
  }

  return zone.avgElevation;
}

// ============================================================================
// TOTAL TRAIL STATS
// ============================================================================

export const TRAIL_STATS = {
  totalMiles: 2197.9,
  totalStates: 14,
  totalShelters: SHELTERS.length,
  totalTowns: TOWNS.length,
  totalPeaks: PEAKS.length,
  highestPoint: { name: 'Kuwohi (Clingmans Dome)', elevation: 6643, mile: 209 },
  lowestPoint: { name: 'Bear Mountain Bridge', elevation: 124, mile: 1408 },
  highestShelter: { name: 'Roan High Knob Shelter', elevation: 6275, mile: 379.3 },
  lowestShelter: { name: 'Ten Mile River Lean-to', elevation: 290, mile: 1464.1 },
};
