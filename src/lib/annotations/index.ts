/**
 * Guide Annotations Module
 *
 * Kindle-style text highlighting with two-level fallback:
 * 1. Fuzzy match highlighted text
 * 2. Fall back to heading level
 * 3. Show as orphan if both fail
 */

export * from './types';
export * from './store';
export { matchHighlight, stringSimilarity } from './textMatch';
export {
  getTextNodes,
  findNearestHeading,
  findHeadingById,
  fuzzyFindHeading,
  wrapRangeInMark,
  createRangeForMatch,
  unwrapHighlight,
  getSelectionContext,
  getChapterIdFromSelection,
} from './domHelpers';
