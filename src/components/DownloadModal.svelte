<script>
  import { onMount } from 'svelte';

  let { isOpen = false, onClose = () => {}, markdownContent = '' } = $props();

  let modalRef = $state(null);

  function handleKeydown(e) {
    if (e.key === 'Escape' && isOpen) {
      onClose();
    }
  }

  function handleBackdropClick(e) {
    if (e.target === e.currentTarget) {
      onClose();
    }
  }

  function downloadPDF() {
    const a = document.createElement('a');
    a.href = '/AT-Field-Guide-2026.pdf';
    a.download = 'AT-Field-Guide-2026.pdf';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    onClose();
  }

  function downloadMarkdown() {
    const blob = new Blob([markdownContent], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'AT-Field-Guide-2026.md';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    onClose();
  }

  onMount(() => {
    document.addEventListener('keydown', handleKeydown);
    return () => document.removeEventListener('keydown', handleKeydown);
  });

  // Handle body scroll lock (only in browser)
  $effect(() => {
    if (typeof document !== 'undefined') {
      if (isOpen) {
        document.body.style.overflow = 'hidden';
      } else {
        document.body.style.overflow = '';
      }
    }
  });
</script>

{#if isOpen}
  <div class="modal-backdrop" onclick={handleBackdropClick} role="dialog" aria-modal="true" aria-labelledby="modal-title">
    <div class="modal" bind:this={modalRef}>
      <!-- Close button -->
      <button class="close-btn" onclick={onClose} aria-label="Close modal">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M18 6L6 18M6 6l12 12"/>
        </svg>
      </button>

      <!-- Header -->
      <div class="modal-header">
        <div class="header-blazes" aria-hidden="true">
          <span class="blaze"></span>
          <span class="blaze"></span>
        </div>
        <h2 id="modal-title" class="modal-title">Download Field Guide</h2>
        <p class="modal-subtitle">Choose your preferred format</p>
      </div>

      <!-- Format options -->
      <div class="format-grid">
        <!-- PDF Option -->
        <button class="format-card" onclick={downloadPDF}>
          <div class="format-icon pdf-icon">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14,2 14,8 20,8"/>
              <path d="M9 15h6M9 11h6"/>
            </svg>
          </div>
          <div class="format-content">
            <h3 class="format-title">PDF Document</h3>
            <p class="format-desc">Best for <strong>printing</strong> or offline reading. Formatted beautifully for paper with page numbers and headers.</p>
          </div>
          <div class="format-action">
            <span class="action-text">Download PDF</span>
            <span class="action-arrow">↓</span>
          </div>
        </button>

        <!-- Markdown Option -->
        <button class="format-card" onclick={downloadMarkdown}>
          <div class="format-icon md-icon">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14,2 14,8 20,8"/>
              <path d="M7 13l2 2 4-4"/>
            </svg>
          </div>
          <div class="format-content">
            <h3 class="format-title">Markdown File</h3>
            <p class="format-desc">Best for <strong>note-taking apps</strong> like Obsidian, Notion, or Bear. Plain text with formatting you can edit.</p>
          </div>
          <div class="format-action">
            <span class="action-text">Download .md</span>
            <span class="action-arrow">↓</span>
          </div>
        </button>
      </div>

      <!-- Footer hint -->
      <p class="modal-hint hand">
        Tip: PDF for the trail, Markdown for your digital brain.
      </p>
    </div>
  </div>
{/if}

<style>
  .modal-backdrop {
    position: fixed;
    inset: 0;
    z-index: 9999;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 1rem;
    background: rgba(43, 47, 38, 0.6);
    backdrop-filter: blur(4px);
    -webkit-backdrop-filter: blur(4px);
    animation: fadeIn 0.2s ease;
  }

  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  .modal {
    position: relative;
    width: 100%;
    max-width: 480px;
    background: linear-gradient(165deg, #fdfcf9 0%, var(--bg, #f5f2e8) 100%);
    border-radius: 16px;
    padding: 2rem;
    box-shadow:
      0 25px 50px -12px rgba(0, 0, 0, 0.25),
      0 0 0 1px rgba(0, 0, 0, 0.05),
      inset 0 1px 0 rgba(255, 255, 255, 0.6);
    animation: slideUp 0.25s ease;
  }

  @keyframes slideUp {
    from {
      opacity: 0;
      transform: translateY(10px) scale(0.98);
    }
    to {
      opacity: 1;
      transform: translateY(0) scale(1);
    }
  }

  .close-btn {
    position: absolute;
    top: 1rem;
    right: 1rem;
    width: 36px;
    height: 36px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: transparent;
    border: none;
    border-radius: 8px;
    color: var(--muted, #5c665a);
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .close-btn:hover {
    background: rgba(77, 89, 74, 0.1);
    color: var(--pine, #4d594a);
  }

  /* Header */
  .modal-header {
    text-align: center;
    margin-bottom: 1.75rem;
    position: relative;
  }

  .header-blazes {
    display: flex;
    justify-content: center;
    gap: 0.4rem;
    margin-bottom: 1rem;
  }

  .blaze {
    width: 8px;
    height: 14px;
    background: var(--marker, #f0e000);
    border-radius: 2px;
    transform: rotate(-2deg);
  }

  .blaze:nth-child(2) {
    transform: rotate(3deg);
    opacity: 0.7;
  }

  .modal-title {
    font-family: Oswald, sans-serif;
    font-size: 1.5rem;
    font-weight: 700;
    color: var(--ink, #2b2f26);
    margin: 0 0 0.25rem;
    letter-spacing: -0.01em;
  }

  .modal-subtitle {
    font-size: 0.9rem;
    color: var(--muted, #5c665a);
    margin: 0;
  }

  /* Format grid */
  .format-grid {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .format-card {
    display: grid;
    grid-template-columns: 56px 1fr auto;
    gap: 1rem;
    align-items: center;
    padding: 1rem 1.25rem;
    background: #fff;
    border: 2px solid var(--border, #e6e1d4);
    border-radius: 12px;
    cursor: pointer;
    text-align: left;
    transition: all 0.15s ease;
    font-family: inherit;
  }

  .format-card:hover {
    border-color: var(--alpine, #a6b589);
    transform: translateY(-2px);
    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.08);
  }

  .format-card:active {
    transform: translateY(0);
  }

  .format-icon {
    width: 56px;
    height: 56px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 10px;
    flex-shrink: 0;
  }

  .pdf-icon {
    background: linear-gradient(135deg, rgba(217, 119, 6, 0.15), rgba(217, 119, 6, 0.05));
    color: var(--terra, #d97706);
  }

  .md-icon {
    background: linear-gradient(135deg, rgba(166, 181, 137, 0.25), rgba(166, 181, 137, 0.1));
    color: var(--pine, #4d594a);
  }

  .format-content {
    min-width: 0;
  }

  .format-title {
    font-family: Oswald, sans-serif;
    font-size: 1.05rem;
    font-weight: 600;
    color: var(--ink, #2b2f26);
    margin: 0 0 0.25rem;
  }

  .format-desc {
    font-size: 0.8rem;
    color: var(--muted, #5c665a);
    margin: 0;
    line-height: 1.4;
  }

  .format-desc strong {
    color: var(--pine, #4d594a);
  }

  .format-action {
    display: flex;
    align-items: center;
    gap: 0.35rem;
    padding: 0.5rem 0.75rem;
    background: var(--pine, #4d594a);
    color: #fff;
    border-radius: 6px;
    font-size: 0.75rem;
    font-weight: 600;
    white-space: nowrap;
    transition: background 0.15s ease;
  }

  .format-card:hover .format-action {
    background: var(--ink, #2b2f26);
  }

  .action-arrow {
    font-size: 0.85rem;
    transition: transform 0.15s ease;
  }

  .format-card:hover .action-arrow {
    transform: translateY(2px);
  }

  /* Footer hint */
  .modal-hint {
    text-align: center;
    margin: 1.5rem 0 0;
    font-size: 0.9rem;
    color: var(--muted, #5c665a);
  }

  .hand {
    font-family: Caveat, cursive;
    font-size: 1.05rem;
  }

  /* Mobile */
  @media (max-width: 500px) {
    .modal {
      padding: 1.5rem;
    }

    .format-card {
      grid-template-columns: 48px 1fr;
      grid-template-rows: auto auto;
      gap: 0.75rem;
    }

    .format-icon {
      width: 48px;
      height: 48px;
      grid-row: 1;
    }

    .format-content {
      grid-column: 2;
      grid-row: 1;
    }

    .format-action {
      grid-column: 1 / -1;
      grid-row: 2;
      justify-content: center;
      padding: 0.6rem 1rem;
    }

    .format-desc {
      font-size: 0.75rem;
    }
  }
</style>
