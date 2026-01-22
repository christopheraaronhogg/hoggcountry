/**
 * Text matching utilities for highlight anchoring
 *
 * Implements the matching cascade:
 * 1. Exact text match
 * 2. Fuzzy text match with context
 * 3. Heading fallback
 * 4. Orphan
 */
import type { Highlight, MatchResult } from './types';
import { getTextNodes, findHeadingById, fuzzyFindHeading } from './domHelpers';

const FUZZY_THRESHOLD = 0.7;
const CONTEXT_WEIGHT = 0.3; // How much context matching affects score

/**
 * Calculate Levenshtein distance between two strings
 * Used for fuzzy matching
 */
function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = [];

  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1, // insertion
          matrix[i - 1][j] + 1 // deletion
        );
      }
    }
  }

  return matrix[b.length][a.length];
}

/**
 * Calculate similarity between two strings (0-1)
 */
export function stringSimilarity(a: string, b: string): number {
  if (a === b) return 1;
  if (a.length === 0 || b.length === 0) return 0;

  const distance = levenshteinDistance(a, b);
  const maxLength = Math.max(a.length, b.length);
  return 1 - distance / maxLength;
}

/**
 * Check if context matches around a candidate position
 */
function contextMatches(
  fullText: string,
  position: number,
  snippetLength: number,
  expectedBefore: string,
  expectedAfter: string
): number {
  const actualBefore = fullText.slice(
    Math.max(0, position - expectedBefore.length),
    position
  );
  const actualAfter = fullText.slice(
    position + snippetLength,
    position + snippetLength + expectedAfter.length
  );

  const beforeSim = stringSimilarity(
    actualBefore.toLowerCase(),
    expectedBefore.toLowerCase()
  );
  const afterSim = stringSimilarity(
    actualAfter.toLowerCase(),
    expectedAfter.toLowerCase()
  );

  return (beforeSim + afterSim) / 2;
}

interface TextMatch {
  node: Text;
  startOffset: number;
  similarity: number;
  contextScore: number;
}

/**
 * Find all potential matches for a text snippet in the DOM
 */
function findTextMatches(
  container: HTMLElement,
  snippet: string,
  context: { before: string; after: string }
): TextMatch[] {
  const matches: TextMatch[] = [];
  const textNodes = getTextNodes(container);
  const snippetLower = snippet.toLowerCase();

  // Build full text from all nodes for context matching
  let fullText = '';
  const nodeOffsets: { node: Text; start: number }[] = [];

  for (const node of textNodes) {
    nodeOffsets.push({ node, start: fullText.length });
    fullText += node.textContent || '';
  }

  // Search for exact matches first
  let searchStart = 0;
  while (true) {
    const idx = fullText.toLowerCase().indexOf(snippetLower, searchStart);
    if (idx === -1) break;

    // Find which node contains this position
    let nodeInfo = nodeOffsets[0];
    for (const info of nodeOffsets) {
      if (info.start <= idx) {
        nodeInfo = info;
      } else {
        break;
      }
    }

    const localOffset = idx - nodeInfo.start;
    const actualText = fullText.slice(idx, idx + snippet.length);
    const similarity = stringSimilarity(snippet, actualText);
    const contextScore = contextMatches(
      fullText,
      idx,
      snippet.length,
      context.before,
      context.after
    );

    matches.push({
      node: nodeInfo.node,
      startOffset: localOffset,
      similarity,
      contextScore,
    });

    searchStart = idx + 1;
  }

  // Sort by combined score (similarity + context)
  matches.sort((a, b) => {
    const scoreA = a.similarity * (1 - CONTEXT_WEIGHT) + a.contextScore * CONTEXT_WEIGHT;
    const scoreB = b.similarity * (1 - CONTEXT_WEIGHT) + b.contextScore * CONTEXT_WEIGHT;
    return scoreB - scoreA;
  });

  return matches;
}

/**
 * Try to find a fuzzy match for the snippet
 * Searches for similar strings if exact match isn't found
 */
function findFuzzyTextMatch(
  container: HTMLElement,
  snippet: string,
  context: { before: string; after: string }
): TextMatch | null {
  const textNodes = getTextNodes(container);

  // Build full text
  let fullText = '';
  const nodeOffsets: { node: Text; start: number }[] = [];

  for (const node of textNodes) {
    nodeOffsets.push({ node, start: fullText.length });
    fullText += node.textContent || '';
  }

  // Sliding window search for fuzzy matches
  const windowSize = snippet.length;
  let bestMatch: TextMatch | null = null;
  let bestScore = 0;

  // Use larger steps for performance, then refine
  const step = Math.max(1, Math.floor(windowSize / 4));

  for (let i = 0; i <= fullText.length - windowSize; i += step) {
    const candidate = fullText.slice(i, i + windowSize);
    const similarity = stringSimilarity(snippet, candidate);

    if (similarity >= FUZZY_THRESHOLD) {
      const contextScore = contextMatches(
        fullText,
        i,
        windowSize,
        context.before,
        context.after
      );

      const combinedScore =
        similarity * (1 - CONTEXT_WEIGHT) + contextScore * CONTEXT_WEIGHT;

      if (combinedScore > bestScore) {
        // Find the node
        let nodeInfo = nodeOffsets[0];
        for (const info of nodeOffsets) {
          if (info.start <= i) {
            nodeInfo = info;
          } else {
            break;
          }
        }

        bestScore = combinedScore;
        bestMatch = {
          node: nodeInfo.node,
          startOffset: i - nodeInfo.start,
          similarity,
          contextScore,
        };
      }
    }
  }

  return bestMatch;
}

/**
 * Main matching function - implements the full cascade
 */
export function matchHighlight(
  highlight: Highlight,
  chapterEl: HTMLElement
): MatchResult {
  // 1. Try exact text match
  const exactMatches = findTextMatches(chapterEl, highlight.textSnippet, highlight.textContext);

  if (exactMatches.length > 0) {
    const best = exactMatches[0];
    if (best.similarity === 1) {
      return { type: 'exact', node: best.node, startOffset: best.startOffset };
    }
    // High similarity exact match
    if (best.similarity >= FUZZY_THRESHOLD) {
      return {
        type: 'fuzzy',
        node: best.node,
        startOffset: best.startOffset,
        similarity: best.similarity,
      };
    }
  }

  // 2. Try fuzzy text match
  const fuzzyMatch = findFuzzyTextMatch(
    chapterEl,
    highlight.textSnippet,
    highlight.textContext
  );

  if (fuzzyMatch && fuzzyMatch.similarity >= FUZZY_THRESHOLD) {
    return {
      type: 'fuzzy',
      node: fuzzyMatch.node,
      startOffset: fuzzyMatch.startOffset,
      similarity: fuzzyMatch.similarity,
    };
  }

  // 3. Try heading fallback
  let headingEl = findHeadingById(chapterEl, highlight.headingSlug);

  if (!headingEl) {
    // Try fuzzy heading match
    headingEl = fuzzyFindHeading(chapterEl, highlight.headingText);
  }

  if (headingEl) {
    return { type: 'heading-fallback', headingEl };
  }

  // 4. Orphan - nothing matched
  return { type: 'orphan' };
}
