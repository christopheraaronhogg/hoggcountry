/**
 * Performs a binary search to find the index of the first element in a sorted array
 * where the selector returns a value greater than or equal to the target.
 *
 * @param array The sorted array to search
 * @param target The target value to search for
 * @param selector A function that extracts the numeric value to compare from an item
 * @returns The index of the first matching element, or array.length if all elements are smaller
 */
export function binarySearchStartIndex<T>(
  array: T[],
  target: number,
  selector: (item: T) => number
): number {
  let low = 0;
  let high = array.length;

  while (low < high) {
    const mid = Math.floor((low + high) / 2);
    if (selector(array[mid]) < target) {
      low = mid + 1;
    } else {
      high = mid;
    }
  }
  return low;
}
