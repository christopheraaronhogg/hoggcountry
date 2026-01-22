<script>
  import { onMount } from 'svelte';

  let {
    fallbackNotes = [], // Array of { highlight, headingEl }
    onDelete = (id) => {},
    onDismiss = (id) => {},
  } = $props();

  let insertedCards = $state(new Map()); // Map of highlight.id -> card element

  // Insert cards after their respective headings
  $effect(() => {
    // Remove cards for notes no longer in the list
    const currentIds = new Set(fallbackNotes.map((n) => n.highlight.id));
    for (const [id, card] of insertedCards) {
      if (!currentIds.has(id)) {
        card.remove();
        insertedCards.delete(id);
      }
    }

    // Insert new cards
    for (const { highlight, headingEl } of fallbackNotes) {
      if (insertedCards.has(highlight.id)) continue;

      const card = createFallbackCard(highlight);
      headingEl.insertAdjacentElement('afterend', card);
      insertedCards.set(highlight.id, card);
    }
  });

  function createFallbackCard(highlight) {
    const card = document.createElement('div');
    card.className = 'fallback-note-card';
    card.dataset.highlightId = highlight.id;

    card.innerHTML = `
      <div class="fallback-header">
        <span class="fallback-icon">📝</span>
        <span class="fallback-label">Note from changed section</span>
      </div>
      <div class="fallback-content">
        <div class="fallback-original">
          <span class="fallback-original-label">Original text:</span>
          <span class="fallback-original-text">"${escapeHtml(highlight.textSnippet.slice(0, 100))}${highlight.textSnippet.length > 100 ? '...' : ''}"</span>
        </div>
        ${highlight.noteText ? `
          <div class="fallback-note">
            <span class="fallback-note-label">Your note:</span>
            <span class="fallback-note-text">${escapeHtml(highlight.noteText)}</span>
          </div>
        ` : ''}
      </div>
      <div class="fallback-actions">
        <button class="fallback-dismiss" data-action="dismiss">Dismiss</button>
        <button class="fallback-delete" data-action="delete">Delete</button>
      </div>
    `;

    // Add event listeners
    card.querySelector('[data-action="dismiss"]')?.addEventListener('click', () => {
      onDismiss(highlight.id);
      card.remove();
      insertedCards.delete(highlight.id);
    });

    card.querySelector('[data-action="delete"]')?.addEventListener('click', () => {
      onDelete(highlight.id);
      card.remove();
      insertedCards.delete(highlight.id);
    });

    return card;
  }

  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  onMount(() => {
    // Cleanup on unmount
    return () => {
      for (const card of insertedCards.values()) {
        card.remove();
      }
    };
  });
</script>

<!-- Styles are injected globally since we create elements dynamically -->
<svelte:head>
  <style>
    .fallback-note-card {
      margin: 1rem 0;
      padding: 1rem;
      background: linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%);
      border: 1px solid #f59e0b;
      border-left: 4px solid #f59e0b;
      border-radius: 8px;
      font-size: 0.9rem;
    }

    .fallback-header {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-bottom: 0.75rem;
    }

    .fallback-icon {
      font-size: 1.1rem;
    }

    .fallback-label {
      font-weight: 600;
      color: #92400e;
    }

    .fallback-content {
      margin-bottom: 0.75rem;
    }

    .fallback-original {
      margin-bottom: 0.5rem;
    }

    .fallback-original-label {
      font-weight: 600;
      color: #78350f;
      font-size: 0.8rem;
    }

    .fallback-original-text {
      color: #92400e;
      font-style: italic;
      word-break: break-word;
    }

    .fallback-note {
      padding: 0.5rem;
      background: rgba(255, 255, 255, 0.6);
      border-radius: 4px;
    }

    .fallback-note-label {
      font-weight: 600;
      color: #78350f;
      font-size: 0.8rem;
      display: block;
      margin-bottom: 0.25rem;
    }

    .fallback-note-text {
      color: #451a03;
      line-height: 1.4;
    }

    .fallback-actions {
      display: flex;
      gap: 0.5rem;
    }

    .fallback-dismiss,
    .fallback-delete {
      padding: 0.35rem 0.75rem;
      border-radius: 4px;
      font-size: 0.75rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.15s ease;
      border: none;
    }

    .fallback-dismiss {
      background: #fef3c7;
      color: #92400e;
      border: 1px solid #f59e0b;
    }

    .fallback-dismiss:hover {
      background: #fde68a;
    }

    .fallback-delete {
      background: #fee2e2;
      color: #991b1b;
      border: 1px solid #f87171;
    }

    .fallback-delete:hover {
      background: #fecaca;
    }
  </style>
</svelte:head>
