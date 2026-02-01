import { describe, it, expect } from 'vitest';
import {
  getElevationAtMile,
  getNextShelter,
  SHELTERS,
  getNextTown,
  TOWNS,
  binarySearchNearest,
  binarySearchNext
} from './TrailData';

describe('TrailData', () => {
  describe('binarySearchNearest', () => {
    const arr = [
      { val: 10 },
      { val: 20 },
      { val: 30 },
      { val: 40 },
      { val: 50 }
    ];
    const getValue = (i: any) => i.val;

    it('finds exact match', () => {
      expect(binarySearchNearest(arr, 30, getValue)).toEqual({ val: 30 });
    });

    it('finds nearest lower', () => {
      expect(binarySearchNearest(arr, 24, getValue)).toEqual({ val: 20 });
    });

    it('finds nearest higher', () => {
      expect(binarySearchNearest(arr, 26, getValue)).toEqual({ val: 30 });
    });

    it('finds nearest at start', () => {
      expect(binarySearchNearest(arr, 5, getValue)).toEqual({ val: 10 });
    });

    it('finds nearest at end', () => {
      expect(binarySearchNearest(arr, 100, getValue)).toEqual({ val: 50 });
    });
  });

  describe('binarySearchNext', () => {
    const arr = [
        { val: 10 },
        { val: 20 },
        { val: 30 },
    ];
    const getValue = (i: any) => i.val;

    it('finds next element', () => {
        expect(binarySearchNext(arr, 15, getValue)).toEqual({ val: 20 });
    });

    it('finds next element when target is exact match', () => {
        expect(binarySearchNext(arr, 10, getValue)).toEqual({ val: 20 });
    });

    it('returns undefined if no next element', () => {
        expect(binarySearchNext(arr, 35, getValue)).toBeUndefined();
    });
  });

  describe('getElevationAtMile', () => {
    it('should return correct elevation near a shelter', () => {
      const shelter = SHELTERS[0]; // Springer Mountain Shelter (0.2)
      const elevation = getElevationAtMile(shelter.mile);
      expect(elevation).toBe(shelter.elevation);
    });

    it('should return correct elevation near another shelter', () => {
        const shelter = SHELTERS[10];
        const elevation = getElevationAtMile(shelter.mile);
        expect(elevation).toBe(shelter.elevation);
    });

    it('should return interpolated elevation away from shelters', () => {
        const mile = 100;
        const elevation = getElevationAtMile(mile);
        expect(typeof elevation).toBe('number');
        expect(elevation).toBeGreaterThan(0);
    });
  });

  describe('getNextShelter', () => {
    it('should return the next shelter from 0', () => {
      const mile = 0;
      const next = getNextShelter(mile);
      expect(next).toBeDefined();
      expect(next?.mile).toBeGreaterThan(mile);
      expect(next?.name).toBe('Springer Mountain Shelter'); // Mile 0.2
    });

    it('should return the next shelter from 50', () => {
      const mile = 50;
      // Next after 50 is Blue Mountain Shelter at 50.3
      const next = getNextShelter(mile);
      expect(next).toBeDefined();
      expect(next?.mile).toBeGreaterThan(mile);
      expect(next?.name).toBe('Blue Mountain Shelter');
    });
  });

  describe('getNextTown', () => {
      it('should return the next town', () => {
          const mile = 0;
          const next = getNextTown(mile);
          expect(next).toBeDefined();
          expect(next?.mile).toBeGreaterThan(mile);
          expect(next?.name).toBe('Neels Gap'); // 30.7
      });
  });
});
