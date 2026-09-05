// src/data/trailSections.ts
export interface TrailSection {
  name: string;
  state: string;
  startMile: number;
  endMile: number;
  emoji: string;
}

export const TRAIL_SECTIONS: TrailSection[] = [
  { name: 'Georgia', state: 'GA', startMile: 0, endMile: 79, emoji: '🍑' },
  { name: 'North Carolina', state: 'NC', startMile: 79, endMile: 166, emoji: '🌲' },
  { name: 'Smokies', state: 'TN', startMile: 166, endMile: 241, emoji: '🐻' },
  { name: 'Tennessee', state: 'TN', startMile: 241, endMile: 298, emoji: '🎸' },
  { name: 'Virginia', state: 'VA', startMile: 298, endMile: 550, emoji: '🏔️' },
  { name: 'Shenandoah', state: 'VA', startMile: 550, endMile: 634, emoji: '🦌' },
  { name: 'West Virginia', state: 'WV', startMile: 634, endMile: 1025, emoji: '⛰️' },
  { name: 'Maryland', state: 'MD', startMile: 1025, endMile: 1065, emoji: '🦀' },
  { name: 'Pennsylvania', state: 'PA', startMile: 1065, endMile: 1290, emoji: '🪨' },
  { name: 'New Jersey', state: 'NJ', startMile: 1290, endMile: 1360, emoji: '🌳' },
  { name: 'New York', state: 'NY', startMile: 1360, endMile: 1469, emoji: '🗽' },
  { name: 'Connecticut', state: 'CT', startMile: 1469, endMile: 1538, emoji: '🍂' },
  { name: 'Massachusetts', state: 'MA', startMile: 1538, endMile: 1623, emoji: '🦃' },
  { name: 'Vermont', state: 'VT', startMile: 1623, endMile: 1773, emoji: '🧀' },
  { name: 'New Hampshire', state: 'NH', startMile: 1773, endMile: 1912, emoji: '🏔️' },
  { name: 'Maine', state: 'ME', startMile: 1912, endMile: 2197.9, emoji: '🦞' },
];

export function getSectionForMile(mile: number): TrailSection | undefined {
  return TRAIL_SECTIONS.find(s => mile >= s.startMile && mile < s.endMile);
}

export function getSectionProgress(mile: number) {
  const section = getSectionForMile(mile);
  if (!section) return null;
  const sectionLength = section.endMile - section.startMile;
  const milesIntoSection = mile - section.startMile;
  return {
    section,
    percent: Math.round((milesIntoSection / sectionLength) * 100),
    milesInto: milesIntoSection,
    milesRemaining: sectionLength - milesIntoSection,
  };
}

export const STATE_BOUNDARIES = [
    { mile: 79, from: 'GA', to: 'NC' },
    { mile: 166, from: 'NC', to: 'TN' },
    { mile: 298, from: 'TN', to: 'VA' },
    { mile: 634, from: 'VA', to: 'WV' },
    { mile: 1025, from: 'WV', to: 'MD' },
    { mile: 1065, from: 'MD', to: 'PA' },
    { mile: 1290, from: 'PA', to: 'NJ' },
    { mile: 1360, from: 'NJ', to: 'NY' },
    { mile: 1469, from: 'NY', to: 'CT' },
    { mile: 1538, from: 'CT', to: 'MA' },
    { mile: 1623, from: 'MA', to: 'VT' },
    { mile: 1773, from: 'VT', to: 'NH' },
    { mile: 1912, from: 'NH', to: 'ME' }
];
