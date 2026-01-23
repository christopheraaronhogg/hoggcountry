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
    const popoverWidth = 320; // slightly wider
    const padding = 16;

    let x = rect.left + rect.width / 2;
    // Clamp position to keep popover in viewport
    x = Math.max(popoverWidth / 2 + padding, Math.min(x, viewportWidth - popoverWidth / 2 - padding));

    position = {
      x,
      y: rect.bottom + 12, // slightly more offset
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
      onClose(); // Optional: close on save? Maybe just save.
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
      <!-- Header row with colors and actions -->
      <div class="header-row">
        <div class="color-picker">
          {#each HIGHLIGHT_COLORS as color}
            <button
              class="color-btn color-btn--{color}"
              class:active={highlight.color === color}
              onclick={() => handleColorChange(color)}
              aria-label="Change to {color}"
            >
              {#if highlight.color === color}
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              {/if}
            </button>
          {/each}
        </div>
        
        <div class="header-actions">
          <button
            class="action-btn delete-btn"
            onclick={onDelete}
            aria-label="Delete highlight"
            title="Delete highlight"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="3 6 5 6 21 6"/>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
            </svg>
          </button>
          <button
            class="action-btn close-btn"
            onclick={() => { handleSaveNote(); onClose(); }}
            aria-label="Close"
            title="Close"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
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
        <div class="note-footer">
          <span class="note-hint">
            {#if savedNoteText === noteText && noteText.length > 0}
              <span class="saved-indicator">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
                Saved
              </span>
            {:else}
              Ctrl+Enter to save
            {/if}
          </span>
          <!-- "Done" allows explicit close/save interaction especially for mobile -->
          <button class="save-btn" onclick={() => { handleSaveNote(); onClose(); }}>Done</button>
        </div>
      </div>

      <!-- Snippet preview (context) -->
      <div class="snippet-preview">
        <span class="snippet-label">Highlighted:</span>
        <span class="snippet-text">"{highlight.textSnippet.slice(0, 60)}{highlight.textSnippet.length > 60 ? '...' : ''}"</span>
      </div>
    </div>
  </div>
{/if}

<style>
  .highlight-popover {
    position: fixed;
    transform: translateX(-50%);
    z-index: 1001;
    animation: popIn 0.15s cubic-bezier(0.16, 1, 0.3, 1);
    font-family: Lato, system-ui, sans-serif;
  }

  @keyframes popIn {
    from {
      opacity: 0;
      transform: translateX(-50%) scale(0.95) translateY(5px);
    }
    to {
      opacity: 1;
      transform: translateX(-50%) scale(1) translateY(0);
    }
  }

  .popover-arrow-up {
    position: absolute;
    top: -6px;
    left: 50%;
    transform: translateX(-50%) rotate(45deg);
    width: 12px;
    height: 12px;
    background: var(--card, #ffffff);
    border-radius: 2px;
    box-shadow: -2px -2px 4px rgba(0, 0, 0, 0.05);
  }

  .popover-content {
    background: var(--card, #ffffff);
    border: 1px solid var(--border, #e6e1d4);
    border-radius: 12px;
    box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12), 0 2px 4px rgba(0, 0, 0, 0.05);
    padding: 1rem;
    width: 320px;
    max-width: calc(100vw - 2rem);
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  /* Header Row */
  .header-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-bottom: 0.75rem;
    border-bottom: 1px solid var(--border, #e6e1d4);
  }

  .color-picker {
    display: flex;
    gap: 0.5rem;
  }

  .header-actions {
    display: flex;
    gap: 0.25rem;
  }

  /* Color Buttons */
  .color-btn {
    width: 26px;
    height: 26px;
    border-radius: 50%;
    border: 2px solid transparent;
    cursor: pointer;
    transition: transform 0.15s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0;
    position: relative;
  }

  .color-btn:hover { transform: scale(1.1); }
  .color-btn:focus-visible { outline: 2px solid var(--pine, #4d594a); outline-offset: 2px; }
  
  .color-btn::after {
    content: '';
    position: absolute;
    inset: -3px;
    border-radius: 50%;
    border: 1px solid transparent;
    transition: border-color 0.15s ease;
  }
  .color-btn.active::after { border-color: var(--stone, #ccc); }

  .color-btn--yellow { background: #fef08a; }
  .color-btn--blue { background: #bfdbfe; }
  .color-btn--green { background: #bbf7d0; }
  .color-btn--pink { background: #fbcfe8; }

  /* Action Buttons */
  .action-btn {
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: transparent;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    color: var(--muted, #5c665a);
    transition: all 0.15s ease;
  }

  .action-btn:hover { background: rgba(0,0,0,0.05); color: var(--fg, #333); }
  .delete-btn:hover { background: #fee2e2; color: #ef4444; }

  /* Note Section */
  .note-section {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .note-input {
    width: 100%;
    box-sizing: border-box;
    padding: 0.75rem;
    border: 1px solid var(--border, #e6e1d4);
    border-radius: 8px;
    font-size: 0.95rem;
    font-family: inherit;
    resize: none;
    background: var(--bg, #f5f2e8);
    color: var(--fg, #333);
    line-height: 1.5;
    transition: border-color 0.15s ease, box-shadow 0.15s ease;
  }

  .note-input:focus {
    outline: none;
    border-color: var(--alpine, #a6b589);
    box-shadow: 0 0 0 2px rgba(166, 181, 137, 0.2);
    background: #fff;
  }

  .note-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .note-hint {
    font-size: 0.75rem;
    color: var(--muted, #5c665a);
    display: flex;
    align-items: center;
  }
  
  .saved-indicator {
    display: flex;
    align-items: center;
    gap: 4px;
    color: var(--alpine, #a6b589);
    font-weight: 600;
  }

  .save-btn {
    padding: 0.4rem 1rem;
    background: var(--pine, #4d594a);
    color: #fff;
    border: none;
    border-radius: 6px;
    font-size: 0.85rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .save-btn:hover {
    background: var(--ink, #2b2f26);
    transform: translateY(-1px);
    box-shadow: 0 2px 5px rgba(0,0,0,0.1);
  }

  /* Snippet Preview */
  .snippet-preview {
    padding-top: 0.75rem;
    border-top: 1px solid var(--border, #e6e1d4);
    font-size: 0.75rem;
    color: var(--muted, #5c665a);
    line-height: 1.4;
  }

  .snippet-label {
    font-weight: 700;
    margin-right: 0.25rem;
    color: var(--pine, #4d594a);
  }

  .snippet-text {
    font-style: italic;
  }

  /* Mobile Bottom Sheet Styles */
  @media (max-width: 480px) {
    .highlight-popover {
      position: fixed;
      top: auto !important; /* Override inline style */
      bottom: 0 !important;
      left: 0 !important;
      right: 0 !important;
      width: 100% !important;
      transform: none !important;
      z-index: 2000; /* Higher z-index */
      animation: slideUp 0.25s cubic-bezier(0.16, 1, 0.3, 1);
    }
    
    @keyframes slideUp {
      from { transform: translateY(100%); opacity: 0; }
      to { transform: translateY(0); opacity: 1; }
    }

    .popover-arrow-up {
      display: none;
    }

    .popover-content {
      width: 100%;
      max-width: 100%;
      border-radius: 16px 16px 0 0;
      border: none;
      border-top: 1px solid var(--border, #e6e1d4);
      box-shadow: 0 -4px 20px rgba(0,0,0,0.1);
      padding: 1.25rem 1rem 2rem 1rem; /* Extra bottom padding for safe area */
    }

    /* Add a drag handle visual */
    .popover-content::before {
      content: '';
      position: absolute;
      top: 0.5rem;
      left: 50%;
      transform: translateX(-50%);
      width: 40px;
      height: 4px;
      background: var(--border, #e6e1d4);
      border-radius: 99px;
    }
    
    .note-input {
      font-size: 16px; /* Prevent iOS zoom */
    }

    .header-row {
      margin-top: 0.5rem;
    }
  }
</style>
