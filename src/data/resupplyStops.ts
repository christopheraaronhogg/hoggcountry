export type ResupplyStopType = 'trailhead' | 'outfitter' | 'limited' | 'town';

export type ResupplyCosts = Partial<{
  hostel: number;
  motel: number;
  resupply: number;
  meal: number;
  laundry: number;
}>;

export type ResupplyStop = {
  mile: number;
  name: string;
  state?: string; // 2-letter when known
  type: ResupplyStopType;
  services: string[];
  mailDrop: boolean;
  costs: ResupplyCosts | null;
};

// Single source of truth for the Resupply tool + Mail Drop directory.
// Costs are rough planning estimates (not guarantees).
export const RESUPPLY_STOPS: ResupplyStop[] = [
  { mile: 0, name: 'Springer Mountain', state: 'GA', type: 'trailhead', services: ['start'], mailDrop: false, costs: null },
  { mile: 31, name: 'Neels Gap', state: 'GA', type: 'outfitter', services: ['outfitter', 'snacks'], mailDrop: true, costs: { resupply: 25, meal: 12 } },
  { mile: 69, name: 'Hiawassee', state: 'GA', type: 'town', services: ['grocery', 'outfitter', 'restaurant'], mailDrop: true, costs: { hostel: 30, motel: 70, resupply: 15, meal: 12, laundry: 6 } },
  { mile: 110, name: 'Franklin', state: 'NC', type: 'town', services: ['grocery', 'outfitter', 'restaurant'], mailDrop: true, costs: { hostel: 28, motel: 65, resupply: 14, meal: 11, laundry: 6 } },
  { mile: 165, name: 'Fontana Dam', state: 'NC', type: 'limited', services: ['convenience', 'restaurant'], mailDrop: true, costs: { resupply: 20, meal: 14 } },
  { mile: 206, name: 'Gatlinburg', state: 'TN', type: 'town', services: ['grocery', 'outfitter', 'restaurant'], mailDrop: true, costs: { hostel: 35, motel: 90, resupply: 16, meal: 15, laundry: 7 } },
  { mile: 274, name: 'Hot Springs', state: 'NC', type: 'town', services: ['grocery', 'outfitter', 'restaurant'], mailDrop: true, costs: { hostel: 30, motel: 75, resupply: 15, meal: 13, laundry: 6 } },
  { mile: 342, name: 'Erwin', state: 'TN', type: 'town', services: ['grocery', 'outfitter', 'restaurant'], mailDrop: true, costs: { hostel: 25, motel: 60, resupply: 13, meal: 10, laundry: 5 } },
  { mile: 473, name: 'Damascus', state: 'VA', type: 'town', services: ['grocery', 'outfitter', 'restaurant'], mailDrop: true, costs: { hostel: 28, motel: 65, resupply: 14, meal: 11, laundry: 5 } },
  { mile: 509, name: 'Atkins', state: 'VA', type: 'limited', services: ['convenience', 'restaurant'], mailDrop: false, costs: { resupply: 18, meal: 10 } },
  { mile: 636, name: 'Pearisburg', state: 'VA', type: 'town', services: ['grocery', 'restaurant'], mailDrop: true, costs: { hostel: 25, motel: 60, resupply: 13, meal: 10, laundry: 5 } },
  { mile: 726, name: 'Daleville', state: 'VA', type: 'limited', services: ['grocery', 'restaurant'], mailDrop: true, costs: { motel: 70, resupply: 14, meal: 12, laundry: 6 } },
  { mile: 864, name: 'Waynesboro', state: 'VA', type: 'town', services: ['grocery', 'outfitter', 'restaurant'], mailDrop: true, costs: { hostel: 30, motel: 65, resupply: 14, meal: 11, laundry: 6 } },
  { mile: 942, name: 'Front Royal', state: 'VA', type: 'town', services: ['grocery', 'restaurant'], mailDrop: true, costs: { motel: 75, resupply: 15, meal: 12, laundry: 6 } },
  { mile: 1025, name: 'Harpers Ferry', state: 'WV', type: 'town', services: ['grocery', 'outfitter', 'restaurant'], mailDrop: true, costs: { hostel: 35, motel: 85, resupply: 16, meal: 14, laundry: 7 } },
  { mile: 1141, name: 'Duncannon', state: 'PA', type: 'limited', services: ['convenience', 'restaurant'], mailDrop: true, costs: { hostel: 25, resupply: 15, meal: 10 } },
  { mile: 1207, name: 'Port Clinton', state: 'PA', type: 'limited', services: ['convenience'], mailDrop: true, costs: { hostel: 25, resupply: 15 } },
  { mile: 1290, name: 'Delaware Water Gap', state: 'PA', type: 'town', services: ['grocery', 'outfitter', 'restaurant'], mailDrop: true, costs: { hostel: 35, motel: 80, resupply: 16, meal: 14, laundry: 7 } },
  { mile: 1353, name: 'Unionville', state: 'NY', type: 'limited', services: ['convenience'], mailDrop: false, costs: { resupply: 18 } },
  { mile: 1409, name: 'Bear Mountain', state: 'NY', type: 'limited', services: ['convenience', 'restaurant'], mailDrop: false, costs: { resupply: 20, meal: 15 } },
  { mile: 1479, name: 'Kent', state: 'CT', type: 'town', services: ['grocery', 'restaurant'], mailDrop: true, costs: { motel: 100, resupply: 18, meal: 16, laundry: 8 } },
  { mile: 1521, name: 'Salisbury', state: 'CT', type: 'town', services: ['grocery', 'restaurant'], mailDrop: true, costs: { motel: 95, resupply: 17, meal: 15, laundry: 7 } },
  { mile: 1566, name: 'Great Barrington', state: 'MA', type: 'town', services: ['grocery', 'restaurant'], mailDrop: true, costs: { motel: 100, resupply: 18, meal: 16, laundry: 8 } },
  { mile: 1595, name: 'Dalton', state: 'MA', type: 'limited', services: ['convenience', 'restaurant'], mailDrop: true, costs: { resupply: 16, meal: 12 } },
  { mile: 1650, name: 'Bennington', state: 'VT', type: 'town', services: ['grocery', 'restaurant'], mailDrop: true, costs: { motel: 85, resupply: 16, meal: 14, laundry: 7 } },
  { mile: 1699, name: 'Manchester', state: 'VT', type: 'town', services: ['grocery', 'outfitter', 'restaurant'], mailDrop: true, costs: { hostel: 40, motel: 110, resupply: 18, meal: 16, laundry: 8 } },
  { mile: 1742, name: 'Killington', state: 'VT', type: 'limited', services: ['convenience', 'restaurant'], mailDrop: true, costs: { motel: 90, resupply: 18, meal: 15 } },
  { mile: 1773, name: 'Hanover', state: 'NH', type: 'town', services: ['grocery', 'outfitter', 'restaurant'], mailDrop: true, costs: { motel: 120, resupply: 18, meal: 17, laundry: 8 } },
  { mile: 1823, name: 'Lincoln', state: 'NH', type: 'town', services: ['grocery', 'restaurant'], mailDrop: true, costs: { hostel: 35, motel: 100, resupply: 17, meal: 15, laundry: 7 } },
  { mile: 1862, name: 'Franconia', state: 'NH', type: 'limited', services: ['convenience', 'restaurant'], mailDrop: true, costs: { hostel: 35, resupply: 18, meal: 14 } },
  { mile: 1897, name: 'Gorham', state: 'NH', type: 'town', services: ['grocery', 'outfitter', 'restaurant'], mailDrop: true, costs: { hostel: 35, motel: 85, resupply: 16, meal: 14, laundry: 7 } },
  { mile: 1940, name: 'Andover', state: 'ME', type: 'limited', services: ['convenience'], mailDrop: true, costs: { hostel: 30, resupply: 16 } },
  { mile: 1976, name: 'Stratton', state: 'ME', type: 'limited', services: ['convenience', 'restaurant'], mailDrop: true, costs: { hostel: 32, resupply: 18, meal: 14 } },
  { mile: 2010, name: 'Caratunk', state: 'ME', type: 'limited', services: ['convenience'], mailDrop: true, costs: { hostel: 30, resupply: 18 } },
  { mile: 2090, name: 'Monson', state: 'ME', type: 'town', services: ['grocery', 'restaurant'], mailDrop: true, costs: { hostel: 35, motel: 80, resupply: 16, meal: 14, laundry: 7 } },
  { mile: 2198, name: 'Millinocket', state: 'ME', type: 'town', services: ['grocery', 'restaurant'], mailDrop: true, costs: { motel: 75, resupply: 15, meal: 12, laundry: 6 } },
];

