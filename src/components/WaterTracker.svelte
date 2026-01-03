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
    { mile: 328.3, name: 'Nolichucky River', type: 'river', reliability: 'reliable', offTrail: 0, notes: '⚠️ 2026: No ferry - 3.6mi road walk or shuttle. Uncle Johnnys nearby.' },
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
    { mile: 520.8, name: 'Davis Path Shelter', type: 'spring', reliability: 'seasonal', offTrail: 0.3, notes: 'OFTEN DRY - plan ahead' },
    { mile: 533.7, name: 'Chestnut Knob Shelter', type: 'spring', reliability: 'unreliable', offTrail: 0.5, notes: 'UNRELIABLE - carry extra water' },
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
    { mile: 1035.5, name: 'Pine Knob Shelter', type: 'spring', reliability: 'seasonal', offTrail: 0.3, notes: 'PA ridge springs often unreliable' },
    { mile: 1048.9, name: 'Tumbling Run Shelters', type: 'stream', reliability: 'reliable', offTrail: 0.1 },
    { mile: 1066.1, name: 'Rocky Mountain Shelter', type: 'spring', reliability: 'seasonal', offTrail: 0.2 },
    { mile: 1078.5, name: 'Antietam Shelter', type: 'spring', reliability: 'reliable', offTrail: 0.1 },
    { mile: 1094.4, name: 'Pen Mar County Park', type: 'piped', reliability: 'seasonal', offTrail: 0.1, notes: 'Seasonal water fountain' },
    { mile: 1108.5, name: 'Quarry Gap Shelters', type: 'spring', reliability: 'reliable', offTrail: 0.1 },
    { mile: 1123.0, name: 'Birch Run Shelter', type: 'stream', reliability: 'reliable', offTrail: 0.1 },
    { mile: 1141.0, name: 'Duncannon - Town', type: 'town', reliability: 'reliable', offTrail: 0, notes: 'Doyle Hotel - classic trail town' },
    { mile: 1160.5, name: 'Peters Mountain Shelter', type: 'spring', reliability: 'seasonal', offTrail: 0.3, notes: 'Often dry - carry from Duncannon' },
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
    { mile: 2075.0, name: 'Leeman Brook Lean-to', type: 'stream', reliability: 'reliable', offTrail: 0.1, notes: 'ENTERING 100-MILE WILDERNESS' },
    { mile: 2090.0, name: 'Monson - LAST RESUPPLY', type: 'town', reliability: 'reliable', offTrail: 0.3, notes: 'LAST RESUPPLY - stock up!' },
    { mile: 2095.0, name: 'Spectacle Pond', type: 'stream', reliability: 'reliable', offTrail: 0.1 },
    { mile: 2105.0, name: 'Little Wilson Falls', type: 'stream', reliability: 'reliable', offTrail: 0, notes: 'Beautiful falls' },
    { mile: 2115.5, name: 'Long Pond Stream Lean-to', type: 'stream', reliability: 'reliable', offTrail: 0.1 },
    { mile: 2127.0, name: 'Cloud Pond Lean-to', type: 'stream', reliability: 'reliable', offTrail: 0.2 },
    { mile: 2137.0, name: 'Chairback Gap Lean-to', type: 'spring', reliability: 'reliable', offTrail: 0.1 },
    { mile: 2148.0, name: 'Sidney Tappan Campsite', type: 'stream', reliability: 'reliable', offTrail: 0.1 },
    { mile: 2158.5, name: 'White House Landing', type: 'town', reliability: 'reliable', offTrail: 1.0, notes: 'Boat taxi to wilderness lodge - burgers!' },
    { mile: 2168.0, name: 'Nahmakanta Stream Campsite', type: 'stream', reliability: 'reliable', offTrail: 0.1 },
    { mile: 2178.5, name: 'Rainbow Spring Campsite', type: 'spring', reliability: 'reliable', offTrail: 0.1 },
    { mile: 2186.0, name: 'Hurd Brook Lean-to', type: 'stream', reliability: 'reliable', offTrail: 0.1, notes: 'Last shelter before Katahdin' },
    { mile: 2192.5, name: 'Katahdin Stream Campground', type: 'piped', reliability: 'reliable', offTrail: 0, notes: 'Ranger station, last water before summit' },
    { mile: 2198.0, name: 'Katahdin Summit', type: 'none', reliability: 'none', offTrail: 0, notes: 'NO WATER ON SUMMIT - carry enough!' },
  ];

  onMount(() => {
    mounted = true;
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

  $effect(() => {
    if (mounted) {
      localStorage.setItem('at-water-settings', JSON.stringify({
        consumptionRate, carryCapacity, currentWater, temperatureMode
      }));
    }
  });

  let currentMile = $derived(trailContext.currentMile || 0);

  let tempMultiplier = $derived(
    temperatureMode === 'cool' ? 0.8 :
    temperatureMode === 'hot' ? 1.4 : 1.0
  );

  let adjustedRate = $derived(consumptionRate * tempMultiplier);

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

  let nextReliable = $derived(
    upcomingSources.find(s => s.reliability === 'reliable') || upcomingSources[0]
  );

  let distanceToNext = $derived(
    upcomingSources[0] ? (upcomingSources[0].mile - currentMile).toFixed(1) : 0
  );

  let waterNeededNext = $derived.by(() => {
    if (!upcomingSources[0]) return 0;
    const dist = upcomingSources[0].mile - currentMile;
    return (dist * adjustedRate).toFixed(1);
  });

  let canReachNext = $derived(parseFloat(currentWater) >= parseFloat(waterNeededNext));

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

  let longCarries = $derived.by(() => {
    const carries = [];
    for (let i = 0; i < upcomingSources.length - 1; i++) {
      const from = upcomingSources[i];
      const to = upcomingSources[i + 1];
      const distance = to.mile - from.mile;
      if (distance > 8) {
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

  let waterPercent = $derived(Math.min(100, (currentWater / carryCapacity) * 100));

  function reliabilityColor(rel) {
    if (rel === 'reliable') return 'reliable';
    if (rel === 'seasonal') return 'seasonal';
    return 'unreliable';
  }

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

  function getWaterLight(type) {
    const greenTypes = ['spring', 'piped', 'stream', 'creek'];
    const yellowTypes = ['river', 'pond', 'town'];
    if (greenTypes.includes(type)) return 'green';
    if (yellowTypes.includes(type)) return 'yellow';
    return 'green';
  }

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

  function selectTarget(mile) {
    targetMile = mile;
  }
</script>

<div class="water-tracker" class:mounted>
  <!-- Hero Header -->
  <header class="hydro-header">
    <div class="wave-bg">
      <svg viewBox="0 0 400 80" preserveAspectRatio="none">
        <path class="wave wave1" d="M0,40 Q50,20 100,40 T200,40 T300,40 T400,40 V80 H0 Z" />
        <path class="wave wave2" d="M0,50 Q50,30 100,50 T200,50 T300,50 T400,50 V80 H0 Z" />
      </svg>
    </div>
    <div class="header-content">
      <div class="header-left">
        <div class="drop-icon">
          <svg viewBox="0 0 40 50" width="40" height="50">
            <path d="M20,2 Q35,20 35,32 A15,15 0 1,1 5,32 Q5,20 20,2" fill="#fff" fill-opacity="0.2" stroke="#fff" stroke-width="2"/>
            <path d="M12,35 Q15,30 20,35" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round"/>
          </svg>
        </div>
        <div class="header-text">
          <h2>Water Tracker</h2>
          <p>Hydration & Source Planning</p>
        </div>
      </div>
      <div class="water-gauge">
        <div class="gauge-container">
          <div class="gauge-fill" style="height: {waterPercent}%"></div>
          <div class="gauge-bubbles">
            <span class="bubble b1"></span>
            <span class="bubble b2"></span>
            <span class="bubble b3"></span>
          </div>
          <div class="gauge-reading">{currentWater}</div>
        </div>
        <span class="gauge-label">LITERS</span>
      </div>
    </div>
  </header>

  <!-- Status Bar -->
  <div class="status-bar" class:warning={!canReachNext}>
    <div class="status-loc">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12,2C8.13,2 5,5.13 5,9c0,5.25 7,13 7,13s7-7.75 7-13C19,5.13 15.87,2 12,2zm0,9.5c-1.38,0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5,1.12 2.5,2.5-1.12,2.5-2.5,2.5z"/>
      </svg>
      <span>Mile {currentMile}</span>
    </div>
    <div class="status-divider"></div>
    <div class="status-next">
      <span class="next-text">Next source in</span>
      <span class="next-dist">{distanceToNext} mi</span>
      <span class="next-need">({waterNeededNext}L)</span>
    </div>
    {#if !canReachNext}
      <div class="status-alert">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <path d="M1,21h22L12,2 1,21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/>
        </svg>
        Low Water
      </div>
    {/if}
  </div>

  <!-- Tab Navigation -->
  <nav class="tab-nav">
    <button class="tab-btn" class:active={activeSection === 'sources'} onclick={() => activeSection = 'sources'}>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
        <circle cx="12" cy="10" r="3"/>
      </svg>
      <span>Sources</span>
    </button>
    <button class="tab-btn" class:active={activeSection === 'types'} onclick={() => activeSection = 'types'}>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="10"/>
        <path d="M12 6v6l4 2"/>
      </svg>
      <span>Quality</span>
    </button>
    <button class="tab-btn" class:active={activeSection === 'protocol'} onclick={() => activeSection = 'protocol'}>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
        <line x1="12" y1="9" x2="12" y2="13"/>
        <line x1="12" y1="17" x2="12.01" y2="17"/>
      </svg>
      <span>Protocol</span>
    </button>
  </nav>

  {#if activeSection === 'sources'}
  <!-- Settings Panel -->
  <div class="settings-panel">
    <div class="setting-group">
      <label class="setting-label">Carrying</label>
      <div class="stepper">
        <button class="step-btn" onclick={() => currentWater = Math.max(0, currentWater - 0.5)}>−</button>
        <input type="number" bind:value={currentWater} min="0" max="6" step="0.5" class="step-input" />
        <button class="step-btn" onclick={() => currentWater = Math.min(6, currentWater + 0.5)}>+</button>
        <span class="step-unit">L</span>
      </div>
    </div>
    <div class="setting-group">
      <label class="setting-label">Conditions</label>
      <div class="temp-btns">
        <button class="temp-btn" class:active={temperatureMode === 'cool'} onclick={() => temperatureMode = 'cool'}>
          <span class="temp-icon">❄️</span>
          <span class="temp-txt">Cool</span>
        </button>
        <button class="temp-btn" class:active={temperatureMode === 'moderate'} onclick={() => temperatureMode = 'moderate'}>
          <span class="temp-icon">☀️</span>
          <span class="temp-txt">Mod</span>
        </button>
        <button class="temp-btn" class:active={temperatureMode === 'hot'} onclick={() => temperatureMode = 'hot'}>
          <span class="temp-icon">🔥</span>
          <span class="temp-txt">Hot</span>
        </button>
      </div>
    </div>
    <div class="setting-group rate-group">
      <label class="setting-label">Rate</label>
      <div class="rate-box">
        <span class="rate-num">{adjustedRate.toFixed(2)}</span>
        <span class="rate-unit">L/mi</span>
      </div>
    </div>
  </div>

  <!-- Upcoming Sources -->
  <section class="sources-section">
    <div class="section-header">
      <div class="section-icon up">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
          <path d="M4,12l1.41,1.41L11,7.83V20h2V7.83l5.58,5.59L20,12l-8-8L4,12z"/>
        </svg>
      </div>
      <h3>Upcoming Sources</h3>
      <span class="source-count">{upcomingSources.length}</span>
    </div>

    <div class="source-list">
      {#each upcomingSources as source, i}
        {@const distance = (source.mile - currentMile).toFixed(1)}
        {@const waterNeeded = (distance * adjustedRate).toFixed(1)}
        {@const light = getWaterLight(source.type)}
        <button
          class="source-card"
          class:selected={targetMile === source.mile}
          onclick={() => selectTarget(source.mile)}
        >
          <div class="source-icon-box" class:green={light === 'green'} class:yellow={light === 'yellow'}>
            <span class="src-emoji">{typeIcon(source.type)}</span>
            <span class="src-light" class:green={light === 'green'} class:yellow={light === 'yellow'}></span>
          </div>
          <div class="source-info">
            <div class="source-name">{source.name}</div>
            <div class="source-meta">
              <span class="meta-mile">Mile {source.mile}</span>
              {#if source.offTrail > 0}
                <span class="meta-detour">+{source.offTrail}mi off</span>
              {/if}
            </div>
            {#if source.notes}
              <div class="source-note">{source.notes}</div>
            {/if}
          </div>
          <div class="source-stats">
            <div class="stat-dist">
              <span class="stat-val">{distance}</span>
              <span class="stat-unit">mi</span>
            </div>
            <div class="stat-water">
              <span class="stat-val">{waterNeeded}</span>
              <span class="stat-unit">L</span>
            </div>
            <span class="reliability-tag {reliabilityColor(source.reliability)}">
              {source.reliability}
            </span>
          </div>
        </button>
      {/each}
    </div>
  </section>

  <!-- Calculator -->
  {#if waterForTarget}
    <section class="calc-section">
      <div class="section-header">
        <div class="section-icon calc">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19,3H5C3.9,3,3,3.9,3,5v14c0,1.1,0.9,2,2,2h14c1.1,0,2-0.9,2-2V5C21,3.9,20.1,3,19,3z M13.03,7.06L14.09,6l1.41,1.41 L16.91,6l1.06,1.06l-1.41,1.41l1.41,1.41l-1.06,1.06L15.5,9.53l-1.41,1.41l-1.06-1.06l1.41-1.41L13.03,7.06z M6.25,7.72h5v1.5h-5 V7.72z M11.5,16h-2v2H8v-2H6v-1.5h2v-2h1.5v2h2V16z M18,17.25h-5v-1.5h5V17.25z M18,14.75h-5v-1.5h5V14.75z"/>
          </svg>
        </div>
        <h3>Water Calculator</h3>
      </div>
      <div class="calc-card" class:danger={!waterForTarget.canCarry}>
        <div class="calc-target">To Mile {targetMile}</div>
        <div class="calc-metrics">
          <div class="calc-metric">
            <span class="metric-val">{waterForTarget.distance}</span>
            <span class="metric-label">miles</span>
          </div>
          <div class="calc-metric primary">
            <span class="metric-val">{waterForTarget.litersNeeded}</span>
            <span class="metric-label">liters</span>
          </div>
          <div class="calc-metric">
            <span class="metric-val">{waterForTarget.weight}</span>
            <span class="metric-label">lbs</span>
          </div>
        </div>
        {#if !waterForTarget.canCarry}
          <div class="calc-alert danger">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M1,21h22L12,2 1,21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/>
            </svg>
            Exceeds {carryCapacity}L capacity — stop earlier
          </div>
        {:else if parseFloat(currentWater) < parseFloat(waterForTarget.litersNeeded)}
          <div class="calc-alert warning">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M9,22H7V9H2V7h7V22z M22,22h-2v-7h-5v-2h7V22z"/>
            </svg>
            Fill to {waterForTarget.litersNeeded}L before leaving
          </div>
        {:else}
          <div class="calc-alert ok">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M9,16.17L4.83,12l-1.42,1.41L9,19 21,7l-1.41-1.41L9,16.17z"/>
            </svg>
            Sufficient water ({currentWater}L)
          </div>
        {/if}
      </div>
    </section>
  {/if}

  <!-- Long Carries -->
  {#if longCarries.length > 0}
    <section class="warning-section">
      <div class="section-header">
        <div class="section-icon warn">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M1,21h22L12,2 1,21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/>
          </svg>
        </div>
        <h3>Long Carries Ahead</h3>
      </div>
      <div class="carries-list">
        {#each longCarries as carry}
          <div class="carry-item">
            <div class="carry-route">
              <span class="carry-from">{carry.from}</span>
              <span class="carry-arrow">→</span>
              <span class="carry-to">{carry.to}</span>
            </div>
            <div class="carry-data">
              <span class="carry-dist">{carry.distance} mi</span>
              <span class="carry-water">{carry.litersNeeded}L</span>
            </div>
          </div>
        {/each}
      </div>
    </section>
  {/if}

  <!-- Behind You -->
  {#if previousSources.length > 0}
    <section class="sources-section past">
      <div class="section-header">
        <div class="section-icon down">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M20,12l-1.41-1.41L13,16.17V4h-2v12.17l-5.58-5.59L4,12l8,8L20,12z"/>
          </svg>
        </div>
        <h3>Behind You</h3>
      </div>
      <div class="source-list compact">
        {#each previousSources as source}
          {@const distance = (currentMile - source.mile).toFixed(1)}
          <div class="source-card compact">
            <div class="source-icon-box">
              <span class="src-emoji">{typeIcon(source.type)}</span>
            </div>
            <div class="source-info">
              <div class="source-name">{source.name}</div>
              <span class="reliability-tag {reliabilityColor(source.reliability)}">{source.reliability}</span>
            </div>
            <div class="source-stats">
              <span class="stat-back">{distance} mi back</span>
            </div>
          </div>
        {/each}
      </div>
    </section>
  {/if}

  <!-- Settings -->
  <section class="advanced-settings">
    <div class="section-header">
      <div class="section-icon gear">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
          <path d="M19.14,12.94c0.04-0.31,0.06-0.63,0.06-0.94c0-0.31-0.02-0.63-0.06-0.94l2.03-1.58c0.18-0.14,0.23-0.41,0.12-0.61 l-1.92-3.32c-0.12-0.22-0.37-0.29-0.59-0.22l-2.39,0.96c-0.5-0.38-1.03-0.7-1.62-0.94L14.4,2.81c-0.04-0.24-0.24-0.41-0.48-0.41 h-3.84c-0.24,0-0.43,0.17-0.47,0.41L9.25,5.35C8.66,5.59,8.12,5.92,7.63,6.29L5.24,5.33c-0.22-0.08-0.47,0-0.59,0.22L2.74,8.87 C2.62,9.08,2.66,9.34,2.86,9.48l2.03,1.58C4.84,11.37,4.82,11.69,4.82,12s0.02,0.63,0.06,0.94l-2.03,1.58 c-0.18,0.14-0.23,0.41-0.12,0.61l1.92,3.32c0.12,0.22,0.37,0.29,0.59,0.22l2.39-0.96c0.5,0.38,1.03,0.7,1.62,0.94l0.36,2.54 c0.05,0.24,0.24,0.41,0.48,0.41h3.84c0.24,0,0.44-0.17,0.47-0.41l0.36-2.54c0.59-0.24,1.13-0.56,1.62-0.94l2.39,0.96 c0.22,0.08,0.47,0,0.59-0.22l1.92-3.32c0.12-0.22,0.07-0.47-0.12-0.61L19.14,12.94z M12,15.6c-1.98,0-3.6-1.62-3.6-3.6 s1.62-3.6,3.6-3.6s3.6,1.62,3.6,3.6S13.98,15.6,12,15.6z"/>
        </svg>
      </div>
      <h3>Settings</h3>
    </div>
    <div class="settings-grid">
      <div class="setting-row">
        <label>Base Consumption</label>
        <div class="slider-wrap">
          <input type="range" bind:value={consumptionRate} min="0.3" max="1.0" step="0.05" />
          <span class="slider-val">{consumptionRate} L/mi</span>
        </div>
        <p class="setting-hint">Typical: 0.4-0.6 flat, 0.6-0.8 mountains</p>
      </div>
      <div class="setting-row">
        <label>Max Capacity</label>
        <div class="slider-wrap">
          <input type="range" bind:value={carryCapacity} min="1" max="6" step="0.5" />
          <span class="slider-val">{carryCapacity}L ({(carryCapacity * 2.2).toFixed(1)} lbs)</span>
        </div>
        <p class="setting-hint">Most hikers carry 2-4L</p>
      </div>
    </div>
  </section>

  <!-- Tips -->
  <div class="tips-box">
    <div class="tips-header">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
        <path d="M9,21c0,0.55 0.45,1 1,1h4c0.55,0 1,-0.45 1,-1v-1H9V21zM12,2C8.14,2 5,5.14 5,9c0,2.38 1.19,4.47 3,5.74V17c0,0.55 0.45,1 1,1h6c0.55,0 1,-0.45 1,-1v-2.26c1.81,-1.27 3,-3.36 3,-5.74C19,5.14 15.86,2 12,2z"/>
      </svg>
      <span>Quick Tips</span>
    </div>
    <ul class="tips-list">
      <li><strong>1L = 2.2 lbs</strong> — heaviest consumable</li>
      <li><strong>Camel up</strong> — drink extra before leaving sources</li>
      <li><strong>Seasonal</strong> may be dry in summer</li>
      <li><strong>Town water</strong> — always fill up</li>
    </ul>
  </div>
  {/if}

  <!-- Water Types Tab -->
  {#if activeSection === 'types'}
  <div class="types-content">
    <div class="types-intro">
      <strong>Not all water is equal.</strong> Even with treatment, some sources are safer than others.
    </div>

    {#each Object.entries(waterTypeClassification) as [key, classification]}
      <div class="type-card" style="--type-color: {classification.color}">
        <div class="type-header">
          <span class="type-light">{classification.icon}</span>
          <div class="type-title">
            <h4>{classification.label}</h4>
            <p>{classification.treatment}</p>
          </div>
        </div>
        <div class="type-list">
          {#each classification.types as type}
            <div class="type-item">
              <span class="item-name">{type.name}</span>
              <span class="item-desc">{type.desc}</span>
            </div>
          {/each}
        </div>
      </div>
    {/each}

    <div class="rules-panel">
      <h4>Water Planning Rules</h4>
      <div class="rule-chips">
        <span class="rule-chip trust">✓ Creeks = Trust</span>
        <span class="rule-chip verify">? Springs = Verify</span>
        <span class="rule-chip avoid">✗ Seeps = Ignore</span>
      </div>
      <ul class="rule-list">
        <li>Never skip water before a ridge</li>
        <li>Carry extra when shelter water is spring-fed</li>
        <li>Ask: "What's my next guaranteed creek?"</li>
      </ul>
    </div>
  </div>
  {/if}

  <!-- Protocol Tab -->
  {#if activeSection === 'protocol'}
  <div class="protocol-content">
    <div class="protocol-banner">
      <div class="banner-icon">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
          <path d="M1,21h22L12,2 1,21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/>
        </svg>
      </div>
      <div class="banner-text">
        <h3>Questionable Water Protocol</h3>
        <p>If any answer is wrong, treatment alone is not enough.</p>
      </div>
    </div>

    <div class="question-section">
      <h4>Ask These Questions</h4>
      {#each questionableProtocol.questions as item, i}
        <div class="question-row">
          <span class="q-num">{i + 1}</span>
          <div class="q-content">
            <span class="q-text">{item.q}</span>
            <span class="q-bad">{item.bad}</span>
          </div>
        </div>
      {/each}
    </div>

    <div class="forced-section">
      <h4>If Forced to Use</h4>
      <div class="forced-steps">
        {#each questionableProtocol.ifForced as step, i}
          <div class="forced-step">
            <span class="step-num">{i + 1}</span>
            <span class="step-txt">{step}</span>
          </div>
        {/each}
      </div>
      <div class="forced-warning">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <path d="M1,21h22L12,2 1,21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/>
        </svg>
        {questionableProtocol.warning}
      </div>
    </div>

    <div class="red-flags-section">
      <h4>Visual Red Flags</h4>
      <div class="flags-grid">
        <span class="flag-chip">Algae/green film</span>
        <span class="flag-chip">Strong odor</span>
        <span class="flag-chip">Heavy animal activity</span>
        <span class="flag-chip">Flood runoff</span>
      </div>
    </div>
  </div>
  {/if}

  <!-- Guide Link -->
  <a href="/guide/09-water-treatment-system" class="guide-link">
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
      <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
    </svg>
    Water Treatment Guide
  </a>
</div>

<style>
  .water-tracker {
    background: var(--bg, #faf9f6);
    border: 2px solid var(--border);
    border-radius: 16px;
    overflow: hidden;
    box-shadow: 0 4px 20px rgba(0,0,0,0.08);
    opacity: 0;
    transform: translateY(10px);
    transition: all 0.5s ease;
  }

  .water-tracker.mounted {
    opacity: 1;
    transform: translateY(0);
  }

  /* Header */
  .hydro-header {
    position: relative;
    background: linear-gradient(135deg, #0284c7 0%, #0369a1 50%, #075985 100%);
    padding: 1.5rem;
    overflow: hidden;
  }

  .wave-bg {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 80px;
    overflow: hidden;
  }

  .wave-bg svg {
    width: 100%;
    height: 100%;
  }

  .wave {
    fill: rgba(255,255,255,0.1);
  }

  .wave1 {
    animation: wave1 8s ease-in-out infinite;
  }

  .wave2 {
    animation: wave2 6s ease-in-out infinite;
    animation-delay: -2s;
  }

  @keyframes wave1 {
    0%, 100% { transform: translateX(0); }
    50% { transform: translateX(-20px); }
  }

  @keyframes wave2 {
    0%, 100% { transform: translateX(0); }
    50% { transform: translateX(20px); }
  }

  .header-content {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    z-index: 1;
  }

  .header-left {
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  .drop-icon {
    animation: dropBounce 3s ease-in-out infinite;
  }

  @keyframes dropBounce {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-5px); }
  }

  .header-text h2 {
    margin: 0;
    font-family: Oswald, sans-serif;
    font-size: 1.5rem;
    font-weight: 700;
    color: #fff;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .header-text p {
    margin: 0.25rem 0 0;
    font-size: 0.85rem;
    color: rgba(255,255,255,0.8);
  }

  .water-gauge {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.35rem;
  }

  .gauge-container {
    position: relative;
    width: 50px;
    height: 70px;
    background: rgba(0,0,0,0.3);
    border: 2px solid rgba(255,255,255,0.5);
    border-radius: 0 0 25px 25px;
    border-top-left-radius: 5px;
    border-top-right-radius: 5px;
    overflow: hidden;
  }

  .gauge-fill {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    background: linear-gradient(to top, #38bdf8, #7dd3fc);
    transition: height 0.4s ease;
  }

  .gauge-bubbles {
    position: absolute;
    inset: 0;
    pointer-events: none;
  }

  .bubble {
    position: absolute;
    width: 6px;
    height: 6px;
    background: rgba(255,255,255,0.4);
    border-radius: 50%;
    animation: bubble 3s ease-in-out infinite;
  }

  .b1 { left: 10px; animation-delay: 0s; }
  .b2 { left: 25px; animation-delay: 1s; }
  .b3 { left: 35px; animation-delay: 2s; }

  @keyframes bubble {
    0%, 100% { bottom: 5px; opacity: 0; }
    50% { bottom: 50px; opacity: 0.6; }
  }

  .gauge-reading {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: Oswald, sans-serif;
    font-size: 1.5rem;
    font-weight: 700;
    color: #fff;
    text-shadow: 0 1px 3px rgba(0,0,0,0.3);
    z-index: 1;
  }

  .gauge-label {
    font-size: 0.6rem;
    font-weight: 700;
    color: rgba(255,255,255,0.9);
    text-transform: uppercase;
    letter-spacing: 0.1em;
  }

  /* Status Bar */
  .status-bar {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 0.75rem;
    padding: 0.75rem 1.25rem;
    background: #e0f2fe;
    border-bottom: 2px solid #bae6fd;
  }

  .status-bar.warning {
    background: #fef2f2;
    border-color: #fca5a5;
  }

  .status-loc {
    display: flex;
    align-items: center;
    gap: 0.35rem;
    font-weight: 600;
    color: #0369a1;
  }

  .status-bar.warning .status-loc {
    color: #b91c1c;
  }

  .status-divider {
    width: 1px;
    height: 20px;
    background: #bae6fd;
  }

  .status-bar.warning .status-divider {
    background: #fca5a5;
  }

  .status-next {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.9rem;
  }

  .next-text {
    color: var(--muted);
  }

  .next-dist {
    font-weight: 700;
    color: #0284c7;
    font-family: Oswald, sans-serif;
    font-size: 1.1rem;
  }

  .status-bar.warning .next-dist {
    color: #dc2626;
  }

  .next-need {
    color: var(--muted);
    font-size: 0.85rem;
  }

  .status-alert {
    display: flex;
    align-items: center;
    gap: 0.35rem;
    margin-left: auto;
    padding: 0.35rem 0.75rem;
    background: #dc2626;
    color: #fff;
    font-size: 0.75rem;
    font-weight: 700;
    text-transform: uppercase;
    border-radius: 20px;
    animation: pulse 2s infinite;
  }

  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.7; }
  }

  /* Tabs */
  .tab-nav {
    display: flex;
    background: #f0f9ff;
    border-bottom: 2px solid var(--border);
  }

  .tab-btn {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    padding: 1rem;
    background: none;
    border: none;
    border-bottom: 3px solid transparent;
    color: var(--muted);
    font-family: Oswald, sans-serif;
    font-size: 0.9rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.03em;
    cursor: pointer;
    transition: all 0.2s;
  }

  .tab-btn:hover {
    background: rgba(2, 132, 199, 0.05);
    color: var(--ink);
  }

  .tab-btn.active {
    color: #0284c7;
    border-bottom-color: #0284c7;
    background: rgba(2, 132, 199, 0.1);
  }

  /* Settings Panel */
  .settings-panel {
    display: flex;
    flex-wrap: wrap;
    gap: 1rem;
    padding: 1rem 1.25rem;
    background: #fff;
    border-bottom: 2px solid var(--border);
  }

  .setting-group {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
  }

  .setting-label {
    font-size: 0.65rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--muted);
  }

  .stepper {
    display: flex;
    align-items: center;
    gap: 0.25rem;
    background: var(--bg);
    border: 2px solid var(--border);
    border-radius: 8px;
    padding: 0.25rem;
  }

  .step-btn {
    width: 44px;
    height: 44px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #fff;
    border: 2px solid var(--border);
    border-radius: 8px;
    font-size: 1.25rem;
    font-weight: 600;
    color: #0284c7;
    cursor: pointer;
    transition: all 0.2s;
  }

  .step-btn:hover {
    background: #0284c7;
    color: #fff;
    border-color: #0284c7;
  }

  .step-input {
    width: 45px;
    padding: 0.25rem;
    border: none;
    background: transparent;
    text-align: center;
    font-family: Oswald, sans-serif;
    font-size: 1.1rem;
    font-weight: 700;
    color: var(--ink);
  }

  .step-unit {
    font-size: 0.8rem;
    color: var(--muted);
    margin-right: 0.25rem;
  }

  .temp-btns {
    display: flex;
    gap: 0.25rem;
  }

  .temp-btn {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.15rem;
    padding: 0.4rem 0.6rem;
    background: #fff;
    border: 2px solid var(--border);
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s;
  }

  .temp-btn:hover {
    border-color: #0284c7;
  }

  .temp-btn.active {
    background: #e0f2fe;
    border-color: #0284c7;
  }

  .temp-icon {
    font-size: 1rem;
  }

  .temp-txt {
    font-size: 0.65rem;
    font-weight: 600;
    color: var(--muted);
  }

  .temp-btn.active .temp-txt {
    color: #0284c7;
  }

  .rate-group {
    margin-left: auto;
  }

  .rate-box {
    display: flex;
    align-items: baseline;
    gap: 0.25rem;
    padding: 0.5rem 0.75rem;
    background: linear-gradient(135deg, #e0f2fe, #bae6fd);
    border: 2px solid #7dd3fc;
    border-radius: 8px;
  }

  .rate-num {
    font-family: Oswald, sans-serif;
    font-size: 1.25rem;
    font-weight: 700;
    color: #0369a1;
  }

  .rate-unit {
    font-size: 0.75rem;
    color: #0369a1;
  }

  /* Sections */
  section {
    padding: 1.25rem;
    border-bottom: 2px solid var(--border);
  }

  .section-header {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    margin-bottom: 1rem;
  }

  .section-icon {
    width: 36px;
    height: 36px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 10px;
  }

  .section-icon.up {
    background: #dcfce7;
    color: #166534;
  }

  .section-icon.down {
    background: #f3f4f6;
    color: #6b7280;
  }

  .section-icon.calc {
    background: #e0f2fe;
    color: #0369a1;
  }

  .section-icon.warn {
    background: #fef3c7;
    color: #92400e;
  }

  .section-icon.gear {
    background: #f3f4f6;
    color: #4b5563;
  }

  .section-header h3 {
    margin: 0;
    font-family: Oswald, sans-serif;
    font-size: 1rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.03em;
    color: var(--pine);
  }

  .source-count {
    margin-left: auto;
    padding: 0.2rem 0.5rem;
    background: var(--alpine);
    color: #fff;
    font-size: 0.75rem;
    font-weight: 700;
    border-radius: 10px;
  }

  /* Source Cards */
  .source-list {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .source-card {
    display: flex;
    align-items: flex-start;
    gap: 0.75rem;
    padding: 1rem;
    background: #fff;
    border: 2px solid var(--border);
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
    box-shadow: 0 0 0 3px rgba(2, 132, 199, 0.15);
  }

  .source-card.compact {
    padding: 0.75rem;
  }

  .source-icon-box {
    position: relative;
    width: 44px;
    height: 44px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #f0f9ff;
    border: 2px solid #bae6fd;
    border-radius: 10px;
    flex-shrink: 0;
  }

  .source-icon-box.green {
    background: #dcfce7;
    border-color: #86efac;
  }

  .source-icon-box.yellow {
    background: #fef3c7;
    border-color: #fcd34d;
  }

  .src-emoji {
    font-size: 1.25rem;
  }

  .src-light {
    position: absolute;
    bottom: -3px;
    right: -3px;
    width: 12px;
    height: 12px;
    border-radius: 50%;
    border: 2px solid #fff;
  }

  .src-light.green {
    background: #22c55e;
  }

  .src-light.yellow {
    background: #f59e0b;
  }

  .source-info {
    flex: 1;
    min-width: 0;
  }

  .source-name {
    font-weight: 600;
    color: var(--ink);
    font-size: 0.95rem;
    line-height: 1.3;
  }

  .source-meta {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    margin-top: 0.25rem;
    font-size: 0.8rem;
    color: var(--muted);
  }

  .meta-detour {
    color: #ea580c;
    font-weight: 500;
  }

  .source-note {
    margin-top: 0.35rem;
    font-size: 0.75rem;
    color: var(--muted);
    font-style: italic;
  }

  .source-stats {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 0.35rem;
    flex-shrink: 0;
  }

  .stat-dist, .stat-water {
    display: flex;
    align-items: baseline;
    gap: 0.15rem;
  }

  .stat-dist .stat-val {
    font-family: Oswald, sans-serif;
    font-size: 1.2rem;
    font-weight: 700;
    color: #0284c7;
  }

  .stat-water .stat-val {
    font-family: Oswald, sans-serif;
    font-size: 0.95rem;
    font-weight: 600;
    color: var(--muted);
  }

  .stat-unit {
    font-size: 0.7rem;
    color: var(--muted);
  }

  .stat-back {
    font-size: 0.85rem;
    color: var(--muted);
  }

  .reliability-tag {
    display: inline-block;
    padding: 0.2rem 0.5rem;
    font-size: 0.6rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.03em;
    border-radius: 4px;
  }

  .reliability-tag.reliable {
    background: #dcfce7;
    color: #166534;
  }

  .reliability-tag.seasonal {
    background: #fef3c7;
    color: #92400e;
  }

  .reliability-tag.unreliable {
    background: #fee2e2;
    color: #991b1b;
  }

  /* Calculator */
  .calc-card {
    background: linear-gradient(135deg, #f0f9ff, #e0f2fe);
    border: 2px solid #7dd3fc;
    border-radius: 12px;
    padding: 1.25rem;
  }

  .calc-card.danger {
    background: linear-gradient(135deg, #fef2f2, #fee2e2);
    border-color: #f87171;
  }

  .calc-target {
    text-align: center;
    font-family: Oswald, sans-serif;
    font-size: 1rem;
    font-weight: 600;
    color: #0369a1;
    margin-bottom: 1rem;
  }

  .calc-card.danger .calc-target {
    color: #b91c1c;
  }

  .calc-metrics {
    display: flex;
    justify-content: center;
    gap: 2rem;
    margin-bottom: 1rem;
  }

  .calc-metric {
    text-align: center;
  }

  .metric-val {
    display: block;
    font-family: Oswald, sans-serif;
    font-size: 1.75rem;
    font-weight: 700;
    color: var(--ink);
    line-height: 1;
  }

  .calc-metric.primary .metric-val {
    font-size: 2.25rem;
    color: #0284c7;
  }

  .calc-card.danger .calc-metric.primary .metric-val {
    color: #dc2626;
  }

  .metric-label {
    font-size: 0.65rem;
    font-weight: 600;
    text-transform: uppercase;
    color: var(--muted);
    letter-spacing: 0.03em;
  }

  .calc-alert {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    padding: 0.75rem;
    border-radius: 8px;
    font-size: 0.85rem;
    font-weight: 600;
  }

  .calc-alert.danger {
    background: #fee2e2;
    color: #991b1b;
  }

  .calc-alert.warning {
    background: #fef3c7;
    color: #92400e;
  }

  .calc-alert.ok {
    background: #dcfce7;
    color: #166534;
  }

  /* Long Carries */
  .carries-list {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .carry-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.75rem 1rem;
    background: linear-gradient(90deg, #fef3c7, #fef9c3);
    border: 2px solid #fcd34d;
    border-radius: 8px;
  }

  .carry-route {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.85rem;
  }

  .carry-from, .carry-to {
    font-weight: 600;
    color: var(--ink);
  }

  .carry-arrow {
    color: #d97706;
  }

  .carry-data {
    display: flex;
    gap: 1rem;
    font-family: Oswald, sans-serif;
    font-weight: 600;
  }

  .carry-dist {
    color: #b45309;
  }

  .carry-water {
    color: #0369a1;
  }

  /* Past Sources */
  .sources-section.past {
    background: #f9fafb;
  }

  .sources-section.past .source-card {
    background: #fff;
    opacity: 0.8;
  }

  /* Advanced Settings */
  .advanced-settings {
    background: #f9fafb;
  }

  .settings-grid {
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
  }

  .setting-row label {
    display: block;
    font-weight: 600;
    color: var(--ink);
    font-size: 0.9rem;
    margin-bottom: 0.5rem;
  }

  .slider-wrap {
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  .slider-wrap input[type="range"] {
    flex: 1;
    height: 8px;
    -webkit-appearance: none;
    background: linear-gradient(to right, #bae6fd, #0284c7);
    border-radius: 4px;
  }

  .slider-wrap input[type="range"]::-webkit-slider-thumb {
    -webkit-appearance: none;
    width: 20px;
    height: 20px;
    background: #0284c7;
    border: 3px solid #fff;
    border-radius: 50%;
    box-shadow: 0 2px 6px rgba(0,0,0,0.15);
    cursor: pointer;
  }

  .slider-val {
    min-width: 90px;
    font-family: Oswald, sans-serif;
    font-weight: 600;
    color: #0284c7;
  }

  .setting-hint {
    margin: 0.35rem 0 0;
    font-size: 0.75rem;
    color: var(--muted);
  }

  /* Tips */
  .tips-box {
    padding: 1rem 1.25rem;
    background: #f0f9ff;
    border-top: 2px solid #bae6fd;
  }

  .tips-header {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 0.75rem;
    font-family: Oswald, sans-serif;
    font-weight: 600;
    color: #0369a1;
  }

  .tips-list {
    margin: 0;
    padding-left: 1.25rem;
    font-size: 0.85rem;
    color: var(--muted);
  }

  .tips-list li {
    margin-bottom: 0.35rem;
  }

  .tips-list strong {
    color: var(--ink);
  }

  /* Types Content */
  .types-content {
    padding: 1.25rem;
  }

  .types-intro {
    padding: 1rem;
    background: #e0f2fe;
    border: 2px solid #7dd3fc;
    border-radius: 10px;
    margin-bottom: 1.25rem;
    font-size: 0.9rem;
    color: var(--ink);
  }

  .type-card {
    background: #fff;
    border: 2px solid var(--border);
    border-left: 5px solid var(--type-color);
    border-radius: 10px;
    margin-bottom: 1rem;
    overflow: hidden;
  }

  .type-header {
    display: flex;
    align-items: flex-start;
    gap: 0.75rem;
    padding: 1rem;
    background: linear-gradient(90deg, rgba(0,0,0,0.02), transparent);
  }

  .type-light {
    font-size: 1.75rem;
  }

  .type-title h4 {
    margin: 0;
    font-family: Oswald, sans-serif;
    font-size: 1.1rem;
    font-weight: 600;
    color: var(--type-color);
  }

  .type-title p {
    margin: 0.25rem 0 0;
    font-size: 0.8rem;
    color: var(--muted);
    font-style: italic;
  }

  .type-list {
    padding: 0.75rem 1rem;
    border-top: 1px solid var(--border);
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

  .item-name {
    font-weight: 600;
    color: var(--ink);
    font-size: 0.9rem;
  }

  .item-desc {
    font-size: 0.75rem;
    color: var(--muted);
  }

  .rules-panel {
    background: #fefce8;
    border: 2px solid #fbbf24;
    border-radius: 10px;
    padding: 1.25rem;
    margin-top: 1rem;
  }

  .rules-panel h4 {
    margin: 0 0 1rem;
    font-family: Oswald, sans-serif;
    font-size: 1rem;
    color: #92400e;
  }

  .rule-chips {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    margin-bottom: 1rem;
  }

  .rule-chip {
    padding: 0.5rem 0.75rem;
    font-size: 0.8rem;
    font-weight: 600;
    border-radius: 20px;
  }

  .rule-chip.trust {
    background: #dcfce7;
    color: #166534;
  }

  .rule-chip.verify {
    background: #fef3c7;
    color: #92400e;
  }

  .rule-chip.avoid {
    background: #fee2e2;
    color: #991b1b;
  }

  .rule-list {
    margin: 0;
    padding-left: 1.25rem;
    font-size: 0.85rem;
    color: var(--ink);
  }

  .rule-list li {
    margin-bottom: 0.35rem;
  }

  /* Protocol Content */
  .protocol-content {
    padding: 1.25rem;
  }

  .protocol-banner {
    display: flex;
    align-items: flex-start;
    gap: 1rem;
    padding: 1.25rem;
    background: linear-gradient(135deg, #fef2f2, #fee2e2);
    border: 2px solid #f87171;
    border-radius: 12px;
    margin-bottom: 1.5rem;
  }

  .banner-icon {
    color: #dc2626;
  }

  .banner-text h3 {
    margin: 0;
    font-family: Oswald, sans-serif;
    font-size: 1.15rem;
    color: #991b1b;
  }

  .banner-text p {
    margin: 0.35rem 0 0;
    font-size: 0.9rem;
    color: #7f1d1d;
  }

  .question-section, .forced-section, .red-flags-section {
    margin-bottom: 1.5rem;
  }

  .question-section h4, .forced-section h4, .red-flags-section h4 {
    margin: 0 0 1rem;
    font-family: Oswald, sans-serif;
    font-size: 1rem;
    color: var(--pine);
  }

  .question-row {
    display: flex;
    gap: 0.75rem;
    padding: 0.75rem;
    background: #fff;
    border: 2px solid var(--border);
    border-radius: 10px;
    margin-bottom: 0.5rem;
  }

  .q-num {
    width: 28px;
    height: 28px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #0284c7;
    color: #fff;
    font-family: Oswald, sans-serif;
    font-weight: 700;
    border-radius: 50%;
    flex-shrink: 0;
  }

  .q-content {
    flex: 1;
  }

  .q-text {
    display: block;
    font-weight: 600;
    color: var(--ink);
    font-size: 0.95rem;
  }

  .q-bad {
    display: block;
    font-size: 0.8rem;
    color: #b91c1c;
    margin-top: 0.2rem;
  }

  .forced-section {
    background: #fffbeb;
    border: 2px solid #fbbf24;
    border-radius: 12px;
    padding: 1.25rem;
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
    padding: 0.6rem;
    background: #fff;
    border-radius: 8px;
  }

  .step-num {
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #f59e0b;
    color: #fff;
    font-size: 0.75rem;
    font-weight: 700;
    border-radius: 50%;
    flex-shrink: 0;
  }

  .step-txt {
    font-size: 0.9rem;
    color: var(--ink);
  }

  .forced-warning {
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

  .red-flags-section {
    background: #fff;
    border: 2px solid var(--border);
    border-radius: 12px;
    padding: 1.25rem;
  }

  .flags-grid {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
  }

  .flag-chip {
    padding: 0.5rem 0.75rem;
    background: #fee2e2;
    color: #991b1b;
    font-size: 0.8rem;
    font-weight: 500;
    border-radius: 20px;
  }

  /* Guide Link */
  .guide-link {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    padding: 1rem;
    background: var(--pine);
    color: #fff;
    font-family: Oswald, sans-serif;
    font-size: 0.9rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    text-decoration: none;
    transition: background 0.2s;
  }

  .guide-link:hover {
    background: var(--alpine);
  }

  /* Responsive */
  @media (max-width: 640px) {
    .hydro-header {
      padding: 1.25rem;
    }

    .header-left {
      gap: 0.75rem;
    }

    .header-text h2 {
      font-size: 1.25rem;
    }

    .gauge-container {
      width: 40px;
      height: 56px;
    }

    .gauge-reading {
      font-size: 1.25rem;
    }

    .status-bar {
      flex-direction: column;
      align-items: flex-start;
      gap: 0.5rem;
    }

    .status-divider {
      display: none;
    }

    .status-alert {
      margin-left: 0;
    }

    .settings-panel {
      flex-direction: column;
    }

    .rate-group {
      margin-left: 0;
    }

    .source-card {
      flex-direction: column;
      align-items: stretch;
    }

    .source-stats {
      flex-direction: row;
      justify-content: space-between;
      align-items: center;
      padding-top: 0.5rem;
      border-top: 1px dashed var(--border);
      margin-top: 0.5rem;
    }

    .calc-metrics {
      gap: 1rem;
    }

    .metric-val {
      font-size: 1.5rem;
    }

    .calc-metric.primary .metric-val {
      font-size: 1.75rem;
    }

    .carry-item {
      flex-direction: column;
      align-items: flex-start;
      gap: 0.5rem;
    }

    .protocol-banner {
      flex-direction: column;
      text-align: center;
    }

    .question-row {
      flex-direction: column;
      text-align: center;
    }

    .q-num {
      margin: 0 auto;
    }
  }
</style>
