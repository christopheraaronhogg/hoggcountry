export const RESUPPLY_SERVICE_META = {
  grocery: { label: 'Grocer', icon: '🛒' },
  outfitter: { label: 'Outfitter', icon: '🎒' },
  convenience: { label: 'Convenience', icon: '🏪' },
  restaurant: { label: 'Restaurant', icon: '🍽️' },
  snacks: { label: 'Snacks', icon: '🍫' },
  start: { label: 'Start', icon: '🏔️' },
} as const;

export type ResupplyService = keyof typeof RESUPPLY_SERVICE_META;

export interface ResupplyTown {
  mile: number;
  name: string;
  services: ResupplyService[];
}

// Rolled out of the former Resupply Planner (now displayed inline in Journey).
export const RESUPPLY_TOWNS: ResupplyTown[] = [
  { mile: 0, name: 'Springer Mountain', services: ['start'] },
  { mile: 31, name: 'Neels Gap', services: ['outfitter', 'snacks'] },
  { mile: 69, name: 'Hiawassee', services: ['grocery', 'outfitter', 'restaurant'] },
  { mile: 110, name: 'Franklin', services: ['grocery', 'outfitter', 'restaurant'] },
  { mile: 165, name: 'Fontana Dam', services: ['convenience', 'restaurant'] },
  { mile: 206, name: 'Gatlinburg', services: ['grocery', 'outfitter', 'restaurant'] },
  { mile: 274, name: 'Hot Springs', services: ['grocery', 'outfitter', 'restaurant'] },
  { mile: 342, name: 'Erwin', services: ['grocery', 'outfitter', 'restaurant'] },
  { mile: 473, name: 'Damascus', services: ['grocery', 'outfitter', 'restaurant'] },
  { mile: 509, name: 'Atkins', services: ['convenience', 'restaurant'] },
  { mile: 636, name: 'Pearisburg', services: ['grocery', 'restaurant'] },
  { mile: 726, name: 'Daleville', services: ['grocery', 'restaurant'] },
  { mile: 864, name: 'Waynesboro', services: ['grocery', 'outfitter', 'restaurant'] },
  { mile: 942, name: 'Front Royal', services: ['grocery', 'restaurant'] },
  { mile: 1025, name: 'Harpers Ferry', services: ['grocery', 'outfitter', 'restaurant'] },
  { mile: 1141, name: 'Duncannon', services: ['convenience', 'restaurant'] },
  { mile: 1207, name: 'Port Clinton', services: ['convenience'] },
  { mile: 1290, name: 'Delaware Water Gap', services: ['grocery', 'outfitter', 'restaurant'] },
  { mile: 1353, name: 'Unionville', services: ['convenience'] },
  { mile: 1409, name: 'Bear Mountain', services: ['convenience', 'restaurant'] },
  { mile: 1479, name: 'Kent', services: ['grocery', 'restaurant'] },
  { mile: 1521, name: 'Salisbury', services: ['grocery', 'restaurant'] },
  { mile: 1566, name: 'Great Barrington', services: ['grocery', 'restaurant'] },
  { mile: 1595, name: 'Dalton', services: ['convenience', 'restaurant'] },
  { mile: 1650, name: 'Bennington', services: ['grocery', 'restaurant'] },
  { mile: 1699, name: 'Manchester', services: ['grocery', 'outfitter', 'restaurant'] },
  { mile: 1742, name: 'Killington', services: ['convenience', 'restaurant'] },
  { mile: 1773, name: 'Hanover', services: ['grocery', 'outfitter', 'restaurant'] },
  { mile: 1823, name: 'Lincoln', services: ['grocery', 'restaurant'] },
  { mile: 1862, name: 'Franconia', services: ['convenience', 'restaurant'] },
  { mile: 1897, name: 'Gorham', services: ['grocery', 'outfitter', 'restaurant'] },
  { mile: 1940, name: 'Andover', services: ['convenience'] },
  { mile: 1976, name: 'Stratton', services: ['convenience', 'restaurant'] },
  { mile: 2010, name: 'Caratunk', services: ['convenience'] },
  { mile: 2090, name: 'Monson', services: ['grocery', 'restaurant'] },
  { mile: 2198, name: 'Millinocket', services: ['grocery', 'restaurant'] },
];

export const resupplyServicesByTownName = Object.fromEntries(
  RESUPPLY_TOWNS.map((t) => [t.name, t.services]),
) as Record<string, ResupplyService[]>;

