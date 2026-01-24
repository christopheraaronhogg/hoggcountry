<script>
  import { onMount } from 'svelte';

  // Simple localStorage-based highlights
  const STORAGE_KEY = 'guide-highlights';
  
  let highlights = $state([]);
  let activeId = $state(null);
  let noteText = $state('');
  let popoverPos = $state({ x: 0, y: 0 });

  // Load highlights from localStorage
  onMount(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        highlights = JSON.parse(saved);
        applyHighlights();
      } catch (e) {
        console.error('Failed to load highlights:', e);
      }
    }

    // Listen for text selection
    document.addEventListener('mouseup', handleSelection);
    document.addEventListener('touchend', handleSelection);
    
    return () => {
      document.removeEventListener('mouseup', handleSelection);
      document.removeEventListener('touchend', handleSelection);
    };
  });

  function save() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(highlights));
  }

  function handleSelection() {
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed) return;
    
    const text = sel.toString().trim();
    if (text.length < 3) return;

    // Only allow selections within .guide-content
    const range = sel.getRangeAt(0);
    const container = range.commonAncestorContainer;
    const guideContent = document.querySelector('.guide-content-area');
    if (!guideContent?.contains(container)) return;

    // Create highlight
    const id = Date.now().toString();
    const highlight = {
      id,
      text,
      note: '',
      color: 'yellow',
      // Store position info for re-finding
      startText: text.slice(0, 50),
    };

    // Wrap selection in mark
    try {
      const mark = document.createElement('mark');
      mark.className = 'guide-highlight guide-highlight--yellow';
      mark.dataset.highlightId = id;
      range.surroundContents(mark);
      
      mark.addEventListener('click', (e) => {
        e.stopPropagation();
        openPopover(id, mark);
      });

      highlights = [...highlights, highlight];
      save();
      sel.removeAllRanges();
      
      // Open popover immediately so user can add a note
      openPopover(id, mark);
    } catch (e) {
      console.error('Could not highlight:', e);
    }
  }

  function applyHighlights() {
    // Re-apply highlights on page load by finding text
    const guideContent = document.querySelector('.guide-content-area');
    if (!guideContent) return;

    for (const h of highlights) {
      // Simple text search - find first occurrence
      const walker = document.createTreeWalker(guideContent, NodeFilter.SHOW_TEXT);
      let node;
      while ((node = walker.nextNode())) {
        const idx = node.textContent.indexOf(h.startText);
        if (idx !== -1) {
          try {
            const range = document.createRange();
            range.setStart(node, idx);
            range.setEnd(node, idx + h.text.length);
            
            const mark = document.createElement('mark');
            mark.className = `guide-highlight guide-highlight--${h.color}`;
            mark.dataset.highlightId = h.id;
            range.surroundContents(mark);
            
            mark.addEventListener('click', (e) => {
              e.stopPropagation();
              openPopover(h.id, mark);
            });
            break;
          } catch (e) {
            // Could not wrap, skip
          }
        }
      }
    }
  }

  function openPopover(id, markEl) {
    activeId = id;
    const h = highlights.find(x => x.id === id);
    noteText = h?.note || '';
    
    const rect = markEl.getBoundingClientRect();
    popoverPos = {
      x: Math.min(rect.left + rect.width / 2, window.innerWidth - 160),
      y: rect.bottom + 8
    };
  }

  function closePopover() {
    if (activeId) {
      // Save note on close
      highlights = highlights.map(h => 
        h.id === activeId ? { ...h, note: noteText } : h
      );
      save();
    }
    activeId = null;
    noteText = '';
  }

  function changeColor(color) {
    if (!activeId) return;
    highlights = highlights.map(h => 
      h.id === activeId ? { ...h, color } : h
    );
    // Update DOM
    const mark = document.querySelector(`mark[data-highlight-id="${activeId}"]`);
    if (mark) {
      mark.className = `guide-highlight guide-highlight--${color}`;
    }
    save();
  }

  function deleteHighlight() {
    if (!activeId) return;
    // Remove from DOM
    const mark = document.querySelector(`mark[data-highlight-id="${activeId}"]`);
    if (mark) {
      const text = mark.textContent;
      mark.replaceWith(document.createTextNode(text));
    }
    // Remove from state
    highlights = highlights.filter(h => h.id !== activeId);
    save();
    activeId = null;
  }

  function handleClickOutside(e) {
    if (activeId && !e.target.closest('.highlight-popover') && !e.target.closest('mark')) {
      closePopover();
    }
  }
</script>

<svelte:document onclick={handleClickOutside} />

{#if activeId}
  <div class="highlight-popover" style="left: {popoverPos.x}px; top: {popoverPos.y}px;">
    <div class="popover-colors">
      {#each ['yellow', 'blue', 'green', 'pink'] as color}
        <button 
          class="color-btn color-btn--{color}"
          class:active={highlights.find(h => h.id === activeId)?.color === color}
          onclick={() => changeColor(color)}
        ></button>
      {/each}
      <button class="delete-btn" onclick={deleteHighlight}>×</button>
    </div>
    <textarea 
      class="note-input" 
      bind:value={noteText} 
      placeholder="Add a note..."
      rows="2"
    ></textarea>
  </div>
{/if}

<style>
  .highlight-popover {
    position: fixed;
    transform: translateX(-50%);
    z-index: 1001;
    background: #fff;
    border-radius: 8px;
    box-shadow: 0 4px 20px rgba(0,0,0,0.15);
    padding: 0.5rem;
    min-width: 200px;
    max-width: 280px;
  }

  .popover-colors {
    display: flex;
    gap: 0.25rem;
    margin-bottom: 0.5rem;
  }

  .color-btn {
    width: 24px;
    height: 24px;
    border-radius: 4px;
    border: 2px solid transparent;
    cursor: pointer;
  }

  .color-btn:hover, .color-btn.active {
    border-color: #333;
  }

  .color-btn--yellow { background: #fef08a; }
  .color-btn--blue { background: #bfdbfe; }
  .color-btn--green { background: #bbf7d0; }
  .color-btn--pink { background: #fbcfe8; }

  .delete-btn {
    margin-left: auto;
    width: 24px;
    height: 24px;
    border: none;
    background: #fee2e2;
    color: #dc2626;
    border-radius: 4px;
    cursor: pointer;
    font-size: 1rem;
    line-height: 1;
  }

  .note-input {
    width: 100%;
    box-sizing: border-box;
    padding: 0.5rem;
    border: 1px solid #e5e5e5;
    border-radius: 4px;
    font-size: 0.85rem;
    font-family: inherit;
    resize: none;
  }

  .note-input:focus {
    outline: none;
    border-color: #a6b589;
  }
</style>
