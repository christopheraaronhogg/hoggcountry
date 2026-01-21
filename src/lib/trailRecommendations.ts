export interface TrailAlert {
  kind: 'info' | 'warning';
  title: string;
  message: string;
}

export interface TrailTown {
  name: string;
  mile: number;
  services?: string[];
}

export interface TrailState {
  id: string;
  name: string;
  entryMile: number;
  exitMile: number;
}

// Mile markers are sourced from the project's 2026 trail facts database (rounded where appropriate).
const states: TrailState[] = [
  { id: 'GA', name: 'Georgia', entryMile: 0.0, exitMile: 75.5 },
  { id: 'NC', name: 'North Carolina', entryMile: 75.5, exitMile: 240.8 },
  { id: 'TN', name: 'Tennessee', entryMile: 240.8, exitMile: 392.5 },
  { id: 'VA', name: 'Virginia', entryMile: 392.5, exitMile: 1009.0 },
  { id: 'WV', name: 'West Virginia', entryMile: 1009.0, exitMile: 1012.1 },
  { id: 'MD', name: 'Maryland', entryMile: 1012.1, exitMile: 1052.4 },
  { id: 'PA', name: 'Pennsylvania', entryMile: 1052.4, exitMile: 1282.5 },
  { id: 'NJ', name: 'New Jersey', entryMile: 1282.5, exitMile: 1355.0 },
  { id: 'NY', name: 'New York', entryMile: 1355.0, exitMile: 1443.8 },
  { id: 'CT', name: 'Connecticut', entryMile: 1443.8, exitMile: 1495.5 },
  { id: 'MA', name: 'Massachusetts', entryMile: 1495.5, exitMile: 1585.9 },
  { id: 'VT', name: 'Vermont', entryMile: 1585.9, exitMile: 1736.7 },
  { id: 'NH', name: 'New Hampshire', entryMile: 1736.7, exitMile: 1898.5 },
  { id: 'ME', name: 'Maine', entryMile: 1898.5, exitMile: 2197.4 },
];

const keyTowns: TrailTown[] = [
  { name: 'Mountain Crossings (Neels Gap)', mile: 31.7, services: ['outfitter', 'resupply'] },
  { name: 'Hiawassee, GA', mile: 69.2, services: ['town resupply'] },
  { name: 'Franklin, NC', mile: 108.3, services: ['outfitter', 'town resupply'] },
  { name: 'Fontana Dam, NC', mile: 163.8, services: ['last stop before Smokies'] },
  { name: 'Gatlinburg, TN', mile: 206.4, services: ['full services'] },
  { name: 'Hot Springs, NC', mile: 273.4, services: ['on-trail town'] },
  { name: 'Erwin, TN', mile: 340.5, services: ['town resupply'] },
  { name: 'Damascus, VA', mile: 464.4, services: ['Trail Days', 'full services'] },
  { name: 'Pearisburg, VA', mile: 635.3, services: ['town resupply'] },
  { name: 'Waynesboro, VA', mile: 861.7, services: ['Shenandoah gateway'] },
  { name: 'Harpers Ferry, WV', mile: 1012.0, services: ['ATC HQ'] },
  { name: 'Delaware Water Gap, PA', mile: 1290.0, services: ['town resupply'] },
  { name: 'Hanover, NH', mile: 1747.2, services: ['Whites approach'] },
  { name: 'Monson, ME', mile: 2077.0, services: ['100-Mile Wilderness gateway'] },
];

const ZONES = {
  smokies: { start: 165.0, end: 241.0, title: 'Smokies zone' },
  whites: { start: 1736.7, end: 1898.5, title: 'White Mountains zone' },
  maine: { start: 2077.0, end: 2197.4, title: 'Maine backcountry zone' },
};

export function getCurrentState(mile: number): TrailState | null {
  const found = states.find((s) => mile >= s.entryMile && mile < s.exitMile);
  return found ?? null;
}

export function getNextTown(mile: number): (TrailTown & { milesAway: number }) | null {
  const next = keyTowns
    .slice()
    .sort((a, b) => a.mile - b.mile)
    .find((t) => t.mile >= mile);
  if (!next) return null;
  return { ...next, milesAway: Math.max(0, Math.round((next.mile - mile) * 10) / 10) };
}

export function getAlerts(mile: number): TrailAlert[] {
  const alerts: TrailAlert[] = [];

  if (mile >= ZONES.smokies.start && mile <= ZONES.smokies.end) {
    alerts.push({
      kind: 'warning',
      title: 'Smokies',
      message: 'Permit rules apply; check bear activity and current closures.',
    });
  }

  if (mile >= ZONES.whites.start && mile <= ZONES.whites.end) {
    alerts.push({
      kind: 'warning',
      title: 'Whites',
      message: 'Hard terrain and fast-changing weather; plan conservative mileage.',
    });
  }

  if (mile >= ZONES.maine.start && mile <= ZONES.maine.end) {
    alerts.push({
      kind: 'warning',
      title: 'Maine',
      message: 'Remote stretches ahead (including the 100‑Mile Wilderness); carry extra food and a buffer day.',
    });
  }

  // Terrain callouts (simple, mile-based)
  if (mile >= 1052.4 && mile <= 1282.5) {
    alerts.push({
      kind: 'info',
      title: 'Rocksylvania',
      message: 'Rocky tread and sore feet are common; consider fresh shoes and a lighter pack.',
    });
  }

  return alerts;
}

