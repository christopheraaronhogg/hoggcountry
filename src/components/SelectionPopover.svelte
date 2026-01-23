<script>
  import { onMount } from 'svelte';
  import { HIGHLIGHT_COLORS } from '../lib/annotations/types';

  let {
    onHighlight = (color, noteText) => {},
    containerSelector = '.chapter-prose',
  } = $props();

  let visible = $state(false);
  let position = $state({ x: 0, y: 0 });
  let selectedText = $state('');
  let showNoteInput = $state(false);
  let noteText = $state('');
  let noteInputRef = $state(null);

  function handleMouseUp(e) {
    // Ignore if clicking inside the popover
    if (e.target.closest('.selection-popover')) return;

    const selection = window.getSelection();
    if (!selection || selection.isCollapsed) {
      visible = false;
      showNoteInput = false;
      noteText = '';
      return;
    }

    const text = selection.toString().trim();
    if (text.length < 3) {
      visible = false;
      return;
    }

    // Check if selection is within a guide chapter
    const range = selection.getRangeAt(0);
    const container = range.commonAncestorContainer;
    let node = container;
    let isInChapter = false;

    while (node) {
      if (node instanceof HTMLElement && node.matches(containerSelector)) {
        isInChapter = true;
        break;
      }
      node = node.parentNode;
    }

    if (!isInChapter) {
      visible = false;
      return;
    }

    // Position popover above the selection
    const rect = range.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const popoverWidth = 200; // approximate width
    const padding = 16;

    let x = rect.left + rect.width / 2;
    // Clamp position to keep popover in viewport
    x = Math.max(popoverWidth / 2 + padding, Math.min(x, viewportWidth - popoverWidth / 2 - padding));

    position = {
      x,
      y: rect.top - 10,
    };
    selectedText = text;
    visible = true;
    showNoteInput = false;
    noteText = '';
  }

  function handleHighlight(color) {
    if (showNoteInput) {
      onHighlight(color, noteText.trim() || undefined);
    } else {
      onHighlight(color, undefined);
    }
    visible = false;
    showNoteInput = false;
    noteText = '';
    window.getSelection()?.removeAllRanges();
  }

  function toggleNoteInput() {
    showNoteInput = !showNoteInput;
    if (showNoteInput) {
      // Focus the input after it renders
      setTimeout(() => noteInputRef?.focus(), 10);
    }
  }

  function handleKeydown(e) {
    if (e.key === 'Escape') {
      visible = false;
      showNoteInput = false;
      noteText = '';
    }
    if (e.key === 'Enter' && e.ctrlKey && showNoteInput) {
      handleHighlight('yellow');
    }
  }

  onMount(() => {
    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('keydown', handleKeydown);
    return () => {
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('keydown', handleKeydown);
    };
  });
</script>

{#if visible}
  <div
    class="selection-popover"
    style="left: {position.x}px; top: {position.y}px;"
  >
    <div class="popover-content">
      <div class="color-row">
        {#each HIGHLIGHT_COLORS as color}
          <button
            class="color-btn color-btn--{color}"
            onclick={() => handleHighlight(color)}
            aria-label="Highlight {color}"
          ></button>
        {/each}
        <button
          class="note-toggle"
          class:active={showNoteInput}
          onclick={toggleNoteInput}
          aria-label="Add note"
          title="Add note"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
          </svg>
        </button>
      </div>

      {#if showNoteInput}
        <div class="note-input-wrap">
          <textarea
            bind:this={noteInputRef}
            bind:value={noteText}
            class="note-input"
            placeholder="Add a note..."
            rows="2"
          ></textarea>
          <div class="note-hint">Ctrl+Enter to save with yellow</div>
        </div>
      {/if}
    </div>
    <div class="popover-arrow"></div>
  </div>
{/if}

<style>
  .selection-popover {
    position: fixed;
    transform: translateX(-50%) translateY(-100%);
    z-index: 1000;
    animation: popIn 0.15s ease;
  }

  @keyframes popIn {
    from {
      opacity: 0;
      transform: translateX(-50%) translateY(-100%) scale(0.9);
    }
    to {
      opacity: 1;
      transform: translateX(-50%) translateY(-100%) scale(1);
    }
  }

  .popover-content {
    background: #fff;
    border-radius: 10px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(0, 0, 0, 0.05);
    padding: 0.5rem;
    min-width: min(180px, calc(100vw - 2rem));
    max-width: calc(100vw - 2rem);
  }

  .popover-arrow {
    position: absolute;
    bottom: -6px;
    left: 50%;
    transform: translateX(-50%);
    width: 12px;
    height: 12px;
    background: #fff;
    border-radius: 2px;
    transform: translateX(-50%) rotate(45deg);
    box-shadow: 2px 2px 4px rgba(0, 0, 0, 0.1);
  }

  .color-row {
    display: flex;
    gap: 0.35rem;
    align-items: center;
  }

  .color-btn {
    width: 28px;
    height: 28px;
    border-radius: 6px;
    border: 2px solid transparent;
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .color-btn:hover {
    transform: scale(1.1);
  }

  .color-btn--yellow { background: #fef08a; }
  .color-btn--yellow:hover { border-color: #ca8a04; }

  .color-btn--blue { background: #bfdbfe; }
  .color-btn--blue:hover { border-color: #2563eb; }

  .color-btn--green { background: #bbf7d0; }
  .color-btn--green:hover { border-color: #16a34a; }

  .color-btn--pink { background: #fbcfe8; }
  .color-btn--pink:hover { border-color: #db2777; }

  .note-toggle {
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
    margin-left: 0.25rem;
  }

  .note-toggle:hover, .note-toggle.active {
    background: var(--alpine, #a6b589);
    border-color: var(--alpine, #a6b589);
    color: #fff;
  }

  .note-input-wrap {
    margin-top: 0.5rem;
    padding-top: 0.5rem;
    border-top: 1px solid var(--border, #e6e1d4);
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
  }

  .note-input:focus {
    outline: none;
    border-color: var(--alpine, #a6b589);
  }

  .note-hint {
    font-size: 0.7rem;
    color: var(--muted, #5c665a);
    margin-top: 0.25rem;
    text-align: right;
  }

  /* Mobile responsiveness */
  @media (max-width: 480px) {
    .selection-popover {
      left: 1rem !important;
      right: 1rem;
      transform: translateY(-100%);
      width: auto;
    }

    .popover-content {
      min-width: unset;
      width: 100%;
    }

    .popover-arrow {
      left: 50%;
    }

    .note-hint {
      display: none;
    }
  }
</style>
