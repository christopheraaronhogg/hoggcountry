<script>
  let {
    orphans = [],
    onDelete = (id) => {},
    onDeleteAll = () => {},
  } = $props();

  let expanded = $state(false);
</script>

{#if orphans.length > 0}
  <div class="orphan-banner" class:expanded>
    <button class="banner-toggle" onclick={() => expanded = !expanded}>
      <span class="banner-icon">⚠️</span>
      <span class="banner-text">
        {orphans.length} highlight{orphans.length > 1 ? 's' : ''} couldn't find {orphans.length > 1 ? 'their' : 'its'} location
      </span>
      <span class="banner-arrow" class:rotated={expanded}>▼</span>
    </button>

    {#if expanded}
      <div class="orphan-list">
        {#each orphans as orphan}
          <div class="orphan-item">
            <div class="orphan-content">
              <div class="orphan-heading">
                From: <strong>{orphan.headingText || 'Unknown section'}</strong>
              </div>
              <div class="orphan-text">
                "{orphan.textSnippet.slice(0, 80)}{orphan.textSnippet.length > 80 ? '...' : ''}"
              </div>
              {#if orphan.noteText}
                <div class="orphan-note">
                  Note: {orphan.noteText}
                </div>
              {/if}
            </div>
            <button
              class="orphan-delete"
              onclick={() => onDelete(orphan.id)}
              aria-label="Delete this highlight"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M18 6L6 18M6 6l12 12"/>
              </svg>
            </button>
          </div>
        {/each}

        <div class="orphan-actions">
          <button class="delete-all-btn" onclick={onDeleteAll}>
            Delete all orphaned highlights
          </button>
        </div>
      </div>
    {/if}
  </div>
{/if}

<style>
  .orphan-banner {
    position: sticky;
    top: 80px;
    z-index: 100;
    margin: 0 -1rem 1rem;
    background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%);
    border-bottom: 2px solid #f87171;
    animation: slideDown 0.2s ease;
  }

  @keyframes slideDown {
    from {
      opacity: 0;
      transform: translateY(-10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .banner-toggle {
    width: 100%;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 1rem;
    background: transparent;
    border: none;
    cursor: pointer;
    text-align: left;
    font-family: inherit;
    font-size: 0.9rem;
    color: #991b1b;
  }

  .banner-toggle:hover {
    background: rgba(248, 113, 113, 0.1);
  }

  .banner-icon {
    font-size: 1rem;
  }

  .banner-text {
    flex: 1;
    font-weight: 600;
  }

  .banner-arrow {
    font-size: 0.7rem;
    transition: transform 0.2s ease;
  }

  .banner-arrow.rotated {
    transform: rotate(180deg);
  }

  .orphan-list {
    padding: 0 1rem 1rem;
    border-top: 1px solid #fecaca;
  }

  .orphan-item {
    display: flex;
    gap: 0.75rem;
    padding: 0.75rem;
    margin-top: 0.5rem;
    background: rgba(255, 255, 255, 0.7);
    border-radius: 6px;
    border: 1px solid #fecaca;
  }

  .orphan-content {
    flex: 1;
    min-width: 0;
  }

  .orphan-heading {
    font-size: 0.75rem;
    color: #991b1b;
    margin-bottom: 0.25rem;
  }

  .orphan-heading strong {
    color: #7f1d1d;
  }

  .orphan-text {
    font-size: 0.85rem;
    color: #b91c1c;
    font-style: italic;
    word-break: break-word;
  }

  .orphan-note {
    margin-top: 0.5rem;
    padding: 0.5rem;
    background: #fff;
    border-radius: 4px;
    font-size: 0.8rem;
    color: #7f1d1d;
  }

  .orphan-delete {
    flex-shrink: 0;
    width: 28px;
    height: 28px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: transparent;
    border: 1px solid #fca5a5;
    border-radius: 4px;
    cursor: pointer;
    color: #dc2626;
    transition: all 0.15s ease;
  }

  .orphan-delete:hover {
    background: #fee2e2;
    border-color: #f87171;
  }

  .orphan-actions {
    margin-top: 0.75rem;
    padding-top: 0.75rem;
    border-top: 1px solid #fecaca;
    text-align: center;
  }

  .delete-all-btn {
    padding: 0.5rem 1rem;
    background: #ef4444;
    color: #fff;
    border: none;
    border-radius: 4px;
    font-size: 0.8rem;
    font-weight: 600;
    cursor: pointer;
    transition: background 0.15s ease;
  }

  .delete-all-btn:hover {
    background: #dc2626;
  }
</style>
