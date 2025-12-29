<script>
  export let chapters = [];

  let query = '';
  let isOpen = false;
  let results = [];

  // Simple search - matches title, description, or content preview
  $: {
    if (query.length >= 2) {
      const q = query.toLowerCase();
      results = chapters
        .filter(ch => {
          const title = ch.data.title.toLowerCase();
          const desc = (ch.data.description || '').toLowerCase();
          return title.includes(q) || desc.includes(q);
        })
        .slice(0, 8);
      isOpen = true;
    } else {
      results = [];
      isOpen = false;
    }
  }

  function handleSelect(chapter) {
    query = '';
    isOpen = false;
    window.location.href = `/guide/${chapter.id}`;
  }

  function handleKeydown(e) {
    if (e.key === 'Escape') {
      query = '';
      isOpen = false;
    }
  }

  function handleClickOutside(e) {
    if (!e.target.closest('.search-container')) {
      isOpen = false;
    }
  }
</script>

<svelte:window on:click={handleClickOutside} />

<div class="search-container">
  <div class="search-input-wrapper">
    <span class="search-icon">🔍</span>
    <input
      type="text"
      placeholder="Search guide..."
      bind:value={query}
      on:keydown={handleKeydown}
      on:focus={() => query.length >= 2 && (isOpen = true)}
      class="search-input"
    />
    {#if query}
      <button class="clear-btn" on:click={() => { query = ''; isOpen = false; }}>×</button>
    {/if}
  </div>

  {#if isOpen && results.length > 0}
    <div class="search-results">
      {#each results as chapter}
        <button class="result-item" on:click={() => handleSelect(chapter)}>
          <span class="result-title">{chapter.data.title}</span>
          {#if chapter.data.description}
            <span class="result-desc">{chapter.data.description}</span>
          {/if}
          {#if chapter.data.quickRef}
            <span class="quick-badge">Quick Ref</span>
          {/if}
        </button>
      {/each}
    </div>
  {:else if isOpen && query.length >= 2}
    <div class="search-results">
      <div class="no-results">No chapters found for "{query}"</div>
    </div>
  {/if}
</div>

<style>
  .search-container {
    position: relative;
    width: 100%;
    max-width: 400px;
  }

  .search-input-wrapper {
    display: flex;
    align-items: center;
    background: var(--card, #fff);
    border: 1px solid var(--border, #e6e1d4);
    border-radius: 8px;
    padding: 0 0.75rem;
    transition: border-color 0.15s ease, box-shadow 0.15s ease;
  }

  .search-input-wrapper:focus-within {
    border-color: var(--alpine, #a6b589);
    box-shadow: 0 0 0 3px rgba(166, 181, 137, 0.15);
  }

  .search-icon {
    font-size: 0.9rem;
    margin-right: 0.5rem;
    opacity: 0.5;
  }

  .search-input {
    flex: 1;
    border: none;
    background: transparent;
    padding: 0.6rem 0;
    font-size: 0.9rem;
    color: var(--fg, #333);
    outline: none;
  }

  .search-input::placeholder {
    color: var(--muted, #5c665a);
  }

  .clear-btn {
    background: none;
    border: none;
    font-size: 1.25rem;
    color: var(--muted, #5c665a);
    cursor: pointer;
    padding: 0 0.25rem;
    line-height: 1;
  }

  .clear-btn:hover {
    color: var(--fg, #333);
  }

  .search-results {
    position: absolute;
    top: calc(100% + 4px);
    left: 0;
    right: 0;
    background: var(--card, #fff);
    border: 1px solid var(--border, #e6e1d4);
    border-radius: 8px;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
    z-index: 100;
    max-height: 320px;
    overflow-y: auto;
  }

  .result-item {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    width: 100%;
    padding: 0.75rem 1rem;
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

  .result-item:hover {
    background: rgba(166, 181, 137, 0.1);
  }

  .result-title {
    font-weight: 600;
    color: var(--ink, #1f2937);
    font-size: 0.9rem;
  }

  .result-desc {
    font-size: 0.75rem;
    color: var(--muted, #5c665a);
    margin-top: 0.125rem;
  }

  .quick-badge {
    font-size: 0.6rem;
    padding: 0.15rem 0.35rem;
    background: var(--marker, #f0e000);
    border-radius: 3px;
    margin-top: 0.25rem;
    font-weight: 600;
    text-transform: uppercase;
  }

  .no-results {
    padding: 1rem;
    text-align: center;
    color: var(--muted, #5c665a);
    font-size: 0.85rem;
  }
</style>
