<script>
  import { onMount } from 'svelte';

  // Simple localStorage-based highlights
  const STORAGE_KEY = 'guide-highlights';
  
  let highlights = $state([]);
  let activeId = $state(null);
  let noteText = $state('');
  let popoverPos = $state({ x: 0, y: 0 });
  
  // Selection state (before highlighting)
  let pendingSelection = $state(null);
  let selectionPopoverPos = $state({ x: 0, y: 0 });

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
    if (!sel || sel.isCollapsed) {
      pendingSelection = null;
      return;
    }
    
    const text = sel.toString().trim();
    if (text.length < 3) {
      pendingSelection = null;
      return;
    }

    // Only allow selections within .guide-content
    const range = sel.getRangeAt(0);
    const container = range.commonAncestorContainer;
    const guideContent = document.querySelector('.guide-content-area');
    if (!guideContent?.contains(container)) {
      pendingSelection = null;
      return;
    }

    // Store selection for later, show selection popover
    const rect = range.getBoundingClientRect();
    pendingSelection = { text, range: range.cloneRange() };
    selectionTimestamp = Date.now();
    selectionPopoverPos = {
      x: Math.min(rect.left + rect.width / 2, window.innerWidth - 100),
      y: rect.bottom + 8
    };
  }

  function getContext(range) {
    // Get surrounding text for better matching
    const node = range.startContainer;
    const fullText = node.textContent || '';
    const start = Math.max(0, range.startOffset - 30);
    const end = Math.min(fullText.length, range.endOffset + 30);
    const before = fullText.slice(start, range.startOffset);
    const after = fullText.slice(range.endOffset, end);
    
    // Also get the nearest heading
    let heading = '';
    let el = range.startContainer.parentElement;
    while (el) {
      const prev = el.previousElementSibling;
      if (prev?.tagName?.match(/^H[1-6]$/)) {
        heading = prev.id || prev.textContent?.slice(0, 50) || '';
        break;
      }
      // Check if we're inside or after a heading
      const h = el.closest('.chapter-section')?.querySelector('h2, h3');
      if (h) {
        heading = h.id || h.textContent?.slice(0, 50) || '';
        break;
      }
      el = el.parentElement;
    }
    
    return { before, after, heading };
  }

  function createHighlight(color = 'yellow') {
    if (!pendingSelection) return;
    
    const { text, range } = pendingSelection;
    const id = Date.now().toString();
    const ctx = getContext(range);
    const highlight = {
      id,
      text,
      note: '',
      color,
      // Store context for better re-matching
      before: ctx.before,
      after: ctx.after,
      heading: ctx.heading,
    };

    try {
      const mark = document.createElement('mark');
      mark.className = `guide-highlight guide-highlight--${color}`;
      mark.dataset.highlightId = id;
      range.surroundContents(mark);
      
      mark.addEventListener('click', (e) => {
        e.stopPropagation();
        openPopover(id, mark);
      });

      highlights = [...highlights, highlight];
      save();
      window.getSelection()?.removeAllRanges();
      pendingSelection = null;
      
      // Open popover immediately so user can add a note
      openPopover(id, mark);
    } catch (e) {
      console.error('Could not highlight:', e);
      pendingSelection = null;
    }
  }

  function applyHighlights() {
    // Re-apply highlights on page load by finding text with context matching
    const guideContent = document.querySelector('.guide-content-area');
    if (!guideContent) return;

    for (const h of highlights) {
      let bestMatch = null;
      let bestScore = -1;
      
      const walker = document.createTreeWalker(guideContent, NodeFilter.SHOW_TEXT);
      let node;
      while ((node = walker.nextNode())) {
        const fullText = node.textContent || '';
        let idx = 0;
        
        // Find all occurrences in this node
        while ((idx = fullText.indexOf(h.text, idx)) !== -1) {
          // Score this match based on context
          let score = 0;
          
          // Check before context
          if (h.before) {
            const actualBefore = fullText.slice(Math.max(0, idx - h.before.length), idx);
            if (actualBefore.includes(h.before.slice(-15))) score += 10;
          }
          
          // Check after context
          if (h.after) {
            const actualAfter = fullText.slice(idx + h.text.length, idx + h.text.length + h.after.length);
            if (actualAfter.includes(h.after.slice(0, 15))) score += 10;
          }
          
          // Check heading context
          if (h.heading) {
            let el = node.parentElement;
            while (el && el !== guideContent) {
              const section = el.closest('.chapter-section');
              if (section) {
                const sectionHeading = section.querySelector('h2, h3');
                if (sectionHeading && (sectionHeading.id === h.heading || sectionHeading.textContent?.includes(h.heading.slice(0, 20)))) {
                  score += 20;
                }
                break;
              }
              el = el.parentElement;
            }
          }
          
          if (score > bestScore) {
            bestScore = score;
            bestMatch = { node, idx };
          }
          
          idx += 1;
        }
      }
      
      // Apply the best match
      if (bestMatch) {
        try {
          const range = document.createRange();
          range.setStart(bestMatch.node, bestMatch.idx);
          range.setEnd(bestMatch.node, bestMatch.idx + h.text.length);
          
          const mark = document.createElement('mark');
          mark.className = `guide-highlight guide-highlight--${h.color}`;
          mark.dataset.highlightId = h.id;
          range.surroundContents(mark);
          
          mark.addEventListener('click', (e) => {
            e.stopPropagation();
            openPopover(h.id, mark);
          });
        } catch (e) {
          // Could not wrap, skip
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

  let selectionTimestamp = 0;
  
  function handleClickOutside(e) {
    if (activeId && !e.target.closest('.highlight-popover') && !e.target.closest('mark')) {
      closePopover();
    }
    // Only clear pendingSelection if it wasn't just set (avoid mouseup->click race)
    if (pendingSelection && Date.now() - selectionTimestamp > 100) {
      if (!e.target.closest('.selection-popover')) {
        pendingSelection = null;
      }
    }
  }
</script>

<svelte:document onclick={handleClickOutside} />

{#if pendingSelection}
  <div class="selection-popover" style="left: {selectionPopoverPos.x}px; top: {selectionPopoverPos.y}px;">
    <div class="selection-colors">
      {#each ['yellow', 'blue', 'green', 'pink'] as color}
        <button 
          class="color-btn color-btn--{color}"
          onclick={() => createHighlight(color)}
          title="Highlight {color}"
        ></button>
      {/each}
    </div>
  </div>
{/if}

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
  .selection-popover {
    position: fixed;
    transform: translateX(-50%);
    z-index: 1001;
    background: #fff;
    border-radius: 8px;
    box-shadow: 0 4px 20px rgba(0,0,0,0.15);
    padding: 0.4rem;
  }

  .selection-colors {
    display: flex;
    gap: 0.25rem;
  }

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
