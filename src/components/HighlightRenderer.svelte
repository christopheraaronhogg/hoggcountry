<script>
  import { onMount } from 'svelte';
  import {
    matchHighlight,
    wrapRangeInMark,
    createRangeForMatch,
    unwrapHighlight,
  } from '../lib/annotations';

  let {
    highlights = [],
    chapterEl = null,
    onHighlightClick = (highlightId) => {},
    onFallbackNotes = (notes) => {},
    onOrphans = (orphans) => {},
  } = $props();

  let appliedHighlightIds = $state(new Set());

  // Re-render highlights when the list changes or chapter changes
  $effect(() => {
    if (!chapterEl) return;

    // Cleanup FIRST - must run even when highlights array is empty (e.g., after deleting last highlight)
    const currentIds = new Set(highlights.map((h) => h.id));
    for (const id of appliedHighlightIds) {
      if (!currentIds.has(id)) {
        unwrapHighlight(id);
        appliedHighlightIds.delete(id);
      }
    }

    // Exit early if no highlights to apply
    if (!highlights.length) return;

    // Apply new highlights
    const fallbackNotes = [];
    const orphans = [];

    for (const highlight of highlights) {
      // If already applied, check for updates (e.g. color change)
      if (appliedHighlightIds.has(highlight.id)) {
        const mark = chapterEl.querySelector(
          `mark[data-highlight-id="${highlight.id}"]`
        );
        if (mark) {
          const expectedClass = `guide-highlight guide-highlight--${highlight.color}`;
          if (mark.className !== expectedClass) {
            mark.className = expectedClass;
          }
        }
        continue;
      }

      const result = matchHighlight(highlight, chapterEl);

      if (result.type === 'exact' || result.type === 'fuzzy') {
        // Apply the highlight mark
        const range = createRangeForMatch(
          result.node,
          result.startOffset,
          highlight.textSnippet.length
        );
        const mark = wrapRangeInMark(range, highlight.id, highlight.color);

        // Add click handler
        mark.addEventListener('click', (e) => {
          e.stopPropagation();
          // Pass ID so parent can look up latest state (avoids stale closures)
          onHighlightClick(highlight.id);
        });

        appliedHighlightIds.add(highlight.id);
      } else if (result.type === 'heading-fallback') {
        fallbackNotes.push({ highlight, headingEl: result.headingEl });
      } else if (result.type === 'orphan') {
        orphans.push(highlight);
      }
    }

    // Notify parent about fallbacks and orphans
    if (fallbackNotes.length > 0) {
      onFallbackNotes(fallbackNotes);
    }
    if (orphans.length > 0) {
      onOrphans(orphans);
    }
  });

  onMount(() => {
    // Cleanup on unmount
    return () => {
      for (const id of appliedHighlightIds) {
        unwrapHighlight(id);
      }
    };
  });
</script>

<!-- This component has no visible UI - it only manipulates the DOM -->