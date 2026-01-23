export type ATRoadCrossing = {
  mile: number;
  name: string;
  road: string;
  nearestTown: string;
  townDist: number;
  hospital: string;
  hospitalDist: number;
  notes?: string;
};

// Primary road crossings / bailouts along the AT (NOBO).
// NOTE: This list is intentionally "major crossings" only (not every possible forest road).
export const AT_ROAD_CROSSINGS: ATRoadCrossing[] = [
  { mile: 0, name: 'Springer Mountain Rd', road: 'FS 42', nearestTown: 'Amicalola Falls', townDist: 8, hospital: 'Dahlonega', hospitalDist: 25 },
  { mile: 8.8, name: 'Three Forks', road: 'FS 58', nearestTown: 'Dahlonega', townDist: 18, hospital: 'Dahlonega', hospitalDist: 18 },
  { mile: 19.3, name: 'Woody Gap', road: 'GA 60', nearestTown: 'Dahlonega', townDist: 12, hospital: 'Dahlonega', hospitalDist: 12 },
  { mile: 30.7, name: 'Neels Gap', road: 'US 19/129', nearestTown: 'Blairsville', townDist: 15, hospital: 'Blairsville', hospitalDist: 15, notes: 'Mountain Crossings outfitter on trail' },
  { mile: 42.4, name: 'Tesnatee Gap', road: 'GA 348', nearestTown: 'Cleveland', townDist: 12, hospital: 'Cleveland', hospitalDist: 12 },
  { mile: 52.8, name: 'Unicoi Gap', road: 'GA 75', nearestTown: 'Hiawassee', townDist: 11, hospital: 'Hiawassee', hospitalDist: 11 },
  { mile: 59.5, name: 'Indian Grave Gap', road: 'GA 75', nearestTown: 'Hiawassee', townDist: 6, hospital: 'Hiawassee', hospitalDist: 6 },
  { mile: 69.4, name: 'Dicks Creek Gap', road: 'US 76', nearestTown: 'Hiawassee', townDist: 8, hospital: 'Hiawassee', hospitalDist: 8 },
  { mile: 78.5, name: 'Bly Gap', road: 'NC/GA Border', nearestTown: 'Franklin', townDist: 18, hospital: 'Franklin', hospitalDist: 18 },
  { mile: 95.7, name: 'Winding Stair Gap', road: 'US 64', nearestTown: 'Franklin', townDist: 10, hospital: 'Franklin', hospitalDist: 10 },
  { mile: 110.3, name: 'Wallace Gap', road: 'US 64', nearestTown: 'Franklin', townDist: 3, hospital: 'Franklin', hospitalDist: 3 },
  { mile: 137.1, name: 'Wesser', road: 'US 19', nearestTown: 'Bryson City', townDist: 12, hospital: 'Bryson City', hospitalDist: 12, notes: 'NOC outfitter' },
  { mile: 165.7, name: 'Fontana Dam', road: 'NC 28', nearestTown: 'Fontana Village', townDist: 2, hospital: 'Bryson City', hospitalDist: 30 },
  { mile: 206.2, name: 'Newfound Gap', road: 'US 441', nearestTown: 'Gatlinburg', townDist: 16, hospital: 'Sevierville', hospitalDist: 26, notes: 'Smokies - permit required' },
  { mile: 241.0, name: 'Davenport Gap', road: 'NC 32', nearestTown: 'Newport', townDist: 20, hospital: 'Newport', hospitalDist: 20 },
  { mile: 255.5, name: 'Max Patch', road: 'NC 1182', nearestTown: 'Hot Springs', townDist: 15, hospital: 'Asheville', hospitalDist: 40 },
  { mile: 273.7, name: 'Hot Springs', road: 'US 25/70', nearestTown: 'Hot Springs', townDist: 0, hospital: 'Asheville', hospitalDist: 35, notes: 'Trail goes through town' },
  { mile: 295.0, name: 'Allen Gap', road: 'NC 208', nearestTown: 'Hot Springs', townDist: 14, hospital: 'Asheville', hospitalDist: 45 },
  { mile: 313.9, name: 'Devils Fork Gap', road: 'NC 212', nearestTown: 'Erwin', townDist: 18, hospital: 'Johnson City', hospitalDist: 35 },
  { mile: 342.3, name: 'Erwin', road: 'TN 395', nearestTown: 'Erwin', townDist: 3, hospital: 'Johnson City', hospitalDist: 20 },
  { mile: 386.1, name: 'Damascus', road: 'US 58', nearestTown: 'Damascus', townDist: 0, hospital: 'Abingdon', hospitalDist: 15, notes: 'Trail goes through town' },
  { mile: 466.0, name: 'VA 16', road: 'VA 16', nearestTown: 'Marion', townDist: 7, hospital: 'Marion', hospitalDist: 7 },
  { mile: 508.7, name: 'Atkins', road: 'VA 11/US 11', nearestTown: 'Atkins', townDist: 1, hospital: 'Marion', hospitalDist: 15 },
  { mile: 550.6, name: 'Pearisburg', road: 'VA 100', nearestTown: 'Pearisburg', townDist: 1, hospital: 'Radford', hospitalDist: 20 },
  { mile: 625.8, name: 'Daleville', road: 'US 220', nearestTown: 'Daleville', townDist: 0, hospital: 'Roanoke', hospitalDist: 10 },
  { mile: 702.3, name: 'Rockfish Gap', road: 'US 250/I-64', nearestTown: 'Waynesboro', townDist: 4, hospital: 'Waynesboro', hospitalDist: 4 },
  { mile: 785.5, name: 'Swift Run Gap', road: 'US 33', nearestTown: 'Elkton', townDist: 8, hospital: 'Harrisonburg', hospitalDist: 25, notes: 'Shenandoah NP' },
  { mile: 808.0, name: 'Thornton Gap', road: 'US 211', nearestTown: 'Luray', townDist: 9, hospital: 'Luray', hospitalDist: 9, notes: 'Shenandoah NP' },
  { mile: 876.8, name: 'Manassas Gap', road: 'VA 55', nearestTown: 'Front Royal', townDist: 4, hospital: 'Front Royal', hospitalDist: 4 },
  { mile: 969.6, name: 'Ashby Gap', road: 'US 50', nearestTown: 'Paris', townDist: 2, hospital: 'Winchester', hospitalDist: 20 },
  { mile: 1025.0, name: 'Harpers Ferry', road: 'US 340', nearestTown: 'Harpers Ferry', townDist: 0, hospital: 'Charles Town', hospitalDist: 8, notes: 'ATC HQ - Psychological halfway' },
  { mile: 1066.1, name: 'Gathland State Park', road: 'MD 67', nearestTown: 'Boonsboro', townDist: 3, hospital: 'Hagerstown', hospitalDist: 15 },
  { mile: 1094.4, name: 'Pen Mar', road: 'PA Line', nearestTown: 'Waynesboro PA', townDist: 5, hospital: 'Waynesboro PA', hospitalDist: 5 },
  { mile: 1141.0, name: 'Duncannon', road: 'PA 274', nearestTown: 'Duncannon', townDist: 0, hospital: 'Harrisburg', hospitalDist: 15, notes: 'Trail goes through town' },
  { mile: 1207.3, name: 'Port Clinton', road: 'PA 61', nearestTown: 'Port Clinton', townDist: 0, hospital: 'Reading', hospitalDist: 20 },
  { mile: 1238.0, name: 'Lehigh Gap', road: 'PA 873', nearestTown: 'Palmerton', townDist: 1, hospital: 'Lehighton', hospitalDist: 8 },
  { mile: 1265.6, name: 'Wind Gap', road: 'PA 33', nearestTown: 'Wind Gap', townDist: 1, hospital: 'Easton', hospitalDist: 15 },
  { mile: 1290.0, name: 'Delaware Water Gap', road: 'PA 611', nearestTown: 'Delaware Water Gap', townDist: 0, hospital: 'East Stroudsburg', hospitalDist: 5 },
  { mile: 1353.8, name: 'Unionville', road: 'NJ 284', nearestTown: 'Unionville', townDist: 1, hospital: 'Warwick NY', hospitalDist: 10 },
  { mile: 1409.6, name: 'Bear Mountain', road: 'US 9W', nearestTown: 'Fort Montgomery', townDist: 2, hospital: 'Newburgh', hospitalDist: 15 },
  { mile: 1433.5, name: 'NY 17/Arden', road: 'NY 17', nearestTown: 'Southfields', townDist: 3, hospital: 'Warwick', hospitalDist: 10 },
  { mile: 1479.5, name: 'Kent', road: 'NY 341', nearestTown: 'Kent', townDist: 1, hospital: 'Danbury CT', hospitalDist: 15 },
  { mile: 1521.1, name: 'Salisbury', road: 'US 44', nearestTown: 'Salisbury', townDist: 1, hospital: 'Sharon', hospitalDist: 8 },
  { mile: 1566.4, name: 'Great Barrington', road: 'MA 23', nearestTown: 'Great Barrington', townDist: 5, hospital: 'Great Barrington', hospitalDist: 5 },
  { mile: 1595.3, name: 'Dalton', road: 'MA 8/9', nearestTown: 'Dalton', townDist: 0, hospital: 'Pittsfield', hospitalDist: 5, notes: 'Trail goes through town' },
  { mile: 1630.5, name: 'North Adams', road: 'MA 2', nearestTown: 'North Adams', townDist: 4, hospital: 'North Adams', hospitalDist: 4 },
  { mile: 1650.3, name: 'Bennington', road: 'VT 9', nearestTown: 'Bennington', townDist: 5, hospital: 'Bennington', hospitalDist: 5 },
  { mile: 1699.3, name: 'Manchester', road: 'VT 11/30', nearestTown: 'Manchester', townDist: 6, hospital: 'Bennington', hospitalDist: 25 },
  { mile: 1741.8, name: 'Killington', road: 'US 4', nearestTown: 'Killington', townDist: 2, hospital: 'Rutland', hospitalDist: 12 },
  { mile: 1773.3, name: 'Hanover', road: 'NH 10', nearestTown: 'Hanover', townDist: 0, hospital: 'Lebanon', hospitalDist: 3, notes: 'Dartmouth College - Trail goes through town' },
  { mile: 1822.8, name: 'Lincoln', road: 'US 3', nearestTown: 'Lincoln', townDist: 3, hospital: 'Plymouth', hospitalDist: 15 },
  { mile: 1843.4, name: 'Franconia Notch', road: 'I-93', nearestTown: 'Lincoln', townDist: 8, hospital: 'Littleton', hospitalDist: 20, notes: 'White Mountains' },
  { mile: 1862.1, name: 'Crawford Notch', road: 'US 302', nearestTown: 'Twin Mountain', townDist: 8, hospital: 'Littleton', hospitalDist: 25, notes: 'White Mountains' },
  { mile: 1879.6, name: 'Pinkham Notch', road: 'NH 16', nearestTown: 'Gorham', townDist: 11, hospital: 'Berlin', hospitalDist: 20, notes: 'AMC visitor center' },
  { mile: 1897.0, name: 'Gorham', road: 'US 2', nearestTown: 'Gorham', townDist: 4, hospital: 'Berlin', hospitalDist: 8 },
  { mile: 1940.1, name: 'Andover', road: 'ME 26', nearestTown: 'Andover', townDist: 8, hospital: 'Rumford', hospitalDist: 25 },
  { mile: 1976.0, name: 'Stratton', road: 'ME 27', nearestTown: 'Stratton', townDist: 5, hospital: 'Farmington', hospitalDist: 35 },
  { mile: 2010.3, name: 'Caratunk', road: 'US 201', nearestTown: 'Caratunk', townDist: 0, hospital: 'Skowhegan', hospitalDist: 35 },
  { mile: 2090.0, name: 'Monson', road: 'ME 15', nearestTown: 'Monson', townDist: 4, hospital: 'Dover-Foxcroft', hospitalDist: 25, notes: 'Last resupply before 100-Mile Wilderness' },
  { mile: 2198.0, name: 'Katahdin', road: 'Baxter Park Rd', nearestTown: 'Millinocket', townDist: 20, hospital: 'Millinocket', hospitalDist: 20, notes: 'Northern Terminus!' },
];

