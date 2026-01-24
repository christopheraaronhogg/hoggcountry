import { describe, it, expect } from 'vitest';
import { binarySearchStartIndex } from './searchUtils';

describe('binarySearchStartIndex', () => {
  const items = [
    { val: 10 },
    { val: 20 },
    { val: 30 },
    { val: 40 },
    { val: 50 },
  ];
  const selector = (item: { val: number }) => item.val;

  it('should find exact match', () => {
    expect(binarySearchStartIndex(items, 30, selector)).toBe(2);
  });

  it('should find index where item would be inserted (between items)', () => {
    expect(binarySearchStartIndex(items, 25, selector)).toBe(2); // Should point to 30
  });

  it('should return 0 if target is smaller than all items', () => {
    expect(binarySearchStartIndex(items, 5, selector)).toBe(0);
  });

  it('should return length if target is larger than all items', () => {
    expect(binarySearchStartIndex(items, 60, selector)).toBe(5);
  });

  it('should handle empty array', () => {
    expect(binarySearchStartIndex([], 10, (x: any) => x)).toBe(0);
  });

  it('should handle single item array (smaller)', () => {
    expect(binarySearchStartIndex([{ val: 10 }], 5, selector)).toBe(0);
  });

  it('should handle single item array (larger)', () => {
    expect(binarySearchStartIndex([{ val: 10 }], 15, selector)).toBe(1);
  });

  it('should handle duplicates (return first occurrence)', () => {
      const dups = [{val: 10}, {val: 20}, {val: 20}, {val: 30}];
      expect(binarySearchStartIndex(dups, 20, selector)).toBe(1);
  });
});
