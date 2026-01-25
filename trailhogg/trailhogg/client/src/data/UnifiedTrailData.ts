import {
  SHELTERS,
  TOWNS,
  PEAKS,
  LANDMARKS,
  FAMOUS_WATER_SOURCES,
  AMC_HUTS,
  Shelter,
  Town,
  Peak,
  Landmark,
  WaterSource,
  AMCHut
} from './TrailData';

export interface TrailLocation {
  mile: number;
  name: string;
  type: 'town' | 'shelter' | 'water' | 'peak' | 'landmark';
  description: string;
  services?: string[];
  elevation?: number;
  distance?: string; // Distance from trail
}

// Convert diverse data sources into a single unified array
const unifiedData: TrailLocation[] = [];

// Shelters
SHELTERS.forEach((s: Shelter) => {
  unifiedData.push({
    mile: s.mile,
    name: s.name,
    type: 'shelter',
    description: s.notes || (s.hasPrivy ? 'Has privy.' : 'Basic shelter.'),
    elevation: s.elevation,
    services: s.hasPrivy ? ['privy'] : []
  });
});

// Towns
TOWNS.forEach((t: Town) => {
  unifiedData.push({
    mile: t.mile,
    name: t.name,
    type: 'town',
    description: t.notes || `Resupply town in ${t.state}.`,
    distance: t.distance,
    services: t.services
  });
});

// Peaks
PEAKS.forEach((p: Peak) => {
  unifiedData.push({
    mile: p.mile,
    name: p.name,
    type: 'peak',
    description: p.notes || `Difficulty: ${p.difficulty}/5`,
    elevation: p.elevation
  });
});

// Landmarks
LANDMARKS.forEach((l: Landmark) => {
  unifiedData.push({
    mile: l.mile,
    name: l.name,
    type: 'landmark',
    description: l.description + (l.notes ? ` ${l.notes}` : ''),
  });
});

// Water Sources
FAMOUS_WATER_SOURCES.forEach((w: WaterSource) => {
  unifiedData.push({
    mile: w.mile,
    name: w.name,
    type: 'water',
    description: w.description + (w.notes ? ` ${w.notes}` : ''),
  });
});

// AMC Huts (treating as shelters/lodging)
AMC_HUTS.forEach((h: AMCHut) => {
  unifiedData.push({
    mile: h.mile,
    name: h.name,
    type: 'shelter',
    description: h.notes || 'AMC High Hut',
    elevation: h.elevation,
    services: h.hasMeals ? ['meals', 'bunks'] : ['bunks']
  });
});

// Sort by mile
unifiedData.sort((a, b) => a.mile - b.mile);

export const TRAIL_DATA = unifiedData;
