<script lang="ts">
  import { trailContext, updateContext } from '../../stores/trailContext.svelte';
  import { fade, fly } from 'svelte/transition';

  interface Props {
    isOpen: boolean;
    onClose: () => void;
  }

  let { isOpen, onClose }: Props = $props();

  // Local state for editing (so we can cancel without saving)
  let editStartDate = $state(trailContext.startDate);
  let editPace = $state(trailContext.targetPace);
  let editZeros = $state(trailContext.zeroDaysPerMonth);

  // Sync local state when modal opens
  $effect(() => {
    if (isOpen) {
      editStartDate = trailContext.startDate;
      editPace = trailContext.targetPace;
      editZeros = trailContext.zeroDaysPerMonth;
    }
  });

  function handleSave() {
    updateContext({
      startDate: editStartDate,
      targetPace: editPace,
      zeroDaysPerMonth: editZeros,
    });
    onClose();
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape') {
      onClose();
    }
  }

  function handleBackdropClick(e: MouseEvent) {
    if (e.target === e.currentTarget) {
      onClose();
    }
  }
</script>

<svelte:window on:keydown={handleKeydown} />

{#if isOpen}
  <div
    class="modal-backdrop"
    transition:fade={{ duration: 150 }}
    onclick={handleBackdropClick}
    role="dialog"
    aria-modal="true"
    aria-labelledby="editor-title"
  >
    <div class="modal-content" transition:fly={{ y: 20, duration: 200 }}>
      <div class="modal-header">
        <h2 id="editor-title">Trail Settings</h2>
        <button class="close-btn" onclick={onClose} aria-label="Close">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div class="modal-body">
        <!-- Start Date -->
        <div class="field">
          <label class="field-label" for="edit-date">
            Start Date
          </label>
          <input
            type="date"
            id="edit-date"
            bind:value={editStartDate}
            class="date-input"
          />
        </div>

        <!-- Target Pace -->
        <div class="field">
          <label class="field-label" for="edit-pace">
            Target Pace
            <span class="field-value">{editPace} mi/day</span>
          </label>
          <input
            type="range"
            id="edit-pace"
            min="8"
            max="25"
            step="0.5"
            bind:value={editPace}
            class="slider pace"
          />
          <div class="slider-labels">
            <span>8</span>
            <span>25</span>
          </div>
        </div>

        <!-- Zero Days -->
        <div class="field">
          <label class="field-label" for="edit-zeros">
            Zero Days
            <span class="field-value">{editZeros} /month</span>
          </label>
          <input
            type="range"
            id="edit-zeros"
            min="0"
            max="10"
            step="1"
            bind:value={editZeros}
            class="slider zeros"
          />
          <div class="slider-labels">
            <span>0</span>
            <span>10</span>
          </div>
        </div>
      </div>

      <div class="modal-footer">
        <button class="btn btn-secondary" onclick={onClose}>Cancel</button>
        <button class="btn btn-primary" onclick={handleSave}>Save Settings</button>
      </div>
    </div>
  </div>
{/if}

<style>
  .modal-backdrop {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.6);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 1rem;
    z-index: 1000;
    backdrop-filter: blur(4px);
  }

  .modal-content {
    background: #fff;
    border-radius: 16px;
    width: 100%;
    max-width: 440px;
    max-height: 90vh;
    overflow-y: auto;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  }

  .modal-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1.25rem 1.5rem;
    border-bottom: 1px solid var(--border, #e5e5e5);
  }

  .modal-header h2 {
    font-family: Oswald, sans-serif;
    font-size: 1.25rem;
    font-weight: 600;
    margin: 0;
    color: var(--pine, #4a5a44);
  }

  .close-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    background: none;
    border: none;
    border-radius: 8px;
    color: var(--muted, #888);
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .close-btn:hover {
    background: var(--bg, #f5f5f5);
    color: var(--text, #333);
  }

  .modal-body {
    padding: 1.5rem;
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }

  .field {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .field-label {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    font-family: Oswald, sans-serif;
    font-size: 0.8rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--muted, #666);
  }

  .field-value {
    font-family: Oswald, sans-serif;
    font-size: 1rem;
    font-weight: 700;
    color: var(--pine, #4a5a44);
    text-transform: none;
    letter-spacing: 0;
  }

  .slider {
    position: relative;
    width: 100%;
    height: 40px;
    -webkit-appearance: none;
    background: transparent;
    cursor: pointer;
    z-index: 2;
  }

  .slider::-webkit-slider-runnable-track {
    height: 40px;
    background: transparent;
  }

  .slider::-webkit-slider-thumb {
    -webkit-appearance: none;
    width: 12px;
    height: 36px;
    border-radius: 4px;
    background: #fff;
    box-shadow: 0 2px 6px rgba(0,0,0,0.3);
    cursor: grab;
    margin-top: 2px;
  }

  .slider.pace::-webkit-slider-runnable-track,
  .slider.zeros::-webkit-slider-runnable-track {
    height: 8px;
    background: var(--bg, #e0e0e0);
    border-radius: 4px;
  }

  .slider.pace::-webkit-slider-thumb,
  .slider.zeros::-webkit-slider-thumb {
    width: 20px;
    height: 20px;
    border-radius: 50%;
    margin-top: -6px;
  }

  .slider.pace::-webkit-slider-thumb {
    background: var(--alpine, #7b9e6b);
  }

  .slider.zeros::-webkit-slider-thumb {
    background: var(--terra, #c17f59);
  }

  .slider-labels {
    display: flex;
    justify-content: space-between;
    font-size: 0.7rem;
    color: var(--muted, #888);
  }

  /* Date Input */
  .date-input {
    padding: 0.75rem 1rem;
    background: var(--bg, #f5f5f5);
    border: 1px solid var(--border, #e0e0e0);
    border-radius: 8px;
    font-family: inherit;
    font-size: 1rem;
    color: var(--text, #333);
  }

  .date-input:focus {
    outline: none;
    border-color: var(--alpine, #7b9e6b);
    box-shadow: 0 0 0 3px rgba(123, 158, 107, 0.2);
  }

  /* Footer */
  .modal-footer {
    display: flex;
    gap: 0.75rem;
    padding: 1rem 1.5rem;
    border-top: 1px solid var(--border, #e5e5e5);
  }

  .btn {
    flex: 1;
    padding: 0.75rem 1rem;
    border: none;
    border-radius: 8px;
    font-family: Oswald, sans-serif;
    font-size: 0.9rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .btn-secondary {
    background: var(--bg, #f0f0f0);
    color: var(--muted, #666);
  }

  .btn-secondary:hover {
    background: var(--border, #e0e0e0);
  }

  .btn-primary {
    background: var(--pine, #4a5a44);
    color: #fff;
  }

  .btn-primary:hover {
    background: var(--alpine, #3d4a38);
  }

  /* Responsive */
  @media (max-width: 480px) {
    .modal-content {
      max-height: 100vh;
      border-radius: 16px 16px 0 0;
      margin-top: auto;
    }
  }
</style>
