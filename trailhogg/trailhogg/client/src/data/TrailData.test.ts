import { describe, it, expect } from 'vitest';
import {
  getElevationAtMile,
  getNearestLandmark,
  getNextShelter,
  getNearestAMCHut,
  getNearestWaterSource,
  getNextTown,
  getNextPeak,
  getNextRoadCrossing,
  getNextDangerousCrossing,
  getTerrainZone
} from './TrailData';

describe('TrailData Correctness', () => {
  it('getElevationAtMile returns reasonable values', () => {
    // Springer Mountain
    expect(getElevationAtMile(0.2)).toBeCloseTo(3730, -1);
    // Katahdin
    expect(getElevationAtMile(2197)).toBeGreaterThan(3000);
    // Low point
    expect(getElevationAtMile(1464)).toBeLessThan(1000); // Ten Mile River Lean-to
  });

  it('getNearestLandmark finds correct landmark', () => {
    // Near Springer
    const l1 = getNearestLandmark(0.1);
    expect(l1?.name).toContain('Springer');

    // Near McAfee Knob (710.6)
    const l2 = getNearestLandmark(710.5);
    expect(l2?.name).toContain('McAfee');
  });

  it('getNextShelter finds the next shelter', () => {
    // Before first shelter (0.2)
    const s1 = getNextShelter(0);
    expect(s1?.name).toBe('Springer Mountain Shelter');

    // After first shelter (0.2) but before second (2.8)
    const s2 = getNextShelter(1.0);
    expect(s2?.name).toBe('Stover Creek Shelter');
  });

  it('getNearestAMCHut finds correct hut', () => {
    // Near Lakes of the Clouds (1865.1)
    const h1 = getNearestAMCHut(1865.0);
    expect(h1?.name).toContain('Lakes of the Clouds');
  });

  it('getNearestWaterSource finds correct source', () => {
    // Near Springer Spring (0.2)
    const w1 = getNearestWaterSource(0.25);
    expect(w1?.name).toContain('Springer');
  });

  it('getNextTown finds next town', () => {
    // Before Neels Gap (30.7)
    const t1 = getNextTown(20);
    expect(t1?.name).toBe('Neels Gap');
  });

  it('getNextPeak finds next peak', () => {
    // Before Blood Mountain (28)
    const p1 = getNextPeak(20);
    expect(p1?.name).toBe('Blood Mountain');
  });

  it('getNextRoadCrossing finds next crossing', () => {
    // Before Woody Gap (15.9)
    const r1 = getNextRoadCrossing(10);
    expect(r1?.name).toBe('Woody Gap');
  });

  it('getNextDangerousCrossing finds next hazard', () => {
    // Before Blood Mountain Descent (28.9)
    const d1 = getNextDangerousCrossing(25);
    expect(d1?.name).toBe('Blood Mountain Descent');
  });

  it('getTerrainZone finds correct zone', () => {
    // Start
    const z1 = getTerrainZone(10);
    expect(z1?.zoneId).toBe('zone_01_ga_south');

    // Smokies (166-241)
    const z2 = getTerrainZone(200);
    expect(z2?.type).toBe('smokies');
  });
});
