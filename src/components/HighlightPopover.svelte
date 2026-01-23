<script>
  import { onMount } from 'svelte';
  import { HIGHLIGHT_COLORS } from '../lib/annotations/types';

  let {
    highlight = null,
    onClose = () => {},
    onUpdateColor = (color) => {},
    onUpdateNote = (noteText) => {},
    onDelete = () => {},
  } = $props();

  let noteText = $state('');
  let position = $state({ x: 0, y: 0 });
  let noteInputRef = $state(null);
  
  // Track the ID we are currently editing to detect switches
  let activeId = $state(null);
  let savedNoteText = $state('');

  // Handle highlight changes (switch, open, close)
  $effect(() => {
    const newId = highlight?.id;

    // If we were editing a highlight and the ID changed (or closed), save if dirty
    if (activeId && activeId !== newId) {
      if (noteText !== savedNoteText) {
        // Call with (id, text) signature
        onUpdateNote(activeId, noteText.trim() || undefined);
      }
    }

    // If opening a new highlight (or switching)
    if (newId && newId !== activeId) {
      activeId = newId;
      noteText = highlight.noteText || '';
      savedNoteText = noteText;
      positionPopover();
    } 
    // If closing
    else if (!newId) {
      activeId = null;
    }
    // If ID is same (e.g. clicking same mark), do NOT reset noteText
    // This preserves unsaved edits if the user clicks the mark again
  });

  function positionPopover() {
    if (!highlight) return;

    // Find the highlight mark element
    const mark = document.querySelector(
      `mark[data-highlight-id="${highlight.id}"]`
    );
    if (!mark) return;

    const rect = mark.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const popoverWidth = 300; // approximate width
    const padding = 16;

    let x = rect.left + rect.width / 2;
    // Clamp position to keep popover in viewport
    x = Math.max(popoverWidth / 2 + padding, Math.min(x, viewportWidth - popoverWidth / 2 - padding));

    position = {
      x,
      y: rect.bottom + 10,
    };
  }

  function handleColorChange(color) {
    onUpdateColor(color);
  }

  function handleSaveNote() {
    if (highlight) {
      onUpdateNote(highlight.id, noteText.trim() || undefined);
      // Update saved reference so we don't double-save on close
      savedNoteText = noteText;
    }
  }

  function handleKeydown(e) {
    if (e.key === 'Escape') {
      onClose();
    }
    if (e.key === 'Enter' && e.ctrlKey) {
      handleSaveNote();
    }
  }

  function handleClickOutside(e) {
    if (!e.target.closest('.highlight-popover')) {
      handleSaveNote();
      onClose();
    }
  }

  onMount(() => {
    document.addEventListener('keydown', handleKeydown);
    document.addEventListener('click', handleClickOutside);
    // Focus the note input if there's already a note
    if (highlight?.noteText) {
      setTimeout(() => noteInputRef?.focus(), 10);
    }
    return () => {
      document.removeEventListener('keydown', handleKeydown);
      document.removeEventListener('click', handleClickOutside);
    };
  });
</script>

{#if highlight}
  <div
    class="highlight-popover"
    style="left: {position.x}px; top: {position.y}px;"
    onclick={(e) => e.stopPropagation()}
  >
    <div class="popover-arrow-up"></div>
    <div class="popover-content">
      <!-- Color picker row -->
      <div class="color-row">
        {#each HIGHLIGHT_COLORS as color}
          <button
            class="color-btn color-btn--{color}"
            class:active={highlight.color === color}
            onclick={() => handleColorChange(color)}
            aria-label="Change to {color}"
          >
            {#if highlight.color === color}
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            {/if}
          </button>
        {/each}
        <button
          class="delete-btn"
          onclick={onDelete}
          aria-label="Delete highlight"
          title="Delete highlight"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="3 6 5 6 21 6"/>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
          </svg>
        </button>
      </div>

      <!-- Note section -->
      <div class="note-section">
        <textarea
          bind:this={noteInputRef}
          bind:value={noteText}
          class="note-input"
          placeholder="Add a note..."
          rows="3"
        ></textarea>
        <div class="note-actions">
          <span class="note-hint">Ctrl+Enter to save</span>
          <button class="save-btn" onclick={handleSaveNote}>Save</button>
        </div>
      </div>

      <!-- Snippet preview -->
      <div class="snippet-preview">
        <span class="snippet-label">Highlighted:</span>
        <span class="snippet-text">"{highlight.textSnippet.slice(0, 50)}{highlight.textSnippet.length > 50 ? '...' : ''}"</span>
      </div>
    </div>
  </div>
{/if}

<style>
  .highlight-popover {
    position: fixed;
    transform: translateX(-50%);
    z-index: 1001;
    animation: popIn 0.15s ease;
  }

  @keyframes popIn {
    from {
      opacity: 0;
      transform: translateX(-50%) scale(0.9);
    }
    to {
      opacity: 1;
      transform: translateX(-50%) scale(1);
    }
  }

  .popover-arrow-up {
    position: absolute;
    top: -6px;
    left: 50%;
    transform: translateX(-50%) rotate(45deg);
    width: 12px;
    height: 12px;
    background: #fff;
    border-radius: 2px;
    box-shadow: -2px -2px 4px rgba(0, 0, 0, 0.05);
  }

  .popover-content {
    background: #fff;
    border-radius: 10px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(0, 0, 0, 0.05);
    padding: 0.75rem;
    min-width: min(280px, calc(100vw - 2rem));
    max-width: min(350px, calc(100vw - 2rem));
  }

  .color-row {
    display: flex;
    gap: 0.35rem;
    align-items: center;
    padding-bottom: 0.75rem;
    border-bottom: 1px solid var(--border, #e6e1d4);
  }

  .color-btn {
    width: 28px;
    height: 28px;
    border-radius: 6px;
    border: 2px solid transparent;
    cursor: pointer;
    transition: all 0.15s ease;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .color-btn:hover {
    transform: scale(1.1);
  }

  .color-btn.active {
    border-width: 3px;
  }

  .color-btn--yellow { background: #fef08a; }
  .color-btn--yellow:hover, .color-btn--yellow.active { border-color: #ca8a04; }

  .color-btn--blue { background: #bfdbfe; }
  .color-btn--blue:hover, .color-btn--blue.active { border-color: #2563eb; }

  .color-btn--green { background: #bbf7d0; }
  .color-btn--green:hover, .color-btn--green.active { border-color: #16a34a; }

  .color-btn--pink { background: #fbcfe8; }
  .color-btn--pink:hover, .color-btn--pink.active { border-color: #db2777; }

  .delete-btn {
    width: 28px;
    height: 28px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: transparent;
    border: 2px solid var(--border, #e6e1d4);
    border-radius: 6px;
    cursor: pointer;
    color: var(--muted, #5c665a);
    transition: all 0.15s ease;
    margin-left: auto;
  }

  .delete-btn:hover {
    background: #fee2e2;
    border-color: #ef4444;
    color: #ef4444;
  }

  .note-section {
    padding: 0.75rem 0;
  }

  .note-input {
    width: 100%;
    box-sizing: border-box;
    padding: 0.5rem;
    border: 1px solid var(--border, #e6e1d4);
    border-radius: 6px;
    font-size: 0.85rem;
    font-family: inherit;
    resize: none;
    background: var(--bg, #f5f2e8);
    line-height: 1.4;
  }

  .note-input:focus {
    outline: none;
    border-color: var(--alpine, #a6b589);
  }

  .note-actions {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 0.5rem;
  }

  .note-hint {
    font-size: 0.7rem;
    color: var(--muted, #5c665a);
  }

  .save-btn {
    padding: 0.35rem 0.75rem;
    background: var(--pine, #4d594a);
    color: #fff;
    border: none;
    border-radius: 4px;
    font-size: 0.75rem;
    font-weight: 600;
    cursor: pointer;
    transition: background 0.15s ease;
  }

  .save-btn:hover {
    background: var(--ink, #2b2f26);
  }

  .snippet-preview {
    padding-top: 0.5rem;
    border-top: 1px solid var(--border, #e6e1d4);
    font-size: 0.75rem;
    color: var(--muted, #5c665a);
  }

  .snippet-label {
    font-weight: 600;
  }

  .snippet-text {
    font-style: italic;
    word-break: break-word;
  }

  /* Mobile responsiveness */
  @media (max-width: 480px) {
    .highlight-popover {
      left: 1rem !important;
      right: 1rem;
      transform: none;
      width: auto;
    }

    .popover-content {
      min-width: unset;
      max-width: unset;
      width: 100%;
    }

    .popover-arrow-up {
      left: 50%;
    }

    .note-hint {
      display: none;
    }
  }
</style>
