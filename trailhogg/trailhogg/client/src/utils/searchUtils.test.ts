import { describe, it, expect } from 'vitest';
import { binarySearchStartIndex } from './searchUtils';

describe('binarySearchStartIndex', () => {
  const data = [
    { val: 10 },
    { val: 20 },
    { val: 30 },
    { val: 40 },
    { val: 50 }
  ];
  const getValue = (item: { val: number }) => item.val;

  it('should find exact match', () => {
    expect(binarySearchStartIndex(data, getValue, 30)).toBe(2);
  });

  it('should find next greater element if match not found', () => {
    expect(binarySearchStartIndex(data, getValue, 25)).toBe(2); // 30 is next
  });

  it('should return 0 if target is smaller than all elements', () => {
    expect(binarySearchStartIndex(data, getValue, 5)).toBe(0);
  });

  it('should return length if target is larger than all elements', () => {
    expect(binarySearchStartIndex(data, getValue, 60)).toBe(5);
  });

  it('should work with empty array', () => {
    expect(binarySearchStartIndex([], getValue, 10)).toBe(0);
  });

  it('should work with single element array (smaller)', () => {
    expect(binarySearchStartIndex([{ val: 10 }], getValue, 5)).toBe(0);
  });

  it('should work with single element array (larger)', () => {
    expect(binarySearchStartIndex([{ val: 10 }], getValue, 15)).toBe(1);
  });
});
