<script lang="ts">
  import { onMount } from 'svelte';
  import { getManualSnapshot, hydrateManual, pinToManual, subscribeToManual, type FieldManualEntryInput } from '../../lib/field-manual';

  interface Props {
    entry: FieldManualEntryInput;
    label?: string;
    savedLabel?: string;
    compact?: boolean;
    variant?: 'primary' | 'subtle';
  }

  let {
    entry,
    label = 'Save to my Field Manual',
    savedLabel = 'Saved',
    compact = false,
    variant = 'primary',
  }: Props = $props();

  let isSaved = $state(false);
  let isSaving = $state(false);

  function syncSavedState() {
    const snapshot = getManualSnapshot();
    isSaved = snapshot.some((item) => item.id === entry.id);
  }

  onMount(() => {
    syncSavedState();

    const unsubscribe = subscribeToManual((entries) => {
      isSaved = entries.some((item) => item.id === entry.id);
    });

    hydrateManual()
      .then(() => {
        syncSavedState();
      })
      .catch((error) => {
        console.warn('[FieldManual] Could not hydrate save button state', error);
      });

    return unsubscribe;
  });

  async function handleClick(event: MouseEvent) {
    event.preventDefault();
    event.stopPropagation();

    if (isSaving || isSaved) return;

    isSaving = true;

    try {
      await pinToManual(entry);
    } finally {
      isSaving = false;
    }
  }
</script>

<button
  type="button"
  class={`manual-save-button ${compact ? 'is-compact' : ''} ${variant === 'subtle' ? 'is-subtle' : ''}`}
  class:is-saved={isSaved}
  disabled={isSaving}
  aria-pressed={isSaved}
  onclick={handleClick}
>
  {#if isSaving}
    Saving…
  {:else if isSaved}
    {savedLabel}
  {:else}
    {label}
  {/if}
</button>

<style>
  .manual-save-button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-height: 44px;
    padding: 0.7rem 1rem;
    border-radius: 999px;
    border: 1px solid #d5c773;
    background: linear-gradient(180deg, rgba(240, 224, 0, 0.18), rgba(240, 224, 0, 0.3));
    color: #38340c;
    font: inherit;
    font-weight: 700;
    cursor: pointer;
    transition: transform 0.12s ease, box-shadow 0.12s ease, border-color 0.12s ease, background-color 0.12s ease;
  }

  .manual-save-button:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 10px 18px rgba(56, 52, 12, 0.12);
  }

  .manual-save-button.is-subtle {
    background: #fff;
    border-color: var(--border, #e6e1d4);
    color: var(--pine, #4d594a);
  }

  .manual-save-button.is-compact {
    min-height: 36px;
    padding: 0.45rem 0.75rem;
    font-size: 0.82rem;
  }

  .manual-save-button.is-saved {
    border-color: rgba(77, 89, 74, 0.35);
    background: rgba(166, 181, 137, 0.24);
    color: var(--pine, #4d594a);
  }

  .manual-save-button:disabled {
    cursor: default;
    transform: none;
    box-shadow: none;
    opacity: 0.8;
  }
</style>
