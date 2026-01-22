/**
 * DOM utilities for highlight rendering
 *
 * Handles text node traversal, range creation, and heading lookups
 */
import type { Highlight, HighlightColor } from './types';
import { stringSimilarity } from './textMatch';

/**
 * Get all text nodes within an element
 */
export function getTextNodes(element: HTMLElement): Text[] {
  const textNodes: Text[] = [];
  const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT, null);

  let node: Node | null;
  while ((node = walker.nextNode())) {
    // Skip empty text nodes and nodes inside <mark> elements (already highlighted)
    if (node.textContent?.trim() && !isInsideHighlight(node)) {
      textNodes.push(node as Text);
    }
  }

  return textNodes;
}

/**
 * Check if a node is inside an existing highlight mark
 */
function isInsideHighlight(node: Node): boolean {
  let parent = node.parentElement;
  while (parent) {
    if (
      parent.tagName === 'MARK' &&
      parent.classList.contains('guide-highlight')
    ) {
      return true;
    }
    parent = parent.parentElement;
  }
  return false;
}

/**
 * Find the nearest heading element above a given range
 */
export function findNearestHeading(range: Range): HTMLElement | null {
  let node: Node | null = range.startContainer;

  // Walk up the tree to find the chapter prose container
  while (node && !(node instanceof HTMLElement && node.classList.contains('chapter-prose'))) {
    node = node.parentNode;
  }

  if (!node) return null;

  const chapterProse = node as HTMLElement;

  // Get all headings in order
  const headings = Array.from(
    chapterProse.querySelectorAll<HTMLElement>('h1, h2, h3, h4')
  );

  // Find the last heading that appears before our range
  let nearestHeading: HTMLElement | null = null;

  for (const heading of headings) {
    const headingRange = document.createRange();
    headingRange.selectNode(heading);

    // If heading is before our selection, it's a candidate
    if (headingRange.compareBoundaryPoints(Range.START_TO_START, range) <= 0) {
      nearestHeading = heading;
    } else {
      break;
    }
  }

  return nearestHeading;
}

/**
 * Find a heading by its ID
 */
export function findHeadingById(
  container: HTMLElement,
  headingSlug: string
): HTMLElement | null {
  return container.querySelector<HTMLElement>(`#${CSS.escape(headingSlug)}`);
}

/**
 * Fuzzy find a heading by its text content
 */
export function fuzzyFindHeading(
  container: HTMLElement,
  headingText: string
): HTMLElement | null {
  const headings = Array.from(
    container.querySelectorAll<HTMLElement>('h1, h2, h3, h4')
  );

  let bestMatch: HTMLElement | null = null;
  let bestScore = 0;

  for (const heading of headings) {
    const text = heading.textContent?.trim() || '';
    const similarity = stringSimilarity(
      text.toLowerCase(),
      headingText.toLowerCase()
    );

    if (similarity > bestScore && similarity >= 0.6) {
      bestScore = similarity;
      bestMatch = heading;
    }
  }

  return bestMatch;
}

/**
 * Wrap a text range in a <mark> element
 */
export function wrapRangeInMark(
  range: Range,
  highlightId: string,
  color: HighlightColor
): HTMLElement {
  const mark = document.createElement('mark');
  mark.className = `guide-highlight guide-highlight--${color}`;
  mark.dataset.highlightId = highlightId;

  try {
    range.surroundContents(mark);
  } catch {
    // If surroundContents fails (e.g., crossing element boundaries),
    // fall back to extractContents + appendChild
    const contents = range.extractContents();
    mark.appendChild(contents);
    range.insertNode(mark);
  }

  return mark;
}

/**
 * Create a range for a text match
 */
export function createRangeForMatch(
  node: Text,
  startOffset: number,
  length: number
): Range {
  const range = document.createRange();
  range.setStart(node, startOffset);
  range.setEnd(node, Math.min(startOffset + length, node.length));
  return range;
}

/**
 * Remove a highlight mark, preserving its text content
 */
export function unwrapHighlight(highlightId: string): void {
  const mark = document.querySelector(
    `mark[data-highlight-id="${highlightId}"]`
  );
  if (!mark) return;

  const parent = mark.parentNode;
  if (!parent) return;

  // Move all children out of the mark
  while (mark.firstChild) {
    parent.insertBefore(mark.firstChild, mark);
  }

  // Remove the empty mark
  parent.removeChild(mark);

  // Normalize to merge adjacent text nodes
  parent.normalize();
}

/**
 * Get context around a selection (chars before and after)
 */
export function getSelectionContext(
  selection: Selection,
  contextLength: number = 50
): { before: string; after: string } {
  const range = selection.getRangeAt(0);
  const container = range.commonAncestorContainer;

  // Find the chapter prose container
  let proseEl: HTMLElement | null = null;
  let node: Node | null = container;
  while (node) {
    if (node instanceof HTMLElement && node.classList.contains('chapter-prose')) {
      proseEl = node;
      break;
    }
    node = node.parentNode;
  }

  if (!proseEl) {
    return { before: '', after: '' };
  }

  // Get full text of prose
  const fullText = proseEl.textContent || '';
  const selectedText = selection.toString();
  const selectionStart = fullText.indexOf(selectedText);

  if (selectionStart === -1) {
    return { before: '', after: '' };
  }

  return {
    before: fullText.slice(Math.max(0, selectionStart - contextLength), selectionStart),
    after: fullText.slice(
      selectionStart + selectedText.length,
      selectionStart + selectedText.length + contextLength
    ),
  };
}

/**
 * Get the chapter ID from a selection
 */
export function getChapterIdFromSelection(selection: Selection): string | null {
  const range = selection.getRangeAt(0);
  let node: Node | null = range.commonAncestorContainer;

  while (node) {
    if (node instanceof HTMLElement && node.classList.contains('chapter-section')) {
      return node.id;
    }
    node = node.parentNode;
  }

  return null;
}
