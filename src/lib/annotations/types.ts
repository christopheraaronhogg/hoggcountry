/**
 * Highlight annotation for the AT Field Guide
 *
 * Stores both text snippet AND heading context so we can:
 * 1. Try exact/fuzzy text match first
 * 2. Fall back to heading level if text changes
 * 3. Show as orphan if both fail
 */
export interface Highlight {
  id: string; // UUID
  chapterId: string; // e.g., "06-gear-system" (stable across rebuilds)

  // Text anchor (primary)
  textSnippet: string; // The actual highlighted text
  textContext: {
    before: string; // ~50 chars before for disambiguation
    after: string; // ~50 chars after for disambiguation
  };

  // Heading anchor (fallback)
  headingSlug: string; // e.g., "base-weight-philosophy"
  headingText: string; // e.g., "Base Weight Philosophy" (for fuzzy match)

  // User data
  color: HighlightColor;
  noteText?: string; // Optional attached note

  // Metadata
  createdAt: number; // timestamp
  updatedAt: number; // timestamp
}

export type HighlightColor = 'yellow' | 'blue' | 'green' | 'pink';

export const HIGHLIGHT_COLORS: HighlightColor[] = [
  'yellow',
  'blue',
  'green',
  'pink',
];

/**
 * Result of attempting to match a highlight to current content
 */
export type MatchResult =
  | { type: 'exact'; node: Text; startOffset: number }
  | { type: 'fuzzy'; node: Text; startOffset: number; similarity: number }
  | { type: 'heading-fallback'; headingEl: HTMLElement }
  | { type: 'orphan' };

/**
 * A highlight that has been matched and is ready to render
 */
export interface MatchedHighlight {
  highlight: Highlight;
  result: MatchResult;
}
