<script lang="ts">
  import { trailContextInput, updateContext } from '../../stores/trailContext.svelte';

  let { open = $bindable(false) } = $props<{ open?: boolean }>();

  let draftMile = $state(0);
  let draftStart = $state('2026-03-01');
  let draftPace = $state(15);
  let draftZeros = $state(4);

  function syncFromStore() {
    draftMile = trailContextInput.currentMile;
    draftStart = trailContextInput.startDate;
    draftPace = trailContextInput.targetPace;
    draftZeros = trailContextInput.zeroDaysPerMonth;
  }

  $effect(() => {
    if (open) syncFromStore();
  });

  function close() {
    open = false;
  }

  function save() {
    updateContext({
      currentMile: draftMile,
      startDate: draftStart,
      targetPace: draftPace,
      zeroDaysPerMonth: draftZeros,
    });
    close();
  }

  function onKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape') close();
  }
</script>

{#if open}
  <div class="overlay" role="presentation" onclick={close} onkeydown={onKeydown}>
    <div
      class="modal card"
      role="dialog"
      aria-modal="true"
      aria-label="Edit trail settings"
      onclick={(e) => e.stopPropagation()}
    >
      <header class="modal-head">
        <h2 class="font-display">Trail settings</h2>
        <button class="btn" type="button" onclick={close} aria-label="Close settings">Close</button>
      </header>

      <div class="controls">
        <label class="ctrl">
          <span class="ctrl-label">Current mile</span>
          <span class="ctrl-value">{draftMile} mi</span>
          <input type="range" min="0" max="2198" step="1" bind:value={draftMile} />
        </label>

        <label class="ctrl">
          <span class="ctrl-label">Start date</span>
          <input class="date" type="date" bind:value={draftStart} />
        </label>

        <label class="ctrl">
          <span class="ctrl-label">Target pace</span>
          <span class="ctrl-value">{draftPace} mi/day</span>
          <input type="range" min="8" max="30" step="0.5" bind:value={draftPace} />
        </label>

        <label class="ctrl">
          <span class="ctrl-label">Zero days planned</span>
          <span class="ctrl-value">{draftZeros} / month</span>
          <input type="range" min="0" max="15" step="1" bind:value={draftZeros} />
        </label>
      </div>

      <footer class="modal-foot">
        <button class="btn" type="button" onclick={close}>Cancel</button>
        <button class="btn btn-primary" type="button" onclick={save}>Save</button>
      </footer>
    </div>
  </div>
{/if}

<style>
  .overlay {
    position: fixed;
    inset: 0;
    background: rgba(31, 41, 55, 0.4);
    display: grid;
    place-items: center;
    padding: 1rem;
    z-index: 60;
  }

  .modal {
    width: min(720px, 100%);
    padding: 1rem;
  }

  .modal-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    margin-bottom: 0.75rem;
  }

  .controls {
    display: grid;
    gap: 0.85rem;
    margin: 0.5rem 0 1rem;
  }

  .ctrl {
    display: grid;
    gap: 0.4rem;
  }

  .ctrl-label {
    font-weight: 700;
    color: var(--pine);
  }

  .ctrl-value {
    color: var(--muted);
    font-size: 0.9rem;
  }

  input[type="range"] {
    width: 100%;
  }

  .date {
    padding: 0.55rem 0.65rem;
    border: 1px solid var(--border);
    border-radius: 10px;
    background: #fff;
    font-family: inherit;
  }

  .modal-foot {
    display: flex;
    justify-content: flex-end;
    gap: 0.5rem;
  }
</style>
