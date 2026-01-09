<script>
  import { onMount, tick } from 'svelte';

  let { chapters = [] } = $props();

  let query = $state('');
  let isOpen = $state(false);
  let results = $state([]);
  let selectedIndex = $state(0);
  let inputEl = $state(null);
  let indexLoaded = $state(false);
  let offlineReady = $state(false);

  // Search index loaded from pre-built JSON (works offline)
  // Using plain variable (not $state) to avoid reactivity overhead on large data
  let contentIndex = [];

  // Debounce timer
  let searchTimeout = null;
  const DEBOUNCE_MS = 150;

  onMount(async () => {
    // Load pre-built search index (cached by service worker for offline use)
    try {
      const response = await fetch('/guide-search-index.json');
      const index = await response.json();

      // Pre-process: lowercase everything ONCE at load time
      contentIndex = index.map(item => ({
        id: item.id,
        title: item.title,
        titleLower: item.title.toLowerCase(),
        description: item.description || '',
        descriptionLower: (item.description || '').toLowerCase(),
        quickRef: item.quickRef || false,
        content: item.content.toLowerCase(),
        headers: (item.headers || '').toLowerCase()
      }));

      indexLoaded = true;
      offlineReady = true;
    } catch (err) {
      console.warn('[Search] Failed to load index, falling back to DOM:', err);

      // Fallback: build from DOM (online only)
      chapters.forEach(ch => {
        const section = document.getElementById(ch.id);
        if (section) {
          const text = section.textContent || '';
          contentIndex.push({
            id: ch.id,
            title: ch.data.title,
            titleLower: ch.data.title.toLowerCase(),
            description: ch.data.description || '',
            descriptionLower: (ch.data.description || '').toLowerCase(),
            quickRef: ch.data.quickRef,
            content: text.toLowerCase(),
            headers: ''
          });
        }
      });
      indexLoaded = true;
    }

    // Cleanup on unmount
    return () => {
      if (searchTimeout) clearTimeout(searchTimeout);
    };
  });

  // Debounced search - prevents blocking on every keystroke
  function scheduleSearch(q) {
    if (searchTimeout) clearTimeout(searchTimeout);

    // Immediate clear if query too short
    if (q.length < 2) {
      results = [];
      isOpen = false;
      return;
    }

    // Show loading state immediately (optional visual feedback)
    searchTimeout = setTimeout(() => {
      executeSearch(q);
    }, DEBOUNCE_MS);
  }

  // Actual search logic - runs after debounce
  function executeSearch(q) {
    if (!indexLoaded || q.length < 2) {
      results = [];
      isOpen = false;
      return;
    }

    const terms = q.toLowerCase().split(/\s+/).filter(t => t.length > 0);

    const searchResults = [];

    // Use for loop instead of map/filter for better performance
    for (let i = 0; i < contentIndex.length; i++) {
      const item = contentIndex[i];
      let score = 0;
      const matchedTerms = [];
      let snippet = '';

      for (let j = 0; j < terms.length; j++) {
        const term = terms[j];

        // Title match (highest priority) - using pre-lowercased
        if (item.titleLower.includes(term)) {
          score += 100;
          matchedTerms.push(term);
        }
        // Description match - using pre-lowercased
        if (item.descriptionLower.includes(term)) {
          score += 50;
          matchedTerms.push(term);
        }
        // Headers match (section titles)
        if (item.headers && item.headers.includes(term)) {
          score += 30;
          matchedTerms.push(term);
        }
        // Content match
        const termIndex = item.content.indexOf(term);
        if (termIndex !== -1) {
          score += 10;
          matchedTerms.push(term);

          // Extract snippet around match (only once)
          if (!snippet) {
            const start = Math.max(0, termIndex - 40);
            const end = Math.min(item.content.length, termIndex + term.length + 60);
            snippet = (start > 0 ? '...' : '') +
                      item.content.slice(start, end).trim() +
                      (end < item.content.length ? '...' : '');
          }
        }
      }

      if (score > 0) {
        searchResults.push({
          id: item.id,
          title: item.title,
          description: item.description,
          quickRef: item.quickRef,
          score,
          matchedTerms: [...new Set(matchedTerms)],
          snippet
        });
      }
    }

    // Sort by score descending and limit
    searchResults.sort((a, b) => b.score - a.score);

    results = searchResults.slice(0, 10);
    isOpen = results.length > 0 || q.length >= 2;
    selectedIndex = 0;
  }

  // React to query changes with debouncing
  $effect(() => { scheduleSearch(query); });

  function scrollToResult(result) {
    const element = document.getElementById(result.id);
    if (element) {
      const offset = 80;
      const top = element.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top, behavior: 'smooth' });

      // Briefly highlight the section
      element.classList.add('search-highlight');
      setTimeout(() => element.classList.remove('search-highlight'), 2000);

      // Close search
      query = '';
      isOpen = false;
    }
  }

  function handleKeydown(e) {
    if (e.key === 'Escape') {
      query = '';
      isOpen = false;
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      selectedIndex = Math.min(selectedIndex + 1, results.length - 1);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      selectedIndex = Math.max(selectedIndex - 1, 0);
    } else if (e.key === 'Enter' && results[selectedIndex]) {
      e.preventDefault();
      scrollToResult(results[selectedIndex]);
    }
  }

  function handleClickOutside(e) {
    if (!e.target.closest('.guide-search-container')) {
      isOpen = false;
    }
  }

  // Escape HTML entities to prevent XSS
  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // Escape regex special characters
  function escapeRegex(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  function highlightMatch(text, terms) {
    if (!terms.length) return escapeHtml(text);
    // Escape the text first to prevent XSS, then apply highlighting
    const escaped = escapeHtml(text);
    // Escape regex special chars in terms to prevent injection
    const safeTerms = terms.map(t => escapeRegex(t));
    const regex = new RegExp(`(${safeTerms.join('|')})`, 'gi');
    return escaped.replace(regex, '<mark>$1</mark>');
  }
</script>

<svelte:window onclick={handleClickOutside} />

<div class="guide-search-container">
  <div class="search-input-wrapper">
    <span class="search-icon">🔍</span>
    <input
      type="text"
      placeholder={offlineReady ? "Search (works offline)" : "Search the guide..."}
      bind:value={query}
      bind:this={inputEl}
      onkeydown={handleKeydown}
      onfocus={() => query.length >= 2 && (isOpen = true)}
      class="search-input"
      aria-label="Search guide content"
    />
    {#if offlineReady}
      <span class="offline-badge" title="Search works offline">✓</span>
    {/if}
    {#if query}
      <button class="clear-btn" onclick={() => { query = ''; isOpen = false; }} aria-label="Clear search">×</button>
    {/if}
  </div>

  {#if isOpen}
    <div class="search-results">
      {#if results.length > 0}
        {#each results as result, i}
          <button
            class="result-item"
            class:selected={i === selectedIndex}
            onclick={() => scrollToResult(result)}
            onmouseenter={() => selectedIndex = i}
          >
            <div class="result-header">
              <span class="result-title">{@html highlightMatch(result.title, result.matchedTerms)}</span>
              {#if result.quickRef}
                <span class="quick-badge">Quick Ref</span>
              {/if}
            </div>
            {#if result.description}
              <div class="result-desc">{@html highlightMatch(result.description, result.matchedTerms)}</div>
            {/if}
            {#if result.snippet}
              <div class="result-snippet">{@html highlightMatch(result.snippet, result.matchedTerms)}</div>
            {/if}
          </button>
        {/each}
      {:else}
        <div class="no-results">
          <span>No results for "{query}"</span>
          <span class="no-results-hint">Try different keywords or use Cmd+F for text search</span>
        </div>
      {/if}
    </div>
  {/if}
</div>

<style>
  .guide-search-container {
    position: relative;
    width: 100%;
  }

  .search-input-wrapper {
    display: flex;
    align-items: center;
    background: #fff;
    border: 2px solid var(--border, #e6e1d4);
    border-radius: 10px;
    padding: 0 1rem;
    transition: border-color 0.15s ease, box-shadow 0.15s ease;
  }

  .search-input-wrapper:focus-within {
    border-color: var(--alpine, #a6b589);
    box-shadow: 0 0 0 4px rgba(166, 181, 137, 0.15);
  }

  .search-icon {
    font-size: 1rem;
    margin-right: 0.75rem;
    opacity: 0.5;
  }

  .search-input {
    flex: 1;
    border: none;
    background: transparent;
    padding: 0.85rem 0;
    font-size: 1rem;
    color: var(--fg, #333);
    outline: none;
  }

  .search-input::placeholder {
    color: var(--muted, #5c665a);
  }

  .clear-btn {
    background: none;
    border: none;
    font-size: 1.5rem;
    color: var(--muted, #5c665a);
    cursor: pointer;
    padding: 0 0.25rem;
    line-height: 1;
    transition: color 0.15s ease;
  }

  .clear-btn:hover {
    color: var(--fg, #333);
  }

  .offline-badge {
    font-size: 0.75rem;
    color: var(--alpine, #a6b589);
    margin-right: 0.5rem;
    font-weight: 600;
  }

  .search-results {
    position: absolute;
    top: calc(100% + 8px);
    left: 0;
    right: 0;
    background: #fff;
    border: 1px solid var(--border, #e6e1d4);
    border-radius: 12px;
    box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15);
    z-index: 100;
    max-height: 400px;
    overflow-y: auto;
  }

  .result-item {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    width: 100%;
    padding: 1rem 1.25rem;
    border: none;
    background: transparent;
    text-align: left;
    cursor: pointer;
    border-bottom: 1px solid var(--border, #e6e1d4);
    transition: background-color 0.1s ease;
  }

  .result-item:last-child {
    border-bottom: none;
  }

  .result-item:hover,
  .result-item.selected {
    background: rgba(166, 181, 137, 0.1);
  }

  .result-header {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    width: 100%;
  }

  .result-title {
    font-weight: 600;
    color: var(--ink, #1f2937);
    font-size: 1rem;
  }

  .result-title :global(mark) {
    background: var(--marker, #f0e000);
    color: inherit;
    padding: 0.1em 0.2em;
    border-radius: 2px;
  }

  .quick-badge {
    font-size: 0.6rem;
    padding: 0.2rem 0.4rem;
    background: var(--marker, #f0e000);
    border-radius: 4px;
    font-weight: 600;
    text-transform: uppercase;
    color: #2b2f26;
  }

  .result-desc {
    font-size: 0.85rem;
    color: var(--muted, #5c665a);
    margin-top: 0.25rem;
    line-height: 1.4;
  }

  .result-desc :global(mark) {
    background: rgba(240, 224, 0, 0.5);
    color: inherit;
    padding: 0.05em 0.15em;
    border-radius: 2px;
  }

  .result-snippet {
    font-size: 0.8rem;
    color: var(--muted, #5c665a);
    margin-top: 0.35rem;
    line-height: 1.5;
    padding: 0.5rem;
    background: rgba(0,0,0,0.03);
    border-radius: 6px;
    width: 100%;
  }

  .result-snippet :global(mark) {
    background: rgba(240, 224, 0, 0.6);
    color: inherit;
    padding: 0.05em 0.15em;
    border-radius: 2px;
    font-weight: 500;
  }

  .no-results {
    padding: 1.5rem;
    text-align: center;
    color: var(--muted, #5c665a);
  }

  .no-results span {
    display: block;
  }

  .no-results-hint {
    font-size: 0.8rem;
    margin-top: 0.5rem;
    opacity: 0.7;
  }

  /* Global highlight animation for scrolled-to sections */
  :global(.chapter-section.search-highlight) {
    animation: highlightPulse 2s ease-out;
  }

  @keyframes highlightPulse {
    0% { background-color: rgba(240, 224, 0, 0.3); }
    100% { background-color: transparent; }
  }

  /* Print: hide search */
  @media print {
    .guide-search-container {
      display: none !important;
    }
  }
</style>
