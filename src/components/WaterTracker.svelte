<script>
  import { onMount } from 'svelte';

  let { trailContext = {} } = $props();

  let mounted = $state(false);

  // AWOL-based water source list (mileage)
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

  const typeMeta = {
    spring: { label: 'Spring', icon: '💧' },
    stream: { label: 'Stream', icon: '🏞️' },
    river: { label: 'River', icon: '🌊' },
    piped: { label: 'Piped', icon: '🚰' },
    town: { label: 'Town', icon: '🏪' },
  };

  function asNumber(value, fallback = 0) {
    const n = Number(value);
    return Number.isFinite(n) ? n : fallback;
  }

  function formatMiles(value) {
    const n = asNumber(value, 0);
    const fixed = n.toFixed(1);
    return fixed.endsWith('.0') ? fixed.slice(0, -2) : fixed;
  }

  onMount(() => {
    mounted = true;
  });

  let currentMile = $derived(asNumber(trailContext.currentMile, 0));

  let sources = $derived.by(() => {
    return waterSources
      .filter((s) => s.type !== 'none' && s.reliability !== 'none')
      .map((s) => ({ mile: s.mile, name: s.name, type: s.type, offTrail: s.offTrail || 0 }))
      .sort((a, b) => a.mile - b.mile);
  });

  let upcomingSources = $derived.by(() => sources.filter((s) => s.mile > currentMile).slice(0, 12));
  let recentSources = $derived.by(() => sources.filter((s) => s.mile <= currentMile).slice(-6).reverse());
</script>

<div class="water-tool" class:mounted>
  <header class="water-header">
    <div class="water-header-top">
      <div>
        <h2>Water Sources</h2>
        <p>AWOL guide mileages — verify conditions in the field.</p>
      </div>
      <div class="water-chips">
        <span class="badge"><strong>Now</strong> Mile {formatMiles(currentMile)}</span>
        {#if upcomingSources[0]}
          {@const next = upcomingSources[0]}
          <span class="badge"><strong>Next</strong> {formatMiles(next.mile)} (+{formatMiles(next.mile - currentMile)} mi)</span>
        {/if}
      </div>
    </div>
  </header>

  <div class="water-columns">
    <section class="water-section">
      <h3>Upcoming</h3>
      {#if upcomingSources.length === 0}
        <p class="water-empty">No upcoming sources in the list.</p>
      {:else}
        <ul class="water-list">
          {#each upcomingSources as source (source.mile + source.name)}
            {@const dist = source.mile - currentMile}
            <li class="water-item">
              <div class="water-main">
                <div class="water-name">
                  <span class="water-icon" aria-hidden="true">{typeMeta[source.type]?.icon ?? '💧'}</span>
                  <span>{source.name}</span>
                </div>
                <div class="water-meta">
                  <span>Mile {formatMiles(source.mile)}</span>
                  {#if source.offTrail > 0}
                    <span>+{formatMiles(source.offTrail)} off</span>
                  {/if}
                  <span>{typeMeta[source.type]?.label ?? source.type}</span>
                </div>
              </div>
              <div class="water-dist">+{formatMiles(dist)} mi</div>
            </li>
          {/each}
        </ul>
      {/if}
    </section>

    <section class="water-section">
      <h3>Recent</h3>
      {#if recentSources.length === 0}
        <p class="water-empty">No recent sources yet.</p>
      {:else}
        <ul class="water-list">
          {#each recentSources as source (source.mile + source.name)}
            {@const dist = currentMile - source.mile}
            <li class="water-item">
              <div class="water-main">
                <div class="water-name">
                  <span class="water-icon" aria-hidden="true">{typeMeta[source.type]?.icon ?? '💧'}</span>
                  <span>{source.name}</span>
                </div>
                <div class="water-meta">
                  <span>Mile {formatMiles(source.mile)}</span>
                  {#if source.offTrail > 0}
                    <span>+{formatMiles(source.offTrail)} off</span>
                  {/if}
                  <span>{typeMeta[source.type]?.label ?? source.type}</span>
                </div>
              </div>
              <div class="water-dist">−{formatMiles(dist)} mi</div>
            </li>
          {/each}
        </ul>
      {/if}
    </section>
  </div>

  <!-- Guide Links -->
  <div class="water-footer">
    <div class="guide-links">
      <a href="/guide/09-water-treatment-system" class="guide-link chapter-link">
        <span class="link-icon">📚</span>
        <span class="link-text">Full Water Treatment Guide</span>
        <span class="link-arrow">→</span>
      </a>
      <a href="/guide#09-water-treatment-system" class="guide-link field-guide-link">
        <span class="link-icon">📖</span>
        <span class="link-text">Field Guide</span>
        <span class="link-arrow">→</span>
      </a>
    </div>
  </div>
</div>

<style>
  .water-tool {
    background: #fff;
    border: 2px solid var(--border);
    border-radius: 16px;
    overflow: hidden;
    box-shadow: 0 4px 20px rgba(0,0,0,0.08);
    opacity: 0;
    transform: translateY(10px);
    transition: all 0.35s ease;
  }

  .water-tool.mounted {
    opacity: 1;
    transform: translateY(0);
  }

  .water-header {
    background: linear-gradient(135deg, #0284c7 0%, #0369a1 55%, #075985 100%);
    padding: 1.25rem 1.25rem 1rem;
    color: #fff;
  }

  .water-header-top {
    display: flex;
    flex-wrap: wrap;
    align-items: flex-end;
    justify-content: space-between;
    gap: 0.75rem 1rem;
  }

  .water-header h2 {
    margin: 0;
    font-family: Oswald, sans-serif;
    font-size: 1.5rem;
    font-weight: 700;
    color: #fff;
    letter-spacing: 0.02em;
    text-transform: uppercase;
  }

  .water-header p {
    margin: 0.25rem 0 0;
    font-size: 0.9rem;
    color: rgba(255,255,255,0.85);
  }

  .water-chips {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    align-items: center;
    justify-content: flex-end;
  }

  .water-chips :global(.badge) {
    background: rgba(255,255,255,0.92);
    border-color: rgba(255,255,255,0.65);
  }

  .water-columns {
    display: grid;
    grid-template-columns: 1fr;
    gap: 1.25rem;
    padding: 1.25rem;
    background: var(--bg);
  }

  .water-footer {
    padding: 0 1.25rem 1.25rem;
    background: var(--bg);
  }

  .guide-links {
    display: flex;
    gap: 0.75rem;
    flex-wrap: wrap;
  }

  .guide-link {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 1rem 1.25rem;
    background: #fff;
    border: 2px solid var(--border);
    border-radius: 14px;
    text-decoration: none;
    transition: all 0.2s ease;
    flex: 1;
    min-width: 200px;
  }

  .guide-link:hover {
    border-color: var(--alpine);
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
    transform: translateY(-2px);
  }

  .field-guide-link {
    flex: 0 0 auto;
    min-width: 140px;
  }

  .link-icon { font-size: 1.25rem; }

  .link-text {
    flex: 1;
    font-family: Oswald, sans-serif;
    font-size: 0.9rem;
    font-weight: 500;
    color: var(--ink);
    text-transform: uppercase;
    letter-spacing: 0.03em;
  }

  .link-arrow {
    font-size: 1.25rem;
    color: var(--alpine);
    transition: transform 0.2s ease;
  }

  .guide-link:hover .link-arrow { transform: translateX(4px); }

  .water-section h3 {
    margin: 0 0 0.75rem;
    font-family: Oswald, sans-serif;
    text-transform: uppercase;
    letter-spacing: 0.03em;
    color: var(--ink);
  }

  .water-empty {
    margin: 0;
    color: var(--muted);
    font-size: 0.95rem;
  }

  .water-list {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .water-item {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 0.75rem;
    padding: 1rem;
    border: 1px solid var(--border);
    border-radius: 14px;
    background: #fff;
  }

  .water-main {
    flex: 1;
    min-width: 0;
  }

  .water-name {
    display: flex;
    gap: 0.5rem;
    align-items: baseline;
    font-weight: 700;
    color: var(--ink);
  }

  .water-icon {
    width: 1.25rem;
    display: inline-flex;
    justify-content: center;
    flex-shrink: 0;
  }

  .water-meta {
    margin-top: 0.25rem;
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    font-size: 0.85rem;
    color: var(--muted);
  }

  .water-meta span + span::before {
    content: '•';
    margin-right: 0.5rem;
    color: var(--border);
  }

  .water-dist {
    font-family: Oswald, sans-serif;
    font-weight: 700;
    color: #0284c7;
    white-space: nowrap;
    font-size: 1.05rem;
    padding-top: 0.05rem;
  }

  @media (min-width: 900px) {
    .water-columns {
      grid-template-columns: 1fr 1fr;
      align-items: start;
    }
  }
</style>
