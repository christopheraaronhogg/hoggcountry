<script>
  import { onMount } from 'svelte';
  import SelectionPopover from './SelectionPopover.svelte';
  import HighlightRenderer from './HighlightRenderer.svelte';
  import HighlightPopover from './HighlightPopover.svelte';
  import FallbackNotes from './FallbackNotes.svelte';
  import OrphanBanner from './OrphanBanner.svelte';
  import {
    getAllHighlights,
    getHighlightsForChapter,
    saveHighlight,
    updateHighlight,
    deleteHighlight,
    getSelectionContext,
    getChapterIdFromSelection,
    findNearestHeading,
  } from '../lib/annotations';

  let highlights = $state([]);
  let activeHighlight = $state(null);
  let fallbackNotes = $state([]);
  let orphans = $state([]);
  let chapterElements = $state(new Map());

  // Load all highlights on mount
  onMount(async () => {
    try {
      highlights = await getAllHighlights();
    } catch (err) {
      console.error('Failed to load highlights:', err);
    }

    // Set up chapter element references
    const chapters = document.querySelectorAll('.chapter-section');
    chapters.forEach((el) => {
      chapterElements.set(el.id, el);
    });
  });

  // Handle creating a new highlight
  async function handleCreateHighlight(color, noteText) {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed) return;

    const text = selection.toString().trim();
    if (text.length < 3) return;

    const chapterId = getChapterIdFromSelection(selection);
    if (!chapterId) return;

    const context = getSelectionContext(selection);
    const range = selection.getRangeAt(0);
    const heading = findNearestHeading(range);

    const highlight = {
      id: crypto.randomUUID(),
      chapterId,
      textSnippet: text,
      textContext: context,
      headingSlug: heading?.id || '',
      headingText: heading?.textContent?.trim() || '',
      color,
      noteText,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    try {
      await saveHighlight(highlight);
      highlights = [...highlights, highlight];
    } catch (err) {
      console.error('Failed to save highlight:', err);
    }
  }

  // Handle clicking an existing highlight
  function handleHighlightClick(highlight) {
    activeHighlight = highlight;
  }

  // Handle color change
  async function handleUpdateColor(color) {
    if (!activeHighlight) return;

    try {
      await updateHighlight(activeHighlight.id, { color });
      highlights = highlights.map((h) =>
        h.id === activeHighlight.id ? { ...h, color } : h
      );
      activeHighlight = { ...activeHighlight, color };
    } catch (err) {
      console.error('Failed to update highlight color:', err);
    }
  }

  // Handle note update
  async function handleUpdateNote(noteText) {
    if (!activeHighlight) return;

    try {
      await updateHighlight(activeHighlight.id, { noteText });
      highlights = highlights.map((h) =>
        h.id === activeHighlight.id ? { ...h, noteText } : h
      );
      activeHighlight = { ...activeHighlight, noteText };
    } catch (err) {
      console.error('Failed to update note:', err);
    }
  }

  // Handle delete
  async function handleDelete() {
    if (!activeHighlight) return;

    try {
      await deleteHighlight(activeHighlight.id);
      highlights = highlights.filter((h) => h.id !== activeHighlight.id);
      activeHighlight = null;
    } catch (err) {
      console.error('Failed to delete highlight:', err);
    }
  }

  // Handle delete from orphan banner
  async function handleDeleteOrphan(id) {
    try {
      await deleteHighlight(id);
      highlights = highlights.filter((h) => h.id !== id);
      orphans = orphans.filter((o) => o.id !== id);
    } catch (err) {
      console.error('Failed to delete orphan:', err);
    }
  }

  // Handle delete all orphans
  async function handleDeleteAllOrphans() {
    try {
      for (const orphan of orphans) {
        await deleteHighlight(orphan.id);
      }
      highlights = highlights.filter((h) => !orphans.some((o) => o.id === h.id));
      orphans = [];
    } catch (err) {
      console.error('Failed to delete orphans:', err);
    }
  }

  // Handle fallback note delete
  async function handleDeleteFallback(id) {
    try {
      await deleteHighlight(id);
      highlights = highlights.filter((h) => h.id !== id);
      fallbackNotes = fallbackNotes.filter((f) => f.highlight.id !== id);
    } catch (err) {
      console.error('Failed to delete fallback note:', err);
    }
  }

  // Handle dismiss fallback (just hide it, don't delete)
  function handleDismissFallback(id) {
    fallbackNotes = fallbackNotes.filter((f) => f.highlight.id !== id);
  }

  // Handle fallback notes from renderer
  function handleFallbackNotes(notes) {
    // Merge with existing, avoiding duplicates
    const existingIds = new Set(fallbackNotes.map((f) => f.highlight.id));
    const newNotes = notes.filter((n) => !existingIds.has(n.highlight.id));
    if (newNotes.length > 0) {
      fallbackNotes = [...fallbackNotes, ...newNotes];
    }
  }

  // Handle orphans from renderer
  function handleOrphans(newOrphans) {
    // Merge with existing, avoiding duplicates
    const existingIds = new Set(orphans.map((o) => o.id));
    const toAdd = newOrphans.filter((o) => !existingIds.has(o.id));
    if (toAdd.length > 0) {
      orphans = [...orphans, ...toAdd];
    }
  }
</script>

<!-- Selection popover for creating new highlights -->
<SelectionPopover onHighlight={handleCreateHighlight} />

<!-- Render highlights for each chapter -->
{#each [...chapterElements] as [chapterId, chapterEl]}
  {@const chapterHighlights = highlights.filter((h) => h.chapterId === chapterId)}
  <HighlightRenderer
    highlights={chapterHighlights}
    {chapterEl}
    onHighlightClick={handleHighlightClick}
    onFallbackNotes={handleFallbackNotes}
    onOrphans={handleOrphans}
  />
{/each}

<!-- Popover for editing active highlight -->
<HighlightPopover
  highlight={activeHighlight}
  onClose={() => activeHighlight = null}
  onUpdateColor={handleUpdateColor}
  onUpdateNote={handleUpdateNote}
  onDelete={handleDelete}
/>

<!-- Fallback notes (shown at heading level) -->
<FallbackNotes
  {fallbackNotes}
  onDelete={handleDeleteFallback}
  onDismiss={handleDismissFallback}
/>

<!-- Orphan banner -->
<OrphanBanner
  {orphans}
  onDelete={handleDeleteOrphan}
  onDeleteAll={handleDeleteAllOrphans}
/>
