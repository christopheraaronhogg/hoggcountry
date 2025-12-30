<script>
  import { onMount } from 'svelte';

  let { trailContext = {} } = $props();

  let mounted = $state(false);

  // Active section tab
  let activeSection = $state('sources'); // 'sources', 'types', 'protocol'

  // User settings
  let consumptionRate = $state(0.5); // liters per mile (typical: 0.4-0.8)
  let carryCapacity = $state(3); // max liters you can carry
  let currentWater = $state(1); // liters currently carrying
  let temperatureMode = $state('moderate'); // cool, moderate, hot

  // Comprehensive AT water source database
  // Sources compiled from AWOL guide, Guthook data, and trail reports
  const waterSources = [
    // Georgia - Mile 0-78
    { mile: 0.6, name: 'Springer Mountain Spring', type: 'spring', reliability: 'reliable', offTrail: 0.2, notes: 'Down blue-blazed trail' },
    { mile: 2.8, name: 'Stover Creek', type: 'stream', reliability: 'reliable', offTrail: 0 },
    { mile: 7.5, name: 'Hawk Mountain Shelter Spring', type: 'spring', reliability: 'seasonal', offTrail: 0.1, notes: 'Can go dry in drought' },
    { mile: 8.0, name: 'Hightower Gap Stream', type: 'stream', reliability: 'reliable', offTrail: 0 },
    { mile: 10.8, name: 'Cooper Gap Stream', type: 'stream', reliability: 'reliable', offTrail: 0 },
    { mile: 15.8, name: 'Gooch Mountain Shelter', type: 'spring', reliability: 'reliable', offTrail: 0.1 },
    { mile: 19.3, name: 'Woody Gap - USFS', type: 'piped', reliability: 'seasonal', offTrail: 0.1, notes: 'May be turned off in winter' },
    { mile: 21.7, name: 'Big Cedar Mountain Stream', type: 'stream', reliability: 'reliable', offTrail: 0 },
    { mile: 24.1, name: 'Woods Hole Shelter', type: 'spring', reliability: 'reliable', offTrail: 0.2 },
    { mile: 27.8, name: 'Blood Mountain Spring', type: 'spring', reliability: 'seasonal', offTrail: 0.3, notes: 'Unreliable in dry months' },
    { mile: 30.7, name: 'Neels Gap - Mountain Crossings', type: 'town', reliability: 'reliable', offTrail: 0, notes: 'Outfitter on trail - fill up here!' },
    { mile: 34.3, name: 'Whitley Gap Shelter', type: 'spring', reliability: 'reliable', offTrail: 0.1 },
    { mile: 38.6, name: 'Low Gap Shelter', type: 'spring', reliability: 'reliable', offTrail: 0.1 },
    { mile: 42.5, name: 'Chattahoochee Spring', type: 'spring', reliability: 'reliable', offTrail: 0, notes: 'Headwaters of Chattahoochee River' },
    { mile: 47.2, name: 'Blue Mountain Shelter', type: 'spring', reliability: 'reliable', offTrail: 0.2 },
    { mile: 52.8, name: 'Unicoi Gap Stream', type: 'stream', reliability: 'reliable', offTrail: 0 },
    { mile: 56.4, name: 'Tray Mountain Shelter', type: 'spring', reliability: 'reliable', offTrail: 0.1 },
    { mile: 59.5, name: 'Indian Grave Gap Stream', type: 'stream', reliability: 'reliable', offTrail: 0 },
    { mile: 62.3, name: 'Addis Gap Spring', type: 'spring', reliability: 'reliable', offTrail: 0.1 },
    { mile: 69.4, name: 'Dicks Creek Gap', type: 'stream', reliability: 'reliable', offTrail: 0 },
    { mile: 73.8, name: 'Plumorchard Gap Shelter', type: 'spring', reliability: 'reliable', offTrail: 0.1 },

    // NC Border to Fontana - Mile 78-166
    { mile: 83.1, name: 'Muskrat Creek Shelter', type: 'spring', reliability: 'reliable', offTrail: 0.1 },
    { mile: 88.7, name: 'Standing Indian Shelter', type: 'spring', reliability: 'reliable', offTrail: 0.2 },
    { mile: 91.8, name: 'Beech Gap Stream', type: 'stream', reliability: 'reliable', offTrail: 0 },
    { mile: 95.7, name: 'Winding Stair Gap Stream', type: 'stream', reliability: 'reliable', offTrail: 0 },
    { mile: 99.7, name: 'Siler Bald Shelter', type: 'spring', reliability: 'reliable', offTrail: 0.2 },
    { mile: 106.2, name: 'Cold Spring Shelter', type: 'spring', reliability: 'reliable', offTrail: 0.1, notes: 'Excellent cold spring' },
    { mile: 110.3, name: 'Rock Gap - Franklin access', type: 'stream', reliability: 'reliable', offTrail: 0 },
    { mile: 118.0, name: 'Wayah Shelter', type: 'spring', reliability: 'reliable', offTrail: 0.1 },
    { mile: 125.2, name: 'Nantahala River', type: 'river', reliability: 'reliable', offTrail: 0, notes: 'Large reliable river' },
    { mile: 131.0, name: 'Sassafras Gap Shelter', type: 'spring', reliability: 'reliable', offTrail: 0.1 },
    { mile: 137.1, name: 'Wesser - NOC', type: 'town', reliability: 'reliable', offTrail: 0, notes: 'Nantahala Outdoor Center' },
    { mile: 143.4, name: 'Rufus Morgan Shelter', type: 'spring', reliability: 'reliable', offTrail: 0.1 },
    { mile: 152.3, name: 'Cable Gap Shelter', type: 'spring', reliability: 'reliable', offTrail: 0.2 },
    { mile: 157.4, name: 'Yellow Creek Gap Stream', type: 'stream', reliability: 'reliable', offTrail: 0 },
    { mile: 164.2, name: 'Fontana Dam Shelter', type: 'piped', reliability: 'reliable', offTrail: 0, notes: 'Fontana Hilton - showers available!' },
    { mile: 165.7, name: 'Fontana Dam Visitor Center', type: 'town', reliability: 'reliable', offTrail: 0.3 },

    // Great Smoky Mountains - Mile 166-241 (CRITICAL SECTION)
    { mile: 170.5, name: 'Birch Spring Shelter', type: 'spring', reliability: 'reliable', offTrail: 0.1 },
    { mile: 176.0, name: 'Mollies Ridge Shelter', type: 'spring', reliability: 'seasonal', offTrail: 0.2, notes: 'Can be unreliable - carry extra' },
    { mile: 181.6, name: 'Russell Field Shelter', type: 'spring', reliability: 'reliable', offTrail: 0.1 },
    { mile: 186.9, name: 'Spence Field Shelter', type: 'spring', reliability: 'reliable', offTrail: 0.2 },
    { mile: 191.9, name: 'Derrick Knob Shelter', type: 'spring', reliability: 'reliable', offTrail: 0.1 },
    { mile: 196.6, name: 'Silers Bald Shelter', type: 'spring', reliability: 'reliable', offTrail: 0.2 },
    { mile: 200.4, name: 'Double Spring Gap Shelter', type: 'spring', reliability: 'reliable', offTrail: 0.1 },
    { mile: 206.2, name: 'Newfound Gap - Restrooms', type: 'piped', reliability: 'seasonal', offTrail: 0, notes: 'Seasonal restrooms - verify open' },
    { mile: 210.7, name: 'Icewater Spring Shelter', type: 'spring', reliability: 'reliable', offTrail: 0.1, notes: 'Cold, excellent water' },
    { mile: 217.0, name: 'Pecks Corner Shelter', type: 'spring', reliability: 'reliable', offTrail: 0.1 },
    { mile: 222.9, name: 'Tri-Corner Knob Shelter', type: 'spring', reliability: 'reliable', offTrail: 0.2 },
    { mile: 228.1, name: 'Cosby Knob Shelter', type: 'spring', reliability: 'reliable', offTrail: 0.2 },
    { mile: 234.3, name: 'Davenport Gap Shelter', type: 'spring', reliability: 'reliable', offTrail: 0.1 },
    { mile: 241.0, name: 'Davenport Gap - Stream', type: 'stream', reliability: 'reliable', offTrail: 0 },

    // NC/TN Border Section - Mile 241-340
    { mile: 245.8, name: 'Groundhog Creek Shelter', type: 'stream', reliability: 'reliable', offTrail: 0.1 },
    { mile: 255.5, name: 'Max Patch Stream', type: 'stream', reliability: 'seasonal', offTrail: 0.5, notes: 'Long carry to/from Max Patch summit' },
    { mile: 260.1, name: 'Roaring Fork Shelter', type: 'stream', reliability: 'reliable', offTrail: 0.1 },
    { mile: 266.0, name: 'Walnut Mountain Shelter', type: 'spring', reliability: 'reliable', offTrail: 0.1 },
    { mile: 273.7, name: 'Hot Springs - Town', type: 'town', reliability: 'reliable', offTrail: 0, notes: 'Full resupply, hot springs!' },
    { mile: 280.0, name: 'Spring Mountain Shelter', type: 'spring', reliability: 'reliable', offTrail: 0.1 },
    { mile: 288.6, name: 'Little Laurel Shelter', type: 'spring', reliability: 'reliable', offTrail: 0.1 },
    { mile: 295.0, name: 'Allen Gap Stream', type: 'stream', reliability: 'reliable', offTrail: 0 },
    { mile: 302.4, name: 'Flint Mountain Shelter', type: 'spring', reliability: 'seasonal', offTrail: 0.2, notes: 'Check recent reports' },
    { mile: 313.9, name: 'Devils Fork Gap Stream', type: 'stream', reliability: 'reliable', offTrail: 0 },
    { mile: 320.7, name: 'Hogback Ridge Shelter', type: 'spring', reliability: 'reliable', offTrail: 0.1 },
    { mile: 328.3, name: 'Nolichucky River', type: 'river', reliability: 'reliable', offTrail: 0, notes: 'Large river - Uncle Johnnys nearby' },
    { mile: 342.3, name: 'Erwin - Town', type: 'town', reliability: 'reliable', offTrail: 0.5 },

    // TN/VA Section - Mile 340-470
    { mile: 350.3, name: 'Curley Maple Gap Shelter', type: 'spring', reliability: 'reliable', offTrail: 0.1 },
    { mile: 357.5, name: 'Cherry Gap Shelter', type: 'spring', reliability: 'reliable', offTrail: 0.2 },
    { mile: 363.7, name: 'Roan High Knob Shelter', type: 'spring', reliability: 'seasonal', offTrail: 0.3, notes: 'Highest shelter on AT - spring can be dry' },
    { mile: 374.0, name: 'Overmountain Shelter', type: 'spring', reliability: 'reliable', offTrail: 0.2, notes: 'Famous barn shelter' },
    { mile: 381.9, name: 'Laurel Fork Stream', type: 'stream', reliability: 'reliable', offTrail: 0 },
    { mile: 386.1, name: 'Damascus - Town', type: 'town', reliability: 'reliable', offTrail: 0, notes: 'Trail Days town - great resupply' },
    { mile: 395.6, name: 'Saunders Shelter', type: 'spring', reliability: 'reliable', offTrail: 0.1 },
    { mile: 406.2, name: 'Lost Mountain Shelter', type: 'spring', reliability: 'reliable', offTrail: 0.1 },
    { mile: 421.7, name: 'Raccoon Branch Shelter', type: 'stream', reliability: 'reliable', offTrail: 0.1 },
    { mile: 439.4, name: 'Old Orchard Shelter', type: 'spring', reliability: 'reliable', offTrail: 0.1 },
    { mile: 454.2, name: 'Chatfield Shelter', type: 'spring', reliability: 'seasonal', offTrail: 0.2, notes: 'Check conditions in summer' },
    { mile: 466.0, name: 'VA 16 - Stream', type: 'stream', reliability: 'reliable', offTrail: 0 },

    // Virginia - Mile 470-700 (LONG DRY STRETCHES)
    { mile: 477.8, name: 'Settlers Museum Spring', type: 'spring', reliability: 'reliable', offTrail: 0.1 },
    { mile: 491.0, name: 'Jenkins Shelter', type: 'spring', reliability: 'seasonal', offTrail: 0.2, notes: 'Virginia can be DRY in summer' },
    { mile: 508.7, name: 'Atkins - Town', type: 'town', reliability: 'reliable', offTrail: 0.2, notes: 'Small town, limited resupply' },
    { mile: 520.8, name: 'Davis Path Shelter', type: 'spring', reliability: 'seasonal', offTrail: 0.3, notes: '⚠️ OFTEN DRY - plan ahead' },
    { mile: 533.7, name: 'Chestnut Knob Shelter', type: 'spring', reliability: 'unreliable', offTrail: 0.5, notes: '⚠️ UNRELIABLE - carry extra water' },
    { mile: 550.6, name: 'Pearisburg - Town', type: 'town', reliability: 'reliable', offTrail: 0.3, notes: 'Good resupply town' },
    { mile: 563.5, name: 'War Spur Shelter', type: 'spring', reliability: 'reliable', offTrail: 0.1 },
    { mile: 580.5, name: 'Laurel Creek Shelter', type: 'stream', reliability: 'reliable', offTrail: 0.1 },
    { mile: 594.2, name: 'Niday Shelter', type: 'spring', reliability: 'reliable', offTrail: 0.1 },
    { mile: 606.8, name: 'Dragons Tooth Parking', type: 'stream', reliability: 'reliable', offTrail: 0.3 },
    { mile: 625.8, name: 'Daleville - Town', type: 'town', reliability: 'reliable', offTrail: 0.1, notes: 'Good resupply, food options' },
    { mile: 644.1, name: 'Wilson Creek Shelter', type: 'stream', reliability: 'reliable', offTrail: 0.1 },
    { mile: 660.0, name: 'Bobblets Gap Shelter', type: 'spring', reliability: 'seasonal', offTrail: 0.2 },
    { mile: 675.5, name: 'Cove Mountain Shelter', type: 'spring', reliability: 'reliable', offTrail: 0.1 },
    { mile: 687.3, name: 'Seeley-Woodworth Shelter', type: 'spring', reliability: 'reliable', offTrail: 0.2 },
    { mile: 702.3, name: 'Waynesboro - Town', type: 'town', reliability: 'reliable', offTrail: 0.3, notes: 'Major resupply before Shenandoah' },

    // Shenandoah NP - Mile 702-960 (Waysides!)
    { mile: 710.5, name: 'Calf Mountain Shelter', type: 'spring', reliability: 'seasonal', offTrail: 0.1 },
    { mile: 725.4, name: 'Blackrock Hut', type: 'spring', reliability: 'reliable', offTrail: 0.1 },
    { mile: 741.2, name: 'Loft Mountain Wayside', type: 'town', reliability: 'reliable', offTrail: 0.1, notes: 'Wayside - burgers and shakes!' },
    { mile: 757.3, name: 'Hightop Hut', type: 'spring', reliability: 'reliable', offTrail: 0.2 },
    { mile: 769.0, name: 'Lewis Mountain Campstore', type: 'town', reliability: 'reliable', offTrail: 0.3 },
    { mile: 785.5, name: 'Big Meadows', type: 'town', reliability: 'reliable', offTrail: 0.2, notes: 'Wayside, lodge, camping' },
    { mile: 796.0, name: 'Rock Spring Hut', type: 'spring', reliability: 'reliable', offTrail: 0.1 },
    { mile: 808.0, name: 'Skyland Resort', type: 'town', reliability: 'reliable', offTrail: 0.3, notes: 'Restaurant and store' },
    { mile: 826.0, name: 'Pass Mountain Hut', type: 'spring', reliability: 'reliable', offTrail: 0.1 },
    { mile: 838.5, name: 'Elkwallow Wayside', type: 'town', reliability: 'reliable', offTrail: 0.2, notes: 'Last Shenandoah wayside' },
    { mile: 858.8, name: 'Tom Floyd Wayside', type: 'spring', reliability: 'reliable', offTrail: 0.2 },

    // Northern VA / WV / MD - Mile 860-1025
    { mile: 876.8, name: 'Manassas Gap - Stream', type: 'stream', reliability: 'reliable', offTrail: 0 },
    { mile: 891.3, name: 'Rod Hollow Shelter', type: 'spring', reliability: 'reliable', offTrail: 0.1 },
    { mile: 910.2, name: 'Sam Moore Shelter', type: 'spring', reliability: 'seasonal', offTrail: 0.2, notes: 'Check recent reports' },
    { mile: 925.0, name: 'Blackburn Trail Center', type: 'piped', reliability: 'reliable', offTrail: 0.1, notes: 'PATC facility' },
    { mile: 945.5, name: 'David Lesser Shelter', type: 'spring', reliability: 'reliable', offTrail: 0.1 },
    { mile: 969.6, name: 'Bears Den Hostel', type: 'town', reliability: 'reliable', offTrail: 0.1, notes: 'Hostel with store' },
    { mile: 988.0, name: 'Blackburn Center', type: 'piped', reliability: 'reliable', offTrail: 0.2 },
    { mile: 999.1, name: 'Ed Garvey Shelter', type: 'spring', reliability: 'reliable', offTrail: 0.1 },
    { mile: 1007.2, name: 'Crampton Gap Shelter', type: 'spring', reliability: 'reliable', offTrail: 0.1 },
    { mile: 1025.0, name: 'Harpers Ferry - Town', type: 'town', reliability: 'reliable', offTrail: 0, notes: 'ATC HQ - psychological halfway!' },

    // Pennsylvania - Mile 1025-1230 (ROCKY + DRY RIDGES!)
    { mile: 1035.5, name: 'Pine Knob Shelter', type: 'spring', reliability: 'seasonal', offTrail: 0.3, notes: '⚠️ PA ridge springs often unreliable' },
    { mile: 1048.9, name: 'Tumbling Run Shelters', type: 'stream', reliability: 'reliable', offTrail: 0.1 },
    { mile: 1066.1, name: 'Rocky Mountain Shelter', type: 'spring', reliability: 'seasonal', offTrail: 0.2 },
    { mile: 1078.5, name: 'Antietam Shelter', type: 'spring', reliability: 'reliable', offTrail: 0.1 },
    { mile: 1094.4, name: 'Pen Mar County Park', type: 'piped', reliability: 'seasonal', offTrail: 0.1, notes: 'Seasonal water fountain' },
    { mile: 1108.5, name: 'Quarry Gap Shelters', type: 'spring', reliability: 'reliable', offTrail: 0.1 },
    { mile: 1123.0, name: 'Birch Run Shelter', type: 'stream', reliability: 'reliable', offTrail: 0.1 },
    { mile: 1141.0, name: 'Duncannon - Town', type: 'town', reliability: 'reliable', offTrail: 0, notes: 'Doyle Hotel - classic trail town' },
    { mile: 1160.5, name: 'Peters Mountain Shelter', type: 'spring', reliability: 'seasonal', offTrail: 0.3, notes: '⚠️ Often dry - carry from Duncannon' },
    { mile: 1178.0, name: 'Rausch Gap Shelter', type: 'spring', reliability: 'reliable', offTrail: 0.1 },
    { mile: 1194.0, name: '501 Shelter', type: 'piped', reliability: 'reliable', offTrail: 0, notes: 'Enclosed shelter with solar shower' },
    { mile: 1207.3, name: 'Port Clinton - Town', type: 'town', reliability: 'reliable', offTrail: 0, notes: 'Small town, limited services' },
    { mile: 1220.0, name: 'Windsor Furnace Shelter', type: 'spring', reliability: 'seasonal', offTrail: 0.2, notes: 'Check recent reports' },

    // PA/NJ/NY - Mile 1230-1435
    { mile: 1238.0, name: 'Lehigh Gap - Stream', type: 'stream', reliability: 'reliable', offTrail: 0 },
    { mile: 1253.4, name: 'Leroy Smith Shelter', type: 'spring', reliability: 'reliable', offTrail: 0.1 },
    { mile: 1265.6, name: 'Wind Gap - Town', type: 'town', reliability: 'reliable', offTrail: 0.3 },
    { mile: 1276.8, name: 'Kirkridge Shelter', type: 'spring', reliability: 'reliable', offTrail: 0.1 },
    { mile: 1290.0, name: 'Delaware Water Gap - Town', type: 'town', reliability: 'reliable', offTrail: 0, notes: 'Great resupply, bakery!' },
    { mile: 1305.0, name: 'Mohican Outdoor Center', type: 'town', reliability: 'reliable', offTrail: 0.2, notes: 'AMC facility' },
    { mile: 1318.2, name: 'Brink Road Shelter', type: 'spring', reliability: 'reliable', offTrail: 0.1 },
    { mile: 1339.5, name: 'High Point Shelter', type: 'spring', reliability: 'reliable', offTrail: 0.2 },
    { mile: 1353.8, name: 'Unionville - Town', type: 'town', reliability: 'reliable', offTrail: 0.3 },
    { mile: 1370.0, name: 'Pochuck Creek Boardwalk', type: 'stream', reliability: 'reliable', offTrail: 0, notes: 'Cool boardwalk section' },
    { mile: 1385.0, name: 'Wildcat Shelter', type: 'spring', reliability: 'reliable', offTrail: 0.1 },
    { mile: 1395.2, name: 'Wawayanda Shelter', type: 'stream', reliability: 'reliable', offTrail: 0.1 },
    { mile: 1409.6, name: 'Bear Mountain - Facilities', type: 'piped', reliability: 'reliable', offTrail: 0.1, notes: 'Zoo, pool, concessions' },
    { mile: 1433.5, name: 'Arden Valley Road - Stream', type: 'stream', reliability: 'reliable', offTrail: 0 },

    // NY/CT/MA - Mile 1435-1600
    { mile: 1446.0, name: 'William Brien Shelter', type: 'spring', reliability: 'reliable', offTrail: 0.1 },
    { mile: 1460.5, name: 'RPH Shelter', type: 'piped', reliability: 'reliable', offTrail: 0.1, notes: 'Piped spring - excellent' },
    { mile: 1479.5, name: 'Kent - Town', type: 'town', reliability: 'reliable', offTrail: 0.5, notes: 'Nice CT town' },
    { mile: 1494.7, name: 'Silver Hill Campsite', type: 'spring', reliability: 'reliable', offTrail: 0.1 },
    { mile: 1508.0, name: 'Pine Swamp Brook Shelter', type: 'stream', reliability: 'reliable', offTrail: 0.1 },
    { mile: 1521.1, name: 'Salisbury - Town', type: 'town', reliability: 'reliable', offTrail: 0.5 },
    { mile: 1534.4, name: 'Riga Shelter', type: 'spring', reliability: 'reliable', offTrail: 0.1 },
    { mile: 1549.5, name: 'Sage Ravine Campsite', type: 'stream', reliability: 'reliable', offTrail: 0, notes: 'Beautiful cascading brook' },
    { mile: 1566.4, name: 'Great Barrington - Access', type: 'town', reliability: 'reliable', offTrail: 2.0, notes: 'Hitch required' },
    { mile: 1579.7, name: 'Upper Goose Pond Cabin', type: 'stream', reliability: 'reliable', offTrail: 0.5, notes: 'Caretaker cabin, pancakes!' },
    { mile: 1595.3, name: 'Dalton - Town', type: 'town', reliability: 'reliable', offTrail: 0, notes: 'Trail goes through town' },

    // Vermont - Mile 1600-1775
    { mile: 1610.2, name: 'Cheshire - Town', type: 'town', reliability: 'reliable', offTrail: 0.3 },
    { mile: 1621.5, name: 'Wilbur Clearing Shelter', type: 'spring', reliability: 'reliable', offTrail: 0.1 },
    { mile: 1630.5, name: 'North Adams - Access', type: 'town', reliability: 'reliable', offTrail: 0.5 },
    { mile: 1643.0, name: 'Seth Warner Shelter', type: 'spring', reliability: 'reliable', offTrail: 0.1 },
    { mile: 1650.3, name: 'Bennington - Access', type: 'town', reliability: 'reliable', offTrail: 2.0 },
    { mile: 1667.5, name: 'Story Spring Shelter', type: 'spring', reliability: 'reliable', offTrail: 0.1 },
    { mile: 1684.0, name: 'Stratton Pond Shelter', type: 'stream', reliability: 'reliable', offTrail: 0.1, notes: 'Beautiful pond' },
    { mile: 1699.3, name: 'Manchester - Access', type: 'town', reliability: 'reliable', offTrail: 3.0, notes: 'Hitch to town' },
    { mile: 1710.5, name: 'Griffith Lake Tenting', type: 'stream', reliability: 'reliable', offTrail: 0.1 },
    { mile: 1724.5, name: 'Little Rock Pond Shelter', type: 'stream', reliability: 'reliable', offTrail: 0.1 },
    { mile: 1741.8, name: 'Killington - Access', type: 'town', reliability: 'reliable', offTrail: 0.5, notes: 'Inn at Long Trail' },
    { mile: 1755.0, name: 'Stony Brook Shelter', type: 'stream', reliability: 'reliable', offTrail: 0.1 },
    { mile: 1773.3, name: 'Hanover - Town', type: 'town', reliability: 'reliable', offTrail: 0, notes: 'Dartmouth! Great resupply' },

    // New Hampshire - Mile 1773-1912 (WHITE MOUNTAINS!)
    { mile: 1784.0, name: 'Moose Mountain Shelter', type: 'spring', reliability: 'reliable', offTrail: 0.2 },
    { mile: 1797.5, name: 'Hexacuba Shelter', type: 'spring', reliability: 'reliable', offTrail: 0.1 },
    { mile: 1806.5, name: 'Ore Hill Shelter', type: 'stream', reliability: 'reliable', offTrail: 0.1 },
    { mile: 1822.8, name: 'Lincoln - Access', type: 'town', reliability: 'reliable', offTrail: 0.5, notes: 'Major resupply before Whites' },
    { mile: 1830.0, name: 'Eliza Brook Shelter', type: 'stream', reliability: 'reliable', offTrail: 0.1 },
    { mile: 1843.4, name: 'Franconia Notch - Lafayette', type: 'piped', reliability: 'seasonal', offTrail: 0.5, notes: 'Campground facilities' },
    { mile: 1850.2, name: 'Garfield Ridge Shelter', type: 'spring', reliability: 'reliable', offTrail: 0.1 },
    { mile: 1856.0, name: 'Galehead Hut', type: 'town', reliability: 'reliable', offTrail: 0, notes: 'AMC Hut - can buy water/snacks' },
    { mile: 1862.1, name: 'Zealand Falls Hut', type: 'town', reliability: 'reliable', offTrail: 0, notes: 'AMC Hut on waterfall' },
    { mile: 1868.0, name: 'Ethan Pond Campsite', type: 'stream', reliability: 'reliable', offTrail: 0.1 },
    { mile: 1875.0, name: 'Crawford Notch - Highland Ctr', type: 'town', reliability: 'reliable', offTrail: 0.2, notes: 'AMC Highland Center' },
    { mile: 1879.5, name: 'Lakes of the Clouds Hut', type: 'town', reliability: 'reliable', offTrail: 0, notes: 'Highest AMC hut, near summit' },
    { mile: 1884.0, name: 'Madison Spring Hut', type: 'town', reliability: 'reliable', offTrail: 0, notes: 'AMC Hut' },
    { mile: 1890.0, name: 'Pinkham Notch - AMC', type: 'town', reliability: 'reliable', offTrail: 0, notes: 'Major AMC facility, full services' },
    { mile: 1897.0, name: 'Gorham - Access', type: 'town', reliability: 'reliable', offTrail: 0.5, notes: 'Last major resupply before Maine' },
    { mile: 1905.0, name: 'Gentian Pond Campsite', type: 'stream', reliability: 'reliable', offTrail: 0.1 },

    // Maine - Mile 1912-2198 (INCLUDING 100-MILE WILDERNESS!)
    { mile: 1920.4, name: 'Carlo Col Shelter', type: 'spring', reliability: 'reliable', offTrail: 0.2 },
    { mile: 1932.7, name: 'Full Goose Shelter', type: 'stream', reliability: 'reliable', offTrail: 0.1 },
    { mile: 1940.1, name: 'Andover - Access', type: 'town', reliability: 'reliable', offTrail: 2.0, notes: 'Hitch to Andover' },
    { mile: 1954.0, name: 'Surplus Pond', type: 'stream', reliability: 'reliable', offTrail: 0.1 },
    { mile: 1963.5, name: 'Bemis Mountain Lean-to', type: 'stream', reliability: 'reliable', offTrail: 0.1 },
    { mile: 1976.0, name: 'Stratton - Access', type: 'town', reliability: 'reliable', offTrail: 1.0, notes: 'Last major resupply option' },
    { mile: 1991.5, name: 'Horns Pond Lean-tos', type: 'stream', reliability: 'reliable', offTrail: 0.1 },
    { mile: 2010.3, name: 'Caratunk - Access', type: 'town', reliability: 'reliable', offTrail: 0.2, notes: 'Small store' },
    { mile: 2020.0, name: 'Pleasant Pond Lean-to', type: 'stream', reliability: 'reliable', offTrail: 0.1 },
    { mile: 2032.5, name: 'Bald Mountain Stream', type: 'stream', reliability: 'reliable', offTrail: 0 },
    { mile: 2049.5, name: 'Moxie Bald Lean-to', type: 'spring', reliability: 'reliable', offTrail: 0.1 },
    { mile: 2063.0, name: 'Horseshoe Canyon Lean-to', type: 'stream', reliability: 'reliable', offTrail: 0.1 },

    // 100-Mile Wilderness - Mile 2075-2175 (CRITICAL!)
    { mile: 2075.0, name: 'Leeman Brook Lean-to', type: 'stream', reliability: 'reliable', offTrail: 0.1, notes: '⚠️ ENTERING 100-MILE WILDERNESS' },
    { mile: 2090.0, name: 'Monson - LAST RESUPPLY', type: 'town', reliability: 'reliable', offTrail: 0.3, notes: '⚠️ LAST RESUPPLY - stock up!' },
    { mile: 2095.0, name: 'Spectacle Pond', type: 'stream', reliability: 'reliable', offTrail: 0.1 },
    { mile: 2105.0, name: 'Little Wilson Falls', type: 'stream', reliability: 'reliable', offTrail: 0, notes: 'Beautiful falls' },
    { mile: 2115.5, name: 'Long Pond Stream Lean-to', type: 'stream', reliability: 'reliable', offTrail: 0.1 },
    { mile: 2127.0, name: 'Cloud Pond Lean-to', type: 'stream', reliability: 'reliable', offTrail: 0.2 },
    { mile: 2137.0, name: 'Chairback Gap Lean-to', type: 'spring', reliability: 'reliable', offTrail: 0.1 },
    { mile: 2148.0, name: 'Sidney Tappan Campsite', type: 'stream', reliability: 'reliable', offTrail: 0.1 },
    { mile: 2158.5, name: 'White House Landing', type: 'town', reliability: 'reliable', offTrail: 1.0, notes: 'Boat taxi to wilderness lodge - burgers!' },
    { mile: 2168.0, name: 'Nahmakanta Stream Campsite', type: 'stream', reliability: 'reliable', offTrail: 0.1 },
    { mile: 2178.5, name: 'Rainbow Spring Campsite', type: 'spring', reliability: 'reliable', offTrail: 0.1 },
    { mile: 2186.0, name: 'Hurd Brook Lean-to', type: 'stream', reliability: 'reliable', offTrail: 0.1, notes: '⚠️ Last shelter before Katahdin' },
    { mile: 2192.5, name: 'Katahdin Stream Campground', type: 'piped', reliability: 'reliable', offTrail: 0, notes: 'Ranger station, last water before summit' },
    { mile: 2198.0, name: 'Katahdin Summit', type: 'none', reliability: 'none', offTrail: 0, notes: '🏔️ NO WATER ON SUMMIT - carry enough!' },
  ];

  onMount(() => {
    mounted = true;
    // Load saved settings
    const saved = localStorage.getItem('at-water-settings');
    if (saved) {
      try {
        const data = JSON.parse(saved);
        consumptionRate = data.consumptionRate ?? consumptionRate;
        carryCapacity = data.carryCapacity ?? carryCapacity;
        currentWater = data.currentWater ?? currentWater;
        temperatureMode = data.temperatureMode ?? temperatureMode;
      } catch (e) {}
    }
  });

  // Save settings
  $effect(() => {
    if (mounted) {
      localStorage.setItem('at-water-settings', JSON.stringify({
        consumptionRate, carryCapacity, currentWater, temperatureMode
      }));
    }
  });

  // Current mile from context
  let currentMile = $derived(trailContext.currentMile || 0);

  // Temperature multiplier
  let tempMultiplier = $derived(
    temperatureMode === 'cool' ? 0.8 :
    temperatureMode === 'hot' ? 1.4 : 1.0
  );

  // Adjusted consumption rate
  let adjustedRate = $derived(consumptionRate * tempMultiplier);

  // Find nearby water sources
  let upcomingSources = $derived.by(() => {
    return waterSources
      .filter(s => s.mile > currentMile && s.reliability !== 'none')
      .slice(0, 6);
  });

  let previousSources = $derived.by(() => {
    return waterSources
      .filter(s => s.mile <= currentMile && s.reliability !== 'none')
      .slice(-2)
      .reverse();
  });

  // Next reliable source
  let nextReliable = $derived(
    upcomingSources.find(s => s.reliability === 'reliable') || upcomingSources[0]
  );

  // Distance to next source
  let distanceToNext = $derived(
    upcomingSources[0] ? (upcomingSources[0].mile - currentMile).toFixed(1) : 0
  );

  // Water needed to reach next source
  let waterNeededNext = $derived.by(() => {
    if (!upcomingSources[0]) return 0;
    const dist = upcomingSources[0].mile - currentMile;
    return (dist * adjustedRate).toFixed(1);
  });

  // Can reach next source?
  let canReachNext = $derived(parseFloat(currentWater) >= parseFloat(waterNeededNext));

  // Water carry calculator
  let targetMile = $state(null);

  let waterForTarget = $derived.by(() => {
    if (!targetMile) return null;
    const dist = targetMile - currentMile;
    if (dist <= 0) return null;
    return {
      distance: dist.toFixed(1),
      litersNeeded: (dist * adjustedRate).toFixed(1),
      weight: ((dist * adjustedRate) * 2.2).toFixed(1),
      canCarry: (dist * adjustedRate) <= carryCapacity
    };
  });

  // Find long water carries ahead
  let longCarries = $derived.by(() => {
    const carries = [];
    for (let i = 0; i < upcomingSources.length - 1; i++) {
      const from = upcomingSources[i];
      const to = upcomingSources[i + 1];
      const distance = to.mile - from.mile;
      if (distance > 8) { // Flag carries over 8 miles
        carries.push({
          from: from.name,
          fromMile: from.mile,
          to: to.name,
          toMile: to.mile,
          distance: distance.toFixed(1),
          litersNeeded: (distance * adjustedRate).toFixed(1)
        });
      }
    }
    return carries.slice(0, 3);
  });

  // Reliability badge color
  function reliabilityColor(rel) {
    if (rel === 'reliable') return 'reliable';
    if (rel === 'seasonal') return 'seasonal';
    return 'unreliable';
  }

  // Type icon
  function typeIcon(type) {
    const icons = {
      spring: '💧',
      stream: '🏞️',
      creek: '🏞️',
      river: '🌊',
      pond: '🏊',
      piped: '🚰',
      town: '🏪',
      none: '❌'
    };
    return icons[type] || '💧';
  }

  // Water type classification system (green/yellow/red light)
  const waterTypeClassification = {
    green: {
      label: 'Best Water',
      icon: '🟢',
      color: '#16a34a',
      treatment: 'Filter or drops work well. Filter + drops is ideal.',
      types: [
        { name: 'Piped springs', desc: 'Controlled, reliable flow' },
        { name: 'Flowing springs', desc: 'Natural ground water pushing up' },
        { name: 'Rock-fed hillside trickles', desc: 'Clean runoff from rock' },
        { name: 'Waterfalls', desc: 'Aerated, fast-moving water' },
        { name: 'Fast, cold creeks', desc: 'Flowing mountain streams' },
      ]
    },
    yellow: {
      label: 'Acceptable with Caution',
      icon: '🟡',
      color: '#ca8a04',
      treatment: 'Use full treatment protocol.',
      types: [
        { name: 'Clear pooled spring seeps', desc: 'Standing but spring-fed' },
        { name: 'Large rivers', desc: 'Upstream of human activity' },
        { name: 'Large, cold lakes', desc: 'Prefer inflow streams' },
        { name: 'Fresh, clean snow', desc: 'Must be melted and treated' },
      ]
    },
    red: {
      label: 'Avoid Even With Treatment',
      icon: '🔴',
      color: '#dc2626',
      treatment: 'Treatment does not make these safe.',
      types: [
        { name: 'Rain puddles', desc: 'Surface runoff, contaminated' },
        { name: 'Beaver ponds', desc: 'High giardia risk' },
        { name: 'Warm stagnant pools', desc: 'Bacterial growth zone' },
        { name: 'Algae-covered water', desc: 'Toxin risk' },
        { name: 'Road or farm runoff', desc: 'Chemical contamination' },
        { name: 'Water with chemical/rotten smell', desc: 'Trust your nose' },
      ]
    }
  };

  // Map source types to light classification
  function getWaterLight(type) {
    const greenTypes = ['spring', 'piped', 'stream', 'creek'];
    const yellowTypes = ['river', 'pond', 'town'];
    if (greenTypes.includes(type)) return 'green';
    if (yellowTypes.includes(type)) return 'yellow';
    return 'green'; // default for unknown
  }

  // Questionable Water Protocol
  const questionableProtocol = {
    questions: [
      { q: 'Cold or warm?', bad: 'Warm water = higher contamination risk' },
      { q: 'Moving or pooled?', bad: 'Pooled water = more time for pathogens' },
      { q: 'Rock source or dirt runoff?', bad: 'Dirt runoff = surface contamination' },
      { q: 'Any smell, algae, or animal tracks?', bad: 'Visible contamination signs' },
    ],
    ifForced: [
      'Pre-filter through bandana/cloth',
      'Filter through hollow fiber',
      'Add chemical drops',
      'Full or double contact time',
      'Don\'t chug immediately',
    ],
    warning: 'This reduces risk — it does not erase it.'
  };

  // Select target source for calculator
  function selectTarget(mile) {
    targetMile = mile;
  }
</script>

<div class="water-tracker" class:mounted>
  <!-- Header -->
  <header class="tracker-header">
    <div class="header-icon">💧</div>
    <div class="header-content">
      <h2>Water Tracker</h2>
      <p>Plan your water carries</p>
    </div>
    <div class="current-water">
      <span class="water-amount">{currentWater}L</span>
      <span class="water-label">carrying</span>
    </div>
  </header>

  <!-- Current Status Bar -->
  <div class="status-bar" class:warning={!canReachNext}>
    <div class="status-location">
      <span class="loc-icon">📍</span>
      <span>Mile {currentMile}</span>
    </div>
    <div class="status-next">
      <span class="next-label">Next water:</span>
      <span class="next-distance">{distanceToNext} mi</span>
      <span class="next-need">({waterNeededNext}L needed)</span>
    </div>
    {#if !canReachNext}
      <div class="status-warning">⚠️ Need more water!</div>
    {/if}
  </div>

  <!-- Section Tabs -->
  <div class="section-tabs">
    <button class="stab" class:active={activeSection === 'sources'} onclick={() => activeSection = 'sources'}>
      <span class="stab-icon">📍</span>
      <span class="stab-text">Sources</span>
    </button>
    <button class="stab" class:active={activeSection === 'types'} onclick={() => activeSection = 'types'}>
      <span class="stab-icon">🚦</span>
      <span class="stab-text">Types</span>
    </button>
    <button class="stab" class:active={activeSection === 'protocol'} onclick={() => activeSection = 'protocol'}>
      <span class="stab-icon">⚠️</span>
      <span class="stab-text">Protocol</span>
    </button>
  </div>

  {#if activeSection === 'sources'}
  <!-- Quick Settings -->
  <div class="settings-bar">
    <div class="setting-item">
      <label>Carrying</label>
      <div class="input-group">
        <button onclick={() => currentWater = Math.max(0, currentWater - 0.5)}>−</button>
        <input type="number" bind:value={currentWater} min="0" max="6" step="0.5" />
        <button onclick={() => currentWater = Math.min(6, currentWater + 0.5)}>+</button>
        <span class="unit">L</span>
      </div>
    </div>
    <div class="setting-item">
      <label>Conditions</label>
      <select bind:value={temperatureMode}>
        <option value="cool">Cool (−20%)</option>
        <option value="moderate">Moderate</option>
        <option value="hot">Hot (+40%)</option>
      </select>
    </div>
    <div class="setting-item">
      <label>Rate</label>
      <div class="rate-display">
        <span class="rate-value">{adjustedRate.toFixed(2)}</span>
        <span class="rate-unit">L/mi</span>
      </div>
    </div>
  </div>

  <!-- Upcoming Sources -->
  <section class="sources-section">
    <h3 class="section-title">
      <span class="title-icon">⬆️</span>
      Upcoming Water Sources
    </h3>

    <div class="sources-list">
      {#each upcomingSources as source, i}
        {@const distance = (source.mile - currentMile).toFixed(1)}
        {@const waterNeeded = (distance * adjustedRate).toFixed(1)}
        <button
          class="source-card"
          class:selected={targetMile === source.mile}
          onclick={() => selectTarget(source.mile)}
        >
          <div class="source-main">
            <div class="source-icon-wrap">
              <div class="source-icon">{typeIcon(source.type)}</div>
              <span class="water-light-indicator" class:green={getWaterLight(source.type) === 'green'} class:yellow={getWaterLight(source.type) === 'yellow'}></span>
            </div>
            <div class="source-info">
              <div class="source-name">{source.name}</div>
              <div class="source-meta">
                <span class="source-mile">Mile {source.mile}</span>
                {#if source.offTrail > 0}
                  <span class="off-trail">+{source.offTrail} mi off trail</span>
                {/if}
              </div>
            </div>
          </div>
          <div class="source-right">
            <div class="source-distance">{distance} mi</div>
            <div class="source-water">{waterNeeded}L needed</div>
            <span class="reliability-badge {reliabilityColor(source.reliability)}">
              {source.reliability}
            </span>
          </div>
          {#if source.notes}
            <div class="source-notes">{source.notes}</div>
          {/if}
        </button>
      {/each}
    </div>
  </section>

  <!-- Water Carry Calculator -->
  {#if waterForTarget}
    <section class="calculator-section">
      <h3 class="section-title">
        <span class="title-icon">🧮</span>
        Water Carry Calculator
      </h3>
      <div class="calc-card" class:danger={!waterForTarget.canCarry}>
        <div class="calc-target">
          To reach Mile {targetMile}
        </div>
        <div class="calc-stats">
          <div class="calc-stat">
            <span class="stat-value">{waterForTarget.distance}</span>
            <span class="stat-label">miles</span>
          </div>
          <div class="calc-stat primary">
            <span class="stat-value">{waterForTarget.litersNeeded}</span>
            <span class="stat-label">liters needed</span>
          </div>
          <div class="calc-stat">
            <span class="stat-value">{waterForTarget.weight}</span>
            <span class="stat-label">lbs of water</span>
          </div>
        </div>
        {#if !waterForTarget.canCarry}
          <div class="calc-warning">
            ⚠️ Exceeds your {carryCapacity}L carry capacity!
            Consider stopping at an earlier source.
          </div>
        {:else if parseFloat(currentWater) < parseFloat(waterForTarget.litersNeeded)}
          <div class="calc-info">
            💡 Fill up to at least {waterForTarget.litersNeeded}L before leaving
          </div>
        {:else}
          <div class="calc-ok">
            ✓ You have enough water ({currentWater}L)
          </div>
        {/if}
      </div>
    </section>
  {/if}

  <!-- Long Carries Warning -->
  {#if longCarries.length > 0}
    <section class="warning-section">
      <h3 class="section-title">
        <span class="title-icon">⚠️</span>
        Long Water Carries Ahead
      </h3>
      <div class="carries-list">
        {#each longCarries as carry}
          <div class="carry-card">
            <div class="carry-route">
              <span class="carry-from">{carry.from}</span>
              <span class="carry-arrow">→</span>
              <span class="carry-to">{carry.to}</span>
            </div>
            <div class="carry-stats">
              <span class="carry-distance">{carry.distance} mi</span>
              <span class="carry-water">{carry.litersNeeded}L needed</span>
            </div>
          </div>
        {/each}
      </div>
    </section>
  {/if}

  <!-- Previous Sources (for backtracking) -->
  {#if previousSources.length > 0}
    <section class="sources-section previous">
      <h3 class="section-title">
        <span class="title-icon">⬇️</span>
        Behind You
      </h3>
      <div class="sources-list compact">
        {#each previousSources as source}
          {@const distance = (currentMile - source.mile).toFixed(1)}
          <div class="source-card compact">
            <div class="source-main">
              <div class="source-icon">{typeIcon(source.type)}</div>
              <div class="source-info">
                <div class="source-name">{source.name}</div>
                <span class="reliability-badge {reliabilityColor(source.reliability)}">
                  {source.reliability}
                </span>
              </div>
            </div>
            <div class="source-right">
              <div class="source-distance">{distance} mi back</div>
            </div>
          </div>
        {/each}
      </div>
    </section>
  {/if}

  <!-- Settings Panel -->
  <section class="settings-section">
    <h3 class="section-title">
      <span class="title-icon">⚙️</span>
      Your Settings
    </h3>
    <div class="settings-grid">
      <div class="setting-row">
        <label>Base Consumption Rate</label>
        <div class="setting-control">
          <input
            type="range"
            bind:value={consumptionRate}
            min="0.3"
            max="1.0"
            step="0.05"
          />
          <span class="setting-value">{consumptionRate} L/mi</span>
        </div>
        <p class="setting-hint">Typical: 0.4-0.6 L/mi flat, 0.6-0.8 L/mi mountainous</p>
      </div>
      <div class="setting-row">
        <label>Max Carry Capacity</label>
        <div class="setting-control">
          <input
            type="range"
            bind:value={carryCapacity}
            min="1"
            max="6"
            step="0.5"
          />
          <span class="setting-value">{carryCapacity} L ({(carryCapacity * 2.2).toFixed(1)} lbs)</span>
        </div>
        <p class="setting-hint">Most hikers carry 2-4L capacity</p>
      </div>
    </div>
  </section>

  <!-- Tips -->
  <div class="tips-section">
    <h4>💡 Water Tips</h4>
    <ul>
      <li><strong>1 liter = 2.2 lbs</strong> — Water is your heaviest consumable</li>
      <li><strong>Camel up</strong> at sources — drink extra before leaving</li>
      <li><strong>Seasonal sources</strong> may be dry in summer/drought</li>
      <li><strong>Town water</strong> — Fill up at every opportunity</li>
    </ul>
  </div>
  {/if}

  <!-- Water Types Section -->
  {#if activeSection === 'types'}
  <div class="types-content">
    <div class="types-intro">
      <p><strong>Not all water is equal.</strong> Even with treatment, some sources are safer than others.</p>
    </div>

    {#each Object.entries(waterTypeClassification) as [key, classification]}
      <div class="type-category" style="--type-color: {classification.color}">
        <div class="type-header">
          <span class="type-light">{classification.icon}</span>
          <h3 class="type-label">{classification.label}</h3>
        </div>
        <div class="type-treatment">{classification.treatment}</div>
        <div class="type-list">
          {#each classification.types as type}
            <div class="type-item">
              <span class="type-name">{type.name}</span>
              <span class="type-desc">{type.desc}</span>
            </div>
          {/each}
        </div>
      </div>
    {/each}

    <div class="types-rules">
      <h4>Water Planning Rules</h4>
      <div class="rules-grid">
        <div class="rule-item trust"><span class="rule-icon">✓</span> Creeks = Trust</div>
        <div class="rule-item verify"><span class="rule-icon">?</span> Springs = Verify</div>
        <div class="rule-item ignore"><span class="rule-icon">✗</span> Seeps = Ignore</div>
      </div>
      <ul class="rules-list">
        <li>Never skip water before a ridge</li>
        <li>Carry extra when shelter water is spring-fed</li>
        <li>Ask: "What's my next guaranteed creek?"</li>
      </ul>
    </div>
  </div>
  {/if}

  <!-- Questionable Water Protocol -->
  {#if activeSection === 'protocol'}
  <div class="protocol-content">
    <div class="protocol-intro">
      <div class="protocol-icon">⚠️</div>
      <div class="protocol-text">
        <h3>When You Hesitate at a Source</h3>
        <p>If any answer is wrong, treatment alone is not enough.</p>
      </div>
    </div>

    <div class="protocol-questions">
      <h4>Ask These Questions</h4>
      {#each questionableProtocol.questions as item, i}
        <div class="question-item">
          <div class="question-number">{i + 1}</div>
          <div class="question-content">
            <div class="question-text">{item.q}</div>
            <div class="question-bad">{item.bad}</div>
          </div>
        </div>
      {/each}
    </div>

    <div class="protocol-forced">
      <h4>If Forced to Use Questionable Water</h4>
      <div class="forced-steps">
        {#each questionableProtocol.ifForced as step, i}
          <div class="forced-step">
            <span class="step-number">{i + 1}</span>
            <span class="step-text">{step}</span>
          </div>
        {/each}
      </div>
      <div class="protocol-warning">
        <span class="warning-icon">⚠️</span>
        <span>{questionableProtocol.warning}</span>
      </div>
    </div>

    <div class="protocol-visual">
      <h4>Visual Red Flags — Skip or Move Upstream</h4>
      <div class="red-flags">
        <span class="flag">Algae/green film</span>
        <span class="flag">Strong odor</span>
        <span class="flag">Heavy animal activity</span>
        <span class="flag">Flood runoff after rain</span>
      </div>
    </div>
  </div>
  {/if}
</div>

<style>
  .water-tracker {
    background: var(--card, #fff);
    border-radius: 16px;
    box-shadow: 0 4px 24px rgba(0,0,0,0.08);
    border: 1px solid var(--border);
    overflow: hidden;
    opacity: 0;
    transform: translateY(10px);
    transition: all 0.5s ease;
  }

  .water-tracker.mounted {
    opacity: 1;
    transform: translateY(0);
  }

  /* Header */
  .tracker-header {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 1.5rem;
    background: linear-gradient(135deg, #0ea5e9, #0284c7);
    color: #fff;
  }

  .header-icon {
    font-size: 2rem;
  }

  .header-content {
    flex: 1;
  }

  .header-content h2 {
    margin: 0;
    font-family: Oswald, sans-serif;
    font-size: 1.5rem;
    font-weight: 700;
  }

  .header-content p {
    margin: 0.25rem 0 0;
    font-size: 0.9rem;
    opacity: 0.9;
  }

  .current-water {
    text-align: center;
    background: rgba(255,255,255,0.2);
    padding: 0.5rem 1rem;
    border-radius: 10px;
  }

  .water-amount {
    display: block;
    font-family: Oswald, sans-serif;
    font-size: 1.5rem;
    font-weight: 700;
  }

  .water-label {
    font-size: 0.7rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    opacity: 0.8;
  }

  /* Status Bar */
  .status-bar {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 1rem;
    padding: 0.75rem 1.5rem;
    background: #f0f9ff;
    border-bottom: 1px solid var(--border);
  }

  .status-bar.warning {
    background: #fef2f2;
  }

  .status-location {
    display: flex;
    align-items: center;
    gap: 0.35rem;
    font-weight: 600;
    color: var(--ink);
  }

  .status-next {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.9rem;
  }

  .next-label {
    color: var(--muted);
  }

  .next-distance {
    font-weight: 600;
    color: #0284c7;
  }

  .next-need {
    color: var(--muted);
    font-size: 0.85rem;
  }

  .status-warning {
    color: #dc2626;
    font-weight: 600;
    font-size: 0.9rem;
  }

  /* Settings Bar */
  .settings-bar {
    display: flex;
    gap: 1rem;
    padding: 1rem 1.5rem;
    background: var(--bg);
    border-bottom: 1px solid var(--border);
    flex-wrap: wrap;
  }

  .setting-item {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
  }

  .setting-item label {
    font-size: 0.7rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--muted);
  }

  .input-group {
    display: flex;
    align-items: center;
    gap: 0.25rem;
  }

  .input-group button {
    width: 28px;
    height: 28px;
    border: 1px solid var(--border);
    border-radius: 6px;
    background: #fff;
    font-weight: 600;
    cursor: pointer;
    color: var(--pine);
  }

  .input-group button:hover {
    background: var(--alpine);
    color: #fff;
    border-color: var(--alpine);
  }

  .input-group input {
    width: 50px;
    padding: 0.35rem;
    border: 1px solid var(--border);
    border-radius: 6px;
    text-align: center;
    font-family: Oswald, sans-serif;
    font-size: 1rem;
    font-weight: 600;
  }

  .input-group .unit {
    font-size: 0.85rem;
    color: var(--muted);
    margin-left: 0.25rem;
  }

  .settings-bar select {
    padding: 0.4rem 0.6rem;
    border: 1px solid var(--border);
    border-radius: 6px;
    font-size: 0.85rem;
    background: #fff;
  }

  .rate-display {
    display: flex;
    align-items: baseline;
    gap: 0.25rem;
    padding: 0.35rem 0.6rem;
    background: #e0f2fe;
    border-radius: 6px;
  }

  .rate-value {
    font-family: Oswald, sans-serif;
    font-size: 1rem;
    font-weight: 600;
    color: #0284c7;
  }

  .rate-unit {
    font-size: 0.75rem;
    color: #0369a1;
  }

  /* Sections */
  section {
    padding: 1.5rem;
    border-bottom: 1px solid var(--border);
  }

  section:last-of-type {
    border-bottom: none;
  }

  .section-title {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin: 0 0 1rem;
    font-family: Oswald, sans-serif;
    font-size: 1rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--pine);
  }

  .title-icon {
    font-size: 1.1rem;
  }

  /* Source Cards */
  .sources-list {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .source-card {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 1rem;
    padding: 1rem;
    background: #fff;
    border: 1px solid var(--border);
    border-radius: 12px;
    cursor: pointer;
    transition: all 0.2s;
    text-align: left;
    width: 100%;
  }

  .source-card:hover {
    border-color: #0ea5e9;
    background: #f0f9ff;
  }

  .source-card.selected {
    border-color: #0284c7;
    background: #e0f2fe;
    box-shadow: 0 0 0 2px rgba(2, 132, 199, 0.2);
  }

  .source-main {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    flex: 1;
    min-width: 200px;
  }

  .source-icon-wrap {
    position: relative;
  }

  .source-icon {
    font-size: 1.5rem;
  }

  .water-light-indicator {
    position: absolute;
    bottom: -2px;
    right: -2px;
    width: 10px;
    height: 10px;
    border-radius: 50%;
    border: 2px solid #fff;
  }

  .water-light-indicator.green {
    background: #16a34a;
  }

  .water-light-indicator.yellow {
    background: #ca8a04;
  }

  .source-info {
    flex: 1;
  }

  .source-name {
    font-weight: 600;
    color: var(--ink);
    font-size: 0.95rem;
  }

  .source-meta {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    margin-top: 0.25rem;
    font-size: 0.8rem;
    color: var(--muted);
  }

  .off-trail {
    color: #ea580c;
    font-weight: 500;
  }

  .source-right {
    text-align: right;
  }

  .source-distance {
    font-family: Oswald, sans-serif;
    font-size: 1.1rem;
    font-weight: 600;
    color: #0284c7;
  }

  .source-water {
    font-size: 0.8rem;
    color: var(--muted);
  }

  .reliability-badge {
    display: inline-block;
    padding: 0.2rem 0.5rem;
    border-radius: 20px;
    font-size: 0.65rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.03em;
    margin-top: 0.35rem;
  }

  .reliability-badge.reliable {
    background: #dcfce7;
    color: #166534;
  }

  .reliability-badge.seasonal {
    background: #fef3c7;
    color: #92400e;
  }

  .reliability-badge.unreliable {
    background: #fee2e2;
    color: #991b1b;
  }

  .source-notes {
    width: 100%;
    font-size: 0.8rem;
    color: var(--muted);
    font-style: italic;
    padding-top: 0.5rem;
    border-top: 1px dashed var(--border);
    margin-top: 0.5rem;
  }

  /* Compact source cards */
  .sources-list.compact .source-card {
    padding: 0.75rem;
  }

  .source-card.compact .source-icon {
    font-size: 1.2rem;
  }

  .previous .section-title {
    color: var(--muted);
  }

  /* Calculator */
  .calc-card {
    background: #f0f9ff;
    border: 1px solid #bae6fd;
    border-radius: 12px;
    padding: 1.25rem;
  }

  .calc-card.danger {
    background: #fef2f2;
    border-color: #fca5a5;
  }

  .calc-target {
    font-family: Oswald, sans-serif;
    font-size: 1rem;
    font-weight: 600;
    color: #0369a1;
    margin-bottom: 1rem;
    text-align: center;
  }

  .calc-stats {
    display: flex;
    justify-content: center;
    gap: 2rem;
    margin-bottom: 1rem;
  }

  .calc-stat {
    text-align: center;
  }

  .calc-stat .stat-value {
    display: block;
    font-family: Oswald, sans-serif;
    font-size: 1.75rem;
    font-weight: 700;
    color: var(--ink);
    line-height: 1;
  }

  .calc-stat.primary .stat-value {
    color: #0284c7;
    font-size: 2rem;
  }

  .calc-stat .stat-label {
    font-size: 0.7rem;
    color: var(--muted);
    text-transform: uppercase;
    letter-spacing: 0.03em;
  }

  .calc-warning, .calc-info, .calc-ok {
    text-align: center;
    padding: 0.75rem;
    border-radius: 8px;
    font-size: 0.9rem;
  }

  .calc-warning {
    background: #fee2e2;
    color: #991b1b;
  }

  .calc-info {
    background: #fef3c7;
    color: #92400e;
  }

  .calc-ok {
    background: #dcfce7;
    color: #166534;
  }

  /* Long Carries */
  .carries-list {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .carry-card {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem;
    background: #fef3c7;
    border: 1px solid #fbbf24;
    border-radius: 10px;
  }

  .carry-route {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.9rem;
  }

  .carry-from, .carry-to {
    font-weight: 600;
    color: var(--ink);
  }

  .carry-arrow {
    color: var(--muted);
  }

  .carry-stats {
    display: flex;
    gap: 1rem;
    font-size: 0.85rem;
  }

  .carry-distance {
    font-weight: 600;
    color: #92400e;
  }

  .carry-water {
    color: var(--muted);
  }

  /* Settings Section */
  .settings-grid {
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
  }

  .setting-row label {
    display: block;
    font-weight: 600;
    color: var(--ink);
    margin-bottom: 0.5rem;
  }

  .setting-control {
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  .setting-control input[type="range"] {
    flex: 1;
    height: 6px;
    -webkit-appearance: none;
    background: #e5e7eb;
    border-radius: 3px;
  }

  .setting-control input[type="range"]::-webkit-slider-thumb {
    -webkit-appearance: none;
    width: 18px;
    height: 18px;
    background: #0284c7;
    border-radius: 50%;
    cursor: pointer;
  }

  .setting-value {
    min-width: 100px;
    font-family: Oswald, sans-serif;
    font-weight: 600;
    color: #0284c7;
  }

  .setting-hint {
    margin: 0.5rem 0 0;
    font-size: 0.8rem;
    color: var(--muted);
  }

  /* Tips */
  .tips-section {
    padding: 1.25rem 1.5rem;
    background: #f0f9ff;
    border-top: 1px solid var(--border);
  }

  .tips-section h4 {
    margin: 0 0 0.75rem;
    font-family: Oswald, sans-serif;
    font-size: 0.9rem;
    color: #0369a1;
  }

  .tips-section ul {
    margin: 0;
    padding-left: 1.25rem;
    font-size: 0.85rem;
    color: var(--muted);
  }

  .tips-section li {
    margin-bottom: 0.35rem;
  }

  .tips-section strong {
    color: var(--ink);
  }

  /* Responsive */
  @media (max-width: 640px) {
    .tracker-header {
      flex-wrap: wrap;
      gap: 0.75rem;
      padding: 1.25rem;
    }

    .header-content h2 {
      font-size: 1.25rem;
    }

    .status-bar {
      flex-direction: column;
      align-items: flex-start;
      gap: 0.5rem;
    }

    .settings-bar {
      flex-direction: column;
      gap: 0.75rem;
    }

    .setting-item {
      flex-direction: row;
      align-items: center;
      justify-content: space-between;
      width: 100%;
    }

    .source-card {
      flex-direction: column;
      align-items: flex-start;
    }

    .source-right {
      text-align: left;
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .calc-stats {
      gap: 1rem;
    }

    .calc-stat .stat-value {
      font-size: 1.5rem;
    }

    .calc-stat.primary .stat-value {
      font-size: 1.75rem;
    }

    .carry-card {
      flex-direction: column;
      align-items: flex-start;
      gap: 0.5rem;
    }
  }

  /* Section Tabs */
  .section-tabs {
    display: flex;
    gap: 0;
    padding: 0;
    background: var(--bg);
    border-bottom: 1px solid var(--border);
  }

  .stab {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.4rem;
    padding: 0.9rem 0.5rem;
    background: none;
    border: none;
    border-bottom: 3px solid transparent;
    color: var(--muted);
    font-size: 0.85rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
  }

  .stab:hover {
    background: rgba(14, 165, 233, 0.05);
    color: var(--ink);
  }

  .stab.active {
    color: #0284c7;
    border-bottom-color: #0284c7;
    background: rgba(14, 165, 233, 0.08);
  }

  .stab-icon {
    font-size: 1rem;
  }

  .stab-text {
    font-family: Oswald, sans-serif;
    font-weight: 600;
    letter-spacing: 0.02em;
  }

  /* Types Content */
  .types-content {
    padding: 1.5rem;
  }

  .types-intro {
    padding: 1rem;
    background: #f0f9ff;
    border-radius: 10px;
    margin-bottom: 1.5rem;
    font-size: 0.95rem;
    color: var(--ink);
  }

  .types-intro p {
    margin: 0;
  }

  .type-category {
    background: #fff;
    border: 1px solid var(--border);
    border-left: 4px solid var(--type-color);
    border-radius: 10px;
    margin-bottom: 1rem;
    overflow: hidden;
  }

  .type-header {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 1rem;
    background: linear-gradient(90deg, rgba(0,0,0,0.02), transparent);
  }

  .type-light {
    font-size: 1.5rem;
  }

  .type-label {
    margin: 0;
    font-family: Oswald, sans-serif;
    font-size: 1.1rem;
    font-weight: 600;
    color: var(--type-color);
  }

  .type-treatment {
    padding: 0.5rem 1rem;
    font-size: 0.85rem;
    color: var(--muted);
    font-style: italic;
    border-bottom: 1px solid var(--border);
  }

  .type-list {
    padding: 0.75rem 1rem;
  }

  .type-item {
    display: flex;
    flex-direction: column;
    padding: 0.5rem 0;
    border-bottom: 1px dashed var(--border);
  }

  .type-item:last-child {
    border-bottom: none;
  }

  .type-name {
    font-weight: 600;
    color: var(--ink);
    font-size: 0.9rem;
  }

  .type-desc {
    font-size: 0.8rem;
    color: var(--muted);
  }

  .types-rules {
    background: #fefce8;
    border: 1px solid #fbbf24;
    border-radius: 10px;
    padding: 1.25rem;
    margin-top: 1.5rem;
  }

  .types-rules h4 {
    margin: 0 0 1rem;
    font-family: Oswald, sans-serif;
    font-size: 1rem;
    color: #92400e;
  }

  .rules-grid {
    display: flex;
    gap: 0.5rem;
    margin-bottom: 1rem;
    flex-wrap: wrap;
  }

  .rule-item {
    display: flex;
    align-items: center;
    gap: 0.35rem;
    padding: 0.5rem 0.75rem;
    border-radius: 20px;
    font-size: 0.85rem;
    font-weight: 600;
  }

  .rule-item.trust {
    background: #dcfce7;
    color: #166534;
  }

  .rule-item.verify {
    background: #fef3c7;
    color: #92400e;
  }

  .rule-item.ignore {
    background: #fee2e2;
    color: #991b1b;
  }

  .rule-icon {
    font-size: 0.9rem;
  }

  .rules-list {
    margin: 0;
    padding-left: 1.25rem;
    font-size: 0.85rem;
    color: var(--ink);
  }

  .rules-list li {
    margin-bottom: 0.35rem;
  }

  /* Protocol Content */
  .protocol-content {
    padding: 1.5rem;
  }

  .protocol-intro {
    display: flex;
    align-items: flex-start;
    gap: 1rem;
    padding: 1.25rem;
    background: #fef2f2;
    border: 1px solid #fca5a5;
    border-radius: 12px;
    margin-bottom: 1.5rem;
  }

  .protocol-icon {
    font-size: 2rem;
  }

  .protocol-text h3 {
    margin: 0 0 0.35rem;
    font-family: Oswald, sans-serif;
    font-size: 1.1rem;
    color: #991b1b;
  }

  .protocol-text p {
    margin: 0;
    font-size: 0.9rem;
    color: #7f1d1d;
  }

  .protocol-questions {
    margin-bottom: 1.5rem;
  }

  .protocol-questions h4, .protocol-forced h4, .protocol-visual h4 {
    margin: 0 0 1rem;
    font-family: Oswald, sans-serif;
    font-size: 1rem;
    color: var(--pine);
  }

  .question-item {
    display: flex;
    gap: 1rem;
    padding: 1rem;
    background: #fff;
    border: 1px solid var(--border);
    border-radius: 10px;
    margin-bottom: 0.75rem;
  }

  .question-number {
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #0ea5e9;
    color: #fff;
    border-radius: 50%;
    font-family: Oswald, sans-serif;
    font-weight: 700;
    flex-shrink: 0;
  }

  .question-content {
    flex: 1;
  }

  .question-text {
    font-weight: 600;
    color: var(--ink);
    font-size: 0.95rem;
    margin-bottom: 0.25rem;
  }

  .question-bad {
    font-size: 0.8rem;
    color: var(--terra);
  }

  .protocol-forced {
    background: #fffbeb;
    border: 1px solid #fbbf24;
    border-radius: 12px;
    padding: 1.25rem;
    margin-bottom: 1.5rem;
  }

  .forced-steps {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    margin-bottom: 1rem;
  }

  .forced-step {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.75rem;
    background: #fff;
    border-radius: 8px;
  }

  .step-number {
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #f59e0b;
    color: #fff;
    border-radius: 50%;
    font-size: 0.75rem;
    font-weight: 700;
    flex-shrink: 0;
  }

  .step-text {
    font-size: 0.9rem;
    color: var(--ink);
  }

  .protocol-warning {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem;
    background: #fee2e2;
    border-radius: 8px;
    font-size: 0.85rem;
    font-weight: 600;
    color: #991b1b;
  }

  .protocol-visual {
    background: #fff;
    border: 1px solid var(--border);
    border-radius: 12px;
    padding: 1.25rem;
  }

  .red-flags {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
  }

  .flag {
    padding: 0.5rem 0.75rem;
    background: #fee2e2;
    color: #991b1b;
    border-radius: 20px;
    font-size: 0.8rem;
    font-weight: 500;
  }

  @media (max-width: 640px) {
    .section-tabs {
      overflow-x: auto;
    }

    .stab {
      padding: 0.75rem 0.5rem;
      font-size: 0.75rem;
    }

    .stab-icon {
      font-size: 0.9rem;
    }

    .protocol-intro {
      flex-direction: column;
      text-align: center;
    }

    .question-item {
      flex-direction: column;
      text-align: center;
    }

    .question-number {
      margin: 0 auto;
    }

    .rules-grid {
      flex-direction: column;
    }
  }
</style>
