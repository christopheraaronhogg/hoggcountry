
/**
 * Performs a binary search to find the index of the first element in a sorted array
 * that has a value greater than or equal to the search value.
 *
 * @param array The sorted array to search.
 * @param searchValue The value to search for.
 * @param keySelector A function to extract the numeric key from an array item.
 * @returns The index of the first matching or next larger element, or array.length if all are smaller.
 */
export function binarySearchStartIndex<T>(
  array: T[],
  searchValue: number,
  keySelector: (item: T) => number
): number {
  let low = 0;
  let high = array.length - 1;
  let result = array.length;

  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    const midVal = keySelector(array[mid]);

    if (midVal >= searchValue) {
      result = mid;
      high = mid - 1;
    } else {
      low = mid + 1;
    }
  }

  return result;
}
