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
  { mile: 109, name: 'Franklin', services: ['grocery', 'outfitter', 'restaurant'] },
  { mile: 164, name: 'Fontana Dam', services: ['convenience', 'restaurant'] },
  { mile: 208, name: 'Gatlinburg', services: ['grocery', 'outfitter', 'restaurant'] },
  { mile: 275, name: 'Hot Springs', services: ['grocery', 'outfitter', 'restaurant'] },
  { mile: 344, name: 'Erwin', services: ['grocery', 'outfitter', 'restaurant'] },
  { mile: 471, name: 'Damascus', services: ['grocery', 'outfitter', 'restaurant'] },
  { mile: 637, name: 'Pearisburg', services: ['grocery', 'restaurant'] },
  { mile: 730, name: 'Daleville', services: ['grocery', 'restaurant'] },
  { mile: 862, name: 'Waynesboro', services: ['grocery', 'outfitter', 'restaurant'] },
  { mile: 972, name: 'Front Royal', services: ['grocery', 'restaurant'] },
  { mile: 1026, name: 'Harpers Ferry', services: ['grocery', 'outfitter', 'restaurant'] },
  { mile: 1150, name: 'Duncannon', services: ['convenience', 'restaurant'] },
  { mile: 1220, name: 'Port Clinton', services: ['convenience'] },
  { mile: 1298, name: 'Delaware Water Gap', services: ['grocery', 'outfitter', 'restaurant'] },
  { mile: 1349, name: 'Unionville', services: ['convenience'] },
  { mile: 1410, name: 'Bear Mountain', services: ['convenience', 'restaurant'] },
  { mile: 1473, name: 'Kent', services: ['grocery', 'restaurant'] },
  { mile: 1528, name: 'Great Barrington', services: ['grocery', 'restaurant'] },
  { mile: 1576, name: 'Dalton', services: ['convenience', 'restaurant'] },
  { mile: 1618, name: 'Bennington', services: ['grocery', 'restaurant'] },
  { mile: 1658, name: 'Manchester', services: ['grocery', 'outfitter', 'restaurant'] },
  { mile: 1712, name: 'Killington', services: ['convenience', 'restaurant'] },
  { mile: 1755, name: 'Hanover', services: ['grocery', 'outfitter', 'restaurant'] },
  { mile: 1822, name: 'Lincoln', services: ['grocery', 'restaurant'] },
  { mile: 1898, name: 'Gorham', services: ['grocery', 'outfitter', 'restaurant'] },
  { mile: 1950, name: 'Andover', services: ['convenience'] },
  { mile: 1977, name: 'Rangeley', services: ['grocery', 'restaurant'] },
  { mile: 2009, name: 'Stratton', services: ['convenience', 'restaurant'] },
  { mile: 2046, name: 'Caratunk', services: ['convenience'] },
  { mile: 2079, name: 'Monson', services: ['grocery', 'restaurant'] },
  { mile: 2183, name: 'Millinocket', services: ['grocery', 'restaurant'] },
];

export const resupplyServicesByTownName = Object.fromEntries(
  RESUPPLY_TOWNS.map((t) => [t.name, t.services]),
) as Record<string, ResupplyService[]>;
