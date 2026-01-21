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
  { mile: 166, name: 'Fontana Dam', services: ['convenience', 'restaurant'] },
  { mile: 200, name: 'Gatlinburg', services: ['grocery', 'outfitter', 'restaurant'] },
  { mile: 274, name: 'Hot Springs', services: ['grocery', 'outfitter', 'restaurant'] },
  { mile: 342, name: 'Erwin', services: ['grocery', 'outfitter', 'restaurant'] },
  { mile: 386, name: 'Damascus', services: ['grocery', 'outfitter', 'restaurant'] },
  { mile: 635, name: 'Pearisburg', services: ['grocery', 'restaurant'] },
  { mile: 702, name: 'Waynesboro', services: ['grocery', 'outfitter', 'restaurant'] },
  { mile: 729, name: 'Daleville', services: ['grocery', 'restaurant'] },
  { mile: 999, name: 'Front Royal', services: ['grocery', 'restaurant'] },
  { mile: 1025, name: 'Harpers Ferry', services: ['grocery', 'outfitter', 'restaurant'] },
  { mile: 1149, name: 'Duncannon', services: ['convenience', 'restaurant'] },
  { mile: 1217, name: 'Port Clinton', services: ['convenience'] },
  { mile: 1298, name: 'Delaware Water Gap', services: ['grocery', 'outfitter', 'restaurant'] },
  { mile: 1342, name: 'Unionville', services: ['convenience'] },
  { mile: 1410, name: 'Bear Mountain', services: ['convenience', 'restaurant'] },
  { mile: 1469, name: 'Kent', services: ['grocery', 'restaurant'] },
  { mile: 1538, name: 'Great Barrington', services: ['grocery', 'restaurant'] },
  { mile: 1570, name: 'Dalton', services: ['convenience', 'restaurant'] },
  { mile: 1606, name: 'Bennington', services: ['grocery', 'restaurant'] },
  { mile: 1645, name: 'Manchester', services: ['grocery', 'outfitter', 'restaurant'] },
  { mile: 1700, name: 'Killington', services: ['convenience', 'restaurant'] },
  { mile: 1747, name: 'Hanover', services: ['grocery', 'outfitter', 'restaurant'] },
  { mile: 1823, name: 'Lincoln', services: ['grocery', 'restaurant'] },
  { mile: 1898, name: 'Gorham', services: ['grocery', 'outfitter', 'restaurant'] },
  { mile: 1975, name: 'Andover', services: ['convenience'] },
  { mile: 2001, name: 'Rangeley', services: ['grocery', 'restaurant'] },
  { mile: 2013, name: 'Caratunk', services: ['convenience'] },
  { mile: 2031, name: 'Stratton', services: ['convenience', 'restaurant'] },
  { mile: 2090, name: 'Monson', services: ['grocery', 'restaurant'] },
  { mile: 2190, name: 'Millinocket', services: ['grocery', 'restaurant'] },
];

export const resupplyServicesByTownName = Object.fromEntries(
  RESUPPLY_TOWNS.map((t) => [t.name, t.services]),
) as Record<string, ResupplyService[]>;
