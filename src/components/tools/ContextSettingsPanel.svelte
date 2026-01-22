<script lang="ts">
  import { trailContext, updateContext } from '../../stores/trailContext.svelte';
  import { slide } from 'svelte/transition';

  interface Props {
    isOpen: boolean;
    onClose?: () => void;
  }

  let { isOpen, onClose }: Props = $props();

  function updateStartDate(value: string) {
    if (!value) return;
    updateContext({ startDate: value });
  }

  function updatePace(value: number, persist: boolean) {
    updateContext({ targetPace: value }, persist ? undefined : { persist: false });
  }

  function updateZeros(value: number, persist: boolean) {
    updateContext({ zeroDaysPerMonth: value }, persist ? undefined : { persist: false });
  }
</script>

{#if isOpen}
  <div class="settings" transition:slide={{ duration: 160 }} aria-label="Trail settings">
    <div class="settings-grid">
      <div class="field">
        <label class="label" for="ctx-start">
          Start Date
        </label>
        <input
          id="ctx-start"
          class="input"
          type="date"
          value={trailContext.startDate}
          onchange={(e) => updateStartDate((e.currentTarget as HTMLInputElement).value)}
        />
      </div>

      <div class="field">
        <label class="label" for="ctx-pace">
          Target Pace
          <span class="value">{trailContext.targetPace} mi/day</span>
        </label>
        <input
          id="ctx-pace"
          class="range"
          type="range"
          min="8"
          max="25"
          step="0.5"
          value={trailContext.targetPace}
          oninput={(e) => updatePace(Number((e.currentTarget as HTMLInputElement).value), false)}
          onchange={(e) => updatePace(Number((e.currentTarget as HTMLInputElement).value), true)}
        />
        <div class="range-labels">
          <span>8</span>
          <span>25</span>
        </div>
      </div>

      <div class="field">
        <label class="label" for="ctx-zeros">
          Zero Days
          <span class="value">{trailContext.zeroDaysPerMonth} /month</span>
        </label>
        <input
          id="ctx-zeros"
          class="range"
          type="range"
          min="0"
          max="10"
          step="1"
          value={trailContext.zeroDaysPerMonth}
          oninput={(e) => updateZeros(Number((e.currentTarget as HTMLInputElement).value), false)}
          onchange={(e) => updateZeros(Number((e.currentTarget as HTMLInputElement).value), true)}
        />
        <div class="range-labels">
          <span>0</span>
          <span>10</span>
        </div>
      </div>
    </div>

    {#if onClose}
      <button class="done" type="button" onclick={onClose}>Done</button>
    {/if}
  </div>
{/if}

<style>
  .settings {
    margin-top: 0.9rem;
    padding: 1rem;
    border-radius: 14px;
    background: rgba(255, 255, 255, 0.96);
    border: 1px solid rgba(255, 255, 255, 0.5);
    box-shadow: 0 18px 40px rgba(0,0,0,0.12);
  }

  .settings-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 1rem;
  }

  .field {
    display: grid;
    gap: 0.5rem;
    min-width: 0;
  }

  .label {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 0.5rem;
    font-family: Oswald, sans-serif;
    font-size: 0.75rem;
    font-weight: 700;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: var(--muted, #5c665a);
    margin: 0;
  }

  .value {
    font-family: Oswald, sans-serif;
    font-size: 0.95rem;
    font-weight: 800;
    color: var(--pine, #4a5a44);
    text-transform: none;
    letter-spacing: 0;
    white-space: nowrap;
  }

  .input {
    width: 100%;
    padding: 0.65rem 0.75rem;
    border-radius: 10px;
    border: 1px solid var(--border, #e6e1d4);
    background: #fff;
    font-size: 1rem;
    color: var(--fg, #333);
  }

  .input:focus {
    outline: 3px solid rgba(240, 224, 0, 0.55);
    outline-offset: 2px;
  }

  .range {
    width: 100%;
    height: 10px;
    accent-color: var(--alpine, #7b9e6b);
  }

  .range-labels {
    display: flex;
    justify-content: space-between;
    font-size: 0.75rem;
    color: var(--muted, #5c665a);
  }

  .done {
    margin-top: 1rem;
    width: 100%;
    border: none;
    border-radius: 12px;
    padding: 0.75rem 1rem;
    font-family: Oswald, sans-serif;
    font-weight: 800;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    background: var(--pine, #4a5a44);
    color: #fff;
    cursor: pointer;
  }

  .done:hover {
    background: #3d4a38;
  }

  @media (max-width: 720px) {
    .settings-grid {
      grid-template-columns: 1fr;
      gap: 0.9rem;
    }
  }
</style>

