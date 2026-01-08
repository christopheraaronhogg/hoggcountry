// ============================================
// TRAIL LEGS - MVP Trail Data
// Springer Mountain to Neels Gap (~30 miles)
// ============================================

import { Shelter, Town, WaterSource, TrailSegment, Blaze, BlazeType, TerrainType } from './types';

export const WATER_SOURCES: WaterSource[] = [
  { id: 'ws_springer_spring', name: 'Springer Mountain Spring', mile: 0.1, reliable: true, flowRate: 70, distanceFromTrail: 100 },
  { id: 'ws_stover_creek', name: 'Stover Creek', mile: 2.5, reliable: true, flowRate: 85, distanceFromTrail: 50 },
  { id: 'ws_three_forks', name: 'Three Forks', mile: 2.8, reliable: true, flowRate: 90, distanceFromTrail: 0 },
  { id: 'ws_long_creek', name: 'Long Creek', mile: 4.2, reliable: true, flowRate: 80, distanceFromTrail: 20 },
  { id: 'ws_hawk_mtn_spring', name: 'Hawk Mountain Spring', mile: 8.1, reliable: false, flowRate: 40, distanceFromTrail: 200 },
  { id: 'ws_justus_creek', name: 'Justus Creek', mile: 9.8, reliable: true, flowRate: 75, distanceFromTrail: 30 },
  { id: 'ws_blackwell_creek', name: 'Blackwell Creek', mile: 12.5, reliable: true, flowRate: 70, distanceFromTrail: 100 },
  { id: 'ws_woods_hole_spring', name: 'Woods Hole Spring', mile: 13.8, reliable: true, flowRate: 60, distanceFromTrail: 150 },
  { id: 'ws_jarrard_gap', name: 'Jarrard Gap Stream', mile: 19.2, reliable: true, flowRate: 65, distanceFromTrail: 50 },
  { id: 'ws_slaughter_creek', name: 'Slaughter Creek', mile: 21.5, reliable: true, flowRate: 85, distanceFromTrail: 0 },
  { id: 'ws_blood_mtn_spring', name: 'Blood Mountain Spring', mile: 29.2, reliable: false, flowRate: 30, distanceFromTrail: 400 },
  { id: 'ws_neels_gap', name: 'Walasi-Yi Water', mile: 30.7, reliable: true, flowRate: 100, distanceFromTrail: 0 }
];

export const SHELTERS: Shelter[] = [
  { id: 'shelter_springer_mtn', name: 'Springer Mountain Shelter', mile: 0.9, elevation: 3782, capacity: 12, hasPrivy: true, hasBearBox: true, hasTentSites: true, waterSourceId: 'ws_springer_spring', description: 'The first shelter for NOBOs. Historic starting point.' },
  { id: 'shelter_stover_creek', name: 'Stover Creek Shelter', mile: 2.5, elevation: 3050, capacity: 8, hasPrivy: true, hasBearBox: true, hasTentSites: true, waterSourceId: 'ws_stover_creek', description: 'Small shelter near Three Forks.' },
  { id: 'shelter_hawk_mtn', name: 'Hawk Mountain Shelter', mile: 8.0, elevation: 3225, capacity: 14, hasPrivy: true, hasBearBox: true, hasTentSites: true, waterSourceId: 'ws_hawk_mtn_spring', description: 'Larger shelter. Spring can run low in dry weather.' },
  { id: 'shelter_gooch_mtn', name: 'Gooch Mountain Shelter', mile: 15.8, elevation: 2784, capacity: 16, hasPrivy: true, hasBearBox: true, hasTentSites: true, waterSourceId: 'ws_blackwell_creek', description: 'Popular shelter at Gooch Gap.' },
  { id: 'shelter_woods_hole', name: 'Woods Hole Shelter', mile: 13.8, elevation: 3580, capacity: 8, hasPrivy: true, hasBearBox: false, hasTentSites: true, waterSourceId: 'ws_woods_hole_spring', description: 'Smaller shelter in quiet location.' },
  { id: 'shelter_blood_mtn', name: 'Blood Mountain Shelter', mile: 29.5, elevation: 4458, capacity: 8, hasPrivy: false, hasBearBox: true, hasTentSites: false, waterSourceId: 'ws_blood_mtn_spring', description: 'Historic stone shelter at Georgia\'s highest AT point. Stunning views.' }
];

export const TOWNS: Town[] = [
  { id: 'town_neels_gap', name: 'Neels Gap / Mountain Crossings', mile: 30.7, distanceFromTrail: 0, hasGrocery: false, hasOutfitter: true, hasPostOffice: false, hasLodging: true, hasRestaurant: false, priceLevel: 3, description: 'The AT passes through the breezeway. Famous outfitter. Many hikers leave the trail here.' }
];

export const TRAIL_SEGMENTS: TrailSegment[] = [
  { id: 'seg_springer_approach', startMile: 0, endMile: 0.9, name: 'Springer Mountain Summit', terrain: TerrainType.ROCKY, elevationGain: 100, elevationLoss: 300, difficulty: 4, blazeFrequency: 8 },
  { id: 'seg_springer_to_stover', startMile: 0.9, endMile: 2.5, name: 'Springer to Stover Creek', terrain: TerrainType.SMOOTH, elevationGain: 200, elevationLoss: 800, difficulty: 3, blazeFrequency: 10 },
  { id: 'seg_three_forks', startMile: 2.5, endMile: 4.5, name: 'Three Forks Valley', terrain: TerrainType.SMOOTH, elevationGain: 400, elevationLoss: 200, difficulty: 2, blazeFrequency: 12 },
  { id: 'seg_to_hawk', startMile: 4.5, endMile: 8.0, name: 'Climb to Hawk Mountain', terrain: TerrainType.STEEP_UP, elevationGain: 1200, elevationLoss: 500, difficulty: 6, blazeFrequency: 8 },
  { id: 'seg_hawk_to_justus', startMile: 8.0, endMile: 10.5, name: 'Hawk Mountain to Justus Creek', terrain: TerrainType.ROOTY, elevationGain: 400, elevationLoss: 900, difficulty: 5, blazeFrequency: 9 },
  { id: 'seg_to_gooch_gap', startMile: 10.5, endMile: 15.8, name: 'To Gooch Gap', terrain: TerrainType.SMOOTH, elevationGain: 1000, elevationLoss: 800, difficulty: 4, blazeFrequency: 10 },
  { id: 'seg_woody_gap', startMile: 15.8, endMile: 20.2, name: 'Gooch Gap to Woody Gap', terrain: TerrainType.ROCKY, elevationGain: 1500, elevationLoss: 1200, difficulty: 5, blazeFrequency: 8 },
  { id: 'seg_preaching_rock', startMile: 20.2, endMile: 24.5, name: 'Woody Gap to Jarrard Gap', terrain: TerrainType.STEEP_UP, elevationGain: 1800, elevationLoss: 1000, difficulty: 6, blazeFrequency: 7 },
  { id: 'seg_blood_approach', startMile: 24.5, endMile: 29.5, name: 'Approach to Blood Mountain', terrain: TerrainType.ROCKY, elevationGain: 2000, elevationLoss: 800, difficulty: 8, blazeFrequency: 6 },
  { id: 'seg_blood_to_neels', startMile: 29.5, endMile: 30.7, name: 'Blood Mountain to Neels Gap', terrain: TerrainType.STEEP_DOWN, elevationGain: 100, elevationLoss: 1000, difficulty: 5, blazeFrequency: 9 }
];

export interface ElevationPoint { mile: number; elevation: number; }

export const ELEVATION_PROFILE: ElevationPoint[] = [
  { mile: 0, elevation: 3782 }, { mile: 0.9, elevation: 3420 },
  { mile: 2.5, elevation: 3050 }, { mile: 2.8, elevation: 2530 },
  { mile: 4.5, elevation: 2680 }, { mile: 6.0, elevation: 3450 },
  { mile: 8.0, elevation: 3225 }, { mile: 10.5, elevation: 2560 },
  { mile: 13.8, elevation: 3580 }, { mile: 15.8, elevation: 2784 },
  { mile: 17.5, elevation: 3480 }, { mile: 20.2, elevation: 3173 },
  { mile: 22.0, elevation: 3650 }, { mile: 24.5, elevation: 3280 },
  { mile: 27.0, elevation: 3800 }, { mile: 29.5, elevation: 4458 },
  { mile: 30.7, elevation: 3125 }
];

// Generate blazes procedurally but deterministically
let blazeSeed = 12345;
function seededRandom(): number {
  blazeSeed = (blazeSeed * 16807) % 2147483647;
  return (blazeSeed - 1) / 2147483646;
}

export function generateBlazes(): Blaze[] {
  blazeSeed = 12345; // Reset for consistent generation
  const blazes: Blaze[] = [];
  let id = 0;
  
  for (const seg of TRAIL_SEGMENTS) {
    const len = seg.endMile - seg.startMile;
    const count = Math.floor(len * seg.blazeFrequency);
    
    for (let i = 0; i < count; i++) {
      const mile = seg.startMile + (len * i / count);
      let type = BlazeType.SINGLE_WHITE;
      
      if (seededRandom() < 0.12) {
        const r = seededRandom();
        if (r < 0.4) type = BlazeType.DOUBLE_WHITE;
        else if (r < 0.6) type = BlazeType.DOUBLE_WHITE_LEFT;
        else if (r < 0.8) type = BlazeType.DOUBLE_WHITE_RIGHT;
        else type = BlazeType.BLUE;
      }
      
      blazes.push({
        id: `blaze_${id++}`,
        mile: Math.round(mile * 100) / 100,
        type,
        sideOfTrail: seededRandom() < 0.5 ? 'left' : 'right'
      });
    }
  }
  return blazes.sort((a, b) => a.mile - b.mile);
}

export const BLAZES: Blaze[] = generateBlazes();

export function getElevationAtMile(mile: number): number {
  if (mile <= 0) return ELEVATION_PROFILE[0].elevation;
  if (mile >= 30.7) return ELEVATION_PROFILE[ELEVATION_PROFILE.length - 1].elevation;
  
  for (let i = 0; i < ELEVATION_PROFILE.length - 1; i++) {
    const curr = ELEVATION_PROFILE[i];
    const next = ELEVATION_PROFILE[i + 1];
    if (mile >= curr.mile && mile <= next.mile) {
      const t = (mile - curr.mile) / (next.mile - curr.mile);
      return Math.round(curr.elevation + t * (next.elevation - curr.elevation));
    }
  }
  return 3000;
}

export function getSegmentAtMile(mile: number): TrailSegment | undefined {
  return TRAIL_SEGMENTS.find(s => mile >= s.startMile && mile < s.endMile);
}

export function getNearbyWater(mile: number, radius = 0.5): WaterSource[] {
  return WATER_SOURCES.filter(w => Math.abs(w.mile - mile) <= radius);
}

export function getNearbyShelters(mile: number, radius = 2): Shelter[] {
  return SHELTERS.filter(s => Math.abs(s.mile - mile) <= radius);
}

export function getNextBlaze(mile: number): Blaze | undefined {
  return BLAZES.find(b => b.mile > mile);
}

export function getPreviousBlaze(mile: number): Blaze | undefined {
  const prev = BLAZES.filter(b => b.mile < mile);
  return prev[prev.length - 1];
}

export interface PointOfInterest {
  id: string; name: string; mile: number;
  type: 'viewpoint' | 'landmark' | 'junction' | 'road_crossing';
  description: string;
}

export const POINTS_OF_INTEREST: PointOfInterest[] = [
  { id: 'poi_springer_summit', name: 'Springer Mountain Summit', mile: 0, type: 'landmark', description: 'Southern terminus of the AT. Bronze plaque marks the start.' },
  { id: 'poi_three_forks', name: 'Three Forks', mile: 2.8, type: 'junction', description: 'Junction with Benton MacKaye Trail. Multiple creek crossings.' },
  { id: 'poi_long_creek_falls', name: 'Long Creek Falls', mile: 4.0, type: 'viewpoint', description: 'Short side trail to scenic waterfall.' },
  { id: 'poi_woody_gap', name: 'Woody Gap (GA 60)', mile: 20.2, type: 'road_crossing', description: 'First paved road crossing. Sometimes trail magic.' },
  { id: 'poi_blood_mtn_summit', name: 'Blood Mountain Summit', mile: 29.5, type: 'viewpoint', description: 'Highest point on the AT in Georgia (4,458 ft). Spectacular views.' },
  { id: 'poi_walasi_yi', name: 'Walasi-Yi Center', mile: 30.7, type: 'landmark', description: 'The AT passes through the breezeway. Only building the AT passes through.' }
];
