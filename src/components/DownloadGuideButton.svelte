<script>
  import { onMount } from 'svelte';
  import DownloadModal from './DownloadModal.svelte';

  export let markdownContent = '';
  export let variant = 'default'; // 'default' | 'header' | 'toc'

  let isModalOpen = false;

  function openModal() {
    isModalOpen = true;
  }

  function closeModal() {
    isModalOpen = false;
  }

  function triggerModal() {
    // Dispatch event so the single modal instance (header variant) opens
    window.dispatchEvent(new CustomEvent('open-download-modal'));
  }

  // Only the header variant listens for the event and owns the modal
  onMount(() => {
    if (variant === 'header') {
      const handler = () => openModal();
      window.addEventListener('open-download-modal', handler);
      return () => window.removeEventListener('open-download-modal', handler);
    }
  });
</script>

{#if variant === 'toc'}
  <button class="toc-download-btn" on:click={triggerModal}>
    <span class="btn-icon">↓</span>
    <span>Download Guide</span>
  </button>
{:else if variant === 'header'}
  <!-- Header button is rendered in Astro, this variant owns the single modal instance -->
  <DownloadModal
    isOpen={isModalOpen}
    onClose={closeModal}
    {markdownContent}
  />
{:else}
  <button class="download-btn" on:click={triggerModal}>
    <span class="btn-icon">↓</span>
    <span>Download</span>
  </button>
{/if}

<style>
  .download-btn {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    padding: 0.5rem 1rem;
    background: var(--pine, #4d594a);
    color: #fff;
    border: none;
    border-radius: 6px;
    font-family: inherit;
    font-size: 0.85rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .download-btn:hover {
    background: var(--ink, #2b2f26);
    transform: translateY(-1px);
  }

  .toc-download-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    padding: 0.6rem 1.25rem;
    background: var(--pine, #4d594a);
    color: #fff;
    border: none;
    border-radius: 8px;
    font-family: inherit;
    font-size: 0.85rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .toc-download-btn:hover {
    background: var(--ink, #2b2f26);
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }

  .btn-icon {
    font-size: 1rem;
  }
</style>
