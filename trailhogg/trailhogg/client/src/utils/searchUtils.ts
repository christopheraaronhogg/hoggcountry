/**
 * Performs a binary search on a sorted array to find the index of the first element
 * where getValue(item) >= target.
 *
 * If all elements are smaller than the target, returns array.length.
 * If all elements are larger than the target, returns 0.
 *
 * @param data The sorted array to search
 * @param getValue A function that extracts the numeric value to compare from an item
 * @param target The target value to search for
 * @returns The index of the first matching or greater element
 */
export function binarySearchStartIndex<T>(
  data: T[],
  getValue: (item: T) => number,
  target: number
): number {
  let low = 0;
  let high = data.length;

  while (low < high) {
    const mid = (low + high) >>> 1;
    if (getValue(data[mid]) < target) {
      low = mid + 1;
    } else {
      high = mid;
    }
  }
  return low;
}
